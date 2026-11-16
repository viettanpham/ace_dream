'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { CharacterProfileV2, GalleryArtwork } from '@/lib/game/v2/character-profile-data'
import {
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/game/v2/ui'
import {
  Maximize2,
  Image as ImageIcon,
  FileArchive,
  CheckCircle2,
  Sparkles,
  Clock,
  Info,
  Hash,
  Layers,
} from 'lucide-react'

interface GalleryTabProps {
  character: CharacterProfileV2
  selectedHeroArtwork: GalleryArtwork | null
  onSelectHeroArtwork: (artwork: GalleryArtwork) => void
  onOpenViewer: (artwork: GalleryArtwork) => void
}

type CategoryFilter = 'all' | 'core' | 'outfit'
type StatusFilter = 'all' | 'verified' | 'pending'

export function GalleryTab({
  character,
  selectedHeroArtwork,
  onSelectHeroArtwork,
  onOpenViewer,
}: GalleryTabProps) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [inspectedPendingArt, setInspectedPendingArt] = useState<GalleryArtwork | null>(null)

  const allArtworks = useMemo(() => {
    return [...(character.artworks || [])].sort(
      (a, b) => (a.order ?? 999) - (b.order ?? 999)
    )
  }, [character.artworks])

  const verifiedCount = useMemo(
    () => allArtworks.filter((a) => a.isAvailableOnDisk && Boolean(a.path)).length,
    [allArtworks]
  )
  const totalSourceCount = character.totalSourceArtworkCount ?? allArtworks.length
  const pendingCount = Math.max(0, allArtworks.length - verifiedCount)

  const coreCount = useMemo(
    () =>
      allArtworks.filter(
        (a) =>
          (a.rawCategory || '').toUpperCase() === 'CORE' ||
          a.category === 'base' ||
          a.category === 'portrait'
      ).length,
    [allArtworks]
  )
  const outfitCount = Math.max(0, allArtworks.length - coreCount)

  const filteredArtworks = useMemo(() => {
    return allArtworks.filter((art) => {
      const isCore =
        (art.rawCategory || '').toUpperCase() === 'CORE' ||
        art.category === 'base' ||
        art.category === 'portrait'

      if (categoryFilter === 'core' && !isCore) return false
      if (categoryFilter === 'outfit' && isCore) return false

      const isVerified = art.isAvailableOnDisk && Boolean(art.path)
      if (statusFilter === 'verified' && !isVerified) return false
      if (statusFilter === 'pending' && isVerified) return false

      return true
    })
  }, [allArtworks, categoryFilter, statusFilter])

  const getCategoryLabel = (art: GalleryArtwork) => {
    if (art.rawCategory) return art.rawCategory.toUpperCase()
    switch (art.category) {
      case 'base':
        return 'CORE'
      case 'portrait':
        return 'PORTRAIT'
      case 'costume':
        return 'OUTFIT'
      case 'activity':
        return 'ACTIVITY'
      case 'event':
        return 'EVENT'
      default:
        return 'GALLERY'
    }
  }

  return (
    <div className="space-y-5 text-[#F1F5F9]">
      {/* 1. Thanh Trạng Thái Đồng Bộ Gallery CDN (R4 -> R5+) */}
      <div className="p-4 rounded-xl bg-[#0F172A]/95 border border-[#26384D] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-5 h-5 text-[#00D4FF] shrink-0" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Thư Viện Thị Giác ({character.classCharacterName})
              </h3>
              <p className="text-xs text-[#CBD5E1] mt-0.5">
                Release {character.releaseVersion?.toUpperCase() || 'R4'} · Chỉ tải ảnh có{' '}
                <code className="text-[#34D399] font-mono">cdnStatus=VERIFIED</code> từ commit{' '}
                <code className="text-[#00D4FF] font-mono">
                  {(character.releaseCommitSha || '').slice(0, 7) || 'pinned'}
                </code>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#34D399]/15 border border-[#34D399]/40 text-[#34D399] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{verifiedCount} VERIFIED WEBP</span>
            </span>
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>{pendingCount} PENDING BINARY IMPORT</span>
              </span>
            )}
            <span className="px-2.5 py-1 rounded-lg bg-[#142338] border border-[#26384D] text-white font-bold">
              TỔNG HỒ SƠ: {totalSourceCount}
            </span>

            {verifiedCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  const firstVerified =
                    (selectedHeroArtwork?.isAvailableOnDisk && selectedHeroArtwork.path
                      ? selectedHeroArtwork
                      : null) ||
                    allArtworks.find((a) => a.isAvailableOnDisk && Boolean(a.path))
                  if (firstVerified) {
                    onOpenViewer(firstVerified)
                  }
                }}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#0284C7] hover:from-[#38BDF8] hover:to-[#00D4FF] text-[#070A12] font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.4)] cursor-pointer active:scale-95 transition-all touch-manipulation"
                title="Mở chế độ xem ảnh toàn màn hình (Full Screen Gallery)"
              >
                <Maximize2 className="w-4 h-4 stroke-[2.5]" />
                <span>Xem Full Screen ({verifiedCount} Ảnh)</span>
              </button>
            )}
          </div>
        </div>

        {/* Bộ lọc động theo Trạng thái CDN và Nhóm */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1E2D42]">
          {/* Lọc theo trạng thái VERIFIED / PENDING */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: `Tất Cả (${allArtworks.length})` },
                { id: 'verified', label: `Đã Có Ảnh CDN (${verifiedCount})` },
                { id: 'pending', label: `Chờ Nhập Binary (${pendingCount})` },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer min-h-[36px] ${
                  statusFilter === st.id
                    ? 'bg-[#00D4FF] text-[#070A12] shadow-sm shadow-cyan-500/30'
                    : 'bg-[#070A12] text-[#CBD5E1] border border-[#26384D] hover:border-[#00D4FF]/60 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Lọc theo Category động từ manifest */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'Mọi Phân Loại' },
                { id: 'core', label: `CORE (${coreCount})` },
                { id: 'outfit', label: `OUTFIT (${outfitCount})` },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer min-h-[36px] ${
                  categoryFilter === cat.id
                    ? 'bg-[#142338] text-[#00D4FF] border border-[#00D4FF]'
                    : 'bg-[#070A12]/80 text-[#94A3B8] border border-[#1E2D42] hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Lưới Artwork (VERIFIED hiển thị ảnh thật; PENDING hiển thị thẻ chờ nhập binary có chủ đích) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredArtworks.map((art) => {
          const isVerified = art.isAvailableOnDisk && Boolean(art.path)
          const isSelectedHero = selectedHeroArtwork?.id === art.id

          return (
            <Card
              key={art.id}
              variant="panel"
              className={`overflow-hidden transition-all flex flex-col justify-between ${
                isSelectedHero
                  ? 'border-[#00D4FF] bg-[#142338]/90 shadow-lg shadow-cyan-950/50'
                  : isVerified
                  ? 'border-[#26384D] bg-[#0F172A]/95 hover:border-[#00D4FF]/60'
                  : 'border-[#1E2D42] bg-[#0B111E]/90'
              }`}
            >
              <div>
                {/* Khung hiển thị thị giác */}
                <div className="relative h-56 w-full bg-[#070A12] border-b border-[#26384D] overflow-hidden flex items-center justify-center group">
                  {isVerified ? (
                    <>
                      <Image
                        src={art.path}
                        alt={art.title}
                        fill
                        referrerPolicy="no-referrer"
                        onClick={() => onOpenViewer(art)}
                        className="object-contain p-2 group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenViewer(art)
                        }}
                        aria-label={`Xem toàn màn hình ${art.title}`}
                        className="absolute bottom-2.5 right-2.5 z-10 px-3 py-2 rounded-xl bg-[#090D18]/95 hover:bg-[#00D4FF] border-2 border-[#00D4FF] text-[#00D4FF] hover:text-[#070A12] font-mono text-xs font-black uppercase tracking-wider transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center gap-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.9)] active:scale-95 touch-manipulation"
                        title="Phóng to toàn màn hình (Full Screen)"
                      >
                        <Maximize2 className="w-4 h-4 stroke-[2.5]" />
                        <span>Full Screen</span>
                      </button>
                    </>
                  ) : (
                    /* Thẻ chờ nhập binary WebP (Tuyệt đối không gắn <img> để tránh 404 hoặc lấy ảnh V1) */
                    <div className="flex flex-col items-center justify-center text-center p-5 space-y-2.5 max-w-xs">
                      <div className="w-11 h-11 rounded-xl bg-[#142338] border border-amber-500/40 flex items-center justify-center text-amber-400">
                        <FileArchive className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                        PENDING BINARY IMPORT
                      </div>
                      <p className="text-xs text-[#CBD5E1] leading-relaxed">
                        Hồ sơ nguồn R3 ({art.filename || art.id}) đã xác thực metadata & SHA256, đang chờ đợt đồng bộ file nhị phân WebP lên release CDN.
                      </p>
                      {art.sourceMetadata?.resolution && (
                        <span className="text-[11px] font-mono text-[#94A3B8]">
                          Chuẩn gốc: {art.sourceMetadata.resolution} · {art.batch || 'R3'}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Nhãn phân loại góc trái */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-[#070A12]/90 text-[#00D4FF] border border-[#26384D]">
                      {getCategoryLabel(art)}
                    </span>
                    {typeof art.order === 'number' && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#070A12]/90 text-[#CBD5E1] border border-[#1E2D42]">
                        #{String(art.order).padStart(2, '0')}
                      </span>
                    )}
                  </div>

                  {/* Nhãn trạng thái CDN góc phải */}
                  <div className="absolute top-2.5 right-2.5">
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#070A12]/90 text-[#34D399] border border-[#34D399]/40">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>VERIFIED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#070A12]/90 text-amber-300 border border-amber-500/40">
                        <Clock className="w-3 h-3" />
                        <span>PENDING</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Thông tin tác phẩm */}
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
                      {art.title}
                    </h4>
                  </div>
                  {art.filename && (
                    <div className="text-[11px] font-mono text-[#00D4FF]">
                      {art.filename}
                    </div>
                  )}
                  {art.description && (
                    <p className="text-xs sm:text-sm text-[#CBD5E1] line-clamp-2 leading-relaxed">
                      {art.description}
                    </p>
                  )}
                </CardContent>
              </div>

              {/* Thanh hành động đáy thẻ */}
              <div className="p-4 pt-0 flex flex-wrap items-center gap-2">
                {isVerified ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenViewer(art)}
                      className="flex-1 min-w-[140px] py-2.5 px-3 rounded-lg text-xs font-mono font-black uppercase tracking-wider bg-[#00D4FF] hover:bg-[#38BDF8] text-[#070A12] border border-[#00D4FF] transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] shadow-[0_0_15px_rgba(0,212,255,0.25)] active:scale-95 touch-manipulation"
                      title="Xem ảnh toàn màn hình (Full Screen)"
                    >
                      <Maximize2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Xem Full Screen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectHeroArtwork(art)}
                      className={`py-2.5 px-3 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] touch-manipulation ${
                        isSelectedHero
                          ? 'bg-[#142338] text-[#00D4FF] border-[#00D4FF]'
                          : 'bg-[#070A12] text-white border-[#26384D] hover:border-[#00D4FF]'
                      }`}
                      title="Đặt làm ảnh hiển thị trên sân khấu nhân vật"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#00D4FF]" />
                      <span>{isSelectedHero ? 'Đang Ở Sân Khấu' : 'Đặt Sân Khấu'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectedPendingArt(art)}
                      title="Xem hồ sơ kỹ thuật R3/R4"
                      aria-label="Xem hồ sơ kỹ thuật R3/R4"
                      className="p-2.5 rounded-lg bg-[#070A12] border border-[#26384D] text-[#CBD5E1] hover:text-[#00D4FF] hover:border-[#00D4FF] transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setInspectedPendingArt(art)}
                    className="w-full py-2.5 px-3 rounded-lg text-xs font-mono font-semibold bg-[#070A12] border border-[#26384D] text-[#CBD5E1] hover:text-white hover:border-amber-400/60 transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] touch-manipulation"
                  >
                    <Info className="w-4 h-4 text-amber-400" />
                    <span>Xem Hồ Sơ Nguồn R3 (Metadata & SHA256)</span>
                  </button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Modal Chi Tiết Hồ Sơ Kỹ Thuật R3/R4 */}
      {inspectedPendingArt && (
        <Dialog
          open={Boolean(inspectedPendingArt)}
          onOpenChange={() => setInspectedPendingArt(null)}
        >
          <DialogContent className="max-w-lg text-white">
            <DialogHeader>
              <div className="flex items-center gap-2 text-xs font-mono text-[#00D4FF] uppercase">
                <Layers className="w-4 h-4" />
                <span>Hồ Sơ Kỹ Thuật Artwork ({character.releaseVersion?.toUpperCase() || 'R4'})</span>
              </div>
              <DialogTitle className="text-lg font-bold text-white mt-1">
                {inspectedPendingArt.title}
              </DialogTitle>
              <DialogDescription className="text-xs font-mono text-[#CBD5E1]">
                Asset ID: {inspectedPendingArt.id} · Trạng thái CDN:{' '}
                <strong
                  className={
                    inspectedPendingArt.isAvailableOnDisk ? 'text-[#34D399]' : 'text-amber-300'
                  }
                >
                  {inspectedPendingArt.cdnStatus || 'PENDING_BINARY_IMPORT'}
                </strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-2 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-[#070A12] border border-[#26384D] space-y-2">
                <div className="text-xs font-mono font-bold uppercase text-[#00D4FF]">
                  Mô Tả Thị Giác
                </div>
                <p className="text-[#F1F5F9] leading-relaxed">
                  {inspectedPendingArt.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#070A12] border border-[#26384D]">
                  <span className="text-[#94A3B8] block">Filename</span>
                  <span className="text-white font-bold break-all">
                    {inspectedPendingArt.filename || inspectedPendingArt.id}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#070A12] border border-[#26384D]">
                  <span className="text-[#94A3B8] block">Độ phân giải gốc</span>
                  <span className="text-white font-bold">
                    {inspectedPendingArt.sourceMetadata?.resolution ||
                      (inspectedPendingArt.dimensions
                        ? `${inspectedPendingArt.dimensions.width}x${inspectedPendingArt.dimensions.height}`
                        : '1122x2000')}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#070A12] border border-[#26384D]">
                  <span className="text-[#94A3B8] block">Batch / Approval</span>
                  <span className="text-[#34D399] font-bold">
                    {inspectedPendingArt.batch || 'R3'} ·{' '}
                    {inspectedPendingArt.sourceApprovalStatus || 'APPROVED'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#070A12] border border-[#26384D]">
                  <span className="text-[#94A3B8] block">Dung lượng gốc</span>
                  <span className="text-white font-bold">
                    {inspectedPendingArt.sourceMetadata?.fileSizeBytes
                      ? `${Math.round(inspectedPendingArt.sourceMetadata.fileSizeBytes / 1024)} KB`
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {inspectedPendingArt.expectedSha256 && (
                <div className="p-3 rounded-xl bg-[#070A12] border border-[#26384D] space-y-1 font-mono text-[11px]">
                  <div className="flex items-center gap-1.5 text-[#94A3B8]">
                    <Hash className="w-3.5 h-3.5 text-[#00D4FF]" />
                    <span>Expected SHA-256 Checksum</span>
                  </div>
                  <div className="text-[#00D4FF] break-all select-all">
                    {inspectedPendingArt.expectedSha256}
                  </div>
                </div>
              )}

              {inspectedPendingArt.sourceMetadata?.notes && (
                <div className="p-3 rounded-xl bg-[#070A12]/80 border border-[#26384D] text-xs text-[#CBD5E1]">
                  <strong className="text-white">Ghi chú nguồn: </strong>
                  {inspectedPendingArt.sourceMetadata.notes}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default GalleryTab
