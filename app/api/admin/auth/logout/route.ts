import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/game/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({
    success: true,
    message: 'Đã đăng xuất phiên làm việc Quản trị viên.',
  });
  clearSessionCookie(res);
  return res;
}
