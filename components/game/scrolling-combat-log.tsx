"use client"

import React, { useEffect, useRef, useState } from "react"
import type { CombatLogItem } from "@/lib/game/types"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  Copy,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Sword,
  Terminal,
  Wind,
  Zap,
} from "lucide-react"

interface ScrollingCombatLogProps {
  logs: CombatLogItem[]
  className?: string
}

type LogFilter = "all" | "damage" | "status" | "boss"

export function ScrollingCombatLog({ logs, className }: ScrollingCombatLogProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<LogFilter>("all")
  const [autoScroll, setAutoScroll] = useState(true)
  const [copied, setCopied] = useState(false)

  // Tự động cuộn xuống dưới cùng khi có log mới nếu autoScroll bật
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [logs, autoScroll])

  // Lọc danh sách log
  const filteredLogs = logs.filter((item) => {
    if (filter === "damage") {
      return (
        item.type === "damage" ||
        item.type === "player-action" ||
        item.type === "enemy-action" ||
        item.type === "crit" ||
        item.type === "evade"
      )
    }
    if (filter === "status") {
      return item.type === "status"
    }
    if (filter === "boss") {
      return (
        item.type === "charge" ||
        item.type === "phase" ||
        item.type === "interrupt" ||
        item.text.includes("BOSS") ||
        item.text.includes("TUYỆT KỸ") ||
        item.text.includes("CẢNH BÁO")
      )
    }
    return true
  })

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] [Lượt ${l.turn}] ${l.text}`).join("\n")
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const scrollToBottomNow = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }

  return (
    <div
      className={cn(
        "rounded-sm border border-border/70 bg-panel/75 backdrop-blur-sm p-3.5 shadow-lg flex flex-col font-mono",
        className,
      )}
    >
      {/* Header điều khiển và lọc */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2 text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-cyan-400 animate-pulse" />
          <span className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
            NHẬT KÝ CHIẾN TRƯỜNG // RADAR TELEMETRY FEED
          </span>
          <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-muted-foreground border border-border/40">
            {logs.length} sự kiện
          </span>
        </div>

        {/* Nút lọc & điều khiển */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="inline-flex rounded border border-border/60 bg-black/40 p-0.5 text-[11px]">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "rounded px-2 py-0.5 transition-colors cursor-pointer",
                filter === "all"
                  ? "bg-cyan-500/30 text-cyan-200 font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter("damage")}
              className={cn(
                "rounded px-2 py-0.5 transition-colors cursor-pointer",
                filter === "damage"
                  ? "bg-amber-500/30 text-amber-200 font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Sát thương
            </button>
            <button
              onClick={() => setFilter("status")}
              className={cn(
                "rounded px-2 py-0.5 transition-colors cursor-pointer",
                filter === "status"
                  ? "bg-emerald-500/30 text-emerald-200 font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Hiệu ứng
            </button>
            <button
              onClick={() => setFilter("boss")}
              className={cn(
                "rounded px-2 py-0.5 transition-colors cursor-pointer",
                filter === "boss"
                  ? "bg-red-500/30 text-red-200 font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Boss & Tuyệt kỹ
            </button>
          </div>

          {/* Toggle Auto Scroll */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? "Tạm dừng tự động cuộn" : "Bật tự động cuộn"}
            className={cn(
              "flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] cursor-pointer transition-colors",
              autoScroll
                ? "border-cyan-500/40 bg-cyan-950/40 text-cyan-300"
                : "border-border/60 bg-black/40 text-muted-foreground hover:text-foreground",
            )}
          >
            {autoScroll ? <Play className="size-3 text-cyan-400" /> : <Pause className="size-3" />}
            <span className="hidden sm:inline">Tự cuộn</span>
          </button>

          {/* Scroll to Bottom Button */}
          <button
            onClick={scrollToBottomNow}
            title="Cuộn xuống cuối ngay lập tức"
            className="flex items-center rounded border border-border/60 bg-black/40 px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-cyan-500/40 cursor-pointer"
          >
            <ArrowDown className="size-3" />
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopyLogs}
            title="Sao chép toàn bộ nhật ký"
            className="flex items-center gap-1 rounded border border-border/60 bg-black/40 px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-cyan-300 cursor-pointer"
          >
            <Copy className="size-3" />
            <span className="hidden sm:inline">{copied ? "Đã chép!" : "Chép log"}</span>
          </button>
        </div>
      </div>

      {/* Danh sách log có thanh cuộn mượt */}
      <div
        ref={scrollContainerRef}
        className="h-48 overflow-y-auto rounded bg-black/60 p-3 font-mono text-xs leading-relaxed space-y-2 border border-border/40 scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-black"
      >
        {filteredLogs.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground/60 italic">
            Chưa có sự kiện nào phù hợp với bộ lọc đã chọn.
          </div>
        ) : (
          filteredLogs.map((item) => {
            let badgeBg = "bg-secondary/40 text-muted-foreground border-border/40"
            let icon = null
            let itemColor = "text-muted-foreground"

            if (item.type === "player-action") {
              badgeBg = "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
              icon = <Sword className="size-3 text-cyan-400 shrink-0" />
              itemColor = "text-cyan-200"
            } else if (item.type === "enemy-action") {
              badgeBg = "bg-red-500/20 text-red-300 border-red-500/40"
              icon = <Sword className="size-3 text-red-400 shrink-0" />
              itemColor = "text-red-300"
            } else if (item.type === "crit") {
              badgeBg = "bg-amber-500/25 text-amber-200 border-amber-500/60 font-bold"
              icon = <Flame className="size-3 text-amber-400 shrink-0 animate-pulse" />
              itemColor = "text-amber-200 font-bold"
            } else if (item.type === "status") {
              badgeBg = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              icon = <Zap className="size-3 text-emerald-400 shrink-0" />
              itemColor = "text-emerald-300"
            } else if (item.type === "evade") {
              badgeBg = "bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold"
              icon = <Wind className="size-3 text-purple-400 shrink-0" />
              itemColor = "text-purple-300 font-bold"
            } else if (item.type === "charge") {
              badgeBg = "bg-rose-500/30 text-rose-200 border-rose-500/60 font-bold animate-pulse"
              icon = <AlertTriangle className="size-3 text-rose-400 shrink-0" />
              itemColor = "text-rose-200 font-bold"
            } else if (item.type === "interrupt") {
              badgeBg = "bg-yellow-500/30 text-yellow-200 border-yellow-500/60 font-bold"
              icon = <Zap className="size-3 text-yellow-400 shrink-0" />
              itemColor = "text-yellow-200 font-bold"
            } else if (item.type === "phase") {
              badgeBg = "bg-red-600/30 text-red-200 border-red-500/80 font-bold animate-pulse"
              icon = <Flame className="size-3 text-red-400 shrink-0" />
              itemColor = "text-red-300 font-bold"
            } else if (item.type === "victory") {
              badgeBg = "bg-emerald-500/30 text-emerald-300 border-emerald-400 font-bold"
              icon = <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
              itemColor = "text-emerald-300 font-bold text-sm"
            } else if (item.type === "defeat") {
              badgeBg = "bg-red-500/30 text-red-300 border-red-500 font-bold"
              icon = <AlertTriangle className="size-3 text-red-400 shrink-0" />
              itemColor = "text-red-400 font-bold text-sm"
            } else if (item.type === "system") {
              badgeBg = "bg-cyan-900/30 text-cyan-400 border-cyan-700/50"
              icon = <Terminal className="size-3 text-cyan-400 shrink-0" />
              itemColor = "text-cyan-400/90"
            }

            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-2 rounded px-2 py-1 transition-all border border-transparent hover:border-border/50 hover:bg-white/[0.02]",
                  itemColor,
                )}
              >
                {/* Thời gian */}
                <span
                  suppressHydrationWarning
                  className="shrink-0 text-[10px] text-muted-foreground/50 pt-0.5"
                >
                  [{item.timestamp}]
                </span>

                {/* Badge Lượt */}
                <span
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1 rounded px-1.5 py-0.2 text-[10px] border",
                    badgeBg,
                  )}
                >
                  {icon}
                  <span>Lượt {item.turn}</span>
                </span>

                {/* Sát thương nếu có */}
                {item.value !== undefined && item.value > 0 && (
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.2 text-[10px] font-black border",
                      item.type === "crit"
                        ? "bg-amber-500/30 text-amber-300 border-amber-400/60"
                        : "bg-red-950/60 text-red-300 border-red-500/40",
                    )}
                  >
                    -{item.value} HP
                  </span>
                )}

                {/* Nội dung text sự kiện */}
                <span className="flex-1 break-words">{item.text}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
