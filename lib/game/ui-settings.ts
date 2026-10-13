/**
 * STARFRONT — Centralized UI Preferences & Scaling Settings
 * Phase 6.33_FIX2:
 * - Sound default = OFF
 * - CRT default = OFF
 * - UI Scale range: 100% -> 300% (step 25%, default 100%)
 * - Safe legacy normalization & persistence
 */

import { setAudioMuted, setAudioVolume } from "./audio"

export const MIN_UI_SCALE = 100
export const MAX_UI_SCALE = 200
export const UI_SCALE_STEP = 25
export const DEFAULT_UI_SCALE = 100

export const SUPPORTED_UI_SCALES = [
  100,
  125,
  150,
  175,
  200,
] as const

export type SupportedUiScale = (typeof SUPPORTED_UI_SCALES)[number]

export const STORAGE_UI_SCALE_KEY = "starfront_ui_scale"
export const STORAGE_SCANLINE_OVERLAY_KEY = "starfront_scanline_overlay"
export const STORAGE_SCANLINE_BEAM_KEY = "starfront_scanline_beam"
export const STORAGE_VIGNETTE_KEY = "starfront_vignette"
export const STORAGE_CORNER_BRACKETS_KEY = "starfront_corner_brackets"

// In-memory fallbacks for SSR, Node.js, and headless tests
let memoryScale: SupportedUiScale = DEFAULT_UI_SCALE
let memoryOverlay = false
let memoryBeam = false
let memoryVignette = false
let memoryBrackets = false

function getLocalStorage(): Storage | null {
  if (typeof globalThis !== "undefined" && typeof globalThis.localStorage !== "undefined") {
    return globalThis.localStorage
  }
  return null
}

/**
 * Normalizes any raw scale value (number, string, legacy float 0.8-3.0, percentage, or out-of-range)
 * to one of the supported 25% steps in [100, 200] (Phase 6.33_FIX3).
 * 
 * Rules:
 * - Missing / invalid: 100
 * - Decimal legacy (<= 3.0 and > 0): multiplied by 100 (e.g. 0.8 -> 80, 1.2 -> 120, 2.0 -> 200, 2.5 -> 250 -> 200)
 * - Below 100: 100
 * - Above 200: 200
 * - Round to nearest 25 step (e.g. 80 -> 100, 90 -> 100, 110 -> 100, 120 -> 125, 160 -> 150, 225 -> 200, 300 -> 200)
 */
export function normalizeUiScale(val: unknown): SupportedUiScale {
  if (val === null || val === undefined) return DEFAULT_UI_SCALE

  let num = typeof val === "number" ? val : parseFloat(String(val))
  if (isNaN(num) || !isFinite(num)) return DEFAULT_UI_SCALE

  // Convert legacy decimal multipliers (e.g., 0.8, 0.9, 1.0, 1.1, 1.2, 1.25, 2.0, 3.0)
  if (num > 0 && num <= 3.0) {
    num = Math.round(num * 100)
  }

  // Round to nearest 25 step
  const rounded = Math.round(num / UI_SCALE_STEP) * UI_SCALE_STEP

  // Clamp within bounds [100, 200]
  const finalVal = Math.max(MIN_UI_SCALE, Math.min(MAX_UI_SCALE, rounded))
  return finalVal as SupportedUiScale
}

/** Converts integer percentage (100 -> 300) to CSS multiplier (1.0 -> 3.0) */
export function uiScaleToMultiplier(scalePercent: number): number {
  const norm = normalizeUiScale(scalePercent)
  return Number((norm / 100).toFixed(2))
}

/** Updates the root HTML --ui-scale CSS variable safely */
export function applyUiScale(scalePercent: number): void {
  if (typeof document !== "undefined") {
    const mult = uiScaleToMultiplier(scalePercent)
    document.documentElement.style.setProperty("--ui-scale", String(mult))
  }
}

/** Reads saved UI Scale from localStorage or memory, or returns default (100) */
export function getSavedUiScale(): SupportedUiScale {
  const storage = getLocalStorage()
  if (storage) {
    try {
      const saved = storage.getItem(STORAGE_UI_SCALE_KEY)
      if (saved !== null) {
        return normalizeUiScale(saved)
      }
    } catch {}
  }
  return memoryScale
}

/** Saves UI Scale to localStorage and applies CSS variable */
export function saveUiScale(scalePercent: number): SupportedUiScale {
  const norm = normalizeUiScale(scalePercent)
  memoryScale = norm
  const storage = getLocalStorage()
  if (storage) {
    try {
      storage.setItem(STORAGE_UI_SCALE_KEY, String(norm))
    } catch {}
  }
  applyUiScale(norm)
  return norm
}

/** Reads saved CRT Scanline overlay preference (Default: false / OFF) */
export function getSavedScanlineOverlay(): boolean {
  const storage = getLocalStorage()
  if (storage) {
    try {
      const saved = storage.getItem(STORAGE_SCANLINE_OVERLAY_KEY)
      if (saved !== null) return saved === "true"
    } catch {}
  }
  return memoryOverlay
}

/** Reads saved CRT Beam animation preference (Default: false / OFF) */
export function getSavedScanlineBeam(): boolean {
  const storage = getLocalStorage()
  if (storage) {
    try {
      const saved = storage.getItem(STORAGE_SCANLINE_BEAM_KEY)
      if (saved !== null) return saved === "true"
    } catch {}
  }
  return memoryBeam
}

/** Reads saved CRT Vignette preference (Default: false / OFF) */
export function getSavedVignette(): boolean {
  const storage = getLocalStorage()
  if (storage) {
    try {
      const saved = storage.getItem(STORAGE_VIGNETTE_KEY)
      if (saved !== null) return saved === "true"
    } catch {}
  }
  return memoryVignette
}

/** Reads saved CRT Corner Brackets preference (Default: false / OFF) */
export function getSavedCornerBrackets(): boolean {
  const storage = getLocalStorage()
  if (storage) {
    try {
      const saved = storage.getItem(STORAGE_CORNER_BRACKETS_KEY)
      if (saved !== null) return saved === "true"
    } catch {}
  }
  return memoryBrackets
}

/** Saves CRT settings to localStorage */
export function saveCrtSettings(settings: {
  scanlineOverlay?: boolean
  scanlineBeam?: boolean
  vignette?: boolean
  cornerBrackets?: boolean
}): void {
  if (settings.scanlineOverlay !== undefined) memoryOverlay = settings.scanlineOverlay
  if (settings.scanlineBeam !== undefined) memoryBeam = settings.scanlineBeam
  if (settings.vignette !== undefined) memoryVignette = settings.vignette
  if (settings.cornerBrackets !== undefined) memoryBrackets = settings.cornerBrackets

  const storage = getLocalStorage()
  if (storage) {
    try {
      if (settings.scanlineOverlay !== undefined) {
        storage.setItem(STORAGE_SCANLINE_OVERLAY_KEY, String(settings.scanlineOverlay))
      }
      if (settings.scanlineBeam !== undefined) {
        storage.setItem(STORAGE_SCANLINE_BEAM_KEY, String(settings.scanlineBeam))
      }
      if (settings.vignette !== undefined) {
        storage.setItem(STORAGE_VIGNETTE_KEY, String(settings.vignette))
      }
      if (settings.cornerBrackets !== undefined) {
        storage.setItem(STORAGE_CORNER_BRACKETS_KEY, String(settings.cornerBrackets))
      }
    } catch {}
  }
}

/** Resets all global settings to Phase 6.33_FIX2 official defaults */
export function resetGlobalSettingsToDefault(): {
  audioMuted: boolean
  audioVolume: number
  scanlineOverlay: boolean
  scanlineBeam: boolean
  vignette: boolean
  cornerBrackets: boolean
  uiScale: SupportedUiScale
} {
  setAudioMuted(true)
  setAudioVolume(0.8)
  saveCrtSettings({
    scanlineOverlay: false,
    scanlineBeam: false,
    vignette: false,
    cornerBrackets: false,
  })
  saveUiScale(DEFAULT_UI_SCALE)

  return {
    audioMuted: true,
    audioVolume: 0.8,
    scanlineOverlay: false,
    scanlineBeam: false,
    vignette: false,
    cornerBrackets: false,
    uiScale: DEFAULT_UI_SCALE,
  }
}
