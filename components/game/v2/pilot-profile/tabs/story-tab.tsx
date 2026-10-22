'use client'

import React, { useState } from 'react'
import { CharacterProfileV2, StoryChapter } from '@/lib/game/v2/character-profile-data'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/game/v2/ui'
import { BookOpen, Lock, CheckCircle2, Clock, Quote, ChevronRight } from 'lucide-react'

interface StoryTabProps {
  character: CharacterProfileV2
}

export function StoryTab({ character }: StoryTabProps) {
  // Default selected chapter is the first approved chapter
  const [activeChapterId, setActiveChapterId] = useState<string>(
    character.chapters.length > 0 ? character.chapters[0].id : 'chap-01'
  )

  const activeChapter = character.chapters.find((c) => c.id === activeChapterId) || character.chapters[0]

  return (
    <div className="space-y-6">
      {/* 1. TỔNG QUAN TIỂU SỬ */}
      <Card variant="panel" className="border-[#26384D] bg-[#0F172A]/90">
        <CardHeader bordered className="py-3 px-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#06B6D4]" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#F1F5F9]">
              Tiểu Sử Nhân Vật // {character.classCharacterName}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed">
            {character.storySummary}
          </p>
        </CardContent>
      </Card>

      {/* 2. CHƯƠNG HỒI BIÊN NIÊN (STORY CHAPTERS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#26384D] pb-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#F1F5F9] flex items-center gap-2">
            <span>Biên Niên Ký (10 Chương Lộ Trình)</span>
          </h3>
          <span className="text-xs font-mono text-[#06B6D4]">
            Chương 01–04: APPROVED · 05–06: PROVISIONAL · 07–10: HOLD
          </span>
        </div>

        {/* Chapter Selection Horizontal Rail on Mobile / List on Desktop */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {character.chapters.map((chap) => {
            const isActive = chap.id === activeChapterId
            const isHold = chap.status === 'HOLD'
            const isProvisional = chap.status === 'PROVISIONAL'

            return (
              <button
                key={chap.id}
                type="button"
                onClick={() => setActiveChapterId(chap.id)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-left font-mono transition-all shrink-0 flex items-center gap-2 border text-xs sm:text-sm cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#142338] border-[#06B6D4] text-[#F1F5F9] shadow-md shadow-[#06B6D4]/10'
                    : isHold
                    ? 'bg-[#070A12]/60 border-[#26384D]/40 text-[#A7B6C8]/60 hover:text-[#A7B6C8] hover:border-[#26384D]'
                    : 'bg-[#0F172A] border-[#26384D] text-[#A7B6C8] hover:text-[#F1F5F9] hover:border-[#3B526D]'
                }`}
              >
                {isHold ? (
                  <Lock className="w-3.5 h-3.5 text-[#F87171] shrink-0" />
                ) : isProvisional ? (
                  <Clock className="w-3.5 h-3.5 text-[#FBBF24] shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                )}
                <span className="font-bold">
                  {chap.number < 10 ? `0${chap.number}` : chap.number}
                </span>
                <span className="truncate max-w-[120px] sm:max-w-[160px] font-sans font-medium">
                  {chap.title}
                </span>
              </button>
            )
          })}
        </div>

        {/* Active Chapter Reader */}
        {activeChapter && (
          <Card variant="panel" className="border-[#26384D] bg-[#0F172A]/90 overflow-hidden">
            <CardHeader bordered className="p-4 sm:p-5 bg-[#142338]/40">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-[#070A12] border border-[#26384D] text-xs font-mono font-bold text-[#06B6D4]">
                    CHƯƠNG {activeChapter.number < 10 ? `0${activeChapter.number}` : activeChapter.number}
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-[#F1F5F9]">
                    {activeChapter.title}
                  </h4>
                </div>

                {/* Status Badge */}
                {activeChapter.status === 'APPROVED' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ĐÃ PHÊ DUYỆT (APPROVED)
                  </span>
                )}
                {activeChapter.status === 'PROVISIONAL' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30">
                    <Clock className="w-3.5 h-3.5" />
                    TẠM THỜI (PROVISIONAL)
                  </span>
                )}
                {activeChapter.status === 'HOLD' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#F87171]/15 text-[#F87171] border border-[#F87171]/30">
                    <Lock className="w-3.5 h-3.5" />
                    NIÊM PHONG (HOLD)
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 sm:py-7">
              {/* If chapter is HOLD */}
              {activeChapter.status === 'HOLD' ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#142338] border border-[#26384D] flex items-center justify-center text-[#F87171]">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-base font-bold text-[#F1F5F9]">
                      Hồ Sơ Cốt Truyện Đang Được Niêm Phong
                    </h5>
                    <p className="text-xs sm:text-sm text-[#A7B6C8] max-w-md mx-auto leading-relaxed">
                      Chương {activeChapter.number} thuộc giai đoạn phát triển sau (HOLD). Nội dung chưa được giải mã nhằm đảm bảo bí mật chiến dịch Starfront.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Summary / Lead */}
                  <div className="p-3.5 rounded-xl bg-[#070A12]/60 border-l-4 border-[#06B6D4] text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
                    <strong className="text-[#06B6D4]">Tóm Tắt Bối Cảnh: </strong>
                    {activeChapter.summary}
                  </div>

                  {/* Chapter Quote if any */}
                  {activeChapter.quote && (
                    <div className="p-4 rounded-xl bg-[#142338]/50 border border-[#26384D] flex items-start gap-3">
                      <Quote className="w-5 h-5 text-[#06B6D4] shrink-0 mt-0.5" />
                      <p className="text-sm italic font-medium text-[#F1F5F9] leading-relaxed">
                        {activeChapter.quote}
                      </p>
                    </div>
                  )}

                  {/* Full Prose Content if available (Chapter 01) */}
                  {activeChapter.content ? (
                    <div className="story-reader max-w-prose space-y-4 text-[15px] sm:text-[17px] text-[#CBD5E1] leading-[1.65] font-normal pt-2">
                      {activeChapter.content.split('\n\n').map((paragraph, pIdx) => (
                        <p key={pIdx}>{paragraph}</p>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-2 border border-dashed border-[#26384D] rounded-xl p-4">
                      <p className="text-xs sm:text-sm text-[#A7B6C8]">
                        Đoạn văn xuôi chi tiết cho chương này đang được biên tập theo tiến độ duyệt nội dung.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
