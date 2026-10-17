/**
 * STARFRONT WORLD — Catalog Resolver & Master Data Merge Engine (Phase 6.34A-FND-1)
 *
 * Implements:
 * - SYSTEM canonical load + USER field-level override resolution
 * - Global Unique ID enforcement with explicit duplicate rejection (no silent overwrite)
 * - User custom item validation (rejects ID collision with SYSTEM or USER items)
 * - Orphan override detection for removed/unresolved system items
 * - Lifecycle state tracking (ACTIVE, DEPRECATED, RETIRED)
 * - Provenance preservation (Default/Init vs Current/Resolved tracking)
 * - Deterministic ordering and fail-soft omission
 */

import { stripDerivedFields } from "./derived-data"
import type { LoadedCatalogResult } from "./loader"
import type {
  CatalogDiagnosticError,
  ResolvedCatalog,
  ResolvedCatalogItem,
  UserCatalogFile,
  UserOverrideEntry,
} from "./types"

export interface ResolveCatalogOptions {
  domain?: string
  catalogName?: string
  derivedFieldKeys?: string[]
}

/**
 * Resolves loaded system catalog items with user overrides and custom items
 */
export function resolveCatalog<T extends { id: string } = any>(
  loadedSystem: LoadedCatalogResult<T>,
  userFile: UserCatalogFile<T> | null,
  options?: ResolveCatalogOptions
): ResolvedCatalog<T> {
  const diagnostics: CatalogDiagnosticError[] = [...loadedSystem.diagnostics]

  const logDiag = (
    code: CatalogDiagnosticError["code"],
    message: string,
    file?: string,
    configFileId?: string,
    itemId?: string,
    severity: "error" | "warning" = "error"
  ) => {
    diagnostics.push({
      code,
      message,
      file,
      configFileId,
      itemId,
      timestamp: new Date().toISOString(),
      severity,
    })
  }

  const systemItemMap = new Map<string, ResolvedCatalogItem<T>>()
  const systemItemsOrdered: Array<ResolvedCatalogItem<T>> = []

  // 1. Process and deduplicate SYSTEM items
  for (const item of loadedSystem.items) {
    if (!item.id || typeof item.id !== "string" || !item.id.trim()) {
      logDiag(
        "ITEM_MISSING_ID",
        "Encountered SYSTEM item without a valid 'id'. Item omitted.",
        item.provenance?.sourceFile,
        item.provenance?.sourceCatalogId
      )
      continue
    }

    const cleanId = item.id.trim()

    // Global Unique ID Rule: duplicate SYSTEM ID is rejected, not overwritten
    if (systemItemMap.has(cleanId)) {
      logDiag(
        "DUPLICATE_SYSTEM_ID",
        `Duplicate SYSTEM item ID '${cleanId}' detected in '${item.provenance?.sourceFile}'. Second occurrence rejected (no silent overwrite).`,
        item.provenance?.sourceFile,
        item.provenance?.sourceCatalogId,
        cleanId
      )
      continue
    }

    const resolvedSystemItem: ResolvedCatalogItem<T> = {
      ...item,
      id: cleanId,
      lifecycle: item.lifecycle || "ACTIVE",
      _canonical: item._canonical ? { ...item._canonical } : { ...item },
      provenance: {
        ...item.provenance,
        sourceType: "SYSTEM",
        lifecycleState: item.lifecycle || "ACTIVE",
      },
    }

    systemItemMap.set(cleanId, resolvedSystemItem)
    systemItemsOrdered.push(resolvedSystemItem)
  }

  // 2. Process USER overrides
  const userOverrideMap = new Map<string, UserOverrideEntry>()
  if (userFile && Array.isArray(userFile.overrides)) {
    for (const ov of userFile.overrides) {
      if (!ov || !ov.targetId || typeof ov.targetId !== "string") continue
      const targetId = ov.targetId.trim()

      if (!systemItemMap.has(targetId)) {
        logDiag(
          "ORPHAN_OVERRIDE",
          `USER override references non-existent or hard-removed SYSTEM item '${targetId}'. Override is orphaned and will not auto-revive the item.`,
          userFile.configFileId,
          userFile.configFileId,
          targetId,
          "warning"
        )
        continue
      }

      userOverrideMap.set(targetId, ov)
    }
  }

  // Apply field-level overrides to system items
  const finalSystemItems: Array<ResolvedCatalogItem<T>> = []
  for (const sysItem of systemItemsOrdered) {
    const override = userOverrideMap.get(sysItem.id)
    if (!override) {
      finalSystemItems.push(sysItem)
      continue
    }

    // Strip derived fields from modifiedData to enforce authored inputs
    const cleanModifiedData = stripDerivedFields(
      override.modifiedData || {},
      options?.derivedFieldKeys
    )

    const overriddenItem: ResolvedCatalogItem<T> = {
      ...sysItem,
      ...cleanModifiedData,
      id: sysItem.id, // Immutable ID
      lifecycle: (cleanModifiedData as any).lifecycle || sysItem.lifecycle || "ACTIVE",
      provenance: {
        ...sysItem.provenance,
        isOverridden: true,
        overrideSource: userFile?.configFileId || "user_override",
        modifiedAt: override.modifiedAt,
        lifecycleState: (cleanModifiedData as any).lifecycle || sysItem.lifecycle || "ACTIVE",
      },
      _canonical: sysItem._canonical, // Retains default/init state
    }

    finalSystemItems.push(overriddenItem)
  }

  // 3. Process USER custom items
  const userItemMap = new Map<string, ResolvedCatalogItem<T>>()
  const userItemsOrdered: Array<ResolvedCatalogItem<T>> = []

  if (userFile && Array.isArray(userFile.customItems)) {
    for (let i = 0; i < userFile.customItems.length; i++) {
      const rawUserItem = userFile.customItems[i]
      if (!rawUserItem || typeof rawUserItem !== "object") {
        logDiag(
          "USER_ITEM_MALFORMED",
          `Skipped invalid non-object USER custom item at index ${i}.`,
          userFile.configFileId,
          userFile.configFileId
        )
        continue
      }

      if (!rawUserItem.id || typeof rawUserItem.id !== "string" || !rawUserItem.id.trim()) {
        logDiag(
          "USER_ITEM_MISSING_ID",
          `Skipped USER custom item at index ${i} because it lacks a valid 'id'.`,
          userFile.configFileId,
          userFile.configFileId
        )
        continue
      }

      const cleanUserId = rawUserItem.id.trim()

      // Reject collision with SYSTEM ID
      if (systemItemMap.has(cleanUserId)) {
        logDiag(
          "USER_ID_COLLIDES_WITH_SYSTEM_ID",
          `USER item ID '${cleanUserId}' collides with existing SYSTEM item ID. Item rejected (use field-level override instead).`,
          userFile.configFileId,
          userFile.configFileId,
          cleanUserId
        )
        continue
      }

      // Reject collision with other USER items
      if (userItemMap.has(cleanUserId)) {
        logDiag(
          "DUPLICATE_USER_ID",
          `Duplicate USER item ID '${cleanUserId}' detected. Second occurrence rejected.`,
          userFile.configFileId,
          userFile.configFileId,
          cleanUserId
        )
        continue
      }

      const cleanItemData = stripDerivedFields(rawUserItem, options?.derivedFieldKeys)

      const resolvedUserItem: ResolvedCatalogItem<T> = {
        ...(cleanItemData as T),
        id: cleanUserId,
        lifecycle: (rawUserItem as any).lifecycle || "ACTIVE",
        provenance: {
          sourceType: "USER",
          sourceFile: userFile.configFileId,
          sourceCatalogId: userFile.configFileId,
          sourceDataVersion: userFile.dataVersion || 1,
          lifecycleState: (rawUserItem as any).lifecycle || "ACTIVE",
        },
        _canonical: { ...(cleanItemData as T), id: cleanUserId },
      }

      userItemMap.set(cleanUserId, resolvedUserItem)
      userItemsOrdered.push(resolvedUserItem)
    }
  }

  // 4. Combine and build final item map
  const allResolvedItems: Array<ResolvedCatalogItem<T>> = [
    ...finalSystemItems,
    ...userItemsOrdered,
  ]

  const itemMap = new Map<string, ResolvedCatalogItem<T>>()
  for (const item of allResolvedItems) {
    itemMap.set(item.id, item)
  }

  return {
    catalogId: loadedSystem.rootConfigFileId,
    domain: options?.domain || "general",
    schemaVersion: loadedSystem.schemaVersion,
    dataVersion: loadedSystem.dataVersion,
    items: allResolvedItems,
    itemMap,
    diagnostics,
  }
}

/**
 * Creates or updates a field-level user override in a UserCatalogFile
 */
export function applyUserOverride<T = any>(
  userFile: UserCatalogFile<T>,
  targetId: string,
  modifiedFields: Record<string, any>,
  customDerivedKeys?: string[]
): UserCatalogFile<T> {
  const cleanId = targetId.trim()
  const cleanFields = stripDerivedFields(modifiedFields, customDerivedKeys)

  const existingOverrides = Array.isArray(userFile.overrides) ? [...userFile.overrides] : []
  const idx = existingOverrides.findIndex((o) => o.targetId === cleanId)

  const newEntry: UserOverrideEntry = {
    targetId: cleanId,
    modifiedData:
      idx >= 0
        ? { ...existingOverrides[idx].modifiedData, ...cleanFields }
        : { ...cleanFields },
    modifiedAt: new Date().toISOString(),
  }

  if (idx >= 0) {
    existingOverrides[idx] = newEntry
  } else {
    existingOverrides.push(newEntry)
  }

  return {
    ...userFile,
    dataVersion: (userFile.dataVersion || 1) + 1,
    overrides: existingOverrides,
  }
}

/**
 * Resets/removes a user override for a specific item, reverting to canonical default
 */
export function resetUserOverride<T = any>(
  userFile: UserCatalogFile<T>,
  targetId: string
): UserCatalogFile<T> {
  const cleanId = targetId.trim()
  const filteredOverrides = (userFile.overrides || []).filter((o) => o.targetId !== cleanId)

  return {
    ...userFile,
    dataVersion: (userFile.dataVersion || 1) + 1,
    overrides: filteredOverrides,
  }
}

/**
 * Adds a new custom USER item to UserCatalogFile with collision validation
 */
export function addUserCustomItem<T extends { id: string } = any>(
  userFile: UserCatalogFile<T>,
  item: T,
  existingCatalog: ResolvedCatalog<T>,
  customDerivedKeys?: string[]
): { success: boolean; error?: string; userFile: UserCatalogFile<T> } {
  if (!item || !item.id || typeof item.id !== "string" || !item.id.trim()) {
    return {
      success: false,
      error: "Item must have a non-empty string 'id'.",
      userFile,
    }
  }

  const cleanId = item.id.trim()

  // Check collision with existing catalog items
  if (existingCatalog.itemMap.has(cleanId)) {
    const existing = existingCatalog.itemMap.get(cleanId)!
    const isSystem = existing.provenance.sourceType === "SYSTEM"
    return {
      success: false,
      error: isSystem
        ? `Cannot add item: ID '${cleanId}' collides with canonical SYSTEM item. Use field-level override instead.`
        : `Cannot add item: ID '${cleanId}' already exists in USER items.`,
      userFile,
    }
  }

  const cleanItem = stripDerivedFields(item, customDerivedKeys) as T
  const currentCustom = Array.isArray(userFile.customItems) ? [...userFile.customItems] : []

  return {
    success: true,
    userFile: {
      ...userFile,
      dataVersion: (userFile.dataVersion || 1) + 1,
      customItems: [...currentCustom, { ...cleanItem, id: cleanId }],
    },
  }
}

/**
 * Removes or deactivates a user custom item
 */
export function removeUserCustomItem<T extends { id: string } = any>(
  userFile: UserCatalogFile<T>,
  itemId: string
): UserCatalogFile<T> {
  const cleanId = itemId.trim()
  const filtered = (userFile.customItems || []).filter((i) => i.id !== cleanId)

  return {
    ...userFile,
    dataVersion: (userFile.dataVersion || 1) + 1,
    customItems: filtered,
  }
}
