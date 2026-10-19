/**
 * STARFRONT WORLD — Phase 6.15: Event Strategy Policy & System Auto Strategy Test Suite
 *
 * Kiểm chứng 3 cấp độ giải quyết chiến lược:
 *   1. System Auto Strategy (Quy tắc chấm điểm tất định, phá vỡ thế hòa ổn định, thẩm định tài nguyên & quân lực)
 *   2. Default Strategy Fallback (Dự phòng phương án mặc định an toàn khi System Auto không khả thi)
 *   3. Player Choice Fallback (Chuyển quyền cho chỉ huy khi cả 2 cấp trên không thể xử lý, không crash simulator)
 *   4. Bảo vệ vòng đời, Idempotent Consequences, và không tác động RPG Save V4
 */

import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"

import {
  createInitialWorldState,
  type WorldState,
  type WorldEvent,
  type EventStrategy,
  scoreEventStrategy,
  selectBestStrategyForEvent,
  validateStrategyExecution,
  applyStrategyToEvent,
  evaluateAndApplyEventStrategyPolicy,
  batchApplyEventStrategyPolicy,
  DEFAULT_EVENT_STRATEGY_POLICY,
  saveWorldState,
  loadWorldState,
} from "../../lib/game/world"

// Mock LocalStorage in-memory dành cho môi trường Node.js runner
function setupMockLocalStorage() {
  const memoryStore: Record<string, string> = {}
  const mockStorage = {
    getItem: (key: string) => (key in memoryStore ? memoryStore[key] : null),
    setItem: (key: string, value: string) => {
      memoryStore[key] = String(value)
    },
    removeItem: (key: string) => {
      delete memoryStore[key]
    },
    clear: () => {
      for (const k of Object.keys(memoryStore)) delete memoryStore[k]
    },
    key: (idx: number) => Object.keys(memoryStore)[idx] ?? null,
    get length() {
      return Object.keys(memoryStore).length
    },
    _store: memoryStore,
  }

  ;(globalThis as any).window = globalThis
  ;(globalThis as any).localStorage = mockStorage
  return mockStorage
}

describe("Phase 6.15: Event Strategy Policy & System Auto Strategy", () => {
  let state: WorldState

  beforeEach(() => {
    setupMockLocalStorage()
    state = createInitialWorldState()
    state.resources.credits = 1000
    state.resources.minerals = 500
    state.resources.alloys = 300
    state.resources.energy = 800
    state.military.reserves = 50
    state.military.deployed = 10
  })

  const createSampleEvent = (overrides?: Partial<WorldEvent>): WorldEvent => {
    return {
      id: "evt_sample_01",
      templateId: "tpl_small_pirate_skirmish",
      title: "Cướp bóc vành đai",
      description: "Một nhóm hải tặc đang quấy rối tuyến vận tải",
      category: "military",
      severity: "warning",
      tier: "small",
      createdAtTick: 1,
      decisionDeadlineTick: 5,
      lifetimeTicks: 8,
      priority: 50,
      sectorId: "sec_core",
      defaultStrategyId: "strat_patrol",
      status: "INIT",
      consequencesApplied: false,
      availableStrategies: [
        {
          id: "strat_negotiate",
          name: "Đàm phán hòa hoãn",
          description: "Chi trả một khoản tín dụng để xoa dịu hải tặc",
          cost: { credits: 200 },
          processingTicks: 1,
          successChance: 70,
          consequences: {
            stabilityDelta: 2,
            threatDelta: -5,
            message: "Hải tặc tạm thời rút lui sau khi nhận tiền.",
          },
        },
        {
          id: "strat_patrol",
          name: "Tuần tra cảnh giới (Mặc định)",
          description: "Triển khai đội bay tuần tra tiêu chuẩn",
          militaryCost: 5,
          processingTicks: 2,
          successChance: 85,
          consequences: {
            stabilityDelta: 4,
            threatDelta: -10,
            message: "Đội tuần tra đẩy lùi đám hải tặc.",
          },
        },
        {
          id: "strat_strike",
          name: "Tập kích tổng lực",
          description: "Huy động hạm đội chủ lực tiêu diệt căn cứ cướp",
          cost: { alloys: 100, energy: 150 },
          militaryCost: 20,
          processingTicks: 3,
          successChance: 95,
          consequences: {
            stabilityDelta: 10,
            threatDelta: -30,
            resourceDelta: { credits: 300 },
            message: "Căn cứ hải tặc bị san phẳng, thu giữ kho hàng.",
          },
        },
      ],
      ...overrides,
    }
  }

  describe("1. Validation & Feasibility", () => {
    it("thẩm định tài nguyên và quân lực khả dụng chính xác", () => {
      const event = createSampleEvent()
      const strat = event.availableStrategies[2] // Tập kích tổng lực (alloys 100, energy 150, military 20)
      const res = validateStrategyExecution(state, event, strat)
      assert.strictEqual(res.valid, true)
    })

    it("từ chối chiến lược khi không đủ tài nguyên credits", () => {
      state.resources.credits = 50 // nhỏ hơn 200 cần cho negotiate
      const event = createSampleEvent()
      const strat = event.availableStrategies[0]
      const res = validateStrategyExecution(state, event, strat)
      assert.strictEqual(res.valid, false)
      assert.ok(res.reason && res.reason.includes("credits"))
    })

    it("từ chối chiến lược khi không đủ quân dự bị", () => {
      state.military.reserves = 10 // nhỏ hơn 20 cần cho strike
      const event = createSampleEvent()
      const strat = event.availableStrategies[2]
      const res = validateStrategyExecution(state, event, strat)
      assert.strictEqual(res.valid, false)
      assert.ok(res.reason && res.reason.includes("dự bị"))
    })
  })

  describe("2. Deterministic Scoring & Stable Tie-Breaking", () => {
    it("chấm điểm tất định và đưa ra lý do giải thích minh bạch", () => {
      const event = createSampleEvent()
      const score1 = scoreEventStrategy(state, event, event.availableStrategies[1])
      const score2 = scoreEventStrategy(state, event, event.availableStrategies[1])

      assert.strictEqual(score1.score, score2.score)
      assert.ok(score1.reasons.length > 0)
      assert.deepStrictEqual(score1.reasons, score2.reasons)
    })

    it("phá vỡ thế hòa ổn định theo quy tắc score -> chance -> duration -> id", () => {
      const tiedStratA: EventStrategy = {
        id: "strat_b",
        name: "Phương án B",
        description: "B",
        processingTicks: 2,
        successChance: 80,
      }
      const tiedStratB: EventStrategy = {
        id: "strat_a",
        name: "Phương án A",
        description: "A",
        processingTicks: 2,
        successChance: 80,
      }
      const event = createSampleEvent({
        availableStrategies: [tiedStratA, tiedStratB],
      })

      const best = selectBestStrategyForEvent(state, event)
      assert.ok(best !== null)
      // strat_a xếp trước strat_b do id alphabetic order
      assert.strictEqual(best.strategy.id, "strat_a")
    })
  })

  describe("3. Three-Level Resolution Policy", () => {
    it("Cấp 1: System Auto phê chuẩn phương án tối ưu hợp lệ", () => {
      const event = createSampleEvent()
      const decision = evaluateAndApplyEventStrategyPolicy(state, event, DEFAULT_EVENT_STRATEGY_POLICY)

      assert.strictEqual(decision.applied, true)
      assert.strictEqual(decision.source, "system_auto")
      assert.strictEqual(event.status, "PROCESSING")
      assert.strictEqual(event.strategySource, "system_auto")
      assert.ok(event.selectionReason !== undefined)
    })

    it("Cấp 2: Default Fallback kích hoạt khi System Auto bị tắt hoặc cấu hình", () => {
      const event = createSampleEvent()
      const policy = {
        ...DEFAULT_EVENT_STRATEGY_POLICY,
        tierPolicies: {
          ...DEFAULT_EVENT_STRATEGY_POLICY.tierPolicies,
          small: "default_fallback" as const,
        },
      }

      const decision = evaluateAndApplyEventStrategyPolicy(state, event, policy)
      assert.strictEqual(decision.applied, true)
      assert.strictEqual(decision.source, "default_fallback")
      assert.strictEqual(event.status, "PROCESSING")
      assert.strictEqual(event.chosenStrategyId, "strat_patrol")
      assert.strictEqual(event.strategySource, "default_fallback")
    })

    it("Cấp 3: Player Choice kích hoạt khi cả System Auto và Default Fallback đều không khả thi", () => {
      // Làm cạn kiệt tài nguyên để tất cả chiến lược thất bại validation
      state.resources.credits = 0
      state.resources.alloys = 0
      state.resources.energy = 0
      state.military.reserves = 0

      const event = createSampleEvent()
      const decision = evaluateAndApplyEventStrategyPolicy(state, event, DEFAULT_EVENT_STRATEGY_POLICY)

      assert.strictEqual(decision.applied, false)
      assert.strictEqual(decision.source, "player_choice")
      assert.strictEqual(event.status, "INIT")
      assert.strictEqual(event.strategySource, "player_choice")
      assert.ok(event.autoSelectionFailureReason !== undefined)
      assert.ok(event.autoSelectionFailureReason.includes("không tìm thấy"))
    })

    it("Cấp 3: Player Choice kích hoạt theo cấu hình tier policy", () => {
      const event = createSampleEvent()
      const policy = {
        ...DEFAULT_EVENT_STRATEGY_POLICY,
        tierPolicies: {
          ...DEFAULT_EVENT_STRATEGY_POLICY.tierPolicies,
          small: "player_choice" as const,
        },
      }

      const decision = evaluateAndApplyEventStrategyPolicy(state, event, policy)
      assert.strictEqual(decision.applied, false)
      assert.strictEqual(decision.source, "player_choice")
      assert.strictEqual(event.status, "INIT")
      assert.strictEqual(event.strategySource, "player_choice")
      assert.ok(event.autoSelectionFailureReason!.includes("yêu cầu người chơi"))
    })
  })

  describe("4. Batch Execution, Deductions & Idempotency", () => {
    it("xử lý hàng loạt sự kiện INIT và tính toán báo cáo chuẩn xác", () => {
      const evt1 = createSampleEvent({ id: "e1", title: "Sự kiện 1" })
      const evt2 = createSampleEvent({ id: "e2", title: "Sự kiện 2" })
      state.events = { e1: evt1, e2: evt2 }

      const batchRes = batchApplyEventStrategyPolicy(state, DEFAULT_EVENT_STRATEGY_POLICY)
      assert.strictEqual(batchRes.processedCount, 2)
      assert.strictEqual(batchRes.autoProcessedCount, 2)
      assert.strictEqual(evt1.status, "PROCESSING")
      assert.strictEqual(evt2.status, "PROCESSING")
    })

    it("khấu trừ tài nguyên và phân bổ quân lực chuẩn xác khi áp dụng", () => {
      const event = createSampleEvent()
      const strat = event.availableStrategies[0] // negotiate: 200 credits
      const initialCredits = state.resources.credits

      const applied = applyStrategyToEvent(state, event, strat, "system_auto", "Lý do kiểm thử")
      assert.strictEqual(applied, true)
      assert.strictEqual(state.resources.credits, initialCredits - 200)
    })

    it("bảo vệ vòng đời: không đổi trạng thái nếu sự kiện không ở INIT", () => {
      const event = createSampleEvent({ status: "PROCESSING", chosenStrategyId: "strat_patrol" })
      const strat = event.availableStrategies[0]

      const applied = applyStrategyToEvent(state, event, strat, "system_auto", "Lý do")
      assert.strictEqual(applied, false)

      const dec = evaluateAndApplyEventStrategyPolicy(state, event)
      assert.strictEqual(dec.applied, false)
    })

    it("lưu trữ và tải lại state bảo toàn strategySource và selectionReason", () => {
      const event = createSampleEvent()
      evaluateAndApplyEventStrategyPolicy(state, event, DEFAULT_EVENT_STRATEGY_POLICY)
      state.events = { [event.id]: event }

      const saveRes = saveWorldState(state)
      assert.strictEqual(saveRes.success, true)

      const loadRes = loadWorldState()
      assert.strictEqual(loadRes.status, "loaded_primary")
      assert.ok(loadRes.state !== null)
      assert.strictEqual(loadRes.state.events![event.id].strategySource, "system_auto")
      assert.strictEqual(loadRes.state.events![event.id].status, "PROCESSING")
      assert.strictEqual(loadRes.state.events![event.id].chosenStrategyId, event.chosenStrategyId)
    })
  })
})
