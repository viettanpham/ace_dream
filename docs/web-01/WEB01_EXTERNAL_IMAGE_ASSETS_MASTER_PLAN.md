# STARFRONT WORLD V2 — WEB-01
# EXTERNAL IMAGE ASSETS & CDN FOUNDATION MASTER PLAN

**Mã tài liệu:** WEB01-PLAN-01  
**Trạng thái:** PROPOSED / PENDING APPROVAL (Chế độ PLAN/DEFINE ONLY)  
**Ngày lập:** 2026-10-22  
**Phạm vi áp dụng:** Toàn bộ hệ thống quản lý, phân phối hình ảnh cho STARFRONT WORLD V2 (V1 Legacy và FND-8 V2).

---

## 1. Bối cảnh dự án & Vấn đề kỹ thuật

### 1.1. Hiện trạng kiến trúc hình ảnh
STARFRONT WORLD V2 là tựa game sci-fi RPG web phát triển trên nền Next.js 16 (App Router), kết hợp:
- **Hệ thống V1 (Legacy):** Game loop, Hangar, War Room, Combat 2D, 8 phi công ban đầu và 3 dòng phi cơ GEAR (Vanguard, Falcon, Aegis).
- **Hệ thống V2 (FND-8 / 8.2.3.E.0):** Character Category, Pilot Profile (Desktop 3-column & Mobile Paired States), hệ thống Trait V2, Story Chapters, và Thư viện Gallery độ phân giải cao.

Hiện tại, toàn bộ 26 tệp artwork runtime được lưu trữ cục bộ trong thư mục `public/images/` với dung lượng ~5.44 MB (toàn bộ định dạng `.webp`). Dự kiến khi Character Category V2 mở rộng sang đầy đủ 12 Class nhân vật cùng các bộ trang phục, hoạt cảnh, tranh cốt truyện (mỗi nhân vật từ 10 đến 30 artworks), dung lượng binary sẽ tăng lên hàng chục đến hàng trăm Megabytes.

### 1.2. Phân tích vấn đề với môi trường AI Studio
Môi trường AI Studio Build hoạt động dưới dạng container Node.js tương tác với hệ thống quản lý mã nguồn (Git snapshot, file change tracking, text diffing):
1. **Lỗi đã xác minh (Verified):** Công cụ biên tập tệp (file change cascade) của AI Studio giả định các tệp được theo dõi là văn bản UTF-8. Khi thao tác với tệp nhị phân lớn hoặc có charset không đồng nhất (như đã ghi nhận lỗi `CORTEX_STEP_TYPE_FILE_CHANGE: while decoding file, failed to detect charset with sufficient confidence`), tiến trình xử lý snapshot có thể bị nghẽn hoặc gặp lỗi.
2. **Nguyên nhân nghi ngờ (Suspected):** Việc lưu trữ hàng chục tệp ảnh nhị phân dung lượng lớn trong repository làm chậm quá trình đóng gói container snapshot, làm phình kích thước working tree và gây áp lực lên cơ chế cache build của Next.js (`.next/cache`).
3. **Vấn đề chưa đủ dữ liệu (Inconclusive):** Tách ảnh sang CDN ngoài là giải pháp kiến trúc chuẩn công nghiệp giúp giảm tải repo, nhưng **không thể giả định rằng việc tách ảnh sẽ tự động giải quyết tất cả các lỗi môi trường khác** (như timeout mạng của dev server hoặc giới hạn bộ nhớ container).

---

## 2. Nguyên tắc kiến trúc cốt lõi (Architectural Principles)

1. **Separation of Concerns (Tách biệt mã nguồn và tài nguyên nhị phân):**
   - Repository chính (`ace_dream`): Chỉ lưu mã nguồn TypeScript/TSX, logic game, cấu hình SYSTEM, catalog JSON và tài liệu.
   - Repository phụ (`starfront-world-assets`): Lưu trữ toàn bộ artwork runtime nhị phân có đánh số phiên bản rõ ràng (Git release tag).
2. **Single Source of Truth for URLs (Bộ giải quyết URL tập trung):**
   - Tuyệt đối không hardcode domain CDN hoặc chuỗi URL dài trong từng component React.
   - Mọi truy xuất hình ảnh phải thông qua hàm chuẩn hóa `resolveImageUrl(path)` duy nhất.
3. **Bảo tồn toàn vẹn V1 và FND-8 V2:**
   - Không sửa đổi công thức gameplay, chỉ số phi công hay logic save game.
   - Giữ nguyên cấu trúc đường dẫn tương đối `/images/<file>.webp` trong database/catalog để tương thích ngược.
4. **Hỗ trợ đa tầng hạ tầng (Multi-Tier Infrastructure Support):**
   - Hỗ trợ linh hoạt 3 chế độ: Local Disk (phát triển nội bộ), jsDelivr CDN (miễn phí, nhanh chóng cho MVP) và Cloudflare R2 / Custom CDN (sẵn sàng cho tương lai).
5. **An toàn Migration và Rollback tức thì:**
   - Quy trình chuyển đổi tuần tự từng nhóm ảnh nhỏ (Pilot Migration), đối chiếu SHA-256 checksum, giữ bản sao lưu hoàn chỉnh và hỗ trợ rollback về chế độ cục bộ chỉ bằng một biến môi trường.

---

## 3. Kiến trúc mục tiêu (Target Architecture)

```
+-----------------------------------------------------------------------------------+
|                            STARFRONT REPOSITORY (Code)                            |
|                                                                                   |
|   +--------------------------+          +-------------------------------------+   |
|   |  lib/game/data.ts (V1)   |          |  character-profile-data.ts (V2)     |   |
|   |  avatar: "/images/..."   |          |  fullbodyAssetPath: "/images/..."   |   |
|   +------------+-------------+          +------------------+------------------+   |
|                |                                           |                      |
|                +---------------------+---------------------+                      |
|                                      |                                            |
|                                      v                                            |
|                       +-------------------------------+                           |
|                       |  Asset Resolver (image-url)   |                           |
|                       |  resolveImageUrl(path)        |                           |
|                       +---------------+---------------+                           |
|                                       |                                           |
|                   Configured by NEXT_PUBLIC_ASSET_CDN_URL                         |
+---------------------------------------+-------------------------------------------+
                                        |
                 +----------------------+----------------------+
                 | (MODE: cdn)                                 | (MODE: local)
                 v                                             v
+------------------------------------+        +-------------------------------------+
|        jsDelivr Global CDN         |        |         Next.js Public Folder       |
|  cdn.jsdelivr.net/gh/<owner>/...   |        |             public/images/          |
+-----------------+------------------+        +-------------------------------------+
                  |
                  v
+------------------------------------+
|  GitHub Assets Repository (Public) |
|      starfront-world-assets        |
|    Tag: v2.0-approved-assets       |
+------------------------------------+
```

---

## 4. Phân định trạng thái tài liệu & Phê duyệt

- **Đã xác minh (Verified):** Hiện trạng `public/images/` (26 tệp WebP, 5.44 MB, 0 trùng lặp), 21 file component UI, 31 reference trong `data.ts`, 36 reference trong `character-profile-data.ts`.
- **Đề xuất (Proposed):** Cấu trúc repository `starfront-world-assets`, kiến trúc Asset Resolver `resolveImageUrl()`, biến môi trường `NEXT_PUBLIC_ASSET_CDN_URL`, cấu hình jsDelivr CDN.
- **Chờ phê duyệt (Pending Approval):** Kế hoạch triển khai Phase WEB-01.2 và quyết định chọn GitHub Organization / Account làm nơi lưu trữ assets.
- **Đã triển khai (Implemented):** Giai đoạn khảo sát kỹ thuật và bộ tài liệu kiến trúc WEB-01 (PLAN/DEFINE ONLY).
- **Tắc nghẽn (Blocked):** Không có. Không được tự ý triển khai code (IMPLEMENT) cho đến khi được chủ dự án nghiệm thu kế hoạch.
