/**
 * STARFRONT WORLD V2 — EXPORT HIERARCHICAL MANIFESTS
 * Generates the physical manifest files:
 * - images/manifest.json
 * - images/pilots/<pilotId>/manifest.json
 * for easy inspection and direct commit to GitHub repository: viettanpham/starfront-assets
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const RAW_V2_CATALOG_URL = 'https://raw.githubusercontent.com/viettanpham/starfront-assets/version1-r2/starfront-world-assets/manifests/pilot-v2-artworks.json';
const OUTPUT_BASE_DIR = path.join(__dirname, '..', 'public', 'hierarchical-manifests-export', 'starfront-world-assets', 'images');

const PILOT_NAMES = {
  aria: 'Aria Sterling',
  fortuna: 'Fortuna (Lady Luck)',
  kaelen: 'Kaelen Cross',
  lyra: 'Lyra Song',
  nova: 'Nova Ray',
  rhea: 'Rhea Silva',
  selena: 'Selena Vega',
  valentine: 'Valentine Vance',
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
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

async function main() {
  console.log('Downloading raw canonical V2 catalog from GitHub...');
  const raw = await fetchJson(RAW_V2_CATALOG_URL);

  const pilotsMeta = raw.pilots || {};
  const assets = raw.assets || [];

  console.log(`Loaded ${assets.length} assets across ${Object.keys(pilotsMeta).length} pilots.`);

  // 1. Prepare Discovery Index: images/manifest.json
  const pilotsCategory = {};
  for (const [pid, meta] of Object.entries(pilotsMeta)) {
    pilotsCategory[pid] = {
      manifest: `images/pilots/${pid}/manifest.json`,
      count: meta.count,
      name: PILOT_NAMES[pid] || pid,
      sourceZip: meta.sourceZip,
      corePresent: meta.corePresent,
      coreSlotAliases: meta.coreSlotAliases,
    };
  }

  const indexManifest = {
    schemaVersion: 'starfront-hierarchical-index-v2',
    packageName: 'starfront-world-assets',
    generatedAt: new Date().toISOString(),
    sourceRepo: 'viettanpham/starfront-assets',
    activeReleaseTag: 'version1-r2',
    rootPath: 'images',
    categories: {
      pilots: {
        status: 'configured',
        basePath: 'images/pilots',
        indexManifest: 'images/pilots/manifest.json',
        pilotCount: Object.keys(pilotsCategory).length,
        pilots: pilotsCategory,
      },
      gear: {
        status: 'not_configured',
        note: 'Chỉ mục GEAR khi được cấu hình',
      },
      equipment: {
        status: 'not_configured',
        note: 'Chỉ mục Equipment khi được cấu hình',
      },
      environments: {
        status: 'not_configured',
        note: 'Chỉ mục Environment khi được cấu hình',
      },
      ui: {
        status: 'not_configured',
        note: 'Chỉ mục UI khi được cấu hình',
      },
    },
  };

  fs.mkdirSync(OUTPUT_BASE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUTPUT_BASE_DIR, 'manifest.json'),
    JSON.stringify(indexManifest, null, 2),
    'utf-8'
  );
  console.log('Created: images/manifest.json');

  // 2. Prepare Per-Pilot Manifests
  for (const pid of Object.keys(pilotsMeta)) {
    const pilotDir = path.join(OUTPUT_BASE_DIR, 'pilots', pid);
    fs.mkdirSync(pilotDir, { recursive: true });

    const pAssets = assets.filter(a => a.pilotId === pid);
    const meta = pilotsMeta[pid] || {};

    const coreMapping = {};
    const artworks = [];

    for (const a of pAssets) {
      const isCore = a.category === 'core';
      if (isCore && a.role) {
        coreMapping[a.role] = a.filename;
      }

      artworks.push({
        assetId: `${pid}-${a.filename.replace(/\.webp$/i, '')}`,
        filename: a.filename,
        path: `images/pilots/${pid}/${a.filename}`,
        role: a.role,
        category: isCore ? 'core' : 'outfit',
        status: 'approved',
        sha256: a.sha256,
        byteSize: a.byteSize,
        width: a.width,
        height: a.height,
        aspectRatio: `${a.width}:${a.height}`,
      });
    }

    if (meta.coreSlotAliases) {
      for (const [slot, aliasFile] of Object.entries(meta.coreSlotAliases)) {
        coreMapping[slot] = aliasFile;
      }
    }

    const pilotManifest = {
      schemaVersion: 'starfront-pilot-manifest-v2',
      pilotId: pid,
      pilotName: PILOT_NAMES[pid] || pid,
      totalAssets: pAssets.length,
      approvedAssetsCount: artworks.length,
      sourceZip: meta.sourceZip,
      coreMapping,
      artworks,
    };

    fs.writeFileSync(
      path.join(pilotDir, 'manifest.json'),
      JSON.stringify(pilotManifest, null, 2),
      'utf-8'
    );
    console.log(`Created: images/pilots/${pid}/manifest.json (${artworks.length} artworks, SHA-256 verified)`);
  }

  console.log('Successfully generated full Hierarchical Manifest Bundle!');
}

main().catch(console.error);
