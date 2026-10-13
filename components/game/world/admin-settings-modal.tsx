"use client"

import React, { useState, useEffect } from "react"
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  Flame,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Save,
  Shield,
  ShieldAlert,
  Sliders,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { playClickSound, playLevelUpSound, playShieldSound } from "@/lib/game/audio"
import {
  DEFAULT_SIMULATOR_CONFIG,
  DEFAULT_GENERATOR_CONFIG,
  DEFAULT_EVENT_STRATEGY_POLICY,
  validateSimulatorConfig,
  type WorldSimulatorConfig,
  type EventStrategyPolicyConfig,
  type TierStrategyPreference,
} from "@/lib/game/world/simulator-config"
import { getGameCalendarInfo } from "@/lib/game/world/calendar"
import {
  getOperationsArchiveConfig,
  updateOperationsArchiveConfig,
} from "@/lib/game/world/operations-archive"
import { saveWorldState } from "@/lib/game/world/storage"
import type { WorldState } from "@/lib/game/world/types"

export type AdminModalTab = "all" | "speed" | "generator" | "policy" | "triggers" | "storage"

export interface AdminSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  worldState: WorldState | null
  simulatorConfig: WorldSimulatorConfig
  countdownSeconds: number
  dayFraction: number
  calendarInfo: ReturnType<typeof getGameCalendarInfo>
  eventTierCounts: { small: number; medium: number; large: number; total: number }
  isTickAdvancing: boolean
  // Handler callbacks
  onTogglePause: () => void
  onConfirmSpeedChange: (newSpeed: number, resetWorld: boolean) => void
  onConfirmResetWorld: () => void
  onSaveGeneratorConfig: (genConfig: typeof DEFAULT_SIMULATOR_CONFIG.generator) => void
  onResetGeneratorToDefault: () => void
  onSaveStrategyPolicy: (policyConfig: EventStrategyPolicyConfig) => void
  onResetStrategyPolicyToDefault: () => void
  onBatchApplyStrategyPolicy: (policyConfig: EventStrategyPolicyConfig) => void
  onForceSpawnEvent: (tier: "small" | "medium" | "large") => void
  onFastForwardDays: (days: number) => void
  onAdvanceTick: () => void
  onManualSave: () => void
}

export function AdminSettingsModal({
  isOpen,
  onClose,
  worldState,
  simulatorConfig,
  countdownSeconds,
  dayFraction,
  calendarInfo,
  eventTierCounts,
  isTickAdvancing,
  onTogglePause,
  onConfirmSpeedChange,
  onConfirmResetWorld,
  onSaveGeneratorConfig,
  onResetGeneratorToDefault,
  onSaveStrategyPolicy,
  onResetStrategyPolicyToDefault,
  onBatchApplyStrategyPolicy,
  onForceSpawnEvent,
  onFastForwardDays,
  onAdvanceTick,
  onManualSave,
}: AdminSettingsModalProps) {
  // Tabs trong modal
  const [activeTab, setActiveTab] = useState<AdminModalTab>("all")

  // Form states cục bộ trong modal
  const [customSpeedInput, setCustomSpeedInput] = useState<string>("")
  const [generatorForm, setGeneratorForm] = useState(simulatorConfig.generator || DEFAULT_SIMULATOR_CONFIG.generator)
  const [strategyPolicyForm, setStrategyPolicyForm] = useState<EventStrategyPolicyConfig>(
    simulatorConfig.strategyPolicy || DEFAULT_EVENT_STRATEGY_POLICY
  )
  const [archiveConfigForm, setArchiveConfigForm] = useState(() => {
    return worldState ? getOperationsArchiveConfig(worldState) : { eventArchiveQuota: 60, battleArchiveQuota: 40 }
  })
  const [archiveSavedFeedback, setArchiveSavedFeedback] = useState(false)

  // Sub-dialog xác nhận đổi tốc độ
  const [isSpeedConfirmOpen, setIsSpeedConfirmOpen] = useState(false)
  const [pendingSpeed, setPendingSpeed] = useState<number | null>(null)
  const [resetWorldOnSpeedChange, setResetWorldOnSpeedChange] = useState<boolean>(false)

  // Sub-dialog xác nhận Reset World
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)

  // Đồng bộ form khi modal mở hoặc simulatorConfig thay đổi
  useEffect(() => {
    if (isOpen) {
      setGeneratorForm(simulatorConfig.generator || DEFAULT_SIMULATOR_CONFIG.generator)
      setStrategyPolicyForm(simulatorConfig.strategyPolicy || DEFAULT_EVENT_STRATEGY_POLICY)
      if (worldState) {
        setArchiveConfigForm(getOperationsArchiveConfig(worldState))
      }
    }
  }, [isOpen, simulatorConfig, worldState])

  // Lắng nghe phím ESC để đóng dialog phân cấp (Sub-dialog trước, modal sau)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isSpeedConfirmOpen) {
          setIsSpeedConfirmOpen(false)
          setPendingSpeed(null)
          setResetWorldOnSpeedChange(false)
        } else if (isResetConfirmOpen) {
          setIsResetConfirmOpen(false)
        } else {
          playClickSound()
          onClose()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, isSpeedConfirmOpen, isResetConfirmOpen, onClose])

  if (!isOpen) return null

  // Yêu cầu đổi tốc độ
  const handleRequestSpeed = (speed: number) => {
    if (speed === simulatorConfig.speedSeconds) return
    playClickSound()
    setPendingSpeed(speed)
    setResetWorldOnSpeedChange(false)
    setIsSpeedConfirmOpen(true)
  }

  // Xác nhận đổi tốc độ từ sub-dialog
  const handleConfirmSpeedDialog = () => {
    if (!pendingSpeed) return
    onConfirmSpeedChange(pendingSpeed, resetWorldOnSpeedChange)
    setIsSpeedConfirmOpen(false)
    setPendingSpeed(null)
    setResetWorldOnSpeedChange(false)
  }

  // Hủy đổi tốc độ từ sub-dialog
  const handleCancelSpeedDialog = () => {
    playClickSound()
    setIsSpeedConfirmOpen(false)
    setPendingSpeed(null)
    setResetWorldOnSpeedChange(false)
  }

  // Áp dụng tốc độ tùy chỉnh
  const handleApplyCustomSpeed = () => {
    const parsed = parseInt(customSpeedInput.trim(), 10)
    if (isNaN(parsed) || parsed <= 0 || parsed > 86400) {
      return
    }
    handleRequestSpeed(parsed)
    setCustomSpeedInput("")
  }

  // Lưu Generator
  const handleSaveGenerator = () => {
    playClickSound()
    onSaveGeneratorConfig(generatorForm)
  }

  // Khôi phục mặc định Generator
  const handleResetGenerator = () => {
    playClickSound()
    setGeneratorForm(DEFAULT_GENERATOR_CONFIG)
    onResetGeneratorToDefault()
  }

  // Lưu Policy
  const handleSavePolicy = () => {
    playClickSound()
    onSaveStrategyPolicy(strategyPolicyForm)
  }

  // Khôi phục mặc định Policy
  const handleResetPolicy = () => {
    playClickSound()
    setStrategyPolicyForm({ ...DEFAULT_EVENT_STRATEGY_POLICY })
    onResetStrategyPolicyToDefault()
  }

  // Áp dụng hàng loạt Policy
  const handleBatchApply = () => {
    playClickSound()
    onBatchApplyStrategyPolicy(strategyPolicyForm)
  }

  // Xác nhận Reset World từ sub-dialog
  const handleConfirmResetDialog = () => {
    onConfirmResetWorld()
    setIsResetConfirmOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-lg border border-amber-500/60 bg-zinc-950 shadow-2xl shadow-amber-950/60 font-mono text-zinc-200 select-none overflow-hidden">
        
        {/* ====================================================================
            HEADER CỐ ĐỊNH CỦA MODAL
            ==================================================================== */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded bg-amber-950/80 border border-amber-500/60 text-amber-300">
              <Sliders className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-sm sm:text-base font-black tracking-wider text-amber-300 uppercase">
                  CÀI ĐẶT & QUẢN TRỊ VIÊN // ADMIN CP
                </h2>
                <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-zinc-400 border border-zinc-800">
                  ISOLATED SETTINGS
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Cấu hình nhịp độ thời gian thực, bộ sinh Event/Quest, chính sách chiến lược & bảo trì dữ liệu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Status Pill */}
            <span
              className={cn(
                "hidden sm:flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold border",
                simulatorConfig.isPaused
                  ? "border-amber-500/60 bg-amber-950/50 text-amber-300"
                  : "border-emerald-500/60 bg-emerald-950/50 text-emerald-300"
              )}
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  simulatorConfig.isPaused ? "bg-amber-400" : "bg-emerald-400 animate-ping"
                )}
              />
              <span>{simulatorConfig.isPaused ? "PAUSED" : `${simulatorConfig.speedSeconds}s/Ngày`}</span>
            </span>

            {/* Nút đóng modal */}
            <button
              type="button"
              onClick={() => {
                playClickSound()
                onClose()
              }}
              className="flex items-center gap-1 rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-500 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Đóng cửa sổ quản trị (Phím ESC)"
            >
              <X className="size-4" />
              <span className="hidden sm:inline">Đóng (ESC)</span>
            </button>
          </div>
        </div>

        {/* ====================================================================
            NAVIGATION TABS TRONG MODAL
            ==================================================================== */}
        <div className="flex flex-wrap items-center gap-1 border-b border-zinc-800 bg-black/40 px-4 py-2 shrink-0 text-xs">
          {[
            { id: "all", label: "Tất Cả Mục", icon: Sliders },
            { id: "speed", label: "1. Tốc Độ & Thời Gian", icon: Clock },
            { id: "generator", label: "2. Bộ Sinh Sự Kiện", icon: Flame },
            { id: "policy", label: "3. Chính Sách Chiến Lược", icon: Sparkles },
            { id: "triggers", label: "4. Thử Nghiệm Nhanh", icon: Zap },
            { id: "storage", label: "5. Lưu Trữ & Reset", icon: Database },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  playClickSound()
                  setActiveTab(tab.id as AdminModalTab)
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
                  isActive
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                )}
              >
                <Icon className={cn("size-3.5", isActive ? "text-amber-400" : "text-zinc-500")} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* ====================================================================
            BODY NỘI DUNG CUỘN (SCROLLABLE CONTENT)
            ==================================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* BANNER TỔNG QUAN THỜI GIAN THỰC */}
          {(activeTab === "all" || activeTab === "speed") && (
            <div className="rounded border border-amber-500/40 bg-zinc-900/60 p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-cyan-400" />
                  <span className="font-bold text-xs uppercase text-cyan-300">
                    Trạng Thái Động Cơ Thời Gian Thực (Real-time Engine)
                  </span>
                </div>
                
                <button
                  type="button"
                  onClick={onTogglePause}
                  className={cn(
                    "flex items-center gap-1.5 rounded border px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                    simulatorConfig.isPaused
                      ? "border-emerald-500/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60"
                      : "border-amber-500/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60"
                  )}
                >
                  {simulatorConfig.isPaused ? (
                    <Play className="size-3.5 fill-current text-emerald-400" />
                  ) : (
                    <Pause className="size-3.5 text-amber-400" />
                  )}
                  <span>{simulatorConfig.isPaused ? "Tiếp Tục Mô Phỏng" : "Tạm Dừng Thế Giới"}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="rounded bg-black/40 p-2 border border-zinc-800">
                  <div className="text-zinc-500 text-[10px] uppercase font-bold">Tốc Độ Hiện Tại</div>
                  <div className="font-mono font-black text-cyan-300 text-sm">
                    1 Ngày = {simulatorConfig.speedSeconds}s
                  </div>
                </div>

                <div className="rounded bg-black/40 p-2 border border-zinc-800">
                  <div className="text-zinc-500 text-[10px] uppercase font-bold">Kế Tiếp Sau</div>
                  <div className="font-mono font-black text-amber-300 text-sm">
                    {simulatorConfig.isPaused ? "ĐÃ TẠM DỪNG" : `${countdownSeconds} giây`}
                  </div>
                </div>

                <div className="rounded bg-black/40 p-2 border border-zinc-800">
                  <div className="text-zinc-500 text-[10px] uppercase font-bold">Niên Lịch & Buổi</div>
                  <div className="font-mono font-bold text-zinc-200 truncate">
                    {calendarInfo.timeString} · {calendarInfo.cycleName} ({calendarInfo.seasonIcon})
                  </div>
                </div>

                <div className="rounded bg-black/40 p-2 border border-zinc-800">
                  <div className="text-zinc-500 text-[10px] uppercase font-bold">Sự Kiện Đang Chạy</div>
                  <div className="font-mono font-bold text-cyan-300">
                    {eventTierCounts.total} / {simulatorConfig.generator.maxGlobalActive} (N:{eventTierCounts.small} · V:{eventTierCounts.medium} · L:{eventTierCounts.large})
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              KHỐI 1: CẤU HÌNH TỐC ĐỘ THỜI GIAN THỰC (SIMULATION SPEED)
              ================================================================ */}
          {(activeTab === "all" || activeTab === "speed") && (
            <div className="rounded border border-zinc-800 bg-zinc-950/80 p-4 space-y-3.5 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase text-cyan-300 tracking-wider">
                    1. Cấu Hình Tốc Độ Mô Phỏng Thời Gian Thực (Simulation Speed)
                  </h3>
                </div>
                <span className="text-[10px] text-zinc-400">
                  Mặc định: 300s/ngày (5 phút) · 15s/ngày là chế độ test nhanh
                </span>
              </div>

              <div className="space-y-3">
                {/* Presets */}
                <div>
                  <label className="text-[11px] text-zinc-400 font-bold block mb-1.5">
                    Chọn Preset Tốc Độ (Presets):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { sec: 15, label: "15 Giây / Ngày", desc: "Test Siêu Nhanh", isFast: true },
                      { sec: 30, label: "30 Giây / Ngày", desc: "Nhanh Gấp 10x" },
                      { sec: 60, label: "60 Giây / Ngày", desc: "1 Phút / Ngày" },
                      { sec: 300, label: "300 Giây / Ngày", desc: "Mặc Định (5 Phút)", isDefault: true },
                    ].map((preset) => {
                      const isSelected = simulatorConfig.speedSeconds === preset.sec
                      return (
                        <button
                          key={preset.sec}
                          type="button"
                          onClick={() => handleRequestSpeed(preset.sec)}
                          className={cn(
                            "rounded border p-2.5 text-left transition-all cursor-pointer relative",
                            isSelected
                              ? "border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-md shadow-cyan-950/50"
                              : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-xs">{preset.label}</span>
                            {isSelected && (
                              <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">{preset.desc}</div>
                          {preset.isFast && (
                            <span className="absolute top-1 right-1 rounded bg-amber-500/20 px-1 text-[8px] text-amber-300 font-bold">
                              TEST
                            </span>
                          )}
                          {preset.isDefault && (
                            <span className="absolute top-1 right-1 rounded bg-cyan-500/20 px-1 text-[8px] text-cyan-300 font-bold">
                              DEFAULT
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Custom speed */}
                <div className="rounded bg-zinc-900/40 p-3 border border-zinc-800/80">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-[11px] text-zinc-300 font-bold">
                      Tùy Chỉnh Tốc Độ Bất Kỳ (Custom Seconds):
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={86400}
                        value={customSpeedInput}
                        onChange={(e) => setCustomSpeedInput(e.target.value)}
                        placeholder="ví dụ: 45, 120, 600..."
                        className="rounded border border-zinc-700 bg-black/60 px-2.5 py-1 text-xs font-mono text-zinc-200 w-36 focus:border-cyan-400 focus:outline-none"
                      />
                      <span className="text-[11px] text-zinc-400">giây / ngày</span>
                      <button
                        type="button"
                        onClick={handleApplyCustomSpeed}
                        disabled={!customSpeedInput.trim()}
                        className={cn(
                          "rounded border border-cyan-500/60 bg-cyan-950/60 px-3 py-1 text-xs font-bold text-cyan-300 hover:bg-cyan-900/60 transition-colors cursor-pointer",
                          !customSpeedInput.trim() && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        Áp Dụng
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1.5">
                    Lưu ý: Tốc độ được lưu cố định vào cấu hình và tự động khôi phục khi tải lại trang. Thay đổi tốc độ bảo toàn 100% tiến độ ngày hiện tại.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              KHỐI 2: CẤU HÌNH TỰ ĐỘNG SINH SỰ KIỆN & NHIỆM VỤ (WORLD GENERATOR)
              ================================================================ */}
          {(activeTab === "all" || activeTab === "generator") && (
            <div className="rounded border border-zinc-800 bg-zinc-950/80 p-4 space-y-3.5 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <Flame className="size-4 text-amber-400" />
                  <h3 className="text-xs font-bold uppercase text-amber-300 tracking-wider">
                    2. Cấu Hình Tự Động Sinh Sự Kiện & Nhiệm Vụ (Event / Quest Generator)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400">Trần Toàn Cầu:</span>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={generatorForm.maxGlobalActive}
                    onChange={(e) =>
                      setGeneratorForm({
                        ...generatorForm,
                        maxGlobalActive: Math.max(1, parseInt(e.target.value, 10) || 1),
                      })
                    }
                    className="rounded border border-zinc-700 bg-black/60 px-2 py-0.5 text-xs font-mono text-cyan-300 w-16 text-center focus:border-cyan-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500">events</span>
                </div>
              </div>

              <p className="text-[10px] text-zinc-400">
                Toàn bộ chu kỳ sinh và thời gian tồn tại (lifetime) được định lượng bằng <strong>NGÀY GAME</strong> (Game Days), không dùng giây thực. Khi thay đổi tốc độ thế giới, nhịp độ gameplay trong vũ trụ vẫn được bảo toàn tuyệt đối.
              </p>

              {/* Bảng 3 Tier Cấu hình */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Tier 1: Nhỏ (Small) */}
                <div className="rounded border border-cyan-500/30 bg-zinc-900/40 p-3 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-cyan-400" />
                      <span className="font-bold text-xs text-cyan-300 uppercase">Sự Kiện Nhỏ (Small)</span>
                    </div>
                    <label className="flex items-center gap-1 cursor-pointer text-[10px] text-zinc-300">
                      <input
                        type="checkbox"
                        checked={generatorForm.small.enabled}
                        onChange={(e) =>
                          setGeneratorForm({
                            ...generatorForm,
                            small: { ...generatorForm.small, enabled: e.target.checked },
                          })
                        }
                        className="rounded accent-cyan-400"
                      />
                      <span>Kích Hoạt</span>
                    </label>
                  </div>

                  <div className="text-[10px] text-zinc-400">
                    Hiện có: <strong className="text-cyan-300 font-mono">{eventTierCounts.small}</strong> / {generatorForm.small.maxActive} đang active
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Chu kỳ sinh (Ngày game):</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <input
                          type="number"
                          step={0.1}
                          min={0.1}
                          value={generatorForm.small.minIntervalDays}
                          onChange={(e) =>
                            setGeneratorForm({
                              ...generatorForm,
                              small: { ...generatorForm.small, minIntervalDays: parseFloat(e.target.value) || 0.1 },
                            })
                          }
                          className="rounded border border-zinc-700 bg-black/60 px-1.5 py-0.5 text-xs font-mono text-zinc-200 w-16 text-center"
                        />
                        <span className="text-zinc-500">&rarr;</span>
                        <input
                          type="number"
                          step={0.1}
                          min={0.1}
                          value={generatorForm.small.maxIntervalDays}
                          onChange={(e) =>
                            setGeneratorForm({
                              ...generatorForm,
                              small: { ...generatorForm.small, maxIntervalDays: parseFloat(e.target.value) || 1 },
                            })
                          }
                          className="rounded border border-zinc-700 bg-black/60 px-1.5 py-0.5 text-xs font-mono text-zinc-200 w-16 text-center"
                        />
                        <span className="text-zinc-500 text-[10px]">ngày</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-zinc-500 text-[10px] block">Thời gian tồn tại (Ngày game):</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <input
                          type="number"
                          step={0.5}
                          min={0.5}
                          value={generatorForm.small.minLifetimeDays}
                          onChange={(e) =>
                            setGeneratorForm({
                              ...generatorForm,
                              small: { ...generatorForm.small, minLifetimeDays: parseFloat(e.target.value) || 0.5 },
                            })
                          }
                          className="rounded border border-zinc-700 bg-black/60 px-1.5 py-0.5 text-xs font-mono text-zinc-200 w-16 text-center"
                        />
                        <span className="text-zinc-500">&rarr;</span>
                        <input
                          type="number"
                          step={0.5}
                          min={0.5}
                          value={generatorForm.small.maxLifetimeDays}
                          onChange={(e) =>
                            setGeneratorForm({
                              ...generatorForm,
                              small: { ...generatorForm.small, maxLifetimeDays: parseFloat(e.target.value) || 1 },
                            })
                          }
                          className="rounded border border-zinc-700 bg-black/60 px-1.5 py-0.5 text-xs font-mono text-zinc-200 w-16 text-center"
                        />
                        <span className="text-zinc-500 text-[10px]">ngày</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-zinc-500 text-[10px] block">Giới hạn đồng thời (Max Active):</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={generatorForm.small.maxActive}
                        onChange={(e) =>
                          setGeneratorForm({
                            ...generatorForm,
                            small: { ...generatorForm.small, maxActive: parseInt(e.target.value, 10) || 1 },
                          })
                        }
                        className="rounded border border-zinc-700 bg-black/60 px-2 py-0.5 text-xs font-mono text-zinc-200 w-20 text-center mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Tier 2: Vừa (Medium) */}
                <div className="rounded border border-amber-500/30 bg-zinc-900/40 p-3 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-amber-400" />
                      <span className="font-bold text-xs text-amber-300 uppercase">Sự Kiện Vừa (Medium)</span>
                    </div>
                    <label className="flex items-center gap-1 cursor-pointer text-[10px] text-zinc-300">
                      <input
                        type="checkbox"
                        checked={generatorForm.medium.enabled}
                        onChange={(e) =>
                          setGeneratorForm({
                            ...generatorForm,
                            medium: { ...generatorForm.medium, enabled: e.target.checked },
                          })
                        }
                        className="rounded accent-amber-400"
                      />
                      <span>Kích Hoạt</span>
                    </label>
                  </div>

                  <div className="text-[10px] text-zinc-400">
                    Hiện có: <strong className="text-amber-300 font-mono">{eventTierCounts.medium}</strong> / {generatorForm.medium.maxActive} đang active
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Chu kỳ sinh (Ngày game):</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <input
                          type="number"
                          step={0.5}
                          min={0.5}
                          value={generatorForm.medium.minIntervalDays}
                          onChange={(e) =>
                            setGeneratorForm({
                              ...generatorForm,
                              medium: { ...generatorForm.medium, minIntervalDays: parseFloat(e.target.value) || 0.5 },
                            })
                          }
                          className="rounded border border-zinc-700 bg-black/60 px-1.5 py-0.5 text-xs font-mono text-zinc-200 w-16 text-center"
                        />
                        <span className="text-zinc-500">&rarr;</span>
                        <input
                          type="number"
                          step={0.5}
                          min={0.5}
                          value={generatorForm.medium.maxIntervalDays}
                          onChange={(e) =>
                            setGeneratorForm({
                              ...generatorForm,
                              medium: { ...generatorForm.medium, maxIntervalDays: parseFloat(e.target.value) || 2 },
                            })
                          }
                          className="rounded border border-zinc-700 bg-black/60 px-1.5 py-0.5 text-xs font-mono text-zinc-200 w-16 text-center"
                        />
                        <span className="text-zinc-500 text-[10px]">ngày</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-zinc-500 text-[10px] block">Thời gian tồn tại (Ngày game):</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <input
                          type="number"
                          step={1}
                          min={1}
                          value={generatorForm.medium.minLifetimeDays}
                          onChange={(e) =>
                            setGeneratorForm({
                              ...generatorForm,
                              medium: { ...generatorForm.medium, minLifetimeDays: parseFloat(e.target.value) || 1 },
                            })
                          }
                          className="rounded border border-zinc-700 bg-black/60 px-1.5 py-0.5 text-xs font-mono text-zinc-200 w-16 text-center"
                        />
                        <span className="text-zinc-500">&rarr;</span>
                        <input
                          type="number"
                          step={1}
                          min={1}
                          value={generatorForm.medium.maxLifetimeDays}
                          onChange={(e) =>
                            setGeneratorForm({
                              ...generatorForm,
                              medium: { ...generatorForm.medium, maxLifetimeDays: parseFloat(e.target.value) || 5 },
                            })
                          }
                          className="rounded border border-zinc-700 bg-black/60 px-1.5 py-0.5 text-xs font-mono text-zinc-200 w-16 text-center"
                        />
                        <span className="text-zinc-500 text-[10px]">ngày</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-zinc-500 text-[10px] block">Giới hạn đồng thời (Max Active):</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={generatorForm.medium.maxActive}
                        onChange={(e) =>
                          setGeneratorForm({
                            ...generatorForm,
                            medium: { ...generatorForm.medium, maxActive: parseInt(e.target.value, 10) || 1 },
                          })
                        }
                        className="rounded border border-zinc-700 bg-black/60 px-2 py-0.5 text-xs font-mono text-zinc-200 w-20 text-center mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Tier 3: Lớn (Large) */}
                <div className="rounded border border-rose-500/30 bg-zinc-900/40 p-3 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-rose-400" />
                      <span className="font-bold text-xs text-rose-300 uppercase">Sự Kiện Lớn (Large)</span>
                    </div>
                    <label className="flex items-center gap-1 cursor-pointer text-[10px] text-zinc-300">
                      <input
                        type="checkbox"
                        checked={generatorForm.large.enabled}
                        onChange={(e) =>
                          setGeneratorForm({
                            ...generatorForm,
                            large: { ...generatorForm.large, enabled: e.target.checked },
                          })
                        }
                        className="rounded accent-rose-400"
                      />
                      <span>Kích Hoạt</span>
                    </label>
                  </div>

                  <div className="text-[10px] text-zinc-400">
                    Hiện có: <strong className="text-rose-300 font-mono">{eventTierCounts.large}</strong> / {generatorForm.large.maxActive} đang active
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Chu kỳ sinh (Ngày game):</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <input
                          type="number"
                          step={1}
                          min={1}
                          value={generatorForm.large.minIntervalDays}
                          onChange={(e) =>
                            setGeneratorForm({
                              ...generatorForm,
                              large: { ...generatorForm.large, minIntervalDays: parseFloat(e.target.value) || 5 },
                            })
                          }
                          className="rounded border border-zinc-700 bg-black/60 px-1.5 py-0.5 text-xs font-mono text-zinc-200 w-16 text-center"
                        />
                        <span className="text-zinc-500">&rarr;</span>
                        <input
                          type="number"
                          step={1}
                          min={1}
                          value={generatorForm.large.maxIntervalDays}
                          onChange={(e) =>
                            setGeneratorForm({
                              ...generatorForm,
                              large: { ...generatorForm.large, maxIntervalDays: parseFloat(e.target.value) || 10 },
                            })
                          }
                          className="rounded border border-zinc-700 bg-black/60 px-1.5 py-0.5 text-xs font-mono text-zinc-200 w-16 text-center"
                        />
                        <span className="text-zinc-500 text-[10px]">ngày</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-zinc-500 text-[10px] block">Thời gian tồn tại (Ngày game):</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <input
                          type="number"
                          step={1}
                          min={1}
                          value={generatorForm.large.minLifetimeDays}
                          onChange={(e) =>
                            setGeneratorForm({
                              ...generatorForm,
                              large: { ...generatorForm.large, minLifetimeDays: parseFloat(e.target.value) || 5 },
                            })
                          }
                          className="rounded border border-zinc-700 bg-black/60 px-1.5 py-0.5 text-xs font-mono text-zinc-200 w-16 text-center"
                        />
                        <span className="text-zinc-500">&rarr;</span>
                        <input
                          type="number"
                          step={1}
                          min={1}
                          value={generatorForm.large.maxLifetimeDays}
                          onChange={(e) =>
                            setGeneratorForm({
                              ...generatorForm,
                              large: { ...generatorForm.large, maxLifetimeDays: parseFloat(e.target.value) || 20 },
                            })
                          }
                          className="rounded border border-zinc-700 bg-black/60 px-1.5 py-0.5 text-xs font-mono text-zinc-200 w-16 text-center"
                        />
                        <span className="text-zinc-500 text-[10px]">ngày</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-zinc-500 text-[10px] block">Giới hạn đồng thời (Max Active):</span>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={generatorForm.large.maxActive}
                        onChange={(e) =>
                          setGeneratorForm({
                            ...generatorForm,
                            large: { ...generatorForm.large, maxActive: parseInt(e.target.value, 10) || 1 },
                          })
                        }
                        className="rounded border border-zinc-700 bg-black/60 px-2 py-0.5 text-xs font-mono text-zinc-200 w-20 text-center mt-0.5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons for Generator */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={handleResetGenerator}
                  className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="size-3.5 text-zinc-400" />
                  <span>Khôi Phục Mặc Định</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveGenerator}
                  className="flex items-center gap-1.5 rounded border border-cyan-400 bg-cyan-600/40 px-3.5 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-600/60 hover:text-white transition-all cursor-pointer shadow-md shadow-cyan-950/50"
                >
                  <Save className="size-3.5" />
                  <span>Lưu Cấu Hình Generator</span>
                </button>
              </div>
            </div>
          )}

          {/* ================================================================
              KHỐI 3: CẤU HÌNH CHÍNH SÁCH CHIẾN LƯỢC SỰ KIỆN (STRATEGY POLICY)
              ================================================================ */}
          {(activeTab === "all" || activeTab === "policy") && (
            <div className="rounded border border-zinc-800 bg-zinc-950/80 p-4 space-y-3.5 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase text-cyan-300 tracking-wider">
                    3. Chính Sách Lựa Chọn Chiến Lược Sự Kiện (Event Strategy Policy & System Auto)
                  </h3>
                </div>
                <span className="text-[10px] text-zinc-400">
                  Ưu tiên 3 cấp: System Auto &rarr; Default Fallback &rarr; Player Choice
                </span>
              </div>

              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Hệ thống tự động đánh giá các chiến lược hợp lệ dựa trên tỷ lệ thành công, biến động độ ổn định, mức đe dọa, ngữ cảnh sector, chi phí và tổn thất. Khi tự động không khả thi, hệ thống lùi về phương án mặc định, hoặc chuyển quyền quyết định cho Chỉ Huy mà không crash simulator.
              </p>

              {/* 3 Cấp Độ Toàn Cục */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                <label className="flex items-start gap-2 rounded border border-cyan-500/30 bg-zinc-900/40 p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={strategyPolicyForm.systemAutoEnabled}
                    onChange={(e) =>
                      setStrategyPolicyForm({
                        ...strategyPolicyForm,
                        systemAutoEnabled: e.target.checked,
                      })
                    }
                    className="rounded accent-cyan-400 mt-0.5"
                  />
                  <div>
                    <div className="font-bold text-cyan-300">Cấp 1: System Auto</div>
                    <div className="text-[10px] text-zinc-400">
                      Tự động chấm điểm & phê chuẩn phương án tối ưu nhất.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-2 rounded border border-amber-500/30 bg-zinc-900/40 p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={strategyPolicyForm.defaultFallbackEnabled}
                    onChange={(e) =>
                      setStrategyPolicyForm({
                        ...strategyPolicyForm,
                        defaultFallbackEnabled: e.target.checked,
                      })
                    }
                    className="rounded accent-amber-400 mt-0.5"
                  />
                  <div>
                    <div className="font-bold text-amber-300">Cấp 2: Default Fallback</div>
                    <div className="text-[10px] text-zinc-400">
                      Dự phòng phương án mặc định nếu System Auto không đủ điều kiện.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-2 rounded border border-indigo-500/30 bg-zinc-900/40 p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={strategyPolicyForm.playerChoiceFallbackEnabled}
                    onChange={(e) =>
                      setStrategyPolicyForm({
                        ...strategyPolicyForm,
                        playerChoiceFallbackEnabled: e.target.checked,
                      })
                    }
                    className="rounded accent-indigo-400 mt-0.5"
                  />
                  <div>
                    <div className="font-bold text-indigo-300">Cấp 3: Player Choice</div>
                    <div className="text-[10px] text-zinc-400">
                      Chờ người chơi can thiệp khi cả 2 cấp trên không thể thực thi.
                    </div>
                  </div>
                </label>
              </div>

              {/* Tùy Chọn Ưu Tiên Theo Từng Tier */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <div className="text-[11px] font-bold text-zinc-300 uppercase">
                  Ưu Tiên Chiến Lược Theo Từng Quy Mô (Tier Strategy Preference):
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
                  {[
                    { key: "small", label: "Sự Kiện Nhỏ (Small)", color: "text-cyan-300" },
                    { key: "medium", label: "Sự Kiện Vừa (Medium)", color: "text-amber-300" },
                    { key: "large", label: "Sự Kiện Lớn (Large)", color: "text-rose-300" },
                  ].map(({ key, label, color }) => {
                    const currentPref = strategyPolicyForm.tierPolicies[key as "small" | "medium" | "large"]
                    return (
                      <div key={key} className="rounded border border-zinc-800 bg-zinc-900/50 p-2.5 space-y-1.5">
                        <div className={cn("font-bold text-xs uppercase", color)}>{label}</div>
                        <select
                          value={currentPref}
                          onChange={(e) =>
                            setStrategyPolicyForm({
                              ...strategyPolicyForm,
                              tierPolicies: {
                                ...strategyPolicyForm.tierPolicies,
                                [key]: e.target.value as TierStrategyPreference,
                              },
                            })
                          }
                          className="w-full rounded border border-zinc-700 bg-black/60 px-2 py-1 text-xs font-mono text-zinc-200 focus:border-cyan-400 focus:outline-none cursor-pointer"
                        >
                          <option value="system_auto">1. Ưu tiên System Auto</option>
                          <option value="default_fallback">2. Buộc dùng Default Strategy</option>
                          <option value="player_choice">3. Thủ công (Player Choice)</option>
                        </select>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Action buttons for Strategy Policy */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={handleBatchApply}
                  className="flex items-center gap-1.5 rounded border border-cyan-500/60 bg-cyan-950/60 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900/60 transition-colors cursor-pointer"
                  title="Đánh giá và phê chuẩn ngay cho tất cả các sự kiện INIT đang chờ"
                >
                  <Zap className="size-3.5 text-cyan-400" />
                  <span>Áp Dụng Cho Tất Cả Sự Kiện Chờ</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetPolicy}
                    className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <RotateCcw className="size-3.5 text-zinc-400" />
                    <span>Khôi Phục Mặc Định</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSavePolicy}
                    className="flex items-center gap-1.5 rounded border border-cyan-400 bg-cyan-600/40 px-3.5 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-600/60 hover:text-white transition-all cursor-pointer shadow-md shadow-cyan-950/50"
                  >
                    <Save className="size-3.5" />
                    <span>Lưu Chính Sách Chiến Lược</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              KHỐI 4: KÍCH HOẠT THỬ NGHIỆM & LỆNH NHANH (DEV TRIGGERS)
              ================================================================ */}
          {(activeTab === "all" || activeTab === "triggers") && (
            <div className="rounded border border-zinc-800 bg-zinc-950/80 p-4 space-y-3.5 shadow-md">
              <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2.5">
                <Zap className="size-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase text-amber-300 tracking-wider">
                  4. Thao Tác Kích Hoạt Thử Nghiệm Nhanh (Dev & Testing Actions)
                </h3>
              </div>

              {/* Sinh sự kiện ngay lập tức */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-zinc-400 font-bold block">
                  Kích Hoạt Sinh Sự Kiện Ngay Lập Tức (Manual Spawn Event):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onForceSpawnEvent("small")}
                    className="flex items-center justify-center gap-2 rounded border border-cyan-500/50 bg-cyan-950/40 p-2 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50 transition-colors cursor-pointer"
                  >
                    <Sparkles className="size-3.5 text-cyan-400" />
                    <span>Sinh Sự Kiện Nhỏ (Small)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onForceSpawnEvent("medium")}
                    className="flex items-center justify-center gap-2 rounded border border-amber-500/50 bg-amber-950/40 p-2 text-xs font-bold text-amber-300 hover:bg-amber-900/50 transition-colors cursor-pointer"
                  >
                    <Flame className="size-3.5 text-amber-400" />
                    <span>Sinh Sự Kiện Vừa (Medium)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onForceSpawnEvent("large")}
                    className="flex items-center justify-center gap-2 rounded border border-rose-500/50 bg-rose-950/40 p-2 text-xs font-bold text-rose-300 hover:bg-rose-900/50 transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="size-3.5 text-rose-400" />
                    <span>Sinh Sự Kiện Lớn (Large)</span>
                  </button>
                </div>
              </div>

              {/* Tua thời gian */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                <label className="text-[11px] text-zinc-400 font-bold block">
                  Tua Thời Gian Nhanh (Time Acceleration & Multi-Tick):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={onAdvanceTick}
                    disabled={isTickAdvancing}
                    className="flex items-center justify-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 p-2 text-xs font-bold text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Play className="size-3 fill-current text-cyan-400" />
                    <span>+1 Ngày</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onFastForwardDays(5)}
                    disabled={isTickAdvancing}
                    className="flex items-center justify-center gap-1.5 rounded border border-cyan-500/40 bg-zinc-900/60 p-2 text-xs font-bold text-cyan-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <ArrowRight className="size-3 text-cyan-400" />
                    <span>Tua +5 Ngày</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onFastForwardDays(10)}
                    disabled={isTickAdvancing}
                    className="flex items-center justify-center gap-1.5 rounded border border-cyan-500/40 bg-zinc-900/60 p-2 text-xs font-bold text-cyan-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <ArrowRight className="size-3 text-cyan-400" />
                    <span>Tua +10 Ngày</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onFastForwardDays(30)}
                    disabled={isTickAdvancing}
                    className="flex items-center justify-center gap-1.5 rounded border border-amber-500/50 bg-amber-950/30 p-2 text-xs font-bold text-amber-300 hover:bg-amber-900/40 transition-colors cursor-pointer"
                  >
                    <Calendar className="size-3 text-amber-400" />
                    <span>Tua +30 Ngày (1 Tháng)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              KHỐI 5: QUẢN TRỊ TRẠNG THÁI LƯU TRỮ & VÙNG NGUY HIỂM (STORAGE & DANGER ZONE)
              ================================================================ */}
          {(activeTab === "all" || activeTab === "storage") && (
            <div className="space-y-4">
              {/* Lưu trữ an toàn */}
              <div className="rounded border border-zinc-800 bg-zinc-950/80 p-4 space-y-3.5 shadow-md">
                <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2.5">
                  <Database className="size-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase text-cyan-300 tracking-wider">
                    5. Quản Trị Trạng Thái Lưu Trữ Cách Ly (Isolated Storage)
                  </h3>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1 text-[11px] text-zinc-400 font-mono">
                    <div>&bull; Khóa dữ liệu: <strong className="text-cyan-300">STARFRONT_WORLD_SAVE_V1</strong></div>
                    <div>&bull; Khóa cấu hình: <strong className="text-cyan-300">STARFRONT_WORLD_SIMULATOR_CONFIG</strong></div>
                    <div>&bull; Cơ chế sao lưu: <span className="text-emerald-400 font-bold">A/B Rotating Slot (Slot A / Slot B)</span></div>
                    <div>&bull; Kiểm tra toàn vẹn: <span className="text-emerald-400 font-bold">CRC32 Checksum Verified</span></div>
                    <div>&bull; Cách ly RPG Save V4: <span className="text-cyan-300 font-bold">100% Độc Lập</span></div>
                  </div>

                  <button
                    type="button"
                    onClick={onManualSave}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 rounded border border-cyan-500/50 bg-cyan-950/40 p-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50 transition-colors cursor-pointer"
                  >
                    <Save className="size-3.5" />
                    <span>Lưu Trạng Thái Thế Giới Ngay Bây Giờ (Force Save)</span>
                  </button>
                </div>
              </div>

              {/* Cấu hình hạn ngạch Operations Archive */}
              <div className="rounded border border-indigo-900/60 bg-indigo-950/20 p-4 space-y-3.5 shadow-md">
                <div className="flex items-center justify-between border-b border-indigo-800/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Database className="size-4 text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase text-indigo-200 tracking-wider">
                      Hạn Ngạch Kho Lưu Trữ Tác Chiến // Operations Archive Quotas (Phase 6.31)
                    </h3>
                  </div>
                  <span className="rounded bg-indigo-950/80 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/40">
                    BOUNDED FIFO RETENTION
                  </span>
                </div>

                <p className="text-zinc-300 text-xs leading-relaxed">
                  Thiết lập giới hạn lưu trữ tối đa cho 2 luồng hồ sơ độc lập. Khi vượt quá hạn ngạch, hệ thống tự động áp dụng chính sách cắt tỉa FIFO an toàn, không xóa dữ liệu đang chạy và không bịa đặt sự kiện lịch sử.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded border border-zinc-800 bg-zinc-900/60 p-3 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-zinc-300 text-[11px]">
                      <span>Hạn Ngạch Báo Cáo Sự Kiện & Nhiệm Vụ</span>
                      <span className="font-mono text-cyan-400">{archiveConfigForm.eventArchiveQuota} bản ghi</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={200}
                      step={5}
                      value={archiveConfigForm.eventArchiveQuota}
                      onChange={(e) =>
                        setArchiveConfigForm({
                          ...archiveConfigForm,
                          eventArchiveQuota: Number(e.target.value),
                        })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                      <span>Tối thiểu: 10</span>
                      <span>Mặc định: 60</span>
                      <span>Tối đa: 200</span>
                    </div>
                  </div>

                  <div className="rounded border border-zinc-800 bg-zinc-900/60 p-3 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-zinc-300 text-[11px]">
                      <span>Hạn Ngạch Nhật Ký Chiến Đấu Buồng Lái</span>
                      <span className="font-mono text-amber-400">{archiveConfigForm.battleArchiveQuota} bản ghi</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={150}
                      step={5}
                      value={archiveConfigForm.battleArchiveQuota}
                      onChange={(e) =>
                        setArchiveConfigForm({
                          ...archiveConfigForm,
                          battleArchiveQuota: Number(e.target.value),
                        })
                      }
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                      <span>Tối thiểu: 10</span>
                      <span>Mặc định: 40</span>
                      <span>Tối đa: 150</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    {archiveSavedFeedback ? "✓ Đã áp dụng hạn ngạch và đồng bộ World State!" : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!worldState) return
                      playClickSound()
                      updateOperationsArchiveConfig(worldState, archiveConfigForm)
                      saveWorldState(worldState)
                      playShieldSound()
                      setArchiveSavedFeedback(true)
                      setTimeout(() => setArchiveSavedFeedback(false), 3000)
                    }}
                    className="flex items-center gap-1.5 rounded border border-indigo-400 bg-indigo-600/40 px-3.5 py-1.5 text-xs font-bold text-indigo-200 hover:bg-indigo-600/60 hover:text-white transition-all cursor-pointer shadow-md shadow-indigo-950/50"
                  >
                    <Save className="size-3.5" />
                    <span>Lưu Cấu Hình Hạn Ngạch Lưu Trữ</span>
                  </button>
                </div>
              </div>

              {/* VÙNG NGUY HIỂM — DANGER ZONE: TÁCH BIỆT RÕ RÀNG */}
              <div className="rounded-lg border-2 border-red-500/70 bg-gradient-to-b from-red-950/30 to-red-950/10 p-4 space-y-3 shadow-lg shadow-red-950/40">
                <div className="flex items-center justify-between border-b border-red-500/30 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="size-5 text-red-400 animate-pulse" />
                    <h4 className="font-display text-xs sm:text-sm font-black uppercase text-red-300 tracking-wider">
                      VÙNG THAO TÁC NGUY HIỂM // DANGER ZONE
                    </h4>
                  </div>
                  <span className="rounded bg-red-950/80 px-2 py-0.5 text-[10px] font-bold text-red-300 border border-red-500/50">
                    DESTRUCTIVE ACTION
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <p className="text-zinc-300 leading-relaxed">
                    Hành động Reset World sẽ xóa toàn bộ trạng thái thiên hà (8 sectors, quân lực, tài nguyên và sự kiện đang chạy) để quay về <strong>Ngày 1</strong> ban đầu.
                  </p>
                  <p className="text-emerald-400 font-bold text-[11px]">
                    ✓ Bảo toàn tuyệt đối: Tiến trình RPG (Phi công, Cấp độ, Trang bị, Kho đồ, Chiến dịch 12 ải) KHÔNG bị ảnh hưởng.
                  </p>
                  <p className="text-zinc-400 text-[11px]">
                    ✓ Cấu hình Simulator (Tốc độ {simulatorConfig.speedSeconds}s/ngày, Generator) được GIỮ NGUYÊN theo đúng quy tắc.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound()
                      setIsResetConfirmOpen(true)
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded border border-red-500 bg-red-600/30 p-2.5 text-xs font-black text-red-200 hover:bg-red-600/50 hover:text-white transition-all cursor-pointer shadow-md shadow-red-950/60"
                  >
                    <Trash2 className="size-4 text-red-400" />
                    <span>RESET TOÀN BỘ WORLD VỀ NGÀY 1 (YÊU CẦU XÁC NHẬN)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ====================================================================
            FOOTER CỐ ĐỊNH CỦA MODAL
            ==================================================================== */}
        <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900/90 px-4 py-2.5 shrink-0 text-xs text-zinc-400">
          <div className="text-[11px]">
            STARFRONT WORLD ENGINE · PHASE 6.18 ADMIN CP
          </div>
          <button
            type="button"
            onClick={() => {
              playClickSound()
              onClose()
            }}
            className="rounded border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>

      {/* ====================================================================
          SUB-DIALOG 1: XÁC NHẬN ĐỔI TỐC ĐỘ (SPEED CONFIRM DIALOG)
          ==================================================================== */}
      {isSpeedConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-lg border border-cyan-500/60 bg-zinc-950 p-5 shadow-2xl shadow-cyan-950/60 space-y-4 font-mono text-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase text-cyan-300">
                  Xác Nhận Đổi Tốc Độ Thời Gian Thực
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCancelSpeedDialog}
                className="text-zinc-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-zinc-300">
                Bạn sắp thay đổi nhịp độ vận hành của thế giới:
              </p>
              <div className="rounded bg-zinc-900 p-2.5 border border-zinc-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Tốc độ hiện tại:</span>
                  <span className="font-bold text-zinc-300">{simulatorConfig.speedSeconds}s / Ngày</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Tốc độ mới:</span>
                  <span className="font-bold text-cyan-300 text-sm">{pendingSpeed}s / Ngày</span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {resetWorldOnSpeedChange
                  ? "Cảnh báo: Thế giới sẽ được reset về Ngày 1 và bắt đầu vận hành ngay với tốc độ mới. RPG Save V4 được bảo toàn 100%."
                  : "Tiến độ ngày hiện tại sẽ được bảo lưu theo tỷ lệ phân đoạn mới, không gây chạy bù ngoài dự kiến và giữ nguyên toàn bộ lịch sử thế giới."}
              </p>

              {/* Tùy chọn Reset World kèm theo */}
              <div className="flex items-center gap-2 rounded bg-zinc-900/60 p-2 border border-zinc-800">
                <input
                  type="checkbox"
                  id="resetWorldOnSpeedChangeModalCb"
                  checked={resetWorldOnSpeedChange}
                  onChange={(e) => setResetWorldOnSpeedChange(e.target.checked)}
                  className="size-3.5 rounded border-zinc-700 bg-zinc-950 text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <label
                  htmlFor="resetWorldOnSpeedChangeModalCb"
                  className="text-[11px] text-zinc-300 cursor-pointer select-none"
                >
                  Đồng thời Reset WORLD về Ngày 1 (Bắt đầu chu kỳ mô phỏng mới)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleCancelSpeedDialog}
                className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmSpeedDialog}
                className="rounded border border-cyan-400 bg-cyan-600/40 px-4 py-1.5 text-xs font-bold text-cyan-100 hover:bg-cyan-600/70 transition-colors cursor-pointer shadow-md shadow-cyan-950/60"
              >
                Xác Nhận Đổi Tốc Độ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUB-DIALOG 2: XÁC NHẬN NGUY HIỂM RESET WORLD VỀ NGÀY 1 (DANGER DIALOG)
          ==================================================================== */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-lg border border-red-500/70 bg-zinc-950 p-5 shadow-2xl shadow-red-950/60 space-y-4 font-mono text-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <AlertOctagon className="size-4 text-red-400 animate-pulse" />
                <h3 className="text-xs font-black uppercase text-red-300">
                  CẢNH BÁO NGUY HIỂM: RESET WORLD
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-red-200 font-bold">
                Bạn có chắc chắn muốn đặt lại toàn bộ thế giới STARFRONT WORLD về Ngày 1?
              </p>
              <div className="rounded bg-red-950/30 p-2.5 border border-red-500/30 space-y-1 text-[11px] text-zinc-300">
                <div>&bull; Toàn bộ 8 sector sẽ trở về chủ quyền & đồn trú ban đầu.</div>
                <div>&bull; Toàn bộ sự kiện đang chạy và chuỗi nhiệm vụ sẽ bị xóa.</div>
                <div>&bull; Các đạo quân đang hành quân sẽ bị hủy an toàn.</div>
                <div>&bull; Tốc độ cấu hình ({simulatorConfig.speedSeconds}s/ngày) và Generator sẽ được giữ nguyên.</div>
              </div>
              <p className="text-[11px] text-emerald-400 font-bold">
                Bảo đảm an toàn: Dữ liệu RPG Save V4 (Phi công, Cấp độ, Trang bị, Kho đồ, Chiến dịch) KHÔNG bị xóa.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="rounded border border-zinc-700 bg-zinc-900 px-3.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmResetDialog}
                className="rounded border border-red-500 bg-red-600 px-4 py-1.5 text-xs font-black text-white hover:bg-red-700 transition-colors cursor-pointer shadow-lg shadow-red-950/80"
              >
                Xác Nhận Reset Toàn Bộ World
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
