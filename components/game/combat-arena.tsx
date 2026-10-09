"use client"

import { Button } from "@/components/ui/button"
import { ENCOUNTER_INFO } from "@/lib/game/data"
import {
  createInitialCombatState,
  executeEnemyAIAction,
  executePlayerAction,
} from "@/lib/game/engine"
import type { CombatSkill, CombatState, EnemyEncounterType } from "@/lib/game/types"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
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
  Zap,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

export function CombatArena() {
  const [selectedEncounter, setSelectedEncounter] = useState<EnemyEncounterType>("scout-drone")
  const [combatState, setCombatState] = useState<CombatState>(() =>
    createInitialCombatState("scout-drone"),
  )
  const [isProcessingAI, setIsProcessingAI] = useState(false)
  const [floatingNotification, setFloatingNotification] = useState<{
    text: string
    isCrit?: boolean
    isPlayer?: boolean
  } | null>(null)
  const logContainerRef = useRef<HTMLDivElement>(null)

  // Đổi mục tiêu hoặc khởi động lại
  const handleStartEncounter = (encounterId: EnemyEncounterType) => {
    setSelectedEncounter(encounterId)
    setIsProcessingAI(false)
    setCombatState(createInitialCombatState(encounterId))
  }

  // Tự động cuộn xuống cuối nhật ký
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [combatState.logs])

  // Xử lý lượt đi của AI Kẻ địch với delay tự nhiên (1.0s) để người chơi theo dõi trận đánh
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

  // Người chơi bấm kỹ năng
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

  const { player, enemy, status, logs, turnNumber } = combatState
  const playerHpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))
  const playerSpPct = Math.max(0, Math.min(100, (player.sp / player.maxSp) * 100))
  const enemyHpPct = Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100))
  const enemySpPct = Math.max(0, Math.min(100, (enemy.sp / enemy.maxSp) * 100))

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Header chọn mục tiêu kẻ địch */}
      <div className="rounded-sm border border-cyan-500/30 bg-black/40 p-3 shadow-lg backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target className="size-5 text-cyan-400 animate-pulse" />
            <div>
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-cyan-300">
                ĐẤU TRƯỜNG TÁC CHIẾN STARFRONT // GIAI ĐOẠN 1
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Cơ giáp Tiên Phong (Vanguard) tác chiến theo lượt · Khắc chế kẻ địch bằng chiến thuật tốc độ & kỹ năng
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">
              Chọn mục tiêu:
            </span>
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

      {/* 2. Thanh Thứ tự lượt hành động (Speed Initiative Timeline) */}
      <div className="flex items-center justify-between rounded-sm border border-border/70 bg-panel/60 px-4 py-2 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Gauge className="size-4 text-cyan-400" />
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Thứ tự hành động (Tốc độ):
          </span>
          <div className="flex items-center gap-2">
            {/* Đơn vị ra đòn trước */}
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

      {/* 3. Lưới chiến trường chính (Hai cánh: Vanguard vs Kẻ Địch) */}
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

        {/* Cột 1: Cơ giáp Vanguard (Người chơi) */}
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
              <p className="font-mono text-xs text-cyan-400/80">{player.title}</p>
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

          {/* Chỉ số tác chiến */}
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

          {/* Mô phỏng buồng lái trực quan */}
          <div className="mt-4 flex h-36 items-center justify-center rounded border border-cyan-500/20 bg-black/50 p-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0%,transparent_70%)]" />
            <div className="relative text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-cyan-400/60 bg-cyan-950/60 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                <Sword className="size-7 text-cyan-300" />
              </div>
              <p className="mt-2 font-display text-xs font-bold text-cyan-200 uppercase tracking-widest">
                BUỒNG LÁI VANGUARD TRỰC CHIẾN
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">
                {status === "player-turn" ? "Sẵn sàng nhận lệnh kích hoạt kỹ năng" : "Đang chờ kẻ địch..."}
              </p>
            </div>
          </div>
        </div>

        {/* Cột 2: Kẻ Địch (Scout Drone / Raider Mech / Siege Walker) */}
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

            {/* Trạng thái debuff / buff của địch */}
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

          {/* Mô phỏng radar mục tiêu */}
          <div className="mt-4 flex h-36 items-center justify-center rounded border border-red-500/20 bg-black/50 p-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.15)_0%,transparent_70%)]" />
            <div className="relative text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-red-500/60 bg-red-950/60 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                <Target className="size-7 text-red-300 animate-spin" style={{ animationDuration: "12s" }} />
              </div>
              <p className="mt-2 font-display text-xs font-bold text-red-200 uppercase tracking-widest">
                MỤC TIÊU ĐANG KHÓA: {enemy.name}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">
                {enemy.hp <= 0 ? "Đã bị vô hiệu hóa hoàn toàn" : "Trạng thái tác chiến tích cực"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Khung điều khiển Kỹ năng & Hành động (Action Deck) */}
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

        {/* 4 Nút Kỹ năng theo yêu cầu đề bài */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {player.skills.map((skill) => {
            const cooldown = player.skillCooldowns[skill.id] || 0
            const hasCooldown = cooldown > 0
            const notEnoughSp = player.sp < skill.spCost
            const disabled = status !== "player-turn" || hasCooldown || notEnoughSp || isProcessingAI

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
                    {disabled ? (hasCooldown ? "Đang hồi" : notEnoughSp ? "Thiếu SP" : "Chờ lượt") : "Kích hoạt ➔"}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 5. Nhật Ký Giao Tranh (Combat Log) */}
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
          className="h-44 overflow-y-auto rounded bg-black/40 p-3 font-mono text-xs leading-relaxed space-y-1.5"
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
                <span suppressHydrationWarning className="shrink-0 text-muted-foreground/50">[{item.timestamp}]</span>
                <span className="shrink-0 rounded bg-secondary/40 px-1 text-[10px] text-muted-foreground">
                  Lượt {item.turn}
                </span>
                <span>{item.text}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 6. Hộp thoại Chiến thắng / Thất bại (Victory / Defeat Overlay Banner) */}
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

          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            {status === "victory"
              ? `Vanguard đã tiêu diệt thành công ${enemy.name} sau ${turnNumber} vòng chiến đấu ác liệt.`
              : `Vỏ giáp Vanguard bị đục thủng bởi hỏa lực của ${enemy.name}. Hãy điều chỉnh chiến thuật và tái đấu.`}
          </p>

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
          </div>
        </div>
      )}
    </div>
  )
}
