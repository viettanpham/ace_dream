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

export interface SessionPayload {
  username: string;
  role: 'admin';
  issuedAt: number;
  expiresAt: number;
  csrfToken: string;
}

export const ADMIN_COOKIE_NAME = 'starfront_admin_session';
export const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

const AUTH_CONFIG_FILE = path.join(process.cwd(), '.starfront-config', 'admin-auth.json');
const SECRET_KEY_FILE = path.join(process.cwd(), '.starfront-config', 'session-secret.key');

// In-memory rate-limiter: IP -> { attempts: number, lockUntil: number }
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

  try {
    if (fs.existsSync(SECRET_KEY_FILE)) {
      const secret = fs.readFileSync(SECRET_KEY_FILE, 'utf-8').trim();
      if (secret.length >= 32) return secret;
    }
  } catch {
    // Continue to generation
  }

  const generated = crypto.randomBytes(32).toString('hex');
  try {
    const dir = path.dirname(SECRET_KEY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SECRET_KEY_FILE, generated, 'utf-8');
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
 * Checks if admin authentication has been configured either in file or environment
 */
export function isAuthConfigured(): boolean {
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    return true;
  }

  try {
    if (fs.existsSync(AUTH_CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(AUTH_CONFIG_FILE, 'utf-8'));
      return Boolean(data.username && data.salt && data.hash);
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Reads stored credentials record
 */
function getStoredCredentials(): AdminCredentialsRecord | null {
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    const envSalt = 'env_salt_' + (process.env.ADMIN_SALT || 'starfront_default_salt');
    const envHash = hashPassword(process.env.ADMIN_PASSWORD, envSalt);
    return {
      username: process.env.ADMIN_USERNAME.trim(),
      salt: envSalt,
      hash: envHash,
      createdAt: '2026-10-22T00:00:00.000Z',
      updatedAt: '2026-10-22T00:00:00.000Z',
    };
  }

  try {
    if (fs.existsSync(AUTH_CONFIG_FILE)) {
      const raw = fs.readFileSync(AUTH_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.username && parsed.salt && parsed.hash) {
        return parsed as AdminCredentialsRecord;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Initializes Admin credentials on first boot if unconfigured
 */
export function initializeAdminCredentials(
  username: string,
  password: string
): { success: boolean; error?: string } {
  if (isAuthConfigured()) {
    return {
      success: false,
      error: 'Hệ thống xác thực Admin đã được khởi tạo trước đó. Không thể ghi đè.',
    };
  }

  const cleanUser = username.trim();
  if (cleanUser.length < 3 || cleanUser.length > 32) {
    return { success: false, error: 'Tên người dùng Admin phải từ 3 đến 32 ký tự.' };
  }

  if (password.length < 8) {
    return { success: false, error: 'Mật khẩu phải có độ dài tối thiểu 8 ký tự.' };
  }

  try {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(password, salt);
    const now = new Date().toISOString();

    const record: AdminCredentialsRecord = {
      username: cleanUser,
      salt,
      hash,
      createdAt: now,
      updatedAt: now,
    };

    const dir = path.dirname(AUTH_CONFIG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Atomic write
    const tmp = `${AUTH_CONFIG_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmp, JSON.stringify(record, null, 2), 'utf-8');
    fs.renameSync(tmp, AUTH_CONFIG_FILE);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: `Lỗi ghi tệp lưu trữ credentials: ${err instanceof Error ? err.message : 'Unknown'}`,
    };
  }
}

/**
 * Checks rate limiting for login IP address (Max 5 attempts in 15 minutes)
 */
export function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = loginRateLimitMap.get(ip);
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
    loginRateLimitMap.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Records a login attempt for rate limiting
 */
export function recordLoginAttempt(ip: string, success: boolean): void {
  const now = Date.now();
  if (success) {
    loginRateLimitMap.delete(ip);
    return;
  }

  const record = loginRateLimitMap.get(ip) || {
    attempts: 0,
    resetAt: now + 15 * 60 * 1000,
    lockUntil: 0,
  };

  record.attempts += 1;
  if (record.attempts >= 5) {
    // Lock for 15 minutes
    record.lockUntil = now + 15 * 60 * 1000;
  }
  loginRateLimitMap.set(ip, record);
}

/**
 * Verifies admin credentials
 */
export function verifyAdminCredentials(
  username: string,
  password: string
): { success: boolean; user?: AdminUser; error?: string } {
  const stored = getStoredCredentials();
  if (!stored) {
    return {
      success: false,
      error: 'Hệ thống chưa được khởi tạo tài khoản Quản trị viên.',
    };
  }

  const cleanUser = username.trim();
  if (cleanUser.toLowerCase() !== stored.username.toLowerCase()) {
    return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' };
  }

  const computedHash = hashPassword(password, stored.salt);
  // Constant time comparison to prevent timing attacks
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(computedHash, 'hex'),
    Buffer.from(stored.hash, 'hex')
  );

  if (!isMatch) {
    return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' };
  }

  return {
    success: true,
    user: {
      username: stored.username,
      role: 'admin',
      createdAt: stored.createdAt,
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
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!cookieToken) {
    return {
      authorized: false,
      error: 'Chưa đăng nhập quyền Quản trị viên (Admin Session Required).',
      status: 401,
    };
  }

  const session = verifySessionToken(cookieToken);
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
 * Sets session cookie onto an outgoing NextResponse
 */
export function attachSessionCookie(res: NextResponse, cookieValue: string, expiresAt: number): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookies.set(ADMIN_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
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
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
