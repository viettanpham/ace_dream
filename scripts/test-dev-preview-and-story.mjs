/**
 * STARFRONT WORLD V2 — DEV ADMIN PREVIEW & FULL STORY CATALOG TEST
 */

import { isDevAdminPreviewEnabled } from '../lib/game/auth/admin-auth.ts';

const BASE_URL = 'http://localhost:3000';

async function fetchJson(path, options = {}) {
  const url = new URL(path, BASE_URL);
  const res = await fetch(url.toString(), options);
  const data = await res.json().catch(() => null);
  return { status: res.status, headers: res.headers, data };
}

async function run() {
  console.log('=== TEST 1: SERVER-SIDE DEV ADMIN PREVIEW DETECTION ===');
  const isDevPreview = isDevAdminPreviewEnabled();
  console.log(`isDevAdminPreviewEnabled() in current env: ${isDevPreview}`);
  if (!isDevPreview) {
    console.error('FAIL: Expected DEV admin preview to be enabled in dev mode');
    process.exit(1);
  }
  console.log('PASS: Dev Admin Preview correctly recognized in development environment.');

  console.log('\n=== TEST 2: /api/admin/auth/me IN DEV PREVIEW MODE ===');
  const meRes = await fetchJson('/api/admin/auth/me');
  console.log('Me response:', meRes.data);
  if (!meRes.data?.authenticated || !meRes.data?.isDevPreview) {
    console.error('FAIL: Expected authenticated=true and isDevPreview=true without credentials');
    process.exit(1);
  }
  console.log('PASS: /api/admin/auth/me automatically granted DEV Preview access.');

  console.log('\n=== TEST 3: DEV PREVIEW ADMIN API CALL (/api/admin/character-content) ===');
  const contentRes = await fetchJson('/api/admin/character-content');
  if (!contentRes.data?.success) {
    console.error('FAIL: Could not access character-content in DEV Preview:', contentRes.data);
    process.exit(1);
  }
  console.log('PASS: Admin character-content loaded seamlessly in DEV preview.');

  console.log('\n=== TEST 4: VERIFY 12 PILOTS STORY CATALOG IN ADMINCP ===');
  const canonicalPilots = [
    'valentine', 'marcus', 'alviss', 'eric', 'victor', 'kaelen',
    'lyra', 'selena', 'fortuna', 'aria', 'rhea', 'nova'
  ];

  for (const pid of canonicalPilots) {
    const chapters = contentRes.data.manifest?.stories?.[pid]?.chapters || [];
    const minExpected = pid === 'valentine' ? 10 : 7;
    console.log(`- Pilot ${pid}: ${chapters.length} chapters in AdminCP (expected >= ${minExpected})`);
    if (chapters.length < minExpected) {
      console.error(`FAIL: Pilot ${pid} has ${chapters.length} chapters, expected at least ${minExpected}`);
      process.exit(1);
    }
  }
  console.log('PASS: All 12 pilots have full chapter catalogs (Valentine 10, all others >= 7) in AdminCP.');

  console.log('\n=== TEST 5: VERIFY PUBLIC RUNTIME STORY CATALOG FOR ALL 12 PILOTS ===');
  for (const pid of canonicalPilots) {
    const pubRes = await fetchJson(`/api/runtime/story?pilotId=${pid}`);
    if (!pubRes.data?.success) {
      console.error(`FAIL: Public story endpoint failed for ${pid}:`, pubRes.data);
      process.exit(1);
    }
    const chapters = pubRes.data.chapters || [];
    const minExpected = pid === 'valentine' ? 10 : 7;
    console.log(`- Public ${pid}: ${chapters.length} chapters available`);
    if (chapters.length < minExpected) {
      console.error(`FAIL: Public ${pid} has ${chapters.length} chapters, expected at least ${minExpected}`);
      process.exit(1);
    }

    if (pid === 'valentine') {
      const ch1 = chapters.find((c) => c.chapterNumber === 1 || c.chapterId === 'chap-01');
      if (!ch1?.contentAvailable || ch1?.isComingSoon) {
        console.error('FAIL: Valentine Chapter 01 must be readable (contentAvailable=true, isComingSoon=false)');
        process.exit(1);
      }
      for (let n = 2; n <= 7; n++) {
        const ch = chapters.find((c) => c.chapterNumber === n);
        if (!ch?.isComingSoon) {
          console.error(`FAIL: Valentine Chapter ${n} must be Coming Soon`);
          process.exit(1);
        }
      }
    } else {
      for (let n = 1; n <= 7; n++) {
        const ch = chapters.find((c) => c.chapterNumber === n);
        if (!ch?.isComingSoon) {
          console.error(`FAIL: Pilot ${pid} Chapter ${n} must be Coming Soon`);
          process.exit(1);
        }
      }
    }
  }
  console.log('PASS: Public story catalogs strictly adhere to the business rules across all 12 pilots.');

  console.log('\n=== TEST 6: VALENTINE CHAPTER 01 FULL PROSE RETRIEVAL ===');
  const valProseRes = await fetchJson('/api/runtime/story/valentine/chap-01');
  if (!valProseRes.data?.success || valProseRes.data?.isComingSoon || !valProseRes.data?.content) {
    console.error('FAIL: Valentine Chapter 01 prose failed to load:', valProseRes.data);
    process.exit(1);
  }
  console.log(`PASS: Valentine Chapter 01 prose loaded (${valProseRes.data.content.length} chars).`);

  console.log('\n=== TEST 7: UNWRITTEN CHAPTER GRACEFUL COMING SOON RETRIEVAL ===');
  const fortunaProseRes = await fetchJson('/api/runtime/story/fortuna/chap-01');
  if (!fortunaProseRes.data?.success || !fortunaProseRes.data?.isComingSoon) {
    console.error('FAIL: Fortuna Chapter 01 did not return graceful Coming Soon:', fortunaProseRes.data);
    process.exit(1);
  }
  console.log('PASS: Fortuna Chapter 01 returns isComingSoon: true without 404.');

  console.log('\n======================================================');
  console.log('>>> ALL DEV ADMIN PREVIEW & STORY TESTS PASSED (100%) <<<');
  console.log('======================================================');
}

run().catch((err) => {
  console.error('Error during test execution:', err);
  process.exit(1);
});
