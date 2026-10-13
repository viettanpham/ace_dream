"use client"

import { useState, useEffect } from "react"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lock,
  Route,
  Shield,
  Swords,
  Users,
  X,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { playClickSound, playShieldSound } from "@/lib/game/audio"
import {
  dispatchTroopDeployment,
  calculateTotalMilitaryForce,
} from "@/lib/game/world/forces-ledger"
import { saveWorldState } from "@/lib/game/world/storage"
import { findShortestPath } from "@/lib/game/world/graph"
import { getSectorMaxThreat } from "@/lib/game/world/threat-engine"
import type {
  WorldState,
  StrategicOrder,
} from "@/lib/game/world/types"

interface QuickDispatchDockProps {
  worldState: WorldState
  isOpen: boolean
  onClose: () => void
  preselectedDestinationId?: string
  onDispatchComplete: (message: string) => void
}

export function QuickDispatchDock({
  worldState,
  isOpen,
  onClose,
  preselectedDestinationId,
  onDispatchComplete,
}: QuickDispatchDockProps) {
  const [sourceType, setSourceType] = useState<"reserves" | "sector">("reserves")
  const [fromSectorId, setFromSectorId] = useState<string>("sol_command_hq")
  const [toSectorId, setToSectorId] = useState<string>(
    preselectedDestinationId || "helios_perimeter"
  )
  const [troopCount, setTroopCount] = useState<number>(50)
  const [selectedOrder, setSelectedOrder] = useState<StrategicOrder>("reinforce")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Đồng bộ điểm đến tự động theo entity mà player vừa click (Phase 6.33_FIX4)
  useEffect(() => {
    if (isOpen && preselectedDestinationId && worldState.sectors[preselectedDestinationId]) {
      setToSectorId(preselectedDestinationId)
      // Nếu sector nguồn đang vô tình trùng với sector đích vừa click, đổi nguồn sang VSS khác hoặc reserves
      if (fromSectorId === preselectedDestinationId) {
        const otherVss = Object.values(worldState.sectors).find(
          (s) => s.sovereignty === "vss" && s.id !== preselectedDestinationId
        )
        if (otherVss) {
          setFromSectorId(otherVss.id)
        } else {
          setSourceType("reserves")
        }
      }
    }
  }, [isOpen, preselectedDestinationId, worldState.sectors])

  if (!isOpen) return null

  // Tìm quân khả dụng
  const reservesAvailable = worldState.military.reserves
  const sourceSector = worldState.sectors[fromSectorId]
  const sourceSectorGarrison = sourceSector?.garrisonPower || 0
  const isSourceLocked = sourceType === "sector" && !!sourceSector?.isLockedForCombat

  const maxAvailable = sourceType === "reserves" ? reservesAvailable : sourceSectorGarrison

  // Tính toán lộ trình
  const originId = sourceType === "reserves" ? "sol_command_hq" : fromSectorId
  const pathResult = findShortestPath(worldState.sectors, worldState.routes, originId, toSectorId)

  const handleAdjustCount = (delta: number) => {
    playClickSound()
    setTroopCount((prev) => Math.max(10, Math.min(maxAvailable, prev + delta)))
    setErrorMessage(null)
  }

  const handleSetMax = () => {
    playClickSound()
    setTroopCount(Math.max(10, maxAvailable))
    setErrorMessage(null)
  }

  const handleExecuteDispatch = () => {
    playClickSound()
    setErrorMessage(null)

    if (troopCount <= 0) {
      setErrorMessage("Số lượng quân điều động phải lớn hơn 0.")
      return
    }

    if (troopCount > maxAvailable) {
      setErrorMessage(`Số lượng quân yêu cầu (${troopCount}) vượt quá lực lượng sẵn có (${maxAvailable}).`)
      return
    }

    if (isSourceLocked) {
      setErrorMessage(`Sector nguồn ${sourceSector?.name} hiện đang bị khóa trong giao tranh. Không thể điều quân!`)
      return
    }

    if (originId === toSectorId) {
      setErrorMessage("Sector nguồn và Sector đích không được trùng nhau.")
      return
    }

    const res = dispatchTroopDeployment(worldState, {
      fromSectorId: originId,
      toSectorId,
      troopCount,
      order: selectedOrder,
      sourceFromReserves: sourceType === "reserves",
    })

    if (!res.success) {
      setErrorMessage(res.error || "Không thể điều động quân.")
      return
    }

    playShieldSound()
    saveWorldState(worldState)
    onClose()
    onDispatchComplete(
      `Đã phê chuẩn điều động ${troopCount} quân đến ${worldState.sectors[toSectorId]?.name || toSectorId}! (Dự kiến: ${res.deployment?.remainingDays ?? 1} ngày)`
    )
  }

  const isPreselectedMatch = preselectedDestinationId === toSectorId

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-lg border border-cyan-500/40 bg-zinc-950 p-4 shadow-2xl text-zinc-100 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-cyan-400" />
            <h3 className="font-mono text-sm font-bold tracking-wider text-cyan-300 uppercase">
              Bến Điều Quân Chi Viện Khẩn Cấp (Quick Dispatch Dock)
            </h3>
          </div>
          <button
            onClick={() => {
              playClickSound()
              onClose()
            }}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Form */}
        <div className="mt-4 space-y-4">
          {/* Nguồn lực lượng */}
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
              1. Nguồn Lực Lượng Điều Động
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  playClickSound()
                  setSourceType("reserves")
                }}
                className={cn(
                  "p-2.5 rounded border text-left transition-colors cursor-pointer",
                  sourceType === "reserves"
                    ? "border-cyan-400 bg-cyan-950/60 text-cyan-200"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                )}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <Shield className="size-3.5 text-cyan-400" />
                  <span>Quân Dự Bị Quốc Gia</span>
                </div>
                <div className="mt-1 font-mono text-xs text-zinc-300">
                  Khả dụng: <span className="font-bold text-cyan-300">{reservesAvailable}</span> quân
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound()
                  setSourceType("sector")
                }}
                className={cn(
                  "p-2.5 rounded border text-left transition-colors cursor-pointer",
                  sourceType === "sector"
                    ? "border-cyan-400 bg-cyan-950/60 text-cyan-200"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                )}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <Users className="size-3.5 text-cyan-400" />
                  <span>Rút Từ Đồn Trú Sector</span>
                </div>
                <div className="mt-1 font-mono text-xs text-zinc-300">
                  Tại: <span className="font-bold text-cyan-300">{sourceSector?.name}</span>
                </div>
              </button>
            </div>

            {sourceType === "sector" && (
              <div className="mt-2">
                <select
                  value={fromSectorId}
                  onChange={(e) => setFromSectorId(e.target.value)}
                  className="w-full rounded border border-zinc-800 bg-zinc-900 p-2 text-xs font-mono text-zinc-200 focus:border-cyan-500 focus:outline-hidden cursor-pointer"
                >
                  {Object.values(worldState.sectors)
                    .filter((s) => s.sovereignty === "vss")
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.garrisonPower} quân đồn trú{s.isLockedForCombat ? " - ĐANG KHÓA COMBAT" : ""})
                      </option>
                    ))}
                </select>
                {isSourceLocked && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-red-400">
                    <Lock className="size-3.5 shrink-0" />
                    <span>Sector này đang bị khóa trong combat. Không thể điều chuyển quân!</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Đích đến (Tự chọn sẵn theo entity vừa click) */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-1">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                2. Sector Đích Tiếp Nhận (Destination)
              </label>
              {isPreselectedMatch && (
                <span className="flex items-center gap-1 rounded bg-cyan-950/80 border border-cyan-500/50 px-2 py-0.5 text-xs font-mono font-bold text-cyan-300">
                  <CheckCircle2 className="size-3 text-cyan-400" />
                  [ĐÃ CHỌN SẴN: {worldState.sectors[toSectorId]?.name || toSectorId}]
                </span>
              )}
            </div>
            <select
              value={toSectorId}
              onChange={(e) => setToSectorId(e.target.value)}
              className="mt-1.5 w-full rounded border border-zinc-800 bg-zinc-900 p-2 text-xs font-mono text-zinc-200 focus:border-cyan-500 focus:outline-hidden cursor-pointer"
            >
              {Object.values(worldState.sectors).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} [{s.sovereignty.toUpperCase()}] — Threat: {s.threatLevel}/{getSectorMaxThreat(s, worldState.threatConfig)} — Đồn trú: {s.garrisonPower}
                </option>
              ))}
            </select>
            <div className="mt-1 text-xs text-zinc-400">
              * Điểm đích được hệ thống tự động điền sẵn theo căn cứ / sector bạn vừa chọn. Bạn vẫn có thể đổi đích nếu cần.
            </div>
          </div>

          {/* Số lượng quân */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                3. Quân Số Chi Viện (Sẵn Có: {maxAvailable})
              </label>
              <span className="font-bold text-cyan-400 font-mono text-sm">{troopCount} quân</span>
            </div>

            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="range"
                min={10}
                max={Math.max(10, maxAvailable)}
                step={10}
                value={troopCount}
                onChange={(e) => setTroopCount(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAdjustCount(-50)}
                className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 cursor-pointer"
              >
                -50
              </button>
              <button
                type="button"
                onClick={() => handleAdjustCount(-25)}
                className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 cursor-pointer"
              >
                -25
              </button>
              <button
                type="button"
                onClick={() => handleAdjustCount(25)}
                className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 cursor-pointer"
              >
                +25
              </button>
              <button
                type="button"
                onClick={() => handleAdjustCount(50)}
                className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 cursor-pointer"
              >
                +50
              </button>
              <button
                type="button"
                onClick={handleSetMax}
                className="rounded border border-cyan-800/60 bg-cyan-950/40 px-3 py-1 text-xs text-cyan-300 font-bold hover:bg-cyan-900/60 cursor-pointer"
              >
                Tối Đa
              </button>
            </div>
          </div>

          {/* Lệnh Chiến Lược */}
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
              4. Lệnh Chiến Lược Kèm Theo
            </label>
            <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
              {(["reinforce", "defend", "attack", "recover"] as StrategicOrder[]).map((ord) => (
                <button
                  key={ord}
                  type="button"
                  onClick={() => {
                    playClickSound()
                    setSelectedOrder(ord)
                  }}
                  className={cn(
                    "p-2 rounded border text-center font-bold uppercase transition-colors cursor-pointer",
                    selectedOrder === ord
                      ? "border-cyan-400 bg-cyan-950/60 text-cyan-300 ring-1 ring-cyan-400/40"
                      : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                  )}
                >
                  {ord === "reinforce" && "Chi Viện"}
                  {ord === "defend" && "Cố Thủ"}
                  {ord === "attack" && "Tấn Công"}
                  {ord === "recover" && "Phục Hồi"}
                </button>
              ))}
            </div>
          </div>

          {/* Xem trước lộ trình */}
          <div className="rounded border border-zinc-800/80 bg-zinc-900/40 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-bold">
              <Route className="size-3.5 text-cyan-400" />
              <span>THÔNG SỐ HÀNH QUÂN:</span>
            </div>
            <div className="flex flex-wrap items-center justify-between text-zinc-300 text-xs gap-1">
              <span>Tuyến: <b className="text-white font-mono">{originId}</b> &rarr; <b className="text-white font-mono">{toSectorId}</b></span>
              <span className="font-bold text-cyan-400 font-mono">
                {pathResult ? `${pathResult.totalDistance} ngày chiến lược` : "Tuyến không thể đi"}
              </span>
            </div>
          </div>

          {/* Lỗi nếu có */}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded border border-red-500/50 bg-red-950/40 p-2.5 text-xs text-red-300">
              <AlertTriangle className="size-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-zinc-800 pt-3">
          <button
            type="button"
            onClick={() => {
              playClickSound()
              onClose()
            }}
            className="rounded border border-zinc-800 px-3.5 py-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleExecuteDispatch}
            disabled={isSourceLocked || troopCount <= 0 || troopCount > maxAvailable}
            className={cn(
              "flex items-center gap-1.5 rounded px-4 py-1.5 font-bold text-white transition-colors cursor-pointer",
              isSourceLocked || troopCount <= 0 || troopCount > maxAvailable
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-900/40"
            )}
          >
            <CheckCircle2 className="size-3.5" />
            <span>Phê Chuẩn Xuất Quân</span>
          </button>
        </div>
      </div>
    </div>
  )
}
