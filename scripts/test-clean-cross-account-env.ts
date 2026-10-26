// scripts/test-clean-cross-account-env.ts
/**
 * Test mô phỏng môi trường sạch hoàn toàn trên tài khoản AI Studio mới:
 * - Không có .env.local
 * - Không có bất kỳ process.env nào được inject trước
 * - Không có secret
 */

import { getResolverConfig, resolveImageUrl, DEFAULT_JSDELIVR_CDN_BASE } from '../lib/game/assets/image-resolver';
import { universalContentResolver } from '../lib/game/v2/universal-content-resolver';

async function testCleanEnvironment() {
  console.log('=== TEST MÔ PHỎNG MÔI TRƯỜNG AI STUDIO MỚI (ZERO-CONFIG) ===\n');

  // 1. Dọn sạch toàn bộ biến môi trường của app
  const envKeysToWipe = [
    'NEXT_PUBLIC_ASSET_STORAGE_MODE',
    'NEXT_PUBLIC_ASSET_CDN_URL',
    'NEXT_PUBLIC_R2_ASSET_CDN_URL',
    'ADMIN_SESSION_SECRET',
    'STARFRONT_PREVIEW_SECRET_KEY',
    'STARFRONT_AUTH_FILE_PATH',
    'STARFRONT_SESSION_KEY_PATH',
    'STARFRONT_ADMIN_PRIMARY_PASSWORD',
    'STARFRONT_ADMIN_BACKUP_PASSWORD',
    'STARFRONT_ADMIN_THIRD_PASSWORD',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD',
    'STARFRONT_DEV_ADMIN_PREVIEW',
    'NEXT_PUBLIC_STARFRONT_DEV_ADMIN_PREVIEW',
    'STARFRONT_STORY_REVIEW_MODE',
    'GITHUB_TOKEN',
    'GCS_STORY_BUCKET_NAME',
    'GOOGLE_APPLICATION_CREDENTIALS',
    'GEMINI_API_KEY',
  ];

  for (const k of envKeysToWipe) {
    delete process.env[k];
  }

  console.log('[1] Đã xóa toàn bộ biến môi trường STARFRONT trong process.env.');

  // 2. Kiểm tra Image Resolver Fallback
  const resolverConfig = getResolverConfig();
  console.log(`[2] Image Resolver Config: mode=${resolverConfig.mode}, cdnBaseUrl=${resolverConfig.cdnBaseUrl}`);
  if (resolverConfig.mode !== 'jsdelivr') {
    throw new Error(`Mode mặc định phải là 'jsdelivr', thực tế là '${resolverConfig.mode}'`);
  }
  if (resolverConfig.cdnBaseUrl !== DEFAULT_JSDELIVR_CDN_BASE) {
    throw new Error(`CDN URL mặc định phải là DEFAULT_JSDELIVR_CDN_BASE!`);
  }

  const sampleUrl = resolveImageUrl('images/pilots/valentine/valentine-portrait.webp');
  console.log(`[2] Resolved Sample Image URL: ${sampleUrl}`);
  if (!sampleUrl.startsWith('https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets')) {
    throw new Error(`Resolved URL không trỏ về CDN jsdelivr R3 chuẩn: ${sampleUrl}`);
  }

  // 3. Kiểm tra Story Catalog & Story Chapter
  console.log('[3] Kiểm tra nạp Story Catalog không cần ENV...');
  const valCat = await universalContentResolver.getPilotStoryCatalog('valentine', false);
  if (!valCat || valCat.chapters.length < 7) {
    throw new Error('Không nạp được Story Catalog của Valentine trong môi trường sạch!');
  }
  console.log(`    -> Valentine Story Catalog: ${valCat.chapters.length} chương public OK.`);

  const valCh1 = await universalContentResolver.getStoryChapterProse('valentine', 'chap-01');
  if (!valCh1 || valCh1.content.length < 500) {
    throw new Error('Valentine Ch01 không nạp được toàn văn văn xuôi trong môi trường sạch!');
  }
  console.log(`    -> Valentine Ch01: "${valCh1.meta.title}" (${valCh1.content.length} ký tự) OK.`);

  const valCh3 = await universalContentResolver.getStoryChapterProse('valentine', 'chap-03');
  if (!valCh3 || !valCh3.isComingSoon) {
    throw new Error('Valentine Ch03 phải là Coming Soon trong môi trường sạch!');
  }
  console.log(`    -> Valentine Ch03: "${valCh3.meta.title}" (Coming Soon) OK.`);

  // 4. Kiểm tra Gallery
  console.log('[4] Kiểm tra Gallery không cần ENV...');
  const valGallery = await universalContentResolver.getPilotGallery('valentine');
  if (!valGallery || valGallery.artworks.length === 0) {
    throw new Error('Không nạp được Gallery của Valentine trong môi trường sạch!');
  }
  console.log(`    -> Valentine Gallery: ${valGallery.artworks.length} tác phẩm OK.`);

  // 5. Kiểm tra fetch các HTTP route thực tế
  console.log('[5] Kiểm tra HTTP endpoints trên máy chủ nội bộ...');
  const endpoints = [
    'http://localhost:3000/',
    'http://localhost:3000/v1',
    'http://localhost:3000/v2/pilots',
    'http://localhost:3000/api/runtime/story?pilotId=valentine',
    'http://localhost:3000/api/runtime/gallery/valentine',
  ];

  for (const ep of endpoints) {
    const res = await fetch(ep);
    console.log(`    -> [${res.status}] ${ep}`);
    if (res.status !== 200) {
      throw new Error(`Endpoint ${ep} trả về HTTP ${res.status} thay vì 200!`);
    }
  }

  console.log('\n=== TẤT CẢ CÁC BÀI TEST ZERO-CONFIG MÔI TRƯỜNG SẠCH ĐỀU PASS 100%! ===');
}

testCleanEnvironment().catch((err) => {
  console.error('\nLỖI KIỂM THỬ MÔI TRƯỜNG SẠCH:', err);
  process.exit(1);
});
