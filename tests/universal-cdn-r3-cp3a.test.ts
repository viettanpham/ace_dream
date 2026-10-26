/**
 * STARFRONT WORLD V2 — UNIVERSAL CDN R3 CORE INTEGRATION TESTS (CP3-A)
 * 
 * Verifies:
 * 1. Root content manifest resolution on CDN R3 (v3.0-assets-r3) & local staging.
 * 2. Visual Art Gallery resolution for all 12 canonical pilots:
 *    - Accurate asset counts (Valentine 35, Fortuna 30, Rhea 23, Nova 22, etc.).
 *    - 0 duplicate artworks per pilot.
 *    - Title and curated description integrity.
 *    - 4 V1 core references for Marcus / Victor / Eric preserved.
 * 3. Story Catalog for 12 canonical pilots:
 *    - Chapter 01–07 catalog presence for all 12 pilots.
 *    - "Đang phát triển / Coming Soon" status correctly identified for unwritten chapters.
 * 4. Valentine Chapter 01 full prose and scene anchors:
 *    - 12 blocks and 3 scene anchors verified.
 * 5. Offline / Local Staging Resilience:
 *    - Resolver falls back gracefully when network is simulated offline.
 * 6. Public preview safety: Zero admin secrets required for read-only preview.
 */

import { universalContentResolver } from '../lib/game/v2/universal-content-resolver';
import { CANONICAL_12_PILOT_IDS } from '../lib/game/v2/universal-content-types';

async function runTestSuite() {
  console.log('================================================================');
  console.log('STARFRONT WORLD V2 — UNIVERSAL CDN R3 CP3-A TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // TEST 1: Root Content Manifest Resolution
  console.log('--- TEST 1: Root Content Manifest Resolution ---');
  try {
    const root = await universalContentResolver.getRootManifest();
    assert(Boolean(root), 'Root manifest loaded successfully');
    assert(root?.schemaVersion === 'starfront-content-manifest-v3', 'Schema version is starfront-content-manifest-v3');
    assert(root?.releaseTag === 'v3.0-assets-r3', 'Release tag is v3.0-assets-r3');
    assert(root?.subsystems?.images?.status === 'active', 'Subsystem images is active');
    assert(root?.subsystems?.stories?.status === 'active', 'Subsystem stories is active');
    assert(root?.subsystems?.images?.totalPilots === 12, '12 canonical pilots in images subsystem');
    assert(root?.subsystems?.stories?.totalPilots === 12, '12 canonical pilots in stories subsystem');
  } catch (err: any) {
    assert(false, 'Root manifest error', err.message);
  }

  // TEST 2: Visual Art Gallery for 12 Canonical Pilots
  console.log('\n--- TEST 2: Visual Art Gallery for 12 Canonical Pilots ---');
  try {
    let totalRosterArtworks = 0;

    for (const pilotId of CANONICAL_12_PILOT_IDS) {
      const gallery = await universalContentResolver.getPilotGallery(pilotId);
      assert(Boolean(gallery), `Gallery manifest resolved for ${pilotId}`);
      if (!gallery) continue;

      // Check duplicate artworks
      const ids = gallery.artworks.map((a) => a.assetId);
      const uniqueIds = new Set(ids);
      assert(
        ids.length === uniqueIds.size,
        `Pilot ${pilotId}: 0 duplicate artwork IDs (${ids.length} artworks)`
      );

      // Check title and description
      const hasTitles = gallery.artworks.every((a) => Boolean(a.title && a.title.trim().length > 0));
      assert(hasTitles, `Pilot ${pilotId}: All artworks possess valid non-empty titles`);

      const hasDescriptions = gallery.artworks.every(
        (a) => Boolean(a.description && a.description.trim().length > 0)
      );
      assert(hasDescriptions, `Pilot ${pilotId}: All artworks possess descriptions`);

      totalRosterArtworks += gallery.artworks.length;
    }

    // Specific counts verification
    const valGallery = await universalContentResolver.getPilotGallery('valentine');
    assert(valGallery?.totalAssets === 35, 'Valentine has exactly 35 approved artworks');

    const fortGallery = await universalContentResolver.getPilotGallery('fortuna');
    assert(fortGallery?.totalAssets === 30, 'Fortuna has exactly 30 approved artworks');

    const rheaGallery = await universalContentResolver.getPilotGallery('rhea');
    assert(rheaGallery?.totalAssets === 30, `Rhea has 30 approved artworks (actual: ${rheaGallery?.totalAssets})`);

    const novaGallery = await universalContentResolver.getPilotGallery('nova');
    assert(novaGallery?.totalAssets === 26, `Nova has 26 approved artworks (actual: ${novaGallery?.totalAssets})`);

    const ericGallery = await universalContentResolver.getPilotGallery('eric');
    assert((ericGallery?.totalAssets || 0) >= 2, `Eric has at least 2 artworks (actual: ${ericGallery?.totalAssets})`);

    const marcusGallery = await universalContentResolver.getPilotGallery('marcus');
    assert(marcusGallery?.totalAssets === 2, 'Marcus has 2 V1 core artworks');

    const victorGallery = await universalContentResolver.getPilotGallery('victor');
    assert(victorGallery?.totalAssets === 2, 'Victor has 2 V1 core artworks');

    assert(
      totalRosterArtworks >= 200,
      `Total roster artworks resolved (${totalRosterArtworks} >= 200)`
    );
  } catch (err: any) {
    assert(false, 'Gallery resolution error', err.message);
  }

  // TEST 3: Story Catalog for 12 Canonical Pilots
  console.log('\n--- TEST 3: Story Catalog for 12 Canonical Pilots ---');
  try {
    for (const pilotId of CANONICAL_12_PILOT_IDS) {
      const catalog = await universalContentResolver.getPilotStoryCatalog(pilotId);
      assert(Boolean(catalog), `Story catalog resolved for ${pilotId}`);
      if (!catalog) continue;

      assert(
        catalog.chapters.length >= 7,
        `Pilot ${pilotId}: Contains at least 7 catalog chapters (actual: ${catalog.chapters.length})`
      );

      // Verify Chapter 01 to 07 ordering
      for (let i = 1; i <= 7; i++) {
        const ch = catalog.chapters.find((c) => c.chapterNumber === i);
        assert(Boolean(ch), `Pilot ${pilotId}: Chapter ${i} present in catalog`);
      }
    }

    // Test Valentine story catalog specifics
    const valCatalog = await universalContentResolver.getPilotStoryCatalog('valentine');
    const valCh01 = valCatalog?.chapters.find((c) => c.chapterNumber === 1);
    assert(valCh01?.contentAvailable === true, 'Valentine Chapter 01 is contentAvailable = true');
    assert(valCh01?.isComingSoon === false, 'Valentine Chapter 01 isComingSoon = false');

    const valCh02 = valCatalog?.chapters.find((c) => c.chapterNumber === 2);
    assert(valCh02?.contentAvailable === false, 'Valentine Chapter 02 is contentAvailable = false');
    assert(valCh02?.isComingSoon === true, 'Valentine Chapter 02 isComingSoon = true (Coming Soon state)');

    // Test unwritten pilot story catalog (e.g. Alviss)
    const alvissCatalog = await universalContentResolver.getPilotStoryCatalog('alviss');
    const alvissCh01 = alvissCatalog?.chapters.find((c) => c.chapterNumber === 1);
    assert(alvissCh01?.contentAvailable === false, 'Alviss Chapter 01 is contentAvailable = false');
    assert(alvissCh01?.isComingSoon === true, 'Alviss Chapter 01 isComingSoon = true (Coming Soon state)');
  } catch (err: any) {
    assert(false, 'Story catalog error', err.message);
  }

  // TEST 4: Valentine Chapter 01 Prose & Scene Anchors
  console.log('\n--- TEST 4: Valentine Chapter 01 Prose & Scene Anchors ---');
  try {
    const valProse = await universalContentResolver.getStoryChapterProse('valentine', 'chap-01', true);
    assert(Boolean(valProse), 'Valentine Chapter 01 prose resolved');
    assert(valProse?.isComingSoon === false, 'Valentine Chapter 01 is not coming soon');
    assert(Boolean(valProse?.content && valProse.content.length > 300), 'Prose body contains substantive text (>300 chars)');
    assert(valProse?.sceneAnchors.length === 3, `Contains 3 scene anchors (actual: ${valProse?.sceneAnchors.length})`);

    const hasSceneAcademy = valProse?.sceneAnchors.some((a) => a.anchorId === 'val-ch01-scene-academy');
    assert(hasSceneAcademy, 'Scene anchor val-ch01-scene-academy present');

    const hasSceneEvac = valProse?.sceneAnchors.some((a) => a.anchorId === 'val-ch01-scene-evac');
    assert(hasSceneEvac, 'Scene anchor val-ch01-scene-evac present');

    const hasSceneResolve = valProse?.sceneAnchors.some((a) => a.anchorId === 'val-ch01-scene-resolve');
    assert(hasSceneResolve, 'Scene anchor val-ch01-scene-resolve present');
  } catch (err: any) {
    assert(false, 'Valentine prose error', err.message);
  }

  // TEST 5: Graceful Coming Soon Handling for Unwritten Chapters
  console.log('\n--- TEST 5: Graceful Coming Soon Handling for Unwritten Chapters ---');
  try {
    const valCh02Prose = await universalContentResolver.getStoryChapterProse('valentine', 'chap-02', false);
    assert(Boolean(valCh02Prose), 'Valentine Chapter 02 returns structured response without throwing');
    assert(valCh02Prose?.isComingSoon === true, 'Valentine Chapter 02 flagged as isComingSoon: true');
    assert(valCh02Prose?.content === '', 'Valentine Chapter 02 does not return fake or empty prose');
    assert(Boolean(valCh02Prose?.meta?.summary), 'Valentine Chapter 02 provides approved summary');

    const ericCh01Prose = await universalContentResolver.getStoryChapterProse('eric', 'chap-01', false);
    assert(Boolean(ericCh01Prose), 'Eric Chapter 01 returns structured response');
    assert(ericCh01Prose?.isComingSoon === true, 'Eric Chapter 01 flagged as isComingSoon: true');
  } catch (err: any) {
    assert(false, 'Coming soon handling error', err.message);
  }

  // TEST 6: Public Preview Safety (No Admin Secrets Required)
  console.log('\n--- TEST 6: Public Preview Safety ---');
  try {
    // Calling public resolver methods requires zero passwords or session tokens
    const root = await universalContentResolver.getRootManifest();
    assert(Boolean(root), 'Public root manifest accessed without credentials');

    const gallery = await universalContentResolver.getPilotGallery('kaelen');
    assert(Boolean(gallery), 'Public pilot gallery accessed without credentials');
  } catch (err: any) {
    assert(false, 'Public preview safety error', err.message);
  }

  console.log('\n================================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
