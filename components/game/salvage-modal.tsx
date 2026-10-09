"use client"

import { useState } from "react"
import type { StarfrontItem, StarfrontProgression } from "@/lib/game/types"
import {
  calculateSalvageEstimate,
  salvageInventoryItem,
  getItemDisplayName,
} from "@/lib/game/progression"
import { playClickSound, playLevelUpSound } from "@/lib/game/audio"
import { cn } from "@/lib/utils"
import {
  Recycle,
  AlertTriangle,
  X,
  Sparkles,
  Coins,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Lock,
} from "lucide-react"

interface SalvageModalProps {
  item: StarfrontItem | null
  progression: StarfrontProgression
  isOpen: boolean
  onClose: () => void
  onSuccess: (updated: StarfrontProgression, message: string) => void
}

export function SalvageModal({
  item,
  progression,
  isOpen,
  onClose,
  onSuccess,
}: SalvageModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen || !item) return null

  const isEquipped = Object.values(progression.equipped).includes(item.id)
  const estimate = calculateSalvageEstimate(item)
  const enhanceLvl = item.enhancementLevel || 0

  const handleConfirmSalvage = () => {
    if (isEquipped || isProcessing) return
    setIsProcessing(true)
    playClickSound()

    setTimeout(() => {
      const result = salvageInventoryItem(progression, item.id)
      setIsProcessing(false)
      if (result.success) {
        playLevelUpSound()
        onSuccess(result.updated, result.message)
        onClose()
      }
    }, 250)
  }

  const rarityColor =
    item.rarity === "legendary"
      ? "text-amber-400 border-amber-500/50 bg-amber-950/30"
      : item.rarity === "epic"
        ? "text-purple-400 border-purple-500/50 bg-purple-950/30"
        : item.rarity === "rare"
          ? "text-cyan-400 border-cyan-500/50 bg-cyan-950/30"
          : "text-slate-300 border-slate-600/50 bg-slate-900/40"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-sm border border-emerald-500/50 bg-zinc-950 p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <Recycle className="size-5 animate-spin-slow" />
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              TÁI CHẾ & PHÂN RÃ TRANG BỊ
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="rounded p-1 text-muted-foreground hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Thông tin vật phẩm */}
        <div className="mt-4 rounded-sm border border-border/60 bg-black/50 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold text-white">
                  {getItemDisplayName(item)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground font-mono leading-relaxed">
                {item.desc}
              </p>
            </div>
            <span className={cn("rounded px-2 py-0.5 text-[10px] font-mono uppercase font-bold border shrink-0", rarityColor)}>
              {item.rarity}
            </span>
          </div>

          {/* Chỉ số hiện thời */}
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-mono text-muted-foreground border-t border-border/40 pt-2">
            {item.attackBonus !== undefined && item.attackBonus !== 0 && (
              <span className="text-cyan-300">Công: +{item.attackBonus}</span>
            )}
            {item.defenseBonus !== undefined && item.defenseBonus !== 0 && (
              <span className="text-emerald-300">Thủ: +{item.defenseBonus}</span>
            )}
            {item.speedBonus !== undefined && item.speedBonus !== 0 && (
              <span className="text-purple-300">Tốc độ: +{item.speedBonus}</span>
            )}
            {item.hpBonus !== undefined && (
              <span className="text-amber-300">Máu: +{item.hpBonus}</span>
            )}
            {item.spBonus !== undefined && (
              <span className="text-sky-300">SP: +{item.spBonus}</span>
            )}
          </div>
        </div>

        {/* Bảng chi tiết tài nguyên hoàn trả */}
        <div className="mt-4 space-y-2.5">
          <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-amber-400" />
            <span>TÀI NGUYÊN THU HỒI DỰ KIẾN:</span>
          </h4>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Cột Hợp Kim Alloy */}
            <div className="rounded border border-emerald-500/40 bg-emerald-950/20 p-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">Hợp Kim (Alloy):</span>
                <span className="size-2 rounded-full bg-emerald-400" />
              </div>
              <div className="mt-1 text-xl font-bold font-mono text-emerald-300">
                +{estimate.alloyGained} <span className="text-xs text-emerald-400/80">Alloy</span>
              </div>
              <div className="mt-1 text-[10px] font-mono text-muted-foreground space-y-0.5 border-t border-emerald-500/20 pt-1">
                <div>Gốc phẩm chất: +{estimate.baseAlloy}</div>
                {enhanceLvl > 0 && (
                  <div className="text-emerald-400">
                    Hoàn trả (+{enhanceLvl}): +{estimate.enhancementAlloyRefund}
                  </div>
                )}
              </div>
            </div>

            {/* Cột Credits */}
            <div className="rounded border border-amber-500/40 bg-amber-950/20 p-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">Credits Thu Hồi:</span>
                <Coins className="size-3 text-amber-400" />
              </div>
              <div className="mt-1 text-xl font-bold font-mono text-amber-300">
                +{estimate.creditsGained.toLocaleString("vi-VN")}
              </div>
              <div className="mt-1 text-[10px] font-mono text-muted-foreground space-y-0.5 border-t border-amber-500/20 pt-1">
                <div>Gốc giá trị: +{estimate.baseCredits.toLocaleString("vi-VN")}</div>
                {enhanceLvl > 0 && (
                  <div className="text-amber-400">
                    Hoàn trả (+{enhanceLvl}): +{estimate.enhancementCreditsRefund.toLocaleString("vi-VN")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cảnh báo an toàn */}
        {isEquipped ? (
          <div className="mt-4 flex items-center gap-2 rounded border border-red-500/50 bg-red-950/30 p-2.5 text-xs font-mono text-red-300">
            <Lock className="size-4 shrink-0 text-red-400" />
            <span>
              <strong>KHÓA AN TOÀN:</strong> Trang bị này đang được lắp trên cơ giáp. Hãy tháo ra trong Hangar trước khi tái chế!
            </span>
          </div>
        ) : (
          <div className="mt-4 flex items-start gap-2 rounded border border-amber-500/30 bg-amber-950/20 p-2.5 text-[11px] font-mono text-amber-300/90 leading-snug">
            <AlertTriangle className="size-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              Cảnh báo: Thao tác này sẽ phân rã trang bị vĩnh viễn thành nguyên liệu Hợp Kim và Credits. Không thể hoàn tác sau khi xác nhận!
            </span>
          </div>
        )}

        {/* Nút hành động */}
        <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-border/50 pt-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="rounded border border-border/60 bg-zinc-900 px-4 py-2 font-mono text-xs text-muted-foreground hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            onClick={handleConfirmSalvage}
            disabled={isEquipped || isProcessing}
            className={cn(
              "flex items-center gap-2 rounded px-4 py-2 font-mono text-xs font-bold transition-all cursor-pointer shadow-md",
              isEquipped || isProcessing
                ? "border border-zinc-700 bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "border border-emerald-400 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 hover:text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]",
            )}
          >
            <Recycle className={cn("size-3.5", isProcessing && "animate-spin")} />
            <span>{isProcessing ? "Đang Phân Rã..." : "Xác Nhận Tái Chế"}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
