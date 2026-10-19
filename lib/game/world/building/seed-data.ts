/**
 * STARFRONT WORLD — Canonical SYSTEM Default Seed Data (Phase 6.34A-FND-5)
 *
 * Master catalog seed data for:
 * 1. 19 Building Types
 * 2. Building Classes
 * 3. 19 Canonical Building Definitions (one per type, complete with stats)
 * 4. Reusable Slot Profiles (with Tier Growth & MAX TIER BONUS)
 * 5. Detachable Modules & System Capabilities
 * 6. Production Recipes
 * 7. Maintenance Policies
 * 8. Base Init Profiles
 */

import type { CatalogNodeFile } from "../catalog/types"
import type {
  BuildingClass,
  BuildingDefinition,
  BuildingModuleDefinition,
  BuildingType,
  ProductionRecipe,
  SlotProfile,
} from "./types"

/**
 * 19 Approved Building Types
 */
export const SYSTEM_DEFAULT_BUILDING_TYPES: Array<{
  id: BuildingType
  name: string
  description: string
  category: string
}> = [
  { id: "RESIDENTIAL", name: "Khu Dân Sinh", description: "Cung cấp chỗ ở và dịch vụ sinh hoạt cho công dân.", category: "CIVIL" },
  { id: "MEDICAL", name: "Bệnh Viện & Cấp Cứu", description: "Hồi phục sức khỏe, điều trị thương binh và phi công.", category: "MEDICAL" },
  { id: "AGRICULTURE", name: "Nông Trang Thủy Canh", description: "Sản xuất lương thực và dinh dưỡng sinh học.", category: "INDUSTRIAL" },
  { id: "INDUSTRY", name: "Nhà Máy Chế Tạo", description: "Chế tạo linh kiện, vũ khí và hợp kim nặng.", category: "INDUSTRIAL" },
  { id: "STORAGE", name: "Kho Chiến Lược", description: "Lưu trữ tài nguyên công nghiệp, năng lượng và vật tư.", category: "LOGISTICS" },
  { id: "LOGISTICS", name: "Trạm Trung Chuyển", description: "Điều phối vận tải, tiếp vận và bốc dỡ hàng hóa.", category: "LOGISTICS" },
  { id: "RESEARCH", name: "Viện Nghiên Cứu", description: "Phát triển công nghệ mới và phân tích dữ liệu chiến thuật.", category: "SPECIAL" },
  { id: "FINANCE", name: "Ngân Khố Trung Ương", description: "Quản lý dòng tiền, thu thuế và giao dịch tài chính.", category: "ECONOMIC" },
  { id: "ENTERTAINMENT", name: "Khu Phức Hợp Văn Hóa", description: "Nâng cao tinh thần và ổn định tâm lý dân sự.", category: "CIVIL" },
  { id: "SUPPORT", name: "Trạm Phát Điện Phụ Trợ", description: "Cung cấp năng lượng dự phòng và ổn định mạng lưới.", category: "INFRASTRUCTURE" },
  { id: "COMMAND", name: "Sở Chỉ Huy Căn Cứ", description: "Trung tâm điều hành tối cao, chỉ huy mạng lưới phòng thủ.", category: "COMMAND" },
  { id: "DEFENSE", name: "Pháo Đài Phòng Thủ", description: "Hệ thống pháo cao xạ, tháp năng lượng và tường thành.", category: "DEFENSE" },
  { id: "OFFENSE", name: "Trận Địa Tên Lửa", description: "Bệ phóng hỏa tiễn chiến lược tầm xa.", category: "MILITARY" },
  { id: "MILITARY", name: "Doanh Trại Đồn Trú", description: "Huấn luyện tân binh, đồn trú lực lượng quân sự địa phương.", category: "MILITARY" },
  { id: "SPACEPORT", name: "Cảng Không Gian", description: "Bến đỗ tàu vận tải, tiếp đón đoàn di cư và thương nhân.", category: "LOGISTICS" },
  { id: "ORBITAL_DEFENSE", name: "Pháo Quỹ Đạo", description: "Pháo hạt nhân và đài quan sát không gian sâu.", category: "DEFENSE" },
  { id: "GUILD", name: "Trụ Sở Bang Hội", description: "Nơi tập hợp các hạm đội độc lập và hiệp hội thợ săn.", category: "SPECIAL" },
  { id: "RESCUE", name: "Trung Tâm Tìm Kiếm Cứu Nạn (SAR)", description: "Cứu hộ phi công thoát hiểm và ứng cứu khẩn cấp.", category: "RESCUE" },
  { id: "GENERIC", name: "Cơ Sở Hạ Tầng Tiêu Chuẩn", description: "Công trình đa dụng thích ứng với nhiều mục đích.", category: "INFRASTRUCTURE" },
]

/**
 * Building Classes
 */
export const SYSTEM_DEFAULT_BUILDING_CLASSES: Array<{
  id: BuildingClass
  name: string
  description: string
}> = [
  { id: "LIGHT", name: "Công Trình Hạng Nhẹ", description: "Quy mô nhỏ, chi phí thấp, xây nhanh." },
  { id: "MEDIUM", name: "Công Trình Tiêu Chuẩn", description: "Quy mô trung bình, hiệu suất cân bằng." },
  { id: "HEAVY", name: "Công Trình Hạng Nặng", description: "Quy mô lớn, sản lượng cao, tiêu hao nhiều nhân lực." },
  { id: "ORBITAL_OUTPOST", name: "Trạm Vệ Tinh Quỹ Đạo", description: "Đóng trên quỹ đạo, phụ thuộc căn cứ hành tinh mẹ." },
  { id: "CORE_FACILITY", name: "Cơ Sở Cốt Lõi", description: "Công trình mặc định của Căn cứ, không tốn slot mở rộng." },
  { id: "ADVANCED", name: "Cơ Sở Tinh Anh", description: "Trang bị công nghệ cao, yêu cầu Tier tối thiểu." },
]

/**
 * 19 Canonical Building Definitions (one per approved type)
 */
export const SYSTEM_DEFAULT_BUILDING_DEFINITIONS: BuildingDefinition[] = [
  {
    id: "bld_residential_complex",
    name: "Cư Xá Đô Thị VSS",
    type: "RESIDENTIAL",
    class: "MEDIUM",
    description: "Khu nhà ở phức hợp cung cấp chỗ ở cho 2,500 cư dân.",
    baseCost: { industrialMaterials: 300, energy: 150 },
    buildDurationGameDays: 2,
    maxHp: 2000,
    initialCondition: 2000,
    workforceDemands: { minimumPersonnel: 20, targetPersonnel: 50, maximumPersonnel: 80, priority: 80 },
    defaultMaintenancePolicy: "AUTO",
    capabilities: ["RESIDENTIAL_HOUSING"],
    storageCapacity: { food: 500 },
  },
  {
    id: "bld_field_hospital",
    name: "Bệnh Viện Quân Dân Y Sol",
    type: "MEDICAL",
    class: "MEDIUM",
    description: "Cơ sở y tế điều trị thương binh và phục hồi tâm lý phi công sống sót.",
    baseCost: { industrialMaterials: 400, energy: 250, logisticsSupplies: 100 },
    buildDurationGameDays: 3,
    maxHp: 2500,
    initialCondition: 2500,
    workforceDemands: { minimumPersonnel: 50, targetPersonnel: 100, maximumPersonnel: 150, priority: 95 },
    defaultMaintenancePolicy: "AUTO",
    capabilities: ["TRAUMA_TREATMENT", "PILOT_RECOVERY"],
    effects: [{ id: "eff_med_heal", name: "Hồi phục sức khỏe", scope: "BASE", targetMetric: "recoverySpeedPct", modifierType: "PERCENT", value: 20 }],
  },
  {
    id: "bld_hydroponic_farm",
    name: "Nông Trang Thủy Canh Helios",
    type: "AGRICULTURE",
    class: "LIGHT",
    description: "Sản xuất lương thực dinh dưỡng cao từ năng lượng và vi sinh.",
    baseCost: { industrialMaterials: 250, energy: 200 },
    buildDurationGameDays: 2,
    maxHp: 1800,
    initialCondition: 1800,
    workforceDemands: { minimumPersonnel: 30, targetPersonnel: 60, maximumPersonnel: 100, priority: 75 },
    defaultMaintenancePolicy: "AUTO",
    capabilities: ["FOOD_PRODUCTION"],
    productionRecipeIds: ["recipe_food_synthesis"],
  },
  {
    id: "bld_heavy_fabricator",
    name: "Xưởng Luyện Kim & Chế Tạo Nặng",
    type: "INDUSTRY",
    class: "HEAVY",
    description: "Chế luyện quặng thô thành Hợp kim Titan và linh kiện máy bay.",
    baseCost: { industrialMaterials: 600, energy: 400, logisticsSupplies: 200 },
    buildDurationGameDays: 4,
    maxHp: 4000,
    initialCondition: 4000,
    workforceDemands: { minimumPersonnel: 80, targetPersonnel: 150, maximumPersonnel: 250, priority: 70 },
    defaultMaintenancePolicy: "AUTO",
    capabilities: ["HEAVY_MANUFACTURING"],
    productionRecipeIds: ["recipe_alloys_smelting"],
  },
  {
    id: "bld_strategic_vault",
    name: "Kho Dự Trữ Chiến Lược",
    type: "STORAGE",
    class: "HEAVY",
    description: "Hầm chứa ngầm gia cố chịu bom đạn, tăng dung tích kho toàn căn cứ.",
    baseCost: { industrialMaterials: 500, energy: 100 },
    buildDurationGameDays: 3,
    maxHp: 5000,
    initialCondition: 5000,
    workforceDemands: { minimumPersonnel: 15, targetPersonnel: 30, maximumPersonnel: 50, priority: 60 },
    defaultMaintenancePolicy: "AUTO",
    capabilities: ["MASS_STORAGE"],
    storageCapacity: { industrialMaterials: 2000, energy: 2000, logisticsSupplies: 1000, food: 3000 },
  },
  {
    id: "bld_cargo_depot",
    name: "Trạm Tiếp Vận Đoàn Xe Hậu Cần",
    type: "LOGISTICS",
    class: "MEDIUM",
    description: "Điều phối đoàn xe tiếp tế liên khu vực và chuẩn bị vật tư vận tải.",
    baseCost: { industrialMaterials: 350, energy: 150, logisticsSupplies: 150 },
    buildDurationGameDays: 2,
    maxHp: 2200,
    initialCondition: 2200,
    workforceDemands: { minimumPersonnel: 40, targetPersonnel: 80, maximumPersonnel: 120, priority: 85 },
    defaultMaintenancePolicy: "AUTO",
    capabilities: ["SUPPLY_DISTRIBUTION"],
    productionRecipeIds: ["recipe_fuel_refining"],
  },
  {
    id: "bld_tech_lab",
    name: "Viện Nghiên Cứu Lượng Tử Sol",
    type: "RESEARCH",
    class: "ADVANCED",
    description: "Phát triển công nghệ radar, tinh chỉnh vũ khí và giải mã dữ liệu Void.",
    baseCost: { industrialMaterials: 450, energy: 350, tacticalData: 200 },
    buildDurationGameDays: 4,
    maxHp: 2000,
    initialCondition: 2000,
    workforceDemands: { minimumPersonnel: 50, targetPersonnel: 100, maximumPersonnel: 160, priority: 90 },
    defaultMaintenancePolicy: "AUTO",
    capabilities: ["TECH_RESEARCH"],
    productionRecipeIds: ["recipe_tactical_data_compilation"],
  },
  {
    id: "bld_central_bank",
    name: "Kho Bạc & Ngân Hàng Liên Minh",
    type: "FINANCE",
    class: "MEDIUM",
    description: "Điều phối tín dụng chiến dịch, cân đối ngân sách và thu thuế định kỳ.",
    baseCost: { industrialMaterials: 300, energy: 200 },
    buildDurationGameDays: 3,
    maxHp: 2500,
    initialCondition: 2500,
    workforceDemands: { minimumPersonnel: 30, targetPersonnel: 60, maximumPersonnel: 90, priority: 65 },
    defaultMaintenancePolicy: "AUTO",
    capabilities: ["FINANCIAL_CLEARING"],
  },
  {
    id: "bld_morale_hub",
    name: "Quảng Trường Văn Hóa & Phục Hồi",
    type: "ENTERTAINMENT",
    class: "LIGHT",
    description: "Tăng độ ổn định xã hội, giảm căng thẳng chiến tranh cho cư dân.",
    baseCost: { industrialMaterials: 200, energy: 100, food: 100 },
    buildDurationGameDays: 2,
    maxHp: 1500,
    initialCondition: 1500,
    workforceDemands: { minimumPersonnel: 20, targetPersonnel: 40, maximumPersonnel: 60, priority: 50 },
    defaultMaintenancePolicy: "MANUAL",
    capabilities: ["STABILITY_BOOST"],
    effects: [{ id: "eff_ent_stab", name: "Cải thiện ổn định", scope: "BASE", targetMetric: "stabilityBonus", modifierType: "FLAT", value: 5 }],
  },
  {
    id: "bld_sub_power_station",
    name: "Lò Phản Ứng Plasma Phụ Trợ",
    type: "SUPPORT",
    class: "MEDIUM",
    description: "Trạm điện bổ sung năng lượng vận hành khiên chắn và phân xưởng.",
    baseCost: { industrialMaterials: 350, energy: 100 },
    buildDurationGameDays: 2,
    maxHp: 2800,
    initialCondition: 2800,
    workforceDemands: { minimumPersonnel: 25, targetPersonnel: 50, maximumPersonnel: 75, priority: 88 },
    defaultMaintenancePolicy: "AUTO",
    capabilities: ["POWER_GENERATION"],
  },
  {
    id: "bld_command_center",
    name: "Trung Tâm Chỉ Huy Tác Chiến",
    type: "COMMAND",
    class: "CORE_FACILITY",
    description: "Bộ chỉ huy tối cao của Căn cứ, quản lý mọi hệ thống và slot công trình.",
    isCoreFacility: true,
    baseCost: { industrialMaterials: 1000, energy: 800, tacticalData: 500 },
    buildDurationGameDays: 5,
    maxHp: 10000,
    initialCondition: 10000,
    workforceDemands: { minimumPersonnel: 100, targetPersonnel: 200, maximumPersonnel: 300, priority: 100 },
    defaultMaintenancePolicy: "AUTO",
    capabilities: ["BASE_ADMINISTRATION", "SECTOR_COMMAND"],
  },
  {
    id: "bld_fortress_bastion",
    name: "Pháo Đài Công Sự Kiên Cố",
    type: "DEFENSE",
    class: "HEAVY",
    description: "Tường thành kiên cố và trận địa pháo tăng mức phòng thủ khu vực.",
    baseCost: { industrialMaterials: 700, energy: 300 },
    buildDurationGameDays: 4,
    maxHp: 8000,
    initialCondition: 8000,
    workforceDemands: { minimumPersonnel: 60, targetPersonnel: 120, maximumPersonnel: 180, priority: 92 },
    defaultMaintenancePolicy: "EMERGENCY",
    capabilities: ["FORTIFICATION", "SIEGE_RESISTANCE"],
  },
  {
    id: "bld_missile_battery",
    name: "Trận Địa Tên Lửa Phòng Không",
    type: "OFFENSE",
    class: "HEAVY",
    description: "Hệ thống ống phóng hỏa tiễn tầm xa tiêu diệt tàu tuần tra đối phương.",
    baseCost: { industrialMaterials: 650, energy: 350, logisticsSupplies: 150 },
    buildDurationGameDays: 3,
    maxHp: 4500,
    initialCondition: 4500,
    workforceDemands: { minimumPersonnel: 50, targetPersonnel: 100, maximumPersonnel: 150, priority: 85 },
    defaultMaintenancePolicy: "AUTO",
    capabilities: ["TACTICAL_STRIKE"],
  },
  {
    id: "bld_garrison_barracks",
    name: "Doanh Trại Lực Lượng Đồn Trú",
    type: "MILITARY",
    class: "MEDIUM",
    description: "Cơ sở sinh hoạt và đồn trú của binh sĩ chính quy VSS.",
    baseCost: { industrialMaterials: 400, energy: 200, food: 300 },
    buildDurationGameDays: 2,
    maxHp: 3500,
    initialCondition: 3500,
    workforceDemands: { minimumPersonnel: 40, targetPersonnel: 80, maximumPersonnel: 120, priority: 82 },
    defaultMaintenancePolicy: "AUTO",
    capabilities: ["GARRISON_HOUSING"],
  },
  {
    id: "bld_orbital_spaceport",
    name: "Cảng Hàng Không Vũ Trụ Quỹ Đạo",
    type: "SPACEPORT",
    class: "ADVANCED",
    description: "Đón nhận tàu vận tải cỡ lớn và xuất khẩu tài nguyên liên khu vực.",
    baseCost: { industrialMaterials: 800, energy: 500, logisticsSupplies: 300 },
    buildDurationGameDays: 5,
    maxHp: 6000,
    initialCondition: 6000,
    workforceDemands: { minimumPersonnel: 70, targetPersonnel: 140, maximumPersonnel: 220, priority: 84 },
    defaultMaintenancePolicy: "AUTO",
    capabilities: ["INTERSTELLAR_DOCKING"],
  },
  {
    id: "bld_orbital_cannon",
    name: "Pháo Quỹ Đạo Phản Đòn",
    type: "ORBITAL_DEFENSE",
    class: "ORBITAL_OUTPOST",
    description: "Khẩu pháo siêu trường đặt trên quỹ đạo, bắn hạ tàu chiến Void tiếp cận.",
    baseCost: { industrialMaterials: 900, energy: 600, tacticalData: 300 },
    buildDurationGameDays: 5,
    maxHp: 5000,
    initialCondition: 5000,
    workforceDemands: { minimumPersonnel: 40, targetPersonnel: 80, maximumPersonnel: 120, priority: 89 },
    defaultMaintenancePolicy: "AUTO",
    capabilities: ["ORBITAL_INTERCEPTION"],
  },
  {
    id: "bld_guild_hall",
    name: "Tổng Bộ Hiệp Hội Bang Hội",
    type: "GUILD",
    class: "MEDIUM",
    description: "Đại bản doanh điều phối hợp đồng tác chiến và liên minh hạm đội độc lập.",
    baseCost: { industrialMaterials: 350, energy: 200 },
    buildDurationGameDays: 3,
    maxHp: 3000,
    initialCondition: 3000,
    workforceDemands: { minimumPersonnel: 25, targetPersonnel: 50, maximumPersonnel: 75, priority: 62 },
    defaultMaintenancePolicy: "MANUAL",
    capabilities: ["GUILD_MANAGEMENT"],
  },
  {
    id: "bld_sar_station",
    name: "Trạm Tìm Kiếm Cứu Nạn Khẩn Cấp",
    type: "RESCUE",
    class: "MEDIUM",
    description: "Bến đậu tàu cứu nạn, radar trinh sát định vị tín hiệu phi công rơi.",
    baseCost: { industrialMaterials: 400, energy: 300, logisticsSupplies: 150 },
    buildDurationGameDays: 3,
    maxHp: 3000,
    initialCondition: 3000,
    workforceDemands: { minimumPersonnel: 30, targetPersonnel: 60, maximumPersonnel: 100, priority: 96 },
    defaultMaintenancePolicy: "AUTO",
    capabilities: ["SAR_DISPATCH", "CRASH_BEACON_TRACKING"],
    effects: [{ id: "eff_sar_bonus", name: "Tăng tốc cứu nạn", scope: "NETWORK", targetMetric: "sarSuccessRatePct", modifierType: "PERCENT", value: 15 }],
  },
  {
    id: "bld_modular_facility",
    name: "Khu Hạ Tầng Tiêu Chuẩn Đa Năng",
    type: "GENERIC",
    class: "LIGHT",
    description: "Khung nhà xưởng tiêu chuẩn có thể gắn linh hoạt các module chức năng.",
    baseCost: { industrialMaterials: 200, energy: 100 },
    buildDurationGameDays: 1,
    maxHp: 1500,
    initialCondition: 1500,
    workforceDemands: { minimumPersonnel: 10, targetPersonnel: 20, maximumPersonnel: 30, priority: 40 },
    defaultMaintenancePolicy: "MANUAL",
    capabilities: ["FLEXIBLE_EXPANSION"],
  },
]

/**
 * Reusable Slot Profiles (Slot Growth & MAX TIER BONUS)
 */
export const SYSTEM_DEFAULT_SLOT_PROFILES: SlotProfile[] = [
  {
    id: "slot_profile_border_outpost",
    name: "Cấu Hình Slot Đồn Trú Tiền Tiêu (Border Outpost)",
    description: "Cấu hình chuẩn cho đồn tiền tiêu: MK IX = 15; MK X = 16 + 1 (MAX BONUS) = 17 slots.",
    baseTypedSlots: { DEFENSE: 2, LOGISTICS: 1 },
    baseGenericSlots: 6,
    growthPerTierGeneric: 1,
    maxTierStepBonusGeneric: 1, // MK X Bonus: +1 extra generic slot
  },
  {
    id: "slot_profile_orbital_subbase",
    name: "Cấu Hình Slot Trạm Vệ Tinh Quỹ Đạo (Orbital Sub-Base)",
    description: "MK I = 3; MK III = 4; MK V = 5; MK VII = 6; MK IX = 7; MK X = 8 (bao gồm MAX TIER BONUS).",
    baseTypedSlots: { ORBITAL_DEFENSE: 1 },
    baseGenericSlots: 2, // Tier 1: 1 typed + 2 generic = 3 slots
    growthPerTierGeneric: 0.5, // T1:2, T3:3, T5:4, T7:5, T9:6 -> T10: 6.5 -> round to 7 + 1 bonus = 8 slots
    maxTierStepBonusGeneric: 1,
  },
  {
    id: "slot_profile_capital_citadel",
    name: "Cấu Hình Slot Thủ Phủ Tối Cao (Capital Citadel)",
    description: "Thủ phủ có quy mô vượt trội, mở khóa nhiều khe cắm hỗ trợ hạm đội liên minh.",
    baseTypedSlots: { COMMAND: 2, DEFENSE: 3, SPACEPORT: 2, STORAGE: 2 },
    baseGenericSlots: 8,
    growthPerTierGeneric: 1.5,
    maxTierStepBonusGeneric: 2,
  },
  {
    id: "slot_profile_standard_building",
    name: "Cấu Hình Khe Cắm Module Công Trình Tiêu Chuẩn",
    description: "Khe cắm dành cho bản thân từng công trình (lắp đặt module nâng cấp).",
    baseTypedSlots: {},
    baseGenericSlots: 2,
    growthPerTierGeneric: 0.5,
    maxTierStepBonusGeneric: 1,
  },
]

/**
 * Module Definitions (Equipment Modules & System Capabilities)
 */
export const SYSTEM_DEFAULT_MODULES: BuildingModuleDefinition[] = [
  {
    id: "mod_plasma_turret",
    name: "Tháp Pháo Plasma Hạng Nặng",
    slotType: "DEFENSE",
    description: "Gia tăng sát thương phòng thủ căn cứ khi bị kẻ địch tấn công.",
    isDetachable: true,
    statModifiers: { defensePower: 300 },
    powerConsumption: 50,
  },
  {
    id: "mod_expanded_bunkers",
    name: "Khoang Hầm Trú Ẩn Mở Rộng",
    slotType: "GENERIC",
    description: "Gia tăng sức chứa cư dân khẩn cấp thêm 500 người.",
    isDetachable: true,
    statModifiers: { emergencyCapacity: 500 },
    powerConsumption: 20,
  },
  {
    id: "mod_automated_assembly",
    name: "Dây Chuyền Tự Động Hóa AI",
    slotType: "PRODUCTION_LINE",
    description: "Tăng 15% hiệu suất tác chế sản phẩm công nghiệp.",
    isDetachable: true,
    statModifiers: { operationalEfficiencyPct: 15 },
    powerConsumption: 40,
  },
  {
    id: "cap_deep_core_drill",
    name: "Năng Lực Khoan Địa Tầng Sâu",
    slotType: "GENERIC",
    description: "Khả năng kỹ thuật lõi tích hợp, không thể tháo rời.",
    isDetachable: false,
    capabilities: ["DEEP_CORE_MINING"],
  },
]

/**
 * Production Recipes
 */
export const SYSTEM_DEFAULT_PRODUCTION_RECIPES: ProductionRecipe[] = [
  {
    id: "recipe_alloys_smelting",
    name: "Chế Luyện Hợp Kim Cường Lực",
    description: "Tiêu hao 100 quặng công nghiệp và 50 năng lượng để tạo 80 Hợp kim hoàn thiện.",
    inputs: { industrialMaterials: 100, energy: 50 },
    outputs: { industrialMaterials: 80, logisticsSupplies: 20 },
    cycleDays: 2,
    requiredCapability: "HEAVY_MANUFACTURING",
  },
  {
    id: "recipe_food_synthesis",
    name: "Tổng Hợp Lương Thực Đậm Đặc",
    description: "Tiêu hao 40 năng lượng để tạo ra 100 phần lương thực tiêu chuẩn.",
    inputs: { energy: 40 },
    outputs: { food: 100 },
    cycleDays: 1,
    requiredCapability: "FOOD_PRODUCTION",
  },
  {
    id: "recipe_fuel_refining",
    name: "Tinh Chế Nhiên Liệu Vận Tải",
    description: "Sản xuất vật tư hậu cần phục vụ di chuyển và tiếp tế hạm đội.",
    inputs: { industrialMaterials: 50, energy: 80 },
    outputs: { logisticsSupplies: 70 },
    cycleDays: 2,
    requiredCapability: "SUPPLY_DISTRIBUTION",
  },
  {
    id: "recipe_tactical_data_compilation",
    name: "Tổng Hợp Ma Trận Dữ Liệu Tác Chiến",
    description: "Phân tích tín hiệu chiến trường tạo ra dữ liệu chiến thuật.",
    inputs: { energy: 100 },
    outputs: { tacticalData: 50 },
    cycleDays: 3,
    requiredCapability: "TECH_RESEARCH",
  },
]

/**
 * Base Init Profiles for World Generation
 */
export const SYSTEM_DEFAULT_BASE_INIT_PROFILES = [
  {
    id: "base_init_capital",
    name: "Thủ Phủ Căn Cứ Liên Minh VSS",
    baseType: "CAPITAL",
    tier: 1,
    slotProfileId: "slot_profile_capital_citadel",
    coreBuildingDefinitions: [
      "bld_command_center",
      "bld_strategic_vault",
      "bld_field_hospital",
      "bld_sub_power_station",
      "bld_sar_station",
    ],
    initialExpansionSlots: 8,
    initialSharedStorage: {
      industrialMaterials: 1000,
      energy: 800,
      logisticsSupplies: 600,
      tacticalData: 400,
      food: 1500,
    },
    storageCapacity: {
      industrialMaterials: 5000,
      energy: 5000,
      logisticsSupplies: 3000,
      tacticalData: 2000,
      food: 8000,
    },
  },
  {
    id: "base_init_border_post",
    name: "Tiền Tiêu Vành Đai Phòng Thủ",
    baseType: "DEFENSE",
    tier: 1,
    slotProfileId: "slot_profile_border_outpost",
    coreBuildingDefinitions: [
      "bld_command_center",
      "bld_fortress_bastion",
      "bld_garrison_barracks",
      "bld_sub_power_station",
    ],
    initialExpansionSlots: 6,
    initialSharedStorage: {
      industrialMaterials: 500,
      energy: 400,
      logisticsSupplies: 300,
      tacticalData: 100,
      food: 800,
    },
    storageCapacity: {
      industrialMaterials: 2000,
      energy: 2000,
      logisticsSupplies: 1500,
      tacticalData: 1000,
      food: 3000,
    },
  },
  {
    id: "base_init_mining_colony",
    name: "Khu Khai Khoáng & Luyện Kim",
    baseType: "GENERAL",
    tier: 1,
    slotProfileId: "slot_profile_border_outpost",
    coreBuildingDefinitions: [
      "bld_command_center",
      "bld_heavy_fabricator",
      "bld_cargo_depot",
      "bld_sub_power_station",
    ],
    initialExpansionSlots: 6,
    initialSharedStorage: {
      industrialMaterials: 600,
      energy: 200,
      logisticsSupplies: 150,
      tacticalData: 50,
      food: 500,
    },
    storageCapacity: {
      industrialMaterials: 3000,
      energy: 1500,
      logisticsSupplies: 1000,
      tacticalData: 500,
      food: 2000,
    },
  },
]

/**
 * Node Files mapping for Catalog Registry
 */
export const SYSTEM_BUILDING_CATALOG_FILES: Record<string, CatalogNodeFile> = {
  "system_building_building_type_data.json": {
    configFileId: "system_building_building_type",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_BUILDING_TYPES,
    metadata: { domain: "building", catalog: "building_type", description: "Canonical 19 building types." },
  },
  "system_building_building_class_data.json": {
    configFileId: "system_building_building_class",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_BUILDING_CLASSES,
    metadata: { domain: "building", catalog: "building_class", description: "Canonical building classes." },
  },
  "system_building_building_definition_data.json": {
    configFileId: "system_building_building_definition",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_BUILDING_DEFINITIONS,
    metadata: { domain: "building", catalog: "building_definition", description: "Canonical building definitions." },
  },
  "system_building_slot_profile_data.json": {
    configFileId: "system_building_slot_profile",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_SLOT_PROFILES,
    metadata: { domain: "building", catalog: "slot_profile", description: "Canonical slot growth profiles." },
  },
  "system_building_module_definition_data.json": {
    configFileId: "system_building_module_definition",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_MODULES,
    metadata: { domain: "building", catalog: "module_definition", description: "Canonical module definitions." },
  },
  "system_building_production_recipe_data.json": {
    configFileId: "system_building_production_recipe",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_PRODUCTION_RECIPES,
    metadata: { domain: "building", catalog: "production_recipe", description: "Canonical production recipes." },
  },
  "system_building_base_init_profile_data.json": {
    configFileId: "system_building_base_init_profile",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_BASE_INIT_PROFILES,
    metadata: { domain: "building", catalog: "base_init_profile", description: "Canonical base init profiles." },
  },
}
