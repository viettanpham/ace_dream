"use client"

import React, { useState } from "react"
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  HeartPulse,
  Skull,
  Lock,
  LifeBuoy,
  Info,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from "lucide-react"
import type { PilotSurvivalRecord, PilotSurvivalTier, PilotFinalStatus } from "@/lib/game/world/pilot-survival-types"

export interface PilotSurvivalReportProps {
  records: PilotSurvivalRecord[]
  victory: boolean
  className?: string
}

export function PilotSurvivalReport({ records, victory, className = "" }: PilotSurvivalReportProps) {
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null)

  if (!records || records.length === 0) {
    return (
      <div className={`rounded-lg border border-slate-800 bg-slate-950/70 p-4 font-mono text-xs ${className}`}>
        <div className="flex items-center gap-2 text-emerald-400">
          <ShieldCheck className="size-4" />
          <span className="font-bold">KHÔNG CÓ THƯƠNG VONG PHI CÔNG TRONG TRẬN CHIẾN</span>
        </div>
        <p className="text-slate-400 mt-1 text-[11px]">
          Toàn bộ các cỗ máy GEAR đồng minh đều bảo toàn nguyên vẹn hoặc đã rút lui an toàn.
        </p>
      </div>
    )
  }

  const rescuedCount = records.filter((r) => r.finalStatus === "RESCUED").length
  const capturedCount = records.filter((r) => r.finalStatus === "CAPTURED").length
  const kiaCount = records.filter((r) => r.finalStatus === "KIA").length

  const getTierBadge = (tier: PilotSurvivalTier) => {
    switch (tier) {
      case "SAFE":
        return {
          bg: "bg-emerald-950/80 border-emerald-500/60 text-emerald-300",
          icon: ShieldCheck,
          label: "SAFE (>= 70)",
          sub: "Thoát hiểm an toàn",
        }
      case "PROTECTED":
        return {
          bg: "bg-cyan-950/80 border-cyan-500/60 text-cyan-300",
          icon: LifeBuoy,
          label: "PROTECTED (50-69)",
          sub: "Đồng minh che chở",
        }
      case "CRITICAL":
        return {
          bg: "bg-amber-950/80 border-amber-500/60 text-amber-300",
          icon: AlertTriangle,
          label: "CRITICAL (30-49)",
          sub: "Nguy kịch / Hỗ trợ sống yếu",
        }
      case "KIA":
        return {
          bg: "bg-rose-950/80 border-rose-500/60 text-rose-300",
          icon: Skull,
          label: "KIA (<= 29)",
          sub: "Tử trận tức thì",
        }
    }
  }

  const getStatusBadge = (status: PilotFinalStatus) => {
    switch (status) {
      case "RESCUED":
        return {
          bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
          icon: UserCheck,
          label: "ĐÃ GIẢI CỨU (RESCUED)",
          desc: "Đang được chăm sóc tại trạm xá tiền phương VSS.",
        }
      case "CAPTURED":
        return {
          bg: "bg-purple-500/20 text-purple-300 border-purple-500/50",
          icon: Lock,
          label: "BỊ BẮT LÀM TÙ BINH (POW)",
          desc: "Đã chuyển vào Sổ bộ Tù binh Quốc gia. Mở chiến dịch giải cứu.",
        }
      case "KIA":
        return {
          bg: "bg-rose-500/20 text-rose-300 border-rose-500/50",
          icon: Skull,
          label: "TỬ TRẬN (KIA)",
          desc: "Ghi nhận hy sinh vĩnh viễn vào sổ tang liên minh.",
        }
      case "MISSING":
        return {
          bg: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
          icon: ShieldAlert,
          label: "MẤT TÍCH (MISSING)",
          desc: "Tín hiệu định vị chập chờn chưa thể xác minh.",
        }
    }
  }

  return (
    <div className={`rounded-lg border border-slate-700 bg-slate-900/90 p-4 font-mono text-xs shadow-xl ${className}`}>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <HeartPulse className="size-5 text-rose-400 animate-pulse" />
          <div>
            <span className="font-bold text-slate-100 text-sm uppercase block">
              BÁO CÁO SINH TỒN & TÌM KIẾM CỨU NẠN (SAR PIPELINE — PHASE 6.34)
            </span>
            <span className="text-slate-400 text-[11px]">
              Tách biệt sinh mạng phi công khỏi xác cỗ máy GEAR bị phá hủy
            </span>
          </div>
        </div>

        {/* Counter pills */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-950/60 text-emerald-300 text-[11px] font-bold">
            {rescuedCount} Được Cứu
          </span>
          <span className="px-2 py-0.5 rounded border border-purple-500/40 bg-purple-950/60 text-purple-300 text-[11px] font-bold">
            {capturedCount} Bị Bắt (POW)
          </span>
          <span className="px-2 py-0.5 rounded border border-rose-500/40 bg-rose-950/60 text-rose-300 text-[11px] font-bold">
            {kiaCount} Tử Trận
          </span>
        </div>
      </div>

      {/* List of Downed Pilots */}
      <div className="space-y-2.5">
        {records.map((rec) => {
          const tier = getTierBadge(rec.initialTier)
          const TierIcon = tier.icon
          const status = getStatusBadge(rec.finalStatus)
          const StatusIcon = status.icon
          const isExpanded = expandedRecordId === rec.recordId

          return (
            <div
              key={rec.recordId}
              className={`rounded border transition-all ${
                rec.isPlayer
                  ? "border-amber-500/60 bg-amber-950/20"
                  : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
              } p-3`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded border ${tier.bg}`}>
                    <TierIcon className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-xs">{rec.pilotName}</span>
                      {rec.isPlayer && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500 text-black font-extrabold text-[10px]">
                          CHỈ HUY TRƯỞNG
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">({rec.gearName})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Tiêu diệt tại Hiệp {rec.destructionRound}</span>
                      <span>•</span>
                      <span>Điểm Sinh Tồn: <strong className="text-cyan-300">{rec.survivalScore}/100</strong></span>
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2">
                  <div className={`px-2.5 py-1 rounded border text-[11px] font-bold flex items-center gap-1.5 ${status.bg}`}>
                    <StatusIcon className="size-3.5" />
                    <span>{status.label}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedRecordId(isExpanded ? null : rec.recordId)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                    title="Chi tiết tham số tính điểm"
                  >
                    {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Narrative explanation */}
              <div className="mt-2 text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800/80">
                <span className="text-slate-400 font-semibold">Tình trạng cứu nạn: </span>
                <span>{rec.notes}</span>
                {rec.rescueDispatchId && (
                  <div className="mt-1 text-purple-300 font-bold flex items-center gap-1">
                    <Lock className="size-3" />
                    <span>Nhiệm vụ đột kích cứu con tin đã kích hoạt: {rec.rescueDispatchId}</span>
                  </div>
                )}
              </div>

              {/* Expanded Breakdown */}
              {isExpanded && rec.breakdown && (
                <div className="mt-2 pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                  <div className="bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-500 block">Độ tin cậy vỏ thoát hiểm:</span>
                    <span className="font-bold text-slate-200">+{rec.breakdown.baseReliability}</span>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-500 block">Tương quan lực lượng:</span>
                    <span className={`font-bold ${rec.breakdown.forceBalanceModifier >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {rec.breakdown.forceBalanceModifier >= 0 ? `+${rec.breakdown.forceBalanceModifier}` : rec.breakdown.forceBalanceModifier}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-500 block">Đồng minh che chắn:</span>
                    <span className="font-bold text-cyan-400">+{rec.breakdown.alliedProtectionModifier}</span>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-500 block">Áp lực hỏa lực địch:</span>
                    <span className="font-bold text-rose-400">{rec.breakdown.enemyPressureModifier}</span>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-500 block">Yểm trợ chiến thuật:</span>
                    <span className="font-bold text-purple-400">+{rec.breakdown.supportModifier}</span>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-500 block">Sĩ khí quân đội:</span>
                    <span className={`font-bold ${rec.breakdown.moraleModifier >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {rec.breakdown.moraleModifier >= 0 ? `+${rec.breakdown.moraleModifier}` : rec.breakdown.moraleModifier}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
