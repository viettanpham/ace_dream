# UI V2 Foundation — Implementation Roadmap

## Phase 0 — Scope & Canonical Docs
Định hướng đã được người dùng chốt; gói này chuẩn hóa hợp đồng. Không audit 11 system. Trước code, AI Studio xác minh repo và hợp nhất tài liệu UI V2 trùng.

## Phase 1 — Core UI Primitives + Isolated Preview
Tạo/hoàn thiện Button/IconButton, Panel/Card, Tabs, Tooltip, Dialog/Modal, Drawer, Feedback states; tokens V2; preview harness cô lập nếu repo cho phép. Không sửa dispatcher, shell toàn cục, Settings, save system, gameplay hoặc V1. Không thêm dependency. Build/lint/typecheck theo scripts thật. Cập nhật checkpoint/handoff.

## Phase 2 — Shared Art Viewer
Fullscreen viewer tái sử dụng: zoom in/out, mức zoom, reset, pan/drag, close luôn thấy, Escape desktop, touch/mobile behavior, giữ tỷ lệ ảnh và không broken image. Chưa làm Pilot page.

## Phase 3 — V2 Shell, Navigation & Version Switch
Top Menu + Left Navigation + Main Page host; responsive desktop/mobile; Navigation Registry; placeholder pages; Settings switch V1/V2; V2 default cho user mới; bảo toàn save/state. V1 phải regression-test.

## Phase 4 — Pilot Category/Profile V2
Dựng lại page phi công dùng Valentine: desktop + mobile trong cùng phase; concept đã duyệt là hợp đồng; Overview/Story/Gear Compatibility/Gallery; data adapter lấy nguồn canonical; chỉ load artwork WebP đã xác minh; thiếu asset thì placeholder/archive; dùng viewer Phase 2. Không viết story mới, không balance gameplay, không xóa legacy V1.

## Quy tắc thực thi
- Mỗi prompt IMPLEMENT chạy đúng một phase.
- Không tự nhảy phase.
- Nếu blocker, dừng và ghi bằng chứng; không tự suy diễn.
- Chọn test phù hợp phạm vi, tránh lặp toàn repo vô ích.
- Báo đúng lệnh đã chạy và kết quả thực tế.
