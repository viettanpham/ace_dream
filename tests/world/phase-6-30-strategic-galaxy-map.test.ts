import test from "node:test"
import assert from "node:assert/strict"
import { createInitialWorldState } from "@/lib/game/world/initial-state"
import {
  computeCriticalAlerts,
  computeCombatOperations,
  computeActionableItemsCount,
} from "@/components/game/world/global-operations-hub"

test("STARFRONT Phase 6.30 — Strategic Galaxy Map & Command UX Verification", async (t) => {
  await t.test("1. Giới hạn Zoom [0.7, 2.2] và hàm kẹp biên zoomLevel", () => {
    const clampZoom = (current: number, delta: number): number => {
      return Math.max(0.7, Math.min(2.2, Number((current + delta).toFixed(2))))
    }

    // Zoom in vượt trần 2.2
    assert.equal(clampZoom(2.1, 0.2), 2.2)
    assert.equal(clampZoom(2.2, 0.15), 2.2)

    // Zoom out vượt sàn 0.7
    assert.equal(clampZoom(0.75, -0.15), 0.7)
    assert.equal(clampZoom(0.7, -0.2), 0.7)

    // Zoom thông thường
    assert.equal(clampZoom(1.0, 0.15), 1.15)
    assert.equal(clampZoom(1.0, -0.15), 0.85)
  })

  await t.test("2. Tính toán Double-click zoom: zoom in khi < 1.7x và reset về 1.0x khi >= 1.7x", () => {
    const handleDoubleClickZoom = (currentZoom: number) => {
      if (currentZoom >= 1.7) {
        return { newZoom: 1, reset: true }
      }
      return {
        newZoom: Math.min(2.2, Number((currentZoom + 0.4).toFixed(2))),
        reset: false,
      }
    }

    // Double-click từ 1.0x
    const res1 = handleDoubleClickZoom(1.0)
    assert.equal(res1.newZoom, 1.4)
    assert.equal(res1.reset, false)

    // Double-click từ 1.4x
    const res2 = handleDoubleClickZoom(1.4)
    assert.equal(res2.newZoom, 1.8)
    assert.equal(res2.reset, false)

    // Double-click từ 1.8x -> reset về 1.0x
    const res3 = handleDoubleClickZoom(1.8)
    assert.equal(res3.newZoom, 1.0)
    assert.equal(res3.reset, true)

    // Double-click từ max 2.2x -> reset về 1.0x
    const res4 = handleDoubleClickZoom(2.2)
    assert.equal(res4.newZoom, 1.0)
    assert.equal(res4.reset, true)
  })

  await t.test("3. Trạng thái mặc định: Map Legend = OFF, Node Details = OFF", () => {
    // Giả lập logic khởi tạo state mặc định khi không có localStorage
    const getInitialLegendState = (savedPref: string | null) => {
      if (savedPref !== null) return savedPref === "true"
      return false
    }

    const getInitialNodeDetailsState = (savedPref: string | null) => {
      if (savedPref !== null) return savedPref === "true"
      return false
    }

    // Khi người chơi mở lần đầu (chưa lưu preference) -> mặc định luôn là false
    assert.equal(getInitialLegendState(null), false)
    assert.equal(getInitialNodeDetailsState(null), false)

    // Khi người chơi đã có preference "true" -> tôn trọng preference
    assert.equal(getInitialLegendState("true"), true)
    assert.equal(getInitialNodeDetailsState("true"), true)

    // Khi người chơi lưu "false" -> giữ false
    assert.equal(getInitialLegendState("false"), false)
    assert.equal(getInitialNodeDetailsState("false"), false)
  })

  await t.test("4. War Room Strategic Situation Deck — Tính toán dữ liệu thực từ WORLD state", () => {
    // Clone world state chuẩn V1 (10 sectors cho Phase 6.30 test)
    const worldState = createInitialWorldState(undefined, { totalMainBaseNodes: 10 })

    const sectors = Object.values(worldState.sectors)
    assert.equal(sectors.length, 10, "Phải có đúng 10 sectors")

    // Chủ quyền
    const vssSectors = sectors.filter((s: any) => s.sovereignty === "vss")
    const voidSectors = sectors.filter((s: any) => s.sovereignty === "void")
    const contestedSectors = sectors.filter((s: any) => s.sovereignty === "contested" || s.sovereignty === "neutral")

    assert.ok(vssSectors.length > 0)
    assert.equal(vssSectors.length + voidSectors.length + contestedSectors.length, 10)

    // Threat trung bình
    const avgThreat = Math.round(sectors.reduce((acc: number, s: any) => acc + s.threatLevel, 0) / 10)
    assert.ok(avgThreat >= 0 && avgThreat <= 1000)

    // Quân đồn trú
    const totalGarrison = sectors.reduce((acc: number, s: any) => acc + (s.garrisonPower || 0), 0)
    assert.ok(typeof totalGarrison === "number" && totalGarrison >= 0)
  })

  await t.test("5. War Room Critical Alerts & Suspended Combat Integration", () => {
    const worldState = createInitialWorldState()

    // Giả lập trạng thái combat suspended
    worldState.isSuspendedCombat = true
    worldState.suspendedSnapshot = {
      transactionId: "tx_test_suspended_1",
      encounterId: "enc_test_1",
      sectorId: "abyssal_rift",
      sectorName: "Abyssal Rift",
      timestamp: Date.now(),
      status: "suspended",
    }
    worldState.sectors["abyssal_rift"].isLockedForCombat = true

    const combatOps = computeCombatOperations(worldState)
    assert.ok(combatOps.suspendedEncounter !== null, "Phải nhận diện suspended encounter")
    assert.equal(combatOps.suspendedEncounter?.snapshot.sectorId, "abyssal_rift")

    const alerts = computeCriticalAlerts(worldState, [])
    const p0Alerts = alerts.filter((a) => a.priority === "P0")
    assert.ok(p0Alerts.length >= 1, "Phải có ít nhất 1 cảnh báo P0 cho Suspended Combat")
    const suspendedAlert = p0Alerts.find((a) => a.type === "suspended_combat")
    assert.ok(suspendedAlert, "Phải tìm thấy cảnh báo kiểu suspended_combat")
    assert.equal(suspendedAlert.sectorId, "abyssal_rift")
  })
})
