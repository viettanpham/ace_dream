/**
 * STARFRONT WORLD — Phase 6.7 Test Suite
 * Kiểm thử toàn diện Động Cơ Vòng Đời Sự Kiện & Chuỗi Nhiệm Vụ Chiến Lược:
 *   1. Vòng đời sự kiện và chuyển trạng thái hợp lệ (INIT -> PROCESSING -> RESULT)
 *   2. Deadline hoạt động đúng khi online, offline và catch-up (Auto-lock Default Strategy)
 *   3. Deadline hết hạn chỉ áp dụng hậu quả một lần (Idempotency Guard)
 *   4. Mission chain tuyến tính, phân nhánh và điều kiện threshold
 *   5. Reactive, recurring và standalone không tạo sự kiện trùng (Cap = 8)
 *   6. Reload giữ nguyên lựa chọn, kết quả và tiến trình chuỗi (Safe Pruning)
 *   7. Sự kiện yêu cầu combat đi qua adapter hiện có
 *   8. Tương thích tick engine, storage và deterministic PRNG
 */

import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { createInitialWorldState } from "@/lib/game/world/initial-state"
import {
  chooseEventStrategy,
  autoLockDefaultStrategy,
  applyEventConsequencesOnce,
  resolveProcessingEvent,
  advanceEventLifecyclesAndDeadlines,
  registerWorldEvent,
  getEventById,
  getActiveEvents,
  markEventResultAsRead,
  pruneReadEventResultsSafe,
  MAX_ACTIVE_EVENTS,
} from "@/lib/game/world/event-engine"
import {
  createEventFromTemplate,
  EVENT_TEMPLATES,
} from "@/lib/game/world/event-templates"
import {
  startMissionChain,
  advanceMissionChainNode,
  evaluateMissionChainUnlocks,
  MAX_ACTIVE_MISSION_CHAINS,
  MISSION_CHAIN_TEMPLATES,
} from "@/lib/game/world/mission-chains"
import { executeWorldTick } from "@/lib/game/world/tick-engine"
import { processOfflineCatchup } from "@/lib/game/world/catchup-engine"
import { saveWorldState, loadWorldState } from "@/lib/game/world/storage"
import { commitCombatResultReceipt } from "@/lib/game/world/combat-adapter"
import { WorldPRNG } from "@/lib/game/world/random"
import type { WorldState, WorldEvent, CombatResultReceipt } from "@/lib/game/world/types"

/**
 * Mock localStorage cho môi trường Node.js kiểm thử
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
      for (const k of Object.keys(store)) {
        delete store[k]
      }
    },
  }
  ;(globalThis as any).window = {}
  ;(globalThis as any).localStorage = mockStorage
  return mockStorage
}

describe("STARFRONT WORLD — Phase 6.7: Event Lifecycle Engine & Strategic Mission Chains", () => {
  // --------------------------------------------------------------------------
  // TEST SUITE 1: VÒNG ĐỜI SỰ KIỆN & CHUYỂN TRẠNG THÁI HỢP LỆ
  // --------------------------------------------------------------------------
  it("1. Vòng đời sự kiện và chuyển trạng thái hợp lệ (INIT -> PROCESSING -> RESULT)", () => {
    const state = createInitialWorldState(101)
    const event = createEventFromTemplate("evt_plasma_storm", state.currentDay, {
      targetSectorId: "mining_outpost_k7",
    })
    assert.ok(event, "Khởi tạo sự kiện từ template thành công")
    assert.equal(event.status, "INIT", "Trạng thái ban đầu phải là INIT")

    registerWorldEvent(state, event)
    assert.equal(getActiveEvents(state).length, 1, "Sự kiện được ghi nhận vào danh sách active")

    // Chọn chiến lược hợp lệ: tăng tải khiên (tốn 60 năng lượng)
    const initialEnergy = state.resources.energy
    const chooseRes = chooseEventStrategy(state, event.id, "strat_overcharge_shields")
    assert.ok(chooseRes.success, "Chọn chiến lược hợp lệ phải thành công")
    assert.equal(chooseRes.event?.status, "PROCESSING", "Trạng thái phải chuyển sang PROCESSING")
    assert.equal(
      state.resources.energy,
      initialEnergy - 60,
      "Tài nguyên năng lượng phải bị khấu trừ chính xác"
    )
    assert.equal(
      chooseRes.event?.processingCompletesTick,
      state.currentDay + 1,
      "Thời gian hoàn tất phải được tính đúng"
    )

    // Không thể chọn lại chiến lược khi sự kiện đã ở PROCESSING
    const duplicateChoose = chooseEventStrategy(state, event.id, "strat_emergency_grid_shutdown")
    assert.equal(
      duplicateChoose.success,
      false,
      "Không thể chọn lại chiến lược khi sự kiện đang PROCESSING"
    )

    // Đạt thời gian hoàn thành -> Giải quyết sự kiện
    state.currentDay = chooseRes.event!.processingCompletesTick!
    const resolveRes = resolveProcessingEvent(state, chooseRes.event!)
    assert.ok(resolveRes.success, "Giải quyết sự kiện PROCESSING phải thành công")
    assert.equal(chooseRes.event?.status, "RESULT", "Trạng thái phải chuyển sang RESULT")
    assert.ok(chooseRes.event?.result, "Phải sinh ra bản ghi kết quả WorldEventResult")
    assert.equal(state.eventResultsArchive?.length, 1, "Kết quả phải được lưu vào archive")
  })

  // --------------------------------------------------------------------------
  // TEST SUITE 2: DEADLINE HOẠT ĐỘNG ĐÚNG KHI ONLINE, OFFLINE VÀ CATCH-UP
  // --------------------------------------------------------------------------
  it("2. Deadline hoạt động đúng khi online, offline và catch-up (Auto-lock Default Strategy)", async () => {
    const state = createInitialWorldState(202)
    const event = createEventFromTemplate("evt_civil_unrest_strike", state.currentDay, {
      targetSectorId: "mining_outpost_k7",
      deadlineTicks: 2,
    })
    assert.ok(event)
    registerWorldEvent(state, event)

    // Tick 1 (Ngày 1 -> 2): Deadline chưa hết (decisionDeadlineTick = 3)
    executeWorldTick(state)
    assert.equal(state.currentDay, 2)
    assert.equal(event.status, "INIT", "Sự kiện vẫn ở INIT tại ngày 2")

    // Tick 2 (Ngày 2 -> 3): Chưa hết hạn trong Phase 5 (currentDay=2 < 3)
    executeWorldTick(state)
    assert.equal(state.currentDay, 3)

    // Tick 3 (Ngày 3 -> 4): Đạt hạn chót (currentDay = 3 >= decisionDeadlineTick)
    executeWorldTick(state)
    assert.equal(state.currentDay, 4)
    assert.equal(
      event.status,
      "PROCESSING",
      "Sự kiện phải tự động chuyển sang PROCESSING với chiến lược mặc định khi hết hạn"
    )
    assert.equal(
      event.chosenStrategyId,
      event.defaultStrategyId,
      "Chiến lược được chọn phải là defaultStrategyId"
    )

    // Kiểm tra đếm ngược trong Offline Catch-up
    const offlineEvent = createEventFromTemplate("evt_urgent_supply_request", state.currentDay, {
      targetSectorId: "asteroid_delta",
      deadlineTicks: 1,
    })
    assert.ok(offlineEvent)
    registerWorldEvent(state, offlineEvent)

    // Tua nhanh 3 ngày ngoại tuyến (3 ticks x 300,000ms = 900,000ms)
    const now = state.realTimeAnchor + 900000
    const catchupRes = await processOfflineCatchup(state, { currentTimestamp: now })
    assert.ok(catchupRes.ticksApplied >= 3, "Catchup phải áp dụng ít nhất 3 ticks")
    assert.equal(
      offlineEvent.status,
      "RESULT",
      "Sự kiện phải hoàn tất đầy đủ vòng đời INIT -> PROCESSING -> RESULT qua catch-up"
    )
    assert.equal(offlineEvent.result?.status, "expired_default")
  })

  // --------------------------------------------------------------------------
  // TEST SUITE 3: DEADLINE HẾT HẠN CHỈ ÁP DỤNG HẬU QUẢ MỘT LẦN (IDEMPOTENCY)
  // --------------------------------------------------------------------------
  it("3. Deadline hết hạn chỉ áp dụng hậu quả một lần (Idempotency Guard)", () => {
    const state = createInitialWorldState(303)
    const sector = state.sectors["mining_outpost_k7"]
    const initialStability = sector.stability
    const initialMats = state.resources.industrialMaterials

    const event = createEventFromTemplate("evt_food_supply_blight", state.currentDay, {
      targetSectorId: sector.id,
      deadlineTicks: 1,
    })
    assert.ok(event)
    registerWorldEvent(state, event)

    // Khóa mặc định và xử lý
    autoLockDefaultStrategy(state, event)
    assert.equal(event.status, "PROCESSING")

    // Hoàn tất sự kiện lần 1
    state.currentDay = event.processingCompletesTick!
    const resolve1 = resolveProcessingEvent(state, event)
    assert.ok(resolve1.success)
    assert.equal(event.consequencesApplied, true, "Đã đánh dấu consequencesApplied")

    const stabilityAfterFirst = sector.stability
    const matsAfterFirst = state.resources.industrialMaterials

    // Gọi lại lần 2 bằng resolveProcessingEvent
    const resolve2 = resolveProcessingEvent(state, event)
    assert.equal(resolve2.success, false, "Lần resolve thứ 2 phải bị từ chối")
    assert.equal(
      sector.stability,
      stabilityAfterFirst,
      "Stability không được bị trừ thêm lần thứ 2"
    )
    assert.equal(
      state.resources.industrialMaterials,
      matsAfterFirst,
      "Materials không được bị thay đổi lần thứ 2"
    )

    // Thử cưỡng ép gọi applyEventConsequencesOnce trực tiếp
    const forceApply = applyEventConsequencesOnce(state, event, {
      stabilityDelta: -50,
      resourceDelta: { industrialMaterials: -500 },
      message: "Hacked trigger",
    })
    assert.equal(forceApply.applied, false, "Guard consequencesApplied phải chặn áp dụng")
    assert.equal(
      sector.stability,
      stabilityAfterFirst,
      "Stability bảo toàn tuyệt đối sau nỗ lực gọi đúp"
    )
  })

  // --------------------------------------------------------------------------
  // TEST SUITE 4: MISSION CHAIN TUYẾN TÍNH, PHÂN NHÁNH VÀ NGƯỠNG THRESHOLD
  // --------------------------------------------------------------------------
  it("4. Mission chain tuyến tính, phân nhánh và điều kiện threshold", () => {
    const state = createInitialWorldState(404)

    // 4.1. Linear Chain: Bước 1 -> Bước 2 -> Bước 3
    const linearRes = startMissionChain(state, "chain_linear_void_inquiry", {
      targetSectorId: "helios_perimeter",
    })
    assert.ok(linearRes.success, "Khởi tạo linear mission chain thành công")
    const linearChain = linearRes.chain!
    assert.equal(linearChain.currentNodeId, "node_step_1_scout")
    assert.equal(linearChain.nodes["node_step_2_skirmish"].status, "locked")

    // Hoàn thành Bước 1 -> Mở khóa Bước 2
    const advStep1 = advanceMissionChainNode(state, linearChain.id, "node_step_1_scout")
    assert.ok(advStep1.success)
    assert.equal(linearChain.currentNodeId, "node_step_2_skirmish")
    assert.equal(linearChain.nodes["node_step_2_skirmish"].status, "active")

    // Hoàn thành Bước 2 -> Mở khóa Bước 3
    const advStep2 = advanceMissionChainNode(state, linearChain.id, "node_step_2_skirmish")
    assert.ok(advStep2.success)
    assert.equal(linearChain.currentNodeId, "node_step_3_decisive")

    // Hoàn thành Bước 3 -> Hoàn tất toàn bộ chuỗi
    const advStep3 = advanceMissionChainNode(state, linearChain.id, "node_step_3_decisive")
    assert.ok(advStep3.isChainCompleted, "Chuỗi tuyến tính phải hoàn tất sau bước cuối cùng")
    assert.equal(linearChain.status, "completed")
    assert.ok(state.completedMissionChainIds.includes(linearChain.id))

    // 4.2. Branching Chain: Rẽ nhánh tất định theo chiến lược đã chọn
    const branchRes = startMissionChain(state, "chain_branching_mining_crisis", {
      targetSectorId: "mining_outpost_k7",
    })
    assert.ok(branchRes.success)
    const branchChain = branchRes.chain!

    // Chọn phương án đàm phán cứu trợ (strat_negotiate_rations) -> Mở Nhánh Dân Sự
    const branchAdv = advanceMissionChainNode(
      state,
      branchChain.id,
      "node_crisis_initial",
      "strat_negotiate_rations"
    )
    assert.ok(branchAdv.success)
    assert.equal(branchChain.currentNodeId, "node_branch_diplomatic_relief")
    assert.equal(branchChain.nodes["node_branch_diplomatic_relief"].status, "active")
    assert.equal(branchChain.nodes["node_branch_military_crackdown"].status, "locked")

    // 4.3. Threshold Chain: Kích hoạt khi Threat >= 600
    state.sectors["asteroid_delta"].threatLevel = 650
    const prng = new WorldPRNG(state.worldSeed)
    const unlockRes = evaluateMissionChainUnlocks(state, prng)
    assert.ok(
      unlockRes.activatedChains.some((id) => id.includes("chain_threshold_asteroid_delta")),
      "Phải kích hoạt chuỗi phòng tuyến khẩn nguy cho sector vượt ngưỡng Threat 600"
    )
  })

  // --------------------------------------------------------------------------
  // TEST SUITE 5: REACTIVE, RECURRING VÀ STANDALONE KHÔNG TẠO SỰ KIỆN TRÙNG (CAP = 8)
  // --------------------------------------------------------------------------
  it("5. Reactive, recurring và standalone không tạo sự kiện trùng (Cap = 8)", () => {
    const state = createInitialWorldState(505)
    const prng = new WorldPRNG(state.worldSeed)

    // 5.1. Reactive Chain: Kích hoạt khi Under Siege
    state.sectors["helios_perimeter"].stage = "under_siege"
    const eval1 = evaluateMissionChainUnlocks(state, prng)
    assert.ok(
      eval1.activatedChains.some((id) => id.includes("chain_reactive_helios_perimeter")),
      "Sector under_siege phải kích hoạt reactive rescue chain"
    )

    // Chạy lại đánh giá: Không được kích hoạt trùng thêm 1 chuỗi reactive nữa cho cùng sector
    const eval2 = evaluateMissionChainUnlocks(state, prng)
    const duplicateCount = eval2.activatedChains.filter((id) =>
      id.includes("chain_reactive_helios_perimeter")
    ).length
    assert.equal(duplicateCount, 0, "Không được sinh chuỗi reactive trùng lặp")

    // 5.2. Periodic Chain: Không sinh vô hạn trong cùng một tick
    const periodicTemplate = MISSION_CHAIN_TEMPLATES["chain_periodic_patrol"]
    assert.ok(periodicTemplate.recurringIntervalTicks)
    const p1 = startMissionChain(state, "chain_periodic_patrol", {
      customChainId: "chain_patrol_1",
    })
    assert.ok(p1.success)

    // Cố tình kích hoạt lại chuỗi periodic trong khi chuỗi cũ đang active -> Bị từ chối
    const p2 = startMissionChain(state, "chain_periodic_patrol", {
      customChainId: "chain_patrol_1",
    })
    assert.equal(p2.success, false, "Không thể bắt đầu chuỗi nhiệm vụ trùng ID đang active")

    // 5.3. Giới hạn trần MAX_ACTIVE_MISSION_CHAINS = 8
    // Lấp đầy danh sách active chains cho đủ 8 chuỗi
    for (let i = state.activeMissionChains.length; i < MAX_ACTIVE_MISSION_CHAINS; i++) {
      startMissionChain(state, "chain_standalone_ancient_cache", {
        customChainId: `chain_standalone_filler_${i}`,
      })
    }
    assert.equal(
      state.activeMissionChains.length,
      MAX_ACTIVE_MISSION_CHAINS,
      "Đã đạt đúng 8 chuỗi nhiệm vụ"
    )

    // Cố tình mở chuỗi thứ 9 -> Phải bị từ chối dứt khoát
    const overflowChain = startMissionChain(state, "chain_linear_void_inquiry", {
      customChainId: "chain_overflow_9",
    })
    assert.equal(overflowChain.success, false, "Vượt quá trần 8 chuỗi phải bị từ chối")
    assert.ok(overflowChain.error?.includes("Đã đạt trần 8"))
  })

  // --------------------------------------------------------------------------
  // TEST SUITE 6: RELOAD GIỮ NGUYÊN TIẾN TRÌNH & SAFE PRUNING
  // --------------------------------------------------------------------------
  it("6. Reload giữ nguyên lựa chọn, kết quả và tiến trình chuỗi (Safe Pruning)", () => {
    setupMockLocalStorage()
    const state = createInitialWorldState(606)

    // Tạo 1 sự kiện đang PROCESSING và 1 sự kiện đã RESULT
    const eventProc = createEventFromTemplate("evt_energy_grid_surge", state.currentDay, {
      eventId: "evt_proc_saved",
    })
    assert.ok(eventProc)
    registerWorldEvent(state, eventProc)
    chooseEventStrategy(state, eventProc.id, "strat_divert_to_batteries")

    const eventRes = createEventFromTemplate("evt_derelict_warship_salvage", state.currentDay, {
      eventId: "evt_res_saved",
    })
    assert.ok(eventRes)
    registerWorldEvent(state, eventRes)
    chooseEventStrategy(state, eventRes.id, "strat_quick_data_core_extraction")
    state.currentDay = eventRes.processingCompletesTick!
    resolveProcessingEvent(state, eventRes)

    // Lưu vào Storage
    const saveRes = saveWorldState(state)
    assert.ok(saveRes.success, "Lưu World State V1 thành công")

    // Nạp lại từ Storage
    const loadRes = loadWorldState()
    assert.ok(loadRes.checksumVerified, "Xác minh Checksum thành công sau khi nạp")
    const loadedState = loadRes.state

    // Xác minh sự kiện PROCESSING giữ nguyên vẹn
    const restoredProc = getEventById(loadedState, "evt_proc_saved")
    assert.ok(restoredProc)
    assert.equal(restoredProc.status, "PROCESSING")
    assert.equal(restoredProc.chosenStrategyId, "strat_divert_to_batteries")
    assert.equal(restoredProc.processingCompletesTick, eventProc.processingCompletesTick)

    // Xác minh kết quả trong archive giữ nguyên vẹn
    assert.equal(loadedState.eventResultsArchive?.length, 1)
    const archived = loadedState.eventResultsArchive![0]
    assert.equal(archived.eventId, "evt_res_saved")
    assert.equal(archived.isRead, false)

    // Kiểm tra Safe Pruning: Đánh dấu đã đọc và xóa an toàn
    const sectorStabilityBefore = loadedState.sectors["sol_command_hq"].stability
    const materialsBefore = loadedState.resources.industrialMaterials
    const militaryBefore = loadedState.military.deployed

    markEventResultAsRead(loadedState, archived.id)
    assert.equal(archived.isRead, true)

    const pruneRes = pruneReadEventResultsSafe(loadedState)
    assert.equal(pruneRes.prunedCount, 1)
    assert.equal(loadedState.eventResultsArchive?.length, 0, "Bản ghi hiển thị đã được dọn sạch")

    // Tuyệt đối không làm suy giảm chỉ số trong WorldState
    assert.equal(
      loadedState.sectors["sol_command_hq"].stability,
      sectorStabilityBefore,
      "Stability không bị đổi"
    )
    assert.equal(
      loadedState.resources.industrialMaterials,
      materialsBefore,
      "Materials không bị đổi"
    )
    assert.equal(
      loadedState.military.deployed,
      militaryBefore,
      "Military không bị đổi"
    )
  })

  // --------------------------------------------------------------------------
  // TEST SUITE 7: SỰ KIỆN YÊU CẦU COMBAT ĐI QUA ADAPTER HIỆN CÓ
  // --------------------------------------------------------------------------
  it("7. Sự kiện yêu cầu combat đi qua adapter hiện có", () => {
    const state = createInitialWorldState(707)
    const targetSector = "helios_perimeter"

    const event = createEventFromTemplate("evt_void_skirmish_raid", state.currentDay, {
      targetSectorId: targetSector,
    })
    assert.ok(event)
    registerWorldEvent(state, event)

    // Chọn chiến lược "Xuất Kích Đồn Trú Đánh Chặn" (requiresCombat = true)
    const chooseRes = chooseEventStrategy(state, event.id, "strat_scramble_garrison")
    assert.ok(chooseRes.success)
    assert.ok(event.encounterTransactionId, "Phải sinh ra Transaction ID từ Combat Adapter")

    // Sector phải bị khóa trận đấu
    assert.equal(
      state.sectors[targetSector].isLockedForCombat,
      true,
      "Sector phải bị khóa isLockedForCombat"
    )

    // Giả lập trận đấu diễn ra và trả biên lai qua commitCombatResultReceipt
    const receipt: CombatResultReceipt = {
      transactionId: event.encounterTransactionId!,
      encounterId: `enc_${event.encounterTransactionId}`,
      combatVersion: "v1",
      sectorId: targetSector,
      victory: true,
      rounds: 4,
      playerRemainingHpPercent: 88,
      enemyRemainingHpPercent: 0,
      completedAtTimestamp: Date.now(),
    }

    const commitRes = commitCombatResultReceipt(state, receipt)
    assert.ok(commitRes.applied, "Biên lai combat được commit hợp lệ qua adapter")
    assert.equal(
      state.sectors[targetSector].isLockedForCombat,
      false,
      "Sector được mở khóa sau khi commit"
    )

    // Đạt thời gian hoàn tất -> Resolve sự kiện
    state.currentDay = event.processingCompletesTick!
    const resolveRes = resolveProcessingEvent(state, event)
    assert.ok(resolveRes.success, "Sự kiện hoàn tất sau khi combat đã được commit")
    assert.equal(event.status, "RESULT")
  })

  // --------------------------------------------------------------------------
  // TEST SUITE 8: TƯƠNG THÍCH TICK ENGINE, STORAGE VÀ DETERMINISTIC PRNG
  // --------------------------------------------------------------------------
  it("8. Tương thích tick engine, storage và deterministic PRNG", () => {
    // Chạy 2 chuỗi tick độc lập với cùng seed = 998877
    const seed = 998877

    const stateA = createInitialWorldState(seed)
    const stateB = createInitialWorldState(seed)

    // Bắt đầu cùng chuỗi nhiệm vụ tuyến tính trên cả 2 state
    startMissionChain(stateA, "chain_linear_void_inquiry", {
      customChainId: "chain_det_test",
      targetSectorId: "helios_perimeter",
    })
    startMissionChain(stateB, "chain_linear_void_inquiry", {
      customChainId: "chain_det_test",
      targetSectorId: "helios_perimeter",
    })

    // Cho chạy 5 ticks liên tiếp
    for (let day = 1; day <= 5; day++) {
      executeWorldTick(stateA)
      executeWorldTick(stateB)
    }

    assert.equal(stateA.currentDay, stateB.currentDay, "Số ngày chiến lược phải bằng nhau")
    assert.equal(stateA.worldSeed, stateB.worldSeed, "PRNG Seed phải tiến hóa giống hệt nhau")
    assert.equal(
      stateA.resources.food,
      stateB.resources.food,
      "Lương thực phải trùng khớp hoàn toàn"
    )
    assert.equal(
      stateA.sectors["mining_outpost_k7"].threatLevel,
      stateB.sectors["mining_outpost_k7"].threatLevel,
      "Threat tại mining_outpost_k7 phải trùng khớp hoàn toàn"
    )
    assert.equal(
      Object.keys(stateA.events || {}).length,
      Object.keys(stateB.events || {}).length,
      "Số lượng sự kiện được sinh phải bằng nhau"
    )
    assert.equal(
      stateA.eventResultsArchive?.length,
      stateB.eventResultsArchive?.length,
      "Số lượng kết quả archive phải bằng nhau"
    )
  })
})
