import { NextRequest, NextResponse } from 'next/server';
import { fetchReleaseManifest, computeVersionDiff } from '@/lib/game/assets/release-manifest';
import { VERSION_TAG_REGEX, CANONICAL_ACTIVE_VERSION } from '@/lib/game/assets/runtime-asset-config';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeTag = searchParams.get('activeTag') || CANONICAL_ACTIVE_VERSION;
    const targetTag = searchParams.get('targetTag') || activeTag;
    const force = searchParams.get('force') === 'true';

    if (!activeTag || !VERSION_TAG_REGEX.test(activeTag)) {
      return NextResponse.json(
        { success: false, error: `Active tag không đúng định dạng: ${activeTag}` },
        { status: 400 }
      );
    }

    if (!targetTag || !VERSION_TAG_REGEX.test(targetTag)) {
      return NextResponse.json(
        { success: false, error: `Target tag không đúng định dạng: ${targetTag}` },
        { status: 400 }
      );
    }

    const [activeManifest, targetManifest] = await Promise.all([
      fetchReleaseManifest(activeTag, force),
      fetchReleaseManifest(targetTag, force),
    ]);

    const diffSummary = computeVersionDiff(activeManifest, targetManifest);

    return NextResponse.json({
      success: true,
      diff: diffSummary,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Lỗi khi so sánh phiên bản.',
      },
      { status: 500 }
    );
  }
}
