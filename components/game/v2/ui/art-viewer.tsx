'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch'
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Info,
  Loader2,
  AlertTriangle,
  FileArchive,
  Check,
  Sparkles,
} from 'lucide-react'
import { resolveImageUrl } from '@/lib/game/assets/image-resolver'

export interface ArtViewerProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string
  imageAlt?: string
  title?: string
  subtitle?: string
  category?: string
  description?: string
  tags?: string[]
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
  isAvailableOnDisk?: boolean
  currentIndex?: number
  totalCount?: number
}

/**
 * STARFRONT WORLD V2 — IMMERSIVE ARTWORK VIEWER (FND-8 / 8.2.3.E.0)
 * 
 * Powered by react-zoom-pan-pinch engine:
 * - Ultra-clean, dark theater background (no clunky terminal borders).
 * - Full image presentation centered, preserving authentic aspect ratio.
 * - Floating compact pill toolbar: Close, Prev, Next, ZoomIn, ZoomOut, Fit, 100% Actual Size, Reset, Info.
 * - Info panel is HIDDEN by default; toggled smoothly via the [i] button.
 * - Double-click to zoom, mouse wheel zoom, 2-finger pinch on mobile.
 * - Real 100% Actual Size scaling based on naturalWidth/naturalHeight.
 * - Free mouse drag/pan when zoomed > 1x without click conflicts.
 * - Image counter badge (ẢNH 0X / YY) updating dynamically on navigation.
 */
export function ArtViewer({
  isOpen,
  onClose,
  imageSrc,
  imageAlt = 'Starfront Artwork',
  title = 'Artwork Inspector',
  subtitle,
  category,
  description,
  tags = [],
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  isAvailableOnDisk = true,
  currentIndex,
  totalCount,
}: ArtViewerProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<boolean>(false)
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null)
  const [currentScale, setCurrentScale] = useState<number>(1)
  const [showInfoDrawer, setShowInfoDrawer] = useState<boolean>(false)
  
  const transformRef = useRef<ReactZoomPanPinchRef>(null)

  // Reset state whenever image changes or opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      setLoadError(!isAvailableOnDisk)
      setNaturalDimensions(null)
      setCurrentScale(1)
      if (transformRef.current) {
        transformRef.current.resetTransform()
      }
    }
  }, [isOpen, imageSrc, isAvailableOnDisk])

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return
    const origOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = origOverflow
    }
  }, [isOpen])

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
        e.preventDefault()
        onPrev()
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        e.preventDefault()
        onNext()
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        setShowInfoDrawer((prev) => !prev)
      } else if (e.key === '0') {
        e.preventDefault()
        transformRef.current?.resetTransform()
      }
    },
    [isOpen, hasPrev, hasNext, onPrev, onNext, onClose]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!isOpen) return null

  const resolvedUrl = resolveImageUrl(imageSrc)

  // Calculate real 100% scale ratio (actual image pixels vs displayed container size)
  const handleSetActualSize = () => {
    if (!transformRef.current || !naturalDimensions) return
    const container = transformRef.current.instance.wrapperComponent
    if (!container) {
      transformRef.current.setTransform(0, 0, 1)
      return
    }
    // Calculate ratio of natural width to fitted width
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    const scaleX = naturalDimensions.width / Math.min(containerWidth * 0.9, naturalDimensions.width)
    const scaleY = naturalDimensions.height / Math.min(containerHeight * 0.85, naturalDimensions.height)
    const actualScale = Math.max(1, Math.min(4, Math.max(scaleX, scaleY)))
    transformRef.current.setTransform(0, 0, actualScale)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl select-none animate-in fade-in duration-200"
    >
      {/* 1. TOP FLOATING CONTROLS (Tối Giản, Không Thanh Header Đen Dày) */}
      <div className="absolute top-4 inset-x-4 z-40 flex items-center justify-between pointer-events-none">
        {/* Left: Compact artwork title & dimensions badge + Image Counter */}
        <div className="flex items-center gap-2 pointer-events-auto bg-[#090D18]/90 border border-[#1E2D42] backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-mono text-[#F1F5F9] shadow-xl">
          <Sparkles className="w-3.5 h-3.5 text-[#00D4FF]" />
          {currentIndex !== undefined && totalCount !== undefined && totalCount > 0 && (
            <span className="text-[11px] font-mono font-bold text-[#00D4FF] bg-[#00D4FF]/15 px-2 py-0.5 rounded border border-[#00D4FF]/40 tracking-wider">
              ẢNH {String(currentIndex).padStart(2, '0')} / {String(totalCount).padStart(2, '0')}
            </span>
          )}
          <span className="font-bold truncate max-w-[180px] sm:max-w-[320px]">{title}</span>
          {naturalDimensions && (
            <span className="text-[10px] text-[#A7B6C8] bg-[#142338] px-1.5 py-0.5 rounded border border-[#1E2D42] hidden sm:inline">
              {naturalDimensions.width}×{naturalDimensions.height}
            </span>
          )}
        </div>

        {/* Right: Quick Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng viewer (Esc)"
          className="pointer-events-auto w-10 h-10 rounded-full bg-[#090D18]/85 border border-[#1E2D42] hover:border-[#EF4444] text-[#A7B6C8] hover:text-[#EF4444] hover:bg-rose-950/40 flex items-center justify-center transition-all shadow-xl cursor-pointer active:scale-95"
          title="Đóng (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. PREVIOUS / NEXT ARROWS HAI BÊN CẠNH */}
      {hasPrev && onPrev && (
        <button
          type="button"
          onClick={onPrev}
          aria-label="Tác phẩm trước (Arrow Left)"
          className="absolute left-4 z-30 w-11 h-11 rounded-full bg-[#090D18]/80 border border-[#1E2D42] hover:border-[#00D4FF] text-[#CBD5E1] hover:text-[#00D4FF] hover:bg-[#142338] flex items-center justify-center transition-all backdrop-blur-md shadow-2xl active:scale-95 cursor-pointer"
          title="Tác phẩm trước (←)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {hasNext && onNext && (
        <button
          type="button"
          onClick={onNext}
          aria-label="Tác phẩm tiếp theo (Arrow Right)"
          className="absolute right-4 z-30 w-11 h-11 rounded-full bg-[#090D18]/80 border border-[#1E2D42] hover:border-[#00D4FF] text-[#CBD5E1] hover:text-[#00D4FF] hover:bg-[#142338] flex items-center justify-center transition-all backdrop-blur-md shadow-2xl active:scale-95 cursor-pointer"
          title="Tác phẩm tiếp theo (→)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* 3. MAIN INTERACTION CANVAS (react-zoom-pan-pinch) */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {/* Loading Spinner */}
        {isLoading && !loadError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/40">
            <Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" />
            <span className="text-xs font-mono text-[#00D4FF]">Đang tải tác phẩm HD...</span>
          </div>
        )}

        {/* Missing / Archive Fallback Card */}
        {loadError && (
          <div className="z-20 max-w-sm text-center p-6 rounded-2xl bg-[#090D18]/90 border border-[#1E2D42] shadow-2xl space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#142338] border border-[#1E2D42] flex items-center justify-center text-[#F59E0B]">
              <FileArchive className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-white font-mono">{title}</h4>
            {subtitle && <p className="text-xs font-mono text-[#00D4FF]">{subtitle}</p>}
            <p className="text-xs text-[#A7B6C8] leading-relaxed">
              Tác phẩm này đang ở danh mục chờ phát hành WebP trên CDN. Toàn bộ thông số metadata vẫn được bảo toàn.
            </p>
          </div>
        )}

        {/* Transform Wrapper Canvas */}
        {!loadError && (
          <TransformWrapper
            ref={transformRef}
            initialScale={1}
            minScale={0.3}
            maxScale={4.0}
            centerOnInit
            wheel={{ step: 0.15 }}
            doubleClick={{ mode: 'zoomIn', step: 0.8 }}
            panning={{ disabled: false, velocityDisabled: false }}
            {...({
              onTransform: (_: any, state: any) => {
                if (state && typeof state.scale === 'number') {
                  setCurrentScale(state.scale)
                }
              },
            } as any)}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <TransformComponent
                  wrapperClass="!w-full !h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                  contentClass="flex items-center justify-center min-w-full min-h-full"
                >
                  <img
                    src={resolvedUrl}
                    alt={imageAlt}
                    draggable={false}
                    className="max-w-[94vw] max-h-[88vh] object-contain select-none transition-opacity duration-200 drop-shadow-[0_25px_50px_rgba(0,0,0,0.9)]"
                    style={{ opacity: isLoading ? 0 : 1 }}
                    onLoad={(e) => {
                      setIsLoading(false)
                      const target = e.currentTarget
                      setNaturalDimensions({
                        width: target.naturalWidth,
                        height: target.naturalHeight,
                      })
                    }}
                    onError={() => {
                      setIsLoading(false)
                      setLoadError(true)
                    }}
                  />
                </TransformComponent>

                {/* 4. FLOATING COMPACT PILL TOOLBAR (Chuẩn Yêu Cầu Thiết Kế) */}
                <div className="absolute bottom-5 z-40 flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 rounded-full bg-[#090D18]/90 border border-[#1E2D42] backdrop-blur-xl shadow-2xl text-[#CBD5E1]">
                  {/* Zoom Out */}
                  <button
                    type="button"
                    onClick={() => zoomOut(0.3)}
                    title="Thu nhỏ (Zoom Out)"
                    aria-label="Thu nhỏ"
                    className="p-1.5 rounded-full hover:bg-[#142338] hover:text-[#00D4FF] transition-colors cursor-pointer"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  {/* Zoom In */}
                  <button
                    type="button"
                    onClick={() => zoomIn(0.3)}
                    title="Phóng to (Zoom In)"
                    aria-label="Phóng to"
                    className="p-1.5 rounded-full hover:bg-[#142338] hover:text-[#00D4FF] transition-colors cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <div className="h-4 w-px bg-[#1E2D42] mx-0.5" />

                  {/* Fit to screen */}
                  <button
                    type="button"
                    onClick={() => resetTransform()}
                    title="Vừa khung hình (Fit)"
                    aria-label="Vừa khung hình"
                    className="px-2 py-1 text-xs font-mono font-bold rounded-lg hover:bg-[#142338] hover:text-[#00D4FF] transition-colors cursor-pointer"
                  >
                    Fit
                  </button>

                  {/* 100% Actual Size (Kích thước gốc) */}
                  <button
                    type="button"
                    onClick={handleSetActualSize}
                    title="Kích thước thực 100% (Actual Size)"
                    aria-label="Kích thước thực"
                    className="px-2 py-1 text-xs font-mono font-bold rounded-lg hover:bg-[#142338] hover:text-[#00D4FF] transition-colors cursor-pointer"
                  >
                    100%
                  </button>

                  <div className="h-4 w-px bg-[#1E2D42] mx-0.5" />

                  {/* Scale Percentage Indicator */}
                  <span className="text-[11px] font-mono font-bold text-[#00D4FF] px-1.5 min-w-[42px] text-center">
                    {Math.round(currentScale * 100)}%
                  </span>

                  <div className="h-4 w-px bg-[#1E2D42] mx-0.5" />

                  {/* Reset view */}
                  <button
                    type="button"
                    onClick={() => resetTransform()}
                    title="Đặt lại góc nhìn (Reset)"
                    aria-label="Đặt lại góc nhìn"
                    className="p-1.5 rounded-full hover:bg-[#142338] hover:text-[#00D4FF] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  {/* Toggle Info Drawer */}
                  <button
                    type="button"
                    onClick={() => setShowInfoDrawer((prev) => !prev)}
                    title={showInfoDrawer ? 'Ẩn thông tin (i)' : 'Xem thông tin (i)'}
                    aria-label="Bật tắt thông tin"
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                      showInfoDrawer
                        ? 'bg-[#00D4FF] text-[#070A12]'
                        : 'hover:bg-[#142338] hover:text-[#00D4FF]'
                    }`}
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </TransformWrapper>
        )}
      </div>

      {/* 5. SLIDE-OVER INFO DRAWER (ẨN MẶC ĐỊNH, CHỈ HIỆN KHI BẤM NÚT [i]) */}
      {showInfoDrawer && (
        <div className="absolute right-4 top-16 bottom-20 z-40 w-80 max-w-[calc(100vw-32px)] rounded-2xl bg-[#090D18]/95 border border-[#1E2D42] backdrop-blur-2xl shadow-2xl p-4 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <div className="space-y-3 overflow-y-auto pr-1 scrollbar-thin">
            <div className="flex items-center justify-between border-b border-[#1E2D42] pb-2.5">
              <span className="text-xs font-mono font-black text-[#00D4FF] uppercase tracking-wider">
                THÔNG TIN TÁC PHẨM
              </span>
              <button
                type="button"
                onClick={() => setShowInfoDrawer(false)}
                className="text-[#A7B6C8] hover:text-white p-1 rounded-lg hover:bg-[#142338]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-white font-mono">{title}</h3>
              {subtitle && <p className="text-xs text-[#00D4FF] font-medium mt-0.5">{subtitle}</p>}
            </div>

            {category && (
              <div className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#142338] text-[#A7B6C8] border border-[#1E2D42] uppercase">
                Phân Loại: {category}
              </div>
            )}

            {description && (
              <p className="text-xs text-[#CBD5E1] leading-relaxed pt-1">
                {description}
              </p>
            )}

            {/* Technical Metadata */}
            <div className="p-3 rounded-xl bg-[#0B111E] border border-[#1E2D42] space-y-1.5 text-[11px] font-mono">
              <div className="flex justify-between text-[#A7B6C8]">
                <span>Độ phân giải:</span>
                <span className="text-white font-bold">
                  {naturalDimensions ? `${naturalDimensions.width} × ${naturalDimensions.height} px` : 'Đang đọc...'}
                </span>
              </div>
              <div className="flex justify-between text-[#A7B6C8]">
                <span>Trạng thái:</span>
                <span className="text-[#10B981] font-bold">
                  {isAvailableOnDisk ? 'Đã xác thực WebP' : 'Chờ đồng bộ'}
                </span>
              </div>
              <div className="flex justify-between text-[#A7B6C8]">
                <span>Phóng đại:</span>
                <span className="text-[#00D4FF] font-bold">{Math.round(currentScale * 100)}%</span>
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#142338] text-[#A7B6C8] border border-[#1E2D42]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#1E2D42] text-[10px] font-mono text-[#7D90A6] text-center">
            STARFRONT WORLD V2 // IMMERSIVE ART
          </div>
        </div>
      )}
    </div>
  )
}
export default ArtViewer
