import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { createInitialWorldState } from "@/lib/game/world/initial-state"
import {
  lockEncounterAndCreateSnapshot,
  commitCombatResultReceipt,
  abortSuspendedCombat,
  resumeSuspendedCombat,
  buildCombatUnitFromSnapshot,
  applyWorldSnapshotPlayerModifiers,
  buildCombatReceiptFromCombatState,
} from "@/lib/game/world/combat-adapter"
import {
  saveWorldState,
  loadWorldState,
} from "@/lib/game/world/storage"
import {
  loadStarfrontProgression,
  saveStarfrontProgression,
} from "@/lib/game/storage"
import {
  buildPlayerCombatUnit,
  INITIAL_STARFRONT_PROGRESSION,
} from "@/lib/game/progression"
import { createInitialCombatState } from "@/lib/game/engine"
import type {
  WorldBattleContext,
  CombatResultReceipt,
} from "@/lib/game/world/types"
import type { CombatState, StarfrontProgression } from "@/lib/game/types"

function setupMockLocalStorage() {
  const memoryStore: Record<string, string> = {}
  const mockStorage = {
    getItem: (key: string) => (key in memoryStore ? memoryStore[key] : null),
    setItem: (key: string, value: string) => {
      memoryStore[key] = String(value)
    },
    removeItem: (key: string) => {
      delete memoryStore[key]
    },
    clear: () => {
      for (const k of Object.keys(memoryStore)) delete memoryStore[k]
    },
    key: (idx: number) => Object.keys(memoryStore)[idx] ?? null,
    get length() {
      return Object.keys(memoryStore).length
    },
    _store: memoryStore,
  }

  ;(globalThis as any).window = globalThis
  ;(globalThis as any).localStorage = mockStorage
  return mockStorage
}

describe("STARFRONT WORLD — Phase 6.23: WORLD Combat Context & Arena Integration", () => {
  beforeEach(() => {
    setupMockLocalStorage()
  })

  it("1. Tạo Encounter Snapshot từ WORLD, khóa sector và bảo toàn dữ liệu đồn trú", () => {
    const state = createInitialWorldState(42)
    const sectorId = "nebula_bastion"
    const sector = state.sectors[sectorId]
    assert.ok(sector, "Sector nebula_bastion phải tồn tại")

    const initialGarrison = sector.garrisonPower
    const initialThreat = sector.threatLevel

    // Khóa trận chiến
    const snapshot = lockEncounterAndCreateSnapshot(state, {
      sectorId,
      objective: "eliminate_enemy",
      maxRounds: 15,
    })

    assert.equal(snapshot.sectorId, sectorId)
    assert.equal(snapshot.sectorName, sector.name)
    assert.ok(snapshot.transactionId.startsWith("tx-cbt-"))
    assert.ok(snapshot.encounterId.startsWith(`enc-${sectorId}-`))
    assert.equal(snapshot.lockedGarrison, initialGarrison)
    assert.equal(sector.isLockedForCombat, true)
    assert.equal(sector.lockedGarrisonPower, initialGarrison)

    // Kiểm tra cờ suspended combat trên World State
    assert.equal(state.isSuspendedCombat, true)
    assert.equal(state.suspendedEncounterId, snapshot.encounterId)
    assert.deepEqual(state.suspendedSnapshot, snapshot)

    // Kiểm tra transaction journal
    assert.ok(state.transactionJournal?.[snapshot.transactionId])
    assert.equal(state.transactionJournal[snapshot.transactionId].status, "pending")

    // Chặn mở trận chiến thứ 2 khi sector đã bị khóa
    assert.throws(
      () => {
        lockEncounterAndCreateSnapshot(state, {
          sectorId,
          overrideTransactionId: "tx-duplicate-forbidden",
        })
      },
      /hiện đang bị khóa/,
    )
  })

  it("2. WorldBattleContext đóng gói chính xác snapshot và ánh xạ sang CombatUnit buồng lái", () => {
    const state = createInitialWorldState(42)
    const sectorId = "sol_command_hq"
    const snapshot = lockEncounterAndCreateSnapshot(state, { sectorId })

    const battleContext: WorldBattleContext = {
      source: "WORLD",
      transactionId: snapshot.transactionId,
      encounterId: snapshot.encounterId,
      sectorId: snapshot.sectorId,
      sectorName: snapshot.sectorName,
      snapshot,
    }

    assert.equal(battleContext.source, "WORLD")
    assert.equal(battleContext.transactionId, snapshot.transactionId)
    assert.equal(battleContext.sectorId, sectorId)

    // Chuyển đổi sang CombatUnit đối thủ qua buildCombatUnitFromSnapshot
    const enemyUnit = buildCombatUnitFromSnapshot(snapshot)
    assert.equal(enemyUnit.name, snapshot.enemyUnit.name)
    assert.equal(enemyUnit.hp, snapshot.enemyUnit.hp)
    assert.equal(enemyUnit.maxHp, snapshot.enemyUnit.maxHp)
    assert.equal(enemyUnit.attack, snapshot.enemyUnit.attack)
    assert.equal(enemyUnit.defense, snapshot.enemyUnit.defense)
    assert.equal(enemyUnit.isPlayer, false)
    assert.ok(enemyUnit.skills.length > 0)

    // Áp dụng Modifiers từ snapshot lên phi thuyền người chơi
    const basePlayer = buildPlayerCombatUnit(INITIAL_STARFRONT_PROGRESSION)
    const modifiedPlayer = applyWorldSnapshotPlayerModifiers(basePlayer, snapshot)
    const expectedDef = Math.round(basePlayer.defense * snapshot.friendlyModifiers.defenseMultiplier)
    const expectedAtk = Math.round(basePlayer.attack * snapshot.friendlyModifiers.moraleMultiplier)
    assert.equal(modifiedPlayer.defense, expectedDef)
    assert.equal(modifiedPlayer.attack, expectedAtk)
  })

  it("3. Trích xuất CombatResultReceipt từ CombatState chuẩn hóa và tính Tactical Rating chính xác", () => {
    const state = createInitialWorldState(42)
    const sectorId = "waypoint_orion"
    const snapshot = lockEncounterAndCreateSnapshot(state, { sectorId })

    const playerUnit = buildPlayerCombatUnit(INITIAL_STARFRONT_PROGRESSION)
    const enemyUnit = buildCombatUnitFromSnapshot(snapshot)
    const combatState = createInitialCombatState("raider-mech", playerUnit, enemyUnit)

    combatState.turnNumber = 4
    combatState.player.hp = Math.round(combatState.player.maxHp * 0.95)
    combatState.enemy.hp = 0

    // Khi Chiến Thắng
    const receiptVictory = buildCombatReceiptFromCombatState(combatState, snapshot, true)
    assert.equal(receiptVictory.transactionId, snapshot.transactionId)
    assert.equal(receiptVictory.sectorId, sectorId)
    assert.equal(receiptVictory.victory, true)
    assert.equal(receiptVictory.rounds, 4)
    assert.equal(receiptVictory.playerRemainingHpPercent >= 90, true)
    assert.equal(receiptVictory.tacticalRating, "S+")

    // Khi Thất Bại
    combatState.turnNumber = 8
    combatState.player.hp = 0
    combatState.enemy.hp = 250
    const receiptDefeat = buildCombatReceiptFromCombatState(combatState, snapshot, false)
    assert.equal(receiptDefeat.victory, false)
    assert.equal(receiptDefeat.tacticalRating, "C")
  })

  it("4. Commit kết quả CHIẾN THẮNG: Cập nhật World State, mở khóa sector, cộng tài nguyên và bảo vệ lũy đẳng", () => {
    const state = createInitialWorldState(42)
    const sectorId = "nebula_bastion"
    const sector = state.sectors[sectorId]
    sector.threatLevel = 600
    sector.stability = 40
    sector.stage = "threatened"

    const initialData = state.resources.tacticalData
    const initialMats = state.resources.industrialMaterials
    const initialEnergy = state.resources.energy

    const snapshot = lockEncounterAndCreateSnapshot(state, { sectorId })

    const receipt: CombatResultReceipt = {
      transactionId: snapshot.transactionId,
      encounterId: snapshot.encounterId,
      combatVersion: "v1",
      sectorId,
      victory: true,
      rounds: 5,
      playerRemainingHpPercent: 85,
      enemyRemainingHpPercent: 0,
      tacticalRating: "S",
      completedAtTimestamp: Date.now(),
    }

    const resolution = commitCombatResultReceipt(state, receipt)

    assert.equal(resolution.applied, true)
    assert.equal(resolution.alreadyCommitted, false)
    assert.equal(resolution.victory, true)

    // Sector phải được mở khóa
    assert.equal(sector.isLockedForCombat, false)
    assert.equal(sector.lockedGarrisonPower, undefined)

    // Threat giảm và Stability tăng
    assert.ok(sector.threatLevel < 600, "Threat phải giảm")
    assert.ok(sector.stability > 40, "Stability phải tăng")

    // Tài nguyên chiến lược WORLD tăng
    assert.equal(state.resources.tacticalData, initialData + 130)
    assert.equal(state.resources.industrialMaterials, initialMats + 95)
    assert.equal(state.resources.energy, initialEnergy + 70)

    // Suspended Combat cờ bị xóa
    assert.equal(state.isSuspendedCombat, false)
    assert.equal(state.suspendedSnapshot, undefined)

    // Bộ lọc lũy đẳng (Idempotency Filter): Thử commit lần 2 phải bị từ chối
    const secondResolution = commitCombatResultReceipt(state, receipt)
    assert.equal(secondResolution.applied, false)
    assert.equal(secondResolution.alreadyCommitted, true)
    assert.ok(secondResolution.message.includes("Idempotency Filter"))
  })

  it("5. Commit kết quả THẤT BẠI: Giảm ổn định, tăng threat, trừ đồn trú, mở khóa an toàn không xóa oan sector", () => {
    const state = createInitialWorldState(42)
    const sectorId = "mining_outpost_k7"
    const sector = state.sectors[sectorId]
    sector.threatLevel = 360
    sector.stability = 72
    sector.garrisonPower = 800
    sector.fortificationLevel = 1

    const snapshot = lockEncounterAndCreateSnapshot(state, { sectorId })

    const receipt: CombatResultReceipt = {
      transactionId: snapshot.transactionId,
      encounterId: snapshot.encounterId,
      combatVersion: "v1",
      sectorId,
      victory: false,
      rounds: 10,
      playerRemainingHpPercent: 0,
      enemyRemainingHpPercent: 40,
      tacticalRating: "C",
      completedAtTimestamp: Date.now(),
    }

    const resolution = commitCombatResultReceipt(state, receipt)

    assert.equal(resolution.applied, true)
    assert.equal(resolution.victory, false)

    // Sector mở khóa
    assert.equal(sector.isLockedForCombat, false)

    // Threat tăng, Stability giảm
    assert.ok(sector.threatLevel > 360)
    assert.ok(sector.stability < 72)

    // Fortification giảm 1 cấp và chuyển sang under_siege
    assert.equal(sector.fortificationLevel, 0)
    assert.equal(sector.stage, "under_siege")

    // Quân đồn trú bị tổn thất 25% (800 -> 600)
    assert.equal(sector.garrisonPower, 600)
  })

  it("6. Safe Abort: Hủy bỏ an toàn phục hồi 100% đồn trú, mở khóa sector và không áp dụng hình phạt", () => {
    const state = createInitialWorldState(42)
    const sectorId = "sol_command_hq"
    const sector = state.sectors[sectorId]
    const originalGarrison = sector.garrisonPower

    const snapshot = lockEncounterAndCreateSnapshot(state, { sectorId })
    assert.equal(sector.isLockedForCombat, true)
    assert.equal(state.isSuspendedCombat, true)

    // Người chơi chọn Hủy Bỏ An Toàn (Safe Abort)
    const abortResult = abortSuspendedCombat(state, snapshot.transactionId, "Người chơi rút lui an toàn")
    assert.equal(abortResult.success, true)
    assert.equal(abortResult.sectorId, sectorId)
    assert.equal(abortResult.restoredGarrison, originalGarrison)

    // Sector đã mở khóa và bảo toàn nguyên vẹn
    assert.equal(sector.isLockedForCombat, false)
    assert.equal(sector.garrisonPower, originalGarrison)
    assert.equal(sector.lockedGarrisonPower, undefined)

    // Cờ suspended combat đã xóa
    assert.equal(state.isSuspendedCombat, false)
    assert.equal(state.suspendedSnapshot, undefined)

    // Giao dịch chuyển sang trạng thái aborted trong journal
    assert.equal(state.transactionJournal?.[snapshot.transactionId].status, "aborted")
  })

  it("7. Khôi phục trận chiến dở dang sau reload (Resume Suspended Combat)", () => {
    const state = createInitialWorldState(42)
    const sectorId = "asteroid_delta"
    const snapshot = lockEncounterAndCreateSnapshot(state, { sectorId })

    // Giả lập lưu và tải lại state
    saveWorldState(state)
    const loaded = loadWorldState().state

    assert.equal(loaded.isSuspendedCombat, true)
    assert.ok(loaded.suspendedSnapshot)
    assert.equal(loaded.suspendedSnapshot.transactionId, snapshot.transactionId)

    // Tái tạo buồng lái qua resumeSuspendedCombat
    const resumed = resumeSuspendedCombat(loaded, snapshot.transactionId)
    assert.ok(resumed)
    assert.equal(resumed.encounterId, snapshot.encounterId)
    assert.equal(resumed.sectorId, sectorId)
  })

  it("8. Tuyệt đối cách ly: Trận WORLD hoàn tất KHÔNG ghi đè hoặc cộng thưởng vào RPG save", () => {
    // Thiết lập RPG Progression ban đầu
    const initialProg: StarfrontProgression = {
      ...INITIAL_STARFRONT_PROGRESSION,
      credits: 5000,
      exp: 200,
      level: 2,
    }
    saveStarfrontProgression(initialProg)

    const state = createInitialWorldState(42)
    const sectorId = "waypoint_orion"
    const snapshot = lockEncounterAndCreateSnapshot(state, { sectorId })

    const receipt: CombatResultReceipt = {
      transactionId: snapshot.transactionId,
      encounterId: snapshot.encounterId,
      combatVersion: "v1",
      sectorId,
      victory: true,
      rounds: 3,
      playerRemainingHpPercent: 100,
      enemyRemainingHpPercent: 0,
      tacticalRating: "S+",
      completedAtTimestamp: Date.now(),
    }

    // Commit kết quả WORLD
    commitCombatResultReceipt(state, receipt)
    saveWorldState(state)

    // Đọc lại RPG save để xác minh tính độc lập 100%
    const currentProg = loadStarfrontProgression()
    assert.equal(currentProg.credits, 5000, "Credits RPG không được thay đổi bởi trận WORLD")
    assert.equal(currentProg.exp, 200, "EXP RPG không được thay đổi bởi trận WORLD")
    assert.equal(currentProg.level, 2, "Level RPG không được thay đổi bởi trận WORLD")
  })
})
