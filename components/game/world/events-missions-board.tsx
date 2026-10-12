"use client"

import { useState, useMemo } from "react"
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  ExternalLink,
  Flame,
  GitBranch,
  Globe2,
  HelpCircle,
  Info,
  Layers,
  Lock,
  MapPin,
  RotateCcw,
  Shield,
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
  const [dismissedTickSummary, setDismissedTickSummary] = useState<number | null>(null)

  // 1. Phân loại sự kiện INIT (Cần ra quyết định) và PROCESSING (Đang chạy)
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

  const processingEvents = useMemo(() => {
    return activeEvents.filter((e) => e.status === "PROCESSING")
  }, [activeEvents])

  // 2. Lịch sử kết quả gần đây từ Archive (lấy tối đa 5 bản ghi mới nhất)
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
      case "threat":
        return <Shield className="size-3.5 text-red-400" />
      case "military":
        return <Swords className="size-3.5 text-amber-400" />
      case "economic":
        return <Boxes className="size-3.5 text-cyan-400" />
      case "diplomatic":
        return <Globe2 className="size-3.5 text-emerald-400" />
      case "anomaly":
        return <Sparkles className="size-3.5 text-purple-400" />
      default:
        return <Flame className="size-3.5 text-yellow-400" />
    }
  }

  // Helper hiển thị nhãn và phong cách Urgency theo thời hạn và mức độ
  const getUrgencyBadge = (event: WorldEvent) => {
    const daysRemaining = Math.max(0, event.decisionDeadlineTick - worldState.currentDay)
    const isCriticalSeverity = event.severity === "critical"
    const isExpiringUrgent = daysRemaining <= 1

    if (isExpiringUrgent || isCriticalSeverity) {
      return {
        label: isExpiringUrgent
          ? daysRemaining === 0
            ? "HẾT HẠN HÔM NAY // TỰ ĐỘNG KHÓA"
            : "CẤP BÁCH: HẾT HẠN TRONG 1 NGÀY"
          : "CẤP BÁCH: TỐI NGUY (CRITICAL)",
        classes: "border-red-500 bg-red-950/80 text-red-200 animate-pulse font-black shadow-sm shadow-red-950",
        icon: <AlertOctagon className="size-3.5 text-red-400 shrink-0" />,
        isUrgent: true,
      }
    }

    if (event.severity === "warning" || daysRemaining <= 2) {
      return {
        label: `CẢNH BÁO (CÒN ${daysRemaining} NGÀY)`,
        classes: "border-amber-500/80 bg-amber-950/60 text-amber-200 font-bold",
        icon: <AlertTriangle className="size-3.5 text-amber-400 shrink-0" />,
        isUrgent: false,
      }
    }

    return {
      label: `THÔNG TIN (CÒN ${daysRemaining} NGÀY)`,
      classes: "border-zinc-700 bg-zinc-900 text-zinc-300",
      icon: <Clock className="size-3.5 text-zinc-400 shrink-0" />,
      isUrgent: false,
    }
  }

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* ====================================================================
          1. HEADER THANH ĐIỀU PHỐI & PHÂN BỘ LỌC
          ==================================================================== */}
      <div className="rounded border border-zinc-800 bg-zinc-950/90 p-3.5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-sm">
              <Flame className="size-4 text-amber-400" />
              <span>BẢNG ĐIỀU HÀNH SỰ KIỆN & CHUỖI NHIỆM VỤ CHIẾN LƯỢC</span>
            </div>
            <p className="mt-1 text-zinc-400 text-[11px] leading-relaxed">
              Quản trị vòng đời 3 pha: INIT (Phê chuẩn) → PROCESSING (Triển khai) → RESULT (Kết quả) và tiến trình phân nhánh nhiệm vụ.
            </p>
          </div>

          {/* Quick Stat Counters */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px]",
                initEvents.length > 0
                  ? "border-amber-500/60 bg-amber-950/40 text-amber-300 font-bold animate-pulse"
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
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-zinc-800/80 pt-3 text-[11px]">
          <span className="text-zinc-500 font-bold uppercase mr-1">Bộ lọc:</span>
          {(
            [
              { id: "all", label: `Tất Cả Tổng Hợp (${activeEvents.length + activeMissionChains.length})` },
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
                  "px-2.5 py-1 rounded border transition-colors cursor-pointer flex items-center gap-1.5",
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
      </div>

      {/* ====================================================================
          2. BANNER TỔNG HỢP BIẾN ĐỘNG CHU KỲ (TICK LIFECYCLE SUMMARY)
          ==================================================================== */}
      {lastEventsSummary &&
        dismissedTickSummary !== worldState.currentDay &&
        (lastEventsSummary.autoLockedCount > 0 || lastEventsSummary.resolvedCount > 0) && (
          <div className="rounded border border-indigo-500/50 bg-indigo-950/40 p-3.5 space-y-2.5 animate-fadeIn">
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
              <div className="rounded border border-amber-500/30 bg-amber-950/20 p-2.5 space-y-1.5">
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
                <p className="text-[9px] text-zinc-400 italic">
                  * Đã chuyển sang trạng thái PROCESSING với chiến lược mặc định do hết thời hạn quyết định.
                </p>
              </div>

              {/* Cột 2: Sự kiện đã giải quyết / hoàn tất */}
              <div className="rounded border border-emerald-500/30 bg-emerald-950/20 p-2.5 space-y-1.5">
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
                <p className="text-[9px] text-zinc-400 italic">
                  * Hậu quả đã được áp dụng lũy đẳng vào World State và lưu trữ vào Results Archive.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* ====================================================================
          3. PHÂN MỤC A: SỰ KIỆN CẦN PHÊ CHUẨN (ACTIONABLE EVENTS - INIT)
          ==================================================================== */}
      {(filterMode === "all" || filterMode === "init") && (
        <section className="space-y-3">
          <div className="flex items-center justify-between text-zinc-300 text-[11px] border-b border-zinc-800 pb-1.5">
            <span className="font-bold uppercase tracking-wider flex items-center gap-2 text-amber-300">
              <AlertCircle className="size-4 text-amber-400" />
              <span>SỰ KIỆN CẦN PHÊ CHUẨN // CHỜ CHỈ HUY QUYẾT ĐỊNH ({initEvents.length})</span>
            </span>
            <span className="text-zinc-400 text-[10px]">
              Tự động kích hoạt phương án mặc định khi đếm ngược về 0 ngày
            </span>
          </div>

          {initEvents.length === 0 ? (
            <div className="rounded border border-dashed border-zinc-800 bg-zinc-950/40 p-6 text-center text-zinc-500">
              <CheckCircle2 className="size-6 text-emerald-500/60 mx-auto mb-2" />
              <span>Không có sự kiện khẩn cấp nào đang chờ quyết định. Mọi mặt trận đều ổn định.</span>
            </div>
          ) : (
            <div className="space-y-3.5">
              {initEvents.map((event) => {
                const urgency = getUrgencyBadge(event)
                const targetSector = event.sectorId ? worldState.sectors[event.sectorId] : null
                const defaultStrategy = event.availableStrategies.find((s) => s.id === event.defaultStrategyId)
                const daysRemaining = Math.max(0, event.decisionDeadlineTick - worldState.currentDay)

                return (
                  <div
                    key={event.id}
                    className={cn(
                      "rounded border p-4 space-y-3.5 transition-all shadow-lg",
                      urgency.isUrgent
                        ? "border-amber-500/80 bg-zinc-950/95 shadow-amber-950/30"
                        : "border-zinc-800 bg-zinc-950/80"
                    )}
                  >
                    {/* Header Event với Phân cấp Khẩn cấp Đa Tín Hiệu */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Huy hiệu Urgency đa tín hiệu (Icon + Text + Viền) */}
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase border",
                            urgency.classes
                          )}
                        >
                          {urgency.icon}
                          <span>{urgency.label}</span>
                        </div>

                        {/* Phân loại sự kiện (Category) */}
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/60 text-zinc-300 text-[10px] font-bold uppercase">
                          {getCategoryIcon(event.category)}
                          <span>{event.category}</span>
                        </div>

                        {/* Tên Sự kiện */}
                        <span className="font-bold text-zinc-100 text-xs sm:text-sm tracking-wide">
                          {event.title}
                        </span>
                      </div>

                      {/* Thông tin Địa bàn & Thời hạn */}
                      <div className="flex items-center gap-2 text-[11px]">
                        {targetSector ? (
                          <button
                            type="button"
                            onClick={() => onNavigateToSector?.(targetSector.id)}
                            className="flex items-center gap-1 text-cyan-300 hover:text-cyan-100 bg-cyan-950/50 hover:bg-cyan-900/50 px-2 py-0.5 rounded border border-cyan-500/40 transition-colors cursor-pointer text-[10px]"
                            title="Xem chi tiết tại Sector"
                          >
                            <MapPin className="size-3 text-cyan-400" />
                            <span>Sector: {targetSector.name}</span>
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-[10px]">
                            <Globe2 className="size-3 text-zinc-400" />
                            <span>Toàn Vũ Trụ (Global)</span>
                          </span>
                        )}

                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px]">
                          <Clock className="size-3 text-zinc-400" />
                          <span className={cn(daysRemaining <= 1 ? "text-red-400 font-bold" : "text-zinc-300")}>
                            Hạn chót: Ngày #{event.decisionDeadlineTick}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Nội dung diễn biến sự kiện */}
                    <p className="text-[11px] text-zinc-300 leading-relaxed bg-zinc-900/50 p-3 rounded border border-zinc-800/80">
                      {event.description}
                    </p>

                    {/* Cảnh báo tự động khóa phương án mặc định */}
                    {defaultStrategy && (
                      <div className="flex items-start gap-2 rounded bg-amber-950/20 border border-amber-500/30 p-2 text-[10px] text-amber-200">
                        <AlertTriangle className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-amber-300">CẢNH BÁO TỰ ĐỘNG KHÓA:</span> Nếu không phê
                          chuẩn trước hạn chót, hệ thống sẽ tự động áp dụng phương án mặc định:{" "}
                          <strong className="text-amber-100 font-bold underline">
                            [{defaultStrategy.name}]
                          </strong>
                          .
                        </div>
                      </div>
                    )}

                    {/* Danh sách các chiến lược có thể chọn */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1">
                          <Zap className="size-3.5 text-cyan-400" />
                          LỰA CHỌN PHƯƠNG ÁN ĐỐI ỨNG (PHÊ CHUẨN CHIẾN LƯỢC):
                        </span>
                        <span className="text-zinc-500 text-[10px]">
                          Chọn 1 trong {event.availableStrategies.length} phương án
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {event.availableStrategies.map((strat) => {
                          const isDefault = strat.id === event.defaultStrategyId
                          const hasCost = strat.cost && Object.keys(strat.cost).length > 0

                          // Kiểm tra khả năng chi trả tài nguyên
                          const canAfford =
                            !hasCost ||
                            Object.entries(strat.cost!).every(([k, v]) => {
                              const currentVal = (worldState.resources as any)[k] ?? 0
                              return currentVal >= (v as number)
                            })

                          return (
                            <div
                              key={strat.id}
                              className={cn(
                                "rounded border p-3 flex flex-col justify-between space-y-2.5 transition-all",
                                isDefault
                                  ? "border-amber-500/50 bg-amber-950/20 shadow-sm shadow-amber-950/40"
                                  : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                              )}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-zinc-100 text-xs">{strat.name}</span>
                                  {isDefault && (
                                    <span className="text-[9px] text-amber-300 uppercase font-black bg-amber-950/60 border border-amber-500/50 px-1.5 py-0.2 rounded shrink-0">
                                      Mặc Định
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-zinc-400 leading-normal">{strat.description}</p>
                              </div>

                              <div className="border-t border-zinc-800/80 pt-2 space-y-1 text-[10px]">
                                {/* Chi phí tài nguyên */}
                                {hasCost && (
                                  <div className="flex flex-wrap items-center gap-1.5 text-zinc-400">
                                    <span>Chi phí:</span>
                                    {Object.entries(strat.cost!).map(([k, v]) => {
                                      const currentVal = (worldState.resources as any)[k] ?? 0
                                      const enough = currentVal >= (v as number)
                                      return (
                                        <span
                                          key={k}
                                          className={cn(
                                            "font-bold px-1 rounded border",
                                            enough
                                              ? "border-zinc-700 bg-zinc-800/60 text-amber-300"
                                              : "border-red-500/50 bg-red-950/50 text-red-300"
                                          )}
                                        >
                                          {k}: {v}
                                        </span>
                                      )
                                    })}
                                  </div>
                                )}

                                {/* Thời gian & Tỷ lệ thành công */}
                                <div className="flex items-center justify-between text-zinc-400">
                                  <span>
                                    Thời gian: <strong className="text-cyan-300">{strat.processingTicks} ngày</strong>
                                  </span>
                                  {strat.successChance !== undefined && (
                                    <span>
                                      Thành công:{" "}
                                      <strong
                                        className={cn(
                                          strat.successChance >= 80
                                            ? "text-emerald-400"
                                            : strat.successChance >= 50
                                            ? "text-amber-400"
                                            : "text-red-400"
                                        )}
                                      >
                                        {strat.successChance}%
                                      </strong>
                                    </span>
                                  )}
                                </div>

                                {/* Nút Phê chuẩn */}
                                <button
                                  type="button"
                                  onClick={() => onChooseStrategy(event.id, strat.id)}
                                  disabled={!canAfford}
                                  className={cn(
                                    "w-full mt-2 rounded p-1.5 text-[11px] font-bold transition-all cursor-pointer text-center",
                                    !canAfford
                                      ? "border border-zinc-800 bg-zinc-900 text-zinc-500 cursor-not-allowed"
                                      : isDefault
                                      ? "border border-amber-500/70 bg-amber-950/60 text-amber-200 hover:bg-amber-900/60"
                                      : "border border-cyan-500/60 bg-cyan-950/60 text-cyan-200 hover:bg-cyan-900/60"
                                  )}
                                >
                                  {!canAfford ? "Thiếu Tài Nguyên" : "Phê Chuẩn Phương Án"}
                                </button>
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
        </section>
      )}

      {/* ====================================================================
          4. PHÂN MỤC B: SỰ KIỆN ĐANG TRIỂN KHAI (IN-PROGRESS - PROCESSING)
          ==================================================================== */}
      {(filterMode === "all" || filterMode === "processing") && (
        <section className="space-y-3 border-t border-zinc-800/80 pt-3">
          <div className="flex items-center justify-between text-zinc-300 text-[11px] border-b border-zinc-800 pb-1.5">
            <span className="font-bold uppercase tracking-wider flex items-center gap-2 text-cyan-300">
              <Clock className="size-4 text-cyan-400" />
              <span>SỰ KIỆN ĐANG TRIỂN KHAI // PROCESSING ({processingEvents.length})</span>
            </span>
            <span className="text-zinc-400 text-[10px]">
              Tự động hoàn tất và kết xuất kết quả khi đến ngày đích
            </span>
          </div>

          {processingEvents.length === 0 ? (
            <div className="rounded border border-dashed border-zinc-800 bg-zinc-950/40 p-6 text-center text-zinc-500">
              Không có phương án nào đang trong giai đoạn triển khai thời gian.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {processingEvents.map((event) => {
                const targetSector = event.sectorId ? worldState.sectors[event.sectorId] : null
                const chosenStrat = event.availableStrategies.find((s) => s.id === event.chosenStrategyId)
                const startTick = event.processingStartedTick || event.createdAtTick
                const completeTick = event.processingCompletesTick || event.decisionDeadlineTick
                const totalTicks = Math.max(1, completeTick - startTick)
                const elapsedTicks = Math.max(0, worldState.currentDay - startTick)
                const progressPct = Math.min(100, Math.round((elapsedTicks / totalTicks) * 100))
                const remainingTicks = Math.max(0, completeTick - worldState.currentDay)

                return (
                  <div
                    key={event.id}
                    className="rounded border border-cyan-500/40 bg-zinc-950/90 p-3.5 space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border border-cyan-500/50 bg-cyan-950/60 text-cyan-300">
                          PROCESSING
                        </span>
                        <span className="font-bold text-zinc-100 text-xs">{event.title}</span>
                      </div>
                      {targetSector && (
                        <button
                          type="button"
                          onClick={() => onNavigateToSector?.(targetSector.id)}
                          className="flex items-center gap-1 text-[10px] text-cyan-400 hover:underline cursor-pointer"
                        >
                          <MapPin className="size-3" />
                          <span>{targetSector.name}</span>
                        </button>
                      )}
                    </div>

                    <div className="text-[11px] text-zinc-300 bg-cyan-950/20 p-2.5 rounded border border-cyan-500/30 space-y-1">
                      <div className="text-[10px] text-cyan-400 font-bold uppercase">
                        Phương án đang triển khai: {chosenStrat?.name || event.chosenStrategyId}
                      </div>
                      <p className="text-[10px] text-zinc-400">{chosenStrat?.description}</p>
                    </div>

                    {/* Thanh tiến độ trực quan */}
                    <div className="space-y-1 text-[10px]">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>
                          Tiến trình: <strong className="text-cyan-300">{progressPct}%</strong>
                        </span>
                        <span>
                          Dự kiến hoàn tất:{" "}
                          <strong className="text-zinc-200">Ngày #{completeTick}</strong>{" "}
                          <span className="text-cyan-400">(còn {remainingTicks} ngày)</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 transition-all duration-300 rounded"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Ghi chú phụ trợ nếu có transaction buồng lái */}
                    {event.encounterTransactionId && (
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-300 bg-amber-950/30 p-1.5 rounded border border-amber-500/30">
                        <Swords className="size-3 text-amber-400" />
                        <span>Đang chờ hoàn tất trận đánh can thiệp trực tiếp tại Buồng Lái.</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ====================================================================
          5. PHÂN MỤC C: CÂY NHIỆM VỤ CHIẾN LƯỢC (STRATEGIC MISSION CHAINS GRAPH)
          ==================================================================== */}
      {(filterMode === "all" || filterMode === "chains") && (
        <section className="space-y-3 border-t border-zinc-800/80 pt-3">
          <div className="flex items-center justify-between text-zinc-300 text-[11px] border-b border-zinc-800 pb-1.5">
            <span className="font-bold uppercase tracking-wider flex items-center gap-2 text-indigo-300">
              <GitBranch className="size-4 text-indigo-400" />
              <span>CÂY CHUỖI NHIỆM VỤ CHIẾN LƯỢC TOÀN DIỆN ({activeMissionChains.length} / 8 MAX)</span>
            </span>
            <span className="text-zinc-400 text-[10px]">
              Hiển thị quan hệ đồ thị nút, phân nhánh và kiểm soát xung đột sector
            </span>
          </div>

          {activeMissionChains.length === 0 ? (
            <div className="rounded border border-dashed border-zinc-800 bg-zinc-950/40 p-6 text-center text-zinc-500">
              Không có chuỗi nhiệm vụ nào đang hoạt động trong thiên hà.
            </div>
          ) : (
            <div className="space-y-4">
              {activeMissionChains.map((chain) => {
                const nodesList = Object.values(chain.nodes)
                const completedCount = nodesList.filter((n) => n.status === "completed").length
                const totalNodes = nodesList.length
                const progressFraction = `${completedCount}/${totalNodes}`

                return (
                  <div
                    key={chain.id}
                    className="rounded border border-zinc-800 bg-zinc-950/80 p-4 space-y-3.5 shadow-md"
                  >
                    {/* Header Chuỗi Nhiệm Vụ */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
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

                                {/* HUY HIỆU ĐANG CHỜ ĐIỀU KIỆN SECTOR (Phase 6.7 Concurrency Guard) */}
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
        </section>
      )}

      {/* ====================================================================
          6. PHÂN MỤC D: KẾT QUẢ GẦN ĐÂY (RECENT EVENT RESULTS FEED)
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
