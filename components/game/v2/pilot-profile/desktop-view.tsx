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
  Button,
} from '@/components/game/v2/ui'
import { OverviewTab } from './tabs/overview-tab'
import { StoryTab } from './tabs/story-tab'
import { GearCompatTab } from './tabs/gear-compat-tab'
import { GalleryTab } from './tabs/gallery-tab'
import {
  Maximize2,
  Compass,
  Radar,
  Quote,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  FileArchive,
} from 'lucide-react'
import { loadV2UIPreferences, saveV2UIPreferences } from '@/lib/game/v2/ui-preferences'

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
  // Independent Pilot Roster State: 'mini' (72px) vs 'full' (260px). Default: 'mini' per contract.
  const [rosterMode, setRosterMode] = useState<'mini' | 'full'>('mini')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all')
  const [mainImageError, setMainImageError] = useState<boolean>(false)

  // Load roster preference from localStorage
  useEffect(() => {
    const prefs = loadV2UIPreferences()
    setRosterMode(prefs.pilotRosterMode)
  }, [])

  // Reset main image error state when active character changes
  useEffect(() => {
    setMainImageError(false)
  }, [activeCharacter.id])

  const handleToggleRosterMode = () => {
    const next = rosterMode === 'mini' ? 'full' : 'mini'
    setRosterMode(next)
    saveV2UIPreferences({ pilotRosterMode: next })
  }

  const filteredRoster = roster.filter((char) => {
    const matchName =
      char.classCharacterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      char.callsign.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole =
      selectedRoleFilter === 'all' || char.roleCategory === selectedRoleFilter
    return matchName && matchRole
  })

  return (
    <div className="w-full h-full min-h-[calc(100vh-56px)] flex gap-4 p-4 lg:p-5 bg-[#070A12] text-[#F1F5F9] overflow-hidden">
      {/* =========================================================================
          CỘT 1 (TRÁI): PILOT ROSTER (Mini 72px / Full 260px) — Độc lập với Global Menu
          ========================================================================= */}
      <aside
        className={`flex flex-col rounded-2xl bg-[#0F172A] border border-[#26384D] overflow-hidden shadow-xl transition-all duration-300 shrink-0 max-h-[calc(100vh-80px)] ${
          rosterMode === 'full' ? 'w-64 lg:w-72' : 'w-20'
        }`}
      >
        {/* Roster Header */}
        <div className="p-3 border-b border-[#26384D] bg-[#142338]/50 flex items-center justify-between">
          {rosterMode === 'full' ? (
            <div className="flex items-center gap-2 min-w-0">
              <Compass className="w-4 h-4 text-[#06B6D4] shrink-0" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9] truncate">
                Phi Công ({filteredRoster.length})
              </h2>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <UserCheck className="w-5 h-5 text-[#06B6D4]" />
            </div>
          )}

          {/* Toggle Roster Mini/Full */}
          <button
            type="button"
            onClick={handleToggleRosterMode}
            title={rosterMode === 'full' ? 'Thu gọn danh sách (Mini)' : 'Mở rộng danh sách (Full)'}
            aria-label={rosterMode === 'full' ? 'Thu gọn danh sách' : 'Mở rộng danh sách'}
            className="p-1 rounded-lg hover:bg-[#142338] text-[#A7B6C8] hover:text-[#06B6D4] transition-colors cursor-pointer"
          >
            {rosterMode === 'full' ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Search & Filters in Full Mode */}
        {rosterMode === 'full' && (
          <div className="p-3 border-b border-[#26384D] space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A7B6C8]" />
              <input
                type="text"
                placeholder="Tìm phi công..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-[#070A12] border border-[#26384D] text-xs text-[#F1F5F9] placeholder:text-[#A7B6C8]/60 focus:outline-none focus:border-[#06B6D4]"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1 text-[10px] font-mono scrollbar-none">
              {[
                { id: 'all', label: 'Tất Cả' },
                { id: 'support', label: 'Hỗ Trợ' },
                { id: 'attack', label: 'Tấn Công' },
                { id: 'defense', label: 'Thủ' },
              ].map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRoleFilter(role.id)}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    selectedRoleFilter === role.id
                      ? 'bg-[#06B6D4] text-[#070A12] font-bold'
                      : 'bg-[#070A12] text-[#A7B6C8] border border-[#26384D]'
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Character Items List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
          {filteredRoster.map((char) => {
            const isSelected = char.id === activeCharacter.id

            return (
              <div
                key={char.id}
                onClick={() => onSelectCharacter(char)}
                title={`${char.classCharacterName} (${char.callsign})`}
                className={`group rounded-xl border transition-all cursor-pointer flex items-center select-none ${
                  rosterMode === 'full' ? 'p-2 gap-2.5' : 'p-1.5 justify-center'
                } ${
                  isSelected
                    ? 'bg-[#142338] border-[#06B6D4] shadow-sm shadow-[#06B6D4]/20 ring-1 ring-[#06B6D4]/30'
                    : 'bg-[#070A12]/60 border-[#26384D]/70 hover:border-[#3B526D] hover:bg-[#142338]/40'
                }`}
              >
                {/* Avatar with fallback */}
                <div
                  className={`relative w-10 h-10 rounded-lg overflow-hidden bg-[#0F172A] border shrink-0 ${
                    isSelected ? 'border-[#06B6D4]' : 'border-[#26384D]'
                  }`}
                >
                  <Image
                    src={resolveImageUrl(char.portraitAssetPath)}
                    alt={char.classCharacterName}
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover"
                    onError={(e) => {
                      // Fallback to valentine portrait if image missing
                      const target = e.target as HTMLImageElement
                      target.src = resolveImageUrl('/images/valentine-portrait.webp')
                    }}
                  />
                </div>

                {/* Details in Full Mode */}
                {rosterMode === 'full' && (
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3
                        className={`text-xs font-bold truncate ${
                          isSelected ? 'text-[#06B6D4]' : 'text-[#F1F5F9]'
                        }`}
                      >
                        {char.classCharacterName}
                      </h3>
                      <span className="text-[10px] font-mono text-[#A7B6C8] uppercase">
                        {char.gender}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#A7B6C8] truncate italic">
                      "{char.callsign}"
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </aside>

      {/* =========================================================================
          CỘT 2 (GIỮA): MAIN STAGE — ARTWORK SHOWCASE & 2 CONTROLS BỐI CẢNH
          ========================================================================= */}
      <section className="flex-1 relative rounded-2xl bg-[#0F172A] border border-[#26384D] overflow-hidden shadow-2xl flex flex-col justify-between max-h-[calc(100vh-80px)]">
        {/* Background visual rendering */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
            backgroundMode === 'tactical'
              ? 'opacity-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/40 via-[#070A12] to-[#070A12]'
              : 'opacity-100 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-[#070A12] to-[#070A12]'
          }`}
        />

        {/* Tactical HUD Overlay Lines */}
        {backgroundMode === 'tactical' && (
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#06b6d40a_1px,transparent_1px),linear-gradient(to_bottom,#06b6d40a_1px,transparent_1px)] bg-[size:24px_24px] z-10">
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-[#06B6D4] px-3 py-1.5 rounded-lg bg-[#070A12]/80 border border-[#06B6D4]/30 backdrop-blur-md">
              <span className="flex items-center gap-1.5">
                <Radar className="w-3.5 h-3.5 animate-spin" />
                <span>RADAR TACTICAL GRID // ONLINE</span>
              </span>
              <span>BIO-TELEMETRY: STABLE 100%</span>
            </div>
          </div>
        )}

        {/* Central Character Fullbody Graphic or Missing Art State */}
        <div className="relative flex-1 flex items-center justify-center p-4 z-10 overflow-hidden">
          {!mainImageError ? (
            <div className="relative w-full h-[65vh] max-h-[640px]">
              <Image
                src={resolveImageUrl(activeCharacter.fullbodyAssetPath)}
                alt={activeCharacter.classCharacterName}
                fill
                priority
                referrerPolicy="no-referrer"
                className="object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)] filter hover:brightness-105 transition-all duration-500"
                onError={() => setMainImageError(true)}
              />
            </div>
          ) : (
            /* Missing Artwork Elegant State */
            <div className="max-w-sm text-center p-8 rounded-2xl bg-[#070A12]/80 border border-[#26384D] space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#142338] border border-[#26384D] flex items-center justify-center text-[#FBBF24]">
                <FileArchive className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-[#F1F5F9]">
                {activeCharacter.classCharacterName}
              </h4>
              <p className="text-xs font-mono text-[#06B6D4] uppercase">
                {activeCharacter.role}
              </p>
              <p className="text-xs text-[#A7B6C8] leading-relaxed">
                Artwork toàn thân của lớp nhân vật này đang chờ đồng bộ tệp WebP vào hệ thống.
              </p>
            </div>
          )}

          {/* TWO BACKGROUND / SHOWCASE CONTROLS FLANKING THE ARTWORK (APPROVED CONCEPT) */}
          {/* Left Control: Standard Showcase */}
          <button
            type="button"
            onClick={() => onToggleBackgroundMode('standard')}
            title="Chuyển sang Bối Cảnh Tiêu Chuẩn (Standard Showcase)"
            className={`absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-1 shadow-xl cursor-pointer select-none ${
              backgroundMode === 'standard'
                ? 'bg-[#06B6D4] text-[#070A12] border-[#06B6D4] shadow-cyan-500/30 ring-2 ring-cyan-400/40'
                : 'bg-[#070A12]/85 text-[#A7B6C8] border-[#26384D] hover:text-[#F1F5F9] hover:border-[#3B526D]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold uppercase vertical-text">
              Tiêu Chuẩn
            </span>
          </button>

          {/* Right Control: Tactical HUD Showcase */}
          <button
            type="button"
            onClick={() => onToggleBackgroundMode('tactical')}
            title="Chuyển sang Bối Cảnh Tác Chiến HUD (Tactical HUD Showcase)"
            className={`absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-1 shadow-xl cursor-pointer select-none ${
              backgroundMode === 'tactical'
                ? 'bg-[#06B6D4] text-[#070A12] border-[#06B6D4] shadow-cyan-500/30 ring-2 ring-cyan-400/40'
                : 'bg-[#070A12]/85 text-[#A7B6C8] border-[#26384D] hover:text-[#F1F5F9] hover:border-[#3B526D]'
            }`}
          >
            <Radar className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold uppercase vertical-text">
              Radar HUD
            </span>
          </button>
        </div>

        {/* Bottom Action Footer on Showcase */}
        <div className="relative z-20 p-3.5 border-t border-[#26384D] bg-[#0F172A]/90 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] animate-ping" />
            <span className="text-xs font-mono text-[#A7B6C8]">
              Bối cảnh: <strong className="text-[#F1F5F9]">{backgroundMode === 'standard' ? 'Tiêu Chuẩn' : 'Chiến Thuật HUD'}</strong>
            </span>
          </div>

          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Maximize2 className="w-4 h-4 text-[#06B6D4]" />}
            onClick={() =>
              onOpenArtViewer({
                id: activeCharacter.id + '-fullbody',
                title: activeCharacter.classCharacterName + ' — Tranh Toàn Thân',
                category: 'base',
                path: activeCharacter.fullbodyAssetPath,
                isAvailableOnDisk: !mainImageError,
                status: !mainImageError ? 'verified_webp' : 'archive_pending',
                description: activeCharacter.shortDescription,
              })
            }
          >
            Soi Tranh HD
          </Button>
        </div>
      </section>

      {/* =========================================================================
          CỘT 3 (PHẢI): PROFILE DOSSIER & 4 TABS (420px - 460px)
          ========================================================================= */}
      <section className="w-[420px] lg:w-[460px] flex flex-col rounded-2xl bg-[#0F172A] border border-[#26384D] overflow-hidden shadow-2xl shrink-0 max-h-[calc(100vh-80px)]">
        {/* Header Profile Identity */}
        <div className="p-4 sm:p-5 border-b border-[#26384D] bg-[#142338]/40 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#070A12] text-[#06B6D4] border border-[#26384D] font-bold">
                  {activeCharacter.callsign}
                </span>
                <span className="text-xs text-[#A7B6C8] font-mono truncate max-w-[180px]">
                  {activeCharacter.role}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9] mt-1 tracking-tight">
                {activeCharacter.fullLoreName}
              </h1>
              <p className="text-xs font-medium text-[#06B6D4]">
                {activeCharacter.title}
              </p>
            </div>

            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#142338] text-[#F1F5F9] border border-[#26384D] shrink-0">
              V2 DOSSIER
            </span>
          </div>

          {/* TWO SEPARATE TEXT BLOCKS: characterQuote & shortDescription (MANDATORY SEPARATION) */}
          <div className="space-y-2 pt-1">
            {/* Block 1: characterQuote */}
            <div className="p-2.5 rounded-xl bg-[#070A12]/70 border-l-3 border-[#06B6D4] flex items-start gap-2">
              <Quote className="w-3.5 h-3.5 text-[#06B6D4] shrink-0 mt-0.5" />
              <p className="text-xs italic font-medium text-[#F1F5F9] leading-relaxed">
                {activeCharacter.characterQuote}
              </p>
            </div>

            {/* Block 2: shortDescription */}
            <div className="p-2.5 rounded-xl bg-[#142338]/40 border border-[#26384D]/70 text-xs text-[#CBD5E1] leading-relaxed">
              {activeCharacter.shortDescription}
            </div>
          </div>
        </div>

        {/* 4 Tabs Navigation & Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-4">
          <Tabs value={activeTab} onValueChange={onTabChange} variant="segmented" className="h-full flex flex-col">
            <TabsList className="mb-3">
              <TabsTrigger value="overview">OVERVIEW</TabsTrigger>
              <TabsTrigger value="story">STORY</TabsTrigger>
              <TabsTrigger value="gear">GEAR</TabsTrigger>
              <TabsTrigger value="gallery">GALLERY</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
              <TabsContent value="overview">
                <OverviewTab character={activeCharacter} />
              </TabsContent>

              <TabsContent value="story">
                <StoryTab character={activeCharacter} />
              </TabsContent>

              <TabsContent value="gear">
                <GearCompatTab character={activeCharacter} />
              </TabsContent>

              <TabsContent value="gallery">
                <GalleryTab
                  character={activeCharacter}
                  onSelectArtwork={(art) => onOpenArtViewer(art)}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </section>
    </div>
  )
}
export default DesktopView
