"use client"

import React, { useState, useEffect } from "react"
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
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
import {
  DEFAULT_THREAT_CONFIG,
  getWorldThreatConfig,
  getSectorMaxThreat,
  checkMaxThreatReduction,
} from "@/lib/game/world/threat-engine"
import type { WorldSector, WorldState, WorldThreatConfig } from "@/lib/game/world/types"

export type AdminModalTab = "all" | "speed" | "generator" | "policy" | "threat" | "triggers" | "storage"

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

  // Trạng thái thu gọn/mở rộng từng section trong AdminCP (Phase 6.33_FIX4)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (sectionKey: string) => {
    playClickSound()
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }))
  }

  const handleExpandAll = () => {
    playClickSound()
    setCollapsedSections({})
  }

  const handleCollapseAll = () => {
    playClickSound()
    setCollapsedSections({
      speed: true,
      generator: true,
      policy: true,
      threat: true,
      triggers: true,
      storage: true,
    })
  }

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

  // Threat Config & Sector Threat Form states (Phase 6.33_FIX4)
  const [threatForm, setThreatForm] = useState<WorldThreatConfig>(() => getWorldThreatConfig(worldState))
  const [sectorThreatsForm, setSectorThreatsForm] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    if (worldState) {
      for (const [id, sec] of Object.entries(worldState.sectors)) {
        init[id] = sec.threatLevel
      }
    }
    return init
  })
  const [threatSavedFeedback, setThreatSavedFeedback] = useState(false)
  const [isThreatResetConfirmOpen, setIsThreatResetConfirmOpen] = useState(false)
  const [pendingThreatViolations, setPendingThreatViolations] = useState<
    Array<{ id: string; name: string; currentThreat: number; newMaxThreat: number }>
  >([])

  // Sub-dialog xác nhận đổi tốc độ
  const [isSpeedConfirmOpen, setIsSpeedConfirmOpen] = useState(false)
  const [pendingSpeed, setPendingSpeed] = useState<number | null>(null)
  const [resetWorldOnSpeedChange, setResetWorldOnSpeedChange] = useState<boolean>(false)

  // Sub-dialog xác nhận Reset World thông thường
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)

  // Đồng bộ form khi modal mở hoặc simulatorConfig / worldState thay đổi
  useEffect(() => {
    if (isOpen) {
      setGeneratorForm(simulatorConfig.generator || DEFAULT_SIMULATOR_CONFIG.generator)
      setStrategyPolicyForm(simulatorConfig.strategyPolicy || DEFAULT_EVENT_STRATEGY_POLICY)
      if (worldState) {
        setArchiveConfigForm(getOperationsArchiveConfig(worldState))
        setThreatForm(getWorldThreatConfig(worldState))
        const updatedThreats: Record<string, number> = {}
        for (const [id, sec] of Object.entries(worldState.sectors)) {
          updatedThreats[id] = sec.threatLevel
        }
        setSectorThreatsForm(updatedThreats)
      }
    }
  }, [isOpen, simulatorConfig, worldState])

  // Lắng nghe phím ESC để đóng dialog phân cấp (Sub-dialog trước, modal sau)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isThreatResetConfirmOpen) {
          setIsThreatResetConfirmOpen(false)
        } else if (isSpeedConfirmOpen) {
          setIsSpeedConfirmOpen(false)
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
  }, [isOpen, isSpeedConfirmOpen, isResetConfirmOpen, isThreatResetConfirmOpen, onClose])

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

  // Lưu cấu hình Quota Archive
  const handleSaveArchiveConfig = () => {
    if (!worldState) return
    playClickSound()
    updateOperationsArchiveConfig(worldState, archiveConfigForm)
    saveWorldState(worldState)
    playLevelUpSound()
    setArchiveSavedFeedback(true)
    setTimeout(() => setArchiveSavedFeedback(false), 2500)
  }

  // Lưu Threat Config & Sector Threats (Phase 6.33_FIX4)
  const handleSaveThreatConfig = () => {
    if (!worldState) return
    playClickSound()

    // 1. Kiểm tra xem có Sector nào mà Current Threat > Max Threat mới hay không
    const virtualSectors: Record<string, WorldSector> = {}
    for (const [id, sec] of Object.entries(worldState.sectors)) {
      virtualSectors[id] = {
        ...sec,
        threatLevel: sectorThreatsForm[id] ?? sec.threatLevel,
      }
    }

    const reductionCheck = checkMaxThreatReduction(virtualSectors, threatForm)
    if (reductionCheck.needsConfirmation) {
      // Có sector bị vi phạm: Mở cảnh báo yêu cầu Reset WORLD về Year 1 (Yêu cầu 5)
      setPendingThreatViolations(reductionCheck.violatingSectors)
      setIsThreatResetConfirmOpen(true)
      return
    }

    // 2. Không vi phạm: Lưu trực tiếp vào WorldState
    worldState.threatConfig = {
      ...threatForm,
      lastModified: Date.now(),
    }

    for (const [id, sec] of Object.entries(worldState.sectors)) {
      const maxT = getSectorMaxThreat(sec, threatForm)
      const newThreatVal = Math.max(0, Math.min(maxT, sectorThreatsForm[id] ?? sec.threatLevel))
      sec.threatLevel = newThreatVal
      sec.maxThreat = maxT
    }

    saveWorldState(worldState)
    playLevelUpSound()
    setThreatSavedFeedback(true)
    setTimeout(() => setThreatSavedFeedback(false), 2500)
  }

  // Xác nhận giảm Max Threat dẫn đến Reset WORLD về Year 1 (Phase 6.33_FIX4 Yêu cầu 5)
  const handleConfirmThreatReductionReset = () => {
    playShieldSound()
    setIsThreatResetConfirmOpen(false)

    const targetConfig: WorldThreatConfig = {
      ...threatForm,
      lastModified: Date.now(),
    }

    // Reset world về Year 1
    onConfirmResetWorld()

    // Cập nhật cấu hình Threat vào WorldState sau reset
    if (worldState) {
      worldState.threatConfig = targetConfig
      for (const sec of Object.values(worldState.sectors)) {
        const maxT = getSectorMaxThreat(sec, targetConfig)
        sec.maxThreat = maxT
        sec.threatLevel = Math.min(sec.threatLevel, maxT)
      }
      saveWorldState(worldState)
    }

    setPendingThreatViolations([])
    setThreatSavedFeedback(true)
    setTimeout(() => setThreatSavedFeedback(false), 2500)
  }

  // Khôi phục mặc định Threat Config
  const handleResetThreatToDefault = () => {
    playClickSound()
    setThreatForm({ ...DEFAULT_THREAT_CONFIG })
    if (worldState) {
      const updatedThreats: Record<string, number> = {}
      for (const [id, sec] of Object.entries(worldState.sectors)) {
        updatedThreats[id] = sec.threatLevel
      }
      setSectorThreatsForm(updatedThreats)
    }
  }

  // Xác nhận Reset World thông thường
  const handleConfirmResetDialog = () => {
    onConfirmResetWorld()
    setIsResetConfirmOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fadeIn text-xs">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-lg border border-amber-500/60 bg-zinc-950 shadow-2xl shadow-amber-950/60 font-mono text-zinc-200 select-none overflow-hidden text-xs">
        
        {/* ====================================================================
            HEADER CỐ ĐỊNH CỦA MODAL
            ==================================================================== */}
        <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-3 shrink-0 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded bg-amber-950/80 border border-amber-500/60 text-amber-300">
              <Sliders className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-sm sm:text-base font-black tracking-wider text-amber-300 uppercase">
                  CÀI ĐẶT & QUẢN TRỊ VIÊN // ADMIN CP
                </h2>
                <span className="rounded bg-black/60 px-1.5 py-0.5 text-xs text-zinc-400 border border-zinc-800">
                  ISOLATED SETTINGS
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Cấu hình nhịp độ thời gian thực, HP-Based Threat, Event/Quest, chính sách chiến lược & bảo trì dữ liệu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Collapse / Expand Controls */}
            <div className="flex items-center gap-1 border border-zinc-800 rounded bg-black/60 px-1.5 py-0.5 text-xs">
              <button
                type="button"
                onClick={handleExpandAll}
                className="text-zinc-400 hover:text-cyan-300 px-1 py-0.5 rounded cursor-pointer"
                title="Mở rộng tất cả các section"
              >
                Mở Rộng
              </button>
              <span className="text-zinc-600">/</span>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="text-zinc-400 hover:text-amber-300 px-1 py-0.5 rounded cursor-pointer"
                title="Thu gọn tất cả các section"
              >
                Thu Gọn
              </button>
            </div>

            <span className="flex items-center gap-1.5 rounded border border-amber-500/40 bg-amber-950/40 px-2.5 py-1 text-xs font-bold text-amber-300">
              <span className="size-2 rounded-full bg-amber-400 animate-ping" />
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
            { id: "threat", label: "4. Threat & HP AI", icon: ShieldAlert },
            { id: "triggers", label: "5. Thử Nghiệm Nhanh", icon: Zap },
            { id: "storage", label: "6. Lưu Trữ & Reset", icon: Database },
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
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-xs"
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
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onTogglePause}
                    className={cn(
                      "flex items-center gap-1.5 rounded px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                      simulatorConfig.isPaused
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/60"
                        : "bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-950/60"
                    )}
                  >
                    {simulatorConfig.isPaused ? (
                      <>
                        <Play className="size-3.5" />
                        <span>Tiếp Tục Chạy (RESUME)</span>
                      </>
                    ) : (
                      <>
                        <Pause className="size-3.5" />
                        <span>Tạm Dừng (PAUSE)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Thông tin hiển thị */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="rounded bg-black/40 p-2.5 border border-zinc-800">
                  <div className="text-zinc-400 text-xs">Niên Lịch Game</div>
                  <div className="font-bold text-white text-sm mt-0.5">
                    Năm {calendarInfo.year}, {calendarInfo.seasonName}
                  </div>
                  <div className="text-zinc-500 text-xs">{calendarInfo.formattedDate}</div>
                </div>

                <div className="rounded bg-black/40 p-2.5 border border-zinc-800">
                  <div className="text-zinc-400 text-xs">Tổng Ngày Tích Lũy</div>
                  <div className="font-bold text-cyan-300 text-sm mt-0.5">
                    Ngày {worldState?.currentDay ?? 1}
                  </div>
                  <div className="text-zinc-500 text-xs">Đã trôi: {worldState?.totalDaysElapsed ?? 0} ngày</div>
                </div>

                <div className="rounded bg-black/40 p-2.5 border border-zinc-800">
                  <div className="text-zinc-400 text-xs">Đếm Ngược Tick Kế</div>
                  <div className="font-bold text-amber-300 text-sm mt-0.5 font-mono">
                    {simulatorConfig.isPaused ? "PAUSED" : `${countdownSeconds}s`}
                  </div>
                  <div className="text-zinc-500 text-xs">Tiến trình: {(dayFraction * 100).toFixed(0)}%</div>
                </div>

                <div className="rounded bg-black/40 p-2.5 border border-zinc-800">
                  <div className="text-zinc-400 text-xs">Sự Kiện Đang Chạy</div>
                  <div className="font-bold text-emerald-300 text-sm mt-0.5">
                    {eventTierCounts.total} sự kiện
                  </div>
                  <div className="text-zinc-500 text-xs">S: {eventTierCounts.small} | M: {eventTierCounts.medium} | L: {eventTierCounts.large}</div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              KHỐI 1: CẤU HÌNH TỐC ĐỘ THỜI GIAN (SPEED CONFIG)
              ================================================================ */}
          {(activeTab === "all" || activeTab === "speed") && (
            <div className="rounded border border-zinc-800 bg-zinc-950/80 p-4 space-y-3.5 shadow-md">
              <div
                onClick={() => toggleSection("speed")}
                className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5 cursor-pointer hover:text-amber-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {collapsedSections.speed ? (
                    <ChevronRight className="size-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="size-4 text-amber-400" />
                  )}
                  <Clock className="size-4 text-amber-400" />
                  <h3 className="text-xs font-bold uppercase text-amber-300 tracking-wider">
                    1. Điều Chỉnh Tốc Độ Thời Gian Thực // Real-time Speed
                  </h3>
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                  {simulatorConfig.speedSeconds}s/ngày {collapsedSections.speed ? "[Thu Gọn]" : "[Mở Rộng]"}
                </span>
              </div>

              {!collapsedSections.speed && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { seconds: 15, label: "Siêu Tốc (15s)", desc: "Debug nhanh" },
                      { seconds: 30, label: "Nhanh (30s)", desc: "Thử nghiệm" },
                      { seconds: 60, label: "Tiêu Chuẩn (60s)", desc: "Khuyến nghị" },
                      { seconds: 120, label: "Thư Thái (120s)", desc: "Chiến thuật sâu" },
                    ].map((preset) => {
                      const isCurrent = simulatorConfig.speedSeconds === preset.seconds
                      return (
                        <button
                          key={preset.seconds}
                          type="button"
                          onClick={() => handleRequestSpeed(preset.seconds)}
                          className={cn(
                            "flex flex-col items-start p-2.5 rounded border text-left transition-all cursor-pointer",
                            isCurrent
                              ? "border-amber-400 bg-amber-950/60 text-amber-200 ring-1 ring-amber-400/40"
                              : "border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                          )}
                        >
                          <div className="font-bold text-xs">{preset.label}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{preset.desc}</div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-900">
                    <span className="text-xs text-zinc-400">Tùy chỉnh số giây/ngày:</span>
                    <input
                      type="number"
                      min={1}
                      max={86400}
                      value={customSpeedInput}
                      onChange={(e) => setCustomSpeedInput(e.target.value)}
                      placeholder="Nhập số giây..."
                      className="w-28 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-amber-400 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomSpeed}
                      className="rounded border border-amber-500/40 bg-amber-950/40 px-3 py-1 text-xs font-bold text-amber-300 hover:bg-amber-900/50 transition-colors cursor-pointer"
                    >
                      Áp Dụng Tốc Độ
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              KHỐI 2: CẤU HÌNH BỘ SINH SỰ KIỆN (GENERATOR CONFIG)
              ================================================================ */}
          {(activeTab === "all" || activeTab === "generator") && (
            <div className="rounded border border-zinc-800 bg-zinc-950/80 p-4 space-y-3.5 shadow-md">
              <div
                onClick={() => toggleSection("generator")}
                className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5 cursor-pointer hover:text-cyan-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {collapsedSections.generator ? (
                    <ChevronRight className="size-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="size-4 text-cyan-400" />
                  )}
                  <Flame className="size-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase text-cyan-300 tracking-wider">
                    2. Cấu Hình Bộ Sinh Sự Kiện // Strategic Event Generator
                  </h3>
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                  {collapsedSections.generator ? "[Thu Gọn]" : "[Mở Rộng]"}
                </span>
              </div>

              {!collapsedSections.generator && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Small Events */}
                    <div className="rounded border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400 text-xs">TIER 1 (NHỎ)</span>
                        <span className="text-zinc-500 text-xs">2 - 3 ngày/lần</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Tối đa active:</span>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={generatorForm.small.maxActive}
                            onChange={(e) =>
                              setGeneratorForm({
                                ...generatorForm,
                                small: { ...generatorForm.small, maxActive: parseInt(e.target.value, 10) || 1 },
                              })
                            }
                            className="w-16 rounded border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 text-right text-xs"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Chu kỳ (ngày):</span>
                          <span className="font-mono text-zinc-300">
                            {generatorForm.small.minIntervalDays} - {generatorForm.small.maxIntervalDays}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Medium Events */}
                    <div className="rounded border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-400 text-xs">TIER 2 (VỪA)</span>
                        <span className="text-zinc-500 text-xs">5 - 7 ngày/lần</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Tối đa active:</span>
                          <input
                            type="number"
                            min={1}
                            max={6}
                            value={generatorForm.medium.maxActive}
                            onChange={(e) =>
                              setGeneratorForm({
                                ...generatorForm,
                                medium: { ...generatorForm.medium, maxActive: parseInt(e.target.value, 10) || 1 },
                              })
                            }
                            className="w-16 rounded border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 text-right text-xs"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Chu kỳ (ngày):</span>
                          <span className="font-mono text-zinc-300">
                            {generatorForm.medium.minIntervalDays} - {generatorForm.medium.maxIntervalDays}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Large Events */}
                    <div className="rounded border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-400 text-xs">TIER 3 (LỚN)</span>
                        <span className="text-zinc-500 text-xs">12 - 15 ngày/lần</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Tối đa active:</span>
                          <input
                            type="number"
                            min={1}
                            max={3}
                            value={generatorForm.large.maxActive}
                            onChange={(e) =>
                              setGeneratorForm({
                                ...generatorForm,
                                large: { ...generatorForm.large, maxActive: parseInt(e.target.value, 10) || 1 },
                              })
                            }
                            className="w-16 rounded border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 text-right text-xs"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Chu kỳ (ngày):</span>
                          <span className="font-mono text-zinc-300">
                            {generatorForm.large.minIntervalDays} - {generatorForm.large.maxIntervalDays}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-900">
                    <button
                      type="button"
                      onClick={handleResetGenerator}
                      className="rounded border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Khôi Phục Mặc Định
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveGenerator}
                      className="flex items-center gap-1.5 rounded border border-cyan-500/50 bg-cyan-950/40 px-3.5 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50 transition-colors cursor-pointer"
                    >
                      <Save className="size-3.5" />
                      <span>Lưu Cấu Hình Generator</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              KHỐI 3: CHÍNH SÁCH QUYẾT ĐỊNH CHIẾN LƯỢC TỰ ĐỘNG (POLICY CONFIG)
              ================================================================ */}
          {(activeTab === "all" || activeTab === "policy") && (
            <div className="rounded border border-zinc-800 bg-zinc-950/80 p-4 space-y-3.5 shadow-md">
              <div
                onClick={() => toggleSection("policy")}
                className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5 cursor-pointer hover:text-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {collapsedSections.policy ? (
                    <ChevronRight className="size-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="size-4 text-emerald-400" />
                  )}
                  <Sparkles className="size-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase text-emerald-300 tracking-wider">
                    3. Chính Sách Chiến Lược Tự Động // Strategy Policy
                  </h3>
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                  {collapsedSections.policy ? "[Thu Gọn]" : "[Mở Rộng]"}
                </span>
              </div>

              {!collapsedSections.policy && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(["small", "medium", "large"] as const).map((tier) => (
                      <div key={tier} className="rounded border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
                        <div className="font-bold text-xs uppercase text-zinc-300">
                          Tier: {tier === "small" ? "Nhỏ" : tier === "medium" ? "Vừa" : "Lớn"}
                        </div>
                        <select
                          value={strategyPolicyForm.tierPolicies[tier]}
                          onChange={(e) =>
                            setStrategyPolicyForm({
                              ...strategyPolicyForm,
                              tierPolicies: {
                                ...strategyPolicyForm.tierPolicies,
                                [tier]: e.target.value as TierStrategyPreference,
                              },
                            })
                          }
                          className="w-full rounded border border-zinc-800 bg-zinc-950 p-1.5 text-xs text-zinc-200 focus:border-emerald-400 focus:outline-hidden cursor-pointer"
                        >
                          <option value="system_auto">Tự Động (AI Tối Ưu)</option>
                          <option value="default_fallback">Mặc Định (Fallback)</option>
                          <option value="player_choice">Người Chơi Tự Chọn</option>
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-900">
                    <button
                      type="button"
                      onClick={handleBatchApply}
                      className="rounded border border-purple-500/40 bg-purple-950/30 px-3 py-1.5 text-xs text-purple-300 hover:bg-purple-900/40 cursor-pointer"
                    >
                      Áp Dụng Cho Tất Cả Sự Kiện Chờ
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetPolicy}
                        className="rounded border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer"
                      >
                        Khôi Phục
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePolicy}
                        className="flex items-center gap-1.5 rounded border border-emerald-500/50 bg-emerald-950/40 px-3.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/50 cursor-pointer"
                      >
                        <Save className="size-3.5" />
                        <span>Lưu Chính Sách</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              KHỐI 4: CẤU HÌNH THREAT & THE VOID AI (HP-BASED THREAT) (PHASE 6.33_FIX4)
              ================================================================ */}
          {(activeTab === "all" || activeTab === "threat") && (
            <div className="rounded border border-rose-500/50 bg-zinc-950/80 p-4 space-y-3.5 shadow-md">
              <div
                onClick={() => toggleSection("threat")}
                className="flex items-center justify-between border-b border-rose-900/60 pb-2.5 cursor-pointer hover:text-rose-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {collapsedSections.threat ? (
                    <ChevronRight className="size-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="size-4 text-rose-400" />
                  )}
                  <ShieldAlert className="size-4 text-rose-400" />
                  <h3 className="text-xs font-bold uppercase text-rose-300 tracking-wider">
                    4. Cấu Hình Threat & The Void AI // Canonical HP-Based Threat (Phase 6.33_FIX4)
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-rose-400 font-bold">
                    HQ: {threatForm.maxThreatHQ.toLocaleString()} · Thường: {threatForm.maxThreatStandard.toLocaleString()}
                  </span>
                  <span className="text-zinc-500">
                    {collapsedSections.threat ? "[Thu Gọn]" : "[Mở Rộng]"}
                  </span>
                </div>
              </div>

              {!collapsedSections.threat && (
                <div className="space-y-4">
                  {/* Giải thích công thức HP-Based chuẩn hóa */}
                  <div className="rounded border border-rose-950 bg-rose-950/20 p-3 text-xs space-y-1.5 text-rose-200">
                    <div className="font-bold flex items-center gap-1.5 text-rose-300">
                      <Zap className="size-3.5 text-rose-400" />
                      <span>CÔNG THỨC THREAT CHÍNH THỨC DUY NHẤT (CANONICAL HP-BASED FORMULA):</span>
                    </div>
                    <p className="text-zinc-300 leading-relaxed font-mono text-[11px] bg-black/60 p-2 rounded border border-rose-900/50">
                      ThreatChange = floor( ( (WinnerCurrentHP + WinnerMaxHP) * WinnerRatio + LoserMaxHP ) / HPPerThreatPoint )
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                      <div className="bg-black/50 p-2 rounded border border-rose-900/40">
                        <span className="text-emerald-400 font-bold">PHE TA THẮNG:</span>
                        <div className="text-zinc-400 mt-0.5">
                          Threat khu vực giảm ThreatChange điểm (min 0)
                        </div>
                      </div>
                      <div className="bg-black/50 p-2 rounded border border-rose-900/40">
                        <span className="text-rose-400 font-bold">PHE TA THUA:</span>
                        <div className="text-zinc-400 mt-0.5">
                          Threat khu vực tăng ThreatChange điểm (max SectorMaxThreat)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cấu hình tham số Threat toàn cục */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded border border-zinc-800 bg-zinc-900/50 p-3 space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300 uppercase">
                        Trần Đe Dọa Sector Thường
                      </label>
                      <input
                        type="number"
                        min={100}
                        max={100000000}
                        step={10000}
                        value={threatForm.maxThreatStandard}
                        onChange={(e) =>
                          setThreatForm({
                            ...threatForm,
                            maxThreatStandard: Math.max(100, parseInt(e.target.value, 10) || 1000000),
                          })
                        }
                        className="w-full rounded border border-zinc-700 bg-zinc-950 p-1.5 font-mono text-sm text-cyan-300 focus:border-rose-400 focus:outline-hidden"
                      />
                      <div className="text-[11px] text-zinc-400">Mặc định: 1,000,000 Threat</div>
                    </div>

                    <div className="rounded border border-zinc-800 bg-zinc-900/50 p-3 space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300 uppercase">
                        Trần Đe Dọa Căn Cứ HQ
                      </label>
                      <input
                        type="number"
                        min={100}
                        max={1000000000}
                        step={1000000}
                        value={threatForm.maxThreatHQ}
                        onChange={(e) =>
                          setThreatForm({
                            ...threatForm,
                            maxThreatHQ: Math.max(100, parseInt(e.target.value, 10) || 100000000),
                          })
                        }
                        className="w-full rounded border border-zinc-700 bg-zinc-950 p-1.5 font-mono text-sm text-cyan-300 focus:border-rose-400 focus:outline-hidden"
                      />
                      <div className="text-[11px] text-zinc-400">Mặc định: 100,000,000 Threat</div>
                    </div>

                    <div className="rounded border border-zinc-800 bg-zinc-900/50 p-3 space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300 uppercase">
                        HP Per Threat Point
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10000}
                        step={10}
                        value={threatForm.hpPerThreatPoint ?? 100}
                        onChange={(e) =>
                          setThreatForm({
                            ...threatForm,
                            hpPerThreatPoint: Math.max(1, parseInt(e.target.value, 10) || 100),
                          })
                        }
                        className="w-full rounded border border-zinc-700 bg-zinc-950 p-1.5 font-mono text-sm text-cyan-300 focus:border-rose-400 focus:outline-hidden"
                      />
                      <div className="text-[11px] text-zinc-400">Mặc định: 100 HP = 1 Threat</div>
                    </div>

                    <div className="rounded border border-zinc-800 bg-zinc-900/50 p-3 space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300 uppercase">
                        Winner Ratio
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        step={1}
                        value={threatForm.winnerRatio ?? 2}
                        onChange={(e) =>
                          setThreatForm({
                            ...threatForm,
                            winnerRatio: Math.max(1, parseInt(e.target.value, 10) || 2),
                          })
                        }
                        className="w-full rounded border border-zinc-700 bg-zinc-950 p-1.5 font-mono text-sm text-cyan-300 focus:border-rose-400 focus:outline-hidden"
                      />
                      <div className="text-[11px] text-zinc-400">Mặc định: 2 (Tỷ số phe thắng)</div>
                    </div>
                  </div>

                  {/* Bảng điều chỉnh Threat trực tiếp cho từng Sector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
                      <span className="font-bold text-zinc-300 text-xs uppercase">
                        Bảng Điều Chỉnh Threat Trực Tiếp Theo Từng Sector
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {worldState ? Object.keys(worldState.sectors).length : 0} Sectors
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                      {worldState &&
                        Object.values(worldState.sectors).map((sec) => {
                          const isHQ = sec.id === "sol_command_hq" || sec.id.endsWith("_hq") || sec.id === "tartarus_breach"
                          const maxT = getSectorMaxThreat(sec, threatForm)
                          const currentVal = sectorThreatsForm[sec.id] ?? sec.threatLevel

                          return (
                            <div
                              key={sec.id}
                              className={cn(
                                "rounded border p-2.5 space-y-1.5 transition-colors",
                                isHQ
                                   ? "border-cyan-500/50 bg-cyan-950/20"
                                   : "border-zinc-800 bg-zinc-900/40"
                              )}
                            >
                              <div className="flex items-center justify-between gap-1 text-xs">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="font-bold text-white truncate">{sec.name}</span>
                                  <span
                                    className={cn(
                                      "rounded px-1.5 py-0.2 text-[10px] font-mono font-bold uppercase",
                                      isHQ
                                        ? "bg-cyan-900/60 text-cyan-200 border border-cyan-500/40"
                                        : "bg-zinc-800 text-zinc-400"
                                    )}
                                  >
                                    {isHQ ? "CĂN CỨ HQ" : "SECTOR"}
                                  </span>
                                </div>
                                <span className="font-mono text-xs font-bold text-rose-300">
                                  {currentVal.toLocaleString()} / {maxT.toLocaleString()}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min={0}
                                  max={maxT}
                                  step={Math.max(1, Math.round(maxT / 100))}
                                  value={currentVal}
                                  onChange={(e) =>
                                    setSectorThreatsForm({
                                      ...sectorThreatsForm,
                                      [sec.id]: parseInt(e.target.value, 10),
                                    })
                                  }
                                  className="w-full accent-rose-500 cursor-pointer"
                                />
                                <input
                                  type="number"
                                  min={0}
                                  max={maxT}
                                  value={currentVal}
                                  onChange={(e) =>
                                    setSectorThreatsForm({
                                      ...sectorThreatsForm,
                                      [sec.id]: Math.max(0, Math.min(maxT, parseInt(e.target.value, 10) || 0)),
                                    })
                                  }
                                  className="w-24 rounded border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 font-mono text-xs text-right text-rose-200"
                                />
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-900">
                    <button
                      type="button"
                      onClick={handleResetThreatToDefault}
                      className="rounded border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Khôi Phục Mặc Định (HQ 100M / Sector 1M / 100 HP / Ratio 2)
                    </button>

                    <div className="flex items-center gap-2">
                      {threatSavedFeedback && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                          <CheckCircle2 className="size-3.5" />
                          <span>Đã lưu Threat Config thành công!</span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveThreatConfig}
                        className="flex items-center gap-1.5 rounded border border-rose-500/50 bg-rose-950/50 px-4 py-1.5 text-xs font-bold text-rose-200 hover:bg-rose-900/60 transition-colors cursor-pointer shadow-md shadow-rose-950/40"
                      >
                        <Save className="size-3.5" />
                        <span>Lưu Cấu Hình Threat & Sector</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              KHỐI 5: KÍCH HOẠT SỰ KIỆN KHẨN CẤP (TRIGGERS)
              ================================================================ */}
          {(activeTab === "all" || activeTab === "triggers") && (
            <div className="rounded border border-zinc-800 bg-zinc-950/80 p-4 space-y-3.5 shadow-md">
              <div
                onClick={() => toggleSection("triggers")}
                className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5 cursor-pointer hover:text-amber-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {collapsedSections.triggers ? (
                    <ChevronRight className="size-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="size-4 text-amber-400" />
                  )}
                  <Zap className="size-4 text-amber-400" />
                  <h3 className="text-xs font-bold uppercase text-amber-300 tracking-wider">
                    5. Thử Nghiệm Nhanh & Kích Hoạt Sự Kiện // Event Triggers
                  </h3>
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                  {collapsedSections.triggers ? "[Thu Gọn]" : "[Mở Rộng]"}
                </span>
              </div>

              {!collapsedSections.triggers && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => onForceSpawnEvent("small")}
                      className="flex items-center justify-center gap-2 rounded border border-emerald-500/40 bg-emerald-950/30 p-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/40 cursor-pointer"
                    >
                      <Zap className="size-3.5" />
                      <span>Kích Hoạt Sự Kiện Nhỏ (T1)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onForceSpawnEvent("medium")}
                      className="flex items-center justify-center gap-2 rounded border border-amber-500/40 bg-amber-950/30 p-2.5 text-xs font-bold text-amber-300 hover:bg-amber-900/40 cursor-pointer"
                    >
                      <Zap className="size-3.5" />
                      <span>Kích Hoạt Sự Kiện Vừa (T2)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onForceSpawnEvent("large")}
                      className="flex items-center justify-center gap-2 rounded border border-red-500/40 bg-red-950/30 p-2.5 text-xs font-bold text-red-300 hover:bg-red-900/40 cursor-pointer"
                    >
                      <Zap className="size-3.5" />
                      <span>Kích Hoạt Khủng Hoảng (T3)</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-900 text-xs">
                    <span className="text-zinc-400">Tua nhanh thời gian:</span>
                    {[1, 5, 10, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => onFastForwardDays(d)}
                        className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:border-amber-400 hover:text-white cursor-pointer"
                      >
                        +{d} ngày
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={onAdvanceTick}
                      disabled={isTickAdvancing}
                      className="ml-auto rounded border border-cyan-500/50 bg-cyan-950/40 px-3 py-1 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50 cursor-pointer"
                    >
                      Tiến 1 Tick Ngay
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              KHỐI 6: QUẢN TRỊ TRẠNG THÁI LƯU TRỮ & VÙNG NGUY HIỂM (STORAGE & DANGER ZONE)
              ================================================================ */}
          {(activeTab === "all" || activeTab === "storage") && (
            <div className="space-y-4">
              {/* Lưu trữ an toàn */}
              <div className="rounded border border-zinc-800 bg-zinc-950/80 p-4 space-y-3.5 shadow-md">
                <div
                  onClick={() => toggleSection("storage")}
                  className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5 cursor-pointer hover:text-cyan-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {collapsedSections.storage ? (
                      <ChevronRight className="size-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="size-4 text-cyan-400" />
                    )}
                    <Database className="size-4 text-cyan-400" />
                    <h3 className="text-xs font-bold uppercase text-cyan-300 tracking-wider">
                      6. Quản Trị Lưu Trữ & Hạn Ngạch Operations Archive
                    </h3>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">
                    {collapsedSections.storage ? "[Thu Gọn]" : "[Mở Rộng]"}
                  </span>
                </div>

                {!collapsedSections.storage && (
                  <div className="space-y-3">
                    <div className="space-y-1 text-xs text-zinc-400 font-mono">
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
                )}
              </div>

              {/* Cấu hình hạn ngạch Operations Archive */}
              {!collapsedSections.storage && (
                <div className="rounded border border-indigo-900/60 bg-indigo-950/20 p-4 space-y-3.5 shadow-md">
                  <div className="flex items-center justify-between border-b border-indigo-800/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Database className="size-4 text-indigo-400" />
                      <h3 className="text-xs font-bold uppercase text-indigo-200 tracking-wider">
                        Hạn Ngạch Kho Lưu Trữ Tác Chiến // Operations Archive Quotas
                      </h3>
                    </div>
                    <span className="rounded bg-indigo-950/80 px-2 py-0.5 text-xs font-bold text-indigo-300 border border-indigo-500/40">
                      BOUNDED FIFO RETENTION
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="rounded border border-indigo-900/40 bg-zinc-950/60 p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-300 font-bold">Hạn ngạch Kết Quả Sự Kiện:</span>
                        <span className="font-mono text-indigo-300 font-bold">
                          {archiveConfigForm.eventArchiveQuota} bản ghi
                        </span>
                      </div>
                      <input
                        type="range"
                        min={20}
                        max={200}
                        step={10}
                        value={archiveConfigForm.eventArchiveQuota}
                        onChange={(e) =>
                          setArchiveConfigForm({
                            ...archiveConfigForm,
                            eventArchiveQuota: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-indigo-400 cursor-pointer"
                      />
                    </div>

                    <div className="rounded border border-indigo-900/40 bg-zinc-950/60 p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-300 font-bold">Hạn ngạch Nhật Ký Chiến Đấu:</span>
                        <span className="font-mono text-indigo-300 font-bold">
                          {archiveConfigForm.battleArchiveQuota} trận
                        </span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        step={5}
                        value={archiveConfigForm.battleArchiveQuota}
                        onChange={(e) =>
                          setArchiveConfigForm({
                            ...archiveConfigForm,
                            battleArchiveQuota: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-indigo-400 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-indigo-900/40">
                    {archiveSavedFeedback && (
                      <span className="text-xs text-emerald-400 font-bold">
                        Đã lưu cấu hình Archive Quota!
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveArchiveConfig}
                      className="rounded border border-indigo-500/50 bg-indigo-900/40 px-3.5 py-1.5 text-xs font-bold text-indigo-200 hover:bg-indigo-800/50 cursor-pointer"
                    >
                      Lưu Hạn Ngạch Archive
                    </button>
                  </div>
                </div>
              )}

              {/* Vùng nguy hiểm: Reset World */}
              <div className="rounded border border-red-500/40 bg-red-950/20 p-4 space-y-3 shadow-md">
                <div className="flex items-center gap-2 border-b border-red-900/60 pb-2">
                  <AlertOctagon className="size-4 text-red-400" />
                  <h3 className="text-xs font-black uppercase text-red-300 tracking-wider">
                    Vùng Nguy Hiểm // Reset Toàn Bộ Thế Giới
                  </h3>
                </div>

                <div className="space-y-1 text-xs text-zinc-300">
                  <p className="leading-relaxed">
                    Hành động Reset World sẽ đưa toàn bộ trạng thái thiên hà (8 sectors, quân lực, tài nguyên và sự kiện) quay về <strong>Ngày 1 / Year 1</strong>.
                  </p>
                  <p className="text-emerald-400 font-bold text-xs">
                    ✓ Bảo toàn tuyệt đối: Tiến trình RPG (Phi công, Cấp độ, Trang bị, Kho đồ, Chiến dịch 12 ải) KHÔNG bị ảnh hưởng.
                  </p>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound()
                      setIsResetConfirmOpen(true)
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded border border-red-500 bg-red-600/30 p-2.5 text-xs font-black text-red-200 hover:bg-red-600/50 hover:text-white transition-all cursor-pointer shadow-md shadow-red-950/60"
                  >
                    <Trash2 className="size-4 text-red-400" />
                    <span>RESET TOÀN BỘ WORLD VỀ NGÀY 1 (YEAR 1)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ====================================================================
            FOOTER CỐ ĐỊNH CỦA MODAL
            ==================================================================== */}
        <div className="flex flex-wrap items-center justify-between border-t border-zinc-800 bg-zinc-900/90 px-4 py-2.5 shrink-0 text-xs text-zinc-400 gap-2">
          <div className="text-xs font-mono">
            STARFRONT WORLD ENGINE · PHASE 6.33_FIX4 ADMIN CP
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
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-fadeIn text-xs">
          <div className="w-full max-w-md rounded-lg border border-cyan-500/60 bg-zinc-950 p-5 shadow-2xl shadow-cyan-950/60 space-y-4 font-mono text-zinc-200 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase text-cyan-300">
                  Xác Nhận Đổi Tốc Độ Thời Gian
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
              <p>
                Bạn đang chuyển từ{" "}
                <strong className="text-amber-300">{simulatorConfig.speedSeconds}s/ngày</strong> sang{" "}
                <strong className="text-cyan-300">{pendingSpeed}s/ngày</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleCancelSpeedDialog}
                className="rounded border border-zinc-700 bg-zinc-900 px-3.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
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
          SUB-DIALOG 2: XÁC NHẬN NGUY HIỂM RESET WORLD VỀ NGÀY 1
          ==================================================================== */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-fadeIn text-xs">
          <div className="w-full max-w-md rounded-lg border border-red-500/70 bg-zinc-950 p-5 shadow-2xl shadow-red-950/60 space-y-4 font-mono text-zinc-200 text-xs">
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
                Bạn có chắc chắn muốn đặt lại toàn bộ thế giới STARFRONT WORLD về Ngày 1 / Year 1?
              </p>
              <div className="rounded bg-red-950/30 p-2.5 border border-red-500/30 space-y-1 text-xs text-zinc-300">
                <div>&bull; Toàn bộ 8 sector sẽ trở về chủ quyền & đồn trú ban đầu.</div>
                <div>&bull; Toàn bộ sự kiện đang chạy và chuỗi nhiệm vụ sẽ bị xóa.</div>
                <div>&bull; Các đạo quân đang hành quân sẽ bị hủy an toàn.</div>
              </div>
              <p className="text-xs text-emerald-400 font-bold">
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

      {/* ====================================================================
          SUB-DIALOG 3: CẢNH BÁO GIẢM MAX THREAT & RESET WORLD VỀ YEAR 1 (PHASE 6.33_FIX4 YÊU CẦU 5)
          ==================================================================== */}
      {isThreatResetConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-fadeIn text-xs">
          <div className="w-full max-w-lg rounded-lg border border-red-500/80 bg-zinc-950 p-5 shadow-2xl shadow-red-950/80 space-y-4 font-mono text-zinc-200 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <AlertOctagon className="size-4 text-red-400 animate-pulse" />
                <h3 className="text-xs font-black uppercase text-red-300">
                  CẢNH BÁO THAY ĐỔI THREAT
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsThreatResetConfirmOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="rounded bg-red-950/40 p-2.5 border border-red-500/40 space-y-1.5 text-xs text-zinc-300 max-h-40 overflow-y-auto font-mono">
                {pendingThreatViolations.map((v) => (
                  <div key={v.id} className="border-b border-red-900/30 pb-1.5 last:border-0 last:pb-0 space-y-0.5">
                    <div className="font-bold text-white">{v.name} ({v.id})</div>
                    <div className="flex justify-between text-[11px] text-zinc-300">
                      <span>Threat Max mới: <strong className="text-yellow-300">{v.newMaxThreat.toLocaleString()}</strong></span>
                      <span>Threat hiện tại: <strong className="text-rose-300">{v.currentThreat.toLocaleString()}</strong></span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded bg-zinc-900 p-2.5 border border-zinc-800 text-xs text-zinc-300 space-y-1 leading-relaxed">
                <p className="text-amber-300 font-bold">
                  Threat Max mới thấp hơn trạng thái Threat hiện tại.
                </p>
                <p>
                  Nếu tiếp tục, WORLD sẽ được reset về Năm 1 để bảo đảm trạng thái mô phỏng hợp lệ.
                </p>
                <p className="text-[11px] text-emerald-400 pt-1">
                  ✓ Tiến trình RPG Save V4 (Phi công, Mecha, Kho đồ, Chiến dịch) được bảo lưu an toàn.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsThreatResetConfirmOpen(false)}
                className="rounded border border-zinc-700 bg-zinc-900 px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                HỦY
              </button>
              <button
                type="button"
                onClick={handleConfirmThreatReductionReset}
                className="rounded border border-red-500 bg-red-600 px-4 py-1.5 text-xs font-black text-white hover:bg-red-700 transition-colors cursor-pointer shadow-lg shadow-red-950/80"
              >
                ÁP DỤNG & RESET WORLD
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
