/**
 * STARFRONT WORLD — Strategic Logistics Network (Phase 6.4)
 * Điều phối chuỗi cung ứng tự động, bảo vệ mức tồn kho an toàn (Safety Stock Buffer),
 * quản lý đoàn vận tải đang hành trình (In-Transit Convoys) và xử lý hao hụt (Attrition)
 * qua các tuyến đường hiểm trở (Hazardous Routes).
 */

import { findShortestPath } from "./graph"
import { calculateDailyFoodConsumption } from "./economy"
import type {
  InFlightTransaction,
  RouteState,
  WorldResourceLedger,
  WorldSector,
  WorldState,
} from "./types"

/**
 * Thứ tự ưu tiên điều phối hậu cần khi nhiều sector đồng thời thiếu hàng:
 * 1. Cứu đói (Food)
 * 2. Phòng thủ (Energy / Khiên plasma)
 * 3. Quân sự (Logistics Supplies / Đạn dược)
 * 4. Công nghiệp (Industrial Materials)
 * 5. Tình báo (Tactical Data)
 */
export const LOGISTICS_RESOURCE_PRIORITY: (keyof WorldResourceLedger)[] = [
  "food",
  "energy",
  "logisticsSupplies",
  "industrialMaterials",
  "tacticalData",
]

/**
 * Số ngày tồn kho an toàn tối thiểu mà sector nguồn bắt buộc phải giữ lại
 * (Safety Stock Buffer = 3 * DailyConsumption)
 */
export const SAFETY_BUFFER_DAYS = 3

/**
 * Tỷ lệ hao hụt tài nguyên chuẩn khi vận chuyển qua tuyến đường Hazardous (20%)
 */
export const HAZARDOUS_ROUTE_ATTRITION_RATE = 0.2

export interface LogisticsConvoy {
  convoyId: string
  transactionId: string
  fromSectorId: string
  toSectorId: string
  resourceType: keyof WorldResourceLedger
  dispatchedAmount: number
  deliveredAmount?: number
  path: string[]
  totalDistance: number
  remainingDays: number
  attritionRate: number
  status: "in_transit" | "delivered" | "intercepted" | "cancelled"
}

export interface LogisticsCycleReport {
  convoysDispatched: LogisticsConvoy[]
  convoysArrived: LogisticsConvoy[]
  totalCargoDelivered: Partial<Record<keyof WorldResourceLedger, number>>
  totalCargoLostToAttrition: Partial<Record<keyof WorldResourceLedger, number>>
  activeConvoysCount: number
}

/**
 * Tính mức dự trữ an toàn (Safety Stock Buffer) của một sector đối với một loại tài nguyên
 */
export function calculateSafetyBuffer(
  sector: WorldSector,
  resourceType: keyof WorldResourceLedger
): number {
  if (resourceType === "food") {
    const dailyFood = calculateDailyFoodConsumption(sector.population)
    return dailyFood * SAFETY_BUFFER_DAYS
  }

  // Đối với các tài nguyên công nghiệp, năng lượng, quân sự:
  // Lấy mức cơ sở bằng 3 ngày duy trì (tối thiểu 100 hoặc tỷ lệ theo dung lượng công nghiệp)
  const baselineDaily = Math.max(
    30,
    Math.round(sector.industryCapacity * 0.15)
  )
  return baselineDaily * SAFETY_BUFFER_DAYS
}

/**
 * Tính lượng tài nguyên khả dụng có thể xuất khẩu từ sector (vượt mức Safety Buffer)
 */
export function calculateExportableSurplus(
  sector: WorldSector,
  resourceType: keyof WorldResourceLedger
): number {
  const safetyBuffer = calculateSafetyBuffer(sector, resourceType)
  const currentStock = sector.resources[resourceType] ?? 0
  return Math.max(0, currentStock - safetyBuffer)
}

/**
 * Tính tỷ lệ hao hụt trung bình trên toàn tuyến đường dựa trên các phân đoạn Hazardous
 */
export function calculatePathAttritionRate(
  routes: WorldState["routes"],
  path: string[]
): number {
  if (path.length <= 1) return 0

  let hazardousSegments = 0
  for (let i = 0; i < path.length - 1; i++) {
    const fromId = path[i]
    const toId = path[i + 1]
    const route = routes.find(
      (r) =>
        (r.fromSectorId === fromId && r.toSectorId === toId) ||
        (r.fromSectorId === toId && r.toSectorId === fromId)
    )
    if (route && route.state === "hazardous") {
      hazardousSegments++
    }
  }

  // Mỗi phân đoạn hiểm trở gây hao hụt tích lũy tối đa 20%
  if (hazardousSegments === 0) return 0
  return Math.min(0.5, hazardousSegments * HAZARDOUS_ROUTE_ATTRITION_RATE)
}

/**
 * Khởi tạo và xuất phát một chuyến hàng vận tải giữa hai sector
 */
export function dispatchLogisticsConvoy(
  state: WorldState,
  fromSectorId: string,
  toSectorId: string,
  resourceType: keyof WorldResourceLedger,
  requestedAmount: number
): { success: boolean; convoy?: LogisticsConvoy; reason?: string } {
  if (fromSectorId === toSectorId) {
    return { success: false, reason: "Source and destination sectors are identical" }
  }

  const fromSector = state.sectors[fromSectorId]
  const toSector = state.sectors[toSectorId]

  if (!fromSector || !toSector) {
    return { success: false, reason: "Invalid sector ID" }
  }

  // 1. Kiểm tra tồn kho khả dụng vượt ngưỡng an toàn
  const availableSurplus = calculateExportableSurplus(fromSector, resourceType)
  if (availableSurplus <= 0) {
    return {
      success: false,
      reason: "No surplus above safety buffer available for export",
    }
  }

  const amountToShip = Math.min(requestedAmount, availableSurplus)
  if (amountToShip <= 0) {
    return { success: false, reason: "Dispatch amount must be greater than zero" }
  }

  // 2. Tìm đường đi ngắn nhất qua đồ thị
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
      reason: "No traversable route available (routes are blocked, severed or nonexistent)",
    }
  }

  // Tính thời gian hành quân (1 ngày cho mỗi đơn vị khoảng cách chuẩn, tối thiểu 1 ngày)
  const totalDays = Math.max(1, Math.round(pathResult.totalDistance))
  const attritionRate = calculatePathAttritionRate(state.routes, pathResult.path)

  // 3. Khấu trừ ngay lập tức khỏi kho sector xuất (Hàng chuyển sang trạng thái In-Transit)
  fromSector.resources[resourceType] -= amountToShip

  const convoyId = `convoy_${state.currentDay}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`
  const transactionId = `tx_logistics_${convoyId}`

  const convoy: LogisticsConvoy = {
    convoyId,
    transactionId,
    fromSectorId,
    toSectorId,
    resourceType,
    dispatchedAmount: amountToShip,
    path: pathResult.path,
    totalDistance: pathResult.totalDistance,
    remainingDays: totalDays,
    attritionRate,
    status: "in_transit",
  }

  // 4. Ghi nhận vào sổ cái giao dịch đang thực thi (InFlightTransaction)
  const inFlightTx: InFlightTransaction = {
    transactionId,
    type: "logistics_transfer",
    sectorId: fromSectorId,
    payload: convoy,
    status: "pending",
    createdAt: Date.now(),
  }

  state.inFlightTransactions[transactionId] = inFlightTx

  return { success: true, convoy }
}

/**
 * Xử lý tiến trình di chuyển của các đoàn vận tải đang trên đường trong 1 tick:
 * - Giảm thời gian di chuyển còn lại (remainingDays -= 1)
 * - Khi đến nơi (remainingDays <= 0): Áp dụng hao hụt và nhập hàng vào kho đích
 */
export function advanceInFlightConvoys(state: WorldState): {
  arrivedConvoys: LogisticsConvoy[]
  cargoDelivered: Partial<Record<keyof WorldResourceLedger, number>>
  cargoLost: Partial<Record<keyof WorldResourceLedger, number>>
} {
  const arrivedConvoys: LogisticsConvoy[] = []
  const cargoDelivered: Partial<Record<keyof WorldResourceLedger, number>> = {}
  const cargoLost: Partial<Record<keyof WorldResourceLedger, number>> = {}

  for (const [txId, tx] of Object.entries(state.inFlightTransactions)) {
    if (tx.type !== "logistics_transfer" || tx.status !== "pending") {
      continue
    }

    const convoy = tx.payload as LogisticsConvoy
    if (!convoy || convoy.status !== "in_transit") {
      continue
    }

    convoy.remainingDays -= 1

    if (convoy.remainingDays <= 0) {
      // Đoàn xe đã cập bến đích an toàn!
      const targetSector = state.sectors[convoy.toSectorId]
      const loss = Math.round(convoy.dispatchedAmount * convoy.attritionRate)
      const delivered = Math.max(0, convoy.dispatchedAmount - loss)

      convoy.deliveredAmount = delivered
      convoy.status = "delivered"
      tx.status = "committed"

      // Thêm mã giao dịch vào danh sách đã cam kết
      if (!state.committedTransactionIds.includes(txId)) {
        state.committedTransactionIds.push(txId)
      }

      // Nhập hàng vào kho đích nếu sector còn tồn tại
      if (targetSector) {
        targetSector.resources[convoy.resourceType] =
          (targetSector.resources[convoy.resourceType] ?? 0) + delivered
      }

      arrivedConvoys.push(convoy)

      cargoDelivered[convoy.resourceType] =
        (cargoDelivered[convoy.resourceType] ?? 0) + delivered
      if (loss > 0) {
        cargoLost[convoy.resourceType] =
          (cargoLost[convoy.resourceType] ?? 0) + loss
      }

      // Xóa khỏi danh sách inFlightTransactions đang pending
      delete state.inFlightTransactions[txId]
    }
  }

  return { arrivedConvoys, cargoDelivered, cargoLost }
}

/**
 * Tự động quét và điều phối hậu cần (Automated Logistics Balancing):
 * - Tìm các sector thiếu hụt lương thực hoặc năng lượng (< 2 ngày dự trữ)
 * - Ghép cặp với sector có thặng dư dồi dào trên mạng lưới đồ thị
 * - Tuân thủ thứ tự ưu tiên: Food -> Energy -> Supplies -> Materials -> Data
 */
export function processAutomatedLogisticsBalancing(
  state: WorldState
): LogisticsConvoy[] {
  const dispatchedConvoys: LogisticsConvoy[] = []

  // Quét theo thứ tự ưu tiên tài nguyên
  for (const resourceType of LOGISTICS_RESOURCE_PRIORITY) {
    // 1. Tìm các sector VSS đang thiếu hụt tài nguyên này (dưới mức dự trữ 2 ngày)
    const needySectors = Object.values(state.sectors).filter((s) => {
      if (s.sovereignty !== "vss") return false
      const safetyBuffer = calculateSafetyBuffer(s, resourceType)
      const currentStock = s.resources[resourceType] ?? 0
      // Cần hỗ trợ nếu kho hiện tại < 2 ngày sử dụng
      return currentStock < Math.round(safetyBuffer * 0.67)
    })

    if (needySectors.length === 0) continue

    // 2. Tìm các sector VSS có thặng dư khả dụng
    const surplusSectors = Object.values(state.sectors).filter((s) => {
      if (s.sovereignty !== "vss") return false
      return calculateExportableSurplus(s, resourceType) > 50
    })

    if (surplusSectors.length === 0) continue

    for (const targetSector of needySectors) {
      const neededAmount = Math.max(
        50,
        calculateSafetyBuffer(targetSector, resourceType) -
          (targetSector.resources[resourceType] ?? 0)
      )

      // Tìm sector nguồn gần nhất và có thặng dư
      let bestSource: WorldSector | null = null
      let shortestDist = Infinity

      for (const sourceSector of surplusSectors) {
        if (sourceSector.id === targetSector.id) continue
        const surplus = calculateExportableSurplus(sourceSector, resourceType)
        if (surplus < 30) continue

        const pathResult = findShortestPath(
          state.sectors,
          state.routes,
          sourceSector.id,
          targetSector.id,
          { allowBlocked: false, allowOffline: false, allowHazardous: true }
        )

        if (pathResult && pathResult.traversable && pathResult.totalDistance < shortestDist) {
          shortestDist = pathResult.totalDistance
          bestSource = sourceSector
        }
      }

      if (bestSource) {
        const shipAmount = Math.min(
          neededAmount,
          calculateExportableSurplus(bestSource, resourceType)
        )
        if (shipAmount >= 30) {
          const result = dispatchLogisticsConvoy(
            state,
            bestSource.id,
            targetSector.id,
            resourceType,
            shipAmount
          )
          if (result.success && result.convoy) {
            dispatchedConvoys.push(result.convoy)
          }
        }
      }
    }
  }

  return dispatchedConvoys
}

/**
 * Xử lý toàn bộ chu kỳ hậu cần trong 1 tick:
 * 1. Di chuyển các đoàn xe đang trên đường
 * 2. Kích hoạt điều phối tự động nếu có nhu cầu
 */
export function processLogisticsCycle(state: WorldState): LogisticsCycleReport {
  // 1. Cập nhật các chuyến hàng đang chạy
  const advanceResult = advanceInFlightConvoys(state)

  // 2. Tự động điều phối các chuyến hàng mới
  const dispatchedConvoys = processAutomatedLogisticsBalancing(state)

  // Đếm số lượng đoàn xe còn đang in-transit
  let activeConvoysCount = 0
  for (const tx of Object.values(state.inFlightTransactions)) {
    if (tx.type === "logistics_transfer" && tx.status === "pending") {
      activeConvoysCount++
    }
  }

  return {
    convoysDispatched: dispatchedConvoys,
    convoysArrived: advanceResult.arrivedConvoys,
    totalCargoDelivered: advanceResult.cargoDelivered,
    totalCargoLostToAttrition: advanceResult.cargoLost,
    activeConvoysCount,
  }
}
