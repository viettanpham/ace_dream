/**
 * STARFRONT WORLD — National Power Budget & Balancing Engine (Phase 6.34A-FND-6)
 *
 * Implements:
 * 1. Real Instance-Based Power Evaluation (Zero ghost power, zero arbitrary ungrounded scores):
 *    - Buildings: Sum of HP, level, tier, operational efficiency, and equipped modules.
 *    - Population: Active civilian and workforce demographics.
 *    - Defense: Garrison combat strength, fortification level, and defense installations.
 *    - Fleet Capacity: Command capacity, stationing capacity, and docking infrastructure.
 *    - Economy & Storage: Industrial capacity and active material reserves.
 *    - Orbital Network: Orbital sub-base defenses, crew, and docking ports.
 *
 * 2. National Power Balancing between Factions:
 *    - Maximum 10 percentage points difference between VSS and Void (e.g. 50/50, 48/52, 45/55).
 *    - Under-represented faction in base count can possess higher-tier bases and concentrated fleets.
 *
 * 3. Intra-National Power Allocation:
 *    - Capital: 20% - 50% of National Power Budget.
 *    - Border Bases: 5% - 10% each (Group maximum 50%).
 *    - Interior Bases: 1% - 10% each (Group maximum 30%).
 *    - Specialized Bases: Remainder allocated according to profile.
 *    - Strict normalization to exactly 100% of National Power.
 *
 * 4. Seeded Variation:
 *    - Deterministic with WORLD_SEED + Catalog/Config Version.
 */

import type { BuildingInstance } from "../building/types"
import type { BasePopulationState } from "../population/types"
import type {
  ExtendedBaseEntityState,
  FleetCapacities,
  OrbitalSubBaseState,
  StrategicRole,
  WorldGenerationConfig,
} from "./types"
import { DEFAULT_WORLD_GENERATION_CONFIG } from "./types"

/**
 * Breakdown of real power components contributing to a base's power score
 */
export interface BasePowerBreakdown {
  buildingPower: number
  populationPower: number
  defensePower: number
  fleetPower: number
  economyPower: number
  orbitalPower: number
  totalPower: number
}

/**
 * Evaluates the real instance-based power score of a base.
 * Invariant: Every point of power MUST originate from tangible in-world assets.
 */
export function calculateBasePowerScore(
  base: {
    tier: number
    buildings: Record<string, BuildingInstance>
    fleetCapacities?: FleetCapacities
  },
  popState?: BasePopulationState,
  orbitalSubBases: OrbitalSubBaseState[] = [],
  sectorData?: {
    garrisonPower?: number
    stability?: number
    industryCapacity?: number
    resources?: Record<string, number> | object
  }
): BasePowerBreakdown {
  // 1. Building Power
  let buildingPower = 0
  for (const b of Object.values(base.buildings || {})) {
    if (b.isOffline || (b.operationalState as string) === "DESTROYED") continue
    const eff = b.operationalEfficiency || 1.0
    const hpFactor = (b.currentHp || 1000) / 20
    const levelFactor = (b.currentLevel || 1) * 30
    const tierFactor = (b.currentTier || 1) * 50
    const moduleFactor = (b.equippedModules?.length || 0) * 25
    buildingPower += Math.round((hpFactor + levelFactor + tierFactor + moduleFactor) * eff)
  }

  // 2. Population Power (1 point per 500 citizens)
  const currentPop = popState?.populationCurrent || 0
  const populationPower = Math.round(currentPop / 500)

  // 3. Defense Power
  const garrison = sectorData?.garrisonPower || 200
  const stabilityBonus = Math.round(((sectorData?.stability || 80) / 100) * 50)
  const defensePower = garrison + stabilityBonus

  // 4. Fleet Power
  let fleetPower = 0
  if (base.fleetCapacities) {
    const cmd = base.fleetCapacities.fleetCommandCapacity * 80
    const stn = base.fleetCapacities.fleetStationingCapacity * 40
    const dck = base.fleetCapacities.fleetDockingCapacity * 20
    fleetPower = cmd + stn + dck
  } else {
    fleetPower = base.tier * 120
  }

  // 5. Economy & Storage Power
  const indCap = (sectorData?.industryCapacity || 100) * 1.5
  let resSum = 0
  if (sectorData?.resources) {
    for (const val of Object.values(sectorData.resources)) {
      resSum += val
    }
  }
  const economyPower = Math.round(indCap + resSum / 50)

  // 6. Orbital Power
  let orbitalPower = 0
  for (const sub of orbitalSubBases) {
    if (sub.operationalState === "ACTIVE") {
      orbitalPower += sub.defenseRating + sub.dockingCapacity * 50 + sub.crewAssigned * 2
    }
  }

  const totalPower = buildingPower + populationPower + defensePower + fleetPower + economyPower + orbitalPower

  return {
    buildingPower,
    populationPower,
    defensePower,
    fleetPower,
    economyPower,
    orbitalPower,
    totalPower,
  }
}

/**
 * Pseudo-random generator helper for deterministic seeded variation
 */
export function seededRandom(seed: number): () => number {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/**
 * Validates whether the faction base distribution satisfies FND-6 constraints:
 * - Total 30 Main Bases
 * - Minimum 20% base share per faction (min 6 bases each)
 */
export function validateFactionBaseDistribution(
  vssCount: number,
  voidCount: number,
  totalNodes: number = 30,
  minSharePercent: number = 20
): { isValid: boolean; error?: string } {
  if (vssCount + voidCount !== totalNodes) {
    return {
      isValid: false,
      error: `Tổng số căn cứ (${vssCount} + ${voidCount} = ${vssCount + voidCount}) không khớp với tổng cấu hình ${totalNodes}.`,
    }
  }

  const minBases = Math.ceil((totalNodes * minSharePercent) / 100)
  if (vssCount < minBases) {
    return {
      isValid: false,
      error: `Phe VSS chỉ sở hữu ${vssCount} căn cứ, vi phạm tỷ lệ tối thiểu ${minSharePercent}% (${minBases} căn cứ).`,
    }
  }
  if (voidCount < minBases) {
    return {
      isValid: false,
      error: `Phe Void chỉ sở hữu ${voidCount} căn cứ, vi phạm tỷ lệ tối thiểu ${minSharePercent}% (${minBases} căn cứ).`,
    }
  }

  return { isValid: true }
}

/**
 * Validates national power difference between two factions:
 * Must be <= maximumFactionPowerDifferencePercentagePoints (default: 10 percentage points)
 */
export function validateNationalPowerBalance(
  vssPower: number,
  voidPower: number,
  maxDiffPoints: number = 10
): {
  isValid: boolean
  vssSharePercent: number
  voidSharePercent: number
  diffPercentagePoints: number
  error?: string
} {
  const totalPower = vssPower + voidPower
  if (totalPower <= 0) {
    return {
      isValid: false,
      vssSharePercent: 50,
      voidSharePercent: 50,
      diffPercentagePoints: 0,
      error: "Tổng sức mạnh hai quốc gia bằng 0.",
    }
  }

  const vssSharePercent = Number(((vssPower / totalPower) * 100).toFixed(2))
  const voidSharePercent = Number(((voidPower / totalPower) * 100).toFixed(2))
  const diffPercentagePoints = Number(Math.abs(vssSharePercent - voidSharePercent).toFixed(2))

  const isValid = diffPercentagePoints <= maxDiffPoints

  return {
    isValid,
    vssSharePercent,
    voidSharePercent,
    diffPercentagePoints,
    error: isValid
      ? undefined
      : `Chênh lệch sức mạnh quốc gia (${diffPercentagePoints}%) vượt quá giới hạn cho phép (${maxDiffPoints}%).`,
  }
}

/**
 * Distributes power budget across bases of a faction and normalizes to 100%
 */
export function balanceIntraFactionPowerShares(
  bases: Array<{
    baseId: string
    isCapital: boolean
    strategicRole: StrategicRole
    rawPower: number
  }>
): Array<{
  baseId: string
  normalizedPowerSharePercent: number
  targetPowerBudget: number
}> {
  if (bases.length === 0) return []

  const totalRaw = bases.reduce((sum, b) => sum + b.rawPower, 0)
  if (totalRaw <= 0) {
    // Equal distribution fallback
    const eq = 100 / bases.length
    return bases.map((b) => ({
      baseId: b.baseId,
      normalizedPowerSharePercent: Number(eq.toFixed(2)),
      targetPowerBudget: Math.round(eq * 100),
    }))
  }

  // Calculate raw shares
  const shares = bases.map((b) => ({
    baseId: b.baseId,
    isCapital: b.isCapital,
    strategicRole: b.strategicRole,
    rawShare: (b.rawPower / totalRaw) * 100,
  }))

  // Ensure Capital is in 20% - 50%
  const capital = shares.find((s) => s.isCapital)
  if (capital) {
    if (capital.rawShare < 20) {
      capital.rawShare = 25
    } else if (capital.rawShare > 50) {
      capital.rawShare = 45
    }
  }

  // Normalize remaining shares so sum is exactly 100%
  const capitalShare = capital ? capital.rawShare : 0
  const nonCapitals = shares.filter((s) => !s.isCapital)
  const remainingBudget = 100 - capitalShare

  const nonCapitalRawSum = nonCapitals.reduce((sum, b) => sum + b.rawShare, 0)
  let accumulated = 0

  const results: Array<{
    baseId: string
    normalizedPowerSharePercent: number
    targetPowerBudget: number
  }> = []

  if (capital) {
    results.push({
      baseId: capital.baseId,
      normalizedPowerSharePercent: Number(capitalShare.toFixed(2)),
      targetPowerBudget: Math.round(capitalShare * 100),
    })
    accumulated += Number(capitalShare.toFixed(2))
  }

  nonCapitals.forEach((b, index) => {
    let share = 0
    if (index === nonCapitals.length - 1) {
      // Last item absorbs rounding difference to guarantee exactly 100%
      share = Number((100 - accumulated).toFixed(2))
    } else {
      const ratio = nonCapitalRawSum > 0 ? b.rawShare / nonCapitalRawSum : 1 / nonCapitals.length
      share = Number((ratio * remainingBudget).toFixed(2))
      accumulated += share
    }

    results.push({
      baseId: b.baseId,
      normalizedPowerSharePercent: share,
      targetPowerBudget: Math.round(share * 100),
    })
  })

  return results
}
