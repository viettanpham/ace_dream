/**
 * STARFRONT WORLD — Phase 6.13: Real-time WORLD Simulator, Event Generator & ADMIN CP Test Suite
 * Kiểm thử toàn diện động cơ thời gian thực, niên lịch 4 buổi, bộ sinh sự kiện 3 tier và ADMIN CP:
 *   1. Cấu hình Simulator, validation và lưu trữ bền vững (Local Storage Persistence)
 *   2. Niên lịch thiên hà, chu kỳ 4 buổi (Sáng/Chiều/Tối/Đêm), tháng/mùa/năm xác định
 *   3. Phân loại 3 Tier sự kiện & bộ sinh Event/Quest theo ngày game (Game Days)
 *   4. Động cơ mô phỏng, commit đúng 1 lần/ngày và bounded catch-up (trần 360 ticks)
 *   5. ADMIN CP: Thay đổi tốc độ bảo toàn WorldState, Force Spawn Event, và Reset World an toàn
 *   6. Zero-regression: Phân hệ RPG Save V4 hoàn toàn cách ly và không bị ảnh hưởng
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
} from "../../lib/game/world/event-generator"
import {
  calculatePendingTicks,
  TIME_CONFIG,
} from "../../lib/game/world/catchup-engine"
import { EVENT_TEMPLATES } from "../../lib/game/world/event-templates"
import { getActiveEvents } from "../../lib/game/world/event-engine"
import { INITIAL_STARFRONT_PROGRESSION } from "../../lib/game/progression"

// Giả lập LocalStorage trong môi trường kiểm thử Node.js
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

describe("STARFRONT WORLD — Phase 6.13: Real-time Simulator, Event Generator & ADMIN CP", () => {
  let mockStorage: MockLocalStorage

  beforeEach(() => {
    mockStorage = new MockLocalStorage()
    ;(globalThis as any).window = globalThis
    ;(globalThis as any).localStorage = mockStorage
  })

  // --------------------------------------------------------------------------
  // TEST 1: Cấu hình Simulator & Lưu Trữ Bền Vững
  // --------------------------------------------------------------------------
  it("1. Cấu hình Simulator: Giá trị mặc định, validation và lưu trữ bền vững", () => {
    // 1.1 Giá trị mặc định
    assert.strictEqual(DEFAULT_SIMULATOR_CONFIG.speedSeconds, 300, "Mặc định 1 ngày = 300 giây thực (5 phút)")
    assert.strictEqual(DEFAULT_SIMULATOR_CONFIG.isPaused, false, "Mặc định không tạm dừng")
    assert.strictEqual(DEFAULT_SIMULATOR_CONFIG.generator.maxGlobalActive, 100, "Mặc định max global active = 100")

    // 1.2 Validation hợp lệ với các preset
    const preset15 = validateSimulatorConfig({ ...DEFAULT_SIMULATOR_CONFIG, speedSeconds: 15 })
    assert.strictEqual(preset15.valid, true, "15s (fast test) là hợp lệ")

    const preset60 = validateSimulatorConfig({ ...DEFAULT_SIMULATOR_CONFIG, speedSeconds: 60 })
    assert.strictEqual(preset60.valid, true, "60s là hợp lệ")

    const preset300 = validateSimulatorConfig({ ...DEFAULT_SIMULATOR_CONFIG, speedSeconds: 300 })
    assert.strictEqual(preset300.valid, true, "300s là hợp lệ")

    // 1.3 Validation từ chối các giá trị không hợp lệ
    const invalidZero = validateSimulatorConfig({ ...DEFAULT_SIMULATOR_CONFIG, speedSeconds: 0 })
    assert.strictEqual(invalidZero.valid, false, "0s phải bị từ chối")

    const invalidNegative = validateSimulatorConfig({ ...DEFAULT_SIMULATOR_CONFIG, speedSeconds: -30 })
    assert.strictEqual(invalidNegative.valid, false, "Số âm phải bị từ chối")

    const invalidMax = validateSimulatorConfig({ ...DEFAULT_SIMULATOR_CONFIG, speedSeconds: 100000 })
    assert.strictEqual(invalidMax.valid, false, "> 86400s phải bị từ chối")

    // 1.4 Lưu và nạp từ storage
    const customConfig: WorldSimulatorConfig = {
      speedSeconds: 15,
      isPaused: true,
      generator: {
        ...DEFAULT_GENERATOR_CONFIG,
        maxGlobalActive: 50,
      },
    }
    const saveRes = saveSimulatorConfig(customConfig)
    assert.strictEqual(saveRes.success, true, "Lưu cấu hình thành công")

    const loaded = loadSimulatorConfig()
    assert.strictEqual(loaded.speedSeconds, 15, "Phục hồi đúng speedSeconds 15s")
    assert.strictEqual(loaded.isPaused, true, "Phục hồi đúng trạng thái isPaused")
    assert.strictEqual(loaded.generator.maxGlobalActive, 50, "Phục hồi đúng maxGlobalActive 50")
  })

  // --------------------------------------------------------------------------
  // TEST 2: Niên Lịch Thiên Hà & Chu Kỳ Nhật Dạ Trong Ngày
  // --------------------------------------------------------------------------
  it("2. Niên Lịch Thiên Hà: Chu kỳ 4 buổi (Sáng/Chiều/Tối/Đêm), tháng/mùa/năm xác định", () => {
    // 2.1 Chu kỳ thời gian trong ngày
    // Ban Đêm (00:00 - 04:59)
    const midnight = getGameCalendarInfo(1, 0.0)
    assert.strictEqual(midnight.timeString, "00:00")
    assert.strictEqual(midnight.cycleKey, "night")
    assert.strictEqual(midnight.cycleName, "Ban Đêm")

    // Buổi Sáng (05:00 - 11:59)
    const morning = getGameCalendarInfo(1, 0.35) // ~ 08:24
    assert.strictEqual(morning.cycleKey, "dawn")
    assert.strictEqual(morning.cycleName, "Buổi Sáng")

    // Buổi Chiều (12:00 - 17:59)
    const afternoon = getGameCalendarInfo(1, 0.55) // ~ 13:12
    assert.strictEqual(afternoon.cycleKey, "afternoon")
    assert.strictEqual(afternoon.cycleName, "Buổi Chiều")

    // Buổi Tối (18:00 - 21:59)
    const evening = getGameCalendarInfo(1, 0.85) // ~ 20:24
    assert.strictEqual(evening.cycleKey, "evening")
    assert.strictEqual(evening.cycleName, "Buổi Tối")

    // 2.2 Niên lịch Ngày / Tháng / Mùa / Năm
    // Ngày 1: Tháng 1, Mùa Khởi Nguyên, Năm 1
    const day1 = getGameCalendarInfo(1, 0)
    assert.strictEqual(day1.year, 1)
    assert.strictEqual(day1.month, 1)
    assert.strictEqual(day1.dayOfMonth, 1)
    assert.strictEqual(day1.seasonName, SEASONS[0].name)

    // Ngày 95: Tháng 4 (95 = 30*3 + 5), Mùa Bão Lửa, Năm 1
    const day95 = getGameCalendarInfo(95, 0)
    assert.strictEqual(day95.year, 1)
    assert.strictEqual(day95.month, 4)
    assert.strictEqual(day95.dayOfMonth, 5)
    assert.strictEqual(day95.seasonName, SEASONS[1].name)

    // Ngày 361: Năm 2, Tháng 1, Ngày 1
    const day361 = getGameCalendarInfo(361, 0)
    assert.strictEqual(day361.year, 2)
    assert.strictEqual(day361.month, 1)
    assert.strictEqual(day361.dayOfMonth, 1)
  })

  // --------------------------------------------------------------------------
  // TEST 3: Phân Loại 3 Tier & Bộ Sinh Event/Quest Theo Ngày Game
  // --------------------------------------------------------------------------
  it("3. Phân loại 3 Tier & Bộ sinh Event theo Ngày Game: Không dùng giây thực", () => {
    const state = createInitialWorldState(456789)

    // 3.1 Tất cả templates trong EVENT_TEMPLATES phải có trong EVENT_TEMPLATE_TIERS
    const templateIds = Object.keys(EVENT_TEMPLATES)
    assert.ok(templateIds.length >= 20, "Có ít nhất 20 templates sự kiện")

    for (const tplId of templateIds) {
      const tier = getEventTier(tplId)
      assert.ok(
        tier === "small" || tier === "medium" || tier === "large",
        `Template ${tplId} phải thuộc một trong 3 tier hợp lệ`
      )
    }

    // 3.2 Đếm số lượng active theo tier ban đầu
    const initialCounts = countActiveEventsByTier(state)
    assert.ok(initialCounts.total >= 0)
    assert.strictEqual(
      initialCounts.total,
      initialCounts.small + initialCounts.medium + initialCounts.large
    )

    // 3.3 Sinh sự kiện qua checkAndSpawnWorldEvents
    const spawnRes = checkAndSpawnWorldEvents(state, DEFAULT_GENERATOR_CONFIG)
    assert.ok(Array.isArray(spawnRes.spawnedEvents))
    assert.ok(Array.isArray(spawnRes.logs))

    // 3.4 Kích hoạt thủ công qua forceSpawnEventByTier cho cả 3 tier
    const forceSmall = forceSpawnEventByTier(state, "small", DEFAULT_GENERATOR_CONFIG)
    assert.strictEqual(forceSmall.success, true, "Sinh sự kiện Small thành công")
    assert.ok(forceSmall.event, "Phải có đối tượng event được trả về")
    assert.strictEqual((forceSmall.event as any).tier, "small")

    const forceMedium = forceSpawnEventByTier(state, "medium", DEFAULT_GENERATOR_CONFIG)
    assert.strictEqual(forceMedium.success, true, "Sinh sự kiện Medium thành công")
    assert.strictEqual((forceMedium.event as any).tier, "medium")

    const forceLarge = forceSpawnEventByTier(state, "large", DEFAULT_GENERATOR_CONFIG)
    assert.strictEqual(forceLarge.success, true, "Sinh sự kiện Large thành công")
    assert.strictEqual((forceLarge.event as any).tier, "large")

    // 3.5 Kiểm tra đơn vị thời gian tồn tại là Ngày Game
    const active = getActiveEvents(state)
    for (const evt of active) {
      assert.ok(
        evt.decisionDeadlineTick >= state.currentDay,
        `Hạn chót sự kiện ${evt.id} (${evt.decisionDeadlineTick}) phải tính theo ngày game (currentDay: ${state.currentDay})`
      )
    }
  })

  // --------------------------------------------------------------------------
  // TEST 4: Động Cơ Simulator Step & Giới Hạn Catch-up Bounded
  // --------------------------------------------------------------------------
  it("4. Động cơ Simulator Step & Bounded Catch-up: Giới hạn 360 ticks và chống lùi giờ", () => {
    const state = createInitialWorldState(789101)
    const startDay = state.currentDay

    // 4.1 executeWorldTick tiến đúng 1 ngày
    const tickRes = executeWorldTick(state)
    assert.strictEqual(state.currentDay, startDay + 1, "currentDay tăng đúng 1")
    assert.strictEqual(state.totalDaysElapsed, 1, "totalDaysElapsed tăng đúng 1")
    assert.strictEqual(tickRes.phaseLogs.length, 6, "Chạy đủ 6 phase tất định")

    // 4.2 Bounded Catch-up: Tính toán số tick cần bù
    const now = 1000000000000
    // Vắng mặt 1500 giây = 5 ngày (300s/ngày)
    const calc5 = calculatePendingTicks(now - 1500 * 1000, now)
    assert.strictEqual(calc5.effectiveTicks, 5, "Bắt kịp 5 ticks cho 1500 giây vắng mặt")
    assert.strictEqual(calc5.isCapped, false, "Không bị capped")
    assert.strictEqual(calc5.isClockReversed, false, "Đồng hồ bình thường")

    // Vắng mặt 400 ngày (> 360 ticks)
    const calc400 = calculatePendingTicks(now - 400 * 300 * 1000, now)
    assert.strictEqual(calc400.effectiveTicks, TIME_CONFIG.OFFLINE_CATCHUP_CAP_TICKS, "Bị chặn trần ở 360 ticks")
    assert.strictEqual(calc400.isCapped, true, "Phải đánh dấu isCapped")

    // Lùi giờ hệ thống
    const calcReversed = calculatePendingTicks(now + 50000, now)
    assert.strictEqual(calcReversed.isClockReversed, true, "Phát hiện thời gian bị lùi lại")
    assert.strictEqual(calcReversed.effectiveTicks, 0, "Không thực hiện bù tick nào khi lùi giờ")
  })

  // --------------------------------------------------------------------------
  // TEST 5: ADMIN CP — Đổi Tốc Độ Bảo Toàn Dữ Liệu & Reset World An Toàn
  // --------------------------------------------------------------------------
  it("5. ADMIN CP: Thay đổi tốc độ bảo toàn WorldState, và Reset World an toàn về Ngày 1", () => {
    const state = createInitialWorldState(999888)

    // Tiến hành mô phỏng 3 ngày
    executeWorldTick(state)
    executeWorldTick(state)
    executeWorldTick(state)
    assert.strictEqual(state.currentDay, 4, "Sau 3 tick là Ngày 4")

    // Lưu state
    saveWorldState(state)

    // 5.1 Thay đổi tốc độ simulator từ 300s -> 15s (fast test mode)
    const updatedCfg: WorldSimulatorConfig = {
      ...DEFAULT_SIMULATOR_CONFIG,
      speedSeconds: 15,
    }
    saveSimulatorConfig(updatedCfg)

    // Nạp lại WorldState: dữ liệu thế giới không bị xóa hay thay đổi
    const loadedWorld = loadWorldState().state
    assert.strictEqual(loadedWorld.currentDay, 4, "WorldState vẫn ở Ngày 4 nguyên vẹn sau khi đổi tốc độ")
    assert.strictEqual(Object.keys(loadedWorld.sectors).length, 8, "Vẫn đủ 8 sector")

    // 5.2 Thực hiện Reset World độc lập
    const freshState = resetWorldState()
    assert.strictEqual(freshState.currentDay, 1, "Sau Reset, currentDay trở về 1")
    assert.strictEqual(freshState.totalDaysElapsed, 0, "totalDaysElapsed trở về 0")
    assert.strictEqual(Object.keys(freshState.sectors).length, 8, "Khôi phục đầy đủ 8 sector ban đầu")

    // Tốc độ simulator đã lưu vẫn giữ nguyên 15s
    const configAfterReset = loadSimulatorConfig()
    assert.strictEqual(configAfterReset.speedSeconds, 15, "Tốc độ 15s đã cấu hình vẫn được bảo toàn sau Reset World")
  })

  // --------------------------------------------------------------------------
  // TEST 6: Zero-Regression — Phân Hệ RPG Save V4 Hoàn Toàn Cách Ly
  // --------------------------------------------------------------------------
  it("6. Zero-Regression: RPG Save V4 hoàn toàn cách ly, không bị ảnh hưởng sau các thao tác WORLD", () => {
    // 6.1 Giả lập RPG Save V4 đã có sẵn tiến trình của người chơi
    const rpgProgression = {
      ...INITIAL_STARFRONT_PROGRESSION,
      level: 15,
      credits: 50000,
      activeGearId: "falcon" as const,
    }
    mockStorage.setItem("STARFRONT_SAVE_DATA_V4", JSON.stringify(rpgProgression))

    // 6.2 Thao tác với WORLD (Lưu, Tick, Reset World, Thay đổi cấu hình)
    const worldState = createInitialWorldState(12345)
    for (let i = 0; i < 5; i++) {
      executeWorldTick(worldState)
    }
    saveWorldState(worldState)
    saveSimulatorConfig({ ...DEFAULT_SIMULATOR_CONFIG, speedSeconds: 15, isPaused: true })
    resetWorldState()

    // 6.3 Kiểm tra dữ liệu RPG Save V4
    const rawRpg = mockStorage.getItem("STARFRONT_SAVE_DATA_V4")
    assert.ok(rawRpg, "STARFRONT_SAVE_DATA_V4 vẫn tồn tại")
    const parsedRpg = JSON.parse(rawRpg)
    assert.strictEqual(parsedRpg.level, 15, "Level RPG vẫn là 15")
    assert.strictEqual(parsedRpg.credits, 50000, "Credits RPG vẫn là 50000")
    assert.strictEqual(parsedRpg.activeGearId, "falcon", "ActiveGearId RPG vẫn là falcon")
  })
})
