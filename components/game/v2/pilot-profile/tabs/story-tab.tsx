'use client';

import React, { useState, useEffect } from 'react';
import { CharacterProfileV2 } from '@/lib/game/v2/character-profile-data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/game/v2/ui';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Quote,
  Sparkles,
  ChevronRight,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface StoryTabProps {
  character: CharacterProfileV2;
  onOpenReader?: (chapterId: string) => void;
}

interface DynamicChapterItem {
  chapterId: string;
  chapterNumber: number;
  title: string;
  summary: string;
  quote?: string;
  editorialStatus: string;
  contentStatus: string;
  publicationStatus: string;
  contentAvailable: boolean;
  isComingSoon: boolean;
  readingTimeMinutes?: number;
  wordCount?: number;
}

export function StoryTab({ character, onOpenReader }: StoryTabProps) {
  const [chapters, setChapters] = useState<DynamicChapterItem[]>(() =>
    character.chapters.map((ch) => ({
      chapterId: ch.id.startsWith('chap-') ? ch.id : `chap-${String(ch.number).padStart(2, '0')}`,
      chapterNumber: ch.number,
      title: ch.title,
      summary: ch.summary,
      quote: ch.quote,
      editorialStatus: ch.status,
      contentStatus: ch.content ? 'FULL_BODY_IMPORTED' : 'MISSING',
      publicationStatus: ch.status === 'APPROVED' && ch.number === 1 ? 'PUBLISHED' : 'DRAFT',
      contentAvailable: Boolean(ch.number === 1 && (ch.content || character.id === 'valentine')),
      isComingSoon: !(ch.number === 1 && (ch.content || character.id === 'valentine')),
    }))
  );
  const [loadingManifest, setLoadingManifest] = useState<boolean>(true);
  const [activeChapterId, setActiveChapterId] = useState<string>('chap-01');
  const [savedProgress, setSavedProgress] = useState<{ chapterId: string; progress: number } | null>(null);

  // Read saved progress from localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && character.id) {
        const raw = localStorage.getItem(`starfront_reading_progress_${character.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.chapterId) {
            setSavedProgress(parsed);
          }
        }
      }
    } catch {
      // ignore
    }
  }, [character.id]);

  // Reset active chapter to chap-01 when character changes
  useEffect(() => {
    setActiveChapterId('chap-01');
  }, [character.id]);

  // Fetch dynamic chapter catalog from R3 Universal Content Resolver
  useEffect(() => {
    let isCancelled = false;
    setLoadingManifest(true);

    fetch(`/api/runtime/story?pilotId=${character.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.success && Array.isArray(data.chapters) && data.chapters.length > 0) {
          const mapped: DynamicChapterItem[] = data.chapters.map((ch: any) => ({
            chapterId: ch.chapterId || `chap-${String(ch.chapterNumber).padStart(2, '0')}`,
            chapterNumber: ch.chapterNumber || 1,
            title: ch.title || `Chương ${String(ch.chapterNumber).padStart(2, '0')}`,
            summary: ch.summary || 'Hồ sơ cốt truyện đang được xây dựng.',
            quote: ch.quote,
            editorialStatus: ch.editorialStatus || 'NOT_STARTED',
            contentStatus: ch.contentStatus || 'MISSING',
            publicationStatus: ch.publicationStatus || 'NOT_PUBLISHED',
            contentAvailable: Boolean(ch.contentAvailable),
            isComingSoon: ch.isComingSoon !== undefined ? ch.isComingSoon : !ch.contentAvailable,
            readingTimeMinutes: ch.readingTimeMinutes,
            wordCount: ch.wordCount,
          }));

          setChapters(mapped);
          setActiveChapterId((prev) => {
            if (mapped.some((c) => c.chapterId === prev)) return prev;
            return mapped[0]?.chapterId || 'chap-01';
          });
        }
      })
      .catch((err) => {
        console.warn('Failed to load dynamic story catalog:', err);
      })
      .finally(() => {
        if (!isCancelled) setLoadingManifest(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [character.id]);

  const activeChapter =
    chapters.find((c) => c.chapterId === activeChapterId) || chapters[0];

  const canReadActiveChapter = Boolean(activeChapter?.contentAvailable && !activeChapter?.isComingSoon);

  const handleLaunchReader = (targetChapId?: string) => {
    const idToOpen = targetChapId || activeChapter?.chapterId || 'chap-01';
    setActiveChapterId(idToOpen);
    if (onOpenReader) {
      onOpenReader(idToOpen);
    }
  };

  return (
    <div className="w-full space-y-4 font-sans text-slate-100">
      {/* 0. HERO STORY MODE ENTRY CTA */}
      <div className="relative rounded-xl bg-gradient-to-b from-[#071324] via-[#0C1E38] to-[#071324] border border-[#00D4FF]/40 p-3.5 sm:p-4 shadow-lg shadow-cyan-950/30 flex flex-col gap-3">
        <div className="space-y-1.5 w-full">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30">
              IMMERSIVE STORY READER
            </span>
            <span className="text-[11px] font-mono text-[#34D399] font-bold">
              {chapters.filter((c) => c.contentAvailable).length}/{chapters.length} Chương Sẵn Sàng
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
            Biên Niên Sử // {character.classCharacterName}
          </h3>

          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Chế độ đọc truyện toàn màn hình 3 cột kết hợp bối cảnh phân cảnh và minh họa WebP HD.
          </p>

          {savedProgress && savedProgress.progress > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#34D399] pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
              <span>Tiến độ đọc: Chương {savedProgress.chapterId.replace('chap-', '')} ({savedProgress.progress}%)</span>
            </div>
          )}
        </div>

        {onOpenReader && (
          <button
            type="button"
            onClick={() => handleLaunchReader(activeChapter?.chapterId || 'chap-01')}
            className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#00D4FF] to-[#0099CC] hover:from-[#38BDF8] hover:to-[#00D4FF] text-[#070A12] font-mono font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 active:scale-98 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#070A12]" />
            <span>
              {canReadActiveChapter
                ? `MỞ CHẾ ĐỘ ĐỌC (CHƯƠNG ${activeChapter?.chapterNumber ? String(activeChapter.chapterNumber).padStart(2, '0') : '01'})`
                : `XEM TRONG READER (CHƯƠNG ${activeChapter?.chapterNumber ? String(activeChapter.chapterNumber).padStart(2, '0') : '01'})`}
            </span>
          </button>
        )}
      </div>

      {/* 1. TỔNG QUAN TIỂU SỬ */}
      <Card variant="panel" className="border-[#26384D] bg-[#0F172A]/90">
        <CardHeader bordered className="py-2.5 px-3.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#06B6D4]" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9]">
              Tiểu Sử Nhân Vật // {character.classCharacterName}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-3.5 text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
          {character.storySummary}
        </CardContent>
      </Card>

      {/* 2. CHỌN CHƯƠNG (HORIZONTAL SELECTOR RAIL) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-[#26384D] pb-1.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Danh Mục ({chapters.length} Chương)</span>
          </h3>
          <span className="text-[11px] font-mono text-[#06B6D4]">
            {loadingManifest ? 'Nạp manifest...' : `Đang xem: Ch ${activeChapter?.chapterNumber || 1}`}
          </span>
        </div>

        {/* Chapter Selection Horizontal Rail */}
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
          {chapters.map((chap) => {
            const isActive = chap.chapterId === activeChapterId;
            const isAvailable = Boolean(chap.contentAvailable);

            return (
              <button
                key={chap.chapterId}
                type="button"
                onClick={() => setActiveChapterId(chap.chapterId)}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-left font-mono transition-all shrink-0 flex items-center gap-1.5 border text-xs cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#142338] border-[#06B6D4] text-white shadow-sm shadow-[#06B6D4]/30 font-bold'
                    : isAvailable
                    ? 'bg-[#0F172A] border-[#26384D] text-[#A7B6C8] hover:text-[#F1F5F9] hover:border-[#3B526D]'
                    : 'bg-[#070A12]/80 border-[#26384D]/60 text-slate-400 hover:text-white'
                }`}
                title={`Xem Chương ${chap.chapterNumber}: ${chap.title}`}
              >
                {isAvailable ? (
                  <CheckCircle2 className="w-3 h-3 text-[#34D399] shrink-0" />
                ) : (
                  <Clock className="w-3 h-3 text-[#FBBF24] shrink-0" />
                )}
                <span className="font-bold text-[#00D4FF]">
                  {String(chap.chapterNumber).padStart(2, '0')}
                </span>
                <span className="truncate max-w-[120px] font-sans font-medium">
                  {chap.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. ACTIVE CHAPTER CARD (SINGLE-COLUMN FULL WIDTH HIERARCHY) */}
      {activeChapter && (
        <Card variant="panel" className="border-[#26384D] bg-[#0F172A]/90 overflow-hidden">
          <CardHeader bordered className="p-3.5 sm:p-4 bg-[#142338]/40 space-y-2">
            {/* Top row: Chapter Badge & Status Badge on single full-width line */}
            <div className="flex items-center justify-between w-full gap-2">
              <span className="px-2 py-0.5 rounded bg-[#070A12] border border-[#26384D] text-xs font-mono font-bold text-[#06B6D4] shrink-0">
                CHƯƠNG {String(activeChapter.chapterNumber).padStart(2, '0')}
              </span>

              {canReadActiveChapter ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  ĐÃ XUẤT BẢN // SẴN SÀNG
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30 shrink-0">
                  <Clock className="w-3 h-3" />
                  COMING SOON
                </span>
              )}
            </div>

            {/* Second row: Full-width title without awkward wrapping */}
            <h4 className="text-base font-bold text-white tracking-wide leading-snug w-full break-words">
              {activeChapter.title}
            </h4>
          </CardHeader>

          <CardContent className="p-3.5 sm:p-4 space-y-3">
            {/* Summary Box */}
            <div className="p-3 rounded-lg bg-[#070A12]/60 border-l-2 border-[#06B6D4] text-xs text-[#CBD5E1] leading-relaxed">
              <strong className="text-[#06B6D4]">Tóm Tắt Bối Cảnh: </strong>
              {activeChapter.summary}
            </div>

            {/* Quote if present */}
            {activeChapter.quote && (
              <div className="p-3 rounded-lg bg-[#142338]/50 border border-[#26384D] flex items-start gap-2.5">
                <Quote className="w-4 h-4 text-[#06B6D4] shrink-0 mt-0.5" />
                <p className="text-xs italic font-medium text-[#F1F5F9] leading-relaxed">
                  {activeChapter.quote}
                </p>
              </div>
            )}

            {/* Reading stats */}
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 pt-0.5 flex-wrap">
              <span>Thời gian: ~{activeChapter.readingTimeMinutes || 5} phút</span>
              <span>·</span>
              <span>Dung lượng: ~{activeChapter.wordCount || (canReadActiveChapter ? 780 : 180)} từ</span>
              {canReadActiveChapter && (
                <>
                  <span>·</span>
                  <span className="text-cyan-400 font-semibold">3 Phân Cảnh Minh Họa</span>
                </>
              )}
            </div>

            {/* Launch Reader CTA */}
            {onOpenReader && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => handleLaunchReader(activeChapter.chapterId)}
                  className={`w-full py-2.5 px-4 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-sm ${
                    canReadActiveChapter
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                      : 'bg-[#142338] hover:bg-[#1E3553] text-cyan-300 border border-cyan-800/60'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>
                    {canReadActiveChapter
                      ? `MỞ ĐỌC TOÀN VĂN CHƯƠNG ${String(activeChapter.chapterNumber).padStart(2, '0')}`
                      : `XEM BỐI CẢNH CHƯƠNG ${String(activeChapter.chapterNumber).padStart(2, '0')} TRONG READER`}
                  </span>
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 4. CHAPTER DIRECTORY (VERTICAL SCROLLABLE LIST) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between border-b border-[#26384D] pb-1.5">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#A7B6C8] flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#00D4FF]" />
            <span>Tất Cả Các Chương ({chapters.length})</span>
          </h4>
          <span className="text-[10px] font-mono text-slate-400">
            Nhấn để chọn hoặc đọc
          </span>
        </div>

        <div className="flex flex-col gap-2 w-full">
          {chapters.map((chap) => {
            const isAvailable = Boolean(chap.contentAvailable);
            const isSelected = chap.chapterId === activeChapterId;

            return (
              <div
                key={`card-${chap.chapterId}`}
                onClick={() => {
                  setActiveChapterId(chap.chapterId);
                }}
                className={`w-full p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-[#0f2138] border-[#00D4FF] shadow-sm shadow-cyan-950/40'
                    : 'bg-[#071120]/80 border-[#26384D] hover:border-[#3B526D] hover:bg-[#0c1a2e]'
                }`}
              >
                <div className="flex items-center justify-between w-full gap-2">
                  <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-[#070A12] border border-[#26384D] text-[#00D4FF]">
                    CHƯƠNG {String(chap.chapterNumber).padStart(2, '0')}
                  </span>
                  {isAvailable ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#34D399] bg-[#34D399]/10 px-1.5 py-0.2 rounded border border-[#34D399]/30">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      CÓ VĂN XUÔI
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#FBBF24] bg-[#FBBF24]/10 px-1.5 py-0.2 rounded border border-[#FBBF24]/30">
                      <Clock className="w-2.5 h-2.5" />
                      COMING SOON
                    </span>
                  )}
                </div>

                <h5 className="text-xs font-bold text-white leading-snug break-words">
                  {chap.title}
                </h5>

                <p className="text-[11px] text-[#94A3B8] leading-relaxed line-clamp-2">
                  {chap.summary}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-[#1C2C3E] text-[11px] font-mono">
                  <span className="text-[#64748B]">
                    {isAvailable ? '~6 phút đọc' : 'Đang phát triển'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLaunchReader(chap.chapterId);
                    }}
                    className="text-[#00D4FF] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <span>{isAvailable ? 'Đọc Ngay' : 'Xem Reader'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

