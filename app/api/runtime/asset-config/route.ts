import { NextResponse } from 'next/server';
import {
  assetConfigStore,
  toPublicAssetConfig,
  DEFAULT_PUBLIC_ASSET_CONFIG,
} from '@/lib/game/assets/runtime-asset-config';

// Force dynamic execution — never freeze as static build-time output
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * STARFRONT WORLD V2 — PUBLIC RUNTIME ASSET CONFIGURATION API (WEB-01.3.A.1)
 *
 * GET /api/runtime/asset-config
 *
 * Guarantees:
 * 1. Read-only operation — Strictly NO file writes or mutations during GET requests.
 * 2. Whitelisted public data projection — Never leaks admin passwords, keys, or private audit logs.
 * 3. Safe fallback — Always returns verified r1 configuration if storage cannot be reached.
 * 4. Cache header policy — Balanced caching for CDN/Browser with stale-while-revalidate.
 */
export async function GET() {
  try {
    const rawConfig = await assetConfigStore.getConfig();
    const publicConfig = toPublicAssetConfig(rawConfig);
    const storageStatus = assetConfigStore.getStorageStatus();

    return NextResponse.json(
      {
        success: true,
        config: publicConfig,
        storage: {
          code: storageStatus.code,
          durable: storageStatus.durable,
          type: storageStatus.type,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=5, s-maxage=10, stale-while-revalidate=30',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('[API /api/runtime/asset-config] Error reading runtime config:', error);

    // Resilient fallback to canonical r1 default
    return NextResponse.json(
      {
        success: true,
        config: DEFAULT_PUBLIC_ASSET_CONFIG,
        storage: {
          code: 'PERSISTENCE_NOT_CONFIGURED',
          durable: false,
          type: 'in-memory',
        },
        fallbackNotice: 'Served from static in-memory fallback',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
