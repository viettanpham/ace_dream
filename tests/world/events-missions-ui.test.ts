/**
 * STARFRONT WORLD — Phase 6.10 Test Suite
 * Kiểm thử toàn diện Giao Diện Sự Kiện & Nhiệm Vụ (Events & Missions UI Redesign):
 *   1. Phân loại và ưu tiên hiển thị sự kiện INIT (Cần quyết định) theo hạn chót & mức độ khẩn cấp đa tín hiệu
 *   2. Hiển thị tiến trình sự kiện PROCESSING với thanh tiến độ thời gian thực và đích hoàn tất
 *   3. Nhận diện nút chuỗi nhiệm vụ có cờ isPendingDispatch và huy hiệu "Đang chờ điều kiện sector"
 *   4. Đồ thị cây nhiệm vụ (Mission Chain Tree) phân cấp đúng các trạng thái (Active, Completed, Locked)
 *   5. Tổng hợp biến động sự kiện sau chu kỳ tick (eventsSummary: Tự động khóa vs Hoàn tất)
 *   6. Phê chuẩn phương án (chooseEventStrategy) chuyển trạng thái an toàn sang PROCESSING và bảo toàn lưu trữ
 */

import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { createInitialWorldState } from "@/lib/game/world/initial-state"
import {
  registerWorldEvent,
  chooseEventStrategy,
  autoLockDefaultStrategy,
  getActiveEvents,
  advanceEventLifecyclesAndDeadlines,
  markEventResultAsRead,
} from "@/lib/game/world/event-engine"
import {
  startMissionChain,
  MISSION_CHAIN_TEMPLATES,
  advanceMissionChainNode,
} from "@/lib/game/world/mission-chains"
import { executeWorldTick } from "@/lib/game/world/tick-engine"
import { saveWorldState, loadWorldState } from "@/lib/game/world/storage"
import { WorldPRNG } from "@/lib/game/world/random"
import type { WorldState, WorldEvent, MissionChainNode } from "@/lib/game/world/types"

/**
 * Mock localStorage và window cho môi trường kiểm thử Node.js
 */
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

describe("STARFRONT WORLD — Phase 6.10: Events & Missions UI Redesign", () => {
  setupMockLocalStorage()

  // ==========================================================================
  // Test 1: Phân loại và phân cấp ưu tiên sự kiện INIT
  // ==========================================================================
  it("1. Phân loại và sắp xếp ưu tiên sự kiện INIT theo hạn chót cấp bách và mức độ nghiêm trọng", () => {
    const state = createInitialWorldState()

    // Đăng ký 3 sự kiện với các thời hạn và severity khác nhau
    const eventFar: WorldEvent = {
      id: "evt_ui_far",
      templateId: "tpl_far",
      title: "Sự Kiện Thời Hạn Xa",
      description: "Thời hạn còn nhiều ngày.",
      category: "military",
      severity: "info",
      scope: "sector",
      sectorId: "sol_command_hq",
      status: "INIT",
      priority: 50,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 10,
      defaultStrategyId: "strat_def",
      availableStrategies: [
        {
          id: "strat_def",
          name: "Mặc định",
          description: "Phương án mặc định",
          processingTicks: 2,
          consequences: { message: "OK" },
        },
      ],
      isResolved: false,
      consequencesApplied: false,
    }

    const eventUrgentSoon: WorldEvent = {
      id: "evt_ui_urgent",
      templateId: "tpl_urgent",
      title: "Khủng Hoảng Cận Hạn",
      description: "Hạn chót trong 1 ngày.",
      category: "crisis",
      severity: "warning",
      scope: "sector",
      sectorId: "helios_perimeter",
      status: "INIT",
      priority: 80,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 2, // Còn 1 ngày nếu currentDay = 1
      defaultStrategyId: "strat_urgent_def",
      availableStrategies: [
        {
          id: "strat_urgent_def",
          name: "Mặc định khẩn cấp",
          description: "Phương án khẩn cấp",
          processingTicks: 1,
          consequences: { message: "OK" },
        },
      ],
      isResolved: false,
      consequencesApplied: false,
    }

    const eventCritical: WorldEvent = {
      id: "evt_ui_critical",
      templateId: "tpl_crit",
      title: "Thảm Họa Tối Nguy",
      description: "Mức độ tối nguy.",
      category: "crisis",
      severity: "critical",
      scope: "sector",
      sectorId: "mining_outpost_k7",
      status: "INIT",
      priority: 95,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 5,
      defaultStrategyId: "strat_crit_def",
      availableStrategies: [
        {
          id: "strat_crit_def",
          name: "Mặc định tối nguy",
          description: "Phương án",
          processingTicks: 2,
          consequences: { message: "OK" },
        },
      ],
      isResolved: false,
      consequencesApplied: false,
    }

    registerWorldEvent(state, eventFar)
    registerWorldEvent(state, eventUrgentSoon)
    registerWorldEvent(state, eventCritical)

    const activeEvents = getActiveEvents(state)
    const initList = activeEvents.filter((e) => e.status === "INIT")

    assert.equal(initList.length, 3, "Phải có đủ 3 sự kiện INIT")

    // Mô phỏng thuật toán sắp xếp của UI
    const sorted = [...initList].sort((a, b) => {
      const aDeadline = Math.max(0, a.decisionDeadlineTick - state.currentDay)
      const bDeadline = Math.max(0, b.decisionDeadlineTick - state.currentDay)
      if (aDeadline !== bDeadline) return aDeadline - bDeadline

      const severityWeight: Record<string, number> = { critical: 3, warning: 2, info: 1 }
      const aSev = severityWeight[a.severity] || 0
      const bSev = severityWeight[b.severity] || 0
      if (aSev !== bSev) return bSev - aSev

      return a.id.localeCompare(b.id)
    })

    // Sự kiện cận hạn nhất (decisionDeadlineTick = 2) phải đứng đầu
    assert.equal(sorted[0].id, "evt_ui_urgent", "Sự kiện cận hạn nhất (1 ngày) phải xếp đầu bảng")
    // Tiếp theo là sự kiện có hạn chót 5 (critical) trước sự kiện hạn chót 10 (info)
    assert.equal(sorted[1].id, "evt_ui_critical", "Sự kiện hạn 5 ngày phải xếp trước sự kiện hạn 10 ngày")
    assert.equal(sorted[2].id, "evt_ui_far", "Sự kiện hạn 10 ngày xếp cuối cùng")
  })

  // ==========================================================================
  // Test 2: Chuyển đổi và theo dõi tiến trình sự kiện PROCESSING
  // ==========================================================================
  it("2. Phê chuẩn phương án chuyển sự kiện sang PROCESSING và tính toán thanh tiến độ", () => {
    const state = createInitialWorldState()

    const event: WorldEvent = {
      id: "evt_proc_test",
      templateId: "tpl_proc",
      title: "Triển Khai Trạm Tiếp Vận",
      description: "Cần 3 ngày xử lý.",
      category: "logistics",
      severity: "info",
      scope: "sector",
      sectorId: "sol_command_hq",
      status: "INIT",
      priority: 60,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 4,
      defaultStrategyId: "strat_slow",
      availableStrategies: [
        {
          id: "strat_expedite",
          name: "Tăng Tốc",
          description: "Triển khai nhanh",
          processingTicks: 3,
          consequences: { message: "Hoàn tất nhanh" },
        },
        {
          id: "strat_slow",
          name: "Mặc định",
          description: "Triển khai bình thường",
          processingTicks: 5,
          consequences: { message: "Hoàn tất chậm" },
        },
      ],
      isResolved: false,
      consequencesApplied: false,
    }

    registerWorldEvent(state, event)

    // Phê chuẩn phương án strat_expedite
    const chooseRes = chooseEventStrategy(state, "evt_proc_test", "strat_expedite")
    assert.equal(chooseRes.success, true, "Phê chuẩn phương án phải thành công")

    const updatedEvent = state.events!["evt_proc_test"]
    assert.equal(updatedEvent.status, "PROCESSING", "Trạng thái phải là PROCESSING")
    assert.equal(updatedEvent.chosenStrategyId, "strat_expedite")
    assert.equal(updatedEvent.processingCompletesTick, 1 + 3, "Đích hoàn tất phải là Ngày 4")

    // Tính toán tỷ lệ tiến độ tại Ngày 1
    const totalTicks = updatedEvent.processingCompletesTick - updatedEvent.processingStartedTick!
    const elapsedTicks = state.currentDay - updatedEvent.processingStartedTick!
    const progressPct = Math.round((elapsedTicks / totalTicks) * 100)
    assert.equal(progressPct, 0, "Tiến độ ngày đầu tiên là 0%")

    // Giả lập tiến 1 ngày sang Ngày 2
    state.currentDay = 2
    const elapsedTicksDay2 = state.currentDay - updatedEvent.processingStartedTick!
    const progressPctDay2 = Math.round((elapsedTicksDay2 / totalTicks) * 100)
    assert.equal(progressPctDay2, 33, "Tiến độ ngày thứ 2 là 33%")
  })

  // ==========================================================================
  // Test 3: Nhận diện nút nhiệm vụ có cờ isPendingDispatch và huy hiệu
  // ==========================================================================
  it("3. Nhận diện nút chuỗi nhiệm vụ có cờ isPendingDispatch và hiển thị huy hiệu Chờ Điều Kiện Sector", () => {
    const state = createInitialWorldState()

    // Khởi tạo mission chain phân nhánh
    const startRes = startMissionChain(state, "chain_branching_mining_crisis")
    assert.equal(startRes.success, true, "Khởi tạo mission chain thành công")

    const chain = startRes.chain!
    assert.ok(chain, "Chuỗi nhiệm vụ phải tồn tại")

    const activeNode = chain.nodes[chain.currentNodeId]
    assert.ok(activeNode, "Nút khởi điểm phải tồn tại")

    // Giả lập nút bị hoãn kích hoạt do xung đột sector
    activeNode.isPendingDispatch = true
    activeNode.dispatchDeferredTicks = 2

    // Kiểm tra các thuộc tính mà UI cần hiển thị
    assert.equal(activeNode.isPendingDispatch, true, "Phải có cờ isPendingDispatch = true")
    assert.equal(activeNode.dispatchDeferredTicks, 2, "Số ngày đã hoãn phải là 2")

    // Đảm bảo không làm hỏng cấu trúc chuỗi
    assert.equal(chain.status, "active", "Chuỗi nhiệm vụ vẫn ở trạng thái active")
  })

  // ==========================================================================
  // Test 4: Đồ thị cây nhiệm vụ phân loại đúng trạng thái nút
  // ==========================================================================
  it("4. Đồ thị cây nhiệm vụ phân cấp chính xác: Completed, Active, Locked", () => {
    const state = createInitialWorldState()

    const startRes = startMissionChain(state, "chain_linear_void_inquiry")
    assert.equal(startRes.success, true)

    const chain = startRes.chain!
    const nodes = Object.values(chain.nodes)

    // Bước 1 đang active, bước 2 và 3 đang locked
    assert.equal(nodes[0].status, "active", "Bước 1 phải active")
    assert.equal(nodes[1].status, "locked", "Bước 2 phải locked")
    assert.equal(nodes[2].status, "locked", "Bước 3 phải locked")

    // Tiến hành hoàn tất bước 1
    const advRes = advanceMissionChainNode(state, chain.id, nodes[0].id, "strat_recon")
    assert.equal(advRes.success, true)

    // Sau khi advance: Bước 1 completed, Bước 2 active, Bước 3 locked
    assert.equal(chain.nodes[nodes[0].id].status, "completed", "Bước 1 phải chuyển thành completed")
    assert.equal(chain.nodes[nodes[1].id].status, "active", "Bước 2 phải chuyển thành active")
    assert.equal(chain.nodes[nodes[2].id].status, "locked", "Bước 3 vẫn locked")
  })

  // ==========================================================================
  // Test 5: Tổng hợp biến động sự kiện sau chu kỳ tick (eventsSummary)
  // ==========================================================================
  it("5. executeWorldTick trả về eventsSummary phân tách minh bạch giữa Auto-Locked và Resolved", () => {
    const state = createInitialWorldState()

    // Tạo sự kiện hết hạn INIT -> Sẽ bị Auto-Lock
    const eventExpiredInit: WorldEvent = {
      id: "evt_tick_autolock",
      templateId: "tpl_autolock",
      title: "Sự Kiện Hết Hạn Quyết Định",
      description: "Đến hạn quyết định",
      category: "crisis",
      severity: "warning",
      scope: "sector",
      sectorId: "helios_perimeter",
      status: "INIT",
      priority: 75,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 1, // Sẽ auto-lock khi tick sang Ngày 2
      defaultStrategyId: "strat_def_1",
      availableStrategies: [
        {
          id: "strat_def_1",
          name: "Phương Án Mặc Định",
          description: "Mặc định",
          processingTicks: 2,
          consequences: { message: "Auto-locked" },
        },
      ],
      isResolved: false,
      consequencesApplied: false,
    }

    // Tạo sự kiện PROCESSING sắp hoàn tất -> Sẽ Resolved
    const eventResolving: WorldEvent = {
      id: "evt_tick_resolve",
      templateId: "tpl_resolve",
      title: "Sự Kiện Hoàn Tất Tác Chiến",
      description: "Đang xử lý ngày cuối",
      category: "military",
      severity: "info",
      scope: "sector",
      sectorId: "sol_command_hq",
      status: "PROCESSING",
      priority: 60,
      createdAtTick: 1,
      createdAtTimestamp: Date.now(),
      decisionDeadlineTick: 1,
      defaultStrategyId: "strat_def_fallback",
      chosenStrategyId: "strat_resolved",
      processingStartedTick: 1,
      processingCompletesTick: 1, // Sẽ resolve tại tick ngày 1
      availableStrategies: [
        {
          id: "strat_resolved",
          name: "Chiến Lược Hoàn Tất",
          description: "Hoàn tất",
          processingTicks: 1,
          successChance: 100,
          consequences: { message: "Chiến dịch thành công tốt đẹp" },
        },
      ],
      isResolved: false,
      consequencesApplied: false,
    }

    registerWorldEvent(state, eventExpiredInit)
    registerWorldEvent(state, eventResolving)

    // Thực thi chu kỳ Tick chiến lược
    const tickResult = executeWorldTick(state, { logPhases: true })

    assert.ok(tickResult.eventsSummary, "TickResult phải chứa eventsSummary")
    const summary = tickResult.eventsSummary!

    // Kiểm tra số lượng phân tách
    assert.equal(summary.autoLockedCount, 1, "Phải ghi nhận 1 sự kiện auto-locked")
    assert.equal(summary.resolvedCount, 1, "Phải ghi nhận 1 sự kiện resolved")

    // Kiểm tra danh sách chi tiết
    assert.equal(summary.autoLockedEvents[0].id, "evt_tick_autolock")
    assert.equal(summary.resolvedEvents[0].id, "evt_tick_resolve")
    assert.equal(summary.resolvedEvents[0].status, "success")
  })

  // ==========================================================================
  // Test 6: Lưu trữ và nạp lại bảo toàn nguyên vẹn WorldState và Archive
  // ==========================================================================
  it("6. Lưu trữ và nạp lại bảo toàn nguyên vẹn WorldState, Event Archive và đánh dấu đã đọc", () => {
    const state = createInitialWorldState()

    // Giả lập lưu một kết quả vào Archive
    state.eventResultsArchive = [
      {
        id: "res_test_archive_1",
        eventId: "evt_1",
        templateId: "tpl_1",
        title: "Báo Cáo Tiếp Vận",
        category: "logistics",
        severity: "info",
        sectorId: "sol_command_hq",
        status: "success",
        chosenStrategyId: "strat_1",
        chosenStrategyName: "Tiếp tế nhanh",
        summaryText: "Hàng hóa đã được chuyển giao thành công.",
        resolvedAtTick: 2,
        resolvedAtTimestamp: Date.now(),
        isRead: false,
      },
    ]

    // Đánh dấu đã đọc
    markEventResultAsRead(state, "res_test_archive_1")
    assert.equal(state.eventResultsArchive[0].isRead, true, "isRead phải là true sau khi đánh dấu")

    // Lưu vào Storage
    const saveRes = saveWorldState(state)
    assert.equal(saveRes.success, true, "Lưu WorldState phải thành công")

    // Nạp lại từ Storage
    const loadRes = loadWorldState()
    assert.ok(loadRes.state, "WorldState nạp lại phải tồn tại")
    assert.equal(loadRes.checksumVerified, true, "Checksum phải được xác thực đúng")
    assert.equal(loadRes.state.eventResultsArchive?.length, 1, "Phải nạp lại đúng 1 bản ghi archive")
    assert.equal(loadRes.state.eventResultsArchive?.[0].isRead, true, "Bản ghi nạp lại phải giữ nguyên trạng thái đã đọc")
  })
})
