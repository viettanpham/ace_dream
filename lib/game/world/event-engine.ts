/**
 * STARFRONT WORLD — Authoritative Event Lifecycle Engine (Phase 6.7)
 * Động cơ vòng đời sự kiện chiến lược 3 pha:
 *   - INIT: Chờ người chơi lựa chọn chiến lược hoặc đếm ngược hạn chót (decisionDeadline)
 *   - PROCESSING: Đang thực thi theo thời lượng xác định; lưu trữ bền vững qua các lần reload
 *   - RESULT: Đạt thời hạn hoàn thành, kết quả được đánh giá và ghi nhận lũy đẳng DUY NHẤT 1 LẦN
 *
 * Tích hợp chặt chẽ:
 *   - Tự động khóa chiến lược mặc định (Default Strategy) khi countdown về 0
 *   - Chống áp dụng hậu quả 2 lần (consequencesApplied guard)
 *   - Phân biệt Event Result vs Battle Result (lưu trữ tách biệt trong eventResultsArchive)
 *   - Tuân thủ thứ tự tie-break tất định: (priority DESC, scheduledTick ASC, eventId ASC)
 */

import type {
  WorldState,
  WorldEvent,
  EventStatus,
  EventStrategy,
  EventConsequence,
  WorldEventResult,
  EventRegistrationCheckResult,
  EventRegistrationDenialReason,
} from "./types"
import { WorldPRNG } from "./random"
import { EVENT_TEMPLATES, createEventFromTemplate } from "./event-templates"
import { lockEncounterAndCreateSnapshot } from "./combat-adapter"
import { getJournalEntry } from "./transaction-journal"

/**
 * Giới hạn trần số lượng sự kiện hoạt động đồng thời để chống quá tải
 */
export const MAX_ACTIVE_EVENTS = 12

/**
 * Giới hạn trần lưu trữ nhật ký kết quả sự kiện trong kho lưu trữ
 */
export const MAX_EVENT_ARCHIVE_SIZE = 60

/**
 * Đảm bảo các cấu trúc dữ liệu sự kiện tồn tại trong WorldState
 */
export function ensureWorldEventState(state: WorldState): void {
  if (!state.events) {
    state.events = {}
  }
  if (!state.eventResultsArchive) {
    state.eventResultsArchive = []
  }
  if (!state.activeMissionChains) {
    state.activeMissionChains = []
  }
  if (!state.completedMissionChainIds) {
    state.completedMissionChainIds = []
  }
  if (!state.missionChains) {
    state.missionChains = {}
  }
}

/**
 * Lấy danh sách các sự kiện đang hoạt động (INIT hoặc PROCESSING)
 * Được sắp xếp ổn định theo (priority DESC, createdAtTick ASC, id ASC)
 */
export function getActiveEvents(state: WorldState): WorldEvent[] {
  ensureWorldEventState(state)
  return Object.values(state.events!)
    .filter((e) => e.status === "INIT" || e.status === "PROCESSING")
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      if (a.createdAtTick !== b.createdAtTick) return a.createdAtTick - b.createdAtTick
      return a.id.localeCompare(b.id)
    })
}

/**
 * Lấy sự kiện theo ID
 */
export function getEventById(state: WorldState, eventId: string): WorldEvent | null {
  ensureWorldEventState(state)
  return state.events![eventId] || null
}

/**
 * Kiểm tra tính hợp lệ và xung đột đồng thời trước khi đăng ký sự kiện (Event Concurrency Guard)
 * Quy tắc:
 * 1. Chống trùng ID đã tồn tại
 * 2. Giữ nguyên trần toàn cục MAX_ACTIVE_EVENTS = 12
 * 3. Chống trùng sự kiện Galaxy-wide cùng templateId
 * 4. Chống trùng sự kiện cùng templateId trên cùng sectorId (tránh chồng chéo lặp lại không cần thiết)
 * 5. Chống trùng sự kiện từ cùng một mission chain đang hoạt động trên cùng sector
 * Lưu ý: Các sự kiện KHÁC templateId/category (ví dụ bão plasma Anomaly + hạm đội đột kích Military)
 *        HOÀN TOÀN ĐƯỢC PHÉP cùng tồn tại trên một sector.
 */
export function canRegisterWorldEvent(
  state: WorldState,
  event: WorldEvent,
  options?: { maxActiveEvents?: number }
): EventRegistrationCheckResult {
  ensureWorldEventState(state)

  // 1. Kiểm tra ID đã tồn tại
  if (state.events![event.id]) {
    return {
      allowed: false,
      reason: "duplicate_id",
      message: `Sự kiện có ID ${event.id} đã tồn tại trong World State.`,
    }
  }

  // 2. Kiểm tra trần toàn cục (Hỗ trợ cấu hình động từ ADMIN CP hoặc fallback MAX_ACTIVE_EVENTS)
  const cap = options?.maxActiveEvents ?? MAX_ACTIVE_EVENTS
  const activeEvents = Object.values(state.events!).filter(
    (e) => e.status === "INIT" || e.status === "PROCESSING"
  )
  if (activeEvents.length >= cap) {
    return {
      allowed: false,
      reason: "max_active_events_reached",
      message: `Đã chạm trần số sự kiện hoạt động đồng thời (${cap}). Tạm hoãn sinh sự kiện mới.`,
    }
  }

  // 3. Kiểm tra Scope Galaxy
  if (event.scope === "galaxy") {
    const existingGalaxy = activeEvents.find(
      (e) => e.scope === "galaxy" && e.templateId === event.templateId
    )
    if (existingGalaxy) {
      return {
        allowed: false,
        reason: "duplicate_galaxy_event",
        message: `Đã có sự kiện quy mô thiên hà cùng loại (${event.templateId}) đang diễn ra.`,
      }
    }
  }

  // 4. Kiểm tra Scope Sector
  if (event.sectorId) {
    // 4.1. Chống trùng lặp template trên cùng sector
    const sameTemplateInSector = activeEvents.find(
      (e) => e.sectorId === event.sectorId && e.templateId === event.templateId
    )
    if (sameTemplateInSector) {
      return {
        allowed: false,
        reason: "duplicate_template_in_sector",
        message: `Sector ${event.sectorId} đã có sự kiện cùng loại (${event.templateId}) đang hoạt động (ID: ${sameTemplateInSector.id}). Tạm hoãn để tránh xung đột lặp lại.`,
      }
    }

    // 4.2. Chống trùng cùng mission chain trên cùng sector
    if (event.missionChainId) {
      const sameChainInSector = activeEvents.find(
        (e) => e.missionChainId === event.missionChainId && e.sectorId === event.sectorId
      )
      if (sameChainInSector) {
        return {
          allowed: false,
          reason: "chain_already_has_active_event",
          message: `Chuỗi nhiệm vụ ${event.missionChainId} đã có sự kiện đang diễn ra tại sector ${event.sectorId}.`,
        }
      }
    }
  }

  return { allowed: true }
}

/**
 * Thêm một sự kiện mới vào WorldState với kiểm tra Event Concurrency Guard
 */
export function registerWorldEvent(
  state: WorldState,
  event: WorldEvent,
  options?: { force?: boolean; maxActiveEvents?: number }
): {
  success: boolean
  event?: WorldEvent
  error?: string
  reason?: EventRegistrationDenialReason
} {
  ensureWorldEventState(state)

  const check = canRegisterWorldEvent(state, event, { maxActiveEvents: options?.maxActiveEvents })
  if (!check.allowed && !options?.force) {
    return {
      success: false,
      error: check.message,
      reason: check.reason,
    }
  }

  state.events![event.id] = event
  return { success: true, event }
}

/**
 * Người chơi chọn một chiến lược cho sự kiện đang ở trạng thái INIT
 */
export function chooseEventStrategy(
  state: WorldState,
  eventId: string,
  strategyId: string
): { success: boolean; event?: WorldEvent; error?: string } {
  ensureWorldEventState(state)
  const event = state.events![eventId]
  if (!event) {
    return { success: false, error: `Không tìm thấy sự kiện ${eventId}` }
  }

  if (event.status !== "INIT") {
    return {
      success: false,
      error: `Sự kiện ${eventId} đang ở trạng thái ${event.status}, không thể chọn chiến lược.`,
    }
  }

  const strategy = event.availableStrategies.find((s) => s.id === strategyId)
  if (!strategy) {
    return {
      success: false,
      error: `Chiến lược ${strategyId} không thuộc danh mục phương án của sự kiện ${eventId}.`,
    }
  }

  // 1. Kiểm tra tài nguyên chi phí
  if (strategy.cost) {
    for (const [resKey, costVal] of Object.entries(strategy.cost)) {
      const currentVal = (state.resources as any)[resKey] ?? 0
      if (typeof costVal === "number" && currentVal < costVal) {
        return {
          success: false,
          error: `Không đủ tài nguyên ${resKey} để thực hiện phương án (Yêu cầu: ${costVal}, Hiện có: ${currentVal}).`,
        }
      }
    }
  }

  // 2. Kiểm tra chi phí quân sự nếu có
  if (strategy.militaryCost && strategy.militaryCost > 0) {
    if (state.military.reserves < strategy.militaryCost) {
      return {
        success: false,
        error: `Không đủ quân dự bị để triển khai (Yêu cầu: ${strategy.militaryCost}, Dự bị: ${state.military.reserves}).`,
      }
    }
  }

  // Trừ chi phí tài nguyên
  if (strategy.cost) {
    for (const [resKey, costVal] of Object.entries(strategy.cost)) {
      if (typeof costVal === "number") {
        ;(state.resources as any)[resKey] = Math.max(0, ((state.resources as any)[resKey] ?? 0) - costVal)
      }
    }
  }

  // Trừ quân dự bị nếu có
  if (strategy.militaryCost && strategy.militaryCost > 0) {
    state.military.reserves -= strategy.militaryCost
    state.military.deployed += strategy.militaryCost
  }

  // Nếu chiến lược yêu cầu combat, kích hoạt snapshot qua combat-adapter
  if (strategy.requiresCombat && event.sectorId) {
    try {
      const snapshot = lockEncounterAndCreateSnapshot(state, {
        sectorId: event.sectorId,
        customEnemyName: strategy.encounterConfig?.name || "Void Skirmish Unit",
        customEnemyType: "void-vanguard",
      })

      if (snapshot) {
        event.encounterTransactionId = snapshot.transactionId
      }
    } catch (err: any) {
      return {
        success: false,
        error: `Không thể khóa trận đấu cho sự kiện: ${err?.message || "Lỗi khóa trận"}`,
      }
    }
  }

  // Chuyển trạng thái sang PROCESSING
  event.status = "PROCESSING"
  event.chosenStrategyId = strategyId
  event.strategySource = "player_choice"
  event.selectionReason = "Chỉ huy trực tiếp phê chuẩn phương án."
  event.autoSelectionFailureReason = undefined
  event.processingStartedTick = state.currentDay
  event.processingCompletesTick = state.currentDay + Math.max(1, strategy.processingTicks)

  return { success: true, event }
}

/**
 * Tự động khóa chiến lược mặc định khi sự kiện hết hạn countdown (decisionDeadline)
 */
export function autoLockDefaultStrategy(
  state: WorldState,
  event: WorldEvent
): { success: boolean; strategyId: string; log: string } {
  if (event.status !== "INIT") {
    return {
      success: false,
      strategyId: event.chosenStrategyId || "",
      log: `Sự kiện ${event.id} không ở trạng thái INIT, bỏ qua auto-lock.`,
    }
  }

  // Tìm chiến lược mặc định
  let strategy = event.availableStrategies.find((s) => s.id === event.defaultStrategyId)
  if (!strategy && event.availableStrategies.length > 0) {
    strategy = event.availableStrategies[0]
  }

  const chosenId = strategy?.id || "default_fallback"

  // Chuyển sang PROCESSING với chiến lược mặc định
  event.status = "PROCESSING"
  event.chosenStrategyId = chosenId
  event.strategySource = "default_fallback"
  event.selectionReason = `Hết hạn đếm ngược (Ngày ${state.currentDay}): Tự động khóa phương án mặc định "${strategy?.name || chosenId}".`
  event.autoSelectionFailureReason = undefined
  event.processingStartedTick = state.currentDay
  event.processingCompletesTick =
    state.currentDay + (strategy ? Math.max(1, strategy.processingTicks) : 1)

  const log = `[EVENT AUTO-LOCK] Sự kiện "${event.title}" (ID: ${event.id}) hết hạn đếm ngược tại ngày ${state.currentDay}. Đã tự động kích hoạt phương án mặc định "${strategy?.name || chosenId}".`

  return { success: true, strategyId: chosenId, log }
}

/**
 * Áp dụng hậu quả chiến lược vào WorldState DUY NHẤT MỘT LẦN (Idempotent Consequence Application)
 */
export function applyEventConsequencesOnce(
  state: WorldState,
  event: WorldEvent,
  consequences: EventConsequence
): { applied: boolean; message: string } {
  if (event.consequencesApplied) {
    return {
      applied: false,
      message: `Hậu quả của sự kiện ${event.id} đã được áp dụng trước đó. Bỏ qua để chống trùng lặp.`,
    }
  }

  // 1. Áp dụng biến động tài nguyên
  if (consequences.resourceDelta) {
    for (const [key, val] of Object.entries(consequences.resourceDelta)) {
      if (typeof val === "number") {
        const cur = (state.resources as any)[key] ?? 0
        ;(state.resources as any)[key] = Math.max(0, cur + val)
      }
    }
  }

  // 2. Áp dụng quân sự
  if (consequences.militaryDelta) {
    const md = consequences.militaryDelta
    if (md.reservesDelta) {
      state.military.reserves = Math.max(0, state.military.reserves + md.reservesDelta)
    }
    if (md.deployedDelta) {
      state.military.deployed = Math.max(0, state.military.deployed + md.deployedDelta)
    }
    if (md.casualtiesDelta) {
      state.military.casualties += md.casualtiesDelta
      state.military.deployed = Math.max(0, state.military.deployed - md.casualtiesDelta)
    }
    if (md.woundedDelta) {
      state.military.woundedOrRepair += md.woundedDelta
      state.military.deployed = Math.max(0, state.military.deployed - md.woundedDelta)
    }
  }

  // 3. Áp dụng lên Sector (Stability, Threat, Fortification, Order)
  const targetSectorId = consequences.sectorId || event.sectorId
  if (targetSectorId && state.sectors[targetSectorId]) {
    const sector = state.sectors[targetSectorId]

    if (typeof consequences.stabilityDelta === "number") {
      sector.stability = Math.max(0, Math.min(100, sector.stability + consequences.stabilityDelta))
    }

    if (typeof consequences.threatDelta === "number") {
      sector.threatLevel = Math.max(0, Math.min(1000, sector.threatLevel + consequences.threatDelta))
    }

    if (typeof consequences.fortificationDelta === "number") {
      sector.fortificationLevel = Math.max(
        0,
        Math.min(5, (sector.fortificationLevel || 0) + consequences.fortificationDelta)
      )
    }

    if (consequences.newStrategicOrder) {
      sector.strategicOrder = consequences.newStrategicOrder
    }
  }

  // 4. Áp dụng dân sự
  if (consequences.populationDelta) {
    const pd = consequences.populationDelta
    if (pd.civilianCasualties) {
      state.demographics.civilianCasualties += pd.civilianCasualties
      state.demographics.controlledTerritoryPopulation = Math.max(
        0,
        state.demographics.controlledTerritoryPopulation - pd.civilianCasualties
      )
    }
  }

  // Đánh dấu đã áp dụng vĩnh viễn
  event.consequencesApplied = true
  event.isResolved = true

  return { applied: true, message: consequences.message }
}

/**
 * Đánh giá và kết thúc sự kiện đang PROCESSING thành RESULT
 */
export function resolveProcessingEvent(
  state: WorldState,
  event: WorldEvent,
  prng?: WorldPRNG
): { success: boolean; result?: WorldEventResult; log: string } {
  if (event.status !== "PROCESSING") {
    return {
      success: false,
      log: `Sự kiện ${event.id} không ở trạng thái PROCESSING.`,
    }
  }

  // Nếu sự kiện gắn với combat và chưa giải quyết xong combat, tiếp tục chờ
  if (event.encounterTransactionId) {
    const journalEntry = getJournalEntry(state, event.encounterTransactionId)
    if (journalEntry && journalEntry.status === "pending") {
      return {
        success: false,
        log: `Sự kiện ${event.id} đang chờ kết thúc trận đấu (TxID: ${event.encounterTransactionId}).`,
      }
    }
  }

  const strategy = event.availableStrategies.find((s) => s.id === event.chosenStrategyId)
  const isDefault = event.chosenStrategyId === event.defaultStrategyId

  // Đánh giá tỷ lệ thành công (tất định)
  let outcomeStatus: "success" | "failure" | "expired_default" = "success"
  if (isDefault) {
    outcomeStatus = "expired_default"
  } else if (strategy?.successChance && strategy.successChance < 100) {
    const roll = prng ? prng.nextInt(1, 100) : 50
    if (roll > strategy.successChance) {
      outcomeStatus = "failure"
    }
  }

  const consequencesToApply =
    outcomeStatus === "failure" && strategy?.failureConsequences
      ? strategy.failureConsequences
      : strategy?.consequences || { message: "Sự kiện kết thúc không có hậu quả đặc biệt." }

  // Áp dụng hậu quả lũy đẳng
  const applyRes = applyEventConsequencesOnce(state, event, consequencesToApply)

  const now = typeof Date !== "undefined" ? Date.now() : 1773000000000
  const resultObj: WorldEventResult = {
    id: `res_${event.id}`,
    eventId: event.id,
    templateId: event.templateId,
    title: event.title,
    category: event.category,
    severity: event.severity,
    sectorId: event.sectorId,
    status: outcomeStatus,
    chosenStrategyId: event.chosenStrategyId || "unknown",
    chosenStrategyName: strategy?.name || "Chiến lược mặc định",
    summaryText: consequencesToApply.message,
    resolvedAtTick: state.currentDay,
    resolvedAtTimestamp: now,
    resourceChanges: consequencesToApply.resourceDelta,
    stabilityChange: consequencesToApply.stabilityDelta,
    threatChange: consequencesToApply.threatDelta,
    casualties: consequencesToApply.militaryDelta?.casualtiesDelta,
    isRead: false,
    missionChainId: event.missionChainId,
    nextNodeUnlocked: strategy?.nextChainNodeId,
    strategySource: event.strategySource || (isDefault ? "default_fallback" : "player_choice"),
    selectionReason:
      event.selectionReason ||
      (isDefault
        ? "Tự động khóa phương án mặc định do hết hạn đếm ngược"
        : "Chỉ huy trực tiếp phê chuẩn phương án"),
  }

  event.status = "RESULT"
  event.result = resultObj

  // Lưu trữ bền vững vào archive
  ensureWorldEventState(state)
  state.eventResultsArchive!.unshift(resultObj)
  if (state.eventResultsArchive!.length > MAX_EVENT_ARCHIVE_SIZE) {
    state.eventResultsArchive = state.eventResultsArchive!.slice(0, MAX_EVENT_ARCHIVE_SIZE)
  }

  const log = `[EVENT RESOLVED] Sự kiện "${event.title}" hoàn tất với kết quả [${outcomeStatus.toUpperCase()}]. ${applyRes.message}`

  return { success: true, result: resultObj, log }
}

/**
 * Tóm tắt kết quả xử lý vòng đời sự kiện trong tick (phục vụ UI & phân tích)
 */
export interface EventLifecycleSummary {
  autoLockedCount: number
  resolvedCount: number
  byCategory: Record<string, number>
  bySeverity: Record<string, number>
  autoLockedEvents: Array<{
    id: string
    title: string
    sectorId?: string
    strategyId: string
  }>
  resolvedEvents: Array<{
    id: string
    title: string
    category: string
    severity: string
    sectorId?: string
    status: "success" | "failure" | "expired_default" | "aborted"
  }>
}

/**
 * Xử lý chu kỳ tiến trình sự kiện trong Tick (được gọi ở Phase 5 của Tick Engine)
 *   1. Kiểm tra hạn chót INIT: nếu currentDay >= decisionDeadlineTick -> autoLockDefaultStrategy
 *   2. Kiểm tra tiến trình PROCESSING: nếu currentDay >= processingCompletesTick -> resolveProcessingEvent
 *
 * Tiêu chí sắp xếp phá vỡ thế hòa tất định (Deterministic Tie-Breaking):
 *   (priority DESC -> deadline ASC -> createdAtTick ASC -> id ASC)
 */
export function advanceEventLifecyclesAndDeadlines(
  state: WorldState,
  prng: WorldPRNG
): {
  autoLockedEvents: string[]
  resolvedEvents: string[]
  logs: string[]
  summary: EventLifecycleSummary
} {
  ensureWorldEventState(state)

  const autoLockedEvents: string[] = []
  const resolvedEvents: string[] = []
  const logs: string[] = []

  const summary: EventLifecycleSummary = {
    autoLockedCount: 0,
    resolvedCount: 0,
    byCategory: {},
    bySeverity: {},
    autoLockedEvents: [],
    resolvedEvents: [],
  }

  // Sắp xếp các sự kiện theo tiêu chí ổn định tất định tuyệt đối
  const allEvents = Object.values(state.events!).sort((a, b) => {
    // 1. Độ ưu tiên cao hơn xử lý trước (priority DESC)
    if (b.priority !== a.priority) return b.priority - a.priority
    // 2. Deadline sớm hơn xử lý trước (deadline ASC)
    const deadlineA =
      a.status === "INIT"
        ? a.decisionDeadlineTick
        : (a.processingCompletesTick ?? a.decisionDeadlineTick)
    const deadlineB =
      b.status === "INIT"
        ? b.decisionDeadlineTick
        : (b.processingCompletesTick ?? b.decisionDeadlineTick)
    if (deadlineA !== deadlineB) return deadlineA - deadlineB
    // 3. Thời điểm tạo sớm hơn (createdAtTick ASC)
    if (a.createdAtTick !== b.createdAtTick) return a.createdAtTick - b.createdAtTick
    // 4. ID từ điển ổn định
    return a.id.localeCompare(b.id)
  })

  for (const event of allEvents) {
    // 1. Kiểm tra sự kiện INIT đã hết hạn đếm ngược
    if (event.status === "INIT" && state.currentDay >= event.decisionDeadlineTick) {
      const lockRes = autoLockDefaultStrategy(state, event)
      if (lockRes.success) {
        autoLockedEvents.push(event.id)
        logs.push(lockRes.log)

        summary.autoLockedCount++
        summary.byCategory[event.category] = (summary.byCategory[event.category] || 0) + 1
        summary.bySeverity[event.severity] = (summary.bySeverity[event.severity] || 0) + 1
        summary.autoLockedEvents.push({
          id: event.id,
          title: event.title,
          sectorId: event.sectorId,
          strategyId: lockRes.strategyId,
        })
      }
    }

    // 2. Kiểm tra sự kiện PROCESSING đã hoàn tất thời lượng
    if (
      event.status === "PROCESSING" &&
      typeof event.processingCompletesTick === "number" &&
      state.currentDay >= event.processingCompletesTick
    ) {
      const resolveRes = resolveProcessingEvent(state, event, prng)
      if (resolveRes.success) {
        resolvedEvents.push(event.id)
        logs.push(resolveRes.log)

        summary.resolvedCount++
        summary.byCategory[event.category] = (summary.byCategory[event.category] || 0) + 1
        summary.bySeverity[event.severity] = (summary.bySeverity[event.severity] || 0) + 1
        summary.resolvedEvents.push({
          id: event.id,
          title: event.title,
          category: event.category,
          severity: event.severity,
          sectorId: event.sectorId,
          status: resolveRes.result?.status || "success",
        })
      }
    }
  }

  return {
    autoLockedEvents,
    resolvedEvents,
    logs,
    summary,
  }
}

/**
 * Đánh dấu một kết quả sự kiện là đã đọc
 */
export function markEventResultAsRead(state: WorldState, resultId: string): boolean {
  ensureWorldEventState(state)
  const item = state.eventResultsArchive?.find((r) => r.id === resultId)
  if (item) {
    item.isRead = true
    return true
  }
  return false
}

/**
 * Đánh dấu tất cả kết quả sự kiện là đã đọc
 */
export function markAllEventResultsAsRead(state: WorldState): number {
  ensureWorldEventState(state)
  let count = 0
  for (const item of state.eventResultsArchive || []) {
    if (!item.isRead) {
      item.isRead = true
      count++
    }
  }
  return count
}

/**
 * Xóa an toàn các báo cáo kết quả đã đọc (Safe Pruning)
 * CHỈ xóa bản ghi log hiển thị trong archive, TUYỆT ĐỐI KHÔNG làm biến đổi WorldState
 */
export function pruneReadEventResultsSafe(state: WorldState): {
  prunedCount: number
  remainingCount: number
} {
  ensureWorldEventState(state)
  const beforeCount = state.eventResultsArchive!.length
  state.eventResultsArchive = state.eventResultsArchive!.filter((r) => !r.isRead)
  const prunedCount = beforeCount - state.eventResultsArchive!.length

  return {
    prunedCount,
    remainingCount: state.eventResultsArchive!.length,
  }
}
