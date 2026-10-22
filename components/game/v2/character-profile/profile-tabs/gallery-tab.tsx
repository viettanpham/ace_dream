"use client"

import React, { useState } from "react"
import type { CharacterProfileV2, GalleryArtwork } from "@/lib/game/v2/character-profile-data"
import { Image as ImageIcon, ZoomIn, Clock, CheckCircle2, Filter } from "lucide-react"

interface GalleryTabProps {
  character: CharacterProfileV2
  onInspectArtwork: (artwork: GalleryArtwork) => void
}

export function GalleryTab({ character, onInspectArtwork }: GalleryTabProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "verified" | "archive">("all")
  const artworks = character.artworks

  const filteredArtworks = artworks.filter((art) => {
    if (activeFilter === "verified") return art.isAvailableOnDisk
    if (activeFilter === "archive") return !art.isAvailableOnDisk
    return true
  })

  const verifiedCount = artworks.filter((a) => a.isAvailableOnDisk).length
  const archiveCount = artworks.filter((a) => !a.isAvailableOnDisk).length

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* 1. THANH LỌC DANH MỤC ARTWORK */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-cyan-400" />
          <h3 className="text-base font-bold tracking-wider text-slate-100 uppercase">
            Bộ Sưu Tập Artwork ({artworks.length})
          </h3>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-md border border-slate-800">
          <button
            onClick={() => setActiveFilter("all")}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer min-h-[36px] ${
              activeFilter === "all"
                ? "bg-cyan-500 text-black font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tất cả ({artworks.length})
          </button>
          <button
            onClick={() => setActiveFilter("verified")}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer min-h-[36px] ${
              activeFilter === "verified"
                ? "bg-emerald-500 text-black font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Đã Kiểm Chứng WebP ({verifiedCount})
          </button>
          <button
            onClick={() => setActiveFilter("archive")}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer min-h-[36px] ${
              activeFilter === "archive"
                ? "bg-slate-700 text-white font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Chờ Đồng Bộ ({archiveCount})
          </button>
        </div>
      </div>

      {/* 2. CHÍNH SÁCH XỬ LÝ ZERO-BROKEN-IMAGES */}
      <div className="rounded-md border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-300 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
          <span>Chính sách WebP Runtime: Chỉ tải ảnh có tệp vật lý xác minh trên đĩa (Zero Broken Images).</span>
        </div>
        <span className="font-mono text-cyan-400 font-semibold">2 Tác phẩm sẵn sàng</span>
      </div>

      {/* 3. LƯỚI DANH MỤC ARTWORK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArtworks.map((art) => {
          if (art.isAvailableOnDisk) {
            // Tác phẩm có thật trên đĩa: hiển thị hình ảnh thật với nút soi ảnh
            return (
              <div
                key={art.id}
                className="group relative overflow-hidden rounded-lg border border-cyan-500/50 bg-slate-900 shadow-md transition-all hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-950">
                  <img
                    src={art.path}
                    alt={art.title}
                    className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />

                  <span className="absolute top-2.5 right-2.5 rounded bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-black font-mono shadow">
                    WebP Verified
                  </span>

                  {/* Nút phóng to / soi ảnh */}
                  <button
                    onClick={() => onInspectArtwork(art)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
                    title="Mở trình soi tranh chi tiết"
                  >
                    <div className="flex items-center gap-1.5 rounded-full bg-cyan-500 px-3.5 py-1.5 text-xs font-bold text-black shadow-lg">
                      <ZoomIn className="size-4" />
                      <span>Soi Tranh</span>
                    </div>
                  </button>
                </div>

                <div className="p-3 space-y-1">
                  <h4 className="font-bold text-sm text-slate-100 truncate group-hover:text-cyan-300 transition-colors">
                    {art.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-1">{art.description}</p>
                </div>
              </div>
            )
          }

          // Tác phẩm trong manifest chưa có file vật lý: hiển thị thẻ Archive an toàn
          return (
            <div
              key={art.id}
              className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 flex flex-col justify-between gap-3 opacity-80 hover:opacity-100 transition-opacity"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex size-8 items-center justify-center rounded bg-slate-800 text-slate-400">
                    <ImageIcon className="size-4" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-slate-700">
                    <Clock className="size-3" />
                    <span>Chờ Đồng Bộ WebP</span>
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-200">{art.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {art.description}
                </p>
              </div>

              <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Mã: {art.id}</span>
                <span className="uppercase text-[10px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                  {art.category}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
