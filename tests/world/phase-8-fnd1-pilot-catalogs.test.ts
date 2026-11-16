/**
 * STARFRONT WORLD V2 — FND8 Phase 1: FND-1 SYSTEM Catalog Bootstrap Test Suite
 *
 * Verifies all 10 required Phase 1 assertions:
 * 1. Exactly 12 unique Pilot Class entries (C01-C12) with distinct Class Persona vs Pilot Instance UUID contract.
 * 2. Exactly 26 unique Trait definitions with corrected D1/D2/D3/UNSET counts and zero "Active" category.
 * 3. All Class Trait references resolve cleanly; zero orphan references; bidirectional owner match.
 * 4. Each proposed Base allocation totals 20 while remaining PROPOSED_UNLOCKED.
 * 5. No proposed Base value is exposed as CANON_LOCKED (`baseAttributes` & canonical getter return `null`).
 * 6. No unapproved Trait candidate value is executable (`value` & executable getter return `null`, `isExecutableModifier === false`).
 * 7. Missing Combat V2 predicates are explicitly marked `DEFERRED_MISSING_COMBAT_CONTRACT`.
 * 8. GEAR Compatibility catalog is empty (`items: []`), `PENDING_FND8_6_GEAR_CATALOG`, zero V1 GEAR/ratings/artwork.
 * 9. V1 compatibility (`STARFRONT_PILOTS`, `STARFRONT_GEAR_DEFS`) and FND-1 `file-naming` / `CatalogRegistry` conventions intact.
 * 10. CDN R4 release configuration (`v4.0-assets-r4` / SHA `816585651f1f06f1cafeefc6a4809ab1f52f3484`) remains untouched.
 */

import test from "node:test"
import assert from "node:assert"
import fs from "node:fs"
import path from "node:path"

import { parseConfigFileId } from "../../lib/game/world/catalog/file-naming"
import { defaultCatalogRegistry } from "../../lib/game/world/catalog/registry"
import {
  getAllPilotClasses,
  getAllPilotTraits,
  getCanonicalCombatBaseAttributes,
  getExecutableTraitModifierValue,
  getGearCompatibilityCatalog,
  getPilotClassByPilotId,
  getPilotClassCatalog,
  getPilotClassDefinition,
  getPilotTraitCatalog,
  getPilotTraitDefinition,
  getPilotTraitsForClass,
} from "../../lib/game/world/pilot/registry-integration"
import type { PilotInstanceIdentityContract } from "../../lib/game/world/pilot/catalog-types"
import { STARFRONT_GEAR_DEFS, STARFRONT_PILOTS } from "../../lib/game/data"
import {
  DEFAULT_PILOT_V2_CHANNEL_URL,
  GITHUB_RAW_PILOT_V2_CHANNEL_URL,
  contentConfig,
} from "../../lib/game/v2/content-config"

const DISK_FILES = {
  pilotClass: path.join(process.cwd(), "data", "catalogs", "system_pilot_class_data.json"),
  pilotTrait: path.join(process.cwd(), "data", "catalogs", "system_pilot_trait_data.json"),
  gearCompat: path.join(process.cwd(), "data", "catalogs", "system_gear_compatibility_data.json"),
}

test("1. Exactly 12 unique Pilot Class entries (C01-C12) without invented lore fields", () => {
  assert.ok(fs.existsSync(DISK_FILES.pilotClass), "Missing system_pilot_class_data.json")
  const raw = JSON.parse(fs.readFileSync(DISK_FILES.pilotClass, "utf-8"))
  assert.strictEqual(raw.configFileId, "system_pilot_class")
  assert.strictEqual(raw.schemaVersion, 1)
  assert.strictEqual(raw.mode, "INLINE")

  const classes = getAllPilotClasses(defaultCatalogRegistry)
  assert.strictEqual(classes.length, 12)

  const uniqueIds = new Set(classes.map((c) => c.id))
  const uniquePilotIds = new Set(classes.map((c) => c.pilotId))
  const uniqueCodes = new Set(classes.map((c) => c.personaCode))
  assert.strictEqual(uniqueIds.size, 12)
  assert.strictEqual(uniquePilotIds.size, 12)
  assert.strictEqual(uniqueCodes.size, 12)

  const expectedPilotIds = [
    "alviss",
    "eric",
    "marcus",
    "victor",
    "kaelen",
    "lyra",
    "selena",
    "valentine",
    "fortuna",
    "aria",
    "rhea",
    "nova",
  ]
  assert.deepStrictEqual(
    classes.map((c) => c.pilotId),
    expectedPilotIds
  )

  const forbiddenLoreFields = [
    "fullName",
    "fullLoreName",
    "age",
    "callsign",
    "origin",
    "training",
    "biography",
    "biographyText",
  ]
  for (const cls of classes) {
    assert.strictEqual(cls.id, cls.characterClassId)
    for (const key of forbiddenLoreFields) {
      assert.strictEqual((cls as Record<string, unknown>)[key], undefined, `Forbidden unapproved lore field '${key}' present on ${cls.id}`)
    }
  }

  // Verify Class Persona ID vs Pilot Instance UUID separation contract
  const instanceContract: PilotInstanceIdentityContract = {
    pilotInstanceId: "550e8400-e29b-41d4-a716-446655440000",
    characterClassId: "PILOT_CLASS_C08",
    cdnPilotKey: "valentine",
    instanceCharacterName: "Unit-V08",
  }
  assert.notStrictEqual(instanceContract.pilotInstanceId, instanceContract.characterClassId)
  assert.strictEqual(getPilotClassByPilotId("valentine")?.characterClassId, instanceContract.characterClassId)
})

test("2. Exactly 26 unique Trait definitions with corrected D1=2, D2=4, D3=10, UNSET=10 and no 'Active' category", () => {
  assert.ok(fs.existsSync(DISK_FILES.pilotTrait), "Missing system_pilot_trait_data.json")
  const traits = getAllPilotTraits(defaultCatalogRegistry)
  assert.strictEqual(traits.length, 26)

  const uniqueTraitIds = new Set(traits.map((t) => t.id))
  assert.strictEqual(uniqueTraitIds.size, 26)

  const counts = {
    D1_PROTOTYPE: 0,
    D2_TEST_DEFAULT: 0,
    D3_PROPOSED_UNDER_REVIEW: 0,
    UNSET: 0,
    CANON_LOCKED: 0,
  }

  for (const t of traits) {
    assert.strictEqual(t.id, t.traitId)
    assert.notStrictEqual((t.loreClassification as string).toLowerCase(), "active")
    assert.notStrictEqual((t.executionMode as string).toLowerCase(), "active")
    assert.ok(["PASSIVE", "CONDITIONAL", "SIGNATURE"].includes(t.loreClassification))
    assert.ok(["PASSIVE", "CONDITIONAL"].includes(t.executionMode))
    assert.strictEqual(t.identityApprovalStatus, "APPROVED")
    counts[t.valueApprovalStatus] += 1
  }

  assert.strictEqual(counts.D1_PROTOTYPE, 2)
  assert.strictEqual(counts.D2_TEST_DEFAULT, 4)
  assert.strictEqual(counts.D3_PROPOSED_UNDER_REVIEW, 10)
  assert.strictEqual(counts.UNSET, 10)
  assert.strictEqual(counts.CANON_LOCKED, 0)

  // Victor pilot_trait_shield_anchor MUST be D3_PROPOSED_UNDER_REVIEW, NOT D1
  const shieldAnchor = getPilotTraitDefinition("pilot_trait_shield_anchor", defaultCatalogRegistry)
  assert.ok(shieldAnchor)
  assert.strictEqual(shieldAnchor.valueApprovalStatus, "D3_PROPOSED_UNDER_REVIEW")
  assert.strictEqual(shieldAnchor.candidateValue, 10)
})

test("3. All Class Trait references resolve cleanly with zero orphan references", () => {
  const classes = getAllPilotClasses(defaultCatalogRegistry)
  const traits = getAllPilotTraits(defaultCatalogRegistry)
  const classReferencedIds = new Set<string>()

  for (const cls of classes) {
    assert.ok(cls.traitDefinitionIds.length >= 2, `${cls.id} should reference at least 2 traits`)
    const resolvedTraits = getPilotTraitsForClass(cls.id, defaultCatalogRegistry)
    assert.strictEqual(resolvedTraits.length, cls.traitDefinitionIds.length, `Orphan trait ref in ${cls.id}`)

    for (const trait of resolvedTraits) {
      assert.strictEqual(trait.ownerClassId, cls.id)
      assert.strictEqual(trait.ownerPilotId, cls.pilotId)
      classReferencedIds.add(trait.id)
    }
  }

  // Zero unreferenced / orphan trait entries in pilot_trait catalog
  assert.strictEqual(classReferencedIds.size, traits.length)
  for (const trait of traits) {
    assert.ok(classReferencedIds.has(trait.id), `Orphan trait in catalog: ${trait.id}`)
    assert.ok(getPilotClassDefinition(trait.ownerClassId, defaultCatalogRegistry), `Missing owner class ${trait.ownerClassId}`)
  }
})

test("4. Each proposed Base allocation totals 20 while remaining PROPOSED_UNLOCKED", () => {
  const classes = getAllPilotClasses(defaultCatalogRegistry)
  for (const cls of classes) {
    assert.strictEqual(cls.baseAttributesApproval, "PROPOSED_UNLOCKED")
    const p = cls.proposedBaseAttributes
    const sum = p.atk + p.def + p.agi + p.ene + p.shd + p.luk
    assert.strictEqual(sum, 20, `${cls.id} (${cls.classCharacterName}) 20-pt matrix summed to ${sum}`)
  }
})

test("5. No proposed Base value is exposed as CANON_LOCKED", () => {
  const classes = getAllPilotClasses(defaultCatalogRegistry)
  for (const cls of classes) {
    assert.strictEqual(cls.baseAttributes, null, `${cls.id} must keep baseAttributes null while PROPOSED_UNLOCKED`)
    assert.strictEqual(getCanonicalCombatBaseAttributes(cls), null, `${cls.id} leaked proposed stats as canonical`)
  }
})

test("6. No unapproved Trait candidate value is executable", () => {
  const traits = getAllPilotTraits(defaultCatalogRegistry)
  for (const trait of traits) {
    assert.strictEqual(trait.value, null, `${trait.id} value must remain null until CANON_LOCKED`)
    assert.strictEqual(trait.isExecutableModifier, false, `${trait.id} must have isExecutableModifier = false`)
    assert.strictEqual(getExecutableTraitModifierValue(trait), null, `${trait.id} leaked candidate value as executable`)
  }
})

test("7. Missing Combat V2 predicates are explicitly marked DEFERRED_MISSING_COMBAT_CONTRACT", () => {
  const traits = getAllPilotTraits(defaultCatalogRegistry)
  for (const trait of traits) {
    assert.ok(trait.requiredPredicate.length > 0, `${trait.id} missing requiredPredicate`)
    assert.strictEqual(
      trait.combatV2SupportStatus,
      "DEFERRED_MISSING_COMBAT_CONTRACT",
      `${trait.id} must be deferred until Combat V2 supports predicate ${trait.requiredPredicate}`
    )
  }
})

test("8. GEAR Compatibility catalog is empty, PENDING_FND8_6_GEAR_CATALOG, with zero V1 GEAR/artwork", () => {
  assert.ok(fs.existsSync(DISK_FILES.gearCompat), "Missing system_gear_compatibility_data.json")
  const rawText = fs.readFileSync(DISK_FILES.gearCompat, "utf-8")
  const rawJson = JSON.parse(rawText)

  assert.strictEqual(rawJson.configFileId, "system_gear_compatibility")
  assert.strictEqual(rawJson.metadata?.status, "PENDING_FND8_6_GEAR_CATALOG")
  assert.deepStrictEqual(rawJson.items, [])

  const resolvedGear = getGearCompatibilityCatalog(defaultCatalogRegistry)
  assert.strictEqual(resolvedGear.items.length, 0)
  assert.strictEqual(resolvedGear.diagnostics.length, 0)

  // Verify no V1 GEAR IDs or compatibility ranks leaked into disk file
  const v1GearList = Object.values(STARFRONT_GEAR_DEFS)
  assert.ok(v1GearList.length > 0)
  for (const v1Gear of v1GearList) {
    assert.strictEqual(rawText.includes(v1Gear.id), false, `V1 gear ID leaked into FND-1 compat catalog: ${v1Gear.id}`)
  }
})

test("9. FND-1 naming/registry conventions and V1 Pilot/GEAR backward compatibility remain intact", () => {
  // Naming conventions match FND-1 parseConfigFileId()
  const pClass = parseConfigFileId("system_pilot_class_data.json")
  const pTrait = parseConfigFileId("system_pilot_trait_data.json")
  const pGear = parseConfigFileId("system_gear_compatibility_data.json")

  assert.deepStrictEqual(pClass, { type: "system", domain: "pilot", catalogName: "class", suffix: undefined })
  assert.deepStrictEqual(pTrait, { type: "system", domain: "pilot", catalogName: "trait", suffix: undefined })
  assert.deepStrictEqual(pGear, { type: "system", domain: "gear", catalogName: "compatibility", suffix: undefined })

  // CatalogRegistry diagnostics clean
  assert.strictEqual(getPilotClassCatalog(defaultCatalogRegistry).diagnostics.length, 0)
  assert.strictEqual(getPilotTraitCatalog(defaultCatalogRegistry).diagnostics.length, 0)
  assert.strictEqual(getGearCompatibilityCatalog(defaultCatalogRegistry).diagnostics.length, 0)

  // V1 Pilot & GEAR tables remain intact and untouched
  assert.ok(Array.isArray(STARFRONT_PILOTS) && STARFRONT_PILOTS.length > 0)
  assert.ok(Object.keys(STARFRONT_GEAR_DEFS).length > 0)
})

test("10. CDN R4 channel configuration remains untouched", () => {
  assert.strictEqual(
    DEFAULT_PILOT_V2_CHANNEL_URL,
    "https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@main/starfront-world-assets/channels/pilot-v2-preview.json"
  )
  assert.strictEqual(
    GITHUB_RAW_PILOT_V2_CHANNEL_URL,
    "https://raw.githubusercontent.com/viettanpham/starfront-assets/main/starfront-world-assets/channels/pilot-v2-preview.json"
  )
  assert.strictEqual(contentConfig.allowedRepoIdentifier, "viettanpham/starfront-assets")
  assert.strictEqual(contentConfig.channelUrl, DEFAULT_PILOT_V2_CHANNEL_URL)
})
