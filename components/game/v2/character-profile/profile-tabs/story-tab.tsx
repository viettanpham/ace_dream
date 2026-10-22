"use client"

import React, { useState } from "react"
import type { CharacterProfileV2, StoryChapter } from "@/lib/game/v2/character-profile-data"
import { BookOpen, Lock, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react"

interface StoryTabProps {
  character: CharacterProfileV2
}

export function StoryTab({ character }: StoryTabProps) {
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0)
  const chapters = character.chapters
  const activeChapter = chapters[activeChapterIndex] || chapters[0]

  const getStatusBadge = (status: StoryChapter["status"]) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-500/50 px-2 py-0.5 text-xs font-mono font-bold text-emerald-300">
            <CheckCircle2 className="size-3" />
            <span>APPROVED</span>
          </span>
        )
      case "PROVISIONAL":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 text-xs font-mono font-bold text-amber-300">
            <AlertCircle className="size-3" />
            <span>PROVISIONAL</span>
          </span>
        )
      case "HOLD":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-900 border border-slate-700 px-2 py-0.5 text-xs font-mono font-medium text-slate-400">
            <Lock className="size-3" />
            <span>HOLD</span>
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* 1. TÓM TẮT TIỂU SỬ (BIOGRAPHY SUMMARY) */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
          <BookOpen className="size-4 text-cyan-400" />
          <h3 className="text-base font-bold tracking-wider text-slate-100 uppercase">
            Tiểu Sử & Bối Cảnh (Biography)
          </h3>
        </div>
        <p className="text-[16px] leading-relaxed text-slate-200">
          {character.storySummary}
        </p>
      </section>

      {/* 2. LỘ TRÌNH 10 CHƯƠNG BIÊN NIÊN (10-CHAPTER ROADMAP) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold tracking-wider text-slate-300 uppercase">
            Danh Sách Biên Niên Ký (10 Chương)
          </h4>
          <span className="text-xs text-slate-400 font-mono">
            Chương {activeChapter ? activeChapter.number : 1}/10
          </span>
        </div>

        {/* Thanh chọn chương nằm ngang cuộn mượt */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {chapters.map((chap, idx) => {
            const isSelected = idx === activeChapterIndex
            const isHold = chap.status === "HOLD"

            return (
              <button
                key={chap.id}
                onClick={() => setActiveChapterIndex(idx)}
                className={`flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-all cursor-pointer min-h-[44px] ${
                  isSelected
                    ? "border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)] font-bold"
                    : isHold
                    ? "border-slate-800/80 bg-slate-950/60 text-slate-500 hover:text-slate-400"
                    : "border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span>Chương {String(chap.number).padStart(2, "0")}</span>
                {chap.status === "APPROVED" && (
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                )}
                {chap.status === "PROVISIONAL" && (
                  <span className="size-1.5 rounded-full bg-amber-400" />
                )}
                {chap.status === "HOLD" && <Lock className="size-3 text-slate-600" />}
              </button>
            )
          })}
        </div>
      </section>

      {/* 3. KHU VỰC ĐỌC NỘI DUNG CHƯƠNG ĐANG CHỌN (READING PROSE VIEW) */}
      {activeChapter && (
        <article className="rounded-lg border border-slate-800 bg-slate-900/70 p-5 sm:p-6 shadow-md space-y-4">
          {/* Header Chương */}
          <div className="border-b border-slate-800/80 pb-4 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                Chương {String(activeChapter.number).padStart(2, "0")}
              </span>
              {getStatusBadge(activeChapter.status)}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
              {activeChapter.title}
            </h2>
            <p className="text-sm text-slate-400 italic">
              {activeChapter.summary}
            </p>
          </div>

          {/* Nội Dung Chương Đầy Đủ */}
          {activeChapter.content ? (
            <div className="space-y-4 max-w-prose">
              {activeChapter.content.split("\n\n").map((para, pIdx) => {
                if (para.startsWith(">")) {
                  return (
                    <blockquote
                      key={pIdx}
                      className="border-l-4 border-cyan-400 pl-4 py-1 italic text-slate-200 text-[17px] bg-cyan-950/20 rounded-r"
                    >
                      {para.replace(/^>\s*/, "")}
                    </blockquote>
                  )
                }
                return (
                  <p
                    key={pIdx}
                    className="text-[17px] leading-[1.7] text-slate-200 font-normal tracking-normal"
                  >
                    {para}
                  </p>
                )
              })}
            </div>
          ) : activeChapter.status === "APPROVED" ? (
            <div className="rounded-md border border-slate-800 bg-slate-950/70 p-5 text-center space-y-2">
              <p className="text-base text-slate-300 font-medium">
                Nội dung chi tiết của Chương {String(activeChapter.number).padStart(2, "0")} đã được phê duyệt cốt truyện và đang trong giai đoạn hoàn thiện văn bản văn xuôi.
              </p>
              <p className="text-xs text-slate-500 font-mono">
                Dự kiến phát hành ở bản cập nhật tiếp theo.
              </p>
            </div>
          ) : activeChapter.status === "PROVISIONAL" ? (
            <div className="rounded-md border border-amber-500/30 bg-amber-950/20 p-5 text-center space-y-2">
              <AlertCircle className="size-6 text-amber-400 mx-auto" />
              <p className="text-base text-amber-200 font-medium">
                Bản thảo sơ bộ — Chưa phát hành chính thức
              </p>
              <p className="text-xs text-amber-400/80">
                Nội dung đang được nhóm biên tập rà soát cùng bối cảnh thế giới STARFRONT WORLD.
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-slate-800 bg-slate-950/80 p-6 text-center space-y-2">
              <Lock className="size-6 text-slate-500 mx-auto" />
              <p className="text-base text-slate-400 font-medium">
                Hồ Sơ Niêm Phong / Chưa Mở Khóa
              </p>
              <p className="text-xs text-slate-600 font-mono">
                Cần hoàn thành các chương trước hoặc đạt cấp độ tác chiến theo quy định.
              </p>
            </div>
          )}

          {/* Trích Dẫn Lời Thề Cuối Chương (nếu có) */}
          {activeChapter.quote && (
            <div className="mt-6 border-t border-slate-800/80 pt-4">
              <div className="rounded border border-cyan-500/40 bg-slate-950 p-4">
                <p className="text-base italic text-cyan-200">
                  {activeChapter.quote}
                </p>
                <span className="block mt-2 text-right text-xs font-mono text-cyan-400">
                  — {character.fullLoreName} ({character.callsign})
                </span>
              </div>
            </div>
          )}
        </article>
      )}
    </div>
  )
}
