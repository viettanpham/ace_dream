import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { verifyAdminRequest } from '@/lib/game/auth/admin-auth';
import { getCharacterContentStore } from '@/lib/game/v2/character-content-store';
import {
  CANONICAL_PILOT_IDS,
  CanonicalPilotId,
  ArtworkRegistration,
} from '@/lib/game/v2/character-content-types';

export const dynamic = 'force-dynamic';

/**
 * Real Artwork Binary File Upload Endpoint
 * Handles multipart/form-data for WebP/PNG/JPEG images.
 * Writes verified binary to public/assets/artworks/{pilotId}/ and registers in CharacterContentStore.
 */
export async function POST(req: NextRequest) {
  // 1. Verify Admin Session & CSRF
  const auth = verifyAdminRequest(req, true);
  if (!auth.authorized || !auth.user) {
    return NextResponse.json(
      { success: false, error: auth.error || 'Yêu cầu xác thực Quản trị viên & CSRF.' },
      { status: auth.status }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const pilotId = formData.get('pilotId') as string | null;
    const label = (formData.get('label') as string | null) || 'Tác phẩm mới';
    const category = (formData.get('category') as string | null) || 'lore';
    const roleCategory = (formData.get('roleCategory') as string | null) || 'fullbody';
    const aspectRatio = (formData.get('aspectRatio') as string | null) || '3:4';
    const description = (formData.get('description') as string | null) || '';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Chưa chọn tệp hình ảnh để tải lên.' },
        { status: 400 }
      );
    }

    if (!pilotId || !CANONICAL_PILOT_IDS.includes(pilotId as CanonicalPilotId)) {
      return NextResponse.json(
        { success: false, error: `Pilot ID ${pilotId} không hợp lệ trong 12 phi công Canonical.` },
        { status: 400 }
      );
    }

    // MIME type check
    const allowedMimes = ['image/webp', 'image/png', 'image/jpeg'];
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Định dạng tệp không được hỗ trợ (${file.type}). Chỉ chấp nhận WebP, PNG, JPEG.`,
        },
        { status: 400 }
      );
    }

    // Read bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compute SHA-256 Checksum
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    // Determine extension
    let ext = '.webp';
    if (file.type === 'image/png') ext = '.png';
    else if (file.type === 'image/jpeg') ext = '.jpg';

    // Safe sanitized filename
    const safeBase = roleCategory.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeBase}_${Date.now()}_${sha256.slice(0, 8)}${ext}`;

    // Target directory: public/assets/artworks/{pilotId}/
    const targetDir = path.join(process.cwd(), 'public', 'assets', 'artworks', pilotId);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetFilePath = path.join(targetDir, filename);
    fs.writeFileSync(targetFilePath, buffer);

    const publicUrl = `/assets/artworks/${pilotId}/${filename}`;
    const now = new Date().toISOString();

    const artwork: ArtworkRegistration = {
      assetId: `art_${pilotId}_${Date.now()}`,
      pilotId: pilotId as CanonicalPilotId,
      title: label,
      label,
      category: category as any,
      role: roleCategory as any,
      roleCategory: roleCategory as any,
      slot: roleCategory === 'fullbody' ? 'fullbody' : roleCategory === 'portrait' ? 'portrait' : undefined,
      path: publicUrl,
      sourceUrl: publicUrl,
      localPath: publicUrl,
      aspectRatio: aspectRatio as any,
      status: 'verified',
      verificationStatus: 'VERIFIED',
      isAvailableOnDisk: true,
      description,
      mimeType: file.type,
      checksumSha256: sha256,
      fileSizeBytes: buffer.length,
      displayPriority: 60,
      uploadedAt: now,
      registeredAt: now,
      publishedAt: now,
    };

    const store = getCharacterContentStore();
    const regResult = await store.registerArtwork(artwork, auth.user.username);

    if (!regResult.success) {
      return NextResponse.json(
        { success: false, error: regResult.error || 'Không thể đăng ký tác phẩm vào catalog.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Đã tải lên và xác thực nhị phân tác phẩm cho phi công ${pilotId}.`,
      artwork,
      checksumSha256: sha256,
      fileSizeBytes: buffer.length,
      url: publicUrl,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Lỗi xử lý tải tệp: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}
