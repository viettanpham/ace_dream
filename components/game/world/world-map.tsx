"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Compass,
  Crosshair,
  Eye,
  FileText,
  Flame,
  Globe2,
  Hammer,
  HelpCircle,
  Layers,
  Lock,
  Maximize2,
  Minimize2,
  Minus,
  Navigation,
  Orbit,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  RotateCcw,
  Route,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  Truck,
  Users,
  Wheat,
  X,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { playClickSound, playLevelUpSound, playShieldSound } from "@/lib/game/audio"
import {
  setSectorStrategicOrder,
  upgradeSectorFortification,
} from "@/lib/game/world/forces-ledger"
import { getActiveEvents } from "@/lib/game/world/event-engine"
import { saveWorldState } from "@/lib/game/world/storage"
import type {
  WorldState,
  WorldSector,
  WorldRoute,
  SectorStage,
  SectorSovereignty,
  RouteState,
  StrategicOrder,
  TroopDeployment,
} from "@/lib/game/world/types"

interface WorldMapProps {
  worldState: WorldState
  selectedSectorId?: string
  onSelectSector?: (sectorId: string) => void
  onNavigateToSectorOperations?: (sectorId: string) => void
  onOpenQuickDispatch?: (sectorId: string) => void
  onDeployCombat?: (sectorId: string) => void
  onUpdateWorldState?: (updatedState: WorldState) => void
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  className?: string
}

const SOVEREIGNTY_CONFIG: Record<
  SectorSovereignty,
  { label: string; color: string; bg: string; border: string; glow: string }
> = {
  vss: {
    label: "Liên Minh VSS",
    color: "#06b6d4",
    bg: "rgba(6, 182, 212, 0.15)",
    border: "#06b6d4",
    glow: "0 0 16px rgba(6, 182, 212, 0.5)",
  },
  void: {
    label: "Đế Chế The Void",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.15)",
    border: "#ef4444",
    glow: "0 0 16px rgba(239, 68, 68, 0.5)",
  },
  contested: {
    label: "Tranh Chấp",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.15)",
    border: "#f59e0b",
    glow: "0 0 16px rgba(245, 158, 11, 0.5)",
  },
  neutral: {
    label: "Trung Lập",
    color: "#94a3b8",
    bg: "rgba(148, 163, 184, 0.15)",
    border: "#94a3b8",
    glow: "0 0 16px rgba(148, 163, 184, 0.3)",
  },
}

const STAGE_CONFIG: Record<
  SectorStage,
  { label: string; badgeBg: string; text: string; badgeBorder: string }
> = {
  normal: {
    label: "Bình Thường",
    badgeBg: "bg-emerald-950/60",
    text: "text-emerald-300",
    badgeBorder: "border-emerald-500/40",
  },
  threatened: {
    label: "Bị Đe Dọa",
    badgeBg: "bg-amber-950/60",
    text: "text-amber-300",
    badgeBorder: "border-amber-500/50",
  },
  under_siege: {
    label: "Bị Vây Hãm",
    badgeBg: "bg-red-950/70",
    text: "text-red-300",
    badgeBorder: "border-red-500/60",
  },
  lost: {
    label: "Thất Thủ",
    badgeBg: "bg-purple-950/80",
    text: "text-purple-300",
    badgeBorder: "border-purple-500/60",
  },
  recovery: {
    label: "Đang Phục Hồi",
    badgeBg: "bg-cyan-950/60",
    text: "text-cyan-300",
    badgeBorder: "border-cyan-500/40",
  },
}

const ROUTE_CONFIG: Record<
  RouteState,
  { label: string; stroke: string; strokeDasharray?: string; opacity: number }
> = {
  open: {
    label: "Thông Suốt (Open)",
    stroke: "#06b6d4",
    opacity: 0.85,
  },
  hazardous: {
    label: "Nguy Hiểm (Hazardous)",
    stroke: "#f59e0b",
    strokeDasharray: "6 4",
    opacity: 0.9,
  },
  blocked: {
    label: "Phong Tỏa (Blocked)",
    stroke: "#ef4444",
    strokeDasharray: "4 4",
    opacity: 0.8,
  },
  offline: {
    label: "Ngoại Tuyến (Offline)",
    stroke: "#52525b",
    strokeDasharray: "2 4",
    opacity: 0.45,
  },
}

export function WorldMap({
  worldState,
  selectedSectorId: externalSelectedSectorId,
  onSelectSector,
  onNavigateToSectorOperations,
  onOpenQuickDispatch,
  onDeployCombat,
  onUpdateWorldState,
  isFullscreen = false,
  onToggleFullscreen,
  className,
}: WorldMapProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string>("sol_command_hq")
  const selectedSectorId = externalSelectedSectorId || internalSelectedId

  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [showLegend, setShowLegend] = useState<boolean>(true)
  const [showDeployments, setShowDeployments] = useState<boolean>(true)
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)

  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Danh sách sectors và routes từ state hiện hữu
  const sectors = useMemo(() => Object.values(worldState.sectors || {}), [worldState.sectors])
  const routes = useMemo(() => worldState.routes || [], [worldState.routes])
  const activeDeployments = useMemo(
    () => (worldState.activeDeployments || []).filter((d) => d.status === "in_transit"),
    [worldState.activeDeployments]
  )

  const selectedSector = useMemo(
    () => (selectedSectorId ? worldState.sectors[selectedSectorId] : null),
    [worldState.sectors, selectedSectorId]
  )

  // Tìm các sự kiện liên quan đến sector đang chọn
  const sectorEvents = useMemo(() => {
    if (!selectedSectorId) return []
    return getActiveEvents(worldState).filter(
      (e) => e.sectorId === selectedSectorId && (e.status === "INIT" || e.status === "PROCESSING")
    )
  }, [worldState, selectedSectorId])

  // Thống kê chủ quyền toàn thiên hà
  const galaxyMetrics = useMemo(() => {
    if (!sectors.length) return { vssPct: 0, voidPct: 0, contestedPct: 0, avgThreat: 0 }
    let vssCount = 0
    let voidCount = 0
    let contestedCount = 0
    let totalThreat = 0

    for (const s of sectors) {
      if (s.sovereignty === "vss") vssCount++
      else if (s.sovereignty === "void") voidCount++
      else contestedCount++
      totalThreat += s.threatLevel
    }

    const total = sectors.length
    return {
      vssPct: Math.round((vssCount / total) * 100),
      voidPct: Math.round((voidCount / total) * 100),
      contestedPct: Math.round((contestedCount / total) * 100),
      avgThreat: Math.round(totalThreat / total),
    }
  }, [sectors])

  const notify = (message: string, type: "success" | "error" | "info" = "success") => {
    setFeedback({ message, type })
    setTimeout(() => setFeedback(null), 3600)
  }

  const handleSectorClick = (sectorId: string) => {
    playClickSound()
    setInternalSelectedId(sectorId)
    onSelectSector?.(sectorId)
  }

  // Pan & Zoom controls
  const handleZoomIn = () => {
    playClickSound()
    setZoomLevel((prev) => Math.min(2.2, prev + 0.2))
  }

  const handleZoomOut = () => {
    playClickSound()
    setZoomLevel((prev) => Math.max(0.7, prev - 0.2))
  }

  const handleResetView = () => {
    playClickSound()
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }

  const handleCenterSelected = () => {
    if (!selectedSector) return
    playClickSound()
    // Đưa tọa độ sector về trung tâm viewBox (50, 50)
    const targetX = (50 - selectedSector.x) * 6
    const targetY = (50 - selectedSector.y) * 4.5
    setPanOffset({ x: targetX, y: targetY })
    setZoomLevel(1.2)
  }

  // Chuột drag để pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return // Chỉ chuột trái
    setIsDragging(true)
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Thao tác đổi Lệnh Chiến Lược trực tiếp từ Inspector
  const handleChangeOrder = (newOrder: StrategicOrder) => {
    if (!selectedSector) return
    if (selectedSector.isLockedForCombat) {
      notify("Không thể thay đổi lệnh: Sector đang bị khóa trong combat!", "error")
      return
    }
    playClickSound()
    const res = setSectorStrategicOrder(worldState, selectedSector.id, newOrder)
    if (res.success) {
      saveWorldState(worldState)
      onUpdateWorldState?.({ ...worldState })
      notify(`Đã cập nhật lệnh chiến lược cho ${selectedSector.name}: [${newOrder.toUpperCase()}]`, "success")
    } else {
      notify(res.error || "Không thể cập nhật lệnh chiến lược", "error")
    }
  }

  // Thao tác nâng cấp công sự từ Inspector
  const handleUpgradeFort = () => {
    if (!selectedSector) return
    if (selectedSector.isLockedForCombat) {
      notify("Không thể nâng cấp công sự: Sector đang bị khóa giao tranh!", "error")
      return
    }
    playClickSound()
    const res = upgradeSectorFortification(worldState, selectedSector.id)
    if (res.success) {
      playLevelUpSound()
      saveWorldState(worldState)
      onUpdateWorldState?.({ ...worldState })
      notify(`Nâng cấp công sự thành công: ${selectedSector.name} đạt Cấp ${res.newLevel}/5!`, "success")
    } else {
      notify(res.error || "Không đủ vật liệu công nghiệp để nâng cấp", "error")
    }
  }

  return (
    <div
      className={cn(
        "relative flex flex-col w-full h-full bg-zinc-950 font-sans text-zinc-100 select-none overflow-hidden",
        className
      )}
    >
      {/* 1. TOP STRATEGIC HUD BAR */}
      <div className="shrink-0 flex flex-wrap items-center justify-between border-b border-cyan-500/30 bg-zinc-950/90 px-3 py-2 backdrop-blur-md z-20 gap-2">
        {/* Tiêu đề & Thông tin thiên hà */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Orbit className="size-4 text-cyan-400 animate-spin-slow" />
            <span className="font-display text-xs font-black tracking-wider text-cyan-300 uppercase">
              STARFRONT GALAXY NETWORK
            </span>
          </div>
          <span className="text-zinc-600 font-mono">|</span>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="rounded bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 font-bold text-cyan-300">
              NGÀY {worldState.currentDay}
            </span>
            <span className="hidden sm:inline text-zinc-400 text-[11px]">
              {sectors.length} Sectors · {routes.length} Tuyến Hyperlane
            </span>
          </div>
        </div>

        {/* Tỷ lệ kiểm soát & Threat trung bình */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <div className="hidden md:flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded px-2.5 py-1">
            <div className="flex items-center gap-1 text-cyan-300" title="VSS Coalition">
              <span className="size-2 rounded-full bg-cyan-400" />
              <span>VSS: {galaxyMetrics.vssPct}%</span>
            </div>
            <span className="text-zinc-600">·</span>
            <div className="flex items-center gap-1 text-amber-300" title="Contested">
              <span className="size-2 rounded-full bg-amber-400" />
              <span>Tranh Chấp: {galaxyMetrics.contestedPct}%</span>
            </div>
            <span className="text-zinc-600">·</span>
            <div className="flex items-center gap-1 text-red-400" title="The Void">
              <span className="size-2 rounded-full bg-red-400" />
              <span>Void: {galaxyMetrics.voidPct}%</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded bg-amber-950/40 border border-amber-500/40 px-2 py-1 text-amber-300">
            <Flame className="size-3 text-amber-400" />
            <span>Threat TB: {galaxyMetrics.avgThreat}/1000</span>
          </div>

          {/* Nút Fullscreen Toggle */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className={cn(
                "flex items-center gap-1 rounded border px-2 py-1 text-xs font-mono transition-colors cursor-pointer",
                isFullscreen
                  ? "border-cyan-400 bg-cyan-950/60 text-cyan-200"
                  : "border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:text-white hover:border-cyan-500"
              )}
              title={isFullscreen ? "Thoát toàn màn hình (ESC)" : "Xem toàn màn hình (100vw/100vh)"}
            >
              {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? "Thu Nhỏ" : "Toàn Màn Hình"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Thông báo feedback toast */}
      {feedback && (
        <div
          className={cn(
            "absolute top-14 left-1/2 -translate-x-1/2 z-40 rounded px-4 py-1.5 font-mono text-xs shadow-lg border animate-in fade-in duration-200 flex items-center gap-2",
            feedback.type === "success"
              ? "border-cyan-500/60 bg-cyan-950/90 text-cyan-300"
              : feedback.type === "error"
              ? "border-red-500/60 bg-red-950/90 text-red-300"
              : "border-amber-500/60 bg-amber-950/90 text-amber-300"
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-3.5" />
          ) : (
            <AlertTriangle className="size-3.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 2. MAIN MAP VIEWPORT CONTAINER */}
      <div
        ref={mapContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={cn(
          "relative flex-1 w-full h-full overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/40 via-zinc-950 to-black cursor-grab",
          isDragging && "cursor-grabbing"
        )}
      >
        {/* Tactical Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(6, 182, 212, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(6, 182, 212, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Tactical Radar Circles */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
          <div className="size-[650px] rounded-full border border-cyan-500/40" />
          <div className="absolute size-[450px] rounded-full border border-cyan-500/30" />
          <div className="absolute size-[250px] rounded-full border border-cyan-500/20" />
        </div>

        {/* SVG MAP CANVAS */}
        <svg
          viewBox="0 0 1000 650"
          className="w-full h-full transition-transform duration-75"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: "center center",
          }}
        >
          <defs>
            {/* Filter Glow Cyan */}
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Filter Glow Red */}
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Filter Glow Amber */}
            <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* A. VẼ CÁC TUYẾN ĐƯỜNG SIÊU KHÔNG GIAN (ROUTES) */}
          <g id="routes-layer">
            {routes.map((route) => {
              const fromSector = worldState.sectors[route.fromSectorId]
              const toSector = worldState.sectors[route.toSectorId]
              if (!fromSector || !toSector) return null

              const x1 = (fromSector.x / 100) * 1000
              const y1 = (fromSector.y / 100) * 650
              const x2 = (toSector.x / 100) * 1000
              const y2 = (toSector.y / 100) * 650

              const routeCfg = ROUTE_CONFIG[route.state] || ROUTE_CONFIG.open
              const isSelectedAdjacent =
                selectedSectorId === route.fromSectorId || selectedSectorId === route.toSectorId

              return (
                <g key={route.id} className="transition-opacity">
                  {/* Đường phụ tạo hiệu ứng glow khi được chọn */}
                  {isSelectedAdjacent && (
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={routeCfg.stroke}
                      strokeWidth="5"
                      strokeOpacity="0.25"
                    />
                  )}

                  {/* Tuyến đường chính */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={routeCfg.stroke}
                    strokeWidth={isSelectedAdjacent ? "2.5" : "1.8"}
                    strokeDasharray={routeCfg.strokeDasharray}
                    strokeOpacity={isSelectedAdjacent ? 1 : routeCfg.opacity}
                  />

                  {/* Huy hiệu nhỏ hiển thị thông tin tuyến ở điểm giữa */}
                  {route.state === "hazardous" && (
                    <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
                      <circle r="6" fill="#78350f" stroke="#f59e0b" strokeWidth="1" />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#f59e0b"
                        fontSize="7"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        !
                      </text>
                    </g>
                  )}

                  {route.state === "blocked" && (
                    <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
                      <circle r="7" fill="#450a0a" stroke="#ef4444" strokeWidth="1" />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ef4444"
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        ×
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </g>

          {/* B. VẼ CÁC ĐOÀN QUÂN ĐANG HÀNH QUÂN (IN-TRANSIT FLEETS) */}
          {showDeployments && (
            <g id="deployments-layer">
              {activeDeployments.map((dep) => {
                const fromSector = worldState.sectors[dep.fromSectorId]
                const toSector = worldState.sectors[dep.toSectorId]
                if (!fromSector || !toSector) return null

                const x1 = (fromSector.x / 100) * 1000
                const y1 = (fromSector.y / 100) * 650
                const x2 = (toSector.x / 100) * 1000
                const y2 = (toSector.y / 100) * 650

                // Tính toán tỷ lệ di chuyển theo số ngày còn lại
                const progressRatio = Math.max(
                  0.15,
                  Math.min(
                    0.85,
                    dep.totalDistance > 0 ? 1 - dep.remainingDays / dep.totalDistance : 0.5
                  )
                )

                const curX = x1 + (x2 - x1) * progressRatio
                const curY = y1 + (y2 - y1) * progressRatio

                return (
                  <g key={dep.deploymentId} transform={`translate(${curX}, ${curY})`}>
                    <circle r="10" fill="rgba(6, 182, 212, 0.2)" stroke="#06b6d4" strokeWidth="1.5" />
                    <circle r="4" fill="#06b6d4" />
                    {/* Tag hiển thị số quân */}
                    <rect
                      x="12"
                      y="-8"
                      width="50"
                      height="16"
                      rx="3"
                      fill="#020617"
                      stroke="#06b6d4"
                      strokeWidth="1"
                    />
                    <text
                      x="37"
                      y="1"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#06b6d4"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {dep.troopCount} Q
                    </text>
                  </g>
                )
              })}
            </g>
          )}

          {/* C. VẼ CÁC ĐỈNH SECTOR (SECTOR NODES) */}
          <g id="sectors-layer">
            {sectors.map((sector) => {
              const cx = (sector.x / 100) * 1000
              const cy = (sector.y / 100) * 650
              const isSelected = sector.id === selectedSectorId
              const sovCfg = SOVEREIGNTY_CONFIG[sector.sovereignty] || SOVEREIGNTY_CONFIG.neutral
              const stageCfg = STAGE_CONFIG[sector.stage] || STAGE_CONFIG.normal
              const isLocked = Boolean(sector.isLockedForCombat)

              return (
                <g
                  key={sector.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSectorClick(sector.id)
                  }}
                  className="cursor-pointer group"
                >
                  {/* Vòng định vị khi được chọn (Tactical Targeting Reticle) */}
                  {isSelected && (
                    <g transform={`translate(${cx}, ${cy})`}>
                      <circle
                        r="34"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="1.5"
                        strokeDasharray="8 6"
                        className="animate-spin-slow"
                      />
                      <circle r="42" fill="none" stroke="#06b6d4" strokeWidth="0.8" opacity="0.4" />
                      {/* 4 dấu ngắm góc */}
                      <line x1="-38" y1="0" x2="-32" y2="0" stroke="#06b6d4" strokeWidth="2" />
                      <line x1="32" y1="0" x2="38" y2="0" stroke="#06b6d4" strokeWidth="2" />
                      <line x1="0" y1="-38" x2="0" y2="-32" stroke="#06b6d4" strokeWidth="2" />
                      <line x1="0" y1="32" x2="0" y2="38" stroke="#06b6d4" strokeWidth="2" />
                    </g>
                  )}

                  {/* Vòng hiển thị trạng thái Stage (Under Siege / Threatened / Lost) */}
                  {sector.stage === "under_siege" && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="28"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className="animate-pulse"
                    />
                  )}

                  {sector.stage === "threatened" && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="26"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      opacity="0.8"
                    />
                  )}

                  {/* Vòng nền Sector */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? "22" : "19"}
                    fill={sovCfg.bg}
                    stroke={sovCfg.border}
                    strokeWidth={isSelected ? "2.5" : "1.8"}
                    className="transition-all duration-200 group-hover:scale-110"
                    style={{ filter: isSelected ? `drop-shadow(${sovCfg.glow})` : undefined }}
                  />

                  {/* Biểu tượng trung tâm hoặc Huy hiệu Phe Phái */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r="8"
                    fill={sovCfg.color}
                    opacity="0.9"
                  />

                  {/* Huy hiệu khóa Combat nếu sector đang khóa giao tranh */}
                  {isLocked && (
                    <g transform={`translate(${cx + 10}, ${cy - 14})`}>
                      <rect width="18" height="14" rx="2" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" />
                      <text
                        x="9"
                        y="8"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#fee2e2"
                        fontSize="8"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        🔒
                      </text>
                    </g>
                  )}

                  {/* Nhãn tên Sector */}
                  <g transform={`translate(${cx}, ${cy + (isSelected ? 34 : 30)})`}>
                    <rect
                      x="-65"
                      y="-10"
                      width="130"
                      height="20"
                      rx="3"
                      fill="#020617"
                      fillOpacity="0.85"
                      stroke={isSelected ? "#06b6d4" : "rgba(255,255,255,0.15)"}
                      strokeWidth={isSelected ? "1.5" : "0.8"}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={isSelected ? "#38bdf8" : "#f1f5f9"}
                      fontSize="9.5"
                      fontWeight={isSelected ? "bold" : "600"}
                      fontFamily="sans-serif"
                    >
                      {sector.name}
                    </text>
                  </g>

                  {/* Thanh Gauge Threat nhỏ dưới tên */}
                  <g transform={`translate(${cx - 40}, ${cy + (isSelected ? 46 : 42)})`}>
                    <rect width="80" height="3" rx="1" fill="#18181b" />
                    <rect
                      width={Math.min(80, (sector.threatLevel / 1000) * 80)}
                      height="3"
                      rx="1"
                      fill={
                        sector.threatLevel >= 700
                          ? "#ef4444"
                          : sector.threatLevel >= 300
                          ? "#f59e0b"
                          : "#10b981"
                      }
                    />
                  </g>
                </g>
              )
            })}
          </g>
        </svg>

        {/* 3. BỘ ĐIỀU KHIỂN VIEWPORT GÓC DƯỚI BÊN TRÁI (MAP CONTROLS) */}
        <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1.5 bg-zinc-950/90 border border-zinc-800 p-1.5 rounded backdrop-blur-md shadow-xl">
          <button
            onClick={handleZoomIn}
            className="flex size-7 items-center justify-center rounded border border-zinc-700 hover:border-cyan-400 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Phóng to bản đồ (+)"
          >
            <Plus className="size-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="flex size-7 items-center justify-center rounded border border-zinc-700 hover:border-cyan-400 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Thu nhỏ bản đồ (-)"
          >
            <Minus className="size-4" />
          </button>
          <button
            onClick={handleResetView}
            className="flex size-7 items-center justify-center rounded border border-zinc-700 hover:border-cyan-400 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Đặt lại góc nhìn chuẩn (100%)"
          >
            <RotateCcw className="size-3.5" />
          </button>
          <button
            onClick={handleCenterSelected}
            className="flex size-7 items-center justify-center rounded border border-zinc-700 hover:border-cyan-400 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Căn giữa Sector đang chọn"
          >
            <Crosshair className="size-3.5" />
          </button>
        </div>

        {/* 4. CHÚ GIẢI BẢN ĐỒ (MAP LEGEND) */}
        <div className="absolute top-3 left-3 z-20 max-w-xs font-mono text-[10px]">
          <div className="rounded border border-zinc-800/80 bg-zinc-950/85 p-2 backdrop-blur-md space-y-1.5 shadow-lg">
            <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800 pb-1">
              <span className="font-bold text-cyan-400">CHÚ GIẢI BẢN ĐỒ</span>
              <button
                onClick={() => setShowLegend(!showLegend)}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                {showLegend ? "Thu gọn" : "Mở rộng"}
              </button>
            </div>

            {showLegend && (
              <div className="space-y-1 pt-0.5">
                {/* Chủ quyền */}
                <div className="grid grid-cols-2 gap-1 text-[9px]">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-cyan-400" />
                    <span>VSS Coalition</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-red-400" />
                    <span>The Void</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-400" />
                    <span>Tranh Chấp</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-slate-400" />
                    <span>Trung Lập</span>
                  </div>
                </div>

                {/* Tuyến đường */}
                <div className="border-t border-zinc-800/60 pt-1 space-y-0.5 text-[9px] text-zinc-400">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400">─── Thông suốt</span>
                    <span className="text-amber-400">- - - Nguy hiểm</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-red-400">··· Phong tỏa</span>
                    <span className="text-zinc-500">··· Ngoại tuyến</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5. PANEL CHI TIẾT SECTOR (SECTOR INSPECTOR DRAWER) */}
        {selectedSector && (
          <div className="absolute top-3 right-3 bottom-3 w-80 sm:w-96 z-30 flex flex-col rounded-sm border border-cyan-500/50 bg-zinc-950/95 backdrop-blur-md p-4 shadow-2xl font-mono text-xs overflow-y-auto space-y-3.5">
            {/* Header Inspector */}
            <div className="border-b border-zinc-800 pb-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-black uppercase text-cyan-300">
                      {selectedSector.name}
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.2 text-[9px] font-bold uppercase border",
                        STAGE_CONFIG[selectedSector.stage]?.badgeBg,
                        STAGE_CONFIG[selectedSector.stage]?.text,
                        STAGE_CONFIG[selectedSector.stage]?.badgeBorder
                      )}
                    >
                      {STAGE_CONFIG[selectedSector.stage]?.label}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">{selectedSector.subtitle}</div>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-zinc-400/90 leading-relaxed font-sans">
                {selectedSector.desc}
              </p>
            </div>

            {/* Cảnh báo khóa giao tranh nếu có */}
            {selectedSector.isLockedForCombat && (
              <div className="rounded border border-red-500/60 bg-red-950/40 p-2 text-[11px] text-red-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Lock className="size-3.5 text-red-400" />
                  <span>ĐANG KHÓA GIAO TRANH (COMBAT LOCKED)</span>
                </div>
                <p className="text-[10px] text-red-300/80 leading-normal">
                  Sector này đang tham chiến với buồng lái. Lực lượng đồn trú bị đóng băng để bảo toàn dữ liệu. Không thể xuất quân rời khỏi.
                </p>
              </div>
            )}

            {/* Lưới chỉ số vĩ mô của Sector */}
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-900/50 p-2.5 rounded border border-zinc-800">
              <div>
                <span className="text-zinc-400 text-[10px]">Chủ quyền:</span>
                <div className="font-bold text-zinc-100 uppercase">
                  {SOVEREIGNTY_CONFIG[selectedSector.sovereignty]?.label}
                </div>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px]">Công sự phòng thủ:</span>
                <div className="font-bold text-amber-400">
                  Cấp {selectedSector.fortificationLevel ?? 1}/5
                </div>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px]">Mức Đe Dọa (Threat):</span>
                <div className="font-bold text-amber-300">
                  {selectedSector.threatLevel}/1000
                </div>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px]">Độ Ổn Định (Stability):</span>
                <div className="font-bold text-emerald-400">
                  {selectedSector.stability}/100
                </div>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px]">Lực lượng Đồn Trú:</span>
                <div className="font-bold text-cyan-300">
                  {selectedSector.garrisonPower} quân
                </div>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px]">Dân số khu vực:</span>
                <div className="font-bold text-zinc-200">
                  {selectedSector.population.toLocaleString()} dân
                </div>
              </div>
            </div>

            {/* Kho tài nguyên địa phương */}
            <div className="bg-zinc-900/30 p-2 rounded border border-zinc-800/80 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Kho Dự Trữ Tại Chỗ</span>
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                <div className="text-emerald-300">
                  🌾 Lương thực: <strong>{selectedSector.resources.food}</strong>
                </div>
                <div className="text-cyan-300">
                  ⚡ Năng lượng: <strong>{selectedSector.resources.energy}</strong>
                </div>
                <div className="text-amber-300">
                  ⚙️ Vật liệu: <strong>{selectedSector.resources.industrialMaterials}</strong>
                </div>
              </div>
            </div>

            {/* Đổi Lệnh Chiến Lược */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-300 uppercase">
                Lệnh Chiến Lược Đồn Trú
              </label>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                {(["defend", "reinforce", "attack", "recover", "normal"] as StrategicOrder[]).map(
                  (order) => {
                    const isCurrent = (selectedSector.strategicOrder || "normal") === order
                    return (
                      <button
                        key={order}
                        onClick={() => handleChangeOrder(order)}
                        disabled={selectedSector.isLockedForCombat}
                        className={cn(
                          "rounded py-1 px-1.5 border text-center uppercase font-bold transition-colors cursor-pointer",
                          isCurrent
                            ? "border-cyan-400 bg-cyan-950/60 text-cyan-300"
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700",
                          selectedSector.isLockedForCombat && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {order}
                      </button>
                    )
                  }
                )}
              </div>
            </div>

            {/* Các sự kiện đang active tại sector này */}
            {sectorEvents.length > 0 && (
              <div className="space-y-1.5 border-t border-zinc-800 pt-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
                  <AlertOctagon className="size-3 text-amber-400" />
                  Sự Kiện Đang Diễn Ra ({sectorEvents.length})
                </span>
                <div className="space-y-1">
                  {sectorEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="rounded border border-amber-500/40 bg-amber-950/20 p-2 text-[10px] space-y-0.5"
                    >
                      <div className="font-bold text-amber-300">{evt.title}</div>
                      <div className="text-zinc-400 text-[9px]">
                        Trạng thái: [{evt.status}] · Hạn chót: Tick {evt.decisionDeadlineTick}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CÁC THAO TÁC LIÊN KẾT ĐẾN OPERATIONS CENTER */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              {/* Nút 1: Chuyển đến Sector Operations trong Operations Center */}
              {onNavigateToSectorOperations && (
                <button
                  onClick={() => {
                    playClickSound()
                    onNavigateToSectorOperations(selectedSector.id)
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/50 hover:border-cyan-400 text-cyan-200 py-2 px-3 font-display text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                >
                  <Eye className="size-3.5" />
                  <span>Chi Tiết Tại Sector Operations</span>
                  <ArrowRight className="size-3.5" />
                </button>
              )}

              {/* Nút 2: Mở Dock Điều Quân Nhanh */}
              {onOpenQuickDispatch && (
                <button
                  onClick={() => {
                    if (selectedSector.isLockedForCombat) {
                      notify("Không thể điều quân rời khỏi sector đang bị khóa combat!", "error")
                      return
                    }
                    playClickSound()
                    onOpenQuickDispatch(selectedSector.id)
                  }}
                  disabled={selectedSector.isLockedForCombat}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-200 py-1.5 px-3 text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer",
                    selectedSector.isLockedForCombat && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Truck className="size-3.5 text-cyan-400" />
                  <span>Điều Quân Chi Viện (Quick Dispatch)</span>
                </button>
              )}

              {/* Nút 3: Nâng Cấp Công Sự */}
              <button
                onClick={handleUpgradeFort}
                disabled={
                  selectedSector.isLockedForCombat ||
                  (selectedSector.fortificationLevel ?? 1) >= 5 ||
                  worldState.resources.industrialMaterials < 100
                }
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/40 hover:border-amber-400 text-amber-200 py-1.5 px-3 text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer",
                  (selectedSector.isLockedForCombat ||
                    (selectedSector.fortificationLevel ?? 1) >= 5 ||
                    worldState.resources.industrialMaterials < 100) &&
                    "opacity-50 cursor-not-allowed"
                )}
              >
                <Hammer className="size-3.5 text-amber-400" />
                <span>Nâng Cấp Công Sự (+100 Vật Liệu)</span>
              </button>

              {/* Nút 4: Can Thiệp Buồng Lái / Combat */}
              {onDeployCombat &&
                (selectedSector.stage === "threatened" ||
                  selectedSector.stage === "under_siege" ||
                  selectedSector.isLockedForCombat) && (
                  <button
                    onClick={() => {
                      playClickSound()
                      onDeployCombat(selectedSector.id)
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded bg-red-950/40 hover:bg-red-900/50 border border-red-500/60 hover:border-red-400 text-red-200 py-2 px-3 font-display text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                  >
                    <Swords className="size-3.5 text-red-400" />
                    <span>Xuất Kích Tác Chiến Tại Sector</span>
                  </button>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
