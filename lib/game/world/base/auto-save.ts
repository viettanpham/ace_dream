/**
 * STARFRONT WORLD — Auto-Save & Resilience Engine (Phase 6.34A-FND-6)
 *
 * Implements:
 * 1. Dual Trigger Interval:
 *    - In-Game Days: Triggers every 7 game days (autoSaveIntervalGameDays).
 *    - Real-Time Minutes: Triggers every 10 real minutes (autoSaveIntervalRealMinutes = 600,000ms).
 * 2. Non-blocking resilient auto-save execution to STARFRONT_WORLD_SAVE_V1 and rotating backups A/B.
 * 3. Status logging and timestamp tracking.
 */

import type { WorldState } from "../types"
import { saveWorldState } from "../storage"
import type { WorldGenerationConfig } from "./types"
import { DEFAULT_WORLD_GENERATION_CONFIG } from "./types"

export interface AutoSaveCheckResult {
  triggered: boolean
  triggerReason?: "GAME_DAYS_INTERVAL" | "REAL_TIME_INTERVAL" | "MANUAL"
  lastSavedGameDay: number
  lastSavedTimestamp: number
  nextScheduledGameDay: number
  nextScheduledTimestamp: number
}

/**
 * Checks whether auto-save conditions are met based on current game day and real time
 */
export function checkAutoSaveEligibility(
  state: WorldState,
  currentTimeMs: number = Date.now(),
  config: WorldGenerationConfig = DEFAULT_WORLD_GENERATION_CONFIG
): AutoSaveCheckResult {
  const currentDay = state.currentDay || 1
  const lastSavedDay = state.lastAutoSaveGameDay ?? (state.currentDay || 1)
  const lastSavedTime = state.lastAutoSaveTimestamp ?? state.realTimeAnchor ?? currentTimeMs

  const daysElapsedSinceSave = currentDay - lastSavedDay
  const realMsElapsedSinceSave = currentTimeMs - lastSavedTime

  const gameDaysInterval = config.autoSaveIntervalGameDays || 7
  const realMsInterval = (config.autoSaveIntervalRealMinutes || 10) * 60 * 1000

  let triggered = false
  let triggerReason: "GAME_DAYS_INTERVAL" | "REAL_TIME_INTERVAL" | undefined = undefined

  if (daysElapsedSinceSave >= gameDaysInterval) {
    triggered = true
    triggerReason = "GAME_DAYS_INTERVAL"
  } else if (realMsElapsedSinceSave >= realMsInterval) {
    triggered = true
    triggerReason = "REAL_TIME_INTERVAL"
  }

  return {
    triggered,
    triggerReason,
    lastSavedGameDay: lastSavedDay,
    lastSavedTimestamp: lastSavedTime,
    nextScheduledGameDay: lastSavedDay + gameDaysInterval,
    nextScheduledTimestamp: lastSavedTime + realMsInterval,
  }
}

/**
 * Performs auto-save if eligible and updates state timestamps
 */
export function executeAutoSaveIfEligible(
  state: WorldState,
  currentTimeMs: number = Date.now(),
  config: WorldGenerationConfig = DEFAULT_WORLD_GENERATION_CONFIG
): { saved: boolean; check: AutoSaveCheckResult } {
  const check = checkAutoSaveEligibility(state, currentTimeMs, config)

  if (check.triggered) {
    state.lastAutoSaveGameDay = state.currentDay
    state.lastAutoSaveTimestamp = currentTimeMs

    saveWorldState(state)
    return { saved: true, check }
  }

  return { saved: false, check }
}
