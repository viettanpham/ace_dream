# STARFRONT WORLD — UI V2 FOUNDATION
Ngày: 2026-10-22 | Trạng thái: `FOUNDATION_DIRECTION_APPROVED`

## Mục tiêu
Tạo một Shared UI Foundation V2 thống nhất cho các system/page, sau đó mở rộng theo từng feature. **Không audit hoặc hoàn thành cả 11 system trong một lần.** Luồng UI chạy song song với FND-8 / 8.2.3.x, không thay thế tiến độ gameplay.

## Quyết định đã chốt
- V1 và V2 là hai trải nghiệm độc lập. V1 giữ nguyên; V2 có layout, tokens, components và navigation riêng.
- V2 mặc định cho người dùng mới; Settings cho phép chuyển V1/V2 khi Phase 3 được triển khai.
- Shared Shell gồm Top Menu + Left Navigation + Main Page.
- Desktop và mobile được hỗ trợ ngay từ đầu. Mobile có menu trigger/drawer riêng, không chỉ thu nhỏ desktop.
- Phong cách V2: Modern Aerospace Sci-Fi, hiện đại, rõ ràng, navy sâu với cyan/teal tiết chế; không CRT/scanlines/retro green của V1.
- Typography ưu tiên dễ đọc: body 16px, story 17–18px, text phụ tối thiểu 14px, không dùng chữ dưới 12px.
- Registry quản lý menu/page và trạng thái `placeholder`, `in_progress`, `ready`, `hold`.
- Pilot Category/Profile dùng Valentine làm page thử nghiệm đầu tiên sau khi Foundation/Shell sẵn sàng; concept desktop/mobile đã duyệt là hợp đồng UI bắt buộc.
- Không xóa legacy V1, không sửa gameplay/save schema, không tự thêm dependency.

## Source of truth
Thư mục canonical: `docs/UI_v2/`. Nếu `docs/foundations/UI_V2/` hoặc tài liệu UI V2 tương tự đã tồn tại, AI Studio phải đối chiếu/hợp nhất, không để hai bộ định nghĩa cạnh tranh nhau. Giữ lịch sử cần thiết, đánh dấu tài liệu cũ `SUPERSEDED` hoặc trỏ về bản canonical; không xóa tùy tiện.

## Scope
Trong scope: primitives, Design System, Shell/navigation, version switch, shared artwork viewer, rồi Pilot Category/Profile.
Ngoài scope: audit/hoàn thành 11 system, gameplay/balance, story writing, artwork generation, xóa V1 hoặc tái thiết kế V1.

## Bộ tài liệu
1. `01_UI_V2_FOUNDATION_SCOPE_AND_PAGE_CONTRACT.md`
2. `02_UI_V2_DESIGN_SYSTEM.md`
3. `03_UI_V2_ARCHITECTURE_AND_V1_V2_ISOLATION.md`
4. `04_UI_V2_NAVIGATION_REGISTRY_AND_PAGE_STATUS.md`
5. `05_UI_V2_IMPLEMENTATION_ROADMAP.md`
6. `06_UI_V2_PROGRESS_CHECKPOINT_HANDOFF.md`
7. `PROMPT_IMPLEMENT_PHASE_1_CORE_UI_PRIMITIVES.md`

Khi hết quota, cập nhật checkpoint/handoff với phase, files, tests thực tế, lỗi còn lại và bước tiếp theo. Không ghi DONE nếu chưa test.
