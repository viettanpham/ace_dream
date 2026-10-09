# STARFRONT

**STARFRONT** là tựa game nhập vai chiến thuật theo lượt 2D (Turn-based RPG) lấy bối cảnh khoa học viễn tưởng không gian, mang đậm phong cách cơ giáp chiến đấu lấy cảm hứng từ *ACE Online*. Game được xây dựng hoàn toàn với nội dung sáng tạo nguyên bản (original IP) chạy trực tiếp trên trình duyệt.

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
