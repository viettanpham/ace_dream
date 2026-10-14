/**
 * STARFRONT WORLD — Pilot Survival & Search-and-Rescue (SAR) Engine (Phase 6.34)
 *
 * Triển khai cơ chế cứu hộ, xác suất sinh tồn và quản lý sổ bộ tù binh (National POW Registry)
 * Tuân thủ nghiêm ngặt Bất Biến Hệ Thống: GEAR HP = 0 => GEAR DESTROYED, Phi công thoát hiểm độc lập.
 */

import type {
  PilotSurvivalTier,
  PilotFinalStatus,
  SurvivalConfig,
  PilotSurvivalScoreBreakdown,
  PilotSurvivalRecord,
  CapturedPilotRecord,
} from "./pilot-survival-types"
import type { CombatSide, DownedPilotCandidate, CombatV2ForceAggregate } from "./combat-v2-types"
import type { WorldState } from "./types"
import { createMissionDispatch } from "./mission-dispatch"

/**
 * Cấu hình chuẩn định mức (Design Source of Truth) từ docs/WORLD_ADMINCP_CONFIG_REFERENCE.md
 */
export const DEFAULT_SURVIVAL_CONFIG: SurvivalConfig = {
  thresholdSafe: 70, // APPROVED DEFAULT: >= 70
  thresholdProtected: 50, // APPROVED DEFAULT: 50 - 69
  thresholdCritical: 30, // APPROVED DEFAULT: 30 - 49 (Dưới 30 là KIA)
  baseRescueChance: 0.30, // CONCEPTUAL EXAMPLE: 30%
  baseCaptureChance: 0.40, // CONCEPTUAL EXAMPLE: 40%
  facilityRescuePowerBonusPerTier: 0.10, // CONCEPTUAL EXAMPLE: +10% mỗi cấp
  alliedVictoryRescueBonus: 0.35, // CONCEPTUAL BONUS: +35% khi làm chủ chiến trường
  lastModified: 0,
}

/**
 * Trích xuất SurvivalConfig hiện hành từ WorldState hoặc dùng mặc định an toàn
 */
export function getSurvivalConfig(state?: Partial<WorldState> | null): SurvivalConfig {
  if (!state?.survivalConfig) {
    return { ...DEFAULT_SURVIVAL_CONFIG }
  }
  const cfg = state.survivalConfig
  return {
    thresholdSafe: typeof cfg.thresholdSafe === "number" ? cfg.thresholdSafe : DEFAULT_SURVIVAL_CONFIG.thresholdSafe,
    thresholdProtected: typeof cfg.thresholdProtected === "number" ? cfg.thresholdProtected : DEFAULT_SURVIVAL_CONFIG.thresholdProtected,
    thresholdCritical: typeof cfg.thresholdCritical === "number" ? cfg.thresholdCritical : DEFAULT_SURVIVAL_CONFIG.thresholdCritical,
    baseRescueChance: typeof cfg.baseRescueChance === "number" ? cfg.baseRescueChance : DEFAULT_SURVIVAL_CONFIG.baseRescueChance,
    baseCaptureChance: typeof cfg.baseCaptureChance === "number" ? cfg.baseCaptureChance : DEFAULT_SURVIVAL_CONFIG.baseCaptureChance,
    facilityRescuePowerBonusPerTier: typeof cfg.facilityRescuePowerBonusPerTier === "number" ? cfg.facilityRescuePowerBonusPerTier : DEFAULT_SURVIVAL_CONFIG.facilityRescuePowerBonusPerTier,
    alliedVictoryRescueBonus: typeof cfg.alliedVictoryRescueBonus === "number" ? cfg.alliedVictoryRescueBonus : DEFAULT_SURVIVAL_CONFIG.alliedVictoryRescueBonus,
    lastModified: cfg.lastModified || 0,
  }
}

/**
 * Kiểm tra tính hợp lệ của SurvivalConfig
 */
export function validateSurvivalConfig(cfg: Partial<SurvivalConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (typeof cfg.thresholdSafe !== "number" || isNaN(cfg.thresholdSafe) || cfg.thresholdSafe < 0 || cfg.thresholdSafe > 100) {
    errors.push("Ngưỡng SAFE phải là số từ 0 đến 100.")
  }
  if (typeof cfg.thresholdProtected !== "number" || isNaN(cfg.thresholdProtected) || cfg.thresholdProtected < 0 || cfg.thresholdProtected > 100) {
    errors.push("Ngưỡng PROTECTED phải là số từ 0 đến 100.")
  }
  if (typeof cfg.thresholdCritical !== "number" || isNaN(cfg.thresholdCritical) || cfg.thresholdCritical < 0 || cfg.thresholdCritical > 100) {
    errors.push("Ngưỡng CRITICAL phải là số từ 0 đến 100.")
  }

  if (typeof cfg.thresholdSafe === "number" && typeof cfg.thresholdProtected === "number" && cfg.thresholdSafe <= cfg.thresholdProtected) {
    errors.push("Ngưỡng SAFE phải lớn hơn ngưỡng PROTECTED.")
  }
  if (typeof cfg.thresholdProtected === "number" && typeof cfg.thresholdCritical === "number" && cfg.thresholdProtected <= cfg.thresholdCritical) {
    errors.push("Ngưỡng PROTECTED phải lớn hơn ngưỡng CRITICAL.")
  }

  if (typeof cfg.baseRescueChance !== "number" || isNaN(cfg.baseRescueChance) || cfg.baseRescueChance < 0 || cfg.baseRescueChance > 1) {
    errors.push("Xác suất giải cứu cơ sở phải từ 0.0 đến 1.0 (0% - 100%).")
  }
  if (typeof cfg.baseCaptureChance !== "number" || isNaN(cfg.baseCaptureChance) || cfg.baseCaptureChance < 0 || cfg.baseCaptureChance > 1) {
    errors.push("Xác suất bắt giữ cơ sở phải từ 0.0 đến 1.0 (0% - 100%).")
  }
  if (typeof cfg.facilityRescuePowerBonusPerTier !== "number" || isNaN(cfg.facilityRescuePowerBonusPerTier) || cfg.facilityRescuePowerBonusPerTier < 0 || cfg.facilityRescuePowerBonusPerTier > 1) {
    errors.push("Thưởng cơ sở SAR trên mỗi cấp phải từ 0.0 đến 1.0.")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Tham số đầu vào để tính toán Điểm số Sinh tồn (Survival Score)
 */
export interface PilotSurvivalCalculationInput {
  alliedRemainingHp: number
  alliedMaxHp: number
  enemyRemainingHp: number
  enemyMaxHp: number
  alliedActiveCount: number
  enemyActiveCount: number
  alliedCommanderActive?: boolean
  enemyOffensivePower?: number
  alliedOffensivePower?: number
  hasActiveSupport?: boolean
  alliedMorale?: number
  isPlayer?: boolean
  destructionRound?: number
}

/**
 * Tính toán Điểm số Sinh tồn (0 - 100) dựa trên bối cảnh chiến trường tại hiệp cỗ máy bị tiêu diệt
 */
export function calculatePilotSurvivalScore(input: PilotSurvivalCalculationInput): {
  score: number
  breakdown: PilotSurvivalScoreBreakdown
} {
  // 1. Độ tin cậy cơ sở của khoang phóng thoát hiểm STARFRONT
  const baseReliability = 50

  // 2. Tỷ lệ tương quan lực lượng (Force Balance)
  const totalHp = input.alliedRemainingHp + input.enemyRemainingHp
  const alliedRatio = totalHp > 0 ? input.alliedRemainingHp / totalHp : 0.5
  // Dao động từ -15 (thất thế hoàn toàn) đến +15 (áp đảo hoàn toàn)
  const forceBalanceModifier = Math.round((alliedRatio - 0.5) * 30)

  // 3. Sự che chở của đồng minh (Allied Protection)
  let alliedProtectionModifier = 0
  if (input.alliedActiveCount >= 3) {
    alliedProtectionModifier += 10
  } else if (input.alliedActiveCount >= 1) {
    alliedProtectionModifier += 5
  }
  if (input.alliedCommanderActive) {
    alliedProtectionModifier += 5
  }
  alliedProtectionModifier = Math.min(15, alliedProtectionModifier)

  // 4. Áp lực hỏa lực của kẻ địch (Enemy Pressure)
  let enemyPressureModifier = 0
  if (input.enemyActiveCount >= 3) {
    enemyPressureModifier -= 10
  } else if (input.enemyActiveCount >= 1) {
    enemyPressureModifier -= 5
  }
  if (
    input.enemyOffensivePower !== undefined &&
    input.alliedOffensivePower !== undefined &&
    input.enemyOffensivePower > input.alliedOffensivePower * 1.5
  ) {
    enemyPressureModifier -= 5
  }
  enemyPressureModifier = Math.max(-15, enemyPressureModifier)

  // 5. Yểm trợ chiến thuật từ mẫu hạm / trạm không gian (Support Modifier)
  const supportModifier = input.hasActiveSupport ? 10 : 0

  // 6. Sĩ khí quân đội (Morale Modifier)
  let moraleModifier = 0
  if (input.alliedMorale !== undefined) {
    if (input.alliedMorale >= 80) {
      moraleModifier += 5
    } else if (input.alliedMorale <= 30) {
      moraleModifier -= 10
    }
  }

  // Tổng hợp và kẹp chặt trong khoảng [0..100]
  const rawTotal =
    baseReliability +
    forceBalanceModifier +
    alliedProtectionModifier +
    enemyPressureModifier +
    supportModifier +
    moraleModifier

  const totalScore = Math.max(0, Math.min(100, rawTotal))

  return {
    score: totalScore,
    breakdown: {
      baseReliability,
      forceBalanceModifier,
      alliedProtectionModifier,
      enemyPressureModifier,
      supportModifier,
      moraleModifier,
      totalScore,
    },
  }
}

/**
 * Phân loại tình trạng phi công theo thang điểm và cấu hình ngưỡng hiện hành
 */
export function determineSurvivalTier(score: number, config: SurvivalConfig): PilotSurvivalTier {
  if (score >= config.thresholdSafe) {
    return "SAFE"
  }
  if (score >= config.thresholdProtected) {
    return "PROTECTED"
  }
  if (score >= config.thresholdCritical) {
    return "CRITICAL"
  }
  return "KIA"
}

/**
 * Giải quyết kết quả chung cuộc hậu trận chiến (Post-Battle SAR Resolution)
 */
export function resolvePostBattlePilotStatus(params: {
  initialTier: PilotSurvivalTier
  victory: boolean
  config: SurvivalConfig
  facilityTier?: number
  prng?: () => number
}): {
  status: PilotFinalStatus
  narrative: string
} {
  const { initialTier, victory, config, facilityTier = 0 } = params
  const roll = params.prng ? params.prng() : Math.random()

  // SAFE: Thoát hiểm hoàn hảo, phát tín hiệu khẩn cấp định vị chính xác
  if (initialTier === "SAFE") {
    return {
      status: "RESCUED",
      narrative: "Khoang phóng kích hoạt hoàn hảo. Đội tìm kiếm cứu nạn đã định vị và đưa phi công về trạm an toàn.",
    }
  }

  // PROTECTED: Thoát hiểm dưới hỏa lực che chắn của đồng minh
  if (initialTier === "PROTECTED") {
    return {
      status: "RESCUED",
      narrative: "Phi công thoát hiểm được hộ tống và che chắn an toàn bởi lực lượng đồng minh trên chiến trường.",
    }
  }

  // KIA: Tử trận tức thì khi cỗ máy nổ tung
  if (initialTier === "KIA") {
    return {
      status: "KIA",
      narrative: "Lò phản ứng năng lượng vỡ vụn trước khi chu trình phóng kịp kích hoạt. Phi công đã hy sinh anh dũng.",
    }
  }

  // CRITICAL: Tình trạng nguy kịch, phụ thuộc vào kiểm soát chiến trường và xác suất giải cứu
  const facilityBonus = facilityTier * config.facilityRescuePowerBonusPerTier

  if (victory) {
    // Thắng lợi thân thiện: Kiểm soát hoàn toàn chiến trường giúp SAR tiếp cận nhanh
    const effectiveRescueChance = Math.min(
      0.95,
      Math.max(0.05, config.baseRescueChance + config.alliedVictoryRescueBonus + facilityBonus)
    )
    const effectiveCaptureChance = Math.min(0.15, config.baseCaptureChance * 0.25)

    if (roll < effectiveRescueChance) {
      return {
        status: "RESCUED",
        narrative: "Đội phản ứng nhanh VSS kiểm soát chiến trường đã kịp thời cắt vỏ buồng lái và cấp cứu phi công trước khi cạn oxy.",
      }
    } else if (roll < effectiveRescueChance + effectiveCaptureChance) {
      return {
        status: "CAPTURED",
        narrative: "Tàn quân The Void kịp thời thu hồi khoang phóng của phi công trước khi rút lui qua vết nứt hư không.",
      }
    } else {
      return {
        status: "KIA",
        narrative: "Tổn thương cấu trúc buồng lái quá nặng khiến phi công không qua khỏi trước khi đội cứu hộ tiếp cận.",
      }
    }
  } else {
    // Thất bại hoặc rút lui: Kẻ địch chiếm lĩnh trận địa, rủi ro bị bắt hoặc tử trận tăng vọt
    const effectiveRescueChance = Math.min(
      0.35,
      Math.max(0.05, config.baseRescueChance * 0.5 + facilityBonus)
    )
    const effectiveCaptureChance = Math.min(
      0.85,
      Math.max(0.20, config.baseCaptureChance + 0.25)
    )

    if (roll < effectiveRescueChance) {
      return {
        status: "RESCUED",
        narrative: "Phi công ẩn nấp trong vành đai mảnh vỡ và được biệt đội trinh sát ngầm VSS bí mật trích xuất an toàn.",
      }
    } else if (roll < effectiveRescueChance + effectiveCaptureChance) {
      return {
        status: "CAPTURED",
        narrative: "Chiến trường rơi vào tay The Void. Phi công đã bị quân địch bắt giữ và chuyển vào danh sách tù binh.",
      }
    } else {
      return {
        status: "KIA",
        narrative: "Hệ thống hỗ trợ sự sống cạn kiệt trong vùng kiểm soát thù địch. Phi công đã không qua khỏi.",
      }
    }
  }
}

/**
 * Xử lý toàn bộ danh sách Downed Pilot Candidates sau khi trận chiến kết thúc
 */
export function processCombatDownedPilots(params: {
  encounterId: string
  transactionId: string
  sectorId: string
  victory: boolean
  alliedAggregate: CombatV2ForceAggregate
  enemyAggregate: CombatV2ForceAggregate
  candidates: DownedPilotCandidate[]
  config?: SurvivalConfig
  hasActiveSupport?: boolean
  facilityTier?: number
  prng?: () => number
}): PilotSurvivalRecord[] {
  const config = params.config || DEFAULT_SURVIVAL_CONFIG
  const now = Date.now()

  return params.candidates.map((candidate, idx) => {
    // Tính toán Điểm số Sinh tồn
    const calcInput: PilotSurvivalCalculationInput = {
      alliedRemainingHp: params.alliedAggregate.totalCurrentHp,
      alliedMaxHp: params.alliedAggregate.totalMaxHp,
      enemyRemainingHp: params.enemyAggregate.totalCurrentHp,
      enemyMaxHp: params.enemyAggregate.totalMaxHp,
      alliedActiveCount: params.alliedAggregate.activeCount,
      enemyActiveCount: params.enemyAggregate.activeCount,
      alliedCommanderActive: true,
      alliedOffensivePower: params.alliedAggregate.effectiveOffensivePower,
      enemyOffensivePower: params.enemyAggregate.effectiveOffensivePower,
      hasActiveSupport: params.hasActiveSupport,
      alliedMorale: params.alliedAggregate.morale,
      isPlayer: candidate.isPlayer,
      destructionRound: candidate.destructionRound,
    }

    const { score, breakdown } = calculatePilotSurvivalScore(calcInput)
    const initialTier = determineSurvivalTier(score, config)

    // Xác định kết quả hậu trận đấu
    const { status: finalStatus, narrative } = resolvePostBattlePilotStatus({
      initialTier,
      victory: params.victory,
      config,
      facilityTier: params.facilityTier,
      prng: params.prng,
    })

    const recordId = `psr_${params.transactionId}_${candidate.pilotId || candidate.gearId}_${idx}`

    return {
      recordId,
      encounterId: params.encounterId,
      transactionId: params.transactionId,
      sectorId: params.sectorId,
      gearId: candidate.gearId,
      gearName: candidate.gearName,
      pilotId: candidate.pilotId || `pilot_${candidate.gearId}`,
      pilotName: candidate.pilotName || "Phi Công VSS",
      side: candidate.side,
      isPlayer: candidate.isPlayer,
      destructionRound: candidate.destructionRound,
      survivalScore: score,
      breakdown,
      initialTier,
      finalStatus,
      resolvedAtRound: candidate.destructionRound,
      resolvedAtTimestamp: now,
      notes: narrative,
    }
  })
}

/**
 * Áp dụng kết quả sinh tồn của phi công vào WorldState một cách an toàn và lũy đẳng
 */
export function applyPilotSurvivalToWorldState(
  state: WorldState,
  records: PilotSurvivalRecord[],
  sectorId: string
): {
  rescuedCount: number
  capturedCount: number
  kiaCount: number
  unlockedRescueMissions: string[]
} {
  if (!state.pilotSurvivalRegistry) {
    state.pilotSurvivalRegistry = []
  }
  if (!state.nationalPowRegistry) {
    state.nationalPowRegistry = []
  }

  let rescuedCount = 0
  let capturedCount = 0
  let kiaCount = 0
  const unlockedRescueMissions: string[] = []

  const existingRecordIds = new Set(state.pilotSurvivalRegistry.map((r) => r.recordId))
  const existingPowPilotIds = new Set(state.nationalPowRegistry.map((p) => p.pilotId))

  for (const record of records) {
    // Chỉ xử lý phi công thuộc phe đồng minh VSS vào sổ bộ quốc gia
    if (record.side !== "allied") continue

    // Kiểm tra lũy đẳng
    if (!existingRecordIds.has(record.recordId)) {
      state.pilotSurvivalRegistry.push(record)
      existingRecordIds.add(record.recordId)
    }

    if (record.finalStatus === "RESCUED") {
      rescuedCount++
      // Chuẩn bị cho Phase 6.35: Tạm thời đưa vào trạng thái cần phục hồi y tế
      state.military.woundedOrRepair = (state.military.woundedOrRepair || 0) + 1
    } else if (record.finalStatus === "KIA") {
      kiaCount++
      // Phi công tử trận làm tăng thương vong tích lũy
      state.military.casualties = (state.military.casualties || 0) + 1
    } else if (record.finalStatus === "CAPTURED") {
      capturedCount++
      // Chuyển vào Sổ bộ Tù binh Chiến tranh Quốc gia (National POW Registry)
      if (!existingPowPilotIds.has(record.pilotId)) {
        const powRecord: CapturedPilotRecord = {
          pilotId: record.pilotId,
          pilotName: record.pilotName,
          gearId: record.gearId,
          gearName: record.gearName,
          encounterId: record.encounterId,
          sectorId: record.sectorId || sectorId,
          capturedAtTimestamp: record.resolvedAtTimestamp,
          capturedAtDay: state.currentDay,
          captorFaction: "void",
          status: "IN_CAPTIVITY",
        }

        // Tự động kích hoạt Nhiệm vụ Giải Cứu Con Con Tin (SAR Hostage Rescue) trong Mission Dispatcher
        const targetSectorId = record.sectorId || sectorId
        const sector = state.sectors[targetSectorId]
        if (sector) {
          const dispatchRes = createMissionDispatch(state, {
            id: `dispatch_pow_sar_${record.pilotId}_${state.currentDay}`,
            title: `Chiến Dịch SAR: Giải Cứu Phi Công ${record.pilotName}`,
            description: `Tình báo chiến thuật xác nhận phi công ${record.pilotName} (${record.gearName}) đã bị lực lượng The Void bắt giữ làm tù binh tại ${sector.name}. Hãy tổ chức lực lượng đột kích giải vây đồng đội.`,
            category: "raid",
            sectorId: targetSectorId,
            prepareDurationTicks: 5,
            customObjectiveTitle: `Đột Kích Căn Cứ Giam Giữ Tù Binh VSS`,
          })

          if (dispatchRes.success && dispatchRes.dispatch) {
            powRecord.rescueDispatchId = dispatchRes.dispatch.id
            record.rescueDispatchId = dispatchRes.dispatch.id
            unlockedRescueMissions.push(dispatchRes.dispatch.id)
          }
        }

        state.nationalPowRegistry.push(powRecord)
        existingPowPilotIds.add(record.pilotId)
      }
    }
  }

  return {
    rescuedCount,
    capturedCount,
    kiaCount,
    unlockedRescueMissions,
  }
}
