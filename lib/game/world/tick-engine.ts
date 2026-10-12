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
import { processStrategicEconomyCycle } from "./economy"
import { processLogisticsCycle } from "./logistics"
import { processDemographicsCycle } from "./demographics"
import {
  advanceTroopDeployments,
  rallyRetreatingForces,
  recoverWoundedTroops,
} from "./forces-ledger"
import { evaluateVoidStrategicBehavior } from "./threat-ai"
import { reconcileCombatTransactionsInTick } from "./transaction-journal"
import {
  advanceEventLifecyclesAndDeadlines,
  ensureWorldEventState,
  type EventLifecycleSummary,
} from "./event-engine"
import {
  advanceMissionChainNode,
  evaluateMissionChainUnlocks,
  retryPendingMissionChainDispatches,
} from "./mission-chains"
import { createEventFromTemplate } from "./event-templates"
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
  /** Tóm tắt các sự kiện vừa hết hạn/hoàn tất trong chu kỳ tick */
  eventsSummary?: EventLifecycleSummary
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
      // Nếu là trận chiến đang treo: KHÔNG tự ý phán quyết thắng/thua hay commit bừa bãi
      if (tx.type === "combat" && state.isSuspendedCombat) {
        continue
      }
      if (tx.status === "pending") {
        tx.status = "committed"
        if (!state.committedTransactionIds.includes(txId)) {
          state.committedTransactionIds.push(txId)
        }
        log.changesApplied.push(`Committed pending in-flight transaction: ${txId}`)
      }
    }
  }

  // 1.1b. Đối soát giao dịch combat đang treo
  const combatReconcile = reconcileCombatTransactionsInTick(state)
  for (const cLog of combatReconcile.logs) {
    log.changesApplied.push(cLog)
  }

  // 1.2. Phục hồi thương binh & sửa chữa cơ giáp qua Authoritative Forces Ledger
  if (state.military.woundedOrRepair > 0) {
    const { recovered } = recoverWoundedTroops(state.military)
    if (recovered > 0) {
      log.changesApplied.push(
        `Military hospital recovered ${recovered} units from woundedOrRepair to reserves`
      )
    }
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
 * - Xử lý đoàn vận tải hàng hóa in-transit & điều phối chuỗi cung ứng tự động
 * - Xử lý đoàn di cư dân sự an toàn & bảo toàn tổng dân số (Zero-Sum Conservation)
 */
function executePhase2LogisticsAndMigration(
  state: WorldState,
  prng: WorldPRNG,
  log: TickPhaseLog
): void {
  // 2.1. Chu kỳ vận chuyển hàng hóa
  const logisticsReport = processLogisticsCycle(state)

  if (logisticsReport.convoysArrived.length > 0) {
    log.changesApplied.push(
      `Logistics: ${logisticsReport.convoysArrived.length} convoy(s) delivered cargo safely`
    )
  }
  if (logisticsReport.convoysDispatched.length > 0) {
    log.changesApplied.push(
      `Logistics: ${logisticsReport.convoysDispatched.length} supply convoy(s) dispatched to needy sectors`
    )
  }

  // 2.2. Chu kỳ nhân khẩu học & di cư dân sự
  const demographicsReport = processDemographicsCycle(state)

  if (demographicsReport.migrantsArrived > 0) {
    log.changesApplied.push(
      `Civilian migration: ${demographicsReport.migrantsArrived} migrants arrived safely at destination`
    )
  }
  if (demographicsReport.naturalGrowth > 0) {
    log.changesApplied.push(
      `Demographics: +${demographicsReport.naturalGrowth} natural population growth in prosperous sectors`
    )
  }

  log.changesApplied.push("Logistics & demographics network cycle completed")
}

/**
 * Phase 3: Kinh Tế & Dân Số (Economy & Demographics)
 * - Sản xuất tài nguyên theo năng lực công nghiệp của từng sector VSS
 * - Tiêu thụ lương thực thiết yếu dân sinh (Food)
 * - Cập nhật Stability và áp dụng suy thoái do thiếu hụt (Gradual Attrition)
 * - Đồng bộ hóa kho tổng quốc gia
 */
function executePhase3EconomyAndDemographics(
  state: WorldState,
  prng: WorldPRNG,
  log: TickPhaseLog
): WorldResourceLedger {
  const report = processStrategicEconomyCycle(state)

  log.changesApplied.push(
    `Economy produced: +${report.grossProduction.industrialMaterials} Mats, +${report.grossProduction.energy} Energy, +${report.grossProduction.logisticsSupplies} Supplies, +${report.grossProduction.tacticalData} Data, +${report.grossProduction.food} Food`
  )
  log.changesApplied.push(
    `Civilian consumption: -${report.totalFoodConsumed} Food (Net Food: ${report.netResourceDelta.food >= 0 ? "+" : ""}${report.netResourceDelta.food})`
  )

  if (report.shortageSectors.length > 0) {
    log.changesApplied.push(
      `CRITICAL: Food shortage triggered across ${report.shortageSectors.length} sector(s): ${report.shortageSectors.join(", ")}`
    )
  }

  if (report.starvationCasualties > 0) {
    log.changesApplied.push(
      `TRAGEDY: ${report.starvationCasualties} civilian casualties due to prolonged starvation`
    )
  }

  return report.netResourceDelta
}

/**
 * Phase 4: Quân Sự & Mức Đe Dọa (Military & Threat Dynamics)
 * - Tiến trình hành quân của các đạo quân in-transit
 * - Tập hợp quân rút lui (Rally retreating forces)
 * - Đánh giá ý đồ chiến lược của The Void
 * - Lan truyền Threat có hệ số suy giảm và trần tăng trưởng (+50/ngày)
 * - Lệnh chiến lược ảnh hưởng tới biến động Threat và Stability
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

  // 4.0. Cập nhật tiến trình hành quân của các đạo quân (Phase 6.5)
  const depReport = advanceTroopDeployments(state)
  for (const depLog of depReport.logs) {
    log.changesApplied.push(depLog)
  }

  // Tập hợp quân rút lui (Rally retreating forces)
  const rallyReport = rallyRetreatingForces(state)
  for (const rallyLog of rallyReport.logs) {
    log.changesApplied.push(rallyLog)
  }

  // Đánh giá ý đồ chiến lược của The Void
  const voidReport = evaluateVoidStrategicBehavior(state, prng)
  for (const voidLog of voidReport.logs) {
    log.changesApplied.push(voidLog)
  }

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

    // Tác động của lệnh chiến lược nếu có
    if (sector.strategicOrder === "defend") {
      threatDelta -= 8
    } else if (sector.strategicOrder === "recover") {
      threatDelta -= 5
      sector.stability = Math.min(100, sector.stability + 2)
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
 * - Tự động khóa chiến lược mặc định khi countdown về 0 (INIT -> PROCESSING)
 * - Hoàn tất xử lý và áp dụng hậu quả lũy đẳng duy nhất một lần (PROCESSING -> RESULT)
 * - Cập nhật bước tiếp theo trong đồ thị chuỗi nhiệm vụ nếu sự kiện thuộc về một chuỗi
 */
function executePhase5DeadlinesAndResolutions(
  state: WorldState,
  prng: WorldPRNG,
  log: TickPhaseLog
): EventLifecycleSummary {
  ensureWorldEventState(state)

  // 5.1. Xử lý vòng đời sự kiện (INIT -> PROCESSING -> RESULT)
  const eventCycleResult = advanceEventLifecyclesAndDeadlines(state, prng)

  for (const l of eventCycleResult.logs) {
    log.changesApplied.push(l)
  }

  // 5.2. Chuyển tiếp các nút trong chuỗi nhiệm vụ tương ứng với các sự kiện vừa hoàn tất
  for (const resolvedId of eventCycleResult.resolvedEvents) {
    const event = state.events?.[resolvedId]
    if (event?.missionChainId && event?.nodeId) {
      const advResult = advanceMissionChainNode(
        state,
        event.missionChainId,
        event.nodeId,
        event.chosenStrategyId
      )
      log.changesApplied.push(`[MISSION CHAIN ADVANCE] ${advResult.message}`)
    }
  }

  log.changesApplied.push(
    `Deadlines evaluated: ${eventCycleResult.autoLockedEvents.length} event(s) auto-locked, ${eventCycleResult.resolvedEvents.length} resolved`
  )

  return eventCycleResult.summary
}

/**
 * Phase 6: Kích Hoạt Mới (New Activations)
 * - Thử kích hoạt lại các bước chuỗi nhiệm vụ đang bị hoãn (Pending Dispatches)
 * - Kích hoạt các chuỗi nhiệm vụ theo ngưỡng (Threat >= 600)
 * - Kích hoạt nhiệm vụ phản ứng khi sector bị vây hãm (Under Siege)
 * - Khởi tạo tuần tra định kỳ (Periodic Patrol) theo chu kỳ tuần hoàn
 * - Khống chế trần MAX_ACTIVE_MISSION_CHAINS = 8
 */
function executePhase6NewActivations(
  state: WorldState,
  prng: WorldPRNG,
  log: TickPhaseLog
): void {
  ensureWorldEventState(state)

  // 6.0. Thử dispatch lại các chuỗi nhiệm vụ bị hoãn trước đó
  const retryResult = retryPendingMissionChainDispatches(state, prng)
  for (const rLog of retryResult.logs) {
    log.changesApplied.push(rLog)
  }

  // 6.1. Đánh giá mở khóa chuỗi nhiệm vụ mới
  const missionUnlockResult = evaluateMissionChainUnlocks(state, prng)
  for (const l of missionUnlockResult.logs) {
    log.changesApplied.push(l)
  }

  if (missionUnlockResult.activatedChains.length > 0) {
    log.changesApplied.push(
      `Strategic activations: ${missionUnlockResult.activatedChains.length} new mission chain(s) opened`
    )
  } else if (retryResult.retriedSuccessCount === 0 && retryResult.fallbackCount === 0) {
    log.changesApplied.push("Strategic intel scanned; no anomalous triggers")
  }
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
  const eventsSummary = executePhase5DeadlinesAndResolutions(state, prng, logP5)
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
    eventsSummary,
  }
}
