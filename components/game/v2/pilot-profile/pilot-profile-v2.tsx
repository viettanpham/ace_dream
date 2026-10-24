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

  // Dynamic Content Overlays
  // Dedicated state for CDN R2 dynamic gallery (files.json + gallery.json)
  const [r2GalleryArtworks, setR2GalleryArtworks] = useState<Record<string, GalleryArtwork[]>>({});
  // Dedicated state for AdminCP manual uploads/edits
  const [adminCustomArtworks, setAdminCustomArtworks] = useState<Record<string, GalleryArtwork[]>>({});
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
                  id: a.artworkId || a.assetId || a.filename,
                  title: a.label || a.title || 'Tác phẩm',
                  category: a.category || 'lore',
                  path: a.localPath || a.sourceUrl || a.path,
                  isAvailableOnDisk: a.verificationStatus === 'VERIFIED' || a.status === 'published',
                  status: (a.verificationStatus === 'VERIFIED' || a.status === 'published') ? 'verified_webp' : 'archive_pending',
                  description: a.description,
                }));
              }
            }
            setAdminCustomArtworks(mappedArts);
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
  // Single Source of Truth for the entire pilot artwork collection (e.g. Valentine 35, Fortuna 30, Rhea 23, etc.)
  useEffect(() => {
    let isCancelled = false;
    fetch(`/api/runtime/gallery/${activePilotId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.success && Array.isArray(data.artworks) && data.artworks.length > 0) {
          const galleryArts: GalleryArtwork[] = data.artworks.map((a: any) => {
            const rawTitle = a.title || a.label || a.filename || 'Tác phẩm';
            let naturalTitle = rawTitle;

            // Chuẩn hóa tên trang phục nếu chưa có tên biên tập riêng
            const outfitMatch =
              rawTitle.match(/outfit[-_\s]*(\d+)/i) ||
              (a.filename || '').match(/outfit[-_\s]*(\d+)/i) ||
              (a.assetId || '').match(/outfit[-_\s]*(\d+)/i);
            if (outfitMatch) {
              naturalTitle = `Trang phục ${outfitMatch[1].padStart(3, '0')}`;
            }

            const cleanPath = a.path
              ? (a.path.startsWith('/') ? a.path.slice(1) : a.path)
              : (a.sourceUrl || `images/pilots/${activePilotId}/${a.filename}`);

            return {
              id: a.assetId || a.artworkId || a.filename,
              title: naturalTitle,
              category: a.category || 'lore',
              path: cleanPath,
              isAvailableOnDisk: true,
              status: 'verified_webp' as const,
              description:
                a.description ||
                `Định dạng WebP tối ưu (${a.width || 1122}×${a.height || 1402}px)`,
              dimensions:
                a.width && a.height ? { width: a.width, height: a.height } : undefined,
            };
          });

          setR2GalleryArtworks((prev) => ({
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
  // SINGLE SOURCE OF TRUTH: If dynamic artworks are loaded from R2, use them exclusively
  const activeCharacter: CharacterProfileV2 = useMemo(() => {
    const base = V2_ROSTER_CHARACTERS.find((c) => c.id === activePilotId) || V2_ROSTER_CHARACTERS[0];
    const dynUpdates = dynamicProfileUpdates[base.id];
    const r2Arts = r2GalleryArtworks[base.id];
    const customArts = adminCustomArtworks[base.id] || [];

    let authoritativeArtworks: GalleryArtwork[] = base.artworks;
    if (r2Arts && r2Arts.length > 0) {
      authoritativeArtworks = [...r2Arts];
      // Append any custom uploaded artwork from AdminCP not in R2
      for (const custom of customArts) {
        if (!authoritativeArtworks.some((a) => a.id === custom.id || a.path === custom.path)) {
          authoritativeArtworks.push(custom);
        }
      }
    } else if (customArts.length > 0) {
      authoritativeArtworks = [...base.artworks, ...customArts];
    }

    return {
      ...base,
      ...dynUpdates,
      artworks: authoritativeArtworks,
    };
  }, [activePilotId, dynamicProfileUpdates, r2GalleryArtworks, adminCustomArtworks]);

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

  // Open Art Viewer with contextual list (Uses authoritative activeCharacter.artworks)
  const handleOpenArtViewer = (art?: GalleryArtwork, contextList?: GalleryArtwork[]) => {
    const targetList: GalleryArtwork[] =
      contextList && contextList.length >= activeCharacter.artworks.length
        ? contextList
        : activeCharacter.artworks;

    setViewerContextList(targetList);

    if (art) {
      // Find matching item in targetList
      const matched = targetList.find(
        (a) =>
          a.id === art.id ||
          a.path === art.path ||
          (art.path && a.path.endsWith(art.path.split('/').pop() || '###'))
      );
      setViewerArtwork(matched || art);
    } else {
      if (targetList.length > 0) {
        setViewerArtwork(targetList[0]);
      } else {
        setViewerArtwork({
          id: activeCharacter.id + '-fullbody',
          title: activeCharacter.classCharacterName + ' — Tranh Toàn Thân Chiến Trường',
          category: 'base',
          path: activeCharacter.fullbodyAssetPath,
          isAvailableOnDisk: true,
          status: 'verified_webp',
          description: activeCharacter.shortDescription,
        });
      }
    }
    setIsViewerOpen(true);
  };

  const currentViewerArtworks = viewerContextList || activeCharacter.artworks;

  const currentArtworkIndex = currentViewerArtworks.findIndex((a) => {
    if (!viewerArtwork) return false;
    if (a.id === viewerArtwork.id) return true;
    if (a.path === viewerArtwork.path) return true;
    const filenameA = a.path.split('/').pop();
    const filenameV = viewerArtwork.path?.split('/').pop();
    return Boolean(filenameA && filenameV && filenameA === filenameV);
  });
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
                handleOpenArtViewer(art, activeCharacter.artworks)
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
