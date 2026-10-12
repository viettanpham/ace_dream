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
 * Lệnh chiến lược được giao cho đồn trú hoặc đạo quân
 */
export type StrategicOrder = "normal" | "defend" | "reinforce" | "attack" | "recover"

/**
 * Trạng thái quân lực theo sổ cái Authoritative Military Ledger
 */
export type ForceStatus =
  | "deployed"
  | "reserves"
  | "woundedOrRepair"
  | "retreating"
  | "casualties"
  | "in_transit"

/**
 * Đoàn quân đang điều chuyển hoặc hành quân trên tuyến đường
 */
export interface TroopDeployment {
  deploymentId: string
  transactionId: string
  factionId: FactionId
  fromSectorId: string
  toSectorId: string
  troopCount: number
  order: StrategicOrder
  path: string[]
  totalDistance: number
  remainingDays: number
  status: "in_transit" | "arrived" | "intercepted" | "cancelled"
  createdAt: number
}

/**
 * Điểm dữ liệu lịch sử mức đe dọa (Threat) theo ngày chiến lược
 */
export interface SectorThreatHistoryPoint {
  day: number
  threat: number
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
  foodShortageDays?: number
  strategicOrder?: StrategicOrder
  fortificationLevel?: number
  isLockedForCombat?: boolean
  lockedGarrisonPower?: number
  /** Lịch sử Threat tối đa 5 ngày gần nhất (Phase 6.12) */
  threatHistory?: SectorThreatHistoryPoint[]
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
 * Phiên bản cấu hình tích hợp chiến đấu
 * v1: Đấu trường 1v1 hiện tại (Người chơi vs Đơn vị tinh anh đại diện / Boss)
 * v2: Hỗ trợ nhiều làn tác chiến / hạm đội mở rộng
 */
export type CombatVersion = "v1" | "v2"

/**
 * Trạng thái của một giao dịch chiến lược trong Transaction Journal
 */
export type TransactionStatus =
  | "pending"          // Đang thực thi / chưa kết thúc
  | "awaiting_commit"  // Đã có kết quả, đang chờ xác nhận vào World State
  | "committed"        // Đã áp dụng thành công và vĩnh viễn vào World State
  | "needs_recovery"   // Bị ngắt quãng do reload/crash, cần khôi phục an toàn
  | "aborted"          // Đã hủy bỏ an toàn, không có hình phạt

/**
 * Bản chụp chiến thuật bất biến tại thời điểm khóa trận (Encounter Snapshot)
 */
export interface EncounterSnapshot {
  transactionId: string
  encounterId: string
  combatVersion: CombatVersion
  sectorId: string
  sectorName: string
  enemyEncounterType: string
  enemyUnit: {
    name: string
    hp: number
    maxHp: number
    attack: number
    defense: number
    speed: number
  }
  friendlyModifiers: {
    fortificationLevel: number
    defenseMultiplier: number
    moraleMultiplier: number
    strategicOrder?: StrategicOrder
  }
  lockedGarrison: number
  winConditions: {
    objective: "eliminate_enemy" | "survive_rounds" | "defend_garrison"
    maxRounds?: number
  }
  lockedAtTimestamp: number
  status: "locked" | "in_combat" | "resolved" | "aborted"
}

/**
 * Biên lai kết quả trận đấu do buồng lái hoặc Adapter xuất ra (Combat Result Receipt)
 */
export interface CombatResultReceipt {
  transactionId: string
  encounterId: string
  combatVersion: CombatVersion
  sectorId: string
  victory: boolean
  rounds: number
  playerRemainingHpPercent: number
  enemyRemainingHpPercent: number
  tacticalRating?: "S+" | "S" | "A" | "B" | "C"
  logSummary?: string
  completedAtTimestamp: number
}

/**
 * Kết quả áp dụng biên lai trận đấu vào World State
 */
export interface CombatResolutionResult {
  applied: boolean
  alreadyCommitted?: boolean
  transactionId: string
  encounterId?: string
  sectorId?: string
  victory?: boolean
  strategicConsequences?: {
    threatChange: number
    stabilityChange: number
    garrisonCasualties: number
    garrisonWounded: number
    resourceRewards?: Partial<WorldResourceLedger>
    newSectorStage?: SectorStage
    sovereigntyTransferred?: boolean
  }
  message: string
  error?: string
}

/**
 * Kết quả hủy bỏ an toàn trận đấu dở dang
 */
export interface AbortCombatResult {
  success: boolean
  transactionId: string
  sectorId?: string
  restoredGarrison: number
  message: string
  error?: string
}

/**
 * Bản ghi giao dịch trong sổ nhật ký giao dịch lũy đẳng (Transaction Journal Entry)
 */
export interface JournalEntry {
  transactionId: string
  type: "combat" | "logistics_transfer" | "force_deployment" | "event_resolution"
  status: TransactionStatus
  sectorId?: string
  snapshot?: EncounterSnapshot
  receipt?: CombatResultReceipt
  createdAt: number
  updatedAt: number
  committedAt?: number
  abortedAt?: number
  retryCount?: number
  error?: string
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
 * Lý do từ chối đăng ký sự kiện chiến lược
 */
export type EventRegistrationDenialReason =
  | "max_active_events_reached"
  | "duplicate_template_in_sector"
  | "duplicate_id"
  | "duplicate_galaxy_event"
  | "chain_already_has_active_event"

/**
 * Kết quả kiểm tra điều kiện đăng ký sự kiện (Concurrency Guard)
 */
export interface EventRegistrationCheckResult {
  allowed: boolean
  reason?: EventRegistrationDenialReason
  message?: string
}

/**
 * Trạng thái của sự kiện chiến lược theo vòng đời 3 pha
 */
export type EventStatus = "INIT" | "PROCESSING" | "RESULT" | "EXPIRED"

export type EventSeverity = "critical" | "warning" | "info"

export type EventCategory =
  | "crisis"
  | "diplomacy"
  | "military"
  | "anomaly"
  | "logistics"
  | "civil"
  | "intel"

export type EventScope = "sector" | "galaxy"

/**
 * Hậu quả chiến lược tác động lên World State
 */
export interface EventConsequence {
  resourceDelta?: Partial<WorldResourceLedger>
  militaryDelta?: {
    deployedDelta?: number
    reservesDelta?: number
    casualtiesDelta?: number
    woundedDelta?: number
  }
  stabilityDelta?: number
  threatDelta?: number
  populationDelta?: {
    civilianCasualties?: number
    refugees?: number
  }
  fortificationDelta?: number
  sectorId?: string
  newStrategicOrder?: StrategicOrder
  message: string
}

/**
 * Phương án / Chiến lược người chơi có thể lựa chọn cho sự kiện
 */
export interface EventStrategy {
  id: string
  name: string
  description: string
  cost?: Partial<WorldResourceLedger>
  militaryCost?: number
  processingTicks: number
  successChance?: number
  consequences: EventConsequence
  failureConsequences?: EventConsequence
  requiresCombat?: boolean
  encounterConfig?: {
    enemyPower?: number
    tier?: number
    name?: string
  }
  nextChainNodeId?: string
}

/**
 * Bản ghi kết quả sự kiện được lưu trữ bền vững (Event Result)
 */
export interface WorldEventResult {
  id: string
  eventId: string
  templateId: string
  title: string
  category: EventCategory
  severity: EventSeverity
  sectorId?: string
  status: "success" | "failure" | "expired_default" | "aborted"
  chosenStrategyId: string
  chosenStrategyName: string
  summaryText: string
  resolvedAtTick: number
  resolvedAtTimestamp: number
  resourceChanges?: Partial<WorldResourceLedger>
  stabilityChange?: number
  threatChange?: number
  casualties?: number
  isRead?: boolean
  missionChainId?: string
  nextNodeUnlocked?: string
}

/**
 * Thực thể Sự Kiện Chiến Lược trong STARFRONT WORLD (World Event)
 */
export interface WorldEvent {
  id: string
  templateId: string
  title: string
  description: string
  category: EventCategory
  severity: EventSeverity
  scope: EventScope
  sectorId?: string
  status: EventStatus
  priority: number
  createdAtTick: number
  createdAtTimestamp: number
  decisionDeadlineTick: number
  defaultStrategyId: string
  availableStrategies: EventStrategy[]
  chosenStrategyId?: string
  processingStartedTick?: number
  processingCompletesTick?: number
  isResolved: boolean
  consequencesApplied: boolean
  missionChainId?: string
  nodeId?: string
  encounterTransactionId?: string
  result?: WorldEventResult
}

/**
 * 6 Hình thái cấu trúc chuỗi nhiệm vụ chiến lược (Mission Topologies)
 */
export type MissionTopology =
  | "linear"
  | "branching"
  | "threshold"
  | "reactive"
  | "periodic"
  | "standalone"

/**
 * Một nút trong đồ thị chuỗi nhiệm vụ (Mission Chain Node)
 */
export interface MissionChainNode {
  id: string
  title: string
  description: string
  eventTemplateId: string
  status: "locked" | "active" | "completed" | "failed"
  sectorId?: string
  requiredPreviousNodeIds?: string[]
  branchChoiceId?: string
  thresholdCondition?: {
    metric: "threat" | "stability" | "food" | "reserves"
    sectorId?: string
    operator: ">=" | "<="
    value: number
  }
  reactiveCondition?: {
    triggerType: "sector_under_siege" | "sector_lost" | "starvation"
    sectorId?: string
  }
  nextBranchMap?: Record<string, string>
  rewardSummary?: string
  isPendingDispatch?: boolean
  pendingEvent?: WorldEvent
  deferredSinceTick?: number
  dispatchDeferredTicks?: number
}

/**
 * Chuỗi nhiệm vụ chiến lược toàn diện (Mission Chain)
 */
export interface MissionChain {
  id: string
  templateId: string
  title: string
  description: string
  topology: MissionTopology
  sectorId?: string
  status: "active" | "completed" | "failed"
  nodes: Record<string, MissionChainNode>
  currentNodeId: string
  startedAtTick: number
  completedAtTick?: number
  recurringIntervalTicks?: number
  lastRunTick?: number
  cooldownUntilTick?: number
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
  transactionJournal?: Record<string, JournalEntry>
  activeDeployments?: TroopDeployment[]
  isSuspendedCombat: boolean
  suspendedEncounterId?: string
  suspendedSnapshot?: EncounterSnapshot
  // Phase 6.7: Event Engine & Mission Chains
  events?: Record<string, WorldEvent>
  missionChains?: Record<string, MissionChain>
  eventResultsArchive?: WorldEventResult[]
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
