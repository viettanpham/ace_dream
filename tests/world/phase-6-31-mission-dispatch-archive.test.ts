import test from "node:test"
import assert from "node:assert/strict"
import { createInitialWorldState } from "@/lib/game/world/initial-state"
import { WorldPRNG } from "@/lib/game/world/random"
import {
  createMissionDispatch,
  canPlayerJoinMission,
  playerJoinMission,
  playerWithdrawMission,
  getActivePlayerMission,
  assignGarrisonForcesToMission,
  processPrepareExpirationsAndTakeovers,
  simulateAndResolveMission,
  advanceMissionDispatches,
  createStandardObjective,
  abortMissionDispatch,
} from "@/lib/game/world/mission-dispatch"
import {
  archiveEventResult,
  getOperationsArchiveConfig,
  updateOperationsArchiveConfig,
  getOperationsArchiveSummary,
  pruneOperationsArchiveSafe,
  DEFAULT_OPERATIONS_ARCHIVE_CONFIG,
} from "@/lib/game/world/operations-archive"
import type { WorldEventResult } from "@/lib/game/world/types"

test("STARFRONT Phase 6.31 — Mission Dispatch & Operations Archive Verification", async (t) => {
  await t.test("1. Giới hạn tham gia: Người chơi chỉ được chỉ huy tối đa 1 nhiệm vụ tại một thời điểm", () => {
    const worldState = createInitialWorldState()

    // Tạo 2 nhiệm vụ ở giai đoạn PREPARE
    const m1Res = createMissionDispatch(worldState, {
      id: "test_m1",
      title: "Tuần Tra Vành Đai Helios",
      description: "Tuần tra tiền đồn",
      category: "patrol",
      sectorId: "helios_perimeter",
      prepareDurationTicks: 2,
    })
    const m2Res = createMissionDispatch(worldState, {
      id: "test_m2",
      title: "Hộ Tống Vận Tải Trạm K-7",
      description: "Hộ tống tiếp tế",
      category: "escort",
      sectorId: "mining_outpost_k7",
      prepareDurationTicks: 2,
    })

    assert.ok(m1Res.success)
    assert.ok(m2Res.success)

    // Kiểm tra ban đầu: Người chơi chưa tham gia nhiệm vụ nào
    assert.equal(getActivePlayerMission(worldState), null)
    assert.equal(canPlayerJoinMission(worldState, "test_m1").allowed, true)
    assert.equal(canPlayerJoinMission(worldState, "test_m2").allowed, true)

    // Người chơi tham gia m1
    const join1 = playerJoinMission(worldState, "test_m1", { pilotName: "Chỉ Huy Marcus" })
    assert.ok(join1.success)
    assert.equal(getActivePlayerMission(worldState)?.id, "test_m1")

    // Cố gắng tham gia m2 khi m1 đang hoạt động -> BỊ TỪ CHỐI
    const check2 = canPlayerJoinMission(worldState, "test_m2")
    assert.equal(check2.allowed, false)
    assert.match(check2.reason || "", /tối đa 1 nhiệm vụ/)

    const join2 = playerJoinMission(worldState, "test_m2")
    assert.equal(join2.success, false)

    // Rút lui khỏi m1
    const withdraw = playerWithdrawMission(worldState, "test_m1")
    assert.ok(withdraw.success)
    assert.equal(getActivePlayerMission(worldState), null)

    // Bây giờ có thể tham gia m2
    const join2After = playerJoinMission(worldState, "test_m2", { pilotName: "Chỉ Huy Marcus" })
    assert.ok(join2After.success)
    assert.equal(getActivePlayerMission(worldState)?.id, "test_m2")
  })

  await t.test("2. Tự động chuyển giao quyền chỉ huy cho NPC (NPC Takeover) khi hết hạn PREPARE", () => {
    const worldState = createInitialWorldState()
    worldState.currentDay = 5

    // Tạo nhiệm vụ với hạn chót PREPARE = ngày 7
    createMissionDispatch(worldState, {
      id: "test_m_npc",
      title: "Phòng Thủ Pháo Đài Bastion",
      description: "Củng cố cứ điểm",
      category: "defend",
      sectorId: "nebula_bastion",
      prepareDurationTicks: 2, // deadline = 5 + 2 = 7
    })

    const m = worldState.missionDispatches!["test_m_npc"]
    assert.equal(m.status, "PREPARE")
    assert.equal(m.participant, null)

    // Tại ngày 6 (chưa hết hạn): Không có takeover
    worldState.currentDay = 6
    const tick6 = processPrepareExpirationsAndTakeovers(worldState)
    assert.equal(tick6.takeoversCount, 0)
    assert.equal(m.status, "PREPARE")

    // Tại ngày 7 (hết hạn PREPARE và người chơi không tham gia): NPC TAKEOVER kích hoạt
    worldState.currentDay = 7
    const tick7 = processPrepareExpirationsAndTakeovers(worldState)
    assert.equal(tick7.takeoversCount, 1)
    assert.equal(m.status, "PROCESSING")
    assert.equal(m.leaderType, "npc")
    assert.equal(m.participant?.type, "npc")
    assert.match(m.participant?.name || "", /Trung Tá Đồn Trú/)

    // Kiểm tra dòng thời gian Timeline ghi nhận đúng sự kiện thực tế
    const timelineTypes = m.actionTimeline.map((e) => e.type)
    assert.ok(timelineTypes.includes("created"))
    assert.ok(timelineTypes.includes("prepare_completed"))
    assert.ok(timelineTypes.includes("npc_takeover"))
    assert.ok(timelineTypes.includes("processing_started"))
  })

  await t.test("3. Mô phỏng nhiệm vụ NPC-only với kết quả thực tế vào WORLD & giải phóng người chơi", () => {
    const worldState = createInitialWorldState()
    worldState.currentDay = 10
    const prng = new WorldPRNG(42)

    createMissionDispatch(worldState, {
      id: "test_m_sim",
      title: "Đột Kích Tiền Trạm Tartarus",
      description: "Tiêu diệt toán đột kích Void",
      category: "raid",
      sectorId: "mining_outpost_k7",
      prepareDurationTicks: 1,
    })

    const m = worldState.missionDispatches!["test_m_sim"]

    // Bổ sung quân đồn trú
    assignGarrisonForcesToMission(worldState, "test_m_sim", 30)
    assert.equal(m.assignedForces?.garrisonTroops, 30)

    // Tua sang ngày 11: PREPARE kết thúc -> NPC takeover
    worldState.currentDay = 11
    processPrepareExpirationsAndTakeovers(worldState, prng)
    assert.equal(m.status, "PROCESSING")

    // Ghi nhận chỉ số ban đầu của sector
    const initialThreat = worldState.sectors["mining_outpost_k7"].threatLevel

    // Tua đến ngày hoàn tất xử lý
    worldState.currentDay = m.processingCompletesTick || 13
    const adv = advanceMissionDispatches(worldState, prng)

    assert.ok(adv.completedCount + adv.failedCount >= 1)
    assert.ok(m.status === "COMPLETED" || m.status === "FAILED")
    assert.ok(m.isResolved === true)
    assert.ok(m.consequencesApplied === true)

    // Kết quả đã được lưu trữ bền vững vào Operations Archive
    const archive = worldState.eventResultsArchive || []
    const archivedResult = archive.find((r) => r.id === `res_dispatch_${m.id}`)
    assert.ok(archivedResult !== undefined, "Kết quả nhiệm vụ phải có trong archive")
    assert.equal(archivedResult?.sectorId, "mining_outpost_k7")
    assert.equal(archivedResult?.strategySource, "system_auto")

    // Timeline ghi nhận đầy đủ chu trình
    const lastEvent = m.actionTimeline[m.actionTimeline.length - 1]
    assert.ok(lastEvent.type === "completed" || lastEvent.type === "failed")
  })

  await t.test("4. Cấu trúc mục tiêu tái sử dụng cho đủ 6 phân loại", () => {
    const worldState = createInitialWorldState()
    const sector = worldState.sectors["helios_perimeter"]

    const categories = ["patrol", "escort", "defend", "raid", "eliminate", "threat_containment"] as const

    for (const cat of categories) {
      const obj = createStandardObjective(cat, sector)
      assert.equal(obj.category, cat)
      assert.equal(obj.targetSectorId, sector.id)
      assert.ok(obj.title.length > 0)
      assert.ok(obj.successCriteriaText.length > 0)
    }
  })

  await t.test("5. Bounded Operations Archive & Giới hạn hạn ngạch lưu trữ an toàn", () => {
    const worldState = createInitialWorldState()
    worldState.eventResultsArchive = []

    // Cấu hình quota là 5 bản ghi
    updateOperationsArchiveConfig(worldState, { eventArchiveQuota: 5, battleArchiveQuota: 5 })
    const cfg = getOperationsArchiveConfig(worldState)
    assert.equal(cfg.eventArchiveQuota, 5)

    // Lưu 8 kết quả liên tiếp
    for (let i = 1; i <= 8; i++) {
      const mockResult: WorldEventResult = {
        id: `mock_res_${i}`,
        eventId: `mock_evt_${i}`,
        templateId: "tpl_test",
        title: `Báo cáo chiến dịch #${i}`,
        category: "military",
        severity: "info",
        status: "success",
        chosenStrategyId: "strat_1",
        chosenStrategyName: "Chiến lược 1",
        summaryText: "Hoàn tất tốt",
        resolvedAtTick: i,
        resolvedAtTimestamp: Date.now() + i * 1000,
        isRead: i <= 3, // 3 cái đầu đã đọc
      }
      archiveEventResult(worldState, mockResult)
    }

    // Kiểm tra danh sách đã bị giới hạn trần đúng quota = 5 bản ghi
    assert.equal(worldState.eventResultsArchive.length, 5)
    // Các bản ghi mới nhất (8, 7, 6, 5, 4) được bảo lưu
    assert.equal(worldState.eventResultsArchive[0].id, "mock_res_8")
    assert.equal(worldState.eventResultsArchive[4].id, "mock_res_4")

    // Thử lưu lại cùng ID (Idempotency) -> Không bị tăng độ dài
    archiveEventResult(worldState, worldState.eventResultsArchive[0])
    assert.equal(worldState.eventResultsArchive.length, 5)

    // Summary kiểm tra đúng
    const summary = getOperationsArchiveSummary(worldState)
    assert.equal(summary.totalArchivedEvents, 5)
    assert.equal(summary.eventArchiveQuota, 5)
  })

  await t.test("6. Hủy bỏ an toàn (Safe Abort) và giải phóng người chơi", () => {
    const worldState = createInitialWorldState()
    createMissionDispatch(worldState, {
      id: "test_abort",
      title: "Nhiệm vụ thử nghiệm hủy bỏ",
      description: "Thử nghiệm hủy bỏ an toàn",
      category: "patrol",
      sectorId: "sol_command_hq",
      prepareDurationTicks: 2,
    })

    const joinRes = playerJoinMission(worldState, "test_abort", { pilotName: "Chỉ Huy VSS" })
    assert.ok(joinRes.success)
    assert.equal(getActivePlayerMission(worldState)?.id, "test_abort")

    const abortRes = abortMissionDispatch(worldState, "test_abort", "Tình hình chiến sự thay đổi")
    assert.ok(abortRes.success)

    const mission = worldState.missionDispatches!["test_abort"]
    assert.equal(mission.status, "ABORTED")
    assert.equal(mission.isResolved, true)
    assert.equal(getActivePlayerMission(worldState), null)

    const lastEntry = mission.actionTimeline[mission.actionTimeline.length - 1]
    assert.equal(lastEntry.type, "aborted")
    assert.equal(lastEntry.title, "Lệnh Điều Phối Bị Hủy Bỏ An Toàn")
  })

  await t.test("7. Tính lũy đẳng (Idempotency) khi xử lý hoàn tất nhiệm vụ", () => {
    const worldState = createInitialWorldState()
    createMissionDispatch(worldState, {
      id: "test_idempotent",
      title: "Nhiệm vụ kiểm tra lũy đẳng",
      description: "Chống xử lý lặp lại hai lần",
      category: "patrol",
      sectorId: "helios_perimeter",
    })

    const mission = worldState.missionDispatches!["test_idempotent"]
    mission.status = "PROCESSING"

    // Xử lý lần 1
    const res1 = simulateAndResolveMission(worldState, mission)
    assert.ok(mission.isResolved)
    assert.ok(mission.consequencesApplied)
    const initialSummary = mission.resultSummary

    // Xử lý lần 2 ngay sau đó -> Phải bỏ qua an toàn mà không cộng dồn tài nguyên / threat hai lần
    const res2 = simulateAndResolveMission(worldState, mission)
    assert.match(res2.log, /Lũy đẳng|đã được giải quyết trước đó/i)
    assert.equal(mission.resultSummary, initialSummary)
  })
})

