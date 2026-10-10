"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { STARFRONT_GEAR_DEFS } from "@/lib/game/data"
import {
  playClickSound,
  playLevelUpSound,
  playShieldSound,
} from "@/lib/game/audio"
import {
  calculateTotalGearStats,
  ENHANCEMENT_TABLE,
  getEnhancedItemStats,
  getExpRequiredForLevel,
  getItemDisplayName,
  calculateItemRating,
  calculateGearCombatRating,
  getAircraftSkillPoints,
  type EnhancementResult,
} from "@/lib/game/progression"
import { saveStarfrontProgression } from "@/lib/game/storage"
import type {
  CombatSkill,
  StarfrontGearId,
  StarfrontItem,
  StarfrontItemRarity,
  StarfrontItemSlot,
  StarfrontProgression,
} from "@/lib/game/types"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Boxes,
  Check,
  CheckCircle2,
  ChevronRight,
  Coins,
  Cpu,
  Eye,
  Filter,
  Flame,
  Gauge,
  Hammer,
  HelpCircle,
  Info,
  Layers,
  Lock,
  Recycle,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sword,
  Target,
  TrendingDown,
  TrendingUp,
  Unlock,
  Wind,
  X,
  Zap,
} from "lucide-react"
import { SalvageModal } from "./salvage-modal"

/* ==========================================================================
   CẤU HÌNH GIAO DIỆN & PHẨM CHẤT (THEME & RARITY CONFIG)
   ========================================================================== */

export const RARITY_CONFIG: Record<
  StarfrontItemRarity,
  { label: string; border: string; bg: string; text: string; glow: string; badgeBg: string }
> = {
  common: {
    label: "Thường",
    border: "border-slate-500/50",
    bg: "bg-slate-900/50",
    text: "text-slate-300",
    glow: "shadow-[0_0_8px_rgba(100,116,139,0.2)]",
    badgeBg: "bg-slate-800 text-slate-300 border-slate-600",
  },
  rare: {
    label: "Hiếm",
    border: "border-cyan-400/60",
    bg: "bg-cyan-950/40",
    text: "text-cyan-300",
    glow: "shadow-[0_0_12px_rgba(6,182,212,0.3)]",
    badgeBg: "bg-cyan-900/60 text-cyan-300 border-cyan-500/50",
  },
  epic: {
    label: "Sử Thi",
    border: "border-purple-400/60",
    bg: "bg-purple-950/40",
    text: "text-purple-300",
    glow: "shadow-[0_0_15px_rgba(168,85,247,0.35)]",
    badgeBg: "bg-purple-900/60 text-purple-300 border-purple-500/50",
  },
  legendary: {
    label: "Huyền Thoại",
    border: "border-amber-400/70",
    bg: "bg-amber-950/40",
    text: "text-amber-300",
    glow: "shadow-[0_0_18px_rgba(245,158,11,0.4)]",
    badgeBg: "bg-amber-900/60 text-amber-300 border-amber-500/60",
  },
}

export const SLOT_META: Record<
  StarfrontItemSlot,
  { label: string; shortLabel: string; icon: typeof Sword; desc: string; statKey: string }
> = {
  weapon: {
    label: "Vũ Khí Chính",
    shortLabel: "Vũ Khí",
    icon: Sword,
    desc: "Tập trung hỏa lực sát thương (ATK)",
    statKey: "ATK",
  },
  shield: {
    label: "Khiên Phòng Hộ",
    shortLabel: "Khiên",
    icon: Shield,
    desc: "Gia cố độ bền giáp và vỏ (DEF & HP)",
    statKey: "DEF",
  },
  engine: {
    label: "Động Cơ Đẩy",
    shortLabel: "Động Cơ",
    icon: Gauge,
    desc: "Tối ưu hóa tốc độ ra đòn (SPD & SP)",
    statKey: "SPD",
  },
}

export function getEnhancementBadgeMeta(level: number = 0) {
  if (level <= 0) return null
  if (level >= 10) {
    return {
      text: "+10 TỐI THƯỢNG",
      className:
        "bg-amber-500/30 text-amber-300 border-amber-400 font-black shadow-[0_0_14px_rgba(245,158,11,0.6)] animate-pulse",
    }
  }
  if (level >= 8) {
    return {
      text: `+${level}`,
      className:
        "bg-orange-500/25 text-orange-300 border-orange-400 font-bold shadow-[0_0_8px_rgba(249,115,22,0.4)]",
    }
  }
  if (level >= 5) {
    return {
      text: `+${level}`,
      className:
        "bg-purple-500/25 text-purple-300 border-purple-400 font-bold shadow-[0_0_8px_rgba(168,85,247,0.4)]",
    }
  }
  return {
    text: `+${level}`,
    className: "bg-cyan-500/20 text-cyan-300 border-cyan-400/60 font-bold",
  }
}

export type HangarTab = "loadout" | "skills" | "inventory" | "enhancement"
type InventorySortBy = "rarity" | "enhancement" | "rating" | "name"

export interface SkillSlotDetail {
  slotIndex: number // 1, 2, 3, 4, 5
  slotRole: string // "Đòn Cơ Bản", "Chủ Động 1", etc.
  category: "basic" | "active" | "ultimate"
  categoryLabel: string // "Đòn Đánh Cơ Bản", "Chủ Động", "Tuyệt Kỹ Tối Thượng"
  skill: CombatSkill
  isNative: boolean
  isEquipped: boolean
  slotLevel: number // 1..20
  slotMultiplier: number // 1.025 (+2.5%)
  compatibilityDesc: string
  allowedScope: "all-or-gear" | "gear-locked"
  icon: typeof Zap
  colorTheme: string
}

interface StarfrontHangarProps {
  progression: StarfrontProgression
  onEquipItem: (itemId: string, slot: StarfrontItemSlot) => void
  onUnequipSlot: (slot: StarfrontItemSlot) => void
  onResetSave: () => void
  onNavigateToCombat: () => void
  onSelectGear?: (gearId: StarfrontGearId) => void
  onEnhanceItem?: (itemId: string) => EnhancementResult
  onUpdateProgression?: (updated: StarfrontProgression) => void
}

export function StarfrontHangar({
  progression,
  onEquipItem,
  onUnequipSlot,
  onResetSave,
  onNavigateToCombat,
  onSelectGear,
  onEnhanceItem,
  onUpdateProgression,
}: StarfrontHangarProps) {
  // Tabs: Buồng Lái & Trang Bị, Mô-Đun Kỹ Năng (5 Ô), Kho Đồ & Tái Chế, Xưởng Cường Hóa
  const [activeTab, setActiveTab] = useState<HangarTab>("loadout")

  // Bộ lọc & sắp xếp kho đồ
  const [slotFilter, setSlotFilter] = useState<StarfrontItemSlot | "all">("all")
  const [sortBy, setSortBy] = useState<InventorySortBy>("rarity")
  const [searchQuery, setSearchQuery] = useState("")

  // Item đang chọn hoặc đang di chuột qua để xem trước so sánh
  const [hoveredItem, setHoveredItem] = useState<StarfrontItem | null>(null)
  const [inspectedItem, setInspectedItem] = useState<StarfrontItem | null>(null)

  // Dialogs
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [selectedSalvageItem, setSelectedSalvageItem] = useState<StarfrontItem | null>(null)

  // Xưởng Cường Hóa Modal
  const [showEnhanceModal, setShowEnhanceModal] = useState(false)
  const [selectedEnhanceItemId, setSelectedEnhanceItemId] = useState<string | null>(null)
  const [lastEnhanceResult, setLastEnhanceResult] = useState<EnhancementResult | null>(null)
  const [isEnhancing, setIsEnhancing] = useState(false)

  // Modal Chọn / Cấu hình Mô-đun Kỹ Năng (Skill Module Selection Modal)
  const [selectedSkillSlot, setSelectedSkillSlot] = useState<SkillSlotDetail | null>(null)

  // Lớp Gear hiện tại
  const activeGearId: StarfrontGearId = progression.activeGearId || "vanguard"
  const activeGearDef = STARFRONT_GEAR_DEFS[activeGearId] || STARFRONT_GEAR_DEFS.vanguard

  // Tiến trình cấp độ và tài nguyên
  const expRequired = getExpRequiredForLevel(progression.level)
  const expPercentage = Math.min(100, Math.round((progression.exp / expRequired) * 100))
  const alloyCount = progression.alloy ?? 25
  const skillPoints = getAircraftSkillPoints(progression.level)

  // Chỉ số thực tế của cơ giáp hiện tại
  const currentStats = useMemo(() => {
    return calculateTotalGearStats(
      activeGearId,
      progression.level,
      progression.inventory,
      progression.equipped,
    )
  }, [activeGearId, progression.level, progression.inventory, progression.equipped])

  // Lực chiến tổng thể (Combat Readiness Rating)
  const combatRating = useMemo(() => {
    return calculateGearCombatRating(currentStats.total)
  }, [currentStats.total])

  // Danh sách 5 Slot Kỹ Năng chi tiết cho Gear đang chọn
  const fiveSkillSlots: SkillSlotDetail[] = useMemo(() => {
    return buildDetailedSkillSlots(activeGearDef)
  }, [activeGearDef])

  // Chỉ số so sánh khi xem trước món đồ (hover hoặc inspected)
  const previewItem = hoveredItem || inspectedItem
  const previewEquipped = useMemo(() => {
    if (!previewItem) return null
    return { ...progression.equipped, [previewItem.slot]: previewItem.id }
  }, [previewItem, progression.equipped])

  const previewStats = useMemo(() => {
    if (!previewEquipped) return null
    return calculateTotalGearStats(
      activeGearId,
      progression.level,
      progression.inventory,
      previewEquipped,
    )
  }, [activeGearId, progression.level, progression.inventory, previewEquipped])

  // Lọc và sắp xếp kho đồ
  const filteredAndSortedInventory = useMemo(() => {
    let list = progression.inventory.filter((item) => {
      const matchSlot = slotFilter === "all" ? true : item.slot === slotFilter
      const matchSearch =
        searchQuery.trim() === ""
          ? true
          : item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.desc.toLowerCase().includes(searchQuery.toLowerCase())
      return matchSlot && matchSearch
    })

    const rarityOrder: Record<StarfrontItemRarity, number> = {
      legendary: 4,
      epic: 3,
      rare: 2,
      common: 1,
    }

    list = [...list].sort((a, b) => {
      if (sortBy === "rarity") {
        const diffRarity = rarityOrder[b.rarity] - rarityOrder[a.rarity]
        if (diffRarity !== 0) return diffRarity
        return (b.enhancementLevel || 0) - (a.enhancementLevel || 0)
      }
      if (sortBy === "enhancement") {
        const diffEnh = (b.enhancementLevel || 0) - (a.enhancementLevel || 0)
        if (diffEnh !== 0) return diffEnh
        return rarityOrder[b.rarity] - rarityOrder[a.rarity]
      }
      if (sortBy === "rating") {
        return calculateItemRating(b) - calculateItemRating(a)
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, "vi")
      }
      return 0
    })

    return list
  }, [progression.inventory, slotFilter, sortBy, searchQuery])

  // Đổi Gear
  const handleGearChange = (gearId: StarfrontGearId) => {
    playClickSound()
    if (onSelectGear) {
      onSelectGear(gearId)
    }
  }

  // Mở Cường Hóa
  const handleOpenEnhance = (itemId?: string) => {
    playClickSound()
    const targetId = itemId || progression.inventory[0]?.id || null
    setSelectedEnhanceItemId(targetId)
    setLastEnhanceResult(null)
    setShowEnhanceModal(true)
  }

  // Mở Modal Chọn Mô-Đun Kỹ Năng
  const handleOpenSkillSlot = (slot: SkillSlotDetail) => {
    playClickSound()
    setSelectedSkillSlot(slot)
  }

  // Thực thi Cường Hóa
  const handleExecuteEnhance = () => {
    if (!selectedEnhanceItemId || !onEnhanceItem || isEnhancing) return
    setIsEnhancing(true)
    playClickSound()

    setTimeout(() => {
      const res = onEnhanceItem(selectedEnhanceItemId)
      setLastEnhanceResult(res)
      setIsEnhancing(false)
    }, 250)
  }

  const selectedEnhanceItem =
    progression.inventory.find((it) => it.id === selectedEnhanceItemId) ||
    progression.inventory[0]

  return (
    <div className="flex flex-col gap-4 font-sans text-foreground">
      {/* ====================================================================
          1. THANH TỔNG HÀNH DINH HANGAR & TÀI NGUYÊN (COMMAND HEADER)
          ==================================================================== */}
      <section className="relative overflow-hidden rounded-sm border border-cyan-500/40 bg-gradient-to-r from-panel via-cyan-950/20 to-panel p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Thông tin phi cơ & Lực chiến */}
          <div className="flex items-center gap-3">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-sm border p-1 shadow-md"
              style={{
                borderColor: activeGearDef.color,
                backgroundColor: `${activeGearDef.color}15`,
              }}
            >
              <img
                src={activeGearDef.illustration || `/images/${activeGearId}.svg`}
                alt={activeGearDef.name}
                className="size-full object-contain filter drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-base font-bold uppercase tracking-wider text-white">
                  XƯỞNG TÁC CHIẾN {activeGearDef.name.toUpperCase()}
                </h1>
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-xs font-bold text-cyan-300 border border-cyan-500/40">
                  CẤP {progression.level}
                </span>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-xs font-bold text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Zap className="size-3 text-amber-400" /> Lực Chiến: {combatRating.toLocaleString("vi-VN")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeGearDef.role} · Điều phối trang bị, 5 ô mô-đun kỹ năng & phân bổ điểm phi cơ
              </p>
            </div>
          </div>

          {/* Thanh Tài Nguyên & Nút Tác Vụ Nhanh */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {/* Tín Dụng Credits */}
            <div className="flex items-center gap-1.5 rounded-sm border border-amber-500/40 bg-amber-950/30 px-3 py-1.5 text-amber-300 shadow-inner">
              <Coins className="size-4 text-amber-400" />
              <span className="text-muted-foreground">Credits:</span>
              <strong className="text-sm font-bold text-amber-200">
                {progression.credits.toLocaleString("vi-VN")}
              </strong>
            </div>

            {/* Hợp Kim Cường Hóa (Alloy) */}
            <div className="flex items-center gap-1.5 rounded-sm border border-purple-500/40 bg-purple-950/30 px-3 py-1.5 text-purple-300 shadow-inner">
              <Layers className="size-4 text-purple-400" />
              <span className="text-muted-foreground">Alloy:</span>
              <strong className="text-sm font-bold text-purple-200">{alloyCount}</strong>
            </div>

            {/* Điểm Kỹ Năng (Skill Points) */}
            <div className="flex items-center gap-1.5 rounded-sm border border-cyan-500/40 bg-cyan-950/30 px-3 py-1.5 text-cyan-300 shadow-inner">
              <Sparkles className="size-4 text-cyan-400" />
              <span className="text-muted-foreground">Điểm Phi Cơ:</span>
              <strong className="text-sm font-bold text-cyan-200">
                {skillPoints.available}/{skillPoints.total} SP
              </strong>
            </div>

            {/* Mở Xưởng Cường Hóa */}
            <Button
              onClick={() => handleOpenEnhance()}
              size="sm"
              className="gap-1.5 font-display text-xs uppercase tracking-wider bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.35)] cursor-pointer"
            >
              <Hammer className="size-3.5" />
              <span>Xưởng Cường Hóa</span>
            </Button>

            {/* Vào Đấu Trường */}
            <Button
              onClick={onNavigateToCombat}
              size="sm"
              className="gap-1.5 font-display text-xs uppercase tracking-wider bg-cyan-500 text-black hover:bg-cyan-400 font-bold shadow-[0_0_15px_rgba(6,182,212,0.35)] cursor-pointer"
            >
              <span>Vào Đấu Trường</span>
              <ArrowRight className="size-3.5" />
            </Button>

            {/* Cài lại tiến trình */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetDialog(true)}
              className="gap-1 text-xs text-red-400 hover:text-red-300 hover:border-red-500 cursor-pointer"
              title="Cài lại dữ liệu tiến trình"
            >
              <RotateCcw className="size-3" />
              <span>Cài lại</span>
            </Button>
          </div>
        </div>

        {/* Thanh EXP Phi Cơ */}
        <div className="mt-3 border-t border-border/50 pt-2.5">
          <div className="mb-1 flex justify-between font-mono text-xs">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Sparkles className="size-3.5 text-cyan-400" /> TIẾN TRÌNH KINH NGHIỆM PHI THUYỀN (EXP)
            </span>
            <span className="text-muted-foreground">
              <strong className="text-white">{progression.exp}</strong> / {expRequired} EXP ({expPercentage}%) · +2 Điểm Kỹ Năng / Cấp
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-xs bg-secondary/80">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-300 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
              style={{ width: `${expPercentage}%` }}
            />
          </div>
        </div>
      </section>

      {/* ====================================================================
          2. BỘ CHỌN LỚP CƠ GIÁP (GEAR SELECTION CARDS - 3 LỚP GEAR)
          ==================================================================== */}
      <section className="rounded-sm border border-cyan-500/30 bg-panel/80 p-3.5 shadow-md">
        <div className="mb-2.5 flex items-center justify-between border-b border-border/40 pb-2">
          <div className="flex items-center gap-2">
            <Cpu className="size-4 text-cyan-400" />
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
              CHỌN CƠ GIÁP XUẤT KÍCH (PHASE 3: 3 LỚP CHIẾN ĐẤU)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            Đang kích hoạt: <strong className="text-cyan-300">{activeGearDef.name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(["vanguard", "falcon", "aegis"] as StarfrontGearId[]).map((gId) => {
            const def = STARFRONT_GEAR_DEFS[gId]
            const isSelected = activeGearId === gId

            return (
              <button
                key={gId}
                onClick={() => handleGearChange(gId)}
                className={cn(
                  "group relative flex flex-col justify-between rounded-sm border p-3.5 text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-cyan-400 bg-cyan-950/60 shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                    : "border-border/60 bg-panel/50 hover:border-cyan-500/40 hover:bg-panel/90",
                )}
              >
                <div>
                  {/* Header thẻ cơ giáp: Tên & Hình minh họa thu nhỏ */}
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
                      <span className="text-[10px] text-cyan-300/90 font-mono block mt-0.5">
                        {def.role}
                      </span>
                    </div>

                    <div
                      className="size-11 shrink-0 rounded border p-0.5 bg-black/40"
                      style={{ borderColor: `${def.color}60` }}
                    >
                      <img
                        src={def.illustration || `/images/${gId}.svg`}
                        alt={def.name}
                        className="size-full object-contain"
                      />
                    </div>
                  </div>

                  <p className="mt-2 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {def.desc}
                  </p>

                  {/* Huy hiệu Kỹ Năng Nội Tại (Passive Skill) */}
                  <div className="mt-2.5 rounded bg-black/60 p-2 border border-border/50 text-[10px] font-mono">
                    <div className="flex items-center gap-1 font-bold text-amber-300">
                      <Sparkles className="size-3 text-amber-400" />
                      <span>{def.passive.name}</span>
                    </div>
                    <p className="text-[9.5px] text-muted-foreground mt-0.5 line-clamp-1">
                      {def.passive.shortDesc}
                    </p>
                  </div>
                </div>

                {/* Footer thẻ: Chỉ số nền & Nút kích hoạt */}
                <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[10px] font-mono">
                  <span className="text-muted-foreground">
                    Gốc: <strong className="text-slate-200">{def.baseStats.speed}</strong> SPD ·{" "}
                    <strong className="text-slate-200">{def.baseStats.attack}</strong> ATK
                  </span>
                  <span
                    className={cn(
                      "font-bold flex items-center gap-1",
                      isSelected ? "text-cyan-300" : "text-muted-foreground group-hover:text-cyan-300",
                    )}
                  >
                    {isSelected ? "✓ Đang kích hoạt" : "Chọn cơ giáp ➔"}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* ====================================================================
          3. THANH ĐIỀU HƯỚNG TAB PHÂN HỆ HANGAR (LOADOUT / SKILLS / INVENTORY / LAB)
          ==================================================================== */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex items-center gap-1 p-1 bg-black/40 rounded-sm border border-border/50">
          <button
            onClick={() => {
              playClickSound()
              setActiveTab("loadout")
            }}
            className={cn(
              "px-3.5 py-1.5 font-display text-xs uppercase tracking-wider rounded-xs transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "loadout"
                ? "bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                : "text-muted-foreground hover:text-white",
            )}
          >
            <Cpu className="size-3.5" />
            <span>Buồng Lái & Trang Bị</span>
          </button>

          <button
            onClick={() => {
              playClickSound()
              setActiveTab("skills")
            }}
            className={cn(
              "px-3.5 py-1.5 font-display text-xs uppercase tracking-wider rounded-xs transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "skills"
                ? "bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                : "text-muted-foreground hover:text-white",
            )}
          >
            <Flame className="size-3.5" />
            <span>Mô-Đun Kỹ Năng (5 Ô)</span>
          </button>

          <button
            onClick={() => {
              playClickSound()
              setActiveTab("inventory")
            }}
            className={cn(
              "px-3.5 py-1.5 font-display text-xs uppercase tracking-wider rounded-xs transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "inventory"
                ? "bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                : "text-muted-foreground hover:text-white",
            )}
          >
            <Boxes className="size-3.5" />
            <span>Kho Đồ & Tái Chế ({progression.inventory.length})</span>
          </button>

          <button
            onClick={() => {
              playClickSound()
              handleOpenEnhance()
            }}
            className="px-3.5 py-1.5 font-display text-xs uppercase tracking-wider rounded-xs text-purple-300 hover:text-purple-200 hover:bg-purple-950/40 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Hammer className="size-3.5 text-purple-400" />
            <span>Xưởng Cường Hóa (+1..+10)</span>
          </button>
        </div>

        {/* Trạng thái xem trước nếu có món đồ đang hover */}
        {previewItem && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-cyan-300 animate-pulse">
            <Eye className="size-3.5 text-cyan-400" />
            <span>Đang xem trước: {getItemDisplayName(previewItem)}</span>
          </div>
        )}
      </div>

      {/* ====================================================================
          TAB 1: BUỒNG LÁI, TRANG BỊ & KỸ NĂNG (LOADOUT VIEW)
          ==================================================================== */}
      {activeTab === "loadout" && (
        <div className="space-y-4">
          {/* Lưới chính: Cột trái (Tàu chiến & 3 Slot trang bị) vs Cột phải (Bảng chỉ số & Lực chiến) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* KHU VỰC TRUNG TÂM PHI CƠ & 3 Ô TRANG BỊ BAO QUANH (7 CỘT) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Tấm Blueprint Hologram Tàu Chiến Trung Tâm */}
              <div className="relative overflow-hidden rounded-sm border border-cyan-500/40 bg-gradient-to-b from-black/90 via-cyan-950/25 to-black/95 p-4 shadow-2xl flex flex-col items-center justify-center min-h-[320px]">
                {/* Lưới Radar & Scanning Line */}
                <div className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.4)_0%,transparent_75%)]" />

                {/* HUD Overlay Góc */}
                <div className="absolute left-3 top-3 font-mono text-[10px] text-cyan-400/80">
                  <span>HULL // {activeGearDef.id.toUpperCase()}_MK{progression.level}</span>
                  <div className="text-[9px] text-muted-foreground">STATUS: COMBAT_READY</div>
                </div>

                <div className="absolute right-3 top-3 font-mono text-right text-[10px] text-amber-300/90">
                  <div className="flex items-center gap-1 justify-end font-bold">
                    <Zap className="size-3 text-amber-400" />
                    <span>LỰC CHIẾN: {combatRating}</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground">RATING FORMULA PT</div>
                </div>

                {/* Hình Ảnh SVG Phi Thuyền Trung Tâm */}
                <div className="relative my-3 size-56 sm:size-64 flex items-center justify-center">
                  <img
                    src={activeGearDef.illustration || `/images/${activeGearId}.svg`}
                    alt={activeGearDef.name}
                    className="size-full object-contain filter drop-shadow-[0_0_25px_rgba(6,182,212,0.45)] transition-transform duration-300 hover:scale-105"
                  />
                </div>

                {/* Tên và Nhãn Cơ Giáp Đang Chọn */}
                <div className="text-center z-10">
                  <h3 className="font-display text-base font-bold tracking-wider text-white">
                    {activeGearDef.name.toUpperCase()}
                  </h3>
                  <p className="text-xs text-cyan-300/90 font-mono mt-0.5">
                    {activeGearDef.role} · Cấp Độ {progression.level}
                  </p>
                </div>

                {/* Nút Chuyển Nhanh Sang Kho Đồ & Ô Kỹ Năng */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <Button
                    size="xs"
                    onClick={() => setActiveTab("skills")}
                    variant="outline"
                    className="font-display text-[11px] gap-1 text-amber-300 border-amber-500/40 hover:bg-amber-950/60 cursor-pointer"
                  >
                    <Flame className="size-3" />
                    <span>Xem 5 Ô Mô-Đun Kỹ Năng</span>
                  </Button>

                  <Button
                    size="xs"
                    onClick={() => setActiveTab("inventory")}
                    variant="outline"
                    className="font-display text-[11px] gap-1 text-cyan-300 border-cyan-500/40 hover:bg-cyan-950/60 cursor-pointer"
                  >
                    <Boxes className="size-3" />
                    <span>Mở Kho Đồ ({progression.inventory.length} Món)</span>
                  </Button>
                </div>
              </div>

              {/* 3 Ô TRANG BỊ (WEAPON, SHIELD, ENGINE) SẮP XẾP QUANH TÀU */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {(["weapon", "shield", "engine"] as StarfrontItemSlot[]).map((slotKey) => {
                  const meta = SLOT_META[slotKey]
                  const SlotIcon = meta.icon
                  const equippedItemId = progression.equipped[slotKey]
                  const equippedItem = progression.inventory.find((it) => it.id === equippedItemId)
                  const enhBadge = equippedItem ? getEnhancementBadgeMeta(equippedItem.enhancementLevel) : null
                  const enhancedStats = equippedItem ? getEnhancedItemStats(equippedItem) : null
                  const itemRating = equippedItem ? calculateItemRating(equippedItem) : null

                  return (
                    <div
                      key={slotKey}
                      onMouseEnter={() => equippedItem && setHoveredItem(equippedItem)}
                      onMouseLeave={() => setHoveredItem(null)}
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

                          <div className="flex items-center gap-1">
                            {enhBadge && (
                              <span className={cn("rounded px-1.5 py-0.2 font-mono text-[9px] border", enhBadge.className)}>
                                {enhBadge.text}
                              </span>
                            )}
                            {equippedItem && (
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase border",
                                  RARITY_CONFIG[equippedItem.rarity].border,
                                  RARITY_CONFIG[equippedItem.rarity].text,
                                )}
                              >
                                {RARITY_CONFIG[equippedItem.rarity].label}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Chi tiết trang bị */}
                        {equippedItem ? (
                          <div className="mt-2.5">
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="font-display text-xs font-bold text-white group-hover:text-cyan-300">
                                {getItemDisplayName(equippedItem)}
                              </h4>
                              {itemRating && (
                                <span className="text-[10px] font-mono text-amber-300 font-bold shrink-0">
                                  {itemRating} R
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                              {equippedItem.desc}
                            </p>

                            {/* Chỉ số cộng thêm */}
                            <div className="mt-2 flex flex-wrap gap-1 font-mono text-[10px]">
                              {enhancedStats?.attackBonus !== 0 && (
                                <span className="rounded bg-red-950/60 px-1.5 py-0.5 text-red-300 border border-red-500/30">
                                  ATK +{enhancedStats?.attackBonus}
                                </span>
                              )}
                              {enhancedStats?.defenseBonus !== 0 && (
                                <span className="rounded bg-blue-950/60 px-1.5 py-0.5 text-blue-300 border border-blue-500/30">
                                  DEF {enhancedStats!.defenseBonus > 0 ? `+${enhancedStats!.defenseBonus}` : enhancedStats!.defenseBonus}
                                </span>
                              )}
                              {enhancedStats?.speedBonus !== 0 && (
                                <span className="rounded bg-emerald-950/60 px-1.5 py-0.5 text-emerald-300 border border-emerald-500/30">
                                  SPD +{enhancedStats?.speedBonus}
                                </span>
                              )}
                              {enhancedStats?.hpBonus !== 0 && (
                                <span className="rounded bg-teal-950/60 px-1.5 py-0.5 text-teal-300 border border-teal-500/30">
                                  HP +{enhancedStats?.hpBonus}
                                </span>
                              )}
                              {enhancedStats?.spBonus !== 0 && (
                                <span className="rounded bg-cyan-950/60 px-1.5 py-0.5 text-cyan-300 border border-cyan-500/30">
                                  SP +{enhancedStats?.spBonus}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setSlotFilter(slotKey)
                              setActiveTab("inventory")
                            }}
                            className="my-5 flex flex-col items-center justify-center text-center text-muted-foreground cursor-pointer hover:text-cyan-300"
                          >
                            <SlotIcon className="size-7 opacity-40 mb-1" />
                            <span className="text-xs font-display font-bold">CHƯA TRANG BỊ</span>
                            <span className="text-[10px] mt-0.5">Bấm để chọn từ kho đồ</span>
                          </div>
                        )}
                      </div>

                      {/* Hành động trên Slot */}
                      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                        {equippedItem ? (
                          <>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => onUnequipSlot(slotKey)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-950/40 text-[10px] font-mono cursor-pointer"
                            >
                              <X className="size-3 mr-0.5" /> Tháo đồ
                            </Button>

                            <Button
                              size="xs"
                              onClick={() => handleOpenEnhance(equippedItem.id)}
                              className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-display gap-1 cursor-pointer"
                            >
                              <Hammer className="size-3" /> Cường Hóa ⚡
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="xs"
                            onClick={() => {
                              setSlotFilter(slotKey)
                              setActiveTab("inventory")
                            }}
                            variant="outline"
                            className="w-full text-[10px] font-mono text-cyan-300 border-cyan-500/40 hover:bg-cyan-950/60 cursor-pointer"
                          >
                            + Lắp {meta.shortLabel}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* BẢNG CHỈ SỐ THỰC TẾ & SO SÁNH PREVIEW (5 CỘT) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="rounded-sm border border-cyan-500/40 bg-panel/90 p-4 shadow-xl">
                <div className="mb-3 border-b border-border/60 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gauge className="size-4 text-cyan-400" />
                      <h3 className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                        CHỈ SỐ THỰC TẾ // BẢNG LỰC CHIẾN
                      </h3>
                    </div>
                    <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-[10px] text-cyan-300 border border-cyan-500/40 font-bold">
                      CẤP {progression.level}
                    </span>
                  </div>

                  <p className="text-[10px] text-muted-foreground mt-1">
                    {previewItem
                      ? `⚡ So sánh khi thay: ${getItemDisplayName(previewItem)}`
                      : "Tổng hợp chỉ số cơ sở + tăng trưởng cấp độ + trang bị đã cường hóa"}
                  </p>
                </div>

                {/* Các chỉ số chính */}
                <div className="space-y-2.5 font-mono text-xs">
                  {/* Tấn Công (ATK) */}
                  <StatRow
                    label="TẤN CÔNG (ATK)"
                    current={currentStats.total.attack}
                    base={currentStats.base.attack}
                    bonus={currentStats.bonuses.attack}
                    preview={previewStats?.total.attack}
                    color="text-amber-400"
                  />

                  {/* Phòng Thủ (DEF) */}
                  <StatRow
                    label="PHÒNG THỦ (DEF)"
                    current={currentStats.total.defense}
                    base={currentStats.base.defense}
                    bonus={currentStats.bonuses.defense}
                    preview={previewStats?.total.defense}
                    color="text-blue-400"
                  />

                  {/* Tốc Độ (SPD) */}
                  <StatRow
                    label="TỐC ĐỘ (SPD)"
                    current={currentStats.total.speed}
                    base={currentStats.base.speed}
                    bonus={currentStats.bonuses.speed}
                    preview={previewStats?.total.speed}
                    color="text-emerald-400"
                  />

                  {/* Độ Bền Vỏ (HP) */}
                  <StatRow
                    label="ĐỘ BỀN VỎ (HP)"
                    current={currentStats.total.hp}
                    base={currentStats.base.hp}
                    bonus={currentStats.bonuses.hp}
                    preview={previewStats?.total.hp}
                    color="text-teal-400"
                  />

                  {/* Lõi Năng Lượng (SP) */}
                  <StatRow
                    label="LÕI NĂNG LƯỢNG (SP)"
                    current={currentStats.total.sp}
                    base={currentStats.base.sp}
                    bonus={currentStats.bonuses.sp}
                    preview={previewStats?.total.sp}
                    color="text-cyan-400"
                  />
                </div>

                {/* Chỉ số phụ bẩm sinh & Đặc tính lớp */}
                <div className="mt-4 border-t border-border/50 pt-3">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block mb-2">
                    Chỉ số chiến thuật bổ trợ:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="rounded bg-black/40 p-2 border border-border/40">
                      <span className="text-muted-foreground block text-[9.5px]">TỈ LỆ BẠO KÍCH</span>
                      <strong className="text-white font-bold">
                        {activeGearId === "falcon" ? "18%" : "10%"} Base
                      </strong>
                    </div>

                    <div className="rounded bg-black/40 p-2 border border-border/40">
                      <span className="text-muted-foreground block text-[9.5px]">NÉ TRÁNH BẨM SINH</span>
                      <strong className="text-white font-bold">
                        {activeGearId === "falcon" ? "20% (+15% Passive)" : "5% Base"}
                      </strong>
                    </div>

                    <div className="rounded bg-black/40 p-2 border border-border/40">
                      <span className="text-muted-foreground block text-[9.5px]">HỒI PHỤC NĂNG LƯỢNG</span>
                      <strong className="text-cyan-300 font-bold">
                        {activeGearId === "vanguard" ? "+10 SP / Lượt" : "+5 SP / Lượt"}
                      </strong>
                    </div>

                    <div className="rounded bg-black/40 p-2 border border-border/40">
                      <span className="text-muted-foreground block text-[9.5px]">PHẢN ĐÒN / KHÁNG</span>
                      <strong className="text-amber-300 font-bold">
                        {activeGearId === "aegis" ? "20% Phản · 50% Kháng" : "Tiêu chuẩn"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Nội tại Gear */}
                <div className="mt-4 rounded border border-cyan-500/40 bg-cyan-950/30 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-amber-400" />
                      <h4 className="font-display text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                        NỘI TẠI: {activeGearDef.passive.name}
                      </h4>
                    </div>
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-mono text-amber-300 border border-amber-500/40">
                      TỰ ĐỘNG
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-200">
                    {activeGearDef.passive.desc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================================
              4. KHUNG TÓM TẮT 5 Ô KỸ NĂNG TRONG LOADOUT
              ==================================================================== */}
          <div className="rounded-sm border border-cyan-500/40 bg-panel/80 p-4 shadow-xl">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="size-4 text-cyan-400" />
                <div>
                  <h3 className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                    HỆ THỐNG MÔ-ĐUN KỸ NĂNG & 5 SLOTS CHIẾN ĐẤU // {activeGearDef.name.toUpperCase()}
                  </h3>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Bấm vào từng ô để mở bảng cấu hình mô-đun hoặc kiểm tra tính tương thích
                  </span>
                </div>
              </div>

              {/* Thông tin Điểm Kỹ Năng SP Phi Cơ */}
              <div className="flex items-center gap-2 rounded bg-black/50 px-3 py-1.5 border border-cyan-500/40 font-mono text-xs">
                <Sparkles className="size-3.5 text-cyan-400" />
                <span className="text-muted-foreground">Điểm Phi Cơ:</span>
                <strong className="text-cyan-300 font-bold">{skillPoints.available} SP Khả Dụng</strong>
              </div>
            </div>

            {/* Lưới 5 Slot Kỹ Năng dạng Thẻ Tương Tác */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {fiveSkillSlots.map((slotInfo) => (
                <SkillSlotCard
                  key={slotInfo.slotIndex}
                  slotInfo={slotInfo}
                  onSelectSlot={() => handleOpenSkillSlot(slotInfo)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: TRUNG TÂM 5 Ô MÔ-ĐUN KỸ NĂNG CHUYÊN SÂU (DEDICATED SKILLS TAB)
          ==================================================================== */}
      {activeTab === "skills" && (
        <div className="space-y-4">
          <div className="rounded-sm border border-cyan-500/40 bg-panel/90 p-4 shadow-xl">
            {/* Header Tab Kỹ Năng */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded bg-cyan-950/80 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                  <Flame className="size-5 text-cyan-300" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-cyan-200">
                    TRUNG TÂM QUẢN LÝ MÔ-ĐUN KỸ NĂNG // 5-SLOT DECK SYSTEM
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Độc lập giữa Cấp Ô phi cơ (Slot-Bound, Max Lv.20) và Mô-đun (Module Rarity/Level) · Quy chuẩn tương thích Phase 5.7
                  </p>
                </div>
              </div>

              {/* Thẻ Điểm SP Phi Thuyền */}
              <div className="flex items-center gap-3 rounded bg-black/60 px-3.5 py-2 border border-cyan-500/40 font-mono text-xs">
                <Sparkles className="size-4 text-cyan-400" />
                <div>
                  <div className="text-muted-foreground text-[10px]">ĐIỂM KỸ NĂNG PHI CƠ</div>
                  <div className="text-sm font-bold text-cyan-300">
                    {skillPoints.available} / {skillPoints.total} SP Khả Dụng
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground border-l border-border/50 pl-2">
                  (+2 SP / cấp)
                </span>
              </div>
            </div>

            {/* Bảng Quy Tắc Tương Thích 5 Vị Trí Slot */}
            <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3 text-xs font-mono">
              <div className="rounded bg-black/40 p-2.5 border border-cyan-500/30">
                <div className="flex items-center gap-1.5 font-bold text-cyan-300 mb-1">
                  <Zap className="size-3.5 text-cyan-400" />
                  <span>SLOT 1: ĐÒN CƠ BẢN</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  0 SP tiêu hao · Hồi nạp +15 SP năng lượng lõi khi đánh trúng · Cho phép All-Gear hoặc Mô-đun của đúng Gear.
                </p>
              </div>

              <div className="rounded bg-black/40 p-2.5 border border-purple-500/30">
                <div className="flex items-center gap-1.5 font-bold text-purple-300 mb-1">
                  <Sword className="size-3.5 text-purple-400" />
                  <span>SLOT 2–4: CHỦ ĐỘNG (DECK)</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  20–45 SP · Tự do gắn kỹ năng All-Gear hoặc độc quyền Gear (Tối đa 2/3 slot dùng All-Gear, ít nhất 1 slot độc quyền).
                </p>
              </div>

              <div className="rounded bg-black/40 p-2.5 border border-amber-500/30">
                <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
                  <Sparkles className="size-3.5 text-amber-400" />
                  <span>SLOT 5: TUYỆT KỸ TỐI THƯỢNG</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  50–70 SP · Khóa cứng 100% chiêu thức Ultimate của đúng Gear đang xuất kích ({activeGearDef.name}).
                </p>
              </div>
            </div>

            {/* Lưới 5 Slot Kỹ Năng Đầy Đủ */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
              {fiveSkillSlots.map((slotInfo) => (
                <SkillSlotCard
                  key={slotInfo.slotIndex}
                  slotInfo={slotInfo}
                  onSelectSlot={() => handleOpenSkillSlot(slotInfo)}
                  detailedView={true}
                />
              ))}
            </div>

            {/* Lưu Ý Hệ Thống & Trạng Thái Triển Khai */}
            <div className="mt-4 rounded border border-border/60 bg-black/50 p-3 text-xs font-mono text-muted-foreground flex items-start gap-2.5">
              <Info className="size-4 shrink-0 text-cyan-400 mt-0.5" />
              <div>
                <strong className="text-cyan-300 block mb-0.5">Trạng Thái Kiến Trúc Hệ Thống:</strong>
                Giao diện 5 Slot đã sẵn sàng tích hợp với hệ thống vật phẩm Mô-Đun Kỹ Năng độc lập. Hiện tại, buồng lái tự động nạp bộ 5 kỹ năng chiến thuật bẩm sinh chuẩn của {activeGearDef.name}. Người chơi có thể bấm vào từng ô để xem thông số, yêu cầu tương thích và cấu hình kỹ năng.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 3: KHO ĐỒ, TÌM KIẾM, SẮP XẾP & BẢNG SO SÁNH (INVENTORY VIEW)
          ==================================================================== */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          <div className="rounded-sm border border-border/70 bg-panel/90 p-4 shadow-xl">
            {/* Thanh Công Cụ Lọc, Tìm Kiếm & Sắp Xếp */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
              {/* Tiêu đề & Đếm */}
              <div className="flex items-center gap-2">
                <Boxes className="size-4 text-cyan-400" />
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                  KHO ĐỒ TRANG BỊ HIỆN CÓ ({filteredAndSortedInventory.length}/{progression.inventory.length} MÓN)
                </h3>
              </div>

              {/* Tìm kiếm & Bộ lọc & Sắp xếp */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Ô tìm kiếm */}
                <div className="relative">
                  <Search className="absolute left-2 top-2 size-3 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên..."
                    className="h-7 w-36 sm:w-44 rounded-xs border border-border/60 bg-black/50 pl-7 pr-2 font-mono text-xs text-white placeholder:text-muted-foreground focus:border-cyan-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-1.5 top-1.5 text-muted-foreground hover:text-white cursor-pointer"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Bộ lọc slot */}
                <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded border border-border/50">
                  {(["all", "weapon", "shield", "engine"] as const).map((filter) => {
                    const active = slotFilter === filter
                    const label =
                      filter === "all"
                        ? "Tất cả"
                        : filter === "weapon"
                          ? "Vũ khí"
                          : filter === "shield"
                            ? "Khiên"
                            : "Động cơ"
                    return (
                      <button
                        key={filter}
                        onClick={() => {
                          playClickSound()
                          setSlotFilter(filter)
                        }}
                        className={cn(
                          "rounded-xs px-2.5 py-1 font-display text-[11px] transition-all cursor-pointer",
                          active
                            ? "bg-cyan-500 text-black font-bold shadow-sm"
                            : "text-muted-foreground hover:text-white",
                        )}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>

                {/* Sắp xếp */}
                <div className="flex items-center gap-1 font-mono text-xs">
                  <ArrowUpDown className="size-3 text-muted-foreground" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as InventorySortBy)}
                    className="h-7 rounded-xs border border-border/60 bg-black/50 px-2 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none cursor-pointer"
                  >
                    <option value="rarity">Độ hiếm (Cao ➔ Thấp)</option>
                    <option value="enhancement">Cấp cường hóa (+10 ➔ +0)</option>
                    <option value="rating">Lực chiến (Rating)</option>
                    <option value="name">Tên A-Z</option>
                  </select>
                </div>
              </div>
            </div>

            {/* BẢNG SO SÁNH TRỰC QUAN SIDE-BY-SIDE NẾU ĐANG CHỌN 1 MÓN ĐỒ */}
            {inspectedItem && (
              <div className="mb-4 rounded border border-cyan-400/80 bg-gradient-to-r from-cyan-950/40 via-panel to-cyan-950/40 p-3.5 shadow-xl animate-in fade-in">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Eye className="size-4 text-cyan-400" />
                    <span className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                      BẢNG SO SÁNH TRỰC QUAN: {getItemDisplayName(inspectedItem)} vs ĐỒ HIỆN TẠI
                    </span>
                  </div>
                  <button
                    onClick={() => setInspectedItem(null)}
                    className="text-muted-foreground hover:text-white text-xs font-mono cursor-pointer"
                  >
                    Đóng bảng [×]
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {/* Món đồ đang soi */}
                  <ItemComparisonCard
                    title="MÓN ĐANG CHỌN TỪ KHO"
                    item={inspectedItem}
                    isCurrentlyEquipped={progression.equipped[inspectedItem.slot] === inspectedItem.id}
                  />

                  {/* Món đồ hiện đang gắn trong slot tương ứng */}
                  {(() => {
                    const currentEquippedId = progression.equipped[inspectedItem.slot]
                    const currentEquippedItem = progression.inventory.find(
                      (it) => it.id === currentEquippedId,
                    )

                    return (
                      <ItemComparisonCard
                        title={`ĐỒ ĐANG LẮP TRONG Ô [${SLOT_META[inspectedItem.slot].label.toUpperCase()}]`}
                        item={currentEquippedItem || null}
                        isCurrentlyEquipped={true}
                      />
                    )
                  })()}
                </div>
              </div>
            )}

            {/* LƯỚI DANH SÁCH MÓN ĐỒ TRONG KHO */}
            {filteredAndSortedInventory.length === 0 ? (
              <div className="my-10 flex flex-col items-center justify-center text-center text-muted-foreground">
                <Boxes className="size-10 opacity-30 mb-2" />
                <span className="text-sm font-display">KHÔNG TÌM THẤY VẬT PHẨM</span>
                <span className="text-xs mt-1">Thử đổi từ khóa tìm kiếm hoặc chỉnh lại bộ lọc vị trí slot</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAndSortedInventory.map((item) => {
                  const isEquipped = progression.equipped[item.slot] === item.id
                  const rarity = RARITY_CONFIG[item.rarity]
                  const enhBadge = getEnhancementBadgeMeta(item.enhancementLevel)
                  const enhancedStats = getEnhancedItemStats(item)
                  const itemRating = calculateItemRating(item)
                  const isInspected = inspectedItem?.id === item.id

                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setHoveredItem(item)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={cn(
                        "group relative flex flex-col justify-between rounded-sm border p-3 transition-all",
                        isInspected
                          ? "border-cyan-400 bg-cyan-950/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400"
                          : isEquipped
                            ? "border-cyan-400/80 bg-cyan-950/30 shadow-[0_0_10px_rgba(34,211,238,0.15)]"
                            : `${rarity.border} ${rarity.bg} hover:border-cyan-300/80 hover:bg-black/60`,
                      )}
                    >
                      <div>
                        {/* Header Item Card */}
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-display text-xs font-bold text-white group-hover:text-cyan-300 flex items-center gap-1">
                            {getItemDisplayName(item)}
                          </span>

                          <div className="flex items-center gap-1">
                            {/* Rating badge */}
                            <span className="rounded px-1.5 py-0.2 font-mono text-[9px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40">
                              {itemRating} R
                            </span>

                            {item.level && (
                              <span className="rounded px-1.5 py-0.2 font-mono text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-600">
                                Lv.{item.level}
                              </span>
                            )}

                            {enhBadge && (
                              <span className={cn("rounded px-1.5 py-0.2 font-mono text-[9px] border", enhBadge.className)}>
                                {enhBadge.text}
                              </span>
                            )}

                            <span
                              className={cn(
                                "rounded px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase border",
                                rarity.border,
                                rarity.text,
                              )}
                            >
                              {rarity.label}
                            </span>
                          </div>
                        </div>

                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                          {item.desc}
                        </p>

                        {/* Chỉ số cộng đã tính cấp cường hóa */}
                        <div className="mt-2.5 flex flex-wrap gap-1 font-mono text-[10px]">
                          {enhancedStats.attackBonus !== 0 && (
                            <span className="rounded bg-red-950/60 px-1.5 py-0.5 text-red-300 border border-red-500/30">
                              ATK +{enhancedStats.attackBonus}
                            </span>
                          )}
                          {enhancedStats.defenseBonus !== 0 && (
                            <span className="rounded bg-blue-950/60 px-1.5 py-0.5 text-blue-300 border border-blue-500/30">
                              DEF {enhancedStats.defenseBonus > 0 ? `+${enhancedStats.defenseBonus}` : enhancedStats.defenseBonus}
                            </span>
                          )}
                          {enhancedStats.speedBonus !== 0 && (
                            <span className="rounded bg-emerald-950/60 px-1.5 py-0.5 text-emerald-300 border border-emerald-500/30">
                              SPD +{enhancedStats.speedBonus}
                            </span>
                          )}
                          {enhancedStats.hpBonus !== 0 && (
                            <span className="rounded bg-teal-950/60 px-1.5 py-0.5 text-teal-300 border border-teal-500/30">
                              HP +{enhancedStats.hpBonus}
                            </span>
                          )}
                          {enhancedStats.spBonus !== 0 && (
                            <span className="rounded bg-cyan-950/60 px-1.5 py-0.5 text-cyan-300 border border-cyan-500/30">
                              SP +{enhancedStats.spBonus}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer: Thao tác & Rã đồ & Trang bị */}
                      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-muted-foreground uppercase">
                            {SLOT_META[item.slot].shortLabel}
                          </span>

                          <button
                            onClick={() => {
                              playClickSound()
                              setInspectedItem(isInspected ? null : item)
                            }}
                            className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Eye className="size-2.5" />
                            <span>{isInspected ? "Ẩn" : "So sánh"}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            size="xs"
                            onClick={() => handleOpenEnhance(item.id)}
                            className="gap-1 font-display text-[10px] uppercase bg-purple-600/80 hover:bg-purple-500 text-white cursor-pointer"
                          >
                            <Hammer className="size-3" />
                            <span>Cường Hóa</span>
                          </Button>

                          {!isEquipped && (
                            <Button
                              size="xs"
                              onClick={() => setSelectedSalvageItem(item)}
                              className="gap-1 font-display text-[10px] uppercase bg-emerald-700/80 hover:bg-emerald-600 text-white cursor-pointer"
                              title="Tái chế rã đồ thu hồi Hợp Kim (Alloy) và Credits"
                            >
                              <Recycle className="size-3" />
                              <span>Rã Đồ</span>
                            </Button>
                          )}

                          {isEquipped ? (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => onUnequipSlot(item.slot)}
                              className="gap-1 font-display text-[10px] uppercase text-red-400 border-red-500/50 hover:bg-red-950/40 cursor-pointer"
                            >
                              <X className="size-3" />
                              <span>Tháo đồ</span>
                            </Button>
                          ) : (
                            <Button
                              size="xs"
                              onClick={() => onEquipItem(item.id, item.slot)}
                              className="gap-1 font-display text-[10px] uppercase bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                            >
                              <span>Trang bị</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL CHỌN & CẤU HÌNH MÔ-ĐUN KỸ NĂNG (SKILL MODULE SELECTION MODAL)
          ==================================================================== */}
      {selectedSkillSlot && (
        <SkillModuleSelectModal
          slot={selectedSkillSlot}
          activeGearDef={activeGearDef}
          progression={progression}
          onClose={() => setSelectedSkillSlot(null)}
        />
      )}

      {/* ====================================================================
          MODAL XƯỞNG CƯỜNG HÓA TRANG BỊ (+1 ĐẾN +10)
          ==================================================================== */}
      {showEnhanceModal && selectedEnhanceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-2xl w-full rounded-sm border border-purple-500/60 bg-panel p-5 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded bg-purple-950/80 border border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                  <Hammer className="size-5 text-purple-300" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-purple-200">
                    XƯỞNG CƯỜNG HÓA TRANG BỊ // ENHANCEMENT LAB (+1 ĐẾN +10)
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Nâng cấp linh kiện gia tăng sức mạnh vượt bậc · Cơ chế bảo vệ toàn diện 100% không lo vỡ đồ
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowEnhanceModal(false)}
                className="size-7 flex items-center justify-center rounded border border-border/60 text-muted-foreground hover:text-white hover:border-purple-400 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Thanh Chọn Nhanh Trang Bị Trong Kho */}
            <div className="my-3 border-b border-border/40 pb-3">
              <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1.5">
                Chọn trang bị trong kho để cường hóa:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {progression.inventory.map((it) => {
                  const isChosen = it.id === selectedEnhanceItem.id
                  const badge = getEnhancementBadgeMeta(it.enhancementLevel)
                  return (
                    <button
                      key={it.id}
                      onClick={() => {
                        playClickSound()
                        setSelectedEnhanceItemId(it.id)
                        setLastEnhanceResult(null)
                      }}
                      className={cn(
                        "flex items-center gap-1.5 rounded-xs border px-2 py-1 text-xs font-mono transition-all cursor-pointer",
                        isChosen
                          ? "border-purple-400 bg-purple-950/80 text-purple-200 font-bold shadow-sm"
                          : "border-border/60 text-muted-foreground hover:text-white hover:bg-black/40",
                      )}
                    >
                      <span>{it.name}</span>
                      {badge && (
                        <span className="text-[9px] font-bold text-amber-300">
                          [{badge.text}]
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Chi Tiết Món Đồ Đang Được Cường Hóa */}
            {(() => {
              const currentLvl = Math.max(0, Math.min(10, selectedEnhanceItem.enhancementLevel || 0))
              const isMax = currentLvl >= 10
              const targetLevel = currentLvl + 1
              const config = ENHANCEMENT_TABLE[targetLevel]
              const currentEnhanced = getEnhancedItemStats(selectedEnhanceItem)

              const nextMockItem: StarfrontItem = {
                ...selectedEnhanceItem,
                enhancementLevel: targetLevel,
              }
              const nextEnhanced = getEnhancedItemStats(nextMockItem)

              const hasEnoughCredits = config ? progression.credits >= config.creditsCost : false
              const hasEnoughAlloy = config ? alloyCount >= config.alloyCost : false
              const canEnhance = !isMax && hasEnoughCredits && hasEnoughAlloy && !isEnhancing

              return (
                <div className="space-y-4">
                  {/* Khung Thông Tin Cấp Độ Hiện Tại vs Cấp Kế Tiếp */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Cột Trái: Cấp Hiện Tại */}
                    <div className="rounded border border-border/60 bg-black/40 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">
                          CẤP HIỆN TẠI
                        </span>
                        <span className="font-mono text-xs font-bold text-purple-300">
                          {currentLvl > 0 ? `+${currentLvl}` : "Gốc (+0)"}
                        </span>
                      </div>
                      <h4 className="mt-1 font-display text-sm font-bold text-white">
                        {getItemDisplayName(selectedEnhanceItem)}
                      </h4>
                      <div className="mt-2 space-y-1 font-mono text-xs">
                        {currentEnhanced.attackBonus !== 0 && (
                          <div className="text-red-300">ATK +{currentEnhanced.attackBonus}</div>
                        )}
                        {currentEnhanced.defenseBonus !== 0 && (
                          <div className="text-blue-300">DEF +{currentEnhanced.defenseBonus}</div>
                        )}
                        {currentEnhanced.speedBonus !== 0 && (
                          <div className="text-emerald-300">SPD +{currentEnhanced.speedBonus}</div>
                        )}
                        {currentEnhanced.hpBonus !== 0 && (
                          <div className="text-teal-300">HP +{currentEnhanced.hpBonus}</div>
                        )}
                        {currentEnhanced.spBonus !== 0 && (
                          <div className="text-cyan-300">SP +{currentEnhanced.spBonus}</div>
                        )}
                      </div>
                    </div>

                    {/* Cột Phải: Cấp Tiếp Theo */}
                    <div className="rounded border border-purple-400/60 bg-purple-950/30 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-purple-300 uppercase font-bold">
                          {isMax ? "ĐÃ ĐẠT TỐI ĐA" : `MỤC TIÊU: +${targetLevel}`}
                        </span>
                        {!isMax && config && (
                          <span className="font-mono text-xs font-bold text-emerald-400">
                            Tỉ lệ: {Math.round(config.successRate * 100)}%
                          </span>
                        )}
                      </div>
                      <h4 className="mt-1 font-display text-sm font-bold text-purple-200">
                        {isMax ? "CẤP TỐI THƯỢNG (+10)" : `[+${targetLevel}] ${selectedEnhanceItem.name}`}
                      </h4>
                      {!isMax ? (
                        <div className="mt-2 space-y-1 font-mono text-xs">
                          {nextEnhanced.attackBonus !== 0 && (
                            <div className="text-red-300 font-bold flex items-center justify-between">
                              <span>ATK:</span>
                              <span>+{nextEnhanced.attackBonus} (+{nextEnhanced.attackBonus - currentEnhanced.attackBonus})</span>
                            </div>
                          )}
                          {nextEnhanced.defenseBonus !== 0 && (
                            <div className="text-blue-300 font-bold flex items-center justify-between">
                              <span>DEF:</span>
                              <span>+{nextEnhanced.defenseBonus} (+{nextEnhanced.defenseBonus - currentEnhanced.defenseBonus})</span>
                            </div>
                          )}
                          {nextEnhanced.speedBonus !== 0 && (
                            <div className="text-emerald-300 font-bold flex items-center justify-between">
                              <span>SPD:</span>
                              <span>+{nextEnhanced.speedBonus} (+{nextEnhanced.speedBonus - currentEnhanced.speedBonus})</span>
                            </div>
                          )}
                          {nextEnhanced.hpBonus !== 0 && (
                            <div className="text-teal-300 font-bold flex items-center justify-between">
                              <span>HP:</span>
                              <span>+{nextEnhanced.hpBonus} (+{nextEnhanced.hpBonus - currentEnhanced.hpBonus})</span>
                            </div>
                          )}
                          {nextEnhanced.spBonus !== 0 && (
                            <div className="text-cyan-300 font-bold flex items-center justify-between">
                              <span>SP:</span>
                              <span>+{nextEnhanced.spBonus} (+{nextEnhanced.spBonus - currentEnhanced.spBonus})</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 text-xs font-mono text-amber-300">
                          Trang bị đã đạt mốc tối thượng, không thể nâng cấp thêm.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chi Phí Nâng Cấp */}
                  {!isMax && config && (
                    <div className="grid grid-cols-2 gap-3 border-t border-border/40 pt-3 font-mono text-xs">
                      {/* Tiêu hao Credits */}
                      <div className="rounded bg-black/40 p-2.5 border border-border/40 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-amber-300">
                          <Coins className="size-4 text-amber-400" />
                          <span>Chi phí: {config.creditsCost.toLocaleString("vi-VN")} Credits</span>
                        </div>
                        <span className={cn("text-[10px]", hasEnoughCredits ? "text-emerald-400" : "text-red-400")}>
                          Có: {progression.credits.toLocaleString("vi-VN")}
                        </span>
                      </div>

                      {/* Tiêu hao Hợp Kim Alloy */}
                      <div className="rounded bg-black/40 p-2.5 border border-border/40 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-purple-300">
                          <Layers className="size-4 text-purple-400" />
                          <span>Chi phí: {config.alloyCost} Hợp Kim (Alloy)</span>
                        </div>
                        <span className={cn("text-[10px]", hasEnoughAlloy ? "text-emerald-400" : "text-red-400")}>
                          Có: {alloyCount}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Cam kết bảo toàn 100% */}
                  <div className="rounded border border-emerald-500/30 bg-emerald-950/20 p-2.5 flex items-center gap-2 text-xs text-emerald-300 font-mono">
                    <ShieldCheck className="size-4 shrink-0 text-emerald-400" />
                    <span>
                      <strong>BẢO VỆ TUYỆT ĐỐI:</strong> Thất bại không bao giờ làm vỡ hay rớt cấp trang bị! Cấp độ sẽ được bảo toàn nguyên vẹn.
                    </span>
                  </div>

                  {/* Kết quả lần cường hóa gần nhất */}
                  {lastEnhanceResult && (
                    <div
                      className={cn(
                        "rounded border p-3 font-mono text-xs animate-in fade-in flex items-center gap-2.5",
                        lastEnhanceResult.success
                          ? "border-emerald-400 bg-emerald-950/40 text-emerald-200"
                          : "border-amber-400 bg-amber-950/40 text-amber-200",
                      )}
                    >
                      {lastEnhanceResult.success ? (
                        <Sparkles className="size-5 text-emerald-400 shrink-0 animate-bounce" />
                      ) : (
                        <AlertTriangle className="size-5 text-amber-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold block">
                          {lastEnhanceResult.success ? "CƯỜNG HÓA THÀNH CÔNG!" : "CƯỜNG HÓA THẤT BẠI"}
                        </span>
                        <span className="text-[11px] opacity-90">{lastEnhanceResult.message}</span>
                      </div>
                    </div>
                  )}

                  {/* Nút Hành Động */}
                  <div className="pt-2 flex justify-end gap-2.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEnhanceModal(false)}
                      className="font-display text-xs cursor-pointer"
                    >
                      Đóng
                    </Button>

                    {!isMax && (
                      <Button
                        size="sm"
                        disabled={!canEnhance}
                        onClick={handleExecuteEnhance}
                        className={cn(
                          "gap-1.5 font-display text-xs uppercase tracking-wider font-bold cursor-pointer",
                          canEnhance
                            ? "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                            : "bg-secondary text-muted-foreground cursor-not-allowed",
                        )}
                      >
                        <Hammer className="size-3.5" />
                        <span>
                          {isEnhancing
                            ? "Đang Cường Hóa..."
                            : !hasEnoughCredits
                              ? "Thiếu Credits"
                              : !hasEnoughAlloy
                                ? "Thiếu Alloy"
                                : `Cường Hóa [+${targetLevel}] Ngay ⚡`}
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL XÁC NHẬN CÀI LẠI TIẾN TRÌNH (RESET CONFIRMATION)
          ==================================================================== */}
      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full rounded-sm border border-red-500/60 bg-panel p-5 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="size-6 animate-pulse" />
              <h4 className="font-display text-sm font-bold uppercase tracking-wider">
                XÁC NHẬN CÀI LẠI TIẾN TRÌNH?
              </h4>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Toàn bộ dữ liệu cấp độ phi cơ, số EXP tích lũy, số Credits, Hợp Kim (Alloy) và trang bị cường hóa đã lưu trong trình duyệt sẽ được đưa về giá trị mặc định ban đầu. Hành động này không thể hoàn tác.
            </p>

            <div className="mt-5 flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetDialog(false)}
                className="text-xs font-display cursor-pointer"
              >
                Hủy bỏ
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onResetSave()
                  setShowResetDialog(false)
                }}
                className="text-xs font-display uppercase tracking-wider cursor-pointer font-bold"
              >
                Đồng ý xóa & Reset
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL TÁI CHẾ / RÃ ĐỒ (SALVAGE MODAL INTEGRATION)
          ==================================================================== */}
      <SalvageModal
        item={selectedSalvageItem}
        progression={progression}
        isOpen={Boolean(selectedSalvageItem)}
        onClose={() => setSelectedSalvageItem(null)}
        onSuccess={(updated) => {
          if (onUpdateProgression) {
            onUpdateProgression(updated)
          } else {
            saveStarfrontProgression(updated)
          }
        }}
      />
    </div>
  )
}

/* ==========================================================================
   SUBCOMPONENT: THẺ Ô KỸ NĂNG TRỰC QUAN (SKILL SLOT CARD)
   ========================================================================== */

function SkillSlotCard({
  slotInfo,
  onSelectSlot,
  detailedView = false,
}: {
  slotInfo: SkillSlotDetail
  onSelectSlot: () => void
  detailedView?: boolean
}) {
  const { slotIndex, slotRole, category, categoryLabel, skill, isEquipped, slotLevel, icon: Icon } = slotInfo
  const isUltimate = slotIndex === 5

  return (
    <div
      onClick={onSelectSlot}
      className={cn(
        "group relative flex flex-col justify-between rounded-sm border p-3 shadow-md transition-all cursor-pointer",
        isUltimate
          ? "border-amber-400/60 bg-gradient-to-b from-amber-950/30 via-panel to-panel shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:border-amber-300 hover:shadow-[0_0_18px_rgba(245,158,11,0.35)]"
          : "border-border/60 bg-black/45 hover:border-cyan-400/80 hover:bg-black/60 hover:shadow-[0_0_12px_rgba(6,182,212,0.2)]",
      )}
    >
      <div>
        {/* Header Slot */}
        <div className="flex items-center justify-between border-b border-border/40 pb-2 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded font-bold text-[9px] border",
                isUltimate
                  ? "bg-amber-500/20 text-amber-300 border-amber-400/50"
                  : "bg-cyan-500/20 text-cyan-300 border-cyan-400/50",
              )}
            >
              0{slotIndex}
            </span>
            <span className="font-bold text-white uppercase">{slotRole}</span>
          </div>

          <span
            className={cn(
              "rounded px-1.5 py-0.2 font-mono text-[9px] font-bold border",
              isUltimate
                ? "bg-amber-500/20 text-amber-300 border-amber-400"
                : category === "basic"
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                  : "bg-purple-950/60 text-purple-300 border-purple-500/40",
            )}
          >
            {categoryLabel}
          </span>
        </div>

        {/* Nội dung Kỹ Năng / Mô-Đun */}
        <div className="mt-2.5">
          <div className="flex items-start gap-2">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded border p-1 shadow-sm",
                isUltimate
                  ? "border-amber-400/60 bg-amber-950/50 text-amber-300"
                  : category === "basic"
                    ? "border-cyan-400/60 bg-cyan-950/50 text-cyan-300"
                    : "border-purple-400/60 bg-purple-950/50 text-purple-300",
              )}
            >
              <Icon className="size-4" />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="font-display text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                {skill.name}
              </h4>
              <span className="text-[9.5px] text-muted-foreground font-mono block truncate">
                {skill.nameEn}
              </span>
            </div>
          </div>

          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
            {skill.desc}
          </p>

          {/* Tiêu hao & Lượt hồi */}
          <div className="mt-2.5 flex flex-wrap gap-1 font-mono text-[10px]">
            <span
              className={cn(
                "rounded px-1.5 py-0.5 border",
                skill.spCost > 0
                  ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/30"
                  : "bg-emerald-950/60 text-emerald-300 border-emerald-500/30",
              )}
            >
              {skill.spCost > 0 ? `${skill.spCost} SP` : "+15 SP Nạp"}
            </span>

            <span className="rounded bg-slate-900 px-1.5 py-0.5 text-slate-300 border border-slate-700">
              {skill.cooldown > 0 ? `CD: ${skill.cooldown} lượt` : "Không CD"}
            </span>

            {skill.damageMultiplier && (
              <span className="rounded bg-red-950/60 px-1.5 py-0.5 text-red-300 border border-red-500/30">
                {Math.round(skill.damageMultiplier * 100)}% ATK
              </span>
            )}

            {skill.damageReduction && (
              <span className="rounded bg-blue-950/60 px-1.5 py-0.5 text-blue-300 border border-blue-500/30">
                Giảm {Math.round(skill.damageReduction * 100)}% DMG
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Thao Tác & Trạng Thái */}
      <div className="mt-3 border-t border-border/40 pt-2 text-[10px] font-mono">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Cấp Ô: Cấp {slotLevel}/20</span>
          <span className="text-cyan-300 font-bold">+2.5% Hiệu Lực</span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="size-3 text-emerald-400" />
            <span>Đã Gắn Module</span>
          </span>

          <span className="font-display text-[10px] font-bold text-cyan-400 group-hover:underline flex items-center gap-0.5">
            <span>Cấu hình</span>
            <ChevronRight className="size-3" />
          </span>
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
   MODAL: CHỌN & CẤU HÌNH MÔ-ĐUN KỸ NĂNG (SKILL MODULE SELECTION MODAL)
   ========================================================================== */

function SkillModuleSelectModal({
  slot,
  activeGearDef,
  progression,
  onClose,
}: {
  slot: SkillSlotDetail
  activeGearDef: (typeof STARFRONT_GEAR_DEFS)[StarfrontGearId]
  progression: StarfrontProgression
  onClose: () => void
}) {
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null)
  const isUltimate = slot.slotIndex === 5
  const Icon = slot.icon

  // Danh mục mô-đun tham khảo từ các hệ cơ giáp để minh họa và kiểm tra tính tương thích
  const sampleModuleRoster = useMemo(() => {
    const list: {
      id: string
      name: string
      nameEn: string
      gearName: string
      gearId: StarfrontGearId
      category: "basic" | "active" | "ultimate"
      spCost: number
      cooldown: number
      desc: string
      rarity: StarfrontItemRarity
      level: number
      isCompatible: boolean
      reason: string
    }[] = []

    // Đưa vào các kỹ năng thực tế hiện có trong game
    Object.values(STARFRONT_GEAR_DEFS).forEach((gDef) => {
      gDef.skills.forEach((sk, idx) => {
        let isCompatible = false
        let reason = ""

        if (slot.slotIndex === 1) {
          // Slot 1: Basic attack
          if (idx === 0) {
            isCompatible = gDef.id === activeGearDef.id
            reason = isCompatible ? "Khớp hoàn toàn với cơ giáp hiện tại" : "Khác lớp cơ giáp (Slot 1 chỉ nhận đòn của đúng Gear)"
          } else {
            isCompatible = false
            reason = "Đây là kỹ năng chủ động, không thể gắn vào ô Đòn Cơ Bản (Slot 1)"
          }
        } else if (slot.slotIndex >= 2 && slot.slotIndex <= 4) {
          // Slot 2-4: Active skills
          if (idx > 0 && idx < 4) {
            isCompatible = gDef.id === activeGearDef.id
            reason = isCompatible ? "Tương thích 100% với khung trang bị" : "Thuộc bản sắc lớp cơ giáp khác"
          } else if (idx === 0) {
            isCompatible = false
            reason = "Đòn đánh cơ bản chỉ dùng cho Slot 1"
          } else {
            isCompatible = false
            reason = "Kỹ năng tối thượng chỉ dành cho Slot 5"
          }
        } else if (slot.slotIndex === 5) {
          // Slot 5: Ultimate
          if (idx === 4 || sk.id.includes("ultimate") || sk.id.includes("nova") || sk.id.includes("blitz") || sk.id.includes("cannon")) {
            isCompatible = gDef.id === activeGearDef.id
            reason = isCompatible ? "Tuyệt kỹ độc quyền của cơ giáp hiện tại" : `Khóa theo cơ giáp ${gDef.name}, không thể lắp sang ${activeGearDef.name}`
          } else {
            isCompatible = false
            reason = "Slot 5 bắt buộc là Kỹ Năng Tối Thượng (Ultimate)"
          }
        }

        list.push({
          id: `${gDef.id}-${sk.id}`,
          name: sk.name,
          nameEn: sk.nameEn,
          gearName: gDef.name,
          gearId: gDef.id,
          category: idx === 0 ? "basic" : idx === 4 ? "ultimate" : "active",
          spCost: sk.spCost,
          cooldown: sk.cooldown,
          desc: sk.desc,
          rarity: idx === 4 ? "legendary" : idx === 0 ? "rare" : "epic",
          level: 1,
          isCompatible,
          reason,
        })
      })
    })

    return list
  }, [slot, activeGearDef])

  const handleAttemptEquip = (mod: (typeof sampleModuleRoster)[0]) => {
    playClickSound()
    if (!mod.isCompatible) {
      setFeedbackNotice(`Không thể trang bị: ${mod.reason}`)
      return
    }

    // Khi người chơi cố gắng trang bị, cung cấp thông báo rõ ràng về trạng thái Phase 5.7
    setFeedbackNotice(
      `Hệ thống kho lưu trữ Mô-đun rời đang thuộc lộ trình Phase 5.7 (docs/SKILL_SYSTEM.md). Cơ giáp hiện đang trang bị kỹ năng bẩm sinh [${slot.skill.name}] hoạt động ổn định.`,
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="max-w-2xl w-full rounded-sm border border-cyan-500/60 bg-panel p-5 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded border shadow-md",
                isUltimate
                  ? "bg-amber-950/80 border-amber-400 text-amber-300"
                  : "bg-cyan-950/80 border-cyan-400 text-cyan-300",
              )}
            >
              <Icon className="size-5" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                CẤU HÌNH MÔ-ĐUN // SLOT 0{slot.slotIndex}: {slot.slotRole.toUpperCase()}
              </h3>
              <p className="text-[11px] text-muted-foreground font-mono">
                Kiểm tra tính tương thích, thông số sát thương & quy tắc gắn mô-đun
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="size-7 flex items-center justify-center rounded border border-border/60 text-muted-foreground hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Thông báo phản hồi nếu có */}
        {feedbackNotice && (
          <div className="my-3 rounded border border-amber-400/80 bg-amber-950/40 p-3 font-mono text-xs text-amber-200 animate-in fade-in flex items-start gap-2">
            <Info className="size-4 shrink-0 text-amber-400 mt-0.5" />
            <div className="flex-1">
              <span>{feedbackNotice}</span>
            </div>
            <button
              onClick={() => setFeedbackNotice(null)}
              className="text-amber-300 hover:text-white text-[10px]"
            >
              [Đóng]
            </button>
          </div>
        )}

        {/* 1. MÔ-ĐUN HIỆN ĐANG GẮN TRONG Ô */}
        <div className="my-3 rounded border border-cyan-500/40 bg-black/50 p-3.5">
          <div className="flex items-center justify-between text-[10px] font-mono mb-2">
            <span className="text-muted-foreground uppercase">MÔ-ĐUN HIỆN TẠI TRONG Ô:</span>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-emerald-300 font-bold border border-emerald-500/40">
              ✓ ĐANG KẾT NỐI
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <span>{slot.skill.name}</span>
                <span className="text-xs font-mono font-normal text-muted-foreground">
                  ({slot.skill.nameEn})
                </span>
              </h4>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                {slot.skill.desc}
              </p>
            </div>

            <div className="shrink-0 text-right font-mono text-xs">
              <span className="rounded bg-black/60 px-2 py-0.5 border border-border/60 text-cyan-300 font-bold block">
                Cấp Ô: {slot.slotLevel}/20
              </span>
              <span className="text-[10px] text-muted-foreground block mt-1">
                +2.5% Hiệu Lực
              </span>
            </div>
          </div>

          {/* Tiêu hao & Hiệu số */}
          <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-xs border-t border-border/40 pt-2">
            <span className="rounded bg-cyan-950/60 px-2 py-0.5 text-cyan-300 border border-cyan-500/30">
              Tiêu hao: {slot.skill.spCost > 0 ? `${slot.skill.spCost} SP` : "+15 SP Nạp"}
            </span>
            <span className="rounded bg-slate-900 px-2 py-0.5 text-slate-300 border border-slate-700">
              Thời gian hồi: {slot.skill.cooldown > 0 ? `${slot.skill.cooldown} lượt` : "0 lượt"}
            </span>
            {slot.skill.damageMultiplier && (
              <span className="rounded bg-red-950/60 px-2 py-0.5 text-red-300 border border-red-500/30">
                Sát thương: {Math.round(slot.skill.damageMultiplier * 100)}% ATK
              </span>
            )}
            {slot.skill.damageReduction && (
              <span className="rounded bg-blue-950/60 px-2 py-0.5 text-blue-300 border border-blue-500/30">
                Lá chắn: Giảm {Math.round(slot.skill.damageReduction * 100)}% DMG
              </span>
            )}
          </div>
        </div>

        {/* 2. QUY TẮC TƯƠNG THÍCH CHO Ô NÀY */}
        <div className="mb-3 rounded border border-border/60 bg-panel/60 p-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 font-bold text-cyan-300 mb-1">
            <SlidersHorizontal className="size-3.5 text-cyan-400" />
            <span>QUY TẮC TƯƠNG THÍCH CHO {slot.slotRole.toUpperCase()}:</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {slot.slotIndex === 1 && (
              "Slot 1 (Đòn Cơ Bản): Cho phép All-Gear hoặc Mô-đun của đúng Gear. Luôn tạo 15 SP khi tấn công và không tốn năng lượng."
            )}
            {slot.slotIndex >= 2 && slot.slotIndex <= 4 && (
              "Slot 2–4 (Kỹ Năng Chủ Động): Cho phép kết hợp mô-đun All-Gear hoặc đúng Gear. Tối đa 2 trong 3 slot được dùng All-Gear, ít nhất 1 slot phải là kỹ năng bản sắc của lớp."
            )}
            {slot.slotIndex === 5 && (
              `Slot 5 (Tuyệt Kỹ Tối Thượng): Khóa cứng 100% chiêu thức Ultimate của đúng Gear hiện tại (${activeGearDef.name}). Không thể lắp tuyệt kỹ của phi cơ khác.`
            )}
          </p>
        </div>

        {/* 3. DANH SÁCH MÔ-ĐUN TRONG KHO & KHẢ DỤNG */}
        <div>
          <div className="mb-2 flex items-center justify-between font-mono text-xs">
            <span className="font-bold text-white uppercase flex items-center gap-1.5">
              <Boxes className="size-3.5 text-cyan-400" />
              <span>DANH MỤC MÔ-ĐUN & TRẠNG THÁI TƯƠNG THÍCH</span>
            </span>
            <span className="text-[11px] text-muted-foreground">
              Kho hiện tại: 0 Mô-đun rời (Đang dùng Kỹ Năng Bẩm Sinh)
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {sampleModuleRoster.map((mod) => (
              <div
                key={mod.id}
                className={cn(
                  "rounded border p-2.5 transition-all text-xs font-mono flex flex-col justify-between gap-1.5",
                  mod.isCompatible
                    ? "border-cyan-500/40 bg-black/40 hover:border-cyan-400 hover:bg-black/60"
                    : "border-red-500/20 bg-red-950/10 opacity-70",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-display text-xs">
                        {mod.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ({mod.gearName})
                      </span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.2 text-[9px] font-bold border",
                          mod.isCompatible
                            ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                            : "bg-red-950/60 text-red-300 border-red-500/40",
                        )}
                      >
                        {mod.isCompatible ? "✓ TƯƠNG THÍCH" : "✕ KHÔNG TƯƠNG THÍCH"}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                      {mod.desc}
                    </p>
                  </div>

                  <Button
                    size="xs"
                    disabled={!mod.isCompatible}
                    onClick={() => handleAttemptEquip(mod)}
                    className={cn(
                      "shrink-0 font-display text-[10px] uppercase font-bold cursor-pointer",
                      mod.isCompatible
                        ? "bg-cyan-600 hover:bg-cyan-500 text-white"
                        : "bg-secondary text-muted-foreground cursor-not-allowed",
                    )}
                  >
                    {mod.isCompatible ? "Gắn Vào Ô" : "Khóa"}
                  </Button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/30 pt-1">
                  <span>{mod.spCost > 0 ? `${mod.spCost} SP` : "+15 SP"} · CD: {mod.cooldown} lượt</span>
                  <span className={mod.isCompatible ? "text-cyan-300" : "text-red-400"}>
                    {mod.reason}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Modal */}
        <div className="mt-4 pt-3 border-t border-border/50 flex justify-end">
          <Button
            size="sm"
            onClick={onClose}
            className="font-display text-xs cursor-pointer bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
          >
            Đóng Cửa Sổ
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
   HELPER SUB-COMPONENTS
   ========================================================================== */

function StatRow({
  label,
  current,
  base,
  bonus,
  preview,
  color,
}: {
  label: string
  current: number
  base: number
  bonus: number
  preview?: number
  color: string
}) {
  const diff = preview !== undefined ? preview - current : 0

  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn("font-bold text-sm", color)}>{current}</span>
        <span className="text-[10px] text-muted-foreground">
          (gốc {base} {bonus !== 0 && `· đồ ${bonus > 0 ? `+${bonus}` : bonus}`})
        </span>

        {diff !== 0 && (
          <span
            className={cn(
              "font-bold text-xs animate-pulse flex items-center gap-0.5",
              diff > 0 ? "text-emerald-400" : "text-red-400",
            )}
          >
            {diff > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            ➔ {preview} ({diff > 0 ? `+${diff}` : diff})
          </span>
        )}
      </div>
    </div>
  )
}

function ItemComparisonCard({
  title,
  item,
  isCurrentlyEquipped,
}: {
  title: string
  item: StarfrontItem | null
  isCurrentlyEquipped: boolean
}) {
  if (!item) {
    return (
      <div className="rounded border border-border/50 bg-black/40 p-3 text-center">
        <span className="text-[10px] font-mono text-muted-foreground uppercase">{title}</span>
        <div className="my-4 text-xs font-mono text-muted-foreground italic">
          (Ô này hiện chưa được gắn trang bị)
        </div>
      </div>
    )
  }

  const rarity = RARITY_CONFIG[item.rarity]
  const enhBadge = getEnhancementBadgeMeta(item.enhancementLevel)
  const stats = getEnhancedItemStats(item)
  const rating = calculateItemRating(item)

  return (
    <div className={cn("rounded border p-3", rarity.border, rarity.bg)}>
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-muted-foreground uppercase">{title}</span>
        {isCurrentlyEquipped && (
          <span className="text-cyan-300 font-bold">✓ ĐANG LẮP TRÊN TÀU</span>
        )}
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-1">
        <h5 className="font-display text-xs font-bold text-white">
          {getItemDisplayName(item)}
        </h5>
        <div className="flex items-center gap-1">
          <span className="rounded px-1.5 py-0.2 font-mono text-[9px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40">
            {rating} R
          </span>
          {enhBadge && (
            <span className={cn("rounded px-1.5 py-0.2 font-mono text-[9px] border", enhBadge.className)}>
              {enhBadge.text}
            </span>
          )}
        </div>
      </div>

      <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
        {item.desc}
      </p>

      <div className="mt-2 flex flex-wrap gap-1 font-mono text-[10px]">
        {stats.attackBonus !== 0 && (
          <span className="rounded bg-red-950/60 px-1.5 py-0.5 text-red-300 border border-red-500/30">
            ATK +{stats.attackBonus}
          </span>
        )}
        {stats.defenseBonus !== 0 && (
          <span className="rounded bg-blue-950/60 px-1.5 py-0.5 text-blue-300 border border-blue-500/30">
            DEF {stats.defenseBonus > 0 ? `+${stats.defenseBonus}` : stats.defenseBonus}
          </span>
        )}
        {stats.speedBonus !== 0 && (
          <span className="rounded bg-emerald-950/60 px-1.5 py-0.5 text-emerald-300 border border-emerald-500/30">
            SPD +{stats.speedBonus}
          </span>
        )}
        {stats.hpBonus !== 0 && (
          <span className="rounded bg-teal-950/60 px-1.5 py-0.5 text-teal-300 border border-teal-500/30">
            HP +{stats.hpBonus}
          </span>
        )}
        {stats.spBonus !== 0 && (
          <span className="rounded bg-cyan-950/60 px-1.5 py-0.5 text-cyan-300 border border-cyan-500/30">
            SP +{stats.spBonus}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Xây dựng danh sách 5 Slot Kỹ Năng chi tiết từ cấu hình Gear hiện tại
 */
function buildDetailedSkillSlots(
  gearDef: (typeof STARFRONT_GEAR_DEFS)[StarfrontGearId],
): SkillSlotDetail[] {
  const skills = gearDef.skills || []

  const slot1 = skills[0] || {
    id: "basic-attack",
    name: "Tia Năng Lượng Thường",
    nameEn: "Basic Shot",
    desc: "Đòn đánh cơ bản nạp lại 15 SP.",
    spCost: 0,
    cooldown: 0,
    targetType: "single-enemy" as const,
    damageMultiplier: 1.0,
  }

  const slot2 = skills[1] || {
    id: "active-1",
    name: "Xung Kích Chiến Thuật",
    nameEn: "Tactical Strike",
    desc: "Kỹ năng tấn công chủ lực.",
    spCost: 25,
    cooldown: 0,
    targetType: "single-enemy" as const,
    damageMultiplier: 1.5,
  }

  const slot3 = skills[2] || {
    id: "active-2",
    name: "Sóng Phá Giáp",
    nameEn: "Disruptor Beam",
    desc: "Gây sát thương và giảm phòng ngự mục tiêu.",
    spCost: 35,
    cooldown: 3,
    targetType: "single-enemy" as const,
    damageMultiplier: 1.2,
    defenseReduction: 0.35,
    effectDuration: 2,
  }

  const slot4 = skills[3] || {
    id: "active-3",
    name: "Lá Chắn Khẩn Cấp",
    nameEn: "Emergency Guard",
    desc: "Kích hoạt tấm chắn giảm sát thương nhận vào.",
    spCost: 30,
    cooldown: 4,
    targetType: "self" as const,
    damageReduction: 0.5,
    effectDuration: 2,
  }

  const slot5Ultimate: CombatSkill =
    gearDef.id === "falcon"
      ? {
          id: "falcon-ultimate",
          name: "Bão Siêu Tốc Phantom Blitz",
          nameEn: "Mach Phantom Blitz",
          desc: "Đột phá tốc độ ánh sáng gây 240% sát thương bạo kích, đồng thời kích hoạt 100% né tránh đòn đánh trong lượt kế tiếp.",
          spCost: 55,
          cooldown: 5,
          targetType: "single-enemy",
          damageMultiplier: 2.4,
        }
      : gearDef.id === "aegis"
        ? {
            id: "aegis-ultimate",
            name: "Pháo Kích Hạt Nhân Pháo Đài",
            nameEn: "Judgement Fortress Cannon",
            desc: "Tập trung toàn bộ năng lượng bắn chùm pháo hạt nhân công phá cực mạnh gây 260% sát thương xuyên thủng 100% giáp.",
            spCost: 60,
            cooldown: 5,
            targetType: "single-enemy",
            damageMultiplier: 2.6,
            armorPenetration: 1.0,
          }
        : {
            id: "vanguard-ultimate",
            name: "Bão Xung Quang Overdrive Nova",
            nameEn: "Overdrive Photon Nova",
            desc: "Giải phóng toàn bộ xung năng lượng lõi gây 230% sát thương, hồi đầy khiên và duy trì +10 SP mỗi lượt.",
            spCost: 50,
            cooldown: 5,
            targetType: "single-enemy",
            damageMultiplier: 2.3,
          }

  return [
    {
      slotIndex: 1,
      slotRole: "Đòn Cơ Bản",
      category: "basic",
      categoryLabel: "Đòn Cơ Bản",
      skill: slot1,
      isNative: true,
      isEquipped: true,
      slotLevel: 1,
      slotMultiplier: 1.025,
      compatibilityDesc: "All-Gear hoặc đúng Gear",
      allowedScope: "all-or-gear",
      icon: Zap,
      colorTheme: "#06b6d4",
    },
    {
      slotIndex: 2,
      slotRole: "Chủ Động 1",
      category: "active",
      categoryLabel: "Chủ Động",
      skill: slot2,
      isNative: true,
      isEquipped: true,
      slotLevel: 1,
      slotMultiplier: 1.025,
      compatibilityDesc: "All-Gear hoặc đúng Gear (Tối đa 2/3 All-Gear)",
      allowedScope: "all-or-gear",
      icon: Sword,
      colorTheme: "#a855f7",
    },
    {
      slotIndex: 3,
      slotRole: "Chủ Động 2",
      category: "active",
      categoryLabel: "Chủ Động",
      skill: slot3,
      isNative: true,
      isEquipped: true,
      slotLevel: 1,
      slotMultiplier: 1.025,
      compatibilityDesc: "All-Gear hoặc đúng Gear (Tối đa 2/3 All-Gear)",
      allowedScope: "all-or-gear",
      icon: ShieldAlert,
      colorTheme: "#ec4899",
    },
    {
      slotIndex: 4,
      slotRole: "Chủ Động 3",
      category: "active",
      categoryLabel: "Chủ Động",
      skill: slot4,
      isNative: true,
      isEquipped: true,
      slotLevel: 1,
      slotMultiplier: 1.025,
      compatibilityDesc: "All-Gear hoặc đúng Gear (Tối đa 2/3 All-Gear)",
      allowedScope: "all-or-gear",
      icon: Shield,
      colorTheme: "#3b82f6",
    },
    {
      slotIndex: 5,
      slotRole: "Tuyệt Kỹ Tối Thượng",
      category: "ultimate",
      categoryLabel: "Ultimate",
      skill: slot5Ultimate,
      isNative: true,
      isEquipped: true,
      slotLevel: 1,
      slotMultiplier: 1.025,
      compatibilityDesc: `Khóa 100% chiêu thức của ${gearDef.name}`,
      allowedScope: "gear-locked",
      icon: Sparkles,
      colorTheme: "#f59e0b",
    },
  ]
}
