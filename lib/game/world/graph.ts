/**
 * STARFRONT WORLD — World Map Graph Engine (Phase 6.2)
 * Cung cấp các cấu trúc và thuật toán đồ thị: Dijkstra tìm đường ngắn nhất,
 * định tuyến an toàn, kiểm tra tính liên thông và truy vấn trạng thái tuyến đường.
 */

import type { RouteState, WorldRoute, WorldSector } from "./types"

export interface RouteTraversalOptions {
  /** Cho phép đi qua tuyến đường Open (mặc định true) */
  allowOpen?: boolean
  /** Cho phép đi qua tuyến đường Hazardous (mặc định true) */
  allowHazardous?: boolean
  /** Cho phép đi qua tuyến đường Blocked (mặc định false) */
  allowBlocked?: boolean
  /** Cho phép đi qua tuyến đường Offline (mặc định false) */
  allowOffline?: boolean
}

export interface ShortestPathOptions extends RouteTraversalOptions {
  /**
   * Chế độ tìm đường:
   * - 'shortest': Tối ưu hóa tổng khoảng cách (distance)
   * - 'safest': Tránh hoặc phạt nặng các tuyến nguy hiểm (hazard penalty)
   */
  mode?: "shortest" | "safest"
  /**
   * Nếu true, loại bỏ hoàn toàn các tuyến đường nguy hiểm (Hazardous)
   */
  avoidHazardous?: boolean
}

export interface PathResult {
  /** Danh sách ID các sector theo thứ tự từ điểm xuất phát đến đích */
  path: string[]
  /** Tổng khoảng cách siêu không gian (tổng distance) */
  totalDistance: number
  /** Mức nguy hiểm tích lũy hoặc cao nhất trên tuyến */
  maxDangerLevel: number
  /** Danh sách các đối tượng WorldRoute đã đi qua */
  routes: WorldRoute[]
  /** Xác nhận tuyến đường có thể lưu thông trọn vẹn */
  traversable: boolean
}

export interface AdjacentSectorEdge {
  sectorId: string
  route: WorldRoute
  distance: number
  dangerLevel: number
  state: RouteState
}

/**
 * Kiểm tra xem một tuyến đường có thể lưu thông được hay không dựa trên cấu hình tùy chọn
 */
export function isRouteTraversable(
  route: WorldRoute,
  options?: RouteTraversalOptions
): boolean {
  const allowOpen = options?.allowOpen ?? true
  const allowHazardous = options?.allowHazardous ?? true
  const allowBlocked = options?.allowBlocked ?? false
  const allowOffline = options?.allowOffline ?? false

  switch (route.state) {
    case "open":
      return allowOpen
    case "hazardous":
      return allowHazardous
    case "blocked":
      return allowBlocked
    case "offline":
      return allowOffline
    default:
      return false
  }
}

/**
 * Tìm tuyến đường kết nối trực tiếp giữa hai sector (vô hướng: A -> B hoặc B -> A)
 */
export function findConnectingRoute(
  routes: WorldRoute[],
  sectorAId: string,
  sectorBId: string
): WorldRoute | undefined {
  if (sectorAId === sectorBId) return undefined
  return routes.find(
    (r) =>
      (r.fromSectorId === sectorAId && r.toSectorId === sectorBId) ||
      (r.fromSectorId === sectorBId && r.toSectorId === sectorAId)
  )
}

/**
 * Truy vấn danh sách các sector lân cận nối trực tiếp với sectorId
 */
export function getAdjacentSectors(
  routes: WorldRoute[],
  sectorId: string,
  options?: RouteTraversalOptions
): AdjacentSectorEdge[] {
  const edges: AdjacentSectorEdge[] = []

  for (const route of routes) {
    let neighborId: string | null = null
    if (route.fromSectorId === sectorId) {
      neighborId = route.toSectorId
    } else if (route.toSectorId === sectorId) {
      neighborId = route.fromSectorId
    }

    if (neighborId) {
      if (!isRouteTraversable(route, options)) {
        continue
      }
      edges.push({
        sectorId: neighborId,
        route,
        distance: route.distance,
        dangerLevel: route.dangerLevel,
        state: route.state,
      })
    }
  }

  return edges
}

/**
 * Lọc danh sách các tuyến đường có thể lưu thông theo trạng thái
 */
export function getAvailableRoutes(
  routes: WorldRoute[],
  options?: RouteTraversalOptions
): WorldRoute[] {
  return routes.filter((r) => isRouteTraversable(r, options))
}

/**
 * Kiểm tra tính liên thông của một đường đi cụ thể (dãy ID các sector)
 */
export function isPathTraversable(
  routes: WorldRoute[],
  path: string[],
  options?: RouteTraversalOptions
): boolean {
  if (path.length <= 1) return true

  for (let i = 0; i < path.length - 1; i++) {
    const fromId = path[i]
    const toId = path[i + 1]
    const route = findConnectingRoute(routes, fromId, toId)
    if (!route || !isRouteTraversable(route, options)) {
      return false
    }
  }
  return true
}

/**
 * Tính toán các chỉ số của một đường đi (Tổng khoảng cách, độ nguy hiểm tối đa, danh sách route)
 */
export function getPathMetrics(
  routes: WorldRoute[],
  path: string[]
): {
  totalDistance: number
  maxDangerLevel: number
  routes: WorldRoute[]
  isValid: boolean
} {
  if (path.length === 0) {
    return { totalDistance: 0, maxDangerLevel: 0, routes: [], isValid: false }
  }
  if (path.length === 1) {
    return { totalDistance: 0, maxDangerLevel: 0, routes: [], isValid: true }
  }

  let totalDistance = 0
  let maxDangerLevel = 0
  const pathRoutes: WorldRoute[] = []

  for (let i = 0; i < path.length - 1; i++) {
    const fromId = path[i]
    const toId = path[i + 1]
    const route = findConnectingRoute(routes, fromId, toId)
    if (!route) {
      return { totalDistance: 0, maxDangerLevel: 0, routes: [], isValid: false }
    }
    totalDistance += route.distance
    maxDangerLevel = Math.max(maxDangerLevel, route.dangerLevel)
    pathRoutes.push(route)
  }

  return {
    totalDistance,
    maxDangerLevel,
    routes: pathRoutes,
    isValid: true,
  }
}

/**
 * Thuật toán Dijkstra tìm đường đi ngắn nhất hoặc an toàn nhất giữa 2 Sector
 * Trả về PathResult hoặc null nếu không thể tìm thấy đường đi khả dụng
 */
export function findShortestPath(
  sectorIds: string[] | Record<string, WorldSector>,
  routes: WorldRoute[],
  startSectorId: string,
  targetSectorId: string,
  options?: ShortestPathOptions
): PathResult | null {
  const allSectorIds = Array.isArray(sectorIds)
    ? sectorIds
    : Object.keys(sectorIds)

  if (!allSectorIds.includes(startSectorId) || !allSectorIds.includes(targetSectorId)) {
    return null
  }

  // Trường hợp xuất phát trùng đích đến
  if (startSectorId === targetSectorId) {
    return {
      path: [startSectorId],
      totalDistance: 0,
      maxDangerLevel: 0,
      routes: [],
      traversable: true,
    }
  }

  const traversalOpts: RouteTraversalOptions = {
    allowOpen: options?.allowOpen ?? true,
    allowHazardous: options?.avoidHazardous ? false : (options?.allowHazardous ?? true),
    allowBlocked: options?.allowBlocked ?? false,
    allowOffline: options?.allowOffline ?? false,
  }

  const mode = options?.mode ?? "shortest"

  // Chuẩn bị cấu trúc Dijkstra
  const distances: Record<string, number> = {}
  const previous: Record<string, { sectorId: string; route: WorldRoute } | null> = {}
  const unvisited = new Set<string>()

  for (const id of allSectorIds) {
    distances[id] = Infinity
    previous[id] = null
    unvisited.add(id)
  }

  distances[startSectorId] = 0

  while (unvisited.size > 0) {
    // Tìm đỉnh có khoảng cách nhỏ nhất trong tập unvisited
    let currentId: string | null = null
    let smallestDist = Infinity

    for (const id of unvisited) {
      if (distances[id] < smallestDist) {
        smallestDist = distances[id]
        currentId = id
      }
    }

    // Không còn đỉnh nào khả dụng hoặc khoảng cách là vô cực
    if (!currentId || smallestDist === Infinity) {
      break
    }

    // Đã chạm đến đích
    if (currentId === targetSectorId) {
      break
    }

    unvisited.delete(currentId)

    // Khảo sát các đỉnh lân cận
    const neighbors = getAdjacentSectors(routes, currentId, traversalOpts)
    for (const edge of neighbors) {
      if (!unvisited.has(edge.sectorId)) continue

      // Tính trọng số cạnh theo chế độ
      let weight = edge.distance
      if (mode === "safest") {
        // Phạt thêm trọng số nếu tuyến đường có rủi ro
        if (edge.state === "hazardous") {
          weight += edge.distance * 1.5 + edge.dangerLevel * 0.1
        }
      }

      const alt = distances[currentId] + weight
      if (alt < distances[edge.sectorId]) {
        distances[edge.sectorId] = alt
        previous[edge.sectorId] = { sectorId: currentId, route: edge.route }
      }
    }
  }

  // Nếu không đến được đích
  if (distances[targetSectorId] === Infinity) {
    return null
  }

  // Tái dựng đường đi từ đích về điểm xuất phát
  const reconstructedPath: string[] = []
  const traversedRoutes: WorldRoute[] = []
  let curr: string | null = targetSectorId

  while (curr !== null) {
    reconstructedPath.unshift(curr)
    const prevNode = previous[curr]
    if (prevNode) {
      traversedRoutes.unshift(prevNode.route)
      curr = prevNode.sectorId
    } else {
      curr = null
    }
  }

  // Đo lường khoảng cách thực tế không chứa trọng số phạt an toàn
  const metrics = getPathMetrics(routes, reconstructedPath)

  return {
    path: reconstructedPath,
    totalDistance: metrics.totalDistance,
    maxDangerLevel: metrics.maxDangerLevel,
    routes: traversedRoutes,
    traversable: true,
  }
}

/**
 * Lấy tất cả các sector có thể tiếp cận được từ startSectorId
 */
export function getReachableSectors(
  sectorIds: string[] | Record<string, WorldSector>,
  routes: WorldRoute[],
  startSectorId: string,
  options?: ShortestPathOptions & { maxDistance?: number }
): Record<string, PathResult> {
  const allSectorIds = Array.isArray(sectorIds)
    ? sectorIds
    : Object.keys(sectorIds)

  const reachable: Record<string, PathResult> = {}
  const maxDist = options?.maxDistance ?? Infinity

  for (const targetId of allSectorIds) {
    const result = findShortestPath(
      allSectorIds,
      routes,
      startSectorId,
      targetId,
      options
    )
    if (result && result.totalDistance <= maxDist) {
      reachable[targetId] = result
    }
  }

  return reachable
}

/**
 * Kiểm tra xem mạng lưới đồ thị có liên thông hoàn toàn hay không
 * (tất cả các sector đều có thể đi tới nhau theo các tuyến khả dụng)
 */
export function isNetworkConnected(
  sectorIds: string[] | Record<string, WorldSector>,
  routes: WorldRoute[],
  options?: RouteTraversalOptions
): boolean {
  const allSectorIds = Array.isArray(sectorIds)
    ? sectorIds
    : Object.keys(sectorIds)

  if (allSectorIds.length <= 1) return true

  const startId = allSectorIds[0]
  const visited = new Set<string>([startId])
  const queue = [startId]

  while (queue.length > 0) {
    const current = queue.shift()!
    const neighbors = getAdjacentSectors(routes, current, options)

    for (const neighbor of neighbors) {
      if (allSectorIds.includes(neighbor.sectorId) && !visited.has(neighbor.sectorId)) {
        visited.add(neighbor.sectorId)
        queue.push(neighbor.sectorId)
      }
    }
  }

  return visited.size === allSectorIds.length
}

/**
 * Phân tích các thành phần liên thông (Connected Components) của mạng lưới
 */
export function getConnectedComponents(
  sectorIds: string[] | Record<string, WorldSector>,
  routes: WorldRoute[],
  options?: RouteTraversalOptions
): string[][] {
  const allSectorIds = Array.isArray(sectorIds)
    ? sectorIds
    : Object.keys(sectorIds)

  const visited = new Set<string>()
  const components: string[][] = []

  for (const id of allSectorIds) {
    if (visited.has(id)) continue

    const component: string[] = []
    const queue = [id]
    visited.add(id)

    while (queue.length > 0) {
      const current = queue.shift()!
      component.push(current)

      const neighbors = getAdjacentSectors(routes, current, options)
      for (const neighbor of neighbors) {
        if (allSectorIds.includes(neighbor.sectorId) && !visited.has(neighbor.sectorId)) {
          visited.add(neighbor.sectorId)
          queue.push(neighbor.sectorId)
        }
      }
    }

    components.push(component)
  }

  return components
}

/**
 * Cập nhật trạng thái một tuyến đường theo routeId (hàm thuần túy, tạo mảng mới)
 */
export function updateRouteState(
  routes: WorldRoute[],
  routeId: string,
  newState: RouteState,
  newDangerLevel?: number
): WorldRoute[] {
  return routes.map((route) => {
    if (route.id !== routeId) return route
    return {
      ...route,
      state: newState,
      dangerLevel:
        typeof newDangerLevel === "number"
          ? Math.max(0, Math.min(100, newDangerLevel))
          : route.dangerLevel,
    }
  })
}

/**
 * Cập nhật trạng thái tuyến đường giữa hai sector bất kỳ (hàm thuần túy)
 */
export function setRouteStateBetween(
  routes: WorldRoute[],
  sectorAId: string,
  sectorBId: string,
  newState: RouteState,
  newDangerLevel?: number
): WorldRoute[] {
  return routes.map((route) => {
    const matches =
      (route.fromSectorId === sectorAId && route.toSectorId === sectorBId) ||
      (route.fromSectorId === sectorBId && route.toSectorId === sectorAId)
    if (!matches) return route

    return {
      ...route,
      state: newState,
      dangerLevel:
        typeof newDangerLevel === "number"
          ? Math.max(0, Math.min(100, newDangerLevel))
          : route.dangerLevel,
    }
  })
}
