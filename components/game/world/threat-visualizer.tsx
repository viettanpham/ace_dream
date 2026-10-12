"use client"

import { useState, useMemo } from "react"
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Crosshair,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface ThreatHistoryDataPoint {
  day: number
  threat: number
  label?: string
}

export interface ThreatVisualizerProps {
  history: ThreatHistoryDataPoint[]
  currentThreat: number
  title?: string
  sectorName?: string
  viewMode?: "critical" | "average"
  onToggleViewMode?: (mode: "critical" | "average") => void
  onNavigateToSector?: () => void
  className?: string
}

export function ThreatVisualizer({
  history,
  currentThreat,
  title = "Xu Hướng Đe Dọa (Threat)",
  sectorName,
  viewMode = "critical",
  onToggleViewMode,
  onNavigateToSector,
  className,
}: ThreatVisualizerProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Phase 6.27: Đảm bảo dữ liệu được làm sạch, loại bỏ trùng ngày, sắp xếp tăng dần và giới hạn tối đa 10 mốc
  const sanitizedHistory = useMemo(() => {
    if (!history || history.length === 0) return []
    const map = new Map<number, ThreatHistoryDataPoint>()
    for (const pt of history) {
      if (typeof pt.day === "number" && typeof pt.threat === "number" && !isNaN(pt.day) && !isNaN(pt.threat)) {
        map.set(pt.day, pt)
      }
    }
    return Array.from(map.values())
      .sort((a, b) => a.day - b.day)
      .slice(-10)
  }, [history])

  // Tính toán biến động (Delta) giữa hai mốc gần nhất với thông tin độ lệch chu kỳ (gap-aware)
  const trendMetrics = useMemo(() => {
    if (sanitizedHistory.length < 2) {
      return null
    }
    const latest = sanitizedHistory[sanitizedHistory.length - 1]
    const previous = sanitizedHistory[sanitizedHistory.length - 2]
    const delta = latest.threat - previous.threat
    const dayGap = latest.day - previous.day
    return {
      delta,
      previousDay: previous.day,
      latestDay: latest.day,
      dayGap,
      direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
    }
  }, [sanitizedHistory])

  // Màu sắc theo mức Threat
  const threatTheme = useMemo(() => {
    if (currentThreat >= 700) {
      return {
        color: "#ef4444",
        label: "Nguy Cấp",
        border: "border-red-500/40",
        badgeBg: "bg-red-950/60 text-red-300",
        stroke: "#ef4444",
        gradientStop: "#ef4444",
      }
    }
    if (currentThreat >= 300) {
      return {
        color: "#f59e0b",
        label: "Báo Động",
        border: "border-amber-500/40",
        badgeBg: "bg-amber-950/60 text-amber-300",
        stroke: "#f59e0b",
        gradientStop: "#f59e0b",
      }
    }
    return {
      color: "#06b6d4",
      label: "An Toàn",
      border: "border-cyan-500/40",
      badgeBg: "bg-cyan-950/60 text-cyan-300",
      stroke: "#06b6d4",
      gradientStop: "#06b6d4",
    }
  }, [currentThreat])

  // Tính tọa độ SVG cho biểu đồ đường
  const chartGeometry = useMemo(() => {
    if (sanitizedHistory.length < 2) return null

    const width = 280
    const height = 52
    const padX = 14
    const padY = 8

    const threats = sanitizedHistory.map((p) => p.threat)
    const minVal = Math.max(0, Math.min(...threats) - 30)
    const maxVal = Math.min(1000, Math.max(...threats) + 30)
    const range = Math.max(80, maxVal - minVal)

    const points = sanitizedHistory.map((pt, i) => {
      const x = padX + (i / (sanitizedHistory.length - 1)) * (width - 2 * padX)
      const normalizedY = (pt.threat - minVal) / range
      // Y đảo ngược: giá trị cao hơn nằm ở trên (Y bé hơn)
      const y = height - padY - normalizedY * (height - 2 * padY)
      return { x, y, day: pt.day, threat: pt.threat }
    })

    const lineString = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
    const firstPoint = points[0]
    const lastPoint = points[points.length - 1]
    const areaString = `${firstPoint.x.toFixed(1)},${(height - 4).toFixed(1)} ${lineString} ${lastPoint.x.toFixed(1)},${(height - 4).toFixed(1)}`

    return {
      width,
      height,
      points,
      lineString,
      areaString,
      minVal,
      maxVal,
    }
  }, [sanitizedHistory])

  const activePoint = hoveredIndex !== null && chartGeometry
    ? chartGeometry.points[hoveredIndex]
    : null

  return (
    <div className={cn("rounded border border-zinc-800/80 bg-zinc-950/70 p-2.5 space-y-2", className)}>
      {/* Header Visualizer: Tiêu đề, chế độ xem, và nhãn xu hướng */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-zinc-800/60 pb-1.5">
        <div className="flex items-center gap-1.5">
          <Activity className="size-3.5" style={{ color: threatTheme.color }} />
          <span className="font-bold text-[10px] uppercase text-zinc-300 tracking-wider">
            {title}
          </span>
          {sectorName && (
            <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[110px]" title={sectorName}>
              · {sectorName}
            </span>
          )}
        </div>

        {/* Toggle chế độ xem: Điểm Nóng vs TB Thiên Hà */}
        {onToggleViewMode && (
          <div className="flex items-center rounded border border-zinc-800 bg-zinc-900/80 p-0.5 text-[9px] font-mono">
            <button
              type="button"
              onClick={() => onToggleViewMode("critical")}
              className={cn(
                "px-1.5 py-0.5 rounded cursor-pointer transition-colors",
                viewMode === "critical"
                  ? "bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Điểm Nóng
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode("average")}
              className={cn(
                "px-1.5 py-0.5 rounded cursor-pointer transition-colors",
                viewMode === "average"
                  ? "bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              TB Thiên Hà
            </button>
          </div>
        )}
      </div>

      {/* Thông số Threat hiện tại và Delta */}
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400">Mức hiện tại:</span>
          <strong className="font-mono text-xs font-bold" style={{ color: threatTheme.color }}>
            {currentThreat}/1000
          </strong>
          <span className={cn("px-1.5 py-0.2 rounded text-[9px] font-bold uppercase", threatTheme.badgeBg)}>
            {threatTheme.label}
          </span>
        </div>

        {trendMetrics ? (
          <div
            className={cn(
              "flex items-center gap-0.5 font-mono font-bold text-[10px]",
              trendMetrics.direction === "up"
                ? "text-red-400"
                : trendMetrics.direction === "down"
                ? "text-emerald-400"
                : "text-zinc-400"
            )}
            title={
              trendMetrics.dayGap === 1
                ? `Biến động từ Ngày #${trendMetrics.previousDay} sang Ngày #${trendMetrics.latestDay} (1 chu kỳ)`
                : `Biến động từ Ngày #${trendMetrics.previousDay} sang Ngày #${trendMetrics.latestDay} (cách ${trendMetrics.dayGap} chu kỳ)`
            }
          >
            {trendMetrics.direction === "up" && <ArrowUpRight className="size-3" />}
            {trendMetrics.direction === "down" && <ArrowDownRight className="size-3" />}
            {trendMetrics.direction === "flat" && <Minus className="size-3" />}
            <span>
              {trendMetrics.delta > 0 ? `+${trendMetrics.delta}` : trendMetrics.delta} Threat
            </span>
            <span className="text-[9px] opacity-80 uppercase ml-0.5">
              ({trendMetrics.direction === "up" ? "Tăng" : trendMetrics.direction === "down" ? "Giảm" : "Ổn định"})
            </span>
            {trendMetrics.dayGap > 1 && (
              <span className="text-[8px] text-zinc-500 font-sans ml-0.5">
                (N#{trendMetrics.previousDay}→N#{trendMetrics.latestDay})
              </span>
            )}
          </div>
        ) : (
          <span className="text-zinc-500 italic text-[9px]">Chưa đủ chu kỳ</span>
        )}
      </div>

      {/* Vùng Vẽ Biểu Đồ SVG hoặc Fallback khi chưa đủ dữ liệu */}
      {sanitizedHistory.length < 2 || !chartGeometry ? (
        <div className="flex flex-col items-center justify-center p-3 rounded border border-dashed border-zinc-800 bg-zinc-950/40 text-center">
          <span className="text-[10px] font-medium text-zinc-400">Chưa đủ dữ liệu lịch sử</span>
          <span className="text-[9px] text-zinc-600 mt-0.5">
            Cần ít nhất 2 chu kỳ ngày chiến lược thực tế để vẽ biểu đồ xu hướng
          </span>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="relative w-full h-14 bg-zinc-950/90 rounded border border-zinc-800/80 p-1 flex items-center justify-center overflow-hidden">
            <svg
              viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <defs>
                <linearGradient
                  id={`threat-visualizer-grad-${viewMode}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={threatTheme.gradientStop} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={threatTheme.gradientStop} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Đường lưới nền mờ đứt đoạn */}
              <line
                x1="14"
                y1={chartGeometry.height - 4}
                x2={chartGeometry.width - 14}
                y2={chartGeometry.height - 4}
                stroke="#27272a"
                strokeDasharray="2,2"
                strokeWidth="1"
              />
              <line
                x1="14"
                y1={chartGeometry.height / 2}
                x2={chartGeometry.width - 14}
                y2={chartGeometry.height / 2}
                stroke="#27272a"
                strokeDasharray="2,2"
                strokeWidth="0.75"
              />

              {/* Vùng diện tích mờ (Area Fill) */}
              <polygon
                points={chartGeometry.areaString}
                fill={`url(#threat-visualizer-grad-${viewMode})`}
              />

              {/* Đường biểu diễn xu hướng (Polyline) */}
              <polyline
                points={chartGeometry.lineString}
                fill="none"
                stroke={threatTheme.stroke}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Đường gióng dọc khi hover */}
              {activePoint && (
                <line
                  x1={activePoint.x}
                  y1={4}
                  x2={activePoint.x}
                  y2={chartGeometry.height - 4}
                  stroke="#71717a"
                  strokeDasharray="1,2"
                  strokeWidth="1"
                />
              )}

              {/* Các điểm dữ liệu ngày chiến lược */}
              {chartGeometry.points.map((pt, idx) => {
                const isLatest = idx === chartGeometry.points.length - 1
                const isHovered = hoveredIndex === idx
                return (
                  <g
                    key={pt.day}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                  >
                    {/* Vùng bắt chuột rộng hơn */}
                    <circle cx={pt.x} cy={pt.y} r="10" fill="transparent" />

                    {/* Hiệu ứng sóng lan tỏa cho điểm mới nhất */}
                    {isLatest && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="6"
                        fill={threatTheme.stroke}
                        fillOpacity="0.25"
                        className="animate-ping"
                      />
                    )}

                    {/* Điểm nút thực tế */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 4.5 : isLatest ? 3.5 : 2.5}
                      fill={threatTheme.stroke}
                      stroke="#09090b"
                      strokeWidth="1.5"
                    />
                  </g>
                )
              })}
            </svg>

            {/* Tooltip khi hover trên điểm dữ liệu */}
            {activePoint && (
              <div
                className="absolute top-1 pointer-events-none rounded bg-black/90 border border-zinc-700 px-1.5 py-0.5 text-[9px] font-mono text-zinc-200 shadow-md transform -translate-x-1/2 z-10"
                style={{
                  left: `${(activePoint.x / chartGeometry.width) * 100}%`,
                }}
              >
                <span>Ngày #{activePoint.day}: </span>
                <strong style={{ color: threatTheme.color }}>{activePoint.threat} Threat</strong>
              </div>
            )}
          </div>

          {/* Hàng nhãn mốc thời gian (Tối đa 10 chu kỳ gần nhất) */}
          <div className="flex items-center justify-between gap-1 text-[8px] font-mono text-zinc-500 pt-0.5">
            {sanitizedHistory.map((pt, idx, arr) => {
              const isLatest = idx === arr.length - 1
              return (
                <div
                  key={pt.day}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={cn(
                    "flex-1 flex flex-col items-center py-0.5 rounded cursor-pointer transition-colors",
                    isLatest
                      ? "bg-zinc-900 border border-cyan-500/30 text-cyan-300 font-bold"
                      : hoveredIndex === idx
                      ? "bg-zinc-800 text-zinc-200"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                  title={`Ngày chiến lược #${pt.day}: ${pt.threat} Threat`}
                >
                  <span>N#{pt.day}</span>
                  <span className="text-[9px] font-bold">{pt.threat}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Lối tắt nhảy tới Sector trong War Room nếu có callback */}
      {onNavigateToSector && (
        <button
          type="button"
          onClick={onNavigateToSector}
          className="w-full flex items-center justify-center gap-1 py-1 rounded bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/40 text-[9px] font-bold cursor-pointer transition-colors"
        >
          <Crosshair className="size-3" />
          <span>Xem Điểm Nóng Trong War Room &rarr;</span>
        </button>
      )}
    </div>
  )
}
