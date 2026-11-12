'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  CharacterProfileV2,
  GalleryArtwork,
  ATTRIBUTE_COLOR_CONFIG,
  BaseAttributes,
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

  const heroSrc =
    selectedHeroArtwork?.isAvailableOnDisk && selectedHeroArtwork.path
      ? selectedHeroArtwork.path
      : selectedCharacter.fullbodyAssetPath || ''

  const isHeroAvailable = Boolean(heroSrc) && !heroImgError

  useEffect(() => {
    setHeroImgError(false)
  }, [heroSrc, selectedCharacter.id])

  const attributeKeys: (keyof BaseAttributes)[] = ['atk', 'def', 'agi', 'ene', 'shd', 'luk']

  const verifiedCount =
    selectedCharacter.verifiedArtworkCount ??
    selectedCharacter.artworks.filter((a) => a.isAvailableOnDisk && Boolean(a.path)).length
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
    <div className="hidden md:flex flex-col flex-1 h-full min-h-0 w-full bg-[#070A12] text-[#F1F5F9] overflow-hidden select-none">
      {/* MAIN 3-COLUMN WORKSPACE (Fills remaining height completely, eliminating bottom black bar) */}
      <div
        className={`flex-1 h-full min-h-0 grid transition-all duration-300 ease-in-out overflow-hidden ${
          isRosterCollapsed
            ? 'md:grid-cols-[76px_minmax(280px,1fr)_minmax(420px,1.25fr)] lg:grid-cols-[80px_minmax(380px,1fr)_minmax(500px,1.25fr)]'
            : 'md:grid-cols-[240px_minmax(260px,1fr)_minmax(380px,1.2fr)] lg:grid-cols-[270px_minmax(340px,1fr)_minmax(460px,1.2fr)] xl:grid-cols-[290px_minmax(400px,1fr)_minmax(520px,1.25fr)]'
        }`}
      >
        {/* =================================================================
            CỘT TRÁI: PILOT ROSTER SELECTOR (Động từ profiles/index.json)
            ================================================================= */}
        <aside className="h-full min-h-0 flex flex-col border-r border-[#1E2D42] bg-[#0B111E]/95 overflow-hidden">
          <div className="p-3 border-b border-[#1E2D42] space-y-2.5 shrink-0">
            <div className="flex items-center justify-between gap-1">
              {!isRosterCollapsed && (
                <div className="min-w-0">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#00D4FF] truncate">
                    DANH SÁCH PHI CÔNG
                  </h2>
                  <p className="text-[11px] text-[#94A3B8] truncate">
                    {characters.length} Pilot trong manifest CDN
                  </p>
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

          {/* Danh sách thẻ phi công */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5">
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
                  className={`w-full text-left rounded-xl border transition-all duration-200 cursor-pointer flex items-center ${
                    isRosterCollapsed ? 'p-1.5 justify-center' : 'p-2.5 gap-3'
                  } ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#142338] to-[#0E1626] border-[#00D4FF] shadow-[0_0_20px_rgba(0,212,255,0.2)]'
                      : 'bg-[#070A12]/70 border-[#1E2D42]/80 hover:border-[#26384D] hover:bg-[#0E1626]/70'
                  }`}
                >
                  <PilotAvatar
                    character={char}
                    isSelected={isSelected}
                    className={isRosterCollapsed ? 'w-11 h-11' : 'w-12 h-12'}
                  />

                  {!isRosterCollapsed && (
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`font-mono font-black text-xs tracking-wide truncate ${
                            isSelected ? 'text-[#00D4FF]' : 'text-white'
                          }`}
                        >
                          {char.classCharacterName}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#070A12] text-[#34D399] border border-[#1E2D42] shrink-0">
                          {charVerifiedCount} WebP
                        </span>
                      </div>
                      <p className="text-[11px] text-[#CBD5E1] truncate mt-0.5">
                        {char.fullLoreName}
                      </p>
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <span className="text-[10px] font-mono text-[#00D4FF] truncate">
                          {char.role}
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
            CỘT GIỮA: CENTRAL HERO ARTWORK STAGE (Sân khấu trung tâm)
            ================================================================= */}
        <section className="relative h-full min-h-0 flex flex-col justify-between overflow-hidden border-r border-[#1E2D42] bg-[#060911]">
          {heroBackgroundMode === 'contextual' ? (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,212,255,0.16)_0%,_rgba(14,22,38,0.65)_55%,_rgba(6,9,17,1)_100%)] pointer-events-none" />
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #1E2D42 1px, transparent 1px), linear-gradient(to bottom, #1E2D42 1px, transparent 1px)',
                  backgroundSize: '36px 36px',
                }}
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-[#05070E] pointer-events-none" />
          )}

          {/* Top Floating Overlay */}
          <div className="relative z-20 p-4 flex items-start justify-between gap-2 pointer-events-none">
            <div className="pointer-events-auto bg-[#0B111E]/90 backdrop-blur-md border border-[#1E2D42] rounded-xl px-3.5 py-2 shadow-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span className="font-mono font-black text-sm tracking-wider text-white">
                  {selectedCharacter.classCharacterName}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30">
                  {selectedCharacter.personaCode || selectedCharacter.callsign}
                </span>
              </div>
              <p className="text-xs text-[#CBD5E1] mt-0.5">
                {selectedCharacter.fullLoreName} · {selectedCharacter.role}
              </p>
            </div>

            {isHeroAvailable && (
              <button
                type="button"
                onClick={handleOpenHeroInViewer}
                aria-label="Phóng to Artwork toàn màn hình"
                className="pointer-events-auto px-3 py-2 rounded-xl bg-[#0B111E]/90 hover:bg-[#142338] border border-[#1E2D42] hover:border-[#00D4FF] text-xs font-mono font-bold text-[#F1F5F9] hover:text-[#00D4FF] flex items-center gap-1.5 backdrop-blur-md shadow-lg transition-all cursor-pointer active:scale-95"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span className="hidden lg:inline">Full Art</span>
              </button>
            )}
          </div>

          {/* Center Character Portrait / Fullbody Artwork */}
          <div className="relative z-10 flex-1 w-full min-h-0 flex items-center justify-center p-2 overflow-hidden">
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
                  className="object-contain object-center group-hover:scale-[1.02] transition-transform duration-500 drop-shadow-[0_18px_40px_rgba(0,0,0,0.85)]"
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
          </div>

          {/* Bottom Stage Controls: 2 Symmetrical Background Mode Buttons + Quick Stats Strip */}
          <div className="relative z-20 p-3.5 bg-gradient-to-t from-[#070A12] via-[#070A12]/95 to-transparent space-y-2.5 shrink-0">
            <div className="flex items-center justify-center">
              <div className="inline-grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#0B111E]/95 border border-[#1E2D42] backdrop-blur-md shadow-lg w-full max-w-[300px]">
                <button
                  type="button"
                  onClick={() => onChangeHeroBackgroundMode('contextual')}
                  className={`py-1.5 px-2.5 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    heroBackgroundMode === 'contextual'
                      ? 'bg-[#142338] text-[#00D4FF] border border-[#00D4FF]/50 shadow-sm'
                      : 'text-[#CBD5E1] hover:text-white border border-transparent'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Nền Bối Cảnh</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeHeroBackgroundMode('clean')}
                  className={`py-1.5 px-2.5 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    heroBackgroundMode === 'clean'
                      ? 'bg-[#142338] text-[#00D4FF] border border-[#00D4FF]/50 shadow-sm'
                      : 'text-[#CBD5E1] hover:text-white border border-transparent'
                  }`}
                >
                  <ImageOff className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Tách Nền</span>
                </button>
              </div>
            </div>

            {/* Quick 6-Stat Mini Strip on Stage Footer */}
            {selectedCharacter.baseAttributes ? (
              <div className="grid grid-cols-6 gap-1.5 p-2 rounded-xl bg-[#0B111E]/90 border border-[#1E2D42] backdrop-blur-md">
                {attributeKeys.map((key) => {
                  const val = selectedCharacter.baseAttributes![key]
                  const cfg = ATTRIBUTE_COLOR_CONFIG[key]
                  return (
                    <div
                      key={key}
                      className="flex flex-col items-center justify-center py-1 rounded-lg bg-[#070A12]/80 border border-[#1E2D42]/60"
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
              <div className="p-2 rounded-xl bg-[#0B111E]/90 border border-[#1E2D42] text-center text-[11px] font-mono text-[#CBD5E1]">
                SYSTEM Stats: Chưa đăng ký trong FND-1 Registry
              </div>
            )}
          </div>
        </section>

        {/* =================================================================
            CỘT PHẢI: DOSSIER TABS (OVERVIEW | STORY | GEAR COMPAT | GALLERY)
            ================================================================= */}
        <section className="h-full min-h-0 flex flex-col bg-[#0B111E]/90 overflow-hidden">
          <div className="p-3 border-b border-[#1E2D42] bg-[#070A12]/90 shrink-0">
            <div
              role="tablist"
              aria-label="Hồ sơ chi tiết phi công"
              className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#0B111E] border border-[#1E2D42]"
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
            {activeTab === 'overview' && <OverviewTab character={selectedCharacter} />}
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
