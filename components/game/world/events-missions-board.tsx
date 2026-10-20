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
  User,
  UserCheck,
  UserMinus,
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
import {
  canPlayerJoinMission,
  playerJoinMission,
  playerWithdrawMission,
  getActivePlayerMission,
  assignGarrisonForcesToMission,
  createMissionDispatch,
  abortMissionDispatch,
  createStandardObjective,
} from "@/lib/game/world/mission-dispatch"
import { saveWorldState } from "@/lib/game/world/storage"
import { getSectorMaxThreat } from "@/lib/game/world/threat-engine"
import type {
  WorldState,
  WorldEvent,
  WorldEventResult,
  MissionChain,
  MissionChainNode,
  EventStrategy,
  MissionDispatch,
  MissionObjectiveCategory,
  MissionTimelineEntry,
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

export type CommandDeskMode = "init" | "processing" | "chains" | "dispatches"

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

  // Dữ liệu Mission Dispatches (Phase 6.31)
  const dispatchesList = useMemo(() => {
    return Object.values(worldState.missionDispatches || {}).sort((a, b) => {
      const statusWeight: Record<string, number> = {
        PREPARE: 3,
        PROCESSING: 2,
        COMPLETED: 1,
        FAILED: 1,
        ABORTED: 0,
      }
      const diff = (statusWeight[b.status] || 0) - (statusWeight[a.status] || 0)
      if (diff !== 0) return diff
      return b.createdAtTick - a.createdAtTick
    })
  }, [worldState.missionDispatches])

  const activePlayerMission = useMemo(() => {
    return getActivePlayerMission(worldState)
  }, [worldState])

  const [selectedDispatchId, setSelectedDispatchId] = useState<string | null>(null)
  const [dispatchFilterMode, setDispatchFilterMode] = useState<"all" | "prepare" | "processing" | "resolved">("all")
  const [isCreateDispatchOpen, setIsCreateDispatchOpen] = useState(false)
  const [newDispatchCategory, setNewDispatchCategory] = useState<MissionObjectiveCategory>("patrol")
  const [newDispatchSectorId, setNewDispatchSectorId] = useState<string>("helios_perimeter")
  const [newDispatchDuration, setNewDispatchDuration] = useState<number>(2)
  const [newDispatchTitle, setNewDispatchTitle] = useState<string>("")
  const [dispatchFeedback, setDispatchFeedback] = useState<string | null>(null)
  const [assignTroopsCount, setAssignTroopsCount] = useState<number>(20)

  // Auto-select cho Dispatches khi danh sách thay đổi
  useEffect(() => {
    if (dispatchesList.length === 0) {
      setSelectedDispatchId(null)
      return
    }
    const exists = dispatchesList.some((d) => d.id === selectedDispatchId)
    if (!exists) {
      setSelectedDispatchId(dispatchesList[0].id)
    }
  }, [dispatchesList, selectedDispatchId])

  const filteredDispatches = useMemo(() => {
    return dispatchesList.filter((d) => {
      if (dispatchFilterMode === "prepare" && d.status !== "PREPARE") return false
      if (dispatchFilterMode === "processing" && d.status !== "PROCESSING") return false
      if (
        dispatchFilterMode === "resolved" &&
        d.status !== "COMPLETED" &&
        d.status !== "FAILED" &&
        d.status !== "ABORTED"
      ) {
        return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const titleMatch = d.title.toLowerCase().includes(q)
        const descMatch = d.description.toLowerCase().includes(q)
        const sectorMatch = worldState.sectors[d.sectorId]?.name.toLowerCase().includes(q)
        const catMatch = d.category.toLowerCase().includes(q)
        return titleMatch || descMatch || sectorMatch || catMatch
      }
      return true
    })
  }, [dispatchesList, dispatchFilterMode, searchQuery, worldState.sectors])

  const activeSelectedDispatch = useMemo(() => {
    if (!selectedDispatchId) return null
    return dispatchesList.find((d) => d.id === selectedDispatchId) || null
  }, [selectedDispatchId, dispatchesList])

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
    <div className="space-y-4 font-mono text-sm leading-normal">
      {/* ====================================================================
          1. HEADER BÀN CHỈ HUY CHIẾN LƯỢC & ĐIỀU HƯỚNG 3 CHẾ ĐỘ
          ==================================================================== */}
      <div className="rounded border border-zinc-800 bg-zinc-950/90 p-4 sm:p-4.5 backdrop-blur-md shadow-lg shadow-zinc-950/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 text-cyan-400 font-bold uppercase tracking-wider text-base sm:text-lg">
              <Crosshair className="size-5 text-cyan-400" />
              <span>BÀN CHỈ HUY SỰ KIỆN & NHIỆM VỤ // COMMAND DESK</span>
            </div>
            <p className="mt-1 text-zinc-300 text-xs sm:text-sm leading-relaxed max-w-4xl">
              Trung tâm chỉ huy tác chiến 3 chế độ: Phê chuẩn khẩn cấp [INIT], Giám sát tiến độ [PROCESSING] và Điều phối tuyến nhiệm vụ [CHAINS].
            </p>
          </div>

          {/* Quick Shortcuts & Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateToResults?.()}
              className="flex items-center gap-2 px-3 py-2 rounded border border-purple-500/40 bg-purple-950/30 text-purple-200 hover:text-white hover:border-purple-400 transition-colors cursor-pointer text-xs sm:text-[13px] font-semibold"
              title="Mở Khay Báo Cáo Tình Báo / Debriefing Drawer"
            >
              <Layers className="size-4 text-purple-400" />
              <span>Khay Báo Cáo Tình Báo</span>
              <ExternalLink className="size-3 ml-0.5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Thanh Điều Hướng Cấp 1: 3 Chế Độ (Tabs) + Tìm Kiếm */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-zinc-400 font-bold uppercase mr-1 text-xs">Chế độ chỉ huy:</span>

            {/* TAB 1: Cần Quyết Định [INIT] */}
            <button
              type="button"
              onClick={() => {
                playClickSound()
                setCommandMode("init")
              }}
              className={cn(
                "px-3.5 py-2 rounded border transition-all cursor-pointer flex items-center gap-2 text-xs sm:text-[13px] font-bold",
                commandMode === "init"
                  ? "border-amber-400 bg-amber-950/70 text-amber-200 shadow-md shadow-amber-950/40 ring-1 ring-amber-400/50"
                  : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              )}
            >
              <AlertCircle className={cn("size-4", initEvents.length > 0 ? "text-amber-400 animate-pulse" : "text-zinc-500")} />
              <span>CẦN QUYẾT ĐỊNH [INIT]</span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-xs font-mono font-bold",
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
                "px-3.5 py-2 rounded border transition-all cursor-pointer flex items-center gap-2 text-xs sm:text-[13px] font-bold",
                commandMode === "processing"
                  ? "border-cyan-400 bg-cyan-950/70 text-cyan-200 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-400/50"
                  : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              )}
            >
              <Clock className={cn("size-4", processingEvents.length > 0 ? "text-cyan-400" : "text-zinc-500")} />
              <span>ĐANG TRIỂN KHAI [PROCESSING]</span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-xs font-mono font-bold",
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
                "px-3.5 py-2 rounded border transition-all cursor-pointer flex items-center gap-2 text-xs sm:text-[13px] font-bold",
                commandMode === "chains"
                  ? "border-indigo-400 bg-indigo-950/70 text-indigo-200 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-400/50"
                  : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              )}
            >
              <GitBranch className="size-4 text-indigo-400" />
              <span>CHUỖI NHIỆM VỤ [CHAINS]</span>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                {activeMissionChains.length}/8
              </span>
            </button>

            {/* TAB 4: Điều Phối Tác Chiến [DISPATCH] (Phase 6.31) */}
            <button
              type="button"
              onClick={() => {
                playClickSound()
                setCommandMode("dispatches")
              }}
              className={cn(
                "px-3.5 py-2 rounded border transition-all cursor-pointer flex items-center gap-2 text-xs sm:text-[13px] font-bold",
                commandMode === "dispatches"
                  ? "border-amber-400 bg-amber-950/70 text-amber-200 shadow-md shadow-amber-950/40 ring-1 ring-amber-400/50"
                  : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              )}
            >
              <Crosshair className="size-4 text-amber-400" />
              <span>ĐIỀU PHỐI [DISPATCH]</span>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {dispatchesList.length}
              </span>
              {activePlayerMission && (
                <span className="size-2 rounded-full bg-cyan-400 animate-pulse" title="Đang trực tiếp chỉ huy 1 nhiệm vụ" />
              )}
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative flex items-center">
            <Search className="size-3.5 text-zinc-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lọc sự kiện, sector, từ khóa..."
              className="rounded border border-zinc-800 bg-zinc-900/80 pl-8 pr-3 py-1.5 text-xs sm:text-[13px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 w-48 sm:w-64"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-zinc-400 hover:text-white"
              >
                <X className="size-3" />
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
          <div className="rounded border border-indigo-500/50 bg-indigo-950/40 p-3.5 space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-2.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="font-bold text-indigo-200 text-xs sm:text-sm uppercase tracking-wide">
                  TỔNG HỢP BIẾN ĐỘNG VÒNG ĐỜI SỰ KIỆN TẠI NGÀY #{worldState.currentDay}
                </span>
                <span className="rounded bg-indigo-900/60 px-2 py-0.5 text-xs text-indigo-300 border border-indigo-600/40 font-semibold">
                  {lastEventsSummary.resolvedCount} Hoàn Tất · {lastEventsSummary.autoLockedCount} Tự Động Khóa
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDismissedTickSummary(worldState.currentDay)}
                className="text-zinc-400 hover:text-white cursor-pointer"
                title="Đóng thông báo"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs sm:text-[13px]">
              <div className="rounded border border-amber-500/30 bg-amber-950/20 p-2.5 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs uppercase">
                  <Clock className="size-3.5 text-amber-400" />
                  <span>Sự Kiện Tự Động Khóa Phương Án Mặc Định ({lastEventsSummary.autoLockedCount})</span>
                </div>
                {lastEventsSummary.autoLockedEvents.length === 0 ? (
                  <div className="text-zinc-400 text-xs">Không có sự kiện nào bị quá hạn tự động khóa.</div>
                ) : (
                  lastEventsSummary.autoLockedEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-center justify-between bg-zinc-900/60 p-2 rounded border border-zinc-800/80 text-xs sm:text-[13px]"
                    >
                      <span className="font-semibold text-zinc-200 truncate mr-2">{evt.title}</span>
                      <span className="text-amber-400 shrink-0 font-mono font-bold">
                        {evt.strategyId}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="rounded border border-emerald-500/30 bg-emerald-950/20 p-2.5 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300 text-xs uppercase">
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                  <span>Sự Kiện Đã Giải Quyết Xong ({lastEventsSummary.resolvedCount})</span>
                </div>
                {lastEventsSummary.resolvedEvents.length === 0 ? (
                  <div className="text-zinc-400 text-xs">Không có sự kiện nào vừa hoàn tất trong tick này.</div>
                ) : (
                  lastEventsSummary.resolvedEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-center justify-between bg-zinc-900/60 p-2 rounded border border-zinc-800/80 text-xs sm:text-[13px]"
                    >
                      <span className="font-semibold text-zinc-200 truncate mr-2">{evt.title}</span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded font-bold uppercase text-xs shrink-0 border",
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
          {/* CỘT TRÁI (4 CỘT): Hàng Đợi Sự Kiện Khẩn Cấp */}
          <div className="lg:col-span-4 flex flex-col rounded border border-zinc-800 bg-zinc-950/90 shadow-xl overflow-hidden min-h-[540px] max-h-[760px]">
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/70 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 text-amber-400" />
                <span className="font-bold uppercase tracking-wider text-zinc-200 text-xs sm:text-sm">
                  SỰ KIỆN CHỜ PHÊ CHUẨN
                </span>
                <span className="rounded bg-black/60 px-2 py-0.5 text-xs text-amber-300 border border-zinc-700 font-mono font-bold">
                  {filteredInitEvents.length}
                </span>
              </div>
              <span className="text-xs text-zinc-400">Hạn chót gần nhất</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 pr-2 scrollbar-thin">
              {filteredInitEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400 space-y-2.5">
                  <CheckCircle2 className="size-9 text-emerald-500/60" />
                  <div className="font-bold text-zinc-200 text-sm">Không có sự kiện nào cần quyết định.</div>
                  <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
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
                        "rounded border p-3.5 transition-all cursor-pointer relative text-left group",
                        isSelected
                          ? "border-amber-400 bg-amber-950/30 ring-1 ring-amber-500/60 shadow-md shadow-amber-950/40"
                          : urgency.isUrgent
                          ? "border-red-500/60 bg-red-950/20 hover:border-red-400 hover:bg-red-950/30"
                          : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute left-0 top-0 bottom-0 w-1.5 rounded-l transition-colors",
                          isSelected
                            ? "bg-amber-400"
                            : urgency.isUrgent
                            ? "bg-red-500 animate-pulse"
                            : "bg-amber-500/80"
                        )}
                      />

                      <div className="pl-2 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                          <span className="flex items-center gap-1.5 font-bold text-zinc-300 uppercase">
                            {getCategoryIcon(event.category)}
                            <span>{event.category}</span>
                          </span>

                          <span
                            className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border",
                              urgency.classes
                            )}
                          >
                            {urgency.icon}
                            <span>{urgency.label}</span>
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-1.5">
                          <span
                            className={cn(
                              "font-bold text-sm sm:text-[15px] leading-snug line-clamp-2",
                              isSelected ? "text-amber-200" : "text-zinc-100 group-hover:text-amber-300"
                            )}
                          >
                            {event.title}
                          </span>
                          {isSelected && (
                            <span className="text-xs text-amber-400 uppercase font-black shrink-0 flex items-center gap-0.5 mt-0.5">
                              <span>ĐANG XEM</span>
                              <ChevronRight className="size-3" />
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs text-zinc-300 pt-0.5 border-t border-zinc-800/60">
                          <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                            {targetSector ? (
                              <>
                                <MapPin className="size-3 text-cyan-400 shrink-0" />
                                <span className="truncate font-medium">{targetSector.name}</span>
                              </>
                            ) : (
                              <>
                                <Globe2 className="size-3 text-zinc-400 shrink-0" />
                                <span>Toàn Vũ Trụ</span>
                              </>
                            )}
                          </div>

                          <span className="font-mono text-xs text-zinc-300 font-semibold">
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
          <div className="lg:col-span-8 flex flex-col rounded border border-zinc-800 bg-zinc-950/90 shadow-xl overflow-hidden min-h-[540px] max-h-[760px]">
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/70 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-amber-400" />
                <span className="font-bold uppercase tracking-wider text-zinc-100 text-xs sm:text-sm">
                  BẢNG QUYẾT ĐỊNH & PHÊ CHUẨN CHIẾN LƯỢC // DECISION PANEL
                </span>
              </div>
              {activeSelectedInitEvent && (
                <span className="font-mono text-xs text-zinc-300 font-semibold">
                  MÃ SỰ KIỆN: {activeSelectedInitEvent.id}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 pr-3 scrollbar-thin">
              {!activeSelectedInitEvent ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[420px] text-center p-8 space-y-3">
                  <div className="rounded-full bg-zinc-900 p-4 border border-zinc-800 text-zinc-500">
                    <Crosshair className="size-10 text-zinc-400" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="font-bold text-zinc-200 text-base tracking-wide">
                      CHƯA CHỌN SỰ KIỆN NÀO
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400 max-w-sm leading-relaxed">
                      Chọn một sự kiện từ danh sách bên trái để xem mục tiêu, bối cảnh và so sánh các phương án đối ứng.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Khối Bối Cảnh & Mục Tiêu */}
                  <div className="space-y-3 rounded border border-zinc-800 bg-zinc-900/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-zinc-800/80 pb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded text-xs font-bold uppercase border",
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

                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold uppercase">
                          {getCategoryIcon(activeSelectedInitEvent.category)}
                          <span>{activeSelectedInitEvent.category}</span>
                        </span>

                        {activeSelectedInitEvent.tier && (
                          <span className="px-2.5 py-1 rounded bg-black/60 border border-zinc-700 text-cyan-300 text-xs font-mono font-bold uppercase">
                            Quy Mô: {activeSelectedInitEvent.tier}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/40 border border-amber-500/50 text-amber-300 text-xs font-semibold">
                        <Clock className="size-3.5 text-amber-400" />
                        <span>
                          Hạn chót: Ngày #{activeSelectedInitEvent.decisionDeadlineTick} (Còn{" "}
                          {Math.max(0, activeSelectedInitEvent.decisionDeadlineTick - worldState.currentDay)} ngày)
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-bold text-zinc-100 leading-snug">
                        {activeSelectedInitEvent.title}
                      </h3>
                      <p className="text-sm text-zinc-200 leading-relaxed bg-black/40 p-3 rounded border border-zinc-800">
                        {activeSelectedInitEvent.description}
                      </p>
                    </div>

                    {activeSelectedInitEvent.sectorId && worldState.sectors[activeSelectedInitEvent.sectorId] && (
                      (() => {
                        const sec = worldState.sectors[activeSelectedInitEvent.sectorId]
                        const secMaxThreat = getSectorMaxThreat(sec, worldState.threatConfig)
                        return (
                          <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-950/60 p-2.5 rounded border border-zinc-800/80 text-xs text-zinc-300">
                            <div className="flex flex-wrap items-center gap-2">
                              <MapPin className="size-3.5 text-cyan-400 shrink-0" />
                              <span>Sector: <strong className="text-zinc-100">{sec.name}</strong></span>
                              <span className="text-zinc-600">·</span>
                              <span>Chủ quyền: <strong className="text-cyan-300 uppercase">{sec.sovereignty}</strong></span>
                              <span className="text-zinc-600">·</span>
                              <span>Ổn định: <strong className="text-emerald-400">{sec.stability}%</strong></span>
                              <span className="text-zinc-600">·</span>
                              <span>Đe dọa: <strong className="text-amber-400">{sec.threatLevel.toLocaleString()} / {secMaxThreat.toLocaleString()}</strong></span>
                            </div>

                            <button
                              type="button"
                              onClick={() => onNavigateToSector?.(sec.id)}
                              className="text-cyan-400 hover:text-cyan-200 underline cursor-pointer text-xs font-bold"
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
                        <div className="flex items-start gap-2.5 rounded bg-amber-950/20 border border-amber-500/30 p-2.5 text-xs sm:text-[13px] text-amber-200">
                          <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="leading-relaxed">
                            <span className="font-bold text-amber-300">CẢNH BÁO TỰ ĐỘNG KHÓA:</span> Nếu không phê chuẩn trước hạn chót, hệ thống sẽ tự động kích hoạt phương án mặc định:{" "}
                            <strong className="text-amber-100 underline">[{defStrat.name}]</strong>.
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* So Sánh 2-3 Phương Án Chiến Lược */}
                  <div className="space-y-3.5 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                      <span className="font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-2 text-xs sm:text-sm">
                        <Zap className="size-4 text-cyan-400" />
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
                        className="flex items-center gap-1.5 rounded bg-cyan-950/80 border border-cyan-500/60 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900 transition-colors cursor-pointer shadow-sm shadow-cyan-950"
                        title="Tự động phê chuẩn theo System Auto Strategy"
                      >
                        <Sparkles className="size-3.5 text-cyan-400" />
                        <span>⚡ System Auto Phê Chuẩn Ngay</span>
                      </button>
                    </div>

                    {(() => {
                      const bestCandidate = selectBestStrategyForEvent(worldState, activeSelectedInitEvent)

                      return (
                        <div className="space-y-3.5">
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
                                  "rounded border p-4 space-y-3.5 transition-all text-left",
                                  isBest
                                    ? "border-cyan-500/70 bg-cyan-950/20 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/40"
                                    : isDefault
                                    ? "border-amber-500/60 bg-amber-950/20 shadow-sm"
                                    : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                                )}
                              >
                                {/* Header Phương Án */}
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-zinc-100 text-sm sm:text-base">{strat.name}</span>
                                    {isBest && (
                                      <span className="text-xs text-cyan-300 uppercase font-black bg-cyan-950/80 border border-cyan-400 px-2 py-0.5 rounded">
                                        ★ ĐỀ XUẤT SYSTEM AUTO
                                      </span>
                                    )}
                                    {isDefault && (
                                      <span className="text-xs text-amber-300 uppercase font-bold bg-amber-950/70 border border-amber-500/60 px-2 py-0.5 rounded">
                                        MẶC ĐỊNH
                                      </span>
                                    )}
                                  </div>

                                  {/* Thời gian thực thi */}
                                  <span className="text-zinc-300 font-mono text-xs sm:text-[13px]">
                                    Thời gian: <strong className="text-cyan-300">{strat.processingTicks} ngày</strong>
                                  </span>
                                </div>

                                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed bg-black/30 p-3 rounded border border-zinc-800/80">
                                  {strat.description}
                                </p>

                                {/* Bảng Tác Động Chiến Lược Thực Tế */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-zinc-950/80 p-3 rounded border border-zinc-800">
                                  <div>
                                    <span className="text-zinc-400 text-xs block mb-0.5">Độ ổn định:</span>
                                    <span
                                      className={cn(
                                        "font-bold text-sm",
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
                                    <span className="text-zinc-400 text-xs block mb-0.5">Mức đe dọa:</span>
                                    <span
                                      className={cn(
                                        "font-bold text-sm",
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

                                  <div>
                                    <span className="text-zinc-400 text-xs block mb-0.5">Xác suất thành công:</span>
                                    <span
                                      className={cn(
                                        "font-bold text-sm",
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
                                    <span className="text-zinc-400 text-xs block mb-0.5">Yêu cầu tác chiến:</span>
                                    <span className="font-bold text-zinc-200 text-sm">
                                      {strat.requiresCombat ? "Buồng Lái Arena" : "Tự Động Hóa"}
                                    </span>
                                  </div>
                                </div>

                                {/* Chi Phí & Điều Kiện Quân Dự Bị */}
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-zinc-300 font-medium">Chi phí & Lực lượng:</span>
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
                                                  "px-2 py-0.5 rounded border font-mono font-bold text-xs",
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
                                              "px-2 py-0.5 rounded border font-mono font-bold text-xs",
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

                                  {/* Nút Xem Công Thức / Điểm Số */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedReasonKeys((prev) => ({
                                        ...prev,
                                        [reasonKey]: !prev[reasonKey],
                                      }))
                                    }
                                    className="text-zinc-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5 text-xs cursor-pointer font-medium"
                                  >
                                    <Info className="size-3.5 text-cyan-400" />
                                    <span>
                                      {isExpanded
                                        ? "Ẩn công thức chấm điểm"
                                        : `Điểm chiến lược: ${scoreInfo.score > 0 ? `+${scoreInfo.score}` : scoreInfo.score}đ (Chi tiết)`}
                                    </span>
                                  </button>
                                </div>

                                {/* Chi Tiết Điểm Số Nếu Bật */}
                                {isExpanded && (
                                  <div className="rounded bg-black/60 p-3 border border-zinc-800 text-xs space-y-1.5 text-zinc-300 animate-fadeIn">
                                    <div className="font-bold text-cyan-400 uppercase text-xs flex items-center justify-between border-b border-zinc-800/80 pb-1">
                                      <span>Hệ số đánh giá chiến lược:</span>
                                      <span className="font-mono text-cyan-300 font-bold">{scoreInfo.score} Điểm</span>
                                    </div>
                                    {scoreInfo.reasons.map((r, rIdx) => (
                                      <div key={rIdx} className="leading-relaxed text-zinc-300">
                                        • {r}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Lỗi thiếu tài nguyên/quân */}
                                {!canAfford && validation.reason && (
                                  <div className="text-xs sm:text-[13px] text-red-300 bg-red-950/40 p-2.5 rounded border border-red-500/40 flex items-center gap-2">
                                    <AlertOctagon className="size-4 text-red-400 shrink-0" />
                                    <span>{validation.reason}</span>
                                  </div>
                                )}

                                {/* Nút Phê Chuẩn */}
                                <div className="pt-1.5">
                                  <button
                                    type="button"
                                    disabled={!canAfford}
                                    onClick={() => {
                                      playClickSound()
                                      onChooseStrategy(activeSelectedInitEvent.id, strat.id)
                                    }}
                                    className={cn(
                                      "w-full py-3 px-4 rounded text-xs sm:text-sm font-bold transition-all text-center cursor-pointer tracking-wide shadow-md",
                                      !canAfford
                                        ? "border border-zinc-800 bg-zinc-900 text-zinc-500 cursor-not-allowed"
                                        : isBest
                                        ? "border border-cyan-400 bg-cyan-600/30 text-cyan-200 hover:bg-cyan-600/50 hover:text-white shadow-cyan-950/60"
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
          <div className="lg:col-span-4 flex flex-col rounded border border-cyan-500/30 bg-zinc-950/90 shadow-xl overflow-hidden min-h-[540px] max-h-[760px]">
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/70 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-cyan-400" />
                <span className="font-bold uppercase tracking-wider text-cyan-200 text-xs sm:text-sm">
                  SỰ KIỆN ĐANG TRIỂN KHAI
                </span>
                <span className="rounded bg-black/60 px-2 py-0.5 text-xs text-cyan-300 border border-zinc-700 font-mono font-bold">
                  {filteredProcessingEvents.length}
                </span>
              </div>
              <span className="text-xs text-zinc-400">Giám sát tiến độ</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 pr-2 scrollbar-thin">
              {filteredProcessingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400 space-y-2.5">
                  <Clock className="size-9 text-zinc-600" />
                  <div className="font-bold text-zinc-200 text-sm">Không có sự kiện nào đang xử lý.</div>
                  <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
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
                        "rounded border p-3.5 transition-all cursor-pointer relative text-left group",
                        isSelected
                          ? "border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-500/60 shadow-md shadow-cyan-950/40"
                          : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute left-0 top-0 bottom-0 w-1.5 rounded-l transition-colors",
                          isSelected ? "bg-cyan-400" : "bg-cyan-600/70"
                        )}
                      />

                      <div className="pl-2 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                          <span className="flex items-center gap-1.5 font-bold text-zinc-300 uppercase">
                            {getCategoryIcon(event.category)}
                            <span>{event.category}</span>
                          </span>

                          <span className="rounded bg-cyan-950/80 border border-cyan-500/60 px-2 py-0.5 text-xs text-cyan-300 font-bold font-mono">
                            {progressPct}% · Ngày #{completeTick}
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-1.5">
                          <span
                            className={cn(
                              "font-bold text-sm sm:text-[15px] leading-snug line-clamp-2",
                              isSelected ? "text-cyan-200" : "text-zinc-100 group-hover:text-cyan-300"
                            )}
                          >
                            {event.title}
                          </span>
                          {isSelected && (
                            <span className="text-xs text-cyan-400 uppercase font-black shrink-0 flex items-center gap-0.5 mt-0.5">
                              <span>ĐANG THEO DÕI</span>
                              <ChevronRight className="size-3" />
                            </span>
                          )}
                        </div>

                        {/* Thanh mini progress */}
                        <div className="h-2 w-full rounded bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-cyan-400 transition-all duration-300 rounded"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs text-zinc-300 pt-0.5 border-t border-zinc-800/60">
                          <span className="truncate max-w-[150px] font-medium">
                            {targetSector ? targetSector.name : "Toàn Vũ Trụ"}
                          </span>
                          <span className="truncate max-w-[160px] text-cyan-300 font-semibold font-mono">
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
          <div className="lg:col-span-8 flex flex-col rounded border border-cyan-500/30 bg-zinc-950/90 shadow-xl overflow-hidden min-h-[540px] max-h-[760px]">
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/70 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-cyan-400" />
                <span className="font-bold uppercase tracking-wider text-cyan-200 text-xs sm:text-sm">
                  TRẠM THEO DÕI TIẾN TRÌNH CHIẾN LƯỢC // EXECUTION MONITOR
                </span>
              </div>
              {activeSelectedProcessingEvent && (
                <span className="font-mono text-xs text-zinc-300 font-semibold">
                  MÃ SỰ KIỆN: {activeSelectedProcessingEvent.id}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 pr-3 scrollbar-thin">
              {!activeSelectedProcessingEvent ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[420px] text-center p-8 space-y-3">
                  <div className="rounded-full bg-zinc-900 p-4 border border-zinc-800 text-zinc-500">
                    <Clock className="size-10 text-zinc-400" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="font-bold text-zinc-200 text-base tracking-wide">
                      CHƯA CHỌN SỰ KIỆN ĐANG TRIỂN KHAI
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400 max-w-sm leading-relaxed">
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
                        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-zinc-800 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded text-xs font-bold uppercase border border-cyan-500/50 bg-cyan-950/70 text-cyan-200">
                              ĐANG TRIỂN KHAI (PROCESSING)
                            </span>
                            <span className="text-xs uppercase font-mono font-semibold px-2.5 py-1 rounded bg-black/60 border border-zinc-700 text-zinc-300">
                              {event.strategySource === "system_auto"
                                ? "Nguồn: System Auto"
                                : event.strategySource === "default_fallback"
                                ? "Nguồn: Tự Động Khóa Mặc Định"
                                : "Nguồn: Chỉ Huy Phê Chuẩn"}
                            </span>
                          </div>

                          <span className="font-mono text-cyan-300 text-xs sm:text-[13px] font-bold">
                            Hoàn tất vào Ngày #{completeTick} (Còn {remainingTicks} ngày)
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <h3 className="text-base sm:text-lg font-bold text-zinc-100 leading-snug">{event.title}</h3>
                          <p className="text-sm text-zinc-200 leading-relaxed bg-black/40 p-3 rounded border border-zinc-800">
                            {event.description}
                          </p>
                        </div>

                        {targetSector && (
                          <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-950/60 p-2.5 rounded border border-zinc-800/80 text-xs text-zinc-300">
                            <div className="flex flex-wrap items-center gap-2">
                              <MapPin className="size-3.5 text-cyan-400 shrink-0" />
                              <span>Sector: <strong className="text-zinc-100">{targetSector.name}</strong></span>
                              <span className="text-zinc-600">·</span>
                              <span>Ổn định: <strong className="text-emerald-400">{targetSector.stability}%</strong></span>
                              <span className="text-zinc-600">·</span>
                              <span>Đe dọa: <strong className="text-amber-400">{targetSector.threatLevel.toLocaleString()} / {getSectorMaxThreat(targetSector, worldState.threatConfig).toLocaleString()}</strong></span>
                            </div>

                            <button
                              type="button"
                              onClick={() => onNavigateToSector?.(targetSector.id)}
                              className="text-cyan-400 hover:text-cyan-200 underline cursor-pointer text-xs font-bold"
                            >
                              Xem trên bản đồ &rarr;
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Tiến Trình Thực Thi Thực Tế */}
                      <div className="rounded border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="font-bold text-zinc-200 uppercase">Tiến Độ Xử Lý Thực Tế:</span>
                          <span className="font-mono font-bold text-cyan-300 text-sm">{progressPct}% Hoàn Tất</span>
                        </div>

                        <div className="h-3 w-full rounded bg-zinc-800 overflow-hidden p-0.5 border border-zinc-700">
                          <div
                            className="h-full bg-cyan-400 transition-all duration-300 rounded shadow-sm shadow-cyan-400/50"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                          <div className="bg-black/40 p-2.5 rounded border border-zinc-800">
                            <span className="text-zinc-400 text-xs block mb-0.5">Bắt đầu:</span>
                            <span className="font-mono text-zinc-100 font-bold text-xs sm:text-[13px]">Ngày #{startTick}</span>
                          </div>
                          <div className="bg-black/40 p-2.5 rounded border border-zinc-800">
                            <span className="text-zinc-400 text-xs block mb-0.5">Thời gian xử lý:</span>
                            <span className="font-mono text-cyan-300 font-bold text-xs sm:text-[13px]">{totalTicks} Ngày</span>
                          </div>
                          <div className="bg-black/40 p-2.5 rounded border border-zinc-800">
                            <span className="text-zinc-400 text-xs block mb-0.5">Dự kiến kết thúc:</span>
                            <span className="font-mono text-emerald-400 font-bold text-xs sm:text-[13px]">Ngày #{completeTick}</span>
                          </div>
                        </div>
                      </div>

                      {/* Phương Án Đang Được Thực Thi & Hậu Quả Dự Kiến */}
                      <div className="rounded border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
                        <div className="font-bold uppercase text-zinc-200 text-xs sm:text-sm flex items-center gap-2">
                          <Zap className="size-4 text-cyan-400" />
                          <span>Phương Án Đang Thực Thi: {chosenStrat?.name || event.chosenStrategyId}</span>
                        </div>

                        <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed bg-black/40 p-3 rounded border border-zinc-800">
                          {chosenStrat?.description}
                        </p>

                        {event.selectionReason && (
                          <div className="rounded bg-cyan-950/30 border border-cyan-500/30 p-3 text-xs sm:text-[13px] text-cyan-200 leading-relaxed">
                            <strong>Lý do lựa chọn:</strong> {event.selectionReason}
                          </div>
                        )}

                        {event.encounterTransactionId && (
                          <div className="rounded bg-amber-950/40 border border-amber-500/50 p-3 text-xs sm:text-[13px] text-amber-200 flex items-center gap-2.5">
                            <Swords className="size-5 text-amber-400 shrink-0" />
                            <div className="leading-relaxed">
                              <strong className="block text-amber-300 font-bold mb-0.5">Yêu cầu can thiệp chiến thuật:</strong>
                              Sự kiện đang gắn với một trận đánh thực địa (TxID: {event.encounterTransactionId}). Hãy chuyển sang buồng lái Đấu Trường để giải quyết trận đấu.
                            </div>
                          </div>
                        )}

                        {/* Không hiển thị bất kỳ nút phê chuẩn nào - Bảo vệ lũy đẳng */}
                        <div className="rounded bg-zinc-950 p-3 border border-zinc-800 text-zinc-300 text-xs sm:text-[13px] flex items-center gap-2.5 leading-relaxed">
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
      {/* ====================================================================
          5. CHẾ ĐỘ C: CHUỖI NHIỆM VỤ [CHAINS] (TIMELINE & PIPELINE CHIẾN LƯỢC TOÀN DIỆN)
          ==================================================================== */}
      {commandMode === "chains" && (
        <div className="space-y-4">
          {/* Header & Danh Sách Tuyến Nhiệm Vụ */}
          {filteredChains.length === 0 ? (
            <div className="rounded border border-dashed border-zinc-800 bg-zinc-950/60 p-12 text-center text-zinc-400 space-y-2.5">
              <GitBranch className="size-9 mx-auto text-zinc-600" />
              <div className="font-bold text-zinc-200 text-sm">Không có chuỗi nhiệm vụ nào đang hoạt động.</div>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
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
                    className="rounded border border-indigo-500/40 bg-zinc-950/90 p-4 sm:p-5 space-y-4 shadow-xl"
                  >
                    {/* Header Chuỗi Nhiệm Vụ */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="rounded bg-indigo-950/80 px-3 py-1 text-xs text-indigo-300 border border-indigo-500/60 uppercase font-black tracking-wide">
                          {chain.topology}
                        </span>
                        <div>
                          <h3 className="font-bold text-zinc-100 text-sm sm:text-base">{chain.title}</h3>
                          <span className="text-xs text-zinc-400 font-mono">Mã chuỗi: {chain.id} · Bắt đầu: Ngày #{chain.startedAtTick}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs sm:text-[13px]">
                        <span className="text-zinc-400 font-medium">Tiến trình:</span>
                        <span className="rounded bg-indigo-950/60 px-2.5 py-1 border border-indigo-500/40 font-mono font-bold text-cyan-300">
                          {progressFraction} Bước ({progressPct}%)
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed bg-black/30 p-3 rounded border border-zinc-800/80">
                      {chain.description}
                    </p>

                    {/* Timeline / Horizontal Stepper Pipeline */}
                    <div className="space-y-2.5">
                      <div className="text-xs font-bold text-zinc-300 uppercase tracking-wide flex items-center justify-between">
                        <span>LỘ TRÌNH TỪNG BƯỚC (MISSION PIPELINE TIMELINE):</span>
                        <span className="text-zinc-400">{nodesList.length} Nút Chiến Thuật</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
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
                                "rounded border p-4 flex flex-col justify-between space-y-3.5 transition-all relative",
                                isCompleted
                                  ? "border-emerald-500/50 bg-emerald-950/20 text-emerald-200"
                                  : isActive
                                  ? isPending
                                    ? "border-amber-500/70 bg-amber-950/25 shadow-md shadow-amber-950/30"
                                    : "border-cyan-500/70 bg-cyan-950/30 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/40"
                                  : "border-zinc-800 bg-zinc-900/30 text-zinc-500 opacity-70"
                              )}
                            >
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between gap-1.5 text-xs">
                                  <span className="font-bold uppercase text-zinc-400 font-mono">
                                    Bước {idx + 1} / {nodesList.length}
                                  </span>

                                  {isCompleted && (
                                    <span className="flex items-center gap-1.5 text-emerald-300 font-bold uppercase text-xs bg-emerald-950/80 border border-emerald-500/50 px-2 py-0.5 rounded">
                                      <CheckCircle2 className="size-3.5 text-emerald-400" />
                                      Đã Hoàn Tất
                                    </span>
                                  )}
                                  {isActive && !isPending && (
                                    <span className="flex items-center gap-1.5 text-cyan-300 font-bold uppercase text-xs bg-cyan-950/80 border border-cyan-500/60 px-2 py-0.5 rounded animate-pulse">
                                      <span className="size-2 rounded-full bg-cyan-400 animate-ping" />
                                      Đang Hoạt Động
                                    </span>
                                  )}
                                  {isPending && (
                                    <span className="flex items-center gap-1.5 text-amber-300 font-bold uppercase text-xs bg-amber-950/80 border border-amber-500/70 px-2 py-0.5 rounded animate-pulse">
                                      <Clock className="size-3.5 text-amber-400" />
                                      Đang Chờ Điều Kiện
                                    </span>
                                  )}
                                  {isLocked && (
                                    <span className="flex items-center gap-1.5 text-zinc-400 font-bold uppercase text-xs">
                                      <Lock className="size-3.5" />
                                      Chưa Mở Khóa
                                    </span>
                                  )}
                                </div>

                                <div className="font-bold text-zinc-100 text-sm sm:text-[15px] leading-snug">{node.title}</div>
                                <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed line-clamp-3">
                                  {node.description}
                                </p>
                              </div>

                              <div className="border-t border-zinc-800/80 pt-3 space-y-2 text-xs">
                                {targetSector && (
                                  <div className="flex items-center justify-between gap-1.5 text-zinc-300">
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="size-3.5 text-cyan-400 shrink-0" />
                                      <span>Sector: <strong className="text-zinc-100">{targetSector.name}</strong></span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => onNavigateToSector?.(targetSector.id)}
                                      className="text-cyan-400 hover:text-cyan-200 underline cursor-pointer text-xs font-bold"
                                    >
                                      Bản đồ &rarr;
                                    </button>
                                  </div>
                                )}

                                {isPending && (
                                  <div className="rounded bg-amber-950/40 border border-amber-500/40 p-2.5 text-xs text-amber-200 space-y-1">
                                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                                      <AlertTriangle className="size-3.5 text-amber-400" />
                                      <span>Đang chờ giải tỏa điều kiện</span>
                                    </div>
                                    <p className="text-xs text-zinc-300 leading-relaxed">
                                      {node.dispatchDeferredTicks !== undefined ? (
                                        <span>Đã chờ {node.dispatchDeferredTicks}/{MAX_DISPATCH_DEFER_TICKS} ngày trước khi tự động giải tỏa.</span>
                                      ) : (
                                        <span>Nhiệm vụ đang chờ sector sẵn sàng để kích hoạt sự kiện tiếp theo.</span>
                                      )}
                                    </p>
                                  </div>
                                )}

                                {node.rewardSummary && (
                                  <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                                    <Sparkles className="size-3 text-emerald-400 shrink-0" />
                                    <span>Thưởng: {node.rewardSummary}</span>
                                  </div>
                                )}

                                {isLocked && node.requiredPreviousNodeIds && (
                                  <div className="text-xs text-zinc-400 italic">
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

      {/* ====================================================================
          6. CHẾ ĐỘ D: ĐIỀU PHỐI TÁC CHIẾN [DISPATCH] (PHASE 6.31)
          ==================================================================== */}
      {commandMode === "dispatches" && (
        <div className="space-y-3.5 font-mono text-sm leading-normal">
          {/* 6.1. THANH CHỈ HUY TRỰC TIẾP & TẠO LỆNH ĐIỀU PHỐI */}
          <div className="rounded border border-border/80 bg-zinc-950/90 p-4 shadow-md backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Crosshair className="size-4.5 text-amber-400" />
                  <span className="font-bold text-amber-300 uppercase tracking-wide text-sm sm:text-base">
                    ĐIỀU PHỐI CHIẾN DỊCH & LƯU TRỮ TÁC CHIẾN // MISSION DISPATCH
                  </span>
                </div>
                {activePlayerMission ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px] text-zinc-200">
                    <span className="flex items-center gap-1.5 rounded bg-cyan-950/80 px-2.5 py-1 text-cyan-300 border border-cyan-500/50 font-bold">
                      <UserCheck className="size-3.5 text-cyan-400" />
                      ĐANG CHỈ HUY: &quot;{activePlayerMission.title}&quot;
                    </span>
                    <span className="text-zinc-500">·</span>
                    <span className="text-zinc-300">
                      Sector: {worldState.sectors[activePlayerMission.sectorId]?.name}
                    </span>
                    <span className="text-zinc-500">·</span>
                    <span className="text-amber-400 font-bold font-mono">
                      {activePlayerMission.status === "PREPARE"
                        ? `Còn ${Math.max(0, activePlayerMission.prepareDeadlineTick - worldState.currentDay)} ngày PREPARE`
                        : `Đang tác chiến (Xong ngày #${activePlayerMission.processingCompletesTick})`}
                    </span>
                    {activePlayerMission.status === "PREPARE" && (
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound()
                          const res = playerWithdrawMission(worldState, activePlayerMission.id)
                          if (res.success) {
                            saveWorldState(worldState)
                            setDispatchFeedback(res.message)
                            onStateUpdated?.()
                          }
                        }}
                        className="ml-1 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer font-medium"
                        title="Bàn giao lại quyền chỉ huy về đồn trú"
                      >
                        Rút Lui Chỉ Huy
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed">
                    <span className="text-emerald-400 font-bold">✓ Sẵn sàng nhận nhiệm vụ</span>: Bạn chưa chỉ huy nhiệm vụ nào. Người chơi có thể tiếp quản chỉ huy tối đa 1 nhiệm vụ tại một thời điểm.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound()
                    setIsCreateDispatchOpen(!isCreateDispatchOpen)
                  }}
                  className="flex items-center gap-2 rounded border border-amber-500/60 bg-amber-950/60 px-3.5 py-2 text-xs sm:text-sm font-bold text-amber-200 hover:bg-amber-900/60 hover:text-white transition-all cursor-pointer shadow-sm"
                >
                  <Crosshair className="size-4 text-amber-400" />
                  <span>+ Mở Lệnh Điều Phối Mới</span>
                </button>
              </div>
            </div>

            {/* Thông báo phản hồi tác vụ */}
            {dispatchFeedback && (
              <div className="mt-3 flex items-center justify-between rounded border border-amber-500/40 bg-amber-950/40 p-2.5 text-xs sm:text-[13px] text-amber-200 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-amber-400 shrink-0" />
                  <span>{dispatchFeedback}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDispatchFeedback(null)}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* 6.2. HỘP THOẠI / FORM TẠO LỆNH ĐIỀU PHỐI MỚI */}
          {isCreateDispatchOpen && (
            <div className="rounded border border-amber-500/50 bg-zinc-950/95 p-4 sm:p-5 space-y-3.5 shadow-lg animate-fadeIn">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Crosshair className="size-4 text-amber-400" />
                  <span className="font-bold text-amber-300 uppercase text-xs sm:text-sm">
                    THIẾT LẬP LỆNH ĐIỀU PHỐI MỚI (6 HÌNH THÁI MỤC TIÊU)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateDispatchOpen(false)}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs sm:text-[13px]">
                {/* 1. Chọn hình thái mục tiêu */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-bold block">
                    Hình Thái Mục Tiêu (Objective Category):
                  </label>
                  <select
                    value={newDispatchCategory}
                    onChange={(e) => setNewDispatchCategory(e.target.value as MissionObjectiveCategory)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs sm:text-[13px] text-zinc-200 focus:border-amber-400 focus:outline-none cursor-pointer"
                  >
                    <option value="patrol">Tuần Tra Tuyến Phòng Ngự (Patrol)</option>
                    <option value="escort">Hộ Tống Đoàn Vận Tải (Escort)</option>
                    <option value="defend">Gia Cố & Phòng Thủ Tiền Đồn (Defend)</option>
                    <option value="raid">Đột Kích Căn Cứ Tiền Phương The Void (Raid)</option>
                    <option value="eliminate">Tiêu Diệt Chỉ Huy Tiên Phong (Eliminate)</option>
                    <option value="threat_containment">Khống Chế Điểm Nóng Đe Dọa (Threat Containment)</option>
                  </select>
                </div>

                {/* 2. Chọn Sector */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-bold block">
                    Sector Địa Bàn Tác Chiến:
                  </label>
                  <select
                    value={newDispatchSectorId}
                    onChange={(e) => setNewDispatchSectorId(e.target.value)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs sm:text-[13px] text-zinc-200 focus:border-amber-400 focus:outline-none cursor-pointer"
                  >
                    {Object.values(worldState.sectors).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.sovereignty.toUpperCase()} · Threat: {s.threatLevel} · Ổn định: {s.stability}%)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Thời gian chuẩn bị (PREPARE duration) */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-bold block">
                    Thời Gian Chuẩn Bị (PREPARE Duration):
                  </label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="range"
                      min={1}
                      max={4}
                      value={newDispatchDuration}
                      onChange={(e) => setNewDispatchDuration(Number(e.target.value))}
                      className="flex-1 accent-amber-400 cursor-pointer"
                    />
                    <span className="font-mono text-amber-300 font-bold w-20 text-right text-xs sm:text-sm">
                      {newDispatchDuration} ngày
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Khi hết {newDispatchDuration} ngày mà người chơi không trực tiếp tham gia, NPC đồn trú sẽ tự động tiếp quản chỉ huy để nhiệm vụ không bị đóng băng.
                  </p>
                </div>

                {/* 4. Tiêu đề tùy chỉnh */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-bold block">
                    Tiêu Đề Tùy Chỉnh (Tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={newDispatchTitle}
                    onChange={(e) => setNewDispatchTitle(e.target.value)}
                    placeholder="Để trống để sử dụng tiêu đề chuẩn..."
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs sm:text-[13px] text-zinc-200 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Xem trước mục tiêu chuẩn */}
              {worldState.sectors[newDispatchSectorId] && (
                <div className="rounded border border-zinc-800 bg-zinc-900/50 p-3 text-xs sm:text-[13px] space-y-1.5">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="font-bold text-zinc-200 uppercase">Xem Trước Mục Tiêu Chuẩn Hóa:</span>
                    <span className="text-amber-400 uppercase font-mono font-bold">{newDispatchCategory}</span>
                  </div>
                  <div className="text-zinc-100 font-bold text-sm">
                    {createStandardObjective(newDispatchCategory, worldState.sectors[newDispatchSectorId]).title}
                  </div>
                  <div className="text-emerald-400 font-medium">
                    Tiêu chí thành công: {createStandardObjective(newDispatchCategory, worldState.sectors[newDispatchSectorId]).successCriteriaText}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2.5 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateDispatchOpen(false)}
                  className="rounded border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs sm:text-[13px] text-zinc-300 hover:text-white cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound()
                    const sector = worldState.sectors[newDispatchSectorId]
                    if (!sector) return

                    const stdObj = createStandardObjective(newDispatchCategory, sector)
                    const title = newDispatchTitle.trim() || stdObj.title
                    const desc = stdObj.description

                    const res = createMissionDispatch(worldState, {
                      title,
                      description: desc,
                      category: newDispatchCategory,
                      sectorId: newDispatchSectorId,
                      prepareDurationTicks: newDispatchDuration,
                    })

                    if (res.success && res.dispatch) {
                      saveWorldState(worldState)
                      setSelectedDispatchId(res.dispatch.id)
                      setIsCreateDispatchOpen(false)
                      setNewDispatchTitle("")
                      setDispatchFeedback(`Đã thiết lập thành công lệnh điều phối "${title}". Đang ở giai đoạn PREPARE.`)
                      playShieldSound()
                      onStateUpdated?.()
                    } else {
                      setDispatchFeedback(res.error || "Không thể khởi tạo lệnh điều phối.")
                    }
                  }}
                  className="rounded border border-amber-400 bg-amber-600/40 px-4 py-2 text-xs sm:text-sm font-bold text-amber-200 hover:bg-amber-600/60 hover:text-white transition-all cursor-pointer shadow-md"
                >
                  Xác Nhận Thiết Lập Điều Phối
                </button>
              </div>
            </div>
          )}

          {/* 6.3. BỘ LỌC TRẠNG THÁI NHIỆM VỤ */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-1.5">
              {(
                [
                  { key: "all", label: "Tất Cả", count: dispatchesList.length },
                  {
                    key: "prepare",
                    label: "Chuẩn Bị (PREPARE)",
                    count: dispatchesList.filter((d) => d.status === "PREPARE").length,
                  },
                  {
                    key: "processing",
                    label: "Đang Tác Chiến",
                    count: dispatchesList.filter((d) => d.status === "PROCESSING").length,
                  },
                  {
                    key: "resolved",
                    label: "Đã Kết Thúc",
                    count: dispatchesList.filter(
                      (d) => d.status === "COMPLETED" || d.status === "FAILED" || d.status === "ABORTED"
                    ).length,
                  },
                ] as const
              ).map(({ key, label, count }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    playClickSound()
                    setDispatchFilterMode(key)
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded border transition-colors cursor-pointer text-xs font-bold uppercase",
                    dispatchFilterMode === key
                      ? "border-amber-400 bg-amber-950/70 text-amber-200 shadow-xs"
                      : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {label} ({count})
                </button>
              ))}
            </div>

            <div className="text-xs text-zinc-400 font-mono">
              Hiển thị: {filteredDispatches.length} / {dispatchesList.length} nhiệm vụ
            </div>
          </div>

          {/* 6.4. BỐ CỤC 2 CỘT: DANH SÁCH & CHI TIẾT ĐIỀU PHỐI */}
          {filteredDispatches.length === 0 ? (
            <div className="rounded border border-dashed border-zinc-800 p-8 text-center text-zinc-400 space-y-2.5">
              <Crosshair className="size-9 mx-auto text-zinc-600" />
              <div className="font-bold text-zinc-200 text-sm">Không có lệnh điều phối nào trong bộ lọc này</div>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                Bấm &quot;+ Mở Lệnh Điều Phối Mới&quot; ở trên để triển khai nhiệm vụ tuần tra, hộ tống, phòng thủ, đột kích, tiêu diệt mục tiêu hoặc khống chế đe dọa.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
              {/* CỘT TRÁI: DANH SÁCH CARDS (5/12) */}
              <div className="lg:col-span-5 space-y-2.5 max-h-[680px] overflow-y-auto pr-1.5 scrollbar-thin">
                {filteredDispatches.map((dispatch) => {
                  const isSelected = selectedDispatchId === dispatch.id
                  const sector = worldState.sectors[dispatch.sectorId]
                  const isPlayerLeading = dispatch.participant?.type === "player"
                  const isNPCLeading = dispatch.participant?.type === "npc"

                  return (
                    <div
                      key={dispatch.id}
                      onClick={() => {
                        playClickSound()
                        setSelectedDispatchId(dispatch.id)
                      }}
                      className={cn(
                        "rounded border p-3.5 space-y-2.5 cursor-pointer transition-all",
                        isSelected
                          ? "border-amber-400/80 bg-amber-950/30 ring-1 ring-amber-400/50 shadow-md"
                          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900/80"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-bold uppercase text-amber-300 border border-zinc-700">
                              {dispatch.category}
                            </span>
                            <span className="font-bold text-zinc-100 text-sm truncate">
                              {dispatch.title}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-300 flex items-center gap-1.5">
                            <MapPin className="size-3 text-cyan-400" />
                            <span>{sector?.name || dispatch.sectorId}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-bold uppercase shrink-0 border",
                            dispatch.status === "PREPARE"
                              ? "bg-amber-950/80 text-amber-300 border-amber-500/50"
                              : dispatch.status === "PROCESSING"
                              ? "bg-cyan-950/80 text-cyan-300 border-cyan-500/50 animate-pulse"
                              : dispatch.status === "COMPLETED"
                              ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
                              : dispatch.status === "FAILED"
                              ? "bg-rose-950/80 text-rose-300 border-rose-500/50"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700"
                          )}
                        >
                          {dispatch.status === "PREPARE"
                            ? "PREPARE"
                            : dispatch.status === "PROCESSING"
                            ? "PROCESSING"
                            : dispatch.status === "COMPLETED"
                            ? "THẮNG"
                            : dispatch.status === "FAILED"
                            ? "THUA"
                            : "HỦY"}
                        </span>
                      </div>

                      {/* Commander Tag & Timers */}
                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-zinc-800/60">
                        <div className="flex items-center gap-1.5">
                          {isPlayerLeading ? (
                            <span className="flex items-center gap-1 text-cyan-300 font-bold">
                              <User className="size-3.5 text-cyan-400" />
                              Chỉ Huy Trực Tiếp
                            </span>
                          ) : isNPCLeading ? (
                            <span className="flex items-center gap-1 text-indigo-300 font-semibold">
                              <Shield className="size-3.5 text-indigo-400" />
                              NPC Tiếp Quản
                            </span>
                          ) : (
                            <span className="text-zinc-500 italic">Chờ Chỉ Huy</span>
                          )}
                        </div>

                        <div className="font-mono text-xs">
                          {dispatch.status === "PREPARE" && (
                            <span className="text-amber-400 font-semibold">
                              Hạn: Ngày #{dispatch.prepareDeadlineTick} (Còn {Math.max(0, dispatch.prepareDeadlineTick - worldState.currentDay)} ngày)
                            </span>
                          )}
                          {dispatch.status === "PROCESSING" && (
                            <span className="text-cyan-400 font-semibold">
                              Xong: Ngày #{dispatch.processingCompletesTick} (Còn {Math.max(0, (dispatch.processingCompletesTick || 0) - worldState.currentDay)} ngày)
                            </span>
                          )}
                          {(dispatch.status === "COMPLETED" || dispatch.status === "FAILED" || dispatch.status === "ABORTED") && (
                            <span className="text-zinc-400">Hoàn tất</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* CỘT PHẢI: CHI TIẾT NHIỆM VỤ ĐƯỢC CHỌN (7/12) */}
              <div className="lg:col-span-7">
                {activeSelectedDispatch ? (
                  <div className="rounded border border-zinc-800 bg-zinc-950/80 p-4 sm:p-5 space-y-4 shadow-md">
                    {/* Header nhiệm vụ */}
                    <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-amber-500/20 px-2.5 py-1 text-xs font-bold uppercase text-amber-300 border border-amber-500/40">
                            {activeSelectedDispatch.category}
                          </span>
                          <span className="font-mono text-zinc-400 text-xs">ID: {activeSelectedDispatch.id}</span>
                        </div>
                        <h3 className="font-bold text-zinc-100 text-base sm:text-lg leading-snug">
                          {activeSelectedDispatch.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                          {activeSelectedDispatch.description}
                        </p>
                      </div>

                      {onNavigateToSector && (
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound()
                            onNavigateToSector(activeSelectedDispatch.sectorId)
                          }}
                          className="shrink-0 flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 hover:text-cyan-300 hover:border-cyan-500 cursor-pointer font-medium"
                          title="Xem Sector trên Galaxy Map"
                        >
                          <MapPin className="size-3.5 text-cyan-400" />
                          <span>Galaxy Map</span>
                        </button>
                      )}
                    </div>

                    {/* Khung điều khiển Chỉ Huy & Lực Lượng */}
                    <div className="rounded border border-zinc-800/80 bg-zinc-900/60 p-3.5 space-y-3">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-bold text-zinc-200 uppercase tracking-wide">
                          Phân Định Quyền Chỉ Huy & Lực Lượng:
                        </span>
                        <span className="font-mono text-xs text-zinc-400">
                          Trạng Thái: <strong className="text-amber-300 uppercase">{activeSelectedDispatch.status}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-[13px]">
                        <div className="rounded border border-zinc-800 bg-black/40 p-2.5 space-y-1">
                          <span className="text-zinc-400 block text-xs">CHỈ HUY HIỆN TẠI:</span>
                          {activeSelectedDispatch.participant?.type === "player" ? (
                            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                              <UserCheck className="size-4 text-cyan-400" />
                              <span>{activeSelectedDispatch.participant.name} (Người Chơi Trực Tiếp)</span>
                            </div>
                          ) : activeSelectedDispatch.participant?.type === "npc" ? (
                            <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                              <Shield className="size-4 text-indigo-400" />
                              <span>{activeSelectedDispatch.participant.name} (NPC Tiếp Quản)</span>
                            </div>
                          ) : (
                            <div className="text-amber-400 font-semibold italic">
                              Chưa có chỉ huy trực tiếp (Sẵn sàng tiếp quản)
                            </div>
                          )}
                        </div>

                        <div className="rounded border border-zinc-800 bg-black/40 p-2.5 space-y-1">
                          <span className="text-zinc-400 block text-xs">LỰC LƯỢNG ĐỒN TRÚ ĐIỀU ĐỘNG:</span>
                          <div className="font-bold text-zinc-100 text-sm font-mono">
                            {(activeSelectedDispatch.assignedForces?.garrisonTroops || 0).toLocaleString()} quân
                          </div>
                        </div>
                      </div>

                      {/* Tác vụ trong giai đoạn PREPARE */}
                      {activeSelectedDispatch.status === "PREPARE" && (
                        <div className="pt-2.5 border-t border-zinc-800 space-y-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Nút Tiếp Quản hoặc Rút Lui */}
                            {activeSelectedDispatch.participant?.type === "player" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  playClickSound()
                                  const res = playerWithdrawMission(worldState, activeSelectedDispatch.id)
                                  if (res.success) {
                                    saveWorldState(worldState)
                                    setDispatchFeedback(res.message)
                                    onStateUpdated?.()
                                  }
                                }}
                                className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs sm:text-[13px] font-bold text-zinc-300 hover:text-white cursor-pointer"
                              >
                                <UserMinus className="size-3.5 text-zinc-400" />
                                <span>Rút Lui Khỏi Vị Trí Chỉ Huy</span>
                              </button>
                            ) : (
                              (() => {
                                const check = canPlayerJoinMission(worldState, activeSelectedDispatch.id)
                                return (
                                  <button
                                    type="button"
                                    disabled={!check.allowed}
                                    onClick={() => {
                                      playClickSound()
                                      const res = playerJoinMission(worldState, activeSelectedDispatch.id, {
                                        pilotName: "Chỉ Huy VSS",
                                      })
                                      if (res.success) {
                                        saveWorldState(worldState)
                                        setDispatchFeedback(res.message)
                                        playShieldSound()
                                        onStateUpdated?.()
                                      } else {
                                        setDispatchFeedback(res.message)
                                      }
                                    }}
                                    className={cn(
                                      "flex items-center gap-1.5 rounded border px-3.5 py-2 text-xs sm:text-[13px] font-bold transition-all",
                                      check.allowed
                                        ? "border-cyan-400 bg-cyan-950/80 text-cyan-200 hover:bg-cyan-900 hover:text-white cursor-pointer shadow-md shadow-cyan-950/40"
                                        : "border-zinc-800 bg-zinc-900/50 text-zinc-500 cursor-not-allowed"
                                    )}
                                    title={check.reason}
                                  >
                                    <UserCheck className="size-4 text-cyan-400" />
                                    <span>Tiếp Quản Chỉ Huy Trực Tiếp</span>
                                  </button>
                                )
                              })()
                            )}

                            {/* Nút Bổ sung quân đồn trú */}
                            <button
                              type="button"
                              onClick={() => {
                                playClickSound()
                                const sector = worldState.sectors[activeSelectedDispatch.sectorId]
                                if (!sector) return
                                const troopsToAdd = Math.min(25, Math.floor(sector.garrisonPower * 0.2))
                                if (troopsToAdd <= 0) {
                                  setDispatchFeedback("Đồn trú tại Sector không còn đủ quân để bổ sung.")
                                  return
                                }
                                const res = assignGarrisonForcesToMission(
                                  worldState,
                                  activeSelectedDispatch.id,
                                  troopsToAdd
                                )
                                if (res.success) {
                                  saveWorldState(worldState)
                                  setDispatchFeedback(res.message)
                                  onStateUpdated?.()
                                } else {
                                  setDispatchFeedback(res.message)
                                }
                              }}
                              className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-white cursor-pointer"
                              title="Tăng cường thêm quân đồn trú từ căn cứ"
                            >
                              <Shield className="size-3.5 text-zinc-400" />
                              <span>+ Điều Động Quân Đồn Trú (+25)</span>
                            </button>

                            {/* Nút Hủy bỏ an toàn */}
                            <button
                              type="button"
                              onClick={() => {
                                playClickSound()
                                const res = abortMissionDispatch(
                                  worldState,
                                  activeSelectedDispatch.id,
                                  "Hủy bỏ theo quyết định của Bộ Chỉ Huy trong giai đoạn PREPARE."
                                )
                                if (res.success) {
                                  saveWorldState(worldState)
                                  setDispatchFeedback(res.message)
                                  onStateUpdated?.()
                                }
                              }}
                              className="ml-auto rounded border border-red-900/50 bg-red-950/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-900/40 cursor-pointer font-medium"
                            >
                              Hủy Nhiệm Vụ
                            </button>
                          </div>

                          {!canPlayerJoinMission(worldState, activeSelectedDispatch.id).allowed &&
                            activeSelectedDispatch.participant?.type !== "player" && (
                              <p className="text-xs text-amber-400">
                                ⚠ {canPlayerJoinMission(worldState, activeSelectedDispatch.id).reason}
                              </p>
                            )}
                        </div>
                      )}
                    </div>

                    {/* Khung Mục Tiêu Chuẩn Hóa */}
                    <div className="rounded border border-zinc-800 bg-zinc-900/40 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                        <span className="text-zinc-100 uppercase">MỤC TIÊU CHIẾN DỊCH:</span>
                        <span className="text-emerald-400 font-mono">
                          Tiến Độ: {activeSelectedDispatch.objective.currentProgress || 0}%
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-zinc-200">
                        {activeSelectedDispatch.objective.title}
                      </div>
                      <div className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed">
                        {activeSelectedDispatch.objective.description}
                      </div>

                      {/* Tiêu chí thành công */}
                      <div className="rounded bg-emerald-950/30 border border-emerald-500/30 p-2.5 text-xs text-emerald-300 space-y-1">
                        <div className="font-bold text-xs uppercase text-emerald-400">Tiêu Chí Hoàn Tất Tác Chiến:</div>
                        <div className="leading-relaxed">{activeSelectedDispatch.objective.successCriteriaText}</div>
                      </div>

                      {/* Thanh tiến độ */}
                      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, activeSelectedDispatch.objective.currentProgress || 0)}%` }}
                        />
                      </div>
                    </div>

                    {/* Tóm tắt kết quả nếu đã giải quyết */}
                    {activeSelectedDispatch.resultSummary && (
                      <div className="rounded border border-indigo-500/30 bg-indigo-950/20 p-3 text-xs sm:text-[13px] space-y-1.5">
                        <div className="font-bold text-indigo-300 text-xs uppercase">
                          KẾT QUẢ ĐÃ LƯU TRỮ (OPERATIONS ARCHIVE):
                        </div>
                        <div className="text-zinc-200 leading-relaxed">
                          {activeSelectedDispatch.resultSummary}
                        </div>
                        {onNavigateToResults && (
                          <button
                            type="button"
                            onClick={() => {
                              playClickSound()
                              onNavigateToResults()
                            }}
                            className="text-xs text-cyan-400 hover:text-cyan-200 underline cursor-pointer font-bold inline-block pt-1"
                          >
                            Xem chi tiết trong Trung Tâm Kết Quả Kép &rarr;
                          </button>
                        )}
                      </div>
                    )}

                    {/* DÒNG THỜI GIAN HÀNH ĐỘNG THỰC TẾ (AUTHENTIC ACTION TIMELINE) */}
                    <div className="space-y-2.5 pt-2 border-t border-zinc-800">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5 font-bold text-zinc-200 uppercase">
                          <Clock className="size-4 text-zinc-400" />
                          <span>NHẬT KÝ DÒNG THỜI GIAN THỰC TẾ // ACTION TIMELINE</span>
                        </div>
                        <span className="font-mono text-xs text-zinc-400">
                          {activeSelectedDispatch.actionTimeline.length} bản ghi
                        </span>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1.5 scrollbar-thin">
                        {activeSelectedDispatch.actionTimeline.map((entry, idx) => (
                          <div
                            key={entry.id || idx}
                            className="rounded border border-zinc-800/80 bg-black/40 p-2.5 text-xs font-mono space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-zinc-300">
                              <span className="font-bold text-zinc-100 text-xs sm:text-[13px]">{entry.title}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-400 text-xs">Ngày #{entry.tick}</span>
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded font-bold uppercase text-xs border",
                                    entry.actor.type === "player"
                                      ? "border-cyan-500/50 bg-cyan-950/60 text-cyan-300"
                                      : entry.actor.type === "npc"
                                      ? "border-indigo-500/50 bg-indigo-950/60 text-indigo-300"
                                      : "border-zinc-700 bg-zinc-800 text-zinc-400"
                                  )}
                                >
                                  {entry.actor.name}
                                </span>
                              </div>
                            </div>
                            <p className="text-zinc-300 text-xs font-sans leading-relaxed">
                              {entry.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded border border-dashed border-zinc-800 p-8 text-center text-zinc-400">
                    Chọn một nhiệm vụ từ danh sách bên trái để xem chi tiết và nhật ký điều phối.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

