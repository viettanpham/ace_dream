import type {
  WorldFaction,
  WorldRoute,
  WorldSector,
  WorldState,
} from "./types"

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
}

/**
 * 12 Tuyến đường siêu không gian kết nối mạng lưới
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
    sectors[id] = {
      ...sector,
      resources: { ...sector.resources },
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
      nationalTotalPopulation: 680000,
      controlledTerritoryPopulation: 590000,
      refugeesInTransit: 0,
      civilianCasualties: 0,
    },
    activeMissionChains: [],
    completedMissionChainIds: [],
    committedTransactionIds: [],
    inFlightTransactions: {},
    transactionJournal: {},
    isSuspendedCombat: false,
  }
}
