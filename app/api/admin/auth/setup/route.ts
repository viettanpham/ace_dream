import { NextRequest, NextResponse } from 'next/server';
import {
  isAuthConfigured,
  initializeAdminCredentials,
  createSessionToken,
  attachSessionCookie,
} from '@/lib/game/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (isAuthConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tài khoản Quản trị viên đã được thiết lập trước đó. Không thể khởi tạo lại.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { username, password, confirmPassword } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng điền đầy đủ tên người dùng và mật khẩu.' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu xác nhận không khớp.' },
        { status: 400 }
      );
    }

    const result = initializeAdminCredentials(username, password);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Khởi tạo thất bại.' },
        { status: 400 }
      );
    }

    // Auto log-in upon successful setup
    const { cookieValue, csrfToken, expiresAt } = createSessionToken(username.trim());

    const res = NextResponse.json({
      success: true,
      message: 'Khởi tạo tài khoản Quản trị viên thành công.',
      user: {
        username: username.trim(),
        role: 'admin',
      },
      csrfToken,
      expiresAt,
    });

    attachSessionCookie(res, cookieValue, expiresAt);
    return res;
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Lỗi: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}
