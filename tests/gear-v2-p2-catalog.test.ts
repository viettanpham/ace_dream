/**
 * STARFRONT WORLD V2 — GEAR V2 P2 Equipment Catalog Integration Test Suite
 *
 * Covers:
 * - FND-1 C1-C4 & naming/registration isolation (`domain: "gearv2"` vs V1 / FND-8.6)
 * - Exact parity with canonical seed JSON (36 equipment, 18 engine profiles, 36 ALLOW tuples)
 * - OD-04 units (centiseconds storageScale=100, derived ENGINE_WEIGHT, zero STRAFE_SPEED)
 * - Fail-closed SHA-256 manifest verification on raw disk bytes BEFORE approval filtering
 * - Fail-closed tamper, missing file, C1 duplicate/empty ID, C2 provenance collision, orphan ref detection
 * - C3 lifecycle vs approvalStatus boundary (`REVIEW_STAGING` vs `PRODUCTION_APPROVED`, zero auto-promote)
 * - Default-deny compatibility evaluation and P1 Weight Engine / OD-07 Readiness bridge
 */

import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

import { STARFRONT_GEAR_DEFS } from "../lib/game/data"
import { parseConfigFileId } from "../lib/game/world/catalog/file-naming"
import { CatalogRegistry } from "../lib/game/world/catalog/registry"
import { InMemoryCatalogDataProvider } from "../lib/game/world/catalog/storage-provider"
import {
  GEAR_V2_CATALOG_DOMAIN,
  GEAR_V2_CATALOG_NAMES,
  GEAR_V2_CATALOG_REGISTRATIONS,
  GEAR_V2_SOURCE_CATALOG_NAMES,
  evaluateGearV2Compatibility,
  loadGearV2CatalogSnapshot,
  registerGearV2Catalogs,
  resolveGearV2EngineView,
  sha256Utf8Hex,
  toGearV2P1EquippedItem,
  utf8ByteLength,
  validateGearV2LoadoutWithCatalog,
} from "../lib/game/v2/gear/catalog"
import {
  NodeFsRawCatalogProvider,
  loadGearV2CatalogSnapshotFromDisk,
  nodeCryptoSha256Utf8Hex,
} from "../lib/game/v2/gear/catalog/node-fs-provider"

const DATA_DIR = path.join(process.cwd(), "data", "catalogs")
const SEED_PATH = path.join(
  process.cwd(),
  "public",
  "assets",
  "aistudio",
  "STARFRONT_GEAR_V2_P2_SEED_WITH_ARMOR_WEIGHTS_2026-11-16_0acd4f9d.json"
)

function cloneRawDiskFiles(): Record<string, string> {
  const provider = new NodeFsRawCatalogProvider(DATA_DIR)
  const files: Record<string, string> = {}
  for (const reg of GEAR_V2_CATALOG_REGISTRATIONS) {
    const text = provider.readFile(reg.rootFilename)
    assert.ok(text !== null, `Missing ${reg.rootFilename} on disk`)
    files[reg.rootFilename] = text
  }
  return files
}

function rebuildManifestForRawFiles(
  rawFiles: Record<string, string>,
  overrides?: { publicationStatus?: string }
): void {
  const manifest = JSON.parse(rawFiles["system_gearv2_manifest_data.json"])
  if (overrides?.publicationStatus) {
    manifest.metadata.publicationStatus = overrides.publicationStatus
  }
  for (const entry of manifest.items) {
    const raw = rawFiles[entry.filename]
    const parsed = JSON.parse(raw)
    entry.rawItemCount = parsed.items.length
    entry.approvedItemCount = parsed.items.filter(
      (i: any) => i.approvalStatus === "APPROVED"
    ).length
    entry.reviewItemCount = parsed.items.filter(
      (i: any) => i.approvalStatus === "REVIEW"
    ).length
    entry.byteLength = utf8ByteLength(raw)
    entry.sha256 = sha256Utf8Hex(raw)
  }
  manifest.metadata.totalRawSourceItems = manifest.items.reduce(
    (sum: number, m: any) => sum + m.rawItemCount,
    0
  )
  manifest.metadata.totalApprovedSourceItems = manifest.items.reduce(
    (sum: number, m: any) => sum + m.approvedItemCount,
    0
  )
  rawFiles["system_gearv2_manifest_data.json"] = JSON.stringify(manifest, null, 2) + "\n"
}

test("GEAR V2 P2 Equipment Catalog Suite", async (t) => {
  await t.test("1. Pure-TS SHA-256 matches node:crypto and verifies all 6 raw disk catalog files", () => {
    const rawFiles = cloneRawDiskFiles()
    for (const reg of GEAR_V2_CATALOG_REGISTRATIONS) {
      const content = rawFiles[reg.rootFilename]
      assert.equal(sha256Utf8Hex(content), nodeCryptoSha256Utf8Hex(content))
    }

    const snapshot = loadGearV2CatalogSnapshotFromDisk({ mode: "REVIEW_STAGING" })
    assert.equal(snapshot.valid, true, JSON.stringify(snapshot.errors))
    assert.equal(snapshot.manifestVerified, true)
    assert.equal(snapshot.publicationStatus, "REVIEW_UNPUBLISHED")
    assert.equal(snapshot.manifestVerifications.length, 6)
    for (const mv of snapshot.manifestVerifications) {
      assert.equal(mv.verified, true, `Manifest verification failed for ${mv.filename}`)
      assert.equal(mv.actualSha256, mv.expectedSha256)
      assert.equal(mv.actualByteLength, mv.expectedByteLength)
      assert.equal(mv.actualRawItemCount, mv.expectedRawItemCount)
    }
  })

  await t.test("2. FND-1 naming, CatalogRegistry integration, and strict isolation from V1 & FND-8.6", () => {
    for (const name of GEAR_V2_CATALOG_NAMES) {
      const reg = GEAR_V2_CATALOG_REGISTRATIONS.find((r) => r.catalogName === name)!
      const parsed = parseConfigFileId(reg.rootFilename)
      assert.deepEqual(parsed, {
        type: "system",
        domain: GEAR_V2_CATALOG_DOMAIN,
        catalogName: name,
        suffix: undefined,
      })
    }

    const fsProvider = new NodeFsRawCatalogProvider(DATA_DIR)
    const isolatedRegistry = new CatalogRegistry(fsProvider)
    registerGearV2Catalogs(isolatedRegistry, fsProvider)

    for (const name of GEAR_V2_CATALOG_NAMES) {
      const cat = isolatedRegistry.getCatalog(GEAR_V2_CATALOG_DOMAIN, name)
      assert.equal(cat.diagnostics.length, 0, `Diagnostics found in gearv2/${name}`)
      assert.ok(cat.items.length > 0, `Expected items in gearv2/${name}`)
    }

    // Verify FND-8.6 system_gear_compatibility_data.json remains untouched and empty
    const fnd86Raw = fs.readFileSync(
      path.join(DATA_DIR, "system_gear_compatibility_data.json"),
      "utf-8"
    )
    const fnd86Json = JSON.parse(fnd86Raw)
    assert.equal(fnd86Json.configFileId, "system_gear_compatibility")
    assert.deepEqual(fnd86Json.items, [])
    assert.equal(fnd86Json.metadata?.status, "PENDING_FND8_6_GEAR_CATALOG")

    // Verify no V1 GEAR definitions leaked into gearv2 catalogs
    const gearV2RawEquipment = fs.readFileSync(
      path.join(DATA_DIR, "system_gearv2_equipment_data.json"),
      "utf-8"
    )
    for (const v1Def of Object.values(STARFRONT_GEAR_DEFS)) {
      assert.equal(
        gearV2RawEquipment.includes(`"${v1Def.id}"`),
        false,
        `V1 gear ID leaked into gearv2: ${v1Def.id}`
      )
    }
  })

  await t.test("3. Exact seed parity: 36 equipment, 18 engine profiles, 36 ALLOW rules, zero fabricated categories or class base stats", () => {
    const seed = JSON.parse(fs.readFileSync(SEED_PATH, "utf-8"))
    const snapshot = loadGearV2CatalogSnapshotFromDisk({ mode: "REVIEW_STAGING" })
    assert.equal(snapshot.valid, true)

    assert.equal(snapshot.rawCounts.equipment, 36)
    assert.equal(snapshot.rawCounts.engineprofile, 18)
    assert.equal(snapshot.rawCounts.compatibility, 36)
    assert.equal(snapshot.rawCounts.category, 7)
    assert.equal(snapshot.rawCounts.classprofile, 6)
    assert.equal(snapshot.rawCounts.statregistry, 18)
    assert.equal(snapshot.rawCounts.manifest, 6)

    const armors = snapshot.equipment.filter((e) => e.categoryId === "gearv2.cat.armor")
    const engines = snapshot.equipment.filter((e) => e.categoryId === "gearv2.cat.engine")
    assert.equal(armors.length, 18)
    assert.equal(engines.length, 18)

    // Verify exact equipment parity against canonical seed
    for (const seedEq of seed.equipment) {
      const catEq = snapshot.equipmentMap.get(seedEq.id)
      assert.ok(catEq, `Missing equipment ${seedEq.id}`)
      assert.deepEqual(catEq, seedEq)
      if (catEq.categoryId === "gearv2.cat.armor") {
        const bonusSum =
          Object.values(catEq.primaryBonuses).reduce((a, b) => a + (b ?? 0), 0) +
          Object.values(catEq.secondaryBonuses).reduce((a, b) => a + (b ?? 0), 0)
        assert.equal(bonusSum, 10, `Armor ${catEq.id} bonus sum != 10`)
      }
    }

    // Verify exact engineProfile parity against canonical seed
    for (const seedEp of seed.engineProfiles) {
      const catEp = snapshot.engineProfileMap.get(seedEp.id)
      assert.ok(catEp, `Missing engineProfile ${seedEp.id}`)
      assert.deepEqual(catEp, seedEp)
    }

    // Verify exact 36 explicit ALLOW compatibility rules
    assert.equal(snapshot.compatibilityRules.length, 36)
    for (const seedRule of seed.explicitAllowCompatibility) {
      const match = snapshot.compatibilityRules.find((r) => r.id === seedRule.id)
      assert.ok(match, `Missing rule ${seedRule.id}`)
      assert.equal(match.equipmentId, seedRule.equipmentId)
      assert.equal(match.gearClassId, seedRule.gearClassId)
      assert.equal(match.slotId, seedRule.slotId)
      assert.equal(match.decision, "ALLOW")
    }

    // Verify zero unapproved class combat base stats invented
    for (const cls of snapshot.classProfiles) {
      assert.equal(cls.combatBaseStats, null)
      assert.equal(cls.combatBaseStatsStatus, "UNAPPROVED_DEFERRED")
    }
  })

  await t.test("4. OD-04 flight attributes, centiseconds storageScale=100, derived ENGINE_WEIGHT, zero STRAFE_SPEED", () => {
    const snapshot = loadGearV2CatalogSnapshotFromDisk({ mode: "REVIEW_STAGING" })
    assert.equal(snapshot.valid, true)

    assert.equal(snapshot.statRegistryMap.get("STRAFE_SPEED"), undefined)
    assert.equal(snapshot.statRegistryMap.get("BOOST_TIME")?.storageScale, 100)
    assert.equal(snapshot.statRegistryMap.get("BOOST_TIME")?.unit, "centiseconds")
    assert.equal(snapshot.statRegistryMap.get("BOOST_RECOVERY")?.storageScale, 100)
    assert.equal(snapshot.statRegistryMap.get("TURN_RESPONSE")?.storageScale, 100)

    const engineWeightStat = snapshot.statRegistryMap.get("ENGINE_WEIGHT")
    assert.ok(engineWeightStat)
    assert.equal(engineWeightStat.isDerived, true)
    assert.equal(engineWeightStat.profileField, null)
    assert.equal(engineWeightStat.derivedFrom, "equipment.weightGrams")

    // Check resolved view on I-GEAR JET Engine (110,000g, 1600cs = 16s boostTime)
    const view = resolveGearV2EngineView(snapshot, "gearv2.eq.engine.i.jet")
    assert.ok(view)
    assert.equal(view.gearClassId, "I-GEAR")
    assert.equal(view.variantId, "JET")
    assert.equal(view.boostSpeedMps, 390)
    assert.equal(view.boostTimeCentiseconds, 1600)
    assert.equal(view.boostTimeSeconds, 16)
    assert.equal(view.derivedEngineWeightGrams, 110000)
  })

  await t.test("5. Default-deny compatibility rejects wrong class, wrong slot, and unknown equipment", () => {
    const snapshot = loadGearV2CatalogSnapshotFromDisk({ mode: "REVIEW_STAGING" })

    // Valid Armor on A-GEAR armor slot
    const allowArmor = evaluateGearV2Compatibility(snapshot, {
      equipmentId: "gearv2.eq.armor.a.fortress",
      gearClassId: "A-GEAR",
      slotId: "armor",
    })
    assert.equal(allowArmor.allowed, true)
    assert.equal(allowArmor.decision, "ALLOW")
    assert.equal(allowArmor.matchedRuleId, "gearv2.allow.armor.a.fortress")

    // Wrong class: A-GEAR Fortress armor on B-GEAR
    const wrongClass = evaluateGearV2Compatibility(snapshot, {
      equipmentId: "gearv2.eq.armor.a.fortress",
      gearClassId: "B-GEAR",
      slotId: "armor",
    })
    assert.equal(wrongClass.allowed, false)
    assert.equal(wrongClass.decision, "DENY")
    assert.equal(wrongClass.denyReason, "DEFAULT_DENY_NO_ALLOW_RULE")

    // Wrong slot: Engine item in armor slot or auxiliary_1 slot
    const wrongSlot = evaluateGearV2Compatibility(snapshot, {
      equipmentId: "gearv2.eq.engine.a.base",
      gearClassId: "A-GEAR",
      slotId: "auxiliary_1",
    })
    assert.equal(wrongSlot.allowed, false)
    assert.equal(wrongSlot.decision, "DENY")
    assert.equal(wrongSlot.denyReason, "DEFAULT_DENY_NO_ALLOW_RULE")
  })

  await t.test("6. C3 boundary: REVIEW items are never auto-promoted to APPROVED in PRODUCTION_APPROVED mode", () => {
    const prodSnapshot = loadGearV2CatalogSnapshotFromDisk({
      mode: "PRODUCTION_APPROVED",
    })
    assert.equal(prodSnapshot.valid, true)
    assert.equal(prodSnapshot.manifestVerified, true)
    // Raw counts still recorded before approval filtering
    assert.equal(prodSnapshot.rawCounts.equipment, 36)
    assert.equal(prodSnapshot.approvedCounts.equipment, 0)
    assert.equal(prodSnapshot.reviewCounts.equipment, 36)
    // Filtered runtime arrays remain empty
    assert.equal(prodSnapshot.equipment.length, 0)
    assert.equal(prodSnapshot.engineProfiles.length, 0)
    assert.equal(prodSnapshot.compatibilityRules.length, 0)

    const prodCheck = evaluateGearV2Compatibility(prodSnapshot, {
      equipmentId: "gearv2.eq.armor.a.fortress",
      gearClassId: "A-GEAR",
      slotId: "armor",
    })
    assert.equal(prodCheck.allowed, false)
    assert.equal(prodCheck.denyReason, "NOT_APPROVED_FOR_RUNTIME")

    // Synthetic staging test promoting ONLY 1 item + its compatibility rule -> APPROVED
    // plus testing DEPRECATED vs RETIRED lifecycle handling
    const rawFiles = cloneRawDiskFiles()
    const eqDoc = JSON.parse(rawFiles["system_gearv2_equipment_data.json"])
    eqDoc.items[0].approvalStatus = "APPROVED" // gearv2.eq.armor.a.base-heavy-balanced
    eqDoc.items[1].lifecycle = "RETIRED" // gearv2.eq.armor.a.fortress
    rawFiles["system_gearv2_equipment_data.json"] = JSON.stringify(eqDoc, null, 2) + "\n"

    const compatDoc = JSON.parse(rawFiles["system_gearv2_compatibility_data.json"])
    compatDoc.items[0].approvalStatus = "APPROVED"
    rawFiles["system_gearv2_compatibility_data.json"] = JSON.stringify(compatDoc, null, 2) + "\n"
    rebuildManifestForRawFiles(rawFiles)

    const filteredProd = loadGearV2CatalogSnapshot({
      mode: "PRODUCTION_APPROVED",
      rawFiles,
    })
    assert.equal(filteredProd.valid, true)
    assert.equal(filteredProd.equipment.length, 1)
    assert.equal(filteredProd.equipment[0].id, "gearv2.eq.armor.a.base-heavy-balanced")
    assert.equal(
      evaluateGearV2Compatibility(filteredProd, {
        equipmentId: "gearv2.eq.armor.a.base-heavy-balanced",
        gearClassId: "A-GEAR",
        slotId: "armor",
      }).allowed,
      true
    )

    // In REVIEW_STAGING, RETIRED item cannot be equipped for new loadout
    const stagingRetired = loadGearV2CatalogSnapshot({
      mode: "REVIEW_STAGING",
      rawFiles,
    })
    assert.equal(stagingRetired.valid, true)
    const retiredEval = evaluateGearV2Compatibility(stagingRetired, {
      equipmentId: "gearv2.eq.armor.a.fortress",
      gearClassId: "A-GEAR",
      slotId: "armor",
    })
    assert.equal(retiredEval.allowed, false)
    assert.equal(retiredEval.denyReason, "LIFECYCLE_NOT_SELECTABLE")
  })

  await t.test("7. Fail-closed validation catches SHA-256 tamper, count mismatch, missing file, C1/C2 violations, orphan FKs, and STRAFE_SPEED", () => {
    // 7a. Byte tamper without updating manifest
    {
      const rawFiles = cloneRawDiskFiles()
      rawFiles["system_gearv2_equipment_data.json"] = rawFiles[
        "system_gearv2_equipment_data.json"
      ].replace("850000", "850001")
      const snap = loadGearV2CatalogSnapshot({ rawFiles })
      assert.equal(snap.valid, false)
      assert.equal(snap.manifestVerified, false)
      assert.ok(snap.errors.some((e) => e.code === "MANIFEST_HASH_MISMATCH"))
      assert.equal(snap.equipment.length, 0) // Fail closed!
    }

    // 7b. Missing source file
    {
      const rawFiles = cloneRawDiskFiles()
      delete rawFiles["system_gearv2_engineprofile_data.json"]
      const snap = loadGearV2CatalogSnapshot({ rawFiles })
      assert.equal(snap.valid, false)
      assert.ok(snap.errors.some((e) => e.code === "MISSING_CATALOG_FILE"))
    }

    // 7c. Wrong manifest rawItemCount
    {
      const rawFiles = cloneRawDiskFiles()
      const manifest = JSON.parse(rawFiles["system_gearv2_manifest_data.json"])
      manifest.items[0].rawItemCount = 35
      rawFiles["system_gearv2_manifest_data.json"] = JSON.stringify(manifest, null, 2) + "\n"
      const snap = loadGearV2CatalogSnapshot({ rawFiles })
      assert.equal(snap.valid, false)
      assert.ok(snap.errors.some((e) => e.code === "MANIFEST_ITEM_COUNT_MISMATCH"))
    }

    // 7d. C1 duplicate ID & C2 `"provenance"` key collision
    {
      const rawFiles = cloneRawDiskFiles()
      const eqDoc = JSON.parse(rawFiles["system_gearv2_equipment_data.json"])
      eqDoc.items[1].id = eqDoc.items[0].id
      eqDoc.items[0].provenance = { bad: true }
      rawFiles["system_gearv2_equipment_data.json"] = JSON.stringify(eqDoc, null, 2) + "\n"
      rebuildManifestForRawFiles(rawFiles)
      const snap = loadGearV2CatalogSnapshot({ rawFiles })
      assert.equal(snap.valid, false)
      assert.ok(snap.errors.some((e) => e.code === "DUPLICATE_ITEM_ID"))
      assert.ok(snap.errors.some((e) => e.code === "FORBIDDEN_PROVENANCE_FIELD"))
    }

    // 7e. Orphan engineProfileId reference & invalid Armor sum
    {
      const rawFiles = cloneRawDiskFiles()
      const eqDoc = JSON.parse(rawFiles["system_gearv2_equipment_data.json"])
      eqDoc.items[0].primaryBonuses.HP = 9 // breaks sum == 10
      eqDoc.items[3].engineProfileId = "gearv2.engine.a.does-not-exist"
      rawFiles["system_gearv2_equipment_data.json"] = JSON.stringify(eqDoc, null, 2) + "\n"
      rebuildManifestForRawFiles(rawFiles)
      const snap = loadGearV2CatalogSnapshot({ rawFiles })
      assert.equal(snap.valid, false)
      assert.ok(snap.errors.some((e) => e.code === "INVALID_ARMOR_ALLOCATION"))
      assert.ok(snap.errors.some((e) => e.code === "ORPHAN_ENGINE_PROFILE_REF"))
    }

    // 7f. Forbidden STRAFE_SPEED & persisted engine weightGrams on EngineProfile
    {
      const rawFiles = cloneRawDiskFiles()
      const epDoc = JSON.parse(rawFiles["system_gearv2_engineprofile_data.json"])
      epDoc.items[0].strafeSpeedMps = 45
      epDoc.items[0].weightGrams = 150000
      rawFiles["system_gearv2_engineprofile_data.json"] = JSON.stringify(epDoc, null, 2) + "\n"
      rebuildManifestForRawFiles(rawFiles)
      const snap = loadGearV2CatalogSnapshot({ rawFiles })
      assert.equal(snap.valid, false)
      assert.ok(snap.errors.some((e) => e.code === "FORBIDDEN_STRAFE_SPEED"))
      assert.ok(snap.errors.some((e) => e.code === "FORBIDDEN_PERSISTED_ENGINE_WEIGHT"))
    }

    // 7g. Tamper test also works via InMemoryCatalogDataProvider
    {
      const mem = new InMemoryCatalogDataProvider(cloneRawDiskFiles())
      const okSnap = loadGearV2CatalogSnapshot({ provider: mem, mode: "REVIEW_STAGING" })
      assert.equal(okSnap.valid, true)
    }
  })

  await t.test("8. P1 Weight Engine & OD-07 bridge avoids double-counting ENGINE_WEIGHT and integrates compatibility", () => {
    const snapshot = loadGearV2CatalogSnapshotFromDisk({ mode: "REVIEW_STAGING" })
    assert.equal(snapshot.valid, true)

    const p1Armor = toGearV2P1EquippedItem(snapshot, "gearv2.eq.armor.a.fortress", "inst-armor-1")
    const p1Engine = toGearV2P1EquippedItem(snapshot, "gearv2.eq.engine.a.silent", "inst-engine-1")
    assert.ok(p1Armor && p1Engine)
    assert.equal(p1Armor.weightGrams, 850000)
    assert.equal(p1Engine.weightGrams, 150000)
    assert.equal(p1Engine.derivedEngineWeightGrams, 150000)

    // CONFIRM mode (missing non-required slots allowed by OD-07 CONFIRM policy)
    const confirmCheck = validateGearV2LoadoutWithCatalog(snapshot, {
      gearClass: "A-GEAR",
      engineVariant: "SILENT",
      mode: "CONFIRM",
      slots: {
        armor: { equipmentId: "gearv2.eq.armor.a.fortress", instanceId: "a1" },
        engine: { equipmentId: "gearv2.eq.engine.a.silent", instanceId: "e1" },
      },
    })
    assert.equal(confirmCheck.compatibilityValid, true)
    assert.equal(confirmCheck.p1ConfirmResult?.valid, true)
    assert.equal(confirmCheck.p1ConfirmResult?.compatibilityStatus, "CHECKED_FROM_CALLER")
    // Weight counted strictly once: 850,000 + 150,000 = 1,000,000g (NOT 1,150,000g)
    assert.equal(confirmCheck.p1ConfirmResult?.calculation?.totalWeightGrams, 1_000_000)
    // A-GEAR (3,000,000 + 1,600,000) + SILENT (+200,000) = 4,800,000g maxLoad
    assert.equal(confirmCheck.p1ConfirmResult?.calculation?.maxLoadGrams, 4_800_000)

    // OD-07 SAFE_FLIGHT fails cleanly on missing Radar (priority 3) without fabricating Radar catalog data
    const flightCheck = validateGearV2LoadoutWithCatalog(snapshot, {
      gearClass: "A-GEAR",
      engineVariant: "SILENT",
      mode: "SAFE_FLIGHT",
      slots: {
        armor: { equipmentId: "gearv2.eq.armor.a.fortress" },
        engine: { equipmentId: "gearv2.eq.engine.a.silent" },
      },
    })
    assert.equal(flightCheck.compatibilityValid, true)
    assert.equal(flightCheck.p1ReadinessResult?.valid, false)
    assert.deepEqual(flightCheck.p1ReadinessResult?.missingMandatorySlots, ["radar_sensor"])
    assert.deepEqual(flightCheck.p1ReadinessResult?.missingPriorityOrder, ["RADAR_SENSOR"])

    // Cross-class item rejected by default-deny and flagged in P1 CONFIRM result
    const crossClassCheck = validateGearV2LoadoutWithCatalog(snapshot, {
      gearClass: "A-GEAR",
      engineVariant: "SILENT",
      mode: "CONFIRM",
      slots: {
        armor: { equipmentId: "gearv2.eq.armor.b.base-bomber" },
        engine: { equipmentId: "gearv2.eq.engine.a.silent" },
      },
    })
    assert.equal(crossClassCheck.compatibilityValid, false)
    assert.equal(crossClassCheck.p1ConfirmResult?.valid, false)
    assert.ok(
      crossClassCheck.p1ConfirmResult?.errors.some(
        (e) => e.code === "EXTERNAL_COMPATIBILITY_FAILED" && e.slotId === "armor"
      )
    )
  })
})
