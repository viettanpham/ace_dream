/**
 * STARFRONT WORLD V2 — STORY UI FINAL SMOKE TEST
 * Verifies exact requirements from FIX STORY UI FINAL user request:
 * 1. Valentine: Chapter 01 (Full prose), 02, 03, 07 (Coming Soon, no 404, no fake prose).
 * 2. Fortuna and Aria: Chapter 01, 03, 07 (Coming Soon, verified summaries, no 404).
 * 3. All 12 pilots have dynamic Chapter 01-07 catalog (Valentine has 10).
 * 4. AdminCP marking HIDDEN removes chapter from public catalog while preserving in AdminCP, and reverts cleanly.
 * 5. Preservation of Gallery R3, V1, and Admin Auth.
 */

import http from 'http';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, headers: res.headers, data: json, raw: body });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`  PASS: ${message}`);
}

async function run() {
  console.log('======================================================');
  console.log('STARFRONT WORLD V2 — STORY UI FINAL SMOKE TEST');
  console.log('======================================================\n');

  const BASE = 'http://localhost:3000';

  // 1. Valentine: Chapter 01, 02, 03, 07
  console.log('--- TEST 1: Valentine Chapter 01, 02, 03, 07 ---');
  const v01 = await makeRequest(`${BASE}/api/runtime/story/valentine/chap-01`);
  assert(v01.status === 200, 'Valentine chap-01 returns HTTP 200');
  assert(v01.data?.success === true, 'Valentine chap-01 success is true');
  assert(v01.data?.isComingSoon === false, 'Valentine chap-01 isComingSoon is false');
  assert(typeof v01.data?.content === 'string' && v01.data.content.length > 500, 'Valentine chap-01 has substantive prose (>500 chars)');

  const v02 = await makeRequest(`${BASE}/api/runtime/story/valentine/chap-02`);
  assert(v02.status === 200, 'Valentine chap-02 returns HTTP 200');
  assert(v02.data?.isComingSoon === true, 'Valentine chap-02 isComingSoon is true');
  assert(v02.data?.content === '', 'Valentine chap-02 has NO fake prose (content is empty string)');
  assert(Boolean(v02.data?.meta?.summary), 'Valentine chap-02 provides verified summary');

  const v03 = await makeRequest(`${BASE}/api/runtime/story/valentine/chap-03`);
  assert(v03.status === 200, 'Valentine chap-03 returns HTTP 200');
  assert(v03.data?.isComingSoon === true, 'Valentine chap-03 isComingSoon is true');
  assert(v03.data?.content === '', 'Valentine chap-03 has NO fake prose');

  const v07 = await makeRequest(`${BASE}/api/runtime/story/valentine/chap-07`);
  assert(v07.status === 200, 'Valentine chap-07 returns HTTP 200');
  assert(v07.data?.isComingSoon === true, 'Valentine chap-07 isComingSoon is true');
  assert(v07.data?.content === '', 'Valentine chap-07 has NO fake prose');
  assert(Boolean(v07.data?.meta?.title), 'Valentine chap-07 has title');

  // 2. Fortuna and Aria: Chapter 01, 03, 07
  console.log('\n--- TEST 2: Fortuna & Aria Chapter 01, 03, 07 ---');
  for (const pilot of ['fortuna', 'aria']) {
    for (const chap of ['chap-01', 'chap-03', 'chap-07']) {
      const res = await makeRequest(`${BASE}/api/runtime/story/${pilot}/${chap}`);
      assert(res.status === 200, `${pilot} ${chap} returns HTTP 200 (No 404)`);
      assert(res.data?.success === true, `${pilot} ${chap} success is true`);
      assert(res.data?.isComingSoon === true, `${pilot} ${chap} isComingSoon is true`);
      assert(res.data?.content === '', `${pilot} ${chap} has no fake prose`);
      assert(Boolean(res.data?.meta?.title), `${pilot} ${chap} has verified title: ${res.data?.meta?.title}`);
    }
  }

  // 3. Dynamic Catalog for all 12 Pilots (Chapter 01-07; Valentine has 10)
  console.log('\n--- TEST 3: All 12 Pilots Dynamic Catalog Verification ---');
  const CANONICAL_PILOTS = [
    'alviss', 'eric', 'marcus', 'victor',
    'kaelen', 'lyra', 'selena', 'valentine',
    'fortuna', 'aria', 'rhea', 'nova'
  ];

  for (const p of CANONICAL_PILOTS) {
    const cat = await makeRequest(`${BASE}/api/runtime/story?pilotId=${p}`);
    assert(cat.status === 200, `Catalog for ${p} returns HTTP 200`);
    assert(cat.data?.success === true, `Catalog for ${p} success is true`);
    const expectedCount = p === 'valentine' ? 10 : 7;
    assert(
      cat.data?.chapters?.length >= expectedCount,
      `Pilot ${p} has >= ${expectedCount} chapters (actual: ${cat.data?.chapters?.length})`
    );
    // Verify chapters 1 through 7 exist
    for (let i = 1; i <= (p === 'valentine' ? 10 : 7); i++) {
      const exists = cat.data.chapters.some((c) => c.chapterNumber === i);
      assert(exists, `Pilot ${p} includes Chapter ${String(i).padStart(2, '0')}`);
    }
  }

  // 4. AdminCP HIDDEN Visibility Toggle Flow
  console.log('\n--- TEST 4: AdminCP HIDDEN Toggle & Public Filtering ---');
  // Get admin session
  const authMe = await makeRequest(`${BASE}/api/admin/auth/me`);
  assert(authMe.data?.authenticated === true, 'Admin auth me returned authenticated session');
  const token = authMe.data?.sessionToken;
  const csrf = authMe.data?.csrfToken;

  // Set Fortuna chap-05 to HIDDEN
  const hideRes = await makeRequest(`${BASE}/api/admin/story`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-csrf-token': csrf,
    },
    body: {
      action: 'update_chapter_status',
      pilotId: 'fortuna',
      chapterId: 'chap-05',
      editorialStatus: 'HOLD',
      publicationStatus: 'HIDDEN',
      isHidden: true,
    },
  });
  assert(hideRes.status === 200 && hideRes.data?.success, 'Admin set Fortuna chap-05 to HIDDEN');

  // Verify public catalog NO LONGER includes chap-05
  const publicFortuna = await makeRequest(`${BASE}/api/runtime/story?pilotId=fortuna`);
  const chap05InPublic = publicFortuna.data?.chapters?.some((c) => c.chapterId === 'chap-05');
  assert(!chap05InPublic, 'Fortuna chap-05 is completely filtered out from public catalog');

  // Verify Admin still sees chap-05 in character-content
  const adminContent = await makeRequest(`${BASE}/api/admin/character-content`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const adminFortunaStories = adminContent.data?.manifest?.stories?.fortuna;
  const chap05InAdmin = adminFortunaStories?.chapters?.some((c) => c.chapterId === 'chap-05');
  assert(chap05InAdmin, 'Fortuna chap-05 remains accessible in AdminCP catalog for management');

  // Revert Fortuna chap-05 back
  const revertRes = await makeRequest(`${BASE}/api/admin/story`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-csrf-token': csrf,
    },
    body: {
      action: 'update_chapter_status',
      pilotId: 'fortuna',
      chapterId: 'chap-05',
      editorialStatus: 'HOLD',
      publicationStatus: 'REVIEW_ONLY',
      isHidden: false,
    },
  });
  assert(revertRes.status === 200 && revertRes.data?.success, 'Admin reverted Fortuna chap-05 isHidden to false');

  const publicFortunaReverted = await makeRequest(`${BASE}/api/runtime/story?pilotId=fortuna`);
  const chap05Restored = publicFortunaReverted.data?.chapters?.some((c) => c.chapterId === 'chap-05');
  assert(chap05Restored, 'Fortuna chap-05 restored to public catalog after revert');

  // 5. Preservations: Gallery R3, V1, Roster
  console.log('\n--- TEST 5: System Preservations ---');
  const v1Page = await makeRequest(`${BASE}/v1`);
  assert(v1Page.status === 200, 'Starfront V1 (/v1) returns HTTP 200');

  const galleryKaelen = await makeRequest(`${BASE}/api/runtime/gallery/kaelen`);
  assert(galleryKaelen.status === 200 && galleryKaelen.data?.artworks?.length >= 25, 'Kaelen gallery returns >= 25 artworks');

  const pilotsPage = await makeRequest(`${BASE}/v2/pilots`);
  assert(pilotsPage.status === 200, '/v2/pilots returns HTTP 200');

  console.log('\n======================================================');
  console.log('>>> ALL STORY UI FINAL TESTS PASSED (100%) <<<');
  console.log('======================================================');
}

run().catch((err) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
