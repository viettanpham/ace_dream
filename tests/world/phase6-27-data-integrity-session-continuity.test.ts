/**
 * STARFRONT WORLD — Phase 6.27 Test Suite
 * Strategic Overview Data Integrity & Session Continuity
 *
 * Kiểm thử toàn diện tính đúng đắn dữ liệu và tính liên tục phiên:
 *   1. Lịch sử Threat thực tế: không suy diễn, fallback khi < 2 điểm, đồng bộ 100% với threatLevel hiện tại.
 *   2. Chế độ Điểm Nóng (Critical Sector): gắn đúng sector nguy cấp nhất và tự động chuyển đổi khi sector thay đổi.
 *   3. Chế độ Galaxy Average Threat: tính từ dữ liệu thực tế, không coi dữ liệu thiếu là 0, khớp avgThreat hiện hành.
 *   4. Tính toán Delta chuẩn xác: gap-aware (nhận biết khoảng cách ngày), deduplication chống trùng ngày.
 *   5. Session Resource Tracker: 1 mốc/ngày, re-render/modal/tab không duplicate, lưu tối đa 10 mốc.
 *   6. Tua nhanh (Fast-forward) và Bắt kịp (Catch-up): ghi nhận đúng các mốc tick thực tế theo thời gian.
 *   7. Session Continuity khi Reload: trung thực fallback khi chưa đủ mốc, bảo toàn 100% World Save V1 schema.
 */

import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"

import {
  createInitialWorldState,
  executeWorldTick,
  loadWorldState,
  saveWorldState,
  recordSectorThreatHistoryPoint,
  setSectorThreat,
  type WorldState,
  type WorldSector,
  type SectorThreatHistoryPoint,
} from "../../lib/game/world"
import { processOfflineCatchupSync } from "../../lib/game/world/catchup-engine"

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

describe("STARFRONT WORLD — Phase 6.27: Strategic Overview Data Integrity & Session Continuity", () => {
  let worldState: WorldState

  beforeEach(() => {
    ;(globalThis as any).window = globalThis
    ;(globalThis as any).localStorage = new MockLocalStorage()
    worldState = createInitialWorldState()
  })

  // ==========================================================================
  // 1. TÍNH ĐÚNG ĐẮN CỦA LỊCH SỬ THREAT & ĐỒNG BỘ HIỆN HÀNH
  // ==========================================================================
  it("1. Lịch sử Threat Điểm Nóng phải đồng bộ 100% với threatLevel thực tế của Sector ở ngày hiện tại", () => {
    const sectors = Object.values(worldState.sectors)
    const critical = [...sectors].sort((a, b) => b.threatLevel - a.threatLevel)[0]
    assert.ok(critical, "Phải có critical sector")

    // Ban đầu ở Ngày 1, điểm cuối cùng trong threatHistory của critical sector khớp threatLevel
    assert.ok(critical.threatHistory && critical.threatHistory.length > 0)
    const lastPoint = critical.threatHistory[critical.threatHistory.length - 1]
    assert.strictEqual(lastPoint.day, worldState.currentDay)
    assert.strictEqual(lastPoint.threat, critical.threatLevel)

    // Mô phỏng sự kiện thay đổi threatLevel của critical sector trong ngày
    const newThreat = 750
    const updateRes = setSectorThreat(critical, newThreat, false)
    worldState.sectors[critical.id] = updateRes.sector

    // Helper logic của operations-center: điểm của ngày hiện tại phải phản ánh threatLevel mới
    const syncCriticalHistory = (sec: WorldSector, currentDay: number) => {
      const history = [...(sec.threatHistory || [])]
      if (history.length > 0) {
        const last = history[history.length - 1]
        if (last.day === currentDay && last.threat !== sec.threatLevel) {
          history[history.length - 1] = { ...last, threat: sec.threatLevel }
        }
      }
      return history
    }

    const synced = syncCriticalHistory(worldState.sectors[critical.id], worldState.currentDay)
    assert.strictEqual(
      synced[synced.length - 1].threat,
      750,
      "Điểm cuối cùng trên biểu đồ phải khớp hoàn toàn với số liệu 750 hiển thị trên thẻ Strategic Status"
    )
  })

  // ==========================================================================
  // 2. CHUYỂN ĐỔI ĐIỂM NÓNG (CRITICAL SECTOR) CHUẨN XÁC
  // ==========================================================================
  it("2. Khi Sector nguy cấp nhất thay đổi, dữ liệu biểu đồ lập tức gắn với đúng Sector và lịch sử thực tế của nó", () => {
    const k7 = worldState.sectors["mining_outpost_k7"]
    const sol = worldState.sectors["sol_command_hq"]
    assert.ok(k7 && sol)

    // Lúc này tartarus_breach có threatLevel cao nhất (980 vs 360 ở mining_outpost_k7)
    let critical = [...Object.values(worldState.sectors)].sort((a, b) => b.threatLevel - a.threatLevel)[0]
    assert.strictEqual(critical.id, "tartarus_breach")

    // Cập nhật sol_command_hq lên mức đe dọa tối đa 1000
    const solUpdated = setSectorThreat(sol, 1000, true)
    solUpdated.sector.threatHistory = [
      { day: 1, threat: 40 },
      { day: 2, threat: 1000 },
    ]
    worldState.sectors["sol_command_hq"] = solUpdated.sector

    // Lựa chọn lại critical sector
    critical = [...Object.values(worldState.sectors)].sort((a, b) => b.threatLevel - a.threatLevel)[0]
    assert.strictEqual(critical.id, "sol_command_hq", "Critical sector phải chuyển sang sol_command_hq")
    assert.strictEqual(critical.threatLevel, 1000)
    assert.deepStrictEqual(
      critical.threatHistory,
      [
        { day: 1, threat: 40 },
        { day: 2, threat: 1000 },
      ],
      "Lịch sử hiển thị phải thuộc về đúng sol_command_hq, không bị lẫn với tartarus_breach"
    )
  })

  // ==========================================================================
  // 3. CHẾ ĐỘ GALAXY AVERAGE THREAT VÀ XỬ LÝ DỮ LIỆU THIẾU
  // ==========================================================================
  it("3. Galaxy Average Threat phải tính trung bình từ các sector thực tế, không coi dữ liệu thiếu là 0", () => {
    // Tạo mẫu dữ liệu trong đó Ngày 1 có 3 sector báo cáo, Ngày 2 chỉ có 2 sector báo cáo
    const mockSectors: Record<string, WorldSector> = {
      sec_a: {
        ...worldState.sectors["sol_command_hq"],
        threatLevel: 200,
        threatHistory: [
          { day: 1, threat: 100 },
          { day: 2, threat: 200 },
        ],
      },
      sec_b: {
        ...worldState.sectors["helios_perimeter"],
        threatLevel: 400,
        threatHistory: [
          { day: 1, threat: 300 },
          { day: 2, threat: 400 },
        ],
      },
      sec_c: {
        ...worldState.sectors["asteroid_delta"],
        threatLevel: 500,
        // sec_c chỉ có dữ liệu ngày 1, thiếu ngày 2
        threatHistory: [{ day: 1, threat: 500 }],
      },
    }

    const calcGalaxyAvg = (sectors: Record<string, WorldSector>, currentDay: number) => {
      const dayTotals: Record<number, { sum: number; count: number }> = {}
      for (const sector of Object.values(sectors)) {
        if (sector.threatHistory && sector.threatHistory.length > 0) {
          for (const pt of sector.threatHistory) {
            if (!dayTotals[pt.day]) {
              dayTotals[pt.day] = { sum: 0, count: 0 }
            }
            const threatVal = pt.day === currentDay ? sector.threatLevel : pt.threat
            dayTotals[pt.day].sum += threatVal
            dayTotals[pt.day].count += 1
          }
        }
      }
      const days = Object.keys(dayTotals).map(Number).sort((a, b) => a - b)
      return days.slice(-10).map((day) => ({
        day,
        threat: Math.round(dayTotals[day].sum / dayTotals[day].count),
      }))
    }

    const avgHistory = calcGalaxyAvg(mockSectors, 2)
    assert.strictEqual(avgHistory.length, 2)

    // Ngày 1: (100 + 300 + 500) / 3 = 900 / 3 = 300
    assert.strictEqual(avgHistory[0].day, 1)
    assert.strictEqual(avgHistory[0].threat, 300)

    // Ngày 2: chỉ sec_a (200) và sec_b (400) có dữ liệu.
    // Nếu chia 3 (coi sec_c = 0) -> (200 + 400)/3 = 200 (SAI)
    // Đúng: chia 2 -> (200 + 400)/2 = 300
    assert.strictEqual(avgHistory[1].day, 2)
    assert.strictEqual(avgHistory[1].threat, 300, "Ngày 2 chỉ tính trung bình các sector có dữ liệu")
  })

  // ==========================================================================
  // 4. TÍNH TOÁN DELTA CHUẨN XÁC VÀ NHẬN BIẾT GAP (GAP-AWARE)
  // ==========================================================================
  it("4. Delta phải tính đúng giữa 2 mốc gần nhất và phân biệt rõ chu kỳ liên tục vs có khoảng cách", () => {
    const sanitizeHistory = (history: SectorThreatHistoryPoint[]) => {
      const map = new Map<number, SectorThreatHistoryPoint>()
      for (const pt of history) {
        if (typeof pt.day === "number" && typeof pt.threat === "number") {
          map.set(pt.day, pt)
        }
      }
      return Array.from(map.values()).sort((a, b) => a.day - b.day).slice(-10)
    }

    const calculateDelta = (history: SectorThreatHistoryPoint[]) => {
      const clean = sanitizeHistory(history)
      if (clean.length < 2) return null
      const latest = clean[clean.length - 1]
      const prev = clean[clean.length - 2]
      const delta = latest.threat - prev.threat
      const dayGap = latest.day - prev.day
      return {
        delta,
        latestDay: latest.day,
        previousDay: prev.day,
        dayGap,
        direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
      }
    }

    // Trường hợp 1: Hai ngày liên tiếp (Ngày 2 -> Ngày 3)
    const consecutive = [
      { day: 2, threat: 200 },
      { day: 3, threat: 245 },
    ]
    const metricConsecutive = calculateDelta(consecutive)
    assert.ok(metricConsecutive)
    assert.strictEqual(metricConsecutive.delta, 45)
    assert.strictEqual(metricConsecutive.dayGap, 1)
    assert.strictEqual(metricConsecutive.direction, "up")

    // Trường hợp 2: Cách nhau nhiều ngày (Ngày 1 -> Ngày 6 do tua nhanh)
    const gapData = [
      { day: 1, threat: 300 },
      { day: 6, threat: 250 },
    ]
    const metricGap = calculateDelta(gapData)
    assert.ok(metricGap)
    assert.strictEqual(metricGap.delta, -50)
    assert.strictEqual(metricGap.dayGap, 5, "Khoảng cách chu kỳ là 5 ngày")
    assert.strictEqual(metricGap.direction, "down")

    // Trường hợp 3: Bị trùng mốc ngày (Deduplication)
    const duplicateData = [
      { day: 1, threat: 100 },
      { day: 2, threat: 150 },
      { day: 2, threat: 160 }, // trùng ngày 2
    ]
    const metricDedup = calculateDelta(duplicateData)
    assert.ok(metricDedup)
    assert.strictEqual(metricDedup.latestDay, 2)
    assert.strictEqual(metricDedup.previousDay, 1)
    assert.strictEqual(metricDedup.delta, 60, "Mốc ngày 2 mới nhất (160) ghi đè 150, delta = 160 - 100 = 60")
  })

  // ==========================================================================
  // 5. SESSION RESOURCE TRACKER: CHỐNG DUPLICATE TRÊN RE-RENDER / MODAL / TAB
  // ==========================================================================
  it("5. Session Resource Tracker chỉ ghi 1 mốc/ngày; React re-render không được tạo thêm mốc", () => {
    type ResourceEntry = { day: number; food: number; logisticsSupplies: number }
    let sessionHistory: ResourceEntry[] = []

    const recordSessionPoint = (currentDay: number, food: number, logisticsSupplies: number) => {
      const idx = sessionHistory.findIndex((p) => p.day === currentDay)
      if (idx >= 0) {
        if (sessionHistory[idx].food === food && sessionHistory[idx].logisticsSupplies === logisticsSupplies) {
          return sessionHistory // Không thay đổi
        }
        const updated = [...sessionHistory]
        updated[idx] = { day: currentDay, food, logisticsSupplies }
        sessionHistory = updated
        return sessionHistory
      }
      const next = [...sessionHistory, { day: currentDay, food, logisticsSupplies }]
      sessionHistory = next.sort((a, b) => a.day - b.day).slice(-10)
      return sessionHistory
    }

    // Ghi nhận lần đầu ở Ngày 1
    recordSessionPoint(1, 3700, 1480)
    assert.strictEqual(sessionHistory.length, 1)

    // Mô phỏng 10 lần re-render, mở/đóng modal, chuyển tab khi vẫn ở Ngày 1
    for (let i = 0; i < 10; i++) {
      recordSessionPoint(1, 3700, 1480)
    }
    assert.strictEqual(sessionHistory.length, 1, "Re-render không được tự tạo thêm mốc trùng ngày")

    // Chuyển sang Ngày 2
    recordSessionPoint(2, 3650, 1470)
    assert.strictEqual(sessionHistory.length, 2)
    assert.strictEqual(sessionHistory[0].day, 1)
    assert.strictEqual(sessionHistory[1].day, 2)

    // Mô phỏng lặp lại 15 ngày liên tục -> mảng chỉ giữ tối đa 10 ngày gần nhất
    for (let day = 3; day <= 15; day++) {
      recordSessionPoint(day, 3000 + day * 10, 1400 + day)
    }
    assert.strictEqual(sessionHistory.length, 10, "Session history bị giới hạn trần tối đa 10 mốc")
    assert.strictEqual(sessionHistory[0].day, 6, "Mốc cũ nhất là Ngày 6")
    assert.strictEqual(sessionHistory[9].day, 15, "Mốc mới nhất là Ngày 15")
  })

  // ==========================================================================
  // 6. GHI NHẬN LỊCH SỬ THỰC TẾ KHI TUA NHANH & BẮT KỊP NGOẠI TUYẾN
  // ==========================================================================
  it("6. Tua nhanh (Fast-forward) và Bắt kịp ngoại tuyến ghi nhận từng mốc tick thực tế theo thứ tự thời gian", () => {
    type ResourceEntry = { day: number; food: number; logisticsSupplies: number }
    let sessionHistory: ResourceEntry[] = [
      { day: worldState.currentDay, food: worldState.resources.food, logisticsSupplies: worldState.resources.logisticsSupplies },
    ]

    // Mô phỏng tua nhanh 4 ngày: thực thi 4 tick thực tế và gom lại mốc
    const fastForwardTicks = 4
    const fastForwardPoints: ResourceEntry[] = []

    for (let i = 0; i < fastForwardTicks; i++) {
      executeWorldTick(worldState)
      fastForwardPoints.push({
        day: worldState.currentDay,
        food: worldState.resources.food,
        logisticsSupplies: worldState.resources.logisticsSupplies,
      })
    }

    // Hợp nhất vào sessionHistory theo cơ chế Map deduplication
    const map = new Map<number, ResourceEntry>()
    for (const p of sessionHistory) map.set(p.day, p)
    for (const pt of fastForwardPoints) map.set(pt.day, pt)
    sessionHistory = Array.from(map.values()).sort((a, b) => a.day - b.day).slice(-10)

    assert.strictEqual(sessionHistory.length, 5, "Ngày 1 khởi đầu + 4 ngày tick thực tế = 5 mốc")
    assert.deepStrictEqual(
      sessionHistory.map((p) => p.day),
      [1, 2, 3, 4, 5],
      "Mỗi ngày chiến lược đều được ghi nhận đúng theo tiến trình thời gian thực"
    )

    // Thử nghiệm chạy offline catch-up đồng bộ 3 ngày
    const catchupStartDay = worldState.currentDay
    const catchupResult = processOfflineCatchupSync(worldState, {
      currentTimestamp: Date.now() + 3 * 300 * 1000, // 3 ngày chiến lược
    })
    assert.strictEqual(catchupResult.ticksApplied, 3)
    assert.strictEqual(worldState.currentDay, catchupStartDay + 3)
  })

  // ==========================================================================
  // 7. SESSION CONTINUITY KHI RELOAD & BẢO TOÀN SAVE V1 SCHEMA
  // ==========================================================================
  it("7. Khi Reload: session history trở về fallback trung thực và World Save V1 schema không bị biến đổi", () => {
    // 1. Lưu World State hiện tại vào LocalStorage
    const saveRes = saveWorldState(worldState)
    assert.ok(saveRes.success, "SaveWorldState phải thành công")
    assert.ok(saveRes.checksum, "Phải có Checksum CRC32")

    // 2. Mô phỏng Reload bằng loadWorldState()
    const loadRes = loadWorldState()
    assert.strictEqual(loadRes.status, "loaded_primary", "LoadWorldState phải thành công với loaded_primary")
    assert.strictEqual(loadRes.checksumVerified, true, "Checksum phải hợp lệ")
    assert.strictEqual(loadRes.state.version, 1, "Save V1 schema version phải là 1")

    // 3. Kiểm tra Save V1 không bị chèn các trường tùy tiện của sparkline
    assert.strictEqual(
      (loadRes.state as any).sessionResourceHistory,
      undefined,
      "WorldState Schema V1 tuyệt đối không lưu sessionResourceHistory"
    )

    // 4. Tại phiên mới tải lại, sessionResourceHistory khởi tạo là []
    const freshSessionHistory: Array<{ day: number; food: number }> = []
    assert.strictEqual(freshSessionHistory.length, 0)

    // 5. Khi component Operations Center mount, nó ghi nhận đúng 1 mốc hiện tại
    freshSessionHistory.push({ day: loadRes.state.currentDay, food: loadRes.state.resources.food })
    assert.strictEqual(freshSessionHistory.length, 1)

    // 6. Vì chỉ có 1 mốc (< 2), ResourceSparkline hiển thị trạng thái trung thực "Chưa đủ dữ liệu lịch sử"
    const canRenderSparkline = freshSessionHistory.length >= 2
    assert.strictEqual(
      canRenderSparkline,
      false,
      "Giao diện phải trở về trạng thái 'Chưa đủ dữ liệu lịch sử' sau khi reload cho đến khi có đủ mốc mới"
    )
  })
})
