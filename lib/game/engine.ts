import { BUILDING_DEFS, GEAR_CLASSES, ITEM_MAP } from "./data"
import type {
  BattleLogEntry,
  BattleResult,
  BattleUnitSnapshot,
  Building,
  BuildingKey,
  DistrictAllocation,
  DistrictBonus,
  DistrictKey,
  Gear,
  ItemInstance,
  Pilot,
  Resources,
  Sector,
  Stats,
  StatKey,
} from "./types"

const STAT_KEYS: StatKey[] = ["hp", "attack", "defense", "speed", "evasion", "energy"]

/** upgrade level adds 12% of base bonus per level */
export function itemBonus(inst: ItemInstance): Partial<Stats> {
  const def = ITEM_MAP[inst.defId]
  if (!def) return {}
  const mult = 1 + inst.level * 0.12
  const out: Partial<Stats> = {}
  for (const k of STAT_KEYS) {
    const v = def.bonus[k]
    if (v !== undefined) out[k] = Math.round(v * mult)
  }
  return out
}

/** base stats for a gear class at a given level */
export function baseStatsAtLevel(cls: Gear["cls"], level: number): Stats {
  const def = GEAR_CLASSES[cls]
  const out = {} as Stats
  for (const k of STAT_KEYS) {
    out[k] = Math.round(def.base[k] + def.growth[k] * (level - 1))
  }
  return out
}

/** fully-resolved stats including equipped items */
export function computeStats(gear: Gear, inventory: ItemInstance[]): Stats {
  const stats = baseStatsAtLevel(gear.cls, gear.level)
  for (const slot of Object.keys(gear.equipped) as (keyof Gear["equipped"])[]) {
    const uid = gear.equipped[slot]
    if (!uid) continue
    const inst = inventory.find((i) => i.uid === uid)
    if (!inst) continue
    const bonus = itemBonus(inst)
    for (const k of STAT_KEYS) {
      if (bonus[k] !== undefined) stats[k] += bonus[k] as number
    }
  }
  // never below zero
  for (const k of STAT_KEYS) stats[k] = Math.max(0, Math.round(stats[k]))
  return stats
}

/** single combat power rating used for map recommendations */
export function gearPower(stats: Stats): number {
  return Math.round(
    stats.hp * 0.5 +
      stats.attack * 4 +
      stats.defense * 2.5 +
      stats.speed * 2 +
      stats.evasion * 6 +
      stats.energy * 1,
  )
}

export function fleetPower(gears: Gear[], inventory: ItemInstance[]): number {
  return gears.reduce((sum, g) => sum + gearPower(computeStats(g, inventory)), 0)
}

export function maxHp(gear: Gear, inventory: ItemInstance[]): number {
  return computeStats(gear, inventory).hp
}

export function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5))
}

// ---------- Building helpers ----------

export function buildingUpgradeCost(key: BuildingKey, currentLevel: number): Partial<Resources> {
  const def = BUILDING_DEFS[key]
  const scale = Math.pow(def.costScale, currentLevel)
  const out: Partial<Resources> = {}
  for (const [k, v] of Object.entries(def.baseCost)) {
    out[k as keyof Resources] = Math.round((v as number) * scale)
  }
  return out
}

/** production from core infrastructure (command, refinery, reactor) */
export function coreProduction(buildings: Record<BuildingKey, number>): Resources {
  return {
    credits: 300 + buildings.command * 120,
    alloy: 60 + buildings.refinery * 55,
    energy: 60 + buildings.reactor * 50,
    crystal: Math.floor((buildings.command + buildings.refinery) / 4) * 5,
  }
}

/** production from civic buildings (finance, residential, trade, entertainment) */
export function civicProduction(buildings: Record<BuildingKey, number>): Resources {
  return {
    credits:
      (buildings.finance ?? 0) * 250 +
      (buildings.residential ?? 0) * 100 +
      (buildings.trade ?? 0) * 400 +
      (buildings.entertainment ?? 0) * 500,
    alloy: (buildings.trade ?? 0) * 40,
    energy: 0,
    crystal: (buildings.trade ?? 0) * 1,
  }
}

export const POP_PER_UNIT = 100

export function districtPopulation(population: number, pct: number): number {
  return Math.floor((population * pct) / 100)
}

export function districtBonus(population: number, districts?: DistrictAllocation): DistrictBonus {
  const units = (k: DistrictKey) =>
    districts ? Math.floor(districtPopulation(population, districts[k]) / POP_PER_UNIT) : 0
  return {
    credits: units("finance") * 50,
    crystal: units("service") * 1,
    alloy: units("industry") * 5,
    energy: units("power") * 10,
    repairHp: units("repair") * 1000,
    shipDiscount: units("shipbuilding") * 100,
    gearCap: units("shipbuilding") * 1,
  }
}

export function dailyProduction(
  buildings: Record<BuildingKey, number>,
  population = 0,
  districts?: DistrictAllocation,
): Resources {
  const core = coreProduction(buildings)
  const civic = civicProduction(buildings)
  const d = districtBonus(population, districts)
  return {
    credits: core.credits + civic.credits + d.credits,
    alloy: core.alloy + civic.alloy + d.alloy,
    energy: core.energy + civic.energy + d.energy,
    crystal: core.crystal + civic.crystal + d.crystal,
  }
}

export function armyCap(buildings: Record<BuildingKey, number>): number {
  return 120 + buildings.barracks * 60 + (buildings.residential ?? 0) * 60
}

export function gearCap(
  buildings: Record<BuildingKey, number>,
  population = 0,
  districts?: DistrictAllocation,
): number {
  return (
    4 +
    buildings.hangar +
    buildings.shipyard +
    (buildings.alliance ?? 0) +
    districtBonus(population, districts).gearCap
  )
}

/** gear build cost after shipyard % discount and shipbuilding district flat discount (floor 10%) */
export function gearBuildCost(
  base: Partial<Resources>,
  buildings: Record<BuildingKey, number>,
  population = 0,
  districts?: DistrictAllocation,
): Partial<Resources> {
  const pct = 1 - Math.min(0.4, buildings.shipyard * 0.05)
  const flat = districtBonus(population, districts).shipDiscount
  const out: Partial<Resources> = {}
  for (const [k, v] of Object.entries(base)) {
    const original = v as number
    out[k as keyof Resources] = Math.max(Math.round(original * 0.1), Math.round(original * pct) - flat)
  }
  return out
}

export function populationGrowthRate(buildings: Record<BuildingKey, number>): number {
  return 0.05 + (buildings.residential ?? 0) * 0.005
}

/** immigrants received when capturing a sector: 10% of enemy HP destroyed, clamped 100..100,000 */
export function captureImmigrants(enemyHpDamage: number): number {
  return Math.max(100, Math.min(100_000, Math.floor(enemyHpDamage * 0.1)))
}

export function prosperity(
  population: number,
  buildings: Record<BuildingKey, number>,
  capturedCount: number,
): number {
  const civic =
    (buildings.finance ?? 0) +
    (buildings.residential ?? 0) +
    (buildings.trade ?? 0) +
    (buildings.entertainment ?? 0)
  return Math.round(population / 5000 + civic * 3 + capturedCount * 5)
}

export function prosperityTier(score: number): string {
  if (score >= 300) return "Thịnh vượng"
  if (score >= 150) return "Phồn hoa"
  if (score >= 60) return "Ổn định"
  return "Sơ khai"
}

// ---------- Pilot helpers ----------

/** flat bonuses the linked pilot grants their personal aircraft */
export function pilotAircraftBonus(pilot: Pilot): { attack: number; defense: number; shieldHp: number } {
  if (!pilot.hasSelectedPilot) return { attack: 0, defense: 0, shieldHp: 0 }
  const s = pilot.stats
  return {
    attack: s.attack * 30 + s.agility * 10 + s.vision * 10,
    defense: s.defense * 10 + s.agility * 5 + s.vision * 5,
    shieldHp: s.shield * 200,
  }
}

export function pilotAircraftStats(gear: Gear, inventory: ItemInstance[], pilot: Pilot): Stats {
  const stats = computeStats(gear, inventory)
  if (!pilot.hasSelectedPilot || pilot.aircraftUid !== gear.uid) return stats
  const b = pilotAircraftBonus(pilot)
  return { ...stats, attack: stats.attack + b.attack, defense: stats.defense + b.defense }
}

export function fleetPowerWithPilot(gears: Gear[], inventory: ItemInstance[], pilot: Pilot): number {
  const shield = pilotAircraftBonus(pilot).shieldHp
  return gears.reduce((sum, g) => {
    const isPilot = pilot.hasSelectedPilot && g.uid === pilot.aircraftUid
    return sum + gearPower(pilotAircraftStats(g, inventory, pilot)) + (isPilot ? Math.round(shield * 0.5) : 0)
  }, 0)
}

export function baseDefense(buildings: Record<BuildingKey, number>): number {
  return buildings.turret * 260 + buildings.command * 90
}

export function hangarRepairPerDay(buildings: Record<BuildingKey, number>): number {
  return 0.08 + buildings.hangar * 0.05 // fraction of maxHp restored per day
}

// ---------- Battle simulation ----------

function rng(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

type SimUnit = {
  uid: string
  name: string
  cls: Gear["cls"] | "enemy"
  hp: number
  /** absorbs damage before hp; does not persist after battle */
  shield: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  evasion: number
  power: number
  isSupport: boolean
}

function snapshot(units: SimUnit[]): BattleUnitSnapshot[] {
  return units.map((u) => ({
    uid: u.uid,
    name: u.name,
    cls: u.cls,
    hp: Math.max(0, Math.round(u.hp)),
    maxHp: u.maxHp,
    power: u.power,
  }))
}

/**
 * Deterministic-ish turn based battle. Player fleet vs a sector garrison.
 * Returns full log + surviving hp so caller can persist durability.
 */
export function simulateBattle(
  gears: Gear[],
  inventory: ItemInstance[],
  sector: Sector,
  pilot?: Pilot,
): BattleResult {
  const rand = rng(Math.floor(sector.threat + gears.length * 7 + Date.now() % 100000))
  const log: BattleLogEntry[] = []
  const pilotUid = pilot?.hasSelectedPilot ? pilot.aircraftUid : null
  const pilotShield = pilot ? pilotAircraftBonus(pilot).shieldHp : 0

  const playerUnits: SimUnit[] = gears.map((g) => {
    const isPilot = g.uid === pilotUid
    const s = isPilot && pilot ? pilotAircraftStats(g, inventory, pilot) : computeStats(g, inventory)
    return {
      uid: g.uid,
      name: isPilot && pilot ? `${pilot.name} · ${g.name}` : g.name,
      cls: g.cls,
      hp: g.hpCurrent,
      shield: isPilot ? pilotShield : 0,
      maxHp: s.hp,
      attack: s.attack,
      defense: s.defense,
      speed: s.speed,
      evasion: s.evasion,
      power: gearPower(s),
      isSupport: g.cls === "M",
    }
  })

  // build enemy units scaled to the sector
  const enemyCount = sector.kind === "mothership" ? 6 : sector.kind === "base" ? 4 : 3
  const perThreat = sector.threat / enemyCount
  const enemyUnits: SimUnit[] = Array.from({ length: enemyCount }).map((_, i) => {
    const isCore = sector.kind === "mothership" && i === 0
    const hp = Math.round(perThreat * (isCore ? 6 : 3.2))
    return {
      uid: `e${i}`,
      name: isCore
        ? sector.name
        : `${sector.faction} #${i + 1}`,
      cls: "enemy",
      hp,
      shield: 0,
      maxHp: hp,
      attack: Math.round(perThreat * (isCore ? 1.3 : 0.9)),
      defense: Math.round(perThreat * 0.4),
      speed: 60 + Math.round(rand() * 40),
      evasion: 8 + Math.round(rand() * 14),
      power: Math.round(perThreat * 5),
      isSupport: false,
    }
  })

  log.push({
    turn: 0,
    text: `Tiến vào ${sector.name} — lực lượng ${sector.faction}. Giao chiến bắt đầu!`,
    kind: "info",
  })
  const leader = playerUnits.find((u) => u.uid === pilotUid)
  if (leader) {
    log.push({
      turn: 0,
      text: `Phi công ${leader.name} dẫn đầu hạm đội${pilotShield ? ` (khiên ${pilotShield} HP)` : ""}.`,
      kind: "info",
    })
  }

  const alive = (u: SimUnit[]) => u.filter((x) => x.hp > 0)
  let turn = 1
  const maxTurns = 40

  while (alive(playerUnits).length > 0 && alive(enemyUnits).length > 0 && turn <= maxTurns) {
    // order all alive units by speed desc
    const all = [...alive(playerUnits), ...alive(enemyUnits)].sort((a, b) => b.speed - a.speed)

    for (const attacker of all) {
      if (attacker.hp <= 0) continue
      const isPlayer = playerUnits.includes(attacker)
      const enemies = isPlayer ? alive(enemyUnits) : alive(playerUnits)
      if (enemies.length === 0) break

      // M-Gear supports instead of attacking
      if (attacker.isSupport && isPlayer) {
        const wounded = alive(playerUnits)
          .filter((u) => u.hp < u.maxHp)
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]
        const heal = Math.round(attacker.attack * 1.6 + 120)
        if (wounded) {
          wounded.hp = Math.min(wounded.maxHp, wounded.hp + heal)
          log.push({
            turn,
            text: `${attacker.name} (M-Gear) hồi ${heal} HP cho ${wounded.name}.`,
            kind: "player-hit",
          })
        } else {
          // no one wounded: buff = small attack this turn on random enemy
          const target = enemies[Math.floor(rand() * enemies.length)]
          const dmg = Math.round(attacker.attack * 0.8)
          target.hp -= dmg
          log.push({
            turn,
            text: `${attacker.name} khai hỏa hỗ trợ, gây ${dmg} lên ${target.name}.`,
            kind: "player-hit",
          })
        }
        continue
      }

      const target = enemies[Math.floor(rand() * enemies.length)]

      // evasion check
      if (rand() * 100 < target.evasion) {
        log.push({
          turn,
          text: `${target.name} né được đòn của ${attacker.name}!`,
          kind: "info",
        })
        continue
      }

      const crit = rand() < 0.16 + (attacker.cls === "A" ? 0.1 : 0)
      const base = attacker.attack * (crit ? 1.9 : 1)
      const mitig = base * (target.defense / (target.defense + 400))
      let dmg = Math.max(8, Math.round(base - mitig))
      dmg = Math.round(dmg * (0.85 + rand() * 0.3))
      const absorbed = Math.min(target.shield, dmg)
      target.shield -= absorbed
      target.hp -= dmg - absorbed

      log.push({
        turn,
        text: crit
          ? `CHÍ MẠNG! ${attacker.name} nổ ${dmg} sát thương lên ${target.name}.`
          : `${attacker.name} gây ${dmg} lên ${target.name}.`,
        kind: crit ? "crit" : isPlayer ? "player-hit" : "enemy-hit",
      })

      if (target.hp <= 0) {
        log.push({
          turn,
          text: `${target.name} bị phá hủy!`,
          kind: "down",
        })
      }
    }
    turn++
  }

  const victory = alive(enemyUnits).length === 0 && alive(playerUnits).length > 0
  log.push({
    turn,
    text: victory
      ? `CHIẾM ĐƯỢC ${sector.name}! Khu vực đã thuộc quyền kiểm soát.`
      : alive(playerUnits).length === 0
        ? `Hạm đội bị tiêu diệt. Rút lui thất bại tại ${sector.name}.`
        : `Giao tranh bế tắc — hạm đội buộc phải rút lui khỏi ${sector.name}.`,
    kind: victory ? "victory" : "defeat",
  })

  return {
    sectorId: sector.id,
    victory,
    rounds: turn - 1,
    log,
    playerUnits: snapshot(playerUnits),
    enemyUnits: snapshot(enemyUnits),
    reward: victory ? sector.reward : undefined,
    troopReward: victory ? sector.troopReward : undefined,
  }
}

/* ==========================================================================
   PHASE 1 — TURN-BASED COMBAT ENGINE (SPEED INITIATIVE, SKILLS, AI, STATUS)
   ========================================================================== */

import {
  ENEMIES_DATA,
  VANGUARD_INITIAL_UNIT,
} from "./data"
import type {
  CombatLogItem,
  CombatSkill,
  CombatState,
  CombatUnit,
  EnemyEncounterType,
  StatusEffect,
} from "./types"

export function cloneUnit(unit: CombatUnit): CombatUnit {
  return {
    ...unit,
    statusEffects: unit.statusEffects.map((s) => ({ ...s })),
    skills: unit.skills.map((s) => ({ ...s })),
    skillCooldowns: { ...unit.skillCooldowns },
  }
}

export function createInitialCombatState(encounterId: EnemyEncounterType = "scout-drone"): CombatState {
  const player = cloneUnit(VANGUARD_INITIAL_UNIT)
  const enemy = cloneUnit(ENEMIES_DATA[encounterId])

  // Thứ tự lượt dựa trên tốc độ (Speed Initiative)
  const playerFirst = player.speed >= enemy.speed
  const turnQueue = playerFirst ? [player.id, enemy.id] : [enemy.id, player.id]
  const currentTurnActorId = turnQueue[0]
  const initialStatus = playerFirst ? "player-turn" : "enemy-turn"

  const now = "00:01"
  const logs: CombatLogItem[] = [
    {
      id: "log-init-1",
      turn: 1,
      type: "system",
      text: `[HỆ THỐNG] Radar cảnh giới kích hoạt! Phát hiện mục tiêu: ${enemy.name} (${enemy.title}).`,
      actorName: "HỆ THỐNG",
      timestamp: now,
    },
    {
      id: "log-init-2",
      turn: 1,
      type: "system",
      text: playerFirst
        ? `[TỐC ĐỘ] Tốc độ Vanguard (${player.speed}) cao hơn mục tiêu (${enemy.speed}) -> Giành quyền hành động trước!`
        : `[TỐC ĐỘ] Mục tiêu ${enemy.name} có tốc độ vượt trội (${enemy.speed} > ${player.speed}) -> Địch tấn công trước!`,
      actorName: "HỆ THỐNG",
      timestamp: now,
    },
  ]

  return {
    encounterId,
    turnNumber: 1,
    currentTurnActorId,
    turnQueue,
    player,
    enemy,
    status: initialStatus,
    logs,
  }
}

/** Tính toán sát thương dựa trên Công, Thủ, Giảm giáp, Giảm sát thương và Bạo kích */
export function calculateCombatDamage(
  attacker: CombatUnit,
  defender: CombatUnit,
  skill: CombatSkill,
): { damage: number; isCrit: boolean; reducedByGuard: boolean } {
  // Kiểm tra hiệu ứng giảm giáp trên mục tiêu
  const armorBreakEffect = defender.statusEffects.find((e) => e.type === "armor-break")
  const defenseMultiplier = armorBreakEffect ? Math.max(0.2, 1 - armorBreakEffect.value) : 1
  const effectiveDefense = Math.max(0, defender.defense * defenseMultiplier)

  // Sát thương cơ bản
  const skillMult = skill.damageMultiplier || 1.0
  const baseAttackPower = attacker.attack * skillMult

  // Công thức giảm trừ phòng thủ sci-fi
  let rawDamage = Math.max(15, Math.round(baseAttackPower - effectiveDefense * 0.65))

  // Biến thiên ngẫu nhiên nhẹ (±6%)
  const variance = 0.94 + Math.random() * 0.12
  rawDamage = Math.round(rawDamage * variance)

  // Tỉ lệ chí mạng (15% cho Vanguard, 10% cho địch)
  const critChance = attacker.isPlayer ? 0.15 : 0.1
  const isCrit = Math.random() < critChance
  if (isCrit) {
    rawDamage = Math.round(rawDamage * 1.5)
  }

  // Kiểm tra hiệu ứng phòng thủ (Emergency Guard / Fortify) trên mục tiêu
  const guardEffect = defender.statusEffects.find((e) => e.type === "emergency-guard")
  let reducedByGuard = false
  if (guardEffect) {
    rawDamage = Math.max(10, Math.round(rawDamage * (1 - guardEffect.value)))
    reducedByGuard = true
  }

  return { damage: rawDamage, isCrit, reducedByGuard }
}

/** Cập nhật giảm thời gian hiệu lực buff/debuff và hồi chiêu kỹ năng */
export function tickUnitTurn(unit: CombatUnit): void {
  // Giảm thời gian hồi chiêu
  for (const k of Object.keys(unit.skillCooldowns)) {
    if (unit.skillCooldowns[k] > 0) {
      unit.skillCooldowns[k] -= 1
    }
  }

  // Giảm thời hạn trạng thái hiệu ứng
  unit.statusEffects = unit.statusEffects
    .map((effect) => ({
      ...effect,
      duration: effect.duration - 1,
    }))
    .filter((effect) => effect.duration > 0)

  // Hồi phục nhẹ 5 SP tự nhiên mỗi lượt
  unit.sp = Math.min(unit.maxSp, unit.sp + 5)
}

/** Thực hiện kỹ năng của Người chơi (Vanguard) */
export function executePlayerAction(state: CombatState, skillId: string): CombatState {
  if (state.status !== "player-turn") return state

  const skill = state.player.skills.find((s) => s.id === skillId)
  if (!skill) return state

  // Kiểm tra SP và hồi chiêu
  if (state.player.sp < skill.spCost) return state
  if ((state.player.skillCooldowns[skill.id] || 0) > 0) return state

  const player = cloneUnit(state.player)
  const enemy = cloneUnit(state.enemy)
  const now = `00:${String(Math.min(99, state.turnNumber * 4)).padStart(2, "0")}`
  const newLogs: CombatLogItem[] = [...state.logs]

  // Trừ tiêu hao SP và đặt thời gian hồi chiêu
  player.sp = Math.max(0, player.sp - skill.spCost)
  if (skill.cooldown > 0) {
    player.skillCooldowns[skill.id] = skill.cooldown
  }

  let lastActionData: CombatState["lastAction"]

  if (skill.targetType === "self") {
    // Kỹ năng bản thân: Lá Chắn Khẩn Cấp (Emergency Guard)
    const guardEffect: StatusEffect = {
      id: `guard-${Date.now()}`,
      type: "emergency-guard",
      name: "Lá Chắn Khẩn Cấp",
      desc: "Giảm 50% toàn bộ sát thương nhận vào trong 2 lượt",
      duration: skill.effectDuration || 2,
      value: skill.damageReduction || 0.5,
    }

    // Thay thế hoặc làm mới hiệu ứng
    player.statusEffects = player.statusEffects.filter((e) => e.type !== "emergency-guard")
    player.statusEffects.push(guardEffect)

    newLogs.push({
      id: `log-${Date.now()}-guard`,
      turn: state.turnNumber,
      type: "status",
      text: `[PHÒNG HỘ] Vanguard kích hoạt ${skill.name}! Tạo trường từ trường chắn giảm 50% sát thương gánh chịu trong ${guardEffect.duration} lượt.`,
      actorName: player.name,
      timestamp: now,
    })

    lastActionData = {
      actorId: player.id,
      skillName: skill.name,
      effectApplied: "Lá Chắn Khẩn Cấp (-50% Sát thương)",
    }
  } else {
    // Đòn tấn công hoặc kỹ năng đơn mục tiêu
    if (skill.id === "basic-attack") {
      // Hồi phục 15 SP khi dùng đòn cơ bản
      player.sp = Math.min(player.maxSp, player.sp + 15)
    }

    const { damage, isCrit, reducedByGuard } = calculateCombatDamage(player, enemy, skill)
    enemy.hp = Math.max(0, enemy.hp - damage)

    let logText = `[TẤN CÔNG] Vanguard xuất kích ${skill.name} -> Đánh trúng ${enemy.name}, gây ${damage} sát thương!`
    if (isCrit) {
      logText = `[BẠO KÍCH 🔥] Vanguard bắn trúng điểm yếu bằng ${skill.name}! Gây ${damage} sát thương chí mạng!`
    }
    if (reducedByGuard) {
      logText += ` (Giảm thiểu bởi giáp chắn của địch)`
    }

    newLogs.push({
      id: `log-${Date.now()}-atk`,
      turn: state.turnNumber,
      type: isCrit ? "crit" : "player-action",
      text: logText,
      actorName: player.name,
      targetName: enemy.name,
      value: damage,
      timestamp: now,
    })

    // Xử lý hiệu ứng Phá Giáp Cơ Khí (Armor Break)
    if (skill.defenseReduction && skill.effectDuration) {
      const armorBreak: StatusEffect = {
        id: `ab-${Date.now()}`,
        type: "armor-break",
        name: "Vỡ Vỏ Giáp",
        desc: `Giảm ${Math.round((skill.defenseReduction || 0.35) * 100)}% phòng ngự`,
        duration: skill.effectDuration,
        value: skill.defenseReduction,
      }
      enemy.statusEffects = enemy.statusEffects.filter((e) => e.type !== "armor-break")
      enemy.statusEffects.push(armorBreak)

      newLogs.push({
        id: `log-${Date.now()}-ab`,
        turn: state.turnNumber,
        type: "status",
        text: `[HIỆU ỨNG ⚡] Vỏ giáp của ${enemy.name} bị nứt toác! Phòng ngự suy giảm 35% trong ${armorBreak.duration} lượt.`,
        actorName: player.name,
        targetName: enemy.name,
        timestamp: now,
      })
    }

    lastActionData = {
      actorId: player.id,
      skillName: skill.name,
      damage,
      isCrit,
    }
  }

  // Kiểm tra điều kiện Thắng
  if (enemy.hp <= 0) {
    newLogs.push({
      id: `log-${Date.now()}-vic`,
      turn: state.turnNumber,
      type: "victory",
      text: `[CHIẾN THẮNG 🏆] Mục tiêu ${enemy.name} đã bị phá hủy hoàn toàn! Chiến cơ Vanguard toàn thắng trở về căn cứ!`,
      actorName: "HỆ THỐNG",
      timestamp: now,
    })

    return {
      ...state,
      player,
      enemy,
      status: "victory",
      logs: newLogs,
      lastAction: lastActionData,
    }
  }

  // Kết thúc lượt người chơi -> Chuyển sang lượt kẻ địch
  tickUnitTurn(player)

  return {
    ...state,
    player,
    enemy,
    status: "enemy-turn",
    currentTurnActorId: enemy.id,
    logs: newLogs,
    lastAction: lastActionData,
  }
}

/** Trí tuệ nhân tạo (AI) quyết định hành động của Kẻ địch */
export function executeEnemyAIAction(state: CombatState): CombatState {
  if (state.status !== "enemy-turn" || state.enemy.hp <= 0) return state

  const enemy = cloneUnit(state.enemy)
  const player = cloneUnit(state.player)
  const now = `00:${String(Math.min(99, state.turnNumber * 4 + 2)).padStart(2, "0")}`
  const newLogs: CombatLogItem[] = [...state.logs]

  // Chọn chiêu thức thông minh tùy thuộc loại kẻ địch
  let selectedSkill: CombatSkill = enemy.skills[0]

  if (enemy.gearType === "scout-drone") {
    // Scout Drone: Dùng EMP nếu đủ SP và hết cooldown
    const empSkill = enemy.skills.find((s) => s.id === "drone-emp")
    if (empSkill && enemy.sp >= empSkill.spCost && (enemy.skillCooldowns[empSkill.id] || 0) <= 0) {
      selectedSkill = empSkill
    }
  } else if (enemy.gearType === "raider-mech") {
    // Raider Mech: Ưu tiên Tên lửa định hướng
    const missile = enemy.skills.find((s) => s.id === "mech-missile")
    if (missile && enemy.sp >= missile.spCost && (enemy.skillCooldowns[missile.id] || 0) <= 0) {
      selectedSkill = missile
    }
  } else if (enemy.gearType === "siege-walker") {
    // Siege Walker: Nếu máu dưới 50% thì kích hoạt khiên titan, còn lại xả mưa pháo
    const fortify = enemy.skills.find((s) => s.id === "siege-fortify")
    const barrage = enemy.skills.find((s) => s.id === "siege-barrage")

    const hasShield = enemy.statusEffects.some((e) => e.type === "emergency-guard")
    if (
      enemy.hp < enemy.maxHp * 0.5 &&
      !hasShield &&
      fortify &&
      enemy.sp >= fortify.spCost &&
      (enemy.skillCooldowns[fortify.id] || 0) <= 0
    ) {
      selectedSkill = fortify
    } else if (barrage && enemy.sp >= barrage.spCost && (enemy.skillCooldowns[barrage.id] || 0) <= 0) {
      selectedSkill = barrage
    }
  }

  // Tiêu hao SP & Cooldown
  enemy.sp = Math.max(0, enemy.sp - selectedSkill.spCost)
  if (selectedSkill.cooldown > 0) {
    enemy.skillCooldowns[selectedSkill.id] = selectedSkill.cooldown
  }

  let lastActionData: CombatState["lastAction"]

  if (selectedSkill.targetType === "self") {
    const shieldEffect: StatusEffect = {
      id: `enemy-shield-${Date.now()}`,
      type: "emergency-guard",
      name: "Tấm Chắn Titan",
      desc: "Giảm 40% sát thương nhận vào trong 2 lượt",
      duration: selectedSkill.effectDuration || 2,
      value: selectedSkill.damageReduction || 0.4,
    }
    enemy.statusEffects = enemy.statusEffects.filter((e) => e.type !== "emergency-guard")
    enemy.statusEffects.push(shieldEffect)

    newLogs.push({
      id: `log-${Date.now()}-eshield`,
      turn: state.turnNumber,
      type: "status",
      text: `[PHÒNG THỦ KẺ ĐỊCH] ${enemy.name} kích hoạt ${selectedSkill.name}! Giảm 40% sát thương gánh chịu trong 2 lượt.`,
      actorName: enemy.name,
      timestamp: now,
    })

    lastActionData = {
      actorId: enemy.id,
      skillName: selectedSkill.name,
      effectApplied: "Tấm Chắn Titan",
    }
  } else {
    const { damage, isCrit, reducedByGuard } = calculateCombatDamage(enemy, player, selectedSkill)
    player.hp = Math.max(0, player.hp - damage)

    let logText = `[ĐỊCH TẤN CÔNG 💥] ${enemy.name} dùng ${selectedSkill.name} bắn trúng Vanguard! Gây ${damage} sát thương.`
    if (isCrit) {
      logText = `[BẠO KÍCH KẺ ĐỊCH ⚠️] ${enemy.name} kích hoạt hỏa lực cực đại với ${selectedSkill.name}! Gây ${damage} sát thương bùng nổ!`
    }
    if (reducedByGuard) {
      logText += ` (Lá Chắn Khẩn Cấp của Vanguard đã triệt tiêu 50% sát thương)`
    }

    newLogs.push({
      id: `log-${Date.now()}-eatk`,
      turn: state.turnNumber,
      type: isCrit ? "crit" : "enemy-action",
      text: logText,
      actorName: enemy.name,
      targetName: player.name,
      value: damage,
      timestamp: now,
    })

    lastActionData = {
      actorId: enemy.id,
      skillName: selectedSkill.name,
      damage,
      isCrit,
    }
  }

  // Kiểm tra điều kiện Thất bại
  if (player.hp <= 0) {
    newLogs.push({
      id: `log-${Date.now()}-def`,
      turn: state.turnNumber,
      type: "defeat",
      text: `[THẤT BẠI 💀] Vỏ giáp của Vanguard bị phá hủy hoàn toàn! Phi công buộc phải kích hoạt buồng phóng thoát hiểm.`,
      actorName: "HỆ THỐNG",
      timestamp: now,
    })

    return {
      ...state,
      player,
      enemy,
      status: "defeat",
      logs: newLogs,
      lastAction: lastActionData,
    }
  }

  // Kết thúc lượt địch -> Chuyển sang lượt người chơi, tăng số vòng đấu
  tickUnitTurn(enemy)

  return {
    ...state,
    player,
    enemy,
    turnNumber: state.turnNumber + 1,
    status: "player-turn",
    currentTurnActorId: player.id,
    logs: newLogs,
    lastAction: lastActionData,
  }
}
