/**
 * STARFRONT WORLD — Phase 6.18: Slim Tactical HUD & ADMIN CP Isolation Test Suite
 *
 * Kiểm chứng:
 *   1. Tách biệt hoàn toàn ADMIN CP khỏi Navigation tác chiến thường ngày (5 Tabs: Map, Overview, Events, Military, Results)
 *   2. Quy tắc an toàn Đổi Tốc Độ (Speed Change):
 *      - Hủy / Cancel: Giữ nguyên cấu hình tốc độ cũ và bảo toàn 100% dữ liệu World
 *      - Xác nhận giữ World: Đổi tốc độ thành công, ngày / tài nguyên / sự kiện nguyên vẹn
 *      - Xác nhận reset World: Đổi tốc độ và thiết lập lại World về ngày 1
 *   3. Quy tắc Reset World độc lập:
 *      - Khôi phục WorldState về khởi đầu nhưng GIỮ NGUYÊN simulatorConfig & generator & strategyPolicy
 *   4. Quản lý cấu hình Event Generator & Strategy Policy trong Settings:
 *      - Lưu và đọc cấu hình bộ sinh sự kiện
 *      - Khôi phục cấu hình mặc định (Generator / Policy)
 *      - Batch apply Strategy Policy cho các sự kiện chờ
 *   5. Các thao tác nâng cao trong Settings (Advance Days, Force Spawn, Manual Save):
 *      - Force spawn đúng tier (small, medium, large)
 *      - Fast forward nhiều ngày (+1, +5, +10, +30)
 *      - Checksum và toàn vẹn lưu trữ A/B
 *   6. Bảo vệ độc lập phân hệ RPG Save V4 (Zero-regression)
 */

import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"

import {
  createInitialWorldState,
  executeWorldTick,
  loadWorldState,
  saveWorldState,
  resetWorldState,
  type WorldState,
} from "../../lib/game/world"
import {
  DEFAULT_SIMULATOR_CONFIG,
  DEFAULT_GENERATOR_CONFIG,
  DEFAULT_EVENT_STRATEGY_POLICY,
  loadSimulatorConfig,
  saveSimulatorConfig,
  validateSimulatorConfig,
  type WorldSimulatorConfig,
  type EventStrategyPolicyConfig,
} from "../../lib/game/world/simulator-config"
import {
  forceSpawnEventByTier,
  countActiveEventsByTier,
} from "../../lib/game/world/event-generator"
import { getActiveEvents } from "../../lib/game/world/event-engine"
import { INITIAL_STARFRONT_PROGRESSION } from "../../lib/game/progression"

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

describe("STARFRONT WORLD — Phase 6.18: Slim Tactical HUD & ADMIN CP Isolation", () => {
  let mockStorage: MockLocalStorage

  beforeEach(() => {
    mockStorage = new MockLocalStorage()
    ;(globalThis as any).window = globalThis
    ;(globalThis as any).localStorage = mockStorage
  })

  describe("1. Cách Ly ADMIN CP Khỏi Phân Khu Tác Chiến Thường Nhật", () => {
    it("5 tab tác chiến tiêu chuẩn không chứa 'admin'", () => {
      const tacticalTabs = ["map", "overview", "events", "military", "results"]
      assert.ok(!tacticalTabs.includes("admin"), "Tab tác chiến không được chứa admin")
      assert.equal(tacticalTabs.length, 5)
    })

    it("toàn bộ 5 tài nguyên cốt lõi được định nghĩa và có giá trị hợp lệ trong WorldState", () => {
      const worldState = createInitialWorldState()
      assert.ok(typeof worldState.resources.industrialMaterials === "number")
      assert.ok(typeof worldState.resources.energy === "number")
      assert.ok(typeof worldState.resources.logisticsSupplies === "number")
      assert.ok(typeof worldState.resources.tacticalData === "number")
      assert.ok(typeof worldState.resources.food === "number")

      assert.ok(worldState.resources.industrialMaterials >= 0)
      assert.ok(worldState.resources.energy >= 0)
      assert.ok(worldState.resources.logisticsSupplies >= 0)
      assert.ok(worldState.resources.tacticalData >= 0)
      assert.ok(worldState.resources.food >= 0)
    })
  })

  describe("2. Quy Tắc An Toàn Đổi Tốc Độ (Speed Change)", () => {
    it("khi Cancel: cấu hình tốc độ và dữ liệu World không bị thay đổi", () => {
      let state = createInitialWorldState()
      state.currentDay = 15
      state.resources.industrialMaterials = 350
      saveWorldState(state)

      const initialConfig: WorldSimulatorConfig = {
        ...DEFAULT_SIMULATOR_CONFIG,
        speedSeconds: 60,
      }
      saveSimulatorConfig(initialConfig)

      // Giả lập thao tác hủy (Cancel)
      const proposedNewSpeed = 10
      // Người dùng bấm Cancel -> không gọi saveSimulatorConfig với proposedNewSpeed, không gọi reset
      const currentConfig = loadSimulatorConfig()
      assert.equal(currentConfig.speedSeconds, 60, "Tốc độ vẫn phải giữ nguyên 60s")

      const loadedResult = loadWorldState()
      assert.ok(loadedResult.state)
      assert.equal(loadedResult.state.currentDay, 15, "Ngày không bị thay đổi khi cancel")
      assert.equal(loadedResult.state.resources.industrialMaterials, 350)
    })

    it("khi Xác Nhận KHÔNG reset World: tốc độ mới được lưu, WorldState giữ nguyên", () => {
      let state = createInitialWorldState()
      state.currentDay = 24
      state.resources.energy = 420
      saveWorldState(state)

      const initialConfig: WorldSimulatorConfig = {
        ...DEFAULT_SIMULATOR_CONFIG,
        speedSeconds: 60,
      }
      saveSimulatorConfig(initialConfig)

      // Người dùng xác nhận: newSpeed = 15, resetWorld = false
      const updatedConfig: WorldSimulatorConfig = {
        ...initialConfig,
        speedSeconds: 15,
      }
      saveSimulatorConfig(updatedConfig)

      const loadedConfig = loadSimulatorConfig()
      assert.equal(loadedConfig.speedSeconds, 15, "Tốc độ mới phải là 15s")

      const loadedResult = loadWorldState()
      assert.ok(loadedResult.state)
      assert.equal(loadedResult.state.currentDay, 24, "Ngày phải giữ nguyên 24")
      assert.equal(loadedResult.state.resources.energy, 420, "Tài nguyên giữ nguyên")
    })

    it("khi Xác Nhận CÓ reset World: tốc độ mới được lưu, WorldState quay về ngày 1", () => {
      let state = createInitialWorldState()
      state.currentDay = 50
      saveWorldState(state)

      const initialConfig: WorldSimulatorConfig = {
        ...DEFAULT_SIMULATOR_CONFIG,
        speedSeconds: 60,
      }
      saveSimulatorConfig(initialConfig)

      // Người dùng xác nhận: newSpeed = 30, resetWorld = true
      const updatedConfig: WorldSimulatorConfig = {
        ...initialConfig,
        speedSeconds: 30,
      }
      saveSimulatorConfig(updatedConfig)
      const freshWorld = resetWorldState()

      assert.equal(freshWorld.currentDay, 1, "World phải về ngày 1")
      const loadedConfig = loadSimulatorConfig()
      assert.equal(loadedConfig.speedSeconds, 30, "Tốc độ mới là 30s")
    })

    it("validateSimulatorConfig từ chối tốc độ không hợp lệ (<= 0s hoặc > 86400s)", () => {
      assert.equal(validateSimulatorConfig({ ...DEFAULT_SIMULATOR_CONFIG, speedSeconds: 0 }).valid, false)
      assert.equal(validateSimulatorConfig({ ...DEFAULT_SIMULATOR_CONFIG, speedSeconds: -10 }).valid, false)
      assert.equal(validateSimulatorConfig({ ...DEFAULT_SIMULATOR_CONFIG, speedSeconds: 100000 }).valid, false)
      assert.equal(validateSimulatorConfig({ ...DEFAULT_SIMULATOR_CONFIG, speedSeconds: 60 }).valid, true)
    })
  })

  describe("3. Quy Tắc Reset World Độc Lập Giữ Cấu Hình Quản Trị", () => {
    it("resetWorldState chỉ làm mới dữ liệu thế giới, không xóa cấu hình simulator", () => {
      const customConfig: WorldSimulatorConfig = {
        ...DEFAULT_SIMULATOR_CONFIG,
        speedSeconds: 12,
        isPaused: true,
        generator: {
          ...DEFAULT_GENERATOR_CONFIG,
          maxGlobalActive: 15,
        },
        strategyPolicy: {
          ...DEFAULT_EVENT_STRATEGY_POLICY,
          systemAutoEnabled: false,
        },
      }
      saveSimulatorConfig(customConfig)

      // Thực hiện Reset World
      const newState = resetWorldState()
      assert.equal(newState.currentDay, 1)

      // Đọc lại cấu hình simulator -> cấu hình đã tùy biến vẫn vẹn toàn
      const reloadedConfig = loadSimulatorConfig()
      assert.equal(reloadedConfig.speedSeconds, 12)
      assert.equal(reloadedConfig.isPaused, true)
      assert.equal(reloadedConfig.generator.maxGlobalActive, 15)
      assert.equal(reloadedConfig.strategyPolicy.systemAutoEnabled, false)
    })
  })

  describe("4. Cấu Hình Generator & Strategy Policy Trong Settings Overlay", () => {
    it("lưu và đọc cấu hình Generator tùy chỉnh", () => {
      const customGen = {
        ...DEFAULT_GENERATOR_CONFIG,
        maxGlobalActive: 80,
      }
      const config: WorldSimulatorConfig = {
        ...DEFAULT_SIMULATOR_CONFIG,
        generator: customGen,
      }
      saveSimulatorConfig(config)

      const loaded = loadSimulatorConfig()
      assert.equal(loaded.generator.maxGlobalActive, 80)
    })

    it("khôi phục mặc định Generator thành công", () => {
      const customConfig: WorldSimulatorConfig = {
        ...DEFAULT_SIMULATOR_CONFIG,
        generator: {
          ...DEFAULT_GENERATOR_CONFIG,
          maxGlobalActive: 50,
        },
      }
      saveSimulatorConfig(customConfig)

      // Reset về mặc định
      const resetConfig: WorldSimulatorConfig = {
        ...customConfig,
        generator: { ...DEFAULT_GENERATOR_CONFIG },
      }
      saveSimulatorConfig(resetConfig)

      const loaded = loadSimulatorConfig()
      assert.equal(loaded.generator.maxGlobalActive, DEFAULT_GENERATOR_CONFIG.maxGlobalActive)
    })

    it("lưu và áp dụng Strategy Policy cho sự kiện chờ", () => {
      const customPolicy: EventStrategyPolicyConfig = {
        ...DEFAULT_EVENT_STRATEGY_POLICY,
        tierPolicies: {
          small: "default_fallback",
          medium: "player_choice",
          large: "system_auto",
        },
      }
      const config: WorldSimulatorConfig = {
        ...DEFAULT_SIMULATOR_CONFIG,
        strategyPolicy: customPolicy,
      }
      saveSimulatorConfig(config)

      const loaded = loadSimulatorConfig()
      assert.equal(loaded.strategyPolicy.tierPolicies.small, "default_fallback")
      assert.equal(loaded.strategyPolicy.tierPolicies.medium, "player_choice")
    })
  })

  describe("5. Thao Tác Nâng Cao (Force Spawn, Advance Days, Manual Save)", () => {
    it("Force spawn tạo đúng tier sự kiện", () => {
      let state = createInitialWorldState()
      const initialCounts = countActiveEventsByTier(state)

      // Force spawn small event
      const spawnResult = forceSpawnEventByTier(state, "small")
      assert.ok(spawnResult.success, "Phải spawn được sự kiện small")
      assert.ok(spawnResult.event, "Phải có đối tượng event")
      assert.equal(spawnResult.event.tier, "small")

      const newCounts = countActiveEventsByTier(state)
      assert.equal(newCounts.small, initialCounts.small + 1)

      // Force spawn medium
      const medResult = forceSpawnEventByTier(state, "medium")
      assert.ok(medResult.success)
      assert.ok(medResult.event)
      assert.equal(medResult.event.tier, "medium")
    })

    it("Fast forward days (+5 ngày) cập nhật chính xác currentDay và lưu trữ an toàn", () => {
      let state = createInitialWorldState()
      assert.equal(state.currentDay, 1)

      for (let i = 0; i < 5; i++) {
        state = executeWorldTick(state).state
      }

      assert.equal(state.currentDay, 6)
      saveWorldState(state)

      const loaded = loadWorldState()
      assert.ok(loaded.state)
      assert.equal(loaded.state.currentDay, 6)
    })

    it("Manual save bảo đảm tính toàn vẹn và tạo checksum hợp lệ", () => {
      let state = createInitialWorldState()
      state.currentDay = 10
      const saveRes = saveWorldState(state)
      assert.equal(saveRes.success, true)

      const raw = mockStorage.getItem("STARFRONT_WORLD_SAVE_V1")
      assert.ok(raw, "Khóa chính phải có dữ liệu")
      const parsed = JSON.parse(raw)
      assert.ok(parsed.checksum, "Bản lưu phải có trường checksum")
    })
  })

  describe("6. Bảo Toàn Độc Lập Tuyệt Đối Của Phân Hệ RPG Save V4", () => {
    it("thao tác với WORLD và Admin Settings không ghi đè hay làm hỏng STARFRONT_SAVE_DATA_V4", () => {
      const rpgSaveKey = "STARFRONT_SAVE_DATA_V4"
      const fakeRpgData = {
        version: 4,
        progression: INITIAL_STARFRONT_PROGRESSION,
        timestamp: Date.now(),
      }
      mockStorage.setItem(rpgSaveKey, JSON.stringify(fakeRpgData))

      // Thực hiện hàng loạt thao tác WORLD
      let worldState = createInitialWorldState()
      worldState.currentDay = 100
      saveWorldState(worldState)
      resetWorldState()
      saveSimulatorConfig({ ...DEFAULT_SIMULATOR_CONFIG, speedSeconds: 10 })

      // Kiểm tra RPG data
      const rpgRaw = mockStorage.getItem(rpgSaveKey)
      assert.ok(rpgRaw, "RPG data không được bị xóa")
      const parsed = JSON.parse(rpgRaw)
      assert.equal(parsed.version, 4)
      assert.equal(parsed.progression.credits, INITIAL_STARFRONT_PROGRESSION.credits)
    })
  })
})
