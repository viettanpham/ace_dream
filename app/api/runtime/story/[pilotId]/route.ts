import { NextRequest, NextResponse } from 'next/server';
import { universalContentResolver } from '@/lib/game/v2/universal-content-resolver';
import { isCanonicalPilotId } from '@/lib/game/v2/universal-content-types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ pilotId: string }>;
}

/**
 * Public Story Catalog for specific pilot
 * GET /api/runtime/story/[pilotId]
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { pilotId } = await params;
    const cleanPilotId = pilotId.toLowerCase().trim();

    if (!isCanonicalPilotId(cleanPilotId)) {
      return NextResponse.json(
        { success: false, error: `Pilot ${cleanPilotId} không thuộc 12 phi công chuẩn.` },
        { status: 404 }
      );
    }

    const catalog = await universalContentResolver.getPilotStoryCatalog(cleanPilotId);
    if (!catalog) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy danh mục cốt truyện cho phi công ${cleanPilotId}.` },
        { status: 404 }
      );
    }

    const isDevOrPreview =
      process.env.NODE_ENV !== 'production' ||
      process.env.STARFRONT_STORY_REVIEW_MODE === 'true';

    return NextResponse.json({
      success: true,
      pilotId: cleanPilotId,
      pilotName: catalog.pilotName,
      callsign: catalog.callsign,
      totalChapters: catalog.totalChapters,
      publishedChaptersCount: catalog.publishedChaptersCount,
      chapters: catalog.chapters,
      isReviewMode: isDevOrPreview,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Lỗi truy xuất danh mục cốt truyện: ${message}` },
      { status: 500 }
    );
  }
}
