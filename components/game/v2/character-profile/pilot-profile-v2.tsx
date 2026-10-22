"use client"

import React, { useState, useEffect } from "react"
import { getCharacterProfileById, type CharacterProfileV2, type GalleryArtwork } from "@/lib/game/v2/character-profile-data"
import { DesktopProfileView } from "./desktop-profile-view"
import { MobileProfileView } from "./mobile-profile-view"
import { ArtworkLightboxModal } from "./artwork-lightbox-modal"

interface PilotProfileV2Props {
  initialCharacterId?: string
  onNavigateSection?: (section: any) => void
  onSelectCharacter?: (pilotId: string) => void
}

export function PilotProfileV2({
  initialCharacterId = "valentine",
  onNavigateSection,
  onSelectCharacter,
}: PilotProfileV2Props) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(initialCharacterId)
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [activeLightboxArtwork, setActiveLightboxArtwork] = useState<GalleryArtwork | null>(null)

  // Tự động phát hiện kích thước màn hình để chuyển đổi giữa Desktop và Mobile view
  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkViewport()
    window.addEventListener("resize", checkViewport)
    return () => window.removeEventListener("resize", checkViewport)
  }, [])

  const currentCharacter = getCharacterProfileById(selectedCharacterId)

  const handleSelectCharacter = (charId: string) => {
    setSelectedCharacterId(charId)
    if (onSelectCharacter) {
      onSelectCharacter(charId)
    }
  }

  const handleBackToGame = () => {
    if (onNavigateSection) {
      onNavigateSection("home")
    }
  }

  return (
    <div className="relative w-full min-h-screen bg-[#070A12] text-slate-100 font-sans">
      {/* Hiển thị Desktop hoặc Mobile View tùy theo Viewport */}
      {isMobile ? (
        <MobileProfileView
          character={currentCharacter}
          onSelectCharacter={handleSelectCharacter}
          onInspectArtwork={setActiveLightboxArtwork}
          onBackToGame={handleBackToGame}
        />
      ) : (
        <DesktopProfileView
          character={currentCharacter}
          onSelectCharacter={handleSelectCharacter}
          onInspectArtwork={setActiveLightboxArtwork}
          onBackToGame={handleBackToGame}
        />
      )}

      {/* Lightbox / Art Inspector Modal */}
      {activeLightboxArtwork && (
        <ArtworkLightboxModal
          artwork={activeLightboxArtwork}
          artworksList={currentCharacter.artworks}
          onClose={() => setActiveLightboxArtwork(null)}
          onSelectArtwork={setActiveLightboxArtwork}
        />
      )}
    </div>
  )
}
