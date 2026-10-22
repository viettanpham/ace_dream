import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"

import {
  canTransitionStage,
  completeRecovery,
  conquerSector,
  evaluateSectorStage,
  getSectorStageEfficiency,
  liberateLostSector,
  setSectorThreat,
  THREAT_THRESHOLDS,
  transitionSectorStage,
  VALID_STAGE_TRANSITIONS,
} from "../../lib/game/world/sector-lifecycle"
import {
  findConnectingRoute,
  findShortestPath,
  getAdjacentSectors,
  getAvailableRoutes,
  getConnectedComponents,
  getPathMetrics,
  getReachableSectors,
  isNetworkConnected,
  isPathTraversable,
  isRouteTraversable,
  setRouteStateBetween,
  updateRouteState,
} from "../../lib/game/world/graph"
import {
  getInitialRouteById,
  getInitialRoutesList,
  getInitialSectorById,
  getInitialSectorsList,
  INITIAL_WORLD_ROUTES,
  INITIAL_WORLD_SECTORS,
} from "../../lib/game/world/initial-map"
import { createInitialWorldState } from "../../lib/game/world/initial-state"
import { loadWorldState, saveWorldState, resetWorldState, WORLD_STORAGE_KEY_V1 } from "../../lib/game/world/storage"
import { STORAGE_KEY_V4 } from "../../lib/game/storage"
import type { RouteState, SectorStage, WorldRoute, WorldSector, WorldState } from "../../lib/game/world/types"

// Mock in-memory LocalStorage
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

describe("Phase 6.2 — World Map Graph Network & Sector State Machine", () => {
  beforeEach(() => {
    setupMockLocalStorage()
  })

  describe("A. World Map Graph & Route Network", () => {
    it("1. Khởi tạo đồ thị chuẩn xác từ 10 sectors và 16 routes khởi đầu (Phase 6.28)", () => {
      const sectors = getInitialSectorsList()
      const routes = getInitialRoutesList()

      assert.equal(sectors.length, 10, "Phải có đúng 10 sector mẫu")
      assert.equal(routes.length, 16, "Phải có đúng 16 tuyến siêu không gian")

      // Kiểm tra sector cốt lõi
      const sol = getInitialSectorById("sol_command_hq")
      assert.ok(sol, "Sol Command HQ phải tồn tại")
      assert.equal(sol.sovereignty, "vss")
      assert.equal(sol.stage, "normal")

      const tartarus = getInitialSectorById("tartarus_breach")
      assert.ok(tartarus, "Tartarus Breach phải tồn tại")
      assert.equal(tartarus.sovereignty, "void")
      assert.equal(tartarus.stage, "lost")

      // Kiểm tra route cốt lõi
      const rSolHelios = getInitialRouteById("r_sol_helios")
      assert.ok(rSolHelios)
      assert.equal(rSolHelios.fromSectorId, "sol_command_hq")
      assert.equal(rSolHelios.toSectorId, "helios_perimeter")
      assert.equal(rSolHelios.distance, 1)
      assert.equal(rSolHelios.state, "open")
    })

    it("2. Truy vấn kết nối lân cận (getAdjacentSectors) hai chiều chính xác", () => {
      const routes = getInitialRoutesList()

      // Sol Command HQ nối với Helios (r_sol_helios) và Asteroid Delta (r_sol_delta)
      const solNeighbors = getAdjacentSectors(routes, "sol_command_hq")
      assert.equal(solNeighbors.length, 2)
      const neighborIds = solNeighbors.map((n) => n.sectorId)
      assert.ok(neighborIds.includes("helios_perimeter"))
      assert.ok(neighborIds.includes("asteroid_delta"))

      // Ngược lại, Helios cũng phải nhận biết Sol Command HQ là đỉnh kề
      const heliosNeighbors = getAdjacentSectors(routes, "helios_perimeter")
      const heliosNeighborIds = heliosNeighbors.map((n) => n.sectorId)
      assert.ok(heliosNeighborIds.includes("sol_command_hq"))
      assert.ok(heliosNeighborIds.includes("mining_outpost_k7"))
      assert.ok(heliosNeighborIds.includes("asteroid_delta"))
    })

    it("3. Tìm tuyến kết nối trực tiếp (findConnectingRoute) bất kể thứ tự đỉnh", () => {
      const routes = getInitialRoutesList()

      const forward = findConnectingRoute(routes, "sol_command_hq", "helios_perimeter")
      const backward = findConnectingRoute(routes, "helios_perimeter", "sol_command_hq")

      assert.ok(forward)
      assert.ok(backward)
      assert.equal(forward.id, backward.id)
      assert.equal(forward.id, "r_sol_helios")

      // Hai sector không có cạnh nối trực tiếp
      const nonAdjacent = findConnectingRoute(routes, "sol_command_hq", "tartarus_breach")
      assert.equal(nonAdjacent, undefined)
    })

    it("4. Dijkstra tìm đường đi ngắn nhất (findShortestPath) và tính toán khoảng cách chuẩn xác", () => {
      const sectors = INITIAL_WORLD_SECTORS
      const routes = getInitialRoutesList()

      // Sol Command -> Nebula Bastion
      // Tuyến 1: Sol -> Delta (dist 2) -> Nebula (dist 2) = tổng 4
      // Tuyến 2: Sol -> Helios (dist 1) -> Delta (dist 1) -> Nebula (dist 2) = tổng 4
      // Tuyến 3: Sol -> Helios (dist 1) -> K7 (dist 1) -> Nebula (dist 2) = tổng 4
      const result = findShortestPath(sectors, routes, "sol_command_hq", "nebula_bastion")
      assert.ok(result)
      assert.equal(result.traversable, true)
      assert.equal(result.totalDistance, 4)
      assert.ok(result.path.length >= 3)
      assert.equal(result.path[0], "sol_command_hq")
      assert.equal(result.path[result.path.length - 1], "nebula_bastion")

      // Sol Command -> Sol Command (khoảng cách 0)
      const sameResult = findShortestPath(sectors, routes, "sol_command_hq", "sol_command_hq")
      assert.ok(sameResult)
      assert.equal(sameResult.totalDistance, 0)
      assert.deepEqual(sameResult.path, ["sol_command_hq"])
    })

    it("5. Xử lý chính xác các trạng thái tuyến đường (Open, Hazardous, Blocked, Offline)", () => {
      const routes = getInitialRoutesList()

      const openRoute = routes.find((r) => r.state === "open")!
      const hazardousRoute = routes.find((r) => r.state === "hazardous")!
      const blockedRoute = routes.find((r) => r.state === "blocked")!

      // Mặc định: Open & Hazardous lưu thông được; Blocked không lưu thông
      assert.equal(isRouteTraversable(openRoute), true)
      assert.equal(isRouteTraversable(hazardousRoute), true)
      assert.equal(isRouteTraversable(blockedRoute), false)

      // Khi cấm Hazardous
      assert.equal(isRouteTraversable(hazardousRoute, { allowHazardous: false }), false)

      // Tuyến Offline
      const offlineRoute: WorldRoute = { ...openRoute, state: "offline" }
      assert.equal(isRouteTraversable(offlineRoute), false)
      assert.equal(isRouteTraversable(offlineRoute, { allowOffline: true }), true)
    })

    it("6. Thuật toán định tuyến từ chối đi qua tuyến Blocked hoặc Offline", () => {
      const sectors = INITIAL_WORLD_SECTORS
      const routes = getInitialRoutesList()

      // Tartarus Breach bị chặn bởi 2 tuyến blocked: r_orion_tartarus và r_shadow_tartarus
      // Mặc định không thể đi tới Tartarus Breach nếu không cho phép blocked
      const pathBlocked = findShortestPath(sectors, routes, "sol_command_hq", "tartarus_breach")
      assert.equal(pathBlocked, null, "Không được tìm thấy đường nếu toàn bộ lối vào bị Blocked")

      // Nếu cho phép đi qua tuyến Blocked (ví dụ: hạm đội mở phong tỏa)
      const pathWithBlocked = findShortestPath(
        sectors,
        routes,
        "sol_command_hq",
        "tartarus_breach",
        { allowBlocked: true }
      )
      assert.ok(pathWithBlocked, "Tìm thấy đường khi cho phép đi qua Blocked")
      assert.equal(pathWithBlocked.path[pathWithBlocked.path.length - 1], "tartarus_breach")
    })

    it("7. Chế độ định tuyến an toàn (avoidHazardous) ưu tiên đi vòng để tránh nguy hiểm", () => {
      const sectors = INITIAL_WORLD_SECTORS
      let routes = getInitialRoutesList()

      // Tình huống: Có 2 đường đi từ Sol tới Waypoint Orion
      // Đường 1: Sol -> Delta -> Orion (dist 2 + 2 = 4, nhưng Delta -> Orion là HAZARDOUS)
      // Đường 2: Sol -> Helios -> Delta -> Nebula -> Orion (toàn tuyến open)
      // Nếu avoidHazardous = true: thuật toán phải tránh Delta -> Orion
      const shortest = findShortestPath(sectors, routes, "sol_command_hq", "waypoint_orion", {
        mode: "shortest",
      })
      assert.ok(shortest)

      const safe = findShortestPath(sectors, routes, "sol_command_hq", "waypoint_orion", {
        avoidHazardous: true,
      })
      assert.ok(safe)
      // Kiểm tra trong safe path không chứa bất kỳ cạnh nào hazardous
      for (const r of safe.routes) {
        assert.notEqual(r.state, "hazardous", `Tuyến ${r.id} không được là hazardous trong safe mode`)
      }
    })

    it("8. Cập nhật trạng thái tuyến đường (updateRouteState) phản ánh tức thì lên kết quả tìm đường", () => {
      const sectors = INITIAL_WORLD_SECTORS
      let routes = getInitialRoutesList()

      // Khóa tuyến nối Helios -> K-7
      routes = setRouteStateBetween(routes, "helios_perimeter", "mining_outpost_k7", "offline")
      const blockedDirect = findConnectingRoute(routes, "helios_perimeter", "mining_outpost_k7")
      assert.ok(blockedDirect)
      assert.equal(blockedDirect.state, "offline")

      // Lúc này từ Helios sang K-7 phải đi vòng qua Nebula Bastion
      const rerouted = findShortestPath(sectors, routes, "helios_perimeter", "mining_outpost_k7")
      assert.ok(rerouted)
      // Đường đi mới phải đi vòng qua Delta và Nebula
      assert.ok(rerouted.path.includes("nebula_bastion"))
      assert.ok(rerouted.totalDistance > 1)
    })

    it("9. Phân tích tính liên thông mạng lưới (isNetworkConnected & getConnectedComponents)", () => {
      const sectors = INITIAL_WORLD_SECTORS
      const routes = getInitialRoutesList()

      // Mặc định mạng lưới 8 sector có Tartarus bị cô lập do 2 tuyến vào đều bị Blocked
      const connectedDefault = isNetworkConnected(sectors, routes)
      assert.equal(connectedDefault, false)

      const components = getConnectedComponents(sectors, routes)
      assert.equal(components.length, 2, "Có 2 cụm liên thông (7 sector chính và 1 cụm Tartarus bị cô lập)")

      // Mạng lưới 7 sector chính (bỏ Tartarus) hoàn toàn liên thông
      const mainSectors = Object.keys(sectors).filter((id) => id !== "tartarus_breach")
      const mainConnected = isNetworkConnected(mainSectors, routes)
      assert.equal(mainConnected, true)
    })
  })

  describe("B. Sector State Machine (Máy Trạng Thái 5 Giai Đoạn)", () => {
    it("1. Định nghĩa chuẩn xác bảng quy tắc chuyển đổi hợp lệ 5 giai đoạn", () => {
      assert.deepEqual(VALID_STAGE_TRANSITIONS.normal, ["threatened"])
      assert.deepEqual(VALID_STAGE_TRANSITIONS.threatened, ["normal", "under_siege"])
      assert.deepEqual(VALID_STAGE_TRANSITIONS.under_siege, ["threatened", "lost", "normal"])
      assert.deepEqual(VALID_STAGE_TRANSITIONS.lost, ["recovery"])
      assert.deepEqual(VALID_STAGE_TRANSITIONS.recovery, ["normal", "threatened", "under_siege"])
    })

    it("2. Chuyển đổi hợp lệ theo chuỗi tuần tự: Normal -> Threatened -> Under Siege -> Lost -> Recovery -> Normal", () => {
      let sector: WorldSector = { ...INITIAL_WORLD_SECTORS.sol_command_hq }

      // 1. Normal -> Threatened
      let res = transitionSectorStage(sector, "threatened", { reason: "Thám báo xuất hiện" })
      assert.equal(res.success, true)
      assert.equal(res.newStage, "threatened")
      sector = res.sector

      // 2. Threatened -> Under Siege
      res = transitionSectorStage(sector, "under_siege", { reason: "Hạm đội chủ lực bao vây" })
      assert.equal(res.success, true)
      assert.equal(res.newStage, "under_siege")
      assert.ok(res.sector.lastSiegeDay !== undefined)
      sector = res.sector

      // 3. Under Siege -> Lost
      res = transitionSectorStage(sector, "lost", {
        reason: "Phòng tuyến thất thủ",
        defenseFailed: true,
      })
      assert.equal(res.success, true)
      assert.equal(res.newStage, "lost")
      sector = res.sector

      // 4. Lost -> Recovery
      res = transitionSectorStage(sector, "recovery", {
        reason: "Giải phóng thành công",
        liberated: true,
      })
      assert.equal(res.success, true)
      assert.equal(res.newStage, "recovery")
      sector = res.sector

      // 5. Recovery -> Normal
      res = transitionSectorStage(sector, "normal", {
        reason: "Hoàn tất tái thiết",
        recoveryComplete: true,
      })
      assert.equal(res.success, true)
      assert.equal(res.newStage, "normal")
    })

    it("3. Từ chối các chuyển đổi bất hợp lệ và bảo toàn trạng thái nguyên vẹn", () => {
      const normalSector: WorldSector = { ...INITIAL_WORLD_SECTORS.sol_command_hq }

      // Normal -> Lost: Bất hợp lệ (Không thể thất thủ nếu chưa từng bị vây hãm)
      const resNormalToLost = transitionSectorStage(normalSector, "lost")
      assert.equal(resNormalToLost.success, false)
      assert.equal(resNormalToLost.newStage, "normal")
      assert.ok(resNormalToLost.error?.includes("bất hợp lệ"))

      // Normal -> Recovery: Bất hợp lệ (Recovery chỉ dành cho sector vừa giải phóng)
      const resNormalToRecovery = transitionSectorStage(normalSector, "recovery")
      assert.equal(resNormalToRecovery.success, false)

      // Lost -> Normal: Bất hợp lệ (Không được nhảy cóc qua giai đoạn tái thiết Recovery)
      const lostSector: WorldSector = { ...INITIAL_WORLD_SECTORS.tartarus_breach }
      const resLostToNormal = transitionSectorStage(lostSector, "normal")
      assert.equal(resLostToNormal.success, false)

      // Lost -> Threatened: Bất hợp lệ
      const resLostToThreatened = transitionSectorStage(lostSector, "threatened")
      assert.equal(resLostToThreatened.success, false)

      // Recovery -> Lost: Bất hợp lệ (Phải bị tấn công/Under Siege trước khi mất)
      const recoverySector: WorldSector = {
        ...INITIAL_WORLD_SECTORS.helios_perimeter,
        stage: "recovery",
      }
      const resRecoveryToLost = transitionSectorStage(recoverySector, "lost")
      assert.equal(resRecoveryToLost.success, false)
    })

    it("4. Đánh giá tự động giai đoạn sector theo ngưỡng Threat level (evaluateSectorStage)", () => {
      let sector: WorldSector = { ...INITIAL_WORLD_SECTORS.sol_command_hq, threatLevel: 50, stage: "normal" }

      // Threat tăng lên 350 -> chuyển sang Threatened
      sector.threatLevel = 350
      let evalRes = evaluateSectorStage(sector)
      assert.equal(evalRes.newStage, "threatened")
      sector = evalRes.sector

      // Threat tăng lên 750 -> chuyển sang Under Siege
      sector.threatLevel = 750
      evalRes = evaluateSectorStage(sector)
      assert.equal(evalRes.newStage, "under_siege")
      sector = evalRes.sector

      // Siege được giải tỏa, Threat giảm về 400 -> lùi về Threatened
      sector.threatLevel = 400
      evalRes = evaluateSectorStage(sector)
      assert.equal(evalRes.newStage, "threatened")
      sector = evalRes.sector

      // Threat giảm về 100 -> trở về Normal
      sector.threatLevel = 100
      evalRes = evaluateSectorStage(sector)
      assert.equal(evalRes.newStage, "normal")
    })

    it("5. Quy trình Giải phóng Sector (liberateLostSector) và Thất thủ (conquerSector)", () => {
      // 1. Thất thủ tại Shadow Reach (đang under_siege)
      const shadow = { ...INITIAL_WORLD_SECTORS.shadow_reach }
      const conquerRes = conquerSector(shadow, "void")
      assert.equal(conquerRes.success, true)
      assert.equal(conquerRes.newStage, "lost")
      assert.equal(conquerRes.sector.sovereignty, "void")

      // 2. Giải phóng Tartarus Breach
      const tartarus = { ...INITIAL_WORLD_SECTORS.tartarus_breach }
      assert.equal(tartarus.stage, "lost")
      const liberateRes = liberateLostSector(tartarus, "vss")
      assert.equal(liberateRes.success, true)
      assert.equal(liberateRes.newStage, "recovery")
      assert.equal(liberateRes.sector.sovereignty, "vss")

      // 3. Hoàn tất tái thiết sau giải phóng
      const completeRes = completeRecovery(liberateRes.sector)
      assert.equal(completeRes.success, true)
      assert.equal(completeRes.newStage, "normal")
      assert.equal(completeRes.sector.sovereignty, "vss")
    })

    it("6. Tách biệt hoàn toàn Stage, Sovereignty và Threat Level", () => {
      // Một Sector VSS có thể có Threat rất cao (850) và đang Under Siege nhưng chủ quyền vẫn là VSS
      const vssUnderSiege: WorldSector = {
        ...INITIAL_WORLD_SECTORS.nebula_bastion,
        sovereignty: "vss",
        threatLevel: 850,
        stage: "under_siege",
      }
      assert.equal(vssUnderSiege.sovereignty, "vss")
      assert.equal(vssUnderSiege.stage, "under_siege")
      assert.equal(vssUnderSiege.threatLevel, 850)

      // Một Sector Neutral có thể có Stage Normal và Threat 0
      const neutralSector: WorldSector = {
        ...INITIAL_WORLD_SECTORS.waypoint_orion,
        sovereignty: "neutral",
        stage: "normal",
        threatLevel: 0,
      }
      assert.equal(neutralSector.sovereignty, "neutral")
      assert.equal(neutralSector.stage, "normal")
      assert.equal(neutralSector.threatLevel, 0)
    })

    it("7. Hệ số hiệu suất sản xuất theo từng giai đoạn (getSectorStageEfficiency)", () => {
      assert.equal(getSectorStageEfficiency("normal"), 1.0)
      assert.equal(getSectorStageEfficiency("threatened"), 0.85)
      assert.equal(getSectorStageEfficiency("under_siege"), 0.4)
      assert.equal(getSectorStageEfficiency("recovery"), 0.5)
      assert.equal(getSectorStageEfficiency("lost"), 0.0)
    })

    it("8. Giới hạn giá trị Threat level an toàn trong khoảng [0..1000]", () => {
      const base = { ...INITIAL_WORLD_SECTORS.sol_command_hq }
      const { sector: overflowSector } = setSectorThreat(base, 9999)
      assert.equal(overflowSector.threatLevel, 1000)

      const { sector: underflowSector } = setSectorThreat(base, -500)
      assert.equal(underflowSector.threatLevel, 0)
    })
  })

  describe("C. Tích Hợp Lưu Trữ & Tính Bền Vững (Storage Integration & Save Isolation)", () => {
    it("1. Lưu và nạp lại chính xác trạng thái Sector và Tuyến đường qua World Storage", () => {
      const state = createInitialWorldState(101)

      // Cập nhật trạng thái một số sector và route
      const updatedSectors = { ...state.sectors }
      const resStage = transitionSectorStage(updatedSectors.helios_perimeter, "threatened")
      updatedSectors.helios_perimeter = resStage.sector

      const updatedRoutes = updateRouteState(state.routes, "r_sol_helios", "hazardous", 45)

      const modifiedState: WorldState = {
        ...state,
        sectors: updatedSectors,
        routes: updatedRoutes,
      }

      // Lưu vào World Storage (Phase 6.1)
      const saveRes = saveWorldState(modifiedState)
      assert.equal(saveRes.success, true)

      // Nạp lại
      const loadRes = loadWorldState()
      assert.equal(loadRes.status, "loaded_primary")
      assert.equal(loadRes.state.worldSeed, 101)

      // Kiểm tra trạng thái sector nạp lại
      const reloadedHelios = loadRes.state.sectors.helios_perimeter
      assert.equal(reloadedHelios.stage, "threatened")

      // Kiểm tra trạng thái route nạp lại
      const reloadedRoute = loadRes.state.routes.find((r) => r.id === "r_sol_helios")
      assert.ok(reloadedRoute)
      assert.equal(reloadedRoute.state, "hazardous")
      assert.equal(reloadedRoute.dangerLevel, 45)
    })

    it("2. Mọi thao tác của Graph & Sector State Machine tuyệt đối không chạm vào STARFRONT_SAVE_DATA_V4", () => {
      const mockStorage = (globalThis as any).localStorage
      const rpgOriginal = JSON.stringify({ commander: "Commander Shepard", credits: 99999 })
      mockStorage.setItem(STORAGE_KEY_V4, rpgOriginal)

      // Thực hiện hàng loạt thao tác World State
      const state = createInitialWorldState(777)
      saveWorldState(state)
      loadWorldState()

      // Khẳng định lưu trữ RPG v4 nguyên vẹn
      assert.equal(mockStorage.getItem(STORAGE_KEY_V4), rpgOriginal)
    })
  })
})
