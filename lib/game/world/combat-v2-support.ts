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

/**
 * Chuyển đổi an toàn chế độ Auto / Manual cho một thực thể hỗ trợ
 * BẢO ĐẢM AN TOÀN HỒI CHIÊU: Không làm thay đổi, đặt lại hay nhân bản chỉ số cooldown hiện có.
 */
export function toggleSupportControlMode(entity: CombatSupportEntity): "manual" | "auto" {
  entity.controlMode = entity.controlMode === "auto" ? "manual" : "auto"
  return entity.controlMode
}

/**
 * Kiểm tra và xếp hàng kỹ năng hỗ trợ thủ công
 */
export function queueManualSupportSkill(
  supportEntities: CombatSupportEntity[],
  skillId: string | null
): { success: boolean; message: string } {
  if (!skillId) {
    return { success: true, message: "Đã xóa kỹ năng hỗ trợ khỏi hàng đợi." }
  }

  const def = CANONICAL_SUPPORT_SKILLS[skillId]
  if (!def) {
    return { success: false, message: `Không tìm thấy kỹ năng hỗ trợ [${skillId}].` }
  }

  const matchedEntity = supportEntities.find(
    (e) => e.activeSkillName === skillId && e.controlMode === "manual"
  )

  if (!matchedEntity) {
    return {
      success: false,
      message: `Không có thực thể hỗ trợ nào ở chế độ THỦ CÔNG (MANUAL) sở hữu kỹ năng [${def.name}].`,
    }
  }

  if (matchedEntity.activeCooldownRemaining > 0) {
    return {
      success: false,
      message: `Kỹ năng [${def.name}] đang trong thời gian hồi chiêu (${matchedEntity.activeCooldownRemaining} hiệp).`,
    }
  }

  return {
    success: true,
    message: `Đã xếp hàng kỹ năng hỗ trợ [${def.name}] cho hiệp kế tiếp.`,
  }
}

export interface SupportRoundExecutionResult {
  executedSkills: Array<{
    entityId: string
    entityName: string
    skillId: string
    skillName: string
    mode: "auto" | "manual"
    targetSide: "enemy" | "allied" | "all"
    message: string
  }>
}

/**
 * Thực thi chu kỳ hỗ trợ tại biên hiệp đấu (Round Advance Boundary)
 * - Tự động giảm hồi chiêu cho các đơn vị đang cooldown
 * - Thực thi duy nhất 1 lần cho mỗi thực thể (loại trừ xung đột giữa Auto và Manual)
 * - Đưa kỹ năng vừa kích hoạt vào trạng thái hồi chiêu tối đa
 */
export function executeSupportRound(
  supportEntities: CombatSupportEntity[] = [],
  queuedSkillId: string | null = null,
  roundNumber: number
): SupportRoundExecutionResult {
  const executedSkills: SupportRoundExecutionResult["executedSkills"] = []
  let manualSkillConsumed = false

  for (const entity of supportEntities) {
    // Nếu đang hồi chiêu: giảm 1 hiệp và không kích hoạt ở hiệp này
    if (entity.activeCooldownRemaining > 0) {
      entity.activeCooldownRemaining = Math.max(0, entity.activeCooldownRemaining - 1)
      continue
    }

    // Đơn vị đã sẵn sàng (cooldown === 0)
    const skillName = entity.activeSkillName
    if (!skillName) continue
    const skillDef = CANONICAL_SUPPORT_SKILLS[skillName]
    if (!skillDef) continue

    if (entity.controlMode === "manual") {
      // Chế độ Thủ công: Chỉ kích hoạt nếu người chơi đã xếp hàng đúng kỹ năng này
      if (!manualSkillConsumed && queuedSkillId === skillName) {
        entity.activeCooldownRemaining = entity.activeCooldownMax
        manualSkillConsumed = true
        executedSkills.push({
          entityId: entity.id,
          entityName: entity.name,
          skillId: skillDef.id,
          skillName: skillDef.name,
          mode: "manual",
          targetSide: skillDef.targetSide,
          message: `[HỖ TRỢ THỦ CÔNG] ${entity.name} kích hoạt [${skillDef.name}] tại Hiệp ${roundNumber}. (${skillDef.effectSummary})`,
        })
      }
    } else if (entity.controlMode === "auto") {
      // Chế độ Tự động: AI kích hoạt khi hồi chiêu sẵn sàng
      entity.activeCooldownRemaining = entity.activeCooldownMax
      executedSkills.push({
        entityId: entity.id,
        entityName: entity.name,
        skillId: skillDef.id,
        skillName: skillDef.name,
        mode: "auto",
        targetSide: skillDef.targetSide,
        message: `[HỖ TRỢ TỰ ĐỘNG] ${entity.name} kích hoạt [${skillDef.name}] theo lịch trình AI tại Hiệp ${roundNumber}. (${skillDef.effectSummary})`,
      })
    }
  }

  return { executedSkills }
}
