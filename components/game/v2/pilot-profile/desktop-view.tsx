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
import { PilotAvatar } from './pilot-avatar'
import { loadV2UIPreferences, saveV2UIPreferences } from '@/lib/game/v2/ui-preferences'
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
  VideoOff,
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
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
  // Pilot Roster Mode: 'mini' (72px) vs 'full' (260px)
  const [rosterMode, setRosterMode] = useState<'mini' | 'full'>('mini')
  const [mainImageError, setMainImageError] = useState<boolean>(false)
  const [carouselIndex, setCarouselIndex] = useState<number>(0)
  const [selectedArtwork, setSelectedArtwork] = useState<GalleryArtwork | null>(null)
  const [showTrailerNotice, setShowTrailerNotice] = useState<boolean>(false)

  // Load saved roster mode from preferences on mount
  useEffect(() => {
    const prefs = loadV2UIPreferences()
    setRosterMode(prefs.pilotRosterMode || 'mini')
  }, [])

  const toggleRosterMode = () => {
    const nextMode = rosterMode === 'mini' ? 'full' : 'mini'
    setRosterMode(nextMode)
    saveV2UIPreferences({ pilotRosterMode: nextMode })
  }

  // Reset khi đổi phi công
  useEffect(() => {
    setMainImageError(false)
    setCarouselIndex(0)
    setSelectedArtwork(null)
    setShowTrailerNotice(false)
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
    <div className="w-full h-full min-h-[640px] flex gap-3 p-3 lg:p-3.5 bg-[#070A12] text-[#F1F5F9] overflow-hidden select-none">
      {/* =========================================================================
          CỘT 1 (TRÁI): CHARACTER CLASS ROSTER (12 Pilot Canonical - 2 Mode Độc Lập)
          ========================================================================= */}
      <aside
        className={`flex flex-col h-full rounded-2xl bg-[#090D18]/95 border border-[#1E2D42] overflow-hidden shadow-2xl shrink-0 backdrop-blur-md transition-all duration-300 ease-in-out ${
          rosterMode === 'full' ? 'w-[260px]' : 'w-[72px]'
        }`}
      >
        {/* Header Cột: | PHI CÔNG HỆ THỐNG (Full) hoặc Icon + Nút Mở Rộng (Mini) */}
        <div className="p-2.5 border-b border-[#1E2D42] bg-[#0E1626]/80 flex items-center justify-between min-h-[48px]">
          {rosterMode === 'full' ? (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-1 h-3.5 bg-[#00D4FF] rounded-full shadow-[0_0_8px_#00D4FF]" />
                <h2 className="text-xs font-black uppercase tracking-wider text-white font-mono truncate">
                  PHI CÔNG HỆ THỐNG
                </h2>
                <span className="text-[10px] font-mono font-bold text-[#00D4FF] bg-[#00D4FF]/10 px-1.5 py-0.5 rounded border border-[#00D4FF]/30">
                  {roster.length}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleRosterMode}
                title="Thu gọn danh sách phi công (MINI 72px)"
                className="p-1 rounded-md border border-[#1E2D42] bg-[#0E1626] text-[#A7B6C8] hover:text-[#00D4FF] hover:border-[#00D4FF] transition-all cursor-pointer"
              >
                <PanelLeftClose className="w-4 h-4 text-[#00D4FF]" />
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[#00D4FF] bg-[#00D4FF]/10 px-1 py-0.5 rounded border border-[#00D4FF]/30">
                {roster.length}
              </span>
              <button
                type="button"
                onClick={toggleRosterMode}
                title="Mở rộng danh sách phi công (FULL 260px)"
                className="p-1 rounded-md border border-[#1E2D42] bg-[#0E1626] text-[#A7B6C8] hover:text-[#00D4FF] hover:border-[#00D4FF] transition-all cursor-pointer"
              >
                <PanelLeftOpen className="w-4 h-4 text-[#00D4FF]" />
              </button>
            </div>
          )}
        </div>

        {/* Danh sách 12 Pilot - Dùng PilotAvatar chuẩn, không fallback sai */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5 scrollbar-thin scrollbar-thumb-[#1E2D42]">
          {roster.map((char) => {
            const isSelected = char.id === activeCharacter.id

            return (
              <div
                key={char.id}
                onClick={() => onSelectCharacter(char)}
                title={`${char.classCharacterName} — ${char.role}`}
                className={`group relative rounded-xl border transition-all duration-200 cursor-pointer flex items-center ${
                  rosterMode === 'full' ? 'p-2 gap-2.5' : 'p-1.5 justify-center'
                } ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#142338] via-[#102035] to-[#0D1828] border-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.25)] ring-1 ring-[#00D4FF]/60'
                    : 'bg-[#0B111E]/70 border-[#1A2638] hover:border-[#2C415E] hover:bg-[#101A2B]'
                }`}
              >
                {/* Avatar Roster Chuyên Biệt Cho Từng Pilot */}
                <div className="relative">
                  <PilotAvatar
                    character={char}
                    isSelected={isSelected}
                    className="w-12 h-10 shrink-0"
                  />
                  {/* Chấm chỉ báo active khi ở mode mini */}
                  {isSelected && rosterMode === 'mini' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#00D4FF] shadow-[0_0_6px_#00D4FF] ring-2 ring-[#070A12]" />
                  )}
                </div>

                {/* Thông tin: Tên Pilot & Vai Trò (Chỉ hiện khi FULL mode) */}
                {rosterMode === 'full' && (
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
                      className={`text-[10px] truncate mt-0.5 ${
                        isSelected ? 'text-[#00D4FF] font-semibold' : 'text-[#7D90A6]'
                      }`}
                    >
                      {char.role}
                    </p>
                  </div>
                )}

                {/* Active Indicator Bar khi FULL mode */}
                {isSelected && rosterMode === 'full' && (
                  <div className="w-1 h-5 bg-[#00D4FF] rounded-full shadow-[0_0_8px_#00D4FF] shrink-0" />
                )}
              </div>
            )
          })}
        </div>

        {/* Cuộn danh sách hint */}
        <div className="p-1 border-t border-[#1E2D42] bg-[#0A0F1A]/80 flex justify-center text-[#7D90A6]">
          <ChevronDown className="w-3.5 h-3.5 text-[#00D4FF]/70" />
        </div>
      </aside>

      {/* =========================================================================
          CỘT 2 (GIỮA): CENTER VISUAL STAGE (Visual Hero Hoành Tráng Liền Mạch)
          ========================================================================= */}
      <section className="flex-1 min-w-[340px] h-full relative rounded-2xl bg-[#090D18]/95 border border-[#1E2D42] overflow-hidden shadow-2xl flex flex-col justify-between">
        {/* Background Visual Layers: Bầu Trời Sao, Trạm Quỹ Đạo & Hành Tinh Xanh */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
            backgroundMode === 'tactical'
              ? 'opacity-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/60 via-[#070A12] to-[#070A12]'
              : 'opacity-100 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-[#090D18] to-[#070A12]'
          }`}
        />

        {/* Họa tiết ánh sáng trạm vũ trụ tinh xảo */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#00d4ff15_1px,transparent_1px)] [background-size:20px_20px]" />

        {/* Tactical HUD Overlay khi bật chế độ Radar */}
        {backgroundMode === 'tactical' && (
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#00d4ff0d_1px,transparent_1px),linear-gradient(to_bottom,#00d4ff0d_1px,transparent_1px)] bg-[size:32px_32px] z-10">
            <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-[#00D4FF] px-3.5 py-1.5 rounded-lg bg-[#070A12]/90 border border-[#00D4FF]/40 backdrop-blur-md shadow-lg">
              <span className="flex items-center gap-2">
                <Radar className="w-3.5 h-3.5 animate-spin text-[#00D4FF]" />
                <span className="font-bold tracking-wider">TACTICAL HUD // RADAR GRID ONLINE</span>
              </span>
              <span className="text-[#A7B6C8]">BIO-STATUS: 100% NOMINAL</span>
            </div>
          </div>
        )}

        {/* 1. KHU VỰC TRUNG TÂM: VISUAL HERO ARTWORK & QUOTE BÊN TRÁI */}
        <div className="relative flex-1 flex items-center justify-center z-10 overflow-hidden w-full h-full">
          {/* Quote Chữ Nghiêng Bay Bổng Bên Trái Artwork (Có background tương phản an toàn) */}
          <div className="absolute left-6 top-1/4 z-20 max-w-[260px] pointer-events-none hidden xl:block">
            <div className="p-3 rounded-xl bg-black/40 border-l-2 border-[#00D4FF] backdrop-blur-xs">
              <p className="text-sm lg:text-base italic font-serif text-white/95 leading-relaxed tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                "{activeCharacter.characterQuote}"
              </p>
            </div>
          </div>

          {/* Visual Hero Nhân Vật Lớn (Toàn màn hình sân khấu, không còn khung chữ nhật nhỏ) */}
          <div className="relative w-full h-full flex items-end justify-center pb-2">
            {!mainImageError ? (
              <div className="relative w-full h-full flex items-end justify-center">
                <Image
                  src={resolveImageUrl(currentDisplayImage)}
                  alt={activeCharacter.classCharacterName}
                  fill
                  priority
                  referrerPolicy="no-referrer"
                  className="object-contain object-bottom drop-shadow-[0_25px_50px_rgba(0,0,0,0.9)] filter hover:brightness-105 transition-all duration-300"
                  onError={() => setMainImageError(true)}
                />
                {/* Lớp bóng mờ nhẹ nhàng ở chân giúp nhân vật hòa vào sàn trạm không gian */}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#090D18] via-[#090D18]/70 to-transparent pointer-events-none" />
              </div>
            ) : (
              <div className="max-w-sm text-center p-8 rounded-2xl bg-[#0B111E]/95 border border-[#1E2D42] shadow-2xl space-y-3 mb-12">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#142338] border border-[#1E2D42] flex items-center justify-center text-[#F59E0B]">
                  <Sparkles className="w-7 h-7" />
                </div>
                <p className="text-xs font-mono text-[#F59E0B] font-bold uppercase tracking-wider">
                  CONCEPT APPROVED // ART PENDING
                </p>
                <h4 className="text-lg font-bold text-white font-mono">{activeCharacter.classCharacterName}</h4>
                <p className="text-xs text-[#A7B6C8] leading-relaxed">
                  Artwork toàn thân độ phân giải cao của phi công này đang được số hóa đóng gói cho bản phát hành FND-8.
                </p>
              </div>
            )}
          </div>

          {/* HAI ĐIỀU KHIỂN BỐI CẢNH ĐỐI XỨNG HAI BÊN HÔNG NHÂN VẬT */}
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

        {/* 2. DƯỚI CHÂN SÂN KHẤU: TRAILER PREVIEW & CAROUSEL THUMBNAILS NHỎ GỌN */}
        <div className="relative z-20 px-3.5 py-2.5 border-t border-[#1E2D42] bg-[#0A0F1A]/95 backdrop-blur-md flex items-center justify-between gap-3">
          {/* Card Bên Trái: CHARACTER TRAILER (Trạng Thái Thật: Sắp Ra Mắt) */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowTrailerNotice(!showTrailerNotice)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#101A2B] border border-[#1E2D42] hover:border-[#00D4FF] hover:bg-[#142338] transition-all cursor-pointer group shadow-sm"
              title="Thông tin Character Trailer"
            >
              <div className="relative w-10 h-7 rounded overflow-hidden bg-black/60 border border-[#1E2D42] shrink-0 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-[#00D4FF] fill-[#00D4FF]/40 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-white group-hover:text-[#00D4FF] transition-colors flex items-center gap-1">
                  <span>CHARACTER TRAILER</span>
                  <span className="text-[9px] text-[#F59E0B] font-mono bg-[#F59E0B]/10 px-1 rounded border border-[#F59E0B]/30">
                    SẮP CÓ
                  </span>
                </div>
                <span className="text-[9px] font-mono text-[#7D90A6]">HD MEDIA SPOTLIGHT</span>
              </div>
            </button>

            {/* Popover thông báo trailer */}
            {showTrailerNotice && (
              <div className="absolute left-0 bottom-12 z-50 w-64 p-3 rounded-xl bg-[#090D18] border border-[#1E2D42] shadow-2xl space-y-1.5 text-xs text-[#CBD5E1]">
                <div className="flex items-center justify-between text-[#00D4FF] font-mono font-bold text-[11px]">
                  <span>TRAILER MEDIA</span>
                  <button onClick={() => setShowTrailerNotice(false)} className="text-[#A7B6C8] hover:text-white">✕</button>
                </div>
                <p className="text-[11px] text-[#A7B6C8] leading-relaxed">
                  Trailer giới thiệu cinematic và lồng tiếng của phi công <strong>{activeCharacter.classCharacterName}</strong> đang trong quá trình hậu kỳ cho phiên bản FND-8.
                </p>
              </div>
            )}
          </div>

          {/* Dải Carousel Thumbnail Nhỏ Gọn Bên Phải */}
          <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
            {/* Nút Prev Carousel */}
            <button
              type="button"
              onClick={handlePrevCarousel}
              disabled={carouselIndex === 0}
              aria-label="Hình ảnh trước"
              className={`p-1 rounded-lg border transition-all ${
                carouselIndex === 0
                  ? 'border-[#1E2D42]/40 text-[#475569] cursor-not-allowed'
                  : 'border-[#1E2D42] text-[#A7B6C8] hover:text-[#00D4FF] hover:border-[#00D4FF] cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Thumbnails strip (4 ảnh ngang) */}
            <div className="flex items-center gap-1.5 overflow-hidden">
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
                    className={`relative w-14 h-10 lg:w-16 lg:h-11 rounded-lg overflow-hidden border transition-all cursor-pointer shrink-0 ${
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
              className={`p-1 rounded-lg border transition-all ${
                carouselIndex >= maxCarouselPages
                  ? 'border-[#1E2D42]/40 text-[#475569] cursor-not-allowed'
                  : 'border-[#1E2D42] text-[#A7B6C8] hover:text-[#00D4FF] hover:border-[#00D4FF] cursor-pointer'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Nút Phóng To Immersive Viewer */}
            <button
              type="button"
              onClick={() => onOpenArtViewer(selectedArtwork || undefined)}
              className="p-1.5 rounded-lg border border-[#1E2D42] hover:border-[#00D4FF] text-[#A7B6C8] hover:text-[#00D4FF] bg-[#101A2B] transition-colors ml-1 cursor-pointer"
              title="Phóng to toàn màn hình (Immersive Viewer)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CỘT 3 (PHẢI): PROFILE DOSSIER & ATTRIBUTES (Typography Chuẩn Thiết Kế)
          ========================================================================= */}
      <section className="w-[390px] lg:w-[410px] xl:w-[430px] h-full flex flex-col rounded-2xl bg-[#090D18]/95 border border-[#1E2D42] overflow-hidden shadow-2xl shrink-0 backdrop-blur-md">
        {/* Header Profile: Tên 30px+, Title, Vai Trò và Logo UME CORPS */}
        <div className="p-4 border-b border-[#1E2D42] bg-[#0E1626]/75">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#00D4FF] uppercase tracking-wider">
                <span>❖ CLASS PILOT</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight mt-1 font-mono">
                {activeCharacter.classCharacterName}
              </h1>
              <div className="text-sm font-semibold text-[#CBD5E1] mt-0.5">
                {activeCharacter.title}
              </div>
              <div className="text-xs font-mono font-bold text-[#00D4FF] mt-1">
                {activeCharacter.role}
              </div>
            </div>

            {/* Logo Faction / Corps (UME MEDICAL CORPS chuẩn Concept) */}
            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#0A0F1A] border border-[#1E2D42] shrink-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00D4FF]/10 text-[#00D4FF]">
                <Shield className="w-4 h-4 text-[#00D4FF]" />
              </div>
              <span className="text-[9px] font-mono font-black text-[#A7B6C8] uppercase tracking-wider mt-1">
                UME CORPS
              </span>
            </div>
          </div>

          {/* Hàng 3 Badges Nổi Bật: Medic (Xanh Lá), Rescue (Xanh Cyan), SHD+ENE (Tím) */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40">
              <Heart className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Medic</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/40">
              <Shield className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>Rescue</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/40">
              <Zap className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>SHD + ENE</span>
            </span>
          </div>

          {/* Đoạn mô tả ngắn (Short Description: 15-16px, dễ đọc) */}
          <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed mt-3">
            {activeCharacter.shortDescription}
          </p>
        </div>

        {/* Nội Dung Cuộn Tách Bạch: Base Attributes, Traits, và Tabs Chi Tiết */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#1E2D42] min-h-0">
          {/* SECTION: | BASE ATTRIBUTES (6 Thanh Đo Màu Sắc) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-[#00D4FF] rounded-full shadow-[0_0_8px_#00D4FF]" />
              <h3 className="text-sm font-black uppercase font-mono tracking-wider text-white">
                BASE ATTRIBUTES
              </h3>
            </div>

            {/* Grid 2 cột cho 6 chỉ số: ATK, DEF, AGI bên trái; ENE, SHD, LUK bên phải */}
            <div className="grid grid-cols-2 gap-x-3.5 gap-y-2.5 p-3 rounded-xl bg-[#0B111E]/80 border border-[#1E2D42] font-mono text-xs">
              {/* ATK - Đỏ */}
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[#EF4444] font-bold flex items-center gap-1 text-xs">
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>ATK</span>
                </span>
                <div className="flex-1 h-2.5 bg-[#1A2638] rounded-full overflow-hidden mx-1.5">
                  <div
                    className="h-full bg-[#EF4444] rounded-full shadow-[0_0_6px_#EF4444]"
                    style={{ width: `${(activeCharacter.baseAttributes.atk / 10) * 100}%` }}
                  />
                </div>
                <span className="text-white font-bold w-4 text-right text-xs">{activeCharacter.baseAttributes.atk}</span>
              </div>

              {/* ENE - Vàng Cam */}
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[#F59E0B] font-bold flex items-center gap-1 text-xs">
                  <Zap className="w-3.5 h-3.5" />
                  <span>ENE</span>
                </span>
                <div className="flex-1 h-2.5 bg-[#1A2638] rounded-full overflow-hidden mx-1.5">
                  <div
                    className="h-full bg-[#F59E0B] rounded-full shadow-[0_0_6px_#F59E0B]"
                    style={{ width: `${(activeCharacter.baseAttributes.ene / 10) * 100}%` }}
                  />
                </div>
                <span className="text-white font-bold w-4 text-right text-xs">{activeCharacter.baseAttributes.ene}</span>
              </div>

              {/* DEF - Xanh Dương */}
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[#3B82F6] font-bold flex items-center gap-1 text-xs">
                  <Shield className="w-3.5 h-3.5" />
                  <span>DEF</span>
                </span>
                <div className="flex-1 h-2.5 bg-[#1A2638] rounded-full overflow-hidden mx-1.5">
                  <div
                    className="h-full bg-[#3B82F6] rounded-full shadow-[0_0_6px_#3B82F6]"
                    style={{ width: `${(activeCharacter.baseAttributes.def / 10) * 100}%` }}
                  />
                </div>
                <span className="text-white font-bold w-4 text-right text-xs">{activeCharacter.baseAttributes.def}</span>
              </div>

              {/* SHD - Tím */}
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[#8B5CF6] font-bold flex items-center gap-1 text-xs">
                  <Shield className="w-3.5 h-3.5" />
                  <span>SHD</span>
                </span>
                <div className="flex-1 h-2.5 bg-[#1A2638] rounded-full overflow-hidden mx-1.5">
                  <div
                    className="h-full bg-[#8B5CF6] rounded-full shadow-[0_0_6px_#8B5CF6]"
                    style={{ width: `${(activeCharacter.baseAttributes.shd / 10) * 100}%` }}
                  />
                </div>
                <span className="text-white font-bold w-4 text-right text-xs">{activeCharacter.baseAttributes.shd}</span>
              </div>

              {/* AGI - Xanh Lục */}
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[#10B981] font-bold flex items-center gap-1 text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AGI</span>
                </span>
                <div className="flex-1 h-2.5 bg-[#1A2638] rounded-full overflow-hidden mx-1.5">
                  <div
                    className="h-full bg-[#10B981] rounded-full shadow-[0_0_6px_#10B981]"
                    style={{ width: `${(activeCharacter.baseAttributes.agi / 10) * 100}%` }}
                  />
                </div>
                <span className="text-white font-bold w-4 text-right text-xs">{activeCharacter.baseAttributes.agi}</span>
              </div>

              {/* LUK - Hồng Tím */}
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[#EC4899] font-bold flex items-center gap-1 text-xs">
                  <Award className="w-3.5 h-3.5" />
                  <span>LUK</span>
                </span>
                <div className="flex-1 h-2.5 bg-[#1A2638] rounded-full overflow-hidden mx-1.5">
                  <div
                    className="h-full bg-[#EC4899] rounded-full shadow-[0_0_6px_#EC4899]"
                    style={{ width: `${(activeCharacter.baseAttributes.luk / 10) * 100}%` }}
                  />
                </div>
                <span className="text-white font-bold w-4 text-right text-xs">{activeCharacter.baseAttributes.luk}</span>
              </div>
            </div>
          </div>

          {/* SECTION: | TRAITS (2 Ô Card Song Song - Không Cắt Ellipsis Tên Trait) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-[#00D4FF] rounded-full shadow-[0_0_8px_#00D4FF]" />
              <h3 className="text-sm font-black uppercase font-mono tracking-wider text-white">
                TRAITS & THIÊN PHÚ
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Trait 1 */}
              <div className="p-3 rounded-xl bg-[#0B111E]/80 border border-[#10B981]/40 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0 mt-0.5">
                  <Heart className="w-4 h-4 text-[#10B981]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white font-mono break-words leading-tight">
                      {activeCharacter.traits[0]?.name || 'Bàn Tay Cứu Hộ'}
                    </span>
                    <span className="text-[9px] font-mono text-[#10B981] uppercase font-bold shrink-0">
                      Passive
                    </span>
                  </div>
                  <p className="text-xs text-[#CBD5E1] mt-1 leading-snug">
                    {activeCharacter.traits[0]?.description || '+30% hiệu quả hồi phục Medic'}
                  </p>
                </div>
              </div>

              {/* Trait 2 */}
              <div className="p-3 rounded-xl bg-[#0B111E]/80 border border-[#00D4FF]/40 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#00D4FF]/15 text-[#00D4FF] flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-4 h-4 text-[#00D4FF]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white font-mono break-words leading-tight">
                      {activeCharacter.traits[1]?.name || 'Mái Khiên Nhân Ái'}
                    </span>
                    <span className="text-[9px] font-mono text-[#00D4FF] uppercase font-bold shrink-0">
                      Passive
                    </span>
                  </div>
                  <p className="text-xs text-[#CBD5E1] mt-1 leading-snug">
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

              {/* Tab 1: THÔNG TIN CƠ BẢN */}
              <TabsContent value="overview">
                <div className="rounded-xl bg-[#0B111E]/85 border border-[#1E2D42] p-3.5 text-sm space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#1E2D42]/60 pb-2">
                    <span className="text-[#7D90A6] font-medium">Giới tính / Tuổi:</span>
                    <span className="font-semibold text-white">Nữ · 24 tuổi</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#1E2D42]/60 pb-2">
                    <span className="text-[#7D90A6] font-medium">Xuất thân:</span>
                    <span className="font-semibold text-white">Khu dân cư y tế quỹ đạo Elysia</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#1E2D42]/60 pb-2">
                    <span className="text-[#7D90A6] font-medium">Đào tạo:</span>
                    <span className="font-semibold text-white">Học viện Quân y Không gian</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#1E2D42]/60 pb-2">
                    <span className="text-[#7D90A6] font-medium">Chuyên môn:</span>
                    <span className="font-semibold text-white">Cứu hộ, hồi phục, hỗ trợ khiên</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#1E2D42]/60 pb-2">
                    <span className="text-[#7D90A6] font-medium">Tính cách:</span>
                    <span className="font-semibold text-white">Ấm áp, kiên trì, giàu lòng trắc ẩn</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#1E2D42]/60 pb-2">
                    <span className="text-[#7D90A6] font-medium">Điểm yếu:</span>
                    <span className="font-semibold text-[#F59E0B]">Khó chấp nhận bỏ lại người khác</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#7D90A6] font-medium">Ước mơ:</span>
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

        {/* CONTEXTUAL FOOTER THEO TỪNG TAB (Chuẩn Yêu Cầu Của Chủ Dự Án) */}
        {activeTab === 'gallery' && (
          <div className="p-3.5 border-t border-[#1E2D42] bg-[#0E1626]/95 shrink-0 flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-bold text-[#7D90A6] uppercase tracking-wider">
                BỘ SƯU TẬP
              </span>
              <span className="text-xs font-mono font-bold text-[#00D4FF]">
                {activeCharacter.artworks.filter((a) => a.isAvailableOnDisk).length} ẢNH KHẢ DỤNG
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const firstAvailable =
                  activeCharacter.artworks.find((a) => a.isAvailableOnDisk) ||
                  activeCharacter.artworks[0]
                onOpenArtViewer(firstAvailable)
              }}
              className="py-2.5 px-4 rounded-xl font-mono font-bold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 bg-gradient-to-r from-[#0088FF] via-[#00B4D8] to-[#00D4FF] text-white hover:brightness-110 active:scale-98 transition-all shadow-[0_0_15px_rgba(0,180,216,0.4)] cursor-pointer"
            >
              <Maximize2 className="w-4 h-4 text-white" />
              <span>XEM TOÀN BỘ {activeCharacter.artworks.filter((a) => a.isAvailableOnDisk).length} ẢNH</span>
            </button>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="p-3 border-t border-[#1E2D42] bg-[#0E1626]/95 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-xs font-mono text-[#A7B6C8]">
                TRẠNG THÁI: <span className="text-white font-bold">SẴN SÀNG ĐIỀU ĐỘNG</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenArtViewer(selectedArtwork || undefined)}
              className="py-2 px-3.5 rounded-lg border border-[#00D4FF]/40 bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 text-[#00D4FF] font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>SOI TRANH HD</span>
            </button>
          </div>
        )}

        {/* Tab 'story' và 'gear' HOÀN TOÀN KHÔNG render footer để nhường 100% diện tích cuộn */}
      </section>
    </div>
  )
}
export default DesktopView
