"use client"

import { Button } from "@/components/ui/button"
import { STARFRONT_GEAR_DEFS } from "@/lib/game/data"
import { playClickSound } from "@/lib/game/audio"
import {
  calculateTotalGearStats,
  getEnhancedItemStats,
  getExpRequiredForLevel,
  getItemDisplayName,
} from "@/lib/game/progression"
import { gearPower } from "@/lib/game/engine"
import type {
  StarfrontGearId,
  StarfrontItemSlot,
  StarfrontProgression,
} from "@/lib/game/types"
import { cn } from "@/lib/utils"
import {
  Boxes,
  CheckCircle2,
  ChevronRight,
  Coins,
  Cpu,
  Flame,
  Globe2,
  Layers,
  Radio,
  Rocket,
  Shield,
  ShoppingBag,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Zap,
} from "lucide-react"

interface StarfrontHomeProps {
  progression: StarfrontProgression
  onNavigate: (section: "battlefield" | "missions" | "shop" | "hangar") => void
  onSelectGear: (gearId: StarfrontGearId) => void
}

const GEAR_THEMES: Record<
  StarfrontGearId,
  {
    border: string
    borderHover: string
    badgeBg: string
    badgeText: string
    badgeBorder: string
    glow: string
    accentColor: string
  }
> = {
  vanguard: {
    border: "border-cyan-500/40",
    borderHover: "hover:border-cyan-300",
    badgeBg: "bg-cyan-500/20",
    badgeText: "text-cyan-300",
    badgeBorder: "border-cyan-500/50",
    glow: "shadow-[0_0_20px_rgba(6,182,212,0.25)]",
    accentColor: "text-cyan-300",
  },
  falcon: {
    border: "border-purple-500/40",
    borderHover: "hover:border-purple-300",
    badgeBg: "bg-purple-500/20",
    badgeText: "text-purple-300",
    badgeBorder: "border-purple-500/50",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.25)]",
    accentColor: "text-purple-300",
  },
  aegis: {
    border: "border-amber-500/40",
    borderHover: "hover:border-amber-300",
    badgeBg: "bg-amber-500/20",
    badgeText: "text-amber-300",
    badgeBorder: "border-amber-500/50",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.25)]",
    accentColor: "text-amber-300",
  },
}

export function StarfrontHome({
  progression,
  onNavigate,
  onSelectGear,
}: StarfrontHomeProps) {
  const activeGearId: StarfrontGearId = progression.activeGearId || "vanguard"
  const activeGearDef = STARFRONT_GEAR_DEFS[activeGearId] || STARFRONT_GEAR_DEFS.vanguard
  const theme = GEAR_THEMES[activeGearId] || GEAR_THEMES.vanguard

  const expRequired = getExpRequiredForLevel(progression.level)
  const expPct = Math.min(100, Math.round((progression.exp / expRequired) * 100))
  const alloyCount = progression.alloy ?? 25

  // Tính toán chỉ số thực tế bao gồm Gear base, growth và 3 trang bị đang gắn
  const currentStats = calculateTotalGearStats(
    activeGearId,
    progression.level,
    progression.inventory,
    progression.equipped,
  )

  // Điểm sức mạnh chiến đấu tổng hợp
  const evasionVal = activeGearId === "falcon" ? 20 : 5
  const powerRating = gearPower({
    hp: currentStats.total.hp,
    attack: currentStats.total.attack,
    defense: currentStats.total.defense,
    speed: currentStats.total.speed,
    evasion: evasionVal,
    energy: currentStats.total.sp,
  })

  const totalBattles = progression.battlesWon + progression.battlesLost
  const winRate =
    totalBattles > 0
      ? Math.round((progression.battlesWon / totalBattles) * 100)
      : 100

  // 3 Trang bị đang đeo
  const equippedWeapon = progression.inventory.find(
    (it) => it.id === progression.equipped.weapon,
  )
  const equippedShield = progression.inventory.find(
    (it) => it.id === progression.equipped.shield,
  )
  const equippedEngine = progression.inventory.find(
    (it) => it.id === progression.equipped.engine,
  )

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Header Chào Mừng & Bảng Điều Khiển Lệnh (Command Bridge Hero) */}
      <div
        className={cn(
          "relative overflow-hidden rounded-sm border bg-gradient-to-r from-panel via-black/80 to-panel p-5 shadow-2xl backdrop-blur-md",
          theme.border,
          theme.glow,
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex size-14 items-center justify-center rounded-sm border bg-black/60 shadow-inner",
                theme.border,
              )}
            >
              <Rocket className={cn("size-7 animate-pulse", theme.accentColor)} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-lg font-bold tracking-wider text-white uppercase sm:text-xl">
                  TRUNG TÂM CHỈ HUY HẠM ĐỘI // STARFRONT COMMAND
                </h1>
                <span
                  className={cn(
                    "rounded px-2 py-0.5 font-mono text-xs font-bold border",
                    theme.badgeBg,
                    theme.badgeText,
                    theme.badgeBorder,
                  )}
                >
                  CẤP {progression.level}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                  <Radio className="size-2.5 animate-pulse" /> SẴN SÀNG TÁC CHIẾN
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Buồng lái chiến thuật không gian đa năng · Quản lý cơ giáp, lập kế hoạch chiến dịch và tối ưu hóa trang bị
              </p>
            </div>
          </div>

          {/* Tài nguyên hiện có */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-sm border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 font-mono text-xs text-amber-300 shadow-sm">
              <Coins className="size-4 text-amber-400" />
              <span>Tín Dụng:</span>
              <strong className="text-amber-200">
                {progression.credits.toLocaleString("vi-VN")}
              </strong>
            </div>

            <div className="flex items-center gap-1.5 rounded-sm border border-purple-500/40 bg-purple-950/40 px-3 py-1.5 font-mono text-xs text-purple-300 shadow-sm">
              <Layers className="size-4 text-purple-400" />
              <span>Hợp Kim:</span>
              <strong className="text-purple-200">{alloyCount}</strong>
            </div>

            <Button
              onClick={() => {
                playClickSound()
                onNavigate("battlefield")
              }}
              size="sm"
              className="gap-1.5 font-display text-xs font-bold uppercase tracking-wider bg-cyan-500 text-black hover:bg-cyan-400 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.4)]"
            >
              <Swords className="size-3.5" />
              <span>Xuất Kích Ngay</span>
            </Button>
          </div>
        </div>

        {/* Thanh EXP Mini */}
        <div className="mt-4 border-t border-border/50 pt-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-1.5">
            <span className="flex items-center gap-1 text-cyan-300">
              <Sparkles className="size-3 text-cyan-400" /> TIẾN TRÌNH KINH NGHIỆM CHIẾN ĐẤU
            </span>
            <span>
              <strong className="text-white">{progression.exp}</strong> / {expRequired} EXP ({expPct}%)
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-xs bg-secondary/80">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${expPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Tổng Quan Cơ Giáp Hiện Tại & Chỉ Số Thực Chiến */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Cột Trái: Trưng bày Cơ Giáp & Bộ chọn nhanh (7 cột) */}
        <div className="rounded-sm border border-border/70 bg-panel/70 p-4 shadow-xl backdrop-blur-md lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <div className="flex items-center gap-2">
                <Cpu className="size-4 text-cyan-400" />
                <h2 className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                  CƠ GIÁP ĐANG XUẤT KÍCH // {activeGearDef.name.toUpperCase()}
                </h2>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                Vai trò: <strong className={theme.accentColor}>{activeGearDef.role}</strong>
              </span>
            </div>

            {/* Thông tin Gear & Nội Tại */}
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-bold text-white">
                  {activeGearDef.name}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground italic">
                  "{activeGearDef.desc}"
                </p>
              </div>

              {/* Điểm Đánh Giá Lực Chiến */}
              <div className="flex items-center gap-2 rounded border border-cyan-500/40 bg-black/60 px-3 py-1.5 font-mono">
                <Trophy className="size-4 text-amber-400" />
                <div>
                  <span className="text-[10px] text-muted-foreground block leading-tight">ĐIỂM LỰC CHIẾN</span>
                  <span className="font-bold text-cyan-300 text-sm leading-none">{powerRating.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Nội tại Gear */}
            <div className="mt-3 rounded border border-border/60 bg-black/50 p-2.5">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <div className="flex items-center gap-1.5 text-amber-300">
                  <Sparkles className="size-3.5 text-amber-400" />
                  <span>NỘI TẠI: {activeGearDef.passive.name}</span>
                </div>
                <span className="text-[10px] text-emerald-400">TỰ ĐỘNG KÍCH HOẠT</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                {activeGearDef.passive.desc}
              </p>
            </div>
          </div>

          {/* Bộ chọn nhanh Gear ngay trên trang chủ */}
          <div className="mt-4 border-t border-border/50 pt-3">
            <span className="text-[11px] font-mono text-muted-foreground block mb-2 font-bold">
              Chuyển đổi nhanh cơ giáp trực ban:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(["vanguard", "falcon", "aegis"] as StarfrontGearId[]).map((gId) => {
                const def = STARFRONT_GEAR_DEFS[gId]
                const isSelected = activeGearId === gId
                return (
                  <button
                    key={gId}
                    onClick={() => {
                      playClickSound()
                      onSelectGear(gId)
                    }}
                    className={cn(
                      "flex items-center justify-between rounded px-2.5 py-2 border text-left font-mono text-xs transition-all cursor-pointer",
                      isSelected
                        ? "border-cyan-400 bg-cyan-950/70 text-cyan-200 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                        : "border-border/60 bg-black/40 text-muted-foreground hover:text-white hover:border-cyan-500/40",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ backgroundColor: def.color }} />
                      <span className="truncate">{def.name.split(" ")[0]}</span>
                    </div>
                    {isSelected && <CheckCircle2 className="size-3 text-cyan-400 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Cột Phải: Bảng Chỉ Số Chiến Đấu & Tình Trạng Trang Bị (5 cột) */}
        <div className="rounded-sm border border-border/70 bg-panel/70 p-4 shadow-xl backdrop-blur-md lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-cyan-400" />
                <h2 className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                  THÔNG SỐ THỰC CHIẾN TỔNG HỢP
                </h2>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">ĐÃ TÍNH TRANG BỊ & BUFF</span>
            </div>

            {/* Lưới chỉ số 6 ô */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex items-center justify-between rounded bg-black/40 p-2 border border-red-500/30">
                <span className="text-muted-foreground">Máu (HP):</span>
                <strong className="text-red-300">{currentStats.total.hp}</strong>
              </div>
              <div className="flex items-center justify-between rounded bg-black/40 p-2 border border-cyan-500/30">
                <span className="text-muted-foreground">Năng Lượng (SP):</span>
                <strong className="text-cyan-300">{currentStats.total.sp}</strong>
              </div>
              <div className="flex items-center justify-between rounded bg-black/40 p-2 border border-orange-500/30">
                <span className="text-muted-foreground">Tấn Công (ATK):</span>
                <strong className="text-orange-300">{currentStats.total.attack}</strong>
              </div>
              <div className="flex items-center justify-between rounded bg-black/40 p-2 border border-blue-500/30">
                <span className="text-muted-foreground">Phòng Thủ (DEF):</span>
                <strong className="text-blue-300">{currentStats.total.defense}</strong>
              </div>
              <div className="flex items-center justify-between rounded bg-black/40 p-2 border border-emerald-500/30">
                <span className="text-muted-foreground">Tốc Độ (SPD):</span>
                <strong className="text-emerald-300">{currentStats.total.speed}</strong>
              </div>
              <div className="flex items-center justify-between rounded bg-black/40 p-2 border border-purple-500/30">
                <span className="text-muted-foreground">Né Tránh (EVA):</span>
                <strong className="text-purple-300">{evasionVal}%</strong>
              </div>
            </div>

            {/* Trang bị đang đeo hiện tại */}
            <div className="mt-3 border-t border-border/50 pt-2.5">
              <span className="text-[11px] font-mono text-muted-foreground block mb-1.5 font-bold">
                Trang bị đang kết nối (3 Vị Trí):
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between rounded bg-black/40 px-2 py-1.5 border border-border/40">
                  <span className="text-muted-foreground">Vũ Khí:</span>
                  <span className="text-red-300 font-bold truncate max-w-[180px]">
                    {equippedWeapon ? getItemDisplayName(equippedWeapon) : "Chưa trang bị"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded bg-black/40 px-2 py-1.5 border border-border/40">
                  <span className="text-muted-foreground">Khiên:</span>
                  <span className="text-blue-300 font-bold truncate max-w-[180px]">
                    {equippedShield ? getItemDisplayName(equippedShield) : "Chưa trang bị"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded bg-black/40 px-2 py-1.5 border border-border/40">
                  <span className="text-muted-foreground">Động Cơ:</span>
                  <span className="text-emerald-300 font-bold truncate max-w-[180px]">
                    {equippedEngine ? getItemDisplayName(equippedEngine) : "Chưa trang bị"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 border-t border-border/40 pt-2 text-right">
            <button
              onClick={() => {
                playClickSound()
                onNavigate("hangar")
              }}
              className="text-xs font-mono text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Xem chi tiết trong Xưởng Hangar</span>
              <ChevronRight className="size-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Trung Tâm Xuất Kích & Điều Hướng Nhanh (Action Launchpad — 4 Cards) */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-cyan-400" />
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
              TRUNG TÂM PHÂN HỆ TÁC CHIẾN (ACTION LAUNCHPAD)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            Lựa chọn phân hệ tác chiến để điều hướng tức thời
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Chiến Trường */}
          <div
            onClick={() => {
              playClickSound()
              onNavigate("battlefield")
            }}
            className="group relative flex flex-col justify-between rounded-sm border border-cyan-500/30 bg-panel/80 p-4 transition-all hover:border-cyan-300 hover:bg-cyan-950/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded border border-cyan-500/50 bg-cyan-950/60 text-cyan-300 group-hover:scale-105 transition-transform">
                  <Swords className="size-5" />
                </div>
                <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-cyan-300 border border-cyan-500/40">
                  CHIẾN TRƯỜNG
                </span>
              </div>
              <h3 className="mt-3 font-display text-sm font-bold text-white group-hover:text-cyan-200">
                ĐẤU TRƯỜNG CƠ GIÁP
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                Buồng lái chiến đấu theo lượt. Trực diện giao phong với Drone, Raider và Siege Walker.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-2 text-xs font-mono text-cyan-300">
              <span>Vào Đấu Trường</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Nhiệm Vụ Chiến Dịch */}
          <div
            onClick={() => {
              playClickSound()
              onNavigate("missions")
            }}
            className="group relative flex flex-col justify-between rounded-sm border border-purple-500/30 bg-panel/80 p-4 transition-all hover:border-purple-300 hover:bg-purple-950/30 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded border border-purple-500/50 bg-purple-950/60 text-purple-300 group-hover:scale-105 transition-transform">
                  <Globe2 className="size-5" />
                </div>
                <span className="rounded bg-purple-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-purple-300 border border-purple-500/40">
                  CHIẾN DỊCH
                </span>
              </div>
              <h3 className="mt-3 font-display text-sm font-bold text-white group-hover:text-purple-200">
                BẢN ĐỒ NHIỆM VỤ
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                4 Sector không gian sâu, 12 ải chính tuyến và chuỗi nhiệm vụ tiền thưởng phụ tuyến ngẫu nhiên.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-2 text-xs font-mono text-purple-300">
              <span>{progression.completedMissions.length} Ải Đã Xong</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Chợ Quân Sự */}
          <div
            onClick={() => {
              playClickSound()
              onNavigate("shop")
            }}
            className="group relative flex flex-col justify-between rounded-sm border border-amber-500/30 bg-panel/80 p-4 transition-all hover:border-amber-300 hover:bg-amber-950/30 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded border border-amber-500/50 bg-amber-950/60 text-amber-300 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="size-5" />
                </div>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-300 border border-amber-500/40">
                  THƯƠNG MẠI
                </span>
              </div>
              <h3 className="mt-3 font-display text-sm font-bold text-white group-hover:text-amber-200">
                CHỢ QUÂN SỰ KHÔNG GIAN
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                Mua trang bị hiếm phân tầng Sector, bán vật phẩm thừa và tái chế rã đồ thu hồi Hợp Kim.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-2 text-xs font-mono text-amber-300">
              <span>{progression.freeShopRefreshes ?? 0} Lượt Free</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Xưởng Hangar & Kho Đồ */}
          <div
            onClick={() => {
              playClickSound()
              onNavigate("hangar")
            }}
            className="group relative flex flex-col justify-between rounded-sm border border-emerald-500/30 bg-panel/80 p-4 transition-all hover:border-emerald-300 hover:bg-emerald-950/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded border border-emerald-500/50 bg-emerald-950/60 text-emerald-300 group-hover:scale-105 transition-transform">
                  <Boxes className="size-5" />
                </div>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-300 border border-emerald-500/40">
                  HANGAR
                </span>
              </div>
              <h3 className="mt-3 font-display text-sm font-bold text-white group-hover:text-emerald-200">
                HANGAR & KHO VẬT TƯ
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                Tùy biến 3 vị trí trang bị, xưởng cường hóa +1..+10 và quản lý kho đồ dự trữ.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-2 text-xs font-mono text-emerald-300">
              <span>{progression.inventory.length} Vật Phẩm Kho</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Hồ Sơ Chiến Tích & Trạng Thái Chiến Dịch (Stats & History) */}
      <div className="rounded-sm border border-border/60 bg-black/40 p-3.5 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              Tổng Trận Giao Tranh: <strong className="text-white">{totalBattles}</strong>
            </span>
            <span>·</span>
            <span className="text-emerald-400">
              Chiến Thắng: <strong>{progression.battlesWon}</strong>
            </span>
            <span>·</span>
            <span className="text-red-400">
              Thất Bại: <strong>{progression.battlesLost}</strong>
            </span>
            <span>·</span>
            <span>
              Tỷ Lệ Thắng: <strong className="text-amber-300">{winRate}%</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-cyan-300">Đã mở khóa 4 Khu vực Chiến dịch</span>
          </div>
        </div>
      </div>
    </div>
  )
}
