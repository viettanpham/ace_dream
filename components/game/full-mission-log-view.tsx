"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Terminal,
  Filter,
  Copy,
  Check,
  RotateCcw,
  Search,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  ArrowDown,
  ArrowUp,
  Radio,
  Target,
  Sparkles,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Shield,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { CampaignMission, StarfrontProgression } from "@/lib/game/types"
import type { MissionLogEntry, MissionLogLevel } from "./mission-log"

export interface FullMissionLogViewProps {
  entries?: MissionLogEntry[]
  activeMission?: CampaignMission | null
  progression?: StarfrontProgression | null
  onNavigateMission?: (missionId?: string) => void
  onNavigateSection?: (section: string) => void
  className?: string
}

const DEFAULT_FULL_LOGS: MissionLogEntry[] = [
  {
    id: "boot-01",
    timestamp: "00:00:01",
    text: "STARFRONT CENTRAL COMMAND KERNEL INITIALIZED // PROTOCOL Q-NET",
    level: "info",
    details: "Phân vùng bộ nhớ lượng tử: 64 TB · Băng thông vi mạch: 400 Gbps",
  },
  {
    id: "boot-02",
    timestamp: "00:00:03",
    text: "HỆ THỐNG TRUYỀN DẪN QUANG HỌC HẠM ĐỘI: ONLINE (ORBITAL LINK: 99.8%)",
    level: "success",
    sector: "Vành Đai Asteroid",
  },
  {
    id: "boot-03",
    timestamp: "00:00:06",
    text: "CẢNH BÁO TÁC CHIẾN: PHÁT HIỆN BIỆT ĐỘI DRONE DO THÁM TẠI TỌA ĐỘ VÀNH ĐAI X-44",
    level: "warning",
    sector: "Vành Đai Asteroid",
    missionCode: "m1-1",
  },
  {
    id: "boot-04",
    timestamp: "00:00:10",
    text: "MỤC TIÊU CHIẾN DỊCH: HOÀN TẤT 5 NHIỆM VỤ ĐỂ MỞ KHÓA HOÁN ĐỔI CHIẾN CƠ & HANGAR NÂNG CẤP",
    level: "objective",
    progress: { current: 1, total: 5 },
  },
  {
    id: "boot-05",
    timestamp: "00:00:15",
    text: "CHỈ SỐ THỰC CHIẾN ĐÃ ĐỒNG BỘ: KHIÊN (SHIELD), ĐỘNG CƠ (ENGINE) VÀ HỎA LỰC (WEAPON POWER)",
    level: "info",
  },
  {
    id: "boot-06",
    timestamp: "00:00:22",
    text: "TRẠM CHỈ HUY ORION: GỬI GÓI TIẾP TẾ TÍN DỤNG VÀ HỢP KIM ALLOY",
    level: "success",
  },
  {
    id: "boot-07",
    timestamp: "00:00:28",
    text: "THÔNG BÁO TÁC CHIẾN: CÁC KHU VỰC SECTOR-2 VÀ SECTOR-3 ĐANG THEO DÕI ĐỘNG THÁI HẠM ĐỘI ĐỊCH",
    level: "info",
    sector: "Căn Cứ Orion",
  },
  {
    id: "boot-08",
    timestamp: "00:00:35",
    text: "CẢNH BÁO NGUY HIỂM: RAIDER-MECH XUẤT HIỆN TẠI VÙNG TỐI CYGNUS (MỨC ĐE DỌA CAO)",
    level: "alert",
    sector: "Vùng Tối Cygnus",
    missionCode: "m2-3",
  },
]

export function FullMissionLogView({
  entries: propEntries,
  activeMission,
  progression,
  onNavigateMission,
  onNavigateSection,
  className,
}: FullMissionLogViewProps) {
  // Configurable line limit (default: 100, options: 50, 100, 200, 500, 1000)
  const [lineLimit, setLineLimit] = useState<number>(100)
  const [filterLevel, setFilterLevel] = useState<"all" | MissionLogLevel>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [autoScroll, setAutoScroll] = useState(false)
  const [copied, setCopied] = useState(false)
  const [logs, setLogs] = useState<MissionLogEntry[]>(() => {
    return propEntries && propEntries.length > 0 ? propEntries : DEFAULT_FULL_LOGS
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

    const completed = progression.missionStats?.completedIds?.length ?? 0
    const wonBattles = progression.combatStats?.battlesWon ?? 0

    const dynamicEntries: MissionLogEntry[] = []

    if (activeMission) {
      dynamicEntries.push({
        id: `act-${activeMission.id}`,
        timestamp: "LIVE-ACT",
        text: `CHIẾN DỊCH ĐANG KÍCH HOẠT: [${activeMission.title.toUpperCase()}] TẠI ${activeMission.sectorName.toUpperCase()}`,
        level: "alert",
        sector: activeMission.sectorName,
        missionCode: activeMission.id,
        details: `Cấp khuyến nghị: Lv.${activeMission.recommendedLevel}+ · Thưởng: ${activeMission.firstClearReward.credits} Tín dụng, ${activeMission.firstClearReward.exp} EXP`,
      })
    }

    dynamicEntries.push({
      id: `prog-cleared-${completed}`,
      timestamp: "TELEMETRY",
      text: `TIẾN ĐỘ NHIỆM VỤ: ĐÃ VƯỢT QUA ${completed}/5 NHIỆM VỤ YÊU CẦU ĐỂ KHÓA/MỞ HOÁN ĐỔI`,
      level: completed >= 5 ? "success" : "objective",
      progress: { current: Math.min(5, completed), total: 5 },
    })

    dynamicEntries.push({
      id: `prog-battles-${wonBattles}`,
      timestamp: "TELEMETRY",
      text: `LỊCH SỬ ĐẤU TRƯỜNG: ${wonBattles} CHIẾN THẮNG ĐỐI KHÁNG TRỰC TIẾP`,
      level: wonBattles > 0 ? "success" : "info",
    })

    if (progression.activePairing?.isLocked) {
      dynamicEntries.push({
        id: "status-locked-full",
        timestamp: "STATUS",
        text: `TỔ HỢP TÁC CHIẾN ĐÃ KHÓA: PHI CÔNG [${progression.activePairing.pilotId.toUpperCase()}] & CƠ GIÁP [${progression.activeGearId.toUpperCase()}]`,
        level: "success",
      })
    } else {
      dynamicEntries.push({
        id: "status-unlocked-full",
        timestamp: "CẢNH BÁO",
        text: "CHƯA KHÓA TỔ HỢP TÁC CHIẾN! VUI LÒNG HOÀN TẤT BƯỚC 1-2-3 ĐỂ MỞ TOÀN BỘ PHÂN HỆ.",
        level: "warning",
      })
    }

    setLogs((prev) => {
      const existingIds = new Set(prev.map((e) => e.id))
      const toAdd = dynamicEntries.filter((e) => !existingIds.has(e.id))
      if (toAdd.length === 0) return prev
      return [...prev, ...toAdd]
    })
  }, [activeMission, progression])

  // Periodic ambient simulation updates
  useEffect(() => {
    const ambientTicker = setInterval(() => {
      const telemetryPool = [
        { text: "BÁO CÁO RADAR QUANG HỌC: Không có chuyển động đột xuất trong bán kính 100 AU.", level: "info" as const },
        { text: "TẢI NHIỆT ĐỘNG CƠ WARP: Dao động ở mức 38°C (Trạng thái lạnh tối ưu).", level: "success" as const },
        { text: "HỆ THỐNG PHÂN MẢNH TINH THỂ: Trạm sạc năng lượng Solar Array nạp đầy 100%.", level: "info" as const },
        { text: "KÊNH TRUYỀN TIN LIÊN KẾT: Tín hiệu mã hóa lượng tử đã tái khóa bảo mật.", level: "info" as const },
        { text: "PHÁT HIỆN SÓNG TẦNG THẤP: Có thể là tàu khảo sát không người lái trôi dạt.", level: "warning" as const },
      ]

      const chosen = telemetryPool[Math.floor(Math.random() * telemetryPool.length)]
      const now = new Date()
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`

      setLogs((prev) => {
        const next = [
          ...prev,
          {
            id: `ticker-${Date.now()}`,
            timestamp: timeStr,
            text: chosen.text,
            level: chosen.level,
          },
        ]
        // Cap overall memory buffer to 1200 items
        return next.slice(-1200)
      })
    }, 12000)

    return () => clearInterval(ambientTicker)
  }, [])

  // Auto-scroll when enabled
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [logs, autoScroll])

  // Filter logs by level and search query
  const filteredLogs = useMemo(() => {
    let result = logs

    if (filterLevel !== "all") {
      result = result.filter((l) => l.level === filterLevel)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (l) =>
          l.text.toLowerCase().includes(q) ||
          l.sector?.toLowerCase().includes(q) ||
          l.details?.toLowerCase().includes(q) ||
          l.missionCode?.toLowerCase().includes(q),
      )
    }

    // Apply Line Limit (XXX dòng)
    return result.slice(-lineLimit)
  }, [logs, filterLevel, searchQuery, lineLimit])

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.text}${l.details ? ` (${l.details})` : ""}`)
      .join("\n")
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClearLogs = () => {
    setLogs(DEFAULT_FULL_LOGS)
  }

  const statsCount = useMemo(() => {
    return {
      all: logs.length,
      objective: logs.filter((l) => l.level === "objective").length,
      alert: logs.filter((l) => l.level === "alert").length,
      warning: logs.filter((l) => l.level === "warning").length,
      success: logs.filter((l) => l.level === "success").length,
      info: logs.filter((l) => l.level === "info").length,
    }
  }, [logs])

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-sm border border-cyan-500/50 bg-panel/90 shadow-2xl backdrop-blur-md overflow-hidden font-mono",
        className,
      )}
    >
      {/* Sci-Fi CRT Lines Overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.85)_50%)] bg-[length:100%_4px]" />

      {/* Sci-Fi Decorative Corner Brackets */}
      <div className="pointer-events-none absolute top-0 left-0 size-3 border-t-2 border-l-2 border-cyan-400" />
      <div className="pointer-events-none absolute top-0 right-0 size-3 border-t-2 border-r-2 border-cyan-400" />
      <div className="pointer-events-none absolute bottom-0 left-0 size-3 border-b-2 border-l-2 border-cyan-400" />
      <div className="pointer-events-none absolute bottom-0 right-0 size-3 border-b-2 border-r-2 border-cyan-400" />

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/40 bg-black/70 p-3 sm:p-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex size-9 items-center justify-center rounded-xs border border-cyan-500/60 bg-cyan-950/80 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]">
            <Terminal className="size-4.5 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-base sm:text-lg font-bold uppercase tracking-wider text-white">
                NHẬT KÝ TỔNG HỢP NHIỆM VỤ // FULL MISSION TELEMETRY LOG
              </h1>
              <span className="rounded bg-cyan-950/80 px-2 py-0.5 text-[9.5px] font-mono font-bold text-cyan-300 border border-cyan-500/40">
                CONSOLE BUFFER
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Theo dõi và kiểm tra toàn bộ luồng thông báo tác chiến hạm đội, nhiệm vụ thực hiện và phân tích trạng thái thời gian thực.
            </p>
          </div>
        </div>

        {/* Global Controls & Limit Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Line Limit Selector (xxx dòng) */}
          <div className="flex items-center gap-1.5 rounded-sm border border-cyan-500/40 bg-black/60 px-2.5 py-1 text-xs">
            <SlidersHorizontal className="size-3.5 text-cyan-400" />
            <span className="text-muted-foreground text-[11px]">GIỚI HẠN:</span>
            <select
              value={lineLimit}
              onChange={(e) => setLineLimit(Number(e.target.value))}
              aria-label="Giới hạn số dòng hiển thị"
              className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value={30} className="bg-slate-900 text-white">30 dòng</option>
              <option value={50} className="bg-slate-900 text-white">50 dòng</option>
              <option value={100} className="bg-slate-900 text-white">100 dòng</option>
              <option value={200} className="bg-slate-900 text-white">200 dòng</option>
              <option value={500} className="bg-slate-900 text-white">500 dòng</option>
              <option value={1000} className="bg-slate-900 text-white">1000 dòng</option>
            </select>
          </div>

          {/* Auto Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={cn(
              "flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs transition-colors cursor-pointer",
              autoScroll
                ? "border-cyan-400 bg-cyan-950/70 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.25)]"
                : "border-border/60 bg-black/40 text-muted-foreground hover:text-white",
            )}
            title={autoScroll ? "Tắt tự động cuộn (Auto-Scroll: BẬT)" : "Bật tự động cuộn (Auto-Scroll: TẮT)"}
          >
            {autoScroll ? <Pause className="size-3 text-cyan-400" /> : <Play className="size-3" />}
            <span>{autoScroll ? "Tự Cuộn: Bật" : "Tự Cuộn: Tắt"}</span>
          </button>

          {/* Copy Logs */}
          <button
            onClick={handleCopyLogs}
            className="flex items-center gap-1.5 rounded-sm border border-border/60 bg-black/40 px-2.5 py-1 text-xs text-muted-foreground hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
            title="Sao chép toàn bộ nhật ký đang hiển thị"
          >
            {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
            <span>{copied ? "Đã chép" : "Sao chép"}</span>
          </button>

          {/* Clear Logs */}
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-1.5 rounded-sm border border-border/60 bg-black/40 px-2.5 py-1 text-xs text-muted-foreground hover:text-red-400 hover:border-red-500/50 transition-colors cursor-pointer"
            title="Xóa bộ đệm log về mặc định"
          >
            <RotateCcw className="size-3" />
            <span>Khởi tạo lại</span>
          </button>
        </div>
      </div>

      {/* Active Mission Banner (If active) */}
      {activeMission && (
        <div className="border-b border-amber-500/40 bg-amber-950/40 p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Target className="size-4 text-amber-400 animate-pulse shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xs sm:text-sm font-bold uppercase text-amber-300">
                  NHIỆM VỤ ĐANG HOẠT ĐỘNG: {activeMission.title}
                </span>
                <span className="rounded bg-black/60 px-1.5 py-0.2 font-mono text-[9.5px] font-bold text-amber-400 border border-amber-500/50">
                  {activeMission.sectorName}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Cấp khuyến nghị {activeMission.recommendedLevel}+ · Thưởng lượt đầu: {activeMission.firstClearReward.credits} Tín dụng, {activeMission.firstClearReward.exp} EXP
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (onNavigateMission) onNavigateMission(activeMission.id)
              else if (onNavigateSection) onNavigateSection("battlefield")
            }}
            className="flex items-center gap-1.5 rounded bg-amber-500/20 px-3 py-1.5 font-display text-xs font-bold text-amber-300 border border-amber-400/60 hover:bg-amber-500/30 transition-colors cursor-pointer shadow-md"
          >
            <span>Vào Trận Ngay</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="border-b border-cyan-500/25 bg-black/50 p-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-muted-foreground mr-1 text-[11px]">LỌC THEO PHÂN LOẠI:</span>

          <button
            onClick={() => setFilterLevel("all")}
            className={cn(
              "rounded px-2 py-1 text-[11px] font-mono transition-colors cursor-pointer",
              filterLevel === "all"
                ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 font-bold"
                : "text-muted-foreground hover:bg-white/5 hover:text-white",
            )}
          >
            Tất Cả ({statsCount.all})
          </button>

          <button
            onClick={() => setFilterLevel("objective")}
            className={cn(
              "rounded px-2 py-1 text-[11px] font-mono transition-colors cursor-pointer",
              filterLevel === "objective"
                ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400 font-bold"
                : "text-muted-foreground hover:bg-white/5 hover:text-white",
            )}
          >
            Mục Tiêu ({statsCount.objective})
          </button>

          <button
            onClick={() => setFilterLevel("alert")}
            className={cn(
              "rounded px-2 py-1 text-[11px] font-mono transition-colors cursor-pointer",
              filterLevel === "alert"
                ? "bg-red-500/30 text-red-200 border border-red-400 font-bold"
                : "text-muted-foreground hover:bg-white/5 hover:text-white",
            )}
          >
            Nguy Hiểm ({statsCount.alert})
          </button>

          <button
            onClick={() => setFilterLevel("warning")}
            className={cn(
              "rounded px-2 py-1 text-[11px] font-mono transition-colors cursor-pointer",
              filterLevel === "warning"
                ? "bg-amber-500/30 text-amber-200 border border-amber-400 font-bold"
                : "text-muted-foreground hover:bg-white/5 hover:text-white",
            )}
          >
            Cảnh Báo ({statsCount.warning})
          </button>

          <button
            onClick={() => setFilterLevel("success")}
            className={cn(
              "rounded px-2 py-1 text-[11px] font-mono transition-colors cursor-pointer",
              filterLevel === "success"
                ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400 font-bold"
                : "text-muted-foreground hover:bg-white/5 hover:text-white",
            )}
          >
            Thành Công ({statsCount.success})
          </button>

          <button
            onClick={() => setFilterLevel("info")}
            className={cn(
              "rounded px-2 py-1 text-[11px] font-mono transition-colors cursor-pointer",
              filterLevel === "info"
                ? "bg-slate-700/60 text-slate-200 border border-slate-500 font-bold"
                : "text-muted-foreground hover:bg-white/5 hover:text-white",
            )}
          >
            Thông Tin ({statsCount.info})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] sm:min-w-[240px]">
          <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo từ khóa, sector..."
            className="w-full rounded-sm border border-border/60 bg-black/60 pl-8 pr-3 py-1 text-xs text-white placeholder:text-muted-foreground/60 focus:border-cyan-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1.5 text-muted-foreground hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Logs Table / Feed Body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 min-h-[420px] max-h-[65vh] scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-black/40"
      >
        {filteredLogs.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <Terminal className="size-8 mx-auto mb-2 opacity-40 text-cyan-400" />
            <p className="text-xs">[KHÔNG CÓ DÒNG NHẬT KÝ NÀO PHÙ HỢP VỚI BỘ LỌC HOẶC TỪ KHÓA TÌM KIẾM]</p>
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            const isAlert = log.level === "alert"
            const isWarning = log.level === "warning"
            const isSuccess = log.level === "success"
            const isObjective = log.level === "objective"

            return (
              <div
                key={log.id}
                className={cn(
                  "group relative rounded-sm border p-2.5 transition-all",
                  isAlert
                    ? "border-red-500/50 bg-red-950/25 text-red-200"
                    : isWarning
                      ? "border-amber-500/40 bg-amber-950/25 text-amber-200"
                      : isSuccess
                        ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-200"
                        : isObjective
                          ? "border-cyan-500/40 bg-cyan-950/25 text-cyan-200"
                          : "border-border/40 bg-black/50 text-slate-300",
                )}
              >
                {/* Header: Timestamp, Level Badge, Sector & Line Index */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-bold">#{filteredLogs.length - idx}</span>
                    <span className="text-muted-foreground">[{log.timestamp}]</span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.2 uppercase font-bold tracking-wider text-[9px] border",
                        isAlert
                          ? "bg-red-950/80 text-red-300 border-red-500/50"
                          : isWarning
                            ? "bg-amber-950/80 text-amber-300 border-amber-500/50"
                            : isSuccess
                              ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
                              : isObjective
                                ? "bg-cyan-950/80 text-cyan-300 border-cyan-500/50"
                                : "bg-black/60 text-slate-400 border-border/40",
                      )}
                    >
                      {log.level}
                    </span>

                    {log.missionCode && (
                      <span className="rounded bg-black/60 px-1 py-0.2 font-mono text-[9px] text-cyan-400 border border-cyan-500/40">
                        CODE: {log.missionCode}
                      </span>
                    )}
                  </div>

                  {log.sector && (
                    <span className="text-cyan-400 font-bold text-[10px] flex items-center gap-1">
                      <Radio className="size-2.5 animate-pulse" />
                      <span>{log.sector}</span>
                    </span>
                  )}
                </div>

                {/* Primary Text */}
                <div className="text-xs font-semibold text-white/95 leading-relaxed flex items-start gap-1.5">
                  <span className="text-cyan-400 shrink-0 font-bold">&gt;</span>
                  <span className="break-words">{log.text}</span>
                </div>

                {/* Progress bar if present */}
                {log.progress && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>MỨC ĐỘ HOÀN THÀNH TIẾN ĐỘ:</span>
                      <strong className="text-cyan-300 font-mono">
                        {log.progress.current} / {log.progress.total} (
                        {Math.round((log.progress.current / log.progress.total) * 100)}%)
                      </strong>
                    </div>
                    <div className="h-1.5 w-full rounded-xs bg-black/80 overflow-hidden border border-border/50">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                        style={{
                          width: `${(log.progress.current / log.progress.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Additional Details */}
                {log.details && (
                  <div className="mt-1.5 text-[10.5px] text-muted-foreground/90 border-t border-border/40 pt-1 leading-normal italic">
                    {log.details}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Footer Ticker & Information */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-cyan-500/30 bg-black/80 px-3 py-2 text-[10.5px] text-muted-foreground shrink-0 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold">sf-core@full-telemetry:~$</span>
          <span>ĐANG HIỂN THỊ: <strong className="text-white">{filteredLogs.length}</strong> / {logs.length} DÒNG</span>
        </div>

        <div className="flex items-center gap-3">
          <span>GIỚI HẠN: <strong className="text-cyan-300">{lineLimit} DÒNG</strong></span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400">STATUS: BUFFER NOMINAL</span>
        </div>
      </div>
    </div>
  )
}

export default FullMissionLogView
