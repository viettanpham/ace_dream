// STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
// CANONICAL DATA ADAPTER FOR CHARACTER CATEGORY / PILOT PROFILE UI
// Nguồn canonical:
// - docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_CHARACTER_ROSTER_V2_DRAFT.md
// - docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_TRAIT_CATALOG_V2_PROPOSAL.md
// - docs/art-direction/PILOT/VALENTINE/FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md
// - docs/art-direction/PILOT/VALENTINE/valentine_assets_manifest.json

export interface BaseAttributes {
  atk: number;
  def: number;
  agi: number;
  ene: number;
  shd: number;
  luk: number;
}

export interface CharacterTrait {
  id: string;
  name: string;
  type: "Passive" | "Active" | "Signature";
  description: string;
  iconType: "medic" | "shield" | "tactical" | "agility" | "firepower";
}

export interface BasicInfoField {
  label: string;
  value: string;
}

export interface StoryChapter {
  id: string;
  number: number;
  title: string;
  status: "APPROVED" | "PROVISIONAL" | "HOLD";
  summary: string;
  content?: string;
  quote?: string;
}

export interface GalleryArtwork {
  id: string;
  title: string;
  category: "base" | "costume" | "activity" | "event" | "portrait";
  path: string;
  isAvailableOnDisk: boolean;
  status: "verified_webp" | "archive_pending";
  description?: string;
  dimensions?: { width: number; height: number };
}

export interface CharacterProfileV2 {
  id: string;
  classCharacterName: string;
  fullLoreName: string;
  callsign: string;
  title: string;
  gender: "Nam" | "Nữ";
  age: number;
  role: string;
  roleCategory: "all" | "attack" | "defense" | "support" | "special";
  tags: string[];
  characterQuote: string;
  shortDescription: string;
  baseAttributes: BaseAttributes;
  traits: CharacterTrait[];
  basicInfo: BasicInfoField[];
  fullbodyAssetPath: string;
  portraitAssetPath: string;
  storySummary: string;
  chapters: StoryChapter[];
  artworks: GalleryArtwork[];
}

// 12 Archetypes chuẩn FND-8 (4 Nam / 8 Nữ) — Tổng thuộc tính mỗi nhân vật đúng 20 điểm
export const V2_ROSTER_CHARACTERS: CharacterProfileV2[] = [
  {
    id: "valentine",
    classCharacterName: "Valentine",
    fullLoreName: "Valentine Aurelia Vance",
    callsign: "Mercy Wing",
    title: "Ánh Sáng Cuối Cùng (The Last Light)",
    gender: "Nữ",
    age: 24,
    role: "Quân Y Chiến Trường (Combat Medic) · Cứu Hộ (Rescue)",
    roleCategory: "support",
    tags: ["Medic", "Rescue", "SHD + ENE", "Support"],
    characterQuote: "“Chừng nào còn một tín hiệu cầu cứu, tôi sẽ không bỏ lại ai phía sau.”",
    shortDescription: "Một nữ phi công cứu hộ luôn nở nụ cười dịu dàng, ngay cả khi bản thân cô vẫn chưa tha thứ cho một quyết định trong quá khứ.",
    baseAttributes: {
      atk: 2,
      def: 2,
      agi: 2,
      ene: 6,
      shd: 6,
      luk: 2,
    },
    traits: [
      {
        id: "pilot_trait_field_medic",
        name: "Bàn Tay Cứu Hộ",
        type: "Passive",
        description: "+30% hiệu quả hồi phục Medic khi kích hoạt kỹ năng hỗ trợ đồng đội.",
        iconType: "medic",
      },
      {
        id: "pilot_trait_safeguard",
        name: "Mái Khiên Nhân Ái",
        type: "Passive",
        description: "+30% Shield Recovery từ kỹ năng hỗ trợ, tái tạo trường lực tức thì.",
        iconType: "shield",
      },
    ],
    basicInfo: [
      { label: "Giới tính / Tuổi", value: "Nữ · 24 tuổi" },
      { label: "Tên đầy đủ", value: "Valentine Aurelia Vance" },
      { label: "Callsign", value: "Mercy Wing" },
      { label: "Xuất thân", value: "Khu dân cư y tế quỹ đạo Elysia" },
      { label: "Đào tạo", value: "Học viện Quân y Không gian" },
      { label: "Chuyên môn", value: "Cứu hộ, hồi phục, hỗ trợ khiên" },
      { label: "Tính cách", value: "Ấm áp, kiên trì, giàu lòng trắc ẩn" },
      { label: "Điểm yếu", value: "Khó chấp nhận việc phải bỏ lại người khác" },
      { label: "Ước mơ", value: "Không một tín hiệu cầu cứu nào bị lãng quên" },
    ],
    fullbodyAssetPath: "/images/valentine-fullbody.webp",
    portraitAssetPath: "/images/valentine-portrait.webp",
    storySummary:
      "Valentine sinh ra ở vành đai quỹ đạo Elysia, nơi các đoàn tàu y tế thường xuyên đi qua những tuyến biên giới nguy hiểm. Cô trưởng thành trong môi trường cứu hộ và tin rằng sức mạnh của người phi công nằm ở số người có thể đưa trở về an toàn.",
    chapters: [
      {
        id: "chap-01",
        number: 1,
        title: "Ánh sáng cuối cùng tại Elysia",
        status: "APPROVED",
        summary: "Quyết định định mệnh giữa đoàn tàu hàng trăm bệnh nhân và đội ngũ đồng đội bị cô lập.",
        quote: "“Tôi không hứa rằng mọi người sẽ không bị thương. Nhưng tôi hứa sẽ làm tất cả những gì có thể để đưa họ trở về.”",
        content: `Elysia từng là một khu dân cư quỹ đạo nổi tiếng bởi những trung tâm y tế và hành lang vận tải nhân đạo. Valentine lớn lên giữa tiếng động cơ tàu cứu thương, những ca trực kéo dài của mẹ và những câu chuyện về người cha thường xuyên đi cùng các đoàn cứu trợ xa xôi.

Từ nhỏ, cô đã tin rằng cứu một sinh mạng không chỉ là chữa lành vết thương, mà còn là cho người đó cơ hội trở về với gia đình.

Sau khi tốt nghiệp Học viện Quân y Không gian, Valentine gia nhập một đơn vị cứu hộ chiến trường. Khác với nhiều phi công tìm kiếm chiến thắng hoặc danh tiếng, cô quan tâm nhiều hơn đến số người trở về sau mỗi nhiệm vụ. Đồng đội thường nhớ đến nụ cười bình thản của cô, kể cả giữa những tình huống nguy hiểm nhất.

Rồi một cuộc sơ tán quy mô lớn tại Elysia đã thay đổi mọi thứ.

Trong lúc tuyến phòng thủ sụp đổ, Valentine nhận được hai tín hiệu cầu cứu cùng một thời điểm. Một đến từ đoàn vận tải chở hàng trăm bệnh nhân; tín hiệu còn lại phát ra từ một nhóm đồng đội đang mắc kẹt trong khu vực bị phong tỏa bức xạ.

Không còn đủ thời gian và nhiên liệu cho cả hai chuyến bay, cô phải đưa ra lựa chọn cứu đoàn vận tải.

Hàng trăm người đã sống sót trở về đất liền. Nhưng nhóm đồng đội kia không bao giờ trở về nữa.

Valentine được trao bằng khen danh dự vì quyết định kiên định ấy. Nhưng cô chưa từng trưng bày nó trong phòng truyền thống.

Từ đó, Valentine chuyên sâu nghiên cứu công nghệ hồi phục chiến trường và vận hành trường lực khiên cứu hộ. Cô hiểu rằng mình không thể sửa chữa quá khứ đau thương, nhưng tin rằng mỗi sinh mạng được cứu hôm nay chính là lý do xứng đáng nhất để tiếp tục xuất kích.`,
      },
      {
        id: "chap-02",
        number: 2,
        title: "Ca trực đầu tiên tại Trạm Cứu hộ Quỹ đạo",
        status: "APPROVED",
        summary: "Thử thách đầu tiên khi tiếp quản buồng lái tàu cứu thương bọc thép trong cơn bão điện từ.",
      },
      {
        id: "chap-03",
        number: 3,
        title: "Tín hiệu bị cô lập ở Vành đai Asteroid",
        status: "APPROVED",
        summary: "Hành trình đơn độc vượt qua bãi mảnh vỡ để cứu sống một phi công tiêm kích bị trúng đạn.",
      },
      {
        id: "chap-04",
        number: 4,
        title: "Lằn ranh đỏ giữa hai mệnh lệnh",
        status: "APPROVED",
        summary: "Sự giằng xé giữa quy tắc quân sự và lương tâm của một bác sĩ cứu trợ tiền tuyến.",
      },
      {
        id: "chap-05",
        number: 5,
        title: "Học viện Y sinh Không gian và Lời thề",
        status: "PROVISIONAL",
        summary: "Những năm tháng rèn luyện nghiêm ngặt trước khi khoác lên mình bộ giáp Mercy Wing.",
      },
      {
        id: "chap-06",
        number: 6,
        title: "Chuyến bay thử nghiệm của Mercy Wing",
        status: "PROVISIONAL",
        summary: "Giai đoạn thử nghiệm hệ thống khiên năng lượng tái tạo kép trên nguyên mẫu mecha y tế.",
      },
      {
        id: "chap-07",
        number: 7,
        title: "Bí mật bên dưới tầng ngầm Elysia",
        status: "HOLD",
        summary: "Hồ sơ niêm phong cấp độ II. Chưa mở khóa nội dung.",
      },
      {
        id: "chap-08",
        number: 8,
        title: "Bức màn che phủ cuộc sơ tán",
        status: "HOLD",
        summary: "Hồ sơ niêm phong cấp độ II. Chưa mở khóa nội dung.",
      },
      {
        id: "chap-09",
        number: 9,
        title: "Đối đầu trong giông bão",
        status: "HOLD",
        summary: "Hồ sơ niêm phong cấp độ III. Chưa mở khóa nội dung.",
      },
      {
        id: "chap-10",
        number: 10,
        title: "Nguyện ước không bao giờ lãng quên",
        status: "HOLD",
        summary: "Hồ sơ niêm phong cấp độ tối cao. Chưa mở khóa nội dung.",
      },
    ],
    artworks: [
      {
        id: "valentine-fullbody",
        title: "Tranh Toàn Thân Chiến Trường (Official)",
        category: "base",
        path: "/images/valentine-fullbody.webp",
        isAvailableOnDisk: true,
        status: "verified_webp",
        description: "Thiết kế toàn thân trang phục quân y chiến trường Mercy Wing chính thức.",
      },
      {
        id: "valentine-portrait",
        title: "Chân Dung Đại Diện (Portrait)",
        category: "portrait",
        path: "/images/valentine-portrait.webp",
        isAvailableOnDisk: true,
        status: "verified_webp",
        description: "Chân dung tỉ lệ 1:1 góc nhìn cận cảnh khuôn mặt dịu dàng và ánh mắt kiên định.",
      },
      // 28 tác phẩm trong manifest chưa có file vật lý — gắn nhãn archive_pending
      {
        id: "valentine-activity-001",
        title: "Trực Ca Phòng Khám Quỹ Đạo",
        category: "activity",
        path: "/images/valentine-activity-001.webp",
        isAvailableOnDisk: false,
        status: "archive_pending",
        description: "Khoảnh khắc chăm sóc bệnh nhân tại trạm y tế Elysia.",
      },
      {
        id: "valentine-casual",
        title: "Trang Phục Thường Nhật Elysia",
        category: "costume",
        path: "/images/valentine-casual.webp",
        isAvailableOnDisk: false,
        status: "archive_pending",
        description: "Áo len cổ lọ và áo khoác thường phục trong ngày nghỉ phép.",
      },
      {
        id: "valentine-closeup",
        title: "Góc Nhìn Cận Cảnh Chiến Thuật",
        category: "portrait",
        path: "/images/valentine-closeup.webp",
        isAvailableOnDisk: false,
        status: "archive_pending",
        description: "Kính bảo hộ hiển thị dữ liệu sinh học trong lúc phẫu thuật khẩn.",
      },
      {
        id: "valentine-combat",
        title: "Xuất Kích Cứu Hộ Tiền Tuyến",
        category: "base",
        path: "/images/valentine-combat.webp",
        isAvailableOnDisk: false,
        status: "archive_pending",
        description: "Tư thế kích hoạt trường lực khiên che chắn cho đồng đội.",
      },
      {
        id: "valentine-event-001",
        title: "Dạ Tiệc Vũ Trụ Xa Hoa Sắc Đỏ",
        category: "event",
        path: "/images/valentine-event-001.webp",
        isAvailableOnDisk: false,
        status: "archive_pending",
        description: "Trang phục dạ hội lộng lẫy trong lễ kỷ niệm hòa bình của Liên minh Elysia.",
      },
      {
        id: "valentine-event-002",
        title: "Lễ Trao Bằng Khen Cứu Hộ",
        category: "event",
        path: "/images/valentine-event-002.webp",
        isAvailableOnDisk: false,
        status: "archive_pending",
        description: "Lễ vinh danh sự hy sinh thầm lặng của phi đội Mercy Wing.",
      },
      {
        id: "valentine-story-001",
        title: "Tia Nắng Sau Bão Elysia",
        category: "activity",
        path: "/images/valentine-story-001.webp",
        isAvailableOnDisk: false,
        status: "archive_pending",
        description: "Bản vẽ minh họa cảnh sau cuộc sơ tán trạm y tế.",
      },
      {
        id: "valentine-story-002",
        title: "Tín Hiệu Cầu Cứu Cuối Cùng",
        category: "activity",
        path: "/images/valentine-story-002.webp",
        isAvailableOnDisk: false,
        status: "archive_pending",
        description: "Màn hình radar buồng lái ghi nhận tần số cầu cứu đơn độc.",
      },
      {
        id: "valentine-hangar-001",
        title: "Kiểm Tra Hệ Thống Cơ Giáp",
        category: "activity",
        path: "/images/valentine-hangar-001.webp",
        isAvailableOnDisk: false,
        status: "archive_pending",
        description: "Valentine cùng kỹ thuật viên kiểm tra bộ điều áp khiên tại Hangar.",
      },
      {
        id: "valentine-medic-002",
        title: "Trường Khiên Bảo Hộ Đồng Minh",
        category: "base",
        path: "/images/valentine-medic-002.webp",
        isAvailableOnDisk: false,
        status: "archive_pending",
        description: "Hiệu ứng quang học phát tán trường lực năng lượng xanh ngọc bảo vệ đồng đội.",
      },
    ],
  },
  {
    id: "kaelen",
    classCharacterName: "Kaelen",
    fullLoreName: "Kaelen Vance",
    callsign: "Shadow Veil",
    title: "Bóng Đêm Thầm Lặng",
    gender: "Nữ",
    age: 26,
    role: "Tình Báo & Trinh Sát (Intelligence & Recon)",
    roleCategory: "special",
    tags: ["Intel", "Evasion", "LUK + AGI"],
    characterQuote: "“Thông tin chính xác là vũ khí hủy diệt nguy hiểm hơn mọi loại đạn pháo.”",
    shortDescription: "Chuyên viên tình báo lạnh lùng, luôn tính toán mọi bước đi trước khi đối phương nhận ra sự hiện diện của mình.",
    baseAttributes: { atk: 2, def: 2, agi: 6, ene: 3, shd: 2, luk: 5 },
    traits: [
      {
        id: "trait_recon_sweep",
        name: "Quét Bức Xạ Ẩn",
        type: "Passive",
        description: "Tăng 25% tỷ lệ né tránh và phát hiện điểm yếu mục tiêu.",
        iconType: "tactical",
      },
    ],
    basicInfo: [
      { label: "Giới tính / Tuổi", value: "Nữ · 26 tuổi" },
      { label: "Chuyên môn", value: "Thu thập tình báo, né tránh, gây nhiễu" },
    ],
    fullbodyAssetPath: "/images/kaelen-fullbody.webp",
    portraitAssetPath: "/images/kaelen-portrait.webp",
    storySummary: "Hồ sơ lưu trữ tình báo chiến lược.",
    chapters: [],
    artworks: [],
  },
  {
    id: "alviss",
    classCharacterName: "Alviss",
    fullLoreName: "Alviss Thorne",
    callsign: "Sky Strider",
    title: "Tiên Phong Tốc Độ (Fighter Ace)",
    gender: "Nam",
    age: 22,
    role: "Tác Chiến Cơ Động Không Gian (Offensive Aerial Agility)",
    roleCategory: "attack",
    tags: ["Fighter", "Agility", "ATK + AGI"],
    characterQuote: "“Tốc độ là chân lý trên bầu trời.”",
    shortDescription: "Tay lái tiêm kích trẻ tuổi, tự tin và luôn tìm kiếm giới hạn cơ động cao nhất của cơ giáp.",
    baseAttributes: { atk: 6, def: 2, agi: 6, ene: 2, shd: 2, luk: 2 },
    traits: [
      {
        id: "trait_supersonic_dash",
        name: "Lướt Siêu Âm",
        type: "Passive",
        description: "+20% tốc độ hành trình và khả năng chuyển hướng đột ngột.",
        iconType: "agility",
      },
    ],
    basicInfo: [
      { label: "Giới tính / Tuổi", value: "Nam · 22 tuổi" },
      { label: "Chuyên môn", value: "Không chiến cơ động, tập kích chớp nhoáng" },
    ],
    fullbodyAssetPath: "/images/alviss-fullbody.webp",
    portraitAssetPath: "/images/alviss-portrait.webp",
    storySummary: "Hồ sơ phi công tiêm kích xuất sắc.",
    chapters: [],
    artworks: [],
  },
  {
    id: "victor",
    classCharacterName: "Victor",
    fullLoreName: "Victor Stone",
    callsign: "Iron Bastion",
    title: "Tường Thành Vững Chắc (Heavy Defender)",
    gender: "Nam",
    age: 42,
    role: "Phòng Thủ Hạng Nặng (Armored Defense / Shielding)",
    roleCategory: "defense",
    tags: ["Defender", "Shield", "DEF + SHD"],
    characterQuote: "“Đứng sau lưng tôi, không một viên đạn nào có thể xuyên qua.”",
    shortDescription: "Chiến binh kỳ cựu mang giáp hạng nặng, là trụ cột vững chắc của mọi đội hình tác chiến.",
    baseAttributes: { atk: 2, def: 6, agi: 2, ene: 2, shd: 6, luk: 2 },
    traits: [
      {
        id: "trait_iron_fortress",
        name: "Pháo Đài Bất Khả Xâm Phạm",
        type: "Passive",
        description: "Giảm 30% sát thương đạn đạo trực diện lên giáp chính.",
        iconType: "shield",
      },
    ],
    basicInfo: [
      { label: "Giới tính / Tuổi", value: "Nam · 42 tuổi" },
      { label: "Chuyên môn", value: "Bảo hộ đội hình, chống chịu hỏa lực cực hạn" },
    ],
    fullbodyAssetPath: "/images/victor-fullbody.webp",
    portraitAssetPath: "/images/victor-portrait.webp",
    storySummary: "Hồ sơ chỉ huy phòng thủ tiền tuyến.",
    chapters: [],
    artworks: [],
  },
  {
    id: "eric",
    classCharacterName: "Eric",
    fullLoreName: "Eric Cross",
    callsign: "Thunder Cannon",
    title: "Hỏa Lực Tuyệt Đối (Artillery Specialist)",
    gender: "Nam",
    age: 30,
    role: "Pháo Binh Hạng Nặng (Heavy Frontal Firepower)",
    roleCategory: "attack",
    tags: ["Artillery", "Assault", "ATK"],
    characterQuote: "“Phạm vi sát thương chính là vùng an toàn.”",
    shortDescription: "Chuyên gia xạ kích pháo kích trường cự ly, sở hữu năng lực xuyên phá công sự kẻ thù từ khoảng cách xa.",
    baseAttributes: { atk: 7, def: 3, agi: 3, ene: 3, shd: 2, luk: 2 },
    traits: [
      {
        id: "trait_siege_cannon",
        name: "Công Thành Pháo",
        type: "Passive",
        description: "+25% sát thương lên giáp năng lượng và kiến trúc cố định.",
        iconType: "firepower",
      },
    ],
    basicInfo: [
      { label: "Giới tính / Tuổi", value: "Nam · 30 tuổi" },
      { label: "Chuyên môn", value: "Pháo hạng nặng, oanh tạc diện rộng" },
    ],
    fullbodyAssetPath: "/images/eric-fullbody.webp",
    portraitAssetPath: "/images/eric-portrait.webp",
    storySummary: "Hồ sơ chỉ huy hỏa lực pháo binh.",
    chapters: [],
    artworks: [],
  },
  {
    id: "selena",
    classCharacterName: "Selena",
    fullLoreName: "Selena Solaris",
    callsign: "Plasma Nova",
    title: "Pháp Sư Năng Lượng (Energy Artillery)",
    gender: "Nữ",
    age: 27,
    role: "Hỏa Lực Năng Lượng Vũ Trụ (Combat Caster)",
    roleCategory: "attack",
    tags: ["Energy", "Caster", "ATK + ENE"],
    characterQuote: "“Dòng chảy năng lượng plasma sẽ thiêu rụi mọi chướng ngại.”",
    shortDescription: "Nữ phi công mang dòng máu quý tộc không gian, sở hữu khả năng điều khiển chùm plasma chuẩn xác đến từng milimet.",
    baseAttributes: { atk: 6, def: 2, agi: 2, ene: 6, shd: 2, luk: 2 },
    traits: [
      {
        id: "trait_plasma_surge",
        name: "Quá Tải Plasma",
        type: "Passive",
        description: "+20% sát thương nguyên tố năng lượng và giảm 15% thời gian hồi tụ năng.",
        iconType: "firepower",
      },
    ],
    basicInfo: [
      { label: "Giới tính / Tuổi", value: "Nữ · 27 tuổi" },
      { label: "Chuyên môn", value: "Chùm hạt ion, pháo plasma định hướng" },
    ],
    fullbodyAssetPath: "/images/selena-fullbody.webp",
    portraitAssetPath: "/images/selena-portrait.webp",
    storySummary: "Hồ sơ nữ xạ thủ năng lượng cao cấp.",
    chapters: [],
    artworks: [],
  },
  {
    id: "marcus",
    classCharacterName: "Marcus",
    fullLoreName: "Marcus Vance",
    callsign: "Aegis Commander",
    title: "Chỉ Huy Tác Chiến (Offensive / Defensive Tactics)",
    gender: "Nam",
    age: 28,
    role: "Chiến Thuật Toàn Diện (Balanced Commander)",
    roleCategory: "all",
    tags: ["Commander", "Balanced", "ATK + DEF"],
    characterQuote: "“Kỷ luật thép và chiến thuật chuẩn xác định đoạt chiến trường.”",
    shortDescription: "Sĩ quan chỉ huy mẫu mực của lực lượng Starfront, cân bằng hoàn hảo giữa tấn công vũ bão và phòng ngự kiên cố.",
    baseAttributes: { atk: 6, def: 6, agi: 2, ene: 2, shd: 2, luk: 2 },
    traits: [
      {
        id: "trait_tactical_command",
        name: "Lãnh Đạo Tác Chiến",
        type: "Passive",
        description: "+15% sức mạnh toàn diện cho bản thân và phân đội đồng hành.",
        iconType: "tactical",
      },
    ],
    basicInfo: [
      { label: "Giới tính / Tuổi", value: "Nam · 28 tuổi" },
      { label: "Chuyên môn", value: "Chỉ huy chiến dịch, điều phối hạm đội" },
    ],
    fullbodyAssetPath: "/images/marcus-fullbody.webp",
    portraitAssetPath: "/images/marcus-portrait.webp",
    storySummary: "Hồ sơ chỉ huy trưởng lực lượng cơ động.",
    chapters: [],
    artworks: [],
  },
  {
    id: "lyra",
    classCharacterName: "Lyra",
    fullLoreName: "Lyra Swift",
    callsign: "Valkyrie Wind",
    title: "Cánh Nhạn Tinh Vân (Pure Agility)",
    gender: "Nữ",
    age: 21,
    role: "Đột Kích & Né Tránh Cực Hạn (Agility & Evasion)",
    roleCategory: "special",
    tags: ["Agility", "Evasion", "AGI"],
    characterQuote: "“Chạm vào tôi trước khi nghĩ đến việc bắn trúng!”",
    shortDescription: "Nữ phi công năng động và tinh nghịch, có phản xạ giác quan siêu việt vượt xa người bình thường.",
    baseAttributes: { atk: 3, def: 2, agi: 7, ene: 3, shd: 2, luk: 3 },
    traits: [
      {
        id: "trait_reflex_burst",
        name: "Phản Xạ Cực Độ",
        type: "Passive",
        description: "+30% tỷ lệ né tránh hoàn toàn phát bắn đầu tiên mỗi lượt.",
        iconType: "agility",
      },
    ],
    basicInfo: [
      { label: "Giới tính / Tuổi", value: "Nữ · 21 tuổi" },
      { label: "Chuyên môn", value: "Cơ động né tránh, quấy rối đội hình" },
    ],
    fullbodyAssetPath: "/images/lyra-fullbody.webp",
    portraitAssetPath: "/images/lyra-portrait.webp",
    storySummary: "Hồ sơ nữ phi công cơ động xuất sắc.",
    chapters: [],
    artworks: [],
  },
  {
    id: "fortuna",
    classCharacterName: "Fortuna",
    fullLoreName: "Fortuna Gold",
    callsign: "Lady Luck",
    title: "Nữ Hoàng Cơ Hội (Luck & Strategic Opportunism)",
    gender: "Nữ",
    age: 29,
    role: "Chiến Lược Gia Tình Báo (Strategic Intelligence)",
    roleCategory: "special",
    tags: ["Luck", "Intel", "LUK"],
    characterQuote: "“Vận may luôn đứng về phía người nắm giữ lá bài tẩy.”",
    shortDescription: "Nhà ngoại giao và tình báo kỳ cựu với phong cách trang nhã nhưng đầy mưu lược sắc sảo.",
    baseAttributes: { atk: 3, def: 2, agi: 4, ene: 3, shd: 2, luk: 6 },
    traits: [
      {
        id: "trait_jackpot_strike",
        name: "Thời Cơ Vàng",
        type: "Passive",
        description: "+30% cơ hội nhân đôi hiệu ứng đòn đánh hoặc nhận thêm tài nguyên.",
        iconType: "tactical",
      },
    ],
    basicInfo: [
      { label: "Giới tính / Tuổi", value: "Nữ · 29 tuổi" },
      { label: "Chuyên môn", value: "Đàm phán chiến lược, khai thác sơ hở" },
    ],
    fullbodyAssetPath: "/images/fortuna-fullbody.webp",
    portraitAssetPath: "/images/fortuna-portrait.webp",
    storySummary: "Hồ sơ điệp viên và cố vấn chiến lược cấp cao.",
    chapters: [],
    artworks: [],
  },
  {
    id: "aria",
    classCharacterName: "Aria",
    fullLoreName: "Aria Blue",
    callsign: "Sky Harmonizer",
    title: "Điều Phối Tác Chiến (Tactical Support)",
    gender: "Nữ",
    age: 23,
    role: "Điều Phối Bay & Tiếp Vận (Flight Coordination)",
    roleCategory: "support",
    tags: ["Support", "Flight", "AGI + ENE"],
    characterQuote: "“Đội hình chuẩn xác sẽ tạo nên bản giao hưởng chiến thắng.”",
    shortDescription: "Sĩ quan điều hành bay rạng rỡ và nhiệt huyết, luôn giữ liên lạc thông suốt cho toàn bộ phi đội.",
    baseAttributes: { atk: 2, def: 2, agi: 5, ene: 6, shd: 3, luk: 2 },
    traits: [
      {
        id: "trait_radar_sync",
        name: "Đồng Bộ Radar",
        type: "Passive",
        description: "+20% độ chính xác cho toàn bộ đồng minh trong bán kính hỗ trợ.",
        iconType: "tactical",
      },
    ],
    basicInfo: [
      { label: "Giới tính / Tuổi", value: "Nữ · 23 tuổi" },
      { label: "Chuyên môn", value: "Điều hướng không gian, tiếp tế năng lượng" },
    ],
    fullbodyAssetPath: "/images/aria-fullbody.webp",
    portraitAssetPath: "/images/aria-portrait.webp",
    storySummary: "Hồ sơ sĩ quan điều phối bay.",
    chapters: [],
    artworks: [],
  },
  {
    id: "rhea",
    classCharacterName: "Rhea",
    fullLoreName: "Rhea Aegis",
    callsign: "Vanguard Sentinel",
    title: "Hộ Vệ Tiên Phong (Escort Command)",
    gender: "Nữ",
    age: 31,
    role: "Hộ Tống & Cơ Động Phòng Thủ (Dynamic Defense)",
    roleCategory: "defense",
    tags: ["Escort", "Defense", "DEF + AGI"],
    characterQuote: "“Mệnh lệnh hộ tống là lời thề danh dự.”",
    shortDescription: "Nữ vệ binh kiên cường chuyên bảo vệ các đoàn tàu vận tải quân sự qua những vùng chiến sự ác liệt.",
    baseAttributes: { atk: 2, def: 6, agi: 5, ene: 2, shd: 3, luk: 2 },
    traits: [
      {
        id: "trait_guardian_dash",
        name: "Can Thiệp Tốc Độ",
        type: "Passive",
        description: "Lập tức dịch chuyển che chắn đòn chí mạng cho mục tiêu yếu máu.",
        iconType: "shield",
      },
    ],
    basicInfo: [
      { label: "Giới tính / Tuổi", value: "Nữ · 31 tuổi" },
      { label: "Chuyên môn", value: "Hộ tống đoàn tàu, đánh chặn tên lửa" },
    ],
    fullbodyAssetPath: "/images/rhea-fullbody.webp",
    portraitAssetPath: "/images/rhea-portrait.webp",
    storySummary: "Hồ sơ hộ vệ chỉ huy kỳ cựu.",
    chapters: [],
    artworks: [],
  },
  {
    id: "nova",
    classCharacterName: "Nova",
    fullLoreName: "Nova Spark",
    callsign: "Solar Comet",
    title: "Đột Kích Thử Nghiệm (Assault Raider)",
    gender: "Nữ",
    age: 22,
    role: "Thử Nghiệm Vũ Khí & Đột Phá (Experimental Assault)",
    roleCategory: "attack",
    tags: ["Raider", "Assault", "ATK + LUK"],
    characterQuote: "“Nếu thiết bị chưa phát nổ, nghĩa là công suất vẫn còn có thể tăng!”",
    shortDescription: "Phi công thử nghiệm nổi loạn và sáng tạo, ưa thích cầm lái các nguyên mẫu mecha nguy hiểm nhất.",
    baseAttributes: { atk: 6, def: 2, agi: 3, ene: 2, shd: 2, luk: 5 },
    traits: [
      {
        id: "trait_overclock_ram",
        name: "Xung Nhịp Quá Tải",
        type: "Passive",
        description: "+25% tỷ lệ bạo kích khi điều khiển vũ khí nguyên mẫu ở mức năng lượng cao.",
        iconType: "firepower",
      },
    ],
    basicInfo: [
      { label: "Giới tính / Tuổi", value: "Nữ · 22 tuổi" },
      { label: "Chuyên môn", value: "Đột phá phòng tuyến, thử nghiệm khí tài mới" },
    ],
    fullbodyAssetPath: "/images/nova-fullbody.webp",
    portraitAssetPath: "/images/nova-portrait.webp",
    storySummary: "Hồ sơ phi công thử nghiệm công nghệ cao.",
    chapters: [],
    artworks: [],
  },
];

// Hàm truy xuất dữ liệu nhân vật V2 an toàn
export function getCharacterProfileById(id: string): CharacterProfileV2 {
  const found = V2_ROSTER_CHARACTERS.find((c) => c.id === id);
  return found || V2_ROSTER_CHARACTERS[0]; // Mặc định trả về Valentine
}

// Bảng màu cho 6 chỉ số thuộc tính theo concept đã duyệt
export const ATTRIBUTE_COLOR_CONFIG: Record<
  keyof BaseAttributes,
  { label: string; colorClass: string; barBg: string; textClass: string; icon: string }
> = {
  atk: {
    label: "ATK",
    colorClass: "bg-red-500",
    barBg: "bg-red-950/60",
    textClass: "text-red-400",
    icon: "⚔️",
  },
  def: {
    label: "DEF",
    colorClass: "bg-cyan-500",
    barBg: "bg-cyan-950/60",
    textClass: "text-cyan-400",
    icon: "🛡️",
  },
  agi: {
    label: "AGI",
    colorClass: "bg-emerald-500",
    barBg: "bg-emerald-950/60",
    textClass: "text-emerald-400",
    icon: "⚡",
  },
  ene: {
    label: "ENE",
    colorClass: "bg-amber-500",
    barBg: "bg-amber-950/60",
    textClass: "text-amber-400",
    icon: "🔋",
  },
  shd: {
    label: "SHD",
    colorClass: "bg-purple-500",
    barBg: "bg-purple-950/60",
    textClass: "text-purple-400",
    icon: "🔷",
  },
  luk: {
    label: "LUK",
    colorClass: "bg-fuchsia-500",
    barBg: "bg-fuchsia-950/60",
    textClass: "text-fuchsia-400",
    icon: "✨",
  },
};
