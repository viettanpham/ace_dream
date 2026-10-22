# UI V2 Navigation Registry & Page Status

## Mục tiêu
Một nguồn cấu hình duy nhất cho menu V2 và metadata page. Không hardcode cùng danh sách menu ở Top Menu, Sidebar và Mobile Drawer.

## Nguyên tắc
- Registry mô tả navigation/page metadata; giữ đơn giản, phù hợp kiến trúc hiện tại.
- Kiểm tra trước khi chọn TypeScript hay JSON. Không hứa chỉnh file JSON trong source sẽ cập nhật runtime không cần build nếu Next.js cần build/cache.
- Không cần database/CMS ở Foundation.
- Không đưa gameplay canonical sang JSON UI riêng nếu tạo ra hai nguồn sự thật.
- Tên system phải đối chiếu catalog/tài liệu canonical; không tự tạo hoặc đổi tên domain.

## Status chuẩn
- `placeholder`: có vị trí điều hướng nhưng chưa có nội dung nghiệp vụ.
- `in_progress`: đang triển khai, chưa coi là hoàn tất.
- `ready`: qua acceptance checks trong scope.
- `hold`: tạm dừng vì dependency/decision/blocker.

Placeholder không được bịa gameplay. `hold` cần thông báo ngắn gọn khi thích hợp.

## Navigation ban đầu
Danh sách khung tham khảo từ trao đổi: World Map, Base, Buildings, Fleet, Ships, Pilots, Gear, Operations. Đây **không** phải tuyên bố cả 11 system đã đủ/được audit. Thêm item khi scope canonical được xác nhận.

## Metadata contract
```ts
type UiVersion = "v1" | "v2";
type PageStatus = "placeholder" | "in_progress" | "ready" | "hold";

type V2PageDefinition = {
  id: string;
  label: string;
  group: string;
  status: PageStatus;
  version: "v2";
  href?: string;
  componentKey?: string;
};
```
Ví dụ mang tính khái niệm, không bắt buộc sao chép nguyên tên. Chọn route/component mapping an toàn với repo thực tế.

## Accessibility
Active item có nhiều tín hiệu; icon không thay label; sidebar collapse có accessible label; drawer quản lý close/focus hợp lý; hover không phải cách duy nhất để biết chức năng.
