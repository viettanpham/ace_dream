"use client"

import { useState, useMemo } from "react"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ResourceHistoryPoint {
  day: number
  value: number
}

export interface ResourceSparklineProps {
  name: string
  currentValue: number
  targetValue: number
  warningThreshold: number
  criticalThreshold?: number
  unitLabel?: string
  icon: React.ComponentType<{ className?: string }>
  history?: ResourceHistoryPoint[]
  className?: string
}

export function ResourceSparkline({
  name,
  currentValue,
  targetValue,
  warningThreshold,
  criticalThreshold = 0,
  unitLabel = "",
  icon: Icon,
  history = [],
  className,
}: ResourceSparklineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Sắp xếp lịch sử theo ngày
  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => a.day - b.day)
  }, [history])

  // Trạng thái mức độ đe dọa / cạn kiệt tài nguyên
  const statusTier = useMemo(() => {
    if (currentValue <= criticalThreshold) {
      return {
        isCritical: true,
        isWarning: true,
        border: "border-red-500/70 bg-red-950/30 text-red-300",
        stroke: "#ef4444",
        badgeBg: "bg-red-500/20 text-red-300 border-red-500/40",
        valueText: "CẠN KIỆT (0)",
      }
    }
    if (currentValue < warningThreshold) {
      return {
        isCritical: false,
        isWarning: true,
        border: "border-amber-500/60 bg-amber-950/20 text-amber-300",
        stroke: "#f59e0b",
        badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        valueText: `${currentValue.toLocaleString()} / ${targetValue}${unitLabel ? ` ${unitLabel}` : ""}`,
      }
    }
    return {
      isCritical: false,
      isWarning: false,
      border: "border-zinc-800/80 bg-zinc-900/40 text-zinc-300",
      stroke: "#10b981",
      badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      valueText: `${currentValue.toLocaleString()} / ${targetValue}${unitLabel ? ` ${unitLabel}` : ""}`,
    }
  }, [currentValue, criticalThreshold, warningThreshold, targetValue, unitLabel])

  // Biến động Delta giữa 2 điểm gần nhất
  const trendMetrics = useMemo(() => {
    if (sortedHistory.length < 2) return null
    const latest = sortedHistory[sortedHistory.length - 1]
    const previous = sortedHistory[sortedHistory.length - 2]
    const delta = latest.value - previous.value
    return {
      delta,
      direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
      latestDay: latest.day,
      previousDay: previous.day,
    }
  }, [sortedHistory])

  // Tọa độ SVG cho micro-sparkline
  const sparklineGeometry = useMemo(() => {
    if (sortedHistory.length < 2) return null

    const width = 84
    const height = 24
    const padX = 6
    const padY = 4

    const values = sortedHistory.map((p) => p.value)
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    const range = Math.max(10, maxVal - minVal)

    const points = sortedHistory.map((pt, i) => {
      const x = padX + (i / (sortedHistory.length - 1)) * (width - 2 * padX)
      const normalizedY = (pt.value - minVal) / range
      const y = height - padY - normalizedY * (height - 2 * padY)
      return { x, y, day: pt.day, value: pt.value }
    })

    const lineString = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
    const firstPoint = points[0]
    const lastPoint = points[points.length - 1]
    const areaString = `${firstPoint.x.toFixed(1)},${height.toFixed(1)} ${lineString} ${lastPoint.x.toFixed(1)},${height.toFixed(1)}`

    return {
      width,
      height,
      points,
      lineString,
      areaString,
    }
  }, [sortedHistory])

  const activePoint = hoveredIndex !== null && sparklineGeometry
    ? sparklineGeometry.points[hoveredIndex]
    : null

  return (
    <div
      className={cn(
        "p-2 rounded border text-[10px] space-y-1.5 transition-colors",
        statusTier.border,
        className
      )}
    >
      {/* Hàng 1: Tên tài nguyên & Giá trị hiện tại */}
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 font-medium truncate">
          <Icon className="size-3.5 shrink-0" />
          <span className="truncate">{name}:</span>
        </span>
        <span className="font-bold font-mono shrink-0">
          {statusTier.valueText}
        </span>
      </div>

      {/* Hàng 2: Micro Sparkline + Xu hướng hoặc Fallback */}
      <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-zinc-800/40">
        {sortedHistory.length < 2 || !sparklineGeometry ? (
          <div className="flex items-center justify-between w-full text-[9px] text-zinc-500 font-mono">
            <span>Xu hướng:</span>
            <span className="italic text-zinc-500">Chưa đủ dữ liệu lịch sử</span>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full gap-2">
            {/* Vùng vẽ Sparkline SVG */}
            <div className="relative w-[84px] h-[24px] bg-black/40 rounded border border-zinc-800/60 flex items-center justify-center overflow-visible">
              <svg
                viewBox={`0 0 ${sparklineGeometry.width} ${sparklineGeometry.height}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <defs>
                  <linearGradient
                    id={`sparkline-grad-${name.replace(/\s+/g, "-")}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={statusTier.stroke} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={statusTier.stroke} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Đường nền đứt đoạn */}
                <line
                  x1="4"
                  y1={sparklineGeometry.height / 2}
                  x2={sparklineGeometry.width - 4}
                  y2={sparklineGeometry.height / 2}
                  stroke="#27272a"
                  strokeDasharray="2,2"
                  strokeWidth="0.5"
                />

                {/* Diện tích fill mờ */}
                <polygon
                  points={sparklineGeometry.areaString}
                  fill={`url(#sparkline-grad-${name.replace(/\s+/g, "-")})`}
                />

                {/* Đường biểu diễn Polyline */}
                <polyline
                  points={sparklineGeometry.lineString}
                  fill="none"
                  stroke={statusTier.stroke}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Các điểm dữ liệu */}
                {sparklineGeometry.points.map((pt, idx) => {
                  const isLatest = idx === sparklineGeometry.points.length - 1
                  const isHovered = hoveredIndex === idx
                  return (
                    <g
                      key={pt.day}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(idx)}
                    >
                      <circle cx={pt.x} cy={pt.y} r="8" fill="transparent" />
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 3 : isLatest ? 2.5 : 1.5}
                        fill={statusTier.stroke}
                        stroke="#09090b"
                        strokeWidth="1"
                      />
                    </g>
                  )
                })}
              </svg>

              {/* Tooltip nhỏ khi hover */}
              {activePoint && (
                <div
                  className="absolute -top-5 pointer-events-none rounded bg-black/95 border border-zinc-700 px-1 py-0.2 text-[8px] font-mono text-zinc-200 shadow-md transform -translate-x-1/2 whitespace-nowrap z-20"
                  style={{
                    left: `${(activePoint.x / sparklineGeometry.width) * 100}%`,
                  }}
                >
                  N#{activePoint.day}: {activePoint.value}
                </div>
              )}
            </div>

            {/* Chỉ số biến động Delta */}
            <div className="flex items-center gap-1 font-mono text-[9px] shrink-0">
              {trendMetrics && (
                <span
                  className={cn(
                    "flex items-center font-bold",
                    trendMetrics.direction === "up"
                      ? "text-emerald-400"
                      : trendMetrics.direction === "down"
                      ? "text-red-400"
                      : "text-zinc-400"
                  )}
                  title={`Biến động từ Ngày #${trendMetrics.previousDay} sang Ngày #${trendMetrics.latestDay}`}
                >
                  {trendMetrics.direction === "up" && <ArrowUpRight className="size-2.5" />}
                  {trendMetrics.direction === "down" && <ArrowDownRight className="size-2.5" />}
                  {trendMetrics.direction === "flat" && <Minus className="size-2.5" />}
                  <span>
                    {trendMetrics.delta > 0 ? `+${trendMetrics.delta}` : trendMetrics.delta}
                  </span>
                  <span className="text-[8px] opacity-75 font-sans ml-0.5">
                    /ngày
                  </span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
