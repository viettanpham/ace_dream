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
  CheckCircle2,
  Clock,
  Palette,
  FileText,
  Image as ImageIcon,
} from 'lucide-react'

interface OverviewTabProps {
  character: CharacterProfileV2
}

export function OverviewTab({ character }: OverviewTabProps) {
  const [selectedTrait, setSelectedTrait] = useState<CharacterTrait | null>(null)

  const attributeKeys: (keyof BaseAttributes)[] = ['atk', 'def', 'agi', 'ene', 'shd', 'luk']
  const status = character.progressStatus

  return (
    <div className="space-y-6">
      {/* 1. THẺ THEO DÕI TIẾN ĐỘ TRỰC GIAO (ORTHOGONAL PROGRESS TRACKER) */}
      <Card variant="panel" className="border-[#26384D] bg-[#0F172A]/90">
        <CardHeader bordered className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#06B6D4]" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#F1F5F9]">
                Trạng Thái Tiến Độ Canonical
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#A7B6C8]">
              <span>Mã Lớp:</span>
              <strong className="text-[#06B6D4] font-mono">{character.classCharacterName}</strong>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Hàng 1: Artwork Production */}
            <div className="p-3 rounded-xl bg-[#070A12]/80 border border-[#26384D]/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[#A7B6C8] flex items-center gap-1.5 font-medium">
                  <Palette className="w-3.5 h-3.5 text-[#06B6D4]" />
                  <span>Sản Xuất Artwork</span>
                </span>
                <span className="font-mono text-[11px] text-[#34D399] font-semibold">
                  {status.artStatus}
                </span>
              </div>
              <p className="text-[#F1F5F9] font-medium text-[11px]">
                {status.artStatusLabel}
              </p>
            </div>

            {/* Hàng 2: Profile Data */}
            <div className="p-3 rounded-xl bg-[#070A12]/80 border border-[#26384D]/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[#A7B6C8] flex items-center gap-1.5 font-medium">
                  <FileText className="w-3.5 h-3.5 text-[#06B6D4]" />
                  <span>Hồ Sơ & Lore</span>
                </span>
                <span className="font-mono text-[11px] text-[#34D399] font-semibold">
                  {status.profileStatus}
                </span>
              </div>
              <p className="text-[#F1F5F9] font-medium text-[11px]">
                {status.profileStatusLabel}
              </p>
            </div>

            {/* Hàng 3: Story Chronology */}
            <div className="p-3 rounded-xl bg-[#070A12]/80 border border-[#26384D]/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[#A7B6C8] flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#FBBF24]" />
                  <span>Biên Niên Cốt Truyện</span>
                </span>
                <span className="font-mono text-[11px] text-[#FBBF24] font-semibold">
                  {status.storyStatus}
                </span>
              </div>
              <p className="text-[#F1F5F9] font-medium text-[11px]">
                {status.storyStatusLabel}
              </p>
            </div>

            {/* Hàng 4: Gallery Runtime & UI */}
            <div className="p-3 rounded-xl bg-[#070A12]/80 border border-[#26384D]/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[#A7B6C8] flex items-center gap-1.5 font-medium">
                  <ImageIcon className="w-3.5 h-3.5 text-[#34D399]" />
                  <span>Gallery Runtime CDN</span>
                </span>
                <span className="font-mono text-[11px] text-[#06B6D4] font-semibold">
                  {status.galleryRuntime}
                </span>
              </div>
              <p className="text-[#F1F5F9] font-medium text-[11px]">
                {status.galleryRuntimeLabel}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. SÁU CHỈ SỐ THUỘC TÍNH (BASE STATS) - TUYỆT ĐỐI KHÔNG HIỂN THỊ TỔNG 20 ĐIỂM */}
      <Card variant="panel" className="border-[#26384D] bg-[#0F172A]/90">
        <CardHeader bordered className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-[#06B6D4]" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#F1F5F9]">
                Chỉ Số Cơ Bản (Base Attributes)
              </CardTitle>
            </div>
            <span className="text-xs font-mono text-[#06B6D4] uppercase">
              {character.roleCategory}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {attributeKeys.map((key) => {
              const val = character.baseAttributes[key]
              const config = ATTRIBUTE_COLOR_CONFIG[key]
              const percent = Math.min((val / 10) * 100, 100)

              return (
                <div
                  key={key}
                  className="p-3 rounded-xl bg-[#070A12]/80 border border-[#26384D]/70 space-y-2 hover:border-[#3B526D] transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-[#A7B6C8] flex items-center gap-1.5">
                      <span>{config.icon}</span>
                      <span>{config.label}</span>
                    </span>
                    <span className={`font-mono font-black text-base tabular-nums ${config.textClass}`}>
                      {val}
                    </span>
                  </div>
                  {/* Progress bar */}
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
        </CardContent>
      </Card>

      {/* 3. ĐẶC TÍNH PHI CÔNG (TRAITS) */}
      <Card variant="panel" className="border-[#26384D] bg-[#0F172A]/90">
        <CardHeader bordered className="py-3 px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#06B6D4]" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#F1F5F9]">
              Đặc Tính Lớp (Class Traits)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-3">
          {character.traits.map((trait) => (
            <div
              key={trait.id}
              onClick={() => setSelectedTrait(trait)}
              className="group p-3.5 rounded-xl bg-[#142338]/60 border border-[#26384D] hover:border-[#06B6D4] hover:bg-[#142338] transition-all cursor-pointer flex items-start gap-3.5 active:scale-[0.99]"
            >
              <div className="p-2 rounded-lg bg-[#070A12] border border-[#26384D] text-[#06B6D4] shrink-0 mt-0.5 group-hover:border-[#06B6D4]/50">
                {trait.iconType === 'medic' ? (
                  <HeartPulse className="w-5 h-5 text-[#34D399]" />
                ) : trait.iconType === 'shield' ? (
                  <Shield className="w-5 h-5 text-[#06B6D4]" />
                ) : (
                  <Sparkles className="w-5 h-5 text-[#FBBF24]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm sm:text-base font-bold text-[#F1F5F9] group-hover:text-[#06B6D4] transition-colors">
                    {trait.name}
                  </h4>
                  <span className="text-xs font-mono font-medium text-[#A7B6C8]">
                    {trait.type}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#A7B6C8] mt-1 line-clamp-2 leading-relaxed">
                  {trait.description}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 4. THÔNG TIN NHÂN THÂN (BASIC DOSSIER) */}
      <Card variant="panel" className="border-[#26384D] bg-[#0F172A]/90">
        <CardHeader bordered className="py-3 px-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#06B6D4]" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#F1F5F9]">
              Hồ Sơ Nhân Thân
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {character.basicInfo.map((info, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#070A12]/50 border border-[#26384D]/40 text-xs sm:text-sm"
              >
                <span className="text-[#A7B6C8] font-medium">{info.label}</span>
                <span className="text-[#F1F5F9] font-semibold text-right truncate max-w-[55%]">
                  {info.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trait Detail Modal */}
      {selectedTrait && (
        <Dialog open={!!selectedTrait} onOpenChange={() => setSelectedTrait(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-xs font-mono text-[#06B6D4] uppercase">
                <Award className="w-4 h-4" />
                <span>Chi Tiết Kỹ Năng / Đặc Tính</span>
              </div>
              <DialogTitle className="text-lg text-[#F1F5F9] mt-1">
                {selectedTrait.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#A7B6C8]">
                Định danh hệ thống: {selectedTrait.id} · Phân loại: {selectedTrait.type}
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 rounded-xl bg-[#070A12] border border-[#26384D] space-y-2 mt-2">
              <p className="text-sm text-[#F1F5F9] leading-relaxed">
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
