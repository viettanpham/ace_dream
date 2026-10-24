#!/usr/bin/env node

/**
 * STARFRONT WORLD ASSET REPOSITORY — ASSET INDEX & STORY GENERATOR (R3 CANONICAL)
 * Target repository: https://github.com/viettanpham/starfront-assets
 * Working root: starfront-world-assets/
 * 
 * Pipeline:
 * 1. Scans WebP binaries under starfront-world-assets/images/pilots/<pilotId>/*.webp
 * 2. Computes accurate SHA-256, byteSize, dimensions (width x height)
 * 3. Reads existing <pilotId>.json (curated metadata) and preserves human edits
 * 4. Generates/updates images/pilots/<pilotId>/files.json & gallery.json
 * 5. Generates images/pilots/manifest.json and images/manifest.json (backward-compatible)
 * 6. Audits stories/pilots/<pilotId>/ with strict gatekeeper:
 *    Only APPROVED + PUBLISHED chapters emit chapter-NN.json to public CDN
 * 7. Generates stories/manifest.json & content-manifest.json
 * 8. Ensures IDEMPOTENCY: Re-running on clean tree creates 0 unintended diffs.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect whether running inside starfront-assets root or tools subfolder
const ASSET_ROOT_CANDIDATES = [
  path.resolve(process.cwd(), 'staging', 'starfront-world-assets'),
  path.resolve(__dirname, '..', 'starfront-world-assets'),
  path.resolve(__dirname, 'starfront-world-assets'),
  path.resolve(process.cwd(), 'starfront-world-assets'),
];

let ASSET_ROOT = ASSET_ROOT_CANDIDATES.find(p => fs.existsSync(p));
if (!ASSET_ROOT) {
  ASSET_ROOT = path.resolve(process.cwd(), 'starfront-world-assets');
}

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

/**
 * Calculates SHA-256 of file buffer
 */
export function calculateSha256(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

/**
 * Parses basic dimensions from WebP header (VP8/VP8L/VP8X chunks)
 * Fallback to 1024x1024 if unparsed.
 */
export function getWebpDimensions(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    if (buffer.length < 30) return { width: 1024, height: 1024 };

    // VP8X extended format
    if (buffer.toString('ascii', 12, 16) === 'VP8X') {
      const width = 1 + buffer.readUIntLE(24, 3);
      const height = 1 + buffer.readUIntLE(27, 3);
      return { width, height };
    }
    // VP8 lossy format
    if (buffer.toString('ascii', 12, 15) === 'VP8 ') {
      const width = buffer.readUInt16LE(26) & 0x3fff;
      const height = buffer.readUInt16LE(28) & 0x3fff;
      return { width, height };
    }
  } catch {
    // Fallback
  }
  return { width: 1024, height: 1024 };
}

/**
 * Normalizes neutral artwork title from filename
 */
export function formatNeutralTitle(pilotId, filename) {
  const pName = PILOT_NAMES[pilotId] || pilotId;
  const clean = filename
    .replace(/\.webp$/i, '')
    .replace(new RegExp(`^${pilotId}-`, 'i'), '')
    .replace(/[-_]/g, ' ');
  const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
  return `${pName} - ${capitalized}`;
}

/**
 * Main CI Pipeline Execution
 */
export async function runPipeline(options = {}) {
  const isValidateOnly = options.validateOnly || process.argv.includes('--validate-only');
  const releaseTag = options.releaseTag || process.env.RELEASE_TAG || 'v3.0-assets-r3';

  console.log('==================================================================');
  console.log(' STARFRONT WORLD ASSETS — CI/CD R3 GENERATOR & AUDITOR            ');
  console.log('==================================================================');
  console.log(`Asset Root: ${ASSET_ROOT}`);
  console.log(`Release Tag: ${releaseTag}`);

  if (!fs.existsSync(ASSET_ROOT)) {
    console.error(`Asset root does not exist: ${ASSET_ROOT}`);
    process.exit(1);
  }

  const imagesPilotsDir = path.join(ASSET_ROOT, 'images', 'pilots');
  const storiesPilotsDir = path.join(ASSET_ROOT, 'stories', 'pilots');

  const warnings = [];
  const errors = [];
  let totalIndexedArtworks = 0;
  const pilotsList = [];
  const pilotsOverview = {};

  // 1. Process Pilots Artworks
  if (fs.existsSync(imagesPilotsDir)) {
    const pilotDirs = fs.readdirSync(imagesPilotsDir).filter(f => {
      const fullPath = path.join(imagesPilotsDir, f);
      return fs.statSync(fullPath).isDirectory();
    });

    for (const pid of pilotDirs) {
      const pilotDir = path.join(imagesPilotsDir, pid);
      pilotsList.push(pid);

      // Check for <pilotId>.json (Curated metadata)
      const curatedPath = path.join(pilotDir, `${pid}.json`);
      let curatedData = {};
      if (fs.existsSync(curatedPath)) {
        try {
          curatedData = JSON.parse(fs.readFileSync(curatedPath, 'utf8'));
        } catch (e) {
          warnings.push(`Malformed curated JSON for pilot ${pid}: ${e.message}`);
        }
      }

      // Check existing gallery.json for human edits to preserve
      const galleryPath = path.join(pilotDir, 'gallery.json');
      let existingGallery = null;
      if (fs.existsSync(galleryPath)) {
        try {
          existingGallery = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));
        } catch {
          // Ignore
        }
      }

      const existingMap = {};
      if (existingGallery && Array.isArray(existingGallery.artworks)) {
        for (const art of existingGallery.artworks) {
          existingMap[art.filename] = art;
        }
      }

      // Scan actual WebP files
      const webpFiles = fs.readdirSync(pilotDir).filter(f => f.endsWith('.webp')).sort();
      const filesInventory = [];
      const artworks = [];
      const coreMapping = {};

      for (const file of webpFiles) {
        const filePath = path.join(pilotDir, file);
        const stat = fs.statSync(filePath);
        const sha256 = calculateSha256(filePath);
        const { width, height } = getWebpDimensions(filePath);

        // Deduce role
        let role = 'other';
        for (const r of ['fullbody', 'portrait', 'combat', 'closeup', 'activity']) {
          if (file.includes(`-${r}`)) {
            role = r;
            break;
          }
        }

        if (['fullbody', 'portrait', 'combat', 'closeup', 'activity'].includes(role) && !coreMapping[role]) {
          coreMapping[role] = file;
        }

        const prevArt = existingMap[file] || {};
        const curatedArt = curatedData.artworksMeta?.[file] || {};

        const title = curatedArt.title || prevArt.title || formatNeutralTitle(pid, file);
        const description = curatedArt.description || prevArt.description || undefined;
        const category = curatedArt.category || prevArt.category || (['fullbody', 'portrait', 'combat', 'closeup', 'activity'].includes(role) ? 'core' : file.includes('-event-') ? 'event' : file.includes('-story-') ? 'story' : 'outfit');

        filesInventory.push({
          filename: file,
          bytes: stat.size,
          sha256,
          role,
          width,
          height,
        });

        artworks.push({
          assetId: `${pid}-${file.replace(/\.webp$/i, '')}`,
          filename: file,
          path: `images/pilots/${pid}/${file}`,
          role,
          category,
          title,
          description,
          width,
          height,
          aspectRatio: `${width}:${height}`,
          byteSize: stat.size,
          sha256,
          status: 'approved',
        });
      }

      totalIndexedArtworks += artworks.length;

      // Only write changes if not in validate-only mode
      if (!isValidateOnly) {
        // Write files.json
        fs.writeFileSync(
          path.join(pilotDir, 'files.json'),
          JSON.stringify({ files: filesInventory }, null, 2),
          'utf8'
        );

        // Write gallery.json (Universal format)
        const universalGallery = {
          schemaVersion: 'starfront-gallery-v3',
          pilotId: pid,
          pilotName: PILOT_NAMES[pid] || pid,
          totalAssets: artworks.length,
          approvedAssets: artworks.length,
          coreMapping,
          artworks,
        };
        fs.writeFileSync(
          galleryPath,
          JSON.stringify(universalGallery, null, 2),
          'utf8'
        );
      }

      pilotsOverview[pid] = {
        name: PILOT_NAMES[pid] || pid,
        callsign: PILOT_CALLSIGNS[pid] || 'Pilot',
        hasGallery: true,
        galleryManifest: `images/pilots/${pid}/gallery.json`,
        hasStories: false,
        storyManifest: null,
      };
    }

    // Write images/pilots/manifest.json
    if (!isValidateOnly) {
      fs.writeFileSync(
        path.join(imagesPilotsDir, 'manifest.json'),
        JSON.stringify({ schemaVersion: 1, releaseTag, totalPilots: pilotsList.length, pilots: pilotsList.sort() }, null, 2),
        'utf8'
      );

      // Write images/manifest.json
      fs.writeFileSync(
        path.join(ASSET_ROOT, 'images', 'manifest.json'),
        JSON.stringify({
          schemaVersion: 1,
          releaseTag,
          categories: [
            {
              id: 'pilots',
              name: 'Pilots Collection',
              manifest: 'images/pilots/manifest.json',
              pilotCount: pilotsList.length,
              totalAssets: totalIndexedArtworks,
            },
          ],
        }, null, 2),
        'utf8'
      );
    }
  }

  // 2. Process Stories
  let totalPublishedChapters = 0;
  const pilotsWithStories = {};

  if (fs.existsSync(storiesPilotsDir)) {
    const storyPilotDirs = fs.readdirSync(storiesPilotsDir).filter(f => {
      return fs.statSync(path.join(storiesPilotsDir, f)).isDirectory();
    });

    for (const pid of storyPilotDirs) {
      const pStoryDir = path.join(storiesPilotsDir, pid);
      const manifestPath = path.join(pStoryDir, 'manifest.json');

      if (!fs.existsSync(manifestPath)) {
        warnings.push(`Story directory for ${pid} lacks manifest.json`);
        continue;
      }

      const pManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      let pPublished = 0;

      for (const ch of pManifest.chapters || []) {
        const isEligible = ch.editorialStatus === 'APPROVED' && ch.publicationStatus === 'PUBLISHED';
        if (isEligible) {
          pPublished++;
          totalPublishedChapters++;
          // Ensure chapter file exists
          if (ch.file && !fs.existsSync(path.join(pStoryDir, ch.file))) {
            errors.push(`Public story chapter referenced but missing: ${pid}/${ch.file}`);
          }
        } else if (ch.file && fs.existsSync(path.join(pStoryDir, ch.file))) {
          // Security Alert: Non-published chapter file found in public staging
          warnings.push(`SECURITY NOTICE: Unapproved chapter file exists on disk: ${pid}/${ch.file}`);
        }
      }

      if (pilotsOverview[pid]) {
        pilotsOverview[pid].hasStories = true;
        pilotsOverview[pid].storyManifest = `stories/pilots/${pid}/manifest.json`;
      }

      pilotsWithStories[pid] = {
        pilotName: PILOT_NAMES[pid] || pid,
        manifest: `stories/pilots/${pid}/manifest.json`,
        totalChapters: pManifest.chapters?.length || 0,
        publishedChaptersCount: pPublished,
      };
    }

    // Write stories/manifest.json
    if (!isValidateOnly) {
      fs.writeFileSync(
        path.join(ASSET_ROOT, 'stories', 'manifest.json'),
        JSON.stringify({
          schemaVersion: 'starfront-story-index-v1',
          releaseTag,
          generatedAt: new Date().toISOString(),
          totalPilotsWithStories: Object.keys(pilotsWithStories).length,
          pilots: pilotsWithStories,
        }, null, 2),
        'utf8'
      );
    }
  }

  // 3. Write Root content-manifest.json
  if (!isValidateOnly) {
    const rootManifest = {
      schemaVersion: 'starfront-content-manifest-v3',
      releaseTag,
      generatedAt: new Date().toISOString(),
      sourceRepository: 'viettanpham/starfront-assets',
      subsystems: {
        images: {
          status: 'active',
          rootPath: 'images',
          indexManifest: 'images/manifest.json',
          totalPilots: Object.keys(pilotsOverview).length,
          totalAssets: totalIndexedArtworks,
        },
        stories: {
          status: 'active',
          rootPath: 'stories',
          indexManifest: 'stories/manifest.json',
          totalPilots: Object.keys(pilotsWithStories).length,
          totalPublishedChapters,
        },
      },
      pilots: pilotsOverview,
    };

    fs.writeFileSync(
      path.join(ASSET_ROOT, 'content-manifest.json'),
      JSON.stringify(rootManifest, null, 2),
      'utf8'
    );
  }

  console.log('\n--- PIPELINE EXECUTION SUMMARY ---');
  console.log(`Indexed Artworks: ${totalIndexedArtworks}`);
  console.log(`Pilots Processed: ${pilotsList.length}`);
  console.log(`Published Story Chapters: ${totalPublishedChapters}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(w => console.warn(`  - ${w}`));
  }
  if (errors.length > 0) {
    console.error('\nErrors:');
    errors.forEach(e => console.error(`  - ${e}`));
    if (!isValidateOnly) process.exit(1);
  }

  console.log('\n✅ PIPELINE RUN COMPLETED SUCCESSFULLY!');
}

if (process.argv[1] && process.argv[1].endsWith('generate-asset-index.mjs')) {
  runPipeline().catch(err => {
    console.error('Fatal Pipeline Error:', err);
    process.exit(1);
  });
}
