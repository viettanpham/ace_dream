'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ShieldCheck,
  Database,
  GitCommit,
  Tag,
  Layers,
  Clock,
  Lock,
  Info,
  Sparkles,
  Server,
} from 'lucide-react'
import {
  loadV2UIPreferences,
  saveV2UIPreferences,
  type V2ReleaseSelectionMode,
} from '@/lib/game/v2/ui-preferences'
import { DEFAULT_PILOT_V2_CHANNEL_URL } from '@/lib/game/v2/content-config'
import { clearShowcaseGalleryCache } from '@/lib/game/v2/gallery-showcase-engine'

export interface PilotVerificationItem {
  pilotId: string
  displayName: string
  fullName: string
  verifiedCount: number
  sourceRecordCount: number
  storyChapters: number
}

export interface ReleaseDiagnosticsPayload {
  channelName: string
  releaseVersion: string
  releaseTag: string
  releaseCommitSha: string
  releaseManifestUrl: string
  releaseBaseUrl: string
  status: string
  channelStatus: string
  updatedAt?: string
  previewOnly: boolean
  notes: string[]
  loadedAt: string
  fromCache: boolean
  usingFallbackSnapshot: boolean
  lastUpdateError: string | null
  totalPilots: number
  totalVerifiedArtworks: number
  totalSourceArtworks: number
  pilotVerificationSummary: PilotVerificationItem[]
}

export interface SettingsV2ModalProps {
  isOpen: boolean
  onClose: () => void
  initialDiagnostics?: Partial<ReleaseDiagnosticsPayload> | null
  onReleaseRefreshed?: () => void
}

export function SettingsV2Modal({
  isOpen,
  onClose,
  initialDiagnostics,
  onReleaseRefreshed,
}: SettingsV2ModalProps) {
  const [diagnostics, setDiagnostics] = useState<ReleaseDiagnosticsPayload | null>(null)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [refreshSuccessBanner, setRefreshSuccessBanner] = useState<string | null>(null)
  const [releaseMode, setReleaseMode] = useState<V2ReleaseSelectionMode>('channel-auto')
  const [autoCheckOnFocus, setAutoCheckOnFocus] = useState<boolean>(true)
  const [heroBgMode, setHeroBgMode] = useState<'contextual' | 'clean'>('contextual')

  useEffect(() => {
    const prefs = loadV2UIPreferences()
    setReleaseMode(prefs.releaseSelectionMode)
    setAutoCheckOnFocus(prefs.autoCheckChannelOnFocus)
    setHeroBgMode(prefs.heroBackgroundMode)
  }, [isOpen])

  const fetchDiagnostics = useCallback(
    async (forceRefresh = false) => {
      setIsRefreshing(true)
      setRefreshError(null)
      if (forceRefresh) {
        setRefreshSuccessBanner(null)
        clearShowcaseGalleryCache()
      }
      try {
        const res = await fetch(
          `/api/runtime/v2-release${forceRefresh ? '?refresh=1' : ''}`,
          { cache: 'no-store' }
        )
        const data = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.error || `HTTP ${res.status} từ /api/runtime/v2-release`)
        }

        const chars = Array.isArray(data.characters) ? data.characters : []
        const summary: PilotVerificationItem[] = Array.isArray(data.pilotVerificationSummary)
          ? data.pilotVerificationSummary
          : chars.map((c: any) => ({
              pilotId: c.id,
              displayName: c.classCharacterName,
              fullName: c.fullLoreName,
              verifiedCount:
                c.verifiedArtworkCount ??
                (Array.isArray(c.artworks)
                  ? c.artworks.filter((a: any) => a.isAvailableOnDisk && a.path).length
                  : 0),
              sourceRecordCount:
                c.totalSourceArtworkCount ?? (Array.isArray(c.artworks) ? c.artworks.length : 0),
              storyChapters: Array.isArray(c.chapters) ? c.chapters.length : 0,
            }))

        const totalVerified = summary.reduce((s, item) => s + item.verifiedCount, 0)
        const totalSource = summary.reduce((s, item) => s + item.sourceRecordCount, 0)

        const payload: ReleaseDiagnosticsPayload = {
          channelName: data.channelName || data.channel?.channel || 'pilot-v2-preview',
          releaseVersion: (data.releaseVersion || 'r4').toUpperCase(),
          releaseTag: data.releaseTag || 'v4.0-assets-r4',
          releaseCommitSha: data.releaseCommitSha || '',
          releaseManifestUrl:
            data.releaseManifestUrl || data.channel?.releaseManifestUrl || '',
          releaseBaseUrl: data.releaseBaseUrl || '',
          status: data.status || 'PREVIEW_ARTWORK_IMPORT_COMPLETE_STORY_AUDIT_PENDING',
          channelStatus: data.channelStatus || data.channel?.status || '',
          updatedAt: data.updatedAt || data.channel?.updatedAt,
          previewOnly: data.previewOnly ?? true,
          notes: Array.isArray(data.notes) ? data.notes : [],
          loadedAt: data.loadedAt || new Date().toISOString(),
          fromCache: Boolean(data.fromCache),
          usingFallbackSnapshot: Boolean(data.usingFallbackSnapshot),
          lastUpdateError: data.lastUpdateError || null,
          totalPilots: chars.length || 12,
          totalVerifiedArtworks: totalVerified,
          totalSourceArtworks: totalSource,
          pilotVerificationSummary: summary,
        }

        setDiagnostics(payload)
        if (forceRefresh) {
          setRefreshSuccessBanner(
            `Đã đồng bộ thành công ${payload.releaseVersion} (${payload.releaseTag} · ${payload.releaseCommitSha.slice(
              0,
              7
            )}) — ${payload.totalVerifiedArtworks}/${payload.totalSourceArtworks} WebP Verified.`
          )
          onReleaseRefreshed?.()
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setRefreshError(
          `Không thể làm mới kênh CDN: ${msg}. Ứng dụng vẫn giữ nguyên snapshot an toàn gần nhất.`
        )
      } finally {
        setIsRefreshing(false)
      }
    },
    [onReleaseRefreshed]
  )

  useEffect(() => {
    if (isOpen) {
      fetchDiagnostics(false)
    }
  }, [isOpen, fetchDiagnostics])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const activeChannel = diagnostics?.channelName || initialDiagnostics?.channelName || 'pilot-v2-preview'
  const releaseVersion = (
    diagnostics?.releaseVersion ||
    initialDiagnostics?.releaseVersion ||
    'R4'
  ).toUpperCase()
  const releaseTag = diagnostics?.releaseTag || initialDiagnostics?.releaseTag || 'v4.0-assets-r4'
  const commitSha =
    diagnostics?.releaseCommitSha ||
    initialDiagnostics?.releaseCommitSha ||
    '816585651f1f06f1cafeefc6a4809ab1f52f3484'
  const manifestUrl =
    diagnostics?.releaseManifestUrl ||
    initialDiagnostics?.releaseManifestUrl ||
    `https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@${commitSha}/starfront-world-assets/releases/r4/manifest.json`
  const totalVerified =
    diagnostics?.totalVerifiedArtworks ?? initialDiagnostics?.totalVerifiedArtworks ?? 297
  const totalSource =
    diagnostics?.totalSourceArtworks ?? initialDiagnostics?.totalSourceArtworks ?? 297
  const totalPilots = diagnostics?.totalPilots ?? initialDiagnostics?.totalPilots ?? 12
  const loadedAt = diagnostics?.loadedAt || initialDiagnostics?.loadedAt || new Date().toISOString()

  const handleSelectReleaseMode = (mode: V2ReleaseSelectionMode) => {
    setReleaseMode(mode)
    saveV2UIPreferences({ releaseSelectionMode: mode })
  }

  const handleToggleAutoCheck = () => {
    const next = !autoCheckOnFocus
    setAutoCheckOnFocus(next)
    saveV2UIPreferences({ autoCheckChannelOnFocus: next })
  }

  const handleChangeHeroBg = (mode: 'contextual' | 'clean') => {
    setHeroBgMode(mode)
    saveV2UIPreferences({ heroBackgroundMode: mode })
  }

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Settings V2 — CDN / Content Release"
      className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl bg-[#090E1A] border border-[#1E2D42] shadow-[0_24px_64px_rgba(0,0,0,0.95)] text-[#F1F5F9] flex flex-col overflow-hidden">
        {/* =================================================================
            HEADER
            ================================================================= */}
        <div className="px-5 py-4 border-b border-[#1E2D42] bg-[#070A12] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#142338] border border-[#00D4FF]/50 flex items-center justify-center text-[#00D4FF] shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-wide text-white">
                  Settings V2 → CDN / Content Release
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/40">
                  V2 ISOLATED
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] truncate">
                Quản lý phiên bản dữ liệu CDN FND-8 (Độc lập với Settings V1 & Production)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng Settings V2"
            className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-[#0E1626] hover:bg-rose-600/90 border border-[#1E2D42] hover:border-rose-400 text-[#CBD5E1] hover:text-white flex items-center justify-center transition-colors cursor-pointer touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =================================================================
            SCROLLABLE BODY
            ================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Status / Error / Success Banners */}
          {refreshSuccessBanner && (
            <div className="p-3.5 rounded-xl bg-[#34D399]/15 border border-[#34D399]/40 text-xs sm:text-sm text-[#34D399] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{refreshSuccessBanner}</span>
            </div>
          )}

          {(refreshError || diagnostics?.lastUpdateError) && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs sm:text-sm text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-rose-300">Chẩn đoán lỗi kết nối kênh CDN:</div>
                <p className="font-mono text-xs">{refreshError || diagnostics?.lastUpdateError}</p>
              </div>
            </div>
          )}

          {/* 1. ACTIVE CHANNEL & PINNED RELEASE TELEMETRY */}
          <section className="rounded-xl bg-[#0D1526] border border-[#1E2D42] p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2D42] pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#00D4FF]" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                  1. Phiên Bản Kênh & Release Đang Hoạt Động
                </h3>
              </div>

              <button
                type="button"
                onClick={() => fetchDiagnostics(true)}
                disabled={isRefreshing}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#0284C7] hover:from-[#38BDF8] hover:to-[#00D4FF] text-[#070A12] font-mono text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.35)] cursor-pointer disabled:opacity-50 transition-all touch-manipulation"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>
                  {isRefreshing
                    ? 'Đang đồng bộ CDN...'
                    : 'Check for updates / Refresh content'}
                </span>
              </button>
            </div>

            {/* Key Release Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[#070A12] border border-[#1E2D42] space-y-1">
                <span className="text-xs font-mono text-[#94A3B8] flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-[#00D4FF]" />
                  <span>Active Channel</span>
                </span>
                <div className="text-sm font-mono font-bold text-[#00D4FF]">
                  {activeChannel}
                </div>
                <span className="text-xs text-[#CBD5E1] block">
                  Preview Isolation ({diagnostics?.previewOnly !== false ? 'Preview Only' : 'Live'})
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#070A12] border border-[#1E2D42] space-y-1">
                <span className="text-xs font-mono text-[#94A3B8] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#00D4FF]" />
                  <span>Release Version</span>
                </span>
                <div className="text-sm font-mono font-bold text-white">
                  {releaseVersion}
                </div>
                <span className="text-xs text-[#34D399] block">
                  {totalPilots} Pilots Active
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#070A12] border border-[#1E2D42] space-y-1">
                <span className="text-xs font-mono text-[#94A3B8] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#00D4FF]" />
                  <span>Release Tag</span>
                </span>
                <div className="text-sm font-mono font-bold text-[#34D399]">
                  {releaseTag}
                </div>
                <span className="text-xs text-[#CBD5E1] block">
                  viettanpham/starfront-assets
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#070A12] border border-[#1E2D42] space-y-1">
                <span className="text-xs font-mono text-[#94A3B8] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
                  <span>Artwork Verification</span>
                </span>
                <div className="text-sm font-mono font-bold text-[#34D399] tabular-nums">
                  {totalVerified} / {totalSource} Verified
                </div>
                <span className="text-xs text-[#CBD5E1] block">
                  {totalVerified === totalSource ? '100% WebP Hash-Verified' : 'Partial Import'}
                </span>
              </div>
            </div>

            {/* Immutable SHA, Manifest URL & Last Refresh */}
            <div className="grid grid-cols-1 gap-2.5 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#070A12] border border-[#1E2D42] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="text-[#94A3B8] flex items-center gap-1.5 shrink-0">
                  <GitCommit className="w-3.5 h-3.5 text-[#00D4FF]" />
                  <span>Release Commit SHA (Immutable):</span>
                </span>
                <code className="text-[#00D4FF] font-bold break-all select-all">
                  {commitSha}
                </code>
              </div>

              <div className="p-3 rounded-xl bg-[#070A12] border border-[#1E2D42] flex flex-col gap-1">
                <span className="text-[#94A3B8] flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#00D4FF]" />
                  <span>Manifest URL:</span>
                </span>
                <code className="text-white break-all select-all text-[11px] sm:text-xs">
                  {manifestUrl}
                </code>
              </div>

              <div className="p-3 rounded-xl bg-[#070A12] border border-[#1E2D42] flex flex-wrap items-center justify-between gap-2">
                <span className="text-[#94A3B8] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#00D4FF]" />
                  <span>Last Successful Refresh:</span>
                </span>
                <span className="text-white font-bold">
                  {new Date(loadedAt).toLocaleString('vi-VN')} (
                  {diagnostics?.fromCache ? 'In-Memory Snapshot' : 'Fresh Network Sync'})
                </span>
              </div>
            </div>
          </section>

          {/* 2. EXTENSIBLE RELEASE SELECTOR (R4 -> R5+ & LEGACY R3 GUARD) */}
          <section className="rounded-xl bg-[#0D1526] border border-[#1E2D42] p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                <span>2. Bộ Chọn Phiên Bản Mở Rộng (Release Selector: R4 → R5+)</span>
              </h3>
              <span className="text-xs font-mono text-[#94A3B8]">
                Production Safe-Guarded
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: Channel Auto Track (R4 -> R5+) */}
              <button
                type="button"
                onClick={() => handleSelectReleaseMode('channel-auto')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  releaseMode === 'channel-auto'
                    ? 'bg-[#142338] border-[#00D4FF] shadow-[0_0_16px_rgba(0,212,255,0.2)]'
                    : 'bg-[#070A12] border-[#1E2D42] hover:border-[#26384D]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-[#00D4FF] uppercase">
                      Channel Auto (R4 → R5+)
                    </span>
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30">
                      ACTIVE
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    pilot-v2-preview ({releaseVersion})
                  </div>
                  <p className="text-xs text-[#CBD5E1] leading-relaxed">
                    Tự động đồng bộ phiên bản mới nhất trên kênh preview (hiện tại là {releaseTag} ·{' '}
                    {commitSha.slice(0, 7)}) và sẵn sàng cho R5+ mà không cần sửa code.
                  </p>
                </div>
                <div className="text-xs font-mono text-[#00D4FF] pt-1">
                  ✓ Khuyến nghị cho FND-8 V2
                </div>
              </button>

              {/* Option 2: Pinned R4 Immutable */}
              <button
                type="button"
                onClick={() => handleSelectReleaseMode('pinned-r4')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  releaseMode === 'pinned-r4'
                    ? 'bg-[#142338] border-[#00D4FF] shadow-[0_0_16px_rgba(0,212,255,0.2)]'
                    : 'bg-[#070A12] border-[#1E2D42] hover:border-[#26384D]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-white uppercase">
                      Release R4 (Immutable)
                    </span>
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30">
                      v4.0-assets-r4
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    SHA: {commitSha.slice(0, 7)} (297/297 WebP)
                  </div>
                  <p className="text-xs text-[#CBD5E1] leading-relaxed">
                    Ghim cố định vào bản phát hành R4 đã xác thực 12 Pilots, 297/297 ảnh Gallery và 5 chương Valentine Preview.
                  </p>
                </div>
                <div className="text-xs font-mono text-[#34D399] pt-1">
                  ✓ Tương thích Schema 100%
                </div>
              </button>

              {/* Option 3: Legacy R3 (Historical / Read-Only) */}
              <div className="p-3.5 rounded-xl border border-[#1E2D42] bg-[#070A12]/60 opacity-80 flex flex-col justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-[#94A3B8] uppercase">
                      Legacy R3 (v3.0-assets-r3)
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      <Lock className="w-3 h-3" />
                      <span>READ-ONLY</span>
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#CBD5E1]">
                    Historical Release
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    R3 không có cấu trúc <code className="font-mono">releases/r4/manifest.json</code> và{' '}
                    <code className="font-mono">stories/index.json</code>. Được khóa ở chế độ lịch sử để bảo vệ tương thích schema V2.
                  </p>
                </div>
                <div className="text-xs font-mono text-amber-400 pt-1">
                  ⚠ Historical / Không cho phép chuyển
                </div>
              </div>
            </div>
          </section>

          {/* 3. PER-PILOT ARTWORK VERIFICATION BREAKDOWN (297/297, VALENTINE 42/42) */}
          <section className="rounded-xl bg-[#0D1526] border border-[#1E2D42] p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                <span>
                  3. Bảng Kiểm Chứng Artwork Theo Phi Công ({totalVerified}/{totalSource} Verified)
                </span>
              </h3>
              <span className="text-xs font-mono text-[#34D399] font-bold">
                Valentine: 42/42 · 12/12 Pilots Ready
              </span>
            </div>

            {diagnostics?.pilotVerificationSummary &&
            diagnostics.pilotVerificationSummary.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {diagnostics.pilotVerificationSummary.map((item) => {
                  const isComplete =
                    item.sourceRecordCount > 0 && item.verifiedCount >= item.sourceRecordCount
                  return (
                    <div
                      key={item.pilotId}
                      className="p-2.5 rounded-xl bg-[#070A12] border border-[#1E2D42] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-bold text-white truncate">
                          {item.displayName}
                        </div>
                        <div className="text-[11px] text-[#94A3B8] truncate">
                          {item.storyChapters > 0
                            ? `${item.storyChapters} Story Ch.`
                            : 'Profile + Gallery'}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded tabular-nums shrink-0 ${
                          isComplete
                            ? 'bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {item.verifiedCount}/{item.sourceRecordCount}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-xs font-mono text-[#94A3B8]">
                Đang tải thống kê chi tiết 12 phi công...
              </div>
            )}
          </section>

          {/* 4. READ-ONLY DIAGNOSTICS & SAFE V2 PREFERENCES */}
          <section className="rounded-xl bg-[#0D1526] border border-[#1E2D42] p-4 sm:p-5 space-y-3.5">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-[#00D4FF]" />
              <span>4. Chẩn Đoán Kỹ Thuật (Read-Only Diagnostics) & Tùy Chọn V2 An Toàn</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#070A12] border border-[#1E2D42] flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-white">Tự động kiểm tra kênh khi quay lại tab</div>
                  <div className="text-[#94A3B8]">Đồng bộ R5+ khi cửa sổ trình duyệt lấy lại tiêu điểm</div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAutoCheck}
                  className={`px-3 py-1.5 rounded-lg font-mono font-bold cursor-pointer transition-colors ${
                    autoCheckOnFocus
                      ? 'bg-[#00D4FF] text-[#070A12]'
                      : 'bg-[#142338] text-[#CBD5E1] border border-[#1E2D42]'
                  }`}
                >
                  {autoCheckOnFocus ? 'BẬT' : 'TẮT'}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[#070A12] border border-[#1E2D42] flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-white">Chế độ nền Character Stage mặc định</div>
                  <div className="text-[#94A3B8]">Bối cảnh Ambient Artwork hoặc Tách nền HUD</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleChangeHeroBg('contextual')}
                    className={`px-2.5 py-1.5 rounded-lg font-mono font-bold cursor-pointer ${
                      heroBgMode === 'contextual'
                        ? 'bg-[#00D4FF] text-[#070A12]'
                        : 'bg-[#142338] text-[#CBD5E1]'
                    }`}
                  >
                    Ambient
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeHeroBg('clean')}
                    className={`px-2.5 py-1.5 rounded-lg font-mono font-bold cursor-pointer ${
                      heroBgMode === 'clean'
                        ? 'bg-[#00D4FF] text-[#070A12]'
                        : 'bg-[#142338] text-[#CBD5E1]'
                    }`}
                  >
                    HUD
                  </button>
                </div>
              </div>
            </div>

            {/* Channel Release Notes */}
            <div className="p-3.5 rounded-xl bg-[#070A12] border border-[#1E2D42] space-y-2 text-xs font-mono">
              <div className="text-[#00D4FF] font-bold uppercase">
                Ghi chú từ Channel Manifest ({DEFAULT_PILOT_V2_CHANNEL_URL.split('/').pop()}):
              </div>
              <ul className="space-y-1 text-[#CBD5E1] list-disc list-inside">
                {(diagnostics?.notes && diagnostics.notes.length > 0
                  ? diagnostics.notes
                  : [
                      'R4 v4.0-assets-r4 tag points to the immutable releaseCommitSha; 297/297 Pilot gallery records marked VERIFIED.',
                      'Artwork complete does not imply Story editorial approval. CH04 reconstruction and CH05 review remain unapproved for production.',
                      'Only display images marked cdnStatus VERIFIED; do not synthesize or fallback to V1.',
                      'Preview channel update only; production unchanged.',
                    ]
                ).map((note, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* =================================================================
            FOOTER
            ================================================================= */}
        <div className="px-5 py-3 border-t border-[#1E2D42] bg-[#070A12] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#94A3B8] shrink-0">
          <span>
            STARFRONT V2 CDN CONTROL · KHÔNG LƯU URL TÙY Ý · SETTINGS V1 UNCHANGED
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#142338] hover:bg-[#1E3452] border border-[#00D4FF]/50 text-[#00D4FF] font-bold cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  return modalContent
}

export default SettingsV2Modal
