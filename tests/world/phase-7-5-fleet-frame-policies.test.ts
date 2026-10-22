/**
 * STARFRONT WORLD — Phase 7.5 FRAME Accounting, Annual Decay & Subsidies Test Suite
 *
 * Verifies:
 * 1. Tri-balance FRAME state creation: cycleFrame, availableFrame, totalFrame
 * 2. Awarding FRAME points: Δcycle = +X, Δavailable = +X, Δtotal = +X
 * 3. Awarding FRAME with threat level bonuses and special modifiers
 * 4. Redeeming FRAME points at store: Δavailable = -Cost, Δcycle = 0, Δtotal = 0
 * 5. Store redemption fails gracefully when available points are insufficient
 * 6. Disciplinary Penalty within available balance (only reduces available and cycle)
 * 7. Disciplinary Penalty with Overflow Rule: available -> 0, remainder deducted from totalFrame (floor 0)
 * 8. National average cycle FRAME calculation across active fleets
 * 9. Annual FRAME Decay formula: BaseDecay = Avg/2, ActualDecay = min(BaseDecay, Total * 50%)
 * 10. Annual FRAME Decay deduction and cycle reset to 0
 * 11. Annual FRAME Decay Idempotency: Multiple calls in the same 360-day year are safely guarded
 * 12. NEW_GUILD_PROTECTION 10 Game Years (3600 days) complete exemption from Annual Decay
 * 13. Maintenance Subsidy quota calculation: 10 * MK_Tier
 * 14. Maintenance Subsidy degressive curve: Uses 1-3 at 100%, subsequent uses slope down to 30% floor
 * 15. Maintenance Subsidy Frontline War Exception: Fixed 100% subsidy when threat > 70% or border
 * 16. Claiming maintenance subsidy deducts only net out-of-pocket expenses from fleet treasury
 */

import test from "node:test"
import assert from "node:assert"

import { bootstrapWorldCatalogs } from "../../lib/game/world/bootstrap"
import {
  createFleetEntity,
  createFleetFrameState,
  awardFleetFrame,
  redeemFrameAtStore,
  applyDisciplinaryFramePenalty,
  calculateNationalAverageCycleFrame,
  processAnnualFrameDecay,
  calculateFleetSubsidyRate,
  claimFleetMaintenanceSubsidy,
  getFrameAward,
} from "../../lib/game/world/fleet"

// Ensure catalogs are bootstrapped
bootstrapWorldCatalogs()

test("1. Tri-balance FRAME state creation: cycleFrame, availableFrame, totalFrame", () => {
  const frameState = createFleetFrameState(1500)
  assert.strictEqual(frameState.cycleFrame, 1500)
  assert.strictEqual(frameState.availableFrame, 1500)
  assert.strictEqual(frameState.totalFrame, 1500)
  assert.strictEqual(frameState.lastDecayProcessedYear, 0)
  assert.strictEqual(frameState.subsidiesClaimedThisCycle, 0)
  assert.ok(frameState.auditLog.length > 0)
})

test("2. Awarding FRAME points: Δcycle = +X, Δavailable = +X, Δtotal = +X", () => {
  const frameState = createFleetFrameState(0)
  const awardDef = getFrameAward("FRAME_AWARD_TRADE_LANE_PATROL_CYCLE")
  assert.ok(awardDef)

  const awardRes = awardFleetFrame(frameState, awardDef, 0, 10, 1.0)
  assert.strictEqual(awardRes.pointsAwarded, 150)
  assert.strictEqual(frameState.cycleFrame, 150)
  assert.strictEqual(frameState.availableFrame, 150)
  assert.strictEqual(frameState.totalFrame, 150)

  // Verify audit log
  const log = frameState.auditLog[frameState.auditLog.length - 1]
  assert.strictEqual(log.type, "AWARD")
  assert.strictEqual(log.deltaCycle, 150)
  assert.strictEqual(log.deltaAvailable, 150)
  assert.strictEqual(log.deltaTotal, 150)
})

test("3. Awarding FRAME with threat level bonuses and special modifiers", () => {
  const frameState = createFleetFrameState(0)
  const awardDef = getFrameAward("FRAME_AWARD_BOSS_ELIMINATION")
  assert.ok(awardDef) // base 2500, bonus 1.25

  // 100% Threat level + 2.0x special commendation
  const res = awardFleetFrame(frameState, awardDef, 100, 20, 2.0)
  // threat bonus = 1.0 + (100 * 0.25 / 100) = 1.25
  // points = 2500 * 1.25 * 2.0 = 6250
  assert.strictEqual(res.pointsAwarded, 6250)
  assert.strictEqual(frameState.totalFrame, 6250)
})

test("4. Redeeming FRAME points at store: Δavailable = -Cost, Δcycle = 0, Δtotal = 0", () => {
  const frameState = createFleetFrameState(5000)

  const redeemRes = redeemFrameAtStore(frameState, 1800, "Prototype Tachyon Beam Blueprint", 35)
  assert.strictEqual(redeemRes.success, true)
  assert.strictEqual(frameState.availableFrame, 3200)
  assert.strictEqual(frameState.cycleFrame, 5000) // unchanged
  assert.strictEqual(frameState.totalFrame, 5000) // lifetime honor untouched
})

test("5. Store redemption fails gracefully when available points are insufficient", () => {
  const frameState = createFleetFrameState(800)

  const redeemRes = redeemFrameAtStore(frameState, 2000, "Apex Shield Generator Blueprint", 40)
  assert.strictEqual(redeemRes.success, false)
  assert.strictEqual(frameState.availableFrame, 800)
  assert.ok(redeemRes.error?.includes("Không đủ điểm FRAME khả dụng"))
})

test("6. Disciplinary Penalty within available balance (only reduces available and cycle)", () => {
  const frameState = createFleetFrameState(3000)

  const penaltyRes = applyDisciplinaryFramePenalty(frameState, 1000, "Violation of neutral zone treaty", 50)
  assert.strictEqual(penaltyRes.availableDeducted, 1000)
  assert.strictEqual(penaltyRes.totalDeducted, 0) // Did not overflow
  assert.strictEqual(frameState.availableFrame, 2000)
  assert.strictEqual(frameState.totalFrame, 3000) // total untouched
  assert.strictEqual(frameState.cycleFrame, 2000)
})

test("7. Disciplinary Penalty with Overflow Rule: available -> 0, remainder deducted from totalFrame (floor 0)", () => {
  const frameState = createFleetFrameState(500)
  frameState.availableFrame = 200 // e.g. already spent 300 at store
  // Total is 500, Available is 200, Cycle is 500

  // Penalty of 400
  const penaltyRes = applyDisciplinaryFramePenalty(frameState, 400, "Court-martial major infraction", 60)
  assert.strictEqual(penaltyRes.availableDeducted, 200)
  assert.strictEqual(penaltyRes.totalDeducted, 200) // 400 - 200 = 200 from total
  assert.strictEqual(frameState.availableFrame, 0)
  assert.strictEqual(frameState.totalFrame, 300) // 500 - 200 = 300
  assert.strictEqual(frameState.cycleFrame, 100) // 500 - 400 = 100
})

test("8. National average cycle FRAME calculation across active fleets", () => {
  const fleet1 = createFleetFrameState(4000)
  const fleet2 = createFleetFrameState(6000)
  const fleet3 = createFleetFrameState(2000)

  const avg = calculateNationalAverageCycleFrame([fleet1, fleet2, fleet3])
  assert.strictEqual(avg, 4000) // (4000 + 6000 + 2000) / 3 = 4000
})

test("9. Annual FRAME Decay formula: BaseDecay = Avg/2, ActualDecay = min(BaseDecay, Total * 50%)", () => {
  const fleet = createFleetEntity({
    fleetId: "fleet_decay_test",
    name: "Decay Test Fleet",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
    isNewGuild: false, // Standard established fleet
  })

  // National average = 4000 => BaseDecay = 2000
  // Fleet has Total = 10000 => MaxCap 50% = 5000
  // ActualDecay = min(2000, 5000) = 2000
  const frameState = createFleetFrameState(10000)

  const decayRes = processAnnualFrameDecay(fleet, frameState, 4000, 365) // Year 1
  assert.strictEqual(decayRes.decayApplied, true)
  assert.strictEqual(decayRes.amount, 2000)
  assert.strictEqual(frameState.totalFrame, 8000) // 10000 - 2000
  assert.strictEqual(frameState.cycleFrame, 0) // reset for new year
  assert.strictEqual(frameState.lastDecayProcessedYear, 1)
})

test("10. Annual FRAME Decay deduction respects 50% max cap on smaller fleets", () => {
  const fleet = createFleetEntity({
    fleetId: "fleet_small",
    name: "Small Fleet",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
    isNewGuild: false,
  })

  // National average = 6000 => BaseDecay = 3000
  // Fleet Total = 2000 => MaxCap 50% = 1000
  // ActualDecay = min(3000, 1000) = 1000
  const frameState = createFleetFrameState(2000)

  const decayRes = processAnnualFrameDecay(fleet, frameState, 6000, 365)
  assert.strictEqual(decayRes.decayApplied, true)
  assert.strictEqual(decayRes.amount, 1000)
  assert.strictEqual(frameState.totalFrame, 1000) // 2000 - 1000
})

test("11. Annual FRAME Decay Idempotency: Multiple calls in same year are safely guarded", () => {
  const fleet = createFleetEntity({
    fleetId: "fleet_idempotent",
    name: "Idempotent Fleet",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
    isNewGuild: false,
  })
  const frameState = createFleetFrameState(5000)

  // First run in Year 1 (Day 365)
  const run1 = processAnnualFrameDecay(fleet, frameState, 2000, 365)
  assert.strictEqual(run1.decayApplied, true)
  assert.strictEqual(frameState.totalFrame, 4000)

  // Second run on Day 370 (same Year 1) -> must be blocked
  const run2 = processAnnualFrameDecay(fleet, frameState, 2000, 370)
  assert.strictEqual(run2.decayApplied, false)
  assert.strictEqual(run2.amount, 0)
  assert.strictEqual(frameState.totalFrame, 4000) // completely unchanged
})

test("12. NEW_GUILD_PROTECTION 10 Game Years (3600 days) complete exemption from Annual Decay", () => {
  const rookieFleet = createFleetEntity({
    fleetId: "rookie_fleet",
    name: "Rookie Privateer Guild",
    ownerRef: { ownerType: "GUILD", ownerId: "guild_nova", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
    currentGameDay: 1,
    isNewGuild: true, // Grants 3600 days protection
  })
  assert.strictEqual(rookieFleet.newGuildProtectionExpiryDay, 3601)

  const frameState = createFleetFrameState(3000)

  // Run at Year 1 (Day 365)
  const yr1 = processAnnualFrameDecay(rookieFleet, frameState, 4000, 365)
  assert.strictEqual(yr1.decayApplied, false)
  assert.strictEqual(frameState.totalFrame, 3000) // exempt!

  // Run at Year 5 (Day 1800)
  const yr5 = processAnnualFrameDecay(rookieFleet, frameState, 4000, 1800)
  assert.strictEqual(yr5.decayApplied, false)
  assert.strictEqual(frameState.totalFrame, 3000) // exempt!
})

test("13. Maintenance Subsidy quota calculation: 10 * MK_Tier", () => {
  const squadFleet = createFleetEntity({
    fleetId: "squad_fleet",
    name: "Squad Fleet",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
    fleetClassId: "FLEET_CLASS_MK1_SQUAD", // Tier 1 -> max 10
  })

  const taskForceFleet = createFleetEntity({
    fleetId: "task_force_fleet",
    name: "Task Force Fleet",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
    fleetClassId: "FLEET_CLASS_MK3_TASK_FORCE", // Tier 3 -> max 30
  })

  const r1 = calculateFleetSubsidyRate(squadFleet, squadFleet.frameState, 10)
  assert.strictEqual(r1.maxSubsidies, 10)

  const r2 = calculateFleetSubsidyRate(taskForceFleet, taskForceFleet.frameState, 10)
  assert.strictEqual(r2.maxSubsidies, 30)
})

test("14. Maintenance Subsidy degressive curve: Uses 1-3 at 100%, subsequent uses slope down to 30% floor", () => {
  const fleet = createFleetEntity({
    fleetId: "degressive_fleet",
    name: "Degressive Fleet",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
    fleetClassId: "FLEET_CLASS_MK1_SQUAD", // max 10
  })
  const frameState = fleet.frameState

  // Use 1 -> 100%
  const u1 = calculateFleetSubsidyRate(fleet, frameState, 10)
  assert.strictEqual(u1.subsidyRatePercent, 100)

  // Fast forward to 3 used -> 4th use is first step on degressive curve
  frameState.subsidiesClaimedThisCycle = 3
  const u4 = calculateFleetSubsidyRate(fleet, frameState, 10)
  assert.ok(u4.subsidyRatePercent < 100)
  assert.ok(u4.subsidyRatePercent >= 30)

  // Near the end (8 used)
  frameState.subsidiesClaimedThisCycle = 8
  const u9 = calculateFleetSubsidyRate(fleet, frameState, 10)
  assert.ok(u9.subsidyRatePercent >= 30)

  // Exceeded (10 used) -> ineligible
  frameState.subsidiesClaimedThisCycle = 10
  const u11 = calculateFleetSubsidyRate(fleet, frameState, 10)
  assert.strictEqual(u11.eligible, false)
  assert.strictEqual(u11.subsidyRatePercent, 0)
})

test("15. Maintenance Subsidy Frontline War Exception: Fixed 100% subsidy when threat > 70% or border", () => {
  const fleet = createFleetEntity({
    fleetId: "frontline_fleet",
    name: "Frontline Fleet",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_BORDER_OUTPOST",
    fleetClassId: "FLEET_CLASS_MK1_SQUAD",
  })
  const frameState = fleet.frameState
  frameState.subsidiesClaimedThisCycle = 5 // Normally would be degressive (< 100%)

  // Threat level 85% in border sector
  const frontlineRate = calculateFleetSubsidyRate(fleet, frameState, 85, true)
  assert.strictEqual(frontlineRate.isFrontlineException, true)
  assert.strictEqual(frontlineRate.subsidyRatePercent, 100) // 100% war subsidy!
})

test("16. Claiming maintenance subsidy deducts only net out-of-pocket expenses from fleet treasury", () => {
  const fleet = createFleetEntity({
    fleetId: "claim_fleet",
    name: "Claim Fleet",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
    fleetClassId: "FLEET_CLASS_MK1_SQUAD",
  })

  // Maintenance cost: 1000 credits, rate: 100% (1st use)
  const claim1 = claimFleetMaintenanceSubsidy(fleet, fleet.frameState, 1000, 10, false, 1)
  assert.strictEqual(claim1.success, true)
  assert.strictEqual(claim1.subsidizedCredits, 1000)
  assert.strictEqual(claim1.fleetPaidCredits, 0)
  assert.strictEqual(claim1.newClaimCount, 1)
})
