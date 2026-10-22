# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# BIÊN BẢN BÀN GIAO (HANDOFF INSTRUCTIONS)

**Thời điểm:** 2026-10-22  
**Đối tượng bàn giao:** Bất kỳ phiên làm việc tiếp theo / tài khoản tiếp theo  
**Trạng thái bàn giao:** Kế hoạch `DEFINE / PLAN ONLY` đã hoàn tất. Sẵn sàng cho `Phase E.0-IMPLEMENT-1` ngay khi người dùng phê duyệt.  

---

## 1. Hướng Dẫn Nhanh Cho Phiên Tiếp Theo (Quick Start)

1. **Đọc Trước Các File Này:**
   - `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_FEATURE_UI_REFERENCE.md` (Đặc tả chi tiết giao diện, dữ liệu Valentine, 4 tab, 2 background controls).
   - `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_IMPLEMENTATION_PLAN.md` (Kế hoạch file cần tạo & danh mục kiểm thử).
   - `docs/progress/FND8/FND8_8_2_3_E0_CHECKPOINT.md` (Hiện trạng thực tế đã kiểm chứng).

2. **Quy Tắc Tuyệt Đối:**
   - Không lặp lại audit nếu người dùng không yêu cầu; bắt đầu ngay vào việc triển khai khi nhận được lệnh `IMPLEMENT`.
   - Giữ nguyên toàn bộ code cũ trong `components/game/pilot-gallery.tsx` và `lib/game/data.ts`.
   - Tạo mới các file trong:
     - `lib/game/v2/character-canon-data.ts`
     - `components/game/v2/character-profile/`
   - Chỉ sử dụng 2 ảnh Valentine thực có trên đĩa:
     - `/images/valentine-fullbody.webp`
     - `/images/valentine-portrait.webp`
   - Không được trỏ thẻ `<img>` vào 28 ảnh chưa có trong `public/images/`.
   - Đảm bảo cả Desktop (1440px) và Mobile (<=430px) được tích hợp ngay trong Phase 1.

3. **Lệnh Triển Khai Mong Đợi Từ Người Dùng:**
   Người dùng sẽ gửi lệnh phê duyệt (ví dụ: *"Kế hoạch đã duyệt, hãy triển khai Phase E.0-IMPLEMENT-1"*).  
   Sau khi nhận lệnh, tiến hành viết code Phase 1, chạy `compile_applet` kiểm tra build và báo cáo kết quả.
