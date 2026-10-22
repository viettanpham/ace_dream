# STARFRONT WORLD — FND-UI-V2.0
# BIÊN BẢN BÀN GIAO (HANDOFF INSTRUCTIONS — DEFINE / PLAN ONLY)

**Thời điểm:** 2026-10-22  
**Đối tượng bàn giao:** Bất kỳ phiên làm việc tiếp theo / kỹ sư AI Studio tiếp theo  
**Trạng thái bàn giao:** GIAI ĐOẠN DEFINE / PLAN ONLY ĐÃ HOÀN TẤT. Toàn bộ tài liệu kiến trúc, Design System và kế hoạch triển khai đã được ban hành đầy đủ. Mã nguồn hoàn toàn chưa bị thay đổi.  

---

## 1. Tóm Tắt Định Hướng Kỹ Thuật (Architecture Summary)

1. **Không Chắp Vá Trên Bản Thử Nghiệm E.0:**
   - Phiên bản E.0 cũ tại `components/game/v2/character-profile/` đã được đóng băng ở trạng thái `IMPLEMENTED_BUT_NOT_ACCEPTED`.
   - Giữ nguyên dữ liệu canonical tại `lib/game/v2/character-profile-data.ts`.
2. **Hệ Thống Dual Shells:**
   - Dự án vận hành 2 App Shell độc lập trên cùng 1 nguồn dữ liệu `STARFRONT_SAVE_DATA_V4`.
   - V1 Shell (`components/game/starfront-shell.tsx`) phục vụ các màn hình V1 truyền thống.
   - V2 Shell (`components/game/v2/shell/starfront-shell-v2.tsx`) là giao diện Modern Aerospace cao cấp.
   - Điều phối qua `AppShellDispatcher` tại `app/page.tsx` với khóa `STARFRONT_INTERFACE_VERSION`.
3. **Quy Trình Triển Khai Tiếp Theo:**
   - **Phase 1:** Triển khai các thành phần dùng chung `components/game/v2/ui/` (Button, Tabs, Card, Tooltip, Dialog, Drawer, Feedback).
   - **Phase 2:** Triển khai Trình soi tranh dùng chung `components/game/v2/art-viewer/shared-art-viewer.tsx`.
   - **Phase 3:** Triển khai V2 App Shell, Dispatcher tại `app/page.tsx` và Settings Switcher V1/V2.
   - **Phase 4:** Tái thiết kế toàn bộ phân hệ Pilot Category V2 tại `components/game/v2/pilots/`.

---

## 2. Hướng Dẫn Thực Hiện Cho Phiên Kế Tiếp (Next Turn Instructions)

- **ĐIỀU KIỆN TIÊN QUYẾT:** Chỉ bắt đầu viết mã triển khai khi người dùng đưa ra chỉ thị phê duyệt kế hoạch (ví dụ: *"Bắt đầu Phase 1"* hoặc *"Tiến hành IMPLEMENT"*).
- **KHI ĐƯỢC PHÉP IMPLEMENT PHASE 1:**
  1. Đọc lại `docs/foundations/UI_V2/FND_UI_V2_DESIGN_SYSTEM.md` và `FND_UI_V2_IMPLEMENTATION_PLAN.md`.
  2. Bắt đầu tạo các thành phần trong thư mục `components/game/v2/ui/`.
  3. Đảm bảo tuân thủ 100% quy tắc Zero-Pill, độ tương phản WCAG AA, kích thước touch target $\ge 44\text{px}$ trên mobile.
  4. Tuyệt đối không can thiệp vào `components/game/starfront-shell.tsx` hoặc các tệp V1 cũ trong Phase 1.
  5. Chạy `compile_applet` để nghiệm thu Phase 1 trước khi chuyển sang Phase 2.
