'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CharacterProfileV2 } from '@/lib/game/v2/character-profile-data'
import { resolveImageUrl } from '@/lib/game/assets/image-resolver'
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
  Home,
  ZoomIn,
  Scan,
} from 'lucide-react'

interface MobileArtViewProps {
  roster: CharacterProfileV2[]
  character: CharacterProfileV2
  onSelectCharacter: (char: CharacterProfileV2) => void
  backgroundMode: 'standard' | 'tactical'
  onToggleBackgroundMode: (mode: 'standard' | 'tactical') => void
  onSwitchToInfoView: () => void
  onOpenArtViewer: () => void
  onPrevPilot: () => void
  onNextPilot: () => void
}

export function MobileArtView({
  roster,
  character,
  onSelectCharacter,
  backgroundMode,
  onToggleBackgroundMode,
  onSwitchToInfoView,
  onOpenArtViewer,
  onPrevPilot,
  onNextPilot,
}: MobileArtViewProps) {
  const [imageError, setImageError] = useState<boolean>(false)
  const [activeThumbIndex, setActiveThumbIndex] = useState<number>(0)

  useEffect(() => {
    setImageError(false)
    setActiveThumbIndex(0)
  }, [character.id])

  const artworks = character.artworks && character.artworks.length > 0
    ? character.artworks
    : [
        {
          id: `${character.id}-fullbody`,
          title: `${character.classCharacterName} — Tranh Toàn Thân`,
          category: 'base' as const,
          path: character.fullbodyAssetPath,
          isAvailableOnDisk: true,
          status: 'verified_webp' as const,
          description: character.shortDescription,
        },
      ]

  const currentDisplayPath = artworks[activeThumbIndex]?.path || character.fullbodyAssetPath

  return (
    <div className="relative w-full min-h-[100dvh] bg-[#070A12] text-[#F1F5F9] flex flex-col justify-between overflow-x-hidden select-none pb-20">
      {/* Background Graphic */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
          backgroundMode === 'tactical'
            ? 'opacity-100 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-cyan-950/60 via-[#070A12] to-[#070A12]'
            : 'opacity-100 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-950/50 via-[#070A12] to-[#070A12]'
        }`}
      />

      {/* 1. TOP HEADER (Chuẩn Concept PNG) */}
      <header className="relative z-30 px-3.5 pt-2 pb-1.5 bg-[#090D18]/95 backdrop-blur-md border-b border-[#1E2D42] flex items-center justify-between">
        <Link
          href="/"
          className="p-1.5 rounded-lg border border-[#1E2D42] bg-[#0E1626] text-[#A7B6C8] hover:text-[#00D4FF]"
          title="Về Trang Chủ"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>

        <div className="flex flex-col items-center">
          <span className="font-mono font-black text-xs tracking-widest text-white flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
            <span>STARFRONT</span>
          </span>
          <span className="text-[9px] font-mono text-[#00D4FF] uppercase tracking-wider">
            WORLD FND-8
          </span>
        </div>

        <Link
          href="/"
          className="p-1.5 rounded-lg border border-[#1E2D42] bg-[#0E1626] text-[#A7B6C8] hover:text-[#00D4FF]"
          title="Trang Chủ"
        >
          <Home className="w-4 h-4" />
        </Link>
      </header>

      {/* 2. DẢI AVATAR ROSTER NGANG PHÍA TRÊN (Chuẩn Concept Mobile) */}
      <div className="relative z-20 px-3 py-2 bg-[#090D18]/80 border-b border-[#1E2D42] overflow-x-auto scrollbar-none">
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
                    ? 'bg-[#142338] border-[#00D4FF] shadow-[0_0_10px_rgba(0,212,255,0.3)] ring-1 ring-[#00D4FF]/60'
                    : 'bg-[#0B111E]/80 border-[#1E2D42]'
                }`}
              >
                <div
                  className={`relative w-10 h-10 rounded-lg overflow-hidden bg-[#0A0F1A] border ${
                    isSelected ? 'border-[#00D4FF]' : 'border-[#1E2D42]'
                  }`}
                >
                  <Image
                    src={resolveImageUrl(char.portraitAssetPath)}
                    alt={char.classCharacterName}
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = resolveImageUrl('/images/valentine-portrait.webp')
                    }}
                  />
                </div>
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

      {/* 3. NÚT CHUYỂN ĐỔI CHẾ ĐỘ XEM TRÊN HEADER: [Xem Thông Tin] | [Xem Tranh Nhân Vật (Active)] */}
      <div className="relative z-20 px-4 py-2 flex justify-center">
        <div className="inline-flex rounded-xl bg-[#090D18] border border-[#1E2D42] p-1 shadow-lg">
          <button
            type="button"
            onClick={onSwitchToInfoView}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold text-[#A7B6C8] hover:text-white transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Xem Thông Tin</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#00D4FF] text-[#070A12] shadow-sm shadow-cyan-500/30 cursor-default"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Xem Tranh Nhân Vật</span>
          </button>
        </div>
      </div>

      {/* 4. KHU VỰC TRANH TOÀN THÂN LỚN Ở TRUNG TÂM */}
      <div className="relative flex-1 flex items-center justify-center p-2 z-10 overflow-hidden min-h-[380px]">
        {/* Nút Prev / Next Pilot hai bên mép màn hình */}
        <button
          type="button"
          onClick={onPrevPilot}
          aria-label="Phi công trước"
          className="absolute left-2 z-20 w-10 h-10 rounded-full bg-[#090D18]/85 border border-[#1E2D42] text-white flex items-center justify-center active:scale-95 shadow-xl cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-[#00D4FF]" />
        </button>

        <button
          type="button"
          onClick={onNextPilot}
          aria-label="Phi công tiếp theo"
          className="absolute right-2 z-20 w-10 h-10 rounded-full bg-[#090D18]/85 border border-[#1E2D42] text-white flex items-center justify-center active:scale-95 shadow-xl cursor-pointer"
        >
          <ChevronRight className="w-5 h-5 text-[#00D4FF]" />
        </button>

        {/* Tranh toàn thân lớn */}
        <div className="relative w-full h-[54vh] max-h-[500px] flex items-center justify-center">
          {!imageError ? (
            <Image
              src={resolveImageUrl(currentDisplayPath)}
              alt={character.classCharacterName}
              fill
              priority
              referrerPolicy="no-referrer"
              className="object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="text-center p-6 rounded-2xl bg-[#090D18]/90 border border-[#1E2D42] space-y-2 max-w-xs">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] font-bold uppercase">
                CHỜ ĐỒNG BỘ WEBP
              </span>
              <h4 className="text-sm font-bold text-white">{character.classCharacterName}</h4>
              <p className="text-xs text-[#A7B6C8]">Artwork toàn thân đang đồng bộ.</p>
            </div>
          )}
        </div>

        {/* Floating Side Tools trên cạnh phải (Chuẩn Concept: 2D, Zoom, Grid, Fullscreen) */}
        <div className="absolute right-3 top-4 z-20 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onToggleBackgroundMode(backgroundMode === 'standard' ? 'tactical' : 'standard')}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-mono font-bold shadow-lg transition-all ${
              backgroundMode === 'tactical'
                ? 'bg-[#00D4FF] text-[#070A12] border-[#00D4FF]'
                : 'bg-[#090D18]/90 border-[#1E2D42] text-[#00D4FF]'
            }`}
            title="Chế độ 2D / HUD"
          >
            2D
          </button>

          <button
            type="button"
            onClick={onOpenArtViewer}
            className="w-9 h-9 rounded-xl bg-[#090D18]/90 border border-[#1E2D42] text-[#00D4FF] flex items-center justify-center shadow-lg active:scale-95 cursor-pointer"
            title="Kính lúp zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenArtViewer}
            className="w-9 h-9 rounded-xl bg-[#090D18]/90 border border-[#1E2D42] text-[#00D4FF] flex items-center justify-center shadow-lg active:scale-95 cursor-pointer"
            title="Phóng to toàn màn hình"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5. KHU VỰC THÔNG TIN DƯỚI CHÂN TRANH (Chuẩn Concept Mobile) */}
      <footer className="relative z-30 px-4 pt-2 pb-3 bg-gradient-to-t from-[#070A12] via-[#070A12]/95 to-transparent space-y-2.5">
        {/* Tên nhân vật nổi & Subtitle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981]">
              <Heart className="w-3.5 h-3.5 text-[#10B981]" />
            </div>
            <div>
              <h2 className="text-base font-black font-mono text-white tracking-wide leading-tight">
                {character.classCharacterName}
              </h2>
              <div className="text-[11px] text-[#A7B6C8] font-medium leading-tight">
                {character.title}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#00D4FF] bg-[#00D4FF]/10 px-2 py-0.5 rounded border border-[#00D4FF]/30">
            {character.role}
          </span>
        </div>

        {/* Dải Thumbnails Có 2 Mũi Tên < > */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setActiveThumbIndex((prev) => Math.max(0, prev - 1))}
            disabled={activeThumbIndex === 0}
            className="p-1 rounded-md border border-[#1E2D42] text-[#A7B6C8] disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            {artworks.slice(0, 3).map((art, idx) => {
              const isSelected = activeThumbIndex === idx

              return (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => setActiveThumbIndex(idx)}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#00D4FF] ring-2 ring-[#00D4FF]/40 shadow-[0_0_8px_rgba(0,212,255,0.4)]'
                      : 'border-[#1E2D42] opacity-75'
                  }`}
                >
                  <Image
                    src={resolveImageUrl(art.path)}
                    alt={art.title}
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => setActiveThumbIndex((prev) => Math.min(artworks.length - 1, prev + 1))}
            disabled={activeThumbIndex >= artworks.length - 1}
            className="p-1 rounded-md border border-[#1E2D42] text-[#A7B6C8] disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quote Bay Bổng Dưới Chân */}
        <p className="text-center text-xs italic font-serif text-[#CBD5E1] px-4 leading-relaxed">
          "{character.characterQuote}"
        </p>
      </footer>
    </div>
  )
}
export default MobileArtView
