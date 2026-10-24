/**
 * STARFRONT WORLD V2 — R3 STAGING PACKAGE GENERATOR (CHECKPOINT 2)
 * 
 * Aggregates verified R2 assets & metadata from:
 * - Active CDN v2.0-assets-r2 (200 WebP files across 9 canonical pilots)
 * - Local Story source (stories/valentine/chapter-01.json)
 * Generates staging directory: staging/starfront-world-assets/
 * with full R3 Universal structure and backward-compatible indexes.
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const STAGING_ROOT = path.join(PROJECT_ROOT, 'staging', 'starfront-world-assets');

const CDN_R2_BASE = 'https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r2/starfront-world-assets';

export const CANONICAL_12_PILOTS = [
  'alviss',
  'eric',
  'marcus',
  'victor',
  'kaelen',
  'lyra',
  'selena',
  'valentine',
  'fortuna',
  'aria',
  'rhea',
  'nova',
];

export const PILOT_NAMES = {
  alviss: 'Alviss Sterling',
  eric: 'Eric Vance',
  marcus: 'Marcus Ray',
  victor: 'Victor Cross',
  kaelen: 'Kaelen Cross',
  lyra: 'Lyra Song',
  selena: 'Selena Vega',
  valentine: 'Valentine Aurelia Vance',
  fortuna: 'Fortuna',
  aria: 'Aria Sterling',
  rhea: 'Rhea Silva',
  nova: 'Nova Ray',
};

export const PILOT_CALLSIGNS = {
  alviss: 'Black Gale',
  eric: 'Iron Hammer',
  marcus: 'Aegis Vanguard',
  victor: 'Titan Bastion',
  kaelen: 'Shadow Fang',
  lyra: 'Starling Swift',
  selena: 'Crimson Spark',
  valentine: 'Mercy Wing',
  fortuna: 'Lady Luck',
  aria: 'Blue Horizon',
  rhea: 'Vanguard Aegis',
  nova: 'Solar Flare',
};

// 9 Pilots with 200 approved WebP artworks on R2
export const R2_MIGRATED_PILOTS = [
  'valentine', // 35
  'fortuna',   // 30
  'rhea',      // 23
  'nova',      // 22
  'kaelen',    // 20
  'lyra',      // 20
  'selena',    // 20
  'aria',      // 20
  'alviss',    // 10
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function calculateSha256(contentOrPath) {
  const hash = crypto.createHash('sha256');
  if (typeof contentOrPath === 'string' && fs.existsSync(contentOrPath)) {
    hash.update(fs.readFileSync(contentOrPath));
  } else if (Buffer.isBuffer(contentOrPath)) {
    hash.update(contentOrPath);
  } else if (typeof contentOrPath === 'string') {
    hash.update(Buffer.from(contentOrPath, 'utf8'));
  }
  return hash.digest('hex');
}

export async function buildStagingPackage() {
  console.log('--- STARTING BUILD R3 STAGING PACKAGE ---');
  console.log(`Staging Destination: ${STAGING_ROOT}`);

  fs.mkdirSync(STAGING_ROOT, { recursive: true });
  fs.mkdirSync(path.join(STAGING_ROOT, 'images', 'pilots'), { recursive: true });
  fs.mkdirSync(path.join(STAGING_ROOT, 'stories', 'pilots'), { recursive: true });

  let totalAggregatedArtworks = 0;
  const pilotsGalleryManifests = {};
  const pilotAudits = {};

  // 1. Process 9 R2 Pilots
  for (const pid of R2_MIGRATED_PILOTS) {
    console.log(`Fetching R2 verified metadata for: ${pid}...`);
    const pilotStagingDir = path.join(STAGING_ROOT, 'images', 'pilots', pid);
    fs.mkdirSync(pilotStagingDir, { recursive: true });

    const filesUrl = `${CDN_R2_BASE}/images/pilots/${pid}/files.json`;
    const galleryUrl = `${CDN_R2_BASE}/images/pilots/${pid}/gallery.json`;

    let filesJson = null;
    let galleryJson = null;

    try {
      filesJson = await fetchJson(filesUrl);
    } catch (e) {
      console.warn(`Could not fetch files.json for ${pid}: ${e.message}`);
    }

    try {
      galleryJson = await fetchJson(galleryUrl);
    } catch (e) {
      console.warn(`Could not fetch gallery.json for ${pid}: ${e.message}`);
    }

    const rawFilesList = Array.isArray(filesJson?.files) ? filesJson.files : [];
    const galleryArtworksMap = galleryJson?.artworks || {};
    const coreMapping = {};
    const artworks = [];

    for (const item of rawFilesList) {
      const filename = item.filename;
      const role = item.role || 'other';
      const editMeta = galleryArtworksMap[filename] || {};

      const isCore = ['fullbody', 'portrait', 'combat', 'closeup', 'activity'].includes(role);
      if (isCore && !coreMapping[role]) {
        coreMapping[role] = filename;
      }

      const category = editMeta.category || (isCore ? 'core' : role.startsWith('event') ? 'event' : role.startsWith('story') ? 'story' : 'outfit');
      const title = editMeta.title || `${PILOT_NAMES[pid]} - ${filename.replace(/\.webp$/i, '')}`;
      const description = editMeta.description || undefined;

      artworks.push({
        assetId: item.assetId || `${pid}-${filename.replace(/\.webp$/i, '')}`,
        filename,
        path: `images/pilots/${pid}/${filename}`,
        role,
        category,
        title,
        description,
        width: item.width || 1024,
        height: item.height || 1024,
        aspectRatio: item.width && item.height ? `${item.width}:${item.height}` : '1:1',
        byteSize: item.bytes || item.byteSize || 0,
        sha256: item.sha256 || 'UNKNOWN_SHA256',
        status: 'approved',
      });
    }

    totalAggregatedArtworks += artworks.length;
    pilotAudits[pid] = {
      fileCount: artworks.length,
      hasGalleryJson: Boolean(galleryJson),
      hasFilesJson: Boolean(filesJson),
    };

    // Write staging files.json
    fs.writeFileSync(
      path.join(pilotStagingDir, 'files.json'),
      JSON.stringify(filesJson || { files: rawFilesList }, null, 2),
      'utf8'
    );

    // Write staging <pilotId>.json (Curated source metadata)
    const curatedMetadata = {
      schemaVersion: 'starfront-curated-metadata-v1',
      pilotId: pid,
      pilotName: PILOT_NAMES[pid],
      callsign: PILOT_CALLSIGNS[pid],
      totalArtworks: artworks.length,
      artworksMeta: galleryArtworksMap,
    };
    fs.writeFileSync(
      path.join(pilotStagingDir, `${pid}.json`),
      JSON.stringify(curatedMetadata, null, 2),
      'utf8'
    );

    // Write staging gallery.json (Universal Gallery Contract v3)
    const universalGallery = {
      schemaVersion: 'starfront-gallery-v3',
      pilotId: pid,
      pilotName: PILOT_NAMES[pid],
      totalAssets: artworks.length,
      approvedAssets: artworks.length,
      coreMapping,
      artworks,
    };
    fs.writeFileSync(
      path.join(pilotStagingDir, 'gallery.json'),
      JSON.stringify(universalGallery, null, 2),
      'utf8'
    );

    pilotsGalleryManifests[pid] = universalGallery;
  }

  // 2. Process Remaining 3 Canonical Pilots (eric, marcus, victor)
  // They are canonical in FND-8 and currently reference V1 legacy core assets
  const pendingPilots = ['eric', 'marcus', 'victor'];
  for (const pid of pendingPilots) {
    const pilotStagingDir = path.join(STAGING_ROOT, 'images', 'pilots', pid);
    fs.mkdirSync(pilotStagingDir, { recursive: true });

    const coreMapping = {
      portrait: `${pid}-portrait.webp`,
      fullbody: `${pid}-fullbody.webp`,
    };

    const artworks = [
      {
        assetId: `${pid}-portrait`,
        filename: `${pid}-portrait.webp`,
        path: `images/${pid}-portrait.webp`,
        role: 'core_portrait',
        category: 'core',
        title: `Chân Dung Đại Diện — ${PILOT_NAMES[pid]}`,
        description: `Ảnh chân dung chuẩn canonical V1 của ${PILOT_NAMES[pid]}.`,
        width: 1024,
        height: 1024,
        aspectRatio: '1:1',
        byteSize: 120000,
        sha256: 'CANONICAL_V1_CORE_ASSET',
        status: 'approved',
      },
      {
        assetId: `${pid}-fullbody`,
        filename: `${pid}-fullbody.webp`,
        path: `images/${pid}-fullbody.webp`,
        role: 'core_fullbody',
        category: 'core',
        title: `Tranh Toàn Thân — ${PILOT_NAMES[pid]}`,
        description: `Bản vẽ toàn thân trang phục chiến đấu chuẩn của ${PILOT_NAMES[pid]}.`,
        width: 1024,
        height: 1536,
        aspectRatio: '2:3',
        byteSize: 240000,
        sha256: 'CANONICAL_V1_CORE_ASSET',
        status: 'approved',
      },
    ];

    const universalGallery = {
      schemaVersion: 'starfront-gallery-v3',
      pilotId: pid,
      pilotName: PILOT_NAMES[pid],
      totalAssets: 2,
      approvedAssets: 2,
      coreMapping,
      artworks,
    };

    fs.writeFileSync(
      path.join(pilotStagingDir, 'gallery.json'),
      JSON.stringify(universalGallery, null, 2),
      'utf8'
    );
    fs.writeFileSync(
      path.join(pilotStagingDir, 'files.json'),
      JSON.stringify({ files: artworks }, null, 2),
      'utf8'
    );
    fs.writeFileSync(
      path.join(pilotStagingDir, `${pid}.json`),
      JSON.stringify({ pilotId: pid, note: 'V1 Canonical core assets fallback' }, null, 2),
      'utf8'
    );

    pilotAudits[pid] = { fileCount: 2, isV1Fallback: true };
  }

  // 3. Generate Staging `images/pilots/manifest.json` (Backward-compatible with R2)
  const pilotsListManifest = {
    schemaVersion: 1,
    releaseTag: 'v3.0-assets-r3',
    totalPilots: 12,
    pilots: CANONICAL_12_PILOTS,
  };
  fs.writeFileSync(
    path.join(STAGING_ROOT, 'images', 'pilots', 'manifest.json'),
    JSON.stringify(pilotsListManifest, null, 2),
    'utf8'
  );

  // 4. Generate Staging `images/manifest.json` (Discovery Index)
  const imagesManifest = {
    schemaVersion: 1,
    releaseTag: 'v3.0-assets-r3',
    categories: [
      {
        id: 'pilots',
        name: 'Pilots Collection',
        manifest: 'images/pilots/manifest.json',
        pilotCount: 12,
        totalAssets: totalAggregatedArtworks,
      },
    ],
  };
  fs.writeFileSync(
    path.join(STAGING_ROOT, 'images', 'manifest.json'),
    JSON.stringify(imagesManifest, null, 2),
    'utf8'
  );

  // 5. Generate Staging Stories System: Valentine Chapter 01 Only!
  console.log('Staging Valentine Story Chapter 01 (Public Gatekeeper enforced)...');
  const valStoryStagingDir = path.join(STAGING_ROOT, 'stories', 'pilots', 'valentine');
  fs.mkdirSync(valStoryStagingDir, { recursive: true });

  const valLocalDir = path.join(PROJECT_ROOT, 'stories', 'valentine');
  const valLocalManifest = JSON.parse(fs.readFileSync(path.join(valLocalDir, 'manifest.json'), 'utf8'));
  const valLocalCh01 = JSON.parse(fs.readFileSync(path.join(valLocalDir, 'chapter-01.json'), 'utf8'));

  // Gatekeeper: Only publish chapters with APPROVED + PUBLISHED
  const stagingChapters = [];
  for (const ch of valLocalManifest.chapters || []) {
    const isPublic = ch.editorialStatus === 'APPROVED' && ch.publicationStatus === 'PUBLISHED';
    if (isPublic && ch.chapterNumber === 1) {
      // Copy Chapter 01 into staging
      const ch01StagingContent = {
        schemaVersion: 'starfront-story-chapter-v1',
        pilotId: 'valentine',
        chapterId: ch.chapterId || 'chap-01',
        chapterNumber: 1,
        title: valLocalCh01.title,
        subtitle: valLocalCh01.subtitle,
        quote: valLocalCh01.quote,
        editorialStatus: 'APPROVED',
        contentStatus: 'FULL_PROSE',
        publicationStatus: 'PUBLISHED',
        readingTimeMinutes: valLocalCh01.readingTimeMinutes || 6,
        wordCount: valLocalCh01.wordCount || 780,
        blocks: valLocalCh01.blocks,
        sha256: calculateSha256(JSON.stringify(valLocalCh01.blocks)),
      };

      fs.writeFileSync(
        path.join(valStoryStagingDir, 'chapter-01.json'),
        JSON.stringify(ch01StagingContent, null, 2),
        'utf8'
      );

      stagingChapters.push({
        chapterId: ch.chapterId,
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        canonicalLibraryTitle: ch.canonicalLibraryTitle,
        editorialStatus: 'APPROVED',
        contentStatus: 'FULL_PROSE',
        publicationStatus: 'PUBLISHED',
        file: 'chapter-01.json',
        summary: ch.summary,
        quote: ch.quote,
        readingTimeMinutes: ch.readingTimeMinutes,
        wordCount: ch.wordCount,
        sha256: ch01StagingContent.sha256,
        sceneAnchors: ch.sceneAnchors,
      });
    } else {
      // Chapters 02–10: Keep metadata in public manifest with REVIEW_ONLY / HOLD, DO NOT emit prose JSON file
      stagingChapters.push({
        chapterId: ch.chapterId,
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        canonicalLibraryTitle: ch.canonicalLibraryTitle,
        sourceConflict: ch.sourceConflict || false,
        editorialStatus: ch.editorialStatus,
        contentStatus: ch.contentStatus,
        publicationStatus: ch.publicationStatus,
        summary: ch.summary,
        quote: ch.quote,
        readingTimeMinutes: ch.readingTimeMinutes,
        wordCount: ch.wordCount,
        // Notice: No "file" field emitted to prevent 404 on public CDN
      });
    }
  }

  // Write Valentine Story Manifest
  const valStoryManifest = {
    schemaVersion: 'starfront-pilot-story-v1',
    pilotId: 'valentine',
    pilotName: 'Valentine Aurelia Vance',
    callsign: 'Mercy Wing',
    totalChapters: stagingChapters.length,
    publishedChaptersCount: 1,
    chapters: stagingChapters,
  };
  fs.writeFileSync(
    path.join(valStoryStagingDir, 'manifest.json'),
    JSON.stringify(valStoryManifest, null, 2),
    'utf8'
  );

  // Write Stories Index Manifest: stories/manifest.json
  const storiesIndexManifest = {
    schemaVersion: 'starfront-story-index-v1',
    releaseTag: 'v3.0-assets-r3',
    generatedAt: new Date().toISOString(),
    totalPilotsWithStories: 1,
    pilots: {
      valentine: {
        pilotName: 'Valentine Aurelia Vance',
        manifest: 'stories/pilots/valentine/manifest.json',
        totalChapters: 10,
        publishedChaptersCount: 1,
      },
    },
  };
  fs.writeFileSync(
    path.join(STAGING_ROOT, 'stories', 'manifest.json'),
    JSON.stringify(storiesIndexManifest, null, 2),
    'utf8'
  );

  // 6. Generate Root Discovery Index: content-manifest.json
  const pilotsOverview = {};
  for (const pid of CANONICAL_12_PILOTS) {
    const isVal = pid === 'valentine';
    pilotsOverview[pid] = {
      name: PILOT_NAMES[pid],
      callsign: PILOT_CALLSIGNS[pid],
      hasGallery: true,
      galleryManifest: `images/pilots/${pid}/gallery.json`,
      hasStories: isVal,
      storyManifest: isVal ? `stories/pilots/${pid}/manifest.json` : null,
    };
  }

  const rootContentManifest = {
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
        totalAssets: totalAggregatedArtworks,
      },
      stories: {
        status: 'active',
        rootPath: 'stories',
        indexManifest: 'stories/manifest.json',
        totalPilots: 12,
        totalPublishedChapters: 1,
      },
    },
    pilots: pilotsOverview,
  };

  fs.writeFileSync(
    path.join(STAGING_ROOT, 'content-manifest.json'),
    JSON.stringify(rootContentManifest, null, 2),
    'utf8'
  );

  console.log('--- STAGING PACKAGE BUILD COMPLETE ---');
  console.log(`Total 9 Pilot Approved R2 WebP Artworks: ${totalAggregatedArtworks}`);
  console.log('Breakdown by pilot:');
  for (const [pid, audit] of Object.entries(pilotAudits)) {
    console.log(`  - ${pid.padEnd(10, ' ')}: ${audit.fileCount} artworks ${audit.isV1Fallback ? '(V1 Fallback)' : ''}`);
  }
  return {
    success: true,
    totalArtworks: totalAggregatedArtworks,
    stagingRoot: STAGING_ROOT,
    pilotAudits,
  };
}

if (process.argv[1] && process.argv[1].endsWith('build-r3-staging-package.mjs')) {
  buildStagingPackage().catch(err => {
    console.error('Fatal Staging Build Error:', err);
    process.exit(1);
  });
}
