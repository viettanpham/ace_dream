# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0 UI REBUILD CHECKPOINT

**Ngày cập nhật:** 2026-10-22 (Asia/Ho_Chi_Minh)
**Trạng thái:** UI concept đã duyệt; chuẩn bị DEFINE/PLAN ONLY. Chưa có xác nhận implementation.
**Nguồn yêu cầu chi tiết:** `FND8_8_2_3_E0_CHARACTER_CATEGORY_PROFILE_UI_CONCEPT.md`

## Quyết định đã chốt với người dùng

1. E.0 phải hỗ trợ **desktop và mobile ngay trong cùng phase triển khai đầu tiên**.
2. Tuân thủ hai concept Category/Profile đã duyệt. Không dùng concept screenshot làm ảnh nền tĩnh; phải dựng thành component UI thật.
3. Dựng mới UI V2 sạch. Không vá/chắp vá UI cũ rối, không kế thừa nguyên CSS/layout legacy làm nền.
4. Chỉ tái sử dụng dữ liệu, artwork đã duyệt, manifest, registry hoặc domain/service nào được audit xác nhận phù hợp. UI cũ chỉ là tham khảo tích hợp; giữ nguyên và cô lập, không xóa shared code tùy tiện.
5. Dùng Valentine làm nhân vật pilot với profile/story và artwork thực tế. Không giả định Library tự đồng bộ vào repository hoặc `public/images/`.
6. Có hai điều khiển background/showcase hoạt động trên cả desktop và mobile; mobile có layout riêng, thao tác cảm ứng phù hợp.
7. Người dùng sẽ chạy thử và gửi lỗi; mỗi lỗi được ghi nhận, phân loại, cập nhật requirement/acceptance criteria khi cần, sửa theo phạm vi nhỏ và regression-test lại cả hai mode.

## Workflow bắt buộc

1. **DEFINE / PLAN ONLY:** audit repository thật; xác minh route, components, styles/tokens, dependencies, tests, data sources, Valentine files, asset manifest/paths và legacy dependencies.
2. Cập nhật E.0 Feature MD, phased plan, file-change list, risks, acceptance criteria, progress/handoff. Không sửa code trong bước này.
3. Dừng để người dùng duyệt kế hoạch.
4. Sau khi được duyệt, chạy một prompt **IMPLEMENT / RESUME ONE PHASE** cho đúng một bounded phase. Phase đầu phải tạo được bản testable có desktop + mobile cùng lúc.
5. Chạy test/build có liên quan, báo kết quả thực tế; chụp/đính kèm ảnh render thật nếu môi trường hỗ trợ. Không giả nhận test hoặc screenshot.
6. Cập nhật MD/checkpoint/handoff trước khi dừng; chờ yêu cầu tiếp theo.

## Acceptance criteria cấp cao

- Bố cục và thứ bậc thông tin bám concept desktop/mobile đã duyệt; không tự thêm bảng/panel gây rối.
- Bốn tab: `OVERVIEW`, `STORY`, `GEAR COMPAT`, `GALLERY`.
- `shortDescription` và `characterQuote` tách riêng.
- Valentine dùng dữ liệu thật và các ảnh có trong manifest/register đã xác minh.
- Hai background/showcase controls hoạt động ở cả hai mode.
- Có loading/empty/error/missing-art states rõ ràng; không broken image hoặc lore/trait/stat bịa.
- Story: 01–04 APPROVED, 05–06 PROVISIONAL, 07–10 HOLD; không hiển thị HOLD như nội dung phát hành.
- Viewer: xác minh capabilities hiện có trước khi hứa fullscreen/zoom/pan/touch gestures; implement hoặc ghi rõ giới hạn.
- Desktop và phone viewport đều được test; kiểm tra keyboard/focus và touch controls phù hợp.
- Build/tests và danh sách file thay đổi có bằng chứng thực tế; không thay đổi gameplay, Selection Wizard, hoặc FND-8.3.2.x.

## Phạm vi loại trừ

- Character Selection Wizard / character creation.
- Xóa hoặc cutover rộng UI legacy.
- Viết thêm Story, tạo/chỉnh artwork, cân bằng stats/Traits/GEAR.
- Bất kỳ implementation nào trước khi user duyệt kế hoạch DEFINE/PLAN.

## Next action

Gửi AI Studio prompt `DEFINE / PLAN ONLY` bằng tiếng Việt để audit repository và lập kế hoạch E.0 theo các file này. Chờ người dùng duyệt plan trước khi viết prompt IMPLEMENT.
