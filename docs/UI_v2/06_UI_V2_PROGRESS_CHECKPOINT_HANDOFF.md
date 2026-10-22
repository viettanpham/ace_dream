# UI V2 Foundation — Progress / Checkpoint / Handoff
Ngày cập nhật: 2026-10-22  
Trạng thái: `PHASE_1_COMPLETE / PREVIEW_VERIFIED / PHASE_2_NOT_STARTED`

## Quyết định đã chốt & Thực thi
- Shared UI Foundation V2 dùng chung; triển khai theo từng phase cô lập.
- Phase 1 hoàn tất toàn bộ bộ UI primitives dùng chung và trang preview độc lập.
- V1 giữ nguyên 100%: không sửa `app/page.tsx`, không sửa dispatcher/shell, không sửa gameplay hay save schema.
- Toàn bộ phong cách V2 là Modern Aerospace Sci-Fi: nền navy sâu, cyan/teal accent, không CRT scanlines hay retro green.
- Tuân thủ nghiêm ngặt tiêu chuẩn ergonomics: Touch target tối thiểu 44×44px, text body 16px, text phụ $\ge 14\text{px}$, không có text $< 12\text{px}$.

## Phase Status Matrix
| Phase | Status | Ghi chú |
|---|---|---|
| 0 — Scope & Canonical Docs | `APPROVED_DIRECTION` | Canonical package tại `docs/UI_v2/` |
| 1 — Core UI Primitives + Isolated Preview | `COMPLETE` | Bộ primitives tại `components/game/v2/ui/` + preview tại `/ui-v2-preview` |
| 2 — Shared Art Viewer | `NOT_STARTED` | Chưa kích hoạt, chờ chỉ thị tiếp theo |
| 3 — V2 Shell, Navigation & Version Switch | `NOT_STARTED` | Chưa kích hoạt |
| 4 — Pilot Category/Profile V2 | `NOT_STARTED` | Chưa kích hoạt |

## Danh sách File đã tạo và cập nhật ở Phase 1

### File mới tạo (Primitives V2):
1. `components/game/v2/ui/tokens.ts`: Hằng số theme V2, bảng màu Modern Aerospace Sci-Fi, quy ước typography & touch targets.
2. `components/game/v2/ui/button.tsx`: `Button` (5 variants: primary, secondary, outline, ghost, destructive; 3 sizes sm/md/lg; loading spinner; disabled) & `IconButton` (44×44px touch target, aria-label bắt buộc).
3. `components/game/v2/ui/card.tsx`: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` (3 surface variants: panel, raised, interactive; viền hairline mỏng, độ sâu 1 cấp).
4. `components/game/v2/ui/tabs.tsx`: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` (variants: segmented & underline; điều hướng phím mũi tên Left/Right/Home/End; touch target 44px).
5. `components/game/v2/ui/tooltip.tsx`: `Tooltip` nổi hỗ trợ trigger hover + keyboard focus, đóng bằng Escape, tương thích React 19.
6. `components/game/v2/ui/dialog.tsx`: `Dialog` modal với backdrop mờ, tiêu đề, mô tả, nút đóng X 44×44px, Escape key listener, chặn cuộn nền.
7. `components/game/v2/ui/drawer.tsx`: `Drawer` bảng trượt (bottom/side sheet) có thanh gạt touch-friendly, nút đóng X, Escape key listener.
8. `components/game/v2/ui/feedback.tsx`: `LoadingState`, `EmptyState`, `ErrorState`, `SuccessState` với icon Lucide rõ ràng, độ tương phản cao, nút hành động khôi phục.
9. `components/game/v2/ui/index.ts`: Barrel export cho toàn bộ thư viện UI V2 primitives.

### File mới tạo (Preview Harness):
10. `app/ui-v2-preview/page.tsx`: Trang kiểm thử độc lập `/ui-v2-preview` với bộ chuyển đổi viewport simulator (Responsive / Mobile 390px / Tablet 768px / Desktop 1440px), hiển thị đầy đủ mọi variant và tương tác của primitives, có nút quay về V1 tại `/`.

### File cập nhật:
11. `app/globals.css`: Bổ sung scoped CSS selector `.sf-v2-root` và các biến CSS `--sf-v2-*`. Giữ nguyên 100% token và CSS của V1.

## Kết quả Kiểm tra (Test Execution & Verification)
1. **Lint / Typecheck (`npm run lint` -> `tsc --noEmit`)**:
   - Lệnh: `npm run lint`
   - Kết quả: **PASSED (0 errors)**.
2. **Production Build (`compile_applet` -> `NODE_ENV=production next build`)**:
   - Lệnh: `compile_applet`
   - Kết quả: **Build succeeded - the applet is compiled**. Route `/ui-v2-preview` được biên dịch thành công dưới dạng Dynamic Server-rendered / Client-hydrated page.
3. **Kiểm tra độ cô lập V1**:
   - `app/page.tsx` và `components/game/starfront-shell.tsx` hoàn toàn không bị chỉnh sửa.
   - Khi vào URL mặc định `/`, người dùng vẫn trải nghiệm giao diện Starfront V1 nguyên vẹn.
4. **Kiểm tra cách truy cập Preview**:
   - Truy cập URL `/ui-v2-preview` trên dev server để xem toàn bộ component V2.

## Lỗi còn lại (Blockers / Remaining Issues)
- **Không có blocker nào**. Phase 1 đã hoàn thành đầy đủ, biên dịch sạch và độc lập tuyệt đối.

## Xác nhận Biên giới Phase
- **Xác nhận**: Phase 2 (Shared Art Viewer) **CHƯA ĐƯỢC TRIỂN KHAI** (`PHASE_2_NOT_STARTED`).
- Dừng ngay theo đúng cam kết giới hạn phạm vi nhiệm vụ của Phase 1.
