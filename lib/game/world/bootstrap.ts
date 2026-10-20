/**
 * STARFRONT WORLD — Centralized Catalog & Foundation Bootstrap (Phase 6.34A-FND-5)
 *
 * Implements a unified, idempotent entry point to seed, register, and warm up
 * all canonical SYSTEM catalogs across all foundations:
 * - FND-1: Catalog Registry & Master Data
 * - FND-2: Progression & Tier Profiles
 * - FND-3: Decision Types, Sources, & Policies
 * - FND-4: Population Buckets, Workforce & Capacity Policies
 * - FND-5: Building Types, Classes, Definitions, Slots, Modules, Recipes
 */

import { CatalogRegistry, defaultCatalogRegistry } from "./catalog/registry"
import type { ICatalogDataProvider } from "./catalog/types"
import { registerProgressionCatalogs } from "./progression/registry-integration"
import { registerDecisionCatalogs } from "./decision/registry-integration"
import { registerPopulationCatalogs } from "./population/registry-integration"
import { registerBuildingCatalogs } from "./building/registry-integration"
import { registerBaseCatalogs } from "./base/registry-integration"

let isBootstrapped = false

export interface BootstrapResult {
  success: boolean
  catalogsRegistered: number
  baseCatalogsRegistered: number
  totalCanonicalItems: number
  isRebootstrap: boolean
}

/**
 * Centrally bootstraps all STARFRONT WORLD master catalogs on the registry.
 * Completely idempotent and safe to call multiple times across turns and page loads.
 */
export function bootstrapWorldCatalogs(
  registry: CatalogRegistry = defaultCatalogRegistry,
  provider?: ICatalogDataProvider
): BootstrapResult {
  const isRebootstrap = isBootstrapped

  // 1. Register FND-2 Progression Catalogs
  registerProgressionCatalogs(registry, provider)

  // 2. Register FND-3 Decision Catalogs
  registerDecisionCatalogs(registry, provider)

  // 3. Register FND-4 Population Catalogs
  registerPopulationCatalogs(registry, provider)

  // 4. Register FND-5 Building & Production Catalogs
  registerBuildingCatalogs(registry, provider)

  // 5. Register FND-6 Base, Hub & Seed Profile Catalogs
  registerBaseCatalogs(registry, provider)

  isBootstrapped = true

  // Count items across all catalogs for diagnostic telemetry
  const catalogList = [
    ["progression", "progression_profile"],
    ["progression", "tier_profile"],
    ["progression", "level_effect_profile"],
    ["progression", "tier_effect_profile"],
    ["decision", "fallback_policy"],
    ["decision", "decision_source"],
    ["decision", "decision_type"],
    ["decision", "decision_priority"],
    ["population", "population_bucket"],
    ["population", "workforce_category"],
    ["population", "workforce_allocation_policy"],
    ["population", "capacity_policy"],
    ["population", "movement_reason"],
    ["building", "building_type"],
    ["building", "building_class"],
    ["building", "building_definition"],
    ["building", "slot_profile"],
    ["building", "module_definition"],
    ["building", "production_recipe"],
    ["building", "base_init_profile"],
  ]

  const baseCatalogList = [
    ["base", "base_class"],
    ["base", "base_type"],
    ["base", "hub_specialization"],
    ["base", "world_seed_profile"],
  ]

  let totalItems = 0
  for (const [domain, name] of [...catalogList, ...baseCatalogList]) {
    try {
      const items = registry.getResolvedItems(domain, name)
      totalItems += items.length
    } catch {
      // fail-soft
    }
  }

  return {
    success: true,
    catalogsRegistered: catalogList.length,
    baseCatalogsRegistered: baseCatalogList.length,
    totalCanonicalItems: totalItems,
    isRebootstrap,
  }
}

// Automatically bootstrap default registry on module load
bootstrapWorldCatalogs(defaultCatalogRegistry)
