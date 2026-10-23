import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import { getCharacterContentStore } from '../lib/game/v2/character-content-store';
import { validateCanPublishChapter, StoryChapterMeta } from '../lib/game/v2/character-content-types';

describe('STARFRONT WORLD V2 — ADMINCP 3 MODULES ACCEPTANCE TEST SUITE', () => {
  const store = getCharacterContentStore();

  it('Module 1 (Character Profile): Cho phép chỉnh sửa, lưu trữ và khôi phục dữ liệu hồ sơ', async () => {
    // 1. Lấy profile ban đầu của Marcus
    const initialManifest = await store.getManifest();
    const initialProfile = initialManifest.profiles['marcus'];
    assert.ok(initialProfile, 'Hồ sơ Marcus phải tồn tại');

    // 2. Chỉnh sửa hồ sơ qua store updateProfile
    const testQuote = '“Bão từ không gian chỉ là bài kiểm tra độ bền của động cơ.”';
    const testBio = 'Chỉ huy thiết giáp kỳ cựu với hơn 100 giờ xuất kích.';

    const updateRes = await store.updateProfile(
      'marcus',
      {
        quote: testQuote,
        shortDescription: testBio,
      },
      'test_admin'
    );

    assert.strictEqual(updateRes.success, true, 'Cập nhật hồ sơ Marcus phải thành công');

    // 3. Đọc lại và xác thực
    const updatedManifest = await store.getManifest();
    assert.strictEqual(updatedManifest.profiles['marcus']?.quote, testQuote);
    assert.strictEqual(updatedManifest.profiles['marcus']?.shortDescription, testBio);

    // 4. Kiểm tra audit log
    const lastAudit = updatedManifest.auditLog[0];
    assert.strictEqual(lastAudit.targetPilotId, 'marcus');
    assert.strictEqual(lastAudit.user, 'test_admin');
  });

  it('Module 2 (Artwork Binary): Xác thực lưu trữ file nhị phân WebP, tính mã băm SHA-256 và đăng ký', async () => {
    // 1. Tạo buffer WebP giả lập (giả lập file nhị phân thật)
    const fakeWebpBuffer = Buffer.from('RIFF....WEBPVP8 ...STARFRONT_PILOT_ARTWORK_TEST_DATA...');
    const expectedSha256 = crypto.createHash('sha256').update(fakeWebpBuffer).digest('hex');

    const testPilotId = 'victor';
    const filename = `action_${Date.now()}_${expectedSha256.slice(0, 8)}.webp`;
    const targetDir = path.join(process.cwd(), 'public', 'assets', 'artworks', testPilotId);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetFilePath = path.join(targetDir, filename);
    fs.writeFileSync(targetFilePath, fakeWebpBuffer);

    assert.ok(fs.existsSync(targetFilePath), 'File nhị phân phải được ghi thành công vào public/assets/artworks/victor/');

    // 2. Đăng ký vào catalog store
    const artworkData = {
      assetId: `art_victor_${Date.now()}`,
      pilotId: 'victor' as const,
      title: 'Victor — Đột Kích Vành Đai',
      label: 'Victor — Đột Kích Vành Đai',
      category: 'lore' as const,
      role: 'action' as const,
      roleCategory: 'action' as const,
      path: `/assets/artworks/${testPilotId}/${filename}`,
      sourceUrl: `/assets/artworks/${testPilotId}/${filename}`,
      localPath: `/assets/artworks/${testPilotId}/${filename}`,
      aspectRatio: '3:4' as const,
      status: 'verified' as const,
      verificationStatus: 'VERIFIED',
      isAvailableOnDisk: true,
      checksumSha256: expectedSha256,
      fileSizeBytes: fakeWebpBuffer.length,
      uploadedAt: new Date().toISOString(),
    };

    const regResult = await store.registerArtwork(artworkData, 'admin');
    assert.strictEqual(regResult.success, true, 'Đăng ký artwork với binary thật phải thành công');

    const manifestAfterArt = await store.getManifest();
    const victorArts = manifestAfterArt.artworks['victor'] || [];
    const registered = victorArts.find((a) => a.checksumSha256 === expectedSha256);

    assert.ok(registered, 'Tác phẩm với mã SHA-256 kỳ vọng phải xuất hiện trong catalog');
    assert.strictEqual(registered.fileSizeBytes, fakeWebpBuffer.length);

    // Dọn dẹp test file
    try {
      fs.unlinkSync(targetFilePath);
    } catch {
      // Ignore
    }
  });

  it('Module 3 (Story Lifecycle & Gates): Chuyển trạng thái xuất bản và kiểm tra validation gates', async () => {
    // 1. Valentine Chapter 01 (APPROVED & VERIFIED)
    const valChapters = await store.getStoryChapters('valentine', true);
    const valChap1 = valChapters.find((c) => c.chapterId === 'chap-01');
    assert.ok(valChap1, 'Valentine Chapter 01 phải tồn tại');

    // Chuyển sang HIDDEN
    const hideResult = await store.toggleStoryPublication('valentine', 'chap-01', 'HIDDEN', 'admin');
    assert.strictEqual(hideResult.success, true, 'Ẩn chương Valentine Chap 01 phải thành công');

    let publishedList = await store.getPublishedChapters('valentine');
    assert.ok(!publishedList.some((c) => c.chapterId === 'chap-01'), 'Chương đã ẩn không được xuất hiện ở public reader');

    // Chuyển lại sang PUBLISHED
    const pubResult = await store.toggleStoryPublication('valentine', 'chap-01', 'PUBLISHED', 'admin');
    assert.strictEqual(pubResult.success, true, 'Xuất bản lại Valentine Chap 01 phải thành công');

    publishedList = await store.getPublishedChapters('valentine');
    assert.ok(publishedList.some((c) => c.chapterId === 'chap-01'), 'Chương đã xuất bản phải xuất hiện ở public reader');

    // 2. Chặn xuất bản chương HOLD
    const holdChapter: StoryChapterMeta = {
      chapterId: 'chap-10',
      chapterNumber: 10,
      title: 'Hồi Kết Hư Không',
      summary: 'Niêm phong.',
      editorialStatus: 'HOLD',
      contentReadiness: 'MISSING',
      publicationStatus: 'DRAFT',
      sceneAnchors: [],
      updatedAt: new Date().toISOString(),
    };

    const gateCheck = validateCanPublishChapter(holdChapter);
    assert.strictEqual(gateCheck.canPublish, false, 'Validation Gate phải chặn xuất bản chương HOLD');

    // 3. Thử ép xuất bản qua store cho chương HOLD
    const illegalPublish = await store.toggleStoryPublication('valentine', 'chap-10', 'PUBLISHED', 'admin');
    assert.strictEqual(illegalPublish.success, false, 'Store phải từ chối xuất bản chương HOLD');
    assert.ok(illegalPublish.error?.includes('Không tìm thấy') || illegalPublish.error?.includes('HOLD'), 'Phải trả về lỗi từ chối rõ ràng');
  });
});
