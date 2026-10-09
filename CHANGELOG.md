# STARFRONT — Nhật Ký Thay Đổi (Changelog)

Toàn bộ các mốc phát triển và cập nhật kế hoạch của dự án **STARFRONT** được ghi lại tại đây theo trình tự thời gian đảo ngược (mới nhất lên đầu).

---

## [Chưa phát hành / Kế hoạch] — Lập Kế Hoạch Chi Tiết Phase 4, Phase 5 & Phase 6

*Ngày: 09/10/2026*  
*Mục tiêu phiên làm việc: Hoàn thiện tài liệu kế hoạch, phân rã milestone, KHÔNG chỉnh sửa mã nguồn ứng dụng, KHÔNG triển khai tính năng gameplay mới.*

### Thay đổi tài liệu & Lập kế hoạch:
- **Cập nhật `PROJECT_PLAN.md`**:
  - Bổ sung kế hoạch toàn diện cho **Phase 4 (Độ sâu chiến thuật & AI kẻ địch)**, **Phase 5 (Tiến trình cơ giáp & Cường hóa trang bị)**, và **Phase 6 (Mở rộng thế giới & Chiến tranh thiên hà)**.
  - Phân rã mỗi Phase thành các Milestone nhỏ, độc lập, có thứ tự thực hiện rõ ràng kèm mục tiêu, phạm vi, phụ thuộc, tiêu chí hoàn thành và phương pháp kiểm thử.
  - Đề xuất Milestone đầu tiên cho Phase 4: `Milestone 4.1 — Chuẩn hóa Hệ Thống Hiệu Ứng Trạng Thái Chiến Đấu`.
  - Quy định rõ nguyên tắc đối với tính năng nhiều người chơi (Multiplayer / Server): chỉ lập báo cáo đề xuất nghiên cứu khả thi, không tự ý triển khai backend.
- **Tạo mới `FEATURES.md`**:
  - Tổng hợp danh mục tính năng hiện có (Phase 1–3), tính năng dự kiến (Phase 4–6), phân loại rõ trạng thái thực tế (*Done*, *Planned*, *Needs Verification*).
  - Đối chiếu mã nguồn thực tế với tài liệu, ghi nhận các điểm kỹ thuật cần lưu ý (chuỗi log khởi tạo trong `engine.ts`, đồng bộ trạng thái khi chuyển tab).
- **Tạo mới `CHANGELOG.md`**:
  - Ghi nhận lịch sử các giai đoạn phát triển từ Phase 1 đến Phase 3 và đợt cập nhật kế hoạch hiện tại.
- **Bảo toàn hiện trạng**:
  - Không sửa mã nguồn gameplay hay các phân hệ Ace Manager cũ.
  - Duy trì sự tương thích của toàn bộ hệ thống.

---

## [Phase 3] — Bản Đồ Chiến Dịch, 3 Lớp Cơ Giáp & Chợ Quân Sự

*Đã hoàn thành & Đã kiểm chứng (37/37 automated tests passed)*

### Tính năng đã hoàn thành:
- **Bản đồ chiến dịch vũ trụ (Sector Campaign Map)**:
  - 3 Sector chiến lược: Vành Đai Asteroid, Tinh Vân Plasma, Pháo Đài Bastion Core.
  - 9 ải chiến đấu tuyến tính, phân tách thưởng Lần Đầu (First Clear) và thưởng Lặp Lại (Repeat Clear).
- **3 Lớp Cơ Giáp hoàn chỉnh (Gear Classes)**:
  - *Vanguard Gear*: Lớp cơ giáp đa năng cân bằng công thủ.
  - *Falcon Gear*: Tiêm kích siêu tốc (125 SPD), luôn giành quyền ra đòn trước kẻ địch. 4 kỹ năng độc quyền.
  - *Aegis Gear*: Pháo đài hạng nặng (1800 HP, 120 DEF), giáp titan siêu bền và hỏa lực hạt nhân. 4 kỹ năng độc quyền.
- **Chợ quân sự không gian (Armory Shop)**:
  - Mua sắm trang bị hiếm/sử thi bằng Credits.
  - Bán vật phẩm thừa lấy lại 60% Credits, khóa bán đối với trang bị đang gắn trên người.
- **Hiệu ứng âm thanh Sci-Fi Web Audio (`audio.ts`)**:
  - Tổng hợp âm thanh laser, xung chấn va chạm, lá chắn, chiến thắng và lên cấp không cần tệp ngoài.
  - Tích hợp nút bật/tắt âm thanh (Mute/Unmute) trên giao diện.
- **Nâng cấp lưu trữ Schema v2 (`storage.ts`)**:
  - Hỗ trợ migration tự động và an toàn từ dữ liệu v1 sang v2.

---

## [Phase 2] — Tiến Trình Nhân Vật, Cấp Độ & Kho Đồ Hangar

*Đã hoàn thành*

### Tính năng đã hoàn thành:
- **Hệ thống cấp độ & Kinh nghiệm**:
  - Cơ chế tính EXP thăng cấp và tăng chỉ số vĩnh viễn (HP, SP, ATK, DEF, SPD).
  - Tích lũy ngân sách Credits từ chiến thắng trận đấu.
- **Kho trang bị (Hangar)**:
  - 3 ô trang bị: Vũ khí chính, Khiên phòng hộ, Động cơ đẩy.
  - So sánh chỉ số trực quan khi rê chuột vào vật phẩm.
  - Tính toán chỉ số tổng hợp có tác động thực tế đến chỉ số trong trận đánh.
- **Lưu trữ dữ liệu LocalStorage**:
  - Tự động lưu tiến trình và nạp lại khi tải lại trang web.
  - Hộp thoại cảnh báo xác nhận khi thực hiện Cài lại tiến trình.

---

## [Phase 1] — Nguyên Mẫu Đấu Trường Theo Lượt (Turn-based Arena)

*Đã hoàn thành*

### Tính năng đã hoàn thành:
- **Đấu trường chiến đấu theo lượt tốc độ (Speed Initiative)**:
  - So sánh tốc độ xác định bên ra đòn trước tiên.
  - Quản lý HP (Độ bền vỏ), SP (Năng lượng lõi).
  - 3 Kỹ năng khởi đầu của Vanguard (Pulse Strike, Armor Break, Emergency Guard) và đòn đánh thường hồi SP.
- **3 Chủng loại kẻ thù với AI độc lập**:
  - Drone Trinh Sát (Scout Drone), Cơ Giáp Đột Kích (Raider Mech), Pháo Đài Công Thành (Siege Walker Boss).
- **Giao diện Sci-Fi HUD buồng lái**:
  - Bảng trạng thái máu/năng lượng, radar mục tiêu, bảng nút kỹ năng và nhật ký chiến đấu thời gian thực.
  - Tích hợp mượt mà vào bảng điều khiển Ace Manager thông qua `components/game/console.tsx`.
