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
  ChevronDown,
  ZoomIn,
  Play,
  Shield,
  Heart,
  Zap,
  Sparkles,
  Layers,
  ArrowRight,
  Settings,
  X,
} from "lucide-react"

interface DesktopProfileViewProps {
  character: CharacterProfileV2
  onSelectCharacter: (charId: string) => void
  onInspectArtwork: (artwork: GalleryArtwork) => void
  onBackToGame?: () => void
}

export type ProfileTab = "overview" | "story" | "gear" | "gallery"
export type ShowcaseMode = "standard" | "tactical_hud"

export function DesktopProfileView({
  character,
  onSelectCharacter,
  onInspectArtwork,
  onBackToGame,
}: DesktopProfileViewProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview")
  const [showcaseMode, setShowcaseMode] = useState<ShowcaseMode>("standard")
  const [selectedThumbIndex, setSelectedThumbIndex] = useState<number>(0)

  // Chuyển đổi giữa 2 chế độ bối cảnh hiển thị (Showcase Controls 1 & 2)
  const toggleShowcaseMode = () => {
    setShowcaseMode((prev) => (prev === "standard" ? "tactical_hud" : "standard"))
  }

  return (
    <div className="flex h-screen w-full flex-col bg-[#070A12] text-slate-100 font-sans select-none overflow-hidden">
      {/* ====================================================================
          1. HEADER BAR CHUẨN CONCEPT DESKTOP
          ==================================================================== */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800/80 bg-slate-950/90 px-6 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded bg-cyan-500/20 text-cyan-400 font-black font-display text-sm border border-cyan-500/40">
              SF
            </span>
            <div className="flex items-center gap-2 font-display font-black tracking-wider text-white text-base">
              <span>STARFRONT</span>
              <span className="text-xs font-mono font-bold text-cyan-400 border border-cyan-500/30 px-1.5 py-0.2 rounded bg-cyan-950/60">
                WORLD V2
              </span>
            </div>
          </div>

          {/* Breadcrumb Navigation Profile Category */}
          <nav className="hidden lg:flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-slate-400 ml-6">
            <span className="hover:text-slate-200 cursor-pointer">STARFRONT V2</span>
            <span className="text-slate-600">&gt;</span>
            <span className="text-slate-300">HỒ SƠ PHI CÔNG // FND-8</span>
            <span className="text-slate-600">&gt;</span>
            <span className="text-cyan-400 flex items-center gap-1 font-bold">
              <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {character.classCharacterName.toUpperCase()}
            </span>
          </nav>
        </div>

        {/* Nút thoát / cài đặt */}
        <div className="flex items-center gap-2">
          {onBackToGame && (
            <button
              onClick={onBackToGame}
              className="flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-mono text-slate-300 hover:border-cyan-400 hover:text-white transition-colors cursor-pointer"
            >
              <span>Quay Lại Console</span>
            </button>
          )}
          <button
            className="flex size-8 items-center justify-center rounded border border-slate-700 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
            title="Cài đặt giao diện"
          >
            <Settings className="size-4" />
          </button>
        </div>
      </header>

      {/* ====================================================================
          2. NỘI DUNG CHÍNH: 3 CỘT (ROSTER TRÁI - SHOWCASE GIỮA - PROFILE PHẢI)
          ==================================================================== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ==================================================================
            CỘT 1 (BÊN TRÁI): ROSTER 12 NHÂN VẬT & CLASS LIST
            ================================================================== */}
        <aside className="w-72 xl:w-80 shrink-0 border-r border-slate-800/80 bg-slate-950/80 flex flex-col z-10">
          <div className="flex items-center gap-2 border-b border-slate-800/80 p-3.5">
            <span className="h-4 w-1 bg-cyan-400 rounded-full" />
            <h2 className="text-xs font-mono font-bold tracking-widest text-slate-200 uppercase">
              Character Class ({V2_ROSTER_CHARACTERS.length})
            </h2>
          </div>

          {/* Danh sách 12 nhân vật dạng cuộn */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
            {V2_ROSTER_CHARACTERS.map((char) => {
              const isSelected = char.id === character.id
              const isValentine = char.id === "valentine"

              return (
                <button
                  key={char.id}
                  onClick={() => onSelectCharacter(char.id)}
                  className={`w-full flex items-center gap-3 rounded-lg border p-2.5 transition-all cursor-pointer text-left ${
                    isSelected
                      ? "border-cyan-400 bg-gradient-to-r from-cyan-950/60 to-slate-900/90 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                      : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70"
                  }`}
                >
                  {/* Thumbnail Avatar */}
                  <div
                    className={`relative size-12 shrink-0 overflow-hidden rounded-md border bg-slate-950 ${
                      isSelected ? "border-cyan-400" : "border-slate-700"
                    }`}
                  >
                    <img
                      src={resolveImageUrl(char.portraitAssetPath)}
                      alt={char.classCharacterName}
                      className="size-full object-cover object-top"
                      onError={(e) => {
                        // Fallback avatar nếu ảnh chưa đồng bộ
                        ;(e.target as HTMLElement).style.display = "none"
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-500 font-mono -z-10">
                      {char.classCharacterName.slice(0, 2)}
                    </div>
                  </div>

                  {/* Thông tin vắn tắt */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`font-bold text-sm truncate ${
                          isSelected ? "text-cyan-300 font-display" : "text-slate-200"
                        }`}
                      >
                        {char.classCharacterName}
                      </h4>
                      {isValentine && (
                        <span className="rounded bg-cyan-500/20 px-1.5 py-0.2 text-[9px] font-mono font-bold text-cyan-300 border border-cyan-500/40">
                          V2 READY
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{char.role}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Mũi tên chỉ báo cuộn */}
          <div className="border-t border-slate-800/60 py-2 flex justify-center text-slate-500">
            <ChevronDown className="size-4 animate-bounce" />
          </div>
        </aside>

        {/* ==================================================================
            CỘT 2 (Ở GIỮA): SHOWCASE NHÂN VẬT & 2 CONTROLS BỐI CẢNH
            ================================================================== */}
        <section className="relative flex-1 flex flex-col items-center justify-between overflow-hidden bg-slate-950">
          {/* Nền bối cảnh không gian sâu thẳm */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-[#070A12] to-black -z-20" />

          {/* Lớp hiển thị Bối Cảnh B (Tactical HUD & Shield Telemetry Overlay) */}
          {showcaseMode === "tactical_hud" && (
            <div className="absolute inset-0 pointer-events-none -z-10 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)]">
              {/* Lưới tọa độ HUD và radar quang học */}
              <div className="absolute inset-0 border border-cyan-500/20 m-6 rounded-xl" />
              <div className="absolute top-8 left-8 flex items-center gap-2 font-mono text-xs text-cyan-400 bg-slate-950/80 px-3 py-1.5 rounded border border-cyan-500/40">
                <span className="size-2 rounded-full bg-cyan-400 animate-ping" />
                <span>BIOMEDICAL TELEMETRY HUD // FREQ: 142.8 MHz</span>
              </div>
              <div className="absolute top-8 right-8 font-mono text-xs text-cyan-300/80 bg-slate-950/80 px-3 py-1.5 rounded border border-cyan-500/30">
                SHIELD HARMONICS: 98.4%
              </div>
            </div>
          )}

          {/* Tranh nhân vật toàn thân sắc nét trung tâm */}
          <div className="relative flex-1 w-full flex items-center justify-center p-4">
            <img
              src={resolveImageUrl(character.fullbodyAssetPath)}
              alt={character.fullLoreName}
              className={`max-h-[80vh] max-w-full object-contain transition-all duration-500 ${
                showcaseMode === "tactical_hud"
                  ? "drop-shadow-[0_0_35px_rgba(6,182,212,0.45)] brightness-105"
                  : "drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]"
              }`}
            />

            {/* Trích dẫn nghệ thuật chữ viết bay bổng trên tranh (Quote Banner) */}
            <div className="absolute left-8 top-16 max-w-xs font-serif italic text-cyan-100/90 text-lg leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              “Chúng ta sẽ đưa mọi người về an toàn.”
            </div>

            {/* HAI ĐIỀU KHIỂN CHUYỂN BỐI CẢNH (CONTROLS 1 & 2 NẰM 2 BÊN TRANH) */}
            <button
              onClick={toggleShowcaseMode}
              className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center justify-center size-12 rounded-full bg-slate-900/80 hover:bg-cyan-500 hover:text-black border border-slate-700/80 transition-all cursor-pointer shadow-xl group"
              title="Chuyển Bối Cảnh 1: Tiêu Chuẩn (Standard Showcase)"
            >
              <ChevronLeft className="size-7 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={toggleShowcaseMode}
              className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center justify-center size-12 rounded-full bg-slate-900/80 hover:bg-cyan-500 hover:text-black border border-slate-700/80 transition-all cursor-pointer shadow-xl group"
              title="Chuyển Bối Cảnh 2: Tác Chiến & HUD Y Sinh (Tactical HUD Mode)"
            >
              <ChevronRight className="size-7 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Nút Phóng to / Soi tranh chi tiết */}
            <button
              onClick={() => {
                const verifiedFullbody = character.artworks.find(
                  (a) => a.id === "valentine-fullbody"
                ) || {
                  id: "valentine-fullbody",
                  title: "Tranh Toàn Thân Chiến Trường",
                  category: "base",
                  path: character.fullbodyAssetPath,
                  isAvailableOnDisk: true,
                  status: "verified_webp",
                }
                onInspectArtwork(verifiedFullbody)
              }}
              className="absolute bottom-28 right-8 flex items-center gap-2 rounded-full bg-slate-900/80 border border-cyan-500/50 px-3.5 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500 hover:text-black transition-all cursor-pointer shadow-lg"
              title="Mở trình soi tranh chi tiết"
            >
              <ZoomIn className="size-4" />
              <span>Soi Tranh 4K</span>
            </button>
          </div>

          {/* Bottom Bar khu vực giữa: Character Trailer & Thumbnail Carousel */}
          <div className="w-full flex items-center justify-between px-8 py-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent border-t border-slate-800/40 z-10">
            {/* Nút Trailer nhân vật */}
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 rounded-lg p-1.5 pr-3 shadow-md">
              <button
                onClick={() => {
                  const portrait = character.artworks.find((a) => a.id === "valentine-portrait")
                  if (portrait) onInspectArtwork(portrait)
                }}
                className="flex size-9 items-center justify-center rounded bg-cyan-500 text-black hover:bg-cyan-400 transition-colors cursor-pointer"
                title="Xem cận cảnh chân dung"
              >
                <Play className="size-4 fill-black" />
              </button>
              <div>
                <span className="block text-[11px] font-mono font-bold tracking-wider text-slate-200 uppercase">
                  CHARACTER SHOWCASE
                </span>
                <span className="block text-[10px] text-cyan-400 font-mono">
                  {showcaseMode === "standard" ? "Chế Độ Tiêu Chuẩn" : "Chế Độ HUD Tác Chiến"}
                </span>
              </div>
            </div>

            {/* Carousel ảnh nhỏ bên dưới */}
            <div className="flex items-center gap-2">
              <button className="flex size-7 items-center justify-center rounded border border-slate-800 bg-slate-900 text-slate-400 hover:text-white cursor-pointer">
                <ChevronLeft className="size-4" />
              </button>

              <div className="flex items-center gap-2">
                {character.artworks.slice(0, 4).map((art, idx) => (
                  <button
                    key={art.id}
                    onClick={() => {
                      setSelectedThumbIndex(idx)
                      if (art.isAvailableOnDisk) {
                        onInspectArtwork(art)
                      }
                    }}
                    className={`relative size-12 overflow-hidden rounded-md border transition-all cursor-pointer ${
                      selectedThumbIndex === idx
                        ? "border-cyan-400 ring-2 ring-cyan-500/40"
                        : "border-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <img
                      src={resolveImageUrl(art.path)}
                      alt={art.title}
                      className="size-full object-cover object-top"
                      onError={(e) => {
                        ;(e.target as HTMLElement).style.display = "none"
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-slate-400 bg-slate-900 -z-10">
                      {art.id.replace("valentine-", "").slice(0, 4)}
                    </div>
                  </button>
                ))}
              </div>

              <button className="flex size-7 items-center justify-center rounded border border-slate-800 bg-slate-900 text-slate-400 hover:text-white cursor-pointer">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ==================================================================
            CỘT 3 (BÊN PHẢI): HỒ SƠ CHI TIẾT & 4 TABS THÔNG TIN
            ================================================================== */}
        <aside className="w-[440px] xl:w-[480px] shrink-0 border-l border-slate-800/80 bg-slate-950/90 flex flex-col z-10">
          {/* Header Thông Tin Nhận Diện */}
          <div className="p-5 border-b border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-0.5 text-xs font-mono font-bold text-cyan-300 uppercase">
                <Shield className="size-3.5" />
                <span>CLASS PROFILE</span>
              </span>

              {/* Insignia / Quân hiệu UME Medical Corps */}
              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] border border-slate-800 px-2 py-0.5 rounded bg-slate-900">
                <Heart className="size-3 text-red-400" />
                <span>UME MEDICAL CORPS</span>
              </div>
            </div>

            {/* Tên & Danh hiệu */}
            <div>
              <h1 className="text-2xl xl:text-3xl font-black font-display tracking-wide text-white">
                {character.classCharacterName}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 text-sm text-cyan-300 font-medium">
                <span>{character.title}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300">{character.role}</span>
              </div>
            </div>

            {/* Role Tags Badges */}
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                <Heart className="size-3" />
                <span>Medic</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 text-xs font-semibold text-cyan-300">
                <Shield className="size-3" />
                <span>Rescue</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-purple-950/80 border border-purple-500/40 px-2 py-0.5 text-xs font-semibold text-purple-300">
                <Layers className="size-3" />
                <span>SHD + ENE</span>
              </span>
            </div>

            {/* HAI KHỐI VĂN BẢN ĐỘC LẬP (QUOTE & SHORT BIO) */}
            <div className="space-y-2 pt-1">
              {/* Khối 1: characterQuote */}
              <div className="border-l-2 border-cyan-400 pl-3 py-0.5 bg-cyan-950/20 rounded-r">
                <p className="text-[15px] italic text-cyan-100 font-medium leading-relaxed">
                  {character.characterQuote}
                </p>
              </div>

              {/* Khối 2: shortDescription */}
              <p className="text-sm leading-relaxed text-slate-300">
                {character.shortDescription}
              </p>
            </div>
          </div>

          {/* Segmented Tab Bar 4 Tabs (OVERVIEW / STORY / GEAR COMPAT / GALLERY) */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 p-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer min-h-[40px] ${
                activeTab === "overview"
                  ? "bg-cyan-500 text-black shadow-md font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              OVERVIEW
            </button>
            <button
              onClick={() => setActiveTab("story")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer min-h-[40px] ${
                activeTab === "story"
                  ? "bg-cyan-500 text-black shadow-md font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              STORY
            </button>
            <button
              onClick={() => setActiveTab("gear")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer min-h-[40px] ${
                activeTab === "gear"
                  ? "bg-cyan-500 text-black shadow-md font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              GEAR COMPAT
            </button>
            <button
              onClick={() => setActiveTab("gallery")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer min-h-[40px] ${
                activeTab === "gallery"
                  ? "bg-cyan-500 text-black shadow-md font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              GALLERY
            </button>
          </div>

          {/* Vùng nội dung Tab cuộn độc lập */}
          <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
            {activeTab === "overview" && <OverviewTab character={character} />}
            {activeTab === "story" && <StoryTab character={character} />}
            {activeTab === "gear" && <GearCompatTab character={character} />}
            {activeTab === "gallery" && (
              <GalleryTab character={character} onInspectArtwork={onInspectArtwork} />
            )}
          </div>

          {/* Footer trạng thái phân hệ V2 */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>PILOT PROFILE V2 // FND-8</span>
            <span className="text-cyan-400 font-semibold">{character.classCharacterName} · ACTIVE</span>
          </div>
        </aside>
      </div>
    </div>
  )
}
