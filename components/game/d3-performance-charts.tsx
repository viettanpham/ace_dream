"use client"

import React, { useState } from "react"
import * as d3 from "d3"
import { CombatEfficiencyAxis, CombatEfficiencyReport, TurnDamageData } from "@/lib/game/combat-efficiency"
import { cn } from "@/lib/utils"

/* ==========================================================================
   1. D3 RADAR / SPIDER CHART — BIỂU ĐỒ MẠNG NHỆN HIỆU SUẤT TÁC CHIẾN 5 TRỤC
   ========================================================================== */

interface D3RadarChartProps {
  axes: CombatEfficiencyAxis[]
  gradeColor?: string
  width?: number
  height?: number
  className?: string
}

export function D3RadarChart({
  axes,
  gradeColor = "#06b6d4",
  width = 380,
  height = 340,
  className,
}: D3RadarChartProps) {
  const [hoveredAxisIndex, setHoveredAxisIndex] = useState<number | null>(null)

  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) / 2 - 45
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0]
  const totalAxes = axes.length
  const angleSlice = (Math.PI * 2) / totalAxes

  // D3 scale ánh xạ từ điểm [0, 100] sang bán kính [0, radius]
  const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius])

  // Tính tọa độ (x, y) theo góc và bán kính
  const getCoordinates = (index: number, value: number) => {
    const angle = angleSlice * index - Math.PI / 2 // Bắt đầu từ đỉnh 12 giờ
    const r = rScale(value)
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    }
  }

  // Tạo chuỗi đường đa giác (polygon path) bằng d3.line
  const lineGenerator = d3
    .line<{ x: number; y: number }>()
    .x((d) => d.x)
    .y((d) => d.y)
    .curve(d3.curveLinearClosed)

  // Điểm dữ liệu của người chơi
  const dataPoints = axes.map((axis, i) => getCoordinates(i, axis.score))
  const dataPathString = lineGenerator(dataPoints) || ""

  // Các vòng tròn/đa giác tham chiếu (Web grid levels)
  const gridPolygons = levels.map((lvl) => {
    const pts = axes.map((_, i) => getCoordinates(i, lvl * 100))
    return {
      level: lvl,
      path: lineGenerator(pts) || "",
    }
  })

  return (
    <div className={cn("relative flex flex-col items-center select-none", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[400px] h-auto overflow-visible"
        style={{ filter: "drop-shadow(0 0 12px rgba(6, 182, 212, 0.15))" }}
      >
        <defs>
          {/* Gradient tô màu diện tích biểu đồ */}
          <linearGradient id="radarAreaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradeColor} stopOpacity={0.45} />
            <stop offset="100%" stopColor="#0891b2" stopOpacity={0.15} />
          </linearGradient>

          {/* Glow filter cho đường viền */}
          <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Mạng lưới đa giác tham chiếu 20%, 40%, 60%, 80%, 100% */}
        {gridPolygons.map((grid) => (
          <path
            key={`grid-${grid.level}`}
            d={grid.path}
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeDasharray={grid.level === 1 ? "none" : "2,3"}
            strokeWidth={grid.level === 1 ? 1.5 : 1}
          />
        ))}

        {/* Nhãn chỉ số % ở góc trên */}
        {levels.map((lvl) => {
          const pt = getCoordinates(0, lvl * 100)
          return (
            <text
              key={`lbl-${lvl}`}
              x={pt.x + 4}
              y={pt.y - 2}
              fill="rgba(148, 163, 184, 0.5)"
              fontSize="9"
              fontFamily="monospace"
            >
              {Math.round(lvl * 100)}%
            </text>
          )
        })}

        {/* 2. Các trục nan hoa từ tâm tỏa ra 5 góc */}
        {axes.map((_, i) => {
          const edgePt = getCoordinates(i, 100)
          return (
            <line
              key={`spoke-${i}`}
              x1={cx}
              y1={cy}
              x2={edgePt.x}
              y2={edgePt.y}
              stroke="rgba(255, 255, 255, 0.18)"
              strokeWidth="1"
            />
          )
        })}

        {/* 3. Vùng đa giác biểu diễn dữ liệu của người chơi (Data Polygon) */}
        <path
          d={dataPathString}
          fill="url(#radarAreaGradient)"
          stroke={gradeColor}
          strokeWidth="2.5"
          filter="url(#radarGlow)"
          className="transition-all duration-500 ease-out"
        />

        {/* 4. Các điểm nút dữ liệu (Data Vertex Points) */}
        {axes.map((axis, i) => {
          const pt = dataPoints[i]
          const isHovered = hoveredAxisIndex === i

          return (
            <g
              key={`point-${axis.key}`}
              className="cursor-pointer transition-transform duration-200"
              onMouseEnter={() => setHoveredAxisIndex(i)}
              onMouseLeave={() => setHoveredAxisIndex(null)}
            >
              {/* Vòng hào quang khi hover */}
              {isHovered && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={9}
                  fill="none"
                  stroke={gradeColor}
                  strokeWidth="1.5"
                  className="animate-ping opacity-75"
                />
              )}

              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 6 : 4.5}
                fill="#ffffff"
                stroke={gradeColor}
                strokeWidth="2.5"
                className="transition-all duration-150"
              />
            </g>
          )
        })}

        {/* 5. Nhãn tên trục và điểm số */}
        {axes.map((axis, i) => {
          const edgePt = getCoordinates(i, 118) // Đặt nhãn ngoài vòng 100%
          const isHovered = hoveredAxisIndex === i

          // Căn chỉnh chữ theo vị trí
          let textAnchor: "middle" | "start" | "end" = "middle"
          if (edgePt.x > cx + 15) textAnchor = "start"
          else if (edgePt.x < cx - 15) textAnchor = "end"

          return (
            <g
              key={`label-${axis.key}`}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredAxisIndex(i)}
              onMouseLeave={() => setHoveredAxisIndex(null)}
            >
              <text
                x={edgePt.x}
                y={edgePt.y}
                textAnchor={textAnchor}
                fill={isHovered ? "#38bdf8" : "#e2e8f0"}
                fontSize="11"
                fontWeight="700"
                fontFamily="sans-serif"
                className="transition-colors uppercase tracking-wider"
              >
                {axis.label}
              </text>
              <text
                x={edgePt.x}
                y={edgePt.y + 12}
                textAnchor={textAnchor}
                fill={gradeColor}
                fontSize="10"
                fontWeight="800"
                fontFamily="monospace"
              >
                {axis.score}%
              </text>
            </g>
          )
        })}
      </svg>

      {/* Tooltip hiển thị chi tiết trục đang hover */}
      {hoveredAxisIndex !== null && (
        <div className="mt-2 rounded border border-cyan-500/40 bg-black/90 px-3 py-1.5 text-center font-mono text-xs text-cyan-200 shadow-lg animate-in fade-in">
          <span className="font-bold text-white uppercase mr-1.5">
            {axes[hoveredAxisIndex].label} ({axes[hoveredAxisIndex].score}%):
          </span>
          <span className="text-cyan-300">{axes[hoveredAxisIndex].detail}</span>
        </div>
      )}
    </div>
  )
}

/* ==========================================================================
   2. D3 EFFICIENCY RADIAL GAUGE — ĐỒNG HỒ ĐO ĐIỂM HIỆU SUẤT TÁC CHIẾN
   ========================================================================== */

interface D3EfficiencyGaugeProps {
  score: number // 0 - 100
  grade: string // S+, S, A, B, C
  gradeColor?: string
  width?: number
  height?: number
  className?: string
}

export function D3EfficiencyGauge({
  score,
  grade,
  gradeColor = "#06b6d4",
  width = 240,
  height = 190,
  className,
}: D3EfficiencyGaugeProps) {
  const cx = width / 2
  const cy = height - 30
  const outerRadius = 88
  const innerRadius = 70

  // Góc bắt đầu và kết thúc hình bán nguyệt: từ -130 độ đến +130 độ
  const startAngle = -Math.PI * 0.72
  const endAngle = Math.PI * 0.72

  // Scale góc bằng D3
  const angleScale = d3.scaleLinear().domain([0, 100]).range([startAngle, endAngle])
  const currentAngle = angleScale(Math.min(100, Math.max(0, score)))

  // Trình tạo cung tròn bằng D3 arc generator
  const backgroundArcGenerator = d3
    .arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .startAngle(startAngle)
    .endAngle(endAngle)
    .cornerRadius(4)

  const valueArcGenerator = d3
    .arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .startAngle(startAngle)
    .endAngle(currentAngle)
    .cornerRadius(4)

  const backgroundPath = backgroundArcGenerator({} as any) || ""
  const valuePath = valueArcGenerator({} as any) || ""

  // Tọa độ đầu kim/chấm sáng ở mút cung
  const needleX = cx + (outerRadius - 9) * Math.sin(currentAngle)
  const needleY = cy - (outerRadius - 9) * Math.cos(currentAngle)

  // Các mốc ngưỡng đánh giá C, B, A, S, S+
  const milestones = [
    { label: "C", score: 50 },
    { label: "B", score: 65 },
    { label: "A", score: 80 },
    { label: "S", score: 92 },
  ]

  return (
    <div className={cn("relative flex flex-col items-center select-none", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[260px] h-auto overflow-visible"
      >
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="60%" stopColor={gradeColor} />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          <filter id="gaugeGlow">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g transform={`translate(${cx}, ${cy})`}>
          {/* Cung đường nền tối */}
          <path d={backgroundPath} fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />

          {/* Cung đường điểm sáng theo tỷ lệ D3 */}
          <path
            d={valuePath}
            fill="url(#gaugeGradient)"
            filter="url(#gaugeGlow)"
            className="transition-all duration-700 ease-out"
          />

          {/* Các mốc điểm C, B, A, S */}
          {milestones.map((ms) => {
            const a = angleScale(ms.score)
            const tickR1 = innerRadius - 2
            const tickR2 = outerRadius + 2
            const x1 = tickR1 * Math.sin(a)
            const y1 = -tickR1 * Math.cos(a)
            const x2 = tickR2 * Math.sin(a)
            const y2 = -tickR2 * Math.cos(a)

            return (
              <g key={`ms-${ms.label}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255, 255, 255, 0.35)"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                />
              </g>
            )
          })}
        </g>

        {/* Chấm tròn phát sáng tại đầu cung */}
        <circle
          cx={needleX}
          cy={needleY}
          r={5.5}
          fill="#ffffff"
          stroke={gradeColor}
          strokeWidth="2.5"
          filter="url(#gaugeGlow)"
        />

        {/* Hiển thị điểm số ở giữa cung */}
        <text
          x={cx}
          y={cy - 22}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="36"
          fontWeight="900"
          fontFamily="monospace"
          className="tracking-tight"
        >
          {score}
        </text>

        <text
          x={cx}
          y={cy + 2}
          textAnchor="middle"
          fill={gradeColor}
          fontSize="11"
          fontWeight="700"
          fontFamily="sans-serif"
          className="uppercase tracking-widest"
        >
          ĐIỂM HIỆU SUẤT
        </text>

        {/* Nhãn Xếp Hạng Grade lớn */}
        <g transform={`translate(${cx}, ${cy + 20})`}>
          <text
            x={0}
            y={0}
            textAnchor="middle"
            fill={gradeColor}
            fontSize="14"
            fontWeight="900"
            fontFamily="monospace"
            className="tracking-widest"
          >
            HẠNG: {grade}
          </text>
        </g>
      </svg>
    </div>
  )
}

/* ==========================================================================
   3. D3 TURN-BY-TURN DAMAGE TIMELINE — BIỂU ĐỒ CỘT SÁT THƯƠNG TỪNG LƯỢT
   ========================================================================== */

interface D3TurnDamageTimelineProps {
  turnData: TurnDamageData[]
  width?: number
  height?: number
  className?: string
}

export function D3TurnDamageTimeline({
  turnData,
  width = 540,
  height = 200,
  className,
}: D3TurnDamageTimelineProps) {
  const [hoveredTurn, setHoveredTurn] = useState<TurnDamageData | null>(null)

  const margin = { top: 20, right: 25, bottom: 35, left: 45 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const turns = turnData.map((d) => d.turn)
  const maxDamage = Math.max(
    50,
    d3.max(turnData, (d) => Math.max(d.damageDealt, d.damageTaken)) || 100,
  )

  // D3 Scales
  const xScale = d3
    .scaleBand<number>()
    .domain(turns)
    .range([0, innerWidth])
    .padding(0.3)

  const yScale = d3
    .scaleLinear()
    .domain([0, maxDamage * 1.15])
    .nice()
    .range([innerHeight, 0])

  const bandwidth = xScale.bandwidth()
  const barWidth = Math.max(8, (bandwidth - 4) / 2)

  // Đường lưới ngang Y-Axis ticks
  const yTicks = yScale.ticks(4)

  return (
    <div className={cn("relative flex flex-col items-center select-none w-full", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible max-w-[620px]"
      >
        <defs>
          {/* Gradient cột sát thương người chơi gây ra (Cyan) */}
          <linearGradient id="playerDamageBar" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* Gradient cột sát thương nhận vào (Rose/Red) */}
          <linearGradient id="enemyDamageBar" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>

        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* 1. Các đường lưới ngang (Horizontal Grid Lines) */}
          {yTicks.map((tick) => (
            <g key={`ytick-${tick}`}>
              <line
                x1={0}
                y1={yScale(tick)}
                x2={innerWidth}
                y2={yScale(tick)}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray="2,3"
              />
              <text
                x={-8}
                y={yScale(tick) + 3}
                textAnchor="end"
                fill="rgba(148, 163, 184, 0.6)"
                fontSize="9"
                fontFamily="monospace"
              >
                {tick}
              </text>
            </g>
          ))}

          {/* Trục hoành X baseline */}
          <line
            x1={0}
            y1={innerHeight}
            x2={innerWidth}
            y2={innerHeight}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1"
          />

          {/* 2. Cột sát thương từng lượt đấu */}
          {turnData.map((d) => {
            const groupX = xScale(d.turn) || 0
            const playerBarHeight = Math.max(0, innerHeight - yScale(d.damageDealt))
            const enemyBarHeight = Math.max(0, innerHeight - yScale(d.damageTaken))
            const isHovered = hoveredTurn?.turn === d.turn

            return (
              <g
                key={`turn-group-${d.turn}`}
                transform={`translate(${groupX}, 0)`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredTurn(d)}
                onMouseLeave={() => setHoveredTurn(null)}
              >
                {/* Vùng highlight khi hover */}
                {isHovered && (
                  <rect
                    x={-2}
                    y={0}
                    width={bandwidth + 4}
                    height={innerHeight}
                    fill="rgba(6, 182, 212, 0.08)"
                    rx={2}
                  />
                )}

                {/* Cột 1: Sát thương Gây Ra (Player Dealt) */}
                <rect
                  x={0}
                  y={yScale(d.damageDealt)}
                  width={barWidth}
                  height={playerBarHeight}
                  fill="url(#playerDamageBar)"
                  rx={2}
                  className="transition-all duration-300"
                />

                {/* Cột 2: Sát thương Nhận Vào (Damage Taken) */}
                <rect
                  x={barWidth + 2}
                  y={yScale(d.damageTaken)}
                  width={barWidth}
                  height={enemyBarHeight}
                  fill="url(#enemyDamageBar)"
                  rx={2}
                  className="transition-all duration-300"
                />

                {/* Chỉ số sát thương gây ra nhỏ trên đỉnh cột */}
                {d.damageDealt > 0 && (
                  <text
                    x={barWidth / 2}
                    y={yScale(d.damageDealt) - 4}
                    textAnchor="middle"
                    fill="#38bdf8"
                    fontSize="9"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    {d.damageDealt}
                  </text>
                )}

                {/* Nhãn X-Axis: "V1", "V2",... */}
                <text
                  x={bandwidth / 2}
                  y={innerHeight + 16}
                  textAnchor="middle"
                  fill={isHovered ? "#38bdf8" : "rgba(203, 213, 225, 0.7)"}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight={isHovered ? "700" : "400"}
                >
                  T{d.turn}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {/* Chú giải (Legend) */}
      <div className="mt-2 flex items-center justify-center gap-6 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded-sm bg-gradient-to-b from-cyan-400 to-sky-600" />
          <span className="text-cyan-300">Sát Thương Gây Ra</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded-sm bg-gradient-to-b from-rose-400 to-rose-600" />
          <span className="text-rose-300">Sát Thương Chịu Vào</span>
        </div>
      </div>

      {/* Tooltip hiển thị khi hover vào lượt */}
      {hoveredTurn && (
        <div className="mt-2.5 w-full max-w-lg rounded border border-cyan-500/40 bg-black/90 p-2 text-left font-mono text-xs text-slate-200 shadow-xl animate-in fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1">
            <span className="font-bold text-cyan-400 uppercase">LƯỢT {hoveredTurn.turn} CHIẾN ĐẤU</span>
            <div className="flex gap-3 text-[11px]">
              <span className="text-cyan-300">Gây ra: +{hoveredTurn.damageDealt}</span>
              <span className="text-rose-300">Chịu: -{hoveredTurn.damageTaken}</span>
            </div>
          </div>
          {hoveredTurn.playerActions.length > 0 && (
            <p className="text-[11px] text-slate-300 line-clamp-2">
              <span className="text-slate-500">Hành động:</span> {hoveredTurn.playerActions[0]}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
