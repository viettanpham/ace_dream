# UI V2 Foundation — Scope & Page Contract
Tài liệu Canonical: `docs/UI_v2/01_UI_V2_FOUNDATION_SCOPE_AND_PAGE_CONTRACT.md`  
Liên kết đặc tả UX chi tiết: `docs/UI_v2/07_UI_V2_UX_CONTRACT_AND_RESPONSIVE_SPEC.md`

## Shared Shell (Kiến Trúc 4 Tầng)
```text
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TẦNG 1: GLOBAL TOP BAR (Logo, Hệ thống / Thế giới, Tài nguyên, Cài đặt, Mobile Hamburger)       │
├───────────────────┬───────────────────────────┬────────────────────────────────────────────────┤
│ TẦNG 2:           │ TẦNG 3:                   │ TẦNG 4:                                        │
│ GLOBAL LEFT MENU  │ SYSTEM SELECTOR PANE      │ MAIN CONTENT STAGE                             │
│ (Full: 240px      │ (Ví dụ: Pilot Roster)     │ (Độc lập, co giãn chiếm toàn bộ không gian     │
│  Mini: 64px)      │ (Full: 260px              │  còn lại; ưu tiên tối thượng cho trải nghiệm   │
│ [Toggle riêng]    │  Mini: 72px)              │  đọc và thao tác chính)                        │
│                   │ [Toggle riêng]            │                                                │
└───────────────────┴───────────────────────────┴────────────────────────────────────────────────┘
```
Đây là hợp đồng cấu trúc chuẩn của Shared Shell V2. Global Left Menu và System Selector (ví dụ Pilot Roster) có trạng thái Full/Mini hoạt động độc lập, có nút toggle riêng biệt, và khi thu gọn phải trả không gian cho Main Content Stage.

## Top Menu (Global Top Bar)
- Desktop: rõ ràng, chiều cao hợp lý (56px–64px), sticky top với backdrop blur.
- Mobile: ưu tiên thông tin quan trọng, tích hợp nút mở Hamburger Drawer ($\ge 44\text{px}$); chiều cao $\le 56\text{px}$ ($\le 10\%$ viewport height).
- Settings là nơi đổi V1/V2 khi triển khai Phase 3.
- Chỉ hiển thị world/resource values khi nguồn dữ liệu thật tồn tại từ canonical adapter; tuyệt đối không bịa số liệu.

## Left Navigation (Global Left Menu)
- Desktop: Hai trạng thái độc lập **Full (~240px)** và **Mini (~64px)** có toggle control riêng.
- Tablet: Ưu tiên trạng thái Mini để bảo vệ độ rộng Main Content.
- Mobile: Ẩn khỏi màn hình chính, mở bằng Drawer trượt từ bên trái với nút đóng $X$ ($44\times 44\text{px}$) và backdrop mờ; đóng tự động khi chọn mục hoặc bấm Escape.
- Item có icon + label. Page chưa làm phải có status (`PLACEHOLDER` / `IN_PROGRESS`), không giả vờ hoàn thiện.

## System Selector Pane (Ví dụ: Pilot Roster)
- Phân vùng chọn đối tượng theo từng system cụ thể.
- Desktop: Trạng thái Full (~260px) và Mini (~72px) với nút toggle riêng biệt.
- Tablet: Ưu tiên Mini hoặc popover thả xuống.
- Mobile: Thay bằng dải avatar cuộn ngang (Horizontal Avatar Rail) và nút mở danh sách đầy đủ qua Bottom Sheet/Drawer.
- Khi thu gọn, tự động nhường toàn bộ bề rộng dôi ra cho Main Content Stage.

## Main Page (Main Content Stage)
- Khu vực hiển thị cốt lõi, luôn chiếm không gian còn lại. Không để hai sidebar bóp nghẹt nội dung dưới mức dễ đọc.
- Typography: Story/đọc sâu $17$–$18\text{px}$ (line-height $1.65$), nội dung chuẩn $16\text{px}$, phụ tối thiểu $14\text{px}$, không dùng chữ $< 12\text{px}$.
- Trạng thái placeholder/loading/empty/error/ready phải dễ hiểu, sử dụng V2 feedback primitives.
- Không kế thừa CRT scanlines, màu retro xanh lá, font hay CSS đặc thù V1.
- Không tạo giant component chứa shell và toàn bộ page.

## Responsive Breakpoints
- Desktop: $\ge 1280\text{px}$.
- Tablet: $768\text{px}$ đến dưới $1280\text{px}$.
- Mobile: dưới $768\text{px}$ (chuẩn xác minh $390\text{px}$ và $360\text{px}$).
- Chi tiết xem tại `docs/UI_v2/07_UI_V2_UX_CONTRACT_AND_RESPONSIVE_SPEC.md`.

## Page Contract
Mỗi page V2 có metadata ổn định: `id`, `label`, `group/system`, `status`, `version: "v2"`, và route/component phù hợp repo. Không xây registry quá phức tạp; không hardcode menu lặp lại trong nhiều component.

## Pilot Category/Profile (Phase 4)
Sau khi Shell sẵn sàng, dùng Valentine làm page đầu tiên; desktop + mobile trong cùng phase; đối chiếu concept WebP trực tiếp tại `docs/art-direction/UI_CONCEPTS/`; chỉ load WebP thực sự có trên đĩa; asset thiếu hiển thị placeholder/archive card, không request URL chết. Các tab Overview/Story/Gear Compatibility/Gallery có ranh giới rõ. Không tái sử dụng nguyên layout/CSS V1.
