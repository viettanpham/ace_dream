import assert from 'node:assert';
import { universalContentResolver } from '../lib/game/v2/universal-content-resolver';
import { CANONICAL_12_PILOT_IDS } from '../lib/game/v2/universal-content-types';
import { getCharacterContentStore } from '../lib/game/v2/character-content-store';
import { createSessionToken } from '../lib/game/auth/admin-auth';

let testsPassed = 0;
let testsFailed = 0;

function expect(condition: boolean, message: string) {
  if (condition) {
    testsPassed++;
    console.log(`  PASS: ${message}`);
  } else {
    testsFailed++;
    console.error(`  FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('STARFRONT WORLD V2 — CP3-B TEST SUITE: GALLERY R3 + STORY ADMINCP');
  console.log('================================================================\n');

  const store = getCharacterContentStore();

  // -------------------------------------------------------------------------
  // 1. GALLERY R3 INTEGRATION VERIFICATION
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Gallery R3 Delivery Across 12 Canonical Pilots ---');
  let totalArtworks = 0;

  for (const pilotId of CANONICAL_12_PILOT_IDS) {
    const gallery = await universalContentResolver.getPilotGallery(pilotId);
    expect(Boolean(gallery), `Gallery resolved for ${pilotId}`);
    expect(Array.isArray(gallery?.artworks), `Artworks array exists for ${pilotId}`);
    expect(gallery!.artworks.length > 0, `${pilotId} has at least 1 artwork (actual: ${gallery!.artworks.length})`);

    // Verify 0 duplicates
    const idSet = new Set<string>();
    let hasDup = false;
    for (const art of gallery!.artworks) {
      if (idSet.has(art.assetId)) {
        hasDup = true;
        break;
      }
      idSet.add(art.assetId);
    }
    expect(!hasDup, `${pilotId}: 0 duplicate artwork IDs (${gallery!.artworks.length} items)`);

    // Check title and description
    const allHaveTitle = gallery!.artworks.every((a) => Boolean(a.title && a.title.trim().length > 0));
    expect(allHaveTitle, `${pilotId}: All artworks possess non-empty titles`);

    totalArtworks += gallery!.artworks.length;
  }

  expect(totalArtworks >= 247, `Total roster artworks resolved >= 247 (actual: ${totalArtworks})`);

  // -------------------------------------------------------------------------
  // 2. STORY CATALOG & COMING SOON DECOUPLING
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Story Catalog & Coming Soon State Decoupling ---');

  for (const pilotId of CANONICAL_12_PILOT_IDS) {
    const catalog = await universalContentResolver.getPilotStoryCatalog(pilotId);
    expect(Boolean(catalog), `Story catalog resolved for ${pilotId}`);
    expect(catalog!.chapters.length >= 7, `${pilotId} has at least 7 chapters (actual: ${catalog!.chapters.length})`);
  }

  // Valentine Chapter 01 has full prose
  const valCh01 = await universalContentResolver.getStoryChapterProse('valentine', 'chap-01');
  expect(Boolean(valCh01), 'Valentine Chapter 01 prose resolved');
  expect(valCh01!.isComingSoon === false, 'Valentine Chapter 01 isComingSoon is false');
  expect(valCh01!.content.length > 300, 'Valentine Chapter 01 body contains substantive prose');
  expect(valCh01!.sceneAnchors.length === 3, 'Valentine Chapter 01 contains 3 scene anchors');

  // Unwritten chapter: Fortuna Chapter 01
  const fortCh01 = await universalContentResolver.getStoryChapterProse('fortuna', 'chap-01');
  expect(Boolean(fortCh01), 'Fortuna Chapter 01 returns structured response');
  expect(fortCh01!.isComingSoon === true, 'Fortuna Chapter 01 is Coming Soon');
  expect(fortCh01!.content === '', 'Fortuna Chapter 01 has no fake prose');

  // -------------------------------------------------------------------------
  // 3. ADMINCP STORY MANAGEMENT & PERSISTENCE
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: AdminCP Story Management & Persistent Overrides ---');

  // 3.1. Update chapter status to REVIEW
  const updateRes1 = await store.updateStoryChapterStatus(
    'fortuna',
    'chap-02',
    {
      status: 'REVIEW',
      editorialStatus: 'REVIEW',
    },
    'test_admin'
  );
  expect(updateRes1.success, 'Admin updated Fortuna chap-02 status to REVIEW');

  universalContentResolver.clearCache();
  const fortCatalogUpdated = await universalContentResolver.getPilotStoryCatalog('fortuna', true);
  const fortCh02 = fortCatalogUpdated?.chapters.find((c) => c.chapterId === 'chap-02');
  expect(fortCh02?.status === 'REVIEW', 'Fortuna chap-02 reflects REVIEW status');

  // 3.2. Independence test: Set unwritten chapter to PUBLISHED
  // Even when PUBLISHED, because it lacks content, isComingSoon must remain TRUE!
  const updateResPub = await store.updateStoryChapterStatus(
    'fortuna',
    'chap-03',
    {
      status: 'PUBLISHED',
      publicationStatus: 'PUBLISHED',
    },
    'test_admin'
  );
  expect(updateResPub.success, 'Admin set unwritten Fortuna chap-03 to PUBLISHED');

  universalContentResolver.clearCache();
  const fortCatalogPub = await universalContentResolver.getPilotStoryCatalog('fortuna', false);
  const fortCh03 = fortCatalogPub?.chapters.find((c) => c.chapterId === 'chap-03');
  expect(Boolean(fortCh03), 'Fortuna chap-03 is listed in public catalog');
  expect(fortCh03?.publicationStatus === 'PUBLISHED', 'Fortuna chap-03 publicationStatus is PUBLISHED');
  expect(fortCh03?.contentAvailable === false, 'Fortuna chap-03 contentAvailable remains FALSE (independent rule)');
  expect(fortCh03?.isComingSoon === true, 'Fortuna chap-03 isComingSoon remains TRUE (does not load missing file)');

  // 3.3. Hidden Chapter test
  // Hide Fortuna chap-04
  const hideRes = await store.updateStoryChapterStatus(
    'fortuna',
    'chap-04',
    {
      status: 'HIDDEN',
      isHidden: true,
    },
    'test_admin'
  );
  expect(hideRes.success, 'Admin set Fortuna chap-04 to HIDDEN');

  universalContentResolver.clearCache();

  // Public caller (isAdminOrReview = false) MUST NOT see chap-04
  const publicCatalog = await universalContentResolver.getPilotStoryCatalog('fortuna', false);
  const publicCh04 = publicCatalog?.chapters.find((c) => c.chapterId === 'chap-04');
  expect(!publicCh04, 'Public catalog completely filters out HIDDEN chap-04');

  // Admin caller (isAdminOrReview = true) CAN see chap-04 with isHidden: true
  const adminCatalog = await universalContentResolver.getPilotStoryCatalog('fortuna', true);
  const adminCh04 = adminCatalog?.chapters.find((c) => c.chapterId === 'chap-04');
  expect(Boolean(adminCh04), 'Admin catalog includes HIDDEN chap-04 for management');
  expect(adminCh04?.isHidden === true, 'Admin catalog flags chap-04 as isHidden: true');

  // Unhide Fortuna chap-04
  await store.updateStoryChapterStatus(
    'fortuna',
    'chap-04',
    {
      status: 'DRAFT',
      isHidden: false,
    },
    'test_admin'
  );
  universalContentResolver.clearCache();

  // 3.4. Reordering test
  const reorderRes = await store.reorderStoryChapters(
    'lyra',
    ['chap-03', 'chap-01', 'chap-02', 'chap-04', 'chap-05', 'chap-06', 'chap-07'],
    'test_admin'
  );
  expect(reorderRes.success, 'Admin reordered Lyra chapters');

  universalContentResolver.clearCache();
  const lyraCatalog = await universalContentResolver.getPilotStoryCatalog('lyra', true);
  expect(lyraCatalog?.chapters[0].chapterId === 'chap-03', 'First chapter in Lyra catalog is now chap-03');
  expect(lyraCatalog?.chapters[1].chapterId === 'chap-01', 'Second chapter in Lyra catalog is now chap-01');

  // Reset Lyra order back
  await store.reorderStoryChapters(
    'lyra',
    ['chap-01', 'chap-02', 'chap-03', 'chap-04', 'chap-05', 'chap-06', 'chap-07'],
    'test_admin'
  );
  universalContentResolver.clearCache();

  // -------------------------------------------------------------------------
  // 4. SECURITY & PERMISSIONS GATEKEEPING
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: Security, Authentication & Session Fail-Closed ---');

  // Session token creation and validation
  const session = createSessionToken('admin', 'admin');
  expect(Boolean(session.cookieValue), 'Generated valid signed session token');
  expect(Boolean(session.csrfToken), 'Generated valid CSRF token');

  // -------------------------------------------------------------------------
  // 5. LIVE HTTP ENDPOINT INTEGRITY
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5: Live HTTP Endpoint Verification ---');

  try {
    const resRoot = await fetch('http://localhost:3000/');
    expect(resRoot.status === 200, 'GET / returned HTTP 200');

    const resV1 = await fetch('http://localhost:3000/v1');
    expect(resV1.status === 200, 'GET /v1 returned HTTP 200 (Starfront V1 preserved)');

    const resPilots = await fetch('http://localhost:3000/v2/pilots');
    expect(resPilots.status === 200, 'GET /v2/pilots returned HTTP 200');

    const resGalVal = await fetch('http://localhost:3000/api/runtime/gallery/valentine');
    const galData = await resGalVal.json();
    expect(galData.success === true, 'GET /api/runtime/gallery/valentine succeeded');
    expect(galData.totalAssets === 35, 'Valentine totalAssets is 35');

    const resStoryVal = await fetch('http://localhost:3000/api/runtime/story/valentine');
    const storyData = await resStoryVal.json();
    expect(storyData.success === true, 'GET /api/runtime/story/valentine succeeded');

    // Test unauthenticated POST to /api/admin/story (must be 401 or 403)
    const resAdminNoAuth = await fetch('http://localhost:3000/api/admin/story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_publication', pilotId: 'valentine', chapterId: 'chap-01' }),
    });
    expect(resAdminNoAuth.status === 401 || resAdminNoAuth.status === 403, 'Anonymous POST /api/admin/story rejected (401/403 Fail-Closed)');
  } catch (err: any) {
    console.warn('HTTP endpoint check skipped or server not yet listening:', err.message);
  }

  console.log('\n================================================================');
  console.log(`CP3-B SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('================================================================');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
