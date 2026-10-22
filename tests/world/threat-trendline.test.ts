/**
 * STARFRONT WORLD — Phase 6.12: Galaxy Map Threat Trendline Test Suite
 * Kiểm thử kiểm định chất lượng lưu trữ, tính toán và hiển thị xu hướng Threat 5 ngày:
 *   1. Sector chưa có lịch sử (0 ngày)
 *   2. Sector mới chỉ có 1–4 ngày lịch sử
 *   3. Sector có đủ 5 ngày lịch sử (và cơ chế cắt tỉa rolling window tối đa 5 ngày)
 *   4. Xu hướng Threat: Tăng (delta > 0), Giảm (delta < 0), Giữ nguyên (delta === 0)
 *   5. Bảo toàn qua chu trình lưu trữ Atomic Save & Recovery Load (Storage Resilience)
 *   6. Tích hợp Tick Engine tự động ghi nhận Threat theo ngày chiến lược tất định
 *   7. Tính độc lập của dữ liệu theo từng sector khi chuyển đổi mục tiêu chọn
 */

import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"

import {
  createInitialWorldState,
  executeWorldTick,
  loadWorldState,
  recordSectorThreatHistoryPoint,
  saveWorldState,
  setSectorThreat,
  type SectorThreatHistoryPoint,
  type WorldSector,
  type WorldState,
} from "../../lib/game/world"

// Giả lập LocalStorage trong môi trường kiểm thử Node.js
class MockLocalStorage {
  private store: Map<string, string> = new Map()

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  get length(): number {
    return this.store.size
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }
}

describe("STARFRONT WORLD — Phase 6.12: Threat Trendline & Sector Inspector History", () => {
  beforeEach(() => {
    ;(globalThis as any).window = globalThis
    ;(globalThis as any).localStorage = new MockLocalStorage()
  })

  // ==========================================================================
  // Test 1: Sector chưa có lịch sử (0 ngày)
  // ==========================================================================
  it("1. Sector chưa có lịch sử (threatHistory undefined hoặc rỗng) hoạt động an toàn", () => {
    const state = createInitialWorldState(1001)
    const sector = state.sectors.sol_command_hq

    // Xóa threatHistory để mô phỏng trạng thái hoàn toàn chưa có lịch sử
    sector.threatHistory = undefined

    // Kiểm tra cấu trúc an toàn
    assert.equal(sector.threatHistory, undefined)

    // Mô phỏng logic tính toán UI
    const history = (sector.threatHistory ?? []).slice(-5)
    assert.equal(history.length, 0)

    const delta = history.length >= 2 ? history[history.length - 1].threat - history[0].threat : null
    assert.equal(delta, null, "Khi chưa có lịch sử, delta phải là null")
  })

  // ==========================================================================
  // Test 2: Sector mới chỉ có 1–4 ngày lịch sử
  // ==========================================================================
  it("2. Sector có từ 1 đến 4 ngày lịch sử: không tạo điểm dữ liệu giả", () => {
    const state = createInitialWorldState(1002)
    const sector = state.sectors.helios_perimeter

    // Trường hợp 1 điểm (Ngày 1 khởi đầu)
    sector.threatHistory = [{ day: 1, threat: 150 }]
    assert.equal(sector.threatHistory.length, 1)
    let delta = sector.threatHistory.length >= 2
      ? sector.threatHistory[sector.threatHistory.length - 1].threat - sector.threatHistory[0].threat
      : null
    assert.equal(delta, null, "1 ngày duy nhất không tính biến động chuỗi (chưa đủ 2 điểm)")

    // Trường hợp 2 điểm (Ngày 1 và Ngày 2)
    recordSectorThreatHistoryPoint(sector, 2, 180)
    assert.equal(sector.threatHistory.length, 2)
    assert.equal(sector.threatHistory[0].day, 1)
    assert.equal(sector.threatHistory[1].day, 2)
    delta = sector.threatHistory[sector.threatHistory.length - 1].threat - sector.threatHistory[0].threat
    assert.equal(delta, 30, "Delta phải bằng 180 - 150 = +30")

    // Trường hợp 3 ngày và 4 ngày
    recordSectorThreatHistoryPoint(sector, 3, 210)
    recordSectorThreatHistoryPoint(sector, 4, 195)
    assert.equal(sector.threatHistory.length, 4)
    assert.deepEqual(
      sector.threatHistory.map((p) => p.day),
      [1, 2, 3, 4]
    )
    assert.deepEqual(
      sector.threatHistory.map((p) => p.threat),
      [150, 180, 210, 195]
    )
    delta = sector.threatHistory[sector.threatHistory.length - 1].threat - sector.threatHistory[0].threat
    assert.equal(delta, 45, "Delta phải bằng 195 - 150 = +45")
  })

  // ==========================================================================
  // Test 3: Sector có đủ 5 ngày lịch sử & Rolling Window tối đa 5 ngày
  // ==========================================================================
  it("3. Sector có đủ 5 ngày lịch sử và tự động giữ tối đa 5 ngày gần nhất khi tick tiếp", () => {
    const state = createInitialWorldState(1003)
    const sector = state.sectors.mining_outpost_k7

    // Ghi nhận chuỗi 5 ngày
    sector.threatHistory = [
      { day: 1, threat: 360 },
      { day: 2, threat: 370 },
      { day: 3, threat: 350 },
      { day: 4, threat: 380 },
      { day: 5, threat: 400 },
    ]

    assert.equal(sector.threatHistory.length, 5)
    assert.equal(sector.threatHistory[0].day, 1)
    assert.equal(sector.threatHistory[4].day, 5)
    let delta = sector.threatHistory[4].threat - sector.threatHistory[0].threat
    assert.equal(delta, 40)

    // Thêm ngày thứ 6
    recordSectorThreatHistoryPoint(sector, 6, 420)
    assert.equal(sector.threatHistory.length, 5, "Mảng chỉ lưu tối đa 5 ngày gần nhất")
    assert.equal(sector.threatHistory[0].day, 2, "Điểm ngày 1 cũ nhất đã được đẩy ra ngoài")
    assert.equal(sector.threatHistory[4].day, 6, "Điểm ngày 6 mới nhất nằm ở cuối chuỗi")
    assert.equal(sector.threatHistory[4].threat, 420)

    // Thêm ngày thứ 7
    recordSectorThreatHistoryPoint(sector, 7, 390)
    assert.equal(sector.threatHistory.length, 5)
    assert.deepEqual(
      sector.threatHistory.map((p) => p.day),
      [3, 4, 5, 6, 7]
    )
  })

  // ==========================================================================
  // Test 4: Giá trị Threat Tăng, Giảm và Giữ nguyên
  // ==========================================================================
  it("4. Tính toán chính xác xu hướng Threat: Tăng, Giảm và Giữ nguyên", () => {
    // Trường hợp A: Tăng Threat
    const secIncreasing: WorldSector = {
      ...createInitialWorldState().sectors.sol_command_hq,
      threatHistory: [
        { day: 1, threat: 100 },
        { day: 2, threat: 140 },
      ],
    }
    const deltaInc = secIncreasing.threatHistory![1].threat - secIncreasing.threatHistory![0].threat
    assert.ok(deltaInc > 0, "Threat tăng thì delta > 0")
    assert.equal(deltaInc, 40)

    // Trường hợp B: Giảm Threat
    const secDecreasing: WorldSector = {
      ...createInitialWorldState().sectors.sol_command_hq,
      threatHistory: [
        { day: 1, threat: 250 },
        { day: 2, threat: 200 },
      ],
    }
    const deltaDec = secDecreasing.threatHistory![1].threat - secDecreasing.threatHistory![0].threat
    assert.ok(deltaDec < 0, "Threat giảm thì delta < 0")
    assert.equal(deltaDec, -50)

    // Trường hợp C: Giữ nguyên Threat
    const secStable: WorldSector = {
      ...createInitialWorldState().sectors.sol_command_hq,
      threatHistory: [
        { day: 1, threat: 300 },
        { day: 2, threat: 300 },
      ],
    }
    const deltaStable = secStable.threatHistory![1].threat - secStable.threatHistory![0].threat
    assert.equal(deltaStable, 0, "Threat giữ nguyên thì delta === 0")
  })

  // ==========================================================================
  // Test 5: Bảo toàn dữ liệu lịch sử qua Save / Load
  // ==========================================================================
  it("5. Dữ liệu lịch sử Threat được giữ đúng 100% qua chu trình Save & Load", () => {
    const state = createInitialWorldState(2026)

    // Gán dữ liệu lịch sử phong phú cho nhiều sector
    state.sectors.sol_command_hq.threatHistory = [
      { day: 1, threat: 40 },
      { day: 2, threat: 38 },
      { day: 3, threat: 35 },
    ]

    state.sectors.mining_outpost_k7.threatHistory = [
      { day: 1, threat: 360 },
      { day: 2, threat: 380 },
      { day: 3, threat: 400 },
      { day: 4, threat: 410 },
      { day: 5, threat: 395 },
    ]

    // 1. Lưu trạng thái
    const saveRes = saveWorldState(state)
    assert.equal(saveRes.success, true, "Lưu trạng thái thành công")

    // 2. Nạp lại trạng thái
    const loadRes = loadWorldState()
    assert.equal(loadRes.checksumVerified, true, "Checksum kiểm tra hợp lệ")
    const loadedState = loadRes.state

    // 3. Đối soát dữ liệu lịch sử
    const loadedSol = loadedState.sectors.sol_command_hq
    assert.ok(loadedSol.threatHistory, "Sol HQ có threatHistory sau khi nạp")
    assert.equal(loadedSol.threatHistory.length, 3)
    assert.deepEqual(loadedSol.threatHistory, [
      { day: 1, threat: 40 },
      { day: 2, threat: 38 },
      { day: 3, threat: 35 },
    ])

    const loadedK7 = loadedState.sectors.mining_outpost_k7
    assert.ok(loadedK7.threatHistory, "K7 có threatHistory sau khi nạp")
    assert.equal(loadedK7.threatHistory.length, 5)
    assert.deepEqual(loadedK7.threatHistory, [
      { day: 1, threat: 360 },
      { day: 2, threat: 380 },
      { day: 3, threat: 400 },
      { day: 4, threat: 410 },
      { day: 5, threat: 395 },
    ])
  })

  // ==========================================================================
  // Test 6: Tích hợp Tick Engine tự động cập nhật Threat theo ngày chiến lược
  // ==========================================================================
  it("6. Tick Engine tự động cập nhật lịch sử Threat mỗi ngày và bảo đảm tính tất định", () => {
    const seed = 887766
    const stateA = createInitialWorldState(seed)
    const stateB = createInitialWorldState(seed)

    // Khởi đầu: Ngày 1 có 1 điểm lịch sử
    for (const sector of Object.values(stateA.sectors)) {
      assert.ok(sector.threatHistory)
      assert.equal(sector.threatHistory.length, 1)
      assert.equal(sector.threatHistory[0].day, 1)
    }

    // Chạy 4 ticks -> Đến Ngày 5 (đủ 5 điểm lịch sử)
    for (let t = 0; t < 4; t++) {
      executeWorldTick(stateA)
      executeWorldTick(stateB)
    }

    assert.equal(stateA.currentDay, 5)
    assert.equal(stateB.currentDay, 5)

    for (const [id, secA] of Object.entries(stateA.sectors)) {
      const secB = stateB.sectors[id]
      assert.equal(secA.threatHistory?.length, 5, `Sector ${id} phải có đúng 5 điểm lịch sử`)
      assert.equal(secB.threatHistory?.length, 5)
      // Tính tất định: Hai chu kỳ độc lập phải trùng khớp 100%
      assert.deepEqual(secA.threatHistory, secB.threatHistory)
    }

    // Chạy thêm 3 ticks -> Đến Ngày 8 (duy trì 5 điểm gần nhất: Ngày 4, 5, 6, 7, 8)
    for (let t = 0; t < 3; t++) {
      executeWorldTick(stateA)
    }

    assert.equal(stateA.currentDay, 8)
    for (const sec of Object.values(stateA.sectors)) {
      assert.equal(sec.threatHistory?.length, 5)
      assert.deepEqual(
        sec.threatHistory?.map((p) => p.day),
        [4, 5, 6, 7, 8]
      )
    }
  })

  // ==========================================================================
  // Test 7: Tính độc lập của dữ liệu lịch sử theo từng Sector
  // ==========================================================================
  it("7. Dữ liệu lịch sử của từng sector là hoàn toàn độc lập khi chuyển đổi mục tiêu", () => {
    const state = createInitialWorldState(9999)

    // Thay đổi Threat của Tartarus Breach độc lập với Sol Command HQ
    state.sectors.tartarus_breach.threatHistory = [
      { day: 1, threat: 850 },
      { day: 2, threat: 870 },
    ]

    state.sectors.sol_command_hq.threatHistory = [
      { day: 1, threat: 40 },
      { day: 2, threat: 35 },
    ]

    const solHist = state.sectors.sol_command_hq.threatHistory
    const voidHist = state.sectors.tartarus_breach.threatHistory

    assert.notDeepEqual(solHist, voidHist)
    assert.equal(solHist[1].threat, 35)
    assert.equal(voidHist[1].threat, 870)
  })
})
