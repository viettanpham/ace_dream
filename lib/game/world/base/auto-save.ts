/**
 * STARFRONT WORLD — Auto-Save, 3-Slot Ring Buffer & DEV File Save Engine (Phase 6.34A-FND-6)
 *
 * Implements:
 * 1. Dual Trigger Interval:
 *    - In-Game Days: Triggers every 7 game days (autoSaveIntervalGameDays).
 *    - Real-Time Minutes: Triggers every 10 real minutes (autoSaveIntervalRealMinutes = 600,000ms).
 * 2. 3-Slot Valid Auto-Save Ring Buffer (STARFRONT_WORLD_AUTOSAVE_SLOTS_V1):
 *    - Retains up to 3 most recent VALID auto-saves.
 *    - Deterministically ordered by tick/currentDay descending first, then savedAt/sequence descending
 *      so rapid saves within the same millisecond never lose ordering.
 *    - Checksum & structural verification on every slot.
 *    - Automatic fallback to the newest valid Auto-Save slot if the latest slot or primary save is corrupted.
 * 3. DEV Mode Project File Save (.starfront-saves/dev/):
 *    - Saves and loads directly from project directory via /api/world/dev-save (browser) or fs (Node/SSR)
 *      with safe browser localStorage fallback.
 */

import type { WorldSaveEnvelope, WorldState } from "../types"
import {
  calculateChecksum,
  parseAndValidateEnvelope,
  saveWorldState,
  validateWorldStateStructure,
} from "../storage"
import type { WorldGenerationConfig } from "./types"
import { DEFAULT_WORLD_GENERATION_CONFIG } from "./types"

export const WORLD_AUTOSAVE_SLOTS_KEY = "STARFRONT_WORLD_AUTOSAVE_SLOTS_V1"
export const MAX_VALID_AUTOSAVE_SLOTS = 3

export interface AutoSaveCheckResult {
  triggered: boolean
  triggerReason?: "GAME_DAYS_INTERVAL" | "REAL_TIME_INTERVAL" | "MANUAL"
  lastSavedGameDay: number
  lastSavedTimestamp: number
  nextScheduledGameDay: number
  nextScheduledTimestamp: number
}

export interface AutoSaveSlotRecord {
  slotId: string
  sequence: number
  tick: number
  currentDay: number
  savedAt: string
  timestamp: number
  checksum: string
  schemaVersion: number
  envelopeJson: string
}

// In-memory fallback store for Node/SSR test environments where localStorage is unavailable
let memoryAutoSaveRaw: string | null = null
let autoSaveSequenceCounter = 0

function readRawAutoSaveStore(): string | null {
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    try {
      return window.localStorage.getItem(WORLD_AUTOSAVE_SLOTS_KEY)
    } catch {
      return memoryAutoSaveRaw
    }
  }
  return memoryAutoSaveRaw
}

function writeRawAutoSaveStore(raw: string): void {
  memoryAutoSaveRaw = raw
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    try {
      window.localStorage.setItem(WORLD_AUTOSAVE_SLOTS_KEY, raw)
    } catch {
      // Fallback kept in memoryAutoSaveRaw
    }
  }
}

/**
 * Clears all stored auto-save slots (used in isolated tests or full reset when requested)
 */
export function clearAutoSaveSlots(): void {
  memoryAutoSaveRaw = null
  autoSaveSequenceCounter = 0
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    try {
      window.localStorage.removeItem(WORLD_AUTOSAVE_SLOTS_KEY)
    } catch {
      // Ignore
    }
  }
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
 * Reads and validates all stored Auto-Save slots, filtering out corrupted entries
 */
export function getValidAutoSaveSlots(): AutoSaveSlotRecord[] {
  const raw = readRawAutoSaveStore()
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const validSlots: AutoSaveSlotRecord[] = []
    for (const item of parsed) {
      if (!item || typeof item !== "object" || typeof item.envelopeJson !== "string") continue
      const check = parseAndValidateEnvelope(item.envelopeJson)
      if (check.valid && check.envelope && check.envelope.checksum === item.checksum) {
        validSlots.push(item as AutoSaveSlotRecord)
      }
    }

    // Sort deterministically: tick descending -> currentDay descending -> sequence descending -> savedAt descending
    validSlots.sort((a, b) => {
      if (b.tick !== a.tick) return b.tick - a.tick
      if (b.currentDay !== a.currentDay) return b.currentDay - a.currentDay
      if ((b.sequence || 0) !== (a.sequence || 0)) return (b.sequence || 0) - (a.sequence || 0)
      return b.savedAt.localeCompare(a.savedAt)
    })

    return validSlots
  } catch {
    return []
  }
}

/**
 * Performs an immediate Auto-Save, maintaining up to 3 valid Auto-Save slots
 * ordered by tick/currentDay descending + sequence/savedAt descending.
 */
export function performAutoSave(
  state: WorldState,
  currentTimeMs: number = Date.now()
): {
  success: boolean
  slot?: AutoSaveSlotRecord
  retainedSlots: AutoSaveSlotRecord[]
  error?: string
} {
  if (!validateWorldStateStructure(state)) {
    return {
      success: false,
      retainedSlots: getValidAutoSaveSlots(),
      error: "INVALID_WORLD_STATE_STRUCTURE",
    }
  }

  autoSaveSequenceCounter += 1
  const seq = autoSaveSequenceCounter
  const tick = state.totalDaysElapsed ?? state.currentDay ?? 1
  const currentDay = state.currentDay ?? 1
  const timestamp = currentTimeMs + seq
  const savedAt = new Date(timestamp).toISOString()

  state.lastAutoSaveGameDay = currentDay
  state.lastAutoSaveTimestamp = currentTimeMs

  const serializedData = JSON.stringify(state)
  const checksum = calculateChecksum(serializedData)
  const envelope: WorldSaveEnvelope = {
    schemaVersion: 1,
    timestamp,
    checksum,
    data: JSON.parse(serializedData),
  }
  const envelopeJson = JSON.stringify(envelope)

  const newSlot: AutoSaveSlotRecord = {
    slotId: `autosave_d${currentDay}_t${tick}_s${seq}`,
    sequence: seq,
    tick,
    currentDay,
    savedAt,
    timestamp,
    checksum,
    schemaVersion: 1,
    envelopeJson,
  }

  const validExisting = getValidAutoSaveSlots()
  validExisting.push(newSlot)

  // Sort by tick descending first, then currentDay descending, then sequence descending, then savedAt descending
  validExisting.sort((a, b) => {
    if (b.tick !== a.tick) return b.tick - a.tick
    if (b.currentDay !== a.currentDay) return b.currentDay - a.currentDay
    if ((b.sequence || 0) !== (a.sequence || 0)) return (b.sequence || 0) - (a.sequence || 0)
    return b.savedAt.localeCompare(a.savedAt)
  })

  const retainedSlots = validExisting.slice(0, MAX_VALID_AUTOSAVE_SLOTS)
  writeRawAutoSaveStore(JSON.stringify(retainedSlots))

  // Also persist to primary + A/B storage when in browser
  saveWorldState(state)

  return {
    success: true,
    slot: newSlot,
    retainedSlots,
  }
}

/**
 * Convenience wrapper for saving an auto-save slot record with deterministic day/sequence
 */
export function saveAutoSaveSlotRecord(
  state: WorldState,
  day?: number,
  timeMs?: number
): {
  success: boolean
  slot?: AutoSaveSlotRecord
  retainedSlots: AutoSaveSlotRecord[]
  error?: string
} {
  if (day !== undefined) {
    state.currentDay = day
  }
  return performAutoSave(state, timeMs ?? Date.now())
}

/**
 * Recovers WorldState from the newest valid Auto-Save slot when the latest save is corrupted
 */
export function recoverFromLatestValidAutoSave(): {
  recovered: boolean
  state: WorldState | null
  slot?: AutoSaveSlotRecord
  reason?: string
} {
  const validSlots = getValidAutoSaveSlots()
  if (validSlots.length === 0) {
    return {
      recovered: false,
      state: null,
      reason: "NO_VALID_AUTOSAVE_SLOTS_AVAILABLE",
    }
  }

  const newestValid = validSlots[0]
  const parsed = parseAndValidateEnvelope(newestValid.envelopeJson)
  if (!parsed.valid || !parsed.envelope) {
    return {
      recovered: false,
      state: null,
      reason: "AUTOSAVE_ENVELOPE_VALIDATION_FAILED",
    }
  }

  return {
    recovered: true,
    state: parsed.envelope.data,
    slot: newestValid,
  }
}

/**
 * Performs auto-save if eligible and updates state timestamps
 */
export function executeAutoSaveIfEligible(
  state: WorldState,
  currentTimeMs: number = Date.now(),
  config: WorldGenerationConfig = DEFAULT_WORLD_GENERATION_CONFIG
): { saved: boolean; check: AutoSaveCheckResult; retainedCount?: number } {
  const check = checkAutoSaveEligibility(state, currentTimeMs, config)

  if (check.triggered) {
    const res = performAutoSave(state, currentTimeMs)
    return { saved: res.success, check, retainedCount: res.retainedSlots.length }
  }

  return { saved: false, check }
}

/**
 * Saves WorldState to project directory (.starfront-saves/dev/) in DEV mode,
 * with automatic fallback to browser Auto-Save slots.
 */
export async function saveWorldStateToDevFile(
  state: WorldState,
  label: string = "dev_save"
): Promise<{
  success: boolean
  mode: "PROJECT_FILE" | "BROWSER_FALLBACK"
  filePath?: string
  checksum: string
  retainedFiles?: string[]
  message: string
}> {
  const autoSaveRes = performAutoSave(state)
  const checksum = autoSaveRes.slot?.checksum || calculateChecksum(JSON.stringify(state))

  // Browser environment: call Next.js API route /api/world/dev-save
  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/api/world/dev-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, label }),
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return {
            success: true,
            mode: "PROJECT_FILE",
            filePath: data.filePath,
            checksum: data.checksum || checksum,
            retainedFiles: data.retainedFiles,
            message: data.message || `Đã lưu file DEV tại ${data.filePath}`,
          }
        }
      }
    } catch {
      // Fallback to browser localStorage seamlessly
    }

    return {
      success: autoSaveRes.success,
      mode: "BROWSER_FALLBACK",
      checksum,
      message: "Đã lưu vào bộ nhớ trình duyệt (Fallback an toàn khi API File DEV không phản hồi).",
    }
  }

  // Node.js / Server / Test environment: write directly to .starfront-saves/dev/
  try {
    const fs = await import("fs")
    const path = await import("path")
    const saveDir = path.join(process.cwd(), ".starfront-saves", "dev")
    fs.mkdirSync(saveDir, { recursive: true })

    const tick = state.totalDaysElapsed ?? state.currentDay ?? 1
    const currentDay = state.currentDay ?? 1
    const timestamp = Date.now()
    const envelope: WorldSaveEnvelope = {
      schemaVersion: 1,
      timestamp,
      checksum,
      data: state,
    }
    const payload = JSON.stringify(
      {
        label,
        tick,
        currentDay,
        savedAt: new Date(timestamp).toISOString(),
        ...envelope,
      },
      null,
      2
    )

    const slotFilename = `autosave_day_${currentDay}_tick_${tick}_${timestamp}.json`
    const slotFilePath = path.join(saveDir, slotFilename)
    const latestFilePath = path.join(saveDir, "latest_dev_save.json")

    fs.writeFileSync(slotFilePath, payload, "utf-8")
    fs.writeFileSync(latestFilePath, payload, "utf-8")

    // Prune to keep at most 3 valid autosave_*.json files in .starfront-saves/dev/
    const files = fs
      .readdirSync(saveDir)
      .filter((f) => f.startsWith("autosave_") && f.endsWith(".json"))
      .map((f) => {
        const full = path.join(saveDir, f)
        try {
          const content = JSON.parse(fs.readFileSync(full, "utf-8"))
          const isValid =
            content &&
            content.data &&
            validateWorldStateStructure(content.data) &&
            calculateChecksum(JSON.stringify(content.data)) === content.checksum
          return {
            name: f,
            full,
            isValid,
            tick: content?.tick ?? 0,
            timestamp: content?.timestamp ?? 0,
          }
        } catch {
          return { name: f, full, isValid: false, tick: -1, timestamp: -1 }
        }
      })

    const validFiles = files
      .filter((f) => f.isValid)
      .sort((a, b) => (b.tick !== a.tick ? b.tick - a.tick : b.timestamp - a.timestamp))

    const retainedNames = new Set(validFiles.slice(0, MAX_VALID_AUTOSAVE_SLOTS).map((f) => f.name))
    for (const f of files) {
      if (f.isValid && !retainedNames.has(f.name)) {
        try {
          fs.unlinkSync(f.full)
        } catch {
          // Ignore
        }
      }
    }

    return {
      success: true,
      mode: "PROJECT_FILE",
      filePath: `.starfront-saves/dev/${slotFilename}`,
      checksum,
      retainedFiles: Array.from(retainedNames),
      message: `Đã lưu File DEV thành công vào .starfront-saves/dev/${slotFilename}`,
    }
  } catch {
    return {
      success: autoSaveRes.success,
      mode: "BROWSER_FALLBACK",
      checksum,
      message: "Đã lưu vào bộ nhớ Auto-Save nội bộ.",
    }
  }
}

/**
 * Loads WorldState from project directory (.starfront-saves/dev/) in DEV mode,
 * automatically falling back to the newest valid file if latest_dev_save.json is corrupted.
 */
export async function loadWorldStateFromDevFile(): Promise<{
  success: boolean
  state: WorldState | null
  sourceFile?: string
  recoveredFromFallback: boolean
  message: string
}> {
  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/api/world/dev-save", { method: "GET" })
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.state && validateWorldStateStructure(data.state)) {
          return {
            success: true,
            state: data.state,
            sourceFile: data.sourceFile,
            recoveredFromFallback: Boolean(data.recoveredFromFallback),
            message: data.message || `Đã nạp File DEV từ ${data.sourceFile}`,
          }
        }
      }
    } catch {
      // Fallback to local auto-save recovery below
    }

    const fallback = recoverFromLatestValidAutoSave()
    return {
      success: fallback.recovered,
      state: fallback.state,
      sourceFile: fallback.slot?.slotId,
      recoveredFromFallback: true,
      message: fallback.recovered
        ? `Đã khôi phục từ bản Auto-Save trình duyệt (${fallback.slot?.slotId})`
        : "Không tìm thấy bản lưu DEV hoặc Auto-Save hợp lệ.",
    }
  }

  // Node.js / Server / Test environment: read from .starfront-saves/dev/
  try {
    const fs = await import("fs")
    const path = await import("path")
    const saveDir = path.join(process.cwd(), ".starfront-saves", "dev")
    if (!fs.existsSync(saveDir)) {
      const fallback = recoverFromLatestValidAutoSave()
      return {
        success: fallback.recovered,
        state: fallback.state,
        recoveredFromFallback: true,
        message: fallback.recovered ? "Khôi phục từ bộ nhớ Auto-Save." : "Thư mục .starfront-saves/dev chưa tồn tại.",
      }
    }

    const latestPath = path.join(saveDir, "latest_dev_save.json")
    if (fs.existsSync(latestPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(latestPath, "utf-8"))
        if (
          parsed &&
          parsed.data &&
          validateWorldStateStructure(parsed.data) &&
          calculateChecksum(JSON.stringify(parsed.data)) === parsed.checksum
        ) {
          return {
            success: true,
            state: parsed.data,
            sourceFile: ".starfront-saves/dev/latest_dev_save.json",
            recoveredFromFallback: false,
            message: "Đã nạp thành công từ .starfront-saves/dev/latest_dev_save.json",
          }
        }
      } catch {
        // Proceed to fallback scan of rotating autosave_*.json files
      }
    }

    const candidates = fs
      .readdirSync(saveDir)
      .filter((f) => f.startsWith("autosave_") && f.endsWith(".json"))
      .map((f) => {
        const full = path.join(saveDir, f)
        try {
          const parsed = JSON.parse(fs.readFileSync(full, "utf-8"))
          const isValid =
            parsed &&
            parsed.data &&
            validateWorldStateStructure(parsed.data) &&
            calculateChecksum(JSON.stringify(parsed.data)) === parsed.checksum
          return {
            name: f,
            isValid,
            tick: parsed?.tick ?? 0,
            timestamp: parsed?.timestamp ?? 0,
            data: parsed?.data as WorldState,
          }
        } catch {
          return { name: f, isValid: false, tick: -1, timestamp: -1, data: null }
        }
      })
      .filter((c) => c.isValid && c.data !== null)
      .sort((a, b) => (b.tick !== a.tick ? b.tick - a.tick : b.timestamp - a.timestamp))

    if (candidates.length > 0) {
      return {
        success: true,
        state: candidates[0].data,
        sourceFile: `.starfront-saves/dev/${candidates[0].name}`,
        recoveredFromFallback: true,
        message: `Bản lưu mới nhất gặp lỗi; đã tự động khôi phục từ .starfront-saves/dev/${candidates[0].name}`,
      }
    }
  } catch {
    // Ignore
  }

  const memFallback = recoverFromLatestValidAutoSave()
  return {
    success: memFallback.recovered,
    state: memFallback.state,
    sourceFile: memFallback.slot?.slotId,
    recoveredFromFallback: true,
    message: memFallback.recovered ? "Đã khôi phục từ Auto-Save nội bộ." : "Không có bản lưu hợp lệ.",
  }
}
