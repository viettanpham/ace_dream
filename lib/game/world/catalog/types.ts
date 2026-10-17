/**
 * STARFRONT WORLD — Shared Catalog & Master Data Foundation (Phase 6.34A-FND-1)
 *
 * Generic types and contracts for data-driven master catalogs:
 * SHIP, BUILDING, MODULE, ITEM, TACTIC, PROGRESSION, AWARD, PERSONNEL, LOGISTICS.
 */

export type CatalogFileMode = "INLINE" | "SPLIT"

export type CatalogSourceType = "SYSTEM" | "USER"

export type CatalogItemLifecycle = "ACTIVE" | "DEPRECATED" | "RETIRED"

export interface CatalogPartitionRef {
  ref: string
}

/**
 * Root or partition file structure for SYSTEM catalog master data
 */
export interface CatalogNodeFile<T = any> {
  configFileId: string
  schemaVersion: number
  dataVersion: number
  mode: CatalogFileMode
  items?: T[]
  partitions?: CatalogPartitionRef[]
  metadata?: Record<string, any>
}

/**
 * Root file contract alias
 */
export type CatalogRootFile<T = any> = CatalogNodeFile<T>

/**
 * Field-level override entry stored in user data file
 */
export interface UserOverrideEntry {
  targetId: string
  modifiedData: Record<string, any>
  modifiedAt: string
}

/**
 * Structure of user_<domain>_<catalog>_data.json
 */
export interface UserCatalogFile<T = any> {
  configFileId: string
  schemaVersion: number
  dataVersion: number
  overrides: UserOverrideEntry[]
  customItems: T[]
  metadata?: Record<string, any>
}

/**
 * Provenance metadata attached to each resolved item
 */
export interface CatalogProvenance {
  sourceType: CatalogSourceType
  sourceFile: string
  sourceCatalogId: string
  sourceDataVersion: number
  isOverridden?: boolean
  overrideSource?: string
  modifiedAt?: string
  lifecycleState?: CatalogItemLifecycle
  isOrphanOverride?: boolean
}

/**
 * Resolved item structure exposed to runtime and UI
 */
export type ResolvedCatalogItem<T = any> = T & {
  id: string
  lifecycle?: CatalogItemLifecycle
  provenance: CatalogProvenance
  _canonical?: T
}

/**
 * Diagnostic error/warning entry for AdminCP and system logging
 */
export interface CatalogDiagnosticError {
  code:
    | "ROOT_FILE_MISSING"
    | "ROOT_FILE_MALFORMED"
    | "PARTITION_FILE_MISSING"
    | "PARTITION_FILE_MALFORMED"
    | "CYCLE_DETECTED"
    | "MAX_DEPTH_EXCEEDED"
    | "INVALID_CHILD_PREFIX"
    | "ITEM_MISSING_ID"
    | "ITEM_MALFORMED"
    | "DUPLICATE_SYSTEM_ID"
    | "DUPLICATE_USER_ID"
    | "USER_ID_COLLIDES_WITH_SYSTEM_ID"
    | "USER_ITEM_MISSING_ID"
    | "USER_ITEM_MALFORMED"
    | "ORPHAN_OVERRIDE"
    | "SCHEMA_MISMATCH"
  message: string
  file?: string
  configFileId?: string
  itemId?: string
  timestamp: string
  severity: "error" | "warning"
}

/**
 * Complete resolved catalog returned by loader/resolver
 */
export interface ResolvedCatalog<T = any> {
  catalogId: string
  domain: string
  schemaVersion: number
  dataVersion: number
  items: Array<ResolvedCatalogItem<T>>
  itemMap: Map<string, ResolvedCatalogItem<T>>
  diagnostics: CatalogDiagnosticError[]
}

/**
 * Interface for pluggable file readers/writers
 */
export interface ICatalogDataProvider {
  readFile(filename: string): string | null
  writeFile(filename: string, content: string): void
  exists(filename: string): boolean
  deleteFile?(filename: string): void
}

/**
 * Options for catalog loading and tree resolution
 */
export interface CatalogLoadOptions {
  maxDepth?: number
  trackCycles?: boolean
  failFast?: boolean
  derivedFieldKeys?: string[]
}
