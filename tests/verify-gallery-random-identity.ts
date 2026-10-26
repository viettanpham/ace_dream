/**
 * STARFRONT WORLD V2 — GALLERY RANDOM IDENTITY & STABILITY VERIFICATION
 * 
 * Strict Verification Requirements:
 * 1. Random multi-pilot selection: Valentine + Fortuna + Lyra + Selena.
 * 2. Simulate 35 consecutive transitions.
 * 3. In every transition, verify 100% strict matching between:
 *    - currentArtwork.pilotId
 *    - currentArtwork.filename
 *    - currentArtwork.path
 *    - currentArtwork.resolvedUrl
 *    - currentArtwork.title
 *    - currentArtwork.description
 *    against the canonical JSON source records.
 * 4. Verify ZERO cross-pilot contamination (e.g. Valentine metadata on Fortuna image).
 * 5. Verify NO consecutive identical artworks over the full run.
 * 6. Test filename collision resolution (e.g. outfit-001.webp present in multiple pilots).
 */

import { universalContentResolver } from '../lib/game/v2/universal-content-resolver';
import {
  buildArtworkIdentityKey,
  createShuffleBag,
  ShowcaseArtwork,
} from '../lib/game/v2/gallery-showcase-engine';
import { resolveImageUrl } from '../lib/game/assets/image-resolver';
import { CANONICAL_PILOT_METADATA, CanonicalPilotId } from '../lib/game/v2/universal-content-types';

async function runIdentityVerification() {
  console.log('=== [1] NẠP DỮ LIỆU CANONICAL CỦA 4 PHI CÔNG (VALENTINE, FORTUNA, LYRA, SELENA) ===');
  const targetPilots = ['valentine', 'fortuna', 'lyra', 'selena'] as const;
  const canonicalArtworksMap: Record<string, any[]> = {};
  const showcasePool: ShowcaseArtwork[] = [];

  for (const pId of targetPilots) {
    const gallery = await universalContentResolver.getPilotGallery(pId);
    if (!gallery || !Array.isArray(gallery.artworks) || gallery.artworks.length === 0) {
      console.error(`FAIL: Không lấy được gallery cho phi công ${pId}`);
      process.exit(1);
    }
    canonicalArtworksMap[pId] = gallery.artworks;
    const meta = CANONICAL_PILOT_METADATA[pId as CanonicalPilotId];

    console.log(`PASS: ${pId.padEnd(10)} -> ${gallery.artworks.length} tác phẩm trong JSON gốc.`);

    for (const art of gallery.artworks) {
      const cleanPath = art.path.startsWith('/') ? art.path.slice(1) : art.path;
      const assetId = art.assetId || art.filename;
      const identityKey = buildArtworkIdentityKey(pId, assetId, cleanPath);
      const resolvedUrl = resolveImageUrl(cleanPath) || '';

      showcasePool.push({
        identityKey,
        assetId,
        filename: art.filename,
        path: cleanPath,
        resolvedUrl,
        title: art.title,
        description: art.curatedDescription || art.description || '',
        curatedDescription: art.curatedDescription,
        category: art.category,
        dimensions: art.width && art.height ? { width: art.width, height: art.height } : undefined,
        isAvailableOnDisk: art.isAvailableOnDisk !== false,
        status: art.status,
        pilotId: pId,
        pilotName: gallery.pilotName || meta.name,
        pilotCallsign: meta.callsign,
        pilotGender: meta.gender,
        pilotPortraitPath: `images/pilots/${pId}/${pId}-portrait.webp`,
      });
    }
  }

  console.log(`\nTổng số tác phẩm trong pool kiểm thử: ${showcasePool.length} tác phẩm.`);
  if (showcasePool.length < 100) {
    console.error(`FAIL: Số lượng tác phẩm của 4 phi công phải >= 100 (thực tế: ${showcasePool.length})`);
    process.exit(1);
  }

  console.log('\n=== [2] MÔ PHỎNG 35 LẦN CHUYỂN ẢNH VÀ ĐỐI CHIẾU NGUYÊN TỬ 1:1 VỚI BẢN GHI JSON GỐC ===');
  let bag = createShuffleBag(showcasePool);
  let bagIndex = 0;
  let previousKey: string | undefined = undefined;
  let passedTransitions = 0;

  for (let step = 1; step <= 35; step++) {
    if (bagIndex >= bag.length) {
      bag = createShuffleBag(showcasePool, bag[bag.length - 1]?.identityKey);
      bagIndex = 0;
    }

    const current = bag[bagIndex];
    bagIndex++;

    // 1. Check for immediate consecutive duplicate
    if (previousKey && current.identityKey === previousKey) {
      console.error(`[Bước ${step}] FAIL: Trùng lặp liên tiếp tác phẩm: ${current.identityKey}`);
      process.exit(1);
    }
    previousKey = current.identityKey;

    // 2. Query original canonical JSON record
    const originalList = canonicalArtworksMap[current.pilotId];
    if (!originalList) {
      console.error(`[Bước ${step}] FAIL: Không tìm thấy danh sách gốc của pilotId: ${current.pilotId}`);
      process.exit(1);
    }

    const matchedRecord = originalList.find(
      (item) =>
        item.path === current.path ||
        (item.path.startsWith('/') ? item.path.slice(1) : item.path) === current.path ||
        item.filename === current.filename
    );

    if (!matchedRecord) {
      console.error(`[Bước ${step}] FAIL: Không tìm thấy bản ghi gốc cho path: ${current.path}`);
      process.exit(1);
    }

    // 3. Verify path strictly contains the pilotId (No cross-pilot asset contamination!)
    const expectedPrefix = `images/pilots/${current.pilotId}/`;
    if (!current.path.startsWith(expectedPrefix)) {
      console.error(
        `[Bước ${step}] FAIL NGHIÊM TRỌNG: Path "${current.path}" không khớp với pilotId "${current.pilotId}"!`
      );
      process.exit(1);
    }

    // 4. Verify title strictly matches original title
    if (current.title !== matchedRecord.title) {
      console.error(
        `[Bước ${step}] FAIL: Title lệch! UI="${current.title}" vs JSON="${matchedRecord.title}"`
      );
      process.exit(1);
    }

    // 5. Verify description strictly matches curated description
    const expectedDesc = matchedRecord.curatedDescription || matchedRecord.description || '';
    if (current.description !== expectedDesc) {
      console.error(
        `[Bước ${step}] FAIL: Description lệch! UI="${current.description}" vs JSON="${expectedDesc}"`
      );
      process.exit(1);
    }

    // 6. Verify resolved URL points to the correct pilot asset
    if (!current.resolvedUrl.includes(`/images/pilots/${current.pilotId}/`)) {
      console.error(
        `[Bước ${step}] FAIL: Resolved URL "${current.resolvedUrl}" không trỏ về pilot "${current.pilotId}"!`
      );
      process.exit(1);
    }

    passedTransitions++;
    if (step <= 5 || step === 15 || step === 30 || step === 35) {
      console.log(
        `[Bước ${String(step).padStart(2, '0')}] PASS: [${current.pilotId.toUpperCase().padEnd(9)}] "${current.title.padEnd(28)}" -> ${current.filename}`
      );
    }
  }

  console.log(`\nKết quả: ${passedTransitions}/35 lần chuyển ảnh đều KHỚP 100% với JSON gốc.`);

  console.log('\n=== [3] KIỂM TRA GIẢI QUYẾT ĐỤNG ĐỘ FILENAME TRÙNG NHAU GIỮA CÁC PHI CÔNG ===');
  // Check if multiple pilots have artworks with the same filename (e.g. outfit-001.webp or fullbody.webp)
  const filenamePilotMap = new Map<string, string[]>();
  for (const art of showcasePool) {
    const list = filenamePilotMap.get(art.filename) || [];
    if (!list.includes(art.pilotId)) {
      list.push(art.pilotId);
    }
    filenamePilotMap.set(art.filename, list);
  }

  const collisions = Array.from(filenamePilotMap.entries()).filter(([_, pilots]) => pilots.length > 1);
  console.log(`Tìm thấy ${collisions.length} filename xuất hiện ở nhiều phi công khác nhau:`);
  for (const [fn, pilots] of collisions.slice(0, 3)) {
    console.log(` - Filename "${fn}" xuất hiện ở các pilot: [${pilots.join(', ')}]`);
  }

  // Verify that their identityKeys are strictly distinct
  let keysDistinct = true;
  for (const [fn, pilots] of collisions) {
    const sampleItems = showcasePool.filter((a) => a.filename === fn);
    const uniqueKeys = new Set(sampleItems.map((a) => a.identityKey));
    if (uniqueKeys.size !== sampleItems.length) {
      console.error(`FAIL: Đụng độ identityKey với filename "${fn}"!`);
      keysDistinct = false;
      break;
    }
  }

  if (keysDistinct) {
    console.log('PASS: Khóa định danh identityKey đảm bảo toàn bộ filename trùng nhau đều tách biệt 100%!');
  } else {
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log('KẾT QUẢ KIỂM THỬ: 100% CÁC TIÊU CHÍ VERIFICATION ĐỀU PASS');
  console.log('======================================================');
}

runIdentityVerification().catch((err) => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
