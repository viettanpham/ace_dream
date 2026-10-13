/**
 * STARFRONT WORLD — Combat V2 Support Capabilities & Definitions (Phase 6.33)
 *
 * Provides authoritative definitions for Support Skills that can be queued
 * during combat or executed automatically when in Auto mode.
 */

import type { CombatSide, CombatSupportEntity } from "./combat-v2-types"

export interface SupportSkillDefinition {
  id: string
  name: string
  code: string
  description: string
  type: "orbital_strike" | "shield_matrix" | "electronic_jamming" | "rapid_repair" | "recon_sweep"
  cooldownRounds: number
  targetSide: "enemy" | "allied" | "all"
  effectSummary: string
}

export const CANONICAL_SUPPORT_SKILLS: Record<string, SupportSkillDefinition> = {
  orbital_strike: {
    id: "orbital_strike",
    name: "Pháo Kích Quỹ Đạo (Orbital Bombardment)",
    code: "STRIKE-ORB-7",
    description: "Kích hoạt dàn pháo hạt ion từ trạm quỹ đạo dội hỏa lực diện rộng vào toàn bộ đội hình đối phương.",
    type: "orbital_strike",
    cooldownRounds: 3,
    targetSide: "enemy",
    effectSummary: "Gây sát thương nổ diện rộng cho tất cả GEAR The Void đang tham chiến.",
  },
  shield_matrix: {
    id: "shield_matrix",
    name: "Màn Chắn Điện Từ Vệ Tinh (Defensive Matrix)",
    code: "SHIELD-MAT-4",
    description: "Chiếu sóng bảo vệ tăng cường lớp giáp phân cực cho toàn bộ cỗ máy đồng minh.",
    type: "shield_matrix",
    cooldownRounds: 2,
    targetSide: "allied",
    effectSummary: "Gia tăng năng lực phòng ngự cho toàn lực lượng đồng minh trong hiệp đấu.",
  },
  electronic_jamming: {
    id: "electronic_jamming",
    name: "Nhiễu Điện Tử Tác Chiến (EW Jamming)",
    code: "JAM-EW-9",
    description: "Phát xung làm nhiễu cảm biến radar đối phương, giảm độ chính xác và khả năng né tránh.",
    type: "electronic_jamming",
    cooldownRounds: 2,
    targetSide: "enemy",
    effectSummary: "Làm giảm sức tấn công hiệu dụng và tốc độ xuất kích của quân The Void.",
  },
  rapid_repair: {
    id: "rapid_repair",
    name: "Nanite Hồi Phục Khẩn Cấp (Nanite Surge)",
    code: "REP-NANO-2",
    description: "Bắn canister nanite khẩn cấp phục hồi kết cấu giáp cho đơn vị đồng minh thấp máu nhất.",
    type: "rapid_repair",
    cooldownRounds: 3,
    targetSide: "allied",
    effectSummary: "Hồi phục ngay một lượng HP kết cấu cho đơn vị đồng minh bị tổn hại nặng nhất.",
  },
}

export function createDefaultSupportEntities(alliedSide: CombatSide = "allied"): CombatSupportEntity[] {
  return [
    {
      id: "vss_orbital_platform",
      name: "Trạm Chỉ Huy Quỹ Đạo VSS Hyperion",
      side: alliedSide,
      type: "station",
      currentHp: 1200,
      maxHp: 1200,
      hasPassiveBuff: true,
      passiveDescription: "Cung cấp liên lạc chiến thuật thời gian thực (+5% chỉ số cơ bản toàn lực lượng).",
      activeSkillName: "orbital_strike",
      activeCooldownRemaining: 0,
      activeCooldownMax: 3,
      controlMode: "auto",
    },
    {
      id: "vss_logistics_tender",
      name: "Tàu Hỗ Trợ Hậu Cần VSS Daedalus",
      side: alliedSide,
      type: "fleet_support",
      currentHp: 800,
      maxHp: 800,
      hasPassiveBuff: true,
      passiveDescription: "Hệ thống bảo dưỡng dã chiến thường trực.",
      activeSkillName: "shield_matrix",
      activeCooldownRemaining: 0,
      activeCooldownMax: 2,
      controlMode: "auto",
    },
  ]
}
