# STARFRONT — Lộ Trình Các Giai Đoạn Tương Lai (Future Phases Roadmap)

Tài liệu tóm tắt các tính năng và phân hệ dự kiến triển khai sau Phase 5.8.

---

## 1. Hoàn Thiện Hệ Thống Mô-Đun Kỹ Năng Độc Lập (Phase 5.7 Full Backend & Loot)
*Mục tiêu: Đưa các mô-đun kỹ năng rời rạc vào kho đồ và cho phép tùy biến sâu bộ 5 kỹ năng chiến đấu.*
- **Phạm vi**:
  - Vật phẩm Mô-Đun Kỹ Năng trong kho đồ (`SkillModuleItem`) với 4 bậc phẩm chất (Common, Rare, Epic, Legendary).
  - Cho phép tháo lắp, thay thế mô-đun vào Slot 1 (Basic) và Slot 2–4 (Active) theo đúng quy tắc tương thích (tối đa 2 All-Gear).
  - Hệ thống nâng cấp cấp độ Ô (Slot-Bound Upgrades) sử dụng Điểm Kỹ Năng Phi Cơ (`slotLevels: Record<1|2|3|4|5, number>`).
  - Lớp Cơ Giáp Thứ Tư: **Specter — Tactical Support** (Hỗ trợ tác chiến điện tử, phân tích điểm yếu kẻ địch, hệ thống sạc Tactical Charge).
- **Phụ thuộc**: Hoàn thành Phase 5.8 (Khung Character & Gear).

---

## 2. Giai Đoạn 6: Mở Rộng Thế Giới & Chiến Lược Thiên Hà (STARFRONT WORLD — Active Roadmap)

### Phase 6.31: Điều Phối Nhiệm Vụ & Hộp Lưu Trữ Tác Chiến (Mission Dispatch & Operations Archive)
- **Trạng thái**: **Kế hoạch (Planned / Chưa triển khai)**.
- **Phạm vi**:
  - Người chơi chỉ trực tiếp tham gia tối đa một nhiệm vụ tại một thời điểm.
  - Nhiệm vụ ở pha PREPARE có thể tiếp tục nhận lực lượng tham gia; khi hết giờ PREPARE mà người chơi không tham gia, NPC cấp phó/đồn trú sẽ tự động tiếp quản để nhiệm vụ tiếp diễn.
  - Mô phỏng đầy đủ các nhiệm vụ do NPC điều phối và ghi nhận kết quả thực tế.
  - Hệ thống Objective chuẩn hóa tái sử dụng cho 6 hình thái: Patrol, Escort, Defend, Raid, Eliminate, Threat Containment.
  - Operations Archive lưu trữ kết quả nhiệm vụ/event và kết quả chiến đấu với dung lượng và quota riêng biệt; nhật ký xác thực không tạo dữ liệu giả.

### Combat V2 Review: Đánh Giá & Thiết Kế Kiến Trúc Combat V2 (Architectural Review)
- **Trạng thái**: **Thiết kế (Design Only / Chưa triển khai)**.
- **Tài liệu**: Chi tiết tại `docs/roadmap/COMBAT_V2_REVIEW.md`.
- **Phạm vi**: Đánh giá kiến trúc quy mô chiến đấu (unit, squad 3-4 GEARs, fleet, strategic garrison), quan hệ quân số - HP - lực chiến, động lực học khi một GEAR bị loại, 5 trạng thái tổn thất quân số, bổ trợ công sự/pháo hạm, mô phỏng tự động khi vắng người chơi, khế ước tích hợp WORLD và kế thừa hệ thống status/initiative/synergy từ Combat V1.

### Phase 6.32: Tình Báo Tuyến Đường & Nhật Ký Hành Động (Route Intelligence & Action Logs)
- **Trạng thái**: **Kế hoạch (Planned / Chưa triển khai)**.
- **Phạm vi**:
  - Route cards hiển thị trực quan: Điểm đi $\rightarrow$ Hyperlane $\rightarrow$ Điểm đến.
  - Route Detail Modal với đầy đủ thông số ID, 2 đầu sector, trạng thái, thời gian di chuyển, mức độ nguy hiểm và dữ liệu quân sự/hậu cần.
  - Nút focus route tự động căn giữa và làm nổi bật tuyến trên bản đồ.
  - Nhật ký hành động từng tuyến (FIFO Action Logs) trần 100 bản ghi thay đổi trạng thái thực tế, cho phép cấu hình quota trong AdminCP.

---

## 3. Các Cột Mốc Mở Rộng Dài Hạn (Long-term Strategic Milestones)
- **Milestone 6.33+**: Đại Chiến Mẹ Hạm Không Gian (Mothership Raids), Tháp Pháo $\rightarrow$ Động Cơ $\rightarrow$ Lõi Lò Phản Ứng.
- **Liên Kết Sâu Với Ace Manager**: Căn cứ hậu cần sản xuất Hợp Kim và Tinh Thể cho Xưởng Hangar.
- **Nghiên Cứu Đấu Trường Mạng (Proposal Only)**: Đánh giá kiến trúc Bảng Xếp Hạng Bất Đồng Bộ vs Đấu trường thời gian thực.

