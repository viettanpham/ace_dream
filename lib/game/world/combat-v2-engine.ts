/**
 * STARFRONT WORLD — Combat V2 Core Engine (Phase 6.32)
 *
 * Implements the authoritative tactical simulation engine for Combat V2:
 *   - Battle-specific encounter snapshot instantiation
 *   - Asymmetric dynamic force rosters (no fixed squad sizes)
 *   - Individually addressable GEAR machines with 4 states: ACTIVE, RETREATING, RETREATED, DESTROYED
 *   - End-of-round aggregate force recalculation (pruning destroyed/retreated units)
 *   - Independent Commander Authority (decoupled from player personal machine HP)
 *   - Faction-level strategy queue & round-boundary application
 *   - Headless NPC-only simulation capability (no React UI dependencies)
 *   - Structured CombatResult & idempotent WORLD commit boundary
 */

import { WorldPRNG } from "./random"
import type {
  CombatGearState,
  CombatSide,
  CombatV2Gear,
  CombatV2EncounterSnapshot,
  CombatV2ForceAggregate,
  CombatV2RoundLog,
  CombatV2ActionEntry,
  CombatV2Result,
  CombatV2BattlefieldViewModel,
  CommanderStrategyDefinition,
  CommanderAuthorityState,
  CombatMoraleState,
  CombatSupportEntity,
  DownedPilotCandidate,
  CombatV2Config,
} from "./combat-v2-types"
import type { CombatResultReceipt, WorldState, CombatResolutionResult } from "./types"
import { commitCombatResultReceipt } from "./combat-adapter"
import { processCombatDownedPilots, applyPilotSurvivalToWorldState } from "./pilot-survival-engine"
import type { SurvivalConfig } from "./pilot-survival-types"

import { executeSupportRound } from "./combat-v2-support"

/**
 * Centralized Combat V2 Configuration Defaults (matching docs/WORLD_ADMINCP_CONFIG_REFERENCE.md)
 */
export const DEFAULT_COMBAT_V2_CONFIG: CombatV2Config = {
  // APPROVED DESIGN DEFAULT: 1 round in RETREATING before RETREATED
  defaultRetreatDurationRounds: 1,
  // TECHNICAL SAFETY DEFAULT: Engine loop safety guard against infinite simulation, NOT a canonical gameplay rule
  maxCombatRounds: 30,
  // TEMPORARY TECHNICAL DEFAULT: Neutral placeholder (1.0 = 100% suppression); exact balance unresolved
  retreatOffenseReductionRatio: 1.0,
  // TEMPORARY TECHNICAL DEFAULT: Neutral placeholder (1.0 = 100% retention); exact balance unresolved
  retreatDefenseRetentionRatio: 1.0,
  // UNRESOLVED CONFIG DEFAULT: Temporary baseline rating; not yet approved gameplay balance
  defaultMoraleValue: 100,
  // CONCEPTUAL EXAMPLE: Conceptual threshold for panic evaluation; not yet approved gameplay balance
  moraleThresholdPanic: 30,
  // TEMPORARY TECHNICAL DEFAULT: NPC retreat HP ratio threshold (0.25 = 25% max HP)
  npcRetreatHpRatioThreshold: 0.25,
}

/**
 * Canonical Strategy Definitions (Neutral, data-driven stances without arbitrary balance inflation)
 */
export const COMBAT_V2_STRATEGIES: Record<string, CommanderStrategyDefinition> = {
  balanced: {
    id: "balanced",
    name: "Cân Bằng Tiêu Chuẩn (Standard Balanced)",
    description: "Duy trì đội hình đồng đều, phân bổ đều giữa công kích và che chắn hỏa lực.",
    offensiveMultiplier: 1.0,
    defensiveMultiplier: 1.0,
    speedMultiplier: 1.0,
  },
  focus_fire: {
    id: "focus_fire",
    name: "Tập Trung Hỏa Lực (Focus Fire)",
    description: "Toàn đội tập trung hỏa lực dồn sát thương vào một mục tiêu ưu tiên.",
    offensiveMultiplier: 1.15,
    defensiveMultiplier: 0.95,
  },
  defensive_screen: {
    id: "defensive_screen",
    name: "Màn Chắn Phòng Ngự (Defensive Screen)",
    description: "Kích hoạt khiên chắn năng lượng và củng cố giáp, giảm nhẹ sát thương xuất kích.",
    offensiveMultiplier: 0.85,
    defensiveMultiplier: 1.2,
  },
  assault_spearhead: {
    id: "assault_spearhead",
    name: "Mũi Nhọn Đột Kích (Assault Spearhead)",
    description: "Đột kích thần tốc áp sát đối phương, gia tăng tối đa sức công phá.",
    offensiveMultiplier: 1.2,
    defensiveMultiplier: 0.85,
  },
  tactical_withdrawal: {
    id: "tactical_withdrawal",
    name: "Rút Lui Chiến Thuật (Tactical Withdrawal)",
    description: "Ưu tiên che chắn bảo toàn lực lượng, hỗ trợ các đơn vị đang thoát ly.",
    offensiveMultiplier: 0.7,
    defensiveMultiplier: 1.25,
  },
}

/**
 * Tính toán số liệu tổng hợp (Aggregate Force Data) của một bên tham chiến tại biên hiệp đấu
 * Tuân thủ bất biến: DESTROYED và RETREATED không đóng góp vào chỉ số hữu hiệu.
 */
export function recalculateForceAggregate(
  gears: CombatV2Gear[],
  side: CombatSide,
  morale: number,
  config: CombatV2Config = DEFAULT_COMBAT_V2_CONFIG
): CombatV2ForceAggregate {
  let activeCount = 0
  let retreatingCount = 0
  let retreatedCount = 0
  let destroyedCount = 0
  let totalCurrentHp = 0
  let totalMaxHp = 0
  let effectiveOffensivePower = 0
  let effectiveDefensivePower = 0

  for (const gear of gears) {
    totalMaxHp += gear.maxHp

    if (gear.state === "DESTROYED") {
      destroyedCount++
      gear.isContributingOffense = false
      gear.isContributingDefense = false
      continue
    }

    if (gear.state === "RETREATED") {
      retreatedCount++
      gear.isContributingOffense = false
      gear.isContributingDefense = false
      continue
    }

    totalCurrentHp += gear.currentHp

    if (gear.state === "ACTIVE") {
      activeCount++
      gear.isContributingOffense = true
      gear.isContributingDefense = true
      effectiveOffensivePower += gear.attack
      effectiveDefensivePower += gear.defense
    } else if (gear.state === "RETREATING") {
      retreatingCount++
      // Đang rút lui: bảo lưu phòng thủ, công kích bị tiết giảm theo tỷ lệ cấu hình
      const offenseFactor = Math.max(0, 1 - config.retreatOffenseReductionRatio)
      const defenseFactor = Math.max(0, config.retreatDefenseRetentionRatio)
      gear.isContributingOffense = offenseFactor > 0
      gear.isContributingDefense = defenseFactor > 0
      effectiveOffensivePower += Math.round(gear.attack * offenseFactor)
      effectiveDefensivePower += Math.round(gear.defense * defenseFactor)
    }
  }

  const hpPercent = totalMaxHp > 0 ? Number(((totalCurrentHp / totalMaxHp) * 100).toFixed(1)) : 0
  const hasViableCombatants = activeCount > 0 || retreatingCount > 0

  return {
    side,
    totalCount: gears.length,
    activeCount,
    retreatingCount,
    retreatedCount,
    destroyedCount,
    totalCurrentHp,
    totalMaxHp,
    hpPercent,
    effectiveOffensivePower,
    effectiveDefensivePower,
    morale,
    hasViableCombatants,
  }
}

/**
 * Thiết lập lệnh chiến lược dự kiến cho hiệp tiếp theo (Queue Strategy)
 * Bất biến: Thẩm quyền chỉ huy không bị mất ngay cả khi GEAR cá nhân của người chơi bị phá hủy.
 */
export function queueCommanderStrategy(
  snapshot: CombatV2EncounterSnapshot,
  side: CombatSide,
  strategyId: string
): { success: boolean; message: string } {
  const commander = side === "allied" ? snapshot.alliedCommander : snapshot.enemyCommander

  if (!commander.hasActiveAuthority) {
    return {
      success: false,
      message: `Chỉ huy phe ${side.toUpperCase()} hiện không nắm thẩm quyền tác chiến.`,
    }
  }

  const strat = COMBAT_V2_STRATEGIES[strategyId]
  if (!strat) {
    return {
      success: false,
      message: `Chiến thuật không xác định: ${strategyId}`,
    }
  }

  commander.queuedStrategyId = strategyId
  return {
    success: true,
    message: `Đã xếp hàng chiến thuật "${strat.name}" cho phe ${side.toUpperCase()}. Sẽ áp dụng ở đầu hiệp tiếp theo.`,
  }
}

/**
 * Phát lệnh rút lui cho một cỗ máy GEAR cụ thể
 */
export function orderGearRetreat(
  gear: CombatV2Gear,
  retreatDurationRounds = DEFAULT_COMBAT_V2_CONFIG.defaultRetreatDurationRounds
): { success: boolean; message: string } {
  if (gear.state !== "ACTIVE") {
    return {
      success: false,
      message: `Đơn vị ${gear.name} đang ở trạng thái ${gear.state}, không thể phát lệnh rút lui.`,
    }
  }

  gear.state = "RETREATING"
  gear.retreatTurnsRemaining = retreatDurationRounds
  return {
    success: true,
    message: `Đơn vị ${gear.name} đã bắt đầu quá trình thoát ly chiến trường (${retreatDurationRounds} hiệp).`,
  }
}

/**
 * Đánh giá quyết định rút lui tự động của đơn vị NPC dựa trên các thông số cấu hình chuẩn tắc:
 * - Không áp dụng cho cỗ máy của người chơi (isPlayer === true)
 * - Đơn vị phải đang ở trạng thái ACTIVE
 * - Điều kiện 1 (Chiến thuật): Toàn bộ NPC tuân lệnh khi chiến thuật phe là "tactical_withdrawal"
 * - Điều kiện 2 (Khủng hoảng tinh thần & tổn thương nặng):
 *     Morale <= config.moraleThresholdPanic (30) VÀ Tỷ lệ HP <= config.npcRetreatHpRatioThreshold (0.25)
 */
export function evaluateNpcRetreat(
  gear: CombatV2Gear,
  factionMorale: number,
  strategyId: string,
  config: CombatV2Config = DEFAULT_COMBAT_V2_CONFIG
): boolean {
  if (gear.isPlayer || gear.state !== "ACTIVE") return false

  // 1. Lệnh rút lui toàn đội từ chiến thuật chỉ huy
  if (strategyId === "tactical_withdrawal") {
    return true
  }

  // 2. Ngưỡng hoảng loạn kết hợp HP cạn kiệt
  const hpRatio = gear.maxHp > 0 ? gear.currentHp / gear.maxHp : 0
  const hpThreshold = config.npcRetreatHpRatioThreshold ?? 0.25
  if (factionMorale <= config.moraleThresholdPanic && hpRatio <= hpThreshold) {
    return true
  }

  return false
}

/**
 * Lệnh rút lui toàn lực lượng (Force-wide Commander Retreat)
 * Chỉ huy phát lệnh rút lui đồng loạt cho tất cả các cỗ máy ACTIVE thuộc phe mình
 */
export function orderForceRetreat(
  snapshot: CombatV2EncounterSnapshot,
  side: CombatSide,
  retreatDurationRounds = DEFAULT_COMBAT_V2_CONFIG.defaultRetreatDurationRounds
): { success: boolean; affectedCount: number; message: string } {
  const gears = side === "allied" ? snapshot.alliedGears : snapshot.enemyGears
  let count = 0
  for (const g of gears) {
    if (g.state === "ACTIVE") {
      const res = orderGearRetreat(g, retreatDurationRounds)
      if (res.success) count++
    }
  }

  // Tự động chuyển chiến thuật sang Tactical Withdrawal nếu chỉ huy còn hiệu lực
  const commander = side === "allied" ? snapshot.alliedCommander : snapshot.enemyCommander
  if (commander.hasActiveAuthority) {
    commander.queuedStrategyId = "tactical_withdrawal"
  }

  return {
    success: count > 0,
    affectedCount: count,
    message: `Đã phát lệnh rút lui toàn lực lượng (${count} cỗ máy bắt đầu thoát ly).`,
  }
}

/**
 * Khởi tạo Snapshot trận đấu chiến lược Combat V2 hoàn chỉnh
 */
export function createCombatV2EncounterSnapshot(params: {
  encounterId: string
  transactionId: string
  sectorId: string
  alliedGears: CombatV2Gear[]
  enemyGears: CombatV2Gear[]
  alliedCommanderName?: string
  isPlayerCommander?: boolean
  enemyCommanderName?: string
  alliedStrategyId?: string
  enemyStrategyId?: string
  maxRounds?: number
  objective?: "eliminate_all_enemies" | "survive_rounds" | "defend_asset"
  targetSurviveRounds?: number
  seed?: number
}): CombatV2EncounterSnapshot {
  const alliedCommander: CommanderAuthorityState = {
    factionId: "vss",
    commanderName: params.alliedCommanderName || "Chỉ Huy VSS",
    isPlayerCommander: params.isPlayerCommander ?? true,
    hasActiveAuthority: true,
    currentStrategyId: params.alliedStrategyId || "balanced",
    queuedStrategyId: null,
  }

  const enemyCommander: CommanderAuthorityState = {
    factionId: "void",
    commanderName: params.enemyCommanderName || "Chỉ Huy The Void",
    isPlayerCommander: false,
    hasActiveAuthority: true,
    currentStrategyId: params.enemyStrategyId || "balanced",
    queuedStrategyId: null,
  }

  const alliedMorale: CombatMoraleState = {
    side: "allied",
    currentMorale: DEFAULT_COMBAT_V2_CONFIG.defaultMoraleValue,
    baselineMorale: DEFAULT_COMBAT_V2_CONFIG.defaultMoraleValue,
  }

  const enemyMorale: CombatMoraleState = {
    side: "enemy",
    currentMorale: DEFAULT_COMBAT_V2_CONFIG.defaultMoraleValue,
    baselineMorale: DEFAULT_COMBAT_V2_CONFIG.defaultMoraleValue,
  }

  return {
    encounterId: params.encounterId,
    transactionId: params.transactionId,
    sectorId: params.sectorId,
    combatVersion: "v2",
    createdAtTimestamp: Date.now(),
    maxRounds: params.maxRounds ?? DEFAULT_COMBAT_V2_CONFIG.maxCombatRounds,
    objective: params.objective || "eliminate_all_enemies",
    targetSurviveRounds: params.targetSurviveRounds,
    alliedGears: params.alliedGears,
    enemyGears: params.enemyGears,
    alliedCommander,
    enemyCommander,
    alliedMorale,
    enemyMorale,
    seed: params.seed,
  }
}

/**
 * Thực thi một hiệp đấu đơn lẻ trong chu kỳ vòng đời Round Lifecycle của Combat V2
 *
 * Trình tự vòng đời:
 * 1. Áp dụng chiến thuật đã xếp hàng tại biên hiệp (Apply Queued Strategy)
 * 2. Xác định các đơn vị hợp lệ và thứ tự xuất kích theo Speed
 * 3. Giải quyết hành động & áp dụng sát thương
 * 4. Cập nhật trạng thái tiêu diệt (DESTROYED)
 * 5. Tiến triển bộ đếm rút lui (Advance Retreat State: RETREATING -> RETREATED)
 * 6. Tính toán lại số liệu tổng hợp (Recalculate Aggregates)
 * 7. Cập nhật trạng thái Morale
 * 8. Ghi nhận nhật ký hiệp đấu (Round Log)
 * 9. Đánh giá điều kiện kết thúc trận
 */
export function advanceCombatV2Round(
  snapshot: CombatV2EncounterSnapshot,
  roundNumber: number,
  prng?: WorldPRNG,
  config: CombatV2Config = DEFAULT_COMBAT_V2_CONFIG
): {
  roundLog: CombatV2RoundLog
  alliedAggregate: CombatV2ForceAggregate
  enemyAggregate: CombatV2ForceAggregate
  isConcluded: boolean
  outcome?: "allied_victory" | "enemy_victory" | "stalemate" | "allied_retreated" | "enemy_retreated"
} {
  const actions: CombatV2ActionEntry[] = []
  const retreatEvents: Array<{
    gearId: string
    gearName: string
    fromState: CombatGearState
    toState: CombatGearState
    message: string
  }> = []
  const destructionEvents: Array<{
    gearId: string
    gearName: string
    pilotId?: string
    pilotName?: string
    message: string
  }> = []
  const strategyChanges: Array<{
    factionId: string
    previousStrategyId: string
    newStrategyId: string
  }> = []

  // 1. Áp dụng chiến thuật xếp hàng tại biên hiệp
  if (snapshot.alliedCommander.queuedStrategyId) {
    const prev = snapshot.alliedCommander.currentStrategyId
    const next = snapshot.alliedCommander.queuedStrategyId
    snapshot.alliedCommander.currentStrategyId = next
    snapshot.alliedCommander.queuedStrategyId = null
    strategyChanges.push({ factionId: "vss", previousStrategyId: prev, newStrategyId: next })
  }

  if (snapshot.enemyCommander.queuedStrategyId) {
    const prev = snapshot.enemyCommander.currentStrategyId
    const next = snapshot.enemyCommander.queuedStrategyId
    snapshot.enemyCommander.currentStrategyId = next
    snapshot.enemyCommander.queuedStrategyId = null
    strategyChanges.push({ factionId: "void", previousStrategyId: prev, newStrategyId: next })
  }

  // 1.1 Kích hoạt kỹ năng hỗ trợ quỹ đạo (Support Fleet Round Execution)
  const supportEvents: Array<{
    entityId: string
    entityName: string
    skillId: string
    skillName: string
    mode: "auto" | "manual"
    message: string
  }> = []

  if (snapshot.alliedSupport && snapshot.alliedSupport.length > 0) {
    const suppRes = executeSupportRound(
      snapshot.alliedSupport,
      snapshot.queuedSupportSkillId || null,
      roundNumber
    )
    if (suppRes.executedSkills.length > 0) {
      for (const es of suppRes.executedSkills) {
        supportEvents.push({
          entityId: es.entityId,
          entityName: es.entityName,
          skillId: es.skillId,
          skillName: es.skillName,
          mode: es.mode,
          message: es.message,
        })
      }
    }
    // Xóa hàng đợi hỗ trợ đã áp dụng
    snapshot.queuedSupportSkillId = null
  }

  // 1.2 Đánh giá rút lui tự động của NPC (NPC Tactical Retreat Evaluation)
  for (const g of snapshot.alliedGears) {
    if (evaluateNpcRetreat(g, snapshot.alliedMorale.currentMorale, snapshot.alliedCommander.currentStrategyId, config)) {
      const ret = orderGearRetreat(g, config.defaultRetreatDurationRounds)
      if (ret.success) {
        retreatEvents.push({
          gearId: g.gearId,
          gearName: g.name,
          fromState: "ACTIVE",
          toState: "RETREATING",
          message: `${g.name} (Đồng minh NPC) phát lệnh thoát ly chiến trường (${config.defaultRetreatDurationRounds} hiệp còn lại).`,
        })
      }
    }
  }

  for (const g of snapshot.enemyGears) {
    if (evaluateNpcRetreat(g, snapshot.enemyMorale.currentMorale, snapshot.enemyCommander.currentStrategyId, config)) {
      const ret = orderGearRetreat(g, config.defaultRetreatDurationRounds)
      if (ret.success) {
        retreatEvents.push({
          gearId: g.gearId,
          gearName: g.name,
          fromState: "ACTIVE",
          toState: "RETREATING",
          message: `${g.name} (The Void NPC) phát lệnh thoát ly chiến trường (${config.defaultRetreatDurationRounds} hiệp còn lại).`,
        })
      }
    }
  }

  const alliedStrat =
    COMBAT_V2_STRATEGIES[snapshot.alliedCommander.currentStrategyId] || COMBAT_V2_STRATEGIES.balanced
  const enemyStrat =
    COMBAT_V2_STRATEGIES[snapshot.enemyCommander.currentStrategyId] || COMBAT_V2_STRATEGIES.balanced

  // 2. Xác định các đơn vị đủ điều kiện hành động và sắp xếp theo Speed
  const allActors: Array<{ gear: CombatV2Gear; side: CombatSide }> = []

  for (const g of snapshot.alliedGears) {
    if (g.state === "ACTIVE" || (g.state === "RETREATING" && config.retreatOffenseReductionRatio < 1.0)) {
      allActors.push({ gear: g, side: "allied" })
    }
  }
  for (const g of snapshot.enemyGears) {
    if (g.state === "ACTIVE" || (g.state === "RETREATING" && config.retreatOffenseReductionRatio < 1.0)) {
      allActors.push({ gear: g, side: "enemy" })
    }
  }

  // Sắp xếp thứ tự ra đòn theo tốc độ (Speed DESC) kèm tie-break ổn định theo gearId
  allActors.sort((a, b) => {
    if (b.gear.speed !== a.gear.speed) return b.gear.speed - a.gear.speed
    return a.gear.gearId.localeCompare(b.gear.gearId)
  })

  // 3. Giải quyết hành động & áp dụng sát thương
  for (const { gear: actor, side: actorSide } of allActors) {
    // Nếu đơn vị đã bị phá hủy giữa hiệp, bỏ qua lượt
    if (actor.state === "DESTROYED" || actor.currentHp <= 0) continue

    const opposingGears = actorSide === "allied" ? snapshot.enemyGears : snapshot.alliedGears
    const validTargets = opposingGears.filter((g) => g.state === "ACTIVE" || g.state === "RETREATING")

    if (validTargets.length === 0) break // Không còn mục tiêu hợp lệ

    // Thuật toán chọn mục tiêu: ưu tiên mục tiêu thấp máu nhất để kết liễu hoặc chọn theo PRNG
    validTargets.sort((a, b) => a.currentHp - b.currentHp)
    const target = validTargets[0]

    const actorStrat = actorSide === "allied" ? alliedStrat : enemyStrat
    const targetStrat = actorSide === "allied" ? enemyStrat : alliedStrat

    // Tính toán sát thương chuẩn tắc theo công thức công-thủ có điều chỉnh chiến thuật
    const rawAttack = actor.attack * actorStrat.offensiveMultiplier
    const rawDefense = target.defense * 0.4 * targetStrat.defensiveMultiplier
    const variance = prng ? 0.9 + prng.nextFloat() * 0.2 : 1.0
    const damage = Math.max(1, Math.round((rawAttack - rawDefense) * variance))

    target.currentHp = Math.max(0, target.currentHp - damage)
    const targetStateBefore = target.state

    let isCrit = false
    if (prng && prng.nextInt(1, 100) <= 15) {
      isCrit = true
    }

    if (target.currentHp === 0) {
      target.state = "DESTROYED"
      destructionEvents.push({
        gearId: target.gearId,
        gearName: target.name,
        pilotId: target.pilotId,
        pilotName: target.pilotName,
        message: `${target.name} đã bị phá hủy hoàn toàn tại Hiệp ${roundNumber}. Cỗ máy không thể phục hồi.`,
      })
    }

    actions.push({
      actorGearId: actor.gearId,
      actorName: actor.name,
      actorSide,
      targetGearId: target.gearId,
      targetName: target.name,
      targetSide: actorSide === "allied" ? "enemy" : "allied",
      damageDealt: damage,
      targetRemainingHp: target.currentHp,
      targetState: target.state,
      isCritical: isCrit,
      description: `${actor.name} (${actorSide.toUpperCase()}) bắn trúng ${target.name}, gây ${damage} sát thương.${
        target.state === "DESTROYED" ? " [TIÊU DIỆT]" : ""
      }`,
    })
  }

  // 4. Tiến triển trạng thái rút lui (Advance Retreat State)
  const allGears = [...snapshot.alliedGears, ...snapshot.enemyGears]
  for (const gear of allGears) {
    if (gear.state === "RETREATING" && gear.retreatTurnsRemaining !== undefined) {
      gear.retreatTurnsRemaining -= 1
      if (gear.retreatTurnsRemaining <= 0) {
        gear.state = "RETREATED"
        retreatEvents.push({
          gearId: gear.gearId,
          gearName: gear.name,
          fromState: "RETREATING",
          toState: "RETREATED",
          message: `${gear.name} đã hoàn tất thoát ly khỏi chiến trường an toàn.`,
        })
      }
    }
  }

  // 5. Tính toán lại các chỉ số tổng hợp phía 2 bên
  const alliedAggregate = recalculateForceAggregate(
    snapshot.alliedGears,
    "allied",
    snapshot.alliedMorale.currentMorale,
    config
  )
  const enemyAggregate = recalculateForceAggregate(
    snapshot.enemyGears,
    "enemy",
    snapshot.enemyMorale.currentMorale,
    config
  )

  // 6. Cập nhật Morale (Hook)
  if (destructionEvents.length > 0) {
    const alliedLosses = destructionEvents.filter((d) =>
      snapshot.alliedGears.some((g) => g.gearId === d.gearId)
    ).length
    const enemyLosses = destructionEvents.filter((d) =>
      snapshot.enemyGears.some((g) => g.gearId === d.gearId)
    ).length

    if (alliedLosses > 0) {
      snapshot.alliedMorale.currentMorale = Math.max(
        0,
        snapshot.alliedMorale.currentMorale - alliedLosses * 8
      )
    }
    if (enemyLosses > 0) {
      snapshot.enemyMorale.currentMorale = Math.max(
        0,
        snapshot.enemyMorale.currentMorale - enemyLosses * 8
      )
    }
  }

  // 7. Đánh giá điều kiện kết thúc trận
  let isConcluded = false
  let outcome: "allied_victory" | "enemy_victory" | "stalemate" | "allied_retreated" | "enemy_retreated" | undefined

  if (!enemyAggregate.hasViableCombatants && !alliedAggregate.hasViableCombatants) {
    isConcluded = true
    outcome = "stalemate"
  } else if (!enemyAggregate.hasViableCombatants) {
    isConcluded = true
    outcome = enemyAggregate.retreatedCount > 0 && enemyAggregate.destroyedCount === 0
      ? "enemy_retreated"
      : "allied_victory"
  } else if (!alliedAggregate.hasViableCombatants) {
    isConcluded = true
    outcome = alliedAggregate.retreatedCount > 0 && alliedAggregate.destroyedCount === 0
      ? "allied_retreated"
      : "enemy_victory"
  } else if (roundNumber >= snapshot.maxRounds) {
    isConcluded = true
    if (alliedAggregate.hpPercent > enemyAggregate.hpPercent) {
      outcome = "allied_victory"
    } else if (enemyAggregate.hpPercent > alliedAggregate.hpPercent) {
      outcome = "enemy_victory"
    } else {
      outcome = "stalemate"
    }
  }

  // 8. Biên soạn nhật ký hiệp đấu
  const roundLog: CombatV2RoundLog = {
    round: roundNumber,
    actions,
    retreatEvents,
    destructionEvents,
    strategyChanges,
    supportEvents,
    alliedHpRemaining: alliedAggregate.totalCurrentHp,
    enemyHpRemaining: enemyAggregate.totalCurrentHp,
    summary: `Hiệp ${roundNumber}: ${actions.length} lượt công kích, ${destructionEvents.length} tiêu diệt, ${retreatEvents.length} rút lui hoàn tất, ${supportEvents.length} hỗ trợ. HP VSS: ${alliedAggregate.totalCurrentHp}/${alliedAggregate.totalMaxHp} | HP The Void: ${enemyAggregate.totalCurrentHp}/${enemyAggregate.totalMaxHp}`,
  }

  return {
    roundLog,
    alliedAggregate,
    enemyAggregate,
    isConcluded,
    outcome,
  }
}

/**
 * Mô phỏng tự động toàn bộ trận chiến Combat V2 từ đầu đến cuối không cần tương tác UI (Headless Execution)
 */
export function executeCombatV2Simulation(
  snapshot: CombatV2EncounterSnapshot,
  options?: {
    maxRounds?: number
    prng?: WorldPRNG
    config?: CombatV2Config
    survivalConfig?: SurvivalConfig
  }
): CombatV2Result {
  const prng = options?.prng || new WorldPRNG(snapshot.seed || 12345)
  const config = options?.config || DEFAULT_COMBAT_V2_CONFIG
  const maxRounds = options?.maxRounds || snapshot.maxRounds || config.maxCombatRounds

  const roundLogs: CombatV2RoundLog[] = []
  let completedRounds = 0
  let outcome: "allied_victory" | "enemy_victory" | "stalemate" | "allied_retreated" | "enemy_retreated" =
    "stalemate"

  let currentAlliedAgg = recalculateForceAggregate(
    snapshot.alliedGears,
    "allied",
    snapshot.alliedMorale.currentMorale,
    config
  )
  let currentEnemyAgg = recalculateForceAggregate(
    snapshot.enemyGears,
    "enemy",
    snapshot.enemyMorale.currentMorale,
    config
  )

  for (let round = 1; round <= maxRounds; round++) {
    completedRounds = round
    const stepResult = advanceCombatV2Round(snapshot, round, prng, config)
    roundLogs.push(stepResult.roundLog)
    currentAlliedAgg = stepResult.alliedAggregate
    currentEnemyAgg = stepResult.enemyAggregate

    if (stepResult.isConcluded && stepResult.outcome) {
      outcome = stepResult.outcome
      break
    }
  }

  // Thu thập danh sách cỗ máy theo trạng thái kết quả
  const allGears = [...snapshot.alliedGears, ...snapshot.enemyGears]
  const survivingActiveGears = allGears.filter((g) => g.state === "ACTIVE")
  const retreatedGears = allGears.filter((g) => g.state === "RETREATED" || g.state === "RETREATING")
  const destroyedGears = allGears.filter((g) => g.state === "DESTROYED")

  // Trích xuất ứng viên phi công cho Phase 6.34 (Pilot Survival & Rescue)
  const downedPilotCandidates: DownedPilotCandidate[] = destroyedGears.map((g) => ({
    gearId: g.gearId,
    gearName: g.name,
    pilotId: g.pilotId,
    pilotName: g.pilotName,
    side: g.side,
    isPlayer: g.isPlayer ?? false,
    destructionRound: completedRounds,
  }))

  const victory = outcome === "allied_victory"

  // Phase 6.34: Xử lý sinh tồn và tìm kiếm cứu nạn phi công (SAR)
  const pilotSurvivalRecords = processCombatDownedPilots({
    encounterId: snapshot.encounterId,
    transactionId: snapshot.transactionId,
    sectorId: snapshot.sectorId,
    victory,
    alliedAggregate: currentAlliedAgg,
    enemyAggregate: currentEnemyAgg,
    candidates: downedPilotCandidates,
    config: options?.survivalConfig,
    hasActiveSupport: snapshot.alliedSupport && snapshot.alliedSupport.length > 0,
    prng: () => prng.nextFloat(),
  })

  return {
    encounterId: snapshot.encounterId,
    transactionId: snapshot.transactionId,
    sectorId: snapshot.sectorId,
    combatVersion: "v2",
    completedAtTimestamp: Date.now(),
    completedRounds,
    outcome,
    victory,
    alliedAggregate: currentAlliedAgg,
    enemyAggregate: currentEnemyAgg,
    survivingActiveGears,
    retreatedGears,
    destroyedGears,
    alliedCommander: snapshot.alliedCommander,
    enemyCommander: snapshot.enemyCommander,
    roundLogs,
    downedPilotCandidates,
    pilotSurvivalRecords,
  }
}

/**
 * Trích xuất View-Model tối ưu cho giao diện người dùng tương lai (Phase 6.33 Target)
 */
export function deriveBattlefieldViewModel(
  snapshot: CombatV2EncounterSnapshot,
  currentRound: number,
  isConcluded: boolean,
  outcome?: string,
  victory?: boolean,
  recentLogs: CombatV2RoundLog[] = []
): CombatV2BattlefieldViewModel {
  const alliedForce = recalculateForceAggregate(
    snapshot.alliedGears,
    "allied",
    snapshot.alliedMorale.currentMorale
  )
  const enemyForce = recalculateForceAggregate(
    snapshot.enemyGears,
    "enemy",
    snapshot.enemyMorale.currentMorale
  )

  const alliedGears = snapshot.alliedGears.map((g) => ({
    ...g,
    hpPercent: g.maxHp > 0 ? Number(((g.currentHp / g.maxHp) * 100).toFixed(1)) : 0,
    isPlayerCommander: g.isPlayer && snapshot.alliedCommander.isPlayerCommander,
  }))

  const enemyGears = snapshot.enemyGears.map((g) => ({
    ...g,
    hpPercent: g.maxHp > 0 ? Number(((g.currentHp / g.maxHp) * 100).toFixed(1)) : 0,
  }))

  const availableStrategies = Object.values(COMBAT_V2_STRATEGIES)

  return {
    round: currentRound,
    maxRounds: snapshot.maxRounds,
    isConcluded,
    outcome,
    victory,
    alliedForce,
    enemyForce,
    alliedGears,
    enemyGears,
    commanderStrategy: {
      hasAuthority: snapshot.alliedCommander.hasActiveAuthority,
      currentStrategyId: snapshot.alliedCommander.currentStrategyId,
      queuedStrategyId: snapshot.alliedCommander.queuedStrategyId,
      availableStrategies,
    },
    supportEntities: snapshot.alliedSupport,
    queuedSupportSkillId: snapshot.queuedSupportSkillId,
    recentLogs,
  }
}

/**
 * Chuyển đổi CombatV2Result sang CombatResultReceipt tiêu chuẩn để commit vào WorldState
 */
export function combatV2ResultToReceipt(result: CombatV2Result): CombatResultReceipt {
  let rating: "S+" | "S" | "A" | "B" | "C" = "B"
  if (result.victory) {
    if (result.alliedAggregate.destroyedCount === 0 && result.completedRounds <= 5) {
      rating = "S+"
    } else if (result.alliedAggregate.destroyedCount === 0) {
      rating = "S"
    } else if (result.alliedAggregate.destroyedCount <= 1) {
      rating = "A"
    } else {
      rating = "B"
    }
  } else {
    rating = "C"
  }

  let sarText = ""
  if (result.pilotSurvivalRecords && result.pilotSurvivalRecords.length > 0) {
    const rescued = result.pilotSurvivalRecords.filter((r) => r.finalStatus === "RESCUED").length
    const captured = result.pilotSurvivalRecords.filter((r) => r.finalStatus === "CAPTURED").length
    const kia = result.pilotSurvivalRecords.filter((r) => r.finalStatus === "KIA").length
    sarText = ` | SAR: ${rescued} Được cứu, ${captured} Bị bắt, ${kia} Tử trận.`
  }

  return {
    transactionId: result.transactionId,
    encounterId: result.encounterId,
    combatVersion: "v2",
    sectorId: result.sectorId,
    victory: result.victory,
    rounds: result.completedRounds,
    playerRemainingHpPercent: result.alliedAggregate.hpPercent,
    enemyRemainingHpPercent: result.enemyAggregate.hpPercent,
    tacticalRating: rating,
    logSummary: `[COMBAT V2] Kết quả: ${result.outcome.toUpperCase()} sau ${result.completedRounds} hiệp. Quân VSS: ${result.alliedAggregate.activeCount} sống sót, ${result.alliedAggregate.destroyedCount} tổn thất.${sarText}`,
    completedAtTimestamp: result.completedAtTimestamp,
  }
}

/**
 * Commit kết quả trận đấu Combat V2 vào World State một cách an toàn và lũy đẳng
 */
export function commitCombatV2Result(
  state: WorldState,
  result: CombatV2Result
): CombatResolutionResult {
  const receipt = combatV2ResultToReceipt(result)
  const resolution = commitCombatResultReceipt(state, receipt)

  // Phase 6.34: Áp dụng kết quả sinh tồn của phi công vào WorldState một cách an toàn và lũy đẳng
  if (resolution.applied || resolution.alreadyCommitted) {
    if (result.pilotSurvivalRecords && result.pilotSurvivalRecords.length > 0) {
      const sarSummary = applyPilotSurvivalToWorldState(state, result.pilotSurvivalRecords, result.sectorId)
      resolution.pilotSurvivalSummary = {
        rescued: sarSummary.rescuedCount,
        captured: sarSummary.capturedCount,
        kia: sarSummary.kiaCount,
        unlockedRescueMissions: sarSummary.unlockedRescueMissions,
      }
    }
  }

  return resolution
}
