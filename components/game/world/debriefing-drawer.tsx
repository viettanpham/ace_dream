"use client"

import React, { useEffect } from "react"
import {
  FileText,
  Layers,
  X,
  Shield,
  Clock,
  CheckCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { playClickSound } from "@/lib/game/audio"
import { DualResultsHub } from "./dual-results-hub"
import type { WorldState } from "@/lib/game/world/types"

export interface DebriefingDrawerProps {
  isOpen: boolean
  onClose: () => void
  worldState: WorldState | null
  onStateUpdated?: () => void
  onNavigateToSector?: (sectorId: string) => void
}

export function DebriefingDrawer({
  isOpen,
  onClose,
  worldState,
  onStateUpdated,
  onNavigateToSector,
}: DebriefingDrawerProps) {
  // 1. Phím tắt ESC để đóng Drawer an toàn
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        playClickSound()
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !worldState) return null

  const unreadCount = (worldState.eventResultsArchive || []).filter((r) => !r.isRead).length
  const totalResults = (worldState.eventResultsArchive || []).length
  const battleCount = Object.values(worldState.transactionJournal || {}).filter(
    (e) => e.type === "combat" && e.status === "committed"
  ).length

  const handleNavigateSector = (sectorId: string) => {
    onNavigateToSector?.(sectorId)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-mono text-xs">
      {/* Backdrop mờ phía sau - Click để đóng */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
        onClick={() => {
          playClickSound()
          onClose()
        }}
        aria-hidden="true"
      />

      {/* Drawer Panel trượt từ cạnh phải */}
      <div className="fixed inset-y-0 right-0 z-50 flex max-w-full pl-0 sm:pl-10">
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Khay Báo Cáo Tình Báo"
          className={cn(
            "flex h-full w-screen flex-col bg-zinc-950 border-l border-cyan-500/40 shadow-2xl shadow-black",
            "sm:w-[560px] md:w-[640px] lg:w-[720px]",
            "animate-in slide-in-from-right duration-300 ease-out"
          )}
        >
          {/* ================================================================
              DRAWER HEADER (STICKY TOP)
              ================================================================ */}
          <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-3 shrink-0 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="rounded border border-cyan-500/40 bg-cyan-950/60 p-2 text-cyan-300">
                <FileText className="size-4.5 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-zinc-100">
                    KHAY BÁO CÁO TÌNH BÁO // DEBRIEFING DRAWER
                  </h2>
                  {unreadCount > 0 && (
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/50 animate-pulse font-mono">
                      {unreadCount} Mới
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-300">
                  Lưu trữ minh bạch kết quả sự kiện thiên hà & giao tranh buồng lái
                </p>
              </div>
            </div>

            {/* Cụm Nút Đóng & Phím Tắt */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playClickSound()
                  onClose()
                }}
                className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-800/90 px-3 py-1.5 text-xs sm:text-[13px] font-bold text-zinc-200 hover:border-cyan-500 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer shadow-sm"
                title="Đóng ngăn kéo báo cáo (Phím Escape)"
              >
                <X className="size-4 text-zinc-300" />
                <span className="hidden sm:inline font-mono text-xs">Đóng [ESC]</span>
              </button>
            </div>
          </header>

          {/* ================================================================
              DRAWER BODY (SCROLLABLE DUAL RESULTS CONTENT)
              ================================================================ */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 scrollbar-thin">
            <DualResultsHub
              worldState={worldState}
              onStateUpdated={onStateUpdated}
              onNavigateToSector={handleNavigateSector}
              isDrawer={true}
            />
          </div>

          {/* ================================================================
              DRAWER FOOTER (STICKY BOTTOM)
              ================================================================ */}
          <footer className="border-t border-zinc-800 bg-zinc-900/90 px-5 py-3 shrink-0 flex items-center justify-between text-xs sm:text-[13px] text-zinc-300">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-mono">
                Tổng lưu trữ: <strong className="text-zinc-200">{totalResults}</strong> sự kiện · <strong className="text-cyan-300">{battleCount}</strong> trận đánh
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs text-zinc-400 italic hidden sm:inline">
                * Dữ liệu bảo toàn tuyệt đối theo Save V1
              </span>
              <button
                type="button"
                onClick={() => {
                  playClickSound()
                  onClose()
                }}
                className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-200 underline cursor-pointer font-bold"
              >
                Quay lại War Room &rarr;
              </button>
            </div>
          </footer>
        </aside>
      </div>
    </div>
  )
}
