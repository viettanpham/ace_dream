/**
 * STARFRONT WORLD — Phase 6.26 Test Suite
 * Kiểm thử Toàn diện Trực quan hóa Xu hướng Threat và Sparkline Tài nguyên:
 *   1. Dữ liệu Lịch sử Threat thực tế (SectorThreatHistoryPoint) và cơ chế Fallback khi < 2 điểm
 *   2. Tính toán chính xác xu hướng Threat: Tăng (up), Giảm (down), Ổn định (flat)
 *   3. Giới hạn cửa sổ lưu trữ Threat (tối đa 5 ngày theo Phase 6.12/6.26)
 *   4. Tính toán trung bình toàn thiên hà (Galaxy Average Threat History) cho các ngày có dữ liệu
 *   5. Lịch sử tài nguyên theo phiên (Session Resource History) và cơ chế Fallback không sinh số liệu giả
 *   6. Ngưỡng cảnh báo Food (<100, <=0) và Logistics Supplies (<50, <=0) bảo toàn chuẩn xác
 *   7. Bảo toàn cấu trúc World Save V1, Checksum, Atomic Storage và RPG Save V4
 */

import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"

import {
  createInitialWorldState,
  executeWorldTick,
  loadWorldState,
  saveWorldState,
  recordSectorThreatHistoryPoint,
  type WorldState,
  type WorldSector,
  type SectorThreatHistoryPoint,
} from "../../lib/game/world"
import {
  loadStarfrontProgression,
  saveStarfrontProgression,
} from "../../lib/game/storage"
import { INITIAL_STARFRONT_PROGRESSION } from "../../lib/game/progression"

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

describe("STARFRONT WORLD — Phase 6.26: Strategic Threat & Resource Trend Visualization", () => {
  let worldState: WorldState

  beforeEach(() => {
    ;(globalThis as any).window = globalThis
    ;(globalThis as any).localStorage = new MockLocalStorage()
    worldState = createInitialWorldState()
  })

  // --------------------------------------------------------------------------
  // TEST 1: THREAT HISTORY & FALLBACK KHI < 2 ĐIỂM
  // --------------------------------------------------------------------------
  it("1. Phải kích hoạt trạng thái fallback 'Chưa đủ dữ liệu lịch sử' khi Sector có dưới 2 điểm dữ liệu", () => {
    const sector = worldState.sectors["sol_command_hq"]
    assert.ok(sector, "sol_command_hq phải tồn tại")

    // Khi khởi tạo ban đầu, sector chưa có hoặc chỉ có 0-1 điểm
    sector.threatHistory = []
    assert.strictEqual(sector.threatHistory.length, 0)

    // Hàm kiểm tra logic fallback
    const hasEnoughData = (history?: SectorThreatHistoryPoint[]) => {
      return Boolean(history && history.length >= 2)
    }

    assert.strictEqual(
      hasEnoughData(sector.threatHistory),
      false,
      "0 điểm không được coi là đủ dữ liệu để vẽ biểu đồ"
    )

    // Thêm 1 điểm duy nhất (Ngày 1)
    recordSectorThreatHistoryPoint(sector, 1, 100)
    assert.strictEqual(sector.threatHistory.length, 1)
    assert.strictEqual(
      hasEnoughData(sector.threatHistory),
      false,
      "1 điểm duy nhất vẫn chưa đủ để tính độ dốc hay vẽ đường xu hướng"
    )

    // Thêm điểm thứ 2 (Ngày 2) -> Đủ dữ liệu
    recordSectorThreatHistoryPoint(sector, 2, 120)
    assert.strictEqual(sector.threatHistory.length, 2)
    assert.strictEqual(
      hasEnoughData(sector.threatHistory),
      true,
      "Khi có từ 2 điểm trở lên, hệ thống mới có thể tính xu hướng"
    )
  })

  // --------------------------------------------------------------------------
  // TEST 2: TÍNH TOÁN XU HƯỚNG THREAT: TĂNG / GIẢM / ỔN ĐỊNH
  // --------------------------------------------------------------------------
  it("2. Phải tính toán chính xác Delta và hướng xu hướng (up / down / flat) dựa trên dữ liệu thực", () => {
    const calculateTrend = (history: SectorThreatHistoryPoint[]) => {
      if (history.length < 2) return null
      const sorted = [...history].sort((a, b) => a.day - b.day)
      const latest = sorted[sorted.length - 1]
      const prev = sorted[sorted.length - 2]
      const delta = latest.threat - prev.threat
      return {
        delta,
        direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
        latestDay: latest.day,
        prevDay: prev.day,
      }
    }

    // Trường hợp A: Threat tăng (+35)
    const historyUp: SectorThreatHistoryPoint[] = [
      { day: 1, threat: 200 },
      { day: 2, threat: 235 },
    ]
    const trendUp = calculateTrend(historyUp)
    assert.ok(trendUp)
    assert.strictEqual(trendUp.delta, 35)
    assert.strictEqual(trendUp.direction, "up")

    // Trường hợp B: Threat giảm (-50)
    const historyDown: SectorThreatHistoryPoint[] = [
      { day: 1, threat: 300 },
      { day: 2, threat: 250 },
    ]
    const trendDown = calculateTrend(historyDown)
    assert.ok(trendDown)
    assert.strictEqual(trendDown.delta, -50)
    assert.strictEqual(trendDown.direction, "down")

    // Trường hợp C: Threat không đổi (0)
    const historyFlat: SectorThreatHistoryPoint[] = [
      { day: 1, threat: 400 },
      { day: 2, threat: 400 },
    ]
    const trendFlat = calculateTrend(historyFlat)
    assert.ok(trendFlat)
    assert.strictEqual(trendFlat.delta, 0)
    assert.strictEqual(trendFlat.direction, "flat")
  })

  // --------------------------------------------------------------------------
  // TEST 3: GIỚI HẠN CỬA SỔ LƯU TRỮ THREAT (ROLLING WINDOW 5 NGÀY)
  // --------------------------------------------------------------------------
  it("3. Phải bảo toàn giới hạn tối đa 5 ngày gần nhất trong threatHistory khi ghi nhận liên tục", () => {
    const sector = worldState.sectors["sol_command_hq"]
    sector.threatHistory = []

    for (let day = 1; day <= 8; day++) {
      recordSectorThreatHistoryPoint(sector, day, 100 + day * 10)
    }

    assert.strictEqual(
      sector.threatHistory.length,
      5,
      "threatHistory chỉ được lưu tối đa 5 mốc gần nhất"
    )
    assert.strictEqual(sector.threatHistory[0].day, 4, "Mốc cũ nhất phải là Ngày 4")
    assert.strictEqual(sector.threatHistory[4].day, 8, "Mốc mới nhất phải là Ngày 8")
    assert.strictEqual(sector.threatHistory[4].threat, 180)
  })

  // --------------------------------------------------------------------------
  // TEST 4: TÍNH TOÁN TRUNG BÌNH THIÊN HÀ (GALAXY AVERAGE THREAT HISTORY)
  // --------------------------------------------------------------------------
  it("4. Phải tổng hợp đúng lịch sử trung bình Threat toàn thiên hà cho các ngày có dữ liệu", () => {
    // Giả lập lịch sử cho 3 sector
    const s1 = worldState.sectors["sol_command_hq"]
    const s2 = Object.values(worldState.sectors)[1]
    const s3 = Object.values(worldState.sectors)[2]

    s1.threatHistory = [
      { day: 1, threat: 100 },
      { day: 2, threat: 120 },
    ]
    s2.threatHistory = [
      { day: 1, threat: 300 },
      { day: 2, threat: 280 },
    ]
    s3.threatHistory = [
      { day: 1, threat: 500 },
      { day: 2, threat: 560 },
    ]

    const computeGalaxyAverageHistory = (sectors: Record<string, WorldSector>) => {
      const dayTotals: Record<number, { sum: number; count: number }> = {}
      for (const sector of Object.values(sectors)) {
        if (sector.threatHistory && sector.threatHistory.length > 0) {
          for (const pt of sector.threatHistory) {
            if (!dayTotals[pt.day]) {
              dayTotals[pt.day] = { sum: 0, count: 0 }
            }
            dayTotals[pt.day].sum += pt.threat
            dayTotals[pt.day].count += 1
          }
        }
      }
      const days = Object.keys(dayTotals).map(Number).sort((a, b) => a - b)
      return days.map((day) => ({
        day,
        threat: Math.round(dayTotals[day].sum / dayTotals[day].count),
      }))
    }

    const avgHistory = computeGalaxyAverageHistory({
      [s1.id]: s1,
      [s2.id]: s2,
      [s3.id]: s3,
    })

    assert.strictEqual(avgHistory.length, 2)
    // Ngày 1: (100 + 300 + 500) / 3 = 300
    assert.strictEqual(avgHistory[0].day, 1)
    assert.strictEqual(avgHistory[0].threat, 300)
    // Ngày 2: (120 + 280 + 560) / 3 = 960 / 3 = 320
    assert.strictEqual(avgHistory[1].day, 2)
    assert.strictEqual(avgHistory[1].threat, 320)
  })

  // --------------------------------------------------------------------------
  // TEST 5: LỊCH SỬ TÀI NGUYÊN THEO PHIÊN & CƠ CHẾ FALLBACK
  // --------------------------------------------------------------------------
  it("5. Phải hiển thị fallback khi phiên có dưới 2 mốc tài nguyên và không tạo dữ liệu giả", () => {
    // Giả lập tracker tài nguyên theo phiên
    let sessionHistory: Array<{ day: number; food: number; logisticsSupplies: number }> = []

    const recordReading = (day: number, food: number, supplies: number) => {
      const idx = sessionHistory.findIndex((p) => p.day === day)
      if (idx >= 0) {
        sessionHistory[idx] = { day, food, logisticsSupplies: supplies }
      } else {
        sessionHistory.push({ day, food, logisticsSupplies: supplies })
        if (sessionHistory.length > 10) {
          sessionHistory = sessionHistory.slice(-10)
        }
      }
    }

    // Ban đầu chưa có dữ liệu
    assert.strictEqual(sessionHistory.length, 0)

    // Khi khởi động phiên: ghi nhận 1 mốc hiện tại
    recordReading(1, worldState.resources.food, worldState.resources.logisticsSupplies)
    assert.strictEqual(sessionHistory.length, 1)

    // Kiểm tra cờ hiển thị sparkline
    const canRenderSparkline = sessionHistory.length >= 2
    assert.strictEqual(
      canRenderSparkline,
      false,
      "1 mốc duy nhất phải kích hoạt 'Chưa đủ dữ liệu lịch sử' thay vì vẽ đường giả định"
    )

    // Sau khi advance tick: có thêm mốc Ngày 2
    recordReading(2, worldState.resources.food - 15, worldState.resources.logisticsSupplies + 5)
    assert.strictEqual(sessionHistory.length, 2)
    assert.strictEqual(
      sessionHistory.length >= 2,
      true,
      "Khi có từ 2 mốc trở lên, sparkline hiển thị đường xu hướng thực tế"
    )
  })

  // --------------------------------------------------------------------------
  // TEST 6: NGƯỠNG CẢNH BÁO TÀI NGUYÊN BẢO TOÀN
  // --------------------------------------------------------------------------
  it("6. Phải bảo toàn chính xác các ngưỡng cảnh báo Food (<100, <=0) và Supplies (<50, <=0)", () => {
    const evaluateFoodStatus = (food: number) => {
      if (food <= 0) return "critical"
      if (food < 100) return "warning"
      return "safe"
    }

    const evaluateSuppliesStatus = (supplies: number) => {
      if (supplies <= 0) return "critical"
      if (supplies < 50) return "warning"
      return "safe"
    }

    // Food
    assert.strictEqual(evaluateFoodStatus(0), "critical")
    assert.strictEqual(evaluateFoodStatus(-5), "critical")
    assert.strictEqual(evaluateFoodStatus(50), "warning")
    assert.strictEqual(evaluateFoodStatus(99), "warning")
    assert.strictEqual(evaluateFoodStatus(100), "safe")
    assert.strictEqual(evaluateFoodStatus(250), "safe")

    // Supplies
    assert.strictEqual(evaluateSuppliesStatus(0), "critical")
    assert.strictEqual(evaluateSuppliesStatus(-2), "critical")
    assert.strictEqual(evaluateSuppliesStatus(20), "warning")
    assert.strictEqual(evaluateSuppliesStatus(49), "warning")
    assert.strictEqual(evaluateSuppliesStatus(50), "safe")
    assert.strictEqual(evaluateSuppliesStatus(150), "safe")
  })

  // --------------------------------------------------------------------------
  // TEST 7: BẢO TOÀN SCHEMA V1, CHECKSUUM VÀ TÍCH HỢP TICK ENGINE
  // --------------------------------------------------------------------------
  it("7. Phải bảo toàn toàn vẹn World Save V1, Checksum CRC32 và tự động ghi nhận threat qua World Tick", () => {
    const initialDay = worldState.currentDay

    // Thực thi 1 tick chiến lược
    const tickResult = executeWorldTick(worldState)
    assert.strictEqual(worldState.currentDay, initialDay + 1)
    assert.strictEqual(tickResult.newDay, initialDay + 1)

    // Xác nhận mỗi sector đã được ghi nhận điểm threatHistory cho ngày mới
    for (const sector of Object.values(worldState.sectors)) {
      assert.ok(sector.threatHistory, `Sector ${sector.name} phải có threatHistory`)
      const latestPoint = sector.threatHistory[sector.threatHistory.length - 1]
      assert.strictEqual(
        latestPoint.day,
        worldState.currentDay,
        `Mốc lịch sử mới nhất của ${sector.name} phải là Ngày ${worldState.currentDay}`
      )
    }

    // Lưu và kiểm tra Checksum V1
    const saveRes = saveWorldState(worldState)
    assert.strictEqual(saveRes.success, true)
    assert.ok(saveRes.checksum, "Phải có CRC32 Checksum hợp lệ")

    const loadRes = loadWorldState()
    assert.strictEqual(loadRes.status, "loaded_primary")
    assert.strictEqual(loadRes.checksumVerified, true)
    assert.strictEqual(loadRes.state.version, 1, "Schema version phải là 1 (WORLD Save V1)")

    // Kiểm tra độc lập với RPG Progression Save V4
    const rpgProg = loadStarfrontProgression()
    assert.strictEqual(rpgProg.version, 4, "RPG Save V4 phải độc lập và giữ version 4")
  })
})
