/**
 * STARFRONT WORLD — Event Templates & Curated Catalogs (Phase 6.7)
 * Bộ cấu hình 20 sự kiện chiến lược và các phương án phản ứng (Strategies):
 *   - Phân loại rõ: Crisis, Diplomacy, Military, Anomaly, Logistics, Civil, Intel
 *   - Mỗi template có: defaultStrategyId và defaultDeadlineTicks
 *   - Các phương án có chi phí, thời gian xử lý và hậu quả xác định
 */

import type {
  EventCategory,
  EventSeverity,
  EventScope,
  EventStrategy,
  WorldEvent,
} from "./types"

export interface EventTemplateConfig {
  id: string
  title: string
  description: string
  category: EventCategory
  severity: EventSeverity
  scope: EventScope
  basePriority: number
  defaultDeadlineTicks: number
  defaultStrategyId: string
  strategies: EventStrategy[]
}

export const EVENT_TEMPLATES: Record<string, EventTemplateConfig> = {
  // 1. Hạm đội Void đột kích
  evt_void_skirmish_raid: {
    id: "evt_void_skirmish_raid",
    title: "Hạm Đội Tiền Trạm Void Đột Kích",
    description: "Một phân đội cơ động The Void xuất hiện tại rìa sector, tiến hành quấy rối và nhắm vào các cơ sở dân sinh.",
    category: "military",
    severity: "critical",
    scope: "sector",
    basePriority: 85,
    defaultDeadlineTicks: 2,
    defaultStrategyId: "strat_passive_containment",
    strategies: [
      {
        id: "strat_scramble_garrison",
        name: "Xuất Kích Đồn Trú Đánh Chặn",
        description: "Huy động hạm đội bảo an và đồn trú trực chiến xuất trận đánh đuổi hạm đội đột kích.",
        cost: { logisticsSupplies: 35 },
        militaryCost: 20,
        processingTicks: 2,
        requiresCombat: true,
        encounterConfig: { enemyPower: 450, tier: 1, name: "Void Skirmish Vanguard" },
        consequences: {
          threatDelta: -30,
          stabilityDelta: 10,
          militaryDelta: { woundedDelta: 5 },
          message: "Lực lượng bảo an đã đánh tan phân đội đột kích, hạ nhiệt mối đe dọa tại sector.",
        },
        failureConsequences: {
          threatDelta: 15,
          stabilityDelta: -10,
          militaryDelta: { casualtiesDelta: 8 },
          message: "Đợt phản công vấp phải hỏa lực mạnh, đồn trú chịu thiệt hại.",
        },
      },
      {
        id: "strat_fortify_shelter",
        name: "Cố Thủ Trong Boong-ke & Kích Hoạt Khiên",
        description: "Bật lá chắn phòng thủ năng lượng tối đa và đưa cư dân vào hầm trú ẩn.",
        cost: { energy: 40 },
        processingTicks: 1,
        consequences: {
          threatDelta: 5,
          stabilityDelta: 2,
          populationDelta: { civilianCasualties: 0 },
          message: "Lá chắn hấp thụ các đòn bắn phá, bảo vệ tính mạng dân sự an toàn tuyệt đối.",
        },
      },
      {
        id: "strat_passive_containment",
        name: "Phòng Thủ Bị Động & Báo Động Vàng (Mặc Định)",
        description: "Duy trì cảnh giác thông thường, không mạo hiểm xuất kích do thiếu lệnh chiến dịch.",
        cost: {},
        processingTicks: 1,
        consequences: {
          threatDelta: 18,
          stabilityDelta: -6,
          resourceDelta: { industrialMaterials: -30 },
          message: "Địch tự do bắn phá rìa căn cứ trước khi rút lui. Mức đe dọa gia tăng và vật tư bị cướp phá.",
        },
      },
    ],
  },

  // 2. Bão plasma không gian
  evt_plasma_storm: {
    id: "evt_plasma_storm",
    title: "Bão Plasma Bức Xạ Không Gian",
    description: "Cơn bão bức xạ mặt trời quét qua tuyến đường, đe dọa làm quá tải lưới điện và gây nhiễu liên lạc.",
    category: "anomaly",
    severity: "warning",
    scope: "sector",
    basePriority: 60,
    defaultDeadlineTicks: 2,
    defaultStrategyId: "strat_ride_out_storm",
    strategies: [
      {
        id: "strat_overcharge_shields",
        name: "Tăng Tải Khiên Năng Lượng Sector",
        description: "Chuyển hướng plasma dự trữ sang các máy phát trường lực để cản bức xạ.",
        cost: { energy: 60 },
        processingTicks: 1,
        consequences: {
          stabilityDelta: 6,
          threatDelta: -5,
          message: "Lưới bảo vệ đã che chắn thành công sector. Cơ sở vật chất nguyên vẹn.",
        },
      },
      {
        id: "strat_emergency_grid_shutdown",
        name: "Tạm Ngắt Lưới Điện Sản Xuất",
        description: "Ngắt điện các phân xưởng công nghiệp để bảo vệ linh kiện vi mạch nhạy cảm.",
        cost: {},
        processingTicks: 2,
        consequences: {
          resourceDelta: { industrialMaterials: -40 },
          stabilityDelta: 0,
          message: "Tắt máy an toàn; sản lượng công nghiệp tạm giảm nhẹ nhưng không hỏng thiết bị.",
        },
      },
      {
        id: "strat_ride_out_storm",
        name: "Chống Chịu Bị Động Theo Quy Chuẩn (Mặc Định)",
        description: "Để hệ thống tự điều tiết theo ngưỡng mặc định.",
        cost: {},
        processingTicks: 1,
        consequences: {
          stabilityDelta: -8,
          resourceDelta: { industrialMaterials: -70 },
          message: "Bão plasma làm chập cháy một số máy móc, gây thiệt hại vật liệu và hoang mang cư dân.",
        },
      },
    ],
  },

  // 3. Bãi công & Bạo động dân sự
  evt_civil_unrest_strike: {
    id: "evt_civil_unrest_strike",
    title: "Bãi Công & Bạo Động Dân Sự Khai Khoáng",
    description: "Công nhân tại các mỏ khai thác đình công đòi tăng khẩu phần dinh dưỡng và cải thiện an toàn lao động.",
    category: "civil",
    severity: "warning",
    scope: "sector",
    basePriority: 70,
    defaultDeadlineTicks: 3,
    defaultStrategyId: "strat_standoff_delay",
    strategies: [
      {
        id: "strat_negotiate_rations",
        name: "Cấp Phát Khẩu Phần & Trợ Cấp An Sinh",
        description: "Mở kho lương thực quốc gia, viện trợ thêm khẩu phần và cam kết nâng cấp trạm lọc khí.",
        cost: { food: 80, industrialMaterials: 40 },
        processingTicks: 2,
        consequences: {
          stabilityDelta: 20,
          threatDelta: -5,
          message: "Thỏa thuận thành công. Công nhân phấn khởi quay lại làm việc, ổn định xã hội tăng mạnh.",
        },
      },
      {
        id: "strat_martial_curfew",
        name: "Thiết Quân Luật & Giải Tán Bằng Vũ Lực",
        description: "Điều động lực lượng an ninh giải tán bạo động và bắt giữ các đối tượng cầm đầu.",
        cost: { logisticsSupplies: 20 },
        militaryCost: 30,
        processingTicks: 1,
        consequences: {
          stabilityDelta: 5,
          populationDelta: { civilianCasualties: 12 },
          message: "Trật tự vãn hồi nhanh chóng nhưng cư dân còn nhiều ấm ức, thương vong dân tộc tích lũy.",
        },
      },
      {
        id: "strat_standoff_delay",
        name: "Kiên Trì Phong Tỏa Chờ Dịu Xuống (Mặc Định)",
        description: "Chờ đợi các phe tự thỏa hiệp mà không can thiệp chủ động.",
        cost: {},
        processingTicks: 2,
        consequences: {
          stabilityDelta: -12,
          resourceDelta: { industrialMaterials: -60 },
          message: "Sự bế tắc kéo dài làm đình trệ công xưởng, lòng tin dân chúng sụt giảm rõ rệt.",
        },
      },
    ],
  },

  // 4. Yêu cầu tiếp tế khẩn cấp
  evt_urgent_supply_request: {
    id: "evt_urgent_supply_request",
    title: "Yêu Cầu Tiếp Tế Cứu Trợ Khẩn Cấp",
    description: "Sector báo cáo kho dự trữ lương thực và đạn dược xuống thấp do dòng người sơ tán đông đảo.",
    category: "logistics",
    severity: "warning",
    scope: "sector",
    basePriority: 65,
    defaultDeadlineTicks: 2,
    defaultStrategyId: "strat_refuse_aid",
    strategies: [
      {
        id: "strat_dispatch_relief_convoy",
        name: "Xuất Kho Lương Thực & Vật Tư Toàn Diện",
        description: "Gửi đoàn tiếp tế đầy đủ lương thực và đạn dược hỗ trợ tuyến đầu.",
        cost: { food: 100, logisticsSupplies: 50 },
        processingTicks: 2,
        consequences: {
          stabilityDelta: 16,
          threatDelta: -10,
          message: "Đoàn xe cứu trợ đã cập bến an toàn, xoa dịu nạn khan hiếm tại sector.",
        },
      },
      {
        id: "strat_minimal_aid",
        name: "Gửi Gói Viện Trợ Tối Thiểu",
        description: "Chỉ chi viện lương thực khẩn cấp ở mức tối thiểu để duy trì sinh hoạt.",
        cost: { food: 40 },
        processingTicks: 1,
        consequences: {
          stabilityDelta: 5,
          message: "Viện trợ tối thiểu giúp ngăn ngừa khủng hoảng trước mắt.",
        },
      },
      {
        id: "strat_refuse_aid",
        name: "Từ Chối Viện Trợ Do Ưu Tiên Quân Sự (Mặc Định)",
        description: "Bảo tồn kho trung ương, yêu cầu địa phương tự cân đối nguồn cung.",
        cost: {},
        processingTicks: 1,
        consequences: {
          stabilityDelta: -14,
          threatDelta: 5,
          message: "Khủng hoảng thiếu hụt làm dấy lên bất mãn và suy yếu tinh thần phòng thủ.",
        },
      },
    ],
  },

  // 5. Đường dây buôn lậu trạm hậu cần
  evt_contraband_smugglers: {
    id: "evt_contraband_smugglers",
    title: "Đường Dây Buôn Lậu & Hắc Thị",
    description: "Tình báo phát hiện tổ chức tội phạm ngầm tuồn vật tư công nghiệp ra thị trường chợ đen.",
    category: "intel",
    severity: "info",
    scope: "sector",
    basePriority: 45,
    defaultDeadlineTicks: 3,
    defaultStrategyId: "strat_ignore_smugglers",
    strategies: [
      {
        id: "strat_covert_sting",
        name: "Đột Kích Bắt Giữ & Tịch Thu Kho Hàng",
        description: "Sử dụng dữ liệu tình báo phối hợp lực lượng đặc nhiệm triệt phá toàn bộ đường dây.",
        cost: { tacticalData: 25, logisticsSupplies: 20 },
        processingTicks: 2,
        consequences: {
          resourceDelta: { industrialMaterials: 90, energy: 45 },
          threatDelta: -10,
          stabilityDelta: 8,
          message: "Triệt phá thành công đường dây buôn lậu, thu hồi lượng lớn vật tư cho công quỹ.",
        },
      },
      {
        id: "strat_levy_black_market",
        name: "Thu Thuế Ngầm & Cài Cắm Nội Gián",
        description: "Tận dụng mạng lưới buôn lậu để thu thập thông tin tình báo và thu phí bí mật.",
        cost: {},
        processingTicks: 1,
        consequences: {
          resourceDelta: { industrialMaterials: 60, tacticalData: 20 },
          stabilityDelta: -4,
          message: "Mạng lưới chợ đen mang lại thêm tài nguyên và tai mắt nhưng làm xói mòn kỷ cương pháp luật.",
        },
      },
      {
        id: "strat_ignore_smugglers",
        name: "Bỏ Qua Do Thiếu Lực Lượng Giám Sát (Mặc Định)",
        description: "Không phân bổ nhân lực xử lý.",
        cost: {},
        processingTicks: 1,
        consequences: {
          stabilityDelta: -5,
          threatDelta: 5,
          resourceDelta: { industrialMaterials: -25 },
          message: "Hắc thị lộng hành gây thất thoát nguyên vật liệu thường xuyên.",
        },
      },
    ],
  },

  // 6. Xác tàu cổ trôi dạt
  evt_derelict_warship_salvage: {
    id: "evt_derelict_warship_salvage",
    title: "Phát Hiện Xác Tàu Cổ Trôi Dạt",
    description: "Đội tuần tra phát hiện xác một chiến hạm tuần dương hạm thời kỳ Tiền Chiến còn nguyên vẹn khối lõi.",
    category: "anomaly",
    severity: "info",
    scope: "sector",
    basePriority: 50,
    defaultDeadlineTicks: 3,
    defaultStrategyId: "strat_leave_derelict",
    strategies: [
      {
        id: "strat_deep_engineering_strip",
        name: "Trục Vớt Toàn Diện Khung Tàu",
        description: "Điều đội tàu công binh xẻ rời hợp kim và thu hồi lò phản ứng cổ đại.",
        cost: { energy: 40, industrialMaterials: 30 },
        processingTicks: 2,
        consequences: {
          resourceDelta: { industrialMaterials: 160, tacticalData: 40 },
          message: "Trục vớt thành công! Kho quân sự thu về lượng lớn hợp kim quý và bản thiết kế cổ.",
        },
      },
      {
        id: "strat_quick_data_core_extraction",
        name: "Trích Xuất Nhanh Lõi Dữ Liệu",
        description: "Chỉ giải mã máy tính hành trình và hệ thống điều hướng.",
        cost: { energy: 15 },
        processingTicks: 1,
        consequences: {
          resourceDelta: { tacticalData: 70 },
          message: "Lõi dữ liệu cung cấp thông tin quý giá về các hải đồ khu vực hoang phế.",
        },
      },
      {
        id: "strat_leave_derelict",
        name: "Gắn Phao Cảnh Báo & Rời Đi (Mặc Định)",
        description: "Không phân bổ công sức thám hiểm.",
        cost: {},
        processingTicks: 1,
        consequences: {
          message: "Xác tàu tiếp tục trôi dạt vô định vào khoảng tối vũ trụ.",
        },
      },
    ],
  },

  // 7. Đoàn tàu tị nạn đến
  evt_refugee_fleet_arrival: {
    id: "evt_refugee_fleet_arrival",
    title: "Đoàn Tàu Tị Nạn Không Gian Đến",
    description: "Hàng trăm phi thuyền chở thường dân trốn chạy khỏi các khu vực bị The Void tàn phá xin viện trợ cư trú.",
    category: "civil",
    severity: "warning",
    scope: "sector",
    basePriority: 75,
    defaultDeadlineTicks: 2,
    defaultStrategyId: "strat_turn_away_convoy",
    strategies: [
      {
        id: "strat_integrate_refugees",
        name: "Tiếp Nhận & Tái Định Cư Dân Sự",
        description: "Cung cấp nơi ở, lương thực và hướng dẫn làm việc tại khu vực sản xuất.",
        cost: { food: 70, industrialMaterials: 35 },
        processingTicks: 2,
        consequences: {
          stabilityDelta: 10,
          populationDelta: { refugees: 0 },
          message: "Cộng đồng chào đón người tị nạn; lực lượng lao động gia tăng đáng kể.",
        },
      },
      {
        id: "strat_quarantine_vetting",
        name: "Cách Ly Kiểm Dịch & Sàng Lọc Kỹ",
        description: "Thiết lập trạm kiểm soát tạm thời ngoài quỹ đạo để sàng lọc nội gián và bệnh tật.",
        cost: { logisticsSupplies: 20 },
        processingTicks: 2,
        consequences: {
          resourceDelta: { tacticalData: 25 },
          stabilityDelta: 3,
          message: "Quá trình kiểm dịch hoàn tất an toàn, thu thập thêm tin tức về tình hình phòng tuyến địch.",
        },
      },
      {
        id: "strat_turn_away_convoy",
        name: "Khước Từ Nhập Cảnh Vì Lý Do An Toàn (Mặc Định)",
        description: "Khóa cảng và xua đuổi đoàn tàu rời khỏi không phận sector.",
        cost: {},
        processingTicks: 1,
        consequences: {
          stabilityDelta: -7,
          message: "Hành động cự tuyệt gây chia rẽ trong xã hội, nhiều cư dân chỉ trích chính quyền tàn nhẫn.",
        },
      },
    ],
  },

  // 8. Tín hiệu The Void bí mật
  evt_void_signal_decryption: {
    id: "evt_void_signal_decryption",
    title: "Thu Thập Được Dải Tần Bí Mật The Void",
    description: "Mảng cảm biến bắt được luồng thông tin lạ mã hóa theo tần số sinh học đặc thù của kẻ thù.",
    category: "intel",
    severity: "info",
    scope: "galaxy",
    basePriority: 60,
    defaultDeadlineTicks: 3,
    defaultStrategyId: "strat_archive_raw_signals",
    strategies: [
      {
        id: "strat_supercomputer_decode",
        name: "Huy Động Máy Chủ Lượng Tử Giải Mã",
        description: "Dồn toàn bộ năng lực điện toán giải mã thông điệp tác chiến.",
        cost: { energy: 50, tacticalData: 30 },
        processingTicks: 2,
        consequences: {
          resourceDelta: { tacticalData: 140 },
          threatDelta: -15,
          message: "Giải mã hoàn tất! Ta nắm bắt được tọa độ tập kết của hạm đội địch, giảm nguy cơ bị phục kích.",
        },
      },
      {
        id: "strat_tactical_countermeasure",
        name: "Tạo Sóng Nhiễu Phá Kênh Điều Khiển",
        description: "Phát xung điện từ gây nhiễu dải tần liên lạc của đối phương.",
        cost: { energy: 30 },
        processingTicks: 1,
        consequences: {
          threatDelta: -25,
          message: "Sóng nhiễu làm rối loạn đội hình The Void, làm tê liệt ý đồ hành quân.",
        },
      },
      {
        id: "strat_archive_raw_signals",
        name: "Lưu Trữ Tệp Thô Để Xử Lý Sau (Mặc Định)",
        description: "Ghi dữ liệu vào đĩa quang học, không tốn tài nguyên xử lý ngay.",
        cost: {},
        processingTicks: 1,
        consequences: {
          resourceDelta: { tacticalData: 15 },
          message: "Dữ liệu được lưu trữ an toàn trong kho dữ liệu tình báo.",
        },
      },
    ],
  },

  // 9. Đột biến lưới điện
  evt_energy_grid_surge: {
    id: "evt_energy_grid_surge",
    title: "Đột Biến Áp Lực Lưới Năng Lượng",
    description: "Trạm biến áp plasma trung tâm xảy ra xung đột pha, áp suất plasma tăng vọt.",
    category: "logistics",
    severity: "warning",
    scope: "sector",
    basePriority: 55,
    defaultDeadlineTicks: 2,
    defaultStrategyId: "strat_contain_pressure",
    strategies: [
      {
        id: "strat_divert_to_batteries",
        name: "Xả Áp Vào Trạm Lưu Trữ Dự Phòng",
        description: "Hấp thụ dòng năng lượng dư thừa vào cụm pin siêu dẫn.",
        cost: { industrialMaterials: 30 },
        processingTicks: 1,
        consequences: {
          resourceDelta: { energy: 80 },
          stabilityDelta: 4,
          message: "Biến nguy thành an; mạng lưới thu hồi thêm năng lượng sạch dồi dào.",
        },
      },
      {
        id: "strat_vent_to_space",
        name: "Xả Bức Xạ Năng Lượng Ra Không Gian",
        description: "Mở van an toàn giải phóng plasma thẳng ra ngoài khí quyển.",
        cost: {},
        processingTicks: 1,
        consequences: {
          resourceDelta: { energy: -35 },
          message: "Xả áp an toàn nhưng thất thoát một lượng năng lượng quý giá.",
        },
      },
      {
        id: "strat_contain_pressure",
        name: "Cố Gắng Duy Trì Hệ Thống Hoạt Động (Mặc Định)",
        description: "Duy trì hoạt động và hy vọng van ngắt tự động kịp kích hoạt.",
        cost: {},
        processingTicks: 2,
        consequences: {
          resourceDelta: { energy: -75, industrialMaterials: -30 },
          stabilityDelta: -5,
          message: "Đoản mạch gây nổ buồng đốt phụ, làm hư hại trang thiết bị.",
        },
      },
    ],
  },

  // 10. Dịch hại cây trồng Hydroponic
  evt_food_supply_blight: {
    id: "evt_food_supply_blight",
    title: "Ký Sinh Dịch Bệnh Tại Nông Trường Hydroponic",
    description: "Một loại nấm ký sinh lạ đang lây lan nhanh chóng trong các khay nuôi cấy dinh dưỡng khép kín.",
    category: "crisis",
    severity: "critical",
    scope: "sector",
    basePriority: 80,
    defaultDeadlineTicks: 2,
    defaultStrategyId: "strat_delayed_quarantine",
    strategies: [
      {
        id: "strat_chemical_decontamination",
        name: "Khử Trùng Hóa Học & Tái Cấy Mô",
        description: "Dùng hóa chất kháng khuẩn cao cấp và phân lập giống cây kháng bệnh.",
        cost: { energy: 45, industrialMaterials: 35 },
        processingTicks: 2,
        consequences: {
          resourceDelta: { food: -25 },
          stabilityDelta: 6,
          message: "Dịch nấm bị khống chế thành công; thiệt hại lương thực được thu hẹp tối đa.",
        },
      },
      {
        id: "strat_rationing_cull",
        name: "Tiêu Hủy Khu Vực Nhiễm & Thắt Lưng Buộc Bụng",
        description: "Đốt bỏ toàn bộ phân khu nhiễm bệnh và siết chặt hạn ngạch tiêu thụ.",
        cost: {},
        processingTicks: 2,
        consequences: {
          resourceDelta: { food: -100 },
          stabilityDelta: -8,
          message: "Ngăn được lây lan nhưng mất mát nhiều tấn khẩu phần thiết yếu.",
        },
      },
      {
        id: "strat_delayed_quarantine",
        name: "Cách Ly Muộn & Theo Dõi Tiến Triển (Mặc Định)",
        description: "Chần chừ xử lý khiến mầm bệnh ăn sâu vào nguồn nước tái chế.",
        cost: {},
        processingTicks: 2,
        consequences: {
          resourceDelta: { food: -180 },
          stabilityDelta: -15,
          message: "Nông trường sụp đổ một nửa sản lượng, đẩy sector vào tình trạng thiếu đói nghiêm trọng.",
        },
      },
    ],
  },

  // 11. Sứ giả thuộc địa tự do
  evt_diplomatic_free_colonies: {
    id: "evt_diplomatic_free_colonies",
    title: "Đoàn Sứ Giả Liên Minh Thuộc Địa Tự Do",
    description: "Một phái đoàn thương mại đề xuất hiệp định trao đổi hỗ trợ hậu cần và công nghệ quân sự.",
    category: "diplomacy",
    severity: "info",
    scope: "galaxy",
    basePriority: 50,
    defaultDeadlineTicks: 3,
    defaultStrategyId: "strat_courteous_decline",
    strategies: [
      {
        id: "strat_sign_trade_pact",
        name: "Ký Hiệp Ước Trao Đổi Thương Mại",
        description: "Chia sẻ dữ liệu dẫn đường để đổi lấy nguyên vật liệu và lương thực bổ sung.",
        cost: { tacticalData: 40 },
        processingTicks: 2,
        consequences: {
          resourceDelta: { industrialMaterials: 110, food: 90 },
          stabilityDelta: 8,
          message: "Hiệp ước mang lại nguồn hàng hóa phong phú, thúc đẩy thị trường hưng thịnh.",
        },
      },
      {
        id: "strat_military_intel_exchange",
        name: "Trao Đổi Tình Báo Tác Chiến Chống Void",
        description: "Chia sẻ số liệu vũ khí để lấy tin tức tình báo về phòng tuyến địch.",
        cost: { logisticsSupplies: 30 },
        processingTicks: 1,
        consequences: {
          resourceDelta: { tacticalData: 80 },
          threatDelta: -10,
          message: "Hai bên chia sẻ bản đồ căn cứ địch, nâng cao năng lực phòng thủ toàn vùng.",
        },
      },
      {
        id: "strat_courteous_decline",
        name: "Tiếp Đãi Xã Giao & Trì Hoãn Cam Kết (Mặc Định)",
        description: "Từ chối khéo léo để bảo đảm bí mật tác chiến tối đa.",
        cost: {},
        processingTicks: 1,
        consequences: {
          stabilityDelta: 2,
          message: "Phái đoàn rời đi trong hòa bình; không có biến động tài nguyên.",
        },
      },
    ],
  },

  // 12. Cướp biển phong tỏa tuyến siêu không gian
  evt_pirate_hyperlane_blockade: {
    id: "evt_pirate_hyperlane_blockade",
    title: "Cướp Biển Không Gian Rải Thủy Lôi Phong Tỏa",
    description: "Băng cướp ngoại vi lợi dụng tình hình chiến tranh để chăng bẫy mìn quấy nhiễu các đoàn vận tải.",
    category: "military",
    severity: "warning",
    scope: "sector",
    basePriority: 70,
    defaultDeadlineTicks: 2,
    defaultStrategyId: "strat_tolerate_blockade",
    strategies: [
      {
        id: "strat_minesweeper_escort",
        name: "Điều Tàu Quét Mìn Kèm Tuần Tra Hạm",
        description: "Tổ chức chiến dịch càn quét giải phóng tuyến đường huyết mạch.",
        cost: { logisticsSupplies: 30 },
        militaryCost: 20,
        processingTicks: 2,
        consequences: {
          threatDelta: -25,
          stabilityDelta: 8,
          message: "Tuyến siêu không gian được giải phóng an toàn; bọn cướp tháo chạy tán loạn.",
        },
      },
      {
        id: "strat_reroute_shipping",
        name: "Đổi Hướng Lưu Thông Sang Tuyến Phụ",
        description: "Chấp nhận đi vòng để tránh khu vực mìn nguy hiểm.",
        cost: { energy: 20 },
        processingTicks: 1,
        consequences: {
          resourceDelta: { industrialMaterials: -30 },
          message: "Chi phí nhiên liệu tăng do hành trình kéo dài, nhưng hàng hóa đến nơi an toàn.",
        },
      },
      {
        id: "strat_tolerate_blockade",
        name: "Chờ Đợi Tuần Tra Tự Nhiên Giải Tỏa (Mặc Định)",
        description: "Không can thiệp ngay, chờ lực lượng tuần tra khu vực phản ứng.",
        cost: {},
        processingTicks: 3,
        consequences: {
          resourceDelta: { industrialMaterials: -70 },
          threatDelta: 12,
          stabilityDelta: -6,
          message: "Nhiều chuyến tàu hàng bị cướp phá; chi phí bảo hiểm vận tải leo thang.",
        },
      },
    ],
  },

  // 13. Lỗi hệ thống phòng thủ tự động
  evt_automated_defense_glitch: {
    id: "evt_automated_defense_glitch",
    title: "Trục Trặc Mã Lệnh Tháp Pháo Phòng Thủ",
    description: "Hệ thống AI nhận diện bạn-thù tại pháo đài quỹ đạo bị lỗi firmware, đe dọa nã đạn nhầm vào tàu dân sự.",
    category: "anomaly",
    severity: "warning",
    scope: "sector",
    basePriority: 65,
    defaultDeadlineTicks: 2,
    defaultStrategyId: "strat_isolate_perimeter",
    strategies: [
      {
        id: "strat_override_firmware",
        name: "Thâm Nhập Mạng Cưỡng Chế Ghi Đè Firmware",
        description: "Kỹ sư an ninh mạng giải mã đường truyền và nạp lại bản vá bảo mật chuẩn.",
        cost: { tacticalData: 30 },
        processingTicks: 1,
        consequences: {
          stabilityDelta: 8,
          threatDelta: -10,
          message: "Ghi đè mã lệnh thành công; hệ thống pháo đài trở lại trạng thái sẵn sàng chiến đấu.",
        },
      },
      {
        id: "strat_manual_scramble",
        name: "Đổ Bộ Đặc Nhiệm Ngắt Nguồn Cơ Học",
        description: "Đưa lính công binh lên tháp pháo ngắt cầu dao khẩn cấp.",
        cost: { logisticsSupplies: 15 },
        militaryCost: 10,
        processingTicks: 1,
        consequences: {
          resourceDelta: { industrialMaterials: -20 },
          message: "Ngắt pháo thành công bằng biện pháp cơ học, tránh được thương vong dân sự.",
        },
      },
      {
        id: "strat_isolate_perimeter",
        name: "Cắt Tuyến Nối & Phong Tỏa Vòng Ngoài (Mặc Định)",
        description: "Dựng rào cản cảnh báo tàu bè không lại gần tháp pháo.",
        cost: {},
        processingTicks: 2,
        consequences: {
          threatDelta: 12,
          stabilityDelta: -5,
          message: "Vùng bắn phá bị cô lập khiến lưới phòng không sector suy yếu đáng kể.",
        },
      },
    ],
  },

  // 14. Đầu dò do thám sâu The Void
  evt_deep_void_probe: {
    id: "evt_deep_void_probe",
    title: "Bắt Được Đầu Dò Tự Hành Của The Void",
    description: "Lưới đánh chặn vô hiệu hóa một thiết bị thăm dò thông minh đang quét dữ liệu mạng lưới phòng thủ.",
    category: "intel",
    severity: "info",
    scope: "sector",
    basePriority: 55,
    defaultDeadlineTicks: 3,
    defaultStrategyId: "strat_monitor_telemetry",
    strategies: [
      {
        id: "strat_reverse_engineer_probe",
        name: "Mổ Xẻ Đảo Ngược Công Nghệ Động Cơ",
        description: "Nghiên cứu nguyên lý nhảy không gian dị thường của thiết bị.",
        cost: { energy: 35, tacticalData: 25 },
        processingTicks: 2,
        consequences: {
          resourceDelta: { tacticalData: 110, industrialMaterials: 50 },
          message: "Thu được bước đột phá trong công nghệ vật liệu tàng hình và dữ liệu vũ trụ sâu.",
        },
      },
      {
        id: "strat_disrupt_probe_signal",
        name: "Kích Nổ Tự Hủy & Xóa Tín Hiệu Định Vị",
        description: "Nhanh chóng phá hủy đầu dò để địch không thu được tọa độ của ta.",
        cost: { logisticsSupplies: 10 },
        processingTicks: 1,
        consequences: {
          threatDelta: -15,
          message: "Phá hủy an toàn thiết bị, bảo mật hoàn toàn vị trí căn cứ.",
        },
      },
      {
        id: "strat_monitor_telemetry",
        name: "Thu Thập Dữ Liệu Bị Động & Giữ Hiện Trường (Mặc Định)",
        description: "Chỉ ghi lại dữ liệu cảm biến phát ra từ đầu dò.",
        cost: {},
        processingTicks: 1,
        consequences: {
          resourceDelta: { tacticalData: 25 },
          threatDelta: 8,
          message: "Thu thập được một ít tín hiệu thô, nhưng địch có thể đã định vị được trạm thu phát.",
        },
      },
    ],
  },

  // 15. Dịch bệnh bào tử không gian
  evt_space_pathogen_outbreak: {
    id: "evt_space_pathogen_outbreak",
    title: "Dịch Bệnh Bào Tử Không Gian Bùng Phát",
    description: "Bào tử lạ từ vành đai thiên thạch xâm nhập hệ thống điều hòa dưỡng khí, gây suy hô hấp cho cư dân.",
    category: "crisis",
    severity: "critical",
    scope: "sector",
    basePriority: 85,
    defaultDeadlineTicks: 2,
    defaultStrategyId: "strat_standard_quarantine",
    strategies: [
      {
        id: "strat_deploy_medical_synthesizers",
        name: "Tổng Hợp Thuốc Kháng Sinh & Lọc Dưỡng Khí",
        description: "Dốc toàn lực các buồng tổng hợp y tế để bào chế thuốc giải trên diện rộng.",
        cost: { energy: 50, food: 40 },
        processingTicks: 2,
        consequences: {
          stabilityDelta: 12,
          populationDelta: { civilianCasualties: 0 },
          message: "Dịch bệnh được dập tắt nhanh chóng; không có thương vong dân sự nào được ghi nhận.",
        },
      },
      {
        id: "strat_hard_lockdown",
        name: "Phong Tỏa Nghiêm Ngặt Từng Khu Nhà Dân Cư",
        description: "Khóa kín các phân khu sinh sống, hạn chế di chuyển tuyệt đối.",
        cost: { logisticsSupplies: 20 },
        processingTicks: 2,
        consequences: {
          stabilityDelta: -4,
          populationDelta: { civilianCasualties: 8 },
          message: "Ngăn chặn được dịch lây lan nhưng phát sinh một số thương vong do cách ly chậm trễ.",
        },
      },
      {
        id: "strat_standard_quarantine",
        name: "Thực Hiện Quy Chuẩn Cách Ly Cơ Bản (Mặc Định)",
        description: "Chỉ cách ly các ca bệnh phát hiện rõ ràng mà không đóng cửa diện rộng.",
        cost: {},
        processingTicks: 3,
        consequences: {
          stabilityDelta: -16,
          populationDelta: { civilianCasualties: 35 },
          message: "Bào tử phát tán rộng khắp, gây tổn thất nhân mạng đáng kể cho cộng đồng.",
        },
      },
    ],
  },

  // 16. Thu hồi mẫu thử Mecha bị mất tích
  evt_prototype_mecha_salvage: {
    id: "evt_prototype_mecha_salvage",
    title: "Tín Hiệu Cứu Hộ Mẫu Thử Mecha Tiên Tiến",
    description: "Một cỗ máy chiến đấu thử nghiệm bị rơi trong khu vực hoang địa đang phát tín hiệu cấp cứu mã hóa cao.",
    category: "military",
    severity: "info",
    scope: "sector",
    basePriority: 60,
    defaultDeadlineTicks: 3,
    defaultStrategyId: "strat_scuttle_wreck",
    strategies: [
      {
        id: "strat_secure_and_refit",
        name: "Thu Hồi An Toàn & Tái Cấu Trúc Khung Máy",
        description: "Điều xe tải hạng nặng chở khung máy về xưởng cơ khí đại tu khẩn cấp.",
        cost: { industrialMaterials: 50, energy: 35 },
        processingTicks: 2,
        consequences: {
          militaryDelta: { reservesDelta: 25 },
          resourceDelta: { tacticalData: 45 },
          message: "Đưa mẫu thử vào biên chế sẵn sàng chiến đấu, tăng cường lực lượng dự bị.",
        },
      },
      {
        id: "strat_extract_black_box",
        name: "Chỉ Trích Xuất Hộp Đen Chiến Thuật",
        description: "Chỉ tháo gỡ vi xử lý điều khiển và dữ liệu tác chiến.",
        cost: { energy: 10 },
        processingTicks: 1,
        consequences: {
          resourceDelta: { tacticalData: 65 },
          message: "Thu được dữ liệu thử nghiệm quý giá để cải thiện thuật toán tác chiến.",
        },
      },
      {
        id: "strat_scuttle_wreck",
        name: "Hủy Xác Tàu Từ Xa Để Tránh Lộ Bí Mật (Mặc Định)",
        description: "Kích nổ buồng năng lượng để địch không có cơ hội tiếp cận công nghệ.",
        cost: {},
        processingTicks: 1,
        consequences: {
          threatDelta: -5,
          message: "Xác máy bay tự hủy an toàn; bí mật công nghệ được bảo vệ tuyệt đối.",
        },
      },
    ],
  },

  // 17. Phá hoại cơ sở công nghiệp
  evt_industrial_sabotage: {
    id: "evt_industrial_sabotage",
    title: "Phát Hiện Dấu Vết Phá Hoại Cơ Sở Công Nghiệp",
    description: "Dây chuyền luyện kim bị cài chất gây nổ nhiệt độ cao, nghi ngờ có bàn tay nội gián phe địch.",
    category: "crisis",
    severity: "warning",
    scope: "sector",
    basePriority: 75,
    defaultDeadlineTicks: 2,
    defaultStrategyId: "strat_internal_inquiry",
    strategies: [
      {
        id: "strat_counter_intel_sweep",
        name: "Càn Quét Tình Báo Tìm Gián Điệp & Gia Cố An Ninh",
        description: "Triển khai mạng lưới mật thám thanh lọc toàn bộ nhân sự khả nghi.",
        cost: { tacticalData: 35, logisticsSupplies: 20 },
        processingTicks: 2,
        consequences: {
          threatDelta: -20,
          stabilityDelta: 12,
          message: "Bắt giữ kẻ chủ mưu phá hoại, thắt chặt an ninh tại các nhà máy trọng yếu.",
        },
      },
      {
        id: "strat_emergency_repair_shift",
        name: "Tổ Chức Ca Sửa Chữa Khẩn Bù Sản Lượng",
        description: "Huy động công nhân tăng ca thay thế linh kiện bị hư hỏng.",
        cost: { industrialMaterials: 50 },
        processingTicks: 1,
        consequences: {
          resourceDelta: { industrialMaterials: 75 },
          message: "Dây chuyền phục hồi nhanh chóng; sản lượng được bù đắp kịp thời.",
        },
      },
      {
        id: "strat_internal_inquiry",
        name: "Mở Cuộc Điều Tra Nội Bộ Thông Thường (Mặc Định)",
        description: "Lập ban thanh tra kiểm tra theo thủ tục hành chính.",
        cost: {},
        processingTicks: 3,
        consequences: {
          resourceDelta: { industrialMaterials: -65 },
          stabilityDelta: -8,
          message: "Sự chậm trễ khiến cơ sở tiếp tục chịu trục trặc và thất thoát nguyên vật liệu.",
        },
      },
    ],
  },

  // 18. Hải đăng lượng tử lệch pha
  evt_quantum_beacon_calibration: {
    id: "evt_quantum_beacon_calibration",
    title: "Ngọn Hải Đăng Lượng Tử Bị Lệch Pha Định Vị",
    description: "Cột phát sóng định hướng siêu không gian dao động bất thường, làm gián đoạn các chuyến bay chở hàng.",
    category: "anomaly",
    severity: "info",
    scope: "sector",
    basePriority: 50,
    defaultDeadlineTicks: 3,
    defaultStrategyId: "strat_delayed_calibration",
    strategies: [
      {
        id: "strat_precision_recalibration",
        name: "Huy Động Năng Lượng Tái Căn Chỉnh Pha Chuẩn",
        description: "Cung cấp nguồn xung năng lượng ổn định để tái đồng bộ đồng hồ lượng tử.",
        cost: { energy: 45 },
        processingTicks: 1,
        consequences: {
          stabilityDelta: 6,
          message: "Hải đăng hoạt động ổn định trở lại, hành lang bay an toàn và thông suốt.",
        },
      },
      {
        id: "strat_fallback_drift_nav",
        name: "Chuyển Tạm Sang Định Vị Quang Học",
        description: "Sử dụng camera góc rộng truyền thống để hoa tiêu tàu thuyền tạm thời.",
        cost: {},
        processingTicks: 2,
        consequences: {
          resourceDelta: { industrialMaterials: -25 },
          message: "Vận tải hơi chậm lại nhưng tiết kiệm được nguồn năng lượng.",
        },
      },
      {
        id: "strat_delayed_calibration",
        name: "Chờ Chu Kỳ Tự Khởi Động Lại Hệ Thống (Mặc Định)",
        description: "Chờ hệ thống tự động reboot theo lịch định kỳ.",
        cost: {},
        processingTicks: 3,
        consequences: {
          stabilityDelta: -4,
          resourceDelta: { logisticsSupplies: -20 },
          message: "Ùn ứ hàng hóa tại cảng tiếp nhận do tàu thuyền phải hạ tốc độ tiếp cận.",
        },
      },
    ],
  },

  // 19. Đội tiền trạm Void do thám
  evt_void_vanguard_skirmish: {
    id: "evt_void_vanguard_skirmish",
    title: "Đội Tiền Trạm Void Do Thám Phòng Tuyến",
    description: "Thiết bị trinh sát Void xâm nhập vùng rìa, đang đo đạc tần số quét radar phòng không.",
    category: "military",
    severity: "warning",
    scope: "sector",
    basePriority: 70,
    defaultDeadlineTicks: 2,
    defaultStrategyId: "strat_patrol_deterrence",
    strategies: [
      {
        id: "strat_ambush_vanguard",
        name: "Bố Trí Trận Địa Phục Kích Tiêu Diệt Gọn",
        description: "Dụ máy bay trinh sát địch vào họng súng pháo hạm phục kích sẵn.",
        cost: { logisticsSupplies: 25 },
        militaryCost: 15,
        processingTicks: 2,
        consequences: {
          threatDelta: -35,
          resourceDelta: { tacticalData: 35 },
          stabilityDelta: 8,
          message: "Phục kích hoàn hảo! Toàn bộ toán do thám bị tiêu diệt, thu về dữ liệu mã hóa.",
        },
      },
      {
        id: "strat_recon_tracking",
        name: "Bám Đuôi Thu Thập Tuyến Đường Của Địch",
        description: "Cho tàu tàng hình bám theo để định vị vị trí mẫu hạm chỉ huy.",
        cost: { tacticalData: 20 },
        processingTicks: 1,
        consequences: {
          resourceDelta: { tacticalData: 65 },
          threatDelta: -10,
          message: "Lần theo dấu vết thành công, phát hiện được vị trí căn cứ hậu cần bí mật của đối phương.",
        },
      },
      {
        id: "strat_patrol_deterrence",
        name: "Tăng Cường Tuần Tra Răn Đe Cơ Bản (Mặc Định)",
        description: "Bật đèn hiệu và tuần tra công khai xua đuổi địch.",
        cost: { logisticsSupplies: 10 },
        processingTicks: 1,
        consequences: {
          threatDelta: -10,
          message: "Toán do thám rút lui khi thấy bóng tàu tuần tra, bảo toàn an ninh căn cứ.",
        },
      },
    ],
  },

  // 20. Dị thường cảm biến cảnh báo sớm quỹ đạo
  evt_orbital_sensor_anomaly: {
    id: "evt_orbital_sensor_anomaly",
    title: "Dị Thường Cảm Biến Cảnh Báo Sớm Quỹ Đạo",
    description: "Hệ thống radar cảnh giới ghi nhận bóng ma hạm đội khổng lồ vượt ngưỡng, nghi là tín hiệu ảo hoặc công nghệ tàng hình mới.",
    category: "anomaly",
    severity: "info",
    scope: "galaxy",
    basePriority: 50,
    defaultDeadlineTicks: 3,
    defaultStrategyId: "strat_ignore_sensor_ghost",
    strategies: [
      {
        id: "strat_deep_space_array_focus",
        name: "Tập Trung Mảng Cảm Biến Quét Sâu Không Gian",
        description: "Huy động mạng lưới vệ tinh phân tích dải phổ năng lượng phát xạ.",
        cost: { energy: 35, tacticalData: 20 },
        processingTicks: 2,
        consequences: {
          resourceDelta: { tacticalData: 95 },
          threatDelta: -10,
          message: "Giải mã thành công; phân biệt rõ tín hiệu thực và bóng ma, nâng cao độ chính xác mạng lưới cảnh báo.",
        },
      },
      {
        id: "strat_rapid_filter_reset",
        name: "Khởi Động Lại Bộ Lọc Bỏ Tín Hiệu Ảo",
        description: "Tái khởi động bộ xử lý quang phổ để lọc bỏ nhiễu ion.",
        cost: { energy: 15 },
        processingTicks: 1,
        consequences: {
          stabilityDelta: 3,
          message: "Lọc nhiễu thành công, loại trừ hoàn toàn các cảnh báo giả.",
        },
      },
      {
        id: "strat_ignore_sensor_ghost",
        name: "Ghi Nhận Sai Số Tự Nhiên & Bỏ Qua (Mặc Định)",
        description: "Quy cho hiện tượng bức xạ vũ trụ và không tốn tài nguyên điều tra.",
        cost: {},
        processingTicks: 1,
        consequences: {
          message: "Ghi nhận nhật ký kỹ thuật bình thường; không có thay đổi.",
        },
      },
    ],
  },
}

/**
 * Tạo một thực thể WorldEvent từ template có sẵn
 */
export function createEventFromTemplate(
  templateId: string,
  currentTick: number,
  options?: {
    eventId?: string
    targetSectorId?: string
    customPriority?: number
    deadlineTicks?: number
    missionChainId?: string
    nodeId?: string
  }
): WorldEvent | null {
  const tpl = EVENT_TEMPLATES[templateId]
  if (!tpl) return null

  const now = typeof Date !== "undefined" ? Date.now() : 1773000000000
  const eventId = options?.eventId || `evt_${tpl.id}_${currentTick}_${Math.random().toString(36).substring(2, 7)}`
  const deadlineDuration = options?.deadlineTicks ?? tpl.defaultDeadlineTicks

  return {
    id: eventId,
    templateId: tpl.id,
    title: tpl.title,
    description: tpl.description,
    category: tpl.category,
    severity: tpl.severity,
    scope: tpl.scope,
    sectorId: options?.targetSectorId,
    status: "INIT",
    priority: options?.customPriority ?? tpl.basePriority,
    createdAtTick: currentTick,
    createdAtTimestamp: now,
    decisionDeadlineTick: currentTick + deadlineDuration,
    defaultStrategyId: tpl.defaultStrategyId,
    availableStrategies: tpl.strategies.map((s) => ({ ...s })),
    isResolved: false,
    consequencesApplied: false,
    missionChainId: options?.missionChainId,
    nodeId: options?.nodeId,
  }
}
