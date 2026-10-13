/**
 * STARFRONT WORLD — Phase 6.33_FIX1 Focused Tests
 * 
 * Verifies:
 * 1. P0 — Localized combat locking semantics (ensuring battle in one sector does not globally lock all sectors or bases)
 * 2. P1 — Global UI Settings & Audio volume/mute utilities
 */

import { describe, it, expect, beforeEach } from "vitest"
import { createDefaultWorldState } from "@/lib/game/world/initial-state"
import { lockEncounterAndCreateSnapshot, abortSuspendedCombat, commitCombatResultReceipt } from "@/lib/game/world/combat-adapter"
import { isAudioMuted, setAudioMuted, getAudioVolume, setAudioVolume } from "@/lib/game/audio"
import type { WorldState } from "@/lib/game/world/types"

describe("Phase 6.33_FIX1 — Localized Combat Lock & Global Settings", () => {
  let state: WorldState

  beforeEach(() => {
    state = createDefaultWorldState()
  })

  describe("P0: Localized Combat Lock Semantics", () => {
    it("locks only the specific target sector during encounter creation, leaving other sectors unlocked", () => {
      const targetSectorId = "helios_perimeter"
      const snapshot = lockEncounterAndCreateSnapshot(state, {
        sectorId: targetSectorId,
      })

      // The target sector must be locked
      expect(state.sectors[targetSectorId].isLockedForCombat).toBe(true)
      expect(state.sectors[targetSectorId].lockedGarrisonPower).toBeDefined()
      expect(state.isSuspendedCombat).toBe(true)
      expect(state.suspendedSnapshot?.sectorId).toBe(targetSectorId)

      // Other sectors MUST NOT be locked
      const otherSectorIds = Object.keys(state.sectors).filter((id) => id !== targetSectorId)
      for (const id of otherSectorIds) {
        expect(state.sectors[id].isLockedForCombat).toBeFalsy()
      }

      // Explicitly check enemy origin bases (e.g. tartarus_breach, abyssal_rift)
      expect(state.sectors["tartarus_breach"].isLockedForCombat).toBeFalsy()
      expect(state.sectors["abyssal_rift"].isLockedForCombat).toBeFalsy()
    })

    it("restores sector lock cleanly when suspended combat is safely aborted", () => {
      const targetSectorId = "mining_outpost_k7"
      const snapshot = lockEncounterAndCreateSnapshot(state, {
        sectorId: targetSectorId,
      })
      expect(state.sectors[targetSectorId].isLockedForCombat).toBe(true)

      const abortRes = abortSuspendedCombat(state, snapshot.transactionId)
      expect(abortRes.success).toBe(true)
      expect(state.sectors[targetSectorId].isLockedForCombat).toBe(false)
      expect(state.isSuspendedCombat).toBe(false)
      expect(state.suspendedSnapshot).toBeUndefined()
    })

    it("unlocks sector when combat result receipt is committed", () => {
      const targetSectorId = "asteroid_delta"
      const snapshot = lockEncounterAndCreateSnapshot(state, {
        sectorId: targetSectorId,
      })
      expect(state.sectors[targetSectorId].isLockedForCombat).toBe(true)

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
      expect(commitRes.applied).toBe(true)
      expect(state.sectors[targetSectorId].isLockedForCombat).toBe(false)
      expect(state.isSuspendedCombat).toBe(false)
    })
  })

  describe("P1: Audio & Settings Utilities", () => {
    it("manages audio mute and volume accurately with boundary clamping", () => {
      setAudioMuted(false)
      expect(isAudioMuted()).toBe(false)

      setAudioMuted(true)
      expect(isAudioMuted()).toBe(true)

      setAudioVolume(0.5)
      expect(getAudioVolume()).toBe(0.5)

      // Test clamping
      setAudioVolume(1.8)
      expect(getAudioVolume()).toBe(1.0)

      setAudioVolume(-0.4)
      expect(getAudioVolume()).toBe(0.0)
    })
  })
})
