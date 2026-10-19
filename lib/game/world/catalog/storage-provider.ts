/**
 * STARFRONT WORLD — Catalog Data Providers (Phase 6.34A-FND-1)
 *
 * Pluggable providers to read/write JSON files across:
 * 1. InMemoryCatalogDataProvider: For tests, mocks, and node runtimes
 * 2. LocalStorageCatalogDataProvider: For browser runtime persistence
 */

import type { ICatalogDataProvider } from "./types"

/**
 * In-memory provider for unit tests and deterministic runtime mocks
 */
export class InMemoryCatalogDataProvider implements ICatalogDataProvider {
  private files: Map<string, string> = new Map()

  constructor(initialFiles?: Record<string, string | object>) {
    if (initialFiles) {
      for (const [key, value] of Object.entries(initialFiles)) {
        const content = typeof value === "string" ? value : JSON.stringify(value, null, 2)
        this.files.set(key, content)
      }
    }
  }

  readFile(filename: string): string | null {
    return this.files.get(filename) ?? null
  }

  writeFile(filename: string, content: string): void {
    this.files.set(filename, content)
  }

  exists(filename: string): boolean {
    return this.files.has(filename)
  }

  deleteFile(filename: string): void {
    this.files.delete(filename)
  }

  clear(): void {
    this.files.clear()
  }

  getAllFilenames(): string[] {
    return Array.from(this.files.keys())
  }
}

/**
 * LocalStorage provider with in-memory fallback for user overrides/custom items
 */
export class LocalStorageCatalogDataProvider implements ICatalogDataProvider {
  private memoryFallback: Map<string, string> = new Map()
  private storagePrefix = "STARFRONT_CATALOG_FILE_"

  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  }

  private getStorageKey(filename: string): string {
    return `${this.storagePrefix}${filename}`
  }

  readFile(filename: string): string | null {
    if (this.isBrowser()) {
      try {
        const val = localStorage.getItem(this.getStorageKey(filename))
        if (val !== null) return val
      } catch {
        // Fallback to memory
      }
    }
    return this.memoryFallback.get(filename) ?? null
  }

  writeFile(filename: string, content: string): void {
    if (this.isBrowser()) {
      try {
        localStorage.setItem(this.getStorageKey(filename), content)
      } catch {
        // Fallback to memory
      }
    }
    this.memoryFallback.set(filename, content)
  }

  exists(filename: string): boolean {
    if (this.isBrowser()) {
      try {
        if (localStorage.getItem(this.getStorageKey(filename)) !== null) return true
      } catch {
        // Fallback to memory
      }
    }
    return this.memoryFallback.has(filename)
  }

  deleteFile(filename: string): void {
    if (this.isBrowser()) {
      try {
        localStorage.removeItem(this.getStorageKey(filename))
      } catch {
        // Fallback to memory
      }
    }
    this.memoryFallback.delete(filename)
  }
}
