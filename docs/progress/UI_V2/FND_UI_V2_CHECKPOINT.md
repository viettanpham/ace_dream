# STARFRONT WORLD — FND-UI-V2.0
# ĐIỂM KIỂM SOÁT THỰC ĐỊA (CHECKPOINT REPORT — DEFINE / PLAN ONLY)

**Thời điểm ghi nhận:** 2026-10-22  
**Giai đoạn:** Phase 0 — Audit & Architecture Definition (DEFINE / PLAN ONLY)  
**Trạng thái phiên:** DỪNG CHỜ DUYỆT (Không tự ý bước sang IMPLEMENT)  

---

## 1. Tóm Tắt Hiện Trạng Kỹ Thuật Đã Xác Minh (Verified Reality)

1. **Phân Loại Thử Nghiệm E.0 Cũ:**
   - Mã nguồn E.0 tại `components/game/v2/character-profile/` được đánh dấu là `IMPLEMENTED_BUT_NOT_ACCEPTED / LEGACY_V2_EXPERIMENT`.
   - Giữ nguyên toàn bộ tệp adapter dữ liệu `lib/game/v2/character-profile-data.ts` (12 Class Stats 20 điểm, Valentine lore, 10 chương Story, WebP verified paths).
2. **Kiến Trúc Hai Vỏ Ứng Dụng (Dual Shells):**
   - Đã xác định mô hình `AppShellDispatcher` tại `app/page.tsx`.
   - Lưu trữ tùy chọn giao diện qua khóa `STARFRONT_INTERFACE_VERSION` (`"v1" | "v2"`), mục tiêu mặc định là `"v2"`.
   - Chuyển đổi giao diện bằng cập nhật state nội bộ trong Next.js App Router, **không tải lại trang (Zero Reload), không làm mất dữ liệu tiến trình (Zero State Loss)**.
3. **Chiến Lược Chống Rò Rỉ CSS (Anti-CSS-Leakage):**
   - V2 đóng gói trong container `.sf-v2-root`, tuyệt đối không dùng class CRT scanlines, CRT beam, vignette hay biến màu legacy `--color-panel` của V1.
   - V1 Shell được giải phóng hoàn toàn khỏi các tab thử nghiệm V2 để trở về nguyên bản 100%.
4. **Hệ Thống Thiết Kế V2 Độc Lập:**
   - Màu sắc: Nền Deep Space `#05070D`, Glass `#0F172A`, Điểm nhấn Cyan `#06B6D4` / Teal `#14B8A6`.
   - Typography: Body $16\text{px}$, Story $17$–$18\text{px}$ (dãn dòng 1.7), Secondary $14\text{px}$, cấm chữ dưới 12px.
   - Mobile: Touch target mọi nút bấm $\ge 44 \times 44\text{px}$.
   - Kỷ luật Zero-Pill: Cấm đóng hộp pill đối với metadata và nhãn tĩnh.
5. **Thư Viện Dùng Chung & Trình Soi Tranh 4K:**
   - 7 thành phần dùng chung: `Button`, `Tabs`, `Card`, `Tooltip`, `Dialog`, `Drawer`, `Feedback`.
   - Module `SharedArtViewer`: Toàn màn hình thực sự, nút Đóng `X` luôn cố định góc trên bên phải, zoom 1x-4x, pan drag, pinch-to-zoom, Esc key.

---

## 2. Danh Mục Tài Liệu Canonical Đã Ban Hành

| Tệp Tài Liệu | Trạng Thái | Vai Trò Kỹ Thuật |
|---|---|---|
| `docs/foundations/UI_V2/FND_UI_V2_FOUNDATION_FEATURE.md` | Hoàn thành | Đặc tả tính năng nền tảng V2 & Versioned Shell |
| `docs/foundations/UI_V2/FND_UI_V2_ARCHITECTURE.md` | Hoàn thành | Kiến trúc Dispatcher, Anti-Leakage & State Continuity |
| `docs/foundations/UI_V2/FND_UI_V2_DESIGN_SYSTEM.md` | Hoàn thành | Hệ thống tokens, Typography, Spacing, Art Viewer |
| `docs/foundations/UI_V2/FND_UI_V2_IMPLEMENTATION_PLAN.md` | Hoàn thành | Lộ trình 4 Phase & Kế hoạch thay đổi tệp chi tiết |
| `docs/progress/UI_V2/FND_UI_V2_PROGRESS.md` | Hoàn thành | Nhật ký tiến trình audit và đặc tả kỹ thuật |
| `docs/progress/UI_V2/FND_UI_V2_CHECKPOINT.md` | Hoàn thành | Điểm kiểm soát thực địa sau Phase 0 |
| `docs/progress/UI_V2/FND_UI_V2_HANDOFF.md` | Hoàn thành | Biên bản bàn giao hướng dẫn phiên tiếp theo |

---

## 3. Quyết Định Còn Cần Người Dùng Duyệt (Pending Approvals)

1. **Phê duyệt phân kỳ 4 Phase:** Người dùng duyệt kế hoạch triển khai Phase 1 (Core UI Primitives) trước khi dựng Shell V2.
2. **Xác nhận giá trị mặc định khởi tạo:** Xác nhận khi người chơi mới truy cập web app lần đầu, giao diện mặc định sẽ là **V2** (với tùy chọn quay về V1 trong Cài Đặt).
3. **Phê duyệt tách biệt Pilot Category:** Xác nhận xây dựng lại Pilot Category trong Phase 4 độc lập, không vội vàng sửa chắp vá trên bản thử nghiệm E.0 cũ.
