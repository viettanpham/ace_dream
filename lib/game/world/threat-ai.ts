/**
 * STARFRONT WORLD — Threat & The Void Strategic AI (Phase 6.5)
 * Hành vi chiến lược của phe The Void:
 *   - Đánh giá điểm yếu của phòng tuyến VSS (Threat cao, phòng thủ mỏng, tuyến đường khả dụng)
 *   - Lập kế hoạch điều quân quấy rối, vây hãm hoặc đột kích
 *   - Tuân thủ quy tắc bất khả xâm phạm của Căn Cứ Trung Tâm Sol Command HQ
 *   - Tất định 100% qua Seeded PRNG
 */

import { WorldPRNG } from "./random"
import { getAdjacentSectors } from "./graph"
import { calculateAutoResolve, commitAutoResolveResult } from "./auto-resolve"
import type {
  WorldSector,
  WorldState,
} from "./types"

export interface VoidStrategicAction {
  type: "probe_attack" | "siege_incursion" | "route_blockade" | "muster_forces"
  targetSectorId: string
  sourceSectorId?: string
  estimatedForce: number
  description: string
  executed: boolean
  combatTransactionId?: string
}

export interface VoidAIReport {
  day: number
  actionsPlanned: VoidStrategicAction[]
  actionsExecuted: number
  logs: string[]
}

/**
 * Kiểm tra xem sector có được bảo vệ bởi quy tắc bất khả xâm phạm hay không:
 * Sol Command HQ không thể bị Void tấn công trực tiếp nếu vành đai Helios hoặc Nebula còn đứng vững.
 */
export function isSectorInvulnerableToVoid(state: WorldState, sectorId: string): boolean {
  if (sectorId !== "sol_command_hq") {
    return false
  }

  // Sol HQ chỉ bị đe dọa khi cả Helios lẫn Nebula Bastion đều đã thất thủ về tay The Void
  const helios = state.sectors.helios_perimeter
  const nebula = state.sectors.nebula_bastion

  const perimeterIntact =
    (helios && helios.sovereignty === "vss") ||
    (nebula && nebula.sovereignty === "vss")

  return Boolean(perimeterIntact)
}

/**
 * Đánh giá điểm yếu của một sector để chọn mục tiêu tấn công cho The Void
 * Điểm ưu tiên cao hơn = mục tiêu hấp dẫn hơn
 */
export function evaluateSectorVulnerability(
  state: WorldState,
  targetSector: WorldSector,
  voidBaseSectorIds: string[]
): number {
  if (targetSector.sovereignty === "void") return -1
  if (isSectorInvulnerableToVoid(state, targetSector.id)) return -1

  // Kiểm tra xem có tuyến đường kết nối trực tiếp với ít nhất 1 căn cứ của Void hay không
  const adjacent = getAdjacentSectors(state.routes, targetSector.id, {
    allowOpen: true,
    allowHazardous: true,
    allowBlocked: false,
    allowOffline: false,
  })

  const hasDirectVoidAccess = adjacent.some((adj) =>
    voidBaseSectorIds.includes(adj.sectorId)
  )

  if (!hasDirectVoidAccess) {
    // Không tiếp giáp trực tiếp với lãnh thổ/tiền đồn Void
    return -1
  }

  let score = 0
  // Threat cao = nội ứng và quái Void dày đặc
  score += targetSector.threatLevel * 0.5

  // Garrison mỏng = dễ đánh chiếm
  score += Math.max(0, 600 - targetSector.garrisonPower) * 0.4

  // Stability thấp = dễ bạo loạn
  score += (100 - targetSector.stability) * 2

  // Nếu đang Under Siege thì ưu tiên dứt điểm
  if (targetSector.stage === "under_siege") {
    score += 200
  }

  return score
}

/**
 * Điều phối hành vi chiến lược của The Void trong Phase 4 của Tick Engine
 */
export function evaluateVoidStrategicBehavior(
  state: WorldState,
  prng: WorldPRNG
): VoidAIReport {
  const report: VoidAIReport = {
    day: state.currentDay,
    actionsPlanned: [],
    actionsExecuted: 0,
    logs: [],
  }

  // 1. Xác định các tiền đồn đang thuộc quyền kiểm soát của The Void hoặc Contested có Threat cao
  const voidBases: string[] = []
  for (const sector of Object.values(state.sectors)) {
    if (sector.sovereignty === "void" || (sector.sovereignty === "contested" && sector.threatLevel >= 700)) {
      voidBases.push(sector.id)
    }
  }

  if (voidBases.length === 0) {
    report.logs.push("Lực lượng The Void tạm thời phân tán; không có căn cứ xuất phát khả dụng.")
    return report
  }

  // 2. Tìm kiếm mục tiêu VSS dễ bị tổn thương nhất
  let bestTarget: WorldSector | null = null
  let highestScore = -1

  for (const sector of Object.values(state.sectors)) {
    if (sector.sovereignty === "vss" || sector.sovereignty === "contested") {
      const score = evaluateSectorVulnerability(state, sector, voidBases)
      if (score > highestScore) {
        highestScore = score
        bestTarget = sector
      }
    }
  }

  if (!bestTarget) {
    report.logs.push("Phòng tuyến VSS đang được bảo vệ kiên cố; The Void chuyển sang tích lũy lực lượng.")
    return report
  }

  // 3. Quyết định hành động chiến lược dựa trên mức đe dọa của mục tiêu
  if (bestTarget.stage === "under_siege" && bestTarget.threatLevel >= 800) {
    // Tấn công quyết định nhằm chiếm đóng
    const voidTroops = prng.nextInt(250, 400)
    const action: VoidStrategicAction = {
      type: "siege_incursion",
      targetSectorId: bestTarget.id,
      sourceSectorId: voidBases[0],
      estimatedForce: voidTroops,
      description: `The Void phát động tổng tấn công vây hãm tại ${bestTarget.name} với ${voidTroops} sinh cơ chiến hạm`,
      executed: false,
    }
    report.actionsPlanned.push(action)
    report.logs.push(action.description)
  } else if (bestTarget.threatLevel >= 450) {
    // Trinh sát quấy rối và tăng áp lực
    const voidTroops = prng.nextInt(100, 200)
    const action: VoidStrategicAction = {
      type: "probe_attack",
      targetSectorId: bestTarget.id,
      sourceSectorId: voidBases[0],
      estimatedForce: voidTroops,
      description: `Phi đội do thám Void quấy phá vành đai tuần tra tại ${bestTarget.name}`,
      executed: false,
    }
    report.actionsPlanned.push(action)
    report.logs.push(action.description)
  } else {
    // Tập hợp lực lượng
    const action: VoidStrategicAction = {
      type: "muster_forces",
      targetSectorId: voidBases[0],
      estimatedForce: 50,
      description: `The Void tăng cường sinh khối và tập hợp hạm đội tại ${voidBases[0]}`,
      executed: true,
    }
    report.actionsPlanned.push(action)
    report.actionsExecuted += 1
  }

  return report
}
