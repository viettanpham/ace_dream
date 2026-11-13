'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  CharacterProfileV2,
  GalleryArtwork,
} from '@/lib/game/v2/character-profile-data'
import { OverviewTab } from './tabs/overview-tab'
import { StoryTab } from './tabs/story-tab'
import { GearCompatTab } from './tabs/gear-compat-tab'
import { GalleryTab } from './tabs/gallery-tab'
import { PilotAvatar } from './pilot-avatar'
import {
  Search,
  Maximize2,
  User,
  BookOpen,
  Cpu,
  Image as ImageIcon,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  ImageOff,
  FileArchive,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'

export type PilotProfileTabId = 'overview' | 'story' | 'gear' | 'gallery'
export type RoleFilterId = 'all' | 'attack' | 'defense' | 'support' | 'special'

interface DesktopViewProps {
  characters: CharacterProfileV2[]
  selectedCharacter: CharacterProfileV2
  onSelectCharacter: (char: CharacterProfileV2) => void
  activeTab: PilotProfileTabId
  onChangeTab: (tab: PilotProfileTabId) => void
  selectedHeroArtwork: GalleryArtwork | null
  onSelectHeroArtwork: (artwork: GalleryArtwork) => void
  onOpenViewer: (artwork: GalleryArtwork) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  roleFilter: RoleFilterId
  onRoleFilterChange: (role: RoleFilterId) => void
  isRosterCollapsed: boolean
  onToggleRosterCollapse: () => void
  heroBackgroundMode: 'contextual' | 'clean'
  onChangeHeroBackgroundMode: (mode: 'contextual' | 'clean') => void
}

export function DesktopView({
  characters,
  selectedCharacter,
  onSelectCharacter,
  activeTab,
  onChangeTab,
  selectedHeroArtwork,
  onSelectHeroArtwork,
  onOpenViewer,
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  isRosterCollapsed,
  onToggleRosterCollapse,
  heroBackgroundMode,
  onChangeHeroBackgroundMode,
}: DesktopViewProps) {
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

  const verifiedCount =
    selectedCharacter.verifiedArtworkCount ?? verifiedArtworks.length
  const totalSourceCount =
    selectedCharacter.totalSourceArtworkCount ?? selectedCharacter.artworks.length

  const tabs: { id: PilotProfileTabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'OVERVIEW', icon: <User className="w-3.5 h-3.5" /> },
    {
      id: 'story',
      label: selectedCharacter.storyAvailable
        ? `STORY (${selectedCharacter.chapters.length})`
        : 'STORY',
      icon: <BookOpen className="w-3.5 h-3.5" />,
    },
    { id: 'gear', label: 'GEAR COMPAT', icon: <Cpu className="w-3.5 h-3.5" /> },
    {
      id: 'gallery',
      label: `GALLERY (${verifiedCount}/${totalSourceCount})`,
      icon: <ImageIcon className="w-3.5 h-3.5" />,
    },
  ]

  const roleFilters: { id: RoleFilterId; label: string }[] = [
    { id: 'all', label: 'Tất Cả' },
    { id: 'support', label: 'Support' },
    { id: 'defense', label: 'Defense' },
    { id: 'attack', label: 'Attack' },
    { id: 'special', label: 'Special' },
  ]

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

  const scrollFilmstrip = (direction: 'left' | 'right') => {
    if (!filmstripRef.current) return
    const delta = direction === 'left' ? -240 : 240
    filmstripRef.current.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <div className="hidden md:flex flex-col flex-1 h-full min-h-0 w-full bg-[#070A12] text-[#F1F5F9] overflow-hidden select-none">
      {/* MAIN 3-COLUMN WORKSPACE */}
      <div
        className={`flex-1 h-full min-h-0 grid transition-all duration-300 ease-in-out overflow-hidden ${
          isRosterCollapsed
            ? 'md:grid-cols-[76px_minmax(300px,1.05fr)_minmax(420px,1.25fr)] lg:grid-cols-[80px_minmax(380px,1.08fr)_minmax(500px,1.25fr)]'
            : 'md:grid-cols-[235px_minmax(280px,1.02fr)_minmax(390px,1.22fr)] lg:grid-cols-[260px_minmax(360px,1.05fr)_minmax(470px,1.25fr)] xl:grid-cols-[280px_minmax(420px,1.08fr)_minmax(540px,1.25fr)]'
        }`}
      >
        {/* =================================================================
            CỘT TRÁI: | CHARACTER CLASS (PILOT ROSTER SELECTOR)
            ================================================================= */}
        <aside className="h-full min-h-0 flex flex-col border-r border-[#1E2D42] bg-[#080D18]/95 overflow-hidden">
          <div className="p-3 border-b border-[#1E2D42] space-y-2.5 shrink-0">
            <div className="flex items-center justify-between gap-1">
              {!isRosterCollapsed && (
                <div className="min-w-0 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-[#00D4FF]" />
                  <div>
                    <h2 className="text-xs font-mono font-black uppercase tracking-wider text-white truncate">
                      CHARACTER CLASS
                    </h2>
                    <p className="text-[10px] font-mono text-[#94A3B8] truncate">
                      {characters.length} Pilot Classes · CDN R4
                    </p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={onToggleRosterCollapse}
                aria-label={isRosterCollapsed ? 'Mở rộng danh sách phi công' : 'Thu gọn danh sách phi công'}
                title={isRosterCollapsed ? 'Mở rộng danh sách (Ctrl+B)' : 'Thu gọn danh sách (Ctrl+B)'}
                className={`p-2 rounded-lg border border-[#1E2D42] bg-[#070A12] text-[#CBD5E1] hover:text-[#00D4FF] hover:border-[#00D4FF]/60 transition-colors cursor-pointer ${
                  isRosterCollapsed ? 'mx-auto' : ''
                }`}
              >
                {isRosterCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            </div>

            {!isRosterCollapsed && (
              <>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Tìm tên, mã, vai trò..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#070A12] border border-[#1E2D42] text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#00D4FF] transition-colors"
                  />
                </div>

                <div className="flex flex-wrap gap-1">
                  {roleFilters.map((rf) => (
                    <button
                      key={rf.id}
                      type="button"
                      onClick={() => onRoleFilterChange(rf.id)}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-semibold uppercase transition-colors cursor-pointer ${
                        roleFilter === rf.id
                          ? 'bg-[#00D4FF] text-[#070A12]'
                          : 'bg-[#070A12] text-[#CBD5E1] border border-[#1E2D42] hover:text-white'
                      }`}
                    >
                      {rf.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Danh sách thẻ phi công chuẩn Concept */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2">
            {characters.map((char) => {
              const isSelected = char.id === selectedCharacter.id
              const charVerifiedCount =
                char.verifiedArtworkCount ??
                char.artworks.filter((a) => a.isAvailableOnDisk && Boolean(a.path)).length

              return (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => onSelectCharacter(char)}
                  title={`${char.classCharacterName} — ${char.role}`}
                  className={`w-full text-left rounded-xl border transition-all duration-200 cursor-pointer flex items-center relative overflow-hidden ${
                    isRosterCollapsed ? 'p-1.5 justify-center' : 'p-2 gap-3'
                  } ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#13263E] via-[#0F1E33] to-[#0B1424] border-[#00D4FF] shadow-[0_0_20px_rgba(0,212,255,0.25)]'
                      : 'bg-[#0A101D]/85 border-[#1E2D42]/80 hover:border-[#2E4666] hover:bg-[#0E1729]'
                  }`}
                >
                  {isSelected && !isRosterCollapsed && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#00D4FF]" />
                  )}

                  <PilotAvatar
                    character={char}
                    isSelected={isSelected}
                    className={isRosterCollapsed ? 'w-11 h-11 rounded-lg' : 'w-12 h-14 rounded-lg'}
                  />

                  {!isRosterCollapsed && (
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`font-bold text-sm tracking-wide truncate ${
                            isSelected ? 'text-white' : 'text-[#E2E8F0]'
                          }`}
                        >
                          {char.classCharacterName}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#070A12]/90 text-[#34D399] border border-[#1E2D42] shrink-0">
                          {charVerifiedCount}
                        </span>
                      </div>
                      <p
                        className={`text-xs truncate mt-0.5 ${
                          isSelected ? 'text-[#00D4FF] font-medium' : 'text-[#94A3B8]'
                        }`}
                      >
                        {char.role}
                      </p>
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <span className="text-[10px] font-mono text-[#64748B] truncate">
                          {char.fullLoreName}
                        </span>
                        {char.storyAvailable && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                            STORY
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </aside>

        {/* =================================================================
            CỘT GIỮA: CENTRAL HERO ARTWORK STAGE (Sân khấu trung tâm + Ambient Art + Filmstrip)
            ================================================================= */}
        <section className="relative h-full min-h-0 flex flex-col justify-between overflow-hidden border-r border-[#1E2D42] bg-[#050811]">
          {/* Artwork-derived Ambient Background (P2 Requirement #2) */}
          {heroBackgroundMode === 'contextual' ? (
            <>
              {isHeroAvailable && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <Image
                    src={heroSrc}
                    alt=""
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover object-center scale-125 blur-2xl opacity-35 saturate-150 transition-all duration-700"
                  />
                </div>
              )}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,212,255,0.14)_0%,_rgba(8,13,25,0.72)_55%,_rgba(5,8,17,0.96)_100%)] pointer-events-none" />
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #1E2D42 1px, transparent 1px), linear-gradient(to bottom, #1E2D42 1px, transparent 1px)',
                  backgroundSize: '36px 36px',
                }}
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-[#04060C] pointer-events-none" />
          )}

          {/* Top Floating Controls on Stage */}
          <div className="relative z-20 p-3.5 flex items-start justify-between gap-2 pointer-events-none">
            {/* Two Showcase Background Controls */}
            <div className="pointer-events-auto inline-flex items-center gap-1 p-1 rounded-xl bg-[#090F1C]/90 border border-[#1E2D42] backdrop-blur-md shadow-lg">
              <button
                type="button"
                onClick={() => onChangeHeroBackgroundMode('contextual')}
                className={`py-1.5 px-2.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  heroBackgroundMode === 'contextual'
                    ? 'bg-[#142338] text-[#00D4FF] border border-[#00D4FF]/50 shadow-sm'
                    : 'text-[#CBD5E1] hover:text-white border border-transparent'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>Bối Cảnh</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeHeroBackgroundMode('clean')}
                className={`py-1.5 px-2.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  heroBackgroundMode === 'clean'
                    ? 'bg-[#142338] text-[#00D4FF] border border-[#00D4FF]/50 shadow-sm'
                    : 'text-[#CBD5E1] hover:text-white border border-transparent'
                }`}
              >
                <ImageOff className="w-3.5 h-3.5 shrink-0" />
                <span>Tách Nền</span>
              </button>
            </div>

            {isHeroAvailable && (
              <button
                type="button"
                onClick={handleOpenHeroInViewer}
                aria-label="Phóng to Artwork toàn màn hình"
                className="pointer-events-auto px-3 py-2 rounded-xl bg-[#090F1C]/90 hover:bg-[#142338] border border-[#1E2D42] hover:border-[#00D4FF] text-xs font-mono font-bold text-[#F1F5F9] hover:text-[#00D4FF] flex items-center gap-1.5 backdrop-blur-md shadow-lg transition-all cursor-pointer active:scale-95"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span>Full Screen</span>
              </button>
            )}
          </div>

          {/* Center Character Portrait / Fullbody Artwork (100% Complete Foreground Preserved) */}
          <div className="relative z-10 flex-1 w-full min-h-0 flex items-center justify-center px-3 py-1 overflow-hidden">
            {isHeroAvailable ? (
              <div
                onClick={handleOpenHeroInViewer}
                className="relative w-full h-full flex items-center justify-center cursor-zoom-in group"
              >
                <Image
                  src={heroSrc}
                  alt={selectedCharacter.classCharacterName}
                  fill
                  priority
                  referrerPolicy="no-referrer"
                  className="object-contain object-center group-hover:scale-[1.02] transition-transform duration-500 drop-shadow-[0_20px_45px_rgba(0,0,0,0.9)]"
                  onError={() => setHeroImgError(true)}
                />
              </div>
            ) : (
              <div className="max-w-xs text-center p-6 rounded-2xl bg-[#0B111E]/90 border border-[#1E2D42] backdrop-blur-md space-y-2.5">
                <div className="w-12 h-12 mx-auto rounded-xl bg-[#142338] border border-[#1E2D42] flex items-center justify-center text-[#F59E0B]">
                  <FileArchive className="w-6 h-6" />
                </div>
                <div className="text-sm font-mono font-bold text-white">
                  {selectedCharacter.classCharacterName}
                </div>
                <p className="text-xs text-[#CBD5E1] leading-relaxed">
                  Đang chờ đồng bộ tệp ảnh WebP VERIFIED trên kênh release CDN.
                </p>
              </div>
            )}

            {/* Floating Quote Overlay on Stage (Matches Approved Desktop Concept) */}
            {selectedCharacter.characterQuote && (
              <div className="hidden xl:block absolute bottom-3 left-3 right-3 pointer-events-none">
                <div className="px-3.5 py-2 rounded-xl bg-[#070A12]/80 backdrop-blur-md border border-[#1E2D42]/90 text-xs italic text-[#E2E8F0] line-clamp-2 shadow-lg">
                  &ldquo;{selectedCharacter.characterQuote}&rdquo;
                </div>
              </div>
            )}
          </div>

          {/* Bottom Stage Thumbnail Filmstrip (< [Thumb 1] [Thumb 2] [Thumb 3] [Thumb 4] >) */}
          <div className="relative z-20 p-3 bg-gradient-to-t from-[#050811] via-[#070B16]/95 to-transparent border-t border-[#1E2D42]/70 shrink-0">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8]">
                SHOWCASE POSES & OUTFITS ({verifiedArtworks.length} VERIFIED)
              </span>
              {selectedHeroArtwork && (
                <span className="text-[10px] font-mono text-[#00D4FF] truncate max-w-[180px]">
                  {selectedHeroArtwork.title}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollFilmstrip('left')}
                aria-label="Cuộn danh sách ảnh sang trái"
                className="w-7 h-14 rounded-lg bg-[#0B111E] hover:bg-[#142338] border border-[#1E2D42] hover:border-[#00D4FF] text-[#CBD5E1] hover:text-[#00D4FF] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
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
                      onClick={() => onSelectHeroArtwork(art)}
                      onDoubleClick={() => onOpenViewer(art)}
                      title={`${art.title} (Nhấp đúp để phóng to)`}
                      className={`relative w-14 h-14 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer group ${
                        isActive
                          ? 'border-[#00D4FF] ring-2 ring-[#00D4FF]/40 scale-105'
                          : 'border-[#1E2D42] opacity-75 hover:opacity-100 hover:border-[#38BDF8]'
                      }`}
                    >
                      <Image
                        src={art.path}
                        alt={art.title}
                        fill
                        sizes="56px"
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
                aria-label="Cuộn danh sách ảnh sang phải"
                className="w-7 h-14 rounded-lg bg-[#0B111E] hover:bg-[#142338] border border-[#1E2D42] hover:border-[#00D4FF] text-[#CBD5E1] hover:text-[#00D4FF] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* =================================================================
            CỘT PHẢI: DOSSIER HEADER + 4 TABS (OVERVIEW | STORY | GEAR COMPAT | GALLERY)
            ================================================================= */}
        <section className="h-full min-h-0 flex flex-col bg-[#080D18]/95 overflow-hidden">
          {/* DOSSIER IDENTITY HEADER (Matches Approved Desktop Concept Top-Right Header) */}
          <div className="px-5 pt-4 pb-3 border-b border-[#1E2D42] bg-gradient-to-r from-[#0B1324] via-[#09101E] to-[#0B1324] shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-[#00D4FF]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>PILOT CLASS // FND-8 V2</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-2.5 mt-0.5">
                  <h1 className="text-2xl lg:text-3xl font-black tracking-wide text-white uppercase">
                    {selectedCharacter.classCharacterName}
                  </h1>
                  <span className="text-xs lg:text-sm font-mono text-[#CBD5E1]">
                    ({selectedCharacter.fullLoreName})
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                  <span className="font-semibold text-[#00D4FF]">
                    {selectedCharacter.role}
                  </span>
                  {selectedCharacter.callsign && (
                    <>
                      <span className="text-[#475569]">•</span>
                      <span className="text-[#94A3B8] italic">
                        Biệt hiệu: {selectedCharacter.callsign}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Unit / Persona Badge Box */}
              <div className="shrink-0 flex flex-col items-end gap-1.5">
                <div className="px-3 py-1.5 rounded-xl bg-[#070A12] border border-[#00D4FF]/40 flex items-center gap-2 shadow-[0_0_15px_rgba(0,212,255,0.15)]">
                  <ShieldCheck className="w-4 h-4 text-[#00D4FF]" />
                  <div className="text-right">
                    <div className="text-[10px] font-mono uppercase text-[#94A3B8] leading-none">
                      PERSONA
                    </div>
                    <div className="text-xs font-mono font-black text-white leading-tight">
                      {selectedCharacter.personaCode || 'PILOT'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#34D399] bg-[#34D399]/10 px-2 py-0.5 rounded border border-[#34D399]/30">
                  {verifiedCount}/{totalSourceCount} Verified WebP
                </span>
              </div>
            </div>

            {/* 4 Canonical Dossier Tabs */}
            <div
              role="tablist"
              aria-label="Hồ sơ chi tiết phi công"
              className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#060911] border border-[#1E2D42] mt-3.5"
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => onChangeTab(tab.id)}
                    className={`py-2 px-2 rounded-lg font-mono text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#142338] text-[#00D4FF] border border-[#00D4FF]/60 shadow-[0_0_12px_rgba(0,212,255,0.2)]'
                        : 'text-[#CBD5E1] hover:text-white hover:bg-[#142338]/40 border border-transparent'
                    }`}
                  >
                    {tab.icon}
                    <span className="truncate">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Panel Content (Scrollable) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6 select-text">
            {activeTab === 'overview' && (
              <OverviewTab
                character={selectedCharacter}
                onOpenViewer={onOpenViewer}
                onSelectHeroArtwork={onSelectHeroArtwork}
                onSwitchToGalleryTab={() => onChangeTab('gallery')}
              />
            )}
            {activeTab === 'story' && <StoryTab character={selectedCharacter} />}
            {activeTab === 'gear' && <GearCompatTab character={selectedCharacter} />}
            {activeTab === 'gallery' && (
              <GalleryTab
                character={selectedCharacter}
                selectedHeroArtwork={selectedHeroArtwork}
                onSelectHeroArtwork={onSelectHeroArtwork}
                onOpenViewer={onOpenViewer}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default DesktopView
