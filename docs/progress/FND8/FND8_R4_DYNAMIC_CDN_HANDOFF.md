# STARFRONT WORLD V2 — FND-8 R4 CDN CUTOVER + SETTINGS V2 + UI CONCEPT RESTORATION HANDOFF

**Ngày cập nhật:** 2026-11-12  
**Phạm vi:** FND-8 / Pilot Profile V2 + Gallery V2 + Story Reader + Settings V2 (`R4 Cutover → R5+`)  
**Kênh cấu hình (Entrypoint):** `https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@main/starfront-world-assets/channels/pilot-v2-preview.json`  
**Phiên bản kênh hiện tại:** `r4` (`PREVIEW_ARTWORK_COMPLETE_STORY_REVIEW`)  
**Release Tag:** `v4.0-assets-r4`  
**Immutable Commit SHA:** `816585651f1f06f1cafeefc6a4809ab1f52f3484`  
**Release Manifest URL:** `https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@816585651f1f06f1cafeefc6a4809ab1f52f3484/starfront-world-assets/releases/r4/manifest.json`

---

## 1. TÓM TẮT CÁC HẠNG MỤC ĐÃ TRIỂN KHAI (P0 + P1 + P2)

### P0 — Đồng bộ CDN R4 (`v4.0-assets-r4` / `816585651f1f06f1cafeefc6a4809ab1f52f3484`)
- **`lib/game/v2/content-config.ts` & `lib/game/v2/content-release-resolver.ts`**:
  - Tải động `pilot-v2-preview.json`, bổ sung cơ chế chống stale cache `@main` bằng cách đối chiếu trực tiếp với `GITHUB_RAW_PILOT_V2_CHANNEL_URL` và gọi purge cache jsDelivr khi phát hiện commit mới trên nhánh `main`.
  - Xóa bỏ toàn bộ tham chiếu tới commit cũ; đồng bộ 100% sang commit bất biến `816585651f1f06f1cafeefc6a4809ab1f52f3484` (`v4.0-assets-r4`).
  - Nạp động **12 Pilots** và **297/297 ảnh WebP VERIFIED** (`0` pending), trong đó:
    - `valentine`: **42/42** VERIFIED
    - `kaelen`: **30/30** VERIFIED
    - `lyra`: **30/30** VERIFIED
    - `selena`: **30/30** VERIFIED
    - `fortuna`: **30/30** VERIFIED
    - `aria`: **30/30** VERIFIED
    - `rhea`: **30/30** VERIFIED
    - `nova`: **30/30** VERIFIED
    - `eric`: **15/15** VERIFIED
    - `alviss`: **10/10** VERIFIED
    - `marcus`: **10/10** VERIFIED
    - `victor`: **10/10** VERIFIED
  - Tự động định dạng tiêu đề tác phẩm (`formatArtworkTitle`) và truyền mô tả thực từ manifest cho từng bức ảnh.

### P1 — Settings V2 → CDN / Content Release
- **`components/game/v2/settings/settings-v2-modal.tsx` & `lib/game/v2/ui-preferences.ts`**:
  - Giữ nguyên Settings V1 không thay đổi.
  - Tạo mới hộp thoại độc lập **Settings V2 → CDN / Content Release** tích hợp trên cả thanh Header V2 Shell và thanh trạng thái Pilot Profile V2.
  - Hiển thị đầy đủ:
    - Active Channel: `pilot-v2-preview`
    - Release Version: `R4`
    - Release Tag: `v4.0-assets-r4`
    - Release Commit SHA: `816585651f1f06f1cafeefc6a4809ab1f52f3484`
    - Manifest URL & Release Base URL
    - Artwork Verification Counts (`297/297` tổng thể + bảng chi tiết từng Pilot)
    - Last Successful Refresh timestamp & cache state
    - Nút **Check for Updates / Refresh Content**
    - Read-only diagnostics và cảnh báo lỗi rõ ràng.
  - Bộ chọn phiên bản (Release Selector) hỗ trợ `channel-auto` (tự động nhận R5+ khi phát hành), `pinned-r4`, và hiển thị `r3-legacy` ở chế độ `HISTORICAL / READ-ONLY`.
  - Chỉ lưu trữ các tùy chọn V2 an toàn đã whitelist vào `localStorage`, tuyệt đối không lưu URL CDN tùy ý.

### P2 — Khôi phục UI V2 theo đúng Concept đã duyệt
- **Đối chiếu trực tiếp 3 file ảnh concept chuẩn**:
  - `docs/art-direction/UI_CONCEPTS/FND8_823_CHARACTER_CATEGORY_PROFILE_DESKTOP_APPROVED.webp`
  - `docs/art-direction/UI_CONCEPTS/FND8_823_CHARACTER_CATEGORY_PROFILE_MOBILE_APPROVED.webp`
  - `docs/art-direction/UI_CONCEPTS/FND8_823_CHARACTER_CATEGORY_PROFILE_MOBILE_INFO_VIEW_REFERENCE.webp`
- **`components/game/v2/pilot-profile/desktop-view.tsx`**:
  - Cột Trái (`| CHARACTER CLASS`): Thẻ phi công ngang có chân dung chữ nhật bo góc, tên nhân vật đậm, vai trò màu cyan và số lượng ảnh verified.
  - Cột Giữa (`Character Stage`): Bổ sung hiệu ứng **artwork-derived ambient background** (`scale-125 blur-2xl opacity-35` từ chính bức ảnh nhân vật đang hiển thị), giữ nguyên vẹn 100% ảnh nhân vật tiền cảnh (`object-contain`), hiển thị câu trích dẫn nổi tinh tế, 2 nút chuyển đổi bối cảnh (`Bối Cảnh` / `Tách Nền`) + nút `Full Screen`, và **thanh cuộn ngang Thumbnail Filmstrip (`< [Thumb 1] [Thumb 2] [Thumb 3] [Thumb 4] >`)** ở đáy sân khấu.
  - Cột Phải (`Dossier Panel`): Bổ sung **Dossier Identity Header** cố định phía trên 4 Tab (`OVERVIEW`, `STORY`, `GEAR COMPAT`, `GALLERY`).
- **`components/game/v2/pilot-profile/tabs/overview-tab.tsx`**:
  - Mục `| BASE ATTRIBUTES`: Trình bày dạng lưới **2 cột × 3 hàng thanh ngang** (`ATK, DEF, AGI` bên trái; `ENE, SHD, LUK` bên phải) đúng concept.
  - Mục `| TRAITS`: Trình bày **2 thẻ ngang cạnh nhau** có hộp biểu tượng phát sáng bên trái.
  - Mục `| THÔNG TIN NHÂN VẬT`: Bảng dòng kẻ ngang (Key-Value rows) rõ nét, độ tương phản cao.
  - Mục `| BỘ SƯU TẬP HÌNH ẢNH`: Hiển thị 4 ảnh preview kèm nút `Xem thêm (42) >` chuyển thẳng sang tab `GALLERY` hoặc mở `ArtViewer`.
- **`components/game/v2/pilot-profile/mobile-art-view.tsx` & `mobile-info-view.tsx`**:
  - Thanh chọn phi công ngang dùng thẻ chân dung có tên bên dưới giống hệt concept Mobile.
  - `MobileArtView` có nền ambient artwork, các nút điều khiển nổi bên phải (`>= 44x44px`), và dải thumbnail ngang `< [Thumb 1] [Thumb 2] [Thumb 3] >` để đổi trang phục ngay trên màn hình Art View.
- **`components/game/v2/ui/art-viewer.tsx`**:
  - Kết nối đồng bộ với đúng bộ dữ liệu R4 (`297/297` verified artworks), hỗ trợ Prev/Next, phím mũi tên, nút đóng `X` chuẩn `>= 44x44px` trên di động, và Random Showcase.

---

## 2. KẾT QUẢ KIỂM THỬ

- **Integration Tests (`npx tsx tests/v2-r4-dynamic-cdn.test.ts`):** `PASS` 100%
  - `[TEST 1]` Dữ liệu thật R4 Cutover trên jsDelivr CDN (`v4.0-assets-r4`, `816585651f1f06f1cafeefc6a4809ab1f52f3484`, 12 Pilots, 297/297 Verified WebP, Valentine 42/42, 5 Valentine Chapters, 11 Story Empty States): **PASS**
  - `[TEST 2]` Giả lập nâng cấp kênh sang R5 (Valentine 8 chương, Kaelen có Story, thêm Pilot thứ 13 Zephyr, Zero R4/R5 URL mixing): **PASS**
  - `[TEST 3]` Bảo mật đường dẫn (`../`, `/images/...`, untrusted origin, commit mismatch) & Atomic Rollback khi kênh lỗi: **PASS**
- **Build & Lint (`compile_applet` + `lint_applet`):** `PASS`

---

## 3. BƯỚC TIẾP THEO (R5+)

1. Khi phát hành `R5` với 3 chương mới của Valentine (`CH06`–`CH08`) hoặc cốt truyện của các Pilot khác, chỉ cần cập nhật `starfront-world-assets/channels/pilot-v2-preview.json` trỏ tới commit SHA và manifest của `R5`.
2. Người dùng có thể bấm **Kiểm tra cập nhật** hoặc mở **Settings V2 (CDN)** để kiểm tra chẩn đoán và làm mới nội dung ngay lập tức mà không cần sửa code frontend.
