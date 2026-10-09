"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import type { CombatLogItem, CombatLogType } from "@/lib/game/types"
import { cn } from "@/lib/utils"
import {
  Terminal,
  Filter,
  ArrowDown,
  ArrowUp,
  Sparkles,
  Sword,
  Shield,
  ShieldAlert,
  Flame,
  Zap,
  AlertTriangle,
  Trophy,
  Skull,
  Search,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Target,
  Play,
  Pause,
  Layers,
  User,
  Bot,
  Activity,
} from "lucide-react"

export type LogFilterCategory = "all" | "combat" | "status" | "boss" | "outcome"
export type LogActorFilter = "all" | "player" | "enemy" | "system"

interface CombatLogPanelProps {
  logs: CombatLogItem[]
  currentTurn?: number
  className?: string
  playerUnitName?: string
  enemyUnitName?: string
}

export function CombatLogPanel({
  logs,
  currentTurn,
  className,
  playerUnitName,
  enemyUnitName,
}: CombatLogPanelProps) {
  const [filterCategory, setFilterCategory] = useState<LogFilterCategory>("all")
  const [actorFilter, setActorFilter] = useState<LogActorFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const [hasNewLogsBelow, setHasNewLogsBelow] = useState(false)
  const [copied, setCopied] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const lastScrollTopRef = useRef<number>(0)
  const prevLogsLengthRef = useRef<number>(logs.length)

  // Lọc danh sách nhật ký theo chuyên mục, đối tượng và từ khóa tìm kiếm
  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      // 1. Lọc theo danh mục
      if (filterCategory === "combat") {
        if (!["player-action", "enemy-action", "damage", "crit", "evade"].includes(item.type)) {
          return false
        }
      } else if (filterCategory === "status") {
        if (item.type !== "status") return false
      } else if (filterCategory === "boss") {
        if (!["boss-telegraph", "system"].includes(item.type)) return false
      } else if (filterCategory === "outcome") {
        if (!["victory", "defeat"].includes(item.type)) return false
      }

      // 2. Lọc theo đối tượng hành động (Actor)
      if (actorFilter === "player") {
        const isPlayer =
          item.type === "player-action" ||
          (playerUnitName && item.actorName?.toLowerCase().includes(playerUnitName.toLowerCase())) ||
          (item.actorName && !["HỆ THỐNG", "HIỆU ỨNG"].includes(item.actorName) && item.type !== "enemy-action")
        if (!isPlayer && item.type !== "player-action") return false
      } else if (actorFilter === "enemy") {
        const isEnemy =
          item.type === "enemy-action" ||
          (enemyUnitName && item.actorName?.toLowerCase().includes(enemyUnitName.toLowerCase()))
        if (!isEnemy && item.type !== "enemy-action") return false
      } else if (actorFilter === "system") {
        if (!["system", "boss-telegraph", "status", "damage"].includes(item.type)) return false
      }

      // 3. Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchText = item.text.toLowerCase().includes(query)
        const matchActor = item.actorName?.toLowerCase().includes(query)
        const matchTarget = item.targetName?.toLowerCase().includes(query)
        const matchTurn = `lượt ${item.turn}`.includes(query) || `turn ${item.turn}`.includes(query)
        return matchText || matchActor || matchTarget || matchTurn
      }

      return true
    })
  }, [logs, filterCategory, actorFilter, searchQuery, playerUnitName, enemyUnitName])

  // Tự động cuộn xuống dưới cùng khi có sự kiện mới nếu autoScroll bật
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    if (logs.length > prevLogsLengthRef.current) {
      if (autoScroll) {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
        setHasNewLogsBelow(false)
      } else {
        setHasNewLogsBelow(true)
      }
    }
    prevLogsLengthRef.current = logs.length
  }, [logs.length, autoScroll])

  // Phát hiện người dùng chủ động cuộn lên
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return

    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 35
    if (isAtBottom) {
      setAutoScroll(true)
      setHasNewLogsBelow(false)
    } else if (el.scrollTop < lastScrollTopRef.current) {
      // Đang cuộn lên
      setAutoScroll(false)
    }
    lastScrollTopRef.current = el.scrollTop
  }

  // Cuộn ngay xuống dưới cùng
  const scrollToBottom = () => {
    const el = scrollRef.current
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
      setAutoScroll(true)
      setHasNewLogsBelow(false)
    }
  }

  // Cuộn lên đầu
  const scrollToTop = () => {
    const el = scrollRef.current
    if (el) {
      el.scrollTo({ top: 0, behavior: "smooth" })
      setAutoScroll(false)
    }
  }

  // Sao chép toàn bộ nhật ký
  const handleCopyLogs = () => {
    const textContent = logs
      .map((l) => `[${l.timestamp} - Lượt #${l.turn}] [${l.type.toUpperCase()}] ${l.text}`)
      .join("\n")
    navigator.clipboard.writeText(textContent).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Lấy biểu tượng và kiểu dáng theo loại sự kiện
  const getItemBadge = (item: CombatLogItem) => {
    switch (item.type) {
      case "player-action":
        return {
          icon: Sword,
          badge: "TẤN CÔNG",
          badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          textColor: "text-cyan-200",
          borderColor: "border-cyan-500/20",
        }
      case "enemy-action":
        return {
          icon: Target,
          badge: "ĐỊCH TẤN CÔNG",
          badgeColor: "bg-red-500/20 text-red-300 border-red-500/40",
          textColor: "text-red-200",
          borderColor: "border-red-500/20",
        }
      case "crit":
        return {
          icon: Flame,
          badge: "BẠO KÍCH 🔥",
          badgeColor: "bg-amber-500/25 text-amber-300 border-amber-400/60 font-bold animate-pulse",
          textColor: "text-amber-200 font-bold",
          borderColor: "border-amber-400/30 bg-amber-950/20",
        }
      case "evade":
        return {
          icon: Zap,
          badge: "NÉ TRÁNH 💨",
          badgeColor: "bg-sky-500/25 text-sky-300 border-sky-400/50 font-bold",
          textColor: "text-sky-200 font-semibold",
          borderColor: "border-sky-500/30",
        }
      case "status":
        return {
          icon: Shield,
          badge: "HIỆU ỨNG ⚡",
          badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
          textColor: "text-emerald-200",
          borderColor: "border-emerald-500/20",
        }
      case "boss-telegraph":
        return {
          icon: AlertTriangle,
          badge: "BÁO ĐỘNG 🚨",
          badgeColor: "bg-red-500/30 text-red-300 border-red-400 font-bold animate-pulse",
          textColor: "text-red-200 font-bold",
          borderColor: "border-red-500/50 bg-red-950/30",
        }
      case "victory":
        return {
          icon: Trophy,
          badge: "CHIẾN THẮNG 🏆",
          badgeColor: "bg-emerald-500/30 text-emerald-300 border-emerald-400 font-bold",
          textColor: "text-emerald-300 font-bold text-sm",
          borderColor: "border-emerald-400/60 bg-emerald-950/30",
        }
      case "defeat":
        return {
          icon: Skull,
          badge: "THẤT BẠI 💀",
          badgeColor: "bg-red-500/30 text-red-300 border-red-500 font-bold",
          textColor: "text-red-400 font-bold text-sm",
          borderColor: "border-red-500/60 bg-red-950/30",
        }
      case "damage":
        return {
          icon: Zap,
          badge: "SÁT THƯƠNG",
          badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/40",
          textColor: "text-orange-200",
          borderColor: "border-orange-500/20",
        }
      case "system":
      default:
        return {
          icon: Terminal,
          badge: "HỆ THỐNG",
          badgeColor: "bg-secondary text-muted-foreground border-border/60",
          textColor: "text-muted-foreground",
          borderColor: "border-border/30",
        }
    }
  }

  // Thống kê nhanh theo từng loại
  const stats = useMemo(() => {
    let combatCount = 0
    let statusCount = 0
    let bossCount = 0
    let outcomeCount = 0
    for (const item of logs) {
      if (["player-action", "enemy-action", "damage", "crit", "evade"].includes(item.type)) {
        combatCount++
      } else if (item.type === "status") {
        statusCount++
      } else if (["boss-telegraph", "system"].includes(item.type)) {
        bossCount++
      } else if (["victory", "defeat"].includes(item.type)) {
        outcomeCount++
      }
    }
    return { combatCount, statusCount, bossCount, outcomeCount }
  }, [logs])

  return (
    <div
      className={cn(
        "relative rounded-sm border border-border/80 bg-panel/90 shadow-2xl backdrop-blur-md transition-all flex flex-col",
        isExpanded ? "h-[480px]" : "h-72",
        className,
      )}
    >
      {/* 1. Header Bảng Nhật Ký */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-black/40 px-3.5 py-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-6 items-center justify-center rounded-xs bg-cyan-950/80 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            <Terminal className="size-3.5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-cyan-200">
                NHẬT KÝ CHIẾN TRƯỜNG // RADAR FEED
              </h4>
              <span className="flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-400/30 px-1.5 py-0.2">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[9px] font-bold text-emerald-300">LIVE FEED</span>
              </span>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground">
              {logs.length} sự kiện {currentTurn ? `· Lượt #${currentTurn}` : ""}
            </p>
          </div>
        </div>

        {/* Thanh công cụ phụ: Cuộn tự động, Sao chép, Mở rộng */}
        <div className="flex items-center gap-1.5">
          {/* Nút Khóa / Mở Cuộn Tự Động */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? "Tự động cuộn đang BẬT (bấm để tạm dừng)" : "Tự động cuộn đang TẮT (bấm để tự động bám theo)"}
            className={cn(
              "flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-mono transition-colors cursor-pointer",
              autoScroll
                ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-300"
                : "border-border/60 bg-panel/60 text-muted-foreground hover:text-foreground",
            )}
          >
            {autoScroll ? <Play className="size-2.5 fill-current" /> : <Pause className="size-2.5" />}
            <span>{autoScroll ? "Bám theo" : "Tạm dừng"}</span>
          </button>

          {/* Cuộn lên đầu / Cuộn xuống đáy */}
          <button
            onClick={scrollToTop}
            title="Cuộn lên đầu trang"
            className="flex size-6 items-center justify-center rounded border border-border/60 bg-panel/60 text-muted-foreground hover:text-foreground hover:border-cyan-400 transition-colors cursor-pointer"
          >
            <ArrowUp className="size-3" />
          </button>

          <button
            onClick={scrollToBottom}
            title="Cuộn xuống cuối trang"
            className="flex size-6 items-center justify-center rounded border border-border/60 bg-panel/60 text-muted-foreground hover:text-foreground hover:border-cyan-400 transition-colors cursor-pointer"
          >
            <ArrowDown className="size-3" />
          </button>

          {/* Sao chép toàn bộ nhật ký */}
          <button
            onClick={handleCopyLogs}
            title="Sao chép toàn bộ nhật ký vào bộ nhớ tạm"
            className="flex items-center gap-1 rounded border border-border/60 bg-panel/60 px-2 py-1 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:border-cyan-400 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="size-3 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Đã chép!</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span className="hidden sm:inline">Sao chép</span>
              </>
            )}
          </button>

          {/* Mở rộng / Thu nhỏ kích thước */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Thu nhỏ bảng nhật ký" : "Mở rộng bảng nhật ký"}
            className="flex size-6 items-center justify-center rounded border border-border/60 bg-panel/60 text-muted-foreground hover:text-foreground hover:border-cyan-400 transition-colors cursor-pointer"
          >
            {isExpanded ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
          </button>
        </div>
      </div>

      {/* 2. Thanh Lọc Chuyên Mục & Tìm Kiếm */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 bg-black/25 px-3 py-1.5 text-xs">
        {/* Bộ lọc theo danh mục sự kiện */}
        <div className="flex flex-wrap items-center gap-1 font-mono text-[11px]">
          <button
            onClick={() => setFilterCategory("all")}
            className={cn(
              "rounded px-2 py-0.5 transition-colors cursor-pointer border",
              filterCategory === "all"
                ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/60 font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Tất cả ({logs.length})
          </button>

          <button
            onClick={() => setFilterCategory("combat")}
            className={cn(
              "rounded px-2 py-0.5 transition-colors cursor-pointer border",
              filterCategory === "combat"
                ? "bg-red-500/20 text-red-200 border-red-400/60 font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Tấn công & Sát thương ({stats.combatCount})
          </button>

          <button
            onClick={() => setFilterCategory("status")}
            className={cn(
              "rounded px-2 py-0.5 transition-colors cursor-pointer border",
              filterCategory === "status"
                ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/60 font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Hiệu ứng & Trạng thái ({stats.statusCount})
          </button>

          <button
            onClick={() => setFilterCategory("boss")}
            className={cn(
              "rounded px-2 py-0.5 transition-colors cursor-pointer border",
              filterCategory === "boss"
                ? "bg-amber-500/20 text-amber-200 border-amber-400/60 font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Cảnh báo Boss ({stats.bossCount})
          </button>

          {stats.outcomeCount > 0 && (
            <button
              onClick={() => setFilterCategory("outcome")}
              className={cn(
                "rounded px-2 py-0.5 transition-colors cursor-pointer border",
                filterCategory === "outcome"
                  ? "bg-purple-500/20 text-purple-200 border-purple-400/60 font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              Kết quả ({stats.outcomeCount})
            </button>
          )}
        </div>

        {/* Ô tìm kiếm nhanh */}
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-2 size-3 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm sự kiện, kỹ năng..."
            className="h-6 w-36 sm:w-48 rounded border border-border/50 bg-black/50 pl-7 pr-2 font-mono text-[10px] text-foreground placeholder:text-muted-foreground/60 focus:border-cyan-400 focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-1 text-[10px] text-muted-foreground hover:text-foreground px-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. Danh Sách Sự Kiện Có Thể Cuộn (Scrollable Combat Stream) */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1.5 scroll-smooth"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground py-8">
            <Filter className="size-6 opacity-40 mb-1" />
            <p className="text-[11px]">Không tìm thấy sự kiện nào phù hợp với bộ lọc hiện tại.</p>
            {(searchQuery || filterCategory !== "all" || actorFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("")
                  setFilterCategory("all")
                  setActorFilter("all")
                }}
                className="mt-1.5 text-[10px] text-cyan-400 underline cursor-pointer"
              >
                Đặt lại toàn bộ bộ lọc
              </button>
            )}
          </div>
        ) : (
          filteredLogs.map((item) => {
            const badgeMeta = getItemBadge(item)
            const BadgeIcon = badgeMeta.icon

            return (
              <div
                key={item.id}
                className={cn(
                  "group relative flex items-start gap-2 rounded-xs border bg-black/40 px-2.5 py-1.5 transition-all hover:bg-black/60",
                  badgeMeta.borderColor,
                )}
              >
                {/* Thời gian & Vòng đấu */}
                <div className="flex shrink-0 items-center gap-1 font-mono text-[10px] text-muted-foreground/70 pt-0.5">
                  <span suppressHydrationWarning className="tabular-nums">
                    [{item.timestamp}]
                  </span>
                  <span className="rounded bg-secondary/60 px-1 py-0.2 text-[9px] font-bold text-foreground">
                    #{item.turn}
                  </span>
                </div>

                {/* Huy hiệu phân loại sự kiện */}
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.2 text-[9px] font-bold font-display uppercase tracking-wider",
                    badgeMeta.badgeColor,
                  )}
                >
                  <BadgeIcon className="size-2.5 shrink-0" />
                  <span>{badgeMeta.badge}</span>
                </span>

                {/* Nội dung chi tiết sự kiện */}
                <span className={cn("flex-1 leading-relaxed break-words", badgeMeta.textColor)}>
                  {item.text}
                </span>

                {/* Tag lượng sát thương hoặc giá trị nếu có */}
                {item.value !== undefined && item.value > 0 && (
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.2 font-mono text-[10px] font-bold border",
                      item.type === "crit"
                        ? "bg-amber-950/80 border-amber-400/60 text-amber-300 animate-pulse"
                        : "bg-red-950/70 border-red-500/40 text-red-300",
                    )}
                  >
                    -{item.value} HP {item.type === "crit" ? "CRIT" : ""}
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* 4. Nút Nổi Cuộn Xuống Sự Kiện Mới Nhất (Khi người dùng cuộn lên) */}
      {hasNewLogsBelow && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-cyan-400 bg-cyan-950/95 px-3 py-1 font-mono text-[11px] font-bold text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.4)] animate-bounce cursor-pointer z-10"
        >
          <ArrowDown className="size-3 text-cyan-400" />
          <span>Có sự kiện mới ➔ Cuộn xuống</span>
        </button>
      )}
    </div>
  )
}
