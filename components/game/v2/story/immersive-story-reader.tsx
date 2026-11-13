'use client'

import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'

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
  revision?: string
  sourceIntegrity?: string
  sourceNote?: string
  contentType?: 'FULL_PROSE' | 'SUMMARY_ONLY' | 'COMING_SOON' | string
  wordCount?: number
  readingTimeMinutes?: number
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
}

export function ImmersiveStoryReader({
  pilotId,
  pilotName,
  pilotCallsign,
  initialChapterId,
  chapters,
  isOpen,
  onClose,
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
  const [lightboxArt, setLightboxArt] = useState<{
    url: string
    title: string
    caption: string
  } | null>(null)

  useEffect(() => {
    if (initialChapterId) {
      setActiveChapterId(initialChapterId)
    }
  }, [initialChapterId])

  useEffect(() => {
    if (!isOpen || !activeChapterId) return

    let isMounted = true
    const fetchChapter = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/runtime/story/${pilotId}/${activeChapterId}`)
        const data = await res.json()
        if (!isMounted) return

        if (data.success) {
          setChapterContent(data.content || '')
          setChapterBlocks(Array.isArray(data.blocks) ? data.blocks : [])
          setChapterMeta(data.meta || null)
          setReleaseInfo({
            releaseVersion: data.releaseVersion,
            releaseCommitSha: data.releaseCommitSha,
          })
        } else {
          const fallback = chapters.find((c) => c.chapterId === activeChapterId)
          setChapterMeta(fallback || null)
          setChapterContent('')
          setChapterBlocks([])
        }
      } catch {
        if (!isMounted) return
        const fallback = chapters.find((c) => c.chapterId === activeChapterId)
        setChapterMeta(fallback || null)
        setChapterContent('')
        setChapterBlocks([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchChapter()
    return () => {
      isMounted = false
    }
  }, [isOpen, pilotId, activeChapterId, chapters])

  if (!isOpen) return null

  const currentIdx = chapters.findIndex((c) => c.chapterId === activeChapterId)
  const prevChapter = currentIdx > 0 ? chapters[currentIdx - 1] : null
  const nextChapter =
    currentIdx >= 0 && currentIdx < chapters.length - 1 ? chapters[currentIdx + 1] : null

  const rawParagraphs = chapterContent
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith('# '))

  const effectiveEditorial = (
    chapterMeta?.editorialStatus ||
    chapterMeta?.status ||
    'PROVISIONAL'
  ).toUpperCase()
  const isReconstructed = chapterMeta?.sourceIntegrity === 'RECONSTRUCTED_NOT_APPROVED'
  const isReview = effectiveEditorial === 'REVIEW' || isReconstructed

  return (
    <div className="fixed inset-0 z-[9980] flex flex-col bg-[#060911]/98 backdrop-blur-xl text-[#F1F5F9] overflow-hidden animate-in fade-in duration-200">
      {/* Top Reader Navigation Bar */}
      <header className="h-14 shrink-0 border-b border-[#1E2D42] bg-[#090E1A]/95 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
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
              {chapterMeta
                ? `Chương ${String(chapterMeta.chapterNumber).padStart(2, '0')}: ${chapterMeta.title}`
                : 'Đang tải chương...'}
            </h2>
          </div>
        </div>

        {/* Chapter Selector Dropdown & Close */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            aria-label="Chọn chương truyện"
            value={activeChapterId}
            onChange={(e) => setActiveChapterId(e.target.value)}
            className="max-w-[130px] sm:max-w-[260px] truncate px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#0E1626] border border-[#26384D] text-xs font-mono text-white focus:outline-none focus:border-[#00D4FF] min-h-[40px]"
          >
            {chapters.map((c) => {
              const ed = (c.editorialStatus || c.status || '').toUpperCase()
              const tag =
                c.sourceIntegrity === 'RECONSTRUCTED_NOT_APPROVED'
                  ? 'REVIEW/RECONSTRUCTED'
                  : ed === 'APPROVED' || ed === 'PUBLISHED'
                  ? 'APPROVED'
                  : ed
              return (
                <option key={c.chapterId} value={c.chapterId}>
                  CH.{String(c.chapterNumber).padStart(2, '0')} — {c.title} [{tag}]
                </option>
              )
            })}
          </select>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng trình đọc truyện"
            className="h-10 min-w-[40px] px-2.5 rounded-lg bg-rose-950/90 hover:bg-rose-600 border border-rose-500/80 text-white flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0"
            title="Đóng trình đọc truyện (ESC)"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
            <span className="text-xs font-mono font-bold hidden sm:inline">Đóng</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#CBD5E1]">
              <Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" />
              <span className="text-xs font-mono uppercase tracking-widest">
                Đang đồng bộ dữ liệu biên niên sử từ release CDN...
              </span>
            </div>
          ) : (
            <article className="space-y-8">
              {/* Chapter Title Header */}
              <div className="border-b border-[#1E2D42] pb-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded-md bg-[#00D4FF]/15 border border-[#00D4FF]/40 text-[#00D4FF] font-bold">
                    CHƯƠNG {String(chapterMeta?.chapterNumber || 1).padStart(2, '0')}
                  </span>

                  {chapterMeta?.revision && (
                    <span className="px-2.5 py-1 rounded-md bg-[#142338] border border-[#26384D] text-white font-bold">
                      REV {chapterMeta.revision}
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

                  {chapterMeta?.wordCount && chapterMeta.wordCount > 0 && (
                    <span className="flex items-center gap-1 text-[#CBD5E1]">
                      <FileText className="w-3.5 h-3.5 text-[#00D4FF]" />
                      {chapterMeta.wordCount.toLocaleString()} từ
                    </span>
                  )}
                  {chapterMeta?.readingTimeMinutes && chapterMeta.readingTimeMinutes > 0 && (
                    <span className="flex items-center gap-1 text-[#CBD5E1]">
                      <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                      ~{chapterMeta.readingTimeMinutes} phút đọc
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  {chapterMeta?.title}
                </h1>

                {chapterMeta?.summary && (
                  <p className="text-base sm:text-lg text-[#CBD5E1] leading-relaxed border-l-2 border-[#00D4FF] pl-4">
                    {chapterMeta.summary}
                  </p>
                )}

                {/* Cảnh báo trạng thái biên tập REVIEW / RECONSTRUCTION / sourceNote */}
                {(isReview || chapterMeta?.sourceNote) && (
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
                      {chapterMeta?.sourceNote && <p>{chapterMeta.sourceNote}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Render cấu trúc blocks[] từ JSON R4/R5 (cỡ chữ 17-18px dễ đọc) */}
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
                        primaryArt?.filename || primaryArt?.assetId || block.sceneId || 'scene-art'

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
                            {isVerifiedSceneArt ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/40 font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>CDN VERIFIED</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold">
                                <Clock className="w-3 h-3" />
                                <span>CHỜ ĐỒNG BỘ ẢNH CDN ({assetLabel})</span>
                              </span>
                            )}
                          </div>

                          {isVerifiedSceneArt && verifiedImgUrl ? (
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
                                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/80 border border-[#00D4FF]/40 text-xs font-mono text-[#00D4FF] flex items-center gap-1.5 hover:bg-[#00D4FF] hover:text-slate-950 transition-colors"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                                <span>Phóng to</span>
                              </button>
                            </div>
                          ) : (
                            /* Điểm neo phân cảnh chưa có ảnh VERIFIED trên CDN -> hiển thị thẻ thông tin sạch, không tạo HTTP 404 */
                            <div className="p-5 sm:p-6 bg-[#070A12]/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="flex items-start gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-[#142338] border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                                  <FileArchive className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                  <div className="text-sm font-bold text-white">
                                    Điểm Neo Minh Họa: {sceneTitle}
                                  </div>
                                  {sceneCaption && (
                                    <p className="text-xs sm:text-sm text-[#CBD5E1] italic leading-relaxed">
                                      &ldquo;{sceneCaption}&rdquo;
                                    </p>
                                  )}
                                  <div className="text-[11px] font-mono text-[#94A3B8]">
                                    Tệp nguồn: <span className="text-[#00D4FF]">{assetLabel}</span> · Sẽ tự động hiển thị ngay khi binary WebP được xác thực trên kênh CDN.
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {isVerifiedSceneArt && sceneCaption && (
                            <figcaption className="p-4 text-xs sm:text-sm text-[#CBD5E1] italic bg-[#090F1C] border-t border-[#1E2D42]">
                              &ldquo;{sceneCaption}&rdquo;
                            </figcaption>
                          )}
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

              {/* Bottom Chapter Navigation */}
              <div className="pt-8 border-t border-[#1E2D42] flex items-center justify-between gap-4">
                {prevChapter ? (
                  <button
                    type="button"
                    onClick={() => setActiveChapterId(prevChapter.chapterId)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0E1626] border border-[#26384D] hover:border-[#00D4FF] text-xs font-mono text-white transition-all cursor-pointer min-h-[44px]"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#00D4FF]" />
                    <span>
                      Chương {String(prevChapter.chapterNumber).padStart(2, '0')}:{' '}
                      {prevChapter.title}
                    </span>
                  </button>
                ) : (
                  <div />
                )}

                {nextChapter ? (
                  <button
                    type="button"
                    onClick={() => setActiveChapterId(nextChapter.chapterId)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00D4FF]/15 border border-[#00D4FF]/50 hover:bg-[#00D4FF]/25 text-xs font-mono font-bold text-[#00D4FF] transition-all cursor-pointer min-h-[44px]"
                  >
                    <span>
                      Chương {String(nextChapter.chapterNumber).padStart(2, '0')}:{' '}
                      {nextChapter.title}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="text-xs font-mono text-[#94A3B8] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#00D4FF]" />
                    <span>Đã đến chương cuối trong bản phát hành hiện tại</span>
                  </div>
                )}
              </div>
            </article>
          )}
        </div>
      </div>

      {/* Lightbox Modal for Verified Story Artwork */}
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
              className="h-10 min-w-[44px] px-3.5 rounded-full bg-rose-950/95 hover:bg-rose-600 border-2 border-rose-500/90 text-white font-mono text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-xl cursor-pointer shrink-0 active:scale-95"
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
