/**
 * STARFRONT WORLD V2 — RELEASE MANIFEST & VERSION DIFF ENGINE (WEB-01.3.A)
 *
 * Implements:
 * 1. Schema-safe parsing of GitHub Release manifests (manifests/assets-manifest.json)
 * 2. Inferred Pilot, Category & Metadata normalizer (with graceful fallbacks)
 * 3. Exact Version Diff Engine (ADDED, REMOVED, CHANGED, UNCHANGED, UNKNOWN)
 * 4. Required Canonical Assets protection & compatibility check
 * 5. In-memory manifest cache with 10-minute TTL
 */

import {
  VERSION_TAG_REGEX,
  CANONICAL_REPOSITORY,
  CANONICAL_ASSET_ROOT,
  CANONICAL_ACTIVE_VERSION,
  computeCdnBaseUrl,
} from './runtime-asset-config';
import { CANONICAL_CORE_26_ASSETS } from './github-release-validator';
import {
  fetchHierarchicalIndex,
  fetchPilotManifest,
  invalidateHierarchicalManifestCache,
  HIERARCHICAL_PILOT_NAMES,
} from './hierarchical-manifest';

export type AssetCategory =
  | 'portrait'
  | 'fullbody'
  | 'combat'
  | 'closeup'
  | 'activity'
  | 'outfit'
  | 'story'
  | 'gear'
  | 'other';

export type AssetDiffStatus =
  | 'ADDED'
  | 'REMOVED'
  | 'CHANGED'
  | 'UNCHANGED'
  | 'UNKNOWN';

export interface ManifestAssetItem {
  fileName: string;
  relativePath: string;
  sizeBytes?: number;
  sizeKB?: number;
  format?: string;
  width?: number;
  height?: number;
  category: AssetCategory;
  rawCategory?: string;
  pilotId: string;
  pilotName: string;
  group?: string;
  targetUsage?: string;
  sha256?: string;
  diffStatus?: AssetDiffStatus;
  statusMessage?: string;
  cdnUrl?: string;
}

export interface ReleaseManifest {
  schemaVersion: string;
  packageName: string;
  releaseTag: string;
  generatedAt?: string;
  totalFiles: number;
  totalSizeBytes?: number;
  totalSizeMB?: number;
  baseCdnPattern?: string;
  cdnBaseUrl: string;
  assets: ManifestAssetItem[];
}

export interface VersionDiffSummary {
  activeTag: string;
  targetTag: string;
  totalActive: number;
  totalTarget: number;
  addedCount: number;
  changedCount: number;
  removedCount: number;
  unchangedCount: number;
  unknownCount: number;
  isCompatible: boolean;
  missingRequiredAssets: string[];
  diffItems: ManifestAssetItem[];
}

// Canonical Piloting Names Dictionary for accurate display in UI
const PILOT_NAMES_MAP: Record<string, string> = {
  marcus: 'Marcus Thorne',
  valentine: 'Valentine Vance',
  alviss: 'Levi Reed (Alviss)',
  eric: 'Eric Vance',
  lyra: 'Lyra Song',
  kaelen: 'Kaelen Cross',
  selena: 'Selena Vega',
  victor: 'Victor Sterling',
  fortuna: 'Fortuna (Lady Luck)',
  aria: 'Aria Sterling',
  rhea: 'Rhea Silva',
  nova: 'Nova Ray',
  helena: 'Helena Drake',
  boris: 'Boris Vance',
  selene: 'Selene Vega',
  gear: 'Cơ Giáp (Mecha GEAR)',
  mecha: 'Cơ Giáp (Mecha GEAR)',
  other: 'Khác (Uncategorized)',
};

/**
 * Infer Pilot ID from file name
 */
export function inferPilotId(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.startsWith('marcus-')) return 'marcus';
  if (lower.startsWith('valentine-')) return 'valentine';
  if (lower.startsWith('alviss-') || lower.startsWith('levi-')) return 'alviss';
  if (lower.startsWith('eric-')) return 'eric';
  if (lower.startsWith('lyra-')) return 'lyra';
  if (lower.startsWith('kaelen-')) return 'kaelen';
  if (lower.startsWith('selena-')) return 'selena';
  if (lower.startsWith('victor-')) return 'victor';
  if (lower.startsWith('fortuna-')) return 'fortuna';
  if (lower.startsWith('aria-')) return 'aria';
  if (lower.startsWith('rhea-')) return 'rhea';
  if (lower.startsWith('nova-')) return 'nova';
  if (lower.startsWith('helena-')) return 'helena';
  if (lower.startsWith('boris-')) return 'boris';
  if (lower.startsWith('selene-')) return 'selene';
  if (lower.endsWith('-gear.webp') || lower.startsWith('gear-')) return 'gear';
  return 'other';
}

/**
 * Normalize category string to standard AssetCategory enum
 */
export function normalizeCategory(rawCat?: string, fileName = ''): AssetCategory {
  const cat = (rawCat || '').toLowerCase();
  const file = fileName.toLowerCase();

  if (cat.includes('portrait') || file.includes('-portrait.') || file.includes('-portrait-') || file === 'portrait' || file.startsWith('portrait-')) return 'portrait';
  if (cat.includes('fullbody') || file.includes('-fullbody.') || file === 'fullbody') return 'fullbody';
  if (cat.includes('combat') || file.includes('-combat.') || file === 'combat') return 'combat';
  if (cat.includes('closeup') || file.includes('-closeup.') || file === 'closeup') return 'closeup';
  if (cat.includes('activity') || file.includes('-activity-') || file.includes('-activity.') || file === 'activity' || file.startsWith('activity-')) return 'activity';
  if (
    cat.includes('outfit') ||
    cat.includes('uniform') ||
    cat.includes('casual') ||
    file.includes('-outfit-') ||
    file.includes('-uniform-') ||
    file.includes('-casual.') ||
    file.includes('-casual-')
  )
    return 'outfit';
  if (cat.includes('story') || file.includes('-story-') || file.includes('-story.')) return 'story';
  if (cat.includes('gear') || file.includes('-gear.') || file === 'gear') return 'gear';

  return 'other';
}

/**
 * Exact canonical 26 assets manifest for v2.0-assets-r1
 * Backed by WEB01_PUBLIC_IMAGES_INVENTORY.md SHA-256 data
 */
export const CANONICAL_R1_MANIFEST_DATA: Omit<ManifestAssetItem, 'diffStatus'>[] = [
  // 3 GEARs
  {
    fileName: 'aegis-gear.webp',
    relativePath: 'images/aegis-gear.webp',
    sizeBytes: 202914,
    sizeKB: 198.16,
    format: 'webp',
    width: 1376,
    height: 768,
    category: 'gear',
    pilotId: 'gear',
    pilotName: 'Cơ Giáp (Mecha GEAR)',
    targetUsage: 'gear-card',
    sha256: '4d8f67598dd2b2eec8b5e696ca7101aadcf977cd45be99435189356b8ec09947',
  },
  {
    fileName: 'falcon-gear.webp',
    relativePath: 'images/falcon-gear.webp',
    sizeBytes: 204850,
    sizeKB: 200.05,
    format: 'webp',
    width: 1376,
    height: 768,
    category: 'gear',
    pilotId: 'gear',
    pilotName: 'Cơ Giáp (Mecha GEAR)',
    targetUsage: 'gear-card',
    sha256: '2f211c956ec4431c8887a3fca6cbc163865f1d01d0a172b7f2686794e4fc89f7',
  },
  {
    fileName: 'vanguard-gear.webp',
    relativePath: 'images/vanguard-gear.webp',
    sizeBytes: 144036,
    sizeKB: 140.66,
    format: 'webp',
    width: 1376,
    height: 768,
    category: 'gear',
    pilotId: 'gear',
    pilotName: 'Cơ Giáp (Mecha GEAR)',
    targetUsage: 'gear-card',
    sha256: 'f1564d6e866a0a85b38a97ebb583f192c324f29e3317e030ec4edcdcdc416293',
  },

  // 16 Pilot V1 (8 portraits + 8 fullbody)
  {
    fileName: 'marcus-portrait.webp',
    relativePath: 'images/marcus-portrait.webp',
    sizeBytes: 28296,
    sizeKB: 27.63,
    format: 'webp',
    width: 512,
    height: 512,
    category: 'portrait',
    pilotId: 'marcus',
    pilotName: 'Marcus Thorne',
    sha256: '565b63ae63c4458e2b452090e085567adeb494c8c1c1ba7b843486b233d44c34',
  },
  {
    fileName: 'marcus-fullbody.webp',
    relativePath: 'images/marcus-fullbody.webp',
    sizeBytes: 105444,
    sizeKB: 102.97,
    format: 'webp',
    width: 1080,
    height: 1920,
    category: 'fullbody',
    pilotId: 'marcus',
    pilotName: 'Marcus Thorne',
    sha256: 'c6c98198f13dbb5a0d9bb198ea1c2f4ed17e3c13afca5321c6082be99bcfbc67',
  },
  {
    fileName: 'valentine-portrait.webp',
    relativePath: 'images/valentine-portrait.webp',
    sizeBytes: 424206,
    sizeKB: 414.26,
    format: 'webp',
    width: 1122,
    height: 1402,
    category: 'portrait',
    pilotId: 'valentine',
    pilotName: 'Valentine Vance',
    sha256: 'e8439a87904127649e9bb72b6eb41c53d21176f83f0f1b885f2dc05bafa2bc11',
  },
  {
    fileName: 'valentine-fullbody.webp',
    relativePath: 'images/valentine-fullbody.webp',
    sizeBytes: 483340,
    sizeKB: 472.01,
    format: 'webp',
    width: 1080,
    height: 1920,
    category: 'fullbody',
    pilotId: 'valentine',
    pilotName: 'Valentine Vance',
    sha256: '77a5d00d66aeed9014c60cafa7a528e38826b0dce35c836ef2776c18f846c495',
  },
  {
    fileName: 'alviss-portrait.webp',
    relativePath: 'images/alviss-portrait.webp',
    sizeBytes: 42752,
    sizeKB: 41.75,
    format: 'webp',
    width: 512,
    height: 512,
    category: 'portrait',
    pilotId: 'alviss',
    pilotName: 'Levi Reed (Alviss)',
    sha256: 'bd7c2d505fe5d7d0c92a10770db8407e38d0db7b6d363141fee6d7cc5e682646',
  },
  {
    fileName: 'alviss-fullbody.webp',
    relativePath: 'images/alviss-fullbody.webp',
    sizeBytes: 139294,
    sizeKB: 136.03,
    format: 'webp',
    width: 1080,
    height: 1920,
    category: 'fullbody',
    pilotId: 'alviss',
    pilotName: 'Levi Reed (Alviss)',
    sha256: 'a9597a206b750f0dfe1c512a752b891c75714433ba2cf3d50dcc23b06ea05700',
  },
  {
    fileName: 'eric-portrait.webp',
    relativePath: 'images/eric-portrait.webp',
    sizeBytes: 52338,
    sizeKB: 51.11,
    format: 'webp',
    width: 512,
    height: 512,
    category: 'portrait',
    pilotId: 'eric',
    pilotName: 'Eric Vance',
    sha256: '36b557029fd7296682a9e2ce523a0c9b4f77b6cb0c62ab3d69231bc7aa46905f',
  },
  {
    fileName: 'eric-fullbody.webp',
    relativePath: 'images/eric-fullbody.webp',
    sizeBytes: 185586,
    sizeKB: 181.24,
    format: 'webp',
    width: 1080,
    height: 1920,
    category: 'fullbody',
    pilotId: 'eric',
    pilotName: 'Eric Vance',
    sha256: 'f2729483ac5c7c6118c1b4c68968a4c255379c74d534df53bdd96f217ab45f58',
  },
  {
    fileName: 'lyra-portrait.webp',
    relativePath: 'images/lyra-portrait.webp',
    sizeBytes: 51272,
    sizeKB: 50.07,
    format: 'webp',
    width: 512,
    height: 512,
    category: 'portrait',
    pilotId: 'lyra',
    pilotName: 'Lyra Song',
    sha256: 'efec332ba2660b93771411d130bd811cc50064774c8a15c009220b0042d6c118',
  },
  {
    fileName: 'lyra-fullbody.webp',
    relativePath: 'images/lyra-fullbody.webp',
    sizeBytes: 231746,
    sizeKB: 226.31,
    format: 'webp',
    width: 1080,
    height: 1920,
    category: 'fullbody',
    pilotId: 'lyra',
    pilotName: 'Lyra Song',
    sha256: '918464373d26d219bd304f4348d935cd32c0edf753fc48969e8ba26e93e76649',
  },
  {
    fileName: 'kaelen-portrait.webp',
    relativePath: 'images/kaelen-portrait.webp',
    sizeBytes: 36150,
    sizeKB: 35.30,
    format: 'webp',
    width: 512,
    height: 512,
    category: 'portrait',
    pilotId: 'kaelen',
    pilotName: 'Kaelen Cross',
    sha256: '56a2a3c9ed4a59b9e0353f5b71eb4296f0dc4657e0aa105d2496ada385fdc7b0',
  },
  {
    fileName: 'kaelen-fullbody.webp',
    relativePath: 'images/kaelen-fullbody.webp',
    sizeBytes: 129332,
    sizeKB: 126.30,
    format: 'webp',
    width: 1080,
    height: 1920,
    category: 'fullbody',
    pilotId: 'kaelen',
    pilotName: 'Kaelen Cross',
    sha256: '76908cc908ee8575e38b3b2b7f2c6667a79a38ae8eb45a4687ce92bbf7925eb7',
  },
  {
    fileName: 'selena-portrait.webp',
    relativePath: 'images/selena-portrait.webp',
    sizeBytes: 54668,
    sizeKB: 53.39,
    format: 'webp',
    width: 512,
    height: 512,
    category: 'portrait',
    pilotId: 'selena',
    pilotName: 'Selena Vega',
    sha256: 'aba519e965c7305c08f5b5b1ba406a183576b1e0420b39ce2fc82ae57e631cae',
  },
  {
    fileName: 'selena-fullbody.webp',
    relativePath: 'images/selena-fullbody.webp',
    sizeBytes: 225160,
    sizeKB: 219.88,
    format: 'webp',
    width: 1080,
    height: 1920,
    category: 'fullbody',
    pilotId: 'selena',
    pilotName: 'Selena Vega',
    sha256: '51f22c5a9b0e4db19817503e3cc23c6a597c9e5b7dee41245f14cc599d3b5af1',
  },
  {
    fileName: 'victor-portrait.webp',
    relativePath: 'images/victor-portrait.webp',
    sizeBytes: 40140,
    sizeKB: 39.20,
    format: 'webp',
    width: 512,
    height: 512,
    category: 'portrait',
    pilotId: 'victor',
    pilotName: 'Victor Sterling',
    sha256: 'd5d6bf9b846b2e18f53f66d6f673abce84a86cf032b4c8540bac29b97f8faf19',
  },
  {
    fileName: 'victor-fullbody.webp',
    relativePath: 'images/victor-fullbody.webp',
    sizeBytes: 143962,
    sizeKB: 140.59,
    format: 'webp',
    width: 1080,
    height: 1920,
    category: 'fullbody',
    pilotId: 'victor',
    pilotName: 'Victor Sterling',
    sha256: '0a1c4db58484c2da5590953aee0ac73a15894c7972d95896e650cc2573b965bb',
  },

  // 7 Valentine V2 Approved Artworks
  {
    fileName: 'valentine-activity-001.webp',
    relativePath: 'images/valentine-activity-001.webp',
    sizeBytes: 480818,
    sizeKB: 469.55,
    format: 'webp',
    width: 1086,
    height: 1448,
    category: 'activity',
    pilotId: 'valentine',
    pilotName: 'Valentine Vance',
    sha256: '6471a942dcab6f7d07f83b814ce5383d25afad9a3e9f54d47cbefa04c827e207',
  },
  {
    fileName: 'valentine-casual.webp',
    relativePath: 'images/valentine-casual.webp',
    sizeBytes: 385402,
    sizeKB: 376.37,
    format: 'webp',
    width: 1122,
    height: 1402,
    category: 'outfit',
    pilotId: 'valentine',
    pilotName: 'Valentine Vance',
    sha256: 'cc301d0ff596c4563cc6178cb154cd4bedf26e1b8815c13d03e7fc49753825ae',
  },
  {
    fileName: 'valentine-closeup.webp',
    relativePath: 'images/valentine-closeup.webp',
    sizeBytes: 449192,
    sizeKB: 438.66,
    format: 'webp',
    width: 1122,
    height: 1402,
    category: 'closeup',
    pilotId: 'valentine',
    pilotName: 'Valentine Vance',
    sha256: 'a2e49bb48158098b504e93d72799c5f320111b98c5d84f836c6395612a5b8bcf',
  },
  {
    fileName: 'valentine-combat.webp',
    relativePath: 'images/valentine-combat.webp',
    sizeBytes: 513434,
    sizeKB: 501.40,
    format: 'webp',
    width: 1086,
    height: 1448,
    category: 'combat',
    pilotId: 'valentine',
    pilotName: 'Valentine Vance',
    sha256: '443953cffe133c4bdd531eefb90f5dff7aeac5cc091331fa95a7647ca065f630',
  },
  {
    fileName: 'valentine-event-001.webp',
    relativePath: 'images/valentine-event-001.webp',
    sizeBytes: 512834,
    sizeKB: 500.81,
    format: 'webp',
    width: 1086,
    height: 1448,
    category: 'other',
    pilotId: 'valentine',
    pilotName: 'Valentine Vance',
    sha256: '829852c62bc98e1f18c20b2a41923f5cccf05c77c0a72d85510212f8eca71f5a',
  },
  {
    fileName: 'valentine-story-001.webp',
    relativePath: 'images/valentine-story-001.webp',
    sizeBytes: 539724,
    sizeKB: 527.07,
    format: 'webp',
    width: 1086,
    height: 1448,
    category: 'story',
    pilotId: 'valentine',
    pilotName: 'Valentine Vance',
    sha256: '946fdf23df59e89159f51dc29bfd46376c6a353f14e6b6686749e8c126718386',
  },
  {
    fileName: 'valentine-uniform-001.webp',
    relativePath: 'images/valentine-uniform-001.webp',
    sizeBytes: 423716,
    sizeKB: 413.79,
    format: 'webp',
    width: 1122,
    height: 1402,
    category: 'outfit',
    pilotId: 'valentine',
    pilotName: 'Valentine Vance',
    sha256: '7da69f7960252c924ee78b258131b2543e384eb09cbb62797cbd04a9f5f033a0',
  },
];

// In-memory cache for manifests: tag -> { manifest, expiresAt }
const manifestCache = new Map<string, { manifest: ReleaseManifest; expiresAt: number }>();
const MANIFEST_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch and parse release manifest from jsDelivr CDN
 */
export async function fetchReleaseManifest(
  tag: string,
  forceRefresh = false
): Promise<ReleaseManifest> {
  if (!tag || !VERSION_TAG_REGEX.test(tag)) {
    throw new Error(`Định dạng release tag không hợp lệ: ${tag}`);
  }

  const now = Date.now();
  if (!forceRefresh && manifestCache.has(tag)) {
    const cached = manifestCache.get(tag)!;
    if (cached.expiresAt > now) {
      return cached.manifest;
    }
  }

  const cdnBase = computeCdnBaseUrl('jsdelivr', CANONICAL_REPOSITORY, tag, CANONICAL_ASSET_ROOT);
  const manifestUrl = `${cdnBase}/manifests/assets-manifest.json`;

  try {
    const res = await fetch(manifestUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'STARFRONT-World-AssetManager/2.0',
      },
      signal: AbortSignal.timeout(6000),
    });

    let raw: any = null;
    let isR1Fallback = false;

    if (!res.ok) {
      // Fallback for r1 or if manifest is missing on CDN
      if (tag === CANONICAL_ACTIVE_VERSION) {
        raw = { assets: CANONICAL_R1_MANIFEST_DATA, totalFiles: CANONICAL_R1_MANIFEST_DATA.length };
        isR1Fallback = true;
      } else {
        throw new Error(`Không thể tải manifest từ CDN (HTTP ${res.status}): ${manifestUrl}`);
      }
    } else {
      raw = await res.json();
    }

    const assetsMap = new Map<string, ManifestAssetItem>();

    // 1. Map base assets from assets-manifest.json
    if (Array.isArray(raw?.assets)) {
      for (const item of raw.assets) {
        const fileName = item.fileName || item.relativePath?.replace('images/', '') || '';
        const pilotId = item.pilotId || inferPilotId(fileName);
        const category = normalizeCategory(item.category, fileName);
        const relativePath = item.relativePath || `images/${fileName}`;
        assetsMap.set(relativePath, {
          fileName,
          relativePath,
          sizeBytes: item.sizeBytes,
          sizeKB: item.sizeKB || (item.sizeBytes ? +(item.sizeBytes / 1024).toFixed(2) : undefined),
          format: item.format || 'webp',
          width: item.width,
          height: item.height,
          category,
          rawCategory: item.category,
          pilotId,
          pilotName: PILOT_NAMES_MAP[pilotId] || 'Khác',
          group: item.group,
          targetUsage: item.targetUsage,
          sha256: item.sha256,
          cdnUrl: `${cdnBase}/${relativePath}`,
        });
      }
    }

    // 2. For non-R1 releases (or R2 candidates), query Discovery Index (images/manifest.json)
    // and load each Pilot manifest (images/pilots/<pilotId>/manifest.json).
    // Categories with status="not_configured" are automatically skipped with zero HTTP overhead.
    if (tag !== CANONICAL_ACTIVE_VERSION) {
      try {
        const indexManifest = await fetchHierarchicalIndex(cdnBase, tag);

        // Process pilots category if configured
        if (indexManifest?.categories?.pilots?.status === 'configured') {
          const pilotsDict = indexManifest.categories.pilots.pilots || {};
          const pilotIds = Object.keys(pilotsDict);

          for (const pid of pilotIds) {
            const pilotManifest = await fetchPilotManifest(cdnBase, tag, pid, indexManifest);
            if (pilotManifest && Array.isArray(pilotManifest.artworks)) {
              for (const art of pilotManifest.artworks) {
                // Only approved artworks are processed
                if (art.status && art.status !== 'approved') continue;

                const fileName = art.filename;
                const relativePath = art.path || `images/pilots/${pid}/${fileName}`;
                const category = normalizeCategory(art.category || art.role, fileName);

                assetsMap.set(relativePath, {
                  fileName,
                  relativePath,
                  sizeBytes: art.byteSize,
                  sizeKB: art.byteSize ? +(art.byteSize / 1024).toFixed(2) : undefined,
                  format: 'webp',
                  width: art.width,
                  height: art.height,
                  category,
                  rawCategory: art.role,
                  pilotId: pid,
                  pilotName: HIERARCHICAL_PILOT_NAMES[pid] || PILOT_NAMES_MAP[pid] || pid,
                  group: art.role,
                  targetUsage: 'pilot-v2-dossier',
                  sha256: art.sha256,
                  cdnUrl: art.cdnUrl || `${cdnBase}/${relativePath}`,
                });
              }
            }
          }
        }
      } catch {
        // Fallback or continue if hierarchical index unavailable
      }
    }

    const assetsList = Array.from(assetsMap.values());
    const totalSizeBytes = assetsList.reduce((acc, a) => acc + (a.sizeBytes || 0), 0);
    const totalSizeMB = +(totalSizeBytes / (1024 * 1024)).toFixed(2);

    const manifest: ReleaseManifest = {
      schemaVersion: raw?.schemaVersion || '1.0.0',
      packageName: raw?.packageName || 'starfront-world-assets',
      releaseTag: tag,
      generatedAt: raw?.generatedAt || new Date().toISOString(),
      totalFiles: assetsList.length,
      totalSizeBytes,
      totalSizeMB,
      baseCdnPattern: raw?.baseCdnPattern,
      cdnBaseUrl: cdnBase,
      assets: assetsList,
    };

    manifestCache.set(tag, { manifest, expiresAt: now + MANIFEST_CACHE_TTL });
    return manifest;
  } catch (err) {
    if (tag === CANONICAL_ACTIVE_VERSION) {
      const fallbackManifest = buildCanonicalR1Manifest(tag, cdnBase);
      manifestCache.set(tag, { manifest: fallbackManifest, expiresAt: now + MANIFEST_CACHE_TTL });
      return fallbackManifest;
    }
    throw err;
  }
}

/**
 * Build canonical fallback manifest for r1
 */
function buildCanonicalR1Manifest(tag: string, cdnBase: string): ReleaseManifest {
  return {
    schemaVersion: '1.0.0',
    packageName: 'starfront-world-assets',
    releaseTag: tag,
    generatedAt: '2026-10-22T20:25:00Z',
    totalFiles: CANONICAL_R1_MANIFEST_DATA.length,
    totalSizeBytes: 6230606,
    totalSizeMB: 5.94,
    cdnBaseUrl: cdnBase,
    assets: CANONICAL_R1_MANIFEST_DATA.map((item) => ({
      ...item,
      cdnUrl: `${cdnBase}/${item.relativePath}`,
    })),
  };
}

/**
 * Clear in-memory manifest cache (for tests/forced refresh)
 */
export function clearManifestCache(tag?: string): void {
  if (tag) {
    manifestCache.delete(tag);
  } else {
    manifestCache.clear();
  }
  invalidateHierarchicalManifestCache(tag);
}

/**
 * Compute Version Diff between an Active Release and a Target Release
 */
export function computeVersionDiff(
  activeManifest: ReleaseManifest,
  targetManifest: ReleaseManifest
): VersionDiffSummary {
  const activeMap = new Map<string, ManifestAssetItem>();
  for (const item of activeManifest.assets) {
    activeMap.set(item.relativePath, item);
  }

  const targetMap = new Map<string, ManifestAssetItem>();
  for (const item of targetManifest.assets) {
    targetMap.set(item.relativePath, item);
  }

  const diffItems: ManifestAssetItem[] = [];
  let addedCount = 0;
  let changedCount = 0;
  let removedCount = 0;
  let unchangedCount = 0;
  let unknownCount = 0;

  // Process items in target
  for (const [relPath, targetItem] of targetMap.entries()) {
    const activeItem = activeMap.get(relPath);

    if (!activeItem) {
      // Exists in Target, not in Active => ADDED
      addedCount++;
      diffItems.push({
        ...targetItem,
        diffStatus: 'ADDED',
        statusMessage: 'Tác phẩm mới trong phiên bản mục tiêu',
      });
    } else {
      // Exists in both: compare sha256
      if (targetItem.sha256 && activeItem.sha256) {
        if (targetItem.sha256.toLowerCase() === activeItem.sha256.toLowerCase()) {
          unchangedCount++;
          diffItems.push({
            ...targetItem,
            diffStatus: 'UNCHANGED',
            statusMessage: 'Nguyên bản không đổi (Trùng khớp SHA-256)',
          });
        } else {
          changedCount++;
          diffItems.push({
            ...targetItem,
            diffStatus: 'CHANGED',
            statusMessage: 'Nội dung thay đổi (Khác biệt SHA-256)',
          });
        }
      } else if (targetItem.sizeBytes && activeItem.sizeBytes) {
        // Fallback size comparison if sha256 is absent
        if (targetItem.sizeBytes === activeItem.sizeBytes) {
          unknownCount++;
          diffItems.push({
            ...targetItem,
            diffStatus: 'UNKNOWN',
            statusMessage: 'Cùng dung lượng byte (Thiếu SHA-256 để khẳng định)',
          });
        } else {
          changedCount++;
          diffItems.push({
            ...targetItem,
            diffStatus: 'CHANGED',
            statusMessage: 'Dung lượng file thay đổi',
          });
        }
      } else {
        unknownCount++;
        diffItems.push({
          ...targetItem,
          diffStatus: 'UNKNOWN',
          statusMessage: 'Không có checksum để đối chiếu',
        });
      }
    }
  }

  // Process items that are in Active but missing in Target => REMOVED
  for (const [relPath, activeItem] of activeMap.entries()) {
    if (!targetMap.has(relPath)) {
      removedCount++;
      diffItems.push({
        ...activeItem,
        diffStatus: 'REMOVED',
        statusMessage: 'Bị loại bỏ trong phiên bản mục tiêu!',
        cdnUrl: `${activeManifest.cdnBaseUrl}/${activeItem.relativePath}`,
      });
    }
  }

  // Check if any REQUIRED canonical asset is missing from Target
  const missingRequiredAssets: string[] = [];
  for (const requiredPath of CANONICAL_CORE_26_ASSETS) {
    if (!targetMap.has(requiredPath)) {
      missingRequiredAssets.push(requiredPath);
    }
  }

  const isCompatible = missingRequiredAssets.length === 0;

  return {
    activeTag: activeManifest.releaseTag,
    targetTag: targetManifest.releaseTag,
    totalActive: activeManifest.assets.length,
    totalTarget: targetManifest.assets.length,
    addedCount,
    changedCount,
    removedCount,
    unchangedCount,
    unknownCount,
    isCompatible,
    missingRequiredAssets,
    diffItems,
  };
}
