/**
 * STARFRONT WORLD — Combat V2 Core Types & Interfaces (Phase 6.32)
 *
 * Defines the complete authoritative contract for the tactical Combat V2 engine:
 *   - Dynamic asymmetric force rosters (no fixed squad sizes)
 *   - Individually addressable GEAR machines with 4 states: ACTIVE, RETREATING, RETREATED, DESTROYED
 *   - Independent Commander Authority (decoupled from player personal machine HP)
 *   - Current and queued strategy mechanics
 *   - Morale & Support entity state hooks
 *   - Structured CombatResult & UI-facing derived view models
 */

import type { CombatVersion, FactionId } from "./types"
import type { PilotSurvivalRecord } from "./pilot-survival-types"

/**
 * The four non-negotiable operational states of a GEAR on the Combat V2 battlefield
 */
export type CombatGearState = "ACTIVE" | "RETREATING" | "RETREATED" | "DESTROYED"

/**
 * Side identifier in Combat V2
 */
export type CombatSide = "allied" | "enemy"

/**
 * Temporary combat modifier applied to a GEAR unit
 */
export interface CombatGearModifier {
  id: string
  name: string
  type: "buff" | "debuff"
  stat: "attack" | "defense" | "speed" | "evasion"
  value: number
  roundsRemaining: number
}

/**
 * An individually addressable GEAR unit in Combat V2
 */
export interface CombatV2Gear {
  gearId: string
  name: string
  side: CombatSide
  factionId?: FactionId
  pilotId?: string
  pilotName?: string
  isPlayer?: boolean
  // Health
  currentHp: number
  maxHp: number
  // Operational State
  state: CombatGearState
  // Combat Attributes
  attack: number
  defense: number
  speed: number
  accuracy?: number
  evasion?: number
  // Retreat Tracker (rounds remaining in RETREATING before transitioning to RETREATED)
  retreatTurnsRemaining?: number
  // Temporary active modifiers
  temporaryModifiers?: CombatGearModifier[]
  // Derived round-boundary contribution flags
  isContributingOffense?: boolean
  isContributingDefense?: boolean
}

/**
 * Commander Strategy stance definition (data/config-driven, no arbitrary bonuses)
 */
export interface CommanderStrategyDefinition {
  id: string
  name: string
  description: string
  offensiveMultiplier: number
  defensiveMultiplier: number
  speedMultiplier?: number
  evasionBonus?: number
}

/**
 * Faction-level Commander Authority state
 * Invariant: Independent from player personal GEAR operational/destruction state
 */
export interface CommanderAuthorityState {
  factionId: string
  commanderName: string
  isPlayerCommander: boolean
  hasActiveAuthority: boolean
  currentStrategyId: string
  queuedStrategyId: string | null
  commandPoints?: number
}

/**
 * Force / Squad Morale state hook
 */
export interface CombatMoraleState {
  side: CombatSide
  currentMorale: number
  baselineMorale: number
  isPanicking?: boolean
}

/**
 * Support Entity class (Base, Station, Carrier, Fleet Support)
 */
export interface CombatSupportEntity {
  id: string
  name: string
  side: CombatSide
  type: "base" | "station" | "carrier" | "fleet_support" | "support_structure"
  currentHp?: number
  maxHp?: number
  hasPassiveBuff: boolean
  passiveDescription?: string
  activeSkillName?: string
  activeCooldownRemaining: number
  activeCooldownMax: number
  controlMode: "manual" | "auto"
}

/**
 * Battle-specific Encounter Snapshot (immutable input for Combat V2 simulation)
 */
export interface CombatV2EncounterSnapshot {
  encounterId: string
  transactionId: string
  sectorId: string
  combatVersion: "v2"
  createdAtTimestamp: number
  maxRounds: number
  objective: "eliminate_all_enemies" | "survive_rounds" | "defend_asset"
  targetSurviveRounds?: number
  // Dynamic Rosters
  alliedGears: CombatV2Gear[]
  enemyGears: CombatV2Gear[]
  // Commander Authorities
  alliedCommander: CommanderAuthorityState
  enemyCommander: CommanderAuthorityState
  // Morale Hooks
  alliedMorale: CombatMoraleState
  enemyMorale: CombatMoraleState
  // Support Entities
  alliedSupport?: CombatSupportEntity[]
  enemySupport?: CombatSupportEntity[]
  queuedSupportSkillId?: string | null
  // Environment Context
  environmentModifiers?: {
    terrainName?: string
    threatLevel?: number
    visibilityRatio?: number
  }
  // Random Seed for Deterministic Simulation
  seed?: number
}

/**
 * Detailed single action event in a round
 */
export interface CombatV2ActionEntry {
  actorGearId: string
  actorName: string
  actorSide: CombatSide
  targetGearId: string
  targetName: string
  targetSide: CombatSide
  damageDealt: number
  targetRemainingHp: number
  targetState: CombatGearState
  isCritical?: boolean
  description: string
}

/**
 * Round-by-round chronological combat log
 */
export interface CombatV2RoundLog {
  round: number
  actions: CombatV2ActionEntry[]
  retreatEvents: Array<{
    gearId: string
    gearName: string
    fromState: CombatGearState
    toState: CombatGearState
    message: string
  }>
  destructionEvents: Array<{
    gearId: string
    gearName: string
    pilotId?: string
    pilotName?: string
    message: string
  }>
  strategyChanges: Array<{
    factionId: string
    previousStrategyId: string
    newStrategyId: string
  }>
  supportEvents?: Array<{
    entityId: string
    entityName: string
    skillId: string
    skillName: string
    mode: "auto" | "manual"
    message: string
  }>
  moraleEvents?: Array<{
    side: CombatSide
    moraleDelta: number
    newMorale: number
    message: string
  }>
  alliedHpRemaining: number
  enemyHpRemaining: number
  summary: string
}

/**
 * Derived Aggregate Force Data for a side at any point in battle
 */
export interface CombatV2ForceAggregate {
  side: CombatSide
  totalCount: number
  activeCount: number
  retreatingCount: number
  retreatedCount: number
  destroyedCount: number
  totalCurrentHp: number
  totalMaxHp: number
  hpPercent: number
  effectiveOffensivePower: number
  effectiveDefensivePower: number
  morale: number
  hasViableCombatants: boolean
}

/**
 * Candidate record for Downed Pilot Survival evaluation (handed to Phase 6.34)
 */
export interface DownedPilotCandidate {
  gearId: string
  gearName: string
  pilotId?: string
  pilotName?: string
  side: CombatSide
  isPlayer: boolean
  destructionRound: number
}

/**
 * Structured final Combat V2 Result
 */
export interface CombatV2Result {
  encounterId: string
  transactionId: string
  sectorId: string
  combatVersion: "v2"
  completedAtTimestamp: number
  completedRounds: number
  outcome: "allied_victory" | "enemy_victory" | "stalemate" | "allied_retreated" | "enemy_retreated"
  victory: boolean
  alliedAggregate: CombatV2ForceAggregate
  enemyAggregate: CombatV2ForceAggregate
  survivingActiveGears: CombatV2Gear[]
  retreatedGears: CombatV2Gear[]
  destroyedGears: CombatV2Gear[]
  alliedCommander: CommanderAuthorityState
  enemyCommander: CommanderAuthorityState
  roundLogs: CombatV2RoundLog[]
  downedPilotCandidates: DownedPilotCandidate[]
  pilotSurvivalRecords?: PilotSurvivalRecord[]
}

/**
 * Derived Battlefield View-Model exposed for future Phase 6.33 UI
 */
export interface CombatV2BattlefieldViewModel {
  round: number
  maxRounds: number
  isConcluded: boolean
  outcome?: string
  victory?: boolean
  alliedForce: CombatV2ForceAggregate
  enemyForce: CombatV2ForceAggregate
  alliedGears: Array<CombatV2Gear & { hpPercent: number; isPlayerCommander: boolean }>
  enemyGears: Array<CombatV2Gear & { hpPercent: number }>
  commanderStrategy: {
    hasAuthority: boolean
    currentStrategyId: string
    queuedStrategyId: string | null
    availableStrategies: CommanderStrategyDefinition[]
  }
  supportEntities?: CombatSupportEntity[]
  queuedSupportSkillId?: string | null
  recentLogs: CombatV2RoundLog[]
}

/**
 * Centralized Combat V2 Configuration Parameters
 */
export interface CombatV2Config {
  /** APPROVED DESIGN DEFAULT: Rounds a unit spends in RETREATING before RETREATED */
  defaultRetreatDurationRounds: number
  /** TECHNICAL SAFETY DEFAULT: Engine loop guard to prevent infinite simulation, NOT a canonical gameplay rule */
  maxCombatRounds: number
  /** TEMPORARY TECHNICAL DEFAULT: Neutral placeholder (1.0 = 100% suppression); exact balance unresolved */
  retreatOffenseReductionRatio: number
  /** TEMPORARY TECHNICAL DEFAULT: Neutral placeholder (1.0 = 100% retention); exact balance unresolved */
  retreatDefenseRetentionRatio: number
  /** UNRESOLVED CONFIG DEFAULT: Temporary baseline morale rating; not approved gameplay balance */
  defaultMoraleValue: number
  /** CONCEPTUAL EXAMPLE: Conceptual threshold for panic evaluation; not approved gameplay balance */
  moraleThresholdPanic: number
  /** TEMPORARY TECHNICAL DEFAULT: NPC retreat HP ratio threshold (0.25 = 25% max HP) */
  npcRetreatHpRatioThreshold?: number
}
