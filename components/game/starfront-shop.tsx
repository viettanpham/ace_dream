"use client"

import { Button } from "@/components/ui/button"
import { ARMORY_SHOP_ITEMS } from "@/lib/game/data"
import { playClickSound, playLevelUpSound } from "@/lib/game/audio"
import {
  buyShopItem,
  sellInventoryItem,
  isShopItemUnlocked,
  refreshArmoryShop,
  calculateSalvageEstimate,
  getItemDisplayName,
} from "@/lib/game/progression"
import type { ArmoryShopItem, StarfrontItem, StarfrontProgression } from "@/lib/game/types"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Coins,
  Heart,
  Loader2,
  Lock,
  Recycle,
  RotateCcw,
  Shield,
  ShoppingBag,
  Sparkles,
  Sword,
  Tag,
  Zap,
} from "lucide-react"
import { useState } from "react"
import { SalvageModal } from "./salvage-modal"

interface StarfrontShopProps {
  progression: StarfrontProgression
  onUpdateProgression: (updated: StarfrontProgression) => void
}

export function StarfrontShop({ progression, onUpdateProgression }: StarfrontShopProps) {
  const [shopTab, setShopTab] = useState<"buy" | "sell" | "salvage">("buy")
  const [feedback, setFeedback] = useState<{
    text: string
    isError?: boolean
    priceDetail?: string
    costType?: "free" | "credits" | "none"
  } | null>(null)
  const [selectedSalvageItem, setSelectedSalvageItem] = useState<StarfrontItem | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const showNotification = (
    text: string,
    isError = false,
    priceDetail?: string,
    costType?: "free" | "credits" | "none",
  ) => {
    setFeedback({ text, isError, priceDetail, costType })
    setTimeout(() => setFeedback(null), 4500)
  }

  const handleBuy = (item: ArmoryShopItem) => {
    playClickSound()
    const unlockCheck = isShopItemUnlocked(item, progression)
    if (!unlockCheck.unlocked) {
      showNotification(`Vật phẩm chưa mở khóa! ${unlockCheck.reason}`, true)
      return
    }

    const result = buyShopItem(progression, item)
    if (result.success) {
      playLevelUpSound()
      onUpdateProgression(result.updated)
      showNotification(
        result.message,
        false,
        `-${item.buyPrice.toLocaleString("vi-VN")} Credits`,
        "credits",
      )
    } else {
      showNotification(result.message, true)
    }
  }

  const handleSell = (itemId: string) => {
    playClickSound()
    const result = sellInventoryItem(progression, itemId)
    if (result.success) {
      playLevelUpSound()
      onUpdateProgression(result.updated)
      showNotification(result.message)
    } else {
      showNotification(result.message, true)
    }
  }

  const handleRefreshShop = () => {
    if (isRefreshing) return
    playClickSound()

    const freeRefreshes = progression.freeShopRefreshes || 0
    const cost = 100
    const hasEnoughCredits = progression.credits >= cost

    // Kiểm tra sớm điều kiện tài chính trước khi tải
    if (freeRefreshes === 0 && !hasEnoughCredits) {
      showNotification(
        `Không đủ Credits để làm mới gian hàng! Cần ${cost} Credits, ngân khố hiện có ${progression.credits.toLocaleString("vi-VN")} Credits.`,
        true,
        `Thiếu ${(cost - progression.credits).toLocaleString("vi-VN")} Credits`,
        "credits",
      )
      return
    }

    // Kích hoạt trạng thái loading và giải mã danh mục vũ khí
    setIsRefreshing(true)

    setTimeout(() => {
      const result = refreshArmoryShop(progression)
      setIsRefreshing(false)

      if (result.success) {
        playLevelUpSound()
        onUpdateProgression(result.updated)

        if (freeRefreshes > 0) {
          showNotification(
            result.message,
            false,
            `Miễn phí • Còn ${result.updated.freeShopRefreshes ?? 0} lượt`,
            "free",
          )
        } else {
          showNotification(
            result.message,
            false,
            `-100 Credits (Dư: ${result.updated.credits.toLocaleString("vi-VN")} Cr)`,
            "credits",
          )
        }
      } else {
        showNotification(result.message, true, undefined, "none")
      }
    }, 550)
  }

  // Lọc các vật phẩm trong kho không được trang bị để có thể bán hoặc tái chế
  const unequippedItems = progression.inventory.filter(
    (item) => !Object.values(progression.equipped).includes(item.id),
  )

  const currentAlloy = progression.alloy ?? 25
  const freeRefreshes = progression.freeShopRefreshes ?? 0

  const shopItemsToDisplay =
    progression.currentShopItems && progression.currentShopItems.length > 0
      ? progression.currentShopItems
      : ARMORY_SHOP_ITEMS

  return (
    <div className="flex flex-col gap-4 animate-in fade-in">
      {/* 1. Header Chợ Quân Sự */}
      <div className="rounded-sm border border-cyan-500/40 bg-gradient-to-r from-panel/90 via-black/80 to-panel/90 p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xs border border-amber-400/60 bg-amber-950/60 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
              <ShoppingBag className="size-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-white tracking-wider">
                  CHỢ QUÂN SỰ VŨ TRỤ // STARFRONT ARMORY & RECYCLING
                </h3>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-xs font-bold text-amber-300 border border-amber-400/40">
                  PHASE 5.6
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Mua sắm trang bị theo Sector, bán trang bị lấy Credits hoặc rã đồ thu hồi Hợp Kim (Alloy)!
              </p>
            </div>
          </div>

          {/* Ngân Khố, Hợp Kim & Lượt Làm Mới */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Credits */}
            <div className="flex items-center gap-2 rounded bg-amber-950/40 border border-amber-400/50 px-3 py-1.5 shadow-[0_0_12px_rgba(251,191,36,0.2)]">
              <Coins className="size-4 text-amber-400" />
              <div className="font-mono text-xs">
                <span className="text-[10px] text-muted-foreground block uppercase">Ngân Khố:</span>
                <strong className="text-sm text-white font-bold">
                  {progression.credits.toLocaleString("vi-VN")}
                </strong>{" "}
                <span className="text-amber-300">Credits</span>
              </div>
            </div>

            {/* Alloy */}
            <div className="flex items-center gap-2 rounded bg-emerald-950/40 border border-emerald-400/50 px-3 py-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <Recycle className="size-4 text-emerald-400" />
              <div className="font-mono text-xs">
                <span className="text-[10px] text-muted-foreground block uppercase">Hợp Kim Cường Hóa:</span>
                <strong className="text-sm text-white font-bold">
                  {currentAlloy}
                </strong>{" "}
                <span className="text-emerald-300">Alloy</span>
              </div>
            </div>

            {/* Lượt làm mới miễn phí */}
            <div className="flex items-center gap-2 rounded bg-cyan-950/40 border border-cyan-400/50 px-3 py-1.5 shadow-[0_0_12px_rgba(34,211,238,0.2)]">
              <RotateCcw className="size-4 text-cyan-400" />
              <div className="font-mono text-xs">
                <span className="text-[10px] text-muted-foreground block uppercase">Làm Mới Miễn Phí:</span>
                <strong className="text-sm text-white font-bold">
                  {freeRefreshes}
                </strong>{" "}
                <span className="text-cyan-300">Lượt</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thông báo thao tác kèm chi tiết khấu trừ giá tiền */}
      {feedback && (
        <div
          className={cn(
            "rounded-sm border p-3 font-mono text-xs flex flex-wrap items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2 shadow-md",
            feedback.isError
              ? "border-red-500/50 bg-red-950/80 text-red-200"
              : "border-emerald-500/50 bg-emerald-950/80 text-emerald-200",
          )}
        >
          <div className="flex items-center gap-2">
            {feedback.isError ? (
              <AlertTriangle className="size-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            )}
            <span className="font-medium">{feedback.text}</span>
          </div>

          {feedback.priceDetail && (
            <div
              className={cn(
                "rounded px-2.5 py-0.5 text-[11px] font-bold border shrink-0 font-mono shadow-sm",
                feedback.costType === "free"
                  ? "border-emerald-400/60 bg-emerald-900/60 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.25)]"
                  : feedback.costType === "credits"
                  ? "border-amber-400/60 bg-amber-900/60 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.25)]"
                  : "border-zinc-500/40 bg-zinc-900 text-zinc-300",
              )}
            >
              {feedback.priceDetail}
            </div>
          )}
        </div>
      )}

      {/* Thanh Điều Hướng 3 Tab: Mua / Bán / Tái Chế */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              playClickSound()
              setShopTab("buy")
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-xs border px-3 py-1.5 font-display text-xs transition-all cursor-pointer",
              shopTab === "buy"
                ? "border-amber-400 bg-amber-950/60 text-amber-200 font-bold shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                : "border-border/60 text-muted-foreground hover:text-foreground",
            )}
          >
            <ShoppingBag className="size-3.5" />
            <span>Mua Trang Bị ({shopItemsToDisplay.length})</span>
          </button>

          <button
            onClick={() => {
              playClickSound()
              setShopTab("salvage")
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-xs border px-3 py-1.5 font-display text-xs transition-all cursor-pointer",
              shopTab === "salvage"
                ? "border-emerald-400 bg-emerald-950/60 text-emerald-200 font-bold shadow-[0_0_10px_rgba(16,185,129,0.25)]"
                : "border-border/60 text-muted-foreground hover:text-emerald-300",
            )}
          >
            <Recycle className="size-3.5 text-emerald-400" />
            <span>Tái Chế / Rã Đồ Lấy Alloy ({unequippedItems.length})</span>
          </button>

          <button
            onClick={() => {
              playClickSound()
              setShopTab("sell")
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-xs border px-3 py-1.5 font-display text-xs transition-all cursor-pointer",
              shopTab === "sell"
                ? "border-amber-400 bg-amber-950/60 text-amber-200 font-bold shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                : "border-border/60 text-muted-foreground hover:text-foreground",
            )}
          >
            <Coins className="size-3.5 text-amber-400" />
            <span>Bán Lấy Credits ({unequippedItems.length})</span>
          </button>
        </div>

        {/* Nút Làm Mới Nhanh trên thanh Tab */}
        {shopTab === "buy" && (
          <button
            type="button"
            onClick={handleRefreshShop}
            disabled={isRefreshing || (freeRefreshes === 0 && progression.credits < 100)}
            className={cn(
              "flex items-center gap-1.5 rounded-xs border px-3 py-1.5 font-mono text-xs transition-all cursor-pointer shadow-sm select-none",
              isRefreshing
                ? "border-cyan-400 bg-cyan-950/80 text-cyan-200 cursor-wait animate-pulse"
                : freeRefreshes > 0
                ? "border-emerald-500/50 bg-emerald-950/50 text-emerald-200 hover:bg-emerald-950 hover:border-emerald-400"
                : progression.credits >= 100
                ? "border-cyan-500/40 bg-cyan-950/40 text-cyan-200 hover:bg-cyan-950/80 hover:border-cyan-400"
                : "border-red-500/30 bg-zinc-950/60 text-zinc-500 cursor-not-allowed opacity-60",
            )}
          >
            {isRefreshing ? (
              <Loader2 className="size-3.5 text-cyan-400 animate-spin" />
            ) : (
              <RotateCcw className="size-3.5 text-cyan-400" />
            )}
            <span>
              {isRefreshing ? (
                "Đang Quét..."
              ) : (
                <>
                  Làm Mới{" "}
                  {freeRefreshes > 0 ? (
                    <strong className="text-emerald-400">(Miễn phí: {freeRefreshes})</strong>
                  ) : (
                    <span className="text-amber-300">(100 Cr)</span>
                  )}
                </>
              )}
            </span>
          </button>
        )}
      </div>

      {/* GIAO DIỆN 1: MUA TRANG BỊ */}
      {shopTab === "buy" && (
        <div className="flex flex-col gap-3">
          {/* BANNER ĐIỀU KHIỂN & BẢNG GIÁ LÀM MỚI (MILITARY SHOP REFRESH UI) */}
          <div className="rounded-sm border border-cyan-500/40 bg-gradient-to-r from-panel/95 via-black/80 to-panel/95 p-3.5 shadow-xl backdrop-blur-md">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
              {/* Thông tin bảng giá và chính sách làm mới */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-xs border border-cyan-400/50 bg-cyan-950/60 shadow-[0_0_10px_rgba(34,211,238,0.25)]">
                    <Sparkles className="size-3.5 text-cyan-300" />
                  </div>
                  <div>
                    <h4 className="font-display text-xs font-bold uppercase tracking-wider text-white">
                      QUÂN NHU VŨ TRỤ // LÀM MỚI GIAN HÀNG (ARMORY RESTOCK)
                    </h4>
                    <span className="text-[10px] font-mono text-cyan-300/80">
                      Ngẫu nhiên lại 6 vật phẩm trang bị theo bể Sector & phẩm chất
                    </span>
                  </div>
                </div>

                {/* Thẻ chi tiết định giá và tài chính */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <div className="flex items-center gap-1.5 rounded bg-black/50 border border-border/70 px-2.5 py-1 font-mono text-xs">
                    <span className="text-[11px] text-muted-foreground uppercase">Đơn giá:</span>
                    <strong className="text-amber-300 font-bold">100 Credits</strong>
                  </div>

                  <div className="flex items-center gap-1.5 rounded bg-black/50 border border-border/70 px-2.5 py-1 font-mono text-xs">
                    <span className="text-[11px] text-muted-foreground uppercase">Lượt miễn phí:</span>
                    {freeRefreshes > 0 ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                        {freeRefreshes} lượt (Ưu tiên)
                      </span>
                    ) : (
                      <span className="text-zinc-500">0 lượt</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 rounded bg-black/50 border border-border/70 px-2.5 py-1 font-mono text-xs">
                    <span className="text-[11px] text-muted-foreground uppercase">Dự toán:</span>
                    {freeRefreshes > 0 ? (
                      <span className="text-emerald-300 font-bold">0 Credits (Miễn phí)</span>
                    ) : progression.credits >= 100 ? (
                      <span className="text-amber-300 font-bold">-100 Credits (Khả dụng)</span>
                    ) : (
                      <span className="text-red-400 font-bold">
                        Thiếu {(100 - progression.credits).toLocaleString("vi-VN")} Credits
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Visual Button: Nút Làm Mới Trực Quan */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleRefreshShop}
                  disabled={isRefreshing || (freeRefreshes === 0 && progression.credits < 100)}
                  className={cn(
                    "group relative flex items-center justify-center gap-2.5 rounded-xs border px-4 py-2.5 font-display text-xs uppercase tracking-wider font-bold transition-all cursor-pointer shadow-lg select-none",
                    isRefreshing
                      ? "border-cyan-400 bg-cyan-950/80 text-cyan-200 cursor-wait shadow-[0_0_18px_rgba(34,211,238,0.4)]"
                      : freeRefreshes > 0
                      ? "border-emerald-400/90 bg-gradient-to-r from-emerald-950/90 via-black to-emerald-950/90 hover:border-emerald-300 text-emerald-200 hover:text-white shadow-[0_0_16px_rgba(16,185,129,0.35)] active:scale-95"
                      : progression.credits >= 100
                      ? "border-cyan-400/90 bg-gradient-to-r from-cyan-950/90 via-black to-cyan-950/90 hover:border-cyan-300 text-cyan-200 hover:text-white shadow-[0_0_16px_rgba(34,211,238,0.35)] active:scale-95"
                      : "border-red-500/40 bg-zinc-950/80 text-zinc-500 cursor-not-allowed opacity-60",
                  )}
                  title={
                    freeRefreshes > 0
                      ? `Làm mới miễn phí (Còn ${freeRefreshes} lượt)`
                      : progression.credits >= 100
                      ? "Làm mới với giá 100 Credits"
                      : `Không đủ Credits (Cần 100 Credits, hiện có ${progression.credits} Credits)`
                  }
                >
                  {isRefreshing ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-cyan-400" />
                      <span className="tracking-widest">Đang Quét Kho Hàng...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="size-4 text-cyan-400 group-hover:rotate-180 transition-transform duration-500" />
                      <span>LÀM MỚI GIAN HÀNG</span>
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 font-mono text-[11px] font-bold border",
                          freeRefreshes > 0
                            ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.25)]"
                            : progression.credits >= 100
                            ? "border-amber-400/60 bg-amber-500/20 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.25)]"
                            : "border-red-400/40 bg-red-950/60 text-red-400",
                        )}
                      >
                        {freeRefreshes > 0 ? (
                          `MIỄN PHÍ (${freeRefreshes})`
                        ) : progression.credits >= 100 ? (
                          "100 CREDITS"
                        ) : (
                          "THIẾU TIỀN"
                        )}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* HIỂN THỊ LOADING HOẶC DANH SÁCH VẬT PHẨM */}
          {isRefreshing ? (
            <div className="space-y-3 animate-in fade-in">
              {/* Radar quét trung tâm */}
              <div className="relative overflow-hidden rounded-sm border border-cyan-400/60 bg-gradient-to-r from-cyan-950/90 via-black to-cyan-950/90 p-4 text-center shadow-[0_0_20px_rgba(34,211,238,0.25)]">
                <div className="relative flex flex-col items-center justify-center gap-1.5">
                  <div className="flex items-center gap-2 font-display text-sm font-bold tracking-wider text-cyan-300">
                    <Loader2 className="size-4 animate-spin text-cyan-400" />
                    <span>HỆ THỐNG ĐANG QUÉT & TÁI LẬP KHO QUÂN NHU...</span>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    Đang ngẫu nhiên hóa trang bị • Kiểm tra điều kiện mở khóa Sector • Thiết lập giá niêm yết Credits
                  </p>
                </div>
              </div>

              {/* 6 Skeleton Hologram Cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  "QUÉT VŨ KHÍ NĂNG LƯỢNG",
                  "GIẢI MÃ PHÒNG HỘ SHIELD",
                  "TÍNH TOÁN ĐỘNG CƠ WARP",
                  "ĐỒNG BỘ CHỈ SỐ HUY HIỆU",
                  "KẾT NỐI KHO VẬT TƯ QUÂN SỰ",
                  "ĐỊNH GIÁ TÍN DỤNG CHỢ",
                ].map((label, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden rounded-sm border border-cyan-500/30 bg-panel/70 p-4 shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="h-4 w-20 rounded bg-cyan-950/80 border border-cyan-500/40 animate-pulse text-[10px] font-mono text-cyan-400 flex items-center justify-center px-1">
                          SCANNING...
                        </span>
                        <span className="h-3 w-16 rounded bg-zinc-800 animate-pulse" />
                      </div>

                      <div className="space-y-1.5">
                        <div className="h-5 w-3/4 rounded bg-cyan-900/40 animate-pulse" />
                        <span className="font-mono text-[10px] text-cyan-400/80 block">
                          [{label}]
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="h-3 w-full rounded bg-zinc-900/80 animate-pulse" />
                        <div className="h-3 w-4/5 rounded bg-zinc-900/80 animate-pulse" />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <div className="h-4 w-16 rounded bg-zinc-800/80 animate-pulse" />
                        <div className="h-4 w-16 rounded bg-zinc-800/80 animate-pulse" />
                      </div>

                      <div className="flex items-center justify-between border-t border-border/40 pt-2.5">
                        <div className="h-4 w-20 rounded bg-amber-950/50 border border-amber-500/30 animate-pulse" />
                        <div className="h-7 w-20 rounded bg-cyan-950/80 border border-cyan-500/40 animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300">
          {shopItemsToDisplay.map((shopItem) => {
            const it = shopItem.item
            const unlockCheck = isShopItemUnlocked(shopItem, progression)
            const canAfford = progression.credits >= shopItem.buyPrice && unlockCheck.unlocked

            let rarityColor = "border-border text-muted-foreground"
            if (it.rarity === "rare") rarityColor = "border-blue-500/50 bg-blue-950/20 text-blue-300"
            if (it.rarity === "epic") rarityColor = "border-purple-500/50 bg-purple-950/20 text-purple-300"
            if (it.rarity === "legendary") rarityColor = "border-amber-500/50 bg-amber-950/20 text-amber-300 font-bold"

            return (
              <div
                key={it.id}
                className={cn(
                  "group relative flex flex-col justify-between rounded-sm border p-3.5 shadow-md transition-all",
                  unlockCheck.unlocked
                    ? "border-border/70 bg-panel/80 hover:border-amber-400/60"
                    : "border-border/40 bg-zinc-950/70 opacity-80",
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px] uppercase border", rarityColor)}>
                      {it.rarity}
                    </span>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">
                      Ô: {it.slot === "weapon" ? "Vũ Khí" : it.slot === "shield" ? "Khiên" : "Động Cơ"}
                    </span>
                  </div>

                  <h4 className="mt-1.5 font-display text-sm font-bold text-foreground group-hover:text-amber-300 transition-colors">
                    {it.name}
                  </h4>

                  {/* Nhãn Tầng Phân Cấp */}
                  {shopItem.tierName && (
                    <span className="mt-0.5 inline-block text-[10px] font-mono text-cyan-300/90 font-bold">
                      {shopItem.tierName}
                    </span>
                  )}

                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {it.desc}
                  </p>

                  {/* Chỉ số cộng thêm */}
                  <div className="mt-2.5 flex flex-wrap gap-2 text-xs font-mono">
                    {it.attackBonus !== undefined && it.attackBonus !== 0 && (
                      <span className="flex items-center gap-1 text-red-400 font-bold bg-black/40 px-1.5 py-0.5 rounded">
                        <Sword className="size-3" /> +{it.attackBonus} ATK
                      </span>
                    )}
                    {it.defenseBonus !== undefined && it.defenseBonus !== 0 && (
                      <span className="flex items-center gap-1 text-cyan-400 font-bold bg-black/40 px-1.5 py-0.5 rounded">
                        <Shield className="size-3" /> +{it.defenseBonus} DEF
                      </span>
                    )}
                    {it.speedBonus !== undefined && it.speedBonus !== 0 && (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold bg-black/40 px-1.5 py-0.5 rounded">
                        <Zap className="size-3" /> +{it.speedBonus} SPD
                      </span>
                    )}
                    {it.hpBonus !== undefined && (
                      <span className="flex items-center gap-1 text-pink-400 font-bold bg-black/40 px-1.5 py-0.5 rounded">
                        <Heart className="size-3" /> +{it.hpBonus} HP
                      </span>
                    )}
                    {it.spBonus !== undefined && (
                      <span className="flex items-center gap-1 text-amber-400 font-bold bg-black/40 px-1.5 py-0.5 rounded">
                        <Sparkles className="size-3" /> +{it.spBonus} SP
                      </span>
                    )}
                  </div>
                </div>

                {/* Khóa theo Sector hoặc Giá mua */}
                <div className="mt-4 border-t border-border/40 pt-2.5">
                  {!unlockCheck.unlocked ? (
                    <div className="flex items-center gap-2 rounded bg-zinc-900/80 p-2 text-xs font-mono text-amber-400 border border-amber-500/30">
                      <Lock className="size-4 shrink-0 text-amber-400" />
                      <span className="text-[11px] leading-tight">{unlockCheck.reason}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-xs">
                        <span className="text-[10px] text-muted-foreground block">Giá Bán:</span>
                        <strong className="text-amber-400 text-sm">
                          {shopItem.buyPrice.toLocaleString("vi-VN")}
                        </strong>{" "}
                        Credits
                      </div>

                      {shopItem.isPurchased ? (
                        <Button
                          size="sm"
                          disabled
                          className="font-display text-xs uppercase tracking-wider font-bold gap-1.5 opacity-70 bg-zinc-800 text-emerald-400 border border-emerald-500/40"
                        >
                          <CheckCircle2 className="size-3.5 text-emerald-400" />
                          Đã Mua
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={!canAfford}
                          onClick={() => handleBuy(shopItem)}
                          className={cn(
                            "font-display text-xs uppercase tracking-wider font-bold gap-1.5 cursor-pointer",
                            canAfford
                              ? "bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                              : "opacity-60",
                          )}
                        >
                          <ShoppingBag className="size-3.5" />
                          {canAfford ? "Mua Ngay" : "Thiếu Tiền"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
            </div>
          )}
        </div>
      )}

      {/* GIAO DIỆN 2: TÁI CHẾ / RÃ ĐỒ THU HỒI ALLOY */}
      {shopTab === "salvage" && (
        <div className="space-y-3">
          <div className="rounded-sm border border-emerald-500/40 bg-emerald-950/20 p-3 text-xs font-mono text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Recycle className="size-4 text-emerald-400 shrink-0" />
              <span>
                <strong>TRẠM TÁI CHẾ QUÂN ĐỘI:</strong> Rã trang bị không dùng để thu hồi <strong>Hợp Kim (Alloy)</strong> và <strong>Credits</strong>. Trang bị có cấp cường hóa cao sẽ hoàn trả thêm nhiều Alloy!
              </span>
            </div>
          </div>

          {unequippedItems.length === 0 ? (
            <div className="rounded-sm border border-border/60 bg-panel/40 p-8 text-center text-muted-foreground">
              <Boxes className="size-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="font-display text-sm font-bold text-foreground">Không có trang bị rảnh rỗi trong kho đồ!</p>
              <p className="text-xs mt-1">
                Toàn bộ trang bị đang được lắp trên cơ giáp hoặc kho đồ rỗng. Hãy tháo bớt trang bị để tiến hành rã đồ.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {unequippedItems.map((item) => {
                const estimate = calculateSalvageEstimate(item)
                const enhanceLvl = item.enhancementLevel || 0

                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-sm border border-border/70 bg-panel/60 p-3 hover:border-emerald-500/50 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-display text-xs font-bold text-foreground">
                          {getItemDisplayName(item)}
                        </span>
                        <span className="font-mono text-[10px] uppercase text-muted-foreground">
                          {item.slot}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{item.desc}</p>

                      {/* Ước tính thu hồi trên thẻ */}
                      <div className="mt-2.5 flex items-center justify-between rounded bg-black/40 p-1.5 text-[11px] font-mono border border-border/40">
                        <span className="text-emerald-300 font-bold">
                          +{estimate.alloyGained} Alloy {enhanceLvl > 0 && `(+${estimate.enhancementAlloyRefund} thưởng)`}
                        </span>
                        <span className="text-amber-300 font-bold">
                          +{estimate.creditsGained.toLocaleString("vi-VN")} Cr
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {item.rarity.toUpperCase()}
                      </span>
                      <Button
                        size="xs"
                        onClick={() => setSelectedSalvageItem(item)}
                        className="gap-1 border border-emerald-500/50 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 cursor-pointer shadow-sm"
                      >
                        <Recycle className="size-3" /> Tái Chế ♻️
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* GIAO DIỆN 3: BÁN TRANG BỊ THU HỒI CREDITS */}
      {shopTab === "sell" && (
        <div className="space-y-3">
          {unequippedItems.length === 0 ? (
            <div className="rounded-sm border border-border/60 bg-panel/40 p-8 text-center text-muted-foreground">
              <Boxes className="size-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="font-display text-sm font-bold text-foreground">Kho đồ rỗng hoặc toàn bộ trang bị đang được lắp!</p>
              <p className="text-xs mt-1">
                Hãy đánh thắng các ải hoặc tháo bớt trang bị không dùng để có thể bán lại thu hồi Credits.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {unequippedItems.map((item) => {
                const basePrice =
                  item.price ||
                  (item.rarity === "legendary"
                    ? 2500
                    : item.rarity === "epic"
                      ? 1200
                      : item.rarity === "rare"
                        ? 500
                        : 200)
                const sellValue = Math.max(50, Math.round(basePrice * 0.5))

                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-sm border border-border/70 bg-panel/60 p-3 hover:border-border transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-display text-xs font-bold text-foreground">
                          {getItemDisplayName(item)}
                        </span>
                        <span className="font-mono text-[10px] uppercase text-muted-foreground">
                          {item.slot}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{item.desc}</p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2">
                      <span className="font-mono text-xs text-amber-300">
                        Thu hồi: <strong>+{sellValue.toLocaleString("vi-VN")}</strong> Cr
                      </span>
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => handleSell(item.id)}
                        className="gap-1 border border-amber-500/40 text-amber-300 hover:bg-amber-950/60 cursor-pointer"
                      >
                        <Coins className="size-3" /> Bán Lấy Credits
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Tái Chế / Phân Rã */}
      <SalvageModal
        item={selectedSalvageItem}
        progression={progression}
        isOpen={Boolean(selectedSalvageItem)}
        onClose={() => setSelectedSalvageItem(null)}
        onSuccess={(updated, message) => {
          onUpdateProgression(updated)
          showNotification(message)
        }}
      />
    </div>
  )
}
