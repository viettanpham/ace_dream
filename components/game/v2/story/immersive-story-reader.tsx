'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Lock,
  AlertCircle,
  FileText,
  Link as LinkIcon,
  X,
  Info,
  Compass,
  ArrowLeft,
  Eye,
  EyeOff,
  Layers,
} from 'lucide-react';
import {
  CanonicalPilotId,
  StoryChapterMeta,
  StorySceneAnchor,
} from '@/lib/game/v2/character-content-types';
import { V2_ROSTER_CHARACTERS } from '@/lib/game/v2/character-profile-data';
import { resolveImageUrl } from '@/lib/game/assets/image-resolver';

export interface ImmersiveStoryReaderProps {
  pilotId: CanonicalPilotId;
  pilotName: string;
  chapterId: string;
  onClose: () => void;
  onSelectChapter?: (newChapterId: string) => void;
}

interface ChapterDetailResponse {
  success: boolean;
  meta: StoryChapterMeta;
  content: string;
  isReviewMode?: boolean;
  error?: string;
}

interface ChapterListResponse {
  success: boolean;
  chapters: StoryChapterMeta[];
  isReviewMode?: boolean;
  error?: string;
}

export function ImmersiveStoryReader({
  pilotId,
  pilotName,
  chapterId: initialChapterId,
  onClose,
  onSelectChapter,
}: ImmersiveStoryReaderProps) {
  const [activeChapterId, setActiveChapterId] = useState<string>(initialChapterId);
  const [chapters, setChapters] = useState<StoryChapterMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<StoryChapterMeta | null>(null);
  const [rawContent, setRawContent] = useState<string>('');
  const [isReviewMode, setIsReviewMode] = useState(true);

  // Layout states
  const [isNavigatorCollapsed, setIsNavigatorCollapsed] = useState(false);
  const [isArtworkHidden, setIsArtworkHidden] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Reading settings & progress
  const [fontSize, setFontSize] = useState<number>(16); // 14, 16, 18, 20, 22
  const [readingProgress, setReadingProgress] = useState<number>(0);
  const [activeAnchorId, setActiveAnchorId] = useState<string | null>(null);
  const [currentArtworkIndex, setCurrentArtworkIndex] = useState<number>(0);
  const [artworkFitMode, setArtworkFitMode] = useState<'contain' | 'cover'>('contain');

  // Modals
  const [viewerImage, setViewerImage] = useState<{
    url: string;
    title: string;
    caption?: string;
  } | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const readingColumnRef = useRef<HTMLDivElement>(null);

  // Pilot profile information
  const pilotData = useMemo(() => {
    return V2_ROSTER_CHARACTERS.find((c) => c.id === pilotId);
  }, [pilotId]);

  // Load chapter list for the navigator
  useEffect(() => {
    let isCancelled = false;

    fetch(`/api/runtime/story?pilotId=${pilotId}`)
      .then(async (res) => {
        const data: ChapterListResponse = await res.json();
        if (!isCancelled && data.success && data.chapters) {
          setChapters(data.chapters);
          if (data.isReviewMode !== undefined) {
            setIsReviewMode(data.isReviewMode);
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to load story chapter list:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [pilotId]);

  // Load chapter content
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/runtime/story/${pilotId}/${activeChapterId}`)
      .then(async (res) => {
        const data: ChapterDetailResponse = await res.json();
        if (!isCancelled) {
          if (!res.ok || !data.success) {
            setError(data.error || 'Không thể tải nội dung chương.');
            setLoading(false);
            return;
          }
          setMeta(data.meta);
          setRawContent(data.content || '');
          if (data.isReviewMode !== undefined) {
            setIsReviewMode(data.isReviewMode);
          }

          // Reset anchor & artwork index
          if (data.meta.sceneAnchors && data.meta.sceneAnchors.length > 0) {
            setActiveAnchorId(data.meta.sceneAnchors[0].anchorId);
            setCurrentArtworkIndex(0);
          } else {
            setActiveAnchorId(null);
            setCurrentArtworkIndex(0);
          }

          setLoading(false);
          // Reset scroll
          if (readingColumnRef.current) {
            readingColumnRef.current.scrollTop = 0;
            setReadingProgress(0);
          }
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message || 'Lỗi mạng khi tải chương truyện.');
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [pilotId, activeChapterId]);

  // Change chapter handler
  const handleSelectChapter = useCallback(
    (newChapId: string) => {
      setActiveChapterId(newChapId);
      if (onSelectChapter) {
        onSelectChapter(newChapId);
      }
      setMobileDrawerOpen(false);
      try {
        if (typeof window !== 'undefined' && pilotId) {
          localStorage.setItem(
            `starfront_reading_progress_${pilotId}`,
            JSON.stringify({
              chapterId: newChapId,
              progress: 0,
              updatedAt: Date.now(),
            })
          );
        }
      } catch {
        // Ignore storage errors
      }
    },
    [onSelectChapter, pilotId]
  );

  // Sync scroll reading progress to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && pilotId && activeChapterId && readingProgress > 0) {
      try {
        localStorage.setItem(
          `starfront_reading_progress_${pilotId}`,
          JSON.stringify({
            chapterId: activeChapterId,
            progress: readingProgress,
            updatedAt: Date.now(),
          })
        );
      } catch {
        // Ignore storage errors
      }
    }
  }, [pilotId, activeChapterId, readingProgress]);

  // Parse markdown into blocks
  const contentBlocks = useMemo(() => {
    if (!rawContent) return [];

    const lines = rawContent.split('\n');
    const blocks: Array<{
      type: 'anchor' | 'heading' | 'quote' | 'paragraph';
      anchorId?: string;
      level?: number;
      text: string;
    }> = [];

    let currentParagraph: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(' ').trim();
        if (text) {
          blocks.push({ type: 'paragraph', text });
        }
        currentParagraph = [];
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();

      // Check anchor tag: <!-- story-anchor: anchor_id -->
      const anchorMatch = trimmed.match(/^<!--\s*story-anchor:\s*([a-zA-Z0-9_-]+)\s*-->$/);
      if (anchorMatch) {
        flushParagraph();
        blocks.push({
          type: 'anchor',
          anchorId: anchorMatch[1],
          text: '',
        });
        continue;
      }

      // Headings
      const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
      if (headingMatch) {
        flushParagraph();
        blocks.push({
          type: 'heading',
          level: headingMatch[1].length,
          text: headingMatch[2],
        });
        continue;
      }

      // Blockquotes
      if (trimmed.startsWith('>')) {
        flushParagraph();
        blocks.push({
          type: 'quote',
          text: trimmed.replace(/^>\s*/, ''),
        });
        continue;
      }

      if (trimmed === '') {
        flushParagraph();
      } else {
        currentParagraph.push(trimmed);
      }
    }
    flushParagraph();

    return blocks;
  }, [rawContent]);

  // Scene Anchors and Artwork Gallery for current chapter
  const sceneAnchors = useMemo(() => {
    return meta?.sceneAnchors || [];
  }, [meta]);

  const sceneArtworks = useMemo(() => {
    return sceneAnchors.filter((a) => Boolean(a.artworkUrl));
  }, [sceneAnchors]);

  const activeArtwork = useMemo(() => {
    if (sceneArtworks.length === 0) return null;
    return sceneArtworks[currentArtworkIndex] || sceneArtworks[0];
  }, [sceneArtworks, currentArtworkIndex]);

  // Reading progress tracker via scroll
  const handleScroll = useCallback(() => {
    if (!readingColumnRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = readingColumnRef.current;
    if (scrollHeight <= clientHeight) {
      setReadingProgress(100);
      return;
    }
    const progress = Math.min(
      100,
      Math.max(0, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100))
    );
    setReadingProgress(progress);
  }, []);

  // IntersectionObserver for Scene Anchors
  useEffect(() => {
    if (!readingColumnRef.current || contentBlocks.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const anchorId = entry.target.getAttribute('data-anchor-id');
            if (anchorId) {
              setActiveAnchorId(anchorId);
              const artIdx = sceneArtworks.findIndex((a) => a.anchorId === anchorId);
              if (artIdx >= 0) {
                setCurrentArtworkIndex(artIdx);
              }
            }
          }
        }
      },
      {
        root: readingColumnRef.current,
        rootMargin: '-10% 0px -60% 0px',
        threshold: 0,
      }
    );

    const anchorElements = readingColumnRef.current.querySelectorAll('[data-anchor-id]');
    anchorElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [contentBlocks, sceneArtworks]);

  const hasSceneArtworks = sceneArtworks.length > 0;
  const isArtworkPanelVisible = !isFocusMode && !isArtworkHidden && hasSceneArtworks;
  const isNavigatorVisible = !isFocusMode && !isNavigatorCollapsed;

  // Status badge styling
  const renderStatusBadge = (status: 'APPROVED' | 'PROVISIONAL' | 'HOLD') => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
            APPROVED
          </span>
        );
      case 'PROVISIONAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-amber-950/80 text-amber-400 border border-amber-500/40">
            PROVISIONAL
          </span>
        );
      case 'HOLD':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wider bg-slate-900 text-slate-400 border border-slate-700/60 flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            <span>HOLD</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col w-full h-full bg-[#030712] text-slate-100 overflow-hidden font-sans select-text">
      {/* 1. GLOBAL STARFRONT HEADER (V2 Canonical Concept Bar) */}
      <header className="h-14 border-b border-cyan-950/80 bg-[#050b17]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-40 select-none">
        {/* Left: Brand + Nav */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-mono font-bold tracking-widest border border-cyan-500/40">
              SF
            </span>
            <span className="text-sm font-bold tracking-wider text-slate-100">
              STARFRONT
            </span>
            <span className="text-[10px] font-mono text-cyan-400 px-1 py-0.2 rounded bg-cyan-950 border border-cyan-800">
              V2
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1 text-xs font-mono font-medium tracking-wider text-slate-400">
            <span className="px-2.5 py-1 text-slate-400 hover:text-slate-200">HOME</span>
            <span className="px-2.5 py-1 text-slate-400 hover:text-slate-200">WORLD</span>
            <span className="px-2.5 py-1 text-cyan-300 font-semibold border-b-2 border-cyan-400">
              CHARACTERS
            </span>
            <span className="px-2.5 py-1 text-slate-400 hover:text-slate-200">STORY</span>
            <span className="px-2.5 py-1 text-slate-400 hover:text-slate-200">GALLERY</span>
            <span className="px-2.5 py-1 text-slate-400 hover:text-slate-200">LIBRARY</span>
          </nav>
        </div>

        {/* Right: Game Environment Status */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="hidden lg:flex items-center gap-4 text-slate-400 border-r border-slate-800 pr-4">
            <span className="text-[11px] text-slate-400">SD 2026.10</span>
            <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              45,820
            </span>
            <span className="text-[11px] text-slate-300 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
              ADMINCP
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">ONLINE</span>
          </div>
        </div>
      </header>

      {/* 2. STORY READER CONTROL BAR (Sub-header) */}
      <div className="h-11 border-b border-cyan-950/60 bg-[#060e1d]/90 backdrop-blur-sm px-4 flex items-center justify-between shrink-0 z-30 select-none">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="hover:text-slate-200 cursor-pointer" onClick={onClose}>
            CHARACTERS
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-cyan-400 font-semibold">{pilotName.toUpperCase()}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 font-bold hidden sm:inline">IMMERSIVE STORY READER</span>
          {isReviewMode && (
            <span className="hidden xl:inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-[10px] text-cyan-300 font-mono">
              REVIEW MODE · DEV PREVIEW
            </span>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Font Size Stepper (A- 16 A+) */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded px-1.5 py-0.5">
            <button
              onClick={() => setFontSize((f) => Math.max(14, f - 2))}
              disabled={fontSize <= 14}
              title="Thu nhỏ cỡ chữ"
              className="px-1 text-slate-400 hover:text-cyan-400 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer"
            >
              <span className="text-xs font-mono font-bold">A-</span>
            </button>
            <span className="text-[11px] font-mono text-cyan-400 px-1.5 min-w-[24px] text-center font-bold">
              {fontSize}
            </span>
            <button
              onClick={() => setFontSize((f) => Math.min(22, f + 2))}
              disabled={fontSize >= 22}
              title="Phóng to cỡ chữ"
              className="px-1 text-slate-400 hover:text-cyan-400 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer"
            >
              <span className="text-xs font-mono font-bold">A+</span>
            </button>
          </div>

          {/* Toggle Left Navigator (Desktop) */}
          <button
            onClick={() => setIsNavigatorCollapsed(!isNavigatorCollapsed)}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-400 hover:border-cyan-800 transition-colors cursor-pointer"
            title={isNavigatorCollapsed ? 'Hiện mục lục chương' : 'Ẩn mục lục chương'}
          >
            {isNavigatorCollapsed ? (
              <PanelLeftOpen className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <PanelLeftClose className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>{isNavigatorCollapsed ? 'Hiện mục lục' : 'Ẩn mục lục'}</span>
          </button>

          {/* Toggle Right Artwork Panel (Desktop) */}
          {hasSceneArtworks && (
            <button
              onClick={() => setIsArtworkHidden(!isArtworkHidden)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-400 hover:border-cyan-800 transition-colors cursor-pointer"
              title={isArtworkHidden ? 'Hiện panel minh họa' : 'Ẩn panel minh họa'}
            >
              {isArtworkHidden ? (
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>{isArtworkHidden ? 'Hiện minh họa' : 'Ẩn minh họa'}</span>
            </button>
          )}

          {/* Focus Mode Button */}
          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono transition-colors cursor-pointer ${
              isFocusMode
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-950'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-800'
            }`}
            title="Focus Mode (Chỉ nội dung đọc)"
          >
            {isFocusMode ? (
              <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>Focus</span>
          </button>

          {/* Mobile Drawer Trigger */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 cursor-pointer"
            title="Mục lục 10 chương"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* 3. MAIN 3-COLUMN WORKSPACE */}
      <div className="relative flex-1 flex overflow-hidden min-h-0 bg-[#02050e]">
        {/* =================================================================== */}
        {/* COLUMN 1: LEFT CHAPTER NAVIGATOR                                   */}
        {/* =================================================================== */}
        {isNavigatorVisible ? (
          <aside className="hidden lg:flex flex-col w-80 shrink-0 border-r border-slate-900/90 bg-[#040814]/95 p-4 overflow-y-auto select-none">
            {/* Top Back Button + Collapse Button */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <button
                onClick={onClose}
                className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono font-bold tracking-wider text-slate-300 hover:text-cyan-300 hover:border-cyan-700 hover:bg-cyan-950/30 transition-all cursor-pointer uppercase"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
                <span>QUAY LẠI HỒ SƠ PHI CÔNG</span>
              </button>
              <button
                onClick={() => setIsNavigatorCollapsed(true)}
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-700 transition-colors cursor-pointer"
                title="Thu gọn mục lục sang dạng icon rail"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Pilot Profile Mini-Card */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-cyan-950/80 bg-[#071120] mb-4 shadow-sm">
              <div className="w-11 h-11 rounded-lg overflow-hidden border border-cyan-500/50 bg-black shrink-0 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveImageUrl(pilotData?.portraitAssetPath || `images/pilots/${pilotId}/${pilotId}-portrait.webp`)}
                  alt={pilotName}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-100 tracking-wide truncate">
                  {pilotData?.fullLoreName?.toUpperCase() || pilotName.toUpperCase()}
                </div>
                <div className="text-[10px] font-mono text-cyan-400 font-medium tracking-wider truncate">
                  {pilotData?.callsign?.toUpperCase() || 'MERCY WING'} // {pilotData?.roleCategory?.toUpperCase() || 'SUPPORT'}
                </div>
              </div>
            </div>

            {/* Chapter List Header */}
            <div className="flex items-center justify-between mb-2.5 px-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                DANH SÁCH CHƯƠNG
              </span>
              <span className="text-[10px] font-mono text-cyan-500 font-semibold">
                {chapters.length || 10} chương
              </span>
            </div>

            {/* Chapters Vertical List */}
            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
              {chapters.map((chap) => {
                const isActive = chap.chapterId === activeChapterId;
                const isHold = chap.editorialStatus === 'HOLD';
                const isProvisional = chap.editorialStatus === 'PROVISIONAL';

                return (
                  <button
                    key={chap.chapterId}
                    onClick={() => handleSelectChapter(chap.chapterId)}
                    className={`w-full text-left p-2.5 rounded-lg transition-all flex items-center gap-2.5 border cursor-pointer select-none ${
                      isActive
                        ? 'bg-[#0a1e36] border-cyan-400/90 text-white shadow-md shadow-cyan-950/50'
                        : isHold
                        ? 'bg-slate-950/30 border-slate-900/60 text-slate-500 hover:text-slate-400 hover:border-slate-800'
                        : 'bg-slate-950/60 border-slate-900 text-slate-300 hover:text-white hover:border-slate-800 hover:bg-[#081224]'
                    }`}
                  >
                    {/* Chapter Number / Lock / Thumbnail */}
                    <div className="w-7 h-7 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-center shrink-0">
                      {isHold ? (
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <span
                          className={`text-xs font-mono font-bold ${
                            isActive ? 'text-cyan-400' : 'text-slate-400'
                          }`}
                        >
                          {String(chap.chapterNumber).padStart(2, '0')}
                        </span>
                      )}
                    </div>

                    {/* Chapter Title (Wraps up to 2 lines cleanly) */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium line-clamp-2 break-words leading-snug">
                        {chap.title}
                      </div>
                    </div>

                    {/* Editorial Badge */}
                    <div className="shrink-0">
                      {renderStatusBadge(chap.editorialStatus)}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Reading Progress Box (As shown in Concept) */}
            <div className="mt-4 pt-3 border-t border-slate-900/90 text-xs">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                <span className="font-semibold text-slate-300 uppercase">
                  TIẾN ĐỘ ĐỌC CHƯƠNG {meta ? String(meta.chapterNumber).padStart(2, '0') : '01'}
                </span>
                <span className="font-bold text-cyan-400">{readingProgress}%</span>
              </div>
              {/* Cyan Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden mb-3 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full transition-all duration-200"
                  style={{ width: `${readingProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" /> ~{meta?.readingTimeMinutes || 6} phút đọc
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-500" /> {meta?.wordCount || 1200} từ
                </span>
              </div>
            </div>
          </aside>
        ) : !isFocusMode ? (
          /* COLLAPSED NAVIGATOR RAIL (State 1 in Concept) */
          <aside className="hidden lg:flex flex-col w-16 shrink-0 border-r border-slate-900/90 bg-[#040814]/95 items-center py-4 select-none">
            <button
              onClick={() => setIsNavigatorCollapsed(false)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 hover:bg-cyan-950 transition-colors mb-4 cursor-pointer"
              title="Mở rộng mục lục chương"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="w-9 h-9 rounded-lg overflow-hidden border border-cyan-500/50 bg-black mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImageUrl(pilotData?.portraitAssetPath || `images/pilots/${pilotId}/${pilotId}-portrait.webp`)}
                alt={pilotName}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="h-px w-8 bg-slate-900 my-2" />

            <div className="text-[10px] font-mono text-cyan-400 font-bold rotate-90 my-6 tracking-widest uppercase">
              {meta ? String(meta.chapterNumber).padStart(2, '0') : '01'} / {chapters.length || 10}
            </div>

            <div className="mt-auto flex flex-col items-center gap-2 text-slate-500">
              <span className="text-[9px] font-mono text-cyan-400 font-bold">
                {readingProgress}%
              </span>
              <div className="w-1.5 h-16 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="w-full bg-cyan-400 transition-all"
                  style={{ height: `${readingProgress}%` }}
                />
              </div>
            </div>
          </aside>
        ) : null}

        {/* =================================================================== */}
        {/* COLUMN 2: MIDDLE READING COLUMN                                     */}
        {/* =================================================================== */}
        <main
          ref={readingColumnRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-12 lg:px-16 py-8 bg-[#02050f] scroll-smooth min-w-0"
        >
          {/* Loading Indicator */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono uppercase tracking-widest text-cyan-400">
                Đang truy xuất biên niên sử...
              </p>
            </div>
          )}

          {/* Error Message */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
              <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
              <h3 className="text-sm font-mono font-bold text-rose-400 uppercase tracking-wider mb-2">
                TRUY XUẤT CHƯƠNG THẤT BẠI
              </h3>
              <p className="text-xs text-slate-400 mb-4">{error}</p>
              <button
                onClick={() => handleSelectChapter('chap-01')}
                className="px-4 py-2 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-400 hover:bg-cyan-950 cursor-pointer"
              >
                QUAY VỀ CHƯƠNG 01
              </button>
            </div>
          )}

          {/* Prose Body */}
          {!loading && !error && meta && (
            <div
              className={`mx-auto pb-24 transition-all duration-300 ${
                isFocusMode ? 'max-w-3xl' : 'max-w-2xl'
              }`}
            >
              {/* Focus Mode Floating Top Indicator */}
              {isFocusMode && (
                <div className="sticky top-0 z-20 mb-6 py-2 px-4 rounded-full bg-slate-950/90 border border-cyan-900/60 backdrop-blur flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-400 font-semibold tracking-wider">
                    FOCUS MODE (CHỈ NỘI DUNG ĐỌC)
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setFontSize((f) => Math.max(14, f - 2))}
                        className="px-1 text-slate-400 hover:text-cyan-400 cursor-pointer"
                      >
                        A-
                      </button>
                      <span className="text-cyan-400 font-bold">{fontSize}</span>
                      <button
                        onClick={() => setFontSize((f) => Math.min(22, f + 2))}
                        className="px-1 text-slate-400 hover:text-cyan-400 cursor-pointer"
                      >
                        A+
                      </button>
                    </div>
                    <button
                      onClick={() => setIsFocusMode(false)}
                      className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                      title="Thoát Focus Mode"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Chapter Header */}
              <div className="mb-8 pb-6 border-b border-cyan-950/70 text-center">
                <div className="inline-block px-3 py-1 rounded bg-cyan-950/60 border border-cyan-800/60 text-[10px] font-mono uppercase tracking-widest text-cyan-400 mb-4 font-semibold">
                  BIÊN NIÊN SỬ CANONICAL V2 // CHƯƠNG {String(meta.chapterNumber).padStart(2, '0')}
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-white tracking-wide mb-4 leading-tight">
                  {meta.title}
                </h1>

                {meta.quote && (
                  <p className="text-sm sm:text-base font-serif italic text-slate-300/90 max-w-xl mx-auto leading-relaxed mb-2">
                    &ldquo;{meta.quote}&rdquo;
                  </p>
                )}

                {meta.summary && !meta.quote && (
                  <p className="text-xs sm:text-sm font-serif italic text-slate-400 max-w-lg mx-auto">
                    &ldquo;{meta.summary}&rdquo;
                  </p>
                )}
              </div>

              {/* Prose Article (When full text is available, e.g. Chapter 01) */}
              {rawContent ? (
                <article
                  className="prose-content space-y-6 text-slate-200 font-serif leading-loose text-justify"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {contentBlocks.map((block, idx) => {
                    if (block.type === 'anchor') {
                      const scene = sceneAnchors.find((a) => a.anchorId === block.anchorId);
                      const isAnchorActive = activeAnchorId === block.anchorId;

                      return (
                        <div
                          key={`anchor-block-${idx}`}
                          id={`anchor-${block.anchorId}`}
                          data-anchor-id={block.anchorId}
                          className="pt-4 pb-2 my-6 border-t border-cyan-950/40 relative font-sans"
                        >
                          {/* Anchor Card Block Matching Concept Visual (Subdued and softened) */}
                          <div
                            className={`p-3 rounded-lg border transition-all ${
                              isAnchorActive
                                ? 'bg-cyan-950/20 border-cyan-500/40 shadow-xs'
                                : 'bg-[#040c1a]/50 border-slate-900/60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-3.5 bg-cyan-400/80 rounded-full inline-block" />
                                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                                  PHÂN CẢNH {String(idx + 1).padStart(2, '0')}
                                </span>
                                <LinkIcon className="w-3 h-3 text-cyan-500/60" />
                              </div>
                              {scene?.artworkUrl && (
                                <button
                                  onClick={() => {
                                    setViewerImage({
                                      url: resolveImageUrl(scene.artworkUrl)!,
                                      title: scene.title || 'Minh họa phân cảnh',
                                      caption: scene.caption,
                                    });
                                  }}
                                  className="lg:hidden flex items-center gap-1 text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80 cursor-pointer"
                                >
                                  <ImageIcon className="w-3 h-3" />
                                  <span>XEM ẢNH</span>
                                </button>
                              )}
                            </div>

                            <h3 className="text-xs sm:text-sm font-bold text-white mb-0.5 font-sans">
                              {scene?.title || `Bối Cảnh [${block.anchorId}]`}
                            </h3>

                            <p className="text-xs text-slate-400 font-sans leading-relaxed">
                              {scene?.description || scene?.caption || 'Một phân cảnh quan trọng trong hành trình của phi công.'}
                            </p>

                            {/* Mobile inline artwork (State 4) */}
                            {scene?.artworkUrl && (
                              <div className="lg:hidden mt-3 rounded-lg overflow-hidden border border-slate-800/80 bg-black">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={resolveImageUrl(scene.artworkUrl)}
                                  alt={scene.title}
                                  className="w-full h-auto object-cover max-h-72 cursor-pointer"
                                  onClick={() =>
                                    setViewerImage({
                                      url: resolveImageUrl(scene.artworkUrl)!,
                                      title: scene.title || 'Minh họa phân cảnh',
                                      caption: scene.caption,
                                    })
                                  }
                                />
                                {scene.caption && (
                                  <div className="p-2 text-[11px] text-slate-300 italic bg-black/80 border-t border-slate-900">
                                    {scene.caption}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    if (block.type === 'heading') {
                      return (
                        <h2
                          key={`heading-${idx}`}
                          className="text-lg font-mono font-bold uppercase tracking-wider text-cyan-300 pt-4"
                        >
                          {block.text}
                        </h2>
                      );
                    }

                    if (block.type === 'quote') {
                      return (
                        <blockquote
                          key={`quote-${idx}`}
                          className="pl-4 border-l-2 border-cyan-400 italic text-cyan-100 my-4 bg-cyan-950/20 py-2 rounded-r"
                        >
                          &ldquo;{block.text}&rdquo;
                        </blockquote>
                      );
                    }

                    return (
                      <p key={`p-${idx}`} className="text-slate-200">
                        {block.text}
                      </p>
                    );
                  })}
                </article>
              ) : (
                /* CHAPTER OUTLINE / DRAFT REVIEW VIEW (For Chapters 02–10) */
                <div className="space-y-6 py-6 font-sans">
                  {/* Review Mode Banner */}
                  <div className="p-4 rounded-xl border border-cyan-800/60 bg-gradient-to-r from-cyan-950/50 to-slate-950/80 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase">
                      <Clock className="w-4 h-4" />
                      <span>HỒ SƠ XEM TRƯỚC BIÊN TẬP // STORY REVIEW MODE</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Chương này đã có cốt truyện tổng thể được phê duyệt trong lộ trình 10 chương chính thức. Văn bản văn xuôi chi tiết đang trong giai đoạn hoàn thiện.
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="p-5 rounded-xl border border-slate-800 bg-[#060e1d]/90 space-y-3">
                    <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                      TÓM TẮT CỐT TRUYỆN ĐÃ PHÊ DUYỆT
                    </div>
                    <p className="text-sm font-serif italic text-slate-200 leading-relaxed">
                      &ldquo;{meta.summary}&rdquo;
                    </p>
                  </div>

                  {/* Status Indicator */}
                  <div className="p-5 rounded-xl border border-slate-900 bg-slate-950/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        Trạng Thái Biên Tập: {meta.editorialStatus}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {meta.editorialStatus === 'APPROVED'
                          ? 'Cốt truyện đã phê duyệt · Đang chờ xuất bản văn xuôi'
                          : meta.editorialStatus === 'PROVISIONAL'
                          ? 'Bản thảo sơ bộ · Cần rà soát bối cảnh thế giới'
                          : 'Hồ sơ niêm phong tối mật · Cần mở khóa theo tiến trình'}
                      </div>
                    </div>
                    {renderStatusBadge(meta.editorialStatus)}
                  </div>
                </div>
              )}

              {/* End of Chapter Section */}
              <div className="mt-16 pt-8 border-t border-cyan-950/80 text-center font-sans">
                <div className="w-10 h-0.5 bg-cyan-400/80 mx-auto mb-3" />
                <p className="text-xs font-mono uppercase tracking-widest text-slate-400">
                  KẾT THÚC CHƯƠNG {String(meta.chapterNumber).padStart(2, '0')}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  STARFRONT CANONICAL DOSSIER ARCHIVE // V2.0
                </p>
              </div>
            </div>
          )}
        </main>

        {/* =================================================================== */}
        {/* COLUMN 3: RIGHT SCENE ARTWORK PANEL                                */}
        {/* =================================================================== */}
        {isArtworkPanelVisible && activeArtwork ? (
          <aside className="hidden lg:flex flex-col w-84 xl:w-96 shrink-0 border-l border-slate-900/90 bg-[#040814]/95 p-4 overflow-y-auto select-none">
            {/* Header with Navigation Controls */}
            <div className="flex items-center justify-between mb-3 text-xs font-mono">
              <span className="font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>MINH HỌA PHÂN CẢNH</span>
              </span>

              {/* Artwork Prev / Next Stepper & Fit Mode */}
              <div className="flex items-center gap-1.5 text-slate-400">
                <button
                  onClick={() =>
                    setCurrentArtworkIndex((prev) =>
                      prev > 0 ? prev - 1 : sceneArtworks.length - 1
                    )
                  }
                  disabled={sceneArtworks.length <= 1}
                  className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 disabled:opacity-30 cursor-pointer"
                  title="Ảnh trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-cyan-400 font-bold px-1">
                  {String(currentArtworkIndex + 1).padStart(2, '0')} / {String(sceneArtworks.length).padStart(2, '0')}
                </span>
                <button
                  onClick={() =>
                    setCurrentArtworkIndex((prev) =>
                      prev < sceneArtworks.length - 1 ? prev + 1 : 0
                    )
                  }
                  disabled={sceneArtworks.length <= 1}
                  className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 disabled:opacity-30 cursor-pointer"
                  title="Ảnh tiếp"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setArtworkFitMode((m) => (m === 'contain' ? 'cover' : 'contain'))}
                  className="ml-1 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-300 hover:border-cyan-700 cursor-pointer"
                  title={artworkFitMode === 'contain' ? 'Chế độ hiện tại: Vừa khung (FIT). Bấm để chuyển sang Phủ khung (FILL).' : 'Chế độ hiện tại: Phủ khung (FILL). Bấm để chuyển sang Vừa khung (FIT).'}
                >
                  {artworkFitMode === 'contain' ? 'FIT' : 'FILL'}
                </button>
              </div>
            </div>

            {/* Large High-Fidelity Artwork Card */}
            <div className="relative rounded-xl overflow-hidden border border-cyan-800/60 bg-black shadow-xl shadow-cyan-950/40 mb-3 group flex items-center justify-center min-h-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImageUrl(activeArtwork.artworkUrl)}
                alt={activeArtwork.title || 'Scene Artwork'}
                className={`w-full transition-transform duration-500 group-hover:scale-102 cursor-pointer ${
                  artworkFitMode === 'contain'
                    ? 'h-auto max-h-[460px] object-contain bg-black'
                    : 'h-[420px] object-cover object-top'
                }`}
                onClick={() =>
                  setViewerImage({
                    url: resolveImageUrl(activeArtwork.artworkUrl)!,
                    title: activeArtwork.title || 'Ký ức tại Elysia',
                    caption: activeArtwork.caption,
                  })
                }
              />

              {/* Action Buttons Overlay (Fullscreen & Info) */}
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <button
                  onClick={() =>
                    setViewerImage({
                      url: resolveImageUrl(activeArtwork.artworkUrl)!,
                      title: activeArtwork.title || 'Ký ức tại Elysia',
                      caption: activeArtwork.caption,
                    })
                  }
                  className="p-1.5 rounded-lg bg-black/70 border border-white/20 text-white hover:bg-cyan-600 transition-colors backdrop-blur-sm cursor-pointer"
                  title="Mở toàn màn hình"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="p-1.5 rounded-lg bg-black/70 border border-white/20 text-white hover:bg-cyan-600 transition-colors backdrop-blur-sm cursor-pointer"
                  title="Thông tin chi tiết artwork"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Artwork Context & Caption Card */}
            <div className="p-3.5 rounded-xl border border-slate-900 bg-[#060d1b] text-xs">
              <h4 className="text-sm font-bold text-white mb-1">
                {activeArtwork.title || 'Ký ức tại Elysia'}
              </h4>
              <p className="text-[11px] text-slate-300 italic mb-3 leading-relaxed">
                {activeArtwork.caption || 'Minh họa gắn với phân cảnh hiện tại.'}
              </p>

              {/* Badges */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-800/60">
                  STORY
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                  WebP HD
                </span>
              </div>
            </div>
          </aside>
        ) : null}
      </div>

      {/* =================================================================== */}
      {/* 4. MOBILE DRAWER MODAL (State 4 in Concept)                        */}
      {/* =================================================================== */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-[#050b18] border-t border-cyan-700/80 rounded-t-2xl p-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-cyan-400 font-bold">
                <Layers className="w-4 h-4" />
                <span>DANH SÁCH CHƯƠNG ({chapters.length || 10})</span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1">
              {chapters.map((chap) => {
                const isActive = chap.chapterId === activeChapterId;
                return (
                  <button
                    key={chap.chapterId}
                    onClick={() => handleSelectChapter(chap.chapterId)}
                    className={`w-full text-left p-3 rounded-lg border flex items-center justify-between ${
                      isActive
                        ? 'bg-[#0a1e36] border-cyan-400 text-white'
                        : 'bg-slate-950 border-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        {String(chap.chapterNumber).padStart(2, '0')}
                      </span>
                      <span className="text-xs font-medium truncate">{chap.title}</span>
                    </div>
                    {renderStatusBadge(chap.editorialStatus)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. FULLSCREEN IMAGE MODAL                                          */}
      {/* =================================================================== */}
      {viewerImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setViewerImage(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 border border-slate-700 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveImageUrl(viewerImage.url)}
            alt={viewerImage.title}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
          <div className="mt-4 text-center max-w-lg">
            <h4 className="text-sm font-mono text-cyan-400 font-bold uppercase tracking-wider">
              {viewerImage.title}
            </h4>
            {viewerImage.caption && (
              <p className="text-xs text-slate-300 italic mt-1 leading-relaxed">
                {viewerImage.caption}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 6. ARTWORK INFO MODAL */}
      {showInfoModal && activeArtwork && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#071120] border border-cyan-800/80 rounded-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs font-mono font-bold uppercase text-cyan-400">
                THÔNG TIN CHI TIẾT ARTWORK
              </span>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div>
                <span className="font-mono text-slate-500">Asset ID:</span>{' '}
                <span className="font-mono text-cyan-300">{activeArtwork.assetId || 'valentine-story-01'}</span>
              </div>
              <div>
                <span className="font-mono text-slate-500">Tiêu đề:</span>{' '}
                <span className="font-bold">{activeArtwork.title}</span>
              </div>
              <div>
                <span className="font-mono text-slate-500">Định dạng:</span>{' '}
                <span className="font-mono">WebP HD (Portrait Ratio)</span>
              </div>
              <div>
                <span className="font-mono text-slate-500">Phân loại:</span>{' '}
                <span className="font-mono text-purple-300">STORY_SCENE_ANCHOR</span>
              </div>
              <div>
                <span className="font-mono text-slate-500">Chú thích:</span>{' '}
                <p className="italic text-slate-400 mt-1">{activeArtwork.caption}</p>
              </div>
            </div>
            <button
              onClick={() => setShowInfoModal(false)}
              className="mt-5 w-full py-2 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 hover:bg-cyan-950"
            >
              ĐÓNG
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
