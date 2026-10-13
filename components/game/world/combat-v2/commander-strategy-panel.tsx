/**
 * STARFRONT WORLD — Commander Strategy UI & Queue Confirmation (Phase 6.33)
 *
 * Implements faction-level tactical strategy selection and queueing:
 * - Independent Commander Authority indicator (decoupled from player GEAR HP)
 * - Current active strategy display
 * - Strategy selection cards (Balanced, Focus Fire, Defensive Screen, Assault Spearhead, Tactical Withdrawal)
 * - Strategy queue confirmation modal/flow
 * - Boundary notification that changes apply at the start of next round
 */

import React, { useState } from "react"
import type { CommanderAuthorityState, CommanderStrategyDefinition } from "@/lib/game/world/combat-v2-types"
import { ShieldAlert, Crosshair, Shield, Zap, ArrowRight, Check, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CommanderStrategyPanelProps {
  commanderAuthority: CommanderAuthorityState
  availableStrategies: CommanderStrategyDefinition[]
  onQueueStrategy: (strategyId: string) => void
  disabled?: boolean
}

export const CommanderStrategyPanel: React.FC<CommanderStrategyPanelProps> = ({
  commanderAuthority,
  availableStrategies,
  onQueueStrategy,
  disabled = false,
}) => {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const currentStrategy = availableStrategies.find(
    (s) => s.id === commanderAuthority.currentStrategyId
  ) || availableStrategies[0]

  const queuedStrategy = commanderAuthority.queuedStrategyId
    ? availableStrategies.find((s) => s.id === commanderAuthority.queuedStrategyId) || null
    : null

  const handleSelectToQueue = (stratId: string) => {
    if (disabled || !commanderAuthority.hasActiveAuthority) return
    if (stratId === commanderAuthority.currentStrategyId) return
    setSelectedStrategyId(stratId)
    setShowConfirmModal(true)
  }

  const handleConfirmQueue = () => {
    if (selectedStrategyId) {
      onQueueStrategy(selectedStrategyId)
    }
    setShowConfirmModal(false)
  }

  return (
    <div className="rounded border border-slate-800 bg-slate-950 p-4 font-mono select-none">
      {/* Header & Authority Status */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 mb-3 gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-cyan-400" />
          <span className="font-bold text-sm text-slate-100">THẨM QUYỀN CHỈ HUY CHIẾN DỊCH</span>
          <span className="text-slate-500">·</span>
          <span className="text-xs text-slate-300">{commanderAuthority.commanderName}</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {commanderAuthority.hasActiveAuthority ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-400 inline-block" />
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
      <div className="rounded border border-cyan-900/40 bg-cyan-950/20 px-3 py-1.5 mb-3 text-[11px] text-cyan-300 flex items-center justify-between">
        <span>Bất biến: Quyền chỉ huy độc lập tuyệt đối với trạng thái sống còn của cơ giáp cá nhân.</span>
        <span className="text-slate-400">Phe: {commanderAuthority.factionId.toUpperCase()}</span>
      </div>

      {/* Current vs Queued Strategy Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
        {/* Current Strategy */}
        <div className="rounded border border-slate-700 bg-slate-900/60 p-2.5">
          <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
            CHIẾN THUẬT HIỆN TẠI (ĐANG ÁP DỤNG)
          </div>
          <div className="font-bold text-cyan-300 text-sm mb-1">{currentStrategy.name}</div>
          <div className="text-slate-300 text-[11px] leading-tight mb-2">
            {currentStrategy.description}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span>Công: <strong className="text-cyan-400">x{currentStrategy.offensiveMultiplier}</strong></span>
            <span>Thủ: <strong className="text-emerald-400">x{currentStrategy.defensiveMultiplier}</strong></span>
          </div>
        </div>

        {/* Queued Strategy */}
        <div className="rounded border border-amber-900/50 bg-amber-950/20 p-2.5">
          <div className="text-amber-400 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
            <span>CHIẾN THUẬT XẾP HÀNG (HIỆP TIẾP THEO)</span>
            {queuedStrategy && <span className="animate-pulse">SẴN SÀNG</span>}
          </div>
          {queuedStrategy ? (
            <>
              <div className="font-bold text-amber-300 text-sm mb-1">{queuedStrategy.name}</div>
              <div className="text-slate-300 text-[11px] leading-tight mb-2">
                {queuedStrategy.description}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <span>Công: <strong className="text-amber-400">x{queuedStrategy.offensiveMultiplier}</strong></span>
                <span>Thủ: <strong className="text-emerald-400">x{queuedStrategy.defensiveMultiplier}</strong></span>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs italic py-4">
              Chưa xếp hàng chiến thuật mới. Sẽ duy trì chiến thuật hiện tại.
            </div>
          )}
        </div>
      </div>

      {/* Available Strategies Selector */}
      <div>
        <div className="text-xs font-semibold text-slate-300 mb-2">
          CHỌN CHIẾN THUẬT ĐỂ XẾP HÀNG CHO HIỆP KẾ TIẾP:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {availableStrategies.map((strat) => {
            const isCurrent = strat.id === commanderAuthority.currentStrategyId
            const isQueued = strat.id === commanderAuthority.queuedStrategyId
            const isClickable = !isCurrent && !disabled && commanderAuthority.hasActiveAuthority

            return (
              <button
                key={strat.id}
                type="button"
                disabled={!isClickable}
                onClick={() => handleSelectToQueue(strat.id)}
                className={`text-left p-2.5 rounded border text-xs transition-all cursor-pointer ${
                  isCurrent
                    ? "border-cyan-500/80 bg-cyan-950/40 text-slate-200 ring-1 ring-cyan-500/40 cursor-default"
                    : isQueued
                      ? "border-amber-500/80 bg-amber-950/40 text-amber-200 ring-1 ring-amber-500/40"
                      : "border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                } ${!isClickable ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-100">{strat.name}</span>
                  {isCurrent && (
                    <span className="text-[10px] text-cyan-400 font-bold">HIỆN TẠI</span>
                  )}
                  {isQueued && (
                    <span className="text-[10px] text-amber-400 font-bold">ĐÃ XẾP HÀNG</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                  {strat.description}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5">
                  <span>Công: x{strat.offensiveMultiplier}</span>
                  <span>Thủ: x{strat.defensiveMultiplier}</span>
                  {isClickable && (
                    <span className="text-cyan-400 flex items-center gap-0.5 font-semibold">
                      Xếp hàng <ArrowRight className="size-2.5" />
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedStrategyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          {(() => {
            const targetStrat = availableStrategies.find((s) => s.id === selectedStrategyId)
            if (!targetStrat) return null
            return (
              <div className="w-full max-w-md rounded-lg border border-cyan-600/80 bg-slate-950 p-5 shadow-2xl font-mono text-xs">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-2">
                  <Check className="size-5 shrink-0" />
                  <span>XÁC NHẬN XẾP HÀNG CHIẾN THUẬT</span>
                </div>

                <p className="text-slate-300 leading-relaxed mb-3">
                  Bạn có muốn xếp hàng chiến thuật{" "}
                  <strong className="text-white">{targetStrat.name}</strong> cho toàn lực lượng?
                </p>

                <div className="rounded bg-slate-900 border border-slate-800 p-3 mb-4 space-y-1.5 text-[11px]">
                  <div className="text-slate-400">
                    Chiến thuật hiện tại: <strong className="text-cyan-300">{currentStrategy.name}</strong>
                  </div>
                  <div className="text-slate-400">
                    Sẽ chuyển sang: <strong className="text-amber-300">{targetStrat.name}</strong>
                  </div>
                  <div className="text-slate-500 pt-1 border-t border-slate-800">
                    · Hiệu ứng sẽ bắt đầu có hiệu lực ngay ở đầu hiệp đấu kế tiếp.
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowConfirmModal(false)}
                    className="text-xs"
                  >
                    Hủy Bỏ
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleConfirmQueue}
                    className="text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-black"
                  >
                    Xác Nhận Xếp Hàng
                  </Button>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
