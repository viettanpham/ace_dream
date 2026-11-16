/**
 * STARFRONT WORLD V2 — CLIENT STORY PROGRESS ADAPTER (FND-8.2.3.E.1 · T2)
 *
 * Lưu trữ tiến độ đọc truyện trên trình duyệt theo từng Pilot & Chapter.
 * - Key cô lập hoàn toàn: `sf_v2_story_progress`
 * - Không chạm vào `sf_v2_ui_prefs`, Save Game V1/V2 hay GEAR V2 (`sf_v2_gear_*`).
 * - An toàn SSR, xử lý lỗi JSON hỏng & môi trường không có localStorage.
 * - Theo dõi `lastRevisionSeen`: nếu revision của chương thay đổi, không tự giả định
 *   người chơi đã đọc hoàn tất revision mới.
 */

export const STORY_PROGRESS_STORAGE_KEY = 'sf_v2_story_progress'
export const STORY_COMPLETE_SCROLL_THRESHOLD = 90

export type ChapterReadingStatus = 'unread' | 'in_progress' | 'completed'

export interface ChapterStoryProgress {
  status: ChapterReadingStatus
  scrollPercent: number
  lastReadAt: string | null
  lastRevisionSeen: string | null
}

export interface PilotStoryProgressState {
  pilotId: string
  chapters: Record<string, ChapterStoryProgress>
  lastActiveChapterId: string | null
}

export interface StoryProgressStoreSnapshot {
  schemaVersion: 1
  pilots: Record<string, Record<string, ChapterStoryProgress>>
  lastActiveChapterByPilot: Record<string, string>
}

export interface ChapterDescriptorForProgress {
  chapterId?: string
  id?: string
  chapterNumber?: number
  number?: number
  revision?: string | null
  isAvailable?: boolean
}

export interface EffectiveChapterProgress extends ChapterStoryProgress {
  effectiveStatus: ChapterReadingStatus
  effectiveScrollPercent: number
  isRevisionChanged: boolean
}

function createEmptyStore(): StoryProgressStoreSnapshot {
  return {
    schemaVersion: 1,
    pilots: {},
    lastActiveChapterByPilot: {},
  }
}

function normalizeId(raw: string): string {
  return raw.toLowerCase().trim()
}

function clampPercent(value: unknown): number {
  const num = typeof value === 'number' && Number.isFinite(value) ? value : 0
  return Math.min(100, Math.max(0, Math.round(num)))
}

function sanitizeChapterRecord(raw: unknown): ChapterStoryProgress | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null
  }
  const obj = raw as Record<string, unknown>
  const status: ChapterReadingStatus =
    obj.status === 'completed' || obj.status === 'in_progress' || obj.status === 'unread'
      ? obj.status
      : 'unread'

  return {
    status,
    scrollPercent: clampPercent(obj.scrollPercent),
    lastReadAt: typeof obj.lastReadAt === 'string' && obj.lastReadAt.trim() ? obj.lastReadAt : null,
    lastRevisionSeen:
      typeof obj.lastRevisionSeen === 'string' && obj.lastRevisionSeen.trim()
        ? obj.lastRevisionSeen.trim()
        : null,
  }
}

function sanitizeStoreSnapshot(raw: unknown): StoryProgressStoreSnapshot {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return createEmptyStore()
  }

  const obj = raw as Record<string, unknown>
  const cleanPilots: Record<string, Record<string, ChapterStoryProgress>> = {}
  const cleanLastActive: Record<string, string> = {}

  if (obj.pilots && typeof obj.pilots === 'object' && !Array.isArray(obj.pilots)) {
    for (const [rawPilotId, rawPilotChapters] of Object.entries(
      obj.pilots as Record<string, unknown>
    )) {
      if (rawPilotId === '__proto__' || rawPilotId === 'constructor' || rawPilotId === 'prototype') {
        continue
      }
      const pId = normalizeId(rawPilotId)
      if (!pId || !rawPilotChapters || typeof rawPilotChapters !== 'object' || Array.isArray(rawPilotChapters)) {
        continue
      }

      const cleanChapters: Record<string, ChapterStoryProgress> = {}
      for (const [rawChapId, rawRec] of Object.entries(
        rawPilotChapters as Record<string, unknown>
      )) {
        if (rawChapId === '__proto__' || rawChapId === 'constructor' || rawChapId === 'prototype') {
          continue
        }
        const cId = normalizeId(rawChapId)
        const sanitized = sanitizeChapterRecord(rawRec)
        if (cId && sanitized) {
          cleanChapters[cId] = sanitized
        }
      }
      cleanPilots[pId] = cleanChapters
    }
  }

  if (
    obj.lastActiveChapterByPilot &&
    typeof obj.lastActiveChapterByPilot === 'object' &&
    !Array.isArray(obj.lastActiveChapterByPilot)
  ) {
    for (const [rawPilotId, rawChapId] of Object.entries(
      obj.lastActiveChapterByPilot as Record<string, unknown>
    )) {
      if (rawPilotId === '__proto__' || rawPilotId === 'constructor' || rawPilotId === 'prototype') {
        continue
      }
      const pId = normalizeId(rawPilotId)
      if (pId && typeof rawChapId === 'string' && rawChapId.trim()) {
        cleanLastActive[pId] = normalizeId(rawChapId)
      }
    }
  }

  return {
    schemaVersion: 1,
    pilots: cleanPilots,
    lastActiveChapterByPilot: cleanLastActive,
  }
}

function getSafeStorage(explicitStorage?: Storage | null): Storage | null {
  if (explicitStorage) return explicitStorage
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage ?? null
  } catch {
    return null
  }
}

export function loadStoryProgressStore(explicitStorage?: Storage | null): StoryProgressStoreSnapshot {
  const storage = getSafeStorage(explicitStorage)
  if (!storage) {
    return createEmptyStore()
  }

  try {
    const raw = storage.getItem(STORY_PROGRESS_STORAGE_KEY)
    if (!raw) {
      return createEmptyStore()
    }
    const parsed = JSON.parse(raw)
    return sanitizeStoreSnapshot(parsed)
  } catch {
    return createEmptyStore()
  }
}

function saveStoryProgressStore(
  store: StoryProgressStoreSnapshot,
  explicitStorage?: Storage | null
): void {
  const storage = getSafeStorage(explicitStorage)
  if (!storage) return
  try {
    storage.setItem(STORY_PROGRESS_STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Ignore storage quota or security restrictions
  }
}

/**
 * Tải tiến độ đọc riêng cho 1 Pilot (không lẫn dữ liệu giữa các Pilot).
 */
export function loadPilotStoryProgress(
  pilotId: string,
  explicitStorage?: Storage | null
): PilotStoryProgressState {
  const cleanPilotId = normalizeId(pilotId)
  const store = loadStoryProgressStore(explicitStorage)

  return {
    pilotId: cleanPilotId,
    chapters: { ...(store.pilots[cleanPilotId] || {}) },
    lastActiveChapterId: store.lastActiveChapterByPilot[cleanPilotId] || null,
  }
}

/**
 * Tính trạng thái hiệu lực của 1 chương khi đối chiếu với revision hiện hành.
 * Nếu chương đã có `lastRevisionSeen` khác với `currentRevision`,
 * KHÔNG tự giả định người chơi đã đọc hoàn tất bản mới.
 */
export function getEffectiveChapterProgress(
  record: ChapterStoryProgress | undefined,
  currentRevision?: string | null
): EffectiveChapterProgress {
  if (!record) {
    return {
      status: 'unread',
      scrollPercent: 0,
      lastReadAt: null,
      lastRevisionSeen: null,
      effectiveStatus: 'unread',
      effectiveScrollPercent: 0,
      isRevisionChanged: false,
    }
  }

  const normalizedCurrentRev =
    typeof currentRevision === 'string' && currentRevision.trim()
      ? currentRevision.trim()
      : null

  const isRevisionChanged = Boolean(
    record.status !== 'unread' &&
      record.lastRevisionSeen &&
      normalizedCurrentRev &&
      record.lastRevisionSeen !== normalizedCurrentRev
  )

  if (isRevisionChanged) {
    return {
      ...record,
      effectiveStatus: 'unread',
      effectiveScrollPercent: 0,
      isRevisionChanged: true,
    }
  }

  return {
    ...record,
    effectiveStatus: record.status,
    effectiveScrollPercent: record.scrollPercent,
    isRevisionChanged: false,
  }
}

export interface UpdateChapterProgressOptions {
  scrollPercent?: number
  revision?: string | null
  now?: string
  storage?: Storage | null
}

/**
 * Ghi nhận chương đang đọc (`in_progress`), hoặc tự nâng lên `completed` khi `scrollPercent >= 90`.
 * Nếu chương đã `completed` ở cùng `revision`, giữ nguyên `completed` (không giáng cấp khi mở lại ở đầu trang).
 */
export function markChapterInProgress(
  pilotId: string,
  chapterId: string,
  options?: UpdateChapterProgressOptions
): PilotStoryProgressState {
  const cleanPilotId = normalizeId(pilotId)
  const cleanChapterId = normalizeId(chapterId)
  if (!cleanPilotId || !cleanChapterId) {
    return loadPilotStoryProgress(pilotId, options?.storage)
  }

  const store = loadStoryProgressStore(options?.storage)
  const pilotChapters = { ...(store.pilots[cleanPilotId] || {}) }
  const existing = pilotChapters[cleanChapterId]
  const nextRevision =
    typeof options?.revision === 'string' && options.revision.trim()
      ? options.revision.trim()
      : null
  const timestamp = options?.now || new Date().toISOString()

  const revisionChanged = Boolean(
    existing &&
      existing.lastRevisionSeen &&
      nextRevision &&
      existing.lastRevisionSeen !== nextRevision
  )

  const incomingScroll = clampPercent(options?.scrollPercent ?? 0)
  const previousScroll = revisionChanged ? 0 : existing?.scrollPercent ?? 0
  const mergedScroll = Math.max(previousScroll, incomingScroll)

  const alreadyCompletedSameRevision =
    !revisionChanged && existing?.status === 'completed'

  const nextStatus: ChapterReadingStatus =
    alreadyCompletedSameRevision || mergedScroll >= STORY_COMPLETE_SCROLL_THRESHOLD
      ? 'completed'
      : 'in_progress'

  pilotChapters[cleanChapterId] = {
    status: nextStatus,
    scrollPercent: nextStatus === 'completed' ? Math.max(mergedScroll, 90) : mergedScroll,
    lastReadAt: timestamp,
    lastRevisionSeen: nextRevision ?? (revisionChanged ? null : existing?.lastRevisionSeen ?? null),
  }

  store.pilots[cleanPilotId] = pilotChapters
  store.lastActiveChapterByPilot[cleanPilotId] = cleanChapterId
  saveStoryProgressStore(store, options?.storage)

  return {
    pilotId: cleanPilotId,
    chapters: pilotChapters,
    lastActiveChapterId: cleanChapterId,
  }
}

/**
 * Đánh dấu chương đã hoàn thành (`completed`).
 */
export function markChapterCompleted(
  pilotId: string,
  chapterId: string,
  options?: UpdateChapterProgressOptions
): PilotStoryProgressState {
  const cleanPilotId = normalizeId(pilotId)
  const cleanChapterId = normalizeId(chapterId)
  if (!cleanPilotId || !cleanChapterId) {
    return loadPilotStoryProgress(pilotId, options?.storage)
  }

  const store = loadStoryProgressStore(options?.storage)
  const pilotChapters = { ...(store.pilots[cleanPilotId] || {}) }
  const existing = pilotChapters[cleanChapterId]
  const nextRevision =
    typeof options?.revision === 'string' && options.revision.trim()
      ? options.revision.trim()
      : null
  const timestamp = options?.now || new Date().toISOString()

  const revisionChanged = Boolean(
    existing &&
      existing.lastRevisionSeen &&
      nextRevision &&
      existing.lastRevisionSeen !== nextRevision
  )

  const requestedScroll =
    options?.scrollPercent !== undefined ? clampPercent(options.scrollPercent) : 100
  const mergedScroll = revisionChanged
    ? Math.max(requestedScroll, 100)
    : Math.max(existing?.scrollPercent ?? 0, requestedScroll, 100)

  pilotChapters[cleanChapterId] = {
    status: 'completed',
    scrollPercent: Math.min(100, mergedScroll),
    lastReadAt: timestamp,
    lastRevisionSeen: nextRevision ?? (revisionChanged ? null : existing?.lastRevisionSeen ?? null),
  }

  store.pilots[cleanPilotId] = pilotChapters
  store.lastActiveChapterByPilot[cleanPilotId] = cleanChapterId
  saveStoryProgressStore(store, options?.storage)

  return {
    pilotId: cleanPilotId,
    chapters: pilotChapters,
    lastActiveChapterId: cleanChapterId,
  }
}

function resolveChapterId(ch: ChapterDescriptorForProgress): string {
  return normalizeId(ch.chapterId || ch.id || '')
}

/**
 * Trả về chương chưa đọc tiếp theo (hoặc có revision mới chưa đọc), theo đúng thứ tự danh sách chương.
 * Trả về `null` nếu tất cả chương khả dụng đều đã đọc xong revision hiện hành.
 */
export function getNextUnreadChapter<T extends ChapterDescriptorForProgress>(
  pilotId: string,
  chapters: T[],
  explicitStorage?: Storage | null
): T | null {
  if (!Array.isArray(chapters) || chapters.length === 0) return null

  const progress = loadPilotStoryProgress(pilotId, explicitStorage)
  const ordered = [...chapters].sort(
    (a, b) => (a.chapterNumber ?? a.number ?? 0) - (b.chapterNumber ?? b.number ?? 0)
  )

  // Ưu tiên chương thực sự chưa đọc (hoặc revision mới chưa đọc)
  for (const ch of ordered) {
    if (ch.isAvailable === false) continue
    const cId = resolveChapterId(ch)
    if (!cId) continue
    const effective = getEffectiveChapterProgress(progress.chapters[cId], ch.revision)
    if (effective.effectiveStatus === 'unread') {
      return ch
    }
  }

  // Nếu không còn chương 'unread' nhưng vẫn còn chương 'in_progress' chưa hoàn thành -> trả về chương đó
  for (const ch of ordered) {
    if (ch.isAvailable === false) continue
    const cId = resolveChapterId(ch)
    if (!cId) continue
    const effective = getEffectiveChapterProgress(progress.chapters[cId], ch.revision)
    if (effective.effectiveStatus === 'in_progress') {
      return ch
    }
  }

  return null
}

/**
 * Trả về chương phù hợp nhất cho nút "Continue Reading" trong StoryTab:
 * 1. `lastActiveChapterId` nếu còn khả dụng và chưa hoàn thành (hoặc đang đọc dở).
 * 2. Chương đầu tiên đang `in_progress`.
 * 3. Chương tiếp theo chưa đọc (`getNextUnreadChapter`).
 * 4. Chương đầu tiên khả dụng (đọc lại khi đã hoàn thành 100%).
 */
export function getContinueReadingChapter<T extends ChapterDescriptorForProgress>(
  pilotId: string,
  chapters: T[],
  explicitStorage?: Storage | null
): T | null {
  if (!Array.isArray(chapters) || chapters.length === 0) return null

  const progress = loadPilotStoryProgress(pilotId, explicitStorage)
  const availableChapters = [...chapters]
    .filter((ch) => ch.isAvailable !== false)
    .sort((a, b) => (a.chapterNumber ?? a.number ?? 0) - (b.chapterNumber ?? b.number ?? 0))

  if (availableChapters.length === 0) return null

  if (progress.lastActiveChapterId) {
    const activeMatch = availableChapters.find(
      (ch) => resolveChapterId(ch) === progress.lastActiveChapterId
    )
    if (activeMatch) {
      const eff = getEffectiveChapterProgress(
        progress.chapters[resolveChapterId(activeMatch)],
        activeMatch.revision
      )
      if (eff.effectiveStatus !== 'completed') {
        return activeMatch
      }
    }
  }

  const inProgressMatch = availableChapters.find((ch) => {
    const eff = getEffectiveChapterProgress(
      progress.chapters[resolveChapterId(ch)],
      ch.revision
    )
    return eff.effectiveStatus === 'in_progress'
  })
  if (inProgressMatch) return inProgressMatch

  const nextUnread = getNextUnreadChapter(pilotId, availableChapters, explicitStorage)
  if (nextUnread) return nextUnread

  if (progress.lastActiveChapterId) {
    const lastActive = availableChapters.find(
      (ch) => resolveChapterId(ch) === progress.lastActiveChapterId
    )
    if (lastActive) return lastActive
  }

  return availableChapters[0]
}
