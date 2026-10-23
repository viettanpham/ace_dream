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
  onOpenArtViewer: (art?: GalleryArtwork, contextList?: GalleryArtwork[]) => void
  activeTab: string
  onTabChange: (tab: string) => void
}

/**
 * STARFRONT WORLD V2 — MOBILE INFO VIEW (FND-8.2.3.E.0 HOTFIX)
 * 
 * Khắc phục triệt để lỗi màn hình tối / overlay:
 * - Ambient background đặt tuyệt đối ở layer z-0, không dùng fixed chắn tương tác hay đè stacking context.
 * - Toàn bộ nội dung hiển thị trong z-10 với bảng màu độ tương phản cao (#F8FAFC, #FFFFFF, viền #20334D).
 * - Typography đạt chuẩn: tiêu đề 24px, quote 14px, mô tả 15-16px, bảng thuộc tính 14px.
 * - Loại bỏ header trùng lặp với V2Shell để tránh 2 sticky headers đè nhau.
 */
export function MobileInfoView({
  roster,
  activeCharacter,
  onSelectCharacter,
  onSwitchToArtView,
  onOpenArtViewer,
  activeTab,
  onTabChange,
}: MobileInfoViewProps) {
  // Lọc tác phẩm đã xác thực cho gallery
  const verifiedArtworks = activeCharacter.artworks.filter((a) => a.isAvailableOnDisk)

  return (
    <div className="relative w-full min-h-[100dvh] bg-[#070A12] text-[#F1F5F9] flex flex-col pb-28 overflow-x-hidden select-none">
      {/* Lớp Nền Ambient Sci-Fi Nhẹ Nhàng (Nằm trọn ở z-0, không đè nội dung) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <Image
          src={resolveImageUrl(activeCharacter.fullbodyAssetPath)}
          alt={activeCharacter.classCharacterName}
          fill
          priority
          referrerPolicy="no-referrer"
          className="object-cover object-top opacity-10 filter blur-3xl scale-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070A12]/70 via-[#070A12]/90 to-[#070A12]" />
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#00d4ff20_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* TOÀN BỘ NỘI DUNG NẰM Ở LAYER z-10 RÕ NÉT, TƯƠNG PHẢN CAO */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* 1. SUB-HEADER BREADCRUMB & DIỀU HƯỚNG NHẸ NHÀNG (Tránh trùng với V2Shell Header) */}
        <div className="px-3.5 py-2.5 bg-[#090D18]/95 border-b border-[#1E2D42] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              HỒ SƠ PHI CÔNG // 12 CLASS
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#00D4FF] bg-[#00D4FF]/10 px-2 py-0.5 rounded border border-[#00D4FF]/30">
            {activeCharacter.classCharacterName}
          </span>
        </div>

        {/* 2. DẢI AVATAR ROSTER NGANG PHÍA TRÊN (Sáng rõ, dễ chọn) */}
        <div className="p-3 bg-[#0B111E]/95 border-b border-[#1E2D42] overflow-x-auto scrollbar-none shadow-md">
          <div className="flex gap-2.5 min-w-max">
            {roster.map((char) => {
              const isSelected = char.id === activeCharacter.id

              return (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => onSelectCharacter(char)}
                  className={`min-w-[68px] p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#142338] border-[#00D4FF] shadow-[0_0_12px_rgba(0,212,255,0.4)] ring-1 ring-[#00D4FF]'
                      : 'bg-[#0E1626] border-[#1E2D42] hover:border-[#2C415E]'
                  }`}
                >
                  <PilotAvatar
                    character={char}
                    isSelected={isSelected}
                    className="w-11 h-11"
                  />
                  <span
                    className={`text-xs font-bold font-mono truncate max-w-[64px] ${
                      isSelected ? 'text-[#00D4FF]' : 'text-[#CBD5E1]'
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
        <div className="px-3.5 pt-3">
          <Tabs value={activeTab} onValueChange={onTabChange} variant="segmented" className="w-full">
            <TabsList className="grid grid-cols-4 mb-3.5 bg-[#0D1526] border border-[#20324B] p-1 rounded-xl">
              <TabsTrigger value="overview" className="text-xs font-mono font-bold py-2">
                OVERVIEW
              </TabsTrigger>
              <TabsTrigger value="story" className="text-xs font-mono font-bold py-2">
                STORY
              </TabsTrigger>
              <TabsTrigger value="gear" className="text-xs font-mono font-bold py-2">
                GEAR
              </TabsTrigger>
              <TabsTrigger value="gallery" className="text-xs font-mono font-bold py-2">
                GALLERY
              </TabsTrigger>
            </TabsList>

            {/* TAB OVERVIEW: BÁM SÁT CONCEPT MOBILE APPROVED VỚI TYPOGRAPHY HI-RES */}
            <TabsContent value="overview" className="space-y-4">
              {/* Header Danh Tính Nhân Vật */}
              <div className="p-4 rounded-2xl bg-[#0D1526]/95 border border-[#20324B] shadow-xl space-y-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#10B981]/20 border border-[#10B981]/60 flex items-center justify-center text-[#10B981] shrink-0">
                    <Heart className="w-6 h-6 text-[#10B981]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-black font-mono text-white tracking-wide leading-tight">
                      {activeCharacter.classCharacterName}
                    </h1>
                    <div className="text-sm font-semibold text-[#E2E8F0] mt-0.5">
                      {activeCharacter.title}
                    </div>
                    <div className="text-xs font-mono font-bold text-[#00D4FF] mt-1">
                      {activeCharacter.role}
                    </div>
                  </div>
                </div>

                {/* Quote Nhân Vật (In nghiêng bay bổng, nền tương phản cao) */}
                <div className="p-3 rounded-xl bg-[#121E33] border-l-4 border-[#00D4FF] text-sm italic font-serif text-white leading-relaxed shadow-inner">
                  "{activeCharacter.characterQuote}"
                </div>

                {/* Hàng Badges Đầy Đủ */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/50">
                    SHD
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/50">
                    ENE
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50">
                    Support
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/50">
                    Medic
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50">
                    Rescue
                  </span>
                </div>

                {/* Mô Tả Ngắn (15-16px, sáng rõ trên nền tối) */}
                <p className="text-sm sm:text-base text-[#F1F5F9] leading-relaxed pt-1 font-normal">
                  {activeCharacter.shortDescription}
                </p>
              </div>

              {/* SECTION: BASE ATTRIBUTES (6 Thanh Đo Màu Sắc) */}
              <div className="p-4 rounded-2xl bg-[#0D1526]/95 border border-[#20324B] shadow-xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-[#00D4FF] rounded-full shadow-[0_0_8px_#00D4FF]" />
                  <h3 className="text-sm font-black uppercase font-mono tracking-wider text-white">
                    BASE ATTRIBUTES
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs font-mono">
                  {/* ATK */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[#EF4444] font-bold flex items-center gap-1.5 text-xs">
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>ATK</span>
                    </span>
                    <div className="flex-1 h-2.5 bg-[#172437] rounded-full overflow-hidden mx-1.5">
                      <div
                        className="h-full bg-[#EF4444] rounded-full shadow-[0_0_6px_#EF4444]"
                        style={{ width: `${(activeCharacter.baseAttributes.atk / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-bold w-4 text-right">{activeCharacter.baseAttributes.atk}</span>
                  </div>

                  {/* ENE */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[#F59E0B] font-bold flex items-center gap-1.5 text-xs">
                      <Zap className="w-3.5 h-3.5" />
                      <span>ENE</span>
                    </span>
                    <div className="flex-1 h-2.5 bg-[#172437] rounded-full overflow-hidden mx-1.5">
                      <div
                        className="h-full bg-[#F59E0B] rounded-full shadow-[0_0_6px_#F59E0B]"
                        style={{ width: `${(activeCharacter.baseAttributes.ene / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-bold w-4 text-right">{activeCharacter.baseAttributes.ene}</span>
                  </div>

                  {/* DEF */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[#3B82F6] font-bold flex items-center gap-1.5 text-xs">
                      <Shield className="w-3.5 h-3.5" />
                      <span>DEF</span>
                    </span>
                    <div className="flex-1 h-2.5 bg-[#172437] rounded-full overflow-hidden mx-1.5">
                      <div
                        className="h-full bg-[#3B82F6] rounded-full shadow-[0_0_6px_#3B82F6]"
                        style={{ width: `${(activeCharacter.baseAttributes.def / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-bold w-4 text-right">{activeCharacter.baseAttributes.def}</span>
                  </div>

                  {/* SHD */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[#8B5CF6] font-bold flex items-center gap-1.5 text-xs">
                      <Shield className="w-3.5 h-3.5" />
                      <span>SHD</span>
                    </span>
                    <div className="flex-1 h-2.5 bg-[#172437] rounded-full overflow-hidden mx-1.5">
                      <div
                        className="h-full bg-[#8B5CF6] rounded-full shadow-[0_0_6px_#8B5CF6]"
                        style={{ width: `${(activeCharacter.baseAttributes.shd / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-bold w-4 text-right">{activeCharacter.baseAttributes.shd}</span>
                  </div>

                  {/* AGI */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[#10B981] font-bold flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AGI</span>
                    </span>
                    <div className="flex-1 h-2.5 bg-[#172437] rounded-full overflow-hidden mx-1.5">
                      <div
                        className="h-full bg-[#10B981] rounded-full shadow-[0_0_6px_#10B981]"
                        style={{ width: `${(activeCharacter.baseAttributes.agi / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-bold w-4 text-right">{activeCharacter.baseAttributes.agi}</span>
                  </div>

                  {/* LUK */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[#EC4899] font-bold flex items-center gap-1.5 text-xs">
                      <Award className="w-3.5 h-3.5" />
                      <span>LUK</span>
                    </span>
                    <div className="flex-1 h-2.5 bg-[#172437] rounded-full overflow-hidden mx-1.5">
                      <div
                        className="h-full bg-[#EC4899] rounded-full shadow-[0_0_6px_#EC4899]"
                        style={{ width: `${(activeCharacter.baseAttributes.luk / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-bold w-4 text-right">{activeCharacter.baseAttributes.luk}</span>
                  </div>
                </div>
              </div>

              {/* SECTION: TRAITS (2 Cards Song Song - Không cắt chữ) */}
              <div className="p-4 rounded-2xl bg-[#0D1526]/95 border border-[#20324B] shadow-xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-[#00D4FF] rounded-full shadow-[0_0_8px_#00D4FF]" />
                  <h3 className="text-sm font-black uppercase font-mono tracking-wider text-white">
                    TRAITS & THIÊN PHÚ
                  </h3>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-[#121E33] border border-[#10B981]/50 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#10B981]/20 text-[#10B981] flex items-center justify-center shrink-0 mt-0.5">
                      <Heart className="w-4 h-4 text-[#10B981]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-bold text-white font-mono">
                          {activeCharacter.traits[0]?.name || 'Bàn Tay Cứu Hộ'}
                        </span>
                        <span className="text-[10px] font-mono text-[#34D399] uppercase font-bold px-1.5 py-0.5 rounded bg-[#10B981]/10 border border-[#10B981]/30">
                          Passive
                        </span>
                      </div>
                      <p className="text-xs text-[#CBD5E1] mt-1 leading-snug">
                        {activeCharacter.traits[0]?.description || '+30% hiệu quả hồi phục Medic khi kích hoạt kỹ năng hỗ trợ.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#121E33] border border-[#00D4FF]/50 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#00D4FF]/20 text-[#00D4FF] flex items-center justify-center shrink-0 mt-0.5">
                      <Shield className="w-4 h-4 text-[#00D4FF]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-bold text-white font-mono">
                          {activeCharacter.traits[1]?.name || 'Mái Khiên Nhân Ái'}
                        </span>
                        <span className="text-[10px] font-mono text-[#00D4FF] uppercase font-bold px-1.5 py-0.5 rounded bg-[#00D4FF]/10 border border-[#00D4FF]/30">
                          Passive
                        </span>
                      </div>
                      <p className="text-xs text-[#CBD5E1] mt-1 leading-snug">
                        {activeCharacter.traits[1]?.description || '+30% Shield Recovery từ kỹ năng hỗ trợ, tái tạo trường lực.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: THÔNG TIN NHÂN VẬT (Bảng chi tiết rõ nét) */}
              <div className="p-4 rounded-2xl bg-[#0D1526]/95 border border-[#20324B] shadow-xl space-y-3">
                <div className="flex items-center gap-2 pb-1.5 border-b border-[#20324B]">
                  <div className="w-1.5 h-4 bg-[#00D4FF] rounded-full shadow-[0_0_8px_#00D4FF]" />
                  <h3 className="text-sm font-black uppercase font-mono tracking-wider text-white">
                    HỒ SƠ TÁC CHIẾN
                  </h3>
                </div>

                <div className="text-sm space-y-2.5">
                  <div className="flex justify-between border-b border-[#20324B]/70 pb-2">
                    <span className="text-[#94A3B8] font-medium">Giới tính / Tuổi:</span>
                    <span className="font-semibold text-white">Nữ · 24 tuổi</span>
                  </div>
                  <div className="flex justify-between border-b border-[#20324B]/70 pb-2">
                    <span className="text-[#94A3B8] font-medium">Tên đầy đủ:</span>
                    <span className="font-semibold text-white">{activeCharacter.fullLoreName}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#20324B]/70 pb-2">
                    <span className="text-[#94A3B8] font-medium">Callsign:</span>
                    <span className="font-bold text-[#00D4FF]">{activeCharacter.callsign}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#20324B]/70 pb-2">
                    <span className="text-[#94A3B8] font-medium">Xuất thân:</span>
                    <span className="font-semibold text-white text-right max-w-[200px]">Khu dân cư y tế Elysia</span>
                  </div>
                  <div className="flex justify-between border-b border-[#20324B]/70 pb-2">
                    <span className="text-[#94A3B8] font-medium">Đào tạo:</span>
                    <span className="font-semibold text-white text-right max-w-[200px]">Học viện Quân y Không gian</span>
                  </div>
                  <div className="flex justify-between border-b border-[#20324B]/70 pb-2">
                    <span className="text-[#94A3B8] font-medium">Chuyên môn:</span>
                    <span className="font-semibold text-white text-right max-w-[200px]">Cứu hộ, hồi phục, khiên</span>
                  </div>
                  <div className="flex justify-between border-b border-[#20324B]/70 pb-2">
                    <span className="text-[#94A3B8] font-medium">Tính cách:</span>
                    <span className="font-semibold text-white text-right max-w-[200px]">Ấm áp, kiên trì, trắc ẩn</span>
                  </div>
                  <div className="flex justify-between border-b border-[#20324B]/70 pb-2">
                    <span className="text-[#94A3B8] font-medium">Điểm yếu:</span>
                    <span className="font-semibold text-[#FBBF24] text-right max-w-[200px]">Khó bỏ lại đồng đội</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8] font-medium">Ước mơ:</span>
                    <span className="font-semibold text-[#00D4FF] text-right max-w-[200px]">Không bỏ quên ai</span>
                  </div>
                </div>
              </div>

              {/* SECTION: BỘ SƯU TẬP HÌNH ẢNH (Strip thumbnails với nút Xem Thêm mở Gallery) */}
              <div className="p-4 rounded-2xl bg-[#0D1526]/95 border border-[#20324B] shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-[#00D4FF] rounded-full shadow-[0_0_8px_#00D4FF]" />
                    <h3 className="text-sm font-black uppercase font-mono tracking-wider text-white">
                      BỘ SƯU TẬP ({verifiedArtworks.length} ẢNH)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onTabChange('gallery')}
                    className="text-xs font-mono font-bold text-[#00D4FF] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Xem toàn bộ</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {verifiedArtworks.slice(0, 3).map((art) => (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => onOpenArtViewer(art, verifiedArtworks)}
                      className="relative aspect-square rounded-xl overflow-hidden border border-[#20324B] hover:border-[#00D4FF] transition-all cursor-pointer group shadow-md"
                    >
                      <Image
                        src={resolveImageUrl(art.path)}
                        alt={art.title}
                        fill
                        referrerPolicy="no-referrer"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                        <span className="text-[10px] font-mono text-white truncate w-full font-bold">
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
                onSelectArtwork={(art) => onOpenArtViewer(art, verifiedArtworks)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 4. FIXED BOTTOM TOGGLE: [📄 Xem Thông Tin (Active)] | [🖼️ Xem Tranh Nhân Vật] */}
      <div className="fixed bottom-0 inset-x-0 z-50 p-3 bg-[#070A12]/95 backdrop-blur-md border-t border-[#1E2D42] flex justify-center">
        <div className="w-full max-w-sm flex rounded-xl bg-[#090D18] border border-[#1E2D42] p-1 shadow-2xl">
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-mono font-bold bg-[#00D4FF] text-[#070A12] shadow-sm shadow-cyan-500/30 cursor-default"
          >
            <FileText className="w-4 h-4" />
            <span>Xem Thông Tin</span>
          </button>
          <button
            type="button"
            onClick={onSwitchToArtView}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-mono font-bold text-[#A7B6C8] hover:text-white transition-all cursor-pointer"
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
