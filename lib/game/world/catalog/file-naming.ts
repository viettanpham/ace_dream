/**
 * STARFRONT WORLD — File Naming & Prefix Validation (Phase 6.34A-FND-1)
 *
 * Implements standard naming contracts:
 * system_<domain>_<catalog>_data.json
 * user_<domain>_<catalog>_data.json
 *
 * Enforces file tree hierarchy and prefix extension rules:
 * Parent: system_fleet_ship_definition
 * Valid Child: system_fleet_ship_definition_rescue
 * Valid Grandchild: system_fleet_ship_definition_rescue_epicxxx
 */

export const SYSTEM_FILE_PREFIX = "system_"
export const USER_FILE_PREFIX = "user_"
export const DATA_FILE_SUFFIX = "_data.json"

/**
 * Builds standard system filename
 */
export function buildSystemFilename(
  domain: string,
  catalogName: string,
  partitionSuffix?: string
): string {
  const cleanDomain = domain.toLowerCase().trim()
  const cleanCatalog = catalogName.toLowerCase().trim()
  const base = `${SYSTEM_FILE_PREFIX}${cleanDomain}_${cleanCatalog}`
  if (partitionSuffix) {
    const cleanSuffix = partitionSuffix.toLowerCase().trim().replace(/^_+/, "")
    return `${base}_${cleanSuffix}${DATA_FILE_SUFFIX}`
  }
  return `${base}${DATA_FILE_SUFFIX}`
}

/**
 * Builds standard user override / custom filename
 */
export function buildUserFilename(domain: string, catalogName: string): string {
  const cleanDomain = domain.toLowerCase().trim()
  const cleanCatalog = catalogName.toLowerCase().trim()
  return `${USER_FILE_PREFIX}${cleanDomain}_${cleanCatalog}${DATA_FILE_SUFFIX}`
}

/**
 * Extracts configFileId from filename (strips extension and path)
 */
export function filenameToConfigFileId(filename: string): string {
  const base = filename.split("/").pop() || filename
  if (base.endsWith(DATA_FILE_SUFFIX)) {
    return base.slice(0, -DATA_FILE_SUFFIX.length)
  }
  if (base.endsWith(".json")) {
    return base.slice(0, -".json".length)
  }
  return base
}

/**
 * Parses configFileId into its architectural components
 */
export function parseConfigFileId(configFileIdOrFilename: string): {
  type: "system" | "user" | "unknown"
  domain: string
  catalogName: string
  suffix?: string
} | null {
  const id = filenameToConfigFileId(configFileIdOrFilename)
  let type: "system" | "user" | "unknown" = "unknown"
  let remainder = id

  if (id.startsWith(SYSTEM_FILE_PREFIX)) {
    type = "system"
    remainder = id.slice(SYSTEM_FILE_PREFIX.length)
  } else if (id.startsWith(USER_FILE_PREFIX)) {
    type = "user"
    remainder = id.slice(USER_FILE_PREFIX.length)
  } else {
    return null
  }

  const parts = remainder.split("_")
  if (parts.length < 2) return null

  const domain = parts[0]
  const catalogName = parts[1]
  const suffix = parts.length > 2 ? parts.slice(2).join("_") : undefined

  return { type, domain, catalogName, suffix }
}

/**
 * Validates that child configFileId strictly extends parent configFileId prefix
 *
 * Rules:
 * 1. Child must start with `${parentConfigFileId}_`
 * 2. Child cannot equal parent (no self-reference)
 * 3. Child cannot be shorter than parent
 * 4. Child cannot jump to another domain or catalog
 */
export function validateChildPrefix(
  parentConfigFileId: string,
  childConfigFileId: string
): { valid: boolean; reason?: string } {
  const parentId = filenameToConfigFileId(parentConfigFileId).trim()
  const childId = filenameToConfigFileId(childConfigFileId).trim()

  if (!parentId) {
    return { valid: false, reason: "Parent configFileId is empty" }
  }
  if (!childId) {
    return { valid: false, reason: "Child configFileId is empty" }
  }

  if (parentId === childId) {
    return {
      valid: false,
      reason: `Child '${childId}' is identical to parent '${parentId}' (self-reference not allowed)`,
    }
  }

  const expectedPrefix = `${parentId}_`
  if (!childId.startsWith(expectedPrefix)) {
    return {
      valid: false,
      reason: `Child '${childId}' does not strictly extend parent prefix '${expectedPrefix}'`,
    }
  }

  // Cross-domain check
  const parentParsed = parseConfigFileId(parentId)
  const childParsed = parseConfigFileId(childId)
  if (parentParsed && childParsed) {
    if (parentParsed.domain !== childParsed.domain) {
      return {
        valid: false,
        reason: `Cross-domain reference rejected: parent domain '${parentParsed.domain}' != child domain '${childParsed.domain}'`,
      }
    }
    if (parentParsed.catalogName !== childParsed.catalogName) {
      return {
        valid: false,
        reason: `Cross-catalog reference rejected: parent catalog '${parentParsed.catalogName}' != child catalog '${childParsed.catalogName}'`,
      }
    }
  }

  return { valid: true }
}
