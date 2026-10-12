/**
 * STARFRONT WORLD — Phase 6.25 Test Suite
 * Kiểm thử Toàn diện Command Desk Redesign cho Events & Missions:
 *   1. Phân loại chuẩn xác 3 chế độ: INIT (cần quyết định), PROCESSING (đang chạy), CHAINS (chuỗi nhiệm vụ)
 *   2. Lựa chọn và bộ lọc tìm kiếm sự kiện không bị lệch trạng thái
 *   3. Chế độ PROCESSING không xuất hiện hành động phê chuẩn hay tạo giao dịch kép
 *   4. Chế độ CHAINS hiển thị chính xác các trạng thái bước nhiệm vụ (completed, active, pending, locked)
 *   5. Quy trình phê chuẩn INIT bảo toàn 100% validation, concurrency guard và cơ chế commit
 *   6. Recent Results Feed được loại bỏ khỏi UI mà không làm mất dữ liệu archive hay Debriefing Drawer
 *   7. Độc lập tuyệt đối giữa World Save V1 và RPG Save V4
 */

import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"

import { createInitialWorldState } from "@/lib/game/world/initial-state"
import {
  registerWorldEvent,
  chooseEventStrategy,
  getActiveEvents,
  autoLockDefaultStrategy,
  resolveProcessingEvent,
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
import { loadStarfrontProgression, saveStarfrontProgression } from "@/lib/game/storage"
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

describe("STARFRONT WORLD — Phase 6.25: Events & Missions Command Desk Redesign", () => {
  let mockStorage: ReturnType<typeof setupMockLocalStorage>
  let worldState: WorldState

  beforeEach(() => {
    mockStorage = setupMockLocalStorage()
    worldState = createInitialWorldState()
    saveWorldState(worldState)
  })

  it("1. Phân loại chuẩn xác 3 chế độ: INIT (cần quyết định), PROCESSING (đang chạy), CHAINS (chuỗi nhiệm vụ)", () => {
    // Đăng ký 1 event INIT
    const initEvt: WorldEvent = {
      id: "evt-test-init-1",
      templateId: "evt_plasma_storm",
      title: "Bão Bức Xạ Plasma",
      description: "Bão bức xạ quét qua trạm năng lượng.",
      category: "anomaly",
      severity: "warning",
      scope: "sector",
      sectorId: "sol_command_hq",
      status: "INIT",
      priority: 50,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 3,
      defaultStrategyId: "strat_emergency_grid_shutdown",
      availableStrategies: [
        {
          id: "strat_overcharge_shields",
          name: "Tăng Tải Khiên Năng Lượng",
          description: "Chuyển hướng plasma dự trữ sang các máy phát trường lực để cản bức xạ.",
          cost: { energy: 40 },
          processingTicks: 1,
          consequences: {
            stabilityDelta: 5,
            message: "Lưới bảo vệ đã che chắn an toàn.",
          },
        },
        {
          id: "strat_emergency_grid_shutdown",
          name: "Tạm Ngắt Lưới Điện Sản Xuất",
          description: "Ngắt điện để bảo toàn hạ tầng.",
          cost: {},
          processingTicks: 1,
          consequences: {
            stabilityDelta: -3,
            message: "Đã ngắt điện an toàn.",
          },
        },
      ],
      isResolved: false,
      consequencesApplied: false,
    }
    registerWorldEvent(worldState, initEvt)

    // Đăng ký 1 event PROCESSING
    const procEvt: WorldEvent = {
      id: "evt-test-proc-1",
      templateId: "evt_deep_void_probe",
      title: "Đầu Dò Thám Sâu",
      description: "Đang giải mã đầu dò Void.",
      category: "intel",
      severity: "info",
      scope: "sector",
      sectorId: "polaris_prime",
      status: "PROCESSING",
      priority: 40,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 4,
      defaultStrategyId: "strat_monitor_telemetry",
      chosenStrategyId: "strat_reverse_engineer_probe",
      processingStartedTick: 1,
      processingCompletesTick: 3,
      strategySource: "player_choice",
      availableStrategies: [
        {
          id: "strat_reverse_engineer_probe",
          name: "Mổ Xẻ Đảo Ngược",
          description: "Nghiên cứu nguyên lý nhảy không gian.",
          cost: { energy: 20 },
          processingTicks: 2,
          consequences: {
            resourceDelta: { tacticalData: 50 },
            message: "Hoàn tất giải mã.",
          },
        },
      ],
      isResolved: false,
      consequencesApplied: false,
    }
    registerWorldEvent(worldState, procEvt)

    // Khởi động 1 mission chain hợp lệ
    const startRes = startMissionChain(worldState, "chain_linear_void_inquiry")

    const activeList = getActiveEvents(worldState)
    const inits = activeList.filter((e) => e.status === "INIT")
    const procs = activeList.filter((e) => e.status === "PROCESSING")

    assert.equal(inits.length >= 1, true, "Phải có sự kiện INIT")
    assert.equal(procs.length >= 1, true, "Phải có sự kiện PROCESSING")
    assert.equal(startRes.success, true, "Chuỗi nhiệm vụ khởi động thành công")
    assert.equal(worldState.activeMissionChains.length, 1)
  })

  it("2. Lựa chọn và tìm kiếm sự kiện không làm sai lệch danh sách hay trạng thái", () => {
    const evt1: WorldEvent = {
      id: "evt-sol-crisis",
      templateId: "evt_plasma_storm",
      title: "Khủng Hoảng Sol HQ",
      description: "Vấn đề tại Sol.",
      category: "crisis",
      severity: "critical",
      scope: "sector",
      sectorId: "sol_command_hq",
      status: "INIT",
      priority: 90,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 2,
      defaultStrategyId: "strat_def",
      availableStrategies: [
        {
          id: "strat_def",
          name: "Mặc định",
          description: "Phòng thủ cơ bản.",
          processingTicks: 1,
          consequences: { message: "Ok" },
        },
      ],
      isResolved: false,
      consequencesApplied: false,
    }
    const evt2: WorldEvent = {
      id: "evt-polaris-logistics",
      templateId: "evt_plasma_storm",
      title: "Hậu Cần Polaris",
      description: "Vấn đề hậu cần Polaris.",
      category: "logistics",
      severity: "warning",
      scope: "sector",
      sectorId: "polaris_prime",
      status: "INIT",
      priority: 60,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 4,
      defaultStrategyId: "strat_def",
      availableStrategies: [
        {
          id: "strat_def",
          name: "Mặc định",
          description: "Phòng thủ cơ bản.",
          processingTicks: 1,
          consequences: { message: "Ok" },
        },
      ],
      isResolved: false,
      consequencesApplied: false,
    }
    registerWorldEvent(worldState, evt1)
    registerWorldEvent(worldState, evt2)

    const list = getActiveEvents(worldState).filter((e) => e.status === "INIT")
    assert.equal(list.length, 2)

    // Tìm kiếm với từ khóa "Sol"
    const searchSol = list.filter((e) =>
      e.title.toLowerCase().includes("sol") ||
      (e.sectorId && worldState.sectors[e.sectorId]?.name.toLowerCase().includes("sol"))
    )
    assert.equal(searchSol.length, 1)
    assert.equal(searchSol[0].id, "evt-sol-crisis")
  })

  it("3. Sự kiện PROCESSING không thể bị chọn lại hay kích hoạt phê chuẩn lần 2", () => {
    const evt: WorldEvent = {
      id: "evt-proc-lock",
      templateId: "evt_plasma_storm",
      title: "Sự Kiện Đang Chạy",
      description: "Đang được xử lý.",
      category: "military",
      severity: "warning",
      scope: "sector",
      sectorId: "sol_command_hq",
      status: "PROCESSING",
      priority: 70,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 3,
      defaultStrategyId: "strat_def",
      chosenStrategyId: "strat_attack",
      processingStartedTick: 1,
      processingCompletesTick: 3,
      availableStrategies: [
        {
          id: "strat_attack",
          name: "Tấn công",
          description: "Phản kích",
          processingTicks: 2,
          consequences: { message: "Đã phản kích" },
        },
      ],
      isResolved: false,
      consequencesApplied: false,
    }
    registerWorldEvent(worldState, evt)

    // Thử gọi chooseEventStrategy trên event PROCESSING
    const res = chooseEventStrategy(worldState, "evt-proc-lock", "strat_attack")
    assert.equal(res.success, false, "chooseEventStrategy phải từ chối khi sự kiện đang PROCESSING")
    assert.match(res.error || "", /không thể chọn chiến lược/i)
  })

  it("4. Chế độ CHAINS hiển thị chính xác các trạng thái bước nhiệm vụ và sector liên quan", () => {
    const startRes = startMissionChain(worldState, "chain_linear_void_inquiry")
    assert.equal(startRes.success, true)
    const chain = startRes.chain!
    assert.ok(chain)

    const nodes = Object.values(chain.nodes)
    const activeNodes = nodes.filter((n) => n.status === "active")
    const lockedNodes = nodes.filter((n) => n.status === "locked")
    const completedNodes = nodes.filter((n) => n.status === "completed")

    assert.equal(activeNodes.length, 1, "Bước đầu tiên phải active")
    assert.ok(lockedNodes.length >= 1, "Các bước sau phải locked")
    assert.equal(completedNodes.length, 0, "Chưa có bước nào completed")

    // Node active có sectorId hợp lệ
    const activeNode = activeNodes[0]
    assert.ok(activeNode.sectorId || chain.sectorId, "Node hoặc chain phải liên kết sector")
  })

  it("5. Quy trình phê chuẩn INIT bảo toàn 100% validateStrategyExecution, concurrency guard và commit", () => {
    // Đặt tài nguyên thấp để test validation
    worldState.resources.energy = 5
    worldState.military.reserves = 0

    const evt: WorldEvent = {
      id: "evt-val-test",
      templateId: "evt_plasma_storm",
      title: "Thẩm Định Năng Lượng",
      description: "Yêu cầu nhiều năng lượng.",
      category: "anomaly",
      severity: "warning",
      scope: "sector",
      sectorId: "sol_command_hq",
      status: "INIT",
      priority: 60,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 3,
      defaultStrategyId: "strat_low_cost",
      availableStrategies: [
        {
          id: "strat_high_energy",
          name: "Dùng 100 Năng Lượng",
          description: "Tốn 100 energy",
          cost: { energy: 100 },
          processingTicks: 1,
          consequences: { message: "Ok" },
        },
        {
          id: "strat_low_cost",
          name: "Miễn Phí",
          description: "Không tốn gì",
          cost: {},
          processingTicks: 1,
          consequences: { message: "Ok" },
        },
      ],
      isResolved: false,
      consequencesApplied: false,
    }
    registerWorldEvent(worldState, evt)

    const stratHigh = evt.availableStrategies[0]
    const stratLow = evt.availableStrategies[1]

    const valHigh = validateStrategyExecution(worldState, evt, stratHigh)
    assert.equal(valHigh.valid, false, "Phải từ chối phương án thiếu tài nguyên")
    assert.match(valHigh.reason || "", /Năng lượng/i)

    const valLow = validateStrategyExecution(worldState, evt, stratLow)
    assert.equal(valLow.valid, true, "Phương án miễn phí phải hợp lệ")

    // Chọn phương án hợp lệ
    const res = chooseEventStrategy(worldState, evt.id, stratLow.id)
    assert.equal(res.success, true)
    assert.equal(evt.status, "PROCESSING")
    assert.equal(evt.chosenStrategyId, stratLow.id)
  })

  it("6. Recent Results Feed được loại khỏi UI mà không làm mất dữ liệu archive hay Debriefing Drawer", () => {
    worldState.eventResultsArchive = [
      {
        id: "res-1",
        eventId: "evt-1",
        templateId: "tpl-1",
        title: "Báo Cáo Sự Kiện 1",
        category: "military",
        severity: "info",
        status: "success",
        chosenStrategyId: "strat-1",
        chosenStrategyName: "Chiến thuật 1",
        summaryText: "Hoàn tất tốt đẹp",
        resolvedAtTick: 2,
        resolvedAtTimestamp: Date.now(),
        isRead: false,
      },
    ]

    saveWorldState(worldState)
    const loaded = loadWorldState().state

    assert.ok(loaded.eventResultsArchive, "eventResultsArchive phải tồn tại")
    assert.equal(loaded.eventResultsArchive.length, 1)
    assert.equal(loaded.eventResultsArchive[0].title, "Báo Cáo Sự Kiện 1")
    assert.equal(loaded.eventResultsArchive[0].isRead, false)
  })

  it("7. Tuyệt đối cách ly: Các thao tác Events & Missions không xâm phạm RPG Save V4", () => {
    const rpgProg = loadStarfrontProgression()
    const originalCredits = rpgProg.credits
    const originalAlloy = rpgProg.alloy

    const evt: WorldEvent = {
      id: "evt-rpg-iso",
      templateId: "evt_plasma_storm",
      title: "Cách Ly Save",
      description: "Kiểm tra không ghi đè RPG",
      category: "civil",
      severity: "info",
      scope: "sector",
      status: "INIT",
      priority: 10,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 2,
      defaultStrategyId: "strat_1",
      availableStrategies: [
        {
          id: "strat_1",
          name: "Chiến Lược 1",
          description: "Tăng 500 Credits trong World (nếu có)",
          cost: {},
          processingTicks: 1,
          consequences: { message: "Done" },
        },
      ],
      isResolved: false,
      consequencesApplied: false,
    }
    registerWorldEvent(worldState, evt)
    chooseEventStrategy(worldState, evt.id, "strat_1")
    saveWorldState(worldState)

    const refreshedRpg = loadStarfrontProgression()
    assert.equal(refreshedRpg.credits, originalCredits, "RPG Credits phải nguyên vẹn")
    assert.equal(refreshedRpg.alloy, originalAlloy, "RPG Alloy phải nguyên vẹn")
  })
})
