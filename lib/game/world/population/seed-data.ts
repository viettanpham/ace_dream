/**
 * STARFRONT WORLD — Canonical SYSTEM Default Seed Data (Phase 6.34A-FND-4)
 *
 * Master catalog seed data for Population Buckets, Workforce Categories,
 * Allocation Policies, Capacity Policies, and Movement Reasons.
 */

import type { CatalogNodeFile } from "../catalog/types"

export const SYSTEM_DEFAULT_POPULATION_BUCKETS = [
  {
    id: "RESIDENT",
    name: "Cư Dân Thường Trú",
    description: "Công dân đăng ký hộ tịch và cư trú lâu dài tại căn cứ.",
    isPermanent: true,
  },
  {
    id: "VISITOR_TOURIST",
    name: "Khách Du Lịch / Khách Vãng Lai",
    description: "Du khách, thương nhân hoặc người ghé thăm tạm thời.",
    isPermanent: false,
  },
  {
    id: "EXTERNAL_WORKER",
    name: "Chuyên Gia / Nhân Công Ngoại Tỉnh",
    description: "Lao động có hợp đồng ngắn hạn, không đăng ký hộ khẩu thường trú.",
    isPermanent: false,
  },
  {
    id: "IN_TRANSIT",
    name: "Người Đang Di Chuyển",
    description: "Nhân sự hoặc người dân đang di chuyển giữa các căn cứ theo sổ cái quốc gia.",
    isPermanent: false,
  },
]

export const SYSTEM_DEFAULT_WORKFORCE_CATEGORIES = [
  {
    id: "BUILDING_WORKFORCE",
    name: "Công Trình / Cơ Sở Căn Cứ",
    description: "Nhân lực vận hành các phân xưởng, nhà máy, bệnh viện và công sự.",
  },
  {
    id: "FLEET_CREW",
    name: "Thủy Thủ Đoàn Hạm Đội / Bang Hội",
    description: "Thủy thủ và sĩ quan phục vụ trên tàu chiến và chiến đoàn.",
  },
  {
    id: "LOGISTICS",
    name: "Vận Tải & Hậu Cần",
    description: "Đội ngũ điều phối đoàn xe và luồng tiếp vận vật tư.",
  },
  {
    id: "TRAINING",
    name: "Học Viên Đang Đào Tạo",
    description: "Tân binh hoặc nhân sự đang nâng cao trình độ chuyên môn.",
  },
  {
    id: "RECOVERY",
    name: "Hồi Phục Y Tế",
    description: "Thương binh hoặc nhân sự đang điều trị bệnh tật.",
  },
  {
    id: "OTHER_ASSIGNMENTS",
    name: "Phân Công Khác",
    description: "Nhiệm vụ đột xuất, an ninh nội vụ hoặc dự phòng.",
  },
]

export const SYSTEM_DEFAULT_ALLOCATION_POLICIES = [
  {
    id: "policy_standard_three_pass",
    name: "Phân Bổ Tiêu Chuẩn Ba Vòng",
    description: "Vòng 1: Cấp Minimum theo độ ưu tiên. Vòng 2: Cấp delta lên Target. Vòng 3: Cấp delta lên Maximum.",
    enforceMinimumPrerequisite: true,
    allowProportionalSplit: false,
    defaultMinimumOperatingThreshold: 1.0,
  },
]

export const SYSTEM_DEFAULT_CAPACITY_POLICIES = [
  {
    id: "policy_standard_base_capacity",
    name: "Chính Sách Sức Chứa Căn Cứ Tiêu Chuẩn",
    description: "Định mức sức chứa 4 nhóm: Nhà ở, Du khách, Lao động tạm, và Tiếp nhận khẩn cấp.",
    defaultEmergencyOverflowLimitRatio: 1.25,
    allowEmergencyOverflow: true,
  },
]

export const SYSTEM_DEFAULT_MOVEMENT_REASONS = [
  { id: "MIGRATION", name: "Di Cư Dân Sự", description: "Di cư định cư lâu dài sang căn cứ mới." },
  { id: "WORKFORCE_TRANSFER", name: "Điều Động Nhân Lực", description: "Điều chuyển nhân sự chuyên môn phục vụ sản xuất." },
  { id: "EVACUATION", name: "Sơ Tán Chiến Tranh", description: "Sơ tán khẩn cấp tránh vùng bị tấn công." },
  { id: "HQ_RELOCATION", name: "Di Chuyển Trụ Sở Hạm Đội", description: "Hạm đội hoặc Bang hội chuyển trụ sở sang căn cứ khác." },
  { id: "EXTERNAL_IMMIGRATION", name: "Nhập Cư Từ Vùng Ngoài", description: "Tiếp nhận người tị nạn hoặc dân nhập cư mới." },
]

export const SYSTEM_POPULATION_CATALOG_FILES: Record<string, CatalogNodeFile> = {
  "system_population_population_bucket_data.json": {
    configFileId: "system_population_population_bucket",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_POPULATION_BUCKETS,
    metadata: {
      domain: "population",
      catalog: "population_bucket",
      description: "Canonical population bucket definitions.",
    },
  },
  "system_population_workforce_category_data.json": {
    configFileId: "system_population_workforce_category",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_WORKFORCE_CATEGORIES,
    metadata: {
      domain: "population",
      catalog: "workforce_category",
      description: "Canonical workforce category definitions.",
    },
  },
  "system_population_workforce_allocation_policy_data.json": {
    configFileId: "system_population_workforce_allocation_policy",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_ALLOCATION_POLICIES,
    metadata: {
      domain: "population",
      catalog: "workforce_allocation_policy",
      description: "Canonical workforce allocation policy definitions.",
    },
  },
  "system_population_capacity_policy_data.json": {
    configFileId: "system_population_capacity_policy",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_CAPACITY_POLICIES,
    metadata: {
      domain: "population",
      catalog: "capacity_policy",
      description: "Canonical capacity policy definitions.",
    },
  },
  "system_population_movement_reason_data.json": {
    configFileId: "system_population_movement_reason",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_MOVEMENT_REASONS,
    metadata: {
      domain: "population",
      catalog: "movement_reason",
      description: "Canonical population movement reason definitions.",
    },
  },
}
