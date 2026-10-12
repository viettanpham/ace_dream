import {
  INITIAL_WORLD_ROUTES,
  INITIAL_WORLD_SECTORS,
  createInitialWorldState,
} from "./initial-state"
import type {
  BackupMetadata,
  BackupSlot,
  LoadWorldResult,
  SaveWorldResult,
  WorldSaveEnvelope,
  WorldState,
} from "./types"

/**
 * Các khóa lưu trữ độc lập của STARFRONT WORLD (Cách ly 100% khỏi STARFRONT_SAVE_DATA_V4)
 */
export const WORLD_STORAGE_KEY_V1 = "STARFRONT_WORLD_SAVE_V1"
export const WORLD_BACKUP_KEY_A = "STARFRONT_WORLD_BACKUP_A"
export const WORLD_BACKUP_KEY_B = "STARFRONT_WORLD_BACKUP_B"
export const WORLD_BACKUP_META_KEY = "STARFRONT_WORLD_BACKUP_META"
export const WORLD_STAGING_KEY = "STARFRONT_WORLD_STAGING"

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

    // Phase 6.28: Tự động di chuyển lên 10 Sector & 16 Tuyến đường nếu là save cũ
    const migration = migrateWorldStateTo10Sectors(loadedData)
    if (migration.migrated) {
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

    const migration = migrateWorldStateTo10Sectors(chosenBackup.envelope.data)
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
 * Xóa sạch dữ liệu phân hệ WORLD (Chỉ xóa các khóa WORLD, KHÔNG ĐỘNG ĐẾN STARFRONT_SAVE_DATA_V4)
 */
export function resetWorldState(): WorldState {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(WORLD_STORAGE_KEY_V1)
      localStorage.removeItem(WORLD_BACKUP_KEY_A)
      localStorage.removeItem(WORLD_BACKUP_KEY_B)
      localStorage.removeItem(WORLD_BACKUP_META_KEY)
      localStorage.removeItem(WORLD_STAGING_KEY)
    } catch (e) {
      console.error("[STARFRONT WORLD] Lỗi khi reset dữ liệu World:", e)
    }
  }
  const fresh = createInitialWorldState()
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
