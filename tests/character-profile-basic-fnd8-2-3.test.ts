import test from 'node:test';
import assert from 'node:assert';
import {
  V2_ROSTER_CHARACTERS,
  CharacterProfileV2,
} from '../lib/game/v2/character-profile-data';

test('STARFRONT WORLD V2 — FND8.2.3.x Character Profile Basic & Roster Dynamic Integrity', async (t) => {
  await t.test('1. Kiểm tra 12 Canonical Pilots đầy đủ và duy nhất', () => {
    assert.strictEqual(V2_ROSTER_CHARACTERS.length, 12, 'Phải có đúng 12 canonical pilots');
    const ids = V2_ROSTER_CHARACTERS.map((c) => c.id);
    const uniqueIds = new Set(ids);
    assert.strictEqual(uniqueIds.size, 12, '12 Pilot IDs phải là duy nhất');

    const expectedIds = [
      'valentine', 'alviss', 'eric', 'marcus',
      'victor', 'kaelen', 'lyra', 'selena',
      'fortuna', 'aria', 'rhea', 'nova'
    ];
    for (const id of expectedIds) {
      assert.ok(ids.includes(id), `Pilot ${id} phải có trong roster`);
    }
  });

  await t.test('2. Kiểm tra basicInfo động không bị rỗng ở bất kỳ phi công nào', () => {
    for (const char of V2_ROSTER_CHARACTERS) {
      assert.ok(
        Array.isArray(char.basicInfo) && char.basicInfo.length >= 2,
        `Pilot ${char.classCharacterName} phải có basicInfo với ít nhất 2 trường dữ liệu`
      );
      // Đảm bảo không pilot nào khác Valentine có xuất thân bị hardcode về Elysia nếu họ ở nơi khác
      if (char.id === 'alviss') {
        const origin = char.basicInfo.find((b) => b.label.includes('Xuất thân'));
        assert.ok(origin && origin.value.includes('Vành Đai Trong'), 'Alviss phải có xuất thân đúng');
      }
    }
  });

  await t.test('3. Kiểm tra tags đặc trưng của từng phi công', () => {
    for (const char of V2_ROSTER_CHARACTERS) {
      assert.ok(
        Array.isArray(char.tags) && char.tags.length > 0,
        `Pilot ${char.classCharacterName} phải có tags đặc trưng`
      );
    }
  });

  await t.test('4. Kiểm tra traits của 12 phi công (mỗi phi công có từ 1-2 traits canonical)', () => {
    for (const char of V2_ROSTER_CHARACTERS) {
      assert.ok(
        Array.isArray(char.traits) && char.traits.length >= 1 && char.traits.length <= 2,
        `Pilot ${char.classCharacterName} phải có 1-2 traits`
      );
      for (const tr of char.traits) {
        assert.ok(tr.name && tr.name.length > 0, 'Trait phải có tên');
        assert.ok(tr.description && tr.description.length > 0, 'Trait phải có mô tả');
      }
    }
  });

  await t.test('5. Kiểm tra danh mục Chapter của từng phi công (tối thiểu 7 chương canonical, Valentine 10 chương)', () => {
    for (const char of V2_ROSTER_CHARACTERS) {
      if (char.id === 'valentine') {
        assert.strictEqual(char.chapters.length, 10, 'Valentine phải có 10 chương');
      } else {
        assert.ok(char.chapters.length >= 7, `${char.classCharacterName} phải có tối thiểu 7 chương`);
      }
    }
  });
});
