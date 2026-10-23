# STARFRONT WORLD V2 — WEB-01
# THIẾT KẾ BỘ GIẢI QUYẾT TÀI NGUYÊN HÌNH ẢNH (CDN & IMAGE RESOLVER DESIGN)

**Mã tài liệu:** WEB01-DESIGN-01  
**Trạng thái:** IMPLEMENTED & VERIFIED (ĐÃ TRIỂN KHAI VÀ NGHIỆM THU)  
**Ngày hoàn tất:** 2026-10-22  
**Mục tiêu:** Cung cấp cơ chế phân giải URL hình ảnh tập trung, hỗ trợ linh hoạt giữa Local, jsDelivr CDN và Cloudflare R2 mà không thay đổi dữ liệu gốc.

---

## 1. Yêu cầu thiết kế kỹ thuật

1. **Tính tương thích ngược 100%:** Nhận đầu vào là đường dẫn tương đối hiện tại (ví dụ: `/images/marcus-portrait.webp`, `images/vanguard-gear.webp` hoặc `valentine-combat.webp`).
2. **Không làm thay đổi Database/Save Data:** Trạng thái trong state, JSON và save game giữ nguyên dạng tương đối.
3. **Cấu hình qua Biến môi trường:** Không hardcode tên người dùng GitHub, tên kho hay phiên bản CDN trong component.
4. **Hỗ trợ chuyển đổi CDN đa tầng (Multi-Provider Support):** Sẵn sàng chuyển từ jsDelivr sang Cloudflare R2 hoặc domain riêng trong tương lai bằng cách đổi biến môi trường.
5. **Cơ chế Fallback & Graceful Degradation:** Xử lý ảnh lỗi, đường dẫn rỗng, và tích hợp sẵn placeholder an toàn.
6. **Zero Secrets in Client:** Toàn bộ tiền tố URL CDN là công khai, không chứa token xác thực hoặc API key riêng tư.

---

## 2. Thiết kế Kiến trúc Module `image-resolver.ts`

### 2.1. Vị trí tệp đề xuất
`lib/game/assets/image-resolver.ts`

### 2.2. Kiểu dữ liệu & Giao diện (Type Definitions)
```typescript
/**
 * Chế độ nguồn cấp tài nguyên hình ảnh của STARFRONT
 */
export type AssetStorageMode = 'local' | 'jsdelivr' | 'r2' | 'custom';

export interface ImageResolverConfig {
  mode: AssetStorageMode;
  cdnBaseUrl?: string;
  githubOwner?: string;
  assetRepoName?: string;
  releaseVersion?: string;
  fallbackPlaceholderUrl: string;
}
```

### 2.3. Cấu hình Biến môi trường (`.env.example` và `.env.local`)
```bash
# ==============================================================================
# STARFRONT ASSET CDN CONFIGURATION (WEB-01)
# ==============================================================================
# Chế độ: local (mặc định cho offline/dev) | cdn (phân phối qua jsDelivr/R2)
NEXT_PUBLIC_ASSET_STORAGE_MODE=local

# URL Base CDN đầy đủ (nếu dùng jsDelivr hoặc Custom Domain):
# Mẫu jsDelivr: https://cdn.jsdelivr.net/gh/<GITHUB_OWNER>/starfront-world-assets@v2.0-assets
NEXT_PUBLIC_ASSET_CDN_URL=https://cdn.jsdelivr.net/gh/viettanpham/starfront-world-assets@v2.0-assets

# Fallback placeholder cục bộ an toàn khi ảnh gặp sự cố nạp
NEXT_PUBLIC_ASSET_FALLBACK_URL=/icon.svg
```

### 2.4. Thuật toán phân giải URL (`resolveImageUrl`)
```typescript
/**
 * Hàm phân giải URL hình ảnh tập trung duy nhất của toàn hệ sinh thái STARFRONT
 * 
 * @param relativePath Đường dẫn tương đối lưu trong catalog/save (ví dụ: '/images/marcus-portrait.webp')
 * @returns URL hợp lệ sẵn sàng nạp cho thẻ <img> hoặc <Image>
 */
export function resolveImageUrl(relativePath?: string | null): string {
  // 1. Kiểm tra đầu vào rỗng hoặc không xác định
  if (!relativePath || typeof relativePath !== 'string') {
    return process.env.NEXT_PUBLIC_ASSET_FALLBACK_URL || '/icon.svg';
  }

  // 2. Nếu đã là URL tuyệt đối (http:// hoặc https://) hoặc base64 data URL -> giữ nguyên
  if (
    relativePath.startsWith('http://') ||
    relativePath.startsWith('https://') ||
    relativePath.startsWith('data:')
  ) {
    return relativePath;
  }

  // 3. Chuẩn hóa đường dẫn: Loại bỏ gạch chéo đầu nếu có
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;

  // 4. Kiểm tra chế độ lưu trữ từ biến môi trường
  const mode = process.env.NEXT_PUBLIC_ASSET_STORAGE_MODE || 'local';
  const cdnBase = process.env.NEXT_PUBLIC_ASSET_CDN_URL?.trim();

  // 5. Nếu chế độ local hoặc chưa cấu hình CDN Base -> Trả về đường dẫn public cục bộ
  if (mode === 'local' || !cdnBase) {
    return `/${cleanPath}`;
  }

  // 6. Ghép URL CDN: Đảm bảo không bị lặp hoặc thiếu dấu gạch chéo
  const normalizedCdnBase = cdnBase.endsWith('/') ? cdnBase.slice(0, -1) : cdnBase;
  return `${normalizedCdnBase}/${cleanPath}`;
}
```

---

## 3. Cấu trúc URL mục tiêu trên jsDelivr CDN

URL mẫu chuẩn theo đặc tả của jsDelivr cho GitHub Release / Tag:
```
https://cdn.jsdelivr.net/gh/<GITHUB_OWNER>/starfront-world-assets@<TAG>/images/<FILE_NAME>
```

**Ví dụ thực tế:**
- Marcus Portrait:  
  `https://cdn.jsdelivr.net/gh/viettanpham/starfront-world-assets@v2.0-assets/images/marcus-portrait.webp`
- Valentine Combat Artwork V2:  
  `https://cdn.jsdelivr.net/gh/viettanpham/starfront-world-assets@v2.0-assets/images/valentine-combat.webp`
- Aegis Gear Illustration:  
  `https://cdn.jsdelivr.net/gh/viettanpham/starfront-world-assets@v2.0-assets/images/aegis-gear.webp`

---

## 4. Tương thích cấu hình Next.js (`next.config.mjs`)

Khi Next.js sử dụng thẻ `<Image>` (từ `next/image`), Next.js yêu cầu khai báo tên miền ngoại vi được phép trong `images.remotePatterns` để tránh lỗi bảo mật:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true, // Giữ tối ưu ban đầu của dự án
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        pathname: '/gh/**',
      },
      // Sẵn sàng cho Cloudflare R2 / Custom CDN trong tương lai:
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
        pathname: '/**',
      },
    ],
  },
  // Các cấu hình khác giữ nguyên...
};
```

---

## 5. Lộ trình nâng cấp Cloudflare R2 trong tương lai

Khi dự án mở rộng vượt giới hạn của jsDelivr (ví dụ lượng truy cập hàng triệu request hoặc cần bảo mật CDN riêng):
1. Đồng bộ kho ảnh lên **Cloudflare R2 Bucket** (ví dụ: `assets.starfrontworld.com`).
2. Thay đổi giá trị biến môi trường trong hosting:
   ```bash
   NEXT_PUBLIC_ASSET_STORAGE_MODE=r2
   NEXT_PUBLIC_ASSET_CDN_URL=https://assets.starfrontworld.com
   ```
3. **Kết quả:** Toàn bộ game chuyển hướng tải sang R2 ngay lập tức mà không cần sửa bất kỳ dòng code giao diện hay logic nào!
