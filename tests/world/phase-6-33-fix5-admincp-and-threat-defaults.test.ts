import test from "node:test"
import assert from "node:assert/strict"
import { createInitialWorldState } from "../../lib/game/world/initial-state"
import { migrateWorldThreatState } from "../../lib/game/world/storage"
import { getSectorMaxThreat, isHeadquartersSector, DEFAULT_THREAT_CONFIG } from "../../lib/game/world/threat-engine"
import type { WorldState } from "../../lib/game/world/types"

test("Phase 6.33_FIX5 — 1. Threat Default Max for Both Faction HQs (100,000,000)", () => {
  const state: WorldState = createInitialWorldState(12345)

  // Phe VSS: Sol Command HQ
  const solHq = state.sectors["sol_command_hq"]
  assert.ok(solHq, "sol_command_hq must exist")
  assert.equal(solHq.classification, "headquarters")
  assert.equal(isHeadquartersSector(solHq), true)
  assert.equal(solHq.maxThreat, 100_000_000, "VSS HQ maxThreat must be 100,000,000")
  assert.equal(getSectorMaxThreat(solHq, state.threatConfig), 100_000_000)

  // Phe The Void: Tartarus Breach
  const tartarus = state.sectors["tartarus_breach"]
  assert.ok(tartarus, "tartarus_breach must exist")
  assert.equal(tartarus.classification, "headquarters")
  assert.equal(isHeadquartersSector(tartarus), true)
  assert.equal(tartarus.maxThreat, 100_000_000, "The Void HQ maxThreat must be 100,000,000")
  assert.equal(getSectorMaxThreat(tartarus, state.threatConfig), 100_000_000)
})

test("Phase 6.33_FIX5 — 2. Threat Default Max for Standard Sectors (1,000,000)", () => {
  const state: WorldState = createInitialWorldState(12345)

  const standardIds = [
    "helios_perimeter",
    "station_alpha",
    "mining_outpost_k7",
    "orion_corridor",
    "nebula_front",
    "black_ridge",
    "outpost_sigma_9",
    "void_relay_station",
  ]

  for (const id of standardIds) {
    const sec = state.sectors[id]
    if (sec) {
      assert.notEqual(sec.classification, "headquarters", `${id} must not be HQ`)
      assert.equal(isHeadquartersSector(sec), false)
      assert.equal(sec.maxThreat, 1_000_000, `${id} maxThreat must be 1,000,000`)
      assert.equal(getSectorMaxThreat(sec, state.threatConfig), 1_000_000)
    }
  }
})

test("Phase 6.33_FIX5 — 3. Current Threat is Preserved When Max Threat is 1,000,000 / 100,000,000", () => {
  const state: WorldState = createInitialWorldState(12345)

  // Verify initial threat is NOT changed to 1,000,000
  const solHq = state.sectors["sol_command_hq"]
  assert.equal(solHq.threatLevel, 40, "Initial Sol HQ threat should remain 40, not jump to 100M")

  const mining = state.sectors["mining_outpost_k7"]
  assert.equal(mining.threatLevel, 360, "Initial mining outpost threat should remain 360, not jump to 1M")
})

test("Phase 6.33_FIX5 — 4. Safe Migration from Legacy Save (maxThreat = 1000 or missing)", () => {
  const legacyState = {
    version: 1,
    worldSeed: 1234,
    currentDay: 5,
    sectors: {
      sol_command_hq: {
        id: "sol_command_hq",
        name: "Sol Command",
        sovereignty: "vss",
        threatLevel: 250,
        maxThreat: 1000, // Legacy 1000
        classification: "headquarters",
      },
      mining_outpost_k7: {
        id: "mining_outpost_k7",
        name: "Mining K7",
        sovereignty: "vss",
        threatLevel: 750,
        maxThreat: 1000, // Legacy 1000
        classification: "standard",
      },
      tartarus_breach: {
        id: "tartarus_breach",
        name: "Tartarus Breach",
        sovereignty: "void",
        threatLevel: 980,
        // missing maxThreat and classification
      },
    },
    threatConfig: {
      maxThreatStandard: 1000, // Legacy config
      maxThreatHQ: 1000,       // Legacy config
      hpPerThreatPoint: 100,
      winnerRatio: 2,
    },
  } as unknown as WorldState

  const wasMigrated = migrateWorldThreatState(legacyState)
  assert.equal(wasMigrated, true, "Should migrate legacy state")

  // Verify threatConfig upgraded
  assert.equal(legacyState.threatConfig?.maxThreatStandard, 1_000_000)
  assert.equal(legacyState.threatConfig?.maxThreatHQ, 100_000_000)

  // Verify Sol HQ
  assert.equal(legacyState.sectors["sol_command_hq"].maxThreat, 100_000_000)
  assert.equal(legacyState.sectors["sol_command_hq"].threatLevel, 250, "Current threat preserved")

  // Verify Tartarus Breach
  assert.equal(legacyState.sectors["tartarus_breach"].classification, "headquarters")
  assert.equal(legacyState.sectors["tartarus_breach"].maxThreat, 100_000_000)
  assert.equal(legacyState.sectors["tartarus_breach"].threatLevel, 980, "Current threat preserved")

  // Verify Standard Sector
  assert.equal(legacyState.sectors["mining_outpost_k7"].maxThreat, 1_000_000)
  assert.equal(legacyState.sectors["mining_outpost_k7"].threatLevel, 750, "Current threat preserved")
})

test("Phase 6.33_FIX5 — 5. Migration Does NOT Overwrite Custom Admin Config (> 1000)", () => {
  const customState = {
    version: 1,
    worldSeed: 1234,
    currentDay: 10,
    sectors: {
      mining_outpost_k7: {
        id: "mining_outpost_k7",
        name: "Mining K7",
        sovereignty: "vss",
        threatLevel: 5000,
        maxThreat: 50_000, // Custom admin value
        classification: "standard",
      },
    },
    threatConfig: {
      maxThreatStandard: 50_000,   // Custom admin config
      maxThreatHQ: 200_000_000,    // Custom admin config
      hpPerThreatPoint: 120,
      winnerRatio: 3,
    },
  } as unknown as WorldState

  migrateWorldThreatState(customState)

  // Custom values must be preserved
  assert.equal(customState.threatConfig?.maxThreatStandard, 50_000)
  assert.equal(customState.threatConfig?.maxThreatHQ, 200_000_000)
  assert.equal(customState.sectors["mining_outpost_k7"].maxThreat, 50_000)
  assert.equal(customState.sectors["mining_outpost_k7"].threatLevel, 5000)
})
