import type { CombatSkill, CombatUnit, EnemyArchetype } from "./types"

export type AIDecisionResult = {
  skill: CombatSkill
  reason: string
  isChargingUltimate?: boolean
}

/**
 * Lựa chọn hành vi chiến thuật của kẻ địch theo Archetype (Milestone 4.3 & 4.4).
 * TUYỆT ĐỐI KHÔNG ĐƯỢC gian lận: Chỉ được chọn kỹ năng khi đủ SP và Cooldown <= 0.
 */
export function decideEnemyAction(
  enemy: CombatUnit,
  player: CombatUnit,
  currentTurn: number,
): AIDecisionResult {
  // 1. Bộ lọc ràng buộc cứng (Hard Constraints): Kỹ năng phải đủ SP và hết Cooldown
  const availableSkills = enemy.skills.filter(
    (s) => s.spCost <= enemy.sp && (enemy.skillCooldowns[s.id] || 0) <= 0,
  )

  // Đòn đánh cơ bản (luôn khả dụng, spCost = 0)
  const basicAttack =
    enemy.skills.find((s) => s.spCost === 0) ||
    enemy.skills[0] || {
      id: "basic-attack",
      name: "Đòn Bắn Thường",
      nameEn: "Basic Shot",
      desc: "Tấn công thường hồi phục năng lượng.",
      spCost: 0,
      cooldown: 0,
      targetType: "single-enemy" as const,
      damageMultiplier: 1.0,
    }

  // Nếu không có kỹ năng nào thỏa mãn SP hoặc cooldown -> Bắt buộc dùng đòn cơ bản
  if (availableSkills.length === 0) {
    return {
      skill: basicAttack,
      reason: "Thiếu SP hoặc kỹ năng đang hồi chiêu -> Chuyển sang tấn công cơ bản nạp SP.",
    }
  }

  const archetype: EnemyArchetype =
    enemy.archetype ||
    (enemy.isBoss
      ? "boss"
      : enemy.gearType === "scout-drone"
        ? "disruptor"
        : enemy.gearType === "siege-walker"
          ? "boss"
          : "aggressive")

  const playerHpRatio = player.hp / Math.max(1, player.maxHp)
  const enemyHpRatio = enemy.hp / Math.max(1, enemy.maxHp)
  const playerHasShield = player.statusEffects.some((e) => e.type === "emergency-guard")
  const playerHasArmorBreak = player.statusEffects.some((e) => e.type === "armor-break")
  const playerIsSlowed = player.statusEffects.some((e) => e.type === "emp-slow")
  const enemyHasShield = enemy.statusEffects.some((e) => e.type === "emergency-guard")

  // =========================================================================
  // ARCHETYPE: BOSS (Pháo Đài Công Thành / Boss Đa Pha)
  // =========================================================================
  if (archetype === "boss") {
    const isPhase2 = (enemy.bossPhase || 1) >= 2 || enemyHpRatio < 0.5

    // Pha 2: Nếu có Tuyệt kỹ hủy diệt và đủ điều kiện -> Nạp hoặc xả tuyệt kỹ
    if (isPhase2) {
      const ultimateSkill = availableSkills.find(
        (s) => s.id === "siege-overdrive-blast" || s.id === enemy.ultimateSkillId,
      )
      if (ultimateSkill) {
        return {
          skill: ultimateSkill,
          reason: "Kích hoạt Tuyệt kỹ Hủy diệt Pha 2 (Overdrive Nova)!",
          isChargingUltimate: true,
        }
      }
    }

    // Pha 1 hoặc Pha 2 lúc Tuyệt kỹ đang hồi: Phòng thủ khi HP thấp
    if (enemyHpRatio < 0.55 && !enemyHasShield) {
      const shieldSkill = availableSkills.find(
        (s) => s.targetType === "self" || Boolean(s.damageReduction),
      )
      if (shieldSkill) {
        return {
          skill: shieldSkill,
          reason: "Kích hoạt lớp giáp titan gia cố khi máu giảm sâu.",
        }
      }
    }

    // Tấn công bằng kỹ năng hỏa lực mạnh nhất
    const highDamageSkill = [...availableSkills]
      .filter((s) => s.targetType !== "self")
      .sort((a, b) => (b.damageMultiplier || 1) - (a.damageMultiplier || 1))[0]

    if (highDamageSkill && highDamageSkill.id !== basicAttack.id) {
      return {
        skill: highDamageSkill,
        reason: "Xả hỏa lực hủy diệt diện rộng toàn công suất.",
      }
    }

    return {
      skill: basicAttack,
      reason: "Duy trì hỏa lực pháo công thành cơ bản.",
    }
  }

  // =========================================================================
  // ARCHETYPE 1: AGGRESSIVE (Áp Đảo — Raider Mech)
  // =========================================================================
  if (archetype === "aggressive") {
    // 1. Ưu tiên kết liễu nếu mục tiêu dưới 40% HP
    if (playerHpRatio <= 0.4) {
      const finishSkill = [...availableSkills]
        .filter((s) => s.targetType === "single-enemy")
        .sort((a, b) => (b.damageMultiplier || 1) - (a.damageMultiplier || 1))[0]
      if (finishSkill) {
        return {
          skill: finishSkill,
          reason: `Mục tiêu suy yếu (${Math.round(playerHpRatio * 100)}% HP) -> Tung đòn dứt điểm tối đa sát thương!`,
        }
      }
    }

    // 2. Chọn kỹ năng gây sát thương cao nhất
    const strongestSkill = [...availableSkills]
      .filter((s) => s.targetType === "single-enemy" && s.spCost > 0)
      .sort((a, b) => (b.damageMultiplier || 1) - (a.damageMultiplier || 1))[0]

    if (strongestSkill) {
      return {
        skill: strongestSkill,
        reason: `Áp đảo hỏa lực với kỹ năng ${strongestSkill.name}.`,
      }
    }

    return {
      skill: basicAttack,
      reason: "Tấn công áp sát hồi SP để chuẩn bị loạt tên lửa tiếp theo.",
    }
  }

  // =========================================================================
  // ARCHETYPE 2: DEFENSIVE / VANGUARD (Phòng Thủ & Phản Kích)
  // =========================================================================
  if (archetype === "defensive") {
    // 1. Khi máu < 50% và chưa có khiên -> Bật khiên ngay
    if (enemyHpRatio < 0.5 && !enemyHasShield) {
      const guardSkill = availableSkills.find(
        (s) => s.targetType === "self" || Boolean(s.damageReduction),
      )
      if (guardSkill) {
        return {
          skill: guardSkill,
          reason: `HP còn ${Math.round(enemyHpRatio * 100)}% -> Triển khai lá chắn bảo hộ khẩn cấp!`,
        }
      }
    }

    // 2. Nếu SP quá thấp (< 35) -> Đánh thường để tích trữ SP phản công
    if (enemy.sp < 35) {
      return {
        skill: basicAttack,
        reason: "Tích trữ SP cho lượt phản công quyết định.",
      }
    }

    // 3. Phản công bằng đòn mạnh nhất
    const attackSkill = availableSkills.find((s) => s.spCost > 0) || basicAttack
    return {
      skill: attackSkill,
      reason: "Tung đòn phản công có chủ đích.",
    }
  }

  // =========================================================================
  // ARCHETYPE 3: DISRUPTOR (Quấy Nhiễu & Khống Chế — Scout Drone)
  // =========================================================================
  if (archetype === "disruptor") {
    // 1. Ưu tiên làm chậm hoặc khống chế nếu người chơi chưa bị chậm
    if (!playerIsSlowed) {
      const slowSkill = availableSkills.find(
        (s) =>
          s.id.includes("emp") ||
          s.statusToApply?.type === "emp-slow" ||
          s.statusToApply?.type === "stun",
      )
      if (slowSkill) {
        return {
          skill: slowSkill,
          reason: "Phóng xung điện từ EMP làm chậm và nhiễu cảm biến người chơi!",
        }
      }
    }

    // 2. Ưu tiên phá giáp nếu người chơi chưa bị phá giáp
    if (!playerHasArmorBreak) {
      const breakSkill = availableSkills.find(
        (s) => Boolean(s.defenseReduction) || s.statusToApply?.type === "acid-corrosion",
      )
      if (breakSkill) {
        return {
          skill: breakSkill,
          reason: "Tung đòn phá hủy kết cấu phòng thủ của mục tiêu.",
        }
      }
    }

    // 3. Tấn công cơ động
    const burstSkill = availableSkills.find((s) => s.spCost > 0) || basicAttack
    return {
      skill: burstSkill,
      reason: "Tấn công quấy rối mục tiêu cơ động cao.",
    }
  }

  // =========================================================================
  // ARCHETYPE 4: ADAPTIVE (Thích Ứng Chiến Thuật)
  // =========================================================================
  if (archetype === "adaptive") {
    // Nếu người chơi bật khiên phòng hộ
    if (playerHasShield) {
      // Tìm đòn phá giáp/xuyên giáp
      const armorPiercer = availableSkills.find((s) => Boolean(s.defenseReduction || s.armorPen))
      if (armorPiercer) {
        return {
          skill: armorPiercer,
          reason: "Mục tiêu có khiên chắn -> Dùng đòn xuyên giáp khắc chế!",
        }
      }
      // Không có phá giáp -> Đánh thường tiết kiệm SP chờ khiên hết hạn
      return {
        skill: basicAttack,
        reason: "Người chơi đang có lá chắn bảo vệ -> Đánh thường tiết kiệm SP.",
      }
    }

    // Nếu người chơi đang bị nứt giáp -> Dồn sát thương cực đại
    if (playerHasArmorBreak) {
      const heavyHit = [...availableSkills]
        .filter((s) => s.targetType === "single-enemy")
        .sort((a, b) => (b.damageMultiplier || 1) - (a.damageMultiplier || 1))[0]
      if (heavyHit) {
        return {
          skill: heavyHit,
          reason: "Giáp người chơi đã vỡ -> Tung toàn lực sát thương chí mạng!",
        }
      }
    }

    // Mặc định: Dùng kỹ năng khả dụng mạnh nhất
    const bestSkill = availableSkills.find((s) => s.spCost > 0) || basicAttack
    return {
      skill: bestSkill,
      reason: "Hành động chiến thuật thích ứng với tình huống hiện tại.",
    }
  }

  // Fallback an toàn tuyệt đối
  return {
    skill: basicAttack,
    reason: "Thực hiện tấn công cơ bản.",
  }
}
