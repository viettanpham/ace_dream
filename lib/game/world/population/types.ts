/**
 * STARFRONT WORLD — Population & Workforce Shared Foundation (Phase 6.34A-FND-4)
 *
 * Domain-agnostic contracts for Base Modular Aggregate Population,
 * Fleet/Guild Crew Pools, 3-Pass Workforce Allocator, Capacity Profiles,
 * Multi-Hub Slot Policies, InTransit Ledger, and UI ViewModels.
 */

export type PopulationBucketKey =
  | "RESIDENT"
  | "VISITOR_TOURIST"
  | "EXTERNAL_WORKER"
  | "IN_TRANSIT"

export type WorkforceCategory =
  | "BUILDING_WORKFORCE"
  | "FLEET_CREW"
  | "LOGISTICS"
  | "TRAINING"
  | "RECOVERY"
  | "OTHER_ASSIGNMENTS"

export type StaffingTier =
  | "NONE"
  | "UNDER_MINIMUM"
  | "MINIMUM"
  | "TARGET"
  | "MAXIMUM"

export type BaseType =
  | "HABITAT"
  | "GENERAL"
  | "MILITARY"
  | "DEFENSE"
  | "RESEARCH"
  | "FINANCIAL"
  | "MEDICAL_HUB"
  | "FINANCIAL_HUB"
  | "REPAIR_HUB"
  | "RESCUE_HUB"
  | "TRANSPORT_HUB"
  | "MEGAPOLIS_CITY"
  | "CAPITAL"

export type CapacityType =
  | "residential"
  | "visitor"
  | "temporaryWorker"
  | "emergency"

export type TransferStatus =
  | "IN_TRANSIT"
  | "COMPLETED"
  | "CANCELLED"
  | "ORBITAL_STAY"

/**
 * 4 Independent Capacities of a Base
 */
export interface BaseCapacityProfile {
  residentialCapacity: number
  visitorCapacity: number
  temporaryWorkerCapacity: number
  emergencyCapacity: number
  emergencyOverflowAllowed?: boolean
  emergencyOverflowLimitRatio?: number // e.g. 1.25 = 125% of emergency capacity
}

/**
 * Derived Capacity Status and Overflow Metrics
 */
export interface CapacityMetric {
  currentCount: number
  maxCapacity: number
  utilizationRate: number // [0..1+]
  isOverCapacity: boolean
  overflowCount: number
  overflowRatio: number
}

export interface BaseCapacityStatus {
  residential: CapacityMetric
  visitor: CapacityMetric
  temporaryWorker: CapacityMetric
  emergency: CapacityMetric
  hasAnyOverflow: boolean
  warnings: string[]
}

/**
 * Modular Aggregate Population State for a Base/Node
 */
export interface BasePopulationState {
  baseId: string
  // Permanent resident conservation: populationCurrent = populationAvailable + populationOccupied
  populationCurrent: number
  populationAvailable: number
  populationOccupied: number

  // Non-permanent groups (tracked separately, NOT added into populationCurrent)
  visitorPopulation: number
  externalWorkerPopulation: number

  // Detailed breakdown of occupied workforce
  breakdown: Record<WorkforceCategory, number>

  // Capacity configuration
  capacity: BaseCapacityProfile

  // Multi-Hub configuration
  baseType: BaseType
  activeHubTypes: string[]

  metadata?: Record<string, any>
}

/**
 * Fleet/Guild Crew Pool
 * Invariant: Crew transferred to Fleet is owned and managed by Fleet/Guild.
 */
export interface FleetCrewPool {
  fleetId: string
  homeBaseId: string
  residentBaseId: string // May be distinct from homeBaseId
  crewIdle: number
  crewAssigned: number
  crewReserve: number
  totalCrew: number // crewIdle + crewAssigned + crewReserve
}

/**
 * Demand specification submitted by a Building, Facility, or Fleet recruitment
 */
export interface WorkforceDemand {
  demandId: string
  targetRef: {
    entityType: string // "BUILDING" | "FACILITY" | "FLEET_RECRUITMENT" | "LOGISTICS"
    entityId: string
  }
  minimumPersonnel: number
  targetPersonnel: number
  maximumPersonnel: number
  priority: number // Higher number = higher strategic priority
  assignmentCategory: WorkforceCategory
  ownerRef?: {
    ownerType: string // "BASE" | "FLEET" | "GUILD"
    ownerId: string
  }
  isLocked?: boolean // If true, cannot be reduced or reclaimed during strategy reallocation
  isExcluded?: boolean // If true, excluded from allocation passes (turned OFF)
  policyRefs?: string[]
}

/**
 * Allocation result for a single demand
 */
export interface WorkforceAllocationResult {
  demandId: string
  targetRef: { entityType: string; entityId: string }
  minimumPersonnel: number
  targetPersonnel: number
  maximumPersonnel: number
  assignedPersonnel: number
  pass1Assigned: number // Delta assigned in Pass 1 (Minimum)
  pass2Assigned: number // Delta assigned in Pass 2 (Target)
  pass3Assigned: number // Delta assigned in Pass 3 (Maximum)
  shortfall: number // Math.max(0, targetPersonnel - assignedPersonnel)
  staffingTier: StaffingTier
  operationalEligibility: boolean // true only if assignedPersonnel >= minimumPersonnel
  isLocked: boolean
  isExcluded: boolean
  reasonCodes: string[]
}

/**
 * Result of complete 3-pass workforce allocation
 */
export interface BaseWorkforceAllocationReport {
  baseId: string
  totalAvailableBefore: number
  totalAvailableAfter: number
  totalAssignedDelta: number
  pass1TotalAssigned: number
  pass2TotalAssigned: number
  pass3TotalAssigned: number
  demandsEvaluated: number
  fullyStaffedCount: number // Reached Target
  minimumStaffedCount: number // Reached at least Minimum
  underMinimumCount: number // Below Minimum (unfit for regular operation)
  excludedCount: number
  results: WorkforceAllocationResult[]
  diagnostics: string[]
}

/**
 * National InTransit Ledger Entry
 */
export interface PopulationTransferRecord {
  transferId: string
  sourceBaseId: string
  destinationBaseId: string
  headcount: number
  category: PopulationBucketKey
  startedGameDay: number
  estimatedArrivalGameDay: number
  actualArrivalGameDay?: number
  status: TransferStatus
  routeRef?: string
  orbitalStayDays?: number
  reason: string
  metadata?: Record<string, any>
}

/**
 * Multi-Hub Slot Policy
 */
export interface HubSlotPolicy {
  hubUnlockEveryTiers: number // e.g. 2 for normal base, 1 for capital
  maxHubTypes: number | "unlimited" // e.g. 3 for normal base, 99 / "unlimited" for capital
}

/**
 * Base Multi-Hub Status
 */
export interface BaseHubStatus {
  baseId: string
  baseType: BaseType
  currentTier: number
  unlockedSlots: number
  maxSlots: number | "unlimited"
  activeHubs: string[]
  canAddHub: boolean
  nextUnlockTier?: number
}

/**
 * Audit Milestone Record
 */
export interface PopulationMilestoneRecord {
  id: string
  baseId: string
  type:
    | "WORKFORCE_ALLOCATED"
    | "WORKFORCE_RELEASED"
    | "WORKFORCE_REALLOCATED"
    | "POPULATION_TRANSFER_STARTED"
    | "POPULATION_TRANSFER_COMPLETED"
    | "POPULATION_TRANSFER_CANCELLED"
    | "CAPACITY_OVERFLOW_DETECTED"
  gameDay: number
  details: Record<string, any>
  timestamp: string
}

/**
 * UI ViewModels
 */
export interface BasePopulationSummaryVM {
  baseId: string
  totalResidents: number
  available: number
  occupied: number
  visitorCount: number
  externalWorkerCount: number
  categoryBreakdown: Record<WorkforceCategory, number>
  totalDemands: number
  underStaffedDemandsCount: number
  capacityStatus: BaseCapacityStatus
}

export interface CapacityCardVM {
  type: CapacityType
  title: string
  current: number
  max: number
  percentage: number
  isOverCapacity: boolean
  overflowCount: number
  badgeLabel: string
}

export interface WorkforceTreeNodeVM {
  demandId: string
  targetName: string
  targetType: string
  category: WorkforceCategory
  assigned: number
  minimum: number
  target: number
  maximum: number
  priority: number
  staffingTier: StaffingTier
  operationalEligibility: boolean
  shortfall: number
  isLocked: boolean
  isExcluded: boolean
  statusBadge: string
}
