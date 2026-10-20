/**
 * STARFRONT WORLD — Ship Entity & Progression Types (Phase 7.2)
 *
 * Defines runtime structures for individual Ship instances:
 * - ShipOperationalStatus (OPERATIONAL, DAMAGED, CRITICAL_OFFLINE, DRYDOCK_REPAIR, DECOMMISSIONED, DESTROYED)
 * - ShipInstalledModule (slot assignment, module definition ref, condition, active state)
 * - ShipInstance (physical stats, wear condition, progression state, history)
 * - ShipRepairOrder & Cost Estimation
 */

import type { ProgressionEntity } from "../progression/types"
import type { ShipDefinition } from "../fleet/catalog-types"

/**
 * Trạng thái vật lý & vận hành của từng con tàu
 */
export type ShipOperationalStatus =
  | "OPERATIONAL"         // Sẵn sàng tác chiến, condition >= 75%
  | "DAMAGED"             // Hư hại nhẹ, condition 50-74%, giảm tốc độ
  | "CRITICAL_OFFLINE"    // Hư hại nghiêm trọng, condition < 25%, khóa hyperlane
  | "DRYDOCK_REPAIR"      // Đang trong xưởng cạn đại tu bảo dưỡng
  | "DECOMMISSIONED"      // Đã loại biên / đóng hồ sơ kỹ thuật
  | "DESTROYED"           // Bị bắn chìm trong chiến đấu

/**
 * Module lắp ráp trên thân tàu
 */
export interface ShipInstalledModule {
  slotId: string
  slotType: "WEAPON" | "SHIELD" | "ENGINE" | "HANGAR" | "CARGO" | "UTILITY"
  moduleId: string
  moduleName?: string
  condition: number // [0.00..100.00%]
  isOperational: boolean
  statBonuses?: {
    attack?: number
    defense?: number
    shield?: number
    speed?: number
    cargo?: number
    fuel?: number
  }
}

/**
 * Thực thể Tàu chiến cụ thể (Ship Instance)
 */
export interface ShipInstance {
  instanceId: string
  definitionId: string
  customName: string
  fleetId?: string
  faction: string

  // Sinh mệnh & Lá chắn
  currentHp: number
  maxHp: number
  currentShield: number
  maxShield: number

  // Hao mòn vật lý & Trạng thái [0.00..100.00%]
  condition: number
  status: ShipOperationalStatus

  // Phi hành đoàn & Phi công chỉ huy
  assignedPilotId?: string
  assignedCrewCount: number

  // Hệ thống Slot & Module
  installedModules: Record<string, ShipInstalledModule>

  // Tích hợp FND-2 Progression MK I–X
  progression: ProgressionEntity

  // Nhật ký khai thác & Thành tích
  mileageKm: number
  battlesCount: number
  killsCount: number
  commissionedGameDay: number
  lastMaintenanceGameDay: number

  // Phần thưởng Capstone MK X độc bản
  maxTierBonusGranted?: boolean
  capstoneTitle?: string
}

/**
 * Đơn đặt hàng & Ước tính chi phí sửa chữa đại tu
 */
export interface ShipRepairEstimate {
  shipId: string
  repairNeeded: boolean
  hpShortfall: number
  conditionLoss: number
  logisticsSuppliesCost: number
  creditsCost: number
  drydockDaysRequired: number
}

/**
 * Kết quả sau khi thực hiện sửa chữa tại cảng
 */
export interface ShipRepairResult {
  success: boolean
  reason?: string
  suppliesConsumed: number
  creditsConsumed: number
  restoredHp: number
  restoredCondition: number
  newStatus: ShipOperationalStatus
}

/**
 * Kết quả tính toán chỉ số thực tế sau khi tính hao mòn và progression
 */
export interface ShipEffectiveStats {
  maxHp: number
  maxShield: number
  attack: number
  defense: number
  speed: number
  condition: number
  isHyperlaneCapable: boolean
  speedPenaltyPercent: number
}
