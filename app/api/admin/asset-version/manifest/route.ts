import { NextRequest, NextResponse } from 'next/server';
import { fetchReleaseManifest } from '@/lib/game/assets/release-manifest';
import { VERSION_TAG_REGEX, CANONICAL_ACTIVE_VERSION } from '@/lib/game/assets/runtime-asset-config';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get('tag') || CANONICAL_ACTIVE_VERSION;
    const force = searchParams.get('force') === 'true';

    if (!tag || !VERSION_TAG_REGEX.test(tag)) {
      return NextResponse.json(
        { success: false, error: `Release tag không đúng định dạng: ${tag}` },
        { status: 400 }
      );
    }

    const manifest = await fetchReleaseManifest(tag, force);

    return NextResponse.json({
      success: true,
      manifest,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Lỗi khi tải manifest.',
      },
      { status: 500 }
    );
  }
}
