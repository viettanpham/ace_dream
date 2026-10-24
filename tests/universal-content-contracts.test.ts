/**
 * STARFRONT WORLD V2 — UNIVERSAL CONTENT CONTRACTS & VALIDATOR TEST SUITE
 * Checkpoint 1 verification:
 * 1. 12 Canonical Pilot IDs & Metadata (FND-8 Roster Standard)
 * 2. Schema Validators for Root, Gallery, Story Index, and Story Chapter
 * 3. Security Gatekeeper: Editorial vs Public CDN eligibility
 * 4. Actual Local Workspace Data Integrity (Valentine Story Manifest & Chapter 01)
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  CANONICAL_12_PILOT_IDS,
  CANONICAL_PILOT_METADATA,
  isCanonicalPilotId,
  validatePilotId,
  validateUniversalContentRoot,
  validateUniversalGalleryManifest,
  validateUniversalPilotStoryManifest,
  validateUniversalStoryChapterContent,
  isChapterEligibleForPublicCDN,
  type UniversalContentRootManifest,
  type UniversalGalleryManifest,
} from '../lib/game/v2/universal-content-types';

console.log('--- TEST 1: 12 Canonical Pilot Roster (FND-8 Standard: 4 Male / 8 Female) ---');
assert.equal(CANONICAL_12_PILOT_IDS.length, 12, 'Must have exactly 12 canonical pilots');

const malePilots = CANONICAL_12_PILOT_IDS.filter(
  p => CANONICAL_PILOT_METADATA[p].gender === 'Male'
);
const femalePilots = CANONICAL_12_PILOT_IDS.filter(
  p => CANONICAL_PILOT_METADATA[p].gender === 'Female'
);

assert.equal(malePilots.length, 4, 'Must have exactly 4 male pilots');
assert.deepEqual(malePilots, ['alviss', 'eric', 'marcus', 'victor'], 'Male pilots must match FND-8');

assert.equal(femalePilots.length, 8, 'Must have exactly 8 female pilots');
assert.deepEqual(
  femalePilots,
  ['kaelen', 'lyra', 'selena', 'valentine', 'fortuna', 'aria', 'rhea', 'nova'],
  'Female pilots must match FND-8'
);

assert.ok(isCanonicalPilotId('valentine'));
assert.ok(isCanonicalPilotId('alviss'));
assert.ok(!isCanonicalPilotId('charlotte'), 'Non-FND-8 character must return false');
assert.ok(!isCanonicalPilotId('boreas'), 'Non-FND-8 character must return false');
assert.ok(!isCanonicalPilotId('orion'), 'Non-FND-8 character must return false');
console.log('✅ TEST 1 PASS: 12 Canonical Pilot Roster verified perfectly.');

console.log('\n--- TEST 2: Pilot ID Validation & Sanitization ---');
assert.ok(validatePilotId('valentine'));
assert.ok(validatePilotId('kaelen'));
assert.ok(validatePilotId('pilot_123'));
assert.ok(!validatePilotId('valentine/../evil'), 'Path traversal must be rejected');
assert.ok(!validatePilotId('pilot<script>'), 'XSS vectors must be rejected');
assert.ok(!validatePilotId(''), 'Empty ID must be rejected');
console.log('✅ TEST 2 PASS: Pilot ID sanitization rules verified.');

console.log('\n--- TEST 3: Root Discovery Index Schema Validator ---');
const validRoot: UniversalContentRootManifest = {
  schemaVersion: 'starfront-content-manifest-v3',
  releaseTag: 'v3.0-assets-r3',
  generatedAt: new Date().toISOString(),
  sourceRepository: 'viettanpham/starfront-assets',
  subsystems: {
    images: {
      status: 'active',
      rootPath: 'images',
      indexManifest: 'images/manifest.json',
      totalPilots: 12,
    },
    stories: {
      status: 'active',
      rootPath: 'stories',
      indexManifest: 'stories/manifest.json',
      totalPilots: 12,
    },
  },
  pilots: {
    valentine: {
      name: 'Valentine Aurelia Vance',
      callsign: 'Mercy Wing',
      hasGallery: true,
      galleryManifest: 'images/pilots/valentine/gallery.json',
      hasStories: true,
      storyManifest: 'stories/pilots/valentine/manifest.json',
    },
  },
};

const rootCheck = validateUniversalContentRoot(validRoot);
assert.ok(rootCheck.valid, 'Valid root manifest must pass');
assert.equal(rootCheck.errors.length, 0);

const invalidRootCheck = validateUniversalContentRoot({ schemaVersion: 'invalid-version' });
assert.ok(!invalidRootCheck.valid, 'Invalid version must fail');
assert.ok(invalidRootCheck.errors.length > 0);
console.log('✅ TEST 3 PASS: Root manifest validation verified.');

console.log('\n--- TEST 4: Gallery Manifest Schema Validator ---');
const validGallery: UniversalGalleryManifest = {
  schemaVersion: 'starfront-gallery-v3',
  pilotId: 'valentine',
  pilotName: 'Valentine Aurelia Vance',
  totalAssets: 1,
  approvedAssets: 1,
  coreMapping: {
    portrait: 'valentine-portrait',
  },
  artworks: [
    {
      assetId: 'valentine-portrait',
      filename: 'valentine-portrait.webp',
      path: 'images/pilots/valentine/valentine-portrait.webp',
      role: 'core_portrait',
      category: 'core',
      title: 'Chân Dung Đại Diện',
      byteSize: 142000,
      sha256: '49414e7a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e',
      status: 'approved',
    },
  ],
};

const galleryCheck = validateUniversalGalleryManifest(validGallery);
assert.ok(galleryCheck.valid, 'Valid gallery manifest must pass');

const invalidGalleryCheck = validateUniversalGalleryManifest({
  schemaVersion: 'starfront-gallery-v3',
  pilotId: 'bad/id',
  artworks: [{ assetId: 'missing-sha256', filename: 'test.webp', byteSize: 100 }],
});
assert.ok(!invalidGalleryCheck.valid, 'Gallery with bad ID and missing sha256 must fail');
assert.ok(invalidGalleryCheck.errors.length >= 2);
console.log('✅ TEST 4 PASS: Gallery manifest validation verified.');

console.log('\n--- TEST 5: Security Gatekeeper — Editorial vs Public CDN Eligibility ---');
// Only APPROVED + PUBLISHED is allowed on Public CDN:
assert.equal(isChapterEligibleForPublicCDN('APPROVED', 'PUBLISHED'), true, 'APPROVED + PUBLISHED must be eligible');
assert.equal(isChapterEligibleForPublicCDN('APPROVED', 'REVIEW_ONLY'), false, 'REVIEW_ONLY must NOT be eligible');
assert.equal(isChapterEligibleForPublicCDN('PROVISIONAL', 'REVIEW_ONLY'), false, 'PROVISIONAL must NOT be eligible');
assert.equal(isChapterEligibleForPublicCDN('HOLD', 'REVIEW_ONLY'), false, 'HOLD must NOT be eligible');
assert.equal(isChapterEligibleForPublicCDN('HOLD', 'PUBLISHED'), false, 'HOLD must NEVER be eligible');
console.log('✅ TEST 5 PASS: Security Gatekeeper rules verified.');

console.log('\n--- TEST 6: Actual Local Valentine Story Manifest & Chapter 01 Verification ---');
const projectRoot = path.resolve(__dirname, '..');
const valManifestPath = path.join(projectRoot, 'stories', 'valentine', 'manifest.json');
const valCh01Path = path.join(projectRoot, 'stories', 'valentine', 'chapter-01.json');

assert.ok(fs.existsSync(valManifestPath), 'Valentine manifest.json must exist');
assert.ok(fs.existsSync(valCh01Path), 'Valentine chapter-01.json must exist');

const valManifestData = JSON.parse(fs.readFileSync(valManifestPath, 'utf8'));
const valCh01Data = JSON.parse(fs.readFileSync(valCh01Path, 'utf8'));

// Verify chapter 01 status
const ch01Meta = valManifestData.chapters.find((c: { chapterNumber: number }) => c.chapterNumber === 1);
assert.ok(ch01Meta, 'Chapter 01 meta must exist');
assert.equal(ch01Meta.editorialStatus, 'APPROVED');
assert.equal(ch01Meta.publicationStatus, 'PUBLISHED');
assert.equal(ch01Meta.contentStatus, 'FULL_PROSE');
assert.ok(isChapterEligibleForPublicCDN(ch01Meta.editorialStatus, ch01Meta.publicationStatus));

// Verify chapter 02 status (SUMMARY_ONLY, REVIEW_ONLY)
const ch02Meta = valManifestData.chapters.find((c: { chapterNumber: number }) => c.chapterNumber === 2);
assert.ok(ch02Meta, 'Chapter 02 meta must exist');
assert.equal(ch02Meta.publicationStatus, 'REVIEW_ONLY');
assert.ok(!isChapterEligibleForPublicCDN(ch02Meta.editorialStatus, ch02Meta.publicationStatus), 'Chapter 02 must NOT be eligible for public CDN');

// Verify Chapter 01 blocks integrity
assert.ok(Array.isArray(valCh01Data.blocks), 'Chapter 01 blocks must be an array');
assert.equal(valCh01Data.blocks.length, 12, 'Chapter 01 must have exactly 12 blocks');
assert.equal(valCh01Data.contentStatus, 'FULL_PROSE');

const chapterValidation = validateUniversalStoryChapterContent({
  schemaVersion: 'starfront-story-chapter-v1',
  pilotId: 'valentine',
  chapterId: valCh01Data.chapterId || 'chap-01',
  chapterNumber: valCh01Data.chapterNumber || 1,
  title: valCh01Data.title,
  editorialStatus: valCh01Data.editorialStatus,
  contentStatus: valCh01Data.contentStatus,
  publicationStatus: valCh01Data.publicationStatus,
  readingTimeMinutes: valCh01Data.readingTimeMinutes || 6,
  wordCount: valCh01Data.wordCount || 780,
  blocks: valCh01Data.blocks,
});
assert.ok(chapterValidation.valid, 'Chapter 01 must conform to UniversalStoryChapterContent');
console.log('✅ TEST 6 PASS: Real Valentine data matches Universal Content Contracts.');

console.log('\n===============================================================');
console.log(' ALL 6/6 TEST SUITES PASSED FOR CHECKPOINT 1!                  ');
console.log('===============================================================');
