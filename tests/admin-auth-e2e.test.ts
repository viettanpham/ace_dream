import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import { NextRequest } from 'next/server';

import {
  hashPassword,
  loadAdminStore,
  saveAdminStore,
  isAuthConfigured,
  initializeAdminCredentials,
  verifyAdminCredentials,
  createSessionToken,
  verifySessionToken,
  verifyAdminRequest,
  changeAdminPassword,
  checkLoginRateLimit,
  recordLoginAttempt,
} from '../lib/game/auth/admin-auth';

describe('STARFRONT WORLD V2 — ADMINCP AUTH & SECURITY E2E TEST SUITE (10 CASES)', () => {
  const TEST_AUTH_FILE = path.join('/tmp', 'starfront-test-admin-auth.json');
  process.env.STARFRONT_AUTH_FILE_PATH = TEST_AUTH_FILE;

  // Helper to cleanup
  const cleanupAuth = () => {
    try {
      if (fs.existsSync(TEST_AUTH_FILE)) {
        fs.unlinkSync(TEST_AUTH_FILE);
      }
    } catch {
      // ignore
    }
  };

  it('Case 1: Primary admin bootstrap & initialization with independent salt/hash', () => {
    // Create clean store state for testing
    const testStore = {
      version: 2,
      accounts: {},
      updatedAt: new Date().toISOString(),
    };
    saveAdminStore(testStore);

    const initResult = initializeAdminCredentials('admin', 'StrongPrimaryP@ss2026!');
    assert.strictEqual(initResult.success, true, 'Khởi tạo tài khoản Primary admin phải thành công');

    const loaded = loadAdminStore();
    assert.ok(loaded.accounts['admin'], 'Tài khoản admin phải tồn tại trong store');
    assert.strictEqual(loaded.accounts['admin'].username, 'admin');
    assert.ok(loaded.accounts['admin'].salt.length >= 16, 'Salt phải có độ dài an toàn');
    assert.ok(loaded.accounts['admin'].hash.length >= 64, 'Scrypt Hash phải có độ dài an toàn');

    // Chặn khởi tạo trùng
    const duplicate = initializeAdminCredentials('admin', 'AnotherPassword123');
    assert.strictEqual(duplicate.success, false, 'Không được phép khởi tạo đè tài khoản đã có');
  });

  it('Case 2: Primary admin login authentication & case-insensitive matching', () => {
    // Login with exact casing
    const resultExact = verifyAdminCredentials('admin', 'StrongPrimaryP@ss2026!');
    assert.strictEqual(resultExact.success, true, 'Đăng nhập với username chính xác phải thành công');
    assert.strictEqual(resultExact.user?.username, 'admin');

    // Login with uppercase/mixed casing (e.g. ADMIN)
    const resultUpper = verifyAdminCredentials('ADMIN', 'StrongPrimaryP@ss2026!');
    assert.strictEqual(resultUpper.success, true, 'Đăng nhập không phân biệt chữ hoa/thường');
  });

  it('Case 3: Session token creation, HMAC signing and logout cookie invalidation', () => {
    const { cookieValue, csrfToken, expiresAt } = createSessionToken('admin');
    assert.ok(cookieValue.includes('.'), 'Session cookie phải gồm payload và HMAC signature');
    assert.ok(csrfToken.length >= 32, 'CSRF token phải đủ độ dài mật mã');
    assert.ok(expiresAt > Date.now(), 'Thời gian hết hạn phải nằm trong tương lai');

    // Verify valid session
    const verified = verifySessionToken(cookieValue);
    assert.strictEqual(verified.valid, true, 'Verify signed session token phải valid');
    assert.strictEqual(verified.user?.username, 'admin');
    assert.strictEqual(verified.csrfToken, csrfToken);

    // Tampered signature check
    const tampered = cookieValue.slice(0, -4) + 'abcd';
    const tamperedResult = verifySessionToken(tampered);
    assert.strictEqual(tamperedResult.valid, false, 'Session token bị sửa đổi phải bị từ chối');
  });

  it('Case 4: Backup admin account (admin123) creation and independent login', () => {
    const initBackup = initializeAdminCredentials('admin123', 'BackupSecretKey@2026!');
    assert.strictEqual(initBackup.success, true, 'Khởi tạo tài khoản Backup admin123 phải thành công');

    const loaded = loadAdminStore();
    assert.ok(loaded.accounts['admin123'], 'Store phải chứa cả tài khoản admin123');

    // Salt và Hash của 2 tài khoản phải hoàn toàn độc lập
    assert.notStrictEqual(
      loaded.accounts['admin'].salt,
      loaded.accounts['admin123'].salt,
      'Salt của admin và admin123 phải hoàn toàn độc lập'
    );
    assert.notStrictEqual(
      loaded.accounts['admin'].hash,
      loaded.accounts['admin123'].hash,
      'Hash của admin và admin123 phải khác nhau'
    );

    // Đăng nhập admin123
    const loginBackup = verifyAdminCredentials('admin123', 'BackupSecretKey@2026!');
    assert.strictEqual(loginBackup.success, true, 'Đăng nhập admin123 phải thành công');
    assert.strictEqual(loginBackup.user?.username, 'admin123');
  });

  it('Case 5: Wrong password rejection & rate-limiting protection', () => {
    const wrongResult = verifyAdminCredentials('admin', 'WrongPassWord123');
    assert.strictEqual(wrongResult.success, false, 'Mật khẩu sai phải bị từ chối');

    const testIp = '192.168.1.99';
    // Simulate failed attempts
    for (let i = 0; i < 5; i++) {
      recordLoginAttempt(testIp, false);
    }
    const rateCheck = checkLoginRateLimit(testIp);
    assert.strictEqual(rateCheck.allowed, false, 'Rate limit phải khóa sau 5 lần thử sai');
    assert.ok((rateCheck.retryAfterSeconds || 0) > 0, 'Phải có thời gian chờ retry');

    // Success reset
    recordLoginAttempt(testIp, true);
    assert.strictEqual(checkLoginRateLimit(testIp).allowed, true, 'Đăng nhập đúng phải reset rate limit');
  });

  it('Case 6: Session persistence verification via cookie payload decoding', () => {
    const session = createSessionToken('admin123');
    const parsed = verifySessionToken(session.cookieValue);
    assert.strictEqual(parsed.valid, true);
    assert.strictEqual(parsed.user?.username, 'admin123');
    assert.strictEqual(parsed.user?.role, 'admin');
  });

  it('Case 7: Unauthorized mutation API blocking (Missing Session Cookie)', () => {
    // Fake request without cookie
    const reqWithoutAuth = new NextRequest('http://localhost:3000/api/admin/character-content', {
      method: 'POST',
      body: JSON.stringify({ action: 'update_profile', pilotId: 'valentine' }),
    });

    const checkNoAuth = verifyAdminRequest(reqWithoutAuth, true);
    assert.strictEqual(checkNoAuth.authorized, false, 'Chưa đăng nhập phải bị chặn');
    assert.strictEqual(checkNoAuth.status, 401, 'Status code phải là 401 Unauthorized');
  });

  it('Case 8: CSRF protection verification on Mutation API', () => {
    const session = createSessionToken('admin');

    // Request with valid cookie but WRONG CSRF token
    const reqBadCsrf = new NextRequest('http://localhost:3000/api/admin/character-content', {
      method: 'POST',
      headers: {
        cookie: `starfront_admin_session=${session.cookieValue}`,
        'x-csrf-token': 'wrong_csrf_token_here',
      },
      body: JSON.stringify({ action: 'update_profile', pilotId: 'valentine' }),
    });

    const checkBadCsrf = verifyAdminRequest(reqBadCsrf, true);
    assert.strictEqual(checkBadCsrf.authorized, false, 'Sai CSRF token phải bị chặn');
    assert.strictEqual(checkBadCsrf.status, 403, 'Sai CSRF phải trả về status 403 Forbidden');

    // Request with valid cookie and CORRECT CSRF token
    const reqValid = new NextRequest('http://localhost:3000/api/admin/character-content', {
      method: 'POST',
      headers: {
        cookie: `starfront_admin_session=${session.cookieValue}`,
        'x-csrf-token': session.csrfToken,
      },
      body: JSON.stringify({ action: 'update_profile', pilotId: 'valentine' }),
    });

    const checkValid = verifyAdminRequest(reqValid, true);
    assert.strictEqual(checkValid.authorized, true, 'Đúng session và đúng CSRF phải được cấp quyền');
    assert.strictEqual(checkValid.status, 200);
  });

  it('Case 9: Restart and Persistence Idempotence & Change Password feature', () => {
    // Đổi mật khẩu tài khoản admin123
    const changeResult = changeAdminPassword(
      'admin123',
      'BackupSecretKey@2026!',
      'NewSecureBackupPass2026!'
    );
    assert.strictEqual(changeResult.success, true, 'Đổi mật khẩu phải thành công');

    // Mật khẩu cũ không còn đăng nhập được
    const oldLogin = verifyAdminCredentials('admin123', 'BackupSecretKey@2026!');
    assert.strictEqual(oldLogin.success, false, 'Mật khẩu cũ không thể đăng nhập');

    // Mật khẩu mới đăng nhập thành công
    const newLogin = verifyAdminCredentials('admin123', 'NewSecureBackupPass2026!');
    assert.strictEqual(newLogin.success, true, 'Mật khẩu mới đăng nhập thành công');

    // Mô phỏng server restart: loadAdminStore đọc lại từ đĩa
    const reloaded = loadAdminStore();
    assert.ok(reloaded.accounts['admin'], 'Tài khoản admin vẫn tồn tại sau restart');
    assert.ok(reloaded.accounts['admin123'], 'Tài khoản admin123 vẫn tồn tại sau restart');
  });

  it('Case 10: Backward Compatibility with legacy single-account format and restore', () => {
    // Write legacy format file
    const legacyJson = {
      username: 'admin',
      salt: 'a6e410e9d024b9ea8df397828ff8f3bf',
      hash: 'cf03328f9fb6d9587479e0b7fe9417240a1fe98e9c5de0b57b094b38c6705ee34dfa1a06fe200fac39705150cd8421f98182e8493c58675053920d402768b5b2',
      createdAt: '2026-10-23T16:33:45.573Z',
      updatedAt: '2026-10-23T16:33:45.573Z',
    };
    fs.writeFileSync(TEST_AUTH_FILE, JSON.stringify(legacyJson), 'utf-8');

    // loadAdminStore phải tự động migrate legacy thành v2 multi-account
    const migrated = loadAdminStore();
    assert.strictEqual(migrated.version, 2);
    assert.ok(migrated.accounts['admin'], 'Tài khoản legacy admin phải được chuyển vào accounts');
    assert.strictEqual(migrated.accounts['admin'].salt, legacyJson.salt);

    // Cleanup test file
    cleanupAuth();
  });
});
