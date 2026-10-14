/**
 * STARFRONT WORLD — Strategic Mission Chains Engine (Phase 6.7)
 * Quản lý đồ thị chuỗi nhiệm vụ chiến lược với 6 hình thái kiến trúc:
 *   1. Linear (Tuyến tính): Bước 1 -> Bước 2 -> Bước 3
 *   2. Branching (Phân nhánh): Quyết định/chiến lược mở ra Nhánh A hoặc Nhánh B
 *   3. Threshold-based (Theo ngưỡng): Tự động kích hoạt khi Threat/Stability/Tài nguyên vượt ngưỡng
 *   4. Reactive (Phản ứng): Kích hoạt khi có biến động tiêu cực (Under Siege, Thất thủ)
 *   5. Periodic / Patrol (Tuần hoàn): Lặp lại định kỳ (recurringIntervalTicks) với Cooldown an toàn
 *   6. Standalone (Độc lập): Chiến dịch đặc biệt một lần
 *
 * Giới hạn trần toàn cục:
 *   MAX_ACTIVE_MISSION_CHAINS = 8
 */

import type {
  WorldState,
  MissionChain,
  MissionChainNode,
  MissionTopology,
} from "./types"
import { WorldPRNG } from "./random"
import { createEventFromTemplate } from "./event-templates"
import { registerWorldEvent, ensureWorldEventState } from "./event-engine"
import { getSectorMaxThreat } from "./threat-engine"

/**
 * Giới hạn trần số lượng chuỗi nhiệm vụ hoạt động đồng thời
 */
export const MAX_ACTIVE_MISSION_CHAINS = 8

/**
 * Số ngày (ticks) tối đa một bước nhiệm vụ chờ giải phóng sector trước khi kích hoạt giải tỏa an toàn
 */
export const MAX_DISPATCH_DEFER_TICKS = 4

/**
 * Định nghĩa mẫu chuỗi nhiệm vụ (Mission Chain Template)
 */
export interface MissionChainTemplate {
  id: string
  title: string
  description: string
  topology: MissionTopology
  defaultSectorId?: string
  nodes: MissionChainNode[]
  initialNodeId: string
  recurringIntervalTicks?: number
}

/**
 * Danh mục các chuỗi nhiệm vụ chuẩn hóa đại diện cho 6 hình thái
 */
export const MISSION_CHAIN_TEMPLATES: Record<string, MissionChainTemplate> = {
  // 1. LINEAR: Chuỗi tuyến tính 3 bước "Chiến Dịch Phản Kích The Void"
  chain_linear_void_inquiry: {
    id: "chain_linear_void_inquiry",
    title: "Chiến Dịch Truy Quét Hắc Ám (Linear)",
    description: "Chuỗi 3 bước tác chiến liên tục nhằm phá hủy mạng lưới trinh sát tiền phương của The Void.",
    topology: "linear",
    defaultSectorId: "helios_perimeter",
    initialNodeId: "node_step_1_scout",
    nodes: [
      {
        id: "node_step_1_scout",
        title: "Bước 1: Do Thám & Bắt Sóng",
        description: "Thu thập dải tần truyền tin của toán tiên phong địch.",
        eventTemplateId: "evt_void_signal_decryption",
        status: "active",
        nextBranchMap: { "*": "node_step_2_skirmish" },
        rewardSummary: "+140 Tactical Data",
      },
      {
        id: "node_step_2_skirmish",
        title: "Bước 2: Phục Kích Đội Tiền Trạm",
        description: "Bố trí lực lượng tiêu diệt phân đội cơ động The Void.",
        eventTemplateId: "evt_void_vanguard_skirmish",
        status: "locked",
        requiredPreviousNodeIds: ["node_step_1_scout"],
        nextBranchMap: { "*": "node_step_3_decisive" },
        rewardSummary: "-35 Threat, +35 Data",
      },
      {
        id: "node_step_3_decisive",
        title: "Bước 3: Tiêu Diệt Hạm Đội Đột Kích",
        description: "Đánh chặn tổng lực hạm đội đột kích của The Void tại vành đai.",
        eventTemplateId: "evt_void_skirmish_raid",
        status: "locked",
        requiredPreviousNodeIds: ["node_step_2_skirmish"],
        rewardSummary: "Hoàn tất chiến dịch: Sector an toàn tuyệt đối",
      },
    ],
  },

  // 2. BRANCHING: Chuỗi phân nhánh "Khủng Hoảng Mỏ Khai Khoáng K-7"
  chain_branching_mining_crisis: {
    id: "chain_branching_mining_crisis",
    title: "Khủng Hoảng Mỏ Khai Khoáng K-7 (Branching)",
    description: "Lựa chọn phương án hòa giải bằng lương thực (Nhánh Dân Sự) hoặc thiết quân luật (Nhánh Quân Sự).",
    topology: "branching",
    defaultSectorId: "mining_outpost_k7",
    initialNodeId: "node_crisis_initial",
    nodes: [
      {
        id: "node_crisis_initial",
        title: "Giai Đoạn Khởi Điểm: Bãi Công Bùng Phát",
        description: "Công nhân đình công làm tê liệt dây chuyền sản xuất mỏ quặng.",
        eventTemplateId: "evt_civil_unrest_strike",
        status: "active",
        nextBranchMap: {
          strat_negotiate_rations: "node_branch_diplomatic_relief",
          strat_martial_curfew: "node_branch_military_crackdown",
          strat_standoff_delay: "node_branch_military_crackdown",
        },
      },
      {
        id: "node_branch_diplomatic_relief",
        title: "Nhánh Dân Sự: Tái Thiết & Trợ Cấp Lương Thực",
        description: "Tiếp tục cứu trợ và ổn định đời sống xã hội cho công nhân mỏ.",
        eventTemplateId: "evt_urgent_supply_request",
        status: "locked",
        requiredPreviousNodeIds: ["node_crisis_initial"],
        rewardSummary: "Sector đạt Stability cao, tăng sản lượng khai khoáng",
      },
      {
        id: "node_branch_military_crackdown",
        title: "Nhánh Quân Sự: Tăng Cường Tuần Tra Trấn Áp",
        description: "Triển khai lực lượng quân sự vãn hồi trật tự và truy quét các phần tử quá khích.",
        eventTemplateId: "evt_contraband_smugglers",
        status: "locked",
        requiredPreviousNodeIds: ["node_crisis_initial"],
        rewardSummary: "Thu hồi tài nguyên thất thoát nhưng Stability bị suy giảm",
      },
    ],
  },

  // 3. THRESHOLD-BASED: Kích hoạt khi Sector có Threat >= 600
  chain_threshold_high_threat: {
    id: "chain_threshold_high_threat",
    title: "Phòng Tuyến Khẩn Nguy (Threshold-Based)",
    description: "Kích hoạt tự động khi áp lực The Void tại một sector vượt mức báo động 600 Threat.",
    topology: "threshold",
    initialNodeId: "node_threshold_containment",
    nodes: [
      {
        id: "node_threshold_containment",
        title: "Thiết Quân Luật & Khắc Phục Phòng Tuyến",
        description: "Khẩn cấp gia cố công sự và đánh chặn mũi tấn công của địch trước khi bị bao vây.",
        eventTemplateId: "evt_void_skirmish_raid",
        status: "active",
        thresholdCondition: {
          metric: "threat",
          operator: ">=",
          value: 600,
        },
        rewardSummary: "Hạ nhiệt Threat khẩn cấp, ngăn chặn sector rơi vào Under Siege",
      },
    ],
  },

  // 4. REACTIVE: Phản ứng khi sector rơi vào Under Siege hoặc Bị tấn công
  chain_reactive_rescue: {
    id: "chain_reactive_rescue",
    title: "Chiến Dịch Giải Vây Cứu Viện (Reactive)",
    description: "Kích hoạt ngay khi một căn cứ đồng minh bị The Void siết chặt vòng vây.",
    topology: "reactive",
    initialNodeId: "node_reactive_break_siege",
    nodes: [
      {
        id: "node_reactive_break_siege",
        title: "Đột Phá Vòng Vây Cứu Viện",
        description: "Tập trung lực lượng chi viện khẩn cấp, giải tỏa áp lực đè nặng lên đồn trú.",
        eventTemplateId: "evt_void_vanguard_skirmish",
        status: "active",
        reactiveCondition: {
          triggerType: "sector_under_siege",
        },
        rewardSummary: "Phá vỡ vòng vây và khôi phục đường tiếp tế",
      },
    ],
  },

  // 5. PERIODIC: Tuần tra biên giới định kỳ mỗi 6 ngày
  chain_periodic_patrol: {
    id: "chain_periodic_patrol",
    title: "Tuần Tra Biên Giới Định Kỳ (Periodic)",
    description: "Nhiệm vụ tuần tra hạm đội duy trì an ninh trật tự, lặp lại sau mỗi chu kỳ tuần hoàn.",
    topology: "periodic",
    recurringIntervalTicks: 6,
    initialNodeId: "node_periodic_patrol_step",
    nodes: [
      {
        id: "node_periodic_patrol_step",
        title: "Tuần Tra Mạng Lưới Siêu Không Gian",
        description: "Quét dọn các chướng ngại vật và răn đe các toán cướp không gian nhỏ lẻ.",
        eventTemplateId: "evt_pirate_hyperlane_blockade",
        status: "active",
        rewardSummary: "Duy trì Stability ổn định và thông suốt tuyến hành quân",
      },
    ],
  },

  // 6. STANDALONE: Chiến dịch độc lập khảo sát xác tàu cổ
  chain_standalone_ancient_cache: {
    id: "chain_standalone_ancient_cache",
    title: "Thám Hiểm Tàu Chiến Cổ Đại (Standalone)",
    description: "Chiến dịch độc lập tìm kiếm công nghệ thời Tiền Chiến, chỉ thực hiện một lần.",
    topology: "standalone",
    defaultSectorId: "asteroid_delta",
    initialNodeId: "node_standalone_salvage",
    nodes: [
      {
        id: "node_standalone_salvage",
        title: "Khảo Sát Khung Xác Tàu Tiền Triều",
        description: "Thám hiểm khoang chứa và trích xuất dữ liệu khoa học.",
        eventTemplateId: "evt_derelict_warship_salvage",
        status: "active",
        rewardSummary: "+160 Materials, +40 Data",
      },
    ],
  },
}

/**
 * Bắt đầu một chuỗi nhiệm vụ mới từ mẫu có sẵn
 */
export function startMissionChain(
  state: WorldState,
  templateId: string,
  options?: {
    customChainId?: string
    targetSectorId?: string
  }
): {
  success: boolean
  chain?: MissionChain
  event?: any
  isDeferred?: boolean
  error?: string
} {
  ensureWorldEventState(state)

  // 1. Kiểm tra giới hạn trần MAX_ACTIVE_MISSION_CHAINS = 8
  const activeChains = Object.values(state.missionChains!).filter(
    (c) => c.status === "active"
  )
  if (activeChains.length >= MAX_ACTIVE_MISSION_CHAINS) {
    return {
      success: false,
      error: `Đã đạt trần ${MAX_ACTIVE_MISSION_CHAINS} chuỗi nhiệm vụ hoạt động đồng thời. Tạm hoãn mở chuỗi mới.`,
    }
  }

  const template = MISSION_CHAIN_TEMPLATES[templateId]
  if (!template) {
    return {
      success: false,
      error: `Không tìm thấy template chuỗi nhiệm vụ: ${templateId}`,
    }
  }

  const chainId = options?.customChainId || `chain_${template.id}_${state.currentDay}`

  // Tránh tạo trùng chuỗi đang chạy
  if (state.missionChains![chainId] && state.missionChains![chainId].status === "active") {
    return {
      success: false,
      error: `Chuỗi nhiệm vụ ${chainId} đang hoạt động, không thể tạo lặp lại.`,
    }
  }

  // Khởi tạo đồ thị các nút (clone)
  const nodesMap: Record<string, MissionChainNode> = {}
  for (const n of template.nodes) {
    nodesMap[n.id] = { ...n }
  }

  const initialNode = nodesMap[template.initialNodeId]
  if (!initialNode) {
    return {
      success: false,
      error: `Nút ban đầu ${template.initialNodeId} không tồn tại trong cấu hình chuỗi ${templateId}.`,
    }
  }

  const sectorId = options?.targetSectorId || template.defaultSectorId || "sol_command_hq"

  const newChain: MissionChain = {
    id: chainId,
    templateId: template.id,
    title: template.title,
    description: template.description,
    topology: template.topology,
    sectorId,
    status: "active",
    nodes: nodesMap,
    currentNodeId: initialNode.id,
    startedAtTick: state.currentDay,
    recurringIntervalTicks: template.recurringIntervalTicks,
    lastRunTick: state.currentDay,
  }

  // Sinh sự kiện WorldEvent tương ứng với nút ban đầu
  const event = createEventFromTemplate(initialNode.eventTemplateId, state.currentDay, {
    targetSectorId: sectorId,
    missionChainId: chainId,
    nodeId: initialNode.id,
  })

  let isDeferred = false
  if (event) {
    const regRes = registerWorldEvent(state, event)
    if (!regRes.success) {
      initialNode.isPendingDispatch = true
      initialNode.pendingEvent = event
      initialNode.deferredSinceTick = state.currentDay
      initialNode.dispatchDeferredTicks = 0
      isDeferred = true
    } else {
      initialNode.isPendingDispatch = false
      delete initialNode.pendingEvent
    }
  }

  state.missionChains![chainId] = newChain
  if (!state.activeMissionChains.includes(chainId)) {
    state.activeMissionChains.push(chainId)
  }

  return { success: true, chain: newChain, event, isDeferred }
}

/**
 * Đẩy chuỗi nhiệm vụ sang bước tiếp theo khi một sự kiện/nút hoàn tất (Branching / Linear progression)
 */
export function advanceMissionChainNode(
  state: WorldState,
  chainId: string,
  completedNodeId: string,
  chosenStrategyId?: string
): {
  success: boolean
  isChainCompleted: boolean
  nextNode?: MissionChainNode
  spawnedEvent?: any
  isDeferred?: boolean
  message: string
} {
  ensureWorldEventState(state)
  const chain = state.missionChains?.[chainId]
  if (!chain || chain.status !== "active") {
    return {
      success: false,
      isChainCompleted: false,
      message: `Chuỗi nhiệm vụ ${chainId} không tồn tại hoặc không ở trạng thái active.`,
    }
  }

  const currentNode = chain.nodes[completedNodeId]
  if (!currentNode) {
    return {
      success: false,
      isChainCompleted: false,
      message: `Nút ${completedNodeId} không tồn tại trong chuỗi ${chainId}.`,
    }
  }

  // Đánh dấu nút hiện tại hoàn thành
  currentNode.status = "completed"

  // Xác định nút kế tiếp dựa trên map rẽ nhánh
  let nextNodeId: string | undefined
  if (currentNode.nextBranchMap) {
    if (chosenStrategyId && currentNode.nextBranchMap[chosenStrategyId]) {
      nextNodeId = currentNode.nextBranchMap[chosenStrategyId]
    } else if (currentNode.nextBranchMap["*"]) {
      nextNodeId = currentNode.nextBranchMap["*"]
    }
  }

  // Nếu không còn nút kế tiếp -> Hoàn tất toàn bộ chuỗi nhiệm vụ!
  if (!nextNodeId || !chain.nodes[nextNodeId]) {
    chain.status = "completed"
    chain.completedAtTick = state.currentDay

    // Đồng bộ danh sách WorldState
    state.activeMissionChains = state.activeMissionChains.filter((id) => id !== chainId)
    if (!state.completedMissionChainIds.includes(chainId)) {
      state.completedMissionChainIds.push(chainId)
    }

    return {
      success: true,
      isChainCompleted: true,
      message: `Chuỗi nhiệm vụ "${chain.title}" đã hoàn tất vẻ vang!`,
    }
  }

  // Kích hoạt nút kế tiếp
  const nextNode = chain.nodes[nextNodeId]
  nextNode.status = "active"
  chain.currentNodeId = nextNode.id

  // Sinh sự kiện mới cho nút kế tiếp
  const nextEvent = createEventFromTemplate(nextNode.eventTemplateId, state.currentDay, {
    targetSectorId: nextNode.sectorId || chain.sectorId,
    missionChainId: chainId,
    nodeId: nextNode.id,
  })

  let isDeferred = false
  if (nextEvent) {
    const regRes = registerWorldEvent(state, nextEvent)
    if (!regRes.success) {
      nextNode.isPendingDispatch = true
      nextNode.pendingEvent = nextEvent
      nextNode.deferredSinceTick = state.currentDay
      nextNode.dispatchDeferredTicks = 0
      isDeferred = true
    } else {
      nextNode.isPendingDispatch = false
      delete nextNode.pendingEvent
    }
  }

  return {
    success: true,
    isChainCompleted: false,
    nextNode,
    spawnedEvent: nextEvent,
    isDeferred,
    message: isDeferred
      ? `Chuỗi nhiệm vụ "${chain.title}" chuyển tiếp sang bước: "${nextNode.title}" (Tạm hoãn kích hoạt do sector đang bận; sẽ tự động tái thử nghiệm trong chu kỳ tick).`
      : `Chuỗi nhiệm vụ "${chain.title}" chuyển tiếp sang bước tiếp theo: "${nextNode.title}".`,
  }
}

/**
 * Thử kích hoạt lại các sự kiện chuỗi nhiệm vụ đang bị hoãn (Pending Dispatches)
 * Được gọi ở đầu Phase 6 của Tick Engine sau khi Phase 5 đã giải phóng các sự kiện cũ.
 * Nếu một bước bị hoãn quá MAX_DISPATCH_DEFER_TICKS (4 ticks), kích hoạt giải tỏa an toàn để chuỗi không kẹt.
 */
export function retryPendingMissionChainDispatches(
  state: WorldState,
  prng?: WorldPRNG
): {
  retriedSuccessCount: number
  fallbackCount: number
  logs: string[]
} {
  ensureWorldEventState(state)

  let retriedSuccessCount = 0
  let fallbackCount = 0
  const logs: string[] = []

  const activeChainIds = Object.values(state.missionChains || {})
    .filter((c) => c.status === "active")
    .map((c) => c.id)

  for (const chainId of activeChainIds) {
    const chain = state.missionChains?.[chainId]
    if (!chain || chain.status !== "active") continue

    const currentNode = chain.nodes[chain.currentNodeId]
    if (!currentNode || !currentNode.isPendingDispatch || !currentNode.pendingEvent) continue

    // Tăng số tick đã chờ
    currentNode.dispatchDeferredTicks = (currentNode.dispatchDeferredTicks || 0) + 1

    // Thử đăng ký lại
    const regRes = registerWorldEvent(state, currentNode.pendingEvent)
    if (regRes.success) {
      currentNode.isPendingDispatch = false
      delete currentNode.pendingEvent
      retriedSuccessCount++
      logs.push(
        `[MISSION DISPATCH RESUMED] Chuỗi "${chain.title}" đã kích hoạt thành công sự kiện cho bước "${currentNode.title}" sau khi điều kiện thông suốt.`
      )
    } else if (currentNode.dispatchDeferredTicks >= MAX_DISPATCH_DEFER_TICKS) {
      // Vượt quá thời hạn chờ tối đa -> Kích hoạt giải tỏa có kiểm soát (Controlled Skip/Fallback)
      currentNode.isPendingDispatch = false
      delete currentNode.pendingEvent
      fallbackCount++
      logs.push(
        `[MISSION CONTROLLED FALLBACK] Bước "${currentNode.title}" trong chuỗi "${chain.title}" tự động giải tỏa an toàn sau ${MAX_DISPATCH_DEFER_TICKS} ngày bị phong tỏa.`
      )
      // Tiến hành chuyển sang bước tiếp theo
      advanceMissionChainNode(state, chain.id, currentNode.id)
    }
  }

  return { retriedSuccessCount, fallbackCount, logs }
}

/**
 * Đánh giá điều kiện kích hoạt các chuỗi nhiệm vụ động trong Phase 6 của Tick Engine:
 *   - Threshold-driven: Threat >= 600 hoặc Stability <= 30
 *   - Reactive: Sector bị chuyển sang Under Siege
 *   - Periodic: Đạt chu kỳ định kỳ (lastRunTick + interval <= currentDay)
 */
export function evaluateMissionChainUnlocks(
  state: WorldState,
  prng: WorldPRNG
): {
  activatedChains: string[]
  logs: string[]
} {
  ensureWorldEventState(state)

  const activatedChains: string[] = []
  const logs: string[] = []

  // Đếm số chuỗi active hiện tại
  const currentActiveCount = Object.values(state.missionChains!).filter(
    (c) => c.status === "active"
  ).length

  if (currentActiveCount >= MAX_ACTIVE_MISSION_CHAINS) {
    return { activatedChains, logs }
  }

  // 1. Kiểm tra Threshold-based: Có sector VSS nào Threat >= 60% (hoặc legacy >= 600) không?
  for (const sector of Object.values(state.sectors)) {
    const sMax = getSectorMaxThreat(sector, state.threatConfig)
    const ratio = sMax > 0 ? sector.threatLevel / sMax : 0
    if (sector.sovereignty === "vss" && (sector.threatLevel >= 600 || ratio >= 0.6)) {
      const thresholdChainId = `chain_threshold_${sector.id}_day${state.currentDay}`
      // Kiểm tra xem đã có chuỗi tương tự đang active chưa
      const alreadyActive = Object.values(state.missionChains!).some(
        (c) => c.topology === "threshold" && c.sectorId === sector.id && c.status === "active"
      )
      if (!alreadyActive && currentActiveCount + activatedChains.length < MAX_ACTIVE_MISSION_CHAINS) {
        const startRes = startMissionChain(state, "chain_threshold_high_threat", {
          customChainId: thresholdChainId,
          targetSectorId: sector.id,
        })
        if (startRes.success) {
          activatedChains.push(thresholdChainId)
          logs.push(
            `[MISSION ACTIVATION] Áp lực đe dọa tại ${sector.name} vượt ngưỡng (${sector.threatLevel.toLocaleString()} / ${sMax.toLocaleString()}). Kích hoạt chiến dịch phòng tuyến khẩn nguy!`
          )
        }
      }
    }
  }

  // 2. Kiểm tra Reactive: Có sector VSS nào đang Under Siege không?
  for (const sector of Object.values(state.sectors)) {
    if (sector.sovereignty === "vss" && sector.stage === "under_siege") {
      const reactiveChainId = `chain_reactive_${sector.id}_day${state.currentDay}`
      const alreadyActive = Object.values(state.missionChains!).some(
        (c) => c.topology === "reactive" && c.sectorId === sector.id && c.status === "active"
      )
      if (!alreadyActive && currentActiveCount + activatedChains.length < MAX_ACTIVE_MISSION_CHAINS) {
        const startRes = startMissionChain(state, "chain_reactive_rescue", {
          customChainId: reactiveChainId,
          targetSectorId: sector.id,
        })
        if (startRes.success) {
          activatedChains.push(reactiveChainId)
          logs.push(
            `[REACTIVE MISSION] Sector ${sector.name} bị vây hãm nghiêm trọng. Kích hoạt chiến dịch cứu viện khẩn cấp!`
          )
        }
      }
    }
  }

  // 3. Kiểm tra Periodic / Patrol: Chu kỳ tuần tra định kỳ
  const periodicTemplate = MISSION_CHAIN_TEMPLATES["chain_periodic_patrol"]
  if (periodicTemplate && periodicTemplate.recurringIntervalTicks) {
    const existingPeriodic = Object.values(state.missionChains!).find(
      (c) => c.templateId === "chain_periodic_patrol" && c.status === "active"
    )
    if (!existingPeriodic) {
      // Tìm lần chạy gần nhất
      const pastRuns = Object.values(state.missionChains!).filter(
        (c) => c.templateId === "chain_periodic_patrol" && c.status === "completed"
      )
      const lastTick = pastRuns.length > 0
        ? Math.max(...pastRuns.map((p) => p.completedAtTick || p.startedAtTick))
        : 0

      if (
        state.currentDay - lastTick >= periodicTemplate.recurringIntervalTicks &&
        currentActiveCount + activatedChains.length < MAX_ACTIVE_MISSION_CHAINS
      ) {
        const periodicId = `chain_patrol_day${state.currentDay}`
        const startRes = startMissionChain(state, "chain_periodic_patrol", {
          customChainId: periodicId,
          targetSectorId: "helios_perimeter",
        })
        if (startRes.success) {
          activatedChains.push(periodicId)
          logs.push(`[PERIODIC MISSION] Đến chu kỳ tuần tra biên giới định kỳ ngày ${state.currentDay}.`)
        }
      }
    }
  }

  return { activatedChains, logs }
}
