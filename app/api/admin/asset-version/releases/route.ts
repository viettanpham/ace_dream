import { NextRequest, NextResponse } from 'next/server';
import { discoverGitHubReleases } from '@/lib/game/assets/github-release-validator';
import { assetConfigStore } from '@/lib/game/assets/runtime-asset-config';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/asset-version/releases
 * Returns discovered GitHub releases with 10-minute server cache.
 */
export async function GET(req: NextRequest) {
  try {
    const forceRefresh = req.nextUrl.searchParams.get('refresh') === 'true';
    const currentConfig = await assetConfigStore.getConfig();
    const activeTag = currentConfig.activeVersion;

    const result = await discoverGitHubReleases(forceRefresh, activeTag);

    return NextResponse.json({
      success: true,
      releases: result.releases,
      fromCache: result.fromCache,
      rateLimited: Boolean(result.rateLimited),
      activeTag,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: `Không thể nạp danh sách releases: ${err instanceof Error ? err.message : 'Unknown'}`,
      },
      { status: 500 }
    );
  }
}
