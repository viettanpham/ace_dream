/**
 * STARFRONT WORLD — Authoritative Transaction Journal (Phase 6.6)
 * Quản lý sổ nhật ký giao dịch lũy đẳng (Idempotent Transaction Journal):
 *   - Cấp phát và theo dõi vòng đời giao dịch: pending -> awaiting_commit -> committed / aborted / needs_recovery
 *   - Bộ lọc giao dịch (Transaction Filter): Tra cứu transactionId; chặn lặp lại khi đã committed
 *   - Bảo tồn snapshot bất biến và biên lai kết quả CombatResultReceipt
 *   - Đối soát tự động (Reconcile) các giao dịch combat bị ngắt quãng hoặc treo giữa chừng
 */

import type {
  CombatResultReceipt,
  JournalEntry,
  TransactionStatus,
  WorldState,
} from "./types"

/**
 * Đảm bảo state có đầy đủ cấu trúc của Transaction Journal
 */
export function ensureTransactionJournal(state: WorldState): void {
  if (!state.transactionJournal || typeof state.transactionJournal !== "object") {
    state.transactionJournal = {}
  }
  if (!Array.isArray(state.committedTransactionIds)) {
    state.committedTransactionIds = []
  }
  if (!state.inFlightTransactions || typeof state.inFlightTransactions !== "object") {
    state.inFlightTransactions = {}
  }
}

/**
 * Tạo mới một bản ghi giao dịch trong sổ nhật ký
 */
export function createJournalEntry(
  state: WorldState,
  entryData: Omit<JournalEntry, "createdAt" | "updatedAt"> & { createdAt?: number; updatedAt?: number },
): JournalEntry {
  ensureTransactionJournal(state)

  const now = Date.now()
  const entry: JournalEntry = {
    ...entryData,
    createdAt: entryData.createdAt ?? now,
    updatedAt: entryData.updatedAt ?? now,
  }

  state.transactionJournal![entry.transactionId] = entry

  // Đồng bộ sang inFlightTransactions để tương thích với cơ chế theo dõi in-flight hiện có
  state.inFlightTransactions[entry.transactionId] = {
    transactionId: entry.transactionId,
    type: entry.type,
    sectorId: entry.sectorId,
    payload: entry.snapshot || null,
    status: entry.status === "committed" ? "committed" : entry.status === "aborted" ? "aborted" : "pending",
    createdAt: entry.createdAt,
  }

  return entry
}

/**
 * Tra cứu thông tin giao dịch theo transactionId
 */
export function getJournalEntry(
  state: WorldState,
  transactionId: string,
): JournalEntry | undefined {
  if (!state.transactionJournal) return undefined
  return state.transactionJournal[transactionId]
}

/**
 * Kiểm tra xem giao dịch đã được commit vào World State hay chưa (Bộ lọc lũy đẳng Idempotency Guard)
 */
export function isTransactionCommitted(
  state: WorldState,
  transactionId: string,
): boolean {
  if (!transactionId) return false
  if (Array.isArray(state.committedTransactionIds) && state.committedTransactionIds.includes(transactionId)) {
    return true
  }
  const entry = state.transactionJournal?.[transactionId]
  return entry?.status === "committed"
}

/**
 * Cập nhật trạng thái và thông tin của một giao dịch trong Journal
 */
export function updateJournalStatus(
  state: WorldState,
  transactionId: string,
  status: TransactionStatus,
  patch?: Partial<JournalEntry>,
): JournalEntry {
  ensureTransactionJournal(state)

  let entry = state.transactionJournal![transactionId]
  const now = Date.now()

  if (!entry) {
    entry = {
      transactionId,
      type: "combat",
      status,
      createdAt: now,
      updatedAt: now,
      ...patch,
    }
    state.transactionJournal![transactionId] = entry
  } else {
    entry.status = status
    entry.updatedAt = now
    if (patch) {
      Object.assign(entry, patch)
    }
  }

  // Đồng bộ sang inFlightTransactions
  if (state.inFlightTransactions[transactionId]) {
    state.inFlightTransactions[transactionId].status =
      status === "committed" ? "committed" : status === "aborted" ? "aborted" : "pending"
  } else {
    state.inFlightTransactions[transactionId] = {
      transactionId,
      type: entry.type,
      sectorId: entry.sectorId,
      payload: entry.snapshot || null,
      status: status === "committed" ? "committed" : status === "aborted" ? "aborted" : "pending",
      createdAt: entry.createdAt,
    }
  }

  return entry
}

/**
 * Đánh dấu giao dịch đã được áp dụng thành công và vĩnh viễn (Committed)
 */
export function markTransactionCommitted(
  state: WorldState,
  transactionId: string,
  receipt?: CombatResultReceipt,
): void {
  ensureTransactionJournal(state)

  const now = Date.now()
  const entry = state.transactionJournal![transactionId]

  if (entry) {
    entry.status = "committed"
    entry.updatedAt = now
    entry.committedAt = now
    if (receipt) {
      entry.receipt = receipt
    }
  } else {
    state.transactionJournal![transactionId] = {
      transactionId,
      type: "combat",
      status: "committed",
      receipt,
      createdAt: now,
      updatedAt: now,
      committedAt: now,
    }
  }

  if (!state.committedTransactionIds.includes(transactionId)) {
    state.committedTransactionIds.push(transactionId)
  }

  if (state.inFlightTransactions[transactionId]) {
    state.inFlightTransactions[transactionId].status = "committed"
  }
}

/**
 * Đánh dấu giao dịch đã hủy bỏ an toàn (Aborted)
 */
export function markTransactionAborted(
  state: WorldState,
  transactionId: string,
  reason?: string,
): void {
  ensureTransactionJournal(state)

  const now = Date.now()
  const entry = state.transactionJournal![transactionId]

  if (entry) {
    entry.status = "aborted"
    entry.updatedAt = now
    entry.abortedAt = now
    if (reason) {
      entry.error = reason
    }
  } else {
    state.transactionJournal![transactionId] = {
      transactionId,
      type: "combat",
      status: "aborted",
      createdAt: now,
      updatedAt: now,
      abortedAt: now,
      error: reason,
    }
  }

  if (state.inFlightTransactions[transactionId]) {
    state.inFlightTransactions[transactionId].status = "aborted"
  }
}

/**
 * Lấy giao dịch combat đang bị treo hoặc chờ phục hồi (nếu có)
 */
export function getSuspendedCombatTransaction(
  state: WorldState,
): JournalEntry | undefined {
  if (!state.transactionJournal) return undefined

  // Ưu tiên tra cứu theo suspendedEncounterId / snapshot nếu có
  if (state.suspendedSnapshot?.transactionId) {
    const entry = state.transactionJournal[state.suspendedSnapshot.transactionId]
    if (entry && (entry.status === "pending" || entry.status === "needs_recovery" || entry.status === "awaiting_commit")) {
      return entry
    }
  }

  // Quét toàn bộ journal tìm combat đang dở dang
  for (const entry of Object.values(state.transactionJournal)) {
    if (
      entry.type === "combat" &&
      (entry.status === "pending" || entry.status === "needs_recovery" || entry.status === "awaiting_commit")
    ) {
      return entry
    }
  }

  return undefined
}

/**
 * Đối soát các giao dịch combat trong lượt tick (gọi tại Phase 1 của Tick Engine)
 * Phát hiện giao dịch bị đứt gãy hoặc reload khi trận đang diễn ra.
 */
export function reconcileCombatTransactionsInTick(state: WorldState): {
  recovered: number
  logs: string[]
} {
  ensureTransactionJournal(state)
  const logs: string[] = []
  let recoveredCount = 0

  // 1. Quét journal tìm giao dịch combat đang ở trạng thái pending
  for (const [txId, entry] of Object.entries(state.transactionJournal!)) {
    if (entry.type === "combat") {
      if (entry.status === "pending") {
        // Đánh dấu cần khôi phục
        entry.status = "needs_recovery"
        entry.updatedAt = Date.now()
        recoveredCount++

        state.isSuspendedCombat = true
        if (entry.snapshot) {
          state.suspendedEncounterId = entry.snapshot.encounterId
          state.suspendedSnapshot = entry.snapshot
        }

        // Đảm bảo sector liên quan vẫn bị khóa an toàn
        if (entry.sectorId && state.sectors[entry.sectorId]) {
          state.sectors[entry.sectorId].isLockedForCombat = true
        }

        logs.push(
          `[Transaction Journal] Phát hiện trận chiến treo: ${txId} tại Sector ${entry.sectorId || "N/A"}. Đã chuyển sang chế độ NEEDS_RECOVERY.`,
        )
      } else if (entry.status === "needs_recovery") {
        // Tiếp tục duy trì cờ trạng thái treo để UI thông báo phục hồi
        state.isSuspendedCombat = true
        if (entry.snapshot) {
          state.suspendedEncounterId = entry.snapshot.encounterId
          state.suspendedSnapshot = entry.snapshot
        }
        if (entry.sectorId && state.sectors[entry.sectorId]) {
          state.sectors[entry.sectorId].isLockedForCombat = true
        }
      }
    }
  }

  // 2. Kiểm tra cờ isSuspendedCombat nhưng không còn transaction nào hợp lệ -> dọn dẹp
  if (state.isSuspendedCombat && recoveredCount === 0) {
    const hasActiveSuspended = Object.values(state.transactionJournal!).some(
      (e) => e.type === "combat" && (e.status === "needs_recovery" || e.status === "pending"),
    )
    if (!hasActiveSuspended) {
      state.isSuspendedCombat = false
      state.suspendedEncounterId = undefined
      state.suspendedSnapshot = undefined
      logs.push("[Transaction Journal] Không còn trận treo nào; đã dọn cờ isSuspendedCombat.")
    }
  }

  return {
    recovered: recoveredCount,
    logs,
  }
}

/**
 * Xóa an toàn các bản ghi lịch sử journal cũ để giữ dung lượng nhẹ,
 * nhưng BẢO TOÀN danh sách committedTransactionIds để bộ lọc lũy đẳng không bị ảnh hưởng.
 */
export function pruneJournal(
  state: WorldState,
  maxEntries = 50,
): number {
  if (!state.transactionJournal) return 0

  const entries = Object.values(state.transactionJournal)
  if (entries.length <= maxEntries) return 0

  // Sắp xếp theo updatedAt ASC (cũ nhất trước)
  const sorted = entries.sort((a, b) => a.updatedAt - b.updatedAt)
  let removedCount = 0

  for (const entry of sorted) {
    if (entries.length - removedCount <= maxEntries) break
    // Chỉ prune các giao dịch đã xong (committed hoặc aborted), không prune pending/needs_recovery
    if (entry.status === "committed" || entry.status === "aborted") {
      delete state.transactionJournal[entry.transactionId]
      removedCount++
    }
  }

  return removedCount
}
