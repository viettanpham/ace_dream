/**
 * STARFRONT WORLD — Catalog Item Lifecycle Manager (Phase 6.34A-FND-1)
 *
 * Implements lifecycle states:
 * - ACTIVE: Normal operational state; selectable for new instances.
 * - DEPRECATED: Operational with warning; discouraged from new instantiation.
 * - RETIRED: Hidden from new instance selectors; legacy save/runtime refs still resolve.
 */

import type { CatalogItemLifecycle, ResolvedCatalogItem } from "./types"

/**
 * Checks if an item can be selected for creating new runtime instances
 */
export function canSelectForNewInstance(lifecycle?: CatalogItemLifecycle): boolean {
  const state = lifecycle || "ACTIVE"
  return state === "ACTIVE"
}

/**
 * Checks if an item can be used with a deprecation warning
 */
export function isItemDeprecated(lifecycle?: CatalogItemLifecycle): boolean {
  return lifecycle === "DEPRECATED"
}

/**
 * Checks if an item is retired (cannot be created, but existing refs still resolve)
 */
export function isItemRetired(lifecycle?: CatalogItemLifecycle): boolean {
  return lifecycle === "RETIRED"
}

/**
 * Filters items for selector UI dropdowns (omits RETIRED by default)
 */
export function filterSelectableItems<T>(
  items: Array<ResolvedCatalogItem<T>>,
  options?: { includeDeprecated?: boolean; includeRetired?: boolean }
): Array<ResolvedCatalogItem<T>> {
  const includeDeprecated = options?.includeDeprecated ?? true
  const includeRetired = options?.includeRetired ?? false

  return items.filter((item) => {
    const state = item.lifecycle || "ACTIVE"
    if (state === "RETIRED") return includeRetired
    if (state === "DEPRECATED") return includeDeprecated
    return true
  })
}

/**
 * Validates whether an existing runtime reference to this item is still resolvable
 * (Always true for ACTIVE, DEPRECATED, and RETIRED)
 */
export function canResolveReference<T>(item?: ResolvedCatalogItem<T> | null): boolean {
  if (!item) return false
  return true
}
