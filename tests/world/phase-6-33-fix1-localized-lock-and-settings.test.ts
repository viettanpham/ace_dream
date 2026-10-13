/**
 * STARFRONT WORLD — Phase 6.33_FIX1 Focused Tests
 * 
 * Verifies:
 * 1. P0 — Localized combat locking semantics (ensuring battle in one sector does not globally lock all sectors or bases)
 * 2. P1 — Global UI Settings & Audio volume/mute utilities
 */

import test from "node:test"
import assert from "node:assert/strict"
import { createInitialWorldState } from "@/lib/game/world/initial-state"
import {
  lockEncounterAndCreateSnapshot,
  abortSuspendedCombat,
  commitCombatResultReceipt,
  isEntityCombatLocked,
  getEntityCombatLockStatus,
} from "@/lib/game/world/combat-adapter"
import { isAudioMuted, setAudioMuted, getAudioVolume, setAudioVolume } from "@/lib/game/audio"
import type { WorldState } from "@/lib/game/world/types"

test("Phase 6.33_FIX1 — Localized Combat Lock & Global Settings", async (t) => {
  await t.test("P0: Localized Combat Lock Semantics", async (t2) => {
    await t2.test("locks only the specific target sector during encounter creation, leaving other sectors unlocked", () => {
      const state: WorldState = createInitialWorldState()
      const targetSectorId = "helios_perimeter"
      const snapshot = lockEncounterAndCreateSnapshot(state, {
        sectorId: targetSectorId,
      })

      // The target sector must be locked
      assert.strictEqual(state.sectors[targetSectorId].isLockedForCombat, true)
      assert.ok(state.sectors[targetSectorId].lockedGarrisonPower !== undefined)
      assert.strictEqual(state.isSuspendedCombat, true)
      assert.strictEqual(state.suspendedSnapshot?.sectorId, targetSectorId)

      // Other sectors MUST NOT be locked
      const otherSectorIds = Object.keys(state.sectors).filter((id) => id !== targetSectorId)
      for (const id of otherSectorIds) {
        assert.ok(!state.sectors[id].isLockedForCombat)
        assert.strictEqual(isEntityCombatLocked(state.sectors[id], state), false)
      }

      // Explicitly check enemy origin bases (e.g. tartarus_breach, abyssal_rift)
      assert.ok(!state.sectors["tartarus_breach"].isLockedForCombat)
      assert.strictEqual(isEntityCombatLocked(state.sectors["tartarus_breach"], state), false)
      assert.ok(!state.sectors["abyssal_rift"].isLockedForCombat)
      assert.strictEqual(isEntityCombatLocked(state.sectors["abyssal_rift"], state), false)

      // Target sector predicate check
      assert.strictEqual(isEntityCombatLocked(state.sectors[targetSectorId], state), true)
      const lockStatus = getEntityCombatLockStatus(state.sectors[targetSectorId], state)
      assert.strictEqual(lockStatus.isLocked, true)
      assert.strictEqual(lockStatus.canInspect, true) // Inspection always open
      assert.strictEqual(lockStatus.canDeployForces, false)
      assert.strictEqual(lockStatus.canUpgradeFortification, false)
    })

    await t2.test("restores sector lock cleanly when suspended combat is safely aborted", () => {
      const state: WorldState = createInitialWorldState()
      const targetSectorId = "mining_outpost_k7"
      const snapshot = lockEncounterAndCreateSnapshot(state, {
        sectorId: targetSectorId,
      })
      assert.strictEqual(state.sectors[targetSectorId].isLockedForCombat, true)

      const abortRes = abortSuspendedCombat(state, snapshot.transactionId)
      assert.strictEqual(abortRes.success, true)
      assert.strictEqual(state.sectors[targetSectorId].isLockedForCombat, false)
      assert.strictEqual(state.isSuspendedCombat, false)
      assert.strictEqual(state.suspendedSnapshot, undefined)
      assert.strictEqual(isEntityCombatLocked(state.sectors[targetSectorId], state), false)
    })

    await t2.test("unlocks sector when combat result receipt is committed", () => {
      const state: WorldState = createInitialWorldState()
      const targetSectorId = "asteroid_delta"
      const snapshot = lockEncounterAndCreateSnapshot(state, {
        sectorId: targetSectorId,
      })
      assert.strictEqual(state.sectors[targetSectorId].isLockedForCombat, true)

      const receipt = {
        transactionId: snapshot.transactionId,
        encounterId: snapshot.encounterId,
        combatVersion: "v2" as const,
        sectorId: targetSectorId,
        victory: true,
        rounds: 3,
        playerRemainingHpPercent: 80,
        enemyRemainingHpPercent: 0,
        tacticalRating: "S" as const,
        logSummary: "Test victory",
        completedAtTimestamp: Date.now(),
      }

      const commitRes = commitCombatResultReceipt(state, receipt)
      assert.strictEqual(commitRes.applied, true)
      assert.strictEqual(state.sectors[targetSectorId].isLockedForCombat, false)
      assert.strictEqual(state.isSuspendedCombat, false)
      assert.strictEqual(isEntityCombatLocked(state.sectors[targetSectorId], state), false)
    })
  })

  await t.test("P1: Audio & Settings Utilities", () => {
    setAudioMuted(false)
    assert.strictEqual(isAudioMuted(), false)

    setAudioMuted(true)
    assert.strictEqual(isAudioMuted(), true)

    setAudioVolume(0.5)
    assert.strictEqual(getAudioVolume(), 0.5)

    // Test clamping
    setAudioVolume(1.8)
    assert.strictEqual(getAudioVolume(), 1.0)

    setAudioVolume(-0.4)
    assert.strictEqual(getAudioVolume(), 0.0)
  })
})
