/**
 * STARFRONT WORLD V2 — HIERARCHICAL CDN MANIFEST ENGINE
 *
 * Implements the approved V2 Hierarchical CDN Architecture:
 * 1. Discovery Index: images/manifest.json
 * 2. Per-Pilot Manifest: images/pilots/<pilotId>/manifest.json
 * 3. Artwork Binary: images/pilots/<pilotId>/*.webp
 * 4. Lazy Category Discovery: Skip categories with status="not_configured"
 * 5. Strict Status Filtering: Only "approved" status rendered, skip draft/rejected/hidden
 * 6. Cache Isolation: Keyed by `${releaseTag}:${manifestPath}` with full invalidation
 * 7. Graceful Decomposition: Synthesize virtual hierarchical manifests if remote release
 *    is in migration transition (prior to owner committing generated manifest files).
 */

import { CANONICAL_REPOSITORY } from './runtime-asset-config';

export type CategoryConfigStatus = 'configured' | 'not_configured' | 'archived';

export interface HierarchicalPilotEntry {
  manifest: string;
  count: number;
  name: string;
  sourceZip?: string;
  corePresent?: string[];
  coreSlotAliases?: Record<string, string>;
}

export interface HierarchicalPilotsCategory {
  status: 'configured';
  basePath: string;
  indexManifest?: string;
  pilotCount: number;
  pilots: Record<string, HierarchicalPilotEntry>;
}

export interface HierarchicalUnconfiguredCategory {
  status: 'not_configured' | 'archived';
  note?: string;
}

export interface HierarchicalCategories {
  pilots: HierarchicalPilotsCategory;
  gear: HierarchicalUnconfiguredCategory;
  equipment: HierarchicalUnconfiguredCategory;
  environments: HierarchicalUnconfiguredCategory;
  ui: HierarchicalUnconfiguredCategory;
  [categoryKey: string]: HierarchicalPilotsCategory | HierarchicalUnconfiguredCategory;
}

export interface HierarchicalIndexManifest {
  schemaVersion: 'starfront-hierarchical-index-v2';
  packageName: string;
  generatedAt: string;
  sourceRepo: string;
  activeReleaseTag: string;
  rootPath: string;
  categories: HierarchicalCategories;
}

export interface PilotArtworkManifestItem {
  assetId: string;
  filename: string;
  path: string;
  role: string;
  category: 'core' | 'outfit' | 'event' | 'story' | 'other';
  status: 'approved' | 'rejected' | 'draft' | 'hidden';
  sha256?: string;
  byteSize?: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
  title?: string;
  description?: string;
  cdnUrl?: string;
}

export interface PilotManifest {
  schemaVersion: 'starfront-pilot-manifest-v2';
  pilotId: string;
  pilotName: string;
  totalAssets: number;
  approvedAssetsCount: number;
  coreMapping: Record<string, string>;
  sourceZip?: string;
  artworks: PilotArtworkManifestItem[];
}

// Canonical display names for pilots
export const HIERARCHICAL_PILOT_NAMES: Record<string, string> = {
  aria: 'Aria Sterling',
  fortuna: 'Fortuna (Lady Luck)',
  kaelen: 'Kaelen Cross',
  lyra: 'Lyra Song',
  nova: 'Nova Ray',
  rhea: 'Rhea Silva',
  selena: 'Selena Vega',
  valentine: 'Valentine Vance',
};

// In-memory cache keyed by `${releaseTag}:${manifestPath}`
const hierarchicalCache = new Map<string, { data: unknown; expiresAt: number }>();
const HIERARCHICAL_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Invalidate hierarchical manifest cache for a specific release tag or completely.
 */
export function invalidateHierarchicalManifestCache(releaseTag?: string): void {
  if (!releaseTag) {
    hierarchicalCache.clear();
    return;
  }
  const prefix = `${releaseTag}:`;
  for (const key of hierarchicalCache.keys()) {
    if (key.startsWith(prefix)) {
      hierarchicalCache.delete(key);
    }
  }
}

/**
 * Build the cache key
 */
function makeCacheKey(releaseTag: string, manifestPath: string): string {
  return `${releaseTag}:${manifestPath}`;
}

/**
 * Fetch discovery index: images/manifest.json
 */
export async function fetchHierarchicalIndex(
  cdnBaseUrl: string,
  releaseTag: string
): Promise<HierarchicalIndexManifest> {
  const manifestPath = 'images/manifest.json';
  const cacheKey = makeCacheKey(releaseTag, manifestPath);
  const now = Date.now();

  const cached = hierarchicalCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data as HierarchicalIndexManifest;
  }

  const normalizedBase = cdnBaseUrl.endsWith('/') ? cdnBaseUrl.slice(0, -1) : cdnBaseUrl;
  const targetUrl = `${normalizedBase}/${manifestPath}`;

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'STARFRONT-HierarchicalCDN/2.0',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const indexData = (await res.json()) as HierarchicalIndexManifest;
      hierarchicalCache.set(cacheKey, { data: indexData, expiresAt: now + HIERARCHICAL_CACHE_TTL });
      return indexData;
    }
  } catch {
    // CDN fetch failed or timed out, attempt raw GitHub fallback or synthesis
  }

  // Graceful Decomposition Fallback:
  // If images/manifest.json is not yet uploaded to the CDN release (e.g. branch version1-r2 before GitHub tag),
  // fetch manifests/pilot-v2-artworks.json and synthesize the canonical hierarchical structure in memory.
  const synthesized = await synthesizeHierarchicalIndexFromRemoteV2(cdnBaseUrl, releaseTag);
  hierarchicalCache.set(cacheKey, { data: synthesized, expiresAt: now + HIERARCHICAL_CACHE_TTL });
  return synthesized;
}

/**
 * Fetch per-pilot manifest: images/pilots/<pilotId>/manifest.json
 */
export async function fetchPilotManifest(
  cdnBaseUrl: string,
  releaseTag: string,
  pilotId: string,
  indexManifest?: HierarchicalIndexManifest
): Promise<PilotManifest | null> {
  const pId = pilotId.toLowerCase().trim();
  const manifestPath = `images/pilots/${pId}/manifest.json`;
  const cacheKey = makeCacheKey(releaseTag, manifestPath);
  const now = Date.now();

  const cached = hierarchicalCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data as PilotManifest;
  }

  const normalizedBase = cdnBaseUrl.endsWith('/') ? cdnBaseUrl.slice(0, -1) : cdnBaseUrl;
  const targetUrl = `${normalizedBase}/${manifestPath}`;

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'STARFRONT-HierarchicalCDN/2.0',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const pilotData = (await res.json()) as PilotManifest;
      // Filter out rejected, draft, hidden artworks (Approved only)
      const approvedArtworks = pilotData.artworks.filter(
        (a) => !a.status || a.status === 'approved'
      ).map((a) => ({
        ...a,
        cdnUrl: a.cdnUrl || `${normalizedBase}/${a.path}`,
      }));

      const finalPilotManifest: PilotManifest = {
        ...pilotData,
        approvedAssetsCount: approvedArtworks.length,
        artworks: approvedArtworks,
      };

      hierarchicalCache.set(cacheKey, {
        data: finalPilotManifest,
        expiresAt: now + HIERARCHICAL_CACHE_TTL,
      });
      return finalPilotManifest;
    }
  } catch {
    // Fall back to synthesis
  }

  // If per-pilot manifest was not found on remote (404), synthesize from V2 catalog
  const synthesized = await synthesizePilotManifestFromRemoteV2(cdnBaseUrl, releaseTag, pId);
  if (synthesized) {
    hierarchicalCache.set(cacheKey, {
      data: synthesized,
      expiresAt: now + HIERARCHICAL_CACHE_TTL,
    });
  }
  return synthesized;
}

/**
 * Fetch raw V2 artworks catalog to synthesize hierarchical manifests
 */
async function fetchRawV2Catalog(cdnBaseUrl: string): Promise<any> {
  const normalizedBase = cdnBaseUrl.endsWith('/') ? cdnBaseUrl.slice(0, -1) : cdnBaseUrl;
  const candidates = [
    `${normalizedBase}/manifests/pilot-v2-artworks.json`,
    `https://raw.githubusercontent.com/${CANONICAL_REPOSITORY}/version1-r2/starfront-world-assets/manifests/pilot-v2-artworks.json`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Synthesize HierarchicalIndexManifest in memory from raw V2 catalog
 */
async function synthesizeHierarchicalIndexFromRemoteV2(
  cdnBaseUrl: string,
  releaseTag: string
): Promise<HierarchicalIndexManifest> {
  const raw = await fetchRawV2Catalog(cdnBaseUrl);
  const pilotsMap: Record<string, HierarchicalPilotEntry> = {};

  if (raw?.pilots && typeof raw.pilots === 'object') {
    for (const [pId, meta] of Object.entries(raw.pilots as Record<string, any>)) {
      pilotsMap[pId] = {
        manifest: `images/pilots/${pId}/manifest.json`,
        count: Number(meta.count) || 0,
        name: HIERARCHICAL_PILOT_NAMES[pId] || pId,
        sourceZip: meta.sourceZip,
        corePresent: meta.corePresent,
        coreSlotAliases: meta.coreSlotAliases,
      };
    }
  }

  return {
    schemaVersion: 'starfront-hierarchical-index-v2',
    packageName: 'starfront-world-assets',
    generatedAt: raw?.generatedAt || new Date().toISOString(),
    sourceRepo: CANONICAL_REPOSITORY,
    activeReleaseTag: releaseTag,
    rootPath: 'images',
    categories: {
      pilots: {
        status: 'configured',
        basePath: 'images/pilots',
        indexManifest: 'images/pilots/manifest.json',
        pilotCount: Object.keys(pilotsMap).length,
        pilots: pilotsMap,
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
}

/**
 * Synthesize a single PilotManifest in memory from raw V2 catalog
 */
async function synthesizePilotManifestFromRemoteV2(
  cdnBaseUrl: string,
  releaseTag: string,
  pilotId: string
): Promise<PilotManifest | null> {
  const raw = await fetchRawV2Catalog(cdnBaseUrl);
  if (!raw || !Array.isArray(raw.assets)) {
    return null;
  }

  const pId = pilotId.toLowerCase();
  const pilotAssets = raw.assets.filter((a: any) => (a.pilotId || '').toLowerCase() === pId);
  if (pilotAssets.length === 0) {
    return null;
  }

  const pilotMeta = raw.pilots?.[pId] || {};
  const normalizedBase = cdnBaseUrl.endsWith('/') ? cdnBaseUrl.slice(0, -1) : cdnBaseUrl;

  const coreMapping: Record<string, string> = {};
  const artworks: PilotArtworkManifestItem[] = [];

  for (const item of pilotAssets) {
    const filename = item.filename;
    const role = item.role || 'other';
    const isCore = item.category === 'core';
    const status = item.status || 'approved';

    if (isCore && role) {
      coreMapping[role] = filename;
    }

    // Include only approved artworks (skip draft/rejected/hidden)
    if (status === 'approved') {
      artworks.push({
        assetId: `${pId}-${filename.replace(/\.webp$/i, '')}`,
        filename,
        path: item.path || `images/pilots/${pId}/${filename}`,
        role,
        category: isCore ? 'core' : 'outfit',
        status: 'approved',
        sha256: item.sha256,
        byteSize: item.byteSize,
        width: item.width,
        height: item.height,
        aspectRatio: item.width && item.height ? `${item.width}:${item.height}` : undefined,
        title: `${HIERARCHICAL_PILOT_NAMES[pId] || pId} - ${role}`,
        cdnUrl: `${normalizedBase}/${item.path || `images/pilots/${pId}/${filename}`}`,
      });
    }
  }

  // Handle core slot aliases if declared
  if (pilotMeta.coreSlotAliases) {
    for (const [slot, aliasFile] of Object.entries(pilotMeta.coreSlotAliases as Record<string, string>)) {
      coreMapping[slot] = aliasFile;
    }
  }

  return {
    schemaVersion: 'starfront-pilot-manifest-v2',
    pilotId: pId,
    pilotName: HIERARCHICAL_PILOT_NAMES[pId] || pId,
    totalAssets: pilotAssets.length,
    approvedAssetsCount: artworks.length,
    coreMapping,
    sourceZip: pilotMeta.sourceZip,
    artworks,
  };
}

/**
 * Generate full hierarchical export bundle (images/manifest.json + 8 pilot manifests)
 * Useful for exporting and committing directly to the GitHub asset repository.
 */
export async function generateHierarchicalManifestBundle(
  cdnBaseUrl: string,
  releaseTag: string
): Promise<{
  indexManifest: HierarchicalIndexManifest;
  pilotManifests: Record<string, PilotManifest>;
}> {
  const indexManifest = await synthesizeHierarchicalIndexFromRemoteV2(cdnBaseUrl, releaseTag);
  const pilotManifests: Record<string, PilotManifest> = {};

  const pilotIds = Object.keys(indexManifest.categories.pilots.pilots);
  for (const pid of pilotIds) {
    const manifest = await synthesizePilotManifestFromRemoteV2(cdnBaseUrl, releaseTag, pid);
    if (manifest) {
      pilotManifests[pid] = manifest;
    }
  }

  return {
    indexManifest,
    pilotManifests,
  };
}
