/**
 * STARFRONT WORLD — Types & Interfaces (Phase 6.1)
 * Định nghĩa cấu trúc dữ liệu nền tảng cho phân hệ chiến lược thiên hà STARFRONT WORLD
 */

export type FactionId = "vss" | "void" | string

import type {
  SurvivalConfig,
  PilotSurvivalRecord,
  CapturedPilotRecord,
  PilotSurvivalTier,
  PilotFinalStatus,
} from "./pilot-survival-types"
import type { DecisionEngineState } from "./decision/types"
import type { BasePopulationState, PopulationTransferRecord } from "./population/types"
import type { BaseEntityState } from "./building/types"
import type {
  ExtendedBaseEntityState,
  OrbitalSubBaseState,
  WorldGenerationConfig,
  NationalSupportRequest,
} from "./base/types"
import type { ShipInstance } from "./ship/types"

export type {
  SurvivalConfig,
  PilotSurvivalRecord,
  CapturedPilotRecord,
  PilotSurvivalTier,
  PilotFinalStatus,
  DecisionEngineState,
  BasePopulationState,
  PopulationTransferRecord,
  BaseEntityState,
  ExtendedBaseEntityState,
  OrbitalSubBaseState,
  WorldGenerationConfig,
  NationalSupportRequest,
  ShipInstance,
}

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
  threatLevel: number // Mức độ đe dọa [0..maxThreat] (Độc lập với Sovereignty)
  maxThreat?: number   // Mức đe dọa tối đa của Sector (Chuẩn hóa HQ 100,000,000 vs Sector thường 1,000,000 - Phase 6.33_FIX4)
  classification?: "headquarters" | "standard"
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
 * Ngữ cảnh trận chiến chuyển giao giữa STARFRONT WORLD và Đấu Trường (Combat Arena - Phase 6.23)
 */
export interface WorldBattleContext {
  source: "WORLD"
  transactionId: string
  encounterId: string
  sectorId: string
  sectorName: string
  snapshot: EncounterSnapshot
  resumedFromSuspended?: boolean
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
  winnerCurrentHp?: number
  winnerMaxHp?: number
  loserMaxHp?: number
  playerCurrentHp?: number
  playerMaxHp?: number
  enemyCurrentHp?: number
  enemyMaxHp?: number
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
    previousThreat?: number
    newThreat?: number
    maxThreat?: number
    stabilityChange: number
    garrisonCasualties: number
    garrisonWounded: number
    resourceRewards?: Partial<WorldResourceLedger>
    newSectorStage?: SectorStage
    sovereigntyTransferred?: boolean
  }
  message: string
  error?: string
  pilotSurvivalSummary?: {
    rescued: number
    captured: number
    kia: number
    unlockedRescueMissions?: string[]
  }
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
 * Nguồn gốc phê chuẩn chiến lược sự kiện (Phase 6.15)
 */
export type EventStrategySource = "system_auto" | "default_fallback" | "player_choice"

/**
 * Tùy chọn ưu tiên xử lý chiến lược theo từng Tier (Phase 6.15)
 */
export type TierStrategyPreference = "system_auto" | "default_fallback" | "player_choice"

/**
 * Cấu hình chính sách lựa chọn chiến lược sự kiện (Phase 6.15)
 */
export interface EventStrategyPolicyConfig {
  systemAutoEnabled: boolean
  defaultFallbackEnabled: boolean
  playerChoiceFallbackEnabled: boolean
  tierPolicies: {
    small: TierStrategyPreference
    medium: TierStrategyPreference
    large: TierStrategyPreference
  }
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
  /** Nguồn phê chuẩn phương án (Phase 6.15) */
  strategySource?: EventStrategySource
  /** Lý do lựa chọn (Phase 6.15) */
  selectionReason?: string
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
  /** Phân loại quy mô sự kiện (Phase 6.13) */
  tier?: "small" | "medium" | "large"
  /** Nguồn phê chuẩn phương án (Phase 6.15) */
  strategySource?: EventStrategySource
  /** Lý do lựa chọn ngắn gọn (Phase 6.15) */
  selectionReason?: string
  /** Lý do chuyển sang người chơi quyết định nếu tự động thất bại (Phase 6.15) */
  autoSelectionFailureReason?: string
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
 * ============================================================================
 * PHASE 6.31 — MISSION DISPATCH, OBJECTIVES & OPERATIONS ARCHIVE TYPES
 * ============================================================================
 */

export type MissionDispatchStatus = "PREPARE" | "PROCESSING" | "COMPLETED" | "FAILED" | "ABORTED"

export type MissionParticipantType = "player" | "npc"

export interface MissionParticipant {
  type: MissionParticipantType
  id: string
  name: string
  role: "commander" | "deputy" | "escort" | "specialist"
  joinedAtTick: number
  assignedGarrisonTroops?: number
}

export type MissionObjectiveCategory =
  | "patrol"
  | "escort"
  | "defend"
  | "raid"
  | "eliminate"
  | "threat_containment"

export interface MissionObjective {
  id: string
  category: MissionObjectiveCategory
  title: string
  description: string
  targetSectorId?: string
  targetValue?: number
  currentProgress?: number
  isCompleted?: boolean
  successCriteriaText: string
}

export type MissionTimelineEventType =
  | "created"
  | "participant_joined"
  | "participant_withdrawn"
  | "prepare_completed"
  | "npc_takeover"
  | "processing_started"
  | "objective_resolved"
  | "completed"
  | "failed"
  | "aborted"

export interface MissionTimelineEntry {
  id: string
  missionId: string
  tick: number
  timestamp: number
  type: MissionTimelineEventType
  title: string
  description: string
  actor: {
    type: "player" | "npc" | "system"
    name: string
  }
}

export interface MissionDispatch {
  id: string
  title: string
  description: string
  category: MissionObjectiveCategory
  sectorId: string
  status: MissionDispatchStatus
  createdAtTick: number
  prepareDeadlineTick: number
  processingStartedTick?: number
  processingCompletesTick?: number
  participant: MissionParticipant | null
  leaderType?: "player" | "npc"
  objective: MissionObjective
  assignedForces?: {
    garrisonTroops?: number
    pilotId?: string
  }
  actionTimeline: MissionTimelineEntry[]
  eventId?: string
  missionChainId?: string
  nodeId?: string
  isResolved?: boolean
  consequencesApplied?: boolean
  resultSummary?: string
}

export interface WorldThreatConfig {
  maxThreatStandard: number // default 1,000,000
  maxThreatHQ: number       // default 100,000,000
  hpPerThreatPoint: number  // default 100 (100 HP = 1 Threat Point)
  winnerRatio: number       // default 2
  threatFormulaMultiplier?: number // default 1.0 (legacy compatibility)
  lastModified?: number
}

export interface OperationsArchiveConfig {
  eventArchiveQuota: number
  battleArchiveQuota: number
}

export interface OperationsArchiveSummary {
  totalArchivedEvents: number
  unreadEventsCount: number
  totalArchivedBattles: number
  victoriousBattlesCount: number
  eventArchiveQuota: number
  battleArchiveQuota: number
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
  // Phase 6.13: Lịch sinh sự kiện tiếp theo theo ngày game
  nextEventSpawnDay?: {
    small: number
    medium: number
    large: number
  }
  // Phase 6.31: Mission Dispatch & Operations Archive
  missionDispatches?: Record<string, MissionDispatch>
  activePlayerMissionId?: string | null
  operationsArchiveConfig?: OperationsArchiveConfig
  // Phase 6.33_FIX4: Canonical HP-based Threat & Threat Configuration
  threatConfig?: WorldThreatConfig
  // Phase 6.34: Pilot Survival, Search-and-Rescue & National POW Registry
  survivalConfig?: SurvivalConfig
  pilotSurvivalRegistry?: PilotSurvivalRecord[]
  nationalPowRegistry?: CapturedPilotRecord[]
  // Phase 6.34A-FND-3: Shared Decision Engine State Persistence
  decisions?: DecisionEngineState
  // Phase 6.34A-FND-4: National InTransit Transfers & Base Population States
  inTransitTransfers?: PopulationTransferRecord[]
  basePopulationStates?: Record<string, BasePopulationState>
  // Phase 6.34A-FND-5 & FND-6: Base Entities (Buildings, Slots, Hubs, Government, Fleet Capacities)
  bases?: Record<string, ExtendedBaseEntityState | BaseEntityState>
  // Phase 6.34A-FND-6: Orbital Sub-Bases, Auto-Save & Generation Config
  orbitalSubBases?: Record<string, OrbitalSubBaseState>
  worldGenerationConfig?: WorldGenerationConfig
  nationalSupportRequests?: NationalSupportRequest[]
  lastAutoSaveGameDay?: number
  lastAutoSaveTimestamp?: number
  // Phase 7.2: Ship Entities (Individually addressable MK I..X Ships)
  ships?: Record<string, ShipInstance>
  // World Reset & Commander Identity Configuration
  worldResetConfig?: {
    cc0Name: string // Default: "Liên minh VSS"
    commanderName: string // Default: "Alviss"
    resetCount: number
    lastResetTimestamp: number
  }
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
