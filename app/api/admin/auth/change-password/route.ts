import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest, changeAdminPassword } from '@/lib/game/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = verifyAdminRequest(req, true);
  if (!auth.authorized || !auth.user) {
    return NextResponse.json(
      { success: false, error: auth.error || 'Yêu cầu quyền Quản trị viên và CSRF Token hợp lệ.' },
      { status: auth.status }
    );
  }

  try {
    const body = await req.json();
    const { oldPassword, newPassword, confirmNewPassword } = body || {};

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp mật khẩu cũ và mật khẩu mới.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmNewPassword) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu mới xác nhận không khớp.' },
        { status: 400 }
      );
    }

    const result = changeAdminPassword(auth.user.username, oldPassword, newPassword);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Không thể đổi mật khẩu.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Đã đổi mật khẩu tài khoản ${auth.user.username} thành công.`,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Lỗi máy chủ: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}
