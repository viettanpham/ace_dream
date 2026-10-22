'use client'

import React from 'react'
import Image from 'next/image'
import {
  CharacterProfileV2,
  GalleryArtwork,
} from '@/lib/game/v2/character-profile-data'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  IconButton,
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
  Shield,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
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
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedRoleFilter, setSelectedRoleFilter] = React.useState<string>('all')

  const filteredRoster = roster.filter((char) => {
    const matchName =
      char.classCharacterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      char.callsign.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole =
      selectedRoleFilter === 'all' || char.roleCategory === selectedRoleFilter
    return matchName && matchRole
  })

  return (
    <div className="w-full h-full min-h-[calc(100vh-60px)] grid grid-cols-12 gap-5 p-4 sm:p-6 bg-[#070A12] text-[#F1F5F9]">
      {/* =========================================================================
          CỘT 1 (TRÁI): PILOT ROSTER (3 cột / 12)
          ========================================================================= */}
      <aside className="col-span-3 flex flex-col rounded-2xl bg-[#0F172A] border border-[#26384D] overflow-hidden shadow-xl max-h-[88vh]">
        {/* Roster Header */}
        <div className="p-4 border-b border-[#26384D] bg-[#142338]/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#06B6D4]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#F1F5F9]">
                Danh Sách Phi Công
              </h2>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#070A12] text-[#06B6D4] border border-[#26384D] font-bold">
              {filteredRoster.length} / {roster.length}
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A7B6C8]" />
            <input
              type="text"
              placeholder="Tìm tên hoặc callsign..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#070A12] border border-[#26384D] text-xs text-[#F1F5F9] placeholder:text-[#A7B6C8]/60 focus:outline-none focus:border-[#06B6D4] transition-colors"
            />
          </div>

          {/* Role Filters */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px] font-mono">
            {[
              { id: 'all', label: 'Tất Cả' },
              { id: 'support', label: 'Hỗ Trợ' },
              { id: 'attack', label: 'Tấn Công' },
              { id: 'defense', label: 'Phòng Thủ' },
              { id: 'special', label: 'Đặc Nhiệm' },
            ].map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRoleFilter(role.id)}
                className={`px-2 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                  selectedRoleFilter === role.id
                    ? 'bg-[#06B6D4] text-[#070A12] font-bold'
                    : 'bg-[#070A12] text-[#A7B6C8] hover:text-[#F1F5F9] border border-[#26384D]'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>

        {/* Character List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {filteredRoster.map((char) => {
            const isSelected = char.id === activeCharacter.id

            return (
              <div
                key={char.id}
                onClick={() => onSelectCharacter(char)}
                className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 select-none ${
                  isSelected
                    ? 'bg-[#142338] border-[#06B6D4] shadow-md shadow-[#06B6D4]/10'
                    : 'bg-[#070A12]/60 border-[#26384D]/70 hover:border-[#3B526D] hover:bg-[#142338]/40'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`relative w-12 h-12 rounded-xl overflow-hidden bg-[#0F172A] border shrink-0 ${
                    isSelected ? 'border-[#06B6D4] ring-2 ring-[#06B6D4]/30' : 'border-[#26384D]'
                  }`}
                >
                  <Image
                    src={char.portraitAssetPath}
                    alt={char.classCharacterName}
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3
                      className={`text-sm font-bold truncate ${
                        isSelected ? 'text-[#06B6D4]' : 'text-[#F1F5F9] group-hover:text-white'
                      }`}
                    >
                      {char.classCharacterName}
                    </h3>
                    <span className="text-[11px] font-mono text-[#A7B6C8] shrink-0">
                      {char.gender}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#A7B6C8] mt-0.5">
                    <span className="truncate italic">"{char.callsign}"</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#070A12] border border-[#26384D] uppercase">
                      {char.roleCategory}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </aside>

      {/* =========================================================================
          CỘT 2 (GIỮA): CENTRAL ARTWORK SHOWCASE & 2 CONTROLS BỐI CẢNH (4 cột / 12)
          ========================================================================= */}
      <section className="col-span-4 relative rounded-2xl bg-[#0F172A] border border-[#26384D] overflow-hidden shadow-2xl flex flex-col justify-between max-h-[88vh]">
        {/* Background Visual Rendering depending on mode */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
            backgroundMode === 'tactical'
              ? 'opacity-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/40 via-[#070A12] to-[#070A12]'
              : 'opacity-100 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-[#070A12] to-[#070A12]'
          }`}
        />

        {/* Tactical HUD Overlay Lines if active */}
        {backgroundMode === 'tactical' && (
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#06b6d40a_1px,transparent_1px),linear-gradient(to_bottom,#06b6d40a_1px,transparent_1px)] bg-[size:24px_24px] z-10">
            {/* Top HUD stats */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-[#06B6D4] px-3 py-1.5 rounded-lg bg-[#070A12]/80 border border-[#06B6D4]/30 backdrop-blur-md">
              <span className="flex items-center gap-1.5">
                <Radar className="w-3.5 h-3.5 animate-spin" />
                <span>RADAR TACTICAL GRID // ONLINE</span>
              </span>
              <span>BIO-TELEMETRY: STABLE 100%</span>
            </div>
          </div>
        )}

        {/* Central Character Fullbody Graphic */}
        <div className="relative flex-1 flex items-center justify-center p-4 z-10 overflow-hidden">
          <div className="relative w-full h-[70vh] max-h-[680px]">
            <Image
              src={activeCharacter.fullbodyAssetPath}
              alt={activeCharacter.classCharacterName}
              fill
              priority
              referrerPolicy="no-referrer"
              className="object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)] filter hover:brightness-105 transition-all duration-500"
            />
          </div>

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
        <div className="relative z-20 p-4 border-t border-[#26384D] bg-[#0F172A]/90 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] animate-ping" />
            <span className="text-xs font-mono text-[#A7B6C8]">
              Chế độ bối cảnh: <strong className="text-[#F1F5F9]">{backgroundMode === 'standard' ? 'Tiêu Chuẩn' : 'Chiến Thuật HUD'}</strong>
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
                isAvailableOnDisk: true,
                status: 'verified_webp',
                description: activeCharacter.shortDescription,
              })
            }
          >
            Soi Tranh 4K
          </Button>
        </div>
      </section>

      {/* =========================================================================
          CỘT 3 (PHẢI): PROFILE DOSSIER & 4 TABS (5 cột / 12)
          ========================================================================= */}
      <main className="col-span-5 flex flex-col rounded-2xl bg-[#0F172A] border border-[#26384D] overflow-hidden shadow-2xl max-h-[88vh]">
        {/* Header Profile Identity */}
        <div className="p-5 border-b border-[#26384D] bg-[#142338]/40 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#070A12] text-[#06B6D4] border border-[#26384D] font-bold">
                  {activeCharacter.callsign}
                </span>
                <span className="text-xs text-[#A7B6C8] font-mono">
                  {activeCharacter.role}
                </span>
              </div>
              <h1 className="text-2xl font-black text-[#F1F5F9] mt-1 tracking-tight">
                {activeCharacter.fullLoreName}
              </h1>
              <p className="text-xs font-medium text-[#06B6D4] mt-0.5">
                {activeCharacter.title}
              </p>
            </div>

            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#142338] text-[#F1F5F9] border border-[#26384D]">
                V2 DOSSIER
              </span>
            </div>
          </div>

          {/* TWO SEPARATE TEXT BLOCKS: characterQuote & shortDescription (MANDATORY SEPARATION) */}
          <div className="space-y-2.5 pt-1">
            {/* Block 1: characterQuote */}
            <div className="p-3 rounded-xl bg-[#070A12]/70 border-l-3 border-[#06B6D4] flex items-start gap-2.5">
              <Quote className="w-4 h-4 text-[#06B6D4] shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm italic font-medium text-[#F1F5F9] leading-relaxed">
                {activeCharacter.characterQuote}
              </p>
            </div>

            {/* Block 2: shortDescription */}
            <div className="p-3 rounded-xl bg-[#142338]/40 border border-[#26384D]/70 text-xs text-[#CBD5E1] leading-relaxed">
              {activeCharacter.shortDescription}
            </div>
          </div>
        </div>

        {/* 4 Tabs Navigation & Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-5">
          <Tabs value={activeTab} onValueChange={onTabChange} variant="segmented" className="h-full flex flex-col">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">OVERVIEW</TabsTrigger>
              <TabsTrigger value="story">STORY</TabsTrigger>
              <TabsTrigger value="gear">GEAR COMPAT</TabsTrigger>
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
      </main>
    </div>
  )
}
