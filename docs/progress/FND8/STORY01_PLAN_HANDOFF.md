# STARFRONT WORLD V2 — CHECKPOINT & HANDOFF
## STORY-01: IMMERSIVE STORY READER + STORY PUBLICATION MANAGER (PLAN / DEFINE ONLY)

- **Mã Checkpoint:** `STORY01-PLAN-01` (Nối tiếp sau `FND8-HANDOFF-14`)
- **Dự án:** `viettanpham/ace_dream`
- **Thời điểm:** 2026-10-23
- **Chế độ:** **PLAN / DEFINE ONLY**
- **Trạng thái:** **HOÀN THÀNH LẬP KẾ HOẠCH & ĐẶC TẢ KIẾN TRÚC — DỪNG ĐÚNG ĐIỂM HẸN CHỜ DUYỆT**
- **Ngôn ngữ:** 100% Tiếng Việt

---

### 1. CÔNG VIỆC ĐÃ HOÀN THÀNH TRONG LƯỢT NÀY
1. **Audit thực tế toàn diện mã nguồn Story & Backend Persistence:**
   - Đã kiểm tra `lib/game/v2/character-profile-data.ts`, `components/game/v2/pilot-profile/tabs/story-tab.tsx`, `app/api/admin/asset-version/route.ts`, và `docs/progress/FND8/PILOT_CHARACTER_DATA_UI_STORY_HANDOFF.md`.
   - Xác định chính xác: Chỉ có Valentine Chương 01 có toàn văn (Prose Full Body); Valentine Chương 02–04 chỉ có tóm tắt; Chương 05–06 là tạm thời; Chương 07–10 là HOLD niêm phong. 11 Pilot còn lại chưa có văn xuôi toàn văn.
2. **Xây dựng Bản thiết kế kiến trúc chuẩn hóa:**
   - Ban hành tài liệu canonical: `/docs/systems/STORY01_IMMERSIVE_READER_PUBLICATION_PLAN.md`.
   - Đặc tả kiến trúc 3 tầng: Dossier Story Preview → Immersive Story Reader (3 cột Desktop / 1 cột Mobile) → AdminCP Story Publication Manager.
   - Đặc tả cơ chế Scroll-Driven Anchor Artwork bằng `IntersectionObserver`.
   - Thiết kế lược đồ cấu hình xuất bản runtime bền vững không cần rebuild ứng dụng Next.js.
   - Thiết lập 4 rào cản kiểm duyệt an toàn (Security & Editorial Gates).
3. **Lập lộ trình 4 phân kỳ triển khai khả thi:**
   - `STORY-01.A`: Data Schema, Persistence Store & Admin API.
   - `STORY-01.B`: Immersive Story Reader UI (Desktop & Mobile).
   - `STORY-01.C`: AdminCP Story Publication Manager Matrix.
   - `STORY-01.D`: Rollout Pilot Valentine & E2E Validation.

---

### 2. TÌNH TRẠNG MÃ NGUỒN & HỆ THỐNG
- **Mã nguồn tính năng (Runtime Code):** Được giữ nguyên 100%, không phát sinh lỗi hoặc thay đổi ngoài phạm vi.
- **V2 App Shell & Character Category:** Ổn định, nguyên vẹn.
- **Kiểm thử tự động:** Bảo đảm sẵn sàng cho các giai đoạn tiếp theo.

---

### 3. BƯỚC TIẾP THEO (KHI CHỦ DỰ ÁN DUYỆT KẾ HOẠCH)
1. Nhận phản hồi/chấp thuận bản thiết kế `STORY01_IMMERSIVE_READER_PUBLICATION_PLAN.md`.
2. Khởi động **Phase STORY-01.A** (Triển khai tầng dữ liệu và API cấu hình xuất bản độc lập).
