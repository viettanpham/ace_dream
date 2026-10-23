/**
 * STARFRONT WORLD V2 — SERVER-SIDE ADMIN CREDENTIALS RESET (EMERGENCY ONLY)
 *
 * Usage:
 *   npm run admin:reset
 *
 * This command backs up the existing credentials store and deletes it from disk.
 * This puts the system back into "First-Time Setup Mode" (needsSetup: true).
 * Upon reloading /v2/admin, the authorized owner can interactively define their
 * desired credentials with full confirmation validation in the UI.
 */

import * as fs from 'fs';
import * as path from 'path';

function main() {
  console.log('[AdminReset] Khởi chạy quy trình thiết lập lại tài khoản Quản trị viên...');

  const authFile = path.join(process.cwd(), '.starfront-config', 'admin-auth.json');
  if (fs.existsSync(authFile)) {
    const backupFile = `${authFile}.bak.${Date.now()}`;
    fs.copyFileSync(authFile, backupFile);
    fs.unlinkSync(authFile);
    console.log(`[AdminReset] Đã sao lưu store cũ tại: ${backupFile}`);
    console.log('[AdminReset] Đã xóa admin-auth.json hiện tại.');
  } else {
    console.log('[AdminReset] Chưa tồn tại admin-auth.json. Hệ thống sẵn sàng ở chế độ Setup.');
  }

  console.log('[AdminReset] THÀNH CÔNG: Hệ thống đã chuyển về chế độ Khởi tạo Ban Đầu (needsSetup: true).');
  console.log('[AdminReset] Bây giờ chủ dự án có thể:');
  console.log('  1. Truy cập /v2/admin trên trình duyệt và tự tay thiết lập mật khẩu mong muốn.');
  console.log('  2. HOẶC điền mật khẩu mong muốn vào .env.local và chạy "npm run admin:bootstrap".');
}

main();
