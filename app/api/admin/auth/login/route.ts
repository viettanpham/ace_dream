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
          errorCode: 'AUTH_RATE_LIMITED',
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
          errorCode: 'AUTH_SYSTEM_NOT_INITIALIZED',
          error: 'Hệ thống Quản trị chưa được khởi tạo. Vui lòng tạo tài khoản Admin lần đầu.',
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'AUTH_MISSING_FIELDS',
          error: 'Vui lòng cung cấp đầy đủ tên đăng nhập và mật khẩu.',
        },
        { status: 400 }
      );
    }

    // 3. Verify credentials
    const authResult = verifyAdminCredentials(username, password);
    if (!authResult.success || !authResult.user) {
      recordLoginAttempt(ip, false);
      const safeCode =
        authResult.errorCode === 'ACCOUNT_NOT_FOUND'
          ? 'AUTH_ACCOUNT_NOT_FOUND'
          : authResult.errorCode === 'INVALID_PASSWORD'
          ? 'AUTH_INVALID_CREDENTIALS'
          : 'AUTH_AUTHENTICATION_FAILED';

      return NextResponse.json(
        {
          success: false,
          errorCode: safeCode,
          error: authResult.error || 'Đăng nhập không thành công.',
        },
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
      sessionToken: cookieValue, // Returned for iframe sessionStorage fallback
      csrfToken,
      expiresAt,
    });

    attachSessionCookie(res, cookieValue, expiresAt);
    return res;
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        errorCode: 'AUTH_SERVER_ERROR',
        error: `Lỗi máy chủ: ${err instanceof Error ? err.message : 'Unknown'}`,
      },
      { status: 500 }
    );
  }
}
