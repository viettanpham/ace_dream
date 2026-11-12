'use client'

import React, { useState } from 'react'
import { CharacterProfileV2, StoryChapter } from '@/lib/game/v2/character-profile-data'
import { Card } from '@/components/game/v2/ui'
import { ImmersiveStoryReader } from '@/components/game/v2/story/immersive-story-reader'
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  AlertTriangle,
  Layers,
} from 'lucide-react'

interface StoryTabProps {
  character: CharacterProfileV2
}

export function StoryTab({ character }: StoryTabProps) {
  const [selectedChapter, setSelectedChapter] = useState<StoryChapter | null>(null)

  const chapters = character.chapters || []
  const hasPublishedStory = Boolean(character.storyAvailable && chapters.length > 0)

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
        <div className="p-4 sm:p-5 space-y-3">
          <p className="text-base text-[#F1F5F9] leading-relaxed">
            {character.shortDescription || character.storySummary}
          </p>
        </div>
      </Card>

      {/* 2. Danh sách chương động từ manifest HOẶC Empty State cho các Pilot chưa có truyện */}
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
              <span>Tự động hiển thị khi manifest kênh CDN bổ sung truyện cho {character.classCharacterName}</span>
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

              return (
                <Card
                  key={chap.id}
                  variant="panel"
                  onClick={() => setSelectedChapter(chap)}
                  className={`p-4 sm:p-5 transition-all cursor-pointer border-[#26384D] bg-[#0F172A]/95 hover:border-[#00D4FF] hover:bg-[#142338]/70 active:scale-[0.99]`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#070A12] text-[#00D4FF] border border-[#26384D]">
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
                    <div className="flex items-center gap-3 text-[#94A3B8]">
                      {chap.wordCount ? <span>{chap.wordCount.toLocaleString()} từ</span> : null}
                      {chap.readingTimeMinutes ? (
                        <span>~{chap.readingTimeMinutes} phút đọc</span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-[#00D4FF]">
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
      {selectedChapter && (
        <ImmersiveStoryReader
          pilotId={character.id}
          pilotName={character.classCharacterName}
          pilotCallsign={character.callsign}
          initialChapterId={selectedChapter.id}
          chapters={chapters.map((c) => ({
            chapterId: c.id,
            chapterNumber: c.number,
            title: c.title,
            summary: c.summary,
            status: c.status === 'APPROVED' ? 'PUBLISHED' : c.status,
            editorialStatus: c.editorialStatus || c.status,
            revision: c.revision,
            sourceIntegrity: c.sourceIntegrity,
            sourceNote: c.sourceNote,
            wordCount: c.wordCount,
            readingTimeMinutes: c.readingTimeMinutes,
          }))}
          isOpen={Boolean(selectedChapter)}
          onClose={() => setSelectedChapter(null)}
        />
      )}
    </div>
  )
}

export default StoryTab
