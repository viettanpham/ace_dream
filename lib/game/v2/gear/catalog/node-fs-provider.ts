/**
 * STARFRONT WORLD V2 — GEAR V2 P2 Node Filesystem Raw Catalog Provider
 *
 * Server/Node-only provider reading exact raw UTF-8 files from `data/catalogs/`
 * (or a custom directory for isolated tamper tests).
 */

import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

import type { ICatalogDataProvider } from "../../../world/catalog/types"
import { GEAR_V2_CATALOG_REGISTRATIONS } from "./registration"
import type { GearV2CatalogSnapshot, GearV2ReadMode } from "./types"
import { loadGearV2CatalogSnapshot } from "./validator"

export class NodeFsRawCatalogProvider implements ICatalogDataProvider {
  public readonly baseDir: string

  constructor(baseDir: string = path.join(process.cwd(), "data", "catalogs")) {
    this.baseDir = baseDir
  }

  private resolvePath(filename: string): string {
    const clean = path.basename(filename)
    return path.join(this.baseDir, clean)
  }

  readFile(filename: string): string | null {
    const target = this.resolvePath(filename)
    if (!fs.existsSync(target)) {
      return null
    }
    return fs.readFileSync(target, "utf-8")
  }

  writeFile(filename: string, content: string): void {
    fs.mkdirSync(this.baseDir, { recursive: true })
    fs.writeFileSync(this.resolvePath(filename), content, "utf-8")
  }

  exists(filename: string): boolean {
    return fs.existsSync(this.resolvePath(filename))
  }
}

export function nodeCryptoSha256Utf8Hex(rawUtf8: string): string {
  return crypto.createHash("sha256").update(rawUtf8, "utf-8").digest("hex")
}

export interface LoadGearV2DiskSnapshotOptions {
  baseDir?: string
  mode?: GearV2ReadMode
}

export function loadGearV2CatalogSnapshotFromDisk(
  options?: LoadGearV2DiskSnapshotOptions
): GearV2CatalogSnapshot {
  const provider = new NodeFsRawCatalogProvider(options?.baseDir)
  const rawFiles: Record<string, string> = {}
  for (const reg of GEAR_V2_CATALOG_REGISTRATIONS) {
    const content = provider.readFile(reg.rootFilename)
    if (content !== null) {
      rawFiles[reg.rootFilename] = content
    }
  }

  return loadGearV2CatalogSnapshot({
    mode: options?.mode ?? "REVIEW_STAGING",
    rawFiles,
    hasher: nodeCryptoSha256Utf8Hex,
  })
}
