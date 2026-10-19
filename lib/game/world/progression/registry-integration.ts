/**
 * STARFRONT WORLD — Progression Catalog Registry Integration (Phase 6.34A-FND-2)
 *
 * Integrates progression profiles and tier definitions with FND-1 Catalog Registry.
 * Guarantees canonical SYSTEM default data is available out-of-the-box.
 */

import {
  CatalogRegistry,
  defaultCatalogRegistry,
} from "../catalog/registry"
import type { ICatalogDataProvider, ResolvedCatalogItem } from "../catalog/types"
import {
  SYSTEM_PROGRESSION_CATALOG_FILES,
} from "./seed-data"
import type {
  LevelEffectProfile,
  ProgressionProfile,
  TierDefinition,
  TierEffectDefinition,
} from "./types"

/**
 * Pre-seeds a data provider with canonical SYSTEM progression files
 */
export function seedProgressionCatalogData(provider: ICatalogDataProvider): void {
  for (const [filename, nodeFile] of Object.entries(SYSTEM_PROGRESSION_CATALOG_FILES)) {
    if (!provider.exists(filename)) {
      provider.writeFile(filename, JSON.stringify(nodeFile, null, 2))
    }
  }
}

/**
 * Registers progression domain catalogs with a CatalogRegistry
 */
export function registerProgressionCatalogs(
  registry: CatalogRegistry = defaultCatalogRegistry,
  provider?: ICatalogDataProvider
): void {
  const targetProvider = provider || registry.getDataProvider()
  if (targetProvider) {
    seedProgressionCatalogData(targetProvider)
  }

  // 1. Progression Profiles
  registry.registerCatalog<ProgressionProfile>({
    domain: "progression",
    catalogName: "progression_profile",
  })

  // 2. Tier Profiles
  registry.registerCatalog<TierDefinition & { id: string }>({
    domain: "progression",
    catalogName: "tier_profile",
  })

  // 3. Level Effect Profiles
  registry.registerCatalog<LevelEffectProfile>({
    domain: "progression",
    catalogName: "level_effect_profile",
  })

  // 4. Tier Effect Profiles
  registry.registerCatalog<TierEffectDefinition>({
    domain: "progression",
    catalogName: "tier_effect_profile",
  })
}

/**
 * Resolves a progression profile by ID from the registry
 */
export function getProgressionProfile(
  profileId: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem<ProgressionProfile> | undefined {
  return registry.getItem<ProgressionProfile>("progression", "progression_profile", profileId)
}

/**
 * Resolves a tier definition by ID from the registry
 */
export function getTierDefinition(
  tierId: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem<TierDefinition & { id: string }> | undefined {
  return registry.getItem<TierDefinition & { id: string }>("progression", "tier_profile", tierId)
}

/**
 * Resolves a level effect profile by ID from the registry
 */
export function getLevelEffectProfile(
  profileId: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem<LevelEffectProfile> | undefined {
  return registry.getItem<LevelEffectProfile>("progression", "level_effect_profile", profileId)
}

/**
 * Resolves all tier breakthrough effects from the registry
 */
export function getAllTierEffects(
  registry: CatalogRegistry = defaultCatalogRegistry
): Array<ResolvedCatalogItem<TierEffectDefinition>> {
  return registry.getResolvedItems<TierEffectDefinition>("progression", "tier_effect_profile")
}

// Auto-register canonical catalogs on default registry
registerProgressionCatalogs(defaultCatalogRegistry)

