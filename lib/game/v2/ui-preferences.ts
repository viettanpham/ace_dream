'use client'

/**
 * STARFRONT WORLD — UI V2 PREFERENCES ADAPTER
 * 
 * Strictly isolated from gameplay progression and save data.
 * Manages presentation-only UI preferences:
 * - globalMenuMode: 'mini' | 'full' (default: 'mini')
 * - pilotRosterMode: 'mini' | 'full' (default: 'mini')
 * - backgroundMode: 'standard' | 'tactical' (default: 'standard')
 */

export interface V2UIPreferences {
  globalMenuMode: 'mini' | 'full'
  pilotRosterMode: 'mini' | 'full'
  backgroundMode: 'standard' | 'tactical'
  activePilotTab: string
}

const STORAGE_KEY = 'sf_v2_ui_prefs'

const DEFAULT_PREFERENCES: V2UIPreferences = {
  globalMenuMode: 'mini',
  pilotRosterMode: 'mini',
  backgroundMode: 'standard',
  activePilotTab: 'overview',
}

export function loadV2UIPreferences(): V2UIPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFERENCES
    const parsed = JSON.parse(raw)
    return {
      globalMenuMode: parsed.globalMenuMode === 'full' ? 'full' : 'mini',
      pilotRosterMode: parsed.pilotRosterMode === 'full' ? 'full' : 'mini',
      backgroundMode: parsed.backgroundMode === 'tactical' ? 'tactical' : 'standard',
      activePilotTab: typeof parsed.activePilotTab === 'string' ? parsed.activePilotTab : 'overview',
    }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function saveV2UIPreferences(prefs: Partial<V2UIPreferences>): void {
  if (typeof window === 'undefined') return

  try {
    const current = loadV2UIPreferences()
    const updated = { ...current, ...prefs }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // Ignore storage quota or permission errors
  }
}
