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
import {
  batchApplyEventStrategyPolicy,
  evaluateAndApplyEventStrategyPolicy,
} from "@/lib/game/world/event-strategy-policy"
import { DualResultsHub } from "./dual-results-hub"
import { QuickDispatchDock } from "./quick-dispatch-dock"
import { WorldMap } from "./world-map"
import { WorldFullscreenOverlay } from "./world-fullscreen-overlay"
import { EventsMissionsBoard } from "./events-missions-board"
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

  // Dialogs & Form States
  const [isSpeedConfirmOpen, setIsSpeedConfirmOpen] = useState(false)
  const [pendingSpeed, setPendingSpeed] = useState<number | null>(null)
  const [resetWorldOnSpeedChange, setResetWorldOnSpeedChange] = useState<boolean>(false)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const [customSpeedInput, setCustomSpeedInput] = useState<string>("")
  const [generatorForm, setGeneratorForm] = useState(DEFAULT_SIMULATOR_CONFIG.generator)
  const [strategyPolicyForm, setStrategyPolicyForm] = useState<EventStrategyPolicyConfig>(
    DEFAULT_EVENT_STRATEGY_POLICY
  )

  // Nạp WorldState & Simulator Config từ Storage khi mount + Offline Catch-up
  useEffect(() => {
    const cfg = loadSimulatorConfig()
    setSimulatorConfig(cfg)
    setGeneratorForm(cfg.generator)
    if (cfg.strategyPolicy) {
      setStrategyPolicyForm(cfg.strategyPolicy)
    }
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

  // Yêu cầu đổi tốc độ ngày game (mở modal xác nhận)
  const handleRequestSpeedChange = (newSpeed: number) => {
    if (newSpeed === simulatorConfig.speedSeconds) return
    playClickSound()
    setPendingSpeed(newSpeed)
    setResetWorldOnSpeedChange(false)
    setIsSpeedConfirmOpen(true)
  }

  // Xác nhận đổi tốc độ (bảo lưu tiến độ thế giới hoặc reset world tùy chọn)
  const handleConfirmSpeedChange = () => {
    if (!pendingSpeed) return
    playClickSound()
    const updated: WorldSimulatorConfig = {
      ...simulatorConfig,
      speedSeconds: pendingSpeed,
      pausedFraction: undefined,
    }
    setSimulatorConfig(updated)
    saveSimulatorConfig(updated)

    if (resetWorldOnSpeedChange) {
      // Đổi tốc độ kèm reset World theo yêu cầu người dùng
      const freshState = resetWorldState()
      setWorldState(freshState)
      lastTickTimeRef.current = Date.now()
      setDayFraction(0)
      setCountdownSeconds(pendingSpeed)
      showToast(`Đã chuyển tốc độ sang ${pendingSpeed}s/ngày và RESET WORLD về Ngày 1!`, "success")
    } else {
      // Điều chỉnh mốc thời gian mượt mà, bảo toàn tỷ lệ fraction hiện tại
      const newSpeedMs = pendingSpeed * 1000
      lastTickTimeRef.current = Date.now() - dayFraction * newSpeedMs
      setCountdownSeconds(Math.max(1, Math.ceil((1 - dayFraction) * pendingSpeed)))
      showToast(`Đã chuyển tốc độ mô phỏng sang 1 Ngày = ${pendingSpeed} giây thực!`, "success")
    }

    setIsSpeedConfirmOpen(false)
    setPendingSpeed(null)
    setResetWorldOnSpeedChange(false)
    playLevelUpSound()
  }

  // Hủy đổi tốc độ
  const handleCancelSpeedChange = () => {
    playClickSound()
    setIsSpeedConfirmOpen(false)
    setPendingSpeed(null)
    setResetWorldOnSpeedChange(false)
  }

  // Áp dụng tốc độ tùy chỉnh từ input
  const handleApplyCustomSpeed = () => {
    const parsed = parseInt(customSpeedInput.trim(), 10)
    if (isNaN(parsed) || parsed <= 0 || parsed > 86400) {
      showToast("Tốc độ tùy chỉnh phải là số nguyên dương từ 1 đến 86,400 giây.", "error")
      return
    }
    handleRequestSpeedChange(parsed)
    setCustomSpeedInput("")
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
    setGeneratorForm(DEFAULT_GENERATOR_CONFIG)
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
    setIsResetConfirmOpen(false)
    playLevelUpSound()
    showToast(`Đã RESET toàn bộ dữ liệu STARFRONT WORLD về Ngày 1! (Tốc độ ${simulatorConfig.speedSeconds}s giữ nguyên)`, "success")
  }

  // Lưu cấu hình Generator từ form
  const handleSaveGeneratorForm = () => {
    playClickSound()
    const candidateConfig: WorldSimulatorConfig = {
      ...simulatorConfig,
      generator: generatorForm,
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

  // Phase 6.15: Lưu cấu hình chính sách chiến lược sự kiện
  const handleSaveStrategyPolicy = () => {
    playClickSound()
    const updatedConfig: WorldSimulatorConfig = {
      ...simulatorConfig,
      strategyPolicy: strategyPolicyForm,
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

  // Phase 6.15: Khôi phục chính sách chiến lược mặc định
  const handleResetStrategyPolicyToDefault = () => {
    playClickSound()
    setStrategyPolicyForm({ ...DEFAULT_EVENT_STRATEGY_POLICY })
    showToast("Đã khôi phục chính sách chiến lược về mặc định ban đầu.", "info")
  }

  // Phase 6.15: Áp dụng chính sách cho tất cả sự kiện INIT đang chờ
  const handleBatchApplyStrategyPolicy = () => {
    if (!worldState) return
    playClickSound()
    const batchRes = batchApplyEventStrategyPolicy(worldState, strategyPolicyForm)
    saveWorldState(worldState)
    setWorldState({ ...worldState })
    playLevelUpSound()
    showToast(
      `Đã áp dụng chính sách: ${batchRes.autoProcessedCount} System Auto, ${batchRes.defaultFallbackCount} Default Fallback, ${batchRes.playerChoiceCount} Chờ chỉ huy.`,
      "success"
    )
  }

  // Thông tin Niên lịch & Đồng hồ
  const calendarInfo = useMemo(() => {
    return getGameCalendarInfo(worldState?.currentDay || 1, dayFraction)
  }, [worldState?.currentDay, dayFraction])

  // Thống kê active events theo tier
  const eventTierCounts = useMemo(() => {
    if (!worldState) return { small: 0, medium: 0, large: 0, total: 0 }
    return countActiveEventsByTier(worldState)
  }, [worldState])

  // Sự kiện có hạn chót gần nhất
  const nearestDeadlineEvent = useMemo(() => {
    if (!worldState?.events) return null
    const active = Object.values(worldState.events).filter(
      (e) => e.status === "INIT" || e.status === "PROCESSING"
    )
    if (!active.length) return null
    return active.sort((a, b) => a.decisionDeadlineTick - b.decisionDeadlineTick)[0]
  }, [worldState?.events])

  // Sự kiện khẩn cấp cần chú ý
  const urgentAttentionEvent = useMemo(() => {
    if (!worldState?.events) return null
    const active = Object.values(worldState.events).filter(
      (e) => e.status === "INIT" || e.status === "PROCESSING"
    )
    const critical = active.find((e) => e.severity === "critical")
    if (critical) return critical
    return active.find((e) => e.decisionDeadlineTick <= (worldState?.currentDay || 1) + 1) || null
  }, [worldState])

  // Đồng bộ activeTab khi nhận prop initialTab từ Navigation ngoài
  useEffect(() => {
    if (initialTab) {
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
          A. HEADER TỔNG HÀNH DINH (OPERATIONS CENTER COMMAND BAR)
          ==================================================================== */}
      <header className="rounded border border-cyan-500/40 bg-zinc-950/90 p-4 shadow-xl shadow-cyan-950/30 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-2 rounded-full bg-cyan-400 animate-ping" />
              <h1 className="font-display text-base sm:text-lg font-black tracking-wider text-cyan-300 uppercase">
                TỔNG HÀNH DINH TÁC CHIẾN // OPERATIONS CENTER
              </h1>
              <span className="rounded bg-cyan-950/70 px-2 py-0.5 text-[10px] text-cyan-300 font-bold border border-cyan-500/50">
                PHASE 6.8 LIVE
              </span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">
              Trung tâm điều phối chiến lược thiên hà STARFRONT WORLD · Bộ Chỉ Huy Liên Minh VSS
            </p>
          </div>

          {/* Quick Metrics & Global Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-2 rounded border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-[11px]">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-cyan-400" />
                <span className="font-bold text-cyan-300">NGÀY #{worldState.currentDay}</span>
                <span className="text-zinc-400 text-[10px]">({calendarInfo.formattedDate})</span>
              </div>
              <span className="text-zinc-600">·</span>
              <div className="flex items-center gap-1 text-[10px]" title={calendarInfo.cycleDesc}>
                <span className={cn("font-bold", calendarInfo.cycleColor)}>
                  {calendarInfo.timeString} [{calendarInfo.cycleName}]
                </span>
                <span>{calendarInfo.seasonIcon}</span>
              </div>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400 text-[10px]">KIỂM SOÁT:</span>
              <span className="font-bold text-emerald-400 text-[10px]">{vssCount}/{sectorsList.length} VSS</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400 text-[10px]">THREAT TB:</span>
              <span
                className={cn(
                  "font-bold text-[10px]",
                  avgThreat >= 700 ? "text-red-400" : avgThreat >= 400 ? "text-amber-400" : "text-cyan-400"
                )}
              >
                {avgThreat}/1000
              </span>
            </div>

            {/* Action Buttons */}
            {/* 0. Nút Play / Pause Simulator */}
            <button
              type="button"
              onClick={handleTogglePause}
              className={cn(
                "flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm",
                simulatorConfig.isPaused
                  ? "border-amber-500/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50"
                  : "border-emerald-500/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50"
              )}
              title={simulatorConfig.isPaused ? "Tiếp tục chạy thời gian thực" : "Tạm dừng mô phỏng"}
            >
              {simulatorConfig.isPaused ? (
                <Play className="size-3.5 fill-current text-amber-400" />
              ) : (
                <Pause className="size-3.5 text-emerald-400" />
              )}
              <span>{simulatorConfig.isPaused ? "Tiếp Tục" : "Tạm Dừng"}</span>
            </button>

            {/* Đếm ngược ngày tiếp theo */}
            <div
              className="flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs font-mono text-zinc-300"
              title={`Tốc độ hiện tại: 1 Ngày = ${simulatorConfig.speedSeconds}s thực`}
            >
              <Clock className="size-3.5 text-cyan-400" />
              <span className="text-zinc-500 text-[10px]">Kế tiếp:</span>
              <span className={cn("font-bold text-xs", simulatorConfig.isPaused ? "text-amber-400" : "text-cyan-300")}>
                {simulatorConfig.isPaused ? "PAUSED" : `${countdownSeconds}s`}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                playClickSound()
                setIsFullscreenMapOpen(true)
              }}
              className="flex items-center gap-1.5 rounded border border-cyan-500/60 bg-cyan-950/40 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50 hover:text-white transition-all cursor-pointer shadow-sm shadow-cyan-950/40"
              title="Mở Bản Đồ Toàn Màn Hình (100vw/100vh)"
            >
              <Orbit className="size-3.5 text-cyan-400" />
              <span>Bản Đồ Fullscreen</span>
            </button>

            <button
              type="button"
              onClick={handleAdvanceTick}
              disabled={isTickAdvancing}
              className={cn(
                "flex items-center gap-1.5 rounded border border-cyan-400 bg-cyan-600/30 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-600/50 hover:text-white transition-all cursor-pointer shadow-sm shadow-cyan-900/50",
                isTickAdvancing && "opacity-50 cursor-wait"
              )}
              title="Thực thi một chu kỳ chiến lược 6 Phase tất định (+1 Ngày thủ công)"
            >
              <Play className="size-3.5 fill-current" />
              <span>{isTickAdvancing ? "Đang Tính Toán..." : "+1 Ngày"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsQuickDispatchOpen(true)}
              className="flex items-center gap-1.5 rounded border border-amber-500/50 bg-amber-950/40 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-900/50 transition-colors cursor-pointer"
              title="Mở bến điều động chi viện quân sự nhanh"
            >
              <Zap className="size-3.5 text-amber-400" />
              <span>Điều Quân Nhanh</span>
            </button>

            <button
              type="button"
              onClick={handleManualSave}
              className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
              title="Lưu trạng thái an toàn vào STARFRONT_WORLD_SAVE_V1"
            >
              <Save className="size-3.5 text-zinc-400" />
              <span>Lưu</span>
            </button>
          </div>
        </div>

        {/* Global Resource Bar */}
        <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-5 gap-2 border-t border-zinc-800/80 pt-3 text-[11px]">
          <div className="flex items-center gap-2 rounded bg-zinc-900/60 p-1.5 border border-zinc-800/60">
            <Boxes className="size-3.5 text-cyan-400 shrink-0" />
            <div>
              <div className="text-[10px] text-zinc-400">Vật Liệu Công Nghiệp</div>
              <div className="font-bold text-zinc-100">{worldState.resources.industrialMaterials}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded bg-zinc-900/60 p-1.5 border border-zinc-800/60">
            <Zap className="size-3.5 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-zinc-400">Năng Lượng Plasma</div>
              <div className="font-bold text-zinc-100">{worldState.resources.energy}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded bg-zinc-900/60 p-1.5 border border-zinc-800/60">
            <Truck className="size-3.5 text-indigo-400 shrink-0" />
            <div>
              <div className="text-[10px] text-zinc-400">Vật Tư Hậu Cần</div>
              <div className="font-bold text-zinc-100">{worldState.resources.logisticsSupplies}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded bg-zinc-900/60 p-1.5 border border-zinc-800/60">
            <Database className="size-3.5 text-purple-400 shrink-0" />
            <div>
              <div className="text-[10px] text-zinc-400">Dữ Liệu Tác Chiến</div>
              <div className="font-bold text-zinc-100">{worldState.resources.tacticalData}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded bg-emerald-950/20 p-1.5 border border-emerald-500/30 col-span-2 sm:col-span-1">
            <Wheat className="size-3.5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-emerald-400 font-bold">Lương Thực Dân Sinh</div>
              <div className="font-bold text-emerald-300">{worldState.resources.food}</div>
            </div>
          </div>
        </div>

        {/* Thông báo Toast */}
        {notification && (
          <div
            className={cn(
              "mt-3 flex items-center justify-between rounded p-2 text-[11px] animate-fadeIn border",
              notification.type === "success" && "border-emerald-500/50 bg-emerald-950/40 text-emerald-200",
              notification.type === "error" && "border-red-500/50 bg-red-950/40 text-red-200",
              notification.type === "info" && "border-cyan-500/50 bg-cyan-950/40 text-cyan-200"
            )}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 shrink-0" />
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
      </header>

      {/* ====================================================================
          B. NAVIGATION TABS (5 PHÂN KHU CHỨC NĂNG CHIẾN LƯỢC)
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
          {
            id: "admin",
            label: "ADMIN CP",
            icon: Sliders,
            badge: simulatorConfig.isPaused ? "Paused" : `${simulatorConfig.speedSeconds}s`,
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
          TAB 6: ADMIN CP — QUẢN TRỊ VIÊN & CẤU HÌNH THỜI GIAN THỰC (PHASE 6.13)
          ==================================================================== */}
      {activeTab === "admin" && (
        <div className="space-y-4">
          {/* Header Banner & Status Summary */}
          <div className="rounded border border-amber-500/50 bg-zinc-950/90 p-4 shadow-xl shadow-amber-950/20">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded bg-amber-950/70 border border-amber-500/50 text-amber-300">
                  <Sliders className="size-4" />
                </div>
                <div>
                  <h2 className="font-display text-sm sm:text-base font-black tracking-wider text-amber-300 uppercase">
                    BẢNG ĐIỀU KHIỂN QUẢN TRỊ VIÊN // STARFRONT WORLD ADMIN CP
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Cấu hình nhịp độ thời gian thực, bộ sinh Event/Quest và quản trị lưu trữ thế giới độc lập
                  </p>
                </div>
              </div>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold border font-mono",
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
                  <span>{simulatorConfig.isPaused ? "TẠM DỪNG (PAUSED)" : "ĐANG CHẠY (RUNNING)"}</span>
                </span>

                <button
                  type="button"
                  onClick={handleTogglePause}
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
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-[11px]">
              <div className="rounded bg-zinc-900/60 p-2 border border-zinc-800">
                <div className="text-zinc-500 text-[10px] uppercase font-bold">Tốc Độ Hiện Tại</div>
                <div className="font-mono font-black text-cyan-300 text-sm">
                  1 Ngày = {simulatorConfig.speedSeconds}s
                </div>
              </div>

              <div className="rounded bg-zinc-900/60 p-2 border border-zinc-800">
                <div className="text-zinc-500 text-[10px] uppercase font-bold">Kế Tiếp Sau</div>
                <div className="font-mono font-black text-amber-300 text-sm">
                  {simulatorConfig.isPaused ? "ĐÃ TẠM DỪNG" : `${countdownSeconds} giây`}
                </div>
              </div>

              <div className="rounded bg-zinc-900/60 p-2 border border-zinc-800">
                <div className="text-zinc-500 text-[10px] uppercase font-bold">Niên Lịch & Buổi</div>
                <div className="font-mono font-bold text-zinc-200 truncate">
                  {calendarInfo.timeString} · {calendarInfo.cycleName} ({calendarInfo.seasonIcon})
                </div>
              </div>

              <div className="rounded bg-zinc-900/60 p-2 border border-zinc-800">
                <div className="text-zinc-500 text-[10px] uppercase font-bold">Sự Kiện Đang Chạy</div>
                <div className="font-mono font-bold text-cyan-300">
                  {eventTierCounts.total} / {simulatorConfig.generator.maxGlobalActive} (N:{eventTierCounts.small} · V:{eventTierCounts.medium} · L:{eventTierCounts.large})
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================
              KHỐI 1: CẤU HÌNH TỐC ĐỘ THỜI GIAN THỰC (SIMULATION SPEED)
              ================================================================ */}
          <div className="rounded border border-zinc-800 bg-zinc-950/80 p-4 space-y-3.5 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase text-cyan-300 tracking-wider">
                  1. Cấu Hình Tốc Độ Mô Phỏng Thời Gian Thực (Simulation Speed)
                </h3>
              </div>
              <span className="text-[10px] text-zinc-400">
                Mặc định chuẩn: 300 giây/ngày (5 phút) · 15 giây/ngày là chế độ test nhanh
              </span>
            </div>

            <div className="space-y-3">
              {/* Preset Buttons */}
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
                        onClick={() => handleRequestSpeedChange(preset.sec)}
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

              {/* Tùy chỉnh giây (Custom Speed Input) */}
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

          {/* ================================================================
              KHỐI 2: CẤU HÌNH TỰ ĐỘNG SINH SỰ KIỆN & NHIỆM VỤ (WORLD GENERATOR)
              ================================================================ */}
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
                            medium: { ...generatorForm.medium, minIntervalDays: parseFloat(e.target.value) || 1 },
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

            {/* Action Buttons for Generator Config */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={handleResetGeneratorToDefault}
                className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3.5 text-zinc-400" />
                <span>Khôi Phục Mặc Định</span>
              </button>

              <button
                type="button"
                onClick={handleSaveGeneratorForm}
                className="flex items-center gap-1.5 rounded border border-cyan-400 bg-cyan-600/40 px-3.5 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-600/60 hover:text-white transition-all cursor-pointer shadow-md shadow-cyan-950/50"
              >
                <Save className="size-3.5" />
                <span>Lưu Cấu Hình Generator</span>
              </button>
            </div>
          </div>

          {/* ================================================================
              KHỐI 3: CẤU HÌNH CHÍNH SÁCH CHIẾN LƯỢC SỰ KIỆN (STRATEGY POLICY)
              ================================================================ */}
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

            {/* Action Buttons for Strategy Policy */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={handleBatchApplyStrategyPolicy}
                className="flex items-center gap-1.5 rounded border border-cyan-500/60 bg-cyan-950/60 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900/60 transition-colors cursor-pointer"
                title="Đánh giá và phê chuẩn ngay cho tất cả các sự kiện INIT đang chờ"
              >
                <Zap className="size-3.5 text-cyan-400" />
                <span>Áp Dụng Cho Tất Cả Sự Kiện Chờ</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetStrategyPolicyToDefault}
                  className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="size-3.5 text-zinc-400" />
                  <span>Khôi Phục Mặc Định</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveStrategyPolicy}
                  className="flex items-center gap-1.5 rounded border border-cyan-400 bg-cyan-600/40 px-3.5 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-600/60 hover:text-white transition-all cursor-pointer shadow-md shadow-cyan-950/50"
                >
                  <Save className="size-3.5" />
                  <span>Lưu Chính Sách Chiến Lược</span>
                </button>
              </div>
            </div>
          </div>

          {/* ================================================================
              KHỐI 4: KÍCH HOẠT THỬ NGHIỆM & LỆNH NHANH (DEV TRIGGERS)
              ================================================================ */}
          <div className="rounded border border-zinc-800 bg-zinc-950/80 p-4 space-y-3.5 shadow-md">
            <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2.5">
              <Zap className="size-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase text-amber-300 tracking-wider">
                4. Thao Tác Kích Hoạt Thử Nghiệm Nhanh (Dev & Testing Actions)
              </h3>
            </div>

            {/* Hàng 1: Kích hoạt sinh sự kiện ngay lập tức */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-zinc-400 font-bold block">
                Kích Hoạt Sinh Sự Kiện Ngay Lập Tức (Manual Spawn Event):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleForceSpawnEvent("small")}
                  className="flex items-center justify-center gap-2 rounded border border-cyan-500/50 bg-cyan-950/40 p-2 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50 transition-colors cursor-pointer"
                >
                  <Sparkles className="size-3.5 text-cyan-400" />
                  <span>Sinh Sự Kiện Nhỏ (Small)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleForceSpawnEvent("medium")}
                  className="flex items-center justify-center gap-2 rounded border border-amber-500/50 bg-amber-950/40 p-2 text-xs font-bold text-amber-300 hover:bg-amber-900/50 transition-colors cursor-pointer"
                >
                  <Flame className="size-3.5 text-amber-400" />
                  <span>Sinh Sự Kiện Vừa (Medium)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleForceSpawnEvent("large")}
                  className="flex items-center justify-center gap-2 rounded border border-rose-500/50 bg-rose-950/40 p-2 text-xs font-bold text-rose-300 hover:bg-rose-900/50 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="size-3.5 text-rose-400" />
                  <span>Sinh Sự Kiện Lớn (Large)</span>
                </button>
              </div>
            </div>

            {/* Hàng 2: Tua thời gian nhanh */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
              <label className="text-[11px] text-zinc-400 font-bold block">
                Tua Thời Gian Nhanh (Time Acceleration & Multi-Tick):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={handleAdvanceTick}
                  disabled={isTickAdvancing}
                  className="flex items-center justify-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 p-2 text-xs font-bold text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <Play className="size-3 fill-current text-cyan-400" />
                  <span>+1 Ngày</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFastForwardDays(5)}
                  disabled={isTickAdvancing}
                  className="flex items-center justify-center gap-1.5 rounded border border-cyan-500/40 bg-zinc-900/60 p-2 text-xs font-bold text-cyan-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <ArrowRight className="size-3 text-cyan-400" />
                  <span>Tua +5 Ngày</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFastForwardDays(10)}
                  disabled={isTickAdvancing}
                  className="flex items-center justify-center gap-1.5 rounded border border-cyan-500/40 bg-zinc-900/60 p-2 text-xs font-bold text-cyan-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <ArrowRight className="size-3 text-cyan-400" />
                  <span>Tua +10 Ngày</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFastForwardDays(30)}
                  disabled={isTickAdvancing}
                  className="flex items-center justify-center gap-1.5 rounded border border-amber-500/50 bg-amber-950/30 p-2 text-xs font-bold text-amber-300 hover:bg-amber-900/40 transition-colors cursor-pointer"
                >
                  <Calendar className="size-3 text-amber-400" />
                  <span>Tua +30 Ngày (1 Tháng)</span>
                </button>
              </div>
            </div>
          </div>

          {/* ================================================================
              KHỐI 4: QUẢN TRỊ TRẠNG THÁI LƯU TRỮ & RESET THẾ GIỚI (STORAGE & RESET)
              ================================================================ */}
          <div className="rounded border border-zinc-800 bg-zinc-950/80 p-4 space-y-3.5 shadow-md">
            <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2.5">
              <Database className="size-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase text-cyan-300 tracking-wider">
                4. Quản Trị Trạng Thái Lưu Trữ & Reset Thế Giới
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Cột 1: Thông tin Save Slot & Checksum */}
              <div className="rounded border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
                <div className="text-[11px] font-bold text-zinc-300 uppercase">
                  Thông Tin Khóa Lưu Trữ Cách Ly (Isolated Storage)
                </div>
                <div className="space-y-1 text-[10px] text-zinc-400 font-mono">
                  <div>&bull; Khóa dữ liệu: <strong className="text-cyan-300">STARFRONT_WORLD_SAVE_V1</strong></div>
                  <div>&bull; Khóa cấu hình: <strong className="text-cyan-300">STARFRONT_WORLD_SIMULATOR_CONFIG</strong></div>
                  <div>&bull; Cơ chế sao lưu: <span className="text-emerald-400 font-bold">A/B Rotating Slot (Slot A / Slot B)</span></div>
                  <div>&bull; Kiểm tra toàn vẹn: <span className="text-emerald-400 font-bold">CRC32 Checksum Verified</span></div>
                  <div>&bull; Cách ly RPG Save V4: <span className="text-cyan-300 font-bold">100% Độc Lập</span></div>
                </div>

                <button
                  type="button"
                  onClick={handleManualSave}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 rounded border border-cyan-500/50 bg-cyan-950/40 p-2 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50 transition-colors cursor-pointer"
                >
                  <Save className="size-3.5" />
                  <span>Lưu Trạng Thái Thế Giới Ngay Bây Giờ</span>
                </button>
              </div>

              {/* Cột 2: Danger Zone — Reset World */}
              <div className="rounded border border-red-500/50 bg-red-950/20 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-300 uppercase">
                  <ShieldAlert className="size-4 text-red-400" />
                  <span>Vùng Nguy Hiểm // Reset Toàn Bộ Thế Giới</span>
                </div>

                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Hành động này sẽ xóa toàn bộ dữ liệu chiến lược của STARFRONT WORLD, đặt lại 8 sector, tài nguyên và xóa toàn bộ sự kiện để quay về Ngày 1.
                </p>

                <p className="text-[10px] text-emerald-400/90 font-bold">
                  Bảo đảm an toàn: Tiến trình RPG (Phi công, cấp độ, trang bị, kho đồ, ải chiến dịch) KHÔNG bị ảnh hưởng.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound()
                    setIsResetConfirmOpen(true)
                  }}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 rounded border border-red-500 bg-red-600/30 p-2 text-xs font-bold text-red-200 hover:bg-red-600/50 hover:text-white transition-all cursor-pointer shadow-md shadow-red-950/50"
                >
                  <Trash2 className="size-3.5" />
                  <span>RESET TOÀN BỘ WORLD VỀ NGÀY 1</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 1: XÁC NHẬN ĐỔI TỐC ĐỘ THỜI GIAN THỰC (SPEED CONFIRM DIALOG)
          ==================================================================== */}
      {isSpeedConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
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
                onClick={handleCancelSpeedChange}
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
                  id="resetWorldOnSpeedChangeCb"
                  checked={resetWorldOnSpeedChange}
                  onChange={(e) => setResetWorldOnSpeedChange(e.target.checked)}
                  className="size-3.5 rounded border-zinc-700 bg-zinc-950 text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <label
                  htmlFor="resetWorldOnSpeedChangeCb"
                  className="text-[11px] text-zinc-300 cursor-pointer select-none"
                >
                  Đồng thời Reset WORLD về Ngày 1 (Bắt đầu chu kỳ mô phỏng mới)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleCancelSpeedChange}
                className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmSpeedChange}
                className="rounded border border-cyan-400 bg-cyan-600/40 px-4 py-1.5 text-xs font-bold text-cyan-100 hover:bg-cyan-600/70 transition-colors cursor-pointer shadow-md shadow-cyan-950/60"
              >
                Xác Nhận Đổi Tốc Độ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: XÁC NHẬN NGUY HIỂM RESET WORLD VỀ NGÀY 1 (DANGER DIALOG)
          ==================================================================== */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fadeIn">
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
                <div>&bull; Tốc độ cấu hình ({simulatorConfig.speedSeconds}s/ngày) sẽ được giữ nguyên.</div>
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
                onClick={handleConfirmResetWorld}
                className="rounded border border-red-500 bg-red-600 px-4 py-1.5 text-xs font-black text-white hover:bg-red-700 transition-colors cursor-pointer shadow-lg shadow-red-950/80"
              >
                Xác Nhận Reset Toàn Bộ World
              </button>
            </div>
          </div>
        </div>
      )}

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
