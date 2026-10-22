/**
 * STARFRONT WORLD — Fleet AI Command & Autonomous Decision Engine (Phase 7.4)
 *
 * Implements:
 * 1. Fleet AI Personas (FleetAIPersona):
 *    - AGGRESSIVE_VANGUARD: Aggressive assault, seeks hostile threats, retreats only under severe hull compromise (< 25%).
 *    - STEADFAST_DEFENDER: Sector guard, prioritizes defending capital and bases, holds line until broken (< 20%).
 *    - RESOURCE_EXPEDITION: Escorts mining & deep space expeditions, disengages if threat > 45%.
 *    - TACTICAL_RECON: Stealth & sensor gathering, rapid tactical disengagement (< 50% threat threshold).
 *    - COMMERCIAL_ESCORT: Protects supply freighters, tight escort geometry, returns fire when attacked.
 * 2. Readiness Evaluation:
 *    - Integrated metric combining average hull integrity, crew efficiency, and morale.
 * 3. National Emergency Orders:
 *    - Honors emergency command if Capital is under siege or Sector threat >= cutoff and fleet readiness >= 60%.
 * 4. Autonomous Retreat & Preservation:
 *    - Issues tactical retreat order to nearest allied Base when critical thresholds are breached.
 */

import type { ShipInstance } from "../ship/types"
import type { FleetPersonnelState } from "./fleet-personnel"
import type { EmergencyCommandThresholds } from "./catalog-types"

export type FleetAIPersona =
  | "AGGRESSIVE_VANGUARD"
  | "STEADFAST_DEFENDER"
  | "RESOURCE_EXPEDITION"
  | "TACTICAL_RECON"
  | "COMMERCIAL_ESCORT"

export type FleetTacticalDecision =
  | "ENGAGE_HOSTILE"
  | "PATROL_SECTOR"
  | "STANDBY_DOCK"
  | "RETREAT_TO_BASE"
  | "ANSWER_NATIONAL_EMERGENCY"
  | "HOLD_POSITION"

export interface FleetReadinessReport {
  overallReadinessPercent: number // 0..100
  averageHullPercent: number
  averageShieldPercent: number
  canOperateShipsRatio: number
  morale: number
  isCombatReady: boolean
  deficiencies: string[]
}

/**
 * Calculates the holistic combat readiness score of a Fleet
 */
export function evaluateFleetReadiness(
  ships: Record<string, ShipInstance> | ShipInstance[],
  personnel: FleetPersonnelState
): FleetReadinessReport {
  const shipList = Array.isArray(ships) ? ships : Object.values(ships)
  if (shipList.length === 0) {
    return {
      overallReadinessPercent: 0,
      averageHullPercent: 0,
      averageShieldPercent: 0,
      canOperateShipsRatio: 0,
      morale: personnel.morale,
      isCombatReady: false,
      deficiencies: ["No ships assigned to fleet biên chế"],
    }
  }

  let totalHullRatio = 0
  let totalShieldRatio = 0
  let operationalCount = 0
  const deficiencies: string[] = []

  for (const ship of shipList) {
    const maxHull = ship.maxHullHp || 1
    const currentHull = ship.hullHp !== undefined ? ship.hullHp : maxHull
    const hullRatio = Math.max(0, Math.min(1, currentHull / maxHull))

    const maxShield = ship.maxShieldHp || 1
    const currentShield = ship.shieldHp !== undefined ? ship.shieldHp : maxShield
    const shieldRatio = Math.max(0, Math.min(1, currentShield / maxShield))

    totalHullRatio += hullRatio
    totalShieldRatio += shieldRatio

    const canOperate = (ship as any).canOperate ?? true
    if (canOperate) {
      operationalCount += 1
    } else {
      deficiencies.push(`Ship ${ship.customName || ship.instanceId} understaffed / cannot operate`)
    }
  }

  const averageHullPercent = Math.round((totalHullRatio / shipList.length) * 100)
  const averageShieldPercent = Math.round((totalShieldRatio / shipList.length) * 100)
  const canOperateShipsRatio = operationalCount / shipList.length

  if (personnel.morale < 40) {
    deficiencies.push(`Low crew morale: ${personnel.morale}%`)
  }
  if (averageHullPercent < 50) {
    deficiencies.push(`Severe fleet hull wear: ${averageHullPercent}%`)
  }

  // Weighted overall readiness: 50% Hull, 25% Crew/CanOperate, 25% Morale
  const overallReadinessPercent = Math.round(
    averageHullPercent * 0.5 +
    canOperateShipsRatio * 100 * 0.25 +
    personnel.morale * 0.25
  )

  const isCombatReady = overallReadinessPercent >= 60 && operationalCount > 0

  return {
    overallReadinessPercent,
    averageHullPercent,
    averageShieldPercent,
    canOperateShipsRatio,
    morale: personnel.morale,
    isCombatReady,
    deficiencies,
  }
}

/**
 * Autonomous decision logic for a Fleet based on its AI Persona, situational awareness, and National Directives
 */
export function evaluateFleetAutonomousDecision(
  persona: FleetAIPersona,
  ships: Record<string, ShipInstance> | ShipInstance[],
  personnel: FleetPersonnelState,
  sectorThreatLevel: number, // 0..100
  isCapitalUnderSiege: boolean,
  emergencyThresholds?: EmergencyCommandThresholds
): {
  decision: FleetTacticalDecision
  reason: string
  readiness: FleetReadinessReport
} {
  const readiness = evaluateFleetReadiness(ships, personnel)

  // 1. National Emergency Directive Check
  const minReadiness = emergencyThresholds?.minFleetReadinessPercent ?? 60
  const threatCutoff = emergencyThresholds?.sectorThreatLevelCutoff ?? 85

  if (isCapitalUnderSiege && readiness.overallReadinessPercent >= minReadiness) {
    return {
      decision: "ANSWER_NATIONAL_EMERGENCY",
      reason: "Bảo vệ Thủ phủ Quốc gia: Nhận Lệnh Khẩn Cấp Tối Cao (Capital Under Siege)",
      readiness,
    }
  }

  if (sectorThreatLevel >= threatCutoff && readiness.overallReadinessPercent >= minReadiness) {
    return {
      decision: "ANSWER_NATIONAL_EMERGENCY",
      reason: `Can thiệp khủng hoảng: Sector đe dọa cực hạn (${sectorThreatLevel} >= ${threatCutoff})`,
      readiness,
    }
  }

  // 2. Persona Survival & Retreat Thresholds
  let retreatHullThreshold = 25
  switch (persona) {
    case "AGGRESSIVE_VANGUARD":
      retreatHullThreshold = 25
      break
    case "STEADFAST_DEFENDER":
      retreatHullThreshold = 20
      break
    case "COMMERCIAL_ESCORT":
      retreatHullThreshold = 35
      break
    case "RESOURCE_EXPEDITION":
      retreatHullThreshold = 45
      break
    case "TACTICAL_RECON":
      retreatHullThreshold = 55
      break
  }

  if (readiness.averageHullPercent < retreatHullThreshold || readiness.morale < 25) {
    return {
      decision: "RETREAT_TO_BASE",
      reason: `Tổn thất vượt ngưỡng an toàn (${readiness.averageHullPercent}% < ${retreatHullThreshold}%). Kích hoạt quy trình bảo toàn lực lượng`,
      readiness,
    }
  }

  // 3. Operational Engagement / Patrol based on Persona
  if (sectorThreatLevel > 50) {
    if (persona === "RESOURCE_EXPEDITION" || (persona === "TACTICAL_RECON" && sectorThreatLevel > 70)) {
      return {
        decision: "RETREAT_TO_BASE",
        reason: `Mức độ đe dọa (${sectorThreatLevel}%) vượt quá năng lực phi tác chiến của đội hình ${persona}`,
        readiness,
      }
    }

    if (readiness.isCombatReady) {
      return {
        decision: "ENGAGE_HOSTILE",
        reason: `Chủ động nghênh chiến mục tiêu đe dọa (${sectorThreatLevel}%) theo tôn chỉ ${persona}`,
        readiness,
      }
    }
  }

  // 4. Default Routine
  return {
    decision: "PATROL_SECTOR",
    reason: `Duy trì tuần tra kiểm soát không phận bình thường (${readiness.overallReadinessPercent}% sẵn sàng)`,
    readiness,
  }
}
