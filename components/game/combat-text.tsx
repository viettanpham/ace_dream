"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Flame,
  Shield,
  Zap,
  Sparkles,
  Wind,
  Crosshair,
  AlertTriangle,
  Heart,
  Swords,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type CombatTextType =
  | "damage-player"      // Damage dealt by player to enemy (red/orange text floating over enemy)
  | "damage-enemy"       // Damage dealt by enemy to player (red/purple text floating over player)
  | "crit"               // Critical strike damage
  | "evade"              // Miss / Evasion
  | "shield"             // Shield absorb / block / reflect
  | "heal"               // Health restored
  | "status"             // Buff/Debuff applied (EMP, Burn, Stun, Overclock)
  | "system"             // Tactical announcement (Follow-up attack, Passive trigger)

export interface CombatTextItem {
  id: string
  text: string | number
  type: CombatTextType
  /** Target position: 'left' (player side), 'right' (enemy side), or 'center' (play arena mid) */
  target?: "left" | "right" | "center"
  /** Optional custom sub-label or icon tag */
  tag?: string
  /** Subtitle description (e.g., 'Phản đòn -45 HP', 'Bắn bồi Falcon ⚡') */
  subtitle?: string
  /** Optional offset in px to stagger multiple simultaneous hits */
  xOffset?: number
  yOffset?: number
}

export interface CombatTextProps {
  /** Active floating text events */
  items: CombatTextItem[]
  /** Callback when an item's animation finishes and should be removed */
  onItemComplete?: (id: string) => void
  /** Container custom classes */
  className?: string
}

/**
 * CombatText
 * Renders animated floating damage numbers or combat log events
 * over the turn-based play area with energetic sci-fi physics (spring pop, float upward, fade).
 */
export function CombatText({ items, onItemComplete, className }: CombatTextProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-40 overflow-hidden select-none font-display",
        className,
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {items.map((item) => {
          const isCrit = item.type === "crit"
          const isEvade = item.type === "evade"
          const isShield = item.type === "shield"
          const isHeal = item.type === "heal"
          const isStatus = item.type === "status"
          const isPlayerDmg = item.type === "damage-player"
          const isEnemyDmg = item.type === "damage-enemy"
          const isSystem = item.type === "system"

          // Horizontal alignment based on target
          const targetPlacement =
            item.target === "left"
              ? "left-[20%] sm:left-[24%]"
              : item.target === "right"
                ? "left-[80%] sm:left-[76%]"
                : "left-1/2 -translate-x-1/2"

          // Theme styling based on event type
          let colorClasses = "text-white border-white/40 bg-black/80"
          let glowShadow = "drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]"

          if (isCrit) {
            colorClasses =
              "text-amber-300 border-amber-400 bg-amber-950/90 shadow-[0_0_30px_rgba(245,158,11,0.6)] ring-1 ring-amber-300"
            glowShadow = "drop-shadow-[0_0_20px_rgba(245,158,11,0.9)]"
          } else if (isPlayerDmg) {
            // Player hitting enemy: Bright orange/amber damage
            colorClasses =
              "text-orange-300 border-orange-500/60 bg-black/85 shadow-[0_0_20px_rgba(249,115,22,0.4)]"
            glowShadow = "drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]"
          } else if (isEnemyDmg) {
            // Enemy hitting player: Threatening Red/Crimson damage
            colorClasses =
              "text-red-400 border-red-500/80 bg-red-950/90 shadow-[0_0_25px_rgba(239,68,68,0.5)]"
            glowShadow = "drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]"
          } else if (isEvade) {
            // Evade: Swift Teal/Cyan with wind effect
            colorClasses =
              "text-cyan-300 border-cyan-400/80 bg-cyan-950/90 shadow-[0_0_20px_rgba(6,182,212,0.5)]"
            glowShadow = "drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]"
          } else if (isShield) {
            // Shield Block/Reflect: Electric Blue
            colorClasses =
              "text-blue-300 border-blue-400/80 bg-blue-950/90 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
            glowShadow = "drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]"
          } else if (isHeal) {
            // Heal/Regen: Healing Emerald
            colorClasses =
              "text-emerald-300 border-emerald-400/80 bg-emerald-950/90 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
            glowShadow = "drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]"
          } else if (isStatus) {
            // Status: Purple/Violet
            colorClasses =
              "text-purple-300 border-purple-400/80 bg-purple-950/90 shadow-[0_0_20px_rgba(168,85,247,0.5)]"
            glowShadow = "drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]"
          } else if (isSystem) {
            // System: High-tech Cyan/Gold
            colorClasses =
              "text-amber-200 border-cyan-400/80 bg-cyan-950/90 shadow-[0_0_25px_rgba(34,211,238,0.4)]"
            glowShadow = "drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]"
          }

          // Initial & Target Offsets
          const startX = item.xOffset || 0
          const startY = item.yOffset || 0

          return (
            <motion.div
              key={item.id}
              initial={{
                opacity: 0,
                scale: 0.4,
                y: startY + 20,
                x: startX,
              }}
              animate={{
                opacity: [0, 1, 1, 0.85, 0],
                scale: isCrit ? [0.6, 1.35, 1.2, 1.1, 0.95] : [0.6, 1.15, 1.05, 1, 0.9],
                y: [startY + 20, startY - 30, startY - 55, startY - 75, startY - 95],
                x: [startX, startX + (isCrit ? (Math.random() > 0.5 ? 8 : -8) : 0), startX],
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                duration: isCrit ? 1.6 : 1.3,
                times: [0, 0.15, 0.4, 0.75, 1],
                ease: "easeOut",
              }}
              onAnimationComplete={() => {
                onItemComplete?.(item.id)
              }}
              className={cn(
                "absolute top-[35%] pointer-events-none flex flex-col items-center justify-center -translate-x-1/2",
                targetPlacement,
              )}
            >
              {/* Floating Combat Card / Badge */}
              <div
                className={cn(
                  "relative flex items-center gap-2 rounded-xs border px-3 py-1.5 backdrop-blur-md",
                  colorClasses,
                  glowShadow,
                )}
              >
                {/* Tech Bracket Corners */}
                <div className="absolute -top-1 -left-1 size-1.5 border-t border-l border-white/60" />
                <div className="absolute -top-1 -right-1 size-1.5 border-t border-r border-white/60" />
                <div className="absolute -bottom-1 -left-1 size-1.5 border-b border-l border-white/60" />
                <div className="absolute -bottom-1 -right-1 size-1.5 border-b border-r border-white/60" />

                {/* Event Icon */}
                {isCrit && <Flame className="size-5 text-amber-300 animate-pulse fill-amber-400" />}
                {isEvade && <Wind className="size-4 text-cyan-300 animate-pulse" />}
                {isShield && <Shield className="size-4 text-blue-300" />}
                {isHeal && <Heart className="size-4 text-emerald-300 fill-emerald-400" />}
                {isStatus && <Zap className="size-4 text-purple-300 animate-pulse" />}
                {isSystem && <Sparkles className="size-4 text-amber-300" />}
                {isPlayerDmg && !isCrit && <Swords className="size-4 text-orange-400" />}
                {isEnemyDmg && !isCrit && <Crosshair className="size-4 text-red-400" />}

                {/* Main Content */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5">
                    {item.tag && (
                      <span className="font-mono text-[9px] font-black uppercase tracking-wider opacity-90 px-1 py-0.2 rounded bg-black/40 border border-white/20">
                        {item.tag}
                      </span>
                    )}

                    <span
                      className={cn(
                        "font-display tracking-wider font-black",
                        isCrit ? "text-xl sm:text-2xl" : "text-base sm:text-lg",
                      )}
                    >
                      {item.text}
                    </span>
                  </div>

                  {item.subtitle && (
                    <span className="font-mono text-[9.5px] font-bold text-white/90 tracking-tight mt-0.5 whitespace-nowrap">
                      {item.subtitle}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default CombatText
