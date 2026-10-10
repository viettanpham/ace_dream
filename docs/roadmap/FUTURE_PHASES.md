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

## 2. Giai Đoạn 6: Mở Rộng Thế Giới & Chiến Tranh Thiên Hà (Phase 6 — World & War Expansion)

### Milestone 6.1: Mở Rộng Bản Đồ Thiên Hà & Phe Phái (Galaxy Sectors & Faction Alignment)
- Mở rộng thêm 2 Sector chuyên sâu:
  - *Sector 4: Căn Cứ Hạm Đội Bị Bỏ Rơi (Abandoned Fleet Graveyard)* (Cấp 12–15).
  - *Sector 5: Vành Đai Sự Kiện Lỗ Đen (Singularity Event Horizon)* (Cấp 16–20).
- 2 Phe phái đối lập thiên hà (lấy cảm hứng từ ACE Online):
  - *Liên Minh Thiên Hà Bygeniou (BCU)*: Chuyên pháo tầm xa và giáp năng lượng.
  - *Quân Đội Độc Lập Arlington (ANI)*: Chuyên động cơ phản lực siêu tốc và hỏa lực bão hòa.
- Điểm danh vọng phe phái (Faction Reputation) mở khóa trang bị và danh hiệu riêng.

### Milestone 6.2: Đại Chiến Mẹ Hạm Không Gian & Dị Thường Môi Trường (Mothership Raids & Anomalies)
- Trận chiến Mẹ Hạm nhiều bộ phận: Người chơi lần lượt phá hủy *Tháp Pháo* ➔ *Động Cơ Đẩy* ➔ *Lõi Lò Phản Ứng*.
- Dị thường môi trường vũ trụ (Environmental Anomalies):
  - *Bão Bức Xạ Mặt Trời (Solar Storm)*: Giảm 20% khả năng hồi SP của cả 2 bên.
  - *Trường Điện Từ Tinh Vân (EMP Nebula)*: Giảm 15 SPD toàn chiến trường, tạo lợi thế cho cơ giáp hạng nặng.

### Milestone 6.3: Liên Kết Chiều Sâu Với Phân Hệ Ace Manager (Base Logistics & Fleet Linkage)
- Căn cứ hậu cần Ace Manager sản xuất Hợp Kim và Tinh Thể cung cấp trực tiếp cho Xưởng STARFRONT Hangar.
- Đội hình hộ tống hạm đội (Fleet Escorts) chi viện hỏa lực thụ động trong các trận chiến quy mô lớn.

### Milestone 6.4: Báo Cáo Nghiên Cứu Đấu Trường Mạng (Multiplayer & Cloud Architecture Proposal)
- **Quy định**: Chỉ lập tài liệu đề xuất nghiên cứu khả thi (Proposal Only), không tự triển khai server backend.
- Đánh giá kiến trúc Bảng Xếp Hạng Vượt Ải Bất Đồng Bộ (Asynchronous Leaderboards) vs Đấu trường thời gian thực (WebSocket).
