/**
 * STARFRONT WORLD — Strategic Economy Engine (Phase 6.4)
 * Quản lý 4 nhóm tài nguyên chiến lược + Lương thực (Food) thiết yếu riêng biệt,
 * 3 năng lực chiến lược (Industry, Logistics, Stability), tính toán sản xuất theo
 * hệ số trạng thái sector và cơ chế suy thoái do thiếu hụt (Gradual Attrition).
 */

import type {
  StrategicCapacities,
  WorldResourceLedger,
  WorldSector,
  WorldState,
} from "./types"

/**
 * Hằng số tỷ lệ tiêu thụ lương thực theo dân số:
 * 100,000 dân số = 150 đơn vị Lương thực / ngày
 */
export const FOOD_CONSUMPTION_PER_100K_POP = 150

/**
 * Hệ số hiệu suất sản xuất theo vòng đời 5 giai đoạn của Sector
 */
export const SECTOR_STAGE_PRODUCTION_MULTIPLIER: Record<string, number> = {
  normal: 1.0,
  threatened: 0.85,
  under_siege: 0.3,
  recovery: 0.5,
  lost: 0.0,
}

/**
 * Tỷ trọng phân bổ tài nguyên từ năng lực công nghiệp hữu hiệu:
 * Materials: 35%, Energy: 30%, Supplies: 20%, Tactical Data: 10%, Food: 40%
 */
export const RESOURCE_PRODUCTION_RATIOS = {
  industrialMaterials: 0.35,
  energy: 0.3,
  logisticsSupplies: 0.2,
  tacticalData: 0.1,
  food: 0.4,
}

/**
 * Báo cáo chi tiết chu kỳ kinh tế
 */
export interface EconomyCycleReport {
  grossProduction: WorldResourceLedger
  totalFoodConsumed: number
  netResourceDelta: WorldResourceLedger
  affectedSectorsCount: number
  shortageSectors: string[]
  starvationCasualties: number
  capacities: StrategicCapacities
}

/**
 * Lấy hệ số điều chỉnh sản xuất theo mức Stability của sector
 * - >= 80: Thịnh vượng (+15% sản lượng)
 * - 50 - 79: Bình thường (100% sản lượng)
 * - 25 - 49: Bất ổn (-25% sản lượng)
 * - < 25: Khủng hoảng (-50% sản lượng)
 */
export function getStabilityProductionMultiplier(stability: number): number {
  if (stability >= 80) return 1.15
  if (stability >= 50) return 1.0
  if (stability >= 25) return 0.75
  return 0.5
}

/**
 * Tính toán năng lực công nghiệp hữu hiệu của một sector
 */
export function calculateEffectiveSectorIndustry(sector: WorldSector): number {
  if (sector.sovereignty !== "vss") return 0
  const stageMult = SECTOR_STAGE_PRODUCTION_MULTIPLIER[sector.stage] ?? 1.0
  const stabMult = getStabilityProductionMultiplier(sector.stability)
  return sector.industryCapacity * stageMult * stabMult
}

/**
 * Tính lượng tiêu thụ lương thực hàng ngày của một sector dựa trên dân số
 */
export function calculateDailyFoodConsumption(population: number): number {
  if (population <= 0) return 0
  return Math.max(1, Math.round((population / 100000) * FOOD_CONSUMPTION_PER_100K_POP))
}

/**
 * Tính sản lượng tài nguyên được sản xuất tại một sector trong 1 ngày chiến lược
 */
export function calculateSectorDailyProduction(sector: WorldSector): WorldResourceLedger {
  const effectiveIndustry = calculateEffectiveSectorIndustry(sector)
  if (effectiveIndustry <= 0) {
    return {
      industrialMaterials: 0,
      energy: 0,
      logisticsSupplies: 0,
      tacticalData: 0,
      food: 0,
    }
  }

  return {
    industrialMaterials: Math.round(
      effectiveIndustry * RESOURCE_PRODUCTION_RATIOS.industrialMaterials
    ),
    energy: Math.round(effectiveIndustry * RESOURCE_PRODUCTION_RATIOS.energy),
    logisticsSupplies: Math.round(
      effectiveIndustry * RESOURCE_PRODUCTION_RATIOS.logisticsSupplies
    ),
    tacticalData: Math.round(
      effectiveIndustry * RESOURCE_PRODUCTION_RATIOS.tacticalData
    ),
    food: Math.round(effectiveIndustry * RESOURCE_PRODUCTION_RATIOS.food),
  }
}

/**
 * Tính toán ba năng lực chiến lược vĩ mô (Industry, Logistics, Stability)
 */
export function calculateStrategicCapacities(state: WorldState): StrategicCapacities {
  let totalEffectiveIndustry = 0
  let totalStability = 0
  let vssSectorCount = 0

  for (const sector of Object.values(state.sectors)) {
    if (sector.sovereignty === "vss") {
      totalEffectiveIndustry += calculateEffectiveSectorIndustry(sector)
      totalStability += sector.stability
      vssSectorCount++
    }
  }

  // Tính thông lượng Logistics dựa trên các tuyến đường đang kết nối
  let totalLogisticsThroughput = 0
  for (const route of state.routes) {
    if (route.state === "open") {
      totalLogisticsThroughput += 100
    } else if (route.state === "hazardous") {
      totalLogisticsThroughput += 70
    }
    // blocked và offline có thông lượng = 0
  }

  const averageStability =
    vssSectorCount > 0 ? Math.round(totalStability / vssSectorCount) : 0

  return {
    industry: Math.round(totalEffectiveIndustry),
    logistics: totalLogisticsThroughput,
    stability: averageStability,
  }
}

/**
 * Xử lý suy thoái theo từng bậc khi sector bị thiếu hụt lương thực (Gradual Attrition):
 * - Ngày 1–2: Cảnh báo đỏ; Stability giảm -5/ngày.
 * - Ngày 3–5: Năng lực phòng thủ giảm 25%, sản lượng công nghiệp giảm 50%, Stability giảm -8/ngày.
 * - Sau 5 ngày: Bắt đầu phát sinh thương vong dân số do nạn đói (1% dân số/ngày), Stability giảm -12/ngày.
 */
export function applyFoodShortageDegradation(
  sector: WorldSector,
  shortageDays: number
): {
  stabilityLoss: number
  casualties: number
  defensePenalty: number
} {
  let stabilityLoss = 0
  let casualties = 0
  let defensePenalty = 0

  if (shortageDays >= 1 && shortageDays <= 2) {
    stabilityLoss = 5
  } else if (shortageDays >= 3 && shortageDays <= 5) {
    stabilityLoss = 8
    defensePenalty = 0.25
  } else if (shortageDays > 5) {
    stabilityLoss = 12
    defensePenalty = 0.4
    // 1% dân số chết đói mỗi ngày thiếu hụt kéo dài
    casualties = Math.max(10, Math.round(sector.population * 0.01))
  }

  // Áp dụng giảm Stability (giới hạn sàn tối thiểu là 5 để tránh số âm)
  sector.stability = Math.max(5, sector.stability - stabilityLoss)

  // Áp dụng thương vong nếu có
  if (casualties > 0) {
    sector.population = Math.max(0, sector.population - casualties)
  }

  return {
    stabilityLoss,
    casualties,
    defensePenalty,
  }
}

/**
 * Đồng bộ hóa kho tổng quốc gia theo tổng tồn kho các sector VSS
 */
export function synchronizeNationalLedger(state: WorldState): void {
  const totals: WorldResourceLedger = {
    industrialMaterials: 0,
    energy: 0,
    logisticsSupplies: 0,
    tacticalData: 0,
    food: 0,
  }

  for (const sector of Object.values(state.sectors)) {
    if (sector.sovereignty === "vss") {
      totals.industrialMaterials += Math.max(0, sector.resources.industrialMaterials)
      totals.energy += Math.max(0, sector.resources.energy)
      totals.logisticsSupplies += Math.max(0, sector.resources.logisticsSupplies)
      totals.tacticalData += Math.max(0, sector.resources.tacticalData)
      totals.food += Math.max(0, sector.resources.food)
    }
  }

  state.resources = totals
}

/**
 * Thực thi chu kỳ kinh tế hoàn chỉnh trong 1 tick chiến lược:
 * 1. Sản xuất tại từng sector VSS theo năng lực công nghiệp và stability
 * 2. Tiêu thụ lương thực thiết yếu dân sinh
 * 3. Áp dụng cơ chế suy thoái từng bậc nếu cạn kiệt lương thực
 * 4. Đồng bộ hóa tổng tài nguyên quốc gia
 */
export function processStrategicEconomyCycle(state: WorldState): EconomyCycleReport {
  const grossProduction: WorldResourceLedger = {
    industrialMaterials: 0,
    energy: 0,
    logisticsSupplies: 0,
    tacticalData: 0,
    food: 0,
  }

  let totalFoodConsumed = 0
  let affectedSectorsCount = 0
  const shortageSectors: string[] = []
  let starvationCasualties = 0

  for (const sector of Object.values(state.sectors)) {
    if (sector.sovereignty !== "vss") continue
    affectedSectorsCount++

    // 1. Sản xuất
    const prod = calculateSectorDailyProduction(sector)
    sector.resources.industrialMaterials += prod.industrialMaterials
    sector.resources.energy += prod.energy
    sector.resources.logisticsSupplies += prod.logisticsSupplies
    sector.resources.tacticalData += prod.tacticalData
    sector.resources.food += prod.food

    grossProduction.industrialMaterials += prod.industrialMaterials
    grossProduction.energy += prod.energy
    grossProduction.logisticsSupplies += prod.logisticsSupplies
    grossProduction.tacticalData += prod.tacticalData
    grossProduction.food += prod.food

    // 2. Tiêu thụ lương thực tại sector
    const foodNeeded = calculateDailyFoodConsumption(sector.population)
    totalFoodConsumed += foodNeeded

    if (sector.resources.food >= foodNeeded) {
      sector.resources.food -= foodNeeded
      // Hồi phục dần sau thiếu hụt nếu có
      if (sector.foodShortageDays && sector.foodShortageDays > 0) {
        sector.foodShortageDays = 0
        sector.stability = Math.min(100, sector.stability + 1)
      }
    } else {
      // Thiếu hụt lương thực!
      const available = sector.resources.food
      sector.resources.food = 0
      sector.foodShortageDays = (sector.foodShortageDays ?? 0) + 1
      shortageSectors.push(sector.id)

      const degradation = applyFoodShortageDegradation(
        sector,
        sector.foodShortageDays
      )
      starvationCasualties += degradation.casualties
    }
  }

  // 3. Nếu có thương vong đói, ghi nhận vào nhân khẩu học
  if (starvationCasualties > 0) {
    state.demographics.civilianCasualties += starvationCasualties
    state.demographics.controlledTerritoryPopulation = Math.max(
      0,
      state.demographics.controlledTerritoryPopulation - starvationCasualties
    )
    state.demographics.nationalTotalPopulation = Math.max(
      0,
      state.demographics.nationalTotalPopulation - starvationCasualties
    )
  }

  // 4. Đồng bộ hóa kho tổng quốc gia
  synchronizeNationalLedger(state)

  const netResourceDelta: WorldResourceLedger = {
    ...grossProduction,
    food: grossProduction.food - totalFoodConsumed,
  }

  const capacities = calculateStrategicCapacities(state)

  return {
    grossProduction,
    totalFoodConsumed,
    netResourceDelta,
    affectedSectorsCount,
    shortageSectors,
    starvationCasualties,
    capacities,
  }
}
