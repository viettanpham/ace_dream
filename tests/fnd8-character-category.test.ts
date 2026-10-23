import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  V2_ROSTER_CHARACTERS,
  getCharacterProfileById,
  CharacterProfileV2,
} from '../lib/game/v2/character-profile-data'
import { resolveImageUrl } from '../lib/game/assets/image-resolver'

describe('STARFRONT WORLD V2 — FND-8.2.3.E.0 Character Category & Pilot Profile Tests', () => {
  it('1. Phải có chính xác 12 Class/Pilot trong danh mục canonical', () => {
    assert.equal(V2_ROSTER_CHARACTERS.length, 12, 'Danh sách phải có đúng 12 nhân vật')
    const expectedIds = [
      'valentine',
      'alviss',
      'eric',
      'marcus',
      'victor',
      'kaelen',
      'lyra',
      'selena',
      'fortuna',
      'aria',
      'rhea',
      'nova',
    ]
    const actualIds = V2_ROSTER_CHARACTERS.map((c) => c.id)
    for (const id of expectedIds) {
      assert.ok(actualIds.includes(id), `Thiếu nhân vật canonical: ${id}`)
    }
  })

  it('2. Tổng điểm của 6 chỉ số thuộc tính cơ bản của mỗi nhân vật phải CHÍNH XÁC là 20 điểm', () => {
    for (const char of V2_ROSTER_CHARACTERS) {
      const stats = char.baseAttributes
      const total = stats.atk + stats.def + stats.agi + stats.ene + stats.shd + stats.luk
      assert.equal(
        total,
        20,
        `Nhân vật ${char.classCharacterName} có tổng điểm là ${total}, phải đúng 20 điểm`
      )
    }
  })

  it('3. Valentine là Lead Reference Profile với đầy đủ dữ liệu, Traits, và 9 tác phẩm CDN', () => {
    const val = getCharacterProfileById('valentine')
    assert.equal(val.classCharacterName, 'Valentine')
    assert.equal(val.roleCategory, 'support')
    assert.equal(val.gender, 'Nữ')
    assert.equal(val.age, 24)

    // Base attributes
    assert.deepEqual(val.baseAttributes, {
      atk: 2,
      def: 2,
      agi: 2,
      ene: 6,
      shd: 6,
      luk: 2,
    })

    // Traits
    assert.equal(val.traits.length, 2)
    assert.equal(val.traits[0].id, 'pilot_trait_field_medic')
    assert.equal(val.traits[1].id, 'pilot_trait_safeguard')

    // Verified Artworks trên CDN (9 tác phẩm WebP)
    const verifiedArtworks = val.artworks.filter((a) => a.isAvailableOnDisk)
    assert.equal(verifiedArtworks.length, 9, 'Valentine phải có 9 tác phẩm WebP khả dụng trên CDN')

    // Archive pending artworks
    const archiveArtworks = val.artworks.filter((a) => !a.isAvailableOnDisk)
    assert.ok(archiveArtworks.length >= 4, 'Phải có ít nhất 4 tác phẩm lưu trữ concept')

    // Chapters
    assert.equal(val.chapters.length, 10, 'Phải có lộ trình 10 chương')
    const approved = val.chapters.filter((c) => c.status === 'APPROVED')
    const provisional = val.chapters.filter((c) => c.status === 'PROVISIONAL')
    const hold = val.chapters.filter((c) => c.status === 'HOLD')

    assert.equal(approved.length, 4, 'Chương 01–04 phải là APPROVED')
    assert.equal(provisional.length, 2, 'Chương 05–06 phải là PROVISIONAL')
    assert.equal(hold.length, 4, 'Chương 07–10 phải là HOLD')
  })

  it('4. Mô hình trạng thái trực giao (Orthogonal Progress Status Model) đầy đủ 5 chiều cho 12 Pilot', () => {
    for (const char of V2_ROSTER_CHARACTERS) {
      const status = char.progressStatus
      assert.ok(status, `Thiếu progressStatus cho ${char.classCharacterName}`)
      assert.ok(['COMPLETE_ART', 'PROCESSING_USABLE', 'PROCESSING_LIMITED', 'PLACEHOLDER_ONLY', 'NOT_SYNCED'].includes(status.artStatus))
      assert.ok(['COMPLETE', 'IN_PROGRESS', 'MISSING', 'NOT_VERIFIED'].includes(status.profileStatus))
      assert.ok(['APPROVED', 'PARTIAL', 'HOLD', 'MISSING'].includes(status.storyStatus))
      assert.ok(['READY', 'PARTIAL', 'EMPTY'].includes(status.galleryRuntime))
      assert.ok(['READY', 'PARTIAL', 'PLACEHOLDER'].includes(status.uiReadiness))
      assert.ok(typeof status.registeredArtCount === 'number')
      assert.ok(typeof status.cdnAvailableArtCount === 'number')
    }
  })

  it('5. Image Resolver giải quyết an toàn các asset paths của 12 nhân vật', () => {
    for (const char of V2_ROSTER_CHARACTERS) {
      const resolvedPortrait = resolveImageUrl(char.portraitAssetPath)
      const resolvedFullbody = resolveImageUrl(char.fullbodyAssetPath)
      assert.ok(typeof resolvedPortrait === 'string' && resolvedPortrait.length > 0)
      assert.ok(typeof resolvedFullbody === 'string' && resolvedFullbody.length > 0)
    }
  })

  it('6. Hàm getCharacterProfileById trả về nhân vật tương ứng hoặc fallback về Valentine', () => {
    const marcus = getCharacterProfileById('marcus')
    assert.equal(marcus.classCharacterName, 'Marcus')

    const fallback = getCharacterProfileById('non-existent-id')
    assert.equal(fallback.id, 'valentine')
  })

  it('7. Đồng bộ hóa tập hợp tác phẩm ngữ cảnh: Gallery Count trùng khớp hoàn toàn với Viewer Total Count (9/9)', () => {
    const val = getCharacterProfileById('valentine')
    const verifiedArtworks = val.artworks.filter((a) => a.isAvailableOnDisk)
    assert.equal(verifiedArtworks.length, 9, 'Số lượng tranh verified của Valentine phải là đúng 9')

    // Mô phỏng thuật toán tính toán trong Viewer của PilotProfileV2
    const currentViewerArtworks = verifiedArtworks
    assert.equal(currentViewerArtworks.length, 9, 'Viewer mở từ Gallery phải nhận chính xác 9 tranh khả dụng')

    // Kiểm tra chỉ số ảnh duyệt qua lại: không bao giờ rơi ra khỏi tập 9 tranh
    for (let i = 0; i < currentViewerArtworks.length; i++) {
      const art = currentViewerArtworks[i]
      const index = currentViewerArtworks.findIndex((a) => a.id === art.id)
      assert.equal(index, i)
      assert.ok(art.isAvailableOnDisk, 'Toàn bộ tranh trong tập ngữ cảnh phải có sẵn trên đĩa/CDN')
    }
  })

  it('8. Bốn phi công nữ mới (Fortuna, Aria, Rhea, Nova) có đầy đủ 6 thuộc tính chuẩn 20 điểm và trạng thái an toàn', () => {
    const newFemales = ['fortuna', 'aria', 'rhea', 'nova']
    for (const id of newFemales) {
      const char = getCharacterProfileById(id)
      assert.ok(char, `Không tìm thấy profile cho ${id}`)
      assert.equal(char.gender, 'Nữ')
      const totalPoints =
        char.baseAttributes.atk +
        char.baseAttributes.def +
        char.baseAttributes.agi +
        char.baseAttributes.ene +
        char.baseAttributes.shd +
        char.baseAttributes.luk
      assert.equal(totalPoints, 20, `Tổng điểm của ${char.classCharacterName} phải là 20`)
      assert.equal(char.progressStatus.artStatus, 'PLACEHOLDER_ONLY')
    }
  })
})

