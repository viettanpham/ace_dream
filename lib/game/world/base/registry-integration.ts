/**
 * STARFRONT WORLD — Base Catalog Registry Integration (Phase 6.34A-FND-6)
 *
 * Integrates base_class, base_type, hub_specialization, and world_seed_profile
 * with the FND-1 Catalog Registry.
 */

import {
  CatalogRegistry,
  defaultCatalogRegistry,
} from "../catalog/registry"
import type { CatalogNodeFile, ICatalogDataProvider, ResolvedCatalogItem } from "../catalog/types"
import { SYSTEM_HUB_SPECIALIZATION_DEFINITIONS } from "./seed-data"

export const SYSTEM_DEFAULT_BASE_CLASSES = [
  {
    id: "SOVEREIGN_CAPITAL",
    baseClass: "SOVEREIGN_CAPITAL",
    name: "Thủ Phủ Tối Cao (Sovereign Capital / CC0)",
    description: "Trung tâm chỉ huy quốc gia tối cao, đặt tại hậu phương chiến lược với mạng lưới quỹ đạo 2..12 slots.",
    entityKind: "MAIN_BASE",
    defaultTier: 4,
    defaultDockingPorts: 8,
    maxOrbitalSlotsRange: [2, 12],
    maxHubSlots: 8,
    slotProfileId: "slot_profile_capital_citadel",
    coreBuildingDefIds: [
      "bld_command_center",
      "bld_residential_complex",
      "bld_cargo_depot",
      "bld_tech_lab",
      "bld_fortress_bastion",
      "bld_garrison_barracks",
    ],
    lifecycle: "ACTIVE",
  },
  {
    id: "MAJOR_HUB",
    baseClass: "MAJOR_HUB",
    name: "Trung Tâm Trọng Điểm (Major Hub)",
    description: "Căn cứ đô thị hoặc tổ hợp chuyên môn hóa quy mô lớn trên trục giao thông chính.",
    entityKind: "MAIN_BASE",
    defaultTier: 2,
    defaultDockingPorts: 6,
    maxOrbitalSlotsRange: [1, 3],
    maxHubSlots: 5,
    slotProfileId: "slot_profile_border_outpost",
    coreBuildingDefIds: [
      "bld_command_center",
      "bld_residential_complex",
      "bld_cargo_depot",
      "bld_tech_lab",
      "bld_fortress_bastion",
    ],
    lifecycle: "ACTIVE",
  },
  {
    id: "REGIONAL_BASE",
    baseClass: "REGIONAL_BASE",
    name: "Căn Cứ Khu Vực / Tiền Tiêu (Regional Base)",
    description: "Căn cứ chính tiêu chuẩn kiểm soát khu vực nội địa hoặc biên giới chiến lược.",
    entityKind: "MAIN_BASE",
    defaultTier: 1,
    defaultDockingPorts: 4,
    maxOrbitalSlotsRange: [1, 3],
    maxHubSlots: 4,
    slotProfileId: "slot_profile_border_outpost",
    coreBuildingDefIds: [
      "bld_command_center",
      "bld_residential_complex",
      "bld_cargo_depot",
      "bld_tech_lab",
      "bld_fortress_bastion",
    ],
    lifecycle: "ACTIVE",
  },
  {
    id: "ORBITAL_STATION",
    baseClass: "ORBITAL_STATION",
    name: "Trạm Quỹ Đạo / Căn Cứ Phụ (Orbital Sub-Base)",
    description: "Căn cứ vệ tinh xoay quanh Main Base, sử dụng chung Shared Base Framework nhưng không tính vào 30 Main Base Nodes.",
    entityKind: "SUB_BASE",
    defaultTier: 1,
    defaultDockingPorts: 4,
    maxOrbitalSlotsRange: [0, 0],
    maxHubSlots: 1,
    slotProfileId: "slot_profile_orbital_subbase",
    coreBuildingDefIds: [
      "bld_command_center",
      "bld_residential_complex",
      "bld_orbital_spaceport",
      "bld_fortress_bastion",
    ],
    lifecycle: "ACTIVE",
  },
]

export const SYSTEM_DEFAULT_BASE_TYPES = [
  {
    id: "CAPITAL",
    name: "Thủ Phủ Liên Minh (Capital / CC0)",
    description: "Đầu não chính trị, quân sự và khoa học tối cao của quốc gia.",
    baseClassId: "SOVEREIGN_CAPITAL",
    defaultStrategicRole: "CAPITAL",
    defaultDockingPorts: 8,
    defaultHubType: "COMMAND_HUB",
    lifecycle: "ACTIVE",
  },
  {
    id: "MILITARY",
    name: "Pháo Đài Quân Sự (Military Fortress)",
    description: "Căn cứ tác chiến tiền phương tập trung đồn trú và chỉ huy hạm đội.",
    baseClassId: "MAJOR_HUB",
    defaultStrategicRole: "BORDER",
    defaultDockingPorts: 5,
    defaultHubType: "COMMAND_HUB",
    lifecycle: "ACTIVE",
  },
  {
    id: "DEFENSE",
    name: "Thành Trì Phòng Thủ (Defense Bastion)",
    description: "Chốt chặn phòng thủ biên giới với công sự dày đặc và lưới lửa phòng không.",
    baseClassId: "REGIONAL_BASE",
    defaultStrategicRole: "BORDER",
    defaultDockingPorts: 5,
    lifecycle: "ACTIVE",
  },
  {
    id: "INDUSTRY",
    name: "Tổ Hợp Công Nghiệp Nặng (Industrial Hub)",
    description: "Trung tâm luyện kim, chế tạo cơ giới và sản xuất vật liệu chiến lược.",
    baseClassId: "MAJOR_HUB",
    defaultStrategicRole: "SPECIALIZED",
    defaultDockingPorts: 4,
    defaultHubType: "INDUSTRIAL_HUB",
    lifecycle: "ACTIVE",
  },
  {
    id: "RESEARCH",
    name: "Tổ Hợp Nghiên Cứu Lượng Tử (Research Nexus)",
    description: "Viện nghiên cứu công nghệ cao và phân tích dữ liệu chiến thuật.",
    baseClassId: "REGIONAL_BASE",
    defaultStrategicRole: "SPECIALIZED",
    defaultDockingPorts: 2,
    defaultHubType: "RESEARCH_HUB",
    lifecycle: "ACTIVE",
  },
  {
    id: "TRANSPORT_HUB",
    name: "Đầu Mối Giao Thông Liên Sao (Transport Hub)",
    description: "Cảng trung chuyển hạm đội, bến tàu và cửa ngõ siêu không gian.",
    baseClassId: "MAJOR_HUB",
    defaultStrategicRole: "INTERIOR",
    defaultDockingPorts: 5,
    defaultHubType: "TRANSPORT_HUB",
    lifecycle: "ACTIVE",
  },
  {
    id: "LOGISTICS",
    name: "Trung Tâm Tiếp Vận Hậu Cần (Logistics Center)",
    description: "Kho dự trữ chiến lược và trạm điều phối đoàn vận tải liên khu vực.",
    baseClassId: "REGIONAL_BASE",
    defaultStrategicRole: "INTERIOR",
    defaultDockingPorts: 5,
    defaultHubType: "LOGISTICS_HUB",
    lifecycle: "ACTIVE",
  },
  {
    id: "MINING",
    name: "Thuộc Địa Khai Khoáng (Mining Colony)",
    description: "Khu khai thác quặng sâu và tinh thể năng lượng vùng vành đai.",
    baseClassId: "REGIONAL_BASE",
    defaultStrategicRole: "BORDER",
    defaultDockingPorts: 2,
    lifecycle: "ACTIVE",
  },
  {
    id: "AGRICULTURAL",
    name: "Vòm Nông Sinh Thái (Agricultural Dome)",
    description: "Tổ hợp nông trang thủy canh cung cấp lương thực cho toàn thiên hà.",
    baseClassId: "REGIONAL_BASE",
    defaultStrategicRole: "SPECIALIZED",
    defaultDockingPorts: 3,
    lifecycle: "ACTIVE",
  },
  {
    id: "MEDICAL",
    name: "Trung Tâm Quân Dân Y (Medical Sanctuary)",
    description: "Tổ hợp bệnh viện điều trị thương binh, phục hồi phi công và nghiên cứu sinh học.",
    baseClassId: "REGIONAL_BASE",
    defaultStrategicRole: "SPECIALIZED",
    defaultDockingPorts: 3,
    defaultHubType: "MEDICAL_HUB",
    lifecycle: "ACTIVE",
  },
  {
    id: "FINANCIAL",
    name: "Sàn Giao Dịch & Ngân Khố (Financial Exchange)",
    description: "Trung tâm thương mại, ngân khố dự trữ và điều phối tài chính.",
    baseClassId: "MAJOR_HUB",
    defaultStrategicRole: "SPECIALIZED",
    defaultDockingPorts: 4,
    defaultHubType: "FINANCIAL_HUB",
    lifecycle: "ACTIVE",
  },
  {
    id: "HABITAT",
    name: "Đại Đô Thị Cư Dân (Habitat Megapolis)",
    description: "Quần thể đô thị vòm kính mật độ dân cư cao và trung tâm văn hóa.",
    baseClassId: "MAJOR_HUB",
    defaultStrategicRole: "INTERIOR",
    defaultDockingPorts: 6,
    lifecycle: "ACTIVE",
  },
  {
    id: "GENERAL",
    name: "Căn Cứ Đa Năng Tiêu Chuẩn (General Base)",
    description: "Căn cứ hành tinh cân bằng giữa dân sinh, hậu cần và phòng thủ.",
    baseClassId: "REGIONAL_BASE",
    defaultStrategicRole: "INTERIOR",
    defaultDockingPorts: 3,
    lifecycle: "ACTIVE",
  },
]

export const SYSTEM_DEFAULT_HUB_SPECIALIZATION_ITEMS = Object.values(
  SYSTEM_HUB_SPECIALIZATION_DEFINITIONS
).map((hub) => ({
  id: hub.hubType,
  ...hub,
  lifecycle: "ACTIVE" as const,
}))

export const SYSTEM_DEFAULT_WORLD_SEED_PROFILES = [
  {
    id: "SEED_PROFILE_STANDARD_30",
    name: "Thiên Hà Tiêu Chuẩn 30 Khu Vực (Balanced 18/12)",
    description: "Cấu hình khởi tạo chuẩn 30 Main Base Nodes với tối thiểu 20% mỗi phe, chênh lệch tổng sức mạnh quốc gia tối đa 10 điểm phần trăm.",
    totalMainBaseNodes: 30,
    minimumFactionBaseSharePercent: 20,
    maximumFactionPowerDifferencePercentagePoints: 10,
    vssBaseTargetCount: 18,
    voidBaseTargetCount: 12,
    capitalOrbitalSlotsTable: {
      1: 2,
      2: 3,
      3: 4,
      4: 5,
      5: 6,
      6: 7,
      7: 8,
      8: 9,
      9: 10,
      10: 12,
    },
    maxNonCapitalOrbitalSlots: 3,
    autoSaveIntervalGameDays: 7,
    autoSaveIntervalRealMinutes: 10,
    lifecycle: "ACTIVE",
  },
  {
    id: "SEED_PROFILE_PARITY_15_15",
    name: "Thế Trận Đối Xứng Tuyệt Đối (Parity 15/15)",
    description: "Mỗi phe nắm giữ đúng 15 Main Base Nodes (50% / 50%) với cân bằng sức mạnh đối xứng.",
    totalMainBaseNodes: 30,
    minimumFactionBaseSharePercent: 20,
    maximumFactionPowerDifferencePercentagePoints: 10,
    vssBaseTargetCount: 15,
    voidBaseTargetCount: 15,
    capitalOrbitalSlotsTable: {
      1: 2,
      2: 3,
      3: 4,
      4: 5,
      5: 6,
      6: 7,
      7: 8,
      8: 9,
      9: 10,
      10: 12,
    },
    maxNonCapitalOrbitalSlots: 3,
    autoSaveIntervalGameDays: 7,
    autoSaveIntervalRealMinutes: 10,
    lifecycle: "ACTIVE",
  },
  {
    id: "SEED_PROFILE_DOMINANCE_24_6",
    name: "Ưu Thế Lãnh Thổ Tối Đa (24 VSS / 6 Void Elite)",
    description: "VSS nắm 24 căn cứ (80%), Void nắm 6 căn cứ tinh anh (20%) có cấp độ MK cao và hạm đội tập trung để giữ chênh lệch sức mạnh <= 10%.",
    totalMainBaseNodes: 30,
    minimumFactionBaseSharePercent: 20,
    maximumFactionPowerDifferencePercentagePoints: 10,
    vssBaseTargetCount: 24,
    voidBaseTargetCount: 6,
    capitalOrbitalSlotsTable: {
      1: 2,
      2: 3,
      3: 4,
      4: 5,
      5: 6,
      6: 7,
      7: 8,
      8: 9,
      9: 10,
      10: 12,
    },
    maxNonCapitalOrbitalSlots: 3,
    autoSaveIntervalGameDays: 7,
    autoSaveIntervalRealMinutes: 10,
    lifecycle: "ACTIVE",
  },
]

export const SYSTEM_BASE_CATALOG_FILES: Record<string, CatalogNodeFile> = {
  "system_base_base_class_data.json": {
    configFileId: "system_base_base_class",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_BASE_CLASSES,
    metadata: {
      domain: "base",
      catalog: "base_class",
      description: "Canonical FND-6 Base Classes (Main Base & Orbital Sub-Base).",
    },
  },
  "system_base_base_type_data.json": {
    configFileId: "system_base_base_type",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_BASE_TYPES,
    metadata: {
      domain: "base",
      catalog: "base_type",
      description: "Canonical FND-6 Base Types.",
    },
  },
  "system_base_hub_specialization_data.json": {
    configFileId: "system_base_hub_specialization",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_HUB_SPECIALIZATION_ITEMS,
    metadata: {
      domain: "base",
      catalog: "hub_specialization",
      description: "Canonical 8 Hub Specializations for FND-6.",
    },
  },
  "system_base_world_seed_profile_data.json": {
    configFileId: "system_base_world_seed_profile",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_WORLD_SEED_PROFILES,
    metadata: {
      domain: "base",
      catalog: "world_seed_profile",
      description: "Canonical World Seed & Generation Profiles for FND-6.",
    },
  },
}

/**
 * Pre-seeds a data provider with canonical SYSTEM base files
 */
export function seedBaseCatalogData(provider: ICatalogDataProvider): void {
  for (const [filename, nodeFile] of Object.entries(SYSTEM_BASE_CATALOG_FILES)) {
    if (!provider.exists(filename)) {
      provider.writeFile(filename, JSON.stringify(nodeFile, null, 2))
    }
  }
}

/**
 * Registers base domain catalogs with a CatalogRegistry
 */
export function registerBaseCatalogs(
  registry: CatalogRegistry = defaultCatalogRegistry,
  provider?: ICatalogDataProvider
): void {
  const targetProvider = provider || registry.getDataProvider()
  if (targetProvider) {
    seedBaseCatalogData(targetProvider)
  }

  registry.registerCatalog({
    domain: "base",
    catalogName: "base_class",
  })

  registry.registerCatalog({
    domain: "base",
    catalogName: "base_type",
  })

  registry.registerCatalog({
    domain: "base",
    catalogName: "hub_specialization",
  })

  registry.registerCatalog({
    domain: "base",
    catalogName: "world_seed_profile",
  })
}

export function getBaseClassCatalogItem(
  id: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem<any> | undefined {
  return registry.getItem("base", "base_class", id)
}

export function getBaseTypeCatalogItem(
  id: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem<any> | undefined {
  return registry.getItem("base", "base_type", id)
}

export function getHubSpecializationCatalogItem(
  id: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem<any> | undefined {
  return registry.getItem("base", "hub_specialization", id)
}

export function getWorldSeedProfileCatalogItem(
  id: string,
  registry: CatalogRegistry = defaultCatalogRegistry
): ResolvedCatalogItem<any> | undefined {
  return registry.getItem("base", "world_seed_profile", id)
}

// Auto-register on default registry
registerBaseCatalogs(defaultCatalogRegistry)
