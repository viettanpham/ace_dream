/**
 * STARFRONT — Phase 5.9: Pilot Skill Liên Hoàn Templates
 * 4 Template cấu hình chi tiết cho Marcus, Valentine, Levi Reed (Alviss), và Eric
 */

import type {
  PilotSynergySkillTemplate,
  SecondaryAttributeCandidate,
} from "./pilot-skill-types"

/**
 * Fallback candidates chuẩn khi hết thuộc tính hợp lệ
 */
const COMMON_FALLBACK_CANDIDATE: SecondaryAttributeCandidate = {
  statKey: "atk_flat",
  name: "Gia Lực Xung Hạt (Dự Phòng)",
  unit: "flat",
  minValue: 8,
  maxValue: 24,
  weight: 10,
  allowDuplicate: true,
  maxStacks: 6,
  powerWeight: 1.0,
}

/**
 * 1. Template Marcus Thorne — Bão Pháo Ion Càn Quét (Artillery Storm)
 * Skill Type: FOLLOW_UP / DAMAGE
 * Signature Gear: Vanguard
 */
export const MARCUS_SYNERGY_TEMPLATE: PilotSynergySkillTemplate = {
  templateId: "tpl_marcus_artillery_storm",
  pilotId: "marcus",
  name: "Bão Pháo Ion Càn Quét",
  nameEn: "Ion Artillery Tempest",
  description:
    "Marcus giải phóng toàn bộ hỏa lực dự trữ từ lò phản ứng, oanh tạc liên hoàn gây sát thương cực mạnh. Khi lái đúng Vanguard, kích hoạt hiệp đồng khai hỏa thêm 1 loạt đạn phụ.",
  skillType: "DAMAGE",
  isPassive: false, // Active Skill: Có nút bấm riêng trên buồng lái!
  triggerCondition: "manual_active",
  spCost: 30,
  cooldownTurns: 3,
  chargesPerBattle: 3,
  signatureGearId: "vanguard",
  signatureBonusText:
    "+25% Sát thương đòn đánh & Tự động hồi phục +15 SP sau khi khai hỏa",
  defaultMaxSkillLevel: 30,
  mainLineDef: {
    id: "main_artillery_dmg",
    name: "Sát Thương Pháo Ion Liên Hoàn",
    descriptionFormat: "Gây {value}% tổng sức tấn công lên toàn bộ phòng tuyến mục tiêu",
    baseValue: 140, // 140% ATK ở Lv.1
    growthPerLevel: 3.5, // +3.5% mỗi level -> Lv.30 đạt ~241.5%
    minValue: 140,
    maxValue: 300,
    unit: "pct",
    powerMultiplier: 2.2,
  },
  milestoneLevels: [5, 10, 15, 20, 25, 30],
  maxSecondaryLines: 6,
  maxSkillPowerBudget: 850,
  candidatePool: [
    {
      statKey: "atk_pct",
      name: "Tăng Cường Hỏa Lực Tổng",
      unit: "pct",
      minValue: 4,
      maxValue: 12,
      weight: 100,
      allowDuplicate: false,
      powerWeight: 4.5,
    },
    {
      statKey: "atk_flat",
      name: "Tấn Công Pháo Thô",
      unit: "flat",
      minValue: 15,
      maxValue: 45,
      weight: 120,
      allowDuplicate: false,
      powerWeight: 1.2,
    },
    {
      statKey: "crit_rate_pct",
      name: "Tỉ Lệ Bắn Trúng Điểm Yếu",
      unit: "pct",
      minValue: 3,
      maxValue: 8,
      weight: 80,
      allowDuplicate: false,
      powerWeight: 5.0,
    },
    {
      statKey: "crit_dmg_pct",
      name: "Khuếch Đại Bạo Kích Pháo",
      unit: "pct",
      minValue: 8,
      maxValue: 22,
      weight: 70,
      allowDuplicate: false,
      powerWeight: 3.0,
    },
    {
      statKey: "armor_pen_pct",
      name: "Đầu Đạn Xuyên Thủng Vỏ",
      unit: "pct",
      minValue: 4,
      maxValue: 10,
      weight: 60,
      allowDuplicate: false,
      powerWeight: 5.5,
    },
    {
      statKey: "sp_cost_reduction_pct",
      name: "Bộ Tiết Kiệm Năng Lượng Lõi",
      unit: "pct",
      minValue: 5,
      maxValue: 15,
      weight: 50,
      allowDuplicate: false,
      powerWeight: 2.8,
    },
    {
      statKey: "spd_flat",
      name: "Gia Tốc Khai Hỏa Nhanh",
      unit: "flat",
      minValue: 3,
      maxValue: 8,
      weight: 40,
      allowDuplicate: false,
      powerWeight: 2.5,
    },
  ],
  fallbackCandidate: {
    statKey: "atk_flat",
    name: "Gia Cố Đạn Năng Lượng (Dự Phòng)",
    unit: "flat",
    minValue: 10,
    maxValue: 25,
    weight: 10,
    allowDuplicate: true,
    maxStacks: 6,
    powerWeight: 1.0,
  },
}

/**
 * 2. Template Valentine Vance — Thánh Vực Trường Lực Nano (Emerald Sanctuary)
 * Skill Type: SHIELD / HEAL
 * Signature Gear: Aegis
 */
export const VALENTINE_SYNERGY_TEMPLATE: PilotSynergySkillTemplate = {
  templateId: "tpl_val_aegis_sanctuary",
  pilotId: "valentine",
  name: "Thánh Vực Trường Lực Nano",
  nameEn: "Emerald Nano Sanctuary",
  description:
    "Valentine kích hoạt ma trận trường lực nano bao phủ buồng lái. Khi khiên bị vỡ hoặc đầu trận, tự động tái cấu trúc khiên cực nhanh và giảm chấn xung động.",
  skillType: "SHIELD",
  isPassive: true, // Passive tự kích hoạt khi vỡ khiên hoặc nhận đòn chí mạng
  triggerCondition: "on_shield_break",
  spCost: 0,
  cooldownTurns: 4,
  chargesPerBattle: 2,
  signatureGearId: "aegis",
  signatureBonusText:
    "+20% Dung lượng Khiên tối đa & Phản xạ thêm 10% sát thương khi khiên còn hoạt động",
  defaultMaxSkillLevel: 30,
  mainLineDef: {
    id: "main_sanctuary_shield",
    name: "Tái Tạo Khiên Năng Lượng Nano",
    descriptionFormat: "Lập tức tái tạo {value} điểm Khiên bảo vệ khi lớp phòng thủ bị đe dọa",
    baseValue: 180, // 180 Khiên ở Lv.1
    growthPerLevel: 14, // +14 Khiên mỗi level -> Lv.30 đạt ~586 Khiên
    minValue: 180,
    maxValue: 800,
    unit: "flat",
    powerMultiplier: 0.8,
  },
  milestoneLevels: [5, 10, 15, 20, 25, 30],
  maxSecondaryLines: 6,
  maxSkillPowerBudget: 850,
  candidatePool: [
    {
      statKey: "shield_flat",
      name: "Tăng Cường Dung Lượng Khiên",
      unit: "flat",
      minValue: 40,
      maxValue: 120,
      weight: 120,
      allowDuplicate: false,
      powerWeight: 0.8,
    },
    {
      statKey: "def_pct",
      name: "Gia Cố Giáp Nano Bền Vững",
      unit: "pct",
      minValue: 5,
      maxValue: 15,
      weight: 100,
      allowDuplicate: false,
      powerWeight: 4.0,
    },
    {
      statKey: "def_flat",
      name: "Phòng Ngự Vỏ Titan",
      unit: "flat",
      minValue: 12,
      maxValue: 36,
      weight: 90,
      allowDuplicate: false,
      powerWeight: 1.5,
    },
    {
      statKey: "status_resist_pct",
      name: "Kháng Nhiễu Trường Lực",
      unit: "pct",
      minValue: 10,
      maxValue: 25,
      weight: 70,
      allowDuplicate: false,
      powerWeight: 3.2,
    },
    {
      statKey: "sp_regen_flat",
      name: "Lưới Hấp Thu Tái Tạo SP",
      unit: "flat",
      minValue: 2,
      maxValue: 6,
      weight: 60,
      allowDuplicate: false,
      powerWeight: 5.0,
    },
    {
      statKey: "evasion_pct",
      name: "Trường Làm Lệch Đạn",
      unit: "pct",
      minValue: 3,
      maxValue: 7,
      weight: 50,
      allowDuplicate: false,
      powerWeight: 4.8,
    },
  ],
  fallbackCandidate: {
    statKey: "def_flat",
    name: "Tấm Lót Chống Va Đập (Dự Phòng)",
    unit: "flat",
    minValue: 8,
    maxValue: 20,
    weight: 10,
    allowDuplicate: true,
    maxStacks: 6,
    powerWeight: 1.2,
  },
}

/**
 * 3. Template Levi Reed (Alviss) — Tàn Ảnh Hư Không Siêu Tốc (Phantom Mirage)
 * Skill Type: FOLLOW_UP / BUFF
 * Signature Gear: Falcon
 */
export const LEVI_SYNERGY_TEMPLATE: PilotSynergySkillTemplate = {
  templateId: "tpl_levi_mach_phantom",
  pilotId: "alviss",
  name: "Tàn Ảnh Hư Không Siêu Tốc",
  nameEn: "Void Mirage Hyper-Drive",
  description:
    "Levi đẩy xung nhịp động cơ vượt giới hạn Mach, để lại chuỗi tàn ảnh lượng tử. Khi bạo kích hoặc né đòn thành công, tự động phản kích đòn chớp nhoáng.",
  skillType: "FOLLOW_UP",
  isPassive: true, // Tự động kích hoạt khi bạo kích hoặc né đòn
  triggerCondition: "on_crit",
  spCost: 0,
  cooldownTurns: 2,
  chargesPerBattle: 4,
  signatureGearId: "falcon",
  signatureBonusText:
    "+12% Tỉ lệ Né tránh & Đòn phản kích luôn mang thuộc tính Xuyên Giáp 25%",
  defaultMaxSkillLevel: 30,
  mainLineDef: {
    id: "main_phantom_strike",
    name: "Sát Thương Đột Kích Tàn Ảnh",
    descriptionFormat: "Đòn phản kích bão hòa gây {value}% sát thương tốc độ cao không tốn SP",
    baseValue: 60, // 60% ATK ở Lv.1
    growthPerLevel: 2.2, // +2.2% mỗi level -> Lv.30 đạt ~123.8%
    minValue: 60,
    maxValue: 180,
    unit: "pct",
    powerMultiplier: 2.5,
  },
  milestoneLevels: [5, 10, 15, 20, 25, 30],
  maxSecondaryLines: 6,
  maxSkillPowerBudget: 850,
  candidatePool: [
    {
      statKey: "spd_flat",
      name: "Tốc Độ Sáng Kiến Vượt Bậc",
      unit: "flat",
      minValue: 4,
      maxValue: 12,
      weight: 120,
      allowDuplicate: false,
      powerWeight: 3.5,
    },
    {
      statKey: "evasion_pct",
      name: "Thân Pháp Né Tránh Diệu Nghệ",
      unit: "pct",
      minValue: 4,
      maxValue: 10,
      weight: 100,
      allowDuplicate: false,
      powerWeight: 5.0,
    },
    {
      statKey: "crit_rate_pct",
      name: "Cảm Biến Điểm Yếu Mach",
      unit: "pct",
      minValue: 3,
      maxValue: 9,
      weight: 90,
      allowDuplicate: false,
      powerWeight: 4.8,
    },
    {
      statKey: "crit_dmg_pct",
      name: "Xung Lực Tia Chớp Bạo Kích",
      unit: "pct",
      minValue: 10,
      maxValue: 25,
      weight: 80,
      allowDuplicate: false,
      powerWeight: 3.2,
    },
    {
      statKey: "atk_pct",
      name: "Hỏa Lực Tiêm Kích Phản Lực",
      unit: "pct",
      minValue: 3,
      maxValue: 9,
      weight: 70,
      allowDuplicate: false,
      powerWeight: 4.2,
    },
    {
      statKey: "armor_pen_pct",
      name: "Mũi Khoan Laser Xuyên Vỏ",
      unit: "pct",
      minValue: 4,
      maxValue: 10,
      weight: 50,
      allowDuplicate: false,
      powerWeight: 5.0,
    },
  ],
  fallbackCandidate: {
    statKey: "spd_flat",
    name: "Vòi Phun Khí Động (Dự Phòng)",
    unit: "flat",
    minValue: 2,
    maxValue: 6,
    weight: 10,
    allowDuplicate: true,
    maxStacks: 6,
    powerWeight: 2.0,
  },
}

/**
 * 4. Template Eric Brandt — Pháo Xung Kích Hạt Nhân (Bunker Rupture)
 * Skill Type: DEBUFF / DAMAGE
 * Signature Gear: Vanguard (Pháo kích hạng nặng)
 */
export const ERIC_SYNERGY_TEMPLATE: PilotSynergySkillTemplate = {
  templateId: "tpl_eric_siege_rupture",
  pilotId: "eric",
  name: "Pháo Xung Kích Hạt Nhân Xuyên Thấu",
  nameEn: "Bunker Rupture Nuclear Blast",
  description:
    "Eric ngắm bắn chính xác vào khe hở kết cấu của đối thủ, bắn đạn pháo hạt nhân làm tan rã toàn bộ giáp bảo vệ và gây sát thương diện rộng.",
  skillType: "DEBUFF",
  isPassive: false, // Active Skill
  triggerCondition: "manual_active",
  spCost: 35,
  cooldownTurns: 4,
  chargesPerBattle: 2,
  signatureGearId: "vanguard",
  signatureBonusText:
    "Bỏ qua 100% Khiên của mục tiêu & Gây thêm hiệu ứng Ăn Mòn Acid 3 lượt",
  defaultMaxSkillLevel: 30,
  mainLineDef: {
    id: "main_rupture_pen",
    name: "Xuyên Giáp & Phá Hủy Kết Cấu",
    descriptionFormat: "Bắn đòn pháo hủy diệt gây {value}% sát thương và giảm 30% phòng thủ mục tiêu",
    baseValue: 155, // 155% ATK ở Lv.1
    growthPerLevel: 3.8, // +3.8% mỗi level -> Lv.30 đạt ~265.2%
    minValue: 155,
    maxValue: 320,
    unit: "pct",
    powerMultiplier: 2.3,
  },
  milestoneLevels: [5, 10, 15, 20, 25, 30],
  maxSecondaryLines: 6,
  maxSkillPowerBudget: 850,
  candidatePool: [
    {
      statKey: "armor_pen_pct",
      name: "Tăng Cường Xuyên Giáp Cố Định",
      unit: "pct",
      minValue: 6,
      maxValue: 15,
      weight: 120,
      allowDuplicate: false,
      powerWeight: 6.0,
    },
    {
      statKey: "atk_pct",
      name: "Gia Tăng Công Phá Pháo Chính",
      unit: "pct",
      minValue: 5,
      maxValue: 14,
      weight: 100,
      allowDuplicate: false,
      powerWeight: 4.5,
    },
    {
      statKey: "atk_flat",
      name: "Thuốc Nổ Hạt Nhân Nguyên Chất",
      unit: "flat",
      minValue: 20,
      maxValue: 50,
      weight: 90,
      allowDuplicate: false,
      powerWeight: 1.2,
    },
    {
      statKey: "crit_rate_pct",
      name: "Độ Chuẩn Xác Ống Nhắm Radar",
      unit: "pct",
      minValue: 3,
      maxValue: 8,
      weight: 70,
      allowDuplicate: false,
      powerWeight: 4.8,
    },
    {
      statKey: "def_flat",
      name: "Giáp Chống Sốc Pháo Kích",
      unit: "flat",
      minValue: 10,
      maxValue: 30,
      weight: 60,
      allowDuplicate: false,
      powerWeight: 1.5,
    },
    {
      statKey: "sp_cost_reduction_pct",
      name: "Cơ Chế Nạp Đạn Tự Động",
      unit: "pct",
      minValue: 4,
      maxValue: 12,
      weight: 50,
      allowDuplicate: false,
      powerWeight: 2.8,
    },
  ],
  fallbackCandidate: {
    statKey: "armor_pen_pct",
    name: "Đạn Thép Cường Lực (Dự Phòng)",
    unit: "pct",
    minValue: 3,
    maxValue: 8,
    weight: 10,
    allowDuplicate: true,
    maxStacks: 6,
    powerWeight: 4.0,
  },
}

/**
 * Bản đồ toàn bộ 4 Template Kỹ Năng Liên Hoàn
 */
export const PILOT_SYNERGY_TEMPLATES: Record<string, PilotSynergySkillTemplate> = {
  marcus: MARCUS_SYNERGY_TEMPLATE,
  valentine: VALENTINE_SYNERGY_TEMPLATE,
  alviss: LEVI_SYNERGY_TEMPLATE,
  eric: ERIC_SYNERGY_TEMPLATE,
}

/**
 * Lấy template tương ứng theo ID phi công
 */
export function getSynergyTemplateForPilot(pilotId: string): PilotSynergySkillTemplate {
  return PILOT_SYNERGY_TEMPLATES[pilotId] || MARCUS_SYNERGY_TEMPLATE
}
