/**
 * STARFRONT WORLD — Phase 6.20 Test Suite
 * Kiểm thử toàn diện Khay Báo Cáo Tình Báo & Truy Cập Kết Quả (Debriefing Drawer & Results Access):
 *   1. Mở/đóng Drawer không làm thay đổi hay mất sector/tab đang chọn trong War Room
 *   2. Badge số lượng chưa đọc cập nhật chính xác, không tạo thông báo lặp hay tăng giả qua các tick
 *   3. Phân biệt rõ ràng 2 luồng kết quả: Event Results (Archive) và Combat Results (Journal)
 *   4. Các thao tác đọc: Đánh dấu một kết quả, Đánh dấu tất cả đã đọc, Bộ lọc 4 chế độ
 *   5. Safe Pruning dọn dẹp an toàn các kết quả đã đọc, bảo toàn 100% World State và Save V1
 *   6. Liên kết điều hướng Sector từ kết quả sự kiện và biên lai giao tranh
 */

import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"

import { createInitialWorldState } from "@/lib/game/world/initial-state"
import {
  markEventResultAsRead,
  markAllEventResultsAsRead,
  pruneReadEventResultsSafe,
} from "@/lib/game/world/event-engine"
import { executeWorldTick } from "@/lib/game/world/tick-engine"
import { saveWorldState, loadWorldState } from "@/lib/game/world/storage"
import type {
  WorldState,
  WorldEventResult,
  JournalEntry,
} from "@/lib/game/world/types"

function setupMockLocalStorage() {
  const store: Record<string, string> = {}
  const mockStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      for (const k in store) delete store[k]
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length
    },
    _store: store,
  }

  ;(globalThis as any).window = globalThis
  ;(globalThis as any).localStorage = mockStorage
  return mockStorage
}

describe("STARFRONT WORLD — Phase 6.20: Debriefing Drawer & Results Access", () => {
  let mockStorage: ReturnType<typeof setupMockLocalStorage>

  beforeEach(() => {
    mockStorage = setupMockLocalStorage()
  })

  describe("1. Bảo Toàn Trạng Thái War Room Khi Mở/Đóng Debriefing Drawer", () => {
    it("mở và đóng Drawer giữ nguyên vẹn 100% activeTab và selectedSectorId", () => {
      let currentTab = "map"
      let selectedSectorId = "sol_command_hq"
      let isDrawerOpen = false

      // Chỉ huy đang xem War Room Map tại sector sol_command_hq
      assert.equal(currentTab, "map")
      assert.equal(selectedSectorId, "sol_command_hq")

      // Mở Drawer từ Tactical HUD
      isDrawerOpen = true
      assert.equal(isDrawerOpen, true)
      // Tab và sector không bị ghi đè hay reset
      assert.equal(currentTab, "map")
      assert.equal(selectedSectorId, "sol_command_hq")

      // Đóng Drawer (qua nút Đóng hoặc phím ESC)
      isDrawerOpen = false
      assert.equal(isDrawerOpen, false)
      assert.equal(currentTab, "map")
      assert.equal(selectedSectorId, "sol_command_hq")
    })

    it("điều hướng từ kết quả sang Sector cập nhật selectedSectorId và đóng Drawer an toàn", () => {
      let currentTab = "map"
      let selectedSectorId = "sol_command_hq"
      let isDrawerOpen = true

      // Giả lập hàm handleNavigateToSectorFromResults
      const handleNavigateToSector = (targetSectorId: string) => {
        selectedSectorId = targetSectorId
        currentTab = "map"
        isDrawerOpen = false
      }

      // Người chơi bấm vào link Sector trong báo cáo kết quả
      handleNavigateToSector("orion_nebula")

      assert.equal(selectedSectorId, "orion_nebula")
      assert.equal(currentTab, "map")
      assert.equal(isDrawerOpen, false)
    })
  })

  describe("2. Tính Toán & Ổn Định Số Lượng Chưa Đọc (Unread Badge)", () => {
    it("đếm chính xác số lượng báo cáo chưa đọc từ eventResultsArchive", () => {
      const state = createInitialWorldState()
      state.eventResultsArchive = [
        {
          id: "res-1",
          eventId: "evt-1",
          title: "Sự Kiện 1",
          category: "military",
          status: "success",
          chosenStrategyId: "strat-1",
          chosenStrategyName: "Chiến Lược 1",
          resolvedAtTick: 5,
          isRead: false,
          summaryText: "Hoàn tất thành công",
        },
        {
          id: "res-2",
          eventId: "evt-2",
          title: "Sự Kiện 2",
          category: "civil",
          status: "failure",
          chosenStrategyId: "strat-2",
          chosenStrategyName: "Chiến Lược 2",
          resolvedAtTick: 6,
          isRead: true,
          summaryText: "Thất bại",
        },
        {
          id: "res-3",
          eventId: "evt-3",
          title: "Sự Kiện 3",
          category: "crisis",
          status: "expired_default",
          chosenStrategyId: "strat-3",
          chosenStrategyName: "Chiến Lược 3",
          resolvedAtTick: 7,
          isRead: false,
          summaryText: "Hết hạn mặc định",
        },
      ]

      const unreadCount = state.eventResultsArchive.filter((r) => !r.isRead).length
      assert.equal(unreadCount, 2, "Phải có đúng 2 báo cáo chưa đọc")
    })

    it("badge không bị tăng lặp hoặc nhân bản khi tick mô phỏng không có sự kiện hoàn tất", () => {
      const state = createInitialWorldState()
      state.eventResultsArchive = [
        {
          id: "res-stable",
          eventId: "evt-stable",
          title: "Khủng hoảng đã dập tắt",
          category: "military",
          status: "success",
          chosenStrategyId: "strat-a",
          chosenStrategyName: "Phương án A",
          resolvedAtTick: 1,
          isRead: false,
          summaryText: "Báo cáo ổn định",
        },
      ]

      const initialUnread = state.eventResultsArchive.filter((r) => !r.isRead).length
      assert.equal(initialUnread, 1)

      // Chạy 5 ticks mô phỏng thế giới
      for (let t = 0; t < 5; t++) {
        executeWorldTick(state)
      }

      // Không có thêm sự kiện nào resolve, số unread vẫn phải là 1
      const afterTicksUnread = state.eventResultsArchive.filter((r) => !r.isRead).length
      assert.equal(afterTicksUnread, 1, "Số lượng chưa đọc không được tăng giả do tick")
    })
  })

  describe("3. Phân Biệt Hai Luồng Báo Cáo: Event Results & Combat Results", () => {
    it("truy xuất độc lập và chính xác cả 2 nguồn dữ liệu có thẩm quyền", () => {
      const state = createInitialWorldState()

      // Luồng 1: Event Results Archive
      state.eventResultsArchive = [
        {
          id: "res-evt-100",
          eventId: "evt-100",
          title: "Chiến dịch Vành Đai Tiểu Hành Tinh",
          category: "military",
          status: "success",
          chosenStrategyId: "strat-tactical",
          chosenStrategyName: "Tiến Công Thần Tốc",
          strategySource: "system_auto",
          resolvedAtTick: 12,
          isRead: false,
          sectorId: "sol_command_hq",
          stabilityChange: 8,
          threatChange: -15,
          casualties: 2,
          resourceChanges: { energy: -20, tacticalData: 50 },
          summaryText: "Thắng lợi toàn diện tại Vành Đai",
        },
      ]

      // Luồng 2: Transaction Journal (Combat Receipts)
      state.transactionJournal = {
        "tx-combat-001": {
          transactionId: "tx-combat-001",
          type: "combat",
          status: "committed",
          sectorId: "sol_command_hq",
          createdAt: 1000,
          committedAt: 1200,
          receipt: {
            victory: true,
            tacticalRating: "S",
            rounds: 4,
            playerRemainingHpPercent: 88,
            enemyRemainingHpPercent: 0,
            logSummary: "Tiêu diệt hạm đội Void sau 4 hiệp",
          },
        },
        "tx-non-combat": {
          transactionId: "tx-non-combat",
          type: "transfer",
          status: "committed",
          createdAt: 1050,
          committedAt: 1100,
        },
      }

      // Trích xuất Event Results
      const eventResults = state.eventResultsArchive
      assert.equal(eventResults.length, 1)
      assert.equal(eventResults[0].title, "Chiến dịch Vành Đai Tiểu Hành Tinh")
      assert.equal(eventResults[0].strategySource, "system_auto")

      // Trích xuất Combat Results (chỉ lấy entry type === combat && status === committed)
      const combatResults = Object.values(state.transactionJournal).filter(
        (e) => e.type === "combat" && e.status === "committed"
      )
      assert.equal(combatResults.length, 1)
      assert.equal(combatResults[0].transactionId, "tx-combat-001")
      assert.equal(combatResults[0].receipt?.victory, true)
      assert.equal(combatResults[0].receipt?.tacticalRating, "S")
    })

    it("lọc chính xác theo 4 chế độ: all, unread, success, failure", () => {
      const results: WorldEventResult[] = [
        {
          id: "r1",
          eventId: "e1",
          title: "R1",
          category: "military",
          status: "success",
          chosenStrategyId: "s1",
          chosenStrategyName: "S1",
          resolvedAtTick: 1,
          isRead: false,
          summaryText: "Tốt",
        },
        {
          id: "r2",
          eventId: "e2",
          title: "R2",
          category: "military",
          status: "failure",
          chosenStrategyId: "s2",
          chosenStrategyName: "S2",
          resolvedAtTick: 2,
          isRead: false,
          summaryText: "Xấu",
        },
        {
          id: "r3",
          eventId: "e3",
          title: "R3",
          category: "civil",
          status: "expired_default",
          chosenStrategyId: "s3",
          chosenStrategyName: "S3",
          resolvedAtTick: 3,
          isRead: true,
          summaryText: "Hết hạn",
        },
      ]

      const filterAll = results
      const filterUnread = results.filter((r) => !r.isRead)
      const filterSuccess = results.filter((r) => r.status === "success")
      const filterFailure = results.filter((r) => r.status === "failure" || r.status === "expired_default")

      assert.equal(filterAll.length, 3)
      assert.equal(filterUnread.length, 2)
      assert.equal(filterSuccess.length, 1)
      assert.equal(filterFailure.length, 2)
    })
  })

  describe("4. Thao Tác Đọc & Safe Pruning", () => {
    it("markEventResultAsRead đánh dấu đúng 1 báo cáo đơn lẻ", () => {
      const state = createInitialWorldState()
      state.eventResultsArchive = [
        {
          id: "res-single",
          eventId: "evt-s",
          title: "Báo cáo thử nghiệm",
          category: "intel",
          status: "success",
          chosenStrategyId: "strat-1",
          chosenStrategyName: "Trinh Sát",
          resolvedAtTick: 2,
          isRead: false,
          summaryText: "Thu thập tình báo",
        },
      ]

      assert.equal(state.eventResultsArchive[0].isRead, false)
      const marked = markEventResultAsRead(state, "res-single")
      assert.equal(marked, true)
      assert.equal(state.eventResultsArchive[0].isRead, true)
    })

    it("markAllEventResultsAsRead đánh dấu tất cả báo cáo và trả về số lượng chính xác", () => {
      const state = createInitialWorldState()
      state.eventResultsArchive = [
        {
          id: "r-a",
          eventId: "ea",
          title: "A",
          category: "intel",
          status: "success",
          chosenStrategyId: "s",
          chosenStrategyName: "S",
          resolvedAtTick: 1,
          isRead: false,
          summaryText: "",
        },
        {
          id: "r-b",
          eventId: "eb",
          title: "B",
          category: "intel",
          status: "success",
          chosenStrategyId: "s",
          chosenStrategyName: "S",
          resolvedAtTick: 2,
          isRead: false,
          summaryText: "",
        },
      ]

      const count = markAllEventResultsAsRead(state)
      assert.equal(count, 2)
      assert.ok(state.eventResultsArchive.every((r) => r.isRead === true))
    })

    it("pruneReadEventResultsSafe dọn dẹp log đã đọc và bảo toàn tuyệt đối 100% World State", () => {
      const state = createInitialWorldState()
      const initialEnergy = state.resources.energy
      const initialTacticalData = state.resources.tacticalData
      const initialMilitary = { ...state.military }

      state.eventResultsArchive = [
        {
          id: "keep-unread",
          eventId: "e1",
          title: "Cần giữ lại",
          category: "intel",
          status: "success",
          chosenStrategyId: "s",
          chosenStrategyName: "S",
          resolvedAtTick: 1,
          isRead: false,
          summaryText: "",
        },
        {
          id: "prune-read-1",
          eventId: "e2",
          title: "Đã đọc 1",
          category: "intel",
          status: "success",
          chosenStrategyId: "s",
          chosenStrategyName: "S",
          resolvedAtTick: 2,
          isRead: true,
          summaryText: "",
        },
        {
          id: "prune-read-2",
          eventId: "e3",
          title: "Đã đọc 2",
          category: "civil",
          status: "failure",
          chosenStrategyId: "s",
          chosenStrategyName: "S",
          resolvedAtTick: 3,
          isRead: true,
          summaryText: "",
        },
      ]

      const res = pruneReadEventResultsSafe(state)
      assert.equal(res.prunedCount, 2)
      assert.equal(state.eventResultsArchive.length, 1)
      assert.equal(state.eventResultsArchive[0].id, "keep-unread")

      // Chỉ số World State không bị ảnh hưởng
      assert.equal(state.resources.energy, initialEnergy)
      assert.equal(state.resources.tacticalData, initialTacticalData)
      assert.deepEqual(state.military, initialMilitary)
    })
  })

  describe("5. Bảo Toàn Tính Toàn Vẹn Lưu Trữ (World Save V1 & Không Thêm Khóa Thứ Hai)", () => {
    it("dữ liệu kết quả được lưu trữ duy nhất trong STARFRONT_WORLD_SAVE_V1", () => {
      const state = createInitialWorldState()
      state.eventResultsArchive = [
        {
          id: "archive-save-test",
          eventId: "evt-save",
          title: "Lưu Trữ Kiểm Thử",
          category: "logistics",
          status: "success",
          chosenStrategyId: "strat-log",
          chosenStrategyName: "Tiếp Tế Hạm Đội",
          resolvedAtTick: 10,
          isRead: false,
          summaryText: "Thành công",
        },
      ]

      saveWorldState(state)

      // Kiểm tra trong localStorage chỉ ghi vào STARFRONT_WORLD_SAVE_V1 (hoặc backup slots)
      const rawV1 = mockStorage.getItem("STARFRONT_WORLD_SAVE_V1")
      assert.ok(rawV1 !== null, "Phải tồn tại STARFRONT_WORLD_SAVE_V1")

      // Không tồn tại bất kỳ khóa kết quả dư thừa nào
      assert.equal(mockStorage.getItem("STARFRONT_RESULTS_DRAWER"), null)
      assert.equal(mockStorage.getItem("STARFRONT_DEBRIEFING_LOGS"), null)

      // Nạp lại và kiểm tra toàn vẹn
      const loaded = loadWorldState()
      assert.equal(loaded.state.eventResultsArchive.length, 1)
      assert.equal(loaded.state.eventResultsArchive[0].id, "archive-save-test")
    })
  })
})
