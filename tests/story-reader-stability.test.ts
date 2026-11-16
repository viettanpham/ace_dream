/**
 * STARFRONT WORLD V2 — STORY READER LOADING LOOP REGRESSION TESTS (P0 BUGFIX)
 *
 * Kiểm thử:
 * 1. Validate payload API (/api/runtime/story/[pilotId]/[chapterId]) không chỉ dựa vào HTTP 200.
 * 2. Phát hiện AbortError & key fetch ổn định.
 * 3. Hợp đồng ổn định reference giữa PilotProfileV2 -> StoryTab -> ImmersiveStoryReader
 *    (không chứa `chapters` hoặc `onProgressChange` trong dependency array của fetch useEffect,
 *    memo hóa `readerChapters` & callbacks để tránh vòng lặp fetch vô hạn).
 * 4. Tích hợp dữ liệu thực tế Valentine CH01 -> CH02 -> CH01 từ ContentReleaseResolver R4 CDN.
 * 5. Mô phỏng kịch bản lỗi mạng / payload rỗng -> trạng thái lỗi ổn định & phục hồi khi Retry.
 */

import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  isAbortError,
  getStoryFetchKey,
  validateStoryChapterPayload,
} from '../lib/game/v2/story-reader-helpers'
import { ContentReleaseResolver } from '../lib/game/v2/content-release-resolver'

async function runTests() {
  console.log('▶ [TEST 1] Payload validation (HTTP status + JSON contract)...')

  // Valid payload with blocks
  const validWithBlocks = validateStoryChapterPayload(true, 200, {
    success: true,
    releaseVersion: 'r4',
    releaseCommitSha: '816585651f1f06f1cafeefc6a4809ab1f52f3484',
    meta: {
      chapterId: 'chap-01',
      chapterNumber: 1,
      title: 'Khúc Dạo Đầu',
      revision: '16',
    },
    content: '',
    blocks: [{ blockId: 'b1', type: 'paragraph', text: 'Nội dung chương 1.' }],
  })
  assert.equal(validWithBlocks.meta.chapterId, 'chap-01')
  assert.equal(validWithBlocks.blocks.length, 1)

  // Valid payload with content string only
  const validWithContent = validateStoryChapterPayload(true, 200, {
    success: true,
    meta: { chapterId: 'chap-02', chapterNumber: 2, title: 'Chương 2' },
    content: 'Văn xuôi chương 2',
    blocks: [],
  })
  assert.equal(validWithContent.content, 'Văn xuôi chương 2')

  // HTTP 500 or 404
  assert.throws(
    () =>
      validateStoryChapterPayload(false, 500, {
        success: false,
        error: 'Lỗi truy xuất nội dung chương',
      }),
    /Lỗi truy xuất nội dung chương/
  )

  // HTTP 200 but success !== true
  assert.throws(
    () =>
      validateStoryChapterPayload(true, 200, {
        success: false,
        error: 'Payload bị từ chối',
      }),
    /Payload bị từ chối/
  )

  // HTTP 200 but missing meta
  assert.throws(
    () =>
      validateStoryChapterPayload(true, 200, {
        success: true,
        content: 'abc',
        blocks: [],
      }),
    /metadata/
  )

  // HTTP 200 with empty blocks and empty content (must NOT settle as fake success)
  assert.throws(
    () =>
      validateStoryChapterPayload(true, 200, {
        success: true,
        meta: { chapterId: 'chap-01', chapterNumber: 1, title: 'Ch1' },
        content: '   ',
        blocks: [],
      }),
    /Nội dung chương trống/
  )

  console.log('  ✓ PASS')

  console.log('▶ [TEST 2] AbortError detection & fetch key transitions (01 -> 02 -> 01 & Retry)...')
  assert.equal(isAbortError({ name: 'AbortError' }), true)
  assert.equal(isAbortError({ code: 'ABORT_ERR' }), true)
  assert.equal(isAbortError(new Error('Network down')), false)

  assert.equal(
    getStoryFetchKey({ isOpen: false, pilotId: 'valentine', chapterId: 'chap-01', reloadToken: 0 }),
    null
  )
  const k1 = getStoryFetchKey({
    isOpen: true,
    pilotId: 'valentine',
    chapterId: 'chap-01',
    reloadToken: 0,
  })
  const k2 = getStoryFetchKey({
    isOpen: true,
    pilotId: 'valentine',
    chapterId: 'chap-02',
    reloadToken: 0,
  })
  const k1Back = getStoryFetchKey({
    isOpen: true,
    pilotId: 'valentine',
    chapterId: 'chap-01',
    reloadToken: 0,
  })
  const k1Retry = getStoryFetchKey({
    isOpen: true,
    pilotId: 'valentine',
    chapterId: 'chap-01',
    reloadToken: 1,
  })
  assert.equal(k1, 'valentine::chap-01::0')
  assert.equal(k2, 'valentine::chap-02::0')
  assert.equal(k1Back, k1)
  assert.notEqual(k1Retry, k1)
  console.log('  ✓ PASS')

  console.log('▶ [TEST 3] Anti-loop source contract (deps isolation & memoization)...')
  const readerSource = fs.readFileSync(
    path.resolve(process.cwd(), 'components/game/v2/story/immersive-story-reader.tsx'),
    'utf8'
  )
  const storyTabSource = fs.readFileSync(
    path.resolve(process.cwd(), 'components/game/v2/pilot-profile/tabs/story-tab.tsx'),
    'utf8'
  )
  const profileV2Source = fs.readFileSync(
    path.resolve(process.cwd(), 'components/game/v2/pilot-profile/pilot-profile-v2.tsx'),
    'utf8'
  )

  // ImmersiveStoryReader fetch effect must depend ONLY on [isOpen, pilotId, activeChapterId, reloadToken]
  assert.ok(
    readerSource.includes('[isOpen, pilotId, activeChapterId, reloadToken]'),
    'fetchChapter useEffect must depend strictly on [isOpen, pilotId, activeChapterId, reloadToken]'
  )
  assert.ok(
    !readerSource.includes('[isOpen, pilotId, activeChapterId, reloadToken, chapters'),
    'fetchChapter useEffect must NOT include unstable chapters or callbacks in dependency array'
  )
  assert.ok(
    readerSource.includes('new AbortController()') && readerSource.includes('controller.abort()'),
    'ImmersiveStoryReader must cancel in-flight fetches with AbortController on cleanup'
  )

  // StoryTab must memoize readerChapters instead of passing inline chapters.map(...)
  assert.ok(
    storyTabSource.includes('const readerChapters = useMemo') &&
      storyTabSource.includes('chapters={readerChapters}'),
    'StoryTab must pass memoized readerChapters to ImmersiveStoryReader'
  )
  assert.ok(
    storyTabSource.includes('const handleReaderChapterChange = useCallback') &&
      storyTabSource.includes('onChapterChange={handleReaderChapterChange}'),
    'StoryTab must pass memoized handleReaderChapterChange to ImmersiveStoryReader'
  )

  // PilotProfileV2 must memoize handleSelectStoryChapterId and deduplicate unchanged focus snapshots
  assert.ok(
    profileV2Source.includes('const handleSelectStoryChapterId = useCallback') &&
      profileV2Source.includes('lastSnapshotSignatureRef'),
    'PilotProfileV2 must memoize story chapter selector and deduplicate unchanged snapshots'
  )
  console.log('  ✓ PASS')

  console.log('▶ [TEST 4] Live R4 Valentine chapters 01 -> 02 -> 01 payload verification...')
  const resolver = new ContentReleaseResolver()
  for (const chapId of ['chap-01', 'chap-02', 'chap-01', 'chap-03', 'chap-04', 'chap-05']) {
    const bundle = await resolver.getPilotStoryChapter('valentine', chapId)
    assert.ok(bundle, `Expected Valentine chapter ${chapId} in R4 release`)
    const validated = validateStoryChapterPayload(true, 200, {
      success: true,
      releaseVersion: bundle.releaseVersion,
      releaseCommitSha: bundle.releaseCommitSha,
      meta: {
        chapterId: bundle.chapter.chapterId,
        chapterNumber: bundle.chapter.chapterNumber,
        title: bundle.chapter.title,
        revision: bundle.chapter.revision,
      },
      content: bundle.chapter.content || '',
      blocks: bundle.chapter.blocks || [],
    })
    assert.equal(validated.meta.chapterId, chapId)
    assert.ok(validated.blocks.length > 0, `Chapter ${chapId} must have non-empty blocks`)
  }
  console.log('  ✓ PASS')

  console.log('\nTẤT CẢ REGRESSION TESTS STORY READER STABILITY ĐỀU PASS!')
}

runTests().catch((err) => {
  console.error('STORY READER STABILITY TEST FAILED:', err)
  process.exit(1)
})
