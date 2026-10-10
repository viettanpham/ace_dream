"use client"

import { useEffect, useId, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  ChevronDown,
  ChevronUp,
  Heart,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { CombatUnit, StarfrontProgression } from "@/lib/game/types"

export interface PlayerStatusProps {
  /** Chỉ số Máu (HP) hiện tại */
  health?: number
  /** Chỉ số Máu (HP) tối đa */
  maxHealth?: number
  /** Chỉ số Khiên (Shield) hiện tại */
  shield?: number
  /** Chỉ số Khiên (Shield) tối đa */
  maxShield?: number
  /** Chỉ số Năng Lượng (Energy / SP) hiện tại */
  energy?: number
  /** Chỉ số Năng Lượng (Energy / SP) tối đa */
  maxEnergy?: number

  /** Đơn vị chiến đấu CombatUnit nguồn (tùy chọn) */
  unit?: CombatUnit | null
  /** Tiến trình StarfrontProgression nguồn (tùy chọn) */
  progression?: StarfrontProgression | null

  /** Tên hiển thị người chơi / phi công */
  name?: string
  /** Danh hiệu / Vai trò */
  title?: string
  /** Cấp bậc (Level) */
  level?: number
  /** URL ảnh đại diện */
  avatar?: string
  /** Lớp cơ giáp (vanguard, falcon, aegis...) */
  gearType?: "vanguard" | "falcon" | "aegis" | string

  /** Biến thể giao diện hiển thị */
  variant?: "full" | "compact" | "minimal" | "hud"
  /** Hiển thị vạch chia phân đoạn quân sự (Tactical tick marks) */
  showSegments?: boolean
  /** Kích hoạt hiệu ứng thanh bóng ma tổn thương (Lag / Ghost Bar) */
  showGhostBar?: boolean
  /** Hiển thị chi tiết bảng dữ liệu phân tích vi mạch */
  showDetails?: boolean
  /** Cho phép điều khiển mô phỏng thay đổi chỉ số trực tiếp (Demo mode) */
  showControls?: boolean
  /** Tùy chọn class tùy biến */
  className?: string
  /** Callback khi người chơi nhấp kiểm tra */
  onInspect?: () => void
}

/**
 * Animated Player Status Component
 * Hiển thị thanh trạng thái Máu (HP), Khiên (Shield) và Năng Lượng (Energy/SP)
 * với thanh tiến trình mượt mà (Spring Physics via motion/react), hiệu ứng bóng ma trễ nhịp (Ghost Bar),
 * nhịp cảnh báo nguy cấp (Critical Pulse), và ngôn ngữ giao diện Sci-Fi chuẩn mực.
 */
export function PlayerStatus({
  health: propHealth,
  maxHealth: propMaxHealth,
  shield: propShield,
  maxShield: propMaxShield,
  energy: propEnergy,
  maxEnergy: propMaxEnergy,
  unit,
  progression,
  name: propName,
  title: propTitle,
  level: propLevel,
  avatar: propAvatar,
  gearType: propGearType,
  variant = "full",
  showSegments = true,
  showGhostBar = true,
  showDetails = false,
  showControls = false,
  className,
  onInspect,
}: PlayerStatusProps) {
  // 1. Phân giải chỉ số từ Props hoặc từ unit/progression
  const resolvedMaxHealth = Math.max(1, propMaxHealth ?? unit?.maxHp ?? 1250)
  const resolvedHealth = Math.max(0, Math.min(resolvedMaxHealth, propHealth ?? unit?.hp ?? 1250))

  // Khiên: Nếu không truyền, trích xuất từ unit.shield hoặc tính theo phòng thủ/gearType
  const derivedDefaultMaxShield =
    unit?.gearType === "aegis" || propGearType === "aegis"
      ? 550
      : unit?.gearType === "falcon" || propGearType === "falcon"
        ? 220
        : 350
  const resolvedMaxShield = Math.max(
    1,
    propMaxShield ?? unit?.maxShield ?? derivedDefaultMaxShield,
  )
  const resolvedShield = Math.max(
    0,
    Math.min(
      resolvedMaxShield,
      propShield ?? unit?.shield ?? derivedDefaultMaxShield,
    ),
  )

  // Năng lượng (SP)
  const resolvedMaxEnergy = Math.max(1, propMaxEnergy ?? unit?.maxSp ?? 100)
  const resolvedEnergy = Math.max(0, Math.min(resolvedMaxEnergy, propEnergy ?? unit?.sp ?? 85))

  // Nhận diện người chơi
  const displayName = propName ?? unit?.name ?? (progression ? `Chỉ huy Cấp ${progression.level}` : "Vanguard Pilot")
  const displayTitle = propTitle ?? unit?.title ?? "Phi Công Tác Chiến Hạm Đội"
  const displayLevel = propLevel ?? progression?.level ?? 1
  const displayGear = propGearType ?? unit?.gearType ?? progression?.activeGearId ?? "vanguard"

  // Trạng thái cục bộ cho chế độ mô phỏng trực quan (Simulation Controls)
  const [simHealth, setSimHealth] = useState<number>(resolvedHealth)
  const [simShield, setSimShield] = useState<number>(resolvedShield)
  const [simEnergy, setSimEnergy] = useState<number>(resolvedEnergy)
  const [detailsOpen, setDetailsOpen] = useState(showDetails)

  // Đồng bộ khi props bên ngoài thay đổi
  useEffect(() => {
    setSimHealth(resolvedHealth)
  }, [resolvedHealth])

  useEffect(() => {
    setSimShield(resolvedShield)
  }, [resolvedShield])

  useEffect(() => {
    setSimEnergy(resolvedEnergy)
  }, [resolvedEnergy])

  // Giá trị hiện tại được render
  const currentHealth = showControls ? simHealth : resolvedHealth
  const currentShield = showControls ? simShield : resolvedShield
  const currentEnergy = showControls ? simEnergy : resolvedEnergy

  // Tính toán phần trăm (0 - 100)
  const healthPct = Math.max(0, Math.min(100, (currentHealth / resolvedMaxHealth) * 100))
  const shieldPct = Math.max(0, Math.min(100, (currentShield / resolvedMaxShield) * 100))
  const energyPct = Math.max(0, Math.min(100, (currentEnergy / resolvedMaxEnergy) * 100))

  // Đánh giá trạng thái nguy cấp
  const isHealthCritical = healthPct <= 25
  const isHealthLow = healthPct > 25 && healthPct <= 50
  const isShieldDepleted = currentShield <= 0
  const isEnergyFull = energyPct >= 100

  // Bảng phối màu theo lớp cơ giáp
  const gearTheme = {
    vanguard: {
      accent: "text-cyan-400",
      border: "border-cyan-500/40",
      bgSubtle: "bg-cyan-950/20",
      indicator: "bg-cyan-500",
    },
    falcon: {
      accent: "text-purple-400",
      border: "border-purple-500/40",
      bgSubtle: "bg-purple-950/20",
      indicator: "bg-purple-500",
    },
    aegis: {
      accent: "text-amber-400",
      border: "border-amber-500/40",
      bgSubtle: "bg-amber-950/20",
      indicator: "bg-amber-500",
    },
  }[displayGear as "vanguard" | "falcon" | "aegis"] || {
    accent: "text-cyan-400",
    border: "border-cyan-500/40",
    bgSubtle: "bg-cyan-950/20",
    indicator: "bg-cyan-500",
  }

  // Layout tối giản (Minimal)
  if (variant === "minimal") {
    return (
      <div className={cn("space-y-1.5 font-mono text-xs", className)}>
        <ProgressBar
          label="HP"
          current={currentHealth}
          max={resolvedMaxHealth}
          pct={healthPct}
          colorTheme={isHealthCritical ? "danger" : isHealthLow ? "warning" : "health"}
          showSegments={showSegments}
          showGhostBar={showGhostBar}
          heightClass="h-1.5"
          compact
        />
        <ProgressBar
          label="SHD"
          current={currentShield}
          max={resolvedMaxShield}
          pct={shieldPct}
          colorTheme="shield"
          showSegments={showSegments}
          showGhostBar={showGhostBar}
          heightClass="h-1.5"
          compact
        />
        <ProgressBar
          label="NRG"
          current={currentEnergy}
          max={resolvedMaxEnergy}
          pct={energyPct}
          colorTheme="energy"
          showSegments={showSegments}
          showGhostBar={showGhostBar}
          heightClass="h-1.5"
          compact
        />
      </div>
    )
  }

  // Layout thanh HUD điều hướng (Compact / HUD)
  if (variant === "compact" || variant === "hud") {
    return (
      <div
        className={cn(
          "rounded border border-border/70 bg-card/80 p-3 backdrop-blur-md font-mono",
          isHealthCritical && "border-rose-500/50 shadow-sm shadow-rose-950/50",
          className,
        )}
      >
        <div className="mb-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={cn("size-2 rounded-full", gearTheme.indicator, isHealthCritical && "animate-ping bg-rose-500")} />
            <span className="font-display font-bold tracking-wider text-foreground uppercase truncate max-w-[140px] sm:max-w-none">
              {displayName}
            </span>
            <span className="text-[10px] text-muted-foreground">LV.{displayLevel}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            {isHealthCritical && (
              <span className="flex items-center gap-1 font-bold text-rose-400 animate-pulse">
                <AlertTriangle className="size-3" /> NGUY CẤP
              </span>
            )}
            {isShieldDepleted && (
              <span className="text-[10px] text-amber-400 font-bold">
                KHIÊN VỠ
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <ProgressBar
            icon={<Heart className="size-3" />}
            label="MÁU (HP)"
            current={currentHealth}
            max={resolvedMaxHealth}
            pct={healthPct}
            colorTheme={isHealthCritical ? "danger" : isHealthLow ? "warning" : "health"}
            showSegments={showSegments}
            showGhostBar={showGhostBar}
            heightClass="h-2"
          />
          <ProgressBar
            icon={<Shield className="size-3" />}
            label="KHIÊN (SHD)"
            current={currentShield}
            max={resolvedMaxShield}
            pct={shieldPct}
            colorTheme="shield"
            showSegments={showSegments}
            showGhostBar={showGhostBar}
            heightClass="h-1.5"
          />
          <ProgressBar
            icon={<Zap className="size-3" />}
            label="NĂNG LƯỢNG (NRG)"
            current={currentEnergy}
            max={resolvedMaxEnergy}
            pct={energyPct}
            colorTheme="energy"
            showSegments={showSegments}
            showGhostBar={showGhostBar}
            heightClass="h-1.5"
          />
        </div>
      </div>
    )
  }

  // Layout Đầy Đủ Tác Chiến (Full Tactical Status Card)
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border border-border/80 bg-panel/90 p-4 backdrop-blur-md transition-colors",
        gearTheme.border,
        isHealthCritical && "border-rose-500/70 shadow-lg shadow-rose-950/30",
        className,
      )}
    >
      {/* Tia sáng quét nền Sci-Fi tinh tế */}
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent blur-2xl" />

      {/* Header trạng thái */}
      <div className="relative mb-3 flex items-start justify-between gap-3 border-b border-border/50 pb-3">
        <div className="flex items-center gap-3">
          {/* Avatar / Class Emblem */}
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded border bg-black/50 text-foreground relative overflow-hidden",
              gearTheme.border,
            )}
          >
            {propAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={propAvatar} alt={displayName} className="size-full object-cover" />
            ) : displayGear === "aegis" ? (
              <ShieldCheck className="size-6 text-amber-400" />
            ) : displayGear === "falcon" ? (
              <Sparkles className="size-6 text-purple-400" />
            ) : (
              <Activity className="size-6 text-cyan-400" />
            )}
            {isHealthCritical && (
              <div className="absolute inset-0 bg-rose-600/30 animate-pulse" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-bold tracking-wider text-foreground uppercase">
                {displayName}
              </h3>
              <span className="font-mono text-[10px] text-muted-foreground">
                CẤP {displayLevel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span>{displayTitle}</span>
              <span aria-hidden="true">·</span>
              <span className={cn("uppercase font-mono text-[10px] font-bold", gearTheme.accent)}>
                {displayGear}
              </span>
            </p>
          </div>
        </div>

        {/* Cảnh báo tình trạng */}
        <div className="text-right">
          {isHealthCritical ? (
            <div className="flex items-center gap-1 text-xs font-bold text-rose-400 animate-pulse">
              <AlertTriangle className="size-3.5" />
              <span>CẢNH BÁO NGUY CẤP</span>
            </div>
          ) : isShieldDepleted ? (
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
              <ShieldAlert className="size-3.5" />
              <span>KHIÊN PHÒNG HỘ VỠ</span>
            </div>
          ) : isEnergyFull ? (
            <div className="flex items-center gap-1 text-xs font-bold text-cyan-300">
              <BatteryCharging className="size-3.5" />
              <span>NĂNG LƯỢNG ĐẦY</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs font-mono text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>HỆ THỐNG ỔN ĐỊNH</span>
            </div>
          )}
          <span className="text-[10px] font-mono text-muted-foreground">
            TỔNG THỂ: {Math.round((healthPct + shieldPct + energyPct) / 3)}%
          </span>
        </div>
      </div>

      {/* 3 Thanh Tiến Trình Hoạt Họa Chính (Animated Health, Shield, Energy) */}
      <div className="space-y-3.5">
        {/* 1. THANH MÁU (HEALTH / HP) */}
        <ProgressBar
          icon={<Heart className="size-3.5" />}
          label="ĐỘ BỀN VỎ GIÁP (HP)"
          current={currentHealth}
          max={resolvedMaxHealth}
          pct={healthPct}
          colorTheme={isHealthCritical ? "danger" : isHealthLow ? "warning" : "health"}
          showSegments={showSegments}
          showGhostBar={showGhostBar}
          heightClass="h-2.5"
          warningBadge={isHealthCritical ? "CẢNH BÁO HỎNG HÓC" : undefined}
        />

        {/* 2. THANH KHIÊN (SHIELD / DEFENSE BARRIER) */}
        <ProgressBar
          icon={<ShieldCheck className="size-3.5" />}
          label="TRƯỜNG LỰC KHIÊN (SHD)"
          current={currentShield}
          max={resolvedMaxShield}
          pct={shieldPct}
          colorTheme="shield"
          showSegments={showSegments}
          showGhostBar={showGhostBar}
          heightClass="h-2.5"
          warningBadge={isShieldDepleted ? "MẤT BẢO VỆ" : undefined}
        />

        {/* 3. THANH NĂNG LƯỢNG (ENERGY / REACTOR SP) */}
        <ProgressBar
          icon={<Zap className="size-3.5" />}
          label="LÕI NĂNG LƯỢNG (NRG / SP)"
          current={currentEnergy}
          max={resolvedMaxEnergy}
          pct={energyPct}
          colorTheme="energy"
          showSegments={showSegments}
          showGhostBar={showGhostBar}
          heightClass="h-2.5"
          warningBadge={isEnergyFull ? "SẴN SÀNG TUYỆT KỸ" : undefined}
        />
      </div>

      {/* Tùy chọn xem chi tiết thông số vi mạch */}
      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {detailsOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          <span>{detailsOpen ? "Ẩn Phân Tích Kỹ Thuật" : "Xem Phân Tích Kỹ Thuật"}</span>
        </button>

        {onInspect && (
          <button
            type="button"
            onClick={onInspect}
            className="text-[11px] text-cyan-400 hover:underline"
          >
            Chi Tiết Chỉ Huy →
          </button>
        )}
      </div>

      {/* Khối phân tích kỹ thuật mở rộng */}
      <AnimatePresence>
        {detailsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-border/30 pt-2.5 text-center font-mono text-[11px]">
              <div className="rounded border border-border/40 bg-black/30 p-1.5">
                <span className="block text-[9px] uppercase text-muted-foreground">Hấp Thụ Khiên</span>
                <span className="font-bold text-sky-300">
                  {isShieldDepleted ? "0%" : "100% Sát thương"}
                </span>
              </div>
              <div className="rounded border border-border/40 bg-black/30 p-1.5">
                <span className="block text-[9px] uppercase text-muted-foreground">Hồi Năng Lượng</span>
                <span className="font-bold text-amber-300">
                  {displayGear === "vanguard" ? "+10 SP/lượt" : "+5 SP/lượt"}
                </span>
              </div>
              <div className="rounded border border-border/40 bg-black/30 p-1.5">
                <span className="block text-[9px] uppercase text-muted-foreground">Kết Cấu Vỏ</span>
                <span
                  className={cn(
                    "font-bold",
                    isHealthCritical ? "text-rose-400" : isHealthLow ? "text-amber-300" : "text-emerald-400",
                  )}
                >
                  {isHealthCritical ? "NGUY HIỂM" : "BẢO VỆ TỐT"}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bảng điều khiển mô phỏng tương tác (Chỉ hiện khi showControls = true) */}
      {showControls && (
        <div className="mt-3.5 rounded border border-cyan-500/30 bg-black/50 p-2.5 font-mono text-xs">
          <div className="mb-2 flex items-center justify-between text-[11px] text-cyan-300 font-bold">
            <span className="flex items-center gap-1">
              <RefreshCw className="size-3" /> MÔ PHỎNG TƯƠNG TÁC CHỈ SỐ
            </span>
            <button
              type="button"
              onClick={() => {
                setSimHealth(resolvedMaxHealth)
                setSimShield(resolvedMaxShield)
                setSimEnergy(resolvedMaxEnergy)
              }}
              className="text-[10px] text-muted-foreground hover:text-cyan-300 transition-colors underline"
            >
              Hồi Đầy Tất Cả
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Thao tác HP */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-emerald-400 font-bold">Thao Tác HP:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setSimHealth((prev) => Math.max(0, prev - Math.round(resolvedMaxHealth * 0.25)))}
                  className="flex-1 rounded border border-rose-500/40 bg-rose-950/30 px-1 py-1 text-[10px] text-rose-300 hover:bg-rose-900/50"
                  title="Nhận 25% Sát Thương"
                >
                  -25%
                </button>
                <button
                  type="button"
                  onClick={() => setSimHealth((prev) => Math.min(resolvedMaxHealth, prev + Math.round(resolvedMaxHealth * 0.25)))}
                  className="flex-1 rounded border border-emerald-500/40 bg-emerald-950/30 px-1 py-1 text-[10px] text-emerald-300 hover:bg-emerald-900/50"
                  title="Hồi Phục 25% Máu"
                >
                  +25%
                </button>
              </div>
            </div>

            {/* Thao tác Khiên */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-sky-400 font-bold">Thao Tác Khiên:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setSimShield((prev) => Math.max(0, prev - Math.round(resolvedMaxShield * 0.33)))}
                  className="flex-1 rounded border border-sky-500/40 bg-sky-950/30 px-1 py-1 text-[10px] text-sky-300 hover:bg-sky-900/50"
                  title="Bào mòn 33% Khiên"
                >
                  -33%
                </button>
                <button
                  type="button"
                  onClick={() => setSimShield((prev) => Math.min(resolvedMaxShield, prev + Math.round(resolvedMaxShield * 0.33)))}
                  className="flex-1 rounded border border-sky-500/40 bg-sky-950/30 px-1 py-1 text-[10px] text-sky-300 hover:bg-sky-900/50"
                  title="Sạc lại 33% Khiên"
                >
                  +33%
                </button>
              </div>
            </div>

            {/* Thao tác Năng Lượng */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-amber-400 font-bold">Năng Lượng SP:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setSimEnergy((prev) => Math.max(0, prev - 25))}
                  className="flex-1 rounded border border-amber-500/40 bg-amber-950/30 px-1 py-1 text-[10px] text-amber-300 hover:bg-amber-900/50"
                  title="Tiêu hao 25 SP"
                >
                  -25 SP
                </button>
                <button
                  type="button"
                  onClick={() => setSimEnergy((prev) => Math.min(resolvedMaxEnergy, prev + 25))}
                  className="flex-1 rounded border border-amber-500/40 bg-amber-950/30 px-1 py-1 text-[10px] text-amber-300 hover:bg-amber-900/50"
                  title="Hồi phục 25 SP"
                >
                  +25 SP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Thanh tiến trình hoạt họa đa lớp
 * Bao gồm:
 * - Ghost bar (thanh bóng ma trễ nhịp)
 * - Thanh chính (motion.div với chuyển động mượt mà)
 * - Vạch chia phân đoạn quân sự (Tactical tick marks)
 * - Hiệu ứng quét sáng (Shimmer)
 */
interface ProgressBarProps {
  icon?: React.ReactNode
  label: string
  current: number
  max: number
  pct: number
  colorTheme: "health" | "warning" | "danger" | "shield" | "energy"
  showSegments?: boolean
  showGhostBar?: boolean
  heightClass?: string
  compact?: boolean
  warningBadge?: string
}

function ProgressBar({
  icon,
  label,
  current,
  max,
  pct,
  colorTheme,
  showSegments = true,
  showGhostBar = true,
  heightClass = "h-2.5",
  compact = false,
  warningBadge,
}: ProgressBarProps) {
  const gradientId = useId()
  // Trạng thái thanh bóng ma (Ghost / Damage Lag bar)
  const [ghostPct, setGhostPct] = useState(pct)

  useEffect(() => {
    // Độ trễ nhẹ trước khi thanh bóng ma trôi theo thanh chính
    const timer = setTimeout(() => {
      setGhostPct(pct)
    }, 280)
    return () => clearTimeout(timer)
  }, [pct])

  // Cấu hình chủ đề màu sắc
  const themeStyles = {
    health: {
      bar: "bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400",
      ghost: "bg-emerald-300/40",
      text: "text-emerald-400",
      glow: "shadow-[0_0_10px_rgba(16,185,129,0.35)]",
    },
    warning: {
      bar: "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300",
      ghost: "bg-amber-300/40",
      text: "text-amber-400",
      glow: "shadow-[0_0_10px_rgba(245,158,11,0.35)]",
    },
    danger: {
      bar: "bg-gradient-to-r from-rose-600 via-red-500 to-rose-400 animate-pulse",
      ghost: "bg-rose-400/40",
      text: "text-rose-400",
      glow: "shadow-[0_0_12px_rgba(244,63,94,0.5)]",
    },
    shield: {
      bar: "bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-400",
      ghost: "bg-sky-300/40",
      text: "text-sky-400",
      glow: "shadow-[0_0_10px_rgba(56,189,248,0.35)]",
    },
    energy: {
      bar: "bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300",
      ghost: "bg-amber-300/40",
      text: "text-amber-400",
      glow: "shadow-[0_0_10px_rgba(251,191,36,0.35)]",
    },
  }[colorTheme]

  return (
    <div className="w-full font-mono">
      {/* Nhãn & Chỉ số định lượng */}
      <div className="mb-1 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold">
          {icon && <span className={themeStyles.text}>{icon}</span>}
          <span className={cn(compact ? "text-[10px]" : "text-xs", themeStyles.text)}>
            {label}
          </span>
          {warningBadge && (
            <span className="ml-1 text-[9px] font-bold text-rose-400 animate-pulse">
              [{warningBadge}]
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs tabular-nums">
          <span className="font-bold text-foreground">
            {Math.round(current)}
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">
            {Math.round(max)}
          </span>
          <span className="ml-1 text-[11px] text-muted-foreground">
            ({Math.round(pct)}%)
          </span>
        </div>
      </div>

      {/* Rãnh chứa thanh tiến trình */}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-xs border border-border/70 bg-black/60",
          heightClass,
        )}
      >
        {/* Thanh bóng ma trễ nhịp (Ghost Lag Bar) */}
        {showGhostBar && (
          <motion.div
            initial={false}
            animate={{ width: `${Math.max(0, Math.min(100, ghostPct))}%` }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className={cn("absolute inset-y-0 left-0", themeStyles.ghost)}
          />
        )}

        {/* Thanh tiến trình hoạt họa chính với motion/react */}
        <motion.div
          initial={false}
          animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
          transition={{ type: "spring", stiffness: 180, damping: 24 }}
          className={cn(
            "relative inset-y-0 left-0 h-full",
            themeStyles.bar,
            themeStyles.glow,
          )}
        >
          {/* Vệt sáng quét lướt (Shimmer) khi thanh có dung lượng */}
          {pct > 5 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
          )}
        </motion.div>

        {/* Vạch chia phân đoạn quân sự (Tactical tick marks) */}
        {showSegments && (
          <div className="pointer-events-none absolute inset-0 flex justify-between px-0.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={`${gradientId}-segment-${i}`}
                className="h-full w-px bg-black/40"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
