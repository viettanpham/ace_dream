# AI STUDIO PROMPT — STARFRONT WORLD V2 / FND-8 / 8.2.3.E.0
# DEFINE / PLAN ONLY — CHARACTER CATEGORY / PILOT PROFILE UI
# PROMPT ĐÃ ĐIỀU CHỈNH THEO CẤU TRÚC REPO HIỆN TẠI: docs/ + public/images/

## MỤC TIÊU
Audit source repository và lập kế hoạch triển khai `8.2.3.E.0 — Character Category / Pilot Profile UI Foundation`. Mục tiêu ở phase implementation sau là một UI V2 mới, sạch, chạy thử bằng dữ liệu/artwork Valentine đã duyệt, hỗ trợ DESKTOP + MOBILE đồng thời ngay từ phase đầu tiên.

## CHẾ ĐỘ BẮT BUỘC
DEFINE / PLAN ONLY. Chỉ đọc/audit repository và cập nhật tài liệu. KHÔNG viết/sửa/xóa code, không thay dependency, không triển khai UI, không tự chuyển sang IMPLEMENT. Kết thúc bằng báo cáo và DỪNG chờ người dùng duyệt. Viết bằng tiếng Việt.

## ĐỌC TÀI LIỆU THEO CẤU TRÚC REPO NÀY
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_CHARACTER_CATEGORY_PROFILE_UI_CONCEPT.md`
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_UI_REBUILD_CHECKPOINT_2026-10-22.md`
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_DEFINE_PLAN_PROMPT_2026-10-22.md`
- `docs/progress/FND8/STARFRONT_HANDOFF_FND8_2026-10-20.md`
- `docs/progress/FND8/STARFRONT_HANDOFF_FND8_2026-10-22_UI_POLICY_DELTA.md`
- `docs/progress/FND8/PILOT_CHARACTER_DATA_UI_STORY_HANDOFF.md`
- `docs/art-direction/PILOT/VALENTINE/FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md`
- `docs/art-direction/PILOT/VALENTINE/VALENTINE_ART_DEFINITION.md`
- `docs/art-direction/PILOT/VALENTINE/VALENTINE_ARTWORK_REGISTER.md`
- `docs/art-direction/PILOT/VALENTINE/valentine_assets_manifest.json`
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_CHARACTER_ROSTER_V2_DRAFT.md`
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_TRAIT_CATALOG_V2_PROPOSAL.md`
- `docs/foundations/FND8/8.2.3.E0/FND8_CHARACTER_ASSET_NAMING_V2.md`

Concept đã duyệt:
- Desktop: `docs/art-direction/UI_CONCEPTS/FND8_823_CHARACTER_CATEGORY_PROFILE_DESKTOP_APPROVED.png`
- Mobile: `docs/art-direction/UI_CONCEPTS/FND8_823_CHARACTER_CATEGORY_PROFILE_MOBILE_APPROVED.png`
- Mobile info-state: `docs/art-direction/UI_CONCEPTS/FND8_823_CHARACTER_CATEGORY_PROFILE_MOBILE_INFO_VIEW_REFERENCE.png`

Nếu file nào chưa có tại đường dẫn trên, tìm file tương đương đã tồn tại trong repo, ghi lại path thực tế và tiếp tục audit. Không nhân bản tài liệu chỉ để ép khớp tên. Không khẳng định đã xem ảnh concept nếu không mở/đọc được chúng.

## QUY TẮC UI V2
- Dựng UI V2 mới, sạch và cô lập cho Category/Profile; không vá/chắp vá hoặc lấy layout/CSS legacy làm nền.
- Audit UI cũ chỉ để hiểu routing, integration, data access, canonical registry, manifest, domain logic và viewer utility có thể tái sử dụng độc lập sau khi xác minh.
- Giữ nguyên legacy UI và shared files; không xóa/cắt route khi chưa có task cutover được duyệt.
- Desktop + mobile phải được triển khai cùng phase đầu tiên; mobile có bố cục/interaction riêng, không phải desktop thu nhỏ.
- Valentine là pilot đầu tiên. Chỉ dùng dữ liệu và artwork xác minh được trong repo.
- Hai control chuyển background/showcase phải hoạt động trên cả desktop và mobile.
- Bốn tab: `OVERVIEW`, `STORY`, `GEAR COMPAT`, `GALLERY`.
- `shortDescription` và `characterQuote` phải là hai trường riêng.
- Không bịa lore, stats, Traits, GEAR compatibility, chapter hoặc asset path.
- Chapter Valentine 01–04 APPROVED; 05–06 PROVISIONAL; 07–10 HOLD. Không hiển thị HOLD như nội dung đã phát hành.
- Không coi ảnh có trong Library/ZIP/manifest là đã nằm trong `public/images/`.
- Không tự mở rộng sang Character Selection Wizard, gameplay, balance, story writing hoặc artwork generation.
- `FND-8.3.2.x` vẫn HOLD.

## AUDIT SOURCE THẬT
1. Ghi branch, git status, framework/build commands, app entry points và route hiện tại.
2. Xác định legacy Category/Profile components/styles và shared dependencies.
3. Tìm canonical FND-1/FND-8 registries, profile/story data, manifest/register và đường dẫn ảnh.
4. Xác minh ảnh thực tế có trong `public/images/`; đối chiếu với manifest, không ghi đè/đổi tên asset.
5. Xác minh viewer capabilities và test/build commands phù hợp.
6. Không sửa code, dependency hay assets trong DEFINE/PLAN.

## DELIVERABLES
Cập nhật/tạo tài liệu tại các thư mục `docs/` phù hợp convention hiện tại:
1. Feature/UI Reference E.0.
2. Bounded implementation plan và file-change plan.
3. Valentine data-to-UI mapping.
4. Acceptance checklist và targeted test plan desktop/mobile.
5. Progress, Checkpoint và Handoff để đổi account/hết quota vẫn tiếp tục được.

Nếu chưa có file tương đương, dùng tên `FND8_8_2_3_E0_PROGRESS.md`, `FND8_8_2_3_E0_CHECKPOINT.md`, `FND8_8_2_3_E0_HANDOFF.md`. Không tạo file trùng vai trò nếu đã có canonical document.

## CHỐNG MẤT TIẾN ĐỘ
- Chia audit thành các bước nhỏ.
- Sau mỗi bước có kết quả đáng kể, cập nhật progress/checkpoint/handoff ngay.
- Checkpoint ghi scope, trạng thái DEFINE/PLAN, branch/commit nếu xác định, file đã đọc, findings đã xác minh, file đã tạo/cập nhật, blocker và next exact action.
- Handoff hướng dẫn account tiếp theo tiếp tục từ checkpoint mới nhất; không lặp lại phần đã xác minh nếu source không đổi.
- Nếu gần hết quota, lưu checkpoint tại ranh giới an toàn, nêu chính xác bước tiếp theo.
- Không lưu token/secret vào MD.

## BÁO CÁO VÀ DỪNG
Báo cáo bằng tiếng Việt:
- Findings từ repo thật.
- Concept/source/assets tìm thấy hoặc còn thiếu.
- Legacy UI dự kiến cô lập.
- File dự kiến tạo/sửa.
- Phase plan, acceptance criteria, targeted tests/build.
- Rủi ro, blocker, giả định chưa xác minh.
- Đường dẫn Progress/Checkpoint/Handoff.
Sau báo cáo: DỪNG và chờ người dùng duyệt. Không code, không tự chuyển sang IMPLEMENT.
