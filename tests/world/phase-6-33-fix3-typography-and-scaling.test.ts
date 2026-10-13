/**
 * STARFRONT WORLD — PHASE 6.33_FIX3 FOCUSED TESTS
 *
 * Verifies Typography Scaling & Readability Fix:
 * Test 1 — Supported Scale Range: Exactly [100, 125, 150, 175, 200], step 25%, min 100%, max 200%
 * Test 2 — Normalization of High Scales: >200 (225, 250, 275, 300) clamped to 200
 * Test 3 — Normalization of Low Scales: <100 (50, 80, 90, 0, negative) normalized to 100
 * Test 4 — Nearest Step Rounding: 110 -> 100, 120 -> 125, 160 -> 150, 170 -> 175
 * Test 5 — Decimal Multipliers: 0.8 -> 100, 1.2 -> 125, 1.5 -> 150, 1.75 -> 175, 2.0 -> 200, 3.0 -> 200
 * Test 6 — Default Preferences: Sound = OFF, CRT = OFF, UI Scale = 100%
 * Test 7 — Preserved Preferences: Valid saved scale (e.g. 150%, 175%, 200%) preserved across reloads
 * Test 8 — Normalization on Load: Legacy saved scale of 300% from FIX2 reloads safely normalized to 200% without crash
 * Test 9 — Reset Settings: Returns Sound = OFF, CRT = OFF, UI Scale = 100%
 * Test 10 — Multiplier Calculations: 100% -> 1.0, 125% -> 1.25, 150% -> 1.5, 175% -> 1.75, 200% -> 2.0
 */

import test from "node:test"
import assert from "node:assert/strict"
import {
  isAudioMuted,
  setAudioMuted,
  isAudioEnabled,
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
} from "../../lib/game/ui-settings"

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

test("PHASE 6.33_FIX3: Typography & UI Scaling (100% - 200%) Test Suite", async (t) => {
  const originalLocalStorage = globalThis.localStorage

  t.beforeEach(() => {
    const mockStorage = new MockLocalStorage()
    Object.defineProperty(globalThis, "localStorage", {
      value: mockStorage,
      writable: true,
      configurable: true,
    })
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
  // TEST 1 — Supported Scale Range
  // --------------------------------------------------------------------------
  await t.test("Test 1 — Supported Scale Range: Exactly [100, 125, 150, 175, 200]", () => {
    const expected = [100, 125, 150, 175, 200]
    assert.deepStrictEqual(Array.from(SUPPORTED_UI_SCALES), expected)
    assert.strictEqual(MIN_UI_SCALE, 100)
    assert.strictEqual(MAX_UI_SCALE, 200)
    assert.strictEqual(UI_SCALE_STEP, 25)
    assert.strictEqual(DEFAULT_UI_SCALE, 100)
  })

  // --------------------------------------------------------------------------
  // TEST 2 — Normalization of High Scales (>200 clamped to 200)
  // --------------------------------------------------------------------------
  await t.test("Test 2 — Normalization of High Scales: >200 (225, 250, 275, 300) clamped to 200", () => {
    assert.strictEqual(normalizeUiScale(200), 200)
    assert.strictEqual(normalizeUiScale(225), 200, "225 from FIX2 must normalize to 200")
    assert.strictEqual(normalizeUiScale(250), 200, "250 from FIX2 must normalize to 200")
    assert.strictEqual(normalizeUiScale(275), 200, "275 from FIX2 must normalize to 200")
    assert.strictEqual(normalizeUiScale(300), 200, "300 from FIX2 must normalize to 200")
    assert.strictEqual(normalizeUiScale(350), 200)
    assert.strictEqual(normalizeUiScale(500), 200)
    assert.strictEqual(normalizeUiScale("250%"), 200)
    assert.strictEqual(normalizeUiScale("300%"), 200)
  })

  // --------------------------------------------------------------------------
  // TEST 3 — Normalization of Low Scales (<100 normalized to 100)
  // --------------------------------------------------------------------------
  await t.test("Test 3 — Normalization of Low Scales: <100 normalized to 100", () => {
    assert.strictEqual(normalizeUiScale(100), 100)
    assert.strictEqual(normalizeUiScale(99), 100)
    assert.strictEqual(normalizeUiScale(80), 100)
    assert.strictEqual(normalizeUiScale(50), 100)
    assert.strictEqual(normalizeUiScale(0), 100)
    assert.strictEqual(normalizeUiScale(-25), 100)
    assert.strictEqual(normalizeUiScale(null), 100)
    assert.strictEqual(normalizeUiScale(undefined), 100)
    assert.strictEqual(normalizeUiScale("invalid"), 100)
  })

  // --------------------------------------------------------------------------
  // TEST 4 — Nearest Step Rounding
  // --------------------------------------------------------------------------
  await t.test("Test 4 — Nearest Step Rounding: 110 -> 100, 120 -> 125, 160 -> 150, 170 -> 175", () => {
    assert.strictEqual(normalizeUiScale(110), 100, "110 rounds to nearest step 100")
    assert.strictEqual(normalizeUiScale(120), 125, "120 rounds to nearest step 125")
    assert.strictEqual(normalizeUiScale(130), 125, "130 rounds to nearest step 125")
    assert.strictEqual(normalizeUiScale(140), 150, "140 rounds to nearest step 150")
    assert.strictEqual(normalizeUiScale(160), 150, "160 rounds to nearest step 150")
    assert.strictEqual(normalizeUiScale(170), 175, "170 rounds to nearest step 175")
    assert.strictEqual(normalizeUiScale(190), 200, "190 rounds to nearest step 200")
  })

  // --------------------------------------------------------------------------
  // TEST 5 — Decimal Multipliers
  // --------------------------------------------------------------------------
  await t.test("Test 5 — Decimal Multipliers safely converted and clamped", () => {
    assert.strictEqual(normalizeUiScale(0.8), 100, "0.8 -> 80 -> 100")
    assert.strictEqual(normalizeUiScale(1.0), 100, "1.0 -> 100")
    assert.strictEqual(normalizeUiScale(1.2), 125, "1.2 -> 120 -> 125")
    assert.strictEqual(normalizeUiScale(1.25), 125, "1.25 -> 125")
    assert.strictEqual(normalizeUiScale(1.5), 150, "1.5 -> 150")
    assert.strictEqual(normalizeUiScale(1.75), 175, "1.75 -> 175")
    assert.strictEqual(normalizeUiScale(2.0), 200, "2.0 -> 200")
    assert.strictEqual(normalizeUiScale(2.5), 200, "2.5 -> 250 -> 200")
    assert.strictEqual(normalizeUiScale(3.0), 200, "3.0 -> 300 -> 200")
  })

  // --------------------------------------------------------------------------
  // TEST 6 — Default Preferences
  // --------------------------------------------------------------------------
  await t.test("Test 6 — Fresh Defaults: Sound = OFF, CRT = OFF, UI Scale = 100%", () => {
    assert.strictEqual(isAudioMuted(), true, "Fresh sound must be OFF (muted = true)")
    assert.strictEqual(isAudioEnabled(), false, "Fresh sound enabled must be false")
    assert.strictEqual(getSavedScanlineOverlay(), false, "Fresh CRT overlay must be OFF")
    assert.strictEqual(getSavedScanlineBeam(), false, "Fresh CRT beam must be OFF")
    assert.strictEqual(getSavedVignette(), false, "Fresh CRT vignette must be OFF")
    assert.strictEqual(getSavedCornerBrackets(), false, "Fresh CRT brackets must be OFF")
    assert.strictEqual(getSavedUiScale(), 100, "Fresh UI scale must be 100%")
  })

  // --------------------------------------------------------------------------
  // TEST 7 — Preserved Preferences
  // --------------------------------------------------------------------------
  await t.test("Test 7 — Preserved Preferences: Valid saved scale (150%, 175%, 200%) preserved", () => {
    saveUiScale(150)
    assert.strictEqual(getSavedUiScale(), 150)

    saveUiScale(175)
    assert.strictEqual(getSavedUiScale(), 175)

    saveUiScale(200)
    assert.strictEqual(getSavedUiScale(), 200)
  })

  // --------------------------------------------------------------------------
  // TEST 8 — Normalization on Load of Legacy FIX2 Value (e.g. 300)
  // --------------------------------------------------------------------------
  await t.test("Test 8 — Normalization on Load: Legacy saved scale of 300% from FIX2 normalizes to 200%", () => {
    // Manually set old 300% scale in localStorage
    globalThis.localStorage.setItem(STORAGE_UI_SCALE_KEY, "300")

    // Reader must return 200 without crashing
    const loaded = getSavedUiScale()
    assert.strictEqual(loaded, 200, "Legacy 300% must normalize to 200%")
  })

  // --------------------------------------------------------------------------
  // TEST 9 — Reset Settings
  // --------------------------------------------------------------------------
  await t.test("Test 9 — Reset: Returns Sound = OFF, CRT = OFF, UI Scale = 100%", () => {
    setAudioMuted(false)
    saveCrtSettings({ scanlineOverlay: true })
    saveUiScale(175)

    const res = resetGlobalSettingsToDefault()
    assert.strictEqual(res.audioMuted, true, "Reset must set sound to OFF")
    assert.strictEqual(res.scanlineOverlay, false, "Reset must set CRT to OFF")
    assert.strictEqual(res.uiScale, 100, "Reset must set UI scale to 100%")

    assert.strictEqual(getSavedUiScale(), 100)
    assert.strictEqual(getSavedScanlineOverlay(), false)
    assert.strictEqual(isAudioMuted(), true)
  })

  // --------------------------------------------------------------------------
  // TEST 10 — Multiplier Calculations
  // --------------------------------------------------------------------------
  await t.test("Test 10 — Multiplier Calculations: 100% -> 1.0, 125% -> 1.25, 150% -> 1.5, 175% -> 1.75, 200% -> 2.0", () => {
    assert.strictEqual(uiScaleToMultiplier(100), 1.0)
    assert.strictEqual(uiScaleToMultiplier(125), 1.25)
    assert.strictEqual(uiScaleToMultiplier(150), 1.5)
    assert.strictEqual(uiScaleToMultiplier(175), 1.75)
    assert.strictEqual(uiScaleToMultiplier(200), 2.0)
    // Any legacy value like 300 clamped to 200
    assert.strictEqual(uiScaleToMultiplier(300), 2.0)
  })
})
