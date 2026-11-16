/**
 * STARFRONT WORLD V2 — STORY READER PURE HELPERS (FND-8.2.3.E.1)
 *
 * Pure, framework-independent helpers for:
 * - Validating `/api/runtime/story/[pilotId]/[chapterId]` payloads (not just HTTP 200)
 * - Stable fetch key generation & AbortError detection
 * - Preventing infinite fetch/state-reset loops in ImmersiveStoryReader
 */

export interface ValidatedStoryChapterPayload<TMeta = Record<string, unknown>, TBlock = unknown> {
  meta: TMeta
  content: string
  blocks: TBlock[]
  releaseVersion?: string
  releaseCommitSha?: string
  isComingSoon: boolean
}

export function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const maybeErr = err as { name?: unknown; code?: unknown }
  return maybeErr.name === 'AbortError' || maybeErr.code === 'ABORT_ERR'
}

export function getStoryFetchKey(params: {
  isOpen: boolean
  pilotId: string
  chapterId: string
  reloadToken: number
}): string | null {
  const cleanPilot = params.pilotId.trim().toLowerCase()
  const cleanChapter = params.chapterId.trim().toLowerCase()
  if (!params.isOpen || !cleanPilot || !cleanChapter) {
    return null
  }
  return `${cleanPilot}::${cleanChapter}::${params.reloadToken}`
}

export function validateStoryChapterPayload<
  TMeta extends { chapterId?: string; chapterNumber?: number; title?: string } = {
    chapterId?: string
    chapterNumber?: number
    title?: string
  },
  TBlock = unknown,
>(
  httpOk: boolean,
  status: number,
  raw: unknown
): ValidatedStoryChapterPayload<TMeta, TBlock> {
  const obj =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : null

  if (!httpOk) {
    const serverMsg =
      obj && typeof obj.error === 'string' && obj.error.trim()
        ? obj.error.trim()
        : `Không thể tải dữ liệu chương (HTTP ${status})`
    throw new Error(serverMsg)
  }

  if (!obj || obj.success !== true) {
    const serverMsg =
      obj && typeof obj.error === 'string' && obj.error.trim()
        ? obj.error.trim()
        : 'Phản hồi dữ liệu chương không hợp lệ (success !== true).'
    throw new Error(serverMsg)
  }

  const meta =
    obj.meta && typeof obj.meta === 'object' && !Array.isArray(obj.meta)
      ? (obj.meta as TMeta)
      : null

  if (
    !meta ||
    (typeof meta.chapterId !== 'string' && typeof meta.chapterNumber !== 'number') ||
    (typeof meta.title === 'string' ? meta.title.trim().length === 0 : true)
  ) {
    throw new Error('Dữ liệu metadata của chương bị thiếu hoặc không hợp lệ.')
  }

  const content = typeof obj.content === 'string' ? obj.content : ''
  const blocks = Array.isArray(obj.blocks) ? (obj.blocks as TBlock[]) : []
  const isComingSoon = Boolean(obj.isComingSoon)

  const hasReadableBody =
    isComingSoon || blocks.length > 0 || content.trim().length > 0

  if (!hasReadableBody) {
    throw new Error('Nội dung chương trống hoặc chưa sẵn sàng để hiển thị.')
  }

  return {
    meta,
    content,
    blocks,
    releaseVersion:
      typeof obj.releaseVersion === 'string' ? obj.releaseVersion : undefined,
    releaseCommitSha:
      typeof obj.releaseCommitSha === 'string' ? obj.releaseCommitSha : undefined,
    isComingSoon,
  }
}
