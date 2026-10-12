/**
 * STARFRONT WORLD — Demographics & Migration Engine (Phase 6.4)
 * Quản lý dân số quốc gia vs dân số vùng kiểm soát, dân sự bị chiếm đóng
 * (Suppressed Population), di cư tị nạn và quy tắc bảo toàn dân cư (Zero-Sum Migration).
 */

import { findShortestPath } from "./graph"
import { calculatePathAttritionRate } from "./logistics"
import type {
  DemographicsState,
  InFlightTransaction,
  WorldSector,
  WorldState,
} from "./types"

/**
 * Tỷ lệ tăng dân số tự nhiên hàng ngày khi sector ở trạng thái Thịnh Vượng (Stability >= 80 & Đủ lương thực)
 * 0.05% / ngày (50 người trên 100,000 dân)
 */
export const PROSPERITY_DAILY_GROWTH_RATE = 0.0005

/**
 * Tỷ lệ tổn thất dân sự khi di tản qua cung đường Hazardous mà không có hộ tống (10%)
 */
export const HAZARDOUS_MIGRATION_CASUALTY_RATE = 0.1

export interface CivilianMigrationConvoy {
  migrationId: string
  transactionId: string
  fromSectorId: string
  toSectorId: string
  civilianCount: number
  path: string[]
  totalDistance: number
  remainingDays: number
  casualtyRate: number
  status: "in_transit" | "arrived" | "dispersed"
}

export interface DemographicsCycleReport {
  naturalGrowth: number
  migrantsArrived: number
  migrationCasualties: number
  activeMigrationConvoysCount: number
  controlledPopulation: number
  nationalPopulation: number
  isConservationBalanced: boolean
}

/**
 * Kiểm tra và tính toán lại các chỉ số nhân khẩu học tổng thể từ toàn bộ các Sector
 * Bảo đảm quy tắc bảo toàn dân cư Zero-Sum Conservation
 */
export function recalculateDemographicsTotals(
  state: WorldState
): {
  sumSectorsPopulation: number
  controlledTerritoryPopulation: number
  nationalTotalPopulation: number
  isBalanced: boolean
} {
  let sumSectorsPopulation = 0
  let controlledPop = 0

  for (const sector of Object.values(state.sectors)) {
    const pop = Math.max(0, sector.population)
    sumSectorsPopulation += pop
    if (sector.sovereignty === "vss") {
      controlledPop += pop
    }
  }

  state.demographics.controlledTerritoryPopulation = controlledPop

  // Kiểm tra tính bảo toàn:
  // Tổng = Dân số tại các sector + Dân số đang di tản + Thương vong tích lũy
  const calculatedGalaxyTotal =
    sumSectorsPopulation +
    state.demographics.refugeesInTransit +
    state.demographics.civilianCasualties

  const isBalanced =
    Math.abs(calculatedGalaxyTotal - state.demographics.nationalTotalPopulation) <= 5

  return {
    sumSectorsPopulation,
    controlledTerritoryPopulation: controlledPop,
    nationalTotalPopulation: state.demographics.nationalTotalPopulation,
    isBalanced,
  }
}

/**
 * Khởi tạo lệnh sơ tán hoặc di cư dân sự giữa 2 Sector
 * Tuân thủ quy tắc bảo toàn: Dân số được trừ khỏi sector đi và cộng vào refugeesInTransit
 */
export function dispatchCivilianMigration(
  state: WorldState,
  fromSectorId: string,
  toSectorId: string,
  requestedCount: number
): { success: boolean; convoy?: CivilianMigrationConvoy; reason?: string } {
  if (fromSectorId === toSectorId) {
    return { success: false, reason: "Source and destination sectors are identical" }
  }

  const fromSector = state.sectors[fromSectorId]
  const toSector = state.sectors[toSectorId]

  if (!fromSector || !toSector) {
    return { success: false, reason: "Invalid sector ID" }
  }

  // Phải giữ lại tối thiểu 1,000 dân hoặc 5% dân số tại sector xuất phát nếu là sector VSS
  const minimumRemaining = fromSector.sovereignty === "vss" ? 1000 : 0
  const availableToMigrate = Math.max(0, fromSector.population - minimumRemaining)

  if (availableToMigrate <= 0) {
    return { success: false, reason: "No population available to migrate" }
  }

  const civilianCount = Math.min(requestedCount, availableToMigrate)
  if (civilianCount <= 0) {
    return { success: false, reason: "Civilian count must be greater than zero" }
  }

  // Kiểm tra đường đi qua đồ thị (Không cho phép đi qua tuyến đường Blocked hoặc Offline)
  const pathResult = findShortestPath(
    state.sectors,
    state.routes,
    fromSectorId,
    toSectorId,
    { allowBlocked: false, allowOffline: false, allowHazardous: true }
  )

  if (!pathResult || !pathResult.traversable || pathResult.path.length <= 1) {
    return {
      success: false,
      reason: "No traversable route available for migration (lanes are blocked or severed)",
    }
  }

  const totalDays = Math.max(1, Math.round(pathResult.totalDistance))
  const pathAttrition = calculatePathAttritionRate(state.routes, pathResult.path)
  const casualtyRate = pathAttrition > 0 ? HAZARDOUS_MIGRATION_CASUALTY_RATE : 0

  // 1. Trừ dân số khỏi sector đi
  fromSector.population -= civilianCount
  if (fromSector.sovereignty === "vss") {
    state.demographics.controlledTerritoryPopulation -= civilianCount
  }

  // 2. Chuyển sang trạng thái refugeesInTransit
  state.demographics.refugeesInTransit += civilianCount

  const migrationId = `mig_${state.currentDay}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`
  const transactionId = `tx_migration_${migrationId}`

  const convoy: CivilianMigrationConvoy = {
    migrationId,
    transactionId,
    fromSectorId,
    toSectorId,
    civilianCount,
    path: pathResult.path,
    totalDistance: pathResult.totalDistance,
    remainingDays: totalDays,
    casualtyRate,
    status: "in_transit",
  }

  const inFlightTx: InFlightTransaction = {
    transactionId,
    type: "force_deployment", // Lưu theo dạng di chuyển trong InFlight
    sectorId: fromSectorId,
    payload: convoy,
    status: "pending",
    createdAt: Date.now(),
  }

  state.inFlightTransactions[transactionId] = inFlightTx

  return { success: true, convoy }
}

/**
 * Xử lý tiến trình di chuyển của các đoàn di cư dân sự trong 1 tick:
 * Khi đến nơi: Trừ refugeesInTransit, cộng casualties (nếu có), cộng phần còn lại vào toSector.population
 */
export function advanceCivilianMigrations(state: WorldState): {
  arrivedMigrants: number
  casualties: number
  convoysArrived: CivilianMigrationConvoy[]
} {
  let arrivedMigrants = 0
  let casualties = 0
  const convoysArrived: CivilianMigrationConvoy[] = []

  for (const [txId, tx] of Object.entries(state.inFlightTransactions)) {
    if (tx.status !== "pending") continue

    const convoy = tx.payload as CivilianMigrationConvoy
    if (!convoy || !convoy.migrationId || convoy.status !== "in_transit") {
      continue
    }

    convoy.remainingDays -= 1

    if (convoy.remainingDays <= 0) {
      // Đoàn di cư đã tới nơi!
      const targetSector = state.sectors[convoy.toSectorId]
      const loss = Math.round(convoy.civilianCount * convoy.casualtyRate)
      const survivors = Math.max(0, convoy.civilianCount - loss)

      convoy.status = "arrived"
      tx.status = "committed"

      if (!state.committedTransactionIds.includes(txId)) {
        state.committedTransactionIds.push(txId)
      }

      // 1. Trừ số người khỏi refugeesInTransit
      state.demographics.refugeesInTransit = Math.max(
        0,
        state.demographics.refugeesInTransit - convoy.civilianCount
      )

      // 2. Ghi nhận thương vong nếu có
      if (loss > 0) {
        state.demographics.civilianCasualties += loss
        casualties += loss
      }

      // 3. Nhập cư vào sector đích
      if (targetSector) {
        targetSector.population += survivors
        if (targetSector.sovereignty === "vss") {
          state.demographics.controlledTerritoryPopulation += survivors
        }
      }

      arrivedMigrants += survivors
      convoysArrived.push(convoy)

      delete state.inFlightTransactions[txId]
    }
  }

  return { arrivedMigrants, casualties, convoysArrived }
}

/**
 * Tăng trưởng dân số tự nhiên tại các sector VSS có Stability cao và dồi dào lương thực
 * Đồng bộ hóa toàn diện giữa Sector Pop, Controlled Pop và National Total Pop
 */
export function processNaturalPopulationGrowth(state: WorldState): number {
  let totalGrowth = 0

  for (const sector of Object.values(state.sectors)) {
    if (
      sector.sovereignty === "vss" &&
      sector.stage === "normal" &&
      sector.stability >= 80 &&
      sector.resources.food > 300
    ) {
      const growth = Math.round(sector.population * PROSPERITY_DAILY_GROWTH_RATE)
      if (growth > 0) {
        sector.population += growth
        totalGrowth += growth
      }
    }
  }

  if (totalGrowth > 0) {
    state.demographics.controlledTerritoryPopulation += totalGrowth
    state.demographics.nationalTotalPopulation += totalGrowth
  }

  return totalGrowth
}

/**
 * Xử lý toàn bộ chu kỳ nhân khẩu học trong 1 tick chiến lược:
 * 1. Di chuyển các đoàn tị nạn / di cư đang hành trình
 * 2. Tăng trưởng dân số tự nhiên nếu có điều kiện thịnh vượng
 * 3. Tái tính toán và kiểm tra tính bảo toàn dân cư
 */
export function processDemographicsCycle(state: WorldState): DemographicsCycleReport {
  // 1. Cập nhật di cư
  const migrationResult = advanceCivilianMigrations(state)

  // 2. Tăng trưởng tự nhiên
  const naturalGrowth = processNaturalPopulationGrowth(state)

  // 3. Tái kiểm tra tính bảo toàn
  const { isBalanced, controlledTerritoryPopulation, nationalTotalPopulation } =
    recalculateDemographicsTotals(state)

  let activeMigrationConvoysCount = 0
  for (const tx of Object.values(state.inFlightTransactions)) {
    const convoy = tx.payload as CivilianMigrationConvoy
    if (convoy && convoy.migrationId && convoy.status === "in_transit") {
      activeMigrationConvoysCount++
    }
  }

  return {
    naturalGrowth,
    migrantsArrived: migrationResult.arrivedMigrants,
    migrationCasualties: migrationResult.casualties,
    activeMigrationConvoysCount,
    controlledPopulation: controlledTerritoryPopulation,
    nationalPopulation: nationalTotalPopulation,
    isConservationBalanced: isBalanced,
  }
}
