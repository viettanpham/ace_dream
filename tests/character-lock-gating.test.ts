import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  confirmPairing,
  applyVictoryReward,
  applyMissionClearReward,
  INITIAL_STARFRONT_PROGRESSION,
} from "../lib/game/progression"
import type { StarfrontProgression } from "../lib/game/types"

function getFreshProgression(): StarfrontProgression {
  return JSON.parse(JSON.stringify(INITIAL_STARFRONT_PROGRESSION))
}

describe("Character Lock & Gating Rule Verification", () => {
  it("TC-LOCK-01: Tiến trình ban đầu chưa khóa (isLocked = false)", () => {
    const prog = getFreshProgression()
    assert.equal(Boolean(prog.activePairing?.isLocked), false)
  })

  it("TC-LOCK-02: Xác nhận ghép đôi thành công chuyển isLocked = true và khóa cặp đôi", () => {
    const prog = getFreshProgression()
    const result = confirmPairing(prog, "marcus", "vanguard")

    assert.equal(result.success, true)
    assert.equal(result.updated.activePairing?.isLocked, true)
    assert.equal(result.updated.activePairing?.pilotId, "marcus")
    assert.equal(result.updated.activePairing?.gearId, "vanguard")
    assert.equal(result.updated.activePairing?.unlockProgress.completedMissions, 0)
    assert.equal(result.updated.activePairing?.unlockProgress.wonBattles, 0)
  })

  it("TC-LOCK-03: Khi đã khóa và chưa đủ 5 chiến thắng hoặc 5 nhiệm vụ, không được phép thay đổi cặp đôi", () => {
    const prog = getFreshProgression()
    const lockedProg = confirmPairing(prog, "marcus", "vanguard").updated

    // Thử đổi sang phi công khác khi mới 2 trận thắng
    lockedProg.activePairing!.unlockProgress.wonBattles = 2
    const attempt = confirmPairing(lockedProg, "valentine", "aegis")

    assert.equal(attempt.success, false)
    assert.match(attempt.message, /đang bị khóa/)
    assert.equal(attempt.updated.activePairing?.pilotId, "marcus")
  })

  it("TC-LOCK-04: Tích lũy đủ 5 trận thắng đấu trường tự động mở khóa cặp đôi", () => {
    const prog = getFreshProgression()
    let current = confirmPairing(prog, "marcus", "vanguard").updated

    // Thắng 5 trận đấu trường liên tiếp
    for (let i = 0; i < 5; i++) {
      const reward = applyVictoryReward(current, "scout-drone")
      current = reward.updated
    }

    assert.equal(current.activePairing?.isLocked, false)
    assert.equal(current.activePairing?.unlockProgress.wonBattles, 5)

    // Đã mở khóa -> Cho phép chọn và khóa cặp đôi mới
    const changeResult = confirmPairing(current, "alviss", "falcon")
    assert.equal(changeResult.success, true)
    assert.equal(changeResult.updated.activePairing?.pilotId, "alviss")
    assert.equal(changeResult.updated.activePairing?.gearId, "falcon")
    assert.equal(changeResult.updated.activePairing?.isLocked, true)
  })

  it("TC-LOCK-05: Tích lũy đủ 5 nhiệm vụ chiến dịch tự động mở khóa cặp đôi", () => {
    const prog = getFreshProgression()
    let current = confirmPairing(prog, "marcus", "vanguard").updated

    // Hoàn thành 5 nhiệm vụ
    for (let i = 1; i <= 5; i++) {
      const reward = applyMissionClearReward(current, {
        id: `mission-1-${i}`,
        sectorId: "sector-1",
        sectorName: "Vành Đai Asteroid",
        order: i,
        title: `Nhiệm vụ 1-${i}`,
        desc: "Mô tả",
        recommendedLevel: i,
        encounterId: "scout-drone",
        firstClearReward: { credits: 100, exp: 50, alloy: 2 },
        repeatReward: { credits: 50, exp: 25, alloy: 1 },
      })
      current = reward.updated
    }

    assert.equal(current.activePairing?.isLocked, false)
    assert.equal(current.activePairing?.unlockProgress.completedMissions, 5)

    // Cho phép hoán đổi cặp đôi sau khi hoàn thành 5 nhiệm vụ
    const changeResult = confirmPairing(current, "eric", "aegis")
    assert.equal(changeResult.success, true)
    assert.equal(changeResult.updated.activePairing?.pilotId, "eric")
    assert.equal(changeResult.updated.activePairing?.gearId, "aegis")
    assert.equal(changeResult.updated.activePairing?.isLocked, true)
  })
})
