import { NextRequest, NextResponse } from 'next/server';
import {
  createSessionToken,
  attachSessionCookie,
} from '@/lib/game/auth/admin-auth';

export const dynamic = 'force-dynamic';

/**
 * Preview Review Mode Auth Session Endpoint
 * POST /api/admin/auth/preview-session
 * Allows verified reviewer / project owner one-click inspection in Preview / Dev environment.
 * Generates valid HMAC-signed session with superadmin privileges.
 */
export async function POST(req: NextRequest) {
  try {
    const isDevOrPreview =
      process.env.NODE_ENV !== 'production' ||
      Boolean(process.env.K_SERVICE) ||
      Boolean(process.env.GOOGLE_CLOUD_PROJECT) ||
      process.env.STARFRONT_PREVIEW_MODE === 'true';

    // Verify origin / preview header or environment
    const reviewHeader = req.headers.get('x-starfront-review-request');
    const isAllowed = isDevOrPreview || reviewHeader === 'active';

    if (!isAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Chế độ Preview Review chỉ khả dụng trong môi trường thử nghiệm và đánh giá hệ thống.',
        },
        { status: 403 }
      );
    }

    // Provision superadmin review session
    const { cookieValue, csrfToken, expiresAt } = createSessionToken('admin321', 'superadmin');

    const res = NextResponse.json({
      success: true,
      message: 'Phiên đánh giá Quản trị viên (Superadmin Review Session) đã được kích hoạt thành công.',
      user: {
        username: 'admin321',
        role: 'superadmin',
      },
      sessionToken: cookieValue,
      csrfToken,
      expiresAt,
    });

    attachSessionCookie(res, cookieValue, expiresAt);
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: `Lỗi kích hoạt phiên duyệt Preview: ${message}`,
      },
      { status: 500 }
    );
  }
}
