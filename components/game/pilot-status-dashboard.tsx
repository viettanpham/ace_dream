"use client"

import React, { useId, useMemo, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  BatteryCharging,
  Boxes,
  Brain,
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
  ShieldCheck,
  Sparkles,
  Sword,
  Target,
  Unlock,
  UserCheck,
  UserRound,
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
  getEnhancedItemStats,
  getItemDisplayName,
  getPilotExpRequiredForLevel,
  resetPilotPoints,
} from "@/lib/game/progression"
import {
  playClickSound,
  playEquipSound,
  playLevelUpSound,
  playShieldSound,
} from "@/lib/game/audio"
import { loadStarfrontProgression, saveStarfrontProgression } from "@/lib/game/storage"
import type {
  PilotAttributeKey,
  PilotProgressionData,
  StarfrontGearId,
  StarfrontItem,
  StarfrontItemSlot,
  StarfrontProgression,
} from "@/lib/game/types"
import { cn } from "@/lib/utils"
import { getEnhancementBadgeMeta } from "./starfront-hangar"

/* ==========================================================================
   INTERFACES & CONFIG
   ========================================================================== */

export interface PilotStatusDashboardProps {
  /** Dữ liệu tiến trình StarfrontProgression (nếu không truyền, tự nạp từ LocalStorage) */
  progression?: StarfrontProgression
  /** Callback cập nhật tiến trình */
  onUpdateProgression?: (updated: StarfrontProgression) => void
  /** Callback lắp trang bị vào slot */
  onEquipItem?: (gearSlot: StarfrontItemSlot, itemId: string) => void
  /** Callback gỡ trang bị khỏi slot */
  onUnequipSlot?: (gearSlot: StarfrontItemSlot) => void
  /** Callback điều hướng phân hệ trong game */
  onNavigateSection?: (sectionId: string) => void
  /** Class tùy biến */
  className?: string
  /** Ẩn thanh chọn phi công (chỉ hiển thị cố định phi công đang active) */
  hidePilotSwitcher?: boolean
}

// Bảng thuộc tính chỉ số phi công
const ATTRIBUTE_ROWS: {
  key: PilotAttributeKey
  label: string
  labelShort: string
  icon: typeof Crosshair
  color: string
  description: string
  gainText: string
}[] = [
  {
    key: "attack",
    label: "Hỏa Lực Tấn Công",
    labelShort: "ATK",
    icon: Sword,
    color: "#f59e0b",
    description: "Gia tăng sát thương cơ bản và khuếch đại lực bắn của vũ khí.",
    gainText: "+2.0 Sát thương Tấn Công / điểm",
  },
  {
    key: "defense",
    label: "Giáp & Phòng Ngự",
    labelShort: "DEF",
    icon: Shield,
    color: "#3b82f6",
    description: "Tăng khả năng chống chịu va chạm và giảm sát thương vật lý trực tiếp.",
    gainText: "+1.5 Phòng Thủ / điểm",
  },
  {
    key: "agility",
    label: "Cơ Động & Phản Xạ",
    labelShort: "AGI",
    icon: Wind,
    color: "#06b6d4",
    description: "Rút ngắn thời gian hồi chiêu và tăng cơ hội tránh né đòn tấn công.",
    gainText: "+1.0 Tốc Độ & +0.2% Né Tránh / điểm",
  },
  {
    key: "shield",
    label: "Trường Lực Khiên",
    labelShort: "SHD",
    icon: Sparkles,
    color: "#10b981",
    description: "Mở rộng dung lượng màng chắn năng lượng bảo vệ phi cơ.",
    gainText: "+30 Khiên Năng Lượng / điểm",
  },
  {
    key: "tactical",
    label: "Chiến Thuật & Trực Giác",
    labelShort: "TAC",
    icon: Target,
    color: "#a855f7",
    description: "Nhận biết điểm yếu mục tiêu, gia tăng tỉ lệ phát động đòn chí mạng.",
    gainText: "+0.4% Tỉ Lệ Bạo Kích / điểm",
  },
]

// Slot trang bị cấu hình
const EQUIPMENT_SLOTS: {
  slot: StarfrontItemSlot
  name: string
  icon: typeof Sword
  color: string
  subText: string
}[] = [
  {
    slot: "weapon",
    name: "Vũ Khí Chính (Weapon)",
    icon: Sword,
    color: "#ef4444",
    subText: "Tăng trực tiếp ATK và hiệu ứng xuyên phá",
  },
  {
    slot: "shield",
    name: "Khiên Năng Lượng (Shield)",
    icon: Shield,
    color: "#10b981",
    subText: "Gia cố DEF và hồi phục dung lượng Shield",
  },
  {
    slot: "engine",
    name: "Động Cơ Đẩy (Engine)",
    icon: Gauge,
    color: "#06b6d4",
    subText: "Tăng tốc độ hành động SPD và Né Tránh",
  },
]

// Tính quân hàm phi công dựa trên cấp độ
function getPilotRank(level: number): { title: string; badge: string; color: string } {
  if (level >= 15) {
    return { title: "Át Chủ Bài Huyền Thoại (Ace Pilot)", badge: "RANK S", color: "#f59e0b" }
  }
  if (level >= 10) {
    return { title: "Chỉ Huy Tiền Tuyến (Commander)", badge: "RANK A", color: "#a855f7" }
  }
  if (level >= 5) {
    return { title: "Trung Úy Tác Chiến (Lieutenant)", badge: "RANK B", color: "#06b6d4" }
  }
  return { title: "Học Viên Tiên Phong (Ensign)", badge: "RANK C", color: "#10b981" }
}

// Bảng màu độ hiếm trang bị
const RARITY_THEME: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  common: { border: "border-slate-500/50", bg: "bg-slate-900/60", text: "text-slate-300", glow: "rgba(148,163,184,0.2)" },
  rare: { border: "border-cyan-500/60", bg: "bg-cyan-950/40", text: "text-cyan-300", glow: "rgba(6,182,212,0.3)" },
  epic: { border: "border-purple-500/60", bg: "bg-purple-950/40", text: "text-purple-300", glow: "rgba(168,85,247,0.3)" },
  legendary: { border: "border-amber-500/70", bg: "bg-amber-950/50", text: "text-amber-300", glow: "rgba(245,158,11,0.35)" },
}

/* ==========================================================================
   MAIN DASHBOARD COMPONENT
   ========================================================================== */

export function PilotStatusDashboard({
  progression: propProgression,
  onUpdateProgression,
  onEquipItem,
  onUnequipSlot,
  onNavigateSection,
  className,
  hidePilotSwitcher = false,
}: PilotStatusDashboardProps) {
  // Quản lý state cục bộ nếu không có propProgression
  const [internalProgression, setInternalProgression] = useState<StarfrontProgression>(() => {
    return propProgression || loadStarfrontProgression()
  })

  // Luôn đồng bộ dữ liệu hoạt động
  const progression = propProgression || internalProgression

  const handleUpdate = (updated: StarfrontProgression) => {
    if (onUpdateProgression) {
      onUpdateProgression(updated)
    } else {
      setInternalProgression(updated)
      saveStarfrontProgression(updated)
    }
  }

  // Cặp đôi phi công đang active
  const activePairing = progression.activePairing || {
    pilotId: "marcus",
    gearId: "vanguard",
    isLocked: false,
    unlockProgress: { completedMissions: 0, wonBattles: 0, targetCount: 5 },
  }

  // Phi công đang được chọn xem trên Dashboard (mặc định là phi công active)
  const [selectedPilotId, setSelectedPilotId] = useState<string>(activePairing.pilotId || "marcus")

  // Tab trực quan hóa dữ liệu (0: Radar & Phân tích tổng thể, 1: Phân bổ điểm, 2: Ma trận Trang bị)
  const [activeTab, setActiveTab] = useState<"radar" | "breakdown" | "equipment">("radar")

  // Modal thay đổi trang bị nhanh
  const [equipModalSlot, setEquipModalSlot] = useState<StarfrontItemSlot | null>(null)

  // Hover điểm trên biểu đồ Radar
  const [hoveredRadarStat, setHoveredRadarStat] = useState<string | null>(null)

  // Toast thông báo nhỏ
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Hồ sơ phi công đang xem
  const pilotDef: StarfrontPilotDef = STARFRONT_PILOT_MAP[selectedPilotId] || STARFRONT_PILOTS[0]
  const pilotData: PilotProgressionData = progression.pilots?.[selectedPilotId] || {
    id: selectedPilotId,
    level: 1,
    exp: 0,
    allocatedStats: { attack: 0, defense: 0, agility: 0, shield: 0, tactical: 0 },
    availablePoints: 0,
  }

  // Cơ giáp đang liên kết
  const activeGearId: StarfrontGearId = activePairing.gearId || "vanguard"
  const gearDef = STARFRONT_GEAR_DEFS[activeGearId] || STARFRONT_GEAR_DEFS.vanguard

  // Kiểm tra hiệp đồng đặc trưng Signature Resonance (lái đúng cơ giáp khuyến nghị)
  const isSignatureResonance = pilotDef.recommendedGear === activeGearId

  // Tính tổng chỉ số chiến đấu
  const { total, base, breakdown, equippedItems } = useMemo(() => {
    return calculateTotalGearStats(
      activeGearId,
      progression.level,
      progression.inventory,
      progression.equipped,
      pilotData,
    )
  }, [activeGearId, progression.level, progression.inventory, progression.equipped, pilotData])

  // Tính EXP lên cấp
  const expNeeded = getPilotExpRequiredForLevel(pilotData.level)
  const expProgressPercent = Math.min(100, Math.round((pilotData.exp / expNeeded) * 100))

  // Tính quân hàm phi công
  const rank = getPilotRank(pilotData.level)

  // Điểm đánh giá chiến đấu CPI (Combat Power Index)
  const combatPowerIndex = useMemo(() => {
    const statScore = Math.round(
      total.hp * 0.15 +
      total.sp * 0.35 +
      total.attack * 2.2 +
      total.defense * 1.8 +
      total.speed * 1.4 +
      (pilotData.allocatedStats.shield || 0) * 30 * 0.35 +
      (pilotData.allocatedStats.tactical || 0) * 15
    )
    const equipmentScore = equippedItems.reduce((acc, it) => acc + calculateItemRating(it), 0)
    const synergyBonus = isSignatureResonance ? 250 : 50
    return statScore + equipmentScore + synergyBonus
  }, [total, pilotData, equippedItems, isSignatureResonance])

  // Phân cấp CPI (Grade)
  const cpiGrade = useMemo(() => {
    if (combatPowerIndex >= 2200) return { grade: "EX", color: "#f59e0b" }
    if (combatPowerIndex >= 1600) return { grade: "S", color: "#a855f7" }
    if (combatPowerIndex >= 1200) return { grade: "A", color: "#06b6d4" }
    if (combatPowerIndex >= 800) return { grade: "B", color: "#10b981" }
    return { grade: "C", color: "#64748b" }
  }, [combatPowerIndex])

  // Xử lý cộng điểm chỉ số
  const handleAllocate = (statKey: PilotAttributeKey) => {
    if (pilotData.availablePoints <= 0) return
    playClickSound()
    const { success, updated, message } = allocatePilotPoint(progression, selectedPilotId, statKey)
    if (success) {
      handleUpdate(updated)
      showToast(`+1 điểm vào ${statKey.toUpperCase()}`)
    } else {
      showToast(message)
    }
  }

  // Xử lý tẩy điểm
  const handleResetPoints = () => {
    const totalAllocated = Object.values(pilotData.allocatedStats).reduce((a, b) => a + b, 0)
    if (totalAllocated === 0) {
      showToast("Phi công chưa phân bổ điểm nào để cài lại.")
      return
    }
    playShieldSound()
    const { success, updated, message } = resetPilotPoints(progression, selectedPilotId)
    if (success) {
      handleUpdate(updated)
      showToast(message)
    }
  }

  // Xử lý tự động phân bổ điểm tối ưu theo chuyên môn phi công
  const handleAutoAllocate = () => {
    if (pilotData.availablePoints <= 0) {
      showToast("Không còn điểm tiềm năng để phân bổ.")
      return
    }
    playLevelUpSound()
    let currentProg = { ...progression }
    let remaining = pilotData.availablePoints

    // Trọng số ưu tiên theo phi công
    const weights: Record<string, PilotAttributeKey[]> = {
      marcus: ["attack", "attack", "defense", "shield", "tactical"],
      valentine: ["shield", "defense", "shield", "defense", "agility"],
      alviss: ["agility", "agility", "attack", "tactical", "agility"],
      eric: ["attack", "tactical", "attack", "defense", "tactical"],
    }
    const priority = weights[selectedPilotId] || ["attack", "defense", "agility"]

    let idx = 0
    while (remaining > 0) {
      const targetStat = priority[idx % priority.length]
      const res = allocatePilotPoint(currentProg, selectedPilotId, targetStat)
      if (res.success) {
        currentProg = res.updated
        remaining--
        idx++
      } else {
        break
      }
    }

    handleUpdate(currentProg)
    showToast(`Đã tự động phân bổ ${pilotData.availablePoints - remaining} điểm theo chuyên môn!`)
  }

  // Xử lý lắp trang bị
  const handleEquipFromModal = (itemId: string) => {
    if (!equipModalSlot) return
    playEquipSound()
    if (onEquipItem) {
      onEquipItem(equipModalSlot, itemId)
    } else {
      const nextEquipped = { ...progression.equipped, [equipModalSlot]: itemId }
      handleUpdate({ ...progression, equipped: nextEquipped })
    }
    setEquipModalSlot(null)
    showToast(`Đã lắp trang bị vào ô ${equipModalSlot.toUpperCase()}`)
  }

  // Xử lý tháo trang bị
  const handleUnequipFromSlot = (slot: StarfrontItemSlot) => {
    playClickSound()
    if (onUnequipSlot) {
      onUnequipSlot(slot)
    } else {
      const nextEquipped = { ...progression.equipped, [slot]: null }
      handleUpdate({ ...progression, equipped: nextEquipped })
    }
    showToast(`Đã gỡ trang bị khỏi ô ${slot.toUpperCase()}`)
  }

  /* ==========================================================================
     TÍNH TOÁN RADAR CHART (HEXAGON 6 TRỤC CHỈ SỐ)
     ========================================================================== */
  const radarAxes = useMemo(() => {
    const size = 320
    const center = size / 2
    const radius = 110

    // 6 trục chỉ số chuẩn hóa từ 0 đến 100%
    const axesData = [
      {
        key: "attack",
        label: "ATK (Hỏa Lực)",
        value: total.attack,
        baseValue: base.attack,
        maxValue: 420,
        color: "#f59e0b",
      },
      {
        key: "defense",
        label: "DEF (Phòng Ngự)",
        value: total.defense,
        baseValue: base.defense,
        maxValue: 260,
        color: "#3b82f6",
      },
      {
        key: "speed",
        label: "SPD (Tốc Độ)",
        value: total.speed,
        baseValue: base.speed,
        maxValue: 210,
        color: "#06b6d4",
      },
      {
        key: "shield",
        label: "SHD (Trường Lực)",
        value: 300 + (pilotData.allocatedStats.shield || 0) * 30 + (breakdown.equipment.hp * 0.2),
        baseValue: 300,
        maxValue: 750,
        color: "#10b981",
      },
      {
        key: "agility",
        label: "EVA (Né Tránh)",
        value: Math.min(80, (activeGearId === "falcon" ? 20 : 5) + (pilotData.allocatedStats.agility || 0) * 0.8 + (selectedPilotId === "alviss" ? 8 : 0)),
        baseValue: activeGearId === "falcon" ? 15 : 5,
        maxValue: 80,
        color: "#ec4899",
      },
      {
        key: "tactical",
        label: "TAC (Chí Mạng)",
        value: Math.min(65, 15 + (pilotData.allocatedStats.tactical || 0) * 1.5 + (selectedPilotId === "eric" ? 12 : 0)),
        baseValue: 15,
        maxValue: 65,
        color: "#a855f7",
      },
    ]

    const totalPoints = axesData.length
    const angleStep = (Math.PI * 2) / totalPoints

    // Tọa độ các đỉnh đa giác
    const totalPolygonPoints: string[] = []
    const basePolygonPoints: string[] = []
    const axesLines: { x1: number; y1: number; x2: number; y2: number; label: string; key: string; color: string; value: number }[] = []

    axesData.forEach((axis, index) => {
      // Góc xoay (-PI/2 để bắt đầu từ đỉnh trên cùng)
      const angle = index * angleStep - Math.PI / 2

      // Tính tỉ lệ chuẩn hóa (10% đến 100%)
      const totalRatio = Math.max(0.12, Math.min(1.0, axis.value / axis.maxValue))
      const baseRatio = Math.max(0.12, Math.min(1.0, axis.baseValue / axis.maxValue))

      const totalX = center + radius * totalRatio * Math.cos(angle)
      const totalY = center + radius * totalRatio * Math.sin(angle)
      totalPolygonPoints.push(`${totalX.toFixed(1)},${totalY.toFixed(1)}`)

      const baseX = center + radius * baseRatio * Math.cos(angle)
      const baseY = center + radius * baseRatio * Math.sin(angle)
      basePolygonPoints.push(`${baseX.toFixed(1)},${baseY.toFixed(1)}`)

      const outerX = center + (radius + 24) * Math.cos(angle)
      const outerY = center + (radius + 24) * Math.sin(angle)

      axesLines.push({
        x1: center,
        y1: center,
        x2: outerX,
        y2: outerY,
        label: axis.label,
        key: axis.key,
        color: axis.color,
        value: Math.round(axis.value),
      })
    })

    // Các vòng lưới đồng tâm (20%, 40%, 60%, 80%, 100%)
    const gridRings = [0.2, 0.4, 0.6, 0.8, 1.0].map((scale) => {
      const ringPoints = axesData.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2
        const x = center + radius * scale * Math.cos(angle)
        const y = center + radius * scale * Math.sin(angle)
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      return ringPoints.join(" ")
    })

    return {
      size,
      center,
      radius,
      totalPolygon: totalPolygonPoints.join(" "),
      basePolygon: basePolygonPoints.join(" "),
      axesLines,
      gridRings,
    }
  }, [total, base, activeGearId, selectedPilotId, pilotData, breakdown])

  return (
    <div className={cn("space-y-4 font-sans text-white", className)}>
      {/* Toast thông báo nổi */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded border border-cyan-400/60 bg-black/90 px-3.5 py-2 font-mono text-xs text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] backdrop-blur-md"
          >
            <Sparkles className="size-4 text-cyan-400 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================================
          1. HEADER & THANH CHỌN PHI CÔNG (PILOT SELECTOR STRIP)
          ================================================================== */}
      <div className="rounded-sm border border-border/80 bg-panel/90 p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded border border-cyan-500/50 bg-cyan-950/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Activity className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-black tracking-wider uppercase text-cyan-400">
                  PILOT STATUS
                </span>
                <span className="text-muted-foreground font-mono text-xs">/</span>
                <span className="font-display text-xs font-bold uppercase tracking-wider text-white">
                  BẢNG ĐIỀU KHIỂN CHỈ SỐ & TRANG BỊ
                </span>
              </div>
              <div className="text-[11px] font-mono text-muted-foreground">
                Dữ liệu phân tích trực quan hóa Telemetry buồng lái · Phiên bản Phase 5.9
              </div>
            </div>
          </div>

          {/* Huy hiệu khóa / mở khóa cặp đôi */}
          <div className="flex items-center gap-2">
            {activePairing.isLocked ? (
              <div className="flex items-center gap-1.5 rounded border border-amber-500/50 bg-amber-950/40 px-2.5 py-1 text-[11px] font-mono text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                <Lock className="size-3 text-amber-400" />
                <span className="font-bold">ĐÃ KHÓA CHIẾN DỊCH</span>
                <span className="text-muted-foreground text-[10px]">
                  ({activePairing.unlockProgress.wonBattles}/5 Trận Thắng)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded border border-cyan-500/40 bg-cyan-950/30 px-2.5 py-1 text-[11px] font-mono text-cyan-300">
                <Unlock className="size-3 text-cyan-400" />
                <span>SẴN SÀNG ĐIỀU ĐỘNG</span>
              </div>
            )}

            {onNavigateSection && (
              <button
                onClick={() => {
                  playClickSound()
                  onNavigateSection("character-gear")
                }}
                className="flex items-center gap-1 rounded border border-border/70 bg-black/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
                title="Đến trang quản lý Nhân Vật & Cơ Giáp"
              >
                <span>Đổi Cặp Đôi</span>
                <ArrowRight className="size-3" />
              </button>
            )}
          </div>
        </div>

        {/* Thanh chọn 4 Phi Công (Quick Pilot Selector) */}
        {!hidePilotSwitcher && (
          <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STARFRONT_PILOTS.map((pilot) => {
              const isSelected = selectedPilotId === pilot.id
              const isActiveInPair = activePairing.pilotId === pilot.id
              const pData = progression.pilots?.[pilot.id]
              const pLevel = pData?.level || 1

              return (
                <button
                  key={pilot.id}
                  onClick={() => {
                    playClickSound()
                    setSelectedPilotId(pilot.id)
                  }}
                  className={cn(
                    "flex items-center gap-2.5 rounded-sm border p-2 text-left transition-all cursor-pointer",
                    isSelected
                      ? "border-cyan-400 bg-cyan-950/50 shadow-[0_0_14px_rgba(6,182,212,0.35)]"
                      : "border-border/60 bg-card/40 hover:border-border hover:bg-card/70",
                  )}
                >
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-xs border border-border/80 bg-black">
                    <img
                      src={pilot.avatar}
                      alt={pilot.name}
                      className="size-full object-cover object-top"
                    />
                    {isActiveInPair && (
                      <div
                        className="absolute bottom-0 inset-x-0 bg-cyan-500/90 py-0.2 text-center text-[7.5px] font-black text-black tracking-tighter"
                        title="Phi công hiện tại của phi đội"
                      >
                        ACTIVE
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-display text-xs font-bold text-white truncate">
                        {pilot.name.split(" ")[0]}
                      </span>
                      <span className="font-mono text-[10px] text-cyan-300">
                        LV {pLevel}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground truncate">
                      {pilot.callsign}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ==================================================================
          2. HỒ SƠ PHI CÔNG, QUÂN HÀM & TELEMETRY DIAL (CHỈ SỐ TỔNG)
          ================================================================== */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Card 1: Chân Dung & Thông Tin Chi Tiết (4 cột) */}
        <div className="rounded-sm border border-border/80 bg-panel/80 p-4 shadow-xl backdrop-blur-md lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="relative overflow-hidden rounded-xs border border-cyan-500/40 bg-black/60 p-2 shadow-inner">
              {/* Scanline hiệu ứng Hologram */}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.06)_1px,transparent_1px)] bg-[size:100%_3px]" />

              <div className="flex gap-3">
                <div className="relative size-28 shrink-0 overflow-hidden rounded-xs border border-cyan-500/60 shadow-lg">
                  <img
                    src={pilotDef.avatar}
                    alt={pilotDef.name}
                    className="size-full object-cover object-top"
                  />
                  <div className="absolute top-1 left-1 rounded-xs bg-black/80 px-1.5 py-0.5 font-mono text-[9px] text-cyan-300 border border-cyan-500/40">
                    {pilotDef.callsign}
                  </div>
                </div>

                <div className="min-w-0 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="font-display text-base font-bold text-white tracking-wide truncate">
                      {pilotDef.name}
                    </h2>
                    <div className="text-[11px] font-mono text-cyan-300 mt-0.5">
                      {pilotDef.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                      {pilotDef.specialty}
                    </div>
                  </div>

                  {/* Quân Hàm & Cấp độ */}
                  <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
                    <div>
                      <div className="text-[9px] font-mono text-muted-foreground">QUÂN HÀM</div>
                      <div className="font-display text-[11px] font-bold" style={{ color: rank.color }}>
                        {rank.badge} · {rank.title.split("(")[0]}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-mono text-muted-foreground">CẤP ĐỘ</div>
                      <div className="font-mono text-xs font-bold text-white">
                        LV {pilotData.level}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Thanh tiến trình EXP Lên Cấp */}
            <div className="mt-3.5 space-y-1.5 rounded-sm border border-border/60 bg-black/40 p-2.5">
              <div className="flex items-center justify-between text-[10.5px] font-mono">
                <span className="text-muted-foreground">TIẾN TRÌNH KINH NGHIỆM</span>
                <span className="font-bold text-cyan-300">
                  {pilotData.exp.toLocaleString("vi-VN")} / {expNeeded.toLocaleString("vi-VN")} EXP ({expProgressPercent}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${expProgressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[9.5px] font-mono text-muted-foreground">
                <span>Còn {Math.max(0, expNeeded - pilotData.exp)} EXP để thăng cấp</span>
                <span>+5 Điểm Thuộc Tính/Cấp</span>
              </div>
            </div>

            {/* Trait & Đặc Trưng Chiến Đấu */}
            <div className="mt-3 space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                ĐẶC TÍNH PHI CÔNG (TRAITS)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pilotDef.traits.map((trait, i) => (
                  <span
                    key={i}
                    className="rounded-xs border border-border/70 bg-card/60 px-2 py-0.5 text-[10px] font-mono text-slate-300"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Vệt Hào Quang Trail Aura */}
          <div
            className="mt-3 rounded-sm border p-2.5 font-mono text-[11px]"
            style={{
              borderColor: `${pilotDef.trail.auraColor}60`,
              backgroundColor: `${pilotDef.trail.auraColor}12`,
            }}
          >
            <div className="flex items-center gap-1.5 font-bold" style={{ color: pilotDef.trail.auraColor }}>
              <Sparkles className="size-3.5" />
              <span>{pilotDef.trail.name}</span>
            </div>
            <div className="text-[10px] text-slate-300 mt-1 leading-relaxed">
              {pilotDef.trail.bonusSummary}
            </div>
          </div>
        </div>

        {/* Card 2: Chỉ Số Chiến Đấu CPI & Hiệp Đồng Cơ Giáp (8 cột) */}
        <div className="rounded-sm border border-border/80 bg-panel/80 p-4 shadow-xl backdrop-blur-md lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <div className="text-[10px] font-mono text-muted-foreground">COMBAT POWER INDEX (CPI)</div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl font-black text-white tracking-wider">
                    {combatPowerIndex.toLocaleString("vi-VN")}
                  </span>
                  <span
                    className="font-display text-xs font-black px-1.5 py-0.5 rounded-xs border"
                    style={{
                      color: cpiGrade.color,
                      borderColor: `${cpiGrade.color}60`,
                      backgroundColor: `${cpiGrade.color}15`,
                    }}
                  >
                    GRADE {cpiGrade.grade}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Điểm Lực Chiến Thực Thực Tế
                  </span>
                </div>
              </div>

              {/* Hiệp Đồng Cơ Giáp Tương Thích */}
              <div
                className={cn(
                  "flex items-center gap-2.5 rounded border p-2 text-xs font-mono",
                  isSignatureResonance
                    ? "border-emerald-500/60 bg-emerald-950/40 text-emerald-300"
                    : "border-border/60 bg-black/40 text-muted-foreground",
                )}
              >
                <div
                  className="size-8 rounded overflow-hidden border p-0.5 shrink-0 bg-black"
                  style={{ borderColor: gearDef.color }}
                >
                  <img
                    src={gearDef.illustration || `/images/${activeGearId}.svg`}
                    alt={gearDef.name}
                    className="size-full object-contain"
                  />
                </div>
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>{gearDef.name}</span>
                    {isSignatureResonance && (
                      <span className="text-[9.5px] rounded bg-emerald-500/20 px-1 py-0.2 border border-emerald-500/40 font-black">
                        100% RESONANCE
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {isSignatureResonance
                      ? pilotDef.synergyBonus
                      : `Khuyên dùng: ${pilotDef.recommendedGear.toUpperCase()} để kích hoạt Signature Resonance`}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu tab chuyển đổi trực quan hóa (Zero-Pill Discipline) */}
            <div className="mt-3 flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-1 font-mono text-xs">
                <button
                  onClick={() => {
                    playClickSound()
                    setActiveTab("radar")
                  }}
                  className={cn(
                    "px-3 py-1.5 font-bold transition-colors cursor-pointer border-b-2 -mb-[9px]",
                    activeTab === "radar"
                      ? "border-cyan-400 text-cyan-300"
                      : "border-transparent text-muted-foreground hover:text-white",
                  )}
                >
                  Radar & Biểu Đồ Chỉ Số
                </button>
                <button
                  onClick={() => {
                    playClickSound()
                    setActiveTab("breakdown")
                  }}
                  className={cn(
                    "px-3 py-1.5 font-bold transition-colors cursor-pointer border-b-2 -mb-[9px]",
                    activeTab === "breakdown"
                      ? "border-cyan-400 text-cyan-300"
                      : "border-transparent text-muted-foreground hover:text-white",
                  )}
                >
                  Phân Bổ Điểm Tiềm Năng ({pilotData.availablePoints})
                </button>
                <button
                  onClick={() => {
                    playClickSound()
                    setActiveTab("equipment")
                  }}
                  className={cn(
                    "px-3 py-1.5 font-bold transition-colors cursor-pointer border-b-2 -mb-[9px]",
                    activeTab === "equipment"
                      ? "border-cyan-400 text-cyan-300"
                      : "border-transparent text-muted-foreground hover:text-white",
                  )}
                >
                  Ma Trận Trang Bị (3 Slot)
                </button>
              </div>

              {/* Điểm tiềm năng khả dụng */}
              {pilotData.availablePoints > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-amber-300 animate-pulse">
                  <Sparkles className="size-3.5 text-amber-400" />
                  <span className="font-bold">{pilotData.availablePoints} Điểm Chưa Phân Bổ</span>
                </div>
              )}
            </div>

            {/* Nội dung tab tương ứng */}
            <div className="mt-4">
              {/* TAB 1: RADAR CHART VÀ CÁC THANH TIẾN TRÌNH */}
              {activeTab === "radar" && (
                <div className="grid gap-4 md:grid-cols-12 items-center">
                  {/* SVG RADAR CHART (6 cột) */}
                  <div className="md:col-span-6 flex flex-col items-center justify-center p-2 rounded border border-border/40 bg-black/40">
                    <div className="text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">
                      ĐA GIÁC ĐÁNH GIÁ 6 TRỤC CHIẾN THUẬT
                    </div>

                    <svg
                      viewBox={`0 0 ${radarAxes.size} ${radarAxes.size}`}
                      className="size-64 sm:size-72 overflow-visible"
                    >
                      {/* Vòng lưới đồng tâm */}
                      {radarAxes.gridRings.map((ringPoints, i) => (
                        <polygon
                          key={i}
                          points={ringPoints}
                          fill="none"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="1"
                        />
                      ))}

                      {/* Các tia trục từ tâm ra ngoài */}
                      {radarAxes.axesLines.map((axis, i) => (
                        <line
                          key={i}
                          x1={axis.x1}
                          y1={axis.y1}
                          x2={axis.x2}
                          y2={axis.y2}
                          stroke="rgba(255,255,255,0.12)"
                          strokeWidth="1"
                        />
                      ))}

                      {/* Đa giác chỉ số gốc (Base) */}
                      <polygon
                        points={radarAxes.basePolygon}
                        fill="rgba(6,182,212,0.12)"
                        stroke="rgba(6,182,212,0.4)"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />

                      {/* Đa giác chỉ số sau cường hóa (Enhanced Total) */}
                      <polygon
                        points={radarAxes.totalPolygon}
                        fill="rgba(16,185,129,0.22)"
                        stroke="#10b981"
                        strokeWidth="2.5"
                      />

                      {/* Các điểm neo đỉnh đa giác (Vertex Dots) */}
                      {radarAxes.axesLines.map((axis, i) => (
                        <circle
                          key={i}
                          cx={radarAxes.center + (radarAxes.radius * Math.max(0.12, Math.min(1.0, axis.value / 400))) * Math.cos(i * (Math.PI / 3) - Math.PI / 2)}
                          cy={radarAxes.center + (radarAxes.radius * Math.max(0.12, Math.min(1.0, axis.value / 400))) * Math.sin(i * (Math.PI / 3) - Math.PI / 2)}
                          r="3.5"
                          fill={axis.color}
                          stroke="#ffffff"
                          strokeWidth="1"
                          className="cursor-pointer transition-transform hover:scale-150"
                          onMouseEnter={() => setHoveredRadarStat(axis.label)}
                          onMouseLeave={() => setHoveredRadarStat(null)}
                        />
                      ))}

                      {/* Nhãn văn bản 6 trục */}
                      {radarAxes.axesLines.map((axis, i) => {
                        const angle = i * (Math.PI / 3) - Math.PI / 2
                        const textX = radarAxes.center + (radarAxes.radius + 30) * Math.cos(angle)
                        const textY = radarAxes.center + (radarAxes.radius + 30) * Math.sin(angle)
                        const isHovered = hoveredRadarStat === axis.label

                        return (
                          <text
                            key={i}
                            x={textX}
                            y={textY}
                            fill={isHovered ? "#ffffff" : axis.color}
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="central"
                          >
                            {axis.label.split(" ")[0]}
                          </text>
                        )
                      })}
                    </svg>

                    {/* Chú thích so sánh */}
                    <div className="flex items-center gap-4 text-[10px] font-mono mt-1 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block size-2 rounded-xs border border-cyan-400 border-dashed bg-cyan-500/20" />
                        <span>Chỉ Số Gốc</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block size-2 rounded-xs border border-emerald-400 bg-emerald-500/40" />
                        <span className="text-emerald-300 font-bold">Thực Chiến Đã Đồ</span>
                      </div>
                    </div>
                  </div>

                  {/* CỘT PHẢI: BẢNG SỐ LIỆU ĐO LƯỜNG TƯƠNG QUAN (6 cột) */}
                  <div className="md:col-span-6 space-y-2.5">
                    {/* Hỏa lực ATK */}
                    <div className="rounded border border-border/60 bg-black/30 p-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-amber-300">
                          <Sword className="size-3.5" />
                          <b>TẤN CÔNG (ATK)</b>
                        </span>
                        <b className="text-white text-sm">{total.attack}</b>
                      </div>
                      <div className="mt-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 transition-all duration-300"
                          style={{ width: `${Math.min(100, (total.attack / 380) * 100)}%` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                        <span>Gốc {base.attack}</span>
                        <span>Đồ +{breakdown.equipment.attack}</span>
                        <span>Phi công +{breakdown.pilot.attack}</span>
                      </div>
                    </div>

                    {/* Giáp DEF */}
                    <div className="rounded border border-border/60 bg-black/30 p-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-blue-300">
                          <Shield className="size-3.5" />
                          <b>PHÒNG NGỰ (DEF)</b>
                        </span>
                        <b className="text-white text-sm">{total.defense}</b>
                      </div>
                      <div className="mt-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 transition-all duration-300"
                          style={{ width: `${Math.min(100, (total.defense / 240) * 100)}%` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                        <span>Gốc {base.defense}</span>
                        <span>Đồ +{breakdown.equipment.defense}</span>
                        <span>Phi công +{breakdown.pilot.defense}</span>
                      </div>
                    </div>

                    {/* Tốc độ SPD */}
                    <div className="rounded border border-border/60 bg-black/30 p-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-cyan-300">
                          <Gauge className="size-3.5" />
                          <b>TỐC ĐỘ (SPD)</b>
                        </span>
                        <b className="text-white text-sm">{total.speed}</b>
                      </div>
                      <div className="mt-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 transition-all duration-300"
                          style={{ width: `${Math.min(100, (total.speed / 180) * 100)}%` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                        <span>Gốc {base.speed}</span>
                        <span>Đồ +{breakdown.equipment.speed}</span>
                        <span>Phi công +{breakdown.pilot.speed}</span>
                      </div>
                    </div>

                    {/* Máu HP & Năng lượng SP */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded border border-border/50 bg-black/30 p-2 text-xs font-mono">
                        <div className="text-[10px] text-rose-300 font-bold">MÁU (HP)</div>
                        <div className="font-mono text-base font-bold text-white mt-0.5">
                          {total.hp.toLocaleString("vi-VN")}
                        </div>
                        <div className="text-[9px] text-muted-foreground">
                          Gốc {base.hp} · Đồ +{breakdown.equipment.hp}
                        </div>
                      </div>

                      <div className="rounded border border-border/50 bg-black/30 p-2 text-xs font-mono">
                        <div className="text-[10px] text-purple-300 font-bold">NĂNG LƯỢNG (SP)</div>
                        <div className="font-mono text-base font-bold text-white mt-0.5">
                          {total.sp}
                        </div>
                        <div className="text-[9px] text-muted-foreground">
                          Gốc {base.sp} · Đồ +{breakdown.equipment.sp}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PHÂN BỔ ĐIỂM TIỀM NĂNG */}
              {activeTab === "breakdown" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-cyan-500/40 bg-cyan-950/20 p-2.5 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <Zap className="size-4 text-cyan-400" />
                      <span>
                        Điểm tiềm năng khả dụng: <b className="text-white text-sm">{pilotData.availablePoints}</b>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAutoAllocate}
                        disabled={pilotData.availablePoints <= 0}
                        className="rounded border border-cyan-400/60 bg-cyan-500/20 px-2.5 py-1 font-bold text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-[11px]"
                      >
                        Tự Động Phân Bổ
                      </button>
                      <button
                        onClick={handleResetPoints}
                        className="rounded border border-border/60 bg-black/40 px-2.5 py-1 text-muted-foreground hover:text-white hover:border-red-400/50 transition-colors cursor-pointer text-[11px]"
                      >
                        Cài Lại Điểm
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {ATTRIBUTE_ROWS.map((attr) => {
                      const Icon = attr.icon
                      const currentVal = pilotData.allocatedStats[attr.key] || 0

                      return (
                        <div
                          key={attr.key}
                          className="flex items-center justify-between rounded border border-border/60 bg-black/40 p-2.5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="size-8 rounded flex items-center justify-center shrink-0 border"
                              style={{ borderColor: `${attr.color}60`, color: attr.color }}
                            >
                              <Icon className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-display text-xs font-bold text-white flex items-center gap-1.5">
                                <span>{attr.label}</span>
                                <span className="font-mono text-[11px]" style={{ color: attr.color }}>
                                  (+{currentVal})
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-muted-foreground truncate">
                                {attr.gainText}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <button
                              onClick={() => handleAllocate(attr.key)}
                              disabled={pilotData.availablePoints <= 0}
                              className="size-7 rounded border border-cyan-400/60 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/40 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                              title={`Tăng 1 điểm ${attr.label}`}
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: MA TRẬN TRANG BỊ LOADOUT MATRIX */}
              {activeTab === "equipment" && (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {EQUIPMENT_SLOTS.map((slotMeta) => {
                      const equippedItemId = progression.equipped[slotMeta.slot]
                      const equippedItem = equippedItemId
                        ? progression.inventory.find((it) => it.id === equippedItemId)
                        : null
                      const enhanced = equippedItem ? getEnhancedItemStats(equippedItem) : null
                      const badgeMeta = equippedItem ? getEnhancementBadgeMeta(equippedItem.enhancementLevel) : null
                      const itemRating = equippedItem ? calculateItemRating(equippedItem) : 0
                      const theme = equippedItem ? (RARITY_THEME[equippedItem.rarity] || RARITY_THEME.common) : null

                      return (
                        <div
                          key={slotMeta.slot}
                          className={cn(
                            "rounded-sm border p-3 flex flex-col justify-between transition-all",
                            equippedItem
                              ? `${theme?.border} ${theme?.bg} shadow-md`
                              : "border-border/60 bg-black/40 border-dashed",
                          )}
                        >
                          <div>
                            {/* Tiêu đề Slot */}
                            <div className="flex items-center justify-between border-b border-border/40 pb-2">
                              <span className="font-display text-xs font-bold text-white flex items-center gap-1.5">
                                <slotMeta.icon className="size-3.5 text-cyan-400" />
                                <span>{slotMeta.name.split(" ")[0]}</span>
                              </span>
                              {equippedItem ? (
                                <span className={cn("text-[10px] font-mono font-bold uppercase", theme?.text)}>
                                  {equippedItem.rarity}
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  Trống
                                </span>
                              )}
                            </div>

                            {/* Thông tin vật phẩm */}
                            {equippedItem ? (
                              <div className="mt-2.5 space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                  {badgeMeta && (
                                    <span
                                      className={cn(
                                        "font-mono text-[9.5px] px-1.5 py-0.2 rounded border",
                                        badgeMeta.className,
                                      )}
                                    >
                                      {badgeMeta.text}
                                    </span>
                                  )}
                                  <span className="font-display text-xs font-bold text-white truncate">
                                    {equippedItem.name}
                                  </span>
                                </div>

                                {/* Chỉ số trang bị mang lại */}
                                <div className="space-y-0.5 font-mono text-[10.5px]">
                                  {enhanced?.attackBonus ? (
                                    <div className="text-amber-300">+{enhanced.attackBonus} ATK</div>
                                  ) : null}
                                  {enhanced?.defenseBonus ? (
                                    <div className="text-blue-300">+{enhanced.defenseBonus} DEF</div>
                                  ) : null}
                                  {enhanced?.speedBonus ? (
                                    <div className="text-cyan-300">+{enhanced.speedBonus} SPD</div>
                                  ) : null}
                                  {enhanced?.hpBonus ? (
                                    <div className="text-rose-300">+{enhanced.hpBonus} HP</div>
                                  ) : null}
                                  {enhanced?.spBonus ? (
                                    <div className="text-purple-300">+{enhanced.spBonus} SP</div>
                                  ) : null}
                                </div>

                                <div className="text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/30">
                                  Điểm Trang Bị: <b className="text-white">{itemRating} PR</b>
                                </div>
                              </div>
                            ) : (
                              <div className="my-5 text-center text-[11px] font-mono text-muted-foreground">
                                Chưa lắp trang bị vào ô này.
                              </div>
                            )}
                          </div>

                          {/* Nút hành động Thay / Tháo */}
                          <div className="mt-3 pt-2 border-t border-border/40 flex items-center gap-2">
                            <button
                              onClick={() => {
                                playClickSound()
                                setEquipModalSlot(slotMeta.slot)
                              }}
                              className="flex-1 rounded border border-cyan-400/60 bg-cyan-500/20 py-1 font-mono text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition-colors cursor-pointer text-center"
                            >
                              {equippedItem ? "Đổi Đồ" : "Lắp Đồ"}
                            </button>

                            {equippedItem && (
                              <button
                                onClick={() => handleUnequipFromSlot(slotMeta.slot)}
                                className="rounded border border-border/60 bg-black/40 px-2 py-1 font-mono text-xs text-rose-400 hover:bg-rose-950/40 hover:border-rose-400/50 transition-colors cursor-pointer"
                                title="Tháo trang bị"
                              >
                                Tháo
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dòng tóm tắt kỹ năng bị động (Passive) */}
          <div className="mt-4 pt-3 border-t border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs font-mono text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-bold text-cyan-300 uppercase">NỘI TẠI PHI CÔNG:</span>
              <span className="text-white">{pilotDef.passive.name}</span>
              <span className="text-[11px] text-muted-foreground">· {pilotDef.passive.shortDesc}</span>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <span>Tài Nguyên: <b className="text-amber-300">{progression.credits.toLocaleString("vi-VN")} Credits</b></span>
              <span>· <b className="text-purple-300">{progression.alloy ?? 25} Hợp Kim</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================
          MODAL CHỌN TRANG BỊ TỪ KHO (QUICK EQUIP MODAL)
          ================================================================== */}
      {equipModalSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-xl rounded-sm border border-cyan-500/60 bg-panel p-4 shadow-2xl font-mono text-xs"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-2">
                <Boxes className="size-4 text-cyan-400" />
                <span className="font-display font-bold text-sm text-white uppercase">
                  CHỌN TRANG BỊ CHO Ô {equipModalSlot.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setEquipModalSlot(null)}
                className="text-muted-foreground hover:text-white p-1"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Danh sách vật phẩm phù hợp trong kho */}
            <div className="mt-3 max-h-80 overflow-y-auto space-y-2 pr-1">
              {progression.inventory
                .filter((item) => item.slot === equipModalSlot)
                .map((item) => {
                  const enhanced = getEnhancedItemStats(item)
                  const isEquipped = progression.equipped[equipModalSlot] === item.id
                  const badgeMeta = getEnhancementBadgeMeta(item.enhancementLevel)
                  const rating = calculateItemRating(item)
                  const theme = RARITY_THEME[item.rarity] || RARITY_THEME.common

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center justify-between rounded border p-2.5 transition-all",
                        isEquipped
                          ? "border-cyan-400 bg-cyan-950/40"
                          : `${theme.border} ${theme.bg} hover:border-cyan-400/60`,
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {badgeMeta && (
                            <span
                              className={cn(
                                "font-mono text-[9px] px-1.5 py-0.2 rounded border",
                                badgeMeta.className,
                              )}
                            >
                              {badgeMeta.text}
                            </span>
                          )}
                          <span className="font-display font-bold text-white text-xs truncate">
                            {item.name}
                          </span>
                          <span className={cn("text-[9.5px] font-mono font-bold uppercase", theme.text)}>
                            ({item.rarity})
                          </span>
                        </div>

                        {/* Chỉ số cộng */}
                        <div className="mt-1 flex flex-wrap gap-2 text-[10.5px]">
                          {enhanced.attackBonus ? <span className="text-amber-300">+{enhanced.attackBonus} ATK</span> : null}
                          {enhanced.defenseBonus ? <span className="text-blue-300">+{enhanced.defenseBonus} DEF</span> : null}
                          {enhanced.speedBonus ? <span className="text-cyan-300">+{enhanced.speedBonus} SPD</span> : null}
                          {enhanced.hpBonus ? <span className="text-rose-300">+{enhanced.hpBonus} HP</span> : null}
                          {enhanced.spBonus ? <span className="text-purple-300">+{enhanced.spBonus} SP</span> : null}
                          <span className="text-muted-foreground">· {rating} PR</span>
                        </div>
                      </div>

                      <div className="ml-3 shrink-0">
                        {isEquipped ? (
                          <span className="rounded bg-cyan-500/20 px-2 py-1 text-cyan-300 font-bold border border-cyan-500/40">
                            Đang Lắp
                          </span>
                        ) : (
                          <button
                            onClick={() => handleEquipFromModal(item.id)}
                            className="rounded border border-cyan-400 bg-cyan-600 px-3 py-1 font-bold text-white hover:bg-cyan-500 transition-colors cursor-pointer"
                          >
                            Lắp Ngay
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}

              {progression.inventory.filter((it) => it.slot === equipModalSlot).length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  Kho đồ hiện không có trang bị nào thuộc ô {equipModalSlot.toUpperCase()}.
                  <br />
                  Hãy tham gia chiến trường hoặc ghé Chợ Quân Sự để nhận trang bị mới!
                </div>
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-border/40 text-right">
              <button
                onClick={() => setEquipModalSlot(null)}
                className="rounded border border-border/60 bg-black/40 px-3 py-1 text-muted-foreground hover:text-white"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

// Export cả PilotStatus alias để tương thích với bất kỳ import nào
export { PilotStatusDashboard as PilotStatus }
export default PilotStatusDashboard
