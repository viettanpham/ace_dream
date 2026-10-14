/**
 * STARFRONT WORLD — Mission Dispatch & Operations Engine (Phase 6.31)
 * Quản lý điều phối nhiệm vụ, phân định chỉ huy Người Chơi vs NPC, và vòng đời tác chiến:
 *   - Người chơi chỉ tham gia trực tiếp tối đa 1 nhiệm vụ tại một thời điểm
 *   - Các nhiệm vụ khác có thể ở PREPARE hoặc do NPC tiếp quản điều hành
 *   - Hết hạn PREPARE: NPC cấp phó/đồn trú tự động tiếp quản chỉ huy
 *   - Mô phỏng nhiệm vụ NPC-only với kết quả thực tế vào WORLD
 *   - Cấu trúc mục tiêu tái sử dụng cho 6 hình thái (Patrol, Escort, Defend, Raid, Eliminate, Threat Containment)
 *   - Nhật ký hành động (Action Timeline) ghi nhận sự kiện thực, chống spam
 *   - Tích hợp kho lưu trữ Operations Archive có kiểm soát hạn ngạch
 */

import type {
  WorldState,
  WorldSector,
  WorldEventResult,
  MissionDispatch,
  MissionDispatchStatus,
  MissionParticipant,
  MissionObjective,
  MissionObjectiveCategory,
  MissionTimelineEntry,
  MissionTimelineEventType,
} from "./types"
import { WorldPRNG } from "./random"
import { archiveEventResult, ensureOperationsArchive } from "./operations-archive"
import { getSectorMaxThreat } from "./threat-engine"

/**
 * Đảm bảo state lưu trữ Mission Dispatch tồn tại trong WorldState
 */
export function ensureMissionDispatchState(state: WorldState): void {
  if (!state.missionDispatches) {
    state.missionDispatches = {}
  }
  if (state.activePlayerMissionId === undefined) {
    state.activePlayerMissionId = null
  }
  ensureOperationsArchive(state)
}

/**
 * Tạo bản ghi nhật ký dòng thời gian (Mission Action Timeline)
 */
export function createTimelineEntry(
  missionId: string,
  tick: number,
  type: MissionTimelineEventType,
  title: string,
  description: string,
  actor: { type: "player" | "npc" | "system"; name: string }
): MissionTimelineEntry {
  const now = typeof Date !== "undefined" ? Date.now() : 1773000000000
  return {
    id: `tl_${missionId}_${tick}_${type}_${Math.random().toString(36).slice(2, 6)}`,
    missionId,
    tick,
    timestamp: now,
    type,
    title,
    description,
    actor,
  }
}

/**
 * Tạo mục tiêu nhiệm vụ chuẩn hóa theo 6 hình thái tái sử dụng
 */
export function createStandardObjective(
  category: MissionObjectiveCategory,
  sector: WorldSector,
  customTitle?: string
): MissionObjective {
  switch (category) {
    case "patrol":
      return {
        id: `obj_patrol_${sector.id}`,
        category: "patrol",
        title: customTitle || `Tuần Tra Tuyến Phòng Ngự ${sector.name}`,
        description: `Trinh sát và quét sạch các toán do thám tiền trạm xung quanh ${sector.name}.`,
        targetSectorId: sector.id,
        targetValue: 100,
        currentProgress: 0,
        successCriteriaText: "Giảm 25 Mức Đe Dọa, thu thập +35 Tình Báo Chiến Thuật",
      }

    case "escort":
      return {
        id: `obj_escort_${sector.id}`,
        category: "escort",
        title: customTitle || `Hộ Tống Đoàn Vận Tải Đến ${sector.name}`,
        description: `Bảo vệ đoàn tàu chở lương thực và vật tư vượt qua các tuyến đường nguy hiểm đến ${sector.name}.`,
        targetSectorId: sector.id,
        targetValue: 100,
        currentProgress: 0,
        successCriteriaText: "Cung cấp +90 Lương Thực & Tiếp Tế, tăng +4 Ổn Định Sector",
      }

    case "defend":
      return {
        id: `obj_defend_${sector.id}`,
        category: "defend",
        title: customTitle || `Gia Cố & Phòng Thủ Tiền Đồn ${sector.name}`,
        description: `Bố trí lực lượng chốt chặn, củng cố công sự trước sức ép của kẻ thù tại ${sector.name}.`,
        targetSectorId: sector.id,
        targetValue: 100,
        currentProgress: 0,
        successCriteriaText: "Ngăn chặn suy thoái, bảo toàn đồn trú và ổn định địa bàn",
      }

    case "raid":
      return {
        id: `obj_raid_${sector.id}`,
        category: "raid",
        title: customTitle || `Đột Kích Căn Cứ Tiền Phương The Void`,
        description: `Mở cuộc đột kích thần tốc vào điểm tập kết vũ khí của The Void gần ${sector.name}.`,
        targetSectorId: sector.id,
        targetValue: 100,
        currentProgress: 0,
        successCriteriaText: "Giảm 45 Mức Đe Dọa, thu giữ +60 Vật Liệu Công Nghiệp",
      }

    case "eliminate":
      return {
        id: `obj_eliminate_${sector.id}`,
        category: "eliminate",
        title: customTitle || `Tiêu Diệt Chỉ Huy Tiên Phong Kẻ Địch`,
        description: `Định vị và tiêu diệt thủ lĩnh phi đội The Void đang chỉ huy bao vây ${sector.name}.`,
        targetSectorId: sector.id,
        targetValue: 100,
        currentProgress: 0,
        successCriteriaText: "Hạ gục mục tiêu, giảm 65 Mức Đe Dọa, tăng +60 Tình Báo",
      }

    case "threat_containment":
      return {
        id: `obj_containment_${sector.id}`,
        category: "threat_containment",
        title: customTitle || `Khống Chế Điểm Nóng Đe Dọa Tại ${sector.name}`,
        description: `Thiết lập hành lang an ninh cô lập điểm nóng bùng phát bất ổn tại ${sector.name}.`,
        targetSectorId: sector.id,
        targetValue: 100,
        currentProgress: 0,
        successCriteriaText: "Hạ nhiệt 50 Mức Đe Dọa, ngăn lây lan sang các tuyến lân cận",
      }
  }
}

/**
 * Lấy NPC sĩ quan chỉ huy đồn trú phù hợp cho Sector
 */
export function getEligibleNPCCommander(sector: WorldSector): {
  id: string
  name: string
  role: "deputy"
  defaultTroops: number
} {
  return {
    id: `npc_commander_${sector.id}`,
    name: `Trung Tá Đồn Trú ${sector.name}`,
    role: "deputy",
    defaultTroops: Math.min(60, Math.max(20, Math.floor(sector.garrisonPower * 0.15))),
  }
}

/**
 * Lấy nhiệm vụ mà người chơi đang trực tiếp tham gia (nếu có)
 */
export function getActivePlayerMission(state: WorldState): MissionDispatch | null {
  ensureMissionDispatchState(state)
  if (state.activePlayerMissionId && state.missionDispatches![state.activePlayerMissionId]) {
    const m = state.missionDispatches![state.activePlayerMissionId]
    if (m.status === "PREPARE" || m.status === "PROCESSING") {
      return m
    }
  }

  // Quét phòng ngừa nếu id bị lệch
  for (const m of Object.values(state.missionDispatches!)) {
    if ((m.status === "PREPARE" || m.status === "PROCESSING") && m.participant?.type === "player") {
      state.activePlayerMissionId = m.id
      return m
    }
  }

  state.activePlayerMissionId = null
  return null
}

/**
 * Kiểm tra xem người chơi có được phép tham gia vào một nhiệm vụ hay không
 * Quy tắc cốt lõi: Người chơi chỉ được trực tiếp tham gia tối đa 1 nhiệm vụ tại một thời điểm
 */
export function canPlayerJoinMission(
  state: WorldState,
  missionId: string
): { allowed: boolean; reason?: string } {
  ensureMissionDispatchState(state)
  const mission = state.missionDispatches![missionId]
  if (!mission) {
    return { allowed: false, reason: "Nhiệm vụ không tồn tại trong hệ thống điều phối." }
  }

  if (mission.status !== "PREPARE") {
    return {
      allowed: false,
      reason: `Nhiệm vụ đã ở trạng thái ${mission.status}, không thể tham gia trong giai đoạn này.`,
    }
  }

  const activeMission = getActivePlayerMission(state)
  if (activeMission && activeMission.id !== missionId) {
    return {
      allowed: false,
      reason: `Bạn đang trực tiếp chỉ huy nhiệm vụ "${activeMission.title}". Người chơi chỉ được trực tiếp chỉ huy tối đa 1 nhiệm vụ tại một thời điểm.`,
    }
  }

  return { allowed: true }
}

/**
 * Người chơi nhận quyền trực tiếp chỉ huy một nhiệm vụ ở giai đoạn PREPARE
 */
export function playerJoinMission(
  state: WorldState,
  missionId: string,
  options?: {
    pilotName?: string
    assignedTroops?: number
  }
): { success: boolean; message: string } {
  ensureMissionDispatchState(state)
  const check = canPlayerJoinMission(state, missionId)
  if (!check.allowed) {
    return { success: false, message: check.reason || "Không thể tham gia nhiệm vụ." }
  }

  const mission = state.missionDispatches![missionId]
  const pilotName = options?.pilotName || "Chỉ Huy VSS"

  mission.participant = {
    type: "player",
    id: "commander_player",
    name: pilotName,
    role: "commander",
    joinedAtTick: state.currentDay,
    assignedGarrisonTroops: options?.assignedTroops || 0,
  }
  mission.leaderType = "player"
  state.activePlayerMissionId = missionId

  // Ghi nhận nhật ký hành động thực tế
  mission.actionTimeline.push(
    createTimelineEntry(
      missionId,
      state.currentDay,
      "participant_joined",
      "Chỉ Huy Trực Tiếp Gia Nhập",
      `${pilotName} đã trực tiếp tiếp quản vị trí chỉ huy trưởng nhiệm vụ.`,
      { type: "player", name: pilotName }
    )
  )

  return {
    success: true,
    message: `Đã tiếp quản thành công vị trí chỉ huy nhiệm vụ "${mission.title}".`,
  }
}

/**
 * Người chơi rút lui khỏi nhiệm vụ trong giai đoạn PREPARE
 */
export function playerWithdrawMission(
  state: WorldState,
  missionId: string
): { success: boolean; message: string } {
  ensureMissionDispatchState(state)
  const mission = state.missionDispatches![missionId]
  if (!mission) {
    return { success: false, message: "Nhiệm vụ không tồn tại." }
  }

  if (mission.status !== "PREPARE") {
    return {
      success: false,
      message: `Nhiệm vụ đang ở trạng thái ${mission.status}, không thể rút lui.`,
    }
  }

  if (mission.participant?.type !== "player") {
    return {
      success: false,
      message: "Bạn hiện không nắm quyền chỉ huy nhiệm vụ này.",
    }
  }

  const prevName = mission.participant.name
  mission.participant = null
  mission.leaderType = undefined
  if (state.activePlayerMissionId === missionId) {
    state.activePlayerMissionId = null
  }

  // Ghi nhận nhật ký hành động thực tế
  mission.actionTimeline.push(
    createTimelineEntry(
      missionId,
      state.currentDay,
      "participant_withdrawn",
      "Chỉ Huy Rút Lui Khỏi Nhiệm Vụ",
      `${prevName} đã bàn giao lại nhiệm vụ về danh sách chuẩn bị đồn trú.`,
      { type: "player", name: prevName }
    )
  )

  return {
    success: true,
    message: `Đã rút lui khỏi quyền chỉ huy nhiệm vụ "${mission.title}".`,
  }
}

/**
 * Bổ sung quân đồn trú vào lực lượng tham gia nhiệm vụ trong giai đoạn PREPARE
 */
export function assignGarrisonForcesToMission(
  state: WorldState,
  missionId: string,
  troopCount: number
): { success: boolean; message: string } {
  ensureMissionDispatchState(state)
  const mission = state.missionDispatches![missionId]
  if (!mission || mission.status !== "PREPARE") {
    return { success: false, message: "Nhiệm vụ không ở trạng thái PREPARE." }
  }

  const sector = state.sectors[mission.sectorId]
  if (!sector) {
    return { success: false, message: "Sector không tồn tại." }
  }

  if (troopCount <= 0) {
    return { success: false, message: "Số quân phải lớn hơn 0." }
  }

  if (troopCount > sector.garrisonPower) {
    return {
      success: false,
      message: `Quân số yêu cầu (${troopCount}) vượt quá quân đồn trú sẵn có (${sector.garrisonPower}).`,
    }
  }

  mission.assignedForces = {
    ...mission.assignedForces,
    garrisonTroops: (mission.assignedForces?.garrisonTroops || 0) + troopCount,
  }

  mission.actionTimeline.push(
    createTimelineEntry(
      missionId,
      state.currentDay,
      "participant_joined",
      "Tiếp Nhận Quân Tăng Viện",
      `Điều động bổ sung ${troopCount.toLocaleString()} quân đồn trú vào đội hình nhiệm vụ.`,
      { type: "system", name: "Hệ Thống Điều Phối" }
    )
  )

  return {
    success: true,
    message: `Đã bổ sung ${troopCount} quân vào nhiệm vụ "${mission.title}".`,
  }
}

/**
 * Khởi tạo một lệnh điều phối nhiệm vụ mới (Mission Dispatch)
 */
export function createMissionDispatch(
  state: WorldState,
  params: {
    id?: string
    title: string
    description: string
    category: MissionObjectiveCategory
    sectorId: string
    prepareDurationTicks?: number
    processingDurationTicks?: number
    customObjectiveTitle?: string
    eventId?: string
    missionChainId?: string
    nodeId?: string
  }
): { success: boolean; dispatch?: MissionDispatch; error?: string } {
  ensureMissionDispatchState(state)
  const sector = state.sectors[params.sectorId]
  if (!sector) {
    return { success: false, error: `Sector không tồn tại: ${params.sectorId}` }
  }

  const id = params.id || `dispatch_${params.category}_${params.sectorId}_day${state.currentDay}_${Math.random().toString(36).slice(2, 6)}`
  if (state.missionDispatches![id]) {
    return { success: false, error: `Nhiệm vụ ${id} đã tồn tại.` }
  }

  const prepareDuration = params.prepareDurationTicks ?? 2
  const objective = createStandardObjective(params.category, sector, params.customObjectiveTitle)

  const newDispatch: MissionDispatch = {
    id,
    title: params.title,
    description: params.description,
    category: params.category,
    sectorId: params.sectorId,
    status: "PREPARE",
    createdAtTick: state.currentDay,
    prepareDeadlineTick: state.currentDay + prepareDuration,
    participant: null,
    objective,
    actionTimeline: [
      createTimelineEntry(
        id,
        state.currentDay,
        "created",
        "Lệnh Điều Phối Được Thiết Lập",
        `Nhiệm vụ ${params.category.toUpperCase()} được mở tại ${sector.name}. Đang trong giai đoạn chuẩn bị lực lượng.`,
        { type: "system", name: "Bộ Tư Lệnh VSS" }
      ),
    ],
    eventId: params.eventId,
    missionChainId: params.missionChainId,
    nodeId: params.nodeId,
  }

  state.missionDispatches![id] = newDispatch
  return { success: true, dispatch: newDispatch }
}

/**
 * Xử lý hết hạn giai đoạn PREPARE:
 * - Nếu người chơi đã tham gia: Bắt đầu PROCESSING dưới quyền Người Chơi
 * - Nếu người chơi CHƯA tham gia: NPC cấp phó/đồn trú tự động tiếp quản chỉ huy (NPC Takeover),
 *   chuyển sang PROCESSING dưới quyền NPC để nhiệm vụ không bị đóng băng.
 */
export function processPrepareExpirationsAndTakeovers(
  state: WorldState,
  prng?: WorldPRNG
): {
  processedCount: number
  takeoversCount: number
  logs: string[]
} {
  ensureMissionDispatchState(state)
  let processedCount = 0
  let takeoversCount = 0
  const logs: string[] = []

  const dispatches = Object.values(state.missionDispatches!)

  for (const mission of dispatches) {
    if (mission.status !== "PREPARE") continue

    // Kiểm tra xem đã hết hạn PREPARE chưa
    if (state.currentDay >= mission.prepareDeadlineTick) {
      processedCount++
      const sector = state.sectors[mission.sectorId]

      mission.actionTimeline.push(
        createTimelineEntry(
          mission.id,
          state.currentDay,
          "prepare_completed",
          "Hoàn Tất Giai Đoạn Chuẩn Bị",
          "Thời gian chuẩn bị (PREPARE) kết thúc. Đội hình chính thức chuyển sang trạng thái xuất kích.",
          { type: "system", name: "Điều Phối Tác Chiến" }
        )
      )

      if (mission.participant?.type === "player") {
        // Người chơi đã nắm quyền chỉ huy
        mission.status = "PROCESSING"
        mission.processingStartedTick = state.currentDay
        mission.processingCompletesTick =
          state.currentDay + (mission.category === "raid" || mission.category === "eliminate" ? 2 : 1)

        mission.actionTimeline.push(
          createTimelineEntry(
            mission.id,
            state.currentDay,
            "processing_started",
            "Bắt Đầu Tác Chiến Dưới Quyền Chỉ Huy",
            `${mission.participant.name} trực tiếp dẫn dắt lực lượng tiến vào vùng tác chiến.`,
            { type: "player", name: mission.participant.name }
          )
        )

        logs.push(
          `[MISSION PROCESSING] Nhiệm vụ "${mission.title}" xuất kích dưới sự chỉ huy trực tiếp của ${mission.participant.name}.`
        )
      } else {
        // Người chơi không tham gia -> NPC tiếp quản chỉ huy tự động (NPC Takeover)
        takeoversCount++
        const npcOfficer = getEligibleNPCCommander(sector)
        mission.participant = {
          type: "npc",
          id: npcOfficer.id,
          name: npcOfficer.name,
          role: "deputy",
          joinedAtTick: state.currentDay,
          assignedGarrisonTroops: npcOfficer.defaultTroops,
        }
        mission.leaderType = "npc"
        mission.status = "PROCESSING"
        mission.processingStartedTick = state.currentDay
        mission.processingCompletesTick =
          state.currentDay + (mission.category === "raid" || mission.category === "eliminate" ? 2 : 1)

        mission.actionTimeline.push(
          createTimelineEntry(
            mission.id,
            state.currentDay,
            "npc_takeover",
            "NPC Đồn Trú Tiếp Quản Quyền Chỉ Huy",
            `${npcOfficer.name} tự động tiếp quản chỉ huy nhiệm vụ sau khi hết hạn chuẩn bị mà không có chỉ huy trực tiếp.`,
            { type: "npc", name: npcOfficer.name }
          )
        )

        mission.actionTimeline.push(
          createTimelineEntry(
            mission.id,
            state.currentDay,
            "processing_started",
            "Bắt Đầu Tác Chiến Tự Động (NPC)",
            `Đội hình dưới quyền ${npcOfficer.name} chính thức bước vào vùng tác chiến.`,
            { type: "npc", name: npcOfficer.name }
          )
        )

        logs.push(
          `[MISSION NPC TAKEOVER] ${npcOfficer.name} tiếp quản chỉ huy nhiệm vụ "${mission.title}" (Sector ${sector.name}).`
        )
      }
    }
  }

  return { processedCount, takeoversCount, logs }
}

/**
 * Mô phỏng kết quả tác chiến thực tế cho nhiệm vụ khi đến hạn hoàn tất
 */
export function simulateAndResolveMission(
  state: WorldState,
  mission: MissionDispatch,
  prng?: WorldPRNG
): { success: boolean; result: WorldEventResult; log: string } {
  // Idempotency Guard: Ngăn chặn xử lý lặp lại nếu nhiệm vụ đã giải quyết
  if (mission.isResolved || mission.consequencesApplied) {
    const existing = state.eventResultsArchive?.find((r) => r.id === `res_dispatch_${mission.id}`)
    return {
      success: mission.status === "COMPLETED",
      result: existing || ({} as WorldEventResult),
      log: `[MISSION RESOLVE SKIP] Nhiệm vụ "${mission.title}" đã được giải quyết trước đó (Bảo đảm tính lũy đẳng).`,
    }
  }

  const sector = state.sectors[mission.sectorId]
  const isNPC = mission.leaderType === "npc"

  // Đánh giá tỷ lệ thành công dựa trên thực lực:
  // - Điểm ổn định cao và Threat thấp -> tỷ lệ thành công cao hơn
  // - Quân đồn trú bổ trợ tăng tỷ lệ
  let baseSuccessChance = 75
  if (sector) {
    if (sector.stability >= 80) baseSuccessChance += 10
    if (sector.threatLevel >= 700) baseSuccessChance -= 20
    else if (sector.threatLevel <= 200) baseSuccessChance += 10
  }
  if (mission.participant?.type === "player") {
    baseSuccessChance += 15 // Người chơi trực tiếp chỉ huy có bonus
  }

  const roll = prng ? prng.nextInt(1, 100) : 50
  const isVictory = roll <= Math.min(95, Math.max(25, baseSuccessChance))

  // Áp dụng biến động thực tế vào WORLD
  let threatDelta = 0
  let stabilityDelta = 0
  let casualtiesDelta = 0
  let resourceChanges: Partial<Record<string, number>> = {}
  let summaryText = ""

  if (isVictory) {
    switch (mission.category) {
      case "patrol":
        threatDelta = -25
        resourceChanges = { tacticalData: 35 }
        summaryText = `Tuần tra thành công: Mức đe dọa tại ${sector.name} giảm 25, thu thập 35 Dữ liệu chiến thuật.`
        break
      case "escort":
        stabilityDelta = 4
        resourceChanges = { food: 60, logisticsSupplies: 40 }
        summaryText = `Hộ tống an toàn: Cung cấp bổ sung 60 Lương thực và 40 Vật tư cho ${sector.name}.`
        break
      case "defend":
        threatDelta = -15
        stabilityDelta = 5
        summaryText = `Phòng thủ kiên cố: Giữ vững trận địa tại ${sector.name}, ổn định tăng +5.`
        break
      case "raid":
        threatDelta = -45
        resourceChanges = { industrialMaterials: 60, tacticalData: 25 }
        casualtiesDelta = 10
        summaryText = `Đột kích phá hủy cứ điểm The Void: -45 Threat, thu giữ 60 Hợp kim, thương vong nhẹ 10 quân.`
        break
      case "eliminate":
        threatDelta = -60
        resourceChanges = { tacticalData: 60 }
        casualtiesDelta = 15
        summaryText = `Tiêu diệt thành công đầu não địch: Giảm mạnh 60 Threat, thu hồi 60 Dữ liệu tuyệt mật.`
        break
      case "threat_containment":
        threatDelta = -50
        summaryText = `Cô lập thành công điểm nóng: -50 Threat tại ${sector.name}, ngăn chặn lây lan.`
        break
    }
  } else {
    // Thất bại
    threatDelta = 20
    stabilityDelta = -5
    casualtiesDelta = 25
    summaryText = `Tác chiến gặp trở ngại bất ngờ: Tổn thất 25 quân đồn trú, mức đe dọa tăng 20.`
  }

  // Áp dụng thay đổi vào WORLD
  if (sector) {
    if (threatDelta !== 0) {
      const sMax = getSectorMaxThreat(sector, state.threatConfig)
      sector.threatLevel = Math.max(0, Math.min(sMax, sector.threatLevel + threatDelta))
    }
    if (stabilityDelta !== 0) {
      sector.stability = Math.max(0, Math.min(100, sector.stability + stabilityDelta))
    }
  }
  if (casualtiesDelta > 0) {
    state.military.casualties += casualtiesDelta
    state.military.deployed = Math.max(0, state.military.deployed - casualtiesDelta)
  }
  for (const [resKey, val] of Object.entries(resourceChanges)) {
    if (typeof val === "number") {
      const cur = (state.resources as any)[resKey] ?? 0
      ;(state.resources as any)[resKey] = Math.max(0, cur + val)
    }
  }

  // Đánh dấu mục tiêu hoàn tất
  mission.objective.isCompleted = isVictory
  mission.objective.currentProgress = isVictory ? 100 : 40
  mission.status = isVictory ? "COMPLETED" : "FAILED"
  mission.isResolved = true
  mission.consequencesApplied = true
  mission.resultSummary = summaryText

  // Ghi nhật ký hành động thực tế
  mission.actionTimeline.push(
    createTimelineEntry(
      mission.id,
      state.currentDay,
      "objective_resolved",
      isVictory ? "Mục Tiêu Hoàn Tất Xuất Sắc" : "Mục Tiêu Bị Gián Đoạn",
      summaryText,
      {
        type: mission.participant?.type || "system",
        name: mission.participant?.name || "Lực Lượng Tác Chiến",
      }
    )
  )

  mission.actionTimeline.push(
    createTimelineEntry(
      mission.id,
      state.currentDay,
      isVictory ? "completed" : "failed",
      isVictory ? "Nhiệm Vụ Kết Thúc Thắng Lợi" : "Nhiệm Vụ Kết Thúc Thất Bại",
      `Chiến dịch chính thức kết thúc tại Ngày ${state.currentDay}. Kết quả được chuyển vào Operations Archive.`,
      { type: "system", name: "Hệ Thống Lưu Trữ" }
    )
  )

  // Giải phóng người chơi nếu người chơi là người tham gia
  if (state.activePlayerMissionId === mission.id) {
    state.activePlayerMissionId = null
  }

  // Tạo đối tượng kết quả hợp lệ để lưu vào Operations Archive
  const now = typeof Date !== "undefined" ? Date.now() : 1773000000000
  const resultObj: WorldEventResult = {
    id: `res_dispatch_${mission.id}`,
    eventId: mission.eventId || mission.id,
    templateId: `dispatch_${mission.category}`,
    title: mission.title,
    category: "military",
    severity: isVictory ? "info" : "warning",
    sectorId: mission.sectorId,
    status: isVictory ? "success" : "failure",
    chosenStrategyId: mission.category,
    chosenStrategyName: isNPC
      ? `Chiến thuật NPC (${mission.participant?.name || "Đồn Trú"})`
      : `Chỉ huy trực tiếp (${mission.participant?.name || "Player"})`,
    summaryText,
    resolvedAtTick: state.currentDay,
    resolvedAtTimestamp: now,
    resourceChanges,
    stabilityChange: stabilityDelta,
    threatChange: threatDelta,
    casualties: casualtiesDelta,
    isRead: false,
    missionChainId: mission.missionChainId,
    strategySource: isNPC ? "system_auto" : "player_choice",
    selectionReason: isNPC
      ? `NPC tự động hoàn tất mô phỏng tác chiến tại ${sector.name}`
      : `Người chơi trực tiếp hoàn tất nhiệm vụ tác chiến`,
  }

  // Lưu trữ bền vững vào Operations Archive
  archiveEventResult(state, resultObj)

  const log = `[MISSION RESOLVED] "${mission.title}" kết thúc [${isVictory ? "THÀNH CÔNG" : "THẤT BẠI"}]. ${summaryText}`
  return { success: isVictory, result: resultObj, log }
}

/**
 * Tiến hóa chu kỳ nhiệm vụ điều phối trong Strategic Tick:
 *   1. Xử lý hết hạn PREPARE -> NPC takeover nếu vắng người chơi -> chuyển sang PROCESSING
 *   2. Xử lý hoàn tất PROCESSING -> Mô phỏng kết quả thực tế -> Lưu vào Operations Archive
 */
export function advanceMissionDispatches(
  state: WorldState,
  prng?: WorldPRNG
): {
  prepareTakeoversCount: number
  completedCount: number
  failedCount: number
  logs: string[]
} {
  ensureMissionDispatchState(state)
  const logs: string[] = []

  // 1. Xử lý PREPARE expirations
  const prepResult = processPrepareExpirationsAndTakeovers(state, prng)
  for (const l of prepResult.logs) logs.push(l)

  // 2. Xử lý PROCESSING completions
  let completedCount = 0
  let failedCount = 0

  const activeProcessingDispatches = Object.values(state.missionDispatches!).filter(
    (m) => m.status === "PROCESSING"
  )

  for (const mission of activeProcessingDispatches) {
    if (mission.processingCompletesTick && state.currentDay >= mission.processingCompletesTick) {
      const res = simulateAndResolveMission(state, mission, prng)
      logs.push(res.log)
      if (res.success) {
        completedCount++
      } else {
        failedCount++
      }
    }
  }

  return {
    prepareTakeoversCount: prepResult.takeoversCount,
    completedCount,
    failedCount,
    logs,
  }
}

/**
 * Hủy bỏ an toàn một nhiệm vụ điều phối (Safe Abort)
 */
export function abortMissionDispatch(
  state: WorldState,
  missionId: string,
  reason?: string
): { success: boolean; message: string } {
  ensureMissionDispatchState(state)
  const mission = state.missionDispatches![missionId]
  if (!mission) {
    return { success: false, message: "Nhiệm vụ không tồn tại trong hệ thống điều phối." }
  }

  if (mission.status === "COMPLETED" || mission.status === "FAILED" || mission.status === "ABORTED") {
    return { success: false, message: `Nhiệm vụ đã ở trạng thái ${mission.status}, không thể hủy.` }
  }

  mission.status = "ABORTED"
  mission.isResolved = true
  mission.resultSummary = reason || "Nhiệm vụ bị hủy bỏ theo lệnh tác chiến của chỉ huy."

  mission.actionTimeline.push(
    createTimelineEntry(
      missionId,
      state.currentDay,
      "aborted",
      "Lệnh Điều Phối Bị Hủy Bỏ An Toàn",
      reason || "Chiến dịch đã được chủ động hủy bỏ an toàn.",
      {
        type: mission.participant?.type || "system",
        name: mission.participant?.name || "Chỉ Huy VSS",
      }
    )
  )

  if (state.activePlayerMissionId === missionId) {
    state.activePlayerMissionId = null
  }

  return {
    success: true,
    message: `Đã hủy bỏ an toàn nhiệm vụ "${mission.title}".`,
  }
}
