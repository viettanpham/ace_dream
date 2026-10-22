# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# ĐIỂM KIỂM SOÁT THỰC ĐỊA (CHECKPOINT REPORT — DEFINE / PLAN COMPLETED)

**Thời điểm ghi nhận:** 2026-10-22  
**Giai đoạn:** DEFINE / PLAN ONLY — Rà Soát Thực Địa, Khóa Hợp Đồng Kiến Trúc & Đối Chiếu Dữ Liệu  
**Trạng thái phiên:** DỪNG CHỜ NGƯỜI DÙNG PHÊ DUYỆT KẾ HOẠCH (Tuyệt đối không sửa code)  

---

## 1. Kết Quả Kiểm Toán Thực Địa (Verified Reality)

1. **Xác Minh 3 Ảnh Concept PNG Phê Duyệt:**
   - Đã kiểm tra trực tiếp hệ thống tệp trong container: Cả 3 ảnh concept PNG trong `docs/art-direction/UI_CONCEPTS/` đều **TỒN TẠI VẬT LÝ VÀ HỢP LỆ**:
     - `FND8_823_CHARACTER_CATEGORY_PROFILE_DESKTOP_APPROVED.png`
     - `FND8_823_CHARACTER_CATEGORY_PROFILE_MOBILE_APPROVED.png`
     - `FND8_823_CHARACTER_CATEGORY_PROFILE_MOBILE_INFO_VIEW_REFERENCE.png`
   - **Cổng chặn Blocker được giải phóng hoàn toàn**.
2. **Trạng Thái Thư Mục Thử Nghiệm Trước (`components/game/v2/character-profile/`):**
   - Được gắn cờ kỹ thuật: **`IMPLEMENTED_BUT_NOT_ACCEPTED / LEGACY_V2_EXPERIMENT`**.
   - Được cô lập nguyên vẹn làm tài liệu tham khảo; không dùng làm nền để chắp vá CSS.
3. **Kiểm Toán Tài Nguyên Hình Ảnh Trên Đĩa (`public/images/`):**
   - **Tồn tại thực tế:**
     - `/images/valentine-fullbody.webp` (228 KB) — Tranh toàn thân chính thức.
     - `/images/valentine-portrait.webp` (59 KB) — Avatar chân dung.
   - **28 ảnh còn lại trong manifest:** Chưa có file vật lý `.webp` trong `public/images/`. Chúng sẽ được xử lý dưới dạng Thẻ Lưu Trữ Danh Mục (Archive Pending Card) kèm siêu dữ liệu và nhãn `[ Chờ Đồng Bộ WebP ]`, đảm bảo 100% không phát sinh lỗi HTTP 404 trên tab Network.
   - **Cấm Tuyệt Đối:** Không dùng `sourceFilename` để tạo đường dẫn tải ảnh.
4. **Đối Chiếu Dữ Liệu Chuẩn FND-8 (Valentine Lore & Stats):**
   - `classCharacterName`: "Valentine Aurelia Vance" (Danh tính lore persona của Class, không ghi đè lên Instance phi công của người chơi).
   - Base stats: 6 chỉ số tổng = 20 điểm (ATK: 2, DEF: 2, AGI: 2, ENE: 6, SHD: 6, LUK: 2).
   - Traits: `pilot_trait_field_medic` (Bàn Tay Cứu Hộ) và `pilot_trait_safeguard` (Mái Khiên Nhân Ái).
   - Story: Chương 01–04 `APPROVED` (Chương 01 toàn văn tiếng Việt, 02–04 tóm tắt), Chương 05–06 `PROVISIONAL`, Chương 07–10 `HOLD` (niêm phong bảo mật, không hiển thị như nội dung đã mở).
   - Phân tách bắt buộc: `characterQuote` và `shortDescription` là hai khối văn bản tách biệt.
   - Hai điều khiển bối cảnh (Background A / B) hoạt động trên cả Desktop và Mobile.
5. **Đồng Bộ Hóa Với UI V2 Foundation:**
   - Bộ Core UI Primitives tại `components/game/v2/ui/` (`Button`, `Card`, `Tabs`, `Tooltip`, `Dialog`, `Drawer`, `Feedback`) đã hoàn tất và đạt 5/5 responsive defect `FIXED`.
   - UI V2 Foundation Roadmap đã xác lập: Phase 2 là Shared Art Viewer (`components/game/v2/ui/art-viewer.tsx`), Phase 3 là V2 Shell, và Phase 4 là Pilot Category/Profile Rebuild.

---

## 2. Bảng Tài Liệu Đã Cập Nhật Trong Phiên Này

| Đường Dẫn Tệp | Hành Động | Vai Trò |
|---|---|---|
| `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_FEATURE_UI_REFERENCE.md` | Cập nhật | Giải phóng blocker concept ảnh, đồng bộ hóa hợp đồng UI V2 4 tầng và paired mobile |
| `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_IMPLEMENTATION_PLAN.md` | Cập nhật | Khóa kế hoạch triển khai phân kỳ, ma trận nghiệm thu và quy trình test chi tiết |
| `docs/progress/FND8/FND8_8_2_3_E0_CHECKPOINT.md` | Cập nhật | Điểm kiểm soát thực địa DEFINE / PLAN hoàn tất |
| `docs/progress/FND8/FND8_8_2_3_E0_HANDOFF.md` | Cập nhật | Biên bản bàn giao hướng dẫn tiếp tục |
| `docs/progress/FND8/FND8_8_2_3_E0_PROGRESS.md` | Cập nhật | Nhật ký tiến trình FND-8 E.0 |

---

## 3. Hành Động Tiếp Theo Chính Xác (Next Exact Action)

1. Dừng và xuất báo cáo toàn diện bằng tiếng Việt cho người dùng.
2. Tuyệt đối không chỉnh sửa mã nguồn `.ts`, `.tsx`, `.css` hoặc thêm dependencies.
3. Chờ người dùng phê duyệt kế hoạch triển khai và chỉ định bước tiếp theo:
   - **Lựa chọn A (Khuyến nghị chuẩn tắc):** Triển khai `UI V2 Foundation Phase 2: Shared Art Viewer` để có sẵn component xem ảnh chuẩn dùng chung cho toàn bộ dự án.
   - **Lựa chọn B (Triển khai trực tiếp E.0):** Triển khai gói `E.0-REBUILD-1` xây dựng mới trang Pilot Profile theo đúng hợp đồng thiết kế.
