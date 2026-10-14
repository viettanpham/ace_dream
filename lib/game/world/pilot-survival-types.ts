/**
 * STARFRONT WORLD — Pilot Survival & Search-and-Rescue (SAR) Types (Phase 6.34)
 *
 * Source of Truth: docs/WORLD_PILOT_SURVIVAL_RESCUE.md
 * System Invariant: GEAR HP = 0 => GEAR DESTROYED, but Pilot Survival is decoupled.
 */

import type { CombatSide } from "./combat-v2-types"

/**
 * 4 Phân hạng Tình trạng Phi công sau khi cỗ máy bị tiêu diệt
 */
export type PilotSurvivalTier = "SAFE" | "PROTECTED" | "CRITICAL" | "KIA"

/**
 * 4 Kết quả Chung cuộc Giải quyết Hậu Trận chiến (SAR Resolution)
 */
export type PilotFinalStatus = "RESCUED" | "CAPTURED" | "KIA" | "MISSING"

/**
 * Cấu hình tham số ngưỡng và xác suất Sinh tồn & Giải cứu (Central Configuration)
 */
export interface SurvivalConfig {
  /** Điểm >= thresholdSafe => SAFE (Mặc định: 70 - Approved Default) */
  thresholdSafe: number
  /** Điểm >= thresholdProtected và < thresholdSafe => PROTECTED (Mặc định: 50 - Approved Default) */
  thresholdProtected: number
  /** Điểm >= thresholdCritical và < thresholdProtected => CRITICAL (Mặc định: 30 - Approved Default). Điểm < 30 => KIA */
  thresholdCritical: number
  /** Xác suất cơ sở giải cứu thành công thân thiện (Mặc định: 0.30 - Conceptual Example) */
  baseRescueChance: number
  /** Xác suất cơ sở bị kẻ địch bắt giữ làm tù binh (Mặc định: 0.40 - Conceptual Example) */
  baseCaptureChance: number
  /** Thưởng xác suất giải cứu trên mỗi cấp cơ sở SAR (Mặc định: 0.10 - Conceptual Example) */
  facilityRescuePowerBonusPerTier: number
  /** Thưởng xác suất giải cứu khi đồng minh làm chủ chiến trường (Chiến thắng) */
  alliedVictoryRescueBonus: number
  /** Thời điểm chỉnh sửa gần nhất */
  lastModified?: number
}

/**
 * Chi tiết các thành phần đóng góp vào điểm số sinh tồn
 */
export interface PilotSurvivalScoreBreakdown {
  baseReliability: number
  forceBalanceModifier: number
  alliedProtectionModifier: number
  enemyPressureModifier: number
  supportModifier: number
  moraleModifier: number
  totalScore: number
}

/**
 * Bản ghi sinh tồn đầy đủ của một phi công khi cỗ máy bị phá hủy
 */
export interface PilotSurvivalRecord {
  recordId: string
  encounterId: string
  transactionId: string
  sectorId: string
  gearId: string
  gearName: string
  pilotId: string
  pilotName: string
  side: CombatSide
  isPlayer: boolean
  destructionRound: number
  survivalScore: number
  breakdown: PilotSurvivalScoreBreakdown
  initialTier: PilotSurvivalTier
  finalStatus: PilotFinalStatus
  resolvedAtRound: number
  resolvedAtTimestamp: number
  notes: string
  rescueDispatchId?: string
}

/**
 * Bản ghi Tù binh Chiến tranh Quốc gia (National POW Registry)
 */
export interface CapturedPilotRecord {
  pilotId: string
  pilotName: string
  gearId: string
  gearName: string
  encounterId: string
  sectorId: string
  capturedAtTimestamp: number
  capturedAtDay: number
  captorFaction: string // vd: "void"
  status: "IN_CAPTIVITY" | "RESCUE_IN_PROGRESS" | "RELEASED"
  rescueDispatchId?: string
}
