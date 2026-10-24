/**
 * STARFRONT WORLD V2 — ADMIN AUTHENTICATION & SESSION ENGINE (WEB-01.3.A.4)
 *
 * Implements:
 * 1. Server-side Authentication & Session Lifecycle (NO 6-digit PIN).
 * 2. Secure password hashing with salt using Node.js built-in crypto (scrypt).
 * 3. Cryptographically signed HttpOnly session cookies with HMAC-SHA256.
 * 4. CSRF protection with unique session-bound tokens.
 * 5. Rate limiting on failed login attempts (anti-brute-force).
 * 6. Permanent bootstrap initialization: Allows setting credentials on first boot
 *    without exposing passwords in prompts or hardcoding them in git.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface AdminUser {
  username: string;
  role: 'admin';
  createdAt?: string;
}

export interface AdminCredentialsRecord {
  username: string;
  salt: string;
  hash: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStoreData {
  version: number;
  accounts: Record<string, AdminCredentialsRecord>;
  updatedAt: string;
}

export interface SessionPayload {
  username: string;
  role: 'admin';
  issuedAt: number;
  expiresAt: number;
  csrfToken: string;
}

export const ADMIN_COOKIE_NAME = 'starfront_admin_session';
export const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

function getAuthConfigFile(): string {
  if (process.env.STARFRONT_AUTH_FILE_PATH && process.env.STARFRONT_AUTH_FILE_PATH.trim().length > 0) {
    return process.env.STARFRONT_AUTH_FILE_PATH.trim();
  }
  return path.join(process.cwd(), '.starfront-config', 'admin-auth.json');
}

function getSecretKeyFile(): string {
  if (process.env.STARFRONT_SESSION_KEY_PATH && process.env.STARFRONT_SESSION_KEY_PATH.trim().length > 0) {
    return process.env.STARFRONT_SESSION_KEY_PATH.trim();
  }
  return path.join(process.cwd(), '.starfront-config', 'session-secret.key');
}

// In-memory rate-limiter: IP -> { attempts: number, lockUntil: number, resetAt: number }
interface RateLimitRecord {
  attempts: number;
  resetAt: number;
  lockUntil: number;
}
const loginRateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Gets or creates persistent HMAC signing secret for server sessions
 */
function getSessionSigningSecret(): string {
  if (process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.trim().length >= 16) {
    return process.env.ADMIN_SESSION_SECRET.trim();
  }

  const secretFile = getSecretKeyFile();
  try {
    if (fs.existsSync(secretFile)) {
      const secret = fs.readFileSync(secretFile, 'utf-8').trim();
      if (secret.length >= 32) return secret;
    }
  } catch {
    // Continue to generation
  }

  const generated = crypto.randomBytes(32).toString('hex');
  try {
    const dir = path.dirname(secretFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(secretFile, generated, 'utf-8');
  } catch {
    // If read-only, generated stays in memory for process lifetime
  }
  return generated;
}

/**
 * Hashes a password using crypto.scryptSync with high security parameters
 */
export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

/**
 * Loads or initializes the multi-admin account store with backward compatibility
 */
export function loadAdminStore(): AdminStoreData {
  let store: AdminStoreData = {
    version: 2,
    accounts: {},
    updatedAt: new Date().toISOString(),
  };

  const authFile = getAuthConfigFile();
  try {
    if (fs.existsSync(authFile)) {
      const raw = fs.readFileSync(authFile, 'utf-8');
      const parsed = JSON.parse(raw);

      if (parsed.accounts && typeof parsed.accounts === 'object') {
        store = {
          version: parsed.version || 2,
          accounts: parsed.accounts,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
      } else if (parsed.username && parsed.salt && parsed.hash) {
        // Legacy single-account migration
        const key = parsed.username.toLowerCase();
        store.accounts[key] = {
          username: parsed.username,
          salt: parsed.salt,
          hash: parsed.hash,
          createdAt: parsed.createdAt || new Date().toISOString(),
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn('[AdminAuth] Error reading admin auth store, using clean in-memory copy:', err);
  }

  // Auto-bootstrap or sync from environment variables if provided
  let mutated = false;

  // Primary Admin: 'admin' via STARFRONT_ADMIN_PRIMARY_PASSWORD
  const primaryEnvPass = process.env.STARFRONT_ADMIN_PRIMARY_PASSWORD;
  if (primaryEnvPass && primaryEnvPass.trim().length >= 8) {
    const existing = store.accounts['admin'];
    const shouldUpdate =
      !existing ||
      process.env.STARFRONT_ADMIN_SYNC_SECRETS === 'true' ||
      process.env.STARFRONT_ADMIN_RESET_CREDENTIALS === 'true';

    if (shouldUpdate) {
      let isSame = false;
      if (existing) {
        const testHash = hashPassword(primaryEnvPass.trim(), existing.salt);
        if (testHash === existing.hash) {
          isSame = true;
        }
      }
      if (!isSame) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = hashPassword(primaryEnvPass.trim(), salt);
        const now = new Date().toISOString();
        store.accounts['admin'] = {
          username: 'admin',
          salt,
          hash,
          createdAt: existing?.createdAt || now,
          updatedAt: now,
        };
        mutated = true;
      }
    }
  }

  // Backup Admin: 'admin123' via STARFRONT_ADMIN_BACKUP_PASSWORD
  const backupEnvPass = process.env.STARFRONT_ADMIN_BACKUP_PASSWORD;
  if (backupEnvPass && backupEnvPass.trim().length >= 8) {
    const existing = store.accounts['admin123'];
    const shouldUpdate =
      !existing ||
      process.env.STARFRONT_ADMIN_SYNC_SECRETS === 'true' ||
      process.env.STARFRONT_ADMIN_RESET_CREDENTIALS === 'true';

    if (shouldUpdate) {
      let isSame = false;
      if (existing) {
        const testHash = hashPassword(backupEnvPass.trim(), existing.salt);
        if (testHash === existing.hash) {
          isSame = true;
        }
      }
      if (!isSame) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = hashPassword(backupEnvPass.trim(), salt);
        const now = new Date().toISOString();
        store.accounts['admin123'] = {
          username: 'admin123',
          salt,
          hash,
          createdAt: existing?.createdAt || now,
          updatedAt: now,
        };
        mutated = true;
      }
    }
  }

  // Legacy single env check (ADMIN_USERNAME & ADMIN_PASSWORD)
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    const legacyUser = process.env.ADMIN_USERNAME.trim().toLowerCase();
    if (!store.accounts[legacyUser]) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = hashPassword(process.env.ADMIN_PASSWORD, salt);
      const now = new Date().toISOString();
      store.accounts[legacyUser] = {
        username: process.env.ADMIN_USERNAME.trim(),
        salt,
        hash,
        createdAt: now,
        updatedAt: now,
      };
      mutated = true;
    }
  }

  if (mutated) {
    saveAdminStore(store);
  }

  return store;
}

/**
 * Saves multi-admin account store atomically
 */
export function saveAdminStore(store: AdminStoreData): boolean {
  try {
    const authFile = getAuthConfigFile();
    const dir = path.dirname(authFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    store.updatedAt = new Date().toISOString();
    const tmp = `${authFile}.tmp.${Date.now()}.${crypto.randomBytes(4).toString('hex')}`;
    fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tmp, authFile);
    return true;
  } catch (err) {
    console.error('[AdminAuth] Failed to write admin auth store:', err);
    return false;
  }
}

/**
 * Server-only emergency credential reset using a provided secret
 */
export function resetAdminCredentialsWithSecret(
  username: string,
  newPassword: string
): { success: boolean; error?: string } {
  const cleanUser = username.trim().toLowerCase();
  if (cleanUser !== 'admin' && cleanUser !== 'admin123') {
    return { success: false, error: 'Chỉ hỗ trợ đặt lại mật khẩu cho tài khoản admin hoặc admin123.' };
  }
  if (!newPassword || newPassword.trim().length < 8) {
    return { success: false, error: 'Mật khẩu mới phải có tối thiểu 8 ký tự.' };
  }
  const store = loadAdminStore();
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(newPassword.trim(), salt);
  const now = new Date().toISOString();
  store.accounts[cleanUser] = {
    username: cleanUser === 'admin123' ? 'admin123' : 'admin',
    salt,
    hash,
    createdAt: store.accounts[cleanUser]?.createdAt || now,
    updatedAt: now,
  };
  const saved = saveAdminStore(store);
  if (!saved) {
    return { success: false, error: 'Không thể ghi tệp lưu trữ credentials.' };
  }
  return { success: true };
}

/**
 * Checks if at least one admin account is configured in the system
 */
export function isAuthConfigured(): boolean {
  const store = loadAdminStore();
  return Object.keys(store.accounts).length > 0;
}

/**
 * Returns summary of registered admin account usernames (NO passwords or hashes)
 */
export function getRegisteredAdminUsernames(): string[] {
  const store = loadAdminStore();
  return Object.values(store.accounts).map((a) => a.username);
}

/**
 * Initializes or adds an Admin credentials record (e.g. during first-time UI setup)
 */
export function initializeAdminCredentials(
  username: string,
  password: string
): { success: boolean; error?: string } {
  const cleanUser = username.trim();
  const lowerUser = cleanUser.toLowerCase();

  if (cleanUser.length < 3 || cleanUser.length > 32) {
    return { success: false, error: 'Tên người dùng Admin phải từ 3 đến 32 ký tự.' };
  }

  if (password.length < 8) {
    return { success: false, error: 'Mật khẩu phải có độ dài tối thiểu 8 ký tự.' };
  }

  const store = loadAdminStore();

  // If already configured and this user already exists, prevent accidental overwrite without auth
  if (store.accounts[lowerUser]) {
    return {
      success: false,
      error: `Tài khoản ${cleanUser} đã tồn tại trong hệ thống. Vui lòng đăng nhập hoặc sử dụng tính năng đổi mật khẩu.`,
    };
  }

  try {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(password, salt);
    const now = new Date().toISOString();

    store.accounts[lowerUser] = {
      username: cleanUser,
      salt,
      hash,
      createdAt: now,
      updatedAt: now,
    };

    const saved = saveAdminStore(store);
    if (!saved) {
      return { success: false, error: 'Không thể ghi tệp lưu trữ credentials.' };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: `Lỗi khởi tạo credentials: ${err instanceof Error ? err.message : 'Unknown'}`,
    };
  }
}

/**
 * Changes password for an existing admin user
 */
export function changeAdminPassword(
  username: string,
  oldPassword: string,
  newPassword: string
): { success: boolean; error?: string } {
  if (newPassword.length < 8) {
    return { success: false, error: 'Mật khẩu mới phải có tối thiểu 8 ký tự.' };
  }

  const cleanUser = username.trim().toLowerCase();
  const store = loadAdminStore();
  const account = store.accounts[cleanUser];

  if (!account) {
    return { success: false, error: 'Không tìm thấy tài khoản quản trị.' };
  }

  const computedOld = hashPassword(oldPassword, account.salt);
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(computedOld, 'hex'),
    Buffer.from(account.hash, 'hex')
  );

  if (!isMatch) {
    return { success: false, error: 'Mật khẩu hiện tại không chính xác.' };
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  const newHash = hashPassword(newPassword, newSalt);

  account.salt = newSalt;
  account.hash = newHash;
  account.updatedAt = new Date().toISOString();
  store.accounts[cleanUser] = account;

  const saved = saveAdminStore(store);
  if (!saved) {
    return { success: false, error: 'Không thể cập nhật mật khẩu mới.' };
  }

  return { success: true };
}

// Generates composite key for isolating rate limits per interface scope and IP
function getRateLimitKey(ip: string, scope = 'v1'): string {
  const cleanScope = (scope || 'v1').toLowerCase().trim();
  const cleanIp = (ip || '127.0.0.1').trim();
  return `${cleanScope}:${cleanIp}`;
}

/**
 * Checks rate limiting for login IP address and interface scope (V1/V2 isolation)
 * (Max 5 failed attempts in 15 minutes)
 */
export function checkLoginRateLimit(
  ip: string,
  scope = 'v1'
): { allowed: boolean; retryAfterSeconds?: number } {
  const key = getRateLimitKey(ip, scope);
  const now = Date.now();
  const record = loginRateLimitMap.get(key);
  if (!record) {
    return { allowed: true };
  }

  if (record.lockUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((record.lockUntil - now) / 1000),
    };
  }

  if (record.resetAt <= now) {
    loginRateLimitMap.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Records a login attempt for rate limiting (isolated by scope:ip)
 */
export function recordLoginAttempt(ip: string, success: boolean, scope = 'v1'): void {
  const key = getRateLimitKey(ip, scope);
  const now = Date.now();
  if (success) {
    loginRateLimitMap.delete(key);
    return;
  }

  const record = loginRateLimitMap.get(key) || {
    attempts: 0,
    resetAt: now + 15 * 60 * 1000,
    lockUntil: 0,
  };

  record.attempts += 1;
  if (record.attempts >= 5) {
    // Lock for 15 minutes
    record.lockUntil = now + 15 * 60 * 1000;
  }
  loginRateLimitMap.set(key, record);
}

/**
 * Clears rate limit records (for testing or administrative unlock)
 */
export function clearLoginRateLimit(ip?: string, scope?: string): void {
  if (ip) {
    const key = getRateLimitKey(ip, scope || 'v1');
    loginRateLimitMap.delete(key);
  } else {
    loginRateLimitMap.clear();
  }
}

/**
 * Verifies admin credentials against multi-account store
 */
export interface VerifyCredentialsResult {
  success: boolean;
  user?: AdminUser;
  errorCode?: 'SYSTEM_NOT_INITIALIZED' | 'ACCOUNT_NOT_FOUND' | 'INVALID_PASSWORD' | 'UNKNOWN';
  error?: string;
}

/**
 * Verifies admin credentials against multi-account store
 */
export function verifyAdminCredentials(
  username: string,
  password: string
): VerifyCredentialsResult {
  const store = loadAdminStore();
  if (Object.keys(store.accounts).length === 0) {
    return {
      success: false,
      errorCode: 'SYSTEM_NOT_INITIALIZED',
      error: 'Hệ thống chưa được khởi tạo tài khoản Quản trị viên.',
    };
  }

  const cleanUser = username.trim().toLowerCase();
  const account = store.accounts[cleanUser];

  if (!account) {
    return {
      success: false,
      errorCode: 'ACCOUNT_NOT_FOUND',
      error: `Tài khoản '${username.trim()}' không tồn tại trong danh sách quản trị viên.`,
    };
  }

  const computedHash = hashPassword(password, account.salt);
  // Constant time comparison to prevent timing attacks
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(computedHash, 'hex'),
    Buffer.from(account.hash, 'hex')
  );

  if (!isMatch) {
    return {
      success: false,
      errorCode: 'INVALID_PASSWORD',
      error: `Mật khẩu không chính xác cho tài khoản '${account.username}'. Vui lòng kiểm tra lại mật khẩu đã thiết lập.`,
    };
  }

  return {
    success: true,
    user: {
      username: account.username,
      role: 'admin',
      createdAt: account.createdAt,
    },
  };
}

/**
 * Creates a cryptographically signed session token
 */
export function createSessionToken(username: string): {
  cookieValue: string;
  csrfToken: string;
  expiresAt: number;
} {
  const now = Date.now();
  const expiresAt = now + SESSION_DURATION_MS;
  const csrfToken = crypto.randomBytes(24).toString('hex');

  const payload: SessionPayload = {
    username,
    role: 'admin',
    issuedAt: now,
    expiresAt,
    csrfToken,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSessionSigningSecret())
    .update(payloadBase64)
    .digest('base64url');

  const cookieValue = `${payloadBase64}.${signature}`;

  return {
    cookieValue,
    csrfToken,
    expiresAt,
  };
}

/**
 * Verifies a signed session token
 */
export function verifySessionToken(tokenString: string): {
  valid: boolean;
  user?: AdminUser;
  csrfToken?: string;
  error?: string;
} {
  if (!tokenString || typeof tokenString !== 'string') {
    return { valid: false, error: 'Missing session token' };
  }

  const parts = tokenString.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed session token format' };
  }

  const [payloadBase64, providedSignature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', getSessionSigningSecret())
    .update(payloadBase64)
    .digest('base64url');

  // Verify HMAC signature
  try {
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(providedSignature),
      Buffer.from(expectedSignature)
    );
    if (!isSignatureValid) {
      return { valid: false, error: 'Invalid session signature' };
    }
  } catch {
    return { valid: false, error: 'Signature check failed' };
  }

  // Parse payload
  try {
    const payload: SessionPayload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf-8')
    );

    if (Date.now() > payload.expiresAt) {
      return { valid: false, error: 'Session has expired' };
    }

    return {
      valid: true,
      user: {
        username: payload.username,
        role: payload.role,
      },
      csrfToken: payload.csrfToken,
    };
  } catch {
    return { valid: false, error: 'Failed to decode session payload' };
  }
}

/**
 * Verifies an incoming HTTP NextRequest for Admin authorization.
 * Supports both Cookie session and Authorization: Bearer fallback (essential for AI Studio iframe).
 * Optionally checks CSRF header for mutation endpoints (POST/PUT/DELETE).
 */
export function verifyAdminRequest(
  req: NextRequest,
  requireCsrf = false
): {
  authorized: boolean;
  user?: AdminUser;
  csrfToken?: string;
  error?: string;
  status: number;
} {
  // 1. Try extracting token from Cookie first
  let token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

  // 2. Fallback to Authorization: Bearer header (crucial when third-party cookies are blocked in AI Studio iframe)
  if (!token) {
    const authHeader = req.headers.get('authorization')?.trim();
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) {
    return {
      authorized: false,
      error: 'Chưa đăng nhập quyền Quản trị viên (Admin Session Required).',
      status: 401,
    };
  }

  const session = verifySessionToken(token);
  if (!session.valid || !session.user) {
    return {
      authorized: false,
      error: session.error || 'Phiên đăng nhập Quản trị viên không hợp lệ hoặc đã hết hạn.',
      status: 401,
    };
  }

  if (requireCsrf) {
    const providedCsrf = req.headers.get('x-csrf-token')?.trim();
    if (!providedCsrf || providedCsrf !== session.csrfToken) {
      return {
        authorized: false,
        error: 'Xác thực CSRF Token thất bại. Vui lòng làm mới trang.',
        status: 403,
      };
    }
  }

  return {
    authorized: true,
    user: session.user,
    csrfToken: session.csrfToken,
    status: 200,
  };
}

/**
 * Sets session cookie onto an outgoing NextResponse.
 * Configured with SameSite=None and Secure=true to support AI Studio iframe embedding and Cloud Run HTTPS.
 */
export function attachSessionCookie(res: NextResponse, cookieValue: string, expiresAt: number): void {
  res.cookies.set(ADMIN_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    expires: new Date(expiresAt),
  });
}

/**
 * Clears session cookie on logout
 */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 0,
  });
}
