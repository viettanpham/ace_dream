import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/game/auth/admin-auth';
import { getRecentAuditLogs } from '@/lib/game/assets/runtime-asset-config';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/asset-version/audit
 * Returns recent audit logs for Admin inspection.
 */
export async function GET(req: NextRequest) {
  const auth = verifyAdminRequest(req, false);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error || 'Yêu cầu quyền Quản trị viên.' },
      { status: auth.status }
    );
  }

  const limitParam = req.nextUrl.searchParams.get('limit');
  const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 25;

  const logs = getRecentAuditLogs(limit);
  return NextResponse.json({
    success: true,
    logs,
  });
}
