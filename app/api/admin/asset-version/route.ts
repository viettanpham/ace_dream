import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/game/auth/admin-auth';
import {
  assetConfigStore,
  computeCdnBaseUrl,
  toPublicAssetConfig,
  appendAuditLog,
  VERSION_TAG_REGEX,
  RuntimeAssetConfig,
} from '@/lib/game/assets/runtime-asset-config';
import { runFastValidation } from '@/lib/game/assets/github-release-validator';

export const dynamic = 'force-dynamic';

/**
 * STARFRONT WORLD V2 — ADMIN ASSET VERSION MUTATION API (WEB-01.3.A.4 & A.5)
 *
 * POST /api/admin/asset-version
 *
 * Strictly protected:
 * 1. Requires valid Admin session cookie (starfront_admin_session).
 * 2. Requires matching x-csrf-token header.
 * 3. Enforces double confirmation (confirmedTagInput === targetVersion).
 * 4. Optimistic concurrency locking (expectedRevision check).
 * 5. Atomic write persistence and immutable audit logging.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  // 1. Authorize admin with CSRF check
  const auth = verifyAdminRequest(req, true);
  if (!auth.authorized || !auth.user) {
    return NextResponse.json(
      {
        success: false,
        error: auth.error || 'Yêu cầu quyền Quản trị viên hợp lệ.',
      },
      { status: auth.status }
    );
  }

  const adminUsername = auth.user.username;

  try {
    const body = await req.json();
    const { action, targetVersion, expectedRevision, confirmedTagInput, comment } = body || {};

    if (!action || (action !== 'ACTIVATE' && action !== 'ROLLBACK')) {
      return NextResponse.json(
        { success: false, error: 'Hành động không hợp lệ (chỉ chấp nhận ACTIVATE hoặc ROLLBACK).' },
        { status: 400 }
      );
    }

    const currentConfig = await assetConfigStore.getConfig();

    // =========================================================================
    // ACTION: ACTIVATE
    // =========================================================================
    if (action === 'ACTIVATE') {
      if (!targetVersion || typeof targetVersion !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Thiếu tên phiên bản phát hành mục tiêu (targetVersion).' },
          { status: 400 }
        );
      }

      const cleanTarget = targetVersion.trim();

      // Check tag format regex
      if (!VERSION_TAG_REGEX.test(cleanTarget)) {
        return NextResponse.json(
          { success: false, error: `Tên Tag không hợp lệ: ${cleanTarget}` },
          { status: 400 }
        );
      }

      // Check if already active
      if (cleanTarget === currentConfig.activeVersion) {
        return NextResponse.json(
          { success: false, error: `Phiên bản ${cleanTarget} hiện đang là phiên bản hoạt động.` },
          { status: 400 }
        );
      }

      // Double Confirmation rule: Admin must have typed the exact tag name
      if (!confirmedTagInput || confirmedTagInput.trim() !== cleanTarget) {
        return NextResponse.json(
          {
            success: false,
            error: `Xác nhận bước 2 thất bại: Chuỗi nhập liệu '${confirmedTagInput}' không khớp với tên Tag '${cleanTarget}'.`,
          },
          { status: 400 }
        );
      }

      // Fast CDN validation before activating
      const fastVal = await runFastValidation(cleanTarget);
      if (!fastVal.valid) {
        appendAuditLog({
          timestamp: new Date().toISOString(),
          action: 'ACTIVATE',
          adminUser: adminUsername,
          previousVersion: currentConfig.activeVersion,
          activeVersion: cleanTarget,
          revision: currentConfig.revision,
          clientIp: ip,
          status: 'FAILED',
          error: fastVal.error || 'Kiểm định Fast Validation thất bại trên CDN.',
        });

        return NextResponse.json(
          {
            success: false,
            error: `Không thể kích hoạt: ${fastVal.error || 'Release không qua kiểm định CDN.'}`,
          },
          { status: 422 }
        );
      }

      // Prepare updated candidate configuration
      const newCdnBase = computeCdnBaseUrl(
        currentConfig.provider,
        currentConfig.repository,
        cleanTarget,
        currentConfig.assetRoot
      );

      const candidateConfig: RuntimeAssetConfig = {
        ...currentConfig,
        activeVersion: cleanTarget,
        cdnBaseUrl: newCdnBase,
        previousVersion: currentConfig.activeVersion,
        previousCdnBaseUrl: currentConfig.cdnBaseUrl,
        updatedBy: adminUsername,
        comment: comment?.trim() || `Activated ${cleanTarget} by ${adminUsername}`,
      };

      const saveResult = await assetConfigStore.saveConfig?.(candidateConfig, expectedRevision);
      if (!saveResult || !saveResult.success) {
        appendAuditLog({
          timestamp: new Date().toISOString(),
          action: 'ACTIVATE',
          adminUser: adminUsername,
          previousVersion: currentConfig.activeVersion,
          activeVersion: cleanTarget,
          revision: currentConfig.revision,
          clientIp: ip,
          status: 'FAILED',
          error: saveResult?.error || 'Lỗi lưu trữ cấu hình.',
        });

        return NextResponse.json(
          {
            success: false,
            error: saveResult?.error || 'Lỗi lưu trữ cấu hình.',
          },
          { status: saveResult?.error?.includes('CONCURRENCY_CONFLICT') ? 409 : 500 }
        );
      }

      // Log success audit
      appendAuditLog({
        timestamp: new Date().toISOString(),
        action: 'ACTIVATE',
        adminUser: adminUsername,
        previousVersion: currentConfig.activeVersion,
        activeVersion: cleanTarget,
        revision: saveResult.newRevision || currentConfig.revision + 1,
        clientIp: ip,
        status: 'SUCCESS',
        comment: candidateConfig.comment || undefined,
      });

      const updated = await assetConfigStore.getConfig();
      return NextResponse.json({
        success: true,
        message: `Đã kích hoạt thành công phiên bản ${cleanTarget} vào runtime.`,
        config: toPublicAssetConfig(updated),
      });
    }

    // =========================================================================
    // ACTION: ROLLBACK
    // =========================================================================
    if (action === 'ROLLBACK') {
      if (!currentConfig.previousVersion) {
        return NextResponse.json(
          { success: false, error: 'Không có phiên bản trước đó để hoàn tác (previousVersion is null).' },
          { status: 400 }
        );
      }

      const targetRollbackTag = currentConfig.previousVersion;
      const targetRollbackCdn =
        currentConfig.previousCdnBaseUrl ||
        computeCdnBaseUrl(
          currentConfig.provider,
          currentConfig.repository,
          targetRollbackTag,
          currentConfig.assetRoot
        );

      const candidateConfig: RuntimeAssetConfig = {
        ...currentConfig,
        activeVersion: targetRollbackTag,
        cdnBaseUrl: targetRollbackCdn,
        previousVersion: currentConfig.activeVersion,
        previousCdnBaseUrl: currentConfig.cdnBaseUrl,
        updatedBy: adminUsername,
        comment: comment?.trim() || `Rollback to ${targetRollbackTag} by ${adminUsername}`,
      };

      const saveResult = await assetConfigStore.saveConfig?.(candidateConfig, expectedRevision);
      if (!saveResult || !saveResult.success) {
        appendAuditLog({
          timestamp: new Date().toISOString(),
          action: 'ROLLBACK',
          adminUser: adminUsername,
          previousVersion: currentConfig.activeVersion,
          activeVersion: targetRollbackTag,
          revision: currentConfig.revision,
          clientIp: ip,
          status: 'FAILED',
          error: saveResult?.error || 'Lỗi lưu trữ khi hoàn tác.',
        });

        return NextResponse.json(
          { success: false, error: saveResult?.error || 'Lỗi lưu trữ khi hoàn tác.' },
          { status: saveResult?.error?.includes('CONCURRENCY_CONFLICT') ? 409 : 500 }
        );
      }

      appendAuditLog({
        timestamp: new Date().toISOString(),
        action: 'ROLLBACK',
        adminUser: adminUsername,
        previousVersion: currentConfig.activeVersion,
        activeVersion: targetRollbackTag,
        revision: saveResult.newRevision || currentConfig.revision + 1,
        clientIp: ip,
        status: 'SUCCESS',
      });

      const updated = await assetConfigStore.getConfig();
      return NextResponse.json({
        success: true,
        message: `Đã hoàn tác thành công về phiên bản ${targetRollbackTag}.`,
        config: toPublicAssetConfig(updated),
      });
    }

    return NextResponse.json({ success: false, error: 'Hành động không xác định.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Lỗi máy chủ: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}
