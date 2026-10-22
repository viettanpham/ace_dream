/**
 * STARFRONT WORLD — Event Concurrency Guard & Deadline Resolution Test Suite (Phase 6.8 / Đợt 1)
 *
 * Kiểm thử tập trung 6 ca kiểm thử cốt lõi:
 *   1. Hai sự kiện trùng loại trên cùng sector (Duplicate template blocked)
 *   2. Hai sự kiện khác loại có thể tồn tại đồng thời trên cùng sector (Cross-category coexistence)
 *   3. Sự kiện bị chặn không khiến mission chain bị kẹt (Deferred dispatch & safe fallback)
 *   4. Nhiều deadline trùng nhau trong cùng tick được xử lý tất định (Deterministic Tie-Breaking)
 *   5. Kết quả và hậu quả không bị áp dụng hai lần sau reload hoặc gọi lại (Idempotency Guard)
 *   6. Sự kiện mới phát sinh từ mission chain được xử lý đúng (No premature resolution)
 */

import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { createInitialWorldState } from "@/lib/game/world/initial-state"
import {
  canRegisterWorldEvent,
  registerWorldEvent,
  chooseEventStrategy,
  autoLockDefaultStrategy,
  resolveProcessingEvent,
  advanceEventLifecyclesAndDeadlines,
  getActiveEvents,
  applyEventConsequencesOnce,
  MAX_ACTIVE_EVENTS,
} from "@/lib/game/world/event-engine"
import { createEventFromTemplate } from "@/lib/game/world/event-templates"
import {
  startMissionChain,
  advanceMissionChainNode,
  retryPendingMissionChainDispatches,
  MAX_DISPATCH_DEFER_TICKS,
} from "@/lib/game/world/mission-chains"
import { executeWorldTick } from "@/lib/game/world/tick-engine"
import { WorldPRNG } from "@/lib/game/world/random"
import { saveWorldState, loadWorldState } from "@/lib/game/world/storage"
import type { WorldState, WorldEvent } from "@/lib/game/world/types"

/**
 * Mock localStorage cho môi trường kiểm thử Node.js
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

describe("STARFRONT WORLD — Event Concurrency Guard & Deadline Resolution", () => {
  // --------------------------------------------------------------------------
  // TEST 1: HAI SỰ KIỆN TRÙNG LOẠI TRÊN CÙNG SECTOR
  // --------------------------------------------------------------------------
  it("1. Ngăn chặn hai sự kiện trùng loại/template trên cùng một sector (Duplicate Guard)", () => {
    const state = createInitialWorldState(601)

    // Tạo sự kiện 1: Đột kích Void tại mining_outpost_k7
    const evt1 = createEventFromTemplate("evt_void_skirmish_raid", state.currentDay, {
      targetSectorId: "mining_outpost_k7",
    })
    assert.ok(evt1)
    const reg1 = registerWorldEvent(state, evt1)
    assert.equal(reg1.success, true, "Sự kiện đầu tiên đăng ký thành công")

    // Tạo sự kiện 2: Cùng template evt_void_skirmish_raid tại mining_outpost_k7
    const evt2 = createEventFromTemplate("evt_void_skirmish_raid", state.currentDay, {
      targetSectorId: "mining_outpost_k7",
    })
    assert.ok(evt2)
    // Đảm bảo ID khác nhau
    evt2.id = "evt_void_skirmish_raid_clone"

    const check = canRegisterWorldEvent(state, evt2)
    assert.equal(check.allowed, false, "canRegisterWorldEvent phải từ chối sự kiện trùng template")
    assert.equal(check.reason, "duplicate_template_in_sector")

    const reg2 = registerWorldEvent(state, evt2)
    assert.equal(reg2.success, false, "registerWorldEvent phải từ chối")
    assert.equal(reg2.reason, "duplicate_template_in_sector")

    // Sự kiện cùng template nhưng ở sector KHÁC (helios_perimeter) phải được cho phép
    const evtDifferentSector = createEventFromTemplate("evt_void_skirmish_raid", state.currentDay, {
      targetSectorId: "helios_perimeter",
    })
    assert.ok(evtDifferentSector)
    evtDifferentSector.id = "evt_void_skirmish_raid_helios"
    const regDiff = registerWorldEvent(state, evtDifferentSector)
    assert.equal(regDiff.success, true, "Cùng template nhưng khác sector phải được phép đăng ký")
  })

  // --------------------------------------------------------------------------
  // TEST 2: HAI SỰ KIỆN KHÁC LOẠI CÓ THỂ TỒN TẠI ĐỒNG THỜI TRÊN CÙNG SECTOR
  // --------------------------------------------------------------------------
  it("2. Hai sự kiện khác loại/template có thể tồn tại hợp lý đồng thời trên cùng một sector", () => {
    const state = createInitialWorldState(602)
    const targetSector = "mining_outpost_k7"

    // Sự kiện A: Bão Plasma (Anomaly) trên K-7
    const evtA = createEventFromTemplate("evt_plasma_storm", state.currentDay, {
      targetSectorId: targetSector,
    })
    assert.ok(evtA)
    const regA = registerWorldEvent(state, evtA)
    assert.equal(regA.success, true)

    // Sự kiện B: Bãi công đình công (Civil) trên K-7
    const evtB = createEventFromTemplate("evt_civil_unrest_strike", state.currentDay, {
      targetSectorId: targetSector,
    })
    assert.ok(evtB)
    const regB = registerWorldEvent(state, evtB)
    assert.equal(regB.success, true, "Sự kiện khác template/category phải được phép cùng tồn tại trên sector")

    // Sự kiện C: Yêu cầu tiếp tế lương thực khẩn cấp (Logistics) trên K-7
    const evtC = createEventFromTemplate("evt_urgent_supply_request", state.currentDay, {
      targetSectorId: targetSector,
    })
    assert.ok(evtC)
    const regC = registerWorldEvent(state, evtC)
    assert.equal(regC.success, true, "Sự kiện hậu cần cũng được phép cùng tồn tại hợp lý")

    // Xác nhận cả 3 sự kiện đều đang active trên mining_outpost_k7
    const activeK7Events = getActiveEvents(state).filter((e) => e.sectorId === targetSector)
    assert.equal(activeK7Events.length, 3, "Có đúng 3 sự kiện khác loại cùng active trên sector K-7")
  })

  // --------------------------------------------------------------------------
  // TEST 3: SỰ KIỆN BỊ CHẶN KHÔNG KHIẾN MISSION CHAIN BỊ KẸT
  // --------------------------------------------------------------------------
  it("3. Sự kiện bị chặn không khiến mission chain bị kẹt (Deferred Dispatch & Controlled Fallback)", () => {
    const state = createInitialWorldState(603)
    const prng = new WorldPRNG(state.worldSeed)
    const sectorId = "helios_perimeter"

    // 1. Tạo sẵn một sự kiện độc lập chiếm chỗ template evt_void_signal_decryption trên helios_perimeter
    const blockerEvt = createEventFromTemplate("evt_void_signal_decryption", state.currentDay, {
      targetSectorId: sectorId,
    })
    assert.ok(blockerEvt)
    registerWorldEvent(state, blockerEvt)

    // 2. Bắt đầu mission chain "chain_linear_void_inquiry" (bước 1 sử dụng template evt_void_signal_decryption)
    const chainRes = startMissionChain(state, "chain_linear_void_inquiry", {
      targetSectorId: sectorId,
    })
    assert.ok(chainRes.success, "Chuỗi vẫn khởi tạo thành công")
    const chain = chainRes.chain!
    assert.equal(chainRes.isDeferred, true, "Sự kiện ban đầu bị đánh dấu deferred")

    const initialNode = chain.nodes[chain.currentNodeId]
    assert.equal(initialNode.isPendingDispatch, true, "Node được đánh dấu isPendingDispatch: true")
    assert.ok(initialNode.pendingEvent, "Node lưu giữ pendingEvent")

    // 3. Trong lúc blockerEvt chưa xong: retryPendingMissionChainDispatches vẫn chưa thể kích hoạt
    const retry1 = retryPendingMissionChainDispatches(state, prng)
    assert.equal(retry1.retriedSuccessCount, 0, "Chưa thể dispatch vì blockerEvt vẫn đang active")
    assert.equal(initialNode.isPendingDispatch, true)

    // 4. Giờ giải quyết xong blockerEvt (chuyển sang RESULT)
    blockerEvt.status = "PROCESSING"
    blockerEvt.processingCompletesTick = state.currentDay
    resolveProcessingEvent(state, blockerEvt)
    assert.equal(blockerEvt.status, "RESULT", "Sự kiện cản trở đã giải quyết xong")

    // Lưu lại ID sự kiện đang chờ
    const pendingEvtId = initialNode.pendingEvent?.id || ""
    assert.ok(pendingEvtId.length > 0)

    // 5. Thử lại retryPendingMissionChainDispatches -> Sự kiện của chuỗi lập tức được kích hoạt thành công!
    const retry2 = retryPendingMissionChainDispatches(state, prng)
    assert.equal(retry2.retriedSuccessCount, 1, "Đã kích hoạt thành công sau khi sector được giải phóng")
    assert.equal(initialNode.isPendingDispatch, false, "Node không còn ở trạng thái pending dispatch")
    assert.ok(state.events![pendingEvtId], "Sự kiện đã chính thức có mặt trong state.events")

    // 6. Kiểm tra Controlled Fallback: Nếu một node bị hoãn quá MAX_DISPATCH_DEFER_TICKS ticks
    // Tạo trước một blocker trên asteroid_delta để fakeChain không thể dispatch sự kiện
    const deltaBlocker = createEventFromTemplate("evt_derelict_warship_salvage", state.currentDay, {
      targetSectorId: "asteroid_delta",
    })!
    deltaBlocker.id = "evt_derelict_blocker"
    registerWorldEvent(state, deltaBlocker)

    const fakeChainRes = startMissionChain(state, "chain_standalone_ancient_cache", {
      targetSectorId: "asteroid_delta",
    })
    assert.ok(fakeChainRes.success)
    assert.equal(fakeChainRes.isDeferred, true, "Bước ban đầu phải bị deferred do trùng template trên asteroid_delta")
    const fakeChain = fakeChainRes.chain!
    const fakeNode = fakeChain.nodes[fakeChain.currentNodeId]
    assert.equal(fakeNode.isPendingDispatch, true)
    fakeNode.dispatchDeferredTicks = MAX_DISPATCH_DEFER_TICKS // Giả lập đã hoãn đủ 4 ngày

    const retryTimeout = retryPendingMissionChainDispatches(state, prng)
    assert.equal(retryTimeout.fallbackCount, 1, "Phải kích hoạt giải tỏa có kiểm soát (Controlled Fallback)")
    assert.equal(fakeNode.isPendingDispatch, false, "Node được gỡ bỏ khỏi pending dispatch")
    assert.equal(fakeChain.status, "completed", "Chuỗi standalone 1 bước tự động hoàn tất vẻ vang mà không bị kẹt!")
  })

  // --------------------------------------------------------------------------
  // TEST 4: NHIỀU DEADLINE TRÙNG NHAU TRONG CÙNG TICK
  // --------------------------------------------------------------------------
  it("4. Nhiều deadline trùng nhau trong cùng tick được xử lý tất định theo tie-breaking", () => {
    const state = createInitialWorldState(604)
    const prng = new WorldPRNG(state.worldSeed)

    // Tạo 3 sự kiện cùng có decisionDeadlineTick = state.currentDay + 1 nhưng khác priority
    const evtHigh = createEventFromTemplate("evt_void_skirmish_raid", state.currentDay, {
      targetSectorId: "helios_perimeter",
      deadlineTicks: 1,
    })!
    evtHigh.id = "evt_tie_high"
    evtHigh.priority = 90

    const evtMed = createEventFromTemplate("evt_civil_unrest_strike", state.currentDay, {
      targetSectorId: "mining_outpost_k7",
      deadlineTicks: 1,
    })!
    evtMed.id = "evt_tie_med"
    evtMed.priority = 60

    const evtLow = createEventFromTemplate("evt_plasma_storm", state.currentDay, {
      targetSectorId: "asteroid_delta",
      deadlineTicks: 1,
    })!
    evtLow.id = "evt_tie_low"
    evtLow.priority = 30

    registerWorldEvent(state, evtHigh)
    registerWorldEvent(state, evtMed)
    registerWorldEvent(state, evtLow)

    // Đưa ngày đến hạn chót
    state.currentDay += 1

    // Thực thi advanceEventLifecyclesAndDeadlines
    const cycleRes = advanceEventLifecyclesAndDeadlines(state, prng)

    // Cả 3 đều hết hạn và phải được auto-lock
    assert.equal(cycleRes.autoLockedEvents.length, 3)

    // Thứ tự tie-break bắt buộc: priority 90 -> priority 60 -> priority 30
    assert.equal(cycleRes.autoLockedEvents[0], "evt_tie_high", "Sự kiện priority 90 phải xử lý trước nhất")
    assert.equal(cycleRes.autoLockedEvents[1], "evt_tie_med", "Sự kiện priority 60 phải xử lý thứ nhì")
    assert.equal(cycleRes.autoLockedEvents[2], "evt_tie_low", "Sự kiện priority 30 phải xử lý sau cùng")

    // Kiểm tra summary phong phú được trả về
    assert.equal(cycleRes.summary.autoLockedCount, 3)
    assert.ok(cycleRes.summary.byCategory["military"] >= 1)
    assert.ok(cycleRes.summary.byCategory["civil"] >= 1)
    assert.ok(cycleRes.summary.byCategory["anomaly"] >= 1)
  })

  // --------------------------------------------------------------------------
  // TEST 5: KẾT QUẢ KHÔNG BỊ ÁP DỤNG HAI LẦN SAU RELOAD HOẶC XỬ LÝ LẠI
  // --------------------------------------------------------------------------
  it("5. Kết quả và hậu quả không bị áp dụng hai lần sau reload hoặc xử lý lại (Idempotency Guard)", () => {
    setupMockLocalStorage()
    const state = createInitialWorldState(605)
    const sector = state.sectors["mining_outpost_k7"]
    const startStability = sector.stability

    const event = createEventFromTemplate("evt_food_supply_blight", state.currentDay, {
      targetSectorId: sector.id,
      deadlineTicks: 1,
    })!
    registerWorldEvent(state, event)

    // Chọn chiến lược
    const chooseRes = chooseEventStrategy(state, event.id, "strat_chemical_decontamination")
    assert.ok(chooseRes.success)
    assert.equal(event.status, "PROCESSING")

    // Giải quyết sự kiện
    state.currentDay = event.processingCompletesTick!
    const res1 = resolveProcessingEvent(state, event)
    assert.ok(res1.success)
    assert.equal(event.consequencesApplied, true)
    const stabilityAfterResolve = sector.stability

    // Lưu vào storage và nạp lại
    const saveRes = saveWorldState(state)
    assert.ok(saveRes.success)

    const loadRes = loadWorldState()
    assert.equal(loadRes.status, "loaded_primary")
    assert.equal(loadRes.checksumVerified, true)
    const reloadedState = loadRes.state
    const reloadedEvent = reloadedState.events![event.id]
    assert.equal(reloadedEvent.status, "RESULT")
    assert.equal(reloadedEvent.consequencesApplied, true)

    // Thử giải quyết lại trên reloaded state
    const resRetry = resolveProcessingEvent(reloadedState, reloadedEvent)
    assert.equal(resRetry.success, false, "Không thể giải quyết lại sự kiện đã RESULT")

    // Thử gọi ép applyEventConsequencesOnce
    const forceApply = applyEventConsequencesOnce(reloadedState, reloadedEvent, {
      stabilityDelta: -40,
      message: "Hacked double apply",
    })
    assert.equal(forceApply.applied, false, "Guard consequencesApplied phải chặn áp dụng lần 2")
    assert.equal(
      reloadedState.sectors[sector.id].stability,
      stabilityAfterResolve,
      "Stability giữ nguyên vẹn 100% không suy giảm thêm"
    )
  })

  // --------------------------------------------------------------------------
  // TEST 6: SỰ KIỆN MỚI PHÁT SINH TỪ MISSION CHAIN ĐƯỢC XỬ LÝ ĐÚNG
  // --------------------------------------------------------------------------
  it("6. Sự kiện mới phát sinh từ mission chain vẫn được xử lý đúng (No premature resolution)", () => {
    const state = createInitialWorldState(606)

    // Bắt đầu chuỗi linear
    const chainRes = startMissionChain(state, "chain_linear_void_inquiry", {
      targetSectorId: "helios_perimeter",
    })
    assert.ok(chainRes.success)
    const chain = chainRes.chain!
    const node1 = chain.nodes["node_step_1_scout"]
    const event1 = state.events![node1.eventTemplateId ? Object.values(state.events!).find(e => e.nodeId === node1.id)!.id : ""]
    assert.ok(event1, "Sự kiện bước 1 được tạo")

    // Chọn chiến lược và xử lý bước 1
    chooseEventStrategy(state, event1.id, event1.availableStrategies[0].id)
    event1.processingCompletesTick = state.currentDay
    const resolve1 = resolveProcessingEvent(state, event1)
    assert.ok(resolve1.success)

    // Tiến hành chuyển sang bước 2
    const adv1 = advanceMissionChainNode(state, chain.id, "node_step_1_scout")
    assert.ok(adv1.success)
    const node2 = chain.nodes["node_step_2_skirmish"]
    assert.equal(node2.status, "active")

    // Tìm sự kiện mới của bước 2
    const event2 = Object.values(state.events!).find((e) => e.nodeId === node2.id)
    assert.ok(event2, "Sự kiện mới của bước 2 đã được đăng ký vào state.events")
    assert.equal(event2.status, "INIT", "Sự kiện mới phải ở trạng thái INIT")
    assert.equal(event2.createdAtTick, state.currentDay, "Ngày tạo phải là ngày hiện tại")
    assert.ok(event2.decisionDeadlineTick > state.currentDay, "Hạn chót phải ở các tick tương lai")

    // Chạy tick Phase 5: event2 KHÔNG được bị auto-lock ngay trong cùng ngày tạo
    const prng = new WorldPRNG(state.worldSeed)
    const cycleRes = advanceEventLifecyclesAndDeadlines(state, prng)
    assert.equal(
      cycleRes.autoLockedEvents.includes(event2.id),
      false,
      "Sự kiện mới tạo không được bị auto-lock sớm trong cùng tick"
    )
    assert.equal(event2.status, "INIT", "Sự kiện mới vẫn an toàn ở INIT chờ người chơi")
  })
})
