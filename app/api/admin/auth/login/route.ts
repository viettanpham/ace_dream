import { NextRequest, NextResponse } from 'next/server';
import {
  checkLoginRateLimit,
  recordLoginAttempt,
  verifyAdminCredentials,
  createSessionToken,
  attachSessionCookie,
  isAuthConfigured,
} from '@/lib/game/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // 1. Check rate limit
    const rateCheck = checkLoginRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Quá nhiều lần thử thất bại. Vui lòng thử lại sau ${rateCheck.retryAfterSeconds} giây.`,
        },
        { status: 429 }
      );
    }

    // 2. Check if admin configured
    if (!isAuthConfigured()) {
      return NextResponse.json(
        {
          success: false,
          needsSetup: true,
          error: 'Hệ thống Quản trị chưa được khởi tạo. Vui lòng tạo tài khoản Admin lần đầu.',
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp đầy đủ tên đăng nhập và mật khẩu.' },
        { status: 400 }
      );
    }

    // 3. Verify credentials
    const authResult = verifyAdminCredentials(username, password);
    if (!authResult.success || !authResult.user) {
      recordLoginAttempt(ip, false);
      return NextResponse.json(
        { success: false, error: authResult.error || 'Đăng nhập không thành công.' },
        { status: 401 }
      );
    }

    // 4. Record success, create session & CSRF token
    recordLoginAttempt(ip, true);
    const { cookieValue, csrfToken, expiresAt } = createSessionToken(authResult.user.username);

    const res = NextResponse.json({
      success: true,
      message: 'Đăng nhập Quản trị viên thành công.',
      user: authResult.user,
      csrfToken,
      expiresAt,
    });

    attachSessionCookie(res, cookieValue, expiresAt);
    return res;
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Lỗi máy chủ: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}
