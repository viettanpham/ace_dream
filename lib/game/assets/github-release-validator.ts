/**
 * STARFRONT WORLD V2 — GITHUB RELEASE DISCOVERY & VALIDATION ENGINE (WEB-01.3.A.2)
 *
 * Implements:
 * 1. Server-side GitHub Releases Discovery with 10-minute TTL in-memory cache
 *    (preventing GitHub API rate limit exhaustion).
 * 2. Fallback to canonical v2.0-assets-r1 when GitHub API is unreachable or rate-limited.
 * 3. Fast Validation (HEAD request to key asset + tag format verification).
 * 4. Full Canonical Audit (validating presence of all 26 core game assets).
 * 5. Strict isolation: Never automatically adds unvetted artwork to character galleries.
 */

import {
  VERSION_TAG_REGEX,
  CANONICAL_REPOSITORY,
  CANONICAL_ASSET_ROOT,
  CANONICAL_ACTIVE_VERSION,
  computeCdnBaseUrl,
} from './runtime-asset-config';

export type ReleaseValidationStatus =
  | 'ACTIVE'
  | 'VERIFIED'
  | 'INCOMPATIBLE'
  | 'INVALID'
  | 'UNVALIDATED';

export interface DiscoveredRelease {
  tag: string;
  name: string;
  publishedAt: string;
  description: string;
  isPrerelease: boolean;
  validationStatus: ReleaseValidationStatus;
  assetCount?: number;
  cdnBaseUrl: string;
  missingAssets?: string[];
  lastValidatedAt?: string;
  errorMessage?: string;
}

export interface ValidationResult {
  valid: boolean;
  status: ReleaseValidationStatus;
  tag: string;
  cdnBaseUrl: string;
  verifiedCount: number;
  totalRequired: number;
  missingAssets: string[];
  validatedAt: string;
  mode: 'fast' | 'full';
  error?: string;
}

/**
 * 26 Core Mandatory Assets from WEB01_PUBLIC_IMAGES_INVENTORY.md & Phase 6.0
 * Must be present in any release for full compatibility with existing game screens.
 */
export const CANONICAL_CORE_26_ASSETS: string[] = [
  // 3 GEARs
  'images/aegis-gear.webp',
  'images/falcon-gear.webp',
  'images/vanguard-gear.webp',

  // 16 Pilot V1 (8 portraits + 8 fullbody)
  'images/marcus-portrait.webp',
  'images/marcus-fullbody.webp',
  'images/valentine-portrait.webp',
  'images/valentine-fullbody.webp',
  'images/alviss-portrait.webp',
  'images/alviss-fullbody.webp',
  'images/eric-portrait.webp',
  'images/eric-fullbody.webp',
  'images/lyra-portrait.webp',
  'images/lyra-fullbody.webp',
  'images/kaelen-portrait.webp',
  'images/kaelen-fullbody.webp',
  'images/selena-portrait.webp',
  'images/selena-fullbody.webp',
  'images/victor-portrait.webp',
  'images/victor-fullbody.webp',

  // 7 Valentine V2 Approved Artworks
  'images/valentine-activity-001.webp',
  'images/valentine-casual.webp',
  'images/valentine-closeup.webp',
  'images/valentine-combat.webp',
  'images/valentine-event-001.webp',
  'images/valentine-story-001.webp',
  'images/valentine-uniform-001.webp',
];

// In-memory cache for GitHub releases (TTL = 10 minutes)
interface ReleaseCacheEntry {
  releases: DiscoveredRelease[];
  expiresAt: number;
  fetchedAt: number;
}

let releasesCache: ReleaseCacheEntry | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Verified base release to guarantee zero dead-ends
 */
export const FALLBACK_RELEASE_R1: DiscoveredRelease = {
  tag: CANONICAL_ACTIVE_VERSION,
  name: 'STARFRONT World Assets Release 1 (Core 26 WebP)',
  publishedAt: '2026-10-22T20:25:00.000Z',
  description: 'Verified production release containing all 26 core Pilot, GEAR, and World assets.',
  isPrerelease: false,
  validationStatus: 'VERIFIED',
  assetCount: 26,
  cdnBaseUrl: computeCdnBaseUrl('jsdelivr', CANONICAL_REPOSITORY, CANONICAL_ACTIVE_VERSION, CANONICAL_ASSET_ROOT),
  missingAssets: [],
  lastValidatedAt: '2026-10-22T20:25:00.000Z',
};

/**
 * Clears releases cache (e.g. for testing or explicit forced refresh)
 */
export function clearReleasesCache(): void {
  releasesCache = null;
}

/**
 * Discovers available releases from GitHub repository with 10-minute caching
 */
export async function discoverGitHubReleases(
  forceRefresh = false,
  activeTag = CANONICAL_ACTIVE_VERSION
): Promise<{ releases: DiscoveredRelease[]; fromCache: boolean; rateLimited?: boolean }> {
  const now = Date.now();

  if (!forceRefresh && releasesCache && releasesCache.expiresAt > now) {
    // Return cached copy with updated active status
    const tagged = releasesCache.releases.map((rel) => ({
      ...rel,
      validationStatus: rel.tag === activeTag ? ('ACTIVE' as const) : rel.validationStatus,
    }));
    return { releases: tagged, fromCache: true };
  }

  const apiUrl = `https://api.github.com/repos/${CANONICAL_REPOSITORY}/releases?per_page=20`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'STARFRONT-World-AssetManager/2.0',
  };

  if (process.env.GITHUB_TOKEN?.trim()) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN.trim()}`;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(8000),
    });

    if (response.status === 403) {
      console.warn('[GitHub Discovery] Rate limited by GitHub API. Using cached or fallback releases.');
      const fallbackList = releasesCache ? releasesCache.releases : [FALLBACK_RELEASE_R1];
      return {
        releases: fallbackList.map((r) => ({
          ...r,
          validationStatus: r.tag === activeTag ? ('ACTIVE' as const) : r.validationStatus,
        })),
        fromCache: Boolean(releasesCache),
        rateLimited: true,
      };
    }

    if (!response.ok) {
      throw new Error(`GitHub API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Unexpected GitHub API response structure');
    }

    const parsedReleases: DiscoveredRelease[] = [];

    for (const item of data) {
      const tag = item.tag_name || item.name;
      if (!tag || typeof tag !== 'string' || !VERSION_TAG_REGEX.test(tag)) {
        continue;
      }

      const cdnBase = computeCdnBaseUrl('jsdelivr', CANONICAL_REPOSITORY, tag, CANONICAL_ASSET_ROOT);

      parsedReleases.push({
        tag,
        name: item.name || tag,
        publishedAt: item.published_at || new Date().toISOString(),
        description: (item.body || '').slice(0, 300),
        isPrerelease: Boolean(item.prerelease),
        validationStatus: tag === activeTag ? 'ACTIVE' : 'UNVALIDATED',
        assetCount: tag === 'v2.0-assets-r1' ? 26 : undefined,
        cdnBaseUrl: cdnBase,
      });
    }

    // Ensure fallback r1 is always included in the list
    if (!parsedReleases.some((r) => r.tag === CANONICAL_ACTIVE_VERSION)) {
      parsedReleases.push(FALLBACK_RELEASE_R1);
    }

    // Sort descending by tag/date
    parsedReleases.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

    // Update cache
    releasesCache = {
      releases: parsedReleases,
      expiresAt: now + CACHE_TTL_MS,
      fetchedAt: now,
    };

    return {
      releases: parsedReleases.map((r) => ({
        ...r,
        validationStatus: r.tag === activeTag ? ('ACTIVE' as const) : r.validationStatus,
      })),
      fromCache: false,
    };
  } catch (err) {
    console.warn('[GitHub Discovery] Network failure:', err instanceof Error ? err.message : err);
    const fallbackList = releasesCache ? releasesCache.releases : [FALLBACK_RELEASE_R1];
    return {
      releases: fallbackList.map((r) => ({
        ...r,
        validationStatus: r.tag === activeTag ? ('ACTIVE' as const) : r.validationStatus,
      })),
      fromCache: Boolean(releasesCache),
      rateLimited: false,
    };
  }
}

/**
 * Fast Validation:
 * Validates tag format and pings jsDelivr CDN for the key canary asset.
 */
export async function runFastValidation(tag: string): Promise<ValidationResult> {
  const validatedAt = new Date().toISOString();

  if (!tag || !VERSION_TAG_REGEX.test(tag)) {
    return {
      valid: false,
      status: 'INVALID',
      tag,
      cdnBaseUrl: '',
      verifiedCount: 0,
      totalRequired: 1,
      missingAssets: ['invalid_tag_format'],
      validatedAt,
      mode: 'fast',
      error: `Release Tag không đúng định dạng chuẩn: ${tag}`,
    };
  }

  const cdnBase = computeCdnBaseUrl('jsdelivr', CANONICAL_REPOSITORY, tag, CANONICAL_ASSET_ROOT);
  const canaryAssetPath = 'images/vanguard-gear.webp';
  const canaryUrl = `${cdnBase}/${canaryAssetPath}`;

  try {
    const res = await fetch(canaryUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      return {
        valid: true,
        status: 'VERIFIED',
        tag,
        cdnBaseUrl: cdnBase,
        verifiedCount: 1,
        totalRequired: 1,
        missingAssets: [],
        validatedAt,
        mode: 'fast',
      };
    } else {
      return {
        valid: false,
        status: 'INVALID',
        tag,
        cdnBaseUrl: cdnBase,
        verifiedCount: 0,
        totalRequired: 1,
        missingAssets: [canaryAssetPath],
        validatedAt,
        mode: 'fast',
        error: `Canary asset (${canaryAssetPath}) không tìm thấy trên CDN jsDelivr (HTTP ${res.status}).`,
      };
    }
  } catch (err) {
    return {
      valid: false,
      status: 'INVALID',
      tag,
      cdnBaseUrl: cdnBase,
      verifiedCount: 0,
      totalRequired: 1,
      missingAssets: ['network_error'],
      validatedAt,
      mode: 'fast',
      error: `Lỗi kết nối CDN jsDelivr: ${err instanceof Error ? err.message : 'Unknown'}`,
    };
  }
}

/**
 * Full Canonical Audit:
 * Validates all 26 core assets required by the game across jsDelivr edge nodes.
 */
export async function runFullCanonicalAudit(tag: string): Promise<ValidationResult> {
  const validatedAt = new Date().toISOString();

  if (!tag || !VERSION_TAG_REGEX.test(tag)) {
    return {
      valid: false,
      status: 'INVALID',
      tag,
      cdnBaseUrl: '',
      verifiedCount: 0,
      totalRequired: CANONICAL_CORE_26_ASSETS.length,
      missingAssets: CANONICAL_CORE_26_ASSETS,
      validatedAt,
      mode: 'full',
      error: `Release Tag không hợp lệ: ${tag}`,
    };
  }

  const cdnBase = computeCdnBaseUrl('jsdelivr', CANONICAL_REPOSITORY, tag, CANONICAL_ASSET_ROOT);
  const missingAssets: string[] = [];
  let verifiedCount = 0;

  // Check assets in concurrency batches of 6
  const BATCH_SIZE = 6;
  for (let i = 0; i < CANONICAL_CORE_26_ASSETS.length; i += BATCH_SIZE) {
    const batch = CANONICAL_CORE_26_ASSETS.slice(i, i + BATCH_SIZE);
    const checks = await Promise.allSettled(
      batch.map(async (assetPath) => {
        const url = `${cdnBase}/${assetPath}`;
        const res = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(6000),
        });
        return { assetPath, ok: res.ok, status: res.status };
      })
    );

    for (let j = 0; j < checks.length; j++) {
      const check = checks[j];
      const assetPath = batch[j];
      if (check.status === 'fulfilled' && check.value.ok) {
        verifiedCount++;
      } else {
        missingAssets.push(assetPath);
      }
    }
  }

  const totalRequired = CANONICAL_CORE_26_ASSETS.length;
  const isAllPresent = missingAssets.length === 0;

  return {
    valid: isAllPresent,
    status: isAllPresent ? 'VERIFIED' : 'INCOMPATIBLE',
    tag,
    cdnBaseUrl: cdnBase,
    verifiedCount,
    totalRequired,
    missingAssets,
    validatedAt,
    mode: 'full',
    error: isAllPresent
      ? undefined
      : `Thiếu ${missingAssets.length}/${totalRequired} tệp tài nguyên cốt lõi trong phiên bản ${tag}.`,
  };
}
