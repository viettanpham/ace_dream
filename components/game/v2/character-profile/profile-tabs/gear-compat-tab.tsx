"use client"

import React from "react"
import type { CharacterProfileV2 } from "@/lib/game/v2/character-profile-data"
import { Cpu, ShieldCheck, AlertCircle, Wrench } from "lucide-react"

interface GearCompatTabProps {
  character: CharacterProfileV2
}

export function GearCompatTab({ character }: GearCompatTabProps) {
  const GEAR_CLASSES = [
    {
      id: "vanguard",
      name: "Vanguard",
      type: "Cơ Giáp Tác Chiến Đa Năng (All-Rounder Fighter)",
      colorBorder: "border-cyan-500/40",
      colorBg: "bg-cyan-950/20",
      accentText: "text-cyan-400",
    },
    {
      id: "falcon",
      name: "Falcon",
      type: "Cơ Giáp Tiêm Kích Siêu Cơ Động (High-Mobility Interceptor)",
      colorBorder: "border-purple-500/40",
      colorBg: "bg-purple-950/20",
      accentText: "text-purple-400",
    },
    {
      id: "aegis",
      name: "Aegis",
      type: "Cơ Giáp Thiết Giáp Hạng Nặng (Heavy Shield Fortress)",
      colorBorder: "border-amber-500/40",
      colorBg: "bg-amber-950/20",
      accentText: "text-amber-400",
    },
  ]

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* 1. THÔNG BÁO MINH BẠCH VỀ TRẠNG THÁI CANONICAL */}
      <section className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-4 sm:p-5 shadow-sm space-y-2.5">
        <div className="flex items-center gap-2 text-amber-300">
          <AlertCircle className="size-5 shrink-0" />
          <h3 className="text-base font-bold tracking-wider uppercase">
            Hệ Thống Đánh Giá Tương Thích Cơ Giáp (GEAR Compatibility)
          </h3>
        </div>
        <p className="text-sm sm:text-base leading-relaxed text-amber-100/90">
          Hệ thống ma trận tương thích giữa Phi Công và 3 lớp Cơ Giáp (Vanguard, Falcon, Aegis) đang trong giai đoạn chuẩn hóa quy chuẩn thuộc phân hệ <strong>FND-8.3 (HOLD)</strong>.
        </p>
        <div className="flex items-center gap-1.5 text-xs text-amber-400/80 font-mono">
          <span>* Nguyên tắc: Không tự sáng tác điểm số hay xếp hạng (S/A/B/C) khi chưa có tài liệu canonical phê duyệt.</span>
        </div>
      </section>

      {/* 2. DANH SÁCH 3 LỚP CƠ GIÁP ĐANG CHUẨN BỊ TÍCH HỢP */}
      <section className="space-y-4">
        <h4 className="text-sm font-bold tracking-wider text-slate-300 uppercase">
          Khung Cơ Giáp Đang Khảo Nghiệm Cùng {character.classCharacterName}
        </h4>

        <div className="grid grid-cols-1 gap-3.5">
          {GEAR_CLASSES.map((gear) => (
            <div
              key={gear.id}
              className={`rounded-lg border ${gear.colorBorder} ${gear.colorBg} p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Cpu className={`size-4 ${gear.accentText}`} />
                  <h5 className="font-bold text-base text-white">{gear.name}</h5>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300">
                    Khung Tiêu Chuẩn
                  </span>
                </div>
                <p className="text-sm text-slate-300">{gear.type}</p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1.5 rounded bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs font-mono text-slate-400">
                  <Wrench className="size-3.5 text-amber-400 animate-spin" />
                  <span>Đang Chuẩn Hóa FND-8.3</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. ĐỊNH HƯỚNG CHUYÊN MÔN THEO LORE DUYỆT */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-emerald-400" />
          <h4 className="text-sm font-bold tracking-wider text-slate-200 uppercase">
            Định Hướng Khí Tài Phù Hợp (Theo Lore Đã Duyệt)
          </h4>
        </div>
        <p className="text-sm leading-relaxed text-slate-300">
          Với vai trò <strong>{character.role}</strong> và hai đặc tính bảo hộ y tế, phi công {character.classCharacterName} được thiết kế tối ưu cho các dòng cơ giáp trang bị bộ điều áp khiên năng lượng cao, buồng cấp cứu chiến trường và hệ thống đẩy cơ động nhẹ.
        </p>
      </section>
    </div>
  )
}
