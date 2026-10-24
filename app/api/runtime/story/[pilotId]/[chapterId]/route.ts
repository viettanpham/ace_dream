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
    let chapterData = await store.getChapterWithContent(cleanPilotId as CanonicalPilotId, chapterId);

    // Fallback: If not found as physical file, check V2_ROSTER_CHARACTERS canonical roadmap
    if (!chapterData) {
      const { V2_ROSTER_CHARACTERS } = await import('@/lib/game/v2/character-profile-data');
      const pilotRoster = V2_ROSTER_CHARACTERS.find((c) => c.id === cleanPilotId);
      const roadmapChapter = pilotRoster?.chapters.find(
        (c) => c.id === chapterId || `chap-${String(c.number).padStart(2, '0')}` === chapterId
      );

      if (roadmapChapter) {
        chapterData = {
          meta: {
            chapterId: roadmapChapter.id,
            chapterNumber: roadmapChapter.number,
            pilotId: cleanPilotId as CanonicalPilotId,
            characterName: pilotRoster?.classCharacterName || cleanPilotId,
            title: roadmapChapter.title,
            version: '1.0.0',
            summary: roadmapChapter.summary,
            quote: roadmapChapter.quote,
            editorialStatus: roadmapChapter.status,
            contentReadiness: roadmapChapter.content ? 'FULL_BODY_IMPORTED' : 'SUMMARY_ONLY',
            publicationStatus: roadmapChapter.status === 'APPROVED' && roadmapChapter.number === 1 ? 'PUBLISHED' : 'DRAFT',
            estimatedReadTimeMinutes: roadmapChapter.number === 1 ? 6 : 4,
            readingTimeMinutes: roadmapChapter.number === 1 ? 6 : 4,
            wordCount: roadmapChapter.content ? roadmapChapter.content.split(/\s+/).length : (roadmapChapter.number === 1 ? 1200 : 450),
            updatedAt: '2026-10-24T00:00:00.000Z',
            sceneAnchors: roadmapChapter.number === 1 ? [
              {
                anchorId: 'scene-01',
                title: 'Học viện Quân y Không gian',
                caption: 'Ký ức tại Elysia — Minh họa gắn với phân cảnh hiện tại',
                description: 'Một lựa chọn đã thay đổi hành trình của Valentine.',
                aspectRatio: 'portrait',
                artworkUrl: 'images/pilots/valentine/valentine-portrait.webp',
                assetId: 'valentine-portrait',
              },
              {
                anchorId: 'scene-02',
                title: 'Trạm Cứu hộ Quỹ đạo Mercy Wing',
                caption: 'Phi đội sơ tán và nhiệm vụ khẩn cấp tại vành đai Elysia',
                description: 'Khoảnh khắc đối mặt với hai tín hiệu cầu cứu cùng lúc.',
                aspectRatio: 'portrait',
                artworkUrl: 'images/pilots/valentine/valentine-fullbody.webp',
                assetId: 'valentine-fullbody',
              }
            ] : [],
          },
          content: roadmapChapter.content || '',
        };
      }
    }

    if (!chapterData) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy chương ${chapterId} của phi công ${cleanPilotId}.` },
        { status: 404 }
      );
    }

    // Story Review Mode check:
    // In development, preview environment, or if review mode is explicitly enabled, or user is admin
    const isDevOrPreview =
      process.env.NODE_ENV !== 'production' ||
      process.env.STARFRONT_STORY_REVIEW_MODE === 'true';

    let isAuthorized = chapterData.meta.publicationStatus === 'PUBLISHED';
    let isAdmin = false;

    if (!isAuthorized) {
      const adminAuth = verifyAdminRequest(req, false);
      if (adminAuth.authorized) {
        isAdmin = true;
        isAuthorized = true;
      } else if (isDevOrPreview) {
        // Controlled Review Mode allowed in Dev/Preview for project owner inspection
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: 'Chương này đang ở chế độ bản nháp hoặc đã niêm phong, chỉ Quản trị viên có quyền xem trước.',
          isRestricted: true,
          status: chapterData.meta.publicationStatus,
          editorialStatus: chapterData.meta.editorialStatus,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      pilotId: cleanPilotId,
      chapterId: chapterData.meta.chapterId,
      isReviewMode: isDevOrPreview || isAdmin,
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
