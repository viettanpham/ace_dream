/**
 * STARFRONT WORLD V2 — GALLERY SHOWCASE ENGINE
 * 
 * Single Source of Truth for Gallery Fullscreen Showcase:
 * - Strict Image-Metadata Identity mapping: No mixing URL of Pilot A with metadata of Pilot B.
 * - Unique Global Identity Key: `${pilotId}::${assetId || filename}::${cleanPath}`
 * - Atomic Image Preloading & Decoding with timeout and race condition protection.
 * - Shuffle Bag algorithm guaranteeing no consecutive identical artworks.
 * - Full metadata propagation: Pilot Name, Callsign, Gender, Artwork Title, Curated Description.
 */

import { resolveImageUrl } from '@/lib/game/assets/image-resolver';
import {
  CANONICAL_12_PILOT_IDS,
  CANONICAL_PILOT_METADATA,
  CanonicalPilotId,
} from '@/lib/game/v2/universal-content-types';

export interface ShowcaseArtwork {
  identityKey: string; // Guaranteed global uniqueness: `${pilotId}::${assetId}::${path}`
  assetId: string;
  filename: string;
  path: string;
  resolvedUrl: string;
  title: string;
  description: string;
  curatedDescription?: string;
  category: string;
  role?: string;
  width?: number;
  height?: number;
  dimensions?: { width: number; height: number };
  sha256?: string;
  isAvailableOnDisk: boolean;
  status: string;
  // Pilot Identity Information
  pilotId: string;
  pilotName: string;
  pilotCallsign: string;
  pilotGender: 'Male' | 'Female';
  pilotPortraitPath: string;
}

export interface PilotShowcaseCatalog {
  pilotId: string;
  pilotName: string;
  pilotCallsign: string;
  pilotGender: 'Male' | 'Female';
  pilotPortraitPath: string;
  totalAssets: number;
  artworks: ShowcaseArtwork[];
  loaded: boolean;
  error?: string;
}

// In-memory runtime cache for loaded pilot galleries
const pilotGalleryCache = new Map<string, ShowcaseArtwork[]>();
const preloadedUrlCache = new Set<string>();

/**
 * Clears in-memory showcase gallery cache when CDN channel/release is refreshed
 */
export function clearShowcaseGalleryCache(): void {
  pilotGalleryCache.clear();
}

/**
 * Creates unique global identity key for an artwork
 */
export function buildArtworkIdentityKey(pilotId: string, assetIdOrFilename: string, path: string): string {
  const cleanPilot = pilotId.toLowerCase().trim();
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const cleanId = (assetIdOrFilename || cleanPath.split('/').pop() || 'unknown').trim();
  return `${cleanPilot}::${cleanId}::${cleanPath}`;
}

/**
 * Fetches gallery for a canonical pilot and converts items into authoritative ShowcaseArtwork tuples
 */
export async function fetchShowcasePilotGallery(
  pilotId: string,
  abortSignal?: AbortSignal
): Promise<ShowcaseArtwork[]> {
  const cleanId = pilotId.toLowerCase().trim() as CanonicalPilotId;

  // Check cache first
  if (pilotGalleryCache.has(cleanId)) {
    return pilotGalleryCache.get(cleanId)!;
  }

  const meta = CANONICAL_PILOT_METADATA[cleanId] || {
    name: pilotId.toUpperCase(),
    callsign: '',
    gender: 'Female',
    role: 'Tactical Pilot',
  };

  try {
    const res = await fetch(`/api/runtime/gallery/${cleanId}`, {
      signal: abortSignal,
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn(`[ShowcaseEngine] Failed to fetch gallery for ${cleanId} (HTTP ${res.status})`);
      return [];
    }

    const data = await res.json();
    const sourceList = Array.isArray(data.verifiedArtworks)
      ? data.verifiedArtworks
      : Array.isArray(data.artworks)
      ? data.artworks
      : [];

    if (!data.success || sourceList.length === 0) {
      return [];
    }

    const rawPilotName = data.pilotName || meta.name || cleanId;
    const cleanPilotName = rawPilotName.replace(/^[a-z0-9-_]+\s*-\s*/i, '').trim();

    // Determine verified R4 portrait URL from the pilot's own verified artworks
    const portraitItem =
      sourceList.find(
        (it: any) =>
          it &&
          it.isAvailableOnDisk !== false &&
          it.path &&
          String(it.filename || it.id || '').toLowerCase().includes('-portrait')
      ) ||
      sourceList.find((it: any) => it && it.isAvailableOnDisk !== false && it.path);
    const portraitPath = portraitItem?.path ? String(portraitItem.path).trim() : '';

    const result: ShowcaseArtwork[] = [];

    for (const item of sourceList) {
      if (!item) continue;

      const isVerified =
        item.isAvailableOnDisk !== false &&
        item.cdnStatus !== 'PENDING_BINARY_IMPORT' &&
        Boolean(item.path && String(item.path).trim());

      if (!isVerified) {
        continue;
      }

      const rawTitle = item.title || item.label || item.filename || 'Tác phẩm';
      let naturalTitle = rawTitle;

      const outfitMatch =
        rawTitle.match(/outfit[-_\s]*(\d+)/i) ||
        (item.filename || '').match(/outfit[-_\s]*(\d+)/i) ||
        (item.assetId || '').match(/outfit[-_\s]*(\d+)/i);
      if (outfitMatch && !rawTitle.includes('—')) {
        naturalTitle = `${cleanPilotName} — Trang phục #${outfitMatch[1].padStart(3, '0')}`;
      }

      const cleanPath = String(item.path).trim();
      const resolvedUrl = resolveImageUrl(cleanPath) || '';
      if (!resolvedUrl) continue;

      const assetId = item.assetId || item.filename || item.id || cleanPath.split('/').pop() || 'art';
      const identityKey = buildArtworkIdentityKey(cleanId, assetId, cleanPath);

      const description =
        item.curatedDescription ||
        item.description ||
        `Tác phẩm nghệ thuật chuẩn hóa của phi công ${cleanPilotName}.`;

      result.push({
        identityKey,
        assetId,
        filename: item.filename || cleanPath.split('/').pop() || 'artwork.webp',
        path: cleanPath,
        resolvedUrl,
        title: naturalTitle,
        description,
        curatedDescription: item.curatedDescription || item.description,
        category: item.rawCategory || item.category || item.roleCategory || 'CORE',
        role: item.role,
        width: item.width || item.dimensions?.width,
        height: item.height || item.dimensions?.height,
        dimensions:
          item.dimensions ||
          (item.width && item.height ? { width: item.width, height: item.height } : undefined),
        sha256: item.sha256 || item.expectedSha256,
        isAvailableOnDisk: true,
        status: 'verified_webp',
        pilotId: cleanId,
        pilotName: cleanPilotName,
        pilotCallsign: meta.callsign,
        pilotGender: meta.gender,
        pilotPortraitPath: portraitPath,
      });
    }

    pilotGalleryCache.set(cleanId, result);
    return result;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return [];
    }
    console.warn(`[ShowcaseEngine] Network error fetching gallery for ${cleanId}:`, err);
    return [];
  }
}

/**
 * Creates a Shuffle Bag from an array of artworks, guaranteeing no consecutive duplicate
 */
export function createShuffleBag(
  artworks: ShowcaseArtwork[],
  lastShownIdentityKey?: string
): ShowcaseArtwork[] {
  if (artworks.length <= 1) return [...artworks];

  const bag = [...artworks];
  // Standard Fisher-Yates
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }

  // Ensure first item of new bag is not identical to last shown item
  if (lastShownIdentityKey && bag[0].identityKey === lastShownIdentityKey && bag.length > 1) {
    const swapTarget = Math.floor(Math.random() * (bag.length - 1)) + 1;
    [bag[0], bag[swapTarget]] = [bag[swapTarget], bag[0]];
  }

  return bag;
}

/**
 * Preloads and decodes an image URL with timeout.
 * Returns true if image loaded and decoded successfully, false otherwise.
 */
export function preloadAndDecodeImage(
  url: string,
  timeoutMs = 7000
): Promise<boolean> {
  if (!url || typeof window === 'undefined') return Promise.resolve(false);

  if (preloadedUrlCache.has(url)) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let finished = false;
    const img = new Image();

    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        // Timeout reached: do not block UI, return false
        resolve(false);
      }
    }, timeoutMs);

    img.onload = () => {
      if (finished) return;
      // Decode image off the main thread if supported
      if ('decode' in img) {
        img
          .decode()
          .then(() => {
            if (!finished) {
              finished = true;
              clearTimeout(timer);
              preloadedUrlCache.add(url);
              resolve(true);
            }
          })
          .catch(() => {
            if (!finished) {
              finished = true;
              clearTimeout(timer);
              preloadedUrlCache.add(url);
              resolve(true);
            }
          });
      } else {
        finished = true;
        clearTimeout(timer);
        preloadedUrlCache.add(url);
        resolve(true);
      }
    };

    img.onerror = () => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        resolve(false);
      }
    };

    img.src = url;
  });
}

/**
 * Preloads an array of image URLs with concurrency limit
 */
export async function preloadShowcaseQueue(
  urls: string[],
  concurrency = 2
): Promise<void> {
  const pending = urls.filter((u) => u && !preloadedUrlCache.has(u));
  if (pending.length === 0) return;

  const pool: Promise<boolean>[] = [];
  for (const url of pending.slice(0, 4)) { // Max 4 queued
    if (pool.length >= concurrency) {
      await Promise.race(pool);
    }
    const p = preloadAndDecodeImage(url).then((res) => {
      pool.splice(pool.indexOf(p), 1);
      return res;
    });
    pool.push(p);
  }

  await Promise.allSettled(pool);
}
