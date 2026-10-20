"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  Flame,
  Globe2,
  Shield,
  ShieldAlert,
  Sword,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react"
import type { CombatState } from "@/lib/game/types"
import type {
  CombatResolutionResult,
  WorldBattleContext,
} from "@/lib/game/world/types"

interface WorldCombatPostMissionResultsProps {
  isVictory: boolean
  combatState: CombatState
  worldBattleContext: WorldBattleContext
  resolutionResult?: CombatResolutionResult | null
  onReturnToWarRoom: () => void
}

export function WorldCombatPostMissionResults({
  isVictory,
  combatState,
  worldBattleContext,
  resolutionResult,
  onReturnToWarRoom,
}: WorldCombatPostMissionResultsProps) {
  const { player, enemy, turnNumber } = combatState
  const playerHpPct = Math.max(
    0,
    Math.min(100, Math.round((player.hp / Math.max(1, player.maxHp)) * 100)),
  )
  const enemyHpPct = Math.max(
    0,
    Math.min(100, Math.round((enemy.hp / Math.max(1, enemy.maxHp)) * 100)),
  )

  const consequences = resolutionResult?.strategicConsequences

  return (
    <div
      className={cn(
        "rounded-sm border p-5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 font-mono text-left",
        isVictory
          ? "border-emerald-500/60 bg-gradient-to-b from-emerald-950/40 via-black/90 to-panel"
          : "border-red-500/60 bg-gradient-to-b from-red-950/40 via-black/90 to-panel",
      )}
    >
      {/* 1. Header Báo Cáo */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded border",
              isVictory
                ? "border-emerald-400 bg-emerald-950/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                : "border-red-400 bg-red-950/60 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]",
            )}
          >
            {isVictory ? (
              <Trophy className="size-6 animate-pulse" />
            ) : (
              <AlertTriangle className="size-6 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "font-display text-base font-black uppercase tracking-wider",
                  isVictory ? "text-emerald-400" : "text-red-400",
                )}
              >
                {isVictory
                  ? "CHIẾN THẮNG THỰC ĐỊA // BẢO VỆ SECTOR THÀNH CÔNG"
                  : "THẤT BẠI TÁC CHIẾN // SECTOR BỊ CHÈN ÉP"}
              </span>
            </div>
            <div className="text-xs text-zinc-300">
              Chiến sự tại:{" "}
              <strong className="text-white">
                {worldBattleContext.sectorName} ({worldBattleContext.sectorId})
              </strong>{" "}
              · Mã GD:{" "}
              <span className="text-cyan-400 font-bold">
                {worldBattleContext.transactionId}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-300 font-semibold">ĐÁNH GIÁ:</span>
          <span
            className={cn(
              "rounded px-3 py-1 font-display text-sm sm:text-base font-black border",
              isVictory
                ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                : "border-red-400 bg-red-500/20 text-red-300",
            )}
          >
            {isVictory
              ? playerHpPct >= 90 && turnNumber <= 5
                ? "HẠNG S+"
                : playerHpPct >= 75
                  ? "HẠNG S"
                  : playerHpPct >= 50
                    ? "HẠNG A"
                    : "HẠNG B"
              : "HẠNG C"}
          </span>
        </div>
      </div>

      {/* 2. Chỉ Số Chiến Thuật Buồng Lái */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded border border-border/60 bg-black/50 p-3">
          <div className="text-xs text-zinc-400 uppercase font-semibold">
            Vòng Chiến Đấu
          </div>
          <div className="text-sm sm:text-base font-bold text-white mt-1 font-mono">
            {turnNumber} lượt
          </div>
        </div>
        <div className="rounded border border-border/60 bg-black/50 p-3">
          <div className="text-xs text-zinc-400 uppercase font-semibold">
            Vỏ Giáp Phi Thuyền
          </div>
          <div
            className={cn(
              "text-sm sm:text-base font-bold mt-1 font-mono",
              playerHpPct >= 50 ? "text-emerald-400" : "text-amber-400",
            )}
          >
            {playerHpPct}% ({player.hp}/{player.maxHp} HP)
          </div>
        </div>
        <div className="rounded border border-border/60 bg-black/50 p-3">
          <div className="text-xs text-zinc-400 uppercase font-semibold">
            Tổn Hại Kẻ Địch
          </div>
          <div className="text-sm sm:text-base font-bold text-red-400 mt-1 font-mono">
            {100 - enemyHpPct}% triệt tiêu
          </div>
        </div>
        <div className="rounded border border-border/60 bg-black/50 p-3">
          <div className="text-xs text-zinc-400 uppercase font-semibold">
            Đối Thủ Giao Tranh
          </div>
          <div className="text-xs sm:text-sm font-bold text-zinc-100 truncate mt-1" title={enemy.name}>
            {enemy.name}
          </div>
        </div>
      </div>

      {/* 3. Hậu Quả Chiến Lược Tác Động Lên STARFRONT WORLD */}
      <div className="mt-4 rounded border border-cyan-500/40 bg-zinc-950/85 p-4 sm:p-5 space-y-3 shadow-lg">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-cyan-300 uppercase tracking-wider">
          <Globe2 className="size-4.5 text-cyan-400" />
          <span>HẬU QUẢ CHIẾN LƯỢC TOÀN CỤC (STARFRONT WORLD STATE):</span>
        </div>

        {consequences ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1 text-xs sm:text-[13px]">
            {/* Đe dọa Threat */}
            <div className="rounded border border-border/50 bg-black/50 p-3 sm:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 font-bold">Mức Độ Đe Dọa (Threat):</span>
                <span
                  className={cn(
                    "font-bold text-sm sm:text-base font-mono",
                    consequences.threatChange <= 0
                      ? "text-emerald-400"
                      : "text-red-400",
                  )}
                >
                  {consequences.threatChange <= 0
                    ? `-${Math.abs(consequences.threatChange)} Điểm`
                    : `+${consequences.threatChange} Điểm`}
                </span>
              </div>
              <div className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed">
                {consequences.threatChange <= 0
                  ? `Threat khu vực giảm ${Math.abs(consequences.threatChange)} điểm nhờ chiến thắng trong giao tranh.`
                  : `Threat khu vực tăng ${consequences.threatChange} điểm do thất bại trong giao tranh.`}
              </div>
              {consequences.previousThreat !== undefined && consequences.newThreat !== undefined && (
                <div className="flex flex-wrap items-center justify-between text-xs font-mono text-zinc-300 pt-1 border-t border-zinc-800/80">
                  <span>
                    Threat: <strong className="text-zinc-100">{consequences.previousThreat.toLocaleString()}</strong> →{" "}
                    <strong className={consequences.threatChange <= 0 ? "text-emerald-300" : "text-red-300"}>
                      {consequences.newThreat.toLocaleString()}
                    </strong>
                  </span>
                  <span>
                    Mức nguy hiểm hiện tại: <strong className="text-cyan-300">{consequences.newThreat.toLocaleString()}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Ổn định Stability */}
            <div className="flex items-center justify-between rounded border border-border/50 bg-black/50 px-3 py-2">
              <span className="text-zinc-300 font-medium">Độ Ổn Định (Stability):</span>
              <span
                className={cn(
                  "font-bold text-sm font-mono",
                  consequences.stabilityChange >= 0
                    ? "text-emerald-400"
                    : "text-red-400",
                )}
              >
                {consequences.stabilityChange >= 0
                  ? `+${consequences.stabilityChange}%`
                  : `${consequences.stabilityChange}%`}
              </span>
            </div>

            {/* Trạng thái Sector mới */}
            <div className="flex items-center justify-between rounded border border-border/50 bg-black/50 px-3 py-2">
              <span className="text-zinc-300 font-medium">Trạng Thái Khu Vực:</span>
              <span className="font-bold text-cyan-300 uppercase font-mono text-sm">
                {consequences.newSectorStage || "CẬP NHẬT"}
              </span>
            </div>

            {/* Thương vong đồn trú */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-border/50 bg-black/50 px-3 py-2 sm:col-span-2">
              <span className="text-zinc-300 font-medium">Thương Vong Đồn Trú:</span>
              <span className="text-zinc-200">
                Tử sĩ:{" "}
                <strong className="text-red-400 font-mono">
                  {consequences.garrisonCasualties}
                </strong>{" "}
                quân · Thương binh:{" "}
                <strong className="text-amber-400 font-mono">
                  {consequences.garrisonWounded}
                </strong>{" "}
                quân
              </span>
            </div>

            {/* Thưởng tài nguyên (nếu có) */}
            {consequences.resourceRewards && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-emerald-500/50 bg-emerald-950/30 px-3.5 py-2 sm:col-span-2 lg:col-span-3">
                <span className="text-emerald-300 font-bold">
                  Thưởng Tài Nguyên Chiến Lược:
                </span>
                <span className="text-emerald-100 font-mono font-bold">
                  +{consequences.resourceRewards.tacticalData || 0} Dữ Liệu · +
                  {consequences.resourceRewards.industrialMaterials || 0} Vật Liệu · +
                  {consequences.resourceRewards.energy || 0} Năng Lượng
                </span>
              </div>
            )}

            {/* Chuyển giao chủ quyền nếu thất thủ */}
            {consequences.sovereigntyTransferred && (
              <div className="rounded border border-red-500/70 bg-red-950/40 p-3 text-red-200 sm:col-span-2 lg:col-span-3 flex items-center gap-2.5 text-xs sm:text-[13px]">
                <AlertTriangle className="size-5 text-red-400 shrink-0" />
                <span className="leading-relaxed">
                  <strong className="text-red-300 font-bold">CẢNH BÁO TỐI CAO:</strong> Lực lượng đồn trú sụp đổ!
                  Chủ quyền Sector đã chuyển giao sang quân đoàn The Void.
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs sm:text-sm text-zinc-300">
            {resolutionResult?.message ||
              "Kết quả trận chiến đang được ghi nhận vào sổ nhật ký giao dịch chiến lược..."}
          </div>
        )}

        <div className="text-xs text-zinc-400 pt-1.5 border-t border-border/40 leading-relaxed">
          Biên lai đã được ghi nhận lũy đẳng vào STARFRONT_WORLD_SAVE_V1. Lực
          lượng đồn trú tại sector đã được giải phóng khỏi trạng thái đóng băng.
        </div>
      </div>

      {/* 4. Nút Hành Động Trở Về */}
      <div className="mt-5 flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-border/60">
        <Button
          onClick={onReturnToWarRoom}
          className={cn(
            "gap-2 font-display uppercase tracking-wider text-xs sm:text-sm px-6 py-3 cursor-pointer font-bold shadow-lg",
            isVictory
              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
              : "bg-cyan-600 hover:bg-cyan-500 text-white",
          )}
        >
          <span>HOÀN TẤT & TRỞ VỀ SỞ CHỈ HUY (WAR ROOM)</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
