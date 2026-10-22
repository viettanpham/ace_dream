'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Info,
  Maximize2,
  FileArchive,
  AlertCircle,
} from 'lucide-react'
import { Button, IconButton } from './button'

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
}

/**
 * STARFRONT WORLD — SHARED ART VIEWER (UI V2)
 * 
 * High-fidelity fullscreen artwork inspector supporting:
 * - Zoom (1x to 3x)
 * - Pan / Drag when zoomed
 * - Escape key to close, Arrow keys for next/prev
 * - Touch-friendly controls with >= 44px hit targets
 * - Fallback container for pending archive artworks (Zero broken images / Zero 404s)
 */
export function ArtViewer({
  isOpen,
  onClose,
  imageSrc,
  imageAlt = 'Starfront Artwork',
  title,
  subtitle,
  category,
  description,
  tags = [],
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  isAvailableOnDisk = true,
}: ArtViewerProps) {
  const [zoom, setZoom] = useState<number>(1)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [showInfo, setShowInfo] = useState<boolean>(true)
  const [imageError, setImageError] = useState<boolean>(false)

  const containerRef = useRef<HTMLDivElement>(null)

  // Reset zoom & pan when image changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setPan({ x: 0, y: 0 })
      setImageError(false)
    }
  }, [isOpen, imageSrc])

  // Keyboard navigation & controls
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === '+' || e.key === '=') {
        setZoom((prev) => Math.min(prev + 0.5, 3))
      } else if (e.key === '-' || e.key === '_') {
        setZoom((prev) => {
          const next = Math.max(prev - 0.5, 1)
          if (next === 1) setPan({ x: 0, y: 0 })
          return next
        })
      } else if (e.key === '0') {
        setZoom(1)
        setPan({ x: 0, y: 0 })
      } else if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
        onPrev()
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        onNext()
      }
    },
    [isOpen, onClose, hasPrev, onPrev, hasNext, onNext]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!isOpen) return null

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.5, 3))
  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.5, 1)
      if (next === 1) setPan({ x: 0, y: 0 })
      return next
    })
  }
  const handleResetZoom = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch pan handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom <= 1 || e.touches.length !== 1) return
    setIsDragging(true)
    const touch = e.touches[0]
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || zoom <= 1 || e.touches.length !== 1) return
    const touch = e.touches[0]
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const isRealImageAvailable = isAvailableOnDisk && !imageError

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Trình xem tranh chi tiết'}
      className="fixed inset-0 z-50 bg-[#070A12]/95 backdrop-blur-xl flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Top Controls Bar */}
      <header className="relative z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-[#0F172A]/80 border-b border-[#26384D] backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-[#142338] border border-[#26384D] text-[#06B6D4] shrink-0">
            <Maximize2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-[#F1F5F9] truncate">
              {title || 'Chi Tiết Tác Phẩm'}
            </h2>
            {subtitle && (
              <p className="text-xs text-[#A7B6C8] truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom controls (only enabled for real images) */}
          {isRealImageAvailable && (
            <div className="hidden sm:flex items-center gap-1 bg-[#142338] border border-[#26384D] p-1 rounded-xl">
              <IconButton
                aria-label="Thu nhỏ"
                variant="ghost"
                size="sm"
                icon={<ZoomOut className="w-4 h-4" />}
                onClick={handleZoomOut}
                disabled={zoom <= 1}
              />
              <span className="text-xs font-mono font-bold text-[#06B6D4] px-2 min-w-[42px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <IconButton
                aria-label="Phóng to"
                variant="ghost"
                size="sm"
                icon={<ZoomIn className="w-4 h-4" />}
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              />
              <IconButton
                aria-label="Đặt lại thu phóng"
                variant="ghost"
                size="sm"
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={handleResetZoom}
                disabled={zoom === 1}
              />
            </div>
          )}

          {/* Toggle info button */}
          <IconButton
            aria-label={showInfo ? 'Ẩn thông tin' : 'Hiện thông tin'}
            variant={showInfo ? 'primary' : 'secondary'}
            icon={<Info className="w-5 h-5" />}
            onClick={() => setShowInfo(!showInfo)}
          />

          {/* Close button with >= 44px touch target */}
          <IconButton
            aria-label="Đóng trình xem tranh"
            variant="outline"
            icon={<X className="w-5 h-5 text-[#F1F5F9]" />}
            onClick={onClose}
          />
        </div>
      </header>

      {/* Main Canvas Viewport */}
      <div
        ref={containerRef}
        className={`relative flex-1 flex items-center justify-center overflow-hidden ${
          zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Previous / Next buttons */}
        {hasPrev && onPrev && (
          <button
            type="button"
            aria-label="Tác phẩm trước"
            onClick={onPrev}
            className="absolute left-3 sm:left-6 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#0F172A]/80 border border-[#26384D] text-[#F1F5F9] flex items-center justify-center hover:bg-[#142338] hover:border-[#06B6D4] transition-all shadow-xl active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {hasNext && onNext && (
          <button
            type="button"
            aria-label="Tác phẩm tiếp theo"
            onClick={onNext}
            className="absolute right-3 sm:right-6 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#0F172A]/80 border border-[#26384D] text-[#F1F5F9] flex items-center justify-center hover:bg-[#142338] hover:border-[#06B6D4] transition-all shadow-xl active:scale-95"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Artwork Image OR Fallback Archive Container */}
        {isRealImageAvailable ? (
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="relative max-w-full max-h-[82vh] flex items-center justify-center p-4 will-change-transform"
          >
            <div className="relative w-auto h-auto max-w-[92vw] max-h-[78vh] rounded-xl overflow-hidden shadow-2xl border border-[#26384D]/60 bg-[#0F172A]">
              <Image
                src={imageSrc}
                alt={imageAlt}
                width={1122}
                height={1402}
                priority
                referrerPolicy="no-referrer"
                className="object-contain max-h-[78vh] w-auto h-auto pointer-events-none select-none"
                onError={() => setImageError(true)}
              />
            </div>
          </div>
        ) : (
          /* Archive Pending Card Fallback (Zero Broken Image) */
          <div className="max-w-md w-full mx-4 p-6 sm:p-8 rounded-2xl bg-[#0F172A] border border-[#26384D] shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#142338] border border-[#26384D] flex items-center justify-center text-[#06B6D4]">
              <FileArchive className="w-8 h-8" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30 mb-2">
                <AlertCircle className="w-3.5 h-3.5" />
                CHỜ ĐỒNG BỘ WEBP
              </span>
              <h3 className="text-xl font-bold text-[#F1F5F9]">
                {title || 'Tác Phẩm Lưu Trữ Danh Mục'}
              </h3>
              {category && (
                <p className="text-xs font-mono text-[#06B6D4] mt-1 uppercase tracking-wider">
                  Phân loại: {category}
                </p>
              )}
            </div>
            <p className="text-sm text-[#A7B6C8] leading-relaxed">
              {description ||
                'Tác phẩm này đã được ghi nhận trong danh mục phê duyệt canonical nhưng tệp WebP vật lý đang chờ đóng gói vào thư mục hình ảnh của ứng dụng.'}
            </p>
            <div className="pt-2 text-xs font-mono text-[#A7B6C8]/70 border-t border-[#26384D]">
              Định danh lưu trữ: <span className="text-[#F1F5F9]">{imageSrc.replace('/images/', '')}</span>
            </div>
          </div>
        )}

        {/* Floating Mobile Zoom Controls (visible only on narrow screens) */}
        {isRealImageAvailable && (
          <div className="sm:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0F172A]/90 border border-[#26384D] backdrop-blur-md shadow-lg">
            <IconButton
              aria-label="Thu nhỏ"
              variant="ghost"
              size="sm"
              icon={<ZoomOut className="w-4 h-4" />}
              onClick={handleZoomOut}
              disabled={zoom <= 1}
            />
            <span className="text-xs font-mono font-bold text-[#06B6D4] px-1">
              {Math.round(zoom * 100)}%
            </span>
            <IconButton
              aria-label="Phóng to"
              variant="ghost"
              size="sm"
              icon={<ZoomIn className="w-4 h-4" />}
              onClick={handleZoomIn}
              disabled={zoom >= 3}
            />
            <IconButton
              aria-label="Đặt lại thu phóng"
              variant="ghost"
              size="sm"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={handleResetZoom}
              disabled={zoom === 1}
            />
          </div>
        )}
      </div>

      {/* Bottom Info Drawer/Banner */}
      {showInfo && (description || tags.length > 0 || category) && (
        <footer className="relative z-30 p-4 sm:p-5 bg-[#0F172A]/90 border-t border-[#26384D] backdrop-blur-md max-h-40 overflow-y-auto">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-[#F1F5F9]">{title}</span>
                {category && (
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#142338] text-[#06B6D4] border border-[#26384D]">
                    {category}
                  </span>
                )}
                {isAvailableOnDisk ? (
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/40">
                    WebP Verified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/40">
                    Archive Metadata
                  </span>
                )}
              </div>
              {description && (
                <p className="text-xs sm:text-sm text-[#A7B6C8] leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 shrink-0">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded text-xs font-mono bg-[#070A12] text-[#A7B6C8] border border-[#26384D]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  )
}
