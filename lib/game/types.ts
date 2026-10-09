export type GearClass = "A" | "B" | "I" | "M"

export type StatKey = "hp" | "attack" | "defense" | "speed" | "evasion" | "energy"

export type Stats = Record<StatKey, number>

export type PilotStatKey = "attack" | "defense" | "agility" | "shield" | "vision"
export type PilotStats = Record<PilotStatKey, number>

export type PilotSkill = {
  id: string
  name: string
  desc: string
  level: number
  maxLevel: number
  effect: string
  category: "common" | "gear"
}

export type PilotProfile = {
  id: string
  name: string
  age: number
  gender: string
  description: string
  specialty: string
  gear: GearClass
  avatar: string
  aircraftName: string
  armorType: string
  baseStats: PilotStats
  trail: string[]
  skills: PilotSkill[]
}

export type Pilot = {
  profileId: string
  name: string
  level: number
  xp: number
  skillPoints: number
  stats: PilotStats
  skills: PilotSkill[]
  avatar: string
  aircraftUid: string
  selectedAtDay: number
  /** Day-one accounts must explicitly choose a pilot before the linked gear is active. */
  hasSelectedPilot: boolean
}

export type Resources = {
  credits: number
  alloy: number
  energy: number
  crystal: number
}

export type ResourceKey = keyof Resources

export type EquipSlot = "weapon" | "missile" | "armor" | "engine" | "shield"

export type Rarity = "common" | "rare" | "epic" | "legendary"

export type ItemDef = {
  id: string
  name: string
  slot: EquipSlot
  rarity: Rarity
  /** flat stat bonuses granted while equipped */
  bonus: Partial<Stats>
  /** shop / craft cost */
  cost: Partial<Resources>
  desc: string
}

export type ItemInstance = {
  uid: string
  defId: string
  /** upgrade level 0..N, each level scales bonus */
  level: number
}

export type GearClassDef = {
  cls: GearClass
  name: string
  role: string
  color: string
  tagline: string
  /** base stats at level 1 */
  base: Stats
  /** per-level growth */
  growth: Stats
  /** default loadout hint */
  strengths: string[]
  buildCost: Partial<Resources>
}

export type Gear = {
  uid: string
  cls: GearClass
  name: string
  level: number
  xp: number
  /** current durability out of max hp (persisted between battles) */
  hpCurrent: number
  equipped: Partial<Record<EquipSlot, string>> // slot -> item uid
}

export type BuildingKey =
  | "command"
  | "hangar"
  | "factory"
  | "reactor"
  | "refinery"
  | "barracks"
  | "turret"
  | "shipyard"
  | "finance"
  | "alliance"
  | "residential"
  | "trade"
  | "entertainment"

export type DistrictKey = "finance" | "service" | "industry" | "power" | "repair" | "shipbuilding"

/** percent of population assigned to each district (step 5, min 5, total <= 100) */
export type DistrictAllocation = Record<DistrictKey, number>

export type DistrictBonus = {
  credits: number
  crystal: number
  alloy: number
  energy: number
  /** flat HP restored per gear per day */
  repairHp: number
  /** flat reduction applied to every gear build cost component */
  shipDiscount: number
  gearCap: number
}

export type BuildingDef = {
  key: BuildingKey
  name: string
  desc: string
  /** what stat/output this building drives */
  effect: string
  maxLevel: number
  baseCost: Partial<Resources>
  /** multiplier applied to cost per level */
  costScale: number
}

export type Building = {
  key: BuildingKey
  level: number
}

export type SectorKind = "outpost" | "base" | "mothership"

export type Sector = {
  id: string
  name: string
  kind: SectorKind
  isMainBase?: boolean
  baseLevel?: number
  baseGarrison?: number
  baseCapacity?: number
  baseBuildings?: number
  x: number // 0..100 map coords
  y: number
  /** enemy defensive power rating */
  threat: number
  /** enemy garrison size */
  garrison: number
  /** rewards on capture */
  reward: Partial<Resources>
  /** troops gained on capture (adds to army cap usage) */
  troopReward: number
  captured: boolean
  /** required min fleet power suggestion */
  recommendedPower: number
  faction: string
}

export type BattleSide = "player" | "enemy"

export type BattleUnitSnapshot = {
  uid: string
  name: string
  cls: GearClass | "enemy"
  hp: number
  maxHp: number
  power: number
}

export type BattleLogEntry = {
  turn: number
  text: string
  kind: "info" | "player-hit" | "enemy-hit" | "crit" | "down" | "victory" | "defeat"
}

export type BattleResult = {
  sectorId: string
  victory: boolean
  rounds: number
  log: BattleLogEntry[]
  playerUnits: BattleUnitSnapshot[]
  enemyUnits: BattleUnitSnapshot[]
  reward?: Partial<Resources>
  troopReward?: number
}

export type GameState = {
  commander: string
  day: number
  pilot: Pilot
  resources: Resources
  army: number // current troop count
  armyCap: number
  gears: Gear[]
  inventory: ItemInstance[]
  buildings: Record<BuildingKey, number> // key -> level
  population: number
  districts: DistrictAllocation
  sectors: Sector[]
  lastBattle: BattleResult | null
  eventLog: { day: number; text: string }[]
}

/* ==========================================================================
   PHASE 1 — TURN-BASED COMBAT PROTOTYPE TYPES
   ========================================================================== */

export type CombatSkillId = "pulse-strike" | "armor-break" | "emergency-guard" | "basic-attack"

export type CombatStatusType =
  | "armor-break"
  | "emergency-guard"
  | "recharge"
  | "stun"
  | "plasma-burn"
  | "acid-corrosion"
  | "emp-slow"
  | "ecm-jamming"
  | "speed-boost"
  | "charge-ultimate"
  | "boss-overdrive"

export type StatusEffect = {
  id: string
  type: CombatStatusType
  name: string
  desc: string
  duration: number // turns remaining
  value: number // magnitude (e.g. 0.35 defense reduction or 0.50 damage mitigation)
  stacks?: number
  maxStacks?: number
  stackType?: "refresh" | "intensity" | "override"
  dotPercent?: number
  isDebuff?: boolean
}

export type CombatSkill = {
  id: string
  name: string
  nameEn: string
  desc: string
  spCost: number
  cooldown: number // turn cooldown
  targetType: "single-enemy" | "self"
  damageMultiplier?: number
  defenseReduction?: number
  damageReduction?: number
  effectDuration?: number
  armorPenetration?: number
  statusToApply?: Omit<StatusEffect, "id">
  icon?: string
}

export type EnemyArchetype = "aggressive" | "defensive" | "disruptor" | "adaptive-boss"

export type CombatUnit = {
  id: string
  name: string
  title: string
  gearType: "vanguard" | "falcon" | "aegis" | "scout-drone" | "raider-mech" | "siege-walker"
  isPlayer: boolean
  hp: number
  maxHp: number
  sp: number
  maxSp: number
  attack: number
  defense: number
  speed: number
  evasion?: number
  critRate?: number
  critDamage?: number
  armorPenetration?: number
  statusEffects: StatusEffect[]
  skills: CombatSkill[]
  skillCooldowns: Record<string, number>
  avatar?: string
  archetype?: EnemyArchetype
  bossPhase?: 1 | 2
  isChargingUltimate?: boolean
  chargedSkillName?: string
}

export type CombatLogType =
  | "player-action"
  | "enemy-action"
  | "damage"
  | "status"
  | "crit"
  | "evade"
  | "boss-telegraph"
  | "victory"
  | "defeat"
  | "system"

export type CombatLogItem = {
  id: string
  turn: number
  text: string
  type: CombatLogType
  actorName: string
  targetName?: string
  value?: number
  timestamp: string
}

export type BattleStatus = "ready" | "player-turn" | "enemy-turn" | "animating" | "victory" | "defeat"

export type EnemyEncounterType = "scout-drone" | "raider-mech" | "siege-walker"

export type CombatState = {
  encounterId: EnemyEncounterType
  turnNumber: number
  currentTurnActorId: string
  turnQueue: string[]
  player: CombatUnit
  enemy: CombatUnit
  status: BattleStatus
  logs: CombatLogItem[]
  bossPhaseWarning?: string | null
  telegraphedAttack?: {
    isCharging: boolean
    skillName: string
    turnsLeft: number
    description: string
  } | null
  lastAction?: {
    actorId: string
    skillName: string
    damage?: number
    isCrit?: boolean
    isEvaded?: boolean
    effectApplied?: string
  }
}

/* ==========================================================================
   PHASE 2 & 3 — PROGRESSION, GEAR CLASSES, CAMPAIGN, SHOP & SAVE TYPES
   ========================================================================== */

export type StarfrontGearId = "vanguard" | "falcon" | "aegis"

export type StarfrontGearPassive = {
  id: string
  name: string
  desc: string
  shortDesc: string
  icon: string
  details: {
    label: string
    value: string
  }[]
}

export type StarfrontGearClassDef = {
  id: StarfrontGearId
  name: string
  nameEn: string
  role: string
  desc: string
  color: string
  avatar: string
  passive: StarfrontGearPassive
  baseStats: {
    hp: number
    sp: number
    attack: number
    defense: number
    speed: number
  }
  growth: {
    hp: number
    sp: number
    attack: number
    defense: number
    speed: number
  }
  skills: CombatSkill[]
}

export type StarfrontItemSlot = "weapon" | "shield" | "engine"

export type StarfrontItemRarity = "common" | "rare" | "epic" | "legendary"

export type StarfrontItem = {
  id: string
  name: string
  slot: StarfrontItemSlot
  rarity: StarfrontItemRarity
  desc: string
  attackBonus?: number
  defenseBonus?: number
  speedBonus?: number
  hpBonus?: number
  spBonus?: number
  icon?: string
  price?: number
  enhancementLevel?: number // Cấp cường hóa (+0 đến +10)
}

export type StarfrontProgression = {
  version: number // schema version (2)
  level: number
  exp: number
  credits: number
  alloy?: number // Hợp kim cường hóa trang bị
  activeGearId: StarfrontGearId
  unlockedGears: StarfrontGearId[]
  inventory: StarfrontItem[]
  equipped: Record<StarfrontItemSlot, string | null>
  completedMissions: string[]
  battlesWon: number
  battlesLost: number
}

export type BattleRewardResult = {
  expGained: number
  creditsGained: number
  alloyGained?: number
  leveledUp: boolean
  oldLevel: number
  newLevel: number
  newExp: number
  expRequired: number
}

export type CampaignMission = {
  id: string
  sectorId: string
  sectorName: string
  order: number
  title: string
  desc: string
  recommendedLevel: number
  encounterId: EnemyEncounterType
  firstClearReward: {
    credits: number
    exp: number
    alloy?: number
    itemId?: string
  }
  repeatReward: {
    credits: number
    exp: number
    alloy?: number
  }
  reqMissionId?: string
}

export type CampaignSector = {
  id: string
  name: string
  subtitle: string
  desc: string
  color: string
  threatLevel: string
  missions: CampaignMission[]
}

export type ArmoryShopItem = {
  item: StarfrontItem
  buyPrice: number
  stockUnlimited?: boolean
}

