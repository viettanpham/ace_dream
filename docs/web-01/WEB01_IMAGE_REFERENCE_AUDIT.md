# STARFRONT WORLD V2 — WEB-01
# BÁO CÁO KIỂM TOÁN THAM CHIẾU HÌNH ẢNH (IMAGE REFERENCE AUDIT)

**Mã tài liệu:** WEB01-AUDIT-01  
**Trạng thái:** VERIFIED / CODEBASE SCAN  
**Ngày kiểm toán:** 2026-10-22  
**Đối tượng kiểm toán:** Toàn bộ repository (`lib/`, `components/`, `app/`, `docs/`, `scripts/`, `.starfront-saves/`)

---

## 1. Phân loại cấu trúc các tham chiếu (Reference Taxonomy)

Tổng cộng ghi nhận **102 điểm sử dụng UI**, **67 điểm dữ liệu Data-driven**, cùng nhiều tài liệu mô tả. Các tham chiếu được phân làm 5 nhóm:

```
                                  CÁC THAM CHIẾU HÌNH ẢNH
                                             |
         +--------------------+--------------+--------------+--------------------+
         |                    |                             |                    |
         v                    v                             v                    v
  [1. Data-Driven]     [2. UI Components]             [3. Save Games]    [4. Manifests & Docs]
  lib/game/data.ts     components/game/...            .starfront-saves/  valentine_manifest.json
  character-profile    (21 files, 102 điểm)           (Trạng thái lưu)   FND-8 naming docs
```

---

## 2. Kiểm toán chi tiết mã nguồn Logic & Dữ liệu (Data-Driven References)

### 2.1. `lib/game/data.ts` — 31 tham chiếu
Đây là **Trái tim dữ liệu V1** của game. Chứa các định nghĩa ban đầu của Pilot, GEAR và Người chơi:

1. **Khởi tạo 8 Pilot ban đầu (`INITIAL_PILOTS` - Dòng 73-80):**
   - Mỗi đối tượng pilot có 2 trường ảnh cố định:
     - `avatar`: `"/images/<pilotId>-portrait.webp"`
     - `fullBodyAvatar`: `"/images/<pilotId>-fullbody.webp"`
   - *Ví dụ dòng 73:* `avatar: "/images/marcus-portrait.webp", fullBodyAvatar: "/images/marcus-fullbody.webp"`
   - *Ví dụ dòng 74:* `avatar: "/images/valentine-portrait.webp", fullBodyAvatar: "/images/valentine-fullbody.webp"`
2. **Khởi tạo GEAR (`INITIAL_GEARS` - Dòng 921-994):**
   - `vanguard`: `illustration: "/images/vanguard-gear.webp"`, `avatar: "/images/marcus-portrait.webp"`
   - `falcon`: `illustration: "/images/falcon-gear.webp"`, `avatar: "/images/alviss-portrait.webp"`
   - `aegis`: `illustration: "/images/aegis-gear.webp"`, `avatar: "/images/valentine-portrait.webp"`
3. **Mẫu lưu mặc định (`SAVED_GAME_TEMPLATES` - Dòng 1548-1941):**
   - Chứa 8 phi công với cấu trúc avatar và fullBodyAvatar tương tự.

### 2.2. `lib/game/v2/character-profile-data.ts` — 36 tham chiếu
Đây là **Trái tim dữ liệu FND-8 V2** (Character Category / Pilot Profile):

1. **Hồ sơ Valentine Vance (Dòng 125-126, 224-324):**
   - `fullbodyAssetPath: "/images/valentine-fullbody.webp"`
   - `portraitAssetPath: "/images/valentine-portrait.webp"`
   - Mảng `galleryItems`: 12 mục chi tiết. Trong đó:
     - 7 mục đã có tệp thật trên đĩa: `valentine-fullbody`, `portrait`, `activity-001`, `casual`, `closeup`, `combat`, `event-001`.
     - 5 mục đánh dấu `isArchivePending: true` (`event-002`, `story-001`, `story-002`, `hangar-001`, `medic-002`) để UI render thẻ Archive Pending, không sinh mã HTTP 404.
2. **11 Pilot Class V2 còn lại (Dòng 358-689):**
   - Mỗi phi công đăng ký cặp `fullbodyAssetPath` và `portraitAssetPath` tương ứng (`kaelen`, `alviss`, `victor`, `eric`, `selena`, `marcus`, `lyra`, `fortuna`, `aria`, `rhea`, `nova`).

---

## 3. Kiểm toán các Component giao diện (UI Rendering Usage)

Có **21 tệp component** trực tiếp hiển thị hình ảnh từ các trường dữ liệu trên:

### 3.1. Nhóm Giao diện V1 (Legacy Screens)
- `components/game/character-gear-select.tsx` (18 điểm): Chọn phi cơ và phi công xuất trận.
- `components/game/pilot-gallery.tsx` (13 điểm): Thư viện chân dung và chi tiết phi công V1.
- `components/game/war-room.tsx` (8 điểm): Phòng tác chiến chiến lược, hiển thị avatar chỉ huy.
- `components/game/starfront-home.tsx` (7 điểm): Màn hình chính căn cứ.
- `components/game/starfront-hangar.tsx` (6 điểm): Xưởng bảo dưỡng phi cơ GEAR.
- `components/game/pilot-status-dashboard.tsx` (6 điểm): Bảng theo dõi tình trạng nhân sự.
- `components/game/player-status.tsx` (3 điểm): Thanh trạng thái người chơi góc trên.
- `components/game/pilot-panel.tsx` (3 điểm): Panel phi công trong đội hình.
- `components/game/starfront-shell.tsx` (2 điểm): Vỏ bọc tổng điều hành V1.

### 3.2. Nhóm Giao diện V2 (FND-8 Modern Aerospace UI)
- `components/game/v2/pilot-profile/desktop-view.tsx` (5 điểm): Bố cục Desktop 3 cột, tranh toàn thân trung tâm.
- `components/game/v2/pilot-profile/mobile-art-view.tsx` (2 điểm): Bố cục Mobile Art View tôn vinh artwork.
- `components/game/v2/pilot-profile/mobile-info-view.tsx` (3 điểm): Bố cục Mobile Info View hiển thị avatar và preview tranh.
- `components/game/v2/pilot-profile/tabs/gallery-tab.tsx` (1 điểm): Tab Bộ sưu tập hình ảnh V2.
- `components/game/v2/character-profile/artwork-lightbox-modal.tsx` (1 điểm): Xem phóng to chi tiết tranh.
- `components/game/v2/ui/art-viewer.tsx` (1 điểm): Bộ điều khiển zoom/pan/full-screen ảnh V2.

---

## 4. Kiểm toán Dữ liệu Lưu trữ (Save Game Persistence)

Trong thư mục `.starfront-saves/dev/`:
- `latest_dev_save.json`
- `autosave_day_42_tick_0_*.json`

**Phát hiện rủi ro nghiêm trọng:**
Các tệp save game lưu trữ trạng thái tuần tự hóa (serialized state) của game V1, bao gồm cả các thuộc tính chuỗi như `pilot.avatar = "/images/marcus-portrait.webp"`.
- **Rủi ro:** Nếu thay đổi cấu trúc dữ liệu lưu trong database/store thành URL CDN tuyệt đối, các file save cũ sẽ không đồng bộ hoặc ngược lại, việc sửa đổi trực tiếp schema đường dẫn sẽ làm hỏng dữ liệu lưu của người chơi.
- **Giải pháp bắt buộc:** Trong Store và Save Data, **giữ nguyên chuỗi đường dẫn tương đối** `/images/<file>.webp`. Chỉ khi đưa vào thẻ `<img src={resolveImageUrl(pilot.avatar)} />` hoặc `<Image src={resolveImageUrl(pilot.avatar)} />` thì mới chuyển hóa qua Asset Resolver.

---

## 5. Đánh giá bán kính ảnh hưởng (Blast Radius Assessment)

| Phạm vi | Số file ảnh hưởng | Rủi ro nếu đổi URL thủ công | Rủi ro nếu dùng Asset Resolver |
| :--- | :---: | :--- | :--- |
| **Logic & State V1** | 1 (`data.ts`) | **CỰC KỲ CAO** (Làm hỏng Save game và game loop) | **KHÔNG CÓ** (Data giữ nguyên) |
| **Logic & Catalog V2**| 1 (`character-profile-data.ts`) | **CAO** (Làm lệch Manifest và Zero-404 Policy) | **KHÔNG CÓ** (Data giữ nguyên) |
| **Component V1** | 9 components | **CAO** (Phải sửa 60+ vị trí JSX) | **THẤP** (Bọc hàm resolver tại điểm render) |
| **Component V2** | 12 components | **TRUNG BÌNH** (Phải cập nhật ArtViewer) | **CỰC THẤP** (Đã có sẵn kiến trúc trừu tượng) |
| **Next.js Config** | 1 (`next.config.mjs`) | **CAO** (Lỗi Image host nếu thiếu remotePatterns) | **ĐÃ CÓ GIẢI PHÁP** (Khai báo cdn.jsdelivr.net) |
