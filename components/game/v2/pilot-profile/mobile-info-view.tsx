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
} from '@/components/game/v2/ui'
import { OverviewTab } from './tabs/overview-tab'
import { StoryTab } from './tabs/story-tab'
import { GearCompatTab } from './tabs/gear-compat-tab'
import { GalleryTab } from './tabs/gallery-tab'
import {
  ArrowLeft,
  Quote,
  Sparkles,
  Maximize2,
  Image as ImageIcon,
} from 'lucide-react'

interface MobileInfoViewProps {
  roster: CharacterProfileV2[]
  activeCharacter: CharacterProfileV2
  onSelectCharacter: (char: CharacterProfileV2) => void
  onSwitchToArtView: () => void
  onOpenArtViewer: (art?: GalleryArtwork) => void
  activeTab: string
  onTabChange: (tab: string) => void
}

export function MobileInfoView({
  roster,
  activeCharacter,
  onSelectCharacter,
  onSwitchToArtView,
  onOpenArtViewer,
  activeTab,
  onTabChange,
}: MobileInfoViewProps) {
  return (
    <div className="w-full min-h-[100dvh] bg-[#070A12] text-[#F1F5F9] flex flex-col pb-24">
      {/* 1. TOP STICKY BAR */}
      <header className="sticky top-0 z-40 bg-[#070A12]/95 backdrop-blur-md border-b border-[#26384D] px-4 py-2.5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSwitchToArtView}
          className="min-h-[44px] px-3 rounded-xl bg-[#142338] border border-[#26384D] text-[#06B6D4] font-bold text-xs flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>XEM TRANH</span>
        </button>

        <div className="text-center min-w-0 flex-1">
          <h2 className="text-sm font-bold text-[#F1F5F9] truncate">
            {activeCharacter.classCharacterName}
          </h2>
          <p className="text-[11px] font-mono text-[#06B6D4] truncate">
            {activeCharacter.callsign} · {activeCharacter.role}
          </p>
        </div>

        <button
          type="button"
          aria-label="Phóng to tranh"
          onClick={() => onOpenArtViewer()}
          className="min-h-[44px] min-w-[44px] rounded-xl bg-[#142338] border border-[#26384D] text-[#F1F5F9] flex items-center justify-center active:scale-95 cursor-pointer shrink-0"
        >
          <Maximize2 className="w-4 h-4 text-[#06B6D4]" />
        </button>
      </header>

      {/* 2. HORIZONTAL AVATAR ROSTER (Min-w 76px per card, full name visible) */}
      <div className="p-3 bg-[#0F172A]/80 border-b border-[#26384D] overflow-x-auto scrollbar-none">
        <div className="flex gap-2.5 min-w-max">
          {roster.map((char) => {
            const isSelected = char.id === activeCharacter.id

            return (
              <button
                key={char.id}
                type="button"
                onClick={() => onSelectCharacter(char)}
                className={`min-w-[76px] p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#142338] border-[#06B6D4] ring-2 ring-[#06B6D4]/30 shadow-md shadow-cyan-500/20'
                    : 'bg-[#070A12]/80 border-[#26384D] hover:border-[#3B526D]'
                }`}
              >
                <div
                  className={`relative w-11 h-11 rounded-lg overflow-hidden bg-[#0F172A] border ${
                    isSelected ? 'border-[#06B6D4]' : 'border-[#26384D]/60'
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
                <span
                  className={`text-xs font-bold truncate max-w-[72px] text-center ${
                    isSelected ? 'text-[#06B6D4]' : 'text-[#A7B6C8]'
                  }`}
                >
                  {char.classCharacterName}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. CHARACTER IDENTITY HEADER */}
      <div className="p-4 sm:p-5 border-b border-[#26384D] bg-[#0F172A]/40 space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#142338] text-[#06B6D4] border border-[#26384D] font-bold">
              {activeCharacter.callsign}
            </span>
            <span className="text-xs text-[#A7B6C8] font-mono">
              {activeCharacter.role}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9] mt-1 tracking-tight">
            {activeCharacter.fullLoreName}
          </h1>
          <p className="text-xs font-medium text-[#06B6D4] mt-0.5">
            {activeCharacter.title}
          </p>
        </div>

        {/* TWO SEPARATE TEXT BLOCKS: characterQuote & shortDescription (MANDATORY SEPARATION) */}
        <div className="space-y-2.5 pt-1">
          {/* Block 1: characterQuote */}
          <div className="p-3.5 rounded-xl bg-[#070A12]/80 border-l-4 border-[#06B6D4] flex items-start gap-2.5">
            <Quote className="w-4 h-4 text-[#06B6D4] shrink-0 mt-0.5" />
            <p className="text-sm italic font-medium text-[#F1F5F9] leading-relaxed">
              {activeCharacter.characterQuote}
            </p>
          </div>

          {/* Block 2: shortDescription */}
          <div className="p-3 rounded-xl bg-[#142338]/40 border border-[#26384D]/70 text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
            {activeCharacter.shortDescription}
          </div>
        </div>
      </div>

      {/* 4. FOUR TABS WITH TOUCH TARGET >= 44PX */}
      <div className="p-4 flex-1">
        <Tabs value={activeTab} onValueChange={onTabChange} variant="segmented">
          <TabsList className="mb-4 min-h-[48px] overflow-x-auto scrollbar-none">
            <TabsTrigger value="overview" className="min-h-[44px]">
              OVERVIEW
            </TabsTrigger>
            <TabsTrigger value="story" className="min-h-[44px]">
              STORY
            </TabsTrigger>
            <TabsTrigger value="gear" className="min-h-[44px]">
              GEAR
            </TabsTrigger>
            <TabsTrigger value="gallery" className="min-h-[44px]">
              GALLERY
            </TabsTrigger>
          </TabsList>

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
        </Tabs>
      </div>

      {/* Floating Bottom Navigation to Switch Back to Art View */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
        <button
          type="button"
          onClick={onSwitchToArtView}
          className="min-h-[48px] px-5 py-2.5 rounded-full bg-[#06B6D4] text-[#070A12] font-mono font-black text-xs shadow-2xl shadow-cyan-500/40 flex items-center gap-2 active:scale-95 cursor-pointer border-2 border-white/20"
        >
          <ImageIcon className="w-4 h-4" />
          <span>NGẮM TRANH TOÀN MÀN HÌNH</span>
        </button>
      </div>
    </div>
  )
}
