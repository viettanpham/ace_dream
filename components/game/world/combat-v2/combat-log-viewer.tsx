/**
 * STARFRONT WORLD — Combat Log Viewer (Phase 6.33)
 *
 * Displays detailed chronological combat event logs:
 * - Round filter tabs
 * - Action-by-action damage resolutions
 * - Destruction events
 * - Retreat progress events
 * - Strategy shift logs
 * - Quick summary badges
 */

import React, { useState } from "react"
import type { CombatV2RoundLog } from "@/lib/game/world/combat-v2-types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Shield, Zap, Skull, PlaneTakeoff, RefreshCw, ChevronRight } from "lucide-react"

interface CombatLogViewerProps {
  roundLogs: CombatV2RoundLog[]
  currentRound: number
}

export const CombatLogViewer: React.FC<CombatLogViewerProps> = ({
  roundLogs,
  currentRound,
}) => {
  const [selectedRound, setSelectedRound] = useState<number | "all">("all")

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
    <div className="rounded border border-slate-800 bg-slate-950 p-4 font-mono select-none flex flex-col h-full">
      {/* Header and Filter */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 mb-3 gap-2">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-cyan-400" />
          <span className="font-bold text-sm text-slate-100">NHẬT KÝ CHIẾN THUẬT THEO HIỆP</span>
          <span className="text-slate-500">·</span>
          <span className="text-xs text-slate-400">{roundLogs.length} hiệp đã ghi nhận</span>
        </div>

        {/* Round Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setSelectedRound("all")}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
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
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                selectedRound === log.round
                  ? "bg-cyan-950 border-cyan-800 text-cyan-300"
                  : "border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              H.{log.round}
            </button>
          ))}
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 max-h-[360px] pr-1">
        {displayedLogs.map((roundLog) => (
          <div
            key={roundLog.round}
            className="rounded border border-slate-800 bg-slate-900/40 p-3 text-xs space-y-2"
          >
            {/* Round Summary Bar */}
            <div className="flex flex-wrap items-center justify-between text-[11px] pb-1.5 border-b border-slate-800/80 gap-2">
              <span className="font-bold text-cyan-300">HIỆP {roundLog.round}</span>
              <div className="flex items-center gap-3 text-slate-400">
                <span>HP VSS: <strong className="text-cyan-400">{roundLog.alliedHpRemaining}</strong></span>
                <span>HP The Void: <strong className="text-rose-400">{roundLog.enemyHpRemaining}</strong></span>
              </div>
            </div>

            {/* Strategy Changes in this round */}
            {roundLog.strategyChanges && roundLog.strategyChanges.length > 0 && (
              <div className="space-y-1">
                {roundLog.strategyChanges.map((sc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-950/20 px-2 py-1 rounded border border-amber-900/40"
                  >
                    <RefreshCw className="size-3 shrink-0" />
                    <span>
                      Chuyển chiến thuật [{sc.factionId.toUpperCase()}]: {sc.previousStrategyId} →{" "}
                      <strong>{sc.newStrategyId}</strong>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Action entries */}
            <div className="space-y-1 pl-1">
              {roundLog.actions.map((act, actIdx) => {
                const isAlliedActor = act.actorSide === "allied"
                return (
                  <div
                    key={actIdx}
                    className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-300"
                  >
                    <ChevronRight className="size-3 text-slate-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className={isAlliedActor ? "text-cyan-400" : "text-rose-400"}>
                        {act.actorName}
                      </strong>{" "}
                      tấn công{" "}
                      <span className={isAlliedActor ? "text-rose-300" : "text-cyan-300"}>
                        {act.targetName}
                      </span>
                      : gây <strong className="text-white">{act.damageDealt} sát thương</strong>
                      {act.isCritical && (
                        <span className="ml-1 text-amber-400 font-bold">[CHÍ MẠNG]</span>
                      )}
                      . (HP còn: {act.targetRemainingHp})
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Retreat Events */}
            {roundLog.retreatEvents && roundLog.retreatEvents.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-slate-800/60">
                {roundLog.retreatEvents.map((rev, revIdx) => (
                  <div
                    key={revIdx}
                    className="flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-950/20 px-2 py-0.5 rounded"
                  >
                    <PlaneTakeoff className="size-3 shrink-0 text-amber-400" />
                    <span>{rev.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Destruction Events */}
            {roundLog.destructionEvents && roundLog.destructionEvents.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-slate-800/60">
                {roundLog.destructionEvents.map((dev, devIdx) => (
                  <div
                    key={devIdx}
                    className="flex items-center gap-1.5 text-[11px] text-rose-400 bg-rose-950/20 px-2 py-0.5 rounded font-medium"
                  >
                    <Skull className="size-3 shrink-0 text-rose-500" />
                    <span>{dev.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
