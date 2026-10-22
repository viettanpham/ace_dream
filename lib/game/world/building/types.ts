/**
 * STARFRONT WORLD — Building & Production Foundation (Phase 6.34A-FND-5)
 *
 * Domain-agnostic contracts for:
 * 1. Building Type -> Class -> Definition -> Instance architecture
 * 2. 19 Approved Building Types
 * 3. Shared Slot Profiles with Tier Growth & MAX TIER BONUS
 * 4. Building Operations (3-pass workforce, Building OFF, Commander Override, Condition/HP, Maintenance, Effects)
 * 5. Production & Storage Engine (Cycle-based, Input Reservation, Settlement, OUTPUT_BLOCKED)
 * 6. Construction & Demolition Queue
 * 7. History Retention & Compaction Policy
 */

import type { BaseType } from "../population/types"

/**
 * 19 Approved Building Types
 */
export type BuildingType =
  | "RESIDENTIAL"
  | "MEDICAL"
  | "AGRICULTURE"
  | "INDUSTRY"
  | "STORAGE"
  | "LOGISTICS"
  | "RESEARCH"
  | "FINANCE"
  | "ENTERTAINMENT"
  | "SUPPORT"
  | "COMMAND"
  | "DEFENSE"
  | "OFFENSE"
  | "MILITARY"
  | "SPACEPORT"
  | "ORBITAL_DEFENSE"
  | "GUILD"
  | "RESCUE"
  | "GENERIC"

/**
 * Building Classes defining architectural scale and role
 */
export type BuildingClass =
  | "LIGHT"
  | "MEDIUM"
  | "HEAVY"
  | "ORBITAL_OUTPOST"
  | "CORE_FACILITY"
  | "ADVANCED"

/**
 * Building Operational State
 */
export type BuildingOperationalState =
  | "ACTIVE"
  | "INACTIVE"
  | "DAMAGED"
  | "UPGRADING"
  | "OFFLINE"

/**
 * Maintenance Policy
 */
export type MaintenancePolicy = "AUTO" | "MANUAL" | "EMERGENCY" | "DISABLED"

/**
 * Effect Scope
 */
export type EffectScope = "SELF" | "BASE" | "NETWORK"

/**
 * Building Effect definition
 */
export interface BuildingEffect {
  id: string
  name: string
  scope: EffectScope
  targetMetric: string
  modifierType: "FLAT" | "PERCENT"
  value: number
  description?: string
  stackable?: boolean
}

/**
 * Slot Profile defining Typed and Generic slot growth across Tiers
 */
export interface SlotProfile {
  id: string
  name: string
  description?: string
  baseTypedSlots: Record<string, number>
  baseGenericSlots: number
  growthPerTierTyped?: Record<string, number>
  growthPerTierGeneric?: number
  // MAX TIER BONUS: applied once at Tier X (MK X)
  maxTierStepBonusTyped?: Record<string, number>
  maxTierStepBonusGeneric?: number
}

/**
 * Detachable Equipment Module or System Capability
 */
export interface BuildingModuleDefinition {
  id: string
  name: string
  slotType: string // "WEAPON", "DEFENSE", "PRODUCTION_LINE", "STORAGE_MODULE", "GENERIC"
  description: string
  isDetachable: boolean // true = Equipment Module, false = System Capability
  statModifiers?: Record<string, number>
  capabilities?: string[]
  powerConsumption?: number
}

/**
 * Master Building Definition (Catalog Entity)
 */
export interface BuildingDefinition {
  id: string
  name: string
  type: BuildingType
  class: BuildingClass
  description: string
  isCoreFacility?: boolean
  baseCost: Record<string, number>
  buildDurationGameDays: number
  maxHp: number
  initialCondition: number
  workforceDemands: {
    minimumPersonnel: number
    targetPersonnel: number
    maximumPersonnel: number
    priority: number
  }
  defaultMaintenancePolicy: MaintenancePolicy
  slotProfileRef?: string
  capabilities: string[]
  productionRecipeIds?: string[]
  storageCapacity?: Record<string, number>
  effects?: BuildingEffect[]
}

/**
 * Commander Override on Building Operations
 */
export interface CommanderBuildingOverride {
  isLocked?: boolean
  forcedPersonnel?: number
  isOffline?: boolean
  expiresAtGameDay?: number
  overrideReason?: string
  lastModifiedGameDay?: number
}

/**
 * Building Instance State (Runtime Entity)
 */
export interface BuildingInstance {
  instanceId: string
  baseId: string
  definitionId: string
  customName?: string
  currentLevel: number
  currentTier: number
  currentHp: number
  maxHp: number
  conditionHp: number
  operationalState: BuildingOperationalState
  isOffline: boolean // Building OFF flag
  assignedPersonnel: number
  operationalEfficiency: number // [0..1], separated from performance bonuses
  performanceBonusMultiplier: number // [1.0..], from modules, effects, etc.
  maintenancePolicy: MaintenancePolicy
  equippedModules: string[] // Module definition IDs
  maxTierBonusApplied?: boolean // Idempotency flag preventing double application on reload
  localStorage?: Record<string, number>
  commanderOverride?: CommanderBuildingOverride
  reasonCodes?: string[]
}

/**
 * Production Recipe (Master Catalog Entity)
 */
export interface ProductionRecipe {
  id: string
  name: string
  description?: string
  inputs: Record<string, number>
  outputs: Record<string, number>
  cycleDays: number
  requiredCapability?: string
  efficiencyThreshold?: number // Minimum operationalEfficiency required to run (default 1.0)
}

/**
 * Production Line State on a Building Instance
 */
export interface ProductionLineState {
  lineId: string
  buildingInstanceId: string
  recipeId: string
  startedGameDay: number
  completesAtGameDay: number
  reservedInputs: Record<string, number>
  status: "PRODUCING" | "OUTPUT_BLOCKED" | "COMPLETED" | "PAUSED"
  batchCount?: number
}

/**
 * Construction or Upgrade Queue Item
 */
export interface ConstructionQueueItem {
  queueId: string
  baseId: string
  action: "BUILD" | "UPGRADE" | "DEMOLISH"
  buildingDefinitionId: string
  targetInstanceId?: string
  startedGameDay: number
  completesAtGameDay: number
  reservedCost: Record<string, number>
  status: "IN_PROGRESS" | "PAUSED" | "COMPLETED"
}

/**
 * Active Resource Reservation for zero double-spend
 */
export interface ResourceReservation {
  reservationId: string
  ownerRef: string
  purpose: "PRODUCTION_INPUT" | "CONSTRUCTION_COST" | "TRADE" | "MAINTENANCE"
  resources: Record<string, number>
  createdGameDay: number
}

/**
 * Base Entity State representing a Planetary Base or Orbital Sub-Base
 */
export interface BaseEntityState {
  baseId: string
  sectorId: string
  name: string
  baseType: BaseType
  tier: number
  maxTierBonusApplied?: boolean
  isOrbitalSubBase?: boolean
  parentBaseId?: string // If orbital sub-base
  coreBuildingIds: string[] // Core facilities do not occupy expansion slots
  expansionBuildingIds: string[]
  maxExpansionSlots: number
  slotProfileId: string
  sharedStorage: Record<string, number>
  storageCapacity: Record<string, number>
  buildings: Record<string, BuildingInstance>
  constructionQueue: ConstructionQueueItem[]
  productionLines: ProductionLineState[]
  activeReservations: ResourceReservation[]
}

/**
 * Shared History Retention Configuration
 */
export interface HistoryRetentionConfig {
  maxDetailedEvents: number // Maximum number of full event objects to retain
  preserveHeadEvents: number // Keep initial world setup events
  preserveTailEvents: number // Keep most recent events
  maxHistoryBytes: number // Maximum memory footprint for history
  pinnedEventTypes: string[] // Event types that must NEVER be compacted
  compactionPolicy: "SUMMARIZE_AND_PRUNE" | "PRUNE_OLDEST" | "NONE"
}

/**
 * Summary Event for compacted history
 */
export interface CompactedHistorySummary {
  periodStartGameDay: number
  periodEndGameDay: number
  totalEventsCompacted: number
  totalResourceDelta: Record<string, number>
  notableMilestones: string[]
}
