# AI STUDIO PROMPT — STARFRONT WORLD UI V2 FOUNDATION
## IMPLEMENT / RESUME ONE PHASE ONLY — PHASE 1: CORE UI PRIMITIVES + ISOLATED PREVIEW

### Mục tiêu
Triển khai **duy nhất Phase 1** theo tài liệu canonical `docs/UI_v2/`. Tạo bộ UI primitives V2 dùng chung và preview harness cô lập. Không phải yêu cầu audit hoặc hoàn thành đủ 11 system.

### Bắt buộc đọc trước
Đọc toàn bộ file:
- `docs/UI_v2/README_UI_V2_FOUNDATION.md`
- `docs/UI_v2/01_UI_V2_FOUNDATION_SCOPE_AND_PAGE_CONTRACT.md`
- `docs/UI_v2/02_UI_V2_DESIGN_SYSTEM.md`
- `docs/UI_v2/03_UI_V2_ARCHITECTURE_AND_V1_V2_ISOLATION.md`
- `docs/UI_v2/04_UI_V2_NAVIGATION_REGISTRY_AND_PAGE_STATUS.md`
- `docs/UI_v2/05_UI_V2_IMPLEMENTATION_ROADMAP.md`
- `docs/UI_v2/06_UI_V2_PROGRESS_CHECKPOINT_HANDOFF.md`

Nếu có `docs/foundations/UI_V2/` hoặc bộ UI V2 tương tự, hãy đọc và đối chiếu để hợp nhất; không bỏ qua bộ docs/UI_v2/ mới và không để hai source-of-truth cạnh tranh.

### Chế độ
`IMPLEMENT / ONE BOUNDED PHASE ONLY`. Chỉ Phase 1. Không tự chuyển Phase 2–4, không làm Pilot Category, không sửa gameplay, không viết lại V1.

### Safety audit — phạm vi hẹp
1. Xác minh framework, thư mục source, CSS entrypoint, package scripts, dependencies/component libraries hiện có.
2. Chỉ audit những phần cần thiết cho Phase 1; **không audit toàn bộ 11 system**.
3. Kiểm tra component tương tự trước khi tạo mới, tránh nhân đôi mù quáng.
4. Trước khi sửa, báo/ghi danh sách file sẽ tạo/sửa và lý do.
5. Không thêm/thay dependency, không xóa file, không sửa save schema/gameplay.
6. Không sửa `app/page.tsx`, dispatcher/shell toàn cục, Settings, V1 components hoặc route mặc định trong Phase 1. Nếu preview cần route, chỉ tạo route cô lập `/ui-v2-preview` khi an toàn; không thay route chính.
7. Không dùng CSS/layout/font/theme V1 làm nền. Scope style bằng `.sf-v2-root` và `--sf-v2-*` hoặc cơ chế cô lập tương đương.
8. Không tuyên bố đã đọc concept PNG nếu file không thực sự tồn tại và mở được; Phase 1 không phụ thuộc concept Pilot Category.

### Được phép triển khai
Tạo/hoàn thiện primitives trong `components/game/v2/ui/` (hoặc vị trí phù hợp cấu trúc repo đã xác minh):
- Button/IconButton;
- Panel/Card;
- Tabs;
- Tooltip;
- Dialog/Modal;
- Drawer;
- Feedback: loading/empty/error/success.
Tạo tokens V2 tối thiểu và preview harness cô lập để xem variants/states ở desktop/mobile. Dùng thư viện hiện có nếu phù hợp; không cài dependency mới. Preview không phải gameplay page và không được đăng ký là system production hoàn thiện.

### Tiêu chí UI
Modern Aerospace Sci-Fi; navy/cyan/teal tiết chế; body 16px, phụ tối thiểu 14px, không dưới 12px; touch target 44×44 CSS px; focus rõ; keyboard accessible phù hợp; dialog/drawer có close control rõ; không nested-card rườm rà, không glow khắp nơi, không CRT/scanlines; responsive không tràn ngang; tôn trọng `prefers-reduced-motion` nếu có animation.

### Test và tài liệu
- Đọc scripts thật rồi chạy lint/typecheck/build phù hợp repo.
- Ghi đúng lệnh và kết quả; không báo pass giả.
- Kiểm tra V1 không đổi style/route mặc định và preview không gây lỗi SSR/hydration nếu có route.
- Cập nhật `docs/UI_v2/06_UI_V2_PROGRESS_CHECKPOINT_HANDOFF.md`; cập nhật progress/checkpoint/handoff hiện có hoặc liên kết về canonical, tránh tạo bản trùng vô ích.
- Ghi files tạo/sửa, test, cách mở preview, lỗi còn lại và xác nhận Phase 2 chưa chạy.

### Kết thúc
Dừng ngay sau Phase 1. Báo cáo tiếng Việt gồm: kết quả, file thay đổi, lệnh test/kết quả, cách mở preview, blocker còn lại và xác nhận chưa chạy Phase 2.
