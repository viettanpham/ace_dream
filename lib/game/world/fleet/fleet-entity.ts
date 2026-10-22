/**
 * STARFRONT WORLD — Fleet Entity Architecture & Lifecycle Engine (Phase 7.4)
 *
 * Implements:
 * 1. Tri-Party Sovereign Entity Separation:
 *    - Nation, Base, and Fleet maintain independent legal ownership and asset ledgers.
 *    - Base Command CANNOT expropriate Fleet treasury, cargo, or personnel without authority.
 * 2. FleetEntityState:
 *    - OwnerRef: Sovereign owner designation (Nation, Guild, NPC Pilot Founder, or Player).
 *    - RegisteredHomeBaseId: Administrative base of registration / muster HQ.
 *    - CurrentLocation: Current sector, docked base, or hyperlane transit coordinates.
 *    - OperationalStatus: DOCKED | STATIONED | IN_TRANSIT | PATROL | ENGAGED | MAINTENANCE | REORGANIZING | DISBANDED.
 * 3. Integrated Subsystems:
 *    - Ships roster (ShipInstance from Phase 7.2) & Flagship appointment
 *    - ProgressionEntity (FND-2 MK I–V scale)
 *    - FleetPersonnelState (Phase 7.3 Hybrid Dual-Track)
 *    - FleetTreasuryState (Phase 7.4 Independent Credits & Deficit Tracking)
 *    - Cargo WorldResourceLedger (Phase 7.4 Food, Energy, Supplies, Materials, Data)
 *    - FleetAIPersona (Phase 7.4 Autonomous Command)
 *    - FleetServiceLog (Phase 7.4 Permanent Honors & Combat Audit Trail)
 * 4. Mutual Consent Fleet Merger & Disbandment
 */

import type { WorldResourceLedger, WorldState } from "../types"
import type { ShipInstance } from "../ship/types"
import { createShipInstance } from "../ship/ship-entity"
import type { ProgressionEntity } from "../progression/types"
import { createProgressionEntity } from "../progression/engine"
import type { FleetPersonnelState } from "./fleet-personnel"
import { createFleetPersonnelState } from "./fleet-personnel"
import type { FleetTreasuryState } from "./fleet-treasury"
import { createFleetTreasury } from "./fleet-treasury"
import type { FleetOperationalStatus } from "./fleet-logistics"
import { createFleetCargo } from "./fleet-logistics"
import type { FleetAIPersona } from "./fleet-ai-command"
import { getFleetClass, getFleetType } from "./registry-integration"

export type FleetOwnerType = "NATION" | "GUILD" | "PILOT" | "PLAYER"

export interface FleetOwnerRef {
  ownerType: FleetOwnerType
  ownerId: string
  nationId: string
  guildId?: string
  founderPilotId?: string
}

export interface FleetLocation {
  sectorId: string
  baseId?: string // Present when DOCKED at a base
  isHyperlaneTransit: boolean
  transitOriginSectorId?: string
  transitTargetSectorId?: string
  transitRemainingDays?: number
  transitTotalDays?: number
}

export type FleetLifecycleState = "FORMATION" | "ACTIVE" | "REORGANIZATION" | "DISBANDED"

export interface FleetServiceLog {
  commissionDate: number
  totalBattlesEngaged: number
  victoriesCount: number
  enemiesDestroyed: number
  threatSuppressed: number
  pilotsRescued: number
  totalCasualtiesSustained: number
  honorsAndCitations: string[]
}

import type { FleetFrameState } from "./fleet-frame-engine"
import { createFleetFrameState } from "./fleet-frame-engine"

export interface FleetEntityState {
  fleetId: string
  name: string
  customCallsign?: string
  ownerRef: FleetOwnerRef
  registeredHomeBaseId: string
  currentLocation: FleetLocation
  operationalStatus: FleetOperationalStatus
  lifecycleState: FleetLifecycleState
  fleetTypeId: string
  fleetClassId: string
  ships: Record<string, ShipInstance>
  flagshipInstanceId?: string
  progression: ProgressionEntity
  personnel: FleetPersonnelState
  treasury: FleetTreasuryState
  cargo: WorldResourceLedger
  aiPersona: FleetAIPersona
  serviceRecord: FleetServiceLog
  frameState: FleetFrameState
  isAustereMode: boolean
  isStarvation: boolean
  isStranded: boolean
  newGuildProtectionExpiryDay?: number
  subsidiesClaimedThisCycle: number
  createdAtGameDay: number
  updatedAtGameDay: number
}

/**
 * Creates a new complete Fleet Entity State
 */
export function createFleetEntity(params: {
  fleetId: string
  name: string
  customCallsign?: string
  ownerRef: FleetOwnerRef
  registeredHomeBaseId: string
  initialSectorId: string
  initialBaseId?: string
  fleetTypeId?: string
  fleetClassId?: string
  initialCredits?: number
  initialSupplyCredits?: number
  initialFood?: number
  initialEnergy?: number
  initialFramePoints?: number
  currentGameDay?: number
  isNewGuild?: boolean
}): FleetEntityState {
  const gameDay = params.currentGameDay ?? 1
  const fleetTypeId = params.fleetTypeId || "FLEET_TYPE_HOME_DEFENSE"
  const fleetClassId = params.fleetClassId || "FLEET_CLASS_MK1_SQUAD"

  const fleetType = getFleetType(fleetTypeId)
  const defaultPersona = (fleetType?.defaultAIPersona as FleetAIPersona) || "STEADFAST_DEFENDER"

  const newGuildProtectionExpiryDay = params.isNewGuild
    ? gameDay + 3600 // 10 Game Years protection default
    : undefined

  return {
    fleetId: params.fleetId,
    name: params.name,
    customCallsign: params.customCallsign,
    ownerRef: params.ownerRef,
    registeredHomeBaseId: params.registeredHomeBaseId,
    currentLocation: {
      sectorId: params.initialSectorId,
      baseId: params.initialBaseId,
      isHyperlaneTransit: false,
    },
    operationalStatus: params.initialBaseId ? "DOCKED" : "STATIONED",
    lifecycleState: "FORMATION",
    fleetTypeId,
    fleetClassId,
    ships: {},
    progression: createProgressionEntity({
      entityId: params.fleetId,
      profileId: "PROGRESSION_PROFILE_FLEET",
      initialLevel: 1,
      initialTierId: "TIER_I",
    }),
    personnel: createFleetPersonnelState({
      fleetId: params.fleetId,
      homeBaseId: params.registeredHomeBaseId,
      initialMorale: 85,
      gameDay,
    }),
    treasury: createFleetTreasury(params.initialCredits ?? 6000, params.initialSupplyCredits ?? 1500),
    cargo: createFleetCargo({
      food: params.initialFood ?? 800,
      energy: params.initialEnergy ?? 1500,
    }),
    aiPersona: defaultPersona,
    serviceRecord: {
      commissionDate: gameDay,
      totalBattlesEngaged: 0,
      victoriesCount: 0,
      enemiesDestroyed: 0,
      threatSuppressed: 0,
      pilotsRescued: 0,
      totalCasualtiesSustained: 0,
      honorsAndCitations: ["Ủy ban Quốc gia: Giấy phép thành lập Hạm đội chính quy"],
    },
    frameState: createFleetFrameState(params.initialFramePoints ?? 0),
    isAustereMode: false,
    isStarvation: false,
    isStranded: false,
    newGuildProtectionExpiryDay,
    subsidiesClaimedThisCycle: 0,
    createdAtGameDay: gameDay,
    updatedAtGameDay: gameDay,
  }
}

/**
 * Adds a ship to the fleet biên chế, enforcing the fleet class capacity limits
 */
export function addShipToFleet(
  fleet: FleetEntityState,
  ship: ShipInstance
): { success: boolean; error?: string } {
  const currentCount = Object.keys(fleet.ships).length
  const fleetClass = getFleetClass(fleet.fleetClassId)
  const maxShips = fleetClass?.maxShipCount || 4

  if (currentCount >= maxShips) {
    return {
      success: false,
      error: `Hạm đội đã đạt giới hạn biên chế tối đa của lớp ${fleetClass?.displayName || fleet.fleetClassId} (${currentCount}/${maxShips} tàu)`,
    }
  }

  // Bind ship to fleet
  ship.fleetId = fleet.fleetId
  ship.dockedBaseId = undefined // In fleet operational custody
  fleet.ships[ship.instanceId] = ship

  // If no flagship is set, assign first combat vessel as flagship
  if (!fleet.flagshipInstanceId) {
    fleet.flagshipInstanceId = ship.instanceId
  }

  return { success: true }
}

/**
 * Removes a ship from the fleet biên chế
 */
export function removeShipFromFleet(
  fleet: FleetEntityState,
  shipInstanceId: string,
  targetBaseId?: string
): { success: boolean; removedShip?: ShipInstance; error?: string } {
  const ship = fleet.ships[shipInstanceId]
  if (!ship) {
    return { success: false, error: `Tàu ${shipInstanceId} không thuộc biên chế hạm đội ${fleet.fleetId}` }
  }

  delete fleet.ships[shipInstanceId]
  ship.fleetId = undefined
  if (targetBaseId) {
    ship.dockedBaseId = targetBaseId
  }

  if (fleet.flagshipInstanceId === shipInstanceId) {
    const remainingIds = Object.keys(fleet.ships)
    fleet.flagshipInstanceId = remainingIds.length > 0 ? remainingIds[0] : undefined
  }

  return { success: true, removedShip: ship }
}

/**
 * Sets a specific ship in the roster as the Fleet Flagship
 */
export function setFleetFlagship(
  fleet: FleetEntityState,
  shipInstanceId: string
): { success: boolean; error?: string } {
  if (!fleet.ships[shipInstanceId]) {
    return { success: false, error: `Chiến hạm ${shipInstanceId} không có trong biên chế hạm đội` }
  }
  fleet.flagshipInstanceId = shipInstanceId
  return { success: true }
}

/**
 * Orders a fleet to embark on a hyperlane journey to another sector
 */
export function orderFleetTransit(
  fleet: FleetEntityState,
  targetSectorId: string,
  hyperlaneHops: number,
  currentGameDay: number
): { success: boolean; travelDays: number; error?: string } {
  if (fleet.operationalStatus === "ENGAGED") {
    return { success: false, travelDays: 0, error: "Hạm đội đang trong giao tranh, không thể khởi động siêu không gian" }
  }
  if (fleet.isStranded) {
    return { success: false, travelDays: 0, error: "Hạm đội cạn kiệt nhiên liệu plasma, đang bị trôi dạt" }
  }

  // Base travel speed is 1 day per hop, modified by fleet type speed multiplier
  const fleetType = getFleetType(fleet.fleetTypeId)
  const speedMultiplier = fleetType?.baseSpeedMultiplier || 1.0
  const travelDays = Math.max(1, Math.round(hyperlaneHops / speedMultiplier))

  fleet.currentLocation = {
    sectorId: fleet.currentLocation.sectorId,
    baseId: undefined, // Leaving dock
    isHyperlaneTransit: true,
    transitOriginSectorId: fleet.currentLocation.sectorId,
    transitTargetSectorId: targetSectorId,
    transitRemainingDays: travelDays,
    transitTotalDays: travelDays,
  }
  fleet.operationalStatus = "IN_TRANSIT"
  fleet.updatedAtGameDay = currentGameDay

  return { success: true, travelDays }
}

/**
 * Advances a fleet in transit by 1 Game Day
 */
export function advanceFleetTransit(
  fleet: FleetEntityState,
  currentGameDay: number
): { hasArrived: boolean; arrivedSectorId?: string } {
  if (!fleet.currentLocation.isHyperlaneTransit) {
    return { hasArrived: false }
  }

  const remaining = (fleet.currentLocation.transitRemainingDays ?? 1) - 1
  fleet.currentLocation.transitRemainingDays = remaining
  fleet.updatedAtGameDay = currentGameDay

  if (remaining <= 0) {
    const destinationSectorId = fleet.currentLocation.transitTargetSectorId || fleet.currentLocation.sectorId
    fleet.currentLocation = {
      sectorId: destinationSectorId,
      baseId: undefined,
      isHyperlaneTransit: false,
    }
    fleet.operationalStatus = "PATROL" // Default on sector arrival
    return { hasArrived: true, arrivedSectorId: destinationSectorId }
  }

  return { hasArrived: false }
}

/**
 * Docks the fleet at a base
 */
export function dockFleetAtBase(
  fleet: FleetEntityState,
  baseId: string,
  sectorId: string
): { success: boolean; error?: string } {
  if (fleet.currentLocation.isHyperlaneTransit) {
    return { success: false, error: "Hạm đội đang hành quân trên tuyến Hyperlane, không thể cập cảng" }
  }
  fleet.currentLocation.baseId = baseId
  fleet.currentLocation.sectorId = sectorId
  fleet.operationalStatus = "DOCKED"
  return { success: true }
}

/**
 * Undocks the fleet from a base into sector patrol/station
 */
export function undockFleetFromBase(
  fleet: FleetEntityState
): { success: boolean; error?: string } {
  if (fleet.operationalStatus !== "DOCKED") {
    return { success: false, error: "Hạm đội không ở trạng thái neo đậu cảng" }
  }
  fleet.currentLocation.baseId = undefined
  fleet.operationalStatus = "STATIONED"
  return { success: true }
}

/**
 * Mutual Consent Fleet Merger (section 7.13)
 * Transfers all ships, credits, supplies, and merges service logs into recipient fleet.
 */
export function mergeFleets(
  recipientFleet: FleetEntityState,
  sourceFleet: FleetEntityState,
  currentGameDay: number
): { success: boolean; shipsTransferred: number; creditsTransferred: number; error?: string } {
  if (recipientFleet.fleetId === sourceFleet.fleetId) {
    return { success: false, shipsTransferred: 0, creditsTransferred: 0, error: "Không thể sáp nhập hạm đội vào chính nó" }
  }

  // Transfer ships up to capacity
  const recipientClass = getFleetClass(recipientFleet.fleetClassId)
  const maxShips = recipientClass?.maxShipCount || 16
  const currentShips = Object.keys(recipientFleet.ships).length
  const availableSlots = maxShips - currentShips

  const sourceShipIds = Object.keys(sourceFleet.ships)
  let transferredShips = 0

  for (const shipId of sourceShipIds) {
    if (transferredShips < availableSlots) {
      const ship = sourceFleet.ships[shipId]
      delete sourceFleet.ships[shipId]
      ship.fleetId = recipientFleet.fleetId
      recipientFleet.ships[shipId] = ship
      transferredShips += 1
    }
  }

  // Transfer Treasury Credits
  const creditsToTransfer = sourceFleet.treasury.credits
  recipientFleet.treasury.credits += creditsToTransfer
  sourceFleet.treasury.credits = 0

  // Transfer Cargo
  recipientFleet.cargo.food += sourceFleet.cargo.food
  recipientFleet.cargo.energy += sourceFleet.cargo.energy
  recipientFleet.cargo.logisticsSupplies += sourceFleet.cargo.logisticsSupplies
  recipientFleet.cargo.industrialMaterials += sourceFleet.cargo.industrialMaterials
  recipientFleet.cargo.tacticalData += sourceFleet.cargo.tacticalData

  sourceFleet.cargo = { food: 0, energy: 0, logisticsSupplies: 0, industrialMaterials: 0, tacticalData: 0 }

  // Transfer & Merge FRAME Points
  recipientFleet.frameState.cycleFrame += sourceFleet.frameState.cycleFrame
  recipientFleet.frameState.availableFrame += sourceFleet.frameState.availableFrame
  recipientFleet.frameState.totalFrame += sourceFleet.frameState.totalFrame
  sourceFleet.frameState.cycleFrame = 0
  sourceFleet.frameState.availableFrame = 0
  sourceFleet.frameState.totalFrame = 0

  // Merge Service Records
  recipientFleet.serviceRecord.totalBattlesEngaged += sourceFleet.serviceRecord.totalBattlesEngaged
  recipientFleet.serviceRecord.victoriesCount += sourceFleet.serviceRecord.victoriesCount
  recipientFleet.serviceRecord.enemiesDestroyed += sourceFleet.serviceRecord.enemiesDestroyed
  recipientFleet.serviceRecord.threatSuppressed += sourceFleet.serviceRecord.threatSuppressed
  recipientFleet.serviceRecord.pilotsRescued += sourceFleet.serviceRecord.pilotsRescued
  recipientFleet.serviceRecord.totalCasualtiesSustained += sourceFleet.serviceRecord.totalCasualtiesSustained
  recipientFleet.serviceRecord.honorsAndCitations.push(
    `Sáp nhập lịch sử chiến công từ Hạm đội ${sourceFleet.name} (${sourceFleet.fleetId}) vào ngày ${currentGameDay}`
  )

  // Mark source fleet as DISBANDED
  sourceFleet.lifecycleState = "DISBANDED"
  sourceFleet.operationalStatus = "DISBANDED"
  sourceFleet.updatedAtGameDay = currentGameDay

  return {
    success: true,
    shipsTransferred: transferredShips,
    creditsTransferred: creditsToTransfer,
  }
}

/**
 * Initializes and seeds canonical national fleets in WorldState if fleets are missing or empty
 */
export function ensureWorldFleetsInitialized(worldState: WorldState): Record<string, FleetEntityState> {
  if (worldState.fleets && Object.keys(worldState.fleets).length > 0) {
    return worldState.fleets
  }

  const currentDay = worldState.currentDay || 1
  const fleets: Record<string, FleetEntityState> = {}

  // 1. FLEET_ALPHA_EXPEDITION: Viễn Chinh Tác Chiến
  const fleetAlpha = createFleetEntity({
    fleetId: "FLEET_ALPHA_EXPEDITION",
    name: "Hạm Đội Viễn Chinh Alpha",
    customCallsign: "Vanguard One",
    ownerRef: {
      ownerType: "NATION",
      ownerId: "NATION_VSS",
      nationId: "sol_federation",
    },
    registeredHomeBaseId: "sol_command_hq",
    initialSectorId: "sol_command_hq",
    fleetTypeId: "FLEET_TYPE_MILITARY_EXPEDITIONARY",
    fleetClassId: "FLEET_CLASS_MK2_TASKFORCE",
    initialCredits: 12500,
    initialSupplyCredits: 3000,
    initialFood: 2500,
    initialEnergy: 4000,
    initialFramePoints: 450,
    currentGameDay: currentDay,
  })

  // Add Ships to Fleet Alpha
  const cruiserAegis = createShipInstance({
    definitionId: "SHIP_DEF_AEGIS_LINE_CRUISER",
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "NATION_VSS",
      ownerName: "Liên minh VSS",
      factionId: "FACTION_SOL_NAVY",
    },
    customName: "VSS Aegis Prime",
    gameDay: currentDay,
  })
  cruiserAegis.assignedCrewCount = 90
  addShipToFleet(fleetAlpha, cruiserAegis)
  fleetAlpha.flagshipInstanceId = cruiserAegis.instanceId

  const corvetteValiant = createShipInstance({
    definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE",
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "NATION_VSS",
      ownerName: "Liên minh VSS",
      factionId: "FACTION_SOL_NAVY",
    },
    customName: "VSS Swift Hawk",
    gameDay: currentDay,
  })
  corvetteValiant.assignedCrewCount = 16
  addShipToFleet(fleetAlpha, corvetteValiant)

  const cutterSar = createShipInstance({
    definitionId: "SHIP_DEF_ASCLEPIUS_SAR_CUTTER",
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "NATION_VSS",
      ownerName: "Liên minh VSS",
      factionId: "FACTION_SOL_NAVY",
    },
    customName: "VSS Life Guardian",
    gameDay: currentDay,
  })
  cutterSar.assignedCrewCount = 24
  addShipToFleet(fleetAlpha, cutterSar)

  fleetAlpha.personnel.crewPool.crewAssigned = 130
  fleetAlpha.personnel.crewPool.crewIdle = 20
  fleetAlpha.personnel.crewPool.totalCrew = 150
  fleetAlpha.operationalStatus = "STATIONED"
  fleets[fleetAlpha.fleetId] = fleetAlpha

  // 2. FLEET_SOL_DEFENSE: Vệ Binh Thủ Phủ (Docked at Base)
  const fleetDefense = createFleetEntity({
    fleetId: "FLEET_SOL_DEFENSE",
    name: "Hạm Đội Vệ Binh Thái Dương",
    customCallsign: "Sol Citadel",
    ownerRef: {
      ownerType: "NATION",
      ownerId: "NATION_VSS",
      nationId: "sol_federation",
    },
    registeredHomeBaseId: "sol_command_hq",
    initialSectorId: "sol_command_hq",
    initialBaseId: "sol_command_hq",
    fleetTypeId: "FLEET_TYPE_HOME_DEFENSE",
    fleetClassId: "FLEET_CLASS_MK2_TASKFORCE",
    initialCredits: 8500,
    initialSupplyCredits: 2000,
    initialFood: 2000,
    initialEnergy: 3500,
    initialFramePoints: 320,
    currentGameDay: currentDay,
  })

  const carrierHyperion = createShipInstance({
    definitionId: "SHIP_DEF_HYPERION_CARRIER",
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "NATION_VSS",
      ownerName: "Liên minh VSS",
      factionId: "FACTION_SOL_NAVY",
    },
    customName: "VSS Solar Citadel",
    gameDay: currentDay,
  })
  carrierHyperion.assignedCrewCount = 240
  addShipToFleet(fleetDefense, carrierHyperion)
  fleetDefense.flagshipInstanceId = carrierHyperion.instanceId

  const corvetteDef = createShipInstance({
    definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE",
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "NATION_VSS",
      ownerName: "Liên minh VSS",
      factionId: "FACTION_SOL_NAVY",
    },
    customName: "VSS Watchman",
    gameDay: currentDay,
  })
  corvetteDef.assignedCrewCount = 16
  addShipToFleet(fleetDefense, corvetteDef)

  fleetDefense.personnel.crewPool.crewAssigned = 256
  fleetDefense.personnel.crewPool.crewIdle = 44
  fleetDefense.personnel.crewPool.totalCrew = 300
  fleetDefense.operationalStatus = "DOCKED"
  fleets[fleetDefense.fleetId] = fleetDefense

  // 3. FLEET_PEGASUS_LOGISTICS: Đoàn Hậu Cần Tiếp Tế
  const fleetLogistics = createFleetEntity({
    fleetId: "FLEET_PEGASUS_LOGISTICS",
    name: "Đoàn Hậu Cần Tiếp Tế Pegasus",
    customCallsign: "Pegasus Train",
    ownerRef: {
      ownerType: "NATION",
      ownerId: "NATION_VSS",
      nationId: "sol_federation",
    },
    registeredHomeBaseId: "sol_command_hq",
    initialSectorId: "sol_command_hq",
    fleetTypeId: "FLEET_TYPE_LOGISTICS_SUPPORT",
    fleetClassId: "FLEET_CLASS_MK1_SQUAD",
    initialCredits: 6000,
    initialSupplyCredits: 1500,
    initialFood: 6000,
    initialEnergy: 5000,
    initialFramePoints: 180,
    currentGameDay: currentDay,
  })

  const supplyTender = createShipInstance({
    definitionId: "SHIP_DEF_HERMES_SUPPLY_TENDER",
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "NATION_VSS",
      ownerName: "Liên minh VSS",
      factionId: "FACTION_SOL_NAVY",
    },
    customName: "VSS Hermes Heavy",
    gameDay: currentDay,
  })
  supplyTender.assignedCrewCount = 40
  addShipToFleet(fleetLogistics, supplyTender)
  fleetLogistics.flagshipInstanceId = supplyTender.instanceId

  fleetLogistics.personnel.crewPool.crewAssigned = 40
  fleetLogistics.personnel.crewPool.crewIdle = 20
  fleetLogistics.personnel.crewPool.totalCrew = 60
  fleetLogistics.operationalStatus = "STATIONED"
  fleets[fleetLogistics.fleetId] = fleetLogistics

  // 4. FLEET_SHADOW_RECON: Hạm Đội Trinh Sát Tiền Tiêu Sigma
  const fleetRecon = createFleetEntity({
    fleetId: "FLEET_SHADOW_RECON",
    name: "Hạm Đội Trinh Sát Tiền Tiêu Sigma",
    customCallsign: "Sigma Echo",
    ownerRef: {
      ownerType: "NATION",
      ownerId: "NATION_VSS",
      nationId: "sol_federation",
    },
    registeredHomeBaseId: "sol_command_hq",
    initialSectorId: "alpha_centauri_outpost",
    fleetTypeId: "FLEET_TYPE_TACTICAL_RECON",
    fleetClassId: "FLEET_CLASS_MK1_SQUAD",
    initialCredits: 4500,
    initialSupplyCredits: 800,
    initialFood: 1200,
    initialEnergy: 2000,
    initialFramePoints: 240,
    currentGameDay: currentDay,
  })

  const scout1 = createShipInstance({
    definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE",
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "NATION_VSS",
      ownerName: "Liên minh VSS",
      factionId: "FACTION_SOL_NAVY",
    },
    customName: "VSS Shadow Scout A",
    gameDay: currentDay,
  })
  scout1.assignedCrewCount = 16
  addShipToFleet(fleetRecon, scout1)
  fleetRecon.flagshipInstanceId = scout1.instanceId

  fleetRecon.personnel.crewPool.crewAssigned = 16
  fleetRecon.personnel.crewPool.crewIdle = 14
  fleetRecon.personnel.crewPool.totalCrew = 30
  fleetRecon.operationalStatus = "STATIONED"
  fleets[fleetRecon.fleetId] = fleetRecon

  worldState.fleets = fleets
  return fleets
}
