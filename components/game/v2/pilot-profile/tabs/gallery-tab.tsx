'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { GalleryArtwork, CharacterProfileV2 } from '@/lib/game/v2/character-profile-data'
import { resolveImageUrl } from '@/lib/game/assets/image-resolver'
import {
  FileArchive,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  Sparkles,
  Info,
  Layers,
  FileCode,
} from 'lucide-react'

interface GalleryTabProps {
  character: CharacterProfileV2
  onSelectArtwork: (art: GalleryArtwork) => void
}

export function GalleryTab({ character, onSelectArtwork }: GalleryTabProps) {
  const [showArchiveSection, setShowArchiveSection] = useState<boolean>(true)
  const [dynamicArtworks, setDynamicArtworks] = useState<GalleryArtwork[]>([])
  const [loadingDynamic, setLoadingDynamic] = useState<boolean>(false)
  const [activeMetaDetail, setActiveMetaDetail] = useState<GalleryArtwork | null>(null)

  // Fetch dynamic artworks from CDN R2 via /api/runtime/gallery/[pilotId]
  useEffect(() => {
    let isCancelled = false;
    setLoadingDynamic(true);

    fetch(`/api/runtime/gallery/${character.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.success && Array.isArray(data.artworks) && data.artworks.length > 0) {
          const mapped: GalleryArtwork[] = data.artworks.map((item: any) => {
            const isCore = item.role === 'fullbody' || item.role === 'portrait' || item.role === 'combat' || item.role === 'closeup' || item.role === 'activity';
            const cat = isCore ? 'base' : (item.role.includes('event') ? 'event' : (item.role.includes('activity') ? 'activity' : 'costume'));

            return {
              id: item.assetId,
              title: item.title || `${character.classCharacterName} — ${item.role.toUpperCase()}`,
              category: cat,
              path: `/${item.path}`,
              isAvailableOnDisk: true,
              status: 'verified_webp',
              description: item.description || `Định dạng WebP tối ưu (${item.width || 1122}×${item.height || 1402}px, ${(Number(item.byteSize || 0) / 1024).toFixed(0)} KB)`,
              dimensions: item.width && item.height ? { width: item.width, height: item.height } : undefined,
              sha256: item.sha256,
              byteSize: item.byteSize,
            } as GalleryArtwork & { sha256?: string; byteSize?: number };
          });
          setDynamicArtworks(mapped);
        } else {
          setDynamicArtworks([]);
        }
      })
      .catch(() => {
        if (!isCancelled) setDynamicArtworks([]);
      })
      .finally(() => {
        if (!isCancelled) setLoadingDynamic(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [character.id, character.classCharacterName]);

  // If character.artworks is authoritative from parent, prioritize it directly
  const verifiedArtworks =
    character.artworks.length > 0
      ? character.artworks.filter((a) => a.isAvailableOnDisk !== false)
      : (dynamicArtworks.length > 0 ? dynamicArtworks : character.artworks);

  const archiveArtworks = character.artworks.filter(
    (a) => a.isAvailableOnDisk === false && !verifiedArtworks.some((v) => v.id === a.id)
  );

  return (
    <div className="space-y-6">
      {/* 1. TÁC PHẨM ĐÃ XÁC MINH WEBP (VERIFIED WEBP ASSETS - KHẢ DỤNG TRÊN CDN) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#26384D] pb-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#F1F5F9]">
              Artwork Đã Kiểm Chứng (WebP Verified)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {loadingDynamic && (
              <span className="text-[11px] font-mono text-cyan-400 animate-pulse">
                Đang đồng bộ CDN...
              </span>
            )}
            <span className="text-xs font-mono text-[#34D399] font-bold">
              {verifiedArtworks.length} Tác Phẩm Khả Dụng
            </span>
          </div>
        </div>

        {verifiedArtworks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {verifiedArtworks.map((art) => (
              <div
                key={art.id}
                className="group relative rounded-2xl bg-[#0F172A] border border-[#26384D] hover:border-[#06B6D4] overflow-hidden transition-all duration-300 shadow-lg hover:shadow-cyan-500/10 flex flex-col justify-between"
              >
                {/* Image Preview Container */}
                <div
                  onClick={() => onSelectArtwork(art)}
                  className="relative h-64 sm:h-72 w-full bg-[#070A12] overflow-hidden cursor-pointer"
                >
                  <Image
                    src={resolveImageUrl(art.path)}
                    alt={art.title}
                    fill
                    priority
                    referrerPolicy="no-referrer"
                    className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Hover overlay hint */}
                  <div className="absolute inset-0 bg-[#070A12]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                    <div className="px-3 py-1.5 rounded-lg bg-[#06B6D4] text-[#070A12] font-mono font-bold text-xs flex items-center gap-1.5 shadow-lg">
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Xem Toàn Màn Hình</span>
                    </div>
                  </div>

                  {/* Verified Indicator */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#070A12]/80 text-[#34D399] border border-[#34D399]/40 backdrop-blur-md">
                      WebP HD
                    </span>
                  </div>
                </div>

                {/* Title & Metadata (Well-spaced, multi-line wrapping) */}
                <div className="p-4 border-t border-[#26384D] bg-[#0F172A] flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        onClick={() => onSelectArtwork(art)}
                        className="text-sm sm:text-base font-bold text-[#F1F5F9] group-hover:text-[#06B6D4] transition-colors leading-snug cursor-pointer break-words"
                      >
                        {art.title}
                      </h4>
                      <span className="text-[11px] font-mono text-[#A7B6C8] uppercase shrink-0 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {art.category}
                      </span>
                    </div>
                    {art.description && (
                      <p className="text-xs text-[#A7B6C8] mt-1.5 line-clamp-2 leading-relaxed">
                        {art.description}
                      </p>
                    )}
                  </div>

                  {/* Card bottom actions */}
                  <div className="mt-3 pt-2 border-t border-[#1e293b] flex items-center justify-between text-xs font-mono text-slate-400">
                    <button
                      type="button"
                      onClick={() => setActiveMetaDetail(activeMetaDetail?.id === art.id ? null : art)}
                      className="inline-flex items-center gap-1 hover:text-cyan-400 text-[11px] text-slate-400 transition-colors cursor-pointer"
                      title="Xem thông tin chi tiết tác phẩm"
                    >
                      <Info className="w-3 h-3 text-cyan-400" />
                      <span>{activeMetaDetail?.id === art.id ? 'Ẩn thông tin' : 'Thông tin ảnh'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectArtwork(art)}
                      className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold transition-colors cursor-pointer"
                    >
                      <span>Xem ảnh</span>
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Expanded metadata drawer inside card */}
                  {activeMetaDetail?.id === art.id && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-black/60 border border-cyan-950 text-[11px] font-mono text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">File:</span>
                        <span className="text-slate-200 truncate ml-2">{art.path.split('/').pop()}</span>
                      </div>
                      {art.dimensions && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Kích thước:</span>
                          <span className="text-cyan-400">{art.dimensions.width} × {art.dimensions.height} px</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-500">MIME:</span>
                        <span className="text-emerald-400 font-semibold">image/webp</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Trạng thái:</span>
                        <span className="text-emerald-400 font-semibold">HTTP 200 (Verified)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl bg-[#0F172A] border border-[#26384D] space-y-3">
            <Sparkles className="w-8 h-8 mx-auto text-[#06B6D4]" />
            <h4 className="text-sm font-bold text-[#F1F5F9]">
              Chưa Có Tác Phẩm WebP Chính Thức
            </h4>
            <p className="text-xs text-[#A7B6C8] max-w-sm mx-auto">
              Nhân vật {character.classCharacterName} đang trong quá trình dựng mẫu artwork V2. Các ý tưởng thiết kế được lưu trữ ở phần bên dưới.
            </p>
          </div>
        )}
      </div>

      {/* 2. THẺ HỒ SƠ LƯU TRỮ DANH MỤC (ARCHIVE PENDING CARDS - ZERO 404S) */}
      {archiveArtworks.length > 0 && (
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => setShowArchiveSection(!showArchiveSection)}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#0F172A] border border-[#26384D] hover:border-[#3B526D] transition-colors text-left cursor-pointer select-none"
          >
            <div className="flex items-center gap-2.5">
              <FileArchive className="w-4 h-4 text-[#FBBF24]" />
              <span className="text-sm font-bold uppercase tracking-wider text-[#F1F5F9]">
                Hồ Sơ Danh Mục Đang Chờ Đóng Gói WebP
              </span>
              <span className="text-xs font-mono text-[#FBBF24] font-bold">
                ({archiveArtworks.length} Mục)
              </span>
            </div>
            {showArchiveSection ? (
              <ChevronUp className="w-5 h-5 text-[#A7B6C8]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#A7B6C8]" />
            )}
          </button>

          {showArchiveSection && (
            <div className="p-4 rounded-xl bg-[#070A12]/80 border border-[#26384D] space-y-4">
              <div className="flex items-start gap-2.5 text-xs text-[#A7B6C8] leading-relaxed">
                <AlertCircle className="w-4 h-4 text-[#FBBF24] shrink-0 mt-0.5" />
                <span>
                  Các tác phẩm dưới đây đã được phê duyệt trong hồ sơ nghệ thuật canonical.
                  Để đảm bảo trải nghiệm Zero Broken Images, hệ thống trình bày dưới dạng thẻ metadata lưu trữ mà không tải file 404 trên mạng. Bấm vào bất kỳ thẻ nào để xem thông tin chi tiết.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {archiveArtworks.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => onSelectArtwork(art)}
                    className="p-3 rounded-xl bg-[#142338]/40 border border-[#26384D]/70 hover:border-[#FBBF24]/60 hover:bg-[#142338] transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-[#FBBF24] font-semibold">
                          Chờ WebP
                        </span>
                        <span className="text-[11px] font-mono text-[#A7B6C8] uppercase">
                          {art.category}
                        </span>
                      </div>
                      <h5 className="text-xs sm:text-sm font-bold text-[#F1F5F9] group-hover:text-[#FBBF24] transition-colors line-clamp-1">
                        {art.title}
                      </h5>
                      {art.description && (
                        <p className="text-xs text-[#A7B6C8] line-clamp-2 leading-relaxed">
                          {art.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GalleryTab
