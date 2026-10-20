/**
 * STARFRONT WORLD — Fleet & Ship Master Catalog Types (Phase 7.1)
 *
 * Domain contracts for the 7 canonical master catalogs of domain "fleet":
 * 1. Fleet Type (system_fleet_fleet_type_data.json)
 * 2. Fleet Class (system_fleet_fleet_class_data.json)
 * 3. Ship Type (system_fleet_ship_type_data.json)
 * 4. Ship Class (system_fleet_ship_class_data.json)
 * 5. Ship Definition (system_fleet_ship_definition_data.json)
 * 6. Fleet Policy Profile (system_fleet_policy_profile_data.json)
 * 7. FRAME Award Catalog (system_fleet_frame_award_catalog_data.json)
 */

import type { CatalogItemLifecycle } from "../catalog/types"

/**
 * 1. Fleet Type Definition (Mục đích tác chiến chiến lược của Hạm đội)
 */
export type FleetStrategicRole = "OFFENSIVE" | "DEFENSIVE" | "SUPPORT" | "LOGISTICS" | "RECON"

export interface FleetTypeDefinition {
  id: string
  name: string
  description: string
  strategicRole: FleetStrategicRole
  baseSpeedMultiplier: number
  baseMaintenanceCostMultiplier: number
  defaultAIPersona: string
  compatibleShipTypes: string[]
  lifecycle?: CatalogItemLifecycle
}

/**
 * 2. Fleet Class Definition (Phân cấp quy mô Hạm đội theo MK I – MK X)
 */
export interface FleetClassDefinition {
  id: string
  tierOrder: number
  displayName: string
  minLevel: number
  maxLevel: number
  maxShipCount: number
  commandCapRequirement: number
  minimumCommanderRank: string
  baseUpkeepCredits: number
  levelMultiplier: number
  hasMaxTierBonus?: boolean
  lifecycle?: CatalogItemLifecycle
}

/**
 * 3. Ship Type Definition (Phân loại vai trò chức năng của tàu chiến)
 */
export type ShipHullClass = "LIGHT" | "MEDIUM_LIGHT" | "MEDIUM" | "HEAVY" | "CAPITAL" | "LOGISTICS"

export interface ShipTypeDefinition {
  id: string
  name: string
  hullClass: ShipHullClass
  evasionBase: number
  speedBase: number
  defaultRole: string
  lifecycle?: CatalogItemLifecycle
}

/**
 * 4. Ship Class Definition (Phân cấp phẩm cấp công nghệ đóng tàu MK I – MK X)
 */
export interface ShipClassDefinition {
  id: string
  tierOrder: number
  displayName: string
  hullMultiplier: number
  shieldMultiplier: number
  moduleSlotBonus: number
  maintenanceFactor: number
  hasCapstoneBonus?: boolean
  lifecycle?: CatalogItemLifecycle
}

/**
 * 5. Ship Definition (Bản vẽ thiết kế tàu chuẩn tắc - Master Blueprints)
 */
export interface ShipSlotLayoutItem {
  slotId: string
  slotType: "WEAPON" | "SHIELD" | "ENGINE" | "HANGAR" | "CARGO" | "UTILITY"
  size: "LIGHT" | "MEDIUM" | "HEAVY" | "CAPITAL"
}

export interface ShipCrewRequirements {
  minimumCrew: number
  targetCrew: number
  maximumCrew: number
}

export interface ShipBaseStats {
  maxHp: number
  maxShield: number
  attack: number
  defense: number
  speed: number
}

export interface ShipBuildCost {
  industrialMaterials: number
  energy: number
  credits: number
  buildDays: number
}

export interface ShipDefinition {
  id: string
  typeId: string // Khóa ngoại sang ShipTypeDefinition
  classId: string // Khóa ngoại sang ShipClassDefinition
  name: string
  faction: string // "vss" | "void" | "neutral"
  description: string
  baseStats: ShipBaseStats
  crewRequirements: ShipCrewRequirements
  slotsLayout: ShipSlotLayoutItem[]
  cargoCapacity: number
  fuelCapacity: number
  buildCost: ShipBuildCost
  lifecycle?: CatalogItemLifecycle
}

/**
 * 6. Fleet Policy Profile (Chính sách trợ cấp, suy giảm thường niên và chỉ huy khẩn cấp)
 */
export interface EmergencyCommandThresholds {
  capitalSiege: boolean
  sectorThreatLevelCutoff: number
  minFleetReadinessPercent: number
}

export interface FleetPolicyProfile {
  id: string
  name: string
  annualDecayCycleDays: number // Mặc định 360 GAME_DAYS
  annualDecayDivisor: number // Mặc định 2 (BaseDecay = NationalAverageCycle / 2)
  annualDecayMaxCapPercent: number // Mặc định 50%
  subsidyMultiplierPerTier: number // Mặc định 10
  subsidyFloorPercent: number // Mặc định 30%
  subsidyFullRateLimit: number // Mặc định 3 lượt đầu 100%
  frontlineWarExceptionEnabled: boolean
  emergencyCommandThresholds: EmergencyCommandThresholds
  newGuildProtectionDays: number // Mặc định 360 GAME_DAYS
  exchangeRateFrameToCredits: number // Mặc định 150 Credits / FRAME
  lifecycle?: CatalogItemLifecycle
}

/**
 * 7. FRAME Award Definition (Biểu mẫu điểm thưởng FRAME cho chiến công)
 */
export type FrameRecipientType = "FLEET" | "PILOT" | "FLEET_AND_PILOT"

export interface FrameAwardDefinition {
  id: string
  name: string
  basePoints: number
  bonusMultiplierPerThreatLevel: number
  recipientType: FrameRecipientType
  description: string
  lifecycle?: CatalogItemLifecycle
}
