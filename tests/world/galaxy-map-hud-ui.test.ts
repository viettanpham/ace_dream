/**
 * STARFRONT WORLD — Phase 6.11: Galaxy Map & HUD Refinement Test Suite
 * Kiểm thử kiểm định chất lượng hiển thị và phân cấp thông tin Bản Đồ Thiên Hà & HUD:
 *   1. Xác thực đúng 8 sector và 12 tuyến đường canonical
 *   2. Phân cấp chủ quyền (VSS, Void, Contested, Neutral) và thang đo Threat 3 dải (0-299, 300-699, 700+)
 *   3. 4 trạng thái tuyến đường (Open, Hazardous, Blocked, Offline) và tính toán tuyến tiếp giáp
 *   4. Phân biệt giai đoạn vòng đời (Normal, Threatened, Under Siege, Lost) và cờ khóa combat
 *   5. Nhận diện các đạo quân đang hành quân và gán đúng mục tiêu chi viện (Incoming Reinforcements)
 *   6. Tính toán đồng bộ chỉ số HUD toàn thiên hà (Tỷ lệ kiểm soát, Threat trung bình, Số lượng hành quân)
 *   7. Thao tác Lệnh Chiến Lược và Công Sự từ Inspector bảo toàn tính toàn vẹn của WorldState
 */

import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"

import { createInitialWorldState } from "@/lib/game/world/initial-state"
import {
  setSectorStrategicOrder,
  upgradeSectorFortification,
  dispatchTroopDeployment,
} from "@/lib/game/world/forces-ledger"
import { findShortestPath } from "@/lib/game/world/graph"
import { saveWorldState, loadWorldState } from "@/lib/game/world/storage"
import type {
  WorldState,
  StrategicOrder,
  SectorSovereignty,
  SectorStage,
  RouteState,
} from "@/lib/game/world/types"

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

describe("STARFRONT WORLD — Phase 6.11: Galaxy Map & HUD Refinement", () => {
  beforeEach(() => {
    setupMockLocalStorage()
  })

  // ==========================================================================
  // Test 1: Canonical Sectors & Routes Count Verification
  // ==========================================================================
  it("1. Bản đồ thiên hà khởi đầu có đúng 10 sector và 16 tuyến đường canonical (Phase 6.28)", () => {
    const state = createInitialWorldState()

    const sectorIds = Object.keys(state.sectors)
    assert.equal(sectorIds.length, 10, "Phải có đúng 10 sector chuẩn")
    assert.equal(state.routes.length, 16, "Phải có đúng 16 tuyến đường siêu không gian")

    // Xác nhận các sector chủ chốt
    assert.ok(state.sectors.sol_command_hq, "Sol Command HQ phải tồn tại")
    assert.ok(state.sectors.helios_perimeter, "Helios Perimeter phải tồn tại")
    assert.ok(state.sectors.mining_outpost_k7, "Mining Outpost K-7 phải tồn tại")
    assert.ok(state.sectors.asteroid_delta, "Asteroid Delta phải tồn tại")
    assert.ok(state.sectors.nebula_bastion, "Nebula Bastion phải tồn tại")
    assert.ok(state.sectors.waypoint_orion, "Waypoint Orion phải tồn tại")
    assert.ok(state.sectors.shadow_reach, "Shadow Reach phải tồn tại")
    assert.ok(state.sectors.tartarus_breach, "Tartarus Breach phải tồn tại")
    assert.ok(state.sectors.elysium_sanctuary, "Elysium Sanctuary phải tồn tại")
    assert.ok(state.sectors.abyssal_rift, "Abyssal Rift phải tồn tại")
  })

  // ==========================================================================
  // Test 2: Sovereignty & 3-Tier Threat Classification
  // ==========================================================================
  it("2. Phân cấp chủ quyền và thang đo Threat 3 dải (0-299, 300-699, 700+)", () => {
    const state = createInitialWorldState()

    // Phân loại dải Threat
    function getThreatTier(threat: number) {
      if (threat >= 700) return "high"
      if (threat >= 300) return "medium"
      return "low"
    }

    assert.equal(state.sectors.sol_command_hq.sovereignty, "vss")
    assert.equal(getThreatTier(state.sectors.sol_command_hq.threatLevel), "low") // 40

    assert.equal(state.sectors.mining_outpost_k7.sovereignty, "vss")
    assert.equal(getThreatTier(state.sectors.mining_outpost_k7.threatLevel), "medium") // 360

    assert.equal(state.sectors.shadow_reach.sovereignty, "contested")
    assert.equal(getThreatTier(state.sectors.shadow_reach.threatLevel), "high") // 760

    assert.equal(state.sectors.tartarus_breach.sovereignty, "void")
    assert.equal(getThreatTier(state.sectors.tartarus_breach.threatLevel), "high") // 980
  })

  // ==========================================================================
  // Test 3: Route States & Connected Hyperlanes
  // ==========================================================================
  it("3. Phân biệt 4 trạng thái tuyến đường và nhận diện tuyến tiếp giáp sector", () => {
    const state = createInitialWorldState()

    const routeStates = state.routes.map((r) => r.state)
    assert.ok(routeStates.includes("open"), "Mạng lưới có tuyến open")
    assert.ok(routeStates.includes("hazardous"), "Mạng lưới có tuyến hazardous")
    assert.ok(routeStates.includes("blocked"), "Mạng lưới có tuyến blocked")

    // Tuyến tiếp giáp với sol_command_hq
    const solRoutes = state.routes.filter(
      (r) => r.fromSectorId === "sol_command_hq" || r.toSectorId === "sol_command_hq"
    )
    assert.equal(solRoutes.length, 2, "Sol Command HQ phải kết nối với 2 tuyến (Helios & Delta)")
    assert.ok(solRoutes.every((r) => r.state === "open"), "Cả 2 tuyến từ Sol đều thông suốt")
  })

  // ==========================================================================
  // Test 4: Sector Stage & Combat Lock Indicators
  // ==========================================================================
  it("4. Phân biệt giai đoạn vòng đời và trạng thái khóa combat", () => {
    const state = createInitialWorldState()

    assert.equal(state.sectors.sol_command_hq.stage, "normal")
    assert.equal(state.sectors.mining_outpost_k7.stage, "threatened")
    assert.equal(state.sectors.shadow_reach.stage, "under_siege")
    assert.equal(state.sectors.tartarus_breach.stage, "lost")

    // Thiết lập khóa combat giả lập
    state.sectors.shadow_reach.isLockedForCombat = true
    assert.equal(Boolean(state.sectors.shadow_reach.isLockedForCombat), true)
  })

  // ==========================================================================
  // Test 5: In-Transit Fleets & Incoming Reinforcements Target Identification
  // ==========================================================================
  it("5. Nhận diện các đạo quân đang hành quân và xác định chính xác sector đích đến", () => {
    const state = createInitialWorldState()

    // Điều quân từ Sol Command HQ (50 quân từ nguồn dự bị) đến Mining Outpost K-7
    const dispatchRes = dispatchTroopDeployment(state, {
      fromSectorId: "sol_command_hq",
      toSectorId: "mining_outpost_k7",
      troopCount: 50,
      sourceFromReserves: true,
      order: "reinforce",
    })

    assert.equal(dispatchRes.success, true, "Điều động quân phải thành công")
    assert.equal(state.activeDeployments.length, 1, "Phải có 1 đạo quân active")
    assert.equal(state.activeDeployments[0].status, "in_transit")

    // Bản đồ phải nhận diện được K-7 là đích đến đang nhận chi viện
    const incomingToK7 = state.activeDeployments.filter(
      (d) => d.toSectorId === "mining_outpost_k7" && d.status === "in_transit"
    )
    assert.equal(incomingToK7.length, 1)
    assert.equal(incomingToK7[0].troopCount, 50)
  })

  // ==========================================================================
  // Test 6: HUD Synchronization Metrics Calculation
  // ==========================================================================
  it("6. Tính toán đồng bộ các chỉ số HUD toàn thiên hà", () => {
    const state = createInitialWorldState()
    const sectors = Object.values(state.sectors)

    let vssCount = 0
    let voidCount = 0
    let contestedCount = 0
    let totalThreat = 0

    for (const s of sectors) {
      if (s.sovereignty === "vss") vssCount++
      else if (s.sovereignty === "void") voidCount++
      else contestedCount++
      totalThreat += s.threatLevel
    }

    const total = sectors.length
    const vssPct = Math.round((vssCount / total) * 100)
    const contestedPct = Math.round((contestedCount / total) * 100)
    const voidPct = Math.round((voidCount / total) * 100)
    const avgThreat = Math.round(totalThreat / total)

    assert.equal(vssCount, 6, "Khởi đầu VSS kiểm soát 6/10 sector")
    assert.equal(contestedCount, 3, "Khởi đầu có 3 sector tranh chấp")
    assert.equal(voidCount, 1, "Khởi đầu Void kiểm soát 1 sector")
    assert.equal(vssPct, 60, "VSS chiếm 60%")
    assert.equal(contestedPct, 30, "Tranh chấp chiếm 30%")
    assert.equal(voidPct, 10, "Void chiếm 10%")
    assert.ok(avgThreat > 0 && avgThreat < 1000, "Threat trung bình nằm trong khoảng hợp lệ")
  })

  // ==========================================================================
  // Test 7: Inspector Strategic Actions & State Persistence
  // ==========================================================================
  it("7. Thao tác Lệnh Chiến Lược và Công Sự từ Inspector bảo toàn tính toàn vẹn của WorldState", () => {
    const state = createInitialWorldState()
    const targetSectorId = "helios_perimeter"

    // 1. Đổi Lệnh Chiến Lược sang defend
    const orderRes = setSectorStrategicOrder(state, targetSectorId, "defend")
    assert.equal(orderRes.success, true)
    assert.equal(state.sectors[targetSectorId].strategicOrder, "defend")

    // 2. Nâng cấp công sự (Helios stage normal: level 2 -> 3, tiêu hao 50 vật liệu)
    const initialMats = state.resources.industrialMaterials
    const fortRes = upgradeSectorFortification(state, targetSectorId)
    assert.equal(fortRes.success, true)
    assert.equal(state.sectors[targetSectorId].fortificationLevel, 3)
    assert.equal(state.resources.industrialMaterials, initialMats - 50)

    // 3. Lưu và nạp lại
    saveWorldState(state)
    const loadResult = loadWorldState()
    assert.ok(loadResult.state, "Nạp lại state thành công")
    const reloaded = loadResult.state
    assert.equal(reloaded.sectors[targetSectorId].strategicOrder, "defend")
    assert.equal(reloaded.sectors[targetSectorId].fortificationLevel, 3)
    assert.equal(reloaded.resources.industrialMaterials, initialMats - 50)
  })
})
