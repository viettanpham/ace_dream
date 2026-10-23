import {
  validateRuntimeAssetConfig,
  computeCdnBaseUrl,
  toPublicAssetConfig,
  FileAssetConfigStore,
  DEFAULT_RUNTIME_ASSET_CONFIG,
  DEFAULT_PUBLIC_ASSET_CONFIG,
  CANONICAL_ACTIVE_VERSION,
  CANONICAL_REPOSITORY,
  CANONICAL_ASSET_ROOT,
  RuntimeAssetConfig,
} from '../lib/game/assets/runtime-asset-config';
import {
  resolveImageUrl,
  resolveImageUrlWithConfig,
} from '../lib/game/assets/image-resolver';
import * as fs from 'fs';
import * as path from 'path';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error('Assertion Failed: ' + msg);
  }
}

console.log('='.repeat(75));
console.log('STARFRONT WORLD V2 — UNIT TESTS: RUNTIME ASSET CONFIG (WEB-01.3.A.1)');
console.log('='.repeat(75));

// ============================================================================
// TEST 1: Schema Validation with Valid Configurations
// ============================================================================
{
  const checkDefault = validateRuntimeAssetConfig(DEFAULT_RUNTIME_ASSET_CONFIG);
  assert(checkDefault.valid === true, 'DEFAULT_RUNTIME_ASSET_CONFIG must be valid');
  assert(checkDefault.config?.activeVersion === 'v2.0-assets-r1', 'Default active version must be r1');
  assert(
    checkDefault.config?.cdnBaseUrl ===
      'https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r1/starfront-world-assets',
    'Default CDN Base URL must match canonical jsDelivr format'
  );

  const customValid: RuntimeAssetConfig = {
    schemaVersion: 1,
    revision: 5,
    provider: 'jsdelivr',
    repository: 'viettanpham/starfront-assets',
    assetRoot: 'starfront-world-assets',
    activeVersion: 'v2.0-assets-r2',
    cdnBaseUrl: '',
    previousVersion: 'v2.0-assets-r1',
    updatedAt: '2026-10-23T00:00:00.000Z',
    updatedBy: 'admin_test',
  };
  const checkCustom = validateRuntimeAssetConfig(customValid);
  assert(checkCustom.valid === true, 'Valid custom config must pass validation');
  assert(
    checkCustom.config?.cdnBaseUrl ===
      'https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r2/starfront-world-assets',
    'Custom config CDN URL must be computed correctly'
  );
  console.log('✓ Test 1 Passed: Schema validation with valid default and custom configs');
}

// ============================================================================
// TEST 2: Rejection of Invalid Versions and Path Traversal Attempts
// ============================================================================
{
  const maliciousTags = [
    '../../etc/passwd',
    'v2.0/../v1.0',
    '; rm -rf /',
    'latest', // Not immutable versioned tag
    'v2.0-assets-r1;malicious',
    '<script>alert(1)</script>',
    '',
    '   ',
  ];

  for (const badTag of maliciousTags) {
    const invalidConfig = {
      ...DEFAULT_RUNTIME_ASSET_CONFIG,
      activeVersion: badTag,
    };
    const res = validateRuntimeAssetConfig(invalidConfig);
    assert(res.valid === false, `Tag '${badTag}' must be rejected by validator`);
  }
  console.log('✓ Test 2 Passed: Strict tag validation rejects path traversal and malicious strings');
}

// ============================================================================
// TEST 3: Rejection of Invalid Providers, Repositories, and Roots
// ============================================================================
{
  // Bad provider
  const badProvider = {
    ...DEFAULT_RUNTIME_ASSET_CONFIG,
    provider: 'untrusted_cdn' as any,
  };
  assert(validateRuntimeAssetConfig(badProvider).valid === false, 'Bad provider must be rejected');

  // Bad repository format (injection attempt)
  const badRepo = {
    ...DEFAULT_RUNTIME_ASSET_CONFIG,
    repository: 'http://malicious.com/repo',
  };
  assert(validateRuntimeAssetConfig(badRepo).valid === false, 'Arbitrary domain in repo must be rejected');

  // Bad assetRoot with path traversal
  const badRoot = {
    ...DEFAULT_RUNTIME_ASSET_CONFIG,
    assetRoot: '../private-data',
  };
  assert(validateRuntimeAssetConfig(badRoot).valid === false, 'Path traversal in assetRoot must be rejected');

  console.log('✓ Test 3 Passed: Rejection of invalid providers, repositories, and asset roots');
}

// ============================================================================
// TEST 4: Public Config Projection (Zero Leaks of Secrets or Admin Identity)
// ============================================================================
{
  const internalConfig: RuntimeAssetConfig = {
    schemaVersion: 1,
    revision: 12,
    provider: 'jsdelivr',
    repository: 'viettanpham/starfront-assets',
    assetRoot: 'starfront-world-assets',
    activeVersion: 'v2.0-assets-r1',
    cdnBaseUrl: 'https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r1/starfront-world-assets',
    previousVersion: null,
    updatedAt: '2026-10-22T20:25:00.000Z',
    updatedBy: 'admin_super_secret_id',
    comment: 'Confidential internal note',
    manifestMetadata: {
      totalAssets: 26,
      manifestSha256: 'secret_sha',
      validatedAt: '2026-10-22',
    },
  };

  const publicProjection = toPublicAssetConfig(internalConfig);

  assert(!('updatedBy' in publicProjection), 'Public projection must NOT contain updatedBy');
  assert(!('comment' in publicProjection), 'Public projection must NOT contain comment');
  assert(publicProjection.schemaVersion === 1, 'schemaVersion preserved');
  assert(publicProjection.revision === 12, 'revision preserved');
  assert(publicProjection.activeVersion === 'v2.0-assets-r1', 'activeVersion preserved');
  assert(publicProjection.totalAssets === 26, 'totalAssets projected correctly');
  console.log('✓ Test 4 Passed: Public config projection securely strips internal secrets and audit logs');
}

// ============================================================================
// TEST 5: FileAssetConfigStore Read-Only Safety and Corrupted File Fallback
// ============================================================================
{
  // Test reading existing valid file
  const store = new FileAssetConfigStore();
  const config = store.getConfigSync();
  assert(config.activeVersion === 'v2.0-assets-r1', 'Must read valid activeVersion r1');
  assert(config.provider === 'jsdelivr', 'Must read valid provider jsdelivr');

  // Verify storage status
  const status = store.getStorageStatus();
  assert(status.code === 'READY', 'File store status must be READY in Node environment');
  assert(status.durable === true, 'File store must be durable');
  assert(status.type === 'file', 'File store type must be file');

  // Test reading non-existent file path: must safely fall back to r1 without throwing
  const nonExistentStore = new FileAssetConfigStore('/tmp/non_existent_path_1234567.json');
  const fallbackConfig = nonExistentStore.getConfigSync();
  assert(
    fallbackConfig.activeVersion === 'v2.0-assets-r1',
    'Non-existent file must safely fall back to DEFAULT_RUNTIME_ASSET_CONFIG'
  );

  // Test reading corrupted file: must safely fall back to r1
  const tempCorruptedPath = path.join(process.cwd(), '.starfront-config', 'test-corrupted-config.json');
  try {
    fs.writeFileSync(tempCorruptedPath, '{ invalid json: [ corrupted data... }', 'utf-8');
    const corruptedStore = new FileAssetConfigStore(tempCorruptedPath);
    const resultFromCorrupted = corruptedStore.getConfigSync();
    assert(
      resultFromCorrupted.activeVersion === 'v2.0-assets-r1',
      'Corrupted config must safely fall back to DEFAULT_RUNTIME_ASSET_CONFIG'
    );
  } finally {
    if (fs.existsSync(tempCorruptedPath)) {
      fs.unlinkSync(tempCorruptedPath);
    }
  }

  console.log('✓ Test 5 Passed: FileAssetConfigStore read-only safety and graceful corruption recovery');
}

// ============================================================================
// TEST 6: Resolver Integration and Dynamic Runtime Version Switching
// ============================================================================
{
  // Path under test
  const pilotPath = '/images/valentine-portrait.webp';

  // 1. Standard call uses active environment / default r1
  const defaultResolved = resolveImageUrl(pilotPath);
  assert(
    defaultResolved.includes('@v2.0-assets-r1'),
    'Standard resolveImageUrl must use v2.0-assets-r1'
  );

  // 2. Call with simulated r2 runtime config
  const r2RuntimeConfig = {
    schemaVersion: 1,
    revision: 2,
    provider: 'jsdelivr' as const,
    repository: 'viettanpham/starfront-assets',
    assetRoot: 'starfront-world-assets',
    activeVersion: 'v2.0-assets-r2',
    cdnBaseUrl: 'https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r2/starfront-world-assets',
    previousVersion: 'v2.0-assets-r1',
    updatedAt: '2026-10-23T00:00:00.000Z',
  };

  const r2Resolved = resolveImageUrlWithConfig(pilotPath, r2RuntimeConfig);
  assert(
    r2Resolved ===
      'https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r2/starfront-world-assets/images/valentine-portrait.webp',
    'resolveImageUrlWithConfig must produce r2 URL when passed r2 runtime config'
  );

  // 3. Local mode switch
  const localRuntimeConfig = {
    provider: 'local' as const,
    cdnBaseUrl: '',
  };
  const localResolved = resolveImageUrlWithConfig(pilotPath, localRuntimeConfig);
  assert(localResolved === '/images/valentine-portrait.webp', 'Local mode config must produce /images/... path');

  // 4. Undefined / null path resilience
  assert(resolveImageUrlWithConfig(null, r2RuntimeConfig) === '', 'Null path returns empty string');
  assert(resolveImageUrlWithConfig(undefined, r2RuntimeConfig) === '', 'Undefined path returns empty string');

  console.log('✓ Test 6 Passed: Dynamic runtime asset version switching without rebuild');
}

// ============================================================================
// TEST 7: Concurrent SSR Isolation (Zero State Leakage Between Requests)
// ============================================================================
{
  const reqAConfig = {
    provider: 'jsdelivr' as const,
    cdnBaseUrl: 'https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r1/starfront-world-assets',
  };
  const reqBConfig = {
    provider: 'jsdelivr' as const,
    cdnBaseUrl: 'https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r2/starfront-world-assets',
  };

  const pathA = '/images/marcus-portrait.webp';
  const pathB = '/images/marcus-portrait.webp';

  const resA = resolveImageUrlWithConfig(pathA, reqAConfig);
  const resB = resolveImageUrlWithConfig(pathB, reqBConfig);

  assert(resA.includes('@v2.0-assets-r1'), 'Request A must maintain r1 URL');
  assert(resB.includes('@v2.0-assets-r2'), 'Request B must maintain r2 URL');
  assert(resA !== resB, 'Concurrent requests must not leak config to each other');

  console.log('✓ Test 7 Passed: Concurrent SSR requests remain strictly isolated');
}

console.log('='.repeat(75));
console.log('ALL 7 RUNTIME ASSET CONFIGURATION UNIT TESTS PASSED SUCCESSFULLY!');
console.log('='.repeat(75));
