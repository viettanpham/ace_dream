import { NextRequest, NextResponse } from 'next/server';
import { getCharacterContentStore } from '@/lib/game/v2/character-content-store';
import { CANONICAL_PILOT_IDS, CanonicalPilotId } from '@/lib/game/v2/character-content-types';

export const dynamic = 'force-dynamic';

/**
 * Public Dynamic Content Overlay API
 * GET /api/runtime/character-content
 * Returns active artworks and profile customizations for all 12 pilots.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pilotIdParam = searchParams.get('pilotId')?.toLowerCase();

    const store = getCharacterContentStore();
    const manifest = await store.getManifest();

    if (pilotIdParam) {
      if (!CANONICAL_PILOT_IDS.includes(pilotIdParam as CanonicalPilotId)) {
        return NextResponse.json(
          { success: false, error: `Pilot ${pilotIdParam} không hợp lệ.` },
          { status: 400 }
        );
      }

      const pId = pilotIdParam as CanonicalPilotId;
      const profile = manifest.profiles[pId];
      const artworks = (manifest.artworks[pId] || []).filter(
        (art) => art.verificationStatus === 'VERIFIED'
      );
      const publishedChapters = store.getPublishedChapters(pId);

      return NextResponse.json({
        success: true,
        pilotId: pId,
        profile,
        artworks,
        publishedChapters,
        manifestRevision: manifest.manifestRevision,
      });
    }

    // Filter verified artworks for public consumption
    const publicArtworks: Record<string, unknown[]> = {};
    for (const [pId, arts] of Object.entries(manifest.artworks)) {
      publicArtworks[pId] = arts.filter((art) => art.verificationStatus === 'VERIFIED');
    }

    return NextResponse.json({
      success: true,
      profiles: manifest.profiles,
      artworks: publicArtworks,
      manifestRevision: manifest.manifestRevision,
      storageStatus: manifest.storageStatus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Lỗi tải nội dung phi công: ${message}` },
      { status: 500 }
    );
  }
}
