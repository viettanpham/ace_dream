import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';

import {
  CANONICAL_PILOT_IDS,
  CanonicalPilotId,
  validateCanPublishChapter,
  StoryChapterMeta,
} from '../lib/game/v2/character-content-types';
import { CharacterContentStore } from '../lib/game/v2/character-content-store';

describe('STARFRONT WORLD V2 — FND-8.2.3.E.0 E2E TEST SUITE', () => {
  it('1. Đảm bảo Catalog hỗ trợ chính xác 12 phi công Canonical V2', () => {
    assert.strictEqual(CANONICAL_PILOT_IDS.length, 12, 'Phải có đúng 12 canonical pilots');
    const expected = [
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
    ];
    for (const id of expected) {
      assert.ok(
        CANONICAL_PILOT_IDS.includes(id as CanonicalPilotId),
        `Pilot ${id} phải nằm trong CANONICAL_PILOT_IDS`
      );
    }
  });

  it('2. Kiểm tra Valentine Chapter 01 Canonical Prose & Scene Anchors', () => {
    const mdPath = path.join(process.cwd(), 'stories', 'valentine', 'chapter-01.md');
    const metaPath = path.join(process.cwd(), 'stories', 'valentine', 'chapter-01.meta.json');

    assert.ok(fs.existsSync(mdPath), 'File chapter-01.md của Valentine phải tồn tại');
    assert.ok(fs.existsSync(metaPath), 'File chapter-01.meta.json của Valentine phải tồn tại');

    const prose = fs.readFileSync(mdPath, 'utf-8');
    const meta: StoryChapterMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

    // Kiểm tra các mốc Scene Anchor trong Markdown
    assert.ok(
      prose.includes('<!-- story-anchor: val-ch01-scene-academy -->'),
      'Phải chứa anchor val-ch01-scene-academy'
    );
    assert.ok(
      prose.includes('<!-- story-anchor: val-ch01-scene-evac -->'),
      'Phải chứa anchor val-ch01-scene-evac'
    );
    assert.ok(
      prose.includes('<!-- story-anchor: val-ch01-scene-resolve -->'),
      'Phải chứa anchor val-ch01-scene-resolve'
    );

    // Kiểm tra metadata
    assert.strictEqual(meta.editorialStatus, 'APPROVED');
    assert.strictEqual(meta.contentReadiness, 'VERIFIED');
    assert.strictEqual(meta.publicationStatus, 'PUBLISHED');
    const anchorsList = meta.anchors || (meta as any).sceneAnchors || [];
    assert.strictEqual(anchorsList.length, 3);

    // Kiểm tra gate validation
    const gate = validateCanPublishChapter(meta);
    assert.strictEqual(gate.canPublish, true, 'Valentine Chap 01 phải được duyệt xuất bản');
  });

  it('3. Kiểm tra Validation Gates chặn nghiêm ngặt các chương HOLD / PROVISIONAL', () => {
    const holdChapter: StoryChapterMeta = {
      chapterId: 'chap-08',
      chapterNumber: 8,
      title: 'Chiến Dịch Tinh Tú Đêm Đen',
      summary: 'Nội dung thuộc giai đoạn HOLD chưa giải mã.',
      editorialStatus: 'HOLD',
      contentReadiness: 'MISSING',
      publicationStatus: 'DRAFT',
      sceneAnchors: [],
      updatedAt: new Date().toISOString(),
    };

    const holdGate = validateCanPublishChapter(holdChapter);
    assert.strictEqual(holdGate.canPublish, false, 'Chương HOLD tuyệt đối không được phép xuất bản');
    assert.ok(
      holdGate.reason?.includes('HOLD'),
      'Lý do chặn phải chỉ rõ trạng thái HOLD'
    );

    const provisionalChapter: StoryChapterMeta = {
      chapterId: 'chap-05',
      chapterNumber: 5,
      title: 'Tia Sáng Đầu Tiên',
      summary: 'Bản thảo tạm thời.',
      editorialStatus: 'PROVISIONAL',
      contentReadiness: 'SUMMARY_ONLY',
      publicationStatus: 'DRAFT',
      sceneAnchors: [],
      updatedAt: new Date().toISOString(),
    };

    const provGate = validateCanPublishChapter(provisionalChapter);
    assert.strictEqual(
      provGate.canPublish,
      false,
      'Chương PROVISIONAL không được phép xuất bản'
    );
    assert.ok(
      provGate.reason?.includes('PROVISIONAL'),
      'Lý do chặn phải chỉ rõ trạng thái PROVISIONAL'
    );
  });

  it('4. Khởi tạo Store và xác minh hoạt động độc lập cho phi công khác (Alviss)', async () => {
    const store = new CharacterContentStore();
    const manifest = await store.getManifest();

    assert.ok(manifest.profiles.alviss, 'Manifest phải có hồ sơ của Alviss');

    // Thử đăng ký tác phẩm mới cho Alviss (Kiểm chứng generic 12 phi công)
    const testArt = {
      assetId: 'test_alviss_action_01',
      pilotId: 'alviss' as CanonicalPilotId,
      title: 'Alviss — Tác Chiến Vành Đai Asteroid',
      category: 'lore' as const,
      role: 'action' as const,
      sourceUrl: '/assets/artworks/alviss/action-01.webp',
      path: '/assets/artworks/alviss/action-01.webp',
      aspectRatio: '3:4',
      status: 'verified' as const,
      description: 'Cảnh Alviss điều khiển pháo đài chắn asteroid.',
      priority: 90,
      createdAt: new Date().toISOString(),
    };

    const initialRev = manifest.revision || 1;
    const artResult = await store.registerArtwork(testArt, 'lead_architect');
    assert.ok(artResult.success, 'Đăng ký artwork cho Alviss phải thành công');

    const reloadedManifest = await store.getManifest();
    assert.ok(
      (reloadedManifest.revision || 0) > initialRev,
      'Revision phải tăng sau mutation'
    );

    // Cập nhật profile Alviss
    const profResult = await store.updateProfile(
      'alviss',
      {
        quote: 'Không một tấm khiên nào vỡ dưới sự giám sát của tôi.',
      },
      'lead_architect'
    );
    assert.ok(profResult.success, 'Cập nhật profile Alviss phải thành công');

    const updatedProfile = await store.getProfileOverlay('alviss');
    assert.strictEqual(
      updatedProfile?.quote,
      'Không một tấm khiên nào vỡ dưới sự giám sát của tôi.'
    );

    // Kiểm tra audit trail
    assert.ok(reloadedManifest.auditLog.length > 0, 'Audit trail phải có bản ghi thao tác');
    assert.strictEqual(reloadedManifest.auditLog[0].user, 'lead_architect');
  });

  it('5. Kiểm tra tính năng lọc Published Chapters cho Reader công khai', async () => {
    const store = new CharacterContentStore();
    const valentinePublished = await store.getPublishedChapters('valentine');
    assert.ok(valentinePublished.length >= 1, 'Valentine phải có ít nhất 1 chương đã xuất bản');
    assert.strictEqual(valentinePublished[0].chapterId, 'chap-01');
    assert.strictEqual(valentinePublished[0].publicationStatus, 'PUBLISHED');

    // Các phi công chưa xuất bản chương nào (chỉ có draft/hold)
    const selenaPublished = await store.getPublishedChapters('selena');
    assert.strictEqual(
      selenaPublished.length,
      0,
      'Selena chưa có chương nào PUBLISHED thì public API phải trả về rỗng'
    );
  });
});
