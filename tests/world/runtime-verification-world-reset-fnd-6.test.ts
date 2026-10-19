/**
 * STARFRONT WORLD — Phase 6.34A-FND-6 Runtime Verification & World Reset Verification
 * 
 * Verifies:
 * 1. createInitialWorldState defaults to 30 sectors and 54 interconnected routes conforming to FND-6.
 * 2. resetWorldState backs up existing state to STARFRONT_WORLD_BACKUP_PRE_RESET before clearing.
 * 3. resetWorldState generates a fresh 30-node galaxy respecting FND-6 balance invariants:
 *    - totalMainBaseNodes = 30
 *    - minimumFactionBaseSharePercent >= 20% (each faction >= 6 bases)
 *    - maximumFactionPowerDifferencePercentagePoints <= 10%
 *    - Backline capitals (Sol Command HQ for VSS, Tartarus Breach for Void)
 * 4. loadWorldState automatically migrates legacy 10-node saves to 30 sectors with bases and populations.
 * 5. Isolated Storage: Catalog, Auto-Save ring buffers, and RPG Save V4 are never wiped by World Reset.
 */

import { test, describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"
import {
  createInitialWorldState,
  createResetWorldState,
} from "../../lib/game/world/initial-state"
import {
  loadWorldState,
  saveWorldState,
  resetWorldState,
  createPreResetBackup,
  WORLD_STORAGE_KEY_V1,
  WORLD_BACKUP_PRE_RESET_KEY,
  WORLD_BACKUP_KEY_A,
  WORLD_BACKUP_KEY_B,
} from "../../lib/game/world/storage"
import {
  CANONICAL_30_WORLD_SECTORS,
  CANONICAL_30_WORLD_ROUTES,
  generate30NodeWorld,
  validateFactionBaseDistribution,
  validateNationalPowerBalance,
} from "../../lib/game/world/base"

// Mock localStorage in Node.js environment
const mockStorage: Record<string, string> = {}
;(global as any).window = {}
;(global as any).localStorage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = String(val)
  },
  removeItem: (key: string) => {
    delete mockStorage[key]
  },
  clear: () => {
    for (const k of Object.keys(mockStorage)) {
      delete mockStorage[k]
    }
  },
}

describe("STARFRONT WORLD — FND-6 Runtime Verification & 30-Node Reset", () => {
  beforeEach(() => {
    ;(global as any).localStorage.clear()
  })

  it("1. createInitialWorldState() defaults to 30 sectors, 30 base entities, and 54 routes", () => {
    const world = createInitialWorldState()

    const sectorCount = Object.keys(world.sectors).length
    assert.equal(sectorCount, 30, "WorldState must contain exactly 30 sectors by default")

    const baseCount = Object.keys(world.bases || {}).length
    assert.equal(baseCount, 30, "WorldState must contain exactly 30 base entities")

    const popCount = Object.keys(world.basePopulationStates || {}).length
    assert.equal(popCount, 30, "WorldState must contain exactly 30 population states")

    assert.equal(world.routes.length, 54, "WorldState must contain 54 interconnected hyperlane routes")
    assert.equal(world.worldGenerationConfig?.totalMainBaseNodes, 30, "totalMainBaseNodes config must be 30")
  })

  it("2. Faction allocation invariants: Both factions hold >= 20% base share and power gap <= 10%", () => {
    const seeds = [10001, 77722211, 44221188, 99112233]

    for (const seed of seeds) {
      const world = generate30NodeWorld(seed)
      const sectors = Object.values(world.sectors)

      const vssBases = sectors.filter((s) => s.sovereignty === "vss").length
      const voidBases = sectors.filter((s) => s.sovereignty === "void").length
      const otherBases = sectors.filter((s) => s.sovereignty !== "vss" && s.sovereignty !== "void").length

      assert.equal(vssBases + voidBases + otherBases, 30, "All 30 sectors must be accounted for")
      assert.ok(vssBases >= 6, `VSS must hold at least 20% (6 bases), actual: ${vssBases}`)
      assert.ok(voidBases >= 6, `Void must hold at least 20% (6 bases), actual: ${voidBases}`)

      const vssPower = Object.values(world.bases)
        .filter((b) => b.factionId === "vss")
        .reduce((sum, b) => sum + b.nationalPowerScore, 0)
      const voidPower = Object.values(world.bases)
        .filter((b) => b.factionId === "void")
        .reduce((sum, b) => sum + b.nationalPowerScore, 0)

      const powerCheck = validateNationalPowerBalance(vssPower, voidPower, 10)
      assert.ok(
        powerCheck.isValid,
        `Power difference must be <= 10 percentage points (difference: ${powerCheck.powerDifferencePercentagePoints}%)`
      )
    }
  })

  it("3. Pre-reset backup creation: Snapshot is saved to STARFRONT_WORLD_BACKUP_PRE_RESET", () => {
    // 1. Setup an existing world save
    const initialWorld = createInitialWorldState(12345)
    saveWorldState(initialWorld)

    assert.ok(localStorage.getItem(WORLD_STORAGE_KEY_V1), "Primary world save should exist")

    // 2. Perform reset
    const freshWorld = resetWorldState(initialWorld, {
      cc0Name: "VSS Liên Bang Mới",
      commanderName: "Alviss Prime",
      totalNodes: 30,
    })

    // 3. Verify backup snapshot exists
    const preResetBackup = localStorage.getItem(WORLD_BACKUP_PRE_RESET_KEY)
    assert.ok(preResetBackup, "STARFRONT_WORLD_BACKUP_PRE_RESET must be created upon reset")
    
    // 4. Verify fresh world properties
    assert.equal(Object.keys(freshWorld.sectors).length, 30)
    assert.equal(freshWorld.worldResetConfig.resetCount, 1)
    assert.equal(freshWorld.worldResetConfig.cc0Name, "VSS Liên Bang Mới")
    assert.equal(freshWorld.worldResetConfig.commanderName, "Alviss Prime")
  })

  it("4. Storage Isolation: RPG Save V4 and Slot A/B backups are preserved during reset", () => {
    // Set mock external RPG Save
    const RPG_SAVE_KEY = "STARFRONT_SAVE_DATA_V4"
    localStorage.setItem(RPG_SAVE_KEY, JSON.stringify({ pilots: ["Marcus", "Alviss"], level: 50 }))
    localStorage.setItem(WORLD_BACKUP_KEY_A, JSON.stringify({ backup: "slotA" }))

    // Execute Reset
    resetWorldState(undefined, { totalNodes: 30 })

    // Check preservation
    const rpgSave = localStorage.getItem(RPG_SAVE_KEY)
    assert.ok(rpgSave, "RPG Save V4 must remain completely untouched by World Reset")
    assert.equal(JSON.parse(rpgSave).level, 50)

    const slotA = localStorage.getItem(WORLD_BACKUP_KEY_A)
    assert.ok(slotA, "Backup Slot A must remain preserved")
  })

  it("5. Seamless migration: Legacy 10-node save automatically expands to 30 nodes and 54 routes on load", () => {
    // Create an explicit legacy 10-sector world
    const legacy10World = createInitialWorldState(9999, { totalMainBaseNodes: 10 })
    assert.equal(Object.keys(legacy10World.sectors).length, 10, "Legacy world has 10 sectors")

    saveWorldState(legacy10World)

    // Load world -> should trigger migrateWorldStateTo30Sectors
    const loadResult = loadWorldState()
    assert.equal(loadResult.status, "loaded_primary")
    assert.equal(Object.keys(loadResult.state.sectors).length, 30, "Migrated world must have 30 sectors")
    assert.equal(loadResult.state.routes.length, 54, "Migrated world must have 54 routes")
    assert.equal(Object.keys(loadResult.state.bases).length, 30, "Migrated world must have 30 base entities")
    assert.equal(
      Object.keys(loadResult.state.basePopulationStates).length,
      30,
      "Migrated world must have 30 base population states"
    )
  })

  it("6. Backline Capital placement and core infrastructure integrity", () => {
    const world = createInitialWorldState()

    const solHQ = world.sectors["sol_command_hq"]
    assert.ok(solHQ, "Sol Command HQ must exist")
    assert.equal(solHQ.classification, "headquarters")
    assert.equal(solHQ.sovereignty, "vss")

    const tartarus = world.sectors["tartarus_breach"]
    assert.ok(tartarus, "Tartarus Breach must exist")
    assert.equal(tartarus.classification, "headquarters")
    assert.equal(tartarus.sovereignty, "void")

    // Check base entity and docking port separation
    const solBase = world.bases["sol_command_hq"]
    assert.ok(solBase, "Sol Command HQ base entity must exist")
    assert.equal(solBase.isCapital, true)
    assert.ok(solBase.fleetCapacities.baseDockingPorts >= 2, "Base must have default docking ports")
  })
})
