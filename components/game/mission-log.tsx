"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Terminal,
  X,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Radio,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Target,
  ArrowRight,
  Filter,
  Copy,
  Check,
  Pause,
  Play,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { CampaignMission, StarfrontProgression } from "@/lib/game/types"
import { CAMPAIGN_SECTORS } from "@/lib/game/data"

export type MissionLogLevel = "info" | "success" | "warning" | "alert" | "objective"

export interface MissionLogEntry {
  id: string
  timestamp: string
  text: string
  level: MissionLogLevel
  sector?: string
  missionCode?: string
  progress?: { current: number; total: number }
  details?: string
}

export interface MissionLogProps {
  /** Real-time updates / external log items to render */
  entries?: MissionLogEntry[]
  /** Active campaign mission (if any) */
  activeMission?: CampaignMission | null
  /** User progression data for dynamic stats & objectives */
  progression?: StarfrontProgression | null
  /** Position on screen (or 'embedded' when placed inline in left sidebar) */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "embedded"
  /** Callback when user clicks a mission or action link */
  onNavigateMission?: (missionId?: string) => void
  /** Callback to open full log view screen */
  onOpenFullLogs?: () => void
  /** Initial minimized / collapsed state */
  initialCollapsed?: boolean
  /** Custom CSS classes */
  className?: string
}

const DEFAULT_LOG_ENTRIES: MissionLogEntry[] = [
  {
    id: "init-01",
    timestamp: "00:00:01",
    text: "STARFRONT TERMINAL v4.8 [KERNEL: QUANTUM-NET] SẴN SÀNG",
    level: "info",
  },
  {
    id: "init-02",
    timestamp: "00:00:04",
    text: "LIÊN KẾT TÁC CHIẾN HẠM ĐỘI ĐÃ ĐỒNG BỘ (ORBITAL LINK: 99.4%)",
    level: "success",
    sector: "Vành Đai Asteroid",
  },
  {
    id: "init-03",
    timestamp: "00:00:09",
    text: "TRINH SÁT: PHÁT HIỆN TÍN HIỆU ĐỘNG CƠ CƯỚP BIỂN TẠI SECTOR-1",
    level: "warning",
    sector: "Vành Đai Asteroid",
    missionCode: "MS-01",
  },
  {
    id: "init-04",
    timestamp: "00:00:15",
    text: "MỤC TIÊU CHIẾN DỊCH: HOÀN THÀNH 5 NHIỆM VỤ ĐỂ MỞ KHÓA HOÁN ĐỔI CHIẾN CƠ",
    level: "objective",
    progress: { current: 1, total: 5 },
  },
]

export function MissionLog({
  entries: propEntries,
  activeMission,
  progression,
  position = "bottom-right",
  onNavigateMission,
  onOpenFullLogs,
  initialCollapsed = false,
  className,
}: MissionLogProps) {
  const isEmbedded = position === "embedded"
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed)
  const [autoScroll, setAutoScroll] = useState(true)
  const [filterLevel, setFilterLevel] = useState<"all" | "objectives" | "alerts">("all")
  const [copied, setCopied] = useState(false)
  const [logs, setLogs] = useState<MissionLogEntry[]>(() => {
    return propEntries && propEntries.length > 0 ? propEntries : DEFAULT_LOG_ENTRIES
  })

  const scrollRef = useRef<HTMLDivElement>(null)

  // Sync external log entries when provided
  useEffect(() => {
    if (propEntries && propEntries.length > 0) {
      setLogs(propEntries)
    }
  }, [propEntries])

  // Generate automated real-time tactical updates based on player progression & active mission
  useEffect(() => {
    if (!progression) return

    const completed = progression.completedMissions?.length ?? 0
    const wonBattles = progression.battlesWon ?? 0

    // Construct live entries based on active state
    const dynamicEntries: MissionLogEntry[] = []

    if (activeMission) {
      dynamicEntries.push({
        id: `act-${activeMission.id}`,
        timestamp: "REALTIME",
        text: `ĐANG THỰC THI: [${activeMission.title.toUpperCase()}] TẠI ${activeMission.sectorName.toUpperCase()}`,
        level: "alert",
        sector: activeMission.sectorName,
        missionCode: activeMission.id,
        details: `Cấp khuyến nghị: Lv.${activeMission.recommendedLevel}+ · Phần thưởng: ${activeMission.firstClearReward.credits} Tín dụng, ${activeMission.firstClearReward.exp} EXP`,
      })
    }

    dynamicEntries.push({
      id: `prog-cleared-${completed}`,
      timestamp: "AUTO-SYNC",
      text: `TIẾN ĐỘ CHIẾN DỊCH: ĐÃ HOÀN TẤT ${completed}/5 NHIỆM VỤ YÊU CẦU`,
      level: completed >= 5 ? "success" : "objective",
      progress: { current: Math.min(5, completed), total: 5 },
    })

    dynamicEntries.push({
      id: `prog-battles-${wonBattles}`,
      timestamp: "AUTO-SYNC",
      text: `CHIẾN TRƯỜNG: CHIẾN THẮNG ${wonBattles} TRẬN ĐỐI KHÁNG ĐẤU TRƯỜNG`,
      level: wonBattles > 0 ? "success" : "info",
    })

    if (progression.activePairing?.isLocked) {
      dynamicEntries.push({
        id: "status-locked",
        timestamp: "STATUS",
        text: `TỔ HỢP TÁC CHIẾN ĐÃ KHÓA: PHI CÔNG [${progression.activePairing.pilotId.toUpperCase()}] & CƠ GIÁP [${progression.activeGearId.toUpperCase()}]`,
        level: "success",
      })
    } else {
      dynamicEntries.push({
        id: "status-unlocked",
        timestamp: "CẢNH BÁO",
        text: "CHƯA KHÓA TỔ HỢP TÁC CHIẾN! VUI LÒNG HOÀN TẤT BƯỚC 1-2-3 ĐỂ MỞ TOÀN BỘ PHÂN HỆ.",
        level: "warning",
      })
    }

    setLogs((prev) => {
      // Merge unique entries keeping the history
      const existingIds = new Set(prev.map((e) => e.id))
      const toAdd = dynamicEntries.filter((e) => !existingIds.has(e.id))
      if (toAdd.length === 0) return prev
      return [...prev, ...toAdd]
    })
  }, [activeMission, progression])

  // Periodic ambient telemetry ticker simulating space station communications
  useEffect(() => {
    const ambientTicker = setInterval(() => {
      if (!autoScroll) return

      const telemetryRandoms = [
        {
          text: "RADAR QUÉT: Không phát hiện tàu do thám trong phạm vi 15.000km.",
          level: "info" as const,
        },
        {
          text: "NĂNG LƯỢNG LÕI: Tụ điện Warp đã đạt 100% công suất tải.",
          level: "success" as const,
        },
        {
          text: "BÁO CÁO HẬU CẦN: Dây chuyền tiếp vận kho đạn hoàn tất tiếp nhận hàng.",
          level: "info" as const,
        },
        {
          text: "TÍN HIỆU CHIẾN DỊCH: Trạm chỉ huy Orion phát tín hiệu mã hóa kênh 44.",
          level: "info" as const,
        },
      ]

      const chosen = telemetryRandoms[Math.floor(Math.random() * telemetryRandoms.length)]
      const now = new Date()
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`

      setLogs((prev) => {
        // Keep logs bounded to max 40 items to prevent unbounded memory growth
        const next = [
          ...prev,
          {
            id: `ticker-${Date.now()}`,
            timestamp: timeStr,
            text: chosen.text,
            level: chosen.level,
          },
        ]
        return next.slice(-40)
      })
    }, 18000)

    return () => clearInterval(ambientTicker)
  }, [autoScroll])

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && scrollRef.current && !isCollapsed) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [logs, autoScroll, isCollapsed])

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (filterLevel === "objectives") return log.level === "objective" || log.level === "alert"
    if (filterLevel === "alerts") return log.level === "warning" || log.level === "alert"
    return true
  })

  // Position classes
  const positionClasses = isEmbedded
    ? "relative w-full"
    : {
        "bottom-right": "bottom-3 right-3 sm:bottom-4 sm:right-4",
        "bottom-left": "bottom-3 left-3 sm:bottom-4 sm:left-4",
        "top-right": "top-14 right-3 sm:top-16 sm:right-4",
        "top-left": "top-14 left-3 sm:top-16 sm:left-4",
      }[position || "bottom-right"]

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.text}`)
      .join("\n")
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClearLogs = () => {
    setLogs(DEFAULT_LOG_ENTRIES)
  }

  return (
    <div
      className={cn(
        isEmbedded ? "w-full font-mono text-xs select-none" : "fixed z-40 transition-all select-none font-mono",
        !isEmbedded && positionClasses,
        className,
      )}
    >
      {/* Collapsed Pill Button */}
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(false)}
          className={cn(
            "group flex items-center justify-between rounded-xs border border-cyan-500/60 bg-black/85 px-2.5 py-1.5 text-xs font-mono text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:bg-cyan-950/80 hover:border-cyan-400 transition-all cursor-pointer backdrop-blur-md",
            isEmbedded ? "w-full" : "",
          )}
          title="Mở bảng nhật ký nhiệm vụ chiến thuật (Terminal Mission Log)"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative flex items-center justify-center shrink-0">
              <Terminal className="size-3.5 text-cyan-400 animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-400" />
            </div>
            <span className="font-display text-[11px] font-bold uppercase tracking-wider text-white group-hover:text-cyan-200 truncate">
              NHẬT KÝ // TERMINAL
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {activeMission && (
              <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[8.5px] font-bold text-amber-300 border border-amber-500/40 animate-pulse">
                1 LIVE
              </span>
            )}
            <Maximize2 className="size-3 text-muted-foreground group-hover:text-white" />
          </div>
        </button>
      ) : (
        /* Full Expanded Terminal Window */
        <div
          className={cn(
            "relative flex flex-col rounded-xs border border-cyan-500/50 bg-panel/95 shadow-[0_0_35px_rgba(34,211,238,0.2)] backdrop-blur-md overflow-hidden animate-in fade-in duration-200",
            isEmbedded
              ? "w-full h-[260px] max-h-[35vh]"
              : "w-[320px] sm:w-[380px] h-[360px] max-h-[75vh]",
          )}
        >
          {/* Subtle CRT Scanlines Overlay inside Terminal */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.85)_50%)] bg-[length:100%_4px]" />

          {/* Sci-Fi Corner Brackets */}
          <div className="pointer-events-none absolute top-0 left-0 size-2 border-t-2 border-l-2 border-cyan-400" />
          <div className="pointer-events-none absolute top-0 right-0 size-2 border-t-2 border-r-2 border-cyan-400" />
          <div className="pointer-events-none absolute bottom-0 left-0 size-2 border-b-2 border-l-2 border-cyan-400" />
          <div className="pointer-events-none absolute bottom-0 right-0 size-2 border-b-2 border-r-2 border-cyan-400" />

          {/* Terminal Titlebar */}
          <div className="flex items-center justify-between border-b border-cyan-500/30 bg-black/80 px-2 py-1.5 shrink-0 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="flex items-center gap-1 shrink-0">
                <span className="size-1.5 rounded-full bg-cyan-400 animate-ping" />
                <Terminal className="size-3.5 text-cyan-400" />
              </div>
              <span className="font-display text-[10.5px] font-bold uppercase tracking-wider text-white truncate">
                MISSION LOG
              </span>
              <span className="rounded bg-cyan-950 px-1 font-mono text-[8px] font-bold text-cyan-300 border border-cyan-500/30 shrink-0">
                LIVE
              </span>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1 text-muted-foreground shrink-0">
              {onOpenFullLogs && (
                <button
                  onClick={onOpenFullLogs}
                  className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 text-[9px] font-bold transition-colors cursor-pointer"
                  title="Mở toàn màn hình xem Full Logs (Tùy chỉnh số dòng)"
                >
                  FULL LOGS
                </button>
              )}
              <button
                onClick={() => setAutoScroll((prev) => !prev)}
                className={cn(
                  "p-1 rounded hover:bg-white/10 hover:text-white transition-colors cursor-pointer",
                  autoScroll ? "text-cyan-400" : "text-muted-foreground",
                )}
                title={autoScroll ? "Tắt tự động cuộn (Auto-scroll: ON)" : "Bật tự động cuộn (Auto-scroll: OFF)"}
              >
                {autoScroll ? <Pause className="size-2.5" /> : <Play className="size-2.5" />}
              </button>
              <button
                onClick={handleCopyLogs}
                className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title="Sao chép nhật ký"
              >
                {copied ? <Check className="size-2.5 text-emerald-400" /> : <Copy className="size-2.5" />}
              </button>
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title="Thu nhỏ cửa sổ (Minimize)"
              >
                <Minimize2 className="size-2.5" />
              </button>
            </div>
          </div>

          {/* Active Mission Spotlight Pod (if active mission exists) */}
          {activeMission && (
            <div className="border-b border-amber-500/40 bg-amber-950/40 p-2 shrink-0">
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Target className="size-3.5 text-amber-400 shrink-0 animate-pulse" />
                  <div className="min-w-0">
                    <span className="font-display text-[11px] font-bold uppercase text-amber-300 truncate block">
                      {activeMission.title}
                    </span>
                    <span className="text-[9.5px] text-muted-foreground truncate block font-mono">
                      {activeMission.sectorName} · Cấp khuyến nghị {activeMission.recommendedLevel}+
                    </span>
                  </div>
                </div>

                {onNavigateMission && (
                  <button
                    onClick={() => onNavigateMission(activeMission.id)}
                    className="shrink-0 flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors cursor-pointer"
                  >
                    <span>Vào Trận</span>
                    <ArrowRight className="size-2.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex items-center justify-between border-b border-cyan-500/20 bg-black/40 px-2 py-1 text-[9.5px] shrink-0 font-mono">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Filter className="size-2.5 text-cyan-400" />
              <span>BỘ LỌC:</span>
              <button
                onClick={() => setFilterLevel("all")}
                className={cn(
                  "px-1 py-0.2 rounded hover:text-white cursor-pointer",
                  filterLevel === "all" ? "bg-cyan-900/60 text-cyan-300 font-bold" : "",
                )}
              >
                Tất Cả
              </button>
              <button
                onClick={() => setFilterLevel("objectives")}
                className={cn(
                  "px-1 py-0.2 rounded hover:text-white cursor-pointer",
                  filterLevel === "objectives" ? "bg-cyan-900/60 text-cyan-300 font-bold" : "",
                )}
              >
                Mục Tiêu
              </button>
              <button
                onClick={() => setFilterLevel("alerts")}
                className={cn(
                  "px-1 py-0.2 rounded hover:text-white cursor-pointer",
                  filterLevel === "alerts" ? "bg-cyan-900/60 text-cyan-300 font-bold" : "",
                )}
              >
                Cảnh Báo
              </button>
            </div>

            <button
              onClick={handleClearLogs}
              className="text-muted-foreground hover:text-white flex items-center gap-0.5 cursor-pointer"
              title="Khởi tạo lại log"
            >
              <RotateCcw className="size-2.5" />
              <span>Clear</span>
            </button>
          </div>

          {/* Scrolling Log Feed Content */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-2.5 space-y-2 text-[10.5px] leading-relaxed scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-black/40"
          >
            {filteredLogs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground font-mono text-[10px]">
                [KHÔNG CÓ DỮ LIỆU NHẬT KÝ THEO BỘ LỌC]
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isAlert = log.level === "alert"
                const isWarning = log.level === "warning"
                const isSuccess = log.level === "success"
                const isObjective = log.level === "objective"

                return (
                  <div
                    key={log.id}
                    className={cn(
                      "group rounded-xs border p-1.5 transition-colors font-mono",
                      isAlert
                        ? "border-red-500/50 bg-red-950/30 text-red-200"
                        : isWarning
                          ? "border-amber-500/40 bg-amber-950/30 text-amber-200"
                          : isSuccess
                            ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-200"
                            : isObjective
                              ? "border-cyan-500/40 bg-cyan-950/30 text-cyan-200"
                              : "border-border/40 bg-black/40 text-slate-300",
                    )}
                  >
                    {/* Timestamp & Tag Header */}
                    <div className="flex items-center justify-between text-[9px] mb-1 opacity-75">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">[{log.timestamp}]</span>
                        <span
                          className={cn(
                            "uppercase font-bold tracking-wider",
                            isAlert
                              ? "text-red-400"
                              : isWarning
                                ? "text-amber-400"
                                : isSuccess
                                  ? "text-emerald-400"
                                  : isObjective
                                    ? "text-cyan-400"
                                    : "text-muted-foreground",
                          )}
                        >
                          // {log.level}
                        </span>
                      </div>

                      {log.sector && (
                        <span className="text-cyan-400/90 truncate max-w-[120px]">
                          {log.sector}
                        </span>
                      )}
                    </div>

                    {/* Main Log Text */}
                    <div className="font-semibold text-white/90 break-words flex items-start gap-1">
                      <span className="text-cyan-400 shrink-0 font-bold">&gt;</span>
                      <span>{log.text}</span>
                    </div>

                    {/* Progress Bar (if available) */}
                    {log.progress && (
                      <div className="mt-1.5 space-y-0.5">
                        <div className="flex items-center justify-between text-[8.5px] text-muted-foreground">
                          <span>TIẾN ĐỘ THỰC HIỆN:</span>
                          <strong className="text-cyan-300">
                            {log.progress.current} / {log.progress.total} (
                            {Math.round((log.progress.current / log.progress.total) * 100)}%)
                          </strong>
                        </div>
                        <div className="h-1 w-full rounded-xs bg-black/60 overflow-hidden border border-border/40">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                            style={{
                              width: `${(log.progress.current / log.progress.total) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Additional Sub-details */}
                    {log.details && (
                      <div className="mt-1 text-[9px] text-muted-foreground italic border-t border-border/30 pt-0.5">
                        {log.details}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Terminal Bottom Command Prompt Bar */}
          <div className="flex items-center justify-between border-t border-cyan-500/30 bg-black/80 px-2 py-1 text-[9px] text-muted-foreground shrink-0 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">sf-core@terminal:~$</span>
              <span className="text-cyan-300 animate-pulse">_</span>
            </div>
            <span>PORT: 8084 // LINK OK</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default MissionLog
