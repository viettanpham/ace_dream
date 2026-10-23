/**
 * STARFRONT WORLD V2 — RUNTIME ASSET CONFIGURATION FOUNDATION (WEB-01.3.A.1)
 *
 * Implements:
 * 1. Typed, versioned Runtime Asset Configuration Schema.
 * 2. Strict validation & sanitization (anti-injection, whitelisted providers).
 * 3. Public runtime projection (sanitized, zero secret/internal leaks).
 * 4. Pluggable AssetConfigStore interface (FileAssetConfigStore / Future DatabaseStore).
 * 5. Safe, read-only server-side bootstrapping with default r1 fallback.
 */

export type AssetProvider = 'jsdelivr' | 'cloudflare_r2' | 'custom' | 'local';

export interface RuntimeAssetConfig {
  schemaVersion: number;
  revision: number;
  provider: AssetProvider;
  repository: string;
  assetRoot: string;
  activeVersion: string;
  cdnBaseUrl: string;
  previousVersion: string | null;
  previousCdnBaseUrl?: string | null;
  updatedAt: string | null;
  updatedBy?: string | null;
  comment?: string | null;
  manifestMetadata?: {
    totalAssets?: number;
    manifestSha256?: string;
    validatedAt?: string;
  } | null;
}

export interface PublicRuntimeAssetConfig {
  schemaVersion: number;
  revision: number;
  provider: AssetProvider;
  repository: string;
  assetRoot: string;
  activeVersion: string;
  cdnBaseUrl: string;
  previousVersion: string | null;
  updatedAt: string | null;
  totalAssets?: number;
}

export type StorageStatusCode = 'READY' | 'READ_ONLY' | 'PERSISTENCE_NOT_CONFIGURED';

export interface StorageStatus {
  durable: boolean;
  type: 'file' | 'in-memory' | 'database';
  path?: string;
  writable: boolean;
  code: StorageStatusCode;
  message?: string;
}

export const CANONICAL_REPOSITORY = 'viettanpham/starfront-assets';
export const CANONICAL_ASSET_ROOT = 'starfront-world-assets';
export const CANONICAL_ACTIVE_VERSION = 'v2.0-assets-r1';

export const DEFAULT_RUNTIME_ASSET_CONFIG: RuntimeAssetConfig = {
  schemaVersion: 1,
  revision: 1,
  provider: 'jsdelivr',
  repository: CANONICAL_REPOSITORY,
  assetRoot: CANONICAL_ASSET_ROOT,
  activeVersion: CANONICAL_ACTIVE_VERSION,
  cdnBaseUrl: `https://cdn.jsdelivr.net/gh/${CANONICAL_REPOSITORY}@${CANONICAL_ACTIVE_VERSION}/${CANONICAL_ASSET_ROOT}`,
  previousVersion: null,
  previousCdnBaseUrl: null,
  updatedAt: '2026-10-22T20:25:00.000Z',
  updatedBy: 'system_bootstrap',
  comment: 'Default verified production release r1 (26 core WebP assets)',
  manifestMetadata: {
    totalAssets: 26,
    validatedAt: '2026-10-22T20:25:00.000Z',
  },
};

export const DEFAULT_PUBLIC_ASSET_CONFIG: PublicRuntimeAssetConfig = {
  schemaVersion: 1,
  revision: 1,
  provider: 'jsdelivr',
  repository: CANONICAL_REPOSITORY,
  assetRoot: CANONICAL_ASSET_ROOT,
  activeVersion: CANONICAL_ACTIVE_VERSION,
  cdnBaseUrl: `https://cdn.jsdelivr.net/gh/${CANONICAL_REPOSITORY}@${CANONICAL_ACTIVE_VERSION}/${CANONICAL_ASSET_ROOT}`,
  previousVersion: null,
  updatedAt: '2026-10-22T20:25:00.000Z',
  totalAssets: 26,
};

/**
 * Validates a Git tag or version identifier.
 * Matches formats such as: v2.0-assets-r1, v1.0, v2.0.1-beta.2
 * Disallows path traversal sequences (.., /, \) and command characters.
 */
export const VERSION_TAG_REGEX = /^v[0-9]+(\.[0-9]+)*(-[a-zA-Z0-9_.-]+)?$/;

/**
 * Validates repository name format: owner/repo
 */
export const REPOSITORY_REGEX = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;

/**
 * Validates assetRoot subdirectory: letters, digits, dashes, underscores
 */
export const ASSET_ROOT_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * Computes deterministic CDN Base URL based on provider and parameters.
 * Prevents arbitrary injection of unvalidated CDN hostnames.
 */
export function computeCdnBaseUrl(
  provider: AssetProvider,
  repository: string,
  activeVersion: string,
  assetRoot: string
): string {
  if (provider === 'local') {
    return '';
  }

  if (provider === 'jsdelivr') {
    return `https://cdn.jsdelivr.net/gh/${repository}@${activeVersion}/${assetRoot}`;
  }

  if (provider === 'cloudflare_r2') {
    const customBase = process.env.NEXT_PUBLIC_R2_ASSET_CDN_URL?.trim();
    if (customBase) {
      return customBase.endsWith('/') ? customBase.slice(0, -1) : customBase;
    }
    return `https://assets.starfrontworld.com/${activeVersion}/${assetRoot}`;
  }

  // Custom provider fallback
  const customBase = process.env.NEXT_PUBLIC_ASSET_CDN_URL?.trim();
  return customBase || `https://cdn.jsdelivr.net/gh/${repository}@${activeVersion}/${assetRoot}`;
}

/**
 * Validates and sanitizes a candidate runtime asset config object.
 */
export function validateRuntimeAssetConfig(data: unknown): {
  valid: boolean;
  config?: RuntimeAssetConfig;
  error?: string;
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Config payload must be a non-null object' };
  }

  const candidate = data as Partial<RuntimeAssetConfig>;

  if (
    typeof candidate.schemaVersion !== 'number' ||
    candidate.schemaVersion < 1 ||
    !Number.isInteger(candidate.schemaVersion)
  ) {
    return { valid: false, error: 'schemaVersion must be a positive integer >= 1' };
  }

  if (
    typeof candidate.revision !== 'number' ||
    candidate.revision < 0 ||
    !Number.isInteger(candidate.revision)
  ) {
    return { valid: false, error: 'revision must be a non-negative integer' };
  }

  const validProviders: AssetProvider[] = ['jsdelivr', 'cloudflare_r2', 'custom', 'local'];
  if (!candidate.provider || !validProviders.includes(candidate.provider)) {
    return {
      valid: false,
      error: `provider must be one of: ${validProviders.join(', ')}`,
    };
  }

  if (!candidate.repository || typeof candidate.repository !== 'string' || !REPOSITORY_REGEX.test(candidate.repository)) {
    return { valid: false, error: 'repository must be in format owner/repo' };
  }

  if (!candidate.assetRoot || typeof candidate.assetRoot !== 'string' || !ASSET_ROOT_REGEX.test(candidate.assetRoot)) {
    return { valid: false, error: 'assetRoot must be an alphanumeric directory name without slashes' };
  }

  if (!candidate.activeVersion || typeof candidate.activeVersion !== 'string' || !VERSION_TAG_REGEX.test(candidate.activeVersion)) {
    return { valid: false, error: `activeVersion must match tag pattern ${VERSION_TAG_REGEX.source}` };
  }

  if (candidate.previousVersion !== null && candidate.previousVersion !== undefined) {
    if (typeof candidate.previousVersion !== 'string' || !VERSION_TAG_REGEX.test(candidate.previousVersion)) {
      return { valid: false, error: 'previousVersion must be null or match valid tag pattern' };
    }
  }

  const cdnBaseUrl = computeCdnBaseUrl(
    candidate.provider,
    candidate.repository,
    candidate.activeVersion,
    candidate.assetRoot
  );

  const sanitized: RuntimeAssetConfig = {
    schemaVersion: candidate.schemaVersion,
    revision: candidate.revision,
    provider: candidate.provider,
    repository: candidate.repository,
    assetRoot: candidate.assetRoot,
    activeVersion: candidate.activeVersion,
    cdnBaseUrl,
    previousVersion: candidate.previousVersion || null,
    previousCdnBaseUrl: candidate.previousCdnBaseUrl || null,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : null,
    updatedBy: typeof candidate.updatedBy === 'string' ? candidate.updatedBy : undefined,
    comment: typeof candidate.comment === 'string' ? candidate.comment : undefined,
    manifestMetadata: candidate.manifestMetadata && typeof candidate.manifestMetadata === 'object'
      ? {
          totalAssets: typeof candidate.manifestMetadata.totalAssets === 'number' ? candidate.manifestMetadata.totalAssets : undefined,
          manifestSha256: typeof candidate.manifestMetadata.manifestSha256 === 'string' ? candidate.manifestMetadata.manifestSha256 : undefined,
          validatedAt: typeof candidate.manifestMetadata.validatedAt === 'string' ? candidate.manifestMetadata.validatedAt : undefined,
        }
      : null,
  };

  return { valid: true, config: sanitized };
}

/**
 * Projects a full internal RuntimeAssetConfig into a public safe representation.
 * Strips admin identity (updatedBy), comments, and private security metadata.
 */
export function toPublicAssetConfig(config: RuntimeAssetConfig): PublicRuntimeAssetConfig {
  return {
    schemaVersion: config.schemaVersion,
    revision: config.revision,
    provider: config.provider,
    repository: config.repository,
    assetRoot: config.assetRoot,
    activeVersion: config.activeVersion,
    cdnBaseUrl: config.cdnBaseUrl,
    previousVersion: config.previousVersion,
    updatedAt: config.updatedAt,
    totalAssets: config.manifestMetadata?.totalAssets ?? 26,
  };
}

/**
 * Pluggable Storage Abstraction for Runtime Configuration.
 * Decouples the application from a single JSON file and allows future
 * integration with Cloud SQL, Supabase, Redis, or Cloudflare KV.
 */
export interface AssetConfigStore {
  getConfig(): Promise<RuntimeAssetConfig>;
  getConfigSync(): RuntimeAssetConfig;
  getStorageStatus(): StorageStatus;
  // Prepared contract for future mutation in Subphase A.4:
  saveConfig?(
    config: RuntimeAssetConfig,
    expectedRevision?: number
  ): Promise<{ success: boolean; newRevision?: number; error?: string }>;
}

/**
 * FileAssetConfigStore:
 * Local / Standalone Node.js filesystem persistence engine.
 * Reads `.starfront-config/runtime-asset-config.json` with safe r1 fallback.
 * Strictly guarantees read operations (getConfig/getConfigSync) perform NO file mutations.
 */
export class FileAssetConfigStore implements AssetConfigStore {
  private configPath: string;
  private memoryCache: RuntimeAssetConfig | null = null;
  private isServerEnvironment: boolean;

  constructor(customPath?: string) {
    this.isServerEnvironment = typeof window === 'undefined';
    if (customPath) {
      this.configPath = customPath;
    } else if (this.isServerEnvironment) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const path = require('path');
        this.configPath = path.join(process.cwd(), '.starfront-config', 'runtime-asset-config.json');
      } catch {
        this.configPath = '.starfront-config/runtime-asset-config.json';
      }
    } else {
      this.configPath = '.starfront-config/runtime-asset-config.json';
    }
  }

  public getConfigSync(): RuntimeAssetConfig {
    if (this.memoryCache) {
      return this.memoryCache;
    }

    if (!this.isServerEnvironment) {
      return DEFAULT_RUNTIME_ASSET_CONFIG;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8');
        const parsed = JSON.parse(raw);
        const check = validateRuntimeAssetConfig(parsed);
        if (check.valid && check.config) {
          this.memoryCache = check.config;
          return check.config;
        }
      }
    } catch (err) {
      // Silent fallback to default, never throw during sync SSR
      console.warn('[STARFRONT AssetConfigStore] Could not read config file, using fallback r1:', err instanceof Error ? err.message : err);
    }

    this.memoryCache = DEFAULT_RUNTIME_ASSET_CONFIG;
    return DEFAULT_RUNTIME_ASSET_CONFIG;
  }

  public async getConfig(): Promise<RuntimeAssetConfig> {
    return this.getConfigSync();
  }

  public getStorageStatus(): StorageStatus {
    if (!this.isServerEnvironment) {
      return {
        durable: false,
        type: 'in-memory',
        path: this.configPath,
        writable: false,
        code: 'PERSISTENCE_NOT_CONFIGURED',
        message: 'Client/browser environment does not possess direct filesystem persistence.',
      };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path');
      const dir = path.dirname(this.configPath);

      const dirExists = fs.existsSync(dir);
      const fileExists = fs.existsSync(this.configPath);

      return {
        durable: true,
        type: 'file',
        path: this.configPath,
        writable: true,
        code: 'READY',
        message: fileExists
          ? `Active persistent configuration verified at ${this.configPath}`
          : dirExists
            ? `Configuration directory available at ${dir}`
            : 'Configuration storage directory will be initialized upon first mutation.',
      };
    } catch (err) {
      return {
        durable: false,
        type: 'file',
        path: this.configPath,
        writable: false,
        code: 'PERSISTENCE_NOT_CONFIGURED',
        message: `Persistent filesystem access error: ${err instanceof Error ? err.message : 'Unknown'}`,
      };
    }
  }

  public async saveConfig(
    candidateConfig: RuntimeAssetConfig,
    expectedRevision?: number
  ): Promise<{ success: boolean; newRevision?: number; error?: string }> {
    if (!this.isServerEnvironment) {
      return { success: false, error: 'Cannot write config from client environment.' };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path');

      const current = this.getConfigSync();

      // Optimistic concurrency check
      if (expectedRevision !== undefined && current.revision !== expectedRevision) {
        return {
          success: false,
          error: `CONCURRENCY_CONFLICT: Cấu hình đã bị thay đổi (revision hiện tại: ${current.revision}, revision kỳ vọng: ${expectedRevision}). Vui lòng tải lại trang.`,
        };
      }

      const nextRevision = (current.revision || 0) + 1;
      const updatedConfig: RuntimeAssetConfig = {
        ...candidateConfig,
        revision: nextRevision,
        updatedAt: new Date().toISOString(),
      };

      const validated = validateRuntimeAssetConfig(updatedConfig);
      if (!validated.valid || !validated.config) {
        return { success: false, error: validated.error || 'Cấu hình không hợp lệ.' };
      }

      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Atomic write: write to temp file then rename
      const tmpPath = `${this.configPath}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(validated.config, null, 2), 'utf-8');
      fs.renameSync(tmpPath, this.configPath);

      // Invalidate memory cache and set new
      this.memoryCache = validated.config;

      return { success: true, newRevision: nextRevision };
    } catch (err) {
      return {
        success: false,
        error: `Lỗi ghi tệp cấu hình: ${err instanceof Error ? err.message : 'Unknown'}`,
      };
    }
  }

  /**
   * Clears internal in-memory cache (for testing or external file updates)
   */
  public clearMemoryCache(): void {
    this.memoryCache = null;
  }
}

// Global default singleton instance for server runtime
export const assetConfigStore: AssetConfigStore = new FileAssetConfigStore();

export interface AuditLogEntry {
  timestamp: string;
  action: 'ACTIVATE' | 'ROLLBACK';
  adminUser: string;
  previousVersion: string | null;
  activeVersion: string;
  revision: number;
  clientIp?: string;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
  comment?: string;
}

const AUDIT_LOG_FILE = (function () {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    return path.join(process.cwd(), '.starfront-config', 'asset-version-audit.log');
  } catch {
    return '.starfront-config/asset-version-audit.log';
  }
})();

export function appendAuditLog(entry: AuditLogEntry): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    const dir = path.dirname(AUDIT_LOG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(AUDIT_LOG_FILE, JSON.stringify(entry) + '\n', 'utf-8');
  } catch (err) {
    console.warn('[Audit Log] Failed to append entry:', err instanceof Error ? err.message : err);
  }
}

export function getRecentAuditLogs(limit = 20): AuditLogEntry[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    if (!fs.existsSync(AUDIT_LOG_FILE)) return [];
    const content = fs.readFileSync(AUDIT_LOG_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const parsed: AuditLogEntry[] = [];
    for (let i = lines.length - 1; i >= 0 && parsed.length < limit; i--) {
      try {
        parsed.push(JSON.parse(lines[i]));
      } catch {
        // Skip corrupted line
      }
    }
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Helper for Server Components (e.g. app/layout.tsx).
 * Retrieves static initial config for SSR with guaranteed hydration match.
 */
export function getStaticServerAssetConfig(): PublicRuntimeAssetConfig {
  try {
    const config = assetConfigStore.getConfigSync();
    return toPublicAssetConfig(config);
  } catch {
    return DEFAULT_PUBLIC_ASSET_CONFIG;
  }
}
