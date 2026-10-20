# STARFRONT — Official Art Direction & Visual Standards
*Tài Liệu Tiêu Chuẩn Nghệ Thuật & Quy Chuẩn Đồ Họa Master — Dự Án STARFRONT*  
*Document Version: 3.3 — Cập nhật: Tháng 10/2026*  
*Status: Tiêu Chuẩn Nghệ Thuật Chính Thức Được Phê Duyệt Toàn Diện (Approved Official Standard)*

---

## 1. TỔNG QUAN & TẦM NHÌN NGHỆ THUẬT CỐT LÕI (CORE ART DIRECTION VISION)

**STARFRONT** là tựa game nhập vai chiến thuật theo lượt (Tactical Turn-Based Sci-Fi RPG) kết hợp tác chiến không gian và cơ giáp (Mecha). Bản sắc thị giác của STARFRONT được xây dựng trên **khung thẩm mỹ hai trụ cột (Dual-Pillar Aesthetic Framework)** bất biến:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        STARFRONT MASTER ART DIRECTION FRAMEWORK                        │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
     [ TRỤ CỘT 1: THAM CHIẾU THIẾT KẾ GEAR ]         [ TRỤ CỘT 2: MINH HỌA NHÂN VẬT ANIME ]
     - High-Tech 3D Aerospace Mecha Concept Art      - Premium Japanese Anime Character Art
     - Định hình ngôn ngữ công nghệ & vật liệu       - Gương mặt anime tinh xảo, mắt có hồn
     - Độ phức tạp cơ khí, ống đẩy & giáp mạ         - Nét vẽ sắc mảnh, đổ bóng cel-shading
     - Bảng màu năng lượng & ánh sáng đặc trưng      - Quân phục phi công & giáp chiến sci-fi
     - Kim chỉ nam thị giác cho toàn bộ thế giới     - Dáng đứng tự tin, bản sắc rõ rệt
```

### Tuyên Ngôn Nghệ Thuật (Artistic Mandate)
1. **Phong cách nhân vật**: Toàn bộ phi công STARFRONT phải được thể hiện dưới phong cách **Minh Họa Anime Khoa Học Viễn Tưởng Cao Cấp (Premium Japanese Anime Sci-Fi Illustration)** tương đương key art của các game anime RPG đỉnh cao (*Honkai: Star Rail*, *Arknights*, *Genshin Impact*, *Gundam*).
2. **Tham chiếu thiết kế**: Hình ảnh **GEAR hiện có** là kim chỉ nam duy nhất xác định cấp độ công nghệ, vật liệu giáp, màu sắc năng lượng và phong thái viễn tưởng.
3. **Quy định số lượng Asset**: Mỗi phi công bắt buộc phải có đủ **02 định dạng ảnh raster chuẩn**: **Ảnh Chân Dung (Portrait 1:1)** và **Ảnh Toàn Thân (Full-Body 9:16)**. Với 8 phi công, hệ thống yêu cầu đúng **16 image assets** chuẩn.
4. **Bảo toàn dữ liệu**: Tuyệt đối không thay thế ảnh bằng pixel art, retro sprite, hình vẽ SVG/CSS, canvas code hay placeholder dạng khối.

---

## 2. TRỤ CỘT 1: SỬ DỤNG HÌNH ẢNH GEAR HIỆN CÓ LÀM THAM CHIẾU THIẾT KẾ

Ba tác phẩm nghệ thuật GEAR hiện có (`vanguard-gear.jpg`, `falcon-gear.jpg`, `aegis-gear.jpg`) là **nguồn tham chiếu thị giác tối cao và duy nhất (Canonical Source of Truth)** cho toàn bộ thiết kế cơ khí, giáp trụ và ánh sáng trong STARFRONT.

Mọi bộ quân phục phi công (flight suit), giáp ngoại khung (exosuit), vũ khí cầm tay, kính ngắm chiến thuật (HUD visor) hay thiết bị cấy ghép điều khiển học (cybernetics) đều phải kế thừa trực tiếp vật liệu, chi tiết cơ khí và tông màu năng lượng từ 3 dòng GEAR này.

### 2.1. Ba Dòng Cơ Giáp GEAR Tham Chiếu & Phân Bổ Phi Công

#### 1. Vanguard GEAR (`/public/images/vanguard-gear.jpg`) — Fleet Command & Balanced Superiority
- **Bảng Màu Chủ Đạo**: Tactical Cyan (`#06b6d4`), Arctic Ice-Blue (`#38bdf8`), Deep Navy (`#0f172a`), Matte Titanium Grey (`#334155`).
- **Ngôn Ngữ Cơ Khí**: Giáp phiến composite đa góc khí động học, pháo xung photon kép, ống xả ion phát vệt plasma xanh lam rực rỡ, đường dẫn năng lượng cyan chạy dọc thân.
- **Tham Chiếu Phi Công**:
  - **Marcus Thorne** (Chỉ huy trưởng): Giáp ngực titanium đen nhám viền cyan plasma, súng trường xung lực tích hợp hộp đạn năng lượng cyan.
  - **Eric Brandt** (Pháo thủ công phá): Cánh tay cơ khí trợ lực Gauss, giáp vai hạng nặng chống giật, kính ngắm laser tầm xa màu cyan.
  - **Selena Cross** (Sĩ quan chùm năng lượng): Quân phục chỉ huy cao cấp với cầu vai phát sáng cyan, pháo hội tụ photon cầm tay tinh gọn.

#### 2. Falcon GEAR (`/public/images/falcon-gear.jpg`) — Supersonic Interceptor & Precision Strike
- **Bảng Màu Chủ Đạo**: Cyber Violet / Neon Purple (`#a855f7`), Dark Amethyst (`#7e22ce`), Obsidian Carbon Fiber bóng (`#09090b`), Vivid Magenta Tracers (`#d946ef`), Teal accents (`#14b8a6`).
- **Ngôn Ngữ Cơ Khí**: Cánh tam giác quét ngược siêu thanh, góc cạnh tán xạ radar tàng hình chiseled sắc lẹm, buồng đốt proton kép, lưỡi dao năng lượng tần số cao.
- **Tham Chiếu Phi Công**:
  - **Alviss Drake** (Át chủ bài siêu thanh): Bộ đồ bay High-G ôm sát khí động học, giáp cổ carbon sợi tím neon, mũ bay tích hợp hiển thị gia tốc.
  - **Lyra Vance** (Nữ kiếm sĩ cơ động): Bộ giáp linh hoạt trọng lượng nhẹ, ống đẩy mini ở lưng, cặp kiếm plasma tần số cao ánh tím neon.
  - **Kaelen Voss** (Hacker chiến tranh điện tử): Bộ đồ tàng hình sợi nano tối màu, giao diện hologram đa lớp tím viền xanh ngọc bích, thiết bị quét tín hiệu cầm tay.

#### 3. Aegis GEAR (`/public/images/aegis-gear.jpg`) — Fortified Heavy Armor & Kinetic Defense
- **Bảng Màu Chủ Đạo**: Industrial Amber Gold (`#f59e0b`), Deep Bronze (`#b45309`), Heavy Blast Charcoal Carbon (`#18181b`), Hazard Ochre (`#d97706`).
- **Ngôn Ngữ Cơ Khí**: Tấm giáp phản ứng đa tầng dập khuôn thủy lực, pháo từ trường Gauss/Railgun hạng nặng, bộ phát màng chắn năng lượng hình cầu, piston thủy lực lộ cơ cấu.
- **Tham Chiếu Phi Công**:
  - **Valentine Vance** (Chuyên viên khiên chắn Nano): Giáp nhẹ bảo hộ màu hổ phách, găng tay kích hoạt lá chắn trường lực, kính bảo hộ y tế/hỗ trợ chiến thuật.
  - **Victor Stone** (Vệ binh pháo đài thép): Giáp exoskeleton hạng nặng phủ màu vàng đồng công nghiệp, khiên chắn thủy lực chấn động, mắt điện tử cấy ghép phát quang hổ phách.

### 2.2. Nguyên Tắc Cốt Lõi: "Tham Chiếu Bản Sắc — Không Sao Chép Máy Móc"
- **GEAR định nghĩa thế giới**: Cung cấp ngôn ngữ công nghệ, vật liệu (kim loại, carbon, cao su tổng hợp, kính chống đạn) và ánh sáng năng lượng.
- **Phi công là linh hồn**: Không vẽ phi công thành robot vô hồn hay người mặc giáp kín mít không thấy mặt. Phi công STARFRONT là những con người quyến rũ, biểu cảm, đầy cá tính được vẽ theo **phong cách anime Nhật Bản đỉnh cao**, mặc trang phục và trang bị ăn khớp hoàn hảo với cỗ máy họ điều khiển.

---

## 3. TRỤ CỘT 2: TIÊU CHUẨN MINH HỌA NHÂN VẬT ANIME KHOA HỌC VIỄN TƯỞNG CAO CẤP

### 3.1. Quy Chuẩn Thẩm Mỹ Anime Chi Tiết (Anime Illustration Benchmarks)

1. **Gương Mặt & Đôi Mắt (Facial Art & Emotion)**:
   - Đường nét khuôn mặt chuẩn phong cách anime hiện đại cao cấp: cằm thon gọn, sống mũi và khuôn miệng thanh thoát, tỉ lệ giải phẫu học hài hòa và thu hút.
   - **Đôi mắt anime có chiều sâu tuyệt mỹ**: Lớp tròng đen chuyển sắc đa tông (multi-tone iris gradient), đồng tử chi tiết, đốm sáng specular phản chiếu ánh sáng buồng lái/năng lượng, biểu cảm toát lên cá tính riêng biệt của từng phi công.
   - **Mái tóc**: Từng lọn tóc được phân lớp rõ ràng (layered hair strands), có điểm nhấn sáng mềm mại (soft hair highlights) và hiệu ứng chuyển tông mượt mà.

2. **Nét Vẽ (Linework & Inking)**:
   - Nét vẽ kỹ thuật số (digital line art) cực kỳ sắc sảo, sạch sẽ, tinh tế với sự biến thiên độ dày mỏng (line-weight) hợp lý.
   - Tuyệt đối không có viền răng cưa, nét lem nhem, nét phác thảo thô hay viền vector mờ nhòe.

3. **Tô Màu & Đổ Bóng (Coloring & Cel-Shading)**:
   - Kết hợp giữa kỹ thuật đổ bóng cel-shading phân lớp sắc nét và chuyển màu mềm kỹ thuật số (soft digital painting) cho da và tóc.
   - Thể hiện rõ sự khác biệt giữa các chất liệu: vải sợi tổng hợp mờ (matte flight suit fabric), tấm giáp carbon bóng bẩy (glossy carbon plates), kim loại phay xước (brushed titanium/steel) và dải đèn LED/plasma phát quang rực rỡ.
   - **Ánh sáng ven điện ảnh (Volumetric Rim Lighting)**: Đổ sáng viền cơ thể bằng màu năng lượng đặc trưng của GEAR (cyan, violet hoặc hổ phách), tạo hiệu ứng tách biệt với nền và tăng chiều sâu không gian.

4. **Dáng Đứng & Bố Cục (Pose & Silhouette)**:
   - Dáng đứng tự tin, tư thế sẵn sàng chiến đấu (combat-ready stance), toát lên khí chất quân nhân hoặc chuyên gia không gian.
   - Đường bao hình thể (silhouette) rõ ràng, dễ nhận diện ngay cả ở kích thước thu nhỏ.

### 3.2. Quy Tắc Kỷ Luật "Anti-Slop" (Nghiêm Cấm Tuyệt Đối)
- ❌ **CẤM Pixel Art / Retro Sprites**: Tuyệt đối không dùng phong cách 8-bit, 16-bit, sprite pixel, hình vẽ răng cưa pixelated hay texture phong cách retro.
- ❌ **CẤM Code-Drawn Graphics / SVG**: Tuyệt đối không dùng file SVG lập trình bằng code, không vẽ canvas 2D hay tạo hình khối CSS để thay thế nhân vật.
- ❌ **CẤM Chibi / Low-Poly 3D**: Không sử dụng tạo hình đầu to thân nhỏ (super-deformed), không dùng mô hình 3D thô sơ hay hình khối voxel.
- ❌ **CẤM Placeholder & Watermark**: Không sử dụng hình ảnh tạm, hộp màu xám, watermark AI, viền UI giả lập hay chữ chèn đè lên hình ảnh.

---

## 4. QUY ĐỊNH YÊU CẦU BẮT BUỘC CHO MỖI PHI CÔNG: 16 ASSETS MASTER (PORTRAIT & FULL-BODY)

Mỗi phi công trong danh sách 8 nhân vật chính thức của STARFRONT **bắt buộc phải có đầy đủ 02 asset ảnh raster phân giải cao chuyên biệt**:

1. **Ảnh Chân Dung (Portrait Asset — Tỉ lệ 1:1)**:
   - **Target Resolution**: `512 × 512 px` (1:1) (Master source: `512 × 512 px` đến `1024 × 1024 px`).
   - **Target File Size**: `≤ 500 KB per image`.
   - **Bố cục khung hình**: Cận cảnh rõ nét từ gương mặt đến phần vai trên (frame the face and upper shoulders clearly).
   - **Mục đích sử dụng**: Avatar người chơi, thẻ bài đơn vị trên bản đồ chiến thuật, khung truyền tin đàm thoại (HUD comms), giao diện chọn lượt trong trận đấu.
   - **Trọng tâm hình ảnh**: Gương mặt anime biểu cảm, đôi mắt sắc nét, kiểu tóc chi tiết, thiết kế giáp cổ/vai và bảng màu chủ đạo (signature color palette).

2. **Ảnh Toàn Thân (Full-Body Asset — Tỉ lệ 9:16)**:
   - **Target Resolution**: `900 × 1600 px` (9:16).
   - **Target File Size**: `≤ 1200 KB per image`.
   - **Bố cục khung hình**: Toàn bộ vóc dáng đứng từ đầu đến chân (full figure from head to boots), bảo toàn trọn vẹn đường nét dáng người (complete character silhouette) và các trang thiết bị quan trọng.
   - **Mục đích sử dụng**: Hồ sơ phi công (Dossier / Pilot Profile), màn hình chọn phi công (character-selection), nâng cấp trong Hangar, tổng kết nhiệm vụ, bộ sưu tập Pilot Gallery.
   - **Trọng tâm hình ảnh**: Trọn vẹn trang phục chiến đấu, giáp chân, thắt lưng phụ kiện, bao súng, vũ khí cầm tay và tư thế chiến đấu đặc trưng với độ chi tiết thị giác cao.

### 4.1. Bảng Phân Bổ 16 Image Assets Cho 8 Phi Công Canonical (Định dạng WebP Chuẩn Hóa)

| STT | Mã Phi Công | Họ Tên & Biệt Danh | Giới Tính & Vai Trò | Hệ GEAR & Màu Năng Lượng | File Chân Dung (Portrait 1:1, 512×512) | File Toàn Thân (Full-Body 9:16, 1080×1920 Full HD) |
|:---:|---|---|---|---|---|---|
| 1 | `marcus` | **Marcus Thorne**<br>`WAR DOG / IRONCLAD` | Nam (30 tuổi)<br>Chỉ Huy Tuyến Đầu | **Vanguard GEAR**<br>Tactical Cyan (`#06b6d4`) | `/public/images/marcus-portrait.webp` | `/public/images/marcus-fullbody.webp` |
| 2 | `valentine` | **Valentine Vance**<br>`AEGIS ANGEL` | Nữ (22 tuổi)<br>Chuyên Viên Khiên Nano | **Aegis GEAR**<br>Amber Gold (`#f59e0b`) | `/public/images/valentine-portrait.webp` | `/public/images/valentine-fullbody.webp` |
| 3 | `alviss` | **Alviss Drake**<br>`GHOSTFIRE` | Nam (26 tuổi)<br>Phi Công Siêu Thanh | **Falcon GEAR**<br>Cyber Violet (`#a855f7`) | `/public/images/alviss-portrait.webp` | `/public/images/alviss-fullbody.webp` |
| 4 | `eric` | **Eric Brandt**<br>`BUNKER BREAKER` | Nam (28 tuổi)<br>Pháo Thủ Hặng Nặng | **Vanguard GEAR**<br>Tactical Cyan (`#06b6d4`) | `/public/images/eric-portrait.webp` | `/public/images/eric-fullbody.webp` |
| 5 | `lyra` | **Lyra Vance**<br>`VALKYRIE` | Nữ (24 tuổi)<br>Nữ Kiếm Sĩ Cơ Động | **Falcon GEAR**<br>Cyber Violet (`#a855f7`) | `/public/images/lyra-portrait.webp` | `/public/images/lyra-fullbody.webp` |
| 6 | `kaelen` | **Kaelen Voss**<br>`CIPHER` | Nữ (25 tuổi)<br>Hacker Tác Chiến Điện Tử | **Falcon GEAR**<br>Cyber Violet (`#a855f7`) | `/public/images/kaelen-portrait.webp` | `/public/images/kaelen-fullbody.webp` |
| 7 | `selena` | **Selena Cross**<br>`SOLARIS` | Nữ (27 tuổi)<br>Sĩ Quan Chùm Năng Lượng | **Vanguard GEAR**<br>Tactical Cyan (`#06b6d4`) | `/public/images/selena-portrait.webp` | `/public/images/selena-fullbody.webp` |
| 8 | `victor` | **Victor Stone**<br>`BASTION` | Nam (34 tuổi)<br>Vệ Binh Pháo Đài Thép | **Aegis GEAR**<br>Amber Gold (`#f59e0b`) | `/public/images/victor-portrait.webp` | `/public/images/victor-fullbody.webp` |

*Ghi chú về thiết lập nhân vật: Alviss Drake bắt buộc là NAM (phi công siêu thanh ngạo nghễ, tài hoa). Tỉ lệ giới tính 8 phi công cân bằng tuyệt đối: 4 Nam : 4 Nữ.*

---

## 5. THÔNG SỐ KỸ THUẬT & KIẾN TRÚC TỆP TIN (TECHNICAL SPECIFICATIONS)

### 5.1. Quy Cách Lưu Trữ & Đường Dẫn
- **Thư mục lưu trữ gốc**: `/public/images/`
- **Đường dẫn truy cập Web/Client**: `/images/{tên-file}`
- **Quy tắc đặt tên file**:
  - Chân dung: `{mã-phi-công}-portrait.webp` (Ví dụ: `marcus-portrait.webp`)
  - Toàn thân: `{mã-phi-công}-fullbody.webp` (Ví dụ: `marcus-fullbody.webp`)
- **Định dạng file phân phối**: WebP (hỗ trợ đầy đủ kênh Alpha trong suốt, chất lượng nén Q92 sắc nét).
- **Mã hóa màu**: sRGB, 8-bit per channel color depth.

### 5.2. Tiêu Chuẩn Phân Giải, Kích Thước Tệp & Tối Ưu Hóa (Image Asset Resolution & File Size Standards)

#### A. Full-body Character Images
- **Target Resolution**: **1080 × 1920 px** (Full HD, tỉ lệ 9:16).
- **Target File Size**: **≤ 350 KB per image (WebP Q92)**.
- **Yêu cầu bảo toàn hình thể**: Giữ trọn vẹn đường nét dáng người nhân vật (complete character silhouette) và các vũ khí, trang thiết bị quan trọng với thuật toán fit contain bảo toàn tỷ lệ khung hình.
- **Chi tiết hiển thị**: Duy trì độ nét Full HD vượt trội cho màn hình chọn phi công (character-selection) và Pilot Art Gallery.

#### B. Character Portrait Images
- **Target Resolution**: **512 × 512 px** (tỉ lệ 1:1).
- **Target File Size**: **≤ 75 KB per image (WebP Q92)**.
- **Khung hình**: Cận cảnh rõ nét khuôn mặt và phần vai trên (frame the face and upper shoulders clearly).
- **Yêu cầu nhận diện**: Bảo toàn tuyệt đối danh tính nhân vật, kiểu tóc, thiết kế giáp và bảng màu đặc trưng (signature color palette).

#### C. Định Dạng & Tối Ưu Hóa Phân Phối (Format and Optimization)
- **Chuẩn WebP chính thức**: Toàn bộ hệ thống asset đồ họa STARFRONT sử dụng định dạng WebP cho việc phân phối tối ưu (optimized delivery), giúp tải tức thì và tiết kiệm 90% băng thông so với PNG gốc.
- **Giới hạn dung lượng là mục tiêu tối ưu (Optimization Targets)**: Xem các mức giới hạn file-size (`≤ 1200 KB` cho Full-body, `≤ 500 KB` cho Portrait) là mục tiêu tối ưu hóa. Nếu một hình ảnh không thể đạt mục tiêu dung lượng mà không bị suy giảm chất lượng rõ rệt (noticeable quality loss), phải bảo toàn chất lượng thị giác và ghi nhận trường hợp ngoại lệ.
- **Điều chỉnh kích thước đúng quy cách (Resize Oversized Images)**: Giảm kích thước các ảnh quá khổ về đúng độ phân giải mục tiêu (`900 × 1600 px` hoặc `512 × 512 px`), bảo toàn tỉ lệ khung hình (aspect ratio) và tránh phóng đại (upscaling) không cần thiết.
- **Nén & Kiểm định trực quan trước khi thay thế**: Sử dụng thông số nén phù hợp và bắt buộc kiểm tra trực quan chất lượng kết quả tối ưu trước khi thay thế các asset hiện có.
- **Cấm Upscale ảnh crop mờ**: Tuyệt đối không phóng to (upscale) ảnh cắt từ ảnh độ phân giải thấp rồi giả định rằng các chi tiết khuôn mặt bị thiếu đã được phục hồi.

### 5.3. Tích Hợp Giao Diện Trực Quan (UI Integration)
- Toàn bộ 16 asset ảnh phải được tham chiếu trực tiếp trong mã nguồn giao diện (Next.js `<Image>` hoặc `<img>`).
- Module kiểm tra và xem trước chuyên dụng: **Pilot Art Gallery** (`components/game/pilot-gallery.tsx`), hỗ trợ:
  - Xem ảnh phóng to độ nét cao với tỉ lệ gốc.
  - Chuyển đổi linh hoạt giữa chế độ xem Chân dung (Portrait) và Toàn thân (Full-Body).
  - Lọc theo giới tính, vai trò chiến đấu, hệ GEAR liên kết.
  - Kiểm tra trạng thái tồn tại và tính hợp lệ của từng tệp hình ảnh.

---

## 6. HỆ THỐNG PROMPT CHUẨN HÓA CHO PIPELINE NGOÀI (PIXAI & SDXL CATALOG)

Khi triển khai tạo ảnh qua các mô hình chuyên biệt bên ngoài (PixAI Moonbeam, Animagine XL v3.1, NovelAI, SDXL Anime), tham khảo danh mục prompt chi tiết tại:  
👉 **`PIXAI_CHARACTER_PROMPTS.md`**

### 6.1. Khung Prompt Chất Lượng Phổ Quát (Universal Positive Prompt Header)
```text
masterpiece, best quality, ultra-detailed, highres, anime concept art, official anime game key art,
clean line art, extremely detailed anime face, expressive detailed eyes, beautifully rendered layered hair,
sophisticated cel shading with smooth digital painting gradients, cinematic lighting, volumetric rim light,
futuristic sci-fi military combat uniform, sci-fi exosuit plating inspired by STARFRONT GEAR artwork
```

### 6.2. Khung Prompt Phủ Định Phổ Quát (Universal Negative Prompt)
```text
(worst quality, low quality, normal quality, lowres:1.4), (pixel art, retro pixel, 8-bit, 16-bit, sprite, pixelated, dithering:1.6),
(low poly, blocky, voxel, 3d game render:1.3), (chibi, deformed, bad anatomy, bad hands, missing fingers, extra fingers, mutated hands:1.4),
(poorly drawn face, bad eyes, crossed eyes:1.3), (blurry, fuzzy, jpeg artifacts, compression artifacts:1.3),
watermark, signature, artist name, username, text, logo, border, frame, monochrome, sketch, draft, amateur drawing
```

---

## 7. QUY TẮC BẮT BUỘC: BẢO VỆ IMAGE ASSETS KHI HẾT QUOTA TẠO ẢNH (ASSET PROTECTION PROTOCOL)

Nhằm bảo toàn tính toàn vẹn của hệ thống đồ họa và ngăn ngừa tình trạng suy giảm chất lượng hiển thị trong dự án STARFRONT, toàn bộ quy trình sinh ảnh và quản trị asset bắt buộc phải tuân thủ nghiêm ngặt các quy tắc sau:

### 7.1. Đình chỉ ngay lập tức khi cạn kiệt tài nguyên / Quota Exhausted
- Khi công cụ tạo ảnh (AI Studio Image Generation / Gemini API) gặp bất kỳ điều kiện nào sau đây:
  - Hết quota (Quota Exceeded / Resource Exhausted).
  - Hết băng thông hoặc giới hạn tốc độ (Rate Limit).
  - Lỗi `429 RESOURCE_EXHAUSTED` hoặc `HTTP 429 Too Many Requests`.
- **Hành động bắt buộc**: **DỪNG NGAY LẬP TỨC** toàn bộ tác vụ gọi sinh ảnh tiếp theo và **GIỮ NGUYÊN 100% CÁC ASSET HÌNH ẢNH HIỆN CÓ** trên hệ thống tệp (`/public/images/`). Tuyệt đối không retry liên tục gây tắc nghẽn luồng làm việc.

### 7.2. Tuyệt đối không ghi đè, xóa hoặc chỉnh sửa asset hiện có
- **CẤM TUYỆT ĐỐI**:
  - Không được xóa bất kỳ tệp hình ảnh raster nào đã lưu (`.png`, `.jpg`, `.jpeg`).
  - Không được ghi đè (overwrite) tệp ảnh hiện có bằng dữ liệu rỗng, dữ liệu lỗi, ảnh kích thước nhỏ hoặc ảnh chưa hoàn thiện chỉ vì hệ thống không thể tạo ảnh mới.
  - Không được đổi tên, di chuyển hoặc làm xáo trộn đường dẫn file ảnh đang được giao diện người dùng tham chiếu.

### 7.3. Cấm thay thế bằng Placeholder hoặc hình ảnh dựng bằng code
- **CẤM TUYỆT ĐỐI** việc tự ý thay thế ảnh nhân vật/mecha bằng:
  - Vector SVG giả lập minh họa hoặc code-drawn graphics.
  - Khối màu CSS, hình vẽ canvas 2D, geometric placeholders.
  - Icon, ký tự typography hoặc sprite đồ họa retro/pixel art mô phỏng.
- Sự thiếu vắng tạm thời của ảnh mới do hết quota **KHÔNG PHẢI LÀ LÝ DO** để hạ cấp tiêu chuẩn đồ họa thành code art hay placeholder.

### 7.4. Cấm tự tạo ảnh thay thế bằng phương pháp chưa được chỉ định
- Khi chưa có yêu cầu rõ ràng từ người dùng:
  - Không được tự ý chuyển đổi sang các phương pháp tạo ảnh tạm thời hoặc không đạt tiêu chuẩn nghệ thuật.
  - Không tự ý dùng các mô hình văn bản (LLM) để sinh mã code mô phỏng hình ảnh.
  - Nếu cần tạo ảnh ngoài môi trường bị giới hạn, chuẩn bị bộ prompt chuẩn hóa (như catalog `PIXAI_CHARACTER_PROMPTS.md`) để thực hiện qua pipeline chuyên biệt bên ngoài, sau đó nạp file ảnh thành phẩm đạt chuẩn vào dự án.

### 7.5. Điều kiện tiên quyết & Quy tắc an toàn khi thay thế Asset (Asset Replacement Safety)
Chỉ được phép thay thế một file ảnh hiện có khi và chỉ khi thỏa mãn đầy đủ các quy tắc kỷ luật sau:
1. **Có ảnh thay thế hợp lệ trước khi thao tác**: Phải tạo thành công hoặc tiếp nhận được ảnh thay thế hợp lệ trước, sau đó xác minh đầy đủ về nội dung, kích thước phân giải, dung lượng tệp và chất lượng thị giác trước khi thay thế asset hiện có.
2. **Tuyệt đối không thay thế bằng placeholder hoặc tác phẩm giả lập**: Không bao giờ thay thế một ảnh nhân vật hợp lệ bằng placeholder, hình vẽ vector SVG/CSS/canvas tự dựng hoặc ảnh không liên quan chỉ vì dịch vụ tạo ảnh không khả dụng hoặc bị giới hạn quota.
3. **Định dạng & Tiêu chuẩn kỹ thuật**: Tệp thay thế phải là ảnh raster thực thụ (`PNG` hoặc `WebP`) đúng chuẩn kỹ thuật (Full-body: `900 × 1600 px`, `≤ 1200 KB`; Portrait: `512 × 512 px`, `≤ 500 KB`).
4. **Chuẩn phong cách nghệ thuật**: Đạt tiêu chuẩn Premium Japanese Anime Sci-Fi Character Illustration, sắc nét, không pixel art, không biến dạng giải phẫu học, kế thừa chuẩn thẩm mỹ từ STARFRONT GEAR.
5. **Bảo toàn tên tệp & Đường dẫn chuẩn**: Giữ nguyên tên tệp quy chuẩn (canonical filenames) và đường dẫn public (`/images/{mã-phi-công}-portrait.png`, `/images/{mã-phi-công}-fullbody.png`) trừ khi có yêu cầu di chuyển cấu trúc có chủ đích.
6. **Kiểm tra tệp đích trước khi ghi**: Trước khi ghi bất kỳ tệp ảnh nào, phải kiểm tra xem tệp đích đã tồn tại hay chưa. Nếu đã tồn tại tệp hợp lệ, mặc định giữ nguyên (preserve existing).
7. **Không đụng chạm asset không liên quan**: Tuyệt đối không tự ý tạo lại hoặc thay thế các asset không liên quan trong quá trình tối ưu hóa định kỳ (routine optimization).
8. **Bảo tồn tài nguyên do người dùng cung cấp**: Khi người dùng cung cấp ảnh bên ngoài (ví dụ ảnh tạo bằng PixAI hoặc mô hình ngoài), bắt buộc phải giữ nguyên file đó và chỉ tích hợp theo yêu cầu; tuyệt đối không tự ý tạo lại ảnh bằng AI Studio.
9. **Xử lý quy trình khi cạn kiệt Quota**: Nếu hết quota sinh ảnh, tiếp tục thực hiện các công việc kỹ thuật/logic không phụ thuộc vào ảnh nếu có thể; báo cáo rõ danh sách các ảnh còn thiếu cho người dùng và không tuyên bố đã hoàn thành phần hình ảnh khi asset chưa đạt chuẩn.

---

## 8. LỊCH SỬ PHIÊN BẢN & HIỆU LỰC (VERSION HISTORY & ENACTMENT)

- **v1.0 (Khởi tạo)**: Thiết lập cơ chế game chiến thuật và phác thảo tài nguyên pixel ban đầu.
- **v2.0 (Cơ bản hóa)**: Tích hợp hình ảnh 3D GEAR và xác lập danh sách 8 phi công ban đầu.
- **v3.0 (Đột phá)**: Chính thức xác lập **Tiêu Chuẩn Minh Họa Nhân Vật Anime Khoa Học Viễn Tưởng Cao Cấp**, ban hành **Quy định bắt buộc 16 Asset (8 Portrait + 8 Full-Body)**, liên kết trực tiếp hệ thống **Tham chiếu thiết kế GEAR hiện có**, và xuất bản danh mục prompt `PIXAI_CHARACTER_PROMPTS.md`.
- **v3.1**: Bổ sung quy tắc bắt buộc bảo vệ Image Assets khi hết quota (HTTP 429 Protocol) — cấm hạ cấp bằng SVG/CSS/Canvas/Pixel art.
- **v3.2**: Tài liệu hóa song ngữ và chuẩn hóa toàn diện: Minh họa nhân vật anime sci-fi cao cấp, kim chỉ nam tham chiếu từ hình ảnh GEAR hiện có, và quy định bắt buộc 16 Image Assets (Portrait & Full-Body) cho toàn bộ phi công STARFRONT.
- **v3.3 (Hiện tại - Hiệu lực tối cao)**: Bổ sung **Image Asset Resolution & File Size Standards** (Full-body: `900 × 1600 px`, `≤ 1200 KB`; Portrait: `512 × 512 px`, `≤ 500 KB`), quy chuẩn tối ưu hóa phân phối (WebP / PNG), nguyên tắc điều chỉnh kích thước không suy hao chi tiết, và hoàn thiện bộ quy tắc an toàn thay thế tài nguyên (**Asset Replacement Safety**).

*Tài liệu này là quy chuẩn nghệ thuật chính thức và luật bất biến áp dụng cho toàn bộ hoạt động thiết kế, lập trình và quản lý tài nguyên của STARFRONT.*
