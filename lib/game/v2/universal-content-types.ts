/**
 * STARFRONT WORLD V2 — UNIVERSAL CONTENT FOUNDATION R3 (FND-8 / WEB-01.3.R3)
 * TypeScript Contracts and Schemas for Universal Content Management.
 * 
 * Provides unified, typed contracts for:
 * 1. Root Content Discovery Index: content-manifest.json
 * 2. Visual Art Gallery Manifest: images/pilots/<pilotId>/gallery.json & files.json
 * 3. Story Discovery Index: stories/manifest.json
 * 4. Pilot Story Manifest: stories/pilots/<pilotId>/manifest.json
 * 5. Story Chapter Prose & Scene Anchors: stories/pilots/<pilotId>/chapter-NN.json
 * 6. Canonical 12 Pilot IDs (FND-8 Standard: 4 Male / 8 Female)
 */

/**
 * 12 Canonical Pilot IDs established in FND-8 Roster Draft:
 * 4 Male: alviss, eric, marcus, victor
 * 8 Female: kaelen, lyra, selena, valentine, fortuna, aria, rhea, nova
 */
export const CANONICAL_12_PILOT_IDS = [
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

export type CanonicalPilotId = (typeof CANONICAL_12_PILOT_IDS)[number];

export function isCanonicalPilotId(id: string): id is CanonicalPilotId {
  return CANONICAL_12_PILOT_IDS.includes(id as CanonicalPilotId);
}

export const CANONICAL_PILOT_METADATA: Record<
  CanonicalPilotId,
  { name: string; callsign: string; gender: 'Male' | 'Female'; role: string }
> = {
  alviss: { name: 'Alviss Sterling', callsign: 'Black Gale', gender: 'Male', role: 'Offensive Aerial Agility' },
  eric: { name: 'Eric Vance', callsign: 'Iron Hammer', gender: 'Male', role: 'Heavy Frontal Assault' },
  marcus: { name: 'Marcus Ray', callsign: 'Aegis Vanguard', gender: 'Male', role: 'Offensive/Defensive Tactics' },
  victor: { name: 'Victor Cross', callsign: 'Titan Bastion', gender: 'Male', role: 'Armored Defense Anchor' },
  kaelen: { name: 'Kaelen Cross', callsign: 'Shadow Fang', gender: 'Female', role: 'Intelligence / Stealth Evasion' },
  lyra: { name: 'Lyra Song', callsign: 'Starling Swift', gender: 'Female', role: 'Pure Agility / Striker' },
  selena: { name: 'Selena Vega', callsign: 'Crimson Spark', gender: 'Female', role: 'Energy Artillery / Combat Caster' },
  valentine: { name: 'Valentine Aurelia Vance', callsign: 'Mercy Wing', gender: 'Female', role: 'Primary Medic / Rescue Support' },
  fortuna: { name: 'Fortuna', callsign: 'Lady Luck', gender: 'Female', role: 'Strategic Luck & Intelligence' },
  aria: { name: 'Aria Sterling', callsign: 'Blue Horizon', gender: 'Female', role: 'Flight Coordination / Ops Support' },
  rhea: { name: 'Rhea Silva', callsign: 'Vanguard Aegis', gender: 'Female', role: 'Dynamic Escort / Command Defense' },
  nova: { name: 'Nova Ray', callsign: 'Solar Flare', gender: 'Female', role: 'Experimental Assault / Test Pilot' },
};

/* =========================================================================
 * 1. ROOT DISCOVERY INDEX SCHEMA (content-manifest.json)
 * ========================================================================= */

export interface UniversalSubsystemInfo {
  status: 'active' | 'in_development' | 'maintenance' | 'disabled';
  rootPath: string;
  indexManifest: string;
  totalPilots: number;
  totalAssets?: number;
  totalPublishedChapters?: number;
}

export interface UniversalPilotContentOverview {
  name: string;
  callsign: string;
  hasGallery: boolean;
  galleryManifest: string | null;
  hasStories: boolean;
  storyManifest: string | null;
}

export interface UniversalContentRootManifest {
  schemaVersion: 'starfront-content-manifest-v3';
  releaseTag: string;
  generatedAt: string;
  sourceRepository: string;
  subsystems: {
    images: UniversalSubsystemInfo;
    stories: UniversalSubsystemInfo;
    [subsystemKey: string]: UniversalSubsystemInfo;
  };
  pilots: Record<string, UniversalPilotContentOverview>;
}

/* =========================================================================
 * 2. VISUAL ART GALLERY SCHEMAS (gallery.json & files.json)
 * ========================================================================= */

export type ArtworkCategory = 'core' | 'outfit' | 'costume' | 'event' | 'story' | 'activity' | 'portrait' | 'base' | 'other';
export type ArtworkRole = 'core_portrait' | 'core_fullbody' | 'core_combat' | 'core_closeup' | 'core_activity' | 'variant' | 'illustration';
export type ArtworkApprovalStatus = 'approved' | 'rejected' | 'draft' | 'hidden';

export interface UniversalArtworkManifestItem {
  assetId: string;
  filename: string;
  path: string;
  role: ArtworkRole | string;
  category: ArtworkCategory;
  title: string;
  description?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  byteSize: number;
  sha256: string;
  status: ArtworkApprovalStatus;
  cdnUrl?: string;
}

export interface UniversalGalleryManifest {
  schemaVersion: 'starfront-gallery-v3';
  pilotId: string;
  pilotName: string;
  totalAssets: number;
  approvedAssets: number;
  coreMapping: {
    portrait?: string;
    fullbody?: string;
    closeup?: string;
    combat?: string;
    activity?: string;
    [roleKey: string]: string | undefined;
  };
  artworks: UniversalArtworkManifestItem[];
}

export interface UniversalFileInfoItem {
  filename: string;
  byteSize: number;
  sha256: string;
  mtime: string;
  dimensions?: { width: number; height: number };
}

export interface UniversalFileInventory {
  schemaVersion: 'starfront-files-v1';
  pilotId: string;
  generatedAt: string;
  totalFiles: number;
  totalByteSize: number;
  files: Record<string, UniversalFileInfoItem>;
}

/* =========================================================================
 * 3. UNIVERSAL STORY SCHEMAS (stories/manifest.json & pilot manifests)
 * ========================================================================= */

export type StoryEditorialStatus = 'APPROVED' | 'PROVISIONAL' | 'HOLD';
export type StoryContentStatus = 'FULL_PROSE' | 'SUMMARY_ONLY' | 'MISSING' | 'DRAFT';
export type StoryPublicationStatus = 'PUBLISHED' | 'REVIEW_ONLY' | 'INTERNAL_ONLY' | 'ARCHIVED';

export interface UniversalPilotStoryIndexEntry {
  pilotName: string;
  manifest: string;
  totalChapters: number;
  publishedChaptersCount: number;
}

export interface UniversalStoryIndexManifest {
  schemaVersion: 'starfront-story-index-v1';
  releaseTag: string;
  generatedAt: string;
  totalPilotsWithStories: number;
  pilots: Record<string, UniversalPilotStoryIndexEntry>;
}

export interface UniversalSceneAnchorArtworkRef {
  assetId: string;
  placement?: 'hero' | 'inline' | 'background' | 'portrait';
  caption?: string;
}

export interface UniversalStorySceneAnchor {
  anchorId: string;
  title: string;
  caption?: string;
  assetId?: string;
  artworkUrl?: string;
  aspectRatio?: string;
  artworks?: UniversalSceneAnchorArtworkRef[];
}

export interface UniversalStoryChapterMeta {
  chapterId: string;
  chapterNumber: number;
  title: string;
  canonicalLibraryTitle?: string;
  sourceConflict?: boolean;
  conflictDetails?: string;
  editorialStatus: StoryEditorialStatus;
  contentStatus: StoryContentStatus;
  publicationStatus: StoryPublicationStatus;
  file?: string;
  summary: string;
  quote?: string;
  readingTimeMinutes: number;
  wordCount: number;
  sha256?: string;
  sceneAnchors?: UniversalStorySceneAnchor[];
}

export interface UniversalPilotStoryManifest {
  schemaVersion: 'starfront-pilot-story-v1';
  pilotId: string;
  pilotName: string;
  callsign: string;
  totalChapters: number;
  publishedChaptersCount: number;
  chapters: UniversalStoryChapterMeta[];
}

/* =========================================================================
 * 4. STORY CHAPTER CONTENT & BLOCKS SCHEMA (chapter-NN.json)
 * ========================================================================= */

export type StoryBlockType = 'paragraph' | 'heading' | 'dialogue' | 'divider' | 'scene' | 'quote';

export interface StoryBlock {
  blockId: string;
  type: StoryBlockType;
  text?: string;
  speaker?: string;
  speakerCallsign?: string;
  level?: 1 | 2 | 3;
  sceneId?: string;
  anchorId?: string;
  sceneTitle?: string;
  caption?: string;
  artworks?: UniversalSceneAnchorArtworkRef[];
}

export interface UniversalStoryChapterContent {
  schemaVersion: 'starfront-story-chapter-v1';
  pilotId: string;
  chapterId: string;
  chapterNumber: number;
  title: string;
  subtitle?: string;
  quote?: string;
  editorialStatus: StoryEditorialStatus;
  contentStatus: StoryContentStatus;
  publicationStatus: StoryPublicationStatus;
  readingTimeMinutes: number;
  wordCount: number;
  blocks: StoryBlock[];
  sha256?: string;
}

/* =========================================================================
 * 5. VALIDATION & SANITIZATION HELPERS
 * ========================================================================= */

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors: string[];
}

const PILOT_ID_REGEX = /^[a-z0-9_-]+$/;

export function validatePilotId(pilotId: string): boolean {
  if (!pilotId || typeof pilotId !== 'string') return false;
  return PILOT_ID_REGEX.test(pilotId.trim());
}

export function validateUniversalContentRoot(data: unknown): ValidationResult<UniversalContentRootManifest> {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Root manifest payload must be an object'] };
  }
  const obj = data as Partial<UniversalContentRootManifest>;
  if (obj.schemaVersion !== 'starfront-content-manifest-v3') {
    errors.push('schemaVersion must be "starfront-content-manifest-v3"');
  }
  if (!obj.releaseTag || typeof obj.releaseTag !== 'string') {
    errors.push('releaseTag is required and must be a string');
  }
  if (!obj.subsystems || typeof obj.subsystems !== 'object') {
    errors.push('subsystems map is required');
  }
  if (!obj.pilots || typeof obj.pilots !== 'object') {
    errors.push('pilots map is required');
  }
  return { valid: errors.length === 0, data: errors.length === 0 ? (obj as UniversalContentRootManifest) : undefined, errors };
}

export function validateUniversalGalleryManifest(data: unknown): ValidationResult<UniversalGalleryManifest> {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Gallery manifest payload must be an object'] };
  }
  const obj = data as Partial<UniversalGalleryManifest>;
  if (obj.schemaVersion !== 'starfront-gallery-v3') {
    errors.push('schemaVersion must be "starfront-gallery-v3"');
  }
  if (!obj.pilotId || !validatePilotId(obj.pilotId)) {
    errors.push('pilotId must be valid alphanumeric identifier');
  }
  if (!Array.isArray(obj.artworks)) {
    errors.push('artworks must be an array');
  } else {
    for (let i = 0; i < obj.artworks.length; i++) {
      const art = obj.artworks[i];
      if (!art.assetId) errors.push(`artworks[${i}].assetId is required`);
      if (!art.filename) errors.push(`artworks[${i}].filename is required`);
      if (typeof art.byteSize !== 'number') errors.push(`artworks[${i}].byteSize must be a number`);
      if (!art.sha256) errors.push(`artworks[${i}].sha256 is required`);
    }
  }
  return { valid: errors.length === 0, data: errors.length === 0 ? (obj as UniversalGalleryManifest) : undefined, errors };
}

export function validateUniversalPilotStoryManifest(data: unknown): ValidationResult<UniversalPilotStoryManifest> {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Story manifest payload must be an object'] };
  }
  const obj = data as Partial<UniversalPilotStoryManifest>;
  if (obj.schemaVersion !== 'starfront-pilot-story-v1') {
    errors.push('schemaVersion must be "starfront-pilot-story-v1"');
  }
  if (!obj.pilotId || !validatePilotId(obj.pilotId)) {
    errors.push('pilotId must be valid alphanumeric identifier');
  }
  if (!Array.isArray(obj.chapters)) {
    errors.push('chapters must be an array');
  }
  return { valid: errors.length === 0, data: errors.length === 0 ? (obj as UniversalPilotStoryManifest) : undefined, errors };
}

export function validateUniversalStoryChapterContent(data: unknown): ValidationResult<UniversalStoryChapterContent> {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Chapter payload must be an object'] };
  }
  const obj = data as Partial<UniversalStoryChapterContent>;
  if (obj.schemaVersion !== 'starfront-story-chapter-v1') {
    errors.push('schemaVersion must be "starfront-story-chapter-v1"');
  }
  if (!obj.pilotId || !validatePilotId(obj.pilotId)) {
    errors.push('pilotId must be valid alphanumeric identifier');
  }
  if (!obj.chapterId || typeof obj.chapterId !== 'string') {
    errors.push('chapterId is required');
  }
  if (!Array.isArray(obj.blocks)) {
    errors.push('blocks must be an array');
  }
  return { valid: errors.length === 0, data: errors.length === 0 ? (obj as UniversalStoryChapterContent) : undefined, errors };
}

/**
 * Gatekeeper for Public Story Delivery:
 * Enforces strict editorial check: Only chapters with APPROVED + PUBLISHED
 * can ever be rendered or delivered to the public client!
 */
export function isChapterEligibleForPublicCDN(
  editorialStatus: StoryEditorialStatus,
  publicationStatus: StoryPublicationStatus
): boolean {
  return editorialStatus === 'APPROVED' && publicationStatus === 'PUBLISHED';
}
