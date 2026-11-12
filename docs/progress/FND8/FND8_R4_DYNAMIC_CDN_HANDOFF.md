# STARFRONT WORLD V2 — FND-8 / PILOT PROFILE V2 + GALLERY V2 + STORY READER
## PROGRESS, CHECKPOINT & HANDOFF REPORT (CDN R4 → R5+ DYNAMIC CHANNEL)

**Ngày cập nhật:** 2026-11-12  
**Phân hệ:** `FND-8 / 8.2.3.E.0` — Character Profile V2 · Gallery V2 · Story Reader  
**Kênh cấu hình (Entrypoint Channel):**  
`https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@main/starfront-world-assets/channels/pilot-v2-preview.json`  
**Release hiện hành trên kênh:** `r4`  
**Pinned Commit SHA:** `3a3a4f267ebb7beb357d3cff39cd33382612f1d0`  
**Trạng thái Release R4:** `PREVIEW_PARTIAL_ARTWORK_IMPORT` (50/297 WebP Verified, 247 Pending Binary Import)

---

## 1. HẠNG MỤC ĐÃ TRIỂN KHAI (IMPLEMENTED)

### 1.1. Kiến trúc `contentConfig` → `ContentReleaseResolver` → Pinned Release
- **`lib/game/v2/content-config.ts`**:
  - Chỉ lưu URL entrypoint của kênh (`NEXT_PUBLIC_STARFRONT_V2_CHANNEL_URL` hoặc mặc định `pilot-v2-preview.json`) và các tham số mạng/cache (`trustedOrigins`, `allowedRepoIdentifier`, `fetchTimeoutMs`, `maxRetries`, `channelCacheTtlMs`).
  - Không hardcode danh sách 12 Pilot, không hardcode số chương, tên file ảnh hay đường dẫn ảnh V1.
- **`lib/game/v2/content-release-resolver.ts`**:
  - Đọc channel JSON (`schemaVersion: "starfront-content-channel-v1"`), xác thực `releaseCommitSha`, `releaseManifestUrl`, `releaseBaseUrl`, `status`.
  - Tải `releaseManifestUrl` (`schemaVersion: "starfront-content-release-v1"`), từ `entries.profiles`, `entries.galleries`, `entries.stories` tải động `profiles/index.json`, `galleries/index.json`, `stories/index.json` cùng toàn bộ hồ sơ con.
  - Ghim chặt mọi URL con theo `releaseBaseUrl` chứa `releaseCommitSha` bất biến. Chặn tuyệt đối path traversal (`../`), đường dẫn tuyệt đối `/images/...` kiểu V1, hoặc origin nằm ngoài danh sách tin cậy (`cdn.jsdelivr.net`, `raw.githubusercontent.com`).
  - Cache snapshot theo `releaseCommitSha` trong bộ nhớ. Khi phát hiện `releaseCommitSha` mới trên kênh (ví dụ nâng cấp R4 → R5), tải và kiểm tra toàn bộ manifest/index mới trước khi chuyển đổi nguyên tử (atomic switch). Nếu quá trình tải release mới gặp lỗi, giữ nguyên snapshot hợp lệ gần nhất (`usingFallbackSnapshot: true`), tuyệt đối không trộn dữ liệu R4 và R5.

### 1.2. Data Adapters (Profile, Gallery, Story & SYSTEM FND-1 Registry)
- **Profile Adapter**:
  - Đọc động danh sách nhân vật từ `profiles/index.json` (12 Pilot trong R4; sẵn sàng mở rộng lên 13+ Pilot trong R5).
  - Tách biệt rõ `characterQuote` và `shortDescription`; hiển thị đầy đủ `biography.text` (`biographyStatus`), `specialties`, `origin`, `training`, `personality`, `contentStatus`, `proseApproval`, `safetyNote`.
  - Kết hợp chỉ số chiến đấu (`ATK/DEF/AGI/ENE/SHD/LUK`) và `Class Traits` từ `getSystemPilotDefinition(pilotId)` (nguồn `FND-1/FND-8 SYSTEM Registry`). Không suy diễn chỉ số từ văn xuôi biography; nếu có nhân vật mới trên CDN chưa đăng ký trong SYSTEM Registry thì hiển thị trạng thái chưa đăng ký SYSTEM mà không tự bịa số.
- **Gallery Adapter**:
  - Đọc `galleries/index.json` → `galleries/<pilotId>.json`, sắp xếp theo `order`.
  - **Quy tắc cứng:** Chỉ sinh URL ảnh cho trình duyệt khi `cdnStatus === "VERIFIED"` và `cdnPath` hợp lệ.
  - Các bản ghi `PENDING_BINARY_IMPORT` giữ `path: ""`, `isAvailableOnDisk: false` và hiển thị thẻ chờ nhập binary có chủ đích kèm trình xem metadata nguồn R3 (SHA256, độ phân giải, dung lượng), tuyệt đối không dùng `sourceMetadata.path` (`/images/*.webp`) hoặc ảnh V1 thay thế.
- **Story Adapter**:
  - Đọc `stories/index.json`. Trong R4, Valentine có 5 chương (`chap-01`..`chap-05`), trong đó:
    - `CH01`: `PROVISIONAL` (Rev 16)
    - `CH02`: `APPROVED` (Rev 10)
    - `CH03`: `APPROVED` (Rev 03) — *NewHorizon — Nơi Bình Minh Trở Lại*
    - `CH04`: `REVIEW` (Rev `03_RECONSTRUCTION`, `sourceIntegrity: "RECONSTRUCTED_NOT_APPROVED"`)
    - `CH05`: `REVIEW` (Rev `02`) — *Kỳ Nghỉ Dưới Những Vì Sao*
  - 11 Pilot còn lại chưa có trong `stories/index.json` hiển thị Empty State sạch từ `emptyState`, không sinh chương giả.
  - Đối với các khối `scene` trong Story: chỉ hiển thị thẻ `<img>` khi ảnh đã được xác nhận `VERIFIED` trên release CDN (ví dụ `valentine-portrait` tại `CH01` block `b0015` khớp SHA256 với `galleries/valentine.json`). Các điểm neo phân cảnh chưa nhập binary trên R4 hiển thị thẻ **Điểm Neo Minh Họa · Chờ đồng bộ ảnh CDN**, không gây lỗi HTTP 404.

### 1.3. UI V2 Desktop / Mobile & Sửa lỗi tồn đọng
- **`components/game/v2/pilot-profile/pilot-profile-v2.tsx`**:
  - Bổ sung thanh trạng thái kênh CDN (`CHANNEL: R4 · 3a3a4f2 · 12 Pilots · 50/297 WebP Verified`) và nút **Kiểm tra cập nhật** để kiểm tra `pilot-v2-preview.json` theo thời gian thực.
  - Tự động kiểm tra cập nhật khi khởi động và khi người dùng quay lại tab (`focus` / `visibilitychange`).
  - Đồng bộ `ArtViewer` fullscreen chỉ duyệt qua danh sách ảnh `VERIFIED` của nhân vật đang chọn.
- **`components/game/v2/pilot-profile/desktop-view.tsx`**:
  - Khắc phục triệt để khoảng trống đen phía dưới màn hình Desktop bằng bố cục `flex-1 h-full min-h-0`.
- **`components/game/v2/pilot-profile/mobile-art-view.tsx` & `mobile-info-view.tsx`**:
  - Nâng độ tương phản chữ (`#FFFFFF` / `#F1F5F9`), cỡ chữ nội dung `≥ 16px` (Story `17–18px`), vùng chạm nút `≥ 44px`, đồng bộ trạng thái nhân vật và ảnh sân khấu khi chuyển đổi `Art ↔ Info`.

---

## 2. KẾT QUẢ KIỂM THỬ (TESTED & VERIFIED)

| Kiểm thử | Lệnh / Phương thức | Kết quả | Chi tiết |
| :--- | :--- | :---: | :--- |
| **TypeScript Typecheck** | `npm run lint` (`tsc --noEmit`) | **PASS** | 0 lỗi kiểu dữ liệu trên toàn bộ codebase. |
| **Production Build** | `npm run build` (`compile_applet`) | **PASS** | Next.js App Router build thành công các route V1, V2 và API `/api/runtime/v2-release`. |
| **Test 1: Live R4 CDN Data** | `npx tsx tests/v2-r4-dynamic-cdn.test.ts` | **PASS** | Xác nhận 12 Profiles, Kaelen 30/30 Verified WebP, 11 Pilot khác = 20 Verified CORE + 247 Pending, 0 đường dẫn V1 `/images/`, Valentine 5 chương (CH04/CH05 gắn nhãn `REVIEW`), 11 Pilot hiển thị Story Empty State. |
| **Test 2: Giả lập nâng cấp R5** | `npx tsx tests/v2-r4-dynamic-cdn.test.ts` | **PASS** | Kênh chuyển sang commit R5 với 8 chương Valentine (thêm CH06–08), Kaelen có Story mới, thêm Pilot thứ 13 (`zephyr`), ứng dụng tự nhận diện nguyên tử mà không sửa code frontend và không trộn URL R4/R5. |
| **Test 3: Bảo mật & Rollback** | `npx tsx tests/v2-r4-dynamic-cdn.test.ts` | **PASS** | Chặn `../`, chặn `/images/...`, chặn origin lạ, chặn lệch commit SHA, và rollback nguyên tử về snapshot hợp lệ gần nhất khi kênh mới lỗi 404. |

---

## 3. TRẠNG THÁI CHỜ TRÊN CDN (BLOCKED / PENDING EXTERNAL ASSETS)

- **247/297 bản ghi Gallery (`PENDING_BINARY_IMPORT`):** Đã có đầy đủ metadata R3 và SHA256 trong `galleries/*.json` trên R4, nhưng chưa nhập file nhị phân WebP vào `releases/r4/assets/pilots/`. Hiện tại R4 có **50 WebP đã xác minh** (Kaelen 30/30, Marcus 1/10, Rhea 1/30, 9 Pilot còn lại mỗi người 2 ảnh CORE `fullbody` + `portrait`). **Không đánh dấu Gallery V2 hoàn tất 297 ảnh cho tới khi kho `starfront-assets` phát hành đủ binary trong R5+.**
- **Ảnh minh họa Story (`images/story/valentine/*`):** Ngoại trừ `valentine-portrait.webp` đã có binary xác thực trên R4, các ảnh bối cảnh Elysia / NewHorizon trong CH01–CH05 đang chờ import binary vào release CDN. UI hiện hiển thị thẻ điểm neo phân cảnh chờ đồng bộ mà không phát sinh lỗi 404.
- **Valentine CH04 (`03_RECONSTRUCTION`) & CH05 (`02`):** Đang ở trạng thái biên tập `REVIEW`, hiển thị cảnh báo rõ ràng trên UI cho đến khi Canon duyệt chính thức.

---

## 4. HƯỚNG DẪN BÀN GIAO CHO R5+ (NEXT STEPS)

1. Khi kho `viettanpham/starfront-assets` phát hành `releases/r5/` (bổ sung 247 binary WebP còn lại, ảnh minh họa Story, Valentine CH06–CH08 hoặc truyện của Pilot khác) và cập nhật `releaseCommitSha` + `releaseManifestUrl` + `releaseBaseUrl` trong `channels/pilot-v2-preview.json`:
   - Người dùng chỉ cần tải lại trang hoặc bấm nút **"Kiểm tra cập nhật"** trên thanh trạng thái kênh V2.
   - `ContentReleaseResolver` sẽ tự động tải và xác thực toàn bộ release R5 rồi chuyển đổi nguyên tử mà **không cần sửa bất kỳ dòng code React nào**.
