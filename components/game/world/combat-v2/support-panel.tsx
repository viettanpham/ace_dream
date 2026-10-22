/**
 * STARFRONT WORLD — Support Panel & Queue Controls (Phase 6.33)
 *
 * Implements low-orbit and base support entity controls:
 * - Support entity roster (Stations, Carriers, Fleet Support) separate from GEAR force numbers
 * - Auto / Manual toggle mode per entity
 * - Manual activation controls strictly disabled when in AUTO mode
 * - Cooldown status tracking & coherent state preservation during mode switches
 * - Manual support skill queueing for next round with expandable detail view
 */

import React, { useState } from "react"
import type { CombatSupportEntity } from "@/lib/game/world/combat-v2-types"
import { CANONICAL_SUPPORT_SKILLS, type SupportSkillDefinition } from "@/lib/game/world/combat-v2-support"
import { Radio, RefreshCw, Zap, Shield, ChevronDown, ChevronUp, Check, Info, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SupportPanelProps {
  supportEntities: CombatSupportEntity[]
  queuedSkillId: string | null
  onToggleControlMode: (entityId: string) => void
  onQueueSupportSkill: (skillId: string | null) => void
  currentRound?: number
  disabled?: boolean
}

export const SupportPanel: React.FC<SupportPanelProps> = ({
  supportEntities,
  queuedSkillId,
  onToggleControlMode,
  onQueueSupportSkill,
  currentRound = 1,
  disabled = false,
}) => {
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null)

  if (supportEntities.length === 0) {
    return (
      <div className="rounded border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-500 text-center">
        Không có thực thể hỗ trợ quỹ đạo hoặc căn cứ được kết nối trong phân khu này.
      </div>
    )
  }

  const nextRound = currentRound + 1

  return (
    <div className="rounded border border-slate-800 bg-slate-950 p-4 font-mono select-none space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 gap-2">
        <div className="flex items-center gap-2">
          <Radio className="size-4 text-cyan-400 animate-pulse" />
          <span className="font-bold text-sm text-slate-100">TRẠM QUỸ ĐẠO & HỖ TRỢ CHIẾN ĐỘI</span>
          <span className="text-slate-500">·</span>
          <span className="text-xs text-slate-400">{supportEntities.length} đơn vị liên kết</span>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Xếp hàng hỗ trợ Hiệp {nextRound}:</span>
          {queuedSkillId ? (
            <span className="text-cyan-300 font-bold bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 rounded">
              {CANONICAL_SUPPORT_SKILLS[queuedSkillId]?.name || queuedSkillId}
            </span>
          ) : (
            <span className="text-slate-500 italic bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Chưa chọn kỹ năng thủ công
            </span>
          )}
        </div>
      </div>

      {/* Invariant Explanation Banner */}
      <div className="rounded border border-slate-800 bg-slate-900/40 p-2.5 text-xs text-slate-400 space-y-1">
        <div>
          · <strong>Quy tắc phân tách:</strong> Thực thể hỗ trợ không tính vào số lượng cỗ máy GEAR trên chiến trường.
        </div>
        <div>
          · <strong>Quy tắc kích hoạt:</strong> Chế độ AUTO do hệ thống AI tự quyết định; Chế độ MANUAL cho phép Chỉ Huy xếp hàng kỹ năng áp dụng vào đầu hiệp kế tiếp.
        </div>
      </div>

      {/* Support Entities Roster */}
      <div className="space-y-3">
        {supportEntities.map((entity) => {
          const isReady = entity.activeCooldownRemaining === 0
          const skillDef = entity.activeSkillName
            ? CANONICAL_SUPPORT_SKILLS[entity.activeSkillName]
            : null
          const isSkillQueued = skillDef ? queuedSkillId === skillDef.id : false
          const isExpanded = skillDef ? expandedSkillId === skillDef.id : false
          const isAuto = entity.controlMode === "auto"

          return (
            <div
              key={entity.id}
              className="rounded border border-slate-800 bg-slate-900/50 p-3 text-xs space-y-3"
            >
              {/* Entity Title & Mode Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100">{entity.name}</span>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {entity.type === "station" ? "Trạm Không Gian" : "Hạm Đội Hậu Cần"}
                    </span>
                  </div>
                  {entity.currentHp && entity.maxHp && (
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Độ bền cấu trúc: {entity.currentHp} / {entity.maxHp} HP
                    </div>
                  )}
                </div>

                {/* Mode Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs">Chế độ vận hành:</span>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggleControlMode(entity.id)}
                    className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${
                      isAuto
                        ? "bg-cyan-950 border-cyan-700 text-cyan-300 hover:bg-cyan-900/50"
                        : "bg-amber-950 border-amber-700 text-amber-300 hover:bg-amber-900/50"
                    }`}
                  >
                    {isAuto ? "TỰ ĐỘNG (AUTO)" : "THỦ CÔNG (MANUAL)"}
                  </button>
                </div>
              </div>

              {/* Passive Aura Indicator */}
              {entity.hasPassiveBuff && entity.passiveDescription && (
                <div className="flex items-center gap-2 text-xs text-cyan-400/90 bg-cyan-950/20 px-2.5 py-1.5 rounded border border-cyan-900/30">
                  <Shield className="size-3.5 text-cyan-400 shrink-0" />
                  <span>Hiệu ứng thường trực: {entity.passiveDescription}</span>
                </div>
              )}

              {/* Active Skill & Command Section */}
              {skillDef && (
                <div className="rounded border border-slate-800 bg-slate-950/60 p-2.5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Zap className="size-3.5 text-amber-400" />
                      <span className="font-bold text-slate-200">{skillDef.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">[{skillDef.code}]</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                          isReady
                            ? "bg-emerald-950 border-emerald-800 text-emerald-300"
                            : "bg-amber-950 border-amber-800 text-amber-300"
                        }`}
                      >
                        {isReady ? "SẴN SÀNG" : `Hồi chiêu: ${entity.activeCooldownRemaining} hiệp`}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-300 leading-relaxed">
                    {skillDef.effectSummary}
                  </div>

                  {/* Mode-specific execution controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 pt-2 text-[11px]">
                    <div className="text-slate-400">
                      {isAuto ? (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Info className="size-3 text-cyan-400" />
                          Hệ thống AI tự động kích hoạt khi hồi chiêu sẵn sàng (Thao tác thủ công bị khóa).
                        </span>
                      ) : (
                        <span className="text-amber-400/90 flex items-center gap-1">
                          <AlertCircle className="size-3 text-amber-400" />
                          Chỉ huy chọn kích hoạt thủ công → Áp dụng tại Hiệp {nextRound}.
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Expand Details Toggle */}
                      <button
                        type="button"
                        onClick={() => setExpandedSkillId(isExpanded ? null : skillDef.id)}
                        className="text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center gap-0.5"
                      >
                        <span>{isExpanded ? "Thu gọn" : "Chi tiết kỹ năng"}</span>
                        {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                      </button>

                      {/* Manual Queue Button */}
                      {!isAuto && (
                        <Button
                          size="xs"
                          variant={isSkillQueued ? "secondary" : "default"}
                          disabled={disabled || !isReady}
                          onClick={() => onQueueSupportSkill(isSkillQueued ? null : skillDef.id)}
                          className={`cursor-pointer font-bold text-xs ${
                            isSkillQueued
                              ? "bg-amber-600 hover:bg-amber-500 text-black"
                              : "bg-cyan-600 hover:bg-cyan-500 text-black"
                          }`}
                        >
                          {isSkillQueued ? "Hủy Xếp Hàng" : `Xếp Hàng Cho Hiệp ${nextRound}`}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Skill Details */}
                  {isExpanded && (
                    <div className="mt-2 p-2.5 rounded bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1 animate-in fade-in">
                      <div><strong>Chi tiết tác động:</strong> {skillDef.description}</div>
                      <div><strong>Phân loại:</strong> Kỹ năng kích hoạt có hồi chiêu (Active Support Ability)</div>
                      <div><strong>Thời gian hồi chiêu cơ bản:</strong> {skillDef.cooldownRounds} hiệp</div>
                      <div><strong>Đối tượng mục tiêu:</strong> {skillDef.targetSide === "enemy" ? "Toàn bộ quân địch The Void" : "Lực lượng đồng minh VSS"}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
