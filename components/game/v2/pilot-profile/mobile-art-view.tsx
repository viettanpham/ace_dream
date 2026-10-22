'use client'

import React from 'react'
import Image from 'next/image'
import { CharacterProfileV2 } from '@/lib/game/v2/character-profile-data'
import {
  Maximize2,
  Radar,
  Sparkles,
  FileText,
  ChevronLeft,
  ChevronRight,
  Shield,
  HeartPulse,
} from 'lucide-react'
import { Button, IconButton } from '@/components/game/v2/ui'

interface MobileArtViewProps {
  character: CharacterProfileV2
  backgroundMode: 'standard' | 'tactical'
  onToggleBackgroundMode: (mode: 'standard' | 'tactical') => void
  onSwitchToInfoView: () => void
  onOpenArtViewer: () => void
  onPrevPilot: () => void
  onNextPilot: () => void
}

export function MobileArtView({
  character,
  backgroundMode,
  onToggleBackgroundMode,
  onSwitchToInfoView,
  onOpenArtViewer,
  onPrevPilot,
  onNextPilot,
}: MobileArtViewProps) {
  return (
    <div className="relative w-full h-[100dvh] bg-[#070A12] overflow-hidden flex flex-col justify-between select-none">
      {/* Background Graphic depending on mode */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
          backgroundMode === 'tactical'
            ? 'opacity-100 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-cyan-950/60 via-[#070A12] to-[#070A12]'
            : 'opacity-100 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/60 via-[#070A12] to-[#070A12]'
        }`}
      />

      {/* Tactical HUD Overlay if active */}
      {backgroundMode === 'tactical' && (
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#06b6d40d_1px,transparent_1px),linear-gradient(to_bottom,#06b6d40d_1px,transparent_1px)] bg-[size:20px_20px] z-10">
          <div className="absolute top-16 left-4 right-4 flex items-center justify-between text-[10px] font-mono text-[#06B6D4] px-2.5 py-1 rounded bg-[#070A12]/80 border border-[#06B6D4]/30 backdrop-blur-md">
            <span className="flex items-center gap-1.5">
              <Radar className="w-3 h-3 animate-spin" />
              <span>RADAR TACTICAL GRID // ACTIVE</span>
            </span>
            <span>TELEMETRY: 100%</span>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="relative z-20 px-4 pt-3 pb-2 flex items-center justify-between bg-gradient-to-b from-[#070A12]/90 to-transparent">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-widest text-[#06B6D4] uppercase">
            STARFRONT // ART VIEW
          </span>
        </div>

        <button
          type="button"
          onClick={onSwitchToInfoView}
          className="min-h-[44px] px-3.5 py-1.5 rounded-full bg-[#142338]/90 border border-[#06B6D4]/50 text-[#F1F5F9] text-xs font-bold font-mono flex items-center gap-1.5 backdrop-blur-md shadow-lg active:scale-95 cursor-pointer"
        >
          <FileText className="w-4 h-4 text-[#06B6D4]" />
          <span>HỒ SƠ & STORY →</span>
        </button>
      </header>

      {/* Central Fullbody Artwork */}
      <div className="relative flex-1 flex items-center justify-center p-2 z-10 overflow-hidden">
        {/* Next / Prev Pilot Arrows */}
        <button
          type="button"
          aria-label="Phi công trước"
          onClick={onPrevPilot}
          className="absolute left-2 z-20 w-11 h-11 rounded-full bg-[#0F172A]/80 border border-[#26384D] text-[#F1F5F9] flex items-center justify-center active:scale-90 transition-transform shadow-lg cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          type="button"
          aria-label="Phi công tiếp theo"
          onClick={onNextPilot}
          className="absolute right-2 z-20 w-11 h-11 rounded-full bg-[#0F172A]/80 border border-[#26384D] text-[#F1F5F9] flex items-center justify-center active:scale-90 transition-transform shadow-lg cursor-pointer"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Character Image */}
        <div className="relative w-full h-[62vh] max-h-[520px]">
          <Image
            src={character.fullbodyAssetPath}
            alt={character.classCharacterName}
            fill
            priority
            referrerPolicy="no-referrer"
            className="object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]"
          />
        </div>

        {/* Floating Side Tools on right */}
        <div className="absolute right-3 top-20 z-20 flex flex-col gap-2.5">
          <button
            type="button"
            aria-label="Soi tranh phóng to"
            onClick={onOpenArtViewer}
            className="w-11 h-11 rounded-xl bg-[#0F172A]/90 border border-[#26384D] text-[#06B6D4] flex items-center justify-center backdrop-blur-md shadow-xl active:scale-95 cursor-pointer"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Floating Dossier Card */}
      <footer className="relative z-30 p-4 pt-2 bg-gradient-to-t from-[#070A12] via-[#070A12]/95 to-transparent space-y-3">
        {/* Floating Background Mode Toggles (Touch Target >= 44px) */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onToggleBackgroundMode('standard')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              backgroundMode === 'standard'
                ? 'bg-[#06B6D4] text-[#070A12] shadow-md shadow-cyan-500/30'
                : 'bg-[#0F172A]/80 border border-[#26384D] text-[#A7B6C8]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Tiêu Chuẩn</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleBackgroundMode('tactical')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              backgroundMode === 'tactical'
                ? 'bg-[#06B6D4] text-[#070A12] shadow-md shadow-cyan-500/30'
                : 'bg-[#0F172A]/80 border border-[#26384D] text-[#A7B6C8]'
            }`}
          >
            <Radar className="w-4 h-4" />
            <span>Radar HUD</span>
          </button>
        </div>

        {/* Compact Pilot Summary Card */}
        <div className="p-3.5 rounded-2xl bg-[#0F172A]/90 border border-[#26384D] backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#142338] text-[#06B6D4] border border-[#26384D] font-bold">
                {character.callsign}
              </span>
              <span className="text-[11px] font-mono text-[#A7B6C8] truncate">
                {character.gender} · {character.age} tuổi
              </span>
            </div>
            <h3 className="text-lg font-black text-[#F1F5F9] truncate mt-0.5">
              {character.classCharacterName}
            </h3>
            <p className="text-xs text-[#06B6D4] truncate">{character.title}</p>
          </div>

          <button
            type="button"
            onClick={onSwitchToInfoView}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#06B6D4] text-[#070A12] font-bold text-xs font-mono shrink-0 shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>XEM HỒ SƠ</span>
          </button>
        </div>
      </footer>
    </div>
  )
}
