/**
 * STARFRONT WORLD — Building Catalog Registry Integration (Phase 6.34A-FND-5)
 *
 * Integrates building definitions, types, classes, slot profiles, modules,
 * production recipes, and base init profiles with FND-1 Catalog Registry.
 */

import {
  CatalogRegistry,
  defaultCatalogRegistry,
} from "../catalog/registry"
import type { ICatalogDataProvider, ResolvedCatalogItem } from "../catalog/types"
import {
  SYSTEM_BUILDING_CATALOG_FILES,
} from "./seed-data"
import type {
  BuildingDefinition,
  BuildingModuleDefinition,
  ProductionRecipe,
  SlotProfile,
} from "./types"

/**
 * Pre-seeds a data provider with canonical SYSTEM building files
 */
export function seedBuildingCatalogData(provider: ICatalogDataProvider): void {
  for (const [filename, nodeFile] of Object.entries(SYSTEM_BUILDING_CATALOG_FILES)) {
    if (!provider.exists(filename)) {
      provider.writeFile(filename, JSON.stringify(nodeFile, null, 2))
    }
  }
}

/**
 * Registers building domain catalogs with a CatalogRegistry
 */
export function registerBuildingCatalogs(
  registry: CatalogRegistry = defaultCatalogRegistry,
  provider?: ICatalogDataProvider
): void {
  const targetProvider = provider || registry.getDataProvider()
  if (targetProvider) {
    seedBuildingCatalogData(targetProvider)
  }

  // 1. Building Type
  registry.registerCatalog({
    domain: "building",
    catalogName: "building_type",
  })

  // 2. Building Class
  registry.registerCatalog({
    domain: "building",
    catalogName: "building_class",
  })

  // 3. Building Definition
  registry.registerCatalog<BuildingDefinition>({
    domain: "building",
    catalogName: "building_definition",
  })

  // 4. Slot Profile
  registry.registerCatalog<SlotProfile>({
    domain: "building",
    catalogName: "slot_profile",
  })

  // 5. Module Definition
  registry.registerCatalog<BuildingModuleDefinition>({
    domain: "building",
    catalogName: "module_definition",
  })

  // 6. Production Recipe
  registry.registerCatalog<ProductionRecipe>({
    domain: "building",
    catalogName: "production_recipe",
  })

  // 7. Base Init Profile
  registry.registerCatalog({
    domain: "building",
    catalogName: "base_init_profile",
  })
}

/**
 * Resolves a building definition by ID from registry
 */
export function getBuildingDefinition(
  definitionId: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem<BuildingDefinition> | undefined {
  return registry.getItem<BuildingDefinition>("building", "building_definition", definitionId)
}

/**
 * Resolves all building definitions from registry
 */
export function getAllBuildingDefinitions(
  registry: CatalogRegistry = defaultCatalogRegistry
): Array<ResolvedCatalogItem<BuildingDefinition>> {
  return registry.getResolvedItems<BuildingDefinition>("building", "building_definition")
}

/**
 * Resolves a slot profile by ID from registry
 */
export function getSlotProfile(
  profileId: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem<SlotProfile> | undefined {
  return registry.getItem<SlotProfile>("building", "slot_profile", profileId)
}

/**
 * Resolves a production recipe by ID from registry
 */
export function getProductionRecipe(
  recipeId: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem<ProductionRecipe> | undefined {
  return registry.getItem<ProductionRecipe>("building", "production_recipe", recipeId)
}

/**
 * Resolves a module definition by ID from registry
 */
export function getModuleDefinition(
  moduleId: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem<BuildingModuleDefinition> | undefined {
  return registry.getItem<BuildingModuleDefinition>("building", "module_definition", moduleId)
}

// Auto-register canonical building catalogs on default registry
registerBuildingCatalogs(defaultCatalogRegistry)
