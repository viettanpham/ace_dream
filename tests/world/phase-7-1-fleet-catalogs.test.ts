/**
 * STARFRONT WORLD — Phase 7.1 Fleet Master Catalogs Test Suite
 *
 * Verifies:
 * 1. Registration of all 7 canonical fleet master catalogs in CatalogRegistry
 * 2. Idempotent bootstrapWorldCatalogs execution
 * 3. Exact matching between in-memory canonical seed data and disk JSON files
 * 4. Schema validation and required fields for all items
 * 5. Foreign Key referential integrity across Type -> Class -> Definition
 * 6. Policy profile parameters (360-day decay, 50% cap, 10x multiplier, 30% floor)
 * 7. FRAME Award catalog points and recipient types
 * 8. Strongly typed query helpers
 */

import test from "node:test"
import assert from "node:assert"
import fs from "node:fs"
import path from "node:path"

import { defaultCatalogRegistry, CatalogRegistry } from "../../lib/game/world/catalog/registry"
import { bootstrapWorldCatalogs } from "../../lib/game/world/bootstrap"
import {
  SYSTEM_DEFAULT_FLEET_TYPES,
  SYSTEM_DEFAULT_FLEET_CLASSES,
  SYSTEM_DEFAULT_SHIP_TYPES,
  SYSTEM_DEFAULT_SHIP_CLASSES,
  SYSTEM_DEFAULT_SHIP_DEFINITIONS,
  SYSTEM_DEFAULT_FLEET_POLICY_PROFILES,
  SYSTEM_DEFAULT_FRAME_AWARDS,
  registerFleetCatalogs,
  getFleetType,
  getFleetClass,
  getShipType,
  getShipClass,
  getShipDefinition,
  getFleetPolicyProfile,
  getFrameAward,
} from "../../lib/game/world/fleet/registry-integration"
import type {
  FleetClassDefinition,
  FleetPolicyProfile,
  FleetTypeDefinition,
  FrameAwardDefinition,
  ShipClassDefinition,
  ShipDefinition,
  ShipTypeDefinition,
} from "../../lib/game/world/fleet/catalog-types"

test("1. bootstrapWorldCatalogs registers all 7 Fleet master catalogs", () => {
  const result = bootstrapWorldCatalogs()
  assert.strictEqual(result.success, true)
  assert.strictEqual(result.fleetCatalogsRegistered, 7)
  assert.ok(result.totalCanonicalItems >= 70, `Expected total items >= 70, got ${result.totalCanonicalItems}`)

  // Verify all 7 catalogs can be retrieved from defaultCatalogRegistry
  const fleetTypes = defaultCatalogRegistry.getResolvedItems<FleetTypeDefinition>("fleet", "fleet_type")
  const fleetClasses = defaultCatalogRegistry.getResolvedItems<FleetClassDefinition>("fleet", "fleet_class")
  const shipTypes = defaultCatalogRegistry.getResolvedItems<ShipTypeDefinition>("fleet", "ship_type")
  const shipClasses = defaultCatalogRegistry.getResolvedItems<ShipClassDefinition>("fleet", "ship_class")
  const shipDefs = defaultCatalogRegistry.getResolvedItems<ShipDefinition>("fleet", "ship_definition")
  const policies = defaultCatalogRegistry.getResolvedItems<FleetPolicyProfile>("fleet", "policy_profile")
  const frameAwards = defaultCatalogRegistry.getResolvedItems<FrameAwardDefinition>("fleet", "frame_award_catalog")

  assert.strictEqual(fleetTypes.length, 4)
  assert.strictEqual(fleetClasses.length, 5)
  assert.strictEqual(shipTypes.length, 7)
  assert.strictEqual(shipClasses.length, 5)
  assert.strictEqual(shipDefs.length, 5)
  assert.strictEqual(policies.length, 1)
  assert.strictEqual(frameAwards.length, 4)
})

test("2. bootstrapWorldCatalogs is idempotent and safe to call multiple times", () => {
  const res1 = bootstrapWorldCatalogs()
  const res2 = bootstrapWorldCatalogs()

  assert.strictEqual(res1.success, true)
  assert.strictEqual(res2.success, true)
  assert.strictEqual(res2.isRebootstrap, true)
  assert.strictEqual(res1.fleetCatalogsRegistered, res2.fleetCatalogsRegistered)
  assert.strictEqual(res1.totalCanonicalItems, res2.totalCanonicalItems)
})

test("3. All 7 disk JSON catalog files exist and parse valid JSON matching in-memory seed", () => {
  const catalogsDir = path.join(process.cwd(), "data", "catalogs")
  const fileCatalogMap: [string, any[]][] = [
    ["system_fleet_fleet_type_data.json", SYSTEM_DEFAULT_FLEET_TYPES],
    ["system_fleet_fleet_class_data.json", SYSTEM_DEFAULT_FLEET_CLASSES],
    ["system_fleet_ship_type_data.json", SYSTEM_DEFAULT_SHIP_TYPES],
    ["system_fleet_ship_class_data.json", SYSTEM_DEFAULT_SHIP_CLASSES],
    ["system_fleet_ship_definition_data.json", SYSTEM_DEFAULT_SHIP_DEFINITIONS],
    ["system_fleet_policy_profile_data.json", SYSTEM_DEFAULT_FLEET_POLICY_PROFILES],
    ["system_fleet_frame_award_catalog_data.json", SYSTEM_DEFAULT_FRAME_AWARDS],
  ]

  for (const [filename, expectedItems] of fileCatalogMap) {
    const filePath = path.join(catalogsDir, filename)
    assert.ok(fs.existsSync(filePath), `Catalog file missing on disk: ${filePath}`)

    const raw = fs.readFileSync(filePath, "utf-8")
    const parsed = JSON.parse(raw)

    assert.ok(parsed.configFileId, `${filename} missing configFileId`)
    assert.strictEqual(parsed.schemaVersion, 1)
    assert.strictEqual(parsed.dataVersion, 1)
    assert.strictEqual(parsed.mode, "INLINE")
    assert.ok(Array.isArray(parsed.items), `${filename} items must be an array`)
    assert.strictEqual(parsed.items.length, expectedItems.length, `${filename} item count mismatch`)

    const diskIds = parsed.items.map((i: any) => i.id)
    const expectedIds = expectedItems.map((i: any) => i.id)
    assert.deepStrictEqual(diskIds, expectedIds, `ID order mismatch in ${filename}`)
  }
})

test("4. Fleet Types schema & parameter validation", () => {
  for (const type of SYSTEM_DEFAULT_FLEET_TYPES) {
    assert.ok(type.id.startsWith("FLEET_TYPE_"))
    assert.ok(type.name.length > 0)
    assert.ok(type.description.length > 0)
    assert.ok(["OFFENSIVE", "DEFENSIVE", "SUPPORT", "LOGISTICS", "RECON"].includes(type.strategicRole))
    assert.ok(type.baseSpeedMultiplier > 0)
    assert.ok(type.baseMaintenanceCostMultiplier > 0)
    assert.ok(type.defaultAIPersona.length > 0)
    assert.ok(Array.isArray(type.compatibleShipTypes) && type.compatibleShipTypes.length > 0)
  }
})

test("5. Fleet Classes progression MK I – MK V validation", () => {
  const romanNumerals = ["I", "II", "III", "IV", "V"]
  for (let i = 0; i < SYSTEM_DEFAULT_FLEET_CLASSES.length; i++) {
    const cls = SYSTEM_DEFAULT_FLEET_CLASSES[i]
    assert.strictEqual(cls.tierOrder, i + 1)
    assert.ok(cls.displayName.includes(`MK ${romanNumerals[i]}`))
    assert.ok(cls.maxShipCount >= (i === 0 ? 4 : SYSTEM_DEFAULT_FLEET_CLASSES[i - 1].maxShipCount))
    assert.ok(cls.commandCapRequirement >= 1)
    assert.ok(cls.baseUpkeepCredits > 0)
    assert.ok(cls.levelMultiplier >= 1.0)
  }

  // Capstone bonus on MK V
  const mk5 = SYSTEM_DEFAULT_FLEET_CLASSES.find((c) => c.id === "FLEET_CLASS_MK5_ARMADA")
  assert.ok(mk5)
  assert.strictEqual(mk5.hasMaxTierBonus, true)
  assert.strictEqual(mk5.maxShipCount, 64)
})

test("6. Ship Types schema & physical role validation", () => {
  for (const shipType of SYSTEM_DEFAULT_SHIP_TYPES) {
    assert.ok(shipType.id.startsWith("SHIP_TYPE_"))
    assert.ok(["LIGHT", "MEDIUM_LIGHT", "MEDIUM", "HEAVY", "CAPITAL", "LOGISTICS"].includes(shipType.hullClass))
    assert.ok(shipType.speedBase > 0)
    assert.ok(shipType.evasionBase >= 0)
    assert.ok(shipType.defaultRole.length > 0)
  }
})

test("7. Ship Classes technology tiers MK I – MK V validation", () => {
  for (let i = 0; i < SYSTEM_DEFAULT_SHIP_CLASSES.length; i++) {
    const sc = SYSTEM_DEFAULT_SHIP_CLASSES[i]
    assert.strictEqual(sc.tierOrder, i + 1)
    assert.ok(sc.hullMultiplier >= 1.0)
    assert.ok(sc.shieldMultiplier >= 1.0)
    assert.ok(sc.moduleSlotBonus >= 0)
    assert.ok(sc.maintenanceFactor >= 1.0)
  }

  const mk5ShipClass = SYSTEM_DEFAULT_SHIP_CLASSES.find((sc) => sc.id === "SHIP_CLASS_MK5_DREAD")
  assert.ok(mk5ShipClass)
  assert.strictEqual(mk5ShipClass.hasCapstoneBonus, true)
  assert.strictEqual(mk5ShipClass.moduleSlotBonus, 5)
})

test("8. Ship Definitions blueprint structure & stats validation", () => {
  for (const def of SYSTEM_DEFAULT_SHIP_DEFINITIONS) {
    assert.ok(def.id.startsWith("SHIP_DEF_"))
    assert.ok(def.name.length > 0)
    assert.ok(def.faction.length > 0)
    assert.ok(def.description.length > 0)

    // Stats
    assert.ok(def.baseStats.maxHp > 0)
    assert.ok(def.baseStats.maxShield > 0)
    assert.ok(def.baseStats.attack > 0)
    assert.ok(def.baseStats.defense > 0)
    assert.ok(def.baseStats.speed > 0)

    // Crew requirements order: minimum <= target <= maximum
    assert.ok(def.crewRequirements.minimumCrew > 0)
    assert.ok(def.crewRequirements.minimumCrew <= def.crewRequirements.targetCrew)
    assert.ok(def.crewRequirements.targetCrew <= def.crewRequirements.maximumCrew)

    // Slots layout
    assert.ok(Array.isArray(def.slotsLayout) && def.slotsLayout.length > 0)
    for (const slot of def.slotsLayout) {
      assert.ok(slot.slotId.length > 0)
      assert.ok(["WEAPON", "SHIELD", "ENGINE", "HANGAR", "CARGO", "UTILITY"].includes(slot.slotType))
      assert.ok(["LIGHT", "MEDIUM", "HEAVY", "CAPITAL"].includes(slot.size))
    }

    // Cargo and Fuel
    assert.ok(def.cargoCapacity > 0)
    assert.ok(def.fuelCapacity > 0)

    // Build costs
    assert.ok(def.buildCost.industrialMaterials > 0)
    assert.ok(def.buildCost.energy > 0)
    assert.ok(def.buildCost.credits > 0)
    assert.ok(def.buildCost.buildDays > 0)
  }
})

test("9. Foreign Key Referential Integrity across Type -> Class -> Definition", () => {
  const shipTypeIds = new Set(SYSTEM_DEFAULT_SHIP_TYPES.map((t) => t.id))
  const shipClassIds = new Set(SYSTEM_DEFAULT_SHIP_CLASSES.map((c) => c.id))

  // Ship Definition foreign keys
  for (const def of SYSTEM_DEFAULT_SHIP_DEFINITIONS) {
    assert.ok(shipTypeIds.has(def.typeId), `ShipDef ${def.id} has invalid typeId: ${def.typeId}`)
    assert.ok(shipClassIds.has(def.classId), `ShipDef ${def.id} has invalid classId: ${def.classId}`)
  }

  // Fleet Type compatibleShipTypes foreign keys
  for (const ft of SYSTEM_DEFAULT_FLEET_TYPES) {
    for (const stId of ft.compatibleShipTypes) {
      assert.ok(shipTypeIds.has(stId), `FleetType ${ft.id} has invalid compatibleShipType: ${stId}`)
    }
  }
})

test("10. Fleet Policy Profile conforms to approved financial & decay rules", () => {
  const policy = SYSTEM_DEFAULT_FLEET_POLICY_PROFILES[0]
  assert.ok(policy)

  // Annual decay rules: 360 days, divisor 2, max cap 50%
  assert.strictEqual(policy.annualDecayCycleDays, 360)
  assert.strictEqual(policy.annualDecayDivisor, 2)
  assert.strictEqual(policy.annualDecayMaxCapPercent, 50)

  // Subsidies rules: multiplier 10 per tier, floor 30%, 3 full rate subsidies
  assert.strictEqual(policy.subsidyMultiplierPerTier, 10)
  assert.strictEqual(policy.subsidyFloorPercent, 30)
  assert.strictEqual(policy.subsidyFullRateLimit, 3)
  assert.strictEqual(policy.frontlineWarExceptionEnabled, true)

  // New guild protection & exchange rate
  assert.strictEqual(policy.newGuildProtectionDays, 360)
  assert.strictEqual(policy.exchangeRateFrameToCredits, 150)

  // Emergency command thresholds
  assert.strictEqual(policy.emergencyCommandThresholds.capitalSiege, true)
  assert.strictEqual(policy.emergencyCommandThresholds.sectorThreatLevelCutoff, 85)
  assert.strictEqual(policy.emergencyCommandThresholds.minFleetReadinessPercent, 60)
})

test("11. FRAME Award Catalog points and recipients validation", () => {
  for (const award of SYSTEM_DEFAULT_FRAME_AWARDS) {
    assert.ok(award.id.startsWith("FRAME_AWARD_"))
    assert.ok(award.name.length > 0)
    assert.ok(award.basePoints > 0)
    assert.ok(award.bonusMultiplierPerThreatLevel >= 1.0)
    assert.ok(["FLEET", "PILOT", "FLEET_AND_PILOT"].includes(award.recipientType))
    assert.ok(award.description.length > 0)
  }
})

test("12. Strongly-typed query helpers resolve correctly", () => {
  // Test query helpers
  const fType = getFleetType("FLEET_TYPE_MILITARY_EXPEDITIONARY")
  assert.ok(fType)
  assert.strictEqual(fType.name, "Hạm Đội Viễn Chinh Tác Chiến")

  const fClass = getFleetClass("FLEET_CLASS_MK1_SQUAD")
  assert.ok(fClass)
  assert.strictEqual(fClass.tierOrder, 1)

  const sType = getShipType("SHIP_TYPE_CORVETTE")
  assert.ok(sType)
  assert.strictEqual(sType.hullClass, "LIGHT")

  const sClass = getShipClass("SHIP_CLASS_MK1_STANDARD")
  assert.ok(sClass)
  assert.strictEqual(sClass.tierOrder, 1)

  const sDef = getShipDefinition("SHIP_DEF_SOL_VALIANT_CORVETTE")
  assert.ok(sDef)
  assert.strictEqual(sDef.faction, "vss")

  const pol = getFleetPolicyProfile("POLICY_NATIONAL_STANDARD_2026")
  assert.ok(pol)
  assert.strictEqual(pol.annualDecayCycleDays, 360)

  const award = getFrameAward("FRAME_AWARD_BOSS_ELIMINATION")
  assert.ok(award)
  assert.strictEqual(award.basePoints, 2500)
})
