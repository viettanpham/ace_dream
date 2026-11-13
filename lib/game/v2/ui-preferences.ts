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

export type V2ReleaseSelectionMode = 'channel-auto' | 'pinned-r4'

export interface V2UIPreferences {
  globalMenuMode: 'mini' | 'full'
  pilotRosterMode: 'mini' | 'full'
  backgroundMode: 'standard' | 'tactical'
  activePilotTab: string
  rosterCollapsed: boolean
  heroBackgroundMode: 'contextual' | 'clean'
  mobilePreferredMode: 'art' | 'info'
  releaseSelectionMode: V2ReleaseSelectionMode
  autoCheckChannelOnFocus: boolean
}

const STORAGE_KEY = 'sf_v2_ui_prefs'

const DEFAULT_PREFERENCES: V2UIPreferences = {
  globalMenuMode: 'mini',
  pilotRosterMode: 'mini',
  backgroundMode: 'standard',
  activePilotTab: 'overview',
  rosterCollapsed: false,
  heroBackgroundMode: 'contextual',
  mobilePreferredMode: 'art',
  releaseSelectionMode: 'channel-auto',
  autoCheckChannelOnFocus: true,
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
      rosterCollapsed: Boolean(parsed.rosterCollapsed),
      heroBackgroundMode: parsed.heroBackgroundMode === 'clean' ? 'clean' : 'contextual',
      mobilePreferredMode: parsed.mobilePreferredMode === 'info' ? 'info' : 'art',
      releaseSelectionMode:
        parsed.releaseSelectionMode === 'pinned-r4' ? 'pinned-r4' : 'channel-auto',
      autoCheckChannelOnFocus:
        typeof parsed.autoCheckChannelOnFocus === 'boolean'
          ? parsed.autoCheckChannelOnFocus
          : true,
    }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function saveV2UIPreferences(prefs: Partial<V2UIPreferences>): void {
  if (typeof window === 'undefined') return

  try {
    const current = loadV2UIPreferences()
    // Strictly whitelist safe preference fields; never persist raw CDN URLs
    const updated: V2UIPreferences = {
      globalMenuMode:
        prefs.globalMenuMode !== undefined ? prefs.globalMenuMode : current.globalMenuMode,
      pilotRosterMode:
        prefs.pilotRosterMode !== undefined ? prefs.pilotRosterMode : current.pilotRosterMode,
      backgroundMode:
        prefs.backgroundMode !== undefined ? prefs.backgroundMode : current.backgroundMode,
      activePilotTab:
        prefs.activePilotTab !== undefined ? prefs.activePilotTab : current.activePilotTab,
      rosterCollapsed:
        prefs.rosterCollapsed !== undefined ? prefs.rosterCollapsed : current.rosterCollapsed,
      heroBackgroundMode:
        prefs.heroBackgroundMode !== undefined
          ? prefs.heroBackgroundMode
          : current.heroBackgroundMode,
      mobilePreferredMode:
        prefs.mobilePreferredMode !== undefined
          ? prefs.mobilePreferredMode
          : current.mobilePreferredMode,
      releaseSelectionMode:
        prefs.releaseSelectionMode === 'pinned-r4' || prefs.releaseSelectionMode === 'channel-auto'
          ? prefs.releaseSelectionMode
          : current.releaseSelectionMode,
      autoCheckChannelOnFocus:
        typeof prefs.autoCheckChannelOnFocus === 'boolean'
          ? prefs.autoCheckChannelOnFocus
          : current.autoCheckChannelOnFocus,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // Ignore storage quota or permission errors
  }
}
