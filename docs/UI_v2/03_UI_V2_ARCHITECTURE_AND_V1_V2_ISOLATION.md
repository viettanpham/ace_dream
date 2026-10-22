# UI V2 Architecture — Dual Shells & Isolation

## Target architecture
```text
App Entry / Dispatcher
├── V1 → Existing StarfrontShell (preserve)
└── V2 → StarfrontShellV2
         ├── Top Menu
         ├── Left Navigation / Mobile Drawer
         └── Main Page Host → registered V2 page
```
Đây là đích kiến trúc. Trước khi sửa, AI Studio phải xác minh entrypoint, routing, CSS và state thật; không đoán tên file.

## Isolation
- V1 giữ nguyên giao diện/hành vi; chỉ integration point tối thiểu được duyệt để chọn version.
- V2 dùng layout, components, navigation và style tokens riêng.
- Không dùng CSS/layout V1 làm nền cho V2. Scope bằng `.sf-v2-root` và `--sf-v2-*` hoặc cơ chế tương đương.
- Không sửa/xóa các file legacy như `pilot-gallery.tsx`, `character-gear-select.tsx`, `starfront-home.tsx`, `lib/game/data.ts` khi chưa chứng minh cần thiết và chưa được duyệt.
- Có thể tái sử dụng domain/data thuần sau khi xác minh, không kéo theo style V1.

## Version preference & state continuity
- V2 mặc định cho người dùng mới.
- Settings cho phép chuyển V1/V2.
- Ưu tiên đổi shell không reload nếu an toàn; nếu cần reload, phải nêu lý do và bảo toàn state.
- Không reset save, credits/resources, inventory, gear hoặc tiến trình.
- Trước khi chọn storage key, kiểm tra key hiện có. `STARFRONT_INTERFACE_VERSION` (`v1`/`v2`) chỉ là tên đề xuất nếu chưa có key tương đương.
- Tránh lỗi hydration/SSR khi truy cập browser storage trong Next.js.
- UI version không phải gameplay/data version.

## Incremental migration
V1 chỉ hiển thị V1 screens; V2 chỉ hiển thị page V2 đã đăng ký. Không trộn screen V1 vào V2 để lấp menu. Các page chưa có dùng placeholder. Không cutover toàn bộ page cùng lúc.

## Phase boundary
Phase 1: primitives/preview, không sửa dispatcher/shell. Phase 2: shared art viewer. Phase 3: shell/navigation/version switch. Phase 4: Pilot Category/Profile. Mỗi invocation chỉ làm đúng một phase.

## State checks ở Phase 3
Kiểm tra V1/V2 preference qua reload; user mới vào V2; save/credits/resources/inventory không đổi khi switch; không có hydration/console errors mới; legacy screens vẫn hoạt động.
