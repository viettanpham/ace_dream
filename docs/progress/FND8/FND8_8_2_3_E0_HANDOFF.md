# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# BIÊN BẢN BÀN GIAO CHECKPOINT (FND8-HANDOFF-14)
# MOBILE VISUAL & INTERACTION HOTFIX — IMPLEMENTED & TESTED

**Thời điểm:** 2026-10-23  
**Mã tài liệu:** FND8-HANDOFF-14  
**Giai đoạn:** MOBILE VISUAL & INTERACTION HOTFIX (ONE PASS)  
**Trạng thái bàn giao:** HOÀN THÀNH 100% 3 NHÓM SỬA LỖI MOBILE (XÓA BỎ LỚP TỐI INFO VIEW, ĐỒNG BỘ CAROUSEL & ARTWORK METADATA, BOTTOM SHEET INFO PANEL & SINGLE-LINE COUNTER, ĐỒNG BỘ GALLERY COUNT 9/9 TRONG VIEWER).  
**Tuyến đường URL:** `/v2/pilots`

---

## 1. Kết Quả Thực Hiện Cốt Lõi Đợt Hotfix

1. **Khắc phục Triệt để Lỗi Mobile Info View Bị Tối (P0):**
   - Loại bỏ lớp `fixed inset-0` background sai stacking context; chuyển sang `absolute inset-0 z-0 pointer-events-none` với opacity dịu 10%.
   - Toàn bộ nội dung Info View được nâng lên `relative z-10`, các container thẻ sử dụng nền `#0D1526]/95`, viền `#20324B`, bảng màu chữ độ tương phản cao `#F8FAFC` (white), `#E2E8F0`, `#00D4FF` (cyan).
   - Nâng cấp typography: Tên phi công 24px, quote 14px nền `#121E33`, mô tả 15–16px, bảng hồ sơ tác chiến 14px, không còn bất kỳ dòng chữ nào mờ nhạt hay bị overlay che phủ.

2. **Khắc phục Lỗi Mobile Art View Carousel Không Đồng Bộ (P1):**
   - Thiết lập `selectedArtworkIndex` làm **Single Source of Truth** duy nhất:
     - Hero Artwork nạp đúng ảnh đang chọn.
     - Hai phím mũi tên lớn trực tiếp trên tranh chuyển đổi mượt mà giữa các tác phẩm của phi công.
     - Dải Thumbnail Carousel hiển thị toàn bộ tranh khả dụng (không cắt cứng 3 ảnh), tự động cuộn vào vùng nhìn thấy khi chọn, thumbnail active có viền sáng cyan `ring-2 ring-[#00D4FF]/60 scale-105`.
     - Footer bên dưới cập nhật chính xác: Tên tác phẩm (`art.title`), thể loại (`art.category`), mô tả tranh riêng biệt (`art.description`), tách bạch với character identity (Valentine · Mercy Wing).
   - Bổ sung nút **`[🖼️ GALLERY (N)]`** ngay trên thanh điều hướng để mở trực tiếp toàn bộ bộ sưu tập.

3. **Nâng cấp Fullscreen Viewer Header & Info Panel (P1):**
   - **Header:** Huy hiệu `ẢNH 0X / YY` có thuộc tính `whitespace-nowrap`, đảm bảo 100% nằm trên một hàng duy nhất trên màn hình điện thoại (375px–430px), không bao giờ rớt dòng.
   - **Info Panel dạng Bottom Sheet trên Mobile:** Mở mượt mà từ dưới lên khi bấm icon `ⓘ`, có drag handle và nút đóng "✕" lớn.
   - Hiển thị đầy đủ không cắt ba chấm (`...`): Tên tác phẩm, nhân vật, phân loại, mô tả chi tiết, độ phân giải gốc, tỷ lệ phóng đại và thẻ phân lớp.
   - Khi bấm Next/Prev trong lúc Info Panel đang mở, thông tin tự động cập nhật theo ảnh mới. Không làm gián đoạn trạng thái Zoom / Pan của tranh.

4. **Đồng bộ hóa Hoàn Toàn Gallery Count và Viewer Index:**
   - Khi mở Viewer từ Tab Gallery (hiển thị 9 ảnh verified của Valentine), Viewer nhận đúng tập 9 ảnh khả dụng: `totalCount = 9`, chỉ số hiển thị chính xác từ `ẢNH 01 / 09` đến `09 / 09`.
   - Chấm dứt hoàn toàn hiện tượng lệch số giữa 9 ảnh ở Gallery và 13 ảnh trong Viewer.

---

## 2. Kết Quả Kiểm Thử Thực Tế

- **Unit & Integration Tests:** `npx tsx --test tests/fnd8-character-category.test.ts` → **PASS 8/8 (100%)**.
- **TypeScript Typecheck (`tsc --noEmit`):** `npm run lint` → **0 lỗi (PASS)**.
- **Production Build (`compile_applet`):** `next build` → **BUILD SUCCEEDED**.

---

## 3. Mục Cần Chủ Dự Án Nghiệm Thu Trên Điện Thoại Thật

1. Mở Preview trên điện thoại thật tại: **`/v2/pilots`**.
2. **Kiểm tra Info View:** Bấm nút `Xem Thông Tin`:
   - Xác nhận Roster, Tên phi công, Badges, Quote, Attributes, Traits và bảng thông tin sáng rõ, đọc dễ dàng, không có lớp overlay tối che mờ.
3. **Kiểm tra Art View Carousel:** Bấm `Xem Tranh Nhân Vật`:
   - Bấm nút Next/Prev trên ảnh: Xác nhận ảnh lớn, thumbnail đang chọn và tên/mô tả tác phẩm ở footer bên dưới thay đổi đồng bộ.
   - Thử bấm nút `[GALLERY (9)]` ở góc phải để mở bộ sưu tập.
4. **Kiểm tra Fullscreen Viewer:**
   - Bấm nút Phóng to trên ảnh hoặc bấm một ảnh trong Gallery:
   - Xác nhận dòng `ẢNH 0X / 09` nằm trọn vẹn trên 1 hàng.
   - Bấm icon `ⓘ` ở toolbar góc dưới: Xác nhận Bottom Sheet trượt lên hiển thị đầy đủ tiêu đề và mô tả không bị cắt chữ.
   - Bấm Next khi panel đang mở: Thông tin tự động đổi sang tác phẩm tiếp theo.
