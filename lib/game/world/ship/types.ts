/**
 * STARFRONT WORLD — Ship Entity & Progression Types (Phase 7.2)
 *
 * Core architectural contracts for individually addressable Ship Entities:
 * 1. Type -> Class -> Definition -> Instance
 * 2. Identity, Ownership & Fleet/Base/Dock Decoupling
 * 3. FND-2 Progression MK I–X Integration & MAX TIER BONUS
 * 4. Slot Modules & Typed/Generic Progression
 * 5. Crew Requirements & Operational Efficiency
 * 6. Hull, Shield, Condition & Maintenance
 * 7. Dockyard Upgrade Tasks & Queue
 */

import type { ProgressionEntity } from "../progression/types"
import type { ShipDefinition } from "../fleet/catalog-types"

/**
 * Operational and physical condition status of a ship
 */
export type ShipOperationalStatus =
  | "OPERATIONAL"
  | "DAMAGED"
  | "CRITICAL_OFFLINE"
  | "DRYDOCK_REPAIR"
  | "UPGRADING"
  | "DECOMMISSIONED"
  | "DESTROYED"

/**
 * Owner reference with entity independence
 */
export interface ShipOwnerRef {
  ownerType: "NATIONAL" | "GUILD" | "PRIVATE_NPC" | "PLAYER"
  ownerId: string
  ownerName: string
  factionId: string
}

/**
 * Installed module within an allocated ship slot
 */
export interface ShipInstalledModule {
  slotId: string
  slotType: "WEAPON" | "SHIELD" | "ENGINE" | "HANGAR" | "CARGO" | "UTILITY"
  size: "LIGHT" | "MEDIUM" | "HEAVY" | "CAPITAL"
  moduleId: string
  name: string
  condition: number // [0.00..100.00%]
  isOperational: boolean
  statModifiers?: Record<string, number>
}

/**
 * Crew status and operational efficiency evaluation
 */
export interface ShipCrewStatus {
  minimumCrew: number
  targetCrew: number
  maximumCrew: number
  currentCrew: number
  efficiency: number // [0.00..1.25]
  isUnderStaffed: boolean
  canOperate: boolean
}

/**
 * Active Dockyard Upgrade Task for Tier Breakthroughs
 */
export interface ShipUpgradeTask {
  taskId: string
  shipId: string
  fromTierId: string
  targetTierId: string
  baseId: string
  dockPortId?: string
  startDay: number
  completeDay: number
  durationDays: number
  cost: {
    industrialMaterials: number
    energy: number
    credits: number
  }
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
}

/**
 * Maintenance and repair operation result
 */
export interface ShipMaintenanceResult {
  success: boolean
  repairedCondition: number
  repairedHullHp: number
  repairedShieldHp: number
  consumedMaterials: {
    industrialMaterials: number
    logisticsSupplies: number
    credits: number
  }
  message: string
}

/**
 * Permanent Capstone Bonus applied upon reaching MK X (Tier 10)
 */
export interface ShipMaxTierBonus {
  applied: boolean
  bonusHullHp: number
  bonusShieldHp: number
  bonusSlotUnlocks: number
  awardedAtGameDay: number
}

/**
 * The complete, individually addressable Ship Entity Instance
 */
export interface ShipInstance {
  instanceId: string
  definitionId: string
  serialNumber: string
  customName?: string
  
  // Independent Ownership & Dynamic Location
  ownerRef: ShipOwnerRef
  assignedFleetId?: string // Decoupled: can be unassigned, stationed, or under refit
  fleetId?: string // Compatibility alias
  currentBaseId?: string
  dockedBaseId?: string // Compatibility alias
  currentSectorId: string
  currentDockId?: string
  
  // Operational Status & Combat Health
  status: ShipOperationalStatus
  hullHp: number
  maxHullHp: number
  shieldHp: number
  maxShieldHp: number
  
  // Asset Wear & Condition (Decoupled from Hull HP)
  condition: number // [0.00..100.00%]
  maintenancePolicy?: "AUTO" | "MANUAL" | "EMERGENCY_ONLY"
  
  // Personnel & Crew
  assignedCrewCount: number
  assignedPilotId?: string
  
  // Slots & Modules (Progression & Tier driven)
  installedModules: Record<string, ShipInstalledModule>
  unlockedModuleSlotsCount: number
  unlockedGenericSlotsCount?: number
  unlockedTypedSlots?: Record<string, number>
  
  // FND-2 Progression Engine State
  progression: ProgressionEntity
  
  // Capstone MAX TIER BONUS
  maxTierBonus?: ShipMaxTierBonus
  
  // Active Dockyard Upgrade Task
  activeUpgradeTask?: ShipUpgradeTask
  
  // Service Metrics & History
  mileageKm: number
  battlesCount: number
  killsCount: number
  commissionedGameDay: number
  lastMaintenanceGameDay: number
}

/**
 * Parameters to create a new ShipInstance
 */
export interface CreateShipParams {
  instanceId?: string
  definitionId: string
  customName?: string
  serialNumber?: string
  ownerRef: ShipOwnerRef
  assignedFleetId?: string
  currentBaseId?: string
  currentSectorId?: string
  currentDockId?: string
  assignedCrewCount?: number
  assignedPilotId?: string
  maintenancePolicy?: "AUTO" | "MANUAL" | "EMERGENCY_ONLY"
  gameDay?: number
  progressionProfileId?: string
}
