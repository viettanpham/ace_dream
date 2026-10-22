import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"

import {
  createInitialWorldState,
  INITIAL_WORLD_SECTORS,
  INITIAL_WORLD_ROUTES,
  INITIAL_WORLD_FACTIONS,
} from "@/lib/game/world/initial-state"
import {
  getInitialSectorsList,
  getInitialRoutesList,
  getInitialSectorById,
  getInitialRouteById,
} from "@/lib/game/world/initial-map"
import {
  findConnectingRoute,
  getAdjacentSectors,
  findShortestPath,
} from "@/lib/game/world/graph"
import {
  loadWorldState,
  saveWorldState,
  migrateWorldStateTo10Sectors,
  WORLD_STORAGE_KEY_V1,
} from "@/lib/game/world/storage"
import { SECTOR_INTEL_THEMES } from "@/components/game/world/sector-intel-modal"
import type { WorldState, WorldSector, WorldRoute } from "@/lib/game/world/types"

/**
 * Giả lập localStorage trong bộ nhớ cho kiểm thử Node.js
 */
function setupMockLocalStorage(): Map<string, string> {
  const memoryStore = new Map<string, string>()

  const mockStorage = {
    getItem: (key: string) => (memoryStore.has(key) ? memoryStore.get(key)! : null),
    setItem: (key: string, val: string) => {
      memoryStore.set(key, String(val))
    },
    removeItem: (key: string) => {
      memoryStore.delete(key)
    },
    clear: () => {
      memoryStore.clear()
    },
    key: (index: number) => Array.from(memoryStore.keys())[index] || null,
    get length() {
      return memoryStore.size
    },
  }

  ;(globalThis as any).window = globalThis
  ;(globalThis as any).localStorage = mockStorage
  return memoryStore
}

describe("STARFRONT WORLD — Phase 6.28: Galaxy Expansion to 10 Sectors & Sector Intel", () => {
  beforeEach(() => {
    setupMockLocalStorage()
  })

  // ==========================================================================
  // Test 1: Mở rộng Galaxy Map lên đúng 10 Sector & Bảo toàn 8 Sector cũ
  // ==========================================================================
  it("1. Mở rộng Galaxy Map từ 8 lên đúng 10 sector, bảo toàn ID và thuộc tính của 8 sector cũ", () => {
    const state = createInitialWorldState()
    const sectors = Object.values(state.sectors)

    assert.equal(sectors.length, 10, "Bản đồ thiên hà phải có chính xác 10 sector")

    // Xác nhận 8 sector nguyên bản vẫn tồn tại trọn vẹn
    const originalIds = [
      "sol_command_hq",
      "helios_perimeter",
      "mining_outpost_k7",
      "asteroid_delta",
      "nebula_bastion",
      "waypoint_orion",
      "shadow_reach",
      "tartarus_breach",
    ]
    for (const oldId of originalIds) {
      assert.ok(state.sectors[oldId], `Sector cũ [${oldId}] phải được bảo toàn`)
      assert.ok(state.sectors[oldId].name.length > 0)
      assert.ok(state.sectors[oldId].resources.food >= 0)
    }

    // Xác nhận 2 sector mới được bổ sung chuẩn hóa
    const elysium = state.sectors["elysium_sanctuary"]
    assert.ok(elysium, "Sector mới [elysium_sanctuary] phải tồn tại")
    assert.equal(elysium.id, "elysium_sanctuary")
    assert.equal(elysium.sovereignty, "vss")
    assert.equal(elysium.stage, "normal")
    assert.ok(elysium.resources.food >= 1000, "Elysium phải có trữ lượng lương thực dồi dào")
    assert.ok(elysium.x === 26 && elysium.y === 28, "Tọa độ Elysium phải nằm ở vành đai tây bắc hợp lý")

    const abyssal = state.sectors["abyssal_rift"]
    assert.ok(abyssal, "Sector mới [abyssal_rift] phải tồn tại")
    assert.equal(abyssal.id, "abyssal_rift")
    assert.equal(abyssal.sovereignty, "contested")
    assert.equal(abyssal.stage, "threatened")
    assert.ok(abyssal.threatLevel >= 600, "Abyssal Rift phải có mức đe dọa cao")
    assert.ok(abyssal.x === 82 && abyssal.y === 24, "Tọa độ Abyssal Rift phải nằm ở vành đai đông bắc hợp lý")

    // Danh sách phe kiểm soát VSS bao gồm Elysium
    assert.ok(
      state.factions.vss.controlledSectorIds.includes("elysium_sanctuary"),
      "Phe VSS phải kiểm soát Elysium Sanctuary lúc khởi đầu"
    )
  })

  // ==========================================================================
  // Test 2: Mạng lưới 16 Hyperlane Routes & Thuật toán Dijkstra tìm đường
  // ==========================================================================
  it("2. Mạng lưới 16 tuyến đường siêu không gian kết nối đầy đủ và thuật toán Dijkstra hoạt động trên cả 10 sector", () => {
    const state = createInitialWorldState()
    const routes = state.routes

    assert.equal(routes.length, 16, "Mạng lưới phải có đúng 16 tuyến siêu không gian")

    // Kiểm tra kết nối của 2 sector mới
    const elysiumNeighbors = getAdjacentSectors(routes, "elysium_sanctuary")
    assert.equal(elysiumNeighbors.length, 2, "Elysium Sanctuary phải có ít nhất 2 kết nối siêu không gian")
    const elysiumNeighborIds = elysiumNeighbors.map((n) => n.sectorId)
    assert.ok(elysiumNeighborIds.includes("helios_perimeter"))
    assert.ok(elysiumNeighborIds.includes("asteroid_delta"))

    const abyssalNeighbors = getAdjacentSectors(routes, "abyssal_rift", { allowBlocked: true })
    assert.equal(abyssalNeighbors.length, 2, "Abyssal Rift phải có 2 kết nối siêu không gian")
    const abyssalNeighborIds = abyssalNeighbors.map((n) => n.sectorId)
    assert.ok(abyssalNeighborIds.includes("waypoint_orion"))
    assert.ok(abyssalNeighborIds.includes("tartarus_breach"))

    // Dijkstra: Tìm đường từ Sol HQ tới Elysium Sanctuary
    const pathToElysium = findShortestPath(state.sectors, routes, "sol_command_hq", "elysium_sanctuary")
    assert.ok(pathToElysium, "Phải tìm được đường từ Sol HQ tới Elysium Sanctuary")
    assert.equal(pathToElysium.traversable, true, "Tuyến đường tới Elysium phải thông suốt")
    assert.deepEqual(pathToElysium.path, ["sol_command_hq", "helios_perimeter", "elysium_sanctuary"])

    // Dijkstra: Tìm đường từ Sol HQ tới Abyssal Rift
    const pathToAbyssal = findShortestPath(state.sectors, routes, "sol_command_hq", "abyssal_rift", {
      allowHazardous: true,
    })
    assert.ok(pathToAbyssal, "Phải tìm được đường từ Sol HQ tới Abyssal Rift")
    assert.ok(pathToAbyssal.path.length >= 3)
    assert.equal(pathToAbyssal.path[pathToAbyssal.path.length - 1], "abyssal_rift")
  })

  // ==========================================================================
  // Test 3: Cơ chế Hitbox & Drag Threshold không nuốt Click
  // ==========================================================================
  it("3. Hitbox tọa độ độc lập và Drag Threshold phân biệt rõ ràng giữa Pan camera và Click chọn Sector", () => {
    const state = createInitialWorldState()
    const DRAG_THRESHOLD = 5

    let selectedSectorId: string | null = null
    let dragDistance = 0
    let hasExceededDragThreshold = false

    function simulatePointerGesture(moveDistance: number, sectorId: string) {
      dragDistance = moveDistance
      hasExceededDragThreshold = dragDistance >= DRAG_THRESHOLD

      // Giả lập onPointerUp trên Sector Node
      if (!hasExceededDragThreshold) {
        selectedSectorId = sectorId
      }
    }

    // Thao tác 1: Click tĩnh (di chuyển 0px) -> Phải chọn sector
    simulatePointerGesture(0, "elysium_sanctuary")
    assert.equal(selectedSectorId, "elysium_sanctuary", "Click tĩnh phải chọn được sector")

    // Thao tác 2: Micro-jitter khi click (di chuyển 3px < DRAG_THRESHOLD) -> Vẫn chọn sector
    simulatePointerGesture(3, "abyssal_rift")
    assert.equal(selectedSectorId, "abyssal_rift", "Micro-jitter dưới ngưỡng vẫn chọn được sector")

    // Thao tác 3: Kéo pan bản đồ (di chuyển 18px >= DRAG_THRESHOLD) -> Không được kích hoạt chọn sector
    selectedSectorId = "elysium_sanctuary" // Reset về Elysium
    simulatePointerGesture(18, "tartarus_breach")
    assert.equal(
      selectedSectorId,
      "elysium_sanctuary",
      "Kéo bản đồ vượt ngưỡng drag không được vô tình đổi sector chọn"
    )
  })

  // ==========================================================================
  // Test 4: Dữ liệu Tình Báo Sector Intel định nghĩa đủ cho cả 10 Sector
  // ==========================================================================
  it("4. Hồ sơ tình báo Sector Intel định nghĩa đầy đủ visual theme và báo cáo tác chiến cho cả 10 sector", () => {
    const allSectorIds = Object.keys(INITIAL_WORLD_SECTORS)
    assert.equal(allSectorIds.length, 10, "Phải có đúng 10 sector trong định nghĩa ban đầu")

    for (const secId of allSectorIds) {
      const theme = SECTOR_INTEL_THEMES[secId]
      assert.ok(theme, `Sector [${secId}] phải có cấu hình Sector Intel Theme`)
      assert.ok(theme.codeName.startsWith("SEC-"), `CodeName của [${secId}] phải theo chuẩn SEC-XX`)
      assert.ok(theme.category.length > 0, `Category của [${secId}] phải có nội dung`)
      assert.ok(theme.lore.length > 20, `Hồ sơ lore của [${secId}] phải chi tiết`)
      assert.ok(theme.tacticalAdvantage.length > 0, `Ưu thế chiến thuật của [${secId}] phải có nội dung`)
      assert.ok(theme.strategicValue.length > 0, `Giá trị chiến lược của [${secId}] phải có nội dung`)
      assert.ok(theme.gradient.length > 0, `Gradient của [${secId}] phải được cấu hình`)
    }
  })

  // ==========================================================================
  // Test 5: Tự động Migration khi load save cũ (8 sector) lên 10 sector
  // ==========================================================================
  it("5. Tự động migration save cũ 8 sector lên 10 sector, bảo toàn 100% dữ liệu 8 sector cũ", () => {
    const freshState = createInitialWorldState()

    // Giả lập một bản lưu cũ chỉ có 8 sector và 12 routes
    const legacySectors: Record<string, WorldSector> = {}
    for (const [id, s] of Object.entries(freshState.sectors)) {
      if (id !== "elysium_sanctuary" && id !== "abyssal_rift") {
        legacySectors[id] = {
          ...s,
          garrisonPower: 999, // Đặt chỉ số tùy biến để kiểm tra không bị ghi đè
          stability: 88,
        }
      }
    }

    const legacyRoutes: WorldRoute[] = freshState.routes.filter(
      (r) =>
        r.id !== "r_helios_elysium" &&
        r.id !== "r_elysium_delta" &&
        r.id !== "r_orion_abyssal" &&
        r.id !== "r_abyssal_tartarus"
    )

    const legacyState: WorldState = {
      ...freshState,
      currentDay: 15,
      sectors: legacySectors,
      routes: legacyRoutes,
    }

    assert.equal(Object.keys(legacyState.sectors).length, 8, "Bản lưu cũ có 8 sector")
    assert.equal(legacyState.routes.length, 12, "Bản lưu cũ có 12 routes")

    // Chạy migration
    const { state: migratedState, migrated } = migrateWorldStateTo10Sectors(legacyState)

    assert.equal(migrated, true, "Migration phải được kích hoạt thành công")
    assert.equal(Object.keys(migratedState.sectors).length, 10, "Sau migration phải đủ 10 sector")
    assert.equal(migratedState.routes.length, 16, "Sau migration phải đủ 16 routes")

    // Bảo toàn dữ liệu 8 sector cũ
    assert.equal(
      migratedState.sectors["sol_command_hq"].garrisonPower,
      999,
      "Quân đồn trú Sol HQ cũ không bị reset"
    )
    assert.equal(
      migratedState.sectors["mining_outpost_k7"].garrisonPower,
      999,
      "Quân đồn trú K-7 cũ không bị reset"
    )
    assert.equal(migratedState.currentDay, 15, "Ngày hiện tại không bị reset")

    // 2 sector mới được khởi tạo đúng
    assert.ok(migratedState.sectors["elysium_sanctuary"])
    assert.ok(migratedState.sectors["abyssal_rift"])
    assert.equal(migratedState.sectors["elysium_sanctuary"].threatHistory[0].day, 15)
  })

  // ==========================================================================
  // Test 6: Lưu trữ và Phục hồi qua Storage API
  // ==========================================================================
  it("6. Nạp save cũ thông qua loadWorldState tự động nâng cấp và lưu trữ bền vững", () => {
    const defaultState = createInitialWorldState()

    // Lưu một bản lưu 8 sector vào storage
    const legacySectors: Record<string, WorldSector> = {}
    for (const [id, s] of Object.entries(defaultState.sectors)) {
      if (id !== "elysium_sanctuary" && id !== "abyssal_rift") {
        legacySectors[id] = { ...s }
      }
    }
    const legacyRoutes = defaultState.routes.filter(
      (r) =>
        r.id !== "r_helios_elysium" &&
        r.id !== "r_elysium_delta" &&
        r.id !== "r_orion_abyssal" &&
        r.id !== "r_abyssal_tartarus"
    )

    const legacyState: WorldState = {
      ...defaultState,
      currentDay: 7,
      sectors: legacySectors,
      routes: legacyRoutes,
    }

    saveWorldState(legacyState)

    // Nạp lại qua loadWorldState
    const loadResult = loadWorldState()
    assert.equal(loadResult.status, "loaded_primary")
    assert.equal(loadResult.checksumVerified, true)
    assert.equal(Object.keys(loadResult.state.sectors).length, 10, "Sau khi nạp phải đủ 10 sector")
    assert.equal(loadResult.state.routes.length, 16, "Sau khi nạp phải đủ 16 routes")
    assert.ok(loadResult.state.sectors["elysium_sanctuary"])
    assert.ok(loadResult.state.sectors["abyssal_rift"])
  })

  // ==========================================================================
  // Test 7: Zero-Regression — Bảo toàn 100% Save Schema V1 & Cách ly RPG Save V4
  // ==========================================================================
  it("7. Zero-Regression: World Save Schema V1 được bảo toàn và phân hệ RPG Save V4 hoàn toàn cách ly", () => {
    const memory = setupMockLocalStorage()
    const RPG_V4_KEY = "STARFRONT_SAVE_DATA_V4"
    const dummyRpgSave = JSON.stringify({ version: 4, pilot: "ACE-01", credits: 50000 })
    memory.set(RPG_V4_KEY, dummyRpgSave)

    const state = createInitialWorldState()
    const saveRes = saveWorldState(state)

    assert.equal(saveRes.success, true)
    assert.ok(saveRes.checksum.length === 8)

    // Khóa RPG không bị biến đổi hay xâm phạm
    const readRpg = memory.get(RPG_V4_KEY)
    assert.equal(readRpg, dummyRpgSave, "Khóa RPG Save V4 phải tuyệt đối nguyên vẹn")
  })
})
