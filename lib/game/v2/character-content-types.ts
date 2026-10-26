/**
 * STARFRONT WORLD V2 — CHARACTER CONTENT & STORY MANAGEMENT TYPES (FND-8.2.3.E.0)
 * 
 * Generic, data-driven architecture supporting all 12 Canonical Pilots:
 * C01 Alviss, C02 Eric, C03 Marcus, C04 Victor, C05 Kaelen, C06 Lyra,
 * C07 Selena, C08 Valentine, C09 Fortuna, C10 Aria, C11 Rhea, C12 Nova.
 */

export const CANONICAL_PILOT_IDS = [
  'alviss',
  'eric',
  'marcus',
  'victor',
  'kaelen',
  'lyra',
  'selena',
  'valentine',
  'fortuna',
  'aria',
  'rhea',
  'nova',
] as const;

export type CanonicalPilotId = (typeof CANONICAL_PILOT_IDS)[number];

export const CANONICAL_PILOT_NAMES: Record<CanonicalPilotId, string> = {
  alviss: 'Alviss',
  eric: 'Eric',
  marcus: 'Marcus',
  victor: 'Victor',
  kaelen: 'Kaelen',
  lyra: 'Lyra',
  selena: 'Selena',
  valentine: 'Valentine',
  fortuna: 'Fortuna',
  aria: 'Aria',
  rhea: 'Rhea',
  nova: 'Nova',
};

// ----------------------------------------------------------------------------
// 1. EDITABLE CHARACTER PROFILE CONTENT FIELDS
// (Base stats & gameplay traits remain immutable from Content Manager)
// ----------------------------------------------------------------------------
export interface CharacterProfileContentRecord {
  pilotId: CanonicalPilotId;
  classCharacterName: string;
  fullLoreName: string;
  callsign: string;
  title: string;
  role: string;
  characterQuote: string;
  quote?: string;
  shortDescription: string;
  storySummary: string;
  loreOrigin: string;
  originPlanet?: string;
  loreAcademy: string;
  loreSpecialty: string;
  lorePersonality: string;
  personality?: string;
  loreWeakness: string;
  loreDream: string;
  affiliation?: string;
  updatedAt: string;
  updatedBy: string;
}

// ----------------------------------------------------------------------------
// 2. ARTWORK REGISTRATION & ASSET SLOTS
// ----------------------------------------------------------------------------
export type CoreArtworkSlot = 'fullbody' | 'portrait' | 'combat' | 'closeup' | 'activity';

export type ArtworkCategory =
  | 'base'
  | 'portrait'
  | 'combat'
  | 'closeup'
  | 'activity'
  | 'costume'
  | 'event'
  | 'story'
  | 'lore'
  | 'awakened'
  | 'chibi';

export type ArtworkLifecycleStatus =
  | 'staged'
  | 'validated'
  | 'approved'
  | 'published'
  | 'verified';

export interface ArtworkRegistration {
  assetId: string;
  artworkId?: string;
  pilotId: CanonicalPilotId;
  title: string;
  label?: string;
  category: ArtworkCategory;
  slot?: CoreArtworkSlot;
  role?: string;
  roleCategory?: string;
  path: string;
  sourceUrl?: string;
  localPath?: string;
  aspectRatio?: string;
  status: ArtworkLifecycleStatus;
  verificationStatus?: string;
  isAvailableOnDisk?: boolean;
  tags?: string[];
  description?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  fileSizeBytes?: number;
  sha256?: string;
  checksumSha256?: string;
  version?: string;
  displayPriority?: number;
  priority?: number;
  uploadedAt?: string;
  registeredAt?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedBy?: string;
}

// ----------------------------------------------------------------------------
// 3. STORY TYPES & THREE INDEPENDENT STATUS DIMENSIONS
// ----------------------------------------------------------------------------
export type EditorialStatus = 'APPROVED' | 'PROVISIONAL' | 'HOLD';

export type StoryEditorialState =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'HIDDEN';

export type ContentReadiness =
  | 'MISSING'
  | 'SUMMARY_ONLY'
  | 'FULL_BODY_IMPORTED'
  | 'VERIFIED';

export type PublicationStatus = 'DRAFT' | 'HIDDEN' | 'PUBLISHED';

export interface StorySceneAnchor {
  anchorId: string;
  placementTag?: string;
  fallbackParagraphIndex?: number;
  assetId?: string;
  assetPath?: string;
  artworkUrl?: string;
  title?: string;
  caption?: string;
  description?: string;
  aspectRatio?: '16:9' | '4:3' | '1:1' | 'portrait' | string;
}

export interface StoryBlockArtwork {
  assetId: string;
  placement?: string;
  caption?: string;
  artworkUrl?: string;
}

export interface StoryBlock {
  id?: string;
  type: 'paragraph' | 'heading' | 'dialogue' | 'divider' | 'scene' | 'quote';
  text?: string;
  level?: number;
  speaker?: string;
  source?: string;
  sceneId?: string;
  anchorId?: string;
  sceneTitle?: string;
  caption?: string;
  artworks?: StoryBlockArtwork[];
}

export interface StoryChapterMeta {
  chapterId: string;
  chapterNumber: number;
  pilotId: CanonicalPilotId;
  characterName: string;
  title: string;
  canonicalLibraryTitle?: string;
  sourceConflict?: boolean;
  conflictDetails?: string;
  version: string;
  summary: string;
  quote?: string;
  estimatedReadTimeMinutes?: number;
  readingTimeMinutes?: number;
  wordCount?: number;
  editorialStatus: EditorialStatus;
  contentReadiness: ContentReadiness;
  contentStatus?: 'FULL_PROSE' | 'SUMMARY_ONLY' | string;
  publicationStatus: PublicationStatus;
  status?: StoryEditorialState | string;
  isHidden?: boolean;
  displayOrder?: number;
  contentAvailable?: boolean;
  isComingSoon?: boolean;
  publishedAt?: string;
  provenance?: {
    sourceDocument?: string;
    verifiedBy?: string;
  };
  anchors?: StorySceneAnchor[];
  sceneAnchors?: StorySceneAnchor[];
  blocks?: StoryBlock[];
  updatedAt: string;
  updatedBy?: string;
}

export interface StoryChapterFull extends StoryChapterMeta {
  content: string; // Markdown / prose body
  markdownProse?: string;
}

// ----------------------------------------------------------------------------
// 4. PERSISTENT CONTENT MANIFEST SCHEMA
// ----------------------------------------------------------------------------
export interface StoryPublicationRecord {
  publicationStatus?: PublicationStatus;
  editorialStatus?: EditorialStatus | string;
  contentReadiness?: ContentReadiness;
  status?: StoryEditorialState;
  isHidden?: boolean;
  displayOrder?: number;
  publishedAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  version?: string;
  title?: string;
  summary?: string;
  wordCount?: number;
}

export interface ContentAuditLogEntry {
  id: string;
  timestamp: string;
  action:
    | 'PROFILE_UPDATE'
    | 'ARTWORK_UPLOAD'
    | 'ARTWORK_PUBLISH'
    | 'STORY_UPLOAD'
    | 'STORY_PUBLISH'
    | 'STORY_HIDE'
    | 'ROLLBACK'
    | string;
  targetPilotId: string;
  targetId: string;
  user?: string;
  operator?: string;
  details: string;
}

export interface CharacterContentManifest {
  schemaVersion: number;
  revision: number;
  manifestRevision?: number;
  updatedAt: string;
  updatedBy: string;
  profiles: Record<string, Partial<CharacterProfileContentRecord>>;
  artworks: Record<string, ArtworkRegistration[]>;
  storyPublications: Record<string, Record<string, StoryPublicationRecord>>;
  stories?: Record<string, { chapters: StoryChapterMeta[] }>;
  auditLog: ContentAuditLogEntry[];
  auditTrail?: ContentAuditLogEntry[];
  storageStatus?: ContentStorageStatus;
}

// ----------------------------------------------------------------------------
// 5. STORAGE STATUS
// ----------------------------------------------------------------------------
export interface ContentStorageStatus {
  durable: boolean;
  type?: 'gcs' | 'file' | 'in-memory' | string;
  provider?: string;
  code: 'READY' | 'PERSISTENCE_NOT_CONFIGURED' | string;
  bucketName?: string;
  manifestPath?: string;
  message: string;
  lastSyncTimestamp?: string;
}

// ----------------------------------------------------------------------------
// 6. VALIDATION & SECURITY GATES
// ----------------------------------------------------------------------------
export function isCanonicalPilotId(val: unknown): val is CanonicalPilotId {
  return typeof val === 'string' && (CANONICAL_PILOT_IDS as readonly string[]).includes(val);
}

export function validateCanPublishChapter(meta: {
  editorialStatus: EditorialStatus;
  contentReadiness: ContentReadiness;
}): { canPublish: boolean; reason?: string } {
  if (meta.editorialStatus === 'HOLD') {
    return {
      canPublish: false,
      reason: 'Chương đang ở trạng thái HOLD (Niêm phong tối mật). Bị cấm xuất bản ra công chúng.',
    };
  }

  if (meta.editorialStatus === 'PROVISIONAL') {
    return {
      canPublish: false,
      reason: 'Chương đang ở trạng thái PROVISIONAL (Chờ phê duyệt). Cần quyết định biên tập chính thức từ chủ dự án.',
    };
  }

  if (meta.editorialStatus !== 'APPROVED') {
    return {
      canPublish: false,
      reason: 'Chỉ các chương đã được APPROVED mới đủ điều kiện xuất bản.',
    };
  }

  if (meta.contentReadiness !== 'VERIFIED') {
    return {
      canPublish: false,
      reason: 'Nội dung toàn văn chưa đạt trạng thái VERIFIED (chỉ có tóm tắt hoặc chưa kiểm chứng nguyên văn).',
    };
  }

  return { canPublish: true };
}
