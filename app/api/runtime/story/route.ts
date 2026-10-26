import { NextRequest, NextResponse } from 'next/server';
import {
  universalContentResolver,
  getDynamicStoryCdnPointer,
  setDynamicStoryCdnPointer,
} from '@/lib/game/v2/universal-content-resolver';
import { CANONICAL_12_PILOT_IDS, CanonicalPilotId, isCanonicalPilotId } from '@/lib/game/v2/universal-content-types';
import { getCharacterContentStore } from '@/lib/game/v2/character-content-store';

export const dynamic = 'force-dynamic';

/**
 * Public Story Discovery API (CP3-A Universal CDN R3 / Dynamic Pointer)
 * GET /api/runtime/story?pilotId=valentine&cdnVersion=r4
 * Returns published story chapters, summaries, Coming Soon catalog, and active CDN pointer.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pilotIdParam = searchParams.get('pilotId')?.toLowerCase().trim();
    const cdnVersionParam = searchParams.get('cdnVersion')?.trim();
    const cdnBaseUrlParam = searchParams.get('cdnBaseUrl')?.trim();

    // If ad-hoc version or base URL requested via query params, apply temporary override
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

    const activePointer = getDynamicStoryCdnPointer();

    // 1. If specific pilot is requested:
    if (pilotIdParam) {
      if (!isCanonicalPilotId(pilotIdParam)) {
        return NextResponse.json(
          { success: false, error: `Pilot ${pilotIdParam} không thuộc 12 phi công chuẩn FND-8.` },
          { status: 400 }
        );
      }

      // Try Universal Content Resolver first (story manifest)
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

      // Fallback: query character content store
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
