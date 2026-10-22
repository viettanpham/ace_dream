/**
 * STARFRONT WORLD — Phase 6.9: Fullscreen Map & E2E Integration Test Suite
 * Kiểm thử toàn diện 9 luồng tích hợp hệ thống (End-to-End Regression Verification):
 *   1. Mở WORLD và nạp Bản Đồ Toàn Màn Hình (8 Sectors, 12 Routes chuẩn hóa)
 *   2. Chọn Sector, mở Inspector chi tiết, thay đổi Lệnh Chiến Lược & Nâng Cấp Công Sự
 *   3. Định tuyến quân sự qua tuyến hợp lệ (Open/Hazardous), chặn tuyến Blocked/Offline
 *   4. Chặn điều quân rời khỏi Sector đang bị khóa Combat (Combat-Lock Guard)
 *   5. Tiến Tick Engine (1 Ngày), kiểm tra lan truyền Threat, di chuyển quân và kinh tế
 *   6. Vòng đời sự kiện (INIT -> PROCESSING -> RESULT) với Idempotency Guard
 *   7. Cam kết kết quả chiến đấu qua Combat Adapter & Transaction Journal lũy đẳng
 *   8. Lưu trữ bền vững (World Save V1 A/B), Checksum và khôi phục sau reload
 *   9. Bảo toàn Zero-Regression với tiến trình RPG hiện có (Schema v4)
 */

import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"

import { createInitialWorldState } from "@/lib/game/world/initial-state"
import { getInitialSectorsList, getInitialRoutesList } from "@/lib/game/world/initial-map"
import {
  findShortestPath,
  isRouteTraversable,
  findConnectingRoute,
} from "@/lib/game/world/graph"
import {
  setSectorStrategicOrder,
  upgradeSectorFortification,
  dispatchTroopDeployment,
  calculateTotalMilitaryForce,
  getInTransitTroopsCount,
} from "@/lib/game/world/forces-ledger"
import { executeWorldTick } from "@/lib/game/world/tick-engine"
import {
  chooseEventStrategy,
  resolveProcessingEvent,
  applyEventConsequencesOnce,
  getActiveEvents,
} from "@/lib/game/world/event-engine"
import { createEventFromTemplate } from "@/lib/game/world/event-templates"
import {
  lockEncounterAndCreateSnapshot,
  commitCombatResultReceipt,
} from "@/lib/game/world/combat-adapter"
import { isTransactionCommitted } from "@/lib/game/world/transaction-journal"
import {
  saveWorldState,
  loadWorldState,
  WORLD_STORAGE_KEY_V1,
} from "@/lib/game/world/storage"
import {
  saveStarfrontProgression,
  loadStarfrontProgression,
  STORAGE_KEY_V4,
} from "@/lib/game/storage"
import { INITIAL_STARFRONT_PROGRESSION } from "@/lib/game/progression"
import type {
  CombatResultReceipt,
  WorldState,
  StrategicOrder,
} from "@/lib/game/world/types"

/**
 * Mock localStorage in-memory cho môi trường Node.js runner
 */
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
  }
  ;(globalThis as any).window = globalThis
  ;(globalThis as any).localStorage = mockStorage
  return memoryStore
}

describe("STARFRONT WORLD — Phase 6.9: Fullscreen Map & E2E Integration", () => {
  beforeEach(() => {
    setupMockLocalStorage()
  })

  // ==========================================================================
  // Luồng 1: Mở WORLD và nạp Bản Đồ Toàn Màn Hình
  // ==========================================================================
  it("1. Mở WORLD và nạp Bản Đồ Toàn Màn Hình: Đúng 10 sector và 16 tuyến đường (Phase 6.28)", () => {
    const state = createInitialWorldState()

    const sectors = Object.values(state.sectors)
    const routes = state.routes

    // Kiểm tra số lượng thực tế lấy từ WorldState
    assert.equal(sectors.length, 10, "Bản đồ phải có đúng 10 sector khởi đầu")
    assert.equal(routes.length, 16, "Mạng lưới phải có đúng 16 tuyến hyperlane")

    // Kiểm tra các thuộc tính trực quan phục vụ render bản đồ
    for (const s of sectors) {
      assert.ok(typeof s.x === "number" && s.x >= 0 && s.x <= 100, `Sector ${s.id} phải có tọa độ X [0..100]`)
      assert.ok(typeof s.y === "number" && s.y >= 0 && s.y <= 100, `Sector ${s.id} phải có tọa độ Y [0..100]`)
      assert.ok(["vss", "void", "contested", "neutral"].includes(s.sovereignty), `Chủ quyền sector ${s.id} hợp lệ`)
      assert.ok(["normal", "threatened", "under_siege", "lost", "recovery"].includes(s.stage), `Stage sector ${s.id} hợp lệ`)
      assert.ok(typeof s.threatLevel === "number" && s.threatLevel >= 0 && s.threatLevel <= 1000, `Threat sector ${s.id} hợp lệ`)
      assert.ok(typeof s.name === "string" && s.name.length > 0, `Sector ${s.id} có tên hiển thị`)
    }

    // Kiểm tra cấu trúc các tuyến đường
    for (const r of routes) {
      assert.ok(state.sectors[r.fromSectorId], `Tuyến ${r.id} có sector xuất phát hợp lệ`)
      assert.ok(state.sectors[r.toSectorId], `Tuyến ${r.id} có sector đích hợp lệ`)
      assert.ok(["open", "hazardous", "blocked", "offline"].includes(r.state), `Trạng thái tuyến ${r.id} hợp lệ`)
    }
  })

  // ==========================================================================
  // Luồng 2: Chọn Sector, mở Inspector chi tiết & Thao tác lệnh/công sự
  // ==========================================================================
  it("2. Chọn Sector, mở Inspector chi tiết, cập nhật Lệnh Chiến Lược & Công Sự", () => {
    const state = createInitialWorldState()
    const targetSectorId = "mining_outpost_k7"
    const targetSector = state.sectors[targetSectorId]

    assert.ok(targetSector, "Sector mục tiêu phải tồn tại")
    assert.equal(targetSector.sovereignty, "vss")
    assert.equal(targetSector.stage, "threatened")

    // Thay đổi Lệnh Chiến Lược sang "defend"
    const orderRes = setSectorStrategicOrder(state, targetSectorId, "defend")
    assert.equal(orderRes.success, true, "Đổi lệnh chiến lược sang defend phải thành công")
    assert.equal(state.sectors[targetSectorId].strategicOrder, "defend")

    // Nâng cấp công sự phòng thủ (Chi phí 50 vật liệu công nghiệp)
    const initialMaterials = state.resources.industrialMaterials
    const initialFortLevel = targetSector.fortificationLevel ?? 1

    const fortRes = upgradeSectorFortification(state, targetSectorId)
    assert.equal(fortRes.success, true, "Nâng cấp công sự phải thành công")
    assert.equal(state.sectors[targetSectorId].fortificationLevel, initialFortLevel + 1)
    assert.equal(
      state.resources.industrialMaterials,
      initialMaterials - 50,
      "Phải trừ 50 vật liệu công nghiệp khi nâng cấp công sự"
    )
  })

  // ==========================================================================
  // Luồng 3: Định tuyến & Điều quân qua tuyến hợp lệ, chặn tuyến Blocked/Offline
  // ==========================================================================
  it("3. Định tuyến quân sự qua tuyến hợp lệ; chặn tuyến Blocked/Offline; bảo toàn lực lượng", () => {
    const state = createInitialWorldState()

    // Tìm đường từ Sol HQ đến Mining Outpost K-7 (qua Helios Perimeter: Open)
    const pathValid = findShortestPath(state.sectors, state.routes, "sol_command_hq", "mining_outpost_k7")
    assert.ok(pathValid, "Phải tìm được lộ trình hợp lệ từ Sol HQ đến K-7")
    assert.equal(pathValid.traversable, true)
    assert.deepEqual(pathValid.path, ["sol_command_hq", "helios_perimeter", "mining_outpost_k7"])

    // Tìm đường đến Tartarus Breach với chế độ không cho phép Blocked (mặc định allowBlocked = false)
    const pathBlocked = findShortestPath(state.sectors, state.routes, "waypoint_orion", "tartarus_breach", {
      allowBlocked: false,
    })
    assert.equal(pathBlocked, null, "Không được cho phép định tuyến qua tuyến bị Blocked")

    // Thực hiện điều quân 60 quân từ kho dự bị chiến lược sang K-7
    const initialForce = calculateTotalMilitaryForce(state.military)
    const initialReserves = state.military.reserves

    const dispatchRes = dispatchTroopDeployment(state, {
      fromSectorId: "sol_command_hq",
      toSectorId: "mining_outpost_k7",
      troopCount: 60,
      order: "reinforce",
      factionId: "vss",
      sourceFromReserves: true,
    })

    assert.equal(dispatchRes.success, true, "Điều quân qua tuyến hợp lệ phải thành công")
    assert.equal(state.military.reserves, initialReserves - 60, "Quân dự bị phải giảm đúng 60")
    assert.equal(state.activeDeployments?.length, 1, "Phải có 1 đạo quân in_transit")

    // Bảo toàn 100% lực lượng
    const inTransit = getInTransitTroopsCount(state)
    const afterForce = calculateTotalMilitaryForce(state.military, inTransit)
    assert.equal(afterForce, initialForce, "Tổng quân số quốc gia phải bảo toàn 100%")
  })

  // ==========================================================================
  // Luồng 4: Sector bị khóa Combat chặn điều quân rời khỏi
  // ==========================================================================
  it("4. Sector bị khóa Combat không cho điều quân trái phép rời khỏi", () => {
    const state = createInitialWorldState()
    const lockedSectorId = "helios_perimeter"

    // Đánh dấu sector đang bị khóa giao tranh
    state.sectors[lockedSectorId].isLockedForCombat = true
    state.sectors[lockedSectorId].garrisonPower = 200

    // Cố gắng điều quân rời khỏi sector bị khóa
    const illegalDispatch = dispatchTroopDeployment(state, {
      fromSectorId: lockedSectorId,
      toSectorId: "mining_outpost_k7",
      troopCount: 50,
      order: "reinforce",
      factionId: "vss",
      sourceFromReserves: false,
    })

    assert.equal(illegalDispatch.success, false, "Điều quân từ sector khóa combat phải bị từ chối")
    assert.match(illegalDispatch.error || "", /khóa|combat|lock/i, "Lý do lỗi phải nêu rõ trạng thái khóa combat")
  })

  // ==========================================================================
  // Luồng 5: Tiến Tick Engine cập nhật Threat, di chuyển quân và phản ánh WorldState
  // ==========================================================================
  it("5. Tiến Tick Engine (1 Ngày): Cập nhật Threat, di chuyển quân và phản ánh WorldState", () => {
    const state = createInitialWorldState()
    const startDay = state.currentDay

    // Thêm một đạo quân đang di chuyển với remainingDays = 1
    state.activeDeployments = [
      {
        deploymentId: "dep_test_tick",
        transactionId: "tx_tick_1",
        factionId: "vss",
        fromSectorId: "sol_command_hq",
        toSectorId: "helios_perimeter",
        troopCount: 40,
        order: "reinforce",
        path: ["sol_command_hq", "helios_perimeter"],
        totalDistance: 1,
        remainingDays: 1,
        status: "in_transit",
        createdAt: Date.now(),
      },
    ]

    const initialGarrisonHelios = state.sectors["helios_perimeter"].garrisonPower

    // Chạy 1 tick
    const tickResult = executeWorldTick(state, { logPhases: true })

    assert.equal(state.currentDay, startDay + 1, "Ngày chiến lược phải tăng 1")
    assert.ok(tickResult.phaseLogs.length >= 6, "Phải thực thi đủ 6 phase tất định")

    // Đạo quân đến đích và sáp nhập vào đồn trú Helios Perimeter
    assert.equal(
      state.sectors["helios_perimeter"].garrisonPower,
      initialGarrisonHelios + 40,
      "Quân đến đích phải được cộng vào đồn trú Helios"
    )
    assert.equal(state.activeDeployments.length, 0, "Không còn đạo quân in_transit sau khi đã đến đích")
  })

  // ==========================================================================
  // Luồng 6: Vòng đời sự kiện với Idempotency Guard (chỉ áp dụng 1 lần)
  // ==========================================================================
  it("6. Vòng đời sự kiện: Áp dụng hậu quả chỉ đúng 1 lần (Idempotency Guard)", () => {
    const state = createInitialWorldState()
    state.events = state.events || {}

    const event = createEventFromTemplate("evt_plasma_storm", state.currentDay, {
      targetSectorId: "helios_perimeter",
    })
    assert.ok(event, "Khởi tạo sự kiện mẫu phải thành công")
    state.events[event.id] = event
    assert.equal(event.status, "INIT")

    // Chọn phương án phản ứng
    const strategy = event.availableStrategies[0]
    const chosen = chooseEventStrategy(state, event.id, strategy.id)
    assert.equal(chosen.success, true)
    assert.equal(event.status, "PROCESSING")

    // Giả lập thời gian xử lý hoàn tất
    event.processingCompletesTick = state.currentDay
    const initialEnergy = state.resources.energy
    const initialThreat = state.sectors["helios_perimeter"].threatLevel

    // Resolve sự kiện sang RESULT
    const resultEvt = resolveProcessingEvent(state, event)
    assert.equal(resultEvt.success, true)
    assert.equal(event.status, "RESULT")
    assert.equal(event.consequencesApplied, true)

    const energyAfterFirst = state.resources.energy
    const threatAfterFirst = state.sectors["helios_perimeter"].threatLevel

    // Cố gắng áp dụng hậu quả lần 2 thông qua applyEventConsequencesOnce
    const secondTry = applyEventConsequencesOnce(state, event, strategy.consequences)
    assert.equal(secondTry.applied, false, "Lần 2 phải bị từ chối bởi idempotency guard")
    assert.equal(state.resources.energy, energyAfterFirst, "Năng lượng không bị trừ thêm lần 2")
    assert.equal(state.sectors["helios_perimeter"].threatLevel, threatAfterFirst, "Threat không bị trừ thêm lần 2")
  })

  // ==========================================================================
  // Luồng 7: Kết quả chiến đấu qua Combat Adapter & Transaction Journal
  // ==========================================================================
  it("7. Kết quả chiến đấu: Commit qua Combat Adapter & Chống áp dụng lần 2", () => {
    const state = createInitialWorldState()
    const sectorId = "mining_outpost_k7"
    const initialThreat = state.sectors[sectorId].threatLevel

    // Khóa trận và tạo snapshot
    const snapshotLock = lockEncounterAndCreateSnapshot(state, {
      sectorId,
      combatVersion: "v1",
      objective: "eliminate_enemy",
      maxRounds: 10,
    })

    assert.equal(state.sectors[sectorId].isLockedForCombat, true, "Sector phải ở trạng thái khóa giao tranh")

    // Biên lai chiến thắng
    const receipt: CombatResultReceipt = {
      transactionId: snapshotLock.transactionId,
      encounterId: snapshotLock.encounterId,
      combatVersion: "v1",
      sectorId,
      victory: true,
      rounds: 5,
      playerRemainingHpPercent: 90,
      enemyRemainingHpPercent: 0,
      tacticalRating: "S",
      completedAtTimestamp: Date.now(),
    }

    // Commit kết quả lần 1
    const commit1 = commitCombatResultReceipt(state, receipt)
    assert.equal(commit1.applied, true, "Commit kết quả lần 1 phải thành công")
    assert.equal(state.sectors[sectorId].isLockedForCombat, false, "Sector phải được giải phóng khóa giao tranh")
    assert.ok(state.sectors[sectorId].threatLevel < initialThreat, "Threat của sector phải giảm sau chiến thắng")

    const threatAfterVictory = state.sectors[sectorId].threatLevel

    // Commit lại lần 2 cùng biên lai
    const commit2 = commitCombatResultReceipt(state, receipt)
    assert.equal(commit2.applied, false, "Lần 2 phải bị chặn bởi Idempotency filter")
    assert.equal(commit2.alreadyCommitted, true)
    assert.equal(state.sectors[sectorId].threatLevel, threatAfterVictory, "Threat không được giảm thêm lần 2")
  })

  // ==========================================================================
  // Luồng 8: Lưu game, reload và xác nhận WorldState cùng lựa chọn Sector nhất quán
  // ==========================================================================
  it("8. Lưu trữ bền vững (World Save V1): Lưu và nạp bảo toàn nguyên vẹn WorldState", () => {
    const state = createInitialWorldState()
    state.currentDay = 24
    state.sectors["sol_command_hq"].strategicOrder = "defend"
    state.sectors["mining_outpost_k7"].fortificationLevel = 3

    // Lưu vào storage
    const saveRes = saveWorldState(state)
    assert.equal(saveRes.success, true, "Lưu World State phải thành công")
    assert.ok(saveRes.checksum && saveRes.checksum.length > 0, "Phải có Checksum CRC32")

    // Nạp lại từ storage
    const loadRes = loadWorldState()
    assert.equal(loadRes.checksumVerified, true, "Nạp World State và xác minh Checksum phải thành công")
    assert.equal(loadRes.state.currentDay, 24)
    assert.equal(loadRes.state.sectors["sol_command_hq"].strategicOrder, "defend")
    assert.equal(loadRes.state.sectors["mining_outpost_k7"].fortificationLevel, 3)
    assert.equal(Object.keys(loadRes.state.sectors).length, 10)
    assert.equal(loadRes.state.routes.length, 16)
  })

  // ==========================================================================
  // Luồng 9: Zero-Regression — Tiến trình RPG v4 hoàn toàn không bị ảnh hưởng
  // ==========================================================================
  it("9. Zero-Regression: Tiến trình RPG Schema v4 hoàn toàn độc lập và an toàn", () => {
    // Lưu một tiến trình RPG hợp lệ
    const mockProgression = {
      ...INITIAL_STARFRONT_PROGRESSION,
      level: 15,
      credits: 50000,
      activeGearId: "falcon" as const,
      activePairing: {
        pilotId: "eric",
        gearId: "falcon" as const,
        isLocked: true,
        unlockProgress: {
          completedMissions: 0,
          wonBattles: 0,
          targetCount: 5,
        },
      },
    }

    saveStarfrontProgression(mockProgression)

    // Thao tác với World State (Lưu / nạp nhiều lần)
    const worldState = createInitialWorldState()
    worldState.currentDay = 100
    saveWorldState(worldState)

    // Đọc lại tiến trình RPG
    const loadedProg = loadStarfrontProgression()
    assert.equal(loadedProg.level, 15, "Cấp độ RPG không bị thay đổi")
    assert.equal(loadedProg.credits, 50000, "Tín dụng RPG không bị thay đổi")
    assert.equal(loadedProg.activeGearId, "falcon", "Cơ giáp đang chọn không bị thay đổi")
    assert.equal(loadedProg.activePairing?.pilotId, "eric", "Tổ hợp Phi Công không bị thay đổi")
    assert.equal(loadedProg.activePairing?.isLocked, true)

    // Xác nhận 2 khóa lưu trữ LocalStorage hoàn toàn riêng biệt
    const rawWorld = localStorage.getItem(WORLD_STORAGE_KEY_V1)
    const rawRpg = localStorage.getItem(STORAGE_KEY_V4)
    assert.ok(rawWorld, "Khóa lưu trữ WORLD phải tồn tại")
    assert.ok(rawRpg, "Khóa lưu trữ RPG v4 phải tồn tại")
    assert.notEqual(rawWorld, rawRpg, "Hai khóa lưu trữ phải hoàn toàn độc lập")
  })
})
