"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Database,
  Eye,
  FileText,
  Flame,
  Globe2,
  Hammer,
  HelpCircle,
  History,
  Layers,
  Lock,
  Moon,
  Orbit,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Route,
  Save,
  Send,
  Shield,
  ShieldAlert,
  Sliders,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Swords,
  Terminal,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Wheat,
  X,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { playClickSound, playLevelUpSound, playShieldSound } from "@/lib/game/audio"
import {
  loadWorldState,
  saveWorldState,
  resetWorldState,
} from "@/lib/game/world/storage"
import { executeWorldTick } from "@/lib/game/world/tick-engine"
import {
  getActiveEvents,
  chooseEventStrategy,
  autoLockDefaultStrategy,
  resolveProcessingEvent,
  type EventLifecycleSummary,
} from "@/lib/game/world/event-engine"
import {
  setSectorStrategicOrder,
  upgradeSectorFortification,
  calculateTotalMilitaryForce,
} from "@/lib/game/world/forces-ledger"
import {
  loadSimulatorConfig,
  saveSimulatorConfig,
  validateSimulatorConfig,
  DEFAULT_SIMULATOR_CONFIG,
  DEFAULT_GENERATOR_CONFIG,
  DEFAULT_EVENT_STRATEGY_POLICY,
  type WorldSimulatorConfig,
  type SimulationSpeedPreset,
  type EventStrategyPolicyConfig,
  type TierStrategyPreference,
} from "@/lib/game/world/simulator-config"
import { getGameCalendarInfo } from "@/lib/game/world/calendar"
import {
  checkAndSpawnWorldEvents,
  countActiveEventsByTier,
  forceSpawnEventByTier,
} from "@/lib/game/world/event-generator"
import { batchApplyEventStrategyPolicy, evaluateAndApplyEventStrategyPolicy } from "@/lib/game/world/event-strategy-policy"
import { DualResultsHub } from "./dual-results-hub"
import { QuickDispatchDock } from "./quick-dispatch-dock"
import { WorldMap } from "./world-map"
import { WorldFullscreenOverlay } from "./world-fullscreen-overlay"
import { EventsMissionsBoard } from "./events-missions-board"
import { AdminSettingsModal } from "./admin-settings-modal"
import type {
  WorldState,
  WorldSector,
  StrategicOrder,
  WorldEvent,
  EventStrategy,
} from "@/lib/game/world/types"

export type OperationsTab =
  | "overview"
  | "map"
  | "sectors"
  | "events"
  | "military"
  | "results"
  | "admin"

interface OperationsCenterProps {
  initialTab?: OperationsTab
  onNavigateSection?: (section: any) => void
  onDeployEncounter?: (sectorId: string) => void
}

export function OperationsCenter({
  initialTab = "map",
  onNavigateSection,
  onDeployEncounter,
}: OperationsCenterProps) {
  const [worldState, setWorldState] = useState<WorldState | null>(null)
  const [activeTab, setActiveTab] = useState<OperationsTab>(initialTab)
  const [selectedSectorId, setSelectedSectorId] = useState<string>("sol_command_hq")
  const [isQuickDispatchOpen, setIsQuickDispatchOpen] = useState(false)
  const [isFullscreenMapOpen, setIsFullscreenMapOpen] = useState(false)
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)
  const [isTickAdvancing, setIsTickAdvancing] = useState(false)
  const [lastTickLogs, setLastTickLogs] = useState<string[]>([])
  const [lastEventsSummary, setLastEventsSummary] = useState<EventLifecycleSummary | null>(null)

  // Phase 6.13: Real-time Simulator State & Generator
  const [simulatorConfig, setSimulatorConfig] = useState<WorldSimulatorConfig>(DEFAULT_SIMULATOR_CONFIG)
  const [dayFraction, setDayFraction] = useState<number>(0)
  const [countdownSeconds, setCountdownSeconds] = useState<number>(300)
  const lastTickTimeRef = useRef<number>(Date.now())
  const isPausedRef = useRef<boolean>(false)
  const isTickingRef = useRef<boolean>(false)

  // Phase 6.18: Settings / ADMIN CP Overlay State
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(initialTab === "admin")

  // Nạp WorldState & Simulator Config từ Storage khi mount + Offline Catch-up
  useEffect(() => {
    const cfg = loadSimulatorConfig()
    setSimulatorConfig(cfg)
    isPausedRef.current = cfg.isPaused
    setCountdownSeconds(cfg.speedSeconds)

    const loadRes = loadWorldState()
    const state = loadRes.state
    const now = Date.now()
    const speedMs = cfg.speedSeconds * 1000

    lastTickTimeRef.current = state.lastTickTimestamp || now

    // Bounded Offline Catch-up nếu simulator đang bật và đã trôi qua thời gian
    if (state.lastTickTimestamp) {
      const elapsed = now - state.lastTickTimestamp
      if (elapsed < 0) {
        // Phát hiện lùi giờ hệ thống: khử giá trị bất thường, neo lại về hiện tại
        state.lastTickTimestamp = now
        saveWorldState(state)
        lastTickTimeRef.current = now
        setDayFraction(0)
        setCountdownSeconds(cfg.speedSeconds)
      } else if (!cfg.isPaused) {
        if (elapsed >= speedMs) {
          const pendingTicks = Math.min(360, Math.floor(elapsed / speedMs))
          if (pendingTicks > 0) {
            for (let t = 0; t < pendingTicks; t++) {
              executeWorldTick(state)
              checkAndSpawnWorldEvents(state, cfg.generator, undefined, cfg.strategyPolicy)
            }
            saveWorldState(state)
            const rem = elapsed % speedMs
            lastTickTimeRef.current = now - rem
            const fraction = Math.min(0.999, Math.max(0, rem / speedMs))
            setDayFraction(fraction)
            setCountdownSeconds(Math.max(1, Math.ceil((speedMs - rem) / 1000)))
          }
        } else {
          const fraction = Math.min(0.999, Math.max(0, elapsed / speedMs))
          setDayFraction(fraction)
          setCountdownSeconds(Math.max(1, Math.ceil((speedMs - elapsed) / 1000)))
        }
      } else {
        // Đang tạm dừng: khôi phục chính xác tiến độ phân đoạn đã lưu
        const pFraction = cfg.pausedFraction ?? 0
        setDayFraction(pFraction)
        setCountdownSeconds(Math.max(1, Math.ceil((1 - pFraction) * cfg.speedSeconds)))
        lastTickTimeRef.current = now - pFraction * speedMs
      }
    }

    setWorldState(state)
  }, [])

  // Đồng bộ ref pause
  useEffect(() => {
    isPausedRef.current = simulatorConfig.isPaused
  }, [simulatorConfig.isPaused])

  // Vòng lặp thời gian thực Real-time World Simulator
  useEffect(() => {
    const timer = setInterval(() => {
      if (!worldState || isPausedRef.current || isTickingRef.current) {
        return
      }

      const now = Date.now()
      const speedMs = simulatorConfig.speedSeconds * 1000
      const elapsed = now - lastTickTimeRef.current

      if (elapsed < 0) {
        // Đồng hồ hệ thống bị lùi trong lúc chạy: neo lại mốc thời gian mượt mà, không tick bất thường
        lastTickTimeRef.current = now
        setDayFraction(0)
        setCountdownSeconds(simulatorConfig.speedSeconds)
        return
      }

      if (elapsed >= speedMs) {
        isTickingRef.current = true
        try {
          // Thực thi 1 Strategic Tick
          const tickRes = executeWorldTick(worldState, { logPhases: true })

          // Sinh Event/Quest theo ngày game và áp dụng chính sách chiến lược
          const spawnRes = checkAndSpawnWorldEvents(
            worldState,
            simulatorConfig.generator,
            undefined,
            simulatorConfig.strategyPolicy
          )

          // Lưu vĩnh viễn trạng thái
          saveWorldState(worldState)
          setWorldState({ ...worldState })
          lastTickTimeRef.current = now
          setDayFraction(0)
          setCountdownSeconds(simulatorConfig.speedSeconds)

          if (tickRes.eventsSummary) {
            setLastEventsSummary(tickRes.eventsSummary)
          }

          if (spawnRes.spawnedEvents.length > 0) {
            showToast(`[SỰ KIỆN MỚI] ${spawnRes.spawnedEvents[0].title}`, "info")
          }
        } catch (err) {
          console.error("[SIMULATOR] Lỗi trong chu kỳ tự động tick:", err)
        } finally {
          isTickingRef.current = false
        }
      } else {
        const fraction = Math.min(0.999, Math.max(0, elapsed / speedMs))
        setDayFraction(fraction)
        const remaining = Math.max(1, Math.ceil((speedMs - elapsed) / 1000))
        setCountdownSeconds(remaining)
      }
    }, 250)

    return () => clearInterval(timer)
  }, [worldState, simulatorConfig.speedSeconds, simulatorConfig.generator])

  // Bật/tắt Pause/Resume
  const handleTogglePause = () => {
    const newPaused = !simulatorConfig.isPaused
    playClickSound()
    const updated: WorldSimulatorConfig = {
      ...simulatorConfig,
      isPaused: newPaused,
      pausedFraction: newPaused ? dayFraction : undefined,
    }
    setSimulatorConfig(updated)
    isPausedRef.current = newPaused
    saveSimulatorConfig(updated)

    if (!newPaused) {
      // Khi tiếp tục, bảo toàn tiến độ phân đoạn hiện tại
      const speedMs = simulatorConfig.speedSeconds * 1000
      lastTickTimeRef.current = Date.now() - dayFraction * speedMs
      showToast("Đã kích hoạt mô phỏng thời gian thực!", "info")
    } else {
      showToast("Đã tạm dừng mô phỏng thế giới.", "info")
    }
  }

  // Xác nhận đổi tốc độ (bảo lưu tiến độ thế giới hoặc reset world tùy chọn)
  const handleConfirmSpeedChange = (newSpeed: number, resetWorld: boolean) => {
    playClickSound()
    const updated: WorldSimulatorConfig = {
      ...simulatorConfig,
      speedSeconds: newSpeed,
      pausedFraction: undefined,
    }
    setSimulatorConfig(updated)
    saveSimulatorConfig(updated)

    if (resetWorld) {
      // Đổi tốc độ kèm reset World theo yêu cầu người dùng
      const freshState = resetWorldState()
      setWorldState(freshState)
      lastTickTimeRef.current = Date.now()
      setDayFraction(0)
      setCountdownSeconds(newSpeed)
      showToast(`Đã chuyển tốc độ sang ${newSpeed}s/ngày và RESET WORLD về Ngày 1!`, "success")
    } else {
      // Điều chỉnh mốc thời gian mượt mà, bảo toàn tỷ lệ fraction hiện tại
      const newSpeedMs = newSpeed * 1000
      lastTickTimeRef.current = Date.now() - dayFraction * newSpeedMs
      setCountdownSeconds(Math.max(1, Math.ceil((1 - dayFraction) * newSpeed)))
      showToast(`Đã chuyển tốc độ mô phỏng sang 1 Ngày = ${newSpeed} giây thực!`, "success")
    }
    playLevelUpSound()
  }

  // Tua thời gian an toàn theo số ngày
  const handleFastForwardDays = (days: number) => {
    if (!worldState || isTickAdvancing) return
    playClickSound()
    setIsTickAdvancing(true)
    try {
      for (let i = 0; i < days; i++) {
        executeWorldTick(worldState)
        checkAndSpawnWorldEvents(
          worldState,
          simulatorConfig.generator,
          undefined,
          simulatorConfig.strategyPolicy
        )
      }
      saveWorldState(worldState)
      setWorldState({ ...worldState })
      lastTickTimeRef.current = Date.now()
      setDayFraction(0)
      setCountdownSeconds(simulatorConfig.speedSeconds)
      playLevelUpSound()
      showToast(`Đã tua nhanh ${days} ngày chiến lược! (Hiện tại: Ngày #${worldState.currentDay})`, "success")
    } catch (err: any) {
      showToast(`Lỗi khi tua thời gian: ${err?.message || "Không xác định"}`, "error")
    } finally {
      setIsTickAdvancing(false)
    }
  }

  // Kích hoạt sinh ngay sự kiện theo Tier
  const handleForceSpawnEvent = (tier: "small" | "medium" | "large") => {
    if (!worldState) return
    playClickSound()
    const res = forceSpawnEventByTier(
      worldState,
      tier,
      simulatorConfig.generator,
      undefined,
      simulatorConfig.strategyPolicy
    )
    if (res.success && res.event) {
      saveWorldState(worldState)
      setWorldState({ ...worldState })
      playShieldSound()
      showToast(res.message, "success")
    } else {
      showToast(res.message, "error")
    }
  }

  // Khôi phục cấu hình Generator về mặc định
  const handleResetGeneratorToDefault = () => {
    playClickSound()
    const candidateConfig: WorldSimulatorConfig = {
      ...simulatorConfig,
      generator: DEFAULT_GENERATOR_CONFIG,
    }
    setSimulatorConfig(candidateConfig)
    saveSimulatorConfig(candidateConfig)
    playShieldSound()
    showToast("Đã khôi phục cấu hình Event/Quest Generator về mặc định!", "info")
  }

  // Xác nhận Reset World độc lập
  const handleConfirmResetWorld = () => {
    playClickSound()
    isTickingRef.current = false
    const freshState = resetWorldState()
    setWorldState(freshState)

    lastTickTimeRef.current = Date.now()
    setDayFraction(0)
    setCountdownSeconds(simulatorConfig.speedSeconds)
    playLevelUpSound()
    showToast(`Đã RESET toàn bộ dữ liệu STARFRONT WORLD về Ngày 1! (Tốc độ ${simulatorConfig.speedSeconds}s giữ nguyên)`, "success")
  }

  // Lưu cấu hình Generator từ form
  const handleSaveGeneratorConfig = (genConfig: typeof DEFAULT_SIMULATOR_CONFIG.generator) => {
    playClickSound()
    const candidateConfig: WorldSimulatorConfig = {
      ...simulatorConfig,
      generator: genConfig,
    }

    const validation = validateSimulatorConfig(candidateConfig)
    if (!validation.valid) {
      showToast(`Cấu hình không hợp lệ: ${validation.errors[0]}`, "error")
      return
    }

    setSimulatorConfig(candidateConfig)
    saveSimulatorConfig(candidateConfig)
    playShieldSound()
    showToast("Đã lưu cấu hình Event/Quest Generator thành công!", "success")
  }

  // Lưu cấu hình chính sách chiến lược sự kiện
  const handleSaveStrategyPolicyConfig = (policyConfig: EventStrategyPolicyConfig) => {
    playClickSound()
    const updatedConfig: WorldSimulatorConfig = {
      ...simulatorConfig,
      strategyPolicy: policyConfig,
    }
    const validation = validateSimulatorConfig(updatedConfig)
    if (!validation.valid) {
      showToast(`Cấu hình không hợp lệ: ${validation.errors[0]}`, "error")
      return
    }

    setSimulatorConfig(updatedConfig)
    saveSimulatorConfig(updatedConfig)
    playShieldSound()
    showToast("Đã lưu chính sách chiến lược sự kiện (Event Strategy Policy) thành công!", "success")
  }

  // Khôi phục chính sách chiến lược mặc định
  const handleResetStrategyPolicyToDefault = () => {
    playClickSound()
    const updatedConfig: WorldSimulatorConfig = {
      ...simulatorConfig,
      strategyPolicy: { ...DEFAULT_EVENT_STRATEGY_POLICY },
    }
    setSimulatorConfig(updatedConfig)
    saveSimulatorConfig(updatedConfig)
    showToast("Đã khôi phục chính sách chiến lược về mặc định ban đầu.", "info")
  }

  // Áp dụng chính sách cho tất cả sự kiện INIT đang chờ
  const handleBatchApplyStrategyPolicy = (policyToApply?: EventStrategyPolicyConfig) => {
    if (!worldState) return
    playClickSound()
    const policy = policyToApply || simulatorConfig.strategyPolicy || DEFAULT_EVENT_STRATEGY_POLICY
    const batchRes = batchApplyEventStrategyPolicy(worldState, policy)
    saveWorldState(worldState)
    setWorldState({ ...worldState })
    playLevelUpSound()
    showToast(
      `Đã áp dụng chính sách: ${batchRes.autoProcessedCount} System Auto, ${batchRes.defaultFallbackCount} Default Fallback, ${batchRes.playerChoiceCount} Chờ chỉ huy.`,
      "success"
    )
  }

  // Báo cáo có chưa đọc hay không
  const hasUnreadResults = useMemo(() => {
    return Boolean(worldState?.eventResultsArchive?.some((r) => !r.isRead))
  }, [worldState?.eventResultsArchive])

  // Đồng bộ activeTab khi nhận prop initialTab từ Navigation ngoài
  useEffect(() => {
    if (initialTab === "admin") {
      setIsAdminSettingsOpen(true)
      setActiveTab("map")
    } else if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  const reloadState = () => {
    const loadRes = loadWorldState()
    setWorldState({ ...loadRes.state })
  }

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification(null)
    }, 4000)
  }

  // 1. Thao tác Tiến 1 Ngày Chiến Lược (Advance World Tick)
  const handleAdvanceTick = () => {
    if (!worldState) return
    playClickSound()
    setIsTickAdvancing(true)

    try {
      const tickRes = executeWorldTick(worldState, { logPhases: true })
      const spawnRes = checkAndSpawnWorldEvents(
        worldState,
        simulatorConfig.generator,
        undefined,
        simulatorConfig.strategyPolicy
      )
      saveWorldState(worldState)
      setWorldState({ ...worldState })
      playShieldSound()

      if (tickRes.eventsSummary) {
        setLastEventsSummary(tickRes.eventsSummary)
      }

      const summaryLogs = tickRes.phaseLogs.flatMap((p) => p.changesApplied)
      setLastTickLogs(summaryLogs.slice(0, 8))

      const autoLocked = tickRes.eventsSummary?.autoLockedCount || 0
      const resolved = tickRes.eventsSummary?.resolvedCount || 0
      let eventNote = ""
      if (spawnRes.spawnedEvents.length > 0) {
        eventNote += ` · Xuất hiện ${spawnRes.spawnedEvents.length} sự kiện mới`
      }
      if (autoLocked > 0 && resolved > 0) {
        eventNote += ` · ${resolved} sự kiện hoàn tất, ${autoLocked} sự kiện tự động khóa`
      } else if (resolved > 0) {
        eventNote += ` · ${resolved} sự kiện hoàn tất`
      } else if (autoLocked > 0) {
        eventNote += ` · ${autoLocked} sự kiện tự động khóa phương án mặc định`
      }

      showToast(`Chiến lược đã bước sang Ngày ${worldState.currentDay}! (${summaryLogs.length} biến động${eventNote})`, "success")
    } catch (err: any) {
      showToast(`Lỗi khi thực thi Tick: ${err?.message || "Không xác định"}`, "error")
    } finally {
      setIsTickAdvancing(false)
    }
  }

  // 2. Thao tác Lưu trạng thái thủ công
  const handleManualSave = () => {
    if (!worldState) return
    playClickSound()
    const saveRes = saveWorldState(worldState)
    if (saveRes.success) {
      playLevelUpSound()
      showToast(`Đã lưu trạng thái WORLD thành công (CRC32 Checksum: ${saveRes.checksum})`, "success")
    } else {
      showToast(`Lỗi khi lưu World State: ${saveRes.message}`, "error")
    }
  }

  // 3. Thao tác thay đổi Lệnh Chiến Lược cho Sector
  const handleSetStrategicOrder = (sectorId: string, newOrder: StrategicOrder) => {
    if (!worldState) return
    playClickSound()
    const res = setSectorStrategicOrder(worldState, sectorId, newOrder)
    if (res.success) {
      saveWorldState(worldState)
      setWorldState({ ...worldState })
      showToast(`Đã giao lệnh [${newOrder.toUpperCase()}] cho đồn trú ${worldState.sectors[sectorId]?.name}.`, "success")
    } else {
      showToast(res.error || "Lỗi cập nhật lệnh", "error")
    }
  }

  // 4. Thao tác Nâng cấp công sự phòng thủ
  const handleUpgradeFortification = (sectorId: string) => {
    if (!worldState) return
    playClickSound()
    const res = upgradeSectorFortification(worldState, sectorId)
    if (res.success) {
      saveWorldState(worldState)
      setWorldState({ ...worldState })
      playLevelUpSound()
      showToast(`Đã nâng cấp công sự tại ${worldState.sectors[sectorId]?.name} lên Cấp ${res.newLevel}/5!`, "success")
    } else {
      showToast(res.error || "Không thể nâng cấp công sự", "error")
    }
  }

  // 5. Thao tác Chọn chiến lược sự kiện
  const handleChooseStrategy = (eventId: string, strategyId: string) => {
    if (!worldState) return
    playClickSound()
    const res = chooseEventStrategy(worldState, eventId, strategyId)
    if (res.success) {
      saveWorldState(worldState)
      setWorldState({ ...worldState })
      playShieldSound()
      showToast(`Đã phê chuẩn phương án cho sự kiện "${res.event?.title}". Tiến trình chuyển sang PROCESSING.`, "success")
    } else {
      showToast(res.error || "Không thể chọn phương án này", "error")
    }
  }

  // Dữ liệu tính toán vĩ mô
  const sectorsList = useMemo(() => {
    if (!worldState) return []
    return Object.values(worldState.sectors)
  }, [worldState])

  const totalThreat = useMemo(() => {
    if (!sectorsList.length) return 0
    return sectorsList.reduce((acc, s) => acc + s.threatLevel, 0)
  }, [sectorsList])

  const avgThreat = useMemo(() => {
    if (!sectorsList.length) return 0
    return Math.round(totalThreat / sectorsList.length)
  }, [sectorsList, totalThreat])

  const vssCount = useMemo(() => {
    return sectorsList.filter((s) => s.sovereignty === "vss").length
  }, [sectorsList])

  const voidCount = useMemo(() => {
    return sectorsList.filter((s) => s.sovereignty === "void").length
  }, [sectorsList])

  const contestedCount = useMemo(() => {
    return sectorsList.filter((s) => s.sovereignty === "contested").length
  }, [sectorsList])

  const avgStability = useMemo(() => {
    const vssSectors = sectorsList.filter((s) => s.sovereignty === "vss")
    if (!vssSectors.length) return 0
    return Math.round(vssSectors.reduce((acc, s) => acc + s.stability, 0) / vssSectors.length)
  }, [sectorsList])

  const activeEventsList = useMemo(() => {
    if (!worldState) return []
    return getActiveEvents(worldState)
  }, [worldState])

  const activeMissionChainsList = useMemo(() => {
    if (!worldState?.missionChains) return []
    return Object.values(worldState.missionChains).filter((c) => c.status === "active")
  }, [worldState])

  const calendarInfo = useMemo(() => {
    return getGameCalendarInfo(worldState?.currentDay || 1, dayFraction)
  }, [worldState?.currentDay, dayFraction])

  const eventTierCounts = useMemo(() => {
    if (!worldState) return { small: 0, medium: 0, large: 0, total: 0 }
    return countActiveEventsByTier(worldState)
  }, [worldState])

  const nearestDeadlineEvent = useMemo(() => {
    if (!worldState) return null
    const initEvents = activeEventsList.filter((e) => e.status === "INIT")
    if (!initEvents.length) return null
    return [...initEvents].sort((a, b) => a.decisionDeadlineTick - b.decisionDeadlineTick)[0]
  }, [worldState, activeEventsList])

  const urgentAttentionEvent = useMemo(() => {
    if (!worldState) return null
    const initEvents = activeEventsList.filter((e) => e.status === "INIT")
    if (!initEvents.length) return null
    const severityWeight: Record<string, number> = { critical: 3, warning: 2, info: 1 }
    return [...initEvents].sort((a, b) => {
      const aDeadline = Math.max(0, a.decisionDeadlineTick - worldState.currentDay)
      const bDeadline = Math.max(0, b.decisionDeadlineTick - worldState.currentDay)
      if (aDeadline !== bDeadline) return aDeadline - bDeadline
      const aSev = severityWeight[a.severity] || 0
      const bSev = severityWeight[b.severity] || 0
      if (aSev !== bSev) return bSev - aSev
      return (b.priority ?? 0) - (a.priority ?? 0)
    })[0]
  }, [worldState, activeEventsList])

  const selectedSector = worldState?.sectors[selectedSectorId] || sectorsList[0]

  if (!worldState) {
    return (
      <div className="flex min-h-[400px] items-center justify-center font-mono text-zinc-400">
        <RefreshCw className="size-6 animate-spin text-cyan-400 mr-2" />
        <span>ĐANG TẢI DỮ LIỆU TÁC CHIẾN STARFRONT WORLD...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 font-mono text-xs text-zinc-200">
      {/* ====================================================================
          A. SLIM TACTICAL HUD (PHASE 6.18: COMPACT STRATEGIC COMMAND BAR)
          ==================================================================== */}
      <header className="rounded border border-cyan-500/40 bg-zinc-950/95 px-3 py-2 sm:px-4 sm:py-2.5 shadow-xl shadow-cyan-950/30 backdrop-blur-md">
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5 sm:gap-3">
          {/* NHÓM 1: THỜI GIAN CHIẾN LƯỢC (Strategic Time & Simulation Status) */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 pr-1 border-r border-zinc-800/80 shrink-0">
              <span
                className={cn(
                  "size-2 rounded-full",
                  simulatorConfig.isPaused ? "bg-amber-400" : "bg-cyan-400 animate-ping"
                )}
              />
              <span className="font-display font-black text-xs text-cyan-300 uppercase tracking-wider">
                WORLD
              </span>
            </div>

            {/* Ngày & Niên Lịch */}
            <div
              className="flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900/90 px-2 py-1 text-[11px] font-mono"
              title={`Niên lịch thiên hà: ${calendarInfo.formattedDate} · ${calendarInfo.cycleDesc}`}
            >
              <Calendar className="size-3 text-cyan-400 shrink-0" />
              <span className="font-bold text-cyan-200">NGÀY #{worldState.currentDay}</span>
              <span className="text-zinc-600 hidden sm:inline">·</span>
              <span className="text-zinc-400 text-[10px] hidden sm:inline">{calendarInfo.formattedDate}</span>
              <span className="text-zinc-600 hidden md:inline">·</span>
              <span className={cn("text-[10px] font-bold hidden md:inline", calendarInfo.cycleColor)}>
                {calendarInfo.timeString} [{calendarInfo.cycleName}] {calendarInfo.seasonIcon}
              </span>
            </div>

            {/* Simulator Control: Play/Pause */}
            <button
              type="button"
              onClick={handleTogglePause}
              className={cn(
                "flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-bold font-mono transition-all cursor-pointer shadow-sm",
                simulatorConfig.isPaused
                  ? "border-amber-500/60 bg-amber-950/50 text-amber-300 hover:bg-amber-900/60 shadow-amber-950/30"
                  : "border-emerald-500/60 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/60 shadow-emerald-950/30"
              )}
              title={simulatorConfig.isPaused ? "Tiếp tục chạy mô phỏng thời gian thực" : "Tạm dừng mô phỏng thế giới"}
            >
              {simulatorConfig.isPaused ? (
                <Play className="size-3 fill-current text-amber-400" />
              ) : (
                <Pause className="size-3 text-emerald-400" />
              )}
              <span>{simulatorConfig.isPaused ? "PAUSED" : "RUNNING"}</span>
            </button>

            {/* Đếm ngược ngày tiếp theo */}
            <div
              className="flex items-center gap-1 rounded border border-zinc-800/80 bg-zinc-900/80 px-2 py-1 text-[11px] font-mono text-zinc-300"
              title={`Tốc độ simulator: 1 Ngày = ${simulatorConfig.speedSeconds}s thực`}
            >
              <Clock className="size-3 text-cyan-400 shrink-0" />
              <span
                className={cn(
                  "font-bold text-xs",
                  simulatorConfig.isPaused ? "text-amber-400" : "text-cyan-300"
                )}
              >
                {simulatorConfig.isPaused ? "--" : `${countdownSeconds}s`}
              </span>
            </div>
          </div>

          {/* NHÓM 2: TÀI NGUYÊN (5 Core Galactic Resources - Compact & Legible) */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            {/* 1. Vật Liệu */}
            <div
              className={cn(
                "flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] font-mono transition-colors",
                worldState.resources.industrialMaterials <= 20
                  ? "border-red-500/70 bg-red-950/40 text-red-200"
                  : "border-zinc-800 bg-zinc-900/70 text-zinc-200"
              )}
              title={`Vật Liệu Công Nghiệp: ${worldState.resources.industrialMaterials} (Nâng cấp công sự & hạ tầng)`}
            >
              <Boxes className="size-3 text-cyan-400 shrink-0" />
              <span className="text-[10px] text-zinc-400 hidden xl:inline">Vật Liệu</span>
              <span
                className={cn(
                  "font-bold",
                  worldState.resources.industrialMaterials <= 20 ? "text-red-300 animate-pulse" : "text-zinc-100"
                )}
              >
                {worldState.resources.industrialMaterials}
              </span>
            </div>

            {/* 2. Năng Lượng */}
            <div
              className={cn(
                "flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] font-mono transition-colors",
                worldState.resources.energy <= 20
                  ? "border-red-500/70 bg-red-950/40 text-red-200"
                  : "border-zinc-800 bg-zinc-900/70 text-zinc-200"
              )}
              title={`Năng Lượng Plasma: ${worldState.resources.energy} (Duy trì khiên & vận hành phòng thủ)`}
            >
              <Zap className="size-3 text-amber-400 shrink-0" />
              <span className="text-[10px] text-zinc-400 hidden xl:inline">Plasma</span>
              <span
                className={cn(
                  "font-bold",
                  worldState.resources.energy <= 20 ? "text-red-300 animate-pulse" : "text-zinc-100"
                )}
              >
                {worldState.resources.energy}
              </span>
            </div>

            {/* 3. Hậu Cần */}
            <div
              className={cn(
                "flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] font-mono transition-colors",
                worldState.resources.logisticsSupplies <= 20
                  ? "border-red-500/70 bg-red-950/40 text-red-200"
                  : "border-zinc-800 bg-zinc-900/70 text-zinc-200"
              )}
              title={`Vật Tư Hậu Cần: ${worldState.resources.logisticsSupplies} (Tiếp tế hạm đội & tuyến đường)`}
            >
              <Truck className="size-3 text-indigo-400 shrink-0" />
              <span className="text-[10px] text-zinc-400 hidden xl:inline">Hậu Cần</span>
              <span
                className={cn(
                  "font-bold",
                  worldState.resources.logisticsSupplies <= 20 ? "text-red-300 animate-pulse" : "text-zinc-100"
                )}
              >
                {worldState.resources.logisticsSupplies}
              </span>
            </div>

            {/* 4. Dữ Liệu */}
            <div
              className={cn(
                "flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] font-mono transition-colors",
                worldState.resources.tacticalData <= 20
                  ? "border-red-500/70 bg-red-950/40 text-red-200"
                  : "border-zinc-800 bg-zinc-900/70 text-zinc-200"
              )}
              title={`Dữ Liệu Tác Chiến: ${worldState.resources.tacticalData} (Giải mã tình báo & sự kiện chiến lược)`}
            >
              <Database className="size-3 text-purple-400 shrink-0" />
              <span className="text-[10px] text-zinc-400 hidden xl:inline">Dữ Liệu</span>
              <span
                className={cn(
                  "font-bold",
                  worldState.resources.tacticalData <= 20 ? "text-red-300 animate-pulse" : "text-zinc-100"
                )}
              >
                {worldState.resources.tacticalData}
              </span>
            </div>

            {/* 5. Lương Thực */}
            <div
              className={cn(
                "flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] font-mono transition-colors",
                worldState.resources.food <= 50
                  ? "border-red-500/70 bg-red-950/40 text-red-200"
                  : "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
              )}
              title={`Lương Thực Dân Sinh: ${worldState.resources.food} (Duy trì dân cư & độ ổn định các sector)`}
            >
              <Wheat className="size-3 text-emerald-400 shrink-0" />
              <span className="text-[10px] text-emerald-400 hidden xl:inline">Lương Thực</span>
              <span
                className={cn(
                  "font-bold",
                  worldState.resources.food <= 50 ? "text-red-300 animate-pulse" : "text-emerald-300"
                )}
              >
                {worldState.resources.food}
              </span>
            </div>
          </div>

          {/* NHÓM 3: THAO TÁC NHANH (Quick Actions & Settings Trigger) */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Advance Day */}
            <button
              type="button"
              onClick={handleAdvanceTick}
              disabled={isTickAdvancing}
              className={cn(
                "flex items-center gap-1 rounded border border-cyan-400 bg-cyan-600/30 px-2.5 py-1 text-xs font-bold text-cyan-200 hover:bg-cyan-600/50 hover:text-white transition-all cursor-pointer shadow-sm shadow-cyan-900/50",
                isTickAdvancing && "opacity-50 cursor-wait"
              )}
              title="Thực thi một chu kỳ chiến lược (+1 Ngày)"
            >
              <Play className="size-3 fill-current text-cyan-300" />
              <span>{isTickAdvancing ? "Đang Tính..." : "+1 Ngày"}</span>
            </button>

            {/* Fullscreen Map */}
            <button
              type="button"
              onClick={() => {
                playClickSound()
                setIsFullscreenMapOpen(true)
              }}
              className="flex items-center gap-1 rounded border border-cyan-500/60 bg-cyan-950/40 px-2 py-1 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50 hover:text-white transition-all cursor-pointer shadow-sm shadow-cyan-950/40"
              title="Mở Bản Đồ Toàn Màn Hình (100vw/100vh)"
            >
              <Orbit className="size-3 text-cyan-400" />
              <span className="hidden sm:inline">Bản Đồ</span>
            </button>

            {/* Báo cáo / Kết quả */}
            <button
              type="button"
              onClick={() => {
                playClickSound()
                setActiveTab("results")
              }}
              className={cn(
                "flex items-center gap-1 rounded border px-2 py-1 text-xs font-bold transition-all cursor-pointer",
                activeTab === "results"
                  ? "border-indigo-400 bg-indigo-950/70 text-indigo-200"
                  : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:text-white"
              )}
              title="Mở Trung Tâm Báo Cáo & Kết Quả Sự Kiện"
            >
              <FileText className="size-3 text-indigo-400" />
              <span className="hidden sm:inline">Báo Cáo</span>
              {hasUnreadResults && (
                <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            {/* Điều Quân Nhanh */}
            <button
              type="button"
              onClick={() => {
                playClickSound()
                setIsQuickDispatchOpen(true)
              }}
              className="flex items-center gap-1 rounded border border-amber-500/50 bg-amber-950/40 px-2 py-1 text-xs font-bold text-amber-300 hover:bg-amber-900/50 transition-colors cursor-pointer"
              title="Mở bến điều động chi viện quân sự nhanh"
            >
              <Zap className="size-3 text-amber-400" />
              <span className="hidden md:inline">Điều Quân</span>
            </button>

            {/* Nút Bánh Răng: Cài Đặt / Admin CP Overlay */}
            <button
              type="button"
              onClick={() => {
                playClickSound()
                setIsAdminSettingsOpen(true)
              }}
              className={cn(
                "flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-bold font-mono transition-all cursor-pointer",
                isAdminSettingsOpen
                  ? "border-amber-400 bg-amber-950/80 text-amber-200 shadow-md shadow-amber-950/60"
                  : "border-amber-500/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 hover:text-amber-100 hover:border-amber-400"
              )}
              title="Mở Bảng Điều Khiển Cài Đặt & Quản Trị Viên (Settings Overlay)"
            >
              <Sliders className="size-3 text-amber-400" />
              <span>Cài Đặt</span>
              <span className="rounded bg-black/50 px-1 py-0.2 text-[9px] text-amber-300 border border-amber-500/30 hidden lg:inline">
                {simulatorConfig.isPaused ? "Paused" : `${simulatorConfig.speedSeconds}s`}
              </span>
            </button>

            {/* Lưu thủ công */}
            <button
              type="button"
              onClick={handleManualSave}
              className="flex items-center gap-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
              title="Lưu trạng thái an toàn vào STARFRONT_WORLD_SAVE_V1"
            >
              <Save className="size-3 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Thông báo Toast Thu Gọn */}
        {notification && (
          <div
            className={cn(
              "mt-2 flex items-center justify-between rounded px-2.5 py-1 text-[11px] font-mono animate-fadeIn border",
              notification.type === "success" && "border-emerald-500/50 bg-emerald-950/60 text-emerald-200",
              notification.type === "error" && "border-red-500/50 bg-red-950/60 text-red-200",
              notification.type === "info" && "border-cyan-500/50 bg-cyan-950/60 text-cyan-200"
            )}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3 shrink-0" />
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="size-3" />
            </button>
          </div>
        )}
      </header>

      {/* ====================================================================
          B. NAVIGATION TABS (5 PHÂN KHU TÁC CHIẾN — ĐÃ CÁCH LY ADMIN CP)
          ==================================================================== */}
      <nav className="flex flex-wrap items-center gap-1.5 border-b border-zinc-800 pb-2">
        {[
          {
            id: "map",
            label: "War Room // Bản Đồ Chiến Lược",
            icon: Compass,
            badge: "Trung Tâm",
          },
          { id: "overview", label: "Tình Hình Toàn Cảnh", icon: Activity },
          {
            id: "events",
            label: "Sự Kiện & Nhiệm Vụ",
            icon: Flame,
            badge: activeEventsList.length > 0 ? `${activeEventsList.length}` : null,
          },
          { id: "military", label: "Quân Sự & Hậu Cần", icon: Swords },
          {
            id: "results",
            label: "Trung Tâm Kết Quả",
            icon: Layers,
            badge: worldState.eventResultsArchive?.some((r) => !r.isRead) ? "Mới" : null,
          },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id || (tab.id === "map" && activeTab === "sectors")
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                playClickSound()
                setActiveTab(tab.id as OperationsTab)
              }}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold uppercase transition-all cursor-pointer",
                isActive
                  ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 shadow-md shadow-cyan-950/40"
                  : "bg-zinc-900/60 text-zinc-400 border border-zinc-800/80 hover:bg-zinc-900 hover:text-zinc-200"
              )}
            >
              <Icon className={cn("size-3.5", isActive ? "text-cyan-400" : "text-zinc-500")} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={cn(
                  "rounded px-1.5 py-0.2 text-[10px] font-bold border",
                  tab.id === "map"
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* ====================================================================
          TAB 1: TÌNH HÌNH CHIẾN LƯỢC (SITUATION DECK & MACRO GAUGES)
          ==================================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* ================================================================
              PHASE 6.13: ĐỒNG HỒ CHIẾN LƯỢC & NIÊN LỊCH THỜI GIAN THỰC
              ================================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Cột 1 & 2: Niên lịch và Chu kỳ thời gian trong ngày */}
            <div className="lg:col-span-2 rounded border border-cyan-500/40 bg-zinc-950/80 p-4 space-y-3 shadow-lg shadow-cyan-950/20">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
                    <Calendar className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                      Niên Lịch & Chu Kỳ Nhật Dạ Thiên Hà
                    </h2>
                    <p className="text-[10px] text-zinc-400">
                      Quy chuẩn thời gian Vanguard Solar Syndicate (24 Giờ / Ngày · 360 Ngày / Năm)
                    </p>
                  </div>
                </div>

                {/* Badge Mùa & Năm */}
                <div className="flex items-center gap-2">
                  <span className="rounded bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300 font-bold">
                    Năm {calendarInfo.year.toString().padStart(2, "0")}
                  </span>
                  <span className="flex items-center gap-1 rounded bg-cyan-950/70 border border-cyan-500/40 px-2 py-0.5 text-[10px] text-cyan-300 font-bold">
                    <span>{calendarInfo.seasonIcon}</span>
                    <span>{calendarInfo.seasonName}</span>
                  </span>
                </div>
              </div>

              {/* Chi tiết ngày, giờ, buổi và tiến độ */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Ngày tháng */}
                <div className="rounded bg-zinc-900/60 p-2.5 border border-zinc-800/60 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">Ngày Chiến Lược</div>
                  <div className="text-sm font-black text-cyan-300 font-mono">
                    Ngày {calendarInfo.dayOfMonth} / 30
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {calendarInfo.monthName} (Tổng Ngày #{worldState.currentDay})
                  </div>
                </div>

                {/* Thời gian trong ngày & Buổi */}
                <div className="rounded bg-zinc-900/60 p-2.5 border border-zinc-800/60 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">Thời Khắc Trong Ngày</div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-amber-300 font-mono tracking-wider">
                      {calendarInfo.timeString}
                    </span>
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.2 rounded border bg-zinc-950/80", calendarInfo.cycleColor)}>
                      {calendarInfo.cycleName}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate" title={calendarInfo.cycleDesc}>
                    {calendarInfo.cycleDesc}
                  </div>
                </div>

                {/* Trạng thái Mô Phỏng & Đếm ngược */}
                <div className="rounded bg-zinc-900/60 p-2.5 border border-zinc-800/60 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase font-bold">
                    <span>Mô Phỏng Thời Gian Thực</span>
                    <span className={cn("flex items-center gap-1 font-bold", simulatorConfig.isPaused ? "text-amber-400" : "text-emerald-400")}>
                      <span className={cn("size-1.5 rounded-full", simulatorConfig.isPaused ? "bg-amber-400" : "bg-emerald-400 animate-ping")} />
                      {simulatorConfig.isPaused ? "TẠM DỪNG" : "ĐANG CHẠY"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-300 font-mono font-bold">
                      1 Ngày = {simulatorConfig.speedSeconds}s
                    </span>
                    <span className={cn("text-xs font-mono font-bold", simulatorConfig.isPaused ? "text-amber-300" : "text-cyan-300")}>
                      {simulatorConfig.isPaused ? "ĐÃ DỪNG" : `Còn ${countdownSeconds}s`}
                    </span>
                  </div>

                  {/* Thanh tiến trình ngày */}
                  <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-800 mt-1">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        simulatorConfig.isPaused ? "bg-amber-500" : "bg-gradient-to-r from-cyan-500 to-emerald-400"
                      )}
                      style={{ width: `${Math.round(dayFraction * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cột 3: Giám Sát Trực Tiếp Sự Kiện & Nhiệm Vụ */}
            <div className="rounded border border-zinc-800 bg-zinc-950/80 p-4 space-y-2.5 flex flex-col justify-between shadow-lg shadow-zinc-950/40">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <span className="flex items-center gap-1.5 font-bold uppercase text-[11px] text-zinc-300">
                    <Flame className="size-3.5 text-amber-400" />
                    Sự Kiện & Nhiệm Vụ Đang Chạy
                  </span>
                  <span className="font-mono text-xs font-bold text-cyan-300">
                    {eventTierCounts.total} / {simulatorConfig.generator.maxGlobalActive}
                  </span>
                </div>

                {/* Phân bổ theo 3 Tier */}
                <div className="grid grid-cols-3 gap-1.5 text-center mt-2.5">
                  <div className="rounded bg-zinc-900/60 p-1.5 border border-zinc-800">
                    <div className="text-[9px] text-zinc-500 uppercase">Nhỏ (Small)</div>
                    <div className="font-bold text-cyan-300 font-mono text-xs mt-0.5">
                      {eventTierCounts.small}/{simulatorConfig.generator.small.maxActive}
                    </div>
                  </div>
                  <div className="rounded bg-zinc-900/60 p-1.5 border border-zinc-800">
                    <div className="text-[9px] text-zinc-500 uppercase">Trung Bình</div>
                    <div className="font-bold text-amber-300 font-mono text-xs mt-0.5">
                      {eventTierCounts.medium}/{simulatorConfig.generator.medium.maxActive}
                    </div>
                  </div>
                  <div className="rounded bg-zinc-900/60 p-1.5 border border-zinc-800">
                    <div className="text-[9px] text-zinc-500 uppercase">Lớn (Large)</div>
                    <div className="font-bold text-rose-400 font-mono text-xs mt-0.5">
                      {eventTierCounts.large}/{simulatorConfig.generator.large.maxActive}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hạn chót & Điểm nóng */}
              <div className="space-y-1.5 text-[10px] pt-1 border-t border-zinc-800/60">
                {nearestDeadlineEvent ? (
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="text-zinc-500 truncate max-w-[150px]">
                      Hạn chót gần nhất:
                    </span>
                    <span className="font-bold text-amber-300 font-mono">
                      Ngày #{nearestDeadlineEvent.decisionDeadlineTick} (Còn {Math.max(0, nearestDeadlineEvent.decisionDeadlineTick - worldState.currentDay)}d)
                    </span>
                  </div>
                ) : (
                  <div className="text-zinc-500 italic">Không có hạn chót khẩn cấp.</div>
                )}

                {urgentAttentionEvent && (
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound()
                      setActiveTab("events")
                    }}
                    className="w-full flex items-center justify-between p-1.5 rounded bg-amber-950/30 border border-amber-500/40 text-amber-300 hover:bg-amber-900/40 transition-colors cursor-pointer text-left"
                  >
                    <span className="truncate max-w-[180px]">⚠️ {urgentAttentionEvent.title}</span>
                    <span className="text-[9px] font-bold underline">Xem &rarr;</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hàng 1: Thẻ cảnh báo khẩn cấp & Tỷ lệ kiểm soát */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Cột 1: Mức độ đe dọa toàn thiên hà */}
            <div className="rounded border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="flex items-center gap-1.5 font-bold uppercase text-[11px]">
                  <ShieldAlert className="size-3.5 text-amber-400" />
                  Mức Đe Dọa Thiên Hà
                </span>
                <span className="font-bold text-cyan-400">{avgThreat} / 1000</span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    avgThreat >= 750 ? "bg-red-500" : avgThreat >= 500 ? "bg-amber-500" : "bg-cyan-500"
                  )}
                  style={{ width: `${Math.min(100, (avgThreat / 1000) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span>An Toàn [0..250]</span>
                <span>Báo Động [500]</span>
                <span>Nguy Cấp [750+]</span>
              </div>
            </div>

            {/* Cột 2: Tỷ lệ phân bố lãnh thổ */}
            <div className="rounded border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="flex items-center gap-1.5 font-bold uppercase text-[11px]">
                  <Globe2 className="size-3.5 text-cyan-400" />
                  Chủ Quyền Lãnh Thổ
                </span>
                <span className="font-bold text-emerald-400">
                  {Math.round((vssCount / sectorsList.length) * 100)}% VSS
                </span>
              </div>

              {/* Segmented bar */}
              <div className="flex h-2 w-full rounded-full overflow-hidden bg-zinc-900">
                <div
                  style={{ width: `${(vssCount / sectorsList.length) * 100}%` }}
                  className="bg-emerald-500"
                  title={`VSS: ${vssCount} sector`}
                />
                <div
                  style={{ width: `${(contestedCount / sectorsList.length) * 100}%` }}
                  className="bg-amber-500"
                  title={`Tranh chấp: ${contestedCount} sector`}
                />
                <div
                  style={{ width: `${(voidCount / sectorsList.length) * 100}%` }}
                  className="bg-red-500"
                  title={`The Void: ${voidCount} sector`}
                />
              </div>

              <div className="flex items-center justify-between text-[10px]">
                <span className="text-emerald-400 font-bold">{vssCount} VSS</span>
                <span className="text-amber-400 font-bold">{contestedCount} Tranh Chấp</span>
                <span className="text-red-400 font-bold">{voidCount} The Void</span>
              </div>
            </div>

            {/* Cột 3: Tình trạng nhân khẩu học */}
            <div className="rounded border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="flex items-center gap-1.5 font-bold uppercase text-[11px]">
                  <Users className="size-3.5 text-indigo-400" />
                  Dân Số Liên Minh VSS
                </span>
                <span className="font-bold text-zinc-200">
                  {worldState.demographics.controlledTerritoryPopulation.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1 text-[10px] text-zinc-400">
                <div>
                  Tổng dân số: <span className="font-bold text-zinc-200">{worldState.demographics.nationalTotalPopulation.toLocaleString()}</span>
                </div>
                <div>
                  Đang sơ tán: <span className="font-bold text-cyan-300">{worldState.demographics.refugeesInTransit.toLocaleString()}</span>
                </div>
                <div>
                  Thương vong: <span className="font-bold text-red-400">{worldState.demographics.civilianCasualties.toLocaleString()}</span>
                </div>
                <div>
                  Ổn định TB: <span className="font-bold text-emerald-400">{avgStability}/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hàng 2: Bảng Cảnh Báo Chiến Lược Quan Trọng */}
          <div className="rounded border border-amber-500/40 bg-zinc-950/80 p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold uppercase text-[11px]">
              <AlertTriangle className="size-4 text-amber-400" />
              <span>BẢNG CẢNH BÁO KHẨN CẤP THỜI GIAN THỰC (ACTIVE SITUATION ALERTS)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              {/* Sector bị vây hãm hoặc đe dọa */}
              {sectorsList.filter((s) => s.stage === "under_siege" || s.stage === "threatened").length === 0 ? (
                <div className="rounded bg-zinc-900/40 p-2 text-zinc-500 border border-zinc-800/60">
                  Phòng tuyến vững vàng: Không có sector nào đang bị vây hãm.
                </div>
              ) : (
                sectorsList
                  .filter((s) => s.stage === "under_siege" || s.stage === "threatened")
                  .map((s) => (
                    <div
                      key={s.id}
                      className={cn(
                        "flex items-center justify-between rounded p-2 border",
                        s.stage === "under_siege"
                          ? "border-red-500/50 bg-red-950/20 text-red-200"
                          : "border-amber-500/40 bg-amber-950/20 text-amber-200"
                      )}
                    >
                      <div>
                        <span className="font-bold uppercase">{s.name}</span> · Giai đoạn:{" "}
                        <span className="underline uppercase font-bold">{s.stage}</span>
                      </div>
                      <span className="font-bold">Threat: {s.threatLevel}</span>
                    </div>
                  ))
              )}

              {/* Cảnh báo sự kiện sắp hết hạn */}
              {activeEventsList.filter((e) => e.status === "INIT").length === 0 ? (
                <div className="rounded bg-zinc-900/40 p-2 text-zinc-500 border border-zinc-800/60">
                  Không có sự kiện nào đang chờ quyết định khẩn cấp.
                </div>
              ) : (
                activeEventsList
                  .filter((e) => e.status === "INIT")
                  .map((e) => {
                    const daysLeft = Math.max(0, e.decisionDeadlineTick - worldState.currentDay)
                    return (
                      <div
                        key={e.id}
                        className="flex items-center justify-between rounded p-2 border border-cyan-500/40 bg-cyan-950/20 text-cyan-200"
                      >
                        <div>
                          <span className="font-bold uppercase">{e.title}</span>
                          <div className="text-[10px] text-zinc-400">
                            {daysLeft === 0
                              ? "Hạn chót hôm nay! Sẽ tự khóa mặc định."
                              : `Còn ${daysLeft} ngày chiến lược để ra quyết định.`}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab("events")}
                          className="rounded bg-cyan-900/50 px-2 py-1 text-[10px] text-cyan-200 hover:bg-cyan-800"
                        >
                          Xử Lý &rarr;
                        </button>
                      </div>
                    )
                  })
              )}
            </div>
          </div>

          {/* Hàng 3: Nhật Ký Tick gần nhất (Tick Feedback Log) */}
          {lastTickLogs.length > 0 && (
            <div className="rounded border border-zinc-800 bg-black/60 p-3 space-y-1.5 text-[11px]">
              <div className="text-zinc-400 font-bold uppercase flex items-center gap-1.5 text-[10px]">
                <History className="size-3.5 text-cyan-400" />
                <span>Nhật Ký Biến Động Chu Kỳ Gần Nhất (Ngày #{worldState.currentDay}):</span>
              </div>
              <ul className="space-y-1 text-zinc-300">
                {lastTickLogs.map((l, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-cyan-400 font-bold">&bull;</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          WAR ROOM // BẢN ĐỒ CHIẾN LƯỢC TOÀN DIỆN & SECTOR COMMAND FOUNDATION (PHASE 6.17 P0)
          ==================================================================== */}
      {(activeTab === "map" || activeTab === "sectors") && (
        <div className="space-y-2.5">
          {/* Thông báo tương thích nếu truy cập thông qua tab hoặc đường dẫn 'sectors' cũ */}
          {activeTab === "sectors" && (
            <div className="flex items-center justify-between rounded border border-cyan-500/40 bg-cyan-950/40 px-3 py-1.5 text-[11px] text-cyan-200 animate-fadeIn">
              <div className="flex items-center gap-2">
                <Globe2 className="size-3.5 text-cyan-400 shrink-0" />
                <span>
                  <strong>Mạng Lưới Sector đã được hợp nhất vào War Room:</strong> Bấm vào sector trên bản đồ hoặc thanh điều phối bên dưới để xem Inspector chi tiết và ra lệnh.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClickSound()
                  setActiveTab("map")
                }}
                className="text-cyan-300 hover:text-white underline text-[10px] font-bold shrink-0 ml-2 cursor-pointer"
              >
                Ẩn thông báo
              </button>
            </div>
          )}

          {/* THANH ĐIỀU PHỐI SECTOR NHANH (SECTOR COMMAND RIBBON) */}
          <div className="rounded border border-cyan-500/30 bg-zinc-950/90 p-2.5 shadow-lg shadow-cyan-950/20 backdrop-blur-md">
            <div className="flex items-center justify-between text-[11px] pb-1.5 mb-1.5 border-b border-zinc-800/80">
              <div className="flex items-center gap-1.5 text-zinc-300 font-bold uppercase tracking-wide">
                <Compass className="size-3.5 text-cyan-400" />
                <span>Mạng Lưới 8 Sector Thiên Hà — Điều Phối & Soi Tức Thì</span>
              </div>
              <span className="text-[10px] text-zinc-400 hidden sm:inline">
                Đồng bộ tự động giữa Bản Đồ và Inspector bên phải
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
              {sectorsList.map((sector) => {
                const isSelected = selectedSectorId === sector.id
                const isLocked = !!sector.isLockedForCombat
                const threatTier = sector.threatLevel >= 700 ? "high" : sector.threatLevel >= 300 ? "med" : "low"

                return (
                  <button
                    key={sector.id}
                    type="button"
                    onClick={() => {
                      playClickSound()
                      setSelectedSectorId(sector.id)
                    }}
                    className={cn(
                      "flex flex-col justify-between p-2 rounded border text-left transition-all cursor-pointer relative",
                      isSelected
                        ? "border-cyan-400 bg-cyan-950/50 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-400/50"
                        : "border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-850"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className={cn("font-bold text-[11px] truncate", isSelected ? "text-cyan-200" : "text-zinc-200")}>
                        {sector.name.split(" ")[0]}
                      </span>
                      <span
                        className={cn(
                          "size-2 rounded-full shrink-0",
                          sector.sovereignty === "vss"
                            ? "bg-cyan-400"
                            : sector.sovereignty === "void"
                            ? "bg-red-500 animate-pulse"
                            : "bg-amber-400"
                        )}
                        title={`Chủ quyền: ${sector.sovereignty.toUpperCase()}`}
                      />
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-400 w-full">
                      <span
                        className={cn(
                          "font-mono font-bold text-[10px]",
                          threatTier === "high" ? "text-red-400" : threatTier === "med" ? "text-amber-400" : "text-emerald-400"
                        )}
                        title={`Threat: ${sector.threatLevel}/1000`}
                      >
                        T:{sector.threatLevel}
                      </span>

                      <span className="font-mono text-[10px] text-zinc-300">
                        {sector.garrisonPower}q
                      </span>
                    </div>

                    {isLocked && (
                      <div className="absolute top-1 right-1 text-red-400" title="Đang khóa Combat">
                        <Lock className="size-2.5" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* KHUNG NHÌN WAR ROOM TRUNG TÂM: GALAXY MAP + SECTOR INSPECTOR */}
          <div className="h-[680px] lg:h-[740px] xl:h-[780px] min-h-[580px] rounded border border-cyan-500/40 bg-zinc-950 overflow-hidden shadow-2xl relative">
            <WorldMap
              worldState={worldState}
              selectedSectorId={selectedSectorId}
              onSelectSector={(secId) => setSelectedSectorId(secId)}
              onNavigateToSectorOperations={(secId) => {
                setSelectedSectorId(secId)
                setActiveTab("map")
              }}
              onOpenQuickDispatch={(secId) => {
                setSelectedSectorId(secId)
                setIsQuickDispatchOpen(true)
              }}
              onDeployCombat={(secId) => {
                onDeployEncounter?.(secId)
              }}
              onUpdateWorldState={(newState) => {
                setWorldState({ ...newState })
              }}
              isFullscreen={false}
              onToggleFullscreen={() => setIsFullscreenMapOpen(true)}
            />
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 3: SỰ KIỆN & NHIỆM VỤ (PHASE 6.10 REDESIGNED EVENTS & MISSIONS BOARD)
          ==================================================================== */}
      {activeTab === "events" && (
        <EventsMissionsBoard
          worldState={worldState}
          activeEvents={activeEventsList}
          activeMissionChains={activeMissionChainsList}
          lastEventsSummary={lastEventsSummary}
          onChooseStrategy={handleChooseStrategy}
          onNavigateToResults={() => {
            playClickSound()
            setActiveTab("results")
          }}
          onNavigateToSector={(sectorId) => {
            playClickSound()
            setSelectedSectorId(sectorId)
            setActiveTab("sectors")
          }}
          onStateUpdated={reloadState}
        />
      )}

      {/* ====================================================================
          TAB 4: QUÂN SỰ & HẬU CẦN (FORCES & LOGISTICS)
          ==================================================================== */}
      {activeTab === "military" && (
        <div className="space-y-4">
          {/* Sổ cái quân sự */}
          <div className="rounded border border-zinc-800 bg-zinc-950/80 p-4 space-y-3">
            <div className="flex items-center justify-between text-zinc-400 text-[11px]">
              <span className="font-bold uppercase tracking-wide flex items-center gap-1.5">
                <Swords className="size-3.5 text-cyan-400" />
                SỔ CÁI LỰC LƯỢNG QUÂN SỰ BẢO TOÀN (AUTHORITATIVE FORCE LEDGER)
              </span>
              <span className="font-bold text-cyan-300">
                Tổng lực lượng: {calculateTotalMilitaryForce(worldState.military)} quân
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
              <div className="rounded bg-zinc-900/60 p-2 border border-zinc-800">
                <div className="text-zinc-400 text-[10px]">Đang Triển Khai</div>
                <div className="font-bold text-zinc-100 text-sm">{worldState.military.deployed}</div>
              </div>

              <div className="rounded bg-cyan-950/20 p-2 border border-cyan-500/30">
                <div className="text-cyan-400 text-[10px] font-bold">Dự Bị Chiến Lược</div>
                <div className="font-bold text-cyan-300 text-sm">{worldState.military.reserves}</div>
              </div>

              <div className="rounded bg-zinc-900/60 p-2 border border-zinc-800">
                <div className="text-zinc-400 text-[10px]">Thương Binh / Sửa Chữa</div>
                <div className="font-bold text-amber-400 text-sm">{worldState.military.woundedOrRepair}</div>
              </div>

              <div className="rounded bg-zinc-900/60 p-2 border border-zinc-800">
                <div className="text-zinc-400 text-[10px]">Đang Rút Lui</div>
                <div className="font-bold text-zinc-300 text-sm">{worldState.military.retreating}</div>
              </div>

              <div className="rounded bg-red-950/20 p-2 border border-red-500/30">
                <div className="text-red-400 text-[10px]">Tổn Thất Vĩnh Viễn</div>
                <div className="font-bold text-red-300 text-sm">{worldState.military.casualties}</div>
              </div>
            </div>
          </div>

          {/* Đạo quân đang hành quân in-transit */}
          <div className="rounded border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-2">
            <span className="font-bold uppercase tracking-wide text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Truck className="size-3.5 text-indigo-400" />
              ĐẠO QUÂN ĐANG HÀNH QUÂN (IN-TRANSIT DEPLOYMENTS: {worldState.activeDeployments?.length || 0})
            </span>

            {(!worldState.activeDeployments || worldState.activeDeployments.length === 0) ? (
              <div className="rounded bg-zinc-900/40 p-4 text-center text-zinc-500 text-[11px]">
                Hiện không có đạo quân nào đang di chuyển trên các tuyến siêu không gian.
              </div>
            ) : (
              <div className="space-y-2">
                {worldState.activeDeployments.map((dep) => (
                  <div
                    key={dep.deploymentId}
                    className="flex flex-wrap items-center justify-between rounded border border-zinc-800 bg-zinc-900/40 p-2.5 text-[11px]"
                  >
                    <div>
                      <span className="font-bold text-zinc-200">
                        {dep.troopCount} quân ({dep.fromSectorId} &rarr; {dep.toSectorId})
                      </span>
                      <span className="text-zinc-400 ml-2">Lệnh: [{dep.order}]</span>
                    </div>
                    <span className="font-bold text-cyan-400">Còn {dep.remainingDays} ngày</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mạng lưới tuyến đường vận tải */}
          <div className="rounded border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-2">
            <span className="font-bold uppercase tracking-wide text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Route className="size-3.5 text-cyan-400" />
              MẠNG LƯỚI TUYẾN SIÊU KHÔNG GIAN ({worldState.routes.length})
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
              {worldState.routes.map((route) => (
                <div
                  key={route.id}
                  className="rounded border border-zinc-800/80 bg-zinc-900/40 p-2 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-200">{route.id}</span>
                    <span
                      className={cn(
                        "px-1 py-0.2 rounded text-[9px] font-bold uppercase border",
                        route.state === "open"
                          ? "border-emerald-500/40 text-emerald-300"
                          : route.state === "hazardous"
                          ? "border-amber-500/40 text-amber-300"
                          : "border-red-500/40 text-red-300"
                      )}
                    >
                      {route.state}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {route.fromSectorId} &harr; {route.toSectorId} ({route.distance} ngày · Nguy hiểm: {route.dangerLevel}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 5: TRUNG TÂM KẾT QUẢ KÉP (DUAL RESULTS HUB)
          ==================================================================== */}
      {activeTab === "results" && (
        <DualResultsHub worldState={worldState} onStateUpdated={reloadState} />
      )}

      {/* ====================================================================
          ADMIN CP & SETTINGS MODAL (PHASE 6.18: ISOLATED SETTINGS OVERLAY)
          ==================================================================== */}
      <AdminSettingsModal
        isOpen={isAdminSettingsOpen}
        onClose={() => setIsAdminSettingsOpen(false)}
        worldState={worldState}
        simulatorConfig={simulatorConfig}
        countdownSeconds={countdownSeconds}
        dayFraction={dayFraction}
        calendarInfo={calendarInfo}
        eventTierCounts={eventTierCounts}
        isTickAdvancing={isTickAdvancing}
        onTogglePause={handleTogglePause}
        onConfirmSpeedChange={handleConfirmSpeedChange}
        onConfirmResetWorld={handleConfirmResetWorld}
        onSaveGeneratorConfig={handleSaveGeneratorConfig}
        onResetGeneratorToDefault={handleResetGeneratorToDefault}
        onSaveStrategyPolicy={handleSaveStrategyPolicyConfig}
        onResetStrategyPolicyToDefault={handleResetStrategyPolicyToDefault}
        onBatchApplyStrategyPolicy={handleBatchApplyStrategyPolicy}
        onForceSpawnEvent={handleForceSpawnEvent}
        onFastForwardDays={handleFastForwardDays}
        onAdvanceTick={handleAdvanceTick}
        onManualSave={handleManualSave}
      />

      {/* MODAL ĐIỀU ĐỘNG QUÂN NHANH */}
      <QuickDispatchDock
        worldState={worldState}
        isOpen={isQuickDispatchOpen}
        onClose={() => setIsQuickDispatchOpen(false)}
        preselectedDestinationId={selectedSectorId}
        onDispatchComplete={(msg) => {
          setWorldState({ ...worldState })
          showToast(msg, "success")
        }}
      />

      {/* CHẾ ĐỘ BẢN ĐỒ TOÀN MÀN HÌNH (100vw/100vh FULLSCREEN OVERLAY) */}
      <WorldFullscreenOverlay
        isOpen={isFullscreenMapOpen}
        onClose={() => setIsFullscreenMapOpen(false)}
        worldState={worldState}
        selectedSectorId={selectedSectorId}
        onSelectSector={(secId) => setSelectedSectorId(secId)}
        onNavigateToSectorOperations={(secId) => {
          setSelectedSectorId(secId)
          setActiveTab("sectors")
        }}
        onDeployCombat={(secId) => {
          onDeployEncounter?.(secId)
        }}
        onUpdateWorldState={(newState) => {
          setWorldState({ ...newState })
        }}
      />
    </div>
  )
}
