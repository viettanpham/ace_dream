/**
 * STARFRONT WORLD — 3-Pass Workforce Allocator & Reallocation Engine (Phase 6.34A-FND-4)
 *
 * Implements:
 * 1. Pass 1: MINIMUM staffing (ordered by strategic priority; stops if available runs out;
 *    under-minimum items flagged as non-operational).
 * 2. Pass 2: NORMAL / TARGET staffing (only runs if Pass 1 completed and available > 0;
 *    allocates ONLY delta up to Target).
 * 3. Pass 3: MAXIMUM staffing (only runs if Pass 2 completed and available > 0;
 *    allocates ONLY delta up to Maximum).
 * 4. Population conservation: populationCurrent = populationAvailable + populationOccupied.
 * 5. Reallocation: Base can release/reduce workforce on base-owned buildings (unless locked),
 *    but CANNOT reclaim Fleet/Guild crew.
 * 6. Idempotent recomputation.
 */

import type {
  BasePopulationState,
  BaseWorkforceAllocationReport,
  StaffingTier,
  WorkforceAllocationResult,
  WorkforceDemand,
} from "./types"

/**
 * Validates invariant: 0 <= minimum <= target <= maximum
 */
export function validateWorkforceDemand(demand: WorkforceDemand): {
  valid: boolean
  error?: string
} {
  if (demand.minimumPersonnel < 0) {
    return { valid: false, error: "Minimum personnel cannot be negative." }
  }
  if (demand.targetPersonnel < demand.minimumPersonnel) {
    return { valid: false, error: "Target personnel cannot be less than minimum." }
  }
  if (demand.maximumPersonnel < demand.targetPersonnel) {
    return { valid: false, error: "Maximum personnel cannot be less than target." }
  }
  return { valid: true }
}

/**
 * Determines staffing tier from assigned personnel count
 */
export function determineStaffingTier(
  assigned: number,
  min: number,
  target: number,
  max: number
): StaffingTier {
  if (assigned <= 0) return "NONE"
  if (assigned < min) return "UNDER_MINIMUM"
  if (assigned < target) return "MINIMUM"
  if (assigned < max) return "TARGET"
  return "MAXIMUM"
}

/**
 * Executes 3-pass workforce allocation on a set of demands from a Base's available pool
 */
export function allocateWorkforce(
  baseState: BasePopulationState,
  demands: WorkforceDemand[]
): BaseWorkforceAllocationReport {
  const diagnostics: string[] = []
  const availableBefore = baseState.populationAvailable
  let available = baseState.populationAvailable

  // Validate demands
  for (const d of demands) {
    const val = validateWorkforceDemand(d)
    if (!val.valid) {
      diagnostics.push(`Demand '${d.demandId}' invalid: ${val.error}`)
    }
  }

  // Filter excluded and active demands
  const activeDemands = demands.filter((d) => !d.isExcluded)
  const excludedDemands = demands.filter((d) => d.isExcluded)

  // Initialize tracking map
  const resultMap = new Map<string, WorkforceAllocationResult>()

  for (const d of excludedDemands) {
    resultMap.set(d.demandId, {
      demandId: d.demandId,
      targetRef: { ...d.targetRef },
      minimumPersonnel: d.minimumPersonnel,
      targetPersonnel: d.targetPersonnel,
      maximumPersonnel: d.maximumPersonnel,
      assignedPersonnel: 0,
      pass1Assigned: 0,
      pass2Assigned: 0,
      pass3Assigned: 0,
      shortfall: d.targetPersonnel,
      staffingTier: "NONE",
      operationalEligibility: false,
      isLocked: Boolean(d.isLocked),
      isExcluded: true,
      reasonCodes: ["EXCLUDED_BY_STRATEGY"],
    })
  }

  for (const d of activeDemands) {
    resultMap.set(d.demandId, {
      demandId: d.demandId,
      targetRef: { ...d.targetRef },
      minimumPersonnel: d.minimumPersonnel,
      targetPersonnel: d.targetPersonnel,
      maximumPersonnel: d.maximumPersonnel,
      assignedPersonnel: 0,
      pass1Assigned: 0,
      pass2Assigned: 0,
      pass3Assigned: 0,
      shortfall: d.targetPersonnel,
      staffingTier: "NONE",
      operationalEligibility: false,
      isLocked: Boolean(d.isLocked),
      isExcluded: false,
      reasonCodes: [],
    })
  }

  // -------------------------------------------------------------
  // VÒNG 1: MINIMUM PASS
  // -------------------------------------------------------------
  const pass1Sorted = [...activeDemands].sort((a, b) => b.priority - a.priority)
  let pass1TotalAssigned = 0
  let allMinimumsSatisfied = true

  for (const d of pass1Sorted) {
    const item = resultMap.get(d.demandId)!
    const needed = d.minimumPersonnel

    if (needed > 0) {
      const grant = Math.min(available, needed)
      item.pass1Assigned = grant
      item.assignedPersonnel += grant
      pass1TotalAssigned += grant
      available -= grant

      if (grant < needed) {
        allMinimumsSatisfied = false
        item.reasonCodes.push("SHORTFALL_MINIMUM")
      }
    }

    if (available === 0 && d !== pass1Sorted[pass1Sorted.length - 1]) {
      allMinimumsSatisfied = false
      break
    }
  }

  // -------------------------------------------------------------
  // VÒNG 2: NORMAL / TARGET PASS (Only if Pass 1 completed & available > 0)
  // -------------------------------------------------------------
  let pass2TotalAssigned = 0
  let allTargetsSatisfied = true

  if (allMinimumsSatisfied && available > 0) {
    const pass2Sorted = [...activeDemands].sort((a, b) => b.priority - a.priority)

    for (const d of pass2Sorted) {
      const item = resultMap.get(d.demandId)!
      const neededDelta = Math.max(0, d.targetPersonnel - item.assignedPersonnel)

      if (neededDelta > 0) {
        const grant = Math.min(available, neededDelta)
        item.pass2Assigned = grant
        item.assignedPersonnel += grant
        pass2TotalAssigned += grant
        available -= grant

        if (grant < neededDelta) {
          allTargetsSatisfied = false
          item.reasonCodes.push("SHORTFALL_TARGET")
        }
      }

      if (available === 0) {
        allTargetsSatisfied = false
        break
      }
    }
  } else if (!allMinimumsSatisfied) {
    diagnostics.push("Pass 2 (Target) skipped: Minimum staffing was not fully satisfied across all demands.")
  }

  // -------------------------------------------------------------
  // VÒNG 3: MAXIMUM PASS (Only if Pass 2 completed & available > 0)
  // -------------------------------------------------------------
  let pass3TotalAssigned = 0

  if (allMinimumsSatisfied && allTargetsSatisfied && available > 0) {
    const pass3Sorted = [...activeDemands].sort((a, b) => b.priority - a.priority)

    for (const d of pass3Sorted) {
      const item = resultMap.get(d.demandId)!
      const neededDelta = Math.max(0, d.maximumPersonnel - item.assignedPersonnel)

      if (neededDelta > 0) {
        const grant = Math.min(available, neededDelta)
        item.pass3Assigned = grant
        item.assignedPersonnel += grant
        pass3TotalAssigned += grant
        available -= grant
      }

      if (available === 0) break
    }
  }

  // Finalize tiers and operational eligibility for each demand
  const results: WorkforceAllocationResult[] = []
  let fullyStaffedCount = 0
  let minimumStaffedCount = 0
  let underMinimumCount = 0

  for (const d of demands) {
    const item = resultMap.get(d.demandId)!
    item.shortfall = Math.max(0, item.targetPersonnel - item.assignedPersonnel)
    item.staffingTier = determineStaffingTier(
      item.assignedPersonnel,
      item.minimumPersonnel,
      item.targetPersonnel,
      item.maximumPersonnel
    )
    item.operationalEligibility =
      item.minimumPersonnel === 0 ? true : item.assignedPersonnel >= item.minimumPersonnel

    if (item.assignedPersonnel >= item.targetPersonnel && !item.isExcluded) {
      fullyStaffedCount++
    }
    if (item.operationalEligibility && !item.isExcluded) {
      minimumStaffedCount++
    }
    if (!item.operationalEligibility && !item.isExcluded) {
      underMinimumCount++
    }

    results.push(item)
  }

  // Update Base Population State while preserving conservation:
  // populationCurrent = populationAvailable + populationOccupied
  const totalAssignedDelta = pass1TotalAssigned + pass2TotalAssigned + pass3TotalAssigned
  baseState.populationAvailable = available
  baseState.populationOccupied += totalAssignedDelta

  // Update breakdown by category
  for (const item of results) {
    const d = demands.find((dm) => dm.demandId === item.demandId)
    if (d && item.assignedPersonnel > 0) {
      const cat = d.assignmentCategory
      baseState.breakdown[cat] = (baseState.breakdown[cat] || 0) + item.assignedPersonnel
    }
  }

  return {
    baseId: baseState.baseId,
    totalAvailableBefore: availableBefore,
    totalAvailableAfter: available,
    totalAssignedDelta,
    pass1TotalAssigned,
    pass2TotalAssigned,
    pass3TotalAssigned,
    demandsEvaluated: demands.length,
    fullyStaffedCount,
    minimumStaffedCount,
    underMinimumCount,
    excludedCount: excludedDemands.length,
    results,
    diagnostics,
  }
}

/**
 * Releases workforce from a specific building or demand back to the Base's available pool.
 * Invariant: Cannot release locked assignments or Fleet crew owned by Fleet/Guild.
 */
export function releaseWorkforce(
  baseState: BasePopulationState,
  demand: WorkforceDemand,
  currentAllocation: WorkforceAllocationResult,
  releaseCount?: number
): { success: boolean; releasedCount: number; reason?: string } {
  if (demand.isLocked) {
    return { success: false, releasedCount: 0, reason: "LOCKED_ASSIGNMENT_CANNOT_BE_RELEASED" }
  }

  if (demand.assignmentCategory === "FLEET_CREW") {
    return {
      success: false,
      releasedCount: 0,
      reason: "FLEET_CREW_OWNED_BY_FLEET_CANNOT_BE_RECLAIMED_BY_BASE_AI",
    }
  }

  const toRelease =
    releaseCount !== undefined
      ? Math.min(releaseCount, currentAllocation.assignedPersonnel)
      : currentAllocation.assignedPersonnel

  if (toRelease <= 0) {
    return { success: true, releasedCount: 0 }
  }

  currentAllocation.assignedPersonnel -= toRelease
  baseState.populationAvailable += toRelease
  baseState.populationOccupied -= toRelease

  const cat = demand.assignmentCategory
  baseState.breakdown[cat] = Math.max(0, (baseState.breakdown[cat] || 0) - toRelease)

  currentAllocation.staffingTier = determineStaffingTier(
    currentAllocation.assignedPersonnel,
    demand.minimumPersonnel,
    demand.targetPersonnel,
    demand.maximumPersonnel
  )
  currentAllocation.operationalEligibility =
    demand.minimumPersonnel === 0
      ? true
      : currentAllocation.assignedPersonnel >= demand.minimumPersonnel
  currentAllocation.shortfall = Math.max(0, demand.targetPersonnel - currentAllocation.assignedPersonnel)

  return { success: true, releasedCount: toRelease }
}

/**
 * Resets non-locked base allocations so re-running allocator is idempotent
 */
export function resetReallocatableWorkforce(
  baseState: BasePopulationState,
  demands: WorkforceDemand[],
  currentAllocations: WorkforceAllocationResult[]
): number {
  let totalReset = 0

  for (const alloc of currentAllocations) {
    const demand = demands.find((d) => d.demandId === alloc.demandId)
    if (demand && !demand.isLocked && demand.assignmentCategory !== "FLEET_CREW") {
      const count = alloc.assignedPersonnel
      if (count > 0) {
        alloc.assignedPersonnel = 0
        alloc.pass1Assigned = 0
        alloc.pass2Assigned = 0
        alloc.pass3Assigned = 0
        alloc.shortfall = demand.targetPersonnel
        alloc.staffingTier = "NONE"
        alloc.operationalEligibility = demand.minimumPersonnel === 0

        baseState.populationAvailable += count
        baseState.populationOccupied -= count
        baseState.breakdown[demand.assignmentCategory] = Math.max(
          0,
          (baseState.breakdown[demand.assignmentCategory] || 0) - count
        )
        totalReset += count
      }
    }
  }

  return totalReset
}
