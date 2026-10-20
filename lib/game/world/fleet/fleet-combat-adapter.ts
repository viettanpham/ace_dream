/**
 * STARFRONT WORLD — Fleet Combat V2 Adapter & Engagement Settlement Engine (Phase 7.6)
 *
 * Implements:
 * 1. Combat V2 Integration:
 *    - Transforms FleetEntityState into CombatSupportEntity ("carrier" or "fleet_support")
 *    - Provides carrier strike wings and capital ship artillery support on tactical battle grids.
 * 2. Combat Engagement Settlement:
 *    - Distributes hull damage and condition wear pro-rata across assigned vessels.
 *    - Deducts crew casualties and applies morale shock.
 *    - Updates permanent FleetServiceLog (battles, victories, kills, threat suppressed, honors).
 *    - Awards FRAME merit points to fleet upon victorious engagements.
 */

import type { FleetEntityState } from "./fleet-entity"
import type { CombatSupportEntity } from "../combat-v2-types"
import { getFrameAward } from "./registry-integration"
import { awardFleetFrame } from "./fleet-frame-engine"

export interface FleetCombatOutcome {
  victory: boolean
  rounds: number
  damageReceivedPercent: number // 0..100
  enemyKillsCount: number
  threatSuppressedPoints: number
  pilotsRescuedCount?: number
  gameDay: number
}

export interface FleetCombatSettlementResult {
  fleetId: string
  victory: boolean
  totalDamageInflictedOnFleet: number
  shipsDamagedCount: number
  casualtiesCount: number
  moraleAfterCombat: number
  frameAwarded: number
  serviceLogUpdated: boolean
}

/**
 * Converts a FleetEntityState into a CombatSupportEntity for the Combat V2 tactical grid
 */
export function adaptFleetToCombatSupport(fleet: FleetEntityState): CombatSupportEntity {
  const ships = Object.values(fleet.ships)
  const hasCarrier = ships.some((s) => s.definitionId.includes("CARRIER"))

  let totalSupportPower = 0
  for (const ship of ships) {
    totalSupportPower += Math.round((ship.hullHp + ship.shieldHp) / 10)
  }

  const supportType = hasCarrier ? "carrier" : "fleet_support"

  return {
    id: `support_${fleet.fleetId}`,
    name: fleet.name,
    side: "allied",
    type: supportType,
    currentHp: Math.max(1000, totalSupportPower * 10),
    maxHp: Math.max(1000, totalSupportPower * 10),
    callsign: fleet.customCallsign,
    specialization: hasCarrier ? "FIGHTER_STRIKE_WAVE" : "ORBITAL_BARRAGE",
    supportPower: Math.max(100, totalSupportPower),
    isReady: true,
    hasPassiveBuff: true,
    passiveDescription: hasCarrier ? "FIGHTER_STRIKE_WAVE: Chi viện phi đội" : "ORBITAL_BARRAGE: Pháo kích quỹ đạo",
    activeSkillName: hasCarrier ? "Phi Đội Cường Kích" : "Hỏa Lực Pháo Hạm",
    activeCooldownRemaining: 0,
    activeCooldownMax: 3,
    controlMode: "auto",
  } as CombatSupportEntity & { callsign?: string; specialization?: string; supportPower: number; isReady: boolean }
}

/**
 * Authoritatively settles combat consequences on a Fleet
 */
export function settleFleetCombatOutcome(
  fleet: FleetEntityState,
  outcome: FleetCombatOutcome
): FleetCombatSettlementResult {
  const ships = Object.values(fleet.ships)
  let totalDamageInflicted = 0
  let shipsDamaged = 0

  // 1. Distribute damage across ships
  const damageRatio = Math.max(0, Math.min(1.0, outcome.damageReceivedPercent / 100))

  for (const ship of ships) {
    if (damageRatio > 0) {
      const damageToHull = Math.round(ship.maxHullHp * damageRatio * 0.5)
      const damageToShield = Math.round(ship.maxShieldHp * damageRatio * 0.8)

      ship.hullHp = Math.max(1, ship.hullHp - damageToHull)
      ship.shieldHp = Math.max(0, ship.shieldHp - damageToShield)
      ship.condition = Math.max(10, Math.round((ship.condition - (damageRatio * 8)) * 10) / 10)
      ship.battlesCount = (ship.battlesCount || 0) + 1

      totalDamageInflicted += damageToHull + damageToShield
      shipsDamaged += 1
    }
  }

  // 2. Casualties and Morale
  let casualties = 0
  if (damageRatio > 0.2) {
    casualties = Math.max(1, Math.round(fleet.personnel.crewPool.crewAssigned * damageRatio * 0.05))
    fleet.personnel.crewPool.crewAssigned = Math.max(0, fleet.personnel.crewPool.crewAssigned - casualties)
    fleet.personnel.crewPool.totalCrew = Math.max(0, fleet.personnel.crewPool.totalCrew - casualties)

    fleet.personnel.casualtyHistory.push({
      gameDay: outcome.gameDay,
      count: casualties,
      cause: outcome.victory ? "Thương vong trong trận đại thắng" : "Tổn thất giao tranh phòng ngự",
    })
  }

  // Morale adjustment
  if (outcome.victory) {
    fleet.personnel.morale = Math.min(100, fleet.personnel.morale + 10)
  } else {
    fleet.personnel.morale = Math.max(10, fleet.personnel.morale - 25)
  }

  // 3. Update Service Log
  fleet.serviceRecord.totalBattlesEngaged += 1
  if (outcome.victory) {
    fleet.serviceRecord.victoriesCount += 1
  }
  fleet.serviceRecord.enemiesDestroyed += outcome.enemyKillsCount
  fleet.serviceRecord.threatSuppressed += outcome.threatSuppressedPoints
  fleet.serviceRecord.pilotsRescued += outcome.pilotsRescuedCount || 0
  fleet.serviceRecord.totalCasualtiesSustained += casualties

  // 4. Award FRAME points on victory
  let frameAwarded = 0
  if (outcome.victory) {
    const awardDef = getFrameAward("FRAME_AWARD_BOSS_ELIMINATION")
    if (awardDef) {
      const awardRes = awardFleetFrame(fleet.frameState, awardDef, 75, outcome.gameDay)
      frameAwarded = awardRes.pointsAwarded
    }
  }

  fleet.updatedAtGameDay = outcome.gameDay

  return {
    fleetId: fleet.fleetId,
    victory: outcome.victory,
    totalDamageInflictedOnFleet: totalDamageInflicted,
    shipsDamagedCount: shipsDamaged,
    casualtiesCount: casualties,
    moraleAfterCombat: fleet.personnel.morale,
    frameAwarded,
    serviceLogUpdated: true,
  }
}
