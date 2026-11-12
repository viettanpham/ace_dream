/**
 * STARFRONT WORLD V2 — RUNTIME CDN CHANNEL CONFIGURATION (FND-8 R4 → R5+)
 *
 * QUY TẮC TỐI CAO:
 * - File cấu hình này CHỈ chứa URL entrypoint của kênh (channel) và tùy chọn network/cache.
 * - TUYỆT ĐỐI KHÔNG chứa danh sách Pilot, số chapter, tên file ảnh, ảnh mặc định V1
 *   hoặc đường dẫn cố định đến từng chapter/gallery.
 */

export interface StarfrontContentConfig {
  /** URL entrypoint ổn định của kênh nội dung V2 trên CDN */
  channelUrl: string
  /** Danh sách origin CDN được phép tải manifest và tài nguyên */
  trustedOrigins: readonly string[]
  /** Tiền tố kho lưu trữ hợp lệ trên CDN để chặn giả mạo đường dẫn */
  allowedRepoIdentifier: string
  /** Thời gian chờ tối đa cho mỗi HTTP request (ms) */
  fetchTimeoutMs: number
  /** Số lần thử lại tối đa khi mạng chập chờn */
  maxRetries: number
  /** Thời gian sống mặc định của kiểm tra channel (ms) */
  channelCacheTtlMs: number
}

export const DEFAULT_PILOT_V2_CHANNEL_URL =
  'https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@main/starfront-world-assets/channels/pilot-v2-preview.json'

export function getContentConfig(
  overrides?: Partial<StarfrontContentConfig>
): StarfrontContentConfig {
  const envChannelUrl =
    typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_STARFRONT_V2_CHANNEL_URL?.trim() ||
        process.env.STARFRONT_V2_CHANNEL_URL?.trim()
      : undefined

  return {
    channelUrl: overrides?.channelUrl || envChannelUrl || DEFAULT_PILOT_V2_CHANNEL_URL,
    trustedOrigins: overrides?.trustedOrigins || [
      'https://cdn.jsdelivr.net',
      'https://raw.githubusercontent.com',
    ],
    allowedRepoIdentifier: overrides?.allowedRepoIdentifier || 'viettanpham/starfront-assets',
    fetchTimeoutMs: overrides?.fetchTimeoutMs ?? 10000,
    maxRetries: overrides?.maxRetries ?? 2,
    channelCacheTtlMs: overrides?.channelCacheTtlMs ?? 60000,
  }
}

export const contentConfig: StarfrontContentConfig = getContentConfig()
