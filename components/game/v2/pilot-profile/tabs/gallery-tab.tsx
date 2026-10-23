'use client'

import React, { useState } from 'react'
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
} from 'lucide-react'

interface GalleryTabProps {
  character: CharacterProfileV2
  onSelectArtwork: (art: GalleryArtwork) => void
}

export function GalleryTab({ character, onSelectArtwork }: GalleryTabProps) {
  const [showArchiveSection, setShowArchiveSection] = useState<boolean>(true)

  // Separate verified WebP artworks from pending archive items
  const verifiedArtworks = character.artworks.filter((a) => a.isAvailableOnDisk)
  const archiveArtworks = character.artworks.filter((a) => !a.isAvailableOnDisk)

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
          <span className="text-xs font-mono text-[#34D399] font-bold">
            {verifiedArtworks.length} Tác Phẩm Khả Dụng
          </span>
        </div>

        {verifiedArtworks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {verifiedArtworks.map((art) => (
              <div
                key={art.id}
                onClick={() => onSelectArtwork(art)}
                className="group relative rounded-2xl bg-[#0F172A] border border-[#26384D] hover:border-[#06B6D4] overflow-hidden transition-all duration-300 cursor-pointer shadow-lg hover:shadow-cyan-500/10 active:scale-[0.99]"
              >
                {/* Image Preview Container */}
                <div className="relative h-64 sm:h-72 w-full bg-[#070A12] overflow-hidden">
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
                      <span>Soi Tranh Chi Tiết</span>
                    </div>
                  </div>

                  {/* Verified Indicator */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#070A12]/80 text-[#34D399] border border-[#34D399]/40 backdrop-blur-md">
                      WebP HD
                    </span>
                  </div>
                </div>

                {/* Title & Metadata */}
                <div className="p-4 border-t border-[#26384D] bg-[#0F172A]">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm sm:text-base font-bold text-[#F1F5F9] group-hover:text-[#06B6D4] transition-colors truncate">
                      {art.title}
                    </h4>
                    <span className="text-xs font-mono text-[#A7B6C8] uppercase shrink-0">
                      {art.category}
                    </span>
                  </div>
                  {art.description && (
                    <p className="text-xs text-[#A7B6C8] mt-1 line-clamp-2 leading-relaxed">
                      {art.description}
                    </p>
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
