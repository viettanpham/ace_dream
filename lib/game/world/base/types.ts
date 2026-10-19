/**
 * STARFRONT WORLD — Base, Hub, Capital & Orbital Sub-Base Types (Phase 6.34A-FND-6)
 *
 * Implements architectural contracts for:
 * 1. Base Entity Kind: MAIN_BASE vs SUB_BASE
 * 2. 19 Base Types & Specialized Classes
 * 3. Orbital Sub-Base Network & Capital hosting capacity (MK I -> MK X: 2..12 slots)
 * 4. Core Facilities Complex with 2-8 default docking ports & zero double-counted capacity
 * 5. Independent Fleet Capacities (Command, Stationing, Docking)
 * 6. Local Government AI with Commander Override expiration & Support Requests
 * 7. Base Economy Forecasting (Production/Day, Consumption/Day, Net/Day, Days of Supply)
 * 8. 30-Sector World Generation & National Power Balancing Configuration
 */

import type { BaseType } from "../population/types"
import type { BaseEntityState, BuildingInstance, BuildingOperationalState } from "../building/types"
import type { BasePopulationState } from "../population/types"

/**
 * Base Entity Kind: Main Base vs Sub-Base
 */
export type BaseEntityKind = "MAIN_BASE" | "SUB_BASE"

/**
 * Orbital Sub-Base specialized types
 */
export type OrbitalSubBaseType =
  | "ORBITAL_STATION"
  | "DEFENSE_PLATFORM"
  | "MINING_RIG"
  | "RESEARCH_SANCTUARY"
  | "SHIPYARD_ANNEX"

/**
 * Strategic Role inside national territory
 */
export type StrategicRole = "CAPITAL" | "BORDER" | "INTERIOR" | "SPECIALIZED"

/**
 * Hub Specialization Status
 */
export type HubSpecializationStatus = "LOCKED" | "AVAILABLE" | "ACTIVE" | "SUSPENDED"

/**
 * 8 Approved Hub Specialization Types
 */
export type HubSpecializationType =
  | "COMMAND_HUB"
  | "LOGISTICS_HUB"
  | "TRANSPORT_HUB"
  | "MEDICAL_HUB"
  | "REPAIR_HUB"
  | "RESEARCH_HUB"
  | "INDUSTRIAL_HUB"
  | "FINANCIAL_HUB"

/**
 * Runtime state of a Hub Specialization slot on a base
 */
export interface HubSpecializationInstance {
  hubType: HubSpecializationType
  status: HubSpecializationStatus
  unlockedAtTier: number
  activatedGameDay?: number
  activeBonusPercent: number
  operationalRequirementsMet: boolean
  suspendedReason?: string
  requiredBuildingTypes: string[]
  requiredPersonnel: number
}

/**
 * Independent Fleet Capacities (Physical docking vs Command vs Stationing)
 */
export interface FleetCapacities {
  fleetCommandCapacity: number     // Số lượng Hạm đội có thể trực tiếp chỉ huy
  fleetStationingCapacity: number  // Sức chứa đồn trú hạm đội lâu dài
  fleetDockingCapacity: number     // Năng lực tiếp nhận & phục vụ bảo trì đồng thời
  baseDockingPorts: number         // 2-8 vị trí dock cơ bản từ Base Command Center
  expansionDockingPorts: number    // Vị trí dock bổ sung từ công trình chuyên dụng (Spaceport, Dockyard)
  subBaseDockingPorts: number      // Vị trí dock trên các Orbital Sub-Bases (tách biệt vật lý)
}

/**
 * Commander Override on Local Government
 */
export interface CommanderBaseOverride {
  isLocked: boolean
  overrideType: "PRIORITY_SHIFT" | "CONSTRUCTION_HALT" | "RESOURCE_EMBARGO" | "EMERGENCY_MOBILIZATION"
  expiresAtGameDay: number
  overrideReason: string
  parameters?: Record<string, any>
  createdAtGameDay: number
}

/**
 * National Support Request dispatched by Local Government AI
 */
export interface NationalSupportRequest {
  requestId: string
  baseId: string
  targetBaseId?: string
  requestType: "EMERGENCY_FOOD" | "ENERGY_DEFICIT" | "MILITARY_REINFORCEMENT" | "WORKFORCE_AID"
  amount: number
  resource?: string
  priority: "NORMAL" | "URGENT" | "CRITICAL"
  createdGameDay: number
  status: "PENDING" | "APPROVED" | "REJECTED" | "DISPATCHED"
  reason: string
}

/**
 * Local Government AI State
 */
export interface BaseGovernmentState {
  aiPersonality: "DEFENSIVE" | "BALANCED" | "EXPANSIONIST" | "INDUSTRIAL" | "LOGISTICAL"
  localPriorities: {
    foodSecurity: number       // 1-100
    militaryReadiness: number  // 1-100
    industrialOutput: number   // 1-100
    infrastructureGrowth: number // 1-100
  }
  commanderOverride?: CommanderBaseOverride
  pendingSupportRequests: NationalSupportRequest[]
  lastAutonomousActionGameDay?: number
  actionLogs: string[]
}

/**
 * Incoming Shipment Record for Economy Forecasting
 */
export interface IncomingShipmentRecord {
  shipmentId: string
  fromBaseId: string
  toBaseId: string
  resource: string
  amount: number
  etaGameDay: number
  remainingDays: number
  status: "IN_TRANSIT" | "DELIVERED"
}

/**
 * Resource Deficit Prediction
 */
export interface ResourceDeficitWarning {
  resource: string
  currentStock: number
  daysRemaining: number
  severity: "MILD" | "WARNING" | "CRITICAL"
  message: string
}

/**
 * Base Economy Forecast
 */
export interface BaseEconomyForecast {
  productionPerDay: Record<string, number>
  consumptionPerDay: Record<string, number>
  netPerDay: Record<string, number>
  daysOfSupply: Record<string, number>
  deficitsPredicted: ResourceDeficitWarning[]
  incomingShipments: IncomingShipmentRecord[]
  calculatedAtGameDay: number
}

/**
 * Orbital Sub-Base Entity State
 */
export interface OrbitalSubBaseState {
  subBaseId: string
  parentBaseId: string
  name: string
  subBaseType: OrbitalSubBaseType
  tier: number
  operationalState: BuildingOperationalState
  coreBuildingIds: string[]
  expansionBuildingIds: string[]
  maxExpansionSlots: number
  buildings: Record<string, BuildingInstance>
  dockingCapacity: number
  storageCapacity: Record<string, number>
  currentStorage: Record<string, number>
  crewAssigned: number
  crewRequired: number
  defenseRating: number
}

/**
 * Comprehensive FND-6 Base Entity State
 */
export interface ExtendedBaseEntityState extends BaseEntityState {
  entityKind: BaseEntityKind
  factionId: string
  isCapital: boolean
  strategicRole: StrategicRole
  nationalPowerScore: number
  nationalPowerSharePercent: number
  // Sub-base fields
  parentBaseId?: string
  subBaseType?: OrbitalSubBaseType
  orbitalSubBaseIds: string[]
  maxOrbitalSlots: number
  // Hubs
  hubSpecializations: HubSpecializationInstance[]
  maxHubSlots: number
  // Fleet capacities
  fleetCapacities: FleetCapacities
  // Local Government & Economy
  governmentState: BaseGovernmentState
  economyForecast?: BaseEconomyForecast
}

/**
 * System Configuration for World Generation
 */
export interface WorldGenerationConfig {
  totalMainBaseNodes: number                            // Mặc định: 30
  minimumFactionBaseSharePercent: number                // Mặc định: 20 (min 6 bases)
  maximumFactionPowerDifferencePercentagePoints: number // Mặc định: 10
  vssFactionId: string                                  // Mặc định: "vss"
  voidFactionId: string                                 // Mặc định: "void"
  vssCapitalSectorId: string                            // Mặc định: "sol_command_hq"
  voidCapitalSectorId: string                           // Mặc định: "tartarus_breach"
  vssCapitalName: string                                // Mặc định: "Liên minh VSS"
  commanderName: string                                 // Mặc định: "Alviss"
  enableSeededVariation: boolean                        // Mặc định: true
  capitalOrbitalSlotsTable: Record<number, number>      // MK I..X -> 2..12
  maxNonCapitalOrbitalSlots: number                     // Mặc định: 3
  autoSaveIntervalGameDays: number                      // Mặc định: 7
  autoSaveIntervalRealMinutes: number                   // Mặc định: 10
  vssBaseTargetCount?: number                           // Tùy chọn phân bổ số căn cứ VSS (VD: 15, 18, 21, 24)
  voidBaseTargetCount?: number                          // Tùy chọn phân bổ số căn cứ Void (VD: 15, 12, 9, 6)
}

/**
 * Standard Default World Generation Configuration
 */
export const DEFAULT_WORLD_GENERATION_CONFIG: WorldGenerationConfig = {
  totalMainBaseNodes: 30,
  minimumFactionBaseSharePercent: 20,
  maximumFactionPowerDifferencePercentagePoints: 10,
  vssFactionId: "vss",
  voidFactionId: "void",
  vssCapitalSectorId: "sol_command_hq",
  voidCapitalSectorId: "tartarus_breach",
  vssCapitalName: "Liên minh VSS",
  commanderName: "Alviss",
  enableSeededVariation: true,
  capitalOrbitalSlotsTable: {
    1: 2,
    2: 3,
    3: 4,
    4: 5,
    5: 6,
    6: 7,
    7: 8,
    8: 9,
    9: 10,
    10: 12, // 11 + 1 MAX TIER BONUS = 12
  },
  maxNonCapitalOrbitalSlots: 3,
  autoSaveIntervalGameDays: 7,
  autoSaveIntervalRealMinutes: 10,
}

/**
 * Canonical Default World Seed & Generation Configuration alias
 */
export const DEFAULT_WORLD_SEED_CONFIG: WorldGenerationConfig = DEFAULT_WORLD_GENERATION_CONFIG

/**
 * Stepper Steps for 7-Step World Reset Preview
 */
export type WorldResetStep = 1 | 2 | 3 | 4 | 5 | 6 | 7

/**
 * Result of 7-Step World Generation Preview
 */
export interface WorldResetPreviewResult {
  step: WorldResetStep
  isValid: boolean
  worldSeed: number
  totalNodes: number
  factionDistribution: {
    vss: { baseCount: number; baseSharePercent: number; totalPower: number; powerPercent: number }
    void: { baseCount: number; baseSharePercent: number; totalPower: number; powerPercent: number }
    powerDifferencePercentagePoints: number
  }
  capitals: {
    vss: { sectorId: string; name: string; powerShare: number; isBackline: boolean }
    void: { sectorId: string; name: string; powerShare: number; isBackline: boolean }
  }
  validationErrors: string[]
  previewSummary: {
    totalPopulation: number
    totalBuildings: number
    totalOrbitalSubBases: number
    totalRoutes: number
  }
}
