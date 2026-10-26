import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/game/auth/admin-auth';
import { getCharacterContentStore } from '@/lib/game/v2/character-content-store';
import {
  CANONICAL_PILOT_IDS,
  CanonicalPilotId,
  StoryChapterMeta,
  PublicationStatus,
} from '@/lib/game/v2/character-content-types';

export const dynamic = 'force-dynamic';

/**
 * Admin Story Management API
 * POST /api/admin/story
 * Actions:
 * - save_chapter: Create or edit chapter markdown and meta
 * - toggle_publication: Publish or hide chapter with gate verification
 * - rescan_stories: Refresh manifest from disk
 */
export async function POST(req: NextRequest) {
  const auth = verifyAdminRequest(req, true);
  if (!auth.authorized || !auth.user) {
    return NextResponse.json(
      { success: false, error: auth.error || 'Yêu cầu quyền Quản trị viên & CSRF hợp lệ.' },
      { status: auth.status }
    );
  }

  try {
    const body = await req.json();
    const { action, pilotId } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Thiếu tham số action.' }, { status: 400 });
    }

    const store = getCharacterContentStore();

    if (action === 'rescan_stories') {
      const scanned = await store.rescanStoriesFromDisk();
      return NextResponse.json({
        success: true,
        message: 'Đã quét lại toàn bộ thư mục truyện từ đĩa lưu trữ.',
        storyCatalog: scanned,
      });
    }

    if (!pilotId || !CANONICAL_PILOT_IDS.includes(pilotId as CanonicalPilotId)) {
      return NextResponse.json(
        { success: false, error: `Pilot ID ${pilotId} không hợp lệ trong 12 phi công chuẩn.` },
        { status: 400 }
      );
    }

    const pId = pilotId as CanonicalPilotId;

    if (action === 'save_chapter') {
      const chapterId = body.chapterId as string;
      const meta = body.meta as Partial<StoryChapterMeta>;
      const markdownContent = body.content as string | undefined;

      if (!chapterId) {
        return NextResponse.json({ success: false, error: 'Thiếu chapterId.' }, { status: 400 });
      }

      const saved = await store.saveChapter(pId, chapterId, meta || {}, markdownContent, auth.user.username);
      const { universalContentResolver } = await import('@/lib/game/v2/universal-content-resolver');
      universalContentResolver.clearCache();
      return NextResponse.json({
        success: true,
        message: `Đã lưu chương ${chapterId} của phi công ${pId} thành công.`,
        chapter: saved,
      });
    }

    if (action === 'toggle_publication') {
      const chapterId = body.chapterId as string;
      const targetStatus = body.targetStatus as PublicationStatus;

      if (!chapterId || !targetStatus) {
        return NextResponse.json(
          { success: false, error: 'Thiếu chapterId hoặc targetStatus (PUBLISHED | HIDDEN | DRAFT).' },
          { status: 400 }
        );
      }

      const result = await store.setPublicationStatus(pId, chapterId, targetStatus, auth.user.username);
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Không thể thay đổi trạng thái xuất bản.',
          },
          { status: 400 }
        );
      }

      const { universalContentResolver } = await import('@/lib/game/v2/universal-content-resolver');
      universalContentResolver.clearCache();

      return NextResponse.json({
        success: true,
        message: `Đã chuyển chương ${chapterId} sang trạng thái ${targetStatus}.`,
        chapter: result.chapter,
      });
    }

    if (action === 'update_chapter_status') {
      const chapterId = body.chapterId as string;
      const status = body.status as any;
      const isHidden = typeof body.isHidden === 'boolean' ? body.isHidden : undefined;
      const displayOrder = typeof body.displayOrder === 'number' ? body.displayOrder : undefined;

      if (!chapterId) {
        return NextResponse.json({ success: false, error: 'Thiếu chapterId.' }, { status: 400 });
      }

      const result = await store.updateStoryChapterStatus(
        pId,
        chapterId,
        {
          status,
          isHidden,
          displayOrder,
          publicationStatus: body.publicationStatus,
          editorialStatus: body.editorialStatus,
        },
        auth.user.username
      );

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Không thể cập nhật trạng thái chương.' },
          { status: 400 }
        );
      }

      const { universalContentResolver } = await import('@/lib/game/v2/universal-content-resolver');
      universalContentResolver.clearCache();

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật trạng thái chương ${chapterId} của phi công ${pId}.`,
      });
    }

    if (action === 'reorder_chapters') {
      const orderedChapterIds = body.orderedChapterIds as string[];
      if (!Array.isArray(orderedChapterIds) || orderedChapterIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'orderedChapterIds phải là mảng danh sách ID chương.' },
          { status: 400 }
        );
      }

      const result = await store.reorderStoryChapters(pId, orderedChapterIds, auth.user.username);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Không thể cập nhật thứ tự chương.' },
          { status: 400 }
        );
      }

      const { universalContentResolver } = await import('@/lib/game/v2/universal-content-resolver');
      universalContentResolver.clearCache();

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật thứ tự hiển thị ${orderedChapterIds.length} chương của ${pId}.`,
      });
    }

    return NextResponse.json({ success: false, error: `Action ${action} không hợp lệ.` }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: `Lỗi xử lý truyện: ${message}` }, { status: 500 });
  }
}
