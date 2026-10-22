# AI STUDIO PROMPT — STARFRONT WORLD V2 / FND-8 / 8.2.3.E.0
# DEFINE / PLAN ONLY — CHARACTER CATEGORY / PILOT PROFILE UI

## Mục tiêu
Audit source repository và lập kế hoạch triển khai `8.2.3.E.0 — Character Category / Pilot Profile UI Foundation`. Mục tiêu triển khai ở phase sau là một UI V2 mới, chạy thử bằng dữ liệu và artwork Valentine đã duyệt, hỗ trợ DESKTOP + MOBILE đồng thời ngay từ phase implementation đầu tiên.

## Chế độ bắt buộc: DEFINE / PLAN ONLY
Chỉ đọc/audit repository và cập nhật tài liệu định nghĩa/kế hoạch/checkpoint. KHÔNG viết/sửa/xóa source code, không thay đổi dependency, không triển khai UI, không refactor legacy, không tự chuyển sang IMPLEMENT. Kết thúc bằng báo cáo và DỪNG chờ người dùng duyệt plan. Viết tài liệu và phản hồi bằng tiếng Việt.

## Đọc trước các file được cung cấp
- `STARFRONT_WORLD/FND8_8_2_3_E0_CHARACTER_CATEGORY_PROFILE_UI_CONCEPT.md`
- `STARFRONT_WORLD/FND8_8_2_3_E0_UI_REBUILD_CHECKPOINT_2026-10-22.md`
- `STARFRONT_WORLD/STARFRONT_HANDOFF_FND8_2026-10-20.md`
- `STARFRONT_WORLD/STARFRONT_HANDOFF_FND8_2026-10-22_UI_POLICY_DELTA.md`
- `STARFRONT_WORLD/PILOT_CHARACTER_DATA_UI_STORY_HANDOFF.md`
- `STARFRONT_WORLD/FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md`
- `STARFRONT_WORLD/PILOT/VALENTINE/VALENTINE_ART_DEFINITION.md`
- `STARFRONT_WORLD/PILOT/VALENTINE/VALENTINE_ARTWORK_REGISTER.md`
- `STARFRONT_WORLD/PILOT/VALENTINE/valentine_assets_manifest.json`
- `STARFRONT_WORLD/FND8_8_2_3_CHARACTER_ROSTER_V2_DRAFT.md`
- `STARFRONT_WORLD/FND8_8_2_3_TRAIT_CATALOG_V2_PROPOSAL.md`
- `STARFRONT_WORLD/FND8_CHARACTER_ASSET_NAMING_V2.md`

Nếu repo dùng đường dẫn khác, tìm đúng file hiện có, ghi lại đường dẫn thực tế và không nhân bản tài liệu vô ích.

## Concept đã duyệt — bắt buộc đối chiếu trực tiếp
- Desktop: `STARFRONT_WORLD/UI_CONCEPTS/FND8_823_CHARACTER_CATEGORY_PROFILE_DESKTOP_APPROVED.png`
- Mobile: `STARFRONT_WORLD/UI_CONCEPTS/FND8_823_CHARACTER_CATEGORY_PROFILE_MOBILE_APPROVED.png`
- Mobile info-state reference: `STARFRONT_WORLD/UI_CONCEPTS/FND8_823_CHARACTER_CATEGORY_PROFILE_MOBILE_INFO_VIEW_REFERENCE.png`

Concept là chuẩn tối thiểu về bố cục, thứ bậc thông tin và hành vi. Không dùng screenshot làm background tĩnh thay UI thật. Không tự thêm panel, chữ, decoration hoặc thông tin khiến màn hình rối. Nếu không đọc được concept trong IDE, ghi rõ; không giả vờ đã so sánh.

## Quy tắc UI V2 mới
- Dựng một Category/Profile UI V2 mới, sạch và cô lập. Không vá/chắp vá, bọc ngoài hoặc kế thừa nguyên layout/CSS của legacy UI đang rối làm nền.
- Audit UI cũ chỉ để hiểu routing/integration, data access, canonical registries, asset manifest, domain logic và viewer utility nào có thể tái sử dụng độc lập sau khi xác minh.
- Không xóa hay phá route/shared files legacy; giữ nguyên và cô lập cho tới khi có task cutover riêng được duyệt.
- Desktop + mobile phải cùng nằm trong phase implementation đầu tiên. Mobile có bố cục và interaction riêng, không phải desktop thu nhỏ.
- Valentine là pilot đầu tiên. Chỉ dùng dữ liệu và artwork đã xác minh trong repo; file Library không có nghĩa là đã nằm trong source.
- Có hai control chuyển background/showcase cho nhân vật ở cả desktop và mobile; phải hoạt động thật, mobile compact/touch-friendly.
- Bốn tab: `OVERVIEW`, `STORY`, `GEAR COMPAT`, `GALLERY`. `shortDescription` và `characterQuote` là hai trường riêng.
- Không bịa lore, stats, Traits, GEAR compatibility, story chapters hoặc đường dẫn ảnh. Không có asset thì dùng placeholder/fallback có kiểm soát, không broken image.
- Chapter Valentine: 01–04 APPROVED; 05–06 PROVISIONAL; 07–10 HOLD. Không trình bày HOLD như nội dung đã phát hành.
- Chỉ đưa fullscreen/zoom/pan/touch gesture vào plan sau khi audit khả năng hiện có hoặc xác định effort bounded.
- `FND-8.3.2.x` vẫn HOLD. Không mở rộng sang Character Selection Wizard, tạo nhân vật, gameplay, balance stats/Traits, viết story mới hoặc tạo artwork.

## Audit repository thực tế
1. Ghi branch, git status, framework/build commands, entry points và route đang hoạt động.
2. Xác định chính xác legacy Category/Profile routes/components/styles và shared dependencies; đề xuất cách cô lập.
3. Tìm canonical FND-1/FND-8 class registry, stats/Traits schema, profile/story source, manifest/register và file ảnh; phân biệt file tồn tại trong repo với file chỉ có trong tài liệu.
4. Xác minh từng ảnh được UI cần dùng tồn tại trong `public/images/` và tên trùng manifest; không coi file có trong ZIP hoặc Library là đã import.
5. Audit test/build commands phù hợp. Không chạy full regression không cần thiết trong bước DEFINE/PLAN.
6. Không thay đổi code hoặc assets.

## Deliverables bắt buộc
Cập nhật/tạo các tài liệu ở vị trí canonical hiện có (ưu tiên `STARFRONT_WORLD/` trong repo, tránh tạo nhiều bản sao):
1. Feature/UI Reference E.0 gắn đúng ba concept, scope, data mapping, responsive behavior, state, acceptance criteria.
2. Implementation plan bounded, chia phase nhỏ. Phase implementation đầu phải có desktop + mobile cùng lúc.
3. File-change plan: file tạo/sửa, legacy files giữ nguyên/cô lập, data/asset mapping, dependencies/rủi ro.
4. Acceptance checklist + targeted test plan cho desktop, phone, 2 background controls, 4 tab, gallery/viewer, keyboard/focus/touch, empty/loading/error, asset/data accuracy, tests/build.
5. `E0_PROGRESS.md`, `E0_CHECKPOINT.md`, `E0_HANDOFF.md` (dùng tên tương đương theo convention repo nếu đã có), có trạng thái, files examined/changed, quyết định đã duyệt, blocker, next exact action.

## BẮT BUỘC CHO HẾT TOKEN / ĐỔI ACCOUNT
- Chia công việc thành các bước audit nhỏ. Sau mỗi bước có kết quả đáng kể, cập nhật progress/checkpoint/handoff ngay, không chờ đến cuối.
- Checkpoint phải nêu: scope đang làm, trạng thái DEFINE/PLAN, repo branch/commit nếu xác định được, file đã đọc, findings đã xác minh, file đã tạo/cập nhật, câu hỏi còn mở, việc đã hoàn tất và việc CHƯA làm.
- Handoff phải có hướng dẫn tiếp tục chính xác từ checkpoint gần nhất; người/account tiếp theo đọc checkpoint trước, tiếp tục phần còn lại, KHÔNG làm lại phần đã xác minh trừ khi source thay đổi.
- Không báo hoàn tất nếu thiếu deliverable. Nếu sắp hết quota, dừng tại ranh giới an toàn, lưu checkpoint và nêu đúng bước kế tiếp.
- Không ghi credential, token, secret hay dữ liệu cá nhân vào MD.

## Báo cáo cuối và điều kiện dừng
Báo cáo bằng tiếng Việt:
- Findings đã xác minh từ repository.
- Concept và source/assets thực tế đã tìm thấy/thiếu.
- File dự kiến tạo/sửa và legacy UI sẽ cô lập.
- Phase plan bounded, acceptance criteria, targeted tests/build.
- Risks/blockers và mọi giả định chưa xác minh.
- Đường dẫn chính xác tới Feature MD, Progress, Checkpoint, Handoff.
Sau báo cáo: DỪNG. Không code và không tự chuyển sang IMPLEMENT; chờ người dùng duyệt plan.
