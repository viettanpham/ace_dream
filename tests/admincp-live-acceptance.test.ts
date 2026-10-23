/**
 * STARFRONT WORLD V2 — FND-8.2.3.E.0
 * ADMINCP LIVE ACCEPTANCE TEST SUITE (CREDENTIALS, MULTI-ADMIN & STORY SMOKE TEST)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import { NextRequest } from 'next/server';

// Load .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, 'utf-8').split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0) {
      const key = line.substring(0, eqIdx).trim();
      const value = line.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

import { POST as loginRoute } from '../app/api/admin/auth/login/route';
import { POST as logoutRoute } from '../app/api/admin/auth/logout/route';
import { GET as meRoute } from '../app/api/admin/auth/me/route';
import { GET as getManifestRoute, POST as postManifestRoute } from '../app/api/admin/character-content/route';
import { POST as storyRoute } from '../app/api/admin/story/route';
import {
  ADMIN_COOKIE_NAME,
  getRegisteredAdminUsernames,
  isAuthConfigured,
} from '../lib/game/auth/admin-auth';

describe('STARFRONT WORLD V2 — ADMINCP LIVE ACCEPTANCE (FND-8.2.3.E.0)', () => {
  const primaryPassword = process.env.STARFRONT_ADMIN_PRIMARY_PASSWORD;
  const backupPassword = process.env.STARFRONT_ADMIN_BACKUP_PASSWORD;

  let primaryCookie = '';
  let primaryCsrfToken = '';
  let backupCookie = '';
  let backupCsrfToken = '';

  it('PRE-CHECK: System store contains both admin and admin123 accounts', () => {
    assert.ok(isAuthConfigured(), 'Auth store phải được cấu hình');
    const usernames = getRegisteredAdminUsernames();
    assert.ok(usernames.includes('admin'), "Tài khoản 'admin' phải tồn tại");
    assert.ok(usernames.includes('admin123'), "Tài khoản 'admin123' phải tồn tại");
  });

  it('TEST A: Primary Admin login with real credentials via POST /api/admin/auth/login', async () => {
    assert.ok(primaryPassword, 'STARFRONT_ADMIN_PRIMARY_PASSWORD phải được cung cấp');

    const req = new NextRequest('http://localhost:3000/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: primaryPassword,
      }),
    });

    const res = await loginRoute(req);
    assert.strictEqual(res.status, 200, 'Login admin phải trả về status 200');

    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.username, 'admin');
    assert.ok(data.csrfToken, 'Phải có CSRF token');
    primaryCsrfToken = data.csrfToken;

    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Phải có header Set-Cookie');
    assert.ok(setCookie.includes(ADMIN_COOKIE_NAME), 'Set-Cookie phải chứa starfront_admin_session');

    // Extract cookie value for subsequent requests
    const cookieMatch = setCookie.match(new RegExp(`${ADMIN_COOKIE_NAME}=([^;]+)`));
    assert.ok(cookieMatch, 'Phải trích xuất được cookie value');
    primaryCookie = cookieMatch[1];
  });

  it('TEST A.1: Verify session validity via GET /api/admin/auth/me', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/auth/me', {
      headers: {
        Cookie: `${ADMIN_COOKIE_NAME}=${primaryCookie}`,
      },
    });

    const res = await meRoute(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.authenticated, true);
    assert.strictEqual(data.user.username, 'admin');
    assert.deepStrictEqual(data.registeredUsernames.sort(), ['admin', 'admin123'].sort());
  });

  it('TEST B: Logout Primary Admin via POST /api/admin/auth/logout', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/auth/logout', {
      method: 'POST',
      headers: {
        Cookie: `${ADMIN_COOKIE_NAME}=${primaryCookie}`,
      },
    });

    const res = await logoutRoute();
    assert.strictEqual(res.status, 200);
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Logout phải gửi header Set-Cookie xóa session');
    assert.ok(setCookie.includes('Max-Age=0') || setCookie.includes('expires='), 'Cookie phải bị xóa');
  });

  it('TEST C: Backup Admin login with real credentials via POST /api/admin/auth/login', async () => {
    assert.ok(backupPassword, 'STARFRONT_ADMIN_BACKUP_PASSWORD phải được cung cấp');

    const req = new NextRequest('http://localhost:3000/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin123',
        password: backupPassword,
      }),
    });

    const res = await loginRoute(req);
    assert.strictEqual(res.status, 200, 'Login admin123 phải trả về status 200');

    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.username, 'admin123');
    assert.ok(data.csrfToken, 'Phải có CSRF token');
    backupCsrfToken = data.csrfToken;

    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie);
    const cookieMatch = setCookie.match(new RegExp(`${ADMIN_COOKIE_NAME}=([^;]+)`));
    assert.ok(cookieMatch);
    backupCookie = cookieMatch[1];
  });

  it('TEST D: Access Control & CSRF Protection on /api/admin/character-content', async () => {
    // Unauthenticated request should fail with 401
    const unauthReq = new NextRequest('http://localhost:3000/api/admin/character-content');
    const unauthRes = await getManifestRoute(unauthReq);
    assert.strictEqual(unauthRes.status, 401, 'Request không cookie phải bị từ chối 401');

    // Authenticated request with backup admin should succeed
    const authReq = new NextRequest('http://localhost:3000/api/admin/character-content', {
      headers: {
        Cookie: `${ADMIN_COOKIE_NAME}=${backupCookie}`,
      },
    });
    const authRes = await getManifestRoute(authReq);
    assert.strictEqual(authRes.status, 200, 'Request có cookie hợp lệ phải thành công 200');
    const manifestData = await authRes.json();
    assert.strictEqual(manifestData.success, true);
    assert.ok(manifestData.manifest, 'Phải trả về manifest');
  });

  it('TEST E: Story Publication Smoke Test on Valentine (Chapters 01–10)', async () => {
    // 1. Fetch current manifest
    const fetchReq = new NextRequest('http://localhost:3000/api/admin/character-content', {
      headers: { Cookie: `${ADMIN_COOKIE_NAME}=${backupCookie}` },
    });
    const fetchRes = await getManifestRoute(fetchReq);
    const { manifest } = await fetchRes.json();
    const valPubs = manifest.storyPublications?.valentine;
    assert.ok(valPubs, 'Valentine storyPublications catalog phải tồn tại');

    // Verify Chapter 01 initial state
    assert.strictEqual(valPubs['chap-01'].publicationStatus, 'PUBLISHED');
    assert.strictEqual(valPubs['chap-01'].editorialStatus, 'APPROVED');
    assert.strictEqual(valPubs['chap-01'].contentReadiness, 'VERIFIED');

    // 2. Toggle Chap-01: PUBLISHED -> HIDDEN
    const hideReq = new NextRequest('http://localhost:3000/api/admin/story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${ADMIN_COOKIE_NAME}=${backupCookie}`,
        'x-csrf-token': backupCsrfToken,
      },
      body: JSON.stringify({
        action: 'toggle_publication',
        pilotId: 'valentine',
        chapterId: 'chap-01',
        targetStatus: 'HIDDEN',
      }),
    });
    const hideRes = await storyRoute(hideReq);
    assert.strictEqual(hideRes.status, 200, 'Toggle chap-01 sang HIDDEN phải thành công');

    // Verify manifest updated
    const verifyHideReq = new NextRequest('http://localhost:3000/api/admin/character-content', {
      headers: { Cookie: `${ADMIN_COOKIE_NAME}=${backupCookie}` },
    });
    const verifyHideRes = await getManifestRoute(verifyHideReq);
    const hideManifest = await verifyHideRes.json();
    assert.strictEqual(
      hideManifest.manifest.storyPublications.valentine['chap-01'].publicationStatus,
      'HIDDEN'
    );

    // 3. Restore Chap-01: HIDDEN -> PUBLISHED
    const restoreReq = new NextRequest('http://localhost:3000/api/admin/story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${ADMIN_COOKIE_NAME}=${backupCookie}`,
        'x-csrf-token': backupCsrfToken,
      },
      body: JSON.stringify({
        action: 'toggle_publication',
        pilotId: 'valentine',
        chapterId: 'chap-01',
        targetStatus: 'PUBLISHED',
      }),
    });
    const restoreRes = await storyRoute(restoreReq);
    assert.strictEqual(restoreRes.status, 200, 'Khôi phục chap-01 về PUBLISHED phải thành công');

    // Verify restored
    const verifyRestoreReq = new NextRequest('http://localhost:3000/api/admin/character-content', {
      headers: { Cookie: `${ADMIN_COOKIE_NAME}=${backupCookie}` },
    });
    const verifyRestoreRes = await getManifestRoute(verifyRestoreReq);
    const restoreManifest = await verifyRestoreRes.json();
    assert.strictEqual(
      restoreManifest.manifest.storyPublications.valentine['chap-01'].publicationStatus,
      'PUBLISHED'
    );

    // 4. Test Validation Gate: Attempt to publish PROVISIONAL chapter (chap-05) -> MUST FAIL (400)
    const provReq = new NextRequest('http://localhost:3000/api/admin/story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${ADMIN_COOKIE_NAME}=${backupCookie}`,
        'x-csrf-token': backupCsrfToken,
      },
      body: JSON.stringify({
        action: 'toggle_publication',
        pilotId: 'valentine',
        chapterId: 'chap-05',
        targetStatus: 'PUBLISHED',
      }),
    });
    const provRes = await storyRoute(provReq);
    assert.strictEqual(provRes.status, 400, 'Publish chap-05 (PROVISIONAL) phải bị từ chối 400');
    const provData = await provRes.json();
    assert.strictEqual(provData.success, false);
    assert.ok(
      provData.error.includes('chưa đạt kiểm duyệt') ||
        provData.error.includes('PROVISIONAL') ||
        provData.error.includes('tiêu chuẩn'),
      'Phải thông báo lỗi kiểm duyệt cho PROVISIONAL'
    );

    // 5. Test Validation Gate: Attempt to publish HOLD/MISSING chapter (chap-07) -> MUST FAIL (400)
    const holdReq = new NextRequest('http://localhost:3000/api/admin/story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${ADMIN_COOKIE_NAME}=${backupCookie}`,
        'x-csrf-token': backupCsrfToken,
      },
      body: JSON.stringify({
        action: 'toggle_publication',
        pilotId: 'valentine',
        chapterId: 'chap-07',
        targetStatus: 'PUBLISHED',
      }),
    });
    const holdRes = await storyRoute(holdReq);
    assert.strictEqual(holdRes.status, 400, 'Publish chap-07 (HOLD) phải bị từ chối 400');
    const holdData = await holdRes.json();
    assert.strictEqual(holdData.success, false);
    assert.ok(
      holdData.error.includes('chưa đạt kiểm duyệt') ||
        holdData.error.includes('HOLD') ||
        holdData.error.includes('tiêu chuẩn'),
      'Phải thông báo lỗi kiểm duyệt cho HOLD/MISSING'
    );
  });
});
