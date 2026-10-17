/**
 * STARFRONT WORLD — Generic Catalog Master Data Loader (Phase 6.34A-FND-1)
 *
 * Implements:
 * - INLINE and SPLIT root modes
 * - Recursive SPLIT trees with arbitrary multi-level hierarchy
 * - Prefix validation (child must extend parent prefix)
 * - Cycle detection and maxDepth guard
 * - Fail-soft by omission (never crashes WORLD on corrupt/missing JSON files)
 */

import {
  filenameToConfigFileId,
  validateChildPrefix,
} from "./file-naming"
import type {
  CatalogDiagnosticError,
  CatalogLoadOptions,
  CatalogNodeFile,
  ICatalogDataProvider,
  ResolvedCatalogItem,
} from "./types"

export interface LoadedCatalogResult<T = any> {
  rootConfigFileId: string
  schemaVersion: number
  dataVersion: number
  mode: "INLINE" | "SPLIT"
  items: Array<ResolvedCatalogItem<T>>
  diagnostics: CatalogDiagnosticError[]
}

const DEFAULT_MAX_DEPTH = 16

/**
 * Loads a complete catalog tree starting from a canonical root file
 */
export function loadCatalogTree<T extends { id: string } = any>(
  rootFilename: string,
  provider: ICatalogDataProvider,
  options?: CatalogLoadOptions
): LoadedCatalogResult<T> {
  const diagnostics: CatalogDiagnosticError[] = []
  const maxDepth = options?.maxDepth ?? DEFAULT_MAX_DEPTH
  const items: Array<ResolvedCatalogItem<T>> = []

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

  // 1. Root file check
  if (!provider.exists(rootFilename)) {
    logDiag(
      "ROOT_FILE_MISSING",
      `Root catalog file '${rootFilename}' does not exist. Fallback to empty catalog.`,
      rootFilename
    )
    return {
      rootConfigFileId: filenameToConfigFileId(rootFilename),
      schemaVersion: 1,
      dataVersion: 1,
      mode: "INLINE",
      items: [],
      diagnostics,
    }
  }

  const rawRoot = provider.readFile(rootFilename)
  if (!rawRoot) {
    logDiag(
      "ROOT_FILE_MISSING",
      `Root catalog file '${rootFilename}' is empty or unreadable.`,
      rootFilename
    )
    return {
      rootConfigFileId: filenameToConfigFileId(rootFilename),
      schemaVersion: 1,
      dataVersion: 1,
      mode: "INLINE",
      items: [],
      diagnostics,
    }
  }

  let rootNode: CatalogNodeFile<T>
  try {
    rootNode = JSON.parse(rawRoot)
  } catch (err: any) {
    logDiag(
      "ROOT_FILE_MALFORMED",
      `Root catalog file '${rootFilename}' failed JSON parse: ${err?.message || "Unknown error"}`,
      rootFilename
    )
    return {
      rootConfigFileId: filenameToConfigFileId(rootFilename),
      schemaVersion: 1,
      dataVersion: 1,
      mode: "INLINE",
      items: [],
      diagnostics,
    }
  }

  if (!rootNode || typeof rootNode !== "object") {
    logDiag(
      "ROOT_FILE_MALFORMED",
      `Root catalog node in '${rootFilename}' is not a valid JSON object.`,
      rootFilename
    )
    return {
      rootConfigFileId: filenameToConfigFileId(rootFilename),
      schemaVersion: 1,
      dataVersion: 1,
      mode: "INLINE",
      items: [],
      diagnostics,
    }
  }

  const rootConfigFileId = rootNode.configFileId || filenameToConfigFileId(rootFilename)
  const schemaVersion = Number(rootNode.schemaVersion) || 1
  const dataVersion = Number(rootNode.dataVersion) || 1
  const rootMode = rootNode.mode === "SPLIT" ? "SPLIT" : "INLINE"

  // 2. Recursive visitor function
  const visitedAncestors = new Set<string>()

  function processNode(
    currentFilename: string,
    node: CatalogNodeFile<T>,
    currentDepth: number,
    parentConfigFileId?: string
  ) {
    const currentId = node.configFileId || filenameToConfigFileId(currentFilename)

    // Prefix validation against parent
    if (parentConfigFileId) {
      const prefixCheck = validateChildPrefix(parentConfigFileId, currentId)
      if (!prefixCheck.valid) {
        logDiag(
          "INVALID_CHILD_PREFIX",
          `Child node '${currentId}' in file '${currentFilename}' rejected: ${prefixCheck.reason}`,
          currentFilename,
          currentId
        )
        return
      }
    }

    // Process INLINE items of this node
    if (node.items && Array.isArray(node.items)) {
      for (let i = 0; i < node.items.length; i++) {
        const rawItem = node.items[i]
        if (!rawItem || typeof rawItem !== "object") {
          logDiag(
            "ITEM_MALFORMED",
            `Skipped invalid non-object item at index ${i} in '${currentFilename}'.`,
            currentFilename,
            currentId
          )
          continue
        }

        if (!rawItem.id || typeof rawItem.id !== "string" || !rawItem.id.trim()) {
          logDiag(
            "ITEM_MISSING_ID",
            `Skipped item at index ${i} in '${currentFilename}' because it lacks a non-empty string 'id'.`,
            currentFilename,
            currentId
          )
          continue
        }

        const resolvedItem: ResolvedCatalogItem<T> = {
          ...rawItem,
          id: rawItem.id.trim(),
          lifecycle: (rawItem as any).lifecycle || "ACTIVE",
          provenance: {
            sourceType: "SYSTEM",
            sourceFile: currentFilename,
            sourceCatalogId: currentId,
            sourceDataVersion: node.dataVersion || dataVersion,
            lifecycleState: (rawItem as any).lifecycle || "ACTIVE",
          },
          _canonical: { ...rawItem },
        }

        items.push(resolvedItem)
      }
    }

    // Process SPLIT partitions
    if (node.mode === "SPLIT" && Array.isArray(node.partitions)) {
      for (const partition of node.partitions) {
        if (!partition || typeof partition.ref !== "string" || !partition.ref.trim()) {
          logDiag(
            "PARTITION_FILE_MALFORMED",
            `Invalid partition reference in '${currentFilename}'.`,
            currentFilename,
            currentId
          )
          continue
        }

        const childRef = partition.ref.trim()

        // Cycle detection
        if (visitedAncestors.has(childRef)) {
          logDiag(
            "CYCLE_DETECTED",
            `Recursive cycle detected: '${childRef}' was already visited in active branch ancestors. Partition skipped.`,
            childRef,
            currentId
          )
          continue
        }

        // Max depth guard
        if (currentDepth + 1 > maxDepth) {
          logDiag(
            "MAX_DEPTH_EXCEEDED",
            `Max partition depth (${maxDepth}) exceeded at '${childRef}'. Partition skipped.`,
            childRef,
            currentId
          )
          continue
        }

        // Existence check
        if (!provider.exists(childRef)) {
          logDiag(
            "PARTITION_FILE_MISSING",
            `Partition file '${childRef}' referenced by '${currentFilename}' does not exist. Partition skipped.`,
            childRef,
            currentId
          )
          continue
        }

        const rawChild = provider.readFile(childRef)
        if (!rawChild) {
          logDiag(
            "PARTITION_FILE_MISSING",
            `Partition file '${childRef}' is empty or unreadable. Partition skipped.`,
            childRef,
            currentId
          )
          continue
        }

        let childNode: CatalogNodeFile<T>
        try {
          childNode = JSON.parse(rawChild)
        } catch (err: any) {
          logDiag(
            "PARTITION_FILE_MALFORMED",
            `Partition file '${childRef}' failed JSON parse: ${err?.message || "Unknown error"}. Partition skipped.`,
            childRef,
            currentId
          )
          continue
        }

        if (!childNode || typeof childNode !== "object") {
          logDiag(
            "PARTITION_FILE_MALFORMED",
            `Partition file '${childRef}' does not contain a JSON object. Partition skipped.`,
            childRef,
            currentId
          )
          continue
        }

        visitedAncestors.add(childRef)
        processNode(childRef, childNode, currentDepth + 1, currentId)
        visitedAncestors.delete(childRef)
      }
    }
  }

  visitedAncestors.add(rootFilename)
  processNode(rootFilename, rootNode, 0)
  visitedAncestors.delete(rootFilename)

  return {
    rootConfigFileId,
    schemaVersion,
    dataVersion,
    mode: rootMode,
    items,
    diagnostics,
  }
}
