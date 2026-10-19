/**
 * STARFRONT WORLD — Combat Log Viewer (Phase 6.33)
 *
 * Displays detailed chronological combat event logs:
 * - Direct reuse of canonical Combat V2 logs (CombatV2RoundLog) — no shadow state
 * - Grouped by ROUND
 * - Event category filters: ALL, DESTROYED, RETREAT, STRATEGY, SUPPORT, ACTION
 * - Visual hierarchy emphasizing DESTROYED, RETREAT, STRATEGY, and SUPPORT over routine attacks
 * - Auto-scroll & pause auto-scroll controls
 * - Compact / Detailed display mode toggle
 */

import React, { useState, useEffect, useRef } from "react"
import type { CombatV2RoundLog } from "@/lib/game/world/combat-v2-types"
import {
  Shield,
  Zap,
  Skull,
  PlaneTakeoff,
  RefreshCw,
  Radio,
  ChevronRight,
  Filter,
  Play,
  Pause,
  List,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface CombatLogViewerProps {
  roundLogs: CombatV2RoundLog[]
  currentRound: number
}

type LogCategoryFilter = "all" | "destroyed" | "retreat" | "strategy" | "support" | "action"

export const CombatLogViewer: React.FC<CombatLogViewerProps> = ({
  roundLogs,
  currentRound,
}) => {
  const [selectedRound, setSelectedRound] = useState<number | "all">("all")
  const [categoryFilter, setCategoryFilter] = useState<LogCategoryFilter>("all")
  const [autoScroll, setAutoScroll] = useState<boolean>(true)
  const [isCompactMode, setIsCompactMode] = useState<boolean>(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new logs if enabled
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [roundLogs, autoScroll])

  if (roundLogs.length === 0) {
    return (
      <div className="rounded border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-500 text-center">
        Chưa có dữ liệu nhật ký giao tranh. Hãy bắt đầu hoặc tiến hiệp đấu.
      </div>
    )
  }

  const displayedLogs =
    selectedRound === "all"
      ? roundLogs
      : roundLogs.filter((log) => log.round === selectedRound)

  return (
    <div className="rounded border border-slate-800 bg-slate-950 p-4 font-mono select-none flex flex-col h-full space-y-3">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-cyan-400" />
          <span className="font-bold text-sm text-slate-100">NHẬT KÝ CHIẾN THUẬT CANONICAL (COMBAT LOG)</span>
          <span className="text-slate-500">·</span>
          <span className="text-xs text-slate-400">{roundLogs.length} hiệp đã ghi nhận</span>
        </div>

        {/* Auto-scroll & Compact controls */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              autoScroll
                ? "bg-cyan-950 border-cyan-800 text-cyan-300"
                : "border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {autoScroll ? <Play className="size-2.5 fill-cyan-300" /> : <Pause className="size-2.5" />}
            <span>{autoScroll ? "Tự Cuộn: BẬT" : "Tự Cuộn: TẮT"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCompactMode(!isCompactMode)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              isCompactMode
                ? "bg-slate-800 border-slate-700 text-slate-200"
                : "border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {isCompactMode ? <Layers className="size-2.5" /> : <List className="size-2.5" />}
            <span>{isCompactMode ? "Rút Gọn" : "Chi Tiết"}</span>
          </button>
        </div>
      </div>

      {/* Filter Row: Round Selector & Category Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Round Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full sm:max-w-md">
          <button
            type="button"
            onClick={() => setSelectedRound("all")}
            className={`px-2 py-0.5 rounded text-xs font-semibold border transition-colors cursor-pointer shrink-0 ${
              selectedRound === "all"
                ? "bg-cyan-950 border-cyan-800 text-cyan-300"
                : "border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Tất cả hiệp
          </button>
          {roundLogs.map((log) => (
            <button
              key={log.round}
              type="button"
              onClick={() => setSelectedRound(log.round)}
              className={`px-2 py-0.5 rounded text-xs font-semibold border transition-colors cursor-pointer shrink-0 ${
                selectedRound === log.round
                  ? "bg-cyan-950 border-cyan-800 text-cyan-300"
                  : "border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              H.{log.round}
            </button>
          ))}
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          <span className="text-[10px] text-slate-500 uppercase mr-1">Bộ lọc:</span>
          {(
            [
              { id: "all", label: "Tất cả" },
              { id: "destroyed", label: "Tiêu diệt" },
              { id: "retreat", label: "Rút lui" },
              { id: "strategy", label: "Chiến thuật" },
              { id: "support", label: "Hỗ trợ" },
              { id: "action", label: "Sát thương" },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer shrink-0 ${
                categoryFilter === cat.id
                  ? "bg-slate-800 border-slate-600 text-cyan-300"
                  : "border-slate-900 text-slate-400 hover:text-slate-300"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Log Feed */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto space-y-3 min-h-[220px] max-h-[480px] pr-1"
      >
        {displayedLogs.map((roundLog) => {
          // Check if this round has any events matching category
          const hasDestruction = roundLog.destructionEvents && roundLog.destructionEvents.length > 0
          const hasRetreat = roundLog.retreatEvents && roundLog.retreatEvents.length > 0
          const hasStrategy = roundLog.strategyChanges && roundLog.strategyChanges.length > 0
          const hasSupport = roundLog.supportEvents && roundLog.supportEvents.length > 0
          const hasActions = roundLog.actions && roundLog.actions.length > 0

          if (categoryFilter === "destroyed" && !hasDestruction) return null
          if (categoryFilter === "retreat" && !hasRetreat) return null
          if (categoryFilter === "strategy" && !hasStrategy) return null
          if (categoryFilter === "support" && !hasSupport) return null
          if (categoryFilter === "action" && !hasActions) return null

          return (
            <div
              key={roundLog.round}
              className="rounded border border-slate-800 bg-slate-900/40 p-3 text-xs space-y-2"
            >
              {/* Round Summary Bar */}
              <div className="flex flex-wrap items-center justify-between text-xs pb-1.5 border-b border-slate-800/80 gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cyan-300 text-sm">HIỆP {roundLog.round}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-[11px] text-slate-400">
                    {roundLog.actions.length} công kích · {roundLog.destructionEvents.length} tiêu diệt · {roundLog.retreatEvents.length} thoát ly
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-xs">
                  <span>HP VSS: <strong className="text-cyan-400">{roundLog.alliedHpRemaining}</strong></span>
                  <span>HP The Void: <strong className="text-rose-400">{roundLog.enemyHpRemaining}</strong></span>
                </div>
              </div>

              {/* 1. CRITICAL EVENT EMPHASIS: DESTRUCTION EVENTS */}
              {(categoryFilter === "all" || categoryFilter === "destroyed") &&
                hasDestruction && (
                  <div className="space-y-1">
                    {roundLog.destructionEvents.map((dev, devIdx) => (
                      <div
                        key={devIdx}
                        className="flex items-center gap-2 text-xs text-rose-300 bg-rose-950/40 px-2.5 py-1.5 rounded border border-rose-900/80 font-bold animate-in fade-in"
                      >
                        <Skull className="size-4 shrink-0 text-rose-500 animate-pulse" />
                        <span className="tracking-wide">{dev.message}</span>
                      </div>
                    ))}
                  </div>
                )}

              {/* 2. IMPORTANT EVENT EMPHASIS: RETREAT EVENTS */}
              {(categoryFilter === "all" || categoryFilter === "retreat") &&
                hasRetreat && (
                  <div className="space-y-1">
                    {roundLog.retreatEvents.map((rev, revIdx) => (
                      <div
                        key={revIdx}
                        className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/30 px-2.5 py-1 rounded border border-amber-900/60 font-semibold"
                      >
                        <PlaneTakeoff className="size-3.5 shrink-0 text-amber-400" />
                        <span>{rev.message}</span>
                      </div>
                    ))}
                  </div>
                )}

              {/* 3. IMPORTANT EVENT EMPHASIS: STRATEGY CHANGES */}
              {(categoryFilter === "all" || categoryFilter === "strategy") &&
                hasStrategy && (
                  <div className="space-y-1">
                    {roundLog.strategyChanges.map((sc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs text-cyan-300 bg-cyan-950/30 px-2.5 py-1 rounded border border-cyan-900/50"
                      >
                        <RefreshCw className="size-3.5 shrink-0 text-cyan-400" />
                        <span>
                          Chuyển đổi chiến thuật [{sc.factionId.toUpperCase()}]:{" "}
                          <span className="text-slate-400">{sc.previousStrategyId}</span> →{" "}
                          <strong className="text-cyan-200 uppercase">{sc.newStrategyId}</strong> (Áp dụng tại đầu hiệp)
                        </span>
                      </div>
                    ))}
                  </div>
                )}

              {/* 4. IMPORTANT EVENT EMPHASIS: SUPPORT FLEET EVENTS */}
              {(categoryFilter === "all" || categoryFilter === "support") &&
                hasSupport && (
                  <div className="space-y-1">
                    {roundLog.supportEvents.map((se, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex items-center gap-2 text-xs text-purple-300 bg-purple-950/30 px-2.5 py-1 rounded border border-purple-900/50"
                      >
                        <Radio className="size-3.5 shrink-0 text-purple-400 animate-pulse" />
                        <span>{se.message}</span>
                      </div>
                    ))}
                  </div>
                )}

              {/* 5. ROUTINE ACTION ENTRIES (Visually quieter to keep reading flow clear) */}
              {(categoryFilter === "all" || categoryFilter === "action") && hasActions && (
                <div className={`space-y-1 pl-1 ${isCompactMode ? "text-[11px]" : "text-xs"}`}>
                  {roundLog.actions.map((act, actIdx) => {
                    const isAlliedActor = act.actorSide === "allied"
                    return (
                      <div
                        key={actIdx}
                        className="flex items-start gap-1.5 leading-relaxed text-slate-300 hover:bg-slate-900/60 px-1 py-0.5 rounded"
                      >
                        <ChevronRight className="size-3 text-slate-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className={isAlliedActor ? "text-cyan-400" : "text-rose-400"}>
                            {act.actorName}
                          </strong>{" "}
                          công kích{" "}
                          <span className={isAlliedActor ? "text-rose-300" : "text-cyan-300"}>
                            {act.targetName}
                          </span>
                          : gây <strong className="text-white">-{act.damageDealt} HP</strong>
                          {act.isCritical && (
                            <span className="ml-1 text-amber-400 font-bold">[CHÍ MẠNG]</span>
                          )}
                          <span className="text-slate-500 ml-1.5">
                            (Còn lại: {act.targetRemainingHp} HP{act.targetState === "DESTROYED" ? " · TIÊU DIỆT" : ""})
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
