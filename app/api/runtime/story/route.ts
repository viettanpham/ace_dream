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

    const isDevOrPreview =
      process.env.NODE_ENV !== 'production' ||
      process.env.STARFRONT_STORY_REVIEW_MODE === 'true';

    if (pilotIdParam) {
      if (!CANONICAL_PILOT_IDS.includes(pilotIdParam as CanonicalPilotId)) {
        return NextResponse.json(
          { success: false, error: `Pilot ${pilotIdParam} không hợp lệ.` },
          { status: 400 }
        );
      }

      const published = await store.getPublishedChapters(pilotIdParam as CanonicalPilotId);

      // If in review mode / dev / preview, provide full roadmap chapters from canonical data
      if (isDevOrPreview) {
        const { V2_ROSTER_CHARACTERS } = await import('@/lib/game/v2/character-profile-data');
        const rosterChar = V2_ROSTER_CHARACTERS.find((c) => c.id === pilotIdParam);
        if (rosterChar && rosterChar.chapters.length > 0) {
          const roadmapChapters = rosterChar.chapters.map((chap) => {
            const matchedPub = published.find((p) => p.chapterId === chap.id || p.chapterNumber === chap.number);
            return {
              chapterId: chap.id,
              chapterNumber: chap.number,
              pilotId: pilotIdParam as CanonicalPilotId,
              characterName: rosterChar.classCharacterName,
              title: chap.title,
              version: '1.0.0',
              summary: chap.summary,
              quote: chap.quote,
              editorialStatus: chap.status,
              contentReadiness: chap.content ? 'FULL_BODY_IMPORTED' : 'SUMMARY_ONLY',
              publicationStatus: chap.status === 'APPROVED' && chap.number === 1 ? 'PUBLISHED' : 'DRAFT',
              estimatedReadTimeMinutes: chap.number === 1 ? 6 : 4,
              readingTimeMinutes: chap.number === 1 ? 6 : 4,
              wordCount: chap.content ? chap.content.split(/\s+/).length : (chap.number === 1 ? 1200 : 450),
              updatedAt: matchedPub?.updatedAt || '2026-10-24T00:00:00.000Z',
              sceneAnchors: matchedPub?.sceneAnchors || (chap.number === 1 ? [
                {
                  anchorId: 'scene-01',
                  title: 'Học viện Quân y Không gian',
                  caption: 'Ký ức tại Elysia — Minh họa gắn với phân cảnh hiện tại',
                  description: 'Một lựa chọn đã thay đổi hành trình của Valentine.',
                  aspectRatio: 'portrait',
                  artworkUrl: '/images/valentine-portrait.webp',
                  assetId: 'valentine-portrait',
                },
                {
                  anchorId: 'scene-02',
                  title: 'Trạm Cứu hộ Quỹ đạo Mercy Wing',
                  caption: 'Phi đội sơ tán và nhiệm vụ khẩn cấp tại vành đai Elysia',
                  description: 'Khoảnh khắc đối mặt với hai tín hiệu cầu cứu cùng lúc.',
                  aspectRatio: 'portrait',
                  artworkUrl: '/images/valentine-fullbody.webp',
                  assetId: 'valentine-fullbody',
                }
              ] : []),
            };
          });

          return NextResponse.json({
            success: true,
            pilotId: pilotIdParam,
            chapters: roadmapChapters,
            count: roadmapChapters.length,
            isReviewMode: true,
          });
        }
      }

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
