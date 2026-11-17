/**
 * STARFRONT WORLD V2 — GEAR V2 P2 FND-1 Registry Integration (C4 Mapping)
 *
 * Uses isolated domain "gearv2" and single-token catalogNames so FND-1
 * `parseConfigFileId` & `validateChildPrefix` work natively without colliding
 * with GEAR V1 or FND-8.6 `system_gear_compatibility_data.json`.
 */

import systemGearV2EquipmentJson from "../../../../../data/catalogs/system_gearv2_equipment_data.json"
import systemGearV2EngineProfileJson from "../../../../../data/catalogs/system_gearv2_engineprofile_data.json"
import systemGearV2CategoryJson from "../../../../../data/catalogs/system_gearv2_category_data.json"
import systemGearV2CompatibilityJson from "../../../../../data/catalogs/system_gearv2_compatibility_data.json"
import systemGearV2ClassProfileJson from "../../../../../data/catalogs/system_gearv2_classprofile_data.json"
import systemGearV2StatRegistryJson from "../../../../../data/catalogs/system_gearv2_statregistry_data.json"
import systemGearV2ManifestJson from "../../../../../data/catalogs/system_gearv2_manifest_data.json"

import { buildSystemFilename, filenameToConfigFileId } from "../../../world/catalog/file-naming"
import { CatalogRegistry, defaultCatalogRegistry } from "../../../world/catalog/registry"
import type {
  CatalogNodeFile,
  ICatalogDataProvider,
  ResolvedCatalog,
} from "../../../world/catalog/types"
import type {
  GearV2CatalogName,
  GearV2CatalogRegistrationSpec,
  GearV2CategoryItem,
  GearV2ClassProfileItem,
  GearV2CompatibilityRuleItem,
  GearV2EngineProfileItem,
  GearV2EquipmentItem,
  GearV2ManifestEntryItem,
  GearV2SourceCatalogName,
  GearV2StatRegistryItem,
} from "./types"

export const GEAR_V2_CATALOG_DOMAIN = "gearv2" as const

export const GEAR_V2_SOURCE_CATALOG_NAMES: readonly GearV2SourceCatalogName[] = [
  "equipment",
  "engineprofile",
  "category",
  "compatibility",
  "classprofile",
  "statregistry",
] as const

export const GEAR_V2_CATALOG_NAMES: readonly GearV2CatalogName[] = [
  ...GEAR_V2_SOURCE_CATALOG_NAMES,
  "manifest",
] as const

function buildRegistrationSpec(
  catalogName: GearV2CatalogName
): GearV2CatalogRegistrationSpec {
  const rootFilename = buildSystemFilename(GEAR_V2_CATALOG_DOMAIN, catalogName)
  const configFileId = filenameToConfigFileId(rootFilename)
  return {
    domain: GEAR_V2_CATALOG_DOMAIN,
    catalogName,
    configFileId,
    rootFilename,
    physicalPath: `data/catalogs/${rootFilename}`,
    providerKey: `${GEAR_V2_CATALOG_DOMAIN}_${catalogName}`,
    schemaVersion: 1,
    isManifest: catalogName === "manifest",
  }
}

export const GEAR_V2_CATALOG_REGISTRATIONS: readonly GearV2CatalogRegistrationSpec[] =
  GEAR_V2_CATALOG_NAMES.map(buildRegistrationSpec)

export const GEAR_V2_CATALOG_REGISTRATION_MAP: ReadonlyMap<
  GearV2CatalogName,
  GearV2CatalogRegistrationSpec
> = new Map(GEAR_V2_CATALOG_REGISTRATIONS.map((spec) => [spec.catalogName, spec]))

export function getGearV2BundledCatalogFiles(): Record<string, CatalogNodeFile<any>> {
  return {
    "system_gearv2_equipment_data.json": systemGearV2EquipmentJson as CatalogNodeFile<GearV2EquipmentItem>,
    "system_gearv2_engineprofile_data.json":
      systemGearV2EngineProfileJson as CatalogNodeFile<GearV2EngineProfileItem>,
    "system_gearv2_category_data.json": systemGearV2CategoryJson as CatalogNodeFile<GearV2CategoryItem>,
    "system_gearv2_compatibility_data.json":
      systemGearV2CompatibilityJson as CatalogNodeFile<GearV2CompatibilityRuleItem>,
    "system_gearv2_classprofile_data.json":
      systemGearV2ClassProfileJson as CatalogNodeFile<GearV2ClassProfileItem>,
    "system_gearv2_statregistry_data.json":
      systemGearV2StatRegistryJson as CatalogNodeFile<GearV2StatRegistryItem>,
    "system_gearv2_manifest_data.json": systemGearV2ManifestJson as CatalogNodeFile<GearV2ManifestEntryItem>,
  }
}

/**
 * Seeds a target ICatalogDataProvider (e.g. InMemoryCatalogDataProvider) with the 7 GEAR V2 catalog files.
 * Preserves exact 2-space + trailing-newline serialization so SHA-256 digests match disk files.
 */
export function seedGearV2CatalogData(provider: ICatalogDataProvider): void {
  const files = getGearV2BundledCatalogFiles()
  for (const [filename, nodeFile] of Object.entries(files)) {
    if (!provider.exists(filename)) {
      provider.writeFile(filename, JSON.stringify(nodeFile, null, 2) + "\n")
    }
  }
}

/**
 * Registers all 7 GEAR V2 catalogs into the target FND-1 CatalogRegistry under domain "gearv2".
 */
export function registerGearV2Catalogs(
  registry: CatalogRegistry = defaultCatalogRegistry,
  provider?: ICatalogDataProvider
): void {
  const activeProvider = provider || registry.getDataProvider()
  if (activeProvider) {
    seedGearV2CatalogData(activeProvider)
  }

  for (const reg of GEAR_V2_CATALOG_REGISTRATIONS) {
    registry.registerCatalog({
      domain: reg.domain,
      catalogName: reg.catalogName,
      rootFilename: reg.rootFilename,
      schemaVersion: reg.schemaVersion,
    })
  }
}

export function getGearV2EquipmentCatalog(
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalog<GearV2EquipmentItem> {
  return registry.getCatalog<GearV2EquipmentItem>(GEAR_V2_CATALOG_DOMAIN, "equipment")
}

export function getGearV2EngineProfileCatalog(
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalog<GearV2EngineProfileItem> {
  return registry.getCatalog<GearV2EngineProfileItem>(GEAR_V2_CATALOG_DOMAIN, "engineprofile")
}

export function getGearV2CategoryCatalog(
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalog<GearV2CategoryItem> {
  return registry.getCatalog<GearV2CategoryItem>(GEAR_V2_CATALOG_DOMAIN, "category")
}

export function getGearV2CompatibilityCatalog(
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalog<GearV2CompatibilityRuleItem> {
  return registry.getCatalog<GearV2CompatibilityRuleItem>(GEAR_V2_CATALOG_DOMAIN, "compatibility")
}

export function getGearV2ClassProfileCatalog(
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalog<GearV2ClassProfileItem> {
  return registry.getCatalog<GearV2ClassProfileItem>(GEAR_V2_CATALOG_DOMAIN, "classprofile")
}

export function getGearV2StatRegistryCatalog(
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalog<GearV2StatRegistryItem> {
  return registry.getCatalog<GearV2StatRegistryItem>(GEAR_V2_CATALOG_DOMAIN, "statregistry")
}

export function getGearV2ManifestCatalog(
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalog<GearV2ManifestEntryItem> {
  return registry.getCatalog<GearV2ManifestEntryItem>(GEAR_V2_CATALOG_DOMAIN, "manifest")
}
