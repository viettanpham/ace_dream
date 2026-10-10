"use client"

import { Button } from "@/components/ui/button"
import { STARFRONT_GEAR_DEFS } from "@/lib/game/data"
import { playClickSound } from "@/lib/game/audio"
import {
  calculateTotalGearStats,
  ENHANCEMENT_TABLE,
  getEnhancedItemStats,
  getExpRequiredForLevel,
  getItemDisplayName,
  SAMPLE_STARFRONT_ITEMS,
  type EnhancementResult,
} from "@/lib/game/progression"
import { saveStarfrontProgression } from "@/lib/game/storage"
import type {
  StarfrontGearId,
  StarfrontItem,
  StarfrontItemRarity,
  StarfrontItemSlot,
  StarfrontProgression,
} from "@/lib/game/types"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Check,
  Coins,
  Cpu,
  Flame,
  Gauge,
  Hammer,
  Layers,
  Recycle,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sparkles,
  Sword,
  TrendingUp,
  Wrench,
  Wind,
  ShieldAlert,
  Award,
  X,
  Zap,
} from "lucide-react"
import { SalvageModal } from "./salvage-modal"
import { useState } from "react"

const RARITY_CONFIG: Record<
  StarfrontItemRarity,
  { label: string; border: string; bg: string; text: string }
> = {
  common: {
    label: "Thường",
    border: "border-slate-500/40",
    bg: "bg-slate-900/40",
    text: "text-slate-300",
  },
  rare: {
    label: "Hiếm",
    border: "border-cyan-400/60",
    bg: "bg-cyan-950/40",
    text: "text-cyan-300",
  },
  epic: {
    label: "Sử Thi",
    border: "border-purple-400/60",
    bg: "bg-purple-950/40",
    text: "text-purple-300",
  },
  legendary: {
    label: "Huyền Thoại",
    border: "border-amber-400/70",
    bg: "bg-amber-950/40",
    text: "text-amber-300",
  },
}

const SLOT_META: Record<StarfrontItemSlot, { label: string; icon: typeof Sword; desc: string }> = {
  weapon: { label: "Vũ Khí Chính", icon: Sword, desc: "Tăng mạnh lực sát thương (ATK)" },
  shield: { label: "Khiên Phòng Hộ", icon: Shield, desc: "Gia cố độ bền giáp (DEF & HP)" },
  engine: { label: "Động Cơ Đẩy", icon: Gauge, desc: "Tối ưu tốc độ ra đòn (SPD & SP)" },
}

/** Lấy huy hiệu cấp cường hóa (+1 đến +10) */
function getEnhancementBadgeMeta(level: number = 0) {
  if (level === 0) return null
  if (level >= 10) {
    return {
      text: "+10 TỐI THƯỢNG",
      className:
        "bg-amber-500/30 text-amber-300 border-amber-400 font-black shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse",
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
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<StarfrontItemSlot | "all">("all")
  const [hoveredItem, setHoveredItem] = useState<StarfrontItem | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [selectedSalvageItem, setSelectedSalvageItem] = useState<StarfrontItem | null>(null)

  // Quản lý trạng thái Xưởng Cường Hóa (Enhancement Lab Modal)
  const [showEnhanceModal, setShowEnhanceModal] = useState(false)
  const [selectedEnhanceItemId, setSelectedEnhanceItemId] = useState<string | null>(null)
  const [lastEnhanceResult, setLastEnhanceResult] = useState<EnhancementResult | null>(null)
  const [isEnhancing, setIsEnhancing] = useState(false)

  const activeGearId: StarfrontGearId = progression.activeGearId || "vanguard"
  const activeGearDef = STARFRONT_GEAR_DEFS[activeGearId] || STARFRONT_GEAR_DEFS.vanguard

  const expRequired = getExpRequiredForLevel(progression.level)
  const expPercentage = Math.min(100, Math.round((progression.exp / expRequired) * 100))
  const alloyCount = progression.alloy ?? 25

  // Tính toán chỉ số hiện tại dựa theo Gear đang chọn (đã tính cường hóa +1 đến +10)
  const currentStats = calculateTotalGearStats(
    activeGearId,
    progression.level,
    progression.inventory,
    progression.equipped,
  )

  // Tính toán chỉ số so sánh nếu hover vào 1 món đồ
  const previewEquipped = hoveredItem
    ? { ...progression.equipped, [hoveredItem.slot]: hoveredItem.id }
    : null

  const previewStats = previewEquipped
    ? calculateTotalGearStats(activeGearId, progression.level, progression.inventory, previewEquipped)
    : null

  const filteredInventory = progression.inventory.filter((item) =>
    selectedSlotFilter === "all" ? true : item.slot === selectedSlotFilter,
  )

  const handleGearChange = (gearId: StarfrontGearId) => {
    playClickSound()
    if (onSelectGear) {
      onSelectGear(gearId)
    }
  }

  // Mở giao diện Cường Hóa cho một trang bị cụ thể
  const handleOpenEnhance = (itemId?: string) => {
    playClickSound()
    const targetId = itemId || progression.inventory[0]?.id || null
    setSelectedEnhanceItemId(targetId)
    setLastEnhanceResult(null)
    setShowEnhanceModal(true)
  }

  // Thực hiện cường hóa trang bị đang chọn
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

  const selectedEnhanceItem = progression.inventory.find(
    (it) => it.id === selectedEnhanceItemId,
  ) || progression.inventory[0]

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Header tóm tắt tiến trình phi cơ Vanguard */}
      <div className="rounded-sm border border-cyan-500/30 bg-gradient-to-r from-panel via-cyan-950/20 to-panel p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-sm border border-cyan-400/60 bg-cyan-950/60 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <Cpu className="size-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-bold uppercase tracking-wider text-cyan-200">
                  XƯỞNG TRANG BỊ {activeGearDef.name.toUpperCase()} // STARFRONT HANGAR
                </h2>
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-xs font-bold text-cyan-300 border border-cyan-500/40">
                  CẤP {progression.level}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Quản lý kho vũ khí, khiên chắn và động cơ đẩy · Cường hóa trang bị từ +1 đến +10 gia tăng thực tế lực chiến
              </p>
            </div>
          </div>

          {/* Credits & Hợp Kim Alloy & Nút Mở Xưởng Cường Hóa */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Ngân sách Credits */}
            <div className="flex items-center gap-1.5 rounded-sm border border-amber-500/40 bg-amber-950/30 px-3 py-1.5 font-mono text-xs text-amber-300">
              <Coins className="size-4 text-amber-400" />
              <span>Ngân sách:</span>
              <strong className="text-sm font-bold text-amber-200">
                {progression.credits.toLocaleString("vi-VN")}
              </strong>
              <span>Credits</span>
            </div>

            {/* Hợp Kim Cường Hóa (Alloy) */}
            <div className="flex items-center gap-1.5 rounded-sm border border-purple-500/40 bg-purple-950/30 px-3 py-1.5 font-mono text-xs text-purple-300">
              <Layers className="size-4 text-purple-400" />
              <span>Hợp Kim:</span>
              <strong className="text-sm font-bold text-purple-200">
                {alloyCount}
              </strong>
              <span>Alloy</span>
            </div>

            {/* Nút Mở Xưởng Cường Hóa */}
            <Button
              onClick={() => handleOpenEnhance()}
              size="sm"
              className="gap-1.5 font-display text-xs uppercase tracking-wider bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.35)] cursor-pointer"
            >
              <Hammer className="size-3.5" />
              <span>Xưởng Cường Hóa (+1 đến +10)</span>
            </Button>

            <Button
              onClick={onNavigateToCombat}
              size="sm"
              className="gap-1.5 font-display text-xs uppercase tracking-wider bg-cyan-500 text-black hover:bg-cyan-400 cursor-pointer"
            >
              <span>Vào Đấu Trường</span>
              <ArrowRight className="size-3.5" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetDialog(true)}
              className="gap-1 text-xs text-red-400 hover:text-red-300 hover:border-red-500 cursor-pointer"
            >
              <RotateCcw className="size-3" />
              <span>Cài lại</span>
            </Button>
          </div>
        </div>

        {/* Thanh tiến trình EXP */}
        <div className="mt-4 border-t border-border/50 pt-3">
          <div className="mb-1.5 flex justify-between font-mono text-xs">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Sparkles className="size-3.5 text-cyan-400" /> KINH NGHIỆM CHIẾN ĐẤU (EXP)
            </span>
            <span className="text-muted-foreground">
              <strong className="text-white">{progression.exp}</strong> / {expRequired} EXP ({expPercentage}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-xs bg-secondary/70">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
              style={{ width: `${expPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Bộ Chọn Lớp Cơ Giáp (Gear Class Selection) */}
      <div className="rounded-sm border border-cyan-500/30 bg-panel/80 p-3.5 shadow-md">
        <div className="mb-2.5 flex items-center justify-between border-b border-border/40 pb-2">
          <div className="flex items-center gap-2">
            <Cpu className="size-4 text-cyan-400" />
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
              CHỌN LỚP CƠ GIÁP XUẤT KÍCH (PHASE 3: 3 LỚP GEAR)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            Đang điều khiển: <strong className="text-cyan-300">{activeGearDef.name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {(["vanguard", "falcon", "aegis"] as StarfrontGearId[]).map((gId) => {
            const def = STARFRONT_GEAR_DEFS[gId]
            const isSelected = activeGearId === gId

            return (
              <button
                key={gId}
                onClick={() => handleGearChange(gId)}
                className={cn(
                  "flex flex-col justify-between rounded-sm border p-3 text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-cyan-400 bg-cyan-950/60 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                    : "border-border/60 bg-panel/40 hover:border-cyan-500/40 hover:bg-panel/80",
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-display text-xs font-bold text-white">
                      {def.name}
                    </span>
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: def.color }}
                    />
                  </div>
                  <span className="text-[10px] text-cyan-300/80 font-mono block mt-0.5">
                    {def.role}
                  </span>
                  <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                    {def.desc}
                  </p>

                  {/* Huy hiệu Nội Tại (Passive Skill Badge) */}
                  <div className="mt-2 rounded bg-black/50 p-1.5 border border-border/50 text-[10px] font-mono">
                    <div className="flex items-center gap-1 font-bold text-cyan-300">
                      <Sparkles className="size-3 text-amber-400" />
                      <span>{def.passive.name}</span>
                    </div>
                    <p className="text-[9.5px] text-muted-foreground mt-0.5 line-clamp-1">
                      {def.passive.shortDesc}
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between border-t border-border/40 pt-1.5 text-[10px] font-mono">
                  <span className="text-muted-foreground">
                    Gốc: {def.baseStats.speed} SPD · {def.baseStats.attack} ATK
                  </span>
                  <span className={cn("font-bold", isSelected ? "text-cyan-300" : "text-muted-foreground")}>
                    {isSelected ? "✓ Đang chọn" : "Kích hoạt ➔"}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Hai cánh: 3 Ô Trang Bị Đang Dùng vs Bảng Chỉ Số Thực Tế */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Cột 1 & 2: 3 Ô Trang Bị Hiện Tại */}
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <Sword className="size-4 text-cyan-400" />
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                THIẾT LẬP TRANG BỊ HIỆN TẠI (3 SLOTS)
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Bấm [Cường Hóa ⚡] để nâng cấp hoặc [Tháo đồ] để gỡ
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
                    "flex flex-col justify-between rounded-sm border p-3.5 shadow-md transition-all",
                    equippedItem
                      ? `${RARITY_CONFIG[equippedItem.rarity].border} ${RARITY_CONFIG[equippedItem.rarity].bg}`
                      : "border-border/60 bg-panel/40",
                  )}
                >
                  <div>
                    {/* Header ô slot */}
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <div className="flex items-center gap-1.5">
                        <SlotIcon className="size-4 text-cyan-400" />
                        <span className="font-display text-xs font-bold text-foreground">
                          {meta.label}
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
                        <h4 className="font-display text-xs font-bold text-white flex items-center gap-1">
                          {getItemDisplayName(equippedItem)}
                        </h4>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                          {equippedItem.desc}
                        </p>

                        {/* Điểm thưởng chỉ số đã tính Cường Hóa */}
                        <div className="mt-2.5 flex flex-wrap gap-1 font-mono text-[10px]">
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
                      <div className="my-5 flex flex-col items-center justify-center text-center text-muted-foreground">
                        <SlotIcon className="size-8 opacity-30 mb-1" />
                        <span className="text-xs font-display">CHƯA TRANG BỊ</span>
                        <span className="text-[10px]">{meta.desc}</span>
                      </div>
                    )}
                  </div>

                  {/* Nút hành động cho ô slot */}
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
                      <span className="text-[10px] font-mono text-muted-foreground italic">
                        Chọn từ kho đồ bên dưới
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Cột 3: Bảng Chỉ Số Thực Tế Trong Đấu Trường */}
        <div className="rounded-sm border border-cyan-500/40 bg-panel/90 p-4 shadow-xl">
          <div className="mb-3 border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <Gauge className="size-4 text-cyan-400" />
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                CHỈ SỐ THỰC TẾ ({activeGearDef.name.toUpperCase()})
              </h3>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {hoveredItem
                ? `⚡ Xem trước thay đổi khi trang bị: ${hoveredItem.name}`
                : "Chỉ số thực tế được nạp vào sàn đấu"}
            </p>
          </div>

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

            {/* Vỏ Giáp (HP) */}
            <StatRow
              label="ĐỘ BỀN VỎ (HP)"
              current={currentStats.total.hp}
              base={currentStats.base.hp}
              bonus={currentStats.bonuses.hp}
              preview={previewStats?.total.hp}
              color="text-teal-400"
            />

            {/* Năng Lượng (SP) */}
            <StatRow
              label="LÕI NĂNG LƯỢNG (SP)"
              current={currentStats.total.sp}
              base={currentStats.base.sp}
              bonus={currentStats.bonuses.sp}
              preview={previewStats?.total.sp}
              color="text-cyan-400"
            />
          </div>

          <div className="mt-4 rounded bg-black/40 p-2.5 text-[11px] leading-relaxed text-muted-foreground border border-border/50">
            <span className="font-bold text-cyan-300">💡 Lưu ý cường hóa:</span> Cường hóa trang bị gia tăng trực tiếp sức mạnh cho toàn bộ chỉ số cộng thêm. Cấp càng cao, lực chiến bứt phá càng khủng khiếp!
          </div>

          {/* Kỹ Năng Nội Tại & Bản Sắc Cơ Giáp */}
          <div className="mt-4 rounded border border-cyan-500/40 bg-cyan-950/30 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-amber-400" />
                <h4 className="font-display text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  NỘI TẠI: {activeGearDef.passive.name}
                </h4>
              </div>
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-mono text-amber-300 border border-amber-500/40">
                KÍCH HOẠT TỰ ĐỘNG
              </span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-200">
              {activeGearDef.passive.desc}
            </p>
            <div className="mt-2 grid grid-cols-1 gap-1 border-t border-cyan-500/30 pt-2 font-mono text-[10px] sm:grid-cols-2">
              {activeGearDef.passive.details.map((dt, idx) => (
                <div key={idx} className="flex items-center justify-between rounded bg-black/40 px-2 py-1">
                  <span className="text-muted-foreground">{dt.label}:</span>
                  <span className="font-bold text-cyan-300">{dt.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bộ Kỹ Năng Độc Quyền Của Gear Đang Chọn */}
          <div className="mt-4 border-t border-border/50 pt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Flame className="size-3.5 text-cyan-400" />
              <h4 className="font-display text-[11px] font-bold text-cyan-200 uppercase">
                BỘ KỸ NĂNG ({activeGearDef.name})
              </h4>
            </div>
            <div className="space-y-1.5">
              {activeGearDef.skills.map((sk) => (
                <div key={sk.id} className="rounded bg-black/40 p-2 text-[10px] font-mono border border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{sk.name}</span>
                    <span className="text-cyan-400">{sk.spCost > 0 ? `${sk.spCost} SP` : "Hồi +15 SP"}</span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 leading-snug">{sk.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Kho đồ sở hữu (Inventory List) */}
      <div className="rounded-sm border border-border/70 bg-panel/80 p-4 shadow-xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Boxes className="size-4 text-cyan-400" />
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
              KHO ĐỒ VẬT PHẨM SỞ HỮU ({progression.inventory.length} MÓN)
            </h3>
          </div>

          {/* Bộ lọc slot */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground uppercase mr-1">Bộ lọc:</span>
            {(["all", "weapon", "shield", "engine"] as const).map((filter) => {
              const active = selectedSlotFilter === filter
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
                  onClick={() => setSelectedSlotFilter(filter)}
                  className={cn(
                    "rounded-xs border px-2.5 py-1 font-display text-[11px] transition-all cursor-pointer",
                    active
                      ? "border-cyan-400 bg-cyan-950/80 text-cyan-200 font-bold"
                      : "border-border/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Lưới các món đồ trong kho */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredInventory.map((item) => {
            const isEquipped = progression.equipped[item.slot] === item.id
            const rarity = RARITY_CONFIG[item.rarity]
            const enhBadge = getEnhancementBadgeMeta(item.enhancementLevel)
            const enhancedStats = getEnhancedItemStats(item)

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredItem(item)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  "group relative flex flex-col justify-between rounded-sm border p-3 transition-all",
                  isEquipped
                    ? "border-cyan-400/80 bg-cyan-950/30 shadow-[0_0_12px_rgba(34,211,238,0.15)]"
                    : `${rarity.border} ${rarity.bg} hover:border-cyan-300/80 hover:bg-black/50`,
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-display text-xs font-bold text-white group-hover:text-cyan-300 flex items-center gap-1">
                      {getItemDisplayName(item)}
                    </span>
                    <div className="flex items-center gap-1">
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

                {/* Nút hành động */}
                <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">
                    Slot: {SLOT_META[item.slot].label}
                  </span>

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
                      <span className="flex items-center gap-1 font-display text-[11px] font-bold text-cyan-300">
                        <Check className="size-3.5" /> ĐANG DÙNG
                      </span>
                    ) : (
                      <Button
                        size="xs"
                        onClick={() => onEquipItem(item.id, item.slot)}
                        className="gap-1 font-display text-[10px] uppercase bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer"
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
      </div>

      {/* 5. Modal Xưởng Cường Hóa Trang Bị (Enhancement Lab Modal) */}
      {showEnhanceModal && selectedEnhanceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
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
                    Nâng cấp linh kiện gia tăng sức mạnh vượt bậc · Cơ chế chống ức chế bảo toàn trang bị 100%
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
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {progression.inventory.map((invItem) => {
                  const isSelected = invItem.id === selectedEnhanceItem.id
                  const badge = getEnhancementBadgeMeta(invItem.enhancementLevel)
                  return (
                    <button
                      key={invItem.id}
                      onClick={() => {
                        playClickSound()
                        setSelectedEnhanceItemId(invItem.id)
                        setLastEnhanceResult(null)
                      }}
                      className={cn(
                        "flex shrink-0 items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] font-mono transition-all cursor-pointer",
                        isSelected
                          ? "border-purple-400 bg-purple-950/80 text-purple-200 font-bold shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                          : "border-border/60 bg-black/40 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span>{invItem.name}</span>
                      {badge && (
                        <span className={cn("rounded px-1 text-[9px] border", badge.className)}>
                          {badge.text}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Chi Tiết Cường Hóa Món Đồ Đang Chọn */}
            {(() => {
              const currentLevel = Math.max(0, Math.min(10, selectedEnhanceItem.enhancementLevel || 0))
              const isMax = currentLevel >= 10
              const targetLevel = currentLevel + 1
              const nextConfig = !isMax ? ENHANCEMENT_TABLE[targetLevel] : null
              const currentStatsObj = getEnhancedItemStats(selectedEnhanceItem)
              const nextItemMock: StarfrontItem = { ...selectedEnhanceItem, enhancementLevel: targetLevel }
              const nextStatsObj = !isMax ? getEnhancedItemStats(nextItemMock) : currentStatsObj

              const hasEnoughCredits = nextConfig ? progression.credits >= nextConfig.creditsCost : false
              const hasEnoughAlloy = nextConfig ? alloyCount >= nextConfig.alloyCost : false
              const canEnhance = !isMax && hasEnoughCredits && hasEnoughAlloy && !isEnhancing

              return (
                <div className="space-y-4">
                  {/* Khung Thông Tin Cấp Độ Hiện Tại vs Cấp Tiếp Theo */}
                  <div className="rounded-sm border border-purple-500/40 bg-black/40 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                      <div>
                        <span className="font-display text-sm font-bold text-white flex items-center gap-1.5">
                          {getItemDisplayName(selectedEnhanceItem)}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          Vị trí: {SLOT_META[selectedEnhanceItem.slot].label} · Độ hiếm: {RARITY_CONFIG[selectedEnhanceItem.rarity].label}
                        </span>
                      </div>

                      {/* Huy Hiệu Cấp Độ */}
                      <div className="flex items-center gap-2 font-mono">
                        <span className="rounded bg-black/60 border border-border/70 px-2.5 py-1 text-xs text-muted-foreground">
                          Cấp: <strong className="text-white">+{currentLevel}</strong>
                        </span>
                        {!isMax && (
                          <>
                            <ArrowRight className="size-4 text-purple-400" />
                            <span className="rounded bg-purple-950/80 border border-purple-400 px-2.5 py-1 text-xs font-bold text-purple-200 animate-pulse">
                              Lên: +{targetLevel}
                            </span>
                          </>
                        )}
                        {isMax && (
                          <span className="rounded bg-amber-500/20 border border-amber-400 px-2.5 py-1 text-xs font-bold text-amber-300">
                            ★ CẤP ĐỘ TỐI THƯỢNG
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bảng So Sánh Chỉ Số Nhận Được */}
                    <div className="mt-3">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1.5">
                        Biến động chỉ số sau khi cường hóa:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                        {/* ATK */}
                        {currentStatsObj.attackBonus !== 0 && (
                          <div className="rounded border border-red-500/30 bg-red-950/20 p-2">
                            <span className="text-[10px] text-red-300 block">Sức Tấn Công (ATK)</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-white">+{currentStatsObj.attackBonus}</span>
                              {!isMax && (
                                <span className="text-emerald-400 font-bold text-[11px]">
                                  ➔ +{nextStatsObj.attackBonus} (+{nextStatsObj.attackBonus - currentStatsObj.attackBonus})
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* DEF */}
                        {currentStatsObj.defenseBonus !== 0 && (
                          <div className="rounded border border-blue-500/30 bg-blue-950/20 p-2">
                            <span className="text-[10px] text-blue-300 block">Phòng Thủ (DEF)</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-white">+{currentStatsObj.defenseBonus}</span>
                              {!isMax && (
                                <span className="text-emerald-400 font-bold text-[11px]">
                                  ➔ +{nextStatsObj.defenseBonus} (+{nextStatsObj.defenseBonus - currentStatsObj.defenseBonus})
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* SPD */}
                        {currentStatsObj.speedBonus !== 0 && (
                          <div className="rounded border border-emerald-500/30 bg-emerald-950/20 p-2">
                            <span className="text-[10px] text-emerald-300 block">Tốc Độ (SPD)</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-white">+{currentStatsObj.speedBonus}</span>
                              {!isMax && (
                                <span className="text-emerald-400 font-bold text-[11px]">
                                  ➔ +{nextStatsObj.speedBonus} (+{nextStatsObj.speedBonus - currentStatsObj.speedBonus})
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* HP */}
                        {currentStatsObj.hpBonus !== 0 && (
                          <div className="rounded border border-teal-500/30 bg-teal-950/20 p-2">
                            <span className="text-[10px] text-teal-300 block">Vỏ Giáp (HP)</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-white">+{currentStatsObj.hpBonus}</span>
                              {!isMax && (
                                <span className="text-emerald-400 font-bold text-[11px]">
                                  ➔ +{nextStatsObj.hpBonus} (+{nextStatsObj.hpBonus - currentStatsObj.hpBonus})
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* SP */}
                        {currentStatsObj.spBonus !== 0 && (
                          <div className="rounded border border-cyan-500/30 bg-cyan-950/20 p-2">
                            <span className="text-[10px] text-cyan-300 block">Lõi Năng Lượng (SP)</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-white">+{currentStatsObj.spBonus}</span>
                              {!isMax && (
                                <span className="text-emerald-400 font-bold text-[11px]">
                                  ➔ +{nextStatsObj.spBonus} (+{nextStatsObj.spBonus - currentStatsObj.spBonus})
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Thanh Đo Tỉ Lệ Thành Công (Success Rate Gauge) */}
                  {!isMax && nextConfig && (
                    <div className="rounded-sm border border-border/70 bg-black/40 p-3">
                      <div className="flex items-center justify-between mb-1.5 text-xs font-mono">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="size-3.5 text-purple-400" />
                          Tỉ Lệ Thành Công Cấp +{targetLevel}:
                        </span>
                        <span
                          className={cn(
                            "font-bold",
                            nextConfig.successRate === 1.0
                              ? "text-emerald-400"
                              : nextConfig.successRate >= 0.6
                                ? "text-amber-300"
                                : "text-orange-400",
                          )}
                        >
                          {Math.round(nextConfig.successRate * 100)}%{" "}
                          {nextConfig.successRate === 1.0
                            ? "(100% An Toàn)"
                            : nextConfig.successRate >= 0.6
                              ? "(Thất bại giữ nguyên cấp)"
                              : "(Cấp cao thử thách)"}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded bg-secondary/80">
                        <div
                          className={cn(
                            "h-full transition-all duration-300",
                            nextConfig.successRate === 1.0
                              ? "bg-emerald-400"
                              : nextConfig.successRate >= 0.6
                                ? "bg-amber-400"
                                : "bg-orange-500",
                          )}
                          style={{ width: `${Math.round(nextConfig.successRate * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Chi Phí & Tài Nguyên Yêu Cầu */}
                  {!isMax && nextConfig && (
                    <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                      {/* Credits */}
                      <div
                        className={cn(
                          "rounded border p-2.5 flex items-center justify-between",
                          hasEnoughCredits
                            ? "border-amber-500/40 bg-amber-950/20"
                            : "border-red-500/50 bg-red-950/30",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Coins className="size-4 text-amber-400" />
                          <div>
                            <span className="text-[10px] text-muted-foreground block">Credits cần</span>
                            <span className="font-bold text-amber-300">
                              {nextConfig.creditsCost.toLocaleString("vi-VN")}
                            </span>
                          </div>
                        </div>
                        <span className={cn("text-[10px]", hasEnoughCredits ? "text-emerald-400" : "text-red-400")}>
                          Có: {progression.credits.toLocaleString("vi-VN")}
                        </span>
                      </div>

                      {/* Alloy */}
                      <div
                        className={cn(
                          "rounded border p-2.5 flex items-center justify-between",
                          hasEnoughAlloy
                            ? "border-purple-500/40 bg-purple-950/20"
                            : "border-red-500/50 bg-red-950/30",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="size-4 text-purple-400" />
                          <div>
                            <span className="text-[10px] text-muted-foreground block">Hợp Kim (Alloy) cần</span>
                            <span className="font-bold text-purple-300">
                              {nextConfig.alloyCost} Alloy
                            </span>
                          </div>
                        </div>
                        <span className={cn("text-[10px]", hasEnoughAlloy ? "text-emerald-400" : "text-red-400")}>
                          Có: {alloyCount}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Cam Kết Bảo Vệ Trang Bị (Anti-Frustration Guarantee Banner) */}
                  <div className="rounded border border-emerald-500/30 bg-emerald-950/20 p-2.5 flex items-center gap-2 text-xs text-emerald-300 font-mono">
                    <ShieldCheck className="size-4 shrink-0 text-emerald-400" />
                    <span>
                      <strong>BẢO VỆ TUYỆT ĐỐI:</strong> Thất bại không bao giờ làm vỡ hay rớt cấp trang bị! Cấp độ sẽ được bảo toàn nguyên vẹn.
                    </span>
                  </div>

                  {/* Kết Quả Lần Cường Hóa Gần Nhất */}
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

                  {/* Nút Thao Tác Cường Hóa */}
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

      {/* 6. Hộp thoại xác nhận Cài lại tiến trình (Reset Confirmation Modal) */}
      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full rounded-sm border border-red-500/60 bg-panel p-5 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="size-6 animate-pulse" />
              <h4 className="font-display text-sm font-bold uppercase tracking-wider">
                XÁC NHẬN CÀI LẠI TIẾN TRÌNH?
              </h4>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Toàn bộ dữ liệu cấp độ Vanguard, số EXP tích lũy, số Credits, Hợp Kim (Alloy) và trang bị cường hóa đã lưu trong trình duyệt sẽ được đưa về giá trị mặc định ban đầu. Hành động này không thể hoàn tác.
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
                className="text-xs font-display uppercase tracking-wider cursor-pointer"
              >
                Đồng ý xóa & Reset
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tái Chế / Rã Đồ Trong Hangar */}
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
              "font-bold text-xs animate-pulse",
              diff > 0 ? "text-emerald-400" : "text-red-400",
            )}
          >
            ➔ {preview} ({diff > 0 ? `+${diff}` : diff})
          </span>
        )}
      </div>
    </div>
  )
}
