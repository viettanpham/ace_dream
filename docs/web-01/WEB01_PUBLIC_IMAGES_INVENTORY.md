# STARFRONT WORLD V2 — WEB-01
# BÁO CÁO KIỂM KÊ TÀI NGUYÊN HÌNH ẢNH (PUBLIC IMAGES INVENTORY)

**Mã tài liệu:** WEB01-INVENTORY-01  
**Trạng thái:** VERIFIED / CANONICAL AUDIT  
**Ngày kiểm kê:** 2026-10-22  
**Thư mục kiểm tra:** `public/images/`

---

## 1. Thống kê tổng quan

- **Tổng số tệp tin:** 26 tệp
- **Tổng dung lượng đĩa:** 5,699,572 bytes (~5.44 MB)
- **Định dạng tệp:** 100% là `.webp` (đã tối ưu hóa chuẩn nén cao cấp)
- **Cấu trúc thư mục:** Thư mục phẳng (flat structure) trực tiếp dưới `public/images/`
- **Tệp trùng lặp (Duplicates):** 0 tệp (100% checksum SHA-256 là duy nhất)
- **Tệp có dung lượng lớn nhất:** `valentine-story-001.webp` (539,724 bytes / 527.07 KB)
- **Tệp có dung lượng nhỏ nhất:** `marcus-portrait.webp` (28,296 bytes / 27.63 KB)
- **Dung lượng trung bình mỗi tệp:** ~219.21 KB

---

## 2. Phân loại theo mục đích sử dụng

### 2.1. Nhóm Phi công V1 (Legacy Pilots) — 16 tệp (~1,808 KB)
Bao gồm 8 nhân vật chính của V1. Mỗi nhân vật gồm 1 ảnh chân dung tỉ lệ 1:1 (`-portrait.webp`) và 1 ảnh toàn thân tỉ lệ 9:16 (`-fullbody.webp`).

| Phi công | ID | Avatar Portrait (1:1) | Dung lượng | Full-body Artwork (9:16) | Dung lượng |
| :--- | :---: | :--- | :---: | :--- | :---: |
| **Marcus Thorne** | `marcus` | `marcus-portrait.webp` | 27.63 KB | `marcus-fullbody.webp` | 102.97 KB |
| **Valentine Vance** | `valentine` | `valentine-portrait.webp` | 414.26 KB | `valentine-fullbody.webp` | 472.01 KB |
| **Alviss Drake** | `alviss` | `alviss-portrait.webp` | 41.75 KB | `alviss-fullbody.webp` | 136.03 KB |
| **Eric Brandt** | `eric` | `eric-portrait.webp` | 51.11 KB | `eric-fullbody.webp` | 181.24 KB |
| **Lyra Song** | `lyra` | `lyra-portrait.webp` | 50.07 KB | `lyra-fullbody.webp` | 226.31 KB |
| **Kaelen Cross** | `kaelen` | `kaelen-portrait.webp` | 35.30 KB | `kaelen-fullbody.webp` | 126.30 KB |
| **Selena Vega** | `selena` | `selena-portrait.webp` | 53.39 KB | `selena-fullbody.webp` | 219.88 KB |
| **Victor Sterling** | `victor` | `victor-portrait.webp` | 39.20 KB | `victor-fullbody.webp` | 140.59 KB |

*Ghi chú:* Ảnh Valentine Portrait và Fullbody có dung lượng cao hơn hẳn (414 KB & 472 KB) do được render lại ở độ phân giải siêu nét (1122×1402) phục vụ cả V1 và Character Profile V2.

### 2.2. Nhóm Phi cơ GEAR V1 (Legacy Gear Illustrations) — 3 tệp (~539 KB)
Sử dụng trong màn hình Hangar, Trang bị phi cơ và Chiến dịch V1:

| Tên GEAR | Mã hệ thống | Tệp hình ảnh | Dung lượng | Vai trò |
| :--- | :---: | :--- | :---: | :--- |
| **Vanguard Gear** | `A-GEAR` | `vanguard-gear.webp` | 140.66 KB | Thiết giáp công thành hạng nặng (Cannon) |
| **Falcon Gear** | `I-GEAR` | `falcon-gear.webp` | 200.05 KB | Tiêm kích siêu thanh đánh chặn (Missile/Plasma) |
| **Aegis Gear** | `M-GEAR` | `aegis-gear.webp` | 198.16 KB | Phi cơ hỗ trợ phòng thủ & tiếp ứng (Energy/Shield) |

### 2.3. Nhóm Valentine V2 Approved Artworks — 7 tệp (~3,303 KB)
Các tác phẩm nghệ thuật chính thức đã duyệt cho FND-8 Character Category V2 (Valentine Vance) phục vụ các Tab Overview, Story, Hangar Duty và Gallery:

| Mã tệp | Dung lượng | Tỉ lệ / Kích thước | Mục đích sử dụng | Trạng thái FND-8 |
| :--- | :---: | :---: | :--- | :---: |
| `valentine-story-001.webp` | 527.07 KB | 1086×1448 | Story Chapter 01 / Tranh cốt truyện | APPROVED |
| `valentine-combat.webp` | 501.40 KB | 1086×1448 | Combat Action / Hỏa lực phòng thủ | APPROVED |
| `valentine-event-001.webp` | 500.81 KB | 1086×1448 | Sự kiện không gian / Tác chiến cứu hộ | APPROVED |
| `valentine-activity-001.webp` | 469.55 KB | 1086×1448 | Story Chapter 03 / Hoạt động thường nhật | APPROVED |
| `valentine-closeup.webp` | 438.66 KB | 1122×1402 | Cận cảnh gương mặt / Story Chapter 01 | APPROVED |
| `valentine-uniform-001.webp` | 413.79 KB | 1122×1402 | Story Chapter 02 / Quân phục Học viện | APPROVED |
| `valentine-casual.webp` | 376.37 KB | 1122×1402 | Story Chapter 04 / Trang phục dạo phố | APPROVED |

---

## 3. Danh mục chi tiết 26 tệp & Bảng băm toàn vẹn (SHA-256 Checksums)

Bảng này là **Cơ sở Đối chiếu Bắt buộc (Canonical Checksum Manifest)** khi thực hiện upload lên Repository Assets ngoài và kiểm tra tính toàn vẹn (Zero Data Corruption):

| STT | Đường dẫn tương đối | Kích thước (Bytes) | SHA-256 Checksum |
| :---: | :--- | :---: | :--- |
| 1 | `images/aegis-gear.webp` | 202,914 | `4d8f67598dd2b2eec8b5e696ca7101aadcf977cd45be99435189356b8ec09947` |
| 2 | `images/alviss-fullbody.webp` | 139,294 | `a9597a206b750f0dfe1c512a752b891c75714433ba2cf3d50dcc23b06ea05700` |
| 3 | `images/alviss-portrait.webp` | 42,752 | `bd7c2d505fe5d7d0c92a10770db8407e38d0db7b6d363141fee6d7cc5e682646` |
| 4 | `images/eric-fullbody.webp` | 185,586 | `f2729483ac5c7c6118c1b4c68968a4c255379c74d534df53bdd96f217ab45f58` |
| 5 | `images/eric-portrait.webp` | 52,338 | `36b557029fd7296682a9e2ce523a0c9b4f77b6cb0c62ab3d69231bc7aa46905f` |
| 6 | `images/falcon-gear.webp` | 204,850 | `2f211c956ec4431c8887a3fca6cbc163865f1d01d0a172b7f2686794e4fc89f7` |
| 7 | `images/kaelen-fullbody.webp` | 129,332 | `76908cc908ee8575e38b3b2b7f2c6667a79a38ae8eb45a4687ce92bbf7925eb7` |
| 8 | `images/kaelen-portrait.webp` | 36,150 | `56a2a3c9ed4a59b9e0353f5b71eb4296f0dc4657e0aa105d2496ada385fdc7b0` |
| 9 | `images/lyra-fullbody.webp` | 231,746 | `918464373d26d219bd304f4348d935cd32c0edf753fc48969e8ba26e93e76649` |
| 10 | `images/lyra-portrait.webp` | 51,272 | `efec332ba2660b93771411d130bd811cc50064774c8a15c009220b0042d6c118` |
| 11 | `images/marcus-fullbody.webp` | 105,444 | `c6c98198f13dbb5a0d9bb198ea1c2f4ed17e3c13afca5321c6082be99bcfbc67` |
| 12 | `images/marcus-portrait.webp` | 28,296 | `565b63ae63c4458e2b452090e085567adeb494c8c1c1ba7b843486b233d44c34` |
| 13 | `images/selena-fullbody.webp` | 225,160 | `51f22c5a9b0e4db19817503e3cc23c6a597c9e5b7dee41245f14cc599d3b5af1` |
| 14 | `images/selena-portrait.webp` | 54,668 | `aba519e965c7305c08f5b5b1ba406a183576b1e0420b39ce2fc82ae57e631cae` |
| 15 | `images/valentine-activity-001.webp` | 480,818 | `6471a942dcab6f7d07f83b814ce5383d25afad9a3e9f54d47cbefa04c827e207` |
| 16 | `images/valentine-casual.webp` | 385,402 | `cc301d0ff596c4563cc6178cb154cd4bedf26e1b8815c13d03e7fc49753825ae` |
| 17 | `images/valentine-closeup.webp` | 449,192 | `a2e49bb48158098b504e93d72799c5f320111b98c5d84f836c6395612a5b8bcf` |
| 18 | `images/valentine-combat.webp` | 513,434 | `443953cffe133c4bdd531eefb90f5dff7aeac5cc091331fa95a7647ca065f630` |
| 19 | `images/valentine-event-001.webp` | 512,834 | `829852c62bc98e1f18c20b2a41923f5cccf05c77c0a72d85510212f8eca71f5a` |
| 20 | `images/valentine-fullbody.webp` | 483,340 | `77a5d00d66aeed9014c60cafa7a528e38826b0dce35c836ef2776c18f846c495` |
| 21 | `images/valentine-portrait.webp` | 424,206 | `e8439a87904127649e9bb72b6eb41c53d21176f83f0f1b885f2dc05bafa2bc11` |
| 22 | `images/valentine-story-001.webp` | 539,724 | `946fdf23df59e89159f51dc29bfd46376c6a353f14e6b6686749e8c126718386` |
| 23 | `images/valentine-uniform-001.webp` | 423,716 | `7da69f7960252c924ee78b258131b2543e384eb09cbb62797cbd04a9f5f033a0` |
| 24 | `images/vanguard-gear.webp` | 144,036 | `f1564d6e866a0a85b38a97ebb583f192c324f29e3317e030ec4edcdcdc416293` |
| 25 | `images/victor-fullbody.webp` | 143,962 | `0a1c4db58484c2da5590953aee0ac73a15894c7972d95896e650cc2573b965bb` |
| 26 | `images/victor-portrait.webp` | 40,140 | `d5d6bf9b846b2e18f53f66d6f673abce84a86cf032b4c8540bac29b97f8faf19` |

---

## 4. Các tệp ngoại vi ngoài thư mục `public/images/`

1. **`public/icon.svg` (Dung lượng: ~2 KB):**
   - Biểu tượng vector SVG đại diện cho ứng dụng STARFRONT, favicon và PWA icon.
   - **Chính sách:** **BẮT BUỘC GIỮ LOCAL** trong `public/`. Không di chuyển ra CDN để đảm bảo trình duyệt nạp icon tức thời ngay cả khi mất mạng.
2. **`src/assets/images/valentine_portrait_1791631686158.jpg`:**
   - Tệp JPEG thô cũ được lưu lại từ giai đoạn tạo mẫu ban đầu.
   - **Chính sách:** Tệp tài liệu lưu trữ nội bộ (archive), không được nạp trực tiếp qua thẻ `<Image>` của runtime.
3. **`docs/art-direction/UI_CONCEPTS/`:**
   - 3 tệp WebP concept giao diện (`FND8_823_CHARACTER_CATEGORY_PROFILE_DESKTOP_APPROVED.webp`, `MOBILE_APPROVED.webp`, `MOBILE_INFO_VIEW_REFERENCE.webp`).
   - **Chính sách:** Tệp tài liệu thiết kế (Design Specification), không tham gia vào runtime game.

---

## 5. Quy tắc bảo toàn đường dẫn

Mọi kế hoạch tải lên CDN và migration phải **giữ nguyên 100% tên tệp và phần mở rộng `.webp`**. Không đổi tên dạng slug, không chuyển thành mã hash ngẫu nhiên để đảm bảo tính nhất quán với `valentine_assets_manifest.json` và code base.
