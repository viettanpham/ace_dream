"use client"

import { useId } from "react"
import { motion } from "motion/react"
import {
  Shield,
  Zap,
  Sword,
  Gauge,
  Flame,
  Activity,
  AlertTriangle,
  Radio,
  Cpu,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface TacticalPowerData {
  /** Current or calculated value */
  current: number
  /** Maximum rating / capacity */
  max: number
  /** Optional unit label (e.g., 'MW', 'GW', 'GJ', 'kN', '%') */
  unit?: string
  /** Sub-status or operational mode (e.g., 'ONLINE', 'OVERCLOCKED', 'NOMINAL') */
  status?: string
  /** Delta or modifier preview (e.g., +15% from pilot synergy) */
  delta?: number | string
  /** Subsystem breakdown tags */
  subsystems?: { name: string; value: string | number; active?: boolean }[]
}

export interface ShipStatDisplayProps {
  /** Tactical callsign / ship class name (e.g., "VANGUARD-MK3", "FALCON STRIKER") */
  shipName?: string
  /** Ship class / role designation */
  shipClass?: string
  /** Ship manufacturer or hull designation */
  hullId?: string

  /** Shield tactical system data */
  shield?: TacticalPowerData | number
  /** Max shield if number was passed */
  maxShield?: number

  /** Engine propulsion / warp power data */
  engine?: TacticalPowerData | number
  /** Max engine power if number was passed */
  maxEngine?: number

  /** Weapon ordnance / firepower output data */
  weaponPower?: TacticalPowerData | number
  /** Max weapon power if number was passed */
  maxWeaponPower?: number

  /** Overall operational combat readiness rating (0 - 100% or absolute score) */
  overallReadiness?: number

  /** Layout density / style */
  variant?: "detailed" | "compact" | "hud"
  /** Show live tactical telemetry flicker / scanning animation */
  animated?: boolean
  /** Optional interactive callback when clicking a stat pod */
  onSelectMetric?: (metric: "shield" | "engine" | "weaponPower") => void
  /** Selected metric highlight */
  selectedMetric?: "shield" | "engine" | "weaponPower" | null
  /** Optional custom CSS classes */
  className?: string
}

function normalizeStat(
  stat: TacticalPowerData | number | undefined,
  fallbackMax: number,
  defaultUnit = "MW",
  defaultStatus = "NOMINAL",
): TacticalPowerData {
  if (typeof stat === "number") {
    return {
      current: stat,
      max: fallbackMax,
      unit: defaultUnit,
      status: defaultStatus,
    }
  }
  if (stat) {
    return {
      current: stat.current,
      max: stat.max || fallbackMax,
      unit: stat.unit || defaultUnit,
      status: stat.status || defaultStatus,
      delta: stat.delta,
      subsystems: stat.subsystems,
    }
  }
  return {
    current: Math.round(fallbackMax * 0.85),
    max: fallbackMax,
    unit: defaultUnit,
    status: defaultStatus,
  }
}

/**
 * ShipStatDisplay
 * Component renders tactical data (Shield, Engine, Weapon Power)
 * in an authentic sci-fi grid layout with military telemetry typography,
 * SVG frequency wave accents, tick marks, status indicators, and responsive panels.
 */
export function ShipStatDisplay({
  shipName = "STARFRONT BATTLE CHASSIS",
  shipClass = "MULTI-ROLE MECHA",
  hullId = "SF-HULL-904",
  shield,
  maxShield = 1000,
  engine,
  maxEngine = 850,
  weaponPower,
  maxWeaponPower = 1200,
  overallReadiness = 94,
  variant = "detailed",
  animated = true,
  onSelectMetric,
  selectedMetric,
  className,
}: ShipStatDisplayProps) {
  const compId = useId()

  const shieldData = normalizeStat(shield, maxShield, "GJ", "SHIELD ONLINE")
  const engineData = normalizeStat(engine, maxEngine, "kN", "SUBSPACE WARP OK")
  const weaponData = normalizeStat(weaponPower, maxWeaponPower, "MW", "ARMED & READY")

  const shieldPct = Math.min(100, Math.max(0, Math.round((shieldData.current / shieldData.max) * 100)))
  const enginePct = Math.min(100, Math.max(0, Math.round((engineData.current / engineData.max) * 100)))
  const weaponPct = Math.min(100, Math.max(0, Math.round((weaponData.current / weaponData.max) * 100)))

  const statCards = [
    {
      id: "shield" as const,
      name: "TRƯỜNG KHIÊN LỰC TRƯỜNG",
      subName: "DEFLECTOR SHIELD MATRIX",
      icon: Shield,
      accentColor: "#06b6d4", // Cyan
      borderClass: "border-cyan-500/40 hover:border-cyan-400 group-hover:border-cyan-400",
      glowClass: "shadow-[0_0_20px_rgba(6,182,212,0.25)]",
      badgeClass: "bg-cyan-950/80 text-cyan-300 border-cyan-500/50",
      barGrad: "from-cyan-600 via-cyan-400 to-sky-200",
      data: shieldData,
      pct: shieldPct,
      sysLabel: "PHÂN HỆ HẤP THỤ",
      defaultSubsystems: [
        { name: "Phục hồi pha", value: "+38/giây", active: true },
        { name: "Trơ nhiệt", value: "92.4%", active: true },
        { name: "Hài âm lượng tử", value: "Hòa âm chuẩn", active: true },
      ],
    },
    {
      id: "engine" as const,
      name: "ĐỘNG CƠ & SỨC ĐẨY",
      subName: "WARP PROPULSION CORE",
      icon: Gauge,
      accentColor: "#10b981", // Emerald
      borderClass: "border-emerald-500/40 hover:border-emerald-400 group-hover:border-emerald-400",
      glowClass: "shadow-[0_0_20px_rgba(16,185,129,0.25)]",
      badgeClass: "bg-emerald-950/80 text-emerald-300 border-emerald-500/50",
      barGrad: "from-emerald-600 via-teal-400 to-emerald-200",
      data: engineData,
      pct: enginePct,
      sysLabel: "LƯỢNG TỬ SỨC ĐẨY",
      defaultSubsystems: [
        { name: "Vòng tua Warp", value: "8.42 kRPM", active: true },
        { name: "VECTOR phản lực", value: "3 Trục 360°", active: true },
        { name: "Quá nhiệt lõi", value: "42°C (Mát)", active: true },
      ],
    },
    {
      id: "weaponPower" as const,
      name: "CÔNG SUẤT VŨ KHÍ",
      subName: "TACTICAL ORDNANCE OUTPUT",
      icon: Sword,
      accentColor: "#f59e0b", // Amber/Orange
      borderClass: "border-amber-500/40 hover:border-amber-400 group-hover:border-amber-400",
      glowClass: "shadow-[0_0_20px_rgba(245,158,11,0.25)]",
      badgeClass: "bg-amber-950/80 text-amber-300 border-amber-500/50",
      barGrad: "from-amber-600 via-orange-400 to-yellow-200",
      data: weaponData,
      pct: weaponPct,
      sysLabel: "KÊNH DẪN HỎA LỰC",
      defaultSubsystems: [
        { name: "Tụ Plasma", value: "Nạp 99.8%", active: true },
        { name: "Xuyên giáp AP", value: "+45 Xuyên", active: true },
        { name: "Đồng bộ Target", value: "0.02ms Lag", active: true },
      ],
    },
  ]

  return (
    <div
      className={cn(
        "relative rounded-sm border border-cyan-500/40 bg-panel/85 p-3.5 sm:p-4 shadow-xl backdrop-blur-md overflow-hidden",
        className,
      )}
    >
      {/* Background Decorative Grid and Radar Circles */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #22d3ee 1px, transparent 1px), linear-gradient(to bottom, #22d3ee 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full border border-cyan-500/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]" />

      {/* Header Bar */}
      <div className="relative mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/30 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex size-8 shrink-0 items-center justify-center rounded-xs border border-cyan-500/60 bg-cyan-950/80 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.25)]">
            <Radio className="size-4 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                {shipName}
              </span>
              <span className="rounded bg-black/60 px-1.5 py-0.2 font-mono text-[9px] font-bold text-cyan-300 border border-cyan-500/40">
                {hullId}
              </span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground block">
              PHÂN HỆ CHIẾN THUẬT: <strong className="text-cyan-400">{shipClass}</strong>
            </span>
          </div>
        </div>

        {/* Readiness Metric */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-sm border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1 font-mono text-xs text-emerald-300 shadow-sm">
            <Activity className="size-3.5 text-emerald-400" />
            <span className="text-[10px] text-muted-foreground hidden sm:inline">KHẢ DỤNG:</span>
            <strong className="text-white font-bold">{overallReadiness}%</strong>
          </div>
          <div className="hidden md:flex items-center gap-1 text-[9px] font-mono text-cyan-400/80">
            <Cpu className="size-3" />
            <span>TELEMETRY SYNC: 60Hz</span>
          </div>
        </div>
      </div>

      {/* Main Tactical Stats Grid: 3 Primary Columns (Shield, Engine, Weapon Power) */}
      <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const isSelected = selectedMetric === card.id
          const subsystems = card.data.subsystems || card.defaultSubsystems
          const Icon = card.icon

          return (
            <div
              key={card.id}
              onClick={() => onSelectMetric?.(card.id)}
              className={cn(
                "group relative flex flex-col justify-between rounded-sm border bg-black/60 p-3 transition-all",
                card.borderClass,
                isSelected
                  ? "ring-1 ring-cyan-400/80 bg-cyan-950/40 " + card.glowClass
                  : "hover:bg-panel/70",
                onSelectMetric && "cursor-pointer",
              )}
            >
              {/* Corner Sci-Fi Bracket Marks */}
              <div className="pointer-events-none absolute -top-px -left-px size-2 border-t-2 border-l-2" style={{ borderColor: card.accentColor }} />
              <div className="pointer-events-none absolute -bottom-px -right-px size-2 border-b-2 border-r-2" style={{ borderColor: card.accentColor }} />

              <div>
                {/* Header of Pod */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="size-7 rounded-xs flex items-center justify-center border bg-black/80"
                      style={{
                        borderColor: `${card.accentColor}70`,
                        color: card.accentColor,
                        boxShadow: `0 0 10px ${card.accentColor}30`,
                      }}
                    >
                      <Icon className="size-3.5" />
                    </div>
                    <div>
                      <h4 className="font-display text-xs font-bold text-white group-hover:text-cyan-200 transition-colors">
                        {card.name}
                      </h4>
                      <span className="font-mono text-[9px] text-muted-foreground block tracking-tight">
                        {card.subName}
                      </span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 font-mono text-[9px] font-bold border shrink-0",
                      card.badgeClass,
                    )}
                  >
                    {card.pct}%
                  </span>
                </div>

                {/* Main Digital Readout */}
                <div className="mt-3 flex items-baseline justify-between font-mono">
                  <div className="flex items-baseline gap-1">
                    <span
                      className="font-display text-xl sm:text-2xl font-black tracking-tight"
                      style={{ color: card.accentColor }}
                    >
                      {card.data.current.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      / {card.data.max.toLocaleString()} {card.data.unit}
                    </span>
                  </div>

                  {card.data.delta && (
                    <span className="rounded bg-emerald-950/90 border border-emerald-500/40 px-1 py-0.5 text-[9px] font-mono text-emerald-300">
                      {card.data.delta}
                    </span>
                  )}
                </div>

                {/* Progress Bar with Sci-Fi Segments */}
                <div className="mt-2 space-y-1">
                  <div className="relative h-2 w-full overflow-hidden rounded-xs bg-slate-900 border border-border/50">
                    {/* Animated Fill Bar */}
                    <div
                      className={cn("h-full bg-gradient-to-r transition-all duration-500", card.barGrad)}
                      style={{ width: `${card.pct}%` }}
                    />
                    {/* Overlay Segment Marks (10 tick lines) */}
                    <div className="absolute inset-0 flex justify-between pointer-events-none px-0.5 opacity-40">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="w-px h-full bg-black/80" />
                      ))}
                    </div>
                  </div>

                  {/* Status & Sub-band Text */}
                  <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground pt-0.5">
                    <span className="flex items-center gap-1">
                      <span
                        className="size-1.5 rounded-full animate-ping"
                        style={{ backgroundColor: card.accentColor }}
                      />
                      <span className="text-slate-300">{card.data.status}</span>
                    </span>
                    <span className="text-[8.5px] text-muted-foreground/80">{card.sysLabel}</span>
                  </div>
                </div>

                {/* Detailed Subsystem Matrix (if not compact) */}
                {variant !== "compact" && (
                  <div className="mt-3 rounded border border-border/40 bg-black/50 p-2 space-y-1 text-[9.5px] font-mono">
                    {subsystems.map((sub, idx) => (
                      <div key={idx} className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1 truncate">
                          <span className="size-1 rounded-full bg-cyan-400/60" />
                          <span>{sub.name}:</span>
                        </span>
                        <strong className="text-slate-200 font-mono ml-2 shrink-0">
                          {sub.value}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Quick Action / Status Footer */}
              <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[9px] font-mono text-muted-foreground">
                <span className="tracking-wider text-slate-400">STATUS: NOMINAL</span>
                <span className="text-cyan-400 group-hover:text-cyan-300 flex items-center gap-0.5">
                  <Sparkles className="size-2.5" />
                  <span>SẴN SÀNG</span>
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Decorative Technical Sub-bar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-cyan-500/20 pt-2 font-mono text-[9.5px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400/80">GRID ARCH: 3-TIER MODULAR</span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline">POWER BUS: 450V OVERCHARGED</span>
        </div>
        <div className="flex items-center gap-2 text-cyan-300">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          <span>HỆ THỐNG PHẢN ỨNG TÁC CHIẾN TỐI ƯU</span>
        </div>
      </div>
    </div>
  )
}

export default ShipStatDisplay
