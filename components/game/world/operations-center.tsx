"use client"

import { useEffect, useState, useMemo } from "react"
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Boxes,
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
  Play,
  RefreshCw,
  Route,
  Save,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
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
} from "@/lib/game/world/event-engine"
import {
  setSectorStrategicOrder,
  upgradeSectorFortification,
  calculateTotalMilitaryForce,
} from "@/lib/game/world/forces-ledger"
import { DualResultsHub } from "./dual-results-hub"
import { QuickDispatchDock } from "./quick-dispatch-dock"
import type {
  WorldState,
  WorldSector,
  StrategicOrder,
  WorldEvent,
  EventStrategy,
} from "@/lib/game/world/types"

export type OperationsTab =
  | "overview"
  | "sectors"
  | "events"
  | "military"
  | "results"

interface OperationsCenterProps {
  initialTab?: OperationsTab
  onNavigateSection?: (section: any) => void
  onDeployEncounter?: (sectorId: string) => void
}

export function OperationsCenter({
  initialTab = "overview",
  onNavigateSection,
  onDeployEncounter,
}: OperationsCenterProps) {
  const [worldState, setWorldState] = useState<WorldState | null>(null)
  const [activeTab, setActiveTab] = useState<OperationsTab>(initialTab)
  const [selectedSectorId, setSelectedSectorId] = useState<string>("sol_command_hq")
  const [isQuickDispatchOpen, setIsQuickDispatchOpen] = useState(false)
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)
  const [isTickAdvancing, setIsTickAdvancing] = useState(false)
  const [lastTickLogs, setLastTickLogs] = useState<string[]>([])

  // Nạp WorldState từ Storage khi mount
  useEffect(() => {
    const loadRes = loadWorldState()
    setWorldState(loadRes.state)
  }, [])

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
      saveWorldState(worldState)
      setWorldState({ ...worldState })
      playShieldSound()

      const summaryLogs = tickRes.phaseLogs.flatMap((p) => p.changesApplied)
      setLastTickLogs(summaryLogs.slice(0, 8))
      showToast(`Chiến lược đã bước sang Ngày ${worldState.currentDay}! (${summaryLogs.length} biến động được ghi nhận)`, "success")
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
            <div className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-[11px]">
              <span className="text-zinc-400">NGÀY:</span>
              <span className="font-bold text-cyan-400 text-sm">#{worldState.currentDay}</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400">KIỂM SOÁT:</span>
              <span className="font-bold text-emerald-400">{vssCount}/{sectorsList.length} VSS</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400">THREAT TB:</span>
              <span
                className={cn(
                  "font-bold",
                  avgThreat >= 700 ? "text-red-400" : avgThreat >= 400 ? "text-amber-400" : "text-cyan-400"
                )}
              >
                {avgThreat}/1000
              </span>
            </div>

            {/* Action Buttons */}
            <button
              type="button"
              onClick={handleAdvanceTick}
              disabled={isTickAdvancing}
              className={cn(
                "flex items-center gap-1.5 rounded border border-cyan-400 bg-cyan-600/30 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-600/50 hover:text-white transition-all cursor-pointer shadow-sm shadow-cyan-900/50",
                isTickAdvancing && "opacity-50 cursor-wait"
              )}
              title="Thực thi một chu kỳ chiến lược 6 Phase tất định (1 Ngày)"
            >
              <Play className="size-3.5 fill-current" />
              <span>{isTickAdvancing ? "Đang Tính Toán..." : "Tiến 1 Ngày"}</span>
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
          B. NAVIGATION TABS (5 PHÂN KHU CHỨC NĂNG)
          ==================================================================== */}
      <nav className="flex flex-wrap items-center gap-1.5 border-b border-zinc-800 pb-2">
        {[
          { id: "overview", label: "Tình Hình Chiến Lược", icon: Activity },
          { id: "sectors", label: "Mạng Lưới Sector", icon: Globe2 },
          {
            id: "events",
            label: "Sự Kiện & Nhiệm Vụ",
            icon: Flame,
            badge: activeEventsList.length > 0 ? `${activeEventsList.length}` : null,
          },
          { id: "military", label: "Quân Sự & Hậu Cần", icon: Swords },
          {
            id: "results",
            label: "Trung Tâm Kết Quả Kép",
            icon: Layers,
            badge: worldState.eventResultsArchive?.some((r) => !r.isRead) ? "Mới" : null,
          },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
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
                <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] text-amber-300 border border-amber-500/40 font-bold">
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
          TAB 2: MẠNG LƯỚI SECTOR (SECTOR OPERATIONS & INSPECTOR)
          ==================================================================== */}
      {activeTab === "sectors" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Cột trái 2/3: Danh sách các Sector */}
          <div className="lg:col-span-2 space-y-2.5">
            <div className="flex items-center justify-between text-zinc-400 text-[11px]">
              <span className="font-bold uppercase tracking-wide">
                DANH SÁCH 7 SECTOR THIÊN HÀ ({sectorsList.length})
              </span>
              <span>Bấm vào sector để mở bảng điều khiển chi tiết</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sectorsList.map((sector) => {
                const isSelected = selectedSectorId === sector.id
                const isLocked = !!sector.isLockedForCombat
                return (
                  <div
                    key={sector.id}
                    onClick={() => {
                      playClickSound()
                      setSelectedSectorId(sector.id)
                    }}
                    className={cn(
                      "p-3 rounded border transition-all cursor-pointer relative",
                      isSelected
                        ? "border-cyan-400 bg-cyan-950/30 shadow-md shadow-cyan-950/40"
                        : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/60"
                    )}
                  >
                    {/* Header sector card */}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-100 text-xs">{sector.name}</span>
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded text-[10px] font-bold uppercase border",
                          sector.sovereignty === "vss"
                            ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                            : sector.sovereignty === "void"
                            ? "border-red-500/40 bg-red-950/40 text-red-300"
                            : "border-amber-500/40 bg-amber-950/40 text-amber-300"
                        )}
                      >
                        {sector.sovereignty.toUpperCase()}
                      </span>
                    </div>

                    {/* Threat & Stability Bars */}
                    <div className="mt-2.5 space-y-1.5 text-[10px]">
                      <div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Threat:</span>
                          <span className="font-bold text-amber-400">{sector.threatLevel}/1000</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden mt-0.5">
                          <div
                            className="h-full bg-amber-500"
                            style={{ width: `${Math.min(100, (sector.threatLevel / 1000) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Stability:</span>
                          <span className="font-bold text-emerald-400">{sector.stability}/100</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden mt-0.5">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${sector.stability}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer tags */}
                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-zinc-400 border-t border-zinc-800/80 pt-2">
                      <span>Đồn trú: <strong className="text-zinc-200">{sector.garrisonPower}</strong></span>
                      <span>Giai đoạn: <strong className="text-cyan-300 uppercase">{sector.stage}</strong></span>
                      {isLocked && (
                        <span className="flex items-center gap-1 text-red-400 font-bold">
                          <Lock className="size-3" /> Khóa Combat
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cột phải 1/3: Inspector chi tiết Sector được chọn */}
          <div className="rounded border border-cyan-500/40 bg-zinc-950/90 p-4 space-y-3.5">
            {selectedSector ? (
              <>
                <div className="border-b border-zinc-800 pb-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold uppercase text-xs">
                      CHI TIẾT SECTOR: {selectedSector.name}
                    </span>
                    <span className="text-zinc-500 font-mono text-[10px]">ID: {selectedSector.id}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-400">{selectedSector.description}</p>
                </div>

                {/* Banners cảnh báo khóa Combat */}
                {selectedSector.isLockedForCombat && (
                  <div className="rounded border border-red-500/60 bg-red-950/30 p-2.5 text-[11px] text-red-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Lock className="size-3.5 text-red-400" />
                      <span>ĐANG KHÓA TRẬN CHIẾN (COMBAT LOCKED)</span>
                    </div>
                    <p className="text-[10px] text-red-300/80">
                      Sector này đang giao tranh với buồng lái. Lực lượng đồn trú bị đóng băng để bảo toàn dữ liệu.
                    </p>
                  </div>
                )}

                {/* Các chỉ số chi tiết */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-900/40 p-2.5 rounded border border-zinc-800">
                  <div>
                    <span className="text-zinc-400">Chủ quyền:</span>{" "}
                    <strong className="text-zinc-200 uppercase">{selectedSector.sovereignty}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400">Giai đoạn:</span>{" "}
                    <strong className="text-cyan-300 uppercase">{selectedSector.stage}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400">Quân đồn trú:</span>{" "}
                    <strong className="text-zinc-200">{selectedSector.garrisonPower} quân</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400">Công sự:</span>{" "}
                    <strong className="text-amber-400">Cấp {selectedSector.fortificationLevel ?? 1}/5</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400">Dân số:</span>{" "}
                    <strong className="text-zinc-200">{selectedSector.population.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400">Lương thực tồn:</span>{" "}
                    <strong className="text-emerald-400">{selectedSector.resources.food}</strong>
                  </div>
                </div>

                {/* Tác vụ 1: Lệnh Chiến Lược */}
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wide">
                    Lệnh Chiến Lược Đồn Trú (Strategic Order)
                  </label>
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-[11px]">
                    {(["normal", "defend", "reinforce", "attack", "recover"] as StrategicOrder[]).map((ord) => (
                      <button
                        key={ord}
                        type="button"
                        onClick={() => handleSetStrategicOrder(selectedSector.id, ord)}
                        className={cn(
                          "p-1.5 rounded border font-bold uppercase transition-colors cursor-pointer text-center",
                          (selectedSector.strategicOrder || "normal") === ord
                            ? "border-cyan-400 bg-cyan-950/60 text-cyan-300"
                            : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200"
                        )}
                      >
                        {ord === "normal" && "Bình Thường"}
                        {ord === "defend" && "Cố Thủ"}
                        {ord === "reinforce" && "Tập Kết"}
                        {ord === "attack" && "Phản Công"}
                        {ord === "recover" && "Hồi Phục"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tác vụ 2: Nâng cấp công sự */}
                <div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-zinc-300 uppercase">Gia Cố Công Sự</span>
                    <span className="text-zinc-400">Chi phí: 50 Materials</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpgradeFortification(selectedSector.id)}
                    disabled={(selectedSector.fortificationLevel || 1) >= 5 || worldState.resources.industrialMaterials < 50}
                    className={cn(
                      "mt-1.5 w-full flex items-center justify-center gap-1.5 rounded p-2 text-xs font-bold transition-colors cursor-pointer",
                      (selectedSector.fortificationLevel || 1) >= 5 || worldState.resources.industrialMaterials < 50
                        ? "border border-zinc-800 bg-zinc-900 text-zinc-500 cursor-not-allowed"
                        : "border border-amber-500/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60"
                    )}
                  >
                    <Hammer className="size-3.5" />
                    <span>Nâng Cấp Công Sự (+1 Cấp)</span>
                  </button>
                </div>

                {/* Tác vụ 3: Điều quân nhanh đến sector này */}
                <button
                  type="button"
                  onClick={() => setIsQuickDispatchOpen(true)}
                  disabled={selectedSector.isLockedForCombat}
                  className={cn(
                    "w-full flex items-center justify-center gap-1.5 rounded p-2 text-xs font-bold transition-colors cursor-pointer",
                    selectedSector.isLockedForCombat
                      ? "border border-zinc-800 bg-zinc-900 text-zinc-500 cursor-not-allowed"
                      : "border border-cyan-500/60 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60"
                  )}
                >
                  <Zap className="size-3.5" />
                  <span>Điều Quân Chi Viện Cho Sector Này</span>
                </button>

                {/* Tác vụ 4: Xuất kích can thiệp trực tiếp bằng Buồng Lái (Combat Encounter) */}
                {(selectedSector.stage === "under_siege" || selectedSector.stage === "threatened" || selectedSector.isLockedForCombat) && onDeployEncounter && (
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound()
                      onDeployEncounter(selectedSector.id)
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded border border-red-500/60 bg-red-950/40 p-2 text-xs font-bold text-red-200 hover:bg-red-900/60 transition-colors cursor-pointer shadow-md shadow-red-950/50"
                  >
                    <Swords className="size-3.5 text-red-400 animate-pulse" />
                    <span>Xuất Kích Can Thiệp Buồng Lái (Đấu Trường)</span>
                  </button>
                )}
              </>
            ) : (
              <div className="text-zinc-500 text-center p-6">Chọn một sector để xem chi tiết.</div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 3: CHIẾN DỊCH & SỰ KIỆN (ACTIVE OPERATIONS BOARD)
          ==================================================================== */}
      {activeTab === "events" && (
        <div className="space-y-4">
          {/* Phân mục 1: Sự kiện đang hoạt động */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-zinc-400 text-[11px]">
              <span className="font-bold uppercase tracking-wide flex items-center gap-1.5">
                <Flame className="size-3.5 text-amber-400" />
                SỰ KIỆN THỜI GIAN THỰC & ĐẾM NGƯỢC ({activeEventsList.length})
              </span>
              <span>Hết hạn đếm ngược sẽ tự động khóa phương án mặc định</span>
            </div>

            {activeEventsList.length === 0 ? (
              <div className="rounded border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
                Không có sự kiện khẩn cấp nào đang diễn ra trong thiên hà.
              </div>
            ) : (
              activeEventsList.map((event) => {
                const isInit = event.status === "INIT"
                const daysRemaining = Math.max(0, event.decisionDeadlineTick - worldState.currentDay)
                const targetSector = event.sectorId ? worldState.sectors[event.sectorId] : null

                return (
                  <div
                    key={event.id}
                    className="rounded border border-zinc-800 bg-zinc-950/80 p-4 space-y-3 shadow-md"
                  >
                    {/* Header event */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border",
                            isInit
                              ? "border-amber-500/50 bg-amber-950/50 text-amber-300 animate-pulse"
                              : "border-cyan-500/50 bg-cyan-950/50 text-cyan-300"
                          )}
                        >
                          {event.status}
                        </span>
                        <span className="font-bold text-zinc-100 text-xs">{event.title}</span>
                        {targetSector && (
                          <span className="text-zinc-400 text-[10px]">· Sector: {targetSector.name}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px]">
                        <Clock className="size-3.5 text-zinc-400" />
                        <span className={cn(daysRemaining <= 1 ? "text-red-400 font-bold" : "text-zinc-400")}>
                          {isInit ? `Hạn chót: Còn ${daysRemaining} ngày` : `Hoàn tất tại ngày #${event.processingCompletesTick}`}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-300 leading-relaxed bg-zinc-900/40 p-2.5 rounded border border-zinc-800/60">
                      {event.description}
                    </p>

                    {/* Danh sách các chiến lược có thể chọn nếu ở INIT */}
                    {isInit && (
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-cyan-400 uppercase tracking-wide">
                          Lựa Chọn Phương Án Đối Ứng (Phê Chuẩn Chiến Lược):
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {event.availableStrategies.map((strat) => {
                            const isDefault = strat.id === event.defaultStrategyId
                            return (
                              <div
                                key={strat.id}
                                className={cn(
                                  "rounded border p-2.5 flex flex-col justify-between space-y-2 transition-all",
                                  isDefault
                                    ? "border-amber-500/40 bg-amber-950/20"
                                    : "border-zinc-800 bg-zinc-900/40"
                                )}
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-zinc-200 text-[11px]">{strat.name}</span>
                                    {isDefault && (
                                      <span className="text-[9px] text-amber-300 uppercase font-bold">Mặc Định</span>
                                    )}
                                  </div>
                                  <p className="mt-1 text-[10px] text-zinc-400">{strat.description}</p>
                                </div>

                                <div className="border-t border-zinc-800/80 pt-2 space-y-1.5 text-[10px]">
                                  {strat.cost && Object.keys(strat.cost).length > 0 && (
                                    <div className="text-zinc-400">
                                      Chi phí:{" "}
                                      {Object.entries(strat.cost).map(([k, v]) => (
                                        <span key={k} className="text-amber-300 font-bold mr-1">
                                          {k}: {v}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  <div className="text-zinc-400">
                                    Thời gian xử lý: <strong className="text-cyan-300">{strat.processingTicks} ngày</strong>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleChooseStrategy(event.id, strat.id)}
                                    className="w-full mt-1.5 rounded border border-cyan-500/50 bg-cyan-950/60 p-1.5 text-[11px] font-bold text-cyan-300 hover:bg-cyan-900 transition-colors cursor-pointer text-center"
                                  >
                                    Phê Chuẩn Phương Án
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Nếu đang PROCESSING */}
                    {event.status === "PROCESSING" && (
                      <div className="rounded bg-cyan-950/30 border border-cyan-500/30 p-2.5 text-[11px] text-cyan-200">
                        <span className="font-bold text-cyan-400">Đang triển khai phương án:</span>{" "}
                        {event.availableStrategies.find((s) => s.id === event.chosenStrategyId)?.name || event.chosenStrategyId}
                        <div className="mt-1 text-[10px] text-zinc-400">
                          Sẽ tự động hoàn tất và kết xuất kết quả khi đến ngày chiến lược #{event.processingCompletesTick}.
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Phân mục 2: Chuỗi nhiệm vụ chiến lược */}
          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <div className="flex items-center justify-between text-zinc-400 text-[11px]">
              <span className="font-bold uppercase tracking-wide flex items-center gap-1.5">
                <Compass className="size-3.5 text-cyan-400" />
                CHUỖI NHIỆM VỤ CHIẾN LƯỢC ĐANG CHẠY ({activeMissionChainsList.length} / 8 MAX)
              </span>
            </div>

            {activeMissionChainsList.length === 0 ? (
              <div className="rounded border border-dashed border-zinc-800 p-6 text-center text-zinc-500">
                Không có chuỗi nhiệm vụ nào đang hoạt động.
              </div>
            ) : (
              activeMissionChainsList.map((chain) => (
                <div
                  key={chain.id}
                  className="rounded border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-indigo-950/60 px-1.5 py-0.2 text-[10px] text-indigo-300 border border-indigo-500/40 uppercase font-bold">
                        {chain.topology}
                      </span>
                      <span className="font-bold text-zinc-100">{chain.title}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400">Bắt đầu ngày #{chain.startedAtTick}</span>
                  </div>

                  <p className="text-[11px] text-zinc-400">{chain.description}</p>

                  {/* Tiến trình các nút trong chuỗi */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800/80 pt-2 text-[10px]">
                    {Object.values(chain.nodes).map((node, nIdx) => (
                      <div
                        key={node.id}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded border",
                          node.status === "completed"
                            ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                            : node.status === "active"
                            ? "border-cyan-500/50 bg-cyan-950/40 text-cyan-200 font-bold"
                            : "border-zinc-800 bg-zinc-900/40 text-zinc-500"
                        )}
                      >
                        <span>{nIdx + 1}. {node.title}</span>
                        {node.status === "completed" && <CheckCircle2 className="size-3 text-emerald-400" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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
                    key={dep.id}
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
    </div>
  )
}
