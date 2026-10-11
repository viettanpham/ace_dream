"use client"

import React, { useState } from "react"
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Cpu,
  Dices,
  Flame,
  Info,
  Layers,
  Lock,
  RefreshCw,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Unlock,
  Wind,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  PilotSynergySkillInstance,
  PilotSynergySkillTemplate,
  RerollOptions,
  RerollResult,
  SkillSecondaryLine,
} from "@/lib/game/pilot-skill-types"
import { getSynergyTemplateForPilot } from "@/lib/game/pilot-skill-templates"
import { rerollPilotSecondaryLine } from "@/lib/game/pilot-skill-engine"
import type { StarfrontGearId } from "@/lib/game/types"

interface PilotSkillViewProps {
  skill: PilotSynergySkillInstance
  currentGearId: StarfrontGearId
  rerollTokens?: number
  credits?: number
  onUpdateSkill: (updatedSkill: PilotSynergySkillInstance, tokensUsed: number, creditsUsed: number) => void
  onOpenAdminCP?: () => void
  readOnly?: boolean
}

export function PilotSkillView({
  skill,
  currentGearId,
  rerollTokens = 0,
  credits = 0,
  onUpdateSkill,
  onOpenAdminCP,
  readOnly = false,
}: PilotSkillViewProps) {
  const template = getSynergyTemplateForPilot(skill.pilotId)
  const isSignatureActive = skill.signatureGearId === currentGearId

  const [rerollModalOpen, setRerollModalOpen] = useState(false)
  const [rerollType, setRerollType] = useState<"random" | "targeted">("random")
  const [selectedTargetIndex, setSelectedTargetIndex] = useState<number>(0)
  const [rerollFeedback, setRerollFeedback] = useState<string | null>(null)

  const skillTypeBadges: Record<string, { label: string; bg: string; text: string; border: string }> = {
    DAMAGE: { label: "TẤN CÔNG / SÁT THƯƠNG", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
    SHIELD: { label: "HỘ MỆNH / TẠO KHIÊN", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
    FOLLOW_UP: { label: "PHẢN KÍCH / LIÊN KÍCH", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
    DEBUFF: { label: "PHÁ GIÁP / KHẮC CHẾ", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
    HEAL: { label: "HỒI PHỤC CHIẾN HẠM", bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
    BUFF: { label: "GIA TỐC CHIẾN THUẬT", bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/30" },
  }

  const badgeConfig = skillTypeBadges[skill.skillType] || skillTypeBadges.DAMAGE

  const handleExecuteReroll = () => {
    if (rerollTokens <= 0 && credits < 150) {
      setRerollFeedback("Không đủ Vé Reroll hoặc Credits để thực hiện!")
      return
    }

    const options: RerollOptions = {
      type: rerollType,
      targetLineIndex: rerollType === "targeted" ? selectedTargetIndex : undefined,
    }

    const res: RerollResult = rerollPilotSecondaryLine(skill, options)
    if (res.success) {
      const tokensUsed = rerollTokens > 0 ? 1 : 0
      const creditsUsed = tokensUsed === 0 ? 150 : 0
      onUpdateSkill(res.updatedSkill, tokensUsed, creditsUsed)
      setRerollFeedback(res.message)
    } else {
      setRerollFeedback(res.message)
    }
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-slate-950/80 p-4 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-md border border-cyan-500/40 bg-cyan-950/50 text-cyan-400">
            <Zap className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-bold text-white tracking-wide">
                {skill.name}
              </h3>
              <span className={cn("rounded-sm border px-1.5 py-0.5 text-[9px] font-bold uppercase", badgeConfig.bg, badgeConfig.text, badgeConfig.border)}>
                {badgeConfig.label}
              </span>
              <span className="rounded-sm border border-slate-700 bg-slate-900/80 px-1.5 py-0.5 font-mono text-[9px] text-slate-300">
                {skill.isPassive ? "NỘI TẠI TỰ ĐỘNG" : "KÍCH HOẠT CHỦ ĐỘNG"}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {skill.nameEn} · Kỹ Năng Liên Hoàn Phi Công
            </div>
          </div>
        </div>

        {/* Skill Power & Level */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Lực Kỹ Năng</div>
            <div className="font-mono text-lg font-bold text-cyan-300 flex items-center justify-end gap-1">
              <Sparkles className="size-3.5 text-yellow-400" />
              {skill.skillPower} <span className="text-[10px] text-slate-400">/ {template.maxSkillPowerBudget}</span>
            </div>
          </div>
          <div className="rounded-md border border-cyan-500/40 bg-cyan-950/60 px-3 py-1 text-center">
            <div className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold">Cấp Kỹ Năng</div>
            <div className="font-mono text-sm font-bold text-white">
              Lv.{skill.skillLevel} <span className="text-xs text-slate-400">/ {skill.maxSkillLevel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="mt-2 text-xs text-slate-300 leading-relaxed italic">
        "{template.description}"
      </p>

      {/* Signature Gear Synergy Banner */}
      <div
        className={cn(
          "mt-3 flex items-center justify-between rounded-md border p-2.5 text-xs transition-colors",
          isSignatureActive
            ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-200"
            : "border-slate-800 bg-slate-900/40 text-slate-400",
        )}
      >
        <div className="flex items-center gap-2">
          {isSignatureActive ? (
            <Sparkles className="size-4 shrink-0 text-emerald-400" />
          ) : (
            <Info className="size-4 shrink-0 text-slate-500" />
          )}
          <div>
            <span className="font-bold uppercase tracking-wider">
              {isSignatureActive ? "HIỆP ĐỒNG ĐỒNG BỘ 100% ✨" : "CƠ GIÁP KHUYẾN NGHỊ"}:
            </span>{" "}
            {template.signatureBonusText}
          </div>
        </div>
        <span
          className={cn(
            "rounded-sm px-2 py-0.5 text-[10px] font-bold font-mono uppercase",
            isSignatureActive
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "bg-slate-800 text-slate-400",
          )}
        >
          {skill.signatureGearId.toUpperCase()} GEAR
        </span>
      </div>

      {/* Main Line */}
      <div className="mt-3 rounded-md border border-cyan-500/30 bg-cyan-950/20 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <Flame className="size-3.5 text-cyan-400" />
            Dòng Chính (Main Line): {skill.mainLine.name}
          </span>
          <span className="font-mono text-sm font-bold text-cyan-200">
            {skill.mainLine.currentValue}
            {skill.mainLine.unit === "pct" ? "%" : ""}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
          <span>{skill.mainLine.description}</span>
          <span className="text-[10px] text-cyan-400/80 font-mono">
            +{template.mainLineDef.growthPerLevel}{skill.mainLine.unit === "pct" ? "%" : ""}/cấp
          </span>
        </div>
      </div>

      {/* Secondary Lines (Milestone lines) */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Layers className="size-3.5 text-yellow-400" />
            Dòng Phụ Ngẫu Nhiên ({skill.secondaryLines.length}/{template.maxSecondaryLines})
          </span>
          {!readOnly && skill.secondaryLines.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setRerollFeedback(null)
                setRerollModalOpen(true)
              }}
              className="flex items-center gap-1.5 rounded-sm border border-yellow-500/40 bg-yellow-950/40 px-2.5 py-1 text-[11px] font-bold text-yellow-300 hover:bg-yellow-900/50 transition-colors"
            >
              <Dices className="size-3.5 text-yellow-400" />
              Reroll Dòng Phụ 🎲 ({rerollTokens} Vé)
            </button>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {skill.secondaryLines.map((line, idx) => (
            <div
              key={line.id}
              className="flex items-center justify-between rounded border border-slate-800 bg-slate-900/60 p-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="rounded bg-yellow-500/20 px-1 py-0.5 font-mono text-[9px] font-bold text-yellow-400 border border-yellow-500/30">
                  Mốc Lv.{line.unlockedAtSkillLevel}
                </span>
                <span className="font-medium text-slate-200">{line.name}</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-cyan-300">
                  +{line.value}
                  {line.unit === "pct" ? "%" : ""}
                </span>
                <div className="text-[9px] text-slate-500 font-mono">
                  +{line.powerContribution} PT
                </div>
              </div>
            </div>
          ))}

          {/* Locked Milestones Preview */}
          {template.milestoneLevels
            .filter((m) => !skill.secondaryLines.some((l) => l.unlockedAtSkillLevel === m))
            .slice(0, template.maxSecondaryLines - skill.secondaryLines.length)
            .map((lvl) => (
              <div
                key={`locked-${lvl}`}
                className="flex items-center justify-between rounded border border-dashed border-slate-800/80 bg-slate-950/40 p-2 text-xs text-slate-500"
              >
                <div className="flex items-center gap-2">
                  <Lock className="size-3 text-slate-600" />
                  <span>Dòng Phụ Milestone</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">
                  Mở tại Cấp {lvl}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Footer controls & Admin CP trigger */}
      {onOpenAdminCP && (
        <div className="mt-3 flex justify-end border-t border-slate-900 pt-2">
          <button
            type="button"
            onClick={onOpenAdminCP}
            className="text-[10px] font-mono text-slate-500 hover:text-cyan-400 flex items-center gap-1 transition-colors"
          >
            <Cpu className="size-3" />
            Admin CP: Quản Trị Cấu Hình & Template
          </button>
        </div>
      )}

      {/* REROLL MODAL */}
      {rerollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-xl border border-yellow-500/40 bg-slate-950 p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Dices className="size-5 text-yellow-400" />
                <h4 className="font-display text-base font-bold text-white">
                  REROLL DÒNG PHỤ LIÊN HOÀN
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setRerollModalOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ Đóng
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="text-xs text-slate-300">
                Reroll áp dụng tức thời vào kỹ năng của phi công, giữ nguyên số lượng dòng và vị trí. Có thể sử dụng <strong className="text-yellow-400">Vé Reroll ({rerollTokens} khả dụng)</strong> hoặc 150 Credits.
              </div>

              {/* Reroll Type Selection */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRerollType("random")}
                  className={cn(
                    "rounded-md border p-2.5 text-left text-xs transition-colors",
                    rerollType === "random"
                      ? "border-yellow-500/60 bg-yellow-950/40 text-yellow-200"
                      : "border-slate-800 bg-slate-900/40 text-slate-400",
                  )}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <Dices className="size-3.5 text-yellow-400" />
                    Reroll Ngẫu Nhiên
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Hệ thống tự chọn ngẫu nhiên 1 dòng phụ để tái tạo lại chỉ số.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRerollType("targeted")}
                  className={cn(
                    "rounded-md border p-2.5 text-left text-xs transition-colors",
                    rerollType === "targeted"
                      ? "border-yellow-500/60 bg-yellow-950/40 text-yellow-200"
                      : "border-slate-800 bg-slate-900/40 text-slate-400",
                  )}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <Check className="size-3.5 text-yellow-400" />
                    Reroll Chỉ Định
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Chủ động lựa chọn đích danh dòng phụ cần đổi mới.
                  </div>
                </button>
              </div>

              {/* Target line selector for targeted mode */}
              {rerollType === "targeted" && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold uppercase text-slate-400">
                    Chọn dòng phụ cần Reroll:
                  </label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {skill.secondaryLines.map((line, idx) => (
                      <button
                        key={line.id}
                        type="button"
                        onClick={() => setSelectedTargetIndex(idx)}
                        className={cn(
                          "w-full flex items-center justify-between rounded border p-2 text-xs text-left transition-colors",
                          selectedTargetIndex === idx
                            ? "border-cyan-500 bg-cyan-950/50 text-cyan-200"
                            : "border-slate-800 bg-slate-900/50 text-slate-300",
                        )}
                      >
                        <div>
                          <span className="font-mono text-[10px] text-yellow-400 mr-2">
                            [Dòng {idx + 1}]
                          </span>
                          <span>{line.name}</span>
                        </div>
                        <span className="font-mono font-bold text-cyan-400">
                          +{line.value}{line.unit === "pct" ? "%" : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback banner */}
              {rerollFeedback && (
                <div className="rounded-md border border-cyan-500/40 bg-cyan-950/40 p-2.5 text-xs text-cyan-200">
                  {rerollFeedback}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-3">
              <div className="text-[11px] text-slate-400">
                Tiêu hao:{" "}
                <span className="font-bold text-yellow-400 font-mono">
                  {rerollTokens > 0 ? "1 Vé Reroll" : "150 Credits"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRerollModalOpen(false)}
                  className="rounded px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleExecuteReroll}
                  className="rounded bg-gradient-to-r from-yellow-500 to-amber-600 px-4 py-1.5 text-xs font-bold text-black shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="size-3.5" />
                  Xác Nhận Reroll Ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
