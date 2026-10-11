import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  INITIAL_STARFRONT_PROGRESSION,
  applyMissionClearReward,
} from "../lib/game/progression"
import {
  getNextCampaignMission,
  createScaledEnemyUnit,
  findCampaignQuest,
} from "../lib/game/scaling"
import { CAMPAIGN_SECTORS } from "../lib/game/data"
import type { CampaignMission, StarfrontProgression } from "../lib/game/types"

describe("Campaign Progression & Next Challenge Flow Test", () => {
  it("TC-CAMP-01: getNextCampaignMission returns Mission 1-2 after Mission 1-1", () => {
    const prog: StarfrontProgression = {
      ...INITIAL_STARFRONT_PROGRESSION,
      completedMissions: ["m1-1"],
    }

    const next = getNextCampaignMission("m1-1", prog)
    assert.ok(next, "Phải tìm thấy nhiệm vụ tiếp theo sau khi xong 1-1")
    assert.equal(next.id, "m1-2", "Nhiệm vụ tiếp theo phải là 1-2 (m1-2)")
    assert.equal(next.sectorId, "sector-1", "Phải thuộc Sector 1")
    assert.equal(next.order, 2, "Thứ tự nhiệm vụ trong sector phải là 2")
    assert.equal(next.level, 2, "Level nhiệm vụ 1-2 phải là 2")
    assert.equal(next.variantId, "interceptor", "Kẻ địch của 1-2 phải là variant interceptor")
  })

  it("TC-CAMP-02: Complete Mission 1-1 and advance smoothly to 1-2 with scaled enemy", () => {
    let prog: StarfrontProgression = { ...INITIAL_STARFRONT_PROGRESSION }
    const m1_1 = CAMPAIGN_SECTORS[0].missions[0]

    // Player clears 1-1
    const { updated, reward } = applyMissionClearReward(prog, m1_1)
    prog = updated

    assert.ok(prog.completedMissions.includes("m1-1"), "1-1 phải có trong completedMissions")
    assert.ok(reward.creditsGained > 0, "Credits phải được cộng")
    assert.ok(reward.expGained > 0, "EXP phải được cộng")

    // Get next mission
    const nextMission = getNextCampaignMission(m1_1.id, prog)
    assert.ok(nextMission, "Nhiệm vụ tiếp theo phải tồn tại")
    assert.equal(nextMission.id, "m1-2")

    // Scaled enemy unit for 1-2
    const enemyUnit = createScaledEnemyUnit(
      nextMission.encounterId,
      nextMission.variantId || "interceptor",
      nextMission.level || 2,
      nextMission.quality || "standard",
    )

    assert.ok(enemyUnit, "Phải sinh ra đối thủ cho 1-2")
    assert.equal(enemyUnit.gearType, "scout-drone")
    assert.ok(enemyUnit.hp > 0, "HP địch phải lớn hơn 0")
    assert.ok(enemyUnit.speed > 0, "Speed địch phải lớn hơn 0")
  })

  it("TC-CAMP-03: Chain progression across all sectors (1-1 -> 1-2 -> 1-3 -> 2-1 -> ... -> 4-3)", () => {
    const prog: StarfrontProgression = { ...INITIAL_STARFRONT_PROGRESSION }
    const allMissions = CAMPAIGN_SECTORS.flatMap((s) => s.missions)

    for (let i = 0; i < allMissions.length - 1; i++) {
      const current = allMissions[i]
      const expectedNext = allMissions[i + 1]

      const next = getNextCampaignMission(current.id, prog)
      assert.ok(next, `Nhiệm vụ tiếp theo sau ${current.id} phải tồn tại`)
      assert.equal(next.id, expectedNext.id, `Sau ${current.id} phải là ${expectedNext.id}`)
    }

    // After final mission 4-3, should return null
    const lastMission = allMissions[allMissions.length - 1]
    const afterLast = getNextCampaignMission(lastMission.id, prog)
    assert.equal(afterLast, null, "Sau ải cuối cùng m4-3 không còn nhiệm vụ tiếp theo")
  })

  it("TC-CAMP-04: Non-existent mission returns null", () => {
    const prog = { ...INITIAL_STARFRONT_PROGRESSION }
    const invalid = getNextCampaignMission("invalid-mission-xyz", prog)
    assert.equal(invalid, null, "ID không hợp lệ phải trả về null")
  })
})
