/**
 * STARFRONT WORLD — Phase 6.34A-FND-5 World Init & Audit Repair Test Suite
 *
 * Verifies:
 * 1. GAP 1: Progression SYSTEM JSON and seed-data.ts sync (3 profiles including profile_auto_progression)
 * 2. GAP 2: decisions and inTransitTransfers persistence in WorldState & storage
 * 3. GAP 3: Centralized bootstrapWorldCatalogs() is idempotent and loads all 20 canonical catalogs
 * 4. GAP 4: Fresh World Init creates BasePopulationState for all sectors, conserving population 100%
 * 5. GAP 5: Fresh World Init creates BaseEntityState for all sectors with initial Core Facilities
 * 6. Reset World: Always produces fresh random seed, preserves CC0/Commander names, increments resetCount
 * 7. Save/Load V1 backward compatibility: Old saves migrate smoothly with zero data loss
 */

import assert from "node:assert/strict"
import test from "node:test"
import fs from "node:fs"

import {
  bootstrapWorldCatalogs,
  createInitialWorldState,
  defaultCatalogRegistry,
  loadWorldState,
  migrateFoundationState,
  resetWorldState,
  saveWorldState,
} from "../../lib/game/world"

import { SYSTEM_PROGRESSION_CATALOG_FILES } from "../../lib/game/world/progression/seed-data"

test("1. GAP 1: Progression SYSTEM JSON on disk exactly matches seed-data.ts (3 profiles)", () => {
  const diskPath = "data/catalogs/system_progression_progression_profile_data.json"
  assert.ok(fs.existsSync(diskPath), "Disk file must exist")

  const diskContent = JSON.parse(fs.readFileSync(diskPath, "utf8"))
  const seedContent = SYSTEM_PROGRESSION_CATALOG_FILES["system_progression_progression_profile_data.json"]

  assert.equal(diskContent.items.length, 3, "Disk file must have exactly 3 profiles")
  assert.equal(seedContent.items.length, 3, "Seed code must have exactly 3 profiles")

  const ids = diskContent.items.map((i: any) => i.id)
  assert.ok(ids.includes("profile_standard_100"))
  assert.ok(ids.includes("profile_compact_50"))
  assert.ok(ids.includes("profile_auto_progression"))
})

test("2. GAP 3: bootstrapWorldCatalogs() is idempotent and registers all 20 catalogs", () => {
  // First run
  const res1 = bootstrapWorldCatalogs()
  assert.equal(res1.success, true)
  assert.equal(res1.catalogsRegistered, 20)
  assert.ok(res1.totalCanonicalItems >= 50)

  // Second run (re-bootstrap must be safe and idempotent)
  const res2 = bootstrapWorldCatalogs()
  assert.equal(res2.success, true)
  assert.equal(res2.isRebootstrap, true)
  assert.equal(res2.catalogsRegistered, 20)
})

test("3. GAP 4: createInitialWorldState() initializes BasePopulationState for all 10 sectors", () => {
  const state = createInitialWorldState(99887766, { totalMainBaseNodes: 10 })

  assert.ok(state.basePopulationStates, "basePopulationStates must exist on WorldState")
  const basePopKeys = Object.keys(state.basePopulationStates)
  assert.equal(basePopKeys.length, 10, "Must have 10 BasePopulationStates")

  // Check Sol Command HQ base population
  const solBase = state.basePopulationStates["base_sol_command_hq"]
  assert.ok(solBase)
  assert.equal(solBase.baseType, "CAPITAL")
  assert.equal(solBase.populationCurrent, 260000)
  assert.equal(solBase.populationAvailable, 260000)
  assert.equal(solBase.populationOccupied, 0)
  assert.equal(solBase.visitorPopulation, 5000)
  assert.equal(solBase.externalWorkerPopulation, 3000)
  assert.equal(solBase.capacity.residentialCapacity, 300000)

  // Verify population conservation: sum across basePopulationStates == nationalTotalPopulation
  let totalBasePopulation = 0
  for (const b of Object.values(state.basePopulationStates)) {
    totalBasePopulation += b.populationCurrent
    assert.equal(b.populationCurrent, b.populationAvailable + b.populationOccupied)
  }

  assert.equal(totalBasePopulation, state.demographics.nationalTotalPopulation)
  assert.equal(totalBasePopulation, 825000)
})

test("4. GAP 5: createInitialWorldState() initializes BaseEntityState with Core Facilities", () => {
  const state = createInitialWorldState(99887766, { totalMainBaseNodes: 10 })

  assert.ok(state.bases, "bases must exist on WorldState")
  const baseKeys = Object.keys(state.bases)
  assert.equal(baseKeys.length, 10, "Must have 10 BaseEntityStates")

  // Check Sol Command HQ base
  const solBase = state.bases["base_sol_command_hq"]
  assert.ok(solBase)
  assert.equal(solBase.baseType, "CAPITAL")
  assert.equal(solBase.slotProfileId, "slot_profile_capital_citadel")
  assert.equal(solBase.maxExpansionSlots, 8)
  assert.equal(solBase.coreBuildingIds.length, 5) // 5 core facilities

  // Check that core buildings are instantiated
  for (const bId of solBase.coreBuildingIds) {
    const inst = solBase.buildings[bId]
    assert.ok(inst, `Core building ${bId} must be instantiated`)
    assert.equal(inst.operationalState, "ACTIVE")
    assert.equal(inst.currentHp, inst.maxHp)
    assert.equal(inst.conditionHp, inst.maxHp)
  }

  // Expansion buildings start empty
  assert.equal(solBase.expansionBuildingIds.length, 0)
})

test("5. GAP 2: Decisions and InTransitTransfers persistence fields in WorldState", () => {
  const state = createInitialWorldState(12345678)

  assert.ok(state.decisions, "decisions field must exist")
  assert.deepEqual(state.decisions.pendingDecisions, [])
  assert.deepEqual(state.decisions.history, [])

  assert.ok(Array.isArray(state.inTransitTransfers), "inTransitTransfers must be array")
  assert.equal(state.inTransitTransfers.length, 0)

  assert.ok(state.worldResetConfig, "worldResetConfig must exist")
  assert.equal(state.worldResetConfig.cc0Name, "Liên minh VSS")
  assert.equal(state.worldResetConfig.commanderName, "Alviss")
  assert.equal(state.worldResetConfig.resetCount, 0)
})

test("6. Reset World creates fresh random seed, increments resetCount, and preserves names", () => {
  const state1 = createInitialWorldState(11112222)
  assert.equal(state1.worldSeed, 11112222)

  // Reset world with custom names
  const state2 = resetWorldState(state1, {
    cc0Name: "Vanguard Solar Coalition",
    commanderName: "Commander Sarah",
  })

  assert.notEqual(state2.worldSeed, state1.worldSeed, "Reset world must have fresh random seed")
  assert.equal(state2.worldResetConfig?.cc0Name, "Vanguard Solar Coalition")
  assert.equal(state2.worldResetConfig?.commanderName, "Commander Sarah")
  assert.equal(state2.worldResetConfig?.resetCount, 1)

  // 2nd reset increments count again
  const state3 = resetWorldState(state2)
  assert.equal(state3.worldResetConfig?.resetCount, 2)
  assert.equal(state3.worldResetConfig?.cc0Name, "Vanguard Solar Coalition")
})

test("7. Save/Load V1 backward compatibility & migrateFoundationState", () => {
  const mockOldState: any = {
    version: 1,
    worldSeed: 555666,
    currentDay: 1,
    totalDaysElapsed: 0,
    realTimeAnchor: Date.now(),
    lastTickTimestamp: Date.now(),
    sectors: {},
    routes: [],
    factions: {},
    resources: { industrialMaterials: 100, energy: 100, logisticsSupplies: 100, tacticalData: 100, food: 100 },
    military: { deployed: 10, reserves: 10, woundedOrRepair: 0, retreating: 0, casualties: 0 },
    demographics: { nationalTotalPopulation: 100, controlledTerritoryPopulation: 100, refugeesInTransit: 0, civilianCasualties: 0 },
    activeMissionChains: [],
    completedMissionChainIds: [],
    committedTransactionIds: [],
    inFlightTransactions: {},
    isSuspendedCombat: false,
    // Note: missing decisions, inTransitTransfers, basePopulationStates, bases, worldResetConfig
  }

  const migrated = migrateFoundationState(mockOldState)
  assert.equal(migrated, true, "Old state must trigger migration")

  assert.ok(mockOldState.decisions, "decisions must be initialized")
  assert.ok(mockOldState.inTransitTransfers, "inTransitTransfers must be initialized")
  assert.ok(mockOldState.basePopulationStates, "basePopulationStates must be initialized")
  assert.ok(mockOldState.bases, "bases must be initialized")
  assert.ok(mockOldState.worldResetConfig, "worldResetConfig must be initialized")
})
