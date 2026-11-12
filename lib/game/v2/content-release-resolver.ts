/**
 * STARFRONT WORLD V2 — CONTENT RELEASE RESOLVER (FND-8 · CDN R4 → R5+)
 *
 * Kiến trúc bắt buộc:
 *   Runtime Config (channelUrl) → Channel JSON → Pinned Release Commit SHA →
 *   Release Manifest → Profiles Index / Galleries Index / Stories Index →
 *   Dữ liệu nhân vật, Gallery WebP (VERIFIED only) & Story Chapters.
 *
 * Cam kết kiến trúc:
 * - Không hardcode danh sách 12 Pilot, 5 chương Valentine hay đường dẫn ảnh trong React.
 * - Toàn bộ tài nguyên trong một phiên được pin chặt theo `releaseCommitSha` bất biến.
 * - Không bao giờ trộn dữ liệu R4 và R5. Nếu nạp release mới lỗi, giữ nguyên snapshot
 *   hợp lệ gần nhất (last-known-good atomic rollback).
 * - Chỉ tạo URL ảnh trình duyệt cho bản ghi có `cdnStatus === "VERIFIED"` và `cdnPath` hợp lệ.
 * - Tuyệt đối không dùng `/images/*.webp`, `sourceMetadata.path`, `repoPath`, `libraryPath`
 *   hoặc asset V1 làm fallback.
 */

import {
  contentConfig,
  getContentConfig,
  type StarfrontContentConfig,
} from './content-config'
import {
  type CharacterProfileV2,
  type CharacterProgressStatus,
  type GalleryArtwork,
  type StoryChapter,
  type BasicInfoField,
  getSystemPilotDefinition,
} from './character-profile-data'

// ============================================================================
// 1. CANONICAL R4 / R5 CDN SCHEMAS
// ============================================================================

export interface StarfrontChannelManifest {
  schemaVersion: string
  channel: string
  releaseVersion: string
  releaseCommitSha: string
  releaseManifestUrl: string
  releaseBaseUrl: string
  status: string
  updatedAt?: string
  previewOnly?: boolean
  notes?: string[]
}

export interface StarfrontReleaseManifest {
  schemaVersion: string
  releaseId: string
  channel?: string
  status: string
  generatedAt?: string
  entries: {
    profiles: string | { indexPath: string }
    galleries: string | { indexPath: string }
    stories: string | { indexPath: string }
  }
  counts?: {
    pilots?: number
    profileFiles?: number
    storyPilotCount?: number
    storyChapters?: number
    sourceGalleryArtworkRecords?: number
    physicallyVerifiedGalleryArtwork?: number
  }
  unresolvedItems?: string[]
}

export interface R4ProfilesIndexEntry {
  pilotId: string
  personaCode: string
  displayName: string
  fullName: string
  profilePath: string
  profileStatus: string
  storyAvailable: boolean
  galleryRuntimeReady: boolean
  galleryPath: string
  availableGalleryImageCount: number
}

export interface R4ProfilesIndex {
  schemaVersion: string
  releaseId: string
  generatedAt?: string
  pilotCount: number
  entries: R4ProfilesIndexEntry[]
}

export interface R4PilotProfileDocument {
  schemaVersion: string
  releaseId: string
  pilotId: string
  personaCode: string
  classCharacterName: string
  displayName: string
  fullName: string
  gender: string
  role: string
  personality: string
  shortDescription: string
  characterQuote: string
  specialties: string[]
  contentStatus: string
  proseApproval: string
  biography: {
    status: string
    source?: string
    text: string
  }
  origin: string
  training: string
  artwork?: {
    cdnManifestPath?: string
    cdnImportStatus?: string
    coreSlots?: {
      fullbody?: string
      portrait?: string
      combat?: string
      closeup?: string
      activity?: string
    }
  }
  story?: {
    available: boolean
    chapterCount: number
    manifestPath: string | null
    status: string
    emptyState: string
  }
  safetyNote?: string
}

export interface R4GalleriesIndexItem {
  pilotId: string
  manifestPath: string
  sourceRecordCount: number
  verifiedImageCount: number
}

export interface R4GalleriesIndex {
  schemaVersion: string
  status: string
  items: R4GalleriesIndexItem[]
}

export interface R4GalleryImageRecord {
  assetId: string
  filename: string
  order: number
  batch?: string
  category: string
  description?: string
  sourceApprovalStatus?: string
  expectedSha256?: string
  width?: number
  height?: number
  cdnStatus: 'VERIFIED' | 'PENDING_BINARY_IMPORT' | string
  cdnPath: string | null
  sourceMetadata?: {
    assetId?: string
    filename?: string
    path?: string
    libraryPath?: string
    repoPath?: string
    sourceFilename?: string
    category?: string
    role?: string
    outfitCode?: string
    artStyle?: string
    approvalStatus?: string
    sha256?: string
    fileSizeBytes?: number
    resolution?: string
    description?: string
    tags?: string[]
    notes?: string
  }
}

export interface R4PilotGalleryManifest {
  schemaVersion: string
  pilotId: string
  status: string
  sourceRecordCount: number
  verifiedImageCount: number
  images: R4GalleryImageRecord[]
}

export interface R4StoriesIndexItem {
  pilotId: string
  manifestPath: string
  chapterCount: number
  status: string
}

export interface R4StoriesIndex {
  schemaVersion: string
  status: string
  items: R4StoriesIndexItem[]
  emptyState: string
}

export interface R4StoryManifestChapterItem {
  chapterId: string
  chapterNumber: number
  title: string
  path: string
  editorialStatus: string
  revision?: string
  sourceIntegrity?: string
}

export interface R4PilotStoryManifest {
  schemaVersion: string
  pilotId: string
  pilotName: string
  callsign?: string
  status: string
  totalChapters: number
  publishedChaptersCount?: number
  chapters: R4StoryManifestChapterItem[]
  notes?: string[]
}

export interface R4StorySceneArtwork {
  assetId: string
  placement?: string
  caption?: string
  path?: string
  filename?: string
  imageSha256?: string
  isAvailable?: boolean
  cdnStatus?: string
  cdnPath?: string | null
  /** Được gán bởi ContentReleaseResolver khi ảnh thực sự VERIFIED trên release CDN */
  cdnVerified?: boolean
  resolvedUrl?: string
}

export interface R4StoryBlock {
  blockId: string
  type: 'heading' | 'paragraph' | 'dialogue' | 'scene'
  level?: number
  text?: string
  speaker?: string
  sceneId?: string
  sceneTitle?: string
  caption?: string
  artworks?: R4StorySceneArtwork[]
  artworkPath?: string
  artworkUrl?: string
  cdnVerified?: boolean
  resolvedArtworkUrl?: string
}

export interface R4StoryChapterDocument {
  schemaVersion: string
  pilotId: string
  chapterId: string
  chapterNumber: number
  title: string
  summary?: string
  readingTimeMinutes?: number
  wordCount?: number
  contentType?: string
  editorialStatus: string
  revision?: string
  sourceNote?: string
  sourceIntegrity?: string
  blocks: R4StoryBlock[]
  content?: string
}

// ============================================================================
// 2. SNAPSHOT & RESULT INTERFACES
// ============================================================================

export interface ResolvedPilotStoryBundle {
  pilotId: string
  manifest: R4PilotStoryManifest
  chapters: R4StoryChapterDocument[]
  chaptersById: Record<string, R4StoryChapterDocument>
}

export interface ReleaseSnapshot {
  channel: StarfrontChannelManifest
  manifest: StarfrontReleaseManifest
  releaseVersion: string
  releaseCommitSha: string
  releaseBaseUrl: string
  profilesIndex: R4ProfilesIndex
  galleriesIndex: R4GalleriesIndex
  storiesIndex: R4StoriesIndex
  pilotProfilesMap: Record<string, R4PilotProfileDocument>
  pilotGalleriesMap: Record<string, R4PilotGalleryManifest>
  pilotStoriesMap: Record<string, ResolvedPilotStoryBundle>
  characters: CharacterProfileV2[]
  loadedAt: string
}

export interface ResolveSnapshotResult {
  snapshot: ReleaseSnapshot
  fromCache: boolean
  usingFallbackSnapshot: boolean
  lastUpdateError: string | null
}

// ============================================================================
// 3. URL & PATH SECURITY VALIDATION
// ============================================================================

export class ContentReleaseError extends Error {
  public readonly code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'ContentReleaseError'
    this.code = code
  }
}

/**
 * Kiểm tra URL tuyệt đối thuộc origin CDN tin cậy, đúng repository và (nếu có) đúng commit SHA.
 */
export function validateTrustedUrl(
  rawUrl: string,
  config: StarfrontContentConfig = contentConfig,
  expectedCommitSha?: string
): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new ContentReleaseError('INVALID_URL', 'URL trống hoặc không hợp lệ.')
  }

  const trimmed = rawUrl.trim()
  if (
    trimmed.includes('..') ||
    trimmed.toLowerCase().includes('%2e%2e') ||
    trimmed.includes('\\') ||
    trimmed.includes('\0')
  ) {
    throw new ContentReleaseError(
      'PATH_TRAVERSAL_BLOCKED',
      `Phát hiện chuỗi path traversal không an toàn trong URL: ${trimmed}`
    )
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new ContentReleaseError('INVALID_URL_FORMAT', `Định dạng URL không hợp lệ: ${trimmed}`)
  }

  if (parsed.protocol !== 'https:') {
    throw new ContentReleaseError(
      'UNTRUSTED_PROTOCOL',
      `Giao thức không được phép (${parsed.protocol}). Chỉ chấp nhận HTTPS.`
    )
  }

  const isTrustedOrigin = config.trustedOrigins.some(
    (origin) => origin.toLowerCase() === parsed.origin.toLowerCase()
  )
  if (!isTrustedOrigin) {
    throw new ContentReleaseError(
      'UNTRUSTED_ORIGIN',
      `Origin không nằm trong danh sách tin cậy: ${parsed.origin}`
    )
  }

  if (
    config.allowedRepoIdentifier &&
    !parsed.pathname.includes(config.allowedRepoIdentifier)
  ) {
    throw new ContentReleaseError(
      'UNTRUSTED_REPO',
      `URL không thuộc kho tài nguyên được phép (${config.allowedRepoIdentifier}): ${parsed.pathname}`
    )
  }

  // Chặn double-slash bất thường trong pathname
  if (parsed.pathname.includes('//')) {
    throw new ContentReleaseError(
      'MALFORMED_PATHNAME',
      `Pathname chứa dấu gạch chéo kép không hợp lệ: ${parsed.pathname}`
    )
  }

  if (expectedCommitSha && !trimmed.includes(expectedCommitSha)) {
    throw new ContentReleaseError(
      'COMMIT_SHA_MISMATCH',
      `URL không khớp với releaseCommitSha đã pin (${expectedCommitSha}): ${trimmed}`
    )
  }

  return parsed.toString()
}

/**
 * Ghép một đường dẫn tương đối (`profiles/index.json`, `assets/pilots/kaelen/kaelen-fullbody.webp`)
 * vào `releaseBaseUrl` bất biến. Chặn tuyệt đối `../`, đường dẫn tuyệt đối `/images/...` hoặc khác origin.
 */
export function resolveReleaseUrl(
  releaseBaseUrl: string,
  relativePath: string,
  config: StarfrontContentConfig = contentConfig,
  expectedCommitSha?: string
): string {
  if (!relativePath || typeof relativePath !== 'string') {
    throw new ContentReleaseError('EMPTY_RELATIVE_PATH', 'Đường dẫn tài nguyên tương đối bị trống.')
  }

  const cleanRel = relativePath.trim()
  if (!cleanRel) {
    throw new ContentReleaseError('EMPTY_RELATIVE_PATH', 'Đường dẫn tài nguyên tương đối bị trống.')
  }

  // Chặn tuyệt đối đường dẫn bắt đầu bằng '/', 'http:', 'https:', '//' hoặc chứa '..', '\'
  if (
    cleanRel.startsWith('/') ||
    cleanRel.startsWith('http://') ||
    cleanRel.startsWith('https://') ||
    cleanRel.startsWith('//') ||
    cleanRel.includes('..') ||
    cleanRel.toLowerCase().includes('%2e%2e') ||
    cleanRel.includes('\\') ||
    cleanRel.includes('\0')
  ) {
    throw new ContentReleaseError(
      'UNSAFE_RELATIVE_PATH',
      `Đường dẫn tương đối không hợp lệ hoặc vi phạm bảo mật: ${cleanRel}`
    )
  }

  const normalizedBase = releaseBaseUrl.trim().endsWith('/')
    ? releaseBaseUrl.trim()
    : `${releaseBaseUrl.trim()}/`

  validateTrustedUrl(normalizedBase, config, expectedCommitSha)

  const resolved = new URL(cleanRel, normalizedBase)
  const resolvedStr = resolved.toString()

  if (!resolvedStr.startsWith(normalizedBase)) {
    throw new ContentReleaseError(
      'BASE_ESCAPE_BLOCKED',
      `Đường dẫn vượt ra ngoài phạm vi releaseBaseUrl: ${cleanRel}`
    )
  }

  return validateTrustedUrl(resolvedStr, config, expectedCommitSha)
}

/**
 * Ghép đường dẫn tương đối của chapter (ví dụ `chapter-01.json`) theo thư mục chứa story manifest
 * (`stories/valentine/manifest.json` -> `stories/valentine/chapter-01.json`).
 */
export function resolveStoryChapterRelativePath(
  storyManifestPath: string,
  chapterPath: string
): string {
  const cleanChapter = chapterPath.trim()
  if (
    !cleanChapter ||
    cleanChapter.startsWith('/') ||
    cleanChapter.includes('..') ||
    cleanChapter.includes('\\') ||
    cleanChapter.startsWith('http://') ||
    cleanChapter.startsWith('https://')
  ) {
    throw new ContentReleaseError(
      'UNSAFE_CHAPTER_PATH',
      `Đường dẫn chapter không hợp lệ: ${chapterPath}`
    )
  }

  // Nếu chapterPath đã bao gồm prefix thư mục (vd: stories/valentine/chapter-01.json)
  if (cleanChapter.startsWith('stories/')) {
    return cleanChapter
  }

  const lastSlash = storyManifestPath.lastIndexOf('/')
  const dir = lastSlash >= 0 ? storyManifestPath.slice(0, lastSlash + 1) : ''
  return `${dir}${cleanChapter}`
}

// ============================================================================
// 4. SCHEMA VALIDATORS
// ============================================================================

function extractManifestEntryPath(entry: string | { indexPath: string } | undefined, name: string): string {
  if (typeof entry === 'string' && entry.trim()) {
    return entry.trim()
  }
  if (entry && typeof entry === 'object' && typeof entry.indexPath === 'string' && entry.indexPath.trim()) {
    return entry.indexPath.trim()
  }
  throw new ContentReleaseError(
    'INVALID_RELEASE_MANIFEST',
    `Release manifest thiếu đường dẫn hợp lệ cho entries.${name}.`
  )
}

export function validateChannelManifest(
  raw: unknown,
  config: StarfrontContentConfig = contentConfig
): StarfrontChannelManifest {
  if (!raw || typeof raw !== 'object') {
    throw new ContentReleaseError('INVALID_CHANNEL_JSON', 'Channel manifest không phải là JSON object.')
  }
  const obj = raw as Record<string, unknown>

  if (obj.schemaVersion !== 'starfront-content-channel-v1') {
    throw new ContentReleaseError(
      'INVALID_CHANNEL_SCHEMA',
      `schemaVersion của channel không hợp lệ: ${String(obj.schemaVersion)}`
    )
  }
  if (typeof obj.releaseCommitSha !== 'string' || !/^[a-f0-9]{7,64}$/i.test(obj.releaseCommitSha.trim())) {
    throw new ContentReleaseError(
      'INVALID_CHANNEL_COMMIT_SHA',
      `releaseCommitSha không hợp lệ: ${String(obj.releaseCommitSha)}`
    )
  }
  if (typeof obj.releaseVersion !== 'string' || !obj.releaseVersion.trim()) {
    throw new ContentReleaseError('INVALID_CHANNEL_RELEASE_VERSION', 'Thiếu releaseVersion trong channel.')
  }
  if (typeof obj.releaseManifestUrl !== 'string' || !obj.releaseManifestUrl.trim()) {
    throw new ContentReleaseError('INVALID_CHANNEL_MANIFEST_URL', 'Thiếu releaseManifestUrl trong channel.')
  }
  if (typeof obj.releaseBaseUrl !== 'string' || !obj.releaseBaseUrl.trim()) {
    throw new ContentReleaseError('INVALID_CHANNEL_BASE_URL', 'Thiếu releaseBaseUrl trong channel.')
  }
  if (typeof obj.status !== 'string' || !obj.status.trim()) {
    throw new ContentReleaseError('INVALID_CHANNEL_STATUS', 'Thiếu status trong channel.')
  }

  const commitSha = obj.releaseCommitSha.trim()
  const manifestUrl = validateTrustedUrl(obj.releaseManifestUrl, config, commitSha)
  const baseUrlRaw = obj.releaseBaseUrl.trim().endsWith('/')
    ? obj.releaseBaseUrl.trim()
    : `${obj.releaseBaseUrl.trim()}/`
  const baseUrl = validateTrustedUrl(baseUrlRaw, config, commitSha)

  return {
    schemaVersion: obj.schemaVersion,
    channel: typeof obj.channel === 'string' ? obj.channel : 'pilot-v2-preview',
    releaseVersion: obj.releaseVersion.trim(),
    releaseCommitSha: commitSha,
    releaseManifestUrl: manifestUrl,
    releaseBaseUrl: baseUrl,
    status: obj.status.trim(),
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined,
    previewOnly: Boolean(obj.previewOnly),
    notes: Array.isArray(obj.notes) ? obj.notes.map(String) : undefined,
  }
}

export function validateReleaseManifest(raw: unknown): StarfrontReleaseManifest {
  if (!raw || typeof raw !== 'object') {
    throw new ContentReleaseError('INVALID_RELEASE_MANIFEST', 'Release manifest không phải là JSON object.')
  }
  const obj = raw as Record<string, unknown>

  if (obj.schemaVersion !== 'starfront-content-release-v1') {
    throw new ContentReleaseError(
      'INVALID_RELEASE_SCHEMA',
      `schemaVersion của release manifest không hợp lệ: ${String(obj.schemaVersion)}`
    )
  }
  if (typeof obj.releaseId !== 'string' || !obj.releaseId.trim()) {
    throw new ContentReleaseError('INVALID_RELEASE_ID', 'Release manifest thiếu releaseId.')
  }
  if (!obj.entries || typeof obj.entries !== 'object') {
    throw new ContentReleaseError('INVALID_RELEASE_ENTRIES', 'Release manifest thiếu bảng entries.')
  }

  const entries = obj.entries as Record<string, string | { indexPath: string }>
  extractManifestEntryPath(entries.profiles, 'profiles')
  extractManifestEntryPath(entries.galleries, 'galleries')
  extractManifestEntryPath(entries.stories, 'stories')

  return obj as unknown as StarfrontReleaseManifest
}

// ============================================================================
// 5. DATA ADAPTERS (PROFILES + GALLERIES + STORIES + SYSTEM REGISTRY)
// ============================================================================

function mapGalleryCategory(rawCat?: string, filename?: string): GalleryArtwork['category'] {
  const cat = (rawCat || '').toLowerCase()
  const fn = (filename || '').toLowerCase()
  if (fn.includes('-portrait')) return 'portrait'
  if (cat === 'core' || fn.includes('-fullbody') || fn.includes('-combat') || fn.includes('-closeup')) {
    return 'base'
  }
  if (cat === 'event' || fn.includes('-event')) return 'event'
  if (cat === 'activity' || fn.includes('-activity')) return 'activity'
  return 'costume'
}

function formatArtworkTitle(
  displayName: string,
  rec: R4GalleryImageRecord
): string {
  const fn = rec.filename.toLowerCase()
  if (fn.includes('-fullbody')) return `${displayName} — Fullbody Canonical`
  if (fn.includes('-portrait')) return `${displayName} — Portrait Canonical`
  if (fn.includes('-combat')) return `${displayName} — Combat Stance`
  if (fn.includes('-closeup')) return `${displayName} — Closeup Portrait`
  if (fn.includes('-activity')) return `${displayName} — Daily Activity`
  const outfitMatch = fn.match(/outfit-(\d+)/i)
  if (outfitMatch) {
    return `${displayName} — Outfit #${outfitMatch[1]}`
  }
  return `${displayName} — ${rec.assetId}`
}

/**
 * Chuyển đổi danh sách bản ghi Gallery R4/R5 của 1 Pilot sang `GalleryArtwork[]`.
 * QUY TẮC CỨNG:
 * - Chỉ tạo URL trình duyệt khi `cdnStatus === "VERIFIED"` và `cdnPath` hợp lệ.
 * - Các bản ghi `PENDING_BINARY_IMPORT` giữ `path: ""`, `isAvailableOnDisk: false`
 *   để UI hiển thị trạng thái chờ nhập ảnh nhị phân mà KHÔNG gọi `<img src="/images/...">`.
 */
export function adaptPilotGalleryManifest(
  displayName: string,
  galleryManifest: R4PilotGalleryManifest | undefined,
  releaseBaseUrl: string,
  releaseCommitSha: string,
  config: StarfrontContentConfig
): {
  artworks: GalleryArtwork[]
  verifiedArtworks: GalleryArtwork[]
  verifiedByAssetId: Map<string, GalleryArtwork>
  verifiedByFilename: Map<string, GalleryArtwork>
  verifiedCount: number
  sourceRecordCount: number
} {
  if (!galleryManifest || !Array.isArray(galleryManifest.images)) {
    return {
      artworks: [],
      verifiedArtworks: [],
      verifiedByAssetId: new Map(),
      verifiedByFilename: new Map(),
      verifiedCount: 0,
      sourceRecordCount: 0,
    }
  }

  const sortedImages = [...galleryManifest.images].sort(
    (a, b) => (a.order ?? 999) - (b.order ?? 999)
  )

  const verifiedByAssetId = new Map<string, GalleryArtwork>()
  const verifiedByFilename = new Map<string, GalleryArtwork>()
  const artworks: GalleryArtwork[] = []

  for (const rec of sortedImages) {
    const isVerified =
      rec.cdnStatus === 'VERIFIED' &&
      typeof rec.cdnPath === 'string' &&
      rec.cdnPath.trim().length > 0

    let resolvedCdnUrl = ''
    if (isVerified && rec.cdnPath) {
      resolvedCdnUrl = resolveReleaseUrl(
        releaseBaseUrl,
        rec.cdnPath,
        config,
        releaseCommitSha
      )
    }

    const artwork: GalleryArtwork = {
      id: rec.assetId || rec.filename,
      filename: rec.filename,
      order: rec.order,
      batch: rec.batch,
      title: formatArtworkTitle(displayName, rec),
      category: mapGalleryCategory(rec.category, rec.filename),
      rawCategory: rec.category,
      // Chỉ gán URL CDN khi đã VERIFIED; tuyệt đối không dùng sourceMetadata.path (/images/...)
      path: isVerified ? resolvedCdnUrl : '',
      cdnPath: rec.cdnPath,
      cdnStatus: rec.cdnStatus,
      sourceApprovalStatus: rec.sourceApprovalStatus,
      expectedSha256: rec.expectedSha256 || rec.sourceMetadata?.sha256,
      isAvailableOnDisk: isVerified,
      status: isVerified ? 'verified_webp' : 'archive_pending',
      description:
        rec.description ||
        rec.sourceMetadata?.description ||
        `Hồ sơ thị giác của ${displayName}.`,
      dimensions:
        rec.width && rec.height ? { width: rec.width, height: rec.height } : undefined,
      sourceMetadata: rec.sourceMetadata
        ? {
            path: rec.sourceMetadata.path,
            libraryPath: rec.sourceMetadata.libraryPath,
            repoPath: rec.sourceMetadata.repoPath,
            sourceFilename: rec.sourceMetadata.sourceFilename,
            resolution: rec.sourceMetadata.resolution,
            fileSizeBytes: rec.sourceMetadata.fileSizeBytes,
            sha256: rec.sourceMetadata.sha256,
            role: rec.sourceMetadata.role,
            artStyle: rec.sourceMetadata.artStyle,
            outfitCode: rec.sourceMetadata.outfitCode,
            notes: rec.sourceMetadata.notes,
            tags: rec.sourceMetadata.tags,
          }
        : undefined,
    }

    artworks.push(artwork)

    if (isVerified) {
      if (rec.assetId) {
        verifiedByAssetId.set(rec.assetId.toLowerCase(), artwork)
      }
      if (rec.filename) {
        verifiedByFilename.set(rec.filename.toLowerCase(), artwork)
      }
    }
  }

  const verifiedArtworks = artworks.filter((a) => a.isAvailableOnDisk && Boolean(a.path))
  return {
    artworks,
    verifiedArtworks,
    verifiedByAssetId,
    verifiedByFilename,
    verifiedCount: verifiedArtworks.length,
    sourceRecordCount: galleryManifest.sourceRecordCount ?? artworks.length,
  }
}

/**
 * Xác minh và gán URL cho các artwork trong `scene` blocks của Story Chapter.
 * QUY TẮC:
 * - Legacy `isAvailable: true` trong file chapter JSON KHÔNG PHẢI là bằng chứng ảnh đã có trên R4 CDN.
 * - Một artwork trong Story chỉ được tải (`cdnVerified: true`) khi:
 *   (a) Chính bản ghi artwork trong block có `cdnStatus === "VERIFIED"` và `cdnPath` hợp lệ, HOẶC
 *   (b) `assetId` / `filename` của nó khớp với một bản ghi Gallery `VERIFIED` trong cùng release
 *       (và khớp `expectedSha256` nếu `imageSha256` có mặt).
 */
export function resolveStoryChapterArtworks(
  chapter: R4StoryChapterDocument,
  verifiedByAssetId: Map<string, GalleryArtwork>,
  verifiedByFilename: Map<string, GalleryArtwork>,
  releaseBaseUrl: string,
  releaseCommitSha: string,
  config: StarfrontContentConfig
): R4StoryChapterDocument {
  const resolvedBlocks: R4StoryBlock[] = (chapter.blocks || []).map((block) => {
    if (block.type !== 'scene') {
      return { ...block }
    }

    const rawArtworks = Array.isArray(block.artworks) ? block.artworks : []
    const resolvedArtworks: R4StorySceneArtwork[] = rawArtworks.map((art) => {
      // Trường hợp 1: Bản ghi scene artwork trực tiếp khai báo cdnStatus === "VERIFIED" + cdnPath
      if (
        art.cdnStatus === 'VERIFIED' &&
        typeof art.cdnPath === 'string' &&
        art.cdnPath.trim().length > 0
      ) {
        const directUrl = resolveReleaseUrl(
          releaseBaseUrl,
          art.cdnPath,
          config,
          releaseCommitSha
        )
        return {
          ...art,
          cdnVerified: true,
          cdnStatus: 'VERIFIED',
          resolvedUrl: directUrl,
        }
      }

      // Trường hợp 2: Đối chiếu với danh mục Gallery VERIFIED của cùng release
      const byId = art.assetId ? verifiedByAssetId.get(art.assetId.toLowerCase()) : undefined
      const byFn = art.filename ? verifiedByFilename.get(art.filename.toLowerCase()) : undefined
      const matchedGalleryArt = byId || byFn

      if (matchedGalleryArt && matchedGalleryArt.isAvailableOnDisk && matchedGalleryArt.path) {
        const shaMatches =
          !art.imageSha256 ||
          !matchedGalleryArt.expectedSha256 ||
          art.imageSha256.toLowerCase() === matchedGalleryArt.expectedSha256.toLowerCase()

        if (shaMatches) {
          return {
            ...art,
            cdnVerified: true,
            cdnStatus: 'VERIFIED',
            cdnPath: matchedGalleryArt.cdnPath,
            resolvedUrl: matchedGalleryArt.path,
          }
        }
      }

      // Chưa có binary VERIFIED trên release hiện hành -> giữ trạng thái chờ đồng bộ CDN, không tạo URL 404
      return {
        ...art,
        cdnVerified: false,
        cdnStatus: art.cdnStatus || 'PENDING_BINARY_IMPORT',
        resolvedUrl: '',
      }
    })

    const firstVerified = resolvedArtworks.find((a) => a.cdnVerified && a.resolvedUrl)

    return {
      ...block,
      artworks: resolvedArtworks,
      cdnVerified: Boolean(firstVerified),
      resolvedArtworkUrl: firstVerified ? firstVerified.resolvedUrl : '',
      artworkUrl: firstVerified ? firstVerified.resolvedUrl : undefined,
    }
  })

  return {
    ...chapter,
    blocks: resolvedBlocks,
  }
}

function inferRoleCategoryFromProfile(
  roleText: string,
  systemRoleCategory?: CharacterProfileV2['roleCategory']
): CharacterProfileV2['roleCategory'] {
  if (systemRoleCategory) return systemRoleCategory
  const lower = (roleText || '').toLowerCase()
  if (
    lower.includes('hỗ trợ') ||
    lower.includes('cứu hộ') ||
    lower.includes('hậu cần') ||
    lower.includes('support')
  ) {
    return 'support'
  }
  if (
    lower.includes('phòng thủ') ||
    lower.includes('lá chắn') ||
    lower.includes('hộ vệ') ||
    lower.includes('defense')
  ) {
    return 'defense'
  }
  if (
    lower.includes('tấn công') ||
    lower.includes('xung kích') ||
    lower.includes('tiêm kích') ||
    lower.includes('attack')
  ) {
    return 'attack'
  }
  return 'special'
}

/**
 * Kết hợp dữ liệu Profile CDN + Gallery CDN + Story CDN + SYSTEM Registry thành `CharacterProfileV2`.
 */
export function buildCharacterProfileFromRelease(params: {
  indexEntry: R4ProfilesIndexEntry
  profileDoc: R4PilotProfileDocument
  galleryManifest: R4PilotGalleryManifest | undefined
  storyBundle: ResolvedPilotStoryBundle | undefined
  storiesIndexEmptyState: string
  releaseVersion: string
  releaseCommitSha: string
  releaseBaseUrl: string
  config: StarfrontContentConfig
}): CharacterProfileV2 {
  const {
    indexEntry,
    profileDoc,
    galleryManifest,
    storyBundle,
    storiesIndexEmptyState,
    releaseVersion,
    releaseCommitSha,
    releaseBaseUrl,
    config,
  } = params

  const pilotId = profileDoc.pilotId.toLowerCase().trim()
  const displayName = profileDoc.displayName || indexEntry.displayName || profileDoc.classCharacterName
  const fullName = profileDoc.fullName || indexEntry.fullName || displayName

  // 1. Adapt Gallery (VERIFIED only for URLs)
  const adaptedGallery = adaptPilotGalleryManifest(
    displayName,
    galleryManifest,
    releaseBaseUrl,
    releaseCommitSha,
    config
  )

  // Tìm ảnh fullbody và portrait ĐÃ VERIFIED trên CDN (không bao giờ dùng /images/*.webp của V1)
  const coreSlots = profileDoc.artwork?.coreSlots || {}
  const verifiedFullbody =
    (coreSlots.fullbody &&
      adaptedGallery.verifiedByFilename.get(coreSlots.fullbody.toLowerCase())) ||
    adaptedGallery.verifiedArtworks.find((a) =>
      (a.filename || '').toLowerCase().includes('-fullbody')
    ) ||
    adaptedGallery.verifiedArtworks[0]

  const verifiedPortrait =
    (coreSlots.portrait &&
      adaptedGallery.verifiedByFilename.get(coreSlots.portrait.toLowerCase())) ||
    adaptedGallery.verifiedArtworks.find((a) =>
      (a.filename || '').toLowerCase().includes('-portrait')
    ) ||
    verifiedFullbody

  const fullbodyAssetPath = verifiedFullbody?.path || ''
  const portraitAssetPath = verifiedPortrait?.path || ''

  // 2. Tra cứu SYSTEM FND-1/FND-8 Registry (không suy diễn từ biography)
  const systemDef = getSystemPilotDefinition(pilotId)
  const systemRegistryAvailable = Boolean(systemDef)

  // 3. Adapt Story Chapters từ Story Bundle của release
  const storyAvailable = Boolean(storyBundle && storyBundle.chapters.length > 0)
  const storyEmptyState =
    profileDoc.story?.emptyState ||
    storiesIndexEmptyState ||
    'Nội dung truyện đang được phát triển.'

  const chapters: StoryChapter[] = storyBundle
    ? storyBundle.chapters.map((ch) => {
        const rawStatus = (ch.editorialStatus || 'PROVISIONAL').toUpperCase()
        const normalizedStatus: StoryChapter['status'] =
          rawStatus === 'APPROVED' || rawStatus === 'PUBLISHED'
            ? 'APPROVED'
            : rawStatus === 'REVIEW'
            ? 'REVIEW'
            : rawStatus === 'HOLD'
            ? 'HOLD'
            : 'PROVISIONAL'

        return {
          id: ch.chapterId,
          number: ch.chapterNumber,
          title: ch.title,
          status: normalizedStatus,
          editorialStatus: ch.editorialStatus,
          revision: ch.revision,
          sourceIntegrity: ch.sourceIntegrity,
          sourceNote: ch.sourceNote,
          wordCount: ch.wordCount,
          readingTimeMinutes: ch.readingTimeMinutes,
          summary:
            ch.summary ||
            `Chương ${String(ch.chapterNumber).padStart(2, '0')} — ${ch.title}`,
          content: ch.content,
        }
      })
    : []

  // 4. Xây dựng Basic Dossier từ đúng các trường trong JSON R4/R5
  const genderVi =
    profileDoc.gender?.toLowerCase() === 'male' || profileDoc.gender === 'Nam'
      ? 'Nam'
      : profileDoc.gender?.toLowerCase() === 'female' || profileDoc.gender === 'Nữ'
      ? 'Nữ'
      : profileDoc.gender || 'Chưa rõ'

  const basicInfo: BasicInfoField[] = [
    { label: 'Họ Tên Đầy Đủ', value: fullName },
    { label: 'Mã Persona', value: profileDoc.personaCode || indexEntry.personaCode || pilotId.toUpperCase() },
    { label: 'Vai Trò Tác Chiến', value: profileDoc.role || 'Phi công Starfront' },
    { label: 'Giới Tính', value: genderVi },
    { label: 'Tính Cách', value: profileDoc.personality || 'Đang cập nhật' },
    { label: 'Nguồn Gốc', value: profileDoc.origin || 'Đang cập nhật' },
    { label: 'Đào Tạo', value: profileDoc.training || 'Đang cập nhật' },
    {
      label: 'Trạng Thái Hồ Sơ',
      value: `${profileDoc.contentStatus || 'PREVIEW'} · ${profileDoc.proseApproval || 'PROVISIONAL'}`,
    },
  ]

  // 5. Tính toán Progress Status trung thực theo số ảnh VERIFIED thực tế trên CDN
  const verifiedCount = adaptedGallery.verifiedCount
  const totalSourceCount = adaptedGallery.sourceRecordCount
  const isAllVerified = totalSourceCount > 0 && verifiedCount >= totalSourceCount

  const artStatus: CharacterProgressStatus['artStatus'] = isAllVerified
    ? 'COMPLETE_ART'
    : verifiedCount >= 2
    ? 'PROCESSING_USABLE'
    : verifiedCount === 1
    ? 'PROCESSING_LIMITED'
    : 'PLACEHOLDER_ONLY'

  const artStatusLabel = isAllVerified
    ? `${verifiedCount}/${totalSourceCount} WebP Verified (${releaseVersion.toUpperCase()})`
    : `${verifiedCount}/${totalSourceCount} WebP Verified · ${Math.max(0, totalSourceCount - verifiedCount)} Pending Import`

  const storyStatus: CharacterProgressStatus['storyStatus'] = storyAvailable
    ? 'PARTIAL'
    : 'MISSING'
  const storyStatusLabel = storyAvailable
    ? `${chapters.length} Chương Preview (${storyBundle?.manifest.status || 'REVIEW_PREVIEW'})`
    : 'Chưa phát hành chương truyện'

  const galleryRuntime: CharacterProgressStatus['galleryRuntime'] =
    verifiedCount > 0 ? (isAllVerified ? 'READY' : 'PARTIAL') : 'EMPTY'
  const galleryRuntimeLabel =
    verifiedCount > 0
      ? `${verifiedCount}/${totalSourceCount} WebP trên CDN (${releaseCommitSha.slice(0, 7)})`
      : 'Chờ nhập binary WebP'

  return {
    id: pilotId,
    personaCode: profileDoc.personaCode || indexEntry.personaCode,
    classCharacterName: displayName.toUpperCase(),
    fullLoreName: fullName,
    callsign: systemDef?.callsign || profileDoc.personaCode || displayName,
    title: profileDoc.role || systemDef?.title || 'Starfront Pilot',
    gender: genderVi,
    age: systemDef?.age ?? 22,
    role: profileDoc.role,
    roleCategory: inferRoleCategoryFromProfile(profileDoc.role, systemDef?.roleCategory),
    personality: profileDoc.personality,
    origin: profileDoc.origin,
    training: profileDoc.training,
    biographyText: profileDoc.biography?.text || profileDoc.shortDescription || '',
    biographyStatus: profileDoc.biography?.status || 'PROVISIONAL',
    contentStatus: profileDoc.contentStatus,
    proseApproval: profileDoc.proseApproval,
    safetyNote: profileDoc.safetyNote,
    tags: Array.isArray(profileDoc.specialties) && profileDoc.specialties.length > 0
      ? profileDoc.specialties
      : [profileDoc.role || 'Pilot'],
    characterQuote: profileDoc.characterQuote || '',
    shortDescription: profileDoc.shortDescription || '',
    baseAttributes: systemDef ? systemDef.baseAttributes : null,
    traits: systemDef ? systemDef.traits : [],
    systemRegistryAvailable,
    systemSource: systemDef
      ? systemDef.systemSource
      : 'Chưa đăng ký trong SYSTEM FND-1/FND-8 Registry',
    basicInfo,
    fullbodyAssetPath,
    portraitAssetPath,
    storyAvailable,
    storyEmptyState,
    storyManifestPath: profileDoc.story?.manifestPath || null,
    storySummary:
      profileDoc.biography?.text ||
      profileDoc.shortDescription ||
      storyEmptyState,
    chapters,
    artworks: adaptedGallery.artworks,
    verifiedArtworkCount: verifiedCount,
    totalSourceArtworkCount: totalSourceCount,
    releaseVersion,
    releaseCommitSha,
    progressStatus: {
      artStatus,
      artStatusLabel,
      profileStatus: 'COMPLETE',
      profileStatusLabel: `${profileDoc.contentStatus || 'AVAILABLE'} (${profileDoc.proseApproval || 'PROVISIONAL'})`,
      storyStatus,
      storyStatusLabel,
      galleryRuntime,
      galleryRuntimeLabel,
      registeredArtCount: totalSourceCount,
      cdnAvailableArtCount: verifiedCount,
      uiReadiness: verifiedCount > 0 ? 'READY' : 'PARTIAL',
      uiReadinessLabel: isAllVerified
        ? 'Đầy Đủ Artwork V2'
        : `Preview ${releaseVersion.toUpperCase()} (${verifiedCount}/${totalSourceCount} WebP)`,
    },
  }
}

// ============================================================================
// 6. CONTENT RELEASE RESOLVER CLASS
// ============================================================================

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

export class ContentReleaseResolver {
  private config: StarfrontContentConfig
  private fetchImpl: FetchLike
  private snapshotsByCommit = new Map<string, ReleaseSnapshot>()
  private activeSnapshot: ReleaseSnapshot | null = null
  private lastChannelCheckAt = 0
  private lastUpdateError: string | null = null
  private inFlightPromise: Promise<ResolveSnapshotResult> | null = null

  constructor(options?: {
    config?: Partial<StarfrontContentConfig>
    fetchImpl?: FetchLike
  }) {
    this.config = getContentConfig(options?.config)
    this.fetchImpl = options?.fetchImpl || ((url, init) => fetch(url, init))
  }

  public getConfig(): StarfrontContentConfig {
    return this.config
  }

  public setChannelUrl(newChannelUrl: string): void {
    const validated = validateTrustedUrl(newChannelUrl, this.config)
    this.config = {
      ...this.config,
      channelUrl: validated,
    }
    this.lastChannelCheckAt = 0
  }

  public getActiveSnapshotSync(): ReleaseSnapshot | null {
    return this.activeSnapshot
  }

  public getLastUpdateError(): string | null {
    return this.lastUpdateError
  }

  public clearCache(): void {
    this.snapshotsByCommit.clear()
    this.activeSnapshot = null
    this.lastChannelCheckAt = 0
    this.lastUpdateError = null
  }

  /**
   * Fetch JSON với timeout, retry có giới hạn và kiểm tra HTTP status + JSON parse.
   */
  private async fetchJson<T>(
    url: string,
    options?: { bypassCache?: boolean; expectedCommitSha?: string }
  ): Promise<T> {
    const safeUrl = validateTrustedUrl(url, this.config, options?.expectedCommitSha)
    let lastErr: Error | null = null
    const attempts = Math.max(1, this.config.maxRetries + 1)

    for (let attempt = 0; attempt < attempts; attempt++) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.config.fetchTimeoutMs)

      try {
        const res = await this.fetchImpl(safeUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: options?.bypassCache ? 'no-store' : 'default',
          signal: controller.signal,
        })
        clearTimeout(timer)

        if (!res.ok) {
          throw new ContentReleaseError(
            `HTTP_${res.status}`,
            `HTTP ${res.status} khi tải ${safeUrl}`
          )
        }

        const text = await res.text()
        try {
          return JSON.parse(text) as T
        } catch {
          throw new ContentReleaseError(
            'INVALID_JSON',
            `Phản hồi từ ${safeUrl} không phải JSON hợp lệ.`
          )
        }
      } catch (err) {
        clearTimeout(timer)
        lastErr = err instanceof Error ? err : new Error(String(err))
        // Không retry nếu là lỗi bảo mật / schema
        if (
          err instanceof ContentReleaseError &&
          (err.code.startsWith('UNTRUSTED_') ||
            err.code.startsWith('PATH_TRAVERSAL') ||
            err.code === 'HTTP_404' ||
            err.code === 'INVALID_JSON')
        ) {
          break
        }
      }
    }

    throw lastErr || new ContentReleaseError('FETCH_FAILED', `Không thể tải ${safeUrl}`)
  }

  /**
   * Nạp toàn bộ một phiên bản release mới theo channel manifest.
   * Tất cả index, profile, gallery và story đều được tải và kiểm tra hợp lệ
   * TRƯỚC KHI chuyển đổi nguyên tử (atomic switch).
   */
  private async loadCompleteReleaseSnapshot(
    channel: StarfrontChannelManifest
  ): Promise<ReleaseSnapshot> {
    const commitSha = channel.releaseCommitSha
    const baseUrl = channel.releaseBaseUrl

    // 1. Tải và kiểm tra Release Manifest
    const rawManifest = await this.fetchJson<unknown>(channel.releaseManifestUrl, {
      expectedCommitSha: commitSha,
    })
    const manifest = validateReleaseManifest(rawManifest)

    const profilesIndexRel = extractManifestEntryPath(manifest.entries.profiles, 'profiles')
    const galleriesIndexRel = extractManifestEntryPath(manifest.entries.galleries, 'galleries')
    const storiesIndexRel = extractManifestEntryPath(manifest.entries.stories, 'stories')

    const profilesIndexUrl = resolveReleaseUrl(baseUrl, profilesIndexRel, this.config, commitSha)
    const galleriesIndexUrl = resolveReleaseUrl(baseUrl, galleriesIndexRel, this.config, commitSha)
    const storiesIndexUrl = resolveReleaseUrl(baseUrl, storiesIndexRel, this.config, commitSha)

    // 2. Tải đồng thời 3 bảng Index của release
    const [profilesIndex, galleriesIndex, storiesIndex] = await Promise.all([
      this.fetchJson<R4ProfilesIndex>(profilesIndexUrl, { expectedCommitSha: commitSha }),
      this.fetchJson<R4GalleriesIndex>(galleriesIndexUrl, { expectedCommitSha: commitSha }),
      this.fetchJson<R4StoriesIndex>(storiesIndexUrl, { expectedCommitSha: commitSha }),
    ])

    if (!profilesIndex || !Array.isArray(profilesIndex.entries) || profilesIndex.entries.length === 0) {
      throw new ContentReleaseError(
        'INVALID_PROFILES_INDEX',
        'profiles/index.json không hợp lệ hoặc không có nhân vật nào.'
      )
    }
    if (!galleriesIndex || !Array.isArray(galleriesIndex.items)) {
      throw new ContentReleaseError(
        'INVALID_GALLERIES_INDEX',
        'galleries/index.json không hợp lệ.'
      )
    }
    if (!storiesIndex || !Array.isArray(storiesIndex.items)) {
      throw new ContentReleaseError(
        'INVALID_STORIES_INDEX',
        'stories/index.json không hợp lệ.'
      )
    }

    // 3. Tải toàn bộ Profile JSON theo đúng danh sách động trong profiles/index.json
    const pilotProfilesMap: Record<string, R4PilotProfileDocument> = {}
    await Promise.all(
      profilesIndex.entries.map(async (entry) => {
        const profileUrl = resolveReleaseUrl(baseUrl, entry.profilePath, this.config, commitSha)
        const doc = await this.fetchJson<R4PilotProfileDocument>(profileUrl, {
          expectedCommitSha: commitSha,
        })
        if (!doc || typeof doc.pilotId !== 'string') {
          throw new ContentReleaseError(
            'INVALID_PILOT_PROFILE',
            `Hồ sơ nhân vật không hợp lệ tại ${entry.profilePath}`
          )
        }
        pilotProfilesMap[doc.pilotId.toLowerCase().trim()] = doc
      })
    )

    // 4. Tải toàn bộ Gallery Manifest theo đúng danh sách động trong galleries/index.json
    const pilotGalleriesMap: Record<string, R4PilotGalleryManifest> = {}
    await Promise.all(
      galleriesIndex.items.map(async (item) => {
        const galleryUrl = resolveReleaseUrl(baseUrl, item.manifestPath, this.config, commitSha)
        const doc = await this.fetchJson<R4PilotGalleryManifest>(galleryUrl, {
          expectedCommitSha: commitSha,
        })
        if (!doc || typeof doc.pilotId !== 'string' || !Array.isArray(doc.images)) {
          throw new ContentReleaseError(
            'INVALID_GALLERY_MANIFEST',
            `Gallery manifest không hợp lệ tại ${item.manifestPath}`
          )
        }
        pilotGalleriesMap[doc.pilotId.toLowerCase().trim()] = doc
      })
    )

    // 5. Tải toàn bộ Story Manifest & Chapters theo danh sách động trong stories/index.json
    const pilotStoriesMap: Record<string, ResolvedPilotStoryBundle> = {}
    await Promise.all(
      storiesIndex.items.map(async (storyItem) => {
        const pId = storyItem.pilotId.toLowerCase().trim()
        const storyManifestUrl = resolveReleaseUrl(
          baseUrl,
          storyItem.manifestPath,
          this.config,
          commitSha
        )
        const storyManifest = await this.fetchJson<R4PilotStoryManifest>(storyManifestUrl, {
          expectedCommitSha: commitSha,
        })
        if (!storyManifest || !Array.isArray(storyManifest.chapters)) {
          throw new ContentReleaseError(
            'INVALID_STORY_MANIFEST',
            `Story manifest không hợp lệ tại ${storyItem.manifestPath}`
          )
        }

        // Lấy danh mục ảnh VERIFIED của nhân vật này trong cùng release để xác minh ảnh minh họa truyện
        const pilotProfileDoc = pilotProfilesMap[pId]
        const adaptedGal = adaptPilotGalleryManifest(
          pilotProfileDoc?.displayName || storyManifest.pilotName || pId,
          pilotGalleriesMap[pId],
          baseUrl,
          commitSha,
          this.config
        )

        const sortedManifestChapters = [...storyManifest.chapters].sort(
          (a, b) => a.chapterNumber - b.chapterNumber
        )

        const chapters: R4StoryChapterDocument[] = await Promise.all(
          sortedManifestChapters.map(async (chItem) => {
            const chapterRelPath = resolveStoryChapterRelativePath(
              storyItem.manifestPath,
              chItem.path
            )
            const chapterUrl = resolveReleaseUrl(baseUrl, chapterRelPath, this.config, commitSha)
            const rawChapter = await this.fetchJson<R4StoryChapterDocument>(chapterUrl, {
              expectedCommitSha: commitSha,
            })
            if (!rawChapter || !Array.isArray(rawChapter.blocks)) {
              throw new ContentReleaseError(
                'INVALID_STORY_CHAPTER',
                `Chapter JSON không hợp lệ tại ${chapterRelPath}`
              )
            }

            // Đồng bộ metadata từ story manifest nếu chapter JSON thiếu
            const mergedChapter: R4StoryChapterDocument = {
              ...rawChapter,
              chapterId: rawChapter.chapterId || chItem.chapterId,
              chapterNumber: rawChapter.chapterNumber ?? chItem.chapterNumber,
              title: rawChapter.title || chItem.title,
              editorialStatus: rawChapter.editorialStatus || chItem.editorialStatus,
              revision: rawChapter.revision || chItem.revision,
              sourceIntegrity: rawChapter.sourceIntegrity || chItem.sourceIntegrity,
            }

            return resolveStoryChapterArtworks(
              mergedChapter,
              adaptedGal.verifiedByAssetId,
              adaptedGal.verifiedByFilename,
              baseUrl,
              commitSha,
              this.config
            )
          })
        )

        const chaptersById: Record<string, R4StoryChapterDocument> = {}
        for (const ch of chapters) {
          chaptersById[ch.chapterId.toLowerCase()] = ch
          chaptersById[`chap-${String(ch.chapterNumber).padStart(2, '0')}`] = ch
          chaptersById[`chapter-${String(ch.chapterNumber).padStart(2, '0')}`] = ch
          chaptersById[String(ch.chapterNumber)] = ch
        }

        pilotStoriesMap[pId] = {
          pilotId: pId,
          manifest: storyManifest,
          chapters,
          chaptersById,
        }
      })
    )

    // 6. Xây dựng danh sách CharacterProfileV2 theo đúng thứ tự trong profiles/index.json
    const characters: CharacterProfileV2[] = profilesIndex.entries.map((entry) => {
      const pId = entry.pilotId.toLowerCase().trim()
      const profileDoc = pilotProfilesMap[pId]
      return buildCharacterProfileFromRelease({
        indexEntry: entry,
        profileDoc,
        galleryManifest: pilotGalleriesMap[pId],
        storyBundle: pilotStoriesMap[pId],
        storiesIndexEmptyState: storiesIndex.emptyState,
        releaseVersion: channel.releaseVersion,
        releaseCommitSha: commitSha,
        releaseBaseUrl: baseUrl,
        config: this.config,
      })
    })

    return {
      channel,
      manifest,
      releaseVersion: channel.releaseVersion,
      releaseCommitSha: commitSha,
      releaseBaseUrl: baseUrl,
      profilesIndex,
      galleriesIndex,
      storiesIndex,
      pilotProfilesMap,
      pilotGalleriesMap,
      pilotStoriesMap,
      characters,
      loadedAt: new Date().toISOString(),
    }
  }

  /**
   * Kiểm tra kênh cấu hình và phân giải ReleaseSnapshot.
   * - Nếu có snapshot hợp lệ trong bộ nhớ và chưa hết TTL (trừ khi `forceRefresh: true`), trả về ngay.
   * - Nếu phát hiện `releaseCommitSha` mới trên channel (ví dụ nâng cấp R4 -> R5), tải và xác thực
   *   toàn bộ release mới trước khi chuyển đổi nguyên tử.
   * - Nếu quá trình kiểm tra channel hoặc tải release mới gặp lỗi mà đã có `activeSnapshot`,
   *   giữ nguyên `activeSnapshot` (last-known-good) và báo `usingFallbackSnapshot: true`.
   */
  public async resolveSnapshot(options?: {
    forceRefresh?: boolean
  }): Promise<ResolveSnapshotResult> {
    const forceRefresh = Boolean(options?.forceRefresh)
    const now = Date.now()

    if (
      !forceRefresh &&
      this.activeSnapshot &&
      now - this.lastChannelCheckAt < this.config.channelCacheTtlMs
    ) {
      return {
        snapshot: this.activeSnapshot,
        fromCache: true,
        usingFallbackSnapshot: false,
        lastUpdateError: this.lastUpdateError,
      }
    }

    if (this.inFlightPromise) {
      return this.inFlightPromise
    }

    this.inFlightPromise = (async (): Promise<ResolveSnapshotResult> => {
      try {
        const rawChannel = await this.fetchJson<unknown>(this.config.channelUrl, {
          bypassCache: forceRefresh,
        })
        const channel = validateChannelManifest(rawChannel, this.config)
        this.lastChannelCheckAt = Date.now()

        // Kiểm tra xem commit SHA này đã được nạp hoàn chỉnh trong bộ nhớ chưa
        const cachedForCommit = this.snapshotsByCommit.get(channel.releaseCommitSha)
        if (cachedForCommit) {
          this.activeSnapshot = cachedForCommit
          this.lastUpdateError = null
          return {
            snapshot: cachedForCommit,
            fromCache: true,
            usingFallbackSnapshot: false,
            lastUpdateError: null,
          }
        }

        // Phát hiện commit SHA mới -> tải toàn bộ release mới trước khi switch nguyên tử
        const freshSnapshot = await this.loadCompleteReleaseSnapshot(channel)
        this.snapshotsByCommit.set(channel.releaseCommitSha, freshSnapshot)
        this.activeSnapshot = freshSnapshot
        this.lastUpdateError = null

        return {
          snapshot: freshSnapshot,
          fromCache: false,
          usingFallbackSnapshot: false,
          lastUpdateError: null,
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        this.lastUpdateError = message

        // Rollback nguyên tử về snapshot hợp lệ gần nhất nếu đã có
        if (this.activeSnapshot) {
          return {
            snapshot: this.activeSnapshot,
            fromCache: true,
            usingFallbackSnapshot: true,
            lastUpdateError: message,
          }
        }

        throw err
      } finally {
        this.inFlightPromise = null
      }
    })()

    return this.inFlightPromise
  }

  /**
   * Trả về danh sách tất cả Pilot trong release hiện hành.
   */
  public async getRosterProfiles(options?: {
    forceRefresh?: boolean
  }): Promise<CharacterProfileV2[]> {
    const { snapshot } = await this.resolveSnapshot(options)
    return snapshot.characters
  }

  /**
   * Trả về hồ sơ chi tiết của 1 Pilot theo `pilotId`.
   */
  public async getPilotProfile(
    pilotId: string,
    options?: { forceRefresh?: boolean }
  ): Promise<CharacterProfileV2 | null> {
    const cleanId = pilotId.toLowerCase().trim()
    const { snapshot } = await this.resolveSnapshot(options)
    return snapshot.characters.find((c) => c.id === cleanId) || null
  }

  /**
   * Trả về dữ liệu Gallery của 1 Pilot từ release hiện hành.
   */
  public async getPilotGallery(
    pilotId: string,
    options?: { forceRefresh?: boolean }
  ): Promise<{
    pilotId: string
    pilotName: string
    releaseVersion: string
    releaseCommitSha: string
    status: string
    sourceRecordCount: number
    verifiedImageCount: number
    artworks: GalleryArtwork[]
    verifiedArtworks: GalleryArtwork[]
    pendingArtworks: GalleryArtwork[]
  } | null> {
    const cleanId = pilotId.toLowerCase().trim()
    const { snapshot } = await this.resolveSnapshot(options)
    const character = snapshot.characters.find((c) => c.id === cleanId)
    const rawGallery = snapshot.pilotGalleriesMap[cleanId]
    if (!character || !rawGallery) {
      return null
    }

    const verifiedArtworks = character.artworks.filter(
      (a) => a.isAvailableOnDisk && Boolean(a.path)
    )
    const pendingArtworks = character.artworks.filter((a) => !a.isAvailableOnDisk)

    return {
      pilotId: cleanId,
      pilotName: character.fullLoreName,
      releaseVersion: snapshot.releaseVersion,
      releaseCommitSha: snapshot.releaseCommitSha,
      status: rawGallery.status,
      sourceRecordCount: rawGallery.sourceRecordCount,
      verifiedImageCount: verifiedArtworks.length,
      artworks: character.artworks,
      verifiedArtworks,
      pendingArtworks,
    }
  }

  /**
   * Trả về danh mục Story của 1 Pilot (hoặc trạng thái emptyState nếu Pilot chưa có truyện).
   */
  public async getPilotStoryCatalog(
    pilotId: string,
    options?: { forceRefresh?: boolean }
  ): Promise<{
    pilotId: string
    pilotName: string
    callsign: string
    available: boolean
    status: string
    emptyState: string
    releaseVersion: string
    releaseCommitSha: string
    totalChapters: number
    chapters: StoryChapter[]
  }> {
    const cleanId = pilotId.toLowerCase().trim()
    const { snapshot } = await this.resolveSnapshot(options)
    const character = snapshot.characters.find((c) => c.id === cleanId)
    const storyBundle = snapshot.pilotStoriesMap[cleanId]

    if (!storyBundle) {
      return {
        pilotId: cleanId,
        pilotName: character?.fullLoreName || cleanId,
        callsign: character?.callsign || cleanId.toUpperCase(),
        available: false,
        status: 'EMPTY',
        emptyState:
          character?.storyEmptyState ||
          snapshot.storiesIndex.emptyState ||
          'Nội dung truyện đang được phát triển.',
        releaseVersion: snapshot.releaseVersion,
        releaseCommitSha: snapshot.releaseCommitSha,
        totalChapters: 0,
        chapters: [],
      }
    }

    return {
      pilotId: cleanId,
      pilotName: storyBundle.manifest.pilotName || character?.fullLoreName || cleanId,
      callsign: storyBundle.manifest.callsign || character?.callsign || '',
      available: true,
      status: storyBundle.manifest.status,
      emptyState:
        character?.storyEmptyState ||
        snapshot.storiesIndex.emptyState ||
        'Nội dung truyện đang được phát triển.',
      releaseVersion: snapshot.releaseVersion,
      releaseCommitSha: snapshot.releaseCommitSha,
      totalChapters: storyBundle.chapters.length,
      chapters: character?.chapters || [],
    }
  }

  /**
   * Trả về toàn văn và cấu trúc blocks[] của 1 chương truyện trong release hiện hành.
   */
  public async getPilotStoryChapter(
    pilotId: string,
    chapterIdOrNumber: string,
    options?: { forceRefresh?: boolean }
  ): Promise<{
    chapter: R4StoryChapterDocument
    releaseVersion: string
    releaseCommitSha: string
  } | null> {
    const cleanPilotId = pilotId.toLowerCase().trim()
    const rawKey = chapterIdOrNumber.toLowerCase().trim()
    const { snapshot } = await this.resolveSnapshot(options)
    const bundle = snapshot.pilotStoriesMap[cleanPilotId]
    if (!bundle) {
      return null
    }

    // Hỗ trợ tra cứu theo "chap-01", "valentine-chap-01", "chapter-01", "1"
    const normalizedKey = rawKey.replace(`${cleanPilotId}-`, '')
    const found =
      bundle.chaptersById[rawKey] ||
      bundle.chaptersById[normalizedKey] ||
      bundle.chapters.find(
        (c) =>
          c.chapterId.toLowerCase() === rawKey ||
          c.chapterId.toLowerCase() === normalizedKey
      )

    if (!found) {
      return null
    }

    return {
      chapter: found,
      releaseVersion: snapshot.releaseVersion,
      releaseCommitSha: snapshot.releaseCommitSha,
    }
  }
}

// Singleton mặc định cho toàn ứng dụng
export const contentReleaseResolver = new ContentReleaseResolver()
