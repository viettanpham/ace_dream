/**
 * STARFRONT WORLD — Authored vs Derived Data Discipline (Phase 6.34A-FND-1)
 *
 * Rule: Master JSON only stores authored source inputs.
 * Never persist derived values if they can be calculated on the fly.
 */

/**
 * Strips specified derived keys or keys prefixed with '$' or '_' (excluding '_canonical')
 */
export function stripDerivedFields<T extends Record<string, any>>(
  item: T,
  customDerivedKeys: string[] = []
): Partial<T> {
  if (!item || typeof item !== "object") return item

  const derivedKeySet = new Set<string>([
    ...customDerivedKeys,
    "provenance",
    "_canonical",
  ])

  const clean: Record<string, any> = {}

  for (const [key, value] of Object.entries(item)) {
    // Skip explicit derived keys
    if (derivedKeySet.has(key)) continue
    // Skip transient derived keys starting with '$' or double underscore '__'
    if (key.startsWith("$") || key.startsWith("__")) continue

    if (value !== undefined) {
      clean[key] = value
    }
  }

  return clean as Partial<T>
}

/**
 * Checks whether an object contains any unstripped derived keys
 */
export function containsDerivedFields(
  item: Record<string, any>,
  customDerivedKeys: string[] = []
): { hasDerived: boolean; foundKeys: string[] } {
  const derivedKeySet = new Set<string>([
    ...customDerivedKeys,
    "provenance",
    "_canonical",
  ])

  const found: string[] = []
  for (const key of Object.keys(item)) {
    if (derivedKeySet.has(key) || key.startsWith("$") || key.startsWith("__")) {
      found.push(key)
    }
  }

  return { hasDerived: found.length > 0, foundKeys: found }
}
