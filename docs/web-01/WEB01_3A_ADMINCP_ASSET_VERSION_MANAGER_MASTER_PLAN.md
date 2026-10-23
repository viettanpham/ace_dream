# STARFRONT WORLD V2 — WEB-01.3.A
# KẾ HOẠCH TỔNG THỂ: HỆ THỐNG QUẢN LÝ PHIÊN BẢN TÀI NGUYÊN TẠI RUNTIME
## ADMINCP RUNTIME ASSET VERSION MANAGER — MASTER SPECIFICATION

**Mã tài liệu:** WEB01-3A-MASTER-01  
**Chế độ:** PLAN/DEFINE ONLY (KHÔNG IMPLEMENT TRONG GIAI ĐOẠN NÀY)  
**Trạng thái:** DRAFT ARCHITECTURAL BLUEPRINT (Chờ chủ dự án phê duyệt)  
**Ngày lập:** 2026-10-22  
**Ngôn ngữ:** 100% Tiếng Việt  
**Điểm mốc đầu vào:** WEB01-HANDOFF-05 (26 tệp WebP đã chuyển sang jsDelivr CDN, mã nguồn sạch, build PASS).

---

## 1. Bối cảnh & Vấn đề Cốt lõi (Problem Statement)

### 1.1. Hiện trạng sau Phase WEB-01.5
- Dự án **STARFRONT WORLD V2** đã tách thành công 26 tệp WebP (5.94 MB) ra khỏi repository chính và lưu trữ trên repository độc lập:
  `https://github.com/viettanpham/starfront-assets`
- Phiên bản phát hành chính thức hiện tại: `v2.0-assets-r1`.
- Cấu hình mạng CDN jsDelivr hiện hành:
  ```env
  NEXT_PUBLIC_ASSET_STORAGE_MODE=jsdelivr
  NEXT_PUBLIC_ASSET_CDN_URL=https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r1/starfront-world-assets
  ```
- Toàn bộ giao diện V1 và V2 đã tích hợp hàm chuyển đổi tập trung `resolveImageUrl()` trong `/lib/game/assets/image-resolver.ts`.

### 1.2. Nút thắt Vận hành (Operational Bottleneck)
Chủ dự án đang trong quá trình liên tục tạo mới và hoàn thiện artwork cho 12 Class Pilot V2 (mỗi phi công có từ 5–12 tranh gồm portrait, fullbody, combat, casual, uniform, event, story). Mỗi khi có đợt cập nhật artwork mới trên GitHub:
1. Chủ dự án đẩy commit và tạo Release Tag mới (ví dụ `v2.0-assets-r2`, `v2.0-assets-r3`...).
2. **Hạn chế hiện tại:** Để game nhận được release mới, lập trình viên buộc phải:
   - Sửa tệp môi trường `.env.local` hoặc cấu hình hosting.
   - Chạy lại lệnh build hoặc redeploy lại toàn bộ ứng dụng Next.js.
   - Tiềm ẩn rủi ro nếu release mới bị lỗi cấu trúc, thiếu ảnh hoặc đứt liên kết CDN.
3. **Mục tiêu của WEB-01.3.A:** Cung cấp công cụ trực quan ngay trong **AdminCP** cho phép Admin:
   - Khám phá các phiên bản phát hành mới trên GitHub.
   - Xem trước hình ảnh của phiên bản mục tiêu mà không làm ảnh hưởng đến người chơi đang online.
   - Kiểm tra tính toàn vẹn (Validation) tự động trước khi chuyển đổi.
   - Áp dụng phiên bản mới (Activation) **ngay tại runtime trong 1 giây mà KHÔNG CẦN rebuild hay redeploy server**.
   - Hỗ trợ Rollback tức thì về phiên bản hoạt động ổn định trước đó chỉ với 1 thao tác.

---

## 2. Các Trụ cột Kiến trúc (Architectural Pillars)

Hệ thống **AdminCP Runtime Asset Version Manager** được xây dựng dựa trên 5 trụ cột kỹ thuật:

```
+-----------------------------------------------------------------------------------+
|               KIẾN TRÚC TỔNG THỂ ADMINCP ASSET VERSION MANAGER                     |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [TRỤ CỘT 1: DISCOVERY]        [TRỤ CỘT 2: VALIDATION]      [TRỤ CỘT 3: PREVIEW]  |
|  - GitHub API Integration      - Fast Schema Check          - Sandboxed Resolver  |
|  - Server-side TTL Cache       - Manifest Integrity Check   - Side-by-side View   |
|  - Rate-limit Protection       - Canonical Path Audit       - Zero Game Impact    |
|                                                                                   |
|                                                                                   |
|  [TRỤ CỘT 4: ACTIVATION & ROLLBACK]               [TRỤ CỘT 5: PERSISTENCE]        |
|  - 2-Step Confirmation Dialog                     - Server Config Storage         |
|  - Optimistic Concurrency Revision Control        - Client Runtime Sync & Cache   |
|  - 1-Click Rollback to Previous Version           - SSR/Hydration Compatibility   |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

1. **Khám phá Phiên bản (Release Discovery):** Tự động truy vấn danh sách Release Tags từ GitHub Assets Repository, có bộ đệm máy chủ (Server Cache TTL 10 phút) nhằm ngăn ngừa tình trạng cạn kiệt giới hạn GitHub API (Rate Limit).
2. **Kiểm định Nghiêm ngặt (Release Validation):** Tuyệt đối không cho phép kích hoạt phiên bản chưa qua kiểm tra. Hệ thống quét cấu trúc manifest, bảo đảm không thiếu bất kỳ ảnh trọng yếu nào đang sử dụng trong game.
3. **Môi trường Xem trước Độc lập (Isolated Preview Sandbox):** Cho phép Admin chiêm ngưỡng các tác phẩm mới của release được chọn mà không làm thay đổi đường dẫn của người chơi khác.
4. **Kích hoạt & Phục hồi An toàn (Safe Activation & Rollback):** Quy trình xác nhận 2 bước chống bấm nhầm, hỗ trợ hoàn tác 1 chạm về `previousVersion` trong vòng 1 giây.
5. **Đồng bộ Runtime Bền vững (Persistent Runtime Sync):** Lưu trữ cấu hình phiên bản trên máy chủ, cấp phát qua API nội bộ, cập nhật trạng thái các React component bằng React Context / Event bus mà không cần nạp lại toàn bộ trang web.

---

## 3. Ma trận Phân tích Hiện trạng Hệ thống (System Architecture Audit)

Sau khi kiểm tra trực tiếp codebase thực tế của dự án, các thành phần được phân loại như sau:

| Thành phần | Hiện trạng thực tế | Đánh giá | Ảnh hưởng đến WEB-01.3.A |
| :--- | :--- | :---: | :--- |
| **Giao diện AdminCP** | Đã có `components/game/admin-cp-modal.tsx` (Pilot Skill) và `components/game/world/admin-settings-modal.tsx` (World Simulator 8 tabs). | **VERIFIED** | Có thể tích hợp thêm Tab thứ 9: `Quản Lý Phiên Bản Artwork (CDN)` vào modal hiện tại. |
| **Bảo mật & Phân quyền** | Chưa có hệ thống User Login, Session hay Role RBAC. Bất kỳ ai mở web đều có thể kích hoạt Admin Modal. | **MISSING / RISK** | Cần cơ chế bảo vệ tối thiểu (Admin Access PIN hoặc Secret Header) ở phía Server API. |
| **API Backend** | Đã có `app/api/world/dev-save/route.ts` xử lý đọc/ghi tệp JSON qua Node `fs`. Chưa có route cho asset config. | **PROPOSED** | Cần thiết kế bộ đôi API Route: `GET /api/admin/asset-version` và `POST /api/admin/asset-version`. |
| **Lưu trữ Cấu hình** | Hiện đang phụ thuộc cố định vào biến môi trường `process.env.NEXT_PUBLIC_ASSET_CDN_URL` nạp lúc khởi động. | **LIMITATION** | Cần bổ sung tệp cấu hình bền vững trên máy chủ (Server-side Config Storage) để hỗ trợ cập nhật động. |
| **Hàm Image Resolver** | `/lib/game/assets/image-resolver.ts` đã chạy ổn định với 8/8 unit test PASS, có tham số `overrideConfig`. | **VERIFIED** | Hoàn toàn tương thích; chỉ cần mở rộng để nạp cấu hình động từ Dynamic Store. |
| **Save Game & Canonical Data** | Dữ liệu gốc trong `data.ts` và save game `.starfront-saves/` lưu đường dẫn relative `/images/...`. | **VERIFIED** | An toàn 100%; đổi phiên bản CDN không can thiệp hay làm hỏng save game. |

---

## 4. Quyết định Thiết kế Trọng yếu (Key Architectural Decisions)

1. **Quyết định 1 — Lưu trữ Cấu hình Runtime trên Máy chủ (ADR-01):**
   - *Phương án chọn:* Lưu trữ tệp JSON `.starfront-config/runtime-asset-config.json` ở phía server (tương tự như mô hình `.starfront-saves/dev/latest_dev_save.json` đã được kiểm chứng hoạt động tốt trong Next.js App Router).
   - *Lý do:* Đảm bảo tính bền vững, không yêu cầu dịch vụ cơ sở dữ liệu bên ngoài khi đang chạy độc lập, và hỗ trợ đọc đồng bộ trên cả SSR và API Route.

2. **Quyết định 2 — Bộ đệm Khám phá GitHub (ADR-02):**
   - *Phương án chọn:* Tạo Server-side Cache với thời gian sống TTL = 10 phút cho danh sách releases từ GitHub.
   - *Lý do:* GitHub API công khai giới hạn 60 requests/giờ cho mỗi IP. Việc cache ở tầng server giúp ngăn chặn hoàn toàn lỗi HTTP 403 Rate Limit khi nhiều admin hoặc thao tác refresh liên tục.

3. **Quyết định 3 — Phân định rõ Giữa CDN Release và FND-8 Character Catalog (ADR-03):**
   - *Phương án chọn:* Việc kích hoạt phiên bản CDN mới chỉ cập nhật tài nguyên hình ảnh cho những asset đã được khai báo trong hệ thống. Hệ thống **tuyệt đối không tự động thêm các tệp ảnh nháp/chưa duyệt vào Gallery của nhân vật**.
   - *Lý do:* Bảo vệ nghiêm ngặt tính toàn vẹn của FND-8 Canonical Registry và cốt truyện nhân vật.

---

## 5. Danh mục Tài liệu Đặc tả Thành phần

Hồ sơ thiết kế chi tiết WEB-01.3.A bao gồm các tài liệu chuyên sâu:

1. **`WEB01_3A_RUNTIME_CONFIG_ARCHITECTURE.md`:** Kiến trúc lưu trữ cấu hình runtime, cơ chế đồng bộ client-server, xử lý hydration và tránh cache cũ.
2. **`WEB01_3A_GITHUB_RELEASE_VALIDATION.md`:** Cơ chế khám phá GitHub Release, cấu trúc manifest, kiểm tra tính toàn vẹn Fast/Full Validation.
3. **`WEB01_3A_ADMINCP_UI_UX_DEFINITION.md`:** Đặc tả bố cục giao diện AdminCP, danh sách release, sandbox preview, và quy trình xác nhận 2 bước.
4. **`WEB01_3A_ACTIVATION_ROLLBACK_SECURITY.md`:** Quy trình kích hoạt nguyên tử (Atomic Activation), cơ chế Rollback 1-click, kiểm soát phiên bản tương tranh (Revision Concurrency) và an toàn bảo mật.
5. **`WEB01_3A_IMPLEMENTATION_PHASES.md`:** Kế hoạch phân rã 5 subphase triển khai độc lập, có checkpoint nghiệm thu chi tiết.
