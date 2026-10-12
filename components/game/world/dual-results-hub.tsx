"use client"

import { useState } from "react"
import {
  AlertCircle,
  Archive,
  Award,
  Check,
  CheckCheck,
  Clock,
  Eye,
  FileText,
  Filter,
  Flame,
  Globe2,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { playClickSound, playShieldSound } from "@/lib/game/audio"
import {
  markEventResultAsRead,
  markAllEventResultsAsRead,
  pruneReadEventResultsSafe,
} from "@/lib/game/world/event-engine"
import { saveWorldState } from "@/lib/game/world/storage"
import type {
  WorldState,
  WorldEventResult,
  JournalEntry,
} from "@/lib/game/world/types"

import {
  ChevronDown,
  ChevronUp,
} from "lucide-react"

export interface DualResultsHubProps {
  worldState: WorldState
  onStateUpdated?: () => void
  onNavigateToSector?: (sectorId: string) => void
  isDrawer?: boolean
}

export function DualResultsHub({
  worldState,
  onStateUpdated,
  onNavigateToSector,
  isDrawer = false,
}: DualResultsHubProps) {
  const [activeTab, setActiveTab] = useState<"events" | "battles">("events")
  const [filterMode, setFilterMode] = useState<"all" | "unread" | "success" | "failure">("all")
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null)

  // 1. Dữ liệu Event / Mission Results từ Archive
  const eventArchive: WorldEventResult[] = worldState.eventResultsArchive || []
  const unreadEventCount = eventArchive.filter((r) => !r.isRead).length

  // 2. Dữ liệu Battle Results từ Transaction Journal
  const journalEntries: JournalEntry[] = Object.values(
    worldState.transactionJournal || {}
  ).filter((entry) => entry.type === "combat" && entry.status === "committed")

  // Lọc sự kiện theo filter
  const filteredEvents = eventArchive.filter((item) => {
    if (filterMode === "unread") return !item.isRead
    if (filterMode === "success") return item.status === "success"
    if (filterMode === "failure") return item.status === "failure" || item.status === "expired_default"
    return true
  })

  // Lọc trận đấu theo filter
  const filteredBattles = journalEntries.filter((entry) => {
    if (filterMode === "success") return entry.receipt?.victory === true
    if (filterMode === "failure") return entry.receipt?.victory === false
    return true
  })

  const handleMarkAsRead = (resultId: string) => {
    playClickSound()
    markEventResultAsRead(worldState, resultId)
    saveWorldState(worldState)
    onStateUpdated?.()
  }

  const handleMarkAllRead = () => {
    playClickSound()
    const count = markAllEventResultsAsRead(worldState)
    saveWorldState(worldState)
    setFeedbackMessage(`Đã đánh dấu ${count} báo cáo sự kiện là đã đọc.`)
    setTimeout(() => setFeedbackMessage(null), 3000)
    onStateUpdated?.()
  }

  const handleSafePruning = () => {
    playClickSound()
    const pruneRes = pruneReadEventResultsSafe(worldState)
    saveWorldState(worldState)
    playShieldSound()
    setFeedbackMessage(
      `Đã dọn dẹp ${pruneRes.prunedCount} bản ghi lịch sử đã đọc. (Chỉ dọn dẹp log hiển thị — Chỉ số World State bảo toàn 100%).`
    )
    setTimeout(() => setFeedbackMessage(null), 4000)
    onStateUpdated?.()
  }

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top Banner / Actions Bar */}
      <div className="rounded border border-border/80 bg-zinc-950/80 p-2.5 sm:p-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {!isDrawer ? (
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-sm">
                <Layers className="size-4" />
                <span>TRUNG TÂM KẾT QUẢ KÉP // DUAL RESULTS HUB</span>
              </div>
              <p className="mt-0.5 text-zinc-400 text-[11px] leading-relaxed">
                Lưu trữ minh bạch 2 luồng báo cáo có thẩm quyền: Báo Cáo Sự Kiện & Khủng Hoảng (Event Results) và Nhật Ký Trận Đánh Buồng Lái (Battle Results).
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
              <Layers className="size-3.5 text-cyan-400" />
              <span className="font-bold text-zinc-200 uppercase">Hồ Sơ Debriefing</span>
              <span className="text-zinc-600">·</span>
              <span>{eventArchive.length} sự kiện · {journalEntries.length} trận đấu</span>
            </div>
          )}

          {/* Nút tác vụ hàng loạt */}
          <div className="flex items-center gap-2 ml-auto">
            {activeTab === "events" && unreadEventCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
                title="Đánh dấu tất cả thông báo sự kiện là đã đọc"
              >
                <CheckCheck className="size-3.5 text-cyan-400" />
                <span>Đọc Tất Cả ({unreadEventCount})</span>
              </button>
            )}

            {activeTab === "events" && (
              <button
                type="button"
                onClick={handleSafePruning}
                className="flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-[11px] text-zinc-400 hover:border-red-900/50 hover:text-red-300 transition-colors cursor-pointer"
                title="Xóa an toàn các báo cáo đã đọc mà không làm thay đổi World State"
              >
                <Trash2 className="size-3.5" />
                <span>Dọn Dẹp Đã Đọc</span>
              </button>
            )}
          </div>
        </div>

        {/* Thông báo phản hồi */}
        {feedbackMessage && (
          <div className="mt-2.5 flex items-center gap-2 rounded border border-cyan-500/40 bg-cyan-950/40 p-2 text-[11px] text-cyan-200 animate-fadeIn">
            <Check className="size-3.5 text-cyan-400 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}
      </div>

      {/* Điều khiển phân tab & bộ lọc */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-zinc-800 pb-2">
        {/* Tab chuyển đổi kép */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900/80 rounded border border-zinc-800">
          <button
            type="button"
            onClick={() => {
              playClickSound()
              setActiveTab("events")
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors cursor-pointer",
              activeTab === "events"
                ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-xs"
                : "text-zinc-400 hover:text-white"
            )}
          >
            <FileText className="size-3.5" />
            <span>Báo Cáo Sự Kiện ({eventArchive.length})</span>
            {unreadEventCount > 0 && (
              <span className="ml-1 rounded bg-amber-500/20 px-1 py-0.2 text-[10px] text-amber-300 border border-amber-500/40 font-bold">
                {unreadEventCount} Mới
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound()
              setActiveTab("battles")
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors cursor-pointer",
              activeTab === "battles"
                ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-xs"
                : "text-zinc-400 hover:text-white"
            )}
          >
            <Swords className="size-3.5" />
            <span>Nhật Ký Chiến Đấu ({journalEntries.length})</span>
          </button>
        </div>

        {/* Bộ lọc theo trạng thái */}
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-zinc-400 mr-1 flex items-center gap-1">
            <Filter className="size-3" /> Lọc:
          </span>
          {(["all", "unread", "success", "failure"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                playClickSound()
                setFilterMode(mode)
              }}
              className={cn(
                "px-2.5 py-1 rounded border transition-colors cursor-pointer uppercase text-[10px] font-bold",
                filterMode === mode
                  ? "border-cyan-500/50 bg-cyan-950/60 text-cyan-300"
                  : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200"
              )}
            >
              {mode === "all" && "Tất Cả"}
              {mode === "unread" && "Chưa Đọc"}
              {mode === "success" && "Thắng / Tốt"}
              {mode === "failure" && "Thua / Xấu"}
            </button>
          ))}
        </div>
      </div>

      {/* DANH SÁCH 1: EVENT & MISSION RESULTS */}
      {activeTab === "events" && (
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="rounded border border-dashed border-zinc-800 p-8 text-center text-zinc-400">
              <Archive className="mx-auto size-8 text-zinc-400/60" />
              <div className="mt-2 text-xs font-bold uppercase text-zinc-400">
                Chưa có báo cáo sự kiện nào phù hợp với bộ lọc
              </div>
              <p className="mt-1 text-[11px] text-zinc-400">
                Các sự kiện khi hoàn tất chu trình PROCESSING sẽ tự động ghi nhận kết quả và lưu trữ tại đây.
              </p>
            </div>
          ) : (
            filteredEvents.map((result) => {
              const sector = result.sectorId ? worldState.sectors[result.sectorId] : null
              const isSuccess = result.status === "success"
              const isDefault = result.status === "expired_default"

              return (
                <div
                  key={result.id}
                  className={cn(
                    "rounded border p-3.5 transition-all relative",
                    !result.isRead
                      ? "border-cyan-500/50 bg-cyan-950/15 shadow-sm"
                      : "border-zinc-800/80 bg-zinc-950/60"
                  )}
                >
                  {/* Top line: Header info */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border",
                          isSuccess
                            ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                            : isDefault
                            ? "border-amber-500/40 bg-amber-950/40 text-amber-300"
                            : "border-red-500/40 bg-red-950/40 text-red-300"
                        )}
                      >
                        {isSuccess ? "THÀNH CÔNG" : isDefault ? "HẾT HẠN (MẶC ĐỊNH)" : "THẤT BẠI"}
                      </span>

                      {result.strategySource && (
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border",
                            result.strategySource === "system_auto"
                              ? "border-cyan-500/40 bg-cyan-950/40 text-cyan-300"
                              : result.strategySource === "default_fallback"
                              ? "border-amber-500/40 bg-amber-950/40 text-amber-300"
                              : "border-indigo-500/40 bg-indigo-950/40 text-indigo-300"
                          )}
                        >
                          {result.strategySource === "system_auto"
                            ? "SYSTEM AUTO"
                            : result.strategySource === "default_fallback"
                            ? "DEFAULT FALLBACK"
                            : "CHỈ HUY PHÊ CHUẨN"}
                        </span>
                      )}

                      <span className="font-bold text-zinc-200 text-xs">{result.title}</span>

                      {result.category && (
                        <span className="text-[10px] text-zinc-400 uppercase">
                          · {result.category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                      <span>Ngày {result.resolvedAtTick}</span>
                      {sector && (
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound()
                            onNavigateToSector?.(result.sectorId!)
                          }}
                          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-200 hover:underline cursor-pointer transition-colors"
                          title={`Xem Sector ${sector.name} trên bản đồ chiến lược`}
                        >
                          <MapPin className="size-3 text-cyan-400 shrink-0" />
                          <span>{sector.name}</span>
                        </button>
                      )}
                      {!result.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(result.id)}
                          className="flex items-center gap-1 rounded bg-cyan-950/60 px-1.5 py-0.5 text-[10px] text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900 cursor-pointer"
                        >
                          <Eye className="size-3" />
                          <span>Đánh dấu đọc</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound()
                          setExpandedResultId((prev) => (prev === result.id ? null : result.id))
                        }}
                        className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors border border-zinc-800 rounded px-1.5 py-0.5"
                        title="Xem chi tiết tình báo và tham số tác chiến"
                      >
                        <span>{expandedResultId === result.id ? "Thu Gọn" : "Chi Tiết"}</span>
                        {expandedResultId === result.id ? (
                          <ChevronUp className="size-3" />
                        ) : (
                          <ChevronDown className="size-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Chosen Strategy & Summary Text */}
                  <div className="mt-2 text-[11px] text-zinc-300 leading-relaxed">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-zinc-400 font-bold">Chiến lược đã chọn:</span>{" "}
                      <span className="text-cyan-300 font-bold">{result.chosenStrategyName}</span>
                      {result.selectionReason && (
                        <span className="text-zinc-400 text-[10px] italic">
                          ({result.selectionReason})
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-zinc-400 bg-zinc-900/50 p-2 rounded border border-zinc-800/60">
                      {result.summaryText}
                    </p>
                  </div>

                  {/* Impact metrics breakdown */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-3 border-t border-zinc-800/60 pt-2 text-[11px]">
                    {typeof result.stabilityChange === "number" && (
                      <span
                        className={cn(
                          "flex items-center gap-1 font-bold",
                          result.stabilityChange >= 0 ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {result.stabilityChange >= 0 ? (
                          <TrendingUp className="size-3" />
                        ) : (
                          <TrendingDown className="size-3" />
                        )}
                        Stability: {result.stabilityChange >= 0 ? "+" : ""}
                        {result.stabilityChange}
                      </span>
                    )}

                    {typeof result.threatChange === "number" && (
                      <span
                        className={cn(
                          "flex items-center gap-1 font-bold",
                          result.threatChange <= 0 ? "text-emerald-400" : "text-amber-400"
                        )}
                      >
                        <Shield className="size-3" />
                        Threat: {result.threatChange > 0 ? "+" : ""}
                        {result.threatChange}
                      </span>
                    )}

                    {typeof result.casualties === "number" && result.casualties > 0 && (
                      <span className="text-red-400 font-bold flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        Tổn thất: -{result.casualties} quân
                      </span>
                    )}

                    {result.resourceChanges && Object.keys(result.resourceChanges).length > 0 && (
                      <div className="text-zinc-400 flex items-center gap-2">
                        <span>Biến động kho:</span>
                        {Object.entries(result.resourceChanges).map(([k, v]) => (
                          <span
                            key={k}
                            className={cn(
                              "font-bold",
                              typeof v === "number" && v >= 0 ? "text-emerald-400" : "text-red-400"
                            )}
                          >
                            {k}: {typeof v === "number" && v >= 0 ? "+" : ""}
                            {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Chi Tiết Mở Rộng Khi Bấm "Chi Tiết" */}
                  {expandedResultId === result.id && (
                    <div className="mt-3 rounded border border-cyan-500/30 bg-cyan-950/20 p-2.5 text-[11px] space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800/80 pb-1.5">
                        <span className="font-bold text-cyan-300">THÔNG TIN TÌNH BÁO CHI TIẾT</span>
                        <span className="text-[10px] text-zinc-500">Mã Báo Cáo: {result.id}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-zinc-400">Thời điểm hoàn tất:</span>{" "}
                          <span className="text-zinc-200 font-bold">Ngày #{result.resolvedAtTick}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400">Nguồn thẩm quyền:</span>{" "}
                          <span className="text-zinc-200 font-bold uppercase">
                            {result.strategySource || "player_choice"}
                          </span>
                        </div>
                        {result.sectorId && (
                          <div>
                            <span className="text-zinc-400">Sector liên quan:</span>{" "}
                            <span className="text-cyan-300 font-bold">
                              {sector?.name || result.sectorId}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-zinc-400">Trạng thái đọc:</span>{" "}
                          <span className={result.isRead ? "text-zinc-400" : "text-amber-300 font-bold"}>
                            {result.isRead ? "Đã đọc" : "Chưa đọc"}
                          </span>
                        </div>
                      </div>

                      {sector && onNavigateToSector && (
                        <div className="pt-1 border-t border-zinc-800/60 flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400">
                            Quan sát vị trí tác động trên Galaxy Map:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              playClickSound()
                              onNavigateToSector(result.sectorId!)
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-200 underline cursor-pointer"
                          >
                            <MapPin className="size-3" />
                            <span>Mở Inspector {sector.name} &rarr;</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* DANH SÁCH 2: BATTLE RESULTS */}
      {activeTab === "battles" && (
        <div className="space-y-3">
          {filteredBattles.length === 0 ? (
            <div className="rounded border border-dashed border-zinc-800 p-8 text-center text-zinc-400">
              <Swords className="mx-auto size-8 text-zinc-400/60" />
              <div className="mt-2 text-xs font-bold uppercase text-zinc-400">
                Chưa có biên lai trận chiến nào trong nhật ký
              </div>
              <p className="mt-1 text-[11px] text-zinc-400">
                Khi các trận chiến trong Đấu trường hoàn tất qua Combat Adapter, biên lai sẽ tự động commit và lưu trữ tại đây.
              </p>
            </div>
          ) : (
            filteredBattles.map((entry) => {
              const receipt = entry.receipt
              const sector = entry.sectorId ? worldState.sectors[entry.sectorId] : null
              const isVictory = receipt?.victory === true

              return (
                <div
                  key={entry.transactionId}
                  className="rounded border border-zinc-800/80 bg-zinc-950/60 p-3.5 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border",
                          isVictory
                            ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                            : "border-red-500/40 bg-red-950/40 text-red-300"
                        )}
                      >
                        {isVictory ? "CHIẾN THẮNG" : "THẤT BẠI"}
                      </span>

                      {sector ? (
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound()
                            onNavigateToSector?.(entry.sectorId!)
                          }}
                          className="flex items-center gap-1 font-bold text-cyan-400 hover:text-cyan-200 hover:underline cursor-pointer transition-colors"
                          title={`Xem Sector ${sector.name} trên bản đồ chiến lược`}
                        >
                          <MapPin className="size-3 text-cyan-400 shrink-0" />
                          <span>Giao Tranh Tại {sector.name}</span>
                        </button>
                      ) : (
                        <span className="font-bold text-zinc-200">
                          {entry.sectorId ? `Sector: ${entry.sectorId}` : "Không Gian Mở"}
                        </span>
                      )}

                      {receipt?.tacticalRating && (
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-300 border border-amber-500/40">
                          Hạng {receipt.tacticalRating}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <span className="hidden sm:inline font-mono">
                        TxID: {entry.transactionId.substring(0, 14)}...
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound()
                          setExpandedResultId((prev) => (prev === entry.transactionId ? null : entry.transactionId))
                        }}
                        className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors border border-zinc-800 rounded px-1.5 py-0.5"
                        title="Xem chi tiết biên lai tác chiến"
                      >
                        <span>{expandedResultId === entry.transactionId ? "Thu Gọn" : "Biên Lai"}</span>
                        {expandedResultId === entry.transactionId ? (
                          <ChevronUp className="size-3" />
                        ) : (
                          <ChevronDown className="size-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {receipt && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-zinc-900/40 p-2 rounded border border-zinc-800/60">
                      <div>
                        <span className="text-zinc-400">Số hiệp:</span>{" "}
                        <span className="font-bold text-zinc-200">{receipt.rounds} Hiệp</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">HP Người chơi:</span>{" "}
                        <span className="font-bold text-cyan-400">{receipt.playerRemainingHpPercent}%</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">HP Kẻ địch:</span>{" "}
                        <span className="font-bold text-amber-400">{receipt.enemyRemainingHpPercent}%</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Trạng thái Tx:</span>{" "}
                        <span className="font-bold text-emerald-400 uppercase">Committed</span>
                      </div>
                    </div>
                  )}

                  {receipt?.logSummary && (
                    <div className="text-[11px] text-zinc-400 bg-black/40 p-2 rounded border border-zinc-900">
                      {receipt.logSummary}
                    </div>
                  )}

                  {expandedResultId === entry.transactionId && (
                    <div className="rounded border border-indigo-500/30 bg-indigo-950/20 p-2.5 text-[10px] font-mono space-y-1.5 animate-fadeIn">
                      <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800/80 pb-1">
                        <span className="font-bold text-indigo-300">BIÊN LAI ĐỒNG BỘ COMBAT ADAPTER</span>
                        <span className="text-emerald-400 font-bold uppercase">Idempotent Committed</span>
                      </div>
                      <div className="text-zinc-400 break-all">
                        <span className="text-zinc-500">Transaction ID:</span> {entry.transactionId}
                      </div>
                      {entry.sectorId && (
                        <div className="text-zinc-400">
                          <span className="text-zinc-500">Mã Sector:</span> {entry.sectorId}
                        </div>
                      )}
                      {sector && onNavigateToSector && (
                        <div className="pt-1 border-t border-zinc-800/60">
                          <button
                            type="button"
                            onClick={() => {
                              playClickSound()
                              onNavigateToSector(entry.sectorId!)
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-200 underline cursor-pointer"
                          >
                            <MapPin className="size-3" />
                            <span>Xem Sector {sector.name} trên Galaxy Map &rarr;</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
