/**
 * STARFRONT WORLD — Player GEAR Combat Panel & Retreat Action (Phase 6.33)
 *
 * Dedicated control and status panel for the player's primary GEAR or selected allied machine:
 * - Real-time HP / Integrity gauge
 * - Combat attributes (ATK, DEF, SPD, Evasion)
 * - Operational state indicator (ACTIVE, RETREATING, RETREATED, DESTROYED)
 * - Retreat order initiation with confirmation modal (Personal & Force-wide)
 * - Reusable combat skill roster with expandable details
 * - Observer / Commander role transition when machine is lost/retreated
 * - Strict hierarchy separating PILOT / GEAR CONTROL from COMMAND CONTROL
 */

import React, { useState } from "react"
import type { CombatV2Gear } from "@/lib/game/world/combat-v2-types"
import {
  Shield,
  Zap,
  Wind,
  AlertCircle,
  PlaneTakeoff,
  Skull,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Radio,
  Flame,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { VANGUARD_SKILLS, FALCON_SKILLS, AEGIS_SKILLS } from "@/lib/game/data"
import type { CombatSkill } from "@/lib/game/types"

interface PlayerGearCombatPanelProps {
  playerGear: CombatV2Gear | null
  selectedGear: CombatV2Gear | null
  onOrderRetreat: (gearId: string) => void
  onOrderForceRetreat?: () => void
  hasCommanderAuthority?: boolean
  isRetreatPending?: boolean
  disabled?: boolean
}

export const PlayerGearCombatPanel: React.FC<PlayerGearCombatPanelProps> = ({
  playerGear,
  selectedGear,
  onOrderRetreat,
  onOrderForceRetreat,
  hasCommanderAuthority = true,
  isRetreatPending = false,
  disabled = false,
}) => {
  const activeGear = selectedGear || playerGear
  const [showConfirmModal, setShowConfirmModal] = useState<"personal" | "force" | null>(null)
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null)

  if (!activeGear) {
    return (
      <div className="rounded border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-500 text-center">
        Chưa có đơn vị GEAR nào được chọn để điều khiển.
      </div>
    )
  }

  const isPlayerMachine = activeGear.isPlayer
  const hpPct = Math.round((activeGear.currentHp / activeGear.maxHp) * 100)
  const isPersonalDown = activeGear.state === "DESTROYED" || activeGear.state === "RETREATED"
  const canRetreat = activeGear.state === "ACTIVE" && !disabled

  // Nhận diện bộ kỹ năng dựa trên định danh hoặc tên cơ giáp
  const getGearSkills = (): CombatSkill[] => {
    const lowerName = (activeGear.name || "").toLowerCase()
    const lowerId = (activeGear.gearId || "").toLowerCase()
    if (lowerName.includes("falcon") || lowerId.includes("falcon")) {
      return FALCON_SKILLS
    }
    if (lowerName.includes("aegis") || lowerId.includes("aegis")) {
      return AEGIS_SKILLS
    }
    return VANGUARD_SKILLS
  }

  const gearSkills = getGearSkills()

  const handleRetreatClick = () => {
    setShowConfirmModal("personal")
  }

  const handleForceRetreatClick = () => {
    setShowConfirmModal("force")
  }

  const handleConfirmRetreat = () => {
    if (showConfirmModal === "personal") {
      onOrderRetreat(activeGear.gearId)
    } else if (showConfirmModal === "force" && onOrderForceRetreat) {
      onOrderForceRetreat()
    }
    setShowConfirmModal(null)
  }

  return (
    <div className="rounded border border-slate-800 bg-slate-950 p-4 font-mono select-none space-y-4">
      {/* OBSERVER / COMMANDER MODE NOTIFICATION (When Player GEAR is DESTROYED or RETREATED) */}
      {isPlayerMachine && isPersonalDown && (
        <div className="rounded border border-amber-500/70 bg-amber-950/30 p-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-amber-300 font-bold mb-1">
            <Radio className="size-4 animate-pulse text-amber-400" />
            <span>CHẾ ĐỘ QUAN SÁT CHIẾN TRƯỜNG // VAI TRÒ CHỈ HUY (OBSERVER MODE)</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Cơ giáp cá nhân của bạn hiện ở trạng thái{" "}
            <strong className="text-amber-200">
              {activeGear.state === "DESTROYED" ? "BỊ PHÁ HỦY (DESTROYED)" : "ĐÃ THOÁT LY (RETREATED)"}
            </strong>
            . Toàn bộ thao tác tác chiến cá nhân đã bị vô hiệu hóa.
          </p>
          {hasCommanderAuthority && (
            <div className="mt-2 text-emerald-400 font-semibold border-t border-amber-900/50 pt-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" />
              <span>
                Thẩm quyền chỉ huy (Commander Authority) vẫn HIỆU LỰC — Bạn tiếp tục ra lệnh chiến thuật và hỗ trợ quỹ đạo!
              </span>
            </div>
          )}
        </div>
      )}

      {/* SECTION 1: PILOT / GEAR CONTROL HIERARCHY */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              PHÂN HỆ ĐIỀU KHIỂN CƠ GIÁP CÁ NHÂN (PILOT / GEAR CONTROL)
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Phi công: <span className="text-slate-200 font-semibold">{activeGear.pilotName || "AI Tactical"}</span>
          </div>
        </div>

        {/* Machine Identity and Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-cyan-300">{activeGear.name}</span>
            {isPlayerMachine ? (
              <span className="text-xs bg-cyan-950 border border-cyan-800 text-cyan-400 px-2 py-0.5 rounded font-semibold">
                SOÁI CƠ CHỦ LỰC (PLAYER GEAR)
              </span>
            ) : (
              <span className="text-xs bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-semibold">
                ĐƠN VỊ ĐỒNG MINH (ALLIED)
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400">
            Mã định danh: <strong className="text-slate-300">{activeGear.gearId}</strong>
          </div>
        </div>

        {/* HP / Integrity Gauge */}
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">ĐỘ TOÀN VẸN THÂN VỎ (HULL INTEGRITY)</span>
            <span className="font-bold text-slate-200">
              {activeGear.currentHp} / {activeGear.maxHp} ({hpPct}%)
            </span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                hpPct > 50 ? "bg-cyan-400" : hpPct > 20 ? "bg-amber-400" : "bg-rose-500"
              }`}
              style={{ width: `${Math.max(0, Math.min(100, hpPct))}%` }}
            />
          </div>
        </div>

        {/* Operational State Indicator */}
        <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/60 border border-slate-800 text-xs mb-3">
          <span className="text-slate-400">TRẠNG THÁI VẬN HÀNH:</span>
          {activeGear.state === "ACTIVE" && (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="size-3.5" /> TÁC CHIẾN TIẾN TUYẾN (ACTIVE)
            </span>
          )}
          {activeGear.state === "RETREATING" && (
            <span className="flex items-center gap-1.5 text-amber-300 font-bold animate-pulse">
              <PlaneTakeoff className="size-3.5" /> ĐANG THOÁT LY ({activeGear.retreatTurnsRemaining ?? 1} hiệp còn lại · Vẫn chịu đòn)
            </span>
          )}
          {activeGear.state === "RETREATED" && (
            <span className="flex items-center gap-1.5 text-slate-400 font-medium">
              ĐÃ THOÁT LY AN TOÀN (RETREATED)
            </span>
          )}
          {activeGear.state === "DESTROYED" && (
            <span className="flex items-center gap-1.5 text-rose-500 font-bold">
              <Skull className="size-3.5" /> ĐÃ BỊ PHÁ HỦY HOÀN TOÀN (DESTROYED)
            </span>
          )}
        </div>

        {/* Combat Attributes Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
          <div className="p-2 rounded bg-slate-900/40 border border-slate-800/80">
            <div className="flex items-center gap-1 text-slate-400 mb-0.5">
              <Zap className="size-3 text-cyan-400" />
              <span>CÔNG KÍCH</span>
            </div>
            <div className="text-base font-bold text-slate-100">{activeGear.attack}</div>
            <div className="text-[11px] text-slate-500">
              {activeGear.isContributingOffense ? "Đang đóng góp" : "Bị ngắt hỏa lực"}
            </div>
          </div>

          <div className="p-2 rounded bg-slate-900/40 border border-slate-800/80">
            <div className="flex items-center gap-1 text-slate-400 mb-0.5">
              <Shield className="size-3 text-emerald-400" />
              <span>GIÁP PHÒNG NGỰ</span>
            </div>
            <div className="text-base font-bold text-slate-100">{activeGear.defense}</div>
            <div className="text-[11px] text-slate-500">
              {activeGear.isContributingDefense ? "Bảo lưu che chắn" : "Mất hiệu lực"}
            </div>
          </div>

          <div className="p-2 rounded bg-slate-900/40 border border-slate-800/80">
            <div className="flex items-center gap-1 text-slate-400 mb-0.5">
              <Wind className="size-3 text-amber-400" />
              <span>TỐC ĐỘ XUẤT KÍCH</span>
            </div>
            <div className="text-base font-bold text-slate-100">{activeGear.speed}</div>
            <div className="text-[11px] text-slate-500">Thứ tự ra đòn</div>
          </div>
        </div>
      </div>

      {/* SECTION 2: COMBAT SKILLS UI (REUSING EXISTING SKILL DEFINITIONS) */}
      <div className="border-t border-slate-800/80 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300">
            KỸ NĂNG TÁC CHIẾN CƠ GIÁP (COMBAT SKILLS)
          </span>
          <span className="text-[11px] text-slate-500">
            {isPersonalDown ? "Vô hiệu hóa (Máy hỏng/Rút lui)" : "Tự động kích hoạt theo chu kỳ hiệp"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {gearSkills.map((skill) => {
            const isExpanded = expandedSkillId === skill.id
            const isSkillDisabled = isPersonalDown || disabled

            return (
              <div
                key={skill.id}
                className={`rounded border p-2 text-xs transition-colors ${
                  isSkillDisabled
                    ? "border-slate-800/60 bg-slate-950/60 opacity-70"
                    : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-1.5 mb-1">
                  <div>
                    <div className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="size-3 text-cyan-400" />
                      <span>{skill.name}</span>
                    </div>
                    {skill.nameEn && (
                      <div className="text-[10px] text-slate-500 italic">{skill.nameEn}</div>
                    )}
                  </div>

                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      isSkillDisabled
                        ? "bg-rose-950 border border-rose-900 text-rose-400"
                        : "bg-cyan-950 border border-cyan-800 text-cyan-300"
                    }`}
                  >
                    {isSkillDisabled ? "VÔ HIỆU HÓA" : "SẴN SÀNG"}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 line-clamp-1 mb-1.5">
                  {skill.desc}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-1">
                  <span>
                    SP: {skill.spCost || 0} · Hồi chiêu: {skill.cooldown || 0} hiệp
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpandedSkillId(isExpanded ? null : skill.id)}
                    className="text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center gap-0.5"
                  >
                    <span>{isExpanded ? "Thu gọn" : "Xem Chi Tiết"}</span>
                    {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                  </button>
                </div>

                {/* Expandable Details Card */}
                {isExpanded && (
                  <div className="mt-2 p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1 animate-in fade-in">
                    <div><strong>Mô tả chi tiết:</strong> {skill.desc}</div>
                    <div><strong>Mục tiêu:</strong> {skill.targetType || "single-enemy"}</div>
                    {skill.damageMultiplier && (
                      <div><strong>Hệ số sát thương:</strong> x{skill.damageMultiplier} ATK</div>
                    )}
                    {skill.defenseReduction && (
                      <div><strong>Giảm giáp mục tiêu:</strong> -{Math.round(skill.defenseReduction * 100)}% ({skill.effectDuration} hiệp)</div>
                    )}
                    {skill.damageReduction && (
                      <div><strong>Giảm sát thương nhận:</strong> -{Math.round(skill.damageReduction * 100)}% ({skill.effectDuration} hiệp)</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION 3: RETREAT ORDERS (PERSONAL & COMMANDER FORCE RETREAT) */}
      <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-slate-400 max-w-sm">
          {activeGear.state === "RETREATING"
            ? "Đơn vị đang trong giai đoạn di chuyển thoát ly (vẫn chịu sát thương, giữ 100% phòng thủ, ngắt công kích)."
            : "Lệnh thoát ly sẽ chuyển đơn vị sang trạng thái RETREATING trong 1 hiệp trước khi rời chiến trường an toàn."}
        </div>

        <div className="flex items-center gap-2">
          {/* Force-wide Commander Retreat */}
          {hasCommanderAuthority && onOrderForceRetreat && (
            <Button
              size="sm"
              variant="outline"
              disabled={disabled || isPersonalDown}
              onClick={handleForceRetreatClick}
              className="cursor-pointer gap-1.5 text-xs text-amber-400 hover:text-amber-300 border-amber-800/60 hover:bg-amber-950/30"
            >
              <PlaneTakeoff className="size-3.5" />
              <span>RÚT LUI TOÀN ĐỘI</span>
            </Button>
          )}

          {/* Personal Retreat Button */}
          <Button
            size="sm"
            variant={activeGear.state === "ACTIVE" ? "destructive" : "outline"}
            disabled={!canRetreat}
            onClick={handleRetreatClick}
            className="cursor-pointer gap-1.5 text-xs font-semibold"
          >
            <PlaneTakeoff className="size-3.5" />
            <span>{activeGear.state === "RETREATING" ? "ĐANG THOÁT LY..." : "RÚT LUI CÁ NHÂN"}</span>
          </Button>
        </div>
      </div>

      {/* Retreat Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-lg border border-amber-600/80 bg-slate-950 p-5 shadow-2xl font-mono text-xs">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm mb-2">
              <AlertCircle className="size-5 shrink-0" />
              <span>
                {showConfirmModal === "personal"
                  ? "XÁC NHẬN LỆNH THOÁT LY CÁ NHÂN"
                  : "XÁC NHẬN LỆNH RÚT LUI TOÀN LỰC LƯỢNG"}
              </span>
            </div>

            <p className="text-slate-300 leading-relaxed mb-3">
              {showConfirmModal === "personal"
                ? `Bạn có chắc chắn muốn phát lệnh rút lui khẩn cấp cho cơ giáp ${activeGear.name}?`
                : "Bạn có chắc chắn muốn phát lệnh rút lui đồng loạt cho TOÀN BỘ lực lượng đồng minh đang tham chiến?"}
            </p>

            <div className="rounded bg-amber-950/30 border border-amber-900/50 p-2.5 mb-4 text-xs text-amber-200/90 space-y-1">
              <div>· Đơn vị sẽ chuyển sang trạng thái <strong>RETREATING</strong> trong 1 hiệp tiếp theo.</div>
              <div>· Đơn vị <strong>vẫn là mục tiêu hợp lệ</strong> của quân địch trong thời gian thoát ly.</div>
              <div>· Sát thương xuất kích bị triệt tiêu (100% reduction), nhưng giá trị phòng ngự vẫn bảo lưu để che chắn.</div>
              {showConfirmModal === "personal" && isPlayerMachine && (
                <div>· Thẩm quyền chỉ huy (Commander Authority) của bạn <strong>vẫn được bảo toàn</strong> sau khi rút lui!</div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowConfirmModal(null)}
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
