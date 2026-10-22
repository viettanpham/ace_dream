/**
 * STARFRONT WORLD — Catalog Registry & Runtime Integration (Phase 6.34A-FND-1)
 *
 * Central registry managing catalog lifecycle, caching, user overrides,
 * and diagnostic error tracking for AdminCP.
 */

import { buildSystemFilename, buildUserFilename, filenameToConfigFileId } from "./file-naming"
import { loadCatalogTree } from "./loader"
import {
  addUserCustomItem,
  applyUserOverride,
  removeUserCustomItem,
  resetUserOverride,
  resolveCatalog,
} from "./resolver"
import { filterSelectableItems } from "./lifecycle"
import { LocalStorageCatalogDataProvider } from "./storage-provider"
import type {
  CatalogDiagnosticError,
  CatalogItemLifecycle,
  CatalogLoadOptions,
  ICatalogDataProvider,
  ResolvedCatalog,
  ResolvedCatalogItem,
  UserCatalogFile,
} from "./types"

export interface CatalogRegistration<T extends { id: string } = any> {
  domain: string
  catalogName: string
  rootFilename?: string
  userFilename?: string
  schemaVersion?: number
  derivedFieldKeys?: string[]
}

/**
 * Registry managing active master catalogs
 */
export class CatalogRegistry {
  private provider: ICatalogDataProvider
  private registrations: Map<string, CatalogRegistration> = new Map()
  private resolvedCatalogs: Map<string, ResolvedCatalog> = new Map()
  private globalDiagnostics: CatalogDiagnosticError[] = []

  constructor(provider?: ICatalogDataProvider) {
    this.provider = provider || new LocalStorageCatalogDataProvider()
  }

  /**
   * Sets custom data provider (e.g. for testing)
   */
  setDataProvider(provider: ICatalogDataProvider): void {
    this.provider = provider
    this.resolvedCatalogs.clear()
  }

  /**
   * Gets the active data provider
   */
  getDataProvider(): ICatalogDataProvider {
    return this.provider
  }

  /**
   * Generates a stable catalog key from domain and catalogName
   */
  private makeKey(domain: string, catalogName: string): string {
    return `${domain.toLowerCase()}_${catalogName.toLowerCase()}`
  }

  /**
   * Registers a catalog configuration
   */
  registerCatalog<T extends { id: string }>(registration: CatalogRegistration<T>): string {
    const key = this.makeKey(registration.domain, registration.catalogName)
    const rootFilename =
      registration.rootFilename ||
      buildSystemFilename(registration.domain, registration.catalogName)
    const userFilename =
      registration.userFilename ||
      buildUserFilename(registration.domain, registration.catalogName)

    this.registrations.set(key, {
      ...registration,
      rootFilename,
      userFilename,
    })

    return key
  }

  /**
   * Gets or loads a resolved catalog
   */
  getCatalog<T extends { id: string }>(
    domain: string,
    catalogName: string,
    options?: CatalogLoadOptions
  ): ResolvedCatalog<T> {
    const key = this.makeKey(domain, catalogName)
    if (this.resolvedCatalogs.has(key)) {
      return this.resolvedCatalogs.get(key) as ResolvedCatalog<T>
    }

    return this.loadAndResolve<T>(domain, catalogName, options)
  }

  /**
   * Forces a reload and re-resolution of a catalog
   */
  reloadCatalog<T extends { id: string }>(
    domain: string,
    catalogName: string,
    options?: CatalogLoadOptions
  ): ResolvedCatalog<T> {
    const key = this.makeKey(domain, catalogName)
    this.resolvedCatalogs.delete(key)
    return this.loadAndResolve<T>(domain, catalogName, options)
  }

  /**
   * Retrieves a single resolved item by ID directly from the catalog
   */
  getItem<T extends { id: string }>(
    domain: string,
    catalogName: string,
    id: string,
    options?: CatalogLoadOptions
  ): ResolvedCatalogItem<T> | undefined {
    if (!id || typeof id !== "string") return undefined
    const catalog = this.getCatalog<T>(domain, catalogName, options)
    return catalog.itemMap.get(id.trim())
  }

  /**
   * Alias for getItem — resolves an item by its unique ID
   */
  resolveById<T extends { id: string }>(
    domain: string,
    catalogName: string,
    id: string,
    options?: CatalogLoadOptions
  ): ResolvedCatalogItem<T> | undefined {
    return this.getItem<T>(domain, catalogName, id, options)
  }

  /**
   * Retrieves all resolved items in a catalog, optionally filtering by lifecycle state
   */
  getResolvedItems<T extends { id: string }>(
    domain: string,
    catalogName: string,
    options?: CatalogLoadOptions & {
      lifecycleFilter?: CatalogItemLifecycle | "ALL"
      includeDeprecated?: boolean
      includeRetired?: boolean
    }
  ): Array<ResolvedCatalogItem<T>> {
    const catalog = this.getCatalog<T>(domain, catalogName, options)
    if (
      !options?.lifecycleFilter &&
      options?.includeDeprecated === undefined &&
      options?.includeRetired === undefined
    ) {
      return catalog.items
    }

    if (options?.lifecycleFilter && options.lifecycleFilter !== "ALL") {
      return catalog.items.filter(
        (item) => (item.lifecycle || "ACTIVE") === options.lifecycleFilter
      )
    }

    return filterSelectableItems(catalog.items, {
      includeDeprecated: options?.includeDeprecated,
      includeRetired: options?.includeRetired,
    })
  }

  /**
   * Internal loader and resolver pipeline
   */
  private loadAndResolve<T extends { id: string }>(
    domain: string,
    catalogName: string,
    options?: CatalogLoadOptions
  ): ResolvedCatalog<T> {
    const key = this.makeKey(domain, catalogName)
    const reg = this.registrations.get(key) || {
      domain,
      catalogName,
      rootFilename: buildSystemFilename(domain, catalogName),
      userFilename: buildUserFilename(domain, catalogName),
    }

    const rootFilename = reg.rootFilename!
    const userFilename = reg.userFilename!

    // 1. Load System tree (fail-soft by omission)
    const loadedSystem = loadCatalogTree<T>(rootFilename, this.provider, options)

    // 2. Load User file if exists
    let userFile: UserCatalogFile<T> | null = null
    if (this.provider.exists(userFilename)) {
      const rawUser = this.provider.readFile(userFilename)
      if (rawUser) {
        try {
          userFile = JSON.parse(rawUser)
        } catch (err: any) {
          this.globalDiagnostics.push({
            code: "ROOT_FILE_MALFORMED",
            message: `User catalog file '${userFilename}' failed JSON parse: ${err?.message || "Unknown error"}. Proceeding with system catalog only.`,
            file: userFilename,
            configFileId: filenameToConfigFileId(userFilename),
            timestamp: new Date().toISOString(),
            severity: "error",
          })
        }
      }
    }

    // 3. Resolve
    const resolved = resolveCatalog<T>(loadedSystem, userFile, {
      domain,
      catalogName,
      derivedFieldKeys: reg.derivedFieldKeys || options?.derivedFieldKeys,
    })

    // Accumulate diagnostics
    if (resolved.diagnostics.length > 0) {
      this.globalDiagnostics.push(...resolved.diagnostics)
    }

    this.resolvedCatalogs.set(key, resolved)
    return resolved
  }

  /**
   * Reads raw UserCatalogFile or creates an empty one if missing
   */
  getUserCatalogFile<T = any>(domain: string, catalogName: string): UserCatalogFile<T> {
    const key = this.makeKey(domain, catalogName)
    const reg = this.registrations.get(key)
    const userFilename = reg?.userFilename || buildUserFilename(domain, catalogName)

    if (this.provider.exists(userFilename)) {
      const raw = this.provider.readFile(userFilename)
      if (raw) {
        try {
          return JSON.parse(raw)
        } catch {
          // Fall through to empty default
        }
      }
    }

    return {
      configFileId: filenameToConfigFileId(userFilename),
      schemaVersion: 1,
      dataVersion: 1,
      overrides: [],
      customItems: [],
    }
  }

  /**
   * Saves updated UserCatalogFile and re-resolves the catalog
   */
  saveUserCatalogFile<T extends { id: string }>(
    domain: string,
    catalogName: string,
    userFile: UserCatalogFile<T>
  ): ResolvedCatalog<T> {
    const key = this.makeKey(domain, catalogName)
    const reg = this.registrations.get(key)
    const userFilename = reg?.userFilename || buildUserFilename(domain, catalogName)

    const serialized = JSON.stringify(userFile, null, 2)
    this.provider.writeFile(userFilename, serialized)

    return this.reloadCatalog<T>(domain, catalogName)
  }

  /**
   * Applies an override to a specific system item and persists it
   */
  setOverride<T extends { id: string }>(
    domain: string,
    catalogName: string,
    targetId: string,
    modifiedFields: Record<string, any>
  ): ResolvedCatalog<T> {
    const userFile = this.getUserCatalogFile<T>(domain, catalogName)
    const updated = applyUserOverride(userFile, targetId, modifiedFields)
    return this.saveUserCatalogFile<T>(domain, catalogName, updated)
  }

  /**
   * Resets an override for a system item, reverting it to canonical default
   */
  resetOverride<T extends { id: string }>(
    domain: string,
    catalogName: string,
    targetId: string
  ): ResolvedCatalog<T> {
    const userFile = this.getUserCatalogFile<T>(domain, catalogName)
    const updated = resetUserOverride(userFile, targetId)
    return this.saveUserCatalogFile<T>(domain, catalogName, updated)
  }

  /**
   * Adds a custom user item and persists it
   */
  addCustomItem<T extends { id: string }>(
    domain: string,
    catalogName: string,
    item: T
  ): { success: boolean; error?: string; catalog?: ResolvedCatalog<T> } {
    const currentCatalog = this.getCatalog<T>(domain, catalogName)
    const userFile = this.getUserCatalogFile<T>(domain, catalogName)
    const res = addUserCustomItem(userFile, item, currentCatalog)

    if (!res.success) {
      return { success: false, error: res.error }
    }

    const newCatalog = this.saveUserCatalogFile<T>(domain, catalogName, res.userFile)
    return { success: true, catalog: newCatalog }
  }

  /**
   * Removes a custom user item and persists change
   */
  removeCustomItem<T extends { id: string }>(
    domain: string,
    catalogName: string,
    itemId: string
  ): ResolvedCatalog<T> {
    const userFile = this.getUserCatalogFile<T>(domain, catalogName)
    const updated = removeUserCustomItem(userFile, itemId)
    return this.saveUserCatalogFile<T>(domain, catalogName, updated)
  }

  /**
   * Retrieves all diagnostic error/warning logs for AdminCP
   */
  getAllDiagnostics(): CatalogDiagnosticError[] {
    return [...this.globalDiagnostics]
  }

  /**
   * Clears accumulated diagnostic logs
   */
  clearDiagnostics(): void {
    this.globalDiagnostics = []
  }
}

/**
 * Global default registry singleton instance
 */
export const defaultCatalogRegistry = new CatalogRegistry()

/**
 * Returns the active default master catalog registry singleton
 */
export function getMasterRegistry(): CatalogRegistry {
  return defaultCatalogRegistry
}

/**
 * Top-level consumer API: gets or loads a resolved catalog from default registry
 */
export function getCatalog<T extends { id: string }>(
  domain: string,
  catalogName: string,
  options?: CatalogLoadOptions
): ResolvedCatalog<T> {
  return defaultCatalogRegistry.getCatalog<T>(domain, catalogName, options)
}

/**
 * Top-level consumer API: retrieves a resolved item by ID directly from default registry
 */
export function getItem<T extends { id: string }>(
  domain: string,
  catalogName: string,
  id: string,
  options?: CatalogLoadOptions
): ResolvedCatalogItem<T> | undefined {
  return defaultCatalogRegistry.getItem<T>(domain, catalogName, id, options)
}

/**
 * Top-level consumer API: alias for getItem — resolves an item by its unique ID
 */
export function resolveById<T extends { id: string }>(
  domain: string,
  catalogName: string,
  id: string,
  options?: CatalogLoadOptions
): ResolvedCatalogItem<T> | undefined {
  return defaultCatalogRegistry.resolveById<T>(domain, catalogName, id, options)
}

/**
 * Top-level consumer API: retrieves all resolved items, optionally filtered by lifecycle
 */
export function getResolvedItems<T extends { id: string }>(
  domain: string,
  catalogName: string,
  options?: CatalogLoadOptions & {
    lifecycleFilter?: CatalogItemLifecycle | "ALL"
    includeDeprecated?: boolean
    includeRetired?: boolean
  }
): Array<ResolvedCatalogItem<T>> {
  return defaultCatalogRegistry.getResolvedItems<T>(domain, catalogName, options)
}

