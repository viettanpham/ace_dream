'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Sparkles,
  Image as ImageIcon,
  Maximize2,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileArchive,
  List,
  RefreshCw,
  Check,
  Lock,
} from 'lucide-react'
import {
  loadPilotStoryProgress,
  markChapterInProgress,
  markChapterCompleted,
  getEffectiveChapterProgress,
  type PilotStoryProgressState,
} from '@/lib/game/v2/story-progress'
import {
  isAbortError,
  validateStoryChapterPayload,
} from '@/lib/game/v2/story-reader-helpers'

export interface SceneAnchor {
  sceneId: string
  paragraphIndex: number
  title: string
  caption: string
  artworkAssetId: string
  artworkPath: string
  cdnVerified?: boolean
  cdnStatus?: string
  placement: 'inline' | 'aside' | 'full_bleed'
}

export interface StoryChapterMeta {
  chapterId: string
  chapterNumber: number
  title: string
  summary: string
  status: string
  editorialStatus?: string
  publicationStatus?: string
  revision?: string
  sourceIntegrity?: string
  sourceNote?: string
  contentType?: 'FULL_PROSE' | 'SUMMARY_ONLY' | 'COMING_SOON' | string
  wordCount?: number
  readingTimeMinutes?: number
  sceneCount?: number
  verifiedSceneCount?: number
  isAvailable?: boolean
  publishedAt?: string
  sceneAnchors?: SceneAnchor[]
}

export interface StorySceneArtworkItem {
  assetId: string
  placement?: string
  caption?: string
  path?: string
  filename?: string
  imageSha256?: string
  isAvailable?: boolean
  cdnStatus?: string
  cdnPath?: string | null
  cdnVerified?: boolean
  resolvedUrl?: string
}

export interface StoryBlockItem {
  blockId: string
  type: 'heading' | 'paragraph' | 'dialogue' | 'scene'
  level?: number
  text?: string
  speaker?: string
  sceneId?: string
  sceneTitle?: string
  caption?: string
  artworkPath?: string
  artworkUrl?: string
  cdnVerified?: boolean
  resolvedArtworkUrl?: string
  artworks?: StorySceneArtworkItem[]
}

export interface ImmersiveStoryReaderProps {
  pilotId: string
  pilotName: string
  pilotCallsign: string
  initialChapterId?: string
  chapters: StoryChapterMeta[]
  isOpen: boolean
  onClose: () => void
  onChapterChange?: (chapterId: string) => void
  onProgressChange?: () => void
}

export function ImmersiveStoryReader({
  pilotId,
  pilotName,
  pilotCallsign,
  initialChapterId,
  chapters,
  isOpen,
  onClose,
  onChapterChange,
  onProgressChange,
}: ImmersiveStoryReaderProps) {
  const [activeChapterId, setActiveChapterId] = useState<string>(
    initialChapterId || chapters[0]?.chapterId || 'chap-01'
  )
  const [chapterContent, setChapterContent] = useState<string>('')
  const [chapterBlocks, setChapterBlocks] = useState<StoryBlockItem[]>([])
  const [chapterMeta, setChapterMeta] = useState<StoryChapterMeta | null>(null)
  const [releaseInfo, setReleaseInfo] = useState<{
    releaseVersion?: string
    releaseCommitSha?: string
  }>({})
  const [loading, setLoading] = useState<boolean>(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState<number>(0)
  const [readingPercent, setReadingPercent] = useState<number>(0)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)
  const [progressState, setProgressState] = useState<PilotStoryProgressState>(() =>
    loadPilotStoryProgress(pilotId)
  )
  const [lightboxArt, setLightboxArt] = useState<{
    url: string
    title: string
    caption: string
  } | null>(null)

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const lastSavedPercentRef = useRef<number>(-1)
  const chaptersRef = useRef<StoryChapterMeta[]>(chapters)
  const onChapterChangeRef = useRef(onChapterChange)
  const onProgressChangeRef = useRef(onProgressChange)
  const onCloseRef = useRef(onClose)

  chaptersRef.current = chapters
  onChapterChangeRef.current = onChapterChange
  onProgressChangeRef.current = onProgressChange
  onCloseRef.current = onClose

  const refreshLocalProgress = useCallback(() => {
    setProgressState(loadPilotStoryProgress(pilotId))
  }, [pilotId])

  useEffect(() => {
    if (isOpen) {
      refreshLocalProgress()
    }
  }, [refreshLocalProgress, isOpen])

  useEffect(() => {
    const availableChapters = chaptersRef.current
    if (initialChapterId) {
      setActiveChapterId((prev) => (prev === initialChapterId ? prev : initialChapterId))
    } else if (availableChapters.length > 0) {
      setActiveChapterId((prev) =>
        availableChapters.some((c) => c.chapterId === prev)
          ? prev
          : availableChapters[0].chapterId
      )
    }
  }, [initialChapterId, pilotId])

  const selectChapter = useCallback((nextChapterId: string) => {
    setActiveChapterId((prev) => (prev === nextChapterId ? prev : nextChapterId))
    setIsDrawerOpen(false)
    setReadingPercent(0)
    lastSavedPercentRef.current = -1
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
    onChapterChangeRef.current?.(nextChapterId)
  }, [])

  useEffect(() => {
    if (!isOpen || !activeChapterId) return

    const controller = new AbortController()
    setReadingPercent(0)
    lastSavedPercentRef.current = -1
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }

    const fetchChapter = async () => {
      setLoading(true)
      setFetchError(null)
      try {
        const res = await fetch(`/api/runtime/story/${pilotId}/${activeChapterId}`, {
          signal: controller.signal,
        })
        const rawText = await res.text()
        if (controller.signal.aborted) return

        let parsedJson: unknown = null
        if (rawText) {
          try {
            parsedJson = JSON.parse(rawText)
          } catch {
            if (!res.ok) {
              throw new Error(`Không thể tải dữ liệu chương (HTTP ${res.status})`)
            }
            throw new Error('Phản hồi dữ liệu chương từ máy chủ không phải JSON hợp lệ.')
          }
        }

        const validated = validateStoryChapterPayload<StoryChapterMeta, StoryBlockItem>(
          res.ok,
          res.status,
          parsedJson
        )
        if (controller.signal.aborted) return

        const loadedMeta: StoryChapterMeta = validated.meta
        setChapterContent(validated.content)
        setChapterBlocks(validated.blocks)
        setChapterMeta(loadedMeta)
        setReleaseInfo({
          releaseVersion: validated.releaseVersion,
          releaseCommitSha: validated.releaseCommitSha,
        })

        // Reset scroll container to top cleanly once content mounts
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0
          }
        })

        const fallbackMeta = chaptersRef.current.find(
          (c) => c.chapterId === activeChapterId
        )
        const revision = loadedMeta?.revision ?? fallbackMeta?.revision ?? null
        const updatedProgress = markChapterInProgress(pilotId, activeChapterId, {
          scrollPercent: 0,
          revision,
        })
        setProgressState(updatedProgress)
        onProgressChangeRef.current?.()
      } catch (err) {
        if (controller.signal.aborted || isAbortError(err)) return
        const fallback = chaptersRef.current.find(
          (c) => c.chapterId === activeChapterId
        )
        setChapterMeta(fallback || null)
        setChapterContent('')
        setChapterBlocks([])
        setFetchError(
          err instanceof Error
            ? err.message
            : 'Lỗi kết nối máy chủ khi tải nội dung chương.'
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchChapter()
    return () => {
      controller.abort()
    }
  }, [isOpen, pilotId, activeChapterId, reloadToken])

  const currentIdx = chapters.findIndex((c) => c.chapterId === activeChapterId)
  const prevChapter = currentIdx > 0 ? chapters[currentIdx - 1] : null
  const nextChapter =
    currentIdx >= 0 && currentIdx < chapters.length - 1 ? chapters[currentIdx + 1] : null

  // Keyboard navigation: ESC (Lightbox -> Drawer -> Reader), ArrowLeft/ArrowRight
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (lightboxArt) {
          setLightboxArt(null)
          return
        }
        if (isDrawerOpen) {
          setIsDrawerOpen(false)
          return
        }
        onCloseRef.current()
        return
      }

      if (lightboxArt || isDrawerOpen || e.ctrlKey || e.metaKey || e.altKey) {
        return
      }

      const target = e.target as HTMLElement | null
      const tagName = target?.tagName?.toUpperCase() || ''
      if (
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        target?.isContentEditable
      ) {
        return
      }

      if (e.key === 'ArrowLeft' && prevChapter) {
        e.preventDefault()
        selectChapter(prevChapter.chapterId)
      } else if (e.key === 'ArrowRight' && nextChapter) {
        e.preventDefault()
        selectChapter(nextChapter.chapterId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, lightboxArt, isDrawerOpen, prevChapter, nextChapter, selectChapter])

  const handleBodyScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el || loading || fetchError || !activeChapterId) return

    const maxScroll = el.scrollHeight - el.clientHeight
    const pct =
      maxScroll <= 0
        ? 100
        : Math.min(100, Math.max(0, Math.round((el.scrollTop / maxScroll) * 100)))

    setReadingPercent(pct)

    if (maxScroll <= 0) {
      return
    }

    const crossedComplete = pct >= 90 && lastSavedPercentRef.current < 90
    const steppedEnough = Math.abs(pct - lastSavedPercentRef.current) >= 10
    if (crossedComplete || steppedEnough) {
      lastSavedPercentRef.current = pct
      const fallbackMeta = chaptersRef.current.find(
        (c) => c.chapterId === activeChapterId
      )
      const revision = chapterMeta?.revision ?? fallbackMeta?.revision ?? null
      const updated = markChapterInProgress(pilotId, activeChapterId, {
        scrollPercent: pct,
        revision,
      })
      setProgressState(updated)
      onProgressChangeRef.current?.()
    }
  }, [loading, fetchError, activeChapterId, chapterMeta?.revision, pilotId])

  const handleMarkCompleted = useCallback(() => {
    if (!activeChapterId) return
    const fallbackMeta = chaptersRef.current.find(
      (c) => c.chapterId === activeChapterId
    )
    const revision = chapterMeta?.revision ?? fallbackMeta?.revision ?? null
    const updated = markChapterCompleted(pilotId, activeChapterId, {
      scrollPercent: 100,
      revision,
    })
    setReadingPercent(100)
    lastSavedPercentRef.current = 100
    setProgressState(updated)
    onProgressChangeRef.current?.()
  }, [activeChapterId, chapterMeta?.revision, pilotId])

  if (!isOpen) return null

  const rawParagraphs = chapterContent
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith('# '))

  const activeCatalogChapter = chapters.find((c) => c.chapterId === activeChapterId)
  const displayMeta = chapterMeta || activeCatalogChapter || null

  const effectiveEditorial = (
    displayMeta?.editorialStatus ||
    displayMeta?.status ||
    'PROVISIONAL'
  ).toUpperCase()
  const isReconstructed = displayMeta?.sourceIntegrity === 'RECONSTRUCTED_NOT_APPROVED'
  const isReview = effectiveEditorial === 'REVIEW' || isReconstructed

  const activeEffectiveProgress = getEffectiveChapterProgress(
    progressState.chapters[activeChapterId.toLowerCase()],
    displayMeta?.revision
  )
  const isCurrentChapterCompleted = activeEffectiveProgress.effectiveStatus === 'completed'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Trình đọc truyện ${pilotName}`}
      className="fixed inset-0 z-[9980] flex flex-col bg-[#060911]/98 backdrop-blur-xl text-[#F1F5F9] overflow-hidden animate-in fade-in duration-200"
    >
      {/* Top Reader Navigation Bar */}
      <header className="min-h-14 shrink-0 border-b border-[#1E2D42] bg-[#090E1A]/95 px-2.5 sm:px-6 py-1.5 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/15 border border-[#00D4FF]/40 flex items-center justify-center text-[#00D4FF] shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[#00D4FF] truncate">
                {pilotName} // STORY
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#142338] text-[#CBD5E1] border border-[#26384D]">
                {pilotCallsign}
              </span>
              {releaseInfo.releaseVersion && (
                <span className="hidden md:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#070A12] text-[#00D4FF] border border-[#1E2D42]">
                  {releaseInfo.releaseVersion.toUpperCase()} ·{' '}
                  {(releaseInfo.releaseCommitSha || '').slice(0, 7)}
                </span>
              )}
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-white truncate">
              {displayMeta
                ? `Chương ${String(displayMeta.chapterNumber).padStart(2, '0')}: ${displayMeta.title}`
                : 'Đang tải chương...'}
            </h2>
          </div>
        </div>

        {/* Compact Top Bar Navigation: Prev / Chapter Drawer / Next / Close (all >= 44x44px) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={!prevChapter}
            onClick={() => prevChapter && selectChapter(prevChapter.chapterId)}
            aria-label="Chương trước (Mũi tên trái)"
            title={
              prevChapter
                ? `Chương trước: CH.${String(prevChapter.chapterNumber).padStart(2, '0')}`
                : 'Đang ở chương đầu tiên'
            }
            className="min-w-[44px] min-h-[44px] px-2 rounded-lg bg-[#0E1626] border border-[#26384D] hover:border-[#00D4FF] disabled:opacity-35 disabled:pointer-events-none text-[#CBD5E1] hover:text-[#00D4FF] flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Mở danh sách chương truyện"
            aria-expanded={isDrawerOpen}
            className="min-h-[44px] min-w-[44px] px-2.5 sm:px-3 rounded-lg bg-[#142338] hover:bg-[#1B2F4A] border border-[#00D4FF]/50 text-xs font-mono font-bold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <List className="w-4 h-4 text-[#00D4FF] shrink-0" />
            <span>
              CH.{String(displayMeta?.chapterNumber || currentIdx + 1 || 1).padStart(2, '0')}/
              {String(chapters.length || 1).padStart(2, '0')}
            </span>
          </button>

          <button
            type="button"
            disabled={!nextChapter}
            onClick={() => nextChapter && selectChapter(nextChapter.chapterId)}
            aria-label="Chương tiếp theo (Mũi tên phải)"
            title={
              nextChapter
                ? `Chương tiếp: CH.${String(nextChapter.chapterNumber).padStart(2, '0')}`
                : 'Đang ở chương cuối'
            }
            className="min-w-[44px] min-h-[44px] px-2 rounded-lg bg-[#0E1626] border border-[#26384D] hover:border-[#00D4FF] disabled:opacity-35 disabled:pointer-events-none text-[#CBD5E1] hover:text-[#00D4FF] flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng trình đọc truyện"
            className="min-h-[44px] min-w-[44px] px-2.5 rounded-lg bg-rose-950/90 hover:bg-rose-600 border border-rose-500/80 text-white flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0"
            title="Đóng trình đọc truyện (ESC)"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
            <span className="text-xs font-mono font-bold hidden sm:inline">Đóng</span>
          </button>
        </div>
      </header>

      {/* Reading Progress Bar */}
      <div
        role="progressbar"
        aria-label="Tiến độ đọc chương hiện tại"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={isCurrentChapterCompleted ? 100 : readingPercent}
        className="h-1 w-full bg-[#0E1729] shrink-0 overflow-hidden"
      >
        <div
          className={`h-full transition-all duration-150 ${
            isCurrentChapterCompleted
              ? 'bg-[#34D399]'
              : 'bg-gradient-to-r from-[#0284C7] to-[#00D4FF]'
          }`}
          style={{
            width: `${isCurrentChapterCompleted ? 100 : readingPercent}%`,
          }}
        />
      </div>

      {/* Main Content Body */}
      <div
        ref={scrollContainerRef}
        onScroll={handleBodyScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-8"
      >
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#CBD5E1]">
              <Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" />
              <span className="text-xs font-mono uppercase tracking-widest text-center">
                Đang đồng bộ dữ liệu biên niên sử từ release CDN...
              </span>
            </div>
          ) : fetchError ? (
            <div className="py-12 px-5 rounded-2xl border border-rose-500/50 bg-rose-950/25 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Không Thể Tải Nội Dung Chương
                </h3>
                <p className="text-xs sm:text-sm font-mono text-rose-200 max-w-md mx-auto break-words">
                  {fetchError}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReloadToken((n) => n + 1)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#00D4FF] hover:bg-[#38BDF8] text-[#070A12] font-mono text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Thử tải lại (Retry)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0E1626] border border-[#26384D] hover:border-[#00D4FF] text-white font-mono text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <List className="w-4 h-4 text-[#00D4FF]" />
                  <span>Chọn chương khác</span>
                </button>
              </div>
            </div>
          ) : (
            <article className="space-y-8">
              {/* Chapter Title Header */}
              <div className="border-b border-[#1E2D42] pb-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded-md bg-[#00D4FF]/15 border border-[#00D4FF]/40 text-[#00D4FF] font-bold">
                    CHƯƠNG {String(displayMeta?.chapterNumber || 1).padStart(2, '0')}
                  </span>

                  {displayMeta?.revision && (
                    <span className="px-2.5 py-1 rounded-md bg-[#142338] border border-[#26384D] text-white font-bold">
                      REV {displayMeta.revision}
                    </span>
                  )}

                  {isReview ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {isReconstructed
                          ? 'REVIEW · RECONSTRUCTED_NOT_APPROVED'
                          : 'REVIEW PREVIEW'}
                      </span>
                    </span>
                  ) : effectiveEditorial === 'APPROVED' ||
                    effectiveEditorial === 'PUBLISHED' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#34D399]/15 border border-[#34D399]/40 text-[#34D399] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>APPROVED</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#00D4FF]/15 border border-[#00D4FF]/40 text-[#00D4FF] font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>PROVISIONAL</span>
                    </span>
                  )}

                  {isCurrentChapterCompleted && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#34D399]/15 border border-[#34D399]/40 text-[#34D399] font-bold">
                      <Check className="w-3.5 h-3.5" />
                      <span>ĐÃ ĐỌC</span>
                    </span>
                  )}

                  {displayMeta?.wordCount && displayMeta.wordCount > 0 ? (
                    <span className="flex items-center gap-1 text-[#CBD5E1]">
                      <FileText className="w-3.5 h-3.5 text-[#00D4FF]" />
                      {displayMeta.wordCount.toLocaleString()} từ
                    </span>
                  ) : null}
                  {displayMeta?.readingTimeMinutes && displayMeta.readingTimeMinutes > 0 ? (
                    <span className="flex items-center gap-1 text-[#CBD5E1]">
                      <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                      ~{displayMeta.readingTimeMinutes} phút đọc
                    </span>
                  ) : null}
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  {displayMeta?.title}
                </h1>

                {displayMeta?.summary && (
                  <p className="text-base sm:text-lg text-[#CBD5E1] leading-relaxed border-l-2 border-[#00D4FF] pl-4">
                    {displayMeta.summary}
                  </p>
                )}

                {/* Cảnh báo trạng thái biên tập REVIEW / RECONSTRUCTION / sourceNote */}
                {(isReview || displayMeta?.sourceNote) && (
                  <div
                    className={`p-4 rounded-xl border flex items-start gap-3 text-xs sm:text-sm leading-relaxed ${
                      isReview
                        ? 'bg-amber-950/35 border-amber-500/50 text-amber-200'
                        : 'bg-[#0F172A] border-[#26384D] text-[#CBD5E1]'
                    }`}
                  >
                    <AlertTriangle
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        isReview ? 'text-amber-400' : 'text-[#00D4FF]'
                      }`}
                    />
                    <div className="space-y-1">
                      <div className="font-mono font-bold uppercase text-white">
                        {isReconstructed
                          ? 'Bản Khôi Phục Đang Chờ Duyệt Chính Thức (REVIEW · RECONSTRUCTED)'
                          : isReview
                          ? 'Bản Xem Trước Đang Kiểm Duyệt (REVIEW PREVIEW)'
                          : 'Ghi Chú Nguồn Biên Tập'}
                      </div>
                      {displayMeta?.sourceNote && <p>{displayMeta.sourceNote}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Render nguyên văn blocks[] từ JSON R4 */}
              {chapterBlocks.length > 0 ? (
                <div className="space-y-6">
                  {chapterBlocks.map((block) => {
                    if (block.type === 'heading') {
                      const isSub = (block.level || 2) >= 2
                      return isSub ? (
                        <h2
                          key={block.blockId}
                          className="text-xl sm:text-2xl font-bold text-[#00D4FF] pt-4 pb-1 border-b border-[#1E2D42]/80 tracking-wide"
                        >
                          {block.text}
                        </h2>
                      ) : (
                        <h2
                          key={block.blockId}
                          className="text-2xl sm:text-3xl font-black text-white pt-4"
                        >
                          {block.text}
                        </h2>
                      )
                    }

                    if (block.type === 'scene') {
                      const artworks = Array.isArray(block.artworks) ? block.artworks : []
                      const primaryArt = artworks[0]
                      const isVerifiedSceneArt = Boolean(
                        (primaryArt?.cdnVerified && primaryArt?.resolvedUrl) ||
                          (block.cdnVerified && block.resolvedArtworkUrl)
                      )
                      const verifiedImgUrl =
                        primaryArt?.resolvedUrl || block.resolvedArtworkUrl || ''
                      const sceneTitle =
                        block.sceneTitle || primaryArt?.caption || 'Minh họa phân cảnh'
                      const sceneCaption = block.caption || primaryArt?.caption || ''
                      const assetLabel =
                        primaryArt?.filename ||
                        primaryArt?.assetId ||
                        block.sceneId ||
                        'scene-art'
                      const cdnStatus =
                        primaryArt?.cdnStatus || 'PENDING_BINARY_IMPORT'

                      if (isVerifiedSceneArt && verifiedImgUrl) {
                        return (
                          <figure
                            key={block.blockId}
                            className="my-8 rounded-2xl overflow-hidden border border-[#26384D] bg-[#0B1220] shadow-2xl"
                          >
                            <div className="px-4 py-2.5 border-b border-[#1E2D42] bg-[#0E1729] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                              <span className="flex items-center gap-2 text-[#00D4FF] font-bold">
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>MINH HỌA PHÂN CẢNH // {sceneTitle.toUpperCase()}</span>
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/40 font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>CDN VERIFIED</span>
                              </span>
                            </div>

                            <div
                              onClick={() =>
                                setLightboxArt({
                                  url: verifiedImgUrl,
                                  title: sceneTitle,
                                  caption: sceneCaption,
                                })
                              }
                              className="relative w-full h-72 sm:h-96 bg-[#050811] flex items-center justify-center overflow-hidden group cursor-pointer"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={verifiedImgUrl}
                                alt={sceneTitle}
                                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
                              />
                              <button
                                type="button"
                                className="absolute bottom-3 right-3 min-h-[44px] px-3 py-1.5 rounded-lg bg-black/80 border border-[#00D4FF]/40 text-xs font-mono text-[#00D4FF] flex items-center gap-1.5 hover:bg-[#00D4FF] hover:text-slate-950 transition-colors cursor-pointer"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                                <span>Phóng to</span>
                              </button>
                            </div>

                            {sceneCaption && (
                              <figcaption className="p-4 text-xs sm:text-sm text-[#CBD5E1] italic bg-[#090F1C] border-t border-[#1E2D42]">
                                &ldquo;{sceneCaption}&rdquo;
                              </figcaption>
                            )}
                          </figure>
                        )
                      }

                      // T5: Placeholder thu gọn cho PENDING_BINARY_IMPORT — không tải ảnh, không tạo 404
                      return (
                        <figure
                          key={block.blockId}
                          data-scene-status={cdnStatus}
                          className="my-4 rounded-xl border border-[#1E2D42] bg-[#0B1220]/90 px-3.5 py-2.5"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#142338] border border-amber-500/35 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                              <FileArchive className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-bold text-[#E2E8F0] truncate">
                                  Phân cảnh: {sceneTitle}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/35 text-[10px] font-mono font-bold shrink-0">
                                  <Clock className="w-3 h-3" />
                                  <span>{cdnStatus}</span>
                                </span>
                              </div>
                              {sceneCaption && (
                                <p className="text-xs text-[#94A3B8] italic line-clamp-2">
                                  &ldquo;{sceneCaption}&rdquo;
                                </p>
                              )}
                              <div className="text-[11px] font-mono text-[#64748B] truncate">
                                Ref: <span className="text-[#94A3B8]">{assetLabel}</span> · Chờ đồng bộ binary WebP trên CDN
                              </div>
                            </div>
                          </div>
                        </figure>
                      )
                    }

                    if (block.type === 'dialogue') {
                      return (
                        <div
                          key={block.blockId}
                          className="pl-4 sm:pl-5 border-l-2 border-[#00D4FF]/70 py-1 my-2 bg-[#00D4FF]/[0.04] rounded-r-lg"
                        >
                          {block.speaker && (
                            <div className="text-xs font-mono uppercase tracking-wider text-[#00D4FF] font-bold mb-1">
                              {block.speaker}
                            </div>
                          )}
                          <p className="text-[17px] sm:text-[18px] text-white leading-[1.85] font-serif italic">
                            {block.text}
                          </p>
                        </div>
                      )
                    }

                    return (
                      <p
                        key={block.blockId}
                        className="text-[17px] sm:text-[18px] text-[#F1F5F9] leading-[1.85] font-serif tracking-wide"
                      >
                        {block.text}
                      </p>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-6">
                  {rawParagraphs.map((para, idx) => (
                    <p
                      key={idx}
                      className="text-[17px] sm:text-[18px] text-[#F1F5F9] leading-[1.85] font-serif tracking-wide"
                    >
                      {para}
                    </p>
                  ))}
                </div>
              )}

              {/* Completion Action */}
              <div className="pt-6 border-t border-[#1E2D42]/80 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-mono text-[#94A3B8]">
                  Tiến độ cuộn: <span className="text-white font-bold">{readingPercent}%</span>
                  {isCurrentChapterCompleted && (
                    <span className="ml-2 text-[#34D399]">· Đã ghi nhận hoàn thành</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleMarkCompleted}
                  disabled={isCurrentChapterCompleted}
                  className={`min-h-[44px] px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all ${
                    isCurrentChapterCompleted
                      ? 'bg-[#34D399]/15 border border-[#34D399]/40 text-[#34D399] cursor-default'
                      : 'bg-[#142338] hover:bg-[#1E3452] border border-[#00D4FF]/60 text-[#00D4FF] cursor-pointer'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isCurrentChapterCompleted
                      ? 'Đã hoàn thành chương này'
                      : 'Đánh dấu đã hoàn thành'}
                  </span>
                </button>
              </div>

              {/* Bottom Chapter Navigation (Safe Responsive Layout) */}
              <div className="pt-6 border-t border-[#1E2D42] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {prevChapter ? (
                  <button
                    type="button"
                    onClick={() => selectChapter(prevChapter.chapterId)}
                    className="w-full sm:w-auto sm:max-w-[48%] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0E1626] border border-[#26384D] hover:border-[#00D4FF] text-xs font-mono text-white transition-all cursor-pointer min-h-[44px] text-left"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#00D4FF] shrink-0" />
                    <span className="truncate">
                      Chương {String(prevChapter.chapterNumber).padStart(2, '0')}:{' '}
                      {prevChapter.title}
                    </span>
                  </button>
                ) : (
                  <div className="hidden sm:block" />
                )}

                {nextChapter ? (
                  <button
                    type="button"
                    onClick={() => selectChapter(nextChapter.chapterId)}
                    className="w-full sm:w-auto sm:max-w-[48%] flex items-center justify-between sm:justify-end gap-2 px-4 py-2.5 rounded-xl bg-[#00D4FF]/15 border border-[#00D4FF]/50 hover:bg-[#00D4FF]/25 text-xs font-mono font-bold text-[#00D4FF] transition-all cursor-pointer min-h-[44px] text-right"
                  >
                    <span className="truncate">
                      Chương {String(nextChapter.chapterNumber).padStart(2, '0')}:{' '}
                      {nextChapter.title}
                    </span>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </button>
                ) : (
                  <div className="text-xs font-mono text-[#94A3B8] flex items-center gap-1.5 min-h-[44px]">
                    <Sparkles className="w-3.5 h-3.5 text-[#00D4FF] shrink-0" />
                    <span>Đã đến chương cuối trong bản phát hành hiện tại</span>
                  </div>
                )}
              </div>
            </article>
          )}
        </div>
      </div>

      {/* T5: Chapter Selector Drawer (z-[9990], between Reader 9980 and Lightbox 9999) */}
      {isDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Danh sách chương truyện"
          className="fixed inset-0 z-[9990] flex justify-end"
        >
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />
          <aside className="relative z-10 w-full max-w-md h-full bg-[#090E1A] border-l border-[#1E2D42] flex flex-col shadow-2xl">
            <div className="px-4 py-3 border-b border-[#1E2D42] flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#00D4FF] font-bold">
                  {pilotName} // CHAPTER SELECTOR
                </div>
                <div className="text-sm font-bold text-white">
                  Danh Sách Chương ({chapters.length})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Đóng danh sách chương"
                className="min-w-[44px] min-h-[44px] rounded-lg bg-[#0E1626] border border-[#26384D] hover:border-[#00D4FF] text-[#CBD5E1] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {chapters.map((c) => {
                const isSelected = c.chapterId === activeChapterId
                const ed = (c.editorialStatus || c.status || 'PROVISIONAL').toUpperCase()
                const isChapReconstructed =
                  c.sourceIntegrity === 'RECONSTRUCTED_NOT_APPROVED'
                const isChapReview = ed === 'REVIEW' || isChapReconstructed
                const isChapAvailable = c.isAvailable !== false
                const eff = getEffectiveChapterProgress(
                  progressState.chapters[c.chapterId.toLowerCase()],
                  c.revision
                )

                return (
                  <button
                    key={c.chapterId}
                    type="button"
                    onClick={() => selectChapter(c.chapterId)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer min-h-[44px] space-y-2 ${
                      isSelected
                        ? 'bg-[#142338] border-[#00D4FF] shadow-[0_0_16px_rgba(0,212,255,0.2)]'
                        : 'bg-[#0D1524] border-[#1E2D42] hover:border-[#00D4FF]/60 hover:bg-[#111D31]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="px-2 py-0.5 rounded bg-[#070A12] border border-[#26384D] text-[11px] font-mono font-bold text-[#00D4FF]">
                            CH.{String(c.chapterNumber).padStart(2, '0')}
                          </span>
                          {c.revision && (
                            <span className="px-2 py-0.5 rounded bg-[#070A12] border border-[#26384D] text-[10px] font-mono font-bold text-[#CBD5E1]">
                              REV {c.revision}
                            </span>
                          )}
                          {isChapReview ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300">
                              {isChapReconstructed ? 'REVIEW · RECONSTRUCTED' : 'REVIEW'}
                            </span>
                          ) : ed === 'APPROVED' || ed === 'PUBLISHED' ? (
                            <span className="px-2 py-0.5 rounded bg-[#34D399]/15 border border-[#34D399]/40 text-[10px] font-mono font-bold text-[#34D399]">
                              APPROVED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-[#00D4FF]/15 border border-[#00D4FF]/40 text-[10px] font-mono font-bold text-[#00D4FF]">
                              PROVISIONAL
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-bold text-white leading-snug">
                          {c.title}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                      <div className="flex flex-wrap items-center gap-2">
                        {eff.effectiveStatus === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-[#34D399] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đã hoàn thành</span>
                          </span>
                        ) : eff.effectiveStatus === 'in_progress' ? (
                          <span className="inline-flex items-center gap-1 text-[#00D4FF] font-bold">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Đang đọc ({eff.effectiveScrollPercent}%)</span>
                          </span>
                        ) : eff.isRevisionChanged ? (
                          <span className="inline-flex items-center gap-1 text-amber-300 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Bản sửa đổi mới</span>
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">Chưa đọc</span>
                        )}

                        <span className="text-[#475569]">·</span>
                        {isChapAvailable ? (
                          <span className="text-[#CBD5E1]">Khả dụng</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#94A3B8]">
                            <Lock className="w-3 h-3" />
                            <span>Chưa mở</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[#94A3B8]">
                        {c.wordCount && c.wordCount > 0 ? (
                          <span>{c.wordCount.toLocaleString()} từ</span>
                        ) : null}
                        {c.readingTimeMinutes && c.readingTimeMinutes > 0 ? (
                          <span>~{c.readingTimeMinutes}p</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>
        </div>
      )}

      {/* Lightbox Modal for Verified Story Artwork (z-[9999]) */}
      {lightboxArt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightboxArt.title}
          onClick={() => setLightboxArt(null)}
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-3 sm:p-6 select-none animate-in fade-in duration-200"
        >
          {/* Top Bar with Title & Prominent Close (X) Button */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl flex items-center justify-between gap-3 px-3 py-2 rounded-full bg-[#090D18]/95 border border-[#1E2D42] shadow-2xl"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 pl-1">
              <ImageIcon className="w-4 h-4 text-[#00D4FF] shrink-0" />
              <span className="text-xs font-mono font-bold text-white truncate">
                {lightboxArt.title}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setLightboxArt(null)}
              aria-label="Đóng ảnh toàn màn hình"
              className="h-11 min-w-[44px] px-3.5 rounded-full bg-rose-950/95 hover:bg-rose-600 border-2 border-rose-500/90 text-white font-mono text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-xl cursor-pointer shrink-0 active:scale-95"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>Đóng</span>
            </button>
          </div>

          {/* Center Image */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl w-full flex-1 min-h-0 flex flex-col items-center justify-center gap-3 my-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxArt.url}
              alt={lightboxArt.title}
              className="max-h-[72vh] max-w-full object-contain rounded-lg border border-[#26384D] shadow-2xl"
            />
            {lightboxArt.caption && (
              <div className="text-center max-w-2xl px-2">
                <p className="text-xs sm:text-sm text-[#F1F5F9] italic">
                  &ldquo;{lightboxArt.caption}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Bottom Quick Exit Pill for One-Handed Phone Mode */}
          <button
            type="button"
            onClick={() => setLightboxArt(null)}
            className="px-5 py-2.5 rounded-full bg-[#090D18]/95 hover:bg-rose-950 border border-rose-500/70 text-rose-200 font-mono text-xs font-bold flex items-center gap-2 shadow-2xl cursor-pointer min-h-[44px]"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>Thoát chế độ toàn màn hình</span>
          </button>
        </div>
      )}
    </div>
  )
}
export default ImmersiveStoryReader
