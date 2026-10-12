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
  EyeOff,
  Flame,
  Globe2,
  Hammer,
  HelpCircle,
  Info,
  Layers,
  Lock,
  Maximize2,
  Minimize2,
  Minus,
  Navigation,
  Orbit,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  RotateCcw,
  Route,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  TrendingDown,
  TrendingUp,
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

/**
 * Cấu hình hiển thị theo quyền kiểm soát (Sovereignty)
 */
const SOVEREIGNTY_CONFIG: Record<
  SectorSovereignty,
  { label: string; shortLabel: string; color: string; bg: string; border: string; glow: string }
> = {
  vss: {
    label: "Liên Minh VSS",
    shortLabel: "VSS",
    color: "#06b6d4",
    bg: "rgba(6, 182, 212, 0.18)",
    border: "#06b6d4",
    glow: "0 0 16px rgba(6, 182, 212, 0.5)",
  },
  void: {
    label: "Đế Chế The Void",
    shortLabel: "Void",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.18)",
    border: "#ef4444",
    glow: "0 0 16px rgba(239, 68, 68, 0.5)",
  },
  contested: {
    label: "Tranh Chấp",
    shortLabel: "Tranh Chấp",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.18)",
    border: "#f59e0b",
    glow: "0 0 16px rgba(245, 158, 11, 0.5)",
  },
  neutral: {
    label: "Trung Lập",
    shortLabel: "Trung Lập",
    color: "#94a3b8",
    bg: "rgba(148, 163, 184, 0.15)",
    border: "#94a3b8",
    glow: "0 0 16px rgba(148, 163, 184, 0.3)",
  },
}

/**
 * Cấu hình giai đoạn vòng đời Sector (Stage Lifecycle)
 */
const STAGE_CONFIG: Record<
  SectorStage,
  { label: string; badgeBg: string; text: string; badgeBorder: string; ringColor: string }
> = {
  normal: {
    label: "Bình Thường",
    badgeBg: "bg-emerald-950/60",
    text: "text-emerald-300",
    badgeBorder: "border-emerald-500/40",
    ringColor: "#10b981",
  },
  threatened: {
    label: "Bị Đe Dọa",
    badgeBg: "bg-amber-950/60",
    text: "text-amber-300",
    badgeBorder: "border-amber-500/50",
    ringColor: "#f59e0b",
  },
  under_siege: {
    label: "Bị Vây Hãm",
    badgeBg: "bg-red-950/70",
    text: "text-red-300",
    badgeBorder: "border-red-500/60",
    ringColor: "#ef4444",
  },
  lost: {
    label: "Thất Thủ",
    badgeBg: "bg-purple-950/80",
    text: "text-purple-300",
    badgeBorder: "border-purple-500/60",
    ringColor: "#a855f7",
  },
  recovery: {
    label: "Đang Phục Hồi",
    badgeBg: "bg-cyan-950/60",
    text: "text-cyan-300",
    badgeBorder: "border-cyan-500/40",
    ringColor: "#06b6d4",
  },
}

/**
 * Cấu hình tuyến đường siêu không gian (Route State)
 */
const ROUTE_CONFIG: Record<
  RouteState,
  { label: string; stroke: string; strokeDasharray?: string; opacity: number; badgeColor: string; badgeBg: string }
> = {
  open: {
    label: "Thông Suốt",
    stroke: "#06b6d4",
    opacity: 0.85,
    badgeColor: "#06b6d4",
    badgeBg: "#083344",
  },
  hazardous: {
    label: "Nguy Hiểm",
    stroke: "#f59e0b",
    strokeDasharray: "6 4",
    opacity: 0.9,
    badgeColor: "#f59e0b",
    badgeBg: "#451a03",
  },
  blocked: {
    label: "Phong Tỏa",
    stroke: "#ef4444",
    strokeDasharray: "4 4",
    opacity: 0.85,
    badgeColor: "#ef4444",
    badgeBg: "#450a0a",
  },
  offline: {
    label: "Ngoại Tuyến",
    stroke: "#52525b",
    strokeDasharray: "2 4",
    opacity: 0.45,
    badgeColor: "#71717a",
    badgeBg: "#18181b",
  },
}

/**
 * Hàm phân loại Threat Level (0..1000)
 */
function getThreatTier(threat: number): {
  tier: "low" | "medium" | "high"
  label: string
  color: string
  bg: string
  border: string
} {
  if (threat >= 700) {
    return {
      tier: "high",
      label: "NGUY HIỂM",
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.15)",
      border: "rgba(239, 68, 68, 0.6)",
    }
  }
  if (threat >= 300) {
    return {
      tier: "medium",
      label: "CẢNH BÁO",
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.15)",
      border: "rgba(245, 158, 11, 0.6)",
    }
  }
  return {
    tier: "low",
    label: "AN TOÀN",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.15)",
    border: "rgba(16, 185, 129, 0.6)",
  }
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
  const [showInspector, setShowInspector] = useState<boolean>(true)
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null)
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

  // Bản đồ tra cứu các đạo quân đang hướng tới từng sector (Destination lookup)
  const incomingDeploymentsBySector = useMemo(() => {
    const map = new Map<string, TroopDeployment[]>()
    for (const dep of activeDeployments) {
      const list = map.get(dep.toSectorId) || []
      list.push(dep)
      map.set(dep.toSectorId, list)
    }
    return map
  }, [activeDeployments])

  // Lực lượng đang hướng đến sector đang chọn
  const incomingToSelected = useMemo(() => {
    if (!selectedSectorId) return []
    return incomingDeploymentsBySector.get(selectedSectorId) || []
  }, [incomingDeploymentsBySector, selectedSectorId])

  const totalIncomingTroopsToSelected = useMemo(() => {
    return incomingToSelected.reduce((acc, d) => acc + d.troopCount, 0)
  }, [incomingToSelected])

  // Tìm các sự kiện liên quan đến sector đang chọn
  const sectorEvents = useMemo(() => {
    if (!selectedSectorId) return []
    return getActiveEvents(worldState).filter(
      (e) => e.sectorId === selectedSectorId && (e.status === "INIT" || e.status === "PROCESSING")
    )
  }, [worldState, selectedSectorId])

  // Phase 6.12: Dữ liệu Sparkline Threat 5 ngày gần nhất cho Sector đang chọn
  const sparklineData = useMemo(() => {
    if (!selectedSector?.threatHistory || selectedSector.threatHistory.length === 0) {
      return {
        history: [],
        points: [] as Array<{ day: number; threat: number; x: number; y: number }>,
        lineString: "",
        areaString: "",
        delta: null as number | null,
      }
    }

    const history = selectedSector.threatHistory.slice(-5)
    const threats = history.map((p) => p.threat)
    const minT = Math.min(...threats)
    const maxT = Math.max(...threats)
    const range = maxT - minT

    const width = 240
    const height = 40
    const padX = 14
    const padY = 6
    const usableW = width - padX * 2
    const usableH = height - padY * 2

    const points = history.map((pt, idx) => {
      const x =
        history.length === 1
          ? width / 2
          : padX + (idx / (history.length - 1)) * usableW
      const y =
        range === 0
          ? height / 2
          : (height - padY) - ((pt.threat - minT) / range) * usableH
      return { ...pt, x, y }
    })

    const lineString = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
    const areaString =
      points.length >= 2
        ? `${points[0].x.toFixed(1)},${height - 4} ${lineString} ${points[points.length - 1].x.toFixed(1)},${height - 4}`
        : ""

    const delta =
      history.length >= 2
        ? history[history.length - 1].threat - history[0].threat
        : null

    return {
      history,
      points,
      lineString,
      areaString,
      delta,
    }
  }, [selectedSector])

  // Thống kê chủ quyền & Threat toàn thiên hà
  const galaxyMetrics = useMemo(() => {
    if (!sectors.length) return { vssPct: 0, voidPct: 0, contestedPct: 0, avgThreat: 0, threatTier: getThreatTier(0) }
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
    const avgThreat = Math.round(totalThreat / total)
    return {
      vssPct: Math.round((vssCount / total) * 100),
      voidPct: Math.round((voidCount / total) * 100),
      contestedPct: Math.round((contestedCount / total) * 100),
      avgThreat,
      threatTier: getThreatTier(avgThreat),
    }
  }, [sectors])

  const notify = (message: string, type: "success" | "error" | "info" = "success") => {
    setFeedback({ message, type })
    setTimeout(() => setFeedback(null), 3600)
  }

  const handleSectorClick = (sectorId: string) => {
    playClickSound()
    setInternalSelectedId(sectorId)
    setShowInspector(true)
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
      {/* 1. TOP STRATEGIC HUD BAR (TINH CHỈNH & GỌN GÀNG) */}
      <header
        className={cn(
          "shrink-0 flex flex-wrap items-center justify-between border-b border-cyan-500/30 bg-zinc-950/95 px-3 py-2 backdrop-blur-md z-20 gap-2",
          isFullscreen && "pr-32"
        )}
      >
        {/* Tiêu đề & Thông tin thiên hà */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Orbit className="size-4 text-cyan-400 animate-spin-slow" />
            <span className="font-display text-xs font-black tracking-wider text-cyan-300 uppercase">
              STARFRONT GALAXY NETWORK
            </span>
          </div>
          <span className="text-zinc-600 font-mono hidden sm:inline">|</span>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="rounded bg-cyan-950/70 border border-cyan-500/50 px-2 py-0.5 font-bold text-cyan-300">
              NGÀY #{worldState.currentDay}
            </span>
            <span className="text-zinc-400 text-[11px] hidden md:inline">
              {sectors.length} Sectors · {routes.length} Tuyến Hyperlane
            </span>
          </div>
        </div>

        {/* Tỷ lệ kiểm soát & Threat trung bình & Hành quân */}
        <div className="flex items-center gap-2.5 font-mono text-[11px]">
          {/* Tỷ lệ kiểm soát */}
          <div className="hidden lg:flex items-center gap-2 bg-zinc-900/70 border border-zinc-800 rounded px-2.5 py-1">
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

          {/* Threat trung bình */}
          <div
            className="flex items-center gap-1.5 rounded px-2 py-1 border"
            style={{
              backgroundColor: galaxyMetrics.threatTier.bg,
              borderColor: galaxyMetrics.threatTier.border,
              color: galaxyMetrics.threatTier.color,
            }}
            title={`Threat trung bình: ${galaxyMetrics.avgThreat}/1000 (${galaxyMetrics.threatTier.label})`}
          >
            <Flame className="size-3" />
            <span className="font-bold">Threat TB: {galaxyMetrics.avgThreat}</span>
            <span className="hidden sm:inline text-[9px] uppercase opacity-90">({galaxyMetrics.threatTier.label})</span>
          </div>

          {/* Hạm đội hành quân */}
          <button
            onClick={() => setShowDeployments(!showDeployments)}
            className={cn(
              "flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors cursor-pointer",
              activeDeployments.length > 0
                ? "border-cyan-500/50 bg-cyan-950/50 text-cyan-200 hover:border-cyan-400"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
            )}
            title={showDeployments ? "Ẩn hạm đội hành quân" : "Hiện hạm đội hành quân"}
          >
            <Truck className="size-3 text-cyan-400" />
            <span className="hidden sm:inline">Hành Quân:</span>
            <span className="font-bold">{activeDeployments.length}</span>
          </button>

          {/* Nút bật/tắt Inspector Drawer */}
          <button
            onClick={() => setShowInspector(!showInspector)}
            className={cn(
              "flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors cursor-pointer",
              showInspector
                ? "border-cyan-500/40 bg-zinc-900 text-cyan-300"
                : "border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:text-white"
            )}
            title={showInspector ? "Đóng bảng chi tiết Sector" : "Mở bảng chi tiết Sector"}
          >
            {showInspector ? <PanelRightClose className="size-3.5" /> : <PanelRightOpen className="size-3.5" />}
            <span className="hidden sm:inline">Chi Tiết</span>
          </button>

          {/* Nút Fullscreen Toggle */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className={cn(
                "flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors cursor-pointer",
                isFullscreen
                  ? "border-cyan-400 bg-cyan-950/70 text-cyan-200"
                  : "border-zinc-700 bg-zinc-900/70 text-zinc-300 hover:text-white hover:border-cyan-500"
              )}
              title={isFullscreen ? "Thoát toàn màn hình (ESC)" : "Xem toàn màn hình (100vw/100vh)"}
            >
              {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
              <span className="hidden md:inline">{isFullscreen ? "Thu Nhỏ" : "Toàn Màn Hình"}</span>
            </button>
          )}
        </div>
      </header>

      {/* Thông báo feedback toast */}
      {feedback && (
        <div
          className={cn(
            "absolute top-14 left-1/2 -translate-x-1/2 z-40 rounded px-4 py-1.5 font-mono text-xs shadow-lg border animate-in fade-in duration-200 flex items-center gap-2",
            feedback.type === "success"
              ? "border-cyan-500/60 bg-cyan-950/95 text-cyan-300"
              : feedback.type === "error"
              ? "border-red-500/60 bg-red-950/95 text-red-300"
              : "border-amber-500/60 bg-amber-950/95 text-amber-300"
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
            {/* Glow filters */}
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* A. VẼ CÁC TUYẾN ĐƯỜNG SIÊU KHÔNG GIAN (12 HYPERLANE ROUTES LAYER) */}
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
              const isHovered = hoveredRouteId === route.id

              const midX = (x1 + x2) / 2
              const midY = (y1 + y2) / 2

              return (
                <g
                  key={route.id}
                  className="transition-opacity cursor-pointer"
                  onMouseEnter={() => setHoveredRouteId(route.id)}
                  onMouseLeave={() => setHoveredRouteId(null)}
                >
                  {/* Đường phụ tạo hiệu ứng glow khi được chọn hoặc hover */}
                  {(isSelectedAdjacent || isHovered) && (
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={routeCfg.stroke}
                      strokeWidth="6"
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
                    strokeWidth={isSelectedAdjacent ? "2.6" : isHovered ? "2.2" : "1.8"}
                    strokeDasharray={routeCfg.strokeDasharray}
                    strokeOpacity={isSelectedAdjacent ? 1 : isHovered ? 0.95 : routeCfg.opacity}
                  />

                  {/* Huy hiệu trạng thái và nhãn tuyến ở trung điểm */}
                  {route.state === "hazardous" && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <circle r="7" fill="#451a03" stroke="#f59e0b" strokeWidth="1.2" />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#f59e0b"
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        !
                      </text>
                    </g>
                  )}

                  {route.state === "blocked" && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <circle r="7" fill="#450a0a" stroke="#ef4444" strokeWidth="1.2" />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ef4444"
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        ×
                      </text>
                    </g>
                  )}

                  {/* Nếu route đang kết nối với sector đang chọn hoặc hover, hiển thị tag cự ly và rủi ro */}
                  {(isSelectedAdjacent || isHovered) && (
                    <g transform={`translate(${midX}, ${midY - (route.state !== "open" ? 14 : 0)})`}>
                      <rect
                        x="-38"
                        y="-8"
                        width="76"
                        height="16"
                        rx="3"
                        fill="#09090b"
                        fillOpacity="0.9"
                        stroke={routeCfg.stroke}
                        strokeWidth="0.8"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={routeCfg.stroke}
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {route.distance}d · Rủi ro {route.dangerLevel}%
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </g>

          {/* B. VẼ CÁC ĐOÀN QUÂN ĐANG HÀNH QUÂN (IN-TRANSIT FLEETS LAYER) */}
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
                    {/* Vòng beacon quét radar */}
                    <circle r="12" fill="rgba(6, 182, 212, 0.2)" stroke="#06b6d4" strokeWidth="1.5" />
                    <circle r="4" fill="#06b6d4" />

                    {/* Tag hiển thị số quân và hướng đích */}
                    <g transform="translate(14, -8)">
                      <rect
                        x="0"
                        y="0"
                        width="58"
                        height="16"
                        rx="3"
                        fill="#020617"
                        fillOpacity="0.95"
                        stroke="#06b6d4"
                        strokeWidth="1"
                      />
                      <text
                        x="29"
                        y="8"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#06b6d4"
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        🚚 {dep.troopCount} Q
                      </text>
                    </g>
                  </g>
                )
              })}
            </g>
          )}

          {/* C. VẼ 8 ĐỈNH SECTOR THIÊN HÀ (SECTOR NODES LAYER) */}
          <g id="sectors-layer">
            {sectors.map((sector) => {
              const cx = (sector.x / 100) * 1000
              const cy = (sector.y / 100) * 650
              const isSelected = sector.id === selectedSectorId
              const sovCfg = SOVEREIGNTY_CONFIG[sector.sovereignty] || SOVEREIGNTY_CONFIG.neutral
              const stageCfg = STAGE_CONFIG[sector.stage] || STAGE_CONFIG.normal
              const threatInfo = getThreatTier(sector.threatLevel)
              const isLocked = Boolean(sector.isLockedForCombat)

              // Kiểm tra xem sector có đang là đích đến của đoàn quân nào không
              const incomingDeployments = incomingDeploymentsBySector.get(sector.id) || []
              const incomingTroops = incomingDeployments.reduce((sum, d) => sum + d.troopCount, 0)
              const isDeploymentTarget = incomingDeployments.length > 0

              return (
                <g
                  key={sector.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSectorClick(sector.id)
                  }}
                  className="cursor-pointer group"
                >
                  {/* 1. Vòng định vị khi được chọn (Tactical Targeting Reticle) */}
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
                      {/* 4 dấu ngắm góc chữ thập */}
                      <line x1="-38" y1="0" x2="-32" y2="0" stroke="#06b6d4" strokeWidth="2" />
                      <line x1="32" y1="0" x2="38" y2="0" stroke="#06b6d4" strokeWidth="2" />
                      <line x1="0" y1="-38" x2="0" y2="-32" stroke="#06b6d4" strokeWidth="2" />
                      <line x1="0" y1="32" x2="0" y2="38" stroke="#06b6d4" strokeWidth="2" />
                    </g>
                  )}

                  {/* 2. Vòng hiển thị trạng thái Stage (Chỉ pulse có chọn lọc ở under_siege) */}
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
                      strokeDasharray="6 4"
                      opacity="0.85"
                    />
                  )}

                  {sector.stage === "lost" && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="26"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="1.5"
                      strokeDasharray="2 3"
                      opacity="0.85"
                    />
                  )}

                  {sector.stage === "recovery" && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="26"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      opacity="0.8"
                    />
                  )}

                  {/* 3. Vòng nền Sector mang màu sắc phe phái */}
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

                  {/* 4. Lõi trung tâm */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r="8"
                    fill={sovCfg.color}
                    opacity="0.95"
                  />

                  {/* 5. Huy hiệu đích đến điều quân (Incoming Reinforcements Badge) */}
                  {isDeploymentTarget && (
                    <g transform={`translate(${cx - 38}, ${cy - 22})`}>
                      <rect
                        width="36"
                        height="14"
                        rx="2"
                        fill="#083344"
                        stroke="#06b6d4"
                        strokeWidth="1"
                      />
                      <text
                        x="18"
                        y="7"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#38bdf8"
                        fontSize="7.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        +{incomingTroops}Q
                      </text>
                    </g>
                  )}

                  {/* 6. Huy hiệu khóa Combat (Combat Lock Badge) */}
                  {isLocked && (
                    <g transform={`translate(${cx + 10}, ${cy - 16})`}>
                      <rect width="20" height="15" rx="2" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" />
                      <text
                        x="10"
                        y="8"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#fee2e2"
                        fontSize="8.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        🔒
                      </text>
                    </g>
                  )}

                  {/* 7. Nhãn tên Sector */}
                  <g transform={`translate(${cx}, ${cy + (isSelected ? 34 : 30)})`}>
                    <rect
                      x="-65"
                      y="-10"
                      width="130"
                      height="20"
                      rx="3"
                      fill="#020617"
                      fillOpacity="0.88"
                      stroke={isSelected ? "#06b6d4" : "rgba(255,255,255,0.18)"}
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

                  {/* 8. Thanh đo Threat & Chỉ số số học rõ ràng dưới tên */}
                  <g transform={`translate(${cx - 40}, ${cy + (isSelected ? 46 : 42)})`}>
                    <rect width="80" height="4" rx="1" fill="#18181b" />
                    <rect
                      width={Math.min(80, (sector.threatLevel / 1000) * 80)}
                      height="4"
                      rx="1"
                      fill={threatInfo.color}
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

        {/* 4. CHÚ GIẢI BẢN ĐỒ THỐNG NHẤT 5 NHÓM (MAP LEGEND FLOATING PANEL) */}
        <div className="absolute top-3 left-3 z-20 max-w-xs font-mono text-[10px]">
          <div className="rounded border border-zinc-800/90 bg-zinc-950/90 p-2.5 backdrop-blur-md space-y-2 shadow-2xl">
            <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800 pb-1">
              <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                <Compass className="size-3 text-cyan-400" />
                CHÚ GIẢI BẢN ĐỒ
              </span>
              <button
                onClick={() => setShowLegend(!showLegend)}
                className="text-zinc-500 hover:text-cyan-300 transition-colors cursor-pointer text-[10px]"
              >
                {showLegend ? "Thu gọn" : "Mở rộng"}
              </button>
            </div>

            {showLegend && (
              <div className="space-y-2 pt-0.5 max-h-[460px] overflow-y-auto pr-1">
                {/* Nhóm 1: Chủ quyền (Sovereignty) */}
                <div>
                  <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    1. Chủ Quyền (Sovereignty)
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[9px]">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
                      <span>VSS Coalition</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-red-400 shadow-[0_0_6px_#ef4444]" />
                      <span>The Void</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                      <span>Tranh Chấp</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-slate-400" />
                      <span>Trung Lập</span>
                    </div>
                  </div>
                </div>

                {/* Nhóm 2: Mức độ đe dọa (Threat Level 0-1000) */}
                <div className="border-t border-zinc-800/70 pt-1.5">
                  <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    2. Mức Đe Dọa (Threat Level)
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[9px]">
                    <div className="flex items-center gap-1 text-emerald-400">
                      <span className="size-2 rounded-full bg-emerald-400" />
                      <span>0-299 Thấp</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400">
                      <span className="size-2 rounded-full bg-amber-400" />
                      <span>300-699 Vừa</span>
                    </div>
                    <div className="flex items-center gap-1 text-red-400">
                      <span className="size-2 rounded-full bg-red-400" />
                      <span>700+ Cao</span>
                    </div>
                  </div>
                </div>

                {/* Nhóm 3: Tuyến Hyperlane (Route Status) */}
                <div className="border-t border-zinc-800/70 pt-1.5">
                  <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    3. Tuyến Hyperlane
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[9px]">
                    <div className="text-cyan-400">─── Thông suốt</div>
                    <div className="text-amber-400">- - - Nguy hiểm (!)</div>
                    <div className="text-red-400">··· Phong tỏa (×)</div>
                    <div className="text-zinc-500">··· Ngoại tuyến</div>
                  </div>
                </div>

                {/* Nhóm 4: Giai đoạn & Khóa trận (Sector Stage & Combat Lock) */}
                <div className="border-t border-zinc-800/70 pt-1.5">
                  <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    4. Giai Đoạn & Khóa Trận
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[9px]">
                    <div className="flex items-center gap-1 text-zinc-300">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      <span>Bình thường</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-300">
                      <span className="size-1.5 rounded-full bg-amber-400" />
                      <span>Bị đe dọa</span>
                    </div>
                    <div className="flex items-center gap-1 text-red-300">
                      <span className="size-1.5 rounded-full bg-red-400" />
                      <span>Vây hãm (Pulse)</span>
                    </div>
                    <div className="flex items-center gap-1 text-red-400 font-bold">
                      <span>🔒</span>
                      <span>Khóa combat</span>
                    </div>
                  </div>
                </div>

                {/* Nhóm 5: Lực lượng hành quân (Deployments & Targets) */}
                <div className="border-t border-zinc-800/70 pt-1.5">
                  <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    5. Lực Lượng Hành Quân
                  </div>
                  <div className="space-y-0.5 text-[9px]">
                    <div className="flex items-center gap-1.5 text-cyan-300">
                      <span>🚚</span>
                      <span>Hạm đội di chuyển (Convoy vị trí nội suy)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-cyan-400">
                      <span className="font-bold">+NQ</span>
                      <span>Sector đang nhận quân chi viện</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nút nổi mở lại Inspector nếu Inspector đang đóng và có sector được chọn */}
        {!showInspector && selectedSector && (
          <button
            onClick={() => {
              playClickSound()
              setShowInspector(true)
            }}
            className="absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded bg-zinc-900/90 border border-cyan-500/60 hover:border-cyan-400 px-3 py-1.5 text-xs font-mono text-cyan-300 shadow-xl backdrop-blur-md cursor-pointer transition-all hover:bg-zinc-850"
          >
            <PanelRightOpen className="size-3.5 text-cyan-400" />
            <span>Mở Bảng: {selectedSector.name}</span>
          </button>
        )}

        {/* 5. PANEL CHI TIẾT SECTOR (SECTOR INSPECTOR DRAWER) */}
        {showInspector && selectedSector && (
          <div className="absolute top-3 right-3 bottom-3 w-80 sm:w-96 z-30 flex flex-col rounded-sm border border-cyan-500/50 bg-zinc-950/95 backdrop-blur-md p-4 shadow-2xl font-mono text-xs overflow-y-auto space-y-3.5 animate-in fade-in slide-in-from-right-4 duration-150">
            {/* Header Inspector kèm nút đóng */}
            <div className="border-b border-zinc-800 pb-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-sm font-black uppercase text-cyan-300 truncate">
                      {selectedSector.name}
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.2 text-[9px] font-bold uppercase border shrink-0",
                        STAGE_CONFIG[selectedSector.stage]?.badgeBg,
                        STAGE_CONFIG[selectedSector.stage]?.text,
                        STAGE_CONFIG[selectedSector.stage]?.badgeBorder
                      )}
                    >
                      {STAGE_CONFIG[selectedSector.stage]?.label}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 truncate">{selectedSector.subtitle}</div>
                </div>

                {/* Nút đóng Inspector */}
                <button
                  onClick={() => setShowInspector(false)}
                  className="size-6 flex items-center justify-center rounded border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                  title="Đóng bảng chi tiết"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <p className="mt-2 text-[11px] text-zinc-400/90 leading-relaxed font-sans">
                {selectedSector.desc}
              </p>
            </div>

            {/* Banner Cảnh Báo Khóa Giao Tranh nếu có */}
            {selectedSector.isLockedForCombat && (
              <div className="rounded border border-red-500/60 bg-red-950/40 p-2.5 text-[11px] text-red-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Lock className="size-3.5 text-red-400" />
                  <span>ĐANG KHÓA GIAO TRANH (COMBAT LOCKED)</span>
                </div>
                <p className="text-[10px] text-red-300/80 leading-normal font-sans">
                  Sector này đang tham chiến với buồng lái. Lực lượng đồn trú bị đóng băng để bảo toàn dữ liệu. Không thể xuất quân rời khỏi.
                </p>
              </div>
            )}

            {/* Banner Thông Báo Đang Có Đạo Quân Tiến Tới (Deployment Target) */}
            {incomingToSelected.length > 0 && (
              <div className="rounded border border-cyan-500/50 bg-cyan-950/40 p-2 text-[11px] text-cyan-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Truck className="size-3.5 text-cyan-400" />
                  <span>ĐANG NHẬN CHI VIỆN (+{totalIncomingTroopsToSelected} QUÂN)</span>
                </div>
                <div className="text-[10px] text-cyan-200/80 space-y-0.5 font-sans">
                  {incomingToSelected.map((d) => (
                    <div key={d.deploymentId}>
                      · {d.troopCount} quân từ {worldState.sectors[d.fromSectorId]?.name || d.fromSectorId} (Còn {d.remainingDays} ngày)
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lưới 6 Chỉ Số Vĩ Mô Của Sector */}
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-900/50 p-2.5 rounded border border-zinc-800">
              <div>
                <span className="text-zinc-400 text-[10px]">Chủ quyền:</span>
                <div className="font-bold uppercase flex items-center gap-1 mt-0.5" style={{ color: SOVEREIGNTY_CONFIG[selectedSector.sovereignty]?.color }}>
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: SOVEREIGNTY_CONFIG[selectedSector.sovereignty]?.color }} />
                  {SOVEREIGNTY_CONFIG[selectedSector.sovereignty]?.label}
                </div>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px]">Công sự phòng thủ:</span>
                <div className="font-bold text-amber-400 mt-0.5">
                  Cấp {selectedSector.fortificationLevel ?? 1}/5
                </div>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px]">Mức Đe Dọa (Threat):</span>
                <div className="font-bold mt-0.5 flex items-center gap-1" style={{ color: getThreatTier(selectedSector.threatLevel).color }}>
                  <span>{selectedSector.threatLevel}/1000</span>
                  <span className="text-[9px] opacity-80">({getThreatTier(selectedSector.threatLevel).label})</span>
                </div>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px]">Độ Ổn Định (Stability):</span>
                <div className="font-bold text-emerald-400 mt-0.5">
                  {selectedSector.stability}/100
                </div>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px]">Lực lượng Đồn Trú:</span>
                <div className="font-bold text-cyan-300 mt-0.5">
                  {selectedSector.garrisonPower} quân
                </div>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px]">Dân số khu vực:</span>
                <div className="font-bold text-zinc-200 mt-0.5">
                  {selectedSector.population.toLocaleString()} dân
                </div>
              </div>
            </div>

            {/* THREAT TRENDLINE SPARKLINE (PHASE 6.12) */}
            <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-zinc-300">
                  <Activity
                    className="size-3.5"
                    style={{ color: getThreatTier(selectedSector.threatLevel).color }}
                  />
                  <span>Xu Hướng Threat (5 Ngày)</span>
                </div>

                {/* Delta Badge so với điểm đầu chuỗi */}
                {sparklineData.delta !== null ? (
                  <div
                    className={cn(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold",
                      sparklineData.delta > 0
                        ? "text-rose-400 bg-rose-950/60 border-rose-500/40"
                        : sparklineData.delta < 0
                        ? "text-emerald-400 bg-emerald-950/60 border-emerald-500/40"
                        : "text-zinc-300 bg-zinc-800/80 border-zinc-700"
                    )}
                    title={`Biến động so với điểm đầu chuỗi (N.${sparklineData.history[0]?.day} → N.${sparklineData.history[sparklineData.history.length - 1]?.day})`}
                  >
                    {sparklineData.delta > 0 ? (
                      <TrendingUp className="size-3 text-rose-400" />
                    ) : sparklineData.delta < 0 ? (
                      <TrendingDown className="size-3 text-emerald-400" />
                    ) : (
                      <Minus className="size-3 text-zinc-400" />
                    )}
                    <span>
                      {sparklineData.delta > 0
                        ? `+${sparklineData.delta}`
                        : sparklineData.delta === 0
                        ? "0"
                        : `${sparklineData.delta}`}
                    </span>
                    <span className="text-[8px] opacity-80 font-sans uppercase">
                      {sparklineData.delta > 0
                        ? "Tăng"
                        : sparklineData.delta < 0
                        ? "Giảm"
                        : "Ổn định"}
                    </span>
                  </div>
                ) : sparklineData.history.length === 1 ? (
                  <span className="text-[9px] font-mono text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-950/60 border border-zinc-800">
                    N.{sparklineData.history[0].day} (Khởi đầu)
                  </span>
                ) : (
                  <span className="text-[9px] text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-950/60 border border-zinc-800">
                    Chờ chu kỳ tick
                  </span>
                )}
              </div>

              {/* Threat Hiện Tại & Tóm tắt */}
              <div className="flex items-center justify-between text-[10px] text-zinc-400 px-0.5">
                <span>
                  Hiện tại:{" "}
                  <strong
                    className="font-mono text-xs"
                    style={{ color: getThreatTier(selectedSector.threatLevel).color }}
                  >
                    {selectedSector.threatLevel}/1000
                  </strong>
                </span>
                <span
                  className="text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase"
                  style={{
                    color: getThreatTier(selectedSector.threatLevel).color,
                    backgroundColor: `${getThreatTier(selectedSector.threatLevel).color}15`,
                    borderColor: `${getThreatTier(selectedSector.threatLevel).color}30`,
                    borderWidth: 1,
                  }}
                >
                  {getThreatTier(selectedSector.threatLevel).label}
                </span>
              </div>

              {/* Sparkline Canvas Area */}
              {sparklineData.history.length === 0 ? (
                <div className="py-2.5 px-2 flex flex-col items-center justify-center text-center rounded border border-dashed border-zinc-800 bg-zinc-950/40">
                  <span className="text-[10px] text-zinc-400">Chưa có lịch sử chu kỳ Threat</span>
                  <span className="text-[8px] text-zinc-600 mt-0.5">
                    Dữ liệu sẽ được ghi nhận sau tick ngày chiến lược
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="relative w-full h-11 bg-zinc-950/80 rounded border border-zinc-800/80 p-1 flex items-center justify-center overflow-hidden">
                    <svg
                      viewBox="0 0 240 40"
                      className="w-full h-full overflow-visible"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient
                          id={`threat-grad-${selectedSector.id}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={getThreatTier(selectedSector.threatLevel).color}
                            stopOpacity="0.35"
                          />
                          <stop
                            offset="100%"
                            stopColor={getThreatTier(selectedSector.threatLevel).color}
                            stopOpacity="0.0"
                          />
                        </linearGradient>
                      </defs>

                      {/* Trục nền đứt đoạn */}
                      <line
                        x1="12"
                        y1="34"
                        x2="228"
                        y2="34"
                        stroke="#27272a"
                        strokeDasharray="2,2"
                        strokeWidth="1"
                      />

                      {/* Vùng Polyline + Area Fill Gradient */}
                      {sparklineData.history.length >= 2 && (
                        <>
                          <polygon
                            points={sparklineData.areaString}
                            fill={`url(#threat-grad-${selectedSector.id})`}
                          />
                          <polyline
                            points={sparklineData.lineString}
                            fill="none"
                            stroke={getThreatTier(selectedSector.threatLevel).color}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </>
                      )}

                      {/* Các điểm dữ liệu ngày */}
                      {sparklineData.points.map((pt, idx) => {
                        const isLatest = idx === sparklineData.points.length - 1
                        return (
                          <g key={pt.day}>
                            {isLatest && (
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r="6"
                                fill={getThreatTier(selectedSector.threatLevel).color}
                                fillOpacity="0.3"
                                className="animate-ping"
                              />
                            )}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isLatest ? "4" : "3"}
                              fill={getThreatTier(selectedSector.threatLevel).color}
                              stroke="#09090b"
                              strokeWidth="1.5"
                            />
                          </g>
                        )
                      })}
                    </svg>
                  </div>

                  {/* Lịch trình các mốc ngày bên dưới */}
                  <div className="flex items-center justify-between gap-1 text-[9px] pt-0.5">
                    {sparklineData.history.map((pt, idx) => {
                      const isLatest = idx === sparklineData.history.length - 1
                      return (
                        <div
                          key={pt.day}
                          className={cn(
                            "flex-1 flex flex-col items-center py-0.5 rounded border transition-colors",
                            isLatest
                              ? "bg-zinc-800/80 border-cyan-500/50 text-cyan-200"
                              : "bg-zinc-950/60 border-zinc-800/80 text-zinc-400"
                          )}
                          title={`Ngày ${pt.day}: Mức đe dọa ${pt.threat}/1000`}
                        >
                          <span className="text-[8px] opacity-75 font-mono">N.{pt.day}</span>
                          <span className="font-bold text-[9px]">{pt.threat}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
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

            {/* CÁC THAO TÁC HÀNH ĐỘNG CHIẾN THUẬT (SẮP XẾP HỢP LÝ THEO MỨC ƯU TIÊN) */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              {/* Nhóm 1: Xuất Kích Chiến Đấu khẩn cấp (Nếu có) */}
              {onDeployCombat &&
                (selectedSector.stage === "threatened" ||
                  selectedSector.stage === "under_siege" ||
                  selectedSector.isLockedForCombat) && (
                  <button
                    onClick={() => {
                      playClickSound()
                      onDeployCombat(selectedSector.id)
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded bg-red-950/50 hover:bg-red-900/60 border border-red-500/70 hover:border-red-400 text-red-200 py-2 px-3 font-display text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.25)]"
                  >
                    <Swords className="size-3.5 text-red-400" />
                    <span>Xuất Kích Tác Chiến Tại Sector</span>
                  </button>
                )}

              {/* Nhóm 2: Điều Quân Chi Viện */}
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
                    "w-full flex items-center justify-center gap-2 rounded bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/50 hover:border-cyan-400 text-cyan-200 py-1.5 px-3 text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer",
                    selectedSector.isLockedForCombat && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Truck className="size-3.5 text-cyan-400" />
                  <span>Điều Quân Chi Viện (Quick Dispatch)</span>
                </button>
              )}

              {/* Nhóm 3: Nâng Cấp Công Sự */}
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

              {/* Nhóm 4: Điều Hướng Chi Tiết Sang Tab Sector Operations */}
              {onNavigateToSectorOperations && (
                <button
                  onClick={() => {
                    playClickSound()
                    onNavigateToSectorOperations(selectedSector.id)
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 py-1.5 px-3 text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer"
                >
                  <Eye className="size-3.5 text-zinc-400" />
                  <span>Xem Chi Tiết Tại Sector Operations</span>
                  <ArrowRight className="size-3 text-zinc-400" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
