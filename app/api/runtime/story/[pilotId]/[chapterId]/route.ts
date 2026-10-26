import { NextRequest, NextResponse } from 'next/server';
import { universalContentResolver } from '@/lib/game/v2/universal-content-resolver';
import { isCanonicalPilotId } from '@/lib/game/v2/universal-content-types';
import { verifyAdminRequest } from '@/lib/game/auth/admin-auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    pilotId: string;
    chapterId: string;
  }>;
}

/**
 * Public/Reader Story Chapter Prose API (CP3-A Universal CDN R3)
 * GET /api/runtime/story/[pilotId]/[chapterId]
 * Returns chapter metadata, scene anchors, and full prose.
 * Gracefully handles unwritten chapters as isComingSoon without 404.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { pilotId, chapterId } = await params;
    const cleanPilotId = pilotId.toLowerCase().trim();
    const cleanChapterId = chapterId.toLowerCase().trim();

    if (!isCanonicalPilotId(cleanPilotId)) {
      return NextResponse.json(
        { success: false, error: `Pilot ${pilotId} không thuộc 12 phi công chuẩn.` },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const cdnVersionParam = searchParams.get('cdnVersion')?.trim();
    const cdnBaseUrlParam = searchParams.get('cdnBaseUrl')?.trim();

    const { getDynamicStoryCdnPointer, setDynamicStoryCdnPointer } = await import('@/lib/game/v2/universal-content-resolver');
    if (cdnBaseUrlParam) {
      setDynamicStoryCdnPointer(cdnBaseUrlParam, cdnVersionParam || 'custom');
    } else if (cdnVersionParam) {
      const cleanVer = cdnVersionParam.startsWith('v') ? cdnVersionParam : `v3.0-assets-${cdnVersionParam}`;
      const url = `https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@${cleanVer}/starfront-world-assets`;
      setDynamicStoryCdnPointer(url, cleanVer);
    }

    const isDevOrPreview =
      process.env.NODE_ENV !== 'production' ||
      process.env.STARFRONT_STORY_REVIEW_MODE === 'true';

    const adminAuth = verifyAdminRequest(req, false);
    const isAdminOrReview = adminAuth.authorized || isDevOrPreview;

    const activePointer = getDynamicStoryCdnPointer();

    // 1. Fetch from Universal Content Resolver (R3 / Dynamic CDN first)
    const chapterData = await universalContentResolver.getStoryChapterProse(
      cleanPilotId,
      cleanChapterId,
      isAdminOrReview
    );

    if (chapterData) {
      const enrichedMeta = {
        ...chapterData.meta,
        sceneAnchors: chapterData.sceneAnchors || [],
      };
      return NextResponse.json({
        success: true,
        isComingSoon: chapterData.isComingSoon,
        meta: enrichedMeta,
        content: chapterData.content,
        blocks: chapterData.blocks,
        sceneAnchors: chapterData.sceneAnchors,
        isReviewMode: isAdminOrReview,
        cdnPointer: activePointer,
      });
    }

    // 2. Fallback to local character content store
    const { getCharacterContentStore } = await import('@/lib/game/v2/character-content-store');
    const store = getCharacterContentStore();
    const fallbackData = await store.getChapterWithContent(cleanPilotId as any, cleanChapterId);

    if (fallbackData) {
      return NextResponse.json({
        success: true,
        isComingSoon: false,
        meta: fallbackData.meta,
        content: fallbackData.content,
        blocks: [],
        sceneAnchors: fallbackData.meta.sceneAnchors || [],
        isReviewMode: isAdminOrReview,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: `Không tìm thấy chương ${chapterId} của phi công ${cleanPilotId}.`,
      },
      { status: 404 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Lỗi truy xuất nội dung chương: ${message}` },
      { status: 500 }
    );
  }
}
