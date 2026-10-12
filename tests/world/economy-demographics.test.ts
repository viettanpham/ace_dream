/**
 * STARFRONT WORLD — Phase 6.4 Unit Tests: Strategic Economy, Logistics Network & Demographics
 * Kiểm thử toàn diện:
 *   A. 4 Nhóm tài nguyên chiến lược & Lương thực (Food) thiết yếu riêng biệt
 *   B. Năng lực chiến lược (Industry, Logistics, Stability) & Hệ số trạng thái sector
 *   C. Suy thoái do thiếu hụt lương thực từng bậc (Gradual Shortage Degradation)
 *   D. Mạng lưới Logistics: Mức dự trữ an toàn 3 ngày (Safety Buffer) & Hàng In-Transit
 *   E. Thứ tự ưu tiên cứu trợ hậu cần (Food -> Energy -> Supplies -> Materials -> Data)
 *   F. Xử lý trạng thái tuyến đường (Open, Hazardous attrition, Blocked)
 *   G. Quy tắc bảo toàn dân cư tuyệt đối (Zero-Sum Migration Conservation)
 *   H. Tích hợp trong chu kỳ Tick Engine tất định
 */

import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"

import {
  advanceCivilianMigrations,
  advanceInFlightConvoys,
  applyFoodShortageDegradation,
  calculateDailyFoodConsumption,
  calculateEffectiveSectorIndustry,
  calculateExportableSurplus,
  calculatePathAttritionRate,
  calculateSafetyBuffer,
  calculateSectorDailyProduction,
  calculateStrategicCapacities,
  createInitialWorldState,
  createWorldPRNG,
  dispatchCivilianMigration,
  dispatchLogisticsConvoy,
  executeWorldTick,
  getStabilityProductionMultiplier,
  loadWorldState,
  LOGISTICS_RESOURCE_PRIORITY,
  processAutomatedLogisticsBalancing,
  processDemographicsCycle,
  processLogisticsCycle,
  processNaturalPopulationGrowth,
  processStrategicEconomyCycle,
  recalculateDemographicsTotals,
  saveWorldState,
  SAFETY_BUFFER_DAYS,
  synchronizeNationalLedger,
} from "../../lib/game/world"
import type { WorldSector, WorldState } from "../../lib/game/world/types"

class MockLocalStorage {
  private store: Record<string, string> = {}
  getItem(key: string): string | null {
    return this.store[key] ?? null
  }
  setItem(key: string, value: string): void {
    this.store[key] = value
  }
  removeItem(key: string): void {
    delete this.store[key]
  }
  clear(): void {
    this.store = {}
  }
}

describe("STARFRONT WORLD — Phase 6.4: Strategic Economy, Logistics & Demographics", () => {
  beforeEach(() => {
    ;(globalThis as any).window = globalThis
    ;(globalThis as any).localStorage = new MockLocalStorage()
  })

  // =========================================================================
  // PHẦN A: KINH TẾ CHIẾN LƯỢC & 4+1 NHÓM TÀI NGUYÊN
  // =========================================================================
  describe("A. Strategic Economy & 4+1 Resource Model", () => {
    it("A.1. Lương thực (Food) là tài nguyên độc lập, không bị gộp vào logisticsSupplies", () => {
      const state = createInitialWorldState()
      const sol = state.sectors.sol_command_hq

      assert.ok("food" in sol.resources, "Sector phải có trường tài nguyên 'food'")
      assert.ok(
        "logisticsSupplies" in sol.resources,
        "Sector phải có trường 'logisticsSupplies'"
      )
      assert.notEqual(
        sol.resources.food,
        sol.resources.logisticsSupplies,
        "Food và logisticsSupplies có giá trị độc lập"
      )

      assert.ok("food" in state.resources, "Kho quốc gia phải có trường 'food'")
      assert.ok(
        "logisticsSupplies" in state.resources,
        "Kho quốc gia phải có 'logisticsSupplies'"
      )
    })

    it("A.2. Tính toán sản lượng theo năng lực công nghiệp và hệ số Stability", () => {
      const state = createInitialWorldState()
      const sol = state.sectors.sol_command_hq // industryCapacity: 220, stability: 95 (>= 80 -> 1.15)

      const eff = calculateEffectiveSectorIndustry(sol)
      assert.equal(
        eff,
        220 * 1.0 * 1.15,
        "Sol Command (Normal, Stability 95) được hưởng +15% prosperity boost"
      )

      const prod = calculateSectorDailyProduction(sol)
      assert.ok(prod.industrialMaterials > 0, "Sản xuất vật liệu > 0")
      assert.ok(prod.energy > 0, "Sản xuất năng lượng > 0")
      assert.ok(prod.logisticsSupplies > 0, "Sản xuất vật tư hậu cần > 0")
      assert.ok(prod.tacticalData > 0, "Sản xuất dữ liệu chiến thuật > 0")
      assert.ok(prod.food > 0, "Sản xuất lương thực > 0")

      // Thử nghiệm sector có stability thấp (< 25 -> 0.5)
      const testSector: WorldSector = {
        ...sol,
        stability: 20,
      }
      assert.equal(getStabilityProductionMultiplier(20), 0.5, "Stability < 25 chịu phạt 50%")
      assert.equal(
        calculateEffectiveSectorIndustry(testSector),
        220 * 1.0 * 0.5,
        "Hiệu suất công nghiệp giảm một nửa khi khủng hoảng"
      )
    })

    it("A.3. Tiêu thụ lương thực dân sinh theo tỷ lệ 100,000 dân = 150 food/ngày", () => {
      assert.equal(calculateDailyFoodConsumption(100000), 150)
      assert.equal(calculateDailyFoodConsumption(200000), 300)
      assert.equal(calculateDailyFoodConsumption(50000), 75)
      assert.equal(calculateDailyFoodConsumption(0), 0)
    })

    it("A.4. Tính toán chuẩn xác 3 năng lực chiến lược (Industry, Logistics, Stability)", () => {
      const state = createInitialWorldState()
      const caps = calculateStrategicCapacities(state)

      assert.ok(caps.industry > 0, "Industry capacity phải dương")
      assert.ok(caps.logistics > 0, "Logistics throughput phải dương")
      assert.ok(
        caps.stability >= 0 && caps.stability <= 100,
        "Stability trung bình nằm trong [0..100]"
      )
    })
  })

  // =========================================================================
  // PHẦN B: CƠ CHẾ SUY THOÁI THIẾU HỤT TỪNG BẬC (GRADUAL ATTRITION)
  // =========================================================================
  describe("B. Gradual Shortage Degradation (Thiếu Hụt Theo Bậc)", () => {
    it("B.1. Ngày 1-2 thiếu hụt lương thực: Stability giảm -5/ngày", () => {
      const state = createInitialWorldState()
      const sector = { ...state.sectors.sol_command_hq, stability: 90 }

      const deg1 = applyFoodShortageDegradation(sector, 1)
      assert.equal(deg1.stabilityLoss, 5)
      assert.equal(deg1.casualties, 0)
      assert.equal(sector.stability, 85)

      const deg2 = applyFoodShortageDegradation(sector, 2)
      assert.equal(deg2.stabilityLoss, 5)
      assert.equal(deg2.casualties, 0)
      assert.equal(sector.stability, 80)
    })

    it("B.2. Ngày 3-5 thiếu hụt: Stability giảm -8/ngày và phát sinh phạt phòng thủ 25%", () => {
      const state = createInitialWorldState()
      const sector = { ...state.sectors.sol_command_hq, stability: 80 }

      const deg3 = applyFoodShortageDegradation(sector, 3)
      assert.equal(deg3.stabilityLoss, 8)
      assert.equal(deg3.defensePenalty, 0.25)
      assert.equal(deg3.casualties, 0)
      assert.equal(sector.stability, 72)
    })

    it("B.3. Sau 5 ngày thiếu hụt kéo dài: Phát sinh thương vong đói và phạt nặng Stability (-12/ngày)", () => {
      const state = createInitialWorldState()
      const sector = {
        ...state.sectors.sol_command_hq,
        population: 100000,
        stability: 60,
      }

      const deg6 = applyFoodShortageDegradation(sector, 6)
      assert.equal(deg6.stabilityLoss, 12)
      assert.ok(deg6.casualties > 0, "Phát sinh thương vong dân sự khi đói kéo dài")
      assert.equal(deg6.casualties, 1000, "1% dân số (1000 người) thương vong ngày 6")
      assert.equal(sector.population, 99000)
      assert.equal(sector.stability, 48)
    })

    it("B.4. Kho tài nguyên không bao giờ âm vô lý sau khi tiêu thụ", () => {
      const state = createInitialWorldState()
      state.sectors.sol_command_hq.resources.food = 10 // Quá ít so với nhu cầu 390
      const report = processStrategicEconomyCycle(state)

      assert.ok(
        state.sectors.sol_command_hq.resources.food >= 0,
        "Kho food của Sol Command không được âm"
      )
      assert.ok(
        state.resources.food >= 0,
        "Kho food quốc gia không được âm"
      )
    })
  })

  // =========================================================================
  // PHẦN C: MẠNG LƯỚI HẬU CẦN & MỨC DỰ TRỮ AN TOÀN (LOGISTICS)
  // =========================================================================
  describe("C. Strategic Logistics Network & Safety Stock Buffer", () => {
    it("C.1. Mức dự trữ an toàn (Safety Buffer) bảo vệ tối thiểu 3 ngày tiêu thụ", () => {
      const state = createInitialWorldState()
      const sol = state.sectors.sol_command_hq // Dân số: 260,000 -> Daily Food: 390
      const foodBuffer = calculateSafetyBuffer(sol, "food")

      assert.equal(
        foodBuffer,
        390 * SAFETY_BUFFER_DAYS,
        "Safety Buffer lương thực bằng đúng 3 ngày tiêu thụ (1170)"
      )

      // Kiểm tra lượng thặng dư có thể xuất khẩu
      sol.resources.food = 1500
      const surplus = calculateExportableSurplus(sol, "food")
      assert.equal(
        surplus,
        1500 - 1170,
        "Thặng dư có thể xuất khẩu bằng đúng Tồn Kho trừ Buffer"
      )

      // Nếu kho thấp hơn Buffer, thặng dư xuất khẩu phải bằng 0
      sol.resources.food = 1000
      assert.equal(
        calculateExportableSurplus(sol, "food"),
        0,
        "Không được phép xuất khẩu khi dưới ngưỡng dự trữ an toàn"
      )
    })

    it("C.2. Hàng hóa In-Transit: Bị khấu trừ ngay tại sector nguồn và chỉ cộng vào đích khi giao thành công", () => {
      const state = createInitialWorldState()
      const sol = state.sectors.sol_command_hq
      const helios = state.sectors.helios_perimeter

      sol.resources.food = 2000 // Buffer = 1170 -> Khả dụng = 830
      const initialHeliosFood = helios.resources.food

      const dispatchRes = dispatchLogisticsConvoy(
        state,
        "sol_command_hq",
        "helios_perimeter",
        "food",
        300
      )

      assert.equal(dispatchRes.success, true)
      assert.ok(dispatchRes.convoy)
      assert.equal(sol.resources.food, 1700, "Đã trừ ngay 300 khỏi kho Sol Command")
      assert.equal(
        helios.resources.food,
        initialHeliosFood,
        "Helios chưa nhận hàng khi convoy còn đang trên đường"
      )

      // Kiểm tra trong danh sách InFlightTransactions
      const tx = state.inFlightTransactions[dispatchRes.convoy.transactionId]
      assert.ok(tx, "Giao dịch logistics được ghi nhận trong InFlight")
      assert.equal(tx.status, "pending")

      // Giả lập đoàn xe đến đích
      const advanceResult = advanceInFlightConvoys(state)
      assert.equal(advanceResult.arrivedConvoys.length, 1)
      assert.equal(
        helios.resources.food,
        initialHeliosFood + 300,
        "Helios đã nhận trọn vẹn 300 lương thực sau khi đến nơi"
      )
      assert.equal(state.inFlightTransactions[dispatchRes.convoy.transactionId], undefined)
      assert.ok(
        state.committedTransactionIds.includes(dispatchRes.convoy.transactionId),
        "Transaction ID đã được chuyển sang danh sách committed"
      )
    })

    it("C.3. Hàng hóa đi qua tuyến Hazardous chịu hao hụt (Attrition 20%)", () => {
      const state = createInitialWorldState()
      // Tìm tuyến đường nối Helios và Mining Outpost K-7 hoặc chuyển 1 tuyến sang hazardous
      const route = state.routes.find(
        (r) =>
          (r.fromSectorId === "sol_command_hq" && r.toSectorId === "helios_perimeter") ||
          (r.fromSectorId === "helios_perimeter" && r.toSectorId === "sol_command_hq")
      )
      assert.ok(route)
      route.state = "hazardous" // Chuyển tạm thời sang hazardous

      const sol = state.sectors.sol_command_hq
      const helios = state.sectors.helios_perimeter
      sol.resources.energy = 1000
      const initialHeliosEnergy = helios.resources.energy

      const res = dispatchLogisticsConvoy(
        state,
        "sol_command_hq",
        "helios_perimeter",
        "energy",
        200
      )
      assert.equal(res.success, true)
      assert.ok(res.convoy)
      assert.equal(res.convoy.attritionRate, 0.2, "Attrition rate 20% trên tuyến hazardous")

      // Cập bến
      const advanceRes = advanceInFlightConvoys(state)
      assert.equal(advanceRes.arrivedConvoys.length, 1)

      // 200 * (1 - 0.2) = 160 delivered, 40 lost
      assert.equal(advanceRes.cargoDelivered.energy, 160)
      assert.equal(advanceRes.cargoLost.energy, 40)
      assert.equal(helios.resources.energy, initialHeliosEnergy + 160)
    })

    it("C.4. Tuyến đường Blocked hoặc Severed chặn hoàn toàn việc điều chuyển", () => {
      const state = createInitialWorldState()
      // Phong tỏa tuyến đường Sol - Helios
      const route = state.routes.find(
        (r) =>
          (r.fromSectorId === "sol_command_hq" && r.toSectorId === "helios_perimeter") ||
          (r.fromSectorId === "helios_perimeter" && r.toSectorId === "sol_command_hq")
      )
      assert.ok(route)
      route.state = "blocked"

      // Nếu không còn đường nào khác không bị block, lệnh dispatch phải trả về false
      // Tạm thời phong tỏa cả tuyến Sol - Asteroid Delta
      const route2 = state.routes.find(
        (r) =>
          (r.fromSectorId === "sol_command_hq" && r.toSectorId === "asteroid_delta") ||
          (r.fromSectorId === "asteroid_delta" && r.toSectorId === "sol_command_hq")
      )
      if (route2) route2.state = "blocked"

      const res = dispatchLogisticsConvoy(
        state,
        "sol_command_hq",
        "helios_perimeter",
        "food",
        100
      )
      assert.equal(res.success, false, "Không thể chuyển hàng qua tuyến đường bị Blocked")
      assert.match(res.reason ?? "", /traversable/i)
    })

    it("C.5. Thứ tự ưu tiên cứu trợ hậu cần chuẩn xác: Food -> Energy -> Supplies -> Materials -> Data", () => {
      assert.deepEqual(LOGISTICS_RESOURCE_PRIORITY, [
        "food",
        "energy",
        "logisticsSupplies",
        "industrialMaterials",
        "tacticalData",
      ])
    })
  })

  // =========================================================================
  // PHẦN D: NHÂN KHẨU HỌC & BẢO TOÀN DÂN CƯ ZERO-SUM
  // =========================================================================
  describe("D. Demographics & Zero-Sum Migration Conservation", () => {
    it("D.1. Quy tắc bảo toàn dân cư tuyệt đối (Zero-Sum Conservation) được duy trì khi khởi tạo", () => {
      const state = createInitialWorldState()
      const check = recalculateDemographicsTotals(state)

      assert.equal(check.isBalanced, true, "Hệ số bảo toàn nhân khẩu học đạt cân bằng 100%")
      assert.equal(
        check.sumSectorsPopulation +
          state.demographics.refugeesInTransit +
          state.demographics.civilianCasualties,
        state.demographics.nationalTotalPopulation
      )
    })

    it("D.2. Di cư dân sự: Trừ khỏi sector đi, cộng vào refugeesInTransit và duy trì tổng toàn cục", () => {
      const state = createInitialWorldState()
      const sol = state.sectors.sol_command_hq
      const helios = state.sectors.helios_perimeter

      const initialSolPop = sol.population
      const initialHeliosPop = helios.population
      const initialRefugees = state.demographics.refugeesInTransit
      const initialTotal = state.demographics.nationalTotalPopulation

      const migRes = dispatchCivilianMigration(
        state,
        "sol_command_hq",
        "helios_perimeter",
        5000
      )

      assert.equal(migRes.success, true)
      assert.ok(migRes.convoy)
      assert.equal(sol.population, initialSolPop - 5000, "Đã trừ 5000 tại Sol Command")
      assert.equal(
        state.demographics.refugeesInTransit,
        initialRefugees + 5000,
        "Cộng 5000 vào refugeesInTransit"
      )
      assert.equal(
        helios.population,
        initialHeliosPop,
        "Helios chưa nhận dân khi convoy đang hành trình"
      )

      // Kiểm tra phương trình bảo toàn sau khi xuất phát
      const checkMid = recalculateDemographicsTotals(state)
      assert.equal(checkMid.isBalanced, true, "Bảo toàn hoàn hảo khi dân đang in-transit")

      // Đoàn di tản đến nơi
      const advRes = advanceCivilianMigrations(state)
      assert.equal(advRes.arrivedMigrants, 5000)
      assert.equal(helios.population, initialHeliosPop + 5000, "Helios nhận đủ 5000 dân")
      assert.equal(
        state.demographics.refugeesInTransit,
        0,
        "refugeesInTransit đã được giải tỏa về 0"
      )

      // Kiểm tra phương trình bảo toàn sau khi cập bến
      const checkFinal = recalculateDemographicsTotals(state)
      assert.equal(checkFinal.isBalanced, true, "Bảo toàn hoàn hảo sau khi cập bến")
      assert.equal(state.demographics.nationalTotalPopulation, initialTotal)
    })

    it("D.3. Di tản qua tuyến Hazardous phát sinh thương vong và ghi nhận đúng vào civilianCasualties", () => {
      const state = createInitialWorldState()
      const route = state.routes.find(
        (r) =>
          (r.fromSectorId === "sol_command_hq" && r.toSectorId === "helios_perimeter") ||
          (r.fromSectorId === "helios_perimeter" && r.toSectorId === "sol_command_hq")
      )
      assert.ok(route)
      route.state = "hazardous"

      const sol = state.sectors.sol_command_hq
      const helios = state.sectors.helios_perimeter
      const initialCasualties = state.demographics.civilianCasualties

      const migRes = dispatchCivilianMigration(
        state,
        "sol_command_hq",
        "helios_perimeter",
        10000
      )
      assert.equal(migRes.success, true)
      assert.equal(migRes.convoy?.casualtyRate, 0.1, "10% thương vong trên tuyến hiểm trở")

      // Đến nơi
      const advRes = advanceCivilianMigrations(state)
      assert.equal(advRes.casualties, 1000, "1,000 người thương vong (10% của 10,000)")
      assert.equal(advRes.arrivedMigrants, 9000, "9,000 người sống sót cập bến")
      assert.equal(helios.population, state.sectors.helios_perimeter.population)
      assert.equal(
        state.demographics.civilianCasualties,
        initialCasualties + 1000,
        "civilianCasualties tăng đúng 1,000"
      )

      // Phương trình bảo toàn vẫn khớp 100%
      const check = recalculateDemographicsTotals(state)
      assert.equal(check.isBalanced, true)
    })

    it("D.4. Dân số tại sector bị chiếm đóng/tranh chấp (Suppressed Population) không bị biến thành lính Void", () => {
      const state = createInitialWorldState()
      const waypoint = state.sectors.waypoint_orion // Sovereignty: contested, Population: 50,000
      const tartarus = state.sectors.tartarus_breach // Sovereignty: void, Population: 15,000

      assert.ok(waypoint.population > 0, "Sector tranh chấp vẫn có dân thường sinh sống")
      assert.ok(tartarus.population > 0, "Sector Void chiếm vẫn có dân thường bị chiếm đóng")

      const check = recalculateDemographicsTotals(state)
      assert.ok(
        check.controlledTerritoryPopulation < check.sumSectorsPopulation,
        "Dân số vùng kiểm soát VSS tách biệt với tổng dân số thực tế tại các sector"
      )
    })

    it("D.5. Tăng trưởng tự nhiên đồng bộ hóa đồng thời Sector Pop, Controlled Pop và National Pop", () => {
      const state = createInitialWorldState()
      const initialSectorsSum = Object.values(state.sectors).reduce(
        (sum, s) => sum + s.population,
        0
      )
      const initialControlled = state.demographics.controlledTerritoryPopulation
      const initialNational = state.demographics.nationalTotalPopulation

      const growth = processNaturalPopulationGrowth(state)
      assert.ok(growth > 0, "Phát sinh tăng trưởng tự nhiên")

      const newSectorsSum = Object.values(state.sectors).reduce(
        (sum, s) => sum + s.population,
        0
      )
      assert.equal(newSectorsSum, initialSectorsSum + growth)
      assert.equal(
        state.demographics.controlledTerritoryPopulation,
        initialControlled + growth
      )
      assert.equal(state.demographics.nationalTotalPopulation, initialNational + growth)

      const check = recalculateDemographicsTotals(state)
      assert.equal(check.isBalanced, true, "Hệ số bảo toàn vẫn hoàn hảo sau tăng trưởng tự nhiên")
    })
  })

  // =========================================================================
  // PHẦN E: TÍCH HỢP TRONG TICK ENGINE & BẢO LƯU CHECKPOINT
  // =========================================================================
  describe("E. Tick Engine Integration & Checkpoint Stability", () => {
    it("E.1. Chạy 1 tick cập nhật trọn vẹn chu kỳ Phase 2 (Logistics/Demographics) và Phase 3 (Economy)", () => {
      const state = createInitialWorldState()
      const tickRes = executeWorldTick(state, { logPhases: true })

      assert.equal(tickRes.newDay, 2)
      assert.equal(tickRes.state.currentDay, 2)
      assert.ok(tickRes.resourceDelta, "Tick trả về resourceDelta hợp lệ")
      assert.ok(tickRes.phaseLogs.length === 6, "Chạy đủ 6 phase")

      const phase2Log = tickRes.phaseLogs.find((p) => p.phaseIndex === 2)
      assert.ok(phase2Log, "Phase 2 log tồn tại")

      const phase3Log = tickRes.phaseLogs.find((p) => p.phaseIndex === 3)
      assert.ok(phase3Log, "Phase 3 log tồn tại")
      assert.ok(phase3Log?.changesApplied.some((msg) => msg.includes("Economy produced")))
    })

    it("E.2. Tính tất định 100%: Hai chuỗi mô phỏng kinh tế & hậu cần cùng seed cho kết quả giống hệt nhau", () => {
      const stateA = createInitialWorldState(4499)
      const stateB = createInitialWorldState(4499)

      for (let i = 0; i < 20; i++) {
        executeWorldTick(stateA)
        executeWorldTick(stateB)
      }

      assert.equal(
        stateA.resources.food,
        stateB.resources.food,
        "Tài nguyên Food giống hệt nhau sau 20 ticks"
      )
      assert.equal(
        stateA.resources.industrialMaterials,
        stateB.resources.industrialMaterials,
        "Vật liệu giống hệt nhau"
      )
      assert.equal(
        stateA.demographics.nationalTotalPopulation,
        stateB.demographics.nationalTotalPopulation,
        "Dân số quốc gia giống hệt nhau"
      )
      assert.equal(
        stateA.demographics.civilianCasualties,
        stateB.demographics.civilianCasualties,
        "Thương vong dân sự giống hệt nhau"
      )
    })

    it("E.3. World State sau khi tính toán kinh tế lưu và nạp lại an toàn với World Storage", () => {
      const state = createInitialWorldState()
      executeWorldTick(state)

      const saveRes = saveWorldState(state)
      assert.equal(saveRes.success, true)

      const loadRes = loadWorldState()
      assert.equal(loadRes.status, "loaded_primary")
      assert.equal(loadRes.checksumVerified, true)
      assert.equal(loadRes.state.resources.food, state.resources.food)
      assert.equal(
        loadRes.state.demographics.nationalTotalPopulation,
        state.demographics.nationalTotalPopulation
      )
    })
  })
})
