"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Trophy,
  Sparkles,
  Coins,
  Layers,
  Gift,
  CheckCircle2,
  Play,
  RotateCcw,
  ShoppingBag,
  Shield,
  Zap,
  Crosshair,
  Timer,
  Heart,
  BarChart3,
  Award,
  ChevronRight,
  User,
  ArrowUpRight,
  Check,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  CombatState,
  CampaignMission,
  StarfrontItem,
  StarfrontItemSlot,
  StarfrontProgression,
  BattleRewardResult,
  EnemyEncounterType,
} from "@/lib/game/types"
import {
  calculateCombatEfficiency,
  CombatEfficiencyReport,
} from "@/lib/game/combat-efficiency"
import {
  D3RadarChart,
  D3EfficiencyGauge,
  D3TurnDamageTimeline,
} from "@/components/game/d3-performance-charts"
import { STARFRONT_PILOTS } from "@/lib/game/data"
import {
  isSelectionOptional,
  getExpRequiredForLevel,
  getPilotExpRequiredForLevel,
} from "@/lib/game/progression"
import { playClickSound, playLevelUpSound, playShieldSound } from "@/lib/game/audio"
import { cn } from "@/lib/utils"

export interface PostMissionResultsProps {
  combatState: CombatState
  progression: StarfrontProgression
  rewardData?: {
    reward: BattleRewardResult
    dropItem?: StarfrontItem
    missionTitle?: string
    isFirstClear?: boolean
  } | null
  activeCampaignMission?: CampaignMission | null
  nextCampaignMission?: CampaignMission | null
  selectedEncounter?: EnemyEncounterType
  onNextMission?: () => void
  onReplayMission?: () => void
  onNavigateSection?: (section: "home" | "battlefield" | "missions" | "shop" | "hangar" | "character-gear") => void
  onEquipItem?: (itemId: string, slot: StarfrontItemSlot) => void
  onReturnToHangar?: () => void
  onOpenShop?: () => void
}

type ResultsTab = "overview" | "d3-metrics" | "timeline"

export function PostMissionResults({
  combatState,
  progression,
  rewardData,
  activeCampaignMission,
  nextCampaignMission,
  selectedEncounter,
  onNextMission,
  onReplayMission,
  onNavigateSection,
  onEquipItem,
  onReturnToHangar,
  onOpenShop,
}: PostMissionResultsProps) {
  const [activeTab, setActiveTab] = useState<ResultsTab>("overview")
  const [itemEquipped, setItemEquipped] = useState(false)

  // 1. Tính toán Báo cáo Hiệu Suất Tác Chiến (Combat Efficiency Report) bằng D3 engine
  const efficiencyReport: CombatEfficiencyReport = React.useMemo(() => {
    return calculateCombatEfficiency(combatState)
  }, [combatState])

  const { player, enemy, turnNumber } = combatState
  const reward = rewardData?.reward
  const dropItem = rewardData?.dropItem
  const missionTitle = rewardData?.missionTitle || activeCampaignMission?.title
  const isFirstClear = rewardData?.isFirstClear ?? false

  // Thông tin phi công đang kích hoạt
  const activePilotId = progression.activePairing?.pilotId || "marcus"
  const activePilotDef = STARFRONT_PILOTS.find((p) => p.id === activePilotId) || STARFRONT_PILOTS[0]
  const pilotProgression = progression.pilots?.[activePilotId]

  // Trạng thái trang bị của vật phẩm rơi
  const isItemCurrentlyEquipped =
    itemEquipped ||
    (dropItem && Object.values(progression.equipped).includes(dropItem.id))

  const handleQuickEquip = () => {
    if (!dropItem || !onEquipItem) return
    playShieldSound()
    onEquipItem(dropItem.id, dropItem.slot)
    setItemEquipped(true)
  }

  // Tỷ lệ thanh EXP Mech
  const expGained = reward?.expGained || 0
  const currentExp = progression.exp
  const expNeeded = getExpRequiredForLevel(progression.level)
  const expProgressPercent = Math.min(100, Math.round((currentExp / Math.max(1, expNeeded)) * 100))

  return (
    <div className="w-full max-w-4xl mx-auto rounded-md border border-cyan-500/40 bg-slate-950/95 text-slate-100 shadow-[0_0_40px_rgba(6,182,212,0.18)] backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      {/* =========================================================================
          HEADER: HUÂN CHƯƠNG CHIẾN THẮNG & ĐIỂM HIỆU SUẤT TÁC CHIẾN
          ========================================================================= */}
      <div className="relative border-b border-cyan-500/30 bg-gradient-to-r from-cyan-950/60 via-slate-900/80 to-cyan-950/60 px-5 py-4">
        {/* Glow hiệu ứng nền */}
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-20 blur-3xl opacity-30 pointer-events-none rounded-full"
          style={{ backgroundColor: efficiencyReport.gradeColor }}
        />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex size-12 items-center justify-center rounded-lg border border-cyan-400/50 bg-cyan-950/60 shadow-[0_0_15px_rgba(6,182,212,0.35)]">
              <Trophy className="size-6 text-cyan-300 animate-bounce" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-cyan-400">
                  BÁO CÁO KẾT QUẢ TÁC CHIẾN // POST-MISSION DEBRIEFING
                </span>
                {isFirstClear && (
                  <span className="rounded bg-amber-500/20 border border-amber-400/60 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-amber-300 animate-pulse">
                    🏆 QUA MÀN LẦN ĐẦU
                  </span>
                )}
              </div>

              <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                {missionTitle ? missionTitle : `TIÊU DIỆT ${enemy.name.toUpperCase()}`}
              </h2>
            </div>
          </div>

          {/* Huy hiệu Xếp Hạng Hiệu Suất (Combat Efficiency Grade Badge) */}
          <div className="flex items-center gap-3">
            <div className={cn("flex items-center gap-2 rounded-sm border px-3 py-1.5 font-mono", efficiencyReport.gradeBadgeClass)}>
              <Award className="size-5 shrink-0" />
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
                  COMBAT EFFICIENCY
                </div>
                <div className="text-base font-black tracking-widest flex items-center gap-1.5">
                  <span>HẠNG {efficiencyReport.grade}</span>
                  <span className="text-xs opacity-80">({efficiencyReport.overallScore}/100)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
          <button
            onClick={() => {
              playClickSound()
              setActiveTab("overview")
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-sm px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
              activeTab === "overview"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.25)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent",
            )}
          >
            <Sparkles className="size-3.5" />
            <span>Tổng Quan & Phần Thưởng</span>
          </button>

          <button
            onClick={() => {
              playClickSound()
              setActiveTab("d3-metrics")
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-sm px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
              activeTab === "d3-metrics"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.25)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent",
            )}
          >
            <BarChart3 className="size-3.5 text-cyan-400" />
            <span>Biểu Đồ Hiệu Suất D3 (Radar)</span>
          </button>

          <button
            onClick={() => {
              playClickSound()
              setActiveTab("timeline")
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-sm px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
              activeTab === "timeline"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.25)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent",
            )}
          >
            <Timer className="size-3.5 text-purple-400" />
            <span>Dòng Thời Gian Lượt Đấu D3</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          BODY CONTENT THEO TAB
          ========================================================================= */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          {/* TAB 1: TỔNG QUAN & PHẦN THƯỞNG (EXP, LOOT, OVERVIEW) */}
          {activeTab === "overview" && (
            <motion.div
              key="tab-overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* 1.1 Khối Điểm Combat Efficiency & Đánh Giá Tác Chiến */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center rounded-sm border border-cyan-500/30 bg-slate-900/60 p-4">
                <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 pb-3 md:pb-0 md:pr-4">
                  <D3EfficiencyGauge
                    score={efficiencyReport.overallScore}
                    grade={efficiencyReport.grade}
                    gradeColor={efficiencyReport.gradeColor}
                    width={220}
                    height={165}
                  />
                </div>

                <div className="md:col-span-8 flex flex-col justify-center space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded font-mono text-[11px] font-black uppercase tracking-wider text-slate-900"
                      style={{ backgroundColor: efficiencyReport.gradeColor }}
                    >
                      {efficiencyReport.grade} GRADE
                    </span>
                    <h3 className="font-display text-base font-bold text-white uppercase tracking-wide">
                      {efficiencyReport.gradeTitle}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {efficiencyReport.gradeDescription}
                  </p>

                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-xs font-mono">
                    <div className="rounded bg-black/40 p-2 border border-white/5">
                      <div className="text-[10px] text-slate-400">Số Vòng Đấu</div>
                      <div className="font-bold text-white text-sm">
                        {turnNumber} lượt
                      </div>
                    </div>
                    <div className="rounded bg-black/40 p-2 border border-white/5">
                      <div className="text-[10px] text-slate-400">Bảo Toàn HP</div>
                      <div className="font-bold text-emerald-400 text-sm">
                        {efficiencyReport.stats.hpRatio}%
                      </div>
                    </div>
                    <div className="rounded bg-black/40 p-2 border border-white/5">
                      <div className="text-[10px] text-slate-400">Đòn Chí Mạng</div>
                      <div className="font-bold text-cyan-400 text-sm">
                        {efficiencyReport.stats.critsLanded} ({efficiencyReport.stats.critRate}%)
                      </div>
                    </div>
                    <div className="rounded bg-black/40 p-2 border border-white/5">
                      <div className="text-[10px] text-slate-400">Tỷ Lệ Sát Thương</div>
                      <div className="font-bold text-purple-400 text-sm">
                        {efficiencyReport.stats.damageRatio}x
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1.2 Khối KINH NGHIỆM ĐẠT ĐƯỢC (EXPERIENCE GAINED) */}
              <div className="rounded-sm border border-emerald-500/40 bg-emerald-950/20 p-4">
                <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-emerald-400" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-300">
                      KINH NGHIỆM ĐẠT ĐƯỢC // EXPERIENCE GAINED
                    </span>
                  </div>
                  <span className="font-mono text-xs font-extrabold text-emerald-300">
                    +{expGained} EXP
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tiến trình cấp độ Cơ Giáp (Mech Level) */}
                  <div className="rounded border border-emerald-500/30 bg-black/50 p-3">
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="text-slate-300 font-bold uppercase flex items-center gap-1.5">
                        <Zap className="size-3.5 text-cyan-400" /> Cấp Cơ Giáp (Mech)
                      </span>
                      <span className="text-cyan-300 font-black">
                        CẤP {progression.level}
                      </span>
                    </div>

                    {/* Thanh EXP */}
                    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-800 border border-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-700 ease-out"
                        style={{ width: `${expProgressPercent}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] font-mono text-slate-400">
                      <span>EXP Hiện tại: {currentExp} / {expNeeded}</span>
                      <span>{expProgressPercent}%</span>
                    </div>
                  </div>

                  {/* Tiến trình cấp độ Phi Công (Pilot Level) */}
                  <div className="rounded border border-emerald-500/30 bg-black/50 p-3">
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="text-slate-300 font-bold uppercase flex items-center gap-1.5">
                        <User className="size-3.5 text-amber-400" /> Phi Công: {activePilotDef.name}
                      </span>
                      <span className="text-amber-300 font-black">
                        CẤP {pilotProgression?.level || 1}
                      </span>
                    </div>

                    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-800 border border-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              ((pilotProgression?.exp || 0) /
                                Math.max(
                                  1,
                                  getPilotExpRequiredForLevel(pilotProgression?.level || 1),
                                )) *
                                100,
                            ),
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] font-mono text-slate-400">
                      <span>
                        EXP: {pilotProgression?.exp || 0} /{" "}
                        {getPilotExpRequiredForLevel(pilotProgression?.level || 1)}
                      </span>
                      <span className="text-amber-300">
                        {pilotProgression?.availablePoints
                          ? `Có ${pilotProgression.availablePoints} điểm chỉ số!`
                          : "Đang đồng bộ"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Banner Thăng Cấp nếu có */}
                {reward?.leveledUp && (
                  <div className="mt-3 flex items-center gap-2.5 rounded bg-amber-500/20 border border-amber-400/60 p-2.5 text-xs text-amber-200 animate-pulse font-mono">
                    <Sparkles className="size-4 text-amber-300 shrink-0" />
                    <div>
                      <strong>🎉 CHÚC MỪNG THĂNG CẤP!</strong> Bạn đã đạt <strong>Cấp {reward.newLevel}</strong>. Toàn bộ chỉ số chiến đấu (HP, SP, ATK, DEF, SPD) được cường hóa vĩnh viễn!
                    </div>
                  </div>
                )}
              </div>

              {/* 1.3 Khối CHIẾN LỢI PHẨM THU ĐƯỢC (LOOT ACQUIRED) */}
              <div className="rounded-sm border border-cyan-500/40 bg-cyan-950/20 p-4">
                <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Gift className="size-4 text-cyan-400" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
                      CHIẾN LỢI PHẨM THU ĐƯỢC // LOOT ACQUIRED
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-cyan-300">ĐÃ TỰ ĐỘNG LƯU VÀO KHO</span>
                </div>

                {/* Tiền tệ: Credits & Hợp kim */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono mb-3">
                  <div className="flex items-center gap-2.5 rounded border border-amber-500/30 bg-black/50 p-2.5 text-amber-300">
                    <Coins className="size-5 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Credits Nhận Được</div>
                      <div className="text-sm font-black text-white">
                        +{(reward?.creditsGained || 0).toLocaleString("vi-VN")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 rounded border border-purple-500/30 bg-black/50 p-2.5 text-purple-300">
                    <Layers className="size-5 text-purple-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Hợp Kim (Alloy)</div>
                      <div className="text-sm font-black text-white">
                        +{reward?.alloyGained || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trang bị rơi độc nhất (Unique Dropped Item) */}
                {dropItem && (
                  <div className="rounded border border-cyan-400/50 bg-black/70 p-3 text-xs font-mono">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Gift className="size-4 text-cyan-400" />
                        <span className="font-bold text-white text-sm uppercase">
                          {dropItem.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Rarity Badge */}
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-[10px] font-bold uppercase border",
                            dropItem.rarity === "legendary"
                              ? "bg-amber-950/80 text-amber-300 border-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                              : dropItem.rarity === "epic"
                                ? "bg-purple-950/80 text-purple-300 border-purple-400/80"
                                : dropItem.rarity === "rare"
                                  ? "bg-cyan-950/80 text-cyan-300 border-cyan-400/80"
                                  : "bg-slate-900/80 text-slate-300 border-slate-600/50",
                          )}
                        >
                          {dropItem.rarity === "legendary"
                            ? "Huyền Thoại"
                            : dropItem.rarity === "epic"
                              ? "Sử Thi"
                              : dropItem.rarity === "rare"
                                ? "Hiếm"
                                : "Thường"}
                        </span>

                        <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700">
                          Ô: {dropItem.slot === "weapon" ? "Vũ Khí" : dropItem.slot === "shield" ? "Khiên Giáp" : "Động Cơ"}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 mb-2 italic">
                      "{dropItem.desc}"
                    </p>

                    {/* Chỉ số trang bị */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        {dropItem.attackBonus && (
                          <span className="rounded bg-red-950/70 px-2 py-0.5 text-red-300 border border-red-500/40">
                            +{dropItem.attackBonus} Tấn Công
                          </span>
                        )}
                        {dropItem.defenseBonus && (
                          <span className="rounded bg-blue-950/70 px-2 py-0.5 text-blue-300 border border-blue-500/40">
                            +{dropItem.defenseBonus} Phòng Ngự
                          </span>
                        )}
                        {dropItem.speedBonus && (
                          <span className="rounded bg-amber-950/70 px-2 py-0.5 text-amber-300 border border-amber-500/40">
                            +{dropItem.speedBonus} Tốc Độ
                          </span>
                        )}
                        {dropItem.hpBonus && (
                          <span className="rounded bg-emerald-950/70 px-2 py-0.5 text-emerald-300 border border-emerald-500/40">
                            +{dropItem.hpBonus} Giáp HP
                          </span>
                        )}
                        {dropItem.spBonus && (
                          <span className="rounded bg-purple-950/70 px-2 py-0.5 text-purple-300 border border-purple-500/40">
                            +{dropItem.spBonus} Năng Lượng SP
                          </span>
                        )}
                      </div>

                      {/* Nút Trang Bị Ngay (Quick Equip) */}
                      {onEquipItem && (
                        <Button
                          size="sm"
                          variant={isItemCurrentlyEquipped ? "outline" : "default"}
                          disabled={isItemCurrentlyEquipped}
                          onClick={handleQuickEquip}
                          className={cn(
                            "text-xs font-mono h-7 gap-1.5 cursor-pointer",
                            isItemCurrentlyEquipped
                              ? "border-emerald-500/60 text-emerald-300 bg-emerald-950/30"
                              : "bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400",
                          )}
                        >
                          {isItemCurrentlyEquipped ? (
                            <>
                              <Check className="size-3 text-emerald-400" />
                              <span>Đã Trang Bị</span>
                            </>
                          ) : (
                            <>
                              <Shield className="size-3" />
                              <span>Trang Bị Ngay</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: BIỂU ĐỒ HIỆU SUẤT D3 (RADAR & MULTI-AXIS ANALYSIS) */}
          {activeTab === "d3-metrics" && (
            <motion.div
              key="tab-d3-metrics"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                {/* D3 Radar Chart Container */}
                <div className="lg:col-span-6 flex flex-col items-center justify-center rounded-sm border border-cyan-500/30 bg-slate-900/60 p-4">
                  <div className="w-full text-left font-mono text-xs font-bold uppercase text-cyan-300 border-b border-cyan-500/20 pb-2 mb-2 flex items-center gap-2">
                    <Crosshair className="size-4 text-cyan-400" />
                    <span>BIỂU ĐỒ D3 RADAR HIỆU SUẤT TÁC CHIẾN (5 TRỤC)</span>
                  </div>
                  <D3RadarChart
                    axes={efficiencyReport.axes}
                    gradeColor={efficiencyReport.gradeColor}
                    width={360}
                    height={320}
                  />
                  <p className="mt-1 text-[11px] font-mono text-slate-400 text-center">
                    Rê chuột vào các đỉnh radar để xem chi tiết từng thông số chiến đấu.
                  </p>
                </div>

                {/* 5 Thẻ Chi Tiết Trục Hiệu Suất */}
                <div className="lg:col-span-6 space-y-2.5">
                  <div className="font-mono text-xs font-bold uppercase text-slate-300 mb-1 flex items-center justify-between">
                    <span>PHÂN TÍCH TỪNG TRỤC HIỆU SUẤT</span>
                    <span className="text-cyan-400">ĐIỂM TRỌNG SỐ</span>
                  </div>

                  {efficiencyReport.axes.map((axis) => (
                    <div
                      key={`axis-card-${axis.key}`}
                      className="rounded border border-white/10 bg-slate-900/80 p-3 font-mono text-xs transition-all hover:border-cyan-500/50"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white uppercase">{axis.label}</span>
                          <span className="text-[10px] text-slate-400">({axis.labelEn})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">Trọng số: {axis.weight}%</span>
                          <span className="font-black text-cyan-300 text-sm">{axis.score}%</span>
                        </div>
                      </div>

                      {/* Mini Bar */}
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mb-1.5">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-500"
                          style={{ width: `${axis.score}%` }}
                        />
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>{axis.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bảng tổng hợp thông số thực chiến */}
              <div className="rounded-sm border border-white/10 bg-slate-900/50 p-4 font-mono text-xs">
                <div className="font-bold uppercase text-slate-300 border-b border-white/10 pb-2 mb-3 flex items-center gap-2">
                  <BarChart3 className="size-4 text-cyan-400" />
                  <span>THỐNG KÊ CHI TIẾT TRẬN CHIẾN (TACTICAL DATA BREAKDOWN)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
                  <div className="rounded bg-black/40 p-2.5 border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase">Tổng Sát Thương Gây Ra</div>
                    <div className="text-base font-bold text-cyan-300">
                      {efficiencyReport.stats.totalDamageDealt} HP
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Đỉnh: {efficiencyReport.stats.peakDamageDealt} dmg
                    </div>
                  </div>

                  <div className="rounded bg-black/40 p-2.5 border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase">Tổng Sát Thương Nhận Vào</div>
                    <div className="text-base font-bold text-rose-300">
                      {efficiencyReport.stats.totalDamageTaken} HP
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Bảo toàn HP: {efficiencyReport.stats.hpRatio}%
                    </div>
                  </div>

                  <div className="rounded bg-black/40 p-2.5 border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase">Đòn Chí Mạng & Tỷ Lệ</div>
                    <div className="text-base font-bold text-amber-300">
                      {efficiencyReport.stats.critsLanded} ({efficiencyReport.stats.critRate}%)
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Né tránh: {efficiencyReport.stats.evadesCount} lần
                    </div>
                  </div>

                  <div className="rounded bg-black/40 p-2.5 border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase">Kỹ Năng & Hiệp Đồng</div>
                    <div className="text-base font-bold text-purple-300">
                      {efficiencyReport.stats.skillsUsedCount} chiêu
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Hiệp đồng: {efficiencyReport.stats.synergiesTriggered} lần
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: DÒNG THỜI GIAN LƯỢT ĐẤU D3 (TIMELINE & ROUND ANALYSIS) */}
          {activeTab === "timeline" && (
            <motion.div
              key="tab-timeline"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="rounded-sm border border-cyan-500/30 bg-slate-900/60 p-4">
                <div className="font-mono text-xs font-bold uppercase text-cyan-300 border-b border-cyan-500/20 pb-2 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="size-4 text-purple-400" />
                    <span>BIỂU ĐỒ D3: SÁT THƯƠNG TỪNG LƯỢT (DAMAGE FLOW TIMELINE)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Tổng cộng {turnNumber} lượt đấu
                  </span>
                </div>

                <D3TurnDamageTimeline
                  turnData={efficiencyReport.turnBreakdown}
                  width={620}
                  height={220}
                />
              </div>

              {/* Bảng tóm tắt từng vòng đấu */}
              <div className="rounded-sm border border-white/10 bg-slate-900/50 p-4 font-mono text-xs">
                <div className="font-bold uppercase text-slate-300 border-b border-white/10 pb-2 mb-3">
                  NHẬT KÝ CHI TIẾT TỪNG HIỆP CHIẾN ĐẤU
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {efficiencyReport.turnBreakdown.map((t) => (
                    <div
                      key={`turn-row-${t.turn}`}
                      className="rounded border border-white/5 bg-black/40 p-2 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-cyan-950/80 px-2 py-0.5 text-cyan-300 border border-cyan-500/30 font-bold">
                          HIỆP {t.turn}
                        </span>
                        <span className="text-slate-300 text-[11px]">
                          {t.playerActions[0] || "Giao tranh"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-cyan-300 font-bold">
                          +{t.damageDealt} DMG gây ra
                        </span>
                        <span className="text-rose-400 font-bold">
                          -{t.damageTaken} DMG chịu vào
                        </span>
                        {t.isPlayerCrit && (
                          <span className="text-amber-300 font-black">🔥 CRIT</span>
                        )}
                        {t.isPlayerEvade && (
                          <span className="text-emerald-300 font-black">💨 NÉ</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* =========================================================================
          FOOTER: CÁC NÚT HÀNH ĐỘNG TIẾP THEO (NEXT MISSION / RETRY / HANGAR)
          ========================================================================= */}
      <div className="border-t border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4">
        {/* Phase 5.11: Tùy chọn đổi Phi Công & Cơ Giáp sau khi đạt 5/5 nhiệm vụ */}
        {isSelectionOptional(progression) && (
          <div className="w-full mb-3 rounded-sm border border-cyan-500/40 bg-cyan-950/40 p-2.5 text-left font-mono text-xs text-cyan-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-cyan-400 shrink-0" />
              <span>
                <strong>🎖️ TÙY CHỌN: ĐÃ HOÀN TẤT CHỈ TIÊU CẶP ĐÔI.</strong> Bạn có thể đổi Phi Công & Cơ Giáp mới hoặc tiếp tục với tổ hợp này.
              </span>
            </div>
            {onNavigateSection && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  playClickSound()
                  onNavigateSection("character-gear")
                }}
                className="gap-1 border-cyan-400/80 text-cyan-200 hover:bg-cyan-900/50 text-xs font-mono h-7 cursor-pointer"
              >
                <RefreshCw className="size-3" />
                <span>Đổi Phi Công / Cơ Giáp (Tùy Chọn)</span>
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Nút về Căn Cứ / Hangar */}
            {onReturnToHangar && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  playClickSound()
                  onReturnToHangar()
                }}
                className="gap-1.5 font-mono text-xs border-slate-700 hover:bg-slate-800 text-slate-300 cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                <span>Về Căn Cứ</span>
              </Button>
            )}

            {/* Nút vào Chợ Quân Sự */}
            {onOpenShop && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  playClickSound()
                  onOpenShop()
                }}
                className="gap-1.5 font-mono text-xs border-amber-500/40 text-amber-300 hover:bg-amber-950/40 cursor-pointer"
              >
                <ShoppingBag className="size-3.5 text-amber-400" />
                <span>Chợ Quân Sự</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Nút Tái Đấu */}
            {onReplayMission && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  playClickSound()
                  onReplayMission()
                }}
                className="gap-1.5 font-mono text-xs border-cyan-500/50 text-cyan-300 hover:bg-cyan-950/50 cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                <span>Tái Đấu Trận Này</span>
              </Button>
            )}

            {/* Nút Thách Đấu Mục Tiêu Tiếp Theo */}
            {nextCampaignMission && onNextMission && (
              <Button
                onClick={() => {
                  playClickSound()
                  onNextMission()
                }}
                className="gap-2 font-display text-xs uppercase tracking-wider bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
              >
                <Play className="size-3.5 fill-current" />
                <span>Thách Đấu Tiếp: {nextCampaignMission.title.split(":")[0]}</span>
                <ChevronRight className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
