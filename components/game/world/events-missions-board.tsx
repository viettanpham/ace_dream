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
import { markEventResultAsRead, type EventLifecycleSummary } from "@/lib/game/world/event-engine"
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

interface EventsMissionsBoardProps {
  worldState: WorldState
  activeEvents: WorldEvent[]
  activeMissionChains: MissionChain[]
  lastEventsSummary?: EventLifecycleSummary | null
  onChooseStrategy: (eventId: string, strategyId: string) => void
  onNavigateToResults?: () => void
  onNavigateToSector?: (sectorId: string) => void
  onStateUpdated?: () => void
}

type BoardFilterMode = "all" | "init" | "processing" | "chains" | "results"

export function EventsMissionsBoard({
  worldState,
  activeEvents,
  activeMissionChains,
  lastEventsSummary,
  onChooseStrategy,
  onNavigateToResults,
  onNavigateToSector,
  onStateUpdated,
}: EventsMissionsBoardProps) {
  const [filterMode, setFilterMode] = useState<BoardFilterMode>("all")
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dismissedTickSummary, setDismissedTickSummary] = useState<number | null>(null)
  const [expandedReasonKeys, setExpandedReasonKeys] = useState<Record<string, boolean>>({})
  const [isChainsSectionExpanded, setIsChainsSectionExpanded] = useState(true)

  // 1. Phân loại sự kiện INIT (Cần ra quyết định) - Sắp xếp theo Deadline -> Severity -> ID
  const initEvents = useMemo(() => {
    return activeEvents
      .filter((e) => e.status === "INIT")
      .sort((a, b) => {
        // Ưu tiên 1: Cấp bách thời hạn (hạn chót gần nhất lên đầu)
        const aDeadline = Math.max(0, a.decisionDeadlineTick - worldState.currentDay)
        const bDeadline = Math.max(0, b.decisionDeadlineTick - worldState.currentDay)
        if (aDeadline !== bDeadline) return aDeadline - bDeadline

        // Ưu tiên 2: Mức độ nghiêm trọng (critical > warning > info)
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

  // 3. Toàn bộ danh sách hàng đợi (Queue) lọc theo filterMode và tìm kiếm
  const queueEvents = useMemo(() => {
    let list: WorldEvent[] = []
    if (filterMode === "init") {
      list = initEvents
    } else if (filterMode === "processing") {
      list = processingEvents
    } else {
      // "all" - xếp INIT lên trước, rồi tới PROCESSING
      list = [...initEvents, ...processingEvents]
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((e) => {
        const titleMatch = e.title.toLowerCase().includes(q)
        const descMatch = e.description.toLowerCase().includes(q)
        const sectorMatch = e.sectorId && worldState.sectors[e.sectorId]?.name.toLowerCase().includes(q)
        const catMatch = e.category.toLowerCase().includes(q)
        return titleMatch || descMatch || sectorMatch || catMatch
      })
    }

    return list
  }, [filterMode, initEvents, processingEvents, searchQuery, worldState.sectors])

  // 4. Đồng bộ sự kiện đang chọn (Auto-select phần tử đầu tiên hợp lệ)
  useEffect(() => {
    if (queueEvents.length === 0) {
      setSelectedEventId(null)
      return
    }

    // Nếu ID hiện tại không có trong danh sách hiển thị, tự động chọn phần tử đầu tiên
    const exists = queueEvents.some((e) => e.id === selectedEventId)
    if (!exists) {
      setSelectedEventId(queueEvents[0].id)
    }
  }, [queueEvents, selectedEventId])

  // 5. Sự kiện đang được chọn chi tiết trong Decision Panel
  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null
    return activeEvents.find((e) => e.id === selectedEventId) || null
  }, [selectedEventId, activeEvents])

  // 6. Lịch sử kết quả gần đây từ Archive (lấy 5 bản ghi mới nhất)
  const recentResults = useMemo(() => {
    return (worldState.eventResultsArchive || []).slice(0, 5)
  }, [worldState.eventResultsArchive])

  const handleMarkResultRead = (resultId: string) => {
    playClickSound()
    markEventResultAsRead(worldState, resultId)
    onStateUpdated?.()
  }

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

  // Helper tính Urgency Badge đa tín hiệu
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
        classes: "border-red-500 bg-red-950/80 text-red-200 animate-pulse font-bold shadow-sm shadow-red-950/50",
        icon: <AlertOctagon className="size-3 text-red-400 shrink-0" />,
        isUrgent: true,
        daysRemaining,
      }
    }

    if (event.severity === "warning" || daysRemaining <= 2) {
      return {
        label: `CÒN ${daysRemaining} NGÀY`,
        classes: "border-amber-500/80 bg-amber-950/60 text-amber-200 font-semibold",
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
          1. HEADER THANH ĐIỀU PHỐI & PHÂN BỘ LỌC
          ==================================================================== */}
      <div className="rounded border border-zinc-800 bg-zinc-950/90 p-3 backdrop-blur-md shadow-lg shadow-zinc-950/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-sm">
              <Crosshair className="size-4 text-cyan-400" />
              <span>MA TRẬN QUYẾT ĐỊNH SỰ KIỆN & NHIỆM VỤ // DECISION MATRIX</span>
            </div>
            <p className="mt-0.5 text-zinc-400 text-[11px] leading-relaxed">
              Hai cột tác chiến: Hàng Đợi Khẩn Cấp (Urgency Queue) đối chiếu trực tiếp với Bảng Quyết Định & Phê Chuẩn Chiến Lược.
            </p>
          </div>

          {/* Quick Stat Counters */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px]",
                initEvents.length > 0
                  ? "border-amber-500/70 bg-amber-950/50 text-amber-300 font-bold animate-pulse"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-400"
              )}
            >
              <AlertCircle className="size-3 text-amber-400" />
              <span>Cần Quyết Định: {initEvents.length}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-cyan-500/40 bg-cyan-950/30 text-cyan-300 text-[11px]">
              <Clock className="size-3 text-cyan-400" />
              <span>Đang Xử Lý: {processingEvents.length}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-indigo-500/40 bg-indigo-950/30 text-indigo-300 text-[11px]">
              <GitBranch className="size-3 text-indigo-400" />
              <span>Chuỗi Nhiệm Vụ: {activeMissionChains.length}/8</span>
            </div>

            <button
              type="button"
              onClick={() => onNavigateToResults?.()}
              className="flex items-center gap-1 px-2.5 py-1 rounded border border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer text-[11px]"
              title="Chuyển đến Trung Tâm Kết Quả Kép để xem toàn bộ lịch sử"
            >
              <Layers className="size-3 text-purple-400" />
              <span>Dual Results Hub</span>
              <ExternalLink className="size-2.5 ml-0.5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-2.5 text-[11px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-zinc-500 font-bold uppercase mr-1 text-[10px]">Chế độ xem:</span>
            {(
              [
                { id: "all", label: `Tất Cả (${activeEvents.length})` },
                { id: "init", label: `Cần Phê Chuẩn [INIT] (${initEvents.length})`, countBadge: initEvents.length },
                { id: "processing", label: `Đang Triển Khai [PROCESSING] (${processingEvents.length})` },
                { id: "chains", label: `Cây Chuỗi Nhiệm Vụ (${activeMissionChains.length})` },
                { id: "results", label: `Báo Cáo Gần Đây (${recentResults.length})` },
              ] as Array<{ id: BoardFilterMode; label: string; countBadge?: number }>
            ).map((tab) => {
              const isTabActive = filterMode === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    playClickSound()
                    setFilterMode(tab.id)
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded border transition-colors cursor-pointer flex items-center gap-1.5 text-[11px]",
                    isTabActive
                      ? "border-cyan-400 bg-cyan-950/80 text-cyan-200 font-bold shadow-sm"
                      : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.countBadge && tab.countBadge > 0 && (
                    <span className="flex size-1.5 rounded-full bg-amber-400 animate-ping" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Quick Search in Queue */}
          <div className="relative flex items-center">
            <Search className="size-3 text-zinc-500 absolute left-2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lọc tên sự kiện, sector..."
              className="rounded border border-zinc-800 bg-zinc-900/80 pl-7 pr-2 py-0.5 text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 w-44 sm:w-56"
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
              {/* Cột 1: Tự động khóa phương án mặc định */}
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

              {/* Cột 2: Sự kiện đã giải quyết / hoàn tất */}
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
          3. DECISION MATRIX: BỐ CỤC 2 CỘT TÁC CHIẾN (CHỈ DÀNH CHO ALL / INIT / PROCESSING)
          ==================================================================== */}
      {filterMode !== "chains" && filterMode !== "results" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* ------------------------------------------------------------------
              CỘT TRÁI (5 CỘT): HÀNG ĐỢI KHẨN CẤP (URGENCY QUEUE)
              ------------------------------------------------------------------ */}
          <div className="lg:col-span-5 flex flex-col rounded border border-zinc-800 bg-zinc-950/90 shadow-xl overflow-hidden min-h-[520px] max-h-[680px]">
            {/* Header Cột Trái */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-900/70 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-3.5 text-amber-400" />
                <span className="font-bold uppercase tracking-wider text-zinc-200 text-xs">
                  HÀNG ĐỢI KHẨN CẤP
                </span>
                <span className="rounded bg-black/60 px-1.5 py-0.2 text-[10px] text-cyan-300 border border-zinc-700 font-mono">
                  {queueEvents.length}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500">Ưu tiên theo Deadline</span>
            </div>

            {/* Danh Sách Cuộn Độc Lập */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 pr-1.5 divide-y-0 scrollbar-thin">
              {queueEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-2">
                  <CheckCircle2 className="size-8 text-emerald-500/50" />
                  <div className="font-bold text-zinc-400">Không có sự kiện nào trong hàng đợi.</div>
                  <p className="text-[10px] text-zinc-500 max-w-xs">
                    Mọi khu vực thiên hà đang trong tầm kiểm soát an toàn hoặc không khớp với bộ lọc hiện tại.
                  </p>
                </div>
              ) : (
                queueEvents.map((event) => {
                  const isSelected = selectedEventId === event.id
                  const isInit = event.status === "INIT"
                  const urgency = getUrgencyBadge(event)
                  const targetSector = event.sectorId ? worldState.sectors[event.sectorId] : null
                  const defaultStrat = event.availableStrategies.find((s) => s.id === event.defaultStrategyId)
                  const chosenStrat = event.availableStrategies.find((s) => s.id === event.chosenStrategyId)

                  // Tiến trình nếu PROCESSING
                  const startTick = event.processingStartedTick || event.createdAtTick
                  const completeTick = event.processingCompletesTick || event.decisionDeadlineTick
                  const totalTicks = Math.max(1, completeTick - startTick)
                  const elapsedTicks = Math.max(0, worldState.currentDay - startTick)
                  const progressPct = Math.min(100, Math.round((elapsedTicks / totalTicks) * 100))

                  return (
                    <div
                      key={event.id}
                      onClick={() => {
                        playClickSound()
                        setSelectedEventId(event.id)
                      }}
                      className={cn(
                        "rounded border p-2.5 transition-all cursor-pointer relative text-left group",
                        isSelected
                          ? "border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-500/60 shadow-md shadow-cyan-950/40"
                          : urgency.isUrgent && isInit
                          ? "border-red-500/60 bg-red-950/20 hover:border-red-400 hover:bg-red-950/30"
                          : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70"
                      )}
                    >
                      {/* Vạch chỉ báo trạng thái cạnh trái */}
                      <div
                        className={cn(
                          "absolute left-0 top-0 bottom-0 w-1 rounded-l transition-colors",
                          isSelected
                            ? "bg-cyan-400"
                            : isInit
                            ? urgency.isUrgent
                              ? "bg-red-500 animate-pulse"
                              : "bg-amber-500"
                            : "bg-blue-400"
                        )}
                      />

                      <div className="pl-1.5 space-y-1.5">
                        {/* Hàng 1: Category + Urgency / Status + Source Badge */}
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-1 font-bold text-zinc-300 uppercase">
                              {getCategoryIcon(event.category)}
                              <span>{event.category}</span>
                            </span>

                            {/* Badge Loại / Nguồn */}
                            {isInit ? (
                              event.strategySource === "player_choice" ? (
                                <span className="rounded bg-amber-950/80 border border-amber-500/60 px-1 py-0.2 text-[9px] text-amber-300 font-bold uppercase">
                                  Chờ Chỉ Huy
                                </span>
                              ) : event.strategySource === "system_auto" ? (
                                <span className="rounded bg-cyan-950/80 border border-cyan-500/60 px-1 py-0.2 text-[9px] text-cyan-300 font-bold uppercase">
                                  System Auto
                                </span>
                              ) : (
                                <span className="rounded bg-zinc-800 border border-zinc-700 px-1 py-0.2 text-[9px] text-zinc-300 font-bold uppercase">
                                  INIT
                                </span>
                              )
                            ) : (
                              <span className="rounded bg-blue-950/80 border border-blue-500/60 px-1 py-0.2 text-[9px] text-blue-300 font-bold uppercase">
                                PROCESSING ({progressPct}%)
                              </span>
                            )}
                          </div>

                          {/* Urgency Badge */}
                          {isInit ? (
                            <span
                              className={cn(
                                "flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] border",
                                urgency.classes
                              )}
                            >
                              {urgency.icon}
                              <span>{urgency.label}</span>
                            </span>
                          ) : (
                            <span className="text-[9px] text-cyan-400 font-mono">
                              Đích: Ngày #{completeTick}
                            </span>
                          )}
                        </div>

                        {/* Hàng 2: Tên Sự Kiện */}
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
                              <span>ĐANG XEM</span>
                              <ChevronRight className="size-2.5" />
                            </span>
                          )}
                        </div>

                        {/* Hàng 3: Địa bàn + Cảnh báo ngắn gọn */}
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-zinc-400 pt-0.5">
                          <div className="flex items-center gap-1 truncate max-w-[180px]">
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

                          <div className="text-[10px] font-mono text-zinc-400 shrink-0">
                            {isInit ? (
                              <span>Hạn chót: Ngày #{event.decisionDeadlineTick}</span>
                            ) : (
                              <span className="text-zinc-400">
                                Áp dụng: <strong className="text-zinc-200">{chosenStrat?.name || event.chosenStrategyId}</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Cảnh báo ngắn nếu có nguyên nhân chuyển giao hoặc sắp khóa */}
                        {isInit && event.autoSelectionFailureReason && (
                          <div className="text-[9px] text-amber-400/90 truncate flex items-center gap-1 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-900/40">
                            <AlertTriangle className="size-2.5 shrink-0" />
                            <span className="truncate">Tự động thất bại: {event.autoSelectionFailureReason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* ------------------------------------------------------------------
              CỘT PHẢI (7 CỘT): BẢNG PHÂN TÍCH & PHÊ CHUẨN (DECISION PANEL)
              ------------------------------------------------------------------ */}
          <div className="lg:col-span-7 flex flex-col rounded border border-zinc-800 bg-zinc-950/90 shadow-xl overflow-hidden min-h-[520px] max-h-[680px]">
            {/* Header Cột Phải */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/70 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-cyan-400" />
                <span className="font-bold uppercase tracking-wider text-zinc-200 text-xs">
                  BẢNG PHÂN TÍCH & PHÊ CHUẨN CHIẾN LƯỢC // DECISION PANEL
                </span>
              </div>
              {selectedEvent && (
                <span className="font-mono text-[10px] text-zinc-400">
                  MÃ SỰ KIỆN: {selectedEvent.id}
                </span>
              )}
            </div>

            {/* Nội Dung Cuộn Độc Lập Của Cột Phải */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pr-2 scrollbar-thin">
              {!selectedEvent ? (
                /* EMPTY STATE TRUNG THỰC - KHÔNG DỮ LIỆU GIẢ */
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 space-y-3">
                  <div className="rounded-full bg-zinc-900 p-4 border border-zinc-800 text-zinc-600">
                    <Crosshair className="size-10 text-zinc-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-zinc-300 text-sm tracking-wide">
                      CHƯA CHỌN SỰ KIỆN NÀO
                    </div>
                    <p className="text-[11px] text-zinc-500 max-w-sm leading-relaxed">
                      Chọn một sự kiện từ <strong className="text-zinc-400">Hàng Đợi Khẩn Cấp</strong> bên trái để thẩm định tình báo, so sánh phương án và phê chuẩn chiến lược đối ứng.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* ==========================================================
                      1. THÔNG TIN ĐẦU NÃO SỰ KIỆN (EVENT BRIEFING HEADER)
                      ========================================================== */}
                  <div className="space-y-2.5 rounded border border-zinc-800 bg-zinc-900/50 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Severity Badge */}
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                            selectedEvent.severity === "critical"
                              ? "border-red-500 bg-red-950/70 text-red-200 animate-pulse"
                              : selectedEvent.severity === "warning"
                              ? "border-amber-500 bg-amber-950/60 text-amber-200"
                              : "border-zinc-700 bg-zinc-800 text-zinc-300"
                          )}
                        >
                          {selectedEvent.severity === "critical"
                            ? "TỐI NGUY"
                            : selectedEvent.severity === "warning"
                            ? "CẢNH BÁO"
                            : "THÔNG TIN"}
                        </span>

                        {/* Category */}
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-bold uppercase">
                          {getCategoryIcon(selectedEvent.category)}
                          <span>{selectedEvent.category}</span>
                        </span>

                        {/* Tier */}
                        {selectedEvent.tier && (
                          <span className="px-2 py-0.5 rounded bg-black/60 border border-zinc-700 text-cyan-300 text-[10px] font-mono uppercase">
                            Quy Mô: {selectedEvent.tier}
                          </span>
                        )}
                      </div>

                      {/* Hạn chót & Thời gian */}
                      <div className="flex items-center gap-2 text-[10px]">
                        {selectedEvent.status === "INIT" ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/50 text-amber-300">
                            <Clock className="size-3 text-amber-400" />
                            <span>
                              Hạn chót: Ngày #{selectedEvent.decisionDeadlineTick} (Còn{" "}
                              {Math.max(0, selectedEvent.decisionDeadlineTick - worldState.currentDay)} ngày)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/50 text-cyan-300">
                            <Clock className="size-3 text-cyan-400" />
                            <span>
                              Dự kiến hoàn tất: Ngày #{selectedEvent.processingCompletesTick || selectedEvent.decisionDeadlineTick}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tên & Mô tả chi tiết */}
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100">{selectedEvent.title}</h3>
                      <p className="mt-1 text-[11px] text-zinc-300 leading-relaxed bg-black/40 p-2.5 rounded border border-zinc-800">
                        {selectedEvent.description}
                      </p>
                    </div>

                    {/* Thông tin Địa bàn / Sector nếu có */}
                    {selectedEvent.sectorId && worldState.sectors[selectedEvent.sectorId] && (
                      (() => {
                        const sec = worldState.sectors[selectedEvent.sectorId]
                        return (
                          <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-950/60 p-2 rounded border border-zinc-800/80 text-[10px]">
                            <div className="flex items-center gap-2">
                              <MapPin className="size-3 text-cyan-400 shrink-0" />
                              <span>
                                Sector: <strong className="text-zinc-200">{sec.name}</strong>
                              </span>
                              <span className="text-zinc-500">·</span>
                              <span>
                                Chủ quyền: <strong className="text-cyan-300">{sec.sovereignty}</strong>
                              </span>
                              <span className="text-zinc-500">·</span>
                              <span>
                                Ổn định: <strong className="text-emerald-400">{sec.stability}%</strong>
                              </span>
                              <span className="text-zinc-500">·</span>
                              <span>
                                Đe dọa: <strong className="text-amber-400">{sec.threatLevel}/1000</strong>
                              </span>
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
                  </div>

                  {/* ==========================================================
                      2. TRẠNG THÁI & NGUỒN PHÊ CHUẨN CHIẾN LƯỢC
                      ========================================================== */}
                  {selectedEvent.status === "INIT" ? (
                    <div className="space-y-2">
                      {selectedEvent.strategySource === "player_choice" && (
                        <div className="rounded border border-amber-500/60 bg-amber-950/30 p-2.5 space-y-1 text-amber-200 text-[11px]">
                          <div className="flex items-center gap-1.5 font-bold text-amber-300 uppercase">
                            <HelpCircle className="size-3.5 text-amber-400 shrink-0" />
                            <span>TRẠNG THÁI: ĐANG CHỜ PHÊ CHUẨN CỦA CHỈ HUY</span>
                          </div>
                          {selectedEvent.autoSelectionFailureReason ? (
                            <p className="text-[10px] text-zinc-300 leading-normal">
                              <strong>Lý do chuyển giao:</strong> {selectedEvent.autoSelectionFailureReason}
                            </p>
                          ) : (
                            <p className="text-[10px] text-zinc-400 leading-normal">
                              Chính sách phân quyền yêu cầu Chỉ Huy tối cao đích thân ra quyết định cho sự kiện này.
                            </p>
                          )}
                        </div>
                      )}

                      {selectedEvent.strategySource === "system_auto" && (
                        <div className="rounded border border-cyan-500/60 bg-cyan-950/30 p-2.5 space-y-1 text-cyan-200 text-[11px]">
                          <div className="flex items-center gap-1.5 font-bold text-cyan-300 uppercase">
                            <Sparkles className="size-3.5 text-cyan-400 shrink-0" />
                            <span>HỆ THỐNG SYSTEM AUTO ĐÃ ĐỀ XUẤT PHƯƠNG ÁN TỐI ƯU</span>
                          </div>
                          <p className="text-[10px] text-zinc-300 leading-normal">
                            Đã chấm điểm minh bạch dựa trên tài nguyên sẵn có, tỷ lệ thành công và độ cấp bách của sector. Chỉ Huy có thể phê chuẩn ngay hoặc đổi phương án thủ công.
                          </p>
                        </div>
                      )}

                      {/* Cảnh báo tự động khóa phương án mặc định khi đến hạn */}
                      {(() => {
                        const defStrat = selectedEvent.availableStrategies.find(
                          (s) => s.id === selectedEvent.defaultStrategyId
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
                  ) : (
                    /* SỰ KIỆN ĐANG PROCESSING */
                    <div className="rounded border border-cyan-500/50 bg-cyan-950/30 p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-cyan-300 font-bold uppercase text-[11px]">
                          <Clock className="size-3.5 text-cyan-400" />
                          <span>SỰ KIỆN ĐANG TRIỂN KHAI // PROCESSING</span>
                        </div>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded border border-cyan-500/40 bg-black/60 text-cyan-300 font-mono">
                          {selectedEvent.strategySource === "system_auto"
                            ? "System Auto Phê Chuẩn"
                            : selectedEvent.strategySource === "default_fallback"
                            ? "Default Fallback Tự Động Khóa"
                            : "Chỉ Huy Đã Phê Chuẩn"}
                        </span>
                      </div>

                      {(() => {
                        const chosen = selectedEvent.availableStrategies.find(
                          (s) => s.id === selectedEvent.chosenStrategyId
                        )
                        const startTick = selectedEvent.processingStartedTick || selectedEvent.createdAtTick
                        const completeTick = selectedEvent.processingCompletesTick || selectedEvent.decisionDeadlineTick
                        const totalTicks = Math.max(1, completeTick - startTick)
                        const elapsedTicks = Math.max(0, worldState.currentDay - startTick)
                        const progressPct = Math.min(100, Math.round((elapsedTicks / totalTicks) * 100))
                        const remainingTicks = Math.max(0, completeTick - worldState.currentDay)

                        return (
                          <div className="space-y-2 text-[11px]">
                            <div className="bg-black/50 p-2 rounded border border-cyan-500/30 space-y-1">
                              <div className="text-cyan-300 font-bold">
                                Phương án đang thực thi: {chosen?.name || selectedEvent.chosenStrategyId}
                              </div>
                              <p className="text-[10px] text-zinc-400">{chosen?.description}</p>
                              {selectedEvent.selectionReason && (
                                <p className="text-[9px] text-zinc-400 italic pt-1 border-t border-cyan-500/20">
                                  * {selectedEvent.selectionReason}
                                </p>
                              )}
                            </div>

                            {/* Thanh tiến độ */}
                            <div className="space-y-1 text-[10px]">
                              <div className="flex items-center justify-between text-zinc-400">
                                <span>Tiến trình hoàn tất: <strong className="text-cyan-300 font-mono">{progressPct}%</strong></span>
                                <span>Dự kiến: <strong className="text-zinc-200">Ngày #{completeTick}</strong> (còn {remainingTicks} ngày)</span>
                              </div>
                              <div className="h-2 w-full rounded bg-zinc-800 overflow-hidden">
                                <div
                                  className="h-full bg-cyan-400 transition-all duration-300 rounded"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>

                            {selectedEvent.encounterTransactionId && (
                              <div className="flex items-center gap-1.5 text-[10px] text-amber-300 bg-amber-950/40 p-1.5 rounded border border-amber-500/40">
                                <Swords className="size-3 text-amber-400 shrink-0" />
                                <span>Đang chờ giải quyết trận đánh can thiệp trực tiếp tại Buồng Lái.</span>
                              </div>
                            )}

                            <p className="text-[9px] text-zinc-500 italic">
                              * Sự kiện đã bước vào vòng đời PROCESSING và được bảo vệ lũy đẳng. Không thể thay đổi hay phê chuẩn lại.
                            </p>
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {/* ==========================================================
                      3. SO SÁNH PHƯƠNG ÁN CHIẾN LƯỢC (STRATEGY COMPARISON DESK)
                      ========================================================== */}
                  {selectedEvent.status === "INIT" && (
                    <div className="space-y-3 pt-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                        <span className="font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1 text-[11px]">
                          <Zap className="size-3.5 text-cyan-400" />
                          <span>SO SÁNH CÁC PHƯƠNG ÁN CHIẾN LƯỢC ({selectedEvent.availableStrategies.length})</span>
                        </span>

                        {/* Nút System Auto Phê Chuẩn Nhanh */}
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound()
                            const dec = evaluateAndApplyEventStrategyPolicy(worldState, selectedEvent)
                            if (dec.applied) {
                              playShieldSound()
                              onStateUpdated?.()
                            }
                          }}
                          className="flex items-center gap-1 rounded bg-cyan-950/80 border border-cyan-500/60 px-2.5 py-1 text-[10px] text-cyan-300 hover:bg-cyan-900 transition-colors cursor-pointer font-bold shadow-sm shadow-cyan-950"
                          title="Tự động phê chuẩn theo System Auto Strategy"
                        >
                          <Sparkles className="size-3 text-cyan-400" />
                          <span>⚡ System Auto Phê Chuẩn Ngay</span>
                        </button>
                      </div>

                      {/* Bảng so sánh các phương án */}
                      {(() => {
                        const bestCandidate = selectBestStrategyForEvent(worldState, selectedEvent)

                        return (
                          <div className="space-y-2.5">
                            {selectedEvent.availableStrategies.map((strat) => {
                              const isDefault = strat.id === selectedEvent.defaultStrategyId
                              const isBest = bestCandidate?.strategy.id === strat.id
                              const scoreInfo = scoreEventStrategy(worldState, selectedEvent, strat)
                              const validation = validateStrategyExecution(worldState, selectedEvent, strat)
                              const canAfford = validation.valid
                              const reasonKey = `${selectedEvent.id}_${strat.id}`
                              const isExpanded = !!expandedReasonKeys[reasonKey]
                              const hasCost = strat.cost && Object.keys(strat.cost).length > 0

                              return (
                                <div
                                  key={strat.id}
                                  className={cn(
                                    "rounded border p-3 space-y-2.5 transition-all text-left",
                                    isBest
                                      ? "border-cyan-500/70 bg-cyan-950/20 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/40"
                                      : isDefault
                                      ? "border-amber-500/60 bg-amber-950/20 shadow-sm"
                                      : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                                  )}
                                >
                                  {/* Hàng Tiêu Đề Phương Án */}
                                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-zinc-100 text-xs">{strat.name}</span>
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

                                    {/* Điểm số đánh giá */}
                                    <div className="flex items-center gap-2">
                                      <span className="text-zinc-400 text-[10px]">Điểm chiến lược:</span>
                                      <span
                                        className={cn(
                                          "font-mono font-bold text-xs px-1.5 py-0.2 rounded border",
                                          scoreInfo.score >= 50
                                            ? "border-cyan-500/50 bg-cyan-950/60 text-cyan-300"
                                            : scoreInfo.score >= 0
                                            ? "border-amber-500/50 bg-amber-950/60 text-amber-300"
                                            : "border-red-500/50 bg-red-950/60 text-red-300"
                                        )}
                                      >
                                        {scoreInfo.score > 0 ? `+${scoreInfo.score}` : scoreInfo.score}đ
                                      </span>
                                    </div>
                                  </div>

                                  <p className="text-[11px] text-zinc-300 leading-relaxed bg-black/30 p-2 rounded border border-zinc-800/80">
                                    {strat.description}
                                  </p>

                                  {/* Bảng Chỉ Số Tác Động & Hiệu Quả */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-zinc-950/70 p-2 rounded border border-zinc-800">
                                    {/* Tỷ lệ thành công */}
                                    <div>
                                      <span className="text-zinc-500 block">Tỷ lệ thành công:</span>
                                      <span
                                        className={cn(
                                          "font-bold",
                                          (strat.successChance ?? 100) >= 80
                                            ? "text-emerald-400"
                                            : (strat.successChance ?? 100) >= 50
                                            ? "text-amber-400"
                                            : "text-red-400"
                                        )}
                                      >
                                        {strat.successChance ?? 100}%
                                      </span>
                                    </div>

                                    {/* Thời gian */}
                                    <div>
                                      <span className="text-zinc-500 block">Thời gian:</span>
                                      <span className="font-bold text-cyan-300">{strat.processingTicks} ngày</span>
                                    </div>

                                    {/* Biến động Ổn định */}
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

                                    {/* Biến động Đe dọa */}
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
                                  </div>

                                  {/* Chi phí tiêu hao & Khả năng chi trả */}
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] pt-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-zinc-400">Chi phí:</span>
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

                                    {/* Toggle giải thích scoring */}
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
                                      <span>{isExpanded ? "Ẩn giải thích điểm số" : "Giải thích điểm số"}</span>
                                    </button>
                                  </div>

                                  {/* Khung giải thích chấm điểm mở rộng */}
                                  {isExpanded && (
                                    <div className="rounded bg-black/60 p-2 border border-zinc-800 text-[10px] space-y-1 text-zinc-300">
                                      <div className="font-bold text-cyan-400 uppercase text-[9px]">
                                        Chi tiết các hệ số đánh giá chiến lược:
                                      </div>
                                      {scoreInfo.reasons.map((r, rIdx) => (
                                        <div key={rIdx} className="leading-tight text-zinc-400">
                                          • {r}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Thông báo lý do không thể chi trả nếu validation fail */}
                                  {!canAfford && validation.reason && (
                                    <div className="text-[10px] text-red-400 bg-red-950/40 p-1.5 rounded border border-red-500/40 flex items-center gap-1.5">
                                      <AlertOctagon className="size-3 text-red-400 shrink-0" />
                                      <span>{validation.reason}</span>
                                    </div>
                                  )}

                                  {/* Thao tác Phê Chuẩn */}
                                  <div className="pt-1">
                                    <button
                                      type="button"
                                      disabled={!canAfford}
                                      onClick={() => {
                                        playClickSound()
                                        onChooseStrategy(selectedEvent.id, strat.id)
                                      }}
                                      className={cn(
                                        "w-full py-2 px-3 rounded text-xs font-bold transition-all text-center cursor-pointer",
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
                                        ? "Thiếu Tài Nguyên/Quân Để Thực Thi"
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
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          4. PHÂN KHU CHUỖI NHIỆM VỤ CHIẾN LƯỢC (STRATEGIC MISSION CHAINS)
          ==================================================================== */}
      {(filterMode === "all" || filterMode === "chains") && (
        <section className="space-y-3 border-t border-zinc-800/80 pt-3">
          <div className="flex items-center justify-between text-zinc-300 text-[11px] border-b border-zinc-800 pb-1.5">
            <button
              type="button"
              onClick={() => setIsChainsSectionExpanded(!isChainsSectionExpanded)}
              className="font-bold uppercase tracking-wider flex items-center gap-2 text-indigo-300 hover:text-indigo-200 cursor-pointer"
            >
              <GitBranch className="size-4 text-indigo-400" />
              <span>CÂY CHUỖI NHIỆM VỤ CHIẾN LƯỢC TOÀN DIỆN ({activeMissionChains.length} / 8 MAX)</span>
              {isChainsSectionExpanded ? (
                <ChevronDown className="size-3.5 text-zinc-500 ml-1" />
              ) : (
                <ChevronRight className="size-3.5 text-zinc-500 ml-1" />
              )}
            </button>
            <span className="text-zinc-400 text-[10px]">
              Đồ thị phân nhánh và kiểm soát xung đột sector
            </span>
          </div>

          {isChainsSectionExpanded && (
            <>
              {activeMissionChains.length === 0 ? (
                <div className="rounded border border-dashed border-zinc-800 bg-zinc-950/40 p-6 text-center text-zinc-500">
                  Không có chuỗi nhiệm vụ nào đang hoạt động trong thiên hà.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {activeMissionChains.map((chain) => {
                    const nodesList = Object.values(chain.nodes)
                    const completedCount = nodesList.filter((n) => n.status === "completed").length
                    const totalNodes = nodesList.length
                    const progressFraction = `${completedCount}/${totalNodes}`

                    return (
                      <div
                        key={chain.id}
                        className="rounded border border-zinc-800 bg-zinc-950/80 p-3.5 space-y-3 shadow-md"
                      >
                        {/* Header Chuỗi Nhiệm Vụ */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-indigo-950/80 px-2 py-0.5 text-[10px] text-indigo-300 border border-indigo-500/50 uppercase font-black">
                              {chain.topology}
                            </span>
                            <span className="font-bold text-zinc-100 text-xs sm:text-sm">{chain.title}</span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                            <span>Bắt đầu: Ngày #{chain.startedAtTick}</span>
                            <span className="font-bold text-cyan-300">Tiến trình: {progressFraction} bước</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-zinc-400 leading-relaxed">{chain.description}</p>

                        {/* Đồ Thị Nút Nhiệm Vụ (Mission Nodes Pipeline / Tree Flow) */}
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                            Lộ trình các bước trong chuỗi nhiệm vụ:
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
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
                                    "rounded border p-3 flex flex-col justify-between space-y-2 transition-all relative",
                                    isCompleted
                                      ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-200"
                                      : isActive
                                      ? isPending
                                        ? "border-amber-500/70 bg-amber-950/25 shadow-md shadow-amber-950/30"
                                        : "border-cyan-500/70 bg-cyan-950/30 shadow-md shadow-cyan-950/40"
                                      : "border-zinc-800 bg-zinc-900/30 text-zinc-500 opacity-70"
                                  )}
                                >
                                  {/* Header Node */}
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-1 text-[10px]">
                                      <span className="font-bold uppercase text-zinc-400">
                                        Bước {idx + 1}
                                      </span>

                                      {/* Badge Trạng thái */}
                                      {isCompleted && (
                                        <span className="flex items-center gap-1 text-emerald-400 font-bold uppercase text-[9px] bg-emerald-950/60 border border-emerald-500/40 px-1.5 py-0.2 rounded">
                                          <CheckCircle2 className="size-3" />
                                          Hoàn Tất
                                        </span>
                                      )}
                                      {isActive && !isPending && (
                                        <span className="flex items-center gap-1 text-cyan-300 font-bold uppercase text-[9px] bg-cyan-950/60 border border-cyan-500/50 px-1.5 py-0.2 rounded animate-pulse">
                                          <span className="size-1.5 rounded-full bg-cyan-400 animate-ping" />
                                          Đang Tác Chiến
                                        </span>
                                      )}
                                      {isPending && (
                                        <span className="flex items-center gap-1 text-amber-300 font-bold uppercase text-[9px] bg-amber-950/80 border border-amber-500/70 px-1.5 py-0.2 rounded animate-pulse">
                                          <Clock className="size-3 text-amber-400" />
                                          Đang Chờ Sector
                                        </span>
                                      )}
                                      {isLocked && (
                                        <span className="flex items-center gap-1 text-zinc-500 font-bold uppercase text-[9px]">
                                          <Lock className="size-3" />
                                          Khóa
                                        </span>
                                      )}
                                    </div>

                                    <div className="font-bold text-zinc-100 text-xs">{node.title}</div>
                                    <p className="text-[10px] text-zinc-400 line-clamp-2">{node.description}</p>
                                  </div>

                                  {/* Sector & Cảnh báo Hoãn Dispatch */}
                                  <div className="border-t border-zinc-800/80 pt-2 space-y-1.5 text-[10px]">
                                    {targetSector && (
                                      <div className="flex items-center gap-1 text-zinc-400">
                                        <MapPin className="size-3 text-zinc-400 shrink-0" />
                                        <span>Sector: {targetSector.name}</span>
                                      </div>
                                    )}

                                    {/* HUY HIỆU ĐANG CHỜ ĐIỀU KIỆN SECTOR */}
                                    {isPending && (
                                      <div className="rounded bg-amber-950/40 border border-amber-500/40 p-2 text-[10px] text-amber-200 space-y-1">
                                        <div className="flex items-center gap-1 font-bold text-amber-300">
                                          <AlertTriangle className="size-3 text-amber-400" />
                                          <span>Đang chờ điều kiện sector</span>
                                        </div>
                                        <p className="text-[9px] text-zinc-300 leading-tight">
                                          Sector đang có sự kiện cùng loại hoặc bận tác chiến. Nhiệm vụ sẽ tự động kích hoạt
                                          lại khi sector sẵn sàng.
                                          {node.dispatchDeferredTicks !== undefined && (
                                            <span className="block text-amber-400 font-mono mt-0.5">
                                              (Đã chờ {node.dispatchDeferredTicks}/{MAX_DISPATCH_DEFER_TICKS} ngày trước khi tự động giải tỏa an toàn)
                                            </span>
                                          )}
                                        </p>
                                      </div>
                                    )}

                                    {/* Tóm tắt phần thưởng */}
                                    {node.rewardSummary && (
                                      <div className="text-[9px] text-emerald-400 font-semibold">
                                        Thưởng: {node.rewardSummary}
                                      </div>
                                    )}

                                    {/* Điều kiện mở khóa nếu bị khóa */}
                                    {isLocked && node.requiredPreviousNodeIds && (
                                      <div className="text-[9px] text-zinc-500">
                                        Yêu cầu: Hoàn tất bước trước
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
            </>
          )}
        </section>
      )}

      {/* ====================================================================
          5. BÁO CÁO KẾT QUẢ GẦN ĐÂY (RECENT EVENT RESULTS FEED)
          ==================================================================== */}
      {(filterMode === "all" || filterMode === "results") && (
        <section className="space-y-3 border-t border-zinc-800/80 pt-3">
          <div className="flex items-center justify-between text-zinc-300 text-[11px] border-b border-zinc-800 pb-1.5">
            <span className="font-bold uppercase tracking-wider flex items-center gap-2 text-purple-300">
              <Layers className="size-4 text-purple-400" />
              <span>BÁO CÁO KẾT QUẢ GẦN ĐÂY // RECENT RESULTS FEED ({recentResults.length})</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigateToResults?.()}
              className="text-cyan-400 hover:text-cyan-200 text-[10px] flex items-center gap-1 cursor-pointer font-bold"
            >
              <span>Xem Toàn Bộ Nhật Ký Tại Dual Results Hub</span>
              <ArrowRight className="size-3" />
            </button>
          </div>

          {recentResults.length === 0 ? (
            <div className="rounded border border-dashed border-zinc-800 bg-zinc-950/40 p-6 text-center text-zinc-500">
              Chưa có báo cáo sự kiện nào được ghi nhận trong kho lưu trữ.
            </div>
          ) : (
            <div className="space-y-2">
              {recentResults.map((result) => {
                const isSuccess = result.status === "success"
                const isExpired = result.status === "expired_default"
                const targetSector = result.sectorId ? worldState.sectors[result.sectorId] : null

                return (
                  <div
                    key={result.id}
                    className={cn(
                      "rounded border p-3 flex flex-wrap items-center justify-between gap-3 text-[11px] transition-colors",
                      !result.isRead ? "border-cyan-500/50 bg-cyan-950/20" : "border-zinc-800 bg-zinc-950/60"
                    )}
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border",
                            isSuccess
                              ? "border-emerald-500/50 bg-emerald-950/60 text-emerald-300"
                              : isExpired
                              ? "border-amber-500/50 bg-amber-950/60 text-amber-300"
                              : "border-red-500/50 bg-red-950/60 text-red-300"
                          )}
                        >
                          {isSuccess ? "Thành Công" : isExpired ? "Tự Động Khóa" : "Thất Bại"}
                        </span>
                        <span className="font-bold text-zinc-100">{result.title}</span>
                        {targetSector && (
                          <span className="text-zinc-400 text-[10px]">· {targetSector.name}</span>
                        )}
                        <span className="text-zinc-500 text-[10px]">· Ngày #{result.resolvedAtTick}</span>
                      </div>

                      <p className="text-[10px] text-zinc-300">{result.summaryText}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!result.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkResultRead(result.id)}
                          className="px-2 py-1 rounded border border-cyan-500/40 bg-cyan-950/50 text-cyan-300 hover:bg-cyan-900/50 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
