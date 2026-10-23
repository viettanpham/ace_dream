import { NextRequest, NextResponse } from 'next/server';
import {
  isAuthConfigured,
  verifyAdminRequest,
  getRegisteredAdminUsernames,
} from '@/lib/game/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const configured = isAuthConfigured();
  const registeredUsernames = getRegisteredAdminUsernames();

  if (!configured) {
    return NextResponse.json({
      authenticated: false,
      configured: false,
      needsSetup: true,
      registeredUsernames: [],
      user: null,
    });
  }

  const authCheck = verifyAdminRequest(req, false);

  if (!authCheck.authorized || !authCheck.user) {
    return NextResponse.json({
      authenticated: false,
      configured: true,
      needsSetup: false,
      registeredUsernames,
      user: null,
    });
  }

  return NextResponse.json({
    authenticated: true,
    configured: true,
    needsSetup: false,
    registeredUsernames,
    user: authCheck.user,
    csrfToken: authCheck.csrfToken,
  });
}

