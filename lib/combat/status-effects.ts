/**
 * STARFRONT Combat Engine — Status Effects Schema & Lifecycle
 * File: lib/combat/status-effects.ts
 *
 * Defines the comprehensive schema for status effects (e.g., BURN, SLOW, STUN),
 * duration management, tick-based reduction, and cleanup triggers.
 */

/* ==========================================================================
   1. ENUMS & CORE TYPES
   ========================================================================== */

/** Chủng loại hiệu ứng trạng thái trong chiến đấu */
export type StatusEffectType =
  | "BURN"           // Sát thương duy trì (DoT) theo lửa / plasma ở đầu lượt
  | "SLOW"           // Làm chậm tốc độ động cơ / giảm chỉ số Speed
  | "STUN"           // Tê liệt lõi năng lượng, mất quyền hành động
  | "ACID"           // Ăn mòn giáp kết hợp DoT sát thương
  | "OVERHEAT"       // Quá tải nhiệt làm gián đoạn lượt
  | "SHIELD"         // Lá chắn từ trường hấp thụ / giảm thiểu sát thương
  | "ECM_JAMMING"    // Nhiễu cảm biến, làm giảm độ chính xác
  | "RECHARGE"       // Tăng tốc hồi phục năng lượng SP
  | "HASTE"          // Tăng tốc độ phản ứng / hành động

/** Quy tắc xếp chồng khi nhận hiệu ứng cùng loại */
export type StatusStackRule =
  | "REFRESH"      // Làm mới thời hạn về mốc lớn hơn, giữ nguyên giá trị
  | "STACK"        // Tăng số tầng (intensity stacks) lên tối đa maxStacks
  | "OVERRIDE"     // Ghi đè hiệu ứng cũ nếu hiệu ứng mới mạnh hơn
  | "INDEPENDENT"  // Tồn tại song song như các thực thể độc lập

/** Thời điểm kích hoạt tác dụng của hiệu ứng */
export type EffectTriggerTiming =
  | "TURN_START"        // Kích hoạt ở đầu lượt (trước khi ra lệnh, ví dụ: DoT, Stun)
  | "TURN_END"          // Kích hoạt ở cuối lượt
  | "ON_HIT"            // Kích hoạt khi tấn công trúng mục tiêu
  | "ON_DAMAGE_TAKEN"   // Kích hoạt khi bị trúng đòn (ví dụ: Shield hấp thụ sát thương)
  | "PASSIVE"           // Hiệu lực liên tục tác động lên thuộc tính (ví dụ: Slow giảm Speed)

/** Nguyên nhân dọn dẹp / hủy bỏ hiệu ứng */
export type CleanupTriggerType =
  | "EXPIRED"           // Hết thời hạn hiệu lực (duration <= 0)
  | "CLEANSED"          // Bị thanh lọc bởi kỹ năng giải trừ (Cleanse)
  | "OVERRIDDEN"        // Bị ghi đè bởi hiệu ứng cùng loại mạnh hơn
  | "UNIT_DEFEATED"     // Đơn vị sở hữu bị tiêu diệt
  | "DISPELLED"         // Bị xóa bỏ bởi đòn tấn công giải bùa của đối phương
  | "MANUAL"            // Bị dọn dẹp chủ động bởi hệ thống

/* ==========================================================================
   2. DURATION MANAGEMENT INTERFACES
   ========================================================================== */

/** Chính sách quản lý thời hạn của hiệu ứng */
export interface DurationPolicy {
  /** Số lượt còn lại trước khi hết hiệu lực */
  turnsRemaining: number
  /** Thời hạn ban đầu khi mới áp dụng */
  initialDuration: number
  /** Thời điểm giảm trừ thời hạn (mặc định: TURN_END) */
  decrementTiming: "TURN_START" | "TURN_END"
  /** Có phải là hiệu ứng vĩnh viễn (cho đến khi bị giải trừ hoặc trận đấu kết thúc) hay không */
  isPermanent?: boolean
}

/* ==========================================================================
   3. STATUS EFFECT SCHEMA DEFINITION
   ========================================================================== */

/** Schema định nghĩa đầy đủ cho một hiệu ứng trạng thái đang hoạt động */
export interface StatusEffectDefinition {
  /** Mã định danh duy nhất của thể hiện hiệu ứng (instance ID) */
  id: string
  /** Phân loại hiệu ứng (BURN, SLOW, STUN, v.v.) */
  type: StatusEffectType
  /** Tên hiển thị tiếng Việt trên giao diện buồng lái */
  name: string
  /** Mô tả chi tiết tác dụng của hiệu ứng */
  description: string
  /** Phân định buff (false) hay debuff (true) phục vụ thanh lọc */
  isDebuff: boolean

  /** Giá trị định lượng (ví dụ: 0.50 giảm sát thương, 30 giảm tốc độ) */
  value: number
  /** Sát thương DoT cơ bản mỗi lượt (dành cho BURN, ACID) */
  dotDamage?: number

  /** Số tầng cộng dồn hiện tại (mặc định: 1) */
  stacks: number
  /** Số tầng tối đa cho phép */
  maxStacks: number
  /** Quy tắc xử lý khi tái áp dụng */
  stackRule: StatusStackRule

  /** Thời điểm kích hoạt hiệu ứng */
  triggerTiming: EffectTriggerTiming
  /** Quản lý thời hạn và quy tắc giảm lượt */
  duration: DurationPolicy

  /** ID của đơn vị đã thi triển hiệu ứng */
  sourceUnitId?: string
  /** ID của đơn vị đang chịu hiệu ứng */
  targetUnitId?: string

  /** Dữ liệu tùy biến mở rộng */
  metadata?: Record<string, unknown>
}

/* ==========================================================================
   4. TICK-BASED REDUCTION INTERFACES
   ========================================================================== */

/** Ngữ cảnh khi thực hiện giảm trừ lượt theo nhịp đấu (Tick Context) */
export interface StatusTickContext {
  /** Số thứ tự vòng đấu hiện tại */
  turnNumber: number
  /** Thời điểm tick hiện tại */
  timing: "TURN_START" | "TURN_END"
  /** ID của đơn vị đang đến lượt */
  targetUnitId: string
  /** Tên của đơn vị để định dạng log */
  targetUnitName?: string
}

/** Kết quả sau khi thực thi tick giảm thời hạn hoặc kích hoạt hiệu ứng */
export interface StatusTickResult {
  /** ID của hiệu ứng */
  effectId: string
  /** Loại hiệu ứng */
  type: StatusEffectType
  /** Thời hạn trước khi tick */
  previousDuration: number
  /** Thời hạn sau khi tick */
  currentDuration: number
  /** Hiệu ứng đã hết hạn và cần đưa vào danh sách dọn dẹp hay chưa */
  isExpired: boolean
  /** Số tầng hiện tại */
  currentStacks: number
  /** Lượng sát thương DoT hoặc giá trị kích hoạt trong tick này (nếu có) */
  triggeredDamage?: number
  /** Có gây mất lượt (Stun) trong tick này không */
  causedLossOfTurn?: boolean
  /** Thông điệp nhật ký chiến trận (Combat Log) */
  logMessage?: string
}

/* ==========================================================================
   5. CLEANUP TRIGGERS INTERFACES
   ========================================================================== */

/** Sự kiện dọn dẹp và kết thúc vòng đời của hiệu ứng */
export interface StatusCleanupEvent {
  /** ID của hiệu ứng bị dọn dẹp */
  effectId: string
  /** Loại hiệu ứng */
  type: StatusEffectType
  /** Tên hiệu ứng */
  name: string
  /** ID của đơn vị bị gỡ bỏ hiệu ứng */
  targetUnitId: string
  /** Nguyên nhân kích hoạt dọn dẹp */
  trigger: CleanupTriggerType
  /** Thời điểm dọn dẹp (timestamp) */
  timestamp: number
  /** Ghi chú bổ sung */
  reason?: string
}

/** Trình quản lý kiểm tra và dọn dẹp các hiệu ứng hết hạn */
export interface StatusCleanupTriggerHandler {
  /** Kiểm tra xem hiệu ứng có đủ điều kiện để kích hoạt dọn dẹp hay không */
  shouldCleanup(effect: StatusEffectDefinition): boolean
  /** Tạo sự kiện dọn dẹp chuẩn hóa */
  createCleanupEvent(
    effect: StatusEffectDefinition,
    trigger: CleanupTriggerType,
    reason?: string,
  ): StatusCleanupEvent
}

/* ==========================================================================
   6. FACTORY & LIFECYCLE HELPER FUNCTIONS
   ========================================================================== */

export interface CreateStatusEffectParams {
  id?: string
  type: StatusEffectType
  name: string
  description: string
  isDebuff?: boolean
  value?: number
  dotDamage?: number
  durationTurns: number
  stacks?: number
  maxStacks?: number
  stackRule?: StatusStackRule
  triggerTiming?: EffectTriggerTiming
  decrementTiming?: "TURN_START" | "TURN_END"
  sourceUnitId?: string
  targetUnitId?: string
  metadata?: Record<string, unknown>
}

/** Khởi tạo đối tượng StatusEffectDefinition chuẩn mực */
export function createStatusEffect(params: CreateStatusEffectParams): StatusEffectDefinition {
  const isDebuff =
    params.isDebuff !== undefined
      ? params.isDebuff
      : params.type !== "SHIELD" && params.type !== "RECHARGE" && params.type !== "HASTE"

  const defaultTrigger: EffectTriggerTiming =
    params.type === "BURN" || params.type === "ACID" || params.type === "STUN" || params.type === "OVERHEAT"
      ? "TURN_START"
      : params.type === "SHIELD"
      ? "ON_DAMAGE_TAKEN"
      : "PASSIVE"

  return {
    id: params.id || `eff-${params.type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: params.type,
    name: params.name,
    description: params.description,
    isDebuff,
    value: params.value ?? (params.type === "SLOW" ? 25 : 0),
    dotDamage: params.dotDamage,
    stacks: params.stacks ?? 1,
    maxStacks: params.maxStacks ?? (params.stackRule === "STACK" ? 3 : 1),
    stackRule: params.stackRule ?? (params.type === "BURN" || params.type === "ACID" ? "STACK" : "REFRESH"),
    triggerTiming: params.triggerTiming ?? defaultTrigger,
    duration: {
      turnsRemaining: params.durationTurns,
      initialDuration: params.durationTurns,
      decrementTiming: params.decrementTiming ?? "TURN_END",
      isPermanent: false,
    },
    sourceUnitId: params.sourceUnitId,
    targetUnitId: params.targetUnitId,
    metadata: params.metadata,
  }
}

/**
 * Xử lý tick giảm trừ thời hạn theo lượt cho một hiệu ứng
 */
export function tickStatusEffectDuration(
  effect: StatusEffectDefinition,
  context: StatusTickContext,
): StatusTickResult {
  const prevDuration = effect.duration.turnsRemaining
  let nextDuration = prevDuration
  let triggeredDamage: number | undefined
  let causedLossOfTurn = false
  let logMessage: string | undefined

  // 1. Kích hoạt hiệu ứng nếu đúng thời điểm
  if (effect.triggerTiming === context.timing) {
    if (effect.type === "BURN" || effect.type === "ACID") {
      const baseDamage = effect.dotDamage || (effect.type === "ACID" ? 35 : 30)
      triggeredDamage = Math.round(baseDamage * effect.stacks)
      logMessage = `[DoT] ${context.targetUnitName || "Mục tiêu"} chịu ${triggeredDamage} sát thương từ ${effect.name} (Tầng ${effect.stacks}).`
    } else if (effect.type === "STUN" || effect.type === "OVERHEAT") {
      causedLossOfTurn = true
      logMessage = `[STUN] Lõi năng lượng của ${context.targetUnitName || "Mục tiêu"} bị ${effect.name} làm tê liệt! Mất lượt hành động.`
    }
  }

  // 2. Giảm duration nếu đúng thời điểm decrement
  if (effect.duration.decrementTiming === context.timing && !effect.duration.isPermanent) {
    nextDuration = Math.max(0, prevDuration - 1)
    effect.duration.turnsRemaining = nextDuration
  }

  const isExpired = nextDuration <= 0 && !effect.duration.isPermanent

  return {
    effectId: effect.id,
    type: effect.type,
    previousDuration: prevDuration,
    currentDuration: nextDuration,
    isExpired,
    currentStacks: effect.stacks,
    triggeredDamage,
    causedLossOfTurn,
    logMessage,
  }
}

/**
 * Trình dọn dẹp chuẩn hóa các hiệu ứng đã hết hạn hoặc bị hủy
 */
export const defaultStatusCleanupHandler: StatusCleanupTriggerHandler = {
  shouldCleanup(effect: StatusEffectDefinition): boolean {
    return !effect.duration.isPermanent && effect.duration.turnsRemaining <= 0
  },
  createCleanupEvent(
    effect: StatusEffectDefinition,
    trigger: CleanupTriggerType,
    reason?: string,
  ): StatusCleanupEvent {
    return {
      effectId: effect.id,
      type: effect.type,
      name: effect.name,
      targetUnitId: effect.targetUnitId || "unknown",
      trigger,
      timestamp: Date.now(),
      reason: reason || (trigger === "EXPIRED" ? "Hết thời hạn hiệu lực" : "Đã bị thanh lọc"),
    }
  },
}
