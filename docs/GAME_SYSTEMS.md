# STARFRONT — Kiến Trúc Hệ Thống Trò Chơi (Game Systems Architecture)

Tài liệu này là danh mục tổng thể (Master Index) và nguyên tắc kiến trúc cho toàn bộ các hệ thống cốt lõi của **STARFRONT**. Mọi nhà phát triển và trợ lý AI khi tiếp tục triển khai các tính năng (đặc biệt từ Phase 5.7 trở đi) cần đọc tài liệu này và các tài liệu chuyên đề liên quan trước khi sửa đổi mã nguồn.

---

## 1. Định Vị Dự Án & Nguyên Tắc Thiết Kế

- **Thể loại**: Nhập vai chiến thuật theo lượt 2D (Turn-based Sci-Fi Tactical RPG), chạy trên nền web (SPA).
- **Cảm hứng & Phong cách**: Bầu không khí tác chiến cơ giáp không gian (Gear) lấy cảm hứng từ *ACE Online*, nhưng 100% tài sản trí tuệ độc lập (Original IP).
- **Phân tách trách nhiệm**:
  - `lib/game/`: Chứa thuần túy logic nghiệp vụ (pure functions, engine toán học, tính toán chỉ số, lưu trữ). Không chứa React hooks hay JSX.
  - `components/game/`: Chứa giao diện người dùng (UI components), xử lý tương tác, phản hồi âm thanh và hiển thị trạng thái.
  - `docs/`: Tài liệu kỹ thuật chi tiết theo từng phân hệ.

---

## 2. Quy Ước Phân Loại Trạng Thái (Status Taxonomy)

Trong toàn bộ tài liệu dự án, mọi cơ chế được phân loại theo 3 trạng thái nghiêm ngặt:

| Trạng thái | Ký hiệu | Ý nghĩa |
|---|---|---|
| **Implemented** | `[IMPLEMENTED]` | Đã có trong mã nguồn (`lib/game/*` hoặc `components/game/*`), có test hoặc đã kiểm chứng trong gameplay thực tế. |
| **Partial** | `[PARTIAL]` | Đã triển khai một phần nền tảng nhưng chưa hoàn thiện toàn bộ luồng người dùng hoặc chưa đồng bộ đủ các module. |
| **Planned** | `[PLANNED]` | Đã được thiết kế, thống nhất thông số hoặc nằm trong lộ trình kế hoạch, nhưng **CHƯA ĐƯỢC VIẾT CODE GAMEPLAY**. Tuyệt đối không mô tả như tính năng đang chạy. |

---

## 3. Danh Mục Hệ Thống & Liên Kết Tài Liệu

| Hệ thống | Mã tài liệu | Trạng thái tổng quan | Tài liệu chi tiết |
|---|---|---|---|
| **Hệ Thống Cân Bằng Vật Phẩm Dùng Chung** | `SYS-BAL` | `[PARTIAL]` (M5.5 Loot stats done; M5.7 Power Budget/Rating planned) | [`docs/ITEM_BALANCE.md`](./ITEM_BALANCE.md) |
| **Hệ Thống Trang Bị & Kho Đồ** | `SYS-EQP` | `[IMPLEMENTED]` (3 slots, enhance +10, salvage, shop refresh done; Gear-specific planned) | [`docs/EQUIPMENT_SYSTEM.md`](./EQUIPMENT_SYSTEM.md) |
| **Hệ Thống Mô-đun Kỹ Năng & 5 Slots** | `SYS-SKL` | `[PARTIAL]` (4 basic skills/gear done; 5 slots module deck & slot upgrade planned) | [`docs/SKILL_SYSTEM.md`](./SKILL_SYSTEM.md) |
| **Hệ Thống Chiến Đấu Theo Lượt** | `SYS-CMB` | `[IMPLEMENTED]` (Turn queue, status effects, damage, AI 4 archetypes, boss enrage) | [`docs/COMBAT_SYSTEM.md`](./COMBAT_SYSTEM.md) |
| **Hệ Thống Dữ Liệu Lưu Trữ & Di Chuyển Schema** | `SYS-SAV` | `[IMPLEMENTED]` (Schema v3 with fallback & auto-migration; Schema v4 planned) | [`docs/SAVE_DATA.md`](./SAVE_DATA.md) |

---

## 4. Bản Đồ Mã Nguồn & Phân Quyền Xử Lý

```
lib/game/
├── types.ts          # Nguồn chân lý kiểu dữ liệu (Single Source of Truth cho Interfaces/Types)
├── data.ts           # Dữ liệu tĩnh: Cơ giáp, Kỹ năng, Boss, Bản đồ Sector, Danh mục Chợ
├── engine.ts         # Pure engine: Sáng kiến tốc độ, hàng đợi lượt, công thức sát thương, AI đối thủ
├── progression.ts    # Tiến trình: Level, EXP, Credits, Alloy, Cường hóa, Rã đồ, Mua/Bán Chợ
├── scaling.ts        # Thuật toán nhiệm vụ: Scaling quái vật, biến thể, tỷ lệ rơi đồ, chỉ số ngẫu nhiên
├── storage.ts        # Quản lý LocalStorage, an toàn SSR, tự động migrate schema (v1/v2/v3 -> v4)
└── audio.ts          # Web Audio API tổng hợp âm thanh Sci-Fi (Laser, Shield, Impact, Victory)

components/game/
├── combat-arena.tsx      # Buồng lái chiến đấu trung tâm, animation, nhật ký chiến đấu, khóa địch ải
├── campaign-map.tsx      # Bản đồ chiến dịch 4 Sector, nhiệm vụ chính tuyến & nhiệm vụ phụ tuyến
├── starfront-hangar.tsx  # Xưởng Hangar: Chuyển đổi 3 lớp Gear, kho đồ 3 slots, cường hóa, rã đồ
├── starfront-shop.tsx    # Chợ quân sự: Mua sắm trang bị phân tầng, bán vật phẩm thừa, làm mới gian hàng
└── console.tsx           # Trình điều khiển đa năng, tích hợp STARFRONT và các phân hệ Ace Manager
```

---

## 5. Nguyên Tắc Cốt Lõi Khi Phát Triển Tiếp

1. **Bảo toàn dữ liệu người chơi (Zero Data Loss)**:
   Mọi thay đổi đối với `StarfrontProgression` phải đi kèm hàm migration trong `storage.ts`. Save cũ của người chơi không bao giờ bị xóa trắng hoặc văng lỗi (crash).
2. **Bất biến chỉ số đã tạo (Stat Immutability)**:
   Trang bị hoặc kỹ năng một khi đã sinh ngẫu nhiên và lưu vào kho đồ phải cố định chỉ số (`statsRandomized: true`). Không được tính toán lại ngẫu nhiên khi người chơi xem trước (preview), mở Hangar, tháo/lắp đồ hay reload trang.
3. **Phân tách Rarity và Quality**:
   - `Rarity` (`common`, `rare`, `epic`, `legendary`): Thuộc tính của Trang bị và Skill Module.
   - `Quality` (`standard`, `veteran`, `elite`, `heroic`, `legendary`): Thuộc tính của Nhiệm vụ (Quest).
4. **Không phụ thuộc magic numbers**:
   Tất cả hằng số cân bằng (tỷ lệ rơi, chi phí, hệ số, giới hạn) phải được khai báo tập trung trong `lib/game/data.ts` hoặc `scaling.ts`, không viết trực tiếp vào thân hàm UI.
