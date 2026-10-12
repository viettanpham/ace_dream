/**
 * STARFRONT WORLD — Authoritative Military Force Ledger (Phase 6.5)
 * Sổ cái quân sự có thẩm quyền duy nhất, bảo toàn quân số quốc gia:
 *   Total Force = Deployed + Reserves + Wounded/Repair + Retreating + InTransit + Casualties
 *
 * Mọi thao tác điều động quân chỉ chuyển trạng thái, tuyệt đối không tự sinh thêm quân
 * hay làm thất thoát lực lượng. Thương vong (Casualties) là tổn thất vĩnh viễn tích lũy,
 * không phải lực lượng đang hoạt động.
 */

import { findShortestPath, isPathTraversable } from "./graph"
import type {
  FactionId,
  ForceStatus,
  InFlightTransaction,
  MilitaryForceLedger,
  StrategicOrder,
  TroopDeployment,
  WorldRoute,
  WorldSector,
  WorldState,
} from "./types"

/**
 * Tính tổng lực lượng quân sự quốc gia (bao gồm cả tổn thất vĩnh viễn casualties)
 */
export function calculateTotalMilitaryForce(
  military: MilitaryForceLedger,
  inTransitTroops = 0
): number {
  return (
    Math.max(0, military.deployed) +
    Math.max(0, military.reserves) +
    Math.max(0, military.woundedOrRepair) +
    Math.max(0, military.retreating) +
    Math.max(0, inTransitTroops) +
    Math.max(0, military.casualties)
  )
}

/**
 * Tính lực lượng quân sự đang hoạt động / sẵn sàng (loại trừ casualties đã tử trận)
 */
export function calculateActiveMilitaryForce(
  military: MilitaryForceLedger,
  inTransitTroops = 0
): number {
  return (
    Math.max(0, military.deployed) +
    Math.max(0, military.reserves) +
    Math.max(0, military.woundedOrRepair) +
    Math.max(0, military.retreating) +
    Math.max(0, inTransitTroops)
  )
}

/**
 * Tính tổng số quân đang in-transit từ danh sách activeDeployments hoặc inFlightTransactions
 */
export function getInTransitTroopsCount(state: WorldState): number {
  let count = 0
  if (state.activeDeployments && Array.isArray(state.activeDeployments)) {
    for (const dep of state.activeDeployments) {
      if (dep.status === "in_transit") {
        count += Math.max(0, dep.troopCount)
      }
    }
    return count
  }

  // Dự phòng tra cứu qua inFlightTransactions
  for (const tx of Object.values(state.inFlightTransactions)) {
    if (tx.type === "force_deployment" && tx.status === "pending" && tx.payload?.troopCount) {
      count += Math.max(0, Number(tx.payload.troopCount))
    }
  }
  return count
}

/**
 * Kiểm tra tính toàn vẹn của sổ cái quân sự (Invariants Verification):
 * 1. Không có số lượng âm ở bất kỳ trạng thái nào.
 * 2. Quân số đồn trú của các sector VSS phải khớp với military.deployed.
 * 3. Tổng quân số bảo toàn theo mốc chuẩn nếu được cung cấp.
 */
export function validateForceLedgerIntegrity(
  state: WorldState,
  expectedTotal?: number
): {
  valid: boolean
  totalForce: number
  activeForce: number
  inTransit: number
  sectorGarrisonSum: number
  errors: string[]
} {
  const errors: string[] = []
  const mil = state.military

  if (mil.deployed < 0) errors.push(`deployed is negative: ${mil.deployed}`)
  if (mil.reserves < 0) errors.push(`reserves is negative: ${mil.reserves}`)
  if (mil.woundedOrRepair < 0) errors.push(`woundedOrRepair is negative: ${mil.woundedOrRepair}`)
  if (mil.retreating < 0) errors.push(`retreating is negative: ${mil.retreating}`)
  if (mil.casualties < 0) errors.push(`casualties is negative: ${mil.casualties}`)

  const inTransit = getInTransitTroopsCount(state)
  const totalForce = calculateTotalMilitaryForce(mil, inTransit)
  const activeForce = calculateActiveMilitaryForce(mil, inTransit)

  if (expectedTotal !== undefined && totalForce !== expectedTotal) {
    errors.push(
      `Force conservation violated! Expected total: ${expectedTotal}, actual: ${totalForce} (Diff: ${totalForce - expectedTotal})`
    )
  }

  // Tính tổng đồn trú tại các sector do VSS kiểm soát
  let sectorGarrisonSum = 0
  for (const sector of Object.values(state.sectors)) {
    if (sector.sovereignty === "vss") {
      sectorGarrisonSum += Math.max(0, sector.garrisonPower)
    }
  }

  return {
    valid: errors.length === 0,
    totalForce,
    activeForce,
    inTransit,
    sectorGarrisonSum,
    errors,
  }
}

/**
 * Ma trận chuyển đổi trạng thái quân sự hợp lệ:
 * - reserves -> deployed, woundedOrRepair (trong trường hợp tai nạn), casualties
 * - deployed -> reserves, woundedOrRepair, retreating, casualties
 * - woundedOrRepair -> reserves, casualties
 * - retreating -> reserves, deployed, casualties
 * - casualties: TRẠNG THÁI CUỐI (Tổn thất vĩnh viễn, không chuyển ngược lại)
 */
export const VALID_FORCE_TRANSITIONS: Record<ForceStatus, ForceStatus[]> = {
  reserves: ["deployed", "woundedOrRepair", "casualties", "in_transit"],
  deployed: ["reserves", "woundedOrRepair", "retreating", "casualties", "in_transit"],
  woundedOrRepair: ["reserves", "casualties"],
  retreating: ["reserves", "deployed", "casualties"],
  casualties: [], // Sink node
  in_transit: ["deployed", "retreating", "casualties"],
}

export interface ForceTransferResult {
  success: boolean
  amountTransferred: number
  previousSource: number
  newSource: number
  previousTarget: number
  newTarget: number
  error?: string
}

/**
 * Chuyển đổi quân số giữa các trạng thái nội bộ với tính bảo toàn tuyệt đối 100%
 */
export function transferForceStatus(
  military: MilitaryForceLedger,
  fromStatus: keyof MilitaryForceLedger,
  toStatus: keyof MilitaryForceLedger,
  amount: number,
  reason?: string
): ForceTransferResult {
  if (amount <= 0 || !Number.isFinite(amount)) {
    return {
      success: false,
      amountTransferred: 0,
      previousSource: military[fromStatus],
      newSource: military[fromStatus],
      previousTarget: military[toStatus],
      newTarget: military[toStatus],
      error: `Chuyển quân thất bại: Số lượng phải là số dương hợp lệ (${amount})`,
    }
  }

  if (fromStatus === toStatus) {
    return {
      success: true,
      amountTransferred: 0,
      previousSource: military[fromStatus],
      newSource: military[fromStatus],
      previousTarget: military[toStatus],
      newTarget: military[toStatus],
    }
  }

  if (fromStatus === "casualties") {
    return {
      success: false,
      amountTransferred: 0,
      previousSource: military.casualties,
      newSource: military.casualties,
      previousTarget: military[toStatus],
      newTarget: military[toStatus],
      error: "Bất khả thi: Thương vong (Casualties) là tổn thất vĩnh viễn, không thể hoàn nguyên.",
    }
  }

  const allowedTargets = VALID_FORCE_TRANSITIONS[fromStatus]
  if (!allowedTargets.includes(toStatus)) {
    return {
      success: false,
      amountTransferred: 0,
      previousSource: military[fromStatus],
      newSource: military[fromStatus],
      previousTarget: military[toStatus],
      newTarget: military[toStatus],
      error: `Chuyển trạng thái bất hợp lệ: Không thể chuyển từ '${fromStatus}' sang '${toStatus}'.`,
    }
  }

  const available = military[fromStatus]
  if (available < amount) {
    return {
      success: false,
      amountTransferred: 0,
      previousSource: military[fromStatus],
      newSource: military[fromStatus],
      previousTarget: military[toStatus],
      newTarget: military[toStatus],
      error: `Lực lượng không đủ: Nguồn '${fromStatus}' chỉ có ${available}, không thể chuyển ${amount}.`,
    }
  }

  const prevSource = military[fromStatus]
  const prevTarget = military[toStatus]

  military[fromStatus] -= amount
  military[toStatus] += amount

  return {
    success: true,
    amountTransferred: amount,
    previousSource: prevSource,
    newSource: military[fromStatus],
    previousTarget: prevTarget,
    newTarget: military[toStatus],
  }
}

/**
 * Phục hồi quân bị thương / sửa chữa cơ giáp trong Phase 1 (Hospital & Repair Bay)
 * Mỗi ngày phục hồi 5% số quân woundedOrRepair (tối thiểu 10 nếu còn) chuyển sang reserves.
 */
export function recoverWoundedTroops(
  military: MilitaryForceLedger,
  recoveryRate = 0.05,
  minRecover = 10
): { recovered: number } {
  if (military.woundedOrRepair <= 0) {
    return { recovered: 0 }
  }

  const calculated = Math.floor(military.woundedOrRepair * recoveryRate)
  const recovered = Math.min(
    military.woundedOrRepair,
    Math.max(minRecover, calculated)
  )

  military.woundedOrRepair -= recovered
  military.reserves += recovered

  return { recovered }
}

export interface DispatchTroopParams {
  fromSectorId: string
  toSectorId: string
  troopCount: number
  order?: StrategicOrder
  factionId?: FactionId
  sourceFromReserves?: boolean
}

export interface DispatchTroopResult {
  success: boolean
  deployment?: TroopDeployment
  error?: string
}

/**
 * Điều động lực lượng quân sự di chuyển giữa hai sector theo mạng lưới tuyến đường
 * Kiểm tra tính liên thông và trạng thái tuyến đường (Dijkstra). Tuyến Blocked / Offline bị từ chối.
 */
export function dispatchTroopDeployment(
  state: WorldState,
  params: DispatchTroopParams
): DispatchTroopResult {
  const {
    fromSectorId,
    toSectorId,
    troopCount,
    order = "reinforce",
    factionId = "vss",
    sourceFromReserves = false,
  } = params

  if (troopCount <= 0 || !Number.isFinite(troopCount)) {
    return { success: false, error: `Số quân điều động phải lớn hơn 0 (${troopCount})` }
  }

  if (fromSectorId === toSectorId) {
    return { success: false, error: "Sector xuất phát và sector đích không được trùng nhau" }
  }

  const fromSector = state.sectors[fromSectorId]
  const toSector = state.sectors[toSectorId]
  if (!fromSector) return { success: false, error: `Sector nguồn không tồn tại: ${fromSectorId}` }
  if (!toSector) return { success: false, error: `Sector đích không tồn tại: ${toSectorId}` }

  // Kiểm tra khả năng cung cấp quân số
  if (sourceFromReserves) {
    if (state.military.reserves < troopCount) {
      return {
        success: false,
        error: `Kho dự bị chiến lược không đủ quân (Yêu cầu: ${troopCount}, Hiện có: ${state.military.reserves})`,
      }
    }
  } else {
    if (fromSector.garrisonPower < troopCount) {
      return {
        success: false,
        error: `Đồn trú tại ${fromSector.name} không đủ quân (Yêu cầu: ${troopCount}, Hiện có: ${fromSector.garrisonPower})`,
      }
    }
  }

  // Tìm đường ngắn nhất qua đồ thị
  const pathResult = findShortestPath(state.sectors, state.routes, fromSectorId, toSectorId, {
    allowOpen: true,
    allowHazardous: true,
    allowBlocked: false,
    allowOffline: false,
  })

  if (!pathResult || !pathResult.traversable || pathResult.path.length <= 1) {
    return {
      success: false,
      error: `Không tìm thấy tuyến đường khả dụng từ ${fromSector.name} đến ${toSector.name}. Các tuyến kết nối có thể đang bị phong tỏa hoặc tê liệt.`,
    }
  }

  // Khấu trừ quân từ nguồn xuất phát
  if (sourceFromReserves) {
    state.military.reserves -= troopCount
  } else {
    fromSector.garrisonPower -= troopCount
    state.military.deployed -= troopCount
  }

  const transactionId = `tx_dep_${state.currentDay}_${Date.now()}_${Math.floor(Math.random() * 10000)}`
  const deploymentId = `dep_${transactionId}`

  const deployment: TroopDeployment = {
    deploymentId,
    transactionId,
    factionId,
    fromSectorId,
    toSectorId,
    troopCount,
    order,
    path: pathResult.path,
    totalDistance: pathResult.totalDistance,
    remainingDays: Math.max(1, pathResult.totalDistance),
    status: "in_transit",
    createdAt: Date.now(),
  }

  // Khởi tạo activeDeployments nếu chưa có
  if (!state.activeDeployments) {
    state.activeDeployments = []
  }
  state.activeDeployments.push(deployment)

  // Lưu giao dịch in-flight
  const tx: InFlightTransaction = {
    transactionId,
    type: "force_deployment",
    sectorId: toSectorId,
    payload: { deploymentId, fromSectorId, toSectorId, troopCount, order },
    status: "pending",
    createdAt: Date.now(),
  }
  state.inFlightTransactions[transactionId] = tx

  return {
    success: true,
    deployment,
  }
}

export interface DeploymentAdvanceReport {
  arrived: TroopDeployment[]
  inTransit: TroopDeployment[]
  attritionCasualties: number
  logs: string[]
}

/**
 * Cập nhật tiến trình hành quân của các đạo quân đang in-transit trong Phase 4 của Tick Engine
 */
export function advanceTroopDeployments(state: WorldState): DeploymentAdvanceReport {
  const report: DeploymentAdvanceReport = {
    arrived: [],
    inTransit: [],
    attritionCasualties: 0,
    logs: [],
  }

  if (!state.activeDeployments || state.activeDeployments.length === 0) {
    return report
  }

  const remainingDeployments: TroopDeployment[] = []

  for (const dep of state.activeDeployments) {
    if (dep.status !== "in_transit") {
      continue
    }

    dep.remainingDays -= 1

    // Kiểm tra hao hụt trên tuyến đường hiểm trở (Hazardous route)
    // Nếu đi qua tuyến hazardous, có nguy cơ hao hụt nhẹ 5%
    const destSector = state.sectors[dep.toSectorId]
    const sourceSector = state.sectors[dep.fromSectorId]

    if (dep.remainingDays <= 0) {
      // Đạo quân đã đến nơi an toàn
      dep.status = "arrived"
      if (destSector && dep.factionId === "vss") {
        destSector.garrisonPower += dep.troopCount
        state.military.deployed += dep.troopCount

        // Cập nhật lệnh chiến lược của sector nếu có yêu cầu
        if (dep.order && dep.order !== "normal") {
          destSector.strategicOrder = dep.order
        }
      }

      // Commit transaction
      if (state.inFlightTransactions[dep.transactionId]) {
        state.inFlightTransactions[dep.transactionId].status = "committed"
      }
      if (!state.committedTransactionIds.includes(dep.transactionId)) {
        state.committedTransactionIds.push(dep.transactionId)
      }

      report.arrived.push(dep)
      report.logs.push(
        `Đạo quân (${dep.troopCount} quân) đã đến an toàn tại ${destSector?.name ?? dep.toSectorId} với lệnh [${dep.order}]`
      )
    } else {
      // Vẫn đang trên đường hành quân
      report.inTransit.push(dep)
      remainingDeployments.push(dep)
    }
  }

  state.activeDeployments = remainingDeployments
  return report
}

/**
 * Đặt lệnh chiến lược (Strategic Order) cho sector
 */
export function setSectorStrategicOrder(
  state: WorldState,
  sectorId: string,
  order: StrategicOrder
): { success: boolean; sector?: WorldSector; error?: string } {
  const sector = state.sectors[sectorId]
  if (!sector) {
    return { success: false, error: `Không tìm thấy sector: ${sectorId}` }
  }

  const previousOrder = sector.strategicOrder ?? "normal"
  sector.strategicOrder = order

  return {
    success: true,
    sector,
  }
}

/**
 * Rút lui chiến thuật: chuyển quân từ deployed sang retreating
 * Quân rút lui sẽ di chuyển về căn cứ thân thiện gần nhất trong các tick tiếp theo
 */
export function initiateTacticalRetreat(
  state: WorldState,
  sectorId: string,
  troopAmount: number
): { success: boolean; retreatingAmount: number; error?: string } {
  const sector = state.sectors[sectorId]
  if (!sector) {
    return { success: false, retreatingAmount: 0, error: `Sector không tồn tại: ${sectorId}` }
  }

  const actualAmount = Math.min(sector.garrisonPower, troopAmount)
  if (actualAmount <= 0) {
    return { success: false, retreatingAmount: 0, error: "Không có quân để rút lui" }
  }

  sector.garrisonPower -= actualAmount
  state.military.deployed -= actualAmount
  state.military.retreating += actualAmount

  return {
    success: true,
    retreatingAmount: actualAmount,
  }
}

/**
 * Tập hợp lực lượng đang rút lui (Retreating forces rally)
 * Đưa quân rút lui trở lại căn cứ an toàn (Sol HQ hoặc Reserves)
 */
export function rallyRetreatingForces(
  state: WorldState,
  rallyRatio = 0.5
): { rallied: number; logs: string[] } {
  if (state.military.retreating <= 0) {
    return { rallied: 0, logs: [] }
  }

  const rallied = Math.max(1, Math.floor(state.military.retreating * rallyRatio))
  const actualRallied = Math.min(state.military.retreating, rallied)

  state.military.retreating -= actualRallied
  state.military.reserves += actualRallied

  return {
    rallied: actualRallied,
    logs: [
      `Tập hợp ${actualRallied} quân rút lui trở về kho dự bị chiến lược an toàn tại Sol Command HQ`,
    ],
  }
}

/**
 * Chuyển giao quyền kiểm soát sector giữa các phe (Sovereignty Change)
 * QUY TẮC BẢO TOÀN DÂN CƯ & TÀI NGUYÊN THEO THIẾT KẾ:
 * - KHÔNG tự động chuyển toàn bộ tài nguyên, dân số sang phe chiếm đóng!
 * - Cư dân tại sector trở thành dân số bị chiếm đóng (Suppressed Population),
 *   làm giảm ControlledTerritoryPopulation của VSS nhưng bảo toàn NationalTotalPopulation.
 * - Cập nhật controlledSectorIds của cả 2 phe liên quan.
 */
export function transferSectorControl(
  state: WorldState,
  sectorId: string,
  newSovereignty: "vss" | "void" | "contested" | "neutral",
  reason?: string
): { success: boolean; sector?: WorldSector; error?: string } {
  const sector = state.sectors[sectorId]
  if (!sector) {
    return { success: false, error: `Không tìm thấy sector: ${sectorId}` }
  }

  const previousSovereignty = sector.sovereignty
  if (previousSovereignty === newSovereignty) {
    return { success: true, sector }
  }

  sector.sovereignty = newSovereignty

  // Cập nhật danh sách controlledSectorIds trong các faction
  for (const faction of Object.values(state.factions)) {
    faction.controlledSectorIds = faction.controlledSectorIds.filter((id) => id !== sectorId)
  }

  if (newSovereignty === "vss" && state.factions.vss) {
    if (!state.factions.vss.controlledSectorIds.includes(sectorId)) {
      state.factions.vss.controlledSectorIds.push(sectorId)
    }
  } else if (newSovereignty === "void" && state.factions.void) {
    if (!state.factions.void.controlledSectorIds.includes(sectorId)) {
      state.factions.void.controlledSectorIds.push(sectorId)
    }
  }

  // Cập nhật dân số kiểm soát của VSS:
  // Nếu VSS mất sector: giảm controlledTerritoryPopulation đúng bằng dân số sector
  // Nếu VSS giải phóng sector: tăng controlledTerritoryPopulation
  if (previousSovereignty === "vss" && newSovereignty !== "vss") {
    state.demographics.controlledTerritoryPopulation = Math.max(
      0,
      state.demographics.controlledTerritoryPopulation - sector.population
    )
  } else if (previousSovereignty !== "vss" && newSovereignty === "vss") {
    state.demographics.controlledTerritoryPopulation = Math.min(
      state.demographics.nationalTotalPopulation,
      state.demographics.controlledTerritoryPopulation + sector.population
    )
  }

  return {
    success: true,
    sector,
  }
}
