# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# BOUNDED IMPLEMENTATION PLAN (E.0-REBUILD-1 COMPLETED)

**Ngày cập nhật:** 2026-10-22  
**Giai đoạn:** Phase E.0-REBUILD-1 ĐÃ HOÀN TẤT  
**Trạng thái phiên:** DỪNG CHỜ NGHIỆM THU TỪ NGƯỜI DÙNG (Không tự ý sang REBUILD-2)  

---

## 1. Kết Quả Thực Thi Phase E.0-REBUILD-1

| Hạng Mục Kế Hoạch | Trạng Thái | Bằng Chứng Thực Tế |
|---|---|---|
| **Namespace độc lập** | `HOÀN THÀNH` | Thư mục `components/game/v2/pilot-profile/` được dựng mới sạch sẽ. |
| **Shared Art Viewer Primitives** | `HOÀN THÀNH` | Tạo `components/game/v2/ui/art-viewer.tsx`, hỗ trợ zoom 1x-3x, pan/drag, Esc, 44px hit targets. |
| **Desktop 3 Cột (1440px)** | `HOÀN THÀNH` | Roster bên trái, tranh toàn thân + 2 background controls ở giữa, 4 tabs bên phải. |
| **Mobile Paired States (375px–430px)** | `HOÀN THÀNH` | Art View tràn viền + Info View cuộn dọc với horizontal roster 76px. |
| **Quy Tắc Base Stats** | `HOÀN THÀNH` | Tuyệt đối không hiển thị "Tổng cộng 20 điểm" hay thanh tổng điểm. |
| **Phân Tách Quote / Short Bio** | `HOÀN THÀNH` | 2 khối riêng biệt trên cả Desktop và Mobile. |
| **Chính Sách WebP & Zero 404** | `HOÀN THÀNH` | 2 ảnh WebP thật + 28 thẻ Archive Pending Cards, 0 lỗi 404. |
| **Bảo Toàn 100% V1** | `HOÀN THÀNH` | 0 file mã nguồn V1 bị chỉnh sửa. |
| **Biên Dịch & Lint** | `HOÀN THÀNH` | `compile_applet`: Build succeeded; `lint_applet`: 0 lỗi. |

---

## 2. Kế Hoạch Tiếp Theo: Phase E.0-REBUILD-2 (Chờ Phê Duyệt)

- **Mục tiêu:** Nhận phản hồi thực địa từ người dùng sau khi trải nghiệm trên màn hình Desktop và điện thoại di động thực tế.
- **Phạm vi cho phép khi được duyệt:**
  - Tinh chỉnh khoảng cách lề và padding cảm ứng nếu người dùng yêu cầu.
  - Điều chỉnh độ nhạy zoom và kéo rê trên màn hình cảm ứng di động.
- **Ranh giới nghiêm ngặt:** Không tự động mở rộng sang Selection Wizard, gameplay hay viết thêm nội dung cốt truyện.
