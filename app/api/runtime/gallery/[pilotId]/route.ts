import { NextRequest, NextResponse } from 'next/server';
import { universalContentResolver } from '@/lib/game/v2/universal-content-resolver';
import { fetchPilotManifest } from '@/lib/game/assets/hierarchical-manifest';
import { assetConfigStore } from '@/lib/game/assets/runtime-asset-config';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ pilotId: string }>;
}

/**
 * Dynamic Gallery API per Pilot (CP3-A Universal CDN R3)
 * GET /api/runtime/gallery/[pilotId]
 * Fetches dynamic artwork list from R3 gallery.json + files.json
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { pilotId } = await params;
    const cleanPilotId = pilotId.toLowerCase().trim();

    // 1. Try Universal Content Resolver (R3 first, deduplicated with curated descriptions)
    const galleryR3 = await universalContentResolver.getPilotGallery(cleanPilotId);
    if (galleryR3 && galleryR3.artworks.length > 0) {
      return NextResponse.json({
        success: true,
        pilotId: cleanPilotId,
        pilotName: galleryR3.pilotName,
        totalAssets: galleryR3.totalAssets,
        approvedAssetsCount: galleryR3.approvedAssetsCount,
        artworks: galleryR3.artworks,
        coreMapping: galleryR3.coreMapping,
      });
    }

    // 2. Fallback to hierarchical manifest engine
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
