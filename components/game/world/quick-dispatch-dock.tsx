"use client"

import { useState } from "react"
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

  if (!isOpen) return null

  // Tìm quân khả dụng
  const reservesAvailable = worldState.military.reserves
  const sourceSector = worldState.sectors[fromSectorId]
  const sourceSectorGarrison = sourceSector?.garrisonPower || 0
  const isSourceLocked = sourceType === "sector" && !!sourceSector?.isLockedForCombat

  const maxAvailable = sourceType === "reserves" ? reservesAvailable : sourceSectorGarrison

  // Tính toán lộ trình
  const originId = sourceType === "reserves" ? "sol_command_hq" : fromSectorId
  const pathResult = findShortestPath(worldState.routes, originId, toSectorId)

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
      setErrorMessage(res.error || "Lỗi không xác định khi điều động quân.")
      return
    }

    // Lưu state ngay lập tức vào storage
    saveWorldState(worldState)
    playShieldSound()

    onDispatchComplete(
      `Đã điều động thành công ${troopCount} quân đến ${worldState.sectors[toSectorId]?.name || toSectorId} (Hành quân: ${res.deployment?.remainingDays || 1} ngày).`
    )
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-sm border border-cyan-500/40 bg-zinc-950 p-4 shadow-2xl shadow-cyan-950/50 font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-cyan-400 animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-cyan-300">
              BẾN ĐIỀU ĐỘNG CHI VIỆN NHANH // QUICK DISPATCH DOCK
            </span>
          </div>
          <button
            onClick={() => {
              playClickSound()
              onClose()
            }}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-4 space-y-4">
          {/* Nguồn xuất quân */}
          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
              1. Nguồn Xuất Quân
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  playClickSound()
                  setSourceType("reserves")
                  setErrorMessage(null)
                }}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded border transition-colors cursor-pointer text-left",
                  sourceType === "reserves"
                    ? "border-cyan-500 bg-cyan-950/40 text-cyan-200"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                )}
              >
                <div>
                  <div className="font-bold">Kho Dự Bị Trung Ương</div>
                  <div className="text-[10px] text-zinc-400">Sol Command HQ</div>
                </div>
                <div className="text-right font-bold text-cyan-400">
                  {reservesAvailable} quân
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound()
                  setSourceType("sector")
                  setErrorMessage(null)
                }}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded border transition-colors cursor-pointer text-left",
                  sourceType === "sector"
                    ? "border-cyan-500 bg-cyan-950/40 text-cyan-200"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                )}
              >
                <div>
                  <div className="font-bold">Đồn Trú Sector</div>
                  <div className="text-[10px] text-zinc-400">Điều động từ tiền đồn</div>
                </div>
                <div className="text-right font-bold text-amber-400">
                  {sourceType === "sector" ? `${sourceSectorGarrison} quân` : "Chọn sector"}
                </div>
              </button>
            </div>

            {sourceType === "sector" && (
              <div className="mt-2">
                <select
                  value={fromSectorId}
                  onChange={(e) => setFromSectorId(e.target.value)}
                  className="w-full rounded border border-zinc-800 bg-zinc-900 p-2 text-zinc-200 focus:border-cyan-500 focus:outline-hidden"
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
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-red-400">
                    <Lock className="size-3.5" />
                    <span>Sector này đang bị khóa trong combat. Không thể điều chuyển quân!</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Đích đến */}
          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
              2. Sector Đích Tiếp Nhận
            </label>
            <select
              value={toSectorId}
              onChange={(e) => setToSectorId(e.target.value)}
              className="mt-1.5 w-full rounded border border-zinc-800 bg-zinc-900 p-2 text-zinc-200 focus:border-cyan-500 focus:outline-hidden"
            >
              {Object.values(worldState.sectors).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} [{s.sovereignty.toUpperCase()}] — Threat: {s.threatLevel}/1000 — Đồn trú: {s.garrisonPower}
                </option>
              ))}
            </select>
          </div>

          {/* Số lượng quân */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
                3. Quân Số Chi Viện (Sẵn Có: {maxAvailable})
              </label>
              <span className="font-bold text-cyan-400">{troopCount} quân</span>
            </div>

            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="range"
                min={10}
                max={Math.max(10, maxAvailable)}
                step={10}
                value={troopCount}
                onChange={(e) => setTroopCount(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div className="mt-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAdjustCount(-50)}
                className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-400 hover:text-white"
              >
                -50
              </button>
              <button
                type="button"
                onClick={() => handleAdjustCount(-25)}
                className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-400 hover:text-white"
              >
                -25
              </button>
              <button
                type="button"
                onClick={() => handleAdjustCount(25)}
                className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-400 hover:text-white"
              >
                +25
              </button>
              <button
                type="button"
                onClick={() => handleAdjustCount(50)}
                className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-400 hover:text-white"
              >
                +50
              </button>
              <button
                type="button"
                onClick={handleSetMax}
                className="rounded border border-cyan-800/60 bg-cyan-950/40 px-2 py-1 text-[10px] text-cyan-300 font-bold hover:bg-cyan-900/60"
              >
                Tối Đa
              </button>
            </div>
          </div>

          {/* Lệnh Chiến Lược */}
          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
              4. Lệnh Chiến Lược Kèm Theo
            </label>
            <div className="mt-1.5 grid grid-cols-4 gap-1.5 text-[11px]">
              {(["reinforce", "defend", "attack", "recover"] as StrategicOrder[]).map((ord) => (
                <button
                  key={ord}
                  type="button"
                  onClick={() => {
                    playClickSound()
                    setSelectedOrder(ord)
                  }}
                  className={cn(
                    "p-1.5 rounded border text-center font-bold uppercase transition-colors cursor-pointer",
                    selectedOrder === ord
                      ? "border-cyan-400 bg-cyan-950/60 text-cyan-300"
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
          <div className="rounded border border-zinc-800/80 bg-zinc-900/40 p-2.5">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-bold">
              <Route className="size-3.5 text-cyan-400" />
              <span>THÔNG SỐ HÀNH QUÂN:</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-zinc-300 text-[11px]">
              <span>Tuyến: {originId} &rarr; {toSectorId}</span>
              <span className="font-bold text-cyan-400">
                {pathResult ? `${pathResult.totalDistance} ngày chiến lược` : "Tuyến không thể đi"}
              </span>
            </div>
          </div>

          {/* Lỗi nếu có */}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded border border-red-500/50 bg-red-950/40 p-2 text-[11px] text-red-300">
              <AlertTriangle className="size-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-zinc-800 pt-3">
          <button
            type="button"
            onClick={() => {
              playClickSound()
              onClose()
            }}
            className="rounded border border-zinc-800 px-3 py-1.5 text-zinc-400 hover:text-white transition-colors"
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
