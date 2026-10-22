/**
 * STARFRONT WORLD — Phase 6.34A-FND-1 Shared Catalog / Master Data Test Suite
 *
 * Verifies all 20 required test cases:
 * 1. INLINE root load
 * 2. SPLIT root load
 * 3. Recursive SPLIT
 * 4. Invalid child prefix
 * 5. Ancestor/cycle reference
 * 6. Missing partition
 * 7. Malformed partition
 * 8. Duplicate SYSTEM ID
 * 9. Duplicate USER ID
 * 10. USER ID collides with SYSTEM ID
 * 11. SYSTEM + field-level USER override
 * 12. RESET override
 * 13. User item invalid -> skip only that item
 * 14. System item invalid -> omit item, WORLD/catalog continues
 * 15. Root missing -> empty catalog, no crash
 * 16. Provenance correctness
 * 17. ACTIVE / DEPRECATED / RETIRED behavior
 * 18. Additive schema compatibility
 * 19. Derived values are not persisted as canonical source fields
 * 20. Deterministic resolve result
 */

import test from "node:test"
import assert from "node:assert/strict"
import {
  CatalogRegistry,
  InMemoryCatalogDataProvider,
  addUserCustomItem,
  applyUserOverride,
  canSelectForNewInstance,
  containsDerivedFields,
  defaultCatalogRegistry,
  filterSelectableItems,
  getCatalog,
  getItem,
  getResolvedItems,
  isItemDeprecated,
  isItemRetired,
  loadCatalogTree,
  resetUserOverride,
  resolveById,
  resolveCatalog,
  stripDerivedFields,
  validateChildPrefix,
} from "../../lib/game/world/catalog"
import type {
  CatalogNodeFile,
  UserCatalogFile,
} from "../../lib/game/world/catalog/types"

interface TestShipDef {
  id: string
  name: string
  baseCrew: number
  speed: number
  role?: string
  lifecycle?: "ACTIVE" | "DEPRECATED" | "RETIRED"
  // Derived fields that should not be persisted in master data
  currentCrew?: number
  requiredCrewMin?: number
  requiredCrewMax?: number
}

test("Phase 6.34A-FND-1: Shared Catalog Master Data Foundation", async (t) => {
  // 1. INLINE root load
  await t.test("1. INLINE root load successfully resolves all items", () => {
    const provider = new InMemoryCatalogDataProvider({
      "system_fleet_ship_definition_data.json": {
        configFileId: "system_fleet_ship_definition",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "INLINE",
        items: [
          { id: "SHIP_ALPHA", name: "Alpha Corvette", baseCrew: 50, speed: 120 },
          { id: "SHIP_BETA", name: "Beta Frigate", baseCrew: 150, speed: 90 },
        ],
      },
    })

    const loaded = loadCatalogTree<TestShipDef>("system_fleet_ship_definition_data.json", provider)
    assert.equal(loaded.items.length, 2)
    assert.equal(loaded.mode, "INLINE")
    assert.equal(loaded.diagnostics.length, 0)
    assert.equal(loaded.items[0].id, "SHIP_ALPHA")
    assert.equal(loaded.items[1].id, "SHIP_BETA")
  })

  // 2. SPLIT root load
  await t.test("2. SPLIT root load resolves partitions cleanly", () => {
    const provider = new InMemoryCatalogDataProvider({
      "system_fleet_ship_definition_data.json": {
        configFileId: "system_fleet_ship_definition",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "SPLIT",
        partitions: [
          { ref: "system_fleet_ship_definition_rescue_data.json" },
          { ref: "system_fleet_ship_definition_transport_data.json" },
        ],
      },
      "system_fleet_ship_definition_rescue_data.json": {
        configFileId: "system_fleet_ship_definition_rescue",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "INLINE",
        items: [{ id: "RESCUE_01", name: "Rapid Lifeboat", baseCrew: 10, speed: 200 }],
      },
      "system_fleet_ship_definition_transport_data.json": {
        configFileId: "system_fleet_ship_definition_transport",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "INLINE",
        items: [{ id: "TRANS_01", name: "Heavy Hauler", baseCrew: 80, speed: 70 }],
      },
    })

    const loaded = loadCatalogTree<TestShipDef>("system_fleet_ship_definition_data.json", provider)
    assert.equal(loaded.items.length, 2)
    assert.equal(loaded.mode, "SPLIT")
    assert.equal(loaded.items[0].id, "RESCUE_01")
    assert.equal(loaded.items[1].id, "TRANS_01")
  })

  // 3. Recursive SPLIT
  await t.test("3. Recursive SPLIT resolves multi-tier partition tree", () => {
    const provider = new InMemoryCatalogDataProvider({
      "system_fleet_ship_definition_data.json": {
        configFileId: "system_fleet_ship_definition",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "SPLIT",
        partitions: [{ ref: "system_fleet_ship_definition_combat_data.json" }],
      },
      "system_fleet_ship_definition_combat_data.json": {
        configFileId: "system_fleet_ship_definition_combat",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "SPLIT",
        partitions: [{ ref: "system_fleet_ship_definition_combat_cruisers_data.json" }],
      },
      "system_fleet_ship_definition_combat_cruisers_data.json": {
        configFileId: "system_fleet_ship_definition_combat_cruisers",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "INLINE",
        items: [{ id: "CRUISER_TITAN", name: "Titan Cruiser", baseCrew: 500, speed: 60 }],
      },
    })

    const loaded = loadCatalogTree<TestShipDef>("system_fleet_ship_definition_data.json", provider)
    assert.equal(loaded.items.length, 1)
    assert.equal(loaded.items[0].id, "CRUISER_TITAN")
    assert.equal(loaded.items[0].provenance.sourceCatalogId, "system_fleet_ship_definition_combat_cruisers")
  })

  // 4. Invalid child prefix
  await t.test("4. Invalid child prefix skips ref and logs diagnostic", () => {
    const provider = new InMemoryCatalogDataProvider({
      "system_fleet_ship_definition_data.json": {
        configFileId: "system_fleet_ship_definition",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "SPLIT",
        partitions: [
          // Invalid: jumping from fleet to building
          { ref: "system_building_definition_barracks_data.json" },
          // Valid child
          { ref: "system_fleet_ship_definition_valid_data.json" },
        ],
      },
      "system_building_definition_barracks_data.json": {
        configFileId: "system_building_definition_barracks",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "INLINE",
        items: [{ id: "BAR_01", name: "Barracks", baseCrew: 0, speed: 0 }],
      },
      "system_fleet_ship_definition_valid_data.json": {
        configFileId: "system_fleet_ship_definition_valid",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "INLINE",
        items: [{ id: "SHIP_VALID", name: "Valid Ship", baseCrew: 20, speed: 100 }],
      },
    })

    const loaded = loadCatalogTree<TestShipDef>("system_fleet_ship_definition_data.json", provider)
    assert.equal(loaded.items.length, 1)
    assert.equal(loaded.items[0].id, "SHIP_VALID")
    const prefixError = loaded.diagnostics.find((d) => d.code === "INVALID_CHILD_PREFIX")
    assert.ok(prefixError)
  })

  // 5. Ancestor/cycle reference
  await t.test("5. Cycle reference detected and skipped without crashing", () => {
    const provider = new InMemoryCatalogDataProvider({
      "system_fleet_ship_definition_data.json": {
        configFileId: "system_fleet_ship_definition",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "SPLIT",
        partitions: [{ ref: "system_fleet_ship_definition_loop_data.json" }],
      },
      "system_fleet_ship_definition_loop_data.json": {
        configFileId: "system_fleet_ship_definition_loop",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "SPLIT",
        partitions: [{ ref: "system_fleet_ship_definition_data.json" }], // Self-loop back to root!
      },
    })

    const loaded = loadCatalogTree<TestShipDef>("system_fleet_ship_definition_data.json", provider)
    const cycleDiag = loaded.diagnostics.find((d) => d.code === "CYCLE_DETECTED")
    assert.ok(cycleDiag)
  })

  // 6. Missing partition
  await t.test("6. Missing partition skips that partition; other partitions load", () => {
    const provider = new InMemoryCatalogDataProvider({
      "system_fleet_ship_definition_data.json": {
        configFileId: "system_fleet_ship_definition",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "SPLIT",
        partitions: [
          { ref: "system_fleet_ship_definition_missing_data.json" },
          { ref: "system_fleet_ship_definition_present_data.json" },
        ],
      },
      "system_fleet_ship_definition_present_data.json": {
        configFileId: "system_fleet_ship_definition_present",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "INLINE",
        items: [{ id: "PRESENT_01", name: "Present Ship", baseCrew: 30, speed: 110 }],
      },
    })

    const loaded = loadCatalogTree<TestShipDef>("system_fleet_ship_definition_data.json", provider)
    assert.equal(loaded.items.length, 1)
    assert.equal(loaded.items[0].id, "PRESENT_01")
    assert.ok(loaded.diagnostics.some((d) => d.code === "PARTITION_FILE_MISSING"))
  })

  // 7. Malformed partition
  await t.test("7. Malformed partition JSON is skipped; valid partitions load", () => {
    const provider = new InMemoryCatalogDataProvider({
      "system_fleet_ship_definition_data.json": {
        configFileId: "system_fleet_ship_definition",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "SPLIT",
        partitions: [
          { ref: "system_fleet_ship_definition_corrupt_data.json" },
          { ref: "system_fleet_ship_definition_good_data.json" },
        ],
      },
      "system_fleet_ship_definition_corrupt_data.json": "{ broken json syntax !!!",
      "system_fleet_ship_definition_good_data.json": {
        configFileId: "system_fleet_ship_definition_good",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "INLINE",
        items: [{ id: "GOOD_01", name: "Good Ship", baseCrew: 40, speed: 100 }],
      },
    })

    const loaded = loadCatalogTree<TestShipDef>("system_fleet_ship_definition_data.json", provider)
    assert.equal(loaded.items.length, 1)
    assert.equal(loaded.items[0].id, "GOOD_01")
    assert.ok(loaded.diagnostics.some((d) => d.code === "PARTITION_FILE_MALFORMED"))
  })

  // 8. Duplicate SYSTEM ID
  await t.test("8. Duplicate SYSTEM ID is rejected without silent overwrite", () => {
    const provider = new InMemoryCatalogDataProvider({
      "system_fleet_ship_definition_data.json": {
        configFileId: "system_fleet_ship_definition",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "INLINE",
        items: [
          { id: "SHIP_A", name: "Original Ship A", baseCrew: 100, speed: 50 },
          { id: "SHIP_A", name: "Duplicate Imposter Ship A", baseCrew: 999, speed: 999 },
        ],
      },
    })

    const loaded = loadCatalogTree<TestShipDef>("system_fleet_ship_definition_data.json", provider)
    const resolved = resolveCatalog<TestShipDef>(loaded, null)

    assert.equal(resolved.items.length, 1)
    assert.equal(resolved.items[0].name, "Original Ship A") // Original kept
    assert.ok(resolved.diagnostics.some((d) => d.code === "DUPLICATE_SYSTEM_ID"))
  })

  // 9. Duplicate USER ID
  await t.test("9. Duplicate USER ID in custom items is rejected", () => {
    const provider = new InMemoryCatalogDataProvider({
      "system_fleet_ship_definition_data.json": {
        configFileId: "system_fleet_ship_definition",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "INLINE",
        items: [{ id: "SHIP_SYS", name: "System Ship", baseCrew: 100, speed: 50 }],
      },
    })

    const loaded = loadCatalogTree<TestShipDef>("system_fleet_ship_definition_data.json", provider)
    const userFile: UserCatalogFile<TestShipDef> = {
      configFileId: "user_fleet_ship_definition",
      schemaVersion: 1,
      dataVersion: 1,
      overrides: [],
      customItems: [
        { id: "CUSTOM_X", name: "Custom First", baseCrew: 200, speed: 80 },
        { id: "CUSTOM_X", name: "Custom Duplicate", baseCrew: 300, speed: 90 },
      ],
    }

    const resolved = resolveCatalog<TestShipDef>(loaded, userFile)
    assert.equal(resolved.items.length, 2) // SHIP_SYS + first CUSTOM_X
    assert.equal(resolved.itemMap.get("CUSTOM_X")?.name, "Custom First")
    assert.ok(resolved.diagnostics.some((d) => d.code === "DUPLICATE_USER_ID"))
  })

  // 10. USER ID collides with SYSTEM ID
  await t.test("10. USER item ID colliding with SYSTEM ID is rejected", () => {
    const provider = new InMemoryCatalogDataProvider({
      "system_fleet_ship_definition_data.json": {
        configFileId: "system_fleet_ship_definition",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "INLINE",
        items: [{ id: "SHIP_CANONICAL", name: "Canonical Ship", baseCrew: 100, speed: 50 }],
      },
    })

    const loaded = loadCatalogTree<TestShipDef>("system_fleet_ship_definition_data.json", provider)
    const userFile: UserCatalogFile<TestShipDef> = {
      configFileId: "user_fleet_ship_definition",
      schemaVersion: 1,
      dataVersion: 1,
      overrides: [],
      customItems: [
        { id: "SHIP_CANONICAL", name: "Illegal Colliding Custom", baseCrew: 999, speed: 999 },
      ],
    }

    const resolved = resolveCatalog<TestShipDef>(loaded, userFile)
    assert.equal(resolved.items.length, 1)
    assert.equal(resolved.items[0].name, "Canonical Ship")
    assert.ok(resolved.diagnostics.some((d) => d.code === "USER_ID_COLLIDES_WITH_SYSTEM_ID"))
  })

  // 11. SYSTEM + field-level USER override
  await t.test("11. Field-level USER override modifies only specified fields", () => {
    const provider = new InMemoryCatalogDataProvider({
      "system_fleet_ship_definition_data.json": {
        configFileId: "system_fleet_ship_definition",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "INLINE",
        items: [{ id: "SHIP_A", name: "Original Name", baseCrew: 200, speed: 100 }],
      },
    })

    const loaded = loadCatalogTree<TestShipDef>("system_fleet_ship_definition_data.json", provider)
    const userFile: UserCatalogFile<TestShipDef> = {
      configFileId: "user_fleet_ship_definition",
      schemaVersion: 1,
      dataVersion: 1,
      overrides: [
        {
          targetId: "SHIP_A",
          modifiedData: { baseCrew: 250 }, // only baseCrew modified!
          modifiedAt: "2026-10-16T12:00:00Z",
        },
      ],
      customItems: [],
    }

    const resolved = resolveCatalog<TestShipDef>(loaded, userFile)
    const item = resolved.itemMap.get("SHIP_A")!

    assert.equal(item.baseCrew, 250) // overridden
    assert.equal(item.speed, 100) // unmodified preserved from canonical
    assert.equal(item.name, "Original Name") // unmodified preserved
    assert.equal(item.provenance.isOverridden, true)
    assert.equal(item.provenance.overrideSource, "user_fleet_ship_definition")
    assert.equal(item._canonical?.baseCrew, 200) // init preserved
  })

  // 12. RESET override
  await t.test("12. RESET override returns item to canonical default", () => {
    let userFile: UserCatalogFile<TestShipDef> = {
      configFileId: "user_fleet_ship_definition",
      schemaVersion: 1,
      dataVersion: 1,
      overrides: [
        { targetId: "SHIP_A", modifiedData: { speed: 180 }, modifiedAt: "2026-10-16T12:00:00Z" },
      ],
      customItems: [],
    }

    userFile = resetUserOverride(userFile, "SHIP_A")
    assert.equal(userFile.overrides.length, 0)

    const provider = new InMemoryCatalogDataProvider({
      "system_fleet_ship_definition_data.json": {
        configFileId: "system_fleet_ship_definition",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "INLINE",
        items: [{ id: "SHIP_A", name: "Ship A", baseCrew: 200, speed: 100 }],
      },
    })
    const loaded = loadCatalogTree<TestShipDef>("system_fleet_ship_definition_data.json", provider)
    const resolved = resolveCatalog<TestShipDef>(loaded, userFile)

    assert.equal(resolved.itemMap.get("SHIP_A")?.speed, 100)
    assert.equal(resolved.itemMap.get("SHIP_A")?.provenance.isOverridden, undefined)
  })

  // 13. User item invalid -> skip only that item
  await t.test("13. User item invalid skips only that item without failing catalog", () => {
    const provider = new InMemoryCatalogDataProvider({
      "system_fleet_ship_definition_data.json": {
        configFileId: "system_fleet_ship_definition",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "INLINE",
        items: [{ id: "SYS_1", name: "System 1", baseCrew: 10, speed: 10 }],
      },
    })

    const loaded = loadCatalogTree<TestShipDef>("system_fleet_ship_definition_data.json", provider)
    const userFile: UserCatalogFile<any> = {
      configFileId: "user_fleet_ship_definition",
      schemaVersion: 1,
      dataVersion: 1,
      overrides: [],
      customItems: [
        { name: "No ID custom item", baseCrew: 20 }, // Missing id!
        { id: "VALID_USER_1", name: "Valid Custom 1", baseCrew: 30, speed: 40 },
      ],
    }

    const resolved = resolveCatalog<TestShipDef>(loaded, userFile)
    assert.equal(resolved.items.length, 2) // SYS_1 and VALID_USER_1
    assert.ok(resolved.diagnostics.some((d) => d.code === "USER_ITEM_MISSING_ID"))
  })

  // 14. System item invalid -> omit item, WORLD continues
  await t.test("14. System item invalid is omitted while rest of catalog loads", () => {
    const provider = new InMemoryCatalogDataProvider({
      "system_fleet_ship_definition_data.json": {
        configFileId: "system_fleet_ship_definition",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "INLINE",
        items: [
          { name: "Corrupt Item without ID", baseCrew: 10 },
          { id: "SYS_VALID", name: "Valid Item", baseCrew: 20, speed: 30 },
        ],
      },
    })

    const loaded = loadCatalogTree<TestShipDef>("system_fleet_ship_definition_data.json", provider)
    assert.equal(loaded.items.length, 1)
    assert.equal(loaded.items[0].id, "SYS_VALID")
    assert.ok(loaded.diagnostics.some((d) => d.code === "ITEM_MISSING_ID"))
  })

  // 15. Root missing -> empty catalog, no crash
  await t.test("15. Root file missing returns empty catalog without throwing exception", () => {
    const provider = new InMemoryCatalogDataProvider({}) // completely empty!
    const loaded = loadCatalogTree<TestShipDef>("system_fleet_ship_definition_data.json", provider)
    assert.equal(loaded.items.length, 0)
    assert.ok(loaded.diagnostics.some((d) => d.code === "ROOT_FILE_MISSING"))
  })

  // 16. Provenance correctness
  await t.test("16. Provenance correctly tracks source file, versions, and overrides", () => {
    const provider = new InMemoryCatalogDataProvider({
      "system_fleet_ship_definition_data.json": {
        configFileId: "system_fleet_ship_definition",
        schemaVersion: 1,
        dataVersion: 5,
        mode: "INLINE",
        items: [{ id: "SHIP_PROV", name: "Provenance Ship", baseCrew: 50, speed: 50 }],
      },
    })

    const loaded = loadCatalogTree<TestShipDef>("system_fleet_ship_definition_data.json", provider)
    const userFile: UserCatalogFile<TestShipDef> = {
      configFileId: "user_fleet_ship_definition",
      schemaVersion: 1,
      dataVersion: 2,
      overrides: [
        {
          targetId: "SHIP_PROV",
          modifiedData: { speed: 85 },
          modifiedAt: "2026-10-16T15:30:00Z",
        },
      ],
      customItems: [
        { id: "USER_PROV", name: "User Provenance Ship", baseCrew: 90, speed: 45 },
      ],
    }

    const resolved = resolveCatalog<TestShipDef>(loaded, userFile)
    const sysItem = resolved.itemMap.get("SHIP_PROV")!
    const usrItem = resolved.itemMap.get("USER_PROV")!

    assert.equal(sysItem.provenance.sourceType, "SYSTEM")
    assert.equal(sysItem.provenance.sourceDataVersion, 5)
    assert.equal(sysItem.provenance.isOverridden, true)
    assert.equal(sysItem.provenance.overrideSource, "user_fleet_ship_definition")
    assert.equal(sysItem.provenance.modifiedAt, "2026-10-16T15:30:00Z")

    assert.equal(usrItem.provenance.sourceType, "USER")
    assert.equal(usrItem.provenance.sourceDataVersion, 2)
  })

  // 17. ACTIVE / DEPRECATED / RETIRED behavior
  await t.test("17. Item lifecycle correctly distinguishes ACTIVE, DEPRECATED, and RETIRED", () => {
    const items: any[] = [
      { id: "SHIP_ACT", name: "Active Cruiser", lifecycle: "ACTIVE" },
      { id: "SHIP_DEP", name: "Old Frigate", lifecycle: "DEPRECATED" },
      { id: "SHIP_RET", name: "Legacy Dreadnought", lifecycle: "RETIRED" },
    ]

    assert.equal(canSelectForNewInstance(items[0].lifecycle), true)
    assert.equal(canSelectForNewInstance(items[1].lifecycle), false)
    assert.equal(isItemDeprecated(items[1].lifecycle), true)
    assert.equal(canSelectForNewInstance(items[2].lifecycle), false)
    assert.equal(isItemRetired(items[2].lifecycle), true)

    // Selector filter omitting RETIRED
    const selectable = filterSelectableItems(items)
    assert.equal(selectable.length, 2)
    assert.ok(!selectable.some((i) => i.id === "SHIP_RET"))
  })

  // 18. Additive schema compatibility
  await t.test("18. Additive schema allows new fields without breaking V1 readers", () => {
    const provider = new InMemoryCatalogDataProvider({
      "system_fleet_ship_definition_data.json": {
        configFileId: "system_fleet_ship_definition",
        schemaVersion: 2, // V2 schema with new additive fields
        dataVersion: 3,
        mode: "INLINE",
        items: [
          {
            id: "SHIP_V2",
            name: "V2 Ship",
            baseCrew: 100, // V1 field
            speed: 80, // V1 field
            plasmaShieldCapacity: 500, // V2 additive field
            jumpDriveType: "HYPERLANE_CLASS_3", // V2 additive field
          },
        ],
      },
    })

    const loaded = loadCatalogTree<any>("system_fleet_ship_definition_data.json", provider)
    const resolved = resolveCatalog<any>(loaded, null)
    const item = resolved.itemMap.get("SHIP_V2")!

    // V1 reader can read baseCrew and speed
    assert.equal(item.baseCrew, 100)
    assert.equal(item.speed, 80)
    // V2 reader can read new additive fields
    assert.equal(item.plasmaShieldCapacity, 500)
    assert.equal(item.jumpDriveType, "HYPERLANE_CLASS_3")
  })

  // 19. Derived values are not persisted as canonical source fields
  await t.test("19. Derived fields are stripped from user overrides and custom items", () => {
    const rawUserItem: TestShipDef = {
      id: "CUSTOM_STRIP",
      name: "Custom Strip",
      baseCrew: 200,
      speed: 100,
      // Derived fields:
      currentCrew: 195,
      requiredCrewMin: 100,
      requiredCrewMax: 300,
    }

    const stripped = stripDerivedFields(rawUserItem, [
      "currentCrew",
      "requiredCrewMin",
      "requiredCrewMax",
    ])

    assert.equal(stripped.id, "CUSTOM_STRIP")
    assert.equal(stripped.baseCrew, 200)
    assert.equal((stripped as any).currentCrew, undefined)
    assert.equal((stripped as any).requiredCrewMin, undefined)
    assert.equal((stripped as any).requiredCrewMax, undefined)
    assert.equal(containsDerivedFields(stripped, ["currentCrew"]).hasDerived, false)
  })

  // 20. Deterministic resolve result
  await t.test("20. Deterministic resolve produces identical outputs across multiple runs", () => {
    const provider = new InMemoryCatalogDataProvider({
      "system_fleet_ship_definition_data.json": {
        configFileId: "system_fleet_ship_definition",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "INLINE",
        items: [
          { id: "SHIP_B", name: "B", baseCrew: 100, speed: 50 },
          { id: "SHIP_A", name: "A", baseCrew: 200, speed: 75 },
        ],
      },
    })

    const userFile: UserCatalogFile<TestShipDef> = {
      configFileId: "user_fleet_ship_definition",
      schemaVersion: 1,
      dataVersion: 1,
      overrides: [{ targetId: "SHIP_B", modifiedData: { speed: 60 }, modifiedAt: "2026-10-16" }],
      customItems: [{ id: "SHIP_C", name: "C", baseCrew: 300, speed: 90 }],
    }

    const loaded1 = loadCatalogTree<TestShipDef>("system_fleet_ship_definition_data.json", provider)
    const res1 = resolveCatalog<TestShipDef>(loaded1, userFile)

    const loaded2 = loadCatalogTree<TestShipDef>("system_fleet_ship_definition_data.json", provider)
    const res2 = resolveCatalog<TestShipDef>(loaded2, userFile)

    assert.deepEqual(
      res1.items.map((i) => ({ id: i.id, speed: i.speed, isOverridden: i.provenance.isOverridden })),
      res2.items.map((i) => ({ id: i.id, speed: i.speed, isOverridden: i.provenance.isOverridden }))
    )
  })

  // Additional integration: CatalogRegistry singleton and setOverride/resetOverride flow
  await t.test("21. CatalogRegistry full roundtrip with setOverride, addCustomItem, and diagnostics", () => {
    const provider = new InMemoryCatalogDataProvider({
      "system_fleet_ship_definition_data.json": {
        configFileId: "system_fleet_ship_definition",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "INLINE",
        items: [{ id: "DEF_01", name: "Defender", baseCrew: 100, speed: 50 }],
      },
    })

    const registry = new CatalogRegistry(provider)
    registry.registerCatalog<TestShipDef>({
      domain: "fleet",
      catalogName: "ship_definition",
    })

    // Initial load
    let cat = registry.getCatalog<TestShipDef>("fleet", "ship_definition")
    assert.equal(cat.items.length, 1)
    assert.equal(cat.items[0].speed, 50)

    // Apply AdminCP override
    cat = registry.setOverride<TestShipDef>("fleet", "ship_definition", "DEF_01", { speed: 88 })
    assert.equal(cat.itemMap.get("DEF_01")?.speed, 88)
    assert.equal(cat.itemMap.get("DEF_01")?.provenance.isOverridden, true)

    // Add custom item
    const addRes = registry.addCustomItem<TestShipDef>("fleet", "ship_definition", {
      id: "CUSTOM_DEF_02",
      name: "Custom Defender",
      baseCrew: 120,
      speed: 95,
    })
    assert.equal(addRes.success, true)
    assert.equal(addRes.catalog?.items.length, 2)

    // Reset override
    cat = registry.resetOverride<TestShipDef>("fleet", "ship_definition", "DEF_01")
    assert.equal(cat.itemMap.get("DEF_01")?.speed, 50)
    assert.equal(cat.itemMap.get("DEF_01")?.provenance.isOverridden, undefined)
  })

  // 22. Unified Resolved API: getItem, resolveById, getResolvedItems
  await t.test("22. Unified Resolved API provides clean consumer access without exposing JSON/partitions", () => {
    const provider = new InMemoryCatalogDataProvider({
      "system_fleet_ship_definition_data.json": {
        configFileId: "system_fleet_ship_definition",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "SPLIT",
        partitions: [{ ref: "system_fleet_ship_definition_combat_data.json" }],
      },
      "system_fleet_ship_definition_combat_data.json": {
        configFileId: "system_fleet_ship_definition_combat",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "INLINE",
        items: [
          { id: "SHIP_ACTIVE", name: "Active Ship", baseCrew: 50, speed: 100, lifecycle: "ACTIVE" },
          { id: "SHIP_OLD", name: "Deprecated Ship", baseCrew: 80, speed: 70, lifecycle: "DEPRECATED" },
          { id: "SHIP_LEGACY", name: "Retired Ship", baseCrew: 120, speed: 40, lifecycle: "RETIRED" },
        ],
      },
      "user_fleet_ship_definition_data.json": {
        configFileId: "user_fleet_ship_definition",
        schemaVersion: 1,
        dataVersion: 1,
        overrides: [
          { targetId: "SHIP_ACTIVE", modifiedData: { speed: 125 }, modifiedAt: "2026-10-17T08:00:00Z" },
        ],
        customItems: [
          { id: "SHIP_USER_CUSTOM", name: "User Custom Ship", baseCrew: 60, speed: 110, lifecycle: "ACTIVE" },
        ],
      },
    })

    const registry = new CatalogRegistry(provider)

    // Direct getItem
    const activeItem = registry.getItem<TestShipDef>("fleet", "ship_definition", "SHIP_ACTIVE")
    assert.ok(activeItem)
    assert.equal(activeItem.name, "Active Ship")
    assert.equal(activeItem.speed, 125) // override applied
    assert.equal(activeItem.provenance.isOverridden, true)
    assert.equal(activeItem._canonical?.speed, 100) // canonical untouched

    // resolveById alias
    const resolvedById = registry.resolveById<TestShipDef>("fleet", "ship_definition", "SHIP_USER_CUSTOM")
    assert.ok(resolvedById)
    assert.equal(resolvedById.provenance.sourceType, "USER")
    assert.equal(resolvedById.speed, 110)

    // Missing item returns undefined safely (no crash)
    const missingItem = registry.getItem<TestShipDef>("fleet", "ship_definition", "NON_EXISTENT_ID")
    assert.equal(missingItem, undefined)

    // getResolvedItems default (all 4 items)
    const allItems = registry.getResolvedItems<TestShipDef>("fleet", "ship_definition")
    assert.equal(allItems.length, 4)

    // getResolvedItems with lifecycle filtering (omit RETIRED)
    const selectableItems = registry.getResolvedItems<TestShipDef>("fleet", "ship_definition", {
      includeRetired: false,
    })
    assert.equal(selectableItems.length, 3)
    assert.ok(!selectableItems.some((i) => i.id === "SHIP_LEGACY"))

    // getResolvedItems filtered specifically to ACTIVE
    const onlyActive = registry.getResolvedItems<TestShipDef>("fleet", "ship_definition", {
      lifecycleFilter: "ACTIVE",
    })
    assert.equal(onlyActive.length, 2)
    assert.ok(onlyActive.every((i) => (i.lifecycle || "ACTIVE") === "ACTIVE"))

    // Verify top-level standalone consumer functions work with defaultCatalogRegistry
    defaultCatalogRegistry.setDataProvider(provider)
    const standaloneItem = getItem<TestShipDef>("fleet", "ship_definition", "SHIP_ACTIVE")
    assert.equal(standaloneItem?.id, "SHIP_ACTIVE")
    assert.equal(standaloneItem?.speed, 125)

    const standaloneResolved = resolveById<TestShipDef>("fleet", "ship_definition", "SHIP_OLD")
    assert.equal(standaloneResolved?.id, "SHIP_OLD")
    assert.equal(standaloneResolved?.lifecycle, "DEPRECATED")

    const standaloneList = getResolvedItems<TestShipDef>("fleet", "ship_definition")
    assert.equal(standaloneList.length, 4)
  })

  // 23. Error Behavior: root failure, partition failure, item failure
  await t.test("23. Robust error behavior: root/partition/item corruption never crashes WORLD", () => {
    // A. Root missing -> empty catalog, 0 items, WORLD continues
    const emptyProvider = new InMemoryCatalogDataProvider({})
    const emptyRegistry = new CatalogRegistry(emptyProvider)
    const missingCat = emptyRegistry.getCatalog<TestShipDef>("building", "station_definition")
    assert.equal(missingCat.items.length, 0)
    assert.ok(missingCat.diagnostics.some((d) => d.code === "ROOT_FILE_MISSING"))
    assert.equal(emptyRegistry.getItem<TestShipDef>("building", "station_definition", "ANY_ID"), undefined)

    // B. Child partition corrupt -> skipped, valid partition continues
    const corruptProvider = new InMemoryCatalogDataProvider({
      "system_gear_weapon_definition_data.json": {
        configFileId: "system_gear_weapon_definition",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "SPLIT",
        partitions: [
          { ref: "system_gear_weapon_definition_valid_data.json" },
          { ref: "system_gear_weapon_definition_corrupt_data.json" },
        ],
      },
      "system_gear_weapon_definition_valid_data.json": {
        configFileId: "system_gear_weapon_definition_valid",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "INLINE",
        items: [{ id: "WEAPON_01", name: "Laser Cannon", baseCrew: 0, speed: 0 }],
      },
      "system_gear_weapon_definition_corrupt_data.json": "{ MALFORMED_JSON",
    })
    const corruptRegistry = new CatalogRegistry(corruptProvider)
    const weaponCat = corruptRegistry.getCatalog<TestShipDef>("gear", "weapon_definition")
    assert.equal(weaponCat.items.length, 1)
    assert.equal(weaponCat.items[0].id, "WEAPON_01")
    assert.ok(weaponCat.diagnostics.some((d) => d.code === "PARTITION_FILE_MALFORMED"))

    // C. Item corrupt / missing id -> omitted, valid items load, item contribution = 0 (undefined)
    const malformedItemProvider = new InMemoryCatalogDataProvider({
      "system_module_shield_definition_data.json": {
        configFileId: "system_module_shield_definition",
        schemaVersion: 1,
        dataVersion: 1,
        mode: "INLINE",
        items: [
          { id: "SHIELD_OK", name: "Ok Shield", baseCrew: 0, speed: 0 },
          { name: "Shield without id", baseCrew: 0, speed: 0 }, // missing ID
          null, // corrupt non-object
        ],
      },
    })
    const malformedRegistry = new CatalogRegistry(malformedItemProvider)
    const shieldCat = malformedRegistry.getCatalog<TestShipDef>("module", "shield_definition")
    assert.equal(shieldCat.items.length, 1)
    assert.equal(shieldCat.items[0].id, "SHIELD_OK")
    assert.equal(malformedRegistry.getItem<TestShipDef>("module", "shield_definition", "SHIELD_MISSING"), undefined)
  })
})

