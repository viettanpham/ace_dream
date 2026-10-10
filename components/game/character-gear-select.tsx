"use client"

import React, { useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Boxes,
  Check,
  ChevronRight,
  Cpu,
  Crosshair,
  Flame,
  Gauge,
  HelpCircle,
  Info,
  Layers,
  Lock,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  Unlock,
  UserCheck,
  UserRound,
  Users,
  X,
  Zap,
} from "lucide-react"

import {
  STARFRONT_GEAR_DEFS,
  STARFRONT_PILOT_MAP,
  STARFRONT_PILOTS,
  type StarfrontPilotDef,
} from "@/lib/game/data"
import {
  allocatePilotPoint,
  calculateGearCombatRating,
  calculateTotalGearStats,
  confirmPairing,
  getPilotExpRequiredForLevel,
  resetPilotPoints,
} from "@/lib/game/progression"
import {
  playClickSound,
  playEquipSound,
  playLevelUpSound,
  playShieldSound,
} from "@/lib/game/audio"
import type {
  PilotAttributeKey,
  PilotProgressionData,
  StarfrontGearClassDef,
  StarfrontGearId,
  StarfrontProgression,
} from "@/lib/game/types"
import { cn } from "@/lib/utils"

interface CharacterGearSelectProps {
  progression: StarfrontProgression
  onUpdateProgression: (updated: StarfrontProgression) => void
  onNavigateToHangar?: () => void
  onNavigateToCombat?: () => void
}

type SelectionStep = 1 | 2 | 3

export function CharacterGearSelect({
  progression,
  onUpdateProgression,
  onNavigateToHangar,
  onNavigateToCombat,
}: CharacterGearSelectProps) {
  // Trạng thái bước hiện tại trong quy trình 3 bước
  const [currentStep, setCurrentStep] = useState<SelectionStep>(1)

  // Cặp đôi hiện đang lưu trong tiến trình
  const activePairing = progression.activePairing || {
    pilotId: "marcus",
    gearId: progression.activeGearId || "vanguard",
    isLocked: false,
    unlockProgress: { completedMissions: 0, wonBattles: 0, targetCount: 5 },
  }

  // Lựa chọn tạm thời đang tương tác trong luồng 3 bước (cho phép duyệt tự do trước khi xác nhận)
  const [selectedPilotId, setSelectedPilotId] = useState<string>(activePairing.pilotId || "marcus")
  const [selectedGearId, setSelectedGearId] = useState<StarfrontGearId>(
    activePairing.gearId || progression.activeGearId || "vanguard",
  )

  // Modal xem chi tiết & phân bổ điểm thuộc tính
  const [inspectModalOpen, setInspectModalOpen] = useState(false)
  const [inspectPilotId, setInspectPilotId] = useState<string>(selectedPilotId)
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Lấy dữ liệu hồ sơ phi công & cơ giáp đang chọn
  const activePilotDef: StarfrontPilotDef = STARFRONT_PILOT_MAP[selectedPilotId] || STARFRONT_PILOTS[0]
  const activeGearDef: StarfrontGearClassDef =
    STARFRONT_GEAR_DEFS[selectedGearId] || STARFRONT_GEAR_DEFS.vanguard

  const pilotsData = progression.pilots || {}
  const currentPilotProg: PilotProgressionData = pilotsData[selectedPilotId] || {
    id: selectedPilotId,
    level: 1,
    exp: 0,
    allocatedStats: { attack: 0, defense: 0, agility: 0, shield: 0, tactical: 0 },
    availablePoints: 0,
  }

  // Tính toán chỉ số tổng hợp minh bạch
  const statsBreakdown = useMemo(() => {
    return calculateTotalGearStats(
      selectedGearId,
      progression.level,
      progression.inventory,
      progression.equipped,
      currentPilotProg,
    )
  }, [selectedGearId, progression.level, progression.inventory, progression.equipped, currentPilotProg])

  const combatRating = useMemo(() => {
    return calculateGearCombatRating({
      hp: statsBreakdown.total.hp,
      sp: statsBreakdown.total.sp,
      attack: statsBreakdown.total.attack,
      defense: statsBreakdown.total.defense,
      speed: statsBreakdown.total.speed,
    })
  }, [statsBreakdown])

  // Tính toán hiệp đồng tương thích (Synergy)
  const isSynergyMatch = activePilotDef.recommendedGear === selectedGearId

  // Xử lý chuyển bước
  const handleNextStep = () => {
    playClickSound()
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as SelectionStep)
    }
  }

  const handlePrevStep = () => {
    playClickSound()
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as SelectionStep)
    }
  }

  // Xử lý chọn phi công
  const handleSelectPilot = (pId: string) => {
    playClickSound()
    setSelectedPilotId(pId)
  }

  // Xử lý chọn cơ giáp
  const handleSelectGear = (gId: StarfrontGearId) => {
    playClickSound()
    setSelectedGearId(gId)
  }

  // Mở modal xem chi tiết
  const handleOpenInspect = (pId: string) => {
    playClickSound()
    setInspectPilotId(pId)
    setInspectModalOpen(true)
    setFeedbackMessage(null)
  }

  // Phân bổ điểm thuộc tính
  const handleAllocateStat = (pId: string, statKey: PilotAttributeKey) => {
    const res = allocatePilotPoint(progression, pId, statKey)
    if (res.success) {
      playLevelUpSound()
      onUpdateProgression(res.updated)
      setFeedbackMessage({ type: "success", text: res.message })
    } else {
      setFeedbackMessage({ type: "error", text: res.message })
    }
  }

  // Tẩy điểm thuộc tính
  const handleResetStats = (pId: string) => {
    const res = resetPilotPoints(progression, pId, 200)
    if (res.success) {
      playShieldSound()
      onUpdateProgression(res.updated)
      setFeedbackMessage({ type: "success", text: res.message })
    } else {
      setFeedbackMessage({ type: "error", text: res.message })
    }
  }

  // Xác nhận ghép đôi & khóa xuất kích
  const handleConfirmPairingAction = () => {
    const res = confirmPairing(progression, selectedPilotId, selectedGearId)
    if (res.success) {
      playEquipSound()
      onUpdateProgression(res.updated)
      setFeedbackMessage({
        type: "success",
        text: `Đã xác nhận ghép đôi [${activePilotDef.name}] & [${activeGearDef.name}] xuất kích! Đã khóa 5 nhiệm vụ / 5 trận thắng.`,
      })
    } else {
      setFeedbackMessage({ type: "error", text: res.message })
    }
  }

  // Thông tin tiến độ mở khóa nếu đang bị khóa
  const isLocked = Boolean(activePairing.isLocked)
  const wonBattles = activePairing.unlockProgress?.wonBattles || 0
  const completedMissions = activePairing.unlockProgress?.completedMissions || 0

  return (
    <div className="space-y-4">
      {/* ====================================================================
          1. HEADER BANNER: THANH ĐIỀU HƯỚNG 3 BƯỚC & TRẠNG THÁI KHÓA XUẤT KÍCH
          ==================================================================== */}
      <section className="relative overflow-hidden rounded-sm border border-cyan-500/40 bg-panel/90 p-4 shadow-lg backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-sm border border-cyan-400/60 bg-cyan-950/60 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]">
              <Users className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-sm sm:text-base font-black tracking-wider text-white uppercase">
                  NHÂN VẬT & CƠ GIÁP (CHARACTER & GEAR)
                </h1>
                <span className="rounded bg-cyan-950 px-1.5 py-0.5 text-[9px] font-mono font-bold text-cyan-300 border border-cyan-500/40">
                  PHASE 5.8
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                Ghép đôi chiến thuật giữa Phi Công và Cơ Giáp · Khóa xuất kích trong 5 nhiệm vụ hoặc 5 trận thắng
              </p>
            </div>
          </div>

          {/* Huy hiệu Cặp đôi đang được khóa xuất kích */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <div
              className={cn(
                "flex items-center gap-2 rounded border px-3 py-1.5 transition-all shadow-sm",
                isLocked
                  ? "border-amber-500/60 bg-amber-950/40 text-amber-300"
                  : "border-emerald-500/60 bg-emerald-950/40 text-emerald-300",
              )}
            >
              {isLocked ? (
                <>
                  <Lock className="size-3.5 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold">ĐANG KHÓA XUẤT KÍCH:</span>
                    <span className="ml-1 text-white">
                      {STARFRONT_PILOT_MAP[activePairing.pilotId]?.name || activePairing.pilotId} /{" "}
                      {STARFRONT_GEAR_DEFS[activePairing.gearId]?.name || activePairing.gearId}
                    </span>
                    <span className="ml-2 text-[10px] text-amber-400/90">
                      ({completedMissions}/5 Nhiệm Vụ · {wonBattles}/5 Trận Thắng)
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Unlock className="size-3.5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold">SẴN SÀNG GHÉP ĐÔI:</span>
                    <span className="ml-1 text-white">
                      {STARFRONT_PILOT_MAP[activePairing.pilotId]?.name || activePairing.pilotId} /{" "}
                      {STARFRONT_GEAR_DEFS[activePairing.gearId]?.name || activePairing.gearId}
                    </span>
                  </div>
                </>
              )}
            </div>

            {onNavigateToHangar && (
              <button
                onClick={onNavigateToHangar}
                className="flex items-center gap-1.5 rounded border border-border/60 bg-black/40 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-white hover:border-cyan-500/40 transition-colors cursor-pointer"
                title="Đến Hangar để nâng cấp và thay đổi trang bị"
              >
                <Boxes className="size-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Mở Hangar</span>
              </button>
            )}
          </div>
        </div>

        {/* Thanh chuyển bước 3 bước */}
        <div className="mt-3.5 grid grid-cols-3 gap-2">
          {[
            { step: 1, title: "Bước 1: Chọn Phi Công", desc: activePilotDef.name },
            { step: 2, title: "Bước 2: Chọn Cơ Giáp", desc: activeGearDef.name },
            { step: 3, title: "Bước 3: Đánh Giá & Xác Nhận", desc: "Khóa Xuất Kích" },
          ].map((s) => {
            const isCurrent = currentStep === s.step
            const isCompleted = currentStep > s.step

            return (
              <button
                key={s.step}
                onClick={() => {
                  playClickSound()
                  setCurrentStep(s.step as SelectionStep)
                }}
                className={cn(
                  "relative flex flex-col items-start rounded-xs border p-2 text-left transition-all cursor-pointer",
                  isCurrent
                    ? "border-cyan-400 bg-cyan-950/70 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                    : isCompleted
                      ? "border-cyan-500/30 bg-panel/70 text-cyan-200"
                      : "border-border/50 bg-black/40 text-muted-foreground hover:border-border",
                )}
              >
                <div className="flex items-center gap-1.5 w-full">
                  <span
                    className={cn(
                      "size-4 rounded-full flex items-center justify-center font-mono text-[9px] font-bold",
                      isCurrent
                        ? "bg-cyan-400 text-black"
                        : isCompleted
                          ? "bg-cyan-900 text-cyan-300"
                          : "bg-black/60 text-muted-foreground",
                    )}
                  >
                    {isCompleted ? <Check className="size-2.5" /> : s.step}
                  </span>
                  <span className={cn("font-display text-[11px] font-bold truncate", isCurrent && "text-white")}>
                    {s.title}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300/80 truncate mt-0.5 ml-5.5">
                  {s.desc}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Thông báo phản hồi nếu có */}
      {feedbackMessage && (
        <div
          className={cn(
            "rounded-sm border p-2.5 font-mono text-xs flex items-center justify-between gap-2 shadow-md animate-in fade-in duration-200",
            feedbackMessage.type === "success"
              ? "border-emerald-500/60 bg-emerald-950/60 text-emerald-300"
              : "border-red-500/60 bg-red-950/60 text-red-300",
          )}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === "success" ? (
              <Check className="size-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="size-4 shrink-0 text-red-400" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="size-5 flex items-center justify-center rounded hover:bg-white/10 text-muted-foreground hover:text-white cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ====================================================================
          BƯỚC 1: DANH SÁCH & LỰA CHỌN PHI CÔNG (PILOT SELECTION)
          ==================================================================== */}
      {currentStep === 1 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-cyan-400" />
              <h2 className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                DANH SÁCH HỒ SƠ PHI CÔNG (4 HỒ SƠ TÁC CHIẾN)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              Nhấp vào thẻ để chọn · Bấm "Chi Tiết" để phân bổ điểm thuộc tính
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-4">
            {STARFRONT_PILOTS.map((pilot) => {
              const isSelected = selectedPilotId === pilot.id
              const isCurrentActive = activePairing.pilotId === pilot.id
              const pData: PilotProgressionData = pilotsData[pilot.id] || {
                id: pilot.id,
                level: 1,
                exp: 0,
                allocatedStats: { attack: 0, defense: 0, agility: 0, shield: 0, tactical: 0 },
                availablePoints: 0,
              }
              const expRequired = getPilotExpRequiredForLevel(pData.level)
              const expPercent = Math.min(100, Math.round((pData.exp / expRequired) * 100))

              // Gợi ý tương thích với Gear đang chọn
              const matchesSelectedGear = pilot.recommendedGear === selectedGearId

              return (
                <div
                  key={pilot.id}
                  onClick={() => handleSelectPilot(pilot.id)}
                  className={cn(
                    "group relative flex flex-col justify-between rounded-sm border p-3.5 transition-all cursor-pointer",
                    isSelected
                      ? "border-cyan-400 bg-cyan-950/70 shadow-[0_0_18px_rgba(34,211,238,0.3)] ring-1 ring-cyan-400/60"
                      : "border-border/60 bg-panel/70 hover:border-cyan-500/50 hover:bg-panel/95 opacity-90",
                  )}
                >
                  {/* Trạng thái góc trên */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="relative size-12 shrink-0 rounded border border-cyan-500/50 bg-black/60 overflow-hidden">
                        <img
                          src={pilot.avatar}
                          alt={pilot.name}
                          className="size-full object-cover transition-transform group-hover:scale-105"
                        />
                        {matchesSelectedGear && (
                          <span
                            title="Tương thích cao với Cơ Giáp đang chọn"
                            className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-400 border border-black shadow-[0_0_6px_#34d399]"
                          />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-display text-sm font-bold text-white group-hover:text-cyan-300">
                            {pilot.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-300 block">
                          {pilot.specialty}
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground block">
                          C/S: {pilot.callsign} · {pilot.gender}, {pilot.age}t
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {isSelected ? (
                        <span className="rounded bg-cyan-400 px-1.5 py-0.5 text-[9px] font-mono font-bold text-black shadow-sm">
                          ĐANG CHỌN
                        </span>
                      ) : isCurrentActive ? (
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-mono font-bold text-amber-300 border border-amber-500/40">
                          ĐANG KHÓA
                        </span>
                      ) : null}

                      {pData.availablePoints > 0 && (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-mono font-bold text-emerald-300 border border-emerald-500/40 animate-pulse">
                          +{pData.availablePoints} Điểm
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Thanh Cấp Độ & EXP */}
                  <div className="mt-3 rounded bg-black/50 p-2 border border-border/40 font-mono text-[10px]">
                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                      <span>Cấp Phi Công: <strong className="text-white">Cấp {pData.level}</strong></span>
                      <span>{pData.exp} / {expRequired} EXP</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/80">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-300"
                        style={{ width: `${expPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Kỹ Năng Nội Tại Của Phi Công */}
                  <div className="mt-2.5 rounded bg-black/60 p-2 border border-border/40 text-[10px] font-mono">
                    <div className="flex items-center gap-1 font-bold text-amber-300">
                      <Sparkles className="size-3 text-amber-400 shrink-0" />
                      <span className="truncate">{pilot.passive.name}</span>
                    </div>
                    <p className="text-[9.5px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                      {pilot.passive.desc}
                    </p>
                  </div>

                  {/* Gợi ý Hiệp Đồng Cơ Giáp */}
                  <div className="mt-2 text-[10px] font-mono flex items-center justify-between text-muted-foreground">
                    <span>Ưu tiên: <strong className="text-cyan-300 uppercase">{pilot.recommendedGear}</strong></span>
                    {matchesSelectedGear && (
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                        <Check className="size-2.5" /> Khớp Hiệp Đồng
                      </span>
                    )}
                  </div>

                  {/* Footer Thẻ: Nút Xem Chi Tiết / Phân Bổ Điểm */}
                  <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenInspect(pilot.id)
                      }}
                      className="w-full flex items-center justify-center gap-1 rounded border border-cyan-500/40 bg-cyan-950/30 px-2 py-1 text-[11px] font-mono font-bold text-cyan-300 hover:bg-cyan-900/50 hover:text-white transition-colors cursor-pointer"
                    >
                      <Info className="size-3" />
                      <span>Chi Tiết & Điểm ({pData.availablePoints})</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Nút Điều Hướng Chuyển Bước */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
            <button
              onClick={handleNextStep}
              className="flex items-center gap-2 rounded-xs bg-cyan-500 px-4 py-2 text-xs font-mono font-black text-black shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:bg-cyan-400 transition-all cursor-pointer"
            >
              <span>Tiếp Theo: Chọn Cơ Giáp</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </section>
      )}

      {/* ====================================================================
          BƯỚC 2: DANH MỤC & LỰA CHỌN CƠ GIÁP (GEAR SELECTION)
          ==================================================================== */}
      {currentStep === 2 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <div className="flex items-center gap-2">
              <Cpu className="size-4 text-cyan-400" />
              <h2 className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                DANH MỤC CƠ GIÁP KHẢ DỤNG (3 LỚP CHIẾN ĐẤU)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              Phi công đang chọn: <strong className="text-white">{activePilotDef.name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            {(["vanguard", "falcon", "aegis"] as StarfrontGearId[]).map((gearId) => {
              const def = STARFRONT_GEAR_DEFS[gearId]
              const isSelected = selectedGearId === gearId
              const isCurrentActive = activePairing.gearId === gearId
              const matchesPilot = activePilotDef.recommendedGear === gearId

              // Tính lực chiến của riêng Gear này khi lắp trang bị hiện tại
              const gearStats = calculateTotalGearStats(
                gearId,
                progression.level,
                progression.inventory,
                progression.equipped,
                currentPilotProg,
              )
              const rating = calculateGearCombatRating(gearStats.total)

              return (
                <div
                  key={gearId}
                  onClick={() => handleSelectGear(gearId)}
                  className={cn(
                    "group relative flex flex-col justify-between rounded-sm border p-3.5 transition-all cursor-pointer",
                    isSelected
                      ? "border-cyan-400 bg-cyan-950/70 shadow-[0_0_18px_rgba(34,211,238,0.3)] ring-1 ring-cyan-400/60"
                      : "border-border/60 bg-panel/70 hover:border-cyan-500/50 hover:bg-panel/95 opacity-90",
                  )}
                >
                  <div>
                    {/* Header Thẻ: Tên, Role & Minh họa */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="size-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: def.color }}
                          />
                          <span className="font-display text-sm font-bold text-white group-hover:text-cyan-300">
                            {def.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-300/90 block mt-0.5">
                          {def.role}
                        </span>
                      </div>

                      <div
                        className="size-12 shrink-0 rounded border p-1 bg-black/60 flex items-center justify-center"
                        style={{ borderColor: `${def.color}60` }}
                      >
                        <img
                          src={def.illustration || `/images/${gearId}.svg`}
                          alt={def.name}
                          className="size-full object-contain"
                        />
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {def.desc}
                    </p>

                    {/* Huy hiệu Lực chiến & Cấp độ */}
                    <div className="mt-2.5 flex items-center justify-between rounded bg-black/60 p-2 border border-border/50 text-[10px] font-mono">
                      <span>Lực Chiến Ước Tính:</span>
                      <strong className="text-amber-300 font-bold">{rating.toLocaleString("vi-VN")} CP</strong>
                    </div>

                    {/* Huy hiệu Nội Tại Cơ Giáp */}
                    <div className="mt-2 rounded bg-black/60 p-2 border border-border/50 text-[10px] font-mono">
                      <div className="flex items-center gap-1 font-bold text-cyan-300">
                        <Zap className="size-3 text-cyan-400" />
                        <span>{def.passive.name}</span>
                      </div>
                      <p className="text-[9.5px] text-muted-foreground mt-0.5 line-clamp-1">
                        {def.passive.shortDesc}
                      </p>
                    </div>

                    {/* Hiệp Đồng Với Phi Công Đang Chọn */}
                    {matchesPilot && (
                      <div className="mt-2 rounded border border-emerald-500/40 bg-emerald-950/40 p-1.5 text-[9.5px] font-mono text-emerald-300 flex items-center gap-1.5">
                        <Sparkles className="size-3 text-emerald-400 shrink-0" />
                        <span>{activePilotDef.synergyTitle} (Độ tương thích hoàn hảo)</span>
                      </div>
                    )}
                  </div>

                  {/* Footer Thẻ */}
                  <div className="mt-3.5 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground">
                      {def.baseStats.speed} SPD · {def.baseStats.attack} ATK · {def.baseStats.defense} DEF
                    </span>

                    {isSelected ? (
                      <span className="rounded bg-cyan-400 px-1.5 py-0.5 font-bold text-black">
                        ĐANG CHỌN
                      </span>
                    ) : isCurrentActive ? (
                      <span className="text-amber-400 font-bold">HIỆN TẠI</span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Nút Điều Hướng Chuyển Bước */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/50">
            <button
              onClick={handlePrevStep}
              className="flex items-center gap-1.5 rounded border border-border/60 bg-black/40 px-3.5 py-1.5 text-xs font-mono text-muted-foreground hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Quay Lại: Chọn Phi Công</span>
            </button>

            <button
              onClick={handleNextStep}
              className="flex items-center gap-2 rounded-xs bg-cyan-500 px-4 py-2 text-xs font-mono font-black text-black shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:bg-cyan-400 transition-all cursor-pointer"
            >
              <span>Tiếp Theo: Đánh Giá & Xác Nhận</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </section>
      )}

      {/* ====================================================================
          BƯỚC 3: ĐÁNH GIÁ & XÁC NHẬN CẶP ĐÔI (REVIEW & CONFIRMATION)
          ==================================================================== */}
      {currentStep === 3 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-cyan-400" />
              <h2 className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                BƯỚC 3: TỔNG QUAN TÁC CHIẾN & XÁC NHẬN KHÓA XUẤT KÍCH
              </h2>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              Vui lòng kiểm tra kỹ trước khi xác nhận khóa cặp đôi
            </span>
          </div>

          {/* Lưới 3 Cột: Pilot (Trái) — Tổng Hợp Chỉ Số (Giữa) — Gear (Phải) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Cột Trái: Hồ Sơ Phi Công (4 cols) */}
            <div className="rounded-sm border border-cyan-500/40 bg-panel/80 p-3.5 shadow-md lg:col-span-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <UserRound className="size-3.5 text-cyan-400" />
                    <span className="font-display text-xs font-bold uppercase text-white">
                      PHI CÔNG: {activePilotDef.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300">
                    Cấp {currentPilotProg.level}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="size-20 shrink-0 rounded border border-cyan-500/60 bg-black/60 overflow-hidden shadow-inner">
                    <img
                      src={activePilotDef.avatar}
                      alt={activePilotDef.name}
                      className="size-full object-cover"
                    />
                  </div>

                  <div className="font-mono text-[11px] space-y-1">
                    <span className="font-bold text-white block">{activePilotDef.title}</span>
                    <span className="text-[10px] text-muted-foreground block">{activePilotDef.specialty}</span>
                    <span className="text-[9.5px] text-cyan-300/80 block">
                      Hô hiệu: <strong>{activePilotDef.callsign}</strong>
                    </span>
                    <span className="text-[9.5px] text-muted-foreground block">
                      EXP: {currentPilotProg.exp} / {getPilotExpRequiredForLevel(currentPilotProg.level)}
                    </span>
                  </div>
                </div>

                {/* Điểm thuộc tính đã phân bổ */}
                <div className="mt-3.5 rounded bg-black/60 p-2.5 border border-border/40 font-mono text-[10px] space-y-1.5">
                  <span className="text-muted-foreground font-bold block mb-1">
                    Điểm Thuộc Tính Phi Công (+5 / cấp):
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-slate-300">
                    <div>Tấn Công (ATK): <strong className="text-white">+{currentPilotProg.allocatedStats.attack * 2}</strong></div>
                    <div>Phòng Thủ (DEF): <strong className="text-white">+{currentPilotProg.allocatedStats.defense * 1.5}</strong></div>
                    <div>Cơ Động (SPD): <strong className="text-white">+{currentPilotProg.allocatedStats.agility}</strong></div>
                    <div>Khiên (Shield): <strong className="text-white">+{currentPilotProg.allocatedStats.shield * 30}</strong></div>
                    <div className="col-span-2">Bạo Kích (Crit): <strong className="text-white">+{(currentPilotProg.allocatedStats.tactical * 0.4).toFixed(1)}%</strong></div>
                  </div>
                </div>

                {/* Nội tại phi công */}
                <div className="mt-3 rounded bg-black/60 p-2.5 border border-border/40 font-mono text-[10px]">
                  <div className="flex items-center gap-1 font-bold text-amber-300 mb-0.5">
                    <Sparkles className="size-3 text-amber-400" />
                    <span>Nội Tại: {activePilotDef.passive.name}</span>
                  </div>
                  <p className="text-[9.5px] text-muted-foreground leading-relaxed">
                    {activePilotDef.passive.desc}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border/40">
                <button
                  onClick={() => handleOpenInspect(selectedPilotId)}
                  className="w-full flex items-center justify-center gap-1.5 rounded border border-cyan-500/40 bg-cyan-950/40 py-1.5 text-xs font-mono text-cyan-300 hover:text-white hover:bg-cyan-900 transition-colors cursor-pointer"
                >
                  <Plus className="size-3" />
                  <span>Phân Bổ Điểm & Xem Tiểu Sử</span>
                </button>
              </div>
            </div>

            {/* Cột Giữa: Chỉ Số Tổng Hợp Minh Bạch (4 cols) */}
            <div className="rounded-sm border border-cyan-500/60 bg-panel/90 p-3.5 shadow-md lg:col-span-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Gauge className="size-3.5 text-cyan-400" />
                    <span className="font-display text-xs font-bold uppercase text-white">
                      CHỈ SỐ TỔNG HỢP SAU KHI GHÉP ĐÔI
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300 font-bold">
                    {combatRating.toLocaleString("vi-VN")} CP
                  </span>
                </div>

                {/* Bảng phân rã chi tiết nguồn gốc chỉ số */}
                <div className="space-y-1.5 font-mono text-xs">
                  {[
                    { label: "Máu Tối Đa (HP)", val: statsBreakdown.total.hp, base: statsBreakdown.base.hp, bonus: statsBreakdown.bonuses.hp },
                    { label: "Năng Lượng (SP)", val: statsBreakdown.total.sp, base: statsBreakdown.base.sp, bonus: statsBreakdown.bonuses.sp },
                    { label: "Sức Tấn Công (ATK)", val: Math.round(statsBreakdown.total.attack), base: statsBreakdown.base.attack, bonus: Math.round(statsBreakdown.bonuses.attack) },
                    { label: "Giáp Phòng Ngự (DEF)", val: Math.round(statsBreakdown.total.defense), base: statsBreakdown.base.defense, bonus: Math.round(statsBreakdown.bonuses.defense) },
                    { label: "Tốc Độ Hành Động (SPD)", val: Math.round(statsBreakdown.total.speed), base: statsBreakdown.base.speed, bonus: Math.round(statsBreakdown.bonuses.speed) },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between rounded bg-black/40 px-2.5 py-1.5 border border-border/40"
                    >
                      <span className="text-muted-foreground text-[11px]">{row.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">
                          ({row.base} gốc + {row.bonus} bonus)
                        </span>
                        <strong className="text-cyan-300 font-bold">{row.val}</strong>
                      </div>
                    </div>
                  ))}

                  {/* Khiên, Né Tránh, Bạo Kích */}
                  <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="rounded bg-black/40 p-2 border border-border/40">
                      <span className="text-muted-foreground block">Khiên Năng Lượng</span>
                      <strong className="text-blue-300">
                        {(selectedGearId === "aegis" ? 480 : selectedGearId === "vanguard" ? 300 : 180) +
                          (currentPilotProg.allocatedStats.shield || 0) * 30}{" "}
                        Shield
                      </strong>
                    </div>
                    <div className="rounded bg-black/40 p-2 border border-border/40">
                      <span className="text-muted-foreground block">Tỉ Lệ Né Tránh</span>
                      <strong className="text-purple-300">
                        {(selectedGearId === "falcon" ? 15 : 0) +
                          (selectedPilotId === "alviss" ? 8 : 0) +
                          Math.round((currentPilotProg.allocatedStats.agility || 0) * 0.2)}
                        %
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Huy hiệu Hiệp Đồng (Synergy Match) */}
                <div
                  className={cn(
                    "mt-3 rounded p-2.5 border font-mono text-[10px]",
                    isSynergyMatch
                      ? "border-emerald-500/60 bg-emerald-950/40 text-emerald-300"
                      : "border-border/60 bg-black/50 text-muted-foreground",
                  )}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="size-3.5 text-emerald-400" />
                    <span>
                      {isSynergyMatch ? `HIỆP ĐỒNG HOÀN HẢO: ${activePilotDef.synergyTitle}` : "Hiệp Đồng Chiến Thuật Tiêu Chuẩn"}
                    </span>
                  </div>
                  <p className="mt-1 text-[9.5px] leading-relaxed">
                    {isSynergyMatch ? activePilotDef.synergyBonus : "Cặp đôi này hoạt động bình thường mà không nhận thêm phụ trội hiệp đồng chuyên biệt."}
                  </p>
                </div>
              </div>

              {/* Hộp Xác Nhận Khóa Xuất Kích */}
              <div className="mt-3.5 pt-3 border-t border-border/50 space-y-2">
                {isLocked ? (
                  <div className="rounded border border-amber-500/60 bg-amber-950/40 p-2.5 text-center font-mono">
                    <div className="flex items-center justify-center gap-1.5 text-amber-300 text-xs font-bold">
                      <Lock className="size-3.5 text-amber-400" />
                      <span>ĐANG KHÓA XUẤT KÍCH</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Cần hoàn thành 5 nhiệm vụ hoặc 5 trận thắng để mở khóa đổi cặp mới.
                    </p>
                    <div className="mt-1.5 flex justify-center gap-3 text-[10px] text-amber-300">
                      <span>Nhiệm vụ: {completedMissions}/5</span>
                      <span>Trận thắng: {wonBattles}/5</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleConfirmPairingAction}
                      className="w-full flex items-center justify-center gap-2 rounded-xs bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2.5 font-display text-xs font-black text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:brightness-110 transition-all cursor-pointer uppercase tracking-wider"
                    >
                      <Check className="size-4" />
                      <span>XÁC NHẬN GHÉP ĐÔI & KHÓA XUẤT KÍCH</span>
                    </button>
                    <p className="text-center font-mono text-[9.5px] text-muted-foreground">
                      * Cặp đôi sẽ được khóa cố định trong 5 nhiệm vụ hoặc 5 trận thắng tiếp theo.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Cột Phải: Hồ Sơ Cơ Giáp (4 cols) */}
            <div className="rounded-sm border border-cyan-500/40 bg-panel/80 p-3.5 shadow-md lg:col-span-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="size-3.5 text-cyan-400" />
                    <span className="font-display text-xs font-bold uppercase text-white">
                      CƠ GIÁP: {activeGearDef.name}
                    </span>
                  </div>
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: activeGearDef.color }}
                  />
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className="size-20 shrink-0 rounded border p-1 bg-black/60 flex items-center justify-center shadow-inner"
                    style={{ borderColor: `${activeGearDef.color}60` }}
                  >
                    <img
                      src={activeGearDef.illustration || `/images/${selectedGearId}.svg`}
                      alt={activeGearDef.name}
                      className="size-full object-contain"
                    />
                  </div>

                  <div className="font-mono text-[11px] space-y-1">
                    <span className="font-bold text-white block">{activeGearDef.role}</span>
                    <span className="text-[10px] text-muted-foreground block line-clamp-2">
                      {activeGearDef.desc}
                    </span>
                    <span className="text-[9.5px] text-cyan-300 block">
                      Khung Thân Cấp: <strong>Cấp {progression.level}</strong>
                    </span>
                  </div>
                </div>

                {/* 5 Ô Kỹ Năng Của Cơ Giáp */}
                <div className="mt-3.5 rounded bg-black/60 p-2.5 border border-border/40 font-mono text-[10px] space-y-1">
                  <span className="text-muted-foreground font-bold block mb-1">
                    5 Ô Kỹ Năng Trang Bị Sẵn:
                  </span>
                  {activeGearDef.skills.slice(0, 5).map((sk, idx) => (
                    <div key={sk.id} className="flex items-center justify-between text-slate-300">
                      <span className="truncate">
                        {idx + 1}. {sk.name}
                      </span>
                      <span className="text-[9px] text-muted-foreground">{sk.spCost} SP</span>
                    </div>
                  ))}
                </div>

                {/* Nội tại cơ giáp */}
                <div className="mt-3 rounded bg-black/60 p-2.5 border border-border/40 font-mono text-[10px]">
                  <div className="flex items-center gap-1 font-bold text-cyan-300 mb-0.5">
                    <Zap className="size-3 text-cyan-400" />
                    <span>Nội Tại Cơ Giáp: {activeGearDef.passive.name}</span>
                  </div>
                  <p className="text-[9.5px] text-muted-foreground leading-relaxed">
                    {activeGearDef.passive.desc}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border/40">
                <button
                  onClick={() => {
                    playClickSound()
                    setCurrentStep(2)
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded border border-cyan-500/40 bg-cyan-950/40 py-1.5 text-xs font-mono text-cyan-300 hover:text-white hover:bg-cyan-900 transition-colors cursor-pointer"
                >
                  <RotateCcw className="size-3" />
                  <span>Đổi Sang Lớp Cơ Giáp Khác</span>
                </button>
              </div>
            </div>
          </div>

          {/* Nút Điều Hướng Cuối Cùng */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/50">
            <button
              onClick={handlePrevStep}
              className="flex items-center gap-1.5 rounded border border-border/60 bg-black/40 px-3.5 py-1.5 text-xs font-mono text-muted-foreground hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Quay Lại: Chọn Cơ Giáp</span>
            </button>

            {onNavigateToCombat && (
              <button
                onClick={onNavigateToCombat}
                className="flex items-center gap-1.5 rounded border border-amber-500/60 bg-amber-950/40 px-3.5 py-1.5 text-xs font-mono font-bold text-amber-300 hover:bg-amber-900/60 transition-colors cursor-pointer"
              >
                <Swords className="size-3.5 text-amber-400" />
                <span>Xuất Kích Ra Đấu Trường Ngay</span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* ====================================================================
          MODAL XEM CHI TIẾT & PHÂN BỔ ĐIỂM THUỘC TÍNH PHI CÔNG (DETAILS MODAL)
          ==================================================================== */}
      {inspectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-sm border border-cyan-500/60 bg-panel p-4 shadow-2xl space-y-4">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <div className="flex items-center gap-2">
                <Info className="size-4 text-cyan-400" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                  HỒ SƠ PHI CÔNG & PHÂN BỔ THUỘC TÍNH
                </h3>
              </div>
              <button
                onClick={() => setInspectModalOpen(false)}
                className="size-7 flex items-center justify-center rounded hover:bg-white/10 text-muted-foreground hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Quick Switcher giữa 4 Phi Công */}
            <div className="grid grid-cols-4 gap-2">
              {STARFRONT_PILOTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    playClickSound()
                    setInspectPilotId(p.id)
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded border p-1.5 text-left transition-all cursor-pointer font-mono text-xs",
                    inspectPilotId === p.id
                      ? "border-cyan-400 bg-cyan-950/60 text-white shadow-sm"
                      : "border-border/40 bg-black/40 text-muted-foreground hover:border-border",
                  )}
                >
                  <img src={p.avatar} alt={p.name} className="size-7 rounded object-cover" />
                  <span className="truncate font-bold">{p.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>

            {/* Nội dung hồ sơ phi công đang duyệt */}
            {(() => {
              const pDef = STARFRONT_PILOT_MAP[inspectPilotId] || STARFRONT_PILOTS[0]
              const pData: PilotProgressionData = pilotsData[inspectPilotId] || {
                id: inspectPilotId,
                level: 1,
                exp: 0,
                allocatedStats: { attack: 0, defense: 0, agility: 0, shield: 0, tactical: 0 },
                availablePoints: 0,
              }

              return (
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3 rounded bg-black/40 p-3 border border-border/40">
                    <img src={pDef.avatar} alt={pDef.name} className="size-16 rounded object-cover border border-cyan-500/40" />
                    <div className="font-mono text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{pDef.name}</span>
                        <span className="rounded bg-cyan-950 px-1.5 py-0.2 text-[9px] text-cyan-300 border border-cyan-500/40">
                          Cấp {pData.level}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{pDef.bio}</p>
                    </div>
                  </div>

                  {/* Bảng phân bổ điểm thuộc tính */}
                  <div className="rounded bg-black/60 p-3 border border-border/50 font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                      <span className="font-bold text-white">PHÂN BỔ ĐIỂM THUỘC TÍNH:</span>
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-300 border border-emerald-500/40">
                        Điểm Khả Dụng: {pData.availablePoints}
                      </span>
                    </div>

                    {[
                      { key: "attack" as PilotAttributeKey, label: "Tấn Công (ATK)", effect: "+2.0 ATK / điểm" },
                      { key: "defense" as PilotAttributeKey, label: "Phòng Ngự (DEF)", effect: "+1.5 DEF / điểm" },
                      { key: "agility" as PilotAttributeKey, label: "Cơ Động (SPD)", effect: "+1.0 SPD (+0.2% Né) / điểm" },
                      { key: "shield" as PilotAttributeKey, label: "Khiên Năng Lượng", effect: "+30 Shield / điểm" },
                      { key: "tactical" as PilotAttributeKey, label: "Chiến Thuật (TAC)", effect: "+0.4% Bạo Kích / điểm" },
                    ].map((st) => (
                      <div key={st.key} className="flex items-center justify-between py-1 border-b border-border/20">
                        <div>
                          <span className="font-bold text-slate-200">{st.label}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">({st.effect})</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-bold text-cyan-300 w-6 text-right">
                            {pData.allocatedStats[st.key] || 0}
                          </span>
                          <button
                            onClick={() => handleAllocateStat(inspectPilotId, st.key)}
                            disabled={pData.availablePoints <= 0}
                            className="size-6 flex items-center justify-center rounded border border-cyan-500/60 bg-cyan-950/60 text-cyan-300 hover:bg-cyan-500 hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Cộng 1 điểm"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Nút Tẩy Điểm (Reset Points) */}
                  <div className="flex items-center justify-between pt-1 font-mono text-xs">
                    <button
                      onClick={() => handleResetStats(inspectPilotId)}
                      className="flex items-center gap-1.5 rounded border border-amber-500/50 bg-amber-950/40 px-3 py-1.5 text-amber-300 hover:bg-amber-900/60 transition-colors cursor-pointer text-[11px]"
                    >
                      <RotateCcw className="size-3 text-amber-400" />
                      <span>Tẩy Điểm Thuộc Tính (200 Credits)</span>
                    </button>

                    <button
                      onClick={() => setInspectModalOpen(false)}
                      className="rounded bg-cyan-500 px-4 py-1.5 text-xs font-bold text-black hover:bg-cyan-400 transition-colors cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
