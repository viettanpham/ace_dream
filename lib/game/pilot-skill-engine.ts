/**
 * STARFRONT — Phase 5.9: Pilot Skill Liên Hoàn Engine
 * Logic Khởi tạo, Tăng cấp Tuần tự, Mở Milestone, Reroll, Normalization & Tính Skill Power
 */

import type { StarfrontGearId } from "./types"
import type {
  GlobalAdminConfig,
  PilotSynergySkillInstance,
  PilotSynergySkillTemplate,
  RerollOptions,
  RerollResult,
  SecondaryAttributeCandidate,
  SkillMainLine,
  SkillSecondaryLine,
} from "./pilot-skill-types"
import { getSynergyTemplateForPilot } from "./pilot-skill-templates"

/**
 * Cấu hình Admin toàn cục mặc định
 */
export const DEFAULT_GLOBAL_ADMIN_CONFIG: GlobalAdminConfig = {
  globalMaxPilotLevel: 120,
  globalMaxSkillLevel: 30,
  priorityMode: "TEMPLATE_OVERRIDE",
  lastModified: Date.now(),
}

/**
 * Xác định giới hạn cấp độ Skill áp dụng dựa trên Priority Mode
 */
export function resolveEffectiveMaxSkillLevel(
  template: PilotSynergySkillTemplate,
  globalConfig?: GlobalAdminConfig,
): number {
  const config = globalConfig || DEFAULT_GLOBAL_ADMIN_CONFIG
  if (config.priorityMode === "GLOBAL_PRIORITY") {
    return Math.max(1, config.globalMaxSkillLevel)
  }
  // TEMPLATE_OVERRIDE: Ưu tiên template
  const override = config.templateOverrides?.[template.templateId]?.maxSkillLevel
  if (override !== undefined && override > 0) {
    return override
  }
  return template.defaultMaxSkillLevel || 30
}

/**
 * Tính toán Skill Power tổng hợp cho kỹ năng liên hoàn
 */
export function calculateSkillPower(
  skill: PilotSynergySkillInstance,
  template: PilotSynergySkillTemplate,
): number {
  // 1. Đóng góp từ Main Line
  const mainDef = template.mainLineDef
  const mainGrowthRatio = skill.mainLine.currentValue / Math.max(1, mainDef.baseValue)
  const mainPower = Math.round(100 * mainGrowthRatio * mainDef.powerMultiplier)

  // 2. Đóng góp từ các Secondary Lines
  let secondaryPower = 0
  for (const line of skill.secondaryLines) {
    const candidate =
      template.candidatePool.find((c) => c.statKey === line.statKey) ||
      template.fallbackCandidate
    const valueRatio = line.value / Math.max(1, candidate.maxValue)
    const linePwr = Math.round(50 * valueRatio * (candidate.powerWeight || 1.0))
    line.powerContribution = linePwr
    secondaryPower += linePwr
  }

  const rawTotal = mainPower + secondaryPower
  return Math.min(template.maxSkillPowerBudget, Math.max(50, rawTotal))
}

/**
 * Tạo giá trị ngẫu nhiên trong khoảng min/max của thuộc tính
 */
function rollCandidateValue(candidate: SecondaryAttributeCandidate): number {
  const range = candidate.maxValue - candidate.minValue
  const roll = candidate.minValue + Math.random() * range
  return candidate.unit === "flat" ? Math.round(roll) : Number(roll.toFixed(1))
}

/**
 * Lọc candidate pool hợp lệ cho việc random dòng phụ mới
 */
function getValidCandidates(
  pool: SecondaryAttributeCandidate[],
  existingLines: SkillSecondaryLine[],
  excludedStatKey?: string,
): SecondaryAttributeCandidate[] {
  return pool.filter((cand) => {
    if (excludedStatKey && cand.statKey === excludedStatKey) {
      return false
    }
    if (!cand.allowDuplicate) {
      const alreadyHas = existingLines.some((l) => l.statKey === cand.statKey)
      if (alreadyHas) return false
    } else if (cand.maxStacks) {
      const count = existingLines.filter((l) => l.statKey === cand.statKey).length
      if (count >= cand.maxStacks) return false
    }
    return true
  })
}

/**
 * Khởi tạo một dòng phụ mới tại một milestone
 */
function generateSecondaryLine(
  milestoneLevel: number,
  template: PilotSynergySkillTemplate,
  existingLines: SkillSecondaryLine[],
): SkillSecondaryLine {
  const validCandidates = getValidCandidates(template.candidatePool, existingLines)

  let selectedCandidate: SecondaryAttributeCandidate
  let isFallback = false

  if (validCandidates.length > 0) {
    // Chọn theo trọng số weight
    const totalWeight = validCandidates.reduce((sum, c) => sum + c.weight, 0)
    let randomWeight = Math.random() * totalWeight
    selectedCandidate = validCandidates[0]
    for (const c of validCandidates) {
      randomWeight -= c.weight
      if (randomWeight <= 0) {
        selectedCandidate = c
        break
      }
    }
  } else {
    // Hết candidate -> Dùng template fallback
    selectedCandidate = template.fallbackCandidate
    isFallback = true
  }

  const value = rollCandidateValue(selectedCandidate)

  return {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    unlockedAtSkillLevel: milestoneLevel,
    statKey: selectedCandidate.statKey,
    name: selectedCandidate.name,
    value,
    unit: selectedCandidate.unit,
    powerContribution: 0,
    isFallback,
  }
}

/**
 * Khởi tạo Skill Liên Hoàn lần đầu duy nhất cho một Phi Công
 */
export function createInitialPilotSynergySkill(
  pilotId: string,
  pilotLevel: number = 1,
  globalConfig?: GlobalAdminConfig,
): PilotSynergySkillInstance {
  const template = getSynergyTemplateForPilot(pilotId)
  const maxSkillLevel = resolveEffectiveMaxSkillLevel(template, globalConfig)
  const initialSkillLevel = 1

  const mainVal = template.mainLineDef.baseValue

  const mainLine: SkillMainLine = {
    id: template.mainLineDef.id,
    name: template.mainLineDef.name,
    description: template.mainLineDef.descriptionFormat.replace("{value}", String(mainVal)),
    baseValue: template.mainLineDef.baseValue,
    growthPerLevel: template.mainLineDef.growthPerLevel,
    minValue: template.mainLineDef.minValue,
    maxValue: template.mainLineDef.maxValue,
    unit: template.mainLineDef.unit,
    currentValue: mainVal,
  }

  const instance: PilotSynergySkillInstance = {
    id: `pskill-${pilotId}-${Date.now()}`,
    pilotId,
    templateId: template.templateId,
    name: template.name,
    nameEn: template.nameEn,
    skillType: template.skillType,
    isPassive: template.isPassive,
    triggerCondition: template.triggerCondition,
    spCost: template.spCost,
    cooldownTurns: template.cooldownTurns,
    chargesPerBattle: template.chargesPerBattle,
    signatureGearId: template.signatureGearId,
    skillLevel: initialSkillLevel,
    maxSkillLevel,
    skillPower: 0,
    mainLine,
    secondaryLines: [],
    signatureSynergyActive: false,
    createdAt: Date.now(),
    lastUpdated: Date.now(),
  }

  instance.skillPower = calculateSkillPower(instance, template)

  // Nếu pilot đã có level cao hơn 1 (vd load save cũ), tiến hóa tuần tự tới level đó
  if (pilotLevel > 1) {
    return advancePilotSynergySkill(instance, pilotLevel, globalConfig)
  }

  return instance
}

/**
 * Tăng tiến Skill Level theo Pilot Level
 * Xử lý tuần tự từng level để KHÔNG BỎ QUA bất kỳ milestone nào (chia hết cho 5)!
 */
export function advancePilotSynergySkill(
  currentSkill: PilotSynergySkillInstance,
  targetPilotLevel: number,
  globalConfig?: GlobalAdminConfig,
): PilotSynergySkillInstance {
  const template = getSynergyTemplateForPilot(currentSkill.pilotId)
  const maxLevel = resolveEffectiveMaxSkillLevel(template, globalConfig)
  const targetSkillLevel = Math.min(maxLevel, targetPilotLevel)

  if (targetSkillLevel <= currentSkill.skillLevel && currentSkill.maxSkillLevel === maxLevel) {
    return currentSkill
  }

  const updatedLines = [...currentSkill.secondaryLines]
  let currentLvl = currentSkill.skillLevel

  // Xử lý tuần tự từng level
  while (currentLvl < targetSkillLevel) {
    currentLvl += 1

    // Kiểm tra mốc milestone chia hết cho 5 (5, 10, 15, 20, 25, 30)
    if (
      currentLvl % 5 === 0 &&
      template.milestoneLevels.includes(currentLvl) &&
      updatedLines.length < template.maxSecondaryLines
    ) {
      // Chỉ mở dòng nếu milestone này chưa được mở
      const alreadyHasMilestone = updatedLines.some(
        (l) => l.unlockedAtSkillLevel === currentLvl,
      )
      if (!alreadyHasMilestone) {
        const newLine = generateSecondaryLine(currentLvl, template, updatedLines)
        updatedLines.push(newLine)
      }
    }
  }

  // Cập nhật giá trị main line
  const mainGrowth =
    template.mainLineDef.baseValue +
    (currentLvl - 1) * template.mainLineDef.growthPerLevel
  const clampedMainVal = Math.min(
    template.mainLineDef.maxValue,
    Math.max(template.mainLineDef.minValue, Number(mainGrowth.toFixed(1))),
  )

  const updatedMainLine: SkillMainLine = {
    ...currentSkill.mainLine,
    currentValue: clampedMainVal,
    description: template.mainLineDef.descriptionFormat.replace(
      "{value}",
      String(clampedMainVal),
    ),
  }

  const updatedSkill: PilotSynergySkillInstance = {
    ...currentSkill,
    skillLevel: currentLvl,
    maxSkillLevel: maxLevel,
    mainLine: updatedMainLine,
    secondaryLines: updatedLines,
    lastUpdated: Date.now(),
  }

  updatedSkill.skillPower = calculateSkillPower(updatedSkill, template)
  return updatedSkill
}

/**
 * Thực hiện Reroll dòng phụ (Random hoặc Targeted)
 * - Reroll áp dụng ngay lập tức
 * - Giữ nguyên số lượng dòng và vị trí dòng
 * - Không thay đổi các dòng khác
 */
export function rerollPilotSecondaryLine(
  skill: PilotSynergySkillInstance,
  options: RerollOptions,
): RerollResult {
  const template = getSynergyTemplateForPilot(skill.pilotId)
  const lines = [...skill.secondaryLines]

  if (lines.length === 0) {
    return {
      success: false,
      message: "Kỹ năng chưa mở dòng phụ nào để reroll! Hãy nâng cấp phi công đạt mốc cấp 5.",
      updatedSkill: skill,
      changedLineIndex: -1,
      oldLine: {} as SkillSecondaryLine,
      newLine: {} as SkillSecondaryLine,
    }
  }

  // Xác định dòng mục tiêu
  let targetIndex: number
  if (options.type === "targeted" && options.targetLineIndex !== undefined) {
    if (options.targetLineIndex < 0 || options.targetLineIndex >= lines.length) {
      return {
        success: false,
        message: "Chỉ số dòng phụ chỉ định không hợp lệ!",
        updatedSkill: skill,
        changedLineIndex: -1,
        oldLine: {} as SkillSecondaryLine,
        newLine: {} as SkillSecondaryLine,
      }
    }
    targetIndex = options.targetLineIndex
  } else {
    // Random: Tự chọn ngẫu nhiên một dòng
    targetIndex = Math.floor(Math.random() * lines.length)
  }

  const oldLine = lines[targetIndex]
  const otherLines = lines.filter((_, idx) => idx !== targetIndex)

  // 1. Tính candidate pool hợp lệ (loại trừ các thuộc tính không cho phép duplicate từ otherLines)
  const validCandidates = getValidCandidates(template.candidatePool, otherLines)

  let selectedCandidate: SecondaryAttributeCandidate
  let isFallback = false

  if (validCandidates.length > 0) {
    // Có thể xuất hiện lại thuộc tính cũ nếu thuộc tính đó nằm trong pool hợp lệ
    const totalWeight = validCandidates.reduce((sum, c) => sum + c.weight, 0)
    let randomWeight = Math.random() * totalWeight
    selectedCandidate = validCandidates[0]
    for (const c of validCandidates) {
      randomWeight -= c.weight
      if (randomWeight <= 0) {
        selectedCandidate = c
        break
      }
    }
  } else {
    selectedCandidate = template.fallbackCandidate
    isFallback = true
  }

  const newValue = rollCandidateValue(selectedCandidate)

  const newLine: SkillSecondaryLine = {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    unlockedAtSkillLevel: oldLine.unlockedAtSkillLevel, // Giữ nguyên mốc milestone ban đầu
    statKey: selectedCandidate.statKey,
    name: selectedCandidate.name,
    value: newValue,
    unit: selectedCandidate.unit,
    powerContribution: 0,
    isFallback,
  }

  // Ghi đè dòng mục tiêu tại đúng vị trí
  lines[targetIndex] = newLine

  const updatedSkill: PilotSynergySkillInstance = {
    ...skill,
    secondaryLines: lines,
    lastUpdated: Date.now(),
  }

  updatedSkill.skillPower = calculateSkillPower(updatedSkill, template)

  return {
    success: true,
    message: `Reroll thành công dòng ${targetIndex + 1}: ${oldLine.name} (${oldLine.value}${oldLine.unit === "pct" ? "%" : ""}) ➔ ${newLine.name} (+${newLine.value}${newLine.unit === "pct" ? "%" : ""})!`,
    updatedSkill,
    changedLineIndex: targetIndex,
    oldLine,
    newLine,
  }
}

/**
 * Chuẩn hóa dữ liệu Kỹ năng khi cấu hình hoặc template thay đổi (Normalization Engine)
 * - Clamp giá trị vượt min/max
 * - Thay thế thuộc tính không hợp lệ bằng thuộc tính hợp lệ / fallback
 * - Điều chỉnh số lượng dòng nếu trần thay đổi
 * - Bảo toàn dữ liệu hợp lệ, KHÔNG random lại dữ liệu đúng
 */
export function normalizePilotSynergySkill(
  skill: PilotSynergySkillInstance,
  globalConfig?: GlobalAdminConfig,
): PilotSynergySkillInstance {
  const template = getSynergyTemplateForPilot(skill.pilotId)
  const effectiveMaxLevel = resolveEffectiveMaxSkillLevel(template, globalConfig)

  // 1. Chuẩn hóa Skill Level
  const clampedSkillLevel = Math.min(
    effectiveMaxLevel,
    Math.max(1, skill.skillLevel),
  )

  // 2. Chuẩn hóa Main Line (clamp min/max)
  const clampedMainVal = Math.min(
    template.mainLineDef.maxValue,
    Math.max(template.mainLineDef.minValue, skill.mainLine.currentValue),
  )
  const normalizedMainLine: SkillMainLine = {
    ...skill.mainLine,
    currentValue: clampedMainVal,
    description: template.mainLineDef.descriptionFormat.replace(
      "{value}",
      String(clampedMainVal),
    ),
  }

  // 3. Chuẩn hóa Secondary Lines
  let normalizedLines = [...skill.secondaryLines]

  // Giới hạn số lượng dòng tối đa
  if (normalizedLines.length > template.maxSecondaryLines) {
    normalizedLines = normalizedLines.slice(0, template.maxSecondaryLines)
  }

  // Kiểm tra từng dòng
  normalizedLines = normalizedLines.map((line) => {
    const candidate =
      template.candidatePool.find((c) => c.statKey === line.statKey) ||
      template.fallbackCandidate
    const clampedVal = Math.min(
      candidate.maxValue,
      Math.max(candidate.minValue, line.value),
    )
    return {
      ...line,
      name: candidate.name,
      unit: candidate.unit,
      value: clampedVal,
    }
  })

  // Nếu thiếu dòng so với milestone đã đạt, bổ sung dòng còn thiếu
  const reachedMilestones = template.milestoneLevels.filter(
    (m) => m <= clampedSkillLevel,
  )
  for (const m of reachedMilestones) {
    if (
      normalizedLines.length < template.maxSecondaryLines &&
      !normalizedLines.some((l) => l.unlockedAtSkillLevel === m)
    ) {
      const added = generateSecondaryLine(m, template, normalizedLines)
      normalizedLines.push(added)
    }
  }

  const normalizedSkill: PilotSynergySkillInstance = {
    ...skill,
    skillLevel: clampedSkillLevel,
    maxSkillLevel: effectiveMaxLevel,
    mainLine: normalizedMainLine,
    secondaryLines: normalizedLines,
    lastUpdated: Date.now(),
  }

  normalizedSkill.skillPower = calculateSkillPower(normalizedSkill, template)
  return normalizedSkill
}

/**
 * Kiểm tra trạng thái Hiệp Đồng Cơ Giáp Đặc Trưng (Signature Synergy)
 */
export function checkSignatureSynergyActive(
  skill: PilotSynergySkillInstance,
  currentGearId: StarfrontGearId,
): boolean {
  return skill.signatureGearId === currentGearId
}
