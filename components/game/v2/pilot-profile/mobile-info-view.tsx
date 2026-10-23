'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  CharacterProfileV2,
  GalleryArtwork,
} from '@/lib/game/v2/character-profile-data'
import { resolveImageUrl } from '@/lib/game/assets/image-resolver'
import { PilotAvatar } from './pilot-avatar'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/game/v2/ui'
import { StoryTab } from './tabs/story-tab'
import { GearCompatTab } from './tabs/gear-compat-tab'
import { GalleryTab } from './tabs/gallery-tab'
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Heart,
  Zap,
  Sparkles,
  Award,
  Crosshair,
  Home,
  FileText,
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
    <div className="relative w-full min-h-[100dvh] bg-[#070A12] text-[#F1F5F9] flex flex-col pb-24 overflow-x-hidden select-none">
      {/* Ambient Sci-Fi Background Layer từ Artwork của Phi Công */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <Image
          src={resolveImageUrl(activeCharacter.fullbodyAssetPath)}
          alt={activeCharacter.classCharacterName}
          fill
          priority
          referrerPolicy="no-referrer"
          className="object-cover object-top opacity-15 filter blur-3xl scale-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070A12]/80 via-[#070A12]/95 to-[#070A12]" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#00d4ff15_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* 1. TOP HEADER (Chuẩn Concept PNG) */}
      <header className="sticky top-0 z-40 bg-[#090D18]/95 backdrop-blur-md border-b border-[#1E2D42] px-3.5 py-2 flex items-center justify-between">
        <Link
          href="/"
          className="p-1.5 rounded-lg border border-[#1E2D42] bg-[#0E1626] text-[#A7B6C8] hover:text-[#00D4FF]"
          title="Về Trang Chủ"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>

        <div className="flex flex-col items-center">
          <span className="font-mono font-black text-xs tracking-widest text-white flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
            <span>STARFRONT</span>
          </span>
          <span className="text-[9px] font-mono text-[#00D4FF] uppercase tracking-wider">
            WORLD FND-8
          </span>
        </div>

        <Link
          href="/"
          className="p-1.5 rounded-lg border border-[#1E2D42] bg-[#0E1626] text-[#A7B6C8] hover:text-[#00D4FF]"
          title="Trang Chủ"
        >
          <Home className="w-4 h-4" />
        </Link>
      </header>

      {/* 2. DẢI AVATAR ROSTER NGANG PHÍA TRÊN (Chuẩn Concept Mobile) */}
      <div className="p-2.5 bg-[#090D18]/80 border-b border-[#1E2D42] overflow-x-auto scrollbar-none">
        <div className="flex gap-2 min-w-max">
          {roster.map((char) => {
            const isSelected = char.id === activeCharacter.id

            return (
              <button
                key={char.id}
                type="button"
                onClick={() => onSelectCharacter(char)}
                className={`min-w-[64px] p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#142338] border-[#00D4FF] shadow-[0_0_10px_rgba(0,212,255,0.3)] ring-1 ring-[#00D4FF]/60'
                    : 'bg-[#0B111E]/80 border-[#1E2D42]'
                }`}
              >
                <PilotAvatar
                  character={char}
                  isSelected={isSelected}
                  className="w-10 h-10"
                />
                <span
                  className={`text-[10px] font-bold font-mono truncate max-w-[60px] ${
                    isSelected ? 'text-[#00D4FF]' : 'text-[#A7B6C8]'
                  }`}
                >
                  {char.classCharacterName}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. TABS HÀNG NGANG (OVERVIEW | STORY | GEAR COMPAT | GALLERY) */}
      <div className="px-3 pt-2">
        <Tabs value={activeTab} onValueChange={onTabChange} variant="segmented" className="w-full">
          <TabsList className="grid grid-cols-4 mb-3">
            <TabsTrigger value="overview">OVERVIEW</TabsTrigger>
            <TabsTrigger value="story">STORY</TabsTrigger>
            <TabsTrigger value="gear">GEAR</TabsTrigger>
            <TabsTrigger value="gallery">GALLERY</TabsTrigger>
          </TabsList>

          {/* TAB OVERVIEW: BÁM SÁT 100% CONCEPT MOBILE APPROVED */}
          <TabsContent value="overview" className="space-y-4">
            {/* Header Danh Tính Nhân Vật */}
            <div className="p-3.5 rounded-xl bg-[#090D18]/90 border border-[#1E2D42] space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#10B981]/20 border border-[#10B981]/50 flex items-center justify-center text-[#10B981] shrink-0">
                  <Heart className="w-5 h-5 text-[#10B981]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-black font-mono text-white tracking-wide leading-tight">
                    {activeCharacter.classCharacterName}
                  </h1>
                  <div className="text-xs font-semibold text-[#A7B6C8] mt-0.5">
                    {activeCharacter.title}
                  </div>
                  <div className="text-[11px] text-[#7D90A6] mt-0.5">
                    {activeCharacter.role}
                  </div>
                </div>
              </div>

              {/* Quote Nhân Vật (In nghiêng bay bổng) */}
              <div className="p-2.5 rounded-lg bg-[#0E1626]/80 border-l-2 border-[#00D4FF] text-xs italic font-serif text-[#F1F5F9] leading-relaxed">
                "{activeCharacter.characterQuote}"
              </div>

              {/* Hàng Badges Đầy Đủ */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/40">
                  SHD
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/40">
                  ENE
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/40">
                  Support
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40">
                  Medic
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/40">
                  Rescue
                </span>
              </div>

              {/* Mô Tả Ngắn */}
              <p className="text-xs text-[#CBD5E1] leading-relaxed pt-1">
                {activeCharacter.shortDescription}
              </p>
            </div>

            {/* SECTION: BASE ATTRIBUTES (6 Thanh Đo Màu Sắc) */}
            <div className="p-3.5 rounded-xl bg-[#090D18]/90 border border-[#1E2D42] space-y-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-3.5 bg-[#00D4FF] rounded-full shadow-[0_0_6px_#00D4FF]" />
                <h3 className="text-xs font-black uppercase font-mono tracking-wider text-white">
                  BASE ATTRIBUTES
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs font-mono">
                {/* ATK */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[#EF4444] font-bold flex items-center gap-1">
                    <Crosshair className="w-3 h-3" />
                    <span>ATK</span>
                  </span>
                  <div className="flex-1 h-2 bg-[#1A2638] rounded-full overflow-hidden mx-1">
                    <div
                      className="h-full bg-[#EF4444] rounded-full"
                      style={{ width: `${(activeCharacter.baseAttributes.atk / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-bold">{activeCharacter.baseAttributes.atk}</span>
                </div>

                {/* ENE */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[#F59E0B] font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>ENE</span>
                  </span>
                  <div className="flex-1 h-2 bg-[#1A2638] rounded-full overflow-hidden mx-1">
                    <div
                      className="h-full bg-[#F59E0B] rounded-full"
                      style={{ width: `${(activeCharacter.baseAttributes.ene / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-bold">{activeCharacter.baseAttributes.ene}</span>
                </div>

                {/* DEF */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[#3B82F6] font-bold flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span>DEF</span>
                  </span>
                  <div className="flex-1 h-2 bg-[#1A2638] rounded-full overflow-hidden mx-1">
                    <div
                      className="h-full bg-[#3B82F6] rounded-full"
                      style={{ width: `${(activeCharacter.baseAttributes.def / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-bold">{activeCharacter.baseAttributes.def}</span>
                </div>

                {/* SHD */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[#8B5CF6] font-bold flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span>SHD</span>
                  </span>
                  <div className="flex-1 h-2 bg-[#1A2638] rounded-full overflow-hidden mx-1">
                    <div
                      className="h-full bg-[#8B5CF6] rounded-full"
                      style={{ width: `${(activeCharacter.baseAttributes.shd / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-bold">{activeCharacter.baseAttributes.shd}</span>
                </div>

                {/* AGI */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[#10B981] font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>AGI</span>
                  </span>
                  <div className="flex-1 h-2 bg-[#1A2638] rounded-full overflow-hidden mx-1">
                    <div
                      className="h-full bg-[#10B981] rounded-full"
                      style={{ width: `${(activeCharacter.baseAttributes.agi / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-bold">{activeCharacter.baseAttributes.agi}</span>
                </div>

                {/* LUK */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[#EC4899] font-bold flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    <span>LUK</span>
                  </span>
                  <div className="flex-1 h-2 bg-[#1A2638] rounded-full overflow-hidden mx-1">
                    <div
                      className="h-full bg-[#EC4899] rounded-full"
                      style={{ width: `${(activeCharacter.baseAttributes.luk / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-bold">{activeCharacter.baseAttributes.luk}</span>
                </div>
              </div>
            </div>

            {/* SECTION: TRAITS (2 Cards Song Song) */}
            <div className="p-3.5 rounded-xl bg-[#090D18]/90 border border-[#1E2D42] space-y-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-3.5 bg-[#00D4FF] rounded-full shadow-[0_0_6px_#00D4FF]" />
                <h3 className="text-xs font-black uppercase font-mono tracking-wider text-white">
                  TRAITS
                </h3>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-[#0E1626] border border-[#10B981]/40 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded bg-[#10B981]/20 text-[#10B981] flex items-center justify-center shrink-0">
                    <Heart className="w-3.5 h-3.5 text-[#10B981]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono">
                        {activeCharacter.traits[0]?.name || 'Bàn Tay Cứu Hộ'}
                      </span>
                      <span className="text-[9px] font-mono text-[#10B981] uppercase font-bold">
                        Passive
                      </span>
                    </div>
                    <p className="text-[11px] text-[#A7B6C8] mt-0.5">
                      {activeCharacter.traits[0]?.description || '+30% hiệu quả hồi phục Medic'}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0E1626] border border-[#00D4FF]/40 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded bg-[#00D4FF]/20 text-[#00D4FF] flex items-center justify-center shrink-0">
                    <Shield className="w-3.5 h-3.5 text-[#00D4FF]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono">
                        {activeCharacter.traits[1]?.name || 'Mái Khiên Nhân Ái'}
                      </span>
                      <span className="text-[9px] font-mono text-[#00D4FF] uppercase font-bold">
                        Passive
                      </span>
                    </div>
                    <p className="text-[11px] text-[#A7B6C8] mt-0.5">
                      {activeCharacter.traits[1]?.description || '+30% Shield Recovery từ kỹ năng'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION: THÔNG TIN NHÂN VẬT (Bảng chi tiết) */}
            <div className="p-3.5 rounded-xl bg-[#090D18]/90 border border-[#1E2D42] space-y-2">
              <div className="flex items-center gap-1.5 pb-1 border-b border-[#1E2D42]">
                <div className="w-1 h-3.5 bg-[#00D4FF] rounded-full shadow-[0_0_6px_#00D4FF]" />
                <h3 className="text-xs font-black uppercase font-mono tracking-wider text-white">
                  THÔNG TIN NHÂN VẬT
                </h3>
              </div>

              <div className="text-xs space-y-2">
                <div className="flex justify-between border-b border-[#1E2D42]/60 pb-1">
                  <span className="text-[#7D90A6]">Giới tính / Tuổi:</span>
                  <span className="font-semibold text-white">Nữ · 24 tuổi</span>
                </div>
                <div className="flex justify-between border-b border-[#1E2D42]/60 pb-1">
                  <span className="text-[#7D90A6]">Tên đầy đủ:</span>
                  <span className="font-semibold text-white">{activeCharacter.fullLoreName}</span>
                </div>
                <div className="flex justify-between border-b border-[#1E2D42]/60 pb-1">
                  <span className="text-[#7D90A6]">Callsign:</span>
                  <span className="font-semibold text-[#00D4FF]">{activeCharacter.callsign}</span>
                </div>
                <div className="flex justify-between border-b border-[#1E2D42]/60 pb-1">
                  <span className="text-[#7D90A6]">Xuất thân:</span>
                  <span className="font-semibold text-white">Khu dân cư y tế quỹ đạo Elysia</span>
                </div>
                <div className="flex justify-between border-b border-[#1E2D42]/60 pb-1">
                  <span className="text-[#7D90A6]">Đào tạo:</span>
                  <span className="font-semibold text-white">Học viện Quân y Không gian</span>
                </div>
                <div className="flex justify-between border-b border-[#1E2D42]/60 pb-1">
                  <span className="text-[#7D90A6]">Chuyên môn:</span>
                  <span className="font-semibold text-white">Cứu hộ, hồi phục, hỗ trợ khiên</span>
                </div>
                <div className="flex justify-between border-b border-[#1E2D42]/60 pb-1">
                  <span className="text-[#7D90A6]">Tính cách:</span>
                  <span className="font-semibold text-white">Ấm áp, kiên trì, giàu lòng trắc ẩn</span>
                </div>
                <div className="flex justify-between border-b border-[#1E2D42]/60 pb-1">
                  <span className="text-[#7D90A6]">Điểm yếu:</span>
                  <span className="font-semibold text-[#F59E0B]">Khó chấp nhận việc phải bỏ lại</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7D90A6]">Ước mơ:</span>
                  <span className="font-semibold text-[#00D4FF]">Không tín hiệu cầu cứu nào bị bỏ quên</span>
                </div>
              </div>
            </div>

            {/* SECTION: BỘ SƯU TẬP HÌNH ẢNH (Strip 3 thumbnails) */}
            <div className="p-3.5 rounded-xl bg-[#090D18]/90 border border-[#1E2D42] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-3.5 bg-[#00D4FF] rounded-full shadow-[0_0_6px_#00D4FF]" />
                  <h3 className="text-xs font-black uppercase font-mono tracking-wider text-white">
                    BỘ SƯU TẬP HÌNH ẢNH
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onTabChange('gallery')}
                  className="text-xs font-mono text-[#00D4FF] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem thêm</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {activeCharacter.artworks.slice(0, 3).map((art) => (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => onOpenArtViewer(art)}
                    className="relative aspect-square rounded-lg overflow-hidden border border-[#1E2D42] hover:border-[#00D4FF] transition-all cursor-pointer group"
                  >
                    <Image
                      src={resolveImageUrl(art.path)}
                      alt={art.title}
                      fill
                      referrerPolicy="no-referrer"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                      <span className="text-[9px] font-mono text-white truncate w-full">
                        {art.title.split('—')[1] || art.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB STORY */}
          <TabsContent value="story">
            <StoryTab character={activeCharacter} />
          </TabsContent>

          {/* TAB GEAR */}
          <TabsContent value="gear">
            <GearCompatTab character={activeCharacter} />
          </TabsContent>

          {/* TAB GALLERY */}
          <TabsContent value="gallery">
            <GalleryTab
              character={activeCharacter}
              onSelectArtwork={(art) => onOpenArtViewer(art)}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* 4. FIXED BOTTOM TOGGLE: [📄 Xem Thông Tin (Active)] | [🖼️ Xem Tranh Nhân Vật] (Chuẩn Concept) */}
      <div className="fixed bottom-0 inset-x-0 z-50 p-3 bg-[#070A12]/95 backdrop-blur-md border-t border-[#1E2D42] flex justify-center">
        <div className="w-full max-w-sm flex rounded-xl bg-[#090D18] border border-[#1E2D42] p-1 shadow-2xl">
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-mono font-bold bg-[#00D4FF] text-[#070A12] shadow-sm shadow-cyan-500/30 cursor-default"
          >
            <FileText className="w-4 h-4" />
            <span>Xem Thông Tin</span>
          </button>
          <button
            type="button"
            onClick={onSwitchToArtView}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-mono font-bold text-[#A7B6C8] hover:text-white transition-all cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Xem Tranh Nhân Vật</span>
          </button>
        </div>
      </div>
    </div>
  )
}
export default MobileInfoView
