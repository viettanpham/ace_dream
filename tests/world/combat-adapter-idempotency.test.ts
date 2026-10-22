/**
 * STARFRONT WORLD — Phase 6.6 Test Suite
 * Kiểm thử toàn diện Tầng Khế Ước Tích Hợp Chiến Đấu & Nhật Ký Giao Dịch Lũy Đẳng:
 *   1. Khóa trận (Encounter Snapshot Locking) & Cấp phát Transaction ID
 *   2. Chống áp dụng kết quả hai lần (Idempotent Apply: gửi 10 lần chỉ áp dụng 1 lần)
 *   3. Xử lý kết quả không hợp lệ & Chặn phiên bản không tương thích
 *   4. Hậu quả thất bại theo ngữ cảnh (Contextual Defeat) & Mở khóa an toàn
 *   5. Phục hồi trận treo sau reload / crash (Suspended Recovery Flow)
 *   6. Hủy bỏ an toàn (Safe Abort) không phạt thua oan
 *   7. Chuyển đổi BattleResult từ Combat Engine hiện có thành Receipt chuẩn hóa
 *   8. Tích hợp Lưu trữ Bền Vững & Checksum Verification (World Save V1)
 */

import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { createInitialWorldState } from "@/lib/game/world/initial-state"
import {
  abortSuspendedCombat,
  commitCombatResultReceipt,
  convertBattleResultToReceipt,
  lockEncounterAndCreateSnapshot,
  resumeSuspendedCombat,
  validateCombatResultReceipt,
} from "@/lib/game/world/combat-adapter"
import {
  ensureTransactionJournal,
  getJournalEntry,
  isTransactionCommitted,
  pruneJournal,
  reconcileCombatTransactionsInTick,
} from "@/lib/game/world/transaction-journal"
import {
  dispatchTroopDeployment,
  calculateTotalMilitaryForce,
} from "@/lib/game/world/forces-ledger"
import {
  loadWorldState,
  saveWorldState,
} from "@/lib/game/world/storage"
import type {
  CombatResultReceipt,
  WorldState,
} from "@/lib/game/world/types"
import type { BattleResult } from "@/lib/game/types"

/**
 * Mock localStorage cho môi trường Node.js kiểm thử
 */
function setupMockLocalStorage() {
  const store: Record<string, string> = {}
  const mockStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k]
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length
    },
  }
  ;(globalThis as any).window = globalThis
  ;(globalThis as any).localStorage = mockStorage
  return mockStorage
}

describe("STARFRONT WORLD — Phase 6.6: Combat Integration Adapter & Idempotent Journal", () => {
  it("A. Khóa trận (Encounter Snapshot Locking) & Cấp phát Transaction ID", () => {
    const state = createInitialWorldState(42)
    const targetSectorId = "helios_perimeter"
    const sector = state.sectors[targetSectorId]
    const initialGarrison = sector.garrisonPower

    // 1. Khóa trận và tạo snapshot
    const snapshot = lockEncounterAndCreateSnapshot(state, {
      sectorId: targetSectorId,
      combatVersion: "v1",
      objective: "eliminate_enemy",
      maxRounds: 15,
    })

    // Xác nhận snapshot đầy đủ trường và bất biến
    assert.ok(snapshot.transactionId.startsWith("tx-cbt-"), "Transaction ID phải bắt đầu bằng prefix tx-cbt-")
    assert.ok(snapshot.encounterId.startsWith("enc-helios_perimeter-"), "Encounter ID phải chứa sector ID")
    assert.equal(snapshot.combatVersion, "v1")
    assert.equal(snapshot.sectorId, targetSectorId)
    assert.equal(snapshot.lockedGarrison, initialGarrison)
    assert.ok(snapshot.enemyUnit.hp > 0, "Enemy HP phải lớn hơn 0")
    assert.ok(snapshot.enemyUnit.attack > 0, "Enemy Attack phải lớn hơn 0")
    assert.ok(snapshot.friendlyModifiers.defenseMultiplier >= 1.0)

    // Xác nhận trạng thái khóa tại sector
    assert.equal(sector.isLockedForCombat, true, "Sector phải được đánh dấu isLockedForCombat = true")
    assert.equal(sector.lockedGarrisonPower, initialGarrison, "lockedGarrisonPower phải khớp quân số ban đầu")

    // Xác nhận ghi nhận vào Journal và cờ suspended combat
    const entry = getJournalEntry(state, snapshot.transactionId)
    assert.ok(entry, "Bản ghi transaction phải tồn tại trong journal")
    assert.equal(entry?.status, "pending")
    assert.equal(state.isSuspendedCombat, true)
    assert.equal(state.suspendedEncounterId, snapshot.encounterId)
    assert.deepEqual(state.suspendedSnapshot, snapshot)

    // 2. Chặn điều động quân từ sector đang bị khóa chiến đấu
    const dispatchAttempt = dispatchTroopDeployment(state, {
      fromSectorId: targetSectorId,
      toSectorId: "mining_outpost_k7",
      troopCount: 50,
    })
    assert.equal(dispatchAttempt.success, false, "Phải từ chối điều động quân từ sector đang bị khóa chiến đấu")
    assert.match(dispatchAttempt.error || "", /đang bị khóa trong trận chiến/)

    // 3. Chặn khóa trùng lặp 1 sector đang bị khóa bởi trận chiến khác
    assert.throws(
      () => {
        lockEncounterAndCreateSnapshot(state, {
          sectorId: targetSectorId,
          combatVersion: "v1",
          overrideTransactionId: "tx-different-999",
        })
      },
      /hiện đang bị khóa bởi trận chiến khác/,
    )
  })

  it("B. Chống áp dụng kết quả hai lần (Idempotency Filter: Gửi 10 lần chỉ áp dụng 1 lần)", () => {
    const state = createInitialWorldState(42)
    const targetSectorId = "helios_perimeter"
    const sector = state.sectors[targetSectorId]

    const initialThreat = sector.threatLevel
    const initialStability = sector.stability
    const initialTacticalData = state.resources.tacticalData
    const initialIndustrialMaterials = state.resources.industrialMaterials
    const initialTotalForce = calculateTotalMilitaryForce(state.military)

    // Khóa trận
    const snapshot = lockEncounterAndCreateSnapshot(state, {
      sectorId: targetSectorId,
      combatVersion: "v1",
    })

    const receipt: CombatResultReceipt = {
      transactionId: snapshot.transactionId,
      encounterId: snapshot.encounterId,
      combatVersion: "v1",
      sectorId: targetSectorId,
      victory: true,
      rounds: 6,
      playerRemainingHpPercent: 90,
      enemyRemainingHpPercent: 0,
      tacticalRating: "S",
      completedAtTimestamp: Date.now(),
    }

    // Áp dụng lần 1 (Lần đầu tiên -> Áp dụng thành công)
    const firstResult = commitCombatResultReceipt(state, receipt)
    assert.equal(firstResult.applied, true, "Lần đầu tiên phải áp dụng thành công")
    assert.equal(firstResult.alreadyCommitted, false)
    assert.equal(sector.isLockedForCombat, false, "Sector phải được mở khóa sau khi áp dụng kết quả")
    assert.equal(state.isSuspendedCombat, false, "Trạng thái suspended phải được giải phóng")

    // Ghi nhận trạng thái sau lần 1
    const threatAfterFirst = sector.threatLevel
    const stabilityAfterFirst = sector.stability
    const tacticalDataAfterFirst = state.resources.tacticalData
    const materialsAfterFirst = state.resources.industrialMaterials
    const totalForceAfterFirst = calculateTotalMilitaryForce(state.military)

    assert.ok(threatAfterFirst < initialThreat, "Threat phải giảm khi chiến thắng")
    assert.ok(stabilityAfterFirst > initialStability, "Stability phải tăng khi chiến thắng")
    assert.ok(tacticalDataAfterFirst > initialTacticalData, "Tactical Data phải được thưởng")
    assert.ok(materialsAfterFirst > initialIndustrialMaterials, "Materials phải được thưởng")
    assert.equal(totalForceAfterFirst, initialTotalForce, "Tổng lực lượng quân sự quốc gia phải được bảo toàn 100%")
    assert.equal(isTransactionCommitted(state, receipt.transactionId), true)

    // Áp dụng thêm 9 lần tiếp theo với cùng receipt (Lần 2 -> Lần 10)
    for (let i = 2; i <= 10; i++) {
      const duplicateResult = commitCombatResultReceipt(state, receipt)
      assert.equal(duplicateResult.applied, false, `Lần ${i} phải bị chặn bởi Idempotency Filter`)
      assert.equal(duplicateResult.alreadyCommitted, true)
      assert.match(duplicateResult.message, /Idempotency Filter/)

      // Các chỉ số tuyệt đối KHÔNG được thay đổi thêm một đơn vị nào
      assert.equal(sector.threatLevel, threatAfterFirst, `Threat lần ${i} không được đổi`)
      assert.equal(sector.stability, stabilityAfterFirst, `Stability lần ${i} không được đổi`)
      assert.equal(state.resources.tacticalData, tacticalDataAfterFirst, `Tactical Data lần ${i} không được cộng thêm`)
      assert.equal(state.resources.industrialMaterials, materialsAfterFirst, `Materials lần ${i} không được cộng thêm`)
      assert.equal(calculateTotalMilitaryForce(state.military), totalForceAfterFirst, `Tổng quân lực lần ${i} không được đổi`)
    }

    // Kiểm tra committedTransactionIds chỉ lưu đúng 1 lần duy nhất
    const occurrences = state.committedTransactionIds.filter((id) => id === receipt.transactionId).length
    assert.equal(occurrences, 1, "ID giao dịch chỉ được lưu 1 lần trong committedTransactionIds")
  })

  it("C. Xử lý kết quả không hợp lệ & Chặn phiên bản combat không tương thích", () => {
    const state = createInitialWorldState(42)
    const targetSectorId = "mining_outpost_k7"

    const snapshot = lockEncounterAndCreateSnapshot(state, {
      sectorId: targetSectorId,
      combatVersion: "v1",
    })

    // 1. Receipt với combatVersion = "v2" không được hỗ trợ khi hệ thống đang ở v1
    const invalidVersionReceipt: any = {
      transactionId: snapshot.transactionId,
      encounterId: snapshot.encounterId,
      combatVersion: "v2",
      sectorId: targetSectorId,
      victory: true,
      rounds: 5,
      playerRemainingHpPercent: 100,
      enemyRemainingHpPercent: 0,
      completedAtTimestamp: Date.now(),
    }
    const versionResult = commitCombatResultReceipt(state, invalidVersionReceipt)
    assert.equal(versionResult.applied, false)
    assert.match(versionResult.error || "", /combatVersion "v2" không được hỗ trợ/)

    // 2. Receipt thiếu trường hoặc chỉ số âm
    const malformedReceipt: any = {
      transactionId: snapshot.transactionId,
      // thiếu encounterId
      combatVersion: "v1",
      sectorId: targetSectorId,
      victory: true,
      rounds: -1, // âm
      playerRemainingHpPercent: 150, // vượt quá 100
      completedAtTimestamp: Date.now(),
    }
    assert.equal(validateCombatResultReceipt(malformedReceipt), false)
    const malformedResult = commitCombatResultReceipt(state, malformedReceipt)
    assert.equal(malformedResult.applied, false)
    assert.match(malformedResult.error || "", /không hợp lệ/)

    // 3. Receipt với transactionId giả không tồn tại trong journal
    const nonExistentReceipt: CombatResultReceipt = {
      transactionId: "tx-non-existent-12345",
      encounterId: snapshot.encounterId,
      combatVersion: "v1",
      sectorId: targetSectorId,
      victory: true,
      rounds: 5,
      playerRemainingHpPercent: 80,
      enemyRemainingHpPercent: 0,
      completedAtTimestamp: Date.now(),
    }
    const nonExistentResult = commitCombatResultReceipt(state, nonExistentReceipt)
    assert.equal(nonExistentResult.applied, false)
    assert.match(nonExistentResult.error || "", /Không tìm thấy bản ghi giao dịch/)
  })

  it("D. Hậu quả thất bại theo ngữ cảnh (Contextual Defeat) & Bảo toàn quân lực", () => {
    const state = createInitialWorldState(42)
    const targetSectorId = "nebula_bastion"
    const sector = state.sectors[targetSectorId]

    // Gán fortificationLevel = 1 để thử nghiệm giữ vững boong-ke
    sector.fortificationLevel = 1
    const initialGarrison = sector.garrisonPower
    const initialTotalForce = calculateTotalMilitaryForce(state.military)

    const snapshot = lockEncounterAndCreateSnapshot(state, {
      sectorId: targetSectorId,
      combatVersion: "v1",
    })

    const defeatReceipt: CombatResultReceipt = {
      transactionId: snapshot.transactionId,
      encounterId: snapshot.encounterId,
      combatVersion: "v1",
      sectorId: targetSectorId,
      victory: false,
      rounds: 12,
      playerRemainingHpPercent: 0,
      enemyRemainingHpPercent: 60,
      completedAtTimestamp: Date.now(),
    }

    const defeatResult = commitCombatResultReceipt(state, defeatReceipt)
    assert.equal(defeatResult.applied, true)
    assert.equal(defeatResult.victory, false)

    // Thất bại khi có công sự: Công sự giảm 1, sector chuyển sang under_siege, KHÔNG bị mất trắng
    assert.equal(sector.fortificationLevel, 0, "Công sự giảm 1 cấp")
    assert.equal(sector.stage, "under_siege", "Sector phải chuyển sang trạng thái under_siege")
    assert.equal(sector.sovereignty, "vss", "Sovereignty vẫn thuộc VSS nhờ phòng tuyến rút lui an toàn")
    assert.ok(sector.threatLevel > 0, "Threat phải tăng khi thất bại")
    assert.equal(sector.isLockedForCombat, false, "Sector phải được mở khóa")

    // Kiểm tra bảo toàn quân lực: Tổn thất được hạch toán minh bạch vào Casualties và Wounded
    const totalForceAfterDefeat = calculateTotalMilitaryForce(state.military)
    assert.equal(totalForceAfterDefeat, initialTotalForce, "Tổng lực lượng quân sự quốc gia phải bảo toàn 100%")
    assert.ok(state.military.casualties > 0, "Thương vong vĩnh viễn phải được ghi nhận")
    assert.ok(state.military.woundedOrRepair > 140, "Thương binh phải được chuyển vào bệnh viện quân y")
    assert.ok(sector.garrisonPower < initialGarrison, "Quân đồn trú tại sector bị giảm tương ứng")
  })

  it("E. Phục hồi trận treo sau reload / crash (Suspended Recovery Flow)", () => {
    const state = createInitialWorldState(42)
    const targetSectorId = "asteroid_delta"

    // Khóa trận
    const snapshot = lockEncounterAndCreateSnapshot(state, {
      sectorId: targetSectorId,
      combatVersion: "v1",
    })
    assert.equal(state.isSuspendedCombat, true)

    // Giả lập app reload / crash giữa chừng và chạy chu kỳ đối soát tick
    const reconcileResult = reconcileCombatTransactionsInTick(state)
    assert.equal(reconcileResult.recovered, 1, "Phải phát hiện 1 trận chiến đang treo giữa chừng")
    assert.ok(reconcileResult.logs.length > 0)

    const entry = getJournalEntry(state, snapshot.transactionId)
    assert.equal(entry?.status, "needs_recovery", "Giao dịch phải được đánh dấu needs_recovery")
    assert.equal(state.isSuspendedCombat, true, "Cờ isSuspendedCombat phải được duy trì")

    // resumeSuspendedCombat phải trả về đúng snapshot ban đầu
    const resumed = resumeSuspendedCombat(state, snapshot.transactionId)
    assert.ok(resumed, "Phải khôi phục được snapshot")
    assert.equal(resumed?.transactionId, snapshot.transactionId)
    assert.equal(resumed?.sectorId, targetSectorId)
    assert.equal(resumed?.lockedGarrison, snapshot.lockedGarrison)
    assert.deepEqual(resumed?.enemyUnit, snapshot.enemyUnit)
  })

  it("F. Hủy bỏ an toàn (Safe Abort) không phạt thua oan & Phục hồi đồn trú", () => {
    const state = createInitialWorldState(42)
    const targetSectorId = "helios_perimeter"
    const sector = state.sectors[targetSectorId]
    const initialGarrison = sector.garrisonPower
    const initialThreat = sector.threatLevel
    const initialStability = sector.stability

    // Khóa trận
    const snapshot = lockEncounterAndCreateSnapshot(state, {
      sectorId: targetSectorId,
      combatVersion: "v1",
    })

    // Người chơi chọn hủy an toàn (Safe Abort)
    const abortResult = abortSuspendedCombat(
      state,
      snapshot.transactionId,
      "Người chơi hủy trận do đứt mạng",
    )

    assert.equal(abortResult.success, true, "Hủy bỏ phải thành công")
    assert.equal(abortResult.restoredGarrison, initialGarrison)
    assert.equal(sector.isLockedForCombat, false, "Sector phải được mở khóa hoàn toàn")
    assert.equal(sector.garrisonPower, initialGarrison, "Quân đồn trú phải được giữ nguyên 100%")
    assert.equal(state.isSuspendedCombat, false, "Cờ suspended combat phải được xóa")
    assert.equal(state.suspendedSnapshot, undefined)

    // Không áp dụng hình phạt giả nào: Threat và Stability không đổi
    assert.equal(sector.threatLevel, initialThreat, "Threat không bị tăng oan")
    assert.equal(sector.stability, initialStability, "Stability không bị giảm oan")

    // Giao dịch được đánh dấu aborted trong Journal
    const entry = getJournalEntry(state, snapshot.transactionId)
    assert.equal(entry?.status, "aborted")
    assert.match(entry?.error || "", /đứt mạng/)

    // Thử commit kết quả sau khi đã abort -> từ chối
    const receipt: CombatResultReceipt = {
      transactionId: snapshot.transactionId,
      encounterId: snapshot.encounterId,
      combatVersion: "v1",
      sectorId: targetSectorId,
      victory: true,
      rounds: 5,
      playerRemainingHpPercent: 100,
      enemyRemainingHpPercent: 0,
      completedAtTimestamp: Date.now(),
    }
    const commitAfterAbort = commitCombatResultReceipt(state, receipt)
    // Transaction đã aborted không thể commit lại
    assert.equal(isTransactionCommitted(state, snapshot.transactionId), false)
  })

  it("G. Chuyển đổi BattleResult từ Combat Engine hiện có thành Receipt chuẩn hóa", () => {
    const snapshot = {
      transactionId: "tx-test-bridge-1",
      encounterId: "enc-bridge-1",
      combatVersion: "v1" as const,
      sectorId: "helios_perimeter",
      sectorName: "Vành Đai Helios",
      enemyEncounterType: "scout-drone",
      enemyUnit: {
        name: "Trinh Sát Cơ Void",
        hp: 300,
        maxHp: 300,
        attack: 40,
        defense: 20,
        speed: 60,
      },
      friendlyModifiers: {
        fortificationLevel: 1,
        defenseMultiplier: 1.15,
        moraleMultiplier: 1.0,
      },
      lockedGarrison: 200,
      winConditions: {
        objective: "eliminate_enemy" as const,
      },
      lockedAtTimestamp: Date.now(),
      status: "locked" as const,
    }

    const mockBattleResult: BattleResult = {
      sectorId: "helios_perimeter",
      victory: true,
      rounds: 4,
      log: [],
      playerUnits: [
        { uid: "p1", name: "Vanguard", cls: "B", hp: 450, maxHp: 500, power: 1200 },
      ],
      enemyUnits: [
        { uid: "e1", name: "Drone", cls: "enemy", hp: 0, maxHp: 300, power: 800 },
      ],
    }

    const receipt = convertBattleResultToReceipt(mockBattleResult, snapshot)
    assert.equal(receipt.transactionId, snapshot.transactionId)
    assert.equal(receipt.encounterId, snapshot.encounterId)
    assert.equal(receipt.combatVersion, "v1")
    assert.equal(receipt.sectorId, "helios_perimeter")
    assert.equal(receipt.victory, true)
    assert.equal(receipt.rounds, 4)
    assert.equal(receipt.playerRemainingHpPercent, 90) // 450 / 500 = 90%
    assert.equal(receipt.enemyRemainingHpPercent, 0)
    assert.equal(receipt.tacticalRating, "S+") // >= 90% và rounds <= 5
    assert.ok(receipt.completedAtTimestamp > 0)
    assert.equal(validateCombatResultReceipt(receipt), true)
  })

  it("H. Tích hợp Lưu trữ Bền Vững (World Save V1) & Checksum Verification", () => {
    setupMockLocalStorage()
    const state = createInitialWorldState(42)

    // Tạo 1 giao dịch và commit
    const snapshot1 = lockEncounterAndCreateSnapshot(state, {
      sectorId: "helios_perimeter",
      combatVersion: "v1",
    })
    const receipt1: CombatResultReceipt = {
      transactionId: snapshot1.transactionId,
      encounterId: snapshot1.encounterId,
      combatVersion: "v1",
      sectorId: "helios_perimeter",
      victory: true,
      rounds: 5,
      playerRemainingHpPercent: 95,
      enemyRemainingHpPercent: 0,
      completedAtTimestamp: Date.now(),
    }
    commitCombatResultReceipt(state, receipt1)

    // Tạo 1 giao dịch thứ 2 và để ở trạng thái suspended/pending
    const snapshot2 = lockEncounterAndCreateSnapshot(state, {
      sectorId: "mining_outpost_k7",
      combatVersion: "v1",
    })

    // Lưu vào mock storage
    const saveResult = saveWorldState(state)
    assert.equal(saveResult.success, true, "Lưu vào storage phải thành công")
    assert.ok(saveResult.checksum.length > 0)

    // Nạp lại từ mock storage
    const loadResult = loadWorldState()
    assert.equal(loadResult.status, "loaded_primary")
    assert.equal(loadResult.checksumVerified, true)

    const loadedState = loadResult.state
    assert.equal(loadedState.version, 1)

    // Xác minh journal và committedTransactionIds được bảo tồn nguyên vẹn
    assert.equal(isTransactionCommitted(loadedState, snapshot1.transactionId), true)
    assert.ok(loadedState.committedTransactionIds.includes(snapshot1.transactionId))

    // Xác minh giao dịch đang treo thứ 2 được lưu giữ chuẩn xác
    assert.equal(loadedState.isSuspendedCombat, true)
    assert.equal(loadedState.suspendedEncounterId, snapshot2.encounterId)
    assert.equal(loadedState.suspendedSnapshot?.transactionId, snapshot2.transactionId)
    assert.equal(loadedState.sectors["mining_outpost_k7"].isLockedForCombat, true)

    // Kiểm tra Safe Pruning: Prune journal không bao giờ xóa committedTransactionIds
    const prunedCount = pruneJournal(loadedState, 1)
    assert.ok(prunedCount >= 0)
    assert.equal(
      isTransactionCommitted(loadedState, snapshot1.transactionId),
      true,
      "Bộ lọc lũy đẳng phải tồn tại vĩnh viễn dù bản ghi chi tiết đã prune",
    )
  })
})
