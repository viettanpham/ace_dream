import type {
  WorldFaction,
  WorldRoute,
  WorldSector,
  WorldState,
} from "./types"
import { DEFAULT_SURVIVAL_CONFIG } from "./pilot-survival-engine"
import { bootstrapWorldCatalogs } from "./bootstrap"
import type { BasePopulationState, BaseType } from "./population/types"
import type { BaseEntityState, BuildingInstance } from "./building/types"
import { createBuildingInstance } from "./building/construction-engine"
import { SYSTEM_DEFAULT_BUILDING_DEFINITIONS } from "./building/seed-data"

/**
 * 8 Sector vũ trụ khởi đầu chuẩn hóa theo quy chuẩn thiết kế B.5
 */
export const INITIAL_WORLD_SECTORS: Record<string, WorldSector> = {
  sol_command_hq: {
    id: "sol_command_hq",
    name: "Tổng Hành Dinh Sol Command",
    subtitle: "Thủ phủ liên minh VSS — Mức đe dọa tối thiểu",
    desc: "Trung tâm chỉ huy tối cao của Vanguard Solar Syndicate. Nơi tập trung đầu não công nghệ mecha và mạng lưới liên lạc chiến lược.",
    x: 16,
    y: 78,
    sovereignty: "vss",
    threatLevel: 40,
    classification: "headquarters",
    stage: "normal",
    industryCapacity: 220,
    garrisonPower: 550,
    resources: {
      industrialMaterials: 1000,
      energy: 800,
      logisticsSupplies: 600,
      tacticalData: 400,
      food: 1500,
    },
    population: 260000,
    stability: 95,
  },
  helios_perimeter: {
    id: "helios_perimeter",
    name: "Vành Đai Helios",
    subtitle: "Vành đai năng lượng mặt trời — Tuyến phòng thủ vành trong",
    desc: "Tổ hợp các tấm thu năng lượng plasma quỹ đạo và pháo đài tuần tra bảo vệ lối vào hệ Sol.",
    x: 30,
    y: 66,
    sovereignty: "vss",
    threatLevel: 150,
    stage: "normal",
    industryCapacity: 160,
    garrisonPower: 380,
    resources: {
      industrialMaterials: 500,
      energy: 700,
      logisticsSupplies: 300,
      tacticalData: 100,
      food: 800,
    },
    population: 130000,
    stability: 88,
  },
  mining_outpost_k7: {
    id: "mining_outpost_k7",
    name: "Trạm Khai Mỏ K-7",
    subtitle: "Mỏ quặng Hợp kim Titan sâu — Bị đe dọa bởi thám báo",
    desc: "Cơ sở khai khoáng kim loại nặng chủ lực của liên minh. Gần đây xuất hiện nhiều tín hiệu trinh sát bất thường của Void.",
    x: 44,
    y: 82,
    sovereignty: "vss",
    threatLevel: 360,
    stage: "threatened",
    industryCapacity: 200,
    garrisonPower: 260,
    resources: {
      industrialMaterials: 600,
      energy: 200,
      logisticsSupplies: 150,
      tacticalData: 50,
      food: 500,
    },
    population: 70000,
    stability: 72,
  },
  asteroid_delta: {
    id: "asteroid_delta",
    name: "Vành Đai Tiểu Hành Tinh Delta",
    subtitle: "Trường thiên thạch giàu tinh thể — Tuyến hàng hải nhộn nhịp",
    desc: "Mạng lưới các trạm trung chuyển hàng hóa và xưởng lọc quặng nhỏ phân bố rải rác giữa vành đai đá vụn.",
    x: 46,
    y: 52,
    sovereignty: "vss",
    threatLevel: 240,
    stage: "normal",
    industryCapacity: 120,
    garrisonPower: 200,
    resources: {
      industrialMaterials: 250,
      energy: 150,
      logisticsSupplies: 200,
      tacticalData: 60,
      food: 400,
    },
    population: 45000,
    stability: 80,
  },
  nebula_bastion: {
    id: "nebula_bastion",
    name: "Pháo Đài Nebula Bastion",
    subtitle: "Tiền đồn quân sự tinh vân — Tiền tuyến bảo vệ vành ngoài",
    desc: "Pháo đài không gian kiên cố nằm ẩn trong tinh vân khí ion. Điểm tập kết của các hạm đội tuần tra tiền phương.",
    x: 62,
    y: 68,
    sovereignty: "vss",
    threatLevel: 480,
    stage: "threatened",
    industryCapacity: 170,
    garrisonPower: 450,
    resources: {
      industrialMaterials: 150,
      energy: 350,
      logisticsSupplies: 350,
      tacticalData: 180,
      food: 300,
    },
    population: 85000,
    stability: 68,
  },
  waypoint_orion: {
    id: "waypoint_orion",
    name: "Trạm Tiếp Vận Waypoint Orion",
    subtitle: "Cửa ngõ liên sao — Vùng tranh chấp an ninh",
    desc: "Điểm giao cắt giữa các tuyến siêu không gian chính. Tình hình an ninh bất ổn do sự quấy rối thường xuyên của hạm đội ngoại lai.",
    x: 66,
    y: 44,
    sovereignty: "contested",
    threatLevel: 580,
    stage: "threatened",
    industryCapacity: 90,
    garrisonPower: 180,
    resources: {
      industrialMaterials: 80,
      energy: 120,
      logisticsSupplies: 180,
      tacticalData: 120,
      food: 200,
    },
    population: 50000,
    stability: 52,
  },
  shadow_reach: {
    id: "shadow_reach",
    name: "Tiền Duyên Shadow Reach",
    subtitle: "Vùng rìa không gian tối — Đang bị vây hãm nghiêm trọng",
    desc: "Trạm kiểm soát biên giới bị hạm đội The Void phong tỏa các tuyến tiếp tế. Lực lượng phòng thủ đang cầm cự trong hầm ngầm.",
    x: 80,
    y: 76,
    sovereignty: "contested",
    threatLevel: 760,
    stage: "under_siege",
    industryCapacity: 60,
    garrisonPower: 120,
    resources: {
      industrialMaterials: 40,
      energy: 60,
      logisticsSupplies: 80,
      tacticalData: 150,
      food: 90,
    },
    population: 30000,
    stability: 32,
  },
  tartarus_breach: {
    id: "tartarus_breach",
    name: "Khe Nứt Tartarus Breach",
    subtitle: "Vết nứt không-thời gian — Căn cứ hạm đội Void xâm lược",
    desc: "Khu vực bị The Void đánh chiếm và thiết lập cổng dịch chuyển sinh cơ. Mọi hoạt động dân sự bị xóa sổ hoàn toàn.",
    x: 90,
    y: 48,
    sovereignty: "void",
    threatLevel: 980,
    classification: "headquarters",
    stage: "lost",
    industryCapacity: 40,
    garrisonPower: 800,
    resources: {
      industrialMaterials: 0,
      energy: 200,
      logisticsSupplies: 0,
      tacticalData: 300,
      food: 0,
    },
    population: 10000,
    stability: 8,
  },
  elysium_sanctuary: {
    id: "elysium_sanctuary",
    name: "Thánh Địa Elysium",
    subtitle: "Vòm sinh quyển thủy canh & Viện nghiên cứu sinh cơ — Thượng nguồn công nghệ",
    desc: "Quần thể trạm quỹ đạo sinh quyển thủy canh và phòng thí nghiệm công nghệ vũ trụ tiên tiến. Nơi cung cấp nguồn lương thực dồi dào và lưu trữ dữ liệu chiến thuật then chốt của liên minh VSS.",
    x: 26,
    y: 28,
    sovereignty: "vss",
    threatLevel: 90,
    stage: "normal",
    industryCapacity: 150,
    garrisonPower: 280,
    resources: {
      industrialMaterials: 300,
      energy: 650,
      logisticsSupplies: 400,
      tacticalData: 550,
      food: 1800,
    },
    population: 110000,
    stability: 92,
  },
  abyssal_rift: {
    id: "abyssal_rift",
    name: "Vực Thẳm Abyssal Rift",
    subtitle: "Cụm tàn tích cổ đại & Năng lượng hắc ám — Vùng biên giới dị thường",
    desc: "Khu vực không gian biến dạng gần hố đen siêu khối lượng, chứa các mỏ khoáng sản tinh thể đen và tàn tích hạm đội cổ xưa. Hiện đang bị The Void thăm dò ráo riết và tranh chấp quyền kiểm soát.",
    x: 82,
    y: 24,
    sovereignty: "contested",
    threatLevel: 650,
    stage: "threatened",
    industryCapacity: 80,
    garrisonPower: 220,
    resources: {
      industrialMaterials: 450,
      energy: 500,
      logisticsSupplies: 120,
      tacticalData: 380,
      food: 120,
    },
    population: 35000,
    stability: 45,
  },
}

/**
 * 16 Tuyến đường siêu không gian kết nối mạng lưới 10 Sector (Phase 6.28)
 */
export const INITIAL_WORLD_ROUTES: WorldRoute[] = [
  {
    id: "r_sol_helios",
    fromSectorId: "sol_command_hq",
    toSectorId: "helios_perimeter",
    distance: 1,
    state: "open",
    dangerLevel: 5,
  },
  {
    id: "r_sol_delta",
    fromSectorId: "sol_command_hq",
    toSectorId: "asteroid_delta",
    distance: 2,
    state: "open",
    dangerLevel: 8,
  },
  {
    id: "r_helios_k7",
    fromSectorId: "helios_perimeter",
    toSectorId: "mining_outpost_k7",
    distance: 1,
    state: "open",
    dangerLevel: 14,
  },
  {
    id: "r_helios_delta",
    fromSectorId: "helios_perimeter",
    toSectorId: "asteroid_delta",
    distance: 1,
    state: "open",
    dangerLevel: 10,
  },
  {
    id: "r_helios_elysium",
    fromSectorId: "helios_perimeter",
    toSectorId: "elysium_sanctuary",
    distance: 2,
    state: "open",
    dangerLevel: 12,
  },
  {
    id: "r_elysium_delta",
    fromSectorId: "elysium_sanctuary",
    toSectorId: "asteroid_delta",
    distance: 2,
    state: "open",
    dangerLevel: 16,
  },
  {
    id: "r_k7_nebula",
    fromSectorId: "mining_outpost_k7",
    toSectorId: "nebula_bastion",
    distance: 2,
    state: "hazardous",
    dangerLevel: 36,
  },
  {
    id: "r_delta_nebula",
    fromSectorId: "asteroid_delta",
    toSectorId: "nebula_bastion",
    distance: 2,
    state: "open",
    dangerLevel: 22,
  },
  {
    id: "r_delta_orion",
    fromSectorId: "asteroid_delta",
    toSectorId: "waypoint_orion",
    distance: 2,
    state: "hazardous",
    dangerLevel: 42,
  },
  {
    id: "r_nebula_orion",
    fromSectorId: "nebula_bastion",
    toSectorId: "waypoint_orion",
    distance: 1,
    state: "open",
    dangerLevel: 28,
  },
  {
    id: "r_nebula_shadow",
    fromSectorId: "nebula_bastion",
    toSectorId: "shadow_reach",
    distance: 2,
    state: "hazardous",
    dangerLevel: 68,
  },
  {
    id: "r_orion_shadow",
    fromSectorId: "waypoint_orion",
    toSectorId: "shadow_reach",
    distance: 2,
    state: "hazardous",
    dangerLevel: 62,
  },
  {
    id: "r_orion_abyssal",
    fromSectorId: "waypoint_orion",
    toSectorId: "abyssal_rift",
    distance: 2,
    state: "hazardous",
    dangerLevel: 48,
  },
  {
    id: "r_abyssal_tartarus",
    fromSectorId: "abyssal_rift",
    toSectorId: "tartarus_breach",
    distance: 2,
    state: "blocked",
    dangerLevel: 88,
  },
  {
    id: "r_orion_tartarus",
    fromSectorId: "waypoint_orion",
    toSectorId: "tartarus_breach",
    distance: 3,
    state: "blocked",
    dangerLevel: 92,
  },
  {
    id: "r_shadow_tartarus",
    fromSectorId: "shadow_reach",
    toSectorId: "tartarus_breach",
    distance: 1,
    state: "blocked",
    dangerLevel: 98,
  },
]

/**
 * Hai phe phái ban đầu (Chính phủ VSS & Đế Chế The Void)
 */
export const INITIAL_WORLD_FACTIONS: Record<string, WorldFaction> = {
  vss: {
    id: "vss",
    name: "Liên Minh Chính Phủ VSS (Vanguard Solar Syndicate)",
    shortName: "VSS Coalition",
    color: "#38bdf8",
    controlledSectorIds: [
      "sol_command_hq",
      "helios_perimeter",
      "mining_outpost_k7",
      "asteroid_delta",
      "nebula_bastion",
      "elysium_sanctuary",
    ],
    reputation: 100,
  },
  void: {
    id: "void",
    name: "Đế Chế The Void (The Void Incursion)",
    shortName: "The Void",
    color: "#a855f7",
    controlledSectorIds: ["tartarus_breach"],
    isAggressor: true,
  },
}

/**
 * Khởi tạo trạng thái World State mặc định chuẩn hóa cho Phase 6.1
 */
export function createInitialWorldState(customSeed?: number): WorldState {
  const now = typeof Date !== "undefined" ? Date.now() : 1773000000000
  const seed = customSeed ?? 10839217

  // Clone an toàn các object để tránh mutation dữ liệu mẫu
  const sectors: Record<string, WorldSector> = {}
  for (const [id, sector] of Object.entries(INITIAL_WORLD_SECTORS)) {
    const isHq = id === "sol_command_hq" || id.endsWith("_hq") || id === "tartarus_breach" || sector.classification === "headquarters"
    const maxThreat = sector.maxThreat ?? (isHq ? 100_000_000 : 1_000_000)
    sectors[id] = {
      ...sector,
      classification: isHq ? "headquarters" : (sector.classification || "standard"),
      maxThreat,
      resources: { ...sector.resources },
      threatHistory: [
        {
          day: 1,
          threat: sector.threatLevel,
        },
      ],
    }
  }

  const routes = INITIAL_WORLD_ROUTES.map((r) => ({ ...r }))

  const factions: Record<string, WorldFaction> = {}
  for (const [id, f] of Object.entries(INITIAL_WORLD_FACTIONS)) {
    factions[id] = {
      ...f,
      controlledSectorIds: [...f.controlledSectorIds],
    }
  }

  // Bootstrap all canonical catalogs to ensure registry is 100% warmed up
  bootstrapWorldCatalogs()

  // Xây dựng bản đồ định nghĩa công trình tra cứu nhanh
  const defMap = new Map(SYSTEM_DEFAULT_BUILDING_DEFINITIONS.map((d) => [d.id, d]))

  // Cấu hình Căn cứ chuẩn tắc cho 8 Sector khởi đầu
  const initialBaseConfigs: Record<
    string,
    {
      baseId: string
      name: string
      baseType: BaseType
      slotProfileId: string
      coreDefIds: string[]
      activeHubTypes: string[]
      visitorPop: number
      workerPop: number
      capacity: { residential: number; visitor: number; temporaryWorker: number; emergency: number }
    }
  > = {
    sol_command_hq: {
      baseId: "base_sol_command_hq",
      name: "Đại Bản Doanh Sol Command",
      baseType: "CAPITAL",
      slotProfileId: "slot_profile_capital_citadel",
      coreDefIds: ["bld_command_center", "bld_strategic_vault", "bld_field_hospital", "bld_sub_power_station", "bld_sar_station"],
      activeHubTypes: ["COMMAND_HUB", "LOGISTICS_HUB"],
      visitorPop: 5000,
      workerPop: 3000,
      capacity: { residential: 300000, visitor: 20000, temporaryWorker: 15000, emergency: 50000 },
    },
    helios_perimeter: {
      baseId: "base_helios_perimeter",
      name: "Pháo Đài Vành Đai Helios",
      baseType: "DEFENSE",
      slotProfileId: "slot_profile_border_outpost",
      coreDefIds: ["bld_command_center", "bld_fortress_bastion", "bld_garrison_barracks", "bld_sub_power_station"],
      activeHubTypes: ["REPAIR_HUB"],
      visitorPop: 1500,
      workerPop: 2000,
      capacity: { residential: 150000, visitor: 5000, temporaryWorker: 10000, emergency: 25000 },
    },
    mining_outpost_k7: {
      baseId: "base_mining_outpost_k7",
      name: "Tổ Hợp Khai Khoáng K-7",
      baseType: "GENERAL",
      slotProfileId: "slot_profile_border_outpost",
      coreDefIds: ["bld_command_center", "bld_heavy_fabricator", "bld_cargo_depot", "bld_sub_power_station"],
      activeHubTypes: [],
      visitorPop: 800,
      workerPop: 8000,
      capacity: { residential: 90000, visitor: 2000, temporaryWorker: 20000, emergency: 10000 },
    },
    asteroid_delta: {
      baseId: "base_asteroid_delta",
      name: "Trạm Trung Chuyển Asteroid Delta",
      baseType: "TRANSPORT_HUB",
      slotProfileId: "slot_profile_border_outpost",
      coreDefIds: ["bld_command_center", "bld_cargo_depot", "bld_sub_power_station"],
      activeHubTypes: ["TRANSPORT_HUB"],
      visitorPop: 4000,
      workerPop: 5000,
      capacity: { residential: 60000, visitor: 8000, temporaryWorker: 12000, emergency: 10000 },
    },
    nebula_bastion: {
      baseId: "base_nebula_bastion",
      name: "Căn Cứ Đồn Trú Tinh Vân Bastion",
      baseType: "MILITARY",
      slotProfileId: "slot_profile_border_outpost",
      coreDefIds: ["bld_command_center", "bld_fortress_bastion", "bld_garrison_barracks", "bld_sub_power_station"],
      activeHubTypes: ["REPAIR_HUB"],
      visitorPop: 1000,
      workerPop: 2000,
      capacity: { residential: 120000, visitor: 3000, temporaryWorker: 5000, emergency: 20000 },
    },
    elysium_sanctuary: {
      baseId: "base_elysium_sanctuary",
      name: "Thánh Địa Dân Cư Elysium",
      baseType: "HABITAT",
      slotProfileId: "slot_profile_capital_citadel",
      coreDefIds: ["bld_command_center", "bld_residential_complex", "bld_hydroponic_farm", "bld_field_hospital"],
      activeHubTypes: ["MEDICAL_HUB"],
      visitorPop: 8000,
      workerPop: 1500,
      capacity: { residential: 220000, visitor: 15000, temporaryWorker: 5000, emergency: 40000 },
    },
    shadow_reach: {
      baseId: "base_shadow_reach",
      name: "Trạm Khảo Sát Không Gian Sâu Shadow Reach",
      baseType: "RESEARCH",
      slotProfileId: "slot_profile_border_outpost",
      coreDefIds: ["bld_command_center", "bld_tech_lab", "bld_sub_power_station"],
      activeHubTypes: [],
      visitorPop: 500,
      workerPop: 1200,
      capacity: { residential: 35000, visitor: 1000, temporaryWorker: 5000, emergency: 5000 },
    },
    tartarus_breach: {
      baseId: "base_tartarus_breach",
      name: "Tiền Đồn Phong Tỏa Tartarus Breach",
      baseType: "DEFENSE",
      slotProfileId: "slot_profile_border_outpost",
      coreDefIds: ["bld_command_center", "bld_fortress_bastion"],
      activeHubTypes: [],
      visitorPop: 0,
      workerPop: 0,
      capacity: { residential: 15000, visitor: 0, temporaryWorker: 0, emergency: 5000 },
    },
    waypoint_orion: {
      baseId: "base_waypoint_orion",
      name: "Trạm Tiếp Vận Waypoint Orion",
      baseType: "TRANSPORT_HUB",
      slotProfileId: "slot_profile_border_outpost",
      coreDefIds: ["bld_command_center", "bld_cargo_depot"],
      activeHubTypes: ["TRANSPORT_HUB"],
      visitorPop: 2000,
      workerPop: 1500,
      capacity: { residential: 60000, visitor: 5000, temporaryWorker: 5000, emergency: 10000 },
    },
    abyssal_rift: {
      baseId: "base_abyssal_rift",
      name: "Tiền Đồn Thám Hiểm Abyssal Rift",
      baseType: "RESEARCH",
      slotProfileId: "slot_profile_border_outpost",
      coreDefIds: ["bld_command_center", "bld_tech_lab"],
      activeHubTypes: [],
      visitorPop: 300,
      workerPop: 800,
      capacity: { residential: 45000, visitor: 1000, temporaryWorker: 2000, emergency: 5000 },
    },
  }

  const basePopulationStates: Record<string, BasePopulationState> = {}
  const bases: Record<string, BaseEntityState> = {}

  for (const [sectorId, sector] of Object.entries(sectors)) {
    const cfg = initialBaseConfigs[sectorId] || {
      baseId: `base_${sectorId}`,
      name: `Căn Cứ ${sector.name}`,
      baseType: "GENERAL" as BaseType,
      slotProfileId: "slot_profile_border_outpost",
      coreDefIds: ["bld_command_center"],
      activeHubTypes: [],
      visitorPop: 100,
      workerPop: 100,
      capacity: { residential: sector.population * 1.2, visitor: 1000, temporaryWorker: 2000, emergency: 5000 },
    }

    // 1. Khởi tạo BasePopulationState
    basePopulationStates[cfg.baseId] = {
      baseId: cfg.baseId,
      populationCurrent: sector.population,
      populationAvailable: sector.population,
      populationOccupied: 0,
      visitorPopulation: cfg.visitorPop,
      externalWorkerPopulation: cfg.workerPop,
      breakdown: {
        BUILDING_WORKFORCE: 0,
        FLEET_CREW: 0,
        LOGISTICS: 0,
        TRAINING: 0,
        RECOVERY: 0,
        OTHER_ASSIGNMENTS: 0,
      },
      capacity: {
        residentialCapacity: cfg.capacity.residential,
        visitorCapacity: cfg.capacity.visitor,
        temporaryWorkerCapacity: cfg.capacity.temporaryWorker,
        emergencyCapacity: cfg.capacity.emergency,
        emergencyOverflowAllowed: true,
        emergencyOverflowLimitRatio: 1.25,
      },
      baseType: cfg.baseType,
      activeHubTypes: [...cfg.activeHubTypes],
    }

    // 2. Khởi tạo BaseEntityState với các công trình cốt lõi
    const buildings: Record<string, BuildingInstance> = {}
    const coreBuildingIds: string[] = []

    for (const defId of cfg.coreDefIds) {
      const def = defMap.get(defId)
      if (def) {
        const instId = `inst_${sectorId}_${defId}`
        const inst = createBuildingInstance(cfg.baseId, def, instId)
        buildings[instId] = inst
        coreBuildingIds.push(instId)
      }
    }

    bases[cfg.baseId] = {
      baseId: cfg.baseId,
      sectorId,
      name: cfg.name,
      baseType: cfg.baseType,
      tier: 1,
      maxTierBonusApplied: false,
      isOrbitalSubBase: false,
      coreBuildingIds,
      expansionBuildingIds: [],
      maxExpansionSlots: cfg.baseType === "CAPITAL" ? 8 : 6,
      slotProfileId: cfg.slotProfileId,
      sharedStorage: {
        industrialMaterials: sector.resources.industrialMaterials,
        energy: sector.resources.energy,
        logisticsSupplies: sector.resources.logisticsSupplies,
        tacticalData: sector.resources.tacticalData,
        food: sector.resources.food,
      },
      storageCapacity: {
        industrialMaterials: cfg.baseType === "CAPITAL" ? 5000 : 2500,
        energy: cfg.baseType === "CAPITAL" ? 5000 : 2500,
        logisticsSupplies: cfg.baseType === "CAPITAL" ? 3000 : 1500,
        tacticalData: cfg.baseType === "CAPITAL" ? 2000 : 1000,
        food: cfg.baseType === "CAPITAL" ? 8000 : 3500,
      },
      buildings,
      constructionQueue: [],
      productionLines: [],
      activeReservations: [],
    }
  }

  let nationalTotalPopulation = 0
  let controlledTerritoryPopulation = 0
  for (const s of Object.values(sectors)) {
    const pop = Math.max(0, s.population || 0)
    nationalTotalPopulation += pop
    if (s.sovereignty === "vss") {
      controlledTerritoryPopulation += pop
    }
  }

  return {
    version: 1,
    worldSeed: seed,
    currentDay: 1,
    totalDaysElapsed: 0,
    realTimeAnchor: now,
    lastTickTimestamp: now,
    sectors,
    routes,
    factions,
    resources: {
      industrialMaterials: 2570,
      energy: 2200,
      logisticsSupplies: 1480,
      tacticalData: 790,
      food: 3700,
    },
    military: {
      deployed: 1770,
      reserves: 850,
      woundedOrRepair: 140,
      retreating: 0,
      casualties: 0,
    },
    demographics: {
      nationalTotalPopulation,
      controlledTerritoryPopulation,
      refugeesInTransit: 0,
      civilianCasualties: 0,
    },
    activeMissionChains: [],
    completedMissionChainIds: [],
    committedTransactionIds: [],
    inFlightTransactions: {},
    transactionJournal: {},
    isSuspendedCombat: false,
    events: {},
    missionChains: {},
    eventResultsArchive: [],
    missionDispatches: {},
    activePlayerMissionId: null,
    operationsArchiveConfig: {
      eventArchiveQuota: 60,
      battleArchiveQuota: 40,
    },
    threatConfig: {
      maxThreatStandard: 1_000_000,
      maxThreatHQ: 100_000_000,
      hpPerThreatPoint: 100,
      winnerRatio: 2,
      threatFormulaMultiplier: 1.0,
      lastModified: now,
    },
    survivalConfig: {
      ...DEFAULT_SURVIVAL_CONFIG,
      lastModified: now,
    },
    pilotSurvivalRegistry: [],
    nationalPowRegistry: [],
    // Phase 6.34A-FND-3 & FND-4 Persistence
    decisions: {
      pendingDecisions: [],
      history: [],
    },
    inTransitTransfers: [],
    basePopulationStates,
    // Phase 6.34A-FND-5 Base Entities & Building Instances
    bases,
    worldResetConfig: {
      cc0Name: "Liên minh VSS",
      commanderName: "Alviss",
      resetCount: 0,
      lastResetTimestamp: now,
    },
  }
}

/**
 * Resets the entire world with a guaranteed fresh random seed.
 * User-facing reset always produces a fresh seed upon confirmation.
 * Allows customizing CC0 faction name and Commander name.
 */
export function createResetWorldState(
  previousState?: WorldState,
  config?: { cc0Name?: string; commanderName?: string }
): WorldState {
  const newSeed = Math.floor(Math.random() * 89999999) + 10000000
  const resetCount = (previousState?.worldResetConfig?.resetCount || 0) + 1
  const state = createInitialWorldState(newSeed)

  state.worldResetConfig = {
    cc0Name: config?.cc0Name || previousState?.worldResetConfig?.cc0Name || "Liên minh VSS",
    commanderName: config?.commanderName || previousState?.worldResetConfig?.commanderName || "Alviss",
    resetCount,
    lastResetTimestamp: Date.now(),
  }

  return state
}
