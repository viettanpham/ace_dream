import { NextRequest, NextResponse } from 'next/server';
import {
  isAuthConfigured,
  verifyAdminRequest,
  getRegisteredAdminUsernames,
  isDevAdminPreviewEnabled,
  createSessionToken,
} from '@/lib/game/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const configured = isAuthConfigured();
  const registeredUsernames = getRegisteredAdminUsernames();
  const isDevPreview = isDevAdminPreviewEnabled();

  const authCheck = verifyAdminRequest(req, false);

  if (authCheck.authorized && authCheck.user) {
    const { cookieValue, csrfToken } = createSessionToken(
      authCheck.user.username,
      authCheck.user.role
    );

    return NextResponse.json({
      authenticated: true,
      configured: true,
      needsSetup: false,
      isDevPreview,
      registeredUsernames: registeredUsernames.length > 0 ? registeredUsernames : [authCheck.user.username],
      user: authCheck.user,
      csrfToken: authCheck.csrfToken || csrfToken,
      sessionToken: cookieValue,
    });
  }

  if (!configured && !isDevPreview) {
    return NextResponse.json({
      authenticated: false,
      configured: false,
      needsSetup: true,
      isDevPreview: false,
      registeredUsernames: [],
      user: null,
    });
  }

  return NextResponse.json({
    authenticated: false,
    configured: true,
    needsSetup: false,
    isDevPreview: false,
    registeredUsernames,
    user: null,
  });
}

