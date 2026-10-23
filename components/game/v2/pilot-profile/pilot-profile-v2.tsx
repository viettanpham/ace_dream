'use client'

import React, { useState, useEffect } from 'react'
import {
  V2_ROSTER_CHARACTERS,
  CharacterProfileV2,
  GalleryArtwork,
} from '@/lib/game/v2/character-profile-data'
import { DesktopView } from './desktop-view'
import { MobileArtView } from './mobile-art-view'
import { MobileInfoView } from './mobile-info-view'
import { ArtViewer } from '@/components/game/v2/ui'

export interface PilotProfileV2Props {
  initialPilotId?: string
  onNavigateSection?: (section: string) => void
}

/**
 * STARFRONT WORLD V2 — CHARACTER CATEGORY / PILOT PROFILE V2 (FND-8 / 8.2.3.E.0)
 * 
 * Rebuilt & Hotfixed matching 100% of the approved Desktop and Mobile concepts:
 * - Desktop: 3-column layout (Roster, Center Showcase with 2 symmetrical background controls, Right 4-tab dossier).
 * - Mobile: Dedicated Paired States (Art View with single source of truth carousel & Info View with high-contrast UI).
 * - Fullscreen Viewer: Contextual artwork synchronization (9 verified artworks in Gallery = exact 01/09 in viewer), bottom sheet info panel.
 */
export function PilotProfileV2({
  initialPilotId = 'valentine',
  onNavigateSection,
}: PilotProfileV2Props) {
  // Active Pilot State (default to Valentine)
  const [activePilotId, setActivePilotId] = useState<string>(initialPilotId)
  
  // Background Mode: 'standard' (Elysia Station) vs 'tactical' (Radar HUD)
  const [backgroundMode, setBackgroundMode] = useState<'standard' | 'tactical'>('standard')

  // Mobile Paired View State: 'art' (Artwork Full View) vs 'info' (Dossier & Story)
  const [mobileMode, setMobileMode] = useState<'art' | 'info'>('art')

  // Active Tab across Profile: 'overview' | 'story' | 'gear' | 'gallery'
  const [activeTab, setActiveTab] = useState<string>('overview')

  // Responsive Viewport Detection
  const [isDesktop, setIsDesktop] = useState<boolean>(true)

  // Art Viewer Modal State
  const [viewerArtwork, setViewerArtwork] = useState<GalleryArtwork | null>(null)
  const [viewerContextList, setViewerContextList] = useState<GalleryArtwork[] | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false)

  // Viewport resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Find active pilot data
  const activeCharacter: CharacterProfileV2 =
    V2_ROSTER_CHARACTERS.find((c) => c.id === activePilotId) || V2_ROSTER_CHARACTERS[0]

  // Reset viewer context when pilot changes
  useEffect(() => {
    setViewerContextList(null)
  }, [activePilotId])

  // Pilot Navigation Helpers
  const handlePrevPilot = () => {
    const currentIndex = V2_ROSTER_CHARACTERS.findIndex((c) => c.id === activeCharacter.id)
    const prevIndex = (currentIndex - 1 + V2_ROSTER_CHARACTERS.length) % V2_ROSTER_CHARACTERS.length
    setActivePilotId(V2_ROSTER_CHARACTERS[prevIndex].id)
  }

  const handleNextPilot = () => {
    const currentIndex = V2_ROSTER_CHARACTERS.findIndex((c) => c.id === activeCharacter.id)
    const nextIndex = (currentIndex + 1) % V2_ROSTER_CHARACTERS.length
    setActivePilotId(V2_ROSTER_CHARACTERS[nextIndex].id)
  }

  // Open Art Viewer with contextual list (Khắc phục lỗi đếm 9 vs 13)
  const handleOpenArtViewer = (art?: GalleryArtwork, contextList?: GalleryArtwork[]) => {
    // 1. Xác định tập hợp tranh cho phiên xem Viewer
    let targetList: GalleryArtwork[] = []
    if (contextList && contextList.length > 0) {
      targetList = contextList
    } else {
      // Mặc định lấy danh sách tranh khả dụng (verified)
      const verifiedOnly = activeCharacter.artworks.filter((a) => a.isAvailableOnDisk)
      targetList = verifiedOnly.length > 0 ? verifiedOnly : activeCharacter.artworks
    }
    setViewerContextList(targetList)

    // 2. Xác định tác phẩm ban đầu
    if (art) {
      setViewerArtwork(art)
    } else {
      // Ưu tiên tác phẩm đầu tiên trong danh sách ngữ cảnh
      if (targetList.length > 0) {
        setViewerArtwork(targetList[0])
      } else {
        const isVerifiedOnDisk = [
          'valentine',
          'marcus',
          'alviss',
          'eric',
          'victor',
          'kaelen',
          'lyra',
          'selena',
        ].includes(activeCharacter.id)

        setViewerArtwork({
          id: activeCharacter.id + '-fullbody',
          title: activeCharacter.classCharacterName + ' — Tranh Toàn Thân Chiến Trường',
          category: 'base',
          path: activeCharacter.fullbodyAssetPath,
          isAvailableOnDisk: isVerifiedOnDisk,
          status: isVerifiedOnDisk ? 'verified_webp' : 'archive_pending',
          description: activeCharacter.shortDescription,
        })
      }
    }
    setIsViewerOpen(true)
  }

  // Danh sách tác phẩm đang duyệt trong Viewer
  const currentViewerArtworks = viewerContextList || (
    activeCharacter.artworks.filter((a) => a.isAvailableOnDisk).length > 0
      ? activeCharacter.artworks.filter((a) => a.isAvailableOnDisk)
      : activeCharacter.artworks
  )

  // Artwork navigation handlers (Chỉ duyệt trong tập hợp ngữ cảnh đã chọn)
  const currentArtworkIndex = currentViewerArtworks.findIndex(
    (a) => a.id === viewerArtwork?.id || a.path === viewerArtwork?.path
  )
  const hasPrevArtwork = currentArtworkIndex > 0
  const hasNextArtwork =
    currentArtworkIndex >= 0 && currentArtworkIndex < currentViewerArtworks.length - 1

  const handlePrevArtwork = () => {
    if (hasPrevArtwork) {
      setViewerArtwork(currentViewerArtworks[currentArtworkIndex - 1])
    }
  }

  const handleNextArtwork = () => {
    if (hasNextArtwork) {
      setViewerArtwork(currentViewerArtworks[currentArtworkIndex + 1])
    }
  }

  return (
    <div className="sf-v2-pilot-profile w-full min-h-screen bg-[#070A12] text-[#F1F5F9]">
      {/* RENDER DESKTOP OR MOBILE ACCORDING TO VIEWPORT */}
      {isDesktop ? (
        <DesktopView
          roster={V2_ROSTER_CHARACTERS}
          activeCharacter={activeCharacter}
          onSelectCharacter={(char) => setActivePilotId(char.id)}
          backgroundMode={backgroundMode}
          onToggleBackgroundMode={setBackgroundMode}
          onOpenArtViewer={(art) => handleOpenArtViewer(art, activeCharacter.artworks.filter(a => a.isAvailableOnDisk))}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      ) : mobileMode === 'art' ? (
        <MobileArtView
          roster={V2_ROSTER_CHARACTERS}
          character={activeCharacter}
          onSelectCharacter={(char) => setActivePilotId(char.id)}
          backgroundMode={backgroundMode}
          onToggleBackgroundMode={setBackgroundMode}
          onSwitchToInfoView={() => setMobileMode('info')}
          onOpenArtViewer={handleOpenArtViewer}
          onNavigateToGallery={() => {
            setMobileMode('info')
            setActiveTab('gallery')
          }}
        />
      ) : (
        <MobileInfoView
          roster={V2_ROSTER_CHARACTERS}
          activeCharacter={activeCharacter}
          onSelectCharacter={(char) => setActivePilotId(char.id)}
          onSwitchToArtView={() => setMobileMode('art')}
          onOpenArtViewer={handleOpenArtViewer}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {/* SHARED ART VIEWER MODAL — 100% ĐỒNG BỘ INDEX VỚI TẬP TRANH NGỮ CẢNH */}
      {viewerArtwork && (
        <ArtViewer
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          imageSrc={viewerArtwork.path}
          imageAlt={viewerArtwork.title}
          title={viewerArtwork.title}
          subtitle={activeCharacter.fullLoreName}
          category={viewerArtwork.category}
          description={viewerArtwork.description}
          tags={[activeCharacter.callsign, activeCharacter.roleCategory, viewerArtwork.category]}
          isAvailableOnDisk={viewerArtwork.isAvailableOnDisk}
          hasPrev={hasPrevArtwork}
          hasNext={hasNextArtwork}
          onPrev={handlePrevArtwork}
          onNext={handleNextArtwork}
          currentIndex={currentArtworkIndex >= 0 ? currentArtworkIndex + 1 : 1}
          totalCount={currentViewerArtworks.length || 1}
        />
      )}
    </div>
  )
}
export default PilotProfileV2
