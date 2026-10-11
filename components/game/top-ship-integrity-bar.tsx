"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Shield,
  Heart,
  Zap,
  Activity,
  AlertTriangle,
  Cpu,
  ChevronRight,
  Sparkles,
  Radio,
  SlidersHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { StarfrontProgression, StarfrontGearId } from "@/lib/game/types"
import { calculateTotalGearStats } from "@/lib/game/progression"
import { STARFRONT_GEAR_DEFS, STARFRONT_PILOT_MAP } from "@/lib/game/data"

export interface TopShipIntegrityBarProps {
  progression: StarfrontProgression
  onInspectShip?: () => void
  className?: string
}

/**
 * TopShipIntegrityBar
 * Subtle, persistent health/armor status bar overlay at the top of the screen
 * that reflects the player's active ship's current integrity and armor level.
 */
export function TopShipIntegrityBar({
  progression,
  onInspectShip,
  className,
}: TopShipIntegrityBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const activeGearId: StarfrontGearId = progression.activeGearId || "vanguard"
  const gearDef = STARFRONT_GEAR_DEFS[activeGearId] || STARFRONT_GEAR_DEFS.vanguard
  const activePilotId = progression.activePairing?.pilotId || "marcus"
  const pilotDef = STARFRONT_PILOT_MAP[activePilotId] || STARFRONT_PILOT_MAP.marcus
  const pilotData = progression.pilots?.[activePilotId]

  // Calculate stats based on ship level, inventory, and equipped items
  const { total } = calculateTotalGearStats(
    activeGearId,
    progression.level,
    progression.inventory,
    progression.equipped,
    pilotData,
  )

  // Maximum and current baseline values
  const maxHullHp = total.hp
  const maxArmorDef = total.defense * 4 // Armor durability scale based on Defense
  const maxEnergySp = total.sp

  // Default integrity rating: 100% nominal when not damaged
  // In a persistent state, integrity reflects current hull health condition
  const hullIntegrityPct = 100
  const armorIntegrityPct = Math.min(100, Math.max(30, Math.round((total.defense / 150) * 100)))
  const energyIntegrityPct = 100

  // Status state
  const isOptimal = hullIntegrityPct >= 80
  const isCompromised = hullIntegrityPct < 50

  return (
    <div
      className={cn(
        "relative w-full z-20 select-none font-mono text-xs border-b transition-colors backdrop-blur-md",
        "border-cyan-500/30 bg-black/85 shadow-sm",
        className,
      )}
    >
      {/* Micro Status Bar Strip */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-1 sm:px-4">
        {/* Left: Ship ID, Hull Class & Integrity Summary */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Pulsing Signal Dot */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={cn(
                "size-2 rounded-full",
                isOptimal ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-ping",
              )}
            />
            <span className="hidden sm:inline text-[9.5px] font-bold text-cyan-400 uppercase tracking-wider">
              SHIP INTEGRITY
            </span>
          </div>

          <div className="h-3 w-px bg-cyan-500/30 hidden sm:block" />

          {/* Ship Name & Pilot Badge */}
          <button
            onClick={onInspectShip}
            className="flex items-center gap-1.5 truncate text-left hover:opacity-80 transition-opacity cursor-pointer"
            title="Bấm để xem chi tiết Buồng Lái & Hangar"
          >
            <span
              className="size-2 rounded-xs shrink-0"
              style={{ backgroundColor: gearDef.color }}
            />
            <span className="font-display text-[11px] font-bold uppercase tracking-wide text-white truncate">
              {gearDef.name}
            </span>
            <span className="text-[10px] text-muted-foreground hidden md:inline">
              ({pilotDef.callsign})
            </span>
          </button>
        </div>

        {/* Center: Dual Tactical Bar (HULL INTEGRITY & ARMOR RESISTANCE) */}
        <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1 max-w-xl mx-2 sm:mx-4">
          {/* 1. Vỏ Giáp / Thân Tàu (Hull HP Integrity) */}
          <div className="flex-1 min-w-[90px]">
            <div className="flex items-center justify-between text-[9px] mb-0.5 leading-none">
              <span className="flex items-center gap-1 text-red-300 font-bold">
                <Heart className="size-2.5 text-red-400" />
                <span>HULL</span>
              </span>
              <span className="text-white font-mono">
                {maxHullHp} <span className="text-muted-foreground text-[8px]">HP</span>
              </span>
            </div>
            <div className="relative h-1.5 w-full rounded-xs bg-slate-900 overflow-hidden border border-red-500/30">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-red-300 transition-all duration-300"
                style={{ width: `${hullIntegrityPct}%` }}
              />
              {/* Segment tick overlays */}
              <div className="absolute inset-0 flex justify-between pointer-events-none px-0.5 opacity-30">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-px h-full bg-black" />
                ))}
              </div>
            </div>
          </div>

          {/* 2. Giáp Hấp Thụ / Phòng Thủ (Armor Absorption) */}
          <div className="flex-1 min-w-[90px]">
            <div className="flex items-center justify-between text-[9px] mb-0.5 leading-none">
              <span className="flex items-center gap-1 text-cyan-300 font-bold">
                <Shield className="size-2.5 text-cyan-400" />
                <span>ARMOR</span>
              </span>
              <span className="text-white font-mono">
                {total.defense} <span className="text-muted-foreground text-[8px]">DEF</span>
              </span>
            </div>
            <div className="relative h-1.5 w-full rounded-xs bg-slate-900 overflow-hidden border border-cyan-500/30">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 via-sky-400 to-cyan-200 transition-all duration-300"
                style={{ width: `${armorIntegrityPct}%` }}
              />
              <div className="absolute inset-0 flex justify-between pointer-events-none px-0.5 opacity-30">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-px h-full bg-black" />
                ))}
              </div>
            </div>
          </div>

          {/* 3. Năng Lượng Thần Kinh (Energy / SP) - visible on md+ */}
          <div className="hidden lg:block flex-1 min-w-[90px]">
            <div className="flex items-center justify-between text-[9px] mb-0.5 leading-none">
              <span className="flex items-center gap-1 text-amber-300 font-bold">
                <Zap className="size-2.5 text-amber-400" />
                <span>SP CORE</span>
              </span>
              <span className="text-white font-mono">
                {maxEnergySp} <span className="text-muted-foreground text-[8px]">SP</span>
              </span>
            </div>
            <div className="relative h-1.5 w-full rounded-xs bg-slate-900 overflow-hidden border border-amber-500/30">
              <div
                className="h-full bg-gradient-to-r from-amber-600 via-orange-400 to-yellow-200 transition-all duration-300"
                style={{ width: `${energyIntegrityPct}%` }}
              />
              <div className="absolute inset-0 flex justify-between pointer-events-none px-0.5 opacity-30">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-px h-full bg-black" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Diagnostic Dropdown Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1 rounded bg-emerald-950/80 px-1.5 py-0.2 text-[8.5px] font-bold text-emerald-300 border border-emerald-500/40">
            <Radio className="size-2.5 animate-pulse" />
            <span>NOMINAL 100%</span>
          </span>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 rounded border border-border/50 bg-black/40 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
            title={isExpanded ? "Thu gọn phân tích chi tiết" : "Xem phân tích chi tiết thân tàu"}
          >
            <span className="hidden md:inline">DIAGNOSTIC</span>
            <ChevronRight
              className={cn("size-3 transition-transform duration-200", isExpanded && "rotate-90")}
            />
          </button>
        </div>
      </div>

      {/* Expanded Technical Telemetry Drawer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="border-t border-cyan-500/20 bg-black/90 px-3 py-2 text-[10px] font-mono overflow-hidden"
          >
            <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-red-400" />
                  <span>Kết Cấu Thân Tàu (Hull HP):</span>
                  <strong className="text-white font-mono">{maxHullHp} / {maxHullHp}</strong>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-cyan-400" />
                  <span>Chỉ Số Giáp & Giảm Thương:</span>
                  <strong className="text-cyan-300 font-mono">
                    {total.defense} DEF (~{Math.round((total.defense / (total.defense + 100)) * 100)}% Giảm Sát Thương)
                  </strong>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  <span>Tốc Độ & Cơ Động (SPD):</span>
                  <strong className="text-emerald-300 font-mono">{total.speed} SPD</strong>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-purple-400" />
                  <span>Hiệu Năng Hỏa Lực (ATK):</span>
                  <strong className="text-purple-300 font-mono">{total.attack} ATK</strong>
                </div>
              </div>

              {onInspectShip && (
                <button
                  onClick={onInspectShip}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-200 font-bold underline cursor-pointer"
                >
                  <span>Chuyển đến Hangar & Trang Bị →</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TopShipIntegrityBar
