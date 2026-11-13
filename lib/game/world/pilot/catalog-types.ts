/**
 * STARFRONT WORLD V2 — FND-1 Pilot Class, Pilot Trait & GEAR Compatibility Catalog Contracts
 *
 * Phase 1 (FND8): Establishes Type -> Class -> Definition contracts separate from
 * individual Pilot Instance UUIDs and separate from CDN R4 presentation metadata.
 *
 * IMPORTANT BOUNDARIES:
 * - Proposed 20-point base attribute allocations MUST stay marked `PROPOSED_UNLOCKED`
 *   until explicitly Canon-locked. `baseAttributes` stays `null` until locked.
 * - Non-CANON_LOCKED Trait candidate numbers (D1 / D2 / D3 / UNSET) MUST NEVER populate
 *   the runtime-executable `value` field (`value` stays `null`).
 * - Never use `"Active"` as a Trait category or execution mode.
 */

import type { CatalogItemLifecycle } from "../catalog/types"

export interface PilotBaseAttributes {
  atk: number
  def: number
  agi: number
  ene: number
  shd: number
  luk: number
}

export type BaseAttributesApprovalStatus = "PROPOSED_UNLOCKED" | "CANON_LOCKED"

export type PilotRoleCategory = "all" | "attack" | "defense" | "support" | "special"

export type PilotPersonaGender = "MALE" | "FEMALE"

/**
 * Class Persona Definition (12 canonical Pilot Classes: C01-C12)
 */
export interface PilotClassDefinition {
  /** Canonical FND-1 Catalog ID (e.g. "PILOT_CLASS_C01") */
  id: string
  /** Explicit Class Persona identifier matching Type -> Class -> Definition */
  characterClassId: string
  /** Editorial persona ordering code ("C01" .. "C12") */
  personaCode: string
  /** Stable CDN/UI Pilot key ("alviss" .. "nova"); unchanged CDN semantics */
  pilotId: string
  /** Class archetype name (distinct from any individual Pilot Instance characterName) */
  classCharacterName: string
  gender: PilotPersonaGender
  roleCategory: PilotRoleCategory
  /** Canon-locked combat base attributes; MUST remain null while PROPOSED_UNLOCKED */
  baseAttributes: PilotBaseAttributes | null
  /** Audit-preserved 20-point proposed matrix (non-executable until CANON_LOCKED) */
  proposedBaseAttributes: PilotBaseAttributes
  baseAttributesApproval: BaseAttributesApprovalStatus
  /** Modular references into `system_pilot_trait_data.json` */
  traitDefinitionIds: string[]
  /** Reserved reference to `system_gear_compatibility_data.json` (null until FND8.6) */
  gearCompatibilityRef: string | null
  sourceDocRef: string
  lifecycle: CatalogItemLifecycle
}

/**
 * Canonical Trait Classifications (NEVER use "Active")
 */
export type TraitLoreClassification = "PASSIVE" | "CONDITIONAL" | "SIGNATURE"

export type TraitExecutionMode = "PASSIVE" | "CONDITIONAL"

export type TraitIdentityApprovalStatus = "APPROVED" | "DRAFT" | "DEPRECATED"

export type TraitValueApprovalStatus =
  | "D1_PROTOTYPE"
  | "D2_TEST_DEFAULT"
  | "D3_PROPOSED_UNDER_REVIEW"
  | "UNSET"
  | "CANON_LOCKED"

export type TraitOperationType =
  | "ADD_PERCENTAGE_POINTS"
  | "ADD_CHANNEL_MODIFIER"
  | "REDUCE_COST_PCT"

export type TraitCandidateValueUnit =
  | "PERCENTAGE_POINTS"
  | "RELATIVE_PCT"
  | "COST_REDUCTION_PCT"
  | null

export type CombatV2SupportStatus =
  | "DEFERRED_MISSING_COMBAT_CONTRACT"
  | "SUPPORTED"

/**
 * Modular SYSTEM Pilot Trait Definition (26 entries across C01-C12)
 */
export interface PilotTraitDefinition {
  /** Canonical FND-1 Catalog ID (e.g. "pilot_trait_field_medic") */
  id: string
  traitId: string
  name: string
  ownerClassId: string
  ownerPilotId: string
  loreClassification: TraitLoreClassification
  executionMode: TraitExecutionMode
  identityApprovalStatus: TraitIdentityApprovalStatus
  effectTarget: string
  operation: TraitOperationType
  /**
   * Runtime-consumable numeric modifier.
   * MUST remain `null` unless `valueApprovalStatus === "CANON_LOCKED"`.
   */
  value: number | null
  valueApprovalStatus: TraitValueApprovalStatus
  /** Non-executable candidate metadata (D1 / D2 / D3 proposals or null for UNSET) */
  candidateValue: number | null
  candidateValueUnit: TraitCandidateValueUnit
  candidateValueSource: string
  /** Safety flag preventing unapproved modifiers from entering Combat V2 */
  isExecutableModifier: boolean
  requiredPredicate: string
  combatV2SupportStatus: CombatV2SupportStatus
  triggerDescription: string
  sourceDocRef: string
  lifecycle: CatalogItemLifecycle
}

/**
 * Placeholder entry type for GEAR Compatibility Catalog (empty pending FND8.6)
 */
export interface GearCompatibilityDefinition {
  id: string
  characterClassId: string
  gearId: string
  compatibilityStatus: "PENDING_FND8_6_GEAR_CATALOG"
  lifecycle: CatalogItemLifecycle
}

/**
 * Contract separating Class Persona identity from individual Pilot Instance UUID
 * and CDN R4 presentation key (`pilotId`).
 */
export interface PilotInstanceIdentityContract {
  /** Unique per player/NPC Pilot Instance UUID */
  pilotInstanceId: string
  /** Foreign key referencing PilotClassDefinition.characterClassId */
  characterClassId: string
  /** Optional CDN presentation key (`pilotId`) — semantics unchanged */
  cdnPilotKey?: string
  /** Individual instance callname (distinct from Class Persona `classCharacterName`) */
  instanceCharacterName: string
}
