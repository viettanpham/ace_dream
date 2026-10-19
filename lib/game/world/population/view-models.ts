/**
 * STARFRONT WORLD — Population & Workforce ViewModels (Phase 6.34A-FND-4)
 *
 * Provides view model builders for Base Population Summary,
 * Capacity Status Cards, and Workforce Allocation Trees.
 */

import { evaluateBaseCapacity } from "./capacity"
import type {
  BaseCapacityStatus,
  BasePopulationState,
  BasePopulationSummaryVM,
  BaseWorkforceAllocationReport,
  CapacityCardVM,
  CapacityType,
  WorkforceAllocationResult,
  WorkforceDemand,
  WorkforceTreeNodeVM,
} from "./types"

/**
 * Builds high-level summary ViewModel for Base Population & Workforce
 */
export function buildBasePopulationSummaryVM(
  state: BasePopulationState,
  allocationReport?: BaseWorkforceAllocationReport,
  emergencyIntakeCount: number = 0
): BasePopulationSummaryVM {
  const capacityStatus = evaluateBaseCapacity(state, emergencyIntakeCount)
  const totalDemands = allocationReport?.demandsEvaluated ?? 0
  const underStaffedDemandsCount = allocationReport?.underMinimumCount ?? 0

  return {
    baseId: state.baseId,
    totalResidents: state.populationCurrent,
    available: state.populationAvailable,
    occupied: state.populationOccupied,
    visitorCount: state.visitorPopulation,
    externalWorkerCount: state.externalWorkerPopulation,
    categoryBreakdown: { ...state.breakdown },
    totalDemands,
    underStaffedDemandsCount,
    capacityStatus,
  }
}

/**
 * Builds Capacity Card ViewModels for the 4 independent capacities
 */
export function buildCapacityCardVMs(capacityStatus: BaseCapacityStatus): CapacityCardVM[] {
  const cards: CapacityCardVM[] = [
    {
      type: "residential",
      title: "Sức Chứa Cư Dân Thường Trú",
      current: capacityStatus.residential.currentCount,
      max: capacityStatus.residential.maxCapacity,
      percentage: Math.round(capacityStatus.residential.utilizationRate * 100),
      isOverCapacity: capacityStatus.residential.isOverCapacity,
      overflowCount: capacityStatus.residential.overflowCount,
      badgeLabel: capacityStatus.residential.isOverCapacity ? "QUÁ TẢI" : "BÌNH THƯỜNG",
    },
    {
      type: "visitor",
      title: "Sức Chứa Khách Vãng Lai & Du Lịch",
      current: capacityStatus.visitor.currentCount,
      max: capacityStatus.visitor.maxCapacity,
      percentage: Math.round(capacityStatus.visitor.utilizationRate * 100),
      isOverCapacity: capacityStatus.visitor.isOverCapacity,
      overflowCount: capacityStatus.visitor.overflowCount,
      badgeLabel: capacityStatus.visitor.isOverCapacity ? "QUÁ TẢI" : "BÌNH THƯỜNG",
    },
    {
      type: "temporaryWorker",
      title: "Sức Chứa Lao Động Tạm Thời",
      current: capacityStatus.temporaryWorker.currentCount,
      max: capacityStatus.temporaryWorker.maxCapacity,
      percentage: Math.round(capacityStatus.temporaryWorker.utilizationRate * 100),
      isOverCapacity: capacityStatus.temporaryWorker.isOverCapacity,
      overflowCount: capacityStatus.temporaryWorker.overflowCount,
      badgeLabel: capacityStatus.temporaryWorker.isOverCapacity ? "QUÁ TẢI" : "BÌNH THƯỜNG",
    },
    {
      type: "emergency",
      title: "Sức Chứa Tiếp Nhận Khẩn Cấp",
      current: capacityStatus.emergency.currentCount,
      max: capacityStatus.emergency.maxCapacity,
      percentage: Math.round(capacityStatus.emergency.utilizationRate * 100),
      isOverCapacity: capacityStatus.emergency.isOverCapacity,
      overflowCount: capacityStatus.emergency.overflowCount,
      badgeLabel: capacityStatus.emergency.isOverCapacity ? "QUÁ NGƯỠNG" : "SẴN SÀNG",
    },
  ]

  return cards
}

/**
 * Builds Workforce Tree Node ViewModels for UI visualization
 */
export function buildWorkforceTreeVMs(
  demands: WorkforceDemand[],
  allocations: WorkforceAllocationResult[]
): WorkforceTreeNodeVM[] {
  const allocMap = new Map<string, WorkforceAllocationResult>()
  for (const a of allocations) {
    allocMap.set(a.demandId, a)
  }

  return demands.map((d) => {
    const alloc = allocMap.get(d.demandId)
    const assigned = alloc?.assignedPersonnel ?? 0
    const staffingTier = alloc?.staffingTier ?? "NONE"
    const operationalEligibility = alloc?.operationalEligibility ?? false
    const shortfall = alloc?.shortfall ?? d.targetPersonnel
    const isLocked = Boolean(d.isLocked)
    const isExcluded = Boolean(d.isExcluded)

    let statusBadge = "ĐẠT CHỈ TIÊU"
    if (isExcluded) {
      statusBadge = "TẮT HOẠT ĐỘNG"
    } else if (!operationalEligibility) {
      statusBadge = "DƯỚI TỐI THIỂU (NGỪNG HOẠT ĐỘNG)"
    } else if (staffingTier === "MINIMUM") {
      statusBadge = "MỨC TỐI THIỂU"
    } else if (staffingTier === "MAXIMUM") {
      statusBadge = "TỐI ĐA NĂNG SUẤT"
    }

    return {
      demandId: d.demandId,
      targetName: `${d.targetRef.entityType} #${d.targetRef.entityId}`,
      targetType: d.targetRef.entityType,
      category: d.assignmentCategory,
      assigned,
      minimum: d.minimumPersonnel,
      target: d.targetPersonnel,
      maximum: d.maximumPersonnel,
      priority: d.priority,
      staffingTier,
      operationalEligibility,
      shortfall,
      isLocked,
      isExcluded,
      statusBadge,
    }
  })
}
