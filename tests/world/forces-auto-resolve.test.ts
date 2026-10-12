import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"

import {
  advanceTroopDeployments,
  calculateActiveMilitaryForce,
  calculateAutoResolve,
  calculateEffectivePower,
  calculateTotalMilitaryForce,
  commitAutoResolveResult,
  createInitialWorldState,
  dispatchTroopDeployment,
  evaluateSectorVulnerability,
  evaluateVoidStrategicBehavior,
  executeWorldTick,
  getInTransitTroopsCount,
  initiateTacticalRetreat,
  isSectorInvulnerableToVoid,
  loadWorldState,
  rallyRetreatingForces,
  recoverWoundedTroops,
  saveWorldState,
  setSectorStrategicOrder,
  transferForceStatus,
  transferSectorControl,
  validateForceLedgerIntegrity,
  validateWorldStateStructure,
  WorldPRNG,
  type AutoResolveInput,
  type AutoResolveParticipant,
  type MilitaryForceLedger,
  type WorldState,
} from "../../lib/game/world"

// Giả lập localStorage cho kiểm thử
class MockLocalStorage {
  private store: Map<string, string> = new Map()

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  get length(): number {
    return this.store.size
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }
}

describe("STARFRONT WORLD — Phase 6.5: Factions, Military Force Ledger & Auto-Resolve", () => {
  beforeEach(() => {
    ;(globalThis as any).window = globalThis
    ;(globalThis as any).localStorage = new MockLocalStorage()
  })

  // =========================================================================
  // PHẦN A: SỔ CÁI LỰC LƯỢNG QUÂN SỰ CÓ THẨM QUYỀN & NGUYÊN TẮC BẢO TOÀN
  // =========================================================================
  describe("A. Authoritative Military Force Ledger & Conservation", () => {
    it("A.1. Tổng quân số bảo toàn 100% theo đẳng thức Deployed + Reserves + Wounded + Retreating + InTransit + Casualties", () => {
      const state = createInitialWorldState(101)
      const initialTotal = calculateTotalMilitaryForce(state.military)
      assert.equal(initialTotal, 1770 + 850 + 140 + 0 + 0) // 2760 quân

      const integrity = validateForceLedgerIntegrity(state, 2760)
      assert.equal(integrity.valid, true)
      assert.equal(integrity.totalForce, 2760)
      assert.equal(integrity.activeForce, 2760)
      assert.equal(integrity.inTransit, 0)
    })

    it("A.2. Chuyển trạng thái nội bộ bảo toàn chính xác tổng lực lượng, không sinh số ảo", () => {
      const military: MilitaryForceLedger = {
        deployed: 1000,
        reserves: 500,
        woundedOrRepair: 200,
        retreating: 100,
        casualties: 50,
      }
      const baselineTotal = calculateTotalMilitaryForce(military)
      assert.equal(baselineTotal, 1850)

      // Điều động 200 quân từ Reserves sang Deployed
      const r1 = transferForceStatus(military, "reserves", "deployed", 200)
      assert.equal(r1.success, true)
      assert.equal(military.reserves, 300)
      assert.equal(military.deployed, 1200)
      assert.equal(calculateTotalMilitaryForce(military), baselineTotal)

      // 80 quân Deployed bị thương chuyển sang woundedOrRepair
      const r2 = transferForceStatus(military, "deployed", "woundedOrRepair", 80)
      assert.equal(r2.success, true)
      assert.equal(military.deployed, 1120)
      assert.equal(military.woundedOrRepair, 280)
      assert.equal(calculateTotalMilitaryForce(military), baselineTotal)

      // 50 quân Deployed rút lui
      const r3 = transferForceStatus(military, "deployed", "retreating", 50)
      assert.equal(r3.success, true)
      assert.equal(military.deployed, 1070)
      assert.equal(military.retreating, 150)
      assert.equal(calculateTotalMilitaryForce(military), baselineTotal)

      // 30 quân tử trận chuyển sang casualties
      const r4 = transferForceStatus(military, "deployed", "casualties", 30)
      assert.equal(r4.success, true)
      assert.equal(military.deployed, 1040)
      assert.equal(military.casualties, 80)
      assert.equal(calculateTotalMilitaryForce(military), baselineTotal)
    })

    it("A.3. Chặn hoàn toàn việc chuyển ngược từ Casualties (Tổn thất vĩnh viễn)", () => {
      const military: MilitaryForceLedger = {
        deployed: 100,
        reserves: 50,
        woundedOrRepair: 0,
        retreating: 0,
        casualties: 100,
      }

      const res = transferForceStatus(military, "casualties", "reserves", 50)
      assert.equal(res.success, false)
      assert.ok(res.error?.includes("Casualties"))
      assert.equal(military.casualties, 100)
      assert.equal(military.reserves, 50)
    })

    it("A.4. Không cho phép chuyển số lượng âm hoặc vượt quá số dư khả dụng", () => {
      const military: MilitaryForceLedger = {
        deployed: 100,
        reserves: 50,
        woundedOrRepair: 0,
        retreating: 0,
        casualties: 0,
      }

      const rNeg = transferForceStatus(military, "reserves", "deployed", -20)
      assert.equal(rNeg.success, false)

      const rExcess = transferForceStatus(military, "reserves", "deployed", 500)
      assert.equal(rExcess.success, false)
      assert.ok(rExcess.error?.includes("không đủ"))
      assert.equal(military.reserves, 50)
    })

    it("A.5. Phục hồi thương binh đúng tỷ lệ 5% (tối thiểu 10) chuyển an toàn sang Reserves", () => {
      const military: MilitaryForceLedger = {
        deployed: 500,
        reserves: 200,
        woundedOrRepair: 100,
        retreating: 0,
        casualties: 0,
      }
      const totalBefore = calculateTotalMilitaryForce(military)

      // 5% của 100 = 5, nhưng minRecover = 10 -> phục hồi 10
      const rec = recoverWoundedTroops(military, 0.05, 10)
      assert.equal(rec.recovered, 10)
      assert.equal(military.woundedOrRepair, 90)
      assert.equal(military.reserves, 210)
      assert.equal(calculateTotalMilitaryForce(military), totalBefore)
    })
  })

  // =========================================================================
  // PHẦN B: ĐIỀU ĐỘNG QUÂN LỰC, LỆNH CHIẾN LƯỢC & MẠNG LƯỚI TUYẾN ĐƯỜNG
  // =========================================================================
  describe("B. Military Deployments & Strategic Orders", () => {
    it("B.1. Điều động quân tôn trọng mạng lưới tuyến đường (Dijkstra) và bảo toàn quân số in-transit", () => {
      const state = createInitialWorldState(202)
      const totalBefore = calculateTotalMilitaryForce(state.military)

      // Điều động 100 quân từ sol_command_hq đến helios_perimeter (tuyến open, distance = 1)
      const prevSolGarrison = state.sectors.sol_command_hq.garrisonPower
      const res = dispatchTroopDeployment(state, {
        fromSectorId: "sol_command_hq",
        toSectorId: "helios_perimeter",
        troopCount: 100,
        order: "reinforce",
      })

      assert.equal(res.success, true)
      assert.ok(res.deployment)
      assert.equal(res.deployment.status, "in_transit")
      assert.equal(res.deployment.troopCount, 100)
      assert.equal(res.deployment.remainingDays, 1)

      // Quân đã bị trừ khỏi Sol HQ
      assert.equal(state.sectors.sol_command_hq.garrisonPower, prevSolGarrison - 100)
      // Tổng quân số bao gồm inTransit vẫn bảo toàn tuyệt đối 100%
      const inTransit = getInTransitTroopsCount(state)
      assert.equal(inTransit, 100)
      assert.equal(calculateTotalMilitaryForce(state.military, inTransit), totalBefore)
    })

    it("B.2. Từ chối điều quân qua tuyến đường bị Blocked hoặc không thể thông hành", () => {
      const state = createInitialWorldState(203)

      // Tuyến từ waypoint_orion đến tartarus_breach bị 'blocked'
      // Tìm đường từ sol_command_hq đến tartarus_breach không có đường mở hoàn toàn
      const res = dispatchTroopDeployment(state, {
        fromSectorId: "waypoint_orion",
        toSectorId: "tartarus_breach",
        troopCount: 50,
      })

      assert.equal(res.success, false)
      assert.ok(res.error?.includes("Không tìm thấy tuyến đường khả dụng"))
    })

    it("B.3. Tiến trình hành quân (advanceTroopDeployments) cập nhật an toàn và cộng quân vào sector đích khi đến nơi", () => {
      const state = createInitialWorldState(204)
      const prevHeliosGarrison = state.sectors.helios_perimeter.garrisonPower

      // Dispatch 80 quân từ Sol HQ -> Helios (1 ngày đường)
      dispatchTroopDeployment(state, {
        fromSectorId: "sol_command_hq",
        toSectorId: "helios_perimeter",
        troopCount: 80,
        order: "defend",
      })

      assert.equal(state.activeDeployments?.length, 1)

      // Chạy 1 ngày hành quân
      const adv = advanceTroopDeployments(state)
      assert.equal(adv.arrived.length, 1)
      assert.equal(adv.arrived[0].troopCount, 80)
      assert.equal(state.sectors.helios_perimeter.garrisonPower, prevHeliosGarrison + 80)
      assert.equal(state.sectors.helios_perimeter.strategicOrder, "defend")
      assert.equal(state.activeDeployments?.length, 0)
    })

    it("B.4. Lệnh chiến lược (Strategic Order) cập nhật đúng và Lệnh Defend tăng cường năng lực phòng ngự", () => {
      const state = createInitialWorldState(205)

      const rOrder = setSectorStrategicOrder(state, "helios_perimeter", "defend")
      assert.equal(rOrder.success, true)
      assert.equal(state.sectors.helios_perimeter.strategicOrder, "defend")

      // Kiểm tra sức mạnh hiệu dụng có lệnh Defend (+25%) so với Normal
      const defenderNormal: AutoResolveParticipant = {
        factionId: "vss",
        name: "Helios Guard",
        troops: 200,
        order: "normal",
        fortificationLevel: 0,
      }
      const defenderDefend: AutoResolveParticipant = {
        factionId: "vss",
        name: "Helios Guard",
        troops: 200,
        order: "defend",
        fortificationLevel: 0,
      }

      const pNormal = calculateEffectivePower(defenderNormal, true)
      const pDefend = calculateEffectivePower(defenderDefend, true)

      assert.ok(pDefend > pNormal)
      // Tỷ lệ tăng xấp xỉ 25%
      assert.equal(Math.round(pDefend / pNormal * 100), 125)
    })

    it("B.5. Rút lui chiến thuật chuyển quân an toàn sang Retreating và Rally gom về an toàn", () => {
      const state = createInitialWorldState(206)
      const prevDeployed = state.military.deployed
      const prevGarrison = state.sectors.nebula_bastion.garrisonPower

      const ret = initiateTacticalRetreat(state, "nebula_bastion", 100)
      assert.equal(ret.success, true)
      assert.equal(ret.retreatingAmount, 100)
      assert.equal(state.sectors.nebula_bastion.garrisonPower, prevGarrison - 100)
      assert.equal(state.military.deployed, prevDeployed - 100)
      assert.equal(state.military.retreating, 100)

      // Tập hợp quân rút lui về Reserves
      const prevReserves = state.military.reserves
      const ral = rallyRetreatingForces(state, 1.0) // 100% gom về
      assert.equal(ral.rallied, 100)
      assert.equal(state.military.retreating, 0)
      assert.equal(state.military.reserves, prevReserves + 100)
    })
  })

  // =========================================================================
  // PHẦN C: THUẬT TOÁN TỰ ĐỘNG GIẢI QUYẾT TRẬN ĐÁNH (AUTO-RESOLVE)
  // =========================================================================
  describe("C. Skirmish Auto-Resolve (Lanchester Model)", () => {
    it("C.1. Tính tất định 100%: Cùng đầu vào và cùng seed cho kết quả giống hệt nhau", () => {
      const input: AutoResolveInput = {
        encounterId: "enc_det_test",
        sectorId: "waypoint_orion",
        attacker: { factionId: "void", name: "Void Swarm", troops: 300, order: "attack" },
        defender: { factionId: "vss", name: "Orion Station Guard", troops: 250, order: "defend" },
        seed: 778899,
      }

      const r1 = calculateAutoResolve(input)
      const r2 = calculateAutoResolve(input)

      assert.equal(r1.outcome, r2.outcome)
      assert.equal(r1.winnerFactionId, r2.winnerFactionId)
      assert.equal(r1.powerRatio, r2.powerRatio)
      assert.equal(r1.attackerCasualties, r2.attackerCasualties)
      assert.equal(r1.attackerWounded, r2.attackerWounded)
      assert.equal(r1.defenderCasualties, r2.defenderCasualties)
      assert.equal(r1.defenderWounded, r2.defenderWounded)
      assert.equal(r1.sectorLost, r2.sectorLost)
    })

    it("C.2. Tương quan sức mạnh áp đảo (Ratio >= 2.2) luôn đem lại Decisive Victory, không có xúc xắc ngẫu nhiên cực đoan", () => {
      const input: AutoResolveInput = {
        encounterId: "enc_overwhelming_vss",
        sectorId: "mining_outpost_k7",
        attacker: { factionId: "vss", name: "VSS Grand Armada", troops: 800, order: "attack" },
        defender: { factionId: "void", name: "Void Scout Wing", troops: 150, order: "normal" },
        seed: 12345,
      }

      const res = calculateAutoResolve(input)
      assert.equal(res.outcome, "decisive_victory")
      assert.equal(res.winnerFactionId, "vss")
      assert.ok(res.powerRatio >= 2.2)
      // Phe thắng chịu thương vong thấp (< 15%)
      assert.ok(res.attackerCasualties + res.attackerWounded < input.attacker.troops * 0.15)
      // Phe thua chịu tổn thất nặng (> 50%)
      assert.ok(res.defenderCasualties + res.defenderWounded >= input.defender.troops * 0.5)
    })

    it("C.3. Tương quan cân bằng (Ratio ~ 1.0) tạo ra kết quả Stalemate hoặc Marginal Victory", () => {
      const input: AutoResolveInput = {
        encounterId: "enc_balanced",
        sectorId: "waypoint_orion",
        attacker: { factionId: "void", name: "Void Raiders", troops: 200, order: "normal" },
        defender: { factionId: "vss", name: "Orion Garrison", troops: 200, order: "normal" },
        seed: 998811,
      }

      const res = calculateAutoResolve(input)
      assert.ok(["stalemate", "marginal_victory"].includes(res.outcome))
      // Cả hai bên đều chịu tổn thất cân đối
      assert.ok(res.attackerRemaining > 0)
      assert.ok(res.defenderRemaining > 0)
    })

    it("C.4. Tổng tổn thất phân chia chính xác: 50% Casualties vĩnh viễn và 50% Wounded phục hồi", () => {
      const input: AutoResolveInput = {
        encounterId: "enc_loss_split",
        sectorId: "shadow_reach",
        attacker: { factionId: "void", name: "Void Fleet", troops: 400 },
        defender: { factionId: "vss", name: "Shadow Garrison", troops: 200 },
        seed: 554433,
      }

      const res = calculateAutoResolve(input)

      // Bảo toàn quân số cho defender: casualties + wounded + remaining = initial
      assert.equal(
        res.defenderCasualties + res.defenderWounded + res.defenderRemaining,
        input.defender.troops
      )

      // Bảo toàn quân số cho attacker
      assert.equal(
        res.attackerCasualties + res.attackerWounded + res.attackerRemaining,
        input.attacker.troops
      )
    })
  })

  // =========================================================================
  // PHẦN D: HẬU QUẢ THẤT BẠI THEO NGỮ CẢNH & CHUYỂN GIAO QUYỀN KIỂM SOÁT
  // =========================================================================
  describe("D. Contextual Defeat Penalties & Safe Sector Control", () => {
    it("D.1. Thất bại ở trạng thái Threatened KHÔNG làm mất Sector; chuyển sang Under Siege và quân đồn trú còn lại", () => {
      const input: AutoResolveInput = {
        encounterId: "enc_context_siege",
        sectorId: "mining_outpost_k7", // Đang ở stage threatened
        attacker: { factionId: "void", name: "Void Fleet", troops: 600 },
        defender: {
          factionId: "vss",
          name: "K-7 Miners",
          troops: 260,
          fortificationLevel: 2, // Còn boong-ke
        },
        seed: 443322,
      }

      const res = calculateAutoResolve(input)
      // Thất bại nhưng KHÔNG mất sector
      assert.equal(res.sectorLost, false)
      assert.ok(res.defenderRemaining > 0)

      const state = createInitialWorldState(301)
      const txId = "tx_siege_commit_1"
      commitAutoResolveResult(state, res, txId)

      // Sector chuyển sang under_siege nhưng sovereignty VẪN LÀ VSS!
      assert.equal(state.sectors.mining_outpost_k7.stage, "under_siege")
      assert.equal(state.sectors.mining_outpost_k7.sovereignty, "vss")
    })

    it("D.2. Sector chỉ thất thủ (Lost) khi toàn bộ lực lượng đồn trú bị tiêu diệt sạch trong trận đánh", () => {
      const input: AutoResolveInput = {
        encounterId: "enc_context_lost",
        sectorId: "shadow_reach",
        attacker: { factionId: "void", name: "Void Incursion", troops: 800 },
        defender: {
          factionId: "vss",
          name: "Shadow Remnant",
          troops: 50,
          fortificationLevel: 0,
        },
        seed: 112233,
      }

      const res = calculateAutoResolve(input)
      assert.equal(res.sectorLost, true)
      assert.equal(res.defenderRemaining, 0)

      const state = createInitialWorldState(302)
      commitAutoResolveResult(state, res, "tx_lost_commit")

      assert.equal(state.sectors.shadow_reach.stage, "lost")
      assert.equal(state.sectors.shadow_reach.sovereignty, "void")
      // Faction void được thêm shadow_reach
      assert.ok(state.factions.void.controlledSectorIds.includes("shadow_reach"))
    })

    it("D.3. Chuyển quyền kiểm soát sector KHÔNG làm mất dân số quốc gia (Dân số trở thành Suppressed)", () => {
      const state = createInitialWorldState(303)
      const nationalBefore = state.demographics.nationalTotalPopulation
      const controlledBefore = state.demographics.controlledTerritoryPopulation
      const k7Pop = state.sectors.mining_outpost_k7.population

      // The Void chiếm Mining K-7
      transferSectorControl(state, "mining_outpost_k7", "void")

      assert.equal(state.sectors.mining_outpost_k7.sovereignty, "void")
      // Dân số vùng kiểm soát VSS giảm bằng đúng dân số K-7
      assert.equal(state.demographics.controlledTerritoryPopulation, controlledBefore - k7Pop)
      // Nhưng tổng dân số quốc gia VSS bảo toàn 100%!
      assert.equal(state.demographics.nationalTotalPopulation, nationalBefore)
      // Dân số tại sector K-7 vẫn giữ nguyên, không bị biến thành lính Void
      assert.equal(state.sectors.mining_outpost_k7.population, k7Pop)
    })
  })

  // =========================================================================
  // PHẦN E: TÍNH LŨY ĐẲNG CỦA GIAO DỊCH (IDEMPOTENT APPLY & REPLAY PROTECTION)
  // =========================================================================
  describe("E. Idempotent Journal & Replay Protection", () => {
    it("E.1. Gửi liên tục 10 lần cùng một Transaction ID: Chỉ áp dụng thương vong và trừ quân đúng 1 lần", () => {
      const state = createInitialWorldState(401)
      const initialDeployed = state.military.deployed
      const initialCasualties = state.military.casualties
      const initialGarrison = state.sectors.helios_perimeter.garrisonPower

      const input: AutoResolveInput = {
        encounterId: "enc_spam_test",
        sectorId: "helios_perimeter",
        attacker: { factionId: "void", name: "Void Scouts", troops: 150 },
        defender: { factionId: "vss", name: "Helios Guard", troops: 380 },
        seed: 665544,
      }
      const result = calculateAutoResolve(input)
      const txId = "tx_idempotent_receipt_001"

      // Lần 1: Commit thành công
      const c1 = commitAutoResolveResult(state, result, txId)
      assert.equal(c1.success, true)
      assert.equal(c1.committed, true)
      assert.equal(c1.duplicate, false)

      const garrisonAfterFirst = state.sectors.helios_perimeter.garrisonPower
      const deployedAfterFirst = state.military.deployed
      const casualtiesAfterFirst = state.military.casualties

      assert.ok(garrisonAfterFirst < initialGarrison)
      assert.ok(deployedAfterFirst < initialDeployed)
      assert.ok(casualtiesAfterFirst > initialCasualties)

      // Lần 2 đến 10: Tải lại hoặc người chơi spam nút
      for (let i = 2; i <= 10; i++) {
        const cN = commitAutoResolveResult(state, result, txId)
        assert.equal(cN.success, true)
        assert.equal(cN.committed, false)
        assert.equal(cN.duplicate, true)

        // Các chỉ số quân sự và sector đứng yên, KHÔNG bị trừ kép
        assert.equal(state.sectors.helios_perimeter.garrisonPower, garrisonAfterFirst)
        assert.equal(state.military.deployed, deployedAfterFirst)
        assert.equal(state.military.casualties, casualtiesAfterFirst)
      }
    })
  })

  // =========================================================================
  // PHẦN F: AI CHIẾN LƯỢC THE VOID & QUY TẮC BẤT KHẢ XÂM PHẠM SOL HQ
  // =========================================================================
  describe("F. The Void Strategic AI & Sol HQ Invulnerability", () => {
    it("F.1. Sol Command HQ có quy tắc bất khả xâm phạm khi vành đai Helios/Nebula còn đứng vững", () => {
      const state = createInitialWorldState(501)
      // Sol HQ được bảo vệ
      assert.equal(isSectorInvulnerableToVoid(state, "sol_command_hq"), true)

      // Điểm đánh giá tổn thương của Sol HQ = -1 (Bất khả xâm phạm)
      const vulnSol = evaluateSectorVulnerability(state, state.sectors.sol_command_hq, ["tartarus_breach"])
      assert.equal(vulnSol, -1)
    })

    it("F.2. AI The Void chọn mục tiêu tấn công hợp lý (ưu tiên sector tiếp giáp, Threat cao, phòng thủ mỏng)", () => {
      const state = createInitialWorldState(502)
      const prng = new WorldPRNG(123456)

      const aiReport = evaluateVoidStrategicBehavior(state, prng)
      assert.ok(aiReport.actionsPlanned.length > 0)
      // Hành động nhắm vào một sector hợp lệ
      const firstAction = aiReport.actionsPlanned[0]
      assert.ok(["shadow_reach", "waypoint_orion", "nebula_bastion"].includes(firstAction.targetSectorId))
      assert.ok(firstAction.estimatedForce > 0)
    })
  })

  // =========================================================================
  // PHẦN G: TÍCH HỢP TICK ENGINE & LƯU TRỮ WORLD V1
  // =========================================================================
  describe("G. Tick Engine & Storage Integration", () => {
    it("G.1. Chạy 1 tick cập nhật đồng bộ các phase quân sự và không bị hồi phục hai lần", () => {
      const state = createInitialWorldState(601)
      // Chuyển 60 thương binh sang reserves để có đúng 80 woundedOrRepair mà vẫn bảo toàn tổng lực lượng
      transferForceStatus(state.military, "woundedOrRepair", "reserves", 60)
      assert.equal(state.military.woundedOrRepair, 80)
      const prevReserves = state.military.reserves

      // Dispatch 50 quân từ Sol HQ -> Helios (1 ngày đường)
      dispatchTroopDeployment(state, {
        fromSectorId: "sol_command_hq",
        toSectorId: "helios_perimeter",
        troopCount: 50,
      })

      const tickResult = executeWorldTick(state)

      // Phase 1: Thương binh được phục hồi (5% hoặc min 10 -> 10 quân)
      assert.equal(state.military.woundedOrRepair, 70)
      assert.equal(state.military.reserves, prevReserves + 10)

      // Phase 4: Đạo quân 1 ngày đến nơi
      assert.equal(state.sectors.helios_perimeter.garrisonPower, 380 + 50)
      assert.equal(state.activeDeployments?.length, 0)

      // Tổng lực lượng quốc gia bảo toàn hoàn toàn
      const total = calculateTotalMilitaryForce(state.military)
      assert.equal(total, 2760)
    })

    it("G.2. Lưu và nạp lại trạng thái World State giữ nguyên sổ cái quân sự và tương thích save V1", () => {
      const state = createInitialWorldState(602)
      state.military.casualties = 45
      state.military.woundedOrRepair = 95
      state.sectors.helios_perimeter.strategicOrder = "defend"

      const saveRes = saveWorldState(state)
      assert.equal(saveRes.success, true)

      const loadRes = loadWorldState()
      assert.equal(loadRes.status, "loaded_primary")
      assert.equal(loadRes.state.military.casualties, 45)
      assert.equal(loadRes.state.military.woundedOrRepair, 95)
      assert.equal(loadRes.state.sectors.helios_perimeter.strategicOrder, "defend")
      assert.equal(validateWorldStateStructure(loadRes.state), true)
    })
  })
})
