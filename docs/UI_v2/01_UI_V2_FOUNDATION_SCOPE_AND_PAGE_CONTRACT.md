# UI V2 Foundation — Scope & Page Contract

## Shared Shell
```text
┌─────────────────────────────────────────────────────────────────────┐
│ TOP MENU: logo / world status / resources / notifications / settings│
├────────────────┬────────────────────────────────────────────────────┤
│ LEFT NAV       │ MAIN PAGE                                          │
│ system links   │ page title / optional breadcrumbs                  │
│ active state   │ content riêng của page                             │
│ collapse       │                                                    │
└────────────────┴────────────────────────────────────────────────────┘
```
Đây là hợp đồng cấu trúc, không bắt mọi page có cùng layout nội bộ.

## Top Menu
- Desktop: rõ ràng, chiều cao hợp lý.
- Mobile: ưu tiên thông tin quan trọng, phần phụ có thể thu gọn; có nút mở navigation dễ chạm.
- Settings là nơi đổi V1/V2.
- Chỉ hiển thị world/resource values khi nguồn dữ liệu thật tồn tại; không bịa số liệu.

## Left Navigation
- Desktop: ghim hoặc thu gọn; active state rõ.
- Mobile: drawer có backdrop, nút close; đóng được qua close/backdrop/Escape phù hợp; chọn page thì đóng drawer.
- Item có icon + label. Page chưa làm phải có status, không giả vờ hoàn thiện.
- Có thể nhóm item khi menu lớn dần.

## Main Page
- Page tự quản lý layout nội bộ; không sửa shell chung để giải quyết lỗi riêng của page.
- Trạng thái placeholder/loading/empty/error/ready phải dễ hiểu.
- Không kế thừa CRT, màu retro xanh lá, font hay CSS đặc thù V1.
- Không tạo giant component chứa shell và toàn bộ page.

## Responsive
- Desktop: top + sidebar + main; sidebar có thể collapse.
- Tablet: giảm mật độ phụ, giữ phân cấp.
- Mobile: navigation drawer; main chiếm chiều rộng; touch target tối thiểu 44×44 CSS px.
- Fullscreen page/viewer luôn có đường thoát nhìn thấy được.

## Page contract
Mỗi page V2 có metadata ổn định: `id`, `label`, `group/system`, `status`, `version: "v2"`, và route/component phù hợp repo. Không xây registry quá phức tạp; không hardcode menu lặp lại trong nhiều component.

## Pilot Category/Profile
Sau khi Shell sẵn sàng, dùng Valentine làm page đầu tiên; desktop + mobile trong cùng phase; đọc concept PNG trực tiếp nếu file tồn tại và mở được; chỉ load WebP thực sự có trên đĩa; asset thiếu hiển thị placeholder/archive card, không request URL chết. Các tab Overview/Story/Gear Compatibility/Gallery có ranh giới rõ. Không tái sử dụng nguyên layout/CSS V1.
