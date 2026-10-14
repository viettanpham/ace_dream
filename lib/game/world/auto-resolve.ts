/**
 * STARFRONT WORLD — Skirmish Auto-Resolve Engine (Phase 6.5)
 * Thuật toán cán cân sức mạnh Lanchester cải tiến để tự động giải quyết các trận đánh phụ,
 * bảo đảm kết quả tất định (Deterministic), phân định kết quả theo tương quan lực lượng,
 * tính toán thương vong theo ngữ cảnh và bảo đảm tính lũy đẳng (Idempotent Commit).
 */

import { WorldPRNG } from "./random"
import { transitionSectorStage } from "./sector-lifecycle"
import { transferSectorControl } from "./forces-ledger"
import { getSectorMaxThreat } from "./threat-engine"
import type {
  FactionId,
  StrategicOrder,
  WorldSector,
  WorldState,
} from "./types"

/**
 * 5 kết quả chuẩn hóa của trận chiến
 */
export type AutoResolveOutcome =
  | "decisive_victory" // Thắng áp đảo
  | "marginal_victory" // Thắng một phần / nhọc nhằn
  | "stalemate"        // Bế tắc / Cầm cự
  | "tactical_retreat" // Rút lui chiến thuật
  | "defeat"           // Thất bại nặng nề

/**
 * Bên tham chiến trong trận auto-resolve
 */
export interface AutoResolveParticipant {
  factionId: FactionId
  name: string
  troops: number
  order?: StrategicOrder
  fortificationLevel?: number // [1..3]
  techModifier?: number       // Mặc định 1.0
  supplyEfficiency?: number   // [0..1.0] Mặc định 1.0 (Giảm nếu đói ăn hoặc thiếu vật tư)
  commanderBonus?: number     // [0..0.3] Mặc định 0
}

/**
 * Dữ liệu đầu vào của một trận auto-resolve
 */
export interface AutoResolveInput {
  encounterId: string
  sectorId: string
  attacker: AutoResolveParticipant
  defender: AutoResolveParticipant
  terrainBonus?: number // Ưu thế địa hình của defender [-0.2 .. +0.3]
  seed?: number
}

/**
 * Kết quả tính toán của trận đánh (Chưa commit vào World State)
 */
export interface AutoResolveResult {
  encounterId: string
  sectorId: string
  outcome: AutoResolveOutcome
  winnerFactionId: FactionId | null
  powerRatio: number // Attacker Power / Defender Power
  attackerEffectivePower: number
  defenderEffectivePower: number

  // Thống kê lực lượng phe tấn công
  attackerInitial: number
  attackerCasualties: number
  attackerWounded: number
  attackerRemaining: number

  // Thống kê lực lượng phe phòng thủ
  defenderInitial: number
  defenderCasualties: number
  defenderWounded: number
  defenderRemaining: number

  // Tác động lên sector
  threatDelta: number
  stabilityDelta: number
  sectorLost: boolean
  infrastructureDamagePercent: number

  summary: string
  combatLogs: string[]
}

/**
 * Kết quả sau khi commit vào World State
 */
export interface CommitAutoResolveResult {
  success: boolean
  committed: boolean
  duplicate: boolean
  transactionId: string
  error?: string
}

/**
 * Tính toán sức mạnh hiệu dụng của một bên tham chiến (Lanchester Modified Power)
 */
export function calculateEffectivePower(
  p: AutoResolveParticipant,
  isDefender: boolean,
  terrainBonus = 0
): number {
  if (p.troops <= 0) return 0

  const techMod = p.techModifier ?? 1.0
  const supplyMod = Math.max(0.2, Math.min(1.2, p.supplyEfficiency ?? 1.0))
  const commanderMod = 1.0 + (p.commanderBonus ?? 0)

  let tacticalBonus = 0
  if (p.order === "defend" && isDefender) {
    tacticalBonus += 0.25 // Lệnh Defend tăng +25% năng lực phòng ngự
  } else if (p.order === "attack" && !isDefender) {
    tacticalBonus += 0.15 // Lệnh Attack tăng +15% sức công phá
  } else if (p.order === "recover") {
    tacticalBonus -= 0.2 // Lệnh Recover tập trung y tế/sửa chữa, giảm 20% khả năng tác chiến
  }

  const fortBonus = isDefender ? (p.fortificationLevel ?? 1) * 0.15 : 0
  const terrainMod = isDefender ? terrainBonus : 0

  const multiplier = techMod * supplyMod * commanderMod * (1.0 + tacticalBonus + fortBonus + terrainMod)
  return Math.max(1, p.troops * Math.max(0.2, multiplier))
}

function nextFloatRange(prng: WorldPRNG, min: number, max: number): number {
  return min + prng.nextFloat() * (max - min)
}

/**
 * BƯỚC 1: TÍNH TOÁN KẾT QUẢ AUTO-RESOLVE (Hàm thuần túy, tất định với seeded PRNG)
 * Không thay đổi trạng thái World State!
 */
export function calculateAutoResolve(input: AutoResolveInput): AutoResolveResult {
  const {
    encounterId,
    sectorId,
    attacker,
    defender,
    terrainBonus = 0.05,
    seed = 4281741,
  } = input

  const prng = new WorldPRNG(seed)
  const combatLogs: string[] = []

  const attEffective = calculateEffectivePower(attacker, false, 0)
  const defEffective = calculateEffectivePower(defender, true, terrainBonus)

  // Tỷ lệ sức mạnh thực tế: Attacker / Defender
  const baseRatio = attEffective / Math.max(1, defEffective)

  // Biến số chiến thuật nhẹ (+/- 8% có seed, không dùng xúc xắc hoang dã)
  const tacticalVariance = 1.0 + nextFloatRange(prng, -0.08, 0.08)
  const powerRatio = Number((baseRatio * tacticalVariance).toFixed(3))

  combatLogs.push(
    `Bắt đầu giao tranh tại Sector [${sectorId}]: ${attacker.name} (${attacker.troops} quân, Pwr: ${Math.round(attEffective)}) vs ${defender.name} (${defender.troops} quân, Pwr: ${Math.round(defEffective)})`
  )
  combatLogs.push(`Hệ số tương quan lực lượng: ${powerRatio.toFixed(2)} (Chiến thuật: ${(tacticalVariance * 100).toFixed(1)}%)`)

  let outcome: AutoResolveOutcome
  let winnerFactionId: FactionId | null = null
  let attLossRate = 0
  let defLossRate = 0
  let sectorLost = false
  let threatDelta = 0
  let stabilityDelta = 0
  let infraDamage = 0

  // 1. Phân định kết quả dựa trên tương quan sức mạnh (Lanchester Thresholds)
  if (powerRatio >= 3.5) {
    // Phe tấn công thắng áp đảo hoàn toàn (Overwhelming decimation)
    outcome = "decisive_victory"
    winnerFactionId = attacker.factionId
    attLossRate = nextFloatRange(prng, 0.02, 0.05)
    defLossRate = Math.min(1.0, nextFloatRange(prng, 0.90, 1.0))
    threatDelta = attacker.factionId === "void" ? +150 : -160
    stabilityDelta = -30
    infraDamage = 45
    combatLogs.push(`${attacker.name} áp đảo tuyệt đối, nghiền nát hoàn toàn phòng tuyến đối phương!`)
  } else if (powerRatio >= 2.2) {
    // Phe tấn công thắng áp đảo
    outcome = "decisive_victory"
    winnerFactionId = attacker.factionId
    attLossRate = nextFloatRange(prng, 0.06, 0.12)
    defLossRate = nextFloatRange(prng, 0.50, 0.65)
    threatDelta = attacker.factionId === "void" ? +120 : -140
    stabilityDelta = -25
    infraDamage = 35
    combatLogs.push(`${attacker.name} giành thắng lợi áp đảo, đè bẹp hoàn toàn phòng tuyến đối phương!`)
  } else if (powerRatio >= 1.35) {
    // Phe tấn công thắng nhọc nhằn
    outcome = "marginal_victory"
    winnerFactionId = attacker.factionId
    attLossRate = nextFloatRange(prng, 0.18, 0.28)
    defLossRate = nextFloatRange(prng, 0.35, 0.48)
    threatDelta = attacker.factionId === "void" ? +70 : -80
    stabilityDelta = -18
    infraDamage = 20
    combatLogs.push(`${attacker.name} giành thắng lợi một phần sau giao tranh ác liệt.`)
  } else if (powerRatio >= 0.75) {
    // Bế tắc hoặc Rút lui chiến thuật nếu có lệnh
    if (defender.order === "recover") {
      outcome = "tactical_retreat"
      winnerFactionId = attacker.factionId
      attLossRate = nextFloatRange(prng, 0.08, 0.15)
      defLossRate = nextFloatRange(prng, 0.12, 0.20)
      threatDelta = attacker.factionId === "void" ? +50 : -40
      stabilityDelta = -12
      infraDamage = 10
      combatLogs.push(`${defender.name} chủ động rút lui chiến thuật để bảo toàn quân lực.`)
    } else {
      outcome = "stalemate"
      winnerFactionId = null
      attLossRate = nextFloatRange(prng, 0.14, 0.22)
      defLossRate = nextFloatRange(prng, 0.14, 0.22)
      threatDelta = +15
      stabilityDelta = -10
      infraDamage = 15
      combatLogs.push(`Hai bên giằng co bất phân thắng bại, chiến sự rơi vào bế tắc.`)
    }
  } else if (powerRatio >= 0.45) {
    // Phe phòng thủ thắng nhọc nhằn (Phe tấn công thất bại một phần)
    outcome = "marginal_victory"
    winnerFactionId = defender.factionId
    attLossRate = nextFloatRange(prng, 0.32, 0.45)
    defLossRate = nextFloatRange(prng, 0.15, 0.24)
    threatDelta = defender.factionId === "vss" ? -90 : +60
    stabilityDelta = -8
    infraDamage = 12
    combatLogs.push(`${defender.name} phòng thủ kiên cường, đẩy lùi cuộc tiến công của đối phương.`)
  } else {
    // Phe phòng thủ thắng áp đảo (Phe tấn công bị tiêu diệt nặng nề)
    outcome = "decisive_victory"
    winnerFactionId = defender.factionId
    attLossRate = nextFloatRange(prng, 0.48, 0.65)
    defLossRate = nextFloatRange(prng, 0.05, 0.12)
    threatDelta = defender.factionId === "vss" ? -160 : +120
    stabilityDelta = +5
    infraDamage = 8
    combatLogs.push(`${defender.name} phòng ngự tuyệt đối, bẻ gãy hoàn toàn mũi tấn công của ${attacker.name}!`)
  }

  // 2. Tính toán phân bổ tổn thất (Casualties vĩnh viễn vs Wounded phục hồi y tế)
  // Tổng tổn thất = Casualties (50%) + Wounded (50%)
  const totalAttLosses = Math.min(attacker.troops, Math.round(attacker.troops * attLossRate))
  const attackerCasualties = Math.round(totalAttLosses * 0.5)
  const attackerWounded = totalAttLosses - attackerCasualties
  const attackerRemaining = Math.max(0, attacker.troops - totalAttLosses)

  const totalDefLosses = Math.min(defender.troops, Math.round(defender.troops * defLossRate))
  let defenderCasualties = Math.round(totalDefLosses * 0.5)
  const defenderWounded = totalDefLosses - defenderCasualties
  let defenderRemaining = Math.max(0, defender.troops - totalDefLosses)

  // Nếu tỷ lệ áp đảo >= 3.5 và quân phòng thủ còn lại quá ít (<= 5), tiêu diệt hoàn toàn
  if (powerRatio >= 3.5 && defenderRemaining <= 5) {
    defenderCasualties += defenderRemaining
    defenderRemaining = 0
  }

  // 3. Đánh giá hậu quả thất bại theo ngữ cảnh (Contextual Defeat Rules)
  // Nếu VSS là defender và thất bại trước The Void:
  // Thất bại KHÔNG mặc định làm mất sector ngay lập tức!
  if (defender.factionId === "vss" && winnerFactionId === attacker.factionId) {
    if (defenderRemaining <= 0) {
      // Toàn bộ đồn trú bị tiêu diệt: Sector thất thủ hoàn toàn!
      sectorLost = true
      combatLogs.push(`Toàn bộ lực lượng đồn trú đã tử trận hoặc rút chạy. Sector chính thức thất thủ!`)
    } else if ((defender.fortificationLevel ?? 1) >= 1) {
      // Nếu còn quân phòng thủ và còn công sự: Sector rơi vào Under Siege, KHÔNG mất
      sectorLost = false
      combatLogs.push(
        `Phòng tuyến ngoại vi bị chọc thủng; ${defender.name} rút lui vào hầm ngầm pháo đài. Sector rơi vào tình trạng vây hãm (Under Siege).`
      )
    } else {
      // Không còn công sự che chắn
      sectorLost = true
      combatLogs.push(`Công sự sụp đổ hoàn toàn. Sector chính thức thất thủ!`)
    }
  }

  const summary = `Trận đánh [${sectorId}]: Kết quả ${outcome.toUpperCase()}. Phe thắng: ${winnerFactionId ?? "Hòa"}. Tổn thất Attacker: ${totalAttLosses}/${attacker.troops}, Defender: ${totalDefLosses}/${defender.troops}.`

  return {
    encounterId,
    sectorId,
    outcome,
    winnerFactionId,
    powerRatio,
    attackerEffectivePower: Math.round(attEffective),
    defenderEffectivePower: Math.round(defEffective),
    attackerInitial: attacker.troops,
    attackerCasualties,
    attackerWounded,
    attackerRemaining,
    defenderInitial: defender.troops,
    defenderCasualties,
    defenderWounded,
    defenderRemaining,
    threatDelta,
    stabilityDelta,
    sectorLost,
    infrastructureDamagePercent: infraDamage,
    summary,
    combatLogs,
  }
}

/**
 * BƯỚC 2: COMMIT KẾT QUẢ AUTO-RESOLVE VÀO WORLD STATE (Idempotent Apply)
 * Sử dụng transactionId để chống áp dụng hai lần (Double-Application Protection).
 */
export function commitAutoResolveResult(
  state: WorldState,
  result: AutoResolveResult,
  transactionId: string
): CommitAutoResolveResult {
  if (!transactionId) {
    return {
      success: false,
      committed: false,
      duplicate: false,
      transactionId: "",
      error: "TransactionId là bắt buộc để commit kết quả auto-resolve",
    }
  }

  // 1. Kiểm tra tính lũy đẳng (Idempotency Check)
  if (state.committedTransactionIds.includes(transactionId)) {
    return {
      success: true,
      committed: false,
      duplicate: true,
      transactionId,
    }
  }

  const sector = state.sectors[result.sectorId]
  if (!sector) {
    return {
      success: false,
      committed: false,
      duplicate: false,
      transactionId,
      error: `Không tìm thấy sector để commit: ${result.sectorId}`,
    }
  }

  // 2. Cập nhật sổ cái quân sự cho VSS
  // Xác định VSS là phe nào (attacker hay defender)
  const isVssAttacker = state.factions.vss?.controlledSectorIds.includes(result.sectorId)
    ? false
    : sector.sovereignty !== "vss"
  const isVssDefender = sector.sovereignty === "vss"

  if (isVssDefender) {
    // VSS là phe phòng thủ
    const totalDefLosses = result.defenderCasualties + result.defenderWounded
    sector.garrisonPower = result.defenderRemaining

    // Trừ lực lượng đồn trú đã mất khỏi deployed
    state.military.deployed = Math.max(0, state.military.deployed - totalDefLosses)
    state.military.casualties += result.defenderCasualties
    state.military.woundedOrRepair += result.defenderWounded
  } else if (isVssAttacker) {
    // VSS là phe tấn công
    const totalAttLosses = result.attackerCasualties + result.attackerWounded
    state.military.deployed = Math.max(0, state.military.deployed - totalAttLosses)
    state.military.casualties += result.attackerCasualties
    state.military.woundedOrRepair += result.attackerWounded
  }

  // 3. Cập nhật Threat và Stability của Sector
  const sMax = getSectorMaxThreat(sector, state.threatConfig)
  sector.threatLevel = Math.max(0, Math.min(sMax, sector.threatLevel + result.threatDelta))
  sector.stability = Math.max(0, Math.min(100, sector.stability + result.stabilityDelta))

  // 4. Xử lý chuyển đổi trạng thái vòng đời hoặc mất quyền kiểm soát
  if (result.sectorLost) {
    // Thất thủ: chuyển sang lost và sovereignty thành void
    const trans = transitionSectorStage(sector, "lost", {
      defenseFailed: true,
      reason: "Phòng tuyến sụp đổ hoàn toàn trong trận đánh",
    })
    if (trans.success) {
      state.sectors[result.sectorId] = trans.sector
    }
    transferSectorControl(state, result.sectorId, "void", "Thất thủ trước hạm đội The Void")
  } else if (result.winnerFactionId === "void" && sector.stage === "threatened") {
    // Địch thắng nhưng chưa chiếm được: chuyển sang Under Siege
    const trans = transitionSectorStage(sector, "under_siege", {
      reason: "Bị vây hãm sau trận chiến ngoại vi",
    })
    if (trans.success) {
      state.sectors[result.sectorId] = trans.sector
    }
  } else if (result.winnerFactionId === "vss" && sector.stage === "under_siege") {
    // VSS giải vây thành công: chuyển về threatened hoặc recovery
    const trans = transitionSectorStage(sector, "threatened", {
      reason: "Giải vây thành công",
    })
    if (trans.success) {
      state.sectors[result.sectorId] = trans.sector
    }
  }

  // 5. Ghi nhận giao dịch vào Journal để bảo vệ lũy đẳng
  state.committedTransactionIds.push(transactionId)

  // Cập nhật inFlightTransactions nếu có bản ghi pending tương ứng
  if (state.inFlightTransactions[transactionId]) {
    state.inFlightTransactions[transactionId].status = "committed"
  } else {
    state.inFlightTransactions[transactionId] = {
      transactionId,
      type: "combat",
      sectorId: result.sectorId,
      payload: { outcome: result.outcome, winner: result.winnerFactionId },
      status: "committed",
      createdAt: Date.now(),
    }
  }

  return {
    success: true,
    committed: true,
    duplicate: false,
    transactionId,
  }
}
