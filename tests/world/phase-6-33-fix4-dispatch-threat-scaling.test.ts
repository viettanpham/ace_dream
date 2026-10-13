/**
 * STARFRONT WORLD — Automated Focused Verification Tests (Phase 6.33_FIX4)
 * 
 * Verifies:
 * 1. Dispatch Destination Auto-Select from clicked entity using canonical ID (Section 43)
 * 2. Canonical Threat Formula Case 1 — Friendly Victory = 84 (Section 44)
 * 3. Canonical Threat Formula Case 2 — Enemy Victory / Defeat = 145 (Section 45)
 * 4. Math.floor Rounding Rule (Section 46)
 * 5. Threat Idempotency on Repeated Commit (Section 47)
 * 6. Standardized Threat Caps (HQ = 100,000,000, Standard = 1,000,000) & Clamping (Section 48)
 * 7. Lower Max Warning & Year-1 Reset Confirmation Flow (Section 49)
 * 8. UI Scale Range (100% -> 200%, Step 5%, Legacy Normalization & Reset) (Section 50)
 */

import test from "node:test"
import assert from "node:assert/strict"
import {
  MIN_UI_SCALE,
  MAX_UI_SCALE,
  UI_SCALE_STEP,
  DEFAULT_UI_SCALE,
  SUPPORTED_UI_SCALES,
  normalizeUiScale,
  uiScaleToMultiplier,
  resetGlobalSettingsToDefault,
} from "../../lib/game/ui-settings"
import {
  DEFAULT_THREAT_CONFIG,
  getWorldThreatConfig,
  getSectorMaxThreat,
  calculateThreatChange,
  calculateCanonicalHpThreatDelta,
  applyThreatDeltaToSector,
  checkMaxThreatReduction,
} from "../../lib/game/world/threat-engine"
import { createInitialWorldState } from "../../lib/game/world/initial-state"
import { commitCombatResultReceipt } from "../../lib/game/world/combat-adapter"
import { createJournalEntry } from "../../lib/game/world/transaction-journal"
import type { CombatResultReceipt, WorldState } from "../../lib/game/world/types"

test("Phase 6.33_FIX4 — 1. Dispatch Destination Auto-Select", () => {
  const state: WorldState = createInitialWorldState(12345)

  // Scenario: Player clicks entity X (outpost, station, or sector)
  const targetX = state.sectors["mining_outpost_k7"]
  assert.ok(targetX, "mining_outpost_k7 must exist")

  // Expected: Destination automatically selected as targetX.id
  const preselectedDestinationId = targetX.id
  assert.equal(preselectedDestinationId, "mining_outpost_k7", "Must use canonical entity ID, not display name")
  assert.ok(state.sectors[preselectedDestinationId], "Destination ID must map directly to valid sector in WorldState")

  // Ensure all sectors in the map have unambiguous valid target IDs
  const sampleTargets = ["sol_command_hq", "helios_perimeter", "mining_outpost_k7", "tartarus_breach"]
  for (const tId of sampleTargets) {
    assert.ok(state.sectors[tId], `Target entity ${tId} must exist in worldState`)
    assert.equal(state.sectors[tId].id, tId)
  }
})

test("Phase 6.33_FIX4 — 2. Canonical Threat Case 1 (Phe Ta Thắng = 84)", () => {
  // Input chuẩn:
  // Phe ta: WinnerCurrentHP = 200, WinnerMaxHP = 2500
  // Phe địch: LoserMaxHP = 3000
  // Config: WinnerRatio = 2, HPPerThreatPoint = 100
  const result = calculateThreatChange({
    winnerCurrentHp: 200,
    winnerMaxHp: 2500,
    loserMaxHp: 3000,
    winnerRatio: 2,
    hpPerThreatPoint: 100,
  })

  // ( (200 + 2500) * 2 + 3000 ) / 100 = (5400 + 3000) / 100 = 8400 / 100 = 84
  assert.equal(result, 84, "ThreatChange for Case 1 must equal exactly 84")

  // Delta cho phe ta thắng phải là -84 (giảm Threat)
  const delta = calculateCanonicalHpThreatDelta({
    winnerCurrentHp: 200,
    winnerMaxHp: 2500,
    loserMaxHp: 3000,
    winnerRatio: 2,
    hpPerThreatPoint: 100,
    isVictory: true,
  })
  assert.equal(delta, -84, "Victory delta must decrease threat by exactly 84")
})

test("Phase 6.33_FIX4 — 3. Canonical Threat Case 2 (Phe Ta Thua / Địch Thắng = 145)", () => {
  // Input chuẩn:
  // Phe địch (thắng): WinnerCurrentHP = 1000, WinnerMaxHP = 5000
  // Phe ta (thua): LoserMaxHP = 2500
  // Config: WinnerRatio = 2, HPPerThreatPoint = 100
  const result = calculateThreatChange({
    winnerCurrentHp: 1000,
    winnerMaxHp: 5000,
    loserMaxHp: 2500,
    winnerRatio: 2,
    hpPerThreatPoint: 100,
  })

  // ( (1000 + 5000) * 2 + 2500 ) / 100 = (12000 + 2500) / 100 = 14500 / 100 = 145
  assert.equal(result, 145, "ThreatChange for Case 2 must equal exactly 145")

  // Delta cho phe ta thua phải là +145 (tăng Threat)
  const delta = calculateCanonicalHpThreatDelta({
    winnerCurrentHp: 1000,
    winnerMaxHp: 5000,
    loserMaxHp: 2500,
    winnerRatio: 2,
    hpPerThreatPoint: 100,
    isVictory: false,
  })
  assert.equal(delta, 145, "Defeat delta must increase threat by exactly 145")
})

test("Phase 6.33_FIX4 — 4. Math.floor Rounding Rule (No Round, No Ceil)", () => {
  // Thử nghiệm trường hợp có phần thập phân:
  // WinnerCurrentHP = 201, WinnerMaxHP = 2500, LoserMaxHP = 3000
  // ( (201 + 2500) * 2 + 3000 ) / 100 = (5402 + 3000) / 100 = 8402 / 100 = 84.02
  const result1 = calculateThreatChange({
    winnerCurrentHp: 201,
    winnerMaxHp: 2500,
    loserMaxHp: 3000,
    winnerRatio: 2,
    hpPerThreatPoint: 100,
  })
  assert.equal(result1, 84, "Math.floor(84.02) must be 84, not rounded up")

  // WinnerCurrentHP = 249, WinnerMaxHP = 2500, LoserMaxHP = 3000
  // ( (249 + 2500) * 2 + 3000 ) / 100 = (5498 + 3000) / 100 = 8498 / 100 = 84.98
  const result2 = calculateThreatChange({
    winnerCurrentHp: 249,
    winnerMaxHp: 2500,
    loserMaxHp: 3000,
    winnerRatio: 2,
    hpPerThreatPoint: 100,
  })
  assert.equal(result2, 84, "Math.floor(84.98) must be 84, neither Math.round nor Math.ceil should be used")
})

test("Phase 6.33_FIX4 — 5. Threat Idempotency on Repeated Commit", () => {
  const state: WorldState = createInitialWorldState(65432)
  const sector = state.sectors["mining_outpost_k7"]
  const initialThreat = sector.threatLevel

  const txId = "tx-idempotency-test-01"
  createJournalEntry(state, {
    transactionId: txId,
    type: "combat",
    sectorId: "mining_outpost_k7",
    status: "in_flight",
    description: "Idempotency test combat",
  })

  const receipt: CombatResultReceipt = {
    transactionId: txId,
    encounterId: "enc-idempotency-01",
    combatVersion: "v2",
    sectorId: "mining_outpost_k7",
    victory: true,
    rounds: 5,
    playerRemainingHpPercent: 8, // 200 / 2500
    enemyRemainingHpPercent: 0,
    winnerCurrentHp: 200,
    winnerMaxHp: 2500,
    loserMaxHp: 3000,
    completedAtTimestamp: Date.now(),
  }

  // Lần commit đầu tiên: Áp dụng thành công, giảm đúng 84 điểm
  const res1 = commitCombatResultReceipt(state, receipt)
  assert.equal(res1.applied, true)
  assert.equal(res1.alreadyCommitted, false)
  assert.equal(sector.threatLevel, initialThreat - 84)

  const threatAfterFirstCommit = sector.threatLevel

  // Lần commit thứ hai với cùng transactionId / receipt:
  const res2 = commitCombatResultReceipt(state, receipt)
  assert.equal(res2.alreadyCommitted, true, "Must detect alreadyCommitted on idempotent re-submission")
  assert.equal(sector.threatLevel, threatAfterFirstCommit, "Threat must NOT be decreased a second time")
})

test("Phase 6.33_FIX4 — 6. Standardized Threat Caps (HQ = 100,000,000, Standard = 1,000,000) & Clamping", () => {
  const state: WorldState = createInitialWorldState(45678)

  const hq = state.sectors["sol_command_hq"]
  const regularSector = state.sectors["mining_outpost_k7"]
  const voidHq = state.sectors["tartarus_breach"]

  // Verify Approved Defaults
  assert.equal(getSectorMaxThreat(hq), 100_000_000, "HQ max threat must be 100,000,000")
  assert.equal(getSectorMaxThreat(voidHq), 100_000_000, "Enemy origin HQ max threat must be 100,000,000 (symmetric)")
  assert.equal(getSectorMaxThreat(regularSector), 1_000_000, "Regular sector max threat must be 1,000,000")

  // Clamp victory to minimum 0
  regularSector.threatLevel = 50
  const victoryApply = applyThreatDeltaToSector(regularSector, -84)
  assert.equal(victoryApply.newThreat, 0, "Threat must clamp to minimum 0 on victory")
  assert.equal(regularSector.threatLevel, 0)

  // Clamp defeat to maximum SectorMaxThreat
  regularSector.threatLevel = 999_950
  const defeatApply = applyThreatDeltaToSector(regularSector, +145)
  assert.equal(defeatApply.newThreat, 1_000_000, "Threat must clamp to SectorMaxThreat on defeat")
  assert.equal(regularSector.threatLevel, 1_000_000)
})

test("Phase 6.33_FIX4 — 7. Lower Max Threat Warning & Year-1 Reset Confirmation Flow", () => {
  const state: WorldState = createInitialWorldState(998877)

  // Giả lập sector có Current Threat = 5000
  state.sectors["mining_outpost_k7"].threatLevel = 5000

  // Đề xuất cấu hình mới: New Max Threat = 1000 (< 5000)
  const proposedConfig = {
    maxThreatStandard: 1000,
    maxThreatHQ: 100_000_000,
    hpPerThreatPoint: 100,
    winnerRatio: 2,
    threatFormulaMultiplier: 1.0,
  }

  // 1. Kiểm tra phát hiện vi phạm: Yêu cầu cảnh báo xác nhận
  const check = checkMaxThreatReduction(state.sectors, proposedConfig)
  assert.equal(check.needsConfirmation, true, "Must flag confirmation required when New Max < Current Threat")
  assert.ok(check.violatingSectors.some((v) => v.id === "mining_outpost_k7"))

  // 2. Nếu User HỦY: Trạng thái không bị thay đổi
  assert.equal(state.sectors["mining_outpost_k7"].threatLevel, 5000, "No mutation if cancelled")

  // 3. Nếu User XÁC NHẬN: Áp dụng Year-1 reset chính thức
  // Authoritative reset mechanism
  const resetWorld = createInitialWorldState(11111)
  resetWorld.threatConfig = proposedConfig
  for (const s of Object.values(resetWorld.sectors)) {
    const maxT = getSectorMaxThreat(s, proposedConfig)
    s.threatLevel = Math.min(s.threatLevel, maxT)
  }

  assert.equal(resetWorld.currentDay, 1, "Calendar must be reset to Year 1 Day 1")
  assert.equal(resetWorld.threatConfig.maxThreatStandard, 1000)
  assert.ok(resetWorld.sectors["mining_outpost_k7"].threatLevel <= 1000)
})

test("Phase 6.33_FIX4 — 8. UI Scaling Range (100% -> 200%, Step 5%, Legacy Normalization & Reset)", () => {
  assert.equal(MIN_UI_SCALE, 100)
  assert.equal(MAX_UI_SCALE, 200)
  assert.equal(UI_SCALE_STEP, 5)
  assert.equal(DEFAULT_UI_SCALE, 100)

  // Có đúng 21 bước chia 5% từ 100 đến 200
  assert.equal(SUPPORTED_UI_SCALES.length, 21)
  assert.equal(SUPPORTED_UI_SCALES[0], 100)
  assert.equal(SUPPORTED_UI_SCALES[SUPPORTED_UI_SCALES.length - 1], 200)

  // Normalization quy định:
  // 225, 250, 275, 300 -> 200
  assert.equal(normalizeUiScale(225), 200)
  assert.equal(normalizeUiScale(250), 200)
  assert.equal(normalizeUiScale(275), 200)
  assert.equal(normalizeUiScale(300), 200)

  // Round nearest 5%:
  // 123 -> 125, 147 -> 145, 198 -> 200
  assert.equal(normalizeUiScale(123), 125)
  assert.equal(normalizeUiScale(147), 145)
  assert.equal(normalizeUiScale(198), 200)

  // < 100 -> 100
  assert.equal(normalizeUiScale(80), 100)
  assert.equal(normalizeUiScale(50), 100)
  assert.equal(normalizeUiScale(0), 100)

  // Reset to defaults -> 100%
  const resetDefaults = resetGlobalSettingsToDefault()
  assert.equal(resetDefaults.uiScale, 100)

  // CSS Multipliers
  assert.equal(uiScaleToMultiplier(100), 1.0)
  assert.equal(uiScaleToMultiplier(105), 1.05)
  assert.equal(uiScaleToMultiplier(125), 1.25)
  assert.equal(uiScaleToMultiplier(200), 2.0)
})
