'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  CharacterProfileV2,
  GalleryArtwork,
} from '@/lib/game/v2/character-profile-data'
import { PilotAvatar } from './pilot-avatar'
import {
  Maximize2,
  FileText,
  Sparkles,
  FileArchive,
  Layers,
  ImageOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface MobileArtViewProps {
  characters: CharacterProfileV2[]
  selectedCharacter: CharacterProfileV2
  onSelectCharacter: (char: CharacterProfileV2) => void
  selectedHeroArtwork: GalleryArtwork | null
  onSelectHeroArtwork?: (artwork: GalleryArtwork) => void
  onOpenViewer: (artwork: GalleryArtwork) => void
  onSwitchToInfoView: () => void
  heroBackgroundMode: 'contextual' | 'clean'
  onChangeHeroBackgroundMode: (mode: 'contextual' | 'clean') => void
  forceMobileView?: boolean
}

export function MobileArtView({
  characters,
  selectedCharacter,
  onSelectCharacter,
  selectedHeroArtwork,
  onSelectHeroArtwork,
  onOpenViewer,
  onSwitchToInfoView,
  heroBackgroundMode,
  onChangeHeroBackgroundMode,
  forceMobileView = false,
}: MobileArtViewProps) {
  const [heroImgError, setHeroImgError] = useState(false)
  const filmstripRef = useRef<HTMLDivElement | null>(null)

  const verifiedArtworks = selectedCharacter.artworks.filter(
    (a) => a.isAvailableOnDisk && Boolean(a.path)
  )

  const heroSrc =
    selectedHeroArtwork?.isAvailableOnDisk && selectedHeroArtwork.path
      ? selectedHeroArtwork.path
      : selectedCharacter.fullbodyAssetPath || verifiedArtworks[0]?.path || ''

  const isHeroAvailable = Boolean(heroSrc) && !heroImgError

  useEffect(() => {
    setHeroImgError(false)
  }, [heroSrc, selectedCharacter.id])

  const handleOpenHeroInViewer = () => {
    if (!isHeroAvailable) return
    if (selectedHeroArtwork && selectedHeroArtwork.isAvailableOnDisk && selectedHeroArtwork.path) {
      onOpenViewer(selectedHeroArtwork)
      return
    }
    if (verifiedArtworks.length > 0) {
      onOpenViewer(verifiedArtworks[0])
    } else if (heroSrc) {
      onOpenViewer({
        id: `${selectedCharacter.id}-hero`,
        title: `${selectedCharacter.classCharacterName} — Hero Fullbody`,
        category: 'base',
        path: heroSrc,
        isAvailableOnDisk: true,
        status: 'verified_webp',
        description: selectedCharacter.shortDescription,
      })
    }
  }

  const scrollFilmstrip = (dir: 'left' | 'right') => {
    if (!filmstripRef.current) return
    filmstripRef.current.scrollBy({
      left: dir === 'left' ? -180 : 180,
      behavior: 'smooth',
    })
  }

  return (
    <div
      className={`${
        forceMobileView ? 'flex' : 'md:hidden flex'
      } flex-col min-h-[calc(100vh-100px)] bg-[#070A12] text-[#F1F5F9] select-none`}
    >
      {/* 1. HORIZONTAL PORTRAIT ROSTER STRIP (Matches Approved Mobile Concept) */}
      <div className="px-2.5 py-2 border-b border-[#1E2D42] bg-[#080D18]/95">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {characters.map((char) => {
            const isSelected = char.id === selectedCharacter.id
            return (
              <button
                key={char.id}
                type="button"
                onClick={() => onSelectCharacter(char)}
                className={`flex flex-col items-center p-1.5 rounded-xl border shrink-0 transition-all cursor-pointer min-w-[66px] ${
                  isSelected
                    ? 'bg-[#13263E] border-[#00D4FF] shadow-[0_0_12px_rgba(0,212,255,0.3)]'
                    : 'bg-[#070A12]/80 border-[#1E2D42] opacity-80 hover:opacity-100'
                }`}
              >
                <PilotAvatar
                  character={char}
                  isSelected={isSelected}
                  className="w-12 h-12 rounded-lg"
                />
                <span
                  className={`text-[10px] font-mono font-bold truncate max-w-[60px] mt-1 ${
                    isSelected ? 'text-[#00D4FF]' : 'text-[#E2E8F0]'
                  }`}
                >
                  {char.classCharacterName}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. MOBILE HERO STAGE WITH ARTWORK-DERIVED AMBIENT BACKGROUND */}
      <div className="relative flex-1 min-h-[420px] flex flex-col justify-between overflow-hidden bg-[#050811]">
        {heroBackgroundMode === 'contextual' ? (
          <>
            {isHeroAvailable && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <Image
                  src={heroSrc}
                  alt=""
                  fill
                  referrerPolicy="no-referrer"
                  className="object-cover object-center scale-125 blur-2xl opacity-35 saturate-150"
                />
              </div>
            )}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,212,255,0.14)_0%,_rgba(5,8,17,0.92)_80%)] pointer-events-none" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[#04060C] pointer-events-none" />
        )}

        {/* Right Floating Stage Controls (44x44px touch targets) */}
        <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2">
          {isHeroAvailable && (
            <button
              type="button"
              onClick={handleOpenHeroInViewer}
              aria-label="Xem ảnh toàn màn hình (Full Screen)"
              title="Xem ảnh toàn màn hình (Full Screen)"
              className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-[#00D4FF] hover:bg-[#38BDF8] text-[#070A12] font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_18px_rgba(0,212,255,0.45)] cursor-pointer active:scale-95 touch-manipulation"
            >
              <Maximize2 className="w-4 h-4 stroke-[2.5]" />
              <span>Full Screen</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onChangeHeroBackgroundMode('contextual')}
            aria-label="Bối cảnh trạm"
            className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 backdrop-blur-md cursor-pointer touch-manipulation ${
              heroBackgroundMode === 'contextual'
                ? 'bg-[#142338]/95 border-[#00D4FF] text-[#00D4FF]'
                : 'bg-[#090F1C]/85 border-[#1E2D42] text-[#CBD5E1]'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Bối cảnh</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeHeroBackgroundMode('clean')}
            aria-label="Tách nền nhân vật"
            className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 backdrop-blur-md cursor-pointer touch-manipulation ${
              heroBackgroundMode === 'clean'
                ? 'bg-[#142338]/95 border-[#00D4FF] text-[#00D4FF]'
                : 'bg-[#090F1C]/85 border-[#1E2D42] text-[#CBD5E1]'
            }`}
          >
            <ImageOff className="w-4 h-4 shrink-0" />
            <span>Tách nền</span>
          </button>
        </div>

        {/* Center Character Portrait / Fullbody */}
        <div className="relative z-10 flex-1 min-h-[280px] w-full flex items-center justify-center p-2">
          {isHeroAvailable ? (
            <div
              onClick={handleOpenHeroInViewer}
              className="relative w-full h-[300px] flex items-center justify-center cursor-zoom-in"
            >
              <Image
                src={heroSrc}
                alt={selectedCharacter.classCharacterName}
                fill
                priority
                referrerPolicy="no-referrer"
                className="object-contain object-center drop-shadow-[0_14px_30px_rgba(0,0,0,0.85)]"
                onError={() => setHeroImgError(true)}
              />
            </div>
          ) : (
            <div className="max-w-xs text-center p-5 rounded-2xl bg-[#0B111E]/95 border border-[#1E2D42] space-y-2 mx-4">
              <FileArchive className="w-7 h-7 text-[#F59E0B] mx-auto" />
              <div className="text-xs font-mono font-bold text-white">
                {selectedCharacter.classCharacterName}
              </div>
              <p className="text-xs text-[#CBD5E1]">
                Đang chờ nhập tệp ảnh WebP VERIFIED trên kênh CDN.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Identity + Thumbnail Filmstrip + Quote + CTA to Info View */}
        <div className="relative z-20 p-3.5 bg-gradient-to-t from-[#050811] via-[#070A12]/95 to-transparent space-y-2.5">
          {/* Identity Overlay */}
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00D4FF]" />
              <h2 className="text-xl font-black text-white tracking-wide uppercase">
                {selectedCharacter.classCharacterName}
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30">
                {selectedCharacter.personaCode || selectedCharacter.callsign}
              </span>
            </div>
            <p className="text-xs text-[#00D4FF] font-medium">
              {selectedCharacter.role} · {selectedCharacter.fullLoreName}
            </p>
          </div>

          {/* Mobile Thumbnail Filmstrip (< [Thumb 1] [Thumb 2] [Thumb 3] >) */}
          {verifiedArtworks.length > 0 && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => scrollFilmstrip('left')}
                aria-label="Cuộn ảnh sang trái"
                className="w-8 h-12 rounded-lg bg-[#0B111E] border border-[#1E2D42] text-[#CBD5E1] flex items-center justify-center shrink-0 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div
                ref={filmstripRef}
                className="flex-1 flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-none"
              >
                {verifiedArtworks.map((art) => {
                  const isActive =
                    (selectedHeroArtwork && selectedHeroArtwork.id === art.id) ||
                    (!selectedHeroArtwork && art.path === heroSrc)
                  return (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => {
                        if (onSelectHeroArtwork) onSelectHeroArtwork(art)
                      }}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer ${
                        isActive
                          ? 'border-[#00D4FF] ring-2 ring-[#00D4FF]/40'
                          : 'border-[#1E2D42] opacity-75'
                      }`}
                    >
                      <Image
                        src={art.path}
                        alt={art.title}
                        fill
                        sizes="48px"
                        referrerPolicy="no-referrer"
                        className="object-cover object-top"
                      />
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={() => scrollFilmstrip('right')}
                aria-label="Cuộn ảnh sang phải"
                className="w-8 h-12 rounded-lg bg-[#0B111E] border border-[#1E2D42] text-[#CBD5E1] flex items-center justify-center shrink-0 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {selectedCharacter.characterQuote && (
            <p className="text-xs text-[#E2E8F0] italic line-clamp-2 px-1">
              &ldquo;{selectedCharacter.characterQuote}&rdquo;
            </p>
          )}

          <button
            type="button"
            onClick={onSwitchToInfoView}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#0284C7] text-[#070A12] font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.35)] active:scale-[0.99] cursor-pointer min-h-[46px]"
          >
            <FileText className="w-4 h-4" />
            <span>Mở Hồ Sơ Chi Tiết & Cốt Truyện (INFO VIEW)</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default MobileArtView
