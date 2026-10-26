"use client"

import React, { useState } from "react"
import type { CharacterProfileV2, StoryChapter } from "@/lib/game/v2/character-profile-data"
import { BookOpen, Lock, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react"

interface StoryTabProps {
  character: CharacterProfileV2
  onOpenReader?: (chapterId: string) => void
}

export function StoryTab({ character, onOpenReader }: StoryTabProps) {
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0)
  const chapters = character.chapters
  const activeChapter = chapters[activeChapterIndex] || chapters[0]

  const getStatusBadge = (chap: StoryChapter) => {
    const isAvailable = Boolean(chap.content)
    if (isAvailable) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-500/50 px-2 py-0.5 text-xs font-mono font-bold text-emerald-300">
          <CheckCircle2 className="size-3" />
          <span>CÓ VĂN XUÔI</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 text-xs font-mono font-bold text-amber-300">
        <AlertCircle className="size-3" />
        <span>COMING SOON</span>
      </span>
    )
  }

  const handleLaunchReader = (chapterId?: string) => {
    const targetId = chapterId || (activeChapter ? `chap-${String(activeChapter.number).padStart(2, '0')}` : 'chap-01')
    if (onOpenReader) {
      onOpenReader(targetId)
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

      {/* 2. LỘ TRÌNH CHƯƠNG BIÊN NIÊN */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold tracking-wider text-slate-300 uppercase">
            Danh Sách Biên Niên Ký ({chapters.length} Chương)
          </h4>
          <span className="text-xs text-slate-400 font-mono">
            Chương {activeChapter ? activeChapter.number : 1}/{chapters.length}
          </span>
        </div>

        {/* Thanh chọn chương nằm ngang cuộn mượt */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {chapters.map((chap, idx) => {
            const isSelected = idx === activeChapterIndex
            const chapId = `chap-${String(chap.number).padStart(2, '0')}`

            return (
              <button
                key={chap.id}
                onClick={() => {
                  setActiveChapterIndex(idx)
                  handleLaunchReader(chapId)
                }}
                className={`flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-all cursor-pointer min-h-[44px] ${
                  isSelected
                    ? "border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)] font-bold"
                    : "border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
                title={`Nhấn để mở Chương ${chap.number} trong Story Reader`}
              >
                <span>Chương {String(chap.number).padStart(2, "0")}</span>
                {chap.content ? (
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                ) : (
                  <span className="size-1.5 rounded-full bg-amber-400" />
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* 3. KHU VỰC ĐỌC NỘI DUNG CHƯƠNG ĐANG CHỌN */}
      {activeChapter && (
        <article className="rounded-lg border border-slate-800 bg-slate-900/70 p-5 sm:p-6 shadow-md space-y-4">
          {/* Header Chương */}
          <div className="border-b border-slate-800/80 pb-4 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                Chương {String(activeChapter.number).padStart(2, "0")}
              </span>
              {getStatusBadge(activeChapter)}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
              {activeChapter.title}
            </h2>
            <p className="text-sm text-slate-400 italic">
              {activeChapter.summary}
            </p>
          </div>

          {/* Nội Dung Chương Đầy Đủ hoặc Coming Soon */}
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
          ) : (
            <div className="rounded-md border border-amber-500/30 bg-amber-950/20 p-5 text-center space-y-3">
              <AlertCircle className="size-6 text-amber-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-base text-amber-200 font-bold">
                  Đang phát triển / Coming Soon
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Nội dung chi tiết của Chương {String(activeChapter.number).padStart(2, "0")} đang được đội ngũ biên tập hoàn thiện và sẽ ra mắt trong bản cập nhật cốt truyện tiếp theo.
                </p>
              </div>

              {onOpenReader && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleLaunchReader(`chap-${String(activeChapter.number).padStart(2, "0")}`)}
                    className="px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer"
                  >
                    Xem chi tiết trong Story Reader
                  </button>
                </div>
              )}
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
