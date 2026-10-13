/**
 * STARFRONT WORLD — PHASE 6.33_FIX2 FOCUSED TESTS
 *
 * Verifies:
 * Test 1 — Fresh Defaults: Sound = OFF, CRT = OFF, UI Scale = 100%
 * Test 2 — Saved Preference: Sound = ON, CRT = ON, UI Scale = 200% preserved
 * Test 3 — Scale Values: Exact list [100, 125, 150, 175, 200, 225, 250, 275, 300]
 * Test 4 — Maximum: 300 accepted, >300 normalized to 300
 * Test 5 — Minimum: <100 normalized to 100
 * Test 6 — Legacy Values: 80, 90, 110, 120 and decimals 0.8, 1.2 safely normalized
 * Test 7 — Reset: Reset Settings returns Sound OFF, CRT OFF, UI 100%
 * Test 8 — Gameplay Isolation: Changing Settings does not mutate Combat/WORLD state
 */

import test from "node:test"
import assert from "node:assert/strict"
import {
  isAudioMuted,
  setAudioMuted,
  isAudioEnabled,
  getAudioVolume,
  setAudioVolume,
} from "../../lib/game/audio"
import {
  SUPPORTED_UI_SCALES,
  DEFAULT_UI_SCALE,
  MIN_UI_SCALE,
  MAX_UI_SCALE,
  UI_SCALE_STEP,
  normalizeUiScale,
  uiScaleToMultiplier,
  getSavedUiScale,
  saveUiScale,
  getSavedScanlineOverlay,
  getSavedScanlineBeam,
  getSavedVignette,
  getSavedCornerBrackets,
  saveCrtSettings,
  resetGlobalSettingsToDefault,
  STORAGE_UI_SCALE_KEY,
  STORAGE_SCANLINE_OVERLAY_KEY,
  STORAGE_SCANLINE_BEAM_KEY,
  STORAGE_VIGNETTE_KEY,
  STORAGE_CORNER_BRACKETS_KEY,
} from "../../lib/game/ui-settings"
import { createInitialWorldState } from "../../lib/game/world/initial-state"
import { lockEncounterAndCreateSnapshot } from "../../lib/game/world/combat-adapter"
import type { WorldState } from "../../lib/game/world/world-state"

// Mock in-memory localStorage for isolated testing
class MockLocalStorage {
  private store: Map<string, string> = new Map()

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

test("PHASE 6.33_FIX2: UI Settings & Scaling Test Suite", async (t) => {
  const originalLocalStorage = globalThis.localStorage

  t.beforeEach(() => {
    // Fresh in-memory localStorage for each test
    const mockStorage = new MockLocalStorage()
    Object.defineProperty(globalThis, "localStorage", {
      value: mockStorage,
      writable: true,
      configurable: true,
    })
    // Reset memory fallback in audio
    setAudioMuted(true)
  })

  t.after(() => {
    if (originalLocalStorage !== undefined) {
      Object.defineProperty(globalThis, "localStorage", {
        value: originalLocalStorage,
        writable: true,
        configurable: true,
      })
    }
  })

  // --------------------------------------------------------------------------
  // TEST 1 — Fresh Defaults
  // --------------------------------------------------------------------------
  await t.test("Test 1 — Fresh Defaults: Sound = OFF, CRT = OFF, UI Scale = 100%", () => {
    // When no preferences exist in storage
    assert.strictEqual(globalThis.localStorage.getItem("STARFRONT_AUDIO_MUTED"), null)
    assert.strictEqual(globalThis.localStorage.getItem(STORAGE_SCANLINE_OVERLAY_KEY), null)
    assert.strictEqual(globalThis.localStorage.getItem(STORAGE_UI_SCALE_KEY), null)

    // Sound default must be OFF (muted = true, enabled = false)
    assert.strictEqual(isAudioMuted(), true, "Fresh sound must be muted (OFF)")
    assert.strictEqual(isAudioEnabled(), false, "Fresh sound enabled must be false")

    // CRT default must be OFF
    assert.strictEqual(getSavedScanlineOverlay(), false, "Fresh CRT overlay must be OFF")
    assert.strictEqual(getSavedScanlineBeam(), false, "Fresh CRT beam must be OFF")
    assert.strictEqual(getSavedVignette(), false, "Fresh CRT vignette must be OFF")
    assert.strictEqual(getSavedCornerBrackets(), false, "Fresh CRT brackets must be OFF")

    // UI Scale default must be 100%
    assert.strictEqual(getSavedUiScale(), 100, "Fresh UI scale must be 100%")
    assert.strictEqual(DEFAULT_UI_SCALE, 100, "Default UI scale constant must be 100")
  })

  // --------------------------------------------------------------------------
  // TEST 2 — Saved Preference Retention
  // --------------------------------------------------------------------------
  await t.test("Test 2 — Saved Preference: preserves user choices across load", () => {
    // User explicitly turns Sound ON, CRT ON, and sets UI Scale to 200%
    setAudioMuted(false)
    saveCrtSettings({
      scanlineOverlay: true,
      scanlineBeam: true,
      vignette: true,
      cornerBrackets: true,
    })
    saveUiScale(200)

    // Verify stored values
    assert.strictEqual(isAudioMuted(), false, "Sound must be ON")
    assert.strictEqual(isAudioEnabled(), true, "Sound enabled must be true")
    assert.strictEqual(getSavedScanlineOverlay(), true, "CRT overlay must remain ON")
    assert.strictEqual(getSavedScanlineBeam(), true, "CRT beam must remain ON")
    assert.strictEqual(getSavedVignette(), true, "CRT vignette must remain ON")
    assert.strictEqual(getSavedCornerBrackets(), true, "CRT brackets must remain ON")
    assert.strictEqual(getSavedUiScale(), 200, "UI Scale must remain 200%")

    // Simulating app reload: read again directly through readers
    assert.strictEqual(isAudioMuted(), false, "Reload must preserve Sound ON")
    assert.strictEqual(getSavedScanlineOverlay(), true, "Reload must preserve CRT ON")
    assert.strictEqual(getSavedUiScale(), 200, "Reload must preserve UI Scale 200%")
  })

  // --------------------------------------------------------------------------
  // TEST 3 — Supported Scale Values List (Phase 6.33_FIX3: 100% - 200%)
  // --------------------------------------------------------------------------
  await t.test("Test 3 — Scale Values: Exact list [100, 125, 150, 175, 200]", () => {
    const expected = [100, 125, 150, 175, 200]
    assert.deepStrictEqual(Array.from(SUPPORTED_UI_SCALES), expected)
    assert.strictEqual(MIN_UI_SCALE, 100)
    assert.strictEqual(MAX_UI_SCALE, 200)
    assert.strictEqual(UI_SCALE_STEP, 25)

    // Multipliers
    assert.strictEqual(uiScaleToMultiplier(100), 1.0)
    assert.strictEqual(uiScaleToMultiplier(125), 1.25)
    assert.strictEqual(uiScaleToMultiplier(200), 2.0)
  })

  // --------------------------------------------------------------------------
  // TEST 4 — Maximum Scale (Phase 6.33_FIX3: 200% max, >200 normalized to 200)
  // --------------------------------------------------------------------------
  await t.test("Test 4 — Maximum: 200% accepted, >200 normalized to 200", () => {
    assert.strictEqual(normalizeUiScale(200), 200)
    assert.strictEqual(normalizeUiScale(225), 200)
    assert.strictEqual(normalizeUiScale(300), 200)
    assert.strictEqual(normalizeUiScale(325), 200)
    assert.strictEqual(normalizeUiScale(400), 200)
    assert.strictEqual(normalizeUiScale(500), 200)
    assert.strictEqual(normalizeUiScale("350%"), 200)
  })

  // --------------------------------------------------------------------------
  // TEST 5 — Minimum Scale
  // --------------------------------------------------------------------------
  await t.test("Test 5 — Minimum: <100 normalized to 100", () => {
    assert.strictEqual(normalizeUiScale(100), 100)
    assert.strictEqual(normalizeUiScale(99), 100)
    assert.strictEqual(normalizeUiScale(50), 100)
    assert.strictEqual(normalizeUiScale(0), 100)
    assert.strictEqual(normalizeUiScale(-50), 100)
    assert.strictEqual(normalizeUiScale(null), 100)
    assert.strictEqual(normalizeUiScale(undefined), 100)
    assert.strictEqual(normalizeUiScale("invalid"), 100)
  })

  // --------------------------------------------------------------------------
  // TEST 6 — Legacy Values Normalization
  // --------------------------------------------------------------------------
  await t.test("Test 6 — Legacy Values: 80, 90, 110, 120 and decimals normalized safely", () => {
    // Integer percentages
    assert.strictEqual(normalizeUiScale(80), 100, "80 must normalize to 100")
    assert.strictEqual(normalizeUiScale(90), 100, "90 must normalize to 100")
    assert.strictEqual(normalizeUiScale(110), 100, "110 must normalize to nearest step (100)")
    assert.strictEqual(normalizeUiScale(120), 125, "120 must normalize to nearest step (125)")
    assert.strictEqual(normalizeUiScale(125), 125, "125 stays 125")

    // Legacy float multipliers from FIX1 (0.8 -> 80 -> 100, 0.9 -> 90 -> 100, 1.1 -> 110 -> 100, 1.2 -> 120 -> 125)
    assert.strictEqual(normalizeUiScale(0.8), 100, "0.8 must normalize to 100")
    assert.strictEqual(normalizeUiScale(0.9), 100, "0.9 must normalize to 100")
    assert.strictEqual(normalizeUiScale(1.0), 100, "1.0 must normalize to 100")
    assert.strictEqual(normalizeUiScale(1.1), 100, "1.1 must normalize to 100")
    assert.strictEqual(normalizeUiScale(1.2), 125, "1.2 must normalize to 125")
    assert.strictEqual(normalizeUiScale(1.25), 125, "1.25 stays 125")
    assert.strictEqual(normalizeUiScale(2.0), 200, "2.0 must normalize to 200")
    assert.strictEqual(normalizeUiScale(3.0), 200, "3.0 must normalize to 200 (FIX3 cap)")

    // String formats
    assert.strictEqual(normalizeUiScale("80"), 100)
    assert.strictEqual(normalizeUiScale("120"), 125)
    assert.strictEqual(normalizeUiScale("1.2"), 125)
  })

  // --------------------------------------------------------------------------
  // TEST 7 — Reset Settings
  // --------------------------------------------------------------------------
  await t.test("Test 7 — Reset: returns Sound OFF, CRT OFF, UI 100%", () => {
    // First set non-default preferences
    setAudioMuted(false)
    saveCrtSettings({
      scanlineOverlay: true,
      scanlineBeam: true,
      vignette: true,
      cornerBrackets: true,
    })
    saveUiScale(250)

    // Execute reset
    const res = resetGlobalSettingsToDefault()

    assert.strictEqual(res.audioMuted, true, "Reset must set audioMuted = true (Sound OFF)")
    assert.strictEqual(res.scanlineOverlay, false, "Reset must set CRT overlay = false (OFF)")
    assert.strictEqual(res.scanlineBeam, false, "Reset must set CRT beam = false (OFF)")
    assert.strictEqual(res.vignette, false, "Reset must set CRT vignette = false (OFF)")
    assert.strictEqual(res.cornerBrackets, false, "Reset must set CRT brackets = false (OFF)")
    assert.strictEqual(res.uiScale, 100, "Reset must set uiScale = 100%")

    // Verify storage was updated as well
    assert.strictEqual(isAudioMuted(), true)
    assert.strictEqual(getSavedScanlineOverlay(), false)
    assert.strictEqual(getSavedUiScale(), 100)
  })

  // --------------------------------------------------------------------------
  // TEST 8 — Gameplay Isolation
  // --------------------------------------------------------------------------
  await t.test("Test 8 — Gameplay Isolation: Settings changes do not mutate Combat/World state", () => {
    const world: WorldState = createInitialWorldState()
    const sectorKeys = Object.keys(world.sectors)
    const targetSector = sectorKeys[0]

    // Capture initial gameplay properties
    const initialTurn = world.currentDay
    const initialStardate = world.totalDaysElapsed
    const initialSectorOwnership = world.sectors[targetSector].sovereignty
    const initialGarrison = world.sectors[targetSector].garrisonPower

    // Launch encounter in target sector
    const snapshot = lockEncounterAndCreateSnapshot(world, {
      sectorId: targetSector,
      combatVersion: "v2",
    })

    const initialSuspended = world.isSuspendedCombat
    const initialSectorLock = world.sectors[targetSector].isLockedForCombat

    // Now change all settings multiple times
    saveUiScale(300)
    saveCrtSettings({ scanlineOverlay: true, scanlineBeam: true })
    setAudioMuted(false)
    setAudioVolume(0.3)
    resetGlobalSettingsToDefault()
    saveUiScale(175)

    // Confirm that authoritative gameplay / world state was 100% UNTOUCHED
    assert.strictEqual(world.currentDay, initialTurn, "World currentDay must not be mutated")
    assert.strictEqual(world.totalDaysElapsed, initialStardate, "World totalDaysElapsed must not be mutated")
    assert.strictEqual(world.sectors[targetSector].sovereignty, initialSectorOwnership)
    assert.strictEqual(world.sectors[targetSector].garrisonPower, initialGarrison)
    assert.strictEqual(world.isSuspendedCombat, initialSuspended)
    assert.strictEqual(world.sectors[targetSector].isLockedForCombat, initialSectorLock)
    assert.strictEqual(snapshot.sectorId, targetSector)
  })
})
