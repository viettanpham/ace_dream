# STARFRONT WORLD — FND-UI-V2.0
# KIẾN TRÚC KỸ THUẬT GIAO DIỆN V2 (TECHNICAL ARCHITECTURE SPECIFICATION)

**Ngày ban hành:** 2026-10-22  
**Phiên bản:** 2.0.0-PROVISIONAL  
**Trạng thái:** DEFINE / PLAN ONLY  
**Mục tiêu:** Thiết lập cấu trúc hệ thống, ranh giới module, cơ chế điều phối Shell kép và ngăn ngừa rò rỉ CSS (Anti-Leakage) cho STARFRONT UI V2.

---

## 1. Sơ Đồ Kiến Trúc Tổng Thể (System Architecture Overview)

```
                     ┌────────────────────────────────────────────────────────┐
                     │                    app/layout.tsx                      │
                     │  - HTML Root & Font Declarations (Rajdhani, Orbitron)  │
                     │  - Zero CSS leakage wrapper                            │
                     └───────────────────────────┬────────────────────────────┘
                                                 │
                                                 ▼
                     ┌────────────────────────────────────────────────────────┐
                     │                     app/page.tsx                       │
                     │               [ AppShellDispatcher ]                   │
                     │  - Đọc UI Preference: STARFRONT_INTERFACE_VERSION      │
                     │  - Quản lý State Tiến Trình: useStarfrontProgression   │
                     │  - Không Reload khi chuyển Shell, 100% dữ liệu vẹn toàn│
                     └─────────────┬────────────────────────────┬─────────────┘
                                   │                            │
                     [ Version: 'v1' ]            [ Version: 'v2' (Mặc định) ]
                                   │                            │
                                   ▼                            ▼
            ┌─────────────────────────────┐      ┌─────────────────────────────┐
            │      StarfrontShell (V1)    │      │    StarfrontShellV2 (V2)    │
            │  - Legacy CRT & Scanlines   │      │  - Modern Aerospace UI      │
            │  - V1 Navigation Registry   │      │  - V2 Navigation Registry   │
            │  - 100% Phân hệ V1 cũ       │      │  - V2 Shared UI Components  │
            │  - CRT Sound & Retro theme  │      │  - Shared Art Viewer 4K     │
            └──────────────┬──────────────┘      └──────────────┬──────────────┘
                           │                                    │
                           ▼                                    ▼
            ┌─────────────────────────────┐      ┌─────────────────────────────┐
            │      V1 Page Components     │      │     V2 Screen Components    │
            │  - Home, Battlefield V1     │      │  - V2 Operations Dashboard  │
            │  - CharacterGearSelect (V1) │      │  - Pilot Profile V2 (FND-8) │
            │  - PilotGallery (V1)        │      │  - V2 Settings & Audio      │
            │  - Hangar & Shop (V1)       │      │  - V2 Hangar (Tương lai)    │
            └──────────────┬──────────────┘      └──────────────┬──────────────┘
                           │                                    │
                           └──────────────────┬─────────────────┘
                                              │
                                              ▼
                             ┌───────────────────────────────────┐
                             │    CANONICAL DATA & DOMAIN APIS   │
                             │  - lib/game/storage.ts (V4 Save)  │
                             │  - lib/game/progression.ts        │
                             │  - lib/game/audio.ts              │
                             │  - lib/game/v2/character-profile- │
                             │    data.ts (Canonical Adapter)    │
                             └───────────────────────────────────┘
```

---

## 2. Cơ Chế Điều Phối Vỏ Ứng Dụng (AppShellDispatcher Pattern)

### 2.1. Vấn Đề Kỹ Thuật Đặt Ra
- Nếu sử dụng 2 route con dạng `/` và `/v2`: Việc chuyển đổi giao diện sẽ kích hoạt chuyển trang (page transition/URL change) làm gián đoạn trạng thái bộ nhớ tạm, nhạc nền hoặc phiên chơi hiện tại.
- Nếu gộp chung 2 shell vào 1 component khổng lồ: Tệp mã nguồn sẽ phình to, CSS và logic của V1 sẽ xen lẫn vào V2 gây ô nhiễm mã (code contamination).

### 2.2. Giải Pháp: `AppShellDispatcher` Tại `app/page.tsx`
`app/page.tsx` đóng vai trò là Bộ Điều Phối Phiên Bản Giao Diện cấp cao nhất:
1. Đọc khóa cấu hình giao diện từ `localStorage`:
   - Khóa: `STARFRONT_INTERFACE_VERSION`
   - Giá trị: `"v1"` hoặc `"v2"` (Mục tiêu mặc định khởi tạo: `"v2"`).
2. Tải dữ liệu tiến trình người chơi `progression` bằng `loadStarfrontProgression()`.
3. Cung cấp hàm đồng bộ `handleSwitchInterfaceVersion(targetVersion: "v1" | "v2")`:
   - Ghi giá trị mới vào `localStorage`.
   - Cập nhật state nội bộ của `AppShellDispatcher`.
   - Chuyển giao diện ngay lập tức mà **hoàn toàn không tải lại trang (Zero Reload)**.
4. Render có điều kiện:
   - Nếu `interfaceVersion === "v1"`: Render `<StarfrontShell />` (V1 shell).
   - Nếu `interfaceVersion === "v2"`: Render `<StarfrontShellV2 />` (V2 shell).

---

## 3. Ranh Giới Phong Cách & Chống Rò Rỉ CSS (Anti-CSS-Leakage Strategy)

### 3.1. Phân Tách Không Gian Tên CSS (CSS Scoping)
- **V1 Styles:**
  - V1 sử dụng hiệu ứng CRT Scanlines, CRT Beam, Vignette, góc bo màn hình CRT, và các biến CSS `--color-panel`, `--grid-line`.
  - Các hiệu ứng này được kích hoạt thông qua các class như `.scanline-overlay`, `.crt-beam`, `.crt-vignette` nằm trong `StarfrontShell`.
- **V2 Styles:**
  - V2 đóng gói toàn bộ cây DOM trong lớp bọc độc lập:
    `<div className="sf-v2-root bg-[#05070D] text-slate-100 font-sans antialiased min-h-screen">`
  - V2 **tuyệt đối không áp dụng class CRT hay scanline**.
  - Các thuộc tính hiển thị riêng của V2 sử dụng trực tiếp tiện ích Tailwind v4 (`bg-slate-950`, `bg-slate-900/80`, `border-slate-800`, `text-slate-100`, `text-cyan-400`, `shadow-[0_0_20px_rgba(6,182,212,0.35)]`).
  - Không ghi đè hoặc can thiệp vào các biến CSS `:root` của V1.

### 3.2. Không Gian Thư Mục Cách Ly (Isolated Directory Structure)
```
/components/game/
├── starfront-shell.tsx         <-- V1 Shell gốc (Bảo tồn 100%, gỡ tab thử nghiệm V2)
├── pilot-gallery.tsx           <-- V1 Gallery gốc
├── character-gear-select.tsx   <-- V1 Character Gear gốc
└── v2/                         <-- KHÔNG GIAN RIÊNG CHO V2
    ├── shell/
    │   ├── starfront-shell-v2.tsx      <-- V2 Master Shell mới
    │   ├── v2-topbar.tsx               <-- Topbar chuẩn V2
    │   ├── v2-sidebar.tsx              <-- Sidebar điều hướng V2
    │   ├── v2-mobile-nav.tsx           <-- Điều hướng di động V2
    │   └── v2-nav-registry.ts          <-- Danh mục màn hình V2
    ├── ui/                             <-- THÀNH PHẦN DÙNG CHUNG V2
    │   ├── button.tsx
    │   ├── tabs.tsx
    │   ├── card.tsx
    │   ├── tooltip.tsx
    │   ├── dialog.tsx
    │   ├── drawer.tsx
    │   └── feedback.tsx
    ├── art-viewer/                     <-- TRÌNH SOI TRANH DÙNG CHUNG
    │   ├── shared-art-viewer.tsx
    │   └── art-viewer-controls.tsx
    ├── settings/                       <-- CÀI ĐẶT V2
    │   └── v2-settings-modal.tsx       <-- Tích hợp bộ chuyển Version V1/V2
    └── pilots/                         <-- PILOT CATEGORY V2 REBUILD
        ├── pilot-category-v2.tsx
        ├── desktop-pilot-view.tsx
        └── mobile-pilot-view.tsx
```

---

## 4. Bảo Toàn Trạng Thái Tiến Trình Trò Chơi (State Continuity)

### 4.1. Single Source of Truth
Cả hai shell cùng đọc và ghi vào một nguồn dữ liệu tiến trình duy nhất:
- Tệp quản lý: `lib/game/storage.ts`
- Khóa lưu trữ chính: `STARFRONT_SAVE_DATA_V4`
- Cấu trúc dữ liệu: `StarfrontProgression` (Level, Credits, Alloy, Inventory, Active Pairing, Quests, World Encounters).

### 4.2. Luồng Chuyển Đổi Không Gián Đoạn (Seamless Transition Flow)
1. Người dùng đang ở V1, mở **Cài Đặt** $\rightarrow$ chọn **"Chuyển sang Giao Diện V2"**.
2. Hàm `saveInterfaceVersion("v2")` được gọi:
   - Ghi `"v2"` vào `localStorage`.
   - Dispatcher cập nhật state React: Ngay lập tức ngắt mount V1 Shell và mount V2 Shell.
   - Đối tượng `progression` hiện tại trong bộ nhớ được truyền nguyên vẹn sang V2 Shell qua prop.
3. Người dùng tiếp tục trải nghiệm tại V2 với đầy đủ số Credits, trang bị và phi công hiện hữu mà không bị gián đoạn.
4. Thao tác ngược lại từ V2 về V1 hoạt động với cơ chế tương tự.

---

## 5. Quy Chuẩn Đăng Ký Điều Hướng (V2 Navigation Contract)

### 5.1. Cấu Trúc Khai Báo Điều Hướng `V2NavItem`
```typescript
export interface V2NavItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "command" | "tactical" | "armory" | "system";
  badge?: string;
  isImplemented: boolean; // Chỉ hiển thị nếu true
}
```

### 5.2. Danh Mục V2 Khởi Điểm
1. **`overview` (Bảng Chỉ Huy Chiến Lược V2):** Hiển thị trạng thái hạm đội, nhiệm vụ gợi ý, thông số phi công chủ lực.
2. **`pilots` (Hồ Sơ Phi Công & Danh Mục Nhân Vật V2):** Tích hợp phân hệ Pilot Category xây dựng lại dựa trên Foundation V2 và Artwork Valentine đã duyệt.
3. **`settings` (Cài Đặt Hệ Thống):** Cho phép điều chỉnh âm lượng, tỷ lệ hiển thị UI và chuyển đổi phiên bản giao diện V1/V2.
