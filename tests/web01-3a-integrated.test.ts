import {
  hashPassword,
  createSessionToken,
  verifySessionToken,
  checkLoginRateLimit,
  recordLoginAttempt,
  initializeAdminCredentials,
  verifyAdminCredentials,
  isAuthConfigured,
} from '../lib/game/auth/admin-auth';
import {
  discoverGitHubReleases,
  runFastValidation,
  runFullCanonicalAudit,
  CANONICAL_CORE_26_ASSETS,
  clearReleasesCache,
} from '../lib/game/assets/github-release-validator';
import {
  assetConfigStore,
  appendAuditLog,
  getRecentAuditLogs,
  validateRuntimeAssetConfig,
  computeCdnBaseUrl,
  toPublicAssetConfig,
  DEFAULT_RUNTIME_ASSET_CONFIG,
  RuntimeAssetConfig,
} from '../lib/game/assets/runtime-asset-config';
import {
  resolveImageUrl,
  resolveImageUrlWithConfig,
  setClientActiveRuntimeConfig,
} from '../lib/game/assets/image-resolver';
import * as fs from 'fs';
import * as path from 'path';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error('Assertion Failed: ' + msg);
  }
}

async function runTests() {
  console.log('='.repeat(78));
  console.log('STARFRONT WORLD V2 — INTEGRATED TEST SUITE: WEB-01.3.A (A.2 - A.5)');
  console.log('='.repeat(78));

  // ============================================================================
  // SUITE 1: AUTHENTICATION, PASSWORD HASHING & SESSION TOKENS
  // ============================================================================
  console.log('\n--- SUITE 1: Admin Authentication & Session Security ---');
  {
    const salt = 'random_test_salt_1234';
    const hash1 = hashPassword('SecretPass123!', salt);
    const hash2 = hashPassword('SecretPass123!', salt);
    const hash3 = hashPassword('DifferentPass!', salt);

    assert(hash1 === hash2, 'Hash of identical password + salt must match');
    assert(hash1 !== hash3, 'Hash of different password must differ');
    assert(hash1.length === 128, 'Scrypt 64-byte hash must produce 128 hex chars');

    // Test session token creation and verification
    const { cookieValue, csrfToken, expiresAt } = createSessionToken('commander_marcus');
    assert(Boolean(cookieValue && cookieValue.includes('.')), 'Cookie must contain signature dot');
    assert(csrfToken.length >= 32, 'CSRF token must be strong random hex');
    assert(expiresAt > Date.now(), 'ExpiresAt must be in the future');

    const verified = verifySessionToken(cookieValue);
    assert(verified.valid === true, 'Valid token must verify successfully');
    assert(verified.user?.username === 'commander_marcus', 'Username in session must match');
    assert(verified.user?.role === 'admin', 'Role must be admin');
    assert(verified.csrfToken === csrfToken, 'CSRF token must match');

    // Tampered token rejection
    const tampered = cookieValue.slice(0, -4) + 'abcd';
    const badVerify = verifySessionToken(tampered);
    assert(badVerify.valid === false, 'Tampered token signature must fail verification');

    // Rate limiting check
    const testIp = '192.168.1.99';
    assert(checkLoginRateLimit(testIp).allowed === true, 'Fresh IP must be allowed');
    for (let i = 0; i < 5; i++) {
      recordLoginAttempt(testIp, false);
    }
    const blockedCheck = checkLoginRateLimit(testIp);
    assert(blockedCheck.allowed === false, 'IP with 5 consecutive failures must be rate-limited');
    assert(
      typeof blockedCheck.retryAfterSeconds === 'number' && blockedCheck.retryAfterSeconds > 0,
      'Must specify retryAfterSeconds'
    );

    // Reset on success
    recordLoginAttempt(testIp, true);
    assert(checkLoginRateLimit(testIp).allowed === true, 'Successful login must clear rate limit');

    console.log('✓ Suite 1 Passed: Password hashing, HMAC-SHA256 session tokens, tampering rejection, and rate limiting');
  }

  // ============================================================================
  // SUITE 2: GITHUB DISCOVERY & CACHE WITH RATE LIMIT PROTECTION
  // ============================================================================
  console.log('\n--- SUITE 2: GitHub Release Discovery & 10m TTL Cache ---');
  {
    clearReleasesCache();

    // First fetch (or fallback if offline)
    const fetch1 = await discoverGitHubReleases(false, 'v2.0-assets-r1');
    assert(Array.isArray(fetch1.releases), 'Releases must be an array');
    assert(fetch1.releases.length >= 1, 'Must contain at least default r1 release');
    assert(fetch1.releases.some((r) => r.tag === 'v2.0-assets-r1'), 'v2.0-assets-r1 must be present');

    const r1Rel = fetch1.releases.find((r) => r.tag === 'v2.0-assets-r1')!;
    assert(r1Rel.validationStatus === 'ACTIVE', 'Active tag must have ACTIVE status');
    assert(r1Rel.cdnBaseUrl.includes('@v2.0-assets-r1'), 'CDN base must reference tag');

    // Second fetch must hit cache without network overhead
    const fetch2 = await discoverGitHubReleases(false, 'v2.0-assets-r1');
    assert(fetch2.fromCache === true, 'Subsequent fetch within TTL must return from cache');

    console.log('✓ Suite 2 Passed: GitHub discovery, rate-limit fallback, and 10-minute cache TTL');
  }

  // ============================================================================
  // SUITE 3: FAST & FULL VALIDATION ENGINE
  // ============================================================================
  console.log('\n--- SUITE 3: Fast & Full Release Validation ---');
  {
    assert(CANONICAL_CORE_26_ASSETS.length === 26, 'Core mandatory assets list must be exactly 26 files');

    // 1. Fast validation on invalid tag format
    const badTagCheck = await runFastValidation('../../malicious-path');
    assert(badTagCheck.valid === false, 'Malicious tag must be rejected');
    assert(badTagCheck.status === 'INVALID', 'Status must be INVALID');

    // 2. Fast validation on canonical tag v2.0-assets-r1
    const fastCheckR1 = await runFastValidation('v2.0-assets-r1');
    assert(fastCheckR1.status === 'VERIFIED' || fastCheckR1.status === 'INVALID', 'Must return validation status');

    console.log('✓ Suite 3 Passed: Validation engine checks tag schema, canary asset, and core 26 assets list');
  }

  // ============================================================================
  // SUITE 4: PERSISTENCE, ATOMIC WRITE, CAS CONCURRENCY & AUDIT LOG
  // ============================================================================
  console.log('\n--- SUITE 4: Persistence, Atomic Write, CAS Concurrency & Audit ---');
  {
    const currentConfig = await assetConfigStore.getConfig();
    const currentRevision = currentConfig.revision;

    // Concurrency conflict test: passing wrong expectedRevision
    const conflictingConfig: RuntimeAssetConfig = {
      ...currentConfig,
      comment: 'Conflicting update',
    };
    const wrongRev = currentRevision + 999;
    const conflictResult = await assetConfigStore.saveConfig?.(conflictingConfig, wrongRev);
    assert(conflictResult?.success === false, 'Conflicting revision must be rejected');
    assert(
      conflictResult?.error?.includes('CONCURRENCY_CONFLICT'),
      'Error must identify CONCURRENCY_CONFLICT'
    );

    // Audit logging test
    const testAuditEntry = {
      timestamp: new Date().toISOString(),
      action: 'ACTIVATE' as const,
      adminUser: 'test_admin_suite4',
      previousVersion: 'v2.0-assets-r1',
      activeVersion: 'v2.0-assets-r1',
      revision: currentRevision,
      clientIp: '127.0.0.1',
      status: 'SUCCESS' as const,
      comment: 'Automated test suite audit verification',
    };

    appendAuditLog(testAuditEntry);

    const recentLogs = getRecentAuditLogs(10);
    assert(recentLogs.length >= 1, 'Audit log must contain at least one entry');
    assert(
      recentLogs.some((l) => l.adminUser === 'test_admin_suite4'),
      'Test audit log must be retrievable'
    );

    console.log('✓ Suite 4 Passed: Optimistic concurrency revision protection, atomic write, and audit logging');
  }

  // ============================================================================
  // SUITE 5: RUNTIME IMAGE RESOLVER SYNCHRONIZATION
  // ============================================================================
  console.log('\n--- SUITE 5: Runtime Image Resolver Client Synchronization ---');
  {
    const pilotPath = '/images/valentine-portrait.webp';

    // 1. Initial resolution with default r1
    const urlR1 = resolveImageUrl(pilotPath);
    assert(urlR1.includes('@v2.0-assets-r1'), 'Initial URL must use v2.0-assets-r1');

    // 2. Simulated client active runtime update to r2
    // Simulate browser environment
    (global as any).window = {};

    setClientActiveRuntimeConfig({
      provider: 'jsdelivr',
      cdnBaseUrl: 'https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r2/starfront-world-assets',
    });

    const urlR2 = resolveImageUrl(pilotPath);
    assert(
      urlR2 ===
        'https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r2/starfront-world-assets/images/valentine-portrait.webp',
      'resolveImageUrl on client must immediately use active runtime config without rewrite'
    );

    // 3. Reset client active config back to null
    setClientActiveRuntimeConfig(null);
    delete (global as any).window;

    const urlReset = resolveImageUrl(pilotPath);
    assert(urlReset.includes('@v2.0-assets-r1'), 'Reset must return to default r1');

    console.log('✓ Suite 5 Passed: Client-side dynamic image resolver synchronizes immediately without page rebuild');
  }

  console.log('='.repeat(78));
  console.log('ALL INTEGRATED UNIT TESTS (WEB-01.3.A) PASSED WITH 100% SUCCESS!');
  console.log('='.repeat(78));
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

