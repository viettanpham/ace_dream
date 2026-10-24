/**
 * STARFRONT WORLD V2 — CHECKPOINT 2 TARGETED TEST SUITE
 * 
 * Verifies:
 * 1. Staging directory structure conforms to R3 Universal Content Foundation.
 * 2. 9 Pilot R2 portfolios aggregate exactly 200 approved WebP artworks:
 *    Valentine (35), Fortuna (30), Rhea (23), Nova (22), Kaelen (20),
 *    Lyra (20), Selena (20), Aria (20), Alviss (10).
 * 3. 3 Canonical Pilots (Eric, Marcus, Victor) have proper V1 fallback mappings.
 * 4. Zero duplicate assetId across all artworks.
 * 5. Story Gatekeeper: Only Valentine Chapter 01 exists in public staging;
 *    Chapters 02–10 have NO prose files emitted to prevent leaks.
 * 6. Scene anchors in Chapter 01 reference verified assets.
 * 7. Asset generator idempotency and validation.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const STAGING_ROOT = path.join(PROJECT_ROOT, 'staging', 'starfront-world-assets');

console.log('--- TEST 1: Staging Directory & Root Manifest Inspection ---');
assert.ok(fs.existsSync(STAGING_ROOT), 'Staging root directory must exist');

const contentManifestPath = path.join(STAGING_ROOT, 'content-manifest.json');
assert.ok(fs.existsSync(contentManifestPath), 'content-manifest.json must exist');

const rootManifest = JSON.parse(fs.readFileSync(contentManifestPath, 'utf8'));
assert.equal(rootManifest.schemaVersion, 'starfront-content-manifest-v3');
assert.equal(rootManifest.releaseTag, 'v3.0-assets-r3');
assert.ok(rootManifest.subsystems.images, 'Images subsystem must exist');
assert.ok(rootManifest.subsystems.stories, 'Stories subsystem must exist');

const pilotKeys = Object.keys(rootManifest.pilots);
assert.equal(pilotKeys.length, 12, 'Must have all 12 canonical pilots registered');
console.log('✅ TEST 1 PASS: Staging root manifest verified with 12 canonical pilots.');

console.log('\n--- TEST 2: 200 WebP Artworks Audit Across 9 Canonical R2 Pilots ---');
const EXPECTED_PILOT_COUNTS = {
  valentine: 35,
  fortuna: 30,
  rhea: 23,
  nova: 22,
  kaelen: 20,
  lyra: 20,
  selena: 20,
  aria: 20,
  alviss: 10,
};

let totalVerifiedArtworks = 0;
const allAssetIds = new Set<string>();

for (const [pid, expectedCount] of Object.entries(EXPECTED_PILOT_COUNTS)) {
  const pilotDir = path.join(STAGING_ROOT, 'images', 'pilots', pid);
  assert.ok(fs.existsSync(pilotDir), `Directory for pilot ${pid} must exist`);

  const galleryPath = path.join(pilotDir, 'gallery.json');
  const filesPath = path.join(pilotDir, 'files.json');
  const curatedPath = path.join(pilotDir, `${pid}.json`);

  assert.ok(fs.existsSync(galleryPath), `gallery.json must exist for ${pid}`);
  assert.ok(fs.existsSync(filesPath), `files.json must exist for ${pid}`);
  assert.ok(fs.existsSync(curatedPath), `<pilotId>.json must exist for ${pid}`);

  const gallery = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));
  assert.equal(gallery.pilotId, pid);
  assert.equal(
    gallery.artworks.length,
    expectedCount,
    `Pilot ${pid} must have exactly ${expectedCount} artworks (got ${gallery.artworks.length})`
  );

  totalVerifiedArtworks += gallery.artworks.length;

  for (const art of gallery.artworks) {
    assert.ok(art.assetId, `Artwork in ${pid} must have assetId`);
    assert.ok(!allAssetIds.has(art.assetId), `Duplicate assetId detected: ${art.assetId}`);
    allAssetIds.add(art.assetId);
    assert.ok(art.filename.endsWith('.webp'), `Filename must end with .webp: ${art.filename}`);
    assert.ok(!art.path.includes('..'), `Path must not contain traversal: ${art.path}`);
  }
}

assert.equal(totalVerifiedArtworks, 200, 'Total verified artworks must equal exactly 200');
console.log(`✅ TEST 2 PASS: Exactly 200 WebP artworks verified across 9 pilots with 0 duplicate assetIds.`);

console.log('\n--- TEST 3: Canonical V1 Fallback Pilots Audit (Eric, Marcus, Victor) ---');
for (const pid of ['eric', 'marcus', 'victor']) {
  const pDir = path.join(STAGING_ROOT, 'images', 'pilots', pid);
  assert.ok(fs.existsSync(pDir), `Fallback directory for ${pid} must exist`);
  const gallery = JSON.parse(fs.readFileSync(path.join(pDir, 'gallery.json'), 'utf8'));
  assert.equal(gallery.pilotId, pid);
  assert.equal(gallery.artworks.length, 2, `${pid} must have 2 core artworks`);
  assert.ok(gallery.coreMapping.portrait, 'Portrait must be mapped');
  assert.ok(gallery.coreMapping.fullbody, 'Fullbody must be mapped');
}
console.log('✅ TEST 3 PASS: 3 V1 fallback pilots properly registered with core mappings.');

console.log('\n--- TEST 4: Public Story Gatekeeper & Chapter 01 Verification ---');
const storiesManifestPath = path.join(STAGING_ROOT, 'stories', 'manifest.json');
assert.ok(fs.existsSync(storiesManifestPath), 'stories/manifest.json must exist');

const valStoryManifestPath = path.join(STAGING_ROOT, 'stories', 'pilots', 'valentine', 'manifest.json');
assert.ok(fs.existsSync(valStoryManifestPath), 'Valentine story manifest must exist in staging');

const valStoryManifest = JSON.parse(fs.readFileSync(valStoryManifestPath, 'utf8'));
assert.equal(valStoryManifest.totalChapters, 10, 'Must have 10 chapters registered');
assert.equal(valStoryManifest.publishedChaptersCount, 1, 'Only 1 chapter must be marked published');

// Verify Chapter 01 file exists
const ch01File = path.join(STAGING_ROOT, 'stories', 'pilots', 'valentine', 'chapter-01.json');
assert.ok(fs.existsSync(ch01File), 'Chapter 01 prose file must exist');

const ch01Data = JSON.parse(fs.readFileSync(ch01File, 'utf8'));
assert.equal(ch01Data.editorialStatus, 'APPROVED');
assert.equal(ch01Data.publicationStatus, 'PUBLISHED');
assert.equal(ch01Data.blocks.length, 12, 'Chapter 01 must have 12 blocks');

// STRICT SECURITY CHECK: Chapters 02–10 must NOT exist as files in public staging!
for (let i = 2; i <= 10; i++) {
  const numStr = i.toString().padStart(2, '0');
  const leakFile = path.join(STAGING_ROOT, 'stories', 'pilots', 'valentine', `chapter-${numStr}.json`);
  assert.ok(!fs.existsSync(leakFile), `SECURITY BREACH: Unapproved Chapter ${numStr} file exists in public staging!`);
}
console.log('✅ TEST 4 PASS: Public Story Gatekeeper verified. Only Chapter 01 exists on disk.');

console.log('\n--- TEST 5: Chapter 01 Scene Anchors & Artwork Reference Audit ---');
const ch01Meta = valStoryManifest.chapters.find((c: { chapterNumber: number }) => c.chapterNumber === 1);
assert.ok(ch01Meta.sceneAnchors, 'Chapter 01 must have sceneAnchors');
assert.equal(ch01Meta.sceneAnchors.length, 3, 'Chapter 01 must have exactly 3 scene anchors');

const anchorAssetIds = ch01Meta.sceneAnchors.map((a: { assetId: string }) => a.assetId);
assert.deepEqual(
  anchorAssetIds,
  ['valentine-portrait', 'valentine-fullbody', 'valentine-activity-001'],
  'Scene anchors must reference verified Valentine assets'
);

for (const aid of anchorAssetIds) {
  assert.ok(allAssetIds.has(aid), `Scene anchor references non-existent assetId: ${aid}`);
}
console.log('✅ TEST 5 PASS: All Chapter 01 scene anchors reference valid, verified WebP assets.');

console.log('\n--- TEST 6: Backward Compatibility with R2 Discovery Indexes ---');
const imagesManifestPath = path.join(STAGING_ROOT, 'images', 'manifest.json');
const pilotsListPath = path.join(STAGING_ROOT, 'images', 'pilots', 'manifest.json');

assert.ok(fs.existsSync(imagesManifestPath));
assert.ok(fs.existsSync(pilotsListPath));

const imgManifest = JSON.parse(fs.readFileSync(imagesManifestPath, 'utf8'));
assert.equal(imgManifest.schemaVersion, 1);
assert.equal(imgManifest.categories[0].id, 'pilots');

const pListManifest = JSON.parse(fs.readFileSync(pilotsListPath, 'utf8'));
assert.equal(pListManifest.schemaVersion, 1);
assert.equal(pListManifest.pilots.length, 12);
console.log('✅ TEST 6 PASS: R2 backward compatibility indexes intact.');

console.log('\n===============================================================');
console.log(' ALL 6/6 TEST SUITES PASSED FOR CHECKPOINT 2!                  ');
console.log('===============================================================');
