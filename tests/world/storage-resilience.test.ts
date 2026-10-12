import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"

import {
  calculateChecksum,
  getBackupMetadata,
  inspectWorldStorage,
  isWorldStatePresent,
  loadWorldState,
  parseAndValidateEnvelope,
  resetWorldState,
  saveWorldState,
  validateWorldStateStructure,
  WORLD_BACKUP_KEY_A,
  WORLD_BACKUP_KEY_B,
  WORLD_BACKUP_META_KEY,
  WORLD_STAGING_KEY,
  WORLD_STORAGE_KEY_V1,
} from "../../lib/game/world/storage"
import { createInitialWorldState } from "../../lib/game/world/initial-state"
import type { WorldState } from "../../lib/game/world/types"
import { STORAGE_KEY_V4 } from "../../lib/game/storage"

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

describe("Phase 6.1 — WORLD Data Foundation & Isolated Save Resilience", () => {
  let storage: ReturnType<typeof setupMockLocalStorage>

  beforeEach(() => {
    storage = setupMockLocalStorage()
  })

  describe("1. Khởi Tạo Data Model & Cấu Trúc Trạng Thái Mặc Định", () => {
    it("createInitialWorldState tạo ra đối tượng WorldState hợp lệ với schema version 1", () => {
      const state = createInitialWorldState(42)

      assert.equal(state.version, 1, "Schema version phải là 1")
      assert.equal(state.worldSeed, 42, "World seed phải khớp giá trị truyền vào")
      assert.equal(state.currentDay, 1, "Bắt đầu từ Ngày 1")
      assert.ok(state.realTimeAnchor > 0, "Dấu thời gian Unix thực tế phải hợp lệ")

      // Kiểm tra 10 sector khởi đầu (Phase 6.28)
      const sectorIds = Object.keys(state.sectors)
      assert.equal(sectorIds.length, 10, "Khởi tạo đủ 10 sector ban đầu")
      assert.ok(sectorIds.includes("sol_command_hq"), "Phải có Sol Command HQ")
      assert.ok(sectorIds.includes("tartarus_breach"), "Phải có Tartarus Breach")
      assert.ok(sectorIds.includes("elysium_sanctuary"), "Phải có Elysium Sanctuary")
      assert.ok(sectorIds.includes("abyssal_rift"), "Phải có Abyssal Rift")

      // Kiểm tra 16 tuyến đường (Phase 6.28)
      assert.equal(state.routes.length, 16, "Khởi tạo đủ 16 tuyến siêu không gian")

      // Kiểm tra 4 nhóm tài nguyên + LƯƠNG THỰC (Food) bắt buộc
      assert.ok(state.resources.food > 0, "Lương thực phải là tài nguyên riêng biệt (>0)")
      assert.ok(state.resources.industrialMaterials > 0, "Phải có vật liệu công nghiệp")
      assert.ok(state.resources.energy > 0, "Phải có năng lượng")
      assert.ok(state.resources.logisticsSupplies > 0, "Phải có vật tư hậu cần")
      assert.ok(state.resources.tacticalData > 0, "Phải có dữ liệu chiến thuật")

      // Kiểm tra bảo toàn lực lượng quân sự
      const totalForces =
        state.military.deployed +
        state.military.reserves +
        state.military.woundedOrRepair +
        state.military.retreating +
        state.military.casualties
      assert.ok(totalForces > 0, "Tổng lực lượng quân sự phải dương")
      assert.equal(state.military.casualties, 0, "Ban đầu chưa có thương vong")

      // Kiểm tra nhân khẩu học
      assert.ok(state.demographics.nationalTotalPopulation > 0, "Dân số quốc gia phải dương")
      assert.ok(
        state.demographics.controlledTerritoryPopulation <= state.demographics.nationalTotalPopulation,
        "Dân số vùng kiểm soát không vượt quá tổng dân số quốc gia",
      )

      // Kiểm tra hàm validateWorldStateStructure
      assert.equal(validateWorldStateStructure(state), true, "State mặc định phải đạt chuẩn cấu trúc")
    })

    it("Từ chối các đối tượng WorldState bị thiếu trường bắt buộc hoặc sai version", () => {
      const state = createInitialWorldState()

      // Thiếu lương thực
      const withoutFood: any = { ...state, resources: { ...state.resources } }
      delete withoutFood.resources.food
      assert.equal(validateWorldStateStructure(withoutFood), false, "Phải từ chối nếu thiếu Lương thực")

      // Sai version
      const wrongVersion: any = { ...state, version: 2 }
      assert.equal(validateWorldStateStructure(wrongVersion), false, "Phải từ chối version != 1")

      // Thiếu sector
      const noSectors: any = { ...state, sectors: null }
      assert.equal(validateWorldStateStructure(noSectors), false, "Phải từ chối khi sectors không hợp lệ")

      // Thiếu quân sự
      const noMil: any = { ...state, military: {} }
      assert.equal(validateWorldStateStructure(noMil), false, "Phải từ chối khi military rỗng")
    })
  })

  describe("2. Tính Toán & Xác Thực Mã Băm Checksum (CRC32)", () => {
    it("calculateChecksum tính toán mã băm xác định 8 ký tự hex", () => {
      const hash1 = calculateChecksum("Hello Starfront World")
      const hash2 = calculateChecksum("Hello Starfront World")
      assert.equal(hash1, hash2, "Mã băm phải tất định (deterministic)")
      assert.equal(hash1.length, 8, "Mã băm phải đúng 8 ký tự hex")

      const hashDifferent = calculateChecksum("Hello Starfront World!")
      assert.notEqual(hash1, hashDifferent, "Thay đổi 1 ký tự phải sinh mã băm khác")
    })

    it("parseAndValidateEnvelope phát hiện giả mạo dữ liệu (tamper detection)", () => {
      const state = createInitialWorldState()
      const serialized = JSON.stringify(state)
      const checksum = calculateChecksum(serialized)

      const envelope = {
        schemaVersion: 1,
        timestamp: Date.now(),
        checksum,
        data: state,
      }

      // Hợp lệ
      const checkValid = parseAndValidateEnvelope(JSON.stringify(envelope))
      assert.equal(checkValid.valid, true)

      // Giả mạo dữ liệu mà không đổi checksum
      const tampered = {
        ...envelope,
        data: {
          ...state,
          currentDay: 999, // Đổi ngày
        },
      }
      const checkTampered = parseAndValidateEnvelope(JSON.stringify(tampered))
      assert.equal(checkTampered.valid, false, "Phải phát hiện checksum không khớp")
      assert.ok(checkTampered.error?.includes("Checksum mismatch"))
    })
  })

  describe("3. Cách Ly Hoàn Toàn Khỏi Lưu Trữ RPG v4 (Save Isolation)", () => {
    it("Mọi thao tác lưu, nạp, xoay vòng, hỏng hóc và reset của WORLD tuyệt đối KHÔNG làm biến đổi STARFRONT_SAVE_DATA_V4", () => {
      // 1. Giả lập dữ liệu tiến trình RPG v4 đang tồn tại trong localStorage
      const mockRpgV4Save = JSON.stringify({
        version: 4,
        level: 12,
        credits: 95000,
        alloy: 420,
        activePairing: { pilotId: "marcus", gearId: "vanguard", isLocked: true },
        inventory: [{ id: "wpn_legendary_plasma", enhancementLevel: 10 }],
      })
      storage.setItem(STORAGE_KEY_V4, mockRpgV4Save)

      // 2. Thực hiện toàn bộ chuỗi tác vụ của WORLD
      // a. Nạp lần đầu (tự sinh state mặc định)
      const load1 = loadWorldState()
      assert.equal(load1.status, "initialized_default")

      // b. Sửa đổi và lưu nhiều lần (kích hoạt xoay vòng backup)
      const modifiedState: WorldState = {
        ...load1.state,
        currentDay: 5,
        resources: { ...load1.state.resources, industrialMaterials: 9999 },
      }
      const saveRes1 = saveWorldState(modifiedState)
      assert.equal(saveRes1.success, true)

      modifiedState.currentDay = 6
      const saveRes2 = saveWorldState(modifiedState)
      assert.equal(saveRes2.success, true)

      // c. Cố tình làm hỏng khóa WORLD chính và kích hoạt auto-recovery
      storage.setItem(WORLD_STORAGE_KEY_V1, "CORRUPTED_JSON_DATA{{{{")
      const loadRecovered = loadWorldState()
      assert.equal(loadRecovered.recoveredFromBackup, true)

      // d. Reset toàn bộ World State
      resetWorldState()

      // 3. KIỂM ĐỊNH BẤT BIẾN: Khóa RPG v4 phải nguyên vẹn 100% không suy suyển
      const finalRpgV4 = storage.getItem(STORAGE_KEY_V4)
      assert.equal(finalRpgV4, mockRpgV4Save, "STARFRONT_SAVE_DATA_V4 phải được bảo toàn nguyên vẹn 100%")
    })
  })

  describe("4. Quy Trình Lưu Trữ Nguyên Tử & Sao Lưu Luân Phiên Slot A/B (Rotating Backups)", () => {
    it("Lưu lần 1 tạo primary; Lưu lần 2 đẩy bản cũ vào Slot A; Lưu lần 3 đẩy bản cũ vào Slot B; Lưu lần 4 xoay lại Slot A", () => {
      const state = createInitialWorldState()

      // Lần 1: Khởi tạo primary
      state.currentDay = 1
      const res1 = saveWorldState(state)
      assert.equal(res1.success, true)
      assert.equal(res1.backupRotated, null, "Lần đầu tiên chưa có bản cũ để xoay vòng")
      assert.ok(storage.getItem(WORLD_STORAGE_KEY_V1))
      assert.equal(storage.getItem(WORLD_BACKUP_KEY_A), null)
      assert.equal(storage.getItem(WORLD_BACKUP_KEY_B), null)

      // Lần 2: Sửa state -> Lưu -> Primary cũ (Ngày 1) xoay vào Slot A
      state.currentDay = 2
      const res2 = saveWorldState(state)
      assert.equal(res2.success, true)
      assert.equal(res2.backupRotated, "A", "Primary cũ phải được đẩy vào Slot A")

      const backupA = JSON.parse(storage.getItem(WORLD_BACKUP_KEY_A)!)
      assert.equal(backupA.data.currentDay, 1, "Slot A chứa bản ghi Ngày 1")

      // Lần 3: Sửa state -> Lưu -> Primary cũ (Ngày 2) xoay vào Slot B
      state.currentDay = 3
      const res3 = saveWorldState(state)
      assert.equal(res3.success, true)
      assert.equal(res3.backupRotated, "B", "Primary cũ phải được đẩy vào Slot B")

      const backupB = JSON.parse(storage.getItem(WORLD_BACKUP_KEY_B)!)
      assert.equal(backupB.data.currentDay, 2, "Slot B chứa bản ghi Ngày 2")

      // Lần 4: Sửa state -> Lưu -> Primary cũ (Ngày 3) xoay lại Slot A
      state.currentDay = 4
      const res4 = saveWorldState(state)
      assert.equal(res4.success, true)
      assert.equal(res4.backupRotated, "A", "Chu kỳ luân phiên quay lại Slot A")

      const backupA2 = JSON.parse(storage.getItem(WORLD_BACKUP_KEY_A)!)
      assert.equal(backupA2.data.currentDay, 3, "Slot A hiện chứa bản ghi Ngày 3")

      // Kiểm tra metadata
      const meta = getBackupMetadata()
      assert.equal(meta.lastWrittenSlot, "A")
      assert.equal(meta.rotationCount, 3)
      assert.ok(meta.slotATimestamp)
      assert.ok(meta.slotBTimestamp)
    })

    it("Không bao giờ xóa bỏ hoặc ghi đè backup nếu quá trình lưu mới bị lỗi cấu trúc", () => {
      // Thiết lập trạng thái hợp lệ đã có Backup A
      const state = createInitialWorldState()
      state.currentDay = 1
      saveWorldState(state)
      state.currentDay = 2
      saveWorldState(state) // Đẩy Ngày 1 vào Slot A

      const backupABefore = storage.getItem(WORLD_BACKUP_KEY_A)

      // Cố tình lưu một state bị lỗi cấu trúc
      const invalidState: any = { version: 1, currentDay: 3, resources: {} } // Thiếu food & sectors
      const failedSave = saveWorldState(invalidState)

      assert.equal(failedSave.success, false)
      assert.equal(storage.getItem(WORLD_STAGING_KEY), null, "Staging phải được dọn dẹp sạch")
      assert.equal(storage.getItem(WORLD_BACKUP_KEY_A), backupABefore, "Slot A không bị sửa đổi khi lưu lỗi")
    })
  })

  describe("5. Khả Năng Tự Phục Hồi Khi Save Chính Bị Hỏng (Auto-Rescue & Recovery)", () => {
    it("Tự động phục hồi từ Backup Slot mới nhất khi save chính bị lỗi cú pháp JSON", () => {
      const state = createInitialWorldState()
      state.currentDay = 10
      saveWorldState(state)
      state.currentDay = 11
      saveWorldState(state) // Ngày 10 nằm trong Slot A
      state.currentDay = 12
      saveWorldState(state) // Ngày 11 nằm trong Slot B (mới hơn Slot A)

      // Cố tình phá hỏng khóa chính bằng chuỗi rác
      storage.setItem(WORLD_STORAGE_KEY_V1, "{ corrupted json syntax [[")

      // Nạp lại
      const recovery = loadWorldState()
      assert.equal(recovery.recoveredFromBackup, true, "Phải kích hoạt cờ recoveredFromBackup")
      assert.equal(recovery.status, "recovered_backup_b", "Phải phục hồi từ Slot B (mới hơn Slot A)")
      assert.equal(recovery.state.currentDay, 11, "Dữ liệu phục hồi phải là Ngày 11")
      assert.ok(recovery.message.includes("Slot B"), "Thông báo phục hồi phải nêu rõ Slot B")

      // Kiểm tra xem khóa chính đã được tự sửa chữa thành state hợp lệ chưa
      assert.equal(isWorldStatePresent(), true, "Khóa chính đã được tự động tái lập trạng thái khỏe mạnh")
    })

    it("Tự động phục hồi từ Backup khi save chính bị sửa lén dữ liệu (Checksum mismatch)", () => {
      const state = createInitialWorldState()
      state.currentDay = 20
      saveWorldState(state)
      state.currentDay = 21
      saveWorldState(state) // Ngày 20 nằm trong Slot A

      // Đọc envelope chính và sửa dữ liệu mà giữ nguyên checksum cũ
      const rawPrimary = storage.getItem(WORLD_STORAGE_KEY_V1)!
      const env = JSON.parse(rawPrimary)
      env.data.resources.food = 0 // Giả mạo lương thực
      storage.setItem(WORLD_STORAGE_KEY_V1, JSON.stringify(env))

      // Nạp lại
      const recovery = loadWorldState()
      assert.equal(recovery.recoveredFromBackup, true)
      assert.equal(recovery.status, "recovered_backup_a")
      assert.equal(recovery.state.currentDay, 20)
    })

    it("Khi cả save chính và toàn bộ backup đều bị hỏng nặng, tự phục hồi về default state an toàn", () => {
      // Phá hỏng toàn bộ các khóa
      storage.setItem(WORLD_STORAGE_KEY_V1, "CORRUPTED_1")
      storage.setItem(WORLD_BACKUP_KEY_A, "CORRUPTED_2")
      storage.setItem(WORLD_BACKUP_KEY_B, "CORRUPTED_3")

      const recovery = loadWorldState()
      assert.equal(recovery.status, "initialized_default")
      assert.equal(recovery.state.version, 1)
      assert.equal(recovery.state.currentDay, 1)
      assert.ok(recovery.message.includes("khởi tạo lại trạng thái mặc định an toàn"))
    })
  })

  describe("6. Kiểm Tra Toàn Diện Trạng Thái Kho Lưu Trữ (Diagnostics & Reset)", () => {
    it("inspectWorldStorage phản ánh chính xác trạng thái của từng slot lưu trữ", () => {
      const diagEmpty = inspectWorldStorage()
      assert.equal(diagEmpty.primaryValid, false)
      assert.equal(diagEmpty.backupAValid, false)
      assert.equal(diagEmpty.backupBValid, false)

      const state = createInitialWorldState()
      saveWorldState(state)
      saveWorldState(state)

      const diagActive = inspectWorldStorage()
      assert.equal(diagActive.primaryValid, true)
      assert.equal(diagActive.backupAValid, true)
      assert.equal(diagActive.backupBValid, false)
      assert.equal(diagActive.metadata.lastWrittenSlot, "A")
    })

    it("resetWorldState xóa toàn bộ khóa World và khởi tạo lại state sạch sẽ", () => {
      const state = createInitialWorldState()
      saveWorldState(state)
      saveWorldState(state)

      // Thêm 1 khóa phụ bất kỳ của game
      storage.setItem("ANOTHER_GAME_KEY", "PRESERVED_VALUE")

      const freshState = resetWorldState()
      assert.equal(freshState.version, 1)
      assert.equal(freshState.currentDay, 1)

      // Khóa ngoài không bị ảnh hưởng
      assert.equal(storage.getItem("ANOTHER_GAME_KEY"), "PRESERVED_VALUE")
    })
  })
})
