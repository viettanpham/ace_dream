'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  V2_ROSTER_CHARACTERS,
  CharacterProfileV2,
  GalleryArtwork,
} from '@/lib/game/v2/character-profile-data';
import { DesktopView } from './desktop-view';
import { MobileArtView } from './mobile-art-view';
import { MobileInfoView } from './mobile-info-view';
import { ArtViewer } from '@/components/game/v2/ui';
import { ImmersiveStoryReader } from '@/components/game/v2/story/immersive-story-reader';
import { CanonicalPilotId } from '@/lib/game/v2/character-content-types';

export interface PilotProfileV2Props {
  initialPilotId?: string;
  onNavigateSection?: (section: string) => void;
}

/**
 * STARFRONT WORLD V2 — CHARACTER CATEGORY / PILOT PROFILE V2 (FND-8 / 8.2.3.E.0)
 *
 * Final Integrated Delivery:
 * - Desktop: 3-column layout (Roster, Center Showcase with 2 symmetrical background controls, Right 4-tab dossier).
 * - Mobile: Dedicated Paired States (Art View with carousel & Info View with high-contrast UI).
 * - Fullscreen Viewer: Contextual artwork synchronization.
 * - Immersive Story Reader: Seamless transition to 3-column scroll-driven prose viewer with scene anchors.
 * - Dynamic Content Overlay: Runtime merging of newly published artworks and profile lore from AdminCP without rebuilds.
 */
export function PilotProfileV2({
  initialPilotId = 'valentine',
  onNavigateSection,
}: PilotProfileV2Props) {
  // Active Pilot State (default to Valentine)
  const [activePilotId, setActivePilotId] = useState<string>(initialPilotId);

  // Background Mode: 'standard' (Elysia Station) vs 'tactical' (Radar HUD)
  const [backgroundMode, setBackgroundMode] = useState<'standard' | 'tactical'>('standard');

  // Mobile Paired View State: 'art' (Artwork Full View) vs 'info' (Dossier & Story)
  const [mobileMode, setMobileMode] = useState<'art' | 'info'>('art');

  // Active Tab across Profile: 'overview' | 'story' | 'gear' | 'gallery'
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Responsive Viewport Detection
  const [isDesktop, setIsDesktop] = useState<boolean>(true);

  // Immersive Story Reader State: null = Dossier mode, string = Chapter ID currently open in reader
  const [activeReaderChapterId, setActiveReaderChapterId] = useState<string | null>(null);

  // Art Viewer Modal State
  const [viewerArtwork, setViewerArtwork] = useState<GalleryArtwork | null>(null);
  const [viewerContextList, setViewerContextList] = useState<GalleryArtwork[] | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);

  // Dynamic Content Overlays (fetched from /api/runtime/character-content)
  const [dynamicArtworks, setDynamicArtworks] = useState<Record<string, GalleryArtwork[]>>({});
  const [dynamicProfileUpdates, setDynamicProfileUpdates] = useState<Record<string, Partial<CharacterProfileV2>>>({});

  // Viewport resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch dynamic content overlay on mount to ensure AdminCP modifications appear live
  useEffect(() => {
    let isCancelled = false;
    fetch('/api/runtime/character-content')
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.success) {
          if (data.artworks) {
            const mappedArts: Record<string, GalleryArtwork[]> = {};
            for (const [pId, arts] of Object.entries(data.artworks)) {
              if (Array.isArray(arts)) {
                mappedArts[pId] = arts.map((a: any) => ({
                  id: a.artworkId,
                  title: a.label,
                  category: a.category || 'lore',
                  path: a.localPath || a.sourceUrl,
                  isAvailableOnDisk: a.verificationStatus === 'VERIFIED',
                  status: a.verificationStatus === 'VERIFIED' ? 'verified_webp' : 'archive_pending',
                  description: a.description,
                }));
              }
            }
            setDynamicArtworks(mappedArts);
          }

          if (data.profiles) {
            const mappedProfiles: Record<string, Partial<CharacterProfileV2>> = {};
            for (const [pId, rec] of Object.entries(data.profiles)) {
              const r = rec as any;
              mappedProfiles[pId] = {
                storySummary: r.storySummary,
                characterQuote: r.characterQuote || r.quote,
                fullLoreName: r.fullLoreName,
                callsign: r.callsign,
                classCharacterName: r.classCharacterName,
                shortDescription: r.shortDescription,
              };
            }
            setDynamicProfileUpdates(mappedProfiles);
          }
        }
      })
      .catch(() => {
        // Fallback to static seed data silently if network fails
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Fetch dynamic gallery for active pilot from CDN R2 (files.json & gallery.json)
  useEffect(() => {
    let isCancelled = false;
    fetch(`/api/runtime/gallery/${activePilotId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.success && Array.isArray(data.artworks)) {
          const galleryArts: GalleryArtwork[] = data.artworks.map((a: any) => ({
            id: a.assetId || a.artworkId || a.filename,
            title: a.title || a.label || a.filename,
            category: a.category || 'lore',
            path: a.path || a.sourceUrl,
            isAvailableOnDisk: true,
            status: 'verified_webp',
            description: a.description || '',
          }));
          setDynamicArtworks((prev) => ({
            ...prev,
            [activePilotId]: galleryArts,
          }));
        }
      })
      .catch(() => {
        // Silently preserve existing artworks on network interruption
      });

    return () => {
      isCancelled = true;
    };
  }, [activePilotId]);

  // Find active pilot data and merge dynamic overlay
  const activeCharacter: CharacterProfileV2 = useMemo(() => {
    const base = V2_ROSTER_CHARACTERS.find((c) => c.id === activePilotId) || V2_ROSTER_CHARACTERS[0];
    const dynUpdates = dynamicProfileUpdates[base.id];
    const extraArts = dynamicArtworks[base.id] || [];

    let mergedArtworks = [...base.artworks];
    for (const art of extraArts) {
      if (!mergedArtworks.some((a) => a.id === art.id || a.path === art.path)) {
        mergedArtworks.push(art);
      }
    }

    return {
      ...base,
      ...dynUpdates,
      artworks: mergedArtworks,
    };
  }, [activePilotId, dynamicProfileUpdates, dynamicArtworks]);

  // Reset viewer context when pilot changes
  useEffect(() => {
    setViewerContextList(null);
  }, [activePilotId]);

  // Pilot Navigation Helpers
  const handlePrevPilot = () => {
    const currentIndex = V2_ROSTER_CHARACTERS.findIndex((c) => c.id === activeCharacter.id);
    const prevIndex = (currentIndex - 1 + V2_ROSTER_CHARACTERS.length) % V2_ROSTER_CHARACTERS.length;
    setActivePilotId(V2_ROSTER_CHARACTERS[prevIndex].id);
  };

  const handleNextPilot = () => {
    const currentIndex = V2_ROSTER_CHARACTERS.findIndex((c) => c.id === activeCharacter.id);
    const nextIndex = (currentIndex + 1) % V2_ROSTER_CHARACTERS.length;
    setActivePilotId(V2_ROSTER_CHARACTERS[nextIndex].id);
  };

  // Open Art Viewer with contextual list
  const handleOpenArtViewer = (art?: GalleryArtwork, contextList?: GalleryArtwork[]) => {
    let targetList: GalleryArtwork[] = [];
    if (contextList && contextList.length > 0) {
      targetList = contextList;
    } else {
      const verifiedOnly = activeCharacter.artworks.filter((a) => a.isAvailableOnDisk);
      targetList = verifiedOnly.length > 0 ? verifiedOnly : activeCharacter.artworks;
    }
    setViewerContextList(targetList);

    if (art) {
      setViewerArtwork(art);
    } else {
      if (targetList.length > 0) {
        setViewerArtwork(targetList[0]);
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
        ].includes(activeCharacter.id);

        setViewerArtwork({
          id: activeCharacter.id + '-fullbody',
          title: activeCharacter.classCharacterName + ' — Tranh Toàn Thân Chiến Trường',
          category: 'base',
          path: activeCharacter.fullbodyAssetPath,
          isAvailableOnDisk: isVerifiedOnDisk,
          status: isVerifiedOnDisk ? 'verified_webp' : 'archive_pending',
          description: activeCharacter.shortDescription,
        });
      }
    }
    setIsViewerOpen(true);
  };

  const currentViewerArtworks =
    viewerContextList ||
    (activeCharacter.artworks.filter((a) => a.isAvailableOnDisk).length > 0
      ? activeCharacter.artworks.filter((a) => a.isAvailableOnDisk)
      : activeCharacter.artworks);

  const currentArtworkIndex = currentViewerArtworks.findIndex(
    (a) => a.id === viewerArtwork?.id || a.path === viewerArtwork?.path
  );
  const hasPrevArtwork = currentArtworkIndex > 0;
  const hasNextArtwork =
    currentArtworkIndex >= 0 && currentArtworkIndex < currentViewerArtworks.length - 1;

  const handlePrevArtwork = () => {
    if (hasPrevArtwork) {
      setViewerArtwork(currentViewerArtworks[currentArtworkIndex - 1]);
    }
  };

  const handleNextArtwork = () => {
    if (hasNextArtwork) {
      setViewerArtwork(currentViewerArtworks[currentArtworkIndex + 1]);
    }
  };

  // Handler to launch Immersive Reader
  const handleOpenReader = (chapterId: string) => {
    setActiveReaderChapterId(chapterId);
  };

  return (
    <div className="sf-v2-pilot-profile w-full h-full min-h-0 flex-1 flex flex-col bg-[#070A12] text-[#F1F5F9] relative overflow-hidden">
      {/* IMMERSIVE STORY READER VIEW OVERLAY */}
      {activeReaderChapterId ? (
        <ImmersiveStoryReader
          pilotId={activeCharacter.id as CanonicalPilotId}
          pilotName={activeCharacter.classCharacterName}
          chapterId={activeReaderChapterId}
          onClose={() => setActiveReaderChapterId(null)}
          onSelectChapter={(newChap) => setActiveReaderChapterId(newChap)}
        />
      ) : (
        /* STANDARD CHARACTER CATEGORY DOSSIER VIEW */
        <>
          {isDesktop ? (
            <DesktopView
              roster={V2_ROSTER_CHARACTERS}
              activeCharacter={activeCharacter}
              onSelectCharacter={(char) => setActivePilotId(char.id)}
              backgroundMode={backgroundMode}
              onToggleBackgroundMode={setBackgroundMode}
              onOpenArtViewer={(art) =>
                handleOpenArtViewer(
                  art,
                  activeCharacter.artworks.filter((a) => a.isAvailableOnDisk)
                )
              }
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onOpenReader={handleOpenReader}
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
                setMobileMode('info');
                setActiveTab('gallery');
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
              onOpenReader={handleOpenReader}
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
              currentIndex={currentArtworkIndex >= 0 ? currentArtworkIndex + 1 : 1}
              totalCount={currentViewerArtworks.length || 1}
            />
          )}
        </>
      )}
    </div>
  );
}
export default PilotProfileV2;
