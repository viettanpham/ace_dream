/**
 * STARFRONT WORLD — Population Catalog Registry Integration (Phase 6.34A-FND-4)
 *
 * Integrates population buckets, workforce categories, allocation policies,
 * capacity policies, and movement reasons with the FND-1 Catalog Registry.
 * Guarantees canonical SYSTEM default data is available out-of-the-box.
 */

import {
  CatalogRegistry,
  defaultCatalogRegistry,
} from "../catalog/registry"
import type { ICatalogDataProvider, ResolvedCatalogItem } from "../catalog/types"
import {
  SYSTEM_POPULATION_CATALOG_FILES,
} from "./seed-data"

/**
 * Pre-seeds a data provider with canonical SYSTEM population files
 */
export function seedPopulationCatalogData(provider: ICatalogDataProvider): void {
  for (const [filename, nodeFile] of Object.entries(SYSTEM_POPULATION_CATALOG_FILES)) {
    if (!provider.exists(filename)) {
      provider.writeFile(filename, JSON.stringify(nodeFile, null, 2))
    }
  }
}

/**
 * Registers population domain catalogs with a CatalogRegistry
 */
export function registerPopulationCatalogs(
  registry: CatalogRegistry = defaultCatalogRegistry,
  provider?: ICatalogDataProvider
): void {
  const targetProvider = provider || registry.getDataProvider()
  if (targetProvider) {
    seedPopulationCatalogData(targetProvider)
  }

  // 1. Population Bucket
  registry.registerCatalog({
    domain: "population",
    catalogName: "population_bucket",
  })

  // 2. Workforce Category
  registry.registerCatalog({
    domain: "population",
    catalogName: "workforce_category",
  })

  // 3. Workforce Allocation Policy
  registry.registerCatalog({
    domain: "population",
    catalogName: "workforce_allocation_policy",
  })

  // 4. Capacity Policy
  registry.registerCatalog({
    domain: "population",
    catalogName: "capacity_policy",
  })

  // 5. Movement Reason
  registry.registerCatalog({
    domain: "population",
    catalogName: "movement_reason",
  })
}

/**
 * Resolves a population bucket definition by ID from the registry
 */
export function getPopulationBucket(
  bucketId: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem | undefined {
  return registry.getItem("population", "population_bucket", bucketId)
}

/**
 * Resolves a workforce category definition by ID from the registry
 */
export function getWorkforceCategory(
  categoryId: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem | undefined {
  return registry.getItem("population", "workforce_category", categoryId)
}

/**
 * Resolves a workforce allocation policy definition by ID from the registry
 */
export function getAllocationPolicy(
  policyId: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem | undefined {
  return registry.getItem("population", "workforce_allocation_policy", policyId)
}

/**
 * Resolves a capacity policy definition by ID from the registry
 */
export function getCapacityPolicy(
  policyId: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem | undefined {
  return registry.getItem("population", "capacity_policy", policyId)
}

/**
 * Resolves a movement reason definition by ID from the registry
 */
export function getMovementReason(
  reasonId: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem | undefined {
  return registry.getItem("population", "movement_reason", reasonId)
}

// Auto-register canonical population catalogs on default registry
registerPopulationCatalogs(defaultCatalogRegistry)
