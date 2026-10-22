/**
 * STARFRONT WORLD — In-Game Calendar & Diurnal Cycle (Phase 6.13)
 * Quy tắc lịch chiến lược và chu kỳ thời gian trong ngày:
 *
 * Quy tắc xác định:
 * - 1 Ngày Chiến Lược = 24 Giờ trong game (1440 phút).
 * - Chu kỳ ngày 4 buổi:
 *     * 05:00 – 11:59: Buổi Sáng (Dawn / Morning) — Ánh bình minh tinh vân
 *     * 12:00 – 17:59: Buổi Chiều (Afternoon) — Đỉnh triều năng lượng
 *     * 18:00 – 21:59: Buổi Tối (Evening / Twilight) — Hoàng hôn rực sáng
 *     * 22:00 – 04:59: Ban Đêm (Night) — Không gian tĩnh lặng, trực chiến
 *
 * - Chu kỳ niên lịch:
 *     * 1 Tháng = 30 Ngày chiến lược.
 *     * 1 Mùa = 3 Tháng = 90 Ngày chiến lược.
 *     * 1 Năm = 4 Mùa = 12 Tháng = 360 Ngày chiến lược.
 *     * 4 Mùa Thiên Hà:
 *         1. Mùa Khởi Nguyên (Genesis Spring) — Tháng 1–3
 *         2. Mùa Bão Lửa (Solar Flare Summer) — Tháng 4–6
 *         3. Mùa Thu Hoạch (Stellar Harvest Autumn) — Tháng 7–9
 *         4. Mùa Băng Tối (Void Frost Winter) — Tháng 10–12
 */

export interface GameCalendarInfo {
  currentDay: number
  dayFraction: number // 0.0 .. 0.999
  hours: number       // 0 .. 23
  minutes: number     // 0 .. 59
  timeString: string  // "HH:MM"
  cycleKey: "dawn" | "afternoon" | "evening" | "night"
  cycleName: string   // "Buổi Sáng", "Buổi Chiều", "Buổi Tối", "Ban Đêm"
  cycleDesc: string
  cycleColor: string  // Tailwind color token or hex
  dayOfMonth: number  // 1 .. 30
  month: number       // 1 .. 12
  monthName: string
  seasonIndex: number // 0 .. 3
  seasonName: string  // "Mùa Khởi Nguyên", etc.
  seasonIcon: string  // "🌱", "⚡", "🌾", "❄️"
  year: number        // 1 .. N
  formattedDate: string // "Ngày 15, Tháng 04 (Năm 01)"
  fullSummary: string // "Ngày 15, Tháng 04 · Mùa Bão Lửa (Năm 01) — 14:30 [Buổi Chiều]"
}

export const SEASONS = [
  { name: "Mùa Khởi Nguyên", icon: "🌱", desc: "Tái thiết sinh cơ & lưu thông tài nguyên" },
  { name: "Mùa Bão Lửa", icon: "⚡", desc: "Bức xạ mặt trời cao & hoạt động quân sự mạnh" },
  { name: "Mùa Thu Hoạch", icon: "🌾", desc: "Sản lượng công nghiệp & lương thực dồi dào" },
  { name: "Mùa Băng Tối", icon: "❄️", desc: "Năng lượng cạn kiệt & áp lực The Void gia tăng" },
] as const

/**
 * Tính toán thông tin niên lịch và thời khắc trong ngày game
 */
export function getGameCalendarInfo(
  currentDay: number,
  dayFraction = 0
): GameCalendarInfo {
  const safeDay = Math.max(1, Math.floor(currentDay))
  const safeFraction = Math.max(0, Math.min(0.9999, isNaN(dayFraction) ? 0 : dayFraction))

  // 1. Tính toán Giờ : Phút trong ngày
  const totalMinutes = Math.floor(safeFraction * 24 * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`

  // 2. Xác định Buổi trong ngày
  let cycleKey: "dawn" | "afternoon" | "evening" | "night" = "dawn"
  let cycleName = "Buổi Sáng"
  let cycleDesc = "Ánh bình minh tinh vân, hạm đội tuần tra xuất kích"
  let cycleColor = "text-amber-400"

  if (hours >= 5 && hours < 12) {
    cycleKey = "dawn"
    cycleName = "Buổi Sáng"
    cycleDesc = "Bình minh tinh vân, mạng lưới liên lạc phục hồi"
    cycleColor = "text-amber-300"
  } else if (hours >= 12 && hours < 18) {
    cycleKey = "afternoon"
    cycleName = "Buổi Chiều"
    cycleDesc = "Đỉnh triều plasma, công xưởng vận hành tối đa"
    cycleColor = "text-cyan-300"
  } else if (hours >= 18 && hours < 22) {
    cycleKey = "evening"
    cycleName = "Buổi Tối"
    cycleDesc = "Hoàng hôn buông xuống, các trạm phòng thủ tăng cường cảnh giới"
    cycleColor = "text-rose-400"
  } else {
    cycleKey = "night"
    cycleName = "Ban Đêm"
    cycleDesc = "Không gian tĩnh lặng, hệ thống radar quét sâu"
    cycleColor = "text-indigo-400"
  }

  // 3. Niên lịch Ngày / Tháng / Mùa / Năm
  const dayIndex = safeDay - 1
  const year = Math.floor(dayIndex / 360) + 1
  const dayOfYear = (dayIndex % 360) + 1
  const month = Math.floor((dayOfYear - 1) / 30) + 1
  const dayOfMonth = ((dayOfYear - 1) % 30) + 1

  const seasonIndex = Math.min(3, Math.floor((month - 1) / 3))
  const season = SEASONS[seasonIndex]

  const monthName = `Tháng ${month.toString().padStart(2, "0")}`
  const formattedDate = `Ngày ${dayOfMonth.toString().padStart(2, "0")}, ${monthName} (Năm ${year.toString().padStart(2, "0")})`
  const fullSummary = `${formattedDate} · ${season.name} — ${timeString} [${cycleName}]`

  return {
    currentDay: safeDay,
    dayFraction: safeFraction,
    hours,
    minutes,
    timeString,
    cycleKey,
    cycleName,
    cycleDesc,
    cycleColor,
    dayOfMonth,
    month,
    monthName,
    seasonIndex,
    seasonName: season.name,
    seasonIcon: season.icon,
    year,
    formattedDate,
    fullSummary,
  }
}
