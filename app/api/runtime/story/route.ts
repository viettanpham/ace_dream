import { NextRequest, NextResponse } from 'next/server';
import { getCharacterContentStore } from '@/lib/game/v2/character-content-store';
import { CANONICAL_PILOT_IDS, CanonicalPilotId } from '@/lib/game/v2/character-content-types';

export const dynamic = 'force-dynamic';

/**
 * Public Story Discovery API
 * GET /api/runtime/story?pilotId=valentine
 * Returns published story chapters and summaries for canonical pilots.
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

      const published = await store.getPublishedChapters(pilotIdParam as CanonicalPilotId);
      return NextResponse.json({
        success: true,
        pilotId: pilotIdParam,
        chapters: published,
        count: published.length,
      });
    }

    // Return published chapters map for all pilots
    const allPublished: Record<string, unknown[]> = {};
    for (const id of CANONICAL_PILOT_IDS) {
      allPublished[id] = await store.getPublishedChapters(id);
    }

    return NextResponse.json({
      success: true,
      chaptersByPilot: allPublished,
      manifestRevision: manifest.manifestRevision,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Lỗi tải danh mục truyện: ${message}` },
      { status: 500 }
    );
  }
}
