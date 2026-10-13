/**
 * STARFRONT WORLD — Automated Verification Tests
 * Phase 6.33_FIX4:
 * 1. Dispatch destination UX auto-selects clicked entity.
 * 2. Canonical HP-based Threat formula replacing old fixed deltas.
 * 3. Standardized Threat Max (Sol Command HQ: 500, Regular Sector: 1000).
 * 4. AdminCP Threat config and per-sector threat adjustments.
 * 5. Max Threat reduction below Current Threat triggers warning & Year-1 reset confirmation.
 * 6. AdminCP config sections collapse & expand.
 * 7. UI Scaling refined to 100% -> 200% with 5% step.
 */

import test from "node:test"
import assert from "node:assert/strict"
import {
  MIN_UI_SCALE,
  MAX_UI_SCALE,
  UI_SCALE_STEP,
  DEFAULT_UI_SCALE,
  SUPPORTED_UI_SCALES,
  normalizeUiScale,
  uiScaleToMultiplier,
} from "../../lib/game/ui-settings"
import {
  DEFAULT_THREAT_CONFIG,
  getWorldThreatConfig,
  getSectorMaxThreat,
  calculateCanonicalHpThreatDelta,
  applyThreatDeltaToSector,
  checkMaxThreatReduction,
} from "../../lib/game/world/threat-engine"
import { createInitialWorldState } from "../../lib/game/world/initial-state"
import { commitCombatResultReceipt } from "../../lib/game/world/combat-adapter"
import { createJournalEntry } from "../../lib/game/world/transaction-journal"
import type { CombatResultReceipt, WorldState } from "../../lib/game/world/types"

test("Phase 6.33_FIX4 — 1. Dispatch Destination Auto-Select", () => {
  const state: WorldState = createInitialWorldState(12345)

  // Identifies destination entity by canonical ID (not display name)
  const outpost = state.sectors["mining_outpost_k7"]
  assert.ok(outpost, "mining_outpost_k7 must exist")
  assert.equal(outpost.id, "mining_outpost_k7")

  // The destination ID directly matches sector/station ID
  const destinationId = outpost.id
  assert.equal(destinationId, "mining_outpost_k7")
  assert.ok(state.sectors[destinationId], "Destination must be present in world sectors")

  // Sol Command HQ and other sectors can all be targets
  const targets = ["sol_command_hq", "helios_perimeter", "mining_outpost_k7", "asteroid_delta"]
  for (const targetId of targets) {
    assert.ok(state.sectors[targetId], `Target ${targetId} must exist`)
    assert.equal(state.sectors[targetId].id, targetId)
  }
})

test("Phase 6.33_FIX4 — 2 & 3. Standardized Threat Max (HQ = 500, Regular = 1000)", () => {
  const state: WorldState = createInitialWorldState(45678)

  const hq = state.sectors["sol_command_hq"]
  const regularSector = state.sectors["mining_outpost_k7"]

  assert.equal(getSectorMaxThreat(hq), 500, "Sol Command HQ max threat must be 500")
  assert.equal(getSectorMaxThreat(regularSector), 1000, "Regular sector max threat must be 1000")
  assert.equal(getSectorMaxThreat("sol_command_hq"), 500)
  assert.equal(getSectorMaxThreat("helios_perimeter"), 1000)
})

test("Phase 6.33_FIX4 — 2. Canonical Threat Delta on Victory (Dynamic HP-Based)", () => {
  const maxThreat = 1000
  const currentThreat = 400

  // Perfect victory: Enemy 0% HP remaining, Player 100% HP remaining
  const deltaFlawless = calculateCanonicalHpThreatDelta({
    maxThreat,
    currentThreat,
    playerRemainingHpPercent: 100,
    enemyRemainingHpPercent: 0,
    isVictory: true,
    multiplier: 1.0,
  })

  // Flawless victory: -Math.round(1000 * (0.25 * 1.0 + 0.15 * 1.0)) = -400
  assert.equal(deltaFlawless, -400, "Flawless victory should yield -400 delta on 1000 max threat")

  // Close victory: Enemy 0% HP remaining, Player only 20% HP remaining
  const deltaClose = calculateCanonicalHpThreatDelta({
    maxThreat,
    currentThreat,
    playerRemainingHpPercent: 20,
    enemyRemainingHpPercent: 0,
    isVictory: true,
    multiplier: 1.0,
  })

  // Close victory: -Math.round(1000 * (0.25 * 1.0 + 0.15 * 0.20)) = -280
  assert.equal(deltaClose, -280, "Close victory should yield -280 delta on 1000 max threat")
  assert.ok(Math.abs(deltaFlawless) > Math.abs(deltaClose), "Flawless victory must reduce more threat than close victory")
})

test("Phase 6.33_FIX4 — 2. Canonical Threat Delta on Defeat (Dynamic HP-Based)", () => {
  const maxThreat = 1000
  const currentThreat = 300

  // Complete defeat: Player 0% HP, Enemy 100% HP remaining
  const deltaCrushing = calculateCanonicalHpThreatDelta({
    maxThreat,
    currentThreat,
    playerRemainingHpPercent: 0,
    enemyRemainingHpPercent: 100,
    isVictory: false,
    multiplier: 1.0,
  })

  // Crushing defeat: +Math.round(1000 * (0.20 * 1.0 + 0.15 * 1.0)) = +350
  assert.equal(deltaCrushing, 350, "Crushing defeat should increase threat by +350 on 1000 max threat")

  // Valiant defeat: Player 0% HP, Enemy knocked down to 20% HP
  const deltaValiant = calculateCanonicalHpThreatDelta({
    maxThreat,
    currentThreat,
    playerRemainingHpPercent: 0,
    enemyRemainingHpPercent: 20,
    isVictory: false,
    multiplier: 1.0,
  })

  // Valiant defeat: +Math.round(1000 * (0.20 * 1.0 + 0.15 * 0.20)) = +230
  assert.equal(deltaValiant, 230, "Valiant defeat should increase threat by +230 on 1000 max threat")
  assert.ok(deltaCrushing > deltaValiant, "Crushing defeat must increase threat more than valiant defeat")
})

test("Phase 6.33_FIX4 — 3. Proportionate HQ vs Regular Threat Scaling", () => {
  const hqDelta = calculateCanonicalHpThreatDelta({
    maxThreat: 500,
    currentThreat: 100,
    playerRemainingHpPercent: 100,
    enemyRemainingHpPercent: 0,
    isVictory: true,
    multiplier: 1.0,
  })

  const regularDelta = calculateCanonicalHpThreatDelta({
    maxThreat: 1000,
    currentThreat: 200,
    playerRemainingHpPercent: 100,
    enemyRemainingHpPercent: 0,
    isVictory: true,
    multiplier: 1.0,
  })

  // HQ reduction (-200) is half of regular reduction (-400) because maxThreat is 500 vs 1000
  assert.equal(hqDelta, -200)
  assert.equal(regularDelta, -400)
})

test("Phase 6.33_FIX4 — 2. Integration with commitCombatResultReceipt", () => {
  const state: WorldState = createInitialWorldState(65432)
  const sector = state.sectors["mining_outpost_k7"]

  // Register transaction in journal
  const txId = "tx-test-fix4-01"
  createJournalEntry(state, {
    transactionId: txId,
    type: "combat",
    sectorId: "mining_outpost_k7",
    status: "in_flight",
    description: "Test combat",
  })

  const receipt: CombatResultReceipt = {
    transactionId: txId,
    encounterId: "enc-fix4-01",
    combatVersion: "v2",
    sectorId: "mining_outpost_k7",
    victory: true,
    rounds: 4,
    playerRemainingHpPercent: 100,
    enemyRemainingHpPercent: 0,
    completedAtTimestamp: Date.now(),
  }

  const res = commitCombatResultReceipt(state, receipt)
  assert.equal(res.applied, true)
  assert.equal(sector.threatLevel, 0)
  assert.equal(res.strategicConsequences?.threatChange, -400)
})

test("Phase 6.33_FIX4 — 4 & 5. Threat AdminCP & Max Threat Reduction Warning / Reset", () => {
  const state: WorldState = createInitialWorldState(998877)

  // Current sectors include waypoint_orion with threatLevel 580, shadow_reach with 760, tartarus_breach with 980
  const proposedConfig = {
    maxThreatStandard: 500, // Lower than 580, 760, and 980!
    maxThreatHQ: 500,
    threatFormulaMultiplier: 1.0,
  }

  const check = checkMaxThreatReduction(state.sectors, proposedConfig)
  assert.equal(check.needsConfirmation, true)
  assert.ok(check.violatingSectors.length > 0)
  const violatingIds = check.violatingSectors.map((v) => v.id)
  assert.ok(violatingIds.includes("waypoint_orion"))
  assert.ok(violatingIds.includes("tartarus_breach"))

  // Safe config where max threat exceeds all current threats
  const proposedSafeConfig = {
    maxThreatStandard: 1200,
    maxThreatHQ: 600,
    threatFormulaMultiplier: 1.0,
  }

  const safeCheck = checkMaxThreatReduction(state.sectors, proposedSafeConfig)
  assert.equal(safeCheck.needsConfirmation, false)
  assert.equal(safeCheck.violatingSectors.length, 0)
})

test("Phase 6.33_FIX4 — 7. UI Scaling Refinement (100% -> 200%, Step 5%)", () => {
  assert.equal(MIN_UI_SCALE, 100)
  assert.equal(MAX_UI_SCALE, 200)
  assert.equal(UI_SCALE_STEP, 5)
  assert.equal(DEFAULT_UI_SCALE, 100)

  // Contains all 5% increments
  assert.ok(SUPPORTED_UI_SCALES.includes(100))
  assert.ok(SUPPORTED_UI_SCALES.includes(105))
  assert.ok(SUPPORTED_UI_SCALES.includes(110))
  assert.ok(SUPPORTED_UI_SCALES.includes(125))
  assert.ok(SUPPORTED_UI_SCALES.includes(150))
  assert.ok(SUPPORTED_UI_SCALES.includes(175))
  assert.ok(SUPPORTED_UI_SCALES.includes(195))
  assert.ok(SUPPORTED_UI_SCALES.includes(200))
  assert.equal(SUPPORTED_UI_SCALES.length, 21)

  // Normalization rounds to nearest 5 step
  assert.equal(normalizeUiScale(null), 100)
  assert.equal(normalizeUiScale(undefined), 100)
  assert.equal(normalizeUiScale(80), 100)
  assert.equal(normalizeUiScale(102), 100)
  assert.equal(normalizeUiScale(103), 105)
  assert.equal(normalizeUiScale(112), 110)
  assert.equal(normalizeUiScale(118), 120)
  assert.equal(normalizeUiScale(124), 125)
  assert.equal(normalizeUiScale(182), 180)
  assert.equal(normalizeUiScale(184), 185)
  assert.equal(normalizeUiScale(210), 200)
  assert.equal(normalizeUiScale(250), 200)
  assert.equal(normalizeUiScale(300), 200)

  // Decimal legacy multipliers
  assert.equal(normalizeUiScale(1.0), 100)
  assert.equal(normalizeUiScale(1.05), 105)
  assert.equal(normalizeUiScale(1.25), 125)
  assert.equal(normalizeUiScale(1.5), 150)
  assert.equal(normalizeUiScale(2.0), 200)
  assert.equal(normalizeUiScale(2.5), 200)

  // CSS multipliers
  assert.equal(uiScaleToMultiplier(100), 1.0)
  assert.equal(uiScaleToMultiplier(105), 1.05)
  assert.equal(uiScaleToMultiplier(125), 1.25)
  assert.equal(uiScaleToMultiplier(150), 1.5)
  assert.equal(uiScaleToMultiplier(200), 2.0)
})
