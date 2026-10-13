import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"

import {
  createInitialWorldState,
  INITIAL_WORLD_SECTORS,
  INITIAL_WORLD_ROUTES,
} from "@/lib/game/world/initial-state"
import {
  computeCriticalAlerts,
  computeActiveEventsGroups,
  computeCombatOperations,
  computeSectorOperations,
  computeActionableItemsCount,
  type CriticalAlertItem,
} from "@/components/game/world/global-operations-hub"
import {
  lockEncounterAndCreateSnapshot,
  abortSuspendedCombat,
} from "@/lib/game/world/combat-adapter"
import { loadWorldState, saveWorldState, WORLD_STORAGE_KEY_V1 } from "@/lib/game/world/storage"
import type { WorldState, WorldEvent, WorldEventResult, EncounterSnapshot } from "@/lib/game/world/types"

/**
 * Mock localStorage cho môi trường node:test
 */
function setupMockLocalStorage(): Map<string, string> {
  const memoryStore = new Map<string, string>()

  const mockStorage = {
    getItem: (key: string) => (memoryStore.has(key) ? memoryStore.get(key)! : null),
    setItem: (key: string, val: string) => {
      memoryStore.set(key, String(val))
    },
    removeItem: (key: string) => {
      memoryStore.delete(key)
    },
    clear: () => {
      memoryStore.clear()
    },
    key: (index: number) => Array.from(memoryStore.keys())[index] || null,
    get length() {
      return memoryStore.size
    },
  }

  ;(globalThis as any).window = globalThis
  ;(globalThis as any).localStorage = mockStorage
  return memoryStore
}

describe("STARFRONT WORLD — Phase 6.29: Global Operations & Event Hub", () => {
  beforeEach(() => {
    setupMockLocalStorage()
  })

  // ==========================================================================
  // Test 1: Hub lấy đúng dữ liệu Event, Sector, Combat và Reports
  // ==========================================================================
  it("1. Hub lấy đúng dữ liệu Event, Sector, Combat và Reports từ WorldState", () => {
    const state = createInitialWorldState(12345)

    // Tạo giả lập sự kiện INIT và PROCESSING
    const eventInit: WorldEvent = {
      id: "ev_sol_solar_flare",
      templateId: "tpl_solar_flare",
      title: "Bão Mặt Trời Helios",
      description: "Nhiễu loạn plasma gây tê liệt trạm radar",
      category: "anomaly",
      severity: "critical",
      scope: "sector",
      sectorId: "helios_perimeter",
      status: "INIT",
      priority: 1,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 2, // Còn 1 ngày
      defaultStrategyId: "strat_shield",
      availableStrategies: [],
      isResolved: false,
      consequencesApplied: false,
    }

    const eventProcessing: WorldEvent = {
      id: "ev_mining_strike",
      templateId: "tpl_mining_strike",
      title: "Đình Công Tại Mỏ K7",
      description: "Công nhân đòi cải thiện an toàn lao động",
      category: "civil",
      severity: "warning",
      scope: "sector",
      sectorId: "mining_outpost_k7",
      status: "PROCESSING",
      priority: 2,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 3,
      processingCompletesTick: 4,
      chosenStrategyId: "strat_negotiate",
      defaultStrategyId: "strat_suppress",
      availableStrategies: [],
      isResolved: false,
      consequencesApplied: false,
    }

    const activeEvents = [eventInit, eventProcessing]

    // Kiểm tra computeActiveEventsGroups
    const eventGroups = computeActiveEventsGroups(activeEvents, state)
    assert.equal(eventGroups.initEvents.length, 1, "Phải có đúng 1 sự kiện INIT")
    assert.equal(eventGroups.initEvents[0].id, "ev_sol_solar_flare")
    assert.equal(eventGroups.processingEvents.length, 1, "Phải có đúng 1 sự kiện PROCESSING")
    assert.equal(eventGroups.processingEvents[0].id, "ev_mining_strike")

    // Kiểm tra computeCriticalAlerts
    const alerts = computeCriticalAlerts(state, activeEvents)
    assert.ok(alerts.length > 0, "Phải sinh các alert cần thiết")
    const eventAlert = alerts.find((a) => a.eventId === "ev_sol_solar_flare")
    assert.ok(eventAlert, "Phải có alert cho sự kiện INIT nguy cấp")
    assert.equal(eventAlert?.priority, "P1")
    assert.equal(eventAlert?.sectorId, "helios_perimeter")

    // Kiểm tra computeSectorOperations
    const sectorOps = computeSectorOperations(state, activeEvents)
    const heliosOp = sectorOps.find((op) => op.sector.id === "helios_perimeter")
    assert.ok(heliosOp, "Helios Perimeter phải xuất hiện trong Sector Operations vì có sự kiện")
    assert.ok(heliosOp!.eventsCount >= 1)

    // Kiểm tra computeCombatOperations khi chưa có combat
    const combatOps = computeCombatOperations(state)
    assert.equal(combatOps.suspendedEncounter, null)
    assert.equal(combatOps.lockedSectors.length, 0)
  })

  // ==========================================================================
  // Test 2: Phân loại mức ưu tiên P0, P1, P2 và bộ đếm Actionable Count chống trùng lặp
  // ==========================================================================
  it("2. Phân loại mức ưu tiên P0, P1, P2 chuẩn xác và Actionable Items Count chống trùng lặp", () => {
    const state = createInitialWorldState(67890)

    // Giả lập Sector Tartarus bị Under Siege (P0)
    state.sectors["tartarus_breach"].stage = "under_siege"
    state.sectors["tartarus_breach"].threatLevel = 950

    // Giả lập Sector Shadow Reach bị Threatened (P1)
    state.sectors["shadow_reach"].stage = "threatened"
    state.sectors["shadow_reach"].threatLevel = 720

    // Giả lập Tuyến đường bị chặn (P1)
    state.routes[0].state = "blocked"

    // Giả lập Sự kiện INIT hết hạn hôm nay (P0)
    const urgentEvent: WorldEvent = {
      id: "ev_urgent_crisis",
      templateId: "tpl_crisis",
      title: "Khủng hoảng lượng tử",
      description: "Nguy cấp",
      category: "crisis",
      severity: "critical",
      scope: "galaxy",
      status: "INIT",
      priority: 1,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 1, // daysLeft = 0 -> P0
      defaultStrategyId: "strat_default",
      availableStrategies: [],
      isResolved: false,
      consequencesApplied: false,
    }

    const alerts = computeCriticalAlerts(state, [urgentEvent])

    // Kiểm tra có đầy đủ P0 và P1
    const p0Alerts = alerts.filter((a) => a.priority === "P0")
    const p1Alerts = alerts.filter((a) => a.priority === "P1")

    assert.ok(p0Alerts.length >= 2, "Phải có ít nhất 2 alert P0 (tartarus_breach siege và urgentEvent hết hạn)")
    assert.ok(p0Alerts.some((a) => a.id === "siege_tartarus_breach"))
    assert.ok(p0Alerts.some((a) => a.id === "event_ev_urgent_crisis"))

    assert.ok(p1Alerts.some((a) => a.id === "threatened_shadow_reach"))
    assert.ok(p1Alerts.some((a) => a.id.startsWith("route_blocked_")))

    // Kiểm tra Actionable Counter không đếm trùng
    const actionableCount = computeActionableItemsCount(alerts, [urgentEvent], state)
    assert.ok(actionableCount >= 4, "Bộ đếm phải tính tất cả các mục P0/P1 mà không trùng lặp")
  })

  // ==========================================================================
  // Test 3: Sự kiện INIT phân định đúng hành động "Phê Chuẩn Chiến Lược"
  // ==========================================================================
  it("3. Sự kiện INIT phân định rõ ràng action 'resolve_event' kèm sector liên quan", () => {
    const state = createInitialWorldState()
    const initEvent: WorldEvent = {
      id: "ev_init_decision",
      templateId: "tpl_decision",
      title: "Yêu Cầu Tăng Viện",
      description: "Cần phê chuẩn",
      category: "military",
      severity: "warning",
      scope: "sector",
      sectorId: "mining_outpost_k7",
      status: "INIT",
      priority: 2,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 3,
      defaultStrategyId: "strat_1",
      availableStrategies: [],
      isResolved: false,
      consequencesApplied: false,
    }

    const alerts = computeCriticalAlerts(state, [initEvent])
    const alertItem = alerts.find((a) => a.eventId === "ev_init_decision")
    assert.ok(alertItem, "Alert của event INIT phải tồn tại")
    assert.equal(alertItem?.actionType, "resolve_event")
    assert.equal(alertItem?.sectorId, "mining_outpost_k7")
    assert.equal(alertItem?.sectorName, state.sectors["mining_outpost_k7"].name)
  })

  // ==========================================================================
  // Test 4: Sự kiện PROCESSING chỉ xem tiến trình, không có phê chuẩn
  // ==========================================================================
  it("4. Sự kiện PROCESSING phân tách vào nhóm riêng, không xuất hiện nút phê chuẩn", () => {
    const state = createInitialWorldState()
    const procEvent: WorldEvent = {
      id: "ev_processing_exec",
      templateId: "tpl_exec",
      title: "Đang Sửa Chữa Lưới Điện",
      description: "Kỹ sư đang tiến hành khắc phục",
      category: "logistics",
      severity: "info",
      scope: "sector",
      sectorId: "helios_perimeter",
      status: "PROCESSING",
      priority: 3,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 2,
      processingCompletesTick: 5,
      chosenStrategyId: "strat_repair_fast",
      defaultStrategyId: "strat_repair",
      availableStrategies: [],
      isResolved: false,
      consequencesApplied: false,
    }

    const groups = computeActiveEventsGroups([procEvent], state)
    assert.equal(groups.initEvents.length, 0, "Không được xếp vào INIT")
    assert.equal(groups.processingEvents.length, 1, "Phải xếp đúng vào PROCESSING")
    assert.equal(groups.processingEvents[0].chosenStrategyId, "strat_repair_fast")

    // Event PROCESSING không sinh alert trong Critical Alerts trừ phi có lỗi logic khác
    const alerts = computeCriticalAlerts(state, [procEvent])
    assert.equal(alerts.filter((a) => a.eventId === "ev_processing_exec").length, 0)
  })

  // ==========================================================================
  // Test 5: Resume combat dẫn tới đúng WORLD Encounter và Transaction
  // ==========================================================================
  it("5. Trận đấu dở dang (Suspended Encounter) trích xuất đúng Snapshot, Transaction ID và Sector", () => {
    const state = createInitialWorldState()

    // Khóa trận đấu tại Helios Perimeter qua Adapter
    const snapshot = lockEncounterAndCreateSnapshot(state, {
      sectorId: "helios_perimeter",
    })

    assert.ok(state.isSuspendedCombat, "State phải đánh dấu suspended combat")
    assert.ok(state.suspendedSnapshot, "Phải có suspended snapshot")

    // Tính toán combat operations trong Hub
    const combatOps = computeCombatOperations(state)
    assert.ok(combatOps.suspendedEncounter, "Hub phải nhận diện trận đấu dở dang")
    assert.equal(combatOps.suspendedEncounter?.transactionId, snapshot.transactionId)
    assert.equal(combatOps.suspendedEncounter?.sector.id, "helios_perimeter")
    assert.equal(combatOps.suspendedEncounter?.lockedGarrison, snapshot.lockedGarrison)

    // Kiểm tra Critical Alerts sinh P0 combat alert
    const alerts = computeCriticalAlerts(state, [])
    const combatAlert = alerts.find((a) => a.type === "suspended_combat")
    assert.ok(combatAlert, "Phải có P0 alert cho suspended combat")
    assert.equal(combatAlert?.priority, "P0")
    assert.equal(combatAlert?.sectorId, "helios_perimeter")
    assert.equal(combatAlert?.actionType, "resume_combat")

    // Thử hủy an toàn qua Adapter
    const abortRes = abortSuspendedCombat(state, snapshot.transactionId, "Hủy test")
    assert.equal(abortRes.success, true)
    assert.equal(state.isSuspendedCombat, false)

    // Sau khi hủy, combat operations trở về bình thường
    const updatedCombatOps = computeCombatOperations(state)
    assert.equal(updatedCombatOps.suspendedEncounter, null)
  })

  // ==========================================================================
  // Test 6: Sector Operations lọc đúng các sector có hoạt động hoặc nguy cơ
  // ==========================================================================
  it("6. Sector Operations tổng hợp chính xác tình trạng 10 sector và ưu tiên can thiệp", () => {
    const state = createInitialWorldState()

    // Đặt Elysium Sanctuary có 1 deployment chuyển quân đến
    state.activeDeployments = [
      {
        deploymentId: "dep_1",
        transactionId: "tx_dep_1",
        factionId: "vss",
        fromSectorId: "sol_command_hq",
        toSectorId: "elysium_sanctuary",
        troopCount: 250,
        order: "defend",
        path: ["sol_command_hq", "helios_perimeter", "elysium_sanctuary"],
        totalDistance: 2,
        remainingDays: 1,
        status: "in_transit",
        createdAt: Date.now(),
      },
    ]

    // Abyssal Rift bị threatened
    state.sectors["abyssal_rift"].stage = "threatened"
    state.sectors["abyssal_rift"].threatLevel = 880

    const sectorOps = computeSectorOperations(state, [])
    assert.ok(sectorOps.length >= 2)

    const elysiumOp = sectorOps.find((op) => op.sector.id === "elysium_sanctuary")
    assert.ok(elysiumOp, "Elysium phải có trong danh sách do có quân chi viện")
    assert.equal(elysiumOp?.incomingTroops, 250)

    const abyssalOp = sectorOps.find((op) => op.sector.id === "abyssal_rift")
    assert.ok(abyssalOp, "Abyssal Rift phải có trong danh sách do Threat cao và bị threatened")
    assert.equal(abyssalOp?.hasThreat, true)
  })

  // ==========================================================================
  // Test 7: Empty States hoạt động chuẩn xác khi không có cảnh báo
  // ==========================================================================
  it("7. Empty States hoạt động trung thực khi không có sự kiện hoặc cảnh báo cấp bách", () => {
    const state = createInitialWorldState()

    // Đưa tất cả sector về trạng thái an toàn
    for (const id of Object.keys(state.sectors)) {
      state.sectors[id].stage = "normal"
      state.sectors[id].threatLevel = 100
      state.sectors[id].isLockedForCombat = false
    }
    for (const r of state.routes) {
      r.state = "open"
    }
    state.resources.food = 1000
    state.resources.logisticsSupplies = 500

    const alerts = computeCriticalAlerts(state, [])
    assert.equal(alerts.length, 0, "Không được sinh bất kỳ alert nào khi phòng tuyến yên bình")

    const actionableCount = computeActionableItemsCount(alerts, [], state)
    assert.equal(actionableCount, 0, "Bộ đếm việc cần làm phải bằng 0")

    const combatOps = computeCombatOperations(state)
    assert.equal(combatOps.suspendedEncounter, null)
    assert.equal(combatOps.lockedSectors.length, 0)

    const eventGroups = computeActiveEventsGroups([], state)
    assert.equal(eventGroups.initEvents.length, 0)
    assert.equal(eventGroups.processingEvents.length, 0)
  })

  // ==========================================================================
  // Test 8: Zero-Regression: World Save Schema V1 và RPG Save Data V4 được bảo toàn
  // ==========================================================================
  it("8. Zero-Regression: World Save Schema V1 và RPG Save V4 hoàn toàn cách ly và bất biến", () => {
    const state = createInitialWorldState()

    // Lưu World state
    const saveRes = saveWorldState(state)
    assert.equal(saveRes.success, true)

    // Nạp lại World state
    const loadRes = loadWorldState()
    assert.equal(loadRes.state.version, 1)
    assert.equal(Object.keys(loadRes.state.sectors).length, 10)
    assert.equal(loadRes.state.routes.length, 16)

    // Xác nhận RPG storage key hoàn toàn không bị chạm tới
    const RPG_SAVE_KEY = "STARFRONT_SAVE_DATA_V4"
    const rawRpg = localStorage.getItem(RPG_SAVE_KEY)
    assert.equal(rawRpg, null, "World Hub không bao giờ ghi đè vào RPG Save V4")
  })
})
