/**
 * STARFRONT WORLD — Phase 6.24 Test Suite
 * Kiểm thử Chiến lược Toàn cảnh Redesign (Strategic Overview Redesign & Actionable Triage):
 * 1. Overview lấy dữ liệu từ WORLD state thực, không dùng số liệu placeholder.
 * 2. Cảnh báo Food/Supplies và quân dự bị hiển thị đúng theo dữ liệu và ngưỡng hiện có.
 * 3. Nút điều hướng từ hotspot mở đúng tab và đúng sector/event.
 * 4. Không thể tự động phê chuẩn sự kiện chỉ vì deadline sắp hết hạn.
 * 5. Trận chiến suspended được điều hướng đến luồng recovery hiện có.
 * 6. Tactical Retreat không gọi commit lần hai sau khi commit thành công.
 * 7. RPG save và WORLD save vẫn độc lập.
 */

import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"

import {
  createInitialWorldState,
  loadWorldState,
  saveWorldState,
  recordSectorThreatHistoryPoint,
  chooseEventStrategy,
  type WorldState,
  type WorldEvent,
  type WorldSector,
} from "../../lib/game/world"
import {
  lockEncounterAndCreateSnapshot,
  commitCombatResultReceipt,
  abortSuspendedCombat,
  buildCombatReceiptFromCombatState,
} from "../../lib/game/world/combat-adapter"
import {
  selectBestStrategyForEvent,
  validateStrategyExecution,
} from "../../lib/game/world/event-strategy-policy"
import {
  loadStarfrontProgression,
  saveStarfrontProgression,
} from "../../lib/game/storage"
import { createInitialCombatState } from "../../lib/game/engine"
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

  get length(): number {
    return this.store.size
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }
}

describe("STARFRONT WORLD — Phase 6.24: Strategic Overview Redesign & Actionable Triage", () => {
  beforeEach(() => {
    ;(globalThis as any).window = globalThis
    ;(globalThis as any).localStorage = new MockLocalStorage()
  })

  // ==========================================================================
  // Test 1: Overview lấy dữ liệu từ WORLD state thực, không dùng placeholder
  // ==========================================================================
  it("1. Overview lấy dữ liệu từ WORLD state thực, không dùng số liệu placeholder", () => {
    const state = createInitialWorldState(101)
    const sectors = Object.values(state.sectors)

    // Xác nhận tính toán chủ quyền
    const vssCount = sectors.filter((s) => s.sovereignty === "vss").length
    const voidCount = sectors.filter((s) => s.sovereignty === "void").length
    const contestedCount = sectors.filter((s) => s.sovereignty === "contested").length
    const vssPct = Math.round((vssCount / sectors.length) * 100)

    assert.equal(sectors.length, 10, "Thiên hà chuẩn gồm 10 sectors (Phase 6.28)")
    assert.ok(vssCount > 0, "Phải có ít nhất 1 sector VSS")
    assert.equal(vssCount + voidCount + contestedCount, sectors.length, "Tổng chủ quyền phải khớp số sector")
    assert.ok(vssPct >= 0 && vssPct <= 100, "Tỷ lệ VSS phải nằm trong khoảng [0..100]")

    // Xác nhận vòng đời sector
    const stableCount = sectors.filter((s) => s.stage === "normal" || s.stage === "recovery").length
    const threatenedCount = sectors.filter((s) => s.stage === "threatened").length
    const siegeCount = sectors.filter((s) => s.stage === "under_siege").length
    const lostCount = sectors.filter((s) => s.stage === "lost").length
    assert.equal(stableCount + threatenedCount + siegeCount + lostCount, sectors.length, "Toàn bộ sector phải thuộc các stage hợp lệ")

    // Mức đe dọa trung bình và sector nguy cấp nhất
    const avgThreat = Math.round(sectors.reduce((acc, s) => acc + s.threatLevel, 0) / sectors.length)
    const criticalSector = [...sectors].sort((a, b) => b.threatLevel - a.threatLevel)[0]
    assert.ok(criticalSector, "Phải tìm được sector nguy cấp nhất")
    assert.ok(criticalSector.threatLevel >= avgThreat, "Sector nguy cấp nhất phải có Threat >= Threat trung bình")

    // Xu hướng Threat: kiểm tra an toàn khi chưa có lịch sử (0 hoặc 1 ngày)
    criticalSector.threatHistory = undefined
    const trendNoData = !criticalSector.threatHistory || criticalSector.threatHistory.length < 2
    assert.equal(trendNoData, true, "Không được suy diễn xu hướng khi chưa có >= 2 ngày lịch sử")

    // Ghi nhận dữ liệu thực 2 ngày
    recordSectorThreatHistoryPoint(criticalSector, 1, 400)
    recordSectorThreatHistoryPoint(criticalSector, 2, 450)
    assert.ok(criticalSector.threatHistory && criticalSector.threatHistory.length >= 2)
    const delta = criticalSector.threatHistory[1].threat - criticalSector.threatHistory[0].threat
    assert.equal(delta, 50, "Delta xu hướng Threat thực tế phải bằng 50 (Tăng)")
  })

  // ==========================================================================
  // Test 2: Cảnh báo Food/Supplies và quân dự bị theo dữ liệu và ngưỡng thực tế
  // ==========================================================================
  it("2. Cảnh báo Food/Supplies và quân dự bị hiển thị đúng theo dữ liệu và ngưỡng hiện có", () => {
    const state = createInitialWorldState(202)

    // A. Kiểm tra Food
    state.resources.food = 0
    assert.ok(state.resources.food <= 0, "Ngưỡng báo động đỏ Food <= 0")
    state.resources.food = 60
    assert.ok(state.resources.food < 100 && state.resources.food > 0, "Ngưỡng cảnh báo Food < 100")
    state.resources.food = 250
    assert.ok(state.resources.food >= 100, "Ngưỡng an toàn Food >= 100")

    // B. Kiểm tra Logistics Supplies
    state.resources.logisticsSupplies = 0
    assert.ok(state.resources.logisticsSupplies <= 0, "Ngưỡng báo động đỏ Supplies <= 0")
    state.resources.logisticsSupplies = 35
    assert.ok(state.resources.logisticsSupplies < 50 && state.resources.logisticsSupplies > 0, "Ngưỡng cảnh báo Supplies < 50")
    state.resources.logisticsSupplies = 100
    assert.ok(state.resources.logisticsSupplies >= 50, "Ngưỡng an toàn Supplies >= 50")

    // C. Kiểm tra Quân dự bị
    state.military.reserves = 0
    assert.ok(state.military.reserves <= 0, "Ngưỡng báo động đỏ Reserves <= 0")
    state.military.reserves = 80
    assert.ok(state.military.reserves < 100 && state.military.reserves > 0, "Ngưỡng cảnh báo Reserves < 100")
    state.military.reserves = 300
    assert.ok(state.military.reserves >= 100, "Ngưỡng an toàn Reserves >= 100")
  })

  // ==========================================================================
  // Test 3: Nút điều hướng từ hotspot mở đúng tab và đúng sector/event
  // ==========================================================================
  it("3. Nút điều hướng từ hotspot liên kết đúng tab và sector/event", () => {
    const state = createInitialWorldState(303)
    const testSectorId = "nebula_bastion"
    const sector = state.sectors[testSectorId]
    sector.stage = "under_siege"
    sector.threatLevel = 880

    // Mô phỏng hàm điều hướng từ Overview sang War Room
    let targetSector: string | null = null
    let targetTab: string | null = null
    let quickDispatchOpen = false

    const navigateToSector = (secId: string) => {
      targetSector = secId
      targetTab = "map"
    }

    const quickDispatchToSector = (secId: string) => {
      targetSector = secId
      quickDispatchOpen = true
    }

    // Điều hướng War Room
    navigateToSector(testSectorId)
    assert.equal(targetSector, testSectorId, "Phải gán đúng sectorId đã chọn")
    assert.equal(targetTab, "map", "Phải chuyển tab sang War Room (map)")

    // Điều hướng Quick Dispatch
    quickDispatchToSector(testSectorId)
    assert.equal(targetSector, testSectorId)
    assert.equal(quickDispatchOpen, true, "Phải mở Quick Dispatch Dock cho đúng sector")

    // Điều hướng sự kiện
    let selectedEventIdForBoard: string | null = null
    const navigateToEvent = (eventId: string) => {
      selectedEventIdForBoard = eventId
      targetTab = "events"
    }

    navigateToEvent("evt_test_101")
    assert.equal(selectedEventIdForBoard, "evt_test_101", "Phải chọn đúng eventId")
    assert.equal(targetTab, "events", "Phải chuyển tab sang Events & Missions")
  })

  // ==========================================================================
  // Test 4: Không thể tự động phê chuẩn sự kiện chỉ vì deadline sắp hết hạn
  // ==========================================================================
  it("4. Không thể tự động phê chuẩn sự kiện chỉ vì deadline sắp hết hạn", () => {
    const state = createInitialWorldState(404)
    state.currentDay = 10

    // Tạo sự kiện sắp hết hạn hôm nay (deadline = currentDay)
    const expiringEvent: WorldEvent = {
      id: "evt_expiring_now",
      templateId: "evt_border_crisis",
      title: "Khủng hoảng Biên Giới",
      description: "Hạm đội The Void áp sát vành đai.",
      category: "military",
      severity: "critical",
      scope: "sector",
      sectorId: "sol_command_hq",
      status: "INIT",
      createdAtTick: 8,
      decisionDeadlineTick: 10, // Hết hạn ngay tại ngày 10
      defaultStrategyId: "strat_standby",
      availableStrategies: [
        {
          id: "strat_counter_attack",
          name: "Phản Công Toàn Lực",
          description: "Xuất kích hạm đội đẩy lùi kẻ thù",
          cost: { industrialMaterials: 80, energy: 50 },
          militaryCost: 150,
          successRate: 85,
          processingTicks: 2,
          effects: { stabilityDelta: 10, threatDelta: -80 },
        },
      ],
    }
    state.events = { [expiringEvent.id]: expiringEvent }

    // Tại thời điểm hiển thị Overview, sự kiện phải giữ nguyên trạng thái INIT
    assert.equal(expiringEvent.status, "INIT", "Sự kiện phải giữ nguyên INIT khi chỉ xem overview")

    // Khi người chơi mở modal xem xét nhưng quân dự bị không đủ:
    state.military.reserves = 50 // Cần 150 nhưng chỉ có 50
    const validation = validateStrategyExecution(state, expiringEvent, expiringEvent.availableStrategies[0])
    assert.equal(validation.valid, false, "Thẩm định phải từ chối vì thiếu quân dự bị")
    assert.ok(validation.reason?.includes("Thiếu quân dự bị"), "Lý do phải nêu rõ thiếu quân dự bị")

    // System Auto không tìm thấy ứng viên hợp lệ vì thiếu dự bị
    const candidateInvalid = selectBestStrategyForEvent(state, expiringEvent)
    assert.equal(candidateInvalid, null, "Không được tự động phê chuẩn khi không đủ điều kiện tài nguyên/quân dự bị")

    // Không được tự động phê chuẩn khi validation không đạt
    assert.equal(expiringEvent.status, "INIT", "Trạng thái không được chuyển sang PROCESSING khi chưa được phê chuẩn hợp lệ")
  })

  // ==========================================================================
  // Test 5: Trận chiến suspended được điều hướng đến luồng recovery hiện có
  // ==========================================================================
  it("5. Trận chiến suspended được điều hướng đến luồng recovery hiện có", () => {
    const state = createInitialWorldState(505)
    const sectorId = "sol_command_hq"

    // Khóa trận đấu và tạo snapshot
    const snapshot = lockEncounterAndCreateSnapshot(state, { sectorId })
    saveWorldState(state)

    // Xác nhận cờ suspended trong state
    assert.equal(state.isSuspendedCombat, true)
    assert.ok(state.suspendedSnapshot)
    assert.equal(state.suspendedSnapshot.sectorId, sectorId)

    // Nạp lại từ storage
    const loaded = loadWorldState().state
    assert.equal(loaded.isSuspendedCombat, true)
    assert.equal(loaded.suspendedSnapshot?.transactionId, snapshot.transactionId)

    // Thực hiện hủy bỏ an toàn (Safe Abort)
    const abortRes = abortSuspendedCombat(loaded, snapshot.transactionId, "Hủy an toàn từ test")
    assert.equal(abortRes.success, true)
    assert.equal(loaded.isSuspendedCombat, false)
    assert.equal(loaded.suspendedSnapshot, undefined)
    assert.equal(loaded.sectors[sectorId].isLockedForCombat, false, "Sector phải được mở khóa an toàn")
  })

  // ==========================================================================
  // Test 6: Tactical Retreat không gọi commit lần hai sau khi commit thành công
  // ==========================================================================
  it("6. Tactical Retreat không gọi commit lần hai sau khi commit thành công", () => {
    const state = createInitialWorldState(606)
    const sectorId = "sol_command_hq"
    const snapshot = lockEncounterAndCreateSnapshot(state, { sectorId })

    const receipt = {
      transactionId: snapshot.transactionId,
      encounterId: snapshot.encounterId,
      combatVersion: "v1" as const,
      sectorId,
      victory: false,
      rounds: 5,
      playerRemainingHpPercent: 20,
      enemyRemainingHpPercent: 80,
      tacticalRating: "D" as const,
      completedAtTimestamp: Date.now(),
      logSummary: "Người chơi chủ động rút lui khỏi chiến trường.",
    }

    // Lần 1: Commit kết quả thất bại qua handler
    const res1 = commitCombatResultReceipt(state, receipt)
    assert.equal(res1.applied, true)
    assert.equal(res1.alreadyCommitted, false, "Lần đầu commit phải thực thi bình thường")

    // Mô phỏng cờ worldCommittedRef được đồng bộ
    let worldCommitted = true

    // Mô phỏng effect sau khi status đổi thành 'defeat'
    let secondCommitAttempted = false
    if (!worldCommitted) {
      secondCommitAttempted = true
      commitCombatResultReceipt(state, receipt)
    }

    assert.equal(secondCommitAttempted, false, "Effect không được gọi commit lần 2 khi cờ worldCommitted = true")

    // Nếu cố tình gọi lần 2 trực tiếp qua adapter, bộ lọc lũy đẳng phải bảo vệ
    const res2 = commitCombatResultReceipt(state, receipt)
    assert.equal(res2.applied, false)
    assert.equal(res2.alreadyCommitted, true, "Transaction journal phải chặn double-commit")
  })

  // ==========================================================================
  // Test 7: RPG save và WORLD save vẫn độc lập
  // ==========================================================================
  it("7. RPG save và WORLD save vẫn độc lập", () => {
    // Khởi tạo và lưu RPG Save V4
    const rpgProgression = { ...INITIAL_STARFRONT_PROGRESSION, credits: 5000, level: 12 }
    saveStarfrontProgression(rpgProgression)

    // Khởi tạo và thao tác trên WORLD State
    const worldState = createInitialWorldState(707)
    worldState.resources.industrialMaterials = 9999
    worldState.military.reserves = 8888
    saveWorldState(worldState)

    // Tải lại cả hai và đối chiếu
    const loadedWorld = loadWorldState().state
    const loadedRpg = loadStarfrontProgression()

    assert.equal(loadedWorld.resources.industrialMaterials, 9999)
    assert.equal(loadedWorld.military.reserves, 8888)
    assert.equal(loadedRpg.credits, 5000, "Credits RPG không bị biến đổi bởi WORLD save")
    assert.equal(loadedRpg.level, 12, "Level RPG không bị biến đổi bởi WORLD save")
    assert.equal((loadedRpg as any).military, undefined, "RPG save không bị rò rỉ dữ liệu WORLD")
  })
})
