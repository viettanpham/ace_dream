import assert from 'assert';
import { resolveImageUrl, resolvePilotArtwork, resolvePilotCoreAsset, DEFAULT_JSDELIVR_CDN_BASE } from '../lib/game/assets/image-resolver';
import { PILOT_V2_CORE_MAPPINGS, V2_ROSTER_CHARACTERS } from '../lib/game/v2/character-profile-data';
import { VERIFIED_CANONICAL_PILOT_IDS } from '../components/game/v2/pilot-profile/pilot-avatar';

async function runHotfixTests() {
  console.log('--- TEST SUITE: HOTFIX PREVIEW CRASH & CHARACTER CATEGORY CDN R2 ---');

  // Test 1: Verify DEFAULT_JSDELIVR_CDN_BASE contains v2.0-assets-r2
  assert(
    DEFAULT_JSDELIVR_CDN_BASE.includes('v2.0-assets-r2'),
    'Default CDN base must target active release v2.0-assets-r2'
  );
  console.log('✓ PASS 01: Default CDN base points to v2.0-assets-r2');

  // Test 2: Alviss is present in PILOT_V2_CORE_MAPPINGS
  assert(PILOT_V2_CORE_MAPPINGS['alviss'], 'Alviss must be registered in PILOT_V2_CORE_MAPPINGS');
  assert.strictEqual(
    PILOT_V2_CORE_MAPPINGS['alviss'].fullbody,
    '/images/pilots/alviss/alviss-fullbody.webp',
    'Alviss fullbody must point to hierarchical path'
  );
  assert.strictEqual(
    PILOT_V2_CORE_MAPPINGS['alviss'].portrait,
    '/images/pilots/alviss/alviss-portrait.webp',
    'Alviss portrait must point to hierarchical path'
  );
  console.log('✓ PASS 02: Alviss registered in PILOT_V2_CORE_MAPPINGS with canonical R2 paths');

  // Test 3: All 12 canonical pilots are present in VERIFIED_CANONICAL_PILOT_IDS
  const expected12Pilots = [
    'valentine', 'marcus', 'alviss', 'eric', 'victor',
    'kaelen', 'lyra', 'selena', 'fortuna', 'aria', 'rhea', 'nova'
  ];
  for (const pId of expected12Pilots) {
    assert(
      VERIFIED_CANONICAL_PILOT_IDS.includes(pId),
      `Pilot ${pId} must be included in VERIFIED_CANONICAL_PILOT_IDS`
    );
  }
  console.log('✓ PASS 03: VERIFIED_CANONICAL_PILOT_IDS includes all 12 canonical pilots');

  // Test 4: URL resolution for Valentine and Alviss resolves to hierarchical R2 paths
  const valUrl = resolveImageUrl('/images/pilots/valentine/valentine-fullbody.webp');
  assert(
    valUrl.includes('v2.0-assets-r2') && valUrl.includes('images/pilots/valentine/valentine-fullbody.webp'),
    `Valentine URL must resolve correctly: got ${valUrl}`
  );

  const alvissUrl = resolveImageUrl('/images/pilots/alviss/alviss-portrait.webp');
  assert(
    alvissUrl.includes('v2.0-assets-r2') && alvissUrl.includes('images/pilots/alviss/alviss-portrait.webp'),
    `Alviss URL must resolve correctly: got ${alvissUrl}`
  );

  // Test 4b: Flat path auto-normalization for V2 pilots
  const flatValUrl = resolveImageUrl('images/valentine-fullbody.webp');
  assert(
    flatValUrl.includes('images/pilots/valentine/valentine-fullbody.webp'),
    `Flat valentine path should normalize to hierarchical: got ${flatValUrl}`
  );
  console.log('✓ PASS 04: URL resolution resolves to v2.0-assets-r2 hierarchical paths');

  // Test 5: Legacy pilot and Gear safety check (zero regression)
  const marcusUrl = resolveImageUrl('/images/marcus-portrait.webp');
  assert(
    marcusUrl.includes('images/marcus-portrait.webp'),
    `Legacy marcus path must be preserved: got ${marcusUrl}`
  );

  const gearUrl = resolveImageUrl('/images/aegis-gear.webp');
  assert(
    gearUrl.includes('images/aegis-gear.webp'),
    `Gear path must be preserved: got ${gearUrl}`
  );
  console.log('✓ PASS 05: Legacy pilots and Gear paths preserved with backward compatibility');

  // Test 6: Verify all 12 pilots in V2_ROSTER_CHARACTERS have non-empty core asset paths
  assert.strictEqual(V2_ROSTER_CHARACTERS.length, 12, 'Roster must contain 12 canonical characters');
  for (const char of V2_ROSTER_CHARACTERS) {
    assert(char.fullbodyAssetPath, `Character ${char.id} must have fullbodyAssetPath`);
    assert(char.portraitAssetPath, `Character ${char.id} must have portraitAssetPath`);
    const resolvedFullbody = resolveImageUrl(char.fullbodyAssetPath);
    assert(resolvedFullbody.startsWith('https://'), `Resolved URL must be valid: got ${resolvedFullbody}`);
  }
  console.log('✓ PASS 06: All 12 roster pilots have verified non-empty core asset paths');

  console.log('=== ALL HOTFIX TESTS PASSED SUCCESSFULLY (6/6) ===');
}

runHotfixTests().catch((err) => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
