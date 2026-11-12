import { NextRequest, NextResponse } from 'next/server';
import { contentReleaseResolver } from '@/lib/game/v2/content-release-resolver';
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
 * Public/Reader Story Chapter Prose API (FND-8 Dynamic CDN R4 -> R5+)
 * GET /api/runtime/story/[pilotId]/[chapterId]
 * Returns chapter metadata, blocks[] (heading, paragraph, dialogue, scene with verified/pending CDN status), and full prose.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { pilotId, chapterId } = await params;
    const cleanPilotId = pilotId.toLowerCase().trim();
    const cleanChapterId = chapterId.toLowerCase().trim();

    // 1. Primary: ContentReleaseResolver (Pinned R4 -> R5+ Release)
    try {
      const releaseChapterResult = await contentReleaseResolver.getPilotStoryChapter(
        cleanPilotId,
        cleanChapterId
      );

      if (releaseChapterResult) {
        const { chapter, releaseVersion, releaseCommitSha } = releaseChapterResult;

        // Build sceneAnchors list from scene blocks so any legacy consumer also receives verified status
        const sceneAnchors = (chapter.blocks || [])
          .filter((b) => b.type === 'scene')
          .map((b, idx) => {
            const firstArt = b.artworks?.[0];
            return {
              sceneId: b.sceneId || b.blockId,
              paragraphIndex: idx + 1,
              title: b.sceneTitle || firstArt?.caption || 'Minh họa phân cảnh',
              caption: b.caption || firstArt?.caption || '',
              artworkAssetId: firstArt?.assetId || '',
              artworkPath: firstArt?.cdnVerified ? firstArt.resolvedUrl || '' : '',
              cdnVerified: Boolean(firstArt?.cdnVerified),
              cdnStatus: firstArt?.cdnStatus || 'PENDING_BINARY_IMPORT',
              placement: firstArt?.placement || 'inline',
            };
          });

        return NextResponse.json({
          success: true,
          isComingSoon: false,
          releaseVersion,
          releaseCommitSha,
          meta: {
            chapterId: chapter.chapterId,
            pilotId: chapter.pilotId,
            chapterNumber: chapter.chapterNumber,
            title: chapter.title,
            summary:
              chapter.summary ||
              `Chương ${String(chapter.chapterNumber).padStart(2, '0')} — ${chapter.title}`,
            editorialStatus: chapter.editorialStatus,
            status:
              chapter.editorialStatus === 'APPROVED'
                ? 'PUBLISHED'
                : chapter.editorialStatus,
            revision: chapter.revision,
            sourceIntegrity: chapter.sourceIntegrity,
            sourceNote: chapter.sourceNote,
            wordCount: chapter.wordCount || 0,
            readingTimeMinutes: chapter.readingTimeMinutes || 5,
            sceneAnchors,
          },
          content: chapter.content || '',
          blocks: chapter.blocks || [],
          sceneAnchors,
          isReviewMode: true,
        });
      }
    } catch {
      // Fallback to R3 resolver only if R4 channel is unreachable
    }

    if (!isCanonicalPilotId(cleanPilotId)) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy phi công ${pilotId}.` },
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
