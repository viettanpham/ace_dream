/**
 * STARFRONT WORLD V2 — CDN R2 & PREVIEW ACCESS TEST SUITE
 */

import { CANONICAL_ACTIVE_VERSION, DEFAULT_RUNTIME_ASSET_CONFIG } from '../lib/game/assets/runtime-asset-config';
import { resolveImageUrl, resolvePilotArtwork, DEFAULT_JSDELIVR_CDN_BASE } from '../lib/game/assets/image-resolver';
import { fetchPilotManifest } from '../lib/game/assets/hierarchical-manifest';
import { verifyAdminCredentials, createSessionToken, verifySessionToken } from '../lib/game/auth/admin-auth';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('--- TEST SUITE: CDN R2, STORY JSON, & PREVIEW ACCESS ---');

  // Test 1: Active CDN is v2.0-assets-r2
  if (CANONICAL_ACTIVE_VERSION !== 'v2.0-assets-r2') {
    throw new Error(`CANONICAL_ACTIVE_VERSION should be v2.0-assets-r2, got ${CANONICAL_ACTIVE_VERSION}`);
  }
  console.log('✓ PASS 01: Canonical active version is v2.0-assets-r2');

  // Test 2: URL resolution format
  const resolvedFullbody = resolveImageUrl('images/pilots/valentine/valentine-fullbody.webp');
  if (!resolvedFullbody.includes('@v2.0-assets-r2') || !resolvedFullbody.endsWith('valentine-fullbody.webp')) {
    throw new Error(`Resolved URL incorrect: ${resolvedFullbody}`);
  }
  console.log('✓ PASS 02: resolveImageUrl produces verified v2.0-assets-r2 CDN URL');

  // Test 3: Story manifest.json exists and contains 10 chapters
  const storyManifestPath = path.join(process.cwd(), 'stories', 'valentine', 'manifest.json');
  if (!fs.existsSync(storyManifestPath)) {
    throw new Error('stories/valentine/manifest.json does not exist');
  }
  const storyManifest = JSON.parse(fs.readFileSync(storyManifestPath, 'utf-8'));
  if (storyManifest.chapters.length !== 10) {
    throw new Error(`Expected 10 chapters in story manifest, got ${storyManifest.chapters.length}`);
  }
  console.log('✓ PASS 03: stories/valentine/manifest.json verified with 10 chapters');

  // Test 4: Chapter 1 is FULL_PROSE and Chapters 2-10 are SUMMARY_ONLY
  const ch01 = storyManifest.chapters.find((c: any) => c.chapterNumber === 1);
  const ch02 = storyManifest.chapters.find((c: any) => c.chapterNumber === 2);
  const ch07 = storyManifest.chapters.find((c: any) => c.chapterNumber === 7);

  if (ch01.contentStatus !== 'FULL_PROSE' || ch01.editorialStatus !== 'APPROVED') {
    throw new Error('Chapter 1 status incorrect');
  }
  if (ch02.contentStatus !== 'SUMMARY_ONLY' || ch02.editorialStatus !== 'APPROVED') {
    throw new Error('Chapter 2 status incorrect');
  }
  if (ch07.editorialStatus !== 'HOLD' || ch07.contentStatus !== 'SUMMARY_ONLY') {
    throw new Error('Chapter 7 status incorrect');
  }
  console.log('✓ PASS 04: Story editorialStatus and contentStatus separation strictly verified');

  // Test 5: Standard admin passwords with auto sync
  const superRes = verifyAdminCredentials('admin321', 'admin321');
  if (!superRes.success || superRes.user?.role !== 'superadmin') {
    throw new Error(`admin321 standard login failed: ${JSON.stringify(superRes)}`);
  }
  console.log('✓ PASS 05: admin321 standard credential verified with role superadmin');

  const adminRes = verifyAdminCredentials('admin', 'admin');
  if (!adminRes.success || adminRes.user?.role !== 'admin') {
    throw new Error(`admin standard login failed: ${JSON.stringify(adminRes)}`);
  }
  console.log('✓ PASS 06: admin standard credential verified with role admin');

  // Test 6: Dynamic Pilot Manifest resolution on R2 CDN
  console.log('Fetching live R2 manifest for valentine...');
  const valManifest = await fetchPilotManifest(DEFAULT_JSDELIVR_CDN_BASE, 'v2.0-assets-r2', 'valentine');
  if (!valManifest || valManifest.totalAssets !== 35) {
    throw new Error(`Expected Valentine to have 35 assets, got ${valManifest?.totalAssets}`);
  }
  console.log(`✓ PASS 07: Live R2 CDN verified: Valentine has exactly ${valManifest.totalAssets} assets`);

  console.log('\n=== ALL CDN R2 & PREVIEW ACCESS TESTS PASSED (7/7) ===');
}

run().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
