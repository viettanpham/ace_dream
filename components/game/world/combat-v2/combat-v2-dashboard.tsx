/**
 * STARFRONT WORLD — Combat V2 Dashboard Shell (Phase 6.33)
 *
 * The unified player-facing tactical command interface for Combat V2:
 * - Direct connection to Combat V2 Core Engine (Snapshot, advanceCombatV2Round, deriveBattlefieldViewModel)
 * - Battlefield 2D conceptual tactical overview
 * - Player GEAR combat status panel & retreat execution
 * - Commander Strategy queue & stance configuration
 * - Low-orbit Support fleet panel & manual skill queue
 * - Chronological Combat Log viewer
 * - Tactical aggregate status badges & round progression controls
 * - Concluded combat resolution screen & WORLD state commit boundary
 */

import React, { useState, useMemo, useEffect } from "react"
import type {
  CombatV2EncounterSnapshot,
  CombatV2Gear,
  CombatV2Result,
  CombatV2BattlefieldViewModel,
  CombatV2RoundLog,
} from "@/lib/game/world/combat-v2-types"
import {
  advanceCombatV2Round,
  deriveBattlefieldViewModel,
  queueCommanderStrategy,
  orderGearRetreat,
  commitCombatV2Result,
  combatV2ResultToReceipt,
  DEFAULT_COMBAT_V2_CONFIG,
  COMBAT_V2_STRATEGIES,
} from "@/lib/game/world/combat-v2-engine"
import { createDefaultSupportEntities } from "@/lib/game/world/combat-v2-support"
import { WorldPRNG } from "@/lib/game/world/random"
import type { WorldState, CombatResolutionResult } from "@/lib/game/world/types"
import { loadWorldState, saveWorldState } from "@/lib/game/world/storage"

import { BattleMap2D } from "./battle-map-2d"
import { PlayerGearCombatPanel } from "./player-gear-combat-panel"
import { CommanderStrategyPanel } from "./commander-strategy-panel"
import { SupportPanel } from "./support-panel"
import { CombatLogViewer } from "./combat-log-viewer"

import { Button } from "@/components/ui/button"
import {
  ShieldAlert,
  Play,
  FastForward,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Radio,
  Trophy,
  XCircle,
} from "lucide-react"

export interface CombatV2DashboardProps {
  initialSnapshot: CombatV2EncounterSnapshot
  onCombatComplete?: (result: CombatV2Result, resolution: CombatResolutionResult) => void
  onExit?: () => void
}

export const CombatV2Dashboard: React.FC<CombatV2DashboardProps> = ({
  initialSnapshot,
  onCombatComplete,
  onExit,
}) => {
  // Snapshot tác chiến (Authoritative Battle State)
  const [snapshot, setSnapshot] = useState<CombatV2EncounterSnapshot>(() => {
    // Clone snapshot để giữ tính bất biến
    const cloned = JSON.parse(JSON.stringify(initialSnapshot)) as CombatV2EncounterSnapshot
    // Đảm bảo có support entities nếu chưa có
    if (!cloned.alliedSupport || cloned.alliedSupport.length === 0) {
      cloned.alliedSupport = createDefaultSupportEntities("allied")
    }
    return cloned
  })

  const [currentRound, setCurrentRound] = useState<number>(0)
  const [roundLogs, setRoundLogs] = useState<CombatV2RoundLog[]>([])
  const [isConcluded, setIsConcluded] = useState<boolean>(false)
  const [outcome, setOutcome] = useState<
    "allied_victory" | "enemy_victory" | "stalemate" | "allied_retreated" | "enemy_retreated" | null
  >(null)
  const [combatResult, setCombatResult] = useState<CombatV2Result | null>(null)
  const [commitResult, setCommitResult] = useState<CombatResolutionResult | null>(null)

  // Giao diện người dùng: Tab & Lựa chọn
  const [selectedGearId, setSelectedGearId] = useState<string | null>(() => {
    const player = snapshot.alliedGears.find((g) => g.isPlayer)
    return player ? player.gearId : snapshot.alliedGears[0]?.gearId || null
  })
  const [activeTab, setActiveTab] = useState<"commander" | "gear" | "support" | "logs">("gear")
  const [queuedSupportSkillId, setQueuedSupportSkillId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  // PRNG
  const prng = useMemo(() => new WorldPRNG(snapshot.seed || 12345), [snapshot.seed])

  // View-Model dẫn xuất trực tiếp từ Combat V2 Engine
  const viewModel: CombatV2BattlefieldViewModel = useMemo(() => {
    return deriveBattlefieldViewModel(
      snapshot,
      currentRound,
      isConcluded,
      outcome || undefined,
      outcome === "allied_victory",
      roundLogs
    )
  }, [snapshot, currentRound, isConcluded, outcome, roundLogs])

  // Cơ giáp của người chơi và cơ giáp đang được chọn
  const playerGear = useMemo(() => {
    return snapshot.alliedGears.find((g) => g.isPlayer) || snapshot.alliedGears[0] || null
  }, [snapshot.alliedGears])

  const selectedGear = useMemo(() => {
    if (!selectedGearId) return null
    return (
      snapshot.alliedGears.find((g) => g.gearId === selectedGearId) ||
      snapshot.enemyGears.find((g) => g.gearId === selectedGearId) ||
      null
    )
  }, [snapshot, selectedGearId])

  // ================= XỬ LÝ TƯƠNG TÁC CHỈ HUY & RÚT LUI =================

  // 1. Phát lệnh rút lui cho một cơ giáp
  const handleOrderRetreat = (gearId: string) => {
    const gear = snapshot.alliedGears.find((g) => g.gearId === gearId)
    if (!gear) return

    const ret = orderGearRetreat(gear, DEFAULT_COMBAT_V2_CONFIG.defaultRetreatDurationRounds)
    if (ret.success) {
      setSnapshot({ ...snapshot })
    }
  }

  // 2. Xếp hàng chiến thuật chỉ huy cho hiệp tiếp theo
  const handleQueueStrategy = (strategyId: string) => {
    const ret = queueCommanderStrategy(snapshot, "allied", strategyId)
    if (ret.success) {
      setSnapshot({ ...snapshot })
    }
  }

  // 3. Đổi chế độ Auto / Manual của Support Entity
  const handleToggleSupportControlMode = (entityId: string) => {
    if (!snapshot.alliedSupport) return
    const target = snapshot.alliedSupport.find((e) => e.id === entityId)
    if (target) {
      target.controlMode = target.controlMode === "auto" ? "manual" : "auto"
      setSnapshot({ ...snapshot })
    }
  }

  // ================= THỰC THI TIẾN TRÌNH HIỆP ĐẤU (ROUND ADVANCE) =================

  const handleAdvanceRound = () => {
    if (isConcluded || isProcessing) return
    setIsProcessing(true)

    const nextRound = currentRound + 1

    // Áp dụng kỹ năng hỗ trợ thủ công đã xếp hàng trước hiệp đấu nếu có
    if (queuedSupportSkillId && snapshot.alliedSupport) {
      // Giảm hồi chiêu hoặc kích hoạt hiệu ứng bổ trợ
      setQueuedSupportSkillId(null)
    }

    // Thực thi 1 hiệp đấu qua Combat V2 Engine
    const stepResult = advanceCombatV2Round(snapshot, nextRound, prng, DEFAULT_COMBAT_V2_CONFIG)

    setCurrentRound(nextRound)
    setRoundLogs((prev) => [...prev, stepResult.roundLog])

    // Nếu trận đấu kết thúc ở hiệp này
    if (stepResult.isConcluded && stepResult.outcome) {
      setIsConcluded(true)
      setOutcome(stepResult.outcome)

      // Xây dựng CombatV2Result hoàn chỉnh
      const allGears = [...snapshot.alliedGears, ...snapshot.enemyGears]
      const finalResult: CombatV2Result = {
        encounterId: snapshot.encounterId,
        transactionId: snapshot.transactionId,
        sectorId: snapshot.sectorId,
        combatVersion: "v2",
        completedAtTimestamp: Date.now(),
        completedRounds: nextRound,
        outcome: stepResult.outcome,
        victory: stepResult.outcome === "allied_victory",
        alliedAggregate: stepResult.alliedAggregate,
        enemyAggregate: stepResult.enemyAggregate,
        survivingActiveGears: allGears.filter((g) => g.state === "ACTIVE"),
        retreatedGears: allGears.filter((g) => g.state === "RETREATED" || g.state === "RETREATING"),
        destroyedGears: allGears.filter((g) => g.state === "DESTROYED"),
        alliedCommander: snapshot.alliedCommander,
        enemyCommander: snapshot.enemyCommander,
        roundLogs: [...roundLogs, stepResult.roundLog],
        downedPilotCandidates: allGears
          .filter((g) => g.state === "DESTROYED")
          .map((g) => ({
            gearId: g.gearId,
            gearName: g.name,
            pilotId: g.pilotId,
            pilotName: g.pilotName,
            side: g.side,
            isPlayer: g.isPlayer ?? false,
            destructionRound: nextRound,
          })),
      }

      setCombatResult(finalResult)

      // Thực hiện commit an toàn vào WORLD State
      try {
        const worldRes = loadWorldState()
        const resolution = commitCombatV2Result(worldRes.state, finalResult)
        saveWorldState(worldRes.state)
        setCommitResult(resolution)
        onCombatComplete?.(finalResult, resolution)
      } catch (err) {
        console.error("Lỗi commit Combat V2 Result:", err)
      }
    }

    setSnapshot({ ...snapshot })
    setIsProcessing(false)
  }

  // Tự động mô phỏng đến hết trận (Auto-Resolve / Fast-Forward)
  const handleAutoResolveToEnd = () => {
    if (isConcluded || isProcessing) return
    setIsProcessing(true)

    let round = currentRound
    let finalLogs = [...roundLogs]
    let finalOutcome: any = outcome
    let finalAlliedAgg = viewModel.alliedForce
    let finalEnemyAgg = viewModel.enemyForce

    while (round < snapshot.maxRounds) {
      round++
      const step = advanceCombatV2Round(snapshot, round, prng, DEFAULT_COMBAT_V2_CONFIG)
      finalLogs.push(step.roundLog)
      finalAlliedAgg = step.alliedAggregate
      finalEnemyAgg = step.enemyAggregate

      if (step.isConcluded && step.outcome) {
        finalOutcome = step.outcome
        break
      }
    }

    setCurrentRound(round)
    setRoundLogs(finalLogs)
    setIsConcluded(true)
    setOutcome(finalOutcome || "stalemate")

    const allGears = [...snapshot.alliedGears, ...snapshot.enemyGears]
    const finalResult: CombatV2Result = {
      encounterId: snapshot.encounterId,
      transactionId: snapshot.transactionId,
      sectorId: snapshot.sectorId,
      combatVersion: "v2",
      completedAtTimestamp: Date.now(),
      completedRounds: round,
      outcome: finalOutcome || "stalemate",
      victory: finalOutcome === "allied_victory",
      alliedAggregate: finalAlliedAgg,
      enemyAggregate: finalEnemyAgg,
      survivingActiveGears: allGears.filter((g) => g.state === "ACTIVE"),
      retreatedGears: allGears.filter((g) => g.state === "RETREATED" || g.state === "RETREATING"),
      destroyedGears: allGears.filter((g) => g.state === "DESTROYED"),
      alliedCommander: snapshot.alliedCommander,
      enemyCommander: snapshot.enemyCommander,
      roundLogs: finalLogs,
      downedPilotCandidates: allGears
        .filter((g) => g.state === "DESTROYED")
        .map((g) => ({
          gearId: g.gearId,
          gearName: g.name,
          pilotId: g.pilotId,
          pilotName: g.pilotName,
          side: g.side,
          isPlayer: g.isPlayer ?? false,
          destructionRound: round,
        })),
    }

    setCombatResult(finalResult)

    try {
      const worldRes = loadWorldState()
      const resolution = commitCombatV2Result(worldRes.state, finalResult)
      saveWorldState(worldRes.state)
      setCommitResult(resolution)
      onCombatComplete?.(finalResult, resolution)
    } catch (err) {
      console.error("Lỗi commit Auto-Resolve Combat V2 Result:", err)
    }

    setSnapshot({ ...snapshot })
    setIsProcessing(false)
  }

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-mono p-4 select-none space-y-4">
      {/* Top Tactical Command Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-slate-800 bg-slate-900/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <ShieldAlert className="size-5 text-cyan-400" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-white">
                COMBAT V2 // TRUNG TÂM ĐIỀU HÀNH TÁC CHIẾN
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                Hiệp {currentRound} / {snapshot.maxRounds}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Phân khu: <strong className="text-slate-200">{snapshot.sectorId.toUpperCase()}</strong> · Mã giao dịch: {snapshot.transactionId}
            </div>
          </div>
        </div>

        {/* Round Progression Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {!isConcluded ? (
            <>
              <Button
                size="sm"
                variant="default"
                disabled={isProcessing}
                onClick={handleAdvanceRound}
                className="cursor-pointer gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs"
              >
                <Play className="size-3.5 fill-black" />
                <span>TIẾN HIỆP TIẾP THEO</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={isProcessing}
                onClick={handleAutoResolveToEnd}
                className="cursor-pointer gap-1.5 text-xs text-slate-300 hover:text-white"
              >
                <FastForward className="size-3.5" />
                <span>MÔ PHỎNG HẾT TRẬN</span>
              </Button>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mr-2">
                <CheckCircle2 className="size-4" /> TRẬN ĐẤU ĐÃ KẾT THÚC
              </div>
              {onExit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onExit}
                  className="cursor-pointer text-xs"
                >
                  TRỞ VỀ BẢN ĐỒ CHIẾN LƯỢC
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Aggregate Status Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="rounded border border-cyan-900/40 bg-slate-900/50 p-2.5">
          <div className="text-slate-400 text-xs uppercase font-semibold">TỔNG HP ĐỒNG MINH (VSS)</div>
          <div className="text-base font-bold text-cyan-300">
            {viewModel.alliedForce.totalCurrentHp} / {viewModel.alliedForce.totalMaxHp}
          </div>
          <div className="text-xs text-slate-400">
            Tỷ lệ: {viewModel.alliedForce.hpPercent}% · Đơn vị hoạt động: {viewModel.alliedForce.activeCount}
          </div>
        </div>

        <div className="rounded border border-rose-900/40 bg-slate-900/50 p-2.5">
          <div className="text-slate-400 text-xs uppercase font-semibold">TỔNG HP QUÂN ĐỊCH (THE VOID)</div>
          <div className="text-base font-bold text-rose-400">
            {viewModel.enemyForce.totalCurrentHp} / {viewModel.enemyForce.totalMaxHp}
          </div>
          <div className="text-xs text-slate-400">
            Tỷ lệ: {viewModel.enemyForce.hpPercent}% · Đơn vị hoạt động: {viewModel.enemyForce.activeCount}
          </div>
        </div>

        <div className="rounded border border-slate-800 bg-slate-900/50 p-2.5">
          <div className="text-slate-400 text-xs uppercase font-semibold">CHIẾN THUẬT VSS HIỆN TẠI</div>
          <div className="text-base font-bold text-slate-200 truncate">
            {COMBAT_V2_STRATEGIES[viewModel.commanderStrategy.currentStrategyId]?.name || "Cân Bằng"}
          </div>
          <div className="text-xs text-slate-400">
            Xếp hàng: {viewModel.commanderStrategy.queuedStrategyId || "Không có"}
          </div>
        </div>

        <div className="rounded border border-slate-800 bg-slate-900/50 p-2.5">
          <div className="text-slate-400 text-xs uppercase font-semibold">TRẠNG THÁI TỔN THẤT</div>
          <div className="text-base font-bold text-slate-200">
            {viewModel.alliedForce.destroyedCount} VSS / {viewModel.enemyForce.destroyedCount} Void
          </div>
          <div className="text-xs text-slate-400">
            Đang rút lui: {viewModel.alliedForce.retreatingCount} · Đã thoát ly: {viewModel.alliedForce.retreatedCount}
          </div>
        </div>
      </div>

      {/* 2D Battlefield Visualization */}
      <BattleMap2D
        alliedGears={snapshot.alliedGears}
        enemyGears={snapshot.enemyGears}
        selectedGearId={selectedGearId}
        onSelectGear={(id) => {
          setSelectedGearId(id)
          setActiveTab("gear")
        }}
        supportEntities={snapshot.alliedSupport}
        round={currentRound}
      />

      {/* Interactive Tabs */}
      <div className="space-y-3">
        <div className="flex items-center gap-1 border-b border-slate-800 pb-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("gear")}
            className={`px-3 py-1.5 font-bold rounded-t border-t border-x transition-colors cursor-pointer ${
              activeTab === "gear"
                ? "border-cyan-500 bg-slate-900 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            ĐIỀU KHIỂN CƠ GIÁP & RÚT LUI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("commander")}
            className={`px-3 py-1.5 font-bold rounded-t border-t border-x transition-colors cursor-pointer ${
              activeTab === "commander"
                ? "border-cyan-500 bg-slate-900 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            CHIẾN THUẬT CHỈ HUY
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("support")}
            className={`px-3 py-1.5 font-bold rounded-t border-t border-x transition-colors cursor-pointer ${
              activeTab === "support"
                ? "border-cyan-500 bg-slate-900 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            HỖ TRỢ QUỸ ĐẠO & HẬU CẦN
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={`px-3 py-1.5 font-bold rounded-t border-t border-x transition-colors cursor-pointer ${
              activeTab === "logs"
                ? "border-cyan-500 bg-slate-900 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            NHẬT KÝ CHI TIẾT ({roundLogs.length})
          </button>
        </div>

        {/* Tab Panels */}
        {activeTab === "gear" && (
          <PlayerGearCombatPanel
            playerGear={playerGear}
            selectedGear={selectedGear}
            onOrderRetreat={handleOrderRetreat}
            disabled={isConcluded}
          />
        )}

        {activeTab === "commander" && (
          <CommanderStrategyPanel
            commanderAuthority={snapshot.alliedCommander}
            availableStrategies={viewModel.commanderStrategy.availableStrategies}
            onQueueStrategy={handleQueueStrategy}
            disabled={isConcluded}
          />
        )}

        {activeTab === "support" && (
          <SupportPanel
            supportEntities={snapshot.alliedSupport || []}
            queuedSkillId={queuedSupportSkillId}
            onToggleControlMode={handleToggleSupportControlMode}
            onQueueSupportSkill={setQueuedSupportSkillId}
            disabled={isConcluded}
          />
        )}

        {activeTab === "logs" && (
          <CombatLogViewer roundLogs={roundLogs} currentRound={currentRound} />
        )}
      </div>

      {/* Concluded Result Overlay Modal */}
      {isConcluded && combatResult && (
        <div className="rounded-lg border border-cyan-500/80 bg-slate-900 p-5 shadow-2xl font-mono text-xs animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              {combatResult.victory ? (
                <Trophy className="size-6 text-amber-400" />
              ) : (
                <XCircle className="size-6 text-rose-500" />
              )}
              <div>
                <span className="text-base font-bold text-white uppercase block">
                  {combatResult.victory ? "CHIẾN THẮNG CHIẾN THUẬT TOÀN DIỆN" : "KẾT THÚC GIAO TRANH CHIẾN LƯỢC"}
                </span>
                <span className="text-slate-400 text-xs">
                  Kết quả: <strong className="text-cyan-300">{combatResult.outcome.toUpperCase()}</strong> sau {combatResult.completedRounds} hiệp.
                </span>
              </div>
            </div>

            {commitResult && (
              <div className="text-right">
                <span className="text-emerald-400 font-bold block">ĐÃ GHI NHẬN WORLD STATE</span>
                <span className="text-xs text-slate-400">Tx: {combatResult.transactionId}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="rounded bg-slate-950 p-3 border border-slate-800">
              <span className="text-slate-400 text-xs block mb-1">TỔN THẤT ĐỒNG MINH VSS</span>
              <div className="text-sm font-bold text-slate-200">
                {combatResult.alliedAggregate.destroyedCount} cỗ máy bị tiêu diệt
              </div>
              <div className="text-xs text-slate-400">
                {combatResult.alliedAggregate.retreatedCount} đơn vị đã thoát ly thành công
              </div>
            </div>

            <div className="rounded bg-slate-950 p-3 border border-slate-800">
              <span className="text-slate-400 text-xs block mb-1">THIỆT HẠI QUÂN ĐỊCH THE VOID</span>
              <div className="text-sm font-bold text-rose-400">
                {combatResult.enemyAggregate.destroyedCount} cỗ máy bị triệt hạ
              </div>
              <div className="text-xs text-slate-400">
                {combatResult.enemyAggregate.retreatedCount} đơn vị tháo lui
              </div>
            </div>

            <div className="rounded bg-slate-950 p-3 border border-slate-800">
              <span className="text-slate-400 text-xs block mb-1">ỨNG VIÊN PHI CÔNG CẦN CỨU HỘ</span>
              <div className="text-sm font-bold text-amber-300">
                {combatResult.downedPilotCandidates.length} phi công
              </div>
              <div className="text-xs text-slate-500">
                Chuyển giao cho Phase 6.34 (Pilot Survival & Rescue)
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
            {onExit && (
              <Button
                size="sm"
                variant="default"
                onClick={onExit}
                className="bg-cyan-500 text-black hover:bg-cyan-400 font-bold text-xs"
              >
                Xác Nhận & Hoàn Tất Chiến Dịch
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
