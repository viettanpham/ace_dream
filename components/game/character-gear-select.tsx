"use client"

import React, { useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Boxes,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Cpu,
  Crosshair,
  Eye,
  Flame,
  Gauge,
  Hammer,
  HelpCircle,
  Info,
  Layers,
  Lock,
  Minus,
  Plus,
  Quote,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sliders,
  Sparkles,
  Sword,
  Swords,
  Unlock,
  UserCheck,
  UserRound,
  Users,
  Wind,
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
  calculateItemRating,
  calculateTotalGearStats,
  confirmPairing,
  getAircraftSkillPoints,
  getEnhancedItemStats,
  getItemDisplayName,
  getPilotExpRequiredForLevel,
  hasCompletedAllPairingMissions,
  isSelectionMandatory,
  isSelectionOptional,
  isValidPilotGearSelection,
  resetPilotPoints,
} from "@/lib/game/progression"
import {
  playClickSound,
  playEquipSound,
  playLevelUpSound,
  playShieldSound,
} from "@/lib/game/audio"
import { saveStarfrontProgression } from "@/lib/game/storage"
import type {
  CombatSkill,
  PilotAttributeKey,
  PilotProgressionData,
  StarfrontGearClassDef,
  StarfrontGearId,
  StarfrontItem,
  StarfrontItemSlot,
  StarfrontProgression,
} from "@/lib/game/types"
import {
  buildDetailedSkillSlots,
  getEnhancementBadgeMeta,
  RARITY_CONFIG,
  SLOT_META,
  type SkillSlotDetail,
} from "./starfront-hangar"
import { PilotSkillView } from "./pilot-skill-view"
import { AdminCpModal } from "./admin-cp-modal"
import { createInitialPilotSynergySkill } from "@/lib/game/pilot-skill-engine"
import type { PilotSynergySkillInstance } from "@/lib/game/pilot-skill-types"
import { cn } from "@/lib/utils"

interface CharacterGearSelectProps {
  progression: StarfrontProgression
  onUpdateProgression: (updated: StarfrontProgression) => void
  onNavigateToHangar?: () => void
  onNavigateToCombat?: () => void
  onNavigateToPilotStatus?: () => void
  onContinueWithCurrentSelection?: () => void
  onEquipItem?: (itemId: string, slot: StarfrontItemSlot) => void
  onUnequipSlot?: (slot: StarfrontItemSlot) => void
}

type SelectionStep = 1 | 2 | 3
type CockpitSubTab = "equipment" | "skills" | "pilot_synergy"

export function CharacterGearSelect({
  progression,
  onUpdateProgression,
  onNavigateToHangar,
  onNavigateToCombat,
  onNavigateToPilotStatus,
  onContinueWithCurrentSelection,
  onEquipItem,
  onUnequipSlot,
}: CharacterGearSelectProps) {
  const isMandatory = isSelectionMandatory(progression)
  const isOptional = isSelectionOptional(progression)
  const hasCompleted5Missions = hasCompletedAllPairingMissions(progression)

  // Cặp đôi hiện đang lưu trong tiến trình (fallback an toàn chống crash nếu thiếu dữ liệu)
  const activePairing = progression.activePairing || {
    pilotId: "marcus",
    gearId: progression.activeGearId || "vanguard",
    isLocked: false,
    unlockProgress: { completedMissions: 0, wonBattles: 0, targetCount: 5 },
  }

  // Thông tin trạng thái khóa
  const isLocked = Boolean(activePairing.isLocked)
  const wonBattles = activePairing.unlockProgress?.wonBattles || 0
  const completedMissions = activePairing.unlockProgress?.completedMissions || 0

  // Thu nhỏ tùy chọn chọn cặp đôi:
  // - Nếu mandatory: LUÔN mở rộng (false) để người chơi bắt buộc chọn
  // - Nếu đã khóa: thu nhỏ (true) vì không thể thay đổi
  // - Nếu optional: mở rộng hoặc người chơi có thể thu nhỏ / bỏ qua
  const [isSelectionFlowCollapsed, setIsSelectionFlowCollapsed] = useState<boolean>(isLocked && !isMandatory)

  const handleSkipOptionalSelection = () => {
    playClickSound()
    if (onContinueWithCurrentSelection) {
      onContinueWithCurrentSelection()
    } else if (onNavigateToCombat) {
      onNavigateToCombat()
    } else if (onNavigateToHangar) {
      onNavigateToHangar()
    }
  }

  // Trạng thái bước hiện tại trong quy trình 3 bước
  const [currentStep, setCurrentStep] = useState<SelectionStep>(1)

  // Lựa chọn tạm thời đang tương tác trong luồng 3 bước
  const [selectedPilotId, setSelectedPilotId] = useState<string>(activePairing.pilotId || "marcus")
  const [selectedGearId, setSelectedGearId] = useState<StarfrontGearId>(
    activePairing.gearId || progression.activeGearId || "vanguard",
  )

  // Sub-tab bên trong Buồng Lái & Trang Bị / Mô-Đun Kỹ Năng
  const [cockpitTab, setCockpitTab] = useState<CockpitSubTab>("equipment")

  // Modal trang bị vật phẩm vào slot
  const [equipModalSlot, setEquipModalSlot] = useState<StarfrontItemSlot | null>(null)

  // Modal xem chi tiết kỹ năng
  const [inspectSkillSlot, setInspectSkillSlot] = useState<SkillSlotDetail | null>(null)

  // Modal xem chi tiết & phân bổ điểm thuộc tính phi công nổi bật (Pilot Spotlight Dialog)
  const [pilotDialogOpen, setPilotDialogOpen] = useState(false)
  const [inspectPilotId, setInspectPilotId] = useState<string>(selectedPilotId)

  // Modal xem chi tiết cơ giáp / phi cơ nổi bật (Gear / Aircraft Spotlight Dialog)
  const [gearDialogOpen, setGearDialogOpen] = useState(false)
  const [inspectGearId, setInspectGearId] = useState<StarfrontGearId>(selectedGearId)

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isAdminCpOpen, setIsAdminCpOpen] = useState(false)

  // Phi công & Cơ giáp hiện đang được kích hoạt xuất kích (Active Pairing)
  const activePilotId = activePairing.pilotId || "marcus"
  const activeGearId = activePairing.gearId || progression.activeGearId || "vanguard"
  const activePilotDef: StarfrontPilotDef = STARFRONT_PILOT_MAP[activePilotId] || STARFRONT_PILOTS[0]
  const activeGearDef: StarfrontGearClassDef = STARFRONT_GEAR_DEFS[activeGearId] || STARFRONT_GEAR_DEFS.vanguard

  // Dữ liệu tiến trình phi công đang hoạt động
  const pilotsData = progression.pilots || {}
  const activePilotProg: PilotProgressionData = pilotsData[activePilotId] || {
    id: activePilotId,
    level: 1,
    exp: 0,
    allocatedStats: { attack: 0, defense: 0, agility: 0, shield: 0, tactical: 0 },
    availablePoints: 0,
  }

  // Phase 5.9: Kỹ năng Liên Hoàn của phi công đang hoạt động
  const activePilotSynergySkill = useMemo(() => {
    return (
      progression.pilotSkills?.[activePilotId] ||
      createInitialPilotSynergySkill(
        activePilotId,
        activePilotProg.level,
        progression.globalAdminConfig,
      )
    )
  }, [progression.pilotSkills, activePilotId, activePilotProg.level, progression.globalAdminConfig])

  const handleUpdatePilotSkill = (
    updatedSkill: PilotSynergySkillInstance,
    tokensUsed: number,
    creditsUsed: number,
  ) => {
    const updatedSkills = {
      ...(progression.pilotSkills || {}),
      [activePilotId]: updatedSkill,
    }
    const nextTokens = Math.max(0, (progression.rerollTokens || 0) - tokensUsed)
    const nextCredits = Math.max(0, progression.credits - creditsUsed)
    const updatedProg: StarfrontProgression = {
      ...progression,
      pilotSkills: updatedSkills,
      rerollTokens: nextTokens,
      credits: nextCredits,
    }
    onUpdateProgression(updatedProg)
    saveStarfrontProgression(updatedProg)
  }

  // Phi công & Cơ giáp được chọn trong luồng 3 bước (Flow Selection)
  const flowPilotDef: StarfrontPilotDef = STARFRONT_PILOT_MAP[selectedPilotId] || STARFRONT_PILOTS[0]
  const flowGearDef: StarfrontGearClassDef = STARFRONT_GEAR_DEFS[selectedGearId] || STARFRONT_GEAR_DEFS.vanguard
  const flowPilotProg: PilotProgressionData = pilotsData[selectedPilotId] || {
    id: selectedPilotId,
    level: 1,
    exp: 0,
    allocatedStats: { attack: 0, defense: 0, agility: 0, shield: 0, tactical: 0 },
    availablePoints: 0,
  }

  // Tính toán chỉ số tổng hợp thực tế của tổ hợp đang hoạt động
  const activeStatsBreakdown = useMemo(() => {
    return calculateTotalGearStats(
      activeGearId,
      progression.level,
      progression.inventory,
      progression.equipped,
      activePilotProg,
    )
  }, [activeGearId, progression.level, progression.inventory, progression.equipped, activePilotProg])

  const activeCombatRating = useMemo(() => {
    return calculateGearCombatRating({
      hp: activeStatsBreakdown.total.hp,
      sp: activeStatsBreakdown.total.sp,
      attack: activeStatsBreakdown.total.attack,
      defense: activeStatsBreakdown.total.defense,
      speed: activeStatsBreakdown.total.speed,
    })
  }, [activeStatsBreakdown])

  // Tính toán chỉ số cho luồng chọn 3 bước
  const flowStatsBreakdown = useMemo(() => {
    return calculateTotalGearStats(
      selectedGearId,
      progression.level,
      progression.inventory,
      progression.equipped,
      flowPilotProg,
    )
  }, [selectedGearId, progression.level, progression.inventory, progression.equipped, flowPilotProg])

  const flowCombatRating = useMemo(() => {
    return calculateGearCombatRating({
      hp: flowStatsBreakdown.total.hp,
      sp: flowStatsBreakdown.total.sp,
      attack: flowStatsBreakdown.total.attack,
      defense: flowStatsBreakdown.total.defense,
      speed: flowStatsBreakdown.total.speed,
    })
  }, [flowStatsBreakdown])

  // Danh sách 5 Slot Kỹ Năng của Cơ Giáp đang kích hoạt
  const activeSkillSlots: SkillSlotDetail[] = useMemo(() => {
    return buildDetailedSkillSlots(activeGearDef)
  }, [activeGearDef])

  const skillPoints = useMemo(() => {
    return getAircraftSkillPoints(progression.level)
  }, [progression.level])

  // Xử lý chuyển bước
  const handleNextStep = () => {
    playClickSound()
    if (currentStep === 1) setCurrentStep(2)
    else if (currentStep === 2) setCurrentStep(3)
  }

  const handlePrevStep = () => {
    playClickSound()
    if (currentStep === 3) setCurrentStep(2)
    else if (currentStep === 2) setCurrentStep(1)
  }

  // Chọn phi công ở Bước 1
  const handleSelectPilotInFlow = (pilotId: string) => {
    playClickSound()
    setSelectedPilotId(pilotId)
    // Tự động gợi ý cơ giáp tương thích tốt nhất
    const pilotDef = STARFRONT_PILOT_MAP[pilotId]
    if (pilotDef && pilotDef.recommendedGear) {
      setSelectedGearId(pilotDef.recommendedGear)
    }
  }

  // Chọn cơ giáp ở Bước 2
  const handleSelectGearInFlow = (gearId: StarfrontGearId) => {
    playClickSound()
    setSelectedGearId(gearId)
  }

  // Mở modal spotlight nổi bật phi công
  const handleOpenPilotSpotlight = (pilotId: string) => {
    playClickSound()
    setInspectPilotId(pilotId)
    setPilotDialogOpen(true)
  }

  // Mở modal spotlight nổi bật cơ giáp
  const handleOpenGearSpotlight = (gearId: StarfrontGearId) => {
    playClickSound()
    setInspectGearId(gearId)
    setGearDialogOpen(true)
  }

  // Xác nhận chọn phi công từ modal spotlight và chuyển bước
  const handleConfirmPilotFromSpotlight = (pilotId: string) => {
    playEquipSound()
    setSelectedPilotId(pilotId)
    const pilotDef = STARFRONT_PILOT_MAP[pilotId]
    if (pilotDef && pilotDef.recommendedGear) {
      setSelectedGearId(pilotDef.recommendedGear)
    }
    setPilotDialogOpen(false)
    if (currentStep === 1) {
      setCurrentStep(2)
    }
    setFeedbackMessage({
      type: "success",
      text: `Đã chọn phi công [${pilotDef?.name || pilotId}]! Hãy chọn cơ giáp xuất kích phù hợp.`,
    })
  }

  // Xác nhận chọn cơ giáp từ modal spotlight và chuyển bước
  const handleConfirmGearFromSpotlight = (gearId: StarfrontGearId) => {
    playEquipSound()
    setSelectedGearId(gearId)
    setGearDialogOpen(false)
    if (currentStep === 2) {
      setCurrentStep(3)
    }
    const gearDef = STARFRONT_GEAR_DEFS[gearId]
    setFeedbackMessage({
      type: "success",
      text: `Đã chọn cơ giáp [${gearDef?.name || gearId}]! Tiến hành đánh giá & khóa xuất kích ở Bước 3.`,
    })
  }

  // Phân bổ 1 điểm thuộc tính cho phi công
  const handleAllocatePoint = (pilotId: string, statKey: PilotAttributeKey) => {
    const res = allocatePilotPoint(progression, pilotId, statKey)
    if (res.success) {
      playLevelUpSound()
      onUpdateProgression(res.updated)
      saveStarfrontProgression(res.updated)
      setFeedbackMessage({ type: "success", text: res.message })
    } else {
      setFeedbackMessage({ type: "error", text: res.message })
    }
  }

  // Cài lại toàn bộ điểm thuộc tính của phi công
  const handleResetPoints = (pilotId: string) => {
    const res = resetPilotPoints(progression, pilotId, 200)
    if (res.success) {
      playShieldSound()
      onUpdateProgression(res.updated)
      saveStarfrontProgression(res.updated)
      setFeedbackMessage({ type: "success", text: res.message })
    } else {
      setFeedbackMessage({ type: "error", text: res.message })
    }
  }

  // Xác nhận ghép đôi ở Bước 3
  const handleConfirmPairing = () => {
    const res = confirmPairing(progression, selectedPilotId, selectedGearId)
    if (res.success) {
      playEquipSound()
      onUpdateProgression(res.updated)
      saveStarfrontProgression(res.updated)
      setFeedbackMessage({
        type: "success",
        text: `Đã xác nhận ghép đôi [${flowPilotDef.name}] & [${flowGearDef.name}] xuất kích! Đã khóa 5 nhiệm vụ / 5 trận thắng.`,
      })
      // Sau khi xác nhận thành công, tự động thu nhỏ quy trình chọn
      setIsSelectionFlowCollapsed(true)
    } else {
      setFeedbackMessage({ type: "error", text: res.message })
    }
  }

  // Tháo trang bị tại buồng lái
  const handleUnequipItem = (slot: StarfrontItemSlot) => {
    if (onUnequipSlot) {
      onUnequipSlot(slot)
    } else {
      const updated: StarfrontProgression = {
        ...progression,
        equipped: {
          ...progression.equipped,
          [slot]: null,
        },
      }
      onUpdateProgression(updated)
      saveStarfrontProgression(updated)
      playClickSound()
    }
    setFeedbackMessage({ type: "success", text: `Đã tháo trang bị khỏi vị trí ${SLOT_META[slot].label}!` })
  }

  // Lắp trang bị từ modal chọn đồ
  const handleEquipItemFromModal = (itemId: string, slot: StarfrontItemSlot) => {
    if (onEquipItem) {
      onEquipItem(itemId, slot)
    } else {
      const updated: StarfrontProgression = {
        ...progression,
        equipped: {
          ...progression.equipped,
          [slot]: itemId,
        },
      }
      onUpdateProgression(updated)
      saveStarfrontProgression(updated)
      playEquipSound()
    }
    setEquipModalSlot(null)
    setFeedbackMessage({ type: "success", text: `Đã lắp trang bị thành công vào buồng lái!` })
  }

  // EXP của phi công đang hoạt động
  const pilotExpReq = getPilotExpRequiredForLevel(activePilotProg.level)
  const pilotExpPct = Math.min(100, Math.round((activePilotProg.exp / pilotExpReq) * 100))

  return (
    <div className="space-y-4">
      {/* ====================================================================
          1. HEADER BANNER: THU NHỎ / MỞ RỘNG TÙY CHỌN GHÉP ĐÔI (COLLAPSIBLE BAR)
          ==================================================================== */}
      <section className="relative overflow-hidden rounded-sm border border-cyan-500/40 bg-panel/90 p-3.5 shadow-lg backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Trái: Tên Phân Hệ & Huy hiệu Cặp Đôi Đang Hoạt Động */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => handleOpenPilotSpotlight(activePilotId)}
              className="relative size-10 shrink-0 overflow-hidden rounded-sm border border-cyan-400/60 bg-black/60 shadow-[0_0_12px_rgba(34,211,238,0.3)] cursor-pointer hover:border-cyan-300 transition-colors"
              title="Bấm để mở hồ sơ nổi bật phi công"
            >
              <img
                src={activePilotDef.avatar}
                alt={activePilotDef.name}
                className="size-full object-cover object-top"
              />
              <span className="absolute bottom-0 right-0 bg-cyan-950/90 px-1 font-mono text-[8px] font-bold text-cyan-300">
                L{activePilotProg.level}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-sm font-black tracking-wider text-white uppercase">
                  NHÂN VẬT & CƠ GIÁP (CHARACTER & GEAR)
                </h1>
                <span className="rounded bg-cyan-950 px-1.5 py-0.5 text-[9px] font-mono font-bold text-cyan-300 border border-cyan-500/40">
                  PHASE 5.8
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => handleOpenPilotSpotlight(activePilotId)}
                  className="font-bold text-cyan-300 hover:text-cyan-100 hover:underline cursor-pointer"
                  title="Xem chi tiết phi công"
                >
                  {activePilotDef.name}
                </button>
                <span className="text-muted-foreground">·</span>
                <button
                  type="button"
                  onClick={() => handleOpenGearSpotlight(activeGearId)}
                  className="flex items-center gap-1 font-bold text-white hover:text-cyan-300 hover:underline cursor-pointer"
                  title="Xem chi tiết cơ giáp"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: activeGearDef.color }}
                  />
                  <span>{activeGearDef.name}</span>
                </button>
                <span className="text-[10px] text-muted-foreground">({activeGearDef.role})</span>
              </div>
            </div>
          </div>

          {/* Giữa: Trạng Thái Khóa & Tiến Độ Mở Khóa (Phân biệt Rõ Mandatory vs Optional) */}
          <div className="flex items-center gap-2 font-mono text-xs">
            {isMandatory ? (
              <div className="flex items-center gap-2 rounded border border-amber-500/70 bg-amber-950/60 px-3 py-1 text-amber-300 shadow-sm animate-pulse">
                <AlertTriangle className="size-3.5 text-amber-400 shrink-0" />
                <span className="font-bold">BẮT BUỘC: CHƯA CÓ TỔ HỢP PHI CÔNG & CƠ GIÁP</span>
              </div>
            ) : isLocked ? (
              <div className="flex items-center gap-2 rounded border border-amber-500/60 bg-amber-950/40 px-3 py-1 text-amber-300 shadow-sm">
                <Lock className="size-3.5 text-amber-400 shrink-0 animate-pulse" />
                <div>
                  <span className="font-bold">ĐANG KHÓA XUẤT KÍCH:</span>
                  <span className="ml-1.5 text-white font-semibold">
                    {completedMissions}/5 Nhiệm Vụ · {wonBattles}/5 Trận Thắng
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded border border-emerald-500/60 bg-emerald-950/40 px-3 py-1 text-emerald-300 shadow-sm">
                <Unlock className="size-3.5 text-emerald-400 shrink-0" />
                <span className="font-bold">ĐÃ MỞ KHÓA · TÙY CHỌN ĐỔI HOẶC TIẾP TỤC</span>
              </div>
            )}
          </div>

          {/* Phải: Nút Tiếp Tục (Nếu Optional), Nút Thu Nhỏ / Mở Rộng Quy Trình 3 Bước & Mở Hangar */}
          <div className="flex items-center gap-2">
            {/* Phase 5.11: Nút bỏ qua / tiếp tục khi optional */}
            {isOptional && (
              <button
                onClick={handleSkipOptionalSelection}
                className="flex items-center gap-1.5 rounded border border-emerald-500/60 bg-emerald-950/70 hover:bg-emerald-900/80 px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider text-emerald-200 transition-all cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.25)]"
                title="Bỏ qua thay đổi và tiếp tục xuất kích với tổ hợp hiện tại"
              >
                <span>Tiếp Tục (Giữ Nguyên)</span>
                <ArrowRight className="size-3.5" />
              </button>
            )}

            {isLocked ? (
              <div
                className="flex items-center gap-1.5 rounded border border-amber-500/60 bg-amber-950/60 px-3 py-1.5 font-display text-xs font-bold text-amber-300 shadow-sm cursor-not-allowed select-none"
                title={`Đang khóa chiến dịch (${completedMissions}/5 Nhiệm Vụ · ${wonBattles}/5 Trận Thắng). Không thể thay đổi nhân vật hoặc cơ giáp!`}
              >
                <Lock className="size-3.5 text-amber-400" />
                <span>ĐÃ KHÓA CẶP ĐÔI (KHÔNG THỂ THAY ĐỔI)</span>
              </div>
            ) : isMandatory ? (
              <div
                className="flex items-center gap-1.5 rounded border border-amber-500/70 bg-amber-950/70 px-3 py-1.5 font-display text-xs font-bold text-amber-300 shadow-sm"
              >
                <AlertTriangle className="size-3.5 text-amber-400" />
                <span>BẮT BUỘC CHỌN (BƯỚC 1 - 3)</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  playClickSound()
                  setIsSelectionFlowCollapsed(!isSelectionFlowCollapsed)
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded border px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm",
                  isSelectionFlowCollapsed
                    ? "border-cyan-500/50 bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/60"
                    : "border-border/60 bg-black/40 text-muted-foreground hover:text-white",
                )}
              >
                {isSelectionFlowCollapsed ? (
                  <>
                    <span>Chọn & Khóa Cặp Đôi Mới</span>
                    <ChevronDown className="size-3.5" />
                  </>
                ) : (
                  <>
                    <span>Thu Nhỏ Tùy Chọn</span>
                    <ChevronUp className="size-3.5" />
                  </>
                )}
              </button>
            )}

            {onNavigateToPilotStatus && (
              <button
                onClick={onNavigateToPilotStatus}
                className="flex items-center gap-1.5 rounded border border-cyan-500/60 bg-cyan-950/40 px-2.5 py-1.5 text-xs text-cyan-300 hover:bg-cyan-900/50 hover:text-white transition-colors cursor-pointer"
                title="Mở Bảng Trạng Thái Phi Công (Pilot Status Dashboard)"
              >
                <Activity className="size-3.5 text-cyan-400" />
                <span>Pilot Status</span>
              </button>
            )}

            {onNavigateToHangar && (
              <button
                onClick={onNavigateToHangar}
                className="hidden sm:flex items-center gap-1.5 rounded border border-border/60 bg-black/40 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-white hover:border-cyan-500/40 transition-colors cursor-pointer"
                title="Mở Hangar & Kho Đồ"
              >
                <Boxes className="size-3.5 text-cyan-400" />
                <span>Mở Hangar</span>
              </button>
            )}
          </div>
        </div>

        {/* Thông báo khóa an toàn khi đã khóa (UI chọn nhân vật không được phép enable) */}
        {isLocked && (
          <div className="mt-3.5 border-t border-border/50 pt-3 flex flex-wrap items-center justify-between gap-3 rounded bg-black/50 p-3 border border-amber-500/30 font-mono text-xs text-amber-300">
            <div className="flex items-center gap-2.5">
              <Lock className="size-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-white uppercase">GIAO DIỆN CHỌN NHÂN VẬT ĐÃ ĐƯỢC KHÓA AN TOÀN</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Tổ hợp phi công <strong className="text-cyan-300">{activePilotDef.name}</strong> & cơ giáp <strong className="text-white">{activeGearDef.name}</strong> đang làm nhiệm vụ chiến đấu. Không thể thay đổi nhân vật/cơ giáp cho đến khi hoàn thành đủ 5 nhiệm vụ hoặc 5 trận thắng.
                </p>
              </div>
            </div>
            <div className="rounded bg-black/70 px-2.5 py-1 border border-amber-500/40 text-right">
              <span className="text-[10px] text-muted-foreground uppercase block">Mở khóa sau</span>
              <span className="font-bold text-amber-300">{Math.max(0, 5 - completedMissions)} Q hoặc {Math.max(0, 5 - wonBattles)} Trận Thắng</span>
            </div>
          </div>
        )}

        {/* ====================================================================
            QUY TRÌNH CHỌN 3 BƯỚC (CHỈ HIỂN THỊ KHI CHƯA KHÓA & (CHƯA THU NHỎ HOẶC BẮT BUỘC))
            ==================================================================== */}
        {(!isSelectionFlowCollapsed || isMandatory) && !isLocked && (
          <div className="mt-4 border-t border-border/50 pt-3.5 animate-in fade-in duration-200">
            {/* Banner hướng dẫn: Phân biệt rõ Bắt Buộc vs Tùy Chọn */}
            {isMandatory ? (
              <div className="mb-3 rounded border border-amber-500/70 bg-gradient-to-r from-amber-950/80 via-black/80 to-amber-950/70 p-3 text-xs font-mono text-amber-200 flex items-center gap-2.5 shadow-md">
                <AlertTriangle className="size-4 text-amber-400 shrink-0 animate-pulse" />
                <div>
                  <strong className="text-white uppercase">YÊU CẦU BẮT BUỘC KHỞI ĐẦU:</strong>
                  <p className="text-[11px] text-amber-200/90 mt-0.5">
                    Hệ thống chưa có tổ hợp Phi Công & Cơ Giáp hợp lệ. Vui lòng hoàn tất Bước 1 (Chọn Phi Công), Bước 2 (Chọn Cơ Giáp) và bấm <strong>"XÁC NHẬN GHÉP ĐÔI & KHÓA XUẤT KÍCH"</strong> ở Bước 3 để kích hoạt toàn bộ hệ thống trò chơi.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-3 rounded border border-cyan-500/60 bg-gradient-to-r from-cyan-950/80 via-black/80 to-cyan-950/70 p-3 text-xs font-mono text-cyan-200 flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="size-4 text-cyan-400 shrink-0 animate-pulse" />
                  <div>
                    <strong className="text-white uppercase">TÙY CHỌN THAY ĐỔI CẶP ĐÔI (OPTIONAL):</strong>
                    <p className="text-[11px] text-cyan-200/90 mt-0.5">
                      Tổ hợp hiện tại ({activePilotDef.name} + {activeGearDef.name}) đã hoàn tất chỉ tiêu ({completedMissions}/5 Q · {wonBattles}/5 B). Bạn có thể chọn tổ hợp mới để khóa 5 nhiệm vụ tiếp theo, HOẶC bấm nút bên phải để giữ nguyên tổ hợp này.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSkipOptionalSelection}
                  className="flex items-center gap-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-1.5 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)] border border-cyan-400/60"
                >
                  <span>Tiếp Tục (Giữ Nguyên)</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            )}
            {/* Thanh chuyển bước 3 bước */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { step: 1, title: "Bước 1: Chọn Phi Công", desc: flowPilotDef.name },
                { step: 2, title: "Bước 2: Chọn Cơ Giáp", desc: flowGearDef.name },
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

            {/* BƯỚC 1: CHỌN PHI CÔNG TRONG LUỒNG */}
            {currentStep === 1 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <div className="flex items-center gap-2">
                    <UserRound className="size-4 text-cyan-400" />
                    <span className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                      CHỌN PHI CÔNG XUẤT KÍCH (8 CHIẾN BINH THIÊN HÀ)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-300/80">
                    Bấm vào bất kỳ phi công nào để mở HỒ SƠ NỔI BẬT (Full-Body Art, Chỉ Số & Kỹ Năng) và xác nhận chọn
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {STARFRONT_PILOTS.map((pilot) => {
                    const isSelected = selectedPilotId === pilot.id
                    const isCurrentActive = activePairing.pilotId === pilot.id
                    const pData = pilotsData[pilot.id] || { level: 1, exp: 0, availablePoints: 0 }

                    return (
                      <div
                        key={pilot.id}
                        onClick={() => handleOpenPilotSpotlight(pilot.id)}
                        className={cn(
                          "group relative flex flex-col justify-between rounded-sm border p-3 transition-all cursor-pointer",
                          isSelected
                            ? "border-cyan-400 bg-cyan-950/70 shadow-[0_0_15px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400/50"
                            : "border-border/60 bg-panel/50 opacity-85 hover:opacity-100 hover:border-cyan-500/50 hover:bg-panel/90 hover:shadow-[0_0_12px_rgba(34,211,238,0.15)]",
                        )}
                      >
                        <div>
                          {/* Header: Ảnh chân dung + Tên + Callsign */}
                          <div className="flex items-start gap-2.5">
                            <div className="relative size-14 shrink-0 overflow-hidden rounded-sm border border-cyan-500/40 bg-black/60 shadow-sm group-hover:border-cyan-400 transition-colors">
                              <img
                                src={pilot.avatar}
                                alt={pilot.name}
                                className="size-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                              />
                              <span className="absolute bottom-0 right-0 bg-cyan-950/90 px-1 font-mono text-[8px] font-bold text-cyan-300">
                                Cấp {pData.level}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-display text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                                  {pilot.name}
                                </span>
                                <span className={cn(
                                  "rounded px-1 text-[8px] font-mono font-bold",
                                  pilot.gender === "Nữ" ? "bg-pink-950 text-pink-300 border border-pink-500/40" : "bg-blue-950 text-blue-300 border border-blue-500/40"
                                )}>
                                  {pilot.gender}
                                </span>
                              </div>
                              <span className="text-[10px] text-cyan-400 font-mono block truncate">
                                {pilot.callsign} · {pilot.age}T
                              </span>
                              <span className="text-[9.5px] text-muted-foreground block line-clamp-1 mt-0.5">
                                {pilot.title}
                              </span>
                            </div>
                          </div>

                          {/* Đặc Trưng / Traits Tags */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {pilot.traits.slice(0, 2).map((t, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-black/60 px-1.5 py-0.5 text-[8.5px] font-mono text-cyan-200 border border-cyan-500/30"
                              >
                                {t}
                              </span>
                            ))}
                          </div>

                          {/* Kỹ năng nội tại tóm tắt */}
                          <div className="mt-2 rounded bg-black/50 p-1.5 border border-border/40 text-[9.5px] font-mono">
                            <div className="flex items-center gap-1 text-amber-300 font-bold">
                              <Sparkles className="size-3 text-amber-400 shrink-0" />
                              <span className="truncate">{pilot.passive.name}</span>
                            </div>
                            <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">
                              {pilot.passive.shortDesc}
                            </p>
                          </div>
                        </div>

                        {/* Footer Thẻ */}
                        <div className="mt-2.5 flex items-center justify-between border-t border-border/40 pt-2 text-[10px] font-mono">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenPilotSpotlight(pilot.id)
                            }}
                            className="text-cyan-400 hover:text-cyan-200 underline flex items-center gap-0.5 cursor-pointer font-bold"
                          >
                            <Eye className="size-3" />
                            <span>Mở Hồ Sơ Nổi Bật</span>
                          </button>

                          <span className={cn(
                            "font-bold",
                            isSelected ? "text-cyan-300" : "text-muted-foreground group-hover:text-cyan-300"
                          )}>
                            {isSelected ? "✓ Đã Chọn" : "Chọn Phi Công"}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleNextStep}
                    className="flex items-center gap-1.5 rounded bg-cyan-600 hover:bg-cyan-500 px-4 py-2 font-display text-xs font-bold text-white uppercase tracking-wider cursor-pointer shadow-md"
                  >
                    <span>Tiếp Theo: Chọn Cơ Giáp</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 2: CHỌN CƠ GIÁP TRONG LUỒNG */}
            {currentStep === 2 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="size-4 text-cyan-400" />
                    <span className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                      CHỌN CƠ GIÁP PHÙ HỢP // PHI CÔNG ĐANG CHỌN: {flowPilotDef.name.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-300/80">
                    Bấm vào bất kỳ cơ giáp nào để mở HỒ SƠ NỔI BẬT (3D Concept Art, Thông Số & Hiệp Đồng) và xác nhận chọn
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {(["vanguard", "falcon", "aegis"] as StarfrontGearId[]).map((gId) => {
                    const def = STARFRONT_GEAR_DEFS[gId]
                    const isSelected = selectedGearId === gId
                    const isSynergy = flowPilotDef.recommendedGear === gId

                    return (
                      <div
                        key={gId}
                        onClick={() => handleOpenGearSpotlight(gId)}
                        className={cn(
                          "group relative flex flex-col justify-between rounded-sm border p-3.5 transition-all cursor-pointer",
                          isSelected
                            ? "border-cyan-400 bg-cyan-950/70 shadow-[0_0_15px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400/50"
                            : "border-border/60 bg-panel/50 opacity-85 hover:opacity-100 hover:border-cyan-500/50 hover:bg-panel/90 hover:shadow-[0_0_12px_rgba(34,211,238,0.15)]",
                        )}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="size-2.5 rounded-full"
                                  style={{ backgroundColor: def.color }}
                                />
                                <span className="font-display text-sm font-bold text-white group-hover:text-cyan-300">
                                  {def.name}
                                </span>
                              </div>
                              <span className="text-[10px] text-cyan-300 font-mono block mt-0.5">
                                {def.role}
                              </span>
                            </div>

                            <div
                              className="w-16 h-12 shrink-0 rounded overflow-hidden border bg-black/60 shadow-sm group-hover:scale-105 transition-transform"
                              style={{ borderColor: `${def.color}70` }}
                            >
                              <img
                                src={def.illustration || `/images/${gId}-gear.jpg`}
                                alt={def.name}
                                className="size-full object-cover object-center"
                              />
                            </div>
                          </div>

                          {isSynergy && (
                            <div className="mt-2 rounded bg-amber-500/20 border border-amber-500/50 p-1.5 text-[9.5px] font-mono text-amber-300 flex items-center gap-1 font-bold">
                              <Sparkles className="size-3 text-amber-400 shrink-0" />
                              <span>Gợi ý hiệp đồng với {flowPilotDef.name.split(" ")[0]}!</span>
                            </div>
                          )}

                          <p className="mt-2 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {def.desc}
                          </p>

                          <div className="mt-2 rounded bg-black/50 p-1.5 border border-border/40 text-[9.5px] font-mono">
                            <span className="text-amber-300 font-bold block">{def.passive.name}</span>
                            <span className="text-muted-foreground text-[9px] line-clamp-1">{def.passive.shortDesc}</span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[10px] font-mono">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenGearSpotlight(gId)
                            }}
                            className="text-cyan-400 hover:text-cyan-200 underline flex items-center gap-0.5 cursor-pointer font-bold"
                          >
                            <Eye className="size-3" />
                            <span>Mở Hồ Sơ Cơ Giáp</span>
                          </button>

                          <span className={cn(
                            "font-bold",
                            isSelected ? "text-cyan-300" : "text-muted-foreground group-hover:text-cyan-300"
                          )}>
                            {isSelected ? "✓ Đã Chọn" : "Chọn Cơ Giáp"}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handlePrevStep}
                    className="flex items-center gap-1.5 rounded border border-border/60 bg-black/40 px-3.5 py-1.5 font-display text-xs text-muted-foreground hover:text-white cursor-pointer"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>Quay Lại Bước 1</span>
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex items-center gap-1.5 rounded bg-cyan-600 hover:bg-cyan-500 px-4 py-2 font-display text-xs font-bold text-white uppercase tracking-wider cursor-pointer shadow-md"
                  >
                    <span>Tiếp Theo: Đánh Giá & Xác Nhận</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 3: ĐÁNH GIÁ & XÁC NHẬN GHÉP ĐÔI */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="rounded-sm border border-cyan-500/50 bg-black/60 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Phi công */}
                    <div
                      onClick={() => handleOpenPilotSpotlight(flowPilotDef.id)}
                      className="flex items-center gap-3 cursor-pointer group p-2 rounded border border-cyan-500/30 bg-black/40 hover:bg-cyan-950/60 hover:border-cyan-400 transition-colors"
                      title="Bấm để mở hồ sơ nổi bật hoặc đổi phi công"
                    >
                      <div className="size-16 overflow-hidden rounded-sm border border-cyan-400 bg-black/60 shrink-0">
                        <img
                          src={flowPilotDef.avatar}
                          alt={flowPilotDef.name}
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-display text-base font-bold text-white group-hover:text-cyan-300">{flowPilotDef.name}</span>
                          <span className="text-[10px] text-cyan-400 font-mono">(Xem / Đổi)</span>
                        </div>
                        <span className="block text-xs text-cyan-300 font-mono">{flowPilotDef.callsign} · Cấp {flowPilotProg.level}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{flowPilotDef.specialty}</span>
                      </div>
                    </div>

                    <div className="text-center font-mono">
                      <span className="text-xs text-muted-foreground block">DỰ KIẾN LỰC CHIẾN</span>
                      <strong className="text-xl font-display font-black text-amber-300">{flowCombatRating}</strong>
                    </div>

                    {/* Cơ giáp */}
                    <div
                      onClick={() => handleOpenGearSpotlight(selectedGearId)}
                      className="flex items-center gap-3 cursor-pointer group p-2 rounded border border-cyan-500/30 bg-black/40 hover:bg-cyan-950/60 hover:border-cyan-400 transition-colors"
                      title="Bấm để mở hồ sơ nổi bật hoặc đổi cơ giáp"
                    >
                      <div className="size-16 p-1 rounded-sm border border-cyan-400 bg-black/60 shrink-0">
                        <img
                          src={flowGearDef.illustration || `/images/${selectedGearId}.svg`}
                          alt={flowGearDef.name}
                          className="size-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-display text-base font-bold text-white group-hover:text-cyan-300">{flowGearDef.name}</span>
                          <span className="text-[10px] text-cyan-400 font-mono">(Xem / Đổi)</span>
                        </div>
                        <span className="block text-xs text-cyan-300 font-mono">{flowGearDef.role} · Cấp {progression.level}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{flowGearDef.passive.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cảnh báo khóa xuất kích */}
                  <div className="mt-4 rounded bg-amber-950/40 border border-amber-500/50 p-2.5 text-xs font-mono text-amber-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="size-4 text-amber-400 shrink-0" />
                      <span>
                        Xác nhận sẽ <strong>khóa cặp đôi này trong 5 nhiệm vụ hoặc 5 trận thắng tiếp theo</strong>.
                      </span>
                    </div>
                    {isLocked && (
                      <span className="text-[10px] text-amber-400/80">
                        (Cặp đôi hiện tại đang bị khóa: {completedMissions}/5 Q · {wonBattles}/5 B)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePrevStep}
                    className="flex items-center gap-1.5 rounded border border-border/60 bg-black/40 px-3.5 py-1.5 font-display text-xs text-muted-foreground hover:text-white cursor-pointer"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>Quay Lại Bước 2</span>
                  </button>

                  <button
                    onClick={handleConfirmPairing}
                    className="flex items-center gap-2 rounded bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 px-5 py-2.5 font-display text-xs font-black text-white uppercase tracking-wider cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.4)] border border-cyan-400/60"
                  >
                    <Check className="size-4" />
                    <span>XÁC NHẬN GHÉP ĐÔI & KHÓA XUẤT KÍCH</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Thông báo phản hồi */}
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
          2. KHU VỰC CHÍNH: HỒ SƠ NHÂN VẬT KHỔ LỚN & BUỒNG LÁI TRANG BỊ / KỸ NĂNG
          ==================================================================== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* ==================================================================
            CỘT TRÁI (5 CỘT): ẢNH PHI CÔNG KÍCH THƯỚC LỚN (TOÀN THÂN) & TRAITS / LORE
            ================================================================== */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-sm border border-cyan-500/40 bg-gradient-to-b from-black/95 via-panel to-black/95 p-4 shadow-2xl flex flex-col">
            {/* Header Thẻ: Tên, Giới Tính, Tuổi, Callsign */}
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-base font-black tracking-wider text-white">
                    {activePilotDef.name.toUpperCase()}
                  </h2>
                  <span className={cn(
                    "rounded px-1.5 py-0.5 text-[9px] font-mono font-bold border",
                    activePilotDef.gender === "Nữ"
                      ? "bg-pink-950/80 text-pink-300 border-pink-500/50"
                      : "bg-blue-950/80 text-blue-300 border-blue-500/50",
                  )}>
                    {activePilotDef.gender} · {activePilotDef.age}T
                  </span>
                </div>
                <span className="font-mono text-xs text-cyan-400 font-bold block mt-0.5">
                  CALLSIGN: {activePilotDef.callsign}
                </span>
              </div>

              <div className="text-right font-mono">
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-xs font-bold text-cyan-300 border border-cyan-400/50 block">
                  CẤP {activePilotProg.level}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  {activePilotProg.availablePoints} Điểm Khả Dụng
                </span>
              </div>
            </div>

            {/* KHUNG RENDER HÌNH ẢNH PHI CÔNG KÍCH THƯỚC LỚN (TOÀN THÂN / KHỔ LỚN) */}
            <div className="relative my-3 flex items-center justify-center overflow-hidden rounded-sm border border-cyan-500/30 bg-black/70 min-h-[460px] sm:min-h-[520px] shadow-inner group">
              {/* Vòng hào quang Neon tương ứng màu cơ giáp */}
              <div
                className="pointer-events-none absolute inset-0 opacity-25 blur-xl transition-all duration-500 group-hover:opacity-40"
                style={{
                  background: `radial-gradient(circle at center, ${activeGearDef.color}80 0%, transparent 70%)`,
                }}
              />

              {/* Ảnh Phi Công Kích Thước Lớn (Toàn Thân) */}
              <img
                src={activePilotDef.fullBodyAvatar || activePilotDef.avatar}
                alt={activePilotDef.name}
                className="size-full max-h-[540px] object-cover sm:object-contain object-top drop-shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-transform duration-300 group-hover:scale-102"
              />

              {/* Tag Đang Ghép Đôi Xuất Kích */}
              <div className="absolute left-3 top-3 rounded bg-black/80 px-2.5 py-1 border border-cyan-500/50 font-mono text-[10px] text-cyan-300 backdrop-blur-sm">
                <span>GHÉP ĐÔI: </span>
                <strong className="text-white">{activeGearDef.name}</strong>
              </div>

              {/* Tag Lực Chiến */}
              <div className="absolute right-3 top-3 rounded bg-black/80 px-2.5 py-1 border border-amber-500/50 font-mono text-[10px] text-amber-300 backdrop-blur-sm">
                <span>LỰC CHIẾN: </span>
                <strong className="text-amber-400 font-bold">{activeCombatRating}</strong>
              </div>
            </div>

            {/* Thanh Tiến Trình EXP Phi Công */}
            <div className="space-y-1 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Kinh Nghiệm (EXP):</span>
                <span className="text-cyan-300 font-bold">
                  {activePilotProg.exp.toLocaleString("vi-VN")} / {pilotExpReq.toLocaleString("vi-VN")} ({pilotExpPct}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-xs bg-black/60 border border-border/40">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                  style={{ width: `${pilotExpPct}%` }}
                />
              </div>
            </div>

            {/* Trích Dẫn Thoại (Voice Quote) */}
            {activePilotDef.quote && (
              <div className="mt-3 rounded bg-black/60 p-2.5 border border-cyan-500/30 text-xs font-mono text-cyan-200/90 italic flex items-start gap-2">
                <Quote className="size-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>"{activePilotDef.quote}"</span>
              </div>
            )}

            {/* ĐẶC TRƯNG / TRAIL NHÂN VẬT (TRAITS TAGS) */}
            <div className="mt-3">
              <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1.5">
                ĐẶC TRƯNG CHIẾN BINH (PILOT TRAITS & TRAIL):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activePilotDef.traits.map((trait, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded bg-cyan-950/70 border border-cyan-500/40 px-2 py-0.5 text-[10.5px] font-mono font-medium text-cyan-200"
                  >
                    <Sparkles className="size-2.5 text-cyan-400" />
                    <span>{trait}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Tiểu Sử (Bio) */}
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {activePilotDef.bio}
            </p>
          </div>

          {/* ==================================================================
              KHU VỰC PHÂN BỔ ĐIỂM THUỘC TÍNH & KỸ NĂNG NỘI TẠI PHI CÔNG
              ================================================================== */}
          <div className="rounded-sm border border-cyan-500/40 bg-panel/90 p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-cyan-400" />
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                  ĐIỂM THUỘC TÍNH PHI CÔNG (+5 ĐIỂM/CẤP)
                </h3>
              </div>

              <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-xs font-mono font-bold text-cyan-300 border border-cyan-400/50">
                {activePilotProg.availablePoints} Điểm Sẵn Sàng
              </span>
            </div>

            {/* 5 Nhánh Thuộc Tính */}
            <div className="space-y-2 font-mono text-xs">
              {[
                { key: "attack" as PilotAttributeKey, label: "TẤN CÔNG (ATK)", effect: "+2.0 ATK / Điểm", color: "text-red-400" },
                { key: "defense" as PilotAttributeKey, label: "PHÒNG NGỰ (DEF)", effect: "+1.5 DEF / Điểm", color: "text-blue-400" },
                { key: "agility" as PilotAttributeKey, label: "CƠ ĐỘNG (SPD)", effect: "+1.0 SPD & +0.2% Né", color: "text-emerald-400" },
                { key: "shield" as PilotAttributeKey, label: "KHIÊN NĂNG LƯỢNG", effect: "+30 Khiên Tối Đa / Điểm", color: "text-cyan-400" },
                { key: "tactical" as PilotAttributeKey, label: "CHIẾN THUẬT (CRIT)", effect: "+0.4% Bạo Kích / Điểm", color: "text-amber-400" },
              ].map(({ key, label, effect, color }) => {
                const currentAllocated = activePilotProg.allocatedStats[key] || 0
                const canAdd = activePilotProg.availablePoints > 0

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded bg-black/40 p-2 border border-border/40"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("font-bold text-xs", color)}>{label}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">({effect})</span>
                      </div>
                      <span className="text-[11px] text-white font-bold">
                        +{currentAllocated} điểm đã cộng
                      </span>
                    </div>

                    <button
                      disabled={!canAdd}
                      onClick={() => handleAllocatePoint(activePilotId, key)}
                      className={cn(
                        "size-7 rounded flex items-center justify-center font-bold text-xs transition-all cursor-pointer",
                        canAdd
                          ? "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                          : "bg-black/60 text-muted-foreground border border-border/40 cursor-not-allowed opacity-50",
                      )}
                      title="Cộng +1 điểm"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Nút Tẩy Điểm (Reset Points) */}
            <div className="mt-3.5 flex items-center justify-between border-t border-border/40 pt-2.5 text-xs font-mono">
              <span className="text-muted-foreground text-[11px]">
                Chi phí tẩy điểm: <strong className="text-amber-300">200 Credits</strong>
              </span>

              <button
                onClick={() => handleResetPoints(activePilotId)}
                className="flex items-center gap-1.5 rounded border border-border/60 bg-black/40 px-2.5 py-1 text-[11px] font-mono text-muted-foreground hover:text-amber-300 hover:border-amber-500/50 transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3" />
                <span>Tẩy Điểm Phi Công</span>
              </button>
            </div>

            {/* THẺ KỸ NĂNG NỘI TẠI PHI CÔNG (PILOT PASSIVE) */}
            <div className="mt-4 rounded border border-amber-500/50 bg-amber-950/20 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-display text-xs font-bold text-amber-300">
                  <Sparkles className="size-3.5 text-amber-400" />
                  <span>NỘI TẠI PHI CÔNG: {activePilotDef.passive.name.toUpperCase()}</span>
                </div>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-mono text-amber-300 border border-amber-500/40">
                  {activePilotDef.passive.nameEn}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-200 leading-relaxed">
                {activePilotDef.passive.desc}
              </p>
              <div className="mt-2 rounded bg-black/50 p-1.5 border border-amber-500/30 text-[10.5px] font-mono text-amber-200/90">
                <span className="text-amber-400 font-bold">Hiệp đồng {activePilotDef.recommendedGear.toUpperCase()}: </span>
                {activePilotDef.synergyBonus}
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================
            CỘT PHẢI (7 CỘT): BUỒNG LÁI & TRANG BỊ + 5 MÔ-ĐUN KỸ NĂNG (TỪ HANGAR)
            ================================================================== */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Thanh Tab Chuyển Đổi: Buồng Lái & Trang Bị vs 5 Mô-Đun Kỹ Năng */}
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-1 p-1 bg-black/40 rounded-sm border border-border/50">
              <button
                onClick={() => {
                  playClickSound()
                  setCockpitTab("equipment")
                }}
                className={cn(
                  "px-3.5 py-1.5 font-display text-xs uppercase tracking-wider rounded-xs transition-all cursor-pointer flex items-center gap-1.5",
                  cockpitTab === "equipment"
                    ? "bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                    : "text-muted-foreground hover:text-white",
                )}
              >
                <Cpu className="size-3.5" />
                <span>Buồng Lái & Trang Bị (3 Ô)</span>
              </button>

              <button
                onClick={() => {
                  playClickSound()
                  setCockpitTab("skills")
                }}
                className={cn(
                  "px-3.5 py-1.5 font-display text-xs uppercase tracking-wider rounded-xs transition-all cursor-pointer flex items-center gap-1.5",
                  cockpitTab === "skills"
                    ? "bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                    : "text-muted-foreground hover:text-white",
                )}
              >
                <Flame className="size-3.5" />
                <span>5 Mô-Đun Kỹ Năng Cơ Giáp</span>
              </button>

              <button
                onClick={() => {
                  playClickSound()
                  setCockpitTab("pilot_synergy")
                }}
                className={cn(
                  "px-3.5 py-1.5 font-display text-xs uppercase tracking-wider rounded-xs transition-all cursor-pointer flex items-center gap-1.5",
                  cockpitTab === "pilot_synergy"
                    ? "bg-purple-600 text-white font-bold shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                    : "text-muted-foreground hover:text-white",
                )}
              >
                <Sparkles className="size-3.5 text-purple-400" />
                <span>Tuyệt Kỹ Liên Hoàn Phi Công (⚡ Mới)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playClickSound()
                  setIsAdminCpOpen(true)
                }}
                className="flex items-center gap-1.5 rounded bg-purple-500/20 border border-purple-400/60 px-3 py-1.5 text-xs font-mono font-bold text-purple-300 hover:bg-purple-500/30 transition-colors cursor-pointer"
                title="Mở Bảng Điều Khiển Admin CP Quản Trị"
              >
                <Sliders className="size-3 text-purple-400" />
                <span>Admin CP</span>
              </button>

              {onNavigateToCombat && (
                <button
                  onClick={onNavigateToCombat}
                  className="flex items-center gap-1.5 rounded bg-amber-500/20 border border-amber-400/60 px-3 py-1.5 text-xs font-mono font-bold text-amber-300 hover:bg-amber-500/30 transition-colors cursor-pointer"
                >
                  <span>Vào Đấu Trường Ngay</span>
                  <ArrowRight className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* ================================================================
              SUB-TAB 1: BUỒNG LÁI & 3 VỊ TRÍ TRANG BỊ (WEAPON, SHIELD, ENGINE)
              ================================================================ */}
          {cockpitTab === "equipment" && (
            <div className="space-y-4">
              {/* Tấm Blueprint Cơ Giáp Trung Tâm */}
              <div className="relative overflow-hidden rounded-sm border border-cyan-500/40 bg-gradient-to-b from-black/90 via-cyan-950/20 to-black/95 p-4 shadow-xl flex flex-col items-center justify-center min-h-[260px]">
                {/* HUD Overlay Góc */}
                <div className="absolute left-3 top-3 font-mono text-[10px] text-cyan-400">
                  <span>HULL // {activeGearDef.id.toUpperCase()}_MK{progression.level}</span>
                  <div className="text-[9px] text-muted-foreground">STATUS: ONLINE · COMBAT_READY</div>
                </div>

                <div className="absolute right-3 top-3 font-mono text-right text-[10px] text-amber-300">
                  <div className="flex items-center gap-1 justify-end font-bold">
                    <Zap className="size-3 text-amber-400" />
                    <span>LỰC CHIẾN: {activeCombatRating}</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground">PT POWER TOKENS</div>
                </div>

                {/* Ảnh 3D Concept Art Cơ Giáp Trung Tâm */}
                <div className="relative my-2 w-full max-w-md h-44 sm:h-52 rounded-sm overflow-hidden border border-cyan-500/40 bg-black/70 shadow-lg flex items-center justify-center group">
                  <img
                    src={activeGearDef.illustration || `/images/${activeGearId}-gear.jpg`}
                    alt={activeGearDef.name}
                    className="size-full object-cover object-center filter drop-shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                </div>

                <div className="text-center">
                  <h3 className="font-display text-sm font-bold tracking-wider text-white">
                    {activeGearDef.name.toUpperCase()} · {activeGearDef.role}
                  </h3>
                  <p className="text-[11px] text-cyan-300 font-mono mt-0.5">
                    Phi công điều khiển: <strong className="text-white">{activePilotDef.name}</strong> (Cấp {activePilotProg.level})
                  </p>
                </div>
              </div>

              {/* 3 Ô TRANG BỊ CHI TIẾT (WEAPON, SHIELD, ENGINE) */}
              <div>
                <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3">
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                    3 VỊ TRÍ TRANG BỊ BUỒNG LÁI
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Kho đồ: {progression.inventory.length} món khả dụng
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {(["weapon", "shield", "engine"] as StarfrontItemSlot[]).map((slotKey) => {
                    const meta = SLOT_META[slotKey]
                    const SlotIcon = meta.icon
                    const equippedItemId = progression.equipped[slotKey]
                    const equippedItem = progression.inventory.find((it) => it.id === equippedItemId)
                    const enhBadge = equippedItem ? getEnhancementBadgeMeta(equippedItem.enhancementLevel) : null
                    const enhancedStats = equippedItem ? getEnhancedItemStats(equippedItem) : null

                    return (
                      <div
                        key={slotKey}
                        className={cn(
                          "group relative flex flex-col justify-between rounded-sm border p-3 shadow-md transition-all",
                          equippedItem
                            ? `${RARITY_CONFIG[equippedItem.rarity].border} ${RARITY_CONFIG[equippedItem.rarity].bg} ${RARITY_CONFIG[equippedItem.rarity].glow}`
                            : "border-border/60 bg-panel/40 border-dashed",
                        )}
                      >
                        <div>
                          {/* Header Slot */}
                          <div className="flex items-center justify-between border-b border-border/40 pb-2">
                            <div className="flex items-center gap-1.5">
                              <SlotIcon className="size-4 text-cyan-400" />
                              <span className="font-display text-xs font-bold text-white">
                                {meta.shortLabel}
                              </span>
                            </div>

                            {enhBadge && (
                              <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-mono border", enhBadge.className)}>
                                {enhBadge.text}
                              </span>
                            )}
                          </div>

                          {/* Nội Dung Vật Phẩm Trong Slot */}
                          {equippedItem && enhancedStats ? (
                            <div className="mt-2 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className={cn("font-display text-xs font-bold truncate", RARITY_CONFIG[equippedItem.rarity].text)}>
                                  {getItemDisplayName(equippedItem)}
                                </span>
                              </div>

                              <span className="text-[9.5px] font-mono text-muted-foreground block">
                                Phẩm chất: {RARITY_CONFIG[equippedItem.rarity].label}
                              </span>

                              {/* Các chỉ số được gia tăng */}
                              <div className="mt-1.5 space-y-0.5 font-mono text-[10px]">
                                {enhancedStats.attackBonus > 0 && (
                                  <div className="text-amber-400">+{enhancedStats.attackBonus} Tấn Công (ATK)</div>
                                )}
                                {enhancedStats.defenseBonus > 0 && (
                                  <div className="text-blue-400">+{enhancedStats.defenseBonus} Phòng Ngự (DEF)</div>
                                )}
                                {enhancedStats.speedBonus > 0 && (
                                  <div className="text-emerald-400">+{enhancedStats.speedBonus} Tốc Độ (SPD)</div>
                                )}
                                {enhancedStats.hpBonus > 0 && (
                                  <div className="text-slate-300">+{enhancedStats.hpBonus} Giáp Vỏ (HP)</div>
                                )}
                                {enhancedStats.spBonus > 0 && (
                                  <div className="text-purple-400">+{enhancedStats.spBonus} Năng Lượng (SP)</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => setEquipModalSlot(slotKey)}
                              className="my-5 flex flex-col items-center justify-center text-center text-muted-foreground cursor-pointer hover:text-cyan-300"
                            >
                              <SlotIcon className="size-7 opacity-40 mb-1" />
                              <span className="text-xs font-display font-bold">CHƯA TRANG BỊ</span>
                              <span className="text-[10px] mt-0.5">Bấm để lắp từ kho đồ</span>
                            </div>
                          )}
                        </div>

                        {/* Hành Động Slot */}
                        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                          {equippedItem ? (
                            <>
                              <button
                                onClick={() => handleUnequipItem(slotKey)}
                                className="text-red-400 hover:text-red-300 text-[10px] font-mono flex items-center gap-0.5 cursor-pointer"
                              >
                                <X className="size-3" /> Tháo Đồ
                              </button>

                              <button
                                onClick={() => setEquipModalSlot(slotKey)}
                                className="text-cyan-400 hover:text-cyan-200 text-[10px] font-mono flex items-center gap-0.5 cursor-pointer"
                              >
                                <RefreshCw className="size-3" /> Đổi Món
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setEquipModalSlot(slotKey)}
                              className="w-full text-center rounded bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 py-1 text-[10px] font-mono text-cyan-300 cursor-pointer"
                            >
                              + Lắp {meta.shortLabel}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* BẢNG TỔNG HỢP CHỈ SỐ THỰC TẾ CHIẾN ĐẤU */}
              <div className="rounded-sm border border-cyan-500/40 bg-panel/90 p-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Gauge className="size-4 text-cyan-400" />
                    <span className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                      TỔNG HỢP CHỈ SỐ THỰC TẾ (CƠ GIÁP + TRANG BỊ + PHI CÔNG)
                    </span>
                  </div>
                  <span className="font-mono text-xs text-amber-300 font-bold">
                    LỰC CHIẾN: {activeCombatRating}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                  <div className="rounded bg-black/40 p-2 border border-border/40">
                    <span className="text-[10px] text-muted-foreground block">TẤN CÔNG (ATK)</span>
                    <strong className="text-sm font-bold text-red-400">{activeStatsBreakdown.total.attack}</strong>
                    <span className="text-[9px] text-muted-foreground block mt-0.5">
                      Gốc: {activeStatsBreakdown.base.attack} · Bonus: +{activeStatsBreakdown.bonuses.attack}
                    </span>
                  </div>

                  <div className="rounded bg-black/40 p-2 border border-border/40">
                    <span className="text-[10px] text-muted-foreground block">PHÒNG NGỰ (DEF)</span>
                    <strong className="text-sm font-bold text-blue-400">{activeStatsBreakdown.total.defense}</strong>
                    <span className="text-[9px] text-muted-foreground block mt-0.5">
                      Gốc: {activeStatsBreakdown.base.defense} · Bonus: +{activeStatsBreakdown.bonuses.defense}
                    </span>
                  </div>

                  <div className="rounded bg-black/40 p-2 border border-border/40">
                    <span className="text-[10px] text-muted-foreground block">TỐC ĐỘ (SPD)</span>
                    <strong className="text-sm font-bold text-emerald-400">{activeStatsBreakdown.total.speed}</strong>
                    <span className="text-[9px] text-muted-foreground block mt-0.5">
                      Gốc: {activeStatsBreakdown.base.speed} · Bonus: +{activeStatsBreakdown.bonuses.speed}
                    </span>
                  </div>

                  <div className="rounded bg-black/40 p-2 border border-border/40">
                    <span className="text-[10px] text-muted-foreground block">GIÁP VỎ (HP)</span>
                    <strong className="text-sm font-bold text-slate-200">{activeStatsBreakdown.total.hp}</strong>
                    <span className="text-[9px] text-muted-foreground block mt-0.5">
                      Gốc: {activeStatsBreakdown.base.hp} · Bonus: +{activeStatsBreakdown.bonuses.hp}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              SUB-TAB 2: 5 MÔ-ĐUN KỸ NĂNG CHIẾN ĐẤU (SKILL SLOTS)
              ================================================================ */}
          {cockpitTab === "skills" && (
            <div className="space-y-4">
              <div className="rounded-sm border border-cyan-500/40 bg-panel/80 p-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="size-4 text-cyan-400" />
                    <div>
                      <h3 className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                        5 Ô MÔ-ĐUN KỸ NĂNG CHIẾN ĐẤU // {activeGearDef.name.toUpperCase()}
                      </h3>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Bao gồm Đòn đánh thường, 3 Kỹ năng chủ động và Tuyệt kỹ tối thượng
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded bg-black/50 px-3 py-1.5 border border-cyan-500/40 font-mono text-xs">
                    <Sparkles className="size-3.5 text-cyan-400" />
                    <span className="text-muted-foreground">Điểm Phi Cơ:</span>
                    <strong className="text-cyan-300 font-bold">{skillPoints.available} SP</strong>
                  </div>
                </div>

                {/* Danh Sách 5 Slot Kỹ Năng */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {activeSkillSlots.map((slotInfo) => {
                    const isUltimate = slotInfo.category === "ultimate"
                    const isBasic = slotInfo.category === "basic"

                    return (
                      <div
                        key={slotInfo.slotIndex}
                        onClick={() => setInspectSkillSlot(slotInfo)}
                        className={cn(
                          "flex flex-col justify-between rounded-sm border p-3 transition-all cursor-pointer shadow-md",
                          isUltimate
                            ? "border-amber-500/60 bg-amber-950/30 hover:border-amber-400"
                            : isBasic
                              ? "border-blue-500/50 bg-blue-950/20 hover:border-blue-400"
                              : "border-cyan-500/50 bg-cyan-950/20 hover:border-cyan-400",
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                            <span className="font-mono text-[9px] font-bold text-muted-foreground uppercase">
                              SLOT {slotInfo.slotIndex}
                            </span>
                            <span className={cn(
                              "rounded px-1 text-[8.5px] font-mono font-bold",
                              isUltimate ? "bg-amber-500/20 text-amber-300" : "bg-cyan-500/20 text-cyan-300",
                            )}>
                              {slotInfo.slotRole}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <div className="size-8 rounded border border-border/60 bg-black/60 flex items-center justify-center text-cyan-300">
                              <Zap className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-display text-xs font-bold text-white block truncate">
                                {slotInfo.skill.name}
                              </span>
                              <span className="font-mono text-[9px] text-muted-foreground block truncate">
                                {slotInfo.skill.nameEn}
                              </span>
                            </div>
                          </div>

                          <p className="mt-2 text-[10.5px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {slotInfo.skill.desc}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-1.5 font-mono text-[9.5px]">
                          <span className="text-cyan-300 font-bold">
                            {slotInfo.skill.spCost > 0 ? `${slotInfo.skill.spCost} SP` : "Hồi SP"}
                          </span>
                          <span className="text-muted-foreground">
                            {slotInfo.skill.cooldown > 0 ? `CD: ${slotInfo.skill.cooldown}L` : "CD: 0"}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Nút Chuyển Đến Xưởng Cường Hóa & Tái Chế Hangar */}
              {onNavigateToHangar && (
                <div className="rounded-sm border border-border/60 bg-panel/60 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hammer className="size-4 text-purple-400" />
                    <div>
                      <span className="font-display text-xs font-bold text-white block">
                        XƯỞNG CƯỜNG HÓA & TÁI CHẾ TRANG BỊ (HANGAR)
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Nâng cấp trang bị lên +10, tẩy dòng và rã đồ lấy Hợp kim (Alloy)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={onNavigateToHangar}
                    className="flex items-center gap-1.5 rounded bg-purple-600 hover:bg-purple-500 px-3.5 py-1.5 font-display text-xs font-bold text-white cursor-pointer shadow-md"
                  >
                    <span>Mở Xưởng Cường Hóa</span>
                    <ArrowRight className="size-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              SUB-TAB 3: TUYỆT KỸ LIÊN HOÀN PHI CÔNG & HIỆP ĐỒNG (PHASE 5.9)
              ================================================================ */}
          {cockpitTab === "pilot_synergy" && (
            <div className="space-y-4">
              <PilotSkillView
                skill={activePilotSynergySkill}
                currentGearId={activeGearId}
                rerollTokens={progression.rerollTokens || 0}
                credits={progression.credits}
                onUpdateSkill={handleUpdatePilotSkill}
                onOpenAdminCP={() => setIsAdminCpOpen(true)}
              />
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          MODAL: TRANG BỊ VẬT PHẨM VÀO SLOT BUỒNG LÁI
          ==================================================================== */}
      {equipModalSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-sm border border-cyan-500/60 bg-panel p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <div className="flex items-center gap-2">
                <Boxes className="size-4 text-cyan-400" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-cyan-300">
                  LẮP {SLOT_META[equipModalSlot].label.toUpperCase()} VÀO BUỒNG LÁI
                </h3>
              </div>
              <button
                onClick={() => setEquipModalSlot(null)}
                className="size-6 flex items-center justify-center rounded hover:bg-white/10 text-muted-foreground hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Danh sách vật phẩm tương thích trong kho */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {progression.inventory.filter((it) => it.slot === equipModalSlot).length === 0 ? (
                <div className="p-6 text-center font-mono text-xs text-muted-foreground">
                  Chưa có trang bị nào cho vị trí này trong kho đồ. Hãy hoàn thành nhiệm vụ hoặc mua tại Chợ quân sự!
                </div>
              ) : (
                progression.inventory
                  .filter((it) => it.slot === equipModalSlot)
                  .map((item) => {
                    const isEquipped = progression.equipped[equipModalSlot] === item.id
                    const enh = getEnhancedItemStats(item)
                    const enhBadge = getEnhancementBadgeMeta(item.enhancementLevel)

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center justify-between rounded border p-2.5 font-mono text-xs transition-all",
                          RARITY_CONFIG[item.rarity].border,
                          RARITY_CONFIG[item.rarity].bg,
                        )}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={cn("font-bold font-display text-xs", RARITY_CONFIG[item.rarity].text)}>
                              {getItemDisplayName(item)}
                            </span>
                            {enhBadge && (
                              <span className={cn("px-1 rounded text-[9px] border", enhBadge.className)}>
                                {enhBadge.text}
                              </span>
                            )}
                            {isEquipped && (
                              <span className="rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 px-1 text-[9px]">
                                Đang Lắp
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-300">
                            {enh.attackBonus > 0 && <span>+{enh.attackBonus} ATK</span>}
                            {enh.defenseBonus > 0 && <span>+{enh.defenseBonus} DEF</span>}
                            {enh.speedBonus > 0 && <span>+{enh.speedBonus} SPD</span>}
                            {enh.hpBonus > 0 && <span>+{enh.hpBonus} HP</span>}
                            {enh.spBonus > 0 && <span>+{enh.spBonus} SP</span>}
                          </div>
                        </div>

                        <div>
                          {isEquipped ? (
                            <button
                              onClick={() => handleUnequipItem(equipModalSlot)}
                              className="rounded border border-red-500/60 bg-red-950/40 hover:bg-red-900/60 px-2.5 py-1 text-[11px] text-red-300 font-mono cursor-pointer"
                            >
                              Tháo Đồ
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEquipItemFromModal(item.id, equipModalSlot)}
                              className="rounded bg-cyan-600 hover:bg-cyan-500 px-3 py-1 text-[11px] font-bold text-white font-mono cursor-pointer shadow-md"
                            >
                              Trang Bị Ngay
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border/40">
              <button
                onClick={() => setEquipModalSlot(null)}
                className="rounded border border-border/60 bg-black/40 px-4 py-1.5 font-mono text-xs text-muted-foreground hover:text-white cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 1: HỒ SƠ CHI TIẾT & NỔI BẬT PHI CÔNG (PILOT SPOTLIGHT DIALOG)
          ==================================================================== */}
      {pilotDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPilotDialogOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-sm border border-cyan-500/70 bg-panel/95 shadow-[0_0_50px_rgba(34,211,238,0.25)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const pDef = STARFRONT_PILOT_MAP[inspectPilotId] || STARFRONT_PILOTS[0]
              const pProg = pilotsData[inspectPilotId] || {
                id: inspectPilotId,
                level: 1,
                exp: 0,
                allocatedStats: { attack: 0, defense: 0, agility: 0, shield: 0, tactical: 0 },
                availablePoints: 0,
              }
              const pExpReq = getPilotExpRequiredForLevel(pProg.level)
              const pExpPct = Math.min(100, Math.round((pProg.exp / pExpReq) * 100))
              const pilotIdx = STARFRONT_PILOTS.findIndex((p) => p.id === inspectPilotId)
              const prevPilot = STARFRONT_PILOTS[(pilotIdx - 1 + STARFRONT_PILOTS.length) % STARFRONT_PILOTS.length]
              const nextPilot = STARFRONT_PILOTS[(pilotIdx + 1) % STARFRONT_PILOTS.length]
              const recommendedGearDef = STARFRONT_GEAR_DEFS[pDef.recommendedGear]
              const isCurrentlyActive = activePairing.pilotId === pDef.id

              return (
                <>
                  {/* Top Header */}
                  <div className="flex items-center justify-between border-b border-cyan-500/40 bg-black/60 px-4 py-3 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-sm bg-cyan-950 border border-cyan-500/60 flex items-center justify-center text-cyan-300">
                        <UserCheck className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-white">
                            HỒ SƠ CHI TIẾT & NỔI BẬT PHI CÔNG // {pDef.name.toUpperCase()}
                          </h3>
                          <span className={cn(
                            "rounded px-1.5 py-0.5 text-[9px] font-mono font-bold border",
                            pDef.gender === "Nữ" ? "bg-pink-950/80 text-pink-300 border-pink-500/50" : "bg-blue-950/80 text-blue-300 border-blue-500/50"
                          )}>
                            {pDef.gender} · {pDef.age}T
                          </span>
                          {isCurrentlyActive && (
                            <span className="rounded bg-emerald-950/80 px-1.5 py-0.5 text-[9px] font-mono font-bold text-emerald-300 border border-emerald-500/40">
                              ĐANG XUẤT KÍCH
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-xs text-cyan-400">
                          CALLSIGN: {pDef.callsign} · {pDef.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline font-mono text-[11px] text-muted-foreground">
                        Phi công {pilotIdx + 1}/{STARFRONT_PILOTS.length}
                      </span>
                      <button
                        onClick={() => setPilotDialogOpen(false)}
                        className="size-7 flex items-center justify-center rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors cursor-pointer"
                        title="Đóng (Esc)"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body Content (Scrollable) */}
                  <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      {/* Cột Trái: Trưng Bày Art Toàn Thân / Chân Dung Nổi Bật (5 cột) */}
                      <div className="lg:col-span-5 flex flex-col items-center">
                        <div className="relative w-full aspect-[9/14] sm:aspect-[9/13] max-h-[420px] rounded-sm border-2 border-cyan-400/70 bg-gradient-to-b from-cyan-950/40 via-black to-cyan-950/60 p-1 shadow-[0_0_25px_rgba(34,211,238,0.25)] overflow-hidden group">
                          {/* Scanline & HUD Reticles */}
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-cyan-500/10 pointer-events-none" />
                          <div className="absolute top-2 left-2 font-mono text-[9px] text-cyan-400/80 bg-black/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                            STARFRONT PILOT // {pDef.id.toUpperCase()}
                          </div>
                          <div className="absolute top-2 right-2 font-mono text-[9px] text-amber-400 bg-black/60 px-1.5 py-0.5 rounded border border-amber-500/40 font-bold">
                            CẤP {pProg.level}
                          </div>

                          <img
                            src={pDef.fullBodyAvatar || pDef.avatar}
                            alt={pDef.name}
                            className="size-full object-cover object-top filter drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-transform duration-500 group-hover:scale-102"
                          />

                          {/* Gradient bóng chân */}
                          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

                          {/* Tên & Lời thoại dưới ảnh */}
                          <div className="absolute bottom-2 inset-x-2 text-center">
                            <span className="font-display text-sm font-black uppercase text-white tracking-wider block drop-shadow-md">
                              {pDef.name}
                            </span>
                            <span className="text-[10px] font-mono text-cyan-300 block">
                              "{pDef.specialty}"
                            </span>
                          </div>
                        </div>

                        {/* Quote danh ngôn */}
                        {pDef.quote && (
                          <div className="mt-3 rounded bg-black/60 border border-cyan-500/30 p-2.5 text-center w-full">
                            <p className="text-[11px] italic text-cyan-200 font-mono leading-relaxed">
                              "{pDef.quote}"
                            </p>
                          </div>
                        )}

                        {/* Đặc Trưng / Traits Tags */}
                        <div className="mt-2.5 flex flex-wrap gap-1.5 justify-center w-full">
                          {pDef.traits.map((t, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-black/70 px-2 py-0.5 text-[10px] font-mono text-cyan-200 border border-cyan-500/40"
                            >
                              ◆ {t}
                            </span>
                          ))}
                        </div>

                        {/* Gợi Ý Hiệp Đồng Cơ Giáp Tốt Nhất */}
                        {recommendedGearDef && (
                          <div
                            onClick={() => {
                              setInspectGearId(pDef.recommendedGear)
                              setGearDialogOpen(true)
                            }}
                            className="mt-3 w-full rounded border border-amber-500/50 bg-gradient-to-r from-amber-950/40 to-black/60 p-2.5 font-mono text-xs cursor-pointer hover:border-amber-400 transition-colors shadow-sm"
                            title="Bấm để xem chi tiết cơ giáp này"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-amber-400 font-bold uppercase flex items-center gap-1">
                                <Sparkles className="size-3 text-amber-400" /> CƠ GIÁP HIỆP ĐỒNG TỐI ƯU
                              </span>
                              <span className="text-[9px] text-cyan-400 underline">Xem Cơ Giáp ➔</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="size-2 rounded-full" style={{ backgroundColor: recommendedGearDef.color }} />
                              <strong className="text-white font-display">{recommendedGearDef.name}</strong>
                              <span className="text-muted-foreground text-[10px]">({recommendedGearDef.role.split(" ")[0]})</span>
                            </div>
                            <p className="text-[10px] text-amber-200/90 mt-1">
                              {pDef.synergyBonus}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Cột Phải: Thuộc Tính, Phân Bổ Điểm & Kỹ Năng Tác Chiến (7 cột) */}
                      <div className="lg:col-span-7 space-y-3.5">
                        {/* Tiến trình cấp độ & EXP */}
                        <div className="rounded bg-black/60 border border-border/60 p-3 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-muted-foreground">TIẾN TRÌNH KINH NGHIỆM CHIẾN ĐẤU</span>
                            <span className="text-cyan-300 font-bold">
                              {pProg.exp} / {pExpReq} EXP ({pExpPct}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded bg-secondary">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                              style={{ width: `${pExpPct}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                            {pDef.description}
                          </p>
                        </div>

                        {/* Điểm Tiềm Năng & Bảng 5 Thuộc Tính Cốt Lõi */}
                        <div className="rounded border border-cyan-500/40 bg-black/50 p-3 space-y-2.5">
                          <div className="flex items-center justify-between border-b border-border/40 pb-2">
                            <div className="flex items-center gap-1.5">
                              <Gauge className="size-4 text-cyan-400" />
                              <span className="font-display text-xs font-bold uppercase text-white tracking-wider">
                                THUỘC TÍNH & PHÂN BỔ ĐIỂM TIỀM NĂNG
                              </span>
                            </div>
                            <div className={cn(
                              "rounded px-2 py-0.5 font-mono text-xs font-bold border",
                              pProg.availablePoints > 0
                                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 animate-pulse"
                                : "bg-black/40 text-muted-foreground border-border/40"
                            )}>
                              Điểm khả dụng: <strong className="text-white">{pProg.availablePoints}</strong>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            {[
                              { key: "attack" as PilotAttributeKey, label: "TẤN CÔNG (ATK)", effect: "+2.0 ATK / pt", icon: Crosshair, color: "text-red-400" },
                              { key: "defense" as PilotAttributeKey, label: "PHÒNG NGỰ (DEF)", effect: "+1.5 DEF / pt", icon: Shield, color: "text-blue-400" },
                              { key: "agility" as PilotAttributeKey, label: "CƠ ĐỘNG (SPD)", effect: "+1.0 SPD / pt", icon: Wind, color: "text-emerald-400" },
                              { key: "shield" as PilotAttributeKey, label: "LÁ CHẮN (SHIELD)", effect: "+30 Shield / pt", icon: ShieldAlert, color: "text-cyan-400" },
                              { key: "tactical" as PilotAttributeKey, label: "CHIẾN THUẬT (CRIT)", effect: "+0.4% Crit / pt", icon: Flame, color: "text-amber-400" },
                            ].map(({ key, label, effect, icon: Icon, color }) => {
                              const base = pDef.defaultStats[key] || 0
                              const val = pProg.allocatedStats[key] || 0
                              const canAdd = pProg.availablePoints > 0

                              return (
                                <div
                                  key={key}
                                  className="flex items-center justify-between rounded bg-black/60 px-3 py-1.5 border border-border/40 text-xs font-mono"
                                >
                                  <div className="flex items-center gap-2">
                                    <Icon className={cn("size-3.5", color)} />
                                    <span className="font-bold text-slate-200">{label}:</span>
                                    <span className="text-muted-foreground text-[10px]">gốc {base}</span>
                                    <strong className="text-cyan-300">+{val}</strong>
                                    <span className="text-[10px] text-muted-foreground ml-0.5">({effect})</span>
                                  </div>

                                  <button
                                    disabled={!canAdd}
                                    onClick={() => handleAllocatePoint(inspectPilotId, key)}
                                    className={cn(
                                      "size-6 rounded flex items-center justify-center font-bold text-xs transition-all cursor-pointer",
                                      canAdd
                                        ? "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                                        : "bg-black/60 text-muted-foreground border border-border/40 cursor-not-allowed opacity-40",
                                    )}
                                    title={canAdd ? `Cộng 1 điểm vào ${label}` : "Không còn điểm tiềm năng"}
                                  >
                                    <Plus className="size-3" />
                                  </button>
                                </div>
                              )
                            })}
                          </div>

                          <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                            <button
                              onClick={() => handleResetPoints(inspectPilotId)}
                              className="flex items-center gap-1 text-amber-300 hover:text-amber-200 cursor-pointer"
                              title="Cài lại toàn bộ điểm đã phân bổ (Phí 200 credits)"
                            >
                              <RotateCcw className="size-3" />
                              <span>Tẩy điểm tiềm năng (200 Credits)</span>
                            </button>

                            <span className="text-muted-foreground text-[10px]">
                              Tối đa +5 điểm mỗi lần lên cấp
                            </span>
                          </div>
                        </div>

                        {/* Kỹ Năng Nội Tại (Passive Skill) */}
                        <div className="rounded border border-amber-500/50 bg-gradient-to-r from-amber-950/20 via-black to-panel p-3 space-y-1.5 font-mono">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                              <Sparkles className="size-4 text-amber-400" />
                              <span className="font-display text-xs uppercase">
                                KỸ NĂNG NỘI TẠI: {pDef.passive.name} ({pDef.passive.nameEn})
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                              NỘI TẠI VĨNH VIỄN
                            </span>
                          </div>

                          <p className="text-xs text-slate-200 leading-relaxed">
                            {pDef.passive.desc}
                          </p>

                          {pDef.passive.triggerCondition && (
                            <div className="pt-1 text-[10px] text-muted-foreground">
                              <strong>Điều kiện kích hoạt:</strong> {pDef.passive.triggerCondition}
                            </div>
                          )}
                        </div>

                        {/* Vệt Lửa / Trail Aura (Nếu có) */}
                        {pDef.trail && (
                          <div className="rounded border border-cyan-500/30 bg-black/40 p-2.5 space-y-1 font-mono text-[11px]">
                            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                              <Zap className="size-3.5 text-cyan-400" />
                              <span>VỆT KHÍ TÁC CHIẾN: {pDef.trail.name}</span>
                            </div>
                            <p className="text-muted-foreground text-[10.5px]">
                              {pDef.trail.bonusSummary}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer: Quick Nav & Primary Confirm CTA */}
                  <div className="border-t border-cyan-500/40 bg-black/70 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    {/* Điều hướng chuyển phi công */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          playClickSound()
                          setInspectPilotId(prevPilot.id)
                        }}
                        className="flex items-center gap-1 rounded border border-border/60 bg-black/60 px-2.5 py-1.5 font-mono text-xs text-muted-foreground hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
                        title={`Xem ${prevPilot.name}`}
                      >
                        <ChevronLeft className="size-3.5" />
                        <span className="hidden sm:inline">Trước: {prevPilot.name.split(" ")[0]}</span>
                      </button>

                      <button
                        onClick={() => {
                          playClickSound()
                          setInspectPilotId(nextPilot.id)
                        }}
                        className="flex items-center gap-1 rounded border border-border/60 bg-black/60 px-2.5 py-1.5 font-mono text-xs text-muted-foreground hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
                        title={`Xem ${nextPilot.name}`}
                      >
                        <span className="hidden sm:inline">Sau: {nextPilot.name.split(" ")[0]}</span>
                        <ChevronRight className="size-3.5" />
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPilotDialogOpen(false)}
                        className="rounded border border-border/60 bg-black/40 px-3 py-2 font-display text-xs text-muted-foreground hover:text-white cursor-pointer transition-colors"
                      >
                        Đóng
                      </button>

                      <button
                        onClick={() => handleConfirmPilotFromSpotlight(pDef.id)}
                        className="flex items-center gap-1.5 rounded bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-4 sm:px-5 py-2 font-display text-xs font-bold text-white uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.4)] border border-cyan-400/60 transition-all"
                      >
                        <Check className="size-4" />
                        <span>XÁC NHẬN CHỌN {pDef.name.toUpperCase()} {currentStep === 1 ? "➔ TIẾP TỤC BƯỚC 2" : ""}</span>
                      </button>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: HỒ SƠ CHI TIẾT & NỔI BẬT CƠ GIÁP (AIRCRAFT SPOTLIGHT DIALOG)
          ==================================================================== */}
      {gearDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setGearDialogOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-sm border bg-panel/95 shadow-2xl overflow-hidden"
            style={{
              borderColor: `${STARFRONT_GEAR_DEFS[inspectGearId]?.color || "#06b6d4"}90`,
              boxShadow: `0 0 50px ${STARFRONT_GEAR_DEFS[inspectGearId]?.color || "#06b6d4"}30`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const gDef = STARFRONT_GEAR_DEFS[inspectGearId] || STARFRONT_GEAR_DEFS.vanguard
              const GEAR_IDS: StarfrontGearId[] = ["vanguard", "falcon", "aegis"]
              const gearIdx = GEAR_IDS.indexOf(inspectGearId)
              const prevGearId = GEAR_IDS[(gearIdx - 1 + GEAR_IDS.length) % GEAR_IDS.length]
              const nextGearId = GEAR_IDS[(gearIdx + 1) % GEAR_IDS.length]
              const prevGear = STARFRONT_GEAR_DEFS[prevGearId]
              const nextGear = STARFRONT_GEAR_DEFS[nextGearId]

              // So sánh với phi công đang được chọn (flowPilotDef)
              const isSynergyWithSelectedPilot = flowPilotDef.recommendedGear === inspectGearId
              const isCurrentActive = activePairing.gearId === inspectGearId

              return (
                <>
                  {/* Top Header */}
                  <div className="flex items-center justify-between border-b bg-black/60 px-4 py-3 shrink-0" style={{ borderColor: `${gDef.color}50` }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="size-8 rounded-sm bg-black/80 border flex items-center justify-center"
                        style={{ borderColor: gDef.color, color: gDef.color }}
                      >
                        <Cpu className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-white">
                            HỒ SƠ CHI TIẾT & NỔI BẬT CƠ GIÁP // {gDef.name.toUpperCase()}
                          </h3>
                          <span
                            className="rounded px-2 py-0.5 text-[9px] font-mono font-bold border"
                            style={{
                              backgroundColor: `${gDef.color}20`,
                              color: gDef.color,
                              borderColor: `${gDef.color}50`,
                            }}
                          >
                            {gDef.role}
                          </span>
                          {isCurrentActive && (
                            <span className="rounded bg-emerald-950/80 px-1.5 py-0.5 text-[9px] font-mono font-bold text-emerald-300 border border-emerald-500/40">
                              ĐANG XUẤT KÍCH
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">
                          TIÊU CHUẨN CHIẾN HẠM · CẤP ĐỘ CƠ GIÁP: CẤP {progression.level}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline font-mono text-[11px] text-muted-foreground">
                        Cơ giáp {gearIdx + 1}/3
                      </span>
                      <button
                        onClick={() => setGearDialogOpen(false)}
                        className="size-7 flex items-center justify-center rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors cursor-pointer"
                        title="Đóng (Esc)"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body Content (Scrollable) */}
                  <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      {/* Cột Trái: Trưng Bày 3D Concept Art Cơ Giáp (5 cột) */}
                      <div className="lg:col-span-5 flex flex-col items-center">
                        <div
                          className="relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-sm border-2 bg-black/90 p-1 shadow-2xl overflow-hidden group"
                          style={{
                            borderColor: `${gDef.color}80`,
                            boxShadow: `0 0 30px ${gDef.color}25`,
                          }}
                        >
                          <img
                            src={gDef.illustration || `/images/${inspectGearId}-gear.jpg`}
                            alt={gDef.name}
                            className="size-full object-cover object-center filter drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-105"
                          />

                          {/* Scanline & HUD Reticles */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                          <div
                            className="absolute top-2 left-2 font-mono text-[9px] bg-black/70 px-2 py-0.5 rounded border backdrop-blur-xs font-bold"
                            style={{ color: gDef.color, borderColor: `${gDef.color}50` }}
                          >
                            3D CONCEPT ART // CHASSIS {inspectGearId.toUpperCase()}
                          </div>

                          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between font-mono text-[10px] text-white bg-black/75 px-2.5 py-1 rounded border border-white/20 backdrop-blur-xs">
                            <span className="font-bold">{gDef.name.toUpperCase()}</span>
                            <span style={{ color: gDef.color }}>{gDef.role.split(" ")[0]}</span>
                          </div>
                        </div>

                        {/* Mô tả cơ giáp */}
                        <div className="mt-3 rounded bg-black/60 border border-border/50 p-3 w-full">
                          <p className="text-xs text-slate-200 leading-relaxed font-mono">
                            "{gDef.desc}"
                          </p>
                        </div>

                        {/* Phân Tích Hiệp Đồng với Phi Công Đang Chọn */}
                        <div
                          className={cn(
                            "mt-3 w-full rounded border p-3 font-mono text-xs transition-all",
                            isSynergyWithSelectedPilot
                              ? "bg-amber-950/40 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                              : "bg-black/50 border-border/50",
                          )}
                        >
                          <div className="flex items-center gap-1.5 font-bold mb-1">
                            <Sparkles className="size-3.5 text-amber-400" />
                            <span className={isSynergyWithSelectedPilot ? "text-amber-300" : "text-muted-foreground"}>
                              TƯƠNG THÍCH VỚI PHI CÔNG {flowPilotDef.name.toUpperCase()}
                            </span>
                          </div>

                          {isSynergyWithSelectedPilot ? (
                            <div className="space-y-1">
                              <span className="text-xs text-white font-bold block">
                                ⭐ HIỆP ĐỒNG HOÀN HẢO (100% SYNERGY MATCH)!
                              </span>
                              <p className="text-[11px] text-amber-200">
                                {flowPilotDef.synergyBonus}
                              </p>
                            </div>
                          ) : (
                            <p className="text-[11px] text-muted-foreground">
                              Phi công tối ưu cho dòng máy này:{" "}
                              <strong className="text-cyan-300">
                                {STARFRONT_PILOTS.find((p) => p.recommendedGear === inspectGearId)?.name || "Chiến binh tinh nhuệ"}
                              </strong>
                              . Vẫn có thể xuất kích bình thường với toàn bộ chỉ số.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Cột Phải: Thông Số Kỹ Thuật & Kỹ Năng Hệ Thống (7 cột) */}
                      <div className="lg:col-span-7 space-y-3.5">
                        {/* Bảng Chỉ Số Gốc & Tăng Trưởng */}
                        <div className="rounded border border-border/60 bg-black/50 p-3 space-y-2.5">
                          <div className="flex items-center justify-between border-b border-border/40 pb-2">
                            <div className="flex items-center gap-1.5">
                              <Gauge className="size-4" style={{ color: gDef.color }} />
                              <span className="font-display text-xs font-bold uppercase text-white tracking-wider">
                                THÔNG SỐ KHUNG THÂN GỐC // BASE SPECIFICATIONS
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              CẤP HIỆN TẠI: {progression.level}
                            </span>
                          </div>

                          <div className="space-y-2 font-mono text-xs">
                            {[
                              { label: "Máu Khung Thân (HP)", base: gDef.baseStats.hp, growth: gDef.growth.hp, max: 2000, color: "bg-red-500", text: "text-red-400" },
                              { label: "Năng Lượng Lõi (SP)", base: gDef.baseStats.sp, growth: gDef.growth.sp, max: 200, color: "bg-cyan-500", text: "text-cyan-400" },
                              { label: "Hỏa Lực Gốc (ATK)", base: gDef.baseStats.attack, growth: gDef.growth.attack, max: 250, color: "bg-orange-500", text: "text-orange-400" },
                              { label: "Giáp Phòng Thủ (DEF)", base: gDef.baseStats.defense, growth: gDef.growth.defense, max: 150, color: "bg-blue-500", text: "text-blue-400" },
                              { label: "Tốc Độ Phản Ứng (SPD)", base: gDef.baseStats.speed, growth: gDef.growth.speed, max: 150, color: "bg-emerald-500", text: "text-emerald-400" },
                            ].map((st, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-300">{st.label}:</span>
                                  <div className="flex items-center gap-2">
                                    <strong className={cn("text-sm", st.text)}>{st.base}</strong>
                                    <span className="text-[10px] text-muted-foreground">(+{st.growth}/cấp)</span>
                                  </div>
                                </div>
                                <div className="h-1.5 w-full bg-secondary/80 rounded overflow-hidden">
                                  <div
                                    className={cn("h-full", st.color)}
                                    style={{ width: `${Math.min(100, Math.round((st.base / st.max) * 100))}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Hệ Thống Nội Tại (Passive Core System) */}
                        <div className="rounded border border-amber-500/50 bg-gradient-to-r from-amber-950/20 via-black to-panel p-3 space-y-1.5 font-mono">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                              <Sparkles className="size-4 text-amber-400" />
                              <span className="font-display text-xs uppercase">
                                HỆ THỐNG NỘI TẠI: {gDef.passive.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                              LÕI NĂNG LƯỢNG
                            </span>
                          </div>

                          <p className="text-xs text-slate-200 leading-relaxed">
                            {gDef.passive.desc}
                          </p>

                          {gDef.passive.details && gDef.passive.details.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                              {gDef.passive.details.map((d, dIdx) => (
                                <div key={dIdx} className="rounded bg-black/60 p-1.5 border border-border/40 text-[10px]">
                                  <span className="text-muted-foreground block">{d.label}</span>
                                  <strong className="text-amber-200">{d.value}</strong>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Bộ Kỹ Năng Chiến Đấu của Gear */}
                        <div className="rounded border border-border/60 bg-black/50 p-3 space-y-2 font-mono">
                          <span className="font-display text-xs font-bold text-white uppercase tracking-wider block">
                            MÔ-ĐUN KỸ NĂNG TÁC CHIẾN MẶC ĐỊNH ({gDef.skills.length} KỸ NĂNG)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {gDef.skills.map((sk) => (
                              <div
                                key={sk.id}
                                className="rounded bg-black/60 p-2 border border-border/40 flex items-start gap-2"
                              >
                                <Zap className="size-3.5 text-cyan-400 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-display text-xs font-bold text-white truncate">
                                      {sk.name}
                                    </span>
                                    <span className="text-[9px] text-amber-300 shrink-0">{sk.spCost} SP</span>
                                  </div>
                                  <p className="text-[9.5px] text-muted-foreground line-clamp-1 mt-0.5">
                                    {sk.desc}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer: Quick Nav & Primary Confirm CTA */}
                  <div className="border-t bg-black/70 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0" style={{ borderColor: `${gDef.color}50` }}>
                    {/* Điều hướng chuyển cơ giáp */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          playClickSound()
                          setInspectGearId(prevGearId)
                        }}
                        className="flex items-center gap-1 rounded border border-border/60 bg-black/60 px-2.5 py-1.5 font-mono text-xs text-muted-foreground hover:text-white transition-colors cursor-pointer"
                        title={`Xem ${prevGear.name}`}
                      >
                        <ChevronLeft className="size-3.5" />
                        <span className="hidden sm:inline">Trước: {prevGear.name.split(" ")[0]}</span>
                      </button>

                      <button
                        onClick={() => {
                          playClickSound()
                          setInspectGearId(nextGearId)
                        }}
                        className="flex items-center gap-1 rounded border border-border/60 bg-black/60 px-2.5 py-1.5 font-mono text-xs text-muted-foreground hover:text-white transition-colors cursor-pointer"
                        title={`Xem ${nextGear.name}`}
                      >
                        <span className="hidden sm:inline">Sau: {nextGear.name.split(" ")[0]}</span>
                        <ChevronRight className="size-3.5" />
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setGearDialogOpen(false)}
                        className="rounded border border-border/60 bg-black/40 px-3 py-2 font-display text-xs text-muted-foreground hover:text-white cursor-pointer transition-colors"
                      >
                        Đóng
                      </button>

                      <button
                        onClick={() => handleConfirmGearFromSpotlight(gDef.id)}
                        className="flex items-center gap-1.5 rounded px-4 sm:px-5 py-2 font-display text-xs font-bold text-white uppercase tracking-wider cursor-pointer shadow-lg border transition-all"
                        style={{
                          backgroundColor: gDef.color,
                          borderColor: "#ffffff80",
                          color: "#000000",
                          boxShadow: `0 0 20px ${gDef.color}60`,
                        }}
                      >
                        <Check className="size-4" />
                        <span>XÁC NHẬN CHỌN {gDef.name.toUpperCase()} {currentStep === 2 ? "➔ ĐÁNH GIÁ BƯỚC 3" : ""}</span>
                      </button>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: CHI TIẾT MÔ-ĐUN KỸ NĂNG (SKILL DETAIL MODAL)
          ==================================================================== */}
      {inspectSkillSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-sm border border-cyan-500/60 bg-panel p-5 shadow-2xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-cyan-400" />
                <h3 className="font-display text-sm font-bold uppercase text-white">
                  {inspectSkillSlot.skill.name}
                </h3>
              </div>
              <button
                onClick={() => setInspectSkillSlot(null)}
                className="size-6 flex items-center justify-center rounded hover:bg-white/10 text-muted-foreground hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Vai Trò:</span>
                <span className="text-cyan-300 font-bold">{inspectSkillSlot.categoryLabel}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Tiêu Hao SP:</span>
                <span className="text-amber-300 font-bold">{inspectSkillSlot.skill.spCost} SP</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Hồi Chiêu (CD):</span>
                <span className="text-slate-200 font-bold">{inspectSkillSlot.skill.cooldown} Lượt</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Hệ Số Sát Thương:</span>
                <span className="text-red-400 font-bold">x{inspectSkillSlot.skill.damageMultiplier || 1.0}</span>
              </div>
              <p className="rounded bg-black/60 p-2.5 border border-border/40 text-slate-200 text-xs leading-relaxed mt-2">
                {inspectSkillSlot.skill.desc}
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-border/40">
              <button
                onClick={() => setInspectSkillSlot(null)}
                className="rounded border border-border/60 bg-black/40 px-4 py-1.5 font-mono text-xs text-muted-foreground hover:text-white cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: ADMIN CONTROL PANEL (PHASE 5.9 QUẢN TRỊ TOÀN CỤC)
          ==================================================================== */}
      <AdminCpModal
        progression={progression}
        isOpen={isAdminCpOpen}
        onClose={() => setIsAdminCpOpen(false)}
        onUpdateProgression={(updated) => {
          onUpdateProgression(updated)
          saveStarfrontProgression(updated)
        }}
      />
    </div>
  )
}
