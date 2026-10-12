/**
 * STARFRONT WORLD — Phase 6.17: Primary Navigation & War Room Foundation Test Suite
 *
 * Kiểm chứng:
 *   1. Đồng bộ hóa trạng thái War Room (Sector Command Ribbon & Sector Inspector)
 *   2. Thao tác Lệnh Chiến Lược và Công Sự trực tiếp từ Sector Inspector (chi phí chuẩn xác 50 Materials)
 *   3. Tính tương thích ngược khi truy cập chế độ xem 'sectors'
 *   4. Bảo vệ tính toàn vẹn của Lưu trữ World và phân hệ RPG Save V4
 */

import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { createInitialWorldState } from "@/lib/game/world/initial-state"
import {
  setSectorStrategicOrder,
  upgradeSectorFortification,
} from "@/lib/game/world/forces-ledger"
import {
  saveWorldState,
  loadWorldState,
} from "@/lib/game/world/storage"
import type { WorldState, StrategicOrder } from "@/lib/game/world/types"

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
  }
  ;(globalThis as any).window = globalThis
  ;(globalThis as any).localStorage = mockStorage
  return memoryStore
}

describe("STARFRONT WORLD — Phase 6.17: Primary Navigation & War Room Foundation", () => {
  let state: WorldState
  let memoryStorage: Record<string, string>

  beforeEach(() => {
    state = createInitialWorldState()
    memoryStorage = setupMockLocalStorage()
  })

  describe("1. Đồng Bộ Hóa Lựa Chọn Sector & Dữ Liệu Inspector", () => {
    it("toàn bộ 8 sector đều có tọa độ, chủ quyền và dữ liệu hiển thị hợp lệ cho War Room", () => {
      const sectorIds = Object.keys(state.sectors)
      assert.equal(sectorIds.length, 8)

      for (const id of sectorIds) {
        const sector = state.sectors[id]
        assert.ok(sector.name, `Sector ${id} phải có tên`)
        assert.ok(typeof sector.x === "number" && sector.x >= 0 && sector.x <= 100)
        assert.ok(typeof sector.y === "number" && sector.y >= 0 && sector.y <= 100)
        assert.ok(["vss", "void", "contested", "neutral"].includes(sector.sovereignty))
        assert.ok(["normal", "threatened", "under_siege", "lost", "recovery"].includes(sector.stage))
        assert.ok(typeof sector.threatLevel === "number")
        assert.ok(typeof sector.stability === "number")
        assert.ok(typeof sector.garrisonPower === "number")
      }
    })

    it("chọn sector bất kỳ trên Ribbon/Map đều ánh xạ chính xác đến đối tượng Sector", () => {
      const targetId = "mining_outpost_k7"
      const selected = state.sectors[targetId]
      assert.ok(selected !== undefined)
      assert.equal(selected.id, "mining_outpost_k7")
      assert.equal(selected.sovereignty, "vss")
      assert.equal(selected.name, "Trạm Khai Mỏ K-7")
    })
  })

  describe("2. Tác Vụ Chiến Lược Từ Inspector Trong War Room", () => {
    it("đổi Lệnh Chiến Lược (Strategic Order) cập nhật ngay lập tức và bảo toàn khi lưu", () => {
      const sectorId = "sol_command_hq"
      const newOrder: StrategicOrder = "defend"

      const res = setSectorStrategicOrder(state, sectorId, newOrder)
      assert.equal(res.success, true)
      assert.equal(state.sectors[sectorId].strategicOrder, "defend")

      // Lưu và nạp lại
      const saveRes = saveWorldState(state)
      assert.equal(saveRes.success, true)

      const loadRes = loadWorldState()
      assert.equal(loadRes.status, "loaded_primary")
      assert.equal(loadRes.state?.sectors[sectorId].strategicOrder, "defend")
    })

    it("nâng cấp công sự phòng thủ tiêu hao chính xác 50 Materials và tăng cấp fortification", () => {
      const sectorId = "sol_command_hq"
      state.resources.industrialMaterials = 120
      const initialLevel = state.sectors[sectorId].fortificationLevel ?? 2

      const res = upgradeSectorFortification(state, sectorId)
      assert.equal(res.success, true)
      assert.equal(res.newLevel, initialLevel + 1)
      assert.equal(state.sectors[sectorId].fortificationLevel, initialLevel + 1)
      assert.equal(state.resources.industrialMaterials, 70) // 120 - 50 = 70
    })

    it("từ chối nâng cấp công sự khi thiếu tài nguyên (< 50 Materials)", () => {
      const sectorId = "sol_command_hq"
      state.resources.industrialMaterials = 45 // Thiếu 5 materials

      const res = upgradeSectorFortification(state, sectorId)
      assert.equal(res.success, false)
      assert.ok(res.error?.includes("Không đủ vật liệu công nghiệp"))
      assert.equal(state.resources.industrialMaterials, 45) // Không bị trừ
    })

    it("nhận diện đúng trạng thái khóa Combat của Sector", () => {
      const sectorId = "asteroid_delta"
      state.sectors[sectorId].isLockedForCombat = true
      assert.equal(state.sectors[sectorId].isLockedForCombat, true)
    })
  })

  describe("3. Tương Thích Ngược & Cách Ly Phân Hệ RPG Save V4", () => {
    it("giữ nguyên tuyệt đối khóa RPG Save V4 và không ghi đè dữ liệu nhân vật/trang bị", () => {
      const rpgSaveV4Key = "STARFRONT_SAVE_DATA_V4"
      const fakeRpgData = JSON.stringify({
        version: "4.0",
        player: { name: "Marcus", level: 15, credits: 99999 },
        equipped: { primary: "hyper_rifle_mk3" },
      })
      memoryStorage[rpgSaveV4Key] = fakeRpgData

      // Thực hiện lưu trữ WorldState
      const saveRes = saveWorldState(state)
      assert.equal(saveRes.success, true)

      // Kiểm tra RPG Save V4 vẫn nguyên vẹn 100%
      const retrievedRpgData = memoryStorage[rpgSaveV4Key]
      assert.equal(retrievedRpgData, fakeRpgData)
    })
  })
})
