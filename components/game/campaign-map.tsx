"use client"

import { Button } from "@/components/ui/button"
import { CAMPAIGN_SECTORS } from "@/lib/game/data"
import { playClickSound, playLevelUpSound } from "@/lib/game/audio"
import {
  STANDARD_CAMPAIGN_QUESTS,
  QUEST_QUALITY_CONFIG,
  ENEMY_VARIANTS_CONFIG,
  findCampaignQuest,
} from "@/lib/game/scaling"
import {
  resetCampaignMissionConfig,
  generateSideQuests,
  resetSideQuests,
} from "@/lib/game/progression"
import type {
  CampaignMission,
  CampaignSector,
  StarfrontProgression,
  StarfrontQuest,
} from "@/lib/game/types"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Coins,
  Compass,
  Gauge,
  Gift,
  Globe2,
  Layers,
  Lock,
  Play,
  Radar,
  RefreshCw,
  RotateCcw,
  Shield,
  Sparkles,
  Sword,
  Target,
  Trophy,
  Zap,
} from "lucide-react"
import { useState } from "react"

interface CampaignMapProps {
  progression: StarfrontProgression
  onDeployMission: (mission: CampaignMission) => void
  onUpdateProgression?: (updated: StarfrontProgression) => void
}

export function CampaignMap({
  progression,
  onDeployMission,
  onUpdateProgression,
}: CampaignMapProps) {
  const [activeTab, setActiveTab] = useState<"main" | "side">("main")
  const [selectedSectorId, setSelectedSectorId] = useState<string>("sector-1")
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null)

  const activeSector =
    CAMPAIGN_SECTORS.find((s) => s.id === selectedSectorId) || CAMPAIGN_SECTORS[0]

  const totalMissions = CAMPAIGN_SECTORS.flatMap((s) => s.missions).length
  const completedCount = progression.completedMissions.length

  // Danh sách nhiệm vụ phụ tuyến (nếu chưa có trong save, tự động sinh)
  const currentSideQuests =
    progression.sideQuests && progression.sideQuests.length > 0
      ? progression.sideQuests
      : generateSideQuests(progression.level)

  const showNotification = (text: string, isError = false) => {
    setFeedback({ text, isError })
    setTimeout(() => setFeedback(null), 3800)
  }

  const handleSelectSector = (id: string) => {
    playClickSound()
    setSelectedSectorId(id)
  }

  const handleDeploy = (m: CampaignMission) => {
    playClickSound()
    onDeployMission(m)
  }

  // Thao tác reset cấu hình và phần thưởng của Ải chính tuyến đã hoàn thành
  const handleResetMission = (missionId: string) => {
    playClickSound()
    const res = resetCampaignMissionConfig(progression, missionId)
    if (res.success) {
      playLevelUpSound()
      onUpdateProgression?.(res.updated)
      showNotification(res.message)
    } else {
      showNotification(res.message, true)
    }
  }

  // Reset toàn bộ ải đã hoàn thành trong Sector hiện tại
  const handleResetAllSectorMissions = () => {
    playClickSound()
    let currentProg = progression
    let resetCount = 0

    for (const m of activeSector.missions) {
      if (currentProg.completedMissions.includes(m.id)) {
        const res = resetCampaignMissionConfig(currentProg, m.id)
        if (res.success) {
          currentProg = res.updated
          resetCount++
        }
      }
    }

    if (resetCount > 0) {
      playLevelUpSound()
      onUpdateProgression?.(currentProg)
      showNotification(`Đã reset thành công ${resetCount} ải đã hoàn thành trong ${activeSector.name}!`)
    } else {
      showNotification("Chưa có ải nào trong khu vực này được hoàn thành để reset!", true)
    }
  }

  // Thao tác làm mới chuỗi nhiệm vụ phụ tuyến
  const handleResetSideQuests = () => {
    playClickSound()
    const res = resetSideQuests(progression)
    if (res.success) {
      playLevelUpSound()
      onUpdateProgression?.(res.updated)
      showNotification(res.message)
    }
  }

  // Nhận nhiệm vụ phụ và xuất kích vào đấu trường
  const handleDeploySideQuest = (sq: StarfrontQuest) => {
    playClickSound()
    const missionPayload: CampaignMission = {
      id: sq.id,
      sectorId: sq.sectorId,
      sectorName: sq.sectorName || "Tiền Thưởng Phụ Tuyến",
      order: sq.order || 1,
      title: sq.title,
      desc: sq.desc,
      recommendedLevel: sq.level,
      encounterId: sq.encounterType,
      level: sq.level,
      quality: sq.quality,
      variantId: sq.variantId,
      previewReward: sq.previewReward,
      firstClearReward: {
        credits: sq.previewReward.credits,
        exp: sq.level * 80 + 50,
        alloy: sq.previewReward.alloy,
      },
      repeatReward: {
        credits: Math.round(sq.previewReward.credits * 0.7),
        exp: Math.round((sq.level * 80 + 50) * 0.6),
        alloy: Math.max(1, Math.round(sq.previewReward.alloy * 0.5)),
      },
    }

    onDeployMission(missionPayload)
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
                  TIẾN ĐỘ: {completedCount}/{totalMissions} ẢI CHÍNH
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Hệ thống 4 Sector chiến dịch, tuyến ải chính tuyến & nhiệm vụ tiền thưởng phụ tuyến!
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

      {/* Thông báo thao tác */}
      {feedback && (
        <div
          className={cn(
            "rounded-sm border p-3 font-mono text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2",
            feedback.isError
              ? "border-red-500/50 bg-red-950/80 text-red-200"
              : "border-emerald-500/50 bg-emerald-950/80 text-emerald-200",
          )}
        >
          {feedback.isError ? (
            <AlertTriangle className="size-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Thanh chuyển đổi: Chính Tuyến (Main Campaign) vs Phụ Tuyến (Side Quests) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playClickSound()
              setActiveTab("main")
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-xs border px-3.5 py-1.5 font-display text-xs transition-all cursor-pointer",
              activeTab === "main"
                ? "border-cyan-400 bg-cyan-950/60 text-cyan-200 font-bold shadow-[0_0_10px_rgba(6,182,212,0.25)]"
                : "border-border/60 text-muted-foreground hover:text-foreground",
            )}
          >
            <Globe2 className="size-3.5" />
            <span>Chiến Dịch Chính Tuyến ({totalMissions} Ải)</span>
          </button>

          <button
            onClick={() => {
              playClickSound()
              setActiveTab("side")
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-xs border px-3.5 py-1.5 font-display text-xs transition-all cursor-pointer",
              activeTab === "side"
                ? "border-purple-400 bg-purple-950/60 text-purple-200 font-bold shadow-[0_0_10px_rgba(168,85,247,0.25)]"
                : "border-border/60 text-muted-foreground hover:text-purple-300",
            )}
          >
            <Compass className="size-3.5 text-purple-400" />
            <span>Tiền Thưởng Phụ Tuyến ({currentSideQuests.length} Ủy Thác)</span>
          </button>
        </div>

        {activeTab === "side" && (
          <button
            onClick={handleResetSideQuests}
            className="flex items-center gap-1.5 rounded-xs border border-purple-500/40 bg-purple-950/40 px-3 py-1.5 font-mono text-xs text-purple-200 hover:bg-purple-950/80 hover:border-purple-400 transition-all cursor-pointer shadow-sm"
          >
            <RotateCcw className="size-3.5 text-purple-400" />
            <span>Làm Mới Nhiệm Vụ Phụ (Reset Pool)</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          TAB 1: CHIẾN DỊCH CHÍNH TUYẾN (MAIN CAMPAIGN SECTORS)
          ========================================================================= */}
      {activeTab === "main" && (
        <>
          {/* 2. Bộ Chọn Khu Vực (Sector Selector 4 Sectors) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                        "mt-1 font-display text-sm font-bold transition-colors line-clamp-1",
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

              <div className="flex items-center gap-3">
                <span className="font-mono text-xs rounded bg-black/40 px-2 py-1 text-muted-foreground">
                  Độ nguy hiểm: <strong className="text-cyan-300">{activeSector.threatLevel}</strong>
                </span>

                {/* Nút reset toàn bộ ải đã hoàn thành trong khu vực */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetAllSectorMissions}
                  className="font-mono text-xs h-7 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40"
                  title="Tạo lại độ hiếm và phần thưởng ngẫu nhiên mới cho các ải đã hoàn thành"
                >
                  <RefreshCw className="size-3 text-cyan-400" />
                  <span>Reset Thưởng Ải Đã Xong</span>
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {activeSector.missions.map((mission) => {
                const isCompleted = progression.completedMissions.includes(mission.id)
                const isLocked = Boolean(
                  mission.reqMissionId && !progression.completedMissions.includes(mission.reqMissionId),
                )
                const isAvailable = !isLocked

                // Kiểm tra xem ải có cấu hình override từ thao tác Reset/Reroll không
                const override = progression.missionOverrides?.[mission.id]
                const questData = findCampaignQuest(mission.id) || STANDARD_CAMPAIGN_QUESTS.find((q) => q.id === mission.id)

                const questLevel = mission.level ?? questData?.level ?? mission.recommendedLevel
                const questQuality = override?.quality ?? questData?.quality ?? "standard"
                const qualityCfg = QUEST_QUALITY_CONFIG[questQuality]
                const variantId = override?.variantId ?? questData?.variantId ?? "recon"
                const variantCfg = ENEMY_VARIANTS_CONFIG[variantId]
                const preview = override?.previewReward ?? questData?.previewReward

                // Chuẩn bị payload nhiệm vụ có đầy đủ thông số cho Buồng lái
                const enrichedMission: CampaignMission = {
                  ...mission,
                  level: questLevel,
                  quality: questQuality,
                  variantId,
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
                        {override && (
                          <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30">
                            [Đã Reset Cấu Hình]
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hộp xem trước phần thưởng & Nút xuất kích */}
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
                            <span
                              className={cn(
                                "rounded px-1 py-0.2 text-[9px] font-bold uppercase border",
                                preview.item.rarity === "legendary"
                                  ? "bg-amber-950/60 text-amber-300 border-amber-400/60"
                                  : preview.item.rarity === "epic"
                                    ? "bg-purple-950/60 text-purple-300 border-purple-400/60"
                                    : preview.item.rarity === "rare"
                                      ? "bg-cyan-950/60 text-cyan-300 border-cyan-400/60"
                                      : "bg-slate-900/60 text-slate-300 border-slate-600/50",
                              )}
                            >
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

                      {/* Các nút hành động */}
                      <div className="flex items-center gap-2">
                        {isCompleted && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResetMission(mission.id)}
                            className="font-mono text-xs border-amber-500/40 text-amber-300 hover:bg-amber-950/40 gap-1"
                            title="Tạo lại độ hiếm ngẫu nhiên và phần thưởng rơi mới"
                          >
                            <RefreshCw className="size-3 text-amber-400" />
                            <span>Reset Ải</span>
                          </Button>
                        )}

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
                                <RotateCcw className="size-3.5" /> Tái Đấu
                              </>
                            ) : (
                              <>
                                <Play className="size-3.5 fill-current" /> Xuất Kích ➔
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          TAB 2: NHIỆM VỤ PHỤ TUYẾN & TIỀN THƯỞNG (SIDE QUESTS / BOUNTIES)
          ========================================================================= */}
      {activeTab === "side" && (
        <div className="rounded-sm border border-purple-500/40 bg-panel/85 p-4 shadow-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="size-5 text-purple-400" />
              <div>
                <h4 className="font-display text-sm font-bold text-white">
                  BẢNG TIỀN THƯỞNG KHÔNG GIAN // SECTOR SIDE BOUNTIES
                </h4>
                <p className="text-xs text-muted-foreground font-mono">
                  Các ủy thác từ trạm tiếp tế và thương đoàn tự do. Nhiệm vụ lặp lại tự do nhận Credits, Alloy và Trang bị!
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleResetSideQuests}
              className="font-mono text-xs border-purple-500/50 text-purple-300 hover:bg-purple-950/40 gap-1.5"
            >
              <RotateCcw className="size-3.5 text-purple-400" />
              <span>Làm Mới Danh Sách Ủy Thác</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {currentSideQuests.map((sq, idx) => {
              const qualityCfg = QUEST_QUALITY_CONFIG[sq.quality]
              const variantCfg = ENEMY_VARIANTS_CONFIG[sq.variantId]
              const isCleared = progression.completedQuestIds?.includes(sq.id)

              return (
                <div
                  key={sq.id}
                  className={cn(
                    "relative flex flex-col justify-between rounded-sm border p-4 transition-all",
                    isCleared
                      ? "border-emerald-500/40 bg-emerald-950/20"
                      : "border-border/60 bg-black/40 hover:border-purple-500/50 hover:bg-purple-950/15",
                  )}
                >
                  <div>
                    {/* Header nhiệm vụ phụ */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-[10px] uppercase font-bold text-purple-400">
                        ỦY THÁC 0{idx + 1}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] font-bold text-cyan-300 border border-cyan-500/40">
                          CẤP {sq.level}
                        </span>
                        <span className={cn("rounded px-1.5 py-0.5 font-mono text-[9px] font-bold border", qualityCfg.badgeColor)}>
                          {qualityCfg.name}
                        </span>
                      </div>
                    </div>

                    <h5 className="font-display text-sm font-bold text-white">
                      {sq.title}
                    </h5>

                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {sq.desc}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono border-t border-border/30 pt-2 text-muted-foreground">
                      <span>Mục tiêu: <strong className="text-amber-300">{variantCfg?.name || sq.encounterType}</strong></span>
                      <span>Độ khó: <strong className="text-purple-300">{sq.difficultyRating}</strong></span>
                    </div>

                    {/* Phần thưởng preview */}
                    <div className="mt-3 rounded border border-border/50 bg-black/50 p-2 font-mono text-xs">
                      <span className="text-[10px] text-muted-foreground uppercase block mb-1 flex items-center gap-1">
                        <Gift className="size-3 text-purple-400" /> Phần Thưởng:
                      </span>
                      <div className="flex items-center gap-2 font-bold mb-1">
                        <span className="text-amber-300 flex items-center gap-1">
                          <Coins className="size-3 text-amber-400" />
                          +{sq.previewReward.credits.toLocaleString("vi-VN")} Cr
                        </span>
                        <span>·</span>
                        <span className="text-purple-300 flex items-center gap-1">
                          <Layers className="size-3 text-purple-400" />
                          +{sq.previewReward.alloy} Alloy
                        </span>
                      </div>
                      <div className="text-[10px] text-sky-300 truncate">
                        Trang bị: {sq.previewReward.item.name}
                      </div>
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="mt-4 pt-2 border-t border-border/40 flex items-center justify-between">
                    {isCleared && (
                      <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="size-3" /> Đã Hoàn Thành
                      </span>
                    )}

                    <Button
                      size="sm"
                      onClick={() => handleDeploySideQuest(sq)}
                      className={cn(
                        "ml-auto gap-1 font-display text-xs uppercase tracking-wider font-bold cursor-pointer",
                        isCleared
                          ? "border border-border/60 bg-secondary/40 text-muted-foreground hover:text-white"
                          : "border border-purple-500/60 bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.35)]",
                      )}
                    >
                      <Play className="size-3 fill-current" />
                      {isCleared ? "Đánh Lại" : "Xuất Kích ➔"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
