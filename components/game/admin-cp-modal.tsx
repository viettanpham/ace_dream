"use client"

import React, { useState } from "react"
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Cpu,
  Layers,
  RefreshCw,
  RotateCcw,
  Sliders,
  Sparkles,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  AdminPriorityMode,
  GlobalAdminConfig,
  PilotSynergySkillInstance,
} from "@/lib/game/pilot-skill-types"
import { PILOT_SYNERGY_TEMPLATES } from "@/lib/game/pilot-skill-templates"
import {
  advancePilotSynergySkill,
  normalizePilotSynergySkill,
} from "@/lib/game/pilot-skill-engine"
import type { StarfrontProgression } from "@/lib/game/types"

interface AdminCpModalProps {
  progression: StarfrontProgression
  isOpen: boolean
  onClose: () => void
  onUpdateProgression: (updated: StarfrontProgression) => void
}

export function AdminCpModal({
  progression,
  isOpen,
  onClose,
  onUpdateProgression,
}: AdminCpModalProps) {
  if (!isOpen) return null

  const currentConfig: GlobalAdminConfig = progression.globalAdminConfig || {
    globalMaxPilotLevel: 120,
    globalMaxSkillLevel: 30,
    priorityMode: "TEMPLATE_OVERRIDE",
    lastModified: Date.now(),
  }

  const [priorityMode, setPriorityMode] = useState<AdminPriorityMode>(currentConfig.priorityMode)
  const [maxPilotLevel, setMaxPilotLevel] = useState<number>(currentConfig.globalMaxPilotLevel)
  const [maxSkillLevel, setMaxSkillLevel] = useState<number>(currentConfig.globalMaxSkillLevel)
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>("marcus")
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleSaveConfig = () => {
    const updatedConfig: GlobalAdminConfig = {
      ...currentConfig,
      priorityMode,
      globalMaxPilotLevel: Math.max(1, maxPilotLevel),
      globalMaxSkillLevel: Math.max(1, maxSkillLevel),
      lastModified: Date.now(),
    }

    // Tự động chuẩn hóa toàn bộ kỹ năng phi công theo cấu hình mới
    const updatedSkills: Record<string, PilotSynergySkillInstance> = {}
    for (const [pId, skill] of Object.entries(progression.pilotSkills || {})) {
      updatedSkills[pId] = normalizePilotSynergySkill(skill, updatedConfig)
    }

    const updatedProgression: StarfrontProgression = {
      ...progression,
      globalAdminConfig: updatedConfig,
      pilotSkills: updatedSkills,
    }

    onUpdateProgression(updatedProgression)
    setFeedback("Đã lưu cấu hình Admin CP và tự động chuẩn hóa toàn bộ kỹ năng phi công!")
  }

  const handleNormalizeAll = () => {
    const updatedSkills: Record<string, PilotSynergySkillInstance> = {}
    for (const [pId, skill] of Object.entries(progression.pilotSkills || {})) {
      updatedSkills[pId] = normalizePilotSynergySkill(skill, currentConfig)
    }
    onUpdateProgression({
      ...progression,
      pilotSkills: updatedSkills,
    })
    setFeedback("Đã chuẩn hóa toàn bộ dữ liệu Kỹ Năng Liên Hoàn theo quy chuẩn!")
  }

  const handleAddTokens = () => {
    const currentTokens = progression.rerollTokens || 0
    onUpdateProgression({
      ...progression,
      rerollTokens: currentTokens + 10,
    })
    setFeedback("Đã cộng thêm +10 Vé Reroll Dòng Phụ vào tài khoản!")
  }

  const handleTestLevelUpActivePilot = () => {
    const activePilotId = progression.activePairing?.pilotId || "marcus"
    const pilots = { ...(progression.pilots || {}) }
    const currentPilot = pilots[activePilotId] || {
      id: activePilotId,
      level: 1,
      exp: 0,
      allocatedStats: { attack: 0, defense: 0, agility: 0, shield: 0, tactical: 0 },
      availablePoints: 0,
    }

    const newLevel = Math.min(maxPilotLevel, currentPilot.level + 5)
    const pointsGained = (newLevel - currentPilot.level) * 5
    pilots[activePilotId] = {
      ...currentPilot,
      level: newLevel,
      availablePoints: currentPilot.availablePoints + pointsGained,
    }

    const pilotSkills = { ...(progression.pilotSkills || {}) }
    if (pilotSkills[activePilotId]) {
      pilotSkills[activePilotId] = advancePilotSynergySkill(
        pilotSkills[activePilotId],
        newLevel,
        currentConfig,
      )
    }

    onUpdateProgression({
      ...progression,
      pilots,
      pilotSkills,
    })
    setFeedback(`Đã nâng phi công [${activePilotId.toUpperCase()}] từ Lv.${currentPilot.level} lên Lv.${newLevel} (Kiểm thử mở milestone tuần tự)!`)
  }

  const activeTemplate = PILOT_SYNERGY_TEMPLATES[selectedTemplateKey]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-xl border border-cyan-500/40 bg-slate-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="size-6 text-cyan-400" />
            <div>
              <h3 className="font-display text-lg font-bold text-white tracking-wide">
                STARFRONT ADMIN CONTROL PANEL (ADMIN CP)
              </h3>
              <p className="text-[11px] text-slate-400">
                Quản trị Cấu hình Toàn cục, Template Kỹ Năng Liên Hoàn & Normalization Engine
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Priority Mode Switcher */}
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
            Chế Độ Ưu Tiên Giới Hạn Cấp (Priority Mode)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPriorityMode("TEMPLATE_OVERRIDE")}
              className={cn(
                "rounded-md border p-3 text-left transition-colors",
                priorityMode === "TEMPLATE_OVERRIDE"
                  ? "border-cyan-500 bg-cyan-950/50 text-white"
                  : "border-slate-800 bg-slate-950/40 text-slate-400",
              )}
            >
              <div className="font-bold text-xs flex items-center gap-1.5 text-cyan-300">
                <Check className="size-3.5" />
                Template Override (Mặc Định)
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Từng Skill Template được phép quy định trần cấp độ riêng. Đảm bảo tính linh hoạt cho từng nhân vật.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPriorityMode("GLOBAL_PRIORITY")}
              className={cn(
                "rounded-md border p-3 text-left transition-colors",
                priorityMode === "GLOBAL_PRIORITY"
                  ? "border-cyan-500 bg-cyan-950/50 text-white"
                  : "border-slate-800 bg-slate-950/40 text-slate-400",
              )}
            >
              <div className="font-bold text-xs flex items-center gap-1.5 text-cyan-300">
                <Sliders className="size-3.5" />
                Global Priority
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Cấu hình toàn cục luôn được ưu tiên tuyệt đối và áp đặt lên toàn bộ mọi Skill Template.
              </div>
            </button>
          </div>
        </div>

        {/* Global Level Configuration */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
              Giới Hạn Cấp Phi Công Toàn Cục (Global Max Pilot Level)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={200}
                value={maxPilotLevel}
                onChange={(e) => setMaxPilotLevel(Number(e.target.value) || 120)}
                className="w-full rounded border border-slate-700 bg-slate-950 p-2 font-mono text-sm text-cyan-300"
              />
              <span className="text-xs text-slate-400 font-mono">Cấp (Mặc định: 120)</span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
              Giới Hạn Cấp Kỹ Năng Toàn Cục (Global Max Skill Level)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={50}
                value={maxSkillLevel}
                onChange={(e) => setMaxSkillLevel(Number(e.target.value) || 30)}
                className="w-full rounded border border-slate-700 bg-slate-950 p-2 font-mono text-sm text-cyan-300"
              />
              <span className="text-xs text-slate-400 font-mono">Cấp (Mặc định: 30)</span>
            </div>
          </div>
        </div>

        {/* Template Inspector */}
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase text-slate-300">
              Kiểm Tra Chi Tiết Skill Template
            </span>
            <div className="flex gap-1.5">
              {Object.keys(PILOT_SYNERGY_TEMPLATES).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedTemplateKey(key)}
                  className={cn(
                    "rounded px-2.5 py-1 text-[11px] font-mono font-bold transition-colors uppercase",
                    selectedTemplateKey === key
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700",
                  )}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {activeTemplate && (
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-bold text-white">{activeTemplate.name} ({activeTemplate.nameEn})</span>
                <span className="font-mono text-cyan-400 font-bold">
                  Phân Loại: {activeTemplate.skillType} · Cơ Giáp: {activeTemplate.signatureGearId.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                <div className="rounded bg-slate-950 p-2 border border-slate-800">
                  <div className="text-slate-500">Cơ Chế Kích Hoạt</div>
                  <div className="font-bold text-white">{activeTemplate.isPassive ? "Tự Động Passive" : "Chủ Động Active"}</div>
                </div>
                <div className="rounded bg-slate-950 p-2 border border-slate-800">
                  <div className="text-slate-500">Tiêu Hao / Hồi Chiêu</div>
                  <div className="font-bold text-white">{activeTemplate.spCost} SP · {activeTemplate.cooldownTurns} Lượt</div>
                </div>
                <div className="rounded bg-slate-950 p-2 border border-slate-800">
                  <div className="text-slate-500">Budget Skill Power</div>
                  <div className="font-bold text-yellow-400">{activeTemplate.maxSkillPowerBudget} PT</div>
                </div>
              </div>

              <div className="mt-2 text-[11px] text-slate-400">
                <strong>Bể Candidate Pool ({activeTemplate.candidatePool.length} thuộc tính):</strong>{" "}
                {activeTemplate.candidatePool.map((c) => c.name).join(", ")}
              </div>
            </div>
          )}
        </div>

        {/* Quick Operations */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={handleNormalizeAll}
            className="flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="size-3.5 text-cyan-400" />
            Chuẩn Hóa Tất Cả Kỹ Năng
          </button>

          <button
            type="button"
            onClick={handleAddTokens}
            className="flex items-center gap-1.5 rounded border border-yellow-500/40 bg-yellow-950/40 px-3 py-1.5 text-xs text-yellow-300 hover:bg-yellow-900/40 transition-colors"
          >
            <Sparkles className="size-3.5 text-yellow-400" />
            +10 Vé Reroll (Test)
          </button>

          <button
            type="button"
            onClick={handleTestLevelUpActivePilot}
            className="flex items-center gap-1.5 rounded border border-cyan-500/40 bg-cyan-950/40 px-3 py-1.5 text-xs text-cyan-300 hover:bg-cyan-900/40 transition-colors"
          >
            <Zap className="size-3.5 text-cyan-400" />
            +5 Cấp Pilot (Test Milestone)
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className="mt-3 rounded border border-cyan-500/40 bg-cyan-950/40 p-2 text-xs text-cyan-300">
            {feedback}
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-4 py-2 text-xs text-slate-400 hover:text-white"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSaveConfig}
            className="rounded bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-bold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            Lưu & Áp Dụng Cấu Hình Toàn Cục
          </button>
        </div>
      </div>
    </div>
  )
}
