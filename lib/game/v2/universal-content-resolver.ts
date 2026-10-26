/**
 * STARFRONT WORLD V2 — UNIVERSAL CONTENT RESOLVER (CP3-A / FND-8)
 * 
 * Centralized, manifest-driven content resolver for Universal CDN R3:
 * 1. Root Content Discovery: content-manifest.json
 * 2. Visual Art Gallery: images/pilots/<pilotId>/gallery.json & files.json
 * 3. Story Index & Chapter Catalog: stories/manifest.json & stories/pilots/<pilotId>/manifest.json
 * 4. Story Chapter Prose: stories/pilots/<pilotId>/chapter-NN.json
 * 
 * Features:
 * - Dynamic Discovery (no hardcoded pilot or chapter lists).
 * - Multi-tier Cache (In-Memory with TTL + Stale-While-Revalidate).
 * - Multi-tier Fallback (Remote jsDelivr CDN R3 -> Local Staging -> In-Memory Fallback).
 * - Strict Security Gatekeeper (Never expose private drafts or missing files as 404).
 * - Zero Duplicates & Sanitized Asset Models.
 */

import {
  UniversalContentRootManifest,
  UniversalGalleryManifest,
  UniversalArtworkManifestItem,
  UniversalPilotStoryManifest,
  UniversalStoryChapterMeta,
  UniversalStoryChapterContent,
  StoryBlock,
  CANONICAL_12_PILOT_IDS,
  CanonicalPilotId,
  isCanonicalPilotId,
} from './universal-content-types';
import { resolveImageUrl, getResolverConfig } from '../assets/image-resolver';
import { assetConfigStore } from '../assets/runtime-asset-config';
import fs from 'node:fs';
import path from 'node:path';

// Canonical R3 Constants
export const DEFAULT_CDN_R3_BASE =
  'https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v3.0-assets-r3/starfront-world-assets';
export const R3_RELEASE_TAG = 'v3.0-assets-r3';

// Cache container: key -> { data: any, expiresAt: number }
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const resolverCache = new Map<string, CacheEntry<unknown>>();
const RESOLVER_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Returns current effective CDN Base URL for R3 content
 */
export function getEffectiveCdnBaseUrl(): string {
  try {
    const config = assetConfigStore.getConfigSync();
    if (config?.cdnBaseUrl) {
      return config.cdnBaseUrl.endsWith('/')
        ? config.cdnBaseUrl.slice(0, -1)
        : config.cdnBaseUrl;
    }
  } catch {
    // Fallback to resolver config
  }

  const resolverConfig = getResolverConfig();
  if (resolverConfig?.cdnBaseUrl) {
    return resolverConfig.cdnBaseUrl.endsWith('/')
      ? resolverConfig.cdnBaseUrl.slice(0, -1)
      : resolverConfig.cdnBaseUrl;
  }

  return DEFAULT_CDN_R3_BASE;
}

/**
 * Gets path to local staging directory if available (resilient offline/local fallback)
 */
function getLocalStagingPath(subPath: string): string | null {
  try {
    const cleanSub = subPath.startsWith('/') ? subPath.slice(1) : subPath;
    const candidate = path.join(process.cwd(), 'staging', 'starfront-world-assets', cleanSub);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  } catch {
    // Ignore in browser/edge environments
  }
  return null;
}

/**
 * Helper to fetch JSON from remote URL with timeout and local staging fallback
 */
async function fetchWithFallback<T>(relativeSubPath: string, timeoutMs: number = 4000): Promise<T | null> {
  const cleanSub = relativeSubPath.startsWith('/') ? relativeSubPath.slice(1) : relativeSubPath;
  const cacheKey = `r3:${cleanSub}`;
  const now = Date.now();

  const cached = resolverCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  const cdnBase = getEffectiveCdnBaseUrl();
  const remoteUrl = `${cdnBase}/${cleanSub}`;

  // 1. Try remote CDN fetch
  try {
    const res = await fetch(remoteUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'STARFRONT-UniversalContentResolver/3.0',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (res.ok) {
      const data = (await res.json()) as T;
      resolverCache.set(cacheKey, { data, expiresAt: now + RESOLVER_CACHE_TTL_MS });
      return data;
    }
  } catch (remoteErr) {
    // Proceed to local fallback
  }

  // 2. Try local staging file fallback
  const localFile = getLocalStagingPath(cleanSub);
  if (localFile) {
    try {
      const fileData = fs.readFileSync(localFile, 'utf-8');
      const data = JSON.parse(fileData) as T;
      resolverCache.set(cacheKey, { data, expiresAt: now + RESOLVER_CACHE_TTL_MS });
      return data;
    } catch {
      // Local read failed
    }
  }

  // If stale cache exists, return it as last resort
  if (cached) {
    return cached.data as T;
  }

  return null;
}

/**
 * Normalized UI Artwork Model for Gallery
 */
export interface ResolvedGalleryArtwork {
  assetId: string;
  filename: string;
  path: string;
  fullUrl: string;
  role: string;
  category: string;
  title: string;
  description: string;
  curatedDescription?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  byteSize: number;
  sha256?: string;
  isAvailableOnDisk: boolean;
  status: 'verified_webp' | 'archive_pending';
}

export interface ResolvedPilotGallery {
  pilotId: string;
  pilotName: string;
  totalAssets: number;
  approvedAssetsCount: number;
  coreMapping: Record<string, string>;
  artworks: ResolvedGalleryArtwork[];
}

export interface ResolvedChapterItem {
  chapterId: string;
  chapterNumber: number;
  title: string;
  canonicalLibraryTitle?: string;
  summary: string;
  quote?: string;
  editorialStatus: string;
  contentStatus: string;
  publicationStatus: string;
  contentAvailable: boolean;
  isComingSoon: boolean;
  readingTimeMinutes: number;
  wordCount: number;
  file?: string;
  sceneAnchorsCount: number;
}

export interface ResolvedPilotStoryCatalog {
  pilotId: string;
  pilotName: string;
  callsign: string;
  totalChapters: number;
  publishedChaptersCount: number;
  chapters: ResolvedChapterItem[];
}

export interface ResolvedStoryChapterProse {
  success: boolean;
  isComingSoon: boolean;
  pilotId: string;
  chapterId: string;
  meta: UniversalStoryChapterMeta;
  content: string; // Plaintext or Markdown prose for easy rendering
  blocks: StoryBlock[];
  sceneAnchors: Array<{
    anchorId: string;
    title: string;
    caption?: string;
    artworkUrl?: string;
    assetId?: string;
    aspectRatio?: string;
  }>;
}

/**
 * UNIVERSAL CONTENT RESOLVER CLASS
 */
export class UniversalContentResolver {
  /**
   * Clears internal cache
   */
  public clearCache(): void {
    resolverCache.clear();
  }

  /**
   * 1. Fetches Root Discovery Index (content-manifest.json)
   */
  public async getRootManifest(): Promise<UniversalContentRootManifest | null> {
    return fetchWithFallback<UniversalContentRootManifest>('content-manifest.json');
  }

  /**
   * 2. Fetches and sanitizes Pilot Gallery Manifest
   * Supports:
   * - R3 UniversalGalleryManifest (with artworks as array of UniversalArtworkManifestItem)
   * - Fallback to files.json inventory if needed
   * - Deduplication by assetId and path
   * - Preserves 4 V1 core references for Marcus / Victor / Eric
   */
  public async getPilotGallery(pilotId: string): Promise<ResolvedPilotGallery | null> {
    const cleanId = pilotId.toLowerCase().trim();
    if (!isCanonicalPilotId(cleanId)) {
      return null;
    }

    const cdnBase = getEffectiveCdnBaseUrl();
    const gallerySubPath = `images/pilots/${cleanId}/gallery.json`;
    const filesSubPath = `images/pilots/${cleanId}/files.json`;

    // Fetch gallery.json and optional files.json in parallel
    const [rawGallery, rawFiles] = await Promise.all([
      fetchWithFallback<any>(gallerySubPath),
      fetchWithFallback<any>(filesSubPath),
    ]);

    if (!rawGallery && !rawFiles) {
      return null;
    }

    const pilotName =
      rawGallery?.pilotName ||
      rawFiles?.pilotId ||
      cleanId.charAt(0).toUpperCase() + cleanId.slice(1);

    const coreMapping = rawGallery?.coreMapping || {};
    const rawArtworksList: any[] = [];

    // Extract raw artworks from gallery.json (array in R3, dictionary in R2)
    if (Array.isArray(rawGallery?.artworks)) {
      rawArtworksList.push(...rawGallery.artworks);
    } else if (rawGallery?.artworks && typeof rawGallery.artworks === 'object') {
      for (const [fn, val] of Object.entries(rawGallery.artworks)) {
        rawArtworksList.push({ filename: fn, ...(val as object) });
      }
    }

    // If files.json has entries not in gallery, augment them
    const filesList = Array.isArray(rawFiles?.files) ? rawFiles.files : Object.values(rawFiles?.files || {});
    for (const fileItem of filesList) {
      const fn = fileItem.filename || fileItem.path?.split('/').pop();
      if (fn && !rawArtworksList.some((a) => a.filename === fn || a.assetId === fn.replace(/\.webp$/i, ''))) {
        rawArtworksList.push({
          filename: fn,
          assetId: fn.replace(/\.webp$/i, ''),
          path: `images/pilots/${cleanId}/${fn}`,
          role: fileItem.role || 'other',
          category: 'base',
          title: `${pilotName} — ${fn.replace(/\.webp$/i, '').replace(/-/g, ' ')}`,
          byteSize: fileItem.byteSize || 0,
          sha256: fileItem.sha256 || '',
          width: fileItem.dimensions?.width,
          height: fileItem.dimensions?.height,
          status: 'approved',
        });
      }
    }

    // Deduplicate and resolve URLs
    const seenIds = new Set<string>();
    const seenPaths = new Set<string>();
    const resolvedArtworks: ResolvedGalleryArtwork[] = [];

    for (const item of rawArtworksList) {
      if (item.status && item.status !== 'approved') {
        continue; // Gatekeeper: skip unapproved items
      }

      const assetId = item.assetId || item.id || item.filename?.replace(/\.webp$/i, '') || `art-${resolvedArtworks.length}`;
      if (seenIds.has(assetId)) {
        continue;
      }

      let relativePath = item.path || `images/pilots/${cleanId}/${item.filename}`;
      if (relativePath.startsWith('/')) relativePath = relativePath.slice(1);

      if (seenPaths.has(relativePath)) {
        continue;
      }

      seenIds.add(assetId);
      seenPaths.add(relativePath);

      const title = item.title || item.label || `${pilotName} — ${assetId.replace(/-/g, ' ')}`;
      const description =
        item.curatedDescription ||
        item.description ||
        `Tác phẩm WebP HD tối ưu (${item.width || 1122}×${item.height || 1402}px, ${((Number(item.byteSize) || 0) / 1024).toFixed(0)} KB)`;

      const fullUrl = resolveImageUrl(relativePath, { cdnBaseUrl: cdnBase });

      resolvedArtworks.push({
        assetId,
        filename: item.filename || path.basename(relativePath),
        path: relativePath,
        fullUrl,
        role: item.role || 'artwork',
        category: item.category || 'core',
        title,
        description,
        curatedDescription: item.curatedDescription,
        width: item.width,
        height: item.height,
        aspectRatio: item.aspectRatio || (item.width && item.height ? `${item.width}:${item.height}` : undefined),
        byteSize: item.byteSize || 0,
        sha256: item.sha256,
        isAvailableOnDisk: true,
        status: 'verified_webp',
      });
    }

    return {
      pilotId: cleanId,
      pilotName,
      totalAssets: resolvedArtworks.length,
      approvedAssetsCount: resolvedArtworks.length,
      coreMapping,
      artworks: resolvedArtworks,
    };
  }

  /**
   * 3. Fetches and sanitizes Pilot Story Catalog (Chapters 01–07)
   */
  public async getPilotStoryCatalog(pilotId: string): Promise<ResolvedPilotStoryCatalog | null> {
    const cleanId = pilotId.toLowerCase().trim();
    if (!isCanonicalPilotId(cleanId)) {
      return null;
    }

    const storySubPath = `stories/pilots/${cleanId}/manifest.json`;
    const manifest = await fetchWithFallback<UniversalPilotStoryManifest>(storySubPath);

    if (!manifest || !Array.isArray(manifest.chapters)) {
      return null;
    }

    const chapters: ResolvedChapterItem[] = manifest.chapters.map((ch: any) => {
      const hasContentFile = Boolean(ch.file && ch.file.trim().length > 0);
      const isPublished = ch.publicationStatus === 'PUBLISHED';
      const isFullProse = ch.contentStatus === 'FULL_PROSE';
      const isAvailable = hasContentFile && isPublished && isFullProse;

      return {
        chapterId: ch.chapterId,
        chapterNumber: ch.chapterNumber,
        title: ch.title || `Chương ${String(ch.chapterNumber).padStart(2, '0')}`,
        canonicalLibraryTitle: ch.canonicalLibraryTitle,
        summary:
          ch.summary ||
          `Hồ sơ biên niên sử không gian của phi công cho Chương ${ch.chapterNumber} đang được đội ngũ biên tập hoàn thiện.`,
        quote: ch.quote,
        editorialStatus: ch.editorialStatus || 'NOT_STARTED',
        contentStatus: ch.contentStatus || 'MISSING',
        publicationStatus: ch.publicationStatus || 'NOT_PUBLISHED',
        contentAvailable: isAvailable,
        isComingSoon: !isAvailable,
        readingTimeMinutes: ch.readingTimeMinutes || 5,
        wordCount: ch.wordCount || 0,
        file: ch.file,
        sceneAnchorsCount: Array.isArray(ch.sceneAnchors) ? ch.sceneAnchors.length : 0,
      };
    });

    return {
      pilotId: cleanId,
      pilotName: manifest.pilotName || cleanId,
      callsign: manifest.callsign || '',
      totalChapters: chapters.length,
      publishedChaptersCount: chapters.filter((c) => c.contentAvailable).length,
      chapters,
    };
  }

  /**
   * 4. Fetches Story Chapter Prose & Scene Anchors
   * Only returns full content if published or in valid review mode.
   * If unwritten, returns graceful isComingSoon representation without error.
   */
  public async getStoryChapterProse(
    pilotId: string,
    chapterId: string,
    isAdminOrReview: boolean = false
  ): Promise<ResolvedStoryChapterProse | null> {
    const cleanId = pilotId.toLowerCase().trim();
    const cleanChapId = chapterId.toLowerCase().trim();

    if (!isCanonicalPilotId(cleanId)) {
      return null;
    }

    // 1. Check pilot story manifest first to verify chapter existence
    const catalog = await this.getPilotStoryCatalog(cleanId);
    const normalizedTarget = cleanChapId.replace(/^chapter-/, 'chap-');
    const chapterMeta = catalog?.chapters.find(
      (c) =>
        c.chapterId === cleanChapId ||
        c.chapterId === normalizedTarget ||
        `chap-${String(c.chapterNumber).padStart(2, '0')}` === normalizedTarget ||
        `chapter-${String(c.chapterNumber).padStart(2, '0')}` === cleanChapId
    );

    // If chapter is an unwritten / in-development chapter
    if (!chapterMeta || !chapterMeta.contentAvailable || !chapterMeta.file) {
      if (chapterMeta) {
        return {
          success: true,
          isComingSoon: true,
          pilotId: cleanId,
          chapterId: chapterMeta.chapterId,
          meta: {
            chapterId: chapterMeta.chapterId,
            chapterNumber: chapterMeta.chapterNumber,
            title: chapterMeta.title,
            canonicalLibraryTitle: chapterMeta.canonicalLibraryTitle,
            editorialStatus: chapterMeta.editorialStatus as any,
            contentStatus: chapterMeta.contentStatus as any,
            publicationStatus: chapterMeta.publicationStatus as any,
            summary: chapterMeta.summary,
            quote: chapterMeta.quote,
            readingTimeMinutes: chapterMeta.readingTimeMinutes,
            wordCount: chapterMeta.wordCount,
          },
          content: '',
          blocks: [],
          sceneAnchors: [],
        };
      }
      return null;
    }

    // 2. Fetch chapter content JSON file
    const contentSubPath = `stories/pilots/${cleanId}/${chapterMeta.file}`;
    let chapterContent = await fetchWithFallback<UniversalStoryChapterContent>(contentSubPath);

    // Local fallback for Valentine chapter 01 if needed
    if (!chapterContent && cleanId === 'valentine' && (cleanChapId === 'chap-01' || cleanChapId === 'chapter-01')) {
      try {
        const localVal = path.join(process.cwd(), 'stories', 'valentine', 'chapter-01.json');
        if (fs.existsSync(localVal)) {
          chapterContent = JSON.parse(fs.readFileSync(localVal, 'utf-8'));
        }
      } catch {
        // Continue
      }
    }

    if (!chapterContent) {
      return null;
    }

    // Gatekeeper: only allow if published or admin/review
    const isPublished = chapterContent.publicationStatus === 'PUBLISHED';
    if (!isPublished && !isAdminOrReview) {
      return null; // Denied by gatekeeper
    }

    // Build prose text from blocks
    const blocks: StoryBlock[] = Array.isArray(chapterContent.blocks) ? chapterContent.blocks : [];
    const proseParagraphs: string[] = [];
    const sceneAnchors: ResolvedStoryChapterProse['sceneAnchors'] = [];

    const cdnBase = getEffectiveCdnBaseUrl();

    for (const b of blocks) {
      if (b.type === 'paragraph' && b.text) {
        proseParagraphs.push(b.text);
      } else if (b.type === 'dialogue' && b.text) {
        const speaker = b.speaker ? `${b.speaker}: ` : '';
        proseParagraphs.push(`“${speaker}${b.text}”`);
      } else if (b.type === 'heading' && b.text) {
        proseParagraphs.push(`### ${b.text}`);
      } else if (b.type === 'scene') {
        const anchorId = b.sceneId || b.anchorId || `scene-${sceneAnchors.length + 1}`;
        let primaryArtUrl: string | undefined = undefined;
        let primaryAssetId: string | undefined = undefined;

        if (Array.isArray(b.artworks) && b.artworks.length > 0) {
          primaryAssetId = b.artworks[0].assetId;
          primaryArtUrl = resolveImageUrl(`images/pilots/${cleanId}/${primaryAssetId}.webp`, { cdnBaseUrl: cdnBase });
        }

        sceneAnchors.push({
          anchorId,
          title: b.sceneTitle || b.caption || 'Minh Họa Phân Cảnh',
          caption: b.caption,
          artworkUrl: primaryArtUrl,
          assetId: primaryAssetId,
        });
      }
    }

    const fullProseText = proseParagraphs.join('\n\n');

    return {
      success: true,
      isComingSoon: false,
      pilotId: cleanId,
      chapterId: chapterMeta.chapterId,
      meta: {
        chapterId: chapterMeta.chapterId,
        chapterNumber: chapterMeta.chapterNumber,
        title: chapterContent.title || chapterMeta.title,
        editorialStatus: chapterContent.editorialStatus,
        contentStatus: chapterContent.contentStatus,
        publicationStatus: chapterContent.publicationStatus,
        summary: chapterMeta.summary,
        quote: chapterContent.quote || chapterMeta.quote,
        readingTimeMinutes: chapterContent.readingTimeMinutes || chapterMeta.readingTimeMinutes,
        wordCount: chapterContent.wordCount || chapterMeta.wordCount,
        file: chapterMeta.file,
      },
      content: fullProseText,
      blocks,
      sceneAnchors,
    };
  }
}

// Global default singleton instance
export const universalContentResolver = new UniversalContentResolver();
