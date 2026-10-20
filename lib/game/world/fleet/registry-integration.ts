/**
 * STARFRONT WORLD — Fleet Catalog Registry Integration (Phase 7.1)
 *
 * Integrates the 7 canonical master catalogs of domain "fleet" with
 * the FND-1 Catalog Registry:
 * 1. fleet_type
 * 2. fleet_class
 * 3. ship_type
 * 4. ship_class
 * 5. ship_definition
 * 6. policy_profile
 * 7. frame_award_catalog
 */

import { CatalogRegistry, defaultCatalogRegistry } from "../catalog/registry"
import type { CatalogNodeFile, ICatalogDataProvider, ResolvedCatalogItem } from "../catalog/types"
import type {
  FleetClassDefinition,
  FleetPolicyProfile,
  FleetTypeDefinition,
  FrameAwardDefinition,
  ShipClassDefinition,
  ShipDefinition,
  ShipTypeDefinition,
} from "./catalog-types"

/**
 * 1. Canonical Default Fleet Types
 */
export const SYSTEM_DEFAULT_FLEET_TYPES: FleetTypeDefinition[] = [
  {
    id: "FLEET_TYPE_MILITARY_EXPEDITIONARY",
    name: "Hạm Đội Viễn Chinh Tác Chiến",
    description: "Chuyên trách tấn công thọc sâu, giải phóng các sector bị bao vây và tiêu diệt hạm đội địch.",
    strategicRole: "OFFENSIVE",
    baseSpeedMultiplier: 1.15,
    baseMaintenanceCostMultiplier: 1.25,
    defaultAIPersona: "AGGRESSIVE_VANGUARD",
    compatibleShipTypes: ["SHIP_TYPE_BATTLESHIP", "SHIP_TYPE_CARRIER", "SHIP_TYPE_CRUISER", "SHIP_TYPE_DESTROYER"],
    lifecycle: "ACTIVE",
  },
  {
    id: "FLEET_TYPE_HOME_DEFENSE",
    name: "Hạm Đội Vệ Binh Thủ Phủ",
    description: "Đóng giữ bảo vệ các căn cứ kinh tế then chốt, tối ưu hóa khả năng phòng ngự và lá chắn.",
    strategicRole: "DEFENSIVE",
    baseSpeedMultiplier: 0.9,
    baseMaintenanceCostMultiplier: 0.85,
    defaultAIPersona: "STEADFAST_DEFENDER",
    compatibleShipTypes: ["SHIP_TYPE_BATTLESHIP", "SHIP_TYPE_CRUISER", "SHIP_TYPE_DESTROYER", "SHIP_TYPE_FRIGATE"],
    lifecycle: "ACTIVE",
  },
  {
    id: "FLEET_TYPE_SEARCH_AND_RESCUE",
    name: "Hạm Đội Tìm Kiếm & Cứu Hộ SAR",
    description: "Tốc độ hành quân cao, trang bị trạm y tế hồi sức dã chiến, chuyên cứu hộ phi công gặp nạn.",
    strategicRole: "SUPPORT",
    baseSpeedMultiplier: 1.3,
    baseMaintenanceCostMultiplier: 0.95,
    defaultAIPersona: "TACTICAL_RECON",
    compatibleShipTypes: ["SHIP_TYPE_CORVETTE", "SHIP_TYPE_FRIGATE", "SHIP_TYPE_FREIGHTER"],
    lifecycle: "ACTIVE",
  },
  {
    id: "FLEET_TYPE_LOGISTICS_TRANSPORT",
    name: "Hạm Đội Hộ Tống & Vận Tải Chiến Lược",
    description: "Sức chứa khoang hàng cực lớn, đảm bảo tiếp vận lương thực và nhiên liệu thông suốt thiên hà.",
    strategicRole: "LOGISTICS",
    baseSpeedMultiplier: 0.85,
    baseMaintenanceCostMultiplier: 0.8,
    defaultAIPersona: "COMMERCIAL_ESCORT",
    compatibleShipTypes: ["SHIP_TYPE_FREIGHTER", "SHIP_TYPE_FRIGATE", "SHIP_TYPE_CORVETTE"],
    lifecycle: "ACTIVE",
  },
]

/**
 * 2. Canonical Default Fleet Classes (MK I – MK V)
 */
export const SYSTEM_DEFAULT_FLEET_CLASSES: FleetClassDefinition[] = [
  {
    id: "FLEET_CLASS_MK1_SQUAD",
    tierOrder: 1,
    displayName: "Tiểu Đội Hạm Đội MK I (Squad)",
    minLevel: 1,
    maxLevel: 10,
    maxShipCount: 4,
    commandCapRequirement: 1,
    minimumCommanderRank: "ENSIGN",
    baseUpkeepCredits: 250,
    levelMultiplier: 1.0,
    lifecycle: "ACTIVE",
  },
  {
    id: "FLEET_CLASS_MK2_FLOTILLA",
    tierOrder: 2,
    displayName: "Chi Hạm Đội MK II (Flotilla)",
    minLevel: 11,
    maxLevel: 20,
    maxShipCount: 8,
    commandCapRequirement: 2,
    minimumCommanderRank: "LIEUTENANT",
    baseUpkeepCredits: 650,
    levelMultiplier: 1.5,
    lifecycle: "ACTIVE",
  },
  {
    id: "FLEET_CLASS_MK3_TASK_FORCE",
    tierOrder: 3,
    displayName: "Phân Hạm Đội Đặc Nhiệm MK III (Task Force)",
    minLevel: 21,
    maxLevel: 30,
    maxShipCount: 16,
    commandCapRequirement: 4,
    minimumCommanderRank: "COMMANDER",
    baseUpkeepCredits: 1600,
    levelMultiplier: 2.0,
    lifecycle: "ACTIVE",
  },
  {
    id: "FLEET_CLASS_MK4_BATTLE_GROUP",
    tierOrder: 4,
    displayName: "Liên Đội Tác Chiến MK IV (Battle Group)",
    minLevel: 31,
    maxLevel: 40,
    maxShipCount: 32,
    commandCapRequirement: 8,
    minimumCommanderRank: "COMMODORE",
    baseUpkeepCredits: 3800,
    levelMultiplier: 2.5,
    lifecycle: "ACTIVE",
  },
  {
    id: "FLEET_CLASS_MK5_ARMADA",
    tierOrder: 5,
    displayName: "Đại Hạm Đội Hùng Cường MK V (Armada)",
    minLevel: 41,
    maxLevel: 50,
    maxShipCount: 64,
    commandCapRequirement: 16,
    minimumCommanderRank: "ADMIRAL",
    baseUpkeepCredits: 9500,
    levelMultiplier: 3.0,
    hasMaxTierBonus: true,
    lifecycle: "ACTIVE",
  },
]

/**
 * 3. Canonical Default Ship Types
 */
export const SYSTEM_DEFAULT_SHIP_TYPES: ShipTypeDefinition[] = [
  {
    id: "SHIP_TYPE_CORVETTE",
    name: "Hộ Vệ Hạm Trinh Sát Nhanh (Corvette)",
    hullClass: "LIGHT",
    evasionBase: 45,
    speedBase: 140,
    defaultRole: "RECON_PATROL",
    lifecycle: "ACTIVE",
  },
  {
    id: "SHIP_TYPE_FRIGATE",
    name: "Khinh Hạm Đa Năng (Frigate)",
    hullClass: "MEDIUM_LIGHT",
    evasionBase: 30,
    speedBase: 110,
    defaultRole: "SCREENING_ESCORT",
    lifecycle: "ACTIVE",
  },
  {
    id: "SHIP_TYPE_DESTROYER",
    name: "Khu Trục Hạm Tác Chiến (Destroyer)",
    hullClass: "MEDIUM",
    evasionBase: 20,
    speedBase: 95,
    defaultRole: "LINE_COMBAT",
    lifecycle: "ACTIVE",
  },
  {
    id: "SHIP_TYPE_CRUISER",
    name: "Tuần Dương Hạm Hỏa Lực (Cruiser)",
    hullClass: "HEAVY",
    evasionBase: 12,
    speedBase: 75,
    defaultRole: "FIRE_SUPPORT",
    lifecycle: "ACTIVE",
  },
  {
    id: "SHIP_TYPE_BATTLESHIP",
    name: "Thiết Giáp Hạm Kỳ Hạm (Battleship)",
    hullClass: "CAPITAL",
    evasionBase: 5,
    speedBase: 55,
    defaultRole: "COMMAND_SIEGE",
    lifecycle: "ACTIVE",
  },
  {
    id: "SHIP_TYPE_CARRIER",
    name: "Hàng Không Mẫu Hạm Cơ Giới (Carrier)",
    hullClass: "CAPITAL",
    evasionBase: 6,
    speedBase: 65,
    defaultRole: "STRIKE_HANGAR",
    lifecycle: "ACTIVE",
  },
  {
    id: "SHIP_TYPE_FREIGHTER",
    name: "Tàu Vận Tải Tiếp Tế Hậu Cần (Freighter)",
    hullClass: "LOGISTICS",
    evasionBase: 8,
    speedBase: 60,
    defaultRole: "SUPPLY_TRANSPORT",
    lifecycle: "ACTIVE",
  },
]

/**
 * 4. Canonical Default Ship Classes (MK I – MK V)
 */
export const SYSTEM_DEFAULT_SHIP_CLASSES: ShipClassDefinition[] = [
  {
    id: "SHIP_CLASS_MK1_STANDARD",
    tierOrder: 1,
    displayName: "Chuẩn Công Nghệ MK I - Khởi Thủy",
    hullMultiplier: 1.0,
    shieldMultiplier: 1.0,
    moduleSlotBonus: 0,
    maintenanceFactor: 1.0,
    lifecycle: "ACTIVE",
  },
  {
    id: "SHIP_CLASS_MK2_REINFORCED",
    tierOrder: 2,
    displayName: "Chuẩn Công Nghệ MK II - Gia Cố Thân Vỏ",
    hullMultiplier: 1.35,
    shieldMultiplier: 1.25,
    moduleSlotBonus: 1,
    maintenanceFactor: 1.2,
    lifecycle: "ACTIVE",
  },
  {
    id: "SHIP_CLASS_MK3_ADVANCED",
    tierOrder: 3,
    displayName: "Chuẩn Công Nghệ MK III - Hợp Kim Lượng Tử",
    hullMultiplier: 1.85,
    shieldMultiplier: 1.7,
    moduleSlotBonus: 2,
    maintenanceFactor: 1.5,
    lifecycle: "ACTIVE",
  },
  {
    id: "SHIP_CLASS_MK4_STELLAR",
    tierOrder: 4,
    displayName: "Chuẩn Công Nghệ MK IV - Lõi Phản Vật Chất",
    hullMultiplier: 2.5,
    shieldMultiplier: 2.3,
    moduleSlotBonus: 3,
    maintenanceFactor: 2.0,
    lifecycle: "ACTIVE",
  },
  {
    id: "SHIP_CLASS_MK5_DREAD",
    tierOrder: 5,
    displayName: "Chuẩn Công Nghệ MK V - Tuyệt Tác Tác Chiến",
    hullMultiplier: 3.6,
    shieldMultiplier: 3.2,
    moduleSlotBonus: 5,
    maintenanceFactor: 2.8,
    hasCapstoneBonus: true,
    lifecycle: "ACTIVE",
  },
  {
    id: "SHIP_CLASS_MK6_SUPER_ALLOY",
    tierOrder: 6,
    displayName: "Chuẩn Công Nghệ MK VI - Cấu Trúc Siêu Hợp Kim",
    hullMultiplier: 4.8,
    shieldMultiplier: 4.2,
    moduleSlotBonus: 6,
    maintenanceFactor: 3.5,
    lifecycle: "ACTIVE",
  },
  {
    id: "SHIP_CLASS_MK7_PARTICLE",
    tierOrder: 7,
    displayName: "Chuẩn Công Nghệ MK VII - Khiên Hạt Lượng Tử",
    hullMultiplier: 6.2,
    shieldMultiplier: 5.5,
    moduleSlotBonus: 7,
    maintenanceFactor: 4.2,
    lifecycle: "ACTIVE",
  },
  {
    id: "SHIP_CLASS_MK8_ARMADA",
    tierOrder: 8,
    displayName: "Chuẩn Công Nghệ MK VIII - Thống Nhất Hạm Đội",
    hullMultiplier: 8.0,
    shieldMultiplier: 7.0,
    moduleSlotBonus: 8,
    maintenanceFactor: 5.0,
    lifecycle: "ACTIVE",
  },
  {
    id: "SHIP_CLASS_MK9_CITADEL",
    tierOrder: 9,
    displayName: "Chuẩn Công Nghệ MK IX - Pháo Đài Di Động",
    hullMultiplier: 10.5,
    shieldMultiplier: 9.0,
    moduleSlotBonus: 9,
    maintenanceFactor: 6.0,
    lifecycle: "ACTIVE",
  },
  {
    id: "SHIP_CLASS_MK10_TRANSCENDENT",
    tierOrder: 10,
    displayName: "Chuẩn Công Nghệ MK X - Kỳ Hạm Tối Thượng Apex",
    hullMultiplier: 14.0,
    shieldMultiplier: 12.0,
    moduleSlotBonus: 10,
    maintenanceFactor: 7.5,
    hasCapstoneBonus: true,
    lifecycle: "ACTIVE",
  },
]

/**
 * 5. Canonical Default Ship Definitions (Master Blueprints)
 */
export const SYSTEM_DEFAULT_SHIP_DEFINITIONS: ShipDefinition[] = [
  {
    id: "SHIP_DEF_SOL_VALIANT_CORVETTE",
    typeId: "SHIP_TYPE_CORVETTE",
    classId: "SHIP_CLASS_MK1_STANDARD",
    name: "Sol Valiant Corvette",
    faction: "vss",
    description: "Chiến hạm trinh sát tiêu chuẩn của Liên minh VSS, độ cơ động tuyệt hảo trên các tuyến tuần tra.",
    baseStats: {
      maxHp: 3200,
      maxShield: 1800,
      attack: 280,
      defense: 150,
      speed: 135,
    },
    crewRequirements: {
      minimumCrew: 8,
      targetCrew: 16,
      maximumCrew: 24,
    },
    slotsLayout: [
      { slotId: "slot_wpn_1", slotType: "WEAPON", size: "LIGHT" },
      { slotId: "slot_eng_1", slotType: "ENGINE", size: "LIGHT" },
      { slotId: "slot_shd_1", slotType: "SHIELD", size: "LIGHT" },
      { slotId: "slot_utl_1", slotType: "UTILITY", size: "LIGHT" },
    ],
    cargoCapacity: 120,
    fuelCapacity: 450,
    buildCost: {
      industrialMaterials: 450,
      energy: 200,
      credits: 1200,
      buildDays: 5,
    },
    lifecycle: "ACTIVE",
  },
  {
    id: "SHIP_DEF_AEGIS_LINE_CRUISER",
    typeId: "SHIP_TYPE_CRUISER",
    classId: "SHIP_CLASS_MK2_REINFORCED",
    name: "Aegis Vanguard Line Cruiser",
    faction: "vss",
    description: "Tuần dương hạm chủ lực hạng nặng, bệ đỡ phòng thủ của mọi hạm đội viễn chinh.",
    baseStats: {
      maxHp: 14500,
      maxShield: 9800,
      attack: 1250,
      defense: 820,
      speed: 75,
    },
    crewRequirements: {
      minimumCrew: 45,
      targetCrew: 90,
      maximumCrew: 135,
    },
    slotsLayout: [
      { slotId: "slot_wpn_1", slotType: "WEAPON", size: "HEAVY" },
      { slotId: "slot_wpn_2", slotType: "WEAPON", size: "MEDIUM" },
      { slotId: "slot_shd_1", slotType: "SHIELD", size: "HEAVY" },
      { slotId: "slot_eng_1", slotType: "ENGINE", size: "HEAVY" },
      { slotId: "slot_hgr_1", slotType: "HANGAR", size: "MEDIUM" },
      { slotId: "slot_utl_1", slotType: "UTILITY", size: "MEDIUM" },
    ],
    cargoCapacity: 850,
    fuelCapacity: 1800,
    buildCost: {
      industrialMaterials: 2400,
      energy: 1200,
      credits: 6800,
      buildDays: 18,
    },
    lifecycle: "ACTIVE",
  },
  {
    id: "SHIP_DEF_HYPERION_CARRIER",
    typeId: "SHIP_TYPE_CARRIER",
    classId: "SHIP_CLASS_MK3_ADVANCED",
    name: "Hyperion Fleet Dread Carrier",
    faction: "vss",
    description: "Hàng không mẫu hạm tinh anh mang theo phi đội GEAR, bệ phóng tác chiến viễn chinh.",
    baseStats: {
      maxHp: 28000,
      maxShield: 16500,
      attack: 1850,
      defense: 1200,
      speed: 65,
    },
    crewRequirements: {
      minimumCrew: 120,
      targetCrew: 240,
      maximumCrew: 360,
    },
    slotsLayout: [
      { slotId: "slot_hgr_1", slotType: "HANGAR", size: "CAPITAL" },
      { slotId: "slot_hgr_2", slotType: "HANGAR", size: "CAPITAL" },
      { slotId: "slot_wpn_1", slotType: "WEAPON", size: "MEDIUM" },
      { slotId: "slot_shd_1", slotType: "SHIELD", size: "HEAVY" },
      { slotId: "slot_eng_1", slotType: "ENGINE", size: "HEAVY" },
      { slotId: "slot_utl_1", slotType: "UTILITY", size: "HEAVY" },
    ],
    cargoCapacity: 2500,
    fuelCapacity: 4000,
    buildCost: {
      industrialMaterials: 5800,
      energy: 3200,
      credits: 16500,
      buildDays: 32,
    },
    lifecycle: "ACTIVE",
  },
  {
    id: "SHIP_DEF_HERMES_SUPPLY_TENDER",
    typeId: "SHIP_TYPE_FREIGHTER",
    classId: "SHIP_CLASS_MK1_STANDARD",
    name: "Hermes Heavy Supply Tender",
    faction: "vss",
    description: "Tàu hậu cần tiếp vận chuyên chở khối lượng lớn lương thực, đạn dược và nhiên liệu.",
    baseStats: {
      maxHp: 7500,
      maxShield: 4200,
      attack: 120,
      defense: 350,
      speed: 60,
    },
    crewRequirements: {
      minimumCrew: 20,
      targetCrew: 40,
      maximumCrew: 60,
    },
    slotsLayout: [
      { slotId: "slot_crg_1", slotType: "CARGO", size: "CAPITAL" },
      { slotId: "slot_crg_2", slotType: "CARGO", size: "CAPITAL" },
      { slotId: "slot_shd_1", slotType: "SHIELD", size: "MEDIUM" },
      { slotId: "slot_eng_1", slotType: "ENGINE", size: "MEDIUM" },
      { slotId: "slot_utl_1", slotType: "UTILITY", size: "MEDIUM" },
    ],
    cargoCapacity: 6000,
    fuelCapacity: 5000,
    buildCost: {
      industrialMaterials: 1800,
      energy: 900,
      credits: 4200,
      buildDays: 12,
    },
    lifecycle: "ACTIVE",
  },
  {
    id: "SHIP_DEF_ASCLEPIUS_SAR_CUTTER",
    typeId: "SHIP_TYPE_CORVETTE",
    classId: "SHIP_CLASS_MK2_REINFORCED",
    name: "Asclepius Emergency SAR Cutter",
    faction: "vss",
    description: "Chiến hạm cứu hộ siêu tốc, trang bị buồng hồi sức dã chiến chuyên tìm kiếm cứu nạn phi công.",
    baseStats: {
      maxHp: 4200,
      maxShield: 2800,
      attack: 320,
      defense: 240,
      speed: 145,
    },
    crewRequirements: {
      minimumCrew: 12,
      targetCrew: 24,
      maximumCrew: 36,
    },
    slotsLayout: [
      { slotId: "slot_wpn_1", slotType: "WEAPON", size: "LIGHT" },
      { slotId: "slot_eng_1", slotType: "ENGINE", size: "MEDIUM" },
      { slotId: "slot_shd_1", slotType: "SHIELD", size: "LIGHT" },
      { slotId: "slot_utl_1", slotType: "UTILITY", size: "HEAVY" },
    ],
    cargoCapacity: 300,
    fuelCapacity: 800,
    buildCost: {
      industrialMaterials: 850,
      energy: 450,
      credits: 2400,
      buildDays: 7,
    },
    lifecycle: "ACTIVE",
  },
]

/**
 * 6. Canonical Default Fleet Policy Profiles
 */
export const SYSTEM_DEFAULT_FLEET_POLICY_PROFILES: FleetPolicyProfile[] = [
  {
    id: "POLICY_NATIONAL_STANDARD_2026",
    name: "Chính Sách Hạm Đội Tiêu Chuẩn Quốc Gia VSS",
    annualDecayCycleDays: 360,
    annualDecayDivisor: 2,
    annualDecayMaxCapPercent: 50,
    subsidyMultiplierPerTier: 10,
    subsidyFloorPercent: 30,
    subsidyFullRateLimit: 3,
    frontlineWarExceptionEnabled: true,
    emergencyCommandThresholds: {
      capitalSiege: true,
      sectorThreatLevelCutoff: 85,
      minFleetReadinessPercent: 60,
    },
    newGuildProtectionDays: 360,
    exchangeRateFrameToCredits: 150,
    lifecycle: "ACTIVE",
  },
]

/**
 * 7. Canonical Default FRAME Awards
 */
export const SYSTEM_DEFAULT_FRAME_AWARDS: FrameAwardDefinition[] = [
  {
    id: "FRAME_AWARD_BOSS_ELIMINATION",
    name: "Chiến Công Tiêu Diệt Boss Đe Dọa Cấp Cao",
    basePoints: 2500,
    bonusMultiplierPerThreatLevel: 1.25,
    recipientType: "FLEET_AND_PILOT",
    description: "Khen thưởng đặc biệt khi hạm đội xóa sổ hoàn toàn một hạm đội đầu não của phe đối địch.",
    lifecycle: "ACTIVE",
  },
  {
    id: "FRAME_AWARD_SAR_PILOT_RESCUED",
    name: "Huân Chương Cứu Nạn Phi Công Chiến Trường",
    basePoints: 450,
    bonusMultiplierPerThreatLevel: 1.1,
    recipientType: "FLEET",
    description: "Trao thưởng cho mỗi phi công đồng minh được giải cứu và đưa về căn cứ an toàn.",
    lifecycle: "ACTIVE",
  },
  {
    id: "FRAME_AWARD_TRADE_LANE_PATROL_CYCLE",
    name: "Công Trạng Bảo Vệ Hành Lang Siêu Không Gian",
    basePoints: 150,
    bonusMultiplierPerThreatLevel: 1.05,
    recipientType: "FLEET",
    description: "Thưởng định kỳ 7 ngày cho các hạm đội duy trì an ninh tuyệt đối trên các tuyến đường huyết mạch.",
    lifecycle: "ACTIVE",
  },
  {
    id: "FRAME_AWARD_FORTIFICATION_BREAKTHROUGH",
    name: "Đột Phá Tuyến Phòng Thủ Kiên Cố",
    basePoints: 850,
    bonusMultiplierPerThreatLevel: 1.15,
    recipientType: "FLEET",
    description: "Ghi nhận chiến công phá vỡ công sự phòng thủ của đối phương trong chiến dịch giải phóng.",
    lifecycle: "ACTIVE",
  },
]

/**
 * Helper to wrap array into standard CatalogNodeFile structure
 */
function toNodeFile<T>(configFileId: string, items: T[]): CatalogNodeFile<T> {
  return {
    configFileId,
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items,
  }
}

export function seedFleetCatalogData(provider: ICatalogDataProvider): void {
  const files: Record<string, CatalogNodeFile<any>> = {
    "system_fleet_fleet_type_data.json": toNodeFile("system_fleet_fleet_type", SYSTEM_DEFAULT_FLEET_TYPES),
    "system_fleet_fleet_class_data.json": toNodeFile("system_fleet_fleet_class", SYSTEM_DEFAULT_FLEET_CLASSES),
    "system_fleet_ship_type_data.json": toNodeFile("system_fleet_ship_type", SYSTEM_DEFAULT_SHIP_TYPES),
    "system_fleet_ship_class_data.json": toNodeFile("system_fleet_ship_class", SYSTEM_DEFAULT_SHIP_CLASSES),
    "system_fleet_ship_definition_data.json": toNodeFile("system_fleet_ship_definition", SYSTEM_DEFAULT_SHIP_DEFINITIONS),
    "system_fleet_policy_profile_data.json": toNodeFile("system_fleet_policy_profile", SYSTEM_DEFAULT_FLEET_POLICY_PROFILES),
    "system_fleet_frame_award_catalog_data.json": toNodeFile("system_fleet_frame_award_catalog", SYSTEM_DEFAULT_FRAME_AWARDS),
  }

  for (const [filename, nodeFile] of Object.entries(files)) {
    if (!provider.exists(filename)) {
      provider.writeFile(filename, JSON.stringify(nodeFile, null, 2))
    }
  }
}

/**
 * Seeds and registers all 7 Fleet master catalogs into the target CatalogRegistry
 */
export function registerFleetCatalogs(
  registry: CatalogRegistry = defaultCatalogRegistry,
  provider?: ICatalogDataProvider
): void {
  const activeProvider = provider || registry.getDataProvider()
  if (activeProvider) {
    seedFleetCatalogData(activeProvider)
  }

  // 2. Register definitions into CatalogRegistry
  registry.registerCatalog<FleetTypeDefinition>({
    domain: "fleet",
    catalogName: "fleet_type",
    rootFilename: "system_fleet_fleet_type_data.json",
    schemaVersion: 1,
  })

  registry.registerCatalog<FleetClassDefinition>({
    domain: "fleet",
    catalogName: "fleet_class",
    rootFilename: "system_fleet_fleet_class_data.json",
    schemaVersion: 1,
  })

  registry.registerCatalog<ShipTypeDefinition>({
    domain: "fleet",
    catalogName: "ship_type",
    rootFilename: "system_fleet_ship_type_data.json",
    schemaVersion: 1,
  })

  registry.registerCatalog<ShipClassDefinition>({
    domain: "fleet",
    catalogName: "ship_class",
    rootFilename: "system_fleet_ship_class_data.json",
    schemaVersion: 1,
  })

  registry.registerCatalog<ShipDefinition>({
    domain: "fleet",
    catalogName: "ship_definition",
    rootFilename: "system_fleet_ship_definition_data.json",
    schemaVersion: 1,
  })

  registry.registerCatalog<FleetPolicyProfile>({
    domain: "fleet",
    catalogName: "policy_profile",
    rootFilename: "system_fleet_policy_profile_data.json",
    schemaVersion: 1,
  })

  registry.registerCatalog<FrameAwardDefinition>({
    domain: "fleet",
    catalogName: "frame_award_catalog",
    rootFilename: "system_fleet_frame_award_catalog_data.json",
    schemaVersion: 1,
  })
}

// Strongly typed query helpers
export function getFleetType(id: string, registry: CatalogRegistry = defaultCatalogRegistry): ResolvedCatalogItem<FleetTypeDefinition> | undefined {
  return registry.getItem<FleetTypeDefinition>("fleet", "fleet_type", id)
}

export function getFleetClass(id: string, registry: CatalogRegistry = defaultCatalogRegistry): ResolvedCatalogItem<FleetClassDefinition> | undefined {
  return registry.getItem<FleetClassDefinition>("fleet", "fleet_class", id)
}

export function getShipType(id: string, registry: CatalogRegistry = defaultCatalogRegistry): ResolvedCatalogItem<ShipTypeDefinition> | undefined {
  return registry.getItem<ShipTypeDefinition>("fleet", "ship_type", id)
}

export function getShipClass(id: string, registry: CatalogRegistry = defaultCatalogRegistry): ResolvedCatalogItem<ShipClassDefinition> | undefined {
  return registry.getItem<ShipClassDefinition>("fleet", "ship_class", id)
}

export function getShipDefinition(id: string, registry: CatalogRegistry = defaultCatalogRegistry): ResolvedCatalogItem<ShipDefinition> | undefined {
  return registry.getItem<ShipDefinition>("fleet", "ship_definition", id)
}

export function getFleetPolicyProfile(id: string, registry: CatalogRegistry = defaultCatalogRegistry): ResolvedCatalogItem<FleetPolicyProfile> | undefined {
  return registry.getItem<FleetPolicyProfile>("fleet", "policy_profile", id)
}

export function getFrameAward(id: string, registry: CatalogRegistry = defaultCatalogRegistry): ResolvedCatalogItem<FrameAwardDefinition> | undefined {
  return registry.getItem<FrameAwardDefinition>("fleet", "frame_award_catalog", id)
}
