# STARFRONT WORLD V2 — BÁO CÁO PHỦ ĐẦY METADATA 200 WEBP (R3)
## METADATA COVERAGE & CURATION AUDIT REPORT

**Mã tài liệu:** FND8-WEB01-METADATA-COVERAGE-R3  
**Giai đoạn:** CHECKPOINT 2.1 — EXPORT CDN R3 INTEGRATION PACKAGE  
**Ngày thực hiện:** 2026-10-24  
**Nguồn dữ liệu đối chiếu:** CDN `v2.0-assets-r2`, Game Source `lib/game/v2/character-profile-data.ts`, Checkpoint Library.

---

### 1. TỔNG QUAN TÌNH TRẠNG METADATA 200 WEBP

Từ kết quả quét nhị phân và đối chiếu trực tiếp từ release tag `v2.0-assets-r2`:
- **Tổng số lượng tác phẩm WebP thực tế:** **200 tệp** trên 9 Pilot canonical.
- **Tình trạng mã băm SHA-256:** **200/200 tệp (100%)** sở hữu mã SHA-256 64 ký tự thực tế, được tính toán từ file nhị phân trên CDN R2. Không có giá trị hash giả định.
- **Tình trạng kích thước ảnh:** 100% có thông số `width`, `height`, `aspectRatio` và `byteSize` đo đạc chính xác.
- **Tình trạng Tiêu đề (Title):**
  - **100% (200/200 ảnh)** có tiêu đề phân loại tiếng Việt chuẩn hóa (ví dụ: *"Trang phục đời thường"*, *"Chiến phục 001"*, *"Ảnh cận cảnh"*, *"Dạ tiệc 001"*).
  - Không có tiêu đề dạng thô kiểu `pilot-filename.webp`.
- **Tình trạng Mô tả chi tiết (Description — Trang phục, tư thế, bối cảnh):**
  - **9 tác phẩm của Valentine** đã có mô tả văn xuôi chi tiết về trang phục, bối cảnh và tư thế (kế thừa từ `character-profile-data.ts` đã được duyệt).
  - **191 tác phẩm còn lại:** Hiện tại trên CDN R2 **chỉ có tiêu đề phân loại ngắn gọn, CHƯA CÓ trường `description` văn xuôi chi tiết**. Các trường này cần được nhập tiếp từ bộ hồ sơ kiểm duyệt tại ChatGPT Library khi chuẩn bị cho các đợt phát hành tiếp theo.

---

### 2. BẢNG CHI TIẾT ĐỘ PHỦ METADATA THEO TỪNG PILOT

| Pilot ID | Tên nhân vật | Callsign | Số WebP trên R2 | Curated Title | Curated Description | Auto/Fallback Title | Verified SHA-256 | Tình trạng kiểm duyệt |
|---|---|---|:---:|:---:|:---:|:---:|:---:|---|
| `valentine` | Valentine Aurelia Vance | Mercy Wing | **35** | 35 (100%) | **9 (25.7%)** | 0 | 35 (100%) | **Đã biên tập 9 tranh cốt lõi**; 26 tranh có title phân loại. |
| `fortuna` | Fortuna | Lady Luck | **30** | 30 (100%) | 0 (0%) | 0 | 30 (100%) | 100% có title phân loại tiếng Việt; Chờ nhập description. |
| `rhea` | Rhea Silva | Vanguard Aegis | **23** | 23 (100%) | 0 (0%) | 0 | 23 (100%) | 100% có title phân loại tiếng Việt; Chờ nhập description. |
| `nova` | Nova Ray | Solar Flare | **22** | 22 (100%) | 0 (0%) | 0 | 22 (100%) | 100% có title phân loại tiếng Việt; Chờ nhập description. |
| `kaelen` | Kaelen Cross | Shadow Fang | **20** | 20 (100%) | 0 (0%) | 0 | 20 (100%) | 100% có title phân loại tiếng Việt; Chờ nhập description. |
| `lyra` | Lyra Song | Starling Swift | **20** | 20 (100%) | 0 (0%) | 0 | 20 (100%) | 100% có title phân loại tiếng Việt; Chờ nhập description. |
| `selena` | Selena Vega | Crimson Spark | **20** | 20 (100%) | 0 (0%) | 0 | 20 (100%) | 100% có title phân loại tiếng Việt; Chờ nhập description. |
| `aria` | Aria Sterling | Blue Horizon | **20** | 20 (100%) | 0 (0%) | 0 | 20 (100%) | 100% có title phân loại tiếng Việt; Chờ nhập description. |
| `alviss` | Alviss Sterling | Black Gale | **10** | 10 (100%) | 0 (0%) | 0 | 10 (100%) | 100% có title phân loại tiếng Việt; Chờ nhập description. |
| **TỔNG CỘNG (9 Pilot R2)** | — | — | **200** | **200 (100%)** | **9 (4.5%)** | **0 (0%)** | **200 (100%)** | **Sẵn sàng phát hành R3 an toàn.** |

---

### 3. NHÓM 3 PILOT CANONICAL V1 FALLBACK (ERIC, MARCUS, VICTOR)

Trong FND-8, 3 Pilot nam này thuộc 12 nhân vật chính thức nhưng chưa có bộ ảnh mở rộng trên CDN R2:
- `eric`: 2 tác phẩm Core V1 (`images/eric-portrait.webp`, `images/eric-fullbody.webp`). Đã có title và description chuẩn mực.
- `marcus`: 2 tác phẩm Core V1 (`images/marcus-portrait.webp`, `images/marcus-fullbody.webp`). Đã có title và description chuẩn mực.
- `victor`: 2 tác phẩm Core V1 (`images/victor-portrait.webp`, `images/victor-fullbody.webp`). Đã có title và description chuẩn mực.

Cả 3 Pilot này đã được tạo khung metadata staging tại `images/pilots/<pilotId>/` để không gây lỗi 404 cho Client.

---

### 4. ĐỐI CHIẾU MÔ TẢ TRANG PHỤC, TƯ THẾ VÀ BỐI CẢNH

#### 4.1. 9 Tác phẩm Valentine đã có Curation đầy đủ:
1. `valentine-portrait.webp` — *Chân Dung Đại Diện (Portrait)*: "Chân dung tỉ lệ 1:1 góc nhìn cận cảnh khuôn mặt dịu dàng và ánh mắt kiên định."
2. `valentine-fullbody.webp` — *Tranh Toàn Thân Chiến Trường (Official)*: "Thiết kế toàn thân trang phục quân y chiến trường Mercy Wing chính thức."
3. `valentine-activity-001.webp` — *Trực Ca Phòng Khám Quỹ Đạo*: "Khoảnh khắc chăm sóc bệnh nhân tại trạm y tế Elysia trong ca trực đêm."
4. `valentine-casual.webp` — *Trang Phục Thường Nhật Elysia*: "Áo len cổ lọ thanh lịch và áo khoác thường phục trong ngày nghỉ phép."
5. `valentine-closeup.webp` — *Góc Nhìn Cận Cảnh Chiến Thuật*: "Kính bảo hộ hiển thị dữ liệu sinh học trong lúc phẫu thuật khẩn cấp."
6. `valentine-combat.webp` — *Xuất Kích Cứu Hộ Tiền Tuyến*: "Tư thế kích hoạt trường lực khiên che chắn cho đồng đội giữa hỏa tuyến."
7. `valentine-event-001.webp` — *Dạ Tiệc Vũ Trụ Sắc Đỏ*: "Trang phục dạ hội lộng lẫy trong lễ kỷ niệm hòa bình của Liên minh Elysia."
8. `valentine-story-001.webp` — *Tia Nắng Sau Bão Elysia*: "Bản vẽ minh họa khoảnh khắc bình yên sau khi hoàn tất cuộc sơ tán y tế."
9. `valentine-uniform-001.webp` — *Quân Phục Sĩ Quan Cứu Trợ*: "Đồng phục chỉ huy đội cứu hộ không gian với phù hiệu Mercy Wing."

#### 4.2. Kế hoạch bổ sung 191 mô tả còn lại:
- Hệ thống R3 được thiết kế theo cơ chế **Non-Destructive Overwrite**:
  Khi chủ dự án xuất các tệp mô tả chi tiết từ ChatGPT Library vào file `<pilotId>.json` (ví dụ `fortuna.json`, `rhea.json`), script `generate-asset-index.mjs` sẽ tự động đọc và merge trường `description` vào `gallery.json` mà không làm thay đổi các trường kỹ thuật khác (`sha256`, `bytes`, `dimensions`).
- Trình xem Gallery UI trên Game Client được thiết kế để render mượt mà khi `description` chưa có (chỉ hiển thị Badge vai trò, Category và Title tiếng Việt), không gây vỡ giao diện.

---

### 5. KẾT LUẬN & ĐỀ XUẤT CHO RELEASE R3

1. Bộ dữ liệu staging 200 tác phẩm hiện tại đã **đạt 100% điều kiện an toàn kỹ thuật** để đóng gói và phát hành Release R3 (Đầy đủ SHA-256 thật, không có duplicate assetId, không có link hỏng).
2. Việc thiếu mô tả chi tiết của 191 ảnh không phải là blocker cho việc phát hành hạ tầng CDN R3, vì hệ thống hỗ trợ cập nhật metadata theo từng đợt thông qua GitHub Actions mà không cần thay đổi file nhị phân ảnh WebP.
