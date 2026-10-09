"use client"

import { Button } from "@/components/ui/button"
import {
  calculateTotalVanguardStats,
  getExpRequiredForLevel,
  SAMPLE_STARFRONT_ITEMS,
} from "@/lib/game/progression"
import type {
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
  RotateCcw,
  Shield,
  Sparkles,
  Sword,
  X,
  Zap,
} from "lucide-react"
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

interface StarfrontHangarProps {
  progression: StarfrontProgression
  onEquipItem: (itemId: string, slot: StarfrontItemSlot) => void
  onUnequipSlot: (slot: StarfrontItemSlot) => void
  onResetSave: () => void
  onNavigateToCombat: () => void
}

export function StarfrontHangar({
  progression,
  onEquipItem,
  onUnequipSlot,
  onResetSave,
  onNavigateToCombat,
}: StarfrontHangarProps) {
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<StarfrontItemSlot | "all">("all")
  const [hoveredItem, setHoveredItem] = useState<StarfrontItem | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)

  const expRequired = getExpRequiredForLevel(progression.level)
  const expPercentage = Math.min(100, Math.round((progression.exp / expRequired) * 100))

  // Tính toán chỉ số hiện tại
  const currentStats = calculateTotalVanguardStats(
    progression.level,
    progression.inventory,
    progression.equipped,
  )

  // Tính toán chỉ số so sánh nếu hover vào 1 món đồ
  const previewEquipped = hoveredItem
    ? { ...progression.equipped, [hoveredItem.slot]: hoveredItem.id }
    : null

  const previewStats = previewEquipped
    ? calculateTotalVanguardStats(progression.level, progression.inventory, previewEquipped)
    : null

  const filteredInventory = progression.inventory.filter((item) =>
    selectedSlotFilter === "all" ? true : item.slot === selectedSlotFilter,
  )

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
                  XƯỞNG TRANG BỊ VANGUARD // STARFRONT HANGAR
                </h2>
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-xs font-bold text-cyan-300 border border-cyan-500/40">
                  CẤP {progression.level}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Quản lý kho vũ khí, khiên chắn và động cơ đẩy · Mọi nâng cấp đều thay đổi thực tế lực chiến trong đấu trường
              </p>
            </div>
          </div>

          {/* Credits & Chiến tích & Nút thao tác */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-sm border border-amber-500/40 bg-amber-950/30 px-3 py-1.5 font-mono text-xs text-amber-300">
              <Coins className="size-4 text-amber-400" />
              <span>Ngân sách:</span>
              <strong className="text-sm font-bold text-amber-200">
                {progression.credits.toLocaleString("vi-VN")}
              </strong>
              <span>Credits</span>
            </div>

            <div className="flex items-center gap-2 rounded-sm border border-border/70 bg-black/40 px-3 py-1.5 font-mono text-xs text-muted-foreground">
              <span>Thắng: <strong className="text-emerald-400">{progression.battlesWon}</strong></span>
              <span>·</span>
              <span>Bại: <strong className="text-red-400">{progression.battlesLost}</strong></span>
            </div>

            <Button
              onClick={onNavigateToCombat}
              size="sm"
              className="gap-1.5 font-display text-xs uppercase tracking-wider bg-cyan-500 text-black hover:bg-cyan-400"
            >
              <span>Vào Đấu Trường</span>
              <ArrowRight className="size-3.5" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetDialog(true)}
              className="gap-1 text-xs text-red-400 hover:text-red-300 hover:border-red-500"
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

      {/* 2. Hai cánh: 3 Ô Trang Bị Đang Dùng vs Bảng Chỉ Số Thực Tế */}
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
              Bấm [Tháo đồ] để gỡ hoặc chọn món bên dưới để đổi
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {(["weapon", "shield", "engine"] as StarfrontItemSlot[]).map((slotKey) => {
              const meta = SLOT_META[slotKey]
              const SlotIcon = meta.icon
              const equippedItemId = progression.equipped[slotKey]
              const equippedItem = progression.inventory.find((it) => it.id === equippedItemId)

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

                    {/* Chi tiết trang bị */}
                    {equippedItem ? (
                      <div className="mt-2.5">
                        <h4 className="font-display text-xs font-bold text-white">
                          {equippedItem.name}
                        </h4>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                          {equippedItem.desc}
                        </p>

                        {/* Điểm thưởng chỉ số */}
                        <div className="mt-2.5 flex flex-wrap gap-1 font-mono text-[10px]">
                          {equippedItem.attackBonus && (
                            <span className="rounded bg-red-950/60 px-1.5 py-0.5 text-red-300 border border-red-500/30">
                              ATK +{equippedItem.attackBonus}
                            </span>
                          )}
                          {equippedItem.defenseBonus && (
                            <span className="rounded bg-blue-950/60 px-1.5 py-0.5 text-blue-300 border border-blue-500/30">
                              DEF {equippedItem.defenseBonus > 0 ? `+${equippedItem.defenseBonus}` : equippedItem.defenseBonus}
                            </span>
                          )}
                          {equippedItem.speedBonus && (
                            <span className="rounded bg-emerald-950/60 px-1.5 py-0.5 text-emerald-300 border border-emerald-500/30">
                              SPD +{equippedItem.speedBonus}
                            </span>
                          )}
                          {equippedItem.hpBonus && (
                            <span className="rounded bg-teal-950/60 px-1.5 py-0.5 text-teal-300 border border-teal-500/30">
                              HP +{equippedItem.hpBonus}
                            </span>
                          )}
                          {equippedItem.spBonus && (
                            <span className="rounded bg-cyan-950/60 px-1.5 py-0.5 text-cyan-300 border border-cyan-500/30">
                              SP +{equippedItem.spBonus}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-muted-foreground/60">
                        <p className="text-xs italic">-- Chưa lắp trang bị --</p>
                        <p className="mt-1 text-[10px]">{meta.desc}</p>
                      </div>
                    )}
                  </div>

                  {/* Nút tháo trang bị */}
                  {equippedItem && (
                    <div className="mt-3 border-t border-border/40 pt-2 text-right">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onUnequipSlot(slotKey)}
                        className="text-[11px] text-red-400 hover:text-red-300 hover:bg-red-950/40"
                      >
                        <X className="size-3 mr-1" /> Tháo trang bị
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Cột 3: Bảng Chỉ Số Thực Tế & So Sánh (Stat Inspection Card) */}
        <div className="rounded-sm border border-cyan-500/40 bg-panel p-4 shadow-xl">
          <div className="mb-3 border-b border-border/60 pb-2">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
              CHỈ SỐ CHIẾN ĐẤU VANGUARD
            </h3>
            <p className="text-[10px] text-muted-foreground">
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
            <span className="font-bold text-cyan-300">💡 Lưu ý chiến thuật:</span> Tốc độ (SPD) quyết định ai ra đòn trước trong lượt. Tấn công (ATK) càng cao thì kỹ năng Xung Kích Quang càng bùng nổ sát thương.
          </div>
        </div>
      </div>

      {/* 3. Kho đồ sở hữu (Inventory List) */}
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
                    "rounded-xs border px-2.5 py-1 font-display text-[11px] transition-all",
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
                    <span className="font-display text-xs font-bold text-white group-hover:text-cyan-300">
                      {item.name}
                    </span>
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

                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                    {item.desc}
                  </p>

                  {/* Chỉ số cộng */}
                  <div className="mt-2.5 flex flex-wrap gap-1 font-mono text-[10px]">
                    {item.attackBonus && (
                      <span className="rounded bg-red-950/60 px-1.5 py-0.5 text-red-300 border border-red-500/30">
                        ATK +{item.attackBonus}
                      </span>
                    )}
                    {item.defenseBonus && (
                      <span className="rounded bg-blue-950/60 px-1.5 py-0.5 text-blue-300 border border-blue-500/30">
                        DEF {item.defenseBonus > 0 ? `+${item.defenseBonus}` : item.defenseBonus}
                      </span>
                    )}
                    {item.speedBonus && (
                      <span className="rounded bg-emerald-950/60 px-1.5 py-0.5 text-emerald-300 border border-emerald-500/30">
                        SPD +{item.speedBonus}
                      </span>
                    )}
                    {item.hpBonus && (
                      <span className="rounded bg-teal-950/60 px-1.5 py-0.5 text-teal-300 border border-teal-500/30">
                        HP +{item.hpBonus}
                      </span>
                    )}
                    {item.spBonus && (
                      <span className="rounded bg-cyan-950/60 px-1.5 py-0.5 text-cyan-300 border border-cyan-500/30">
                        SP +{item.spBonus}
                      </span>
                    )}
                  </div>
                </div>

                {/* Nút hành động */}
                <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">
                    Slot: {SLOT_META[item.slot].label}
                  </span>

                  {isEquipped ? (
                    <span className="flex items-center gap-1 font-display text-[11px] font-bold text-cyan-300">
                      <Check className="size-3.5" /> ĐANG TRANG BỊ
                    </span>
                  ) : (
                    <Button
                      size="xs"
                      onClick={() => onEquipItem(item.id, item.slot)}
                      className="gap-1 font-display text-[10px] uppercase bg-cyan-600 hover:bg-cyan-500 text-white"
                    >
                      <span>Trang bị</span>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. Hộp thoại xác nhận Cài lại tiến trình (Reset Confirmation Modal) */}
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
              Toàn bộ dữ liệu cấp độ Vanguard, số EXP tích lũy, số Credits và chiến tích trận đấu đã lưu trong trình duyệt sẽ được đưa về giá trị mặc định ban đầu (Cấp 1, 500 Credits). Hành động này không thể hoàn tác.
            </p>

            <div className="mt-5 flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetDialog(false)}
                className="text-xs font-display"
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
                className="text-xs font-display uppercase tracking-wider"
              >
                Đồng ý xóa & Reset
              </Button>
            </div>
          </div>
        </div>
      )}
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
