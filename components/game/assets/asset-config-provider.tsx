'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  type PublicRuntimeAssetConfig,
  DEFAULT_PUBLIC_ASSET_CONFIG,
} from '@/lib/game/assets/runtime-asset-config';
import {
  resolveImageUrlWithConfig,
  resolveImageUrl,
  setClientActiveRuntimeConfig,
} from '@/lib/game/assets/image-resolver';

export interface AssetConfigContextValue {
  config: PublicRuntimeAssetConfig;
  activeVersion: string;
  cdnBaseUrl: string;
  isLoading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
  resolveUrl: (rawPath?: string | null) => string;
}

const AssetConfigContext = createContext<AssetConfigContextValue | null>(null);

export interface AssetConfigProviderProps {
  initialConfig?: PublicRuntimeAssetConfig;
  children: ReactNode;
}

export const ASSET_CONFIG_CHANGED_EVENT = 'starfront-asset-config-changed';

/**
 * Broadcasts an asset configuration change to all listeners and triggers
 * immediate re-rendering of images across the application without a page reload.
 */
export function broadcastAssetConfigChange(newConfig?: PublicRuntimeAssetConfig): void {
  if (typeof window === 'undefined') return;
  if (newConfig) {
    setClientActiveRuntimeConfig(newConfig);
  }
  window.dispatchEvent(
    new CustomEvent(ASSET_CONFIG_CHANGED_EVENT, { detail: newConfig })
  );
}

/**
 * STARFRONT WORLD V2 — ASSET CONFIG PROVIDER (WEB-01.3.A.1 & A.5)
 *
 * Provides reactive runtime asset configuration to all game components.
 * Guarantees:
 * 1. Synchronized SSR/Client hydration via initialConfig from RootLayout.
 * 2. Zero hydration mismatch warnings.
 * 3. On-demand refresh without whole-page reloads.
 * 4. Context-aware resolveUrl() helper.
 * 5. Robust error boundary fallback to canonical r1.
 * 6. Global client-side resolver synchronization for legacy/direct callers.
 */
export function AssetConfigProvider({
  initialConfig,
  children,
}: AssetConfigProviderProps) {
  const [config, setConfig] = useState<PublicRuntimeAssetConfig>(() => {
    const initial = initialConfig || DEFAULT_PUBLIC_ASSET_CONFIG;
    if (typeof window !== 'undefined') {
      setClientActiveRuntimeConfig(initial);
    }
    return initial;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync client resolver whenever config updates
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setClientActiveRuntimeConfig(config);
    }
  }, [config]);

  const refreshConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/runtime/asset-config', {
        method: 'GET',
        headers: { credentials: 'same-origin' },
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
        setClientActiveRuntimeConfig(data.config);
      } else {
        throw new Error(data.error || 'Invalid configuration response');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to refresh asset config';
      console.warn('[AssetConfigProvider] Refresh notice:', msg);
      setError(msg);
      // Retain current config, never clear or corrupt assets
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for broadcast events from AdminCP actions
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleConfigChange = (e: Event) => {
      const customEvent = e as CustomEvent<PublicRuntimeAssetConfig | undefined>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
        setClientActiveRuntimeConfig(customEvent.detail);
      } else {
        refreshConfig();
      }
    };

    window.addEventListener(ASSET_CONFIG_CHANGED_EVENT, handleConfigChange);

    // Revalidate on focus and visibility change (cross-tab / cross-browser sync)
    const handleRevalidate = () => {
      if (document.visibilityState === 'visible') {
        refreshConfig();
      }
    };

    window.addEventListener('focus', handleRevalidate);
    document.addEventListener('visibilitychange', handleRevalidate);

    // Periodic 60s lightweight polling
    const pollInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshConfig();
      }
    }, 60000);

    return () => {
      window.removeEventListener(ASSET_CONFIG_CHANGED_EVENT, handleConfigChange);
      window.removeEventListener('focus', handleRevalidate);
      document.removeEventListener('visibilitychange', handleRevalidate);
      window.clearInterval(pollInterval);
    };
  }, [refreshConfig]);

  const resolveUrl = useCallback(
    (rawPath?: string | null) => {
      return resolveImageUrlWithConfig(rawPath, config);
    },
    [config]
  );

  const contextValue = useMemo<AssetConfigContextValue>(
    () => ({
      config,
      activeVersion: config.activeVersion,
      cdnBaseUrl: config.cdnBaseUrl,
      isLoading,
      error,
      refreshConfig,
      resolveUrl,
    }),
    [config, isLoading, error, refreshConfig, resolveUrl]
  );

  return (
    <AssetConfigContext.Provider value={contextValue}>
      {children}
    </AssetConfigContext.Provider>
  );
}

/**
 * Hook to access current active asset version and dynamic image resolver.
 * Safely falls back to default canonical r1 if invoked outside AssetConfigProvider.
 */
export function useAssetConfig(): AssetConfigContextValue {
  const ctx = useContext(AssetConfigContext);
  if (!ctx) {
    return {
      config: DEFAULT_PUBLIC_ASSET_CONFIG,
      activeVersion: DEFAULT_PUBLIC_ASSET_CONFIG.activeVersion,
      cdnBaseUrl: DEFAULT_PUBLIC_ASSET_CONFIG.cdnBaseUrl,
      isLoading: false,
      error: null,
      refreshConfig: async () => {},
      resolveUrl: (rawPath?: string | null) => resolveImageUrl(rawPath),
    };
  }
  return ctx;
}
