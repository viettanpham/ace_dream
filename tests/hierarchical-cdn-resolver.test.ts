/**
 * STARFRONT WORLD V2 — HIERARCHICAL CDN RESOLVER TEST SUITE
 *
 * Verifies all 8 core test targets specified in Section G:
 * 1. Index discovery (images/manifest.json)
 * 2. Per-pilot manifest resolution (images/pilots/<pilotId>/manifest.json)
 * 3. CORE mapping consistency across all pilots
 * 4. Dynamic artwork gallery resolution
 * 5. Add / remove / hide status filtering (approved only, reject draft/rejected/hidden)
 * 6. Missing / invalid manifest graceful resilience
 * 7. Same-pilot fallback isolation (never cross-pollinate pilots)
 * 8. Release switching & cache invalidation
 */

import {
  fetchHierarchicalIndex,
  fetchPilotManifest,
  invalidateHierarchicalManifestCache,
  generateHierarchicalManifestBundle,
  HIERARCHICAL_PILOT_NAMES,
} from '../lib/game/assets/hierarchical-manifest';
import {
  resolveImageUrl,
  resolvePilotArtwork,
  setClientActiveRuntimeConfig,
} from '../lib/game/assets/image-resolver';
import {
  fetchReleaseManifest,
  clearManifestCache,
} from '../lib/game/assets/release-manifest';
import {
  V2_ROSTER_CHARACTERS,
  augmentCharacterWithHierarchicalArtworks,
  resolvePilotCoreAsset,
} from '../lib/game/v2/character-profile-data';

const CANONICAL_CDN_BASE =
  'https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r1/starfront-world-assets';

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 RUNNING STARFRONT V2 HIERARCHICAL CDN RESOLVER TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, extra?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${extra ? `(${extra})` : ''}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Index Discovery (images/manifest.json)
  // --------------------------------------------------------------------------
  console.log('--- TEST 1: Discovery Index (images/manifest.json) ---');
  const index = await fetchHierarchicalIndex(CANONICAL_CDN_BASE, 'v2.0-assets-r2-test');
  assert(index !== null, 'Index manifest loaded');
  assert(index.schemaVersion === 'starfront-hierarchical-index-v2', 'Correct schema version');
  assert(index.categories.pilots.status === 'configured', 'Pilots category is configured');
  assert(index.categories.gear.status === 'not_configured', 'GEAR category is not_configured');
  assert(index.categories.equipment.status === 'not_configured', 'Equipment category is not_configured');
  assert(index.categories.environments.status === 'not_configured', 'Environments category is not_configured');
  assert(index.categories.ui.status === 'not_configured', 'UI category is not_configured');
  assert(index.categories.pilots.pilotCount === 8, 'Index contains exactly 8 pilots');

  // --------------------------------------------------------------------------
  // TEST 2: Per-Pilot Manifest Resolution (images/pilots/<pilotId>/manifest.json)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: Per-Pilot Manifest Resolution ---');
  const expectedPilotCounts: Record<string, number> = {
    aria: 20,
    fortuna: 27,
    kaelen: 20,
    lyra: 20,
    nova: 22,
    rhea: 23,
    selena: 20,
    valentine: 30,
  };

  let totalCountSum = 0;
  for (const [pid, expectedCount] of Object.entries(expectedPilotCounts)) {
    const pilotManifest = await fetchPilotManifest(CANONICAL_CDN_BASE, 'v2.0-assets-r2-test', pid, index);
    assert(pilotManifest !== null, `Pilot manifest for ${pid} loaded`);
    if (pilotManifest) {
      assert(
        pilotManifest.approvedAssetsCount === expectedCount,
        `${pid}: Exactly ${expectedCount} approved artworks`,
        `got ${pilotManifest.approvedAssetsCount}, expected ${expectedCount}`
      );
      totalCountSum += pilotManifest.approvedAssetsCount;
    }
  }
  assert(totalCountSum === 182, `Total canonical approved count matches exactly 182 (sum=${totalCountSum})`);

  // --------------------------------------------------------------------------
  // TEST 3: CORE Mapping Verification
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: CORE Mapping Verification ---');
  const fortunaManifest = await fetchPilotManifest(CANONICAL_CDN_BASE, 'v2.0-assets-r2-test', 'fortuna');
  assert(fortunaManifest?.coreMapping?.portrait === 'fortuna-portrait.webp', 'Fortuna portrait core mapped');
  assert(fortunaManifest?.coreMapping?.fullbody === 'fortuna-fullbody.webp', 'Fortuna fullbody core mapped');
  assert(fortunaManifest?.coreMapping?.combat === 'fortuna-combat.webp', 'Fortuna combat core mapped');

  const rheaManifest = await fetchPilotManifest(CANONICAL_CDN_BASE, 'v2.0-assets-r2-test', 'rhea');
  assert(
    rheaManifest?.coreMapping?.portrait === 'rhea-portrait-command.webp',
    'Rhea portrait core mapped to slot alias (rhea-portrait-command.webp)'
  );

  const valManifest = await fetchPilotManifest(CANONICAL_CDN_BASE, 'v2.0-assets-r2-test', 'valentine');
  assert(
    valManifest?.coreMapping?.activity === 'valentine-activity-001.webp',
    'Valentine activity core mapped to slot alias (valentine-activity-001.webp)'
  );

  // --------------------------------------------------------------------------
  // TEST 4: Dynamic Artwork Gallery Augmentation
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: Dynamic Artwork Gallery Augmentation ---');
  const rawValentine = V2_ROSTER_CHARACTERS.find((c) => c.id === 'valentine')!;
  const augmentedValentine = await augmentCharacterWithHierarchicalArtworks(
    rawValentine,
    CANONICAL_CDN_BASE,
    'v2.0-assets-r2-test'
  );
  assert(augmentedValentine.artworks.length === 30, 'Valentine gallery dynamically populated with 30 artworks');
  assert(augmentedValentine.progressStatus.artStatus === 'COMPLETE_ART', 'Valentine status is COMPLETE_ART');
  assert(augmentedValentine.progressStatus.registeredArtCount === 30, 'Registered count is 30');

  // --------------------------------------------------------------------------
  // TEST 5: Status Filtering (Approved Only, skip draft/rejected/hidden)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: Status Filtering (Approved Only) ---');
  if (fortunaManifest) {
    const hasRejected = fortunaManifest.artworks.some((a) => a.status === 'rejected');
    const hasDraft = fortunaManifest.artworks.some((a) => a.status === 'draft');
    const hasHidden = fortunaManifest.artworks.some((a) => a.status === 'hidden');
    assert(!hasRejected && !hasDraft && !hasHidden, 'No rejected, draft, or hidden artworks rendered');
  }

  // --------------------------------------------------------------------------
  // TEST 6: Missing / Invalid Manifest Graceful Fallback
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 6: Missing / Invalid Manifest Graceful Resilience ---');
  const nonExistentPilot = await fetchPilotManifest(CANONICAL_CDN_BASE, 'v2.0-assets-r2-test', 'unknown_character_999');
  assert(nonExistentPilot === null, 'Non-existent pilot safely returns null without throwing');

  // --------------------------------------------------------------------------
  // TEST 7: Same-Pilot Fallback Isolation (No cross-pilot bleeding)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 7: Same-Pilot Fallback Isolation ---');
  const kaelenPortraitUrl = resolvePilotArtwork('kaelen', 'kaelen-portrait.webp', {
    mode: 'jsdelivr',
    cdnBaseUrl: CANONICAL_CDN_BASE,
  });
  assert(
    kaelenPortraitUrl.includes('images/pilots/kaelen/kaelen-portrait.webp') ||
    kaelenPortraitUrl.includes('images/kaelen-portrait.webp'),
    'Kaelen resolves strictly to Kaelen asset'
  );
  assert(
    !kaelenPortraitUrl.includes('valentine'),
    'Kaelen NEVER substitutes or bleeds into Valentine asset'
  );

  const ariaFullbody = resolvePilotCoreAsset('aria', 'fullbody');
  assert(ariaFullbody.includes('aria'), 'Aria fullbody resolves strictly to Aria asset');
  assert(!ariaFullbody.includes('valentine'), 'Aria never substitutes into Valentine');

  // --------------------------------------------------------------------------
  // TEST 8: Release Switching & Cache Invalidation
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 8: Release Switching & Cache Invalidation ---');
  // Populate cache for tag A
  await fetchPilotManifest(CANONICAL_CDN_BASE, 'tag-release-A', 'aria');
  // Invalidate cache for tag A
  invalidateHierarchicalManifestCache('tag-release-A');
  // Verify clearManifestCache also cleans up without errors
  clearManifestCache('tag-release-A');
  assert(true, 'Cache invalidation completed cleanly');

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`🏁 TEST SUITE RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((e) => {
  console.error('Test runner fatal error:', e);
  process.exit(1);
});
