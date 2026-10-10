"use client"

import { Button } from "@/components/ui/button"
import { CAMPAIGN_SECTORS } from "@/lib/game/data"
import { playClickSound } from "@/lib/game/audio"
import {
  STANDARD_CAMPAIGN_QUESTS,
  QUEST_QUALITY_CONFIG,
  ENEMY_VARIANTS_CONFIG,
} from "@/lib/game/scaling"
import type { CampaignMission, CampaignSector, StarfrontProgression } from "@/lib/game/types"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Coins,
  Gauge,
  Gift,
  Globe2,
  Layers,
  Lock,
  Play,
  Radar,
  RotateCcw,
  Shield,
  Sparkles,
  Sword,
  Target,
  Trophy,
} from "lucide-react"
import { useState } from "react"

interface CampaignMapProps {
  progression: StarfrontProgression
  onDeployMission: (mission: CampaignMission) => void
}

export function CampaignMap({ progression, onDeployMission }: CampaignMapProps) {
  const [selectedSectorId, setSelectedSectorId] = useState<string>("sector-1")
  const activeSector = CAMPAIGN_SECTORS.find((s) => s.id === selectedSectorId) || CAMPAIGN_SECTORS[0]

  const totalMissions = CAMPAIGN_SECTORS.flatMap((s) => s.missions).length
  const completedCount = progression.completedMissions.length

  const handleSelectSector = (id: string) => {
    playClickSound()
    setSelectedSectorId(id)
  }

  const handleDeploy = (m: CampaignMission) => {
    playClickSound()
    onDeployMission(m)
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in">
      {/* 1. Header Chiến Dịch */}
      <div className="rounded-sm border border-cyan-500/40 bg-gradient-to-r from-panel/90 via-black/80 to-panel/90 p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xs border border-cyan-400/60 bg-cyan-950/60 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <Radar className="size-5 text-cyan-300 animate-spin" style={{ animationDuration: "16s" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-white tracking-wider">
                  BẢN ĐỒ CHIẾN DỊCH VŨ TRỤ // STARFRONT CAMPAIGN
                </h3>
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-xs font-bold text-cyan-300 border border-cyan-500/40">
                  TIẾN ĐỘ: {completedCount}/{totalMissions} ẢI
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Chọn khu vực và tuyến ải nhiệm vụ. Chiến thắng để mở khóa ải tiếp theo và nhận thưởng giá trị!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-1.5 rounded bg-black/40 border border-border/60 px-2.5 py-1 text-amber-300">
              <Coins className="size-3.5 text-amber-400" />
              <span>{progression.credits.toLocaleString("vi-VN")} Credits</span>
            </div>
            <div className="flex items-center gap-1.5 rounded bg-black/40 border border-border/60 px-2.5 py-1 text-cyan-300">
              <Trophy className="size-3.5 text-cyan-400" />
              <span>Cấp {progression.level}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bộ Chọn Khu Vực (Sector Selector) */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {CAMPAIGN_SECTORS.map((sec, idx) => {
          const isSelected = sec.id === selectedSectorId
          const secCompleted = sec.missions.filter((m) =>
            progression.completedMissions.includes(m.id),
          ).length
          const isAllDone = secCompleted === sec.missions.length

          return (
            <button
              key={sec.id}
              onClick={() => handleSelectSector(sec.id)}
              className={cn(
                "group relative flex flex-col justify-between rounded-sm border p-3.5 text-left transition-all cursor-pointer",
                isSelected
                  ? "border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                  : "border-border/60 bg-panel/60 hover:border-cyan-500/40 hover:bg-panel/90",
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    KHU VỰC 0{idx + 1}
                  </span>
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: sec.color }}
                  />
                </div>

                <h4
                  className={cn(
                    "mt-1 font-display text-sm font-bold transition-colors",
                    isSelected ? "text-cyan-200" : "text-foreground group-hover:text-cyan-300",
                  )}
                >
                  {sec.name}
                </h4>
                <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">{sec.subtitle}</p>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[10px] font-mono">
                <span className="text-muted-foreground">{sec.threatLevel}</span>
                <span
                  className={cn(
                    "font-bold",
                    isAllDone ? "text-emerald-400" : "text-cyan-400",
                  )}
                >
                  {secCompleted}/{sec.missions.length} Đã Xong
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* 3. Danh Sách Tuyến Ải Nhiệm Vụ Trong Khu Vực Được Chọn */}
      <div className="rounded-sm border border-border/70 bg-panel/80 p-4 shadow-xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Globe2 className="size-4" style={{ color: activeSector.color }} />
            <div>
              <h4 className="font-display text-sm font-bold text-foreground">
                {activeSector.name}
              </h4>
              <p className="text-xs text-muted-foreground">{activeSector.desc}</p>
            </div>
          </div>
          <span className="font-mono text-xs rounded bg-black/40 px-2 py-1 text-muted-foreground">
            Độ nguy hiểm: <strong className="text-cyan-300">{activeSector.threatLevel}</strong>
          </span>
        </div>

        <div className="space-y-3">
          {activeSector.missions.map((mission, index) => {
            const isCompleted = progression.completedMissions.includes(mission.id)
            const isLocked = Boolean(
              mission.reqMissionId && !progression.completedMissions.includes(mission.reqMissionId),
            )
            const isAvailable = !isLocked

            // Dữ liệu mở rộng Phase 5.5 từ STANDARD_CAMPAIGN_QUESTS
            const questData = STANDARD_CAMPAIGN_QUESTS.find((q) => q.id === mission.id)
            const questLevel = questData?.level ?? mission.recommendedLevel
            const questQuality = questData?.quality ?? "standard"
            const qualityCfg = QUEST_QUALITY_CONFIG[questQuality]
            const variantCfg = questData ? ENEMY_VARIANTS_CONFIG[questData.variantId] : undefined
            const preview = questData?.previewReward

            // Chuẩn bị payload nhiệm vụ có đầy đủ thông số cho Buồng lái
            const enrichedMission: CampaignMission = {
              ...mission,
              level: questLevel,
              quality: questQuality,
              variantId: questData?.variantId,
              previewReward: preview,
            }

            return (
              <div
                key={mission.id}
                className={cn(
                  "relative flex flex-col justify-between gap-4 rounded-sm border p-4 transition-all md:flex-row md:items-center",
                  isCompleted
                    ? "border-emerald-500/40 bg-emerald-950/15"
                    : isAvailable
                      ? "border-cyan-500/50 bg-cyan-950/20 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                      : "border-border/40 bg-secondary/20 opacity-65",
                )}
              >
                {/* Thông tin ải */}
                <div className="space-y-2 md:max-w-lg">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-xs font-mono text-xs font-bold bg-black/40 border border-border/70 text-cyan-300">
                      {mission.order}
                    </span>
                    <h5 className="font-display text-sm font-bold text-foreground">
                      {mission.title}
                    </h5>

                    {/* Huy hiệu Level & Quality */}
                    <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-500/40">
                      CẤP {questLevel}
                    </span>
                    <span className={cn("rounded px-2 py-0.5 font-mono text-[10px] font-bold border", qualityCfg.badgeColor)}>
                      {qualityCfg.name} {"★".repeat(qualityCfg.stars)}
                    </span>

                    {isCompleted ? (
                      <span className="flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300 border border-emerald-400/50">
                        <CheckCircle2 className="size-3" /> ĐÃ XONG
                      </span>
                    ) : isAvailable ? (
                      <span className="flex items-center gap-1 rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-400/50 animate-pulse">
                        <Target className="size-3" /> SẴN SÀNG
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded bg-red-950/60 px-2 py-0.5 font-mono text-[10px] text-red-400 border border-red-500/40">
                        <Lock className="size-3" /> KHÓA
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {mission.desc}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-muted-foreground pt-0.5">
                    <span>
                      Mục tiêu: <strong className="text-amber-300">{variantCfg?.name || mission.encounterId}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Độ khó: <strong className="text-cyan-300">{questData?.difficultyRating || "Tiêu Chuẩn"}</strong>
                    </span>
                  </div>
                </div>

                {/* Hộp xem trước phần thưởng (Reward Preview Card) & Nút xuất kích */}
                <div className="flex flex-col items-start gap-2.5 border-t border-border/40 pt-3 md:items-end md:border-t-0 md:pt-0">
                  {/* Reward Preview */}
                  <div className="w-full rounded border border-border/60 bg-black/40 p-2.5 font-mono text-xs md:w-auto">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1 flex items-center gap-1">
                      <Gift className="size-3 text-cyan-400" /> PHẦN THƯỞNG DỰ KIẾN (PREVIEW):
                    </span>

                    <div className="flex flex-wrap items-center gap-2 mb-1.5 font-bold">
                      <span className="flex items-center gap-1 text-amber-300">
                        <Coins className="size-3 text-amber-400" />
                        +{preview?.credits.toLocaleString("vi-VN") ?? (isCompleted ? mission.repeatReward.credits : mission.firstClearReward.credits)} Cr
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-purple-300">
                        <Layers className="size-3 text-purple-400" />
                        +{preview?.alloy ?? (mission.sectorId === "sector-1" ? 3 : 8)} Alloy
                      </span>
                    </div>

                    {/* Trang bị thưởng cố định */}
                    {preview?.item && (
                      <div className="flex items-center gap-1.5 rounded border border-cyan-500/30 bg-cyan-950/30 px-2 py-1 text-[11px]">
                        <span className={cn(
                          "rounded px-1 py-0.2 text-[9px] font-bold uppercase border",
                          preview.item.rarity === "legendary"
                            ? "bg-amber-950/60 text-amber-300 border-amber-400/60"
                            : preview.item.rarity === "epic"
                              ? "bg-purple-950/60 text-purple-300 border-purple-400/60"
                              : preview.item.rarity === "rare"
                                ? "bg-cyan-950/60 text-cyan-300 border-cyan-400/60"
                                : "bg-slate-900/60 text-slate-300 border-slate-600/50"
                        )}>
                          {preview.item.rarity === "legendary" ? "Huyền Thoại" : preview.item.rarity === "epic" ? "Sử Thi" : preview.item.rarity === "rare" ? "Hiếm" : "Thường"}
                        </span>
                        <span className="font-bold text-white truncate max-w-[190px]">
                          {preview.item.name}
                        </span>
                        <span className="text-muted-foreground text-[10px]">
                          {preview.item.slot === "weapon" ? `(+${preview.item.attackBonus} ATK)` : preview.item.slot === "shield" ? `(+${preview.item.defenseBonus} DEF)` : `(+${preview.item.speedBonus} SPD)`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Nút hành động */}
                  {isLocked ? (
                    <Button disabled size="sm" variant="outline" className="gap-1.5 opacity-60">
                      <Lock className="size-3.5" /> Khóa (Hoàn thành ải trước)
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleDeploy(enrichedMission)}
                      className={cn(
                        "gap-1.5 font-display text-xs uppercase tracking-wider font-bold transition-all shadow-md cursor-pointer",
                        isCompleted
                          ? "border border-emerald-500/50 bg-emerald-950/60 text-emerald-200 hover:bg-emerald-900"
                          : "border border-cyan-400 bg-cyan-600 text-white hover:bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]",
                      )}
                    >
                      {isCompleted ? (
                        <>
                          <RotateCcw className="size-3.5" /> Đánh Lại
                        </>
                      ) : (
                        <>
                          <Play className="size-3.5 fill-current" /> Xuất Kích Ngay ➔
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
