# STARFRONT WORLD — FND-7 DATA DICTIONARY & CATALOG SCHEMAS
## TỪ ĐIỂN DỮ LIỆU & LƯỢC ĐỒ DANH MỤC HẠM ĐỘI / TÀU CHIẾN

> **Mã thiết kế:** FND-7-DATA  
> **Trạng thái:** DRAFT ARCHITECTURAL CONTRACTS (Sẵn sàng cho Phase Triển Khai)  
> **Tương thích:** FND-1 (Catalog Registry), FND-2 (Progression MK I–X), FND-4 (Workforce), FND-5 (Modules), FND-6 (Base Ports)  
> **Định dạng lưu trữ:** Canonical JSON tại `/data/catalogs/system_fleet_*_data.json`  

---

### MỤC LỤC

1. [Mô Hình Kiến Trúc Dữ Liệu 4 Tầng](#1-mô-hình-kiến-trúc-dữ-liệu-4-tầng)
2. [Từ Điển Dữ Liệu TypeScript (Domain Contracts)](#2-từ-điển-dữ-liệu-typescript-domain-contracts)
   - [2.1 Hợp đồng Dữ liệu Hạm đội (Fleet Entities)](#21-hợp-đồng-dữ-liệu-hạm-đội-fleet-entities)
   - [2.2 Hợp đồng Dữ liệu Tàu chiến (Ship Entities)](#22-hợp-đồng-dữ-liệu-tàu-chiến-ship-entities)
   - [2.3 Hợp đồng Sổ cái FRAME & Ngân khố (FRAME & Treasury Ledgers)](#23-hợp-đồng-sổ-cái-frame--ngân-khố-frame--treasury-ledgers)
3. [Đặc Tả 7 Danh Mục Canonical Master Catalog (JSON Schemas)](#3-đặc-tả-7-danh-mục-canonical-master-catalog-json-schemas)
   - [Catalog 1: system_fleet_fleet_type_data.json](#catalog-1-system_fleet_fleet_type_datajson)
   - [Catalog 2: system_fleet_fleet_class_data.json](#catalog-2-system_fleet_fleet_class_datajson)
   - [Catalog 3: system_fleet_ship_type_data.json](#catalog-3-system_fleet_ship_type_datajson)
   - [Catalog 4: system_fleet_ship_class_data.json](#catalog-4-system_fleet_ship_class_datajson)
   - [Catalog 5: system_fleet_ship_definition_data.json](#catalog-5-system_fleet_ship_definition_datajson)
   - [Catalog 6: system_fleet_policy_profile_data.json](#catalog-6-system_fleet_policy_profile_datajson)
   - [Catalog 7: system_fleet_frame_award_catalog_data.json](#catalog-7-system_fleet_frame_award_catalog_datajson)
4. [Bảng Ma Trận Khóa Ngoại & Tính Toàn Vẹn Tham Chiếu (Referential Integrity)](#4-bảng-ma-trận-khóa-ngoại--tính-toàn-vẹn-tham-chiếu-referential-integrity)

---

### 1. MÔ HÌNH KIẾN TRÚC DỮ LIỆU 4 TẦNG

Theo nguyên lý FND-1, toàn bộ dữ liệu tàu chiến và hạm đội được phân tầng nghiêm ngặt:

```
[ TẦNG 1: TYPE ] (Nhóm chức năng chiến lược vĩ mô)
       │
       ▼
[ TẦNG 2: CLASS ] (Phân cấp kích cỡ, tải trọng & bậc tiến trình MK I - MK X)
       │
       ▼
[ TẦNG 3: DEFINITION ] (Bản thiết kế chuẩn tắc - Master Catalog, Bất biến)
       │
       ▼
[ TẦNG 4: INSTANCE ] (Thực thể cụ thể vận hành trong runtime thế giới, mang ID riêng)
```

- **Tính kinh tế của bộ nhớ**: 1000 con tàu tuần dương cùng loại `CRUISER_AEGIS_MK2` chỉ sử dụng duy nhất 1 bản ghi `ShipDefinition` trong bộ nhớ tĩnh, mỗi `ShipInstance` chỉ lưu các delta biến thiên (HP hiện tại, module gắn thêm, cấp sao, dặm bay, phi công biên chế).

---

### 2. TỪ ĐIỂN DỮ LIỆU TYPESCRIPT (DOMAIN CONTRACTS)

#### 2.1 Hợp đồng Dữ liệu Hạm đội (Fleet Entities)

```typescript
import type { ProgressionEntity } from "../progression/types"
import type { WorldResourceLedger } from "../types"
import type { FleetCrewPool } from "../population/types"

/**
 * Định danh Chủ quyền Hạm đội
 */
export type FleetOwnerType = "NATIONAL" | "GUILD" | "PRIVATE_NPC" | "PLAYER"

export interface FleetOwnerRef {
  ownerType: FleetOwnerType
  ownerId: string
  ownerName: string
  factionId: string // e.g. "vss"
}

/**
 * Vị trí không gian của Hạm đội
 */
export interface FleetLocationState {
  sectorId: string
  baseId?: string // Có mặt tại Căn cứ nếu đang DOCKED hoặc STATIONED
  isDockedAtBase: boolean
  dockPortId?: string
  inTransitRouteId?: string
  inTransitProgressDays?: number
  inTransitTotalDays?: number
}

/**
 * Tính cách & Chiến lược vận hành tự động của Hạm đội AI
 */
export type FleetAIPersona =
  | "AGGRESSIVE_VANGUARD"
  | "STEADFAST_DEFENDER"
  | "RESOURCE_EXPEDITION"
  | "TACTICAL_RECON"
  | "COMMERCIAL_ESCORT"

/**
 * Trạng thái vòng đời chính danh của Hạm đội
 */
export type FleetLifecycleState = "FORMATION" | "ACTIVE" | "REORGANIZATION" | "DISBANDED"

/**
 * Trạng thái sẵn sàng tác chiến / hoạt động hàng ngày
 */
export type FleetOperationalStatus =
  | "DOCKED"
  | "STATIONED"
  | "IN_TRANSIT"
  | "PATROL"
  | "ENGAGED"
  | "MAINTENANCE"
  | "REORGANIZING"
  | "DISBANDED"

/**
 * Thực thể Hạm đội hoàn chỉnh trong World State
 */
export interface FleetEntityState {
  fleetId: string
  fleetName: string
  callsign: string
  typeId: string // Khóa ngoại trỏ sang system_fleet_fleet_type_data
  classId: string // Khóa ngoại trỏ sang system_fleet_fleet_class_data
  lifecycle: FleetLifecycleState
  status: FleetOperationalStatus
  
  // Quyền sở hữu & Đóng quân độc lập
  ownerRef: FleetOwnerRef
  registeredHomeBaseId: string
  location: FleetLocationState
  
  // Chỉ huy & Ban tham mưu
  flagshipShipId?: string
  captainPilotId?: string
  executiveOfficerPilotId?: string
  persona: FleetAIPersona
  morale: number // Thang điểm [0..100]
  
  // Tài sản nội tại sở hữu
  ships: Record<string, ShipInstance>
  gears: Record<string, any> // Tương thích GEAR V1
  crewPool: FleetCrewPool // Tích hợp FND-4 FleetCrewPool
  cargo: WorldResourceLedger // Hậu cần kho hàng
  treasury: FleetTreasuryState // Ngân khố độc lập
  frameState: FleetFrameState // Sổ cái FRAME 3 số dư
  
  // Tiến trình FND-2 Progression
  progression: ProgressionEntity
  
  // Sổ vàng thành tích
  serviceLog: FleetServiceLog
  
  // Metadata & Timestamps
  commissionedGameDay: number
  lastMaintenanceGameDay: number
  lastReportGameDay: number
  activeModifiers?: Record<string, any> // ví dụ: NEW_GUILD_PROTECTION
}
```

#### 2.2 Hợp đồng Dữ liệu Tàu chiến (Ship Entities)

```typescript
/**
 * Trạng thái vật lý và vận hành của từng con tàu
 */
export type ShipOperationalStatus =
  | "OPERATIONAL"
  | "DAMAGED"
  | "CRITICAL_OFFLINE"
  | "DRYDOCK_REPAIR"
  | "DECOMMISSIONED"
  | "DESTROYED"

/**
 * Module gắn vào các slot chuyên dụng trên thân tàu
 */
export interface ShipInstalledModule {
  slotId: string
  slotType: "WEAPON" | "SHIELD" | "ENGINE" | "HANGAR" | "CARGO" | "UTILITY"
  moduleId: string // Khóa ngoại sang danh mục module FND-5
  condition: number // [0..100%]
  isOperational: boolean
}

/**
 * Thực thể Tàu chiến cụ thể (Ship Instance)
 */
export interface ShipInstance {
  instanceId: string
  definitionId: string // Khóa ngoại trỏ sang system_fleet_ship_definition_data
  customName?: string
  fleetId: string
  
  // Chỉ số sinh tồn & Trạng thái
  currentHp: number
  currentShield: number
  condition: number // Hao mòn [0.00..100.00%]
  status: ShipOperationalStatus
  
  // Phi hành đoàn & Phi công lái
  assignedPilotId?: string // Tinh anh lái kỳ hạm hoặc cơ trưởng
  assignedCrewCount: number // Thủy thủ đoàn vận hành tiêu chuẩn
  
  // Khí tài & Module
  installedModules: Record<string, ShipInstalledModule>
  
  // Tiến trình FND-2 Progression cá thể
  progression: ProgressionEntity
  
  // Nhật ký khai thác kỹ thuật
  mileageKm: number
  battlesCount: number
  killsCount: number
  commissionedGameDay: number
}
```

#### 2.3 Hợp đồng Sổ cái FRAME & Ngân khố (FRAME & Treasury Ledgers)

```typescript
/**
 * Bản ghi biến động điểm FRAME (Audit Ledger Entry)
 */
export interface FrameAuditEntry {
  entryId: string
  gameDay: number
  timestamp: string
  actionType: "MISSION_AWARD" | "COMBAT_HEROISM" | "STORE_REDEMPTION" | "ANNUAL_DECAY" | "PENALTY"
  deltaCycle: number
  deltaAvailable: number
  deltaTotal: number
  resultingCycle: number
  resultingAvailable: number
  resultingTotal: number
  reason: string
  authorizedBy: string
}

/**
 * Cấu trúc 3 Số dư FRAME hoàn chỉnh
 */
export interface FleetFrameState {
  cycleFrame: number // Điểm chu kỳ ngắn hạn
  availableFrame: number // Điểm khả dụng chi tiêu
  totalFrame: number // Điểm tích lũy dài hạn
  lastDecayGameDay: number // Lưu mốc chu kỳ 360 ngày để bảo đảm tính IDEMPOTENT
  totalSpentInStore: number
  totalPenaltiesDeducted: number
  auditTrail: FrameAuditEntry[]
}

/**
 * Ngân khố Hạm đội
 */
export interface FleetTreasuryState {
  credits: number
  supplyCredits: number
  subsidiesClaimedThisCycle: number // Đếm số lượt trợ cấp đã dùng trong kỳ
  lastSubsidyGameDay?: number
  lifetimeCreditsEarned: number
  lifetimeCreditsSpent: number
}

/**
 * Sổ vàng thành tích Hạm đội
 */
export interface FleetServiceLog {
  totalBattlesEngaged: number
  victoriesCount: number
  defeatsCount: number
  enemiesDestroyed: number
  threatSuppressedTotal: number
  pilotsRescuedTotal: number
  totalCasualtiesSustained: number
  citations: {
    citationId: string
    title: string
    awardedGameDay: number
    awardedBy: string
    description: string
  }[]
}
```

---

### 3. ĐẶC TẢ 7 DANH MỤC CANONICAL MASTER CATALOG (JSON SCHEMAS)

#### Catalog 1: `system_fleet_fleet_type_data.json`
- **Mục tiêu**: Định nghĩa các phân loại mục đích tác chiến chiến lược của Hạm đội.
- **Tập tin mẫu**:
```json
{
  "configFileId": "system_fleet_fleet_type",
  "schemaVersion": 1,
  "dataVersion": 1,
  "mode": "INLINE",
  "items": [
    {
      "id": "FLEET_TYPE_MILITARY_EXPEDITIONARY",
      "name": "Hạm Đội Viễn Chinh Tác Chiến",
      "description": "Chuyên trách tấn công thọc sâu, giải phóng các sector bị bao vây và tiêu diệt hạm đội địch.",
      "strategicRole": "OFFENSIVE",
      "baseSpeedMultiplier": 1.15,
      "baseMaintenanceCostMultiplier": 1.25,
      "defaultAIPersona": "AGGRESSIVE_VANGUARD",
      "compatibleShipTypes": ["BATTLESHIP", "CARRIER", "CRUISER", "DESTROYER"]
    },
    {
      "id": "FLEET_TYPE_HOME_DEFENSE",
      "name": "Hạm Đội Vệ Binh Thủ Phủ",
      "description": "Đóng giữ bảo vệ các căn cứ kinh tế then chốt, tối ưu hóa khả năng phòng ngự và lá chắn.",
      "strategicRole": "DEFENSIVE",
      "baseSpeedMultiplier": 0.90,
      "baseMaintenanceCostMultiplier": 0.85,
      "defaultAIPersona": "STEADFAST_DEFENDER",
      "compatibleShipTypes": ["BATTLESHIP", "CRUISER", "MONITOR", "MISSILE_FRIGATE"]
    },
    {
      "id": "FLEET_TYPE_SEARCH_AND_RESCUE",
      "name": "Hạm Đội Tìm Kiếm & Cứu Hộ SAR",
      "description": "Tốc độ hành quân cao, trang bị trạm y tế hồi sức dã chiến, chuyên cứu hộ phi công gặp nạn.",
      "strategicRole": "SUPPORT",
      "baseSpeedMultiplier": 1.30,
      "baseMaintenanceCostMultiplier": 0.95,
      "defaultAIPersona": "TACTICAL_RECON",
      "compatibleShipTypes": ["FAST_CORVETTE", "HOSPITAL_SHIP", "ESCORT_DESTROYER"]
    },
    {
      "id": "FLEET_TYPE_LOGISTICS_TRANSPORT",
      "name": "Hạm Đội Hộ Tống & Vận Tải Chiến Lược",
      "description": "Sức chứa khoang hàng cực lớn, đảm bảo tiếp vận lương thực và nhiên liệu thông suốt thiên hà.",
      "strategicRole": "LOGISTICS",
      "baseSpeedMultiplier": 0.85,
      "baseMaintenanceCostMultiplier": 0.80,
      "defaultAIPersona": "COMMERCIAL_ESCORT",
      "compatibleShipTypes": ["HEAVY_FREIGHTER", "FLEET_OILER", "ESCORT_FRIGATE"]
    }
  ]
}
```

#### Catalog 2: `system_fleet_fleet_class_data.json`
- **Mục tiêu**: Định nghĩa các bậc quy mô hạm đội theo FND-2 Progression MK I – MK X.
- **Tập tin mẫu**:
```json
{
  "configFileId": "system_fleet_fleet_class",
  "schemaVersion": 1,
  "dataVersion": 1,
  "mode": "INLINE",
  "items": [
    {
      "id": "FLEET_CLASS_MK1_SQUAD",
      "tierOrder": 1,
      "displayName": "Tiểu Đội Hạm Đội MK I (Squad)",
      "minLevel": 1,
      "maxLevel": 10,
      "maxShipCount": 4,
      "commandCapRequirement": 1,
      "minimumCommanderRank": "ENSIGN",
      "baseUpkeepCredits": 250,
      "levelMultiplier": 1.0
    },
    {
      "id": "FLEET_CLASS_MK2_FLOTILLA",
      "tierOrder": 2,
      "displayName": "Chi Hạm Đội MK II (Flotilla)",
      "minLevel": 11,
      "maxLevel": 20,
      "maxShipCount": 8,
      "commandCapRequirement": 2,
      "minimumCommanderRank": "LIEUTENANT",
      "baseUpkeepCredits": 650,
      "levelMultiplier": 1.5
    },
    {
      "id": "FLEET_CLASS_MK3_TASK_FORCE",
      "tierOrder": 3,
      "displayName": "Phân Hạm Đội Đặc Nhiệm MK III (Task Force)",
      "minLevel": 21,
      "maxLevel": 30,
      "maxShipCount": 16,
      "commandCapRequirement": 4,
      "minimumCommanderRank": "COMMANDER",
      "baseUpkeepCredits": 1600,
      "levelMultiplier": 2.0
    },
    {
      "id": "FLEET_CLASS_MK4_BATTLE_GROUP",
      "tierOrder": 4,
      "displayName": "Liên Đội Tác Chiến MK IV (Battle Group)",
      "minLevel": 31,
      "maxLevel": 40,
      "maxShipCount": 32,
      "commandCapRequirement": 8,
      "minimumCommanderRank": "COMMODORE",
      "baseUpkeepCredits": 3800,
      "levelMultiplier": 2.5
    },
    {
      "id": "FLEET_CLASS_MK5_ARMADA",
      "tierOrder": 5,
      "displayName": "Đại Hạm Đội Hùng Cường MK V (Armada)",
      "minLevel": 41,
      "maxLevel": 50,
      "maxShipCount": 64,
      "commandCapRequirement": 16,
      "minimumCommanderRank": "ADMIRAL",
      "baseUpkeepCredits": 9500,
      "levelMultiplier": 3.0,
      "hasMaxTierBonus": true
    }
  ]
}
```

#### Catalog 3: `system_fleet_ship_type_data.json`
- **Mục tiêu**: Phân loại vai trò chức năng của tàu chiến.
- **Tập tin mẫu**:
```json
{
  "configFileId": "system_fleet_ship_type",
  "schemaVersion": 1,
  "dataVersion": 1,
  "mode": "INLINE",
  "items": [
    {
      "id": "SHIP_TYPE_CORVETTE",
      "name": "Hộ Vệ Hạm Trinh Sát Nhanh (Corvette)",
      "hullClass": "LIGHT",
      "evasionBase": 45,
      "speedBase": 140,
      "defaultRole": "RECON_PATROL"
    },
    {
      "id": "SHIP_TYPE_FRIGATE",
      "name": "Khinh Hạm Đa Năng (Frigate)",
      "hullClass": "MEDIUM_LIGHT",
      "evasionBase": 30,
      "speedBase": 110,
      "defaultRole": "SCREENING_ESCORT"
    },
    {
      "id": "SHIP_TYPE_DESTROYER",
      "name": "Khu Trục Hạm Tác Chiến (Destroyer)",
      "hullClass": "MEDIUM",
      "evasionBase": 20,
      "speedBase": 95,
      "defaultRole": "LINE_COMBAT"
    },
    {
      "id": "SHIP_TYPE_CRUISER",
      "name": "Tuần Dương Hạm Hỏa Lực (Cruiser)",
      "hullClass": "HEAVY",
      "evasionBase": 12,
      "speedBase": 75,
      "defaultRole": "FIRE_SUPPORT"
    },
    {
      "id": "SHIP_TYPE_BATTLESHIP",
      "name": "Thiết Giáp Hạm Kỳ Hạm (Battleship)",
      "hullClass": "CAPITAL",
      "evasionBase": 5,
      "speedBase": 55,
      "defaultRole": "COMMAND_SIEGE"
    },
    {
      "id": "SHIP_TYPE_CARRIER",
      "name": "Hàng Không Mẫu Hạm Cơ Giới (Carrier)",
      "hullClass": "CAPITAL",
      "evasionBase": 6,
      "speedBase": 65,
      "defaultRole": "STRIKE_HANGAR"
    },
    {
      "id": "SHIP_TYPE_FREIGHTER",
      "name": "Tàu Vận Tải Tiếp Tế Hậu Cần (Freighter)",
      "hullClass": "LOGISTICS",
      "evasionBase": 8,
      "speedBase": 60,
      "defaultRole": "SUPPLY_TRANSPORT"
    }
  ]
}
```

#### Catalog 4: `system_fleet_ship_class_data.json`
- **Mục tiêu**: Phân cấp phẩm cấp công nghệ đóng tàu từ MK I đến MK X.
- **Tập tin mẫu**:
```json
{
  "configFileId": "system_fleet_ship_class",
  "schemaVersion": 1,
  "dataVersion": 1,
  "mode": "INLINE",
  "items": [
    {
      "id": "SHIP_CLASS_MK1_STANDARD",
      "tierOrder": 1,
      "displayName": "Chuẩn Công Nghệ MK I - Khởi Thủy",
      "hullMultiplier": 1.0,
      "shieldMultiplier": 1.0,
      "moduleSlotBonus": 0,
      "maintenanceFactor": 1.0
    },
    {
      "id": "SHIP_CLASS_MK2_REINFORCED",
      "tierOrder": 2,
      "displayName": "Chuẩn Công Nghệ MK II - Gia Cố Thân Vỏ",
      "hullMultiplier": 1.35,
      "shieldMultiplier": 1.25,
      "moduleSlotBonus": 1,
      "maintenanceFactor": 1.2
    },
    {
      "id": "SHIP_CLASS_MK3_ADVANCED",
      "tierOrder": 3,
      "displayName": "Chuẩn Công Nghệ MK III - Hợp Kim Lượng Tử",
      "hullMultiplier": 1.85,
      "shieldMultiplier": 1.70,
      "moduleSlotBonus": 2,
      "maintenanceFactor": 1.5
    },
    {
      "id": "SHIP_CLASS_MK4_STELLAR",
      "tierOrder": 4,
      "displayName": "Chuẩn Công Nghệ MK IV - Lõi Phản Vật Chất",
      "hullMultiplier": 2.50,
      "shieldMultiplier": 2.30,
      "moduleSlotBonus": 3,
      "maintenanceFactor": 2.0
    },
    {
      "id": "SHIP_CLASS_MK5_DREAD",
      "tierOrder": 5,
      "displayName": "Chuẩn Công Nghệ MK V - Tuyệt Tác Tối Thượng",
      "hullMultiplier": 3.60,
      "shieldMultiplier": 3.20,
      "moduleSlotBonus": 5,
      "maintenanceFactor": 2.8,
      "hasCapstoneBonus": true
    }
  ]
}
```

#### Catalog 5: `system_fleet_ship_definition_data.json`
- **Mục tiêu**: Định nghĩa các bản vẽ thiết kế tàu chuẩn tắc (Master Blueprints).
- **Tập tin mẫu**:
```json
{
  "configFileId": "system_fleet_ship_definition",
  "schemaVersion": 1,
  "dataVersion": 1,
  "mode": "INLINE",
  "items": [
    {
      "id": "SHIP_DEF_SOL_VALIANT_CORVETTE",
      "typeId": "SHIP_TYPE_CORVETTE",
      "classId": "SHIP_CLASS_MK1_STANDARD",
      "name": "Sol Valiant Corvette",
      "faction": "vss",
      "description": "Chiến hạm trinh sát tiêu chuẩn của Liên minh VSS, độ cơ động tuyệt hảo.",
      "baseStats": {
        "maxHp": 3200,
        "maxShield": 1800,
        "attack": 280,
        "defense": 150,
        "speed": 135
      },
      "crewRequirements": {
        "minimumCrew": 8,
        "targetCrew": 16,
        "maximumCrew": 24
      },
      "slotsLayout": [
        { "slotId": "slot_wpn_1", "slotType": "WEAPON", "size": "LIGHT" },
        { "slotId": "slot_eng_1", "slotType": "ENGINE", "size": "LIGHT" },
        { "slotId": "slot_shd_1", "slotType": "SHIELD", "size": "LIGHT" },
        { "slotId": "slot_utl_1", "slotType": "UTILITY", "size": "LIGHT" }
      ],
      "cargoCapacity": 120,
      "fuelCapacity": 450,
      "buildCost": {
        "industrialMaterials": 450,
        "energy": 200,
        "credits": 1200,
        "buildDays": 5
      }
    },
    {
      "id": "SHIP_DEF_AEGIS_LINE_CRUISER",
      "typeId": "SHIP_TYPE_CRUISER",
      "classId": "SHIP_CLASS_MK2_REINFORCED",
      "name": "Aegis Vanguard Line Cruiser",
      "faction": "vss",
      "description": "Tuần dương hạm chủ lực hạng nặng, bệ đỡ phòng thủ của mọi hạm đội viễn chinh.",
      "baseStats": {
        "maxHp": 14500,
        "maxShield": 9800,
        "attack": 1250,
        "defense": 820,
        "speed": 75
      },
      "crewRequirements": {
        "minimumCrew": 45,
        "targetCrew": 90,
        "maximumCrew": 135
      },
      "slotsLayout": [
        { "slotId": "slot_wpn_1", "slotType": "WEAPON", "size": "HEAVY" },
        { "slotId": "slot_wpn_2", "slotType": "WEAPON", "size": "MEDIUM" },
        { "slotId": "slot_shd_1", "slotType": "SHIELD", "size": "HEAVY" },
        { "slotId": "slot_eng_1", "slotType": "ENGINE", "size": "HEAVY" },
        { "slotId": "slot_hgr_1", "slotType": "HANGAR", "size": "MEDIUM" },
        { "slotId": "slot_utl_1", "slotType": "UTILITY", "size": "MEDIUM" }
      ],
      "cargoCapacity": 850,
      "fuelCapacity": 1800,
      "buildCost": {
        "industrialMaterials": 2400,
        "energy": 1200,
        "credits": 6800,
        "buildDays": 18
      }
    }
  ]
}
```

#### Catalog 6: `system_fleet_policy_profile_data.json`
- **Mục tiêu**: Cấu hình các chính sách trợ cấp, suy giảm thường niên và quy tắc chỉ huy khẩn cấp.
- **Tập tin mẫu**:
```json
{
  "configFileId": "system_fleet_policy_profile",
  "schemaVersion": 1,
  "dataVersion": 1,
  "mode": "INLINE",
  "items": [
    {
      "id": "POLICY_NATIONAL_STANDARD_2026",
      "name": "Chính Sách Hạm Đội Tiêu Chuẩn Quốc Gia VSS",
      "annualDecayCycleDays": 360,
      "annualDecayDivisor": 2,
      "annualDecayMaxCapPercent": 50,
      "subsidyMultiplierPerTier": 10,
      "subsidyFloorPercent": 30,
      "subsidyFullRateLimit": 3,
      "frontlineWarExceptionEnabled": true,
      "emergencyCommandThresholds": {
        "capitalSiege": true,
        "sectorThreatLevelCutoff": 85,
        "minFleetReadinessPercent": 60
      },
      "newGuildProtectionDays": 360,
      "exchangeRateFrameToCredits": 150
    }
  ]
}
```

#### Catalog 7: `system_fleet_frame_award_catalog_data.json`
- **Mục tiêu**: Bảng biểu mẫu các mức thưởng điểm FRAME cho các thành tích cụ thể.
- **Tập tin mẫu**:
```json
{
  "configFileId": "system_fleet_frame_award_catalog",
  "schemaVersion": 1,
  "dataVersion": 1,
  "mode": "INLINE",
  "items": [
    {
      "id": "FRAME_AWARD_BOSS_ELIMINATION",
      "name": "Chiến Công Tiêu Diệt Boss Đe Dọa Cấp Cao",
      "basePoints": 2500,
      "bonusMultiplierPerThreatLevel": 1.25,
      "recipientType": "FLEET_AND_PILOT",
      "description": "Khen thưởng đặc biệt khi hạm đội xóa sổ hoàn toàn một hạm đội đầu não của phe đối địch."
    },
    {
      "id": "FRAME_AWARD_SAR_PILOT_RESCUED",
      "name": "Huân Chương Cứu Nạn Phi Công Chiến Trường",
      "basePoints": 450,
      "bonusMultiplierPerThreatLevel": 1.10,
      "recipientType": "FLEET",
      "description": "Trao thưởng cho mỗi phi công đồng minh được giải cứu và đưa về căn cứ an toàn."
    },
    {
      "id": "FRAME_AWARD_TRADE_LANE_PATROL_CYCLE",
      "name": "Công Trạng Bảo Vệ Hành Lang Siêu Không Gian",
      "basePoints": 150,
      "bonusMultiplierPerThreatLevel": 1.05,
      "recipientType": "FLEET",
      "description": "Thưởng định kỳ 7 ngày cho các hạm đội duy trì an ninh tuyệt đối trên các tuyến đường huyết mạch."
    }
  ]
}
```

---

### 4. BẢNG MA TRẬN KHÓA NGOẠI & TÍNH TOÀN VẸN THAM CHIẾU (REFERENTIAL INTEGRITY)

| Bảng Nguồn (Source Entity / Field) | Khóa Ngoại (Foreign Key) | Bảng Đích (Target Master Catalog) | Ràng Buộc Toàn Vẹn |
| :--- | :--- | :--- | :--- |
| `FleetEntityState.typeId` | `id` | `system_fleet_fleet_type_data` | Bắt buộc phải tồn tại trong danh mục |
| `FleetEntityState.classId` | `id` | `system_fleet_fleet_class_data` | Bắt buộc phải khớp với Tier FND-2 |
| `ShipInstance.definitionId` | `id` | `system_fleet_ship_definition_data` | Khóa ngoại bất biến, nạp từ Catalog |
| `ShipDefinition.typeId` | `id` | `system_fleet_ship_type_data` | Phân cấp hợp lệ |
| `ShipDefinition.classId` | `id` | `system_fleet_ship_class_data` | Phân cấp hợp lệ |
| `ShipInstalledModule.moduleId` | `id` | `system_building_module_definition_data` | Tích hợp tương thích với FND-5 |
| `FleetEntityState.registeredHomeBaseId` | `id` | `WorldState.bases` | Phải là Base ID hợp lệ trên bản đồ 30 Sector |
| `FleetEntityState.captainPilotId` | `id` | `lib/game/data.ts:PILOTS` | Phải là Pilot ID hợp lệ |
| `FleetLocationState.sectorId` | `id` | `WorldState.sectors` | Phải nằm trong 30 Sector |
| `FleetLocationState.dockPortId` | `id` | `BaseEntityState.dockingPorts` | Không được vượt quá Docking Capacity |

---
*(Hết tài liệu Từ Điển Dữ Liệu & Schemas FND-7)*
