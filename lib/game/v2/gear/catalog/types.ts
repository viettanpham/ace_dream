/**
 * STARFRONT WORLD V2 — GEAR V2 P2 Catalog Contracts & Types
 *
 * Implements FND-1 C1–C4 & OD-04 contracts in strict isolation from GEAR V1 and FND-8.6.
 */

import type { CatalogItemLifecycle } from "../../../world/catalog/types"
import type {
  GearV2ClassId,
  GearV2EngineVariant,
  GearV2MissionReadinessResult,
  GearV2PhysicalSlotId,
  GearV2SlotGroupId,
  GearV2ValidationMode,
  GearV2WeightConfig,
  GearV2WeightValidationResult,
} from "../types"

export type GearV2CatalogApprovalStatus = "REVIEW" | "APPROVED"

export type GearV2CatalogLifecycle = CatalogItemLifecycle

export type GearV2BaseStatKey =
  | "HP"
  | "SHD"
  | "ARM"
  | "ATK"
  | "MOB"
  | "ACC"
  | "ENG"
  | "SEN"
  | "SUP"

export const GEAR_V2_BASE_STAT_KEYS: readonly GearV2BaseStatKey[] = [
  "HP",
  "SHD",
  "ARM",
  "ATK",
  "MOB",
  "ACC",
  "ENG",
  "SEN",
  "SUP",
] as const

export const GEAR_V2_REQUIRED_ARMOR_BONUS_TOTAL = 10

export type GearV2CatalogName =
  | "equipment"
  | "engineprofile"
  | "category"
  | "compatibility"
  | "classprofile"
  | "statregistry"
  | "manifest"

export type GearV2SourceCatalogName = Exclude<GearV2CatalogName, "manifest">

export type GearV2ReadMode = "REVIEW_STAGING" | "PRODUCTION_APPROVED"

export interface GearV2CatalogItemBase {
  id: string
  lifecycle: GearV2CatalogLifecycle
  approvalStatus: GearV2CatalogApprovalStatus
  sourceDocRef: string
  editorialProvenance?: string
}

export interface GearV2ArmorEquipmentItem extends GearV2CatalogItemBase {
  gearClassId: GearV2ClassId
  categoryId: "gearv2.cat.armor"
  displayName: string
  armorVariantId: string
  primaryBonuses: Partial<Record<GearV2BaseStatKey, number>>
  secondaryBonuses: Partial<Record<GearV2BaseStatKey, number>>
  weightGrams: number
  maxPerLoadout: number
  uniquenessGroupId: string
}

export interface GearV2EngineEquipmentItem extends GearV2CatalogItemBase {
  gearClassId: GearV2ClassId
  categoryId: "gearv2.cat.engine"
  displayName: string
  engineVariantId: GearV2EngineVariant
  engineProfileId: string
  weightGrams: number
  maxPerLoadout: number
  uniquenessGroupId: string
}

export type GearV2EquipmentItem =
  | GearV2ArmorEquipmentItem
  | GearV2EngineEquipmentItem

export interface GearV2EngineProfileItem extends GearV2CatalogItemBase {
  gearClassId: GearV2ClassId
  variantId: GearV2EngineVariant
  minSpeedMps: number
  maxSpeedMps: number
  boostSpeedMps: number
  boostTimeCentiseconds: number
  boostRecoveryCentiseconds: number
  normalTurnDegPerSec: number
  boostTurnDegPerSec: number
  turnResponseCentiseconds: number
}

export interface GearV2CategoryItem extends GearV2CatalogItemBase {
  slotGroupId: GearV2SlotGroupId
  displayName: string
  allowedSlotIds: GearV2PhysicalSlotId[]
  maxSlots: number
  p2Seeded: boolean
}

export interface GearV2CompatibilityRuleItem extends GearV2CatalogItemBase {
  equipmentId: string
  gearClassId: GearV2ClassId
  slotId: GearV2PhysicalSlotId
  decision: "ALLOW"
}

export interface GearV2ClassProfileItem extends GearV2CatalogItemBase {
  gearClassId: GearV2ClassId
  classCode: "A" | "B" | "I" | "M" | "R" | "G"
  displayName: string
  totalPhysicalSlots: number
  maxAuxiliarySlots: number
  sharedBaseLoadGrams: number
  classLoadBonusGrams: number
  combatBaseStats: null
  combatBaseStatsStatus: "UNAPPROVED_DEFERRED"
}

export interface GearV2StatRegistryItem extends GearV2CatalogItemBase {
  statCode: string
  scope: "GEAR_BASE" | "ENGINE_FLIGHT"
  profileField?: string | null
  displayName: string
  unit: string
  displayUnit?: string
  storageScale: number
  isDerived: boolean
  derivedFrom: string | null
}

export interface GearV2ManifestEntryItem extends GearV2CatalogItemBase {
  catalogName: GearV2SourceCatalogName
  configFileId: string
  filename: string
  physicalPath: string
  schemaVersion: number
  dataVersion: number
  rawItemCount: number
  approvedItemCount: number
  reviewItemCount: number
  byteLength: number
  sha256: string
}

export interface GearV2CatalogRegistrationSpec {
  domain: "gearv2"
  catalogName: GearV2CatalogName
  configFileId: string
  rootFilename: string
  physicalPath: string
  providerKey: string
  schemaVersion: number
  isManifest: boolean
}

export type GearV2CatalogValidationErrorCode =
  | "MISSING_CATALOG_FILE"
  | "INVALID_JSON"
  | "INVALID_ENVELOPE"
  | "FILENAME_CONFIG_ID_MISMATCH"
  | "MANIFEST_INVALID_STRUCTURE"
  | "MANIFEST_MISSING_ENTRY"
  | "MANIFEST_EXTRA_ENTRY"
  | "MANIFEST_BYTE_LENGTH_MISMATCH"
  | "MANIFEST_ITEM_COUNT_MISMATCH"
  | "MANIFEST_HASH_MISMATCH"
  | "INVALID_ITEM_ID"
  | "DUPLICATE_ITEM_ID"
  | "FORBIDDEN_PROVENANCE_FIELD"
  | "MISSING_SOURCE_DOC_REF"
  | "INVALID_LIFECYCLE"
  | "INVALID_APPROVAL_STATUS"
  | "FORBIDDEN_STRAFE_SPEED"
  | "INVALID_STAT_REGISTRY"
  | "INVALID_CATEGORY"
  | "INVALID_CLASS_PROFILE"
  | "UNAPPROVED_FABRICATED_CLASS_STATS"
  | "INVALID_ENGINE_PROFILE"
  | "FORBIDDEN_PERSISTED_ENGINE_WEIGHT"
  | "INVALID_EQUIPMENT"
  | "INVALID_ARMOR_ALLOCATION"
  | "ORPHAN_ENGINE_PROFILE_REF"
  | "ORPHAN_CATEGORY_REF"
  | "ORPHAN_CLASS_REF"
  | "ORPHAN_EQUIPMENT_REF"
  | "INVALID_COMPATIBILITY_RULE"

export interface GearV2CatalogValidationIssue {
  code: GearV2CatalogValidationErrorCode
  message: string
  catalogName?: GearV2CatalogName
  filename?: string
  itemId?: string
  field?: string
}

export interface GearV2ManifestVerificationItem {
  catalogName: GearV2SourceCatalogName
  filename: string
  configFileId: string
  expectedSha256: string
  actualSha256: string
  expectedByteLength: number
  actualByteLength: number
  expectedRawItemCount: number
  actualRawItemCount: number
  verified: boolean
}

export interface GearV2CatalogSnapshot {
  valid: boolean
  readMode: GearV2ReadMode
  publicationStatus: string
  manifestVerified: boolean
  rawCounts: Record<GearV2CatalogName, number>
  approvedCounts: Record<GearV2CatalogName, number>
  reviewCounts: Record<GearV2CatalogName, number>
  manifestVerifications: GearV2ManifestVerificationItem[]
  errors: GearV2CatalogValidationIssue[]
  equipment: GearV2EquipmentItem[]
  engineProfiles: GearV2EngineProfileItem[]
  categories: GearV2CategoryItem[]
  compatibilityRules: GearV2CompatibilityRuleItem[]
  classProfiles: GearV2ClassProfileItem[]
  statRegistry: GearV2StatRegistryItem[]
  manifestEntries: GearV2ManifestEntryItem[]
  equipmentMap: ReadonlyMap<string, GearV2EquipmentItem>
  engineProfileMap: ReadonlyMap<string, GearV2EngineProfileItem>
  categoryMap: ReadonlyMap<string, GearV2CategoryItem>
  classProfileMap: ReadonlyMap<GearV2ClassId, GearV2ClassProfileItem>
  statRegistryMap: ReadonlyMap<string, GearV2StatRegistryItem>
}

export interface GearV2CompatibilityCheckInput {
  equipmentId: string
  gearClassId: GearV2ClassId | string
  slotId: GearV2PhysicalSlotId | string
  requireActiveForNewEquip?: boolean
}

export type GearV2CompatibilityDenyReason =
  | "SNAPSHOT_INVALID"
  | "UNKNOWN_EQUIPMENT"
  | "LIFECYCLE_NOT_SELECTABLE"
  | "NOT_APPROVED_FOR_RUNTIME"
  | "UNKNOWN_GEAR_CLASS"
  | "UNKNOWN_SLOT"
  | "DEFAULT_DENY_NO_ALLOW_RULE"

export interface GearV2CompatibilityEvaluationResult {
  allowed: boolean
  decision: "ALLOW" | "DENY"
  matchedRuleId: string | null
  denyReason: GearV2CompatibilityDenyReason | null
  message: string
}

export interface GearV2EngineResolvedView {
  equipmentId: string
  engineProfileId: string
  gearClassId: GearV2ClassId
  variantId: GearV2EngineVariant
  displayName: string
  minSpeedMps: number
  maxSpeedMps: number
  boostSpeedMps: number
  boostTimeCentiseconds: number
  boostRecoveryCentiseconds: number
  normalTurnDegPerSec: number
  boostTurnDegPerSec: number
  turnResponseCentiseconds: number
  boostTimeSeconds: number
  boostRecoverySeconds: number
  turnResponseSeconds: number
  /** Derived exclusively from Equipment.weightGrams (conceptual 9th attribute ENGINE_WEIGHT) */
  derivedEngineWeightGrams: number
  approvalStatus: GearV2CatalogApprovalStatus
  lifecycle: GearV2CatalogLifecycle
}

export interface GearV2LoadoutCatalogValidationInput {
  gearClass: GearV2ClassId | string
  engineVariant: GearV2EngineVariant | string
  slots?: Partial<Record<GearV2PhysicalSlotId, { equipmentId: string; instanceId?: string } | null>>
  entries?: ReadonlyArray<{ slotId: string; equipmentId: string; instanceId?: string }>
  mode?: GearV2ValidationMode | "DRAFT" | "CONFIRM"
  weightConfig?: GearV2WeightConfig
}

export interface GearV2LoadoutCatalogCheckResult {
  compatibilityValid: boolean
  compatibilityIssues: Array<{
    code: string
    message: string
    slotId: string
    equipmentId: string
  }>
  p1ConfirmResult?: GearV2WeightValidationResult
  p1ReadinessResult?: GearV2MissionReadinessResult
}
