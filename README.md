# STARFRONT

**STARFRONT** là tựa game nhập vai chiến thuật theo lượt 2D (Turn-based RPG) lấy bối cảnh khoa học viễn tưởng không gian, mang đậm phong cách cơ giáp chiến đấu lấy cảm hứng từ *ACE Online*. Game được xây dựng hoàn toàn với nội dung sáng tạo nguyên bản (original IP) chạy trực tiếp trên trình duyệt.

---

## 🌟 Tính Năng Đã Triển Khai (Features Completed)

### 1. Đấu Trường Cơ Giáp Theo Lượt (Phase 1 — Combat Arena)
- Đấu trường chiến thuật theo lượt tốc độ (Speed Initiative) thời gian thực.
- Đầy đủ hệ thống sát thương Công/Thủ, giảm giáp phòng hộ, lá chắn năng lượng và AI kẻ địch tự động.
- 3 Chủng loại kẻ thù với AI độc lập: Drone Trinh Sát (tốc độ cao), Cơ Giáp Đột Kích (áp sát dồn dame), và Pháo Đài Công Thành (Trùm trâu máu, pháo bão hòa).

### 2. Tiến Trình Nhân Vật & Kho Đồ (Phase 2 — Character Progression & Inventory)
- Hệ thống Level, EXP và ngân sách Credits tăng trưởng minh bạch.
- Thăng cấp tăng vĩnh viễn chỉ số cốt lõi (HP, SP, ATK, DEF, SPD).
- Xưởng trang bị Vanguard Hangar với 3 vị trí (Vũ khí, Khiên chắn, Động cơ đẩy) và cơ chế xem trước so sánh chỉ số.
- Tự động lưu tiến trình LocalStorage, tự phục hồi khi tải lại trang, nút xóa save an toàn có xác nhận.

### 3. Chiến Dịch Vũ Trụ, 3 Lớp Gear & Chợ Quân Sự (Phase 3 — Missions, Gears & Shop)
- **Bản đồ chiến dịch vũ trụ (Sector Campaign Map)**: 3 Sector (Vành Đai Asteroid, Tinh Vân Plasma, Bastion Core) với 9 tuyến ải mở khóa tuần tự, phân biệt thưởng Lần Đầu (First Clear) và thưởng Lặp Lại (Repeat Clear).
- **3 Lớp Cơ Giáp điều khiển**:
  - *Vanguard Gear*: Đa năng, cân bằng công thủ (Balanced Striker).
  - *Falcon Gear*: Tiêm kích siêu tốc (125 SPD ra đòn trước tiên), né tránh cao (Speed Infiltrator).
  - *Aegis Gear*: Pháo đài bọc thép titan hạng nặng (1800 HP), hỏa lực pháo hạt nhân (Heavy Siege Fortress).
- **Chợ quân sự không gian (Armory Shop)**: Mua sắm trang bị hiếm/sử thi và bán vật phẩm thừa trong kho bằng Credits.
- **Hệ thống âm thanh Web Audio Sci-Fi**: Âm thanh laser, va chạm xung chấn, lá chắn, chiến thắng và thăng cấp kèm nút Bật/Tắt âm thanh tiện lợi.
- **Lưu trữ chuẩn hóa Schema v2**: Tự động chuyển đổi dữ liệu từ v1 sang v2 an toàn 100%.

---

## 🛠 Công Nghệ Sử Dụng (Technology Stack)

- **Ngôn ngữ & Nền tảng**: TypeScript, React 19, Next.js.
- **Tạo kiểu & Giao diện**: Tailwind CSS, Lucide Icons.
- **Kiến trúc**: Module hóa tách biệt giữa logic luật chơi (`lib/game/`), dữ liệu tĩnh (`lib/game/data.ts`), và giao diện buồng lái (`components/game/`).
- **Ngôn ngữ hiển thị**: Toàn bộ giao diện tương tác và văn bản trong game sử dụng **Tiếng Việt**.

---

## 🚀 Hướng Dẫn Vận Hành & Khởi Chạy (Getting Started)

### 1. Cài đặt thư viện:
```bash
npm install
```

### 2. Chạy môi trường phát triển (Dev server):
```bash
npm run dev
```
Trình duyệt sẽ mở cổng mặc định tại `http://localhost:3000`.

### 3. Kiểm tra bản dựng (Build check):
```bash
npm run build
```

---

## 📋 Kế Hoạch Dự Án Chi Tiết (Project Plan)

Chi tiết đầy đủ về kiến trúc hệ thống, lộ trình các giai đoạn phát triển, trạng thái tính năng và quy trình triển khai có tại tập tin:
👉 **[`PROJECT_PLAN.md`](./PROJECT_PLAN.md)**

Vui lòng tham khảo tập tin trên trước khi bắt đầu hoặc tiếp tục bất kỳ tác vụ nào.
