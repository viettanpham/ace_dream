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
import {
  getOperationsArchiveConfig,
  getOperationsArchiveSummary,
} from "@/lib/game/world/operations-archive"
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

  const archiveSummary = getOperationsArchiveSummary(worldState)

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
    <div className="space-y-4 font-mono text-sm leading-normal">
      {/* Top Banner / Actions Bar */}
      <div className="rounded border border-border/80 bg-zinc-950/85 p-3.5 sm:p-4 backdrop-blur-md shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {!isDrawer ? (
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5 text-cyan-400 font-bold uppercase tracking-wider text-sm sm:text-base">
                <Layers className="size-4.5" />
                <span>TRUNG TÂM KẾT QUẢ KÉP // DUAL RESULTS HUB</span>
                <span className="rounded bg-cyan-950/80 px-2.5 py-1 text-xs text-cyan-300 border border-cyan-500/50 font-mono font-bold">
                  Hạn ngạch Archive: Sự kiện {archiveSummary.totalArchivedEvents}/{archiveSummary.eventArchiveQuota} · Chiến đấu {archiveSummary.totalArchivedBattles}/{archiveSummary.battleArchiveQuota}
                </span>
              </div>
              <p className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed">
                Lưu trữ minh bạch 2 luồng báo cáo có thẩm quyền: Báo Cáo Sự Kiện & Nhiệm Vụ (Event Results) và Nhật Ký Trận Đánh Buồng Lái (Battle Results) với hạn ngạch FIFO an toàn.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-zinc-300 text-xs sm:text-sm">
              <Layers className="size-4 text-cyan-400" />
              <span className="font-bold text-zinc-100 uppercase">Hồ Sơ Debriefing Tình Báo</span>
              <span className="text-zinc-500">·</span>
              <span className="font-mono text-cyan-300 font-bold">{eventArchive.length}/{archiveSummary.eventArchiveQuota} sự kiện · {journalEntries.length}/{archiveSummary.battleArchiveQuota} trận đấu</span>
            </div>
          )}

          {/* Nút tác vụ hàng loạt */}
          <div className="flex items-center gap-2 ml-auto">
            {activeTab === "events" && unreadEventCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:border-cyan-500 hover:text-white transition-colors cursor-pointer shadow-sm"
                title="Đánh dấu tất cả thông báo sự kiện là đã đọc"
              >
                <CheckCheck className="size-4 text-cyan-400" />
                <span>Đọc Tất Cả ({unreadEventCount})</span>
              </button>
            )}

            {activeTab === "events" && (
              <button
                type="button"
                onClick={handleSafePruning}
                className="flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-red-900/50 hover:text-red-300 transition-colors cursor-pointer"
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
          <div className="mt-3 flex items-center gap-2 rounded border border-cyan-500/40 bg-cyan-950/40 p-2.5 text-xs sm:text-[13px] text-cyan-200 animate-fadeIn">
            <Check className="size-4 text-cyan-400 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}
      </div>

      {/* Điều khiển phân tab & bộ lọc */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-2.5">
        {/* Tab chuyển đổi kép */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900/80 rounded border border-zinc-800">
          <button
            type="button"
            onClick={() => {
              playClickSound()
              setActiveTab("events")
            }}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded text-xs sm:text-[13px] font-bold uppercase transition-colors cursor-pointer",
              activeTab === "events"
                ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 shadow-xs"
                : "text-zinc-400 hover:text-white"
            )}
          >
            <FileText className="size-4" />
            <span>Báo Cáo Sự Kiện ({eventArchive.length})</span>
            {unreadEventCount > 0 && (
              <span className="ml-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-300 border border-amber-500/40 font-bold font-mono">
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
              "flex items-center gap-2 px-3.5 py-2 rounded text-xs sm:text-[13px] font-bold uppercase transition-colors cursor-pointer",
              activeTab === "battles"
                ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 shadow-xs"
                : "text-zinc-400 hover:text-white"
            )}
          >
            <Swords className="size-4" />
            <span>Nhật Ký Chiến Đấu ({journalEntries.length})</span>
          </button>
        </div>

        {/* Bộ lọc theo trạng thái */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-zinc-400 mr-1 flex items-center gap-1 font-semibold">
            <Filter className="size-3.5" /> Lọc:
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
                "px-3 py-1.5 rounded border transition-colors cursor-pointer uppercase text-xs font-bold",
                filterMode === mode
                  ? "border-cyan-500/60 bg-cyan-950/70 text-cyan-300 shadow-xs"
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
        <div className="space-y-3.5">
          {filteredEvents.length === 0 ? (
            <div className="rounded border border-dashed border-zinc-800 p-8 text-center text-zinc-400 space-y-2">
              <Archive className="mx-auto size-9 text-zinc-500" />
              <div className="text-sm font-bold uppercase text-zinc-200">
                Chưa có báo cáo sự kiện nào phù hợp với bộ lọc
              </div>
              <p className="text-xs sm:text-[13px] text-zinc-400 max-w-md mx-auto leading-relaxed">
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
                    "rounded border p-4 sm:p-4.5 space-y-3 transition-all relative",
                    !result.isRead
                      ? "border-cyan-500/60 bg-cyan-950/20 shadow-md shadow-cyan-950/30"
                      : "border-zinc-800/90 bg-zinc-950/70 hover:border-zinc-700"
                  )}
                >
                  {/* Top line: Header info */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded text-xs font-bold uppercase border",
                          isSuccess
                            ? "border-emerald-500/50 bg-emerald-950/60 text-emerald-300"
                            : isDefault
                            ? "border-amber-500/50 bg-amber-950/60 text-amber-300"
                            : "border-red-500/50 bg-red-950/60 text-red-300"
                        )}
                      >
                        {isSuccess ? "THÀNH CÔNG" : isDefault ? "HẾT HẠN (MẶC ĐỊNH)" : "THẤT BẠI"}
                      </span>

                      {result.strategySource && (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-mono font-bold uppercase border",
                            result.strategySource === "system_auto"
                              ? "border-cyan-500/50 bg-cyan-950/60 text-cyan-300"
                              : result.strategySource === "default_fallback"
                              ? "border-amber-500/50 bg-amber-950/60 text-amber-300"
                              : "border-indigo-500/50 bg-indigo-950/60 text-indigo-300"
                          )}
                        >
                          {result.strategySource === "system_auto"
                            ? "SYSTEM AUTO"
                            : result.strategySource === "default_fallback"
                            ? "DEFAULT FALLBACK"
                            : "CHỈ HUY PHÊ CHUẨN"}
                        </span>
                      )}

                      <span className="font-bold text-zinc-100 text-sm sm:text-base">{result.title}</span>

                      {result.category && (
                        <span className="text-xs text-zinc-400 uppercase font-medium">
                          · {result.category}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px] text-zinc-300">
                      <span className="font-mono text-zinc-400">Ngày #{result.resolvedAtTick}</span>
                      {sector && (
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound()
                            onNavigateToSector?.(result.sectorId!)
                          }}
                          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-200 hover:underline cursor-pointer transition-colors font-semibold"
                          title={`Xem Sector ${sector.name} trên bản đồ chiến lược`}
                        >
                          <MapPin className="size-3.5 text-cyan-400 shrink-0" />
                          <span>{sector.name}</span>
                        </button>
                      )}
                      {!result.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(result.id)}
                          className="flex items-center gap-1 rounded bg-cyan-950/80 px-2 py-1 text-xs text-cyan-300 border border-cyan-500/50 hover:bg-cyan-900 cursor-pointer font-bold"
                        >
                          <Eye className="size-3.5" />
                          <span>Đánh dấu đọc</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound()
                          setExpandedResultId((prev) => (prev === result.id ? null : result.id))
                        }}
                        className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white cursor-pointer transition-colors border border-zinc-700 bg-zinc-900/80 rounded px-2.5 py-1 font-medium"
                        title="Xem chi tiết tình báo và tham số tác chiến"
                      >
                        <span>{expandedResultId === result.id ? "Thu Gọn" : "Chi Tiết"}</span>
                        {expandedResultId === result.id ? (
                          <ChevronUp className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Chosen Strategy & Summary Text */}
                  <div className="text-xs sm:text-sm text-zinc-200 space-y-1.5 leading-relaxed">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-zinc-400 font-bold">Chiến lược đã chọn:</span>{" "}
                      <span className="text-cyan-300 font-bold">{result.chosenStrategyName}</span>
                      {result.selectionReason && (
                        <span className="text-zinc-400 text-xs italic">
                          ({result.selectionReason})
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-200 bg-zinc-900/60 p-3 rounded border border-zinc-800 leading-relaxed text-xs sm:text-sm">
                      {result.summaryText}
                    </p>
                  </div>

                  {/* Impact metrics breakdown */}
                  <div className="flex flex-wrap items-center gap-3.5 border-t border-zinc-800/70 pt-2.5 text-xs sm:text-sm">
                    {typeof result.stabilityChange === "number" && (
                      <span
                        className={cn(
                          "flex items-center gap-1.5 font-bold",
                          result.stabilityChange >= 0 ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {result.stabilityChange >= 0 ? (
                          <TrendingUp className="size-3.5" />
                        ) : (
                          <TrendingDown className="size-3.5" />
                        )}
                        Stability: {result.stabilityChange >= 0 ? "+" : ""}
                        {result.stabilityChange}
                      </span>
                    )}

                    {typeof result.threatChange === "number" && (
                      <span
                        className={cn(
                          "flex items-center gap-1.5 font-bold",
                          result.threatChange <= 0 ? "text-emerald-400" : "text-amber-400"
                        )}
                      >
                        <Shield className="size-3.5" />
                        Threat: {result.threatChange > 0 ? "+" : ""}
                        {result.threatChange}
                      </span>
                    )}

                    {typeof result.casualties === "number" && result.casualties > 0 && (
                      <span className="text-red-400 font-bold flex items-center gap-1.5">
                        <AlertCircle className="size-3.5" />
                        Tổn thất: -{result.casualties} quân
                      </span>
                    )}

                    {result.resourceChanges && Object.keys(result.resourceChanges).length > 0 && (
                      <div className="text-zinc-300 flex items-center gap-2">
                        <span className="text-zinc-400 font-medium">Biến động kho:</span>
                        {Object.entries(result.resourceChanges).map(([k, v]) => (
                          <span
                            key={k}
                            className={cn(
                              "font-bold font-mono text-xs sm:text-[13px] px-1.5 py-0.5 rounded bg-black/40 border border-zinc-800",
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
                    <div className="rounded border border-cyan-500/40 bg-cyan-950/20 p-3.5 text-xs sm:text-[13px] space-y-2.5 animate-fadeIn">
                      <div className="flex items-center justify-between text-zinc-300 border-b border-zinc-800/80 pb-2">
                        <span className="font-bold text-cyan-300 text-xs sm:text-sm">THÔNG TIN TÌNH BÁO CHI TIẾT</span>
                        <span className="text-xs text-zinc-400 font-mono">Mã Báo Cáo: {result.id}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-[13px]">
                        <div>
                          <span className="text-zinc-400">Thời điểm hoàn tất:</span>{" "}
                          <span className="text-zinc-100 font-bold font-mono">Ngày #{result.resolvedAtTick}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400">Nguồn thẩm quyền:</span>{" "}
                          <span className="text-cyan-300 font-bold uppercase">
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
                          <span className={result.isRead ? "text-zinc-400 font-medium" : "text-amber-300 font-bold"}>
                            {result.isRead ? "Đã đọc" : "Chưa đọc"}
                          </span>
                        </div>
                      </div>

                      {sector && onNavigateToSector && (
                        <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                          <span className="text-xs text-zinc-300">
                            Quan sát vị trí tác động trên Galaxy Map:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              playClickSound()
                              onNavigateToSector(result.sectorId!)
                            }}
                            className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-200 underline cursor-pointer"
                          >
                            <MapPin className="size-3.5" />
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
        <div className="space-y-3.5">
          {filteredBattles.length === 0 ? (
            <div className="rounded border border-dashed border-zinc-800 p-8 text-center text-zinc-400 space-y-2">
              <Swords className="mx-auto size-9 text-zinc-500" />
              <div className="text-sm font-bold uppercase text-zinc-200">
                Chưa có biên lai trận chiến nào trong nhật ký
              </div>
              <p className="text-xs sm:text-[13px] text-zinc-400 max-w-md mx-auto leading-relaxed">
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
                  className="rounded border border-zinc-800/90 bg-zinc-950/70 p-4 space-y-3 hover:border-zinc-700 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded text-xs font-bold uppercase border",
                          isVictory
                            ? "border-emerald-500/50 bg-emerald-950/60 text-emerald-300"
                            : "border-red-500/50 bg-red-950/60 text-red-300"
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
                          className="flex items-center gap-1.5 font-bold text-cyan-400 hover:text-cyan-200 hover:underline cursor-pointer transition-colors text-sm sm:text-base"
                          title={`Xem Sector ${sector.name} trên bản đồ chiến lược`}
                        >
                          <MapPin className="size-3.5 text-cyan-400 shrink-0" />
                          <span>Giao Tranh Tại {sector.name}</span>
                        </button>
                      ) : (
                        <span className="font-bold text-zinc-100 text-sm sm:text-base">
                          {entry.sectorId ? `Sector: ${entry.sectorId}` : "Không Gian Mở"}
                        </span>
                      )}

                      {receipt?.tacticalRating && (
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/40 font-mono">
                          Hạng {receipt.tacticalRating}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="hidden sm:inline font-mono">
                        TxID: {entry.transactionId.substring(0, 14)}...
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound()
                          setExpandedResultId((prev) => (prev === entry.transactionId ? null : entry.transactionId))
                        }}
                        className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white cursor-pointer transition-colors border border-zinc-700 bg-zinc-900/80 rounded px-2.5 py-1 font-medium"
                        title="Xem chi tiết biên lai tác chiến"
                      >
                        <span>{expandedResultId === entry.transactionId ? "Thu Gọn" : "Biên Lai"}</span>
                        {expandedResultId === entry.transactionId ? (
                          <ChevronUp className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {receipt && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs sm:text-[13px] bg-zinc-900/50 p-3 rounded border border-zinc-800">
                      <div>
                        <span className="text-zinc-400 block mb-0.5">Số hiệp:</span>{" "}
                        <span className="font-bold text-zinc-100 text-sm sm:text-base">{receipt.rounds} Hiệp</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block mb-0.5">HP Người chơi:</span>{" "}
                        <span className="font-bold text-cyan-400 text-sm sm:text-base">{receipt.playerRemainingHpPercent}%</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block mb-0.5">HP Kẻ địch:</span>{" "}
                        <span className="font-bold text-amber-400 text-sm sm:text-base">{receipt.enemyRemainingHpPercent}%</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block mb-0.5">Trạng thái Tx:</span>{" "}
                        <span className="font-bold text-emerald-400 uppercase text-sm sm:text-base">Committed</span>
                      </div>
                    </div>
                  )}

                  {receipt?.logSummary && (
                    <div className="text-xs sm:text-sm text-zinc-200 bg-black/40 p-3 rounded border border-zinc-800/80 leading-relaxed">
                      {receipt.logSummary}
                    </div>
                  )}

                  {expandedResultId === entry.transactionId && (
                    <div className="rounded border border-indigo-500/40 bg-indigo-950/20 p-3 text-xs font-mono space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-zinc-300 border-b border-zinc-800/80 pb-1.5">
                        <span className="font-bold text-indigo-300 text-xs sm:text-[13px]">BIÊN LAI ĐỒNG BỘ COMBAT ADAPTER</span>
                        <span className="text-emerald-400 font-bold uppercase text-xs">Idempotent Committed</span>
                      </div>
                      <div className="text-zinc-300 break-all">
                        <span className="text-zinc-500">Transaction ID:</span> {entry.transactionId}
                      </div>
                      {entry.sectorId && (
                        <div className="text-zinc-300">
                          <span className="text-zinc-500">Mã Sector:</span> {entry.sectorId}
                        </div>
                      )}
                      {sector && onNavigateToSector && (
                        <div className="pt-1.5 border-t border-zinc-800/60">
                          <button
                            type="button"
                            onClick={() => {
                              playClickSound()
                              onNavigateToSector(entry.sectorId!)
                            }}
                            className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-200 underline cursor-pointer"
                          >
                            <MapPin className="size-3.5" />
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
