import { NextRequest, NextResponse } from 'next/server';
import { getCharacterContentStore } from '@/lib/game/v2/character-content-store';
import { CANONICAL_PILOT_IDS, CanonicalPilotId } from '@/lib/game/v2/character-content-types';
import { verifyAdminRequest } from '@/lib/game/auth/admin-auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    pilotId: string;
    chapterId: string;
  }>;
}

/**
 * Public/Reader Story Chapter Prose API
 * GET /api/runtime/story/[pilotId]/[chapterId]
 * Returns chapter metadata, scene anchors, and full markdown prose.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { pilotId, chapterId } = await params;
    const cleanPilotId = pilotId.toLowerCase();

    if (!CANONICAL_PILOT_IDS.includes(cleanPilotId as CanonicalPilotId)) {
      return NextResponse.json(
        { success: false, error: `Pilot ${pilotId} không thuộc 12 phi công chuẩn.` },
        { status: 404 }
      );
    }

    const store = getCharacterContentStore();
    const chapterData = await store.getChapterWithContent(cleanPilotId as CanonicalPilotId, chapterId);

    if (!chapterData) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy chương ${chapterId} của phi công ${cleanPilotId}.` },
        { status: 404 }
      );
    }

    // Gate check: Public view requires publicationStatus === 'PUBLISHED'
    if (chapterData.meta.publicationStatus !== 'PUBLISHED') {
      const adminAuth = verifyAdminRequest(req, false);
      if (!adminAuth.authorized) {
        return NextResponse.json(
          {
            success: false,
            error: 'Chương này đang ở chế độ bản nháp hoặc đã ẩn, chỉ Quản trị viên có quyền xem trước.',
            isRestricted: true,
            status: chapterData.meta.publicationStatus,
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      pilotId: cleanPilotId,
      chapterId,
      meta: chapterData.meta,
      content: chapterData.content,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Lỗi đọc nội dung chương truyện: ${message}` },
      { status: 500 }
    );
  }
}
