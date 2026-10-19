/**
 * STARFRONT WORLD — Decision Catalog Registry Integration (Phase 6.34A-FND-3)
 *
 * Integrates decision metadata and policies with FND-1 Catalog Registry.
 * Guarantees canonical SYSTEM default data is available out-of-the-box.
 */

import {
  CatalogRegistry,
  defaultCatalogRegistry,
} from "../catalog/registry"
import type { ICatalogDataProvider, ResolvedCatalogItem } from "../catalog/types"
import {
  SYSTEM_DECISION_CATALOG_FILES,
} from "./seed-data"

/**
 * Pre-seeds a data provider with canonical SYSTEM decision files
 */
export function seedDecisionCatalogData(provider: ICatalogDataProvider): void {
  for (const [filename, nodeFile] of Object.entries(SYSTEM_DECISION_CATALOG_FILES)) {
    if (!provider.exists(filename)) {
      provider.writeFile(filename, JSON.stringify(nodeFile, null, 2))
    }
  }
}

/**
 * Registers decision domain catalogs with a CatalogRegistry
 */
export function registerDecisionCatalogs(
  registry: CatalogRegistry = defaultCatalogRegistry,
  provider?: ICatalogDataProvider
): void {
  const targetProvider = provider || registry.getDataProvider()
  if (targetProvider) {
    seedDecisionCatalogData(targetProvider)
  }

  // 1. Fallback Policy
  registry.registerCatalog({
    domain: "decision",
    catalogName: "fallback_policy",
  })

  // 2. Decision Source
  registry.registerCatalog({
    domain: "decision",
    catalogName: "decision_source",
  })

  // 3. Decision Type
  registry.registerCatalog({
    domain: "decision",
    catalogName: "decision_type",
  })

  // 4. Decision Priority
  registry.registerCatalog({
    domain: "decision",
    catalogName: "decision_priority",
  })
}

/**
 * Resolves a decision type definition by ID from the registry
 */
export function getDecisionType(
  typeId: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem | undefined {
  return registry.getItem("decision", "decision_type", typeId)
}

/**
 * Resolves a fallback policy by ID from the registry
 */
export function getFallbackPolicy(
  policyId: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem | undefined {
  return registry.getItem("decision", "fallback_policy", policyId)
}

/**
 * Resolves a decision source definition by ID from the registry
 */
export function getDecisionSource(
  sourceId: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem | undefined {
  return registry.getItem("decision", "decision_source", sourceId)
}

// Auto-register canonical decision catalogs on default registry
registerDecisionCatalogs(defaultCatalogRegistry)
