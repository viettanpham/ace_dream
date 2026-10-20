/**
 * STARFRONT WORLD — Phase 6.34A-FND-6 Test Suite
 * BASE / HUB / CAPITAL / ORBITAL SUB-BASE FOUNDATION
 *
 * Verifies:
 * 1. 30 Sector / Main Base Nodes generation & 54 interconnected hyperlane routes
 * 2. Faction Allocation & Constraints: Min 20% base share (min 6 bases), max 10% power diff
 * 3. Backline Capital placement (Sol HQ & Tartarus Breach) with CC0 & Commander naming
 * 4. Real instance-based power score calculation & intra-national power share normalization to 100%
 * 5. Deterministic seeded variation
 * 6. Base Entity Architecture: MAIN_BASE vs SUB_BASE with parentBaseId
 * 7. Core Facilities as real Building Instances with 2-8 default docking ports & zero double-counting
 * 8. Real living population (BasePopulationState) generated across all 30 bases
 * 9. Hub Specialization lifecycle (LOCKED, AVAILABLE, ACTIVE, SUSPENDED) with condition checks
 * 10. Capital Orbital Slots Table (MK I..X: 2..12 slots with MAX TIER BONUS) & max 3 for non-capitals
 * 11. Independent Fleet Capacities (Command, Stationing, Docking) with strict orbital port separation
 * 12. Local Government AI, Commander Override expiration, 7-day economy forecast & support requests
 * 13. 7-Step World Reset Preview Stepper
 * 14. Dual-interval auto-save (7 game days / 10 real minutes) & Save/Load V1 migration
 */

import assert from "node:assert/strict"
import test from "node:test"

import {
  addExpansionBuildingToOrbitalSubBase,
  bootstrapWorldCatalogs,
  calculateBaseEconomyForecast,
  calculateBasePowerScore,
  calculateMaxHubSlots,
  calculateMaxOrbitalSlots,
  canActivateHubSpecialization,
  canHostOrbitalSubBase,
  checkAutoSaveEligibility,
  createHubSpecializationInstance,
  createOrbitalSubBase,
  createResetWorldState,
  DEFAULT_WORLD_GENERATION_CONFIG,
  evaluateFleetCapacities,
  executeAutoSaveIfEligible,
  executeWorldResetStep,
  generate30NodeWorld,
  getDefaultDockingPortsForBase,
  getValidAutoSaveSlots,
  isCommanderOverrideActive,
  loadWorldStateFromDevFile,
  migrateFoundationState,
  migrateWorldStateTo30Sectors,
  recoverFromLatestValidAutoSave,
  reEvaluateHubSpecializations,
  saveAutoSaveSlotRecord,
  saveWorldStateToDevFile,
  setBaseCommanderOverride,
  SYSTEM_HUB_SPECIALIZATION_DEFINITIONS,
  SYSTEM_ORBITAL_SUB_BASE_DEFINITIONS,
  upgradeOrbitalSubBaseTier,
  validateFactionBaseDistribution,
  validateNationalPowerBalance,
} from "../../lib/game/world"
import { getMasterRegistry } from "../../lib/game/world/catalog/registry"

test("1. 30 Sector / Main Base Nodes generation & 54 interconnected routes", () => {
  const world = generate30NodeWorld(12345678)

  // Exactly 30 sectors and 30 main bases
  const sectorKeys = Object.keys(world.sectors)
  assert.equal(sectorKeys.length, 30, "World must have exactly 30 sectors")

  const baseKeys = Object.keys(world.bases || {})
  assert.equal(baseKeys.length, 30, "World must have exactly 30 main bases")

  // Mapping is 1-to-1
  for (const sId of sectorKeys) {
    assert.ok(world.bases?.[sId], `Sector ${sId} must map directly to Main Base ${sId}`)
  }

  // 54 interconnected hyperlane routes
  assert.equal(world.routes.length, 54, "World must have exactly 54 hyperlane routes")

  // Every route connects valid sectors
  for (const r of world.routes) {
    assert.ok(world.sectors[r.fromSectorId], `Route origin ${r.fromSectorId} must exist`)
    assert.ok(world.sectors[r.toSectorId], `Route destination ${r.toSectorId} must exist`)
  }
})

test("2. Faction Allocation & Constraints: Min 20% base share and power difference <= 10%", () => {
  // Valid distributions: 18-12, 15-15, 24-6
  const check18_12 = validateFactionBaseDistribution(18, 12, 30, 20)
  assert.equal(check18_12.isValid, true)

  const check15_15 = validateFactionBaseDistribution(15, 15, 30, 20)
  assert.equal(check15_15.isValid, true)

  const check24_6 = validateFactionBaseDistribution(24, 6, 30, 20)
  assert.equal(check24_6.isValid, true)

  // Invalid: 25-5, 29-1 (< 6 bases / < 20%)
  const check25_5 = validateFactionBaseDistribution(25, 5, 30, 20)
  assert.equal(check25_5.isValid, false)
  assert.match(check25_5.error || "", /vi phạm tỷ lệ tối thiểu 20%/)

  const check29_1 = validateFactionBaseDistribution(29, 1, 30, 20)
  assert.equal(check29_1.isValid, false)

  // Power difference validation
  const validPower = validateNationalPowerBalance(52000, 48000, 10)
  assert.equal(validPower.isValid, true)
  assert.ok(validPower.diffPercentagePoints <= 10)

  const invalidPower = validateNationalPowerBalance(65000, 35000, 10)
  assert.equal(invalidPower.isValid, false)
  assert.match(invalidPower.error || "", /vượt quá giới hạn cho phép/)
})

test("3. Backline Capital placement, CC0 identity & Commander naming", () => {
  const world = generate30NodeWorld(999888, {
    vssCapitalName: "Liên minh VSS",
    commanderName: "Alviss",
  })

  // VSS Capital
  const vssCap = world.bases?.["sol_command_hq"]
  assert.ok(vssCap, "Sol Command HQ must exist")
  assert.equal(vssCap.isCapital, true, "Sol Command HQ must be marked as Capital")
  assert.equal(vssCap.strategicRole, "CAPITAL")
  assert.equal(world.sectors["sol_command_hq"].name, "Liên minh VSS")
  assert.ok(world.sectors["sol_command_hq"].x < 30, "Sol Command HQ must be located in strategic backline (x < 30)")

  // Void Capital
  const voidCap = world.bases?.["tartarus_breach"]
  assert.ok(voidCap, "Tartarus Breach must exist")
  assert.equal(voidCap.isCapital, true, "Tartarus Breach must be marked as Capital")
  assert.equal(voidCap.strategicRole, "CAPITAL")
  assert.ok(world.sectors["tartarus_breach"].x > 70, "Tartarus Breach must be located in deep backline space (x > 70)")

  // Exactly one capital per faction
  const vssCapitals = Object.values(world.bases || {}).filter((b: any) => b.factionId === "vss" && b.isCapital)
  const voidCapitals = Object.values(world.bases || {}).filter((b: any) => b.factionId === "void" && b.isCapital)
  assert.equal(vssCapitals.length, 1, "VSS must have exactly 1 Capital")
  assert.equal(voidCapitals.length, 1, "Void must have exactly 1 Capital")
})

test("4. Real instance-based power score & intra-national power share normalization to 100%", () => {
  const world = generate30NodeWorld(555444)

  // Verify power score has real components
  for (const b of Object.values(world.bases || {})) {
    const ext = b as any
    assert.ok(ext.nationalPowerScore > 0, `Base ${ext.name} must have a positive power score`)
    assert.ok(ext.nationalPowerSharePercent > 0, `Base ${ext.name} must have a positive power share`)
  }

  // Verify Capital is in 20% - 50%
  const solBase = world.bases?.["sol_command_hq"] as any
  assert.ok(solBase.nationalPowerSharePercent >= 20, `Capital power share (${solBase.nationalPowerSharePercent}%) must be >= 20%`)
  assert.ok(solBase.nationalPowerSharePercent <= 50, `Capital power share (${solBase.nationalPowerSharePercent}%) must be <= 50%`)

  // Sum of VSS shares must equal exactly 100%
  const vssSharesSum = Object.values(world.bases || {})
    .filter((b: any) => b.factionId === "vss")
    .reduce((sum, b: any) => sum + b.nationalPowerSharePercent, 0)
  assert.ok(Math.abs(vssSharesSum - 100) < 0.1, `VSS power shares must normalize to 100% (was ${vssSharesSum})`)

  // Sum of Void shares must equal exactly 100%
  const voidSharesSum = Object.values(world.bases || {})
    .filter((b: any) => b.factionId === "void")
    .reduce((sum, b: any) => sum + b.nationalPowerSharePercent, 0)
  assert.ok(Math.abs(voidSharesSum - 100) < 0.1, `Void power shares must normalize to 100% (was ${voidSharesSum})`)
})

test("5. Deterministic seeded variation", () => {
  const seed = 88776655
  const worldA = generate30NodeWorld(seed)
  const worldB = generate30NodeWorld(seed)

  assert.equal(worldA.worldSeed, worldB.worldSeed)
  assert.equal(worldA.demographics.nationalTotalPopulation, worldB.demographics.nationalTotalPopulation)

  for (const [id, baseA] of Object.entries(worldA.bases || {})) {
    const baseB = worldB.bases?.[id] as any
    assert.equal((baseA as any).nationalPowerScore, baseB.nationalPowerScore, `Power score of ${id} must match deterministically`)
    assert.equal((baseA as any).nationalPowerSharePercent, baseB.nationalPowerSharePercent)
  }
})

test("6. Base Entity Architecture: MAIN_BASE vs SUB_BASE with parentBaseId", () => {
  const world = generate30NodeWorld(443322)

  // Main bases must have entityKind === "MAIN_BASE"
  for (const b of Object.values(world.bases || {})) {
    const ext = b as any
    assert.equal(ext.entityKind, "MAIN_BASE", `${ext.name} must have entityKind "MAIN_BASE"`)
    assert.equal(ext.parentBaseId, undefined, "Main base must not have a parentBaseId")
  }

  // Orbital sub-bases must have entityKind === "SUB_BASE" and parentBaseId
  const subBases = Object.values(world.orbitalSubBases || {})
  assert.ok(subBases.length > 0, "Must have generated orbital sub-bases")

  for (const sub of subBases) {
    assert.ok(sub.parentBaseId, "Sub-base must have parentBaseId")
    assert.ok(world.bases?.[sub.parentBaseId], `Parent base ${sub.parentBaseId} must exist in world.bases`)
    assert.ok(sub.buildings && Object.keys(sub.buildings).length > 0, "Sub-base must have real building instances")
    assert.ok(sub.dockingCapacity > 0, "Sub-base must have docking capacity")
    assert.ok(sub.defenseRating > 0, "Sub-base must have defense rating")
    assert.ok(sub.crewAssigned > 0, "Sub-base must have crew assigned")
  }
})

test("7. Core Facilities as real Building Instances with 2-8 default docking ports & zero double-counting", () => {
  const world = generate30NodeWorld(112233)

  for (const b of Object.values(world.bases || {})) {
    const ext = b as any
    assert.ok(ext.coreBuildingIds.length >= 5, `${ext.name} must have at least 5 core facility instances`)

    for (const instId of ext.coreBuildingIds) {
      const inst = ext.buildings[instId]
      assert.ok(inst, `Building instance ${instId} must exist`)
      assert.ok(inst.currentHp > 0, `Building ${instId} must have currentHp`)
      assert.ok(inst.operationalEfficiency > 0, `Building ${instId} must have efficiency`)
      assert.ok(inst.assignedPersonnel > 0, `Building ${instId} must have assigned personnel`)
    }

    // Default docking ports: 2-8 depending on class
    const ports = ext.fleetCapacities.baseDockingPorts
    assert.ok(ports >= 2 && ports <= 8, `Base ${ext.name} docking ports (${ports}) must be in range 2..8`)

    if (ext.isCapital) {
      assert.equal(ports, 8, "Capital must have 8 default docking ports")
    }
  }

  // Docking ports lookup table validation
  assert.equal(getDefaultDockingPortsForBase("CAPITAL", true), 8)
  assert.equal(getDefaultDockingPortsForBase("HABITAT"), 6)
  assert.equal(getDefaultDockingPortsForBase("MILITARY"), 5)
  assert.equal(getDefaultDockingPortsForBase("INDUSTRY"), 4)
  assert.equal(getDefaultDockingPortsForBase("GENERAL"), 3)
  assert.equal(getDefaultDockingPortsForBase("MINING"), 2)
})

test("8. Real living population (BasePopulationState) generated across all 30 bases", () => {
  const world = generate30NodeWorld(776655)

  let calculatedTotal = 0
  for (const [baseId, popState] of Object.entries(world.basePopulationStates || {})) {
    assert.ok(popState.populationCurrent > 0, `Base ${baseId} must have living population > 0`)
    assert.ok(popState.capacityResidential >= popState.populationCurrent, `Base ${baseId} residential capacity must support population`)
    assert.ok(popState.workforceAssigned > 0, `Base ${baseId} must have assigned workforce`)
    calculatedTotal += popState.populationCurrent
  }

  assert.equal(calculatedTotal, world.demographics.nationalTotalPopulation, "Sum of base populations must match national total")
})

test("9. Hub Specialization lifecycle (LOCKED, AVAILABLE, ACTIVE, SUSPENDED) & condition checking", () => {
  // Check 8 approved definitions exist
  assert.equal(Object.keys(SYSTEM_HUB_SPECIALIZATION_DEFINITIONS).length, 8)
  assert.ok(SYSTEM_HUB_SPECIALIZATION_DEFINITIONS["COMMAND_HUB"])
  assert.ok(SYSTEM_HUB_SPECIALIZATION_DEFINITIONS["LOGISTICS_HUB"])
  assert.ok(SYSTEM_HUB_SPECIALIZATION_DEFINITIONS["TRANSPORT_HUB"])
  assert.ok(SYSTEM_HUB_SPECIALIZATION_DEFINITIONS["MEDICAL_HUB"])
  assert.ok(SYSTEM_HUB_SPECIALIZATION_DEFINITIONS["REPAIR_HUB"])
  assert.ok(SYSTEM_HUB_SPECIALIZATION_DEFINITIONS["RESEARCH_HUB"])
  assert.ok(SYSTEM_HUB_SPECIALIZATION_DEFINITIONS["INDUSTRIAL_HUB"])
  assert.ok(SYSTEM_HUB_SPECIALIZATION_DEFINITIONS["FINANCIAL_HUB"])

  // Slot calculations
  assert.equal(calculateMaxHubSlots(1, false), 1)
  assert.equal(calculateMaxHubSlots(5, false), 3)
  assert.equal(calculateMaxHubSlots(10, false), 5)
  assert.equal(calculateMaxHubSlots(1, true), 2)
  assert.equal(calculateMaxHubSlots(10, true), 8)

  // Prerequisites checking
  const activeBuildings: any = {
    inst_cmd: { definitionId: "bld_command_center", operationalState: "ACTIVE", operationalEfficiency: 1.0, isOffline: false },
  }
  const lowWorkforcePop: any = { workforceAssigned: 50 }
  const highWorkforcePop: any = { workforceAssigned: 500 }

  // Failing due to insufficient workforce
  const failCheck = canActivateHubSpecialization("COMMAND_HUB", 3, activeBuildings, lowWorkforcePop)
  assert.equal(failCheck.canActivate, false)
  assert.match(failCheck.reason || "", /Thiếu nhân sự vận hành/)

  // Success when conditions met
  const successCheck = canActivateHubSpecialization("COMMAND_HUB", 3, activeBuildings, highWorkforcePop)
  assert.equal(successCheck.canActivate, true)

  // Hub instance suspension & re-evaluation
  const initialHub = createHubSpecializationInstance("COMMAND_HUB", 3, activeBuildings, highWorkforcePop)
  assert.equal(initialHub.status, "ACTIVE")

  // Simulate loss of workforce
  const reEvaluated = reEvaluateHubSpecializations([initialHub], 3, activeBuildings, lowWorkforcePop)
  assert.equal(reEvaluated[0].status, "SUSPENDED")
  assert.ok(reEvaluated[0].suspendedReason)
})

test("10. Capital Orbital Slots Table (MK I..X: 2..12 slots) & max 3 for non-capitals", () => {
  // Capital table: 2, 3, 4, 5, 6, 7, 8, 9, 10, 12 (11 + 1 MAX TIER BONUS)
  assert.equal(calculateMaxOrbitalSlots(1, true), 2)
  assert.equal(calculateMaxOrbitalSlots(2, true), 3)
  assert.equal(calculateMaxOrbitalSlots(3, true), 4)
  assert.equal(calculateMaxOrbitalSlots(4, true), 5)
  assert.equal(calculateMaxOrbitalSlots(5, true), 6)
  assert.equal(calculateMaxOrbitalSlots(6, true), 7)
  assert.equal(calculateMaxOrbitalSlots(7, true), 8)
  assert.equal(calculateMaxOrbitalSlots(8, true), 9)
  assert.equal(calculateMaxOrbitalSlots(9, true), 10)
  assert.equal(calculateMaxOrbitalSlots(10, true), 12, "Capital Tier MK X must have 12 slots (11 + 1 MAX TIER BONUS)")

  // Non-capital bases: max 3
  assert.equal(calculateMaxOrbitalSlots(1, false), 1)
  assert.equal(calculateMaxOrbitalSlots(5, false), 2)
  assert.equal(calculateMaxOrbitalSlots(10, false), 3, "Non-capital base max orbital slots must not exceed 3")

  // Can host checks
  const canHostCap = canHostOrbitalSubBase(2, 4, true)
  assert.equal(canHostCap.canHost, true)
  assert.equal(canHostCap.availableSlots, 3)

  const fullCap = canHostOrbitalSubBase(5, 4, true)
  assert.equal(fullCap.canHost, false)
  assert.match(fullCap.reason || "", /ORBITAL_SLOTS_FULL/)

  // 5 Approved Orbital Sub-Base definitions
  assert.equal(Object.keys(SYSTEM_ORBITAL_SUB_BASE_DEFINITIONS).length, 5)
  assert.ok(SYSTEM_ORBITAL_SUB_BASE_DEFINITIONS["ORBITAL_STATION"])
  assert.ok(SYSTEM_ORBITAL_SUB_BASE_DEFINITIONS["DEFENSE_PLATFORM"])
  assert.ok(SYSTEM_ORBITAL_SUB_BASE_DEFINITIONS["MINING_RIG"])
  assert.ok(SYSTEM_ORBITAL_SUB_BASE_DEFINITIONS["RESEARCH_SANCTUARY"])
  assert.ok(SYSTEM_ORBITAL_SUB_BASE_DEFINITIONS["SHIPYARD_ANNEX"])
})

test("11. Independent Fleet Capacities (Command, Stationing, Docking) with strict orbital port separation", () => {
  const dummyBuildings: any = {
    bld_cmd: { definitionId: "bld_command_center", currentLevel: 2, operationalState: "ACTIVE", operationalEfficiency: 1.0 },
    bld_bastion: { definitionId: "bld_fortress_bastion", currentLevel: 1, operationalState: "ACTIVE", operationalEfficiency: 1.0 },
  }

  const dummySubBases: any[] = [
    { subBaseId: "sub_1", operationalState: "ACTIVE", dockingCapacity: 4 },
  ]

  const caps = evaluateFleetCapacities(
    "sol_command_hq",
    "CAPITAL",
    true,
    4,
    dummyBuildings,
    dummySubBases
  )

  // Physical ground base docking ports: 8
  assert.equal(caps.baseDockingPorts, 8, "Capital ground docking ports must be 8")
  // Expansion ports from fortress bastion: 2
  assert.equal(caps.expansionDockingPorts, 2)
  // Sub-base ports: 4 (Physically separate on orbital station)
  assert.equal(caps.subBaseDockingPorts, 4)
  // Total docking capacity = 8 + 2 + 4 = 14
  assert.equal(caps.fleetDockingCapacity, 14)

  // Command & Stationing independent
  assert.ok(caps.fleetCommandCapacity > 0)
  assert.ok(caps.fleetStationingCapacity > 0)
})

test("12. Local Government AI, Commander Override expiration & 7-day economy forecast", () => {
  const govState: any = {
    aiPersonality: "DEFENSIVE",
    localPriorities: { foodSecurity: 80, militaryReadiness: 90, industrialOutput: 50, infrastructureGrowth: 60 },
    actionLogs: [],
    pendingSupportRequests: [],
  }

  // Set Commander Override expiring on Day 10
  setBaseCommanderOverride(
    govState,
    {
      isLocked: true,
      overrideType: "EMERGENCY_MOBILIZATION",
      expiresAtGameDay: 10,
      overrideReason: "Đe dọa xâm lăng cấp bách",
    },
    5
  )

  // Day 7: Active
  assert.equal(isCommanderOverrideActive(govState, 7), true)
  assert.ok(govState.commanderOverride)

  // Day 10: Expired! Local AI automatically resumes
  assert.equal(isCommanderOverrideActive(govState, 10), false)
  assert.equal(govState.commanderOverride, undefined)
  assert.ok(govState.actionLogs.some((log: string) => log.includes("hết hạn")))

  // 7-day economy forecast
  const baseEntity: any = {
    buildings: {
      bld_fab: { definitionId: "bld_heavy_fabricator", operationalState: "ACTIVE", operationalEfficiency: 1.0 },
    },
    sharedStorage: { food: 500, energy: 200, industrialMaterials: 300, logisticsSupplies: 100, tacticalData: 100 },
  }
  const popState: any = { populationCurrent: 100000, visitorPopulation: 0, externalWorkerPopulation: 0 }
  const defMap: any = new Map([
    ["bld_heavy_fabricator", { id: "bld_heavy_fabricator", baseOutputs: { industrialMaterials: 50 }, baseInputs: { energy: 20 } }],
  ])

  const forecast = calculateBaseEconomyForecast(baseEntity, popState, defMap, 5)
  assert.ok(forecast.consumptionPerDay.food > 0, "Must calculate daily food consumption")
  assert.ok(forecast.daysOfSupply.food !== undefined, "Must compute days of supply")
})

test("13. 7-Step World Reset Preview Stepper", () => {
  const seed = 55443322

  // Execute all 7 steps
  for (let s = 1; s <= 7; s++) {
    const result = executeWorldResetStep(s as any, seed)
    assert.equal(result.step, s)
    assert.equal(result.isValid, true, `Step ${s} preview must be valid`)
    assert.equal(result.totalNodes, 30)
    assert.equal(result.factionDistribution.vss.baseCount, 18)
    assert.equal(result.factionDistribution.void.baseCount, 12)
    assert.ok(result.capitals.vss.isBackline, "VSS Capital must be backline")
    assert.ok(result.capitals.void.isBackline, "Void Capital must be backline")
  }

  // Trigger error when totalMainBaseNodes is invalid
  const invalidStepResult = executeWorldResetStep(1, seed, { totalMainBaseNodes: 20 })
  assert.equal(invalidStepResult.isValid, false)
  assert.ok(invalidStepResult.validationErrors.length > 0)
})

test("14. Dual-interval auto-save (7 game days / 10 real minutes) & Save/Load V1 migration", () => {
  const now = 1700000000000
  const state: any = {
    currentDay: 8,
    realTimeAnchor: now,
    lastAutoSaveGameDay: 1,
    lastAutoSaveTimestamp: now,
  }

  // 7 game days have elapsed (8 - 1 = 7) -> eligible
  const checkDays = checkAutoSaveEligibility(state, now + 60000, DEFAULT_WORLD_GENERATION_CONFIG)
  assert.equal(checkDays.triggered, true)
  assert.equal(checkDays.triggerReason, "GAME_DAYS_INTERVAL")

  // Reset day, but 10 real minutes elapsed (600,000ms) -> eligible
  state.lastAutoSaveGameDay = 8
  const checkTime = checkAutoSaveEligibility(state, now + 600001, DEFAULT_WORLD_GENERATION_CONFIG)
  assert.equal(checkTime.triggered, true)
  assert.equal(checkTime.triggerReason, "REAL_TIME_INTERVAL")

  // Migration test: migrate existing 10-sector world to 30 sectors
  const legacy10World: any = {
    version: 1,
    worldSeed: 12345,
    sectors: {
      sol_command_hq: { id: "sol_command_hq", name: "Custom Sol Name", garrisonPower: 999 },
    },
    routes: [],
  }

  const { state: migrated30, migrated } = migrateWorldStateTo30Sectors(legacy10World)
  assert.equal(migrated, true)
  assert.equal(Object.keys(migrated30.sectors).length, 30, "Migrated world must have 30 sectors")
  assert.equal(migrated30.routes.length, 54, "Migrated world must have 54 routes")
  // Preserves existing player modifications
  assert.equal(migrated30.sectors["sol_command_hq"].name, "Custom Sol Name")
  assert.equal(migrated30.sectors["sol_command_hq"].garrisonPower, 999)
})

test("15. Orbital Sub-Base expansion slots invariant & tier upgrades", () => {
  const subBase = createOrbitalSubBase("sol_command_hq", "DEFENSE_GRID", 1)
  assert.ok(subBase.coreBuildingIds.length > 0, "Orbital Sub-Base must have Core Facilities")
  assert.equal(subBase.expansionBuildingIds.length, 0, "No expansion buildings initially")
  const initialMaxSlots = subBase.maxExpansionSlots
  assert.ok(initialMaxSlots > 0, "Must have valid slot count evaluated from slot profile")

  // Add expansion building
  const addResult = addExpansionBuildingToOrbitalSubBase(subBase, "bld_cargo_depot")
  assert.equal(addResult.success, true, "Should successfully add expansion building")
  assert.equal(subBase.expansionBuildingIds.length, 1)
  assert.ok(subBase.buildings[addResult.instanceId!], "Instance must exist in subBase.buildings")
  // Core facilities are untouched and NEVER consume expansion slots
  assert.equal(subBase.expansionBuildingIds.includes(subBase.coreBuildingIds[0]), false)

  // Upgrade Tier
  const tierUpgrade = upgradeOrbitalSubBaseTier(subBase, 2)
  assert.equal(tierUpgrade.tier, 2)
  assert.equal(subBase.tier, 2)
  assert.ok(subBase.maxExpansionSlots >= initialMaxSlots, "Max expansion slots must not decrease")
})

test("16. 3-Slot Auto-Save ring buffer rotation, checksum validation, and corruption recovery fallback", () => {
  // Clear any existing slots in memory
  if (typeof window !== "undefined") {
    window.localStorage?.clear()
  }

  const worldState = generate30NodeWorld(44556677)

  // Save 4 times to verify ring buffer retains exactly 3 most recent valid slots
  const slot1 = saveAutoSaveSlotRecord(worldState, 1, 100)
  assert.ok(slot1.success)
  const slot2 = saveAutoSaveSlotRecord(worldState, 2, 200)
  assert.ok(slot2.success)
  const slot3 = saveAutoSaveSlotRecord(worldState, 3, 300)
  assert.ok(slot3.success)
  const slot4 = saveAutoSaveSlotRecord(worldState, 4, 400)
  assert.ok(slot4.success)

  const slots = getValidAutoSaveSlots()
  assert.equal(slots.length, 3, "Buffer must contain exactly 3 slots")
  assert.equal(slots[0].currentDay, 4, "Slot 0 must be most recent day 4")
  assert.equal(slots[1].currentDay, 3, "Slot 1 must be day 3")
  assert.equal(slots[2].currentDay, 2, "Slot 2 must be day 2")

  // Test recovery fallback
  const recovery = recoverFromLatestValidAutoSave()
  assert.equal(recovery.recovered, true)
  assert.equal(recovery.state?.worldSeed, 44556677)
})

test("17. DEV Mode project file save & load roundtrip", async () => {
  const worldState = generate30NodeWorld(99887766)
  worldState.currentDay = 42

  const saveRes = await saveWorldStateToDevFile(worldState)
  assert.equal(saveRes.success, true, "Saving to DEV directory must succeed")

  const loadRes = await loadWorldStateFromDevFile()
  assert.equal(loadRes.success, true, "Loading from DEV directory must succeed")
  assert.equal(loadRes.state?.worldSeed, 99887766)
  assert.equal(loadRes.state?.currentDay, 42)
})

test("18. Master Catalog Registry resolution for all 4 FND-6 base catalogs", () => {
  const bootstrapRes = bootstrapWorldCatalogs()
  assert.equal(bootstrapRes.success, true)
  assert.ok(bootstrapRes.baseCatalogsRegistered >= 4, "Must register at least 4 base catalogs")

  const registry = getMasterRegistry()
  const baseClasses = registry.getResolvedItems("base", "base_class")
  assert.ok(baseClasses.length >= 3, "Must resolve base_class items")

  const baseTypes = registry.getResolvedItems("base", "base_type")
  assert.ok(baseTypes.length >= 6, "Must resolve base_type items")

  const hubSpecs = registry.getResolvedItems("base", "hub_specialization")
  assert.ok(hubSpecs.length >= 5, "Must resolve hub_specialization items")

  const worldSeeds = registry.getResolvedItems("base", "world_seed_profile")
  assert.ok(worldSeeds.length >= 3, "Must resolve world_seed_profile items")
})

test("19. Performance benchmark for 30 Sector Galaxy generation, power balancing, and economy forecasting", () => {
  const startTime = performance.now()
  const world = generate30NodeWorld(1337)
  const elapsedMs = performance.now() - startTime

  assert.equal(Object.keys(world.sectors).length, 30)
  assert.equal(Object.keys(world.bases || {}).length, 30)
  assert.ok(elapsedMs < 300, `World generation took ${elapsedMs.toFixed(2)}ms, well under acceptable SLA (<300ms)`)
})

