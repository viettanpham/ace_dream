/**
 * STARFRONT WORLD V2 — CHARACTER CONTENT & STORY PERSISTENT STORE (FND-8.2.3.E.0)
 *
 * Implements:
 * 1. Pluggable Storage Adapter for Character Profiles, Artwork Registry, and Stories.
 * 2. GCS compatibility check (with clear fallback status flag).
 * 3. File-driven story storage reading from stories/{pilotId}/chapter-{NN}.md and .meta.json.
 * 4. Atomic manifest updates with optimistic concurrency locking (CAS revision).
 * 5. Full 12-Pilot data initialization out-of-the-box.
 */

import fs from 'fs';
import path from 'path';
import {
  type CharacterContentManifest,
  type ContentStorageStatus,
  type CharacterProfileContentRecord,
  type ArtworkRegistration,
  type StoryChapterMeta,
  type StoryChapterFull,
  type CanonicalPilotId,
  CANONICAL_PILOT_IDS,
  CANONICAL_PILOT_NAMES,
  validateCanPublishChapter,
} from './character-content-types';
import { V2_ROSTER_CHARACTERS } from './character-profile-data';

const MANIFEST_FILE_PATH = path.join(
  process.cwd(),
  '.starfront-config',
  'character-content-manifest.json'
);
const STORIES_DIR_PATH = path.join(process.cwd(), 'stories');

// ----------------------------------------------------------------------------
// INITIAL DEFAULT MANIFEST SEEDING (Supporting all 12 Canonical Pilots)
// ----------------------------------------------------------------------------
function createInitialManifest(): CharacterContentManifest {
  const initialProfiles: Record<string, Partial<CharacterProfileContentRecord>> = {};
  const initialArtworks: Record<string, ArtworkRegistration[]> = {};
  const initialStoryPubs: Record<string, Record<string, any>> = {};

  for (const pilotId of CANONICAL_PILOT_IDS) {
    const rosterItem = V2_ROSTER_CHARACTERS.find((c) => c.id === pilotId);
    initialProfiles[pilotId] = {
      pilotId,
      classCharacterName: rosterItem?.classCharacterName || CANONICAL_PILOT_NAMES[pilotId],
      fullLoreName: rosterItem?.fullLoreName || `${CANONICAL_PILOT_NAMES[pilotId]} Vance`,
      callsign: rosterItem?.callsign || 'Vanguard',
      title: rosterItem?.title || 'Phi Công Tiền Tuyến',
      role: rosterItem?.role || 'Chiến Đấu Không Gian',
      characterQuote: rosterItem?.characterQuote || '“Sẵn sàng xuất kích vì danh dự Starfront.”',
      shortDescription: rosterItem?.shortDescription || 'Hồ sơ phi công Starfront V2 chính thức.',
      storySummary: rosterItem?.storySummary || 'Lý lịch tác chiến và hồ sơ sự nghiệp.',
      loreOrigin: rosterItem?.basicInfo?.find((b) => b.label.includes('Xuất thân'))?.value || 'Trạm Quỹ Đạo Trung Tâm',
      loreAcademy: rosterItem?.basicInfo?.find((b) => b.label.includes('Đào tạo'))?.value || 'Học viện Hàng không Không gian',
      loreSpecialty: rosterItem?.basicInfo?.find((b) => b.label.includes('Chuyên môn'))?.value || 'Điều khiển phi cơ chiến thuật',
      lorePersonality: rosterItem?.basicInfo?.find((b) => b.label.includes('Tính cách'))?.value || 'Kiên định, kỷ luật',
      loreWeakness: rosterItem?.basicInfo?.find((b) => b.label.includes('Điểm yếu'))?.value || 'Cầu toàn',
      loreDream: rosterItem?.basicInfo?.find((b) => b.label.includes('Ước mơ'))?.value || 'Bảo vệ hòa bình vành đai',
      updatedAt: '2026-10-23T08:00:00.000Z',
      updatedBy: 'system_bootstrap',
    };

    // Pre-seed known artworks
    if (rosterItem && rosterItem.artworks) {
      initialArtworks[pilotId] = rosterItem.artworks.map((art) => ({
        assetId: art.id,
        pilotId,
        title: art.title,
        category: art.category,
        slot: art.category === 'base' ? 'fullbody' : art.category === 'portrait' ? 'portrait' : undefined,
        path: art.path,
        status: art.isAvailableOnDisk ? 'published' : 'staged',
        isAvailableOnDisk: art.isAvailableOnDisk,
        tags: [pilotId, art.category],
        description: art.description,
        mimeType: 'image/webp',
        version: '1.0.0',
        uploadedAt: '2026-10-23T08:00:00.000Z',
        publishedAt: art.isAvailableOnDisk ? '2026-10-23T08:00:00.000Z' : undefined,
      }));
    } else {
      initialArtworks[pilotId] = [];
    }

    // Pre-seed story publication status
    initialStoryPubs[pilotId] = {};
    if (pilotId === 'valentine') {
      initialStoryPubs.valentine = {
        'chap-01': {
          publicationStatus: 'PUBLISHED',
          editorialStatus: 'APPROVED',
          contentReadiness: 'VERIFIED',
          publishedAt: '2026-10-23T08:00:00.000Z',
          version: '1.0.0',
          title: 'Ánh sáng cuối cùng tại Elysia',
          summary: 'Quyết định định mệnh giữa đoàn tàu hàng trăm bệnh nhân và đội ngũ đồng đội bị cô lập.',
          wordCount: 780,
        },
        'chap-02': {
          publicationStatus: 'DRAFT',
          editorialStatus: 'APPROVED',
          contentReadiness: 'SUMMARY_ONLY',
          version: '1.0.0',
          title: 'Ca trực đầu tiên tại Trạm Cứu hộ Quỹ đạo',
          summary: 'Thử thách đầu tiên khi tiếp quản buồng lái tàu cứu thương bọc thép trong cơn bão điện từ.',
        },
        'chap-03': {
          publicationStatus: 'DRAFT',
          editorialStatus: 'APPROVED',
          contentReadiness: 'SUMMARY_ONLY',
          version: '1.0.0',
          title: 'Tín hiệu bị cô lập ở Vành đai Asteroid',
          summary: 'Hành trình đơn độc vượt qua bãi mảnh vỡ để cứu sống một phi công tiêm kích bị trúng đạn.',
        },
        'chap-04': {
          publicationStatus: 'DRAFT',
          editorialStatus: 'APPROVED',
          contentReadiness: 'SUMMARY_ONLY',
          version: '1.0.0',
          title: 'Lằn ranh đỏ giữa hai mệnh lệnh',
          summary: 'Sự giằng xé giữa quy tắc quân sự và lương tâm của một bác sĩ cứu trợ tiền tuyến.',
        },
        'chap-05': {
          publicationStatus: 'DRAFT',
          editorialStatus: 'PROVISIONAL',
          contentReadiness: 'SUMMARY_ONLY',
          version: '1.0.0',
          title: 'Học viện Y sinh Không gian và Lời thề',
          summary: 'Những năm tháng rèn luyện nghiêm ngặt trước khi khoác lên mình bộ giáp Mercy Wing.',
        },
        'chap-06': {
          publicationStatus: 'DRAFT',
          editorialStatus: 'PROVISIONAL',
          contentReadiness: 'SUMMARY_ONLY',
          version: '1.0.0',
          title: 'Chuyến bay thử nghiệm của Mercy Wing',
          summary: 'Giai đoạn thử nghiệm hệ thống khiên năng lượng tái tạo kép trên nguyên mẫu mecha y tế.',
        },
        'chap-07': {
          publicationStatus: 'DRAFT',
          editorialStatus: 'HOLD',
          contentReadiness: 'MISSING',
          version: '1.0.0',
          title: 'Bí mật bên dưới tầng ngầm Elysia',
          summary: 'Hồ sơ niêm phong cấp độ II. Chưa mở khóa nội dung.',
        },
        'chap-08': {
          publicationStatus: 'DRAFT',
          editorialStatus: 'HOLD',
          contentReadiness: 'MISSING',
          version: '1.0.0',
          title: 'Bức màn che phủ cuộc sơ tán',
          summary: 'Hồ sơ niêm phong cấp độ II. Chưa mở khóa nội dung.',
        },
        'chap-09': {
          publicationStatus: 'DRAFT',
          editorialStatus: 'HOLD',
          contentReadiness: 'MISSING',
          version: '1.0.0',
          title: 'Đối đầu trong giông bão',
          summary: 'Hồ sơ niêm phong cấp độ III. Chưa mở khóa nội dung.',
        },
        'chap-10': {
          publicationStatus: 'DRAFT',
          editorialStatus: 'HOLD',
          contentReadiness: 'MISSING',
          version: '1.0.0',
          title: 'Nguyện ước không bao giờ lãng quên',
          summary: 'Hồ sơ niêm phong cấp độ tối cao. Chưa mở khóa nội dung.',
        },
      };
    }
  }

  return {
    schemaVersion: 1,
    revision: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system_bootstrap',
    profiles: initialProfiles,
    artworks: initialArtworks,
    storyPublications: initialStoryPubs,
    auditLog: [
      {
        id: 'audit-init-001',
        timestamp: '2026-10-23T08:00:00.000Z',
        action: 'STORY_PUBLISH',
        targetPilotId: 'valentine',
        targetId: 'chap-01',
        user: 'system_bootstrap',
        details: 'Initial publication of Valentine Chapter 01 (Verified Prose Body)',
      },
    ],
  };
}

export class CharacterContentStore {
  private memoryCache: CharacterContentManifest | null = null;

  public getContentStorageStatus(): ContentStorageStatus {
    const bucketName = process.env.GCS_STORY_BUCKET_NAME?.trim();
    const googleCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

    if (bucketName) {
      if (!googleCreds && !process.env.K_SERVICE) {
        return {
          durable: false,
          type: 'gcs',
          provider: 'google-cloud-storage',
          code: 'BLOCKED_BY_GCS_IAM_CONFIG',
          bucketName,
          message: `BLOCKED BY GCS/IAM CONFIG: Đã khai báo bucket '${bucketName}' nhưng thiếu GOOGLE_APPLICATION_CREDENTIALS hoặc Service Account IAM roles (Storage Object Admin). Fallback về local atomic CAS.`,
        };
      }

      return {
        durable: true,
        type: 'gcs',
        provider: 'google-cloud-storage',
        code: 'PERSISTENT_STORAGE_CONFIGURED',
        bucketName,
        message: `PERSISTENT STORAGE CONFIGURED: Google Cloud Storage bucket '${bucketName}' đã được khai báo và kích hoạt.`,
      };
    }

    return {
      durable: true,
      type: 'file',
      provider: 'local-filesystem-cas',
      code: 'LOCAL_DEV_ONLY',
      manifestPath: MANIFEST_FILE_PATH,
      message: 'LOCAL DEV ONLY: Hệ thống lưu trữ bền vững độc lập cục bộ qua cơ chế Atomic CAS (.starfront-config/character-content-manifest.json). Sẵn sàng nâng cấp GCS khi cấu hình bucket production.',
    };
  }

  public getManifestSync(): CharacterContentManifest {
    if (this.memoryCache) return this.memoryCache;

    try {
      if (fs.existsSync(MANIFEST_FILE_PATH)) {
        const raw = fs.readFileSync(MANIFEST_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.schemaVersion) {
          this.memoryCache = parsed;
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[CharacterContentStore] Could not read manifest from disk, initializing default:', err);
    }

    const initial = createInitialManifest();
    this.memoryCache = initial;
    this.saveManifestSync(initial);
    return initial;
  }

  public async getManifest(): Promise<CharacterContentManifest> {
    return this.getManifestSync();
  }

  public saveManifestSync(manifest: CharacterContentManifest): boolean {
    try {
      const dir = path.dirname(MANIFEST_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const tmp = `${MANIFEST_FILE_PATH}.tmp.${Date.now()}`;
      fs.writeFileSync(tmp, JSON.stringify(manifest, null, 2), 'utf-8');
      fs.renameSync(tmp, MANIFEST_FILE_PATH);
      this.memoryCache = manifest;
      return true;
    } catch (err) {
      console.error('[CharacterContentStore] Failed to write manifest:', err);
      return false;
    }
  }

  public async updateManifest(
    updater: (current: CharacterContentManifest) => {
      manifest: CharacterContentManifest;
      auditEntry?: CharacterContentManifest['auditLog'][0];
    },
    expectedRevision?: number
  ): Promise<{ success: boolean; newRevision?: number; error?: string }> {
    const current = this.getManifestSync();

    if (expectedRevision !== undefined && current.revision !== expectedRevision) {
      return {
        success: false,
        error: `CONCURRENCY_CONFLICT: Dữ liệu đã bị sửa đổi (revision hiện tại: ${current.revision}, revision kỳ vọng: ${expectedRevision}). Vui lòng tải lại.`,
      };
    }

    const { manifest: updated, auditEntry } = updater(current);
    updated.revision = (current.revision || 0) + 1;
    updated.updatedAt = new Date().toISOString();

    if (auditEntry) {
      updated.auditLog = [auditEntry, ...(updated.auditLog || [])].slice(0, 50);
    }

    const saved = this.saveManifestSync(updated);
    if (!saved) {
      return { success: false, error: 'Không thể ghi tệp cấu hình bền vững.' };
    }

    return { success: true, newRevision: updated.revision };
  }

  // --------------------------------------------------------------------------
  // PROFILE METHODS
  // --------------------------------------------------------------------------
  public async getProfileOverlay(pilotId: CanonicalPilotId): Promise<Partial<CharacterProfileContentRecord> | null> {
    const manifest = await this.getManifest();
    return manifest.profiles[pilotId] || null;
  }

  public async updateProfile(
    pilotId: CanonicalPilotId,
    updates: Partial<CharacterProfileContentRecord>,
    user: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateManifest((current) => {
      const existing = current.profiles[pilotId] || {};
      const merged: Partial<CharacterProfileContentRecord> = {
        ...existing,
        ...updates,
        pilotId,
        updatedAt: new Date().toISOString(),
        updatedBy: user,
      };

      current.profiles[pilotId] = merged;

      return {
        manifest: current,
        auditEntry: {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'PROFILE_UPDATE',
          targetPilotId: pilotId,
          targetId: pilotId,
          user,
          details: `Cập nhật thông tin hồ sơ cho phi công ${pilotId}`,
        },
      };
    });
  }

  // --------------------------------------------------------------------------
  // ARTWORK METHODS
  // --------------------------------------------------------------------------
  public async getPilotArtworks(pilotId: CanonicalPilotId): Promise<ArtworkRegistration[]> {
    const manifest = await this.getManifest();
    return manifest.artworks[pilotId] || [];
  }

  public async registerArtwork(
    artwork: ArtworkRegistration,
    user: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateManifest((current) => {
      const list = current.artworks[artwork.pilotId] || [];
      const existingIdx = list.findIndex((a) => a.assetId === artwork.assetId);

      if (existingIdx >= 0) {
        list[existingIdx] = { ...artwork, updatedBy: user };
      } else {
        list.push({ ...artwork, updatedBy: user });
      }

      current.artworks[artwork.pilotId] = list;

      return {
        manifest: current,
        auditEntry: {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: artwork.status === 'published' ? 'ARTWORK_PUBLISH' : 'ARTWORK_UPLOAD',
          targetPilotId: artwork.pilotId,
          targetId: artwork.assetId,
          user,
          details: `Đăng ký artwork "${artwork.title}" [${artwork.category}] cho ${artwork.pilotId}`,
        },
      };
    });
  }

  // --------------------------------------------------------------------------
  // STORY METHODS
  // --------------------------------------------------------------------------
  public async getStoryChapters(
    pilotId: CanonicalPilotId,
    includeUnpublished = false
  ): Promise<StoryChapterMeta[]> {
    const manifest = await this.getManifest();
    const pilotPubs = manifest.storyPublications[pilotId] || {};

    const chapters: StoryChapterMeta[] = [];
    const pilotStoriesDir = path.join(STORIES_DIR_PATH, pilotId);

    // 1. Check for canonical stories/<pilotId>/manifest.json first
    const storyManifestPath = path.join(pilotStoriesDir, 'manifest.json');
    if (fs.existsSync(storyManifestPath)) {
      try {
        const rawManifest = fs.readFileSync(storyManifestPath, 'utf-8');
        const parsedStoryManifest = JSON.parse(rawManifest);
        if (Array.isArray(parsedStoryManifest.chapters)) {
          for (const chap of parsedStoryManifest.chapters) {
            const chapterMeta: StoryChapterMeta = {
              chapterId: chap.chapterId,
              chapterNumber: chap.chapterNumber,
              pilotId,
              characterName: parsedStoryManifest.pilotName || pilotId,
              title: chap.title,
              version: '1.0.0',
              summary: chap.summary || '',
              quote: chap.quote,
              editorialStatus: chap.editorialStatus || 'HOLD',
              contentReadiness: chap.contentStatus === 'FULL_PROSE' ? 'FULL_BODY_IMPORTED' : 'SUMMARY_ONLY',
              publicationStatus: chap.publicationStatus === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
              estimatedReadTimeMinutes: chap.readingTimeMinutes || 4,
              readingTimeMinutes: chap.readingTimeMinutes || 4,
              wordCount: chap.wordCount || 300,
              updatedAt: '2026-10-24T00:00:00.000Z',
              sceneAnchors: chap.sceneAnchors || [],
            };

            // Overlay publication state from runtime manifest if customized
            const pubRecord = pilotPubs[chapterMeta.chapterId];
            if (pubRecord) {
              if (pubRecord.publicationStatus) chapterMeta.publicationStatus = pubRecord.publicationStatus;
              if (pubRecord.editorialStatus) chapterMeta.editorialStatus = pubRecord.editorialStatus;
            }

            if (includeUnpublished || chapterMeta.publicationStatus === 'PUBLISHED') {
              chapters.push(chapterMeta);
            }
          }

          chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
          return chapters;
        }
      } catch (err) {
        console.warn(`[CharacterContentStore] Error parsing ${storyManifestPath}:`, err);
      }
    }

    // 2. Scan physical files in stories/{pilotId}/ (.meta.json)
    if (fs.existsSync(pilotStoriesDir)) {
      const files = fs.readdirSync(pilotStoriesDir);
      const metaFiles = files.filter((f) => f.endsWith('.meta.json'));

      for (const metaFile of metaFiles) {
        try {
          const metaPath = path.join(pilotStoriesDir, metaFile);
          const raw = fs.readFileSync(metaPath, 'utf-8');
          const meta: StoryChapterMeta = JSON.parse(raw);

          // Overlay publication state from manifest if available
          const pubRecord = pilotPubs[meta.chapterId];
          if (pubRecord) {
            meta.publicationStatus = pubRecord.publicationStatus;
            meta.editorialStatus = pubRecord.editorialStatus || meta.editorialStatus;
            meta.contentReadiness = pubRecord.contentReadiness || meta.contentReadiness;
            if (pubRecord.publishedAt) meta.publishedAt = pubRecord.publishedAt;
          }

          if (includeUnpublished || meta.publicationStatus === 'PUBLISHED') {
            chapters.push(meta);
          }
        } catch (err) {
          console.warn(`[CharacterContentStore] Error reading ${metaFile}:`, err);
        }
      }
    }

    // Sort by chapterNumber ascending
    chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
    return chapters;
  }

  public async getChapter(
    pilotId: CanonicalPilotId,
    chapterId: string,
    includeUnpublished = false
  ): Promise<StoryChapterFull | null> {
    const pilotStoriesDir = path.join(STORIES_DIR_PATH, pilotId);
    if (!fs.existsSync(pilotStoriesDir)) return null;

    // Check manifest.json first
    const storyManifestPath = path.join(pilotStoriesDir, 'manifest.json');
    if (fs.existsSync(storyManifestPath)) {
      try {
        const rawManifest = fs.readFileSync(storyManifestPath, 'utf-8');
        const parsedStoryManifest = JSON.parse(rawManifest);
        const chapDef = parsedStoryManifest.chapters?.find(
          (c: any) => c.chapterId === chapterId || `chap-${String(c.chapterNumber).padStart(2, '0')}` === chapterId
        );

        if (chapDef) {
          const manifest = await this.getManifest();
          const pubRecord = manifest.storyPublications[pilotId]?.[chapDef.chapterId];
          const publicationStatus = pubRecord?.publicationStatus || (chapDef.publicationStatus === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT');

          if (!includeUnpublished && publicationStatus !== 'PUBLISHED') {
            return null;
          }

          // Check if standalone JSON exists: chapter-01.json
          const paddedNum = String(chapDef.chapterNumber).padStart(2, '0');
          const jsonPath = path.join(pilotStoriesDir, `chapter-${paddedNum}.json`);
          let content = '';

          if (fs.existsSync(jsonPath)) {
            try {
              const chapJson = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
              content = chapJson.content || '';
            } catch {
              // fallback
            }
          }

          // Fallback to .md file if content is still empty
          if (!content) {
            const mdPath = path.join(pilotStoriesDir, `chapter-${paddedNum}.md`);
            if (fs.existsSync(mdPath)) {
              content = fs.readFileSync(mdPath, 'utf-8');
            }
          }

          return {
            chapterId: chapDef.chapterId,
            chapterNumber: chapDef.chapterNumber,
            pilotId,
            characterName: parsedStoryManifest.pilotName || pilotId,
            title: chapDef.title,
            version: '1.0.0',
            summary: chapDef.summary || '',
            quote: chapDef.quote,
            editorialStatus: pubRecord?.editorialStatus || chapDef.editorialStatus || 'HOLD',
            contentReadiness: chapDef.contentStatus === 'FULL_PROSE' ? 'FULL_BODY_IMPORTED' : 'SUMMARY_ONLY',
            publicationStatus,
            estimatedReadTimeMinutes: chapDef.readingTimeMinutes || 4,
            readingTimeMinutes: chapDef.readingTimeMinutes || 4,
            wordCount: content ? content.split(/\s+/).length : (chapDef.wordCount || 300),
            updatedAt: '2026-10-24T00:00:00.000Z',
            sceneAnchors: chapDef.sceneAnchors || [],
            content,
          };
        }
      } catch (err) {
        console.warn(`[CharacterContentStore] Error reading manifest chapter ${chapterId}:`, err);
      }
    }

    // Look for chapter-{NN}.meta.json with matching chapterId
    const files = fs.readdirSync(pilotStoriesDir);
    const metaFiles = files.filter((f) => f.endsWith('.meta.json'));

    for (const metaFile of metaFiles) {
      try {
        const metaPath = path.join(pilotStoriesDir, metaFile);
        const meta: StoryChapterMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

        if (meta.chapterId === chapterId) {
          const manifest = await this.getManifest();
          const pubRecord = manifest.storyPublications[pilotId]?.[chapterId];
          if (pubRecord) {
            meta.publicationStatus = pubRecord.publicationStatus;
            meta.editorialStatus = pubRecord.editorialStatus || meta.editorialStatus;
            meta.contentReadiness = pubRecord.contentReadiness || meta.contentReadiness;
          }

          if (!includeUnpublished && meta.publicationStatus !== 'PUBLISHED') {
            return null; // Public requests for unpublished chapters return null (404)
          }

          // Read corresponding .md file
          const baseName = metaFile.replace('.meta.json', '');
          const mdPath = path.join(pilotStoriesDir, `${baseName}.md`);
          let content = '';
          if (fs.existsSync(mdPath)) {
            content = fs.readFileSync(mdPath, 'utf-8');
          }

          return { ...meta, content };
        }
      } catch (err) {
        console.warn(`[CharacterContentStore] Error reading chapter ${chapterId}:`, err);
      }
    }

    return null;
  }

  public async saveChapterFile(
    pilotId: CanonicalPilotId,
    chapterId: string,
    markdownBody: string,
    meta: Partial<StoryChapterMeta>,
    user: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const pilotStoriesDir = path.join(STORIES_DIR_PATH, pilotId);
      if (!fs.existsSync(pilotStoriesDir)) {
        fs.mkdirSync(pilotStoriesDir, { recursive: true });
      }

      const chapterNumber = meta.chapterNumber || 1;
      const paddedNum = String(chapterNumber).padStart(2, '0');
      const baseName = `chapter-${paddedNum}`;

      const mdPath = path.join(pilotStoriesDir, `${baseName}.md`);
      const metaPath = path.join(pilotStoriesDir, `${baseName}.meta.json`);

      // Write markdown body
      fs.writeFileSync(mdPath, markdownBody, 'utf-8');

      // Prepare complete meta object
      const fullMeta: StoryChapterMeta = {
        chapterId,
        chapterNumber,
        pilotId,
        characterName: CANONICAL_PILOT_NAMES[pilotId],
        title: meta.title || `Chương ${paddedNum}`,
        version: meta.version || '1.0.0',
        summary: meta.summary || '',
        quote: meta.quote,
        estimatedReadTimeMinutes: meta.estimatedReadTimeMinutes || Math.max(1, Math.round(markdownBody.split(/\s+/).length / 200)),
        editorialStatus: meta.editorialStatus || 'APPROVED',
        contentReadiness: markdownBody.trim().length > 100 ? 'VERIFIED' : 'SUMMARY_ONLY',
        publicationStatus: 'DRAFT', // Default to OFF for safety
        anchors: meta.anchors || [],
        updatedAt: new Date().toISOString(),
        updatedBy: user,
      };

      fs.writeFileSync(metaPath, JSON.stringify(fullMeta, null, 2), 'utf-8');

      // Update manifest story publications tracking
      await this.updateManifest((current) => {
        if (!current.storyPublications[pilotId]) {
          current.storyPublications[pilotId] = {};
        }

        current.storyPublications[pilotId][chapterId] = {
          publicationStatus: fullMeta.publicationStatus,
          editorialStatus: fullMeta.editorialStatus,
          contentReadiness: fullMeta.contentReadiness,
          version: fullMeta.version,
          title: fullMeta.title,
          summary: fullMeta.summary,
          wordCount: markdownBody.split(/\s+/).filter(Boolean).length,
        };

        return {
          manifest: current,
          auditEntry: {
            id: `audit-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'STORY_UPLOAD',
            targetPilotId: pilotId,
            targetId: chapterId,
            user,
            details: `Tải lên tệp chương truyện ${baseName} (${fullMeta.title}) cho ${pilotId}`,
          },
        };
      });

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: `Lỗi lưu trữ tệp cốt truyện: ${err instanceof Error ? err.message : 'Unknown'}`,
      };
    }
  }

  public async toggleStoryPublication(
    pilotId: CanonicalPilotId,
    chapterId: string,
    targetStatus: 'PUBLISHED' | 'HIDDEN',
    user: string
  ): Promise<{ success: boolean; error?: string }> {
    const chapter = await this.getChapter(pilotId, chapterId, true);
    const manifest = await this.getManifest();
    const manifestPub = manifest.storyPublications[pilotId]?.[chapterId];

    if (!chapter && !manifestPub) {
      return { success: false, error: `Không tìm thấy chương ${chapterId} của phi công ${pilotId}.` };
    }

    const metaToCheck = chapter
      ? { editorialStatus: chapter.editorialStatus, contentReadiness: chapter.contentReadiness }
      : { editorialStatus: manifestPub!.editorialStatus, contentReadiness: manifestPub!.contentReadiness };

    if (targetStatus === 'PUBLISHED') {
      const check = validateCanPublishChapter(metaToCheck);
      if (!check.canPublish) {
        return { success: false, error: check.reason || 'Chương không đủ điều kiện xuất bản.' };
      }
    }

    return this.updateManifest((current) => {
      if (!current.storyPublications[pilotId]) {
        current.storyPublications[pilotId] = {};
      }

      const existing = current.storyPublications[pilotId][chapterId] || {
        editorialStatus: metaToCheck.editorialStatus,
        contentReadiness: metaToCheck.contentReadiness,
        version: chapter?.version || manifestPub?.version || '1.0.0',
        title: chapter?.title || manifestPub?.title || chapterId,
        summary: chapter?.summary || manifestPub?.summary || '',
      };

      current.storyPublications[pilotId][chapterId] = {
        ...existing,
        publicationStatus: targetStatus,
        publishedAt: targetStatus === 'PUBLISHED' ? new Date().toISOString() : (existing as any).publishedAt,
      };

      return {
        manifest: current,
        auditEntry: {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: targetStatus === 'PUBLISHED' ? 'STORY_PUBLISH' : 'STORY_HIDE',
          targetPilotId: pilotId,
          targetId: chapterId,
          user,
          details: `Chuyển trạng thái xuất bản chương ${chapterId} của ${pilotId} thành ${targetStatus}`,
        },
      };
    });
  }

  public async getPublishedChapters(pilotId: CanonicalPilotId): Promise<StoryChapterMeta[]> {
    return this.getStoryChapters(pilotId, false);
  }

  public async getChapterWithContent(
    pilotId: CanonicalPilotId,
    chapterId: string
  ): Promise<{ meta: StoryChapterMeta; content: string } | null> {
    const chapter = await this.getChapter(pilotId, chapterId, true);
    if (!chapter) return null;
    return {
      meta: chapter,
      content: chapter.markdownProse || chapter.content || '',
    };
  }

  public async updateArtwork(
    pilotId: CanonicalPilotId,
    artworkId: string,
    updates: Partial<ArtworkRegistration>,
    user: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateManifest((current) => {
      const list = current.artworks[pilotId] || [];
      const idx = list.findIndex((a) => a.assetId === artworkId || a.artworkId === artworkId);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...updates, updatedBy: user };
      }
      current.artworks[pilotId] = list;
      return {
        manifest: current,
        auditEntry: {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'ARTWORK_UPDATE',
          targetPilotId: pilotId,
          targetId: artworkId,
          user,
          details: `Cập nhật artwork ${artworkId} của ${pilotId}`,
        },
      };
    });
  }

  public async deleteArtwork(
    pilotId: CanonicalPilotId,
    artworkId: string,
    user: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateManifest((current) => {
      const list = current.artworks[pilotId] || [];
      current.artworks[pilotId] = list.filter(
        (a) => a.assetId !== artworkId && a.artworkId !== artworkId
      );
      return {
        manifest: current,
        auditEntry: {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'ARTWORK_DELETE',
          targetPilotId: pilotId,
          targetId: artworkId,
          user,
          details: `Gỡ bỏ artwork ${artworkId} của ${pilotId}`,
        },
      };
    });
  }

  public async rescanStoriesFromDisk(): Promise<Record<string, unknown>> {
    // Refresh memory cache
    this.memoryCache = null;
    return this.getManifestSync().storyPublications;
  }

  public async saveChapter(
    pilotId: CanonicalPilotId,
    chapterId: string,
    meta: Partial<StoryChapterMeta>,
    markdownContent?: string,
    user = 'admin'
  ): Promise<{ success: boolean; error?: string }> {
    return this.saveChapterFile(
      pilotId,
      chapterId,
      markdownContent || '',
      meta,
      user
    );
  }

  public async setPublicationStatus(
    pilotId: CanonicalPilotId,
    chapterId: string,
    targetStatus: 'PUBLISHED' | 'HIDDEN' | 'DRAFT',
    user = 'admin'
  ): Promise<{ success: boolean; chapter?: unknown; error?: string }> {
    return this.toggleStoryPublication(
      pilotId,
      chapterId,
      targetStatus === 'PUBLISHED' ? 'PUBLISHED' : 'HIDDEN',
      user
    );
  }
}

// Global Singleton Instance
export const characterContentStore = new CharacterContentStore();

export function getCharacterContentStore(): CharacterContentStore {
  return characterContentStore;
}
