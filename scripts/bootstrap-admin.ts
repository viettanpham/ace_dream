/**
 * STARFRONT WORLD V2 — SERVER-SIDE ADMIN BOOTSTRAP & CREDENTIAL RESET UTILITY
 *
 * Usage:
 *   npx tsx scripts/bootstrap-admin.ts
 *
 * Environment variables supported:
 *   - STARFRONT_ADMIN_PRIMARY_PASSWORD (for 'admin')
 *   - STARFRONT_ADMIN_BACKUP_PASSWORD (for 'admin123')
 *   - ADMIN_SESSION_SECRET
 *
 * This script runs strictly server-side, generates cryptographically secure salts and scrypt hashes,
 * and updates .starfront-config/admin-auth.json idempotently without leaking secrets in logs or git.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  hashPassword,
  loadAdminStore,
  saveAdminStore,
  getRegisteredAdminUsernames,
} from '../lib/game/auth/admin-auth';

// Helper to safely load .env.local if not already loaded into process.env
function loadLocalEnvFile() {
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
}

async function main() {
  console.log('[AdminBootstrap] Khởi chạy công cụ quản trị tài khoản server-side...');
  loadLocalEnvFile();

  const primaryPass = process.env.STARFRONT_ADMIN_PRIMARY_PASSWORD?.trim();
  const backupPass = process.env.STARFRONT_ADMIN_BACKUP_PASSWORD?.trim();

  if (!primaryPass || primaryPass.length < 8) {
    console.error(
      '[AdminBootstrap] LỖI: STARFRONT_ADMIN_PRIMARY_PASSWORD chưa được thiết lập hoặc ngắn hơn 8 ký tự.'
    );
    process.exit(1);
  }

  if (!backupPass || backupPass.length < 8) {
    console.error(
      '[AdminBootstrap] LỖI: STARFRONT_ADMIN_BACKUP_PASSWORD chưa được thiết lập hoặc ngắn hơn 8 ký tự.'
    );
    process.exit(1);
  }

  const store = loadAdminStore();
  const now = new Date().toISOString();

  // 1. Configure Primary Admin ('admin')
  const primarySalt = crypto.randomBytes(16).toString('hex');
  const primaryHash = hashPassword(primaryPass, primarySalt);
  store.accounts['admin'] = {
    username: 'admin',
    salt: primarySalt,
    hash: primaryHash,
    createdAt: store.accounts['admin']?.createdAt || now,
    updatedAt: now,
  };

  // 2. Configure Backup Admin ('admin123')
  const backupSalt = crypto.randomBytes(16).toString('hex');
  const backupHash = hashPassword(backupPass, backupSalt);
  store.accounts['admin123'] = {
    username: 'admin123',
    salt: backupSalt,
    hash: backupHash,
    createdAt: store.accounts['admin123']?.createdAt || now,
    updatedAt: now,
  };

  const success = saveAdminStore(store);
  if (!success) {
    console.error('[AdminBootstrap] LỖI: Không thể lưu thông tin xác thực vào admin-auth.json.');
    process.exit(1);
  }

  const registered = getRegisteredAdminUsernames();
  console.log('[AdminBootstrap] THÀNH CÔNG: Đã khởi tạo và đồng bộ 2 tài khoản quản trị:');
  for (const u of registered) {
    console.log(`  - Tài khoản: ${u} [Hash & Salt OK]`);
  }
  console.log('[AdminBootstrap] Mật khẩu đã được mã hóa an toàn qua scrypt (không ghi plaintext).');
}

main().catch((err) => {
  console.error('[AdminBootstrap] Ngoại lệ không xác định:', err);
  process.exit(1);
});
