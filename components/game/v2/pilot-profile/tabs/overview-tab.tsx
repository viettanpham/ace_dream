'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import {
  CharacterProfileV2,
  ATTRIBUTE_COLOR_CONFIG,
  BaseAttributes,
  CharacterTrait,
  GalleryArtwork,
} from '@/lib/game/v2/character-profile-data'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/game/v2/ui'
import {
  Sparkles,
  HeartPulse,
  Shield,
  Award,
  Layers,
  Clock,
  Palette,
  FileText,
  Image as ImageIcon,
  Quote,
  AlertCircle,
  ChevronRight,
  Maximize2,
} from 'lucide-react'

interface OverviewTabProps {
  character: CharacterProfileV2
  onOpenViewer?: (artwork: GalleryArtwork) => void
  onSelectHeroArtwork?: (artwork: GalleryArtwork) => void
  onSwitchToGalleryTab?: () => void
}

export function OverviewTab({
  character,
  onOpenViewer,
  onSelectHeroArtwork,
  onSwitchToGalleryTab,
}: OverviewTabProps) {
  const [selectedTrait, setSelectedTrait] = useState<CharacterTrait | null>(null)

  const leftAttrKeys: (keyof BaseAttributes)[] = ['atk', 'def', 'agi']
  const rightAttrKeys: (keyof BaseAttributes)[] = ['ene', 'shd', 'luk']

  const status = character.progressStatus
  const biographyParagraphs = (character.biographyText || character.shortDescription || '')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  const verifiedArtworks = character.artworks.filter(
    (a) => a.isAvailableOnDisk && Boolean(a.path)
  )
  const previewArtworks = verifiedArtworks.slice(0, 4)

  const renderStatBar = (key: keyof BaseAttributes) => {
    if (!character.baseAttributes) return null
    const val = character.baseAttributes[key]
    const config = ATTRIBUTE_COLOR_CONFIG[key]
    const percent = Math.min((val / 10) * 100, 100)

    return (
      <div
        key={key}
        className="flex items-center gap-3 py-1.5 px-2.5 rounded-lg bg-[#070A12]/70 border border-[#1E2D42]/80"
      >
        <div className="w-16 shrink-0 flex items-center gap-1.5 text-xs font-mono font-bold text-[#CBD5E1]">
          <span>{config.icon}</span>
          <span>{config.label}</span>
        </div>
        <div className="flex-1 h-2 rounded-full bg-[#142338] overflow-hidden">
          <div
            style={{ width: `${percent}%` }}
            className={`h-full rounded-full transition-all duration-500 ${config.colorClass}`}
          />
        </div>
        <span
          className={`w-7 text-right font-mono font-black text-sm tabular-nums ${config.textClass}`}
        >
          {val}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-[#F1F5F9]">
      {/* 1. CHUYÊN MÔN TÁC CHIẾN & ĐỊNH DANH NGẮN GỌN */}
      <section className="rounded-xl border border-[#1E2D42] bg-[#090F1C]/95 p-4 space-y-3.5 shadow-inner">
        {character.tags && character.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {character.tags.map((spec, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#121E31] border border-[#00D4FF]/30 text-xs font-medium text-[#E2E8F0]"
              >
                <Sparkles className="w-3 h-3 text-[#00D4FF]" />
                <span>{spec}</span>
              </span>
            ))}
          </div>
        )}

        {character.shortDescription && (
          <p className="text-[15px] text-[#E2E8F0] leading-relaxed">
            {character.shortDescription}
          </p>
        )}

        {character.characterQuote && (
          <blockquote className="p-3 rounded-lg bg-[#070A12]/90 border-l-2 border-[#00D4FF] text-sm italic text-[#CBD5E1] flex items-start gap-2.5">
            <Quote className="w-4 h-4 text-[#00D4FF] shrink-0 mt-0.5" />
            <span>&ldquo;{character.characterQuote}&rdquo;</span>
          </blockquote>
        )}
      </section>

      {/* 2. | BASE ATTRIBUTES (2 CỘT x 3 HÀNG THANH NGANG CHUẨN CONCEPT) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-[#00D4FF]" />
            <h3 className="text-xs font-mono font-black uppercase tracking-wider text-white">
              BASE ATTRIBUTES
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#00D4FF] bg-[#00D4FF]/10 px-2 py-0.5 rounded border border-[#00D4FF]/30">
            {character.systemSource || 'SYSTEM FND-1/FND-8'}
          </span>
        </div>

        <div className="rounded-xl border border-[#1E2D42] bg-[#090F1C]/95 p-3.5">
          {character.baseAttributes ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
              <div className="space-y-2">
                {leftAttrKeys.map((key) => renderStatBar(key))}
              </div>
              <div className="space-y-2">
                {rightAttrKeys.map((key) => renderStatBar(key))}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-[#070A12]/80 border border-[#26384D] text-xs text-[#CBD5E1] flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Nhân vật chưa có bản ghi chỉ số chiến đấu trong SYSTEM FND-1/FND-8 Registry.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 3. | TRAITS (2 THẺ NGANG CẠNH NHAU CHUẨN CONCEPT) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-[#00D4FF]" />
            <h3 className="text-xs font-mono font-black uppercase tracking-wider text-white">
              TRAITS (THIÊN PHÚ ĐẶC HỮU)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#94A3B8]">FND-8.2.3</span>
        </div>

        {character.traits && character.traits.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {character.traits.map((trait) => (
              <div
                key={trait.id}
                onClick={() => setSelectedTrait(trait)}
                className="group p-3.5 rounded-xl bg-[#090F1C]/95 border border-[#1E2D42] hover:border-[#00D4FF] hover:bg-[#101B2E] transition-all cursor-pointer flex items-start gap-3 active:scale-[0.99]"
              >
                <div className="w-10 h-10 rounded-xl bg-[#070A12] border border-[#00D4FF]/40 text-[#00D4FF] shrink-0 flex items-center justify-center shadow-[0_0_12px_rgba(0,212,255,0.15)] group-hover:border-[#00D4FF]">
                  {trait.iconType === 'medic' ? (
                    <HeartPulse className="w-5 h-5 text-[#34D399]" />
                  ) : trait.iconType === 'shield' ? (
                    <Shield className="w-5 h-5 text-[#00D4FF]" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-[#FBBF24]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <h4 className="text-sm font-bold text-white group-hover:text-[#00D4FF] transition-colors truncate">
                      {trait.name}
                    </h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#142338] text-[#00D4FF] border border-[#00D4FF]/30 shrink-0">
                      {trait.type}
                    </span>
                  </div>
                  <p className="text-xs text-[#CBD5E1] mt-1 leading-relaxed line-clamp-3">
                    {trait.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-[#090F1C]/95 border border-[#1E2D42] text-xs text-[#CBD5E1]">
            Chưa đăng ký Trait trong SYSTEM Registry cho nhân vật này.
          </div>
        )}
      </section>

      {/* 4. | THÔNG TIN NHÂN VẬT (BẢNG KEY-VALUE DÒNG KẺ NGANG CHUẨN CONCEPT) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-[#00D4FF]" />
            <h3 className="text-xs font-mono font-black uppercase tracking-wider text-white">
              THÔNG TIN NHÂN VẬT
            </h3>
          </div>
          {character.personaCode && (
            <span className="text-[11px] font-mono text-[#00D4FF]">
              ID: {character.personaCode}
            </span>
          )}
        </div>

        <div className="rounded-xl border border-[#1E2D42] bg-[#090F1C]/95 divide-y divide-[#1E2D42]/70 overflow-hidden">
          {character.basicInfo.map((info, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2.5 gap-1 hover:bg-[#101A2C]/60 transition-colors"
            >
              <span className="text-xs font-mono text-[#94A3B8] shrink-0 sm:w-44">
                {info.label}:
              </span>
              <span className="text-xs sm:text-sm text-white font-semibold sm:text-right">
                {info.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. | TIỂU SỬ NHÂN VẬT (BIOGRAPHY) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-[#00D4FF]" />
            <h3 className="text-xs font-mono font-black uppercase tracking-wider text-white">
              TIỂU SỬ NHÂN VẬT (BIOGRAPHY)
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#142338] border border-[#26384D] text-[#00D4FF]">
            {character.biographyStatus || 'PROVISIONAL'}
          </span>
        </div>

        <div className="rounded-xl border border-[#1E2D42] bg-[#090F1C]/95 p-4 space-y-3">
          {biographyParagraphs.length > 0 ? (
            biographyParagraphs.map((para, idx) => (
              <p
                key={idx}
                className="text-[15px] text-[#E2E8F0] leading-relaxed"
              >
                {para}
              </p>
            ))
          ) : (
            <p className="text-sm text-[#CBD5E1] italic">
              Tiểu sử chi tiết đang được cập nhật trên kênh CDN.
            </p>
          )}
        </div>
      </section>

      {/* 6. | BỘ SƯU TẬP HÌNH ẢNH (PREVIEW STRIP + XEM THÊM CHUẨN CONCEPT) */}
      {previewArtworks.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-[#00D4FF]" />
              <h3 className="text-xs font-mono font-black uppercase tracking-wider text-white">
                BỘ SƯU TẬP HÌNH ẢNH ({verifiedArtworks.length} VERIFIED WEBP)
              </h3>
            </div>
            {onSwitchToGalleryTab && (
              <button
                type="button"
                onClick={onSwitchToGalleryTab}
                className="text-xs font-mono font-bold text-[#00D4FF] hover:text-[#38BDF8] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Xem thêm ({verifiedArtworks.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {previewArtworks.map((art) => (
              <div
                key={art.id}
                onClick={() => {
                  if (onSelectHeroArtwork) onSelectHeroArtwork(art)
                  if (onOpenViewer) onOpenViewer(art)
                }}
                className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-[#1E2D42] hover:border-[#00D4FF] bg-[#070A12] cursor-pointer transition-all"
              >
                <Image
                  src={art.path}
                  alt={art.title}
                  fill
                  sizes="(max-width: 640px) 45vw, 160px"
                  referrerPolicy="no-referrer"
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070A12] via-transparent to-transparent opacity-85" />
                <div className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-[#070A12]/80 border border-[#1E2D42] text-white group-hover:text-[#00D4FF] group-hover:border-[#00D4FF] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="text-[10px] font-mono text-[#00D4FF] uppercase truncate">
                    {art.rawCategory || art.category}
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {art.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. | TRẠNG THÁI ĐỒNG BỘ RELEASE CDN */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-[#00D4FF]" />
            <h3 className="text-xs font-mono font-black uppercase tracking-wider text-white">
              TRẠNG THÁI ĐỒNG BỘ RELEASE ({character.releaseVersion?.toUpperCase() || 'R4'})
            </h3>
          </div>
          {character.releaseCommitSha && (
            <span className="text-xs font-mono text-[#00D4FF]">
              SHA: {character.releaseCommitSha.slice(0, 7)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-[#090F1C]/95 border border-[#1E2D42] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#CBD5E1] flex items-center gap-1.5 font-medium">
                <Palette className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span>Artwork Verified</span>
              </span>
              <span className="font-mono text-[11px] text-[#34D399] font-semibold">
                {status.artStatus}
              </span>
            </div>
            <p className="text-white font-medium text-xs">{status.artStatusLabel}</p>
          </div>

          <div className="p-3 rounded-xl bg-[#090F1C]/95 border border-[#1E2D42] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#CBD5E1] flex items-center gap-1.5 font-medium">
                <FileText className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span>Hồ Sơ & Lore</span>
              </span>
              <span className="font-mono text-[11px] text-[#34D399] font-semibold">
                {status.profileStatus}
              </span>
            </div>
            <p className="text-white font-medium text-xs">{status.profileStatusLabel}</p>
          </div>

          <div className="p-3 rounded-xl bg-[#090F1C]/95 border border-[#1E2D42] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#CBD5E1] flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-[#FBBF24]" />
                <span>Biên Niên Cốt Truyện</span>
              </span>
              <span className="font-mono text-[11px] text-[#FBBF24] font-semibold">
                {status.storyStatus}
              </span>
            </div>
            <p className="text-white font-medium text-xs">{status.storyStatusLabel}</p>
          </div>

          <div className="p-3 rounded-xl bg-[#090F1C]/95 border border-[#1E2D42] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#CBD5E1] flex items-center gap-1.5 font-medium">
                <ImageIcon className="w-3.5 h-3.5 text-[#34D399]" />
                <span>Gallery Runtime CDN</span>
              </span>
              <span className="font-mono text-[11px] text-[#00D4FF] font-semibold">
                {status.galleryRuntime}
              </span>
            </div>
            <p className="text-white font-medium text-xs">{status.galleryRuntimeLabel}</p>
          </div>
        </div>
      </section>

      {/* Trait Detail Modal */}
      {selectedTrait && (
        <Dialog open={!!selectedTrait} onOpenChange={() => setSelectedTrait(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-xs font-mono text-[#00D4FF] uppercase">
                <Award className="w-4 h-4" />
                <span>Chi Tiết Kỹ Năng / Đặc Tính</span>
              </div>
              <DialogTitle className="text-lg text-white mt-1">
                {selectedTrait.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#CBD5E1]">
                Định danh hệ thống: {selectedTrait.id} · Phân loại: {selectedTrait.type}
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 rounded-xl bg-[#070A12] border border-[#26384D] space-y-2 mt-2">
              <p className="text-base text-white leading-relaxed">
                {trait.descriptionFallback(selectedTrait)}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

const trait = {
  descriptionFallback(t: CharacterTrait) {
    return t.description
  },
}

export default OverviewTab
