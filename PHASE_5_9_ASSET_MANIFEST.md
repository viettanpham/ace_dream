# STARFRONT — Báo Cáo & Danh Mục Quản Lý Tài Nguyên Hình Ảnh (Phase 5.9 Asset Manifest)

*Ngày lập: Tháng 10/2026*  
*Giai đoạn:* **Phase 5.9 — Visual Asset Management, Regeneration Status & UI Integration**

---

## 1. Tổng Quan Trạng Thái Tài Nguyên Hình Ảnh (Asset Overview)

Trong Phase 5.9, hệ thống tài nguyên hình ảnh được chuẩn hóa theo phong cách **Sci-Fi Anime Mecha Military RPG**. Toàn bộ tài nguyên được tích hợp trực tiếp vào codebase qua thư mục chuẩn `/public/images/` với định dạng vector SVG chất lượng cao và cơ chế fallback an toàn.

> **Ghi Chú Kỹ Thuật (Quota & Fallback Report):**  
> Khi gọi công cụ sinh ảnh bằng mô hình AI (`generate_image`), hệ thống thông báo *Quota Exceeded (429)* cho dự án này trên môi trường AI Studio. Theo đúng hướng dẫn dự phòng tại Mục 12 của tài liệu kỹ thuật, hệ thống duy trì toàn vẹn bộ vector SVG sci-fi sắc nét, độc lập theo từng nhân vật và cơ giáp, đảm bảo giao diện buồng lái, sàn đấu và danh sách nhân vật không bao giờ bị lỗi ảnh trống hoặc broken image.

---

## 2. Danh Mục Tài Nguyên Cơ Giáp (Gear Assets)

| Gear ID | Tên Hiển Thị | Vai Trò (Role) | Đường Dẫn Asset | Định Dạng | Tỷ Lệ / Kích Thước | Trạng Thái Tích Hợp |
|---|---|---|---|---|---|---|
| `vanguard` | Vanguard Mk-I | Assault Striker (Cân Bằng) | `/images/vanguard.svg` | SVG Vector | 16:9 / Responsive | **Tích hợp 100%**: Buồng lái, Card chọn, Đấu trường, Icon |
| `falcon` | Falcon Interceptor | Recon Interceptor (Tốc Độ / Né) | `/images/falcon.svg` | SVG Vector | 16:9 / Responsive | **Tích hợp 100%**: Buồng lái, Card chọn, Đấu trường, Icon |
| `aegis` | Aegis Bastion | Heavy Siege Fortress (Pháo Đài) | `/images/aegis.svg` | SVG Vector | 16:9 / Responsive | **Tích hợp 100%**: Buồng lái, Card chọn, Đấu trường, Icon |

---

## 3. Danh Mục Tài Nguyên Phi Công (Pilot Character Assets)

| Pilot ID | Họ Tên | Callsign | Vai Trò Chuyên Môn | Avatar Chân Dung | Artwork Toàn Thân (Full-Body) | Tỷ Lệ | Trạng Thái Tích Hợp |
|---|---|---|---|---|---|---|---|
| `marcus` | Marcus Thorne | War Dog | Assault / Weapons Specialist | `/images/marcus-portrait.svg` | `/images/marcus-fullbody.svg` | 9:16 (Khổ Lớn) | **Tích hợp 100%**: Thẻ toàn thân khổ lớn, Header, Card |
| `valentine` | Valentine Reyes | Aegis Shield | Defense / Support Specialist | `/images/valentine-portrait.svg` | `/images/valentine-fullbody.svg` | 9:16 (Khổ Lớn) | **Tích hợp 100%**: Thẻ toàn thân khổ lớn, Header, Card |
| `alviss` | Levi Reed (Alviss) | Ghost Falcon | Interceptor / Evasion Specialist | `/images/alviss-portrait.svg` | `/images/levi-fullbody.svg` | 9:16 (Khổ Lớn) | **Tích hợp 100%**: Thẻ toàn thân khổ lớn, Header, Card |
| `eric` | Eric Vance | Siege Breaker | Siege / Demolition Specialist | `/images/eric-portrait.svg` | `/images/eric-fullbody.svg` | 9:16 (Khổ Lớn) | **Tích hợp 100%**: Thẻ toàn thân khổ lớn, Header, Card |

---

## 4. Đặc Điểm Thiết Kế & Visual Cues Từng Nhân Vật

1. **Marcus Thorne (War Dog)**:
   - *Bảng màu*: Đỏ sẫm (`#ef4444`), Than chì (`#18181b`), Kim loại bạc.
   - *Phong cách*: Chỉ huy tác chiến cường tráng, giáp công nghệ cao vai vuông, biểu cảm quyết đoán tự tin.
   - *Hiệp đồng trực quan*: Hào quang Neon Đỏ - Cyan khi ghép đôi cùng Vanguard.

2. **Valentine Reyes (Aegis Shield)**:
   - *Bảng màu*: Bạc (`#e2e8f0`), Xanh ngọc lạnh (`#38bdf8`), Lam thẫm (`#1e3a8a`).
   - *Phong cách*: Nữ sĩ quan chỉ huy thông tuệ, giáp bảo hộ nano tinh tế, thiết bị chiếu khiên tích hợp trên vai.
   - *Hiệp đồng trực quan*: Hào quang Neon Hoàng Kim khi ghép đôi cùng Aegis.

3. **Levi Reed / Alviss (Ghost Falcon)**:
   - *Bảng màu*: Xanh Cyan Neon (`#06b6d4`), Đen carbon (`#09090b`), Tím sẫm (`#7c3aed`).
   - *Phong cách*: Phi công đột kích khí động học, vóc dáng linh hoạt, thiết bị cảm biến gia tốc và cánh tản nhiệt gọn nhẹ.
   - *Hiệp đồng trực quan*: Hào quang Neon Tím - Cyan khi ghép đôi cùng Falcon.

4. **Eric Vance (Siege Breaker)**:
   - *Bảng màu*: Cam cháy (`#f97316`), Xám thép (`#475569`), Đen mờ.
   - *Phong cách*: Chiến binh pháo binh dạn dày sương gió, kính ngắm laser quang học, giáp hạng nặng chống chịu sức ép hạt nhân.
   - *Hiệp đồng trực quan*: Hào quang Neon Cam khi ghép đôi cùng Aegis.

---

## 5. Quy Chuẩn Sử Dụng Asset Trong Codebase

1. **Next.js & Browser Rendering**:
   - Khai báo đường dẫn bắt đầu từ `/images/...` trong các thẻ `<img>` và Next `<Image />`.
   - Thuộc tính `objectFit="contain"` hoặc `object-contain object-top` để giữ trọn vẹn tỷ lệ giải phẫu học của nhân vật.
   - Thuộc tính `referrerPolicy="no-referrer"` tuân thủ nghiêm ngặt môi trường AI Studio.
2. **Kích Thước Render Tối Ưu**:
   - Khung hình ảnh toàn thân (Full-body frame) tại Cột Trái màn hình `CharacterGearSelect`: Tối thiểu `min-h-[460px]`, hiển thị trọn vẹn chi tiết trang phục phi công.
   - Vòng tròn Avatar Chân dung (Portrait): `size-12` đến `size-16` với viền màu phẩm chất và trạng thái tương tác.
