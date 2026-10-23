"use client"

import React, { useState } from "react"
import type { CharacterProfileV2, GalleryArtwork } from "@/lib/game/v2/character-profile-data"
import { resolveImageUrl } from "@/lib/game/assets/image-resolver"
import { Image as ImageIcon, ZoomIn, Clock, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Layers } from "lucide-react"

interface GalleryTabProps {
  character: CharacterProfileV2
  onInspectArtwork: (artwork: GalleryArtwork) => void
}

export function GalleryTab({ character, onInspectArtwork }: GalleryTabProps) {
  const [isArchiveOpen, setIsArchiveOpen] = useState<boolean>(false)
  const artworks = character.artworks

  const verifiedArtworks = artworks.filter((a) => a.isAvailableOnDisk)
  const archiveArtworks = artworks.filter((a) => !a.isAvailableOnDisk)

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* 1. HEADER CHÍNH SÁCH WEBP RUNTIME */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-cyan-400" />
            <h3 className="text-base font-bold tracking-wider text-slate-100 uppercase">
              Bộ Sưu Tập Tác Phẩm Nghệ Thuật (Gallery V2)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-500/50 px-2.5 py-1 text-xs font-mono font-bold text-emerald-300">
              <CheckCircle2 className="size-3.5" />
              <span>{verifiedArtworks.length} WebP Sẵn Sàng</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-mono text-slate-400 border border-slate-700">
              <Clock className="size-3.5" />
              <span>{archiveArtworks.length} Chờ Đồng Bộ</span>
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          Chính sách Zero Broken Images: Chỉ tải hình ảnh WebP có tệp vật lý xác minh trên hệ thống. Không tạo request tới các tệp ảnh chưa có trên đĩa.
        </p>
      </div>

      {/* 2. TÁC PHẨM ĐÃ XÁC MINH WEBP (HIỂN THỊ NỔI BẬT) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="h-4 w-1 bg-cyan-400 rounded-full" />
          <h4 className="text-sm font-bold tracking-wider text-slate-200 uppercase">
            Tác Phẩm Trực Tuyến Đã Kiểm Chứng ({verifiedArtworks.length})
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {verifiedArtworks.map((art) => (
            <div
              key={art.id}
              className="group relative overflow-hidden rounded-xl border border-cyan-500/50 bg-slate-950 shadow-lg transition-all hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.35)]"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-950">
                <img
                  src={resolveImageUrl(art.path)}
                  alt={art.title}
                  className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90" />

                <span className="absolute top-3 right-3 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[11px] font-bold text-black font-mono shadow-md flex items-center gap-1">
                  <CheckCircle2 className="size-3" />
                  <span>WebP Verified</span>
                </span>

                {/* Nút phóng to / soi tranh (Touch target >= 44px) */}
                <button
                  onClick={() => onInspectArtwork(art)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer min-h-[44px]"
                  title="Mở trình soi tranh chi tiết"
                >
                  <div className="flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-2.5 text-sm font-black text-black shadow-xl hover:bg-cyan-400 transition-colors">
                    <ZoomIn className="size-4" />
                    <span>Soi Tranh Chi Tiết</span>
                  </div>
                </button>
              </div>

              <div className="p-4 space-y-1.5 border-t border-slate-800/80 bg-slate-900/80">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-base text-slate-100 group-hover:text-cyan-300 transition-colors">
                    {art.title}
                  </h5>
                  <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {art.category}
                  </span>
                </div>
                <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
                  {art.description}
                </p>
                <div className="pt-1 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Mã: {art.id}</span>
                  <span className="text-emerald-400 font-semibold">{art.path}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. KHO LƯU TRỮ CHỜ ĐỒNG BỘ (COLLAPSIBLE STATUS SUMMARY - KHÔNG TRÀN LAN 28 CARDS) */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden transition-all">
        <button
          onClick={() => setIsArchiveOpen(!isArchiveOpen)}
          className="w-full flex items-center justify-between p-4 bg-slate-900/80 hover:bg-slate-800/80 transition-colors text-left cursor-pointer min-h-[48px]"
          title="Bấm để mở rộng hoặc thu gọn danh mục lưu trữ"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
              <Layers className="size-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-200">
                Kho Lưu Trữ Hồ Sơ: {archiveArtworks.length} Tác Phẩm Chờ Đồng Bộ WebP
              </h4>
              <p className="text-xs text-slate-400">
                Bao gồm 8 chân dung biểu cảm, 6 bối cảnh tác chiến, 6 hoạt cảnh buồng lái, 8 phác thảo phục trang
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-1 rounded hidden sm:inline">
              Archive Manifest ({archiveArtworks.length})
            </span>
            {isArchiveOpen ? (
              <ChevronUp className="size-5 text-slate-400" />
            ) : (
              <ChevronDown className="size-5 text-slate-400" />
            )}
          </div>
        </button>

        {isArchiveOpen && (
          <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/90 animate-in fade-in duration-200">
            <div className="text-xs text-slate-400 leading-relaxed bg-slate-900/70 p-3 rounded-lg border border-slate-800">
              <p className="font-semibold text-slate-200 mb-1">
                Ghi chú kỹ thuật FND-8 / Valentine Manifest:
              </p>
              Các tác phẩm dưới đây đã được ghi nhận trong manifest nguồn (`valentine_assets_manifest.json`) và sẵn sàng kích hoạt ngay khi tệp ảnh vật lý định dạng WebP được đồng bộ vào thư mục tĩnh `public/images/`.
            </div>

            <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-lg overflow-hidden bg-slate-900/30">
              {archiveArtworks.map((art, idx) => (
                <div
                  key={art.id}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-slate-500 w-6">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="flex size-7 items-center justify-center rounded bg-slate-800 text-slate-400 shrink-0">
                      <ImageIcon className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{art.title}</p>
                      <p className="text-xs text-slate-400">{art.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-mono">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-400 border border-slate-700">
                      {art.category}
                    </span>
                    <span className="rounded bg-amber-950/70 text-amber-300 border border-amber-500/30 px-2 py-0.5">
                      Chờ WebP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
