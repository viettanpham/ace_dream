'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  CharacterProfileV2,
  GalleryArtwork,
} from '@/lib/game/v2/character-profile-data'
import { DesktopView, PilotProfileTabId, RoleFilterId } from './desktop-view'
import { MobileArtView } from './mobile-art-view'
import { MobileInfoView } from './mobile-info-view'
import { ArtViewer } from '@/components/game/v2/ui'
import {
  loadV2UIPreferences,
  saveV2UIPreferences,
} from '@/lib/game/v2/ui-preferences'
import {
  Image as ImageIcon,
  FileText,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Loader2,
} from 'lucide-react'

interface ReleaseStatusInfo {
  releaseVersion: string
  releaseCommitSha: string
  status: string
  loadedAt: string
  usingFallbackSnapshot: boolean
  lastUpdateError: string | null
  totalPilots: number
  totalVerifiedArtworks: number
  totalSourceArtworks: number
}

export interface PilotProfileV2Props {
  onNavigateSection?: (section: any, forceMission?: any) => void
  initialPilotId?: string
}

export function PilotProfileV2(_props?: PilotProfileV2Props) {
  // Dynamic roster loaded from CDN channel -> pinned release manifest
  const [rosterCharacters, setRosterCharacters] = useState<CharacterProfileV2[]>([])
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('valentine')
  const [activeTab, setActiveTab] = useState<PilotProfileTabId>('overview')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<RoleFilterId>('all')
  const [selectedHeroArtwork, setSelectedHeroArtwork] = useState<GalleryArtwork | null>(null)
  const [viewerArtwork, setViewerArtwork] = useState<GalleryArtwork | null>(null)

  const [releaseInfo, setReleaseInfo] = useState<ReleaseStatusInfo | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true)
  const [isRefreshingChannel, setIsRefreshingChannel] = useState<boolean>(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Persistent UI states
  const [isRosterCollapsed, setIsRosterCollapsed] = useState<boolean>(false)
  const [heroBackgroundMode, setHeroBackgroundMode] = useState<'contextual' | 'clean'>('contextual')
  const [mobileViewMode, setMobileViewMode] = useState<'art' | 'info'>('art')

  useEffect(() => {
    const prefs = loadV2UIPreferences()
    setIsRosterCollapsed(prefs.rosterCollapsed)
    setHeroBackgroundMode(prefs.heroBackgroundMode)
    setMobileViewMode(prefs.mobilePreferredMode)
  }, [])

  // Fetch release snapshot from /api/runtime/v2-release
  const fetchReleaseSnapshot = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshingChannel(true)
    }
    try {
      const res = await fetch(
        `/api/runtime/v2-release${forceRefresh ? '?refresh=1' : ''}`,
        { cache: 'no-store' }
      )
      const data = await res.json()
      if (!res.ok || !data.success || !Array.isArray(data.characters)) {
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      const chars: CharacterProfileV2[] = data.characters
      setRosterCharacters(chars)

      const totalVerified = chars.reduce(
        (sum, c) =>
          sum +
          (c.verifiedArtworkCount ??
            c.artworks.filter((a) => a.isAvailableOnDisk && Boolean(a.path)).length),
        0
      )
      const totalSource = chars.reduce(
        (sum, c) => sum + (c.totalSourceArtworkCount ?? c.artworks.length),
        0
      )

      setReleaseInfo({
        releaseVersion: data.releaseVersion || 'r4',
        releaseCommitSha: data.releaseCommitSha || '',
        status: data.status || 'PREVIEW_PARTIAL_ARTWORK_IMPORT',
        loadedAt: data.loadedAt || new Date().toISOString(),
        usingFallbackSnapshot: Boolean(data.usingFallbackSnapshot),
        lastUpdateError: data.lastUpdateError || null,
        totalPilots: chars.length,
        totalVerifiedArtworks: totalVerified,
        totalSourceArtworks: totalSource,
      })
      setLoadError(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setLoadError(msg)
    } finally {
      setIsInitialLoading(false)
      setIsRefreshingChannel(false)
    }
  }, [])

  // Initial load on startup
  useEffect(() => {
    fetchReleaseSnapshot(false)
  }, [fetchReleaseSnapshot])

  // Refresh channel automatically when user returns to tab/window
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchReleaseSnapshot(false)
      }
    }
    window.addEventListener('focus', handleVisibilityOrFocus)
    document.addEventListener('visibilitychange', handleVisibilityOrFocus)
    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus)
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
    }
  }, [fetchReleaseSnapshot])

  const selectedCharacter = useMemo(() => {
    if (rosterCharacters.length === 0) return null
    return (
      rosterCharacters.find((c) => c.id === selectedCharacterId) ||
      rosterCharacters[0]
    )
  }, [rosterCharacters, selectedCharacterId])

  // Keep selectedHeroArtwork synced with current character's verified artworks
  useEffect(() => {
    if (!selectedCharacter) return
    setSelectedHeroArtwork((prev) => {
      if (prev) {
        const updatedMatch = selectedCharacter.artworks.find(
          (a) => a.id === prev.id && a.isAvailableOnDisk && Boolean(a.path)
        )
        if (updatedMatch) return updatedMatch
      }
      const firstVerified =
        selectedCharacter.artworks.find(
          (a) =>
            a.isAvailableOnDisk &&
            Boolean(a.path) &&
            (a.filename || '').toLowerCase().includes('-fullbody')
        ) ||
        selectedCharacter.artworks.find(
          (a) => a.isAvailableOnDisk && Boolean(a.path)
        ) ||
        null
      return firstVerified
    })
  }, [selectedCharacter])

  const filteredCharacters = useMemo(() => {
    return rosterCharacters.filter((char) => {
      const matchesRole = roleFilter === 'all' || char.roleCategory === roleFilter
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !q ||
        char.classCharacterName.toLowerCase().includes(q) ||
        char.fullLoreName.toLowerCase().includes(q) ||
        char.callsign.toLowerCase().includes(q) ||
        char.role.toLowerCase().includes(q) ||
        char.tags.some((t) => t.toLowerCase().includes(q))

      return matchesRole && matchesSearch
    })
  }, [rosterCharacters, roleFilter, searchQuery])

  const handleSelectCharacter = (char: CharacterProfileV2) => {
    setSelectedCharacterId(char.id)
    const defaultHero =
      char.artworks.find(
        (a) =>
          a.isAvailableOnDisk &&
          Boolean(a.path) &&
          (a.filename || '').toLowerCase().includes('-fullbody')
      ) ||
      char.artworks.find((a) => a.isAvailableOnDisk && Boolean(a.path)) ||
      null
    setSelectedHeroArtwork(defaultHero)
  }

  const handleToggleRosterCollapse = useCallback(() => {
    setIsRosterCollapsed((prev) => {
      const next = !prev
      saveV2UIPreferences({ rosterCollapsed: next })
      return next
    })
  }, [])

  const handleChangeHeroBackgroundMode = (mode: 'contextual' | 'clean') => {
    setHeroBackgroundMode(mode)
    saveV2UIPreferences({ heroBackgroundMode: mode })
  }

  const handleChangeMobileViewMode = (mode: 'art' | 'info') => {
    setMobileViewMode(mode)
    saveV2UIPreferences({ mobilePreferredMode: mode })
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        handleToggleRosterCollapse()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleToggleRosterCollapse])

  // Fullscreen viewer navigation strictly over VERIFIED artworks
  const verifiedArtworks = useMemo(() => {
    if (!selectedCharacter) return []
    return selectedCharacter.artworks.filter(
      (a) => a.isAvailableOnDisk && Boolean(a.path)
    )
  }, [selectedCharacter])

  const viewerIndex = viewerArtwork
    ? verifiedArtworks.findIndex((a) => a.id === viewerArtwork.id)
    : -1

  const handleViewerPrev = () => {
    if (verifiedArtworks.length <= 1 || viewerIndex < 0) return
    const nextIdx = (viewerIndex - 1 + verifiedArtworks.length) % verifiedArtworks.length
    const nextArt = verifiedArtworks[nextIdx]
    setViewerArtwork(nextArt)
    setSelectedHeroArtwork(nextArt)
  }

  const handleViewerNext = () => {
    if (verifiedArtworks.length <= 1 || viewerIndex < 0) return
    const nextIdx = (viewerIndex + 1) % verifiedArtworks.length
    const nextArt = verifiedArtworks[nextIdx]
    setViewerArtwork(nextArt)
    setSelectedHeroArtwork(nextArt)
  }

  if (isInitialLoading && !selectedCharacter) {
    return (
      <div className="flex-1 h-full min-h-[75vh] bg-[#070A12] text-[#F1F5F9] flex flex-col items-center justify-center gap-3 p-6">
        <Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" />
        <div className="text-sm font-mono font-bold text-white uppercase tracking-wider">
          Đang đồng bộ kênh CDN R4/R5...
        </div>
        <p className="text-xs text-[#CBD5E1] font-mono">
          pilot-v2-preview.json → pinned release manifest
        </p>
      </div>
    )
  }

  if (!selectedCharacter) {
    return (
      <div className="flex-1 h-full min-h-[75vh] bg-[#070A12] text-[#F1F5F9] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-400" />
        <div className="text-base font-bold text-white">
          Không thể kết nối kênh dữ liệu CDN
        </div>
        {loadError && (
          <p className="text-xs font-mono text-rose-300 max-w-md">{loadError}</p>
        )}
        <button
          type="button"
          onClick={() => fetchReleaseSnapshot(true)}
          className="px-4 py-2.5 rounded-xl bg-[#00D4FF] text-[#070A12] font-mono text-xs font-bold cursor-pointer"
        >
          Thử Kết Nối Lại Kênh CDN
        </button>
      </div>
    )
  }

  return (
    <div className="sf-v2-root flex-1 h-full min-h-0 bg-[#070A12] text-[#F1F5F9] flex flex-col overflow-hidden">
      {/* =====================================================================
          THANH TRẠNG THÁI KÊNH CDN & KIỂM TRA CẬP NHẬT RELEASE (R4 -> R5+)
          ===================================================================== */}
      <div className="shrink-0 bg-[#090E1A] border-b border-[#1E2D42] px-3 sm:px-5 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/40 font-bold">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>
              CHANNEL: {releaseInfo?.releaseVersion.toUpperCase() || 'R4'} ·{' '}
              {(releaseInfo?.releaseCommitSha || '').slice(0, 7) || '3a3a4f2'}
            </span>
          </span>

          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>
              {releaseInfo?.totalPilots || rosterCharacters.length} Pilots ·{' '}
              {releaseInfo?.totalVerifiedArtworks ?? 50}/
              {releaseInfo?.totalSourceArtworks ?? 297} WebP Verified
            </span>
          </span>

          {releaseInfo?.usingFallbackSnapshot && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <AlertTriangle className="w-3 h-3" />
              <span>Đang giữ bản ổn định gần nhất</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchReleaseSnapshot(true)}
            disabled={isRefreshingChannel}
            className="px-2.5 py-1 rounded-lg bg-[#142338] hover:bg-[#1E3452] border border-[#00D4FF]/50 text-[#00D4FF] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Kiểm tra kênh pilot-v2-preview.json để nạp release mới (R5+)"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshingChannel ? 'animate-spin' : ''}`}
            />
            <span>{isRefreshingChannel ? 'Đang kiểm tra...' : 'Kiểm tra cập nhật'}</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          MOBILE SUB-HEADER: PAIRED VIEW SWITCHER (ART VIEW | INFO VIEW)
          ===================================================================== */}
      <div className="md:hidden shrink-0 bg-[#0B111E] border-b border-[#1E2D42] px-3 py-2 flex items-center justify-between gap-2">
        <div className="text-xs font-mono font-bold text-[#CBD5E1] truncate">
          PHI CÔNG:{' '}
          <span className="text-[#00D4FF]">{selectedCharacter.classCharacterName}</span>
        </div>

        <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-[#070A12] border border-[#1E2D42] shrink-0">
          <button
            type="button"
            onClick={() => handleChangeMobileViewMode('art')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px] ${
              mobileViewMode === 'art'
                ? 'bg-[#142338] text-[#00D4FF] border border-[#00D4FF]/50'
                : 'text-[#CBD5E1]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>ART</span>
          </button>
          <button
            type="button"
            onClick={() => handleChangeMobileViewMode('info')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px] ${
              mobileViewMode === 'info'
                ? 'bg-[#142338] text-[#00D4FF] border border-[#00D4FF]/50'
                : 'text-[#CBD5E1]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>INFO</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          1. DESKTOP VIEW (>= 768px)
          ===================================================================== */}
      <DesktopView
        characters={
          filteredCharacters.length > 0 ? filteredCharacters : rosterCharacters
        }
        selectedCharacter={selectedCharacter}
        onSelectCharacter={handleSelectCharacter}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        selectedHeroArtwork={selectedHeroArtwork}
        onSelectHeroArtwork={setSelectedHeroArtwork}
        onOpenViewer={(art) => {
          if (art.isAvailableOnDisk && art.path) {
            setViewerArtwork(art)
          }
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        isRosterCollapsed={isRosterCollapsed}
        onToggleRosterCollapse={handleToggleRosterCollapse}
        heroBackgroundMode={heroBackgroundMode}
        onChangeHeroBackgroundMode={handleChangeHeroBackgroundMode}
      />

      {/* =====================================================================
          2. MOBILE PAIRED VIEWS (< 768px)
          ===================================================================== */}
      {mobileViewMode === 'art' ? (
        <MobileArtView
          characters={rosterCharacters}
          selectedCharacter={selectedCharacter}
          onSelectCharacter={handleSelectCharacter}
          selectedHeroArtwork={selectedHeroArtwork}
          onOpenViewer={(art) => {
            if (art.isAvailableOnDisk && art.path) {
              setViewerArtwork(art)
            }
          }}
          onSwitchToInfoView={() => handleChangeMobileViewMode('info')}
          heroBackgroundMode={heroBackgroundMode}
          onChangeHeroBackgroundMode={handleChangeHeroBackgroundMode}
        />
      ) : (
        <MobileInfoView
          characters={rosterCharacters}
          selectedCharacter={selectedCharacter}
          onSelectCharacter={handleSelectCharacter}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          selectedHeroArtwork={selectedHeroArtwork}
          onSelectHeroArtwork={setSelectedHeroArtwork}
          onOpenViewer={(art) => {
            if (art.isAvailableOnDisk && art.path) {
              setViewerArtwork(art)
            }
          }}
          onSwitchToArtView={() => handleChangeMobileViewMode('art')}
        />
      )}

      {/* =====================================================================
          3. FULLSCREEN ART VIEWER (Strictly verified CDN artworks only)
          ===================================================================== */}
      <ArtViewer
        isOpen={Boolean(viewerArtwork)}
        onClose={() => setViewerArtwork(null)}
        imageSrc={viewerArtwork?.path || selectedCharacter.fullbodyAssetPath}
        imageAlt={viewerArtwork?.title || selectedCharacter.classCharacterName}
        title={viewerArtwork?.title || selectedCharacter.classCharacterName}
        subtitle={`${selectedCharacter.fullLoreName} // ${selectedCharacter.role}`}
        category={viewerArtwork?.category || 'base'}
        description={viewerArtwork?.description || selectedCharacter.shortDescription}
        tags={selectedCharacter.tags}
        isAvailableOnDisk={viewerArtwork?.isAvailableOnDisk ?? true}
        hasPrev={verifiedArtworks.length > 1}
        hasNext={verifiedArtworks.length > 1}
        onPrev={handleViewerPrev}
        onNext={handleViewerNext}
        currentIndex={viewerIndex >= 0 ? viewerIndex + 1 : 1}
        totalCount={verifiedArtworks.length}
        artworks={verifiedArtworks}
        currentPilotId={selectedCharacter.id}
        currentPilotName={selectedCharacter.classCharacterName}
        currentPilotCallsign={selectedCharacter.callsign}
        onSelectArtwork={(art, pId) => {
          if (pId && pId !== selectedCharacter.id) {
            const targetPilot = rosterCharacters.find((c) => c.id === pId)
            if (targetPilot) {
              setSelectedCharacterId(targetPilot.id)
            }
          }
          const matched = verifiedArtworks.find(
            (a) => a.id === art.assetId || a.path === art.path
          )
          if (matched) {
            setViewerArtwork(matched)
            setSelectedHeroArtwork(matched)
          }
        }}
      />
    </div>
  )
}

export default PilotProfileV2
