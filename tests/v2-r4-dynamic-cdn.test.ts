/**
 * STARFRONT WORLD V2 — FND-8 DYNAMIC CDN R4 -> R5+ INTEGRATION TEST SUITE
 *
 * Kiểm thử toàn diện:
 * 1. Dữ liệu thật R4 Preview từ jsDelivr CDN (12 Profiles, 50/297 Verified WebP, 5 chương Valentine, 11 Story Empty State).
 * 2. Giả lập nâng cấp R5 (Valentine 8 chương, thêm ảnh VERIFIED mới, thêm Pilot thứ 2 có Story, thêm Pilot thứ 13).
 * 3. Bảo mật đường dẫn & Chống lỗi (Path traversal `../`, untrusted origin, commit mismatch, channel 404, atomic rollback về R4 khi R6 lỗi).
 */

import assert from 'node:assert/strict'
import {
  ContentReleaseResolver,
  ContentReleaseError,
  validateTrustedUrl,
  resolveReleaseUrl,
} from '../lib/game/v2/content-release-resolver'
import { contentConfig } from '../lib/game/v2/content-config'

const R4_COMMIT_SHA = '3a3a4f267ebb7beb357d3cff39cd33382612f1d0'
const R5_COMMIT_SHA = 'b5b5b5b57ebb7beb357d3cff39cd33382612f1d0'

async function runTests() {
  console.log('=================================================================')
  console.log('STARFRONT V2 — KIỂM THỬ TÍCH HỢP DYNAMIC CDN R4 -> R5+')
  console.log('=================================================================\n')

  // ==========================================================================
  // TEST 1: DỮ LIỆU THẬT R4 PREVIEW TRÊN JSDELIVR CDN
  // ==========================================================================
  console.log('▶ [TEST 1] Kiểm tra kết nối và phân giải dữ liệu thật R4 Preview trên CDN...')
  const liveResolver = new ContentReleaseResolver()
  const r4Result = await liveResolver.resolveSnapshot()
  const r4 = r4Result.snapshot

  assert.equal(r4.releaseVersion, 'r4', 'Phiên bản kênh hiện tại phải là r4')
  assert.equal(
    r4.releaseCommitSha,
    R4_COMMIT_SHA,
    'releaseCommitSha phải khớp với commit R4 đã pin'
  )
  assert.equal(r4.characters.length, 12, 'R4 phải nạp động đúng 12 Pilot từ profiles/index.json')

  // Kiểm tra Kaelen: 30/30 VERIFIED WebP
  const kaelen = r4.characters.find((c) => c.id === 'kaelen')
  assert.ok(kaelen, 'Phải tìm thấy hồ sơ Kaelen trong R4')
  assert.equal(kaelen.artworks.length, 30, 'Kaelen phải có 30 bản ghi Gallery')
  const kaelenVerified = kaelen.artworks.filter((a) => a.isAvailableOnDisk && Boolean(a.path))
  assert.equal(kaelenVerified.length, 30, 'Kaelen phải có 30/30 ảnh VERIFIED trên R4 CDN')
  for (const art of kaelenVerified) {
    assert.ok(
      art.path.includes(R4_COMMIT_SHA),
      `URL ảnh Kaelen phải được pin chặt với commit SHA R4: ${art.path}`
    )
    assert.ok(
      !art.path.startsWith('/images/'),
      `Tuyệt đối không dùng đường dẫn V1 /images/: ${art.path}`
    )
  }

  // Kiểm tra tổng số ảnh VERIFIED và PENDING trên toàn bộ 12 Pilot trong R4
  let totalVerifiedR4 = 0
  let totalPendingR4 = 0
  for (const char of r4.characters) {
    assert.ok(char.characterQuote.length > 0, `${char.id} phải có characterQuote riêng`)
    assert.ok(char.shortDescription.length > 0, `${char.id} phải có shortDescription riêng`)
    assert.notEqual(
      char.characterQuote,
      char.shortDescription,
      `${char.id}: characterQuote và shortDescription không được gộp chung`
    )
    assert.ok(char.biographyText && char.biographyText.length > 0, `${char.id} phải có biography`)
    assert.equal(char.systemRegistryAvailable, true, `${char.id} có trong SYSTEM Registry FND-1`)
    assert.ok(char.baseAttributes !== null, `${char.id} phải có chỉ số SYSTEM`)

    for (const art of char.artworks) {
      if (art.isAvailableOnDisk) {
        totalVerifiedR4++
        assert.equal(art.cdnStatus, 'VERIFIED')
        assert.ok(
          art.path.startsWith(
            `https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@${R4_COMMIT_SHA}/starfront-world-assets/releases/r4/assets/pilots/`
          ),
          `Ảnh VERIFIED của ${char.id} phải trỏ đúng tới releaseBaseUrl R4: ${art.path}`
        )
      } else {
        totalPendingR4++
        assert.equal(art.cdnStatus, 'PENDING_BINARY_IMPORT')
        assert.equal(
          art.path,
          '',
          `Bản ghi PENDING của ${char.id} (${art.id}) không được phép tạo URL trình duyệt`
        )
      }
    }
  }

  assert.equal(totalVerifiedR4, 50, 'Tổng số ảnh VERIFIED trên R4 phải đúng 50 WebP')
  assert.equal(totalPendingR4, 247, 'Tổng số bản ghi PENDING trên R4 phải đúng 247')

  // Kiểm tra Story của Valentine (5 chương) và 11 Pilot còn lại (Empty State)
  const valentine = r4.characters.find((c) => c.id === 'valentine')
  assert.ok(valentine, 'Phải có hồ sơ Valentine')
  assert.equal(valentine.storyAvailable, true, 'Valentine phải có Story trong R4')
  assert.equal(valentine.chapters.length, 5, 'Valentine phải có đúng 5 chương trong R4')

  const chap04 = valentine.chapters.find((c) => c.number === 4)
  const chap05 = valentine.chapters.find((c) => c.number === 5)
  assert.ok(chap04, 'Phải có Chương 04 của Valentine')
  assert.equal(chap04.editorialStatus, 'REVIEW', 'Chương 04 phải mang trạng thái REVIEW')
  assert.equal(chap04.revision, '03_RECONSTRUCTION', 'Chương 04 phải là bản 03_RECONSTRUCTION')
  assert.equal(
    chap04.sourceIntegrity,
    'RECONSTRUCTED_NOT_APPROVED',
    'Chương 04 phải ghi nhận sourceIntegrity=RECONSTRUCTED_NOT_APPROVED'
  )
  assert.ok(chap05, 'Phải có Chương 05 của Valentine')
  assert.equal(chap05.editorialStatus, 'REVIEW', 'Chương 05 phải mang trạng thái REVIEW')
  assert.equal(chap05.revision, '02', 'Chương 05 phải là revision 02')

  // Kiểm tra scene artwork trong CH01 của Valentine:
  // valentine-portrait đã VERIFIED trong R4 -> cdnVerified: true
  // valentine-story-001.webp đang PENDING trong R4 -> cdnVerified: false (không tạo URL lỗi)
  const ch01Bundle = await liveResolver.getPilotStoryChapter('valentine', 'chap-01')
  assert.ok(ch01Bundle, 'Phải đọc được toàn văn Chương 01 của Valentine')
  const sceneBlocks = ch01Bundle.chapter.blocks.filter((b) => b.type === 'scene')
  assert.ok(sceneBlocks.length >= 2, 'Chương 01 của Valentine có các scene blocks')
  const portraitScene = sceneBlocks.find((b) =>
    b.artworks?.some((a) => a.assetId === 'valentine-portrait')
  )
  const unverifiedStoryScene = sceneBlocks.find((b) =>
    b.artworks?.some(
      (a) => a.assetId === 'world-elysia-asteroid-belt-establishing-01'
    )
  )
  assert.equal(
    portraitScene?.cdnVerified,
    true,
    'Scene dùng valentine-portrait (đã VERIFIED hash trong R4) phải được bật cdnVerified=true'
  )
  assert.equal(
    unverifiedStoryScene?.cdnVerified,
    false,
    'Scene dùng world-elysia-asteroid-belt-establishing-01 (artworkUrl=null, chưa nhập binary trong R4) phải giữ cdnVerified=false để không gây 404'
  )

  // Kiểm tra 11 Pilot còn lại đều hiển thị Story Empty State
  const nonStoryPilots = r4.characters.filter((c) => c.id !== 'valentine')
  assert.equal(nonStoryPilots.length, 11)
  for (const p of nonStoryPilots) {
    assert.equal(p.storyAvailable, false, `${p.id} chưa có Story trong R4`)
    assert.equal(p.chapters.length, 0, `${p.id} không được phép có chương giả trong R4`)
    assert.ok(p.storyEmptyState && p.storyEmptyState.length > 0, `${p.id} phải có storyEmptyState`)
  }
  console.log('  ✓ PASS: R4 Preview (12 Pilots, 50 Verified / 247 Pending WebP, 5 Valentine Chapters, 11 Empty States).\n')

  // ==========================================================================
  // TEST 2: GIẢ LẬP NÂNG CẤP SANG R5 (8 CHƯƠNG VALENTINE, PILOT THỨ 13, STORY MỚI)
  // ==========================================================================
  console.log('▶ [TEST 2] Kiểm tra giả lập nâng cấp kênh CDN từ R4 sang R5 (Zero Code Change)...')

  let activeMockChannelVersion: 'r4' | 'r5' | 'broken-r6' = 'r4'
  const r5BaseUrl = `https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@${R5_COMMIT_SHA}/starfront-world-assets/releases/r5/`

  const mockFetch = async (url: string, init?: RequestInit): Promise<Response> => {
    // 1. Channel entrypoint
    if (url.endsWith('/channels/pilot-v2-preview.json')) {
      if (activeMockChannelVersion === 'r4') {
        return fetch(url, init)
      }
      if (activeMockChannelVersion === 'broken-r6') {
        return new Response('Not Found', { status: 404 })
      }
      // R5 Channel JSON
      return new Response(
        JSON.stringify({
          schemaVersion: 'starfront-content-channel-v1',
          channel: 'pilot-v2-preview',
          releaseVersion: 'r5',
          releaseCommitSha: R5_COMMIT_SHA,
          releaseManifestUrl: `${r5BaseUrl}manifest.json`,
          releaseBaseUrl: r5BaseUrl,
          status: 'RELEASE_CANDIDATE',
          updatedAt: '2026-12-01',
          previewOnly: false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. R5 Release URLs
    if (url.startsWith(r5BaseUrl)) {
      const subPath = url.slice(r5BaseUrl.length)

      if (subPath === 'manifest.json') {
        return new Response(
          JSON.stringify({
            schemaVersion: 'starfront-content-release-v1',
            releaseId: 'r5',
            status: 'RELEASE_CANDIDATE',
            entries: {
              profiles: 'profiles/index.json',
              galleries: 'galleries/index.json',
              stories: 'stories/index.json',
            },
            counts: {
              pilots: 13,
              profileFiles: 13,
              storyPilotCount: 2,
              storyChapters: 9,
              sourceGalleryArtworkRecords: 300,
              physicallyVerifiedGalleryArtwork: 55,
            },
          }),
          { status: 200 }
        )
      }

      if (subPath === 'profiles/index.json') {
        const r4Entries = r4.profilesIndex.entries
        return new Response(
          JSON.stringify({
            schemaVersion: 'starfront-v2-profiles-index-v1',
            releaseId: 'r5',
            pilotCount: 13,
            entries: [
              ...r4Entries,
              {
                pilotId: 'zephyr',
                personaCode: 'P13',
                displayName: 'Zephyr',
                fullName: 'Zephyr Solaris',
                profilePath: 'profiles/zephyr.json',
                profileStatus: 'AVAILABLE',
                storyAvailable: false,
                galleryRuntimeReady: true,
                galleryPath: 'galleries/zephyr.json',
                availableGalleryImageCount: 1,
              },
            ],
          }),
          { status: 200 }
        )
      }

      if (subPath === 'profiles/zephyr.json') {
        return new Response(
          JSON.stringify({
            schemaVersion: 'starfront-v2-pilot-profile-preview-v1',
            releaseId: 'r5',
            pilotId: 'zephyr',
            personaCode: 'P13',
            classCharacterName: 'ZEPHYR',
            displayName: 'Zephyr',
            fullName: 'Zephyr Solaris',
            gender: 'Nữ',
            role: 'Trinh sát lượng tử tầm xa',
            personality: 'Điềm tĩnh, sắc sảo',
            shortDescription: 'Chuyên gia trinh sát lượng tử mới gia nhập biên chế R5.',
            characterQuote: 'Giữa những bước nhảy lượng tử, không có điểm mù nào tồn tại.',
            specialties: ['Trinh sát lượng tử', 'Định vị viễn vọng'],
            contentStatus: 'AVAILABLE',
            proseApproval: 'APPROVED',
            biography: {
              status: 'APPROVED',
              text: 'Zephyr Solaris được bổ sung động vào danh mục nhân vật thông qua manifest R5 mà không cần sửa code frontend.',
            },
            origin: 'Trạm Viễn Vọng Helios',
            training: 'Học Viện Lượng Tử Starfront',
            story: {
              available: false,
              chapterCount: 0,
              manifestPath: null,
              status: 'EMPTY',
              emptyState: 'Nội dung truyện của Zephyr đang được phát triển.',
            },
          }),
          { status: 200 }
        )
      }

      if (subPath.startsWith('profiles/')) {
        const pId = subPath.replace('profiles/', '').replace('.json', '')
        return new Response(JSON.stringify(r4.pilotProfilesMap[pId]), { status: 200 })
      }

      if (subPath === 'galleries/index.json') {
        return new Response(
          JSON.stringify({
            schemaVersion: 'starfront-r4-gallery-index-v1',
            status: 'RELEASE_CANDIDATE',
            items: [
              ...r4.galleriesIndex.items,
              {
                pilotId: 'zephyr',
                manifestPath: 'galleries/zephyr.json',
                sourceRecordCount: 1,
                verifiedImageCount: 1,
              },
            ],
          }),
          { status: 200 }
        )
      }

      if (subPath === 'galleries/zephyr.json') {
        return new Response(
          JSON.stringify({
            schemaVersion: 'starfront-r4-gallery-v1',
            pilotId: 'zephyr',
            status: 'READY',
            sourceRecordCount: 1,
            verifiedImageCount: 1,
            images: [
              {
                assetId: 'zephyr-fullbody',
                filename: 'zephyr-fullbody.webp',
                order: 1,
                batch: 'R5',
                category: 'CORE',
                description: 'Ảnh toàn thân chuẩn của Zephyr.',
                sourceApprovalStatus: 'APPROVED',
                expectedSha256: 'aaaa1111bbbb2222cccc3333dddd4444eeee5555ffff66667777888899990000',
                width: 1122,
                height: 2000,
                cdnStatus: 'VERIFIED',
                cdnPath: 'assets/pilots/zephyr/zephyr-fullbody.webp',
              },
            ],
          }),
          { status: 200 }
        )
      }

      if (subPath === 'galleries/valentine.json') {
        // Trong R5, valentine-story-001 được chuyển sang VERIFIED!
        const valGal = JSON.parse(JSON.stringify(r4.pilotGalleriesMap['valentine']))
        for (const img of valGal.images) {
          if (img.assetId === 'valentine-story-001' || img.filename === 'valentine-story-001.webp') {
            img.cdnStatus = 'VERIFIED'
            img.cdnPath = 'assets/pilots/valentine/valentine-story-001.webp'
          }
        }
        return new Response(JSON.stringify(valGal), { status: 200 })
      }

      if (subPath.startsWith('galleries/')) {
        const pId = subPath.replace('galleries/', '').replace('.json', '')
        return new Response(JSON.stringify(r4.pilotGalleriesMap[pId]), { status: 200 })
      }

      if (subPath === 'stories/index.json') {
        return new Response(
          JSON.stringify({
            schemaVersion: 'starfront-r4-story-index-v1',
            status: 'APPROVED',
            items: [
              {
                pilotId: 'valentine',
                manifestPath: 'stories/valentine/manifest.json',
                chapterCount: 8,
                status: 'APPROVED',
              },
              {
                pilotId: 'kaelen',
                manifestPath: 'stories/kaelen/manifest.json',
                chapterCount: 1,
                status: 'APPROVED',
              },
            ],
            emptyState: 'Nội dung truyện đang được phát triển.',
          }),
          { status: 200 }
        )
      }

      if (subPath === 'stories/valentine/manifest.json') {
        const r4ValManifest = r4.pilotStoriesMap['valentine'].manifest
        return new Response(
          JSON.stringify({
            ...r4ValManifest,
            totalChapters: 8,
            chapters: [
              ...r4ValManifest.chapters,
              {
                chapterId: 'chap-06',
                chapterNumber: 6,
                title: 'Thiên Thần Trong Ánh Đèn Trắng',
                path: 'chapter-06.json',
                editorialStatus: 'APPROVED',
                revision: '01',
              },
              {
                chapterId: 'chap-07',
                chapterNumber: 7,
                title: 'Bầu Trời Phía Sau Chiến Tuyến',
                path: 'chapter-07.json',
                editorialStatus: 'APPROVED',
                revision: '01',
              },
              {
                chapterId: 'chap-08',
                chapterNumber: 8,
                title: 'Lời Hứa Của Đôi Cánh Trắng',
                path: 'chapter-08.json',
                editorialStatus: 'PROVISIONAL',
                revision: '01',
              },
            ],
          }),
          { status: 200 }
        )
      }

      if (subPath.startsWith('stories/valentine/chapter-0')) {
        const chapNum = parseInt(subPath.replace('stories/valentine/chapter-0', '').replace('.json', ''), 10)
        if (chapNum <= 5) {
          const existing = r4.pilotStoriesMap['valentine'].chaptersById[`chap-0${chapNum}`]
          return new Response(JSON.stringify(existing), { status: 200 })
        }
        return new Response(
          JSON.stringify({
            schemaVersion: 'starfront-story-chapter-v1',
            pilotId: 'valentine',
            chapterId: `chap-0${chapNum}`,
            chapterNumber: chapNum,
            title: `Chương Mới R5 #${chapNum}`,
            summary: `Nội dung chương ${chapNum} phát hành động trong R5.`,
            wordCount: 2400,
            readingTimeMinutes: 10,
            editorialStatus: chapNum === 8 ? 'PROVISIONAL' : 'APPROVED',
            revision: '01',
            blocks: [
              {
                blockId: 'b0001',
                type: 'heading',
                level: 1,
                text: `Chương ${chapNum}`,
              },
              {
                blockId: 'b0002',
                type: 'paragraph',
                text: `Đoạn văn xuôi của chương ${chapNum} trong bản cập nhật R5.`,
              },
            ],
          }),
          { status: 200 }
        )
      }

      if (subPath === 'stories/kaelen/manifest.json') {
        return new Response(
          JSON.stringify({
            schemaVersion: 'starfront-story-pilot-manifest-v1',
            pilotId: 'kaelen',
            pilotName: 'Kaelen',
            callsign: 'Phantom Blade',
            status: 'APPROVED',
            totalChapters: 1,
            chapters: [
              {
                chapterId: 'chap-01',
                chapterNumber: 1,
                title: 'Lưỡi Gươm Bóng Đêm',
                path: 'chapter-01.json',
                editorialStatus: 'APPROVED',
                revision: '01',
              },
            ],
          }),
          { status: 200 }
        )
      }

      if (subPath === 'stories/kaelen/chapter-01.json') {
        return new Response(
          JSON.stringify({
            schemaVersion: 'starfront-story-chapter-v1',
            pilotId: 'kaelen',
            chapterId: 'chap-01',
            chapterNumber: 1,
            title: 'Lưỡi Gươm Bóng Đêm',
            summary: 'Chương mở đầu của Kaelen phát hành trên R5.',
            wordCount: 1850,
            readingTimeMinutes: 8,
            editorialStatus: 'APPROVED',
            revision: '01',
            blocks: [
              {
                blockId: 'k0001',
                type: 'paragraph',
                text: 'Kaelen lao qua vành đai thiên thạch trong đêm đen tĩnh lặng.',
              },
            ],
          }),
          { status: 200 }
        )
      }
    }

    return fetch(url, init)
  }

  const upgradeResolver = new ContentReleaseResolver({ fetchImpl: mockFetch })

  // Bước 2A: Khởi tạo ở R4
  const initialRes = await upgradeResolver.resolveSnapshot()
  assert.equal(initialRes.snapshot.releaseVersion, 'r4')
  assert.equal(initialRes.snapshot.characters.length, 12)

  // Bước 2B: Kênh CDN chuyển sang R5 -> Gọi resolveSnapshot({ forceRefresh: true })
  activeMockChannelVersion = 'r5'
  const upgradedRes = await upgradeResolver.resolveSnapshot({ forceRefresh: true })
  const r5 = upgradedRes.snapshot

  assert.equal(r5.releaseVersion, 'r5', 'Phải tự động chuyển sang r5 sau khi refresh channel')
  assert.equal(r5.releaseCommitSha, R5_COMMIT_SHA, 'Phải pin đúng commit SHA của R5')
  assert.equal(r5.characters.length, 13, 'Phải tự nhận diện Pilot thứ 13 (Zephyr) từ manifest R5')

  // Không có bất kỳ URL nào của R4 lẫn vào R5
  for (const char of r5.characters) {
    assert.equal(char.releaseCommitSha, R5_COMMIT_SHA)
    for (const art of char.artworks) {
      if (art.isAvailableOnDisk) {
        assert.ok(
          art.path.includes(R5_COMMIT_SHA) && !art.path.includes(R4_COMMIT_SHA),
          `Không được phép trộn URL R4 vào phiên R5: ${art.path}`
        )
      }
    }
  }

  // Kiểm tra Valentine tự động lên 8 chương
  const valR5 = r5.characters.find((c) => c.id === 'valentine')!
  assert.equal(valR5.chapters.length, 8, 'Valentine trong R5 phải tự động hiển thị 8 chương (CH01-CH08)')

  // Kiểm tra Kaelen trong R5 đã có Story
  const kaelenR5 = r5.characters.find((c) => c.id === 'kaelen')!
  assert.equal(kaelenR5.storyAvailable, true, 'Kaelen trong R5 phải tự động bật Story tab')
  assert.equal(kaelenR5.chapters.length, 1)

  // Kiểm tra Pilot thứ 13 (Zephyr) không bị bịa chỉ số SYSTEM
  const zephyrR5 = r5.characters.find((c) => c.id === 'zephyr')!
  assert.equal(zephyrR5.systemRegistryAvailable, false, 'Zephyr chưa có trong SYSTEM Registry')
  assert.equal(zephyrR5.baseAttributes, null, 'Không được bịa chỉ số SYSTEM cho Zephyr')
  assert.equal(zephyrR5.verifiedArtworkCount, 1, 'Zephyr có 1 ảnh VERIFIED trong R5')

  console.log('  ✓ PASS: Giả lập nâng cấp R5 (13 Pilots, 8 chương Valentine, Kaelen Story, Zero R4/R5 mixing).\n')

  // ==========================================================================
  // TEST 3: BẢO MẬT ĐƯỜNG DẪN & ATOMIC ROLLBACK KHI KÊNH LỖI
  // ==========================================================================
  console.log('▶ [TEST 3] Kiểm tra bảo mật đường dẫn (path traversal, origin) và Atomic Rollback...')

  // 3A. Chặn path traversal
  assert.throws(
    () =>
      resolveReleaseUrl(
        r4.releaseBaseUrl,
        '../secrets/config.json',
        contentConfig,
        R4_COMMIT_SHA
      ),
    (err: unknown) => err instanceof ContentReleaseError && err.code === 'UNSAFE_RELATIVE_PATH',
    'Phải chặn ../ trong đường dẫn tương đối'
  )

  // 3B. Chặn đường dẫn tuyệt đối kiểu V1 /images/...
  assert.throws(
    () =>
      resolveReleaseUrl(
        r4.releaseBaseUrl,
        '/images/valentine-fullbody.webp',
        contentConfig,
        R4_COMMIT_SHA
      ),
    (err: unknown) => err instanceof ContentReleaseError && err.code === 'UNSAFE_RELATIVE_PATH',
    'Phải chặn đường dẫn tuyệt đối /images/...'
  )

  // 3C. Chặn origin lạ
  assert.throws(
    () =>
      validateTrustedUrl(
        'https://malicious-cdn.example.com/viettanpham/starfront-assets/manifest.json',
        contentConfig
      ),
    (err: unknown) => err instanceof ContentReleaseError && err.code === 'UNTRUSTED_ORIGIN',
    'Phải chặn origin không nằm trong danh sách tin cậy'
  )

  // 3D. Chặn lệch commit SHA
  assert.throws(
    () =>
      validateTrustedUrl(
        `https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@${R4_COMMIT_SHA}/starfront-world-assets/releases/r4/manifest.json`,
        contentConfig,
        R5_COMMIT_SHA
      ),
    (err: unknown) => err instanceof ContentReleaseError && err.code === 'COMMIT_SHA_MISMATCH',
    'Phải chặn URL không khớp với releaseCommitSha đã pin'
  )

  // 3E. Atomic Rollback khi kênh cập nhật sang bản lỗi (broken-r6 trả về 404)
  activeMockChannelVersion = 'broken-r6'
  const rollbackRes = await upgradeResolver.resolveSnapshot({ forceRefresh: true })
  assert.equal(
    rollbackRes.usingFallbackSnapshot,
    true,
    'Khi kênh mới lỗi 404, phải bật cờ usingFallbackSnapshot=true'
  )
  assert.equal(
    rollbackRes.snapshot.releaseCommitSha,
    R5_COMMIT_SHA,
    'Phải giữ nguyên snapshot hợp lệ gần nhất (R5) mà không làm sập phiên hiện tại'
  )
  assert.ok(rollbackRes.lastUpdateError, 'Phải ghi nhận thông báo lỗi lastUpdateError')

  console.log('  ✓ PASS: Bảo mật đường dẫn & Atomic Rollback hoạt động chính xác.\n')
  console.log('=================================================================')
  console.log('TẤT CẢ KIỂM THỬ R4 -> R5+ ĐỀU PASS 100%!')
  console.log('=================================================================')
}

runTests().catch((err) => {
  console.error('KIỂM THỬ THẤT BẠI:', err)
  process.exit(1)
})
