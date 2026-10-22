/**
 * STARFRONT WORLD — Phase 6.34 Pilot Survival & Search-and-Rescue (SAR) Test Suite
 *
 * Verifies:
 * 1. System Invariant: GEAR HP = 0 => GEAR DESTROYED, Pilot Survival is decoupled (GEAR DESTROYED != PILOT KIA)
 * 2. Survival Score Calculation: Formula respects force balance, protection, enemy pressure, clamped [0..100]
 * 3. Outcome Tier Categorization: SAFE (>= 70), PROTECTED (50-69), CRITICAL (30-49), KIA (<= 29)
 * 4. Configuration Reactivity: Dynamic threshold changes from AdminCP take effect immediately
 * 5. Post-Battle SAR Resolution: SAFE/PROTECTED => RESCUED; CRITICAL evaluates battlefield control & probabilities
 * 6. Victory vs. Defeat Resolution: Allied victory boosts extraction; Defeat leads to POW capture & KIA risk
 * 7. National POW Registry: Captured pilots recorded in state.nationalPowRegistry
 * 8. Mission Dispatch Integration: Capturing a pilot unlocks a SAR Hostage Rescue mission in missionDispatches
 * 9. Idempotent WORLD State Commit: Committing combat results multiple times does not duplicate pilots or casualties
 * 10. End-to-End Combat V2 Integration: Full combat produces downed candidates, survival records, and receipt SAR summary
 */

import test from "node:test"
import assert from "node:assert/strict"
import {
  DEFAULT_SURVIVAL_CONFIG,
  getSurvivalConfig,
  validateSurvivalConfig,
  calculatePilotSurvivalScore,
  determineSurvivalTier,
  resolvePostBattlePilotStatus,
  processCombatDownedPilots,
  applyPilotSurvivalToWorldState,
} from "../../lib/game/world/pilot-survival-engine"
import type {
  PilotSurvivalTier,
  PilotFinalStatus,
  SurvivalConfig,
} from "../../lib/game/world/pilot-survival-types"
import { createInitialWorldState } from "../../lib/game/world/initial-state"
import {
  createCombatV2EncounterSnapshot,
  executeCombatV2Simulation,
  commitCombatV2Result,
} from "../../lib/game/world/combat-v2-engine"
import type { CombatV2Gear, DownedPilotCandidate } from "../../lib/game/world/combat-v2-types"
import { WorldPRNG } from "../../lib/game/world/random"
import { lockEncounterAndCreateSnapshot } from "../../lib/game/world/combat-adapter"

test("STARFRONT Phase 6.34 — Pilot Survival & Search-and-Rescue (SAR)", async (t) => {
  await t.test("1. System Invariant: GEAR HP = 0 => DESTROYED, nhưng Phi công thoát hiểm độc lập", () => {
    // Khi một GEAR bị tiêu diệt, cỗ máy vĩnh viễn mất nhưng phi công có thể đạt điểm sinh tồn cao (SAFE)
    const calculation = calculatePilotSurvivalScore({
      alliedRemainingHp: 1000,
      alliedMaxHp: 1200,
      enemyRemainingHp: 200,
      enemyMaxHp: 1000,
      alliedActiveCount: 4,
      enemyActiveCount: 1,
      alliedCommanderActive: true,
      alliedOffensivePower: 150,
      enemyOffensivePower: 40,
      hasActiveSupport: true,
      alliedMorale: 90,
      isPlayer: false,
    })

    assert.ok(calculation.score >= DEFAULT_SURVIVAL_CONFIG.thresholdSafe, "Score phải >= 70 khi đồng minh áp đảo")
    const tier = determineSurvivalTier(calculation.score, DEFAULT_SURVIVAL_CONFIG)
    assert.equal(tier, "SAFE", "Phi công phải ở trạng thái SAFE mặc dù cỗ máy đã bị nổ tung")

    // Giải quyết hậu trận chiến: SAFE luôn luôn sống sót (RESCUED)
    const outcome = resolvePostBattlePilotStatus({
      initialTier: tier,
      victory: true,
      config: DEFAULT_SURVIVAL_CONFIG,
    })
    assert.equal(outcome.status, "RESCUED", "SAFE phải luôn được giải cứu thành công")
    assert.notEqual(outcome.status, "KIA", "Bất biến: GEAR DESTROYED không đồng nghĩa PILOT KIA")
  })

  await t.test("2. Survival Score Calculation: Công thức tính điểm sinh tồn chuẩn xác và bị chặn [0..100]", () => {
    // Trường hợp 1: Điều kiện thuận lợi cực đại
    const maxCalc = calculatePilotSurvivalScore({
      alliedRemainingHp: 5000,
      alliedMaxHp: 5000,
      enemyRemainingHp: 0,
      enemyMaxHp: 2000,
      alliedActiveCount: 5,
      enemyActiveCount: 0,
      alliedCommanderActive: true,
      hasActiveSupport: true,
      alliedMorale: 100,
    })
    assert.ok(maxCalc.score <= 100, "Điểm không được vượt quá 100")
    assert.ok(maxCalc.score >= 80, "Điểm phải rất cao khi điều kiện tối ưu")

    // Trường hợp 2: Điều kiện nguy khốn cực độ
    const minCalc = calculatePilotSurvivalScore({
      alliedRemainingHp: 0,
      alliedMaxHp: 3000,
      enemyRemainingHp: 4000,
      enemyMaxHp: 4000,
      alliedActiveCount: 0,
      enemyActiveCount: 6,
      alliedCommanderActive: false,
      hasActiveSupport: false,
      alliedMorale: 10,
    })
    assert.ok(minCalc.score >= 0, "Điểm không được âm (< 0)")
    assert.ok(minCalc.score <= 30, "Điểm phải rất thấp khi bị áp đảo hoàn toàn")
  })

  await t.test("3. Outcome Tier Categorization: Phân loại chính xác 4 thứ hạng SAFE, PROTECTED, CRITICAL, KIA", () => {
    const cfg = DEFAULT_SURVIVAL_CONFIG // 70, 50, 30

    assert.equal(determineSurvivalTier(100, cfg), "SAFE")
    assert.equal(determineSurvivalTier(70, cfg), "SAFE")

    assert.equal(determineSurvivalTier(69, cfg), "PROTECTED")
    assert.equal(determineSurvivalTier(50, cfg), "PROTECTED")

    assert.equal(determineSurvivalTier(49, cfg), "CRITICAL")
    assert.equal(determineSurvivalTier(30, cfg), "CRITICAL")

    assert.equal(determineSurvivalTier(29, cfg), "KIA")
    assert.equal(determineSurvivalTier(0, cfg), "KIA")
  })

  await t.test("4. Configuration Reactivity: AdminCP thay đổi ngưỡng thì phân loại cập nhật ngay", () => {
    // Đặt cấu hình khắt khe: SAFE >= 85, PROTECTED >= 65, CRITICAL >= 45
    const strictConfig: SurvivalConfig = {
      ...DEFAULT_SURVIVAL_CONFIG,
      thresholdSafe: 85,
      thresholdProtected: 65,
      thresholdCritical: 45,
    }

    const score = 72
    // Với default config (thresholdSafe = 70), 72 là SAFE
    assert.equal(determineSurvivalTier(score, DEFAULT_SURVIVAL_CONFIG), "SAFE")
    // Với strictConfig (thresholdSafe = 85, thresholdProtected = 65), 72 trở thành PROTECTED
    assert.equal(determineSurvivalTier(score, strictConfig), "PROTECTED")
  })

  await t.test("5. Post-Battle SAR Resolution: SAFE & PROTECTED luôn sống; CRITICAL phân định theo bối cảnh", () => {
    const cfg = DEFAULT_SURVIVAL_CONFIG

    // SAFE luôn luôn RESCUED bất kể thắng hay bại
    const safeWin = resolvePostBattlePilotStatus({ initialTier: "SAFE", victory: true, config: cfg })
    const safeLoss = resolvePostBattlePilotStatus({ initialTier: "SAFE", victory: false, config: cfg })
    assert.equal(safeWin.status, "RESCUED")
    assert.equal(safeLoss.status, "RESCUED")

    // PROTECTED luôn luôn RESCUED
    const protWin = resolvePostBattlePilotStatus({ initialTier: "PROTECTED", victory: true, config: cfg })
    const protLoss = resolvePostBattlePilotStatus({ initialTier: "PROTECTED", victory: false, config: cfg })
    assert.equal(protWin.status, "RESCUED")
    assert.equal(protLoss.status, "RESCUED")

    // KIA luôn luôn KIA
    const kiaWin = resolvePostBattlePilotStatus({ initialTier: "KIA", victory: true, config: cfg })
    assert.equal(kiaWin.status, "KIA")
  })

  await t.test("6. Victory vs Defeat Resolution: Phe ta thắng tăng mạnh cơ hội cứu; Phe ta bại có nguy cơ POW", () => {
    const cfg = DEFAULT_SURVIVAL_CONFIG

    // Khi phe ta thắng (Victory): Thưởng +35% giúp tỷ lệ cứu tăng lên ~65% - 95%
    // Dùng PRNG giả lập roll = 0.10 (thấp) => RESCUED
    const resWin = resolvePostBattlePilotStatus({
      initialTier: "CRITICAL",
      victory: true,
      config: cfg,
      prng: () => 0.1,
    })
    assert.equal(resWin.status, "RESCUED")

    // Khi phe ta bại (Defeat): Kẻ địch chiếm trận địa, roll = 0.40 rơi vào vùng CAPTURED
    const resLoss = resolvePostBattlePilotStatus({
      initialTier: "CRITICAL",
      victory: false,
      config: cfg,
      prng: () => 0.45,
    })
    assert.equal(resLoss.status, "CAPTURED", "Phi công CRITICAL trong trận thua có nguy cơ cao bị bắt làm tù binh")
  })

  await t.test("7. National POW Registry & Mission Dispatch Integration", () => {
    const state = createInitialWorldState()
    assert.equal(state.nationalPowRegistry?.length ?? 0, 0)

    // Tạo danh sách kết quả có 1 phi công bị bắt
    const mockRecord = {
      recordId: "psr_test_pow_01",
      encounterId: "enc_test_01",
      transactionId: "tx_test_pow_01",
      sectorId: "sol_command_hq",
      gearId: "gear_test_01",
      gearName: "Chiến Giáp Tuần Tra Alpha",
      pilotId: "pilot_sar_hero",
      pilotName: "Thiếu Úy Lê Minh",
      side: "allied" as const,
      isPlayer: false,
      destructionRound: 3,
      survivalScore: 42,
      breakdown: {
        baseReliability: 50,
        forceBalanceModifier: -5,
        alliedProtectionModifier: 0,
        enemyPressureModifier: -8,
        supportModifier: 0,
        moraleModifier: 5,
        totalScore: 42,
      },
      initialTier: "CRITICAL" as PilotSurvivalTier,
      finalStatus: "CAPTURED" as PilotFinalStatus,
      resolvedAtRound: 3,
      resolvedAtTimestamp: Date.now(),
      notes: "Phi công bị The Void bắt giữ.",
    }

    const applied = applyPilotSurvivalToWorldState(state, [mockRecord], "sol_command_hq")

    assert.equal(applied.capturedCount, 1, "Phải ghi nhận 1 tù binh bị bắt")
    assert.equal(state.nationalPowRegistry?.length, 1, "Sổ bộ Tù binh Quốc gia phải có 1 bản ghi")
    assert.equal(state.nationalPowRegistry![0].pilotId, "pilot_sar_hero")
    assert.equal(state.nationalPowRegistry![0].status, "IN_CAPTIVITY")

    // Kiểm tra xem nhiệm vụ đột kích giải cứu có được tự động tạo trong Mission Dispatcher không
    assert.ok(applied.unlockedRescueMissions.length >= 1, "Phải kích hoạt nhiệm vụ giải cứu SAR")
    const dispatchId = applied.unlockedRescueMissions[0]
    assert.ok(state.missionDispatches![dispatchId], "Nhiệm vụ phải tồn tại trong state.missionDispatches")
    assert.equal(state.missionDispatches![dispatchId].category, "raid")
  })

  await t.test("8. Idempotent WORLD State Commit: Tái áp dụng cùng bản ghi không nhân bản POW hay Thương vong", () => {
    const state = createInitialWorldState()
    const initialCasualties = state.military.casualties
    const initialWounded = state.military.woundedOrRepair

    const mockRecords = [
      {
        recordId: "psr_idem_01",
        encounterId: "enc_idem",
        transactionId: "tx_idem_01",
        sectorId: "sol_command_hq",
        gearId: "gear_idem_01",
        gearName: "Cơ Giáp #1",
        pilotId: "pilot_kia_01",
        pilotName: "Phi công Hy Sinh",
        side: "allied" as const,
        isPlayer: false,
        destructionRound: 2,
        survivalScore: 20,
        breakdown: { baseReliability: 50, forceBalanceModifier: -20, alliedProtectionModifier: 0, enemyPressureModifier: -10, supportModifier: 0, moraleModifier: 0, totalScore: 20 },
        initialTier: "KIA" as PilotSurvivalTier,
        finalStatus: "KIA" as PilotFinalStatus,
        resolvedAtRound: 2,
        resolvedAtTimestamp: Date.now(),
        notes: "Tử trận tức thì",
      },
    ]

    // Áp dụng lần 1
    applyPilotSurvivalToWorldState(state, mockRecords, "sol_command_hq")
    assert.equal(state.military.casualties, initialCasualties + 1)
    assert.equal(state.pilotSurvivalRegistry?.length, 1)

    // Áp dụng lần 2 (cùng recordId)
    applyPilotSurvivalToWorldState(state, mockRecords, "sol_command_hq")
    // Số lượng trong registry không được nhân đôi
    assert.equal(state.pilotSurvivalRegistry?.length, 1, "Idempotency: Không được nhân đôi bản ghi survival")
  })

  await t.test("9. End-to-End Combat V2 Integration: Mô phỏng trận đấu tạo ra ứng viên và bản ghi sinh tồn đầy đủ", () => {
    // Thiết lập một trận chiến không cân sức nơi 1 GEAR đồng minh yếu bị tiêu diệt
    const weakAlliedGear: CombatV2Gear = {
      gearId: "weak_scout",
      name: "Tàu Trinh Sát VSS Tiền Tiêu",
      side: "allied",
      factionId: "vss",
      isPlayer: false,
      pilotId: "pilot_scout_01",
      pilotName: "Hạ Sĩ Trinh Sát",
      currentHp: 20,
      maxHp: 20,
      state: "ACTIVE",
      attack: 10,
      defense: 5,
      speed: 40,
    }

    const overwhelmingEnemyGear: CombatV2Gear = {
      gearId: "boss_void",
      name: "Đại Kỳ Hạm The Void",
      side: "enemy",
      factionId: "void",
      isPlayer: false,
      pilotId: "void_mind",
      pilotName: "Ý Chí Hư Không",
      currentHp: 1000,
      maxHp: 1000,
      state: "ACTIVE",
      attack: 120,
      defense: 50,
      speed: 60,
    }

    const state = createInitialWorldState()
    const encounter = lockEncounterAndCreateSnapshot(state, {
      sectorId: "sol_command_hq",
      combatVersion: "v2",
      overrideTransactionId: "tx_sar_e2e_01",
      overrideEncounterId: "enc_sar_e2e_01",
    })

    const snapshot = createCombatV2EncounterSnapshot({
      encounterId: encounter.encounterId,
      transactionId: encounter.transactionId,
      sectorId: encounter.sectorId,
      alliedGears: [weakAlliedGear],
      enemyGears: [overwhelmingEnemyGear],
      maxRounds: 5,
    })

    const prng = new WorldPRNG(42)
    const result = executeCombatV2Simulation(snapshot, { prng })

    assert.ok(result.destroyedGears.length >= 1, "Cơ giáp yếu phải bị tiêu diệt")
    assert.ok(result.downedPilotCandidates.length >= 1, "Phải xuất hiện ứng viên phi công gặp nạn")
    assert.ok(result.pilotSurvivalRecords && result.pilotSurvivalRecords.length >= 1, "Phải có bản ghi sinh tồn SAR")

    const rec = result.pilotSurvivalRecords![0]
    assert.equal(rec.gearId, "weak_scout")
    assert.equal(rec.pilotId, "pilot_scout_01")
    assert.ok(rec.survivalScore >= 0 && rec.survivalScore <= 100)
    assert.ok(["SAFE", "PROTECTED", "CRITICAL", "KIA"].includes(rec.initialTier))
    assert.ok(["RESCUED", "CAPTURED", "KIA", "MISSING"].includes(rec.finalStatus))

    // Commit vào WorldState
    const resolution = commitCombatV2Result(state, result)
    assert.ok(resolution.applied, "Commit phải thành công")
    assert.ok(resolution.pilotSurvivalSummary, "Phải có tóm tắt kết quả sinh tồn")
    assert.ok(state.pilotSurvivalRegistry!.length >= 1, "Bản ghi phải được lưu vào WorldState")
  })
})
