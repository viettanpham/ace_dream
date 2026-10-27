import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import {
  isEligibleLocalDevRequest,
  issueDevAdminSession,
  verifySessionToken,
  verifyAdminRequest,
  DEV_AUTH_OVERRIDE_COOKIE,
  ADMIN_COOKIE_NAME,
} from '../lib/game/auth/admin-auth';

describe('STARFRONT WORLD V2 — ADMINCP AUTH DEV DIRECT ACCESS TEST SUITE', () => {
  const originalEnv = { ...process.env };

  const restoreEnv = () => {
    process.env = { ...originalEnv };
  };

  it('TC-01: Local DEV hợp lệ (localhost + flag=true) => Cho phép Auto-Provisioning', () => {
    process.env.NODE_ENV = 'development';
    process.env.STARFRONT_ALLOW_LOCAL_DEV_AUTH_BYPASS = 'true';

    const req = new NextRequest('http://localhost:3000/api/admin/auth/me', {
      headers: {
        host: 'localhost:3000',
      },
    });

    const isEligible = isEligibleLocalDevRequest(req);
    assert.equal(isEligible, true, 'Request localhost với flag=true phải đủ điều kiện');

    const devSession = issueDevAdminSession();
    assert.equal(devSession.user.username, 'dev_local_admin');
    assert.equal(devSession.user.role, 'superadmin');

    // Token must be cryptographically valid
    const verified = verifySessionToken(devSession.cookieValue);
    assert.equal(verified.valid, true);
    assert.equal(verified.user?.username, 'dev_local_admin');
    assert.equal(verified.user?.role, 'superadmin');
    assert.ok(verified.csrfToken);

    restoreEnv();
  });

  it('TC-02: Local DEV khi cờ STARFRONT_ALLOW_LOCAL_DEV_AUTH_BYPASS bị tắt => Từ chối', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.STARFRONT_ALLOW_LOCAL_DEV_AUTH_BYPASS;

    const req = new NextRequest('http://localhost:3000/api/admin/auth/me', {
      headers: { host: 'localhost:3000' },
    });

    const isEligible = isEligibleLocalDevRequest(req);
    assert.equal(isEligible, false, 'Khi thiếu biến cờ phải từ chối bypass');

    restoreEnv();
  });

  it('TC-03: Production (NODE_ENV=production) => Cấm tuyệt đối dù có cờ', () => {
    process.env.NODE_ENV = 'production';
    process.env.STARFRONT_ALLOW_LOCAL_DEV_AUTH_BYPASS = 'true';

    const req = new NextRequest('http://localhost:3000/api/admin/auth/me', {
      headers: { host: 'localhost:3000' },
    });

    const isEligible = isEligibleLocalDevRequest(req);
    assert.equal(isEligible, false, 'Môi trường production bắt buộc cấm bypass');

    restoreEnv();
  });

  it('TC-04: Cloud Run / Google Cloud Ingress Headers => Cấm tuyệt đối', () => {
    process.env.NODE_ENV = 'development';
    process.env.STARFRONT_ALLOW_LOCAL_DEV_AUTH_BYPASS = 'true';

    // Request from Cloud Run containing trace header
    const req = new NextRequest('http://localhost:3000/api/admin/auth/me', {
      headers: {
        host: 'localhost:3000',
        'x-cloud-trace-context': '105445aa7843bc8bf206b120001000/1;o=1',
      },
    });

    const isEligible = isEligibleLocalDevRequest(req);
    assert.equal(isEligible, false, 'Yêu cầu có x-cloud-trace-context phải bị chặn');

    restoreEnv();
  });

  it('TC-05: Remote Domain / Public Cloud Run URL => Cấm tuyệt đối', () => {
    process.env.NODE_ENV = 'development';
    process.env.STARFRONT_ALLOW_LOCAL_DEV_AUTH_BYPASS = 'true';

    const req = new NextRequest('https://ais-dev-xrgotl42saoyikd7ywy2dt.run.app/api/admin/auth/me', {
      headers: {
        host: 'ais-dev-xrgotl42saoyikd7ywy2dt.run.app',
        'x-forwarded-host': 'ais-dev-xrgotl42saoyikd7ywy2dt.run.app',
      },
    });

    const isEligible = isEligibleLocalDevRequest(req);
    assert.equal(isEligible, false, 'Tên miền *.run.app không được phép tự cấp quyền');

    restoreEnv();
  });

  it('TC-06: Người dùng chọn Đăng nhập Thủ công (Manual Override Cookie) => Tạm dừng Auto-login', () => {
    process.env.NODE_ENV = 'development';
    process.env.STARFRONT_ALLOW_LOCAL_DEV_AUTH_BYPASS = 'true';

    const req = new NextRequest('http://localhost:3000/api/admin/auth/me', {
      headers: {
        host: 'localhost:3000',
        cookie: `${DEV_AUTH_OVERRIDE_COOKIE}=manual`,
      },
    });

    const isEligible = isEligibleLocalDevRequest(req);
    assert.equal(isEligible, false, 'Khi có cookie override manual, auto-login phải tạm dừng');

    restoreEnv();
  });

  it('TC-07: Phiên Dev Session xác thực chuẩn xác qua verifyAdminRequest với đầy đủ CSRF Guard', () => {
    process.env.NODE_ENV = 'development';
    const devSession = issueDevAdminSession();

    // Simulating POST request with valid CSRF header and dev session cookie
    const req = new NextRequest('http://localhost:3000/api/admin/character-content', {
      method: 'POST',
      headers: {
        host: 'localhost:3000',
        cookie: `${ADMIN_COOKIE_NAME}=${devSession.cookieValue}`,
        'x-csrf-token': devSession.csrfToken,
      },
    });

    const authRes = verifyAdminRequest(req, true);
    assert.equal(authRes.authorized, true);
    assert.equal(authRes.user?.username, 'dev_local_admin');
    assert.equal(authRes.user?.role, 'superadmin');

    // Missing CSRF must fail
    const invalidCsrfReq = new NextRequest('http://localhost:3000/api/admin/character-content', {
      method: 'POST',
      headers: {
        host: 'localhost:3000',
        cookie: `${ADMIN_COOKIE_NAME}=${devSession.cookieValue}`,
        'x-csrf-token': 'wrong-token',
      },
    });
    const invalidCsrfRes = verifyAdminRequest(invalidCsrfReq, true);
    assert.equal(invalidCsrfRes.authorized, false);
    assert.equal(invalidCsrfRes.status, 403);

    restoreEnv();
  });
});
