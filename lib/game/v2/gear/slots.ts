/**
 * STARFRONT WORLD V2 — GEAR V2 P1 Physical Slot & Slot Group Definitions
 *
 * Canonical 10 physical slots across 7 slot groups:
 * Armor x1, Engine x1, CPU x1, Radar/Sensor x1,
 * Standard Weapon x1, Advanced Weapon x1, Auxiliary x4.
 *
 * Cross-check note: No prior GEAR V2 slot IDs or OD-07 mandatory-slot rules
 * existed in the repository; OD-07 remains explicitly UNRESOLVED in P1.
 */

import type {
  GearV2PhysicalSlotId,
  GearV2SlotDefinition,
  GearV2SlotGroupDefinition,
  GearV2SlotGroupId,
} from "./types"

export const GEAR_V2_MAX_PHYSICAL_SLOTS = 10
export const GEAR_V2_MAX_AUXILIARY_SLOTS = 4

export const GEAR_V2_AUXILIARY_SLOT_IDS: readonly GearV2PhysicalSlotId[] = [
  "auxiliary_1",
  "auxiliary_2",
  "auxiliary_3",
  "auxiliary_4",
] as const

export const GEAR_V2_PHYSICAL_SLOT_DEFINITIONS: readonly GearV2SlotDefinition[] = [
  {
    slotId: "armor",
    groupId: "ARMOR",
    displayName: "Armor",
    positionIndex: 1,
    groupMaxCount: 1,
  },
  {
    slotId: "engine",
    groupId: "ENGINE",
    displayName: "Engine",
    positionIndex: 2,
    groupMaxCount: 1,
  },
  {
    slotId: "cpu",
    groupId: "CPU",
    displayName: "CPU",
    positionIndex: 3,
    groupMaxCount: 1,
  },
  {
    slotId: "radar_sensor",
    groupId: "RADAR_SENSOR",
    displayName: "Radar / Sensor",
    positionIndex: 4,
    groupMaxCount: 1,
  },
  {
    slotId: "standard_weapon",
    groupId: "STANDARD_WEAPON",
    displayName: "Standard Weapon",
    positionIndex: 5,
    groupMaxCount: 1,
  },
  {
    slotId: "advanced_weapon",
    groupId: "ADVANCED_WEAPON",
    displayName: "Advanced Weapon",
    positionIndex: 6,
    groupMaxCount: 1,
  },
  {
    slotId: "auxiliary_1",
    groupId: "AUXILIARY",
    displayName: "Auxiliary 1",
    positionIndex: 7,
    groupMaxCount: 4,
  },
  {
    slotId: "auxiliary_2",
    groupId: "AUXILIARY",
    displayName: "Auxiliary 2",
    positionIndex: 8,
    groupMaxCount: 4,
  },
  {
    slotId: "auxiliary_3",
    groupId: "AUXILIARY",
    displayName: "Auxiliary 3",
    positionIndex: 9,
    groupMaxCount: 4,
  },
  {
    slotId: "auxiliary_4",
    groupId: "AUXILIARY",
    displayName: "Auxiliary 4",
    positionIndex: 10,
    groupMaxCount: 4,
  },
] as const

export const GEAR_V2_SLOT_GROUP_DEFINITIONS: readonly GearV2SlotGroupDefinition[] = [
  {
    groupId: "ARMOR",
    displayName: "Armor",
    maxSlots: 1,
    slotIds: ["armor"],
  },
  {
    groupId: "ENGINE",
    displayName: "Engine",
    maxSlots: 1,
    slotIds: ["engine"],
  },
  {
    groupId: "CPU",
    displayName: "CPU",
    maxSlots: 1,
    slotIds: ["cpu"],
  },
  {
    groupId: "RADAR_SENSOR",
    displayName: "Radar / Sensor",
    maxSlots: 1,
    slotIds: ["radar_sensor"],
  },
  {
    groupId: "STANDARD_WEAPON",
    displayName: "Standard Weapon",
    maxSlots: 1,
    slotIds: ["standard_weapon"],
  },
  {
    groupId: "ADVANCED_WEAPON",
    displayName: "Advanced Weapon",
    maxSlots: 1,
    slotIds: ["advanced_weapon"],
  },
  {
    groupId: "AUXILIARY",
    displayName: "Auxiliary",
    maxSlots: 4,
    slotIds: ["auxiliary_1", "auxiliary_2", "auxiliary_3", "auxiliary_4"],
  },
] as const

export const GEAR_V2_PHYSICAL_SLOT_MAP: ReadonlyMap<
  GearV2PhysicalSlotId,
  GearV2SlotDefinition
> = new Map(GEAR_V2_PHYSICAL_SLOT_DEFINITIONS.map((def) => [def.slotId, def]))

export const GEAR_V2_SLOT_GROUP_MAP: ReadonlyMap<
  GearV2SlotGroupId,
  GearV2SlotGroupDefinition
> = new Map(GEAR_V2_SLOT_GROUP_DEFINITIONS.map((def) => [def.groupId, def]))

export const GEAR_V2_PHYSICAL_SLOT_IDS: readonly GearV2PhysicalSlotId[] =
  GEAR_V2_PHYSICAL_SLOT_DEFINITIONS.map((def) => def.slotId)

export function isGearV2PhysicalSlotId(slotId: string): slotId is GearV2PhysicalSlotId {
  return GEAR_V2_PHYSICAL_SLOT_MAP.has(slotId as GearV2PhysicalSlotId)
}

export function isGearV2AuxiliarySlotId(slotId: string): boolean {
  return (
    slotId === "auxiliary_1" ||
    slotId === "auxiliary_2" ||
    slotId === "auxiliary_3" ||
    slotId === "auxiliary_4"
  )
}
