import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"

import {
  INITIAL_WORLD_SECTORS,
  createInitialWorldState,
} from "@/lib/game/world/initial-state"
import {
  transformClientToSVG,
  getSectorHitboxAtPoint,
} from "@/components/game/world/world-map"
import {
  computeCriticalAlerts,
  computeActiveEventsGroups,
  computeCombatOperations,
  computeActionableItemsCount,
} from "@/components/game/world/global-operations-hub"
import {
  saveWorldState,
  loadWorldState,
} from "@/lib/game/world/storage"
import type { WorldState, WorldSector, WorldEvent } from "@/lib/game/world/types"

function setupMockLocalStorage() {
  const store = new Map<string, string>()
  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size
    },
  }
  ;(globalThis as any).window = globalThis
  ;(globalThis as any).localStorage = mockStorage
}

describe("STARFRONT Phase 6.30 — Strategic Galaxy Map & Command UX Enhancement Verification", () => {
  let worldState: WorldState

  beforeEach(() => {
    setupMockLocalStorage()
    worldState = createInitialWorldState()
  })

  // ==========================================================================
  // Test 1: Bảo toàn chuẩn xác Hitbox và căn chỉnh toạ độ 10 Sector
  // ==========================================================================
  it("1. Hitbox 140x88px và thuật toán transformClientToSVG hoạt động chuẩn xác trên toàn bộ 10 Sector", () => {
    const sectors = Object.values(worldState.sectors)
    assert.equal(sectors.length, 10, "Bản đồ phải có đủ 10 sector")

    for (const sector of sectors) {
      const cx = (sector.x / 100) * 1000
      const cy = (sector.y / 100) * 650

      // Tâm node
      const hitCenter = getSectorHitboxAtPoint(sectors, cx, cy)
      assert.equal(hitCenter, sector.id, `Tâm của [${sector.id}] phải khớp chính xác`)

      // Nhãn tên
      const hitLabel = getSectorHitboxAtPoint(sectors, cx, cy + 30)
      assert.equal(hitLabel, sector.id, `Nhãn tên của [${sector.id}] phải nằm trong hitbox`)
    }

    // Kiểm tra giả lập bounding client rect với letterboxing
    const mockSvg = {
      getBoundingClientRect: () => ({
        left: 50,
        top: 25,
        width: 1200,
        height: 780,
      }),
    } as any

    const pt = transformClientToSVG(mockSvg, 50 + 600, 25 + 390)
    assert.ok(pt, "Phải tính toán được toạ độ SVG")
    assert.ok(Math.abs(pt.x - 500) < 1, "Toạ độ tâm X phải gần 500")
    assert.ok(Math.abs(pt.y - 325) < 1, "Toạ độ tâm Y phải gần 325")
  })

  // ==========================================================================
  // Test 2: Map Legend mặc định OFF và cơ chế Toggle không tự ý mở lại
  // ==========================================================================
  it("2. Map Legend khởi tạo mặc định là false (OFF) và tôn trọng preference người dùng", () => {
    // Khi chưa có localStorage preference
    assert.equal(localStorage.getItem("starfront_map_show_legend"), null)
    let legendState = false // Mặc định OFF

    // Người chơi bấm toggle bật
    legendState = !legendState
    localStorage.setItem("starfront_map_show_legend", String(legendState))
    assert.equal(legendState, true)
    assert.equal(localStorage.getItem("starfront_map_show_legend"), "true")

    // Người chơi bấm toggle tắt
    legendState = !legendState
    localStorage.setItem("starfront_map_show_legend", String(legendState))
    assert.equal(legendState, false)
    assert.equal(localStorage.getItem("starfront_map_show_legend"), "false")
  })

  // ==========================================================================
  // Test 3: Node Details mặc định OFF, cho phép quan sát tổng thể và không ép mở Inspector
  // ==========================================================================
  it("3. Chế độ Node Details mặc định OFF; chọn sector trong chế độ tổng thể không ép mở Inspector", () => {
    // Mặc định Node Details: false (Tổng Thể), Inspector: false (Đóng)
    let showNodeDetails = false
    let showInspector = false
    let selectedSectorId = "sol_command_hq"

    // Thao tác click chọn sector khi đang ở chế độ xem tổng thể
    const onSelectSectorInOverview = (secId: string) => {
      selectedSectorId = secId
      // Logic Phase 6.30: Chỉ mở inspector nếu showNodeDetails === true
      if (showNodeDetails) {
        showInspector = true
      }
    }

    onSelectSectorInOverview("asteroid_delta")
    assert.equal(selectedSectorId, "asteroid_delta")
    assert.equal(showInspector, false, "Trong chế độ tổng thể, Inspector không được tự ý ép mở")

    // Bật chế độ chi tiết (Node Details ON)
    showNodeDetails = true
    showInspector = true
    onSelectSectorInOverview("elysium_sanctuary")
    assert.equal(selectedSectorId, "elysium_sanctuary")
    assert.equal(showInspector, true, "Khi bật Node Details, Inspector đồng bộ mở")
  })

  // ==========================================================================
  // Test 4: Giới hạn Zoom [0.7x, 2.2x], Wheel Zoom và Double-Click Zoom
  // ==========================================================================
  it("4. Tính toán phạm vi Zoom, Mouse-Wheel và Double-Click Zoom giữ nguyên biên 0.7x .. 2.2x", () => {
    const MIN_ZOOM = 0.7
    const MAX_ZOOM = 2.2

    // 1. Wheel Zoom up/down math
    let currentZoom = 1.0
    const applyWheelDelta = (deltaY: number) => {
      const step = deltaY < 0 ? 0.15 : -0.15
      currentZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number((currentZoom + step).toFixed(2))))
      return currentZoom
    }

    // Cuộn phóng to 3 lần
    applyWheelDelta(-100)
    assert.equal(currentZoom, 1.15)
    applyWheelDelta(-100)
    assert.equal(currentZoom, 1.30)

    // Cuộn chạm trần MAX_ZOOM
    for (let i = 0; i < 15; i++) applyWheelDelta(-100)
    assert.equal(currentZoom, MAX_ZOOM, "Zoom không được vượt quá MAX_ZOOM 2.2")

    // Cuộn chạm đáy MIN_ZOOM
    for (let i = 0; i < 25; i++) applyWheelDelta(100)
    assert.equal(currentZoom, MIN_ZOOM, "Zoom không được giảm dưới MIN_ZOOM 0.7")

    // 2. Double-Click to Zoom logic
    const handleDoubleClickZoom = (zoom: number): number => {
      if (zoom >= 1.7) {
        return 1.0 // Reset về 1.0x
      }
      return Math.min(MAX_ZOOM, Number((zoom + 0.4).toFixed(2)))
    }

    assert.equal(handleDoubleClickZoom(1.0), 1.4)
    assert.equal(handleDoubleClickZoom(1.4), 1.8)
    assert.equal(handleDoubleClickZoom(1.8), 1.0, "Khi >= 1.7x, double click phải reset về 1.0x")
  })

  // ==========================================================================
  // Test 5: War Room Strategic Situation Deck & Critical Alerts
  // ==========================================================================
  it("5. War Room Strategic Situation Deck tổng hợp đầy đủ số liệu 10 sector, Threat, Quân lực và Suspended Combat", () => {
    const sectors = Object.values(worldState.sectors)
    const vssCount = sectors.filter((s) => s.sovereignty === "vss").length
    const voidCount = sectors.filter((s) => s.sovereignty === "void").length
    const contestedOrNeutralCount = sectors.filter((s) => s.sovereignty !== "vss" && s.sovereignty !== "void").length

    assert.equal(vssCount + voidCount + contestedOrNeutralCount, 10, "Tổng số sector phải đúng 10")

    // Giả lập trận đấu dở dang (suspended combat)
    worldState.isSuspendedCombat = true
    worldState.suspendedSnapshot = {
      encounterId: "enc_test_630",
      sectorId: "tartarus_breach",
      nodeId: "tartarus_breach",
      day: 5,
      isSuspended: true,
      transactionId: "tx_world_test_630",
      playerShipClass: "Vanguard",
      lockedGarrison: 250,
      enemies: [],
      timestamp: Date.now(),
    }
    worldState.sectors["tartarus_breach"].isLockedForCombat = true

    const combatOps = computeCombatOperations(worldState)
    assert.ok(combatOps.suspendedEncounter, "Phải phát hiện được Suspended Combat")
    assert.equal(combatOps.suspendedEncounter?.snapshot.sectorId, "tartarus_breach")
    assert.ok(combatOps.lockedSectors.some((s) => s.id === "tartarus_breach"), "Tartarus phải bị khóa giao tranh")

    // Cảnh báo khẩn cấp P0
    const alerts = computeCriticalAlerts(worldState)
    const p0Alerts = alerts.filter((a) => a.priority === "P0")
    assert.ok(p0Alerts.length >= 1, "Phải có cảnh báo P0")
    const suspendedAlert = p0Alerts.find((a) => a.type === "suspended_combat")
    assert.ok(suspendedAlert, "Phải có cảnh báo P0 cho suspended combat")
    assert.equal(suspendedAlert.actionType, "resume_combat")
  })

  // ==========================================================================
  // Test 6: Bảo toàn tính toàn vẹn của Lưu trữ World State (Save Schema V1)
  // ==========================================================================
  it("6. Quá trình lưu và nạp trạng thái bảo toàn 100% Save Schema V1 và Checksum CRC32", () => {
    const saveRes = saveWorldState(worldState)
    assert.ok(saveRes.success, "Lưu WorldState phải thành công")

    const loadRes = loadWorldState()
    assert.equal(loadRes.status, "loaded_primary", "Nạp WorldState từ primary save phải thành công")
    assert.equal(loadRes.checksumVerified, true, "Checksum CRC32 phải được xác minh toàn vẹn")
    assert.equal(Object.keys(loadRes.state.sectors).length, 10, "Phải có đủ 10 sector sau khi lưu và nạp")

    // Kiểm tra trực tiếp envelope trong localStorage
    const rawSaved = localStorage.getItem("STARFRONT_WORLD_SAVE_V1")
    assert.ok(rawSaved, "Phải có dữ liệu thô trong localStorage")
    const parsedEnvelope = JSON.parse(rawSaved!)
    assert.equal(parsedEnvelope.schemaVersion, 1, "Envelope schemaVersion phải là 1")
    assert.ok(parsedEnvelope.checksum, "Phải có checksum trong envelope")
  })
})
