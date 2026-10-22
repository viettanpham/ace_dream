# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# BIÊN BẢN BÀN GIAO (HANDOFF INSTRUCTIONS — REVISED)

**Thời điểm:** 2026-10-22  
**Đối tượng bàn giao:** Bất kỳ phiên làm việc tiếp theo / tài khoản tiếp theo  
**Trạng thái bàn giao:** Kế hoạch `DEFINE / PLAN ONLY` đã rà soát hoàn tất. Sẵn sàng cho `Phase E.0-IMPLEMENT-1` ngay khi người dùng phê duyệt.  

---

## 1. Hướng Dẫn Nhanh Cho Phiên Tiếp Theo (Quick Start)

1. **Đọc Trước Các File Này:**
   - `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_FEATURE_UI_REFERENCE.md` (Đặc tả chi tiết giao diện, nguồn canonical FND-8, WebP policy, 4 tab, 2 background controls).
   - `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_IMPLEMENTATION_PLAN.md` (Kế hoạch file cần tạo, ranh giới dữ liệu & danh mục kiểm thử).
   - `docs/progress/FND8/FND8_8_2_3_E0_CHECKPOINT.md` (Hiện trạng thực tế đã kiểm chứng).

2. **Quy Tắc Tuyệt Đối:**
   - Không lặp lại audit nếu người dùng không yêu cầu; bắt đầu ngay vào việc triển khai khi nhận được lệnh `IMPLEMENT`.
   - Giữ nguyên toàn bộ code cũ trong `components/game/pilot-gallery.tsx` và `lib/game/data.ts`.
   - Phân biệt dựng UI mới với tạo dữ liệu mới: Không tự ý tạo stats/gameplay mới. Đọc canonical từ `FND8_8_2_3_CHARACTER_ROSTER_V2_DRAFT.md`, `FND8_8_2_3_TRAIT_CATALOG_V2_PROPOSAL.md`, `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md`.
   - **Chính sách WebP & Zero Broken Images:** Chỉ tải 2 ảnh `.webp` thực tế trên đĩa (`/images/valentine-fullbody.webp`, `/images/valentine-portrait.webp`). Không dùng `sourceFilename` để tải ảnh; 28 ảnh còn lại trong manifest hiển thị thẻ lưu trữ "Chờ Đồng Bộ WebP".
   - Tạo mới các file trong:
     - `lib/game/v2/character-profile-data.ts`
     - `components/game/v2/character-profile/`
   - Đảm bảo cả Desktop (1440px) và Mobile (<=430px) được tích hợp ngay trong Phase 1.

3. **Lệnh Triển Khai Mong Đợi Từ Người Dùng:**
   Người dùng sẽ gửi lệnh phê duyệt (ví dụ: *"Kế hoạch đã duyệt, hãy triển khai Phase E.0-IMPLEMENT-1"*).  
   Sau khi nhận lệnh, tiến hành viết code Phase 1, chạy `compile_applet` kiểm tra build và báo cáo kết quả.
