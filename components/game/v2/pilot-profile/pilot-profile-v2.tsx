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
 * Rebuilt from clean slate matching 100% of the approved Desktop and Mobile concepts:
 * - Desktop: 3-column layout (Roster, Center Showcase with 2 symmetrical background controls, Right 4-tab dossier).
 * - Mobile: Dedicated Paired States (Art View near full-screen with floating controls & Info View with 4 tabs).
 * - Canonical Valentine test pilot: ATK/DEF/AGI/ENE/SHD/LUK (NO "20 total points" displayed), 2 Traits, Story Chapters 01–04 APPROVED, 05–06 PROVISIONAL, 07–10 HOLD.
 * - Fast-Track Art Viewer with zoom, pan, escape key, and zero broken image archive fallback.
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

  // Open Art Viewer for specific artwork
  const handleOpenArtViewer = (art?: GalleryArtwork) => {
    if (art) {
      setViewerArtwork(art)
    } else {
      // Tìm tác phẩm fullbody trong artworks nếu có
      const existingFullbody = activeCharacter.artworks.find(
        (a) => a.category === 'base' || a.id.includes('fullbody')
      )
      if (existingFullbody) {
        setViewerArtwork(existingFullbody)
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

  // Artwork navigation handlers
  const currentArtworkIndex = activeCharacter.artworks.findIndex(
    (a) => a.id === viewerArtwork?.id || a.path === viewerArtwork?.path
  )
  const hasPrevArtwork = currentArtworkIndex > 0
  const hasNextArtwork =
    currentArtworkIndex >= 0 && currentArtworkIndex < activeCharacter.artworks.length - 1

  const handlePrevArtwork = () => {
    if (hasPrevArtwork) {
      setViewerArtwork(activeCharacter.artworks[currentArtworkIndex - 1])
    }
  }

  const handleNextArtwork = () => {
    if (hasNextArtwork) {
      setViewerArtwork(activeCharacter.artworks[currentArtworkIndex + 1])
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
          onOpenArtViewer={handleOpenArtViewer}
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
          onOpenArtViewer={() => handleOpenArtViewer()}
          onPrevPilot={handlePrevPilot}
          onNextPilot={handleNextPilot}
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

      {/* SHARED ART VIEWER MODAL */}
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
        />
      )}
    </div>
  )
}
export default PilotProfileV2
