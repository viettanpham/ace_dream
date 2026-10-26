import { NextRequest, NextResponse } from 'next/server';
import { universalContentResolver } from '@/lib/game/v2/universal-content-resolver';
import { CANONICAL_12_PILOT_IDS, CanonicalPilotId, isCanonicalPilotId } from '@/lib/game/v2/universal-content-types';
import { getCharacterContentStore } from '@/lib/game/v2/character-content-store';

export const dynamic = 'force-dynamic';

/**
 * Public Story Discovery API (CP3-A Universal CDN R3)
 * GET /api/runtime/story?pilotId=valentine
 * Returns published story chapters, summaries, and Coming Soon catalog for 12 canonical pilots.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pilotIdParam = searchParams.get('pilotId')?.toLowerCase().trim();

    const isDevOrPreview =
      process.env.NODE_ENV !== 'production' ||
      process.env.STARFRONT_STORY_REVIEW_MODE === 'true';

    // 1. If specific pilot is requested:
    if (pilotIdParam) {
      if (!isCanonicalPilotId(pilotIdParam)) {
        return NextResponse.json(
          { success: false, error: `Pilot ${pilotIdParam} không thuộc 12 phi công chuẩn FND-8.` },
          { status: 400 }
        );
      }

      // Try Universal Content Resolver first (R3 story manifest)
      const storyCatalog = await universalContentResolver.getPilotStoryCatalog(pilotIdParam);
      if (storyCatalog && storyCatalog.chapters.length > 0) {
        return NextResponse.json({
          success: true,
          pilotId: pilotIdParam,
          pilotName: storyCatalog.pilotName,
          callsign: storyCatalog.callsign,
          totalChapters: storyCatalog.totalChapters,
          publishedChaptersCount: storyCatalog.publishedChaptersCount,
          chapters: storyCatalog.chapters,
          isReviewMode: isDevOrPreview,
        });
      }

      // Fallback: query character content store
      const store = getCharacterContentStore();
      const published = await store.getPublishedChapters(pilotIdParam as CanonicalPilotId);
      return NextResponse.json({
        success: true,
        pilotId: pilotIdParam,
        chapters: published,
        isReviewMode: isDevOrPreview,
      });
    }

    // 2. If general story index is requested:
    const rootManifest = await universalContentResolver.getRootManifest();
    return NextResponse.json({
      success: true,
      subsystem: rootManifest?.subsystems?.stories || {
        status: 'active',
        totalPilots: 12,
        totalPublishedChapters: 1,
        totalCatalogChapters: 87,
      },
      canonicalPilots: CANONICAL_12_PILOT_IDS,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Lỗi truy xuất danh mục cốt truyện: ${message}` },
      { status: 500 }
    );
  }
}
