/**
 * STARFRONT WORLD V2 — GEAR V2 P2 Fail-Closed Catalog Validator, Snapshot Loader & P1 Bridge
 *
 * Enforces:
 * - FND-1 C1 (non-empty unique deterministic IDs)
 * - FND-1 C2 (forbids raw JSON `"provenance"` key collision; requires `sourceDocRef`)
 * - FND-1 C3 (strict `lifecycle` vs `approvalStatus` separation; never promotes REVIEW -> APPROVED)
 * - FND-1 C4 (explicit filename / configFileId / physicalPath registration verification)
 * - OD-04 (integer speeds m/s, integer turns deg/s, centiseconds time with storageScale 100, derived ENGINE_WEIGHT, zero STRAFE_SPEED)
 * - Non-self-referential SHA-256 manifest verification on exact raw bytes BEFORE approval filtering
 * - Strict cross-catalog referential integrity and P1 Weight / OD-07 bridge
 */

import { parseConfigFileId } from "../../../world/catalog/file-naming"
import { canSelectForNewInstance } from "../../../world/catalog/lifecycle"
import type { ICatalogDataProvider } from "../../../world/catalog/types"
import { validateLoadoutReadiness } from "../mission-readiness"
import {
  GEAR_V2_PHYSICAL_SLOT_MAP,
  GEAR_V2_SLOT_GROUP_MAP,
  isGearV2PhysicalSlotId,
} from "../slots"
import type {
  GearV2ClassId,
  GearV2EngineVariant,
  GearV2EquippedItem,
  GearV2ExternalCompatibilityInput,
  GearV2PhysicalSlotId,
  GearV2WeightCalculationInput,
} from "../types"
import {
  DEFAULT_GEAR_V2_WEIGHT_CONFIG,
  GEAR_V2_CLASS_IDS,
  GEAR_V2_ENGINE_VARIANTS,
  normalizeGearV2ClassId,
  normalizeGearV2EngineVariant,
} from "../weight-config"
import { validateConfirmLoadoutWeight } from "../weight-engine"
import { sha256Utf8Hex, utf8ByteLength } from "./hash"
import {
  GEAR_V2_CATALOG_NAMES,
  GEAR_V2_CATALOG_REGISTRATION_MAP,
  GEAR_V2_CATALOG_REGISTRATIONS,
  GEAR_V2_SOURCE_CATALOG_NAMES,
} from "./registration"
import {
  GEAR_V2_BASE_STAT_KEYS,
  GEAR_V2_REQUIRED_ARMOR_BONUS_TOTAL,
  type GearV2ArmorEquipmentItem,
  type GearV2BaseStatKey,
  type GearV2CatalogApprovalStatus,
  type GearV2CatalogLifecycle,
  type GearV2CatalogName,
  type GearV2CatalogSnapshot,
  type GearV2CatalogValidationIssue,
  type GearV2CategoryItem,
  type GearV2ClassProfileItem,
  type GearV2CompatibilityCheckInput,
  type GearV2CompatibilityEvaluationResult,
  type GearV2CompatibilityRuleItem,
  type GearV2EngineEquipmentItem,
  type GearV2EngineProfileItem,
  type GearV2EngineResolvedView,
  type GearV2EquipmentItem,
  type GearV2LoadoutCatalogCheckResult,
  type GearV2LoadoutCatalogValidationInput,
  type GearV2ManifestEntryItem,
  type GearV2ManifestVerificationItem,
  type GearV2ReadMode,
  type GearV2SourceCatalogName,
  type GearV2StatRegistryItem,
} from "./types"

const VALID_LIFECYCLES = new Set<GearV2CatalogLifecycle>([
  "ACTIVE",
  "DEPRECATED",
  "RETIRED",
])

const VALID_APPROVAL_STATUSES = new Set<GearV2CatalogApprovalStatus>([
  "REVIEW",
  "APPROVED",
])

const CLASS_ID_SET = new Set<string>(GEAR_V2_CLASS_IDS)
const ENGINE_VARIANT_SET = new Set<string>(GEAR_V2_ENGINE_VARIANTS)
const BASE_STAT_SET = new Set<string>(GEAR_V2_BASE_STAT_KEYS)

const FORBIDDEN_STRAFE_KEYS = new Set<string>([
  "strafespeed",
  "strafespeedmps",
  "strafe",
  "strafe_speed",
  "strafe_speed_mps",
])

function createZeroCounts(): Record<GearV2CatalogName, number> {
  return {
    equipment: 0,
    engineprofile: 0,
    category: 0,
    compatibility: 0,
    classprofile: 0,
    statregistry: 0,
    manifest: 0,
  }
}

function makeEmptyFailedSnapshot(
  readMode: GearV2ReadMode,
  publicationStatus: string,
  rawCounts: Record<GearV2CatalogName, number>,
  approvedCounts: Record<GearV2CatalogName, number>,
  reviewCounts: Record<GearV2CatalogName, number>,
  manifestVerifications: GearV2ManifestVerificationItem[],
  manifestVerified: boolean,
  errors: GearV2CatalogValidationIssue[]
): GearV2CatalogSnapshot {
  return {
    valid: false,
    readMode,
    publicationStatus,
    manifestVerified,
    rawCounts,
    approvedCounts,
    reviewCounts,
    manifestVerifications,
    errors,
    equipment: [],
    engineProfiles: [],
    categories: [],
    compatibilityRules: [],
    classProfiles: [],
    statRegistry: [],
    manifestEntries: [],
    equipmentMap: new Map(),
    engineProfileMap: new Map(),
    categoryMap: new Map(),
    classProfileMap: new Map(),
    statRegistryMap: new Map(),
  }
}

function hasForbiddenStrafeReference(obj: Record<string, unknown>): boolean {
  for (const [k, v] of Object.entries(obj)) {
    if (FORBIDDEN_STRAFE_KEYS.has(k.trim().toLowerCase())) {
      return true
    }
    if (
      typeof v === "string" &&
      v.trim().toUpperCase() === "STRAFE_SPEED"
    ) {
      return true
    }
  }
  return false
}

export interface LoadGearV2SnapshotInput {
  mode?: GearV2ReadMode
  provider?: ICatalogDataProvider
  rawFiles?: Readonly<Record<string, string>>
  hasher?: (rawUtf8: string) => string
}

/**
 * Validates raw bytes, SHA-256 manifest, C1–C4 contracts, OD-04 rules, and
 * cross-catalog referential integrity BEFORE applying approvalStatus filtering.
 * Fails closed on any integrity violation.
 */
export function loadGearV2CatalogSnapshot(
  input: LoadGearV2SnapshotInput
): GearV2CatalogSnapshot {
  const readMode: GearV2ReadMode = input.mode ?? "REVIEW_STAGING"
  const hashFn = input.hasher ?? sha256Utf8Hex
  const errors: GearV2CatalogValidationIssue[] = []
  const rawCounts = createZeroCounts()
  const approvedCounts = createZeroCounts()
  const reviewCounts = createZeroCounts()
  const manifestVerifications: GearV2ManifestVerificationItem[] = []

  const readRawFile = (filename: string): string | null => {
    if (input.rawFiles) {
      return Object.prototype.hasOwnProperty.call(input.rawFiles, filename)
        ? input.rawFiles[filename]
        : null
    }
    if (input.provider) {
      return input.provider.readFile(filename)
    }
    return null
  }

  const rawTexts: Partial<Record<GearV2CatalogName, string>> = {}
  const parsedFiles: Partial<Record<GearV2CatalogName, any>> = {}

  // Step 1: Read raw UTF-8 files & validate C4 envelope/filename consistency
  for (const reg of GEAR_V2_CATALOG_REGISTRATIONS) {
    const raw = readRawFile(reg.rootFilename)
    if (raw === null || raw === undefined) {
      errors.push({
        code: "MISSING_CATALOG_FILE",
        message: `Missing required catalog file '${reg.rootFilename}'.`,
        catalogName: reg.catalogName,
        filename: reg.rootFilename,
      })
      continue
    }

    rawTexts[reg.catalogName] = raw

    const parsedName = parseConfigFileId(reg.rootFilename)
    if (
      !parsedName ||
      parsedName.type !== "system" ||
      parsedName.domain !== "gearv2" ||
      parsedName.catalogName !== reg.catalogName ||
      parsedName.suffix !== undefined
    ) {
      errors.push({
        code: "FILENAME_CONFIG_ID_MISMATCH",
        message: `Filename '${reg.rootFilename}' violates FND-1 naming pattern for domain 'gearv2'.`,
        catalogName: reg.catalogName,
        filename: reg.rootFilename,
      })
    }

    let parsed: any
    try {
      parsed = JSON.parse(raw)
    } catch (err: any) {
      errors.push({
        code: "INVALID_JSON",
        message: `Malformed JSON in '${reg.rootFilename}': ${err?.message || "parse failed"}.`,
        catalogName: reg.catalogName,
        filename: reg.rootFilename,
      })
      continue
    }

    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.configFileId !== reg.configFileId ||
      parsed.schemaVersion !== reg.schemaVersion ||
      parsed.mode !== "INLINE" ||
      !Array.isArray(parsed.items)
    ) {
      errors.push({
        code: "INVALID_ENVELOPE",
        message: `Invalid FND-1 CatalogNodeFile envelope in '${reg.rootFilename}' (expected configFileId '${reg.configFileId}', schemaVersion ${reg.schemaVersion}, mode INLINE, array items).`,
        catalogName: reg.catalogName,
        filename: reg.rootFilename,
      })
      continue
    }

    parsedFiles[reg.catalogName] = parsed
    rawCounts[reg.catalogName] = parsed.items.length
  }

  const manifestDoc = parsedFiles.manifest
  const publicationStatus =
    typeof manifestDoc?.metadata?.publicationStatus === "string"
      ? manifestDoc.metadata.publicationStatus
      : "UNKNOWN"

  // Step 2: Validate raw C1/C2/C3 item contracts across ALL loaded files (BEFORE approval filtering)
  for (const catalogName of GEAR_V2_CATALOG_NAMES) {
    const fileDoc = parsedFiles[catalogName]
    if (!fileDoc) continue
    const reg = GEAR_V2_CATALOG_REGISTRATION_MAP.get(catalogName)!
    const seenIds = new Set<string>()

    for (let i = 0; i < fileDoc.items.length; i++) {
      const item = fileDoc.items[i]
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        errors.push({
          code: "INVALID_ITEM_ID",
          message: `Item at index ${i} in '${reg.rootFilename}' must be an object.`,
          catalogName,
          filename: reg.rootFilename,
        })
        continue
      }

      // C1: Non-empty deterministic unique ID
      if (typeof item.id !== "string" || item.id.trim() === "") {
        errors.push({
          code: "INVALID_ITEM_ID",
          message: `Item at index ${i} in '${reg.rootFilename}' is missing a valid non-empty string 'id'.`,
          catalogName,
          filename: reg.rootFilename,
          field: "id",
        })
      } else {
        const cleanId = item.id.trim()
        if (cleanId !== item.id) {
          errors.push({
            code: "INVALID_ITEM_ID",
            message: `Item id '${item.id}' in '${reg.rootFilename}' contains leading/trailing whitespace.`,
            catalogName,
            filename: reg.rootFilename,
            itemId: item.id,
            field: "id",
          })
        } else if (seenIds.has(cleanId)) {
          errors.push({
            code: "DUPLICATE_ITEM_ID",
            message: `Duplicate id '${cleanId}' in '${reg.rootFilename}'.`,
            catalogName,
            filename: reg.rootFilename,
            itemId: cleanId,
            field: "id",
          })
        } else {
          seenIds.add(cleanId)
        }
      }

      // C2: Forbid raw `"provenance"` key collision with FND-1 loader; require `sourceDocRef`
      if (Object.prototype.hasOwnProperty.call(item, "provenance")) {
        errors.push({
          code: "FORBIDDEN_PROVENANCE_FIELD",
          message: `Item '${String(item.id)}' in '${reg.rootFilename}' uses forbidden field name 'provenance' (collides with FND-1 CatalogProvenance); use 'sourceDocRef' or 'editorialProvenance'.`,
          catalogName,
          filename: reg.rootFilename,
          itemId: typeof item.id === "string" ? item.id : undefined,
          field: "provenance",
        })
      }
      if (typeof item.sourceDocRef !== "string" || item.sourceDocRef.trim() === "") {
        errors.push({
          code: "MISSING_SOURCE_DOC_REF",
          message: `Item '${String(item.id)}' in '${reg.rootFilename}' must provide non-empty 'sourceDocRef'.`,
          catalogName,
          filename: reg.rootFilename,
          itemId: typeof item.id === "string" ? item.id : undefined,
          field: "sourceDocRef",
        })
      }

      // C3: Lifecycle vs approvalStatus separation
      if (!VALID_LIFECYCLES.has(item.lifecycle)) {
        errors.push({
          code: "INVALID_LIFECYCLE",
          message: `Item '${String(item.id)}' in '${reg.rootFilename}' has invalid lifecycle '${String(item.lifecycle)}'.`,
          catalogName,
          filename: reg.rootFilename,
          itemId: typeof item.id === "string" ? item.id : undefined,
          field: "lifecycle",
        })
      }
      if (!VALID_APPROVAL_STATUSES.has(item.approvalStatus)) {
        errors.push({
          code: "INVALID_APPROVAL_STATUS",
          message: `Item '${String(item.id)}' in '${reg.rootFilename}' has invalid approvalStatus '${String(item.approvalStatus)}' (must be REVIEW or APPROVED).`,
          catalogName,
          filename: reg.rootFilename,
          itemId: typeof item.id === "string" ? item.id : undefined,
          field: "approvalStatus",
        })
      } else {
        if (item.approvalStatus === "APPROVED") {
          approvedCounts[catalogName] += 1
        } else {
          reviewCounts[catalogName] += 1
        }
      }
    }
  }

  // Step 3: Non-self-referential Manifest SHA-256 & raw itemCount verification
  let manifestVerified = false
  if (manifestDoc) {
    if (
      manifestDoc.metadata?.hashAlgorithm !== "SHA-256" ||
      manifestDoc.metadata?.hashScope !==
        "EXPLICIT_SOURCE_CATALOG_FILES_ONLY_NON_SELF_REFERENTIAL"
    ) {
      errors.push({
        code: "MANIFEST_INVALID_STRUCTURE",
        message:
          "Manifest metadata must declare hashAlgorithm='SHA-256' and hashScope='EXPLICIT_SOURCE_CATALOG_FILES_ONLY_NON_SELF_REFERENTIAL'.",
        catalogName: "manifest",
        filename: "system_gearv2_manifest_data.json",
      })
    }

    const manifestItems = manifestDoc.items as GearV2ManifestEntryItem[]
    const manifestByCatalog = new Map<string, GearV2ManifestEntryItem>()
    for (const m of manifestItems) {
      if (!m || typeof m !== "object" || typeof m.catalogName !== "string") {
        errors.push({
          code: "MANIFEST_INVALID_STRUCTURE",
          message: "Manifest contains malformed entry without catalogName.",
          catalogName: "manifest",
          filename: "system_gearv2_manifest_data.json",
          itemId: typeof m?.id === "string" ? m.id : undefined,
        })
        continue
      }
      if (
        !GEAR_V2_SOURCE_CATALOG_NAMES.includes(
          m.catalogName as GearV2SourceCatalogName
        )
      ) {
        errors.push({
          code: "MANIFEST_EXTRA_ENTRY",
          message: `Manifest entry '${m.catalogName}' is not a valid non-self-referential source catalog.`,
          catalogName: "manifest",
          filename: "system_gearv2_manifest_data.json",
          itemId: m.id,
        })
        continue
      }
      manifestByCatalog.set(m.catalogName, m)
    }

    let allSourceFilesVerified = manifestItems.length === GEAR_V2_SOURCE_CATALOG_NAMES.length
    for (const sourceName of GEAR_V2_SOURCE_CATALOG_NAMES) {
      const mEntry = manifestByCatalog.get(sourceName)
      const reg = GEAR_V2_CATALOG_REGISTRATION_MAP.get(sourceName)!
      if (!mEntry) {
        allSourceFilesVerified = false
        errors.push({
          code: "MANIFEST_MISSING_ENTRY",
          message: `Manifest is missing entry for source catalog '${sourceName}'.`,
          catalogName: "manifest",
          filename: "system_gearv2_manifest_data.json",
        })
        continue
      }

      const rawText = rawTexts[sourceName]
      const sourceDoc = parsedFiles[sourceName]
      if (rawText === undefined || !sourceDoc) {
        allSourceFilesVerified = false
        continue
      }

      const actualByteLength = utf8ByteLength(rawText)
      const actualSha256 = hashFn(rawText)
      const actualRawItemCount = Array.isArray(sourceDoc.items)
        ? sourceDoc.items.length
        : -1

      let entryOk = true
      if (
        mEntry.configFileId !== reg.configFileId ||
        mEntry.filename !== reg.rootFilename ||
        mEntry.physicalPath !== reg.physicalPath
      ) {
        entryOk = false
        errors.push({
          code: "MANIFEST_INVALID_STRUCTURE",
          message: `Manifest metadata for '${sourceName}' does not match C4 registration.`,
          catalogName: "manifest",
          filename: "system_gearv2_manifest_data.json",
          itemId: mEntry.id,
        })
      }

      if (mEntry.byteLength !== actualByteLength) {
        entryOk = false
        errors.push({
          code: "MANIFEST_BYTE_LENGTH_MISMATCH",
          message: `Byte length mismatch for '${reg.rootFilename}': manifest expects ${mEntry.byteLength}, actual is ${actualByteLength}.`,
          catalogName: sourceName,
          filename: reg.rootFilename,
          itemId: mEntry.id,
        })
      }

      if (mEntry.rawItemCount !== actualRawItemCount) {
        entryOk = false
        errors.push({
          code: "MANIFEST_ITEM_COUNT_MISMATCH",
          message: `Raw itemCount mismatch for '${reg.rootFilename}': manifest expects ${mEntry.rawItemCount}, actual is ${actualRawItemCount}.`,
          catalogName: sourceName,
          filename: reg.rootFilename,
          itemId: mEntry.id,
        })
      }

      if (
        typeof mEntry.sha256 !== "string" ||
        mEntry.sha256.toLowerCase() !== actualSha256.toLowerCase()
      ) {
        entryOk = false
        errors.push({
          code: "MANIFEST_HASH_MISMATCH",
          message: `SHA-256 mismatch for '${reg.rootFilename}': expected ${String(mEntry.sha256)}, actual ${actualSha256}.`,
          catalogName: sourceName,
          filename: reg.rootFilename,
          itemId: mEntry.id,
        })
      }

      if (
        mEntry.approvedItemCount !== approvedCounts[sourceName] ||
        mEntry.reviewItemCount !== reviewCounts[sourceName]
      ) {
        entryOk = false
        errors.push({
          code: "MANIFEST_ITEM_COUNT_MISMATCH",
          message: `Approval breakdown count mismatch for '${reg.rootFilename}' (approved=${approvedCounts[sourceName]}, review=${reviewCounts[sourceName]}).`,
          catalogName: sourceName,
          filename: reg.rootFilename,
          itemId: mEntry.id,
        })
      }

      if (!entryOk) {
        allSourceFilesVerified = false
      }

      manifestVerifications.push({
        catalogName: sourceName,
        filename: reg.rootFilename,
        configFileId: reg.configFileId,
        expectedSha256: String(mEntry.sha256 ?? ""),
        actualSha256,
        expectedByteLength: Number(mEntry.byteLength ?? -1),
        actualByteLength,
        expectedRawItemCount: Number(mEntry.rawItemCount ?? -1),
        actualRawItemCount,
        verified: entryOk,
      })
    }

    manifestVerified =
      allSourceFilesVerified &&
      !errors.some(
        (e) =>
          e.catalogName === "manifest" ||
          e.code.startsWith("MANIFEST_")
      )
  }

  // Step 4: Domain Schemas, OD-04 & Cross-Catalog Referential Integrity
  const statItems: GearV2StatRegistryItem[] = parsedFiles.statregistry?.items ?? []
  const categoryItems: GearV2CategoryItem[] = parsedFiles.category?.items ?? []
  const classItems: GearV2ClassProfileItem[] = parsedFiles.classprofile?.items ?? []
  const engineProfileItems: GearV2EngineProfileItem[] =
    parsedFiles.engineprofile?.items ?? []
  const equipmentItems: GearV2EquipmentItem[] = parsedFiles.equipment?.items ?? []
  const compatItems: GearV2CompatibilityRuleItem[] =
    parsedFiles.compatibility?.items ?? []
  const rawManifestEntries: GearV2ManifestEntryItem[] =
    parsedFiles.manifest?.items ?? []

  // 4a. Validate StatRegistry (9 GEAR_BASE + 9 ENGINE_FLIGHT, storageScale=100 for centiseconds, derived ENGINE_WEIGHT, NO STRAFE_SPEED)
  const rawStatMap = new Map<string, GearV2StatRegistryItem>()
  if (parsedFiles.statregistry) {
    const foundBaseCodes = new Set<string>()
    const foundEngineCodes = new Set<string>()

    for (const st of statItems) {
      if (!st || typeof st !== "object") continue
      if (hasForbiddenStrafeReference(st as unknown as Record<string, unknown>)) {
        errors.push({
          code: "FORBIDDEN_STRAFE_SPEED",
          message: `StatRegistry item '${st.id}' contains forbidden STRAFE_SPEED.`,
          catalogName: "statregistry",
          itemId: st.id,
        })
        continue
      }
      if (typeof st.id === "string") {
        rawStatMap.set(st.id, st)
      }
      if (st.scope === "GEAR_BASE") {
        foundBaseCodes.add(st.statCode)
        if (!BASE_STAT_SET.has(st.statCode) || st.storageScale !== 1 || st.isDerived !== false) {
          errors.push({
            code: "INVALID_STAT_REGISTRY",
            message: `Invalid GEAR_BASE stat '${st.statCode}' in StatRegistry.`,
            catalogName: "statregistry",
            itemId: st.id,
          })
        }
      } else if (st.scope === "ENGINE_FLIGHT") {
        foundEngineCodes.add(st.statCode)
        if (st.statCode === "ENGINE_WEIGHT") {
          if (
            st.isDerived !== true ||
            st.profileField !== null ||
            st.derivedFrom !== "equipment.weightGrams" ||
            st.unit !== "grams"
          ) {
            errors.push({
              code: "INVALID_STAT_REGISTRY",
              message: "ENGINE_WEIGHT stat must be derived from equipment.weightGrams with profileField=null.",
              catalogName: "statregistry",
              itemId: st.id,
            })
          }
        } else if (st.unit === "centiseconds") {
          if (st.storageScale !== 100 || st.isDerived !== false) {
            errors.push({
              code: "INVALID_STAT_REGISTRY",
              message: `OD-04 violation: centisecond stat '${st.statCode}' must declare storageScale=100.`,
              catalogName: "statregistry",
              itemId: st.id,
            })
          }
        } else if (st.unit === "m/s" || st.unit === "deg/s") {
          if (st.storageScale !== 1 || st.isDerived !== false) {
            errors.push({
              code: "INVALID_STAT_REGISTRY",
              message: `OD-04 violation: integer flight stat '${st.statCode}' must declare storageScale=1.`,
              catalogName: "statregistry",
              itemId: st.id,
            })
          }
        } else {
          errors.push({
            code: "INVALID_STAT_REGISTRY",
            message: `Unsupported unit '${st.unit}' on Engine stat '${st.statCode}'.`,
            catalogName: "statregistry",
            itemId: st.id,
          })
        }
      } else {
        errors.push({
          code: "INVALID_STAT_REGISTRY",
          message: `Invalid StatRegistry scope '${String(st.scope)}' on '${st.id}'.`,
          catalogName: "statregistry",
          itemId: st.id,
        })
      }
    }

    for (const code of GEAR_V2_BASE_STAT_KEYS) {
      if (!foundBaseCodes.has(code)) {
        errors.push({
          code: "INVALID_STAT_REGISTRY",
          message: `StatRegistry is missing GEAR_BASE stat '${code}'.`,
          catalogName: "statregistry",
        })
      }
    }

    const expectedEngineCodes = [
      "MIN_SPEED",
      "MAX_SPEED",
      "BOOST_SPEED",
      "BOOST_TIME",
      "BOOST_RECOVERY",
      "NORMAL_TURN",
      "BOOST_TURN",
      "TURN_RESPONSE",
      "ENGINE_WEIGHT",
    ]
    for (const code of expectedEngineCodes) {
      if (!foundEngineCodes.has(code)) {
        errors.push({
          code: "INVALID_STAT_REGISTRY",
          message: `StatRegistry is missing ENGINE_FLIGHT stat '${code}'.`,
          catalogName: "statregistry",
        })
      }
    }
  }

  // 4b. Validate Categories aligned to P1 canonical slot groups
  const rawCategoryMap = new Map<string, GearV2CategoryItem>()
  if (parsedFiles.category) {
    for (const cat of categoryItems) {
      if (!cat || typeof cat !== "object") continue
      const p1Group = GEAR_V2_SLOT_GROUP_MAP.get(cat.slotGroupId)
      if (!p1Group) {
        errors.push({
          code: "INVALID_CATEGORY",
          message: `Category '${cat.id}' references unknown P1 slotGroupId '${String(cat.slotGroupId)}'.`,
          catalogName: "category",
          itemId: cat.id,
        })
        continue
      }
      if (
        !Array.isArray(cat.allowedSlotIds) ||
        cat.maxSlots !== p1Group.maxSlots ||
        cat.allowedSlotIds.length !== p1Group.slotIds.length ||
        cat.allowedSlotIds.some((s, idx) => s !== p1Group.slotIds[idx])
      ) {
        errors.push({
          code: "INVALID_CATEGORY",
          message: `Category '${cat.id}' allowedSlotIds/maxSlots do not match P1 slot group '${p1Group.groupId}'.`,
          catalogName: "category",
          itemId: cat.id,
        })
        continue
      }
      rawCategoryMap.set(cat.id, cat)
    }
    if (rawCategoryMap.size !== GEAR_V2_SLOT_GROUP_MAP.size) {
      errors.push({
        code: "INVALID_CATEGORY",
        message: `Category catalog must cover all ${GEAR_V2_SLOT_GROUP_MAP.size} P1 slot groups.`,
        catalogName: "category",
      })
    }
  }

  // 4c. Validate ClassProfiles (all 6 classes; forbid unapproved combatBaseStats)
  const rawClassMap = new Map<GearV2ClassId, GearV2ClassProfileItem>()
  if (parsedFiles.classprofile) {
    for (const cls of classItems) {
      if (!cls || typeof cls !== "object") continue
      if (!CLASS_ID_SET.has(cls.gearClassId)) {
        errors.push({
          code: "INVALID_CLASS_PROFILE",
          message: `Unknown gearClassId '${String(cls.gearClassId)}' in ClassProfile '${cls.id}'.`,
          catalogName: "classprofile",
          itemId: cls.id,
        })
        continue
      }
      if (
        cls.combatBaseStats !== null ||
        cls.combatBaseStatsStatus !== "UNAPPROVED_DEFERRED"
      ) {
        errors.push({
          code: "UNAPPROVED_FABRICATED_CLASS_STATS",
          message: `ClassProfile '${cls.id}' must keep combatBaseStats=null while combatBaseStatsStatus='UNAPPROVED_DEFERRED'.`,
          catalogName: "classprofile",
          itemId: cls.id,
        })
      }
      rawClassMap.set(cls.gearClassId, cls)
    }
    for (const classId of GEAR_V2_CLASS_IDS) {
      if (!rawClassMap.has(classId)) {
        errors.push({
          code: "INVALID_CLASS_PROFILE",
          message: `ClassProfile catalog is missing class '${classId}'.`,
          catalogName: "classprofile",
        })
      }
    }
  }

  // 4d. Validate EngineProfiles (8 safe integers, NO STRAFE_SPEED, NO persisted weightGrams)
  const rawEngineProfileMap = new Map<string, GearV2EngineProfileItem>()
  if (parsedFiles.engineprofile) {
    const metricKeys: Array<keyof GearV2EngineProfileItem> = [
      "minSpeedMps",
      "maxSpeedMps",
      "boostSpeedMps",
      "boostTimeCentiseconds",
      "boostRecoveryCentiseconds",
      "normalTurnDegPerSec",
      "boostTurnDegPerSec",
      "turnResponseCentiseconds",
    ]

    for (const ep of engineProfileItems) {
      if (!ep || typeof ep !== "object") continue
      if (hasForbiddenStrafeReference(ep as unknown as Record<string, unknown>)) {
        errors.push({
          code: "FORBIDDEN_STRAFE_SPEED",
          message: `EngineProfile '${ep.id}' contains forbidden STRAFE_SPEED field.`,
          catalogName: "engineprofile",
          itemId: ep.id,
        })
      }
      if (
        Object.prototype.hasOwnProperty.call(ep, "weightGrams") ||
        Object.prototype.hasOwnProperty.call(ep, "engineWeightGrams")
      ) {
        errors.push({
          code: "FORBIDDEN_PERSISTED_ENGINE_WEIGHT",
          message: `EngineProfile '${ep.id}' must not persist weightGrams/engineWeightGrams (ENGINE_WEIGHT derives from Equipment.weightGrams).`,
          catalogName: "engineprofile",
          itemId: ep.id,
        })
      }
      if (!CLASS_ID_SET.has(ep.gearClassId) || !rawClassMap.has(ep.gearClassId)) {
        errors.push({
          code: "ORPHAN_CLASS_REF",
          message: `EngineProfile '${ep.id}' references missing/invalid gearClassId '${String(ep.gearClassId)}'.`,
          catalogName: "engineprofile",
          itemId: ep.id,
        })
      }
      if (!ENGINE_VARIANT_SET.has(ep.variantId)) {
        errors.push({
          code: "INVALID_ENGINE_PROFILE",
          message: `EngineProfile '${ep.id}' has invalid variantId '${String(ep.variantId)}'.`,
          catalogName: "engineprofile",
          itemId: ep.id,
        })
      }
      for (const mk of metricKeys) {
        const val = ep[mk]
        if (typeof val !== "number" || !Number.isSafeInteger(val) || val < 0) {
          errors.push({
            code: "INVALID_ENGINE_PROFILE",
            message: `EngineProfile '${ep.id}' field '${String(mk)}' must be a non-negative safe integer (received ${String(val)}).`,
            catalogName: "engineprofile",
            itemId: ep.id,
            field: String(mk),
          })
        }
      }
      if (
        typeof ep.minSpeedMps === "number" &&
        typeof ep.maxSpeedMps === "number" &&
        typeof ep.boostSpeedMps === "number" &&
        !(ep.minSpeedMps <= ep.maxSpeedMps && ep.maxSpeedMps <= ep.boostSpeedMps)
      ) {
        errors.push({
          code: "INVALID_ENGINE_PROFILE",
          message: `EngineProfile '${ep.id}' violates minSpeedMps <= maxSpeedMps <= boostSpeedMps.`,
          catalogName: "engineprofile",
          itemId: ep.id,
        })
      }
      if (typeof ep.id === "string") {
        rawEngineProfileMap.set(ep.id, ep)
      }
    }
  }

  // 4e. Validate Equipment (Armor & Engine referential integrity, weights, Armor bonus sum = 10, no unapproved categories)
  const rawEquipmentMap = new Map<string, GearV2EquipmentItem>()
  if (parsedFiles.equipment) {
    for (const eq of equipmentItems) {
      if (!eq || typeof eq !== "object") continue
      if (hasForbiddenStrafeReference(eq as unknown as Record<string, unknown>)) {
        errors.push({
          code: "FORBIDDEN_STRAFE_SPEED",
          message: `Equipment '${eq.id}' contains forbidden STRAFE_SPEED field.`,
          catalogName: "equipment",
          itemId: eq.id,
        })
      }
      if (!CLASS_ID_SET.has(eq.gearClassId) || !rawClassMap.has(eq.gearClassId)) {
        errors.push({
          code: "ORPHAN_CLASS_REF",
          message: `Equipment '${eq.id}' references missing/invalid gearClassId '${String(eq.gearClassId)}'.`,
          catalogName: "equipment",
          itemId: eq.id,
        })
      }
      const category = rawCategoryMap.get(eq.categoryId)
      if (!category) {
        errors.push({
          code: "ORPHAN_CATEGORY_REF",
          message: `Equipment '${eq.id}' references missing categoryId '${String(eq.categoryId)}'.`,
          catalogName: "equipment",
          itemId: eq.id,
        })
      } else if (!category.p2Seeded) {
        errors.push({
          code: "INVALID_EQUIPMENT",
          message: `Equipment '${eq.id}' references unseeded category '${eq.categoryId}' in P2.`,
          catalogName: "equipment",
          itemId: eq.id,
        })
      }

      if (
        typeof eq.weightGrams !== "number" ||
        !Number.isSafeInteger(eq.weightGrams) ||
        eq.weightGrams <= 0
      ) {
        errors.push({
          code: "INVALID_EQUIPMENT",
          message: `Equipment '${eq.id}' weightGrams must be a positive safe integer (received ${String(eq.weightGrams)}).`,
          catalogName: "equipment",
          itemId: eq.id,
          field: "weightGrams",
        })
      }

      if (
        typeof eq.maxPerLoadout !== "number" ||
        !Number.isSafeInteger(eq.maxPerLoadout) ||
        eq.maxPerLoadout <= 0 ||
        typeof eq.uniquenessGroupId !== "string" ||
        eq.uniquenessGroupId.trim() === ""
      ) {
        errors.push({
          code: "INVALID_EQUIPMENT",
          message: `Equipment '${eq.id}' must define positive maxPerLoadout and non-empty uniquenessGroupId.`,
          catalogName: "equipment",
          itemId: eq.id,
        })
      }

      if (eq.categoryId === "gearv2.cat.armor") {
        const armor = eq as GearV2ArmorEquipmentItem
        if (
          !armor.primaryBonuses ||
          typeof armor.primaryBonuses !== "object" ||
          !armor.secondaryBonuses ||
          typeof armor.secondaryBonuses !== "object"
        ) {
          errors.push({
            code: "INVALID_ARMOR_ALLOCATION",
            message: `Armor '${eq.id}' must define primaryBonuses and secondaryBonuses objects.`,
            catalogName: "equipment",
            itemId: eq.id,
          })
        } else {
          let sum = 0
          const primaryKeys = new Set<string>()
          for (const [k, v] of Object.entries(armor.primaryBonuses)) {
            if (!BASE_STAT_SET.has(k) || typeof v !== "number" || !Number.isSafeInteger(v) || v <= 0) {
              errors.push({
                code: "INVALID_ARMOR_ALLOCATION",
                message: `Armor '${eq.id}' has invalid primaryBonus '${k}': ${String(v)}.`,
                catalogName: "equipment",
                itemId: eq.id,
              })
            } else {
              primaryKeys.add(k)
              sum += v
            }
          }
          for (const [k, v] of Object.entries(armor.secondaryBonuses)) {
            if (
              !BASE_STAT_SET.has(k) ||
              typeof v !== "number" ||
              !Number.isSafeInteger(v) ||
              v <= 0 ||
              primaryKeys.has(k)
            ) {
              errors.push({
                code: "INVALID_ARMOR_ALLOCATION",
                message: `Armor '${eq.id}' has invalid/overlapping secondaryBonus '${k}': ${String(v)}.`,
                catalogName: "equipment",
                itemId: eq.id,
              })
            } else {
              sum += v
            }
          }
          if (sum !== GEAR_V2_REQUIRED_ARMOR_BONUS_TOTAL) {
            errors.push({
              code: "INVALID_ARMOR_ALLOCATION",
              message: `Armor '${eq.id}' bonus sum must equal ${GEAR_V2_REQUIRED_ARMOR_BONUS_TOTAL} (actual ${sum}).`,
              catalogName: "equipment",
              itemId: eq.id,
            })
          }
        }
      } else if (eq.categoryId === "gearv2.cat.engine") {
        const eng = eq as GearV2EngineEquipmentItem
        if (!ENGINE_VARIANT_SET.has(eng.engineVariantId)) {
          errors.push({
            code: "INVALID_EQUIPMENT",
            message: `Engine equipment '${eq.id}' has invalid engineVariantId '${String(eng.engineVariantId)}'.`,
            catalogName: "equipment",
            itemId: eq.id,
          })
        }
        const profile = rawEngineProfileMap.get(eng.engineProfileId)
        if (!profile) {
          errors.push({
            code: "ORPHAN_ENGINE_PROFILE_REF",
            message: `Engine equipment '${eq.id}' references missing engineProfileId '${String(eng.engineProfileId)}'.`,
            catalogName: "equipment",
            itemId: eq.id,
            field: "engineProfileId",
          })
        } else if (
          profile.gearClassId !== eng.gearClassId ||
          profile.variantId !== eng.engineVariantId
        ) {
          errors.push({
            code: "INVALID_EQUIPMENT",
            message: `Engine equipment '${eq.id}' class/variant (${eng.gearClassId}/${eng.engineVariantId}) does not match profile '${profile.id}' (${profile.gearClassId}/${profile.variantId}).`,
            catalogName: "equipment",
            itemId: eq.id,
          })
        }
      }

      if (typeof eq.id === "string") {
        rawEquipmentMap.set(eq.id, eq)
      }
    }
  }

  // 4f. Validate Compatibility explicit ALLOW rules & FK references
  if (parsedFiles.compatibility) {
    const seenTuples = new Set<string>()
    for (const rule of compatItems) {
      if (!rule || typeof rule !== "object") continue
      if (rule.decision !== "ALLOW") {
        errors.push({
          code: "INVALID_COMPATIBILITY_RULE",
          message: `Compatibility rule '${rule.id}' must declare decision='ALLOW' (default-deny applies when absent).`,
          catalogName: "compatibility",
          itemId: rule.id,
        })
      }
      const eq = rawEquipmentMap.get(rule.equipmentId)
      if (!eq) {
        errors.push({
          code: "ORPHAN_EQUIPMENT_REF",
          message: `Compatibility rule '${rule.id}' references missing equipmentId '${String(rule.equipmentId)}'.`,
          catalogName: "compatibility",
          itemId: rule.id,
          field: "equipmentId",
        })
        continue
      }
      if (!CLASS_ID_SET.has(rule.gearClassId) || !rawClassMap.has(rule.gearClassId)) {
        errors.push({
          code: "ORPHAN_CLASS_REF",
          message: `Compatibility rule '${rule.id}' references missing gearClassId '${String(rule.gearClassId)}'.`,
          catalogName: "compatibility",
          itemId: rule.id,
          field: "gearClassId",
        })
      } else if (rule.gearClassId !== eq.gearClassId) {
        errors.push({
          code: "INVALID_COMPATIBILITY_RULE",
          message: `Compatibility rule '${rule.id}' gearClassId '${rule.gearClassId}' mismatches equipment class '${eq.gearClassId}'.`,
          catalogName: "compatibility",
          itemId: rule.id,
        })
      }
      if (!isGearV2PhysicalSlotId(rule.slotId)) {
        errors.push({
          code: "INVALID_COMPATIBILITY_RULE",
          message: `Compatibility rule '${rule.id}' references unknown P1 slotId '${String(rule.slotId)}'.`,
          catalogName: "compatibility",
          itemId: rule.id,
          field: "slotId",
        })
      } else {
        const eqCat = rawCategoryMap.get(eq.categoryId)
        if (eqCat && !eqCat.allowedSlotIds.includes(rule.slotId)) {
          errors.push({
            code: "INVALID_COMPATIBILITY_RULE",
            message: `Compatibility rule '${rule.id}' binds slotId '${rule.slotId}' incompatible with category '${eqCat.id}'.`,
            catalogName: "compatibility",
            itemId: rule.id,
          })
        }
      }
      const tupleKey = `${rule.equipmentId}|${rule.gearClassId}|${rule.slotId}`
      if (seenTuples.has(tupleKey)) {
        errors.push({
          code: "INVALID_COMPATIBILITY_RULE",
          message: `Duplicate compatibility tuple '${tupleKey}' on rule '${rule.id}'.`,
          catalogName: "compatibility",
          itemId: rule.id,
        })
      }
      seenTuples.add(tupleKey)
    }
  }

  // Fail closed if ANY validation error occurred
  if (errors.length > 0) {
    return makeEmptyFailedSnapshot(
      readMode,
      publicationStatus,
      rawCounts,
      approvedCounts,
      reviewCounts,
      manifestVerifications,
      manifestVerified,
      errors
    )
  }

  // Step 5: Apply strict C3 approvalStatus boundary WITHOUT auto-promoting REVIEW -> APPROVED
  const filterByReadMode = <T extends { approvalStatus: GearV2CatalogApprovalStatus }>(
    items: readonly T[]
  ): T[] => {
    if (readMode === "PRODUCTION_APPROVED") {
      return items.filter((i) => i.approvalStatus === "APPROVED")
    }
    return [...items]
  }

  const equipment = filterByReadMode(equipmentItems)
  const engineProfiles = filterByReadMode(engineProfileItems)
  const categories = filterByReadMode(categoryItems)
  const compatibilityRules = filterByReadMode(compatItems)
  const classProfiles = filterByReadMode(classItems)
  const statRegistry = filterByReadMode(statItems)
  const manifestEntries = filterByReadMode(rawManifestEntries)

  return {
    valid: true,
    readMode,
    publicationStatus,
    manifestVerified,
    rawCounts,
    approvedCounts,
    reviewCounts,
    manifestVerifications,
    errors: [],
    equipment,
    engineProfiles,
    categories,
    compatibilityRules,
    classProfiles,
    statRegistry,
    manifestEntries,
    equipmentMap: new Map(equipment.map((e) => [e.id, e])),
    engineProfileMap: new Map(engineProfiles.map((p) => [p.id, p])),
    categoryMap: new Map(categories.map((c) => [c.id, c])),
    classProfileMap: new Map(classProfiles.map((c) => [c.gearClassId, c])),
    statRegistryMap: new Map(statRegistry.map((s) => [s.statCode, s])),
  }
}

/**
 * Evaluates (equipmentId, gearClassId, slotId) against loaded compatibility rules.
 * Default-deny: anything missing an explicit ALLOW rule returns ALLOW=false / DENY.
 */
export function evaluateGearV2Compatibility(
  snapshot: GearV2CatalogSnapshot,
  input: GearV2CompatibilityCheckInput
): GearV2CompatibilityEvaluationResult {
  if (!snapshot.valid) {
    return {
      allowed: false,
      decision: "DENY",
      matchedRuleId: null,
      denyReason: "SNAPSHOT_INVALID",
      message: "Catalog snapshot failed fail-closed validation; defaulting to DENY.",
    }
  }

  const eq = snapshot.equipmentMap.get(input.equipmentId?.trim())
  if (!eq) {
    const reason =
      snapshot.readMode === "PRODUCTION_APPROVED" &&
      snapshot.rawCounts.equipment > snapshot.equipment.length
        ? "NOT_APPROVED_FOR_RUNTIME"
        : "UNKNOWN_EQUIPMENT"
    return {
      allowed: false,
      decision: "DENY",
      matchedRuleId: null,
      denyReason: reason,
      message:
        reason === "NOT_APPROVED_FOR_RUNTIME"
          ? `Equipment '${String(input.equipmentId)}' is not APPROVED for production runtime.`
          : `Unknown equipment '${String(input.equipmentId)}'.`,
    }
  }

  if (input.requireActiveForNewEquip !== false && !canSelectForNewInstance(eq.lifecycle)) {
    return {
      allowed: false,
      decision: "DENY",
      matchedRuleId: null,
      denyReason: "LIFECYCLE_NOT_SELECTABLE",
      message: `Equipment '${eq.id}' has lifecycle '${eq.lifecycle}' and cannot be equipped.`,
    }
  }

  const normalizedClass = normalizeGearV2ClassId(input.gearClassId)
  if (!normalizedClass) {
    return {
      allowed: false,
      decision: "DENY",
      matchedRuleId: null,
      denyReason: "UNKNOWN_GEAR_CLASS",
      message: `Unknown GEAR class '${String(input.gearClassId)}'.`,
    }
  }

  const cleanSlot = typeof input.slotId === "string" ? input.slotId.trim() : ""
  if (!GEAR_V2_PHYSICAL_SLOT_MAP.has(cleanSlot as GearV2PhysicalSlotId)) {
    return {
      allowed: false,
      decision: "DENY",
      matchedRuleId: null,
      denyReason: "UNKNOWN_SLOT",
      message: `Unknown physical slotId '${String(input.slotId)}'.`,
    }
  }

  const matchedRule = snapshot.compatibilityRules.find(
    (r) =>
      r.decision === "ALLOW" &&
      r.equipmentId === eq.id &&
      r.gearClassId === normalizedClass &&
      r.slotId === cleanSlot &&
      (input.requireActiveForNewEquip === false || canSelectForNewInstance(r.lifecycle))
  )

  if (!matchedRule) {
    return {
      allowed: false,
      decision: "DENY",
      matchedRuleId: null,
      denyReason: "DEFAULT_DENY_NO_ALLOW_RULE",
      message: `Default-deny: no explicit ALLOW compatibility rule for (${eq.id}, ${normalizedClass}, ${cleanSlot}).`,
    }
  }

  return {
    allowed: true,
    decision: "ALLOW",
    matchedRuleId: matchedRule.id,
    denyReason: null,
    message: `Matched explicit ALLOW rule '${matchedRule.id}'.`,
  }
}

/**
 * Joins Engine Equipment with EngineProfile and derives ENGINE_WEIGHT
 * exclusively from Equipment.weightGrams without double counting.
 */
export function resolveGearV2EngineView(
  snapshot: GearV2CatalogSnapshot,
  equipmentId: string
): GearV2EngineResolvedView | null {
  if (!snapshot.valid) return null
  const eq = snapshot.equipmentMap.get(equipmentId)
  if (!eq || eq.categoryId !== "gearv2.cat.engine") return null
  const engineEq = eq as GearV2EngineEquipmentItem
  const profile = snapshot.engineProfileMap.get(engineEq.engineProfileId)
  if (!profile) return null

  return {
    equipmentId: engineEq.id,
    engineProfileId: profile.id,
    gearClassId: engineEq.gearClassId,
    variantId: engineEq.engineVariantId,
    displayName: engineEq.displayName,
    minSpeedMps: profile.minSpeedMps,
    maxSpeedMps: profile.maxSpeedMps,
    boostSpeedMps: profile.boostSpeedMps,
    boostTimeCentiseconds: profile.boostTimeCentiseconds,
    boostRecoveryCentiseconds: profile.boostRecoveryCentiseconds,
    normalTurnDegPerSec: profile.normalTurnDegPerSec,
    boostTurnDegPerSec: profile.boostTurnDegPerSec,
    turnResponseCentiseconds: profile.turnResponseCentiseconds,
    boostTimeSeconds: profile.boostTimeCentiseconds / 100,
    boostRecoverySeconds: profile.boostRecoveryCentiseconds / 100,
    turnResponseSeconds: profile.turnResponseCentiseconds / 100,
    derivedEngineWeightGrams: engineEq.weightGrams,
    approvalStatus: engineEq.approvalStatus,
    lifecycle: engineEq.lifecycle,
  }
}

/**
 * Converts a validated catalog Equipment item to a P1 GearV2EquippedItem.
 * Engine weight comes strictly from Equipment.weightGrams once (never double-counted).
 */
export function toGearV2P1EquippedItem(
  snapshot: GearV2CatalogSnapshot,
  equipmentId: string,
  instanceId?: string
): GearV2EquippedItem | null {
  if (!snapshot.valid) return null
  const eq = snapshot.equipmentMap.get(equipmentId)
  if (!eq) return null

  return {
    equipmentId: eq.id,
    instanceId,
    weightGrams: eq.weightGrams,
    maxPerLoadout: eq.maxPerLoadout,
    uniquenessGroupId: eq.uniquenessGroupId,
    derivedEngineWeightGrams:
      eq.categoryId === "gearv2.cat.engine" ? eq.weightGrams : undefined,
  }
}

/**
 * Bridges validated P2 catalog items + default-deny compatibility into P1
 * `validateConfirmLoadoutWeight` and OD-07 `validateLoadoutReadiness`.
 */
export function validateGearV2LoadoutWithCatalog(
  snapshot: GearV2CatalogSnapshot,
  input: GearV2LoadoutCatalogValidationInput
): GearV2LoadoutCatalogCheckResult {
  const weightConfig = input.weightConfig ?? DEFAULT_GEAR_V2_WEIGHT_CONFIG
  const normalizedClass =
    normalizeGearV2ClassId(input.gearClass) ?? (input.gearClass as GearV2ClassId)
  const normalizedVariant =
    normalizeGearV2EngineVariant(input.engineVariant) ??
    (input.engineVariant as GearV2EngineVariant)

  const slotEntries: Array<{
    slotId: string
    equipmentId: string
    instanceId?: string
  }> = []

  if (input.slots) {
    for (const [slotId, val] of Object.entries(input.slots)) {
      if (val) {
        slotEntries.push({
          slotId,
          equipmentId: val.equipmentId,
          instanceId: val.instanceId,
        })
      }
    }
  } else if (input.entries) {
    for (const e of input.entries) {
      slotEntries.push({
        slotId: e.slotId,
        equipmentId: e.equipmentId,
        instanceId: e.instanceId,
      })
    }
  }

  const invalidSlotIds: GearV2PhysicalSlotId[] = []
  const compatIssues: Array<{
    code: string
    message: string
    slotId: string
    equipmentId: string
  }> = []

  const p1Entries: Array<{ slotId: string; item: GearV2EquippedItem }> = []

  for (const entry of slotEntries) {
    const compat = evaluateGearV2Compatibility(snapshot, {
      equipmentId: entry.equipmentId,
      gearClassId: normalizedClass,
      slotId: entry.slotId,
    })

    if (!compat.allowed) {
      compatIssues.push({
        code: compat.denyReason ?? "DEFAULT_DENY_NO_ALLOW_RULE",
        message: compat.message,
        slotId: entry.slotId,
        equipmentId: entry.equipmentId,
      })
      if (isGearV2PhysicalSlotId(entry.slotId)) {
        invalidSlotIds.push(entry.slotId)
      }
    }

    const p1Item = toGearV2P1EquippedItem(snapshot, entry.equipmentId, entry.instanceId)
    p1Entries.push({
      slotId: entry.slotId,
      item: p1Item ?? {
        equipmentId: entry.equipmentId,
        instanceId: entry.instanceId,
        weightGrams: 0,
      },
    })
  }

  const compatInput: GearV2ExternalCompatibilityInput = {
    checked: true,
    valid: compatIssues.length === 0,
    invalidSlotIds,
    issues: compatIssues,
  }

  const p1Input: GearV2WeightCalculationInput = {
    gearClass: normalizedClass,
    engineVariant: normalizedVariant,
    entries: p1Entries,
  }

  const mode = input.mode ?? "CONFIRM"
  const p1ConfirmResult =
    mode === "CONFIRM" || mode === "SAVE"
      ? validateConfirmLoadoutWeight(p1Input, weightConfig, {
          compatibility: compatInput,
        })
      : undefined
  const p1ReadinessResult = validateLoadoutReadiness(
    p1Input,
    mode,
    weightConfig,
    { compatibility: compatInput }
  )

  return {
    compatibilityValid: compatIssues.length === 0,
    compatibilityIssues: compatIssues,
    p1ConfirmResult,
    p1ReadinessResult,
  }
}
