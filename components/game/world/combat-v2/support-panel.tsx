/**
 * STARFRONT WORLD — Support Panel & Queue Controls (Phase 6.33)
 *
 * Implements low-orbit and base support entity controls:
 * - Support entity roster (Stations, Carriers, Fleet Support)
 * - Auto / Manual toggle mode
 * - Cooldown status tracking
 * - Manual support skill queueing for next round
 */

import React from "react"
import type { CombatSupportEntity } from "@/lib/game/world/combat-v2-types"
import { CANONICAL_SUPPORT_SKILLS, type SupportSkillDefinition } from "@/lib/game/world/combat-v2-support"
import { Radio, RefreshCw, Zap, Shield, HelpCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SupportPanelProps {
  supportEntities: CombatSupportEntity[]
  queuedSkillId: string | null
  onToggleControlMode: (entityId: string) => void
  onQueueSupportSkill: (skillId: string | null) => void
  disabled?: boolean
}

export const SupportPanel: React.FC<SupportPanelProps> = ({
  supportEntities,
  queuedSkillId,
  onToggleControlMode,
  onQueueSupportSkill,
  disabled = false,
}) => {
  if (supportEntities.length === 0) {
    return (
      <div className="rounded border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-500 text-center">
        Không có thực thể hỗ trợ quỹ đạo hoặc căn cứ được kết nối trong phân khu này.
      </div>
    )
  }

  const allSkills = Object.values(CANONICAL_SUPPORT_SKILLS)

  return (
    <div className="rounded border border-slate-800 bg-slate-950 p-4 font-mono select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 mb-3 gap-2">
        <div className="flex items-center gap-2">
          <Radio className="size-4 text-cyan-400 animate-pulse" />
          <span className="font-bold text-sm text-slate-100">TRẠM QUỸ ĐẠO & HỖ TRỢ HẬU CẦN</span>
          <span className="text-slate-500">·</span>
          <span className="text-xs text-slate-400">{supportEntities.length} đơn vị liên kết</span>
        </div>

        <div className="text-xs text-slate-400">
          Hàng đợi hỗ trợ:{" "}
          {queuedSkillId ? (
            <span className="text-cyan-300 font-bold">
              {CANONICAL_SUPPORT_SKILLS[queuedSkillId]?.name || queuedSkillId}
            </span>
          ) : (
            <span className="text-slate-500 italic">Không</span>
          )}
        </div>
      </div>

      {/* Support Entities List */}
      <div className="space-y-3 mb-4">
        {supportEntities.map((entity) => {
          const isReady = entity.activeCooldownRemaining === 0
          return (
            <div
              key={entity.id}
              className="rounded border border-slate-800 bg-slate-900/40 p-3 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div>
                  <span className="font-bold text-slate-100">{entity.name}</span>
                  <span className="text-slate-500 text-[11px] ml-2">
                    Loại: {entity.type.toUpperCase()}
                  </span>
                </div>

                {/* Auto / Manual Mode Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Chế độ:</span>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggleControlMode(entity.id)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      entity.controlMode === "auto"
                        ? "bg-cyan-950 border-cyan-800 text-cyan-300"
                        : "bg-amber-950 border-amber-800 text-amber-300"
                    }`}
                  >
                    {entity.controlMode === "auto" ? "TỰ ĐỘNG (AUTO)" : "THỦ CÔNG (MANUAL)"}
                  </button>
                </div>
              </div>

              {/* Passive Description */}
              {entity.hasPassiveBuff && entity.passiveDescription && (
                <div className="text-[11px] text-cyan-400/90 mb-2">
                  · Bị động: {entity.passiveDescription}
                </div>
              )}

              {/* Cooldown Bar */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                <span>Hồi chiêu kỹ năng kích hoạt:</span>
                <span className={isReady ? "text-emerald-400 font-bold" : "text-amber-400"}>
                  {isReady ? "SẴN SÀNG" : `Hồi lại sau ${entity.activeCooldownRemaining} hiệp`}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Manual Skill Queue Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300">
            KỸ NĂNG HỖ TRỢ XẾP HÀNG (DÀNH CHO CHẾ ĐỘ THỦ CÔNG):
          </span>
          {queuedSkillId && (
            <Button
              size="xs"
              variant="ghost"
              disabled={disabled}
              onClick={() => onQueueSupportSkill(null)}
              className="text-[11px] text-slate-400 hover:text-slate-200"
            >
              Hủy hàng đợi
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {allSkills.map((skill) => {
            const isQueued = queuedSkillId === skill.id
            return (
              <button
                key={skill.id}
                type="button"
                disabled={disabled}
                onClick={() => onQueueSupportSkill(isQueued ? null : skill.id)}
                className={`p-2.5 rounded border text-left text-xs transition-all cursor-pointer ${
                  isQueued
                    ? "border-cyan-500 bg-cyan-950/60 text-slate-100 ring-1 ring-cyan-400"
                    : "border-slate-800 bg-slate-900/30 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-200">{skill.name}</span>
                  {isQueued && (
                    <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-0.5">
                      <Check className="size-3" /> ĐÃ CHỌN
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mb-1.5">{skill.effectSummary}</div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-1">
                  <span>Mục tiêu: {skill.targetSide === "enemy" ? "Quân địch" : "Đồng minh"}</span>
                  <span>Hồi chiêu: {skill.cooldownRounds} hiệp</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
