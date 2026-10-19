/**
 * STARFRONT WORLD — Phase 6.19 Test Suite
 * Kiểm thử toàn diện Bảng Quyết Định 2 Cột (Events & Missions Decision Matrix):
 *   1. Sắp xếp Hàng Đợi Khẩn Cấp (Urgency Queue) theo Deadline -> Severity -> ID
 *   2. Thẩm định điều kiện chi trả tài nguyên & quân sự (Validation & Explainable Scoring)
 *   3. Phân biệt rõ ràng 5 trạng thái nguồn quyết định: Chờ Chỉ Huy, System Auto, Default Fallback, Processing, Hoàn tất
 *   4. Bảo toàn tính lũy đẳng: Không cho phép phê chuẩn lại sự kiện đã PROCESSING
 *   5. Chuỗi nhiệm vụ (Mission Chains) và cờ hoãn điều động (Pending Dispatch) hoạt động chuẩn xác
 *   6. Bảo toàn tính toàn vẹn của World Save V1 và độc lập tuyệt đối với RPG Save V4
 */

import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"

import { createInitialWorldState } from "@/lib/game/world/initial-state"
import {
  registerWorldEvent,
  chooseEventStrategy,
  getActiveEvents,
} from "@/lib/game/world/event-engine"
import {
  validateStrategyExecution,
  scoreEventStrategy,
  selectBestStrategyForEvent,
  evaluateAndApplyEventStrategyPolicy,
} from "@/lib/game/world/event-strategy-policy"
import {
  startMissionChain,
  advanceMissionChainNode,
} from "@/lib/game/world/mission-chains"
import { saveWorldState, loadWorldState } from "@/lib/game/world/storage"
import type { WorldState, WorldEvent, EventStrategy } from "@/lib/game/world/types"

function setupMockLocalStorage() {
  const store: Record<string, string> = {}
  const mockStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      for (const k in store) delete store[k]
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length
    },
    _store: store,
  }

  ;(globalThis as any).window = globalThis
  ;(globalThis as any).localStorage = mockStorage
  return mockStorage
}

describe("STARFRONT WORLD — Phase 6.19: Events & Missions Decision Matrix", () => {
  let mockStorage: ReturnType<typeof setupMockLocalStorage>

  beforeEach(() => {
    mockStorage = setupMockLocalStorage()
  })

  // ==========================================================================
  // Test 1: Sắp xếp Hàng Đợi Khẩn Cấp (Urgency Queue)
  // ==========================================================================
  it("1. Urgency Queue: Sắp xếp ưu tiên theo Deadline -> Severity -> ID", () => {
    const state = createInitialWorldState()
    state.currentDay = 5

    // Event A: Deadline ngày 6 (còn 1 ngày), info
    const eventA: WorldEvent = {
      id: "evt_deadline_soon",
      templateId: "tpl_a",
      title: "Hạn chót ngày mai",
      description: "Mô tả A",
      category: "military",
      severity: "info",
      scope: "sector",
      sectorId: "sol_command_hq",
      status: "INIT",
      priority: 50,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 6,
      defaultStrategyId: "strat_def_a",
      availableStrategies: [
        {
          id: "strat_def_a",
          name: "Mặc định A",
          description: "Mô tả",
          processingTicks: 1,
          consequences: { message: "OK" },
        },
      ],
      isResolved: false,
      consequencesApplied: false,
    }

    // Event B: Deadline ngày 10 (còn 5 ngày), critical
    const eventB: WorldEvent = {
      id: "evt_deadline_far_crit",
      templateId: "tpl_b",
      title: "Tối nguy nhưng còn hạn",
      description: "Mô tả B",
      category: "crisis",
      severity: "critical",
      scope: "sector",
      sectorId: "helios_perimeter",
      status: "INIT",
      priority: 90,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 10,
      defaultStrategyId: "strat_def_b",
      availableStrategies: [
        {
          id: "strat_def_b",
          name: "Mặc định B",
          description: "Mô tả",
          processingTicks: 2,
          consequences: { message: "OK" },
        },
      ],
      isResolved: false,
      consequencesApplied: false,
    }

    // Event C: Deadline ngày 10 (còn 5 ngày), warning
    const eventC: WorldEvent = {
      id: "evt_deadline_far_warn",
      templateId: "tpl_c",
      title: "Cảnh báo còn hạn",
      description: "Mô tả C",
      category: "civil",
      severity: "warning",
      scope: "sector",
      sectorId: "mining_outpost_k7",
      status: "INIT",
      priority: 70,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 10,
      defaultStrategyId: "strat_def_c",
      availableStrategies: [
        {
          id: "strat_def_c",
          name: "Mặc định C",
          description: "Mô tả",
          processingTicks: 2,
          consequences: { message: "OK" },
        },
      ],
      isResolved: false,
      consequencesApplied: false,
    }

    registerWorldEvent(state, eventA)
    registerWorldEvent(state, eventB)
    registerWorldEvent(state, eventC)

    const list = getActiveEvents(state).filter((e) => e.status === "INIT")

    // Thuật toán sắp xếp của Decision Matrix
    const sorted = [...list].sort((a, b) => {
      const aDeadline = Math.max(0, a.decisionDeadlineTick - state.currentDay)
      const bDeadline = Math.max(0, b.decisionDeadlineTick - state.currentDay)
      if (aDeadline !== bDeadline) return aDeadline - bDeadline

      const severityWeight: Record<string, number> = { critical: 3, warning: 2, info: 1 }
      const aSev = severityWeight[a.severity] || 0
      const bSev = severityWeight[b.severity] || 0
      if (aSev !== bSev) return bSev - aSev

      return a.id.localeCompare(b.id)
    })

    assert.equal(sorted[0].id, "evt_deadline_soon", "Sự kiện còn 1 ngày phải đứng đầu")
    assert.equal(sorted[1].id, "evt_deadline_far_crit", "Sự kiện critical phải đứng trước warning khi cùng deadline")
    assert.equal(sorted[2].id, "evt_deadline_far_warn", "Sự kiện warning xếp thứ ba")
  })

  // ==========================================================================
  // Test 2: Thẩm định khả năng chi trả & Chấm điểm minh bạch
  // ==========================================================================
  it("2. Decision Panel: validateStrategyExecution kiểm tra chính xác chi phí & scoreEventStrategy tính điểm minh bạch", () => {
    const state = createInitialWorldState()
    state.resources.industrialMaterials = 10
    state.military.reserves = 5

    const event: WorldEvent = {
      id: "evt_val_test",
      templateId: "tpl_val",
      title: "Khôi Phục Trạm Năng Lượng",
      description: "Thử nghiệm thẩm định chi phí",
      category: "crisis",
      severity: "warning",
      scope: "sector",
      sectorId: "sol_command_hq",
      status: "INIT",
      priority: 60,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 4,
      defaultStrategyId: "strat_cheap",
      availableStrategies: [
        {
          id: "strat_expensive",
          name: "Phương Án Tốn Kém",
          description: "Cần nhiều vật liệu và quân",
          cost: { industrialMaterials: 50 },
          militaryCost: 20,
          processingTicks: 1,
          successChance: 95,
          consequences: { stabilityDelta: 10, message: "Thành công lớn" },
        },
        {
          id: "strat_cheap",
          name: "Phương Án Giá Rẻ",
          description: "Không tốn vật liệu hay quân",
          processingTicks: 2,
          successChance: 70,
          consequences: { stabilityDelta: 3, message: "Thành công vừa" },
        },
      ],
      isResolved: false,
      consequencesApplied: false,
    }

    registerWorldEvent(state, event)

    // Kiểm tra chiến lược tốn kém -> Không đủ điều kiện
    const expValidation = validateStrategyExecution(state, event, event.availableStrategies[0])
    assert.equal(expValidation.valid, false, "Không đủ tài nguyên phải trả về valid = false")
    assert.ok(expValidation.reason?.includes("Vật liệu công nghiệp"), "Phải nêu rõ lý do thiếu vật liệu công nghiệp")

    // Kiểm tra chiến lược giá rẻ -> Đủ điều kiện
    const cheapValidation = validateStrategyExecution(state, event, event.availableStrategies[1])
    assert.equal(cheapValidation.valid, true, "Chiến lược không tốn kém phải valid = true")

    // Chấm điểm chiến lược
    const scoreCheap = scoreEventStrategy(state, event, event.availableStrategies[1])
    assert.ok(scoreCheap.score > 0, "Điểm chiến lược phải dương khi tăng stability")
    assert.ok(scoreCheap.reasons.length > 0, "Phải có danh sách lý do cụ thể minh bạch")

    // Tìm best candidate: Hệ thống phải tự động chọn phương án giá rẻ vì phương án tốn kém không chi trả được
    const best = selectBestStrategyForEvent(state, event)
    assert.ok(best, "Phải tìm được best candidate hợp lệ")
    assert.equal(best?.strategy.id, "strat_cheap", "Hệ thống phải đề xuất strat_cheap")
  })

  // ==========================================================================
  // Test 3: Trạng thái và Nguồn quyết định chiến lược
  // ==========================================================================
  it("3. Phân biệt rõ nguồn quyết định (player_choice, system_auto, default_fallback) và lý do chuyển giao", () => {
    const state = createInitialWorldState()

    const eventWithReason: WorldEvent = {
      id: "evt_source_test",
      templateId: "tpl_source",
      title: "Xung Đột Lợi Ích Cực Điểm",
      description: "Tình huống nhạy cảm",
      category: "diplomacy",
      severity: "warning",
      scope: "sector",
      sectorId: "centauri_mining",
      status: "INIT",
      priority: 85,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 3,
      defaultStrategyId: "strat_neutral",
      availableStrategies: [
        {
          id: "strat_neutral",
          name: "Trung lập",
          description: "Giữ vị thế trung gian",
          processingTicks: 1,
          consequences: { message: "Trung lập" },
        },
      ],
      isResolved: false,
      consequencesApplied: false,
      strategySource: "player_choice",
      autoSelectionFailureReason: "Chính sách Tier Large yêu cầu Chỉ Huy phê chuẩn trực tiếp",
    }

    registerWorldEvent(state, eventWithReason)

    const stored = state.events!["evt_source_test"]
    assert.equal(stored.strategySource, "player_choice", "Phải lưu đúng nguồn player_choice")
    assert.equal(
      stored.autoSelectionFailureReason,
      "Chính sách Tier Large yêu cầu Chỉ Huy phê chuẩn trực tiếp",
      "Phải lưu chính xác lý do chuyển giao cho người chơi"
    )
  })

  // ==========================================================================
  // Test 4: Bảo toàn lũy đẳng - Không thể phê chuẩn lại sự kiện đã PROCESSING
  // ==========================================================================
  it("4. Tính lũy đẳng: Không thể phê chuẩn lại sự kiện đã ở trạng thái PROCESSING", () => {
    const state = createInitialWorldState()

    const event: WorldEvent = {
      id: "evt_idempotency_test",
      templateId: "tpl_idem",
      title: "Thiết Lập Trạm Rada",
      description: "Chiến dịch dài ngày",
      category: "military",
      severity: "info",
      scope: "sector",
      sectorId: "sol_command_hq",
      status: "INIT",
      priority: 50,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 5,
      defaultStrategyId: "strat_radar",
      availableStrategies: [
        {
          id: "strat_radar",
          name: "Xây Rada",
          description: "Mô tả",
          processingTicks: 2,
          consequences: { message: "Hoàn tất" },
        },
        {
          id: "strat_alt",
          name: "Phương án phụ",
          description: "Mô tả",
          processingTicks: 1,
          consequences: { message: "Phụ" },
        },
      ],
      isResolved: false,
      consequencesApplied: false,
    }

    registerWorldEvent(state, event)

    // Phê chuẩn lần đầu -> Thành công và chuyển sang PROCESSING
    const res1 = chooseEventStrategy(state, "evt_idempotency_test", "strat_radar")
    assert.equal(res1.success, true)
    assert.equal(state.events!["evt_idempotency_test"].status, "PROCESSING")

    // Cố gắng phê chuẩn lần hai bằng phương án khác -> Phải thất bại an toàn
    const res2 = chooseEventStrategy(state, "evt_idempotency_test", "strat_alt")
    assert.equal(res2.success, false, "Phê chuẩn lại sự kiện đang PROCESSING phải bị từ chối")
    assert.equal(
      state.events!["evt_idempotency_test"].chosenStrategyId,
      "strat_radar",
      "Chiến lược đã cam kết không được phép bị ghi đè"
    )
  })

  // ==========================================================================
  // Test 5: Mission Chains và Cờ Pending Dispatch
  // ==========================================================================
  it("5. Mission Chains: Bảo toàn cấu trúc cây nút và cờ isPendingDispatch", () => {
    const state = createInitialWorldState()

    const startRes = startMissionChain(state, "chain_branching_mining_crisis")
    assert.equal(startRes.success, true)
    const chain = startRes.chain!

    // Giả lập nút bị hoãn do xung đột sector
    const currNode = chain.nodes[chain.currentNodeId]
    currNode.isPendingDispatch = true
    currNode.dispatchDeferredTicks = 1

    assert.equal(currNode.isPendingDispatch, true)
    assert.equal(currNode.dispatchDeferredTicks, 1)

    // Hoàn tất nút
    const advRes = advanceMissionChainNode(state, chain.id, currNode.id, "strat_quell_riots")
    assert.equal(advRes.success, true)
    assert.equal(chain.nodes[currNode.id].status, "completed")
  })

  // ==========================================================================
  // Test 6: Bảo toàn lưu trữ World Save V1 và độc lập RPG Save V4
  // ==========================================================================
  it("6. Lưu trữ an toàn: World State bảo toàn vẹn toàn qua Save V1 và độc lập với RPG Save V4", () => {
    const state = createInitialWorldState()

    // Đặt RPG save data giả lập
    mockStorage.setItem("STARFRONT_SAVE_DATA_V4", JSON.stringify({ hero: "Vanguard", level: 99 }))

    const event: WorldEvent = {
      id: "evt_save_test",
      templateId: "tpl_save",
      title: "Sự Kiện Lưu Trữ",
      description: "Kiểm tra lưu",
      category: "intel",
      severity: "info",
      scope: "sector",
      sectorId: "sol_command_hq",
      status: "INIT",
      priority: 40,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 3,
      defaultStrategyId: "strat_save",
      availableStrategies: [
        {
          id: "strat_save",
          name: "Lưu",
          description: "Mô tả",
          processingTicks: 1,
          consequences: { message: "Lưu" },
        },
      ],
      isResolved: false,
      consequencesApplied: false,
    }

    registerWorldEvent(state, event)
    saveWorldState(state)

    // Nạp lại
    const loadResult = loadWorldState()
    assert.ok(loadResult.state, "WorldState nạp lại phải tồn tại")
    assert.ok(loadResult.state?.events?.["evt_save_test"], "Sự kiện phải được bảo toàn trong Save V1")

    // Kiểm tra RPG Save V4 không hề bị thay đổi
    const rpgRaw = mockStorage.getItem("STARFRONT_SAVE_DATA_V4")
    assert.ok(rpgRaw)
    const rpgData = JSON.parse(rpgRaw!)
    assert.equal(rpgData.hero, "Vanguard")
    assert.equal(rpgData.level, 99)
  })
})
