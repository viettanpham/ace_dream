/**
 * STARFRONT WORLD — Base Local Government AI & Economy Engine (Phase 6.34A-FND-6)
 *
 * Implements:
 * 1. Priority Hierarchy: Valid Commander Override -> Local Government AI -> National Strategic Preferences.
 * 2. Commander Override with configurable expiration (expiresAtGameDay); local AI auto-resumes when expired.
 * 3. Base Economy Forecasting: Production/Day, Consumption/Day, Net/Day, Days of Supply, and Deficit Warnings.
 * 4. Autonomous National Support Requests when deficits threaten base survival.
 * 5. Autonomous Construction & Maintenance planning based on local personality and priorities.
 */

import { SYSTEM_DEFAULT_BUILDING_DEFINITIONS } from "../building/seed-data"
import type { BuildingDefinition, BuildingInstance } from "../building/types"
import type { BasePopulationState } from "../population/types"
import type {
  BaseEconomyForecast,
  BaseGovernmentState,
  CommanderBaseOverride,
  ExtendedBaseEntityState,
  NationalSupportRequest,
  ResourceDeficitWarning,
} from "./types"

/**
 * Checks and updates Commander Override expiration.
 * Returns true if an override is active and valid, false if expired or non-existent.
 */
export function isCommanderOverrideActive(
  government: BaseGovernmentState,
  currentGameDay: number
): boolean {
  if (!government.commanderOverride) return false

  if (currentGameDay >= government.commanderOverride.expiresAtGameDay) {
    // Override has expired! Local AI re-takes control
    government.actionLogs.push(
      `Day ${currentGameDay}: Commander Override (${government.commanderOverride.overrideType}) đã hết hạn. Chính quyền cơ sở tái xác lập quyền tự quyết.`
    )
    delete government.commanderOverride
    return false
  }

  return true
}

/**
 * Sets a new Commander Override with an explicit expiration day
 */
export function setBaseCommanderOverride(
  government: BaseGovernmentState,
  override: Omit<CommanderBaseOverride, "createdAtGameDay">,
  currentGameDay: number
): void {
  government.commanderOverride = {
    ...override,
    createdAtGameDay: currentGameDay,
  }
  government.actionLogs.push(
    `Day ${currentGameDay}: Thiết lập Commander Override (${override.overrideType}) có hiệu lực đến Ngày ${override.expiresAtGameDay}: ${override.overrideReason}`
  )
}

/**
 * High-level helper: applies a Commander Base Override to an ExtendedBaseEntityState
 */
export function applyCommanderBaseOverride(
  base: ExtendedBaseEntityState,
  overrideType: CommanderBaseOverride["overrideType"],
  durationDays: number,
  currentDay: number,
  reason: string
): void {
  setBaseCommanderOverride(
    base.governmentState,
    {
      isLocked: true,
      overrideType,
      expiresAtGameDay: currentDay + durationDays,
      overrideReason: reason,
    },
    currentDay
  )
}

/**
 * Clears any active Commander Override on a base and logs the event
 */
export function clearCommanderBaseOverride(base: ExtendedBaseEntityState): void {
  if (base.governmentState.commanderOverride) {
    base.governmentState.actionLogs.push(
      `Commander Override (${base.governmentState.commanderOverride.overrideType}) đã được dỡ bỏ thủ công.`
    )
    delete base.governmentState.commanderOverride
  }
}

/**
 * Calculates Economy Forecast for a base over a 7-day planning horizon
 */
export const evaluateBaseEconomyForecast = calculateBaseEconomyForecast
export function calculateBaseEconomyForecast(
  base: ExtendedBaseEntityState,
  popState: BasePopulationState,
  definitions?: Map<string, BuildingDefinition> | BuildingDefinition[] | Record<string, BuildingDefinition> | null,
  currentGameDay: number = 1
): BaseEconomyForecast {
  const defMap = new Map<string, BuildingDefinition>()
  for (const d of SYSTEM_DEFAULT_BUILDING_DEFINITIONS) {
    defMap.set(d.id, d)
  }
  if (definitions) {
    if (definitions instanceof Map) {
      for (const [k, v] of definitions.entries()) defMap.set(k, v)
    } else if (Array.isArray(definitions)) {
      for (const d of definitions) defMap.set(d.id, d)
    } else if (typeof definitions === "object") {
      for (const [k, v] of Object.entries(definitions)) defMap.set(k, v)
    }
  }

  const productionPerDay: Record<string, number> = {
    industrialMaterials: 0,
    energy: 0,
    logisticsSupplies: 0,
    tacticalData: 0,
    food: 0,
  }

  const consumptionPerDay: Record<string, number> = {
    industrialMaterials: 0,
    energy: 0,
    logisticsSupplies: 0,
    tacticalData: 0,
    food: 0,
  }

  // 1. Food Consumption: 150 food/day per 100,000 population (Phase 6.4 invariant)
  const totalPop = (popState?.populationCurrent || 0) + (popState?.visitorPopulation || 0) + (popState?.externalWorkerPopulation || 0)
  const dailyFoodNeeded = Math.ceil((totalPop / 100000) * 150)
  consumptionPerDay.food = dailyFoodNeeded

  // 2. Production & Consumption from active building instances
  for (const b of Object.values(base.buildings || {})) {
    if (b.operationalState !== "ACTIVE" || b.operationalEfficiency <= 0) continue

    const eff = b.operationalEfficiency
    const def = defMap.get(b.definitionId)
    if (!def) continue

    // Maintenance energy consumption
    const baseEnergyMaint = Math.round(10 * b.currentLevel * eff)
    consumptionPerDay.energy += baseEnergyMaint

    if (b.definitionId === "bld_hydroponic_farm") {
      productionPerDay.food += Math.round(300 * eff * b.currentLevel)
      consumptionPerDay.energy += Math.round(50 * eff)
    } else if (b.definitionId === "bld_heavy_fabricator") {
      productionPerDay.industrialMaterials += Math.round(200 * eff * b.currentLevel)
      consumptionPerDay.energy += Math.round(80 * eff)
    } else if (b.definitionId === "bld_sub_power_station") {
      productionPerDay.energy += Math.round(400 * eff * b.currentLevel)
      consumptionPerDay.industrialMaterials += Math.round(20 * eff)
    } else if (b.definitionId === "bld_tech_lab") {
      productionPerDay.tacticalData += Math.round(150 * eff * b.currentLevel)
      consumptionPerDay.energy += Math.round(60 * eff)
    } else if (b.definitionId === "bld_cargo_depot") {
      productionPerDay.logisticsSupplies += Math.round(120 * eff * b.currentLevel)
      consumptionPerDay.energy += Math.round(30 * eff)
    }
  }

  // Hub Specialization bonuses
  for (const hub of base.hubSpecializations || []) {
    if (hub.status === "ACTIVE") {
      const bonusMult = 1 + hub.activeBonusPercent / 100
      if (hub.hubType === "INDUSTRIAL_HUB") {
        productionPerDay.industrialMaterials = Math.round(productionPerDay.industrialMaterials * bonusMult)
      } else if (hub.hubType === "RESEARCH_HUB") {
        productionPerDay.tacticalData = Math.round(productionPerDay.tacticalData * bonusMult)
      } else if (hub.hubType === "LOGISTICS_HUB") {
        productionPerDay.logisticsSupplies = Math.round(productionPerDay.logisticsSupplies * bonusMult)
      }
    }
  }

  // 3. Compute Net/Day and Days of Supply
  const netPerDay: Record<string, number> = {}
  const daysOfSupply: Record<string, number> = {}
  const deficitsPredicted: ResourceDeficitWarning[] = []

  const standardResources = ["food", "energy", "industrialMaterials", "logisticsSupplies", "tacticalData"]

  for (const res of standardResources) {
    const prod = productionPerDay[res] || 0
    const cons = consumptionPerDay[res] || 0
    const currentStock = base.sharedStorage[res] || 0

    const net = prod - cons
    netPerDay[res] = net

    if (cons > 0) {
      if (net >= 0) {
        daysOfSupply[res] = 999 // Sustainable
      } else {
        const days = Math.max(0, Math.floor(currentStock / Math.abs(net)))
        daysOfSupply[res] = days

        if (days <= 2) {
          deficitsPredicted.push({
            resource: res,
            currentStock,
            daysRemaining: days,
            severity: "CRITICAL",
            message: `Khủng hoảng ${res}: Chỉ còn ${days} ngày dự trữ với mức hao hụt ròng ${Math.abs(net)}/ngày!`,
          })
        } else if (days <= 5) {
          deficitsPredicted.push({
            resource: res,
            currentStock,
            daysRemaining: days,
            severity: "WARNING",
            message: `Cảnh báo ${res}: Trữ lượng cạn dần trong ${days} ngày tới. Cần mở tuyến tiếp viện.`,
          })
        } else if (days <= 8) {
          deficitsPredicted.push({
            resource: res,
            currentStock,
            daysRemaining: days,
            severity: "MILD",
            message: `Thiếu hụt nhẹ ${res}: Còn ${days} ngày nguồn cung an toàn.`,
          })
        }
      }
    } else {
      daysOfSupply[res] = 999
    }
  }

  return {
    productionPerDay,
    consumptionPerDay,
    netPerDay,
    daysOfSupply,
    deficitsPredicted,
    incomingShipments: [],
    calculatedAtGameDay: currentGameDay,
  }
}

/**
 * Autonomous Local Government Tick:
 * Evaluates conditions, logs autonomous actions, and raises national support requests if necessary.
 */
export function processBaseGovernmentTick(
  base: ExtendedBaseEntityState,
  popState: BasePopulationState,
  definitions: Map<string, BuildingDefinition>,
  currentGameDay: number
): {
  overrideActive: boolean
  supportRequestsCreated: NationalSupportRequest[]
  forecast: BaseEconomyForecast
} {
  const gov = base.governmentState
  const overrideActive = isCommanderOverrideActive(gov, currentGameDay)

  // 1. Calculate Economy Forecast
  const forecast = calculateBaseEconomyForecast(base, popState, definitions, currentGameDay)
  base.economyForecast = forecast

  const supportRequestsCreated: NationalSupportRequest[] = []

  // 2. If no active commander override, Local AI executes autonomous governance
  if (!overrideActive) {
    // Check critical deficits and trigger autonomous National Support Request
    for (const def of forecast.deficitsPredicted) {
      if (def.severity === "CRITICAL") {
        const reqType = def.resource === "food" ? "EMERGENCY_FOOD" : "ENERGY_DEFICIT"
        const existingReq = gov.pendingSupportRequests.find(
          (r) => r.requestType === reqType && r.status === "PENDING"
        )

        if (!existingReq) {
          const req: NationalSupportRequest = {
            requestId: `req_${base.baseId}_${def.resource}_${currentGameDay}`,
            baseId: base.baseId,
            requestType: reqType,
            resource: def.resource,
            amount: 500,
            priority: "CRITICAL",
            createdGameDay: currentGameDay,
            status: "PENDING",
            reason: def.message,
          }
          gov.pendingSupportRequests.push(req)
          supportRequestsCreated.push(req)
          gov.actionLogs.push(
            `Day ${currentGameDay}: [Tự Quyết] Gửi yêu cầu chi viện quốc gia khẩn cấp: ${def.message}`
          )
        }
      }
    }

    gov.lastAutonomousActionGameDay = currentGameDay
  }

  return {
    overrideActive,
    supportRequestsCreated,
    forecast,
  }
}
