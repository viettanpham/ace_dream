/**
 * STARFRONT — Phase 5.9: Pilot Skill Liên Hoàn (Synergy Combo Skill System)
 * Types, Templates, Progression, Reroll & Admin Configuration
 */

import type { StarfrontGearId } from "./types"

/**
 * 6 Phân loại Kỹ Năng Liên Hoàn (Skill Types)
 */
export type PilotSkillType =
  | "DAMAGE"
  | "BUFF"
  | "DEBUFF"
  | "HEAL"
  | "SHIELD"
  | "FOLLOW_UP"

/**
 * Các thuộc tính dòng phụ khả dụng (Secondary Stat Keys)
 */
export type SecondaryStatKey =
  | "atk_flat"
  | "atk_pct"
  | "def_flat"
  | "def_pct"
  | "spd_flat"
  | "crit_rate_pct"
  | "crit_dmg_pct"
  | "evasion_pct"
  | "shield_flat"
  | "armor_pen_pct"
  | "sp_cost_reduction_pct"
  | "sp_regen_flat"
  | "vamp_pct"
  | "status_resist_pct"

/**
 * Định nghĩa 1 thuộc tính trong candidate pool
 */
export interface SecondaryAttributeCandidate {
  statKey: SecondaryStatKey
  name: string
  unit: "flat" | "pct"
  minValue: number
  maxValue: number
  weight: number
  allowDuplicate?: boolean
  maxStacks?: number
  powerWeight: number // Hệ số tính Skill Power
}

/**
 * Dòng chính của Kỹ Năng Liên Hoàn (Main Line)
 */
export interface SkillMainLine {
  id: string
  name: string
  description: string
  baseValue: number
  growthPerLevel: number // Tăng trưởng mỗi Skill Level
  minValue: number
  maxValue: number
  unit: "flat" | "pct"
  currentValue: number
}

/**
 * Dòng phụ của Kỹ Năng Liên Hoàn (Secondary Line)
 */
export interface SkillSecondaryLine {
  id: string
  unlockedAtSkillLevel: number // Mốc mở: 5, 10, 15, 20, 25, 30
  statKey: SecondaryStatKey
  name: string
  value: number
  unit: "flat" | "pct"
  powerContribution: number
  isFallback?: boolean
}

/**
 * Thực thể Kỹ Năng Liên Hoàn đã khởi tạo của một Phi Công (Instance)
 */
export interface PilotSynergySkillInstance {
  id: string
  pilotId: string
  templateId: string
  name: string
  nameEn: string
  description?: string
  skillType: PilotSkillType
  isPassive: boolean
  triggerCondition?: "turn_start" | "on_crit" | "on_attack" | "on_shield_break" | "low_hp" | "manual_active"
  spCost: number
  cooldownTurns: number
  chargesPerBattle?: number
  signatureGearId: StarfrontGearId
  skillLevel: number
  maxSkillLevel: number
  skillPower: number // Điểm đánh giá sức mạnh tổng thể
  mainLine: SkillMainLine
  secondaryLines: SkillSecondaryLine[]
  signatureSynergyActive?: boolean // Đang lắp đúng Signature Gear
  createdAt: number
  lastUpdated: number
}

/**
 * Cấu hình mẫu Template Kỹ Năng Liên Hoàn (Template Configuration)
 */
export interface PilotSynergySkillTemplate {
  templateId: string
  pilotId: string
  name: string
  nameEn: string
  description: string
  skillType: PilotSkillType
  isPassive: boolean
  triggerCondition?: "turn_start" | "on_crit" | "on_attack" | "on_shield_break" | "low_hp" | "manual_active"
  spCost: number
  cooldownTurns: number
  chargesPerBattle?: number
  signatureGearId: StarfrontGearId
  signatureBonusText: string
  defaultMaxSkillLevel: number
  mainLineDef: {
    id: string
    name: string
    descriptionFormat: string
    baseValue: number
    growthPerLevel: number
    minValue: number
    maxValue: number
    unit: "flat" | "pct"
    powerMultiplier: number
  }
  milestoneLevels: number[] // Mặc định [5, 10, 15, 20, 25, 30]
  candidatePool: SecondaryAttributeCandidate[]
  fallbackCandidate: SecondaryAttributeCandidate
  maxSecondaryLines: number // Thường là 6 (tương ứng 6 mốc milestone)
  maxSkillPowerBudget: number // Ngân sách sức mạnh tối đa để kiểm soát
}

/**
 * Chế độ ưu tiên cấu hình (Admin Priority Mode)
 */
export type AdminPriorityMode = "TEMPLATE_OVERRIDE" | "GLOBAL_PRIORITY"

/**
 * Cấu hình toàn cục (Global Admin Config)
 */
export interface GlobalAdminConfig {
  globalMaxPilotLevel: number // Mặc định 120
  globalMaxSkillLevel: number // Mặc định 30
  priorityMode: AdminPriorityMode // Mặc định TEMPLATE_OVERRIDE
  lastModified: number
  templateOverrides?: Record<string, { maxSkillLevel?: number }>
}

/**
 * Tùy chọn thực hiện Reroll
 */
export interface RerollOptions {
  type: "random" | "targeted"
  targetLineIndex?: number // Bắt buộc nếu là targeted
  rerollItemId?: string
}

/**
 * Kết quả thực thi Reroll
 */
export interface RerollResult {
  success: boolean
  message: string
  updatedSkill: PilotSynergySkillInstance
  changedLineIndex: number
  oldLine: SkillSecondaryLine
  newLine: SkillSecondaryLine
}
