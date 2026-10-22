"use client"

import React, { useState } from "react"
import type { CharacterProfileV2, CharacterTrait } from "@/lib/game/v2/character-profile-data"
import { ATTRIBUTE_COLOR_CONFIG } from "@/lib/game/v2/character-profile-data"
import { Heart, Shield, Activity, Sparkles, Zap, Info, X } from "lucide-react"

interface OverviewTabProps {
  character: CharacterProfileV2
}

export function OverviewTab({ character }: OverviewTabProps) {
  const [selectedTrait, setSelectedTrait] = useState<CharacterTrait | null>(null)

  const getTraitIcon = (iconType: CharacterTrait["iconType"]) => {
    switch (iconType) {
      case "medic":
        return <Heart className="size-5 text-emerald-400" />
      case "shield":
        return <Shield className="size-5 text-cyan-400" />
      case "agility":
        return <Zap className="size-5 text-emerald-400" />
      case "firepower":
        return <Activity className="size-5 text-red-400" />
      case "tactical":
      default:
        return <Sparkles className="size-5 text-purple-400" />
    }
  }

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* 1. BASE ATTRIBUTES (TOTAL 20) */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 bg-cyan-400 rounded-full" />
            <h3 className="text-base font-bold tracking-wider text-slate-100 uppercase">
              Thuộc Tính Cơ Bản
            </h3>
          </div>
          <span className="rounded bg-cyan-950/80 px-2 py-0.5 text-xs font-semibold text-cyan-300 border border-cyan-500/40 font-mono">
            Tổng 20 Điểm Chuẩn
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {(Object.keys(character.baseAttributes) as Array<keyof typeof character.baseAttributes>).map((statKey) => {
            const config = ATTRIBUTE_COLOR_CONFIG[statKey]
            const value = character.baseAttributes[statKey]
            const maxStat = 10
            const percentage = Math.min(100, Math.round((value / maxStat) * 100))

            return (
              <div key={statKey} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-mono font-bold ${config.textClass} flex items-center gap-1`}>
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                  </span>
                  <span className="font-mono font-bold text-slate-100 text-sm">{value}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-950 border border-slate-800/80 overflow-hidden">
                  <div
                    className={`h-full ${config.colorClass} transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)]`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 2. TRAITS (ĐẶC TÍNH NHÂN VẬT) */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 bg-cyan-400 rounded-full" />
            <h3 className="text-base font-bold tracking-wider text-slate-100 uppercase">
              Đặc Tính Nhân Vật (Traits)
            </h3>
          </div>
          <span className="text-xs text-slate-400">Chạm để xem chi tiết</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {character.traits.map((trait) => (
            <button
              key={trait.id}
              onClick={() => setSelectedTrait(trait)}
              className="flex items-start gap-3 rounded-md border border-slate-800 bg-slate-950/70 p-3 text-left transition-all hover:border-cyan-500/50 hover:bg-slate-900/80 cursor-pointer min-h-[48px]"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-slate-700 bg-slate-900">
                {getTraitIcon(trait.iconType)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-slate-100 truncate">{trait.name}</h4>
                  <span className="rounded bg-slate-800 px-1 py-0.2 text-[10px] text-cyan-300 font-mono">
                    {trait.type}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {trait.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. THÔNG TIN CƠ BẢN (BASIC FACTS) */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5 mb-3">
          <span className="h-4 w-1 bg-cyan-400 rounded-full" />
          <h3 className="text-base font-bold tracking-wider text-slate-100 uppercase">
            Thông Tin Nhân Thân
          </h3>
        </div>

        <dl className="divide-y divide-slate-800/60">
          {character.basicInfo.map((info, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:justify-between py-2.5 text-sm gap-1">
              <dt className="text-slate-400 font-medium sm:w-1/3">{info.label}</dt>
              <dd className="text-slate-200 font-medium sm:w-2/3 sm:text-right">{info.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Trait Detail Modal / Popover */}
      {selectedTrait && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-lg border border-cyan-500/60 bg-slate-900 p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                {getTraitIcon(selectedTrait.iconType)}
                <h4 className="font-bold text-base text-slate-100">{selectedTrait.name}</h4>
              </div>
              <button
                onClick={() => setSelectedTrait(null)}
                className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="inline-block rounded bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 text-xs text-cyan-300 font-mono">
                Loại: {selectedTrait.type} Trait
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {selectedTrait.description}
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedTrait(null)}
                className="rounded bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-500 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
