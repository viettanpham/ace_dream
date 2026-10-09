"use client"

import { Button } from "@/components/ui/button"
import { ARMORY_SHOP_ITEMS } from "@/lib/game/data"
import { playClickSound, playLevelUpSound } from "@/lib/game/audio"
import { buyShopItem, sellInventoryItem } from "@/lib/game/progression"
import type { ArmoryShopItem, StarfrontProgression } from "@/lib/game/types"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  ArrowDownToLine,
  Boxes,
  CheckCircle2,
  Coins,
  DollarSign,
  Heart,
  Shield,
  ShoppingBag,
  Sparkles,
  Sword,
  Wrench,
  Zap,
} from "lucide-react"
import { useState } from "react"

interface StarfrontShopProps {
  progression: StarfrontProgression
  onUpdateProgression: (updated: StarfrontProgression) => void
}

export function StarfrontShop({ progression, onUpdateProgression }: StarfrontShopProps) {
  const [shopTab, setShopTab] = useState<"buy" | "sell">("buy")
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null)

  const showNotification = (text: string, isError = false) => {
    setFeedback({ text, isError })
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleBuy = (item: ArmoryShopItem) => {
    playClickSound()
    const result = buyShopItem(progression, item)
    if (result.success) {
      playLevelUpSound()
      onUpdateProgression(result.updated)
      showNotification(result.message)
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

  // Lọc các vật phẩm trong kho không được trang bị để có thể bán
  const unequippedItems = progression.inventory.filter(
    (item) => !Object.values(progression.equipped).includes(item.id),
  )

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
                  CHỢ QUÂN SỰ VŨ TRỤ // STARFRONT ARMORY
                </h3>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-xs font-bold text-amber-300 border border-amber-400/40">
                  MUA BÁN VẬT PHẨM
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Sử dụng Credits chiến tích để trang bị vũ khí, giáp chắn và động cơ đẩy tối tân!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded bg-amber-950/40 border border-amber-400/50 px-3 py-1.5 shadow-[0_0_12px_rgba(251,191,36,0.2)]">
              <Coins className="size-4 text-amber-400 animate-bounce" />
              <div className="font-mono text-xs">
                <span className="text-[10px] text-muted-foreground block uppercase">Ngân Khố Hiện Có:</span>
                <strong className="text-sm text-white font-bold">
                  {progression.credits.toLocaleString("vi-VN")}
                </strong>{" "}
                <span className="text-amber-300">Credits</span>
              </div>
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

      {/* Tab chuyển đổi Mua / Bán */}
      <div className="flex items-center gap-2 border-b border-border/70 pb-2">
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
          <span>Mua Trang Bị Mới ({ARMORY_SHOP_ITEMS.length})</span>
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
          <Coins className="size-3.5" />
          <span>Bán Đồ Trong Kho Thu Hồi Tiền ({unequippedItems.length})</span>
        </button>
      </div>

      {/* GIAO DIỆN MUA TRANG BỊ */}
      {shopTab === "buy" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ARMORY_SHOP_ITEMS.map((shopItem) => {
            const it = shopItem.item
            const canAfford = progression.credits >= shopItem.buyPrice

            let rarityColor = "border-border text-muted-foreground"
            if (it.rarity === "rare") rarityColor = "border-blue-500/50 bg-blue-950/20 text-blue-300"
            if (it.rarity === "epic") rarityColor = "border-purple-500/50 bg-purple-950/20 text-purple-300"
            if (it.rarity === "legendary") rarityColor = "border-amber-500/50 bg-amber-950/20 text-amber-300"

            return (
              <div
                key={it.id}
                className="group relative flex flex-col justify-between rounded-sm border border-border/70 bg-panel/80 p-3.5 shadow-md hover:border-amber-400/60 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase border",
                        rarityColor,
                      )}
                    >
                      {it.rarity}
                    </span>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">
                      Ô: {it.slot === "weapon" ? "Vũ Khí" : it.slot === "shield" ? "Khiên" : "Động Cơ"}
                    </span>
                  </div>

                  <h4 className="mt-1.5 font-display text-sm font-bold text-foreground group-hover:text-amber-300 transition-colors">
                    {it.name}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {it.desc}
                  </p>

                  {/* Chỉ số cộng thêm */}
                  <div className="mt-2.5 flex flex-wrap gap-2 text-xs font-mono">
                    {it.attackBonus && (
                      <span className="flex items-center gap-1 text-red-400 font-bold bg-black/40 px-1.5 py-0.5 rounded">
                        <Sword className="size-3" /> +{it.attackBonus} ATK
                      </span>
                    )}
                    {it.defenseBonus && (
                      <span className="flex items-center gap-1 text-cyan-400 font-bold bg-black/40 px-1.5 py-0.5 rounded">
                        <Shield className="size-3" /> +{it.defenseBonus} DEF
                      </span>
                    )}
                    {it.speedBonus && (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold bg-black/40 px-1.5 py-0.5 rounded">
                        <Zap className="size-3" /> +{it.speedBonus} SPD
                      </span>
                    )}
                    {it.hpBonus && (
                      <span className="flex items-center gap-1 text-pink-400 font-bold bg-black/40 px-1.5 py-0.5 rounded">
                        <Heart className="size-3" /> +{it.hpBonus} HP
                      </span>
                    )}
                    {it.spBonus && (
                      <span className="flex items-center gap-1 text-amber-400 font-bold bg-black/40 px-1.5 py-0.5 rounded">
                        <Sparkles className="size-3" /> +{it.spBonus} SP
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-2.5">
                  <div className="font-mono text-xs">
                    <span className="text-[10px] text-muted-foreground block">Giá Bán:</span>
                    <strong className="text-amber-400 text-sm">
                      {shopItem.buyPrice.toLocaleString("vi-VN")}
                    </strong>{" "}
                    Credits
                  </div>

                  <Button
                    size="sm"
                    disabled={!canAfford}
                    onClick={() => handleBuy(shopItem)}
                    className={cn(
                      "font-display text-xs uppercase tracking-wider font-bold gap-1.5",
                      canAfford
                        ? "bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                        : "opacity-60",
                    )}
                  >
                    <ShoppingBag className="size-3.5" />
                    {canAfford ? "Mua Ngay" : "Thiếu Tiền"}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* GIAO DIỆN BÁN TRANG BỊ THU HỒI TIỀN */
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
                const basePrice = item.price || (
                  item.rarity === "legendary" ? 2500 :
                  item.rarity === "epic" ? 1200 :
                  item.rarity === "rare" ? 500 : 200
                )
                const sellValue = Math.max(50, Math.round(basePrice * 0.5))

                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-sm border border-border/70 bg-panel/60 p-3 hover:border-border transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-display text-xs font-bold text-foreground">
                          {item.name}
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
                        className="gap-1 border border-amber-500/40 text-amber-300 hover:bg-amber-950/60"
                      >
                        <Coins className="size-3" /> Bán Món Này
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
