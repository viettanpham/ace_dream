'use client'

import React, { useState } from 'react'
import {
  CharacterProfileV2,
  ATTRIBUTE_COLOR_CONFIG,
  BaseAttributes,
  CharacterTrait,
} from '@/lib/game/v2/character-profile-data'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
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
  User,
  Award,
  Crosshair,
  Layers,
  Clock,
  Palette,
  FileText,
  Image as ImageIcon,
  Quote,
  BookOpen,
  AlertCircle,
} from 'lucide-react'

interface OverviewTabProps {
  character: CharacterProfileV2
}

export function OverviewTab({ character }: OverviewTabProps) {
  const [selectedTrait, setSelectedTrait] = useState<CharacterTrait | null>(null)

  const attributeKeys: (keyof BaseAttributes)[] = ['atk', 'def', 'agi', 'ene', 'shd', 'luk']
  const status = character.progressStatus
  const biographyParagraphs = (character.biographyText || character.shortDescription || '')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <div className="space-y-6 text-[#F1F5F9]">
      {/* 1. TRÍCH DẪN NHÂN VẬT (CHARACTER QUOTE) & MÔ TẢ NGẮN (SHORT DESCRIPTION) - TÁCH BIỆT RÕ RÀNG */}
      <Card variant="panel" className="border-[#26384D] bg-[#0F172A]/95">
        <CardHeader bordered className="py-3 px-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Quote className="w-4 h-4 text-[#00D4FF]" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-white">
                Tuyên Ngôn & Định Danh Phi Công
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              {character.personaCode && (
                <span className="px-2 py-0.5 rounded bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30 font-bold">
                  {character.personaCode}
                </span>
              )}
              {character.proseApproval && (
                <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                  {character.proseApproval}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          {character.characterQuote && (
            <blockquote className="p-3.5 sm:p-4 rounded-xl bg-[#070A12]/90 border-l-4 border-[#00D4FF] text-base sm:text-lg italic text-white font-medium leading-relaxed">
              &ldquo;{character.characterQuote}&rdquo;
            </blockquote>
          )}

          {character.shortDescription && (
            <div className="space-y-1.5">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#00D4FF]">
                Tóm Tắt Hồ Sơ (Short Description)
              </div>
              <p className="text-base text-[#F1F5F9] leading-relaxed">
                {character.shortDescription}
              </p>
            </div>
          )}

          {/* Chuyên môn (Specialties) từ manifest */}
          {character.tags && character.tags.length > 0 && (
            <div className="pt-1">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#CBD5E1] mb-2">
                Chuyên Môn Tác Chiến (Specialties)
              </div>
              <div className="flex flex-wrap gap-2">
                {character.tags.map((spec, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-[#142338] border border-[#26384D] text-xs sm:text-sm font-medium text-white"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. TIỂU SỬ CHI TIẾT (BIOGRAPHY TỪ MANIFEST CDN) */}
      <Card variant="panel" className="border-[#26384D] bg-[#0F172A]/95">
        <CardHeader bordered className="py-3 px-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#00D4FF]" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-white">
                Tiểu Sử Nhân Vật (Biography)
              </CardTitle>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#142338] border border-[#26384D] text-[#00D4FF]">
              {character.biographyStatus || 'PROVISIONAL'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-3">
          {biographyParagraphs.length > 0 ? (
            biographyParagraphs.map((para, idx) => (
              <p
                key={idx}
                className="text-base text-[#F1F5F9] leading-relaxed"
              >
                {para}
              </p>
            ))
          ) : (
            <p className="text-base text-[#CBD5E1] italic">
              Tiểu sử chi tiết đang được cập nhật trên kênh CDN.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 3. THÔNG TIN NHÂN THÂN (BASIC DOSSIER TỪ PROFILE JSON) */}
      <Card variant="panel" className="border-[#26384D] bg-[#0F172A]/95">
        <CardHeader bordered className="py-3 px-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#00D4FF]" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-white">
              Hồ Sơ Nhân Thân & Nguồn Gốc
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {character.basicInfo.map((info, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between p-3 rounded-xl bg-[#070A12]/80 border border-[#26384D]/80 gap-1"
              >
                <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">
                  {info.label}
                </span>
                <span className="text-sm sm:text-base text-white font-semibold leading-snug">
                  {info.value}
                </span>
              </div>
            ))}
          </div>

          {character.safetyNote && (
            <div className="p-3 rounded-xl bg-[#070A12]/70 border border-[#26384D]/60 text-xs text-[#CBD5E1] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#00D4FF] shrink-0 mt-0.5" />
              <span>{character.safetyNote}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. SÁU CHỈ SỐ THUỘC TÍNH (BASE STATS - NGUỒN SYSTEM REGISTRY) */}
      <Card variant="panel" className="border-[#26384D] bg-[#0F172A]/95">
        <CardHeader bordered className="py-3 px-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-[#00D4FF]" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-white">
                Chỉ Số Cơ Bản (Base Attributes)
              </CardTitle>
            </div>
            <span className="text-[11px] font-mono text-[#00D4FF] bg-[#00D4FF]/10 px-2 py-0.5 rounded border border-[#00D4FF]/30">
              {character.systemSource || 'SYSTEM FND-1/FND-8'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          {character.baseAttributes ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {attributeKeys.map((key) => {
                const val = character.baseAttributes![key]
                const config = ATTRIBUTE_COLOR_CONFIG[key]
                const percent = Math.min((val / 10) * 100, 100)

                return (
                  <div
                    key={key}
                    className="p-3 rounded-xl bg-[#070A12]/90 border border-[#26384D] space-y-2 hover:border-[#3B526D] transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#CBD5E1] flex items-center gap-1.5">
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                      </span>
                      <span className={`font-mono font-black text-base tabular-nums ${config.textClass}`}>
                        {val}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#142338] overflow-hidden p-0.5">
                      <div
                        style={{ width: `${percent}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${config.colorClass}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#070A12]/80 border border-[#26384D] text-sm text-[#CBD5E1] flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                Nhân vật này được nạp động từ kênh CDN nhưng chưa có bản ghi chỉ số chiến đấu trong SYSTEM FND-1/FND-8 Registry. Hệ thống không tự suy diễn chỉ số từ văn xuôi.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. ĐẶC TÍNH LỚP (CLASS TRAITS - NGUỒN SYSTEM REGISTRY) */}
      <Card variant="panel" className="border-[#26384D] bg-[#0F172A]/95">
        <CardHeader bordered className="py-3 px-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00D4FF]" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-white">
                Đặc Tính Lớp (Class Traits)
              </CardTitle>
            </div>
            <span className="text-[11px] font-mono text-[#94A3B8]">FND-8.2.3</span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-3">
          {character.traits && character.traits.length > 0 ? (
            character.traits.map((trait) => (
              <div
                key={trait.id}
                onClick={() => setSelectedTrait(trait)}
                className="group p-3.5 rounded-xl bg-[#142338]/70 border border-[#26384D] hover:border-[#00D4FF] hover:bg-[#142338] transition-all cursor-pointer flex items-start gap-3.5 active:scale-[0.99]"
              >
                <div className="p-2 rounded-lg bg-[#070A12] border border-[#26384D] text-[#00D4FF] shrink-0 mt-0.5 group-hover:border-[#00D4FF]/50">
                  {trait.iconType === 'medic' ? (
                    <HeartPulse className="w-5 h-5 text-[#34D399]" />
                  ) : trait.iconType === 'shield' ? (
                    <Shield className="w-5 h-5 text-[#00D4FF]" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-[#FBBF24]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-base font-bold text-white group-hover:text-[#00D4FF] transition-colors">
                      {trait.name}
                    </h4>
                    <span className="text-xs font-mono font-medium text-[#CBD5E1]">
                      {trait.type}
                    </span>
                  </div>
                  <p className="text-sm text-[#CBD5E1] mt-1 leading-relaxed">
                    {trait.description}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-xl bg-[#070A12]/80 border border-[#26384D] text-sm text-[#CBD5E1]">
              Chưa đăng ký Trait trong SYSTEM Registry cho nhân vật này.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. TRẠNG THÁI ĐỒNG BỘ RELEASE CDN */}
      <Card variant="panel" className="border-[#26384D] bg-[#0F172A]/95">
        <CardHeader bordered className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00D4FF]" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-white">
                Trạng Thái Đồng Bộ Release ({character.releaseVersion?.toUpperCase() || 'R4'})
              </CardTitle>
            </div>
            {character.releaseCommitSha && (
              <span className="text-xs font-mono text-[#00D4FF]">
                SHA: {character.releaseCommitSha.slice(0, 7)}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#070A12]/80 border border-[#26384D] space-y-1">
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

            <div className="p-3 rounded-xl bg-[#070A12]/80 border border-[#26384D] space-y-1">
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

            <div className="p-3 rounded-xl bg-[#070A12]/80 border border-[#26384D] space-y-1">
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

            <div className="p-3 rounded-xl bg-[#070A12]/80 border border-[#26384D] space-y-1">
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
        </CardContent>
      </Card>

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
                {selectedTrait.description}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default OverviewTab
