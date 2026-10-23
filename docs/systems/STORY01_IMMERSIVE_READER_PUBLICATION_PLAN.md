# STARFRONT WORLD V2 — FND-8.2.3 STORY-01
## IMMERSIVE STORY READER + STORY PUBLICATION MANAGER
### BẢN THIẾT KẾ KIẾN TRÚC & QUY TRÌNH PHÁT HÀNH CỐT TRUYỆN (PLAN / DEFINE CANONICAL)

- **Dự án:** `viettanpham/ace_dream`
- **Mã hệ thống:** FND-8.2.3 / STORY-01
- **Baseline:** FND8-HANDOFF-14 (Mobile Hotfix Verified) + WEB01-HANDOFF-09 (AdminCP Architecture)
- **Tình trạng:** **PLAN / DEFINE ONLY** (Chờ chủ dự án phê duyệt trước khi viết mã implementation)
- **Ngôn ngữ:** 100% Tiếng Việt

---

## 1. TỔNG QUAN & MỤC TIÊU HỆ THỐNG

### 1.1. Bối cảnh
Trước đây, hồ sơ cốt truyện của Pilot được hiển thị trong Tab **STORY** của cột Hồ sơ (Dossier) tại `/v2/pilots`. Thiết kế này phục vụ tốt cho việc đọc nhanh tóm tắt (Summary) và danh sách chương. Tuy nhiên, khi đưa toàn văn văn xuôi (Prose Body) vào panel hẹp này, trải nghiệm đọc bị bó hẹp, thiếu không gian thẩm mỹ điện ảnh (cinematic), và không kết nối mượt mà với kho artwork minh họa chất lượng cao của nhân vật.

### 1.2. Mục tiêu kiến trúc
Thiết lập chu trình 3 tầng khép kín:
1. **Character Category Story Preview (Dossier Tab):** Giữ vai trò thẻ tóm tắt nhân vật, mục lục chương, hiển thị trạng thái và nút mở chuyên dụng.
2. **Immersive Story Reader:** Trải nghiệm đọc truyện chuyên biệt toàn màn hình, thanh thoát, chia 3 cột trên Desktop (Mục lục - Văn bản - Tranh cuộn tương tác) và 1 cột cuộn liền mạch kèm Drawer trên Mobile.
3. **AdminCP Story Publication Manager:** Bảng điều khiển quản trị cho phép kiểm duyệt, bật/tắt (Publish/Hide) từng chương hồi độc lập cho 12 Pilot mà **không cần sửa code hay rebuild ứng dụng**.

---

## 2. HIỆN TRẠNG DỮ LIỆU CỐT TRUYỆN 12 PILOT (AUDIT THỰC TẾ REPO)

Dựa trên kiểm tra trực tiếp mã nguồn `lib/game/v2/character-profile-data.ts`:

### 2.1. Valentine Aurelia Vance (Reference Lead)
Valentine là nhân vật duy nhất hiện tại có cấu trúc chương hồi đầy đủ:
- **Chương 01 ("Ánh sáng cuối cùng tại Elysia"):** `APPROVED` — **ĐÃ CÓ TOÀN VĂN (FULL PROSE BODY)** gồm 6 đoạn văn xuôi mô tả trạm y tế Elysia, tín hiệu cầu cứu, lựa chọn bi kịch và lý tưởng bảo vệ sinh mạng.
- **Chương 02–04:** `APPROVED` — **CHỈ MỚI CÓ TÓM TẮT (SUMMARY)**, CHƯA CÓ văn bản toàn văn trong repo.
- **Chương 05–06:** `PROVISIONAL` — Tóm tắt tạm thời về thời kỳ học viện và thử nghiệm Mercy Wing, chờ chủ dự án chốt nội dung.
- **Chương 07–10:** `HOLD` — Niêm phong cốt truyện cấp độ cao, giữ bí mật chiến dịch Starfront.
- **Tài liệu cũ `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md`:** Đã được kiểm chứng là tài liệu nháp ban đầu, nội dung canon hiện hành được chuẩn hóa trong `character-profile-data.ts`.

### 2.2. 11 Pilot còn lại
- **Alviss, Eric, Marcus, Sean, Lyra, Selene, v.v.:**
  - Đã có `storySummary` tổng quan.
  - Một số nhân vật có 2–3 tiêu đề chương nháp kèm tóm tắt 1 câu.
  - **100% CHƯA CÓ văn bản văn xuôi toàn văn (Prose Body)**.
- **Kết luận:** Hệ thống Story Reader phải được thiết kế dạng generic engine (dùng chung cho 12 Pilot), nhưng Valentine là phi công duy nhất đủ điều kiện kích hoạt bản đọc hoàn chỉnh ngay ở giai đoạn đầu.

---

## 3. MÔ HÌNH KIẾN TRÚC 3 TẦNG (THREE-TIER ARCHITECTURE)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        TẦNG 1: DOSSIER STORY TAB                       │
│  - Route: /v2/pilots (Panel Dossier Tab 2)                             │
│  - Chức năng: Bio Summary + 10 Chapter Badges + Trích dẫn Lead         │
│  - Nút kích hoạt: [ĐỌC TOÀN VĂN // IMMERSIVE READER] (P0 CTA)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Kích hoạt chuyển ngữ cảnh
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   TẦNG 2: IMMERSIVE STORY READER                       │
│  - Route: /v2/pilots/[id]/story/[chapterId] hoặc Reader View Mode      │
│  - Bố cục Desktop: 3 Cột (Nav / Typography Center / Sticky Artwork)   │
│  - Bố cục Mobile: 1 Cột (Văn bản + Inline Art + TOC Drawer)            │
│  - Tương tác: Scroll-Driven Anchor Art, Fullscreen Zoom, Reading Font   │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ Đọc trạng thái công bố (Runtime)
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│              TẦNG 3: ADMINCP STORY PUBLICATION MANAGER                 │
│  - Route: /ui-v2-preview/admin hoặc /admin/story (Protected)           │
│  - Chức năng: Ma trận 12 Pilot × 10 Chapter                            │
│  - Thao tác: Xuất bản (Publish) / Tạm ẩn (Hide) / Xem trước (Preview)  │
│  - Lưu trữ: Backend Atomic Storage + CAS Revision Lock + Audit Log     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. ĐẶC TẢ CHI TIẾT TRẢI NGHIỆM IMMERSIVE STORY READER

### 4.1. Desktop Reading Mode (3 Cột)
- **Khung chứa:** Toàn bộ Main Viewport bên trong V2 App Shell (bảo toàn Global Top Menu và Global Left Menu V2).
- **Cột Trái — Chapter Navigation & Reading Progress (240px - 280px):**
  - Nút quay lại Dossier (`Quay lại Hồ sơ Phi công`).
  - Danh sách 10 chương của phi công với trạng thái: Đang đọc (Active), Đã đọc, Khóa (Locked).
  - Thanh tiến trình cuộn đọc (% Scroll Progress) của chương hiện tại.
  - Bộ chỉnh cỡ chữ (Font size A- / A+) và độ sáng nền (Dark / Deep Space).
- **Cột Giữa — Prose Reading Flow (680px - 760px, Căn giữa):**
  - Tiêu đề chương, Chương số, Thời gian ước tính đọc (Read Time).
  - Khối trích dẫn mở đầu (Chapter Lead / Epigraph).
  - Định dạng văn xuôi tiêu chuẩn xuất bản: Font sans hiện đại/serif nhẹ, cỡ chữ mặc định 18px, khoảng cách dòng `leading-[1.85]`, lề đoạn rõ ràng, chống mỏi mắt.
  - Các đoạn văn chứa thẻ neo vị trí (Scene Anchors).
  - Chân trang chương: Nút chuyển chương trước / chương tiếp theo và nút đánh dấu hoàn thành.
- **Cột Phải — Sticky Dynamic Artwork Stage (340px - 420px):**
  - Khung tranh cố định (`sticky top-6`) đồng bộ trực tiếp với vị trí cuộn chuột của người đọc.
  - Hiệu ứng chuyển tranh chéo (Crossfade 350ms) mượt mà khi cuộn tới đoạn văn tương ứng.
  - Chú thích ngữ cảnh (Caption/Scene context) và nút phóng to mở Fullscreen Viewer (sử dụng lại engine viewer đã hoàn thiện).
  - **Quy tắc thích ứng:** Nếu chương không có tranh (Text-only), cột phải tự động thu gọn và cột giữa mở rộng căn giữa hoàn hảo (Zero Empty Dark Box).

### 4.2. Mobile Reading Mode (1 Cột Tối Ưu Cuộn Dọc)
- **Header Thanh Đọc Thu Gọn:**
  - Nút back về Profile.
  - Tên chương và tiến trình đọc (% cuộn).
  - Nút mở Mục Lục Chương (Mở Bottom Sheet / Drawer).
- **Luồng Nội Dung:**
  - Văn bản 1 cột trải rộng, cỡ chữ 16–17px, `leading-[1.8]`, padding 16px.
  - Artwork xuất hiện **Inline (xen kẽ)** tại đúng vị trí đoạn văn được gán thẻ neo (giữ trọn tỷ lệ ảnh, kèm caption và nút chạm để phóng to toàn màn hình).
- **Drawer Mục Lục (Bottom Sheet):**
  - Vuốt từ dưới lên để xem danh sách chương và chuyển chương tức thì mà không phải thoát Reader.

---

## 5. CƠ CHẾ SCROLL-DRIVEN ANCHOR ARTWORK

### 5.1. Cấu trúc thẻ neo trong dữ liệu chương (Story Anchor Schema)
```typescript
export interface StorySceneAnchor {
  anchorId: string;           // Định danh duy nhất: "val-ch01-scene-evac"
  paragraphIndex: number;     // Vị trí đoạn văn kích hoạt (0-indexed)
  assetId: string;            // ID tranh trong Catalog: "valentine-story-001"
  assetPath: string;          // Đường dẫn WebP đã verify: "/images/valentine-story-001.webp"
  caption: string;            // Chú thích: "Valentine điều phối phi đội cứu hộ trong bão Elysia"
  aspectRatio?: "16:9" | "4:3" | "1:1" | "portrait";
}
```

### 5.2. Nguyên lý kích hoạt tương tác (IntersectionObserver Engine)
- Mỗi đoạn văn được gắn thẻ neo có một `data-story-anchor-id`.
- Bộ theo dõi `IntersectionObserver` tại Client Component theo dõi sự xuất hiện của các đoạn văn này trong phạm vi viewport (threshold 0.5 hoặc rootMargin `-20% 0px -40% 0px`).
- Khi đoạn văn đi vào trọng tâm đọc:
  1. Cập nhật `activeAnchorId`.
  2. Kích hoạt hiệu ứng làm mờ và nạp tranh mới tại Cột Phải (Desktop) với transition 350ms.
  3. Cập nhật Caption tương ứng bên dưới khung tranh.
  4. Người đọc có thể bấm trực tiếp vào ảnh để mở Fullscreen Viewer mà không làm mất vị trí cuộn đọc.

---

## 6. HẠ TẦNG PERSISTENCE & API XUẤT BẢN ADMINCP

### 6.1. Nguyên tắc cốt lõi
- **Không rebuild Next.js khi bật/tắt chương:** Trạng thái phát hành được lưu độc lập tại tầng dữ liệu cấu hình runtime.
- **Kế thừa kiến trúc an toàn của WEB-01:** Sử dụng cùng tiêu chuẩn bảo mật với `app/api/admin/asset-version/` (Session Cookie HMAC, CSRF Token, CAS Concurrency Locking, Atomic File Write).

### 6.2. Cấu trúc tệp dữ liệu lưu trữ (`.starfront-config/story-publication.json`)
```json
{
  "schemaVersion": 1,
  "revision": 12,
  "updatedAt": "2026-10-23T16:00:00.000Z",
  "updatedBy": "admin_editor",
  "publications": {
    "valentine": {
      "chap-01": {
        "status": "PUBLISHED",
        "publishedAt": "2026-10-23T16:00:00.000Z",
        "contentVersion": "1.0",
        "wordCount": 780,
        "anchorsCount": 2
      },
      "chap-02": {
        "status": "UNPUBLISHED",
        "reason": "MISSING_BODY"
      },
      "chap-07": {
        "status": "LOCKED",
        "reason": "CANON_HOLD"
      }
    }
  }
}
```

### 6.3. Thiết kế Route API
- `GET /api/runtime/story-catalog`: Public API trả về danh mục chương đã được lọc (chỉ trả về các chương `PUBLISHED` cho người dùng cuối).
- `GET /api/admin/story-publication`: Protected Admin API trả về toàn bộ ma trận trạng thái và lịch sử kiểm duyệt.
- `POST /api/admin/story-publication`: Protected Admin API thực hiện bật/tắt (Publish/Hide/Lock) có kiểm tra CSRF và CAS revision.

---

## 7. ĐIỀU KIỆN TIÊN QUYẾT XUẤT BẢN (SECURITY & EDITORIAL GATES)

Để bảo đảm tính toàn vẹn của trò chơi, hệ thống đặt ra các rào cản bất biến (**Invariants**):

1. **Rào cản Toàn văn (Body Presence Gate):**
   - Chỉ chương có trường `content` hợp lệ (độ dài >= 200 từ) và `bodyImportStatus === 'VERIFIED'` mới được phép chuyển sang trạng thái `PUBLISHED`.
   - Các chương chỉ có `summary` ngắn (như Valentine Chương 02–04) **BỊ CHẶN TUYỆT ĐỐI** không thể Publish dưới dạng văn bản hoàn chỉnh.
2. **Rào cản Phê duyệt (Approval Gate):**
   - Chỉ chương có `contentStatus === 'APPROVED'` mới được duyệt xuất bản.
   - Các chương `PROVISIONAL` chỉ được xem ở chế độ **Admin Preview**, không xuất hiện ở Public Reader.
3. **Rào cản Niêm phong (HOLD Seal Gate):**
   - Các chương mang nhãn `HOLD` (như Valentine Chương 07–10) bị khóa cứng từ schema gốc, giao diện Admin không thể cưỡng ép mở khóa nếu chưa có văn bản canon giải mật.
4. **Hành vi Tạm ẩn (Hide Action):**
   - Khi Admin chuyển trạng thái sang `HIDDEN`, chương trình chỉ ẩn chương khỏi Public Reader nhưng **không xóa nội dung** và không làm thay đổi trạng thái phê duyệt gốc.

---

## 8. CHIẾN LƯỢC BẢO TOÀN V2 APP SHELL & TƯƠNG THÍCH NGƯỢC

1. **Không phá vỡ cấu trúc V2 đã duyệt:**
   - Reader hoạt động bên trong Main Viewport của V2 App Shell.
   - Global Top Menu và Global Left Menu (Full/Mini) vẫn được duy trì nguyên vẹn ở trạng thái người dùng đã chọn.
2. **Không phân mảnh Route:**
   - Có thể kích hoạt Reader dưới dạng Sub-view mượt mà ngay tại `/v2/pilots` thông qua state điều hướng `mode: 'dossier' | 'reader'`, hoặc Route song song `/v2/pilots/[id]/story/[chapterId]`.
3. **Bảo toàn dữ liệu V1:**
   - Tuyệt đối không chạm vào codebase hoặc asset của V1.

---

## 9. KẾ HOẠCH PHÂN KỲ TRIỂN KHAI (4 PHASES)

| Giai đoạn | Mã phân kỳ | Phạm vi thực hiện | Tiêu chí nghiệm thu |
| :--- | :--- | :--- | :--- |
| **Phase 1** | `STORY-01.A` | Xây dựng Story Data Schema chuẩn, Anchor Types, Store Persistence và API Admin. | Đọc/ghi cấu hình xuất bản atomic thành công; unit test schema pass. |
| **Phase 2** | `STORY-01.B` | Xây dựng Immersive Story Reader Component (Desktop 3 cột + Mobile 1 cột cuộn mượt). | Valentine Chương 01 đọc hoàn hảo, cuộn đổi tranh mượt mà, mở ảnh phóng to pass. |
| **Phase 3** | `STORY-01.C` | Tích hợp AdminCP Story Publication Manager (Ma trận 12 Pilot × 10 Chapter). | Bật/tắt chương không cần rebuild; kiểm tra đúng các rào cản bảo mật. |
| **Phase 4** | `STORY-01.D` | Kiểm thử toàn diện E2E, Mobile responsive, audit audit-log, cập nhật handoff. | 100% test pass, sẵn sàng cho nhập liệu văn bản các phi công tiếp theo. |

---

## 10. KẾT LUẬN & ĐỀ XUẤT XIN Ý KIẾN CHỦ DỰ ÁN

Tài liệu này xác lập đầy đủ nền tảng kiến trúc cho hệ thống Story Reader chuyên nghiệp của STARFRONT V2. Toàn bộ mã nguồn hiện tại được bảo toàn 100%. 

**Đề xuất tiếp theo:** Chờ chủ dự án xem xét và duyệt tài liệu này trước khi bước vào triển khai Phase `STORY-01.A`.
