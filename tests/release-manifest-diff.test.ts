/**
 * STARFRONT WORLD V2 — UNIT TESTS: RELEASE MANIFEST & DIFF ENGINE (WEB-01.3.A)
 *
 * Verifies:
 * 1. Pilot ID inference from naming conventions.
 * 2. Category normalization for standard categories.
 * 3. Exact Version Diff calculation (ADDED, REMOVED, CHANGED, UNCHANGED, UNKNOWN).
 * 4. Required Canonical Assets protection (compatibility flag turns false if any core asset is removed).
 * 5. Fallback canonical manifest data integrity (contains 26 assets matching WEB01 inventory).
 */

import assert from 'node:assert';
import {
  inferPilotId,
  normalizeCategory,
  computeVersionDiff,
  CANONICAL_R1_MANIFEST_DATA,
  type ReleaseManifest,
} from '../lib/game/assets/release-manifest';
import { CANONICAL_CORE_26_ASSETS } from '../lib/game/assets/github-release-validator';

async function runTests() {
  console.log('='.repeat(70));
  console.log('STARFRONT WORLD V2 — TESTS: RELEASE MANIFEST & DIFF ENGINE');
  console.log('='.repeat(70));

  // --------------------------------------------------------------------------
  // TEST 1: Pilot ID Inference
  // --------------------------------------------------------------------------
  assert.strictEqual(inferPilotId('marcus-portrait.webp'), 'marcus');
  assert.strictEqual(inferPilotId('marcus-fullbody.webp'), 'marcus');
  assert.strictEqual(inferPilotId('valentine-combat.webp'), 'valentine');
  assert.strictEqual(inferPilotId('alviss-portrait.webp'), 'alviss');
  assert.strictEqual(inferPilotId('levi-fullbody.webp'), 'alviss');
  assert.strictEqual(inferPilotId('eric-portrait.webp'), 'eric');
  assert.strictEqual(inferPilotId('vanguard-gear.webp'), 'gear');
  assert.strictEqual(inferPilotId('falcon-gear.webp'), 'gear');
  assert.strictEqual(inferPilotId('aegis-gear.webp'), 'gear');
  assert.strictEqual(inferPilotId('custom-asset-01.webp'), 'other');
  console.log('✓ Test 1 Passed: Pilot ID inference across all naming patterns');

  // --------------------------------------------------------------------------
  // TEST 2: Category Normalization
  // --------------------------------------------------------------------------
  assert.strictEqual(normalizeCategory('portrait', 'marcus-portrait.webp'), 'portrait');
  assert.strictEqual(normalizeCategory('', 'marcus-portrait.webp'), 'portrait');
  assert.strictEqual(normalizeCategory('fullbody', 'alviss-fullbody.webp'), 'fullbody');
  assert.strictEqual(normalizeCategory('combat', 'valentine-combat.webp'), 'combat');
  assert.strictEqual(normalizeCategory('closeup', 'valentine-closeup.webp'), 'closeup');
  assert.strictEqual(normalizeCategory('activity', 'valentine-activity-001.webp'), 'activity');
  assert.strictEqual(normalizeCategory('uniform', 'valentine-uniform-001.webp'), 'outfit');
  assert.strictEqual(normalizeCategory('casual', 'valentine-casual.webp'), 'outfit');
  assert.strictEqual(normalizeCategory('story', 'valentine-story-001.webp'), 'story');
  assert.strictEqual(normalizeCategory('gear-illustration', 'vanguard-gear.webp'), 'gear');
  console.log('✓ Test 2 Passed: Category normalization with metadata and filename fallbacks');

  // --------------------------------------------------------------------------
  // TEST 3: Canonical R1 Manifest Integrity
  // --------------------------------------------------------------------------
  assert.strictEqual(CANONICAL_R1_MANIFEST_DATA.length, 26);
  assert.strictEqual(CANONICAL_CORE_26_ASSETS.length, 26);

  // Check that every single canonical core asset is present in R1 manifest
  const r1PathSet = new Set(CANONICAL_R1_MANIFEST_DATA.map((a) => a.relativePath));
  for (const requiredPath of CANONICAL_CORE_26_ASSETS) {
    assert.ok(
      r1PathSet.has(requiredPath),
      `Core asset ${requiredPath} must be present in CANONICAL_R1_MANIFEST_DATA`
    );
  }
  console.log('✓ Test 3 Passed: 100% of 26 core assets present in canonical R1 manifest');

  // --------------------------------------------------------------------------
  // TEST 4: Version Diff Calculation (Identical Releases => 100% UNCHANGED)
  // --------------------------------------------------------------------------
  const mockActiveManifest: ReleaseManifest = {
    schemaVersion: '1.0.0',
    packageName: 'starfront-world-assets',
    releaseTag: 'v2.0-assets-r1',
    cdnBaseUrl: 'https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r1/starfront-world-assets',
    totalFiles: 26,
    assets: CANONICAL_R1_MANIFEST_DATA.map((a) => ({
      ...a,
      cdnUrl: `https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r1/starfront-world-assets/${a.relativePath}`,
    })),
  };

  const diffSame = computeVersionDiff(mockActiveManifest, mockActiveManifest);
  assert.strictEqual(diffSame.unchangedCount, 26);
  assert.strictEqual(diffSame.addedCount, 0);
  assert.strictEqual(diffSame.removedCount, 0);
  assert.strictEqual(diffSame.changedCount, 0);
  assert.strictEqual(diffSame.unknownCount, 0);
  assert.strictEqual(diffSame.isCompatible, true);
  assert.strictEqual(diffSame.missingRequiredAssets.length, 0);
  console.log('✓ Test 4 Passed: Exact identical releases produce 26 UNCHANGED and 0 diff');

  // --------------------------------------------------------------------------
  // TEST 5: Version Diff Calculation (Added, Changed, Removed, Incompatible)
  // --------------------------------------------------------------------------
  const mockTargetManifest: ReleaseManifest = {
    schemaVersion: '1.0.0',
    packageName: 'starfront-world-assets',
    releaseTag: 'v2.0-assets-r2',
    cdnBaseUrl: 'https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r2/starfront-world-assets',
    totalFiles: 28,
    assets: [
      // 1. Keep marcus-portrait with same hash => UNCHANGED
      {
        fileName: 'marcus-portrait.webp',
        relativePath: 'images/marcus-portrait.webp',
        category: 'portrait',
        pilotId: 'marcus',
        pilotName: 'Marcus Thorne',
        sha256: '565b63ae63c4458e2b452090e085567adeb494c8c1c1ba7b843486b233d44c34',
      },
      // 2. Modify valentine-combat hash => CHANGED
      {
        fileName: 'valentine-combat.webp',
        relativePath: 'images/valentine-combat.webp',
        category: 'combat',
        pilotId: 'valentine',
        pilotName: 'Valentine Vance',
        sha256: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      },
      // 3. Add brand new asset => ADDED
      {
        fileName: 'alviss-story-001.webp',
        relativePath: 'images/alviss-story-001.webp',
        category: 'story',
        pilotId: 'alviss',
        pilotName: 'Levi Reed (Alviss)',
        sha256: '1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
      },
      // Note: All other 24 assets from R1 omitted in target => REMOVED
    ],
  };

  const diffModified = computeVersionDiff(mockActiveManifest, mockTargetManifest);
  assert.strictEqual(diffModified.unchangedCount, 1);
  assert.strictEqual(diffModified.changedCount, 1);
  assert.strictEqual(diffModified.addedCount, 1);
  assert.strictEqual(diffModified.removedCount, 24);
  assert.strictEqual(diffModified.isCompatible, false); // missing required core assets
  assert.ok(diffModified.missingRequiredAssets.length > 0);
  assert.ok(diffModified.missingRequiredAssets.includes('images/vanguard-gear.webp'));
  console.log('✓ Test 5 Passed: Accurate ADDED/CHANGED/REMOVED detection and core assets protection');

  console.log('='.repeat(70));
  console.log('ALL 5 RELEASE MANIFEST & DIFF ENGINE UNIT TESTS PASSED!');
  console.log('='.repeat(70));
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
