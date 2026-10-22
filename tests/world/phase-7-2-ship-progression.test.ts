/**
 * STARFRONT WORLD — Phase 7.2 Ship Entity & Progression MK I–X Engine Test Suite
 *
 * Verifies:
 * 1. Ship Entity Instance creation from Definition & Class multipliers
 * 2. Independent Identity, Serial Number & Fleet/Base/Dock Decoupling
 * 3. Crew requirements & Operational Efficiency curve (Understaffed vs Optimal vs Buff)
 * 4. Slots & Module installation / uninstallation
 * 5. FND-2 Shared Progression: EXP accumulation, Level-ups, and Hard Tier Boundary (AWAITING_UPGRADE)
 * 6. Zero Hidden Overflow discipline at hard tier boundary
 * 7. Dockyard Upgrade Eligibility validation & Task execution
 * 8. Upgrade progress settlement across GAME_DAYS
 * 9. 1-Time Permanent MAX TIER BONUS (MK X Capstone)
 * 10. Condition Wear (Mileage & Combat) & Base Maintenance Repair
 * 11. WorldState integration & default canonical starting ships
 */

import test from "node:test"
import assert from "node:assert"

import { bootstrapWorldCatalogs } from "../../lib/game/world/bootstrap"
import {
  createShipInstance,
  detachShipFromFleet,
  assignShipToFleet,
  evaluateShipCrewStatus,
  installShipModule,
  uninstallShipModule,
  createDefaultStartingShips,
} from "../../lib/game/world/ship/ship-entity"
import {
  grantShipExp,
  grantShipMileageExp,
  grantShipCombatExp,
  validateShipTierUpgradeEligibility,
  startShipTierUpgrade,
  processShipTierUpgradeProgress,
  applyShipMaxTierBonus,
} from "../../lib/game/world/ship/ship-progression"
import {
  applyShipConditionWear,
  repairShipAtBase,
  getShipConditionRating,
  estimateShipRepairCost,
  settleShipMaintenancePolicy,
} from "../../lib/game/world/ship/ship-maintenance"
import { getShipClass } from "../../lib/game/world/fleet/registry-integration"
import { createInitialWorldState } from "../../lib/game/world/initial-state"
import { generate30NodeWorld } from "../../lib/game/world/base/world-generator"
import { migrateFoundationState } from "../../lib/game/world/storage"

// Bootstrap master catalogs
bootstrapWorldCatalogs()

test("1. Ship Entity creation from Definition & Class multipliers", () => {
  const ship = createShipInstance({
    instanceId: "test_ship_01",
    definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE",
    customName: "Test Valiant Corvette",
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "vss_high_command",
      ownerName: "Liên minh VSS",
      factionId: "vss",
    },
    currentBaseId: "base_sol_command_hq",
    currentSectorId: "sol_command_hq",
    gameDay: 1,
  })

  assert.strictEqual(ship.instanceId, "test_ship_01")
  assert.strictEqual(ship.definitionId, "SHIP_DEF_SOL_VALIANT_CORVETTE")
  assert.strictEqual(ship.customName, "Test Valiant Corvette")
  assert.ok(ship.serialNumber.length > 0)
  assert.strictEqual(ship.status, "OPERATIONAL")
  assert.strictEqual(ship.condition, 100.0)

  // Baseline corvette stats: HP 3200, Shield 1800, Class MK1 multiplier = 1.0
  assert.strictEqual(ship.maxHullHp, 3200)
  assert.strictEqual(ship.hullHp, 3200)
  assert.strictEqual(ship.maxShieldHp, 1800)
  assert.strictEqual(ship.shieldHp, 1800)

  // Progression initialization: Level 1, Tier I, state PROGRESSING
  assert.strictEqual(ship.progression.currentLevel, 1)
  assert.strictEqual(ship.progression.currentTierId, "TIER_I")
  assert.strictEqual(ship.progression.state, "PROGRESSING")
  assert.strictEqual(ship.progression.levelHistory["TIER_I"], 1)

  // Slots count
  assert.strictEqual(ship.unlockedModuleSlotsCount, 4)
  assert.ok(ship.installedModules["slot_wpn_1"])
})

test("2. Fleet / Base / Dock Decoupling", () => {
  const ship = createShipInstance({
    instanceId: "test_ship_decouple",
    definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE",
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "vss_high_command",
      ownerName: "Liên minh VSS",
      factionId: "vss",
    },
    assignedFleetId: "fleet_alpha",
    currentBaseId: "base_sol_command_hq",
    currentSectorId: "sol_command_hq",
    gameDay: 1,
  })

  assert.strictEqual(ship.assignedFleetId, "fleet_alpha")

  // Detach ship to drydock
  const detachRes = detachShipFromFleet(ship, "base_sol_command_hq", "dock_port_01")
  assert.strictEqual(detachRes.success, true)
  assert.strictEqual(detachRes.previousFleetId, "fleet_alpha")
  assert.strictEqual(ship.assignedFleetId, undefined)
  assert.strictEqual(ship.currentBaseId, "base_sol_command_hq")
  assert.strictEqual(ship.currentDockId, "dock_port_01")

  // Re-assign ship to another fleet
  const assignRes = assignShipToFleet(ship, "fleet_vanguard_omega")
  assert.strictEqual(assignRes.success, true)
  assert.strictEqual(ship.assignedFleetId, "fleet_vanguard_omega")
  assert.strictEqual(ship.currentDockId, undefined)
})

test("3. Crew requirements & Operational Efficiency curve", () => {
  const ship = createShipInstance({
    instanceId: "test_ship_crew",
    definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE", // targetCrew = 16, minimumCrew = 8, maximumCrew = 24
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "vss_high_command",
      ownerName: "Liên minh VSS",
      factionId: "vss",
    },
    currentSectorId: "sol_command_hq",
    assignedCrewCount: 4, // Under minimum
    gameDay: 1,
  })

  // Case A: Crew < Minimum (4 < 8) -> Cannot operate, efficiency 0.4
  const statusUnder = evaluateShipCrewStatus(ship)
  assert.strictEqual(statusUnder.canOperate, false)
  assert.strictEqual(statusUnder.isUnderStaffed, true)
  assert.strictEqual(statusUnder.efficiency, 0.4)

  // Case B: Minimum <= Crew < Target (12 between 8 and 16) -> Can operate at partial efficiency
  ship.assignedCrewCount = 12
  const statusPartial = evaluateShipCrewStatus(ship)
  assert.strictEqual(statusPartial.canOperate, true)
  assert.strictEqual(statusPartial.isUnderStaffed, true)
  assert.ok(statusPartial.efficiency >= 0.6 && statusPartial.efficiency < 1.0)

  // Case C: Target Crew (16) -> Standard 1.0 efficiency
  ship.assignedCrewCount = 16
  const statusOptimal = evaluateShipCrewStatus(ship)
  assert.strictEqual(statusOptimal.canOperate, true)
  assert.strictEqual(statusOptimal.isUnderStaffed, false)
  assert.strictEqual(statusOptimal.efficiency, 1.0)

  // Case D: Maximum Crew (24) -> Buffed 1.25 efficiency
  ship.assignedCrewCount = 24
  const statusBuff = evaluateShipCrewStatus(ship)
  assert.strictEqual(statusBuff.canOperate, true)
  assert.strictEqual(statusBuff.isUnderStaffed, false)
  assert.strictEqual(statusBuff.efficiency, 1.25)
})

test("4. Slots & Module installation / uninstallation", () => {
  const ship = createShipInstance({
    instanceId: "test_ship_modules",
    definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE",
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "vss_high_command",
      ownerName: "Liên minh VSS",
      factionId: "vss",
    },
    currentSectorId: "sol_command_hq",
    gameDay: 1,
  })

  assert.ok(ship.installedModules["slot_wpn_1"])

  // Uninstall weapon
  const uninst = uninstallShipModule(ship, "slot_wpn_1")
  assert.strictEqual(uninst.success, true)
  assert.strictEqual(ship.installedModules["slot_wpn_1"], undefined)

  // Install custom upgraded laser weapon
  const installRes = installShipModule(ship, "slot_wpn_1", {
    slotId: "slot_wpn_1",
    slotType: "WEAPON",
    size: "LIGHT",
    moduleId: "mod_plasma_beam_mk2",
    name: "Advanced Plasma Beam Mk II",
    condition: 100.0,
    isOperational: true,
    statModifiers: { attack: 45 },
  })
  assert.strictEqual(installRes.success, true)
  assert.strictEqual(ship.installedModules["slot_wpn_1"].moduleId, "mod_plasma_beam_mk2")
})

test("5. FND-2 Progression EXP accumulation & Hard Tier Boundary", () => {
  const ship = createShipInstance({
    instanceId: "test_ship_progression",
    definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE",
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "vss_high_command",
      ownerName: "Liên minh VSS",
      factionId: "vss",
    },
    currentSectorId: "sol_command_hq",
    gameDay: 1,
  })

  assert.strictEqual(ship.progression.currentLevel, 1)

  // Grant 500 EXP -> should gain multiple levels within Tier I (maxLevel = 10)
  const expRes1 = grantShipExp(ship, 500, 1)
  assert.ok(expRes1.levelsGained > 0)
  assert.ok(ship.progression.currentLevel > 1)
  assert.strictEqual(ship.progression.state, "PROGRESSING")

  // Grant massive EXP (100,000) -> must cap strictly at Level 10 (Tier I boundary)
  const expRes2 = grantShipExp(ship, 100000, 1)
  assert.strictEqual(ship.progression.currentLevel, 10)
  assert.strictEqual(ship.progression.state, "AWAITING_UPGRADE")
  assert.strictEqual(expRes2.reachedHardBoundary, true)

  // 6. Zero Hidden Overflow check: adding further EXP while AWAITING_UPGRADE does not advance
  const expRes3 = grantShipExp(ship, 50000, 2)
  assert.strictEqual(expRes3.levelsGained, 0)
  assert.strictEqual(ship.progression.currentLevel, 10)
  assert.strictEqual(ship.progression.state, "AWAITING_UPGRADE")
})

test("7. Dockyard Upgrade Eligibility validation", () => {
  const ship = createShipInstance({
    instanceId: "test_ship_upgrade_val",
    definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE",
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "vss_high_command",
      ownerName: "Liên minh VSS",
      factionId: "vss",
    },
    currentSectorId: "sol_command_hq",
    gameDay: 1,
  })

  const baseNormal = {
    id: "base_sol_command_hq",
    name: "Sol Command HQ",
    stage: "normal",
    fleetDockingCapacity: 8,
  }

  // Not ready for upgrade yet (Level 1, state PROGRESSING)
  const valNotReady = validateShipTierUpgradeEligibility(ship, baseNormal, 1)
  assert.strictEqual(valNotReady.eligible, false)
  assert.ok(valNotReady.reason?.includes("not in AWAITING_UPGRADE"))

  // Fast-forward to level 10
  grantShipExp(ship, 100000, 1)
  assert.strictEqual(ship.progression.state, "AWAITING_UPGRADE")

  // Base under siege cannot upgrade
  const baseSiege = {
    id: "base_sol_command_hq",
    name: "Sol Command HQ",
    stage: "under_siege",
    fleetDockingCapacity: 8,
  }
  const valSiege = validateShipTierUpgradeEligibility(ship, baseSiege, 1)
  assert.strictEqual(valSiege.eligible, false)
  assert.ok(valSiege.reason?.includes("under siege"))

  // Base normal is eligible (TIER_I upgrade duration = 1 day)
  const valEligible = validateShipTierUpgradeEligibility(ship, baseNormal, 1)
  assert.strictEqual(valEligible.eligible, true)
  assert.strictEqual(valEligible.nextTier?.tierId, "TIER_II")
  assert.strictEqual(valEligible.durationDays, 1)
  assert.ok(valEligible.cost.industrialMaterials > 0)
  assert.ok(valEligible.cost.energy > 0)
  assert.ok(valEligible.cost.credits > 0)
})

test("8. Dockyard Upgrade Task Start & Completion across Game Days", () => {
  const ship = createShipInstance({
    instanceId: "test_ship_upgrade_exec",
    definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE",
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "vss_high_command",
      ownerName: "Liên minh VSS",
      factionId: "vss",
    },
    currentSectorId: "sol_command_hq",
    gameDay: 1,
  })

  // Reach Tier I max level
  grantShipExp(ship, 100000, 1)
  assert.strictEqual(ship.progression.state, "AWAITING_UPGRADE")

  const base = {
    id: "base_sol_command_hq",
    name: "Sol Command HQ",
    stage: "normal",
    fleetDockingCapacity: 8,
  }

  // Start upgrade on Game Day 5 (TIER_I upgrade duration = 1 day -> completeDay = 6)
  const startRes = startShipTierUpgrade({
    ship,
    base,
    gameDay: 5,
    dockPortId: "dock_01",
  })

  assert.strictEqual(startRes.success, true)
  assert.strictEqual(ship.status, "UPGRADING")
  assert.strictEqual(ship.progression.state, "UPGRADING")
  assert.strictEqual(startRes.completeDay, 6) // 5 + 1 day duration

  // Check progress on Game Day 5 (not yet finished)
  const progEarly = processShipTierUpgradeProgress(ship, 5)
  assert.strictEqual(progEarly.upgraded, false)
  assert.strictEqual(progEarly.remainingDays, 1)
  assert.strictEqual(ship.status, "UPGRADING")

  // Check progress on Game Day 6 (complete!)
  const progDone = processShipTierUpgradeProgress(ship, 6)
  assert.strictEqual(progDone.upgraded, true)
  assert.strictEqual(progDone.newTierId, "TIER_II")
  assert.strictEqual(ship.status, "OPERATIONAL")
  assert.strictEqual(ship.progression.state, "PROGRESSING")
  assert.strictEqual(ship.progression.currentTierId, "TIER_II")
  assert.strictEqual(ship.activeUpgradeTask, undefined)
  assert.ok(ship.maxHullHp > 3200, "Max HP should scale up after Tier upgrade")
})

test("9. 1-Time Permanent MAX TIER BONUS (MK X Capstone)", () => {
  const ship = createShipInstance({
    instanceId: "test_ship_capstone",
    definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE",
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "vss_high_command",
      ownerName: "Liên minh VSS",
      factionId: "vss",
    },
    currentSectorId: "sol_command_hq",
    gameDay: 1,
  })

  const initialMaxHp = ship.maxHullHp
  const initialMaxShield = ship.maxShieldHp
  const initialSlots = ship.unlockedModuleSlotsCount

  // Directly apply Capstone Bonus (simulating reaching MK X)
  const appliedFirst = applyShipMaxTierBonus(ship, 360)
  assert.strictEqual(appliedFirst, true)
  assert.ok(ship.maxTierBonus?.applied)
  assert.strictEqual(ship.maxTierBonus?.awardedAtGameDay, 360)

  // Verify permanent +25% stats and +1 slot
  assert.strictEqual(ship.maxHullHp, initialMaxHp + Math.round(initialMaxHp * 0.25))
  assert.strictEqual(ship.maxShieldHp, initialMaxShield + Math.round(initialMaxShield * 0.25))
  assert.strictEqual(ship.unlockedModuleSlotsCount, initialSlots + 1)

  // Ensure 1-Time only: second application must return false
  const appliedSecond = applyShipMaxTierBonus(ship, 361)
  assert.strictEqual(appliedSecond, false)
})

test("10. Condition Wear (Mileage & Combat) & Base Maintenance Repair", () => {
  const ship = createShipInstance({
    instanceId: "test_ship_wear",
    definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE",
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "vss_high_command",
      ownerName: "Liên minh VSS",
      factionId: "vss",
    },
    currentSectorId: "sol_command_hq",
    gameDay: 1,
  })

  assert.strictEqual(ship.condition, 100.0)
  assert.strictEqual(getShipConditionRating(ship.condition), "PRISTINE")

  // Apply wear: 50,000 km (2.5% wear) + 10 combat rounds (15% wear) = 17.5% wear -> 82.5%
  const wear1 = applyShipConditionWear(ship, {
    mileageKm: 50000,
    combatRounds: 10,
    gameDay: 10,
  })

  assert.strictEqual(wear1.newCondition, 82.5)
  assert.strictEqual(wear1.rating, "SERVICEABLE")
  assert.strictEqual(ship.mileageKm, 50000)
  assert.strictEqual(ship.battlesCount, 1)

  // Severe damage: 60% flat wear -> condition becomes 22.5% (< 25% -> DAMAGED)
  const wear2 = applyShipConditionWear(ship, {
    flatWear: 60.0,
    gameDay: 15,
  })
  assert.strictEqual(wear2.newCondition, 22.5)
  assert.strictEqual(wear2.rating, "CRITICAL")
  assert.strictEqual(ship.status, "DAMAGED")

  // Repair at base
  ship.hullHp = 1000 // damaged combat HP
  const repairRes = repairShipAtBase(ship, 16, { fullOverhaul: true })

  assert.strictEqual(repairRes.success, true)
  assert.strictEqual(ship.condition, 100.0)
  assert.strictEqual(ship.hullHp, ship.maxHullHp)
  assert.strictEqual(ship.shieldHp, ship.maxShieldHp)
  assert.strictEqual(ship.status, "OPERATIONAL")
  assert.ok(repairRes.consumedMaterials.industrialMaterials > 0)
  assert.ok(repairRes.consumedMaterials.logisticsSupplies > 0)
})

test("11. WorldState integration & default canonical starting ships", () => {
  // Test starting ships function
  const startingShips = createDefaultStartingShips()
  assert.ok(startingShips["ship_vss_valiant_lead"])
  assert.ok(startingShips["ship_vss_hermes_01"])

  // Test createInitialWorldState
  const worldState10 = createInitialWorldState(12345)
  assert.ok(worldState10.ships)
  assert.strictEqual(Object.keys(worldState10.ships).length, 2)
  assert.ok(worldState10.ships["ship_vss_valiant_lead"])

  // Test generate30NodeWorld
  const worldState30 = generate30NodeWorld(67890)
  assert.ok(worldState30.ships)
  assert.strictEqual(Object.keys(worldState30.ships).length, 2)
  assert.ok(worldState30.ships["ship_vss_valiant_lead"])
})

test("12. Mileage and Combat EXP Distribution", () => {
  const ship = createShipInstance({
    instanceId: "test_ship_exp_modes",
    definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE",
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "vss_high_command",
      ownerName: "Liên minh VSS",
      factionId: "vss",
    },
    currentSectorId: "sol_command_hq",
    gameDay: 1,
  })

  // Mileage EXP: 25,000 km -> 250 EXP
  const mileageRes = grantShipMileageExp(ship, 25000, 2)
  assert.ok(mileageRes.levelsGained > 0 || mileageRes.newExp > 0)
  assert.ok(ship.progression.currentLevel >= 1)

  // Combat EXP: engagement with damage and kills
  const combatRes = grantShipCombatExp(ship, {
    damageDealt: 1200,
    kills: 2,
    victory: true,
    gameDay: 3,
  })
  assert.ok(combatRes.newExp > 0 || combatRes.levelsGained > 0)
})

test("13. Maintenance Policy Settlement & Cost Estimation", () => {
  const ship = createShipInstance({
    instanceId: "test_ship_policy",
    definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE",
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "vss_high_command",
      ownerName: "Liên minh VSS",
      factionId: "vss",
    },
    currentBaseId: "base_sol_command_hq",
    currentSectorId: "sol_command_hq",
    maintenancePolicy: "AUTO",
    gameDay: 1,
  })

  // Pristine ship needs no maintenance
  const settlePristine = settleShipMaintenancePolicy(ship, 1)
  assert.strictEqual(settlePristine.repaired, false)

  // Damage condition to 60%
  ship.condition = 60.0
  const estimate = estimateShipRepairCost(ship)
  assert.ok(estimate.industrialMaterials > 0)
  assert.ok(estimate.logisticsSupplies > 0)
  assert.ok(estimate.credits > 0)
  assert.strictEqual(estimate.neededCondition, 40)

  // Settle under AUTO policy -> repairs back to 100%
  const settleAuto = settleShipMaintenancePolicy(ship, 2, {
    industrialMaterials: 500,
    logisticsSupplies: 500,
    credits: 5000,
  })
  assert.strictEqual(settleAuto.repaired, true)
  assert.strictEqual(ship.condition, 100.0)

  // Settle under MANUAL policy -> never auto repairs
  ship.maintenancePolicy = "MANUAL"
  ship.condition = 50.0
  const settleManual = settleShipMaintenancePolicy(ship, 3)
  assert.strictEqual(settleManual.repaired, false)
  assert.strictEqual(ship.condition, 50.0)

  // Settle under EMERGENCY_ONLY policy:
  // - condition 50.0% is not emergency -> no repair
  ship.maintenancePolicy = "EMERGENCY_ONLY"
  const settleEmergencyNo = settleShipMaintenancePolicy(ship, 4)
  assert.strictEqual(settleEmergencyNo.repaired, false)

  // - condition 20.0% is emergency (< 25%) -> repairs!
  ship.condition = 20.0
  const settleEmergencyYes = settleShipMaintenancePolicy(ship, 5)
  assert.strictEqual(settleEmergencyYes.repaired, true)
  assert.strictEqual(ship.condition, 100.0)
})

test("14. Dynamic Crew Ratio Calculation (minimumCrewRatio / maximumCrewRatio)", () => {
  const customDef = {
    id: "SHIP_DEF_CUSTOM_RATIO",
    typeId: "SHIP_TYPE_CORVETTE",
    classId: "SHIP_CLASS_MK1_STANDARD",
    name: "Custom Ratio Test Ship",
    faction: "vss",
    description: "Testing ratio calculation",
    baseStats: { maxHp: 3000, maxShield: 1500, attack: 200, defense: 100, speed: 100 },
    crewRequirements: {
      targetCrew: 50,
      minimumCrewRatio: 0.4, // 50 * 0.4 = 20
      maximumCrewRatio: 1.6, // 50 * 1.6 = 80
    } as any,
    slotsLayout: [],
    cargoCapacity: 100,
    fuelCapacity: 300,
    buildCost: { industrialMaterials: 100, energy: 50, credits: 200, buildDays: 2 },
    lifecycle: "ACTIVE" as const,
  }

  const testShip = createShipInstance({
    instanceId: "ship_ratio_test",
    definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE",
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "vss",
      ownerName: "VSS",
      factionId: "vss",
    },
    currentSectorId: "sol_command_hq",
    assignedCrewCount: 15,
  })

  // Test with custom definition ratios
  const status = evaluateShipCrewStatus(testShip, customDef)
  assert.strictEqual(status.targetCrew, 50)
  assert.strictEqual(status.minimumCrew, 20)
  assert.strictEqual(status.maximumCrew, 80)
  assert.strictEqual(status.canOperate, false) // 15 < 20 (minimum)
})

test("15. 10-Tier MK I..X Ship Classes Catalog Resolution", () => {
  // Check that all 10 classes exist and scale appropriately
  const mk1 = getShipClass("SHIP_CLASS_MK1_STANDARD")
  const mk5 = getShipClass("SHIP_CLASS_MK5_DREAD")
  const mk10 = getShipClass("SHIP_CLASS_MK10_TRANSCENDENT")

  assert.ok(mk1)
  assert.strictEqual(mk1.tierOrder, 1)
  assert.strictEqual(mk1.hullMultiplier, 1.0)

  assert.ok(mk5)
  assert.strictEqual(mk5.tierOrder, 5)
  assert.strictEqual(mk5.hullMultiplier, 3.6)

  assert.ok(mk10)
  assert.strictEqual(mk10.tierOrder, 10)
  assert.strictEqual(mk10.hullMultiplier, 14.0)
  assert.strictEqual(mk10.moduleSlotBonus, 10)
  assert.strictEqual(mk10.hasCapstoneBonus, true)
})

test("16. WorldState Storage Soft Migration for Ships", () => {
  const legacyWorldState: any = {
    worldSeed: 12345,
    currentDay: 1,
    sectors: {},
    routes: [],
    threatConfig: {},
  }

  // Pre-condition: ships is undefined
  assert.strictEqual(legacyWorldState.ships, undefined)

  // Run foundation migration
  const migrated = migrateFoundationState(legacyWorldState)
  assert.strictEqual(migrated, true)

  // Post-condition: ships is gracefully populated with default canonical starting ships
  assert.ok(legacyWorldState.ships)
  assert.ok(legacyWorldState.ships["ship_vss_valiant_lead"])
  assert.ok(legacyWorldState.ships["ship_vss_hermes_01"])
})

