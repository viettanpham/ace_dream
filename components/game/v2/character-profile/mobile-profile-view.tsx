"use client"

import React, { useState } from "react"
import type { CharacterProfileV2, GalleryArtwork } from "@/lib/game/v2/character-profile-data"
import { V2_ROSTER_CHARACTERS } from "@/lib/game/v2/character-profile-data"
import { OverviewTab } from "./profile-tabs/overview-tab"
import { StoryTab } from "./profile-tabs/story-tab"
import { GearCompatTab } from "./profile-tabs/gear-compat-tab"
import { GalleryTab } from "./profile-tabs/gallery-tab"
import {
  ChevronLeft,
  ChevronRight,
  Home,
  FileText,
  Image as ImageIcon,
  ZoomIn,
  Shield,
  Heart,
  Layers,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from "lucide-react"

interface MobileProfileViewProps {
  character: CharacterProfileV2
  onSelectCharacter: (charId: string) => void
  onInspectArtwork: (artwork: GalleryArtwork) => void
  onBackToGame?: () => void
}

export type MobileDisplayState = "info" | "art"
export type ProfileTab = "overview" | "story" | "gear" | "gallery"
export type ShowcaseMode = "standard" | "tactical_hud"

export function MobileProfileView({
  character,
  onSelectCharacter,
  onInspectArtwork,
  onBackToGame,
}: MobileProfileViewProps) {
  const [displayState, setDisplayState] = useState<MobileDisplayState>("info")
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview")
  const [showcaseMode, setShowcaseMode] = useState<ShowcaseMode>("standard")

  const toggleShowcaseMode = () => {
    setShowcaseMode((prev) => (prev === "standard" ? "tactical_hud" : "standard"))
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#070A12] text-slate-100 font-sans select-none pb-20">
      {/* ====================================================================
          1. TOP NAVIGATION BAR (56px) CHUẨN CONCEPT
          ==================================================================== */}
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-800 bg-slate-950/95 px-3 backdrop-blur-md">
        <button
          onClick={onBackToGame}
          className="flex size-11 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white cursor-pointer"
          title="Quay lại"
        >
          <ChevronLeft className="size-6" />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 font-display font-black tracking-wider text-white text-sm">
            <span>STARFRONT</span>
            <span className="text-cyan-400 font-mono text-[11px] border border-cyan-500/30 px-1 rounded bg-cyan-950/60">
              FND-8
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">PILOT PROFILE V2</span>
        </div>

        <button
          onClick={onBackToGame}
          className="flex size-11 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white cursor-pointer"
          title="Về Trang Chủ"
        >
          <Home className="size-5" />
        </button>
      </header>

      {/* ====================================================================
          2. HORIZONTAL CHARACTER SELECTOR (TOP AVATARS LIST)
          ==================================================================== */}
      <div className="flex gap-2.5 overflow-x-auto p-3 border-b border-slate-800/80 bg-slate-950/70 scrollbar-none">
        {V2_ROSTER_CHARACTERS.map((char) => {
          const isSelected = char.id === character.id
          return (
            <button
              key={char.id}
              onClick={() => onSelectCharacter(char.id)}
              className={`flex flex-col items-center gap-1 shrink-0 cursor-pointer min-w-[56px] transition-all`}
            >
              <div
                className={`relative size-12 overflow-hidden rounded-lg border bg-slate-950 ${
                  isSelected
                    ? "border-cyan-400 ring-2 ring-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                    : "border-slate-700 opacity-80"
                }`}
              >
                <img
                  src={char.portraitAssetPath}
                  alt={char.classCharacterName}
                  className="size-full object-cover object-top"
                  onError={(e) => {
                    ;(e.target as HTMLElement).style.display = "none"
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-slate-400 font-mono -z-10">
                  {char.classCharacterName.slice(0, 2)}
                </div>
              </div>
              <span
                className={`text-[11px] font-mono truncate max-w-[58px] ${
                  isSelected ? "text-cyan-300 font-bold" : "text-slate-400"
                }`}
              >
                {char.classCharacterName}
              </span>
            </button>
          )
        })}
      </div>

      {/* ====================================================================
          3. SEGMENTED VIEW SWITCH: [ Xem Thông Tin ] vs [ Xem Tranh Nhân Vật ]
          (Touch target >= 44px)
          ==================================================================== */}
      <div className="p-3 bg-slate-950/90 border-b border-slate-800">
        <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-1">
          <button
            onClick={() => setDisplayState("info")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-bold transition-all cursor-pointer min-h-[44px] ${
              displayState === "info"
                ? "bg-cyan-500 text-black shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="size-4" />
            <span>Xem Thông Tin</span>
          </button>
          <button
            onClick={() => setDisplayState("art")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-bold transition-all cursor-pointer min-h-[44px] ${
              displayState === "art"
                ? "bg-cyan-500 text-black shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ImageIcon className="size-4" />
            <span>Xem Tranh Nhân Vật</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          4A. TRẠNG THÁI 1: MOBILE INFO VIEW (XEM HỒ SƠ & THÔNG TIN)
          ==================================================================== */}
      {displayState === "info" ? (
        <div className="p-4 space-y-5 animate-in fade-in duration-200">
          {/* Header Thông Tin Nhân Vật */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 shadow-md">
            <div className="flex items-start gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border-2 border-cyan-400 bg-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                <img
                  src={character.portraitAssetPath}
                  alt={character.classCharacterName}
                  className="size-full object-cover object-top"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Heart className="size-4 fill-emerald-500/20" />
                  <span className="text-xs font-mono font-bold uppercase">
                    UME Medical Corps
                  </span>
                </div>
                <h1 className="text-2xl font-black font-display tracking-wide text-white">
                  {character.classCharacterName}
                </h1>
                <p className="text-xs text-cyan-300 font-medium truncate">{character.title}</p>
                <p className="text-xs text-slate-400 truncate">{character.role}</p>
              </div>
            </div>

            {/* Badges danh mục */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="rounded bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                Medic
              </span>
              <span className="rounded bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 text-xs font-semibold text-cyan-300">
                Rescue
              </span>
              <span className="rounded bg-purple-950/80 border border-purple-500/40 px-2 py-0.5 text-xs font-semibold text-purple-300">
                SHD + ENE
              </span>
            </div>

            {/* HAI KHỐI RIÊNG BIỆT (QUOTE & SHORT BIO) */}
            <div className="space-y-2 border-t border-slate-800/80 pt-2.5">
              {/* Khối 1: Quote */}
              <div className="border-l-2 border-cyan-400 pl-3 py-1 bg-cyan-950/20 rounded-r">
                <p className="text-sm italic text-cyan-100 font-medium leading-relaxed">
                  {character.characterQuote}
                </p>
              </div>

              {/* Khối 2: Short Description */}
              <p className="text-sm leading-relaxed text-slate-300">
                {character.shortDescription}
              </p>
            </div>
          </section>

          {/* 4 Tabs Navigation (OVERVIEW / STORY / GEAR COMPAT / GALLERY) */}
          <nav className="flex rounded-lg border border-slate-800 bg-slate-900/80 p-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer min-h-[44px] ${
                activeTab === "overview"
                  ? "bg-cyan-500 text-black shadow-md font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              OVERVIEW
            </button>
            <button
              onClick={() => setActiveTab("story")}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer min-h-[44px] ${
                activeTab === "story"
                  ? "bg-cyan-500 text-black shadow-md font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              STORY
            </button>
            <button
              onClick={() => setActiveTab("gear")}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer min-h-[44px] ${
                activeTab === "gear"
                  ? "bg-cyan-500 text-black shadow-md font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              GEAR
            </button>
            <button
              onClick={() => setActiveTab("gallery")}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer min-h-[44px] ${
                activeTab === "gallery"
                  ? "bg-cyan-500 text-black shadow-md font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              GALLERY
            </button>
          </nav>

          {/* Nội Dung Tab Được Chọn */}
          <div className="space-y-4">
            {activeTab === "overview" && <OverviewTab character={character} />}
            {activeTab === "story" && <StoryTab character={character} />}
            {activeTab === "gear" && <GearCompatTab character={character} />}
            {activeTab === "gallery" && (
              <GalleryTab character={character} onInspectArtwork={onInspectArtwork} />
            )}
          </div>
        </div>
      ) : (
        /* ====================================================================
           4B. TRẠNG THÁI 2: MOBILE ART VIEW (XEM TRANH & 2 CONTROLS BỐI CẢNH)
           ==================================================================== */
        <div className="relative flex-1 flex flex-col items-center justify-between min-h-[75vh] p-4 overflow-hidden animate-in fade-in duration-200">
          {/* Lớp HUD Tác Chiến nếu ở mode 2 */}
          {showcaseMode === "tactical_hud" && (
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0%,transparent_75%)] border-2 border-cyan-500/30 m-3 rounded-2xl">
              <div className="absolute top-4 left-4 bg-slate-950/90 border border-cyan-500/50 px-2.5 py-1 rounded text-[10px] font-mono text-cyan-300">
                HUD SCAN ACTIVE
              </div>
            </div>
          )}

          {/* Tranh Nhân Vật Toàn Thân Tràn Màn Hình */}
          <div className="relative w-full flex-1 flex items-center justify-center py-4">
            <img
              src={character.fullbodyAssetPath}
              alt={character.fullLoreName}
              className={`max-h-[62vh] max-w-full object-contain transition-all duration-300 ${
                showcaseMode === "tactical_hud"
                  ? "drop-shadow-[0_0_25px_rgba(6,182,212,0.45)] brightness-105"
                  : "drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]"
              }`}
            />

            {/* HAI NÚT ĐIỀU KHIỂN CHUYỂN BỐI CẢNH (TOUCH TARGET >= 44PX) */}
            <button
              onClick={toggleShowcaseMode}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex size-12 items-center justify-center rounded-full bg-slate-900/90 border border-slate-700 text-white hover:bg-cyan-500 hover:text-black transition-colors cursor-pointer shadow-xl"
              title="Chuyển Bối Cảnh"
            >
              <ChevronLeft className="size-7" />
            </button>

            <button
              onClick={toggleShowcaseMode}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex size-12 items-center justify-center rounded-full bg-slate-900/90 border border-slate-700 text-white hover:bg-cyan-500 hover:text-black transition-colors cursor-pointer shadow-xl"
              title="Chuyển Bối Cảnh"
            >
              <ChevronRight className="size-7" />
            </button>
          </div>

          {/* Floating Action Bar bên phải cho Art View */}
          <div className="absolute top-6 right-6 flex flex-col gap-2 z-20">
            <button
              onClick={() => {
                const fullbody = character.artworks.find((a) => a.id === "valentine-fullbody")
                if (fullbody) onInspectArtwork(fullbody)
              }}
              className="flex size-11 items-center justify-center rounded-full bg-slate-900/90 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500 hover:text-black transition-colors shadow-lg cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn className="size-5" />
            </button>
            <button
              onClick={toggleShowcaseMode}
              className="flex size-11 items-center justify-center rounded-full bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white transition-colors shadow-lg cursor-pointer font-mono text-xs font-bold"
              title="Chế độ hiển thị"
            >
              {showcaseMode === "standard" ? "STD" : "HUD"}
            </button>
          </div>

          {/* Bottom Overlay Info & Controls */}
          <div className="w-full rounded-xl border border-slate-800 bg-slate-950/90 p-4 space-y-2 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black font-display text-white">
                  {character.classCharacterName}
                </h3>
                <p className="text-xs text-cyan-300">{character.title}</p>
              </div>

              <button
                onClick={() => setDisplayState("info")}
                className="flex items-center gap-1 rounded bg-cyan-500 text-black px-3 py-2 text-xs font-bold transition-all cursor-pointer min-h-[44px]"
              >
                <span>Xem Hồ Sơ Chi Tiết</span>
                <ChevronRight className="size-4" />
              </button>
            </div>

            <p className="text-xs italic text-cyan-100/90 border-l-2 border-cyan-400 pl-2 py-0.5">
              {character.characterQuote}
            </p>
          </div>
        </div>
      )}

      {/* Persistent Bottom Primary CTA Button */}
      <div className="fixed bottom-0 inset-x-0 z-30 p-3 bg-slate-950/95 border-t border-slate-800 backdrop-blur-md">
        <button
          onClick={() => {
            alert(`Đã chọn nhân vật: ${character.classCharacterName}`)
          }}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 via-cyan-400 to-teal-400 text-black font-black py-3 px-4 font-display text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer min-h-[48px]"
        >
          <span>CHỌN NHÂN VẬT</span>
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
