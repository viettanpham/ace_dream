/**
 * STARFRONT WORLD — Seeded PRNG Engine (Phase 6.3)
 * Thuật toán SplitMix32 / Mulberry32 xác định, có thể tái lập 100%.
 * Cung cấp khả năng sinh số ngẫu nhiên có kiểm soát, tạo chuỗi giá trị và tiến hóa seed.
 */

/**
 * Thuật toán SplitMix32 chuẩn:
 * Nhận vào một seed (số nguyên 32-bit), trả về số giả ngẫu nhiên tiếp theo và seed mới.
 */
export function splitmix32(seed: number): { value: number; nextSeed: number } {
  // Chuẩn hóa sang số nguyên 32-bit không dấu
  let z = (seed + 0x9e3779b9) | 0
  z = Math.imul(z ^ (z >>> 16), 0x21f0aaad)
  z = Math.imul(z ^ (z >>> 15), 0x735a2d97)
  z = (z ^ (z >>> 15)) >>> 0

  const value = z / 4294967296
  const nextSeed = (seed + 0x9e3779b9) | 0
  return { value, nextSeed }
}

/**
 * Thuật toán Mulberry32:
 * Bộ sinh số ngẫu nhiên 32-bit nhanh, phân phối đồng đều, chất lượng cao.
 */
export function mulberry32(seed: number): { value: number; nextSeed: number } {
  let a = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return { value, nextSeed: a }
}

/**
 * Lớp điều khiển PRNG có trạng thái nội tại (Stateful PRNG)
 */
export class WorldPRNG {
  private currentSeed: number

  constructor(seed: number) {
    this.currentSeed = seed | 0
  }

  /**
   * Lấy seed hiện tại
   */
  getSeed(): number {
    return this.currentSeed
  }

  /**
   * Đặt lại seed
   */
  setSeed(seed: number): void {
    this.currentSeed = seed | 0
  }

  /**
   * Sinh số thực trong đoạn [0, 1)
   */
  nextFloat(): number {
    const { value, nextSeed } = mulberry32(this.currentSeed)
    this.currentSeed = nextSeed
    return value
  }

  /**
   * Sinh số nguyên trong đoạn [min, max] (bao gồm cả min và max)
   */
  nextInt(min: number, max: number): number {
    if (min > max) {
      const temp = min
      min = max
      max = temp
    }
    const float = this.nextFloat()
    return Math.floor(float * (max - min + 1)) + min
  }

  /**
   * Kiểm tra xác suất với tỷ lệ chance [0, 1]
   */
  chance(probability: number): boolean {
    if (probability <= 0) return false
    if (probability >= 1) return true
    return this.nextFloat() < probability
  }

  /**
   * Chọn ngẫu nhiên một phần tử từ mảng
   */
  choice<T>(items: readonly T[]): T | undefined {
    if (items.length === 0) return undefined
    const index = this.nextInt(0, items.length - 1)
    return items[index]
  }

  /**
   * Tiến hóa seed sang thế hệ kế tiếp và trả về số nguyên seed mới
   */
  stepSeed(): number {
    const { nextSeed } = mulberry32(this.currentSeed)
    this.currentSeed = nextSeed
    return this.currentSeed
  }
}

/**
 * Hàm hỗ trợ tạo instance WorldPRNG thuận tiện
 */
export function createWorldPRNG(seed: number): WorldPRNG {
  return new WorldPRNG(seed)
}
