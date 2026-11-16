/**
 * STARFRONT WORLD V2 — FND-1 Pilot Domain Catalog Registry Integration
 *
 * Loads the canonical JSON master catalogs from `data/catalogs/` as single source of truth:
 * 1. `data/catalogs/system_pilot_class_data.json`        (domain: "pilot", catalogName: "class")
 * 2. `data/catalogs/system_pilot_trait_data.json`        (domain: "pilot", catalogName: "trait")
 * 3. `data/catalogs/system_gear_compatibility_data.json` (domain: "gear",  catalogName: "compatibility")
 *
 * Preserves strict safety gates:
 * - Proposed 20-point class base attributes stay `PROPOSED_UNLOCKED` and non-executable.
 * - Candidate Trait values (D1/D2/D3/UNSET) remain non-executable (`value: null`).
 */

import systemPilotClassJson from "../../../../data/catalogs/system_pilot_class_data.json"
import systemPilotTraitJson from "../../../../data/catalogs/system_pilot_trait_data.json"
import systemGearCompatibilityJson from "../../../../data/catalogs/system_gear_compatibility_data.json"

import { CatalogRegistry, defaultCatalogRegistry } from "../catalog/registry"
import type {
  CatalogNodeFile,
  ICatalogDataProvider,
  ResolvedCatalog,
  ResolvedCatalogItem,
} from "../catalog/types"
import type {
  GearCompatibilityDefinition,
  PilotBaseAttributes,
  PilotClassDefinition,
  PilotTraitDefinition,
} from "./catalog-types"

export const PILOT_CLASS_CATALOG_FILENAME = "system_pilot_class_data.json"
export const PILOT_TRAIT_CATALOG_FILENAME = "system_pilot_trait_data.json"
export const GEAR_COMPATIBILITY_CATALOG_FILENAME = "system_gear_compatibility_data.json"

/**
 * Seeds a data provider with the 3 canonical JSON catalog files from `data/catalogs/`
 * if they are not already present in that provider.
 */
export function seedPilotDomainCatalogData(provider: ICatalogDataProvider): void {
  const files: Record<string, CatalogNodeFile<any>> = {
    [PILOT_CLASS_CATALOG_FILENAME]: systemPilotClassJson as CatalogNodeFile<PilotClassDefinition>,
    [PILOT_TRAIT_CATALOG_FILENAME]: systemPilotTraitJson as CatalogNodeFile<PilotTraitDefinition>,
    [GEAR_COMPATIBILITY_CATALOG_FILENAME]: systemGearCompatibilityJson as CatalogNodeFile<GearCompatibilityDefinition>,
  }

  for (const [filename, nodeFile] of Object.entries(files)) {
    if (!provider.exists(filename)) {
      provider.writeFile(filename, JSON.stringify(nodeFile, null, 2))
    }
  }
}

/**
 * Registers `pilot/class`, `pilot/trait`, and `gear/compatibility` catalogs
 * into the target FND-1 CatalogRegistry.
 */
export function registerPilotDomainCatalogs(
  registry: CatalogRegistry = defaultCatalogRegistry,
  provider?: ICatalogDataProvider
): void {
  const activeProvider = provider || registry.getDataProvider()
  if (activeProvider) {
    seedPilotDomainCatalogData(activeProvider)
  }

  registry.registerCatalog<PilotClassDefinition>({
    domain: "pilot",
    catalogName: "class",
    rootFilename: PILOT_CLASS_CATALOG_FILENAME,
    schemaVersion: 1,
  })

  registry.registerCatalog<PilotTraitDefinition>({
    domain: "pilot",
    catalogName: "trait",
    rootFilename: PILOT_TRAIT_CATALOG_FILENAME,
    schemaVersion: 1,
  })

  registry.registerCatalog<GearCompatibilityDefinition>({
    domain: "gear",
    catalogName: "compatibility",
    rootFilename: GEAR_COMPATIBILITY_CATALOG_FILENAME,
    schemaVersion: 1,
  })
}

export function getPilotClassCatalog(
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalog<PilotClassDefinition> {
  return registry.getCatalog<PilotClassDefinition>("pilot", "class")
}

export function getAllPilotClasses(
  registry: CatalogRegistry = defaultCatalogRegistry
): Array<ResolvedCatalogItem<PilotClassDefinition>> {
  return registry.getResolvedItems<PilotClassDefinition>("pilot", "class")
}

export function getPilotClassDefinition(
  characterClassId: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem<PilotClassDefinition> | undefined {
  return registry.getItem<PilotClassDefinition>("pilot", "class", characterClassId)
}

export function getPilotClassByPilotId(
  pilotId: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem<PilotClassDefinition> | undefined {
  const normalized = pilotId.trim().toLowerCase()
  return getAllPilotClasses(registry).find((item) => item.pilotId === normalized)
}

export function getPilotTraitCatalog(
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalog<PilotTraitDefinition> {
  return registry.getCatalog<PilotTraitDefinition>("pilot", "trait")
}

export function getAllPilotTraits(
  registry: CatalogRegistry = defaultCatalogRegistry
): Array<ResolvedCatalogItem<PilotTraitDefinition>> {
  return registry.getResolvedItems<PilotTraitDefinition>("pilot", "trait")
}

export function getPilotTraitDefinition(
  traitId: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem<PilotTraitDefinition> | undefined {
  return registry.getItem<PilotTraitDefinition>("pilot", "trait", traitId)
}

export function getPilotTraitsForClass(
  characterClassId: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): Array<ResolvedCatalogItem<PilotTraitDefinition>> {
  const pilotClass = getPilotClassDefinition(characterClassId, registry)
  if (!pilotClass) return []

  const resolved: Array<ResolvedCatalogItem<PilotTraitDefinition>> = []
  for (const traitId of pilotClass.traitDefinitionIds) {
    const trait = getPilotTraitDefinition(traitId, registry)
    if (trait) {
      resolved.push(trait)
    }
  }
  return resolved
}

export function getGearCompatibilityCatalog(
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalog<GearCompatibilityDefinition> {
  return registry.getCatalog<GearCompatibilityDefinition>("gear", "compatibility")
}

/**
 * Safety guard: Returns Canonical Combat base attributes ONLY when Canon-locked.
 * Never exposes `proposedBaseAttributes` (`PROPOSED_UNLOCKED`) to Combat execution.
 */
export function getCanonicalCombatBaseAttributes(
  pilotClass: Pick<PilotClassDefinition, "baseAttributes" | "baseAttributesApproval">
): PilotBaseAttributes | null {
  if (pilotClass.baseAttributesApproval !== "CANON_LOCKED") {
    return null
  }
  return pilotClass.baseAttributes
}

/**
 * Safety guard: Returns executable numeric Trait modifier ONLY when Canon-locked,
 * explicitly flagged executable, and supported by Combat V2.
 * Never promotes D1/D2/D3 candidates into active gameplay modifiers.
 */
export function getExecutableTraitModifierValue(
  trait: Pick<
    PilotTraitDefinition,
    "value" | "valueApprovalStatus" | "isExecutableModifier" | "combatV2SupportStatus"
  >
): number | null {
  if (
    trait.valueApprovalStatus !== "CANON_LOCKED" ||
    !trait.isExecutableModifier ||
    trait.combatV2SupportStatus !== "SUPPORTED" ||
    typeof trait.value !== "number"
  ) {
    return null
  }
  return trait.value
}

// Auto-register Pilot & GEAR Compatibility catalogs on default FND-1 registry
registerPilotDomainCatalogs(defaultCatalogRegistry)
