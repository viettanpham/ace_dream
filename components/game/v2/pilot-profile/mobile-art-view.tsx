'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  CharacterProfileV2,
  GalleryArtwork,
  ATTRIBUTE_COLOR_CONFIG,
  BaseAttributes,
} from '@/lib/game/v2/character-profile-data'
import { PilotAvatar } from './pilot-avatar'
import {
  Maximize2,
  FileText,
  Sparkles,
  FileArchive,
  Layers,
  ImageOff,
} from 'lucide-react'

interface MobileArtViewProps {
  characters: CharacterProfileV2[]
  selectedCharacter: CharacterProfileV2
  onSelectCharacter: (char: CharacterProfileV2) => void
  selectedHeroArtwork: GalleryArtwork | null
  onOpenViewer: (artwork: GalleryArtwork) => void
  onSwitchToInfoView: () => void
  heroBackgroundMode: 'contextual' | 'clean'
  onChangeHeroBackgroundMode: (mode: 'contextual' | 'clean') => void
}

export function MobileArtView({
  characters,
  selectedCharacter,
  onSelectCharacter,
  selectedHeroArtwork,
  onOpenViewer,
  onSwitchToInfoView,
  heroBackgroundMode,
  onChangeHeroBackgroundMode,
}: MobileArtViewProps) {
  const [heroImgError, setHeroImgError] = useState(false)

  const heroSrc =
    selectedHeroArtwork?.isAvailableOnDisk && selectedHeroArtwork.path
      ? selectedHeroArtwork.path
      : selectedCharacter.fullbodyAssetPath || ''

  const isHeroAvailable = Boolean(heroSrc) && !heroImgError

  useEffect(() => {
    setHeroImgError(false)
  }, [heroSrc, selectedCharacter.id])

  const attributeKeys: (keyof BaseAttributes)[] = ['atk', 'def', 'agi', 'ene', 'shd', 'luk']

  const handleOpenHeroInViewer = () => {
    if (!isHeroAvailable) return
    if (selectedHeroArtwork && selectedHeroArtwork.isAvailableOnDisk && selectedHeroArtwork.path) {
      onOpenViewer(selectedHeroArtwork)
      return
    }
    const firstVerified = selectedCharacter.artworks.find(
      (a) => a.isAvailableOnDisk && Boolean(a.path)
    )
    if (firstVerified) {
      onOpenViewer(firstVerified)
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

  return (
    <div className="md:hidden flex flex-col min-h-[calc(100vh-100px)] bg-[#070A12] text-[#F1F5F9] select-none">
      {/* 1. HORIZONTAL ROSTER CAROUSEL (44px+ tap targets) */}
      <div className="p-2.5 border-b border-[#1E2D42] bg-[#0B111E]/95">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {characters.map((char) => {
            const isSelected = char.id === selectedCharacter.id
            return (
              <button
                key={char.id}
                type="button"
                onClick={() => onSelectCharacter(char)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border shrink-0 transition-all cursor-pointer min-h-[46px] ${
                  isSelected
                    ? 'bg-[#142338] border-[#00D4FF] text-[#00D4FF] shadow-[0_0_12px_rgba(0,212,255,0.25)]'
                    : 'bg-[#070A12] border-[#1E2D42] text-[#CBD5E1]'
                }`}
              >
                <PilotAvatar
                  character={char}
                  isSelected={isSelected}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  {char.classCharacterName}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. MOBILE HERO STAGE */}
      <div className="relative flex-1 min-h-[380px] flex flex-col justify-between overflow-hidden bg-[#060911]">
        {heroBackgroundMode === 'contextual' ? (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,212,255,0.18)_0%,_rgba(6,9,17,0.95)_75%)] pointer-events-none" />
        ) : (
          <div className="absolute inset-0 bg-[#05070E] pointer-events-none" />
        )}

        {/* Top Bar inside Stage */}
        <div className="relative z-20 p-3 flex items-start justify-between gap-2">
          <div className="bg-[#0B111E]/95 backdrop-blur-md border border-[#1E2D42] rounded-xl px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span className="font-mono font-black text-sm text-white">
                {selectedCharacter.classCharacterName}
              </span>
            </div>
            <p className="text-xs text-[#00D4FF] font-mono">
              {selectedCharacter.role}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                onChangeHeroBackgroundMode(
                  heroBackgroundMode === 'contextual' ? 'clean' : 'contextual'
                )
              }
              aria-label="Chuyển đổi nền sân khấu"
              className="w-11 h-11 rounded-xl bg-[#0B111E]/95 border border-[#1E2D42] text-[#F1F5F9] flex items-center justify-center backdrop-blur-md cursor-pointer"
            >
              {heroBackgroundMode === 'contextual' ? (
                <Layers className="w-4 h-4 text-[#00D4FF]" />
              ) : (
                <ImageOff className="w-4 h-4 text-[#00D4FF]" />
              )}
            </button>

            {isHeroAvailable && (
              <button
                type="button"
                onClick={handleOpenHeroInViewer}
                aria-label="Xem ảnh toàn màn hình"
                className="w-11 h-11 rounded-xl bg-[#0B111E]/95 border border-[#1E2D42] text-[#00D4FF] flex items-center justify-center backdrop-blur-md cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Center Character Portrait / Fullbody */}
        <div className="relative z-10 flex-1 min-h-[270px] w-full flex items-center justify-center p-2">
          {isHeroAvailable ? (
            <div
              onClick={handleOpenHeroInViewer}
              className="relative w-full h-[290px] flex items-center justify-center cursor-zoom-in"
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

        {/* Bottom Card Summary + 6 Stats + CTA to Info View */}
        <div className="relative z-20 p-3.5 bg-gradient-to-t from-[#070A12] via-[#070A12]/98 to-transparent space-y-3">
          {selectedCharacter.characterQuote && (
            <p className="text-xs sm:text-sm text-white italic line-clamp-2 text-center px-2">
              &ldquo;{selectedCharacter.characterQuote}&rdquo;
            </p>
          )}

          {selectedCharacter.baseAttributes ? (
            <div className="grid grid-cols-6 gap-1.5 p-2 rounded-xl bg-[#0B111E]/95 border border-[#1E2D42]">
              {attributeKeys.map((key) => {
                const val = selectedCharacter.baseAttributes![key]
                const cfg = ATTRIBUTE_COLOR_CONFIG[key]
                return (
                  <div
                    key={key}
                    className="flex flex-col items-center justify-center py-1 rounded-lg bg-[#070A12]"
                  >
                    <span className="text-[10px] font-mono text-[#CBD5E1]">{cfg.label}</span>
                    <span className={`text-xs font-mono font-black ${cfg.textClass}`}>
                      {val}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-[#0B111E]/95 border border-[#1E2D42] text-center text-xs font-mono text-[#CBD5E1]">
              SYSTEM Stats: Chưa đăng ký trong FND-1 Registry
            </div>
          )}

          <button
            type="button"
            onClick={onSwitchToInfoView}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#0284C7] text-[#070A12] font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.35)] active:scale-[0.99] cursor-pointer min-h-[48px]"
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
