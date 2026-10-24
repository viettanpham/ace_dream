import { NextRequest, NextResponse } from 'next/server';
import { generateHierarchicalManifestBundle } from '@/lib/game/assets/hierarchical-manifest';
import { assetConfigStore } from '@/lib/game/assets/runtime-asset-config';

export async function GET(req: NextRequest) {
  try {
    const config = assetConfigStore.getConfigSync();
    const cdnBase = config.cdnBaseUrl;
    const activeVersion = config.activeVersion;

    const bundle = await generateHierarchicalManifestBundle(cdnBase, activeVersion);

    return NextResponse.json({
      success: true,
      cdnBaseUrl: cdnBase,
      activeVersion,
      bundle,
      summary: {
        totalPilots: Object.keys(bundle.pilotManifests).length,
        totalArtworks: Object.values(bundle.pilotManifests).reduce(
          (acc, p) => acc + (p.approvedAssetsCount || 0),
          0
        ),
        pilotCounts: Object.entries(bundle.pilotManifests).reduce(
          (acc, [pid, p]) => {
            acc[pid] = p.approvedAssetsCount;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate hierarchical manifest bundle',
      },
      { status: 500 }
    );
  }
}
