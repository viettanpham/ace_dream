import { NextRequest, NextResponse } from 'next/server';
import {
  isAuthConfigured,
  verifyAdminRequest,
  getRegisteredAdminUsernames,
  isDevAdminPreviewEnabled,
  createSessionToken,
  attachSessionCookie,
  isEligibleLocalDevRequest,
  issueDevAdminSession,
  DEV_AUTH_OVERRIDE_COOKIE,
} from '@/lib/game/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const configured = isAuthConfigured();
  const registeredUsernames = getRegisteredAdminUsernames();
  const isDevPreview = isDevAdminPreviewEnabled();
  const isManualOverride = req.cookies.get(DEV_AUTH_OVERRIDE_COOKIE)?.value === 'manual';

  // 1. Strictly Verified Development Admin Access FIRST
  // (When on localhost loopback or AI Studio Development Preview)
  if (isEligibleLocalDevRequest(req)) {
    const { cookieValue, csrfToken, expiresAt, user } = issueDevAdminSession();
    const res = NextResponse.json({
      authenticated: true,
      configured: true,
      needsSetup: false,
      isDevPreview: false,
      isDevLocalAutoLogin: true,
      registeredUsernames: ['dev_local_admin', ...registeredUsernames],
      user,
      csrfToken,
      sessionToken: cookieValue,
    });
    // Attach cryptographically signed session cookie so all downstream API requests (POST/PUT/DELETE) succeed seamlessly
    attachSessionCookie(res, cookieValue, expiresAt);
    return res;
  }

  // 2. Check existing verified session (cookie or Authorization header)
  const authCheck = verifyAdminRequest(req, false);
  if (authCheck.authorized && authCheck.user) {
    const { cookieValue, csrfToken, expiresAt } = createSessionToken(
      authCheck.user.username,
      authCheck.user.role
    );

    const res = NextResponse.json({
      authenticated: true,
      configured: true,
      needsSetup: false,
      isDevPreview,
      isDevLocalAutoLogin: authCheck.user.username === 'dev_local_admin',
      registeredUsernames:
        registeredUsernames.length > 0 ? registeredUsernames : [authCheck.user.username],
      user: authCheck.user,
      csrfToken: csrfToken,
      sessionToken: cookieValue,
    });
    attachSessionCookie(res, cookieValue, expiresAt);
    return res;
  }

  // 3. Fallback when not authenticated
  if (!configured && !isDevPreview) {
    return NextResponse.json({
      authenticated: false,
      configured: false,
      needsSetup: true,
      isDevPreview: false,
      isDevLocalAutoLogin: false,
      registeredUsernames: [],
      user: null,
    });
  }

  return NextResponse.json({
    authenticated: false,
    configured: true,
    needsSetup: false,
    isDevPreview: false,
    isDevLocalAutoLogin: false,
    registeredUsernames,
    user: null,
  });
}
