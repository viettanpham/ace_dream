import { NextRequest, NextResponse } from 'next/server'
import { contentReleaseResolver } from '@/lib/game/v2/content-release-resolver'

export const dynamic = 'force-dynamic'

/**
 * GET /api/runtime/v2-release?refresh=1
 * Trả về toàn bộ snapshot release hiện hành từ kênh CDN (channel -> pinned release commit SHA -> profiles, galleries, stories).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const forceRefresh =
      searchParams.get('refresh') === '1' || searchParams.get('refresh') === 'true'

    const result = await contentReleaseResolver.resolveSnapshot({
      forceRefresh,
    })

    const { snapshot, fromCache, usingFallbackSnapshot, lastUpdateError } = result

    return NextResponse.json({
      success: true,
      channel: snapshot.channel,
      releaseId: snapshot.manifest.releaseId,
      releaseVersion: snapshot.releaseVersion,
      releaseCommitSha: snapshot.releaseCommitSha,
      releaseBaseUrl: snapshot.releaseBaseUrl,
      status: snapshot.manifest.status,
      counts: snapshot.manifest.counts,
      loadedAt: snapshot.loadedAt,
      fromCache,
      usingFallbackSnapshot,
      lastUpdateError,
      characters: snapshot.characters,
      storiesEmptyState: snapshot.storiesIndex.emptyState,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        success: false,
        error: `Không thể nạp release từ kênh CDN: ${message}`,
      },
      { status: 502 }
    )
  }
}

/**
 * POST /api/runtime/v2-release
 * Cho phép kích hoạt kiểm tra bản cập nhật channel mới (R4 -> R5+) một cách nguyên tử.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    if (typeof body.channelUrl === 'string' && body.channelUrl.trim()) {
      contentReleaseResolver.setChannelUrl(body.channelUrl.trim())
    }

    const result = await contentReleaseResolver.resolveSnapshot({
      forceRefresh: true,
    })

    const { snapshot, fromCache, usingFallbackSnapshot, lastUpdateError } = result

    return NextResponse.json({
      success: true,
      channel: snapshot.channel,
      releaseId: snapshot.manifest.releaseId,
      releaseVersion: snapshot.releaseVersion,
      releaseCommitSha: snapshot.releaseCommitSha,
      releaseBaseUrl: snapshot.releaseBaseUrl,
      status: snapshot.manifest.status,
      counts: snapshot.manifest.counts,
      loadedAt: snapshot.loadedAt,
      fromCache,
      usingFallbackSnapshot,
      lastUpdateError,
      characters: snapshot.characters,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        success: false,
        error: `Lỗi làm mới kênh CDN: ${message}`,
      },
      { status: 502 }
    )
  }
}
