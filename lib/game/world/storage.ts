import {
  INITIAL_WORLD_ROUTES,
  INITIAL_WORLD_SECTORS,
  createInitialWorldState,
  createResetWorldState,
} from "./initial-state"
import {
  DEFAULT_THREAT_CONFIG,
  isHeadquartersSector,
} from "./threat-engine"
import { DEFAULT_SURVIVAL_CONFIG } from "./pilot-survival-engine"
import {
  DEFAULT_WORLD_GENERATION_CONFIG,
  CANONICAL_30_WORLD_SECTORS,
  CANONICAL_30_WORLD_ROUTES,
  getDefaultDockingPortsForBase,
  generate30NodeWorld,
} from "./base"
import type {
  BackupMetadata,
  BackupSlot,
  LoadWorldResult,
  SaveWorldResult,
  WorldSaveEnvelope,
  WorldState,
  WorldRoute,
} from "./types"

/**
 * Các khóa lưu trữ độc lập của STARFRONT WORLD (Cách ly 100% khỏi STARFRONT_SAVE_DATA_V4)
 */
export const WORLD_STORAGE_KEY_V1 = "STARFRONT_WORLD_SAVE_V1"
export const WORLD_BACKUP_KEY_A = "STARFRONT_WORLD_BACKUP_A"
export const WORLD_BACKUP_KEY_B = "STARFRONT_WORLD_BACKUP_B"
export const WORLD_BACKUP_META_KEY = "STARFRONT_WORLD_BACKUP_META"
export const WORLD_STAGING_KEY = "STARFRONT_WORLD_STAGING"
export const WORLD_BACKUP_PRE_RESET_KEY = "STARFRONT_WORLD_BACKUP_PRE_RESET"

// Bảng tra cứu CRC32 chuẩn 0xEDB88320
const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c >>> 0
  }
  return table
})()

/**
 * Tính mã băm CRC32 (8 ký tự hex) bảo đảm tính toàn vẹn dữ liệu
 */
export function calculateChecksum(input: string): string {
  let crc = 0 ^ -1
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i)
    if (code < 0x80) {
      crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ code) & 0xff]
    } else if (code < 0x800) {
      crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ (0xc0 | (code >>> 6))) & 0xff]
      crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ (0x80 | (code & 0x3f))) & 0xff]
    } else {
      crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ (0xe0 | (code >>> 12))) & 0xff]
      crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ (0x80 | ((code >>> 6) & 0x3f))) & 0xff]
      crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ (0x80 | (code & 0x3f))) & 0xff]
    }
  }
  return ((crc ^ -1) >>> 0).toString(16).padStart(8, "0")
}

/**
 * Kiểm tra tính hợp lệ cấu trúc của đối tượng WorldState
 */
export function validateWorldStateStructure(state: any): boolean {
  if (!state || typeof state !== "object") return false
  if (state.version !== 1) return false
  if (typeof state.currentDay !== "number" || state.currentDay < 1) return false
  if (!state.sectors || typeof state.sectors !== "object") return false
  if (!Array.isArray(state.routes)) return false
  if (!state.factions || typeof state.factions !== "object") return false

  // Kiểm tra 4 tài nguyên chiến lược + LƯƠNG THỰC (Food) bắt buộc phải có mặt
  if (!state.resources || typeof state.resources !== "object") return false
  const res = state.resources
  if (
    typeof res.industrialMaterials !== "number" ||
    typeof res.energy !== "number" ||
    typeof res.logisticsSupplies !== "number" ||
    typeof res.tacticalData !== "number" ||
    typeof res.food !== "number"
  ) {
    return false
  }

  // Kiểm tra quân sự
  if (!state.military || typeof state.military !== "object") return false
  const mil = state.military
  if (
    typeof mil.deployed !== "number" ||
    typeof mil.reserves !== "number" ||
    typeof mil.woundedOrRepair !== "number" ||
    typeof mil.retreating !== "number" ||
    typeof mil.casualties !== "number"
  ) {
    return false
  }

  // Kiểm tra nhân khẩu học
  if (!state.demographics || typeof state.demographics !== "object") return false
  const demo = state.demographics
  if (
    typeof demo.nationalTotalPopulation !== "number" ||
    typeof demo.controlledTerritoryPopulation !== "number"
  ) {
    return false
  }

  return true
}

/**
 * Xác thực chuỗi JSON của một envelope lưu trữ
 */
export function parseAndValidateEnvelope(rawJson: string | null): {
  valid: boolean
  envelope: WorldSaveEnvelope | null
  error?: string
} {
  if (!rawJson || typeof rawJson !== "string") {
    return { valid: false, envelope: null, error: "Empty or non-string payload" }
  }

  try {
    const parsed = JSON.parse(rawJson)
    if (!parsed || typeof parsed !== "object") {
      return { valid: false, envelope: null, error: "Payload is not a valid JSON object" }
    }

    if (parsed.schemaVersion !== 1) {
      return { valid: false, envelope: null, error: `Unsupported schema version: ${parsed.schemaVersion}` }
    }

    if (typeof parsed.timestamp !== "number" || !parsed.checksum || !parsed.data) {
      return { valid: false, envelope: null, error: "Missing envelope metadata (timestamp/checksum/data)" }
    }

    // Xác minh mã băm tính toán so với checksum ghi trong envelope
    const serializedData = JSON.stringify(parsed.data)
    const expectedChecksum = calculateChecksum(serializedData)
    if (parsed.checksum !== expectedChecksum) {
      return {
        valid: false,
        envelope: null,
        error: `Checksum mismatch: expected ${expectedChecksum}, got ${parsed.checksum}`,
      }
    }

    // Xác minh cấu trúc WorldState bên trong
    if (!validateWorldStateStructure(parsed.data)) {
      return { valid: false, envelope: null, error: "Inner WorldState failed structural validation" }
    }

    return { valid: true, envelope: parsed }
  } catch (err: any) {
    return { valid: false, envelope: null, error: `JSON parse error: ${err?.message || "Unknown error"}` }
  }
}

/**
 * Đọc siêu dữ liệu quản lý xoay vòng backup
 */
export function getBackupMetadata(): BackupMetadata {
  const defaultMeta: BackupMetadata = {
    lastWrittenSlot: null,
    slotATimestamp: null,
    slotAChecksum: null,
    slotBTimestamp: null,
    slotBChecksum: null,
    rotationCount: 0,
  }

  if (typeof window === "undefined") return defaultMeta

  try {
    const raw = localStorage.getItem(WORLD_BACKUP_META_KEY)
    if (!raw) return defaultMeta
    const parsed = JSON.parse(raw)
    return {
      lastWrittenSlot: parsed.lastWrittenSlot === "A" || parsed.lastWrittenSlot === "B" ? parsed.lastWrittenSlot : null,
      slotATimestamp: typeof parsed.slotATimestamp === "number" ? parsed.slotATimestamp : null,
      slotAChecksum: typeof parsed.slotAChecksum === "string" ? parsed.slotAChecksum : null,
      slotBTimestamp: typeof parsed.slotBTimestamp === "number" ? parsed.slotBTimestamp : null,
      slotBChecksum: typeof parsed.slotBChecksum === "string" ? parsed.slotBChecksum : null,
      rotationCount: typeof parsed.rotationCount === "number" ? parsed.rotationCount : 0,
    }
  } catch {
    return defaultMeta
  }
}

/**
 * Lưu siêu dữ liệu quản lý xoay vòng backup
 */
function saveBackupMetadata(meta: BackupMetadata): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(WORLD_BACKUP_META_KEY, JSON.stringify(meta))
  } catch (err) {
    console.error("[STARFRONT WORLD] Lỗi khi lưu backup metadata:", err)
  }
}

let lastSaveTimestamp = 0
function getMonotonicTimestamp(): number {
  const now = typeof Date !== "undefined" ? Date.now() : 1773000000000
  lastSaveTimestamp = Math.max(now, lastSaveTimestamp + 1)
  return lastSaveTimestamp
}

/**
 * Lưu trạng thái World State với cơ chế Staging nguyên tử và Sao lưu luân phiên Slot A/B
 */
export function saveWorldState(state: WorldState): SaveWorldResult {
  if (typeof window === "undefined") {
    return { success: false, checksum: "", backupRotated: null, message: "Window undefined (SSR)", error: "No window" }
  }

  // 1. Kiểm tra tính toàn vẹn cấu trúc của dữ liệu
  if (!validateWorldStateStructure(state)) {
    return {
      success: false,
      checksum: "",
      backupRotated: null,
      message: "Dữ liệu WorldState không hợp lệ",
      error: "Validation failed: Invalid WorldState structure",
    }
  }

  try {
    // 2. Chuẩn bị envelope và tính toán checksum với timestamp đơn điệu (monotonic)
    const serializedData = JSON.stringify(state)
    const checksum = calculateChecksum(serializedData)
    const now = getMonotonicTimestamp()

    const envelope: WorldSaveEnvelope = {
      schemaVersion: 1,
      timestamp: now,
      checksum,
      data: state,
    }
    const envelopeJson = JSON.stringify(envelope)

    // 3. Ghi vào slot tạm (Staging) và kiểm tra lại tính hợp lệ
    localStorage.setItem(WORLD_STAGING_KEY, envelopeJson)
    const readStaging = localStorage.getItem(WORLD_STAGING_KEY)
    const stagingCheck = parseAndValidateEnvelope(readStaging)
    if (!stagingCheck.valid) {
      localStorage.removeItem(WORLD_STAGING_KEY)
      return {
        success: false,
        checksum: "",
        backupRotated: null,
        message: "Ghi dữ liệu vào Staging thất bại",
        error: stagingCheck.error,
      }
    }

    // 4. Nếu bản lưu chính hiện tại đã tồn tại và hợp lệ, xoay vòng lưu vào Backup Slot A hoặc B
    const currentPrimary = localStorage.getItem(WORLD_STORAGE_KEY_V1)
    let backupRotated: BackupSlot | null = null

    if (currentPrimary) {
      const primaryValidation = parseAndValidateEnvelope(currentPrimary)
      if (primaryValidation.valid && primaryValidation.envelope) {
        const meta = getBackupMetadata()
        // Luân phiên: Nếu lần trước ghi vào A thì lần này ghi vào B, ngược lại ghi vào A
        const targetSlot: BackupSlot = meta.lastWrittenSlot === "A" ? "B" : "A"
        const targetKey = targetSlot === "A" ? WORLD_BACKUP_KEY_A : WORLD_BACKUP_KEY_B

        localStorage.setItem(targetKey, currentPrimary)
        backupRotated = targetSlot

        // Cập nhật metadata
        meta.lastWrittenSlot = targetSlot
        meta.rotationCount += 1
        if (targetSlot === "A") {
          meta.slotATimestamp = primaryValidation.envelope.timestamp
          meta.slotAChecksum = primaryValidation.envelope.checksum
        } else {
          meta.slotBTimestamp = primaryValidation.envelope.timestamp
          meta.slotBChecksum = primaryValidation.envelope.checksum
        }
        saveBackupMetadata(meta)
      }
    }

    // 5. Xác nhận ghi đè vào Khóa Chính (Atomic Commit) và dọn Staging
    localStorage.setItem(WORLD_STORAGE_KEY_V1, envelopeJson)
    localStorage.removeItem(WORLD_STAGING_KEY)

    return {
      success: true,
      checksum,
      backupRotated,
      message: `Đã lưu World State thành công (Checksum: ${checksum}${backupRotated ? `, Backup Slot: ${backupRotated}` : ""})`,
    }
  } catch (error: any) {
    console.error("[STARFRONT WORLD] Lỗi nghiêm trọng khi lưu World State:", error)
    return {
      success: false,
      checksum: "",
      backupRotated: null,
      message: "Lỗi hệ thống khi lưu World State",
      error: error?.message || "Storage write error",
    }
  }
}

/**
 * Phase 6.28: Tự động nâng cấp bản lưu cũ (8 sector) lên mạng lưới 10 sector & 16 routes
 * - Bổ sung 2 sector mới nếu còn thiếu mà KHÔNG làm thay đổi bất kỳ trạng thái nào của 8 sector cũ.
 * - Bổ sung các tuyến đường mới kết nối tới 2 sector mới nếu chưa có.
 * - Cập nhật danh sách controlledSectorIds của phe VSS nếu sector thuộc VSS.
 */
export function migrateWorldStateTo10Sectors(state: WorldState): { state: WorldState; migrated: boolean } {
  if (!state || !state.sectors) return { state, migrated: false }
  let migrated = false

  // 1. Kiểm tra và bổ sung sector mới
  for (const [id, defSector] of Object.entries(INITIAL_WORLD_SECTORS)) {
    if (!state.sectors[id]) {
      migrated = true
      state.sectors[id] = {
        ...defSector,
        resources: { ...defSector.resources },
        threatHistory: [
          {
            day: state.currentDay || 1,
            threat: defSector.threatLevel,
          },
        ],
      }
      // Cập nhật phe kiểm soát nếu là VSS
      if (defSector.sovereignty === "vss" && state.factions?.vss) {
        if (!state.factions.vss.controlledSectorIds.includes(id)) {
          state.factions.vss.controlledSectorIds.push(id)
        }
      }
    }
  }

  // 2. Kiểm tra và bổ sung các tuyến đường mới
  if (!Array.isArray(state.routes)) {
    state.routes = []
  }
  const existingRouteIds = new Set(state.routes.map((r) => r.id))
  for (const defRoute of INITIAL_WORLD_ROUTES) {
    if (!existingRouteIds.has(defRoute.id)) {
      migrated = true
      state.routes.push({ ...defRoute })
      existingRouteIds.add(defRoute.id)
    }
  }

  return { state, migrated }
}

/**
 * Phase 6.33_FIX5: Tự động migrate và chuẩn hóa Threat Max (HQ = 100,000,000, Standard = 1,000,000)
 * - Tự động bổ sung threatConfig nếu save cũ chưa có.
 * - Nâng cấp các trần đe dọa cũ (<= 1000 hoặc missing/null) lên chuẩn mới:
 *   HQ (Sol Command HQ, Tartarus Breach, *_hq) -> 100,000,000
 *   Sector thường -> 1,000,000
 * - KHÔNG ghi đè cấu hình Admin custom nếu user đã chủ động tinh chỉnh (> 1000).
 * - Bảo tồn nguyên vẹn currentThreat nếu <= new max.
 */
export function migrateWorldThreatState(state: WorldState): boolean {
  if (!state || !state.sectors) return false
  let migrated = false

  // 1. Kiểm tra hoặc chuẩn hóa threatConfig
  if (!state.threatConfig) {
    state.threatConfig = {
      ...DEFAULT_THREAT_CONFIG,
      lastModified: Date.now(),
    }
    migrated = true
  } else {
    if (!state.threatConfig.maxThreatStandard || state.threatConfig.maxThreatStandard <= 1000) {
      state.threatConfig.maxThreatStandard = DEFAULT_THREAT_CONFIG.maxThreatStandard
      migrated = true
    }
    if (!state.threatConfig.maxThreatHQ || state.threatConfig.maxThreatHQ <= 1000) {
      state.threatConfig.maxThreatHQ = DEFAULT_THREAT_CONFIG.maxThreatHQ
      migrated = true
    }
    if (!state.threatConfig.hpPerThreatPoint) {
      state.threatConfig.hpPerThreatPoint = DEFAULT_THREAT_CONFIG.hpPerThreatPoint
      migrated = true
    }
    if (!state.threatConfig.winnerRatio) {
      state.threatConfig.winnerRatio = DEFAULT_THREAT_CONFIG.winnerRatio
      migrated = true
    }
  }

  // 2. Chuẩn hóa từng sector
  for (const [id, sec] of Object.entries(state.sectors)) {
    const isHq = isHeadquartersSector(sec)

    if (isHq && sec.classification !== "headquarters") {
      sec.classification = "headquarters"
      migrated = true
    } else if (!sec.classification) {
      sec.classification = "standard"
      migrated = true
    }

    // Nếu maxThreat chưa có, null, hoặc mang giá trị legacy <= 1000
    if (sec.maxThreat === undefined || sec.maxThreat === null || sec.maxThreat <= 1000) {
      sec.maxThreat = isHq
        ? state.threatConfig.maxThreatHQ
        : state.threatConfig.maxThreatStandard
      migrated = true
    }

    // Bảo tồn current threat, chỉ clamp nếu vượt quá maxThreat
    if (sec.threatLevel > sec.maxThreat) {
      sec.threatLevel = sec.maxThreat
      migrated = true
    }
  }

  return migrated
}

/**
 * Phase 6.34: Tự động khởi tạo và chuẩn hóa Sổ bộ Sinh tồn & Tù binh Phi công (Pilot Survival & Rescue)
 */
export function migratePilotSurvivalState(state: WorldState): boolean {
  if (!state) return false
  let migrated = false

  if (!state.survivalConfig) {
    state.survivalConfig = {
      ...DEFAULT_SURVIVAL_CONFIG,
      lastModified: Date.now(),
    }
    migrated = true
  }
  if (!state.pilotSurvivalRegistry) {
    state.pilotSurvivalRegistry = []
    migrated = true
  }
  if (!state.nationalPowRegistry) {
    state.nationalPowRegistry = []
    migrated = true
  }

  return migrated
}

/**
 * Phase 6.34A-FND-5 & FND-6: Tự động khởi tạo và chuẩn hóa Foundation State
 * (Decisions, InTransit, BasePopulation, Bases, OrbitalSubBases, ResetConfig, AutoSave)
 */
export function migrateFoundationState(state: WorldState): boolean {
  if (!state) return false
  let migrated = false

  if (!state.decisions) {
    state.decisions = { pendingDecisions: [], history: [] }
    migrated = true
  }
  if (!state.inTransitTransfers) {
    state.inTransitTransfers = []
    migrated = true
  }
  if (!state.basePopulationStates || Object.keys(state.basePopulationStates).length === 0) {
    const fresh = createInitialWorldState(state.worldSeed)
    state.basePopulationStates = fresh.basePopulationStates
    migrated = true
  }
  if (!state.bases || Object.keys(state.bases).length === 0) {
    const fresh = createInitialWorldState(state.worldSeed)
    state.bases = fresh.bases
    migrated = true
  }
  if (!state.orbitalSubBases) {
    state.orbitalSubBases = {}
    migrated = true
  }
  if (!state.worldGenerationConfig) {
    state.worldGenerationConfig = { ...DEFAULT_WORLD_GENERATION_CONFIG }
    migrated = true
  }
  if (state.lastAutoSaveGameDay === undefined) {
    state.lastAutoSaveGameDay = state.currentDay || 1
    migrated = true
  }
  if (state.lastAutoSaveTimestamp === undefined) {
    state.lastAutoSaveTimestamp = state.realTimeAnchor || Date.now()
    migrated = true
  }
  if (!state.worldResetConfig) {
    state.worldResetConfig = {
      cc0Name: "Liên minh VSS",
      commanderName: "Alviss",
      resetCount: 0,
      lastResetTimestamp: Date.now(),
    }
    migrated = true
  }

  // Ensure every base instance conforms to FND-6 contracts
  if (state.bases) {
    for (const [baseId, b] of Object.entries(state.bases)) {
      const ext = b as any
      if (!ext.entityKind) {
        ext.entityKind = "MAIN_BASE"
        migrated = true
      }
      if (!ext.hubSpecializations) {
        ext.hubSpecializations = []
        migrated = true
      }
      if (ext.maxHubSlots === undefined) {
        ext.maxHubSlots = ext.isCapital ? 8 : 4
        migrated = true
      }
      if (!ext.orbitalSubBaseIds) {
        ext.orbitalSubBaseIds = []
        migrated = true
      }
      if (ext.maxOrbitalSlots === undefined) {
        ext.maxOrbitalSlots = ext.isCapital ? 6 : 3
        migrated = true
      }
      if (!ext.fleetCapacities) {
        const defaultPorts = getDefaultDockingPortsForBase(b.baseType, b.baseType === "CAPITAL")
        ext.fleetCapacities = {
          fleetCommandCapacity: b.baseType === "CAPITAL" ? 6 : 3,
          fleetStationingCapacity: b.baseType === "CAPITAL" ? 8 : 4,
          fleetDockingCapacity: defaultPorts,
          baseDockingPorts: defaultPorts,
          expansionDockingPorts: 0,
          subBaseDockingPorts: 0,
        }
        migrated = true
      }
      if (!ext.governmentState) {
        ext.governmentState = {
          aiPersonality: "BALANCED",
          localPriorities: {
            foodSecurity: 80,
            militaryReadiness: 70,
            industrialOutput: 70,
            infrastructureGrowth: 70,
          },
          pendingSupportRequests: [],
          actionLogs: [`Khởi tạo chính quyền cơ sở cho căn cứ ${b.name}`],
        }
        migrated = true
      }
    }
  }

  return migrated
}

/**
 * Phase 6.34A-FND-6: Tự động nâng cấp Galaxy từ 10 Sector lên 30 Sector & 54 Tuyến đường
 * Bảo toàn 100% dữ liệu đã thay đổi của người chơi trên 10 Sector cũ.
 */
export function migrateWorldStateTo30Sectors(state: WorldState): { state: WorldState; migrated: boolean } {
  if (!state) return { state, migrated: false }

  const currentSectorCount = Object.keys(state.sectors || {}).length
  if (currentSectorCount >= 30) {
    return { state, migrated: false }
  }

  let migrated = false
  if (!state.sectors) state.sectors = {}

  // 1. Bổ sung các sector còn thiếu từ CANONICAL_30_WORLD_SECTORS
  for (const [id, defSector] of Object.entries(CANONICAL_30_WORLD_SECTORS)) {
    if (!state.sectors[id]) {
      state.sectors[id] = JSON.parse(JSON.stringify(defSector))
      migrated = true
    }
  }

  // 2. Chuẩn hóa 54 tuyến đường canonical, bảo tồn trạng thái (open/blocked) của người chơi
  const existingRouteMap = new Map((state.routes || []).map((r) => [r.id, r]))
  const existingEndpointsMap = new Map(
    (state.routes || []).map((r) => [`${r.fromSectorId}->${r.toSectorId}`, r])
  )

  const upgradedRoutes: WorldRoute[] = []
  for (const defRoute of CANONICAL_30_WORLD_ROUTES) {
    const existing =
      existingRouteMap.get(defRoute.id) ||
      existingEndpointsMap.get(`${defRoute.fromSectorId}->${defRoute.toSectorId}`) ||
      existingEndpointsMap.get(`${defRoute.toSectorId}->${defRoute.fromSectorId}`)
    if (existing) {
      upgradedRoutes.push({
        ...defRoute,
        state: existing.state,
      })
    } else {
      upgradedRoutes.push({ ...defRoute })
      migrated = true
    }
  }
  state.routes = upgradedRoutes

  // 3. Chuẩn hóa Foundation state & tạo bases/population cho các sector mới
  if (!state.bases) state.bases = {}
  if (!state.basePopulationStates) state.basePopulationStates = {}
  if (!state.orbitalSubBases) state.orbitalSubBases = {}

  // Chuẩn hóa và chuyển đổi các khóa cũ có tiền tố base_ (Phase 6.34A-FND-5) sang canonical sector ID (FND-6)
  const legacyBaseKeys = Object.keys(state.bases).filter((k) => k.startsWith("base_"))
  for (const lk of legacyBaseKeys) {
    const secId = lk.replace(/^base_/, "")
    if (CANONICAL_30_WORLD_SECTORS[secId]) {
      if (!state.bases[secId]) {
        state.bases[secId] = {
          ...state.bases[lk],
          baseId: secId,
        }
      }
      delete state.bases[lk]
      migrated = true
    }
  }

  const legacyPopKeys = Object.keys(state.basePopulationStates).filter((k) => k.startsWith("base_"))
  for (const lk of legacyPopKeys) {
    const secId = lk.replace(/^base_/, "")
    if (CANONICAL_30_WORLD_SECTORS[secId]) {
      if (!state.basePopulationStates[secId]) {
        state.basePopulationStates[secId] = {
          ...state.basePopulationStates[lk],
          baseId: secId,
        }
      }
      delete state.basePopulationStates[lk]
      migrated = true
    }
  }

  const fresh30 = generate30NodeWorld(state.worldSeed || 77722211)

  for (const [baseId, freshBase] of Object.entries(fresh30.bases)) {
    if (!state.bases[baseId]) {
      state.bases[baseId] = JSON.parse(JSON.stringify(freshBase))
      migrated = true
    }
  }

  for (const [popId, freshPop] of Object.entries(fresh30.basePopulationStates)) {
    if (!state.basePopulationStates[popId]) {
      state.basePopulationStates[popId] = JSON.parse(JSON.stringify(freshPop))
      migrated = true
    }
  }

  for (const [subId, freshSub] of Object.entries(fresh30.orbitalSubBases || {})) {
    if (!state.orbitalSubBases[subId]) {
      state.orbitalSubBases[subId] = JSON.parse(JSON.stringify(freshSub))
      migrated = true
    }
  }

  if (state.worldGenerationConfig) {
    state.worldGenerationConfig.totalMainBaseNodes = 30
  }

  migrateFoundationState(state)

  return { state, migrated }
}

/**
 * Nạp trạng thái World State với cơ chế tự động phục hồi khi file chính bị hỏng (Auto-Rescue)
 */
export function loadWorldState(): LoadWorldResult {
  const defaultState = createInitialWorldState()

  if (typeof window === "undefined") {
    return {
      state: defaultState,
      status: "initialized_default",
      recoveredFromBackup: false,
      message: "Môi trường không có window; sử dụng trạng thái mặc định",
      checksumVerified: false,
    }
  }

  // 1. Kiểm tra khóa chính STARFRONT_WORLD_SAVE_V1
  const rawPrimary = localStorage.getItem(WORLD_STORAGE_KEY_V1)
  let primaryValidation = parseAndValidateEnvelope(rawPrimary)

  if (primaryValidation.valid && primaryValidation.envelope) {
    const loadedData = primaryValidation.envelope.data
    if (!loadedData.events) loadedData.events = {}
    if (!loadedData.missionChains) loadedData.missionChains = {}
    if (!loadedData.eventResultsArchive) loadedData.eventResultsArchive = []
    if (!loadedData.activeMissionChains) loadedData.activeMissionChains = []
    if (!loadedData.completedMissionChainIds) loadedData.completedMissionChainIds = []
    if (!loadedData.missionDispatches) loadedData.missionDispatches = {}
    if (loadedData.activePlayerMissionId === undefined) loadedData.activePlayerMissionId = null
    if (!loadedData.operationsArchiveConfig) {
      loadedData.operationsArchiveConfig = { eventArchiveQuota: 60, battleArchiveQuota: 40 }
    }

    // Phase 6.34A-FND-6: Tự động di chuyển lên 30 Sector & 54 Tuyến đường nếu là save cũ
    const migration = migrateWorldStateTo30Sectors(loadedData)
    const threatMigrated = migrateWorldThreatState(migration.state)
    const survivalMigrated = migratePilotSurvivalState(migration.state)
    const foundationMigrated = migrateFoundationState(migration.state)
    if (migration.migrated || threatMigrated || survivalMigrated || foundationMigrated) {
      saveWorldState(migration.state)
    }

    return {
      state: migration.state,
      status: "loaded_primary",
      recoveredFromBackup: false,
      message: `Nạp thành công bản lưu World chính (Checksum: ${primaryValidation.envelope.checksum})`,
      checksumVerified: true,
    }
  }

  // 2. Nếu file chính không tồn tại (lần đầu chơi) và không có backup nào
  const rawA = localStorage.getItem(WORLD_BACKUP_KEY_A)
  const rawB = localStorage.getItem(WORLD_BACKUP_KEY_B)

  if (!rawPrimary && !rawA && !rawB) {
    // Khởi tạo mới hoàn toàn và lưu vào primary
    saveWorldState(defaultState)
    return {
      state: defaultState,
      status: "initialized_default",
      recoveredFromBackup: false,
      message: "Khởi tạo mới trạng thái chiến lược STARFRONT WORLD",
      checksumVerified: true,
    }
  }

  // 3. Tự Động Phục Hồi (Auto-Rescue): Bản chính bị thiếu hoặc bị hỏng (Parse error/Checksum mismatch)
  console.warn(
    "[STARFRONT WORLD] Bản lưu chính bị hỏng hoặc thiếu:",
    primaryValidation.error,
    "— Đang kích hoạt quy trình tự phục hồi từ Backup Slot A/B...",
  )

  const validationA = parseAndValidateEnvelope(rawA)
  const validationB = parseAndValidateEnvelope(rawB)

  // Xác định ứng viên hợp lệ tốt nhất (ưu tiên timestamp mới nhất, tie-break qua lastWrittenSlot)
  let chosenBackup: { slot: BackupSlot; envelope: WorldSaveEnvelope } | null = null

  if (validationA.valid && validationA.envelope && validationB.valid && validationB.envelope) {
    if (validationA.envelope.timestamp > validationB.envelope.timestamp) {
      chosenBackup = { slot: "A", envelope: validationA.envelope }
    } else if (validationB.envelope.timestamp > validationA.envelope.timestamp) {
      chosenBackup = { slot: "B", envelope: validationB.envelope }
    } else {
      const meta = getBackupMetadata()
      const preferred = meta.lastWrittenSlot || "B"
      chosenBackup = preferred === "A"
        ? { slot: "A", envelope: validationA.envelope }
        : { slot: "B", envelope: validationB.envelope }
    }
  } else if (validationA.valid && validationA.envelope) {
    chosenBackup = { slot: "A", envelope: validationA.envelope }
  } else if (validationB.valid && validationB.envelope) {
    chosenBackup = { slot: "B", envelope: validationB.envelope }
  }

  if (chosenBackup) {
    // Phục hồi: Ghi đè bản backup này vào khóa chính để đưa hệ thống về trạng thái khỏe mạnh
    const restoredJson = JSON.stringify(chosenBackup.envelope)
    localStorage.setItem(WORLD_STORAGE_KEY_V1, restoredJson)

    const dateStr = new Date(chosenBackup.envelope.timestamp).toLocaleTimeString()
    const msg = `Phát hiện lỗi bản lưu chính (${primaryValidation.error || "Hư hại dữ liệu"}); đã tự động phục hồi từ Backup Slot ${chosenBackup.slot} (Lưu lúc ${dateStr})`
    console.warn(`[STARFRONT WORLD] ${msg}`)

    const backupData = chosenBackup.envelope.data
    if (!backupData.missionDispatches) backupData.missionDispatches = {}
    if (backupData.activePlayerMissionId === undefined) backupData.activePlayerMissionId = null
    if (!backupData.operationsArchiveConfig) {
      backupData.operationsArchiveConfig = { eventArchiveQuota: 60, battleArchiveQuota: 40 }
    }

    const migration = migrateWorldStateTo30Sectors(backupData)
    const threatMigrated = migrateWorldThreatState(migration.state)
    const survivalMigrated = migratePilotSurvivalState(migration.state)
    const foundationMigrated = migrateFoundationState(migration.state)
    if (migration.migrated || threatMigrated || survivalMigrated || foundationMigrated) {
      saveWorldState(migration.state)
    }
    return {
      state: migration.state,
      status: chosenBackup.slot === "A" ? "recovered_backup_a" : "recovered_backup_b",
      recoveredFromBackup: true,
      message: msg,
      checksumVerified: true,
    }
  }

  // 4. Cả bản chính và cả 2 bản backup đều bị hỏng nặng: Khởi tạo lại trạng thái mặc định an toàn
  console.error(
    "[STARFRONT WORLD] Lỗi nghiêm trọng: Cả bản lưu chính và toàn bộ bản sao lưu đều bị hỏng. Đang tạo lại trạng thái mặc định...",
  )
  saveWorldState(defaultState)
  return {
    state: defaultState,
    status: "initialized_default",
    recoveredFromBackup: false,
    message: "Cảnh báo: Dữ liệu chiến lược và bản sao lưu bị hỏng nặng; đã khởi tạo lại trạng thái mặc định an toàn",
    checksumVerified: true,
  }
}

/**
 * Tạo bản sao lưu dự phòng STARFRONT_WORLD_BACKUP_PRE_RESET trước bất kỳ thao tác Reset hoặc Tái tạo Thiên Hà nào
 */
export function createPreResetBackup(previousState?: WorldState): boolean {
  if (typeof window === "undefined") return false
  try {
    const rawCurrent = localStorage.getItem(WORLD_STORAGE_KEY_V1)
    if (rawCurrent) {
      localStorage.setItem(WORLD_BACKUP_PRE_RESET_KEY, rawCurrent)
      return true
    } else if (previousState) {
      localStorage.setItem(
        WORLD_BACKUP_PRE_RESET_KEY,
        JSON.stringify({
          schemaVersion: 1,
          timestamp: Date.now(),
          checksum: calculateChecksum(JSON.stringify(previousState)),
          data: previousState,
        })
      )
      return true
    }
  } catch (e) {
    console.error("[STARFRONT WORLD] Lỗi khi tạo bản sao lưu pre-reset:", e)
  }
  return false
}

/**
 * Xóa sạch dữ liệu phân hệ WORLD và tạo mới 30 Node (Phase 6.34A-FND-6)
 * - Tự động tạo bản sao lưu bảo vệ STARFRONT_WORLD_BACKUP_PRE_RESET trước khi Reset.
 * - Bảo toàn nguyên vẹn Backup Slot A/B, Catalog Registry và RPG Save V4.
 * - Mặc định tạo Thiên hà 30 Node cân bằng thế lực phe phái theo chuẩn FND-6.
 */
export function resetWorldState(
  previousState?: WorldState,
  config?: { cc0Name?: string; commanderName?: string; totalNodes?: number }
): WorldState {
  if (typeof window !== "undefined") {
    // 1. Sao lưu bảo vệ dữ liệu WORLD hiện tại trước khi Reset
    createPreResetBackup(previousState)
    try {
      // Dọn staging cũ nhưng TUYỆT ĐỐI KHÔNG xóa Backup Slot A/B, Backup Meta hay Catalog
      localStorage.removeItem(WORLD_STAGING_KEY)
    } catch (e) {
      console.error("[STARFRONT WORLD] Lỗi dọn dẹp staging:", e)
    }
  }
  const fresh = createResetWorldState(previousState, {
    totalNodes: config?.totalNodes ?? 30,
    cc0Name: config?.cc0Name,
    commanderName: config?.commanderName,
  })
  saveWorldState(fresh)
  return fresh
}

/**
 * Kiểm tra xem dữ liệu World State hợp lệ đã có mặt trong localStorage hay chưa
 */
export function isWorldStatePresent(): boolean {
  if (typeof window === "undefined") return false
  const raw = localStorage.getItem(WORLD_STORAGE_KEY_V1)
  const check = parseAndValidateEnvelope(raw)
  return check.valid
}

/**
 * Hàm chẩn đoán trạng thái kho lưu trữ phục vụ dev và kiểm thử
 */
export function inspectWorldStorage(): {
  primaryValid: boolean
  backupAValid: boolean
  backupBValid: boolean
  metadata: BackupMetadata
} {
  if (typeof window === "undefined") {
    return {
      primaryValid: false,
      backupAValid: false,
      backupBValid: false,
      metadata: getBackupMetadata(),
    }
  }

  return {
    primaryValid: parseAndValidateEnvelope(localStorage.getItem(WORLD_STORAGE_KEY_V1)).valid,
    backupAValid: parseAndValidateEnvelope(localStorage.getItem(WORLD_BACKUP_KEY_A)).valid,
    backupBValid: parseAndValidateEnvelope(localStorage.getItem(WORLD_BACKUP_KEY_B)).valid,
    metadata: getBackupMetadata(),
  }
}
