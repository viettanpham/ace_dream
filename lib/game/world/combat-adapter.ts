/**
 * STARFRONT WORLD — Combat Integration Adapter (Phase 6.6)
 * Tầng chuyển tiếp và trung gian duy nhất giữa STARFRONT WORLD và Đấu Trường (Combat Arena):
 *   - Tạo Encounter Snapshot bất biến tại thời điểm khóa trận (freeze garrison & parameters)
 *   - Cấp phát Transaction ID ổn định (UUID / Unique string)
 *   - Tiếp nhận CombatResultReceipt và áp dụng hậu quả chiến lược vào World State duy nhất 1 lần
 *   - Chống áp dụng hai lần (Idempotency Guard) với kiểm tra đã commit
 *   - Hỗ trợ luồng phục hồi trận treo (Suspended Recovery) và hủy bỏ an toàn (Safe Abort) không phạt oan
 */

import { evaluateSectorStage } from "./sector-lifecycle"
import { transferSectorControl } from "./forces-ledger"
import {
  createJournalEntry,
  getJournalEntry,
  isTransactionCommitted,
  markTransactionAborted,
  markTransactionCommitted,
} from "./transaction-journal"
import type {
  AbortCombatResult,
  CombatResolutionResult,
  CombatResultReceipt,
  CombatVersion,
  EncounterSnapshot,
  StrategicOrder,
  WorldBattleContext,
  WorldSector,
  WorldState,
} from "./types"
import type { BattleResult, CombatState, CombatUnit, EnemyEncounterType } from "../types"
import { ENEMIES_DATA } from "../data"

export type { WorldBattleContext }

export const DEFAULT_COMBAT_VERSION: CombatVersion = "v1"

/**
 * Tùy chọn cấu hình khi khóa trận đấu chiến lược
 */
export interface LockEncounterOptions {
  sectorId: string
  combatVersion?: CombatVersion
  objective?: "eliminate_enemy" | "survive_rounds" | "defend_garrison"
  maxRounds?: number
  customEnemyName?: string
  customEnemyType?: string
  overrideTransactionId?: string
  overrideEncounterId?: string
}

/**
 * Xác thực cấu trúc dữ liệu của CombatResultReceipt
 */
export function validateCombatResultReceipt(
  receipt: unknown,
): receipt is CombatResultReceipt {
  if (!receipt || typeof receipt !== "object") return false
  const r = receipt as Partial<CombatResultReceipt>

  return (
    typeof r.transactionId === "string" &&
    r.transactionId.trim().length > 0 &&
    typeof r.encounterId === "string" &&
    r.encounterId.trim().length > 0 &&
    (r.combatVersion === "v1" || r.combatVersion === "v2") &&
    typeof r.sectorId === "string" &&
    r.sectorId.trim().length > 0 &&
    typeof r.victory === "boolean" &&
    typeof r.rounds === "number" &&
    r.rounds >= 0 &&
    typeof r.playerRemainingHpPercent === "number" &&
    r.playerRemainingHpPercent >= 0 &&
    r.playerRemainingHpPercent <= 100 &&
    typeof r.enemyRemainingHpPercent === "number" &&
    r.enemyRemainingHpPercent >= 0 &&
    r.enemyRemainingHpPercent <= 100 &&
    typeof r.completedAtTimestamp === "number"
  )
}

/**
 * Khóa trận chiến và tạo Encounter Snapshot bất biến
 * Đóng băng tạm thời lực lượng đồn trú tại sector để ngăn ngừa việc sửa đổi trong khi trận diễn ra.
 */
export function lockEncounterAndCreateSnapshot(
  state: WorldState,
  options: LockEncounterOptions,
): EncounterSnapshot {
  const {
    sectorId,
    combatVersion = DEFAULT_COMBAT_VERSION,
    objective = "eliminate_enemy",
    maxRounds = 20,
    customEnemyName,
    customEnemyType = "void-vanguard",
    overrideTransactionId,
    overrideEncounterId,
  } = options

  const sector = state.sectors[sectorId]
  if (!sector) {
    throw new Error(`Sector không tồn tại trên bản đồ: ${sectorId}`)
  }

  // Nếu sector đã bị khóa bởi một trận chiến khác đang diễn ra
  if (sector.isLockedForCombat) {
    if (overrideTransactionId && overrideTransactionId !== state.suspendedSnapshot?.transactionId) {
      throw new Error(
        `Sector ${sector.name} hiện đang bị khóa bởi trận chiến khác. Hãy hoàn tất hoặc hủy bỏ trận trước khi bắt đầu trận mới.`,
      )
    }
    if (state.suspendedSnapshot && state.suspendedSnapshot.sectorId === sectorId && !overrideTransactionId) {
      return state.suspendedSnapshot
    }
    throw new Error(
      `Sector ${sector.name} hiện đang bị khóa bởi trận chiến khác. Hãy hoàn tất hoặc hủy bỏ trận trước khi bắt đầu trận mới.`,
    )
  }

  const now = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const transactionId = overrideTransactionId || `tx-cbt-${now}-${randomSuffix}`
  const encounterId = overrideEncounterId || `enc-${sector.id}-${now}`

  // Tính toán chỉ số kẻ địch dựa trên threatLevel của sector
  const threat = Math.max(50, Math.min(1000, sector.threatLevel))
  const enemyHp = Math.round(180 + threat * 1.4)
  const enemyAttack = Math.round(28 + threat * 0.2)
  const enemyDefense = Math.round(16 + threat * 0.12)
  const enemySpeed = Math.round(45 + (threat % 35))

  const enemyName =
    customEnemyName ||
    (threat >= 700
      ? `Hạm Đội Mẹ Hạm The Void (${sector.name})`
      : threat >= 400
        ? `Quân Đoàn Đột Kích The Void #${sector.id.toUpperCase()}`
        : `Tuần Dương Tiên Phong The Void`)

  // Tính toán friendly modifiers từ công sự, sĩ khí và lệnh chiến lược
  const fortification = sector.fortificationLevel ?? (sector.stage === "normal" ? 2 : 1)
  const defenseMultiplier = Number(
    (1 + fortification * 0.15 + (sector.strategicOrder === "defend" ? 0.25 : 0)).toFixed(2),
  )
  const moraleMultiplier = Number(
    (sector.stability >= 75 ? 1.15 : sector.stability < 30 ? 0.8 : 1.0).toFixed(2),
  )

  // Khóa sector và đóng băng quân đồn trú
  sector.isLockedForCombat = true
  sector.lockedGarrisonPower = sector.garrisonPower

  const snapshot: EncounterSnapshot = {
    transactionId,
    encounterId,
    combatVersion,
    sectorId: sector.id,
    sectorName: sector.name,
    enemyEncounterType: customEnemyType,
    enemyUnit: {
      name: enemyName,
      hp: enemyHp,
      maxHp: enemyHp,
      attack: enemyAttack,
      defense: enemyDefense,
      speed: enemySpeed,
    },
    friendlyModifiers: {
      fortificationLevel: fortification,
      defenseMultiplier,
      moraleMultiplier,
      strategicOrder: sector.strategicOrder,
    },
    lockedGarrison: sector.garrisonPower,
    winConditions: {
      objective,
      maxRounds,
    },
    lockedAtTimestamp: now,
    status: "locked",
  }

  // Đăng ký vào Transaction Journal
  createJournalEntry(state, {
    transactionId,
    type: "combat",
    status: "pending",
    sectorId: sector.id,
    snapshot,
  })

  // Đánh dấu trạng thái suspended để sẵn sàng phục hồi nếu app reload
  state.isSuspendedCombat = true
  state.suspendedEncounterId = encounterId
  state.suspendedSnapshot = snapshot

  return snapshot
}

/**
 * Áp dụng biên lai kết quả chiến đấu vào World State với cơ chế bảo vệ lũy đẳng (Idempotent Apply)
 * WORLD vẫn là nguồn dữ liệu có thẩm quyền duy nhất về sector, sovereignty, quân số, Threat và tài nguyên.
 */
export function commitCombatResultReceipt(
  state: WorldState,
  receipt: CombatResultReceipt,
): CombatResolutionResult {
  // 1. Bộ lọc lũy đẳng (Idempotency Filter): Chặn ngay nếu giao dịch đã từng được áp dụng
  if (isTransactionCommitted(state, receipt.transactionId)) {
    return {
      applied: false,
      alreadyCommitted: true,
      transactionId: receipt.transactionId,
      encounterId: receipt.encounterId,
      sectorId: receipt.sectorId,
      victory: receipt.victory,
      message: `Giao dịch ${receipt.transactionId} đã được commit trước đó. Kích hoạt bộ lọc chống áp dụng hai lần (Idempotency Filter).`,
    }
  }

  // 2. Xác thực tính hợp lệ của biên lai kết quả
  if (!validateCombatResultReceipt(receipt)) {
    const rawTxId = (receipt as any)?.transactionId
    return {
      applied: false,
      transactionId: typeof rawTxId === "string" ? rawTxId : "unknown",
      error: "Biên lai kết quả trận đấu không hợp lệ hoặc thiếu các trường bắt buộc.",
      message: "Từ chối áp dụng kết quả do biên lai không hợp lệ.",
    }
  }

  // 3. Kiểm tra tính tương thích phiên bản Combat
  if (receipt.combatVersion !== "v1" && receipt.combatVersion !== "v2") {
    return {
      applied: false,
      transactionId: receipt.transactionId,
      error: `Phiên bản combatVersion "${receipt.combatVersion}" không được hỗ trợ. Chỉ hỗ trợ cấu hình "v1" hoặc "v2".`,
      message: "Từ chối áp dụng do phiên bản combat không tương thích.",
    }
  }

  // 4. Tra cứu bản ghi trong Journal
  const entry = getJournalEntry(state, receipt.transactionId)
  if (!entry || entry.type !== "combat") {
    return {
      applied: false,
      transactionId: receipt.transactionId,
      error: `Không tìm thấy bản ghi giao dịch chiến đấu tương ứng trong journal: ${receipt.transactionId}`,
      message: "Từ chối áp dụng vì không tìm thấy giao dịch đã đăng ký.",
    }
  }

  // Chặn không cho phép commit giao dịch đã bị hủy bỏ (Aborted)
  if (entry.status === "aborted") {
    return {
      applied: false,
      transactionId: receipt.transactionId,
      error: `Giao dịch ${receipt.transactionId} đã bị hủy bỏ an toàn trước đó, không thể commit kết quả.`,
      message: "Từ chối áp dụng kết quả của giao dịch đã hủy bỏ.",
    }
  }

  // 5. Kiểm tra sector có tồn tại
  const sector = state.sectors[receipt.sectorId]
  if (!sector) {
    return {
      applied: false,
      transactionId: receipt.transactionId,
      error: `Sector không tồn tại trên bản đồ: ${receipt.sectorId}`,
      message: "Từ chối áp dụng vì sector không tồn tại.",
    }
  }

  // 6. Tính toán hậu quả chiến lược căn cứ vào kết quả trận đấu
  let threatChange = 0
  let stabilityChange = 0
  let garrisonCasualties = 0
  let garrisonWounded = 0
  let resourceRewards: Partial<typeof state.resources> | undefined = undefined
  let sovereigntyTransferred = false

  if (receipt.victory) {
    // === CHIẾN THẮNG ===
    // Giảm mạnh mức độ đe dọa (Threat) của sector
    threatChange = -Math.round(140 + Math.min(260, sector.threatLevel * 0.35))
    sector.threatLevel = Math.max(0, sector.threatLevel + threatChange)

    // Tăng chỉ số ổn định (Stability)
    stabilityChange = Math.round(12 + Math.min(20, (100 - sector.stability) * 0.25))
    sector.stability = Math.min(100, sector.stability + stabilityChange)

    // Thưởng tài nguyên chiến lược
    resourceRewards = {
      tacticalData: 130,
      industrialMaterials: 95,
      energy: 70,
    }
    state.resources.tacticalData += resourceRewards.tacticalData!
    state.resources.industrialMaterials += resourceRewards.industrialMaterials!
    state.resources.energy += resourceRewards.energy!

    // Thương vong thân thiện: Tỷ lệ thương binh phụ thuộc vào lượng HP người chơi bị mất
    const hpLossRatio = Math.max(0, (100 - receipt.playerRemainingHpPercent) / 100)
    if (hpLossRatio > 0 && sector.garrisonPower > 0) {
      const totalLoss = Math.round(sector.garrisonPower * (hpLossRatio * 0.12))
      garrisonCasualties = Math.round(totalLoss * 0.2)
      garrisonWounded = totalLoss - garrisonCasualties

      if (totalLoss > 0) {
        sector.garrisonPower = Math.max(0, sector.garrisonPower - totalLoss)
        state.military.deployed = Math.max(0, state.military.deployed - totalLoss)
        state.military.woundedOrRepair += garrisonWounded
        state.military.casualties += garrisonCasualties
      }
    }

    // Tái đánh giá vòng đời sector (có thể chuyển từ threatened / under_siege về normal / fortified)
    evaluateSectorStage(sector)
  } else {
    // === THẤT BẠI ===
    // Hậu quả thất bại theo ngữ cảnh (Contextual Defeat Penalties):
    // Thất bại trong trận đánh KHÔNG mặc định là mất trắng sector ngay lập tức
    threatChange = Math.round(120 + (1000 - sector.threatLevel) * 0.2)
    sector.threatLevel = Math.min(1000, sector.threatLevel + threatChange)

    stabilityChange = -25
    sector.stability = Math.max(0, sector.stability + stabilityChange)

    // Tổn thất lực lượng đồn trú: 25% quân số đồn trú
    const lossRatio = 0.25
    const totalLost = Math.round(sector.garrisonPower * lossRatio)
    garrisonCasualties = Math.round(totalLost * 0.4)
    garrisonWounded = totalLost - garrisonCasualties

    if (totalLost > 0) {
      sector.garrisonPower = Math.max(0, sector.garrisonPower - totalLost)
      state.military.deployed = Math.max(0, state.military.deployed - totalLost)
      state.military.casualties += garrisonCasualties
      state.military.woundedOrRepair += garrisonWounded
    }

    // Nếu sector có công sự phòng thủ, công sự giảm 1 cấp và sector chuyển sang under_siege
    if (sector.fortificationLevel && sector.fortificationLevel > 0) {
      sector.fortificationLevel = Math.max(0, sector.fortificationLevel - 1)
      sector.stage = "under_siege"
    } else if (sector.garrisonPower === 0) {
      // Nếu đồn trú sụp đổ hoàn toàn và không có công sự -> Sector thất thủ (Lost)
      sector.stage = "lost"
      transferSectorControl(state, sector.id, "void")
      sovereigntyTransferred = true
    } else {
      sector.stage = "under_siege"
    }
  }

  // 7. Mở khóa sector sau trận đấu
  sector.isLockedForCombat = false
  sector.lockedGarrisonPower = undefined

  // 8. Đánh dấu giao dịch đã committed vào Transaction Journal
  markTransactionCommitted(state, receipt.transactionId, receipt)

  // 9. Dọn dẹp trạng thái suspended nếu khớp
  if (
    state.suspendedEncounterId === receipt.encounterId ||
    state.suspendedSnapshot?.transactionId === receipt.transactionId
  ) {
    state.isSuspendedCombat = false
    state.suspendedEncounterId = undefined
    state.suspendedSnapshot = undefined
  }

  return {
    applied: true,
    alreadyCommitted: false,
    transactionId: receipt.transactionId,
    encounterId: receipt.encounterId,
    sectorId: sector.id,
    victory: receipt.victory,
    strategicConsequences: {
      threatChange,
      stabilityChange,
      garrisonCasualties,
      garrisonWounded,
      resourceRewards,
      newSectorStage: sector.stage,
      sovereigntyTransferred,
    },
    message: receipt.victory
      ? `Chiến thắng tại Sector ${sector.name}! Threat giảm ${Math.abs(threatChange)}, Stability tăng +${stabilityChange}.`
      : `Thất bại tại Sector ${sector.name}! Sector chuyển sang ${sector.stage.toUpperCase()}, Threat tăng +${threatChange}.`,
  }
}

/**
 * Hủy bỏ an toàn trận đấu đang bị treo hoặc dở dang (Safe Abort)
 * Hoàn trả đồn trú về trạng thái trước khi khóa trận, KHÔNG áp dụng bất kỳ hình phạt giả nào.
 */
export function abortSuspendedCombat(
  state: WorldState,
  transactionId: string,
  reason?: string,
): AbortCombatResult {
  const entry = getJournalEntry(state, transactionId)

  if (!entry || entry.type !== "combat") {
    return {
      success: false,
      transactionId,
      restoredGarrison: 0,
      error: `Không tìm thấy giao dịch chiến đấu: ${transactionId}`,
      message: "Hủy bỏ thất bại: giao dịch không tồn tại.",
    }
  }

  if (entry.status === "committed") {
    return {
      success: false,
      transactionId,
      restoredGarrison: 0,
      error: "Giao dịch đã được commit vào World State, không thể hủy bỏ.",
      message: "Hủy bỏ thất bại do giao dịch đã hoàn tất.",
    }
  }

  // Mở khóa sector và khôi phục đồn trú nếu cần
  let restoredGarrison = 0
  if (entry.sectorId && state.sectors[entry.sectorId]) {
    const sector = state.sectors[entry.sectorId]
    sector.isLockedForCombat = false
    if (sector.lockedGarrisonPower !== undefined) {
      sector.garrisonPower = sector.lockedGarrisonPower
      restoredGarrison = sector.garrisonPower
      sector.lockedGarrisonPower = undefined
    } else {
      restoredGarrison = sector.garrisonPower
    }
  }

  // Đánh dấu giao dịch bị aborted trong journal
  markTransactionAborted(state, transactionId, reason || "Người chơi hủy bỏ an toàn trận chiến treo")

  // Xóa cờ suspended combat
  if (
    state.suspendedSnapshot?.transactionId === transactionId ||
    state.suspendedEncounterId === entry.snapshot?.encounterId
  ) {
    state.isSuspendedCombat = false
    state.suspendedEncounterId = undefined
    state.suspendedSnapshot = undefined
  }

  return {
    success: true,
    transactionId,
    sectorId: entry.sectorId,
    restoredGarrison,
    message: `Đã hủy bỏ an toàn trận chiến tại Sector ${entry.sectorId || "N/A"}. Lực lượng đồn trú được bảo toàn nguyên vẹn.`,
  }
}

/**
 * Tiếp tục trận chiến đang bị treo (Resume Combat)
 * Tái tạo lại buồng lái từ bản chụp Encounter Snapshot bất biến.
 */
export function resumeSuspendedCombat(
  state: WorldState,
  transactionId?: string,
): EncounterSnapshot | null {
  if (transactionId) {
    const entry = getJournalEntry(state, transactionId)
    if (entry && entry.type === "combat" && entry.snapshot && entry.status !== "committed") {
      return entry.snapshot
    }
  }

  if (state.isSuspendedCombat && state.suspendedSnapshot) {
    return state.suspendedSnapshot
  }

  return null
}

/**
 * Chuyển đổi BattleResult từ Combat Engine hiện có thành CombatResultReceipt chuẩn hóa
 */
export function convertBattleResultToReceipt(
  battleResult: BattleResult,
  snapshot: EncounterSnapshot,
): CombatResultReceipt {
  let playerTotalHp = 0
  let playerMaxHp = 0
  for (const u of battleResult.playerUnits || []) {
    playerTotalHp += Math.max(0, u.hp)
    playerMaxHp += Math.max(1, u.maxHp)
  }

  let enemyTotalHp = 0
  let enemyMaxHp = 0
  for (const u of battleResult.enemyUnits || []) {
    enemyTotalHp += Math.max(0, u.hp)
    enemyMaxHp += Math.max(1, u.maxHp)
  }

  const playerRemainingHpPercent = playerMaxHp > 0
    ? Math.max(0, Math.min(100, Math.round((playerTotalHp / playerMaxHp) * 100)))
    : battleResult.victory ? 100 : 0

  const enemyRemainingHpPercent = enemyMaxHp > 0
    ? Math.max(0, Math.min(100, Math.round((enemyTotalHp / enemyMaxHp) * 100)))
    : battleResult.victory ? 0 : 100

  let tacticalRating: "S+" | "S" | "A" | "B" | "C" = "B"
  if (battleResult.victory) {
    if (playerRemainingHpPercent >= 90 && battleResult.rounds <= 5) tacticalRating = "S+"
    else if (playerRemainingHpPercent >= 75 && battleResult.rounds <= 8) tacticalRating = "S"
    else if (playerRemainingHpPercent >= 50) tacticalRating = "A"
    else tacticalRating = "B"
  } else {
    tacticalRating = "C"
  }

  return {
    transactionId: snapshot.transactionId,
    encounterId: snapshot.encounterId,
    combatVersion: snapshot.combatVersion,
    sectorId: snapshot.sectorId,
    victory: battleResult.victory,
    rounds: battleResult.rounds,
    playerRemainingHpPercent,
    enemyRemainingHpPercent,
    tacticalRating,
    completedAtTimestamp: Date.now(),
  }
}

/**
 * Chuyển đổi EncounterSnapshot thành một CombatUnit đối thủ hoàn chỉnh cho Combat Arena (Phase 6.23)
 */
export function buildCombatUnitFromSnapshot(snapshot: EncounterSnapshot): CombatUnit {
  const encType = (snapshot.enemyEncounterType || "void-vanguard") as EnemyEncounterType
  const basePrototype = ENEMIES_DATA[encType] || ENEMIES_DATA["raider-mech"] || ENEMIES_DATA["scout-drone"]

  return {
    id: `enemy-${snapshot.encounterId}`,
    name: snapshot.enemyUnit.name,
    title: `Quân Xâm Lăng The Void // Sector ${snapshot.sectorName}`,
    gearType: basePrototype.gearType,
    archetype: basePrototype.archetype || "aggressive",
    isPlayer: false,
    hp: snapshot.enemyUnit.hp,
    maxHp: snapshot.enemyUnit.maxHp,
    sp: 100,
    maxSp: 100,
    attack: snapshot.enemyUnit.attack,
    defense: snapshot.enemyUnit.defense,
    speed: snapshot.enemyUnit.speed,
    evasion: basePrototype.evasion ?? 10,
    critRate: basePrototype.critRate ?? 0.12,
    statusEffects: [],
    skills: basePrototype.skills,
    skillCooldowns: {},
    avatar: basePrototype.avatar,
    isBoss: snapshot.enemyUnit.hp >= 1000,
  }
}

/**
 * Áp dụng các chỉ số bổ trợ thân thiện (Modifiers) từ Snapshot lên phi thuyền của người chơi (Phase 6.23)
 */
export function applyWorldSnapshotPlayerModifiers(
  playerUnit: CombatUnit,
  snapshot: EncounterSnapshot,
): CombatUnit {
  const cloned = { ...playerUnit }
  const defMult = snapshot.friendlyModifiers.defenseMultiplier || 1.0
  const morMult = snapshot.friendlyModifiers.moraleMultiplier || 1.0
  cloned.defense = Math.round(cloned.defense * defMult)
  cloned.attack = Math.round(cloned.attack * morMult)
  return cloned
}

/**
 * Trích xuất biên lai kết quả chiến đấu CombatResultReceipt từ CombatState (dành riêng cho trận WORLD - Phase 6.23)
 */
export function buildCombatReceiptFromCombatState(
  combatState: CombatState,
  snapshot: EncounterSnapshot,
  isVictory: boolean,
): CombatResultReceipt {
  const playerHpPct = Math.max(
    0,
    Math.min(100, Math.round((combatState.player.hp / Math.max(1, combatState.player.maxHp)) * 100)),
  )
  const enemyHpPct = Math.max(
    0,
    Math.min(100, Math.round((combatState.enemy.hp / Math.max(1, combatState.enemy.maxHp)) * 100)),
  )

  let tacticalRating: "S+" | "S" | "A" | "B" | "C" = "B"
  if (isVictory) {
    if (playerHpPct >= 90 && combatState.turnNumber <= 5) tacticalRating = "S+"
    else if (playerHpPct >= 75 && combatState.turnNumber <= 8) tacticalRating = "S"
    else if (playerHpPct >= 50) tacticalRating = "A"
    else tacticalRating = "B"
  } else {
    tacticalRating = "C"
  }

  return {
    transactionId: snapshot.transactionId,
    encounterId: snapshot.encounterId,
    combatVersion: snapshot.combatVersion || "v1",
    sectorId: snapshot.sectorId,
    victory: isVictory,
    rounds: combatState.turnNumber,
    playerRemainingHpPercent: playerHpPct,
    enemyRemainingHpPercent: enemyHpPct,
    tacticalRating,
    completedAtTimestamp: Date.now(),
  }
}

/**
 * Trạng thái khóa tác chiến của một thực thể (Sector hoặc Base)
 * Phân định rõ ràng giữa Quyền Tra Cứu (Inspection) và Hành Động Bị Giới Hạn (Restricted Action)
 */
export interface EntityCombatLockStatus {
  isLocked: boolean
  canInspect: boolean // Luôn là true theo nguyên tắc UX: Không bao giờ chặn thông tin
  canDeployForces: boolean
  canChangeOrder: boolean
  canUpgradeFortification: boolean
  canResumeCombat: boolean
  reason?: string
}

/**
 * Predicate chuẩn hóa xác định xem một thực thể (Sector/Base) có đang bị khóa giao tranh trực tiếp hay không.
 * Khóa mang tính LOCALIZED: Chỉ thực thể trực tiếp tham chiến hoặc có EncounterSnapshot đang hoạt động mới bị khóa.
 * Các Sector/Căn cứ khác (kể cả cùng phe hay căn cứ địch không tham chiến) TUYỆT ĐỐI KHÔNG bị khóa lan truyền.
 */
export function isEntityCombatLocked(
  entity: { id?: string; isLockedForCombat?: boolean } | string,
  context?: { sectorId?: string; encounterId?: string } | WorldState | null,
): boolean {
  const entityId = typeof entity === "string" ? entity : entity.id

  // 1. Kiểm tra cờ isLockedForCombat trực tiếp trên object nếu có
  if (typeof entity !== "string" && entity.isLockedForCombat === true) {
    return true
  }

  // 2. Nếu context là WorldState, kiểm tra cả sector tương ứng trong state và suspendedSnapshot
  if (context && "sectors" in context && entityId) {
    const sector = context.sectors[entityId]
    if (sector?.isLockedForCombat === true) {
      return true
    }
    if (context.isSuspendedCombat && context.suspendedSnapshot?.sectorId === entityId) {
      return true
    }
    return false
  }

  // 3. Nếu context là encounter context / snapshot
  if (context && "sectorId" in context && entityId) {
    return context.sectorId === entityId
  }

  return false
}

/**
 * Trả về chi tiết trạng thái khóa và phân tách rõ ràng giữa Quyền Tra Cứu (Inspection) và Hành Động Bị Hạn Chế.
 */
export function getEntityCombatLockStatus(
  entity: { id: string; name?: string; isLockedForCombat?: boolean },
  context?: { sectorId?: string; encounterId?: string } | WorldState | null,
): EntityCombatLockStatus {
  const isLocked = isEntityCombatLocked(entity, context)
  return {
    isLocked,
    canInspect: true, // Quyền tra cứu thông tin luôn luôn mở
    canDeployForces: !isLocked,
    canChangeOrder: !isLocked,
    canUpgradeFortification: !isLocked,
    canResumeCombat: isLocked,
    reason: isLocked
      ? "Khu vực đang diễn ra tác chiến trực tiếp [IN COMBAT]. Lực lượng đồn trú đang trực chiến."
      : undefined,
  }
}


