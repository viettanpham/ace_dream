/**
 * STARFRONT WORLD — Phase 6.8 Test Suite
 * Kiểm thử toàn diện Giao Diện Operations Center & Trung Tâm Kết Quả Kép (Dual Results Hub):
 *   1. Khởi tạo WorldState và các chỉ số vĩ mô trong Situation Deck (Threat TB, Kiểm soát VSS, Dân số, Lương thực)
 *   2. Thao tác điều chuyển quân qua Quick Dispatch: Chặn xuất quân khi nguồn bị khóa combat
 *   3. Lệnh chiến lược Sector (Strategic Order) & Nâng cấp công sự có thẩm quyền
 *   4. Phân tách rạch ròi kết quả kép: Event Results vs Battle Results
 *   5. Cơ chế Xóa Lịch Sử An Toàn (Safe Pruning): Xóa log đã đọc không ảnh hưởng đến bất kỳ chỉ số World State nào
 *   6. Đánh dấu đã đọc / Đọc tất cả cập nhật đúng huy hiệu unread count
 *   7. Tiến trình Tick chiến lược và phản ánh dữ liệu tức thì
 *   8. Lưu trữ và phục hồi dữ liệu Operations Center qua Storage V1
 */

import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { createInitialWorldState } from "@/lib/game/world/initial-state"
import {
  setSectorStrategicOrder,
  upgradeSectorFortification,
  dispatchTroopDeployment,
  calculateTotalMilitaryForce,
} from "@/lib/game/world/forces-ledger"
import {
  chooseEventStrategy,
  autoLockDefaultStrategy,
  applyEventConsequencesOnce,
  resolveProcessingEvent,
  markEventResultAsRead,
  markAllEventResultsAsRead,
  pruneReadEventResultsSafe,
} from "@/lib/game/world/event-engine"
import {
  lockEncounterAndCreateSnapshot,
  commitCombatResultReceipt,
} from "@/lib/game/world/combat-adapter"
import { executeWorldTick } from "@/lib/game/world/tick-engine"
import { saveWorldState, loadWorldState } from "@/lib/game/world/storage"
import type { WorldState, WorldEvent, CombatResultReceipt } from "@/lib/game/world/types"

/**
 * Mock localStorage và window cho môi trường kiểm thử Node.js
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
      for (const k in store) delete store[k]
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length
    },
    _store: store,
  }

  ;(globalThis as any).window = globalThis
  ;(globalThis as any).localStorage = mockStorage
  return mockStorage
}

describe("STARFRONT WORLD — Phase 6.8: Operations Center UI & Dual Results Hub", () => {
  setupMockLocalStorage()

  // ==========================================================================
  // Test 1: Khởi tạo và các chỉ số Situation Deck
  // ==========================================================================
  it("1. Tính toán đúng các chỉ số Situation Deck (Tỷ lệ kiểm soát, Threat TB, Dân số, Lương thực)", () => {
    const state = createInitialWorldState()
    const sectors = Object.values(state.sectors)

    // Kiểm tra tỷ lệ kiểm soát
    const vssCount = sectors.filter((s) => s.sovereignty === "vss").length
    const voidCount = sectors.filter((s) => s.sovereignty === "void").length
    const contestedCount = sectors.filter((s) => s.sovereignty === "contested").length

    assert.equal(vssCount + voidCount + contestedCount, sectors.length, "Tổng số sector phải khớp")
    assert.ok(vssCount >= 1, "Phải có ít nhất 1 sector VSS (Sol Command HQ)")

    // Threat trung bình
    const totalThreat = sectors.reduce((acc, s) => acc + s.threatLevel, 0)
    const avgThreat = Math.round(totalThreat / sectors.length)
    assert.ok(avgThreat >= 0 && avgThreat <= 1000, "Threat trung bình nằm trong khoảng hợp lệ")

    // Dân số bảo toàn
    assert.ok(state.demographics.nationalTotalPopulation > 0, "Tổng dân số quốc gia phải dương")
    assert.ok(state.resources.food > 0, "Kho lương thực quốc gia phải tồn tại")
  })

  // ==========================================================================
  // Test 2: Quick Dispatch - Chặn xuất quân khi sector bị khóa combat
  // ==========================================================================
  it("2. Quick Dispatch Dock: Chặn xuất quân khỏi sector đang bị khóa giao tranh", () => {
    const state = createInitialWorldState()
    const targetSectorId = "helios_perimeter"
    const targetSector = state.sectors[targetSectorId]
    assert.ok(targetSector, "Sector mục tiêu phải tồn tại")

    // Ban đầu quân đồn trú tự do
    targetSector.garrisonPower = 100

    // Khóa sector vào giao tranh bằng Combat Adapter
    const encounter = lockEncounterAndCreateSnapshot(state, {
      sectorId: targetSectorId,
      combatVersion: "v1",
      objective: "eliminate_enemy",
      maxRounds: 15,
    })

    assert.equal(targetSector.isLockedForCombat, true, "Sector phải được đánh dấu isLockedForCombat")

    // Thử điều quân RỜI KHỎI sector đang bị khóa combat
    const dispatchFromLocked = dispatchTroopDeployment(state, {
      fromSectorId: targetSectorId,
      toSectorId: "sol_command_hq",
      troopCount: 30,
      order: "reinforce",
      sourceFromReserves: false,
    })

    assert.equal(dispatchFromLocked.success, false, "Phải từ chối điều quân khỏi sector đang bị khóa combat")
    assert.match(dispatchFromLocked.error || "", /khóa|combat|locked/i, "Thông báo lỗi phải nêu rõ do sector bị khóa")

    // Nhưng điều quân TỪ DỰ BỊ TRUNG ƯƠNG đến sector đó thì ĐƯỢC PHÉP (chi viện)
    const dispatchToLocked = dispatchTroopDeployment(state, {
      fromSectorId: "sol_command_hq",
      toSectorId: targetSectorId,
      troopCount: 20,
      order: "reinforce",
      sourceFromReserves: true,
    })
    assert.equal(dispatchToLocked.success, true, "Phải cho phép điều quân chi viện từ dự bị đến sector nguy cấp")
  })

  // ==========================================================================
  // Test 3: Lệnh chiến lược & Nâng cấp công sự
  // ==========================================================================
  it("3. Cập nhật Lệnh Chiến Lược và Nâng Cấp Công Sự đúng quy tắc thẩm quyền", () => {
    const state = createInitialWorldState()
    const sector = state.sectors["sol_command_hq"]

    // Đổi lệnh chiến lược
    const orderRes = setSectorStrategicOrder(state, "sol_command_hq", "defend")
    assert.equal(orderRes.success, true, "Đổi lệnh chiến lược phải thành công")
    assert.equal(sector.strategicOrder, "defend", "Lệnh đồn trú phải được cập nhật sang defend")

    // Nâng cấp công sự khi đủ vật liệu
    state.resources.industrialMaterials = 200
    // Cấp ban đầu: nếu chưa set thì tính theo stage ("normal" -> 2)
    const currentBaseLevel = sector.fortificationLevel ?? (sector.stage === "normal" ? 2 : 1)

    const upgradeRes = upgradeSectorFortification(state, "sol_command_hq")
    assert.equal(upgradeRes.success, true, "Nâng cấp công sự phải thành công")
    assert.equal(upgradeRes.newLevel, currentBaseLevel + 1, "Cấp công sự phải tăng 1")
    assert.equal(sector.fortificationLevel, currentBaseLevel + 1, "Cấp công sự trong sector phải tăng")
    assert.equal(state.resources.industrialMaterials, 150, "Chi phí vật liệu 50 phải bị trừ chuẩn xác")
  })

  // ==========================================================================
  // Test 4: Phân tách rạch ròi kết quả kép (Dual Results Hub)
  // ==========================================================================
  it("4. Phân tách minh bạch giữa Event Results và Battle Results", () => {
    const state = createInitialWorldState()

    // Tạo một Event Result
    const mockEvent: WorldEvent = {
      id: "evt_test_hub_1",
      templateId: "evt_solar_flare",
      title: "Bão Bức Xạ Mặt Trời",
      description: "Thử nghiệm kết quả sự kiện",
      category: "anomaly",
      severity: "warning",
      status: "RESULT",
      sectorId: "helios_perimeter",
      startedAtTick: 1,
      decisionDeadlineTick: 2,
      processingCompletesTick: 3,
      chosenStrategyId: "strat_shield_boost",
      availableStrategies: [],
      consequencesApplied: true,
      result: {
        id: "res_evt_test_hub_1",
        eventId: "evt_test_hub_1",
        templateId: "evt_solar_flare",
        title: "Bão Bức Xạ Mặt Trời",
        category: "anomaly",
        severity: "warning",
        sectorId: "helios_perimeter",
        status: "success",
        chosenStrategyName: "Gia Cố Khiên",
        summaryText: "Hệ thống khiên đã cản phá thành công cơn bão.",
        resolvedAtTick: 3,
        resolvedAtTimestamp: Date.now(),
        isRead: false,
      },
    }

    state.eventResultsArchive = [mockEvent.result!]

    // Tạo một Battle Result thông qua Combat Adapter commit
    const snapshotLock = lockEncounterAndCreateSnapshot(state, {
      sectorId: "helios_perimeter",
      combatVersion: "v1",
      objective: "eliminate_enemy",
      maxRounds: 10,
    })

    const receipt: CombatResultReceipt = {
      transactionId: snapshotLock.transactionId,
      encounterId: snapshotLock.encounterId,
      combatVersion: "v1",
      sectorId: "helios_perimeter",
      victory: true,
      rounds: 4,
      playerRemainingHpPercent: 85,
      enemyRemainingHpPercent: 0,
      tacticalRating: "S",
      completedAtTimestamp: Date.now(),
    }

    const commitRes = commitCombatResultReceipt(state, receipt)
    assert.equal(commitRes.applied, true, "Commit kết quả chiến đấu phải thành công")

    // Đối chiếu 2 nguồn dữ liệu trong Hub:
    // Tab 1: Event Results lấy từ eventResultsArchive
    assert.equal(state.eventResultsArchive.length, 1, "Tab Event Results phải có đúng 1 bản ghi")
    assert.equal(state.eventResultsArchive[0].title, "Bão Bức Xạ Mặt Trời")

    // Tab 2: Battle Results lấy từ transactionJournal
    const battleJournals = Object.values(state.transactionJournal).filter(
      (j) => j.type === "combat" && j.status === "committed"
    )
    assert.equal(battleJournals.length, 1, "Tab Battle Results phải có đúng 1 bản ghi")
    assert.equal(battleJournals[0].receipt?.victory, true)
    assert.equal(battleJournals[0].receipt?.tacticalRating, "S")
  })

  // ==========================================================================
  // Test 5: Safe Pruning - Xóa báo cáo không suy giảm World State
  // ==========================================================================
  it("5. Cơ chế Xóa Lịch Sử An Toàn (Safe Pruning): Bảo toàn 100% chỉ số World State", () => {
    const state = createInitialWorldState()
    state.resources.industrialMaterials = 500
    state.resources.food = 2500
    state.military.deployed = 300
    state.demographics.nationalTotalPopulation = 200000

    const initialSnapshot = JSON.stringify({
      resources: state.resources,
      military: state.military,
      demographics: state.demographics,
      sectors: state.sectors,
    })

    // Thêm các kết quả sự kiện vào archive
    state.eventResultsArchive = [
      {
        id: "res_read_1",
        eventId: "evt_1",
        templateId: "t1",
        title: "Tin tức 1",
        category: "civic",
        severity: "info",
        status: "success",
        chosenStrategyName: "Thỏa hiệp",
        summaryText: "Hoàn tất thỏa hiệp",
        resolvedAtTick: 2,
        resolvedAtTimestamp: Date.now(),
        isRead: true, // Đã đọc -> Sẽ bị xóa
      },
      {
        id: "res_unread_2",
        eventId: "evt_2",
        templateId: "t2",
        title: "Tin tức 2",
        category: "military",
        severity: "critical",
        status: "failure",
        chosenStrategyName: "Phòng thủ",
        summaryText: "Thất bại phòng thủ",
        resolvedAtTick: 3,
        resolvedAtTimestamp: Date.now(),
        isRead: false, // Chưa đọc -> Được giữ lại
      },
    ]

    // Thực hiện Safe Pruning
    const pruneRes = pruneReadEventResultsSafe(state)
    assert.equal(pruneRes.prunedCount, 1, "Phải xóa đúng 1 bản ghi đã đọc")
    assert.equal(state.eventResultsArchive.length, 1, "Chỉ còn lại 1 bản ghi chưa đọc")
    assert.equal(state.eventResultsArchive[0].id, "res_unread_2", "Bản ghi chưa đọc phải còn nguyên")

    // Kiểm tra tính bất biến của World State sau khi xóa log
    const afterPruneSnapshot = JSON.stringify({
      resources: state.resources,
      military: state.military,
      demographics: state.demographics,
      sectors: state.sectors,
    })

    assert.equal(
      afterPruneSnapshot,
      initialSnapshot,
      "Tất cả chỉ số tài nguyên, quân sự, dân số và sector phải nguyên vẹn 100% sau khi Safe Pruning"
    )
  })

  // ==========================================================================
  // Test 6: Đánh dấu đã đọc / Đọc tất cả cập nhật unread count badge
  // ==========================================================================
  it("6. Đánh dấu đã đọc và Đọc Tất Cả cập nhật chính xác số lượng chưa đọc", () => {
    const state = createInitialWorldState()
    state.eventResultsArchive = [
      {
        id: "res_1",
        eventId: "e1",
        templateId: "t1",
        title: "A",
        category: "civic",
        severity: "info",
        status: "success",
        chosenStrategyName: "X",
        summaryText: "X",
        resolvedAtTick: 1,
        resolvedAtTimestamp: Date.now(),
        isRead: false,
      },
      {
        id: "res_2",
        eventId: "e2",
        templateId: "t2",
        title: "B",
        category: "anomaly",
        severity: "warning",
        status: "success",
        chosenStrategyName: "Y",
        summaryText: "Y",
        resolvedAtTick: 1,
        resolvedAtTimestamp: Date.now(),
        isRead: false,
      },
    ]

    const initialUnread = state.eventResultsArchive.filter((r) => !r.isRead).length
    assert.equal(initialUnread, 2, "Ban đầu có 2 báo cáo chưa đọc")

    // Đánh dấu 1 cái đã đọc
    markEventResultAsRead(state, "res_1")
    assert.equal(state.eventResultsArchive.find((r) => r.id === "res_1")?.isRead, true)
    assert.equal(state.eventResultsArchive.filter((r) => !r.isRead).length, 1)

    // Đánh dấu tất cả đã đọc
    const readCount = markAllEventResultsAsRead(state)
    assert.equal(readCount, 1, "Phải đánh dấu 1 cái còn lại thành đã đọc")
    assert.equal(state.eventResultsArchive.filter((r) => !r.isRead).length, 0, "Không còn báo cáo nào chưa đọc")
  })

  // ==========================================================================
  // Test 7: Tiến 1 ngày chiến lược (Tick Engine) cập nhật Operations Center
  // ==========================================================================
  it("7. Tiến 1 Ngày (Tick Engine) kích hoạt các phase và lưu biến động", () => {
    const state = createInitialWorldState()
    const startDay = state.currentDay

    const tickResult = executeWorldTick(state, { logPhases: true })
    assert.equal(state.currentDay, startDay + 1, "Ngày hiện tại phải tăng 1")
    assert.ok(tickResult.phaseLogs.length >= 6, "Phải ghi nhận đầy đủ 6 phase mô phỏng chiến lược")

    // Sau khi tick, lưu trạng thái thành công
    const saveRes = saveWorldState(state)
    assert.equal(saveRes.success, true, "Lưu trạng thái sau tick phải thành công")
  })

  // ==========================================================================
  // Test 8: Nạp lại từ LocalStorage bảo toàn toàn bộ cấu trúc Operations Center
  // ==========================================================================
  it("8. Lưu và Nạp lại bảo toàn nguyên vẹn WorldState cho Operations Center", () => {
    const state = createInitialWorldState()
    state.currentDay = 15
    state.sectors["sol_command_hq"].fortificationLevel = 4
    state.sectors["sol_command_hq"].strategicOrder = "attack"
    state.eventResultsArchive = [
      {
        id: "res_persistent_1",
        eventId: "e_p",
        templateId: "t_p",
        title: "Biến cố thử nghiệm",
        category: "diplomacy",
        severity: "info",
        status: "success",
        chosenStrategyName: "Ký kết",
        summaryText: "Hiệp ước hoàn tất",
        resolvedAtTick: 14,
        resolvedAtTimestamp: Date.now(),
        isRead: false,
      },
    ]

    const saveResult = saveWorldState(state)
    assert.equal(saveResult.success, true)

    const loadResult = loadWorldState()
    assert.equal(loadResult.status, "loaded_primary")
    const loadedState = loadResult.state

    assert.equal(loadedState.currentDay, 15)
    assert.equal(loadedState.sectors["sol_command_hq"].fortificationLevel, 4)
    assert.equal(loadedState.sectors["sol_command_hq"].strategicOrder, "attack")
    assert.equal(loadedState.eventResultsArchive.length, 1)
    assert.equal(loadedState.eventResultsArchive[0].title, "Biến cố thử nghiệm")
  })
})
