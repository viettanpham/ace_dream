/**
 * STARFRONT WORLD — Battle Map 2D Conceptual Canvas (Phase 6.33)
 *
 * Renders an atmospheric tactical battlefield overview displaying:
 * - Allied and enemy formation lines (Dynamic force rosters, unequal sizes)
 * - Individual machine states (ACTIVE, RETREATING, RETREATED, DESTROYED)
 * - Retreat vector indicators
 * - Targeted action line projections
 * - Support fleet positions in low orbit
 */

import React, { useMemo } from "react"
import type { CombatV2Gear, CombatGearState } from "@/lib/game/world/combat-v2-types"
import type { CombatSupportEntity } from "@/lib/game/world/combat-v2-types"
import { Shield, Crosshair, ArrowLeftRight, Skull, PlaneTakeoff, Radio } from "lucide-react"

interface BattleMap2DProps {
  alliedGears: CombatV2Gear[]
  enemyGears: CombatV2Gear[]
  selectedGearId: string | null
  onSelectGear: (gearId: string) => void
  supportEntities?: CombatSupportEntity[]
  round: number
}

function getStateStyle(state: CombatGearState, side: "allied" | "enemy") {
  switch (state) {
    case "ACTIVE":
      return side === "allied"
        ? "border-cyan-500/80 bg-cyan-950/40 text-cyan-200 shadow-cyan-950/50"
        : "border-rose-500/80 bg-rose-950/40 text-rose-200 shadow-rose-950/50"
    case "RETREATING":
      return "border-amber-500/90 bg-amber-950/50 text-amber-200 animate-pulse ring-1 ring-amber-400/50"
    case "RETREATED":
      return "border-slate-800 bg-slate-950/80 text-slate-500 opacity-40 line-through"
    case "DESTROYED":
      return "border-rose-950 bg-black/90 text-rose-700 opacity-30 grayscale"
  }
}

export const BattleMap2D: React.FC<BattleMap2DProps> = ({
  alliedGears,
  enemyGears,
  selectedGearId,
  onSelectGear,
  supportEntities = [],
  round,
}) => {
  const selectedGear = useMemo(() => {
    return (
      alliedGears.find((g) => g.gearId === selectedGearId) ||
      enemyGears.find((g) => g.gearId === selectedGearId) ||
      null
    )
  }, [alliedGears, enemyGears, selectedGearId])

  return (
    <div className="relative w-full rounded-md border border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-black p-4 font-mono select-none overflow-hidden">
      {/* Background Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Header Info */}
      <div className="relative z-10 flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 mb-3 text-xs">
        <div className="flex items-center gap-2">
          <Crosshair className="size-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-200 tracking-wider">
            RADAR CHIẾN THUẬT 2D // SECTOR ENGAGEMENT MAP
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">Hiệp {round}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-cyan-400" />
            <span>Đồng minh ({alliedGears.filter((g) => g.state === "ACTIVE").length}/{alliedGears.length})</span>
          </div>
          <span className="text-slate-600">vs</span>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-rose-500" />
            <span>The Void ({enemyGears.filter((g) => g.state === "ACTIVE").length}/{enemyGears.length})</span>
          </div>
        </div>
      </div>

      {/* Support Low-Orbit Asset Strip */}
      {supportEntities.length > 0 && (
        <div className="relative z-10 mb-3 rounded border border-cyan-900/40 bg-cyan-950/20 px-3 py-1.5 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-cyan-400">
            <Radio className="size-3 animate-pulse" />
            <span className="font-medium text-cyan-300">QUỸ ĐẠO THẤP // HỖ TRỢ CHIẾN ĐỘI</span>
          </div>
          <div className="flex items-center gap-3">
            {supportEntities.map((supp) => (
              <span key={supp.id} className="text-slate-300">
                {supp.name}
                <span className="text-slate-500 ml-1.5">
                  [{supp.controlMode === "auto" ? "Tự Động" : "Thủ Công"}]
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tactical Canvas Area */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[220px]">
        {/* Allied Line (West Flank) */}
        <div className="rounded border border-cyan-900/30 bg-slate-950/40 p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-cyan-400 font-semibold mb-2 pb-1 border-b border-cyan-900/30">
              <span className="tracking-wide">TIẾN TUYẾN VSS (PHÍA TÂY)</span>
              <span className="text-[11px] text-slate-400">Lực lượng bảo an</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {alliedGears.map((gear) => {
                const isSelected = selectedGearId === gear.gearId
                const hpPct = Math.round((gear.currentHp / gear.maxHp) * 100)
                return (
                  <button
                    key={gear.gearId}
                    type="button"
                    onClick={() => onSelectGear(gear.gearId)}
                    className={`relative text-left p-2 rounded border transition-all text-xs cursor-pointer ${
                      getStateStyle(gear.state, "allied")
                    } ${
                      isSelected
                        ? "ring-2 ring-cyan-400 border-cyan-300 bg-cyan-950/80 shadow-md"
                        : "hover:border-cyan-400/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold truncate text-slate-100">{gear.name}</span>
                      {gear.isPlayer && (
                        <span className="text-[10px] text-cyan-400 font-bold px-1 bg-cyan-950 rounded">CHỈ HUY</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>HP {gear.currentHp}/{gear.maxHp}</span>
                      <span className="font-semibold">{hpPct}%</span>
                    </div>
                    {/* Mini HP Bar */}
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          hpPct > 50 ? "bg-cyan-400" : hpPct > 20 ? "bg-amber-400" : "bg-rose-500"
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, hpPct))}%` }}
                      />
                    </div>

                    {/* Operational State Indicator */}
                    <div className="mt-1.5 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">{gear.pilotName || "Phi công AI"}</span>
                      {gear.state === "RETREATING" && (
                        <span className="flex items-center gap-1 text-amber-300 font-bold">
                          <PlaneTakeoff className="size-2.5" /> Thoát ly ({gear.retreatTurnsRemaining} hiệp)
                        </span>
                      )}
                      {gear.state === "RETREATED" && (
                        <span className="text-slate-500">Đã thoát ly an toàn</span>
                      )}
                      {gear.state === "DESTROYED" && (
                        <span className="flex items-center gap-1 text-rose-500">
                          <Skull className="size-2.5" /> Đã phá hủy
                        </span>
                      )}
                      {gear.state === "ACTIVE" && (
                        <span className="text-cyan-400">Tác chiến tốt</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Enemy Line (East Flank) */}
        <div className="rounded border border-rose-900/30 bg-slate-950/40 p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-rose-400 font-semibold mb-2 pb-1 border-b border-rose-900/30">
              <span className="tracking-wide">TIẾN TUYẾN THE VOID (PHÍA ĐÔNG)</span>
              <span className="text-[11px] text-slate-400">Quân đoàn xâm lược</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {enemyGears.map((gear) => {
                const isSelected = selectedGearId === gear.gearId
                const hpPct = Math.round((gear.currentHp / gear.maxHp) * 100)
                return (
                  <button
                    key={gear.gearId}
                    type="button"
                    onClick={() => onSelectGear(gear.gearId)}
                    className={`relative text-left p-2 rounded border transition-all text-xs cursor-pointer ${
                      getStateStyle(gear.state, "enemy")
                    } ${
                      isSelected
                        ? "ring-2 ring-rose-400 border-rose-300 bg-rose-950/80 shadow-md"
                        : "hover:border-rose-400/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold truncate text-slate-100">{gear.name}</span>
                      <span className="text-[10px] text-rose-400 font-medium">ATK {gear.attack}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>HP {gear.currentHp}/{gear.maxHp}</span>
                      <span className="font-semibold">{hpPct}%</span>
                    </div>
                    {/* Mini HP Bar */}
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          hpPct > 50 ? "bg-rose-400" : hpPct > 20 ? "bg-amber-400" : "bg-rose-600"
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, hpPct))}%` }}
                      />
                    </div>

                    {/* Operational State Indicator */}
                    <div className="mt-1.5 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">DEF {gear.defense} · SPD {gear.speed}</span>
                      {gear.state === "RETREATING" && (
                        <span className="flex items-center gap-1 text-amber-300 font-bold">
                          <PlaneTakeoff className="size-2.5" /> Thoát ly ({gear.retreatTurnsRemaining})
                        </span>
                      )}
                      {gear.state === "RETREATED" && (
                        <span className="text-slate-500">Đã thoát ly</span>
                      )}
                      {gear.state === "DESTROYED" && (
                        <span className="flex items-center gap-1 text-rose-500">
                          <Skull className="size-2.5" /> Bị triệt hạ
                        </span>
                      )}
                      {gear.state === "ACTIVE" && (
                        <span className="text-rose-400">Mục tiêu đe dọa</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Entity Tactical Cross-Hair Inspect Ribbon */}
      {selectedGear && (
        <div className="relative z-10 mt-3 rounded border border-slate-700 bg-slate-900/90 p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold">MỤC TIÊU ĐANG KHÓA:</span>
            <span className="font-bold text-slate-100">{selectedGear.name}</span>
            <span className="text-slate-500">·</span>
            <span className={`text-[11px] font-medium ${selectedGear.side === "allied" ? "text-cyan-300" : "text-rose-300"}`}>
              {selectedGear.side === "allied" ? "Phe VSS Đồng Minh" : "Phe The Void Đối Nghịch"}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">Trạng thái: {selectedGear.state}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-300">
            <span>HP: <strong className="text-white">{selectedGear.currentHp}/{selectedGear.maxHp}</strong></span>
            <span>ATK: <strong className="text-white">{selectedGear.attack}</strong></span>
            <span>DEF: <strong className="text-white">{selectedGear.defense}</strong></span>
            <span>SPD: <strong className="text-white">{selectedGear.speed}</strong></span>
          </div>
        </div>
      )}
    </div>
  )
}
