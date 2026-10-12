/**
 * STARFRONT WORLD — Sector State Machine & Lifecycle (Phase 6.2)
 * Máy trạng thái hữu hạn 5 giai đoạn: Normal -> Threatened -> Under Siege -> Lost -> Recovery
 * Tách biệt hoàn toàn Vòng đời (Stage) khỏi Quyền kiểm soát (Sovereignty) và Mức độ đe dọa (Threat).
 */

import type { SectorSovereignty, SectorStage, WorldSector } from "./types"

/**
 * Ngưỡng đe dọa (Threat thresholds) theo tài liệu thiết kế WORLD_DESIGN.md B.4
 */
export const THREAT_THRESHOLDS = {
  NORMAL_MAX: 299,
  THREATENED_MIN: 300,
  THREATENED_MAX: 699,
  UNDER_SIEGE_MIN: 700,
  MAX_THREAT: 1000,
  MIN_THREAT: 0,
} as const

/**
 * Bảng quy tắc chuyển đổi trạng thái hợp lệ trực tiếp giữa các giai đoạn
 */
export const VALID_STAGE_TRANSITIONS: Record<SectorStage, SectorStage[]> = {
  normal: ["threatened"],
  threatened: ["normal", "under_siege"],
  under_siege: ["threatened", "lost", "normal"],
  lost: ["recovery"],
  recovery: ["normal", "threatened", "under_siege"],
}

export interface StageTransitionContext {
  /** Lý do chuyển đổi trạng thái */
  reason?: string
  /** Cờ thông báo trận chiến phòng thủ thất bại (kích hoạt chuyển sang Lost) */
  defenseFailed?: boolean
  /** Cờ thông báo giải phóng sector khỏi quân địch (kích hoạt chuyển sang Recovery) */
  liberated?: boolean
  /** Cờ thông báo tiến trình tái thiết hoàn tất (kích hoạt chuyển sang Normal) */
  recoveryComplete?: boolean
  /** Cho phép ép buộc chuyển trạng thái (dành riêng cho debug/admin tools) */
  force?: boolean
}

export interface StageTransitionResult {
  /** Cho biết chuyển đổi có thành công hay không */
  success: boolean
  /** Giai đoạn trước khi chuyển */
  previousStage: SectorStage
  /** Giai đoạn sau khi chuyển (hoặc giữ nguyên nếu thất bại) */
  newStage: SectorStage
  /** Bản sao WorldSector đã được cập nhật hoặc giữ nguyên */
  sector: WorldSector
  /** Lý do hoặc thông tin chuyển đổi */
  reason?: string
  /** Thông báo lỗi nếu chuyển đổi không hợp lệ */
  error?: string
}

/**
 * Kiểm tra xem một chuyển đổi giai đoạn có hợp lệ theo máy trạng thái hay không
 */
export function canTransitionStage(
  currentStage: SectorStage,
  targetStage: SectorStage,
  context?: StageTransitionContext
): { allowed: boolean; reason?: string } {
  // Trùng giai đoạn hiện tại: coi như giữ nguyên hợp lệ
  if (currentStage === targetStage) {
    return { allowed: true, reason: "Trạng thái không thay đổi" }
  }

  // Nếu kích hoạt chế độ ép buộc
  if (context?.force) {
    return { allowed: true, reason: "Ép buộc chuyển trạng thái (Force override)" }
  }

  const allowedTargets = VALID_STAGE_TRANSITIONS[currentStage]
  if (!allowedTargets || !allowedTargets.includes(targetStage)) {
    return {
      allowed: false,
      reason: `Chuyển trạng thái bất hợp lệ: Không thể chuyển từ '${currentStage}' sang '${targetStage}'. Các trạng thái cho phép: [${allowedTargets?.join(", ") ?? "không có"}].`,
    }
  }

  // Kiểm tra điều kiện phụ trợ nếu có
  if (targetStage === "lost" && currentStage === "under_siege") {
    // Chỉ chuyển sang Lost khi có thất bại phòng thủ hoặc threat đạt ngưỡng cực đại
    if (context && context.defenseFailed === false) {
      return {
        allowed: false,
        reason: "Không thể thất thủ: Trận chiến phòng thủ chưa ghi nhận thất bại.",
      }
    }
  }

  if (targetStage === "recovery" && currentStage === "lost") {
    if (context && context.liberated === false) {
      return {
        allowed: false,
        reason: "Không thể tái thiết: Sector chưa được giải phóng khỏi phe chiếm đóng.",
      }
    }
  }

  return { allowed: true }
}

/**
 * Thực hiện chuyển đổi trạng thái của WorldSector theo máy trạng thái
 * Hàm thuần túy trả về đối tượng WorldSector mới mà không biến đổi trực tiếp tham số đầu vào
 */
export function transitionSectorStage(
  sector: WorldSector,
  targetStage: SectorStage,
  context?: StageTransitionContext
): StageTransitionResult {
  const check = canTransitionStage(sector.stage, targetStage, context)

  if (!check.allowed) {
    return {
      success: false,
      previousStage: sector.stage,
      newStage: sector.stage,
      sector: { ...sector },
      error: check.reason,
    }
  }

  const previousStage = sector.stage
  const updatedSector: WorldSector = {
    ...sector,
    stage: targetStage,
  }

  // Ghi nhận mốc thời gian nếu rơi vào tình trạng vây hãm
  if (targetStage === "under_siege" && previousStage !== "under_siege") {
    updatedSector.lastSiegeDay = updatedSector.lastSiegeDay ?? 1
  }

  return {
    success: true,
    previousStage,
    newStage: targetStage,
    sector: updatedSector,
    reason: context?.reason ?? `Chuyển trạng thái từ '${previousStage}' sang '${targetStage}' thành công.`,
  }
}

/**
 * Tự động đánh giá và đề xuất giai đoạn của sector dựa trên Threat level và ngữ cảnh sự kiện
 * Tuân thủ nghiêm ngặt máy trạng thái 5 giai đoạn:
 * - Lost chỉ có thể thoát sang Recovery khi có cờ liberated
 * - Recovery chỉ có thể hoàn tất sang Normal khi có cờ recoveryComplete
 * - Under Siege chỉ rơi vào Lost khi có cờ defenseFailed
 * - Còn lại chuyển đổi giữa Normal, Threatened, Under Siege theo mức Threat
 */
export function evaluateSectorStage(
  sector: WorldSector,
  context?: StageTransitionContext
): StageTransitionResult {
  const currentStage = sector.stage
  const threat = Math.max(
    THREAT_THRESHOLDS.MIN_THREAT,
    Math.min(THREAT_THRESHOLDS.MAX_THREAT, sector.threatLevel)
  )

  // 1. Sector đang ở trạng thái Lost (Đã thất thủ)
  if (currentStage === "lost") {
    if (context?.liberated) {
      return transitionSectorStage(sector, "recovery", {
        reason: "Sector đã được giải phóng khỏi The Void; bắt đầu chu trình tái thiết.",
        liberated: true,
      })
    }
    // Vẫn duy trì Lost
    return {
      success: true,
      previousStage: "lost",
      newStage: "lost",
      sector: { ...sector },
      reason: "Sector tiếp tục bị chiếm đóng bởi kẻ thù.",
    }
  }

  // 2. Sector đang ở trạng thái Recovery (Tái thiết sau giải phóng)
  if (currentStage === "recovery") {
    // Nếu bị tấn công trở lại trong quá trình tái thiết
    if (threat >= THREAT_THRESHOLDS.UNDER_SIEGE_MIN) {
      return transitionSectorStage(sector, "under_siege", {
        reason: "Sector đang tái thiết bị phản kích dữ dội; rơi vào tình trạng vây hãm.",
      })
    }
    if (threat >= THREAT_THRESHOLDS.THREATENED_MIN) {
      return transitionSectorStage(sector, "threatened", {
        reason: "Sector đang tái thiết bị thám báo uy hiếp an ninh.",
      })
    }
    // Nếu quá trình tái thiết hoàn tất hoặc ổn định đạt chuẩn
    if (context?.recoveryComplete || (sector.stability >= 75 && threat < THREAT_THRESHOLDS.THREATENED_MIN)) {
      return transitionSectorStage(sector, "normal", {
        reason: "Tái thiết cơ sở hạ tầng hoàn tất, xã hội ổn định trở lại mức bình thường.",
        recoveryComplete: true,
      })
    }
    // Duy trì Recovery
    return {
      success: true,
      previousStage: "recovery",
      newStage: "recovery",
      sector: { ...sector },
      reason: "Tiếp tục công tác tái thiết và ổn định dân sinh.",
    }
  }

  // 3. Sector đang bị vây hãm (Under Siege)
  if (currentStage === "under_siege") {
    if (context?.defenseFailed) {
      return transitionSectorStage(sector, "lost", {
        reason: "Lực lượng phòng thủ bị tiêu diệt; sector thất thủ hoàn toàn.",
        defenseFailed: true,
      })
    }
    // Nếu giải tỏa vây hãm, Threat giảm xuống
    if (threat < THREAT_THRESHOLDS.THREATENED_MIN) {
      return transitionSectorStage(sector, "normal", {
        reason: "Vây hãm bị đập tan hoàn toàn, đe dọa được xóa bỏ triệt để.",
      })
    }
    if (threat < THREAT_THRESHOLDS.UNDER_SIEGE_MIN) {
      return transitionSectorStage(sector, "threatened", {
        reason: "Vây hãm được giải tỏa một phần, chuyển về mức uy hiếp thông thường.",
      })
    }
    // Giữ nguyên Under Siege
    return {
      success: true,
      previousStage: "under_siege",
      newStage: "under_siege",
      sector: { ...sector },
      reason: "Chiến sự vây hãm vẫn đang diễn ra ác liệt.",
    }
  }

  // 4. Sector đang bị uy hiếp (Threatened)
  if (currentStage === "threatened") {
    if (threat >= THREAT_THRESHOLDS.UNDER_SIEGE_MIN) {
      return transitionSectorStage(sector, "under_siege", {
        reason: "Mức độ đe dọa tăng vọt vượt ngưỡng 700; chuyển sang tình trạng bị bao vây.",
      })
    }
    if (threat < THREAT_THRESHOLDS.THREATENED_MIN) {
      return transitionSectorStage(sector, "normal", {
        reason: "Mức độ đe dọa giảm dưới 300; an ninh khu vực trở lại bình thường.",
      })
    }
    // Giữ nguyên Threatened
    return {
      success: true,
      previousStage: "threatened",
      newStage: "threatened",
      sector: { ...sector },
      reason: "Mức độ đe dọa duy trì ở cấp độ uy hiếp.",
    }
  }

  // 5. Sector đang ở trạng thái bình thường (Normal)
  if (currentStage === "normal") {
    if (threat >= THREAT_THRESHOLDS.THREATENED_MIN) {
      return transitionSectorStage(sector, "threatened", {
        reason: "Mức độ đe dọa vượt ngưỡng 300; kích hoạt trạng thái bị uy hiếp.",
      })
    }
    // Giữ nguyên Normal
    return {
      success: true,
      previousStage: "normal",
      newStage: "normal",
      sector: { ...sector },
      reason: "Khu vực an toàn, sản xuất và dân cư ổn định.",
    }
  }

  return {
    success: false,
    previousStage: currentStage,
    newStage: currentStage,
    sector: { ...sector },
    error: `Trạng thái không xác định: ${currentStage}`,
  }
}

/**
 * Cập nhật Threat level của sector và tùy chọn tự động cập nhật Stage theo máy trạng thái
 */
export function setSectorThreat(
  sector: WorldSector,
  newThreatLevel: number,
  autoUpdateStage = true
): { sector: WorldSector; transition?: StageTransitionResult } {
  const clampedThreat = Math.max(
    THREAT_THRESHOLDS.MIN_THREAT,
    Math.min(THREAT_THRESHOLDS.MAX_THREAT, Math.round(newThreatLevel))
  )

  const updatedSector: WorldSector = {
    ...sector,
    threatLevel: clampedThreat,
  }

  if (!autoUpdateStage) {
    return { sector: updatedSector }
  }

  const transitionResult = evaluateSectorStage(updatedSector)
  return {
    sector: transitionResult.sector,
    transition: transitionResult,
  }
}

/**
 * Giải phóng một sector đã thất thủ (Lost) sang trạng thái Tái thiết (Recovery)
 * Thiết lập quyền kiểm soát thuộc về VSS, giảm nhẹ threat level
 */
export function liberateLostSector(
  sector: WorldSector,
  liberatorSovereignty: SectorSovereignty = "vss"
): StageTransitionResult {
  if (sector.stage !== "lost") {
    return {
      success: false,
      previousStage: sector.stage,
      newStage: sector.stage,
      sector: { ...sector },
      error: `Chỉ có sector ở trạng thái 'lost' mới có thể được giải phóng (hiện tại: '${sector.stage}').`,
    }
  }

  const transition = transitionSectorStage(sector, "recovery", {
    reason: `Sector được giải phóng bởi ${liberatorSovereignty.toUpperCase()}`,
    liberated: true,
  })

  if (transition.success) {
    transition.sector = {
      ...transition.sector,
      sovereignty: liberatorSovereignty,
      threatLevel: Math.min(transition.sector.threatLevel, 450), // Giảm bớt threat tàn quân sau giải phóng
      stability: Math.max(30, transition.sector.stability),      // Khôi phục mầm mống ổn định ban đầu
    }
  }

  return transition
}

/**
 * Khi trận chiến phòng thủ tại sector thất bại, sector rơi vào tay kẻ thù (Lost)
 */
export function conquerSector(
  sector: WorldSector,
  conquerorSovereignty: SectorSovereignty = "void"
): StageTransitionResult {
  // Sector phải đang ở Under Siege (hoặc Threatened) mới có thể thất thủ
  if (sector.stage !== "under_siege" && sector.stage !== "threatened") {
    return {
      success: false,
      previousStage: sector.stage,
      newStage: sector.stage,
      sector: { ...sector },
      error: `Chỉ có sector ở trạng thái 'under_siege' hoặc 'threatened' mới có thể thất thủ (hiện tại: '${sector.stage}').`,
    }
  }

  // Nếu đang ở Threatened, trước tiên chuyển qua Under Siege rồi sang Lost
  let workingSector = sector
  if (workingSector.stage === "threatened") {
    const siegeTransition = transitionSectorStage(workingSector, "under_siege", {
      reason: "Đột kích thọc sâu trước khi thất thủ",
    })
    if (!siegeTransition.success) return siegeTransition
    workingSector = siegeTransition.sector
  }

  const transition = transitionSectorStage(workingSector, "lost", {
    reason: `Phòng tuyến sụp đổ; sector bị chiếm bởi ${conquerorSovereignty.toUpperCase()}`,
    defenseFailed: true,
  })

  if (transition.success) {
    transition.sector = {
      ...transition.sector,
      sovereignty: conquerorSovereignty,
      threatLevel: Math.max(transition.sector.threatLevel, 850), // Threat tăng cao do quân địch đóng quân
      stability: Math.min(15, transition.sector.stability),      // Ổn định sụp đổ
    }
  }

  return transition
}

/**
 * Hoàn tất tiến trình phục hồi, chuyển từ Recovery sang Normal
 */
export function completeRecovery(sector: WorldSector): StageTransitionResult {
  if (sector.stage !== "recovery") {
    return {
      success: false,
      previousStage: sector.stage,
      newStage: sector.stage,
      sector: { ...sector },
      error: `Chỉ có sector ở trạng thái 'recovery' mới có thể hoàn tất phục hồi (hiện tại: '${sector.stage}').`,
    }
  }

  const transition = transitionSectorStage(sector, "normal", {
    reason: "Hoàn tất giai đoạn tái thiết sau chiến tranh.",
    recoveryComplete: true,
  })

  if (transition.success) {
    transition.sector = {
      ...transition.sector,
      threatLevel: Math.min(transition.sector.threatLevel, 150),
      stability: Math.max(75, transition.sector.stability),
    }
  }

  return transition
}

/**
 * Hệ số hiệu suất sản xuất theo từng giai đoạn vòng đời của Sector
 * (Theo tài liệu thiết kế WORLD_DESIGN.md B.4)
 */
export function getSectorStageEfficiency(stage: SectorStage): number {
  switch (stage) {
    case "normal":
      return 1.0 // 100% năng suất
    case "threatened":
      return 0.85 // Giảm nhẹ (-15%)
    case "under_siege":
      return 0.4 // Bị phong tỏa / gián đoạn nặng nề (-60%)
    case "recovery":
      return 0.5 // Hồi phục từng phần sau chiến tranh (-50%)
    case "lost":
      return 0.0 // Ngưng trệ sản xuất hoàn toàn
    default:
      return 1.0
  }
}
