"use client"

import React, { useState, useEffect, useRef } from "react"
import type { GalleryArtwork } from "@/lib/game/v2/character-profile-data"
import { resolveImageUrl } from "@/lib/game/assets/image-resolver"
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, ChevronLeft, ChevronRight, Download } from "lucide-react"

interface ArtworkLightboxModalProps {
  artwork: GalleryArtwork | null
  artworksList: GalleryArtwork[]
  onClose: () => void
  onSelectArtwork: (artwork: GalleryArtwork) => void
}

export function ArtworkLightboxModal({
  artwork,
  artworksList,
  onClose,
  onSelectArtwork,
}: ArtworkLightboxModalProps) {
  const [scale, setScale] = useState<number>(1)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset vị trí & scale khi đổi artwork
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [artwork])

  // Lắng nghe phím tắt: Esc để đóng, Left/Right để chuyển ảnh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowLeft") {
        navigatePrev()
      } else if (e.key === "ArrowRight") {
        navigateNext()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [artwork, artworksList])

  if (!artwork) return null

  const verifiedArtworks = artworksList.filter((a) => a.isAvailableOnDisk)
  const currentIndex = verifiedArtworks.findIndex((a) => a.id === artwork.id)

  const navigatePrev = () => {
    if (verifiedArtworks.length <= 1) return
    const prevIdx = (currentIndex - 1 + verifiedArtworks.length) % verifiedArtworks.length
    onSelectArtwork(verifiedArtworks[prevIdx])
  }

  const navigateNext = () => {
    if (verifiedArtworks.length <= 1) return
    const nextIdx = (currentIndex + 1) % verifiedArtworks.length
    onSelectArtwork(verifiedArtworks[nextIdx])
  }

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.5, 4))
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.5, 1))
  const handleResetZoom = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  // Xử lý kéo rê chuột khi đang zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => setIsDragging(false)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 backdrop-blur-md text-white select-none animate-in fade-in duration-200"
      onMouseUp={handleMouseUp}
    >
      {/* Top Control Bar */}
      <div className="w-full flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800 z-10">
        <div className="flex items-center gap-2">
          <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-xs font-mono font-bold text-cyan-300 border border-cyan-500/40">
            Art Inspector
          </span>
          <h3 className="text-sm font-bold truncate max-w-xs sm:max-w-md">{artwork.title}</h3>
        </div>

        {/* Nút công cụ zoom & đóng */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center bg-slate-900 rounded border border-slate-800 p-0.5">
            <button
              onClick={handleZoomIn}
              disabled={scale >= 4}
              className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              title="Phóng to (Zoom In)"
            >
              <ZoomIn className="size-4" />
            </button>
            <span className="px-2 text-xs font-mono text-cyan-400">{Math.round(scale * 100)}%</span>
            <button
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              title="Thu nhỏ (Zoom Out)"
            >
              <ZoomOut className="size-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer text-slate-300"
              title="Đặt lại góc nhìn (Reset 1x)"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center size-9 rounded-md bg-slate-800 hover:bg-red-600 transition-colors text-white cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Main Artwork Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        className={`relative flex-1 w-full flex items-center justify-center overflow-hidden p-4 ${
          scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default"
        }`}
      >
        <img
          src={resolveImageUrl(artwork.path)}
          alt={artwork.title}
          draggable={false}
          className="max-h-[85vh] max-w-[90vw] object-contain transition-transform duration-100 ease-out drop-shadow-[0_0_25px_rgba(6,182,212,0.2)]"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          }}
        />

        {/* Previous Button */}
        {verifiedArtworks.length > 1 && (
          <button
            onClick={navigatePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center size-12 rounded-full bg-slate-900/80 hover:bg-cyan-500 hover:text-black border border-slate-700 transition-colors cursor-pointer z-10 shadow-lg"
            title="Ảnh trước (Mũi tên trái)"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}

        {/* Next Button */}
        {verifiedArtworks.length > 1 && (
          <button
            onClick={navigateNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center size-12 rounded-full bg-slate-900/80 hover:bg-cyan-500 hover:text-black border border-slate-700 transition-colors cursor-pointer z-10 shadow-lg"
            title="Ảnh kế tiếp (Mũi tên phải)"
          >
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>

      {/* Bottom Metadata & Instruction Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400 font-mono z-10">
        <div>
          <span>Ảnh {currentIndex + 1} / {verifiedArtworks.length}</span>
          <span className="hidden sm:inline ml-3 text-slate-500">| Kéo chuột để rê ảnh khi zoom • Bấm Esc để thoát</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-semibold">{artwork.category.toUpperCase()}</span>
          <a
            href={artwork.path}
            download
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            title="Tải ảnh gốc WebP"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Tải về</span>
          </a>
        </div>
      </div>
    </div>
  )
}
