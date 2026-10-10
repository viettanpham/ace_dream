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

/** Lấy tốc độ hiệu dụng sau khi tính toán buff/debuff và nội tại phi công */
export function getEffectiveSpeed(unit: CombatUnit, turnNumber?: number): number {
  let speed = unit.speed
  // Alviss Passive: Sáng Kiến Diều Hâu (+15 SPD trong 3 lượt đầu)
  if (unit.pilotId === "alviss" && (turnNumber === undefined || turnNumber <= 3)) {
    speed += 15
  }
  for (const eff of unit.statusEffects) {
    if (eff.type === "emp-slow") {
      speed -= eff.value
    } else if (eff.type === "speed-boost") {
      speed += eff.value
    } else if (eff.type === "boss-overdrive") {
      speed += 20
    }
  }
  return Math.max(10, Math.round(speed))
}

/** Lấy phòng thủ hiệu dụng sau khi tính toán vỡ giáp và ăn mòn acid */
export function getEffectiveDefense(unit: CombatUnit): number {
  let defense = unit.defense
  let reductionPercent = 0

  for (const eff of unit.statusEffects) {
    if (eff.type === "armor-break") {
      reductionPercent += eff.value
    } else if (eff.type === "acid-corrosion") {
      const stacks = eff.stacks || 1
      reductionPercent += eff.value * stacks
    }
  }

  const multiplier = Math.max(0.1, 1 - Math.min(0.85, reductionPercent))
  return Math.max(0, Math.round(defense * multiplier))
}

/** Lấy lực tấn công hiệu dụng */
export function getEffectiveAttack(unit: CombatUnit): number {
  let attack = unit.attack
  for (const eff of unit.statusEffects) {
    if (eff.type === "boss-overdrive") {
      attack = Math.round(attack * 1.3)
    }
  }
  return Math.max(10, attack)
}

export type CombatActionOptions = {
  forceCrit?: boolean
  forceFalconFollowUp?: boolean
  forceEvade?: boolean
  forceNoEvade?: boolean
  forceAegisReflect?: boolean
}

/** Lấy tỉ lệ né tránh hiệu dụng (0 - 85%) */
export function getEffectiveEvasion(unit: CombatUnit): number {
  let evasion = unit.evasion || 0
  // Falcon Passive: Khí Động Học Mach (+15% né tránh bẩm sinh)
  if (unit.gearType === "falcon") {
    evasion += 15
  }
  for (const eff of unit.statusEffects) {
    if (eff.type === "ecm-jamming") {
      evasion += eff.value
    }
  }
  return Math.min(85, Math.max(0, Math.round(evasion)))
}

/** Tính toán hàng đợi thứ tự hành động động (Dynamic Turn Queue) */
export function calculateTurnQueue(player: CombatUnit, enemy: CombatUnit): string[] {
  const pSpd = getEffectiveSpeed(player)
  const eSpd = getEffectiveSpeed(enemy)
  return pSpd >= eSpd ? [player.id, enemy.id] : [enemy.id, player.id]
}

/** Áp dụng hiệu ứng trạng thái với quy tắc xếp chồng (Refresh, Intensity, Override) */
export function applyStatusEffect(
  target: CombatUnit,
  newEffect: Omit<StatusEffect, "id">,
): { applied: boolean; logText: string; effect: StatusEffect } {
  // Aegis Passive: Giáp Phản Lực Titan — Kháng 50% hiệu ứng làm chậm và phá giáp
  const effectToApply: Omit<StatusEffect, "id"> = { ...newEffect }
  let passiveResistLog = ""
  if (target.gearType === "aegis" && target.isPlayer && (newEffect.type === "emp-slow" || newEffect.type === "armor-break")) {
    const rawVal = newEffect.value
    const mitigatedVal = newEffect.type === "emp-slow"
      ? Math.max(5, Math.round(rawVal * 0.5))
      : Math.round(rawVal * 0.5 * 100) / 100
    effectToApply.value = mitigatedVal
    effectToApply.desc = `${newEffect.desc} (Kháng 50% bởi Giáp Titan)`
    passiveResistLog = ` [NỘI TẠI AEGIS 🛡️] Giáp Phản Lực Titan triệt tiêu 50% hiệu lực ${newEffect.name} (chỉ còn ${newEffect.type === "emp-slow" ? mitigatedVal + " SPD" : Math.round(mitigatedVal * 100) + "%"})!`
  }

  const stackType = effectToApply.stackType || "refresh"
  const existingIndex = target.statusEffects.findIndex((e) => e.type === effectToApply.type)

  if (existingIndex >= 0) {
    const existing = target.statusEffects[existingIndex]

    if (stackType === "intensity") {
      // Cộng dồn tầng
      const maxStacks = effectToApply.maxStacks || 3
      const currentStacks = existing.stacks || 1
      const nextStacks = Math.min(maxStacks, currentStacks + (effectToApply.stacks || 1))
      existing.stacks = nextStacks
      existing.duration = Math.max(existing.duration, effectToApply.duration)
      return {
        applied: true,
        effect: existing,
        logText: `[HIỆU ỨNG ⚡] ${effectToApply.name} trên ${target.name} tăng cộng dồn lên TẦNG ${nextStacks}/${maxStacks} (${existing.duration} lượt)!${passiveResistLog}`,
      }
    } else if (stackType === "override") {
      // Ghi đè nếu hiệu quả mới mạnh hơn hoặc bằng
      if (effectToApply.value >= existing.value) {
        target.statusEffects[existingIndex] = {
          ...effectToApply,
          id: `eff-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        }
        return {
          applied: true,
          effect: target.statusEffects[existingIndex],
          logText: `[HIỆU ỨNG ⚡] ${effectToApply.name} ghi đè hiệu ứng cũ trên ${target.name} (${effectToApply.duration} lượt)!${passiveResistLog}`,
        }
      } else {
        return {
          applied: false,
          effect: existing,
          logText: `[HIỆU ỨNG] ${target.name} đang có hiệu ứng bảo hộ mạnh hơn, không bị ghi đè.${passiveResistLog}`,
        }
      }
    } else {
      // Refresh thời gian hiệu lực
      existing.duration = Math.max(existing.duration, effectToApply.duration)
      return {
        applied: true,
        effect: existing,
        logText: `[HIỆU ỨNG ⚡] Làm mới thời hạn ${effectToApply.name} trên ${target.name} (${existing.duration} lượt)!${passiveResistLog}`,
      }
    }
  }

  // Thêm hiệu ứng mới
  const created: StatusEffect = {
    ...effectToApply,
    id: `eff-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    stacks: effectToApply.stacks || (stackType === "intensity" ? 1 : undefined),
  }
  target.statusEffects.push(created)
  return {
    applied: true,
    effect: created,
    logText: `[HIỆU ỨNG ⚡] ${target.name} nhận trạng thái ${effectToApply.name} trong ${effectToApply.duration} lượt!${passiveResistLog}`,
  }
}

export function createInitialCombatState(
  encounterId: EnemyEncounterType = "scout-drone",
  customPlayerUnit?: CombatUnit,
  customEnemyUnit?: CombatUnit,
): CombatState {
  const player = customPlayerUnit ? cloneUnit(customPlayerUnit) : cloneUnit(VANGUARD_INITIAL_UNIT)
  const enemy = customEnemyUnit ? cloneUnit(customEnemyUnit) : cloneUnit(ENEMIES_DATA[encounterId])

  // Thứ tự lượt dựa trên tốc độ thực tế (Dynamic Speed Initiative)
  const pSpd = getEffectiveSpeed(player)
  const eSpd = getEffectiveSpeed(enemy)
  const playerFirst = pSpd >= eSpd
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
        ? `[TỐC ĐỘ] Tốc độ ${player.name} (${pSpd}) cao hơn mục tiêu (${eSpd}) -> Giành quyền hành động trước!`
        : `[TỐC ĐỘ] Mục tiêu ${enemy.name} có tốc độ vượt trội (${eSpd} > ${pSpd} của ${player.name}) -> Địch tấn công trước!`,
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

/** Tính toán sát thương dựa trên Công, Thủ, Xuyên Giáp, Bạo Kích, Giảm Sát Thương và Né Tránh */
export function calculateCombatDamage(
  attacker: CombatUnit,
  defender: CombatUnit,
  skill: CombatSkill,
  options?: CombatActionOptions,
): { damage: number; isCrit: boolean; isEvaded: boolean; reducedByGuard: boolean } {
  // 1. Kiểm tra Né Tránh (Evasion)
  if (options?.forceEvade) {
    return { damage: 0, isCrit: false, isEvaded: true, reducedByGuard: false }
  }

  if (!options?.forceNoEvade && skill.id !== "siege-annihilation") {
    let effectiveEvasion = getEffectiveEvasion(defender)
    const spdDiff = getEffectiveSpeed(defender) - getEffectiveSpeed(attacker)
    if (spdDiff > 15) {
      effectiveEvasion += Math.min(20, Math.round(spdDiff * 0.25))
    }
    effectiveEvasion = Math.min(85, Math.max(0, effectiveEvasion))

    if (Math.random() * 100 < effectiveEvasion) {
      return { damage: 0, isCrit: false, isEvaded: true, reducedByGuard: false }
    }
  }

  // 2. Tính toán Phòng Thủ có tính đến Xuyên Giáp
  const armorPen = skill.armorPenetration ?? attacker.armorPenetration ?? 0
  const effectiveDefense = getEffectiveDefense(defender) * Math.max(0, 1 - armorPen)

  // 3. Sát thương cơ bản
  const skillMult = skill.damageMultiplier || 1.0
  const baseAttackPower = getEffectiveAttack(attacker) * skillMult

  // 4. Công thức giảm trừ phòng thủ sci-fi
  let rawDamage = Math.max(15, Math.round(baseAttackPower - effectiveDefense * 0.65))

  // Biến thiên ngẫu nhiên nhẹ (±6%)
  const variance = 0.94 + Math.random() * 0.12
  rawDamage = Math.round(rawDamage * variance)

  // 5. Tỉ lệ chí mạng & Sát thương bạo kích (Falcon có thiên hướng chí mạng cao hơn)
  const defaultCritRate = attacker.gearType === "falcon" ? 0.25 : attacker.isPlayer ? 0.15 : 0.1
  const critChance = attacker.critRate ?? defaultCritRate
  const isCrit = options?.forceCrit !== undefined ? options.forceCrit : Math.random() < critChance
  if (isCrit) {
    const defaultCritMult = attacker.gearType === "falcon" ? 1.75 : 1.5
    const critMult = attacker.critDamage ?? defaultCritMult
    rawDamage = Math.round(rawDamage * critMult)
  }

  // 5b. Marcus Passive: Hỏa Lực Dồn Ép (+8% sát thương khi mục tiêu còn trên 70% HP)
  let marcusPassiveApplied = false
  if (attacker.pilotId === "marcus" && defender.maxHp > 0 && (defender.hp / defender.maxHp) > 0.70) {
    rawDamage = Math.round(rawDamage * 1.08)
    marcusPassiveApplied = true
  }

  // 6. Kiểm tra hiệu ứng phòng thủ (Emergency Guard / Fortify) trên mục tiêu
  const guardEffect = defender.statusEffects.find((e) => e.type === "emergency-guard")
  let reducedByGuard = false
  if (guardEffect) {
    rawDamage = Math.max(10, Math.round(rawDamage * (1 - guardEffect.value)))
    reducedByGuard = true
  }

  return { damage: Math.max(0, rawDamage), isCrit, isEvaded: false, reducedByGuard, marcusPassiveApplied }
}

/** Cập nhật giảm thời gian hiệu lực buff/debuff, hồi chiêu kỹ năng và kích hoạt DoT (Plasma Burn / Acid) */
export function tickUnitTurn(unit: CombatUnit, turnNumber?: number): {
  dotLogs: { text: string; damage: number }[]
  expiredLogs: { text: string; effectName: string }[]
  passiveLogs: { text: string }[]
  wasStunned: boolean
} {
  const dotLogs: { text: string; damage: number }[] = []
  const expiredLogs: { text: string; effectName: string }[] = []
  const passiveLogs: { text: string }[] = []

  // 1. Kiểm tra sát thương DoT (Đầu lượt)
  const burnEffect = unit.statusEffects.find((e) => e.type === "plasma-burn")
  if (burnEffect) {
    const dotDmg = Math.max(12, Math.round(unit.attack * (burnEffect.dotPercent || 0.15)))
    unit.hp = Math.max(0, unit.hp - dotDmg)
    dotLogs.push({
      text: `[THIÊU ĐỐT 🔥] Lửa Plasma thiêu đốt vỏ giáp của ${unit.name}, gây ${dotDmg} sát thương nhiệt!`,
      damage: dotDmg,
    })
  }

  const acidEffect = unit.statusEffects.find((e) => e.type === "acid-corrosion")
  if (acidEffect) {
    const stacks = acidEffect.stacks || 1
    const dotDmg = Math.max(10, Math.round(unit.attack * (acidEffect.dotPercent || 0.08) * stacks))
    unit.hp = Math.max(0, unit.hp - dotDmg)
    dotLogs.push({
      text: `[ĂN MÒN 🧪] Acid cực mạnh nung chảy kim loại ${unit.name} (Tầng ${stacks}), gây ${dotDmg} sát thương!`,
      damage: dotDmg,
    })
  }

  // 2. Giảm thời gian hồi chiêu
  for (const k of Object.keys(unit.skillCooldowns)) {
    if (unit.skillCooldowns[k] > 0) {
      unit.skillCooldowns[k] -= 1
    }
  }

  // 3. Kiểm tra Choáng / Quá nhiệt
  const stunEffect = unit.statusEffects.find((e) => e.type === "stun")
  const wasStunned = Boolean(stunEffect)

  // 4. Giảm thời hạn trạng thái hiệu ứng & ghi nhận hiệu ứng hết hạn
  const remainingEffects: StatusEffect[] = []
  for (const effect of unit.statusEffects) {
    const nextDuration = effect.duration - 1
    if (nextDuration <= 0) {
      expiredLogs.push({
        text: `[HẾT HIỆU LỰC ⏳] Trạng thái ${effect.name} trên ${unit.name} đã kết thúc.`,
        effectName: effect.name,
      })
    } else {
      remainingEffects.push({
        ...effect,
        duration: nextDuration,
      })
    }
  }
  unit.statusEffects = remainingEffects

  // 5. Hồi phục nhẹ 5 SP tự nhiên mỗi lượt
  unit.sp = Math.min(unit.maxSp, unit.sp + 5)

  // 6. Vanguard Passive: Lõi Năng Lượng Ổn Định (+5 SP thêm mỗi lượt và -1 Cooldown mỗi 3 lượt)
  if (unit.gearType === "vanguard" && unit.isPlayer) {
    unit.sp = Math.min(unit.maxSp, unit.sp + 5)
    passiveLogs.push({
      text: `[NỘI TẠI VANGUARD ⚡] Lõi Năng Lượng Ổn Định hồi thêm +5 SP (Tổng hồi +10 SP/lượt, SP: ${unit.sp}/${unit.maxSp}).`,
    })

    if (turnNumber !== undefined && turnNumber > 0 && turnNumber % 3 === 0) {
      const coolingDownSkills = Object.keys(unit.skillCooldowns).filter((k) => unit.skillCooldowns[k] > 0)
      if (coolingDownSkills.length > 0) {
        // Giảm chiêu có CD cao nhất
        const targetSkillId = coolingDownSkills.sort((a, b) => unit.skillCooldowns[b] - unit.skillCooldowns[a])[0]
        unit.skillCooldowns[targetSkillId] = Math.max(0, unit.skillCooldowns[targetSkillId] - 1)
        const skillName = unit.skills.find((s) => s.id === targetSkillId)?.name || targetSkillId
        passiveLogs.push({
          text: `[NỘI TẠI VANGUARD ⚡] Lõi Năng Lượng Ổn Định đạt chu kỳ 3 lượt (Lượt ${turnNumber})! Giảm thêm 1 lượt hồi chiêu cho kỹ năng [${skillName}]!`,
        })
      }
    }
  }

  return { dotLogs, expiredLogs, passiveLogs, wasStunned }
}

/** Thực hiện kỹ năng của Người chơi */
export function executePlayerAction(
  state: CombatState,
  skillId: string,
  options?: CombatActionOptions,
): CombatState {
  if (state.status !== "player-turn") return state

  const player = cloneUnit(state.player)
  const enemy = cloneUnit(state.enemy)
  const now = `00:${String(Math.min(99, state.turnNumber * 4)).padStart(2, "0")}`
  const newLogs: CombatLogItem[] = [...state.logs]

  // 1. Kiểm tra xem người chơi có bị Choáng (Stun) không
  const stunEffect = player.statusEffects.find((e) => e.type === "stun")
  if (stunEffect) {
    newLogs.push({
      id: `log-${Date.now()}-pstun`,
      turn: state.turnNumber,
      type: "status",
      text: `[VÔ HIỆU HÓA ⚠️] Hệ thống điều khiển của ${player.name} bị quá nhiệt/choáng! Bị mất lượt hành động!`,
      actorName: player.name,
      timestamp: now,
    })
    const tickResult = tickUnitTurn(player, state.turnNumber)
    for (const d of tickResult.dotLogs) {
      newLogs.push({
        id: `log-${Date.now()}-pdot-${Math.random().toString(36).slice(2, 6)}`,
        turn: state.turnNumber,
        type: "damage",
        text: d.text,
        actorName: "HIỆU ỨNG",
        targetName: player.name,
        value: d.damage,
        timestamp: now,
      })
    }
    for (const exp of tickResult.expiredLogs) {
      newLogs.push({
        id: `log-${Date.now()}-pexp-${Math.random().toString(36).slice(2, 6)}`,
        turn: state.turnNumber,
        type: "status",
        text: exp.text,
        actorName: player.name,
        timestamp: now,
      })
    }
    for (const p of tickResult.passiveLogs) {
      newLogs.push({
        id: `log-${Date.now()}-ppassive-${Math.random().toString(36).slice(2, 6)}`,
        turn: state.turnNumber,
        type: "status",
        text: p.text,
        actorName: player.name,
        timestamp: now,
      })
    }
    const updatedQueue = calculateTurnQueue(player, enemy)
    return {
      ...state,
      player,
      enemy,
      turnQueue: updatedQueue,
      status: "enemy-turn",
      currentTurnActorId: enemy.id,
      logs: newLogs,
    }
  }

  const skill = player.skills.find((s) => s.id === skillId)
  if (!skill) return state

  // Kiểm tra SP và hồi chiêu
  if (player.sp < skill.spCost) return state
  if ((player.skillCooldowns[skill.id] || 0) > 0) return state

  // Trừ tiêu hao SP và đặt thời gian hồi chiêu
  player.sp = Math.max(0, player.sp - skill.spCost)
  if (skill.cooldown > 0) {
    player.skillCooldowns[skill.id] = skill.cooldown
  }

  let lastActionData: CombatState["lastAction"]

  if (skill.targetType === "self") {
    // Kỹ năng bản thân: Phòng thủ / Lá Chắn / Nạp năng lượng
    const reduction = skill.damageReduction || 0.5
    const guardRes = applyStatusEffect(player, {
      type: "emergency-guard",
      name: skill.name,
      desc: `Giảm ${Math.round(reduction * 100)}% sát thương nhận vào trong ${skill.effectDuration || 2} lượt`,
      duration: skill.effectDuration || 2,
      value: reduction,
      stackType: "override",
    })

    newLogs.push({
      id: `log-${Date.now()}-guard`,
      turn: state.turnNumber,
      type: "status",
      text: `[PHÒNG HỘ] ${player.name} kích hoạt ${skill.name}! Tạo trường từ trường chắn giảm ${Math.round(reduction * 100)}% sát thương gánh chịu trong ${guardRes.effect.duration} lượt.`,
      actorName: player.name,
      timestamp: now,
    })

    lastActionData = {
      actorId: player.id,
      skillName: skill.name,
      effectApplied: `${skill.name} (-${Math.round(reduction * 100)}% Sát thương)`,
    }
  } else {
    // Đòn tấn công hoặc kỹ năng đơn mục tiêu
    if (skill.id === "basic-attack") {
      player.sp = Math.min(player.maxSp, player.sp + 15)
    }

    const { damage, isCrit, isEvaded, reducedByGuard, marcusPassiveApplied } = calculateCombatDamage(player, enemy, skill, options)

    if (isEvaded) {
      newLogs.push({
        id: `log-${Date.now()}-eva`,
        turn: state.turnNumber,
        type: "evade",
        text: `[NÉ TRÁNH 💨] ${enemy.name} cơ động lướt khỏi tầm bắn của ${skill.name}! Không nhận sát thương.`,
        actorName: enemy.name,
        timestamp: now,
      })
      lastActionData = {
        actorId: player.id,
        skillName: skill.name,
        damage: 0,
        isEvaded: true,
      }
    } else {
      enemy.hp = Math.max(0, enemy.hp - damage)

      let logText = `[TẤN CÔNG] ${player.name} xuất kích ${skill.name} -> Đánh trúng ${enemy.name}, gây ${damage} sát thương!`
      if (isCrit) {
        logText = `[BẠO KÍCH 🔥] ${player.name} bắn trúng điểm yếu bằng ${skill.name}! Gây ${damage} sát thương chí mạng!`
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

      if (marcusPassiveApplied) {
        newLogs.push({
          id: `log-${Date.now()}-marcus-passive`,
          turn: state.turnNumber,
          type: "status",
          text: `[NỘI TẠI MARCUS 🎯] Hỏa Lực Dồn Ép của Marcus tăng thêm 8% sát thương do mục tiêu còn trên 70% HP!`,
          actorName: player.name,
          timestamp: now,
        })
      }

      // Falcon Passive: Khí Động Học Mach — 50% tỉ lệ kích hoạt đòn bắn phụ không tốn SP khi bạo kích
      let falconFollowUpDmg = 0
      const shouldFalconFollowUp =
        options?.forceFalconFollowUp !== undefined ? options.forceFalconFollowUp : Math.random() < 0.50
      if (isCrit && player.gearType === "falcon" && shouldFalconFollowUp) {
        falconFollowUpDmg = Math.max(25, Math.round(damage * 0.50))
        enemy.hp = Math.max(0, enemy.hp - falconFollowUpDmg)
        newLogs.push({
          id: `log-${Date.now()}-falcon-followup`,
          turn: state.turnNumber,
          type: "crit",
          text: `[NỘI TẠI FALCON ⚡] Khí Động Học Mach kích hoạt! Đòn bạo kích khai hỏa tiếp một đòn bắn bồi không tốn SP, gây thêm ${falconFollowUpDmg} sát thương!`,
          actorName: player.name,
          targetName: enemy.name,
          value: falconFollowUpDmg,
          timestamp: now,
        })
      }

      // Xử lý hiệu ứng Phá Giáp (Armor Break)
      if (skill.defenseReduction && skill.effectDuration) {
        const abRes = applyStatusEffect(enemy, {
          type: "armor-break",
          name: "Vỡ Vỏ Giáp",
          desc: `Giảm ${Math.round(skill.defenseReduction * 100)}% phòng ngự`,
          duration: skill.effectDuration,
          value: skill.defenseReduction,
          stackType: "refresh",
          isDebuff: true,
        })
        newLogs.push({
          id: `log-${Date.now()}-ab`,
          turn: state.turnNumber,
          type: "status",
          text: `[HIỆU ỨNG ⚡] Vỏ giáp của ${enemy.name} bị nứt toác! Phòng ngự suy giảm ${Math.round(skill.defenseReduction * 100)}% trong ${abRes.effect.duration} lượt.`,
          actorName: player.name,
          targetName: enemy.name,
          timestamp: now,
        })
      }

      // Xử lý hiệu ứng phụ tự bảo vệ (Falcon Ghost Dash)
      if (skill.damageReduction && skill.effectDuration) {
        applyStatusEffect(player, {
          type: "emergency-guard",
          name: "Lá Chắn Né Tránh",
          desc: `Giảm ${Math.round(skill.damageReduction * 100)}% sát thương nhận vào`,
          duration: skill.effectDuration,
          value: skill.damageReduction,
          stackType: "override",
        })
      }

      lastActionData = {
        actorId: player.id,
        skillName: skill.name,
        damage,
        isCrit,
      }
    }
  }

  // Kiểm tra điều kiện Thắng
  if (enemy.hp <= 0) {
    newLogs.push({
      id: `log-${Date.now()}-vic`,
      turn: state.turnNumber,
      type: "victory",
      text: `[CHIẾN THẮNG 🏆] Mục tiêu ${enemy.name} đã bị phá hủy hoàn toàn! Chiến cơ ${player.name} toàn thắng trở về căn cứ!`,
      actorName: "HỆ THỐNG",
      timestamp: now,
    })

    return {
      ...state,
      player,
      enemy,
      telegraphedAttack: null,
      status: "victory",
      logs: newLogs,
      lastAction: lastActionData,
    }
  }

  // Kết thúc lượt người chơi -> Kích hoạt DoT & Cooldown tick (truyền state.turnNumber)
  const tickResult = tickUnitTurn(player, state.turnNumber)
  for (const d of tickResult.dotLogs) {
    newLogs.push({
      id: `log-${Date.now()}-pdot-${Math.random().toString(36).slice(2, 6)}`,
      turn: state.turnNumber,
      type: "damage",
      text: d.text,
      actorName: "HIỆU ỨNG",
      targetName: player.name,
      value: d.damage,
      timestamp: now,
    })
  }
  for (const exp of tickResult.expiredLogs) {
    newLogs.push({
      id: `log-${Date.now()}-pexp-${Math.random().toString(36).slice(2, 6)}`,
      turn: state.turnNumber,
      type: "status",
      text: exp.text,
      actorName: player.name,
      timestamp: now,
    })
  }
  for (const p of tickResult.passiveLogs) {
    newLogs.push({
      id: `log-${Date.now()}-ppassive-${Math.random().toString(36).slice(2, 6)}`,
      turn: state.turnNumber,
      type: "status",
      text: p.text,
      actorName: player.name,
      timestamp: now,
    })
  }

  if (player.hp <= 0) {
    newLogs.push({
      id: `log-${Date.now()}-pdead`,
      turn: state.turnNumber,
      type: "defeat",
      text: `[THẤT BẠI 💀] Cơ giáp ${player.name} đã bị phá hủy do tổn thất kết cấu! Phi công phóng thoát hiểm.`,
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

  // Cập nhật Dynamic Turn Queue theo tốc độ hiện thời
  const updatedQueue = calculateTurnQueue(player, enemy)

  return {
    ...state,
    player,
    enemy,
    turnQueue: updatedQueue,
    status: "enemy-turn",
    currentTurnActorId: enemy.id,
    logs: newLogs,
    lastAction: lastActionData,
  }
}

/** Trí tuệ nhân tạo (AI) quyết định hành động của Kẻ địch theo Archetype & Cơ chế Boss */
export function executeEnemyAIAction(
  state: CombatState,
  options?: CombatActionOptions,
): CombatState {
  if (state.status !== "enemy-turn" || state.enemy.hp <= 0) return state

  const enemy = cloneUnit(state.enemy)
  const player = cloneUnit(state.player)
  const now = `00:${String(Math.min(99, state.turnNumber * 4 + 2)).padStart(2, "0")}`
  const newLogs: CombatLogItem[] = [...state.logs]
  let bossWarning = state.bossPhaseWarning || null
  let telegraphState = state.telegraphedAttack || null

  // 1. Kiểm tra Choáng (Stun) của địch
  const stunEffect = enemy.statusEffects.find((e) => e.type === "stun")
  if (stunEffect) {
    if (enemy.isChargingUltimate) {
      enemy.isChargingUltimate = false
      telegraphState = null
      newLogs.push({
        id: `log-${Date.now()}-echarge-break`,
        turn: state.turnNumber,
        type: "system",
        text: `[NGẮT KỸ NĂNG ⚡] Đòn nạp năng lượng của ${enemy.name} đã bị gián đoạn do choáng váng!`,
        actorName: "HỆ THỐNG",
        timestamp: now,
      })
    }

    newLogs.push({
      id: `log-${Date.now()}-estun`,
      turn: state.turnNumber,
      type: "status",
      text: `[VÔ HIỆU HÓA ⚠️] ${enemy.name} bị quá nhiệt/tê liệt hoàn toàn, mất lượt hành động!`,
      actorName: enemy.name,
      timestamp: now,
    })

    const tickRes = tickUnitTurn(enemy, state.turnNumber)
    for (const d of tickRes.dotLogs) {
      newLogs.push({
        id: `log-${Date.now()}-edot-${Math.random().toString(36).slice(2, 6)}`,
        turn: state.turnNumber,
        type: "damage",
        text: d.text,
        actorName: "HIỆU ỨNG",
        targetName: enemy.name,
        value: d.damage,
        timestamp: now,
      })
    }
    for (const exp of tickRes.expiredLogs) {
      newLogs.push({
        id: `log-${Date.now()}-eexp-${Math.random().toString(36).slice(2, 6)}`,
        turn: state.turnNumber,
        type: "status",
        text: exp.text,
        actorName: enemy.name,
        timestamp: now,
      })
    }

    const updatedQueue = calculateTurnQueue(player, enemy)
    return {
      ...state,
      player,
      enemy,
      turnQueue: updatedQueue,
      telegraphedAttack: telegraphState,
      turnNumber: state.turnNumber + 1,
      status: "player-turn",
      currentTurnActorId: player.id,
      logs: newLogs,
    }
  }

  // 2. Cơ chế Boss Đa Pha (Phase 1 -> Phase 2 Enrage khi HP < 50%)
  if (enemy.gearType === "siege-walker" && (!enemy.bossPhase || enemy.bossPhase === 1) && enemy.hp < enemy.maxHp * 0.5) {
    enemy.bossPhase = 2
    bossWarning = "CẢNH BÁO: Pháo Đài kích hoạt PHA 2 - QUÁ TẢI NĂNG LƯỢNG (Overdrive)! +30% Công, +20 Tốc độ!"
    applyStatusEffect(enemy, {
      type: "boss-overdrive",
      name: "Quá Tải Lõi Phản Ứng (Overdrive)",
      desc: "Lõi lò phản ứng tăng tốc cực hạn: +30% Sức tấn công, +20 Tốc độ",
      duration: 99,
      value: 0.3,
    })
    newLogs.push({
      id: `log-${Date.now()}-boss-phase2`,
      turn: state.turnNumber,
      type: "boss-telegraph",
      text: `[BÁO ĐỘNG ĐỎ ⚠️] Lò phản ứng Pháo Đài Công Thành quá tải! Chuyển sang PHA 2: QUÁ TẢI NĂNG LƯỢNG (Overdrive)! Sát thương và tốc độ tăng vọt!`,
      actorName: "HỆ THỐNG",
      timestamp: now,
    })
  }

  // 3. Quyết định hành động theo Cây Chiến Thuật (Archetype Tactical AI)
  let selectedSkill: CombatSkill = enemy.skills[0]
  let isExecutingTelegraphUltimate = false

  // Kịch bản Boss đang sạc tuyệt kỹ:
  if (enemy.isChargingUltimate) {
    isExecutingTelegraphUltimate = true
    enemy.isChargingUltimate = false
    telegraphState = null
    selectedSkill = {
      id: "siege-apocalypse-blast",
      name: "Pháo Hạt Nhân Tận Diệt",
      nameEn: "Apocalypse Nuclear Blast",
      desc: "Xả năng lượng hủy diệt toàn bộ khu vực với 240% sát thương bùng nổ xuyên giáp!",
      spCost: 0,
      cooldown: 0,
      targetType: "single-enemy",
      damageMultiplier: 2.4,
      armorPenetration: 0.3,
    }
  } else if (enemy.archetype === "disruptor") {
    // DISRUPTOR ARCHETYPE (Scout Drone)
    const empSkill = enemy.skills.find((s) => s.id === "drone-emp")
    const jammingSkill = enemy.skills.find((s) => s.id === "drone-jamming")
    const playerSlowed = player.statusEffects.some((e) => e.type === "emp-slow")
    const droneJammed = enemy.statusEffects.some((e) => e.type === "ecm-jamming")

    if (empSkill && !playerSlowed && enemy.sp >= empSkill.spCost && (enemy.skillCooldowns[empSkill.id] || 0) <= 0) {
      selectedSkill = empSkill
    } else if (
      jammingSkill &&
      !droneJammed &&
      enemy.hp < enemy.maxHp * 0.7 &&
      enemy.sp >= jammingSkill.spCost &&
      (enemy.skillCooldowns[jammingSkill.id] || 0) <= 0
    ) {
      selectedSkill = jammingSkill
    } else {
      selectedSkill = enemy.skills[0]
    }
  } else if (enemy.archetype === "aggressive") {
    // AGGRESSIVE ARCHETYPE (Raider Mech)
    const missile = enemy.skills.find((s) => s.id === "mech-missile")
    const plasma = enemy.skills.find((s) => s.id === "mech-plasma-burn")
    const playerBurning = player.statusEffects.some((e) => e.type === "plasma-burn")

    if (
      missile &&
      player.hp < player.maxHp * 0.45 &&
      enemy.sp >= missile.spCost &&
      (enemy.skillCooldowns[missile.id] || 0) <= 0
    ) {
      selectedSkill = missile
    } else if (plasma && !playerBurning && enemy.sp >= plasma.spCost && (enemy.skillCooldowns[plasma.id] || 0) <= 0) {
      selectedSkill = plasma
    } else if (missile && enemy.sp >= missile.spCost && (enemy.skillCooldowns[missile.id] || 0) <= 0) {
      selectedSkill = missile
    } else {
      selectedSkill = enemy.skills[0]
    }
  } else if (enemy.archetype === "adaptive-boss") {
    // ADAPTIVE BOSS ARCHETYPE (Siege Walker)
    const fortify = enemy.skills.find((s) => s.id === "siege-fortify")
    const barrage = enemy.skills.find((s) => s.id === "siege-barrage")
    const acid = enemy.skills.find((s) => s.id === "siege-acid")
    const charge = enemy.skills.find((s) => s.id === "siege-charge")

    const hasShield = enemy.statusEffects.some((e) => e.type === "emergency-guard")
    const acidEffect = player.statusEffects.find((e) => e.type === "acid-corrosion")
    const acidStacks = acidEffect?.stacks || 0

    if (
      enemy.hp < enemy.maxHp * 0.55 &&
      !hasShield &&
      fortify &&
      enemy.sp >= fortify.spCost &&
      (enemy.skillCooldowns[fortify.id] || 0) <= 0
    ) {
      selectedSkill = fortify
    } else if (charge && state.turnNumber >= 2 && state.turnNumber % 3 === 0 && (enemy.skillCooldowns[charge.id] || 0) <= 0 && enemy.sp >= charge.spCost) {
      selectedSkill = charge
    } else if (acid && acidStacks < 3 && enemy.sp >= acid.spCost && (enemy.skillCooldowns[acid.id] || 0) <= 0) {
      selectedSkill = acid
    } else if (barrage && enemy.sp >= barrage.spCost && (enemy.skillCooldowns[barrage.id] || 0) <= 0) {
      selectedSkill = barrage
    } else {
      selectedSkill = enemy.skills[0]
    }
  }

  // Tiêu hao SP & Cooldown
  enemy.sp = Math.max(0, enemy.sp - selectedSkill.spCost)
  if (selectedSkill.cooldown > 0 && selectedSkill.id in enemy.skillCooldowns) {
    enemy.skillCooldowns[selectedSkill.id] = selectedSkill.cooldown
  }

  let lastActionData: CombatState["lastAction"]

  // Xử lý nạp năng lượng (Telegraphed Charge)
  if (selectedSkill.id === "siege-charge") {
    enemy.isChargingUltimate = true
    telegraphState = {
      isCharging: true,
      skillName: "Pháo Hạt Nhân Tận Diệt",
      turnsLeft: 1,
      description: "CẢNH BÁO NGUY CẤP: Pháo Đài đang sạc đạn hạt nhân! Lượt tới sẽ khai hỏa sát thương cực đại!",
    }
    newLogs.push({
      id: `log-${Date.now()}-charge`,
      turn: state.turnNumber,
      type: "boss-telegraph",
      text: `[CẢNH BÁO TỐI CAO 🚨] ${enemy.name} kích hoạt ${selectedSkill.name}! Đang nạp năng lượng cực hạn cho đòn đánh hủy diệt ở lượt tới!`,
      actorName: enemy.name,
      timestamp: now,
    })
    lastActionData = {
      actorId: enemy.id,
      skillName: selectedSkill.name,
      effectApplied: "Sạc Đạn Hạt Nhân",
    }
  } else if (selectedSkill.targetType === "self") {
    // Tự buff
    if (selectedSkill.statusToApply) {
      const applyRes = applyStatusEffect(enemy, selectedSkill.statusToApply)
      newLogs.push({
        id: `log-${Date.now()}-eself`,
        turn: state.turnNumber,
        type: "status",
        text: `[PHÒNG VỆ ĐỊCH] ${enemy.name} dùng ${selectedSkill.name}: ${applyRes.logText}`,
        actorName: enemy.name,
        timestamp: now,
      })
    }
    lastActionData = {
      actorId: enemy.id,
      skillName: selectedSkill.name,
      effectApplied: selectedSkill.name,
    }
  } else {
    // Tấn công đơn mục tiêu
    const { damage, isCrit, isEvaded, reducedByGuard } = calculateCombatDamage(enemy, player, selectedSkill, options)

    if (isEvaded) {
      newLogs.push({
        id: `log-${Date.now()}-peva`,
        turn: state.turnNumber,
        type: "evade",
        text: `[NÉ TRÁNH 💨] ${player.name} tăng tốc lượn vòng né đòn ${selectedSkill.name} của ${enemy.name}!`,
        actorName: player.name,
        timestamp: now,
      })
      lastActionData = {
        actorId: enemy.id,
        skillName: selectedSkill.name,
        damage: 0,
        isEvaded: true,
      }
    } else {
      let actualDmgToHp = damage
      let shieldAbsorbed = 0
      if (player.shield !== undefined && player.shield > 0) {
        shieldAbsorbed = Math.min(player.shield, damage)
        player.shield -= shieldAbsorbed
        actualDmgToHp = damage - shieldAbsorbed
      }
      player.hp = Math.max(0, player.hp - actualDmgToHp)

      // Valentine Passive: Emergency Overcharge — Khi khiên lần đầu giảm về 0, hồi 30% khiên tối đa (1 lần/trận)
      if (
        player.pilotId === "valentine" &&
        !player.pilotPassiveTriggered &&
        (player.shield === 0 || player.shield === undefined)
      ) {
        player.pilotPassiveTriggered = true
        const restoredShield = Math.max(50, Math.round((player.maxShield || 300) * 0.30))
        player.shield = restoredShield
        newLogs.push({
          id: `log-${Date.now()}-val-passive`,
          turn: state.turnNumber,
          type: "status",
          text: `[NỘI TẠI VALENTINE 🛡️] Lá Chắn Cấp Cứu của Valentine kích hoạt khẩn cấp khi khiên bị vỡ! Tái tạo ${restoredShield} Khiên năng lượng (1 lần/trận)!`,
          actorName: player.name,
          timestamp: now,
        })
      }

      // Aegis Passive: Giáp Phản Lực Titan — Khiên gai phản lại 20% sát thương nhận vào cho kẻ tấn công
      let aegisReflectDamage = 0
      if (player.gearType === "aegis" && player.isPlayer && damage > 0) {
        aegisReflectDamage = Math.max(1, Math.round(damage * 0.20))
        enemy.hp = Math.max(0, enemy.hp - aegisReflectDamage)
      }

      let logText = isExecutingTelegraphUltimate
        ? `[TẬN DIỆT HẠT NHÂN ☢️] ${enemy.name} giáng đòn ${selectedSkill.name} hủy diệt! Gây ${damage} sát thương khủng khiếp!`
        : `[ĐỊCH TẤN CÔNG 💥] ${enemy.name} dùng ${selectedSkill.name} bắn trúng ${player.name}! Gây ${damage} sát thương.`

      if (isCrit) {
        logText = `[BẠO KÍCH KẺ ĐỊCH ⚠️] ${enemy.name} hỏa lực bùng nổ với ${selectedSkill.name}! Gây ${damage} sát thương bạo kích!`
      }
      if (reducedByGuard) {
        logText += ` (Lá Chắn của ${player.name} đã hấp thụ một phần sát thương)`
      }

      newLogs.push({
        id: `log-${Date.now()}-eatk`,
        turn: state.turnNumber,
        type: isCrit ? "crit" : isExecutingTelegraphUltimate ? "boss-telegraph" : "enemy-action",
        text: logText,
        actorName: enemy.name,
        targetName: player.name,
        value: damage,
        timestamp: now,
      })

      if (aegisReflectDamage > 0) {
        newLogs.push({
          id: `log-${Date.now()}-aegis-reflect`,
          turn: state.turnNumber,
          type: "damage",
          text: `[NỘI TẠI AEGIS 🛡️] Giáp Phản Lực Titan kích hoạt! Khiên gai hấp thụ và phản lại 20% sát thương (${aegisReflectDamage} sát thương phản đòn) thẳng vào ${enemy.name}!`,
          actorName: player.name,
          targetName: enemy.name,
          value: aegisReflectDamage,
          timestamp: now,
        })
      }

      // Nếu đòn phản sát thương tiêu diệt kẻ địch
      if (enemy.hp <= 0 && player.hp > 0) {
        newLogs.push({
          id: `log-${Date.now()}-vic-reflect`,
          turn: state.turnNumber,
          type: "victory",
          text: `[CHIẾN THẮNG 🏆] Mục tiêu ${enemy.name} đã bị tiêu diệt hoàn toàn bởi sát thương phản đòn từ Giáp Phản Lực Titan! Cơ giáp ${player.name} toàn thắng trở về căn cứ!`,
          actorName: "HỆ THỐNG",
          timestamp: now,
        })
        return {
          ...state,
          player,
          enemy,
          telegraphedAttack: null,
          status: "victory",
          logs: newLogs,
          lastAction: lastActionData,
        }
      }

      // Gắn debuff nếu skill có statusToApply
      if (selectedSkill.statusToApply) {
        const appRes = applyStatusEffect(player, selectedSkill.statusToApply)
        newLogs.push({
          id: `log-${Date.now()}-edebuff`,
          turn: state.turnNumber,
          type: "status",
          text: appRes.logText,
          actorName: enemy.name,
          targetName: player.name,
          timestamp: now,
        })
      }

      lastActionData = {
        actorId: enemy.id,
        skillName: selectedSkill.name,
        damage,
        isCrit,
      }
    }
  }

  // Kiểm tra điều kiện Thất bại của người chơi
  if (player.hp <= 0) {
    newLogs.push({
      id: `log-${Date.now()}-def`,
      turn: state.turnNumber,
      type: "defeat",
      text: `[THẤT BẠI 💀] Vỏ giáp của ${player.name} bị phá hủy hoàn toàn! Phi công buộc phải kích hoạt buồng phóng thoát hiểm.`,
      actorName: "HỆ THỐNG",
      timestamp: now,
    })

    return {
      ...state,
      player,
      enemy,
      bossPhaseWarning: bossWarning,
      telegraphedAttack: telegraphState,
      status: "defeat",
      logs: newLogs,
      lastAction: lastActionData,
    }
  }

  // Kết thúc lượt địch -> DoT & Cooldown tick
  const tickRes = tickUnitTurn(enemy, state.turnNumber)
  for (const d of tickRes.dotLogs) {
    newLogs.push({
      id: `log-${Date.now()}-edot-${Math.random().toString(36).slice(2, 6)}`,
      turn: state.turnNumber,
      type: "damage",
      text: d.text,
      actorName: "HIỆU ỨNG",
      targetName: enemy.name,
      value: d.damage,
      timestamp: now,
    })
  }
  for (const exp of tickRes.expiredLogs) {
    newLogs.push({
      id: `log-${Date.now()}-eexp-${Math.random().toString(36).slice(2, 6)}`,
      turn: state.turnNumber,
      type: "status",
      text: exp.text,
      actorName: enemy.name,
      timestamp: now,
    })
  }

  // Nếu địch chết vì DoT:
  if (enemy.hp <= 0) {
    newLogs.push({
      id: `log-${Date.now()}-vic-dot`,
      turn: state.turnNumber,
      type: "victory",
      text: `[CHIẾN THẮNG 🏆] Mục tiêu ${enemy.name} bị phá hủy bởi sát thương hiệu ứng kéo dài! Toàn thắng trở về căn cứ!`,
      actorName: "HỆ THỐNG",
      timestamp: now,
    })
    return {
      ...state,
      player,
      enemy,
      telegraphedAttack: null,
      status: "victory",
      logs: newLogs,
      lastAction: lastActionData,
    }
  }

  // Cập nhật Dynamic Turn Queue
  const updatedQueue = calculateTurnQueue(player, enemy)

  return {
    ...state,
    player,
    enemy,
    turnQueue: updatedQueue,
    turnNumber: state.turnNumber + 1,
    status: "player-turn",
    currentTurnActorId: player.id,
    bossPhaseWarning: bossWarning,
    telegraphedAttack: telegraphState,
    logs: newLogs,
    lastAction: lastActionData,
  }
}
