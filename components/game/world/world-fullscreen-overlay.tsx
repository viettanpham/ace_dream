"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { playClickSound } from "@/lib/game/audio"
import { WorldMap } from "./world-map"
import { QuickDispatchDock } from "./quick-dispatch-dock"
import type { WorldState } from "@/lib/game/world/types"
import {
  Compass,
  Maximize2,
  Minimize2,
  Orbit,
  X,
} from "lucide-react"

interface WorldFullscreenOverlayProps {
  isOpen: boolean
  onClose: () => void
  worldState: WorldState
  selectedSectorId?: string
  onSelectSector?: (sectorId: string) => void
  onNavigateToSectorOperations?: (sectorId: string) => void
  onDeployCombat?: (sectorId: string) => void
  onUpdateWorldState?: (updatedState: WorldState) => void
}

export function WorldFullscreenOverlay({
  isOpen,
  onClose,
  worldState,
  selectedSectorId,
  onSelectSector,
  onNavigateToSectorOperations,
  onDeployCombat,
  onUpdateWorldState,
}: WorldFullscreenOverlayProps) {
  const [quickDispatchSectorId, setQuickDispatchSectorId] = useState<string | null>(null)

  // Lắng nghe phím ESC để thoát toàn màn hình
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (quickDispatchSectorId) {
          setQuickDispatchSectorId(null)
        } else {
          playClickSound()
          onClose()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose, quickDispatchSectorId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex flex-col w-screen h-screen bg-zinc-950 text-zinc-100 overflow-hidden select-none animate-in fade-in duration-150">
      {/* MAP VIEWPORT NẰM TRỌN KHUNG HÌNH */}
      <div className="relative flex-1 w-full h-full min-h-0">
        <WorldMap
          worldState={worldState}
          selectedSectorId={selectedSectorId}
          onSelectSector={onSelectSector}
          onNavigateToSectorOperations={(secId) => {
            onClose()
            onNavigateToSectorOperations?.(secId)
          }}
          onOpenQuickDispatch={(secId) => {
            setQuickDispatchSectorId(secId)
          }}
          onDeployCombat={(secId) => {
            onClose()
            onDeployCombat?.(secId)
          }}
          onUpdateWorldState={onUpdateWorldState}
          isFullscreen={true}
          onToggleFullscreen={onClose}
          className="h-full w-full"
        />

        {/* Nút thoát nổi góc trên bên phải để người chơi luôn có thể bấm trực tiếp */}
        <button
          onClick={() => {
            playClickSound()
            onClose()
          }}
          className="absolute top-2.5 right-2.5 z-50 flex items-center gap-1.5 rounded bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 hover:border-cyan-400 px-3 py-1.5 text-xs font-mono text-zinc-300 hover:text-white transition-all shadow-xl cursor-pointer"
          title="Thoát chế độ toàn màn hình (Phím ESC)"
        >
          <Minimize2 className="size-3.5 text-cyan-400" />
          <span>Thoát (ESC)</span>
        </button>
      </div>

      {/* QUICK DISPATCH DOCK KHI MỞ TỪ FULLSCREEN */}
      {quickDispatchSectorId && (
        <QuickDispatchDock
          isOpen={true}
          onClose={() => setQuickDispatchSectorId(null)}
          worldState={worldState}
          preselectedDestinationId={quickDispatchSectorId}
          onDispatchComplete={() => {
            onUpdateWorldState?.({ ...worldState })
          }}
        />
      )}
    </div>
  )
}
