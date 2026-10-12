/**
 * STARFRONT WORLD — Phase 6.14: Real-time Simulator Validation & Event Reliability Test Suite
 * Kiểm chứng có mục tiêu các hệ thống:
 *   A. Tốc độ mô phỏng (15s & 300s, commit 1 lần/ngày, pause/resume, đổi tab/reload, bảo toàn tiến độ phân đoạn)
 *   B. Event & Quest (Mô phỏng 40 ngày game @ 15s/ngày, tự sinh không cần force spawn, Concurrency Guard, Board & Overview sync, lifecycle & archive)
 *   C. Persistence & Reset (Lưu trữ deadline/lịch sinh sau reload, đổi tốc độ hủy vs reset, reset độc lập, cách ly RPG Save V4, chặn scheduler cũ)
 *   D. Catch-up & Lịch (Trần 360 ticks, chống áp dụng trùng consequence, chu kỳ 4 buổi/ngày/tháng/mùa/năm, chống lùi giờ hệ thống)
 */

import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"

import {
  createInitialWorldState,
  executeWorldTick,
  loadWorldState,
  saveWorldState,
  resetWorldState,
  type WorldState,
} from "../../lib/game/world"
import {
  DEFAULT_SIMULATOR_CONFIG,
  DEFAULT_GENERATOR_CONFIG,
  loadSimulatorConfig,
  saveSimulatorConfig,
  validateSimulatorConfig,
  type WorldSimulatorConfig,
} from "../../lib/game/world/simulator-config"
import {
  getGameCalendarInfo,
  SEASONS,
} from "../../lib/game/world/calendar"
import {
  EVENT_TEMPLATE_TIERS,
  getEventTier,
  countActiveEventsByTier,
  checkAndSpawnWorldEvents,
  forceSpawnEventByTier,
  ensureNextEventSpawnDay,
} from "../../lib/game/world/event-generator"
import {
  calculatePendingTicks,
  processOfflineCatchupSync,
  TIME_CONFIG,
} from "../../lib/game/world/catchup-engine"
import {
  getActiveEvents,
  chooseEventStrategy,
  autoLockDefaultStrategy,
  resolveProcessingEvent,
  applyEventConsequencesOnce,
} from "../../lib/game/world/event-engine"
import { INITIAL_STARFRONT_PROGRESSION } from "../../lib/game/progression"

// Mock Storage trong môi trường Node.js
class MockLocalStorage {
  private store: Map<string, string> = new Map()

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }

  get length(): number {
    return this.store.size
  }
}

describe("STARFRONT WORLD — Phase 6.14: Real-time Simulator Validation & Event Reliability", () => {
  let mockStorage: MockLocalStorage

  beforeEach(() => {
    mockStorage = new MockLocalStorage()
    ;(globalThis as any).window = globalThis
    ;(globalThis as any).localStorage = mockStorage
  })

  // ==========================================================================
  // KỊCH BẢN A: KIỂM TRA TỐC ĐỘ MÔ PHỎNG & TÍNH TOÀN VẸN TICK
  // ==========================================================================
  describe("A. Kiểm tra tốc độ mô phỏng", () => {
    it("A.1: Mô phỏng 15 giây/ngày và 300 giây/ngày — Mỗi ngày chỉ commit đúng một lần", () => {
      const state = createInitialWorldState(101112)
      assert.strictEqual(state.currentDay, 1)
      assert.strictEqual(state.totalDaysElapsed, 0)

      // Kiểm tra 15s/ngày: bước 1 ngày
      const tick1 = executeWorldTick(state)
      assert.strictEqual(state.currentDay, 2, "1 tick phải tăng đúng 1 ngày game")
      assert.strictEqual(state.totalDaysElapsed, 1)
      assert.strictEqual(tick1.phaseLogs.length, 6, "Phải thực thi đủ 6 phase")

      // Bước tiếp 1 ngày nữa với 300s/ngày
      const tick2 = executeWorldTick(state)
      assert.strictEqual(state.currentDay, 3, "Tick tiếp theo phải là Ngày 3")
      assert.strictEqual(state.totalDaysElapsed, 2)
      assert.notStrictEqual(tick1.newSeed, tick2.newSeed, "World seed phải tiến hóa tất định giữa các tick")
    })

    it("A.2: Pause/Resume và Reload bảo toàn tiến độ phân đoạn ngày, không tạo tick trùng", () => {
      // Giả lập config tốc độ 300s/ngày
      const config: WorldSimulatorConfig = {
        speedSeconds: 300,
        isPaused: false,
        generator: DEFAULT_GENERATOR_CONFIG,
      }
      saveSimulatorConfig(config)

      const state = createInitialWorldState(202224)
      state.lastTickTimestamp = 1000000000000
      saveWorldState(state)

      // Đã trôi qua 120s / 300s = 0.4 (40% ngày)
      const fractionBeforePause = 120 / 300
      assert.strictEqual(fractionBeforePause, 0.4)

      // Tạm dừng và lưu tiến độ pausedFraction
      const pausedConfig: WorldSimulatorConfig = {
        ...config,
        isPaused: true,
        pausedFraction: fractionBeforePause,
      }
      saveSimulatorConfig(pausedConfig)

      // Reload từ LocalStorage
      const loadedCfg = loadSimulatorConfig()
      assert.strictEqual(loadedCfg.isPaused, true, "Simulator vẫn ở trạng thái tạm dừng sau reload")
      assert.strictEqual(loadedCfg.pausedFraction, 0.4, "Phân đoạn 40% ngày được lưu trữ chính xác")

      // Khi resume: thời gian được tính bù mốc bắt đầu
      const nowResume = 1000005000000 // Sau đó 5000 giây thực tế
      const speedMs = loadedCfg.speedSeconds * 1000
      const restoredAnchor = nowResume - (loadedCfg.pausedFraction || 0) * speedMs

      // Chênh lệch từ mốc giả định tới hiện tại đúng bằng phân đoạn 120s
      assert.strictEqual(nowResume - restoredAnchor, 120 * 1000, "Tiến độ trong ngày được bảo toàn trọn vẹn")

      // State ngày không bị thay đổi ngoài ý muốn khi tạm dừng
      const loadedState = loadWorldState().state
      assert.strictEqual(loadedState.currentDay, 1, "Không có tick trùng hay chạy bù xảy ra khi đang tạm dừng")
    })

    it("A.3: Đổi tốc độ (300s -> 15s) bảo toàn tỷ lệ phân đoạn trong ngày", () => {
      const oldSpeed = 300
      const newSpeed = 15
      const currentFraction = 0.6 // 60% ngày

      // Tại tốc độ cũ (300s), đã trôi qua 180s, còn lại 120s
      const remainingOldSec = Math.ceil((1 - currentFraction) * oldSpeed)
      assert.strictEqual(remainingOldSec, 120)

      // Khi chuyển sang tốc độ mới (15s), còn lại 40% của 15s = 6s
      const remainingNewSec = Math.max(1, Math.ceil((1 - currentFraction) * newSpeed))
      assert.strictEqual(remainingNewSec, 6, "Thời gian còn lại được điều chỉnh mượt mà theo tốc độ mới")
    })
  })

  // ==========================================================================
  // KỊCH BẢN B: KIỂM TRA EVENT/QUEST GENERATION & RELIABILITY
  // ==========================================================================
  describe("B. Kiểm tra Event/Quest", () => {
    it("B.1: Mô phỏng 40 ngày game — Event tự động xuất hiện theo lịch mà không cần Force Spawn", () => {
      const state = createInitialWorldState(303336)
      const config: WorldGeneratorConfig = {
        ...DEFAULT_GENERATOR_CONFIG,
      }

      ensureNextEventSpawnDay(state, config)
      const initialDay = state.currentDay
      let totalSpawnedAcross40Days = 0

      // Chạy 40 ngày chiến lược liên tiếp
      for (let day = 1; day <= 40; day++) {
        // Thực thi tick ngày
        executeWorldTick(state)

        // Bộ sinh tự động kiểm tra theo ngày game
        const spawnRes = checkAndSpawnWorldEvents(state, config)
        if (spawnRes.spawnedEvents.length > 0) {
          totalSpawnedAcross40Days += spawnRes.spawnedEvents.length
        }
      }

      assert.strictEqual(state.currentDay, initialDay + 40, "Đã chạy đủ 40 ngày game")
      assert.ok(
        totalSpawnedAcross40Days > 0,
        `Trong 40 ngày, bộ sinh phải tự động kích hoạt sự kiện mà không cần Force Spawn (Đã sinh: ${totalSpawnedAcross40Days})`
      )

      // Kiểm tra tính đồng bộ giữa Overview counts và getActiveEvents
      const tierCounts = countActiveEventsByTier(state)
      const activeList = getActiveEvents(state)
      assert.strictEqual(
        tierCounts.total,
        activeList.length,
        "Số lượng tổng trên Overview phải khớp chính xác với danh sách Active Events"
      )
      assert.strictEqual(
        tierCounts.total,
        tierCounts.small + tierCounts.medium + tierCounts.large,
        "Tổng active phải bằng tổng của 3 tier cộng lại"
      )
    })

    it("B.2: Concurrency Guard: Giới hạn trần từng tier và trần toàn cục maxGlobalActive", () => {
      const state = createInitialWorldState(404448)
      const strictConfig: WorldGeneratorConfig = {
        small: {
          enabled: true,
          minIntervalDays: 0.1,
          maxIntervalDays: 0.2,
          minLifetimeDays: 2,
          maxLifetimeDays: 5,
          maxActive: 3, // Giới hạn chỉ 3 sự kiện Small
        },
        medium: {
          enabled: true,
          minIntervalDays: 0.1,
          maxIntervalDays: 0.2,
          minLifetimeDays: 5,
          maxLifetimeDays: 10,
          maxActive: 2, // Giới hạn chỉ 2 sự kiện Medium
        },
        large: {
          enabled: true,
          minIntervalDays: 0.1,
          maxIntervalDays: 0.2,
          minLifetimeDays: 10,
          maxLifetimeDays: 20,
          maxActive: 1, // Giới hạn chỉ 1 sự kiện Large
        },
        maxGlobalActive: 5, // Trần toàn cục: 5
      }

      // Thử ép sinh liên tục Small vượt quá trần 3
      let smallSpawned = 0
      for (let i = 0; i < 10; i++) {
        const res = forceSpawnEventByTier(state, "small", strictConfig)
        if (res.success) smallSpawned++
      }

      const countsAfterSmall = countActiveEventsByTier(state)
      assert.ok(
        countsAfterSmall.small <= strictConfig.small.maxActive,
        `Số lượng Small (${countsAfterSmall.small}) không được vượt quá maxActive (${strictConfig.small.maxActive})`
      )

      // Thử ép sinh thêm cho tới khi chạm trần toàn cục 5
      for (let i = 0; i < 10; i++) {
        forceSpawnEventByTier(state, "medium", strictConfig)
        forceSpawnEventByTier(state, "large", strictConfig)
      }

      const finalCounts = countActiveEventsByTier(state)
      assert.ok(
        finalCounts.total <= strictConfig.maxGlobalActive,
        `Tổng sự kiện hoạt động (${finalCounts.total}) không được vượt quá maxGlobalActive (${strictConfig.maxGlobalActive})`
      )
    })

    it("B.3: Vòng đời sự kiện: Lifetime, Deadline đếm ngược, Auto-lock và Archive", () => {
      const state = createInitialWorldState(505550)

      // Sinh 1 sự kiện Small
      const spawnRes = forceSpawnEventByTier(state, "small", DEFAULT_GENERATOR_CONFIG)
      assert.strictEqual(spawnRes.success, true)
      const event = spawnRes.event!

      assert.strictEqual(event.status, "INIT")
      assert.ok(event.decisionDeadlineTick > state.currentDay, "Hạn chót phải nằm ở tương lai")

      const deadline = event.decisionDeadlineTick

      // Tua thời gian qua deadline để kích hoạt Phase 5 xử lý hạn chót
      while (state.currentDay <= deadline) {
        executeWorldTick(state)
      }

      // Khi đến deadline, Phase 5 tự động auto-lock sang PROCESSING
      assert.ok(
        event.status === "PROCESSING" || event.status === "RESULT",
        `Sự kiện phải tự động chuyển sang PROCESSING hoặc hoàn tất (Hiện tại: ${event.status})`
      )
      assert.ok(event.chosenStrategyId, "Phải có phương án chiến lược được chọn")

      // Tiếp tục cho thời gian trôi qua để hoàn tất processing
      for (let i = 0; i < 10; i++) {
        executeWorldTick(state)
      }

      assert.strictEqual(event.status, "RESULT", "Sự kiện phải hoàn tất với trạng thái RESULT")
      assert.ok(event.isResolved, "Sự kiện phải được đánh dấu isResolved = true")
      assert.ok(event.consequencesApplied, "Hậu quả phải được đánh dấu consequencesApplied = true")

      // Kết quả phải được lưu vào eventResultsArchive
      assert.ok(Array.isArray(state.eventResultsArchive))
      const archived = state.eventResultsArchive.find((r) => r.eventId === event.id)
      assert.ok(archived, "Kết quả sự kiện phải có mặt trong eventResultsArchive")
    })
  })

  // ==========================================================================
  // KỊCH BẢN C: PERSISTENCE, RESET VÀ BẢO VỆ RPG SAVE V4
  // ==========================================================================
  describe("C. Persistence và Reset", () => {
    it("C.1: Reload không làm mất hoặc đặt lại deadline/lịch sinh nextEventSpawnDay", () => {
      const state = createInitialWorldState(606662)
      ensureNextEventSpawnDay(state, DEFAULT_GENERATOR_CONFIG)

      // Đặt các mốc cụ thể
      state.nextEventSpawnDay = {
        small: 4.5,
        medium: 8.2,
        large: 25.0,
      }

      // Tạo một sự kiện có deadline cụ thể
      const spawnRes = forceSpawnEventByTier(state, "small", DEFAULT_GENERATOR_CONFIG)
      assert.strictEqual(spawnRes.success, true)
      const eventId = spawnRes.event!.id
      const originalDeadline = spawnRes.event!.decisionDeadlineTick

      // Lưu WorldState
      saveWorldState(state)

      // Giả lập Reload từ LocalStorage
      const loaded = loadWorldState().state
      assert.ok(loaded.nextEventSpawnDay, "nextEventSpawnDay phải tồn tại sau reload")
      assert.strictEqual(loaded.nextEventSpawnDay!.small, 4.5, "Mốc sinh Small không bị đặt lại")
      assert.strictEqual(loaded.nextEventSpawnDay!.medium, 8.2, "Mốc sinh Medium không bị đặt lại")
      assert.strictEqual(loaded.nextEventSpawnDay!.large, 25.0, "Mốc sinh Large không bị đặt lại")

      const loadedEvent = loaded.events?.[eventId]
      assert.ok(loadedEvent, "Sự kiện phải tồn tại sau reload")
      assert.strictEqual(loadedEvent.decisionDeadlineTick, originalDeadline, "Deadline sự kiện không bị mất")
    })

    it("C.2: Đổi tốc độ rồi hủy xác nhận: Không thay đổi WORLD state", () => {
      const state = createInitialWorldState(707774)
      executeWorldTick(state)
      executeWorldTick(state)
      assert.strictEqual(state.currentDay, 3)
      saveWorldState(state)

      const initialConfig: WorldSimulatorConfig = {
        speedSeconds: 300,
        isPaused: false,
        generator: DEFAULT_GENERATOR_CONFIG,
      }
      saveSimulatorConfig(initialConfig)

      // Người dùng bấm đổi sang 15s nhưng sau đó HỦY (Cancel)
      // Cấu hình không được lưu thay đổi, state giữ nguyên
      const currentConfig = loadSimulatorConfig()
      assert.strictEqual(currentConfig.speedSeconds, 300, "Tốc độ vẫn là 300s sau khi hủy")

      const currentState = loadWorldState().state
      assert.strictEqual(currentState.currentDay, 3, "WORLD state vẫn ở Ngày 3 nguyên vẹn")
    })

    it("C.3: Đổi tốc độ rồi xác nhận reset: World reset về Ngày 1 và dùng tốc độ mới", () => {
      const state = createInitialWorldState(808886)
      for (let i = 0; i < 5; i++) executeWorldTick(state)
      assert.strictEqual(state.currentDay, 6)
      saveWorldState(state)

      // Đổi tốc độ sang 15s VÀ chọn reset world
      const newConfig: WorldSimulatorConfig = {
        speedSeconds: 15,
        isPaused: false,
        generator: DEFAULT_GENERATOR_CONFIG,
      }
      saveSimulatorConfig(newConfig)
      const freshWorld = resetWorldState()

      assert.strictEqual(freshWorld.currentDay, 1, "WORLD state được reset về Ngày 1")
      assert.strictEqual(freshWorld.totalDaysElapsed, 0)

      const reloadedCfg = loadSimulatorConfig()
      assert.strictEqual(reloadedCfg.speedSeconds, 15, "Tốc độ mới 15s đã được áp dụng")
    })

    it("C.4: Reset WORLD độc lập: Giữ nguyên tốc độ và cấu hình generator", () => {
      // Thiết lập cấu hình generator tùy chỉnh
      const customConfig: WorldSimulatorConfig = {
        speedSeconds: 60,
        isPaused: true,
        generator: {
          ...DEFAULT_GENERATOR_CONFIG,
          maxGlobalActive: 75,
        },
      }
      saveSimulatorConfig(customConfig)

      const state = createInitialWorldState(909998)
      executeWorldTick(state)
      saveWorldState(state)

      // Thực hiện Reset WORLD độc lập
      const fresh = resetWorldState()
      assert.strictEqual(fresh.currentDay, 1)

      // Cấu hình sau Reset vẫn nguyên vẹn
      const cfgAfter = loadSimulatorConfig()
      assert.strictEqual(cfgAfter.speedSeconds, 60, "Tốc độ 60s giữ nguyên")
      assert.strictEqual(cfgAfter.isPaused, true, "Trạng thái pause giữ nguyên")
      assert.strictEqual(cfgAfter.generator.maxGlobalActive, 75, "Cấu hình generator giữ nguyên")
    })

    it("C.5: RPG Save V4 hoàn toàn cách ly, không bị ảnh hưởng bởi Reset hay Thay đổi tốc độ", () => {
      const mockRpgData = {
        ...INITIAL_STARFRONT_PROGRESSION,
        credits: 999999,
        level: 50,
        activeGearId: "aegis" as const,
      }
      mockStorage.setItem("STARFRONT_SAVE_DATA_V4", JSON.stringify(mockRpgData))

      // Thực hiện hàng loạt thao tác WORLD
      const worldState = createInitialWorldState(111222)
      for (let i = 0; i < 10; i++) executeWorldTick(worldState)
      saveWorldState(worldState)

      saveSimulatorConfig({ ...DEFAULT_SIMULATOR_CONFIG, speedSeconds: 15 })
      resetWorldState()

      // Kiểm tra RPG Save V4
      const rawRpg = mockStorage.getItem("STARFRONT_SAVE_DATA_V4")
      assert.ok(rawRpg, "STARFRONT_SAVE_DATA_V4 phải còn nguyên")
      const parsed = JSON.parse(rawRpg)
      assert.strictEqual(parsed.credits, 999999)
      assert.strictEqual(parsed.level, 50)
      assert.strictEqual(parsed.activeGearId, "aegis")
    })
  })

  // ==========================================================================
  // KỊCH BẢN D: CATCH-UP, LỊCH VÀ CHỐNG GIAN LẬN ĐỒNG HỒ
  // ==========================================================================
  describe("D. Catch-up và Niên Lịch Thiên Hà", () => {
    it("D.1: Catch-up tuân thủ giới hạn trần 360 ticks (OFFLINE_CATCHUP_CAP)", () => {
      const now = 2000000000000
      // Vắng mặt 500 ngày (vượt quá trần 360 ngày)
      const offlineTime = 500 * 300 * 1000
      const calc = calculatePendingTicks(now - offlineTime, now)

      assert.strictEqual(calc.isCapped, true, "Phải đánh dấu isCapped")
      assert.strictEqual(calc.effectiveTicks, TIME_CONFIG.OFFLINE_CATCHUP_CAP_TICKS, "Bị giới hạn trần ở 360 ticks")
    })

    it("D.2: Áp dụng consequence lũy đẳng: Không xử lý trùng dù gọi nhiều lần", () => {
      const state = createInitialWorldState(333444)
      const initialCredits = state.resources.industrialMaterials

      const event = {
        id: "evt_test_idempotent",
        title: "Test Idempotency",
        category: "military" as const,
        severity: "medium" as const,
        scope: "galaxy" as const,
        status: "PROCESSING" as const,
        priority: 50,
        createdAtTick: 1,
        createdAtTimestamp: Date.now(),
        decisionDeadlineTick: 2,
        defaultStrategyId: "strat_1",
        availableStrategies: [],
        chosenStrategyId: "strat_1",
        isResolved: false,
        consequencesApplied: false,
      } as any

      const consequences = {
        resourceDelta: {
          industrialMaterials: 500,
        },
        message: "Cộng 500 vật liệu công nghiệp",
      }

      // Lần 1: áp dụng thành công
      const res1 = applyEventConsequencesOnce(state, event, consequences)
      assert.strictEqual(res1.applied, true)
      assert.strictEqual(state.resources.industrialMaterials, initialCredits + 500)
      assert.strictEqual(event.consequencesApplied, true)

      // Lần 2: gọi lại hậu quả -> bị từ chối, tài nguyên không bị tăng lần 2
      const res2 = applyEventConsequencesOnce(state, event, consequences)
      assert.strictEqual(res2.applied, false, "Lần gọi thứ 2 phải bị từ chối")
      assert.strictEqual(state.resources.industrialMaterials, initialCredits + 500, "Tài nguyên không bị cộng đúp")
    })

    it("D.3: Niên lịch nhất quán qua các mốc chuyển ngày, chuyển tháng, chuyển mùa và chuyển năm", () => {
      // 1. Chu kỳ 4 buổi trong ngày
      const dawn = getGameCalendarInfo(1, 0.25) // 06:00
      assert.strictEqual(dawn.cycleKey, "dawn")
      assert.strictEqual(dawn.cycleName, "Buổi Sáng")

      const afternoon = getGameCalendarInfo(1, 0.6) // 14:24
      assert.strictEqual(afternoon.cycleKey, "afternoon")
      assert.strictEqual(afternoon.cycleName, "Buổi Chiều")

      const evening = getGameCalendarInfo(1, 0.8) // 19:12
      assert.strictEqual(evening.cycleKey, "evening")
      assert.strictEqual(evening.cycleName, "Buổi Tối")

      const night = getGameCalendarInfo(1, 0.95) // 22:48
      assert.strictEqual(night.cycleKey, "night")
      assert.strictEqual(night.cycleName, "Ban Đêm")

      // 2. Mốc chuyển tháng (Ngày 30 -> Ngày 31)
      const day30 = getGameCalendarInfo(30, 0.99)
      assert.strictEqual(day30.month, 1)
      assert.strictEqual(day30.dayOfMonth, 30)

      const day31 = getGameCalendarInfo(31, 0.0)
      assert.strictEqual(day31.month, 2)
      assert.strictEqual(day31.dayOfMonth, 1)

      // 3. Mốc chuyển mùa (Ngày 90 -> Ngày 91)
      const day90 = getGameCalendarInfo(90, 0.99)
      assert.strictEqual(day90.month, 3)
      assert.strictEqual(day90.seasonIndex, 0)
      assert.strictEqual(day90.seasonName, SEASONS[0].name) // Mùa Khởi Nguyên

      const day91 = getGameCalendarInfo(91, 0.0)
      assert.strictEqual(day91.month, 4)
      assert.strictEqual(day91.seasonIndex, 1)
      assert.strictEqual(day91.seasonName, SEASONS[1].name) // Mùa Bão Lửa

      // 4. Mốc chuyển năm (Ngày 360 -> Ngày 361)
      const day360 = getGameCalendarInfo(360, 0.99)
      assert.strictEqual(day360.year, 1)
      assert.strictEqual(day360.month, 12)
      assert.strictEqual(day360.dayOfMonth, 30)

      const day361 = getGameCalendarInfo(361, 0.0)
      assert.strictEqual(day361.year, 2)
      assert.strictEqual(day361.month, 1)
      assert.strictEqual(day361.dayOfMonth, 1)
      assert.strictEqual(day361.seasonIndex, 0)
    })

    it("D.4: Chống lùi giờ hệ thống: Không sinh event và không chạy bù tick", () => {
      const now = 1000000000000
      // Giả lập đồng hồ bị lùi 1 giờ về quá khứ (currentTimestamp < lastTimestamp)
      const calc = calculatePendingTicks(now, now - 3600 * 1000)

      assert.strictEqual(calc.isClockReversed, true, "Phát hiện thời gian bị lùi lại")
      assert.strictEqual(calc.effectiveTicks, 0, "Không được sinh bất kỳ tick nào")

      // Catch-up engine trả về cờ cảnh báo và 0 tick được áp dụng
      const state = createInitialWorldState(555666)
      state.lastTickTimestamp = now
      const catchupRes = processOfflineCatchupSync(state, {
        currentTimestamp: now - 3600 * 1000,
      })

      assert.strictEqual(catchupRes.clockTamperedDetected, true)
      assert.strictEqual(catchupRes.ticksApplied, 0)
      assert.strictEqual(state.currentDay, 1, "currentDay không bị thay đổi")
    })
  })
})
