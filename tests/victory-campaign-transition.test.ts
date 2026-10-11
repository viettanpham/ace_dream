import test from "node:test"
import assert from "node:assert/strict"
import { INITIAL_STARFRONT_PROGRESSION } from "../lib/game/progression"
import {
  getNextCampaignMission,
  getCurrentOrNextCampaignMission,
  createScaledEnemyUnit,
} from "../lib/game/scaling"
import { applyMissionClearReward } from "../lib/game/progression"

test("Chiến Dịch — Kiểm tra luồng Chiến Thắng Ải 1-1 và Thách Đấu Mục Tiêu Kế Tiếp (Ải 1-2)", async (t) => {
  await t.test("1. Ải 1-1 xuất kích: getNextCampaignMission trả về chính xác Ải 1-2", () => {
    const freshProg = { ...INITIAL_STARFRONT_PROGRESSION }
    const nextMission = getNextCampaignMission("m1-1", freshProg)
    
    assert.ok(nextMission, "Nhiệm vụ kế tiếp không được null")
    assert.equal(nextMission.id, "m1-2", "ID nhiệm vụ kế tiếp phải là m1-2")
    assert.equal(nextMission.order, 2, "Thứ tự ải phải là 2")
    assert.match(nextMission.title, /1-2/, "Tiêu đề phải chứa 1-2")
  })

  await t.test("2. Khi HP địch về 0 và hoàn thành Ải 1-1, progression ghi nhận m1-1", () => {
    const freshProg = { ...INITIAL_STARFRONT_PROGRESSION }
    const mission1_1 = getCurrentOrNextCampaignMission(freshProg, null)
    assert.equal(mission1_1.id, "m1-1")

    const { updated } = applyMissionClearReward(freshProg, mission1_1)
    assert.ok(updated.completedMissions.includes("m1-1"), "completedMissions phải chứa m1-1")

    // Sau khi m1-1 hoàn thành, mục tiêu chưa xong tiếp theo phải tự động là m1-2
    const nextAutoMission = getCurrentOrNextCampaignMission(updated, null)
    assert.equal(nextAutoMission.id, "m1-2", "Mục tiêu tiếp theo phải là Ải 1-2")
  })

  await t.test("3. Bấm 'Thách đấu mục tiêu tiếp theo' từ Ải 1-1 sinh đúng kẻ địch của Ải 1-2", () => {
    const progWith1_1 = {
      ...INITIAL_STARFRONT_PROGRESSION,
      completedMissions: ["m1-1"],
    }
    const mission1_2 = getNextCampaignMission("m1-1", progWith1_1)
    assert.ok(mission1_2)
    assert.equal(mission1_2.id, "m1-2")

    // Kiểm tra sinh quái của Ải 1-2
    const enemyUnit = createScaledEnemyUnit(
      mission1_2.encounterId,
      mission1_2.variantId,
      mission1_2.level,
      mission1_2.quality,
    )

    assert.equal(enemyUnit.gearType, "scout-drone")
    assert.ok(enemyUnit.name.includes("Lv.2"), `Tên kẻ địch phải chứa Lv.2 (nhận được: ${enemyUnit.name})`)
    assert.ok(enemyUnit.hp > 500, "HP của địch Ải 1-2 phải được scale cao hơn cấp 1")
  })

  await t.test("4. Khi vào Chiến trường tự do mà chưa có ải chọn trước, tự động gợi ý Ải chiến dịch tương ứng", () => {
    const freshProg = { ...INITIAL_STARFRONT_PROGRESSION, completedMissions: [] }
    const auto1 = getCurrentOrNextCampaignMission(freshProg, null)
    assert.equal(auto1.id, "m1-1", "Khi chưa làm ải nào, ải chiến dịch gợi ý là m1-1")

    const prog1 = { ...INITIAL_STARFRONT_PROGRESSION, completedMissions: ["m1-1"] }
    const auto2 = getCurrentOrNextCampaignMission(prog1, null)
    assert.equal(auto2.id, "m1-2", "Sau khi xong m1-1, ải chiến dịch gợi ý là m1-2")
  })
})
