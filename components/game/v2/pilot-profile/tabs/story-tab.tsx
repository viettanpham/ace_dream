'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { CharacterProfileV2, StoryChapter } from '@/lib/game/v2/character-profile-data'
import { Card } from '@/components/game/v2/ui'
import { ImmersiveStoryReader } from '@/components/game/v2/story/immersive-story-reader'
import {
  loadPilotStoryProgress,
  getEffectiveChapterProgress,
  getContinueReadingChapter,
  type PilotStoryProgressState,
} from '@/lib/game/v2/story-progress'
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  AlertTriangle,
  Layers,
  Play,
  Image as ImageIcon,
  Lock,
} from 'lucide-react'

interface StoryTabProps {
  character: CharacterProfileV2
  activeStoryChapterId?: string | null
  onSelectStoryChapterId?: (chapterId: string | null) => void
  isReaderOpen?: boolean
  onSetReaderOpen?: (open: boolean) => void
}

export function StoryTab({
  character,
  activeStoryChapterId,
  onSelectStoryChapterId,
  isReaderOpen,
  onSetReaderOpen,
}: StoryTabProps) {
  const [localSelectedChapterId, setLocalSelectedChapterId] = useState<string | null>(null)
  const [localReaderOpen, setLocalReaderOpen] = useState<boolean>(false)
  const [progressState, setProgressState] = useState<PilotStoryProgressState>(() =>
    loadPilotStoryProgress(character.id)
  )

  const chapters = useMemo(() => character.chapters || [], [character.chapters])
  const hasPublishedStory = Boolean(character.storyAvailable && chapters.length > 0)

  const refreshProgress = useCallback(() => {
    setProgressState(loadPilotStoryProgress(character.id))
  }, [character.id])

  // Isolate progress & selected chapter strictly per pilotId
  useEffect(() => {
    const fresh = loadPilotStoryProgress(character.id)
    setProgressState(fresh)
    if (onSetReaderOpen) {
      // Controlled mode: PilotProfileV2 handles per-pilot state cleanly
    } else {
      setLocalReaderOpen(false)
      setLocalSelectedChapterId(fresh.lastActiveChapterId)
    }
  }, [character.id, onSetReaderOpen])

  const effectiveReaderOpen =
    typeof isReaderOpen === 'boolean' ? isReaderOpen : localReaderOpen
  const effectiveChapterId =
    activeStoryChapterId !== undefined
      ? activeStoryChapterId || progressState.lastActiveChapterId
      : localSelectedChapterId || progressState.lastActiveChapterId

  const openChapterInReader = useCallback(
    (chapId: string) => {
      if (onSelectStoryChapterId) {
        onSelectStoryChapterId(chapId)
      } else {
        setLocalSelectedChapterId(chapId)
      }
      if (onSetReaderOpen) {
        onSetReaderOpen(true)
      } else {
        setLocalReaderOpen(true)
      }
    },
    [onSelectStoryChapterId, onSetReaderOpen]
  )

  const closeReader = useCallback(() => {
    if (onSetReaderOpen) {
      onSetReaderOpen(false)
    } else {
      setLocalReaderOpen(false)
    }
    refreshProgress()
  }, [onSetReaderOpen, refreshProgress])

  const completedCount = useMemo(() => {
    if (!hasPublishedStory) return 0
    return chapters.filter((chap) => {
      const eff = getEffectiveChapterProgress(
        progressState.chapters[chap.id.toLowerCase()],
        chap.revision
      )
      return eff.effectiveStatus === 'completed'
    }).length
  }, [hasPublishedStory, chapters, progressState])

  const progressPercent =
    chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0

  const continueTarget = useMemo(() => {
    if (!hasPublishedStory) return null
    return getContinueReadingChapter(character.id, chapters)
  }, [hasPublishedStory, character.id, chapters])

  const continueEffective = continueTarget
    ? getEffectiveChapterProgress(
        progressState.chapters[continueTarget.id.toLowerCase()],
        continueTarget.revision
      )
    : null

  const getContinueLabel = () => {
    if (!continueTarget) return 'Đọc truyện'
    const numStr = String(continueTarget.number).padStart(2, '0')
    if (completedCount >= chapters.length && chapters.length > 0) {
      return `Đọc lại CH.${numStr}`
    }
    if (continueEffective?.effectiveStatus === 'in_progress') {
      return `Tiếp tục đọc CH.${numStr} (${continueEffective.effectiveScrollPercent}%)`
    }
    if (continueEffective?.isRevisionChanged) {
      return `Đọc bản mới CH.${numStr}`
    }
    if (completedCount === 0) {
      return `Bắt đầu đọc CH.${numStr}`
    }
    return `Đọc tiếp CH.${numStr}`
  }

  const getEditorialBadge = (chap: StoryChapter) => {
    const raw = (chap.editorialStatus || chap.status || 'PROVISIONAL').toUpperCase()
    const isReconstructed = chap.sourceIntegrity === 'RECONSTRUCTED_NOT_APPROVED'

    if (raw === 'REVIEW' || isReconstructed) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>
            {isReconstructed ? 'REVIEW · BẢN KHÔI PHỤC' : 'REVIEW PREVIEW'}
          </span>
        </span>
      )
    }

    if (raw === 'APPROVED' || raw === 'PUBLISHED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/40">
          <CheckCircle2 className="w-3 h-3" />
          <span>APPROVED</span>
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/40">
        <Clock className="w-3 h-3" />
        <span>PROVISIONAL</span>
      </span>
    )
  }

  const getReadingBadge = (chap: StoryChapter) => {
    const eff = getEffectiveChapterProgress(
      progressState.chapters[chap.id.toLowerCase()],
      chap.revision
    )

    if (eff.effectiveStatus === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/40">
          <CheckCircle2 className="w-3 h-3" />
          <span>ĐÃ HOÀN THÀNH</span>
        </span>
      )
    }

    if (eff.effectiveStatus === 'in_progress') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/40">
          <BookOpen className="w-3 h-3" />
          <span>ĐANG ĐỌC · {eff.effectiveScrollPercent}%</span>
        </span>
      )
    }

    if (eff.isRevisionChanged) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
          <AlertTriangle className="w-3 h-3" />
          <span>BẢN SỬA ĐỔI MỚI</span>
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#070A12] text-[#94A3B8] border border-[#26384D]">
        <span>CHƯA ĐỌC</span>
      </span>
    )
  }

  return (
    <div className="space-y-6 text-[#F1F5F9]">
      {/* 1. Tóm tắt biên niên sử nhân vật */}
      <Card variant="panel" className="border-[#26384D] bg-[#0F172A]/95 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#26384D] bg-gradient-to-r from-[#142338] to-[#0F172A] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00D4FF]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Biên Niên Sử Phi Công ({character.classCharacterName})
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-[#070A12] border border-[#26384D] text-[#00D4FF]">
              Release {character.releaseVersion?.toUpperCase() || 'R4'}
            </span>
            {hasPublishedStory && (
              <span className="px-2 py-0.5 rounded bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] font-bold">
                {chapters.length} Chương
              </span>
            )}
          </div>
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          <p className="text-base text-[#F1F5F9] leading-relaxed">
            {character.shortDescription || character.storySummary}
          </p>

          {/* T6: Tổng quan tiến độ đọc X/5 & Continue Reading (chỉ hiển thị cho Pilot có Story) */}
          {hasPublishedStory && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#070A12]/90 border border-[#1E2D42] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 text-xs font-mono">
                  <span className="text-[#CBD5E1] font-bold uppercase tracking-wider">
                    Tiến Độ Đọc
                  </span>
                  <span className="text-[#00D4FF] font-bold tabular-nums">
                    {completedCount}/{chapters.length} chương ({progressPercent}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#142338] overflow-hidden border border-[#1E2D42]">
                  <div
                    className="h-full bg-gradient-to-r from-[#0284C7] via-[#00D4FF] to-[#34D399] transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {continueTarget && (
                <button
                  type="button"
                  onClick={() => openChapterInReader(continueTarget.id)}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#00D4FF] hover:bg-[#38BDF8] text-[#070A12] font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-[0_0_18px_rgba(0,212,255,0.28)] transition-all active:scale-[0.98]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{getContinueLabel()}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* 2. Danh sách chương động từ manifest HOẶC Empty State cho 11 Pilot chưa có truyện */}
      {!hasPublishedStory ? (
        <Card
          variant="panel"
          className="border-[#26384D] bg-[#0F172A]/90 p-6 sm:p-8 text-center space-y-3"
        >
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#142338] border border-[#26384D] flex items-center justify-center text-[#00D4FF]">
            <BookOpen className="w-6 h-6" />
          </div>
          <h4 className="text-base sm:text-lg font-bold text-white">
            Chưa Có Chương Truyện Xuất Bản Trong Bản Phát Hành Này
          </h4>
          <p className="text-sm sm:text-base text-[#CBD5E1] max-w-lg mx-auto leading-relaxed">
            {character.storyEmptyState || 'Nội dung truyện đang được phát triển.'}
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#070A12] border border-[#26384D] text-xs font-mono text-[#94A3B8]">
              <Layers className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>
                Tự động hiển thị khi manifest kênh CDN bổ sung truyện cho{' '}
                {character.classCharacterName}
              </span>
            </span>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#00D4FF]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Danh Sách Chương ({chapters.length} Chương Từ Manifest CDN)
              </h3>
            </div>
            <span className="text-xs font-mono text-[#CBD5E1]">
              Bấm vào chương để mở Trình Đọc Truyện
            </span>
          </div>

          <div className="space-y-3">
            {chapters.map((chap) => {
              const isReview =
                chap.editorialStatus === 'REVIEW' ||
                chap.status === 'REVIEW' ||
                chap.sourceIntegrity === 'RECONSTRUCTED_NOT_APPROVED'
              const isAvailable = chap.isAvailable !== false
              const hasSceneMeta = typeof chap.sceneCount === 'number' && chap.sceneCount > 0
              const verifiedScenes = chap.verifiedSceneCount ?? 0
              const totalScenes = chap.sceneCount ?? 0
              const isLastActive =
                Boolean(effectiveChapterId) &&
                effectiveChapterId?.toLowerCase() === chap.id.toLowerCase()

              return (
                <Card
                  key={chap.id}
                  variant="panel"
                  onClick={() => isAvailable && openChapterInReader(chap.id)}
                  className={`p-4 sm:p-5 transition-all bg-[#0F172A]/95 ${
                    isAvailable
                      ? 'cursor-pointer hover:border-[#00D4FF] hover:bg-[#142338]/70 active:scale-[0.99]'
                      : 'opacity-75 cursor-not-allowed'
                  } ${
                    isLastActive
                      ? 'border-[#00D4FF]/70 ring-1 ring-[#00D4FF]/30'
                      : 'border-[#26384D]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#070A12] text-[#00D4FF] border border-[#26384D] shrink-0">
                        CH.{String(chap.number).padStart(2, '0')}
                      </span>
                      <h4 className="text-base sm:text-lg font-bold text-white">
                        {chap.title}
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {chap.revision && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#070A12] text-[#CBD5E1] border border-[#26384D]">
                          REV {chap.revision}
                        </span>
                      )}
                      {getEditorialBadge(chap)}
                      {getReadingBadge(chap)}
                    </div>
                  </div>

                  <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed">
                    {chap.summary}
                  </p>

                  {isReview && chap.sourceNote && (
                    <div className="mt-3 p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{chap.sourceNote}</span>
                    </div>
                  )}

                  <div className="mt-3 pt-2.5 border-t border-[#1E2D42] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#00D4FF]">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#94A3B8]">
                      {chap.wordCount ? <span>{chap.wordCount.toLocaleString()} từ</span> : null}
                      {chap.readingTimeMinutes ? (
                        <span>~{chap.readingTimeMinutes} phút đọc</span>
                      ) : null}
                      {hasSceneMeta && (
                        <span className="inline-flex items-center gap-1 text-[#CBD5E1]">
                          <ImageIcon className="w-3.5 h-3.5 text-[#00D4FF]" />
                          <span>
                            {verifiedScenes}/{totalScenes} ảnh phân cảnh
                          </span>
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 ${
                          isAvailable ? 'text-[#34D399]' : 'text-[#94A3B8]'
                        }`}
                      >
                        {isAvailable ? (
                          <span>Khả dụng</span>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Chưa khả dụng</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-bold text-[#00D4FF] min-h-[28px]">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Mở Toàn Văn Chương {String(chap.number).padStart(2, '0')} →</span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Trình Đọc Truyện Immersive Story Reader */}
      {hasPublishedStory && effectiveReaderOpen && (
        <ImmersiveStoryReader
          pilotId={character.id}
          pilotName={character.classCharacterName}
          pilotCallsign={character.callsign}
          initialChapterId={effectiveChapterId || chapters[0]?.id}
          chapters={chapters.map((c) => ({
            chapterId: c.id,
            chapterNumber: c.number,
            title: c.title,
            summary: c.summary,
            status: c.status === 'APPROVED' ? 'PUBLISHED' : c.status,
            editorialStatus: c.editorialStatus || c.status,
            publicationStatus: c.publicationStatus,
            contentType: c.contentType,
            revision: c.revision,
            sourceIntegrity: c.sourceIntegrity,
            sourceNote: c.sourceNote,
            wordCount: c.wordCount,
            readingTimeMinutes: c.readingTimeMinutes,
            sceneCount: c.sceneCount,
            verifiedSceneCount: c.verifiedSceneCount,
            isAvailable: c.isAvailable,
          }))}
          isOpen={effectiveReaderOpen}
          onClose={closeReader}
          onChapterChange={(chapId) => {
            if (onSelectStoryChapterId) {
              onSelectStoryChapterId(chapId)
            } else {
              setLocalSelectedChapterId(chapId)
            }
          }}
          onProgressChange={refreshProgress}
        />
      )}
    </div>
  )
}

export default StoryTab
