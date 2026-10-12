import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"

import {
  calculatePendingTicks,
  createInitialWorldState,
  createWorldPRNG,
  executeTimeTravel,
  executeWorldTick,
  forecastTimeTravelImpact,
  loadWorldState,
  mulberry32,
  processOfflineCatchup,
  processOfflineCatchupSync,
  saveWorldState,
  splitmix32,
  stableTieBreakSort,
  TIME_CONFIG,
  WorldPRNG,
  type WorldState,
} from "../../lib/game/world"

// Giả lập localStorage trong môi trường Node.js
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

describe("STARFRONT WORLD — Phase 6.3: Tick Engine, Seeded PRNG & Offline Simulation", () => {
  beforeEach(() => {
    ;(globalThis as any).window = globalThis
    ;(globalThis as any).localStorage = new MockLocalStorage()
  })

  // -------------------------------------------------------------
  // PHẦN A: SEEDED PRNG VÀ TÍNH TẤT ĐỊNH
  // -------------------------------------------------------------
  describe("A. Seeded PRNG (SplitMix32 & Mulberry32)", () => {
    it("A.1. SplitMix32 sinh giá trị tất định với cùng một seed đầu vào", () => {
      const seed = 12345678
      const r1 = splitmix32(seed)
      const r2 = splitmix32(seed)

      assert.equal(r1.value, r2.value)
      assert.equal(r1.nextSeed, r2.nextSeed)
      assert.ok(r1.value >= 0 && r1.value < 1)
    })

    it("A.2. Mulberry32 sinh chuỗi số ngẫu nhiên lặp lại chuẩn xác 100%", () => {
      const initialSeed = 99887766
      const seqA: number[] = []
      const seqB: number[] = []

      let sA = initialSeed
      for (let i = 0; i < 20; i++) {
        const { value, nextSeed } = mulberry32(sA)
        seqA.push(value)
        sA = nextSeed
      }

      let sB = initialSeed
      for (let i = 0; i < 20; i++) {
        const { value, nextSeed } = mulberry32(sB)
        seqB.push(value)
        sB = nextSeed
      }

      assert.deepEqual(seqA, seqB)
      assert.equal(sA, sB)
    })

    it("A.3. WorldPRNG hỗ trợ nextInt, chance, choice ổn định", () => {
      const prng = createWorldPRNG(42)
      const intVal = prng.nextInt(10, 20)
      assert.ok(intVal >= 10 && intVal <= 20)

      const items = ["alpha", "beta", "gamma", "delta"] as const
      const picked = prng.choice(items)
      assert.ok(items.includes(picked!))
    })

    it("A.4. Quy tắc phá vỡ thế hòa ổn định (Deterministic Stable Tie-Breaking) theo thiết kế G.3", () => {
      const list = [
        { id: "gamma_fleet", priority: 1, scheduledTimestamp: 1000 },
        { id: "alpha_fleet", priority: 2, scheduledTimestamp: 2000 },
        { id: "beta_fleet", priority: 2, scheduledTimestamp: 1000 },
        { id: "delta_fleet", priority: 2, scheduledTimestamp: 1000 },
      ]

      const sorted = stableTieBreakSort(list)

      // Tiêu chí: priority DESC -> scheduledTimestamp ASC -> id ASC
      // priority 2, timestamp 1000: 'beta_fleet' và 'delta_fleet' -> beta đứng trước delta
      assert.equal(sorted[0].id, "beta_fleet")
      assert.equal(sorted[1].id, "delta_fleet")
      // priority 2, timestamp 2000: 'alpha_fleet'
      assert.equal(sorted[2].id, "alpha_fleet")
      // priority 1, timestamp 1000: 'gamma_fleet'
      assert.equal(sorted[3].id, "gamma_fleet")
    })
  })

  // -------------------------------------------------------------
  // PHẦN B: WORLD TICK ENGINE — THỨ TỰ 6 PHASE & TÍNH TẤT ĐỊNH
  // -------------------------------------------------------------
  describe("B. World Tick Engine (Chuỗi 6 Phase)", () => {
    it("B.1. Một tick thực thi đầy đủ 6 phase theo đúng thứ tự bất biến", () => {
      const state = createInitialWorldState(1337)
      const result = executeWorldTick(state)

      assert.equal(result.phaseLogs.length, 6)
      assert.equal(result.phaseLogs[0].phaseIndex, 1)
      assert.equal(result.phaseLogs[1].phaseIndex, 2)
      assert.equal(result.phaseLogs[2].phaseIndex, 3)
      assert.equal(result.phaseLogs[3].phaseIndex, 4)
      assert.equal(result.phaseLogs[4].phaseIndex, 5)
      assert.equal(result.phaseLogs[5].phaseIndex, 6)

      assert.equal(result.previousDay, 1)
      assert.equal(result.newDay, 2)
      assert.equal(state.currentDay, 2)
      assert.equal(state.totalDaysElapsed, 1)
    })

    it("B.2. Cùng seed và trạng thái ban đầu, chạy 100 ticks luôn cho ra kết quả cuối cùng giống hệt nhau (Deterministic Verification)", () => {
      const seed = 55443322
      const stateA = createInitialWorldState(seed)
      const stateB = createInitialWorldState(seed)

      for (let i = 0; i < 100; i++) {
        executeWorldTick(stateA)
        executeWorldTick(stateB)
      }

      assert.equal(stateA.currentDay, 101)
      assert.equal(stateB.currentDay, 101)
      assert.equal(stateA.worldSeed, stateB.worldSeed)
      assert.deepEqual(stateA.resources, stateB.resources)
      assert.deepEqual(stateA.military, stateB.military)

      // Kiểm tra mọi sector
      for (const [id, secA] of Object.entries(stateA.sectors)) {
        const secB = stateB.sectors[id]
        assert.equal(secA.threatLevel, secB.threatLevel)
        assert.equal(secA.stage, secB.stage)
        assert.equal(secA.stability, secB.stability)
        assert.deepEqual(secA.resources, secB.resources)
      }
    })

    it("B.3. Phase 1 tự động cam kết giao dịch treo và phục hồi thương binh", () => {
      const state = createInitialWorldState(100)
      // Thêm một giao dịch treo
      state.inFlightTransactions["tx_test_pending"] = {
        transactionId: "tx_test_pending",
        type: "logistics_transfer",
        status: "pending",
        createdAt: Date.now(),
      }
      state.military.woundedOrRepair = 50
      const prevReserves = state.military.reserves

      const result = executeWorldTick(state)

      // Giao dịch pending được commit
      assert.equal(state.inFlightTransactions["tx_test_pending"].status, "committed")
      assert.ok(state.committedTransactionIds.includes("tx_test_pending"))

      // Thương binh được phục hồi chuyển về reserves
      assert.ok(state.military.reserves > prevReserves)
      assert.ok(state.military.woundedOrRepair < 50)
    })

    it("B.4. Biến động Threat bị kẹp chặt theo trần tối đa (+50 Threat/ngày) ngăn chặn Snowball Effect", () => {
      const state = createInitialWorldState(2026)
      for (let i = 0; i < 30; i++) {
        const res = executeWorldTick(state)
        for (const change of res.sectorStateChanges) {
          assert.ok(
            Math.abs(change.threatDelta) <= 50,
            `Threat delta ${change.threatDelta} vượt quá trần 50`
          )
        }
      }
    })
  })

  // -------------------------------------------------------------
  // PHẦN C: OFFLINE CATCH-UP ENGINE & GIỚI HẠN AN TOÀN
  // -------------------------------------------------------------
  describe("C. Bounded Batch Catch-up Engine", () => {
    it("C.1. Tính toán pending ticks chuẩn xác theo chu kỳ 300 giây = 1 Strategic Day", () => {
      const anchor = 1000000
      // Cách 15 phút = 900 giây -> 3 ngày chiến lược
      const calc3 = calculatePendingTicks(anchor, anchor + 900 * 1000)
      assert.equal(calc3.effectiveTicks, 3)
      assert.equal(calc3.isCapped, false)
      assert.equal(calc3.isClockReversed, false)

      // Cách dưới 300 giây -> 0 ngày
      const calc0 = calculatePendingTicks(anchor, anchor + 250 * 1000)
      assert.equal(calc0.effectiveTicks, 0)
    })

    it("C.2. Kẹp chặn trần tối đa OFFLINE_CATCHUP_CAP = 360 ticks khi vắng mặt cực dài (30 ngày thực tế)", () => {
      const anchor = 1000000
      // Cách 365 ngày thực tế = rất nhiều tick
      const hugeTime = anchor + 365 * 24 * 3600 * 1000
      const calcHuge = calculatePendingTicks(anchor, hugeTime)

      assert.equal(calcHuge.isCapped, true)
      assert.equal(calcHuge.effectiveTicks, TIME_CONFIG.OFFLINE_CATCHUP_CAP_TICKS)
      assert.equal(calcHuge.effectiveTicks, 360)
    })

    it("C.3. Phòng chống gian lận đồng hồ (Clock Tampering): Nếu thời gian bị lùi lại, bỏ qua tick và giữ nguyên state", async () => {
      const state = createInitialWorldState(777)
      const currentDay = state.currentDay
      state.realTimeAnchor = 5000000

      // Thời gian hiện tại bị lùi về 4000000
      const result = await processOfflineCatchup(state, {
        currentTimestamp: 4000000,
      })

      assert.equal(result.clockTamperedDetected, true)
      assert.equal(result.ticksApplied, 0)
      assert.equal(state.currentDay, currentDay) // Giữ nguyên ngày
    })

    it("C.4. Giả lập offline 7 ngày thực tế (~2016 ticks -> kẹp 360 ticks): Hoàn tất bắt kịp trong dưới 500ms không gây đơ UI", async () => {
      const state = createInitialWorldState(888)
      const anchor = 1000000
      state.realTimeAnchor = anchor

      // 7 ngày thực tế = 7 * 24 * 3600 * 1000 ms
      const sevenDaysLater = anchor + 7 * 24 * 3600 * 1000

      const startTime = performance.now()
      const result = await processOfflineCatchup(state, {
        currentTimestamp: sevenDaysLater,
      })
      const elapsed = performance.now() - startTime

      assert.equal(result.ticksApplied, 360) // Bị kẹp trần 360
      assert.ok(elapsed < 500, `Catch-up mất ${elapsed}ms, vượt quá ngưỡng 500ms`)
      assert.equal(state.currentDay, 361)
    })

    it("C.5. Phiên bản đồng bộ processOfflineCatchupSync chia nhỏ đúng các đợt batch 50 ticks", () => {
      const state = createInitialWorldState(999)
      const anchor = 1000000
      state.realTimeAnchor = anchor

      // 120 ticks = 120 * 300,000 ms
      const futureTime = anchor + 120 * TIME_CONFIG.STRATEGIC_DAY_DURATION_MS
      const batchReports: number[] = []

      const result = processOfflineCatchupSync(state, {
        currentTimestamp: futureTime,
        onProgress: (p) => {
          batchReports.push(p.currentBatch)
        },
      })

      assert.equal(result.ticksApplied, 120)
      // 120 ticks với batch size 50 -> 3 batches (50 + 50 + 20)
      assert.equal(batchReports.length, 3)
      assert.deepEqual(batchReports, [1, 2, 3])
    })
  })

  // -------------------------------------------------------------
  // PHẦN D: TIME TRAVEL DEV CONTROLS & FORECAST PREVIEW
  // -------------------------------------------------------------
  describe("D. Time Travel Controls & Impact Forecast", () => {
    it("D.1. forecastTimeTravelImpact dự báo tác động mà KHÔNG làm thay đổi WorldState gốc", () => {
      const state = createInitialWorldState(314159)
      const originalDay = state.currentDay
      const originalResources = { ...state.resources }

      const forecast = forecastTimeTravelImpact(state, 7)

      assert.equal(forecast.requestedDays, 7)
      // Không làm đổi state gốc
      assert.equal(state.currentDay, originalDay)
      assert.deepEqual(state.resources, originalResources)

      // Ước lượng có biến động sản xuất
      assert.ok(forecast.estimatedResourceDelta.industrialMaterials > 0)
      assert.ok(forecast.estimatedResourceDelta.energy > 0)
    })

    it("D.2. executeTimeTravel áp dụng tua thời gian chính xác và an toàn", () => {
      const state = createInitialWorldState(314159)
      const initialDay = state.currentDay

      const res = executeTimeTravel(state, 14)

      assert.equal(res.daysAdvanced, 14)
      assert.equal(res.startingDay, initialDay)
      assert.equal(res.finalDay, initialDay + 14)
      assert.equal(state.currentDay, initialDay + 14)
      assert.equal(state.isSuspendedCombat, false) // Không can thiệp hay kích hoạt combat
    })
  })

  // -------------------------------------------------------------
  // PHẦN E: LƯU TRỮ, PHỤC HỒI CHECKPOINT & TÍCH HỢP TỔNG THỂ
  // -------------------------------------------------------------
  describe("E. Checkpoint & Storage Integration", () => {
    it("E.1. State sau chuỗi tick lưu vào World Storage và nạp lại nguyên vẹn với checksum hợp lệ", () => {
      const state = createInitialWorldState(12345)
      for (let i = 0; i < 5; i++) {
        executeWorldTick(state)
      }

      const saveRes = saveWorldState(state)
      assert.equal(saveRes.success, true)

      const loadRes = loadWorldState()
      assert.equal(loadRes.checksumVerified, true)
      assert.equal(loadRes.state.currentDay, 6)
      assert.equal(loadRes.state.worldSeed, state.worldSeed)
      assert.deepEqual(loadRes.state.resources, state.resources)
    })
  })
})
