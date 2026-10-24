import { NextRequest, NextResponse } from 'next/server';
import {
  createSessionToken,
  attachSessionCookie,
} from '@/lib/game/auth/admin-auth';

export const dynamic = 'force-dynamic';

/**
 * Preview Review Mode Auth Session Endpoint
 * POST /api/admin/auth/preview-session
 * 
 * SECURITY DIRECTIVE:
 * Cơ chế cấp quyền superadmin ẩn danh không xác thực trên Cloud Run public bị VÔ HIỆU HÓA
 * để ngăn chặn việc người dùng vãng lai tự động chiếm quyền AdminCP.
 * Yêu cầu đăng nhập chuẩn thông qua /api/admin/auth/login bằng mật khẩu Quản trị viên.
 */
export async function POST(req: NextRequest) {
  try {
    // Only allow if a dedicated backend preview secret key is explicitly set and matches
    const expectedSecret = process.env.STARFRONT_PREVIEW_SECRET_KEY;
    const providedSecret =
      req.headers.get('x-starfront-preview-secret') ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!expectedSecret || !providedSecret || providedSecret !== expectedSecret) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Cơ chế cấp quyền một chạm ẩn danh đã bị vô hiệu hóa để bảo đảm an toàn hệ thống trên môi trường công khai. Vui lòng đăng nhập với tài khoản Quản trị viên (admin/admin321) cùng mật khẩu đã thiết lập.',
        },
        { status: 403 }
      );
    }

    // Provision superadmin review session if authentic secret is provided
    const { cookieValue, csrfToken, expiresAt } = createSessionToken('admin321', 'superadmin');

    const res = NextResponse.json({
      success: true,
      message: 'Phiên đánh giá Quản trị viên (Superadmin Review Session) đã được xác thực an toàn.',
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

