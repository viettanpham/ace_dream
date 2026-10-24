/**
 * STARFRONT WORLD V2 — ASSET IMAGE RESOLVER (WEB-01.3)
 * Centralized, non-intrusive URL resolver for runtime image delivery.
 * Supports Local filesystem, jsDelivr CDN, and future Cloudflare R2 / Custom CDN.
 */

export type AssetStorageMode = 'local' | 'jsdelivr' | 'r2' | 'custom';

export interface ImageResolverConfig {
  mode: AssetStorageMode;
  cdnBaseUrl: string;
}

/**
 * Official default CDN Base URL confirmed by the project owner (WEB-01.3):
 * Repository: viettanpham/starfront-assets
 * Release Tag: v2.0-assets-r1
 * Subdirectory: starfront-world-assets
 */
export const DEFAULT_JSDELIVR_CDN_BASE =
  'https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r1/starfront-world-assets';

/**
 * Returns current configuration from environment variables or safe defaults.
 */
export function getResolverConfig(): ImageResolverConfig {
  const envMode = process.env.NEXT_PUBLIC_ASSET_STORAGE_MODE?.toLowerCase().trim();
  const validModes: AssetStorageMode[] = ['local', 'jsdelivr', 'r2', 'custom'];
  const mode: AssetStorageMode = validModes.includes(envMode as AssetStorageMode)
    ? (envMode as AssetStorageMode)
    : 'jsdelivr';

  const cdnBaseUrl =
    process.env.NEXT_PUBLIC_ASSET_CDN_URL?.trim() || DEFAULT_JSDELIVR_CDN_BASE;

  return { mode, cdnBaseUrl };
}

/**
 * Checks if the current configuration is actively using a remote CDN.
 */
export function isCdnEnabled(): boolean {
  const { mode, cdnBaseUrl } = getResolverConfig();
  return mode !== 'local' && Boolean(cdnBaseUrl);
}

/**
 * Resolves a game asset image path to either a local public URL or a remote CDN URL.
 * 
 * Rules:
 * 1. Empty/null/undefined paths return "" (allowing calling components to render context-specific placeholders).
 * 2. Absolute URLs (http/https/data/blob) are returned unchanged.
 * 3. Assets outside images (e.g. /icon.svg) are returned as local absolute paths.
 * 4. Image paths (/images/... or images/...) are normalized and prepended with CDN base in CDN mode,
 *    or returned as local /images/... in local mode.
 * 5. Does not modify underlying data models or save files.
 */
export function resolveImageUrl(
  rawPath?: string | null,
  overrideConfig?: Partial<ImageResolverConfig>
): string {
  if (!rawPath || typeof rawPath !== 'string') {
    return '';
  }

  const trimmed = rawPath.trim();
  if (!trimmed) {
    return '';
  }

  // Preserve absolute network and data URLs
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Preserve assets outside /images/ (e.g. /icon.svg, /favicon.ico)
  const isImageSubdir =
    trimmed.startsWith('/images/') ||
    trimmed.startsWith('images/') ||
    trimmed === '/images' ||
    trimmed === 'images';

  if (!isImageSubdir) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

const CANONICAL_R1_PATHS = new Set([
  'images/aegis-gear.webp',
  'images/falcon-gear.webp',
  'images/vanguard-gear.webp',
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
  'images/valentine-activity-001.webp',
  'images/valentine-casual.webp',
  'images/valentine-closeup.webp',
  'images/valentine-combat.webp',
  'images/valentine-event-001.webp',
  'images/valentine-story-001.webp',
  'images/valentine-uniform-001.webp',
]);

  // Normalize path without leading slash
  let cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;

  const clientConfig = typeof window !== 'undefined' ? clientActiveRuntimeConfig : null;
  const config = {
    ...getResolverConfig(),
    ...(clientConfig || {}),
    ...overrideConfig,
  };

  // Local mode fallback
  if (config.mode === 'local' || !config.cdnBaseUrl) {
    return `/${cleanPath}`;
  }

  // If remote CDN is on v2.0-assets-r1 (legacy release where images/pilots/ did not exist),
  // fallback to the pilot's own legacy asset in images/ when available (never substitute another pilot)
  if (config.cdnBaseUrl.includes('@v2.0-assets-r1') && cleanPath.startsWith('images/pilots/')) {
    const parts = cleanPath.split('/');
    if (parts.length >= 4) {
      const filename = parts[3];
      const legacyPath = `images/${filename}`;
      if (CANONICAL_R1_PATHS.has(legacyPath)) {
        cleanPath = legacyPath;
      }
    }
  }

  // Remote CDN mode: strip any trailing slash from base URL
  const normalizedBase = config.cdnBaseUrl.endsWith('/')
    ? config.cdnBaseUrl.slice(0, -1)
    : config.cdnBaseUrl;

  return `${normalizedBase}/${cleanPath}`;
}

let clientActiveRuntimeConfig: {
  mode: AssetStorageMode;
  cdnBaseUrl: string;
} | null = null;

/**
 * Sets the active runtime configuration for all client-side image resolutions.
 * Strictly active in browser environments only — never leaks between SSR requests.
 */
export function setClientActiveRuntimeConfig(
  config: {
    provider?: string;
    cdnBaseUrl?: string;
  } | null
): void {
  if (typeof window === 'undefined') return;
  if (!config || !config.cdnBaseUrl) {
    clientActiveRuntimeConfig = null;
    return;
  }

  const mode: AssetStorageMode =
    config.provider === 'local'
      ? 'local'
      : config.provider === 'cloudflare_r2'
        ? 'r2'
        : 'jsdelivr';

  clientActiveRuntimeConfig = {
    mode,
    cdnBaseUrl: config.cdnBaseUrl,
  };
}

/**
 * Resolves an image path using a specific PublicRuntimeAssetConfig or RuntimeAssetConfig.
 * Ensures effortless integration with React Context and AdminCP Preview Sandboxes.
 */
export function resolveImageUrlWithConfig(
  rawPath?: string | null,
  runtimeConfig?: {
    provider?: string;
    cdnBaseUrl?: string;
  }
): string {
  if (!runtimeConfig) {
    return resolveImageUrl(rawPath);
  }

  const mode: AssetStorageMode =
    runtimeConfig.provider === 'local'
      ? 'local'
      : runtimeConfig.provider === 'cloudflare_r2'
        ? 'r2'
        : 'jsdelivr';

  return resolveImageUrl(rawPath, {
    mode,
    cdnBaseUrl: runtimeConfig.cdnBaseUrl,
  });
}
