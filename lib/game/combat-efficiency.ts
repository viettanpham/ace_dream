import { CombatState, CombatLogItem } from "@/lib/game/types"
import { StarfrontItem, StarfrontProgression } from "@/lib/game/types"

export type CombatEfficiencyGrade = "S+" | "S" | "A" | "B" | "C"

export interface CombatEfficiencyAxis {
  key: "damage" | "survivability" | "speed" | "precision" | "skill"
  label: string
  labelEn: string
  score: number // 0 - 100
  detail: string
  weight: number // %
}

export interface TurnDamageData {
  turn: number
  damageDealt: number
  damageTaken: number
  playerActions: string[]
  enemyActions: string[]
  isPlayerCrit?: boolean
  isPlayerEvade?: boolean
  playerSpSpent?: number
}

export interface CombatEfficiencyStats {
  turns: number
  totalDamageDealt: number
  totalDamageTaken: number
  damageRatio: number
  peakDamageDealt: number
  playerAttacksCount: number
  critsLanded: number
  critRate: number // %
  evadesCount: number
  hpRemaining: number
  hpMax: number
  hpRatio: number // %
  spRemaining: number
  spMax: number
  skillsUsedCount: number
  synergiesTriggered: number
}

export interface CombatEfficiencyReport {
  overallScore: number // 0 - 100
  grade: CombatEfficiencyGrade
  gradeTitle: string
  gradeTitleEn: string
  gradeDescription: string
  gradeColor: string
  gradeBorderColor: string
  gradeGlowColor: string
  gradeBadgeClass: string
  axes: CombatEfficiencyAxis[]
  stats: CombatEfficiencyStats
  turnBreakdown: TurnDamageData[]
}

/**
 * Phân tích chiến trường và tính toán chỉ số Hiệu Suất Tác Chiến (Combat Efficiency)
 * Dựa trên 5 trục chính: Sát Thương, Sinh Tồn, Tốc Độ/Vòng Đấu, Chuẩn Xác & Chí Mạng, Kỹ Năng & Năng Lượng.
 */
export function calculateCombatEfficiency(combatState: CombatState): CombatEfficiencyReport {
  const { player, enemy, turnNumber, logs = [] } = combatState

  // 1. Phân tích chi tiết từng lượt đấu từ nhật ký tác chiến
  const turnMap: Record<number, TurnDamageData> = {}
  for (let t = 1; t <= Math.max(1, turnNumber); t++) {
    turnMap[t] = {
      turn: t,
      damageDealt: 0,
      damageTaken: 0,
      playerActions: [],
      enemyActions: [],
      isPlayerCrit: false,
      isPlayerEvade: false,
      playerSpSpent: 0,
    }
  }

  let totalDamageDealt = 0
  let totalDamageTaken = 0
  let peakDamageDealt = 0
  let critsLanded = 0
  let playerAttacksCount = 0
  let evadesCount = 0
  let skillsUsedCount = 0
  let synergiesTriggered = 0

  // Duyệt qua nhật ký chiến đấu để trích xuất dữ liệu
  logs.forEach((log: CombatLogItem) => {
    const t = Math.max(1, Math.min(turnNumber, log.turn || 1))
    if (!turnMap[t]) {
      turnMap[t] = {
        turn: t,
        damageDealt: 0,
        damageTaken: 0,
        playerActions: [],
        enemyActions: [],
        isPlayerCrit: false,
        isPlayerEvade: false,
        playerSpSpent: 0,
      }
    }

    const currentTurn = turnMap[t]

    // Ghi nhận hành động người chơi
    if (log.type === "player-action" || log.actorName === player.name) {
      currentTurn.playerActions.push(log.text)
      if (log.type === "player-action") {
        playerAttacksCount++
        if (log.text.toLowerCase().includes("kỹ năng") || log.text.includes("[")) {
          skillsUsedCount++
        }
      }
    }

    // Ghi nhận kỹ năng hiệp đồng (pilot synergy)
    if (log.type === "pilot-synergy" || log.text.includes("[HIỆP ĐỒNG]") || log.text.includes("Synergy")) {
      synergiesTriggered++
    }

    // Ghi nhận hành động kẻ địch
    if (log.type === "enemy-action" || log.actorName === enemy.name) {
      currentTurn.enemyActions.push(log.text)
    }

    // Sát thương gây ra bởi người chơi
    if (log.actorName === player.name && log.value && log.value > 0) {
      currentTurn.damageDealt += log.value
      totalDamageDealt += log.value
      if (log.value > peakDamageDealt) {
        peakDamageDealt = log.value
      }
    }

    // Sát thương người chơi phải gánh chịu
    if (log.targetName === player.name && log.value && log.value > 0) {
      currentTurn.damageTaken += log.value
      totalDamageTaken += log.value
    } else if (log.actorName === enemy.name && log.value && log.value > 0) {
      currentTurn.damageTaken += log.value
      totalDamageTaken += log.value
    }

    // Đòn chí mạng
    if (log.type === "crit" || log.text.includes("Chí Mạng") || log.text.includes("CRIT")) {
      if (log.actorName === player.name || !log.actorName) {
        critsLanded++
        currentTurn.isPlayerCrit = true
      }
    }

    // Né tránh đòn
    if (log.type === "evade" || log.text.includes("Né Tránh") || log.text.includes("EVADE")) {
      if (log.targetName === player.name || log.actorName === player.name) {
        evadesCount++
        currentTurn.isPlayerEvade = true
      }
    }
  })

  // Nếu logs không ghi đủ sát thương (ví dụ trận ngắn 1 lượt), fallback tính từ enemy HP mất đi
  if (totalDamageDealt === 0 && enemy.maxHp) {
    totalDamageDealt = Math.max(0, enemy.maxHp - Math.max(0, enemy.hp))
    peakDamageDealt = totalDamageDealt
  }

  // Tỷ lệ máu người chơi còn lại
  const hpRemaining = Math.max(0, player.hp)
  const hpMax = Math.max(1, player.maxHp)
  const hpRatio = Math.round((hpRemaining / hpMax) * 100)

  // Tỷ lệ sát thương gây ra / gánh chịu
  const damageRatio =
    totalDamageTaken > 0
      ? Number((totalDamageDealt / totalDamageTaken).toFixed(2))
      : Number(totalDamageDealt.toFixed(2))

  // Tỷ lệ chí mạng
  const effectiveAttacks = Math.max(1, playerAttacksCount, turnNumber)
  const critRate = Math.min(100, Math.round((critsLanded / effectiveAttacks) * 100))

  // 2. TÍNH ĐIỂM 5 TRỤC HIỆU SUẤT (Mỗi trục thang điểm 0 - 100)

  // Trục 1: SÁT THƯƠNG TÁC CHIẾN (Damage Output)
  // Đánh giá dựa trên DPS trung bình mỗi lượt và sát thương đỉnh điểm
  const averageDps = totalDamageDealt / Math.max(1, turnNumber)
  const baselineDps = (enemy.maxHp || 300) / 4 // Chuẩn 4 lượt tiêu diệt
  let damageScore = Math.round(50 + (averageDps / Math.max(1, baselineDps)) * 35)
  if (peakDamageDealt > baselineDps * 1.2) damageScore += 10
  damageScore = Math.max(35, Math.min(100, damageScore))

  // Trục 2: SINH TỒN & CHỐNG CHỊU (Survivability)
  // Dựa trên % HP còn lại khi chiến thắng
  let survivabilityScore = Math.round(hpRatio * 0.75 + (totalDamageTaken === 0 ? 25 : Math.max(0, 25 - (totalDamageTaken / hpMax) * 15)))
  survivabilityScore = Math.max(30, Math.min(100, survivabilityScore))

  // Trục 3: TỐC ĐỘ & VÒNG ĐẤU (Speed & Turn Economy)
  // Hoàn thành càng ít lượt điểm càng cao
  let targetTurns = 4
  if (enemy.maxHp > 600) targetTurns = 6
  if (enemy.maxHp > 1000) targetTurns = 8

  let speedScore = 100
  if (turnNumber <= targetTurns - 1) {
    speedScore = 100
  } else if (turnNumber <= targetTurns) {
    speedScore = 92
  } else {
    speedScore = Math.max(30, 92 - (turnNumber - targetTurns) * 12)
  }

  // Trục 4: CHUẨN XÁC & CHÍ MẠNG (Precision & Crits)
  let precisionScore = 65
  if (critsLanded > 0) precisionScore += Math.min(25, critsLanded * 10)
  if (evadesCount > 0) precisionScore += Math.min(15, evadesCount * 8)
  if (critRate >= 40) precisionScore += 10
  precisionScore = Math.max(40, Math.min(100, precisionScore))

  // Trục 5: KỸ NĂNG & HIỆP ĐỒNG (Skill Mastery & Synergy)
  let skillScore = 70
  if (skillsUsedCount >= 2) skillScore += 10
  if (synergiesTriggered > 0) skillScore += 15
  if (player.sp > 0) skillScore += 5
  skillScore = Math.max(45, Math.min(100, skillScore))

  // 3. TÍNH ĐIỂM TỔNG HỢP (Overall Composite Score: 0 - 100)
  // Trọng số: Sát thương 25%, Sinh tồn 25%, Tốc độ 20%, Chuẩn xác 15%, Kỹ năng 15%
  const overallScore = Math.round(
    damageScore * 0.25 +
      survivabilityScore * 0.25 +
      speedScore * 0.2 +
      precisionScore * 0.15 +
      skillScore * 0.15,
  )

  // 4. PHÂN HẠNG CHIẾN TÍCH (Grade)
  let grade: CombatEfficiencyGrade = "C"
  let gradeTitle = "SỐNG SÓT QUA HIỂM NGUY"
  let gradeTitleEn = "SURVIVOR RATING"
  let gradeDescription = "Chiến thắng đầy nhọc nhằn. Thân giáp chịu nhiều hư hại, cần tối ưu hóa hỏa lực và nhịp xuất kích."
  let gradeColor = "#f43f5e" // rose-500
  let gradeBorderColor = "border-rose-500/60"
  let gradeGlowColor = "rgba(244, 63, 94, 0.3)"
  let gradeBadgeClass = "bg-rose-950/80 text-rose-300 border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.3)]"

  if (overallScore >= 95) {
    grade = "S+"
    gradeTitle = "CHIẾN ĐẤU HOÀN HẢO // APEX ACE"
    gradeTitleEn = "APEX ACE PERFORMER"
    gradeDescription = "Hỏa lực áp đảo tuyệt đối, né tránh và dồn sát thương không tì vết. Chiến thuật mẫu mực của phi công cấp cao."
    gradeColor = "#10b981" // emerald-500
    gradeBorderColor = "border-emerald-400"
    gradeGlowColor = "rgba(16, 185, 129, 0.4)"
    gradeBadgeClass = "bg-emerald-950/80 text-emerald-300 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
  } else if (overallScore >= 85) {
    grade = "S"
    gradeTitle = "HIỆU SUẤT XUẤT SẮC // ELITE ACE"
    gradeTitleEn = "ELITE ACE RATING"
    gradeDescription = "Kiểm soát nhịp độ tác chiến vượt trội. Hạ gục mục tiêu nhanh gọn và bảo toàn hoàn hảo vỏ giáp chiến đấu."
    gradeColor = "#06b6d4" // cyan-500
    gradeBorderColor = "border-cyan-400"
    gradeGlowColor = "rgba(6, 182, 212, 0.35)"
    gradeBadgeClass = "bg-cyan-950/80 text-cyan-300 border-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.4)]"
  } else if (overallScore >= 75) {
    grade = "A"
    gradeTitle = "TÁC CHIẾN CHUYÊN NGHIỆP // VETERAN"
    gradeTitleEn = "COMBAT VETERAN RATING"
    gradeDescription = "Hoàn thành mục tiêu tác chiến chuẩn mực. Phối hợp kỹ năng vững vàng và dứt điểm mục tiêu đúng kế hoạch."
    gradeColor = "#8b5cf6" // purple-500
    gradeBorderColor = "border-purple-400"
    gradeGlowColor = "rgba(139, 92, 246, 0.3)"
    gradeBadgeClass = "bg-purple-950/80 text-purple-300 border-purple-400 shadow-[0_0_15px_rgba(139,92,246,0.35)]"
  } else if (overallScore >= 60) {
    grade = "B"
    gradeTitle = "HOÀN THÀNH MỤC TIÊU // OPERATIVE"
    gradeTitleEn = "FIELD OPERATIVE RATING"
    gradeDescription = "Mục tiêu bị tiêu diệt nhưng tiêu hao năng lượng và thời gian khá lớn. Đề xuất nâng cấp trang bị hoặc cường hóa kỹ năng."
    gradeColor = "#f59e0b" // amber-500
    gradeBorderColor = "border-amber-400"
    gradeGlowColor = "rgba(245, 158, 11, 0.3)"
    gradeBadgeClass = "bg-amber-950/80 text-amber-300 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
  }

  const axes: CombatEfficiencyAxis[] = [
    {
      key: "damage",
      label: "Sát Thương",
      labelEn: "Damage Output",
      score: damageScore,
      detail: `${totalDamageDealt} dmg tổng · Đỉnh: ${peakDamageDealt}`,
      weight: 25,
    },
    {
      key: "survivability",
      label: "Sinh Tồn",
      labelEn: "Survivability",
      score: survivabilityScore,
      detail: `${hpRatio}% HP còn lại · Bị thương ${totalDamageTaken}`,
      weight: 25,
    },
    {
      key: "speed",
      label: "Tốc Độ",
      labelEn: "Speed Economy",
      score: speedScore,
      detail: `${turnNumber} vòng chiến đấu (Mục tiêu: ≤${targetTurns})`,
      weight: 20,
    },
    {
      key: "precision",
      label: "Chuẩn Xác",
      labelEn: "Precision & Crits",
      score: precisionScore,
      detail: `${critsLanded} đòn chí mạng (${critRate}%) · ${evadesCount} né tránh`,
      weight: 15,
    },
    {
      key: "skill",
      label: "Kỹ Năng",
      labelEn: "Skill Mastery",
      score: skillScore,
      detail: `${skillsUsedCount} chiêu · ${synergiesTriggered} hiệp đồng`,
      weight: 15,
    },
  ]

  const turnBreakdown: TurnDamageData[] = Object.values(turnMap).sort((a, b) => a.turn - b.turn)

  return {
    overallScore,
    grade,
    gradeTitle,
    gradeTitleEn,
    gradeDescription,
    gradeColor,
    gradeBorderColor,
    gradeGlowColor,
    gradeBadgeClass,
    axes,
    stats: {
      turns: turnNumber,
      totalDamageDealt,
      totalDamageTaken,
      damageRatio,
      peakDamageDealt,
      playerAttacksCount,
      critsLanded,
      critRate,
      evadesCount,
      hpRemaining,
      hpMax,
      hpRatio,
      spRemaining: Math.max(0, player.sp),
      spMax: Math.max(1, player.maxSp),
      skillsUsedCount,
      synergiesTriggered,
    },
    turnBreakdown,
  }
}
