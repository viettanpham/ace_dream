'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CharacterProfileV2, GalleryArtwork } from '@/lib/game/v2/character-profile-data'
import { resolveImageUrl } from '@/lib/game/assets/image-resolver'
import { PilotAvatar } from './pilot-avatar'
import {
  Maximize2,
  Radar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Shield,
  Heart,
  FileText,
  Image as ImageIcon,
  ZoomIn,
  Grid,
} from 'lucide-react'

interface MobileArtViewProps {
  roster: CharacterProfileV2[]
  character: CharacterProfileV2
  onSelectCharacter: (char: CharacterProfileV2) => void
  backgroundMode: 'standard' | 'tactical'
  onToggleBackgroundMode: (mode: 'standard' | 'tactical') => void
  onSwitchToInfoView: () => void
  onOpenArtViewer: (art?: GalleryArtwork, contextList?: GalleryArtwork[]) => void
  onNavigateToGallery?: () => void
}

/**
 * STARFRONT WORLD V2 — MOBILE ART VIEW (FND-8.2.3.E.0 HOTFIX)
 * 
 * Khắc phục hoàn toàn lỗi Carousel không đồng bộ:
 * - Single Source of Truth: `selectedArtworkIndex` điều khiển đồng bộ Hero Image, Active Thumbnail, Thumbnail Scroll, Title, Category, Description và Viewer Index.
 * - Nút Prev/Next trực tiếp trên tranh chuyển đổi mượt mà giữa các tác phẩm của phi công.
 * - Thumbnail carousel hỗ trợ hiển thị toàn bộ tác phẩm khả dụng, tự động cuộn vào vùng nhìn thấy.
 * - Bổ sung nút bấm [XEM GALLERY — N ẢNH] rõ ràng và đẹp mắt.
 * - Mở Fullscreen Viewer chính xác ngay tác phẩm đang chọn.
 */
export function MobileArtView({
  roster,
  character,
  onSelectCharacter,
  backgroundMode,
  onToggleBackgroundMode,
  onSwitchToInfoView,
  onOpenArtViewer,
  onNavigateToGallery,
}: MobileArtViewProps) {
  const [imageError, setImageError] = useState<boolean>(false)
  const [selectedArtworkIndex, setSelectedArtworkIndex] = useState<number>(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchEndX, setTouchEndX] = useState<number | null>(null)
  const thumbnailRowRef = useRef<HTMLDivElement>(null)

  // Lọc danh sách tác phẩm hợp lệ
  const verifiedArtworks: GalleryArtwork[] = character.artworks && character.artworks.length > 0
    ? character.artworks.filter((a) => a.isAvailableOnDisk)
    : [
        {
          id: `${character.id}-fullbody`,
          title: `${character.classCharacterName} — Tranh Toàn Thân`,
          category: 'base',
          path: character.fullbodyAssetPath,
          isAvailableOnDisk: true,
          status: 'verified_webp',
          description: character.shortDescription,
        },
      ]

  // Fallback nếu không có ảnh verified
  const displayArtworks = verifiedArtworks.length > 0
    ? verifiedArtworks
    : [
        {
          id: `${character.id}-fullbody`,
          title: `${character.classCharacterName} — Tranh Toàn Thân`,
          category: 'base' as const,
          path: character.fullbodyAssetPath,
          isAvailableOnDisk: false,
          status: 'archive_pending' as const,
          description: character.shortDescription,
        },
      ]

  // Reset index khi đổi phi công
  useEffect(() => {
    setImageError(false)
    setSelectedArtworkIndex(0)
  }, [character.id])

  // Lấy tác phẩm hiện tại
  const currentArtwork: GalleryArtwork = displayArtworks[selectedArtworkIndex] || displayArtworks[0]

  // Tự động cuộn thumbnail đang chọn vào màn hình
  useEffect(() => {
    if (thumbnailRowRef.current) {
      const activeEl = thumbnailRowRef.current.children[selectedArtworkIndex] as HTMLElement
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [selectedArtworkIndex])

  // Chuyển tranh tiếp theo / trước đó
  const handlePrevArtwork = () => {
    setSelectedArtworkIndex((prev) => (prev > 0 ? prev - 1 : displayArtworks.length - 1))
  }

  const handleNextArtwork = () => {
    setSelectedArtworkIndex((prev) => (prev < displayArtworks.length - 1 ? prev + 1 : 0))
  }

  // Mở viewer với đúng tranh đang chọn
  const handleOpenCurrentInViewer = () => {
    onOpenArtViewer(currentArtwork, displayArtworks)
  }

  return (
    <div className="relative w-full min-h-[100dvh] bg-[#070A12] text-[#F1F5F9] flex flex-col justify-between overflow-x-hidden select-none pb-24">
      {/* Ambient Blurred Pilot Background Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <Image
          src={resolveImageUrl(currentArtwork.path || character.fullbodyAssetPath)}
          alt={character.classCharacterName}
          fill
          priority
          referrerPolicy="no-referrer"
          className="object-cover object-top opacity-20 filter blur-3xl scale-125 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-[#070A12]/80" />
      </div>

      {/* Background Graphic Grid */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 pointer-events-none z-0 ${
          backgroundMode === 'tactical'
            ? 'opacity-100 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-cyan-950/60 via-[#070A12]/70 to-[#070A12]'
            : 'opacity-100 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-950/50 via-[#070A12]/70 to-[#070A12]'
        }`}
      />

      {/* 1. DẢI AVATAR ROSTER NGANG PHÍA TRÊN (Đổi Phi Công) */}
      <div className="relative z-20 px-3 py-2 bg-[#090D18]/90 border-b border-[#1E2D42] overflow-x-auto scrollbar-none shadow-md">
        <div className="flex gap-2 min-w-max">
          {roster.map((char) => {
            const isSelected = char.id === character.id

            return (
              <button
                key={char.id}
                type="button"
                onClick={() => onSelectCharacter(char)}
                className={`min-w-[64px] p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#142338] border-[#00D4FF] shadow-[0_0_10px_rgba(0,212,255,0.4)] ring-1 ring-[#00D4FF]'
                    : 'bg-[#0B111E]/80 border-[#1E2D42] hover:border-[#2C415E]'
                }`}
              >
                <PilotAvatar
                  character={char}
                  isSelected={isSelected}
                  className="w-10 h-10"
                />
                <span
                  className={`text-[10px] font-bold font-mono truncate max-w-[60px] ${
                    isSelected ? 'text-[#00D4FF]' : 'text-[#A7B6C8]'
                  }`}
                >
                  {char.classCharacterName}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. THANH ĐIỀU HƯỚNG NHỎ: [Xem Thông Tin] | [Xem Tranh Nhân Vật (Active)] + Nút Gallery */}
      <div className="relative z-20 px-3.5 pt-2 flex items-center justify-between gap-2">
        <div className="inline-flex rounded-xl bg-[#090D18] border border-[#1E2D42] p-1 shadow-lg">
          <button
            type="button"
            onClick={onSwitchToInfoView}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-[#A7B6C8] hover:text-white transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Thông Tin</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#00D4FF] text-[#070A12] shadow-sm shadow-cyan-500/30 cursor-default"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Tranh HD</span>
          </button>
        </div>

        {/* Nút Nhảy Trực Tiếp Vào Gallery */}
        <button
          type="button"
          onClick={() => {
            if (onNavigateToGallery) {
              onNavigateToGallery()
            } else {
              onSwitchToInfoView()
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E1B2E] border border-[#00D4FF]/40 text-[#00D4FF] text-xs font-mono font-bold shadow-sm hover:bg-[#142640] transition-all cursor-pointer active:scale-95"
          title="Xem toàn bộ bộ sưu tập"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>GALLERY ({displayArtworks.length})</span>
        </button>
      </div>

      {/* 3. KHU VỰC SÂN KHẤU TRANH HERO Ở TRUNG TÂM (Hỗ trợ lướt vuốt Swipe Left/Right) */}
      <div
        className="relative flex-1 flex items-center justify-center p-2 z-10 overflow-hidden min-h-[380px]"
        onTouchStart={(e) => setTouchStartX(e.targetTouches[0].clientX)}
        onTouchMove={(e) => setTouchEndX(e.targetTouches[0].clientX)}
        onTouchEnd={() => {
          if (touchStartX !== null && touchEndX !== null) {
            const distance = touchStartX - touchEndX
            if (distance > 50) {
              handleNextArtwork()
            } else if (distance < -50) {
              handlePrevArtwork()
            }
          }
          setTouchStartX(null)
          setTouchEndX(null)
        }}
      >
        {/* Nút Prev Artwork bên trái */}
        <button
          type="button"
          onClick={handlePrevArtwork}
          aria-label="Tác phẩm trước"
          className="absolute left-2 z-20 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#090D18]/90 border border-[#1E2D42] text-white flex items-center justify-center active:scale-95 shadow-2xl cursor-pointer hover:border-[#00D4FF] hover:text-[#00D4FF]"
          title="Tác phẩm trước"
        >
          <ChevronLeft className="w-6 h-6 text-[#00D4FF]" />
        </button>

        {/* Nút Next Artwork bên phải */}
        <button
          type="button"
          onClick={handleNextArtwork}
          aria-label="Tác phẩm tiếp theo"
          className="absolute right-2 z-20 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#090D18]/90 border border-[#1E2D42] text-white flex items-center justify-center active:scale-95 shadow-2xl cursor-pointer hover:border-[#00D4FF] hover:text-[#00D4FF]"
          title="Tác phẩm tiếp theo"
        >
          <ChevronRight className="w-6 h-6 text-[#00D4FF]" />
        </button>

        {/* Tranh Hero lớn ở giữa */}
        <div
          onClick={handleOpenCurrentInViewer}
          className="relative w-full h-[52vh] max-h-[480px] flex items-center justify-center cursor-pointer group"
        >
          {!imageError ? (
            <Image
              src={resolveImageUrl(currentArtwork.path)}
              alt={currentArtwork.title}
              fill
              priority
              referrerPolicy="no-referrer"
              className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)] transition-all duration-300 group-hover:scale-102"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="text-center p-6 rounded-2xl bg-[#090D18]/95 border border-[#1E2D42] space-y-2 max-w-xs shadow-2xl">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] font-bold uppercase">
                CHỜ ĐỒNG BỘ WEBP
              </span>
              <h4 className="text-sm font-bold text-white">{currentArtwork.title}</h4>
              <p className="text-xs text-[#A7B6C8]">Tác phẩm đang ở chế độ xem trước.</p>
            </div>
          )}

          {/* Huy hiệu số thứ tự tác phẩm trên sân khấu */}
          <div className="absolute top-2 left-4 z-20">
            <span className="px-2.5 py-1 rounded-full bg-[#090D18]/90 border border-[#00D4FF]/40 text-xs font-mono font-bold text-[#00D4FF] backdrop-blur-md shadow-lg">
              {selectedArtworkIndex + 1} / {displayArtworks.length}
            </span>
          </div>
        </div>

        {/* Floating Side Tools trên cạnh phải (2D HUD, Zoom, Fullscreen) >= 44px */}
        <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onToggleBackgroundMode(backgroundMode === 'standard' ? 'tactical' : 'standard')}
            className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center text-xs font-mono font-bold shadow-lg transition-all ${
              backgroundMode === 'tactical'
                ? 'bg-[#00D4FF] text-[#070A12] border-[#00D4FF]'
                : 'bg-[#090D18]/90 border-[#1E2D42] text-[#00D4FF]'
            }`}
            title="Chế độ Radar HUD"
          >
            {backgroundMode === 'tactical' ? <Radar className="w-5 h-5 animate-spin" /> : '2D'}
          </button>

          <button
            type="button"
            onClick={handleOpenCurrentInViewer}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-[#090D18]/90 border border-[#1E2D42] text-[#00D4FF] hover:border-[#00D4FF] flex items-center justify-center shadow-lg active:scale-95 cursor-pointer"
            title="Kính lúp zoom chi tiết"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleOpenCurrentInViewer}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-[#090D18]/90 border border-[#1E2D42] text-[#00D4FF] hover:border-[#00D4FF] flex items-center justify-center shadow-lg active:scale-95 cursor-pointer"
            title="Toàn màn hình"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 4. FOOTER: METADATA CỦA BỨC TRANH ĐANG CHỌN & THUMBNAIL CAROUSEL ĐỒNG BỘ */}
      <footer className="relative z-30 px-3.5 pt-2 pb-3 bg-gradient-to-t from-[#070A12] via-[#070A12]/95 to-transparent space-y-2">
        {/* Hàng 1: Tiêu đề và Thể loại của ARTWORK (Đồng bộ theo tranh) */}
        <div className="p-2.5 rounded-xl bg-[#0D1526]/90 border border-[#1E2D42] flex items-center justify-between gap-2 shadow-lg">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30 shrink-0">
                {currentArtwork.category.toUpperCase()}
              </span>
              <h3 className="text-sm font-bold font-mono text-white truncate">
                {currentArtwork.title}
              </h3>
            </div>
            {currentArtwork.description && (
              <p className="text-[11px] text-[#CBD5E1] truncate mt-0.5 font-sans">
                {currentArtwork.description}
              </p>
            )}
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs font-mono font-bold text-[#34D399] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#34D399]" />
              <span>WebP HD</span>
            </span>
          </div>
        </div>

        {/* Hàng 2: Thumbnail Carousel Cuộn Ngang (Toàn bộ tranh, thumbnail đang chọn sáng viền) */}
        <div className="relative">
          <div
            ref={thumbnailRowRef}
            className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth px-1"
          >
            {displayArtworks.map((art, idx) => {
              const isSelected = selectedArtworkIndex === idx

              return (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => setSelectedArtworkIndex(idx)}
                  className={`relative w-16 h-14 rounded-xl overflow-hidden border shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#00D4FF] ring-2 ring-[#00D4FF]/60 shadow-[0_0_12px_rgba(0,212,255,0.6)] scale-105 z-10'
                      : 'border-[#1E2D42] opacity-70 hover:opacity-100'
                  }`}
                  title={art.title}
                >
                  <Image
                    src={resolveImageUrl(art.path)}
                    alt={art.title}
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                  <div className="absolute top-0.5 right-0.5 px-1 rounded bg-black/70 text-[9px] font-mono text-white font-bold">
                    {idx + 1}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Hàng 3: Character Identity nhỏ gọn (Không nhầm lẫn với artwork metadata) */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#94A3B8] px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span className="font-bold text-white">{character.classCharacterName}</span>
            <span>·</span>
            <span className="text-[#00D4FF]">{character.callsign}</span>
          </div>
          <span className="italic truncate max-w-[160px]">"{character.characterQuote}"</span>
        </div>
      </footer>
    </div>
  )
}
export default MobileArtView
