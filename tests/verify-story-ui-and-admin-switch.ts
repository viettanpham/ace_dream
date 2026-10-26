/**
 * STARFRONT WORLD V2 — VERIFICATION TEST SUITE
 * 1. Story Reader: Valentine Ch01, Ch02, Ch03, Ch07; Fortuna Ch01, Ch07; 12 Pilots catalog.
 * 2. Unwritten chapters return isComingSoon: true without 404.
 * 3. AdminCP V1 / V2 Version Switcher integration.
 */

import { universalContentResolver } from '../lib/game/v2/universal-content-resolver';
import { CANONICAL_12_PILOT_IDS } from '../lib/game/v2/universal-content-types';

async function runTests() {
  console.log('=== [1] TESTING STORY CATALOG (12 PILOTS) ===');
  let passCount = 0;
  let totalTests = 0;

  for (const pilotId of CANONICAL_12_PILOT_IDS) {
    totalTests++;
    const catalog = await universalContentResolver.getPilotStoryCatalog(pilotId, false);
    if (!catalog) {
      console.error(`FAIL: Không lấy được catalog cho phi công ${pilotId}`);
      continue;
    }

    const minChapters = pilotId === 'valentine' ? 10 : 7;
    if (catalog.chapters.length < minChapters) {
      console.error(`FAIL: ${pilotId} chỉ có ${catalog.chapters.length} chương, kỳ vọng >= ${minChapters}`);
      continue;
    }

    // Verify all chapters have titles and can be navigated
    const hasInvalidChapter = catalog.chapters.some(
      (ch) => !ch.chapterId || !ch.title || ch.title.trim().length === 0
    );
    if (hasInvalidChapter) {
      console.error(`FAIL: ${pilotId} có chương bị thiếu title hoặc chapterId`);
      continue;
    }

    // Verify no lock icon condition (contentAvailable is boolean, isComingSoon is defined)
    const hasUndefinedStatus = catalog.chapters.some(
      (ch) => typeof ch.contentAvailable !== 'boolean' || typeof ch.isComingSoon !== 'boolean'
    );
    if (hasUndefinedStatus) {
      console.error(`FAIL: ${pilotId} có chương thiếu cờ contentAvailable / isComingSoon`);
      continue;
    }

    console.log(`PASS: ${pilotId.padEnd(10)} -> ${catalog.chapters.length} chương (Published: ${catalog.publishedChaptersCount})`);
    passCount++;
  }

  console.log('\n=== [2] TESTING VALENTINE SPECIFIC CHAPTERS (Ch01, Ch02, Ch03, Ch07, Ch10) ===');
  const valChaptersToTest = ['chap-01', 'chap-02', 'chap-03', 'chap-07', 'chap-10'];
  for (const chId of valChaptersToTest) {
    totalTests++;
    const result = await universalContentResolver.getStoryChapterProse('valentine', chId, false);
    if (!result) {
      console.error(`FAIL: Valentine ${chId} trả về null!`);
      continue;
    }

    if (chId === 'chap-01') {
      if (result.isComingSoon || !result.content || result.content.length < 50) {
        console.error(`FAIL: Valentine Ch01 phải có nội dung toàn văn, nhưng nhận: isComingSoon=${result.isComingSoon}, contentLen=${result.content?.length}`);
        continue;
      }
      console.log(`PASS: Valentine ${chId} -> Toàn văn sẵn sàng (${result.content.length} ký tự, ${result.sceneAnchors.length} phân cảnh)`);
    } else {
      if (!result.isComingSoon) {
        console.error(`FAIL: Valentine ${chId} chưa có văn bản phải có isComingSoon=true`);
        continue;
      }
      if (!result.meta || !result.meta.title) {
        console.error(`FAIL: Valentine ${chId} thiếu metadata title`);
        continue;
      }
      console.log(`PASS: Valentine ${chId} -> Coming Soon thành công (Tiêu đề: "${result.meta.title}", Summary: "${result.meta.summary?.slice(0, 45)}...")`);
    }
    passCount++;
  }

  console.log('\n=== [3] TESTING FORTUNA SPECIFIC CHAPTERS (Ch01, Ch07) ===');
  const fortunaChaptersToTest = ['chap-01', 'chap-07'];
  for (const chId of fortunaChaptersToTest) {
    totalTests++;
    const result = await universalContentResolver.getStoryChapterProse('fortuna', chId, false);
    if (!result) {
      console.error(`FAIL: Fortuna ${chId} trả về null!`);
      continue;
    }

    if (!result.isComingSoon) {
      console.error(`FAIL: Fortuna ${chId} phải là isComingSoon=true`);
      continue;
    }

    if (!result.meta || !result.meta.title || result.meta.title.startsWith('chap-')) {
      console.error(`FAIL: Fortuna ${chId} có title không hợp lệ: "${result.meta?.title}"`);
      continue;
    }

    console.log(`PASS: Fortuna ${chId} -> Coming Soon chuẩn xác (Tiêu đề: "${result.meta.title}", Summary: "${result.meta.summary?.slice(0, 45)}...")`);
    passCount++;
  }

  console.log(`\n========================================`);
  console.log(`KẾT QUẢ KIỂM THỬ: ${passCount} / ${totalTests} TESTS PASS`);
  console.log(`========================================`);

  if (passCount === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled test error:', err);
  process.exit(1);
});
