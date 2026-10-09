"use client"

import { Button } from "@/components/ui/button"
import { ENCOUNTER_INFO } from "@/lib/game/data"
import {
  createInitialCombatState,
  executeEnemyAIAction,
  executePlayerAction,
} from "@/lib/game/engine"
import {
  applyDefeatRecord,
  applyVictoryReward,
  buildVanguardCombatUnit,
  getExpRequiredForLevel,
  INITIAL_STARFRONT_PROGRESSION,
} from "@/lib/game/progression"
import {
  loadStarfrontProgression,
  resetStarfrontProgression,
  saveStarfrontProgression,
} from "@/lib/game/storage"
import type {
  BattleRewardResult,
  CombatState,
  EnemyEncounterType,
  StarfrontItem,
  StarfrontItemSlot,
  StarfrontProgression,
} from "@/lib/game/types"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Coins,
  Flame,
  Gauge,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sparkles,
  Sword,
  Target,
  Trophy,
  Wrench,
  Zap,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { StarfrontHangar } from "./starfront-hangar"

export function CombatArena() {
  // 1. Quản lý tiến trình STARFRONT (Level, EXP, Credits, Trang bị)
  const [progression, setProgression] = useState<StarfrontProgression>(INITIAL_STARFRONT_PROGRESSION)
  const [hasLoadedProgression, setHasLoadedProgression] = useState(false)
  const [activeSubView, setActiveSubView] = useState<"combat" | "hangar">("combat")

  // 2. Trạng thái chiến đấu
  const [selectedEncounter, setSelectedEncounter] = useState<EnemyEncounterType>("scout-drone")
  const [combatState, setCombatState] = useState<CombatState>(() =>
    createInitialCombatState("scout-drone", buildVanguardCombatUnit(INITIAL_STARFRONT_PROGRESSION)),
  )
  const [isProcessingAI, setIsProcessingAI] = useState(false)
  const [floatingNotification, setFloatingNotification] = useState<{
    text: string
    isCrit?: boolean
    isPlayer?: boolean
  } | null>(null)

  // 3. Quản lý nhận thưởng chính xác 1 lần duy nhất (Chống cộng lặp lại)
  const rewardClaimedRef = useRef(false)
  const defeatRecordedRef = useRef(false)
  const [lastVictoryReward, setLastVictoryReward] = useState<{
    reward: BattleRewardResult
    dropItem?: StarfrontItem
  } | null>(null)

  const logContainerRef = useRef<HTMLDivElement>(null)

  // Khôi phục dữ liệu đã lưu từ LocalStorage khi khởi chạy
  useEffect(() => {
    const saved = loadStarfrontProgression()
    setProgression(saved)
    setHasLoadedProgression(true)
    // Cập nhật trận đấu ban đầu với chỉ số thực tế
    const customVanguard = buildVanguardCombatUnit(saved)
    setCombatState(createInitialCombatState("scout-drone", customVanguard))
  }, [])

  // Tự động lưu tiến trình mỗi khi có thay đổi quan trọng (EXP, Level, Credits, Trang bị)
  useEffect(() => {
    if (hasLoadedProgression) {
      saveStarfrontProgression(progression)
    }
  }, [progression, hasLoadedProgression])

  // Đổi mục tiêu hoặc khởi động lại trận đấu
  const handleStartEncounter = (
    encounterId: EnemyEncounterType,
    currentProg: StarfrontProgression = progression,
  ) => {
    setSelectedEncounter(encounterId)
    setIsProcessingAI(false)
    rewardClaimedRef.current = false
    defeatRecordedRef.current = false
    setLastVictoryReward(null)

    const vanguardUnit = buildVanguardCombatUnit(currentProg)
    setCombatState(createInitialCombatState(encounterId, vanguardUnit))
  }

  // Tự động cuộn xuống cuối nhật ký
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [combatState.logs])

  // Xử lý lượt đi của AI Kẻ địch với delay tự nhiên (1.0s)
  useEffect(() => {
    if (combatState.status === "enemy-turn" && !isProcessingAI && combatState.enemy.hp > 0) {
      setIsProcessingAI(true)
      const timer = setTimeout(() => {
        setCombatState((prev) => {
          if (prev.status !== "enemy-turn") return prev
          const next = executeEnemyAIAction(prev)
          if (next.lastAction) {
            setFloatingNotification({
              text: next.lastAction.damage
                ? `-${next.lastAction.damage} HP`
                : next.lastAction.effectApplied || "Kích hoạt",
              isCrit: next.lastAction.isCrit,
              isPlayer: false,
            })
            setTimeout(() => setFloatingNotification(null), 1800)
          }
          return next
        })
        setIsProcessingAI(false)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [combatState.status, combatState.enemy.hp, isProcessingAI])

  // Xử lý trao thưởng duy nhất 1 lần khi CHIẾN THẮNG (Không bị lặp lại khi render)
  useEffect(() => {
    if (combatState.status === "victory" && !rewardClaimedRef.current) {
      rewardClaimedRef.current = true

      setProgression((prev) => {
        const { updated, reward, dropItem } = applyVictoryReward(prev, selectedEncounter)
        setLastVictoryReward({ reward, dropItem })
        return updated
      })
    }
  }, [combatState.status, selectedEncounter])

  // Xử lý ghi nhận trận thua duy nhất 1 lần khi THẤT BẠI
  useEffect(() => {
    if (combatState.status === "defeat" && !defeatRecordedRef.current) {
      defeatRecordedRef.current = true
      setProgression((prev) => applyDefeatRecord(prev))
    }
  }, [combatState.status])

  // Người chơi bấm kích hoạt kỹ năng
  const handleUseSkill = (skillId: string) => {
    if (combatState.status !== "player-turn" || isProcessingAI) return

    const next = executePlayerAction(combatState, skillId)
    if (next.lastAction) {
      setFloatingNotification({
        text: next.lastAction.damage
          ? `-${next.lastAction.damage} HP`
          : next.lastAction.effectApplied || "Kích hoạt",
        isCrit: next.lastAction.isCrit,
        isPlayer: true,
      })
      setTimeout(() => setFloatingNotification(null), 1800)
    }
    setCombatState(next)
  }

  // Thao tác Trang bị vật phẩm trong Hangar
  const handleEquipItem = (itemId: string, slot: StarfrontItemSlot) => {
    setProgression((prev) => {
      const updated: StarfrontProgression = {
        ...prev,
        equipped: {
          ...prev.equipped,
          [slot]: itemId,
        },
      }
      return updated
    })
  }

  // Thao tác Tháo trang bị trong Hangar
  const handleUnequipSlot = (slot: StarfrontItemSlot) => {
    setProgression((prev) => {
      const updated: StarfrontProgression = {
        ...prev,
        equipped: {
          ...prev.equipped,
          [slot]: null,
        },
      }
      return updated
    })
  }

  // Reset toàn bộ tiến trình
  const handleResetSave = () => {
    const fresh = resetStarfrontProgression()
    setProgression(fresh)
    handleStartEncounter("scout-drone", fresh)
  }

  const { player, enemy, status, logs, turnNumber } = combatState
  const playerHpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))
  const playerSpPct = Math.max(0, Math.min(100, (player.sp / player.maxSp) * 100))
  const enemyHpPct = Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100))
  const enemySpPct = Math.max(0, Math.min(100, (enemy.sp / enemy.maxSp) * 100))

  const expRequired = getExpRequiredForLevel(progression.level)
  const expPct = Math.min(100, Math.round((progression.exp / expRequired) * 100))

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Header Thanh Tiến Trình Cấp Độ & Chuyển Đổi Tab Con */}
      <div className="rounded-sm border border-cyan-500/40 bg-black/60 p-3 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Thông tin cấp độ & EXP & Credits */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xs bg-cyan-500/20 font-mono text-sm font-black text-cyan-300 border border-cyan-500/60 shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                V
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-bold text-white tracking-wider">
                    VANGUARD GEAR
                  </span>
                  <span className="rounded bg-cyan-500/20 px-1.5 py-0.2 font-mono text-xs font-bold text-cyan-300 border border-cyan-500/40">
                    CẤP {progression.level}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                  <span>EXP: {progression.exp} / {expRequired} ({expPct}%)</span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-amber-300">
                    <Coins className="size-3 text-amber-400" />
                    <strong>{progression.credits.toLocaleString("vi-VN")}</strong> Credits
                  </span>
                </div>
              </div>
            </div>

            {/* Thanh EXP mini */}
            <div className="hidden sm:block w-36">
              <div className="h-1.5 w-full overflow-hidden rounded-xs bg-secondary">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${expPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Nút chuyển đổi giữa Đấu trường và Xưởng trang bị */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveSubView("combat")}
              className={cn(
                "flex items-center gap-1.5 rounded-xs border px-3 py-1.5 font-display text-xs transition-all",
                activeSubView === "combat"
                  ? "border-cyan-400 bg-cyan-950/80 text-cyan-200 font-bold shadow-[0_0_10px_rgba(34,211,238,0.25)]"
                  : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
            >
              <Sword className="size-3.5" />
              <span>Đấu Trường Tác Chiến</span>
            </button>

            <button
              onClick={() => setActiveSubView("hangar")}
              className={cn(
                "flex items-center gap-1.5 rounded-xs border px-3 py-1.5 font-display text-xs transition-all",
                activeSubView === "hangar"
                  ? "border-cyan-400 bg-cyan-950/80 text-cyan-200 font-bold shadow-[0_0_10px_rgba(34,211,238,0.25)]"
                  : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
            >
              <Boxes className="size-3.5" />
              <span>Kho Đồ & Trang Bị ({progression.inventory.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* HIỂN THỊ PHÂN HỆ THEO TAB: HANGAR HOẶC COMBAT ARENA */}
      {activeSubView === "hangar" ? (
        <StarfrontHangar
          progression={progression}
          onEquipItem={handleEquipItem}
          onUnequipSlot={handleUnequipSlot}
          onResetSave={handleResetSave}
          onNavigateToCombat={() => {
            setActiveSubView("combat")
            // Cập nhật lại Vanguard trong đấu trường với các món đồ vừa lắp
            handleStartEncounter(selectedEncounter, progression)
          }}
        />
      ) : (
        <>
          {/* 2. Thanh Chọn Mục Tiêu Đối Đầu */}
          <div className="rounded-sm border border-cyan-500/30 bg-black/40 p-3 shadow-lg backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Target className="size-4 text-cyan-400 animate-pulse" />
                <span className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                  MỤC TIÊU TÁC CHIẾN // CHỌN ĐỐI THỦ:
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {ENCOUNTER_INFO.map((enc) => {
                  const active = selectedEncounter === enc.id
                  return (
                    <button
                      key={enc.id}
                      onClick={() => handleStartEncounter(enc.id)}
                      className={cn(
                        "relative flex items-center gap-1.5 rounded-xs border px-3 py-1.5 font-display text-xs transition-all",
                        active
                          ? "border-cyan-400 bg-cyan-950/60 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.3)] font-bold"
                          : "border-border/60 bg-panel/40 text-muted-foreground hover:border-cyan-500/40 hover:text-foreground",
                      )}
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: enc.color }}
                      />
                      <span>{enc.name}</span>
                      <span className="text-[10px] opacity-75">({enc.difficulty})</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 3. Thanh Thứ Tự Lượt Hành Động (Speed Initiative Timeline) */}
          <div className="flex items-center justify-between rounded-sm border border-border/70 bg-panel/60 px-4 py-2 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Gauge className="size-4 text-cyan-400" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Thứ tự hành động (Tốc độ):
              </span>
              <div className="flex items-center gap-2">
                {player.speed >= enemy.speed ? (
                  <>
                    <span className="inline-flex items-center gap-1 rounded bg-cyan-500/20 px-2 py-0.5 font-display text-[11px] font-bold text-cyan-300 border border-cyan-500/40">
                      1. {player.name} ({player.speed} SPD)
                    </span>
                    <span className="text-muted-foreground">➔</span>
                    <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 font-display text-[11px] text-red-300 border border-red-500/30">
                      2. {enemy.name} ({enemy.speed} SPD)
                    </span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1 rounded bg-red-500/20 px-2 py-0.5 font-display text-[11px] font-bold text-red-300 border border-red-500/40">
                      1. {enemy.name} ({enemy.speed} SPD - Nhanh hơn!)
                    </span>
                    <span className="text-muted-foreground">➔</span>
                    <span className="inline-flex items-center gap-1 rounded bg-cyan-500/10 px-2 py-0.5 font-display text-[11px] text-cyan-300 border border-cyan-500/30">
                      2. {player.name} ({player.speed} SPD)
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded bg-black/40 px-2 py-0.5 text-muted-foreground">
                Vòng đấu: <strong className="text-foreground">#{turnNumber}</strong>
              </span>
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                  status === "player-turn"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 animate-pulse"
                    : status === "enemy-turn"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-400/50"
                      : status === "victory"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400"
                        : "bg-red-500/20 text-red-300 border border-red-400",
                )}
              >
                {status === "player-turn" && "LƯỢT CỦA BẠN (VANGUARD)"}
                {status === "enemy-turn" && "KẺ ĐỊCH ĐANG HÀNH ĐỘNG..."}
                {status === "victory" && "CHIẾN THẮNG VANG DỘI"}
                {status === "defeat" && "THẤT BẠI - BỊ PHÁ HỦY"}
              </div>
            </div>
          </div>

          {/* 4. Lưới Chiến Trường Chính (Vanguard vs Kẻ Địch) */}
          <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Floating Combat Feedback */}
            {floatingNotification && (
              <div
                className={cn(
                  "pointer-events-none absolute left-1/2 top-1/3 z-30 -translate-x-1/2 -translate-y-1/2 rounded border px-4 py-2 font-display text-lg font-black tracking-widest shadow-2xl transition-all animate-bounce",
                  floatingNotification.isPlayer
                    ? "border-cyan-400 bg-cyan-950/90 text-cyan-200"
                    : "border-red-500 bg-red-950/90 text-red-200",
                  floatingNotification.isCrit && "border-amber-400 bg-amber-950/90 text-amber-200 text-xl",
                )}
              >
                {floatingNotification.isCrit && "🔥 BẠO KÍCH! "}
                {floatingNotification.text}
              </div>
            )}

            {/* Cột 1: Vanguard (Người chơi) */}
            <div className="relative overflow-hidden rounded-sm border border-cyan-500/40 bg-gradient-to-b from-cyan-950/20 via-panel/80 to-panel p-4 shadow-xl">
              <div className="mb-3 flex items-start justify-between border-b border-border/60 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-xs bg-cyan-500/20 font-mono text-xs font-black text-cyan-400 border border-cyan-500/50">
                      V
                    </span>
                    <h3 className="font-display text-base font-bold text-cyan-200">
                      {player.name}
                    </h3>
                  </div>
                  <p className="font-mono text-xs text-cyan-400/80">
                    Chiến Cơ Tiên Phong · Cấp {progression.level}
                  </p>
                </div>

                {/* Trạng thái buff/debuff */}
                <div className="flex flex-wrap gap-1">
                  {player.statusEffects.map((eff) => (
                    <span
                      key={eff.id}
                      className="flex items-center gap-1 rounded bg-cyan-500/20 border border-cyan-400/50 px-2 py-0.5 text-[10px] font-bold text-cyan-200 animate-pulse"
                    >
                      <Shield className="size-3 text-cyan-300" />
                      {eff.name} ({eff.duration} lượt)
                    </span>
                  ))}
                  {player.statusEffects.length === 0 && (
                    <span className="text-[10px] text-muted-foreground/60">Không có hiệu ứng</span>
                  )}
                </div>
              </div>

              {/* Thanh HP & SP */}
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex justify-between font-mono text-xs">
                    <span className="flex items-center gap-1 font-bold text-emerald-400">
                      <Shield className="size-3.5" /> ĐỘ BỀN VỎ GIÁP (HP)
                    </span>
                    <span className="tabular-nums">
                      {player.hp} / {player.maxHp} ({Math.round(playerHpPct)}%)
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-xs bg-secondary/80">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                      style={{ width: `${playerHpPct}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex justify-between font-mono text-xs">
                    <span className="flex items-center gap-1 font-bold text-cyan-400">
                      <Zap className="size-3.5" /> LÕI NĂNG LƯỢNG (SP)
                    </span>
                    <span className="tabular-nums">
                      {player.sp} / {player.maxSp} ({Math.round(playerSpPct)}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-xs bg-secondary/80">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                      style={{ width: `${playerSpPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Chỉ số tác chiến thực tế */}
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/50 pt-3 text-center font-mono text-xs">
                <div className="rounded bg-black/30 p-1.5">
                  <span className="block text-[10px] uppercase text-muted-foreground">Tấn Công</span>
                  <span className="font-bold text-cyan-300">{player.attack}</span>
                </div>
                <div className="rounded bg-black/30 p-1.5">
                  <span className="block text-[10px] uppercase text-muted-foreground">Phòng Thủ</span>
                  <span className="font-bold text-cyan-300">{player.defense}</span>
                </div>
                <div className="rounded bg-black/30 p-1.5">
                  <span className="block text-[10px] uppercase text-muted-foreground">Tốc Độ</span>
                  <span className="font-bold text-cyan-300">{player.speed}</span>
                </div>
              </div>

              {/* Buồng lái trực quan */}
              <div className="mt-4 flex h-32 items-center justify-center rounded border border-cyan-500/20 bg-black/50 p-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0%,transparent_70%)]" />
                <div className="relative text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-cyan-400/60 bg-cyan-950/60 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                    <Sword className="size-6 text-cyan-300" />
                  </div>
                  <p className="mt-2 font-display text-xs font-bold text-cyan-200 uppercase tracking-widest">
                    BUỒNG LÁI VANGUARD TRỰC CHIẾN
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {status === "player-turn"
                      ? "Sẵn sàng nhận lệnh kích hoạt kỹ năng"
                      : "Đang chờ đối thủ phản kích..."}
                  </p>
                </div>
              </div>
            </div>

            {/* Cột 2: Kẻ Địch */}
            <div className="relative overflow-hidden rounded-sm border border-red-500/40 bg-gradient-to-b from-red-950/20 via-panel/80 to-panel p-4 shadow-xl">
              <div className="mb-3 flex items-start justify-between border-b border-border/60 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-xs bg-red-500/20 font-mono text-xs font-black text-red-400 border border-red-500/50">
                      E
                    </span>
                    <h3 className="font-display text-base font-bold text-red-200">
                      {enemy.name}
                    </h3>
                  </div>
                  <p className="font-mono text-xs text-red-400/80">{enemy.title}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {enemy.statusEffects.map((eff) => (
                    <span
                      key={eff.id}
                      className="flex items-center gap-1 rounded bg-amber-500/20 border border-amber-400/50 px-2 py-0.5 text-[10px] font-bold text-amber-200 animate-pulse"
                    >
                      <ShieldAlert className="size-3 text-amber-300" />
                      {eff.name} ({eff.duration} lượt)
                    </span>
                  ))}
                  {enemy.statusEffects.length === 0 && (
                    <span className="text-[10px] text-muted-foreground/60">Không có hiệu ứng</span>
                  )}
                </div>
              </div>

              {/* Thanh HP & SP Địch */}
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex justify-between font-mono text-xs">
                    <span className="flex items-center gap-1 font-bold text-red-400">
                      <ShieldAlert className="size-3.5" /> ĐỘ BỀN VỎ GIÁP (HP)
                    </span>
                    <span className="tabular-nums">
                      {enemy.hp} / {enemy.maxHp} ({Math.round(enemyHpPct)}%)
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-xs bg-secondary/80">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-300"
                      style={{ width: `${enemyHpPct}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex justify-between font-mono text-xs">
                    <span className="flex items-center gap-1 font-bold text-amber-400">
                      <Zap className="size-3.5" /> NĂNG LƯỢNG KẺ ĐỊCH (SP)
                    </span>
                    <span className="tabular-nums">
                      {enemy.sp} / {enemy.maxSp} ({Math.round(enemySpPct)}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-xs bg-secondary/80">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                      style={{ width: `${enemySpPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Chỉ số tác chiến Địch */}
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/50 pt-3 text-center font-mono text-xs">
                <div className="rounded bg-black/30 p-1.5">
                  <span className="block text-[10px] uppercase text-muted-foreground">Tấn Công</span>
                  <span className="font-bold text-red-300">{enemy.attack}</span>
                </div>
                <div className="rounded bg-black/30 p-1.5">
                  <span className="block text-[10px] uppercase text-muted-foreground">Phòng Thủ</span>
                  <span className="font-bold text-red-300">{enemy.defense}</span>
                </div>
                <div className="rounded bg-black/30 p-1.5">
                  <span className="block text-[10px] uppercase text-muted-foreground">Tốc Độ</span>
                  <span className="font-bold text-red-300">{enemy.speed}</span>
                </div>
              </div>

              {/* Radar mục tiêu */}
              <div className="mt-4 flex h-32 items-center justify-center rounded border border-red-500/20 bg-black/50 p-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.15)_0%,transparent_70%)]" />
                <div className="relative text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-red-500/60 bg-red-950/60 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                    <Target
                      className="size-6 text-red-300 animate-spin"
                      style={{ animationDuration: "12s" }}
                    />
                  </div>
                  <p className="mt-2 font-display text-xs font-bold text-red-200 uppercase tracking-widest">
                    MỤC TIÊU ĐANG KHÓA: {enemy.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {enemy.hp <= 0 ? "Đã bị vô hiệu hóa" : "Trạng thái tác chiến tích cực"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Khung Điều Khiển Kỹ Năng (Action Deck) */}
          <div className="rounded-sm border border-cyan-500/30 bg-panel/90 p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between border-b border-border/70 pb-2">
              <div className="flex items-center gap-2">
                <Flame className="size-4 text-cyan-400" />
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                  BẢNG ĐIỀU KHIỂN KỸ NĂNG VANGUARD
                </h4>
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                SP Hiện Có: <strong className="text-cyan-300">{player.sp}</strong> / {player.maxSp}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {player.skills.map((skill) => {
                const cooldown = player.skillCooldowns[skill.id] || 0
                const hasCooldown = cooldown > 0
                const notEnoughSp = player.sp < skill.spCost
                const disabled =
                  status !== "player-turn" || hasCooldown || notEnoughSp || isProcessingAI

                return (
                  <button
                    key={skill.id}
                    disabled={disabled}
                    onClick={() => handleUseSkill(skill.id)}
                    className={cn(
                      "group relative flex flex-col justify-between rounded-sm border p-3 text-left transition-all",
                      disabled
                        ? "cursor-not-allowed border-border/40 bg-secondary/30 opacity-60 text-muted-foreground"
                        : "cursor-pointer border-cyan-500/50 bg-panel/70 hover:border-cyan-300 hover:bg-cyan-950/40 hover:shadow-[0_0_15px_rgba(34,211,238,0.25)]",
                      skill.id === "pulse-strike" && !disabled && "border-blue-500/60",
                      skill.id === "armor-break" && !disabled && "border-amber-500/60",
                      skill.id === "emergency-guard" && !disabled && "border-emerald-500/60",
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-display text-xs font-bold text-foreground group-hover:text-cyan-300">
                          {skill.name}
                        </span>
                        {hasCooldown ? (
                          <span className="rounded bg-red-950/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-400 border border-red-500/40">
                            CD: {cooldown} lượt
                          </span>
                        ) : (
                          <span className="rounded bg-cyan-950/80 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">
                            {skill.spCost > 0 ? `${skill.spCost} SP` : "Hồi +15 SP"}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                        {skill.desc}
                      </p>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-border/40 pt-1.5 text-[10px] font-mono">
                      <span className="text-muted-foreground/80">{skill.nameEn}</span>
                      <span className="font-bold text-cyan-400 group-hover:underline">
                        {disabled
                          ? hasCooldown
                            ? "Đang hồi"
                            : notEnoughSp
                              ? "Thiếu SP"
                              : "Chờ lượt"
                          : "Kích hoạt ➔"}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 6. Nhật Ký Giao Tranh (Combat Log) */}
          <div className="rounded-sm border border-border/70 bg-panel/60 p-4">
            <div className="mb-2 flex items-center justify-between border-b border-border/50 pb-2 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-cyan-400" />
                <span className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  NHẬT KÝ CHIẾN TRƯỜNG // RADAR FEED
                </span>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">
                Tổng cộng: {logs.length} sự kiện
              </span>
            </div>

            <div
              ref={logContainerRef}
              className="h-40 overflow-y-auto rounded bg-black/40 p-3 font-mono text-xs leading-relaxed space-y-1.5"
            >
              {logs.map((item) => {
                let textColor = "text-muted-foreground"
                if (item.type === "player-action") textColor = "text-cyan-300"
                if (item.type === "enemy-action") textColor = "text-red-400"
                if (item.type === "crit") textColor = "text-amber-300 font-bold"
                if (item.type === "status") textColor = "text-emerald-300"
                if (item.type === "victory") textColor = "text-emerald-400 font-bold text-sm"
                if (item.type === "defeat") textColor = "text-red-500 font-bold text-sm"
                if (item.type === "system") textColor = "text-cyan-400/80"

                return (
                  <div key={item.id} className={cn("flex items-start gap-2", textColor)}>
                    <span suppressHydrationWarning className="shrink-0 text-muted-foreground/50">
                      [{item.timestamp}]
                    </span>
                    <span className="shrink-0 rounded bg-secondary/40 px-1 text-[10px] text-muted-foreground">
                      Lượt {item.turn}
                    </span>
                    <span>{item.text}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 7. Hộp Thoại Kết Thúc Trận Đấu & Trao Thưởng Tiến Trình (Phase 2 Rewards Modal) */}
          {(status === "victory" || status === "defeat") && (
            <div className="rounded-sm border border-border bg-panel p-5 text-center shadow-2xl animate-in fade-in zoom-in-95">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full mb-3">
                {status === "victory" ? (
                  <Trophy className="size-10 text-emerald-400 animate-bounce" />
                ) : (
                  <AlertTriangle className="size-10 text-red-500 animate-pulse" />
                )}
              </div>

              <h3
                className={cn(
                  "font-display text-xl font-black uppercase tracking-widest",
                  status === "victory" ? "text-emerald-400" : "text-red-500",
                )}
              >
                {status === "victory" ? "CHIẾN THẮNG VANG DỘI!" : "THẤT BẠI TÁC CHIẾN"}
              </h3>

              <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                {status === "victory"
                  ? `Vanguard đã tiêu diệt thành công ${enemy.name} sau ${turnNumber} vòng chiến đấu ác liệt.`
                  : `Vỏ giáp Vanguard bị đục thủng bởi hỏa lực của ${enemy.name}. Không nhận được phần thưởng chiến đấu.`}
              </p>

              {/* Bảng tổng kết phần thưởng chiến thắng Phase 2 */}
              {status === "victory" && lastVictoryReward && (
                <div className="my-4 mx-auto max-w-lg rounded-sm border border-emerald-500/40 bg-emerald-950/20 p-3.5 text-left font-mono">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-300 border-b border-emerald-500/30 pb-2">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    <span>PHẦN THƯỞNG CHIẾN TÍCH (ĐÃ LƯU TỰ ĐỘNG)</span>
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-cyan-300">
                      <Sparkles className="size-4 text-cyan-400" />
                      <span>EXP Nhận Được:</span>
                      <strong className="text-white">+{lastVictoryReward.reward.expGained}</strong>
                    </div>

                    <div className="flex items-center gap-1.5 text-amber-300">
                      <Coins className="size-4 text-amber-400" />
                      <span>Credits Nhận Được:</span>
                      <strong className="text-white">+{lastVictoryReward.reward.creditsGained}</strong>
                    </div>
                  </div>

                  {/* Thông báo thăng cấp nếu có */}
                  {lastVictoryReward.reward.leveledUp && (
                    <div className="mt-3 rounded bg-amber-500/20 border border-amber-400/60 p-2 text-xs text-amber-200 flex items-center gap-2 animate-pulse">
                      <Sparkles className="size-4 text-amber-300 shrink-0" />
                      <span>
                        <strong>🎉 CHÚC MỪNG THĂNG CẤP!</strong> Vanguard đã đạt <strong>Cấp {lastVictoryReward.reward.newLevel}</strong>. Toàn bộ chỉ số (HP, SP, ATK, DEF, SPD) được tăng vĩnh viễn!
                      </span>
                    </div>
                  )}

                  {/* Thông báo rơi vật phẩm nếu có */}
                  {lastVictoryReward.dropItem && (
                    <div className="mt-2.5 rounded bg-cyan-500/20 border border-cyan-400/60 p-2 text-xs text-cyan-200 flex items-center gap-2">
                      <Boxes className="size-4 text-cyan-300 shrink-0" />
                      <span>
                        <strong>🎁 CHIẾN LỢI PHẨM RƠI:</strong> {lastVictoryReward.dropItem.name} ({lastVictoryReward.dropItem.slot}) đã được chuyển vào Kho đồ!
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Nút hành động sau trận */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={() => handleStartEncounter(selectedEncounter)}
                  className="gap-2 font-display uppercase tracking-wider"
                >
                  <RotateCcw className="size-4" /> Tái đấu mục tiêu này
                </Button>

                {status === "victory" && selectedEncounter !== "siege-walker" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const nextTarget: EnemyEncounterType =
                        selectedEncounter === "scout-drone" ? "raider-mech" : "siege-walker"
                      handleStartEncounter(nextTarget)
                    }}
                    className="gap-2 border-cyan-400 text-cyan-300 hover:bg-cyan-950/50"
                  >
                    <Play className="size-4" /> Thách đấu mục tiêu tiếp theo ➔
                  </Button>
                )}

                <Button
                  variant="secondary"
                  onClick={() => setActiveSubView("hangar")}
                  className="gap-2 font-display uppercase tracking-wider border border-border"
                >
                  <Wrench className="size-4 text-cyan-400" /> Mở Kho Đồ & Trang Bị
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
