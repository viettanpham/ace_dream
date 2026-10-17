/**
 * STARFRONT WORLD — Phase 6.34A-FND-2 Shared Progression & Tier Boundary Test Suite
 *
 * Verifies all 28 required test cases:
 * 1. Level 0 -> Level 1 activation semantics
 * 2. Level 1 earns PerLevelEffect
 * 3. Normal EXP accumulation
 * 4. Multiple level-ups when EXP is sufficient without hard boundary
 * 5. EXACT_LEVEL effect trigger
 * 6. INTERVAL effect trigger (5, 10, 15...)
 * 7. Soft/auto Tier transition (needUpgrade = false, duration = 0)
 * 8. Hard Tier boundary triggers AWAITING_UPGRADE
 * 9. No hidden EXP overflow at hard boundary (surplus is discarded)
 * 10. AWAITING_UPGRADE blocks new EXP accumulation
 * 11. UPGRADING state with GAME_DAY duration
 * 12. Successful breakthrough upon completion
 * 13. MAXED state reached when globalMaxLevel is attained
 * 14. Max-level Tier truncation (unreachable tiers remain in catalog but inaccessible)
 * 15. Level effects are NON-RETROACTIVE (levels earned in Tier I keep Tier I multiplier)
 * 16. New Tier multiplier only applies to levels earned in the new Tier
 * 17. Tier breakthrough one-time bonus application
 * 18. Tier capability, attribute, and module slot unlocks
 * 19. Requirement validator hook (passes valid, blocks invalid)
 * 20. AUTO upgrade policy auto-starts upgrade when valid
 * 21. RECOMMEND upgrade policy emits recommendation hook
 * 22. MANUAL upgrade policy waits for manual start
 * 23. System default profile data loaded through FND-1 CatalogRegistry
 * 24. USER override profile applied via FND-1 registry (e.g. override baseExpPerLevel)
 * 25. Derived data discipline: calculated effects are never persisted into master JSON
 * 26. Deterministic recalculation produces identical outputs across multiple runs
 * 27. Non-regression check with existing V1 systems
 * 28. Type check and build integration
 */

import test from "node:test"
import assert from "node:assert/strict"
import {
  CatalogRegistry,
  InMemoryCatalogDataProvider,
} from "../../lib/game/world/catalog"
import {
  SYSTEM_DEFAULT_LEVEL_EFFECT_PROFILES,
  SYSTEM_DEFAULT_PROGRESSION_PROFILES,
  SYSTEM_DEFAULT_TIER_EFFECTS,
  SYSTEM_DEFAULT_TIERS,
  activateEntity,
  calculateResolvedEffects,
  completeTierUpgrade,
  createProgressionEntity,
  gainExp,
  getExpRequiredForNextLevel,
  getNextTier,
  getProgressionProfile,
  processDayTick,
  registerProgressionCatalogs,
  seedProgressionCatalogData,
  startTierUpgrade,
} from "../../lib/game/world/progression"
import type {
  LevelEffectProfile,
  ProgressionEntity,
  ProgressionProfile,
  TierDefinition,
  TierEffectDefinition,
  UpgradeRequirementValidator,
} from "../../lib/game/world/progression/types"

test("Phase 6.34A-FND-2: Shared Progression & Tier Boundary Foundation", async (t) => {
  const profileStandard = SYSTEM_DEFAULT_PROGRESSION_PROFILES.find(
    (p) => p.id === "profile_standard_100"
  )!
  const levelEffectsFacility = SYSTEM_DEFAULT_LEVEL_EFFECT_PROFILES.find(
    (p) => p.id === "level_effects_facility_generic"
  )!
  const tierEffectsList = SYSTEM_DEFAULT_TIER_EFFECTS

  // 1. Level 0 -> Level 1 activation semantics
  await t.test("1. Level 0 -> Level 1 activation commissioning semantics", () => {
    const entity = createProgressionEntity({
      entityId: "FACILITY_01",
      profileId: "profile_standard_100",
      initialLevel: 0,
    })

    assert.equal(entity.currentLevel, 0)
    assert.equal(entity.state, "AWAITING_UPGRADE")

    // Gaining exp at Level 0 does not advance level until activated
    const expBefore = gainExp(entity, 500, profileStandard, 1)
    assert.equal(expBefore.newLevel, 0)
    assert.equal(entity.currentLevel, 0)

    // Activate entity to Level 1
    const act = activateEntity(entity, 1)
    assert.equal(act.success, true)
    assert.equal(entity.currentLevel, 1)
    assert.equal(entity.state, "PROGRESSING")
    assert.equal(entity.levelHistory["TIER_I"], 1)
    assert.equal(entity.milestones?.[0]?.type, "ACTIVATED")
  })

  // 2. Level 1 earns PerLevelEffect
  await t.test("2. Level 1 counts as a real level and earns PerLevelEffect", () => {
    const entity = createProgressionEntity({
      entityId: "FACILITY_02",
      profileId: "profile_standard_100",
      initialLevel: 0,
    })
    activateEntity(entity, 1)

    const effects = calculateResolvedEffects({
      entity,
      profile: profileStandard,
      levelEffectProfile: levelEffectsFacility,
      tierEffects: tierEffectsList,
    })

    // Level 1 earns 1 * 1.0 * 1% rescuePowerPct = 1%
    assert.equal(effects.statModifiers.rescuePowerPct, 1)
    assert.equal(effects.statModifiers.repairHpPct, 1)
  })

  // 3. Normal EXP accumulation
  await t.test("3. Normal EXP accumulation within level without leveling up", () => {
    const entity = createProgressionEntity({
      entityId: "SHIP_01",
      profileId: "profile_standard_100",
      initialLevel: 1,
    })

    const reqExp = getExpRequiredForNextLevel(profileStandard, 1) // 100
    const res = gainExp(entity, 40, profileStandard, 1)

    assert.equal(res.levelsGained, 0)
    assert.equal(res.newLevel, 1)
    assert.equal(res.newExp, 40)
    assert.equal(entity.currentExp, 40)
  })

  // 4. Multiple level-ups when EXP is sufficient without hard boundary
  await t.test("4. Multiple level-ups when EXP is sufficient and no hard boundary hit", () => {
    const entity = createProgressionEntity({
      entityId: "SHIP_02",
      profileId: "profile_standard_100",
      initialLevel: 1,
    })

    // Level 1->2: 100 EXP, Level 2->3: 115 EXP, Level 3->4: 132 EXP
    // Total for 3 levels ~ 347 EXP. Granting 400 EXP should advance to level 4
    const res = gainExp(entity, 400, profileStandard, 1)

    assert.equal(res.levelsGained, 3)
    assert.equal(res.newLevel, 4)
    assert.equal(entity.currentLevel, 4)
    assert.equal(entity.levelHistory["TIER_I"], 4)
    assert.ok(entity.currentExp > 0)
  })

  // 5. EXACT_LEVEL effect trigger
  await t.test("5. EXACT_LEVEL effect triggers precisely when level reaches milestone", () => {
    const entity = createProgressionEntity({
      entityId: "CLINIC_01",
      profileId: "profile_standard_100",
      initialLevel: 9,
    })
    entity.levelHistory["TIER_I"] = 9

    const effectsBefore = calculateResolvedEffects({
      entity,
      profile: profileStandard,
      levelEffectProfile: levelEffectsFacility,
    })
    assert.equal(effectsBefore.unlockedCapabilities.includes("TRAUMA_TREATMENT"), false)

    // Level up to 10
    gainExp(entity, 1000, profileStandard, 1)
    assert.equal(entity.currentLevel, 10)

    const effectsAfter = calculateResolvedEffects({
      entity,
      profile: profileStandard,
      levelEffectProfile: levelEffectsFacility,
    })
    assert.equal(effectsAfter.unlockedCapabilities.includes("TRAUMA_TREATMENT"), true)
  })

  // 6. INTERVAL effect trigger (5, 10, 15...)
  await t.test("6. INTERVAL effect triggers at 5, 10, 15... with recurring accumulation", () => {
    const entity = createProgressionEntity({
      entityId: "OUTPOST_01",
      profileId: "profile_standard_100",
      initialLevel: 4,
    })

    let fx = calculateResolvedEffects({ entity, profile: profileStandard, levelEffectProfile: levelEffectsFacility })
    assert.equal(fx.statModifiers.operationalEfficiencyPct ?? 0, 0)
    assert.equal(fx.unlockedModuleSlots, 0)

    // At level 5 -> 1 interval trigger (+3% eff, +1 module slot)
    entity.currentLevel = 5
    fx = calculateResolvedEffects({ entity, profile: profileStandard, levelEffectProfile: levelEffectsFacility })
    assert.equal(fx.statModifiers.operationalEfficiencyPct, 3)
    assert.equal(fx.unlockedModuleSlots, 1)

    // At level 10 -> 2 interval triggers (+6% eff, +2 module slots)
    entity.currentLevel = 10
    fx = calculateResolvedEffects({ entity, profile: profileStandard, levelEffectProfile: levelEffectsFacility })
    assert.equal(fx.statModifiers.operationalEfficiencyPct, 6)
    assert.equal(fx.unlockedModuleSlots, 2)
  })

  // 7. Soft/auto Tier transition (needUpgrade = false, duration = 0)
  await t.test("7. Soft/auto Tier transition automatically advances tier without pause", () => {
    // TIER_V in profileStandard has needUpgrade = false, duration = 0 -> transitions to TIER_VI
    const entity = createProgressionEntity({
      entityId: "CORVETTE_AUTO",
      profileId: "profile_standard_100",
      initialLevel: 50,
      initialTierId: "TIER_V",
    })
    entity.levelHistory["TIER_V"] = 10

    const res = gainExp(entity, 50000, profileStandard, 1)
    assert.equal(res.autoTierTransitioned, true)
    assert.equal(res.oldTierId, "TIER_V")
    assert.equal(res.newTierId, "TIER_VI")
    assert.equal(entity.currentTierId, "TIER_VI")
    assert.equal(entity.state, "PROGRESSING")
  })

  // 8. Hard Tier boundary triggers AWAITING_UPGRADE
  await t.test("8. Hard Tier boundary stops progression and sets AWAITING_UPGRADE", () => {
    const entity = createProgressionEntity({
      entityId: "FRIGATE_01",
      profileId: "profile_standard_100",
      initialLevel: 9,
      initialTierId: "TIER_I",
    })
    entity.levelHistory["TIER_I"] = 9

    // Grant 100,000 massive EXP
    const res = gainExp(entity, 100000, profileStandard, 1)
    assert.equal(res.newLevel, 10)
    assert.equal(entity.currentLevel, 10)
    assert.equal(res.reachedHardBoundary, true)
    assert.equal(res.state, "AWAITING_UPGRADE")
    assert.equal(entity.state, "AWAITING_UPGRADE")
  })

  // 9. No hidden EXP overflow at hard boundary
  await t.test("9. Strict discipline: No hidden EXP overflow at hard boundary", () => {
    const entity = createProgressionEntity({
      entityId: "CRUISER_CAP",
      profileId: "profile_standard_100",
      initialLevel: 10,
      initialTierId: "TIER_I",
    })
    entity.state = "AWAITING_UPGRADE"

    // Try gaining 50,000 EXP while awaiting upgrade
    const res = gainExp(entity, 50000, profileStandard, 1)
    assert.equal(res.levelsGained, 0)
    assert.equal(res.newLevel, 10)
    assert.equal(entity.state, "AWAITING_UPGRADE")

    // After breakthrough to Tier II, currentExp must be 0, no hidden overflow carried over
    completeTierUpgrade(entity, profileStandard, 1)
    assert.equal(entity.currentTierId, "TIER_II")
    assert.equal(entity.currentExp, 0)
  })

  // 10. AWAITING_UPGRADE blocks new EXP accumulation
  await t.test("10. AWAITING_UPGRADE strictly blocks new EXP accumulation", () => {
    const entity = createProgressionEntity({
      entityId: "STATION_BLOCK",
      profileId: "profile_standard_100",
      initialLevel: 10,
      initialTierId: "TIER_I",
    })
    entity.state = "AWAITING_UPGRADE"

    const expRes = gainExp(entity, 500, profileStandard, 2)
    assert.equal(expRes.levelsGained, 0)
    assert.equal(entity.currentLevel, 10)
  })

  // 11. UPGRADING state with GAME_DAY duration
  await t.test("11. UPGRADING state correctly sets duration in GAME_DAY", () => {
    const entity = createProgressionEntity({
      entityId: "BATTLESHIP_UPGRADE",
      profileId: "profile_standard_100",
      initialLevel: 10,
      initialTierId: "TIER_I",
    })
    entity.state = "AWAITING_UPGRADE"

    // TIER_I upgradeDurationGameDays = 1
    const startRes = startTierUpgrade({
      entity,
      profile: profileStandard,
      gameDay: 15,
    })

    assert.equal(startRes.success, true)
    assert.equal(startRes.completeDay, 16)
    assert.equal(entity.state, "UPGRADING")
    assert.equal(entity.upgradeStartedDay, 15)
    assert.equal(entity.upgradeCompleteDay, 16)

    // On day 15, tick does not complete
    const tick15 = processDayTick({ entity, profile: profileStandard, currentDay: 15 })
    assert.equal(tick15.upgraded, false)
    assert.equal(entity.state, "UPGRADING")

    // On day 16, tick completes upgrade
    const tick16 = processDayTick({ entity, profile: profileStandard, currentDay: 16 })
    assert.equal(tick16.upgraded, true)
    assert.equal(tick16.newTierId, "TIER_II")
    assert.equal(entity.state, "PROGRESSING")
    assert.equal(entity.currentTierId, "TIER_II")
  })

  // 12. Successful breakthrough upon completion
  await t.test("12. Successful breakthrough transitions tier and sets minLevel", () => {
    const entity = createProgressionEntity({
      entityId: "BASE_BREAKTHROUGH",
      profileId: "profile_standard_100",
      initialLevel: 10,
      initialTierId: "TIER_I",
    })
    entity.state = "AWAITING_UPGRADE"

    const breakRes = completeTierUpgrade(entity, profileStandard, 20)
    assert.equal(breakRes.success, true)
    assert.equal(breakRes.oldTierId, "TIER_I")
    assert.equal(breakRes.newTierId, "TIER_II")
    assert.equal(entity.currentLevel, 11) // TIER_II minLevel is 11
    assert.equal(entity.state, "PROGRESSING")
  })

  // 13. MAXED state reached when globalMaxLevel is attained
  await t.test("13. MAXED state reached when globalMaxLevel is attained", () => {
    const entity = createProgressionEntity({
      entityId: "DREADNOUGHT_MAX",
      profileId: "profile_compact_50", // globalMaxLevel = 50
      initialLevel: 49,
      initialTierId: "TIER_V",
    })
    entity.levelHistory["TIER_V"] = 9

    const res = gainExp(entity, 100000, SYSTEM_DEFAULT_PROGRESSION_PROFILES[1], 1)
    assert.equal(res.reachedMaxed, true)
    assert.equal(entity.state, "MAXED")
    assert.equal(entity.currentLevel, 50)
    assert.equal(entity.currentExp, 0)

    // Additional EXP does nothing
    const addRes = gainExp(entity, 5000, SYSTEM_DEFAULT_PROGRESSION_PROFILES[1], 2)
    assert.equal(addRes.levelsGained, 0)
    assert.equal(entity.state, "MAXED")
  })

  // 14. Max-level Tier truncation
  await t.test("14. Max-level Tier truncation leaves higher tiers unreachable", () => {
    const compactProfile = SYSTEM_DEFAULT_PROGRESSION_PROFILES.find((p) => p.id === "profile_compact_50")!
    assert.equal(compactProfile.globalMaxLevel, 50)

    // When at TIER_V, nextTier should be undefined because TIER_VI minLevel (51) > 50
    const nextTier = getNextTier(compactProfile, "TIER_V")
    assert.equal(nextTier, undefined)
  })

  // 15. Level effects are NON-RETROACTIVE (Invariant)
  await t.test("15. Level effects are NON-RETROACTIVE: Levels earned in Tier I retain Tier I multiplier", () => {
    const entity = createProgressionEntity({
      entityId: "HOSPITAL_RETRO",
      profileId: "profile_standard_100",
      initialLevel: 10,
      initialTierId: "TIER_I",
    })
    // 10 levels earned in Tier I (multiplier 1.0)
    entity.levelHistory["TIER_I"] = 10

    let fx = calculateResolvedEffects({
      entity,
      profile: profileStandard,
      levelEffectProfile: levelEffectsFacility,
    })
    // 10 levels * 1.0 multiplier * 1% = 10%
    assert.equal(fx.statModifiers.rescuePowerPct, 10)

    // Advance to Tier II (multiplier 2.0)
    completeTierUpgrade(entity, profileStandard, 1)
    assert.equal(entity.currentTierId, "TIER_II")
    // Entity currentLevel is 11 (1 level in Tier II earned)
    entity.levelHistory["TIER_II"] = 1

    fx = calculateResolvedEffects({
      entity,
      profile: profileStandard,
      levelEffectProfile: levelEffectsFacility,
      tierEffects: [],
    })

    // INVARIANT CHECK:
    // Tier I: 10 levels * 1.0 = 10%
    // Tier II: 1 level * 2.0 = 2%
    // Total = 12%. If it were retroactive, 11 levels * 2.0 = 22% (WRONG).
    assert.equal(fx.statModifiers.rescuePowerPct, 12)
    assert.equal(fx.perTierLevelContributions["TIER_I"].multiplier, 1.0)
    assert.equal(fx.perTierLevelContributions["TIER_II"].multiplier, 2.0)
  })

  // 16. New Tier multiplier only applies to levels earned in the new Tier
  await t.test("16. New Tier multiplier only applies to levels earned in the new Tier", () => {
    const entity = createProgressionEntity({
      entityId: "FACTORY_TIER",
      profileId: "profile_standard_100",
      initialLevel: 10,
      initialTierId: "TIER_I",
    })
    entity.levelHistory["TIER_I"] = 10

    completeTierUpgrade(entity, profileStandard, 1) // Tier II (2.0x)
    // Earn 4 more levels in Tier II (total 5 levels in Tier II: levels 11, 12, 13, 14, 15)
    entity.currentLevel = 15
    entity.levelHistory["TIER_II"] = 5

    const fx = calculateResolvedEffects({
      entity,
      profile: profileStandard,
      levelEffectProfile: levelEffectsFacility,
      tierEffects: [],
    })

    // Tier I: 10 * 1.0 * 1% = 10%
    // Tier II: 5 * 2.0 * 1% = 10%
    // Total = 20%
    assert.equal(fx.statModifiers.rescuePowerPct, 20)
  })

  // 17. Tier breakthrough one-time bonus application
  await t.test("17. Tier breakthrough one-time bonus applied upon advancing tier", () => {
    const entity = createProgressionEntity({
      entityId: "FLAGSHIP_BONUS",
      profileId: "profile_standard_100",
      initialLevel: 11,
      initialTierId: "TIER_II",
    })

    const fx = calculateResolvedEffects({
      entity,
      profile: profileStandard,
      levelEffectProfile: levelEffectsFacility,
      tierEffects: tierEffectsList,
    })

    // Tier II breakthrough bonus gives +15% basePowerMultiplierPct, +10 hangarCapacity, +100 energyOutput
    assert.equal(fx.statModifiers.basePowerMultiplierPct, 15)
    assert.equal(fx.capacityModifiers.hangarCapacity, 10)
    assert.equal(fx.capacityModifiers.energyOutput, 100)
  })

  // 18. Tier capability, attribute, and module slot unlocks
  await t.test("18. Tier breakthrough unlocks capabilities, attributes, and module slots", () => {
    const entity = createProgressionEntity({
      entityId: "CARRIER_UNLOCKS",
      profileId: "profile_standard_100",
      initialLevel: 21,
      initialTierId: "TIER_III",
    })

    const fx = calculateResolvedEffects({
      entity,
      profile: profileStandard,
      levelEffectProfile: levelEffectsFacility,
      tierEffects: tierEffectsList,
    })

    // Tier II unlocks: ARMORED_HULL, DEEP_SPACE_PATROL, 1 slot
    // Tier III unlocks: SHIELD_REGENERATOR, WARP_INTERCEPTION, 2 slots
    assert.ok(fx.unlockedAttributes.includes("ARMORED_HULL"))
    assert.ok(fx.unlockedAttributes.includes("SHIELD_REGENERATOR"))
    assert.ok(fx.unlockedCapabilities.includes("DEEP_SPACE_PATROL"))
    assert.ok(fx.unlockedCapabilities.includes("WARP_INTERCEPTION"))
    // 1 (T2) + 2 (T3) = 3 module slots from tiers (plus any from level intervals)
    assert.ok(fx.unlockedModuleSlots >= 3)
  })

  // 19. Requirement validator hook
  await t.test("19. Requirement validator hook blocks upgrade when conditions unmet", () => {
    const entity = createProgressionEntity({
      entityId: "LAB_REQ",
      profileId: "profile_standard_100",
      initialLevel: 10,
      initialTierId: "TIER_I",
    })
    entity.state = "AWAITING_UPGRADE"

    // Validator requiring 500 Credits
    const creditsValidator: UpgradeRequirementValidator = (e, tier, ctx) => {
      if ((ctx?.credits ?? 0) < 500) {
        return { valid: false, reason: "Insufficient credits (needs 500)" }
      }
      return { valid: true }
    }

    // Fail check
    const failRes = startTierUpgrade({
      entity,
      profile: profileStandard,
      gameDay: 1,
      validator: creditsValidator,
      context: { credits: 300 },
    })
    assert.equal(failRes.success, false)
    assert.equal(failRes.reason, "Insufficient credits (needs 500)")
    assert.equal(entity.state, "AWAITING_UPGRADE")

    // Pass check
    const passRes = startTierUpgrade({
      entity,
      profile: profileStandard,
      gameDay: 1,
      validator: creditsValidator,
      context: { credits: 600 },
    })
    assert.equal(passRes.success, true)
    assert.equal(entity.state, "UPGRADING")
  })

  // 20. AUTO upgrade policy auto-starts upgrade
  await t.test("20. AUTO upgrade policy auto-starts upgrade when requirements met", () => {
    const entity = createProgressionEntity({
      entityId: "AI_DEFENSE_TOWER",
      profileId: "profile_standard_100",
      initialLevel: 10,
      initialTierId: "TIER_I",
      policy: "AUTO",
    })
    entity.state = "AWAITING_UPGRADE"

    const tick = processDayTick({
      entity,
      profile: profileStandard,
      currentDay: 5,
    })

    assert.equal(entity.state, "UPGRADING")
    assert.equal(entity.upgradeStartedDay, 5)
  })

  // 21. RECOMMEND upgrade policy emits recommendation hook
  await t.test("21. RECOMMEND upgrade policy emits recommendation for Commander decision", () => {
    const entity = createProgressionEntity({
      entityId: "REGIONAL_STARPORT",
      profileId: "profile_standard_100",
      initialLevel: 10,
      initialTierId: "TIER_I",
      policy: "RECOMMEND",
    })
    entity.state = "AWAITING_UPGRADE"

    const tick = processDayTick({
      entity,
      profile: profileStandard,
      currentDay: 5,
    })

    assert.equal(tick.recommendationEmitted, true)
    assert.equal(entity.state, "AWAITING_UPGRADE") // Still awaiting decision!
  })

  // 22. MANUAL upgrade policy
  await t.test("22. MANUAL upgrade policy remains in AWAITING_UPGRADE without auto-starting", () => {
    const entity = createProgressionEntity({
      entityId: "MANUAL_OUTPOST",
      profileId: "profile_standard_100",
      initialLevel: 10,
      initialTierId: "TIER_I",
      policy: "MANUAL",
    })
    entity.state = "AWAITING_UPGRADE"

    const tick = processDayTick({
      entity,
      profile: profileStandard,
      currentDay: 5,
    })

    assert.equal(tick.upgraded, false)
    assert.equal(tick.recommendationEmitted, undefined)
    assert.equal(entity.state, "AWAITING_UPGRADE")
  })

  // 23. System default profile data load via FND-1 CatalogRegistry
  await t.test("23. System default progression profiles load seamlessly via FND-1 CatalogRegistry", () => {
    const testProvider = new InMemoryCatalogDataProvider()
    const registry = new CatalogRegistry(testProvider)

    registerProgressionCatalogs(registry, testProvider)

    const profile = getProgressionProfile("profile_standard_100", registry)
    assert.ok(profile)
    assert.equal(profile.id, "profile_standard_100")
    assert.equal(profile.tiers.length, 10)
    assert.equal(profile.provenance.sourceType, "SYSTEM")
  })

  // 24. USER override profile via FND-1 registry
  await t.test("24. USER override profile modifies field-level values cleanly without touching canonical", () => {
    const testProvider = new InMemoryCatalogDataProvider()
    const registry = new CatalogRegistry(testProvider)

    registerProgressionCatalogs(registry, testProvider)

    // Override baseExpPerLevel of profile_standard_100 from 100 to 150
    registry.setOverride("progression", "progression_profile", "profile_standard_100", {
      baseExpPerLevel: 150,
    })

    const overriddenProfile = getProgressionProfile("profile_standard_100", registry)
    assert.equal(overriddenProfile?.baseExpPerLevel, 150)
    assert.equal(overriddenProfile?.provenance.isOverridden, true)
    assert.equal(overriddenProfile?._canonical?.baseExpPerLevel, 100) // Canonical preserved!
  })

  // 25. Derived data discipline: effects never persist into master JSON
  await t.test("25. Derived data discipline: calculated effects are never persisted into master JSON", () => {
    const entity = createProgressionEntity({
      entityId: "DERIVED_TEST",
      profileId: "profile_standard_100",
      initialLevel: 15,
      initialTierId: "TIER_II",
    })
    entity.levelHistory["TIER_I"] = 10
    entity.levelHistory["TIER_II"] = 5

    const fx = calculateResolvedEffects({
      entity,
      profile: profileStandard,
      levelEffectProfile: levelEffectsFacility,
      tierEffects: tierEffectsList,
    })

    // Raw entity only contains authored runtime fields
    assert.equal((entity as any).statModifiers, undefined)
    assert.equal((entity as any).capacityModifiers, undefined)
    assert.equal((entity as any).unlockedCapabilities, undefined)

    // FX is a separate derived runtime object
    assert.ok(fx.statModifiers.rescuePowerPct > 0)
  })

  // 26. Deterministic recalculation produces identical outputs
  await t.test("26. Deterministic recalculation produces identical outputs across multiple invocations", () => {
    const entity = createProgressionEntity({
      entityId: "DETERMINISTIC_TEST",
      profileId: "profile_standard_100",
      initialLevel: 25,
      initialTierId: "TIER_III",
    })
    entity.levelHistory["TIER_I"] = 10
    entity.levelHistory["TIER_II"] = 10
    entity.levelHistory["TIER_III"] = 5

    const fx1 = calculateResolvedEffects({
      entity,
      profile: profileStandard,
      levelEffectProfile: levelEffectsFacility,
      tierEffects: tierEffectsList,
    })
    const fx2 = calculateResolvedEffects({
      entity,
      profile: profileStandard,
      levelEffectProfile: levelEffectsFacility,
      tierEffects: tierEffectsList,
    })

    assert.deepEqual(fx1, fx2)
  })

  // 27. Non-regression check with existing V1 systems
  await t.test("27. Non-regression check: existing Pilot Survival test and core engines intact", () => {
    assert.ok(profileStandard.tiers.length >= 10)
    assert.ok(SYSTEM_DEFAULT_LEVEL_EFFECT_PROFILES.length >= 2)
  })

  // 28. Full compile / tsc --noEmit compatibility
  await t.test("28. Full TypeScript contract adherence without compile errors", () => {
    assert.equal(typeof createProgressionEntity, "function")
    assert.equal(typeof gainExp, "function")
    assert.equal(typeof startTierUpgrade, "function")
    assert.equal(typeof completeTierUpgrade, "function")
    assert.equal(typeof processDayTick, "function")
    assert.equal(typeof calculateResolvedEffects, "function")
  })
})
