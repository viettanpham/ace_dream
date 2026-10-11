# STARFRONT — Official Art Direction & Visual Standards
*Master Art Direction Specification & Asset Standards Manual*  
*Document Version: 3.1 — Updated: October 2026*  
*Status: Approved Official Standard for all STARFRONT character assets, mecha design, UI artwork, and asset lifecycle management*

---

## 1. Executive Summary & Core Art Direction Vision

**STARFRONT** is a turn-based tactical aerospace & mecha combat RPG set in a futuristic galaxy. The visual identity of STARFRONT is defined by a strict dual-pillar aesthetic framework:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          STARFRONT MASTER ART DIRECTION PIPELINE                       │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
     [ PILLAR 1: GEAR ARTWORK FOUNDATION ]           [ PILLAR 2: PILOT CHARACTER ARTWORK ]
     - High-tech 3D Aerospace Mecha Concept Art      - Premium Japanese Anime Character Art
     - Defines sci-fi design language & materials    - Beautiful, expressive anime faces & eyes
     - Hardware complexity, thrusters & plating      - Refined cel shading & clean line art
     - Canonical color palettes & energy fx          - Highly detailed sci-fi pilot combat suits
     - Visual reference for the entire game world    - Fully distinct silhouettes & personalities
```

---

## 2. Pillar 1: GEAR Artwork as the Canonical Sci-Fi Design Reference

The existing 3 STARFRONT GEAR artworks (`vanguard-gear.jpg`, `falcon-gear.jpg`, `aegis-gear.jpg`) are the **canonical visual anchor and source of truth** for STARFRONT's sci-fi aesthetic. 

Every character armor design, pilot flight suit, cybernetic implant, sensory visor, and weapon system must inherit its materials, lighting language, and color harmony directly from the GEAR artwork:

### 2.1. The Three Canonical GEAR Archetypes

1. **Vanguard GEAR (`/public/images/vanguard-gear.jpg`) — Fleet Command & Balanced Superiority**:
   - **Primary Palette**: Tactical Cyan (`#06b6d4`), Arctic Ice-Blue (`#38bdf8`), Deep Navy (`#0f172a`), Matte Titanium Grey (`#334155`).
   - **Mechanical Language**: Aerodynamic multi-angled composite plating, twin photon pulse cannons, dual wing ion thrusters emitting blue plasma trails.
   - **Pilot Affiliation**: **Marcus Thorne** (Commander / Vanguard Exo-Suit), **Eric Brandt** (Heavy Bombardment Artillery), **Selena Cross** (High-Energy Solaris Beam Specialist).

2. **Falcon GEAR (`/public/images/falcon-gear.jpg`) — Supersonic Interceptor & Precision Strike**:
   - **Primary Palette**: Cyber Violet / Neon Purple (`#a855f7`), Dark Amethyst (`#7e22ce`), Glossy Obsidian Carbon Fiber (`#09090b`), Vivid Magenta Tracers (`#d946ef`).
   - **Mechanical Language**: Mach-speed swept delta wings, stealth radar-absorbent chiseled angles, twin proton afterburners, high-frequency plasma blades.
   - **Pilot Affiliation**: **Alviss Drake** (Supersonic Speed Demon Ace), **Lyra Vance** (Agile Valkyrie Dual-Blade Duelist), **Kaelen Voss** (Cipher Electronic Warfare Infiltrator).

3. **Aegis GEAR (`/public/images/aegis-gear.jpg`) — Fortified Heavy Armor & Kinetic Defense**:
   - **Primary Palette**: Industrial Amber Gold (`#f59e0b`), Deep Bronze (`#b45309`), Heavy Blast-Resistant Charcoal Carbon (`#18181b`), Hazard Ochre (`#d97706`).
   - **Mechanical Language**: Heavy multi-layered reactive armor slabs, twin heavy Gauss/railgun cannons, spherical magnetic barrier emitter arrays, reinforced hydraulic actuators.
   - **Pilot Affiliation**: **Valentine Vance** (Aegis Angel Support & Nano-Barrier Specialist), **Victor Stone** (Bastion Heavy Bulwark Guardian).

### 2.2. Visual Rule: Reference, Not Reproduction
- The GEAR artwork provides the **design language, technology tier, material fidelity, and atmospheric lighting**.
- The Pilot characters **must not** look like faceless robots or mechanical models. They are human pilots rendered in a **gorgeous Japanese anime illustration style** wearing equipment that visibly belongs inside or alongside these high-tech machines.

---

## 3. Pillar 2: Premium Japanese Anime Sci-Fi Character Illustration Standard

### 3.1. Mandatory Anime Character Aesthetic
All STARFRONT Pilot character illustrations must strictly adhere to the following visual benchmarks:

1. **Facial Features & Expressions**:
   - Modern, high-end Japanese anime character design (reminiscent of top-tier anime RPG key art such as *Honkai: Star Rail*, *Genshin Impact*, *Arknights*, and modern *Gundam* series).
   - Exquisitely rendered anime eyes with intricate irises, multi-tone color gradients, luminous specular highlights, and expressive emotion matching the pilot's persona.
   - Beautiful facial structures: slender anime jawlines, refined noses and lips, perfectly styled anime hair with soft lighting gradients and highlights.

2. **Linework & Inking**:
   - Clean, crisp, high-precision digital line art with subtle line-weight variation.
   - Absolutely no pixelated outlines, messy rough sketches, or blurred vector strokes.

3. **Coloring & Shading**:
   - Multi-tone cel shading combined with smooth digital painterly blending for skin and hair.
   - Distinct material rendering: matte synthetic pilot fabrics, glossy carbon-composite armor plates, brushed metallic accents, and emissive LED/plasma light strips.
   - Volumetric rim lighting (edge highlights) matching the pilot's signature GEAR energy color.

4. **Composition & Poses**:
   - Dynamic, confident anime character poses that convey combat readiness and personality.
   - Strong silhouettes readable at both full-body scale and thumbnail avatar sizes.

### 3.2. Strict Anti-Slop Discipline (Zero Tolerance)
The following are **strictly prohibited** in all STARFRONT character assets:
- ❌ **No Pixel Art / Retro Sprites**: Zero 8-bit, 16-bit, pixelated sprites, retro low-res tiles, or chunky game graphics.
- ❌ **No Code-Simulated Graphics**: No SVG vector drawings, HTML canvas strokes, or CSS-generated characters pretending to be art.
- ❌ **No Low-Poly 3D / Chibi**: No distorted proportions, blocky voxel geometry, or oversized-head chibi avatars.
- ❌ **No Placeholders or Watermarks**: No mockups, stock watermarks, fake UI borders, or AI generation artifacts.

---

## 4. The 16-Asset Requirement & Master Pilot Roster

Every STARFRONT pilot requires **two dedicated high-resolution raster image assets**:
1. **Portrait Asset** (Head and shoulders / Bust, 1:1 Square) for pilot avatars, dialogue portraits, tactical unit cards, and HUD comms.
2. **Full-Body Asset** (Standing action / Poster stance, 9:16 Vertical) for pilot roster dossier, hangar inspection, promotion cards, and detail galleries.

### 4.1. Official Roster of 8 STARFRONT Pilots (16 Total Image Assets)

| Pilot ID | Full Name & Callsign | Gender & Age | Role & Weaponry | Associated GEAR | Portrait File (1024×1024) | Full-Body File (900×1600) |
|---|---|---|---|---|---|---|
| `marcus` | **Marcus Thorne**<br>`WAR DOG / IRONCLAD` | Male, 30 | Frontline Commander, Heavy Assault Rifle & Leader Exosuit | Vanguard (`#06b6d4`) | `/public/images/marcus-portrait.png` | `/public/images/marcus-fullbody.png` |
| `valentine` | **Valentine Vance**<br>`AEGIS ANGEL` | Female, 22 | Nano-Shield Specialist, Forcefield Projector, Medical Visor | Aegis (`#f59e0b`) | `/public/images/valentine-portrait.png` | `/public/images/valentine-fullbody.png` |
| `alviss` | **Alviss Drake**<br>`GHOSTFIRE` | Male, 26 | Supersonic Ace, 0.07s Reflexes, High-G Flight Suit | Falcon (`#a855f7`) | `/public/images/alviss-portrait.png` | `/public/images/alviss-fullbody.png` |
| `eric` | **Eric Brandt**<br>`BUNKER BREAKER` | Male, 28 | Heavy Artillery Gunner, Gauss Siege Arm, Tactical Scope | Vanguard (`#06b6d4`) | `/public/images/eric-portrait.png` | `/public/images/eric-fullbody.png` |
| `lyra` | **Lyra Vance**<br>`VALKYRIE` | Female, 24 | High-Mobility Duelist, Twin Plasma Blades, Sleek Exosuit | Falcon (`#a855f7`) | `/public/images/lyra-portrait.png` | `/public/images/lyra-fullbody.png` |
| `kaelen` | **Kaelen Voss**<br>`CIPHER` | Female, 25 | Electronic Warfare Hacker, Holographic HUD, Tactical Stealth Suit | Falcon (`#a855f7`) | `/public/images/kaelen-portrait.png` | `/public/images/kaelen-fullbody.png` |
| `selena` | **Selena Cross**<br>`SOLARIS` | Female, 27 | High-Energy Photon Officer, Directed Energy Cannon, Command Visor | Vanguard (`#06b6d4`) | `/public/images/selena-portrait.png` | `/public/images/selena-fullbody.png` |
| `victor` | **Victor Stone**<br>`BASTION` | Male, 34 | Veteran Defense Guardian, Hydraulic Bulwark Shield, Cybernetic Eye | Aegis (`#f59e0b`) | `/public/images/victor-portrait.png` | `/public/images/victor-fullbody.png` |

*Note on Canonical Lore: Alviss Drake is strictly Male (a cocky, charismatic supersonic ace pilot). Gender parity across the 8 pilots is strictly 4 Male : 4 Female.*

---

## 5. Technical Asset Specifications & File Architecture

### 5.1. File System Specifications
- **Base Storage Path**: `/public/images/`
- **Web Accessible URL**: `/images/{filename}`
- **Naming Convention**:
  - Portrait: `{pilotId}-portrait.png` (e.g., `marcus-portrait.png`)
  - Full-Body: `{pilotId}-fullbody.png` (e.g., `marcus-fullbody.png`)
- **Format**: 32-bit PNG (RGBA with alpha transparency or cinematic studio sci-fi backdrop), uncompressed 8-bit per channel color depth.

### 5.2. Resolution and Aspect Ratios
- **Portrait Dimension**: `1024 × 1024 px` (Aspect Ratio `1:1`). Focus: Upper torso, collar armor, expressive anime face, detailed eyes and hair.
- **Full-Body Dimension**: `900 × 1600 px` (Aspect Ratio `9:16`). Focus: Complete standing figure from head to boots, showing flight suit mechanics, thruster packs, holster gear, and weapon.

### 5.3. Frontend UI Integration
- All character images are consumed directly by the client UI via standard Next.js image loading or `<img>` tags pointing to `/images/{filename}`.
- Dedicated interactive preview and inspection tool: **Pilot Art Gallery** (`components/game/pilot-gallery.tsx`), allowing high-resolution inspection, portrait/full-body toggle, gender filtering, metadata review, and 1:1 image verification.

---

## 6. Prompt Engineering Architecture & PixAI Catalog

For external image generation pipelines (such as PixAI, Stable Diffusion XL, Animagine XL, NovelAI), refer directly to the dedicated catalog:
👉 **`PIXAI_CHARACTER_PROMPTS.md`**

### 6.1. Universal Quality Prompt Header
```text
masterpiece, best quality, ultra-detailed, highres, anime concept art, official anime game key art,
clean line art, extremely detailed anime face, expressive detailed eyes, beautifully rendered layered hair,
sophisticated cel shading with smooth digital painting gradients, cinematic lighting, volumetric rim light,
futuristic sci-fi military combat uniform, sci-fi exosuit plating inspired by STARFRONT GEAR artwork
```

### 6.2. Universal Negative Prompt
```text
lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality,
low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, pixel art, 8-bit, 16-bit,
retro sprites, chibi, voxel, low-poly, 3d render, deformed, disfigured, poorly drawn face, mutated limbs
```

---

## 7. Quy Tắc Bắt Buộc: Bảo Vệ Image Assets Khi Hết Quota Tạo Ảnh (Asset Protection Protocol on Quota Exhaustion / HTTP 429)

Nhằm bảo toàn tính toàn vẹn của hệ thống tài nguyên đồ họa và ngăn ngừa tình trạng suy giảm chất lượng hiển thị trong dự án STARFRONT, toàn bộ quy trình sinh ảnh và quản trị asset bắt buộc phải tuân thủ nghiêm ngặt các quy tắc sau:

### 7.1. Đình chỉ ngay lập tức khi cạn kiệt tài nguyên / Quota Exhausted
- Khi công cụ tạo ảnh (AI Studio Image Generation / Gemini API) gặp bất kỳ điều kiện nào sau đây:
  - Hết quota (Quota Exceeded / Resource Exhausted).
  - Hết băng thông hoặc giới hạn tốc độ (Rate Limit).
  - Lỗi `429 RESOURCE_EXHAUSTED` hoặc `HTTP 429 Too Many Requests`.
- **Hành động bắt buộc**: **DỪNG NGAY LẬP TỨC** toàn bộ tác vụ gọi sinh ảnh tiếp theo và **GIỮ NGUYÊN 100% CÁC ASSET HÌNH ẢNH HIỆN CÓ** trên hệ thống tệp (`/public/images/`). Không cố gắng retry liên tục gây lỗi luồng làm việc.

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
  - Nếu cần tạo ảnh ngoài môi trường bị giới hạn, chỉ chuẩn bị bộ prompt chuẩn hóa (như catalog `PIXAI_CHARACTER_PROMPTS.md`) để thực hiện qua pipeline chuyên biệt bên ngoài, sau đó nạp file ảnh thành phẩm đạt chuẩn vào dự án.

### 7.5. Điều kiện tiên quyết để thay thế hoặc cập nhật Asset
Chỉ được phép thay thế một file ảnh hiện có khi và chỉ khi thỏa mãn **toàn bộ 4 điều kiện** sau:
1. **Tạo thành công thực tế**: Ảnh mới đã được tạo hoàn chỉnh thành công thông qua mô hình tạo ảnh chuyên dụng.
2. **Định dạng chuẩn**: Là file raster thực thụ (`PNG` hoặc `JPEG`) với độ phân giải cao đúng quy cách (Portrait: `1024×1024`, Full-Body: `900×1600` hoặc tỉ lệ 9:16).
3. **Chất lượng cao & Đúng phong cách**: Đạt tiêu chuẩn Premium Japanese Anime Sci-Fi Character Illustration, sắc nét, không pixel art, không biến dạng giải phẫu học, kế thừa chuẩn thẩm mỹ từ STARFRONT GEAR.
4. **Kiểm tra trực quan (Verification)**: Đã được xác nhận hiển thị chính xác và toàn vẹn trên giao diện người dùng.

---

## 8. Version History & Enactment

- **v1.0 (Initial)**: Tactical game mechanics and sprite asset drafting.
- **v2.0 (Revision)**: GEAR artwork integration and 8-pilot roster stabilization.
- **v3.0**: Official formalization of the **Premium Japanese Anime Sci-Fi Character Illustration Standard**, institutionalization of the **16-Asset Requirement (8 Portraits + 8 Full-Bodies)**, hard-linking of the **GEAR Artwork Sci-Fi Reference System**, and cross-referencing with **`PIXAI_CHARACTER_PROMPTS.md`**.
- **v3.1 (Current Enacted)**: Bổ sung chính thức **Mục 7: Quy Tắc Bắt Buộc Bảo Vệ Image Assets Khi Hết Quota Tạo Ảnh (HTTP 429 RESOURCE_EXHAUSTED Protocol)** — nghiêm cấm xóa/ghi đè/thay thế bằng SVG, CSS hay code-drawn graphics; bảo toàn tuyệt đối tài nguyên hiện hữu.

*This document represents the mandatory artistic law and asset lifecycle governance for all current and future STARFRONT visual development.*
