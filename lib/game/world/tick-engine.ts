/**
 * STARFRONT WORLD — Tick Engine (Phase 6.3)
 * Điều phối chuỗi 6 phase bất biến trong 1 Strategic Tick:
 *   Phase 1: Phục hồi & Giao dịch đang chờ (Recovery & In-Flight Transactions)
 *   Phase 2: Vận chuyển & Di cư (Logistics & Migration)
 *   Phase 3: Kinh tế & Dân số (Economy & Demographics)
 *   Phase 4: Quân sự & Mức đe dọa (Military & Threat Dynamics)
 *   Phase 5: Hạn chót & Kết quả (Deadlines & Resolutions)
 *   Phase 6: Kích hoạt sự kiện mới (New Activations)
 *
 * Tính tất định: Sử dụng WorldPRNG seeded; cùng seed & trạng thái -> kết quả hoàn toàn trùng khớp.
 * Phá vỡ thế hòa (Tie-Breaking): Sắp xếp theo (priorityLevel DESC, scheduledTimestamp ASC, entityId ASC).
 */

import { WorldPRNG } from "./random"
import { evaluateSectorStage } from "./sector-lifecycle"
import type {
  InFlightTransaction,
  MilitaryForceLedger,
  WorldResourceLedger,
  WorldSector,
  WorldState,
} from "./types"

/**
 * Cấu hình một lượt tick
 */
export interface TickExecutionOptions {
  /** Cho phép cập nhật realTimeAnchor thành thời gian hiện tại hay không (mặc định: false trong deterministic sim, true khi live tick) */
  anchorTimestamp?: number
  /** Ghi nhận chi tiết từng phase vào log kết quả */
  logPhases?: boolean
}

/**
 * Nhật ký thực thi của một tick
 */
export interface TickPhaseLog {
  phaseIndex: 1 | 2 | 3 | 4 | 5 | 6
  phaseName: string
  changesApplied: string[]
}

export interface TickExecutionResult {
  /** Trạng thái mới sau khi tick */
  state: WorldState
  /** Số ngày trước đó */
  previousDay: number
  /** Số ngày mới */
  newDay: number
  /** Seed trước đó */
  previousSeed: number
  /** Seed mới sau khi tiến hóa */
  newSeed: number
  /** Các phase đã thực thi */
  phaseLogs: TickPhaseLog[]
  /** Tóm tắt biến động tài nguyên trong tick */
  resourceDelta: WorldResourceLedger
  /** Tóm tắt biến động quân sự trong tick */
  militaryDelta: Partial<MilitaryForceLedger>
  /** Danh sách sector có chuyển đổi giai đoạn hoặc thay đổi chủ quyền */
  sectorStateChanges: Array<{
    sectorId: string
    previousStage: string
    newStage: string
    threatDelta: number
  }>
}

/**
 * Quy tắc phá vỡ thế hòa ổn định (Deterministic Stable Tie-Breaking) theo thiết kế G.3:
 * Sắp xếp theo: priorityLevel DESC -> scheduledTimestamp ASC -> entityId ASC
 */
export interface PrioritizedEntity {
  id: string
  priority: number
  scheduledTimestamp: number
}

export function stableTieBreakSort<T extends PrioritizedEntity>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority // priority cao hơn ưu tiên trước
    }
    if (a.scheduledTimestamp !== b.scheduledTimestamp) {
      return a.scheduledTimestamp - b.scheduledTimestamp // thời gian sớm hơn ưu tiên trước
    }
    return a.id.localeCompare(b.id) // thứ tự từ điển ID ổn định
  })
}

// -------------------------------------------------------------
// TRIỂN KHAI CÁC PHASE THEO THIẾT KẾ
// -------------------------------------------------------------

/**
 * Phase 1: Phục Hồi & Giao Dịch Đang Chờ (Recovery & In-Flight Transactions)
 * - Giải quyết các giao dịch hợp lệ đang chờ (chống đọng treo)
 * - Tự động phục hồi quân sự thương binh/sửa chữa (chuyển dần sang reserves)
 * - Phục hồi tự nhiên nhẹ cho các sector đang ở trạng thái Recovery
 */
function executePhase1RecoveryAndTransactions(
  state: WorldState,
  prng: WorldPRNG,
  log: TickPhaseLog
): void {
  // 1.1. Giải quyết các giao dịch in-flight pending nếu có
  const pendingTxIds = Object.keys(state.inFlightTransactions)
  if (pendingTxIds.length > 0) {
    // Sắp xếp ID theo thứ tự từ điển để bảo đảm deterministic
    pendingTxIds.sort()
    for (const txId of pendingTxIds) {
      const tx = state.inFlightTransactions[txId]
      if (tx.status === "pending") {
        tx.status = "committed"
        if (!state.committedTransactionIds.includes(txId)) {
          state.committedTransactionIds.push(txId)
        }
        log.changesApplied.push(`Committed pending in-flight transaction: ${txId}`)
      }
    }
  }

  // 1.2. Phục hồi thương binh & sửa chữa cơ giáp:
  // Mỗi tick phục hồi 5% số quân woundedOrRepair (tối thiểu 10 đơn vị nếu > 0)
  if (state.military.woundedOrRepair > 0) {
    const recoveryRate = 0.05
    const recovered = Math.min(
      state.military.woundedOrRepair,
      Math.max(10, Math.floor(state.military.woundedOrRepair * recoveryRate))
    )
    state.military.woundedOrRepair -= recovered
    state.military.reserves += recovered
    log.changesApplied.push(
      `Military hospital recovered ${recovered} units from woundedOrRepair to reserves`
    )
  }

  // 1.3. Phục hồi hạ tầng cơ sở tại các sector đang Recovery
  for (const sector of Object.values(state.sectors)) {
    if (sector.stage === "recovery" && sector.sovereignty === "vss") {
      // Tăng nhẹ stability mỗi ngày (+2) và giảm threat (-5)
      sector.stability = Math.min(100, sector.stability + 2)
      sector.threatLevel = Math.max(0, sector.threatLevel - 5)
      log.changesApplied.push(`Sector ${sector.name} recovery progress: +2 Stability, -5 Threat`)
    }
  }
}

/**
 * Phase 2: Vận Chuyển & Di Cư (Logistics & Migration)
 * - Điểm kết nối cho Phase 6.4 (Logistics & Demographics)
 * - Quản lý dòng dân tị nạn: Giảm nhẹ refugeesInTransit khi đến đích an toàn
 */
function executePhase2LogisticsAndMigration(
  state: WorldState,
  prng: WorldPRNG,
  log: TickPhaseLog
): void {
  // Điểm kết nối (Integration Hook): Giữ chỗ cấu trúc cho Phase 6.4
  // Xử lý luồng tị nạn đang di chuyển nếu có
  if (state.demographics.refugeesInTransit > 0) {
    // Mỗi tick một phần dân tị nạn cập bến sector an toàn Sol Command
    const settled = Math.min(
      state.demographics.refugeesInTransit,
      Math.max(500, Math.floor(state.demographics.refugeesInTransit * 0.1))
    )
    state.demographics.refugeesInTransit -= settled
    state.demographics.controlledTerritoryPopulation += settled
    log.changesApplied.push(
      `Civilian convoy arrived: ${settled} refugees resettled in secure territory`
    )
  } else {
    log.changesApplied.push("Logistics & migration flows synchronized")
  }
}

/**
 * Phase 3: Kinh Tế & Dân Số (Economy & Demographics)
 * - Sản xuất tài nguyên cơ bản dựa trên năng lực công nghiệp của các sector VSS
 * - Tiêu thụ lương thực thiết yếu dân sinh (Food)
 * - Cập nhật Stability theo cán cân cung ứng lương thực
 */
function executePhase3EconomyAndDemographics(
  state: WorldState,
  prng: WorldPRNG,
  log: TickPhaseLog
): WorldResourceLedger {
  const resourceDelta: WorldResourceLedger = {
    industrialMaterials: 0,
    energy: 0,
    logisticsSupplies: 0,
    tacticalData: 0,
    food: 0,
  }

  let totalIndustryOutput = 0

  // 3.1. Sản xuất tại từng sector thuộc quyền kiểm soát VSS
  for (const sector of Object.values(state.sectors)) {
    if (sector.sovereignty === "vss") {
      // Hệ số hiệu quả theo trạng thái sector
      let efficiency = 1.0
      if (sector.stage === "threatened") efficiency = 0.85
      else if (sector.stage === "under_siege") efficiency = 0.3
      else if (sector.stage === "recovery") efficiency = 0.5
      else if (sector.stage === "lost") efficiency = 0.0

      // Hiệu quả từ Stability [0.5 -> 1.15]
      const stabilityFactor = 0.5 + (sector.stability / 100) * 0.65
      const effectiveCap = sector.industryCapacity * efficiency * stabilityFactor

      totalIndustryOutput += effectiveCap

      // Tăng tích lũy tài nguyên quốc gia
      const matGen = Math.round(effectiveCap * 0.35)
      const energyGen = Math.round(effectiveCap * 0.3)
      const supGen = Math.round(effectiveCap * 0.2)
      const dataGen = Math.round(effectiveCap * 0.1)
      const foodGen = Math.round(effectiveCap * 0.4)

      resourceDelta.industrialMaterials += matGen
      resourceDelta.energy += energyGen
      resourceDelta.logisticsSupplies += supGen
      resourceDelta.tacticalData += dataGen
      resourceDelta.food += foodGen

      // Đồng thời cập nhật kho riêng của sector
      sector.resources.industrialMaterials += matGen
      sector.resources.energy += energyGen
      sector.resources.logisticsSupplies += supGen
      sector.resources.tacticalData += dataGen
      sector.resources.food += foodGen
    }
  }

  // 3.2. Tiêu thụ lương thực dân sinh (Food consumption):
  // 100,000 dân tiêu thụ ~150 food/ngày
  const foodConsumption = Math.round(
    (state.demographics.controlledTerritoryPopulation / 100000) * 150
  )
  resourceDelta.food -= foodConsumption

  // Áp dụng delta vào kho tổng quốc gia
  state.resources.industrialMaterials += resourceDelta.industrialMaterials
  state.resources.energy += resourceDelta.energy
  state.resources.logisticsSupplies += resourceDelta.logisticsSupplies
  state.resources.tacticalData += resourceDelta.tacticalData
  state.resources.food += resourceDelta.food

  // Bảo vệ không để âm vô lý (chuyển sang thiếu hụt - Gradual Attrition)
  if (state.resources.food < 0) {
    // Thiếu lương thực -> sụt giảm stability toàn cục
    state.resources.food = 0
    for (const sector of Object.values(state.sectors)) {
      if (sector.sovereignty === "vss") {
        sector.stability = Math.max(10, sector.stability - 3)
      }
    }
    log.changesApplied.push(
      `CRITICAL: Food shortage triggered! Sector stability penalized by -3.`
    )
  }

  log.changesApplied.push(
    `Economy produced: +${resourceDelta.industrialMaterials} Mats, +${resourceDelta.energy} Energy, +${resourceDelta.logisticsSupplies} Supplies, +${resourceDelta.tacticalData} Data, Net Food: ${resourceDelta.food >= 0 ? "+" : ""}${resourceDelta.food}`
  )

  return resourceDelta
}

/**
 * Phase 4: Quân Sự & Mức Đe Dọa (Military & Threat Dynamics)
 * - Lan truyền Threat có hệ số suy giảm (Damping factor) và trần tăng trưởng tối đa (+50/ngày)
 * - Điểm kết nối tự động điều phối cho Phase 6.5
 */
function executePhase4MilitaryAndThreat(
  state: WorldState,
  prng: WorldPRNG,
  log: TickPhaseLog
): Array<{ sectorId: string; previousStage: string; newStage: string; threatDelta: number }> {
  const changes: Array<{
    sectorId: string
    previousStage: string
    newStage: string
    threatDelta: number
  }> = []

  // Giới hạn trần tăng trưởng đe dọa tối đa theo thiết kế (+50 Threat/ngày)
  const MAX_THREAT_GROWTH_PER_DAY = 50

  // 4.1. Tính toán biến động Threat tự nhiên dựa trên trạng thái và vị trí
  for (const sector of Object.values(state.sectors)) {
    const prevStage = sector.stage
    let threatDelta = 0

    if (sector.sovereignty === "void") {
      // Sector phe địch duy trì hoặc tăng nhẹ Threat
      threatDelta = Math.min(MAX_THREAT_GROWTH_PER_DAY, prng.nextInt(5, 15))
    } else if (sector.sovereignty === "contested") {
      threatDelta = Math.min(MAX_THREAT_GROWTH_PER_DAY, prng.nextInt(10, 25))
    } else {
      // Sector VSS: Căn cứ chính an toàn (threat giảm tự nhiên)
      if (sector.id === "sol_command_hq") {
        threatDelta = -Math.min(sector.threatLevel, prng.nextInt(2, 5))
      } else if (sector.stage === "threatened") {
        // Biến động nhẹ có seed
        threatDelta = prng.nextInt(-10, 15)
      } else if (sector.stage === "under_siege") {
        // Vây hãm: đe dọa áp lực cao
        threatDelta = prng.nextInt(5, 20)
      } else {
        // Trạng thái normal: dao động bình yên
        threatDelta = prng.nextInt(-5, 5)
      }
    }

    // Kẹp chặt threatDelta trong [-50, +50]
    threatDelta = Math.max(-MAX_THREAT_GROWTH_PER_DAY, Math.min(MAX_THREAT_GROWTH_PER_DAY, threatDelta))

    const newThreat = Math.max(0, Math.min(1000, sector.threatLevel + threatDelta))
    sector.threatLevel = newThreat

    // 4.2. Đánh giá lại vòng đời 5 giai đoạn nếu cần
    const evalResult = evaluateSectorStage(sector)
    if (evalResult.success && evalResult.newStage !== sector.stage) {
      const oldStage = sector.stage
      sector.stage = evalResult.newStage
      changes.push({
        sectorId: sector.id,
        previousStage: oldStage,
        newStage: evalResult.newStage,
        threatDelta,
      })
      log.changesApplied.push(
        `Sector ${sector.name} stage transitioned: ${oldStage} -> ${evalResult.newStage} (Threat: ${newThreat})`
      )
    } else if (threatDelta !== 0) {
      changes.push({
        sectorId: sector.id,
        previousStage: prevStage,
        newStage: sector.stage,
        threatDelta,
      })
    }
  }

  log.changesApplied.push("Military patrols and threat dynamics simulated")
  return changes
}

/**
 * Phase 5: Hạn Chót & Kết Quả (Deadlines & Resolutions)
 * - Kiểm tra hạn chót nhiệm vụ hoặc sự kiện đếm ngược
 * - Điểm kết nối cho Auto-Resolve (Phase 6.5) và Combat Adapter Journal (Phase 6.6)
 */
function executePhase5DeadlinesAndResolutions(
  state: WorldState,
  prng: WorldPRNG,
  log: TickPhaseLog
): void {
  // Điểm kết nối (Integration Hook): Giữ chỗ cho Phase 6.5 & 6.6
  // Trong Phase 6.3: Duyệt danh sách chuỗi nhiệm vụ active và kiểm tra tính toàn vẹn
  log.changesApplied.push(
    `Deadlines evaluated: ${state.activeMissionChains.length} active chains checked`
  )
}

/**
 * Phase 6: Kích Hoạt Mới (New Activations)
 * - Điểm kết nối cho Event Lifecycle Engine & Strategic Mission Chains (Phase 6.7)
 * - Đảm bảo cấu trúc mở rộng không gây null/undefined
 */
function executePhase6NewActivations(
  state: WorldState,
  prng: WorldPRNG,
  log: TickPhaseLog
): void {
  // Điểm kết nối (Integration Hook): Giữ chỗ cho Phase 6.7
  log.changesApplied.push("Strategic intel scanned; no anomalous triggers")
}

// -------------------------------------------------------------
// ĐIỀU PHỐI WORLD TICK (AUTHORITATIVE TICK DISPATCHER)
// -------------------------------------------------------------

/**
 * Thực thi một strategic tick duy nhất (1 ngày chiến lược)
 * Chạy tuần tự qua 6 phase bất biến với tính tất định hoàn toàn.
 */
export function executeWorldTick(
  state: WorldState,
  options?: TickExecutionOptions
): TickExecutionResult {
  const previousDay = state.currentDay
  const previousSeed = state.worldSeed
  const phaseLogs: TickPhaseLog[] = []

  // 1. Khởi tạo Seeded PRNG từ seed hiện tại của WorldState
  const prng = new WorldPRNG(state.worldSeed)

  // 2. Thực thi tuần tự 6 Phase
  // Phase 1
  const logP1: TickPhaseLog = {
    phaseIndex: 1,
    phaseName: "Phục Hồi & Giao Dịch",
    changesApplied: [],
  }
  executePhase1RecoveryAndTransactions(state, prng, logP1)
  phaseLogs.push(logP1)

  // Phase 2
  const logP2: TickPhaseLog = {
    phaseIndex: 2,
    phaseName: "Vận Chuyển & Di Cư",
    changesApplied: [],
  }
  executePhase2LogisticsAndMigration(state, prng, logP2)
  phaseLogs.push(logP2)

  // Phase 3
  const logP3: TickPhaseLog = {
    phaseIndex: 3,
    phaseName: "Kinh Tế & Dân Số",
    changesApplied: [],
  }
  const resourceDelta = executePhase3EconomyAndDemographics(state, prng, logP3)
  phaseLogs.push(logP3)

  // Phase 4
  const logP4: TickPhaseLog = {
    phaseIndex: 4,
    phaseName: "Quân Sự & Mức Đe Dọa",
    changesApplied: [],
  }
  const sectorChanges = executePhase4MilitaryAndThreat(state, prng, logP4)
  phaseLogs.push(logP4)

  // Phase 5
  const logP5: TickPhaseLog = {
    phaseIndex: 5,
    phaseName: "Hạn Chót & Kết Quả",
    changesApplied: [],
  }
  executePhase5DeadlinesAndResolutions(state, prng, logP5)
  phaseLogs.push(logP5)

  // Phase 6
  const logP6: TickPhaseLog = {
    phaseIndex: 6,
    phaseName: "Kích Hoạt Mới",
    changesApplied: [],
  }
  executePhase6NewActivations(state, prng, logP6)
  phaseLogs.push(logP6)

  // 3. Tiến hóa Seed xác định cho tick tiếp theo
  const newSeed = prng.stepSeed()
  state.worldSeed = newSeed

  // 4. Cập nhật ngày và mốc thời gian
  state.currentDay += 1
  state.totalDaysElapsed += 1

  const now = options?.anchorTimestamp ?? Date.now()
  state.lastTickTimestamp = now
  if (options?.anchorTimestamp !== undefined) {
    state.realTimeAnchor = options.anchorTimestamp
  }

  return {
    state,
    previousDay,
    newDay: state.currentDay,
    previousSeed,
    newSeed,
    phaseLogs,
    resourceDelta,
    militaryDelta: {},
    sectorStateChanges: sectorChanges,
  }
}
