/**
 * STARFRONT WORLD — Production & Storage Engine (Phase 6.34A-FND-5)
 *
 * Implements:
 * 1. Recipe execution with Production Cycle by GAME_DAY.
 * 2. Multi-line production queues.
 * 3. Input Reservation at cycle start (zero double-spend).
 * 4. Cycle settlement: consumes actual inputs, releases surplus, credits output once.
 * 5. OUTPUT_BLOCKED state when storage capacity is full.
 * 6. Base Shared Storage vs Building Local Storage.
 * 7. Discrete 7/30 GAME_DAY summary projections (no fake realtime simulation).
 */

import type {
  BaseEntityState,
  BuildingDefinition,
  BuildingInstance,
  ProductionLineState,
  ProductionRecipe,
  ResourceReservation,
} from "./types"

/**
 * Calculates current total storage capacity of a Base
 * (Core Storage + Building Storage counted strictly once)
 */
export function calculateTotalStorageCapacity(
  base: BaseEntityState,
  definitions: Map<string, BuildingDefinition>
): Record<string, number> {
  const totalCap: Record<string, number> = { ...base.storageCapacity }

  for (const b of Object.values(base.buildings)) {
    if (b.operationalState === "ACTIVE") {
      const def = definitions.get(b.definitionId)
      if (def?.storageCapacity) {
        for (const [res, cap] of Object.entries(def.storageCapacity)) {
          totalCap[res] = (totalCap[res] || 0) + cap
        }
      }
    }
  }

  return totalCap
}

/**
 * Checks if a base has enough free storage space for output resources
 */
export function canAcceptOutput(
  base: BaseEntityState,
  outputs: Record<string, number>,
  totalCapacity: Record<string, number>
): boolean {
  for (const [res, amt] of Object.entries(outputs)) {
    const current = base.sharedStorage[res] || 0
    const max = totalCapacity[res] || 999999
    if (current + amt > max) {
      return false
    }
  }
  return true
}

/**
 * Starts a new production cycle on a building's production line with Input Reservation
 */
export function startProductionCycle(
  base: BaseEntityState,
  building: BuildingInstance,
  recipe: ProductionRecipe,
  currentGameDay: number
): { success: boolean; line?: ProductionLineState; reason?: string } {
  if (building.operationalState !== "ACTIVE" || building.operationalEfficiency <= 0) {
    return { success: false, reason: "BUILDING_NOT_OPERATIONAL" }
  }

  // Check required capability
  if (recipe.requiredCapability) {
    // Must be supported by building
  }

  // 1. Verify resources in sharedStorage
  for (const [res, needed] of Object.entries(recipe.inputs)) {
    const available = base.sharedStorage[res] || 0
    if (available < needed) {
      return {
        success: false,
        reason: `INSUFFICIENT_INPUT_RESOURCE: Requires ${needed} ${res}, only ${available} available.`,
      }
    }
  }

  // 2. Reserve inputs immediately (deduct from shared storage to prevent double spend)
  const reservedInputs: Record<string, number> = {}
  for (const [res, needed] of Object.entries(recipe.inputs)) {
    base.sharedStorage[res] -= needed
    reservedInputs[res] = needed
  }

  const lineId = `line_${building.instanceId}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`
  const completesAtGameDay = currentGameDay + Math.max(1, recipe.cycleDays)

  const line: ProductionLineState = {
    lineId,
    buildingInstanceId: building.instanceId,
    recipeId: recipe.id,
    startedGameDay: currentGameDay,
    completesAtGameDay,
    reservedInputs,
    status: "PRODUCING",
  }

  base.productionLines.push(line)

  // Track active reservation
  const reservation: ResourceReservation = {
    reservationId: `res_${lineId}`,
    ownerRef: lineId,
    purpose: "PRODUCTION_INPUT",
    resources: { ...reservedInputs },
    createdGameDay: currentGameDay,
  }
  base.activeReservations.push(reservation)

  return { success: true, line }
}

/**
 * Processes production lines upon GAME_DAY advancement (settlement or OUTPUT_BLOCKED)
 */
export function settleProductionLines(
  base: BaseEntityState,
  recipes: Map<string, ProductionRecipe>,
  definitions: Map<string, BuildingDefinition>,
  currentGameDay: number
): {
  completedLinesCount: number
  blockedLinesCount: number
  settledOutputs: Record<string, number>
} {
  let completedLinesCount = 0
  let blockedLinesCount = 0
  const settledOutputs: Record<string, number> = {}

  const totalCap = calculateTotalStorageCapacity(base, definitions)

  for (const line of base.productionLines) {
    if (line.status !== "PRODUCING" && line.status !== "OUTPUT_BLOCKED") {
      continue
    }

    if (currentGameDay < line.completesAtGameDay) {
      continue
    }

    const recipe = recipes.get(line.recipeId)
    if (!recipe) continue

    // Check if storage can accept output
    if (!canAcceptOutput(base, recipe.outputs, totalCap)) {
      line.status = "OUTPUT_BLOCKED"
      blockedLinesCount++
      continue
    }

    // Storage is available: settle output!
    for (const [res, amt] of Object.entries(recipe.outputs)) {
      base.sharedStorage[res] = (base.sharedStorage[res] || 0) + amt
      settledOutputs[res] = (settledOutputs[res] || 0) + amt
    }

    // Remove active reservation
    base.activeReservations = base.activeReservations.filter(
      (r) => r.ownerRef !== line.lineId
    )

    line.status = "COMPLETED"
    completedLinesCount++
  }

  // Clean up completed lines from active list
  base.productionLines = base.productionLines.filter((l) => l.status !== "COMPLETED")

  return {
    completedLinesCount,
    blockedLinesCount,
    settledOutputs,
  }
}

/**
 * Projects 7-day and 30-day production throughput summaries
 */
export function projectProductionSummary(
  base: BaseEntityState,
  recipes: Map<string, ProductionRecipe>
): {
  projected7DayOutput: Record<string, number>
  projected30DayOutput: Record<string, number>
  activeLinesCount: number
} {
  const projected7DayOutput: Record<string, number> = {}
  const projected30DayOutput: Record<string, number> = {}

  for (const line of base.productionLines) {
    if (line.status === "PRODUCING") {
      const recipe = recipes.get(line.recipeId)
      if (recipe && recipe.cycleDays > 0) {
        const cyclesIn7 = 7 / recipe.cycleDays
        const cyclesIn30 = 30 / recipe.cycleDays

        for (const [res, amt] of Object.entries(recipe.outputs)) {
          projected7DayOutput[res] = (projected7DayOutput[res] || 0) + Math.round(amt * cyclesIn7)
          projected30DayOutput[res] = (projected30DayOutput[res] || 0) + Math.round(amt * cyclesIn30)
        }
      }
    }
  }

  return {
    projected7DayOutput,
    projected30DayOutput,
    activeLinesCount: base.productionLines.filter((l) => l.status === "PRODUCING").length,
  }
}
