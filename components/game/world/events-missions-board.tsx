"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  Crosshair,
  Database,
  ExternalLink,
  Eye,
  Flame,
  GitBranch,
  Globe2,
  HelpCircle,
  Info,
  Layers,
  Lock,
  MapPin,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  TrendingDown,
  TrendingUp,
  Truck,
  Wheat,
  X,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { playClickSound, playShieldSound } from "@/lib/game/audio"
import { MAX_DISPATCH_DEFER_TICKS } from "@/lib/game/world/mission-chains"
import {
  scoreEventStrategy,
  selectBestStrategyForEvent,
  evaluateAndApplyEventStrategyPolicy,
  validateStrategyExecution,
} from "@/lib/game/world/event-strategy-policy"
import type {
  WorldState,
  WorldEvent,
  WorldEventResult,
  MissionChain,
  MissionChainNode,
  EventStrategy,
} from "@/lib/game/world/types"
import type { EventLifecycleSummary } from "@/lib/game/world/event-engine"

interface EventsMissionsBoardProps {
  worldState: WorldState
  activeEvents: WorldEvent[]
  activeMissionChains: MissionChain[]
  lastEventsSummary?: EventLifecycleSummary | null
  onChooseStrategy: (eventId: string, strategyId: string) => void
  onNavigateToResults?: () => void
  onNavigateToSector?: (sectorId: string) => void
  onStateUpdated?: () => void
  selectedEventId?: string | null
  onSelectEvent?: (eventId: string | null) => void
}

export type CommandDeskMode = "init" | "processing" | "chains"

export function EventsMissionsBoard({
  worldState,
  activeEvents,
  activeMissionChains,
  lastEventsSummary,
  onChooseStrategy,
  onNavigateToResults,
  onNavigateToSector,
  onStateUpdated,
  selectedEventId: propSelectedEventId,
  onSelectEvent,
}: EventsMissionsBoardProps) {
  // 1. Phân loại sự kiện INIT (Cần quyết định) - Sắp xếp theo Deadline -> Severity -> ID
  const initEvents = useMemo(() => {
    return activeEvents
      .filter((e) => e.status === "INIT")
      .sort((a, b) => {
        const aDeadline = Math.max(0, a.decisionDeadlineTick - worldState.currentDay)
        const bDeadline = Math.max(0, b.decisionDeadlineTick - worldState.currentDay)
        if (aDeadline !== bDeadline) return aDeadline - bDeadline

        const severityWeight: Record<string, number> = { critical: 3, warning: 2, info: 1 }
        const aSev = severityWeight[a.severity] || 0
        const bSev = severityWeight[b.severity] || 0
        if (aSev !== bSev) return bSev - aSev

        return a.id.localeCompare(b.id)
      })
  }, [activeEvents, worldState.currentDay])

  // 2. Sự kiện PROCESSING (Đang chạy)
  const processingEvents = useMemo(() => {
    return activeEvents.filter((e) => e.status === "PROCESSING")
  }, [activeEvents])

  // Chế độ xem cấp 1: "init" | "processing" | "chains"
  // Mặc định là "init" nếu có sự kiện INIT, hoặc "processing" nếu có event processing, ngược lại "chains" hoặc "init"
  const [commandMode, setCommandMode] = useState<CommandDeskMode>(() => {
    if (initEvents.length > 0) return "init"
    if (processingEvents.length > 0) return "processing"
    if (activeMissionChains.length > 0) return "chains"
    return "init"
  })

  const [selectedInitEventId, setSelectedInitEventId] = useState<string | null>(null)
  const [selectedProcessingEventId, setSelectedProcessingEventId] = useState<string | null>(null)
  const [selectedChainId, setSelectedChainId] = useState<string | null>(
    activeMissionChains.length > 0 ? activeMissionChains[0].id : null
  )

  const [searchQuery, setSearchQuery] = useState("")
  const [dismissedTickSummary, setDismissedTickSummary] = useState<number | null>(null)
  const [expandedReasonKeys, setExpandedReasonKeys] = useState<Record<string, boolean>>({})

  // Đồng bộ sự kiện được chọn từ prop ngoài (ví dụ điều hướng từ Strategic Overview)
  useEffect(() => {
    if (propSelectedEventId) {
      const ev = activeEvents.find((e) => e.id === propSelectedEventId)
      if (ev) {
        if (ev.status === "INIT") {
          setCommandMode("init")
          setSelectedInitEventId(propSelectedEventId)
        } else if (ev.status === "PROCESSING") {
          setCommandMode("processing")
          setSelectedProcessingEventId(propSelectedEventId)
        }
      }
    }
  }, [propSelectedEventId, activeEvents])

  // Auto-select cho INIT events khi danh sách thay đổi
  useEffect(() => {
    if (initEvents.length === 0) {
      setSelectedInitEventId(null)
      return
    }
    const exists = initEvents.some((e) => e.id === selectedInitEventId)
    if (!exists) {
      setSelectedInitEventId(initEvents[0].id)
    }
  }, [initEvents, selectedInitEventId])

  // Auto-select cho PROCESSING events khi danh sách thay đổi
  useEffect(() => {
    if (processingEvents.length === 0) {
      setSelectedProcessingEventId(null)
      return
    }
    const exists = processingEvents.some((e) => e.id === selectedProcessingEventId)
    if (!exists) {
      setSelectedProcessingEventId(processingEvents[0].id)
    }
  }, [processingEvents, selectedProcessingEventId])

  // Auto-select cho Chains khi activeMissionChains thay đổi
  useEffect(() => {
    if (activeMissionChains.length === 0) {
      setSelectedChainId(null)
      return
    }
    const exists = activeMissionChains.some((c) => c.id === selectedChainId)
    if (!exists) {
      setSelectedChainId(activeMissionChains[0].id)
    }
  }, [activeMissionChains, selectedChainId])

  // Lọc tìm kiếm theo chế độ hiện tại
  const filteredInitEvents = useMemo(() => {
    if (!searchQuery.trim()) return initEvents
    const q = searchQuery.toLowerCase().trim()
    return initEvents.filter((e) => {
      const titleMatch = e.title.toLowerCase().includes(q)
      const descMatch = e.description.toLowerCase().includes(q)
      const sectorMatch = e.sectorId && worldState.sectors[e.sectorId]?.name.toLowerCase().includes(q)
      const catMatch = e.category.toLowerCase().includes(q)
      return titleMatch || descMatch || sectorMatch || catMatch
    })
  }, [initEvents, searchQuery, worldState.sectors])

  const filteredProcessingEvents = useMemo(() => {
    if (!searchQuery.trim()) return processingEvents
    const q = searchQuery.toLowerCase().trim()
    return processingEvents.filter((e) => {
      const titleMatch = e.title.toLowerCase().includes(q)
      const descMatch = e.description.toLowerCase().includes(q)
      const sectorMatch = e.sectorId && worldState.sectors[e.sectorId]?.name.toLowerCase().includes(q)
      const catMatch = e.category.toLowerCase().includes(q)
      return titleMatch || descMatch || sectorMatch || catMatch
    })
  }, [processingEvents, searchQuery, worldState.sectors])

  const filteredChains = useMemo(() => {
    if (!searchQuery.trim()) return activeMissionChains
    const q = searchQuery.toLowerCase().trim()
    return activeMissionChains.filter((c) => {
      const titleMatch = c.title.toLowerCase().includes(q)
      const descMatch = c.description.toLowerCase().includes(q)
      const topMatch = c.topology.toLowerCase().includes(q)
      return titleMatch || descMatch || topMatch
    })
  }, [activeMissionChains, searchQuery])

  // Sự kiện đang được chọn
  const activeSelectedInitEvent = useMemo(() => {
    if (!selectedInitEventId) return null
    return initEvents.find((e) => e.id === selectedInitEventId) || null
  }, [selectedInitEventId, initEvents])

  const activeSelectedProcessingEvent = useMemo(() => {
    if (!selectedProcessingEventId) return null
    return processingEvents.find((e) => e.id === selectedProcessingEventId) || null
  }, [selectedProcessingEventId, processingEvents])

  const activeSelectedChain = useMemo(() => {
    if (!selectedChainId) return null
    return activeMissionChains.find((c) => c.id === selectedChainId) || null
  }, [selectedChainId, activeMissionChains])

  // Helper hiển thị icon theo loại sự kiện
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "crisis":
        return <ShieldAlert className="size-3.5 text-rose-400" />
      case "military":
        return <Swords className="size-3.5 text-amber-400" />
      case "logistics":
        return <Truck className="size-3.5 text-indigo-400" />
      case "diplomacy":
        return <Globe2 className="size-3.5 text-emerald-400" />
      case "anomaly":
        return <Sparkles className="size-3.5 text-purple-400" />
      case "civil":
        return <Wheat className="size-3.5 text-amber-300" />
      case "intel":
        return <Database className="size-3.5 text-cyan-400" />
      default:
        return <Flame className="size-3.5 text-yellow-400" />
    }
  }

  // Helper tính Urgency Badge
  const getUrgencyBadge = (event: WorldEvent) => {
    const daysRemaining = Math.max(0, event.decisionDeadlineTick - worldState.currentDay)
    const isCriticalSeverity = event.severity === "critical"
    const isExpiringUrgent = daysRemaining <= 1

    if (isExpiringUrgent || isCriticalSeverity) {
      return {
        label:
          daysRemaining === 0
            ? "HẾT HẠN HÔM NAY"
            : daysRemaining === 1
            ? "CÒN 1 NGÀY"
            : "TỐI NGUY (CRITICAL)",
        classes: "border-red-500/80 bg-red-950/70 text-red-200 animate-pulse font-bold shadow-sm shadow-red-950/50",
        icon: <AlertOctagon className="size-3 text-red-400 shrink-0" />,
        isUrgent: true,
        daysRemaining,
      }
    }

    if (event.severity === "warning" || daysRemaining <= 2) {
      return {
        label: `CÒN ${daysRemaining} NGÀY`,
        classes: "border-amber-500/70 bg-amber-950/50 text-amber-200 font-semibold",
        icon: <AlertTriangle className="size-3 text-amber-400 shrink-0" />,
        isUrgent: false,
        daysRemaining,
      }
    }

    return {
      label: `CÒN ${daysRemaining} NGÀY`,
      classes: "border-zinc-700 bg-zinc-900 text-zinc-300",
      icon: <Clock className="size-3 text-zinc-400 shrink-0" />,
      isUrgent: false,
      daysRemaining,
    }
  }

  return (
    <div className="space-y-3.5 font-mono text-xs">
      {/* ====================================================================
          1. HEADER BÀN CHỈ HUY CHIẾN LƯỢC & ĐIỀU HƯỚNG 3 CHẾ ĐỘ
          ==================================================================== */}
      <div className="rounded border border-zinc-800 bg-zinc-950/90 p-3.5 backdrop-blur-md shadow-lg shadow-zinc-950/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-sm">
              <Crosshair className="size-4 text-cyan-400" />
              <span>BÀN CHỈ HUY SỰ KIỆN & NHIỆM VỤ // COMMAND DESK</span>
            </div>
            <p className="mt-0.5 text-zinc-400 text-[11px] leading-relaxed">
              Trung tâm chỉ huy tác chiến 3 chế độ: Phê chuẩn khẩn cấp [INIT], Giám sát tiến độ [PROCESSING] và Điều phối tuyến nhiệm vụ [CHAINS].
            </p>
          </div>

          {/* Quick Shortcuts & Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateToResults?.()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-purple-500/40 bg-purple-950/30 text-purple-200 hover:text-white hover:border-purple-400 transition-colors cursor-pointer text-[11px] font-semibold"
              title="Mở Khay Báo Cáo Tình Báo / Debriefing Drawer"
            >
              <Layers className="size-3 text-purple-400" />
              <span>Khay Báo Cáo Tình Báo</span>
              <ExternalLink className="size-2.5 ml-0.5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Thanh Điều Hướng Cấp 1: 3 Chế Độ (Tabs) + Tìm Kiếm */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 border-t border-zinc-800/80 pt-2.5 text-[11px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-zinc-500 font-bold uppercase mr-1 text-[10px]">Chế độ chỉ huy:</span>

            {/* TAB 1: Cần Quyết Định [INIT] */}
            <button
              type="button"
              onClick={() => {
                playClickSound()
                setCommandMode("init")
              }}
              className={cn(
                "px-3 py-1.5 rounded border transition-all cursor-pointer flex items-center gap-2 text-[11px] font-bold",
                commandMode === "init"
                  ? "border-amber-400 bg-amber-950/70 text-amber-200 shadow-md shadow-amber-950/40 ring-1 ring-amber-400/50"
                  : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              )}
            >
              <AlertCircle className={cn("size-3.5", initEvents.length > 0 ? "text-amber-400 animate-pulse" : "text-zinc-500")} />
              <span>CẦN QUYẾT ĐỊNH [INIT]</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded text-[10px] font-mono",
                  initEvents.length > 0
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-zinc-800 text-zinc-500"
                )}
              >
                {initEvents.length}
              </span>
            </button>

            {/* TAB 2: Đang Triển Khai [PROCESSING] */}
            <button
              type="button"
              onClick={() => {
                playClickSound()
                setCommandMode("processing")
              }}
              className={cn(
                "px-3 py-1.5 rounded border transition-all cursor-pointer flex items-center gap-2 text-[11px] font-bold",
                commandMode === "processing"
                  ? "border-cyan-400 bg-cyan-950/70 text-cyan-200 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-400/50"
                  : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              )}
            >
              <Clock className={cn("size-3.5", processingEvents.length > 0 ? "text-cyan-400" : "text-zinc-500")} />
              <span>ĐANG TRIỂN KHAI [PROCESSING]</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded text-[10px] font-mono",
                  processingEvents.length > 0
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-zinc-800 text-zinc-500"
                )}
              >
                {processingEvents.length}
              </span>
            </button>

            {/* TAB 3: Chuỗi Nhiệm Vụ [CHAINS] */}
            <button
              type="button"
              onClick={() => {
                playClickSound()
                setCommandMode("chains")
              }}
              className={cn(
                "px-3 py-1.5 rounded border transition-all cursor-pointer flex items-center gap-2 text-[11px] font-bold",
                commandMode === "chains"
                  ? "border-indigo-400 bg-indigo-950/70 text-indigo-200 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-400/50"
                  : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              )}
            >
              <GitBranch className="size-3.5 text-indigo-400" />
              <span>CHUỖI NHIỆM VỤ [CHAINS]</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                {activeMissionChains.length}/8
              </span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative flex items-center">
            <Search className="size-3 text-zinc-500 absolute left-2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lọc sự kiện, sector, từ khóa..."
              className="rounded border border-zinc-800 bg-zinc-900/80 pl-7 pr-2 py-1 text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 w-44 sm:w-56"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-1.5 text-zinc-400 hover:text-white"
              >
                <X className="size-2.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ====================================================================
          2. BANNER TỔNG HỢP BIẾN ĐỘNG CHU KỲ (TICK LIFECYCLE SUMMARY)
          ==================================================================== */}
      {lastEventsSummary &&
        dismissedTickSummary !== worldState.currentDay &&
        (lastEventsSummary.autoLockedCount > 0 || lastEventsSummary.resolvedCount > 0) && (
          <div className="rounded border border-indigo-500/50 bg-indigo-950/40 p-3 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-indigo-400 animate-pulse" />
                <span className="font-bold text-indigo-200 text-xs uppercase tracking-wide">
                  TỔNG HỢP BIẾN ĐỘNG VÒNG ĐỜI SỰ KIỆN TẠI NGÀY #{worldState.currentDay}
                </span>
                <span className="rounded bg-indigo-900/60 px-1.5 py-0.2 text-[10px] text-indigo-300 border border-indigo-600/40">
                  {lastEventsSummary.resolvedCount} Hoàn Tất · {lastEventsSummary.autoLockedCount} Tự Động Khóa
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDismissedTickSummary(worldState.currentDay)}
                className="text-zinc-400 hover:text-white"
                title="Đóng thông báo"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div className="rounded border border-amber-500/30 bg-amber-950/20 p-2 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[10px] uppercase">
                  <Clock className="size-3 text-amber-400" />
                  <span>Sự Kiện Tự Động Khóa Phương Án Mặc Định ({lastEventsSummary.autoLockedCount})</span>
                </div>
                {lastEventsSummary.autoLockedEvents.length === 0 ? (
                  <div className="text-zinc-500 text-[10px]">Không có sự kiện nào bị quá hạn tự động khóa.</div>
                ) : (
                  lastEventsSummary.autoLockedEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-center justify-between bg-zinc-900/60 p-1.5 rounded border border-zinc-800/80 text-[10px]"
                    >
                      <span className="font-semibold text-zinc-200 truncate mr-2">{evt.title}</span>
                      <span className="text-amber-400 shrink-0 font-mono">
                        {evt.strategyId}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="rounded border border-emerald-500/30 bg-emerald-950/20 p-2 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300 text-[10px] uppercase">
                  <CheckCircle2 className="size-3 text-emerald-400" />
                  <span>Sự Kiện Đã Giải Quyết Xong ({lastEventsSummary.resolvedCount})</span>
                </div>
                {lastEventsSummary.resolvedEvents.length === 0 ? (
                  <div className="text-zinc-500 text-[10px]">Không có sự kiện nào vừa hoàn tất trong tick này.</div>
                ) : (
                  lastEventsSummary.resolvedEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-center justify-between bg-zinc-900/60 p-1.5 rounded border border-zinc-800/80 text-[10px]"
                    >
                      <span className="font-semibold text-zinc-200 truncate mr-2">{evt.title}</span>
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded font-bold uppercase text-[9px] shrink-0 border",
                          evt.status === "success"
                            ? "border-emerald-500/40 bg-emerald-950/60 text-emerald-300"
                            : evt.status === "expired_default"
                            ? "border-amber-500/40 bg-amber-950/60 text-amber-300"
                            : "border-red-500/40 bg-red-950/60 text-red-300"
                        )}
                      >
                        {evt.status === "success" ? "Thành Công" : evt.status === "expired_default" ? "Mặc Định" : "Thất Bại"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      {/* ====================================================================
          3. CHẾ ĐỘ A: CẦN QUYẾT ĐỊNH [INIT]
          ==================================================================== */}
      {commandMode === "init" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* CỘT TRÁI (4 CỘT): Hàng Đợi Sự Kiện Khẩn Cấp (Thu gọn hợp lý để dành không gian cho Decision Panel) */}
          <div className="lg:col-span-4 flex flex-col rounded border border-zinc-800 bg-zinc-950/90 shadow-xl overflow-hidden min-h-[540px] max-h-[720px]">
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-900/70 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-3.5 text-amber-400" />
                <span className="font-bold uppercase tracking-wider text-zinc-200 text-xs">
                  SỰ KIỆN CHỜ PHÊ CHUẨN
                </span>
                <span className="rounded bg-black/60 px-1.5 py-0.2 text-[10px] text-amber-300 border border-zinc-700 font-mono">
                  {filteredInitEvents.length}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500">Hạn chót gần nhất</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 pr-1.5 scrollbar-thin">
              {filteredInitEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-2">
                  <CheckCircle2 className="size-8 text-emerald-500/50" />
                  <div className="font-bold text-zinc-300">Không có sự kiện nào cần quyết định.</div>
                  <p className="text-[10px] text-zinc-500 max-w-xs">
                    Tất cả sự kiện đều đã được xử lý hoặc đang trong tiến trình triển khai an toàn.
                  </p>
                </div>
              ) : (
                filteredInitEvents.map((event) => {
                  const isSelected = selectedInitEventId === event.id
                  const urgency = getUrgencyBadge(event)
                  const targetSector = event.sectorId ? worldState.sectors[event.sectorId] : null

                  return (
                    <div
                      key={event.id}
                      onClick={() => {
                        playClickSound()
                        setSelectedInitEventId(event.id)
                        onSelectEvent?.(event.id)
                      }}
                      className={cn(
                        "rounded border p-2.5 transition-all cursor-pointer relative text-left group",
                        isSelected
                          ? "border-amber-400 bg-amber-950/30 ring-1 ring-amber-500/60 shadow-md shadow-amber-950/40"
                          : urgency.isUrgent
                          ? "border-red-500/60 bg-red-950/20 hover:border-red-400 hover:bg-red-950/30"
                          : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute left-0 top-0 bottom-0 w-1 rounded-l transition-colors",
                          isSelected
                            ? "bg-amber-400"
                            : urgency.isUrgent
                            ? "bg-red-500 animate-pulse"
                            : "bg-amber-500/80"
                        )}
                      />

                      <div className="pl-1.5 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[10px]">
                          <span className="flex items-center gap-1 font-bold text-zinc-300 uppercase">
                            {getCategoryIcon(event.category)}
                            <span>{event.category}</span>
                          </span>

                          <span
                            className={cn(
                              "flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] border",
                              urgency.classes
                            )}
                          >
                            {urgency.icon}
                            <span>{urgency.label}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={cn(
                              "font-bold text-xs truncate",
                              isSelected ? "text-amber-200" : "text-zinc-100 group-hover:text-amber-300"
                            )}
                          >
                            {event.title}
                          </span>
                          {isSelected && (
                            <span className="text-[9px] text-amber-400 uppercase font-black shrink-0 flex items-center gap-0.5">
                              <span>ĐANG XEM</span>
                              <ChevronRight className="size-2.5" />
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-zinc-400 pt-0.5">
                          <div className="flex items-center gap-1 truncate max-w-[160px]">
                            {targetSector ? (
                              <>
                                <MapPin className="size-2.5 text-zinc-500 shrink-0" />
                                <span className="truncate">{targetSector.name}</span>
                              </>
                            ) : (
                              <>
                                <Globe2 className="size-2.5 text-zinc-500 shrink-0" />
                                <span>Toàn Vũ Trụ</span>
                              </>
                            )}
                          </div>

                          <span className="font-mono text-[9px] text-zinc-400">
                            Hạn: Ngày #{event.decisionDeadlineTick}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* CỘT PHẢI (8 CỘT): DECISION PANEL TẬP TRUNG MỤC TIÊU & SO SÁNH 2-3 PHƯƠNG ÁN */}
          <div className="lg:col-span-8 flex flex-col rounded border border-zinc-800 bg-zinc-950/90 shadow-xl overflow-hidden min-h-[540px] max-h-[720px]">
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/70 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-amber-400" />
                <span className="font-bold uppercase tracking-wider text-zinc-200 text-xs">
                  BẢNG QUYẾT ĐỊNH & PHÊ CHUẨN CHIẾN LƯỢC // DECISION PANEL
                </span>
              </div>
              {activeSelectedInitEvent && (
                <span className="font-mono text-[10px] text-zinc-400">
                  MÃ SỰ KIỆN: {activeSelectedInitEvent.id}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 pr-2.5 scrollbar-thin">
              {!activeSelectedInitEvent ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[420px] text-center p-8 space-y-3">
                  <div className="rounded-full bg-zinc-900 p-4 border border-zinc-800 text-zinc-600">
                    <Crosshair className="size-10 text-zinc-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-zinc-300 text-sm tracking-wide">
                      CHƯA CHỌN SỰ KIỆN NÀO
                    </div>
                    <p className="text-[11px] text-zinc-500 max-w-sm leading-relaxed">
                      Chọn một sự kiện từ danh sách bên trái để xem mục tiêu, bối cảnh và so sánh các phương án đối ứng.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Khối Bối Cảnh & Mục Tiêu */}
                  <div className="space-y-2.5 rounded border border-zinc-800 bg-zinc-900/50 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                            activeSelectedInitEvent.severity === "critical"
                              ? "border-red-500 bg-red-950/70 text-red-200 animate-pulse"
                              : activeSelectedInitEvent.severity === "warning"
                              ? "border-amber-500 bg-amber-950/60 text-amber-200"
                              : "border-zinc-700 bg-zinc-800 text-zinc-300"
                          )}
                        >
                          {activeSelectedInitEvent.severity === "critical"
                            ? "TỐI NGUY"
                            : activeSelectedInitEvent.severity === "warning"
                            ? "CẢNH BÁO"
                            : "THÔNG TIN"}
                        </span>

                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-bold uppercase">
                          {getCategoryIcon(activeSelectedInitEvent.category)}
                          <span>{activeSelectedInitEvent.category}</span>
                        </span>

                        {activeSelectedInitEvent.tier && (
                          <span className="px-2 py-0.5 rounded bg-black/60 border border-zinc-700 text-cyan-300 text-[10px] font-mono uppercase">
                            Quy Mô: {activeSelectedInitEvent.tier}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/50 text-amber-300 text-[10px]">
                        <Clock className="size-3 text-amber-400" />
                        <span>
                          Hạn chót: Ngày #{activeSelectedInitEvent.decisionDeadlineTick} (Còn{" "}
                          {Math.max(0, activeSelectedInitEvent.decisionDeadlineTick - worldState.currentDay)} ngày)
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-zinc-100">{activeSelectedInitEvent.title}</h3>
                      <p className="mt-1 text-[11px] text-zinc-300 leading-relaxed bg-black/40 p-2.5 rounded border border-zinc-800">
                        {activeSelectedInitEvent.description}
                      </p>
                    </div>

                    {activeSelectedInitEvent.sectorId && worldState.sectors[activeSelectedInitEvent.sectorId] && (
                      (() => {
                        const sec = worldState.sectors[activeSelectedInitEvent.sectorId]
                        return (
                          <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-950/60 p-2 rounded border border-zinc-800/80 text-[10px]">
                            <div className="flex items-center gap-2">
                              <MapPin className="size-3 text-cyan-400 shrink-0" />
                              <span>Sector: <strong className="text-zinc-200">{sec.name}</strong></span>
                              <span className="text-zinc-500">·</span>
                              <span>Chủ quyền: <strong className="text-cyan-300">{sec.sovereignty}</strong></span>
                              <span className="text-zinc-500">·</span>
                              <span>Ổn định: <strong className="text-emerald-400">{sec.stability}%</strong></span>
                              <span className="text-zinc-500">·</span>
                              <span>Đe dọa: <strong className="text-amber-400">{sec.threatLevel}/1000</strong></span>
                            </div>

                            <button
                              type="button"
                              onClick={() => onNavigateToSector?.(sec.id)}
                              className="text-cyan-400 hover:text-cyan-200 underline cursor-pointer text-[10px]"
                            >
                              Xem trên bản đồ &rarr;
                            </button>
                          </div>
                        )
                      })()
                    )}

                    {/* Cảnh báo tự động khóa phương án mặc định */}
                    {(() => {
                      const defStrat = activeSelectedInitEvent.availableStrategies.find(
                        (s) => s.id === activeSelectedInitEvent.defaultStrategyId
                      )
                      if (!defStrat) return null
                      return (
                        <div className="flex items-start gap-2 rounded bg-amber-950/20 border border-amber-500/30 p-2 text-[10px] text-amber-200">
                          <AlertTriangle className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <div className="leading-tight">
                            <span className="font-bold text-amber-300">CẢNH BÁO TỰ ĐỘNG KHÓA:</span> Nếu không phê chuẩn trước hạn chót, hệ thống sẽ tự động kích hoạt phương án mặc định:{" "}
                            <strong className="text-amber-100 underline">[{defStrat.name}]</strong>.
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* So Sánh 2-3 Phương Án Chiến Lược */}
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                      <span className="font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                        <Zap className="size-3.5 text-cyan-400" />
                        <span>SO SÁNH CÁC PHƯƠNG ÁN CHIẾN LƯỢC ({activeSelectedInitEvent.availableStrategies.length})</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          playClickSound()
                          const dec = evaluateAndApplyEventStrategyPolicy(worldState, activeSelectedInitEvent)
                          if (dec.applied) {
                            playShieldSound()
                            onStateUpdated?.()
                          }
                        }}
                        className="flex items-center gap-1.5 rounded bg-cyan-950/80 border border-cyan-500/60 px-2.5 py-1 text-[10px] text-cyan-300 hover:bg-cyan-900 transition-colors cursor-pointer font-bold shadow-sm shadow-cyan-950"
                        title="Tự động phê chuẩn theo System Auto Strategy"
                      >
                        <Sparkles className="size-3 text-cyan-400" />
                        <span>⚡ System Auto Phê Chuẩn Ngay</span>
                      </button>
                    </div>

                    {(() => {
                      const bestCandidate = selectBestStrategyForEvent(worldState, activeSelectedInitEvent)

                      return (
                        <div className="space-y-3">
                          {activeSelectedInitEvent.availableStrategies.map((strat) => {
                            const isDefault = strat.id === activeSelectedInitEvent.defaultStrategyId
                            const isBest = bestCandidate?.strategy.id === strat.id
                            const scoreInfo = scoreEventStrategy(worldState, activeSelectedInitEvent, strat)
                            const validation = validateStrategyExecution(worldState, activeSelectedInitEvent, strat)
                            const canAfford = validation.valid
                            const reasonKey = `${activeSelectedInitEvent.id}_${strat.id}`
                            const isExpanded = !!expandedReasonKeys[reasonKey]
                            const hasCost = strat.cost && Object.keys(strat.cost).length > 0

                            return (
                              <div
                                key={strat.id}
                                className={cn(
                                  "rounded border p-3.5 space-y-3 transition-all text-left",
                                  isBest
                                    ? "border-cyan-500/70 bg-cyan-950/20 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/40"
                                    : isDefault
                                    ? "border-amber-500/60 bg-amber-950/20 shadow-sm"
                                    : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                                )}
                              >
                                {/* Header Phương Án */}
                                <div className="flex flex-wrap items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-zinc-100 text-xs sm:text-sm">{strat.name}</span>
                                    {isBest && (
                                      <span className="text-[9px] text-cyan-300 uppercase font-black bg-cyan-950/80 border border-cyan-400 px-1.5 py-0.2 rounded">
                                        ★ ĐỀ XUẤT SYSTEM AUTO
                                      </span>
                                    )}
                                    {isDefault && (
                                      <span className="text-[9px] text-amber-300 uppercase font-bold bg-amber-950/70 border border-amber-500/60 px-1.5 py-0.2 rounded">
                                        MẶC ĐỊNH
                                      </span>
                                    )}
                                  </div>

                                  {/* Thời gian thực thi */}
                                  <span className="text-zinc-400 font-mono text-[10px]">
                                    Thời gian: <strong className="text-cyan-300">{strat.processingTicks} ngày</strong>
                                  </span>
                                </div>

                                <p className="text-[11px] text-zinc-300 leading-relaxed bg-black/30 p-2.5 rounded border border-zinc-800/80">
                                  {strat.description}
                                </p>

                                {/* Bảng Tác Động Chiến Lược Thực Tế */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-zinc-950/70 p-2.5 rounded border border-zinc-800">
                                  <div>
                                    <span className="text-zinc-500 block">Độ ổn định:</span>
                                    <span
                                      className={cn(
                                        "font-bold",
                                        (strat.consequences?.stabilityDelta ?? 0) > 0
                                          ? "text-emerald-400"
                                          : (strat.consequences?.stabilityDelta ?? 0) < 0
                                          ? "text-red-400"
                                          : "text-zinc-400"
                                      )}
                                    >
                                      {(strat.consequences?.stabilityDelta ?? 0) > 0 ? "+" : ""}
                                      {strat.consequences?.stabilityDelta ?? 0}
                                    </span>
                                  </div>

                                  <div>
                                    <span className="text-zinc-500 block">Mức đe dọa:</span>
                                    <span
                                      className={cn(
                                        "font-bold",
                                        (strat.consequences?.threatDelta ?? 0) < 0
                                          ? "text-emerald-400"
                                          : (strat.consequences?.threatDelta ?? 0) > 0
                                          ? "text-red-400"
                                          : "text-zinc-400"
                                      )}
                                    >
                                      {(strat.consequences?.threatDelta ?? 0) > 0 ? "+" : ""}
                                      {strat.consequences?.threatDelta ?? 0}
                                    </span>
                                  </div>

                                  {/* Hiển thị tỷ lệ thành công chỉ khi template thực sự định nghĩa xác suất có ý nghĩa */}
                                  <div>
                                    <span className="text-zinc-500 block">Xác suất thành công:</span>
                                    <span
                                      className={cn(
                                        "font-bold",
                                        strat.successChance !== undefined && strat.successChance < 100
                                          ? strat.successChance >= 70
                                            ? "text-emerald-400"
                                            : "text-amber-400"
                                          : "text-cyan-300"
                                      )}
                                    >
                                      {strat.successChance !== undefined ? `${strat.successChance}%` : "100% (Xác định)"}
                                    </span>
                                  </div>

                                  <div>
                                    <span className="text-zinc-500 block">Yêu cầu tác chiến:</span>
                                    <span className="font-bold text-zinc-300">
                                      {strat.requiresCombat ? "Buồng Lái Arena" : "Tự Động Hóa"}
                                    </span>
                                  </div>
                                </div>

                                {/* Chi Phí & Điều Kiện Quân Dự Bị */}
                                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] pt-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-zinc-400">Chi phí & Lực lượng:</span>
                                    {!hasCost && (!strat.militaryCost || strat.militaryCost === 0) ? (
                                      <span className="text-emerald-400 font-bold">Không tiêu hao</span>
                                    ) : (
                                      <>
                                        {hasCost &&
                                          Object.entries(strat.cost!).map(([k, v]) => {
                                            const currentVal = (worldState.resources as any)[k] ?? 0
                                            const enough = currentVal >= (v as number)
                                            return (
                                              <span
                                                key={k}
                                                className={cn(
                                                  "px-1.5 py-0.5 rounded border font-mono font-bold",
                                                  enough
                                                    ? "border-zinc-700 bg-zinc-800 text-amber-300"
                                                    : "border-red-500/60 bg-red-950/60 text-red-300 animate-pulse"
                                                )}
                                                title={`Hiện có: ${currentVal}`}
                                              >
                                                {k}: {v}
                                              </span>
                                            )
                                          })}
                                        {strat.militaryCost && strat.militaryCost > 0 && (
                                          <span
                                            className={cn(
                                              "px-1.5 py-0.5 rounded border font-mono font-bold",
                                              worldState.military.reserves >= strat.militaryCost
                                                ? "border-amber-700/60 bg-amber-950/40 text-amber-300"
                                                : "border-red-500/60 bg-red-950/60 text-red-300 animate-pulse"
                                            )}
                                            title={`Quân dự bị hiện có: ${worldState.military.reserves}`}
                                          >
                                            Quân lực: {strat.militaryCost}
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </div>

                                  {/* Nút Xem Công Thức / Điểm Số (Ẩn khỏi giao diện chính nhưng vẫn xem được khi cần) */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedReasonKeys((prev) => ({
                                        ...prev,
                                        [reasonKey]: !prev[reasonKey],
                                      }))
                                    }
                                    className="text-zinc-400 hover:text-cyan-300 transition-colors flex items-center gap-1 text-[10px] cursor-pointer"
                                  >
                                    <Info className="size-3 text-cyan-400" />
                                    <span>
                                      {isExpanded
                                        ? "Ẩn công thức chấm điểm"
                                        : `Điểm chiến lược: ${scoreInfo.score > 0 ? `+${scoreInfo.score}` : scoreInfo.score}đ (Chi tiết)`}
                                    </span>
                                  </button>
                                </div>

                                {/* Chi Tiết Điểm Số Nếu Bật */}
                                {isExpanded && (
                                  <div className="rounded bg-black/60 p-2.5 border border-zinc-800 text-[10px] space-y-1 text-zinc-300 animate-fadeIn">
                                    <div className="font-bold text-cyan-400 uppercase text-[9px] flex items-center justify-between">
                                      <span>Hệ số đánh giá chiến lược:</span>
                                      <span className="font-mono text-cyan-300">{scoreInfo.score} Điểm</span>
                                    </div>
                                    {scoreInfo.reasons.map((r, rIdx) => (
                                      <div key={rIdx} className="leading-tight text-zinc-400">
                                        • {r}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Lỗi thiếu tài nguyên/quân */}
                                {!canAfford && validation.reason && (
                                  <div className="text-[10px] text-red-400 bg-red-950/40 p-2 rounded border border-red-500/40 flex items-center gap-1.5">
                                    <AlertOctagon className="size-3 text-red-400 shrink-0" />
                                    <span>{validation.reason}</span>
                                  </div>
                                )}

                                {/* Nút Phê Chuẩn */}
                                <div className="pt-1">
                                  <button
                                    type="button"
                                    disabled={!canAfford}
                                    onClick={() => {
                                      playClickSound()
                                      onChooseStrategy(activeSelectedInitEvent.id, strat.id)
                                    }}
                                    className={cn(
                                      "w-full py-2.5 px-4 rounded text-xs font-bold transition-all text-center cursor-pointer",
                                      !canAfford
                                        ? "border border-zinc-800 bg-zinc-900 text-zinc-500 cursor-not-allowed"
                                        : isBest
                                        ? "border border-cyan-400 bg-cyan-600/30 text-cyan-200 hover:bg-cyan-600/50 hover:text-white shadow-md shadow-cyan-950/60"
                                        : isDefault
                                        ? "border border-amber-500/80 bg-amber-950/60 text-amber-200 hover:bg-amber-900/60 hover:text-white"
                                        : "border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white"
                                    )}
                                  >
                                    {!canAfford
                                      ? "Thiếu Tài Nguyên Hoặc Quân Dự Bị Để Thực Thi"
                                      : isBest
                                      ? "Phê Chuẩn Phương Án Đề Xuất Này"
                                      : "Phê Chuẩn Phương Án Này"}
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          4. CHẾ ĐỘ B: ĐANG TRIỂN KHAI [PROCESSING] (THEO DÕI TIẾN TRÌNH THỰC TẾ)
          ==================================================================== */}
      {commandMode === "processing" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* CỘT TRÁI (4 CỘT): Danh sách sự kiện đang thực thi */}
          <div className="lg:col-span-4 flex flex-col rounded border border-cyan-500/30 bg-zinc-950/90 shadow-xl overflow-hidden min-h-[540px] max-h-[720px]">
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-900/70 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 text-cyan-400" />
                <span className="font-bold uppercase tracking-wider text-cyan-200 text-xs">
                  SỰ KIỆN ĐANG TRIỂN KHAI
                </span>
                <span className="rounded bg-black/60 px-1.5 py-0.2 text-[10px] text-cyan-300 border border-zinc-700 font-mono">
                  {filteredProcessingEvents.length}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500">Giám sát tiến độ</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 pr-1.5 scrollbar-thin">
              {filteredProcessingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-2">
                  <Clock className="size-8 text-zinc-600" />
                  <div className="font-bold text-zinc-300">Không có sự kiện nào đang xử lý.</div>
                  <p className="text-[10px] text-zinc-500 max-w-xs">
                    Hiện không có phương án chiến lược nào đang chạy trong thiên hà.
                  </p>
                </div>
              ) : (
                filteredProcessingEvents.map((event) => {
                  const isSelected = selectedProcessingEventId === event.id
                  const startTick = event.processingStartedTick || event.createdAtTick
                  const completeTick = event.processingCompletesTick || event.decisionDeadlineTick
                  const totalTicks = Math.max(1, completeTick - startTick)
                  const elapsedTicks = Math.max(0, worldState.currentDay - startTick)
                  const progressPct = Math.min(100, Math.round((elapsedTicks / totalTicks) * 100))
                  const targetSector = event.sectorId ? worldState.sectors[event.sectorId] : null
                  const chosenStrat = event.availableStrategies.find((s) => s.id === event.chosenStrategyId)

                  return (
                    <div
                      key={event.id}
                      onClick={() => {
                        playClickSound()
                        setSelectedProcessingEventId(event.id)
                      }}
                      className={cn(
                        "rounded border p-2.5 transition-all cursor-pointer relative text-left group",
                        isSelected
                          ? "border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-500/60 shadow-md shadow-cyan-950/40"
                          : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute left-0 top-0 bottom-0 w-1 rounded-l transition-colors",
                          isSelected ? "bg-cyan-400" : "bg-cyan-600/70"
                        )}
                      />

                      <div className="pl-1.5 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[10px]">
                          <span className="flex items-center gap-1 font-bold text-zinc-300 uppercase">
                            {getCategoryIcon(event.category)}
                            <span>{event.category}</span>
                          </span>

                          <span className="rounded bg-cyan-950/80 border border-cyan-500/60 px-1.5 py-0.2 text-[9px] text-cyan-300 font-bold font-mono">
                            {progressPct}% · Ngày #{completeTick}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={cn(
                              "font-bold text-xs truncate",
                              isSelected ? "text-cyan-200" : "text-zinc-100 group-hover:text-cyan-300"
                            )}
                          >
                            {event.title}
                          </span>
                          {isSelected && (
                            <span className="text-[9px] text-cyan-400 uppercase font-black shrink-0 flex items-center gap-0.5">
                              <span>ĐANG THEO DÕI</span>
                              <ChevronRight className="size-2.5" />
                            </span>
                          )}
                        </div>

                        {/* Thanh mini progress */}
                        <div className="h-1.5 w-full rounded bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-cyan-400 transition-all duration-300 rounded"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-zinc-400 pt-0.5">
                          <span className="truncate max-w-[140px]">
                            {targetSector ? targetSector.name : "Toàn Vũ Trụ"}
                          </span>
                          <span className="truncate max-w-[140px] text-zinc-300 font-semibold">
                            {chosenStrat?.name || event.chosenStrategyId}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* CỘT PHẢI (8 CỘT): BẢNG GIÁM SÁT TIẾN TRÌNH & THỰC THI (KHÔNG CÓ NÚT PHÊ CHUẨN) */}
          <div className="lg:col-span-8 flex flex-col rounded border border-cyan-500/30 bg-zinc-950/90 shadow-xl overflow-hidden min-h-[540px] max-h-[720px]">
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/70 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 text-cyan-400" />
                <span className="font-bold uppercase tracking-wider text-cyan-200 text-xs">
                  TRẠM THEO DÕI TIẾN TRÌNH CHIẾN LƯỢC // EXECUTION MONITOR
                </span>
              </div>
              {activeSelectedProcessingEvent && (
                <span className="font-mono text-[10px] text-zinc-400">
                  MÃ SỰ KIỆN: {activeSelectedProcessingEvent.id}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 pr-2.5 scrollbar-thin">
              {!activeSelectedProcessingEvent ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[420px] text-center p-8 space-y-3">
                  <div className="rounded-full bg-zinc-900 p-4 border border-zinc-800 text-zinc-600">
                    <Clock className="size-10 text-zinc-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-zinc-300 text-sm tracking-wide">
                      CHƯA CHỌN SỰ KIỆN ĐANG TRIỂN KHAI
                    </div>
                    <p className="text-[11px] text-zinc-500 max-w-sm leading-relaxed">
                      Chọn một sự kiện từ danh sách bên trái để theo dõi tiến độ thực thi, dự kiến hoàn tất và các tác động chiến lược.
                    </p>
                  </div>
                </div>
              ) : (
                (() => {
                  const event = activeSelectedProcessingEvent
                  const chosenStrat = event.availableStrategies.find((s) => s.id === event.chosenStrategyId)
                  const startTick = event.processingStartedTick || event.createdAtTick
                  const completeTick = event.processingCompletesTick || event.decisionDeadlineTick
                  const totalTicks = Math.max(1, completeTick - startTick)
                  const elapsedTicks = Math.max(0, worldState.currentDay - startTick)
                  const progressPct = Math.min(100, Math.round((elapsedTicks / totalTicks) * 100))
                  const remainingTicks = Math.max(0, completeTick - worldState.currentDay)
                  const targetSector = event.sectorId ? worldState.sectors[event.sectorId] : null

                  return (
                    <div className="space-y-4">
                      {/* Thẻ Header */}
                      <div className="rounded border border-cyan-500/40 bg-zinc-900/60 p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-cyan-500/50 bg-cyan-950/70 text-cyan-200">
                              ĐANG TRIỂN KHAI (PROCESSING)
                            </span>
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/60 border border-zinc-700 text-zinc-300">
                              {event.strategySource === "system_auto"
                                ? "Nguồn: System Auto"
                                : event.strategySource === "default_fallback"
                                ? "Nguồn: Tự Động Khóa Mặc Định"
                                : "Nguồn: Chỉ Huy Phê Chuẩn"}
                            </span>
                          </div>

                          <span className="font-mono text-cyan-300 text-xs font-bold">
                            Hoàn tất vào Ngày #{completeTick} (Còn {remainingTicks} ngày)
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-zinc-100">{event.title}</h3>
                          <p className="mt-1 text-[11px] text-zinc-300 leading-relaxed bg-black/40 p-2.5 rounded border border-zinc-800">
                            {event.description}
                          </p>
                        </div>

                        {targetSector && (
                          <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-950/60 p-2 rounded border border-zinc-800/80 text-[10px]">
                            <div className="flex items-center gap-2">
                              <MapPin className="size-3 text-cyan-400 shrink-0" />
                              <span>Sector: <strong className="text-zinc-200">{targetSector.name}</strong></span>
                              <span className="text-zinc-500">·</span>
                              <span>Ổn định: <strong className="text-emerald-400">{targetSector.stability}%</strong></span>
                              <span className="text-zinc-500">·</span>
                              <span>Đe dọa: <strong className="text-amber-400">{targetSector.threatLevel}/1000</strong></span>
                            </div>

                            <button
                              type="button"
                              onClick={() => onNavigateToSector?.(targetSector.id)}
                              className="text-cyan-400 hover:text-cyan-200 underline cursor-pointer text-[10px]"
                            >
                              Xem trên bản đồ &rarr;
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Tiến Trình Thực Thi Thực Tế */}
                      <div className="rounded border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-zinc-300 uppercase">Tiến Độ Xử Lý Thực Tế:</span>
                          <span className="font-mono font-bold text-cyan-300">{progressPct}% Hoàn Tất</span>
                        </div>

                        <div className="h-3 w-full rounded bg-zinc-800 overflow-hidden p-0.5 border border-zinc-700">
                          <div
                            className="h-full bg-cyan-400 transition-all duration-300 rounded shadow-sm shadow-cyan-400/50"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1">
                          <div className="bg-black/40 p-2 rounded border border-zinc-800">
                            <span className="text-zinc-500 block">Bắt đầu:</span>
                            <span className="font-mono text-zinc-200 font-bold">Ngày #{startTick}</span>
                          </div>
                          <div className="bg-black/40 p-2 rounded border border-zinc-800">
                            <span className="text-zinc-500 block">Thời gian xử lý:</span>
                            <span className="font-mono text-cyan-300 font-bold">{totalTicks} Ngày</span>
                          </div>
                          <div className="bg-black/40 p-2 rounded border border-zinc-800">
                            <span className="text-zinc-500 block">Dự kiến kết thúc:</span>
                            <span className="font-mono text-emerald-400 font-bold">Ngày #{completeTick}</span>
                          </div>
                        </div>
                      </div>

                      {/* Phương Án Đang Được Thực Thi & Hậu Quả Dự Kiến */}
                      <div className="rounded border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
                        <div className="font-bold uppercase text-zinc-300 text-xs flex items-center gap-1.5">
                          <Zap className="size-3.5 text-cyan-400" />
                          <span>Phương Án Đang Thực Thi: {chosenStrat?.name || event.chosenStrategyId}</span>
                        </div>

                        <p className="text-[11px] text-zinc-300 leading-relaxed bg-black/40 p-2.5 rounded border border-zinc-800">
                          {chosenStrat?.description}
                        </p>

                        {event.selectionReason && (
                          <div className="rounded bg-cyan-950/30 border border-cyan-500/30 p-2.5 text-[10px] text-cyan-200">
                            <strong>Lý do lựa chọn:</strong> {event.selectionReason}
                          </div>
                        )}

                        {event.encounterTransactionId && (
                          <div className="rounded bg-amber-950/40 border border-amber-500/50 p-2.5 text-[10px] text-amber-200 flex items-center gap-2">
                            <Swords className="size-4 text-amber-400 shrink-0" />
                            <div>
                              <strong className="block text-amber-300">Yêu cầu can thiệp chiến thuật:</strong>
                              Sự kiện đang gắn với một trận đánh thực địa (TxID: {event.encounterTransactionId}). Hãy chuyển sang buồng lái Đấu Trường để giải quyết trận đấu.
                            </div>
                          </div>
                        )}

                        {/* Không hiển thị bất kỳ nút phê chuẩn nào - Bảo vệ lũy đẳng */}
                        <div className="rounded bg-zinc-950 p-3 border border-zinc-800 text-zinc-400 text-[10px] flex items-center gap-2">
                          <Shield className="size-4 text-cyan-400 shrink-0" />
                          <span>
                            Sự kiện này đang trong giai đoạn triển khai tự động và được bảo vệ lũy đẳng (Idempotent Guard). Không thể phê chuẩn lại hoặc can thiệp kép để tránh trùng lặp giao dịch.
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          5. CHẾ ĐỘ C: CHUỖI NHIỆM VỤ [CHAINS] (TIMELINE & PIPELINE CHIẾN LƯỢC TOÀN DIỆN)
          ==================================================================== */}
      {commandMode === "chains" && (
        <div className="space-y-4">
          {/* Header & Danh Sách Tuyến Nhiệm Vụ */}
          {filteredChains.length === 0 ? (
            <div className="rounded border border-dashed border-zinc-800 bg-zinc-950/60 p-12 text-center text-zinc-500 space-y-2">
              <GitBranch className="size-8 mx-auto text-zinc-600" />
              <div className="font-bold text-zinc-300 text-sm">Không có chuỗi nhiệm vụ nào đang hoạt động.</div>
              <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                Các chuỗi nhiệm vụ chiến lược sẽ tự động mở khóa theo tiến trình ngày thiên hà và các sự kiện then chốt.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredChains.map((chain) => {
                const nodesList = Object.values(chain.nodes)
                const completedCount = nodesList.filter((n) => n.status === "completed").length
                const totalNodes = nodesList.length
                const progressFraction = `${completedCount}/${totalNodes}`
                const progressPct = totalNodes > 0 ? Math.round((completedCount / totalNodes) * 100) : 0

                return (
                  <div
                    key={chain.id}
                    className="rounded border border-indigo-500/40 bg-zinc-950/90 p-4 space-y-4 shadow-xl"
                  >
                    {/* Header Chuỗi Nhiệm Vụ */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="rounded bg-indigo-950/80 px-2.5 py-1 text-[10px] text-indigo-300 border border-indigo-500/60 uppercase font-black">
                          {chain.topology}
                        </span>
                        <div>
                          <h3 className="font-bold text-zinc-100 text-sm">{chain.title}</h3>
                          <span className="text-[10px] text-zinc-500">Mã chuỗi: {chain.id} · Bắt đầu: Ngày #{chain.startedAtTick}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-zinc-400">Tiến trình:</span>
                        <span className="rounded bg-indigo-950/60 px-2 py-0.5 border border-indigo-500/40 font-mono font-bold text-cyan-300">
                          {progressFraction} Bước ({progressPct}%)
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-300 leading-relaxed bg-black/30 p-2.5 rounded border border-zinc-800/80">
                      {chain.description}
                    </p>

                    {/* Timeline / Horizontal Stepper Pipeline */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center justify-between">
                        <span>LỘ TRÌNH TỪNG BƯỚC (MISSION PIPELINE TIMELINE):</span>
                        <span className="text-zinc-500">{nodesList.length} Nút Chiến Thuật</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {nodesList.map((node, idx) => {
                          const isActive = node.status === "active"
                          const isCompleted = node.status === "completed"
                          const isLocked = node.status === "locked"
                          const isPending = !!node.isPendingDispatch
                          const targetSector = node.sectorId ? worldState.sectors[node.sectorId] : null

                          return (
                            <div
                              key={node.id}
                              className={cn(
                                "rounded border p-3.5 flex flex-col justify-between space-y-3 transition-all relative",
                                isCompleted
                                  ? "border-emerald-500/50 bg-emerald-950/20 text-emerald-200"
                                  : isActive
                                  ? isPending
                                    ? "border-amber-500/70 bg-amber-950/25 shadow-md shadow-amber-950/30"
                                    : "border-cyan-500/70 bg-cyan-950/30 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/40"
                                  : "border-zinc-800 bg-zinc-900/30 text-zinc-500 opacity-70"
                              )}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-1 text-[10px]">
                                  <span className="font-bold uppercase text-zinc-400 font-mono">
                                    Bước {idx + 1} / {nodesList.length}
                                  </span>

                                  {isCompleted && (
                                    <span className="flex items-center gap-1 text-emerald-300 font-bold uppercase text-[9px] bg-emerald-950/80 border border-emerald-500/50 px-1.5 py-0.2 rounded">
                                      <CheckCircle2 className="size-3 text-emerald-400" />
                                      Đã Hoàn Tất
                                    </span>
                                  )}
                                  {isActive && !isPending && (
                                    <span className="flex items-center gap-1 text-cyan-300 font-bold uppercase text-[9px] bg-cyan-950/80 border border-cyan-500/60 px-1.5 py-0.2 rounded animate-pulse">
                                      <span className="size-1.5 rounded-full bg-cyan-400 animate-ping" />
                                      Đang Hoạt Động
                                    </span>
                                  )}
                                  {isPending && (
                                    <span className="flex items-center gap-1 text-amber-300 font-bold uppercase text-[9px] bg-amber-950/80 border border-amber-500/70 px-1.5 py-0.2 rounded animate-pulse">
                                      <Clock className="size-3 text-amber-400" />
                                      Đang Chờ Điều Kiện
                                    </span>
                                  )}
                                  {isLocked && (
                                    <span className="flex items-center gap-1 text-zinc-500 font-bold uppercase text-[9px]">
                                      <Lock className="size-3" />
                                      Chưa Mở Khóa
                                    </span>
                                  )}
                                </div>

                                <div className="font-bold text-zinc-100 text-xs">{node.title}</div>
                                <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                                  {node.description}
                                </p>
                              </div>

                              <div className="border-t border-zinc-800/80 pt-2.5 space-y-2 text-[10px]">
                                {targetSector && (
                                  <div className="flex items-center justify-between gap-1 text-zinc-400">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="size-3 text-cyan-400 shrink-0" />
                                      <span>Sector: <strong className="text-zinc-200">{targetSector.name}</strong></span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => onNavigateToSector?.(targetSector.id)}
                                      className="text-cyan-400 hover:text-cyan-200 underline cursor-pointer text-[9px]"
                                    >
                                      Bản đồ &rarr;
                                    </button>
                                  </div>
                                )}

                                {isPending && (
                                  <div className="rounded bg-amber-950/40 border border-amber-500/40 p-2 text-[10px] text-amber-200 space-y-1">
                                    <div className="flex items-center gap-1 font-bold text-amber-300">
                                      <AlertTriangle className="size-3 text-amber-400" />
                                      <span>Đang chờ giải tỏa điều kiện</span>
                                    </div>
                                    <p className="text-[9px] text-zinc-300 leading-tight">
                                      {node.dispatchDeferredTicks !== undefined ? (
                                        <span>Đã chờ {node.dispatchDeferredTicks}/{MAX_DISPATCH_DEFER_TICKS} ngày trước khi tự động giải tỏa.</span>
                                      ) : (
                                        <span>Nhiệm vụ đang chờ sector sẵn sàng để kích hoạt sự kiện tiếp theo.</span>
                                      )}
                                    </p>
                                  </div>
                                )}

                                {node.rewardSummary && (
                                  <div className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                                    <Sparkles className="size-2.5 text-emerald-400 shrink-0" />
                                    <span>Thưởng: {node.rewardSummary}</span>
                                  </div>
                                )}

                                {isLocked && node.requiredPreviousNodeIds && (
                                  <div className="text-[9px] text-zinc-500 italic">
                                    Yêu cầu: Hoàn tất các bước tiền đề trước
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
