'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  BookOpen,
  ZoomIn,
  Type,
  List,
  Compass,
  Bookmark,
  Sparkles,
  Shield,
  Layers,
  X,
  ArrowUp,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react';
import {
  CanonicalPilotId,
  StoryChapterMeta,
  StorySceneAnchor,
} from '@/lib/game/v2/character-content-types';

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
  error?: string;
}

export function ImmersiveStoryReader({
  pilotId,
  pilotName,
  chapterId,
  onClose,
  onSelectChapter,
}: ImmersiveStoryReaderProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<StoryChapterMeta | null>(null);
  const [rawContent, setRawContent] = useState<string>('');
  const [activeAnchorId, setActiveAnchorId] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<number>(16); // 14, 16, 18, 20, 22
  const [mobileOutlineOpen, setMobileOutlineOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState<{ url: string; title: string; caption?: string } | null>(null);

  const articleRef = useRef<HTMLDivElement>(null);

  // Fetch chapter data
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/runtime/story/${pilotId}/${chapterId}`)
      .then(async (res) => {
        const data: ChapterDetailResponse = await res.json();
        if (!isCancelled) {
          if (!res.ok || !data.success) {
            setError(data.error || 'Không thể tải chương truyện.');
            setLoading(false);
            return;
          }
          setMeta(data.meta);
          setRawContent(data.content || '');
          if (data.meta.sceneAnchors && data.meta.sceneAnchors.length > 0) {
            setActiveAnchorId(data.meta.sceneAnchors[0].anchorId);
          }
          setLoading(false);
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
  }, [pilotId, chapterId]);

  // Parse markdown content into structured blocks (paragraphs and explicit anchors)
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

      // Check headings
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

      // Check blockquote
      if (trimmed.startsWith('>')) {
        flushParagraph();
        blocks.push({
          type: 'quote',
          text: trimmed.replace(/^>\s*/, ''),
        });
        continue;
      }

      // Empty line signals paragraph boundary
      if (trimmed === '') {
        flushParagraph();
      } else {
        currentParagraph.push(trimmed);
      }
    }
    flushParagraph();

    return blocks;
  }, [rawContent]);

  // Map of anchor ID -> Scene Anchor Meta
  const anchorMap = useMemo(() => {
    const map = new Map<string, StorySceneAnchor>();
    if (meta?.sceneAnchors) {
      for (const a of meta.sceneAnchors) {
        map.set(a.anchorId, a);
      }
    }
    return map;
  }, [meta]);

  // Active Scene Anchor object
  const activeAnchor = useMemo(() => {
    if (!activeAnchorId) {
      return meta?.sceneAnchors?.[0] || null;
    }
    return anchorMap.get(activeAnchorId) || meta?.sceneAnchors?.[0] || null;
  }, [activeAnchorId, anchorMap, meta]);

  // IntersectionObserver to detect which anchor is currently in the reading viewport
  useEffect(() => {
    if (!articleRef.current || contentBlocks.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-anchor-id');
            if (id) {
              setActiveAnchorId(id);
            }
          }
        }
      },
      {
        root: null,
        rootMargin: '-10% 0px -70% 0px', // Trigger when anchor passes upper section of screen
        threshold: 0,
      }
    );

    const anchorElements = articleRef.current.querySelectorAll('[data-anchor-id]');
    anchorElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [contentBlocks]);

  const scrollToAnchor = useCallback((anchorId: string) => {
    setActiveAnchorId(anchorId);
    setMobileOutlineOpen(false);
    const target = document.getElementById(`anchor-${anchorId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const scrollToTop = () => {
    if (articleRef.current) {
      articleRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative flex flex-col w-full h-full bg-[#030712] text-slate-100 overflow-hidden font-sans select-text">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-cyan-950/80 bg-[#060c18]/95 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-slate-700/80 text-xs font-mono uppercase tracking-wider text-cyan-400 hover:text-white hover:border-cyan-500 hover:bg-cyan-950/50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Hồ Sơ Phi Công</span>
            <span className="sm:hidden">Đóng</span>
          </button>

          <div className="h-5 w-px bg-slate-800" />

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-cyan-500 font-semibold tracking-widest">
                IMMERSIVE STORY READER
              </span>
              <span className="text-[10px] font-mono text-slate-500">|</span>
              <span className="text-[11px] font-mono uppercase text-slate-400">
                {pilotName}
              </span>
            </div>
            <h1 className="text-xs sm:text-sm font-semibold text-slate-100 truncate max-w-[280px] sm:max-w-md">
              {meta ? `${meta.chapterNumber}: ${meta.title}` : 'Đang tải...'}
            </h1>
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-2">
          {/* Font Size Stepper */}
          <div className="hidden sm:flex items-center bg-slate-900/90 border border-slate-800 rounded px-1.5 py-0.5">
            <button
              onClick={() => setFontSize((f) => Math.max(14, f - 2))}
              disabled={fontSize <= 14}
              title="Thu nhỏ cỡ chữ"
              className="p-1 text-slate-400 hover:text-cyan-400 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            >
              <span className="text-xs font-mono font-bold">A-</span>
            </button>
            <span className="text-[10px] font-mono text-cyan-400 px-1.5 min-w-[28px] text-center">
              {fontSize}
            </span>
            <button
              onClick={() => setFontSize((f) => Math.min(22, f + 2))}
              disabled={fontSize >= 22}
              title="Phóng to cỡ chữ"
              className="p-1 text-slate-400 hover:text-cyan-400 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            >
              <span className="text-xs font-mono font-bold">A+</span>
            </button>
          </div>

          {/* Mobile Outline Toggle */}
          <button
            onClick={() => setMobileOutlineOpen(!mobileOutlineOpen)}
            className="lg:hidden p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400"
            title="Mục lục cảnh"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main 3-Column Body */}
      <div className="relative flex-1 flex overflow-hidden min-h-0">
        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              Đang tải biên niên sử văn xuôi...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <Shield className="w-12 h-12 text-rose-500/70 mb-3" />
            <h3 className="text-sm font-mono font-bold text-rose-400 uppercase tracking-wider mb-1">
              TRUY XUẤT CHƯƠNG THẤT BẠI
            </h3>
            <p className="text-xs text-slate-400 max-w-md mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-400 hover:bg-cyan-950"
            >
              QUAY VỀ HỒ SƠ PHI CÔNG
            </button>
          </div>
        )}

        {!loading && !error && meta && (
          <>
            {/* COLUMN 1: Chapter Outline & Scene Anchors (Desktop) */}
            <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-slate-900/90 bg-[#040814]/80 p-4 overflow-y-auto">
              <div className="flex items-center gap-2 mb-3 text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                <Compass className="w-3.5 h-3.5" />
                <span>MỤC LỤC BỐI CẢNH</span>
              </div>

              {/* Chapter Metadata Card */}
              <div className="p-3 mb-4 rounded border border-cyan-950/60 bg-slate-950/60 text-xs">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                  <span>CANONICAL CHRONICLE</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> VERIFIED
                  </span>
                </div>
                <div className="font-semibold text-slate-200 text-xs mb-1">
                  {meta.title}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-3 italic mb-2">
                  &ldquo;{meta.summary}&rdquo;
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-900">
                  <span>{meta.readingTimeMinutes || 6} PHÚT ĐỌC</span>
                  <span>{meta.wordCount || 1200} TỪ</span>
                </div>
              </div>

              {/* Anchors Index */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-slate-500 tracking-wider mb-2">
                  CÁC MỐC CẢNH TRUYỆN ({meta.sceneAnchors?.length || 0})
                </div>

                {meta.sceneAnchors?.map((anchor, idx) => {
                  const isActive = activeAnchorId === anchor.anchorId;
                  const hasArt = Boolean(anchor.artworkUrl);

                  return (
                    <button
                      key={anchor.anchorId}
                      onClick={() => scrollToAnchor(anchor.anchorId)}
                      className={`w-full text-left p-2.5 rounded transition-all flex items-start gap-2.5 border ${
                        isActive
                          ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-200 shadow-sm shadow-cyan-950'
                          : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {hasArt ? (
                          <ImageIcon
                            className={`w-3.5 h-3.5 ${
                              isActive ? 'text-cyan-400' : 'text-slate-500'
                            }`}
                          />
                        ) : (
                          <Bookmark
                            className={`w-3.5 h-3.5 ${
                              isActive ? 'text-cyan-400' : 'text-slate-600'
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span
                            className={
                              isActive ? 'text-cyan-400 font-bold' : 'text-slate-500'
                            }
                          >
                            CẢNH {String(idx + 1).padStart(2, '0')}
                          </span>
                          {hasArt && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-900/60 text-cyan-300 font-mono">
                              ART
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-medium truncate mt-0.5">
                          {anchor.title}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Quick Return */}
              <div className="mt-auto pt-4 border-t border-slate-900">
                <button
                  onClick={scrollToTop}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 hover:text-cyan-300 hover:border-cyan-800 transition-colors"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>VỀ ĐẦU TRANG</span>
                </button>
              </div>
            </aside>

            {/* COLUMN 2: Center Prose Reader */}
            <main
              ref={articleRef}
              className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-14 py-8 bg-[#030611] scroll-smooth"
            >
              <div className="max-w-2xl mx-auto pb-24">
                {/* Chapter Title Header */}
                <div className="mb-10 pb-6 border-b border-cyan-950/80 text-center">
                  <div className="inline-block px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-[10px] font-mono uppercase tracking-widest text-cyan-400 mb-3">
                    BIÊN NIÊN SỬ CANONICAL V2 // CHƯƠNG {meta.chapterNumber}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100 tracking-wide mb-3">
                    {meta.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 italic max-w-lg mx-auto">
                    &ldquo;{meta.summary}&rdquo;
                  </p>
                </div>

                {/* Prose Text with Anchors */}
                <article
                  className="prose-container space-y-6 text-slate-200 leading-relaxed font-serif"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {contentBlocks.map((block, idx) => {
                    if (block.type === 'anchor') {
                      const scene = anchorMap.get(block.anchorId || '');
                      const isAnchorActive = activeAnchorId === block.anchorId;

                      return (
                        <div
                          key={`anchor-block-${idx}`}
                          id={`anchor-${block.anchorId}`}
                          data-anchor-id={block.anchorId}
                          className="pt-6 pb-2 my-4 border-t border-cyan-950/40 relative group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full transition-colors ${
                                  isAnchorActive
                                    ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
                                    : 'bg-slate-700'
                                }`}
                              />
                              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                                {scene?.title || `Bối Cảnh [${block.anchorId}]`}
                              </span>
                            </div>

                            {scene?.artworkUrl && (
                              <button
                                onClick={() =>
                                  setViewerImage({
                                    url: scene.artworkUrl!,
                                    title: scene.title,
                                    caption: scene.caption,
                                  })
                                }
                                className="lg:hidden flex items-center gap-1 text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800"
                              >
                                <ImageIcon className="w-3 h-3" />
                                <span>XEM ARTWORK</span>
                              </button>
                            )}
                          </div>

                          {/* Mobile inline artwork if available */}
                          {scene?.artworkUrl && (
                            <div className="lg:hidden mt-3 rounded overflow-hidden border border-slate-800 bg-slate-950">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={scene.artworkUrl}
                                alt={scene.title}
                                className="w-full h-auto object-cover max-h-64 cursor-pointer"
                                onClick={() =>
                                  setViewerImage({
                                    url: scene.artworkUrl!,
                                    title: scene.title,
                                    caption: scene.caption,
                                  })
                                }
                              />
                              {scene.caption && (
                                <div className="p-2 text-[11px] text-slate-400 italic bg-black/60 border-t border-slate-900">
                                  {scene.caption}
                                </div>
                              )}
                            </div>
                          )}
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
                          className="pl-4 border-l-2 border-cyan-500/70 italic text-cyan-100/90 my-4 bg-cyan-950/20 py-2 rounded-r"
                        >
                          {block.text}
                        </blockquote>
                      );
                    }

                    return (
                      <p
                        key={`p-${idx}`}
                        className="text-justify text-slate-200/90 leading-loose"
                      >
                        {block.text}
                      </p>
                    );
                  })}
                </article>

                {/* Chapter End Sign-off */}
                <div className="mt-16 pt-8 border-t border-cyan-950/80 text-center">
                  <div className="w-12 h-0.5 bg-cyan-500/60 mx-auto mb-4" />
                  <p className="text-xs font-mono uppercase tracking-widest text-slate-400">
                    KẾT THÚC CHƯƠNG {meta.chapterNumber}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    STARFRONT CANONICAL DOSSIER ARCHIVE // TỔNG KẾT
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-6 px-5 py-2.5 rounded bg-cyan-950/70 border border-cyan-500/70 text-xs font-mono font-semibold uppercase tracking-wider text-cyan-300 hover:bg-cyan-900 hover:text-white transition-all shadow-lg shadow-cyan-950/50"
                  >
                    HOÀN TẤT & QUAY VỀ HỒ SƠ PHI CÔNG
                  </button>
                </div>
              </div>
            </main>

            {/* COLUMN 3: Right Stage — Active Scene Artwork Display (Desktop) */}
            <aside className="hidden lg:flex flex-col w-84 xl:w-96 shrink-0 border-l border-slate-900/90 bg-[#040814]/90 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-3 text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>MINH HỌA BỐI CẢNH</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  SCENE ARTWORK
                </span>
              </div>

              {activeAnchor?.artworkUrl ? (
                <div className="space-y-3">
                  {/* Artwork Card */}
                  <div className="relative group rounded-lg overflow-hidden border border-cyan-800/60 bg-black/80 shadow-xl shadow-cyan-950/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeAnchor.artworkUrl}
                      alt={activeAnchor.title}
                      className="w-full h-auto max-h-[380px] object-cover object-top transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                      onClick={() =>
                        setViewerImage({
                          url: activeAnchor.artworkUrl!,
                          title: activeAnchor.title,
                          caption: activeAnchor.caption,
                        })
                      }
                    />

                    {/* Zoom Icon Overlay */}
                    <button
                      onClick={() =>
                        setViewerImage({
                          url: activeAnchor.artworkUrl!,
                          title: activeAnchor.title,
                          caption: activeAnchor.caption,
                        })
                      }
                      title="Mở toàn màn hình"
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-cyan-600 transition-colors backdrop-blur-sm border border-white/20"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black via-black/80 to-transparent">
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-900/80 text-cyan-300 font-semibold">
                        {activeAnchor.title}
                      </span>
                    </div>
                  </div>

                  {/* Caption & Context Card */}
                  <div className="p-3 rounded border border-slate-900 bg-slate-950/80 text-xs">
                    <div className="text-[10px] font-mono uppercase text-slate-500 mb-1">
                      CHÚ THÍCH PHÂN CẢNH
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed italic mb-2">
                      &ldquo;{activeAnchor.caption || activeAnchor.description || 'Không có chú thích bổ sung.'}&rdquo;
                    </p>
                    {activeAnchor.description && activeAnchor.caption && (
                      <p className="text-[10px] text-slate-400 border-t border-slate-900 pt-2">
                        {activeAnchor.description}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* No artwork for this scene - Sci-fi minimalist fallback */
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-800/80 rounded-lg bg-slate-950/30">
                  <FileText className="w-10 h-10 text-slate-700 mb-3" />
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">
                    PHÂN ĐOẠN KHÔNG KÈM HÌNH ẢNH
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                    Đoạn văn xuôi này tập trung vào đối thoại và miêu tả tâm lý. Tiếp tục cuộn văn bản để cập nhật cảnh minh họa kế tiếp.
                  </p>
                </div>
              )}
            </aside>
          </>
        )}
      </div>

      {/* Mobile Outline Drawer Modal */}
      {mobileOutlineOpen && meta && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-[#050b18] border-t border-cyan-800 rounded-t-xl p-4 max-h-[75vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-cyan-400 font-bold">
                <List className="w-4 h-4" />
                <span>MỤC LỤC BỐI CẢNH // CHƯƠNG {meta.chapterNumber}</span>
              </div>
              <button
                onClick={() => setMobileOutlineOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1">
              {meta.sceneAnchors?.map((anchor, idx) => (
                <button
                  key={anchor.anchorId}
                  onClick={() => scrollToAnchor(anchor.anchorId)}
                  className={`w-full text-left p-3 rounded border flex items-center justify-between ${
                    activeAnchorId === anchor.anchorId
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-xs font-medium">{anchor.title}</span>
                  </div>
                  {anchor.artworkUrl && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-900 text-cyan-300">
                      ART
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Artwork Modal */}
      {viewerImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setViewerImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 border border-slate-700"
          >
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewerImage.url}
            alt={viewerImage.title}
            className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl"
          />
          <div className="mt-4 text-center">
            <h4 className="text-sm font-mono text-cyan-400 font-bold uppercase">
              {viewerImage.title}
            </h4>
            {viewerImage.caption && (
              <p className="text-xs text-slate-400 italic max-w-lg mt-1">
                {viewerImage.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
