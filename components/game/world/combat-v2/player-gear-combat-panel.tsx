/**
 * STARFRONT WORLD — Player GEAR Combat Panel & Retreat Action (Phase 6.33)
 *
 * Dedicated control and status panel for the player's primary GEAR or selected allied machine:
 * - Real-time HP / Integrity gauge
 * - Combat attributes (ATK, DEF, SPD, Evasion)
 * - Operational state indicator (ACTIVE, RETREATING, RETREATED, DESTROYED)
 * - Retreat order initiation with confirmation modal
 * - Commander Authority decoupled status indicator
 */

import React, { useState } from "react"
import type { CombatV2Gear } from "@/lib/game/world/combat-v2-types"
import { Shield, Zap, Wind, AlertCircle, PlaneTakeoff, Skull, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PlayerGearCombatPanelProps {
  playerGear: CombatV2Gear | null
  selectedGear: CombatV2Gear | null
  onOrderRetreat: (gearId: string) => void
  isRetreatPending?: boolean
  disabled?: boolean
}

export const PlayerGearCombatPanel: React.FC<PlayerGearCombatPanelProps> = ({
  playerGear,
  selectedGear,
  onOrderRetreat,
  isRetreatPending = false,
  disabled = false,
}) => {
  const activeGear = selectedGear || playerGear
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  if (!activeGear) {
    return (
      <div className="rounded border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-500 text-center">
        Chưa có đơn vị GEAR nào được chọn để điều khiển.
      </div>
    )
  }

  const isPlayerMachine = activeGear.isPlayer
  const hpPct = Math.round((activeGear.currentHp / activeGear.maxHp) * 100)
  const canRetreat = activeGear.state === "ACTIVE" && !disabled

  const handleRetreatClick = () => {
    setShowConfirmModal(true)
  }

  const handleConfirmRetreat = () => {
    setShowConfirmModal(false)
    onOrderRetreat(activeGear.gearId)
  }

  return (
    <div className="rounded border border-slate-800 bg-slate-950 p-4 font-mono select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-cyan-300">{activeGear.name}</span>
          {isPlayerMachine ? (
            <span className="text-xs bg-cyan-950 border border-cyan-800 text-cyan-400 px-1.5 py-0.5 rounded font-semibold">
              CƠ GIÁP CHỦ LỰC
            </span>
          ) : (
            <span className="text-xs bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-semibold">
              ĐƠN VỊ ĐỒNG MINH
            </span>
          )}
        </div>
        <div className="text-xs text-slate-400">
          Phi công: <span className="text-slate-200 font-semibold">{activeGear.pilotName || "AI Tactical"}</span>
        </div>
      </div>

      {/* HP and State Status */}
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-slate-400">ĐỘ TOÀN VẸN THÂN VỎ (HULL INTEGRITY)</span>
            <span className="font-bold text-slate-200">
              {activeGear.currentHp} / {activeGear.maxHp} ({hpPct}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                hpPct > 50 ? "bg-cyan-400" : hpPct > 20 ? "bg-amber-400" : "bg-rose-500"
              }`}
              style={{ width: `${Math.max(0, Math.min(100, hpPct))}%` }}
            />
          </div>
        </div>

        {/* Operational State Pill */}
        <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 text-xs">
          <span className="text-slate-400">TRẠNG THÁI HOẠT ĐỘNG:</span>
          {activeGear.state === "ACTIVE" && (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="size-3.5" /> TÁC CHIẾN TIẾN TUYẾN (ACTIVE)
            </span>
          )}
          {activeGear.state === "RETREATING" && (
            <span className="flex items-center gap-1.5 text-amber-300 font-bold animate-pulse">
              <PlaneTakeoff className="size-3.5" /> ĐANG THOÁT LY ({activeGear.retreatTurnsRemaining} hiệp còn lại)
            </span>
          )}
          {activeGear.state === "RETREATED" && (
            <span className="flex items-center gap-1.5 text-slate-400 font-medium">
              ĐÃ THOÁT LY AN TOÀN (RETREATED)
            </span>
          )}
          {activeGear.state === "DESTROYED" && (
            <span className="flex items-center gap-1.5 text-rose-500 font-bold">
              <Skull className="size-3.5" /> ĐÃ BỊ PHÁ HỦY (DESTROYED)
            </span>
          )}
        </div>
      </div>

      {/* Combat Attributes Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
        <div className="p-2 rounded bg-slate-900/40 border border-slate-800/80">
          <div className="flex items-center gap-1 text-slate-400 mb-0.5">
            <Zap className="size-3 text-cyan-400" />
            <span>CÔNG KÍCH</span>
          </div>
          <div className="text-base font-bold text-slate-100">{activeGear.attack}</div>
          <div className="text-xs text-slate-500">
            {activeGear.isContributingOffense ? "Đang đóng góp" : "Bị ngắt"}
          </div>
        </div>

        <div className="p-2 rounded bg-slate-900/40 border border-slate-800/80">
          <div className="flex items-center gap-1 text-slate-400 mb-0.5">
            <Shield className="size-3 text-emerald-400" />
            <span>GIÁP PHÒNG NGỰ</span>
          </div>
          <div className="text-base font-bold text-slate-100">{activeGear.defense}</div>
          <div className="text-xs text-slate-500">
            {activeGear.isContributingDefense ? "Bảo lưu che chắn" : "Mất hiệu lực"}
          </div>
        </div>

        <div className="p-2 rounded bg-slate-900/40 border border-slate-800/80">
          <div className="flex items-center gap-1 text-slate-400 mb-0.5">
            <Wind className="size-3 text-amber-400" />
            <span>TỐC ĐỘ XUẤT KÍCH</span>
          </div>
          <div className="text-base font-bold text-slate-100">{activeGear.speed}</div>
          <div className="text-xs text-slate-500">Thứ tự hiệp đấu</div>
        </div>
      </div>

      {/* Retreat Order Trigger */}
      <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-slate-400 max-w-xs">
          {activeGear.state === "RETREATING"
            ? "Đơn vị đang trong giai đoạn di chuyển thoát ly (vẫn chịu sát thương, giữ phòng thủ)."
            : "Phát lệnh thoát ly sẽ chuyển đơn vị sang trạng thái RETREATING trong 1 hiệp."}
        </div>

        <Button
          size="sm"
          variant={activeGear.state === "ACTIVE" ? "destructive" : "outline"}
          disabled={!canRetreat}
          onClick={handleRetreatClick}
          className="cursor-pointer gap-1.5 text-xs font-semibold"
        >
          <PlaneTakeoff className="size-3.5" />
          <span>{activeGear.state === "RETREATING" ? "ĐANG THOÁT LY..." : "PHÁT LỆNH RÚT LUI"}</span>
        </Button>
      </div>

      {/* Retreat Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-lg border border-amber-600/80 bg-slate-950 p-5 shadow-2xl font-mono text-xs">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm mb-2">
              <AlertCircle className="size-5 shrink-0" />
              <span>XÁC NHẬN LỆNH THOÁT LY TÁC CHIẾN</span>
            </div>

            <p className="text-slate-300 leading-relaxed mb-3">
              Bạn có chắc chắn muốn phát lệnh rút lui khẩn cấp cho cơ giáp{" "}
              <strong className="text-white">{activeGear.name}</strong>?
            </p>

            <div className="rounded bg-amber-950/30 border border-amber-900/50 p-2.5 mb-4 text-xs text-amber-200/90 space-y-1">
              <div>· Đơn vị sẽ chuyển sang trạng thái <strong>RETREATING</strong> trong 1 hiệp tiếp theo.</div>
              <div>· Đơn vị <strong>vẫn là mục tiêu hợp lệ</strong> của quân địch trong thời gian thoát ly.</div>
              <div>· Lực công kích sẽ bị ngắt, nhưng giá trị phòng ngự vẫn đóng góp che chắn đội hình.</div>
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
                variant="destructive"
                onClick={handleConfirmRetreat}
                className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-black"
              >
                Xác Nhận Rút Lui
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
