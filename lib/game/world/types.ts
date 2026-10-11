/**
 * STARFRONT WORLD — Types & Interfaces (Phase 6.1)
 * Định nghĩa cấu trúc dữ liệu nền tảng cho phân hệ chiến lược thiên hà STARFRONT WORLD
 */

export type FactionId = "vss" | "void" | string

export type SectorStage = "normal" | "threatened" | "under_siege" | "lost" | "recovery"

export type SectorSovereignty = "vss" | "void" | "contested" | "neutral"

export type RouteState = "open" | "hazardous" | "blocked" | "offline"

/**
 * Bốn nhóm tài nguyên chiến lược vĩ mô + LƯƠNG THỰC (Food) thiết yếu riêng biệt
 * (Lương thực không được gộp vào vật tư hậu cần theo quy chuẩn thiết kế A-I)
 */
export interface WorldResourceLedger {
  industrialMaterials: number // Vật liệu công nghiệp chế tạo & công sự
  energy: number              // Năng lượng (Plasma cells)
  logisticsSupplies: number   // Vật tư hậu cần (Đạn dược, phụ tùng quân sự)
  tacticalData: number        // Dữ liệu / Tình báo chiến thuật
  food: number                // Lương thực thiết yếu dân sinh (Tài nguyên riêng biệt)
}

/**
 * Sổ cái lực lượng quân sự bảo toàn quân số
 * Total = deployed + reserves + woundedOrRepair + retreating + casualties
 */
export interface MilitaryForceLedger {
  deployed: number            // Quân đang triển khai / đồn trú trực chiến
  reserves: number            // Quân dự bị chiến lược tại căn cứ
  woundedOrRepair: number     // Đang phục hồi y tế hoặc sửa chữa
  retreating: number          // Đang rút lui khỏi trận địa
  casualties: number          // Tổn thất vĩnh viễn tích lũy
}

/**
 * Ba năng lực chiến lược vĩ mô toàn thiên hà
 */
export interface StrategicCapacities {
  industry: number            // Tổng năng lực công nghiệp
  logistics: number           // Tổng thông lượng vận tải mạng lưới
  stability: number           // Chỉ số ổn định trung bình [0..100]
}

/**
 * Quản lý dân số quốc gia và dân số trong vùng kiểm soát
 */
export interface DemographicsState {
  nationalTotalPopulation: number       // Tổng dân số liên minh VSS
  controlledTerritoryPopulation: number // Dân số hiện trong các sector do VSS kiểm soát
  refugeesInTransit: number             // Dân sự đang sơ tán / di cư an toàn
  civilianCasualties: number            // Thương vong dân sự tích lũy
}

/**
 * Dữ liệu Sector chiến lược trên bản đồ
 */
export interface WorldSector {
  id: string
  name: string
  subtitle: string
  desc: string
  x: number // Tọa độ hiển thị X (0 - 100)
  y: number // Tọa độ hiển thị Y (0 - 100)
  sovereignty: SectorSovereignty
  threatLevel: number // Mức độ đe dọa [0..1000] (Độc lập với Sovereignty)
  stage: SectorStage  // Vòng đời 5 giai đoạn
  industryCapacity: number // Năng lực công nghiệp riêng của sector
  garrisonPower: number    // Sức mạnh lực lượng đồn trú
  resources: WorldResourceLedger
  population: number
  stability: number        // Chỉ số ổn định riêng của sector [0..100]
  lastSiegeDay?: number
}

/**
 * Tuyến siêu không gian kết nối giữa 2 sector (Cạnh đồ thị)
 */
export interface WorldRoute {
  id: string
  fromSectorId: string
  toSectorId: string
  distance: number    // Độ dài tuyến đường (số ngày hành quân chuẩn)
  state: RouteState   // open, hazardous, blocked, offline
  dangerLevel: number // Mức nguy hiểm [0..100]
}

/**
 * Cấu hình phe phái chiến lược
 */
export interface WorldFaction {
  id: FactionId
  name: string
  shortName: string
  color: string
  controlledSectorIds: string[]
  reputation?: number
  isAggressor?: boolean
}

/**
 * Giao dịch đang thực thi hoặc đã cam kết (Idempotency Journal)
 */
export interface InFlightTransaction {
  transactionId: string
  type: "combat" | "logistics_transfer" | "force_deployment" | "event_resolution"
  sectorId?: string
  payload?: any
  status: "pending" | "committed" | "aborted"
  createdAt: number
}

/**
 * Toàn bộ trạng thái của phân hệ STARFRONT WORLD (World State v1)
 */
export interface WorldState {
  version: 1
  worldSeed: number
  currentDay: number
  totalDaysElapsed: number
  realTimeAnchor: number // Unix timestamp của lần tick / lưu gần nhất
  lastTickTimestamp: number
  sectors: Record<string, WorldSector>
  routes: WorldRoute[]
  factions: Record<string, WorldFaction>
  resources: WorldResourceLedger
  military: MilitaryForceLedger
  demographics: DemographicsState
  activeMissionChains: string[]
  completedMissionChainIds: string[]
  committedTransactionIds: string[]
  inFlightTransactions: Record<string, InFlightTransaction>
  isSuspendedCombat: boolean
  suspendedEncounterId?: string
}

/**
 * Vỏ bọc lưu trữ an toàn có Checksum và Timestamp
 */
export interface WorldSaveEnvelope {
  schemaVersion: 1
  timestamp: number
  checksum: string
  data: WorldState
}

/**
 * Định danh Slot sao lưu luân phiên
 */
export type BackupSlot = "A" | "B"

/**
 * Siêu dữ liệu theo dõi chu kỳ luân phiên Backup A/B
 */
export interface BackupMetadata {
  lastWrittenSlot: BackupSlot | null
  slotATimestamp: number | null
  slotAChecksum: string | null
  slotBTimestamp: number | null
  slotBChecksum: string | null
  rotationCount: number
}

/**
 * Kết quả nạp dữ liệu World State
 */
export interface LoadWorldResult {
  state: WorldState
  status: "loaded_primary" | "recovered_backup_a" | "recovered_backup_b" | "initialized_default"
  recoveredFromBackup: boolean
  message: string
  checksumVerified: boolean
}

/**
 * Kết quả lưu dữ liệu World State
 */
export interface SaveWorldResult {
  success: boolean
  checksum: string
  backupRotated: BackupSlot | null
  message: string
  error?: string
}
