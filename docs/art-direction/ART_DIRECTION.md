# STARFRONT — Quy Chuẩn Art Direction & Tiêu Chuẩn Chất Lượng Hình Ảnh Sci-Fi (Global Art Direction Standard)

*Phiên bản: 1.0 — Ngày ban hành: 11/10/2026*  
*Tài liệu quy chuẩn mỹ thuật tối cao (Master Visual Style Guide) áp dụng cho toàn bộ dự án STARFRONT.*

---

## 1. Tuyên Ngôn Triết Lý Thiết Kế Mỹ Thuật (Visual Philosophy & Art Direction)

**STARFRONT** là tựa game nhập vai chiến thuật theo lượt (Turn-based Sci-Fi Tactical RPG) lấy bối cảnh không chiến tương lai và đại chiến cơ giáp thiên hà. Tinh thần mỹ thuật của trò chơi kế thừa cảm xúc hoài niệm mãnh liệt từ *ACE Online* (AirRivals/Space Cowboy) kết hợp với ngôn ngữ tạo hình Mecha / Aerospace Concept Art hiện đại chuẩn chất lượng thương mại.

```
                  ┌──────────────────────────────────────────────┐
                  │             STARFRONT ART DIRECTION          │
                  │   Futuristic Aerospace & Mecha Concept Art   │
                  └──────────────────────┬───────────────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         ▼                               ▼                               ▼
  [ 3D Mecha Concept ]         [ Anime-Realistic Pilots ]      [ Tactical Cockpit HUD ]
  - Realistic metal shaders    - Sophisticated flightsuits     - Dark space canvas
  - Dynamic 3/4 perspective    - Expressive human eyes         - Cyan / Purple / Amber accents
  - Visible functional thrusters - High-detail accessories     - Zero-pill clean typography
```

### 1.1. Bản Sắc Cốt Lõi (Core Aesthetic Pillars)
1. **Futuristic Aerospace & Military Sci-Fi**: Mọi thiết kế khí tài không gian đều phải tuân thủ nguyên lý khí động học tương lai hoặc kết cấu chịu lực vũ trụ thực tế; có buồng lái, cánh lượn, cánh lái phản lực, ống xả plasma và giá treo vũ khí cơ khí sắc bén.
2. **Chất Liệu Kim Loại Chân Thực (Realistic Metallic & Composite Materials)**: Bề mặt vỏ máy bay và giáp phi công phải thể hiện rõ chất liệu kim loại titan, sợi carbon dệt nano, lớp phủ gốm chống bức xạ vũ trụ, panel lines (đường ghép khớp vỏ) và lớp phản xạ ánh sáng (specular highlights) chân thực.
3. **Ánh Sáng Điện Ảnh (Cinematic Dramatic Lighting)**: Sử dụng ánh sáng 3 điểm (Three-point lighting), ánh sáng viền (rim light) từ các vì sao xa xôi hoặc tinh vân vũ trụ, luồng sáng rực rỡ từ động cơ đẩy ion/plasma và ánh quang học từ đèn hiệu buồng lái.
4. **Độc Lập & Nguyên Bản (100% Original IP)**: Tham chiếu tinh thần cơ giáp 4 lớp từ ACE Online nhưng phát triển thiết kế nguyên bản hoàn toàn mới; không sao chép nguyên trạng 3D model, logo, huy hiệu phe phái hay hình ảnh nhân vật có bản quyền.

### 1.2. Danh Mục Cấm Kỵ Tuyệt Đối (Anti-Slop & Prohibited Patterns)
| Hạng mục | Quy định cấm kỵ | Lý do kỹ thuật & thẩm mỹ |
|---|---|---|
| ❌ **Pixel Art / Retro Low-Res** | Tuyệt đối không dùng pixel art, tranh 8-bit/16-bit | Phá vỡ tính nghiêm túc của thể loại Hard Sci-Fi thương mại |
| ❌ **Đồ chơi nhựa sơ sài** | Không render mô hình thiếu chi tiết, khối tròn trơn nhẵn như đồ chơi nhựa | Mất đi cảm giác cơ khí quân sự và tính chiến đấu viễn tưởng |
| ❌ **Vector / SVG đơn sắc thay thế tranh** | Không dùng SVG hình học phẳng hoặc silhouette làm minh họa chính | Tranh concept art cần độ sâu trường ảnh, bề mặt kim loại và ánh sáng |
| ❌ **Recolor cùng 1 model** | Tuyệt đối không dùng cùng 1 thân máy bay rồi chỉ đổi màu cho 3 Gear | Mỗi lớp Gear sở hữu silhouette, vai trò tác chiến và cấu trúc vật lý khác biệt |
| ❌ **UI giả / Text / Watermark nướng trong ảnh** | Không để AI sinh chữ, watermark, viền card, số liệu HUD giả vào ảnh | Gây xung đột với hệ thống giao diện Next.js động và làm giảm độ nét |

---

## 2. Quy Chuẩn Chi Tiết Theo Từng Loại Tài Nguyên (Asset Specifications)

### 2.1. Nhóm A: Cơ Giáp Chiến Đấu (Combat Aircraft / Gear Mecha)

Mỗi lớp Gear là một biểu tượng chiến thuật độc nhất với ngôn ngữ thiết kế cơ khí riêng biệt:

```
+-----------------------------------------------------------------------------------------+
|                                4 LỚP CƠ GIÁP STARFRONT                                  |
+-------------------+--------------------+-----------------------+------------------------+
| Vanguard Mk-I     | Falcon Interceptor | Aegis Siege Fortress  | Specter Electronic     |
| (Balanced Striker)| (Speed Infiltrator)| (Heavy Demolition)    | (Tactical Support)     |
| Cyan #06b6d4      | Purple #a855f7     | Amber #f59e0b         | Emerald #10b981        |
| Cánh xuôi đa dụng | Cánh tam giác Mach | Khối titan bọc thép   | Cánh tàng hình góc vát |
+-------------------+--------------------+-----------------------+------------------------+
```

#### A1. Vanguard Gear (`vanguard`) — Cơ Giáp Cân Bằng (Balanced Striker)
- **Tỷ lệ & Kích thước**: 16:9 Landscape (`1920x1080` hoặc `1280x720`).
- **Hình dáng nhận diện (Silhouette)**: Dáng tiêm kích không gian cơ bản cân đối, mũi nhọn thon dài khí động, cánh xuôi ra sau (swept wings) với 2 động cơ phản lực kép ở đuôi.
- **Vũ khí tích hợp**: 2 Pháo năng lượng photon gắn dọc sống mũi và giá treo tên lửa đa năng dưới hai bên cánh.
- **Bảng màu chủ đạo**: Xanh Cyan vũ trụ (`#06b6d4`), Trắng bạc kim loại, Điểm xuyết viền Đen carbon. Động cơ phản lực phát ánh xanh băng (Cyan Ion Glow).
- **File Asset chuẩn**: `/public/images/vanguard-gear.jpg` (Raster 16:9) kèm fallback `/public/images/vanguard.svg`.

#### A2. Falcon Gear (`falcon`) — Tiêm Kích Tốc Độ (Speed Infiltrator)
- **Tỷ lệ & Kích thước**: 16:9 Landscape (`1920x1080` hoặc `1280x720`).
- **Hình dáng nhận diện (Silhouette)**: Thân dẹp siêu thanh, mũi tên nhọn hoắt, cánh tam giác delta vuốt sắc hoặc cánh cụp cánh xòe, khe hút gió hẹp tối giản lực cản.
- **Vũ khí tích hợp**: Hệ thống súng máy laser xung kích cao tần gắn chìm trong thân, ống phóng nhiễu xạ và động cơ phản lực siêu âm cực đại (Afterburner).
- **Bảng màu chủ đạo**: Tím Neon (`#a855f7`), Tím sẫm Nightshade, Xám nòng súng. Vệt xả phản lực hạt proton tím rực.
- **File Asset chuẩn**: `/public/images/falcon-gear.jpg` (Raster 16:9) kèm fallback `/public/images/falcon.svg`.

#### A3. Aegis Gear (`aegis`) — Pháo Đài Bọc Thép (Heavy Siege Armor)
- **Tỷ lệ & Kích thước**: 16:9 Landscape (`1920x1080` hoặc `1280x720`).
- **Hình dáng nhận diện (Silhouette)**: Khối lượng đồ sộ, giáp titan đa giác gồ ghề dày cộp, cánh vát ngang gia cố buồng lái, dáng bay nặng nề uy dũng như một pháo đài bay.
- **Vũ khí tích hợp**: Tháp đại pháo hạt nhân đôi trên lưng (Twin Heavy Gauss/Plasma Cannons), bộ phát trường lực khiên gai năng lượng nổi bật ở 2 mạn thân.
- **Bảng màu chủ đạo**: Vàng Hổ Phách (`#f59e0b`), Cam Cháy, Giáp sắt đen mờ công nghiệp. Lửa động cơ đẩy nhiệt cam rực rỡ và khiên phản quang vàng kim.
- **File Asset chuẩn**: `/public/images/aegis-gear.jpg` (Raster 16:9) kèm fallback `/public/images/aegis.svg`.

#### A4. Specter Gear (`specter`) — Trinh Sát Tác Chiến Điện Tử (Tactical Support - Phase 6)
- **Tỷ lệ & Kích thước**: 16:9 Landscape (`1920x1080` hoặc `1280x720`).
- **Hình dáng nhận diện (Silhouette)**: Thiết kế tàng hình phản xạ radar góc cạnh (Stealth Faceted Body), cánh liền thân không đuôi (Flying Wing), ăng-ten mảng pha chìm.
- **Vũ khí tích hợp**: Bộ phát xung điện từ vi ba (EMP Emitters), máy quét radar lượng tử và ống phóng drone gây nhiễu ECM.
- **Bảng màu chủ đạo**: Ngọc Bích / Xanh Lục Bảo (`#10b981`), Đen nhung tàng hình hấp thụ sóng, Vệt động cơ lạnh không tản nhiệt.
- **File Asset dự kiến**: `/public/images/specter-gear.jpg`.

---

## 2.2. Nhóm B: Phi Công & Nhân Vật (Pilots & Characters)

Phong cách tạo hình nhân vật là sự kết hợp giữa **Anime Sci-Fi Tinh Tế & Thực Tế Quân Sự (Semi-Realistic Anime Military Character Illustration)**. Nhân vật có trang phục phi công hiện đại, khuôn mặt sắc nét, biểu cảm chân thực và giữ tính nhất quán 100% giữa ảnh Chân Dung (Portrait 1:1) và Toàn Thân (Full-Body 9:16).

```
+-----------------------------------------------------------------------------------------+
|                                4 PHI CÔNG ÁT CHỦ STARFRONT                              |
+-------------------+--------------------+-----------------------+------------------------+
| Marcus Thorne     | Valentine Vance    | Levi Reed (Alviss)    | Eric Brandt            |
| "WAR DOG"         | "AEGIS ANGEL"      | "SHADOW FALCON"       | "BUNKER BREAKER"       |
| Nam, 30 tuổi      | Nữ, 22 tuổi        | Nữ, 24 tuổi           | Nam, 28 tuổi           |
| Exo-suit Hạng nặng| Quân phục váy ngắn | Váy bó sát khí động   | Flightsuit Đỏ đen      |
+-------------------+--------------------+-----------------------+------------------------+
```

#### B1. Marcus Thorne (Callsign: WAR DOG)
- **Định danh**: Chỉ huy tiền tuyến, chuyên gia vũ khí Vanguard.
- **Diện mạo**: Nam 30 tuổi, tóc húi cua chiến thuật màu nâu trầm, vết sẹo nhỏ kiên cường bên thái dương, ánh mắt kiên định của người lãnh đạo trận tiền.
- **Trang phục**: Bộ đồ phi công exo-suit màu xám than viền cyan, giáp ngực trợ lực cơ khí gân guốc, găng tay chiến thuật bọc đệm nano.
- **Đường dẫn**:
  - Portrait: `/public/images/marcus-portrait.jpg` (Raster 1024x1024, 769KB).
  - Full-Body: `/public/images/marcus-fullbody.png` (Mục tiêu 9:16 / Đang dùng fallback SVG).

#### B2. Valentine Vance (Callsign: AEGIS ANGEL)
- **Định danh**: Thiên tài phòng ngự và cứu hộ chiến trường, thủ khoa Học viện Quân sự Thiên hà.
- **Diện mạo**: Nữ 22 tuổi, gương mặt xinh đẹp quyến rũ, mái tóc vàng bạch kim óng ả uốn gợn sóng nhẹ, ánh mắt xanh lam nhân hậu nhưng bản lĩnh.
- **Trang phục**: Bộ quân phục phi công váy ngắn thanh lịch màu trắng - vàng gold vương giả, áo khoác lửng cổ đứng hiện đại, thắt lưng thiết bị y tế và đôi bốt da cao cổ màu trắng viền vàng.
- **Đường dẫn**:
  - Portrait: `/public/images/valentine-portrait.jpg` (Raster 1024x1024, 648KB).
  - Full-Body: `/public/images/valentine-fullbody.png` (Mục tiêu 9:16 / Đang dùng fallback SVG).

#### B3. Levi Reed / Alviss (Callsign: SHADOW FALCON)
- **Định danh**: Nữ át chủ bài siêu thanh Falcon, chuyên gia né tránh và phản kích chớp nhoáng.
- **Diện mạo**: Nữ 24 tuổi, quyến rũ sắc sảo, mái tóc ngắn cá tính màu tím sẫm hoặc đen huyền ánh tím, đôi mắt màu hổ phách sáng quắc như chim ưng săn mồi.
- **Trang phục**: Flightsuit váy bó sát khí động học ôm trọn đường cong cơ thể, tông màu tím thẫm viền neon tím, tích hợp các đường chỉ dẫn phản xạ xung thần kinh dọc theo cánh tay và đùi, bốt nhẹ phản lực.
- **Đường dẫn**:
  - Portrait: `/public/images/alviss-portrait.jpg` (Raster 1024x1024, 936KB).
  - Full-Body: `/public/images/levi-fullbody.png` (Mục tiêu 9:16 / Đang dùng fallback SVG).

#### B4. Eric Brandt (Callsign: BUNKER BREAKER)
- **Định danh**: Bậc thầy pháo kích công thành, chuyên gia đầu đạn hạt nhân xuyên giáp.
- **Diện mạo**: Nam 28 tuổi, vóc dáng cao ráo phong trần, nụ cười tự tin nhếch mép, tóc đen vuốt ngược chiến trường, đeo tai nghe bộ đàm chiến thuật.
- **Trang phục**: Bộ flightsuit chịu nhiệt cực hạn màu đỏ thẫm và đen carbon, áo giáp vai gắn ngàm kết nối pháo kích, thắt lưng vũ trang đa dụng.
- **Đường dẫn**:
  - Portrait: `/public/images/eric-portrait.jpg` (Raster 1024x1024, 776KB).
  - Full-Body: `/public/images/eric-fullbody.png` (Mục tiêu 9:16 / Đang dùng fallback SVG).

---

### 2.3. Nhóm C: Kẻ Địch Vũ Trụ & Boss Chiến Dịch (Enemy Units & Bosses)

Kẻ địch phải được phân chia thành 3 họ khí tài rõ ràng:

1. **Scout Drone (Drone Trinh Sát)**: Khung máy bay không người lái gọn nhẹ, camera cảm biến đỏ đơn sắc ở tâm, 2 cánh lượn mỏng, động cơ điện từ vo ve.
2. **Raider Mech (Cơ Giáp Đột Kích)**: Khung người máy bán sinh học hoặc drone chiến đấu 2 càng chân ngược (reverse-joint legs) mang súng tiểu liên năng lượng đôi, sơn vệt rằn ri không gian.
3. **Siege Walker (Pháo Đài Cố Thủ / Boss)**: Khung cơ giáp 4 chân khổng lồ hoặc chiến hạm tuần dương mini với lớp giáp hạng nặng, nòng pháo cỡ đại và lưới phát điện trường EMP dày đặc.

---

### 2.4. Nhóm D: Giao Diện Buồng Lái & HUD (UI / HUD / Backgrounds)

Tuân thủ nghiêm ngặt **Universal Frontend Design Constitution** và phong cách buồng lái tối tân:
- **Bảng màu bề mặt (Surfaces)**: Nền tối sâu thẳm (`#0a0f1d`, `#0b1120`, `#020617`), các panel nổi có độ mờ thủy tinh tinh tế (`backdrop-blur-md bg-slate-900/80 border border-slate-800/80`).
- **Accent Lines**: Đường viền hairline siêu mỏng 1px với màu nhận diện lớp Gear đang chọn (Cyan cho Vanguard, Purple cho Falcon, Amber cho Aegis).
- **Typography**: Header dạng Display đậm chất quân sự, chỉ số data sử dụng font Monospace kèm `tabular-nums`.
- **Zero-Pill Discipline**: Metadata thông tin hiển thị dạng chữ phẳng ngăn cách bằng ký tự `·` hoặc `/`, không đóng hộp viên thuốc màu mè (pill capsules).

---

## 3. Tiêu Chuẩn Kỹ Thuật Prompt Engineering Cho Sinh Ảnh AI (Prompt Standards)

Khi sử dụng công cụ sinh ảnh (`generate_image`) hoặc mô hình Imagen/Gemini, bắt buộc tuân thủ cấu trúc prompt 5 tầng:

```
[Subject & Identity] + [Camera Perspective & Framing] + [Materials & Mechanical Details] + [Lighting & Atmosphere] + [Quality Triggers]
```

### 3.1. Template Mẫu Sinh Ảnh Cơ Giáp (Gear Combat Aircraft)
```text
High-detail 3D sci-fi mecha concept art of the {GEAR_NAME}, a futuristic military aerospace fighter spacecraft. Dynamic three-quarter perspective showcase view, vehicle occupying 80% of the widescreen frame. Sleek aerodynamic hull with realistic titanium panel lines, exposed vectoring thruster exhausts glowing with {ENGINE_COLOR} ion plasma, dual heavy {WEAPON_TYPE} mounted under the wings. Ultra-realistic matte metal and carbon fiber textures with sharp specular reflections and industrial markings. Cinematic dramatic lighting with subtle rim light against a deep space aerospace hangar docking bay with distant stars, high contrast, crisp lines, 8k resolution, commercial video game key art, no text, no logo, no watermark.
```

*Ví dụ Prompt chuẩn cho Vanguard Mk-I:*
```text
High-detail 3D sci-fi mecha concept art of the Vanguard Gear, a balanced aerospace striker fighter spacecraft. Dynamic three-quarter perspective showcase view, occupying 80% of frame. Sleek swept-wing silhouette with realistic titanium and cyan-accented composite armor plates, dual forward-firing photon energy cannons, exposed dual plasma thrusters with icy cyan ion exhaust flames. Realistic metallic paint, fine mechanical panel joints, cockpit canopy with tinted reflective gold glass. Cinematic lighting with cool cyan rim light, dark orbital hangar background with soft volumetric nebula haze, crisp edges, high contrast, 8k key art, no watermark, no text.
```

### 3.2. Template Mẫu Sinh Ảnh Chân Dung Phi Công (Pilot Portrait - 1:1)
```text
High-quality anime-realistic sci-fi character portrait of {PILOT_NAME}, a {AGE}-year-old {GENDER} elite aerospace fighter pilot. Confident expression with {EYE_COLOR} expressive eyes, realistic military hairstyle. Wearing an advanced high-tech space flightsuit with {COLOR_SCHEME} armored collar, intricate communications earpiece, and subtle glowing tactical rank badge. Crisp facial features, soft ambient occlusion, cinematic studio lighting with subtle rim light reflecting the pilot's signature aura color, dark tactical cockpit background blurred in bokeh, high fidelity, 8k digital illustration, no watermark, no distorted anatomy.
```

### 3.3. Template Mẫu Sinh Ảnh Toàn Thân Phi Công (Pilot Full-Body - 9:16)
```text
Full-body character concept art of {PILOT_NAME}, an elite sci-fi aerospace pilot standing in a dynamic ready stance. High-detail semi-realistic anime art style. Wearing a tailored military flightsuit with {OUTFIT_DESCRIPTION}, high-tech knee-high combat flight boots, and modular utility belt. Clean silhouette, perfectly proportioned anatomy, visible fabric textures, nano-carbon fibers, and subtle glowing power circuits. Studio backdrop with soft dark gradient and subtle floor grid reflections, cinematic side key lighting, 8k resolution, high-end gacha game character showcase artwork, no background clutter, no watermark.
```

### 3.4. Từ Khóa Bắt Buộc & Từ Khóa Cấm (Positive & Negative Keywords)

| Bộ Từ Khóa Bắt Buộc (Positive Triggers) | Bộ Từ Khóa Cấm Đoán (Negative Concepts) |
|---|---|
| `high-detail 3D sci-fi mecha concept art` | `pixel art, 8-bit, 16-bit, low-poly, chunky lego` |
| `futuristic aerospace fighter, space interceptor` | `toy plane, cartoon doodle, flat 2d clipart` |
| `aerodynamic hull, panel lines, vectoring thrusters` | `blurry, jpeg artifacts, low resolution, noisy` |
| `realistic metallic titanium, carbon fiber textures` | `recolored clone, deformed wings, melted parts` |
| `cinematic rim lighting, volumetric thruster glow` | `text, watermark, logo, fake UI frames, badges` |
| `commercial sci-fi video game key art, 8k` | `monochrome flat icon, simple geometric silhouette` |

---

## 4. Quản Lý Tài Nguyên & Kiến Trúc Fallback 3 Lớp (Asset Architecture & Fallback)

Để bảo đảm hệ thống luôn vận hành ổn định và không bao giờ xảy ra lỗi vỡ ảnh (broken images) khi triển khai thực tế hoặc khi quota sinh ảnh bị hạn chế, toàn bộ mã nguồn tuân thủ **Kiến trúc Phòng Vệ 3 Lớp (3-Tier Asset Resilience Architecture)**:

```
               YÊU CẦU HIỂN THỊ ASSET (Ví dụ: Vanguard Gear)
                                     │
                                     ▼
        ┌────────────────────────────────────────────────────────┐
        │ LỚP 1: High-Res Raster Asset (.jpg / .png)             │
        │ File: /public/images/vanguard-gear.jpg (697 KB)        │
        │ - Artwork 3D render chuẩn thương mại                    │
        │ - Độ phân giải cao, hiển thị trọn vẹn chi tiết          │
        └────────────────────────────┬───────────────────────────┘
                                     │ (Nếu file thiếu / lỗi)
                                     ▼
        ┌────────────────────────────────────────────────────────┐
        │ LỚP 2: Dedicated Vector SVG Fallback                   │
        │ File: /public/images/vanguard.svg (4.4 KB)             │
        │ - Vector sạch sẽ với đường nét khí tài chính xác        │
        │ - Khớp 100% màu sắc và thông số nhận diện              │
        └────────────────────────────┬───────────────────────────┘
                                     │ (Nếu không tải được ảnh)
                                     ▼
        ┌────────────────────────────────────────────────────────┐
        │ LỚP 3: Styled CSS Glass Container & Lucide Icon        │
        │ Code: bg-slate-950/80 border-cyan-500/40 + <Plane />   │
        │ - Gradient màu chủ đạo của lớp Gear                    │
        │ - Không bao giờ để lại ô trống hoặc alt vỡ             │
        └────────────────────────────────────────────────────────┘
```

### 4.1. Quy Ước Đặt Tên & Đường Dẫn (Naming Conventions)
- **Ảnh Gear**: `/public/images/{gearId}-gear.jpg` (Ví dụ: `vanguard-gear.jpg`, `falcon-gear.jpg`, `aegis-gear.jpg`).
- **Ảnh Chân Dung Pilot**: `/public/images/{pilotId}-portrait.jpg` (Ví dụ: `marcus-portrait.jpg`, `valentine-portrait.jpg`).
- **Ảnh Toàn Thân Pilot**: `/public/images/{pilotId}-fullbody.png` (Ví dụ: `marcus-fullbody.png`, `valentine-fullbody.png`).
- **Asset Sinh bởi Tool**: Lưu tại `/src/assets/images/{name}_{timestamp}.jpg` sau đó copy chuẩn hóa sang `/public/images/`.

### 4.2. Thẻ `<img>` và Next.js `<Image>` Tuân Thủ Quy Chuẩn
Mọi thẻ hiển thị hình ảnh trong components **BẮT BUỘC** có thuộc tính `referrerPolicy="no-referrer"` và xử lý sự kiện `onError` chuyển đổi mượt mà sang fallback:

```tsx
<img
  src={gearDef.illustration || `/images/${gearDef.id}.svg`}
  alt={gearDef.name}
  className="w-full h-full object-cover rounded-lg"
  referrerPolicy="no-referrer"
  onError={(e) => {
    // Tự động chuyển về vector fallback nếu file raster gặp sự cố
    const target = e.currentTarget
    if (!target.src.endsWith('.svg')) {
      target.src = `/images/${gearDef.id}.svg`
    }
  }}
/>
```

---

## 5. Lộ Trình Nâng Cấp Asset Thực Tế (Asset Upgrade Roadmap)

| Hạng mục Asset | Trạng thái hiện tại | Chuẩn mục tiêu | Kế hoạch nâng cấp tiếp theo |
|---|---|---|---|
| **3 Lớp Cơ Giáp Hiện Tại** (`vanguard`, `falcon`, `aegis`) | Đã có raster 16:9 (`vanguard-gear.jpg`, `falcon-gear.jpg`, `aegis-gear.jpg`) dung lượng 700–830KB | High-Detail 3D Mecha Concept Art | Tinh chỉnh ánh sáng buồng lái, giữ file hiện tại làm chuẩn |
| **4 Chân Dung Phi Công** (`marcus`, `valentine`, `alviss`, `eric`) | Đã có raster 1024x1024 (`.jpg`, `.png`) chất lượng cao 648–936KB | Anime-Realistic Pilot Portraits | **Đạt chuẩn 100%**, duy trì tính nhất quán |
| **4 Toàn Thân Phi Công** | Đang dùng SVG nhúng portrait fallback | Full-Body 9:16 Illustration độ phân giải cao | Sinh tranh toàn thân 9:16 khi quota khả dụng và nạp vào `/public/images/` |
| **Cơ Giáp Thứ 4: Specter** | Chưa khởi tạo (Phase 6) | 16:9 Stealth Electronic Warfare Mecha | Khởi tạo prompt và asset trong Phase 6 |
| **3 Biến Thể Kẻ Địch** | Đang dùng SVG và icon HUD | 16:9 Enemy Vehicle Concept Art | Lập danh mục tranh minh họa Boss và Quái |

---

## 6. Danh Mục Kiểm Định Chất Lượng Mỹ Thuật (Art QA Checklist)

Trước khi đưa bất kỳ hình ảnh nào vào mã nguồn chính thức, AI hoặc Họa sĩ phải tự kiểm tra qua 10 câu hỏi vàng:

- [ ] **1. Tỷ lệ khung hình**: File có đúng chuẩn 16:9 (cho Mecha/Hangar) hoặc 1:1 / 9:16 (cho Pilot) không?
- [ ] **2. Độ sắc nét**: Khi zoom 100%, đường nét có sắc sảo, không bị răng cưa hay nhòe vỡ hạt pixel không?
- [ ] **3. Cấu trúc cơ khí**: Phi cơ có đầy đủ buồng lái, cánh lướt, động cơ phản lực và giá vũ khí hợp lý không?
- [ ] **4. Chất liệu kim loại**: Vỏ máy bay có phản xạ ánh sáng kim loại (specular) và đường nối panel lines rõ ràng không?
- [ ] **5. Màu sắc định danh**: Màu chủ đạo có khớp với mã màu của Gear (Vanguard = Cyan, Falcon = Purple, Aegis = Amber) không?
- [ ] **6. Biểu cảm nhân vật**: Khuôn mặt phi công có thần thái sắc nét, trang phục quân sự sci-fi phù hợp với tính cách không?
- [ ] **7. Không có rác thị giác**: Hình ảnh có bị lẫn watermark, chữ ký, logo lạ hay viền UI giả bên trong không?
- [ ] **8. Độ tương phản**: Chủ thể có nổi bật rõ ràng trên nền không gian/hangar, không bị chìm nghỉm vào background không?
- [ ] **9. Tính nguyên bản**: Hình ảnh có mang bản sắc riêng của STARFRONT, không sao chép nguyên mẫu có bản quyền không?
- [ ] **10. Fallback sẵn sàng**: Đã chuẩn bị file fallback SVG hoặc CSS fallback an toàn trong mã nguồn chưa?

---
*Tài liệu này là quy chuẩn bắt buộc có hiệu lực tức thì trên toàn bộ hệ thống repository STARFRONT.*
