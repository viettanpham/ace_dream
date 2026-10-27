import { NextRequest, NextResponse } from 'next/server';
import {
  clearSessionCookie,
  setDevAuthOverrideCookie,
} from '@/lib/game/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'enable_auto';

    const res = NextResponse.json({
      success: true,
      action,
      message:
        action === 'enable_auto'
          ? 'Đã bật chế độ Tự động đăng nhập DEV Local.'
          : 'Đã chuyển sang chế độ Đăng nhập Thủ công.',
    });

    if (action === 'enable_auto') {
      setDevAuthOverrideCookie(res, 'auto');
    } else {
      clearSessionCookie(res);
      setDevAuthOverrideCookie(res, 'manual');
    }

    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
