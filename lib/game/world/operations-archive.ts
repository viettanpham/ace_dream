/**
 * STARFRONT WORLD — Operations Archive Engine (Phase 6.31)
 * Quản lý kho lưu trữ có giới hạn (bounded archive) cho 2 luồng kết quả tác chiến:
 *   1. Event / Mission Results (eventResultsArchive)
 *   2. Battle Results (từ committed transactionJournal)
 *
 * Tính chất:
 *   - Quota lưu trữ riêng biệt có thể cấu hình (eventArchiveQuota, battleArchiveQuota)
 *   - Chỉ lưu các kết quả thực tế, không tạo dữ liệu/timestamp giả
 *   - Áp dụng chính sách dọn dẹp FIFO an toàn khi vượt trần
 *   - Bảo toàn 100% Save Schema V1 và tính lũy đẳng
 */

import type {
  WorldState,
  WorldEventResult,
  CombatResultReceipt,
  OperationsArchiveConfig,
  OperationsArchiveSummary,
  JournalEntry,
} from "./types"

export const DEFAULT_OPERATIONS_ARCHIVE_CONFIG: OperationsArchiveConfig = {
  eventArchiveQuota: 60,
  battleArchiveQuota: 40,
}

/**
 * Đảm bảo cấu hình và kho lưu trữ tồn tại trong WorldState
 */
export function ensureOperationsArchive(state: WorldState): OperationsArchiveConfig {
  if (!state.eventResultsArchive) {
    state.eventResultsArchive = []
  }
  if (!state.operationsArchiveConfig) {
    state.operationsArchiveConfig = { ...DEFAULT_OPERATIONS_ARCHIVE_CONFIG }
  }
  return state.operationsArchiveConfig
}

/**
 * Lấy cấu hình quota lưu trữ hiện hành
 */
export function getOperationsArchiveConfig(state: WorldState): OperationsArchiveConfig {
  return state.operationsArchiveConfig || { ...DEFAULT_OPERATIONS_ARCHIVE_CONFIG }
}

/**
 * Cập nhật cấu hình quota lưu trữ (hỗ trợ AdminCP cấu hình động)
 */
export function updateOperationsArchiveConfig(
  state: WorldState,
  newConfig: Partial<OperationsArchiveConfig>
): OperationsArchiveConfig {
  ensureOperationsArchive(state)
  const current = state.operationsArchiveConfig!

  if (typeof newConfig.eventArchiveQuota === "number" && newConfig.eventArchiveQuota >= 5) {
    current.eventArchiveQuota = Math.min(200, Math.floor(newConfig.eventArchiveQuota))
  }
  if (typeof newConfig.battleArchiveQuota === "number" && newConfig.battleArchiveQuota >= 5) {
    current.battleArchiveQuota = Math.min(150, Math.floor(newConfig.battleArchiveQuota))
  }

  // Tự động prune nếu mảng hiện tại vượt trần cấu hình mới
  enforceOperationsArchiveQuotas(state)

  return current
}

/**
 * Lưu trữ một bản ghi kết quả sự kiện/nhiệm vụ (WorldEventResult) vào kho lưu trữ
 * Đảm bảo tính lũy đẳng: nếu kết quả cùng ID đã tồn tại thì cập nhật chứ không nhân bản.
 */
export function archiveEventResult(
  state: WorldState,
  result: WorldEventResult,
  customQuota?: number
): { archived: boolean; prunedCount: number } {
  const cfg = ensureOperationsArchive(state)
  const quota = customQuota || cfg.eventArchiveQuota

  // Kiểm tra trùng ID (idempotency guard)
  const existingIdx = state.eventResultsArchive!.findIndex((r) => r.id === result.id)
  if (existingIdx >= 0) {
    // Đã tồn tại: cập nhật tại chỗ
    state.eventResultsArchive![existingIdx] = result
    return { archived: true, prunedCount: 0 }
  }

  // Đưa vào đầu danh sách (mới nhất lên trên)
  state.eventResultsArchive!.unshift(result)

  let prunedCount = 0
  if (state.eventResultsArchive!.length > quota) {
    prunedCount = state.eventResultsArchive!.length - quota
    state.eventResultsArchive = state.eventResultsArchive!.slice(0, quota)
  }

  return { archived: true, prunedCount }
}

/**
 * Thực thi kiểm tra và cắt tỉa (prune) theo trần quota cho cả Event Archive và Battle Archive
 */
export function enforceOperationsArchiveQuotas(state: WorldState): {
  prunedEvents: number
  prunedBattles: number
} {
  const cfg = ensureOperationsArchive(state)
  let prunedEvents = 0
  let prunedBattles = 0

  // 1. Prune Event Archive
  if (state.eventResultsArchive && state.eventResultsArchive.length > cfg.eventArchiveQuota) {
    prunedEvents = state.eventResultsArchive.length - cfg.eventArchiveQuota
    state.eventResultsArchive = state.eventResultsArchive.slice(0, cfg.eventArchiveQuota)
  }

  // 2. Prune Committed Battles trong Transaction Journal nếu vượt quá trần
  if (state.transactionJournal) {
    const committedCombatEntries = Object.entries(state.transactionJournal)
      .filter(([_, entry]) => entry.type === "combat" && entry.status === "committed")
      .sort((a, b) => ((b[1].committedAt || b[1].createdAt || 0) - (a[1].committedAt || a[1].createdAt || 0))) // mới nhất lên đầu

    if (committedCombatEntries.length > cfg.battleArchiveQuota) {
      const entriesToRemove = committedCombatEntries.slice(cfg.battleArchiveQuota)
      for (const [txId] of entriesToRemove) {
        delete state.transactionJournal[txId]
        prunedBattles++
      }
    }
  }

  return { prunedEvents, prunedBattles }
}

/**
 * Xóa an toàn các báo cáo sự kiện đã đọc hoặc dọn dẹp các trận đấu cũ theo yêu cầu thủ công
 */
export function pruneOperationsArchiveSafe(
  state: WorldState,
  options?: { pruneReadEventsOnly?: boolean; pruneOldBattlesOnly?: boolean }
): { prunedEvents: number; prunedBattles: number } {
  ensureOperationsArchive(state)
  let prunedEvents = 0
  let prunedBattles = 0

  if (options?.pruneReadEventsOnly !== false && state.eventResultsArchive) {
    const unread = state.eventResultsArchive.filter((r) => !r.isRead)
    prunedEvents = state.eventResultsArchive.length - unread.length
    state.eventResultsArchive = unread
  }

  if (options?.pruneOldBattlesOnly && state.transactionJournal) {
    const cfg = getOperationsArchiveConfig(state)
    const combatEntries = Object.entries(state.transactionJournal)
      .filter(([_, entry]) => entry.type === "combat" && entry.status === "committed")
      .sort((a, b) => ((b[1].committedAt || b[1].createdAt || 0) - (a[1].committedAt || a[1].createdAt || 0)))

    if (combatEntries.length > Math.floor(cfg.battleArchiveQuota / 2)) {
      const toRemove = combatEntries.slice(Math.floor(cfg.battleArchiveQuota / 2))
      for (const [txId] of toRemove) {
        delete state.transactionJournal[txId]
        prunedBattles++
      }
    }
  }

  return { prunedEvents, prunedBattles }
}

/**
 * Tổng hợp thông tin tình trạng kho lưu trữ Operations Archive
 */
export function getOperationsArchiveSummary(state: WorldState): OperationsArchiveSummary {
  const cfg = ensureOperationsArchive(state)
  const eventArchive = state.eventResultsArchive || []
  const unreadEventsCount = eventArchive.filter((r) => !r.isRead).length

  const committedCombatEntries = Object.values(state.transactionJournal || {}).filter(
    (entry) => entry.type === "combat" && entry.status === "committed"
  )
  const victoriousBattlesCount = committedCombatEntries.filter(
    (entry) => entry.receipt?.victory === true
  ).length

  return {
    totalArchivedEvents: eventArchive.length,
    unreadEventsCount,
    totalArchivedBattles: committedCombatEntries.length,
    victoriousBattlesCount,
    eventArchiveQuota: cfg.eventArchiveQuota,
    battleArchiveQuota: cfg.battleArchiveQuota,
  }
}
