import {
  resolveImageUrl,
  DEFAULT_JSDELIVR_CDN_BASE,
  ImageResolverConfig,
} from '../lib/game/assets/image-resolver';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error('Assertion Failed: ' + msg);
  }
}

console.log('='.repeat(70));
console.log('STARFRONT WORLD V2 — UNIT TESTS: IMAGE RESOLVER (WEB-01.3)');
console.log('='.repeat(70));

const sampleBase =
  'https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r1/starfront-world-assets';

// Test 1: Empty / Null / Undefined input returns "" (no fallback to /icon.svg)
assert(resolveImageUrl(null) === '', 'null path should return empty string');
assert(resolveImageUrl(undefined) === '', 'undefined path should return empty string');
assert(resolveImageUrl('') === '', 'empty path should return empty string');
assert(resolveImageUrl('   ') === '', 'whitespace path should return empty string');
console.log('✓ Test 1 Passed: Empty/null/undefined handling');

// Test 2: Absolute HTTP / HTTPS / Data URLs preserved as-is
const httpsUrl = 'https://example.com/art.png';
const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
assert(resolveImageUrl(httpsUrl) === httpsUrl, 'https url should be unchanged');
assert(resolveImageUrl(dataUrl) === dataUrl, 'data url should be unchanged');
console.log('✓ Test 2 Passed: Absolute network and data URLs preserved');

// Test 3: Local mode resolution
const localConfig: ImageResolverConfig = {
  mode: 'local',
  cdnBaseUrl: sampleBase,
};
assert(
  resolveImageUrl('/images/marcus-portrait.webp', localConfig) ===
    '/images/marcus-portrait.webp',
  'local mode should keep /images/marcus-portrait.webp'
);
assert(
  resolveImageUrl('images/alviss-fullbody.webp', localConfig) ===
    '/images/alviss-fullbody.webp',
  'local mode should normalize images/... to /images/...'
);
console.log('✓ Test 3 Passed: Local mode resolution');

// Test 4: jsDelivr CDN mode resolution with standard asset paths
const cdnConfig: ImageResolverConfig = {
  mode: 'jsdelivr',
  cdnBaseUrl: sampleBase,
};

const marcusExpected = `${sampleBase}/images/marcus-portrait.webp`;
assert(
  resolveImageUrl('/images/marcus-portrait.webp', cdnConfig) === marcusExpected,
  'marcus portrait should resolve to CDN URL'
);

const valentineExpected = `${sampleBase}/images/valentine-combat.webp`;
assert(
  resolveImageUrl('/images/valentine-combat.webp', cdnConfig) === valentineExpected,
  'valentine combat should resolve to CDN URL'
);

const vanguardExpected = `${sampleBase}/images/vanguard-gear.webp`;
assert(
  resolveImageUrl('/images/vanguard-gear.webp', cdnConfig) === vanguardExpected,
  'vanguard gear should resolve to CDN URL'
);
console.log('✓ Test 4 Passed: jsDelivr resolution for key Pilot and GEAR assets');

// Test 5: Trailing slash in CDN base URL handled cleanly (no double slashes)
const slashBaseConfig: ImageResolverConfig = {
  mode: 'jsdelivr',
  cdnBaseUrl: sampleBase + '/',
};
assert(
  resolveImageUrl('/images/aegis-gear.webp', slashBaseConfig) ===
    `${sampleBase}/images/aegis-gear.webp`,
  'trailing slash in base should be sanitized'
);
console.log('✓ Test 5 Passed: Base URL trailing slash sanitation');

// Test 6: Assets outside /images/ (e.g. /icon.svg) kept local
assert(
  resolveImageUrl('/icon.svg', cdnConfig) === '/icon.svg',
  '/icon.svg should stay local even in CDN mode'
);
assert(
  resolveImageUrl('icon.svg', cdnConfig) === '/icon.svg',
  'icon.svg should normalize to /icon.svg'
);
console.log('✓ Test 6 Passed: Non-image assets kept local');

// Test 7: Query strings preserved on asset paths
const queryPath = '/images/lyra-portrait.webp?v=2';
assert(
  resolveImageUrl(queryPath, cdnConfig) === `${sampleBase}/images/lyra-portrait.webp?v=2`,
  'query string should be preserved'
);
console.log('✓ Test 7 Passed: Query string preservation');

// Test 8: Future Cloudflare R2 mode resolution
const r2Base = 'https://assets.starfrontworld.com';
const r2Config: ImageResolverConfig = {
  mode: 'r2',
  cdnBaseUrl: r2Base,
};
assert(
  resolveImageUrl('/images/victor-fullbody.webp', r2Config) ===
    `${r2Base}/images/victor-fullbody.webp`,
  'R2 mode should resolve using R2 base URL'
);
console.log('✓ Test 8 Passed: Cloudflare R2 mode resolution');

console.log('='.repeat(70));
console.log('ALL 8 IMAGE RESOLVER UNIT TESTS PASSED SUCCESSFULLY!');
console.log('='.repeat(70));
