# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# ĐIỂM KIỂM SOÁT THỰC ĐỊA (CHECKPOINT REPORT)

**Thời điểm ghi nhận:** 2026-10-22  
**Chế độ:** DEFINE / PLAN ONLY  
**Trạng thái phiên:** DỪNG CHỜ PHÊ DUYỆT CỦA NGƯỜI DÙNG (Không tự ý code)  

---

## 1. Tóm Tắt Hiện Trạng Thực Tế (Verified Reality)

1. **Kho Lưu Trữ & Git:**
   - Hệ thống không sử dụng Git cục bộ (không có `.git`). Toàn bộ việc theo dõi phiên bản và bàn giao được tài liệu hóa minh bạch tại thư mục `docs/`.
   - Ứng dụng chạy trên Next.js 16.3.0 App Router, đang hoạt động ổn định trên port 3000.
2. **Hình Ảnh Thực Tế Trên Đĩa:**
   - `public/images/valentine-fullbody.webp` (228,394 bytes) — **Có thực**
   - `public/images/valentine-portrait.webp` (59,150 bytes) — **Có thực**
   - `src/assets/images/valentine_portrait_1791631686158.jpg` — **Có thực**
   - 28 file ảnh khác được liệt kê trong `valentine_assets_manifest.json` **chưa tồn tại trong `public/images/`**. Không được trỏ thẻ `<img>` vào các file này; sẽ dùng thẻ đại diện trạng thái (Archive Pending) để tránh lỗi vỡ ảnh.
3. **Concept Hình Ảnh:**
   - Thư mục `docs/art-direction/UI_CONCEPTS/` không tồn tại trên đĩa. Không bịa đặt đường dẫn; hợp đồng giao diện dựa trên văn bản quy chuẩn đã thống nhất ngày 2026-10-22.
4. **Mã Nguồn Cũ (Legacy UI):**
   - File `components/game/pilot-gallery.tsx` (1573 dòng) chứa UI V1 và Inspector cũ.
   - Toàn bộ code cũ này được bảo toàn nguyên vẹn; module V2 sẽ được xây dựng độc lập trong `components/game/v2/character-profile/`.

---

## 2. Các Tài Liệu Đã Được Tạo / Cập Nhật Trong Phiên Này

1. `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_FEATURE_UI_REFERENCE.md`: Đặc tả tính năng, giao diện Desktop/Mobile, 2 background controls, 4 tabs, và bản đồ dữ liệu Valentine.
2. `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_IMPLEMENTATION_PLAN.md`: Kế hoạch triển khai có ranh giới, danh mục tệp tạo mới, tiêu chuẩn chấp nhận và kế hoạch kiểm thử Desktop/Mobile.
3. `docs/progress/FND8/FND8_8_2_3_E0_PROGRESS.md`: Nhật ký tiến độ chi tiết của đợt audit.
4. `docs/progress/FND8/FND8_8_2_3_E0_CHECKPOINT.md`: Báo cáo checkpoint hiện tại.
5. `docs/progress/FND8/FND8_8_2_3_E0_HANDOFF.md`: Hướng dẫn bàn giao cho phiên tiếp theo.

---

## 3. Các Rủi Ro & Giải Pháp Đã Xác Định (Risks & Mitigations)

| Rủi Ro | Mức Độ | Giải Pháp Phòng Ngừa |
|---|---|---|
| Thiếu 28 ảnh trong manifest trên đĩa | Cao | Áp dụng Zero-Broken-Image Policy: Chỉ nạp 2 ảnh thật trên đĩa, các mục khác hiển thị dưới dạng thẻ thông tin lưu trữ có trạng thái "Chờ Đồng Bộ", tuyệt đối không dùng link ảnh chết. |
| Xung đột với UI Legacy cũ | Trung bình | Xây dựng V2 hoàn toàn độc lập trong thư mục `components/game/v2/character-profile/` và `lib/game/v2/`. Giữ nguyên 100% code V1. |
| Co cụm giao diện mobile thành phiên bản thu nhỏ của desktop | Cao | Thiết kế 2 chế độ riêng cho Mobile: `Mobile Info View` (cuộn thông tin, tab tiện dụng) và `Mobile Art View` (xem tranh toàn cảnh + 2 nút toggle bối cảnh chạm đáy). |

---

## 4. Hành Động Tiếp Theo Chính Xác (Next Exact Action)

Chờ người dùng xem xét bản báo cáo này và gửi lệnh phê duyệt kế hoạch.  
Khi nhận được lệnh `IMPLEMENT / RESUME ONE PHASE`, phiên tiếp theo sẽ tiến hành tạo các tệp trong Phase E.0-IMPLEMENT-1.
