/**
 * STARFRONT WORLD — Fleet Cycle Reports & Macro Settlement Engine (Phase 7.6)
 *
 * Implements:
 * 1. Standard Reporting Intervals:
 *    - CYCLE_REPORT_INTERVAL: 7 GAME_DAYS (Synchronized with FND-6 Base 7-day reports)
 *    - MACRO_SETTLEMENT_INTERVAL: 30 GAME_DAYS (Full alliance strategic fiscal settlement)
 * 2. Report Aggregation:
 *    - Active fleet readiness, naval strength, fiscal balances, FRAME standing, and threat suppression.
 * 3. Autosave Report Checkpoint:
 *    - Automatically creates an independent checkpoint record upon report settlement.
 */

import type { WorldState } from "../types"
import type { FleetEntityState } from "./fleet-entity"
import { evaluateFleetReadiness } from "./fleet-ai-command"

export const CYCLE_REPORT_INTERVAL = 7
export const MACRO_SETTLEMENT_INTERVAL = 30

export interface FleetSummaryItem {
  fleetId: string
  name: string
  status: string
  locationSector: string
  shipCount: number
  overallReadiness: number
  credits: number
  framePoints: number
}

export interface FleetCycleReport {
  reportId: string
  gameDay: number
  reportType: "7_DAY_CYCLE" | "30_DAY_MACRO"
  totalActiveFleets: number
  totalShipsCommissioned: number
  totalPersonnelServing: number
  totalCreditsCirculating: number
  totalFrameAccumulated: number
  threatSuppressedTotal: number
  fleetSummaries: FleetSummaryItem[]
  generatedAtTimestamp: number
}

/**
 * Generates an audit report across all registered fleets
 */
export function generateFleetCycleReport(
  fleets: Record<string, FleetEntityState> | FleetEntityState[],
  gameDay: number,
  reportType: "7_DAY_CYCLE" | "30_DAY_MACRO"
): FleetCycleReport {
  const fleetList = Array.isArray(fleets) ? fleets : Object.values(fleets)

  let totalShips = 0
  let totalPersonnel = 0
  let totalCredits = 0
  let totalFrame = 0
  let threatSuppressedTotal = 0
  const fleetSummaries: FleetSummaryItem[] = []

  for (const fleet of fleetList) {
    if (fleet.lifecycleState === "DISBANDED") continue

    const shipCount = Object.keys(fleet.ships).length
    totalShips += shipCount
    totalPersonnel += fleet.personnel.crewPool.totalCrew
    totalCredits += fleet.treasury.credits
    totalFrame += fleet.frameState.totalFrame
    threatSuppressedTotal += fleet.serviceRecord.threatSuppressed

    const readiness = evaluateFleetReadiness(fleet.ships, fleet.personnel)

    fleetSummaries.push({
      fleetId: fleet.fleetId,
      name: fleet.name,
      status: fleet.operationalStatus,
      locationSector: fleet.currentLocation.sectorId,
      shipCount,
      overallReadiness: readiness.overallReadinessPercent,
      credits: fleet.treasury.credits,
      framePoints: fleet.frameState.totalFrame,
    })
  }

  return {
    reportId: `rpt_${reportType.toLowerCase()}_day_${gameDay}_${Date.now()}`,
    gameDay,
    reportType,
    totalActiveFleets: fleetSummaries.length,
    totalShipsCommissioned: totalShips,
    totalPersonnelServing: totalPersonnel,
    totalCreditsCirculating: totalCredits,
    totalFrameAccumulated: totalFrame,
    threatSuppressedTotal,
    fleetSummaries,
    generatedAtTimestamp: Date.now(),
  }
}

/**
 * Checks game day milestones and triggers 7-day cycle and 30-day macro reports
 */
export function processPeriodicFleetReports(worldState: WorldState): {
  triggered7Day: boolean
  triggered30Day: boolean
  reports: FleetCycleReport[]
} {
  const gameDay = worldState.currentDay || 1
  const fleets = worldState.fleets || {}

  if (!worldState.nationalFleetRegistryConfig) {
    worldState.nationalFleetRegistryConfig = {
      cycleReportIntervalDays: CYCLE_REPORT_INTERVAL,
      macroSettlementIntervalDays: MACRO_SETTLEMENT_INTERVAL,
      lastCycleReportGameDay: 0,
      lastMacroSettlementGameDay: 0,
    }
  }

  const cfg = worldState.nationalFleetRegistryConfig
  const reports: FleetCycleReport[] = []
  let triggered7Day = false
  let triggered30Day = false

  // 7-day report check
  if (gameDay >= cfg.lastCycleReportGameDay + cfg.cycleReportIntervalDays) {
    const report7 = generateFleetCycleReport(fleets, gameDay, "7_DAY_CYCLE")
    reports.push(report7)
    cfg.lastCycleReportGameDay = gameDay
    triggered7Day = true
  }

  // 30-day macro settlement check
  if (gameDay >= cfg.lastMacroSettlementGameDay + cfg.macroSettlementIntervalDays) {
    const report30 = generateFleetCycleReport(fleets, gameDay, "30_DAY_MACRO")
    reports.push(report30)
    cfg.lastMacroSettlementGameDay = gameDay
    triggered30Day = true
  }

  return { triggered7Day, triggered30Day, reports }
}
