"use client"

import { useState, useMemo } from "react"
import {
  Anchor,
  Award,
  ChevronRight,
  Coins,
  Compass,
  Crosshair,
  Flame,
  Gauge,
  Heart,
  Navigation,
  Package,
  RefreshCw,
  RotateCcw,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  Users,
  Wheat,
  Wrench,
  X,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { playClickSound } from "@/lib/game/audio"
import type { WorldState } from "@/lib/game/world/types"
import type { FleetEntityState } from "@/lib/game/world/fleet/fleet-entity"
import {
  orderFleetTransit,
  dockFleetAtBase,
  undockFleetFromBase,
  setFleetFlagship,
  ensureWorldFleetsInitialized,
} from "@/lib/game/world/fleet/fleet-entity"
import {
  calculateDailyFleetConsumption,
  calculateFleetCargoCapacity,
} from "@/lib/game/world/fleet/fleet-logistics"
import {
  redeemFrameAtStore,
  claimFleetMaintenanceSubsidy,
  calculateFleetSubsidyRate,
} from "@/lib/game/world/fleet/fleet-frame-engine"
import { evaluateFleetReadiness } from "@/lib/game/world/fleet/fleet-ai-command"
import { allocateFleetCrewToShips } from "@/lib/game/world/fleet/fleet-personnel"

interface FleetCommandModalProps {
  isOpen: boolean
  onClose: () => void
  worldState: WorldState
  initialSelectedFleetId?: string
  onWorldStateUpdated?: (newState: WorldState) => void
}

export function FleetCommandModal({
  isOpen,
  onClose,
  worldState,
  initialSelectedFleetId,
  onWorldStateUpdated,
}: FleetCommandModalProps) {
  const fleets = useMemo(() => {
    if (!worldState.fleets || Object.keys(worldState.fleets).length === 0) {
      return Object.values(ensureWorldFleetsInitialized(worldState))
    }
    return Object.values(worldState.fleets)
  }, [worldState.fleets, worldState])

  const [selectedFleetId, setSelectedFleetId] = useState<string>(
    initialSelectedFleetId || fleets[0]?.fleetId || ""
  )
  const [activeTab, setActiveTab] = useState<"ships" | "personnel" | "treasury_frame" | "logistics" | "command">("ships")
  const [targetSectorForTransit, setTargetSectorForTransit] = useState<string>("")
  const [notification, setNotification] = useState<string | null>(null)

  const activeFleet: FleetEntityState | undefined = useMemo(() => {
    return (
      fleets.find((f) => f.fleetId === selectedFleetId) ||
      fleets[0]
    )
  }, [fleets, selectedFleetId])

  if (!isOpen) return null

  const showToast = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }

  // Handle Hyperlane Move
  const handleOrderTransit = () => {
    if (!activeFleet || !targetSectorForTransit) return
    playClickSound()

    const orderRes = orderFleetTransit(activeFleet, targetSectorForTransit, 2, worldState.currentDay || 1)
    if (orderRes.success) {
      showToast(`Hạm đội ${activeFleet.name} đã xuất kích! Dự kiến đến nơi sau ${orderRes.travelDays} ngày game.`)
      onWorldStateUpdated?.({ ...worldState })
    } else {
      showToast(orderRes.error || "Không thể thực hiện hành quân")
    }
  }

  // Handle Docking
  const handleToggleDock = () => {
    if (!activeFleet) return
    playClickSound()

    if (activeFleet.operationalStatus === "DOCKED") {
      undockFleetFromBase(activeFleet)
      showToast(`Hạm đội ${activeFleet.name} đã rời cảng, chuyển sang đồn trú không phận.`)
    } else {
      dockFleetAtBase(activeFleet, activeFleet.registeredHomeBaseId, activeFleet.currentLocation.sectorId)
      showToast(`Hạm đội ${activeFleet.name} đã cập cảng căn cứ ${activeFleet.registeredHomeBaseId}.`)
    }
    onWorldStateUpdated?.({ ...worldState })
  }

  // Handle Maintenance Subsidy Claim
  const handleClaimSubsidy = () => {
    if (!activeFleet) return
    playClickSound()

    const claimRes = claimFleetMaintenanceSubsidy(
      activeFleet,
      activeFleet.frameState,
      1200,
      40,
      false,
      worldState.currentDay || 1
    )

    if (claimRes.success) {
      showToast(`Đã nhận trợ cấp quốc gia! Ngân sách bao cấp: ${claimRes.subsidizedCredits} Credits (Chi trả: ${claimRes.fleetPaidCredits}).`)
      onWorldStateUpdated?.({ ...worldState })
    } else {
      showToast(claimRes.error || "Không đủ điều kiện nhận trợ cấp")
    }
  }

  // Handle FRAME Store Exchange
  const handleRedeemBlueprint = () => {
    if (!activeFleet) return
    playClickSound()

    const res = redeemFrameAtStore(
      activeFleet.frameState,
      500,
      "Bản Vẽ Nâng Cấp Khiên Hạt Lượng Tử MK IV",
      worldState.currentDay || 1
    )

    if (res.success) {
      showToast("Đã đổi thành công Bản vẽ vũ khí tại FRAME Store! Điểm khả dụng còn lại: " + res.remainingAvailable)
      onWorldStateUpdated?.({ ...worldState })
    } else {
      showToast(res.error || "Đổi thưởng thất bại")
    }
  }

  const shipsList = activeFleet ? Object.values(activeFleet.ships) : []
  const cargoWeight = activeFleet ? calculateFleetCargoCapacity(activeFleet.ships) : 0
  const dailyConsumption = activeFleet
    ? calculateDailyFleetConsumption(activeFleet.ships, activeFleet.personnel.crewPool.totalCrew, activeFleet.operationalStatus)
    : { foodRequired: 0, energyRequired: 0 }
  const readiness = activeFleet ? evaluateFleetReadiness(activeFleet.ships, activeFleet.personnel) : null
  const subsidyRate = activeFleet
    ? calculateFleetSubsidyRate(activeFleet, activeFleet.frameState, 20, false)
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative flex flex-col h-[92vh] max-h-[850px] w-full max-w-6xl rounded-xl border border-cyan-500/30 bg-slate-950/95 shadow-2xl shadow-cyan-950/50 overflow-hidden text-slate-100">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 bg-slate-900/80 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-400">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base sm:text-lg tracking-wider text-cyan-300">
                  BỘ TƯ LỆNH HẠM ĐỘI QUỐC GIA (FND-7)
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                  {fleets.length} HẠM ĐỘI CHÍNH QUY
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Quản lý biên chế chiến hạm, độc lập tài chính, hậu cần 5 tài nguyên & Sổ bộ vinh danh FRAME
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playClickSound()
              onClose()
            }}
            className="p-1.5 rounded-lg border border-slate-700 hover:border-red-500/50 bg-slate-800/50 hover:bg-red-950/40 text-slate-400 hover:text-red-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-cyan-950 border border-cyan-400 text-cyan-200 text-xs sm:text-sm font-sans shadow-lg shadow-cyan-950/80 animate-in fade-in slide-in-from-top-2">
            {notification}
          </div>
        )}

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          
          {/* Left Fleet Selector Panel */}
          <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-900/40 p-3 flex flex-col gap-2 overflow-y-auto">
            <span className="text-[11px] font-mono font-semibold uppercase text-slate-400 tracking-wider px-2">
              Danh Sách Hạm Đội
            </span>

            {fleets.length === 0 ? (
              <div className="text-xs text-slate-500 p-4 text-center">
                Chưa có Hạm đội nào được thành lập trong thế giới.
              </div>
            ) : (
              fleets.map((f) => {
                const isSelected = activeFleet?.fleetId === f.fleetId
                return (
                  <button
                    key={f.fleetId}
                    onClick={() => {
                      playClickSound()
                      setSelectedFleetId(f.fleetId)
                    }}
                    className={cn(
                      "flex flex-col gap-1 p-2.5 rounded-lg border text-left transition-all",
                      isSelected
                        ? "border-cyan-500/60 bg-cyan-950/40 text-cyan-100 shadow-md shadow-cyan-950/40"
                        : "border-slate-800/70 hover:border-slate-700 bg-slate-900/30 text-slate-300 hover:bg-slate-900/60"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs sm:text-sm truncate">
                        {f.name}
                      </span>
                      <span className={cn(
                        "text-[10px] font-mono px-1.5 py-0.5 rounded",
                        f.operationalStatus === "DOCKED" ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/30" :
                        f.operationalStatus === "IN_TRANSIT" ? "bg-amber-950/80 text-amber-400 border border-amber-500/30" :
                        "bg-cyan-950/80 text-cyan-400 border border-cyan-500/30"
                      )}>
                        {f.operationalStatus}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{f.currentLocation.sectorId}</span>
                      <span>{Object.keys(f.ships).length} Tàu</span>
                    </div>

                    {f.isAustereMode && (
                      <span className="text-[10px] font-mono text-red-400 bg-red-950/50 px-1 py-0.5 rounded border border-red-500/30 text-center">
                        ⚠️ CHẾ ĐỘ TIẾT KIỆM (AUSTERE)
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Right Fleet Inspection & Command Workspace */}
          {activeFleet ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/40">
              
              {/* Fleet Identity Header & Summary */}
              <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-bold text-lg sm:text-xl text-cyan-200">
                      {activeFleet.name}
                    </h2>
                    {activeFleet.customCallsign && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        "{activeFleet.customCallsign}"
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span>Phân cấp: <b className="text-slate-200">{activeFleet.fleetClassId}</b></span>
                    <span>•</span>
                    <span>Tọa độ: <b className="text-cyan-300">{activeFleet.currentLocation.sectorId}</b></span>
                    <span>•</span>
                    <span>Căn cứ HQ: <b className="text-slate-200">{activeFleet.registeredHomeBaseId}</b></span>
                    <span>•</span>
                    <span>Persona: <b className="text-amber-300">{activeFleet.aiPersona}</b></span>
                  </div>
                </div>

                {/* Readines Meter */}
                {readiness && (
                  <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
                    <Gauge className={cn("w-4 h-4", readiness.isCombatReady ? "text-emerald-400" : "text-amber-400")} />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Sẵn Sàng Chiến Đấu</span>
                      <span className={cn("text-xs font-bold font-mono", readiness.overallReadinessPercent >= 60 ? "text-emerald-300" : "text-amber-300")}>
                        {readiness.overallReadinessPercent}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-Tabs Selector */}
              <div className="flex border-b border-slate-800/80 px-4 bg-slate-900/40">
                <button
                  onClick={() => setActiveTab("ships")}
                  className={cn(
                    "flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs sm:text-sm font-semibold transition-colors",
                    activeTab === "ships"
                      ? "border-cyan-400 text-cyan-300"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  )}
                >
                  <Swords className="w-4 h-4" />
                  Biên Chế Chiến Hạm ({shipsList.length})
                </button>

                <button
                  onClick={() => setActiveTab("personnel")}
                  className={cn(
                    "flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs sm:text-sm font-semibold transition-colors",
                    activeTab === "personnel"
                      ? "border-cyan-400 text-cyan-300"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  )}
                >
                  <Users className="w-4 h-4" />
                  Thủy Thủ Đoàn & Nhân Lực
                </button>

                <button
                  onClick={() => setActiveTab("treasury_frame")}
                  className={cn(
                    "flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs sm:text-sm font-semibold transition-colors",
                    activeTab === "treasury_frame"
                      ? "border-cyan-400 text-cyan-300"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  )}
                >
                  <Coins className="w-4 h-4" />
                  Ngân Khố & FRAME
                </button>

                <button
                  onClick={() => setActiveTab("logistics")}
                  className={cn(
                    "flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs sm:text-sm font-semibold transition-colors",
                    activeTab === "logistics"
                      ? "border-cyan-400 text-cyan-300"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  )}
                >
                  <Package className="w-4 h-4" />
                  Hậu Cần & Tiếp Tế
                </button>

                <button
                  onClick={() => setActiveTab("command")}
                  className={cn(
                    "flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs sm:text-sm font-semibold transition-colors",
                    activeTab === "command"
                      ? "border-cyan-400 text-cyan-300"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  )}
                >
                  <Navigation className="w-4 h-4" />
                  Điều Động Tác Chiến
                </button>
              </div>

              {/* Sub-Tab Content Viewport */}
              <div className="flex-1 overflow-y-auto p-4">
                
                {/* TAB 1: SHIPS ROSTER */}
                {activeTab === "ships" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>DANH MỤC TÀU CHIẾN THUỘC BIÊN CHẾ ({shipsList.length} CHIẾC)</span>
                      <span>SOÁI HẠM: {activeFleet.flagshipInstanceId || "Chưa bổ nhiệm"}</span>
                    </div>

                    {shipsList.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 text-sm">
                        Hạm đội hiện tại chưa có chiến hạm nào trong biên chế.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {shipsList.map((ship) => {
                          const isFlagship = activeFleet.flagshipInstanceId === ship.instanceId
                          const hullPct = Math.round((ship.hullHp / (ship.maxHullHp || 1)) * 100)
                          const shieldPct = Math.round((ship.shieldHp / (ship.maxShieldHp || 1)) * 100)

                          return (
                            <div
                              key={ship.instanceId}
                              className={cn(
                                "flex flex-col gap-2 p-3 rounded-lg border bg-slate-900/50",
                                isFlagship ? "border-amber-500/50 bg-amber-950/20 shadow-md shadow-amber-950/30" : "border-slate-800"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {isFlagship && (
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                  )}
                                  <span className="font-semibold text-xs sm:text-sm text-slate-200">
                                    {ship.customName || ship.instanceId}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/20">
                                  {ship.definitionId}
                                </span>
                              </div>

                              {/* Bars */}
                              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                                <div>
                                  <div className="flex justify-between text-slate-400 text-[10px]">
                                    <span>HULL</span>
                                    <span>{ship.hullHp} / {ship.maxHullHp} ({hullPct}%)</span>
                                  </div>
                                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-0.5">
                                    <div className="h-full bg-emerald-500" style={{ width: `${hullPct}%` }} />
                                  </div>
                                </div>

                                <div>
                                  <div className="flex justify-between text-slate-400 text-[10px]">
                                    <span>SHIELD</span>
                                    <span>{ship.shieldHp} / {ship.maxShieldHp} ({shieldPct}%)</span>
                                  </div>
                                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-0.5">
                                    <div className="h-full bg-cyan-500" style={{ width: `${shieldPct}%` }} />
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                                <span>Độ bền: <b className="text-slate-200">{ship.condition}%</b></span>
                                <span>Thủy thủ: <b className="text-slate-200">{ship.assignedCrewCount}</b></span>
                                
                                {!isFlagship && (
                                  <button
                                    onClick={() => {
                                      playClickSound()
                                      setFleetFlagship(activeFleet, ship.instanceId)
                                      onWorldStateUpdated?.({ ...worldState })
                                    }}
                                    className="text-[10px] text-amber-400 hover:text-amber-300 underline"
                                  >
                                    Đặt làm Soái hạm
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: PERSONNEL & CREW POOL */}
                {activeTab === "personnel" && (
                  <div className="flex flex-col gap-4">
                    {/* Top Stat Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col">
                        <span className="text-[10px] text-slate-400 font-mono uppercase">Tổng Thủy Thủ Đoàn</span>
                        <span className="text-lg font-bold font-mono text-cyan-300 mt-1">
                          {activeFleet.personnel.crewPool.totalCrew.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500">Fleet Crew Pool</span>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col">
                        <span className="text-[10px] text-slate-400 font-mono uppercase">Đang Trực Chiến (Assigned)</span>
                        <span className="text-lg font-bold font-mono text-emerald-300 mt-1">
                          {activeFleet.personnel.crewPool.crewAssigned.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500">Biên chế trên các chiến hạm</span>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col">
                        <span className="text-[10px] text-slate-400 font-mono uppercase">Quân Số Nhàn Rỗi (Idle)</span>
                        <span className="text-lg font-bold font-mono text-amber-300 mt-1">
                          {activeFleet.personnel.crewPool.crewIdle.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500">Sẵn sàng điều phối ngay</span>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col">
                        <span className="text-[10px] text-slate-400 font-mono uppercase">Sĩ Khí Hạm Đội (Morale)</span>
                        <span className="text-lg font-bold font-mono text-purple-300 mt-1">
                          {activeFleet.personnel.morale}%
                        </span>
                        <span className="text-[10px] text-slate-500">Hiệu suất tác chiến tinh thần</span>
                      </div>
                    </div>

                    {/* 3-Pass Ship Crew Allocator Banner */}
                    <div className="p-3.5 rounded-lg border border-cyan-500/30 bg-cyan-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs font-semibold text-cyan-200">
                            Bộ Điều Phối Nhân Lực 3 Vòng (3-Pass Ship Crew Allocator)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 max-w-xl">
                          Pass 1: Cấp đủ nhân sự tối thiểu (Minimum Crew) &bull; Pass 2: Đạt chuẩn 100% Target Crew &bull; Pass 3: Dồn nhân lực tối đa nhận buff tốc độ sửa chữa +25%.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          playClickSound()
                          const allocRes = allocateFleetCrewToShips(
                            activeFleet.personnel.crewPool,
                            Object.values(activeFleet.ships)
                          )
                          showToast(
                            `Phân bổ hoàn tất: ${allocRes.shipsEvaluated} tàu được đánh giá (${allocRes.operationalShipsCount} tàu sẵn sàng tác chiến, ${allocRes.understaffedShipsCount} tàu thiếu quân).`
                          )
                          onWorldStateUpdated?.({ ...worldState })
                        }}
                        className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-950 transition-colors whitespace-nowrap shrink-0"
                      >
                        Thực Thi Phân Bổ 3 Vòng
                      </button>
                    </div>

                    {/* Named Commanders and Pilots List */}
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-mono font-semibold text-slate-400 uppercase">
                        Sĩ Quan Chỉ Huy Tinh Anh (Named Pilots & Staff)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/40 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-200">
                              {activeFleet.personnel.captain?.pilotName || "Chỉ Huy Trưởng Liên Minh"}
                            </span>
                            <span className="text-[10px] text-slate-400">Thuyền Trưởng Hạm Đội (Fleet Captain)</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px]">
                            ACTIVE DUTY
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/40 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-200">
                              {activeFleet.personnel.executiveOfficer?.pilotName || "Sĩ Quan Phụ Tá Chiến Thuật"}
                            </span>
                            <span className="text-[10px] text-slate-400">Sĩ Quan Thuyền Phó (Fleet XO)</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 text-[10px]">
                            ACTIVE DUTY
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: TREASURY & FRAME */}
                {activeTab === "treasury_frame" && (
                  <div className="flex flex-col gap-4">
                    {/* Top Stat Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col">
                        <span className="text-[10px] text-slate-400 font-mono uppercase">Credits Ngân Khố</span>
                        <span className="text-lg font-bold font-mono text-cyan-300 mt-1">
                          {activeFleet.treasury.credits.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500">Độc lập tài chính</span>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col">
                        <span className="text-[10px] text-slate-400 font-mono uppercase">Supply Credits</span>
                        <span className="text-lg font-bold font-mono text-amber-300 mt-1">
                          {activeFleet.treasury.supplyCredits.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500">Hạn mức chi viện quốc gia</span>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col">
                        <span className="text-[10px] text-slate-400 font-mono uppercase">Available FRAME</span>
                        <span className="text-lg font-bold font-mono text-emerald-300 mt-1">
                          {activeFleet.frameState.availableFrame.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500">Điểm chi tiêu đổi thưởng</span>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col">
                        <span className="text-[10px] text-slate-400 font-mono uppercase">Total FRAME</span>
                        <span className="text-lg font-bold font-mono text-purple-300 mt-1">
                          {activeFleet.frameState.totalFrame.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500">Bảng vàng vinh danh lịch sử</span>
                      </div>
                    </div>

                    {/* FRAME Store Quick Exchange */}
                    <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-950/20 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-purple-400" />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-purple-200">
                            Cửa Hàng Trao Đổi Công Nghệ & Khí Tài FRAME Store
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Đổi 500 Available FRAME để nhận Bản vẽ Module Siêu Cấp
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleRedeemBlueprint}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-950 transition-colors"
                      >
                        Đổi Bản Vẽ (500 pts)
                      </button>
                    </div>

                    {/* Ledger Audit Trail */}
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-mono font-semibold text-slate-400 uppercase">
                        Sổ Nhật Ký Giao Dịch Ngân Khố (Audit Ledger)
                      </span>
                      <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/40 p-2 flex flex-col gap-1.5 text-[11px] font-mono">
                        {activeFleet.treasury.ledgerHistory.slice(-6).reverse().map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/60">
                            <span className="text-slate-400">Ngày {entry.gameDay}: {entry.description}</span>
                            <span className={cn(
                              "font-bold",
                              entry.amountCredits >= 0 ? "text-emerald-400" : "text-red-400"
                            )}>
                              {entry.amountCredits >= 0 ? `+${entry.amountCredits}` : entry.amountCredits} Cr
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: LOGISTICS */}
                {activeTab === "logistics" && (
                  <div className="flex flex-col gap-4">
                    {/* Cargo 5 Resources */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>KHOANG TIẾP TẾ CHIẾN LƯỢC (WORLD RESOURCE LEDGER)</span>
                        <span>SỨC CHỨA TỐI ĐA: {cargoWeight} ĐƠN VỊ</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 flex flex-col">
                          <span className="text-[10px] text-slate-400 font-mono">LƯƠNG THỰC (FOOD)</span>
                          <span className="text-base font-bold text-emerald-400 mt-1">{activeFleet.cargo.food}</span>
                          <span className="text-[10px] text-slate-500">Tiêu hao: {dailyConsumption.foodRequired}/ngày</span>
                        </div>

                        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 flex flex-col">
                          <span className="text-[10px] text-slate-400 font-mono">NĂNG LƯỢNG (PLASMA)</span>
                          <span className="text-base font-bold text-cyan-400 mt-1">{activeFleet.cargo.energy}</span>
                          <span className="text-[10px] text-slate-500">Tiêu hao: {dailyConsumption.energyRequired}/ngày</span>
                        </div>

                        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 flex flex-col">
                          <span className="text-[10px] text-slate-400 font-mono">VẬT TƯ HẬU CẦN</span>
                          <span className="text-base font-bold text-amber-400 mt-1">{activeFleet.cargo.logisticsSupplies}</span>
                          <span className="text-[10px] text-slate-500">Đạn dược & linh kiện</span>
                        </div>

                        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 flex flex-col">
                          <span className="text-[10px] text-slate-400 font-mono">VẬT LIỆU CÔNG NGHIỆP</span>
                          <span className="text-base font-bold text-indigo-400 mt-1">{activeFleet.cargo.industrialMaterials}</span>
                          <span className="text-[10px] text-slate-500">Sửa chữa thân vỏ</span>
                        </div>

                        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 flex flex-col">
                          <span className="text-[10px] text-slate-400 font-mono">DỮ LIỆU TÁC CHIẾN</span>
                          <span className="text-base font-bold text-purple-400 mt-1">{activeFleet.cargo.tacticalData}</span>
                          <span className="text-[10px] text-slate-500">Bản đồ thiên hà</span>
                        </div>
                      </div>
                    </div>

                    {/* Subsidy Assistance */}
                    <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-950/20 flex items-center justify-between gap-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs font-semibold text-cyan-200">
                            Chính Sách Trợ Cấp Bảo Dưỡng Hạm Đội Quốc Gia
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-0.5">
                          Tỷ lệ trợ cấp hiện tại: <b className="text-emerald-300">{subsidyRate?.subsidyRatePercent}%</b> ({subsidyRate?.reason})
                        </span>
                      </div>
                      <button
                        onClick={handleClaimSubsidy}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-950 transition-colors"
                      >
                        Yêu Cầu Trợ Cấp
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 4: COMMAND & TRANSIT */}
                {activeTab === "command" && (
                  <div className="flex flex-col gap-4">
                    {/* Hyperlane Transit Control */}
                    <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50 flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-cyan-300 text-sm font-semibold">
                        <Navigation className="w-4 h-4" />
                        <span>Hành Quân Tuyến Siêu Không Gian (Hyperlane Transit)</span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <input
                          type="text"
                          placeholder="Nhập mã Sector đích (ví dụ: SEC_ORION_ARM)..."
                          value={targetSectorForTransit}
                          onChange={(e) => setTargetSectorForTransit(e.target.value)}
                          className="flex-1 w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 font-mono focus:outline-none focus:border-cyan-500"
                        />
                        <button
                          onClick={handleOrderTransit}
                          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Phát Lệnh Xuất Kích
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        * Tốc độ di chuyển thực tế phụ thuộc vào hệ số vận tốc của lớp hạm đội. Không dịch chuyển tức thời.
                      </span>
                    </div>

                    {/* Dock / Undock Base Toggle */}
                    <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-slate-800 text-slate-300">
                          <Anchor className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-200">
                            Cổng Neo Đậu Docking Port ({activeFleet.currentLocation.baseId || "Không có cảng"})
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Trạng thái hiện tại: <b className="text-cyan-300">{activeFleet.operationalStatus}</b>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleToggleDock}
                        className={cn(
                          "px-4 py-2 rounded-lg text-xs font-semibold transition-colors",
                          activeFleet.operationalStatus === "DOCKED"
                            ? "bg-amber-600 hover:bg-amber-500 text-white"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        )}
                      >
                        {activeFleet.operationalStatus === "DOCKED" ? "Rời Cảng Ra Tuyến Tuần Tra" : "Cập Cảng Căn Cứ"}
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Chọn một Hạm đội từ danh sách bên trái để kiểm tra chi tiết.
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
