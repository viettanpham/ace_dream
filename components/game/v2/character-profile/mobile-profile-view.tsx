"use client"

import React, { useState } from "react"
import type { CharacterProfileV2, GalleryArtwork } from "@/lib/game/v2/character-profile-data"
import { V2_ROSTER_CHARACTERS } from "@/lib/game/v2/character-profile-data"
import { resolveImageUrl } from "@/lib/game/assets/image-resolver"
import { OverviewTab } from "./profile-tabs/overview-tab"
import { StoryTab } from "./profile-tabs/story-tab"
import { GearCompatTab } from "./profile-tabs/gear-compat-tab"
import { GalleryTab } from "./profile-tabs/gallery-tab"
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  ZoomIn,
  Heart,
  Sparkles,
  Layers,
  Compass,
  ArrowLeft,
  ExternalLink,
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
  const [displayState, setDisplayState] = useState<MobileDisplayState>("art")
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview")
  const [showcaseMode, setShowcaseMode] = useState<ShowcaseMode>("standard")
  const [activeArtIndex, setActiveArtIndex] = useState<number>(0)

  // Danh sách các nhân vật trong roster V2
  const roster = V2_ROSTER_CHARACTERS
  const currentIndex = roster.findIndex((c) => c.id === character.id)

  const handlePrevCharacter = () => {
    const prevIdx = (currentIndex - 1 + roster.length) % roster.length
    onSelectCharacter(roster[prevIdx].id)
  }

  const handleNextCharacter = () => {
    const nextIdx = (currentIndex + 1) % roster.length
    onSelectCharacter(roster[nextIdx].id)
  }

  const toggleShowcaseMode = () => {
    setShowcaseMode((prev) => (prev === "standard" ? "tactical_hud" : "standard"))
  }

  // Danh sách ảnh mẫu cho thumbnail carousel ở Art View
  const artThumbnails = [
    {
      id: "fullbody",
      title: "Toàn Thân (Fullbody)",
      path: character.fullbodyAssetPath,
      category: "Toàn Thân",
    },
    {
      id: "portrait",
      title: "Chân Dung 1:1",
      path: character.portraitAssetPath,
      category: "Chân Dung",
    },
    {
      id: "tactical",
      title: "Chế Độ Chiến Lược",
      path: character.fullbodyAssetPath,
      category: "Buồng Lái",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#05070D] text-slate-100 font-sans select-none pb-6">
      {/* ====================================================================
          1. TOP NAVIGATION BAR (TỐI GIẢN, KHÔNG TRÙNG HEADER SHELL)
          ==================================================================== */}
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/90 px-3 backdrop-blur-md">
        <button
          onClick={onBackToGame}
          className="flex h-11 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-3 text-sm font-semibold text-slate-300 hover:text-white cursor-pointer active:scale-95 transition-all"
          title="Quay lại buồng lái"
        >
          <ArrowLeft className="size-4" />
          <span>Quay Lại</span>
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 font-display font-black tracking-wider text-white text-sm">
            <span>HỒ SƠ PHI CÔNG</span>
            <span className="text-cyan-400 font-mono text-[11px] border border-cyan-500/30 px-1 rounded bg-cyan-950/60">
              V2 // FND-8
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400 truncate max-w-[150px]">
            {character.classCharacterName} · {character.callsign}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const fullbodyArt = character.artworks.find((a) => a.id === "valentine-fullbody")
              if (fullbodyArt) onInspectArtwork(fullbodyArt)
            }}
            className="flex size-11 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/90 text-cyan-300 hover:text-white cursor-pointer active:scale-95 transition-all"
            title="Soi toàn màn hình"
          >
            <ZoomIn className="size-5" />
          </button>
        </div>
      </header>

      {/* ====================================================================
          2. HORIZONTAL CHARACTER SELECTOR (KHÔNG CẮT TÊN, TÊN ĐỦ 100%)
          ==================================================================== */}
      <div className="flex gap-2 overflow-x-auto p-2.5 border-b border-slate-800/80 bg-slate-950/80 scrollbar-none">
        {roster.map((char) => {
          const isSelected = char.id === character.id
          return (
            <button
              key={char.id}
              onClick={() => onSelectCharacter(char.id)}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer min-w-[76px] transition-all"
            >
              <div
                className={`relative size-13 overflow-hidden rounded-xl border bg-slate-950 transition-transform ${
                  isSelected
                    ? "border-cyan-400 ring-2 ring-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.4)] scale-105"
                    : "border-slate-800 hover:border-slate-700 opacity-80"
                }`}
              >
                <img
                  src={resolveImageUrl(char.portraitAssetPath)}
                  alt={char.classCharacterName}
                  className="size-full object-cover object-top"
                  onError={(e) => {
                    ;(e.target as HTMLElement).style.display = "none"
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-400 font-mono -z-10">
                  {char.classCharacterName.slice(0, 2)}
                </div>
              </div>
              <span
                className={`text-xs font-mono text-center truncate max-w-[76px] px-0.5 leading-tight ${
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
          3. SEGMENTED VIEW SWITCH: [ 🖼️ Xem Tranh ] vs [ 📄 Xem Thông Tin ]
          (Touch target >= 44px, thiết kế pill bo tròn hiện đại)
          ==================================================================== */}
      <div className="px-3 pt-2.5 pb-2 bg-slate-950/90 border-b border-slate-800/80">
        <div className="flex rounded-lg border border-slate-800 bg-slate-900/90 p-1">
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
          <button
            onClick={() => setDisplayState("info")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-bold transition-all cursor-pointer min-h-[44px] ${
              displayState === "info"
                ? "bg-cyan-500 text-black shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="size-4" />
            <span>Xem Hồ Sơ & Story</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          4A. TRẠNG THÁI 1: MOBILE ART VIEW (BỐ CỤC FULL-SCREEN CHUẨN CONCEPT)
          ==================================================================== */}
      {displayState === "art" ? (
        <div className="relative flex-1 flex flex-col justify-between w-full min-h-[calc(100vh-190px)] overflow-hidden animate-in fade-in duration-200">
          {/* Background vũ trụ sâu thẳm */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#05070D] to-[#030508] -z-10" />

          {/* Tactical HUD Overlay khi ở chế độ HUD */}
          {showcaseMode === "tactical_hud" && (
            <div className="absolute inset-2 pointer-events-none border border-cyan-500/40 rounded-2xl z-10 flex flex-col justify-between p-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 bg-slate-950/80 px-2.5 py-1 rounded border border-cyan-500/30 w-fit">
                <span>[ TACTICAL HUD SCAN ACTIVE ]</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400/80">
                <span>BIO-SYNC: 99.4%</span>
                <span>STATUS: COMBAT READY</span>
              </div>
            </div>
          )}

          {/* VÙNG TRANH NHÂN VẬT GẦN FULL-SCREEN (KHÔNG BỊ CẮT PHẦN QUAN TRỌNG) */}
          <div className="relative w-full flex-1 flex items-center justify-center px-2 py-2 min-h-[56vh]">
            <img
              src={resolveImageUrl(character.fullbodyAssetPath)}
              alt={character.fullLoreName}
              className={`max-h-[66vh] w-auto max-w-full object-contain object-bottom sm:object-center transition-all duration-300 drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)] ${
                showcaseMode === "tactical_hud"
                  ? "filter brightness-105 drop-shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                  : ""
              }`}
            />

            {/* HAI NÚT ĐIỀU KHIỂN CHUYỂN NHÂN VẬT / BỐI CẢNH (TOUCH TARGET >= 44PX) */}
            <button
              onClick={handlePrevCharacter}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex size-12 items-center justify-center rounded-full bg-slate-950/85 border border-slate-700/80 text-white hover:border-cyan-400 hover:text-cyan-300 active:scale-95 transition-all cursor-pointer shadow-2xl backdrop-blur-md z-20"
              title="Nhân vật trước"
            >
              <ChevronLeft className="size-7" />
            </button>

            <button
              onClick={handleNextCharacter}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex size-12 items-center justify-center rounded-full bg-slate-950/85 border border-slate-700/80 text-white hover:border-cyan-400 hover:text-cyan-300 active:scale-95 transition-all cursor-pointer shadow-2xl backdrop-blur-md z-20"
              title="Nhân vật kế tiếp"
            >
              <ChevronRight className="size-7" />
            </button>

            {/* FLOATING ACTION PILLS BÊN PHẢI (CHUẨN CONCEPT MOBILE ART) */}
            <div className="absolute top-4 right-3 flex flex-col gap-2.5 z-20">
              <button
                onClick={toggleShowcaseMode}
                className={`flex size-11 items-center justify-center rounded-full border shadow-lg cursor-pointer transition-all active:scale-95 text-xs font-mono font-bold ${
                  showcaseMode === "tactical_hud"
                    ? "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                    : "bg-slate-900/90 text-slate-300 border-slate-700 hover:text-white"
                }`}
                title="Chế độ 2D / HUD"
              >
                2D
              </button>

              <button
                onClick={() => {
                  const fullbody = character.artworks.find((a) => a.id === "valentine-fullbody")
                  if (fullbody) onInspectArtwork(fullbody)
                }}
                className="flex size-11 items-center justify-center rounded-full bg-slate-900/90 border border-slate-700 text-cyan-300 hover:text-white hover:border-cyan-400 shadow-lg cursor-pointer transition-all active:scale-95"
                title="Phóng to soi chi tiết"
              >
                <ZoomIn className="size-5" />
              </button>
            </div>
          </div>

          {/* BOTTOM OVERLAY CARD: BẢNG THÔNG TIN NỔI TRÊN NỀN TRANH CHUẨN CONCEPT */}
          <div className="w-full bg-gradient-to-t from-slate-950 via-slate-950/95 to-slate-950/70 border-t border-slate-800/80 px-4 pt-4 pb-4 space-y-3 backdrop-blur-md shadow-2xl">
            {/* Hàng 1: Insignia + Tên + Vai Trò */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Heart className="size-3.5 fill-emerald-500/20" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    UME Medical Corps
                  </span>
                </div>
                <h2 className="text-2xl font-black font-display text-white tracking-wide">
                  + {character.classCharacterName}
                </h2>
                <p className="text-sm text-cyan-300 font-medium">{character.title}</p>
                <p className="text-xs text-slate-400">{character.role}</p>
              </div>

              {/* Nút chuyển nhanh sang Info View */}
              <button
                onClick={() => setDisplayState("info")}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-500 text-black px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer min-h-[44px] shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:bg-cyan-400 active:scale-95 shrink-0"
              >
                <FileText className="size-4" />
                <span>Xem Hồ Sơ</span>
              </button>
            </div>

            {/* Hàng 2: Mini 3-Thumbnail Carousel */}
            <div className="flex items-center gap-2 pt-1 overflow-x-auto scrollbar-none">
              {artThumbnails.map((thumb, idx) => {
                const isActive = activeArtIndex === idx
                return (
                  <button
                    key={thumb.id}
                    onClick={() => {
                      setActiveArtIndex(idx)
                      if (thumb.id === "portrait") {
                        const portraitArt = character.artworks.find((a) => a.id === "valentine-portrait")
                        if (portraitArt) onInspectArtwork(portraitArt)
                      } else {
                        const fullbodyArt = character.artworks.find((a) => a.id === "valentine-fullbody")
                        if (fullbodyArt) onInspectArtwork(fullbodyArt)
                      }
                    }}
                    className={`relative flex items-center gap-2 rounded-lg border p-1.5 bg-slate-900/80 transition-all cursor-pointer min-h-[44px] shrink-0 ${
                      isActive
                        ? "border-cyan-400 bg-cyan-950/40 text-cyan-200"
                        : "border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="size-8 rounded overflow-hidden bg-slate-950 shrink-0">
                      <img
                        src={resolveImageUrl(thumb.path)}
                        alt={thumb.title}
                        className="size-full object-cover object-top"
                      />
                    </div>
                    <div className="text-left pr-2">
                      <p className="text-xs font-bold font-mono text-slate-200 leading-tight">
                        {thumb.category}
                      </p>
                      <p className="text-[10px] text-slate-400">Chạm để soi</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Hàng 3: Lời Thề Nhân Vật (Quote) */}
            <div className="border-l-2 border-cyan-400 pl-3 py-1 bg-cyan-950/20 rounded-r">
              <p className="text-sm italic text-cyan-100 font-medium leading-relaxed">
                {character.characterQuote}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ====================================================================
           4B. TRẠNG THÁI 2: MOBILE INFO VIEW (HỒ SƠ, STORY & SPECIFICATIONS)
           Typography V2: Body 16px, Story 17-18px, Secondary 14px
           ==================================================================== */
        <div className="p-3.5 space-y-4 animate-in fade-in duration-200">
          {/* Header Thông Tin Tóm Tắt (Gọn gàng, loại bỏ card nesting) */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 shadow-md">
            <div className="flex items-start gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border-2 border-cyan-400 bg-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.35)]">
                <img
                  src={resolveImageUrl(character.portraitAssetPath)}
                  alt={character.classCharacterName}
                  className="size-full object-cover object-top"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Heart className="size-3.5 fill-emerald-500/20" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    UME Medical Corps
                  </span>
                </div>
                <h1 className="text-2xl font-black font-display tracking-wide text-white">
                  {character.classCharacterName}
                </h1>
                <p className="text-sm text-cyan-300 font-medium truncate">{character.title}</p>
                <p className="text-sm text-slate-400 truncate">{character.role}</p>
              </div>
            </div>

            {/* Badges danh mục phân loại */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="rounded bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                Medic Support
              </span>
              <span className="rounded bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-1 text-xs font-semibold text-cyan-300">
                Rescue Command
              </span>
              <span className="rounded bg-purple-950/80 border border-purple-500/40 px-2.5 py-1 text-xs font-semibold text-purple-300">
                SHD + ENE Focus
              </span>
            </div>

            {/* Quote & Short Bio */}
            <div className="space-y-2.5 border-t border-slate-800/80 pt-3">
              <div className="border-l-2 border-cyan-400 pl-3 py-1 bg-cyan-950/20 rounded-r">
                <p className="text-base italic text-cyan-100 font-medium leading-relaxed">
                  {character.characterQuote}
                </p>
              </div>

              <p className="text-base leading-relaxed text-slate-200">
                {character.shortDescription}
              </p>
            </div>
          </section>

          {/* 4 Tabs Navigation (OVERVIEW / STORY / GEAR / GALLERY) */}
          <nav className="flex rounded-lg border border-slate-800 bg-slate-900/90 p-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-wider rounded transition-all cursor-pointer min-h-[44px] ${
                activeTab === "overview"
                  ? "bg-cyan-500 text-black shadow-md font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              OVERVIEW
            </button>
            <button
              onClick={() => setActiveTab("story")}
              className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-wider rounded transition-all cursor-pointer min-h-[44px] ${
                activeTab === "story"
                  ? "bg-cyan-500 text-black shadow-md font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              STORY
            </button>
            <button
              onClick={() => setActiveTab("gear")}
              className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-wider rounded transition-all cursor-pointer min-h-[44px] ${
                activeTab === "gear"
                  ? "bg-cyan-500 text-black shadow-md font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              GEAR
            </button>
            <button
              onClick={() => setActiveTab("gallery")}
              className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-wider rounded transition-all cursor-pointer min-h-[44px] ${
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
      )}
    </div>
  )
}
