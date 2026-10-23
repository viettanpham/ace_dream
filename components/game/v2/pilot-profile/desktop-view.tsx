'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  CharacterProfileV2,
  GalleryArtwork,
} from '@/lib/game/v2/character-profile-data'
import { resolveImageUrl } from '@/lib/game/assets/image-resolver'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/game/v2/ui'
import { StoryTab } from './tabs/story-tab'
import { GearCompatTab } from './tabs/gear-compat-tab'
import { GalleryTab } from './tabs/gallery-tab'
import {
  Maximize2,
  Radar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shield,
  Heart,
  Zap,
  Play,
  Crosshair,
  Award,
} from 'lucide-react'

interface DesktopViewProps {
  roster: CharacterProfileV2[]
  activeCharacter: CharacterProfileV2
  onSelectCharacter: (char: CharacterProfileV2) => void
  backgroundMode: 'standard' | 'tactical'
  onToggleBackgroundMode: (mode: 'standard' | 'tactical') => void
  onOpenArtViewer: (artwork?: GalleryArtwork) => void
  activeTab: string
  onTabChange: (tab: string) => void
}

export function DesktopView({
  roster,
  activeCharacter,
  onSelectCharacter,
  backgroundMode,
  onToggleBackgroundMode,
  onOpenArtViewer,
  activeTab,
  onTabChange,
}: DesktopViewProps) {
  const [mainImageError, setMainImageError] = useState<boolean>(false)
  const [carouselIndex, setCarouselIndex] = useState<number>(0)
  const [selectedArtwork, setSelectedArtwork] = useState<GalleryArtwork | null>(null)

  // Reset khi đổi phi công
  useEffect(() => {
    setMainImageError(false)
    setCarouselIndex(0)
    setSelectedArtwork(null)
  }, [activeCharacter.id])

  // Artworks của nhân vật hiện tại cho carousel dưới chân
  const availableArtworks = activeCharacter.artworks && activeCharacter.artworks.length > 0
    ? activeCharacter.artworks
    : [
        {
          id: `${activeCharacter.id}-fullbody`,
          title: `${activeCharacter.classCharacterName} — Tranh Toàn Thân`,
          category: 'base' as const,
          path: activeCharacter.fullbodyAssetPath,
          isAvailableOnDisk: true,
          status: 'verified_webp' as const,
          description: activeCharacter.shortDescription,
        },
      ]

  // Carousel 4 thumbnails visible at a time
  const maxCarouselPages = Math.max(0, availableArtworks.length - 4)
  const handlePrevCarousel = () => {
    setCarouselIndex((prev) => Math.max(0, prev - 1))
  }
  const handleNextCarousel = () => {
    setCarouselIndex((prev) => Math.min(maxCarouselPages, prev + 1))
  }

  // Display image path (chọn từ carousel hoặc mặc định fullbody)
  const currentDisplayImage = selectedArtwork?.path || activeCharacter.fullbodyAssetPath

  return (
    <div className="w-full h-[calc(100vh-56px)] min-h-[700px] flex gap-3.5 p-3.5 lg:p-4 bg-[#070A12] text-[#F1F5F9] overflow-hidden select-none">
      {/* =========================================================================
          CỘT 1 (TRÁI): CHARACTER CLASS ROSTER (Chuẩn 100% Concept Approved PNG)
          ========================================================================= */}
      <aside className="w-64 lg:w-72 flex flex-col rounded-2xl bg-[#090D18]/90 border border-[#1E2D42] overflow-hidden shadow-2xl shrink-0 backdrop-blur-md">
        {/* Header Cột: | CHARACTER CLASS */}
        <div className="p-3.5 border-b border-[#1E2D42] bg-[#0E1626]/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-[#00D4FF] rounded-full shadow-[0_0_8px_#00D4FF]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-[#F1F5F9] font-mono">
              CHARACTER CLASS
            </h2>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#00D4FF] bg-[#00D4FF]/10 px-2 py-0.5 rounded border border-[#00D4FF]/30">
            {roster.length} PILOTS
          </span>
        </div>

        {/* Danh sách 12 Pilot - Thẻ Card Chữ Nhật Bo Góc */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2 scrollbar-thin scrollbar-thumb-[#1E2D42]">
          {roster.map((char) => {
            const isSelected = char.id === activeCharacter.id

            return (
              <div
                key={char.id}
                onClick={() => onSelectCharacter(char)}
                className={`group relative rounded-xl border transition-all duration-200 cursor-pointer flex items-center p-2 gap-3 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#142338] via-[#102035] to-[#0D1828] border-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.25)] ring-1 ring-[#00D4FF]/60'
                    : 'bg-[#0B111E]/70 border-[#1A2638] hover:border-[#2C415E] hover:bg-[#101A2B]'
                }`}
              >
                {/* Avatar Hình Chữ Nhật Bo Góc */}
                <div
                  className={`relative w-14 h-11 rounded-lg overflow-hidden bg-[#0A0F1A] border shrink-0 transition-transform duration-200 group-hover:scale-102 ${
                    isSelected
                      ? 'border-[#00D4FF] shadow-[0_0_8px_rgba(0,212,255,0.4)]'
                      : 'border-[#1E2D42]'
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
                  {isSelected && (
                    <div className="absolute inset-0 border border-[#00D4FF]/40 rounded-lg pointer-events-none" />
                  )}
                </div>

                {/* Thông tin: Tên Pilot & Vai Trò (Class Subtitle) */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-xs font-bold font-mono tracking-wide truncate ${
                        isSelected ? 'text-white' : 'text-[#CBD5E1]'
                      }`}
                    >
                      {char.classCharacterName}
                    </h3>
                  </div>
                  <p
                    className={`text-[11px] truncate mt-0.5 ${
                      isSelected ? 'text-[#00D4FF] font-semibold' : 'text-[#7D90A6]'
                    }`}
                  >
                    {char.role}
                  </p>
                </div>

                {/* Active Indicator Bar */}
                {isSelected && (
                  <div className="w-1 h-6 bg-[#00D4FF] rounded-full shadow-[0_0_8px_#00D4FF] shrink-0" />
                )}
              </div>
            )
          })}
        </div>

        {/* Nút mũi tên cuộn danh sách dưới chân */}
        <div className="p-1.5 border-t border-[#1E2D42] bg-[#0A0F1A]/80 flex justify-center text-[#7D90A6]">
          <ChevronDown className="w-4 h-4 animate-bounce text-[#00D4FF]" />
        </div>
      </aside>

      {/* =========================================================================
          CỘT 2 (GIỮA): CENTER VISUAL SHOWCASE (Chuẩn 100% Concept Approved PNG)
          ========================================================================= */}
      <section className="flex-1 relative rounded-2xl bg-[#090D18]/90 border border-[#1E2D42] overflow-hidden shadow-2xl flex flex-col justify-between">
        {/* Background Visual: Trạm Không Gian Quỹ Đạo Elysia & Hành Tinh Xanh */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
            backgroundMode === 'tactical'
              ? 'opacity-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/50 via-[#070A12] to-[#070A12]'
              : 'opacity-100 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/40 via-[#070A12] to-[#070A12]'
          }`}
        />

        {/* Lớp nền trạm vũ trụ tinh xảo */}
        <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(#00d4ff15_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Tactical HUD Overlay khi bật chế độ Radar */}
        {backgroundMode === 'tactical' && (
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#00d4ff0d_1px,transparent_1px),linear-gradient(to_bottom,#00d4ff0d_1px,transparent_1px)] bg-[size:28px_28px] z-10">
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-[#00D4FF] px-3.5 py-1.5 rounded-lg bg-[#070A12]/90 border border-[#00D4FF]/30 backdrop-blur-md">
              <span className="flex items-center gap-2">
                <Radar className="w-3.5 h-3.5 animate-spin text-[#00D4FF]" />
                <span className="font-bold tracking-wider">TACTICAL HUD // RADAR GRID ONLINE</span>
              </span>
              <span className="text-[#A7B6C8]">BIO-STATUS: 100% NOMINAL</span>
            </div>
          </div>
        )}

        {/* 1. KHU VỰC TRUNG TÂM: TRANH TOÀN THÂN & QUOTE NỔI BÊN TRÁI */}
        <div className="relative flex-1 flex items-center justify-center p-2 z-10 overflow-hidden">
          {/* Quote Chữ Nghiêng Nổi Bật Bên Trái Artwork (Chuẩn Concept PNG) */}
          <div className="absolute left-6 top-1/3 -translate-y-1/2 z-20 max-w-[240px] pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] hidden xl:block">
            <p className="text-sm lg:text-base italic font-serif text-white/95 leading-relaxed tracking-wide font-normal">
              "{activeCharacter.characterQuote}"
            </p>
          </div>

          {/* Nhân Vật Toàn Thân Cực Đại */}
          <div className="relative w-full h-[62vh] max-h-[640px] flex items-center justify-center">
            {!mainImageError ? (
              <Image
                src={resolveImageUrl(currentDisplayImage)}
                alt={activeCharacter.classCharacterName}
                fill
                priority
                referrerPolicy="no-referrer"
                className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.85)] filter hover:brightness-105 transition-all duration-300"
                onError={() => setMainImageError(true)}
              />
            ) : (
              <div className="max-w-sm text-center p-6 rounded-2xl bg-[#0B111E]/90 border border-[#1E2D42] space-y-2">
                <p className="text-xs font-mono text-[#F59E0B] font-bold uppercase">
                  ARCHIVE PENDING
                </p>
                <h4 className="text-base font-bold text-white">{activeCharacter.classCharacterName}</h4>
                <p className="text-xs text-[#A7B6C8]">Artwork toàn thân đang đồng bộ.</p>
              </div>
            )}
          </div>

          {/* HAI ĐIỀU KHIỂN BỐI CẢNH ĐỐI XỨNG HAI BÊN HÔNG NHÂN VẬT (Chuẩn Concept Approved) */}
          {/* Nút Trái: Tiêu Chuẩn */}
          <button
            type="button"
            onClick={() => onToggleBackgroundMode('standard')}
            title="Bối Cảnh Tiêu Chuẩn (Elysia Station)"
            className={`absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-xl border transition-all duration-200 flex flex-col items-center gap-1.5 shadow-xl cursor-pointer ${
              backgroundMode === 'standard'
                ? 'bg-[#00D4FF] text-[#070A12] border-[#00D4FF] shadow-[0_0_12px_rgba(0,212,255,0.4)] font-bold'
                : 'bg-[#0B111E]/85 text-[#7D90A6] border-[#1E2D42] hover:text-white hover:border-[#2C415E]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[9px] font-mono uppercase [writing-mode:vertical-lr] tracking-widest font-bold">
              TIÊU CHUẨN
            </span>
          </button>

          {/* Nút Phải: Tactical Radar HUD */}
          <button
            type="button"
            onClick={() => onToggleBackgroundMode('tactical')}
            title="Bối Cảnh Tác Chiến HUD (Radar Tactical Grid)"
            className={`absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-xl border transition-all duration-200 flex flex-col items-center gap-1.5 shadow-xl cursor-pointer ${
              backgroundMode === 'tactical'
                ? 'bg-[#00D4FF] text-[#070A12] border-[#00D4FF] shadow-[0_0_12px_rgba(0,212,255,0.4)] font-bold'
                : 'bg-[#0B111E]/85 text-[#7D90A6] border-[#1E2D42] hover:text-white hover:border-[#2C415E]'
            }`}
          >
            <Radar className="w-4 h-4" />
            <span className="text-[9px] font-mono uppercase [writing-mode:vertical-lr] tracking-widest font-bold">
              RADAR HUD
            </span>
          </button>
        </div>

        {/* 2. DƯỚI CHÂN ARTWORK: TRAILER CARD & CAROUSEL 4 THUMBNAILS (Chuẩn 100% Concept PNG) */}
        <div className="relative z-20 px-4 py-3 border-t border-[#1E2D42] bg-[#0A0F1A]/95 backdrop-blur-md flex items-center justify-between gap-4">
          {/* Card Bên Trái: CHARACTER TRAILER */}
          <button
            type="button"
            onClick={() => onOpenArtViewer()}
            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[#101A2B] border border-[#1E2D42] hover:border-[#00D4FF] hover:bg-[#142338] transition-all cursor-pointer group shadow-sm shrink-0"
            title="Xem Character Media & Artwork HD"
          >
            <div className="relative w-12 h-8 rounded overflow-hidden bg-black/60 border border-[#1E2D42] shrink-0 flex items-center justify-center">
              <Image
                src={resolveImageUrl(activeCharacter.portraitAssetPath)}
                alt="Trailer"
                fill
                referrerPolicy="no-referrer"
                className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="w-3.5 h-3.5 text-white fill-white group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="text-left">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-white group-hover:text-[#00D4FF] transition-colors flex items-center gap-1">
                <span>CHARACTER TRAILER</span>
                <ChevronRight className="w-3 h-3 text-[#00D4FF]" />
              </div>
              <span className="text-[9px] font-mono text-[#7D90A6]">HD MEDIA SPOTLIGHT</span>
            </div>
          </button>

          {/* Dải Carousel Thumbnail Bên Phải với nút < và > */}
          <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
            {/* Nút Prev Carousel */}
            <button
              type="button"
              onClick={handlePrevCarousel}
              disabled={carouselIndex === 0}
              aria-label="Hình ảnh trước"
              className={`p-1.5 rounded-lg border transition-all ${
                carouselIndex === 0
                  ? 'border-[#1E2D42]/40 text-[#475569] cursor-not-allowed'
                  : 'border-[#1E2D42] text-[#A7B6C8] hover:text-[#00D4FF] hover:border-[#00D4FF] cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Thumbnails strip (4 ảnh ngang) */}
            <div className="flex items-center gap-2 overflow-hidden">
              {availableArtworks.slice(carouselIndex, carouselIndex + 4).map((art) => {
                const isArtSelected = selectedArtwork?.id === art.id || (!selectedArtwork && art.category === 'base')

                return (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => {
                      setSelectedArtwork(art)
                      onOpenArtViewer(art)
                    }}
                    className={`relative w-16 h-11 lg:w-20 lg:h-12 rounded-lg overflow-hidden border transition-all cursor-pointer shrink-0 ${
                      isArtSelected
                        ? 'border-[#00D4FF] ring-2 ring-[#00D4FF]/40 shadow-[0_0_8px_rgba(0,212,255,0.4)]'
                        : 'border-[#1E2D42] opacity-75 hover:opacity-100 hover:border-[#2C415E]'
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
                  </button>
                )
              })}
            </div>

            {/* Nút Next Carousel */}
            <button
              type="button"
              onClick={handleNextCarousel}
              disabled={carouselIndex >= maxCarouselPages}
              aria-label="Hình ảnh tiếp theo"
              className={`p-1.5 rounded-lg border transition-all ${
                carouselIndex >= maxCarouselPages
                  ? 'border-[#1E2D42]/40 text-[#475569] cursor-not-allowed'
                  : 'border-[#1E2D42] text-[#A7B6C8] hover:text-[#00D4FF] hover:border-[#00D4FF] cursor-pointer'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CỘT 3 (PHẢI): PROFILE DOSSIER & ATTRIBUTES (Chuẩn 100% Concept Approved PNG)
          ========================================================================= */}
      <section className="w-[430px] lg:w-[460px] flex flex-col rounded-2xl bg-[#090D18]/90 border border-[#1E2D42] overflow-hidden shadow-2xl shrink-0 backdrop-blur-md">
        {/* Header Profile: Tên, Title, Vai Trò và Logo UME MEDICAL CORPS */}
        <div className="p-4 border-b border-[#1E2D42] bg-[#0E1626]/60">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#00D4FF] uppercase tracking-wider">
                <span>❖ CLASS</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mt-0.5 font-mono">
                {activeCharacter.classCharacterName}
              </h1>
              <div className="text-xs font-semibold text-[#A7B6C8] mt-0.5">
                {activeCharacter.title}
              </div>
              <div className="text-[11px] text-[#7D90A6] mt-0.5">
                {activeCharacter.role}
              </div>
            </div>

            {/* Logo Faction / Corps (UME MEDICAL CORPS chuẩn Concept) */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#0A0F1A] border border-[#1E2D42] shrink-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00D4FF]/10 text-[#00D4FF]">
                <Shield className="w-5 h-5 text-[#00D4FF]" />
              </div>
              <span className="text-[8px] font-mono font-black text-[#A7B6C8] uppercase tracking-tighter mt-1">
                UME CORPS
              </span>
            </div>
          </div>

          {/* Hàng 3 Badges Nổi Bật: Medic (Xanh Lá), Rescue (Xanh Cyan), SHD+ENE (Tím) */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40">
              <Heart className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Medic</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/40">
              <Shield className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>Rescue</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/40">
              <Zap className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>SHD + ENE</span>
            </span>
          </div>

          {/* Đoạn mô tả ngắn (Short Description) */}
          <p className="text-xs text-[#CBD5E1] leading-relaxed mt-3">
            {activeCharacter.shortDescription}
          </p>
        </div>

        {/* Nội Dung Cuộn: Base Attributes, Traits, và Tabs Chi Tiết */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#1E2D42]">
          {/* SECTION: | BASE ATTRIBUTES (6 Thanh Đo Màu Sắc Đầy Đủ) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-3.5 bg-[#00D4FF] rounded-full shadow-[0_0_6px_#00D4FF]" />
                <h3 className="text-xs font-black uppercase font-mono tracking-wider text-white">
                  BASE ATTRIBUTES
                </h3>
              </div>
            </div>

            {/* Grid 2 cột cho 6 chỉ số: ATK, DEF, AGI bên trái; ENE, SHD, LUK bên phải */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 rounded-xl bg-[#0B111E]/80 border border-[#1E2D42] font-mono text-xs">
              {/* ATK - Đỏ */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#EF4444] font-bold flex items-center gap-1">
                  <Crosshair className="w-3 h-3" />
                  <span>ATK</span>
                </span>
                <div className="flex-1 h-2 bg-[#1A2638] rounded-full overflow-hidden mx-1">
                  <div
                    className="h-full bg-[#EF4444] rounded-full shadow-[0_0_6px_#EF4444]"
                    style={{ width: `${(activeCharacter.baseAttributes.atk / 10) * 100}%` }}
                  />
                </div>
                <span className="text-white font-bold w-3 text-right">{activeCharacter.baseAttributes.atk}</span>
              </div>

              {/* ENE - Vàng Cam */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#F59E0B] font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>ENE</span>
                </span>
                <div className="flex-1 h-2 bg-[#1A2638] rounded-full overflow-hidden mx-1">
                  <div
                    className="h-full bg-[#F59E0B] rounded-full shadow-[0_0_6px_#F59E0B]"
                    style={{ width: `${(activeCharacter.baseAttributes.ene / 10) * 100}%` }}
                  />
                </div>
                <span className="text-white font-bold w-3 text-right">{activeCharacter.baseAttributes.ene}</span>
              </div>

              {/* DEF - Xanh Dương */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#3B82F6] font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>DEF</span>
                </span>
                <div className="flex-1 h-2 bg-[#1A2638] rounded-full overflow-hidden mx-1">
                  <div
                    className="h-full bg-[#3B82F6] rounded-full shadow-[0_0_6px_#3B82F6]"
                    style={{ width: `${(activeCharacter.baseAttributes.def / 10) * 100}%` }}
                  />
                </div>
                <span className="text-white font-bold w-3 text-right">{activeCharacter.baseAttributes.def}</span>
              </div>

              {/* SHD - Tím */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#8B5CF6] font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>SHD</span>
                </span>
                <div className="flex-1 h-2 bg-[#1A2638] rounded-full overflow-hidden mx-1">
                  <div
                    className="h-full bg-[#8B5CF6] rounded-full shadow-[0_0_6px_#8B5CF6]"
                    style={{ width: `${(activeCharacter.baseAttributes.shd / 10) * 100}%` }}
                  />
                </div>
                <span className="text-white font-bold w-3 text-right">{activeCharacter.baseAttributes.shd}</span>
              </div>

              {/* AGI - Xanh Lục */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#10B981] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>AGI</span>
                </span>
                <div className="flex-1 h-2 bg-[#1A2638] rounded-full overflow-hidden mx-1">
                  <div
                    className="h-full bg-[#10B981] rounded-full shadow-[0_0_6px_#10B981]"
                    style={{ width: `${(activeCharacter.baseAttributes.agi / 10) * 100}%` }}
                  />
                </div>
                <span className="text-white font-bold w-3 text-right">{activeCharacter.baseAttributes.agi}</span>
              </div>

              {/* LUK - Hồng Tím */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#EC4899] font-bold flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  <span>LUK</span>
                </span>
                <div className="flex-1 h-2 bg-[#1A2638] rounded-full overflow-hidden mx-1">
                  <div
                    className="h-full bg-[#EC4899] rounded-full shadow-[0_0_6px_#EC4899]"
                    style={{ width: `${(activeCharacter.baseAttributes.luk / 10) * 100}%` }}
                  />
                </div>
                <span className="text-white font-bold w-3 text-right">{activeCharacter.baseAttributes.luk}</span>
              </div>
            </div>
          </div>

          {/* SECTION: | TRAITS (2 Ô Card Nằm Ngang Chuẩn Concept) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-3.5 bg-[#00D4FF] rounded-full shadow-[0_0_6px_#00D4FF]" />
              <h3 className="text-xs font-black uppercase font-mono tracking-wider text-white">
                TRAITS
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Trait 1: Bàn Tay Cứu Hộ */}
              <div className="p-2.5 rounded-xl bg-[#0B111E]/80 border border-[#10B981]/40 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 text-[#10B981]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate font-mono">
                      {activeCharacter.traits[0]?.name || 'Bàn Tay Cứu Hộ'}
                    </span>
                    <span className="text-[9px] font-mono text-[#10B981] uppercase font-bold">
                      Passive
                    </span>
                  </div>
                  <p className="text-[10px] text-[#A7B6C8] mt-0.5 leading-snug">
                    {activeCharacter.traits[0]?.description || '+30% hiệu quả hồi phục Medic'}
                  </p>
                </div>
              </div>

              {/* Trait 2: Mái Khiên Nhân Ái */}
              <div className="p-2.5 rounded-xl bg-[#0B111E]/80 border border-[#00D4FF]/40 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#00D4FF]/15 text-[#00D4FF] flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-[#00D4FF]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate font-mono">
                      {activeCharacter.traits[1]?.name || 'Mái Khiên Nhân Ái'}
                    </span>
                    <span className="text-[9px] font-mono text-[#00D4FF] uppercase font-bold">
                      Passive
                    </span>
                  </div>
                  <p className="text-[10px] text-[#A7B6C8] mt-0.5 leading-snug">
                    {activeCharacter.traits[1]?.description || '+30% Shield Recovery từ kỹ năng'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4 TABS: THÔNG TIN CƠ BẢN / STORY / GEAR / GALLERY */}
          <div className="pt-2">
            <Tabs value={activeTab} onValueChange={onTabChange} variant="segmented" className="w-full">
              <TabsList className="mb-3 grid grid-cols-4">
                <TabsTrigger value="overview">THÔNG TIN</TabsTrigger>
                <TabsTrigger value="story">STORY</TabsTrigger>
                <TabsTrigger value="gear">GEAR</TabsTrigger>
                <TabsTrigger value="gallery">GALLERY</TabsTrigger>
              </TabsList>

              {/* Tab 1: THÔNG TIN CƠ BẢN (Bảng Báo Cáo Chuẩn Concept PNG) */}
              <TabsContent value="overview">
                <div className="rounded-xl bg-[#0B111E]/80 border border-[#1E2D42] p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-[#1E2D42]/60 pb-1.5">
                    <span className="text-[#7D90A6]">Giới tính / Tuổi:</span>
                    <span className="font-semibold text-white">Nữ · 24 tuổi</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#1E2D42]/60 pb-1.5">
                    <span className="text-[#7D90A6]">Xuất thân:</span>
                    <span className="font-semibold text-white">Khu dân cư y tế quỹ đạo Elysia</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#1E2D42]/60 pb-1.5">
                    <span className="text-[#7D90A6]">Đào tạo:</span>
                    <span className="font-semibold text-white">Học viện Quân y Không gian</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#1E2D42]/60 pb-1.5">
                    <span className="text-[#7D90A6]">Chuyên môn:</span>
                    <span className="font-semibold text-white">Cứu hộ, hồi phục, hỗ trợ khiên</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#1E2D42]/60 pb-1.5">
                    <span className="text-[#7D90A6]">Tính cách:</span>
                    <span className="font-semibold text-white">Ấm áp, kiên trì, giàu lòng trắc ẩn</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#1E2D42]/60 pb-1.5">
                    <span className="text-[#7D90A6]">Điểm yếu:</span>
                    <span className="font-semibold text-[#F59E0B]">Khó chấp nhận bỏ lại người khác</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#7D90A6]">Ước mơ:</span>
                    <span className="font-semibold text-[#00D4FF]">Không một tín hiệu cứu hộ bị lãng quên</span>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: STORY (10 Chapters) */}
              <TabsContent value="story">
                <StoryTab character={activeCharacter} />
              </TabsContent>

              {/* Tab 3: GEAR COMPATIBILITY */}
              <TabsContent value="gear">
                <GearCompatTab character={activeCharacter} />
              </TabsContent>

              {/* Tab 4: GALLERY */}
              <TabsContent value="gallery">
                <GalleryTab
                  character={activeCharacter}
                  onSelectArtwork={(art) => onOpenArtViewer(art)}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* NÚT CHỌN NHÂN VẬT DƯỚI CÙNG (Chuẩn 100% Concept Approved PNG) */}
        <div className="p-3.5 border-t border-[#1E2D42] bg-[#0E1626]/80">
          <button
            type="button"
            onClick={() => onOpenArtViewer()}
            className="w-full py-3 px-4 rounded-xl font-mono font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 bg-gradient-to-r from-[#0088FF] via-[#00B4D8] to-[#00D4FF] text-white hover:brightness-110 active:scale-98 transition-all shadow-[0_0_20px_rgba(0,180,216,0.5)] cursor-pointer"
          >
            <span>CHỌN NHÂN VẬT</span>
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </section>
    </div>
  )
}
export default DesktopView
