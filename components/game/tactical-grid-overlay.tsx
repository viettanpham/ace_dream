"use client"

import React, { useId } from "react"
import { cn } from "@/lib/utils"

export interface TacticalGridOverlayProps {
  /** Grid geometry: 'hex' (hexagonal space lattice) or 'square' (cartesian sector grid) or 'dual' (both combined) */
  pattern?: "hex" | "square" | "dual"
  /** Animation mode: 'drift' (subtle parallax drift) or 'pulse' (coordinates radar pulse) or 'static' */
  animation?: "drift" | "pulse" | "static"
  /** Show spatial coordinate crosshairs and military telemetry markings (e.g. [X:44, Y:82]) */
  showCoordinates?: boolean
  /** Custom density / scale: 'compact' (32px), 'normal' (48px), or 'wide' (72px) */
  density?: "compact" | "normal" | "wide"
  /** Corner reticle brackets for tactical HUD feel */
  showReticles?: boolean
  /** Opacity level override (default: 0.85) */
  opacity?: number
  /** Custom CSS classes */
  className?: string
}

/**
 * TacticalGridOverlay
 * Renders a subtle, animated hexagonal or square spatial coordinate grid
 * using the existing `--color-grid-line` (or CSS variable `var(--grid-line)`)
 * from globals.css to maintain 100% theme consistency across all views.
 */
export function TacticalGridOverlay({
  pattern = "dual",
  animation = "drift",
  showCoordinates = true,
  density = "normal",
  showReticles = true,
  opacity = 0.9,
  className,
}: TacticalGridOverlayProps) {
  const compId = useId()

  const size = density === "compact" ? 32 : density === "wide" ? 72 : 48
  const halfSize = size / 2

  // Hex dimensions: standard regular hexagon SVG path
  const hexWidth = size * 1.5
  const hexHeight = size * 1.732 // sqrt(3) ~ 1.732

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden select-none",
        className,
      )}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* SVG Spatial Grid Pattern Definitions */}
      <svg
        className="absolute inset-0 size-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color: "var(--grid-line)" }}
      >
        <defs>
          {/* 1. Square Cartesian Grid Pattern */}
          <pattern
            id={`square-grid-${compId}`}
            width={size}
            height={size}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${size} 0 L 0 0 0 ${size}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray={density === "compact" ? "2 2" : "3 3"}
            />
            {/* Center tick mark */}
            <circle cx={halfSize} cy={halfSize} r="1" fill="currentColor" opacity="0.6" />
          </pattern>

          {/* 2. Hexagonal Spatial Coordinate Grid Pattern */}
          <pattern
            id={`hex-grid-${compId}`}
            width={hexWidth}
            height={hexHeight}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`
                M ${hexWidth * 0.25} 0 
                L ${hexWidth * 0.75} 0 
                L ${hexWidth} ${hexHeight * 0.5} 
                L ${hexWidth * 0.75} ${hexHeight} 
                L ${hexWidth * 0.25} ${hexHeight} 
                L 0 ${hexHeight * 0.5} Z
                M ${hexWidth * 0.75} 0 
                L ${hexWidth * 1.25} 0
              `}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              opacity="0.75"
            />
            {/* Hex center coordinate point */}
            <circle
              cx={hexWidth * 0.5}
              cy={hexHeight * 0.5}
              r="0.8"
              fill="currentColor"
              opacity="0.8"
            />
          </pattern>

          {/* 3. Radial Vignette Mask so grid fades gracefully at extreme borders */}
          <radialGradient id={`vignette-mask-${compId}`} cx="50%" cy="50%" r="75%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="65%" stopColor="#fff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.1" />
          </radialGradient>

          <mask id={`grid-mask-${compId}`}>
            <rect width="100%" height="100%" fill={`url(#vignette-mask-${compId})`} />
          </mask>
        </defs>

        {/* Render Pattern Layers */}
        <g mask={`url(#grid-mask-${compId})`}>
          {/* Square Grid Layer */}
          {(pattern === "square" || pattern === "dual") && (
            <rect
              width="100%"
              height="100%"
              fill={`url(#square-grid-${compId})`}
              className={cn(
                animation === "drift" && "animate-[pulse_8s_ease-in-out_infinite]",
                animation === "pulse" && "animate-pulse",
              )}
            />
          )}

          {/* Hex Grid Layer */}
          {(pattern === "hex" || pattern === "dual") && (
            <rect
              width="100%"
              height="100%"
              fill={`url(#hex-grid-${compId})`}
              className={cn(
                animation === "drift" && "opacity-60",
                animation === "pulse" && "animate-pulse opacity-80",
              )}
            />
          )}
        </g>
      </svg>

      {/* Spatial Telemetry Coordinates & Axis Marks */}
      {showCoordinates && (
        <div className="absolute inset-0 flex flex-col justify-between p-2 sm:p-3 pointer-events-none font-mono text-[8px] text-cyan-500/40 opacity-70">
          {/* Top Axis Coordinates */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span className="inline-block size-1 bg-cyan-400/50" />
              <span>SEC-ALPHA // [X: 04.22 AU]</span>
            </span>
            <span className="hidden sm:inline">WARP VECTOR: 360° / GRID NOMINAL</span>
            <span className="flex items-center gap-1">
              <span>[Y: 88.40 AU]</span>
              <span className="inline-block size-1 bg-cyan-400/50" />
            </span>
          </div>

          {/* Center Space Reticle / Crosshair */}
          <div className="relative mx-auto flex items-center justify-center">
            <div className="size-16 rounded-full border border-cyan-500/15 flex items-center justify-center">
              <div className="size-1 rounded-full bg-cyan-400/40" />
            </div>
            <div className="absolute w-24 h-px bg-cyan-500/20" />
            <div className="absolute h-24 w-px bg-cyan-500/20" />
          </div>

          {/* Bottom Axis Coordinates */}
          <div className="flex items-center justify-between">
            <span>GRID FREQ: 44.1 kHz</span>
            <span className="hidden sm:inline">COORDINATE MESH: LATTICE-V4</span>
            <span>POLAR RES: 0.05mrad</span>
          </div>
        </div>
      )}

      {/* Four-Corner Tactical HUD Reticles */}
      {showReticles && (
        <>
          <div className="pointer-events-none absolute top-1.5 left-1.5 size-3 border-t-2 border-l-2 border-cyan-500/30" />
          <div className="pointer-events-none absolute top-1.5 right-1.5 size-3 border-t-2 border-r-2 border-cyan-500/30" />
          <div className="pointer-events-none absolute bottom-1.5 left-1.5 size-3 border-b-2 border-l-2 border-cyan-500/30" />
          <div className="pointer-events-none absolute bottom-1.5 right-1.5 size-3 border-b-2 border-r-2 border-cyan-500/30" />
        </>
      )}
    </div>
  )
}

export default TacticalGridOverlay
