import { NextRequest, NextResponse } from 'next/server';
import { fetchPilotManifest } from '@/lib/game/assets/hierarchical-manifest';
import { assetConfigStore } from '@/lib/game/assets/runtime-asset-config';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ pilotId: string }>;
}

/**
 * Dynamic Gallery API per Pilot
 * GET /api/runtime/gallery/[pilotId]
 * Fetches dynamic artwork list from files.json + gallery.json on the active CDN release (e.g. v2.0-assets-r2)
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { pilotId } = await params;
    const cleanPilotId = pilotId.toLowerCase().trim();
    const config = assetConfigStore.getConfigSync();

    const pilotManifest = await fetchPilotManifest(config.cdnBaseUrl, config.activeVersion, cleanPilotId);
    if (!pilotManifest) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy danh mục ảnh cho phi công ${cleanPilotId}.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      pilotId: cleanPilotId,
      pilotName: pilotManifest.pilotName,
      totalAssets: pilotManifest.totalAssets,
      approvedAssetsCount: pilotManifest.approvedAssetsCount,
      artworks: pilotManifest.artworks,
      coreMapping: pilotManifest.coreMapping,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Lỗi truy xuất thư viện ảnh: ${message}` },
      { status: 500 }
    );
  }
}
