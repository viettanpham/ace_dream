'use client';

import React, { useState, useEffect } from 'react';
import { CharacterProfileV2, StoryChapter } from '@/lib/game/v2/character-profile-data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/game/v2/ui';
import {
  BookOpen,
  Lock,
  CheckCircle2,
  Clock,
  Quote,
  Sparkles,
  ExternalLink,
  Layers,
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
  const [chapters, setChapters] = useState<DynamicChapterItem[]>([]);
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
          if (!mapped.some((c) => c.chapterId === activeChapterId)) {
            setActiveChapterId(mapped[0].chapterId);
          }
        } else {
          // Fallback to static chapters from character data
          const fallback: DynamicChapterItem[] = character.chapters.map((ch) => ({
            chapterId: ch.id,
            chapterNumber: ch.number,
            title: ch.title,
            summary: ch.summary,
            quote: ch.quote,
            editorialStatus: ch.status,
            contentStatus: ch.content ? 'FULL_BODY_IMPORTED' : 'MISSING',
            publicationStatus: ch.status === 'APPROVED' && ch.number === 1 ? 'PUBLISHED' : 'DRAFT',
            contentAvailable: Boolean(ch.number === 1 && (ch.content || character.id === 'valentine')),
            isComingSoon: !(ch.number === 1 && (ch.content || character.id === 'valentine')),
          }));
          setChapters(fallback);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          // Fallback gracefully on network error
          const fallback: DynamicChapterItem[] = character.chapters.map((ch) => ({
            chapterId: ch.id,
            chapterNumber: ch.number,
            title: ch.title,
            summary: ch.summary,
            quote: ch.quote,
            editorialStatus: ch.status,
            contentStatus: ch.content ? 'FULL_BODY_IMPORTED' : 'MISSING',
            publicationStatus: ch.status === 'APPROVED' && ch.number === 1 ? 'PUBLISHED' : 'DRAFT',
            contentAvailable: Boolean(ch.number === 1 && (ch.content || character.id === 'valentine')),
            isComingSoon: !(ch.number === 1 && (ch.content || character.id === 'valentine')),
          }));
          setChapters(fallback);
        }
      })
      .finally(() => {
        if (!isCancelled) setLoadingManifest(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [character.id, character.chapters]);

  const activeChapter =
    chapters.find((c) => c.chapterId === activeChapterId) || chapters[0];

  const canReadActiveChapter = Boolean(activeChapter?.contentAvailable);

  return (
    <div className="space-y-6">
      {/* 0. HERO STORY MODE ENTRY CTA */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#071324] via-[#0C1E38] to-[#071324] border border-[#00D4FF]/40 p-4 sm:p-5 shadow-xl shadow-cyan-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30">
              IMMERSIVE STORY READER // CDN R3
            </span>
            <span className="text-[11px] font-mono text-[#CBD5E1]">
              {chapters.length} Chương Biên Niên Ký
            </span>
            {character.id === 'valentine' ? (
              <span className="text-[10px] font-mono text-[#34D399] bg-[#34D399]/10 px-2 py-0.5 rounded border border-[#34D399]/30">
                Chương 01: Toàn Văn Sẵn Sàng
              </span>
            ) : (
              <span className="text-[10px] font-mono text-[#FBBF24] bg-[#FBBF24]/10 px-2 py-0.5 rounded border border-[#FBBF24]/30">
                Chương 01–07: Đang Phát Triển
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <span>Biên Niên Sử Không Gian // {character.classCharacterName}</span>
          </h3>
          <p className="text-xs text-[#94A3B8] leading-relaxed max-w-xl">
            Toàn bộ danh mục chương truyện từ CDN R3. Trải nghiệm chế độ đọc 3 cột với bối cảnh phân cảnh và minh họa WebP HD.
          </p>
          {savedProgress && savedProgress.progress > 0 && (
            <div className="flex items-center gap-2 text-xs font-mono text-[#34D399] pt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
              <span>Tiến độ đọc: Chương {savedProgress.chapterId.replace('chap-', '')} ({savedProgress.progress}%)</span>
            </div>
          )}
        </div>

        {onOpenReader && canReadActiveChapter && (
          <button
            type="button"
            onClick={() => onOpenReader(savedProgress?.chapterId || activeChapter?.chapterId || 'chap-01')}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#0099CC] hover:from-[#38BDF8] hover:to-[#00D4FF] text-[#070A12] font-mono font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-500/25 active:scale-95 cursor-pointer shrink-0"
          >
            <BookOpen className="w-5 h-5 text-[#070A12]" />
            <span>
              {savedProgress && savedProgress.progress > 0
                ? `TIẾP TỤC ĐỌC (CHƯƠNG ${savedProgress.chapterId.replace('chap-', '')})`
                : 'MỞ CHẾ ĐỘ ĐỌC TRUYỆN'}
            </span>
          </button>
        )}
      </div>

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#26384D] pb-2 gap-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#F1F5F9] flex items-center gap-2">
            <span>Danh Mục Chương (R3 Story Manifest)</span>
          </h3>
          <span className="text-xs font-mono text-[#06B6D4]">
            {loadingManifest ? 'Đang nạp manifest CDN...' : `${chapters.length} Chương Đã Khai Báo`}
          </span>
        </div>

        {/* Chapter Selection Horizontal Rail */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {chapters.map((chap) => {
            const isActive = chap.chapterId === activeChapterId;
            const isAvailable = Boolean(chap.contentAvailable);

            return (
              <button
                key={chap.chapterId}
                type="button"
                onClick={() => setActiveChapterId(chap.chapterId)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-left font-mono transition-all shrink-0 flex items-center gap-2 border text-xs sm:text-sm cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#142338] border-[#06B6D4] text-[#F1F5F9] shadow-md shadow-[#06B6D4]/10'
                    : isAvailable
                    ? 'bg-[#0F172A] border-[#26384D] text-[#A7B6C8] hover:text-[#F1F5F9] hover:border-[#3B526D]'
                    : 'bg-[#070A12]/60 border-[#26384D]/40 text-[#A7B6C8]/60 hover:text-[#A7B6C8] hover:border-[#26384D]'
                }`}
              >
                {isAvailable ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-[#FBBF24] shrink-0" />
                )}
                <span className="font-bold">
                  {chap.chapterNumber < 10 ? `0${chap.chapterNumber}` : chap.chapterNumber}
                </span>
                <span className="truncate max-w-[120px] sm:max-w-[160px] font-sans font-medium">
                  {chap.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Chapter Card */}
        {activeChapter && (
          <Card variant="panel" className="border-[#26384D] bg-[#0F172A]/90 overflow-hidden">
            <CardHeader bordered className="p-4 sm:p-5 bg-[#142338]/40">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-[#070A12] border border-[#26384D] text-xs font-mono font-bold text-[#06B6D4]">
                    CHƯƠNG {activeChapter.chapterNumber < 10 ? `0${activeChapter.chapterNumber}` : activeChapter.chapterNumber}
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-[#F1F5F9]">
                    {activeChapter.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  {canReadActiveChapter ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ĐÃ XUẤT BẢN // PUBLISHED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30">
                      <Clock className="w-3.5 h-3.5" />
                      ĐANG PHÁT TRIỂN // COMING SOON
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 sm:py-7">
              {canReadActiveChapter ? (
                <div className="space-y-5">
                  {/* Hero Reader CTA Banner */}
                  {onOpenReader && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/80 via-[#10243E] to-slate-900 border border-cyan-500/50 shadow-lg shadow-cyan-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300 font-bold">
                            TRẢI NGHIỆM ĐỌC ĐẮM CHÌM // IMMERSIVE 3-COLUMN
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          Bao gồm bối cảnh phân cảnh đồng bộ, minh họa artwork và bộ chỉnh kích cỡ văn xuôi.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenReader(activeChapter.chapterId)}
                        className="px-4 py-2.5 rounded-lg bg-cyan-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider hover:bg-cyan-400 hover:shadow-cyan-500/30 shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>MỞ CHẾ ĐỘ ĐỌC TRUYỆN</span>
                      </button>
                    </div>
                  )}

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

                  {/* Quick reading stats */}
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                    <span>Thời gian đọc: ~{activeChapter.readingTimeMinutes || 6} phút</span>
                    <span>·</span>
                    <span>Dung lượng: ~{activeChapter.wordCount || 780} từ</span>
                    <span>·</span>
                    <span>3 Phân cảnh minh họa WebP</span>
                  </div>
                </div>
              ) : (
                /* COMING SOON / ĐANG PHÁT TRIỂN STATE */
                <div className="py-10 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#142338] border border-[#26384D] flex items-center justify-center text-[#FBBF24]">
                    <Clock className="w-7 h-7" />
                  </div>
                  <div className="space-y-2 max-w-lg mx-auto">
                    <h5 className="text-base font-bold text-[#F1F5F9]">
                      Chương {activeChapter.chapterNumber}: {activeChapter.title}
                    </h5>
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-950/40 border border-amber-800/60 text-amber-300">
                      Đang phát triển / Coming Soon
                    </div>
                    <p className="text-xs sm:text-sm text-[#A7B6C8] leading-relaxed pt-1">
                      {activeChapter.summary}
                    </p>
                    <p className="text-xs text-slate-500">
                      Hồ sơ biên niên sử không gian của phi công {character.classCharacterName} cho chương này đang được đội ngũ biên tập hoàn thiện và sẽ xuất bản qua các bản cập nhật cốt truyện tiếp theo của Starfront World.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
