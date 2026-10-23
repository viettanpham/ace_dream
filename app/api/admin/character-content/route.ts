import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/game/auth/admin-auth';
import { getCharacterContentStore } from '@/lib/game/v2/character-content-store';
import {
  CANONICAL_PILOT_IDS,
  CanonicalPilotId,
  ArtworkRegistration,
  CharacterProfileContentRecord,
} from '@/lib/game/v2/character-content-types';

export const dynamic = 'force-dynamic';

/**
 * Admin Character Content Manager API
 * GET /api/admin/character-content
 * POST /api/admin/character-content (update_profile, register_artwork, update_artwork, delete_artwork)
 */

export async function GET(req: NextRequest) {
  const auth = verifyAdminRequest(req, false);
  if (!auth.authorized || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error || 'Yêu cầu đăng nhập Quản trị viên.' }, { status: auth.status });
  }

  try {
    const store = getCharacterContentStore();
    const manifest = await store.getManifest();

    return NextResponse.json({
      success: true,
      user: auth.user.username,
      csrfToken: auth.csrfToken,
      manifest,
      canonicalPilots: CANONICAL_PILOT_IDS,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: `Lỗi tải dữ liệu quản trị: ${message}` }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyAdminRequest(req, true);
  if (!auth.authorized || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error || 'Yêu cầu xác thực Quản trị viên & CSRF.' }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { action, pilotId } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Thiếu tham số action.' }, { status: 400 });
    }

    if (!pilotId || !CANONICAL_PILOT_IDS.includes(pilotId as CanonicalPilotId)) {
      return NextResponse.json({ success: false, error: `Pilot ID ${pilotId} không hợp lệ trong 12 phi công chuẩn.` }, { status: 400 });
    }

    const pId = pilotId as CanonicalPilotId;
    const store = getCharacterContentStore();

    if (action === 'update_profile') {
      const updates = body.profileUpdates as Partial<CharacterProfileContentRecord>;
      if (!updates || typeof updates !== 'object') {
        return NextResponse.json({ success: false, error: 'Dữ liệu cập nhật hồ sơ không hợp lệ.' }, { status: 400 });
      }

      const updated = await store.updateProfile(pId, updates, auth.user.username);
      return NextResponse.json({
        success: true,
        message: `Đã cập nhật hồ sơ phi công ${pId} thành công.`,
        profile: updated,
      });
    }

    if (action === 'register_artwork') {
      const artwork = body.artwork as ArtworkRegistration;
      if (!artwork || !artwork.label || !artwork.sourceUrl) {
        return NextResponse.json({ success: false, error: 'Thiếu thông tin hình ảnh (label, sourceUrl).' }, { status: 400 });
      }

      const fullArt: ArtworkRegistration = {
        ...artwork,
        assetId: artwork.assetId || artwork.artworkId || `art_${pId}_${Date.now()}`,
        pilotId: pId,
        title: artwork.title || artwork.label || 'Tác phẩm mới',
        category: artwork.category || 'lore',
        path: artwork.path || artwork.sourceUrl || '',
        status: artwork.status || 'verified',
        mimeType: artwork.mimeType || 'image/webp',
      };

      const result = await store.registerArtwork(fullArt, auth.user.username);
      return NextResponse.json({
        success: result.success,
        message: result.success
          ? `Đã đăng ký tác phẩm mới cho phi công ${pId}.`
          : result.error,
      });
    }

    if (action === 'update_artwork') {
      const artworkId = body.artworkId as string;
      const updates = body.artworkUpdates as Partial<ArtworkRegistration>;
      if (!artworkId || !updates) {
        return NextResponse.json({ success: false, error: 'Thiếu artworkId hoặc dữ liệu cập nhật.' }, { status: 400 });
      }

      const updated = await store.updateArtwork(pId, artworkId, updates, auth.user.username);
      return NextResponse.json({
        success: true,
        message: `Đã cập nhật tác phẩm ${artworkId} thành công.`,
        artworks: updated,
      });
    }

    if (action === 'delete_artwork') {
      const artworkId = body.artworkId as string;
      if (!artworkId) {
        return NextResponse.json({ success: false, error: 'Thiếu artworkId cần xóa.' }, { status: 400 });
      }

      const updated = await store.deleteArtwork(pId, artworkId, auth.user.username);
      return NextResponse.json({
        success: true,
        message: `Đã gỡ tác phẩm ${artworkId} khỏi phi công ${pId}.`,
        artworks: updated,
      });
    }

    return NextResponse.json({ success: false, error: `Action ${action} không được hỗ trợ.` }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: `Lỗi xử lý yêu cầu: ${message}` }, { status: 500 });
  }
}
