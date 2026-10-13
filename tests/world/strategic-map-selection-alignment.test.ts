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
import type { WorldSector } from "@/lib/game/world/types"

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

describe("STARFRONT WORLD — Strategic Map Selection Alignment Verification", () => {
  beforeEach(() => {
    setupMockLocalStorage()
  })

  // ==========================================================================
  // Test 1: Hitbox toạ độ đồng bộ chuẩn 100% với hệ quy chiếu 10 Sector
  // ==========================================================================
  it("1. Toạ độ tâm của cả 10 sector đều nhận diện chính xác qua getSectorHitboxAtPoint", () => {
    const sectors = Object.values(INITIAL_WORLD_SECTORS)
    assert.equal(sectors.length, 10, "Phải có đúng 10 sector")

    for (const sector of sectors) {
      const cx = (sector.x / 100) * 1000
      const cy = (sector.y / 100) * 650

      // Điểm ngay tâm node (cx, cy)
      const hitCenter = getSectorHitboxAtPoint(sectors, cx, cy)
      assert.equal(hitCenter, sector.id, `Điểm tâm của [${sector.id}] phải nhận diện chính xác sector`)

      // Điểm nhãn tên (cy + 30)
      const hitLabel = getSectorHitboxAtPoint(sectors, cx, cy + 30)
      assert.equal(hitLabel, sector.id, `Điểm nhãn tên (cy + 30) của [${sector.id}] phải nhận diện chính xác sector`)

      // Điểm góc hitbox (cx + 65, cy + 50) nằm trong hitbox 140x88px ([-70, 70], [-35, 53])
      const hitCorner = getSectorHitboxAtPoint(sectors, cx + 65, cy + 50)
      assert.equal(hitCorner, sector.id, `Điểm mép hitbox của [${sector.id}] phải nhận diện đúng sector`)
    }
  })

  // ==========================================================================
  // Test 2: Sector gần tâm và sector gần mép bản đồ đều căn chuẩn chính xác
  // ==========================================================================
  it("2. Sector gần tâm (Asteroid Delta, Waypoint Orion) và mép (Sol HQ, Abyssal Rift, Tartarus Breach) không bị lệch", () => {
    const sectors = Object.values(INITIAL_WORLD_SECTORS)

    // Sector trung tâm: Asteroid Delta (46, 52) -> (460, 338)
    const delta = INITIAL_WORLD_SECTORS["asteroid_delta"]
    const deltaCx = (delta.x / 100) * 1000
    const deltaCy = (delta.y / 100) * 650
    assert.equal(getSectorHitboxAtPoint(sectors, deltaCx, deltaCy), "asteroid_delta")

    // Sector trung tâm: Waypoint Orion (66, 44) -> (660, 286)
    const orion = INITIAL_WORLD_SECTORS["waypoint_orion"]
    const orionCx = (orion.x / 100) * 1000
    const orionCy = (orion.y / 100) * 650
    assert.equal(getSectorHitboxAtPoint(sectors, orionCx, orionCy), "waypoint_orion")

    // Sector mép trái: Sol Command HQ (18, 50) -> (180, 325)
    const sol = INITIAL_WORLD_SECTORS["sol_command_hq"]
    const solCx = (sol.x / 100) * 1000
    const solCy = (sol.y / 100) * 650
    assert.equal(getSectorHitboxAtPoint(sectors, solCx, solCy), "sol_command_hq")

    // Sector mép trên phải: Abyssal Rift (82, 24) -> (820, 156)
    const abyssal = INITIAL_WORLD_SECTORS["abyssal_rift"]
    const abyssalCx = (abyssal.x / 100) * 1000
    const abyssalCy = (abyssal.y / 100) * 650
    assert.equal(getSectorHitboxAtPoint(sectors, abyssalCx, abyssalCy), "abyssal_rift")

    // Sector mép dưới phải: Tartarus Breach (88, 86) -> (880, 559)
    const tartarus = INITIAL_WORLD_SECTORS["tartarus_breach"]
    const tartarusCx = (tartarus.x / 100) * 1000
    const tartarusCy = (tartarus.y / 100) * 650
    assert.equal(getSectorHitboxAtPoint(sectors, tartarusCx, tartarusCy), "tartarus_breach")
  })

  // ==========================================================================
  // Test 3: Không có xung đột hitbox giữa các sector liền kề
  // ==========================================================================
  it("3. Không có bất kỳ 2 sector nào có hitbox chồng lấn vào tâm của nhau", () => {
    const sectors = Object.values(INITIAL_WORLD_SECTORS)
    const HIT_HALF_W = 70
    const HIT_TOP = 35
    const HIT_BOTTOM = 53

    for (let i = 0; i < sectors.length; i++) {
      for (let j = i + 1; j < sectors.length; j++) {
        const s1 = sectors[i]
        const s2 = sectors[j]
        const cx1 = (s1.x / 100) * 1000
        const cy1 = (s1.y / 100) * 650
        const cx2 = (s2.x / 100) * 1000
        const cy2 = (s2.y / 100) * 650

        const dx = Math.abs(cx1 - cx2)
        const dy = Math.abs(cy1 - cy2)

        // Tâm của s2 không được nằm trong hitbox của s1
        const s1ContainsS2 = dx <= HIT_HALF_W && dy <= (cy2 >= cy1 ? HIT_BOTTOM : HIT_TOP)
        assert.equal(
          s1ContainsS2,
          false,
          `Hitbox của [${s1.id}] không được chồng lấn vào tâm của [${s2.id}]`
        )
      }
    }
  })

  // ==========================================================================
  // Test 4: Mô phỏng ma trận CTM biến đổi tọa độ khi Zoom và Pan
  // ==========================================================================
  it("4. Phép biến đổi ma trận CTM nghịch đảo ánh xạ chính xác tọa độ màn hình sang tọa độ SVG", () => {
    // Giả lập ma trận CTM của SVG (scale S, translate Tx, Ty)
    function simulateCTMTransform(
      clientX: number,
      clientY: number,
      scale: number,
      panX: number,
      panY: number,
      viewBoxW = 1000,
      viewBoxH = 650,
      viewportW = 1000,
      viewportH = 650
    ) {
      // Tọa độ tương đối trong viewport
      // x_screen = panX + (x_svg / viewBoxW) * viewportW * scale
      // x_svg = (x_screen - panX) / (viewportW * scale) * viewBoxW
      const svgX = ((clientX - panX) / (viewportW * scale)) * viewBoxW
      const svgY = ((clientY - panY) / (viewportH * scale)) * viewBoxH
      return { svgX, svgY }
    }

    // Ở scale = 1, pan = (0, 0): client (160, 507) -> svg (160, 507)
    const norm = simulateCTMTransform(160, 507, 1, 0, 0)
    assert.equal(Math.round(norm.svgX), 160)
    assert.equal(Math.round(norm.svgY), 507)

    // Khi zoom in 1.5x và pan (100, 50):
    // Điểm tại SVG (160, 507) xuất hiện trên màn hình tại:
    // clientX = 100 + 160 * 1.5 = 340
    // clientY = 50 + 507 * 1.5 = 810.5
    const zoomed = simulateCTMTransform(340, 810.5, 1.5, 100, 50)
    assert.equal(Math.round(zoomed.svgX), 160)
    assert.equal(Math.round(zoomed.svgY), 507)

    // Lấy sector tương ứng từ tọa độ nghịch đảo
    const sectors = Object.values(INITIAL_WORLD_SECTORS)
    const hit = getSectorHitboxAtPoint(sectors, zoomed.svgX, zoomed.svgY)
    assert.equal(hit, "sol_command_hq")
  })

  // ==========================================================================
  // Test 5: Drag Threshold 5px phân định rạch ròi Click vs Pan
  // ==========================================================================
  it("5. Di chuyển dưới 5px được tính là click; di chuyển từ 5px trở lên kích hoạt Pan", () => {
    const DRAG_THRESHOLD = 5

    function testMovement(dx: number, dy: number) {
      const dist = Math.hypot(dx, dy)
      return dist >= DRAG_THRESHOLD
    }

    assert.equal(testMovement(0, 0), false, "0px là click")
    assert.equal(testMovement(2, 3), false, "3.6px < 5px là click")
    assert.equal(testMovement(3, 4), true, "5px là pan")
    assert.equal(testMovement(10, 15), true, "18px là pan")
  })

  // ==========================================================================
  // Test 6: transformClientToSVG trực tiếp với getBoundingClientRect (Zoom in/out, Pan, Letterbox)
  // ==========================================================================
  it("6. transformClientToSVG ánh xạ chính xác qua getBoundingClientRect tại zoom mặc định, zoom in/out, và pan", () => {
    const sectors = Object.values(INITIAL_WORLD_SECTORS)

    function createMockSvgElement(rect: { left: number; top: number; width: number; height: number }) {
      return {
        getBoundingClientRect: () => rect,
      } as unknown as SVGSVGElement
    }

    // A. Zoom mặc định 1.0x, container 1000x650 (tỷ lệ chuẩn)
    const svgNorm = createMockSvgElement({ left: 0, top: 0, width: 1000, height: 650 })
    for (const sec of sectors) {
      const expectedSvgX = (sec.x / 100) * 1000
      const expectedSvgY = (sec.y / 100) * 650
      const pt = transformClientToSVG(svgNorm, expectedSvgX, expectedSvgY)
      assert.ok(pt, `Phải chuyển đổi thành công cho ${sec.id}`)
      assert.equal(Math.round(pt.x), Math.round(expectedSvgX), `Toạ độ X của ${sec.id} phải khớp`)
      assert.equal(Math.round(pt.y), Math.round(expectedSvgY), `Toạ độ Y của ${sec.id} phải khớp`)
      const hit = getSectorHitboxAtPoint(sectors, pt.x, pt.y)
      assert.equal(hit, sec.id, `Hitbox phải nhận diện đúng sector ${sec.id}`)
    }

    // B. Zoom in 1.5x với Pan (120px, 80px) trong container 1200x700
    // Container 1200x700: viewBox 1000x650
    // scaled rect: width = 1200 * 1.5 = 1800, height = 700 * 1.5 = 1050
    // left = (1200 - 1800)/2 + 120 = -180, top = (700 - 1050)/2 + 80 = -95
    const svgZoomed = createMockSvgElement({ left: -180, top: -95, width: 1800, height: 1050 })
    // Letterboxing trong rect 1800x1050: aspect 1800/1050 ~ 1.714 > 1000/650 ~ 1.538
    // scale = 1050 / 650 = 1.61538; padX = (1800 - 1000 * 1.61538) / 2 = 92.308; padY = 0
    const scaleZ = 1050 / 650
    const padXZ = (1800 - 1000 * scaleZ) / 2

    // Kiểm tra sector gần tâm (Asteroid Delta: 460, 338)
    const deltaSvgX = 460
    const deltaSvgY = 338
    const clientDeltaX = -180 + padXZ + deltaSvgX * scaleZ
    const clientDeltaY = -95 + deltaSvgY * scaleZ
    const ptDelta = transformClientToSVG(svgZoomed, clientDeltaX, clientDeltaY)
    assert.ok(ptDelta)
    assert.equal(Math.round(ptDelta.x), deltaSvgX)
    assert.equal(Math.round(ptDelta.y), deltaSvgY)
    assert.equal(getSectorHitboxAtPoint(sectors, ptDelta.x, ptDelta.y), "asteroid_delta")

    // Kiểm tra sector mép (Abyssal Rift: 820, 156)
    const abyssalSvgX = 820
    const abyssalSvgY = 156
    const clientAbyssalX = -180 + padXZ + abyssalSvgX * scaleZ
    const clientAbyssalY = -95 + abyssalSvgY * scaleZ
    const ptAbyssal = transformClientToSVG(svgZoomed, clientAbyssalX, clientAbyssalY)
    assert.ok(ptAbyssal)
    assert.equal(Math.round(ptAbyssal.x), abyssalSvgX)
    assert.equal(Math.round(ptAbyssal.y), abyssalSvgY)
    assert.equal(getSectorHitboxAtPoint(sectors, ptAbyssal.x, ptAbyssal.y), "abyssal_rift")

    // C. Zoom out 0.8x với Pan (-40px, -20px)
    const svgZoomOut = createMockSvgElement({ left: 60, top: 50, width: 800, height: 520 })
    const scaleOut = 800 / 1000
    const tartarus = INITIAL_WORLD_SECTORS["tartarus_breach"]
    const tartarusSvgX = (tartarus.x / 100) * 1000
    const tartarusSvgY = (tartarus.y / 100) * 650
    const ptTartarus = transformClientToSVG(svgZoomOut, 60 + tartarusSvgX * scaleOut, 50 + tartarusSvgY * scaleOut)
    assert.ok(ptTartarus)
    assert.equal(Math.round(ptTartarus.x), Math.round(tartarusSvgX))
    assert.equal(Math.round(ptTartarus.y), Math.round(tartarusSvgY))
    assert.equal(getSectorHitboxAtPoint(sectors, ptTartarus.x, ptTartarus.y), "tartarus_breach")
  })

  // ==========================================================================
  // Test 7: Vòng đời Pointer Event đồng bộ: Click chọn đúng sector, Drag không click nhầm
  // ==========================================================================
  it("7. Pointer lifecycle quản lý chính xác: Click liên tiếp chọn đúng sector, Drag >= 5px không kích hoạt click nhầm", () => {
    let isPointerDown = false
    let hasExceededDrag = false
    let clickedSectorId: string | null = null
    let selectedSectorId = "sol_command_hq"

    function onPointerDown(sectorId: string | null) {
      isPointerDown = true
      hasExceededDrag = false
      clickedSectorId = sectorId
    }

    function onPointerMove(distance: number) {
      if (!isPointerDown) return
      if (distance >= 5) {
        hasExceededDrag = true
        clickedSectorId = null // Hủy click sector khi đã thành drag
      }
    }

    function onPointerUp() {
      if (!isPointerDown) return
      const wasDragging = hasExceededDrag
      const pendingSectorId = clickedSectorId

      isPointerDown = false
      hasExceededDrag = false
      clickedSectorId = null

      if (!wasDragging && pendingSectorId) {
        selectedSectorId = pendingSectorId
      }
    }

    // Kịch bản 1: Click tĩnh vào Mining Outpost K-7
    onPointerDown("mining_outpost_k7")
    onPointerMove(0)
    onPointerUp()
    assert.equal(selectedSectorId, "mining_outpost_k7", "Click tĩnh phải chọn mining_outpost_k7")

    // Kịch bản 2: Click tĩnh kế tiếp vào Tartarus Breach (không bị kẹt state)
    onPointerDown("tartarus_breach")
    onPointerMove(2) // micro-jitter 2px < 5px
    onPointerUp()
    assert.equal(selectedSectorId, "tartarus_breach", "Click kế tiếp phải chọn tartarus_breach")

    // Kịch bản 3: Kéo bản đồ bắt đầu từ trên Waypoint Orion (di chuyển 25px >= 5px)
    onPointerDown("waypoint_orion")
    onPointerMove(25)
    onPointerUp()
    assert.equal(
      selectedSectorId,
      "tartarus_breach",
      "Kéo bản đồ bắt đầu trên sector KHÔNG được vô tình chọn sector đó"
    )
    assert.equal(isPointerDown, false, "State isPointerDown phải được reset về false")
    assert.equal(hasExceededDrag, false, "hasExceededDrag phải được reset về false")

    // Kịch bản 4: Click ngay sau khi kéo bản đồ vẫn chọn được sector mới
    onPointerDown("waypoint_orion")
    onPointerMove(1)
    onPointerUp()
    assert.equal(selectedSectorId, "waypoint_orion", "Click sau khi drag phải chọn được waypoint_orion bình thường")
  })
})
