'use client'

import React from 'react'
import { CharacterProfileV2, GalleryArtwork } from '@/lib/game/v2/character-profile-data'
import { PilotProfileTabId } from './desktop-view'
import { OverviewTab } from './tabs/overview-tab'
import { StoryTab } from './tabs/story-tab'
import { GearCompatTab } from './tabs/gear-compat-tab'
import { GalleryTab } from './tabs/gallery-tab'
import { PilotAvatar } from './pilot-avatar'
import {
  User,
  BookOpen,
  Cpu,
  Image as ImageIcon,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'

interface MobileInfoViewProps {
  characters: CharacterProfileV2[]
  selectedCharacter: CharacterProfileV2
  onSelectCharacter: (char: CharacterProfileV2) => void
  activeTab: PilotProfileTabId
  onChangeTab: (tab: PilotProfileTabId) => void
  selectedHeroArtwork: GalleryArtwork | null
  onSelectHeroArtwork: (artwork: GalleryArtwork) => void
  onOpenViewer: (artwork: GalleryArtwork) => void
  onSwitchToArtView: () => void
  forceMobileView?: boolean
}

export function MobileInfoView({
  characters,
  selectedCharacter,
  onSelectCharacter,
  activeTab,
  onChangeTab,
  selectedHeroArtwork,
  onSelectHeroArtwork,
  onOpenViewer,
  onSwitchToArtView,
  forceMobileView = false,
}: MobileInfoViewProps) {
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

  return (
    <div
      className={`${
        forceMobileView ? 'flex' : 'md:hidden flex'
      } flex-col min-h-[calc(100vh-100px)] bg-[#070A12] text-[#F1F5F9]`}
    >
      {/* 1. HORIZONTAL PORTRAIT ROSTER STRIP + DOSSIER IDENTITY HEADER */}
      <div className="p-2.5 border-b border-[#1E2D42] bg-[#080D18] space-y-2.5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {characters.map((char) => {
            const isSelected = char.id === selectedCharacter.id
            return (
              <button
                key={char.id}
                type="button"
                onClick={() => onSelectCharacter(char)}
                className={`flex flex-col items-center p-1.5 rounded-xl border shrink-0 transition-all cursor-pointer min-w-[64px] ${
                  isSelected
                    ? 'bg-[#13263E] border-[#00D4FF] shadow-[0_0_12px_rgba(0,212,255,0.3)]'
                    : 'bg-[#070A12]/80 border-[#1E2D42] opacity-80'
                }`}
              >
                <PilotAvatar
                  character={char}
                  isSelected={isSelected}
                  className="w-11 h-11 rounded-lg"
                />
                <span
                  className={`text-[10px] font-mono font-bold truncate max-w-[58px] mt-1 ${
                    isSelected ? 'text-[#00D4FF]' : 'text-[#E2E8F0]'
                  }`}
                >
                  {char.classCharacterName}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1E2D42]/60">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00D4FF]" />
              <h2 className="font-black text-base text-white uppercase truncate">
                {selectedCharacter.classCharacterName}
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30">
                {selectedCharacter.personaCode || selectedCharacter.callsign}
              </span>
            </div>
            <p className="text-xs text-[#00D4FF] truncate">
              {selectedCharacter.role} · {selectedCharacter.fullLoreName}
            </p>
          </div>

          <button
            type="button"
            onClick={onSwitchToArtView}
            className="px-3 py-2 rounded-xl bg-[#142338] border border-[#00D4FF]/60 text-xs font-mono font-bold text-[#00D4FF] flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[44px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sân Khấu Art</span>
          </button>
        </div>
      </div>

      {/* 2. 4 CANONICAL TABS (Sticky, 44px+ height) */}
      <div className="sticky top-14 z-30 p-2 bg-[#070A12]/95 backdrop-blur-md border-b border-[#1E2D42]">
        <div
          role="tablist"
          aria-label="Hồ sơ phi công trên di động"
          className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#0B111E] border border-[#1E2D42]"
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
                className={`py-2.5 px-1.5 rounded-lg font-mono text-[11px] font-bold uppercase flex items-center justify-center gap-1 transition-all cursor-pointer min-h-[42px] ${
                  isActive
                    ? 'bg-[#142338] text-[#00D4FF] border border-[#00D4FF]/60 shadow-sm'
                    : 'text-[#CBD5E1] border border-transparent'
                }`}
              >
                {tab.icon}
                <span className="truncate">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. TAB CONTENT */}
      <div className="flex-1 p-4 pb-10">
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
            onSelectHeroArtwork={(art) => {
              onSelectHeroArtwork(art)
              onSwitchToArtView()
            }}
            onOpenViewer={onOpenViewer}
          />
        )}
      </div>
    </div>
  )
}

export default MobileInfoView
