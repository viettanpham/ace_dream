import { NextRequest, NextResponse } from 'next/server';
import { contentReleaseResolver } from '@/lib/game/v2/content-release-resolver';
import { universalContentResolver } from '@/lib/game/v2/universal-content-resolver';
import { isCanonicalPilotId } from '@/lib/game/v2/universal-content-types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ pilotId: string }>;
}

/**
 * Public Story Catalog for specific pilot
 * GET /api/runtime/story/[pilotId]
 * Priority: ContentReleaseResolver (R4+) -> fallback to UniversalContentResolver (R3) only if R4+ snapshot fails.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { pilotId } = await params;
    const cleanPilotId = pilotId.toLowerCase().trim();

    const { verifyAdminRequest } = await import('@/lib/game/auth/admin-auth');
    const adminAuth = verifyAdminRequest(req, false);
    const isAdminOrReview =
      adminAuth.authorized || process.env.STARFRONT_STORY_REVIEW_MODE === 'true';

    // 1. Primary: ContentReleaseResolver (Immutable R4 -> R5+ CDN Snapshot)
    try {
      const { snapshot } = await contentReleaseResolver.resolveSnapshot();
      const pilotExistsInRelease = snapshot.characters.some((c) => c.id === cleanPilotId);

      if (!pilotExistsInRelease && !isCanonicalPilotId(cleanPilotId)) {
        return NextResponse.json(
          { success: false, error: `Pilot ${cleanPilotId} không thuộc danh mục phi công hợp lệ.` },
          { status: 404 }
        );
      }

      if (pilotExistsInRelease) {
        const releaseCatalog = await contentReleaseResolver.getPilotStoryCatalog(cleanPilotId);
        const publishedChaptersCount = releaseCatalog.chapters.filter(
          (ch) =>
            ch.status === 'APPROVED' ||
            (ch.editorialStatus || '').toUpperCase() === 'APPROVED' ||
            (ch.editorialStatus || '').toUpperCase() === 'PUBLISHED'
        ).length;

        const chapters = releaseCatalog.chapters.map((ch) => ({
          ...ch,
          chapterId: ch.id,
          chapterNumber: ch.number,
        }));

        return NextResponse.json({
          success: true,
          source: 'content-release-resolver',
          releaseVersion: releaseCatalog.releaseVersion,
          releaseCommitSha: releaseCatalog.releaseCommitSha,
          pilotId: cleanPilotId,
          pilotName: releaseCatalog.pilotName,
          callsign: releaseCatalog.callsign,
          available: releaseCatalog.available,
          status: releaseCatalog.status,
          emptyState: releaseCatalog.emptyState,
          totalChapters: releaseCatalog.totalChapters,
          publishedChaptersCount,
          chapters,
          isReviewMode: isAdminOrReview,
        });
      }
    } catch {
      // Fallback to R3 resolver ONLY when R4+ channel/snapshot cannot be resolved
    }

    if (!isCanonicalPilotId(cleanPilotId)) {
      return NextResponse.json(
        { success: false, error: `Pilot ${cleanPilotId} không thuộc 12 phi công chuẩn.` },
        { status: 404 }
      );
    }

    const catalog = await universalContentResolver.getPilotStoryCatalog(
      cleanPilotId,
      isAdminOrReview
    );
    if (!catalog) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy danh mục cốt truyện cho phi công ${cleanPilotId}.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      source: 'universal-content-resolver-r3-fallback',
      pilotId: cleanPilotId,
      pilotName: catalog.pilotName,
      callsign: catalog.callsign,
      available: catalog.chapters.some((c) => c.contentAvailable),
      totalChapters: catalog.totalChapters,
      publishedChaptersCount: catalog.publishedChaptersCount,
      chapters: catalog.chapters,
      isReviewMode: isAdminOrReview,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Lỗi truy xuất danh mục cốt truyện: ${message}` },
      { status: 500 }
    );
  }
}
