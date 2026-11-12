import { NextRequest, NextResponse } from 'next/server';
import { contentReleaseResolver } from '@/lib/game/v2/content-release-resolver';
import {
  universalContentResolver,
  getDynamicStoryCdnPointer,
  setDynamicStoryCdnPointer,
} from '@/lib/game/v2/universal-content-resolver';
import { CANONICAL_12_PILOT_IDS, CanonicalPilotId, isCanonicalPilotId } from '@/lib/game/v2/universal-content-types';
import { getCharacterContentStore } from '@/lib/game/v2/character-content-store';

export const dynamic = 'force-dynamic';

/**
 * Public Story Discovery API (FND-8 Dynamic CDN R4 -> R5+)
 * GET /api/runtime/story?pilotId=valentine
 * Returns story chapters and emptyState dynamically resolved from pinned CDN release.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pilotIdParam = searchParams.get('pilotId')?.toLowerCase().trim();
    const cdnVersionParam = searchParams.get('cdnVersion')?.trim();
    const cdnBaseUrlParam = searchParams.get('cdnBaseUrl')?.trim();
    const forceRefresh = searchParams.get('refresh') === '1';

    if (cdnBaseUrlParam) {
      setDynamicStoryCdnPointer(cdnBaseUrlParam, cdnVersionParam || 'custom');
    } else if (cdnVersionParam) {
      const cleanVer = cdnVersionParam.startsWith('v') ? cdnVersionParam : `v3.0-assets-${cdnVersionParam}`;
      const url = `https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@${cleanVer}/starfront-world-assets`;
      setDynamicStoryCdnPointer(url, cleanVer);
    }

    const { verifyAdminRequest } = await import('@/lib/game/auth/admin-auth');
    const adminAuth = verifyAdminRequest(req, false);
    const isAdminOrReview = adminAuth.authorized || process.env.STARFRONT_STORY_REVIEW_MODE === 'true';

    // 1. Primary: ContentReleaseResolver (Pinned R4 -> R5+ Release)
    try {
      if (pilotIdParam) {
        const storyCatalog = await contentReleaseResolver.getPilotStoryCatalog(pilotIdParam, {
          forceRefresh,
        });
        return NextResponse.json({
          success: true,
          pilotId: pilotIdParam,
          pilotName: storyCatalog.pilotName,
          callsign: storyCatalog.callsign,
          available: storyCatalog.available,
          status: storyCatalog.status,
          emptyState: storyCatalog.emptyState,
          totalChapters: storyCatalog.totalChapters,
          publishedChaptersCount: storyCatalog.totalChapters,
          chapters: storyCatalog.chapters,
          releaseVersion: storyCatalog.releaseVersion,
          releaseCommitSha: storyCatalog.releaseCommitSha,
          isReviewMode: true,
        });
      } else {
        const { snapshot } = await contentReleaseResolver.resolveSnapshot({ forceRefresh });
        return NextResponse.json({
          success: true,
          releaseVersion: snapshot.releaseVersion,
          releaseCommitSha: snapshot.releaseCommitSha,
          storiesIndex: snapshot.storiesIndex,
          pilots: snapshot.profilesIndex.entries.map((e) => e.pilotId),
        });
      }
    } catch {
      // Fallback to R3 resolver if R4 channel is unreachable
    }

    const activePointer = getDynamicStoryCdnPointer();

    if (pilotIdParam) {
      if (!isCanonicalPilotId(pilotIdParam)) {
        return NextResponse.json(
          { success: false, error: `Không tìm thấy phi công ${pilotIdParam}.` },
          { status: 400 }
        );
      }

      const storyCatalog = await universalContentResolver.getPilotStoryCatalog(pilotIdParam, isAdminOrReview);
      if (storyCatalog && storyCatalog.chapters.length > 0) {
        return NextResponse.json({
          success: true,
          pilotId: pilotIdParam,
          pilotName: storyCatalog.pilotName,
          callsign: storyCatalog.callsign,
          totalChapters: storyCatalog.totalChapters,
          publishedChaptersCount: storyCatalog.publishedChaptersCount,
          chapters: storyCatalog.chapters,
          isReviewMode: isAdminOrReview,
          cdnPointer: activePointer,
        });
      }

      const store = getCharacterContentStore();
      const published = await store.getPublishedChapters(pilotIdParam as CanonicalPilotId);
      return NextResponse.json({
        success: true,
        pilotId: pilotIdParam,
        chapters: published,
        isReviewMode: isAdminOrReview,
        cdnPointer: activePointer,
      });
    }

    const rootManifest = await universalContentResolver.getRootManifest();
    return NextResponse.json({
      success: true,
      subsystem: rootManifest?.subsystems?.stories || {
        status: 'active',
        totalPilots: 12,
        totalPublishedChapters: 5,
        totalCatalogChapters: 87,
      },
      canonicalPilots: CANONICAL_12_PILOT_IDS,
      cdnPointer: activePointer,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Lỗi truy xuất danh mục cốt truyện: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/runtime/story
 * Allows AdminCP to switch Dynamic Story CDN pointer (e.g. to R4, R5) without rebuilding React.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cdnBaseUrl, cdnVersion, reset } = body;

    if (reset) {
      setDynamicStoryCdnPointer(null, null);
      return NextResponse.json({
        success: true,
        message: 'Đã hoàn nguyên Dynamic Story CDN pointer về mặc định R3.',
        cdnPointer: getDynamicStoryCdnPointer(),
      });
    }

    if (!cdnBaseUrl && !cdnVersion) {
      return NextResponse.json(
        { success: false, error: 'Thiếu tham số cdnBaseUrl hoặc cdnVersion.' },
        { status: 400 }
      );
    }

    let targetUrl = cdnBaseUrl;
    let targetVersion = cdnVersion;

    if (!targetUrl && targetVersion) {
      const cleanVer = targetVersion.startsWith('v') ? targetVersion : `v3.0-assets-${targetVersion}`;
      targetUrl = `https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@${cleanVer}/starfront-world-assets`;
      targetVersion = cleanVer;
    }

    setDynamicStoryCdnPointer(targetUrl, targetVersion);

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật Dynamic Story CDN pointer thành công sang ${targetVersion || targetUrl}.`,
      cdnPointer: getDynamicStoryCdnPointer(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Lỗi cấu hình Story CDN pointer: ${message}` },
      { status: 500 }
    );
  }
}
