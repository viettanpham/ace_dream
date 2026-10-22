# UI V2 Design System — Modern Aerospace Sci-Fi

## Visual principles
Hiện đại, sắc nét, cao cấp, tương phản tốt. Sci-fi đến từ cấu trúc, icon và accent có chủ đích — không phủ glow mọi nơi.

Tránh: CRT/scanlines/retro green V1; chữ nhỏ để nhồi dữ liệu; card lồng nhiều tầng; glow/gradient trên mọi nút; pill/rounded shape cho tất cả; icon-only không có accessible name; dữ liệu gameplay giả.

## Tokens khởi điểm
| Token | Value | Dùng cho |
|---|---|---|
| `--sf-v2-canvas` | `#070A12` | nền chính |
| `--sf-v2-panel` | `#0F172A` | panel |
| `--sf-v2-panel-raised` | `#142338` | panel nổi |
| `--sf-v2-border` | `#26384D` | viền |
| `--sf-v2-text` | `#F1F5F9` | text chính |
| `--sf-v2-text-muted` | `#A7B6C8` | text phụ |
| `--sf-v2-accent-cyan` | `#06B6D4` | accent/focus |
| `--sf-v2-accent-teal` | `#14B8A6` | accent phụ |
| `--sf-v2-warning` | `#FBBF24` | cảnh báo |
| `--sf-v2-danger` | `#F87171` | lỗi |
| `--sf-v2-success` | `#34D399` | thành công |

Dùng namespace `sf-v2` hoặc scope trong `.sf-v2-root`. Không sửa token V1. Kiểm tra contrast thực tế, không dùng màu sắc làm tín hiệu duy nhất.

## Typography
- Body mặc định: 16px.
- Story/đoạn dài: 17–18px, line-height khoảng 1.65.
- Text phụ: tối thiểu 14px.
- Không dùng text dưới 12px.
- Dùng font stack sẵn có sau khi kiểm tra; không thêm font/dependency nếu chưa duyệt.
- Hỗ trợ tiếng Việt đầy đủ, không kế thừa kiểu chữ retro V1.
- Đoạn văn dài có giới hạn chiều rộng để dễ đọc.

## Spacing & shape
Dùng thang spacing nhất quán (ví dụ 4/8/12/16/24/32px); radius có chủ đích; border tinh tế; glow chỉ cho focus/active; tránh nested cards vô nghĩa. Có quy ước z-index cho shell, dropdown, drawer, modal, fullscreen.

## Accessibility & components
- Touch target tối thiểu 44×44 CSS px.
- Focus bàn phím nhìn thấy; disabled/loading/error phân biệt rõ.
- Dialog/drawer có close control rõ, hỗ trợ Escape khi phù hợp.
- Animation có mục đích và tôn trọng `prefers-reduced-motion`.
- Components dự kiến: Button/IconButton, Panel/Card, Tabs, Tooltip, Dialog/Modal, Drawer, Feedback states.
- Chỉ dùng/tạo component sau khi kiểm tra library hiện có; không thêm dependency.

## Artwork viewer (phase riêng)
Fullscreen; zoom in/out và mức zoom; reset; pan/drag khi phóng to; nút close luôn thấy; Escape desktop; touch-friendly trên mobile; giữ tỷ lệ ảnh; chỉ dùng URL đã xác minh; asset thiếu dùng placeholder, không gây 404.
