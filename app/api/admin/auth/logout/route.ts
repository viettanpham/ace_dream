import { NextResponse } from 'next/server';
import { clearSessionCookie, setDevAuthOverrideCookie } from '@/lib/game/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({
    success: true,
    message: 'Đã đăng xuất phiên làm việc Quản trị viên và tạm dừng tự động đăng nhập DEV.',
  });

  // Clear session cookie
  clearSessionCookie(res);

  // Set manual override cookie so auto-login doesn't immediately re-authenticate on logout
  setDevAuthOverrideCookie(res, 'manual');

  return res;
}
