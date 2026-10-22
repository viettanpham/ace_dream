/**
 * STARFRONT WORLD — Commander Strategy UI & Queue Confirmation (Phase 6.33)
 *
 * Implements faction-level tactical strategy selection and queueing:
 * - Independent Commander Authority indicator (decoupled from player GEAR HP)
 * - Current active strategy display
 * - Strategy selection cards (Balanced, Focus Fire, Defensive Screen, Assault Spearhead, Tactical Withdrawal)
 * - Candidate selection + Confirm for Next Round interaction flow
 * - Boundary notification that changes apply strictly at the start of next round
 */

import React, { useState } from "react"
import type { CommanderAuthorityState, CommanderStrategyDefinition } from "@/lib/game/world/combat-v2-types"
import { ShieldAlert, Crosshair, Shield, Zap, ArrowRight, Check, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CommanderStrategyPanelProps {
  commanderAuthority: CommanderAuthorityState
  availableStrategies: CommanderStrategyDefinition[]
  onQueueStrategy: (strategyId: string | null) => void
  currentRound?: number
  disabled?: boolean
}

export const CommanderStrategyPanel: React.FC<CommanderStrategyPanelProps> = ({
  commanderAuthority,
  availableStrategies,
  onQueueStrategy,
  currentRound = 1,
  disabled = false,
}) => {
  const [candidateStrategyId, setCandidateStrategyId] = useState<string | null>(null)

  const currentStrategy = availableStrategies.find(
    (s) => s.id === commanderAuthority.currentStrategyId
  ) || availableStrategies[0]

  const queuedStrategy = commanderAuthority.queuedStrategyId
    ? availableStrategies.find((s) => s.id === commanderAuthority.queuedStrategyId) || null
    : null

  const candidateStrategy = candidateStrategyId
    ? availableStrategies.find((s) => s.id === candidateStrategyId) || null
    : null

  const effectiveRound = currentRound + 1

  const handleSelectCandidate = (stratId: string) => {
    if (disabled || !commanderAuthority.hasActiveAuthority) return
    if (stratId === commanderAuthority.currentStrategyId) return
    setCandidateStrategyId(stratId)
  }

  const handleConfirmQueue = () => {
    if (candidateStrategyId) {
      onQueueStrategy(candidateStrategyId)
      setCandidateStrategyId(null)
    }
  }

  const handleCancelQueue = () => {
    onQueueStrategy(null)
    setCandidateStrategyId(null)
  }

  return (
    <div className="rounded border border-slate-800 bg-slate-950 p-4 font-mono select-none space-y-4">
      {/* Header & Authority Status */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-cyan-400" />
          <span className="font-bold text-sm text-slate-100">THẨM QUYỀN CHỈ HUY CHIẾN THUẬT (COMMAND CONTROL)</span>
          <span className="text-slate-500">·</span>
          <span className="text-xs text-slate-300">{commanderAuthority.commanderName}</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {commanderAuthority.hasActiveAuthority ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-400 inline-block animate-ping" />
              THẨM QUYỀN HIỆU LỰC
            </span>
          ) : (
            <span className="text-rose-500 font-semibold flex items-center gap-1">
              <span className="size-2 rounded-full bg-rose-500 inline-block" />
              MẤT QUYỀN CHỈ HUY
            </span>
          )}
        </div>
      </div>

      {/* Authority Decoupling Notice */}
      <div className="rounded border border-cyan-900/40 bg-cyan-950/20 px-3 py-1.5 text-xs text-cyan-300 flex items-center justify-between">
        <span>Bất biến: Quyền chỉ huy độc lập tuyệt đối với trạng thái sống còn của cơ giáp cá nhân.</span>
        <span className="text-slate-400">Phe: {commanderAuthority.factionId.toUpperCase()}</span>
      </div>

      {/* Strategic Command Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Current Strategy */}
        <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
          <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
            CHIẾN THUẬT HIỆN TẠI (HIỆP {currentRound})
          </div>
          <div className="font-bold text-cyan-300 text-sm mb-1">{currentStrategy.name}</div>
          <div className="text-slate-300 text-xs leading-tight mb-2">
            {currentStrategy.description}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Công: <strong className="text-cyan-400">x{currentStrategy.offensiveMultiplier}</strong></span>
            <span>Thủ: <strong className="text-emerald-400">x{currentStrategy.defensiveMultiplier}</strong></span>
          </div>
        </div>

        {/* Selected Candidate Strategy */}
        <div className="rounded border border-cyan-800/60 bg-slate-900/40 p-3">
          <div className="text-cyan-400 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
            <span>ỨNG VIÊN ĐANG CHỌN</span>
            {candidateStrategy && <span className="text-cyan-300 animate-pulse">CHỜ XÁC NHẬN</span>}
          </div>
          {candidateStrategy ? (
            <>
              <div className="font-bold text-white text-sm mb-1">{candidateStrategy.name}</div>
              <div className="text-slate-300 text-xs leading-tight mb-2">
                {candidateStrategy.description}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
                <span className="text-slate-400 text-[10px]">Hiệu lực: Hiệp {effectiveRound}</span>
                <Button
                  size="xs"
                  variant="default"
                  disabled={disabled || !commanderAuthority.hasActiveAuthority}
                  onClick={handleConfirmQueue}
                  className="bg-cyan-500 text-black hover:bg-cyan-400 font-bold text-[11px] cursor-pointer"
                >
                  <Check className="size-3 mr-1" />
                  Xác Nhận Cho Hiệp {effectiveRound}
                </Button>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs italic py-4">
              Nhấp vào một chiến thuật bên dưới để chọn ứng viên.
            </div>
          )}
        </div>

        {/* Queued Strategy */}
        <div className="rounded border border-amber-900/50 bg-amber-950/20 p-3">
          <div className="text-amber-400 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
            <span>ĐÃ XẾP HÀNG (HIỆP {effectiveRound})</span>
            {queuedStrategy && <span className="animate-pulse">SẴN SÀNG</span>}
          </div>
          {queuedStrategy ? (
            <>
              <div className="font-bold text-amber-300 text-sm mb-1">{queuedStrategy.name}</div>
              <div className="text-slate-300 text-xs leading-tight mb-2">
                {queuedStrategy.description}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-900/40">
                <span className="text-amber-400 text-[10px]">Áp dụng tự động ở đầu Hiệp {effectiveRound}</span>
                <Button
                  size="xs"
                  variant="ghost"
                  disabled={disabled}
                  onClick={handleCancelQueue}
                  className="text-slate-400 hover:text-slate-200 text-[10px] cursor-pointer"
                >
                  Hủy xếp hàng
                </Button>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs italic py-4">
              Chưa xếp hàng chiến thuật mới. Sẽ duy trì "{currentStrategy.name}".
            </div>
          )}
        </div>
      </div>

      {/* Available Strategies Selector */}
      <div>
        <div className="text-xs font-semibold text-slate-300 mb-2">
          DANH SÁCH CHIẾN THUẬT QUÂN ĐỘI (CHỌN ĐỂ XẾP HÀNG CHO HIỆP KẾ TIẾP):
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {availableStrategies.map((strat) => {
            const isCurrent = strat.id === commanderAuthority.currentStrategyId
            const isQueued = strat.id === commanderAuthority.queuedStrategyId
            const isCandidate = strat.id === candidateStrategyId
            const isClickable = !isCurrent && !disabled && commanderAuthority.hasActiveAuthority

            let borderStyle = "border-slate-800 bg-slate-900/40 hover:border-slate-700"
            if (isCurrent) {
              borderStyle = "border-cyan-500 bg-cyan-950/30 ring-1 ring-cyan-500/50"
            } else if (isQueued) {
              borderStyle = "border-amber-500 bg-amber-950/30 ring-1 ring-amber-500/50"
            } else if (isCandidate) {
              borderStyle = "border-cyan-400 bg-cyan-950/50 ring-2 ring-cyan-400"
            }

            return (
              <button
                key={strat.id}
                type="button"
                disabled={!isClickable}
                onClick={() => handleSelectCandidate(strat.id)}
                className={`text-left p-3 rounded border transition-all text-xs cursor-pointer ${borderStyle} ${
                  !isClickable && !isCurrent && !isQueued ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-100">{strat.name}</span>
                  {isCurrent && (
                    <span className="text-[10px] bg-cyan-950 border border-cyan-800 text-cyan-300 px-1.5 py-0.5 rounded font-semibold">
                      HIỆN TẠI
                    </span>
                  )}
                  {isQueued && (
                    <span className="text-[10px] bg-amber-950 border border-amber-800 text-amber-300 px-1.5 py-0.5 rounded font-semibold animate-pulse">
                      ĐÃ XẾP HÀNG
                    </span>
                  )}
                  {isCandidate && !isQueued && (
                    <span className="text-[10px] bg-cyan-900 border border-cyan-400 text-cyan-200 px-1.5 py-0.5 rounded font-semibold">
                      ĐANG CHỌN
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 leading-relaxed mb-2 line-clamp-2">
                  {strat.description}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-1.5">
                  <div className="flex items-center gap-2">
                    <span>Công: <strong className="text-slate-300">x{strat.offensiveMultiplier}</strong></span>
                    <span>Thủ: <strong className="text-slate-300">x{strat.defensiveMultiplier}</strong></span>
                  </div>
                  {isClickable && !isCandidate && (
                    <span className="text-cyan-400 text-[10px] font-semibold">Nhấp để chọn →</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
