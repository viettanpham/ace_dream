/**
 * STARFRONT WORLD — Initial Map Configuration (Phase 6.28)
 * Cung cấp thông tin cấu hình bản đồ chuẩn hóa 10 sector và 16 tuyến đường.
 * Tái sử dụng dữ liệu từ initial-state.ts để bảo đảm duy nhất một nguồn dữ liệu (Single Source of Truth).
 */

import {
  INITIAL_WORLD_ROUTES,
  INITIAL_WORLD_SECTORS,
} from "./initial-state"
import type { WorldRoute, WorldSector } from "./types"

export { INITIAL_WORLD_ROUTES, INITIAL_WORLD_SECTORS }

/**
 * Lấy danh sách 10 sector khởi đầu dưới dạng mảng
 */
export function getInitialSectorsList(): WorldSector[] {
  return Object.values(INITIAL_WORLD_SECTORS)
}

/**
 * Lấy danh sách 16 tuyến đường siêu không gian khởi đầu
 */
export function getInitialRoutesList(): WorldRoute[] {
  return [...INITIAL_WORLD_ROUTES]
}

/**
 * Tra cứu Sector theo ID từ cấu hình mẫu ban đầu
 */
export function getInitialSectorById(id: string): WorldSector | undefined {
  return INITIAL_WORLD_SECTORS[id]
}

/**
 * Tra cứu Route theo ID từ cấu hình mẫu ban đầu
 */
export function getInitialRouteById(id: string): WorldRoute | undefined {
  return INITIAL_WORLD_ROUTES.find((r) => r.id === id)
}
