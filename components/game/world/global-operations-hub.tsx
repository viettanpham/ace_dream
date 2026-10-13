"use client"

import { useState, useMemo } from "react"
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Crosshair,
  Database,
  ExternalLink,
  Eye,
  FileText,
  Flame,
  Globe2,
  HelpCircle,
  History,
  Info,
  Layers,
  Lock,
  MapPin,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Route,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  TrendingDown,
  TrendingUp,
  Truck,
  Wheat,
  X,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { playClickSound } from "@/lib/game/audio"
import { getActiveEvents } from "@/lib/game/world/event-engine"
import { ThreatVisualizer } from "./threat-visualizer"
import { ResourceSparkline, type ResourceHistoryPoint } from "./resource-sparkline"
import type {
  WorldState,
  WorldSector,
  WorldRoute,
  WorldEvent,
  WorldEventResult,
  MissionChain,
  EncounterSnapshot,
  SectorThreatHistoryPoint,
} from "@/lib/game/world/types"
import type { WorldSimulatorConfig } from "@/lib/game/world/simulator-config"

export type AlertPriority = "P0" | "P1" | "P2"

export type AlertType =
  | "suspended_combat"
  | "siege"
  | "threatened"
  | "high_threat"
  | "blocked_route"
  | "hazardous_route"
  | "food_crisis"
  | "food_warning"
  | "supplies_crisis"
  | "supplies_warning"
  | "event_deadline"

export interface CriticalAlertItem {
  id: string
  type: AlertType
  priority: AlertPriority
  title: string
  sectorId?: string
  sectorName?: string
  routeId?: string
  eventId?: string
  eventRef?: WorldEvent
  statusText: string
  urgencyBadge: string
  description: string
  daysLeft?: number
  actionType:
    | "resume_combat"
    | "war_room"
    | "sector_intel"
    | "quick_dispatch"
    | "resolve_event"
    | "military_tab"
}

export interface SectorOperationItem {
  sector: WorldSector
  priority: AlertPriority
  hasSiege: boolean
  hasThreat: boolean
  eventsCount: number
  incomingDeploymentsCount: number
  incomingTroops: number
  isLocked: boolean
  actionRequired: string
}

export type HubFilterCategory = "all" | "alerts" | "events" | "combat" | "sectors" | "reports"

// ============================================================================
// PURE COMPUTATION HELPERS (DETERMINISTIC, UNIT-TESTABLE, ZERO DUPLICATE RISK)
// ============================================================================

/**
 * Tính toán danh sách cảnh báo chiến lược tối khẩn (Critical Alerts)
 * Bảo đảm phân loại đúng P0, P1, P2, không tạo điểm giả định, deduplication theo thực thể.
 */
export function computeCriticalAlerts(
  worldState: WorldState,
  activeEvents: WorldEvent[] = getActiveEvents(worldState)
): CriticalAlertItem[] {
  const alerts: CriticalAlertItem[] = []
  const sectorsList = Object.values(worldState.sectors)

  // 1. Trận chiến đang dở dang (Suspended Combat) -> P0 cao nhất
  if (worldState.isSuspendedCombat && worldState.suspendedSnapshot) {
    const snap = worldState.suspendedSnapshot
    alerts.push({
      id: `combat_${snap.transactionId}`,
      type: "suspended_combat",
      priority: "P0",
      title: `Trận chiến dở dang tại ${snap.sectorName}`,
      sectorId: snap.sectorId,
      sectorName: snap.sectorName,
      statusText: "Đóng băng chiến trường",
      urgencyBadge: "P0 TỐI NGUY · CHIẾN SỰ DỞ DANG",
      description: `Mã giao dịch ${snap.transactionId}. ${(snap.lockedGarrison ?? 0).toLocaleString()} quân đồn trú đang bị đóng băng chờ giải quyết.`,
      actionType: "resume_combat",
    })
  }

  // 2. Sectors bị vây hãm (under_siege) -> P0
  const siegeSectors = sectorsList.filter((s) => s.stage === "under_siege")
  for (const s of siegeSectors) {
    alerts.push({
      id: `siege_${s.id}`,
      type: "siege",
      priority: "P0",
      title: `Sector ${s.name} đang bị vây hãm!`,
      sectorId: s.id,
      sectorName: s.name,
      statusText: "Bị vây hãm",
      urgencyBadge: "P0 TỐI NGUY · BỊ VÂY HÃM",
      description: `Mức đe dọa cực hạn ${s.threatLevel}/1000. Đồn trú: ${(s.garrisonPower ?? 0).toLocaleString()} quân. Cần giải vây khẩn cấp!`,
      actionType: "war_room",
    })
  }

  // 3. Sectors bị đe dọa (threatened) -> P1
  const threatenedSectors = sectorsList.filter((s) => s.stage === "threatened")
  for (const s of threatenedSectors) {
    alerts.push({
      id: `threatened_${s.id}`,
      type: "threatened",
      priority: "P1",
      title: `Sector ${s.name} đối mặt nguy cơ cao`,
      sectorId: s.id,
      sectorName: s.name,
      statusText: "Bị đe dọa",
      urgencyBadge: "P1 NGUY CƠ · BỊ ĐE DỌA",
      description: `Mức đe dọa ${s.threatLevel}/1000. Đồn trú: ${s.garrisonPower.toLocaleString()} quân. Cần tăng cường phòng thủ hoặc tiếp viện.`,
      actionType: "war_room",
    })
  }

  // 4. Sector có Threat cao (>= 700) nhưng chưa bị under_siege hay threatened (tránh duplicate)
  const highThreatSectors = sectorsList.filter(
    (s) => s.threatLevel >= 700 && s.stage !== "under_siege" && s.stage !== "threatened"
  )
  for (const s of highThreatSectors) {
    alerts.push({
      id: `high_threat_${s.id}`,
      type: "high_threat",
      priority: "P1",
      title: `Sector ${s.name} Threat tăng vọt (${s.threatLevel}/1000)`,
      sectorId: s.id,
      sectorName: s.name,
      statusText: `Threat ${s.threatLevel}`,
      urgencyBadge: "P1 CẢNH BÁO · THREAT CAO",
      description: `Mức độ đe dọa chạm ngưỡng nguy cấp (${s.threatLevel}/1000). Nguy cơ chuyển sang trạng thái bị đe dọa trong các chu kỳ tới.`,
      actionType: "sector_intel",
    })
  }

  // 5. Tuyến đường siêu không gian bị chặn (blocked) -> P1
  const blockedRoutes = worldState.routes.filter((r) => r.state === "blocked")
  for (const r of blockedRoutes) {
    const fromName = worldState.sectors[r.fromSectorId]?.name || r.fromSectorId
    const toName = worldState.sectors[r.toSectorId]?.name || r.toSectorId
    alerts.push({
      id: `route_blocked_${r.id}`,
      type: "blocked_route",
      priority: "P1",
      title: `Tuyến ${fromName} &harr; ${toName} BỊ CHẶN`,
      routeId: r.id,
      statusText: "Tuyến bị phong tỏa",
      urgencyBadge: "P1 TUYẾN ĐƯỜNG BỊ CHẶN",
      description: `Tuyến siêu không gian nối giữa ${fromName} và ${toName} đã bị The Void phong tỏa hoàn toàn. Không thể điều quân qua tuyến này.`,
      actionType: "war_room",
    })
  }

  // 6. Tuyến đường nguy hiểm (hazardous) -> P2
  const hazardousRoutes = worldState.routes.filter((r) => r.state === "hazardous")
  for (const r of hazardousRoutes) {
    const fromName = worldState.sectors[r.fromSectorId]?.name || r.fromSectorId
    const toName = worldState.sectors[r.toSectorId]?.name || r.toSectorId
    alerts.push({
      id: `route_hazardous_${r.id}`,
      type: "hazardous_route",
      priority: "P2",
      title: `Tuyến ${fromName} &harr; ${toName} nguy hiểm`,
      routeId: r.id,
      statusText: "Tuyến nguy hiểm",
      urgencyBadge: "P2 NGUY HIỂM",
      description: `Tuyến siêu không gian có nhiễu loạn plasma hoặc phi đội hải tặc phục kích. Thời gian di chuyển có thể bị kéo dài.`,
      actionType: "war_room",
    })
  }

  // 7. Khủng hoảng hậu cần / lương thực
  if (worldState.resources.food <= 0) {
    alerts.push({
      id: "crisis_food",
      type: "food_crisis",
      priority: "P0",
      title: "Khủng hoảng Lương thực Toàn diện (Food: 0)",
      statusText: "Cạn kiệt lương thực",
      urgencyBadge: "P0 KHỦNG HOẢNG DÂN SỰ",
      description: "Kho lương thực quốc gia chạm đáy 0 đơn vị. Nạn đói đang đe dọa sinh mạng người dân và làm suy thoái ổn định.",
      actionType: "military_tab",
    })
  } else if (worldState.resources.food < 100) {
    alerts.push({
      id: "warning_food",
      type: "food_warning",
      priority: "P2",
      title: "Kho lương thực ở mức thấp",
      statusText: `Lương thực: ${worldState.resources.food}`,
      urgencyBadge: "P2 CẢNH BÁO LƯƠNG THỰC",
      description: `Tồn kho lương thực chỉ còn ${worldState.resources.food} đơn vị (ngưỡng an toàn tối thiểu: 100).`,
      actionType: "military_tab",
    })
  }

  if (worldState.resources.logisticsSupplies <= 0) {
    alerts.push({
      id: "crisis_supplies",
      type: "supplies_crisis",
      priority: "P0",
      title: "Hết vật tư hậu cần quân sự (Supplies: 0)",
      statusText: "Cạn kiệt tiếp tế",
      urgencyBadge: "P0 CẠN KIỆT TIẾP TẾ",
      description: "Kho vật tư hậu cần quân sự chạm đáy 0 đơn vị. Đạn dược và phụ tùng cạn kiệt, đe dọa năng lực tác chiến.",
      actionType: "military_tab",
    })
  } else if (worldState.resources.logisticsSupplies < 50) {
    alerts.push({
      id: "warning_supplies",
      type: "supplies_warning",
      priority: "P2",
      title: "Vật tư tiếp tế dưới ngưỡng an toàn",
      statusText: `Tiếp tế: ${worldState.resources.logisticsSupplies}`,
      urgencyBadge: "P2 CẢNH BÁO TIẾP TẾ",
      description: `Vật tư hậu cần chỉ còn ${worldState.resources.logisticsSupplies} đơn vị (ngưỡng an toàn: 50).`,
      actionType: "military_tab",
    })
  }

  // 8. Sự kiện INIT có deadline sắp hết hoặc nghiêm trọng
  const initEvents = activeEvents
    .filter((e) => e.status === "INIT")
    .sort((a, b) => {
      const aDeadline = Math.max(0, a.decisionDeadlineTick - worldState.currentDay)
      const bDeadline = Math.max(0, b.decisionDeadlineTick - worldState.currentDay)
      return aDeadline - bDeadline
    })

  for (const ev of initEvents) {
    const daysLeft = Math.max(0, ev.decisionDeadlineTick - worldState.currentDay)
    const secName = ev.sectorId ? worldState.sectors[ev.sectorId]?.name : undefined
    const isUrgent = daysLeft <= 1 || ev.severity === "critical"
    const priority: AlertPriority = daysLeft === 0 ? "P0" : isUrgent ? "P1" : "P2"

    alerts.push({
      id: `event_${ev.id}`,
      type: "event_deadline",
      priority,
      title: ev.title,
      sectorName: secName,
      sectorId: ev.sectorId,
      eventId: ev.id,
      eventRef: ev,
      daysLeft,
      statusText: daysLeft === 0 ? "Hết hạn hôm nay" : `Còn ${daysLeft} ngày`,
      urgencyBadge:
        daysLeft === 0
          ? "P0 HẾT HẠN HÔM NAY"
          : daysLeft === 1
          ? "P1 CÒN 1 NGÀY"
          : `P2 CÒN ${daysLeft} NGÀY`,
      description: `${ev.description} ${
        daysLeft === 0 ? "(Sẽ tự động khóa mặc định nếu qua ngày!)" : ""
      }`,
      actionType: "resolve_event",
    })
  }

  // Sắp xếp theo thứ tự ưu tiên P0 -> P1 -> P2
  const priorityRank: Record<AlertPriority, number> = { P0: 0, P1: 1, P2: 2 }
  alerts.sort((a, b) => {
    const diff = priorityRank[a.priority] - priorityRank[b.priority]
    if (diff !== 0) return diff
    if (a.daysLeft !== undefined && b.daysLeft !== undefined) {
      return a.daysLeft - b.daysLeft
    }
    return a.title.localeCompare(b.title)
  })

  return alerts
}

/**
 * Lọc và tổng hợp các sự kiện hoạt động
 */
export function computeActiveEventsGroups(activeEvents: WorldEvent[], worldState: WorldState) {
  const initEvents = activeEvents
    .filter((e) => e.status === "INIT")
    .sort((a, b) => {
      const aDeadline = Math.max(0, a.decisionDeadlineTick - worldState.currentDay)
      const bDeadline = Math.max(0, b.decisionDeadlineTick - worldState.currentDay)
      if (aDeadline !== bDeadline) return aDeadline - bDeadline
      return a.id.localeCompare(b.id)
    })

  const processingEvents = activeEvents
    .filter((e) => e.status === "PROCESSING")
    .sort((a, b) => {
      const aDeadline = Math.max(0, (a.processingCompletesTick ?? a.decisionDeadlineTick) - worldState.currentDay)
      const bDeadline = Math.max(0, (b.processingCompletesTick ?? b.decisionDeadlineTick) - worldState.currentDay)
      return aDeadline - bDeadline
    })

  const resultsArchiveCount = worldState.eventResultsArchive?.length ?? 0

  return {
    initEvents,
    processingEvents,
    resultsArchiveCount,
  }
}

/**
 * Tổng hợp thông tin tác chiến chiến đấu WORLD (Combat Operations)
 */
export function computeCombatOperations(worldState: WorldState) {
  const suspendedEncounter =
    worldState.isSuspendedCombat && worldState.suspendedSnapshot
      ? {
          snapshot: worldState.suspendedSnapshot,
          sector: worldState.sectors[worldState.suspendedSnapshot.sectorId],
          transactionId: worldState.suspendedSnapshot.transactionId,
          lockedGarrison: worldState.suspendedSnapshot.lockedGarrison,
        }
      : null

  const lockedSectors = Object.values(worldState.sectors).filter((s) => !!s.isLockedForCombat)

  // Lấy các kết quả combat gần nhất từ eventResultsArchive nếu có
  const recentCombatResults = (worldState.eventResultsArchive || [])
    .filter((r) => r.eventId.includes("combat") || r.title.toLowerCase().includes("chiến") || r.title.toLowerCase().includes("tác chiến"))
    .slice(-3)
    .reverse()

  return {
    suspendedEncounter,
    lockedSectors,
    recentCombatResults,
  }
}

/**
 * Tổng hợp các sector cần can thiệp hoặc đang có hoạt động (Sector Operations)
 */
export function computeSectorOperations(
  worldState: WorldState,
  activeEvents: WorldEvent[] = getActiveEvents(worldState)
): SectorOperationItem[] {
  const items: SectorOperationItem[] = []
  const sectors = Object.values(worldState.sectors)

  for (const s of sectors) {
    const hasSiege = s.stage === "under_siege"
    const hasThreat = s.stage === "threatened" || s.threatLevel >= 700
    const sectorEvents = activeEvents.filter((e) => e.sectorId === s.id)
    const incomingDeployments = (worldState.activeDeployments || []).filter((d) => d.toSectorId === s.id)
    const incomingTroops = incomingDeployments.reduce((acc, d) => acc + d.troopCount, 0)
    const isLocked = !!s.isLockedForCombat

    // Chỉ hiển thị sector nếu có tình trạng đặc biệt hoặc đang diễn ra hoạt động
    const isActionable =
      hasSiege ||
      hasThreat ||
      sectorEvents.length > 0 ||
      incomingDeployments.length > 0 ||
      isLocked ||
      s.sovereignty === "contested"

    if (isActionable) {
      let priority: AlertPriority = "P2"
      let actionRequired = "Giám sát thông thường"

      if (hasSiege || isLocked) {
        priority = "P0"
        actionRequired = hasSiege ? "Giải vây khẩn cấp" : "Đang khóa tác chiến"
      } else if (hasThreat || sectorEvents.some((e) => e.status === "INIT" && (e.decisionDeadlineTick - worldState.currentDay) <= 1)) {
        priority = "P1"
        actionRequired = hasThreat ? "Tăng viện phòng thủ" : "Sự kiện sắp hết hạn"
      } else if (sectorEvents.length > 0) {
        actionRequired = `Có ${sectorEvents.length} sự kiện`
      } else if (incomingDeployments.length > 0) {
        actionRequired = `Đang chi viện ${incomingTroops} quân`
      }

      items.push({
        sector: s,
        priority,
        hasSiege,
        hasThreat,
        eventsCount: sectorEvents.length,
        incomingDeploymentsCount: incomingDeployments.length,
        incomingTroops,
        isLocked,
        actionRequired,
      })
    }
  }

  // Sắp xếp: P0 trước, rồi P1, P2
  const priorityRank: Record<AlertPriority, number> = { P0: 0, P1: 1, P2: 2 }
  items.sort((a, b) => {
    const diff = priorityRank[a.priority] - priorityRank[b.priority]
    if (diff !== 0) return diff
    return b.sector.threatLevel - a.sector.threatLevel
  })

  return items
}

/**
 * Tính số lượng mục hành động cần người chơi can thiệp (Actionable Items Counter)
 * Không đếm trùng các sự kiện hoặc sector đã nằm trong cùng một alert!
 */
export function computeActionableItemsCount(
  alerts: CriticalAlertItem[],
  initEvents: WorldEvent[],
  worldState: WorldState
): number {
  // Tập hợp các ID hành động độc lập
  const actionKeys = new Set<string>()

  // 1. Cảnh báo P0 và P1
  for (const a of alerts) {
    if (a.priority === "P0" || a.priority === "P1") {
      actionKeys.add(a.id)
    }
  }

  // 2. Các sự kiện INIT cần quyết định (nếu chưa có trong alert P0/P1)
  for (const ev of initEvents) {
    actionKeys.add(`event_${ev.id}`)
  }

  // 3. Trận chiến treo (nếu có)
  if (worldState.isSuspendedCombat && worldState.suspendedSnapshot) {
    actionKeys.add(`combat_${worldState.suspendedSnapshot.transactionId}`)
  }

  return actionKeys.size
}

// ============================================================================
// COMPONENT INTERFACE
// ============================================================================

export interface GlobalOperationsHubProps {
  worldState: WorldState
  activeEvents: WorldEvent[]
  activeMissionChains: MissionChain[]
  lastTickLogs?: string[]
  unreadResultsCount: number
  onNavigateToSector: (sectorId: string) => void
  onOpenSectorIntel: (sectorId: string) => void
  onNavigateToEvent: (eventId: string, mode?: "init" | "processing") => void
  onQuickDispatch: (sectorId: string) => void
  onDeployCombat: (sectorId: string) => void
  onAbortSuspendedCombat?: () => void
  onOpenDebriefingDrawer: () => void
  onNavigateToMilitary?: () => void
  onAdvanceTick?: () => void
  isTickAdvancing?: boolean
  // Macro props for strategic overview deck
  foodSparklineHistory?: ResourceHistoryPoint[]
  suppliesSparklineHistory?: ResourceHistoryPoint[]
  criticalSectorThreatHistory?: SectorThreatHistoryPoint[]
  galaxyAverageThreatHistory?: SectorThreatHistoryPoint[]
  threatVisualizerMode?: "critical" | "average"
  onToggleThreatVisualizerMode?: (mode: "critical" | "average") => void
  calendarInfo?: {
    dayOfMonth: number
    monthName: string
    year: number
    seasonName: string
    seasonIcon: string
    timeString: string
    cycleName: string
  }
  simulatorConfig?: WorldSimulatorConfig
  countdownSeconds?: number
  onTogglePause?: () => void
  onReviewEventModal?: (event: WorldEvent) => void
}

export function GlobalOperationsHub({
  worldState,
  activeEvents,
  activeMissionChains,
  lastTickLogs = [],
  unreadResultsCount,
  onNavigateToSector,
  onOpenSectorIntel,
  onNavigateToEvent,
  onQuickDispatch,
  onDeployCombat,
  onAbortSuspendedCombat,
  onOpenDebriefingDrawer,
  onNavigateToMilitary,
  onAdvanceTick,
  isTickAdvancing = false,
  foodSparklineHistory = [],
  suppliesSparklineHistory = [],
  criticalSectorThreatHistory = [],
  galaxyAverageThreatHistory = [],
  threatVisualizerMode = "critical",
  onToggleThreatVisualizerMode,
  calendarInfo,
  simulatorConfig,
  countdownSeconds = 0,
  onTogglePause,
  onReviewEventModal,
}: GlobalOperationsHubProps) {
  // Bộ lọc danh mục con
  const [activeCategory, setActiveCategory] = useState<HubFilterCategory>("all")

  // Tính toán dữ liệu thuần nhất
  const criticalAlerts = useMemo(() => {
    return computeCriticalAlerts(worldState, activeEvents)
  }, [worldState, activeEvents])

  const eventGroups = useMemo(() => {
    return computeActiveEventsGroups(activeEvents, worldState)
  }, [activeEvents, worldState])

  const combatOps = useMemo(() => {
    return computeCombatOperations(worldState)
  }, [worldState])

  const sectorOps = useMemo(() => {
    return computeSectorOperations(worldState, activeEvents)
  }, [worldState, activeEvents])

  const actionableCount = useMemo(() => {
    return computeActionableItemsCount(criticalAlerts, eventGroups.initEvents, worldState)
  }, [criticalAlerts, eventGroups.initEvents, worldState])

  // Macro metrics
  const sectorsList = useMemo(() => Object.values(worldState.sectors), [worldState.sectors])
  const vssCount = sectorsList.filter((s) => s.sovereignty === "vss").length
  const voidCount = sectorsList.filter((s) => s.sovereignty === "void").length
  const contestedCount = sectorsList.filter((s) => s.sovereignty === "contested").length
  const avgThreat = Math.round(
    sectorsList.reduce((acc, s) => acc + s.threatLevel, 0) / (sectorsList.length || 1)
  )
  const criticalSector = useMemo(() => {
    return [...sectorsList].sort((a, b) => b.threatLevel - a.threatLevel)[0]
  }, [sectorsList])

  const recentReports = useMemo(() => {
    return (worldState.eventResultsArchive || []).slice(-4).reverse()
  }, [worldState.eventResultsArchive])

  return (
    <div className="space-y-4 font-mono text-xs animate-fadeIn" data-testid="global-operations-hub">
      {/* ====================================================================
          HEADER: HUB COMMAND BAR (SCI-FI OPERATIONS CENTER HEADER)
          ==================================================================== */}
      <div className="rounded border border-cyan-500/50 bg-gradient-to-r from-zinc-950 via-slate-950 to-cyan-950/40 p-3.5 shadow-lg shadow-cyan-950/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="size-9 rounded-lg bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-md shadow-cyan-500/30">
              <Crosshair className="size-5 animate-pulse" />
            </div>
            {actionableCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow-sm ring-2 ring-zinc-950 animate-bounce">
                {actionableCount}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-200">
                Trung Tâm Điều Hành Toàn Cảnh
              </h2>
              <span className="rounded bg-cyan-900/60 border border-cyan-500/40 px-1.5 py-0.2 text-[9px] font-bold text-cyan-300">
                Phase 6.29 Hub
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
              <span>
                Ngày chiến lược: <strong className="text-cyan-300 font-mono">#{worldState.currentDay}</strong>
              </span>
              <span>&bull;</span>
              <span>
                10 Sector Thiên Hà (<span className="text-emerald-400">{vssCount} VSS</span>,{" "}
                <span className="text-red-400">{voidCount} Void</span>)
              </span>
            </div>
          </div>
        </div>

        {/* Actionable Counter & Fast Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-bold border",
              actionableCount > 0
                ? "bg-amber-950/60 border-amber-500/60 text-amber-200 shadow-sm"
                : "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
            )}
            title="Số lượng sự việc và tình huống cần người chơi xử lý"
          >
            <AlertCircle className="size-3.5" />
            <span>
              {actionableCount > 0 ? `${actionableCount} Việc Cần Can Thiệp` : "Hệ Thống Ổn Định"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              playClickSound()
              onOpenDebriefingDrawer()
            }}
            className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer text-xs"
            title="Mở toàn bộ khay báo cáo tình báo và lưu trữ"
          >
            <FileText className="size-3.5 text-cyan-400" />
            <span>Báo Cáo</span>
            {unreadResultsCount > 0 && (
              <span className="rounded bg-amber-500 text-black px-1 py-0.2 text-[9px] font-black">
                {unreadResultsCount} Mới
              </span>
            )}
          </button>

          {onAdvanceTick && (
            <button
              type="button"
              onClick={() => {
                playClickSound()
                onAdvanceTick()
              }}
              disabled={isTickAdvancing}
              className="flex items-center gap-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-3 py-1 text-xs cursor-pointer transition-colors shadow-md shadow-cyan-500/30 disabled:opacity-50"
              title="Tiến 1 ngày chiến lược"
            >
              <Play className="size-3.5 fill-current" />
              <span>{isTickAdvancing ? "Đang tính..." : "+1 Ngày"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ====================================================================
          CATEGORY SUB-NAVIGATION TABS
          ==================================================================== */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-800 pb-2">
        {[
          { id: "all", label: "Tất Cả Mục", count: criticalAlerts.length + eventGroups.initEvents.length + eventGroups.processingEvents.length },
          { id: "alerts", label: "Cảnh Báo Nguy Cấp", count: criticalAlerts.length, badgeColor: "text-red-400" },
          { id: "events", label: "Sự Kiện Chiến Lược", count: activeEvents.length, badgeColor: "text-amber-400" },
          { id: "combat", label: "Tác Chiến & Encounter", count: combatOps.suspendedEncounter ? 1 : combatOps.lockedSectors.length, badgeColor: "text-indigo-400" },
          { id: "sectors", label: "Sector Hoạt Động", count: sectorOps.length, badgeColor: "text-cyan-400" },
          { id: "reports", label: "Báo Cáo Gần Đây", count: recentReports.length, badgeColor: "text-zinc-400" },
        ].map((tab) => {
          const isActive = activeCategory === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                playClickSound()
                setActiveCategory(tab.id as HubFilterCategory)
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold uppercase transition-all cursor-pointer",
                isActive
                  ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 shadow-sm"
                  : "bg-zinc-900/60 text-zinc-400 border border-zinc-800/80 hover:bg-zinc-900 hover:text-zinc-200"
              )}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={cn(
                    "rounded px-1.5 py-0.2 text-[9px] font-mono",
                    isActive ? "bg-cyan-900 text-cyan-200" : "bg-black/60 text-zinc-400"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ====================================================================
          MACRO SITUATION DECK (BẢO TOÀN THẺ CHIẾN LƯỢC, THREAT VISUALIZER & SPARKLINES)
          ==================================================================== */}
      {(activeCategory === "all" || activeCategory === "alerts") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          {/* Macro 1: Chủ Quyền & Lãnh Thổ */}
          <div className="rounded border border-zinc-800 bg-zinc-950/80 p-3.5 space-y-2.5 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <span className="flex items-center gap-1.5 font-bold uppercase text-[11px] text-zinc-300">
                  <Globe2 className="size-3.5 text-cyan-400" />
                  Chủ Quyền & Lãnh Thổ
                </span>
                <span className="font-bold text-emerald-400 font-mono text-xs">
                  {Math.round((vssCount / sectorsList.length) * 100)}% VSS
                </span>
              </div>

              <div className="flex h-2 w-full rounded-full overflow-hidden bg-zinc-900 mt-2.5">
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

              <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                <span className="text-emerald-400 font-bold">{vssCount} VSS</span>
                <span className="text-amber-400 font-bold">{contestedCount} Tranh Chấp</span>
                <span className="text-red-400 font-bold">{voidCount} The Void</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-400">
              <span>Mạng lưới siêu không gian:</span>
              <span className="font-mono text-zinc-200">
                {worldState.routes.length} Tuyến đường
              </span>
            </div>
          </div>

          {/* Macro 2: Threat Visualizer */}
          <div className="rounded border border-zinc-800 bg-zinc-950/80 p-3.5 space-y-2.5 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <span className="flex items-center gap-1.5 font-bold uppercase text-[11px] text-zinc-300">
                  <ShieldAlert className="size-3.5 text-amber-400" />
                  Threat & Điểm Nóng
                </span>
                <span className="font-bold text-cyan-400 font-mono text-xs">
                  TB {avgThreat} / 1000
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden mt-2.5">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    avgThreat >= 700 ? "bg-red-500" : avgThreat >= 300 ? "bg-amber-500" : "bg-cyan-500"
                  )}
                  style={{ width: `${Math.min(100, (avgThreat / 1000) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1">
                <span>An Toàn [&lt;300]</span>
                <span>Báo Động [300–699]</span>
                <span>Nguy Cấp [&ge;700]</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/60">
              <ThreatVisualizer
                history={threatVisualizerMode === "critical" ? criticalSectorThreatHistory : galaxyAverageThreatHistory}
                currentThreat={threatVisualizerMode === "critical" ? (criticalSector?.threatLevel ?? avgThreat) : avgThreat}
                sectorName={threatVisualizerMode === "critical" ? criticalSector?.name : undefined}
                title={threatVisualizerMode === "critical" ? "Điểm Nóng Tác Chiến" : "TB Toàn Thiên Hà"}
                viewMode={threatVisualizerMode}
                onToggleViewMode={onToggleThreatVisualizerMode}
                onNavigateToSector={criticalSector ? () => onNavigateToSector(criticalSector.id) : undefined}
              />
            </div>
          </div>

          {/* Macro 3: Quân Sự & Resource Sparklines */}
          <div className="rounded border border-zinc-800 bg-zinc-950/80 p-3.5 space-y-2.5 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <span className="flex items-center gap-1.5 font-bold uppercase text-[11px] text-zinc-300">
                  <Swords className="size-3.5 text-indigo-400" />
                  Quân Sự & Hậu Cần
                </span>
                <span className="font-bold text-cyan-300 font-mono text-xs">
                  Dự bị: {worldState.military.reserves.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 mt-2.5 text-[10px]">
                <div className="rounded bg-zinc-900/60 p-1.5 border border-zinc-800">
                  <div className="text-[9px] text-zinc-500 uppercase">Trực Chiến</div>
                  <div className="font-bold text-zinc-200 font-mono text-xs mt-0.5">
                    {worldState.military.deployed.toLocaleString()}
                  </div>
                </div>
                <div className="rounded bg-zinc-900/60 p-1.5 border border-zinc-800">
                  <div className="text-[9px] text-zinc-500 uppercase">Hành Quân</div>
                  <div className="font-bold text-indigo-300 font-mono text-xs mt-0.5">
                    {(worldState.activeDeployments || []).length} Đội
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
              <ResourceSparkline
                name="Lương thực dân sự"
                currentValue={worldState.resources.food}
                targetValue={100}
                warningThreshold={100}
                criticalThreshold={0}
                icon={Wheat}
                history={foodSparklineHistory}
              />
              <ResourceSparkline
                name="Vật tư tiếp tế"
                currentValue={worldState.resources.logisticsSupplies}
                targetValue={50}
                warningThreshold={50}
                criticalThreshold={0}
                icon={Boxes}
                history={suppliesSparklineHistory}
              />
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          GROUP A: CRITICAL ALERTS (CẢNH BÁO CHIẾN LƯỢC TỐI KHẨN)
          ==================================================================== */}
      {(activeCategory === "all" || activeCategory === "alerts") && (
        <section className="rounded border border-red-500/40 bg-zinc-950/90 p-3.5 space-y-3 shadow-lg shadow-red-950/10">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                A. Cảnh Báo Chiến Lược Tối Khẩn (Critical Alerts)
              </h3>
            </div>
            <span className="rounded bg-black/60 px-2 py-0.5 text-[10px] text-zinc-400 border border-zinc-800 font-mono">
              {criticalAlerts.length} Cảnh Báo
            </span>
          </div>

          {criticalAlerts.length === 0 ? (
            <div className="rounded border border-emerald-500/30 bg-emerald-950/10 p-4 text-center text-emerald-400 space-y-1">
              <div className="font-bold uppercase tracking-wide">
                Phòng Tuyến An Toàn — Không Có Cảnh Báo Cấp Bách
              </div>
              <div className="text-[11px] text-zinc-400">
                Không có sector nào đang bị vây hãm, sự kiện sắp hết hạn hoặc khủng hoảng hậu cần.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {criticalAlerts.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "rounded p-2.5 border flex flex-col justify-between gap-2 transition-all",
                    item.priority === "P0"
                      ? "border-red-500/70 bg-red-950/20 text-red-200"
                      : item.priority === "P1"
                      ? "border-amber-500/50 bg-amber-950/20 text-amber-200"
                      : "border-cyan-500/40 bg-zinc-900/50 text-cyan-200"
                  )}
                  data-alert-id={item.id}
                  data-priority={item.priority}
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-1 pb-1">
                      <span className="font-bold uppercase text-[11px] truncate max-w-[240px]">
                        {item.title}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.2 text-[9px] font-bold border shrink-0",
                          item.priority === "P0"
                            ? "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse"
                            : item.priority === "P1"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        )}
                      >
                        {item.urgencyBadge}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1.5 border-t border-zinc-800/60">
                    {item.type === "suspended_combat" && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound()
                            if (item.sectorId) onDeployCombat(item.sectorId)
                          }}
                          className="rounded bg-amber-500 hover:bg-amber-400 text-black px-2.5 py-1 text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          Tiếp Tục Tác Chiến &rarr;
                        </button>
                        {onAbortSuspendedCombat && (
                          <button
                            type="button"
                            onClick={() => {
                              playClickSound()
                              onAbortSuspendedCombat()
                            }}
                            className="rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-2 py-1 text-[10px] cursor-pointer transition-colors"
                          >
                            Hủy Bỏ An Toàn
                          </button>
                        )}
                      </>
                    )}

                    {(item.type === "siege" || item.type === "threatened" || item.type === "high_threat") && item.sectorId && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound()
                            onOpenSectorIntel(item.sectorId!)
                          }}
                          className="rounded bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 px-2 py-1 text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          Hồ Sơ Intel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound()
                            onNavigateToSector(item.sectorId!)
                          }}
                          className="rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 px-2 py-1 text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          War Room
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound()
                            onQuickDispatch(item.sectorId!)
                          }}
                          className="rounded bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 px-2 py-1 text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          Điều Quân Nhanh
                        </button>
                      </>
                    )}

                    {(item.type === "blocked_route" || item.type === "hazardous_route") && (
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound()
                          onNavigateToSector(sectorsList[0]?.id || "sol_command_hq")
                        }}
                        className="rounded bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 px-2 py-1 text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Kiểm Tra Bản Đồ &rarr;
                      </button>
                    )}

                    {item.type === "event_deadline" && item.eventId && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound()
                            onNavigateToEvent(item.eventId!, "init")
                          }}
                          className="rounded bg-cyan-500 hover:bg-cyan-400 text-black px-2.5 py-1 text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          Phê Chuẩn Sự Kiện &rarr;
                        </button>
                        {item.eventRef && onReviewEventModal && (
                          <button
                            type="button"
                            onClick={() => {
                              playClickSound()
                              onReviewEventModal(item.eventRef!)
                            }}
                            className="rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 px-2 py-1 text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            ⚡ Xem Nhanh
                          </button>
                        )}
                      </>
                    )}

                    {(item.type === "food_crisis" || item.type === "food_warning" || item.type === "supplies_crisis" || item.type === "supplies_warning") && (
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound()
                          onNavigateToMilitary?.()
                        }}
                        className="rounded bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 px-2.5 py-1 text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Quản Lý Hậu Cần &rarr;
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ====================================================================
          GROUP B: ACTIVE EVENTS (SỰ KIỆN CHIẾN LƯỢC ĐANG DIỄN RA)
          ==================================================================== */}
      {(activeCategory === "all" || activeCategory === "events") && (
        <section className="rounded border border-amber-500/40 bg-zinc-950/90 p-3.5 space-y-3 shadow-lg shadow-amber-950/10">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                B. Sự Kiện Chiến Lược Đang Diễn Ra (Active Events)
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="rounded bg-red-950/60 border border-red-500/40 px-1.5 py-0.2 text-red-300">
                {eventGroups.initEvents.length} Chờ Quyết Định (INIT)
              </span>
              <span className="rounded bg-cyan-950/60 border border-cyan-500/40 px-1.5 py-0.2 text-cyan-300">
                {eventGroups.processingEvents.length} Đang Triển Khai
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {/* 1. Nhóm INIT: Chờ Quyết Định */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300">
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Clock className="size-3.5" />
                  Sự Kiện Chờ Phê Chuẩn (INIT)
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {eventGroups.initEvents.length} Sự kiện
                </span>
              </div>

              {eventGroups.initEvents.length === 0 ? (
                <div className="rounded border border-zinc-800 bg-zinc-900/40 p-2.5 text-center text-zinc-500 text-[11px]">
                  Không có sự kiện nào đang chờ quyết định.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {eventGroups.initEvents.map((ev) => {
                    const daysLeft = Math.max(0, ev.decisionDeadlineTick - worldState.currentDay)
                    const sectorName = ev.sectorId ? worldState.sectors[ev.sectorId]?.name : "Thiên Hà"
                    return (
                      <div
                        key={ev.id}
                        className="rounded border border-amber-500/30 bg-zinc-900/70 p-2.5 flex flex-col justify-between gap-2"
                        data-event-id={ev.id}
                        data-event-status="INIT"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 pb-1">
                            <span className="font-bold text-zinc-200 text-[11px] truncate">
                              {ev.title}
                            </span>
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.2 text-[9px] font-bold font-mono border",
                                daysLeft === 0
                                  ? "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse"
                                  : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              )}
                            >
                              {daysLeft === 0 ? "Hết Hạn Hôm Nay" : `Còn ${daysLeft} Ngày`}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 line-clamp-2">
                            {ev.description}
                          </div>
                          <div className="text-[9px] text-cyan-400 mt-1">
                            Vị trí: {sectorName} &bull; Mức độ: {ev.severity.toUpperCase()}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-zinc-800/60">
                          <button
                            type="button"
                            onClick={() => {
                              playClickSound()
                              onNavigateToEvent(ev.id, "init")
                            }}
                            className="rounded bg-cyan-500 hover:bg-cyan-400 text-black px-2.5 py-1 text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Phê Chuẩn Chiến Lược &rarr;
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 2. Nhóm PROCESSING: Đang Triển Khai */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/60">
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <Activity className="size-3.5" />
                  Sự Kiện Đang Triển Khai (PROCESSING)
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {eventGroups.processingEvents.length} Sự kiện
                </span>
              </div>

              {eventGroups.processingEvents.length === 0 ? (
                <div className="rounded border border-zinc-800 bg-zinc-900/40 p-2.5 text-center text-zinc-500 text-[11px]">
                  Không có sự kiện nào đang trong giai đoạn triển khai.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {eventGroups.processingEvents.map((ev) => {
                    const daysLeft = Math.max(0, (ev.processingCompletesTick ?? ev.decisionDeadlineTick) - worldState.currentDay)
                    const sectorName = ev.sectorId ? worldState.sectors[ev.sectorId]?.name : "Thiên Hà"
                    return (
                      <div
                        key={ev.id}
                        className="rounded border border-cyan-500/30 bg-zinc-900/60 p-2.5 flex flex-col justify-between gap-2"
                        data-event-id={ev.id}
                        data-event-status="PROCESSING"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 pb-1">
                            <span className="font-bold text-zinc-200 text-[11px] truncate">
                              {ev.title}
                            </span>
                            <span className="rounded bg-cyan-950 border border-cyan-500/40 px-1.5 py-0.2 text-[9px] font-mono text-cyan-300">
                              Đang Thực Thi
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 line-clamp-2">
                            Phương án đã chọn: <strong className="text-zinc-200">{ev.chosenStrategyId || "Đang xử lý"}</strong>
                          </div>
                          <div className="text-[9px] text-cyan-400 mt-1 flex items-center justify-between">
                            <span>Vị trí: {sectorName}</span>
                            <span className="text-zinc-400">Dự kiến xong: Còn {daysLeft} ngày</span>
                          </div>
                        </div>

                        {/* Event PROCESSING chỉ cho phép xem tiến trình, không có nút phê chuẩn */}
                        <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-zinc-800/60">
                          <button
                            type="button"
                            onClick={() => {
                              playClickSound()
                              onNavigateToEvent(ev.id, "processing")
                            }}
                            className="rounded border border-cyan-500/40 bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 px-2.5 py-1 text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Xem Tiến Trình
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ====================================================================
          GROUP C: COMBAT OPERATIONS (HOẠT ĐỘNG CHIẾN ĐẤU & CHIẾN SỰ)
          ==================================================================== */}
      {(activeCategory === "all" || activeCategory === "combat") && (
        <section className="rounded border border-indigo-500/40 bg-zinc-950/90 p-3.5 space-y-3 shadow-lg shadow-indigo-950/10">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Swords className="size-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                C. Tác Chiến & Chiến Sự Thiên Hà (Combat Operations)
              </h3>
            </div>
            <span className="rounded bg-black/60 px-2 py-0.5 text-[10px] text-zinc-400 border border-zinc-800 font-mono">
              {combatOps.suspendedEncounter ? "1 Trận Dở Dang" : "0 Trận Dở Dang"}
            </span>
          </div>

          <div className="space-y-2.5">
            {combatOps.suspendedEncounter ? (
              <div className="rounded border border-amber-500/70 bg-amber-950/20 p-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-500 text-black px-1.5 py-0.2 text-[9px] font-bold">
                      SUSPENDED ENCOUNTER
                    </span>
                    <span className="font-bold text-amber-200 text-xs">
                      {combatOps.suspendedEncounter.snapshot.sectorName}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    Giao dịch <code className="text-cyan-300">{combatOps.suspendedEncounter.transactionId}</code>.{" "}
                    Khóa {combatOps.suspendedEncounter.lockedGarrison.toLocaleString()} quân đồn trú.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound()
                      onDeployCombat(combatOps.suspendedEncounter!.snapshot.sectorId)
                    }}
                    className="rounded bg-amber-500 hover:bg-amber-400 text-black font-bold px-3 py-1 text-xs cursor-pointer transition-colors shadow-md shadow-amber-500/20"
                  >
                    Tiếp Tục Tác Chiến &rarr;
                  </button>
                  {onAbortSuspendedCombat && (
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound()
                        onAbortSuspendedCombat()
                      }}
                      className="rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-2.5 py-1 text-xs cursor-pointer transition-colors"
                    >
                      Hủy Bỏ An Toàn
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded border border-zinc-800 bg-zinc-900/40 p-3 text-center text-zinc-500 text-[11px]">
                Không có cuộc đụng độ nào đang bị tạm dừng (Suspended Combat). Toàn bộ trận đấu đã được giải quyết an toàn.
              </div>
            )}

            {/* Danh sách Sector đang bị khóa giao tranh */}
            {combatOps.lockedSectors.length > 0 && (
              <div className="pt-2 border-t border-zinc-800/60 space-y-1.5">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">
                  Sector Đang Khóa Giao Tranh ({combatOps.lockedSectors.length}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {combatOps.lockedSectors.map((s) => (
                    <div
                      key={s.id}
                      className="rounded bg-red-950/40 border border-red-500/40 px-2.5 py-1 text-[11px] text-red-300 flex items-center gap-2"
                    >
                      <Lock className="size-3 text-red-400" />
                      <span>{s.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound()
                          onOpenSectorIntel(s.id)
                        }}
                        className="text-[9px] underline text-cyan-400 hover:text-white cursor-pointer ml-1"
                      >
                        Intel
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ====================================================================
          GROUP D: SECTOR OPERATIONS (TÌNH TRẠNG & HOẠT ĐỘNG TẠI CÁC SECTOR)
          ==================================================================== */}
      {(activeCategory === "all" || activeCategory === "sectors") && (
        <section className="rounded border border-cyan-500/40 bg-zinc-950/90 p-3.5 space-y-3 shadow-lg shadow-cyan-950/10">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Compass className="size-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                D. Tình Trạng & Hoạt Động Sector (Sector Operations)
              </h3>
            </div>
            <span className="rounded bg-black/60 px-2 py-0.5 text-[10px] text-zinc-400 border border-zinc-800 font-mono">
              {sectorOps.length} Sector Có Hoạt Động
            </span>
          </div>

          {sectorOps.length === 0 ? (
            <div className="rounded border border-zinc-800 bg-zinc-900/40 p-4 text-center text-zinc-500 text-[11px]">
              Toàn bộ 10 sector đang ở trạng thái bình ổn, không có biến động hay chiến dịch quân sự.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {sectorOps.map((item) => {
                const s = item.sector
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "rounded p-2.5 border flex flex-col justify-between gap-2 transition-all",
                      item.priority === "P0"
                        ? "border-red-500/60 bg-red-950/20"
                        : item.priority === "P1"
                        ? "border-amber-500/50 bg-amber-950/20"
                        : "border-zinc-800 bg-zinc-900/60"
                    )}
                    data-sector-item={s.id}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 pb-1">
                        <span className="font-bold text-zinc-100 text-[11px] truncate">
                          {s.name}
                        </span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.2 text-[9px] font-bold font-mono border uppercase",
                            s.sovereignty === "vss"
                              ? "border-emerald-500/40 bg-emerald-950/60 text-emerald-300"
                              : s.sovereignty === "void"
                              ? "border-red-500/40 bg-red-950/60 text-red-300"
                              : "border-amber-500/40 bg-amber-950/60 text-amber-300"
                          )}
                        >
                          {s.sovereignty}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-[9px] text-zinc-400 py-1 font-mono">
                        <div>
                          Threat: <strong className="text-zinc-200">{s.threatLevel}</strong>
                        </div>
                        <div>
                          Ổn định: <strong className="text-emerald-400">{s.stability}%</strong>
                        </div>
                        <div>
                          Quân: <strong className="text-cyan-300">{s.garrisonPower}</strong>
                        </div>
                      </div>

                      <div className="text-[10px] text-amber-300 font-bold mt-1">
                        &bull; {item.actionRequired}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1.5 border-t border-zinc-800/60">
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound()
                          onOpenSectorIntel(s.id)
                        }}
                        className="rounded bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 px-2 py-1 text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Hồ Sơ Intel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound()
                          onNavigateToSector(s.id)
                        }}
                        className="rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-1 text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        War Room
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound()
                          onQuickDispatch(s.id)
                        }}
                        className="rounded bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 px-2 py-1 text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Điều Quân
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ====================================================================
          GROUP E: RECENT REPORTS (BÁO CÁO TÌNH BÁO & LỐI TẮT DEBRIEFING)
          ==================================================================== */}
      {(activeCategory === "all" || activeCategory === "reports") && (
        <section className="rounded border border-zinc-800 bg-zinc-950/80 p-3.5 space-y-3 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
            <div className="flex items-center gap-2">
              <History className="size-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                E. Báo Cáo Tình Báo & Lưu Trữ Kết Quả (Recent Reports)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                playClickSound()
                onOpenDebriefingDrawer()
              }}
              className="flex items-center gap-1 text-[11px] text-cyan-300 hover:text-white font-bold cursor-pointer"
            >
              <span>Xem Tất Cả Trong Debriefing Drawer</span>
              <ExternalLink className="size-3" />
            </button>
          </div>

          {recentReports.length === 0 ? (
            <div className="rounded border border-zinc-800 bg-zinc-900/40 p-4 text-center text-zinc-500 text-[11px]">
              Chưa có báo cáo kết quả nào được lưu trữ trong phiên này.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  className="rounded border border-zinc-800 bg-zinc-900/50 p-2.5 flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-200 text-[11px] truncate">
                      {report.title}
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.2 text-[9px] font-bold font-mono border",
                        report.status === "success"
                          ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                          : "bg-red-950/80 text-red-300 border-red-500/40"
                      )}
                    >
                      {report.status === "success" ? "THÀNH CÔNG" : "THẤT BẠI"}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 line-clamp-2">
                    {report.summaryText}
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-zinc-500 pt-1 border-t border-zinc-800/40 font-mono">
                    <span>Ngày #{report.resolvedAtTick}</span>
                    <span className="text-cyan-400">Xem trong Debriefing Drawer &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
