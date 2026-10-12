"use client"

import { useState, useMemo } from "react"
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Boxes,
  Building,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Crosshair,
  Database,
  ExternalLink,
  Factory,
  Flame,
  Globe2,
  Hammer,
  HelpCircle,
  Info,
  Layers,
  Lock,
  MapPin,
  Radio,
  RotateCcw,
  Route,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  Truck,
  Users,
  Wheat,
  X,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { playClickSound } from "@/lib/game/audio"
import { getActiveEvents } from "@/lib/game/world/event-engine"
import type {
  WorldState,
  WorldSector,
  SectorStage,
  SectorSovereignty,
  StrategicOrder,
  TroopDeployment,
} from "@/lib/game/world/types"

export interface SectorIntelTheme {
  codeName: string
  category: string
  role: string
  gradient: string
  accentColor: string
  borderGlow: string
  bgPattern: string
  lore: string
  tacticalAdvantage: string
  strategicValue: string
}

export const SECTOR_INTEL_THEMES: Record<string, SectorIntelTheme> = {
  sol_command_hq: {
    codeName: "SEC-01",
    category: "Thủ Phủ Chỉ Huy",
    role: "Trung Tâm Chỉ Huy Tối Cao & Trụ Sở VSS",
    gradient: "from-sky-950 via-slate-900 to-cyan-950",
    accentColor: "#38bdf8",
    borderGlow: "rgba(56, 189, 248, 0.4)",
    bgPattern: "radial-gradient(circle at 30% 20%, rgba(56,189,248,0.2) 0%, transparent 60%)",
    lore: "Tổng hành dinh tối cao của Vanguard Solar Syndicate. Nơi tập trung hội đồng tư lệnh, mạng lưới viễn thông lượng tử quân sự và các học viện đào tạo phi công cơ giáp tinh nhuệ nhất toàn cõi thiên hà.",
    tacticalAdvantage: "Hệ thống phòng thủ vệ tinh đa lớp, mạng lưới liên lạc chiến lược bảo mật tối đa, an ninh kiên cố.",
    strategicValue: "Trung tâm điều phối toàn diện; kiểm soát hạ tầng năng lượng và dữ liệu viễn thông trọng yếu.",
  },
  helios_perimeter: {
    codeName: "SEC-02",
    category: "Vành Đai Năng Lượng",
    role: "Pháo Đài Plasma Quỹ Đạo & Tuyến Vành Trong",
    gradient: "from-amber-950 via-zinc-900 to-yellow-950",
    accentColor: "#fbbf24",
    borderGlow: "rgba(251, 191, 36, 0.4)",
    bgPattern: "radial-gradient(circle at 70% 30%, rgba(251,191,36,0.18) 0%, transparent 60%)",
    lore: "Tổ hợp các tấm thu năng lượng plasma mặt trời khổng lồ và pháo đài tuần tra bảo vệ lối vào hệ Sol. Nơi tiếp năng lượng chính cho toàn bộ các chiến hạm liên minh trước khi xuất kích ra tuyến ngoài.",
    tacticalAdvantage: "Nguồn dự trữ plasma dồi dào, tháp súng cao tần hỗ trợ hỏa lực tầm xa.",
    strategicValue: "Huyết mạch tiếp năng lượng cho hệ thống phòng thủ nội vi VSS; trạm chuyển tiếp quân sự then chốt.",
  },
  mining_outpost_k7: {
    codeName: "SEC-03",
    category: "Công Xưởng Khai Khoáng",
    role: "Mỏ Hợp Kim Titan Sâu & Luyện Kim Nặng",
    gradient: "from-amber-950 via-stone-900 to-orange-950",
    accentColor: "#f97316",
    borderGlow: "rgba(249, 115, 22, 0.4)",
    bgPattern: "radial-gradient(circle at 40% 70%, rgba(249,115,22,0.18) 0%, transparent 60%)",
    lore: "Cơ sở khai khoáng kim loại nặng chủ lực của liên minh. Các máy xúc trọng lực sâu hoạt động liên tục trong lòng các tiểu hành tinh giàu titan và vonfram, cung cấp vật liệu đóng tàu và giáp mecha.",
    tacticalAdvantage: "Hạ tầng luyện kim tại chỗ, công sự đào sâu trong lòng đá chống chịu bắn phá quỹ đạo.",
    strategicValue: "Cung cấp nguyên liệu chế tạo giáp và đạn dược cho toàn bộ lực lượng viễn chinh.",
  },
  asteroid_delta: {
    codeName: "SEC-04",
    category: "Trục Giao Thương Quỹ Đạo",
    role: "Đầu Mối Hàng Hải & Trung Chuyển Tinh Thể",
    gradient: "from-teal-950 via-slate-900 to-zinc-900",
    accentColor: "#2dd4bf",
    borderGlow: "rgba(45, 212, 191, 0.4)",
    bgPattern: "radial-gradient(circle at 60% 40%, rgba(45,212,191,0.15) 0%, transparent 60%)",
    lore: "Mạng lưới các trạm trung chuyển hàng hóa và xưởng lọc quặng nhỏ phân bố rải rác giữa vành đai đá vụn. Nơi các đoàn tàu buôn và hạm đội hậu cần dừng chân tiếp liệu và trao đổi tài nguyên chiến lược.",
    tacticalAdvantage: "Địa hình đá vụn phức tạp cản trở radar đối phương, nhiều hốc ẩn nấp phục kích.",
    strategicValue: "Nút giao thông huyết mạch kết nối Sol HQ với các căn cứ tiền tiêu vành ngoài.",
  },
  nebula_bastion: {
    codeName: "SEC-05",
    category: "Pháo Đài Tinh Vân",
    role: "Tiền Tuyến Phản Kích & Trạm Giám Sát Khí Ion",
    gradient: "from-indigo-950 via-purple-950 to-slate-950",
    accentColor: "#818cf8",
    borderGlow: "rgba(129, 140, 248, 0.4)",
    bgPattern: "radial-gradient(circle at 50% 50%, rgba(129,140,248,0.2) 0%, transparent 65%)",
    lore: "Pháo đài không gian bọc thép kiên cố nằm ẩn sâu trong dải tinh vân khí ion tích điện cao. Căn cứ đồn trú chiến lược của các hạm đội tuần tra hạng nặng và tiêm kích đánh chặn tiền phương.",
    tacticalAdvantage: "Mây tinh vân ion gây nhiễu cảm biến tầm xa của địch, lá chắn cơ giới kiên cố.",
    strategicValue: "Chốt chặn phòng ngự quyết định bảo vệ sườn phía đông của liên minh VSS.",
  },
  waypoint_orion: {
    codeName: "SEC-06",
    category: "Cửa Ngõ Liên Sao",
    role: "Ngã Tư Không Gian & Vùng An Ninh Tranh Chấp",
    gradient: "from-orange-950 via-zinc-900 to-red-950",
    accentColor: "#f59e0b",
    borderGlow: "rgba(245, 158, 11, 0.4)",
    bgPattern: "radial-gradient(circle at 30% 60%, rgba(245,158,11,0.2) 0%, transparent 60%)",
    lore: "Điểm giao cắt chiến lược giữa các xa lộ siêu không gian liên sao. Thường xuyên xảy ra các cuộc chạm trán vũ trang giữa trinh sát liên minh và các toán quân tiên phong của The Void.",
    tacticalAdvantage: "Đa hướng kết nối mở ra nhiều phương án cơ động nhanh, cự ly ngắn tới các điểm nóng.",
    strategicValue: "Nút giao trọng điểm chi phối thế chủ động hành quân toàn thiên hà.",
  },
  shadow_reach: {
    codeName: "SEC-07",
    category: "Tiền Duyên Chiến Đấu",
    role: "Trạm Biên Phòng Không Gian Tối & Tuyến Vây Hãm",
    gradient: "from-red-950 via-neutral-950 to-rose-950",
    accentColor: "#ef4444",
    borderGlow: "rgba(239, 68, 68, 0.4)",
    bgPattern: "radial-gradient(circle at 80% 30%, rgba(239,68,68,0.22) 0%, transparent 60%)",
    lore: "Trạm kiểm soát biên giới bị hạm đội The Void vây hãm nghiêm ngặt. Lực lượng phòng thủ kiên cường đang cầm cự trong các hầm ngầm gia cố, chờ lực lượng cứu viện phá vây.",
    tacticalAdvantage: "Mạng lưới công sự boong-ke ngầm dày đặc, hệ thống phòng thủ thụ động bền bỉ.",
    strategicValue: "Lá chắn trực tiếp ngăn chặn các đợt tiến công thọc sâu của The Void vào vùng lõi.",
  },
  tartarus_breach: {
    codeName: "SEC-08",
    category: "Vết Nứt Hư Không",
    role: "Căn Cứ Đầu Cầu Đột Phá The Void — Mức Đe Dọa Tối Cao",
    gradient: "from-purple-950 via-black to-red-950",
    accentColor: "#c084fc",
    borderGlow: "rgba(192, 132, 252, 0.45)",
    bgPattern: "radial-gradient(circle at 50% 50%, rgba(168,85,247,0.25) 0%, transparent 70%)",
    lore: "Vết nứt không-thời gian khổng lồ nơi hạm đội The Void tràn vào thiên hà. Các kiến trúc sinh cơ kỳ dị và cổng dịch chuyển hắc ám tỏa năng lượng biến dạng làm tê liệt mọi công nghệ truyền thống.",
    tacticalAdvantage: "Hạ tầng quân sự dị chủng của The Void, sức ép tâm linh và nhiễu loạn thời-không.",
    strategicValue: "Mục tiêu tối thượng của chiến dịch; xóa sổ vết nứt là điều kiện tiên quyết để kết thúc chiến tranh.",
  },
  elysium_sanctuary: {
    codeName: "SEC-09",
    category: "Thánh Địa Nghiên Cứu",
    role: "Vòm Sinh Quyển Thủy Canh & Viện Công Nghệ Lượng Tử",
    gradient: "from-emerald-950 via-teal-950 to-slate-900",
    accentColor: "#10b981",
    borderGlow: "rgba(16, 185, 129, 0.4)",
    bgPattern: "radial-gradient(circle at 30% 30%, rgba(16,185,129,0.2) 0%, transparent 60%)",
    lore: "Quần thể trạm quỹ đạo sinh quyển thủy canh và phòng thí nghiệm công nghệ vũ trụ tiên tiến nhất của VSS. Nơi sản xuất nguồn lương thực sinh thái thiết yếu và nghiên cứu các module cơ giáp thế hệ mới.",
    tacticalAdvantage: "Hệ thống bảo an sinh trắc học tối tân, kho trữ dữ liệu chiến thuật được mã hóa đa tầng.",
    strategicValue: "Cung cấp nguồn lương thực chủ lực và đẩy nhanh tốc độ phục hồi quân số sau chiến dịch.",
  },
  abyssal_rift: {
    codeName: "SEC-10",
    category: "Vực Thẳm Dị Thường",
    role: "Cụm Tàn Tích Cổ Đại & Mỏ Tinh Thể Đen Vùng Rìa",
    gradient: "from-violet-950 via-zinc-950 to-indigo-950",
    accentColor: "#a855f7",
    borderGlow: "rgba(168, 85, 247, 0.4)",
    bgPattern: "radial-gradient(circle at 70% 60%, rgba(168,85,247,0.22) 0%, transparent 65%)",
    lore: "Khu vực không gian biến dạng gần hố đen siêu khối lượng, rải rác xác chiến hạm cổ đại từ kỷ nguyên trước. Chứa các mỏ quặng tinh thể đen có mật độ năng lượng cực lớn, hiện là điểm nóng tranh chấp dữ dội.",
    tacticalAdvantage: "Sóng hấp dẫn bất thường bẻ cong quỹ đạo pháo năng lượng, nhiều xác tàu làm vật cản tự nhiên.",
    strategicValue: "Kho tàng công nghệ tiền sử và nguồn tinh thể đen dồi dào có thể xoay chuyển cục diện cuộc chiến.",
  },
}

interface SectorIntelModalProps {
  isOpen: boolean
  onClose: () => void
  sectorId: string
  worldState: WorldState
  onSelectSector?: (sectorId: string) => void
  onNavigateToWarRoom?: (sectorId: string) => void
  onCenterOnMap?: (sectorId: string) => void
  onOpenQuickDispatch?: (sectorId: string) => void
  onDeployCombat?: (sectorId: string) => void
  onUpdateStrategicOrder?: (sectorId: string, order: StrategicOrder) => void
}

export function SectorIntelModal({
  isOpen,
  onClose,
  sectorId,
  worldState,
  onSelectSector,
  onNavigateToWarRoom,
  onCenterOnMap,
  onOpenQuickDispatch,
  onDeployCombat,
  onUpdateStrategicOrder,
}: SectorIntelModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "operations" | "resources">("overview")

  const sectorsList = useMemo(() => Object.values(worldState.sectors || {}), [worldState.sectors])

  const sector = useMemo(() => {
    return worldState.sectors[sectorId] || sectorsList[0] || null
  }, [worldState.sectors, sectorId, sectorsList])

  const theme = useMemo(() => {
    if (!sector) return SECTOR_INTEL_THEMES.sol_command_hq
    return SECTOR_INTEL_THEMES[sector.id] || {
      codeName: "SEC-??",
      category: "Khu Vực Thiên Hà",
      role: "Khu Vực Hoạt Động Chiến Lược",
      gradient: "from-zinc-900 via-slate-900 to-zinc-950",
      accentColor: "#38bdf8",
      borderGlow: "rgba(56, 189, 248, 0.3)",
      bgPattern: "none",
      lore: sector.desc || "Không có hồ sơ lưu trữ chi tiết.",
      tacticalAdvantage: "Vị trí chiến lược ổn định.",
      strategicValue: "Tọa độ phòng thủ và liên lạc.",
    }
  }, [sector])

  const currentIndex = useMemo(() => {
    if (!sector) return 0
    return sectorsList.findIndex((s) => s.id === sector.id)
  }, [sectorsList, sector])

  const prevSector = useMemo(() => {
    if (sectorsList.length === 0) return null
    const prevIdx = (currentIndex - 1 + sectorsList.length) % sectorsList.length
    return sectorsList[prevIdx]
  }, [sectorsList, currentIndex])

  const nextSector = useMemo(() => {
    if (sectorsList.length === 0) return null
    const nextIdx = (currentIndex + 1) % sectorsList.length
    return sectorsList[nextIdx]
  }, [sectorsList, currentIndex])

  // Lực lượng hành quân liên quan đến sector này
  const incomingDeployments = useMemo(() => {
    if (!sector) return []
    return (worldState.activeDeployments || []).filter(
      (d) => d.toSectorId === sector.id && d.status === "in_transit"
    )
  }, [worldState.activeDeployments, sector])

  const outgoingDeployments = useMemo(() => {
    if (!sector) return []
    return (worldState.activeDeployments || []).filter(
      (d) => d.fromSectorId === sector.id && d.status === "in_transit"
    )
  }, [worldState.activeDeployments, sector])

  // Các sự kiện active tại sector này
  const sectorEvents = useMemo(() => {
    if (!sector) return []
    return getActiveEvents(worldState).filter(
      (e) => e.sectorId === sector.id && (e.status === "INIT" || e.status === "PROCESSING")
    )
  }, [worldState, sector])

  // Tuyến đường kết nối
  const connectedRoutes = useMemo(() => {
    if (!sector) return []
    return (worldState.routes || []).filter(
      (r) => r.fromSectorId === sector.id || r.toSectorId === sector.id
    )
  }, [worldState.routes, sector])

  if (!isOpen || !sector) return null

  const threatPct = Math.min(100, Math.round((sector.threatLevel / 1000) * 100))
  const threatTier =
    sector.threatLevel >= 700 ? "high" : sector.threatLevel >= 300 ? "medium" : "low"

  const threatBadge =
    threatTier === "high"
      ? { label: "NGUY HIỂM CAO", color: "text-red-400", border: "border-red-500/50", bg: "bg-red-950/60" }
      : threatTier === "medium"
      ? { label: "CẢNH BÁO", color: "text-amber-400", border: "border-amber-500/50", bg: "bg-amber-950/60" }
      : { label: "AN TOÀN", color: "text-emerald-400", border: "border-emerald-500/50", bg: "bg-emerald-950/60" }

  const sovBadge =
    sector.sovereignty === "vss"
      ? { label: "Liên Minh VSS", color: "text-cyan-400", border: "border-cyan-500/50", bg: "bg-cyan-950/50" }
      : sector.sovereignty === "void"
      ? { label: "Đế Chế The Void", color: "text-red-400", border: "border-red-500/50", bg: "bg-red-950/50" }
      : { label: "Tranh Chấp", color: "text-amber-400", border: "border-amber-500/50", bg: "bg-amber-950/50" }

  const handleSwitchSector = (targetId: string) => {
    playClickSound()
    onSelectSector?.(targetId)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sector-intel-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className={cn(
          "relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-lg border shadow-2xl overflow-hidden font-mono",
          "bg-zinc-950 border-zinc-800 text-zinc-100"
        )}
        style={{
          boxShadow: `0 0 35px ${theme.borderGlow}`,
        }}
      >
        {/* HEADER BACKDROP WITH PROCEDURAL SCI-FI GRAPHICS */}
        <div
          className={cn(
            "relative p-5 border-b border-zinc-800/80 bg-gradient-to-r overflow-hidden select-none",
            theme.gradient
          )}
          style={{
            backgroundImage: theme.bgPattern,
          }}
        >
          {/* Holographic Radar Watermark */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
            <div className="relative size-44 rounded-full border border-current flex items-center justify-center animate-spin-slow">
              <div className="size-28 rounded-full border border-dashed border-current" />
              <div className="size-14 rounded-full border border-current" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Crosshair className="size-20 opacity-40" />
              </div>
            </div>
          </div>

          {/* Top Bar: Sector Carousel Navigator + Close Button */}
          <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border bg-black/50"
                style={{ borderColor: theme.accentColor, color: theme.accentColor }}
              >
                {theme.codeName} · SECTOR INTEL
              </span>
              <span className="text-[11px] text-zinc-400 font-sans hidden sm:inline">
                Hồ Sơ Tình Báo Không Gian
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Carousel Next/Prev */}
              {prevSector && (
                <button
                  type="button"
                  onClick={() => handleSwitchSector(prevSector.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-black/50 hover:bg-black/80 border border-zinc-700 hover:border-zinc-500 text-[10px] text-zinc-300 transition-colors cursor-pointer"
                  title={`Xem ${prevSector.name}`}
                >
                  <ChevronLeft className="size-3.5" />
                  <span className="hidden sm:inline">Trước</span>
                </button>
              )}
              {nextSector && (
                <button
                  type="button"
                  onClick={() => handleSwitchSector(nextSector.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-black/50 hover:bg-black/80 border border-zinc-700 hover:border-zinc-500 text-[10px] text-zinc-300 transition-colors cursor-pointer"
                  title={`Xem ${nextSector.name}`}
                >
                  <span className="hidden sm:inline">Tiếp</span>
                  <ChevronRight className="size-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  playClickSound()
                  onClose()
                }}
                className="size-7 flex items-center justify-center rounded bg-black/60 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer ml-1"
                title="Đóng hồ sơ Sector Intel"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Sector Identity & Title */}
          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2
                id="sector-intel-title"
                className="text-xl sm:text-2xl font-black font-display tracking-wide uppercase text-white"
              >
                {sector.name}
              </h2>

              <span
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold border uppercase shrink-0",
                  sovBadge.bg,
                  sovBadge.color,
                  sovBadge.border
                )}
              >
                {sovBadge.label}
              </span>

              <span
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold border uppercase shrink-0",
                  threatBadge.bg,
                  threatBadge.color,
                  threatBadge.border
                )}
              >
                {threatBadge.label} ({sector.threatLevel}/1000)
              </span>

              {sector.isLockedForCombat && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-red-500/80 bg-red-950/80 text-red-300 uppercase shrink-0 flex items-center gap-1">
                  <Lock className="size-3" />
                  Đang Khóa Combat
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-300/90 font-sans line-clamp-1 max-w-2xl">
              {sector.subtitle}
            </p>
          </div>
        </div>

        {/* 10-SECTOR QUICK SELECTOR RIBBON */}
        <div className="bg-zinc-900/80 border-b border-zinc-800 px-3 py-1.5 flex items-center gap-1 overflow-x-auto text-[10px] scrollbar-thin">
          <span className="text-zinc-500 font-bold uppercase shrink-0 pr-1 text-[9px] flex items-center gap-1">
            <Compass className="size-3 text-cyan-400" />
            10 Sector:
          </span>
          {sectorsList.map((s) => {
            const isSel = s.id === sector.id
            const sTheme = SECTOR_INTEL_THEMES[s.id]
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSwitchSector(s.id)}
                className={cn(
                  "px-2 py-0.5 rounded border transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1",
                  isSel
                    ? "bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                    : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                )}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      s.sovereignty === "vss"
                        ? "#38bdf8"
                        : s.sovereignty === "void"
                        ? "#ef4444"
                        : "#f59e0b",
                  }}
                />
                <span>{sTheme?.codeName || s.name}</span>
                <span className="hidden md:inline font-sans font-normal opacity-80">{s.name}</span>
              </button>
            )
          })}
        </div>

        {/* MODAL TABS */}
        <div className="flex items-center border-b border-zinc-800 bg-zinc-950/90 px-4 text-xs font-bold uppercase">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={cn(
              "py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5",
              activeTab === "overview"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Activity className="size-3.5" />
            <span>Tình Báo & Vị Thế</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("operations")}
            className={cn(
              "py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5",
              activeTab === "operations"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Swords className="size-3.5" />
            <span>
              Hoạt Động & Di Chuyển ({incomingDeployments.length + outgoingDeployments.length + sectorEvents.length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("resources")}
            className={cn(
              "py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5",
              activeTab === "resources"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Boxes className="size-3.5" />
            <span>Kinh Tế & Kho Tiếp Tế</span>
          </button>
        </div>

        {/* BODY CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* TAB 1: OVERVIEW & STRATEGIC POSITION */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Lore & Military Analysis Card */}
              <div className="rounded-md border border-zinc-800 bg-zinc-900/40 p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase text-[11px]">
                  <Radio className="size-3.5" />
                  <span>Báo Cáo Tình Báo Chiến Thuật (Tactical Briefing)</span>
                </div>
                <p className="text-zinc-300 leading-relaxed font-sans text-xs">
                  {theme.lore}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-[11px]">
                  <div>
                    <span className="text-zinc-500 font-bold block">Ưu thế địa hình & Tác chiến:</span>
                    <span className="text-emerald-300 font-sans">{theme.tacticalAdvantage}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-bold block">Giá trị chiến lược thiên hà:</span>
                    <span className="text-cyan-300 font-sans">{theme.strategicValue}</span>
                  </div>
                </div>
              </div>

              {/* Core Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Metric 1: Threat Meter */}
                <div className="rounded border border-zinc-800 bg-zinc-900/60 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="uppercase font-bold">Mức Đe Dọa</span>
                    <Flame className={cn("size-3.5", threatBadge.color)} />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={cn("text-lg font-black font-display", threatBadge.color)}>
                      {sector.threatLevel}
                    </span>
                    <span className="text-[10px] text-zinc-500">/ 1000</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-950 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        threatTier === "high"
                          ? "bg-red-500"
                          : threatTier === "medium"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      )}
                      style={{ width: `${threatPct}%` }}
                    />
                  </div>
                </div>

                {/* Metric 2: Garrison Power */}
                <div className="rounded border border-zinc-800 bg-zinc-900/60 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="uppercase font-bold">Quân Đồn Trú</span>
                    <Shield className="size-3.5 text-cyan-400" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black font-display text-cyan-300">
                      {sector.garrisonPower}
                    </span>
                    <span className="text-[10px] text-zinc-500">quân</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                    <span>Công sự: Cấp {sector.fortificationLevel ?? 1}</span>
                    <span className="uppercase text-cyan-400 font-bold">[{sector.strategicOrder || "normal"}]</span>
                  </div>
                </div>

                {/* Metric 3: Stability */}
                <div className="rounded border border-zinc-800 bg-zinc-900/60 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="uppercase font-bold">Độ Ổn Định</span>
                    <Activity className="size-3.5 text-emerald-400" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black font-display text-emerald-300">
                      {sector.stability}%
                    </span>
                    <span className="text-[10px] text-zinc-500">dân sự</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-950 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(100, sector.stability)}%` }}
                    />
                  </div>
                </div>

                {/* Metric 4: Population & Industry */}
                <div className="rounded border border-zinc-800 bg-zinc-900/60 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="uppercase font-bold">Quy Mô Dân Số</span>
                    <Users className="size-3.5 text-indigo-400" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black font-display text-indigo-300">
                      {sector.population.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-zinc-500">dân cư</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                    <span>Công suất CN:</span>
                    <span className="text-amber-300 font-bold">{sector.industryCapacity} CS</span>
                  </div>
                </div>
              </div>

              {/* Connected Hyperlanes Status */}
              <div className="rounded border border-zinc-800 bg-zinc-900/30 p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-300 font-bold uppercase flex items-center gap-1.5">
                    <Route className="size-3.5 text-cyan-400" />
                    Mạng Lưới Tuyến Siêu Không Gian Kết Nối ({connectedRoutes.length} Tuyến)
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Khoảng cách & Trạng thái lưu thông
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {connectedRoutes.map((route) => {
                    const otherSectorId =
                      route.fromSectorId === sector.id ? route.toSectorId : route.fromSectorId
                    const otherSector = worldState.sectors[otherSectorId]
                    const otherName = otherSector?.name || otherSectorId

                    const isBlocked = route.state === "blocked"
                    const isHazardous = route.state === "hazardous"

                    return (
                      <div
                        key={route.id}
                        className={cn(
                          "flex items-center justify-between p-2 rounded border bg-zinc-950/60",
                          isBlocked
                            ? "border-red-900/50 text-red-300"
                            : isHazardous
                            ? "border-amber-900/50 text-amber-300"
                            : "border-zinc-800 text-zinc-300"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={cn(
                              "size-2 rounded-full shrink-0",
                              isBlocked
                                ? "bg-red-500"
                                : isHazardous
                                ? "bg-amber-500"
                                : "bg-cyan-400"
                            )}
                          />
                          <span className="font-sans font-medium truncate">{otherName}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[10px] shrink-0 ml-2">
                          <span>{route.distance} ngày</span>
                          <span
                            className={cn(
                              "px-1.5 py-0.2 rounded uppercase font-bold",
                              isBlocked
                                ? "bg-red-950 text-red-400"
                                : isHazardous
                                ? "bg-amber-950 text-amber-400"
                                : "bg-cyan-950 text-cyan-400"
                            )}
                          >
                            {route.state}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE OPERATIONS & MOVEMENTS */}
          {activeTab === "operations" && (
            <div className="space-y-3.5">
              {/* Section 1: Active Events at this Sector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] pb-1 border-b border-zinc-800">
                  <span className="text-amber-400 font-bold uppercase flex items-center gap-1.5">
                    <AlertOctagon className="size-3.5 text-amber-400" />
                    Sự Kiện & Khủng Hoảng Đang Diễn Ra ({sectorEvents.length})
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Cần chỉ đạo hoặc đang trong tiến trình xử lý
                  </span>
                </div>

                {sectorEvents.length === 0 ? (
                  <div className="p-4 rounded border border-dashed border-zinc-800 text-center text-zinc-500 text-xs">
                    Không có sự kiện bất thường hoặc khủng hoảng tại sector này.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sectorEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className={cn(
                          "rounded border p-3 space-y-1.5",
                          evt.status === "INIT"
                            ? "border-amber-500/50 bg-amber-950/20"
                            : "border-cyan-500/40 bg-cyan-950/20"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-amber-200 text-xs truncate">
                            {evt.title}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                              evt.status === "INIT"
                                ? "bg-amber-900/60 text-amber-300 border border-amber-500/50"
                                : "bg-cyan-900/60 text-cyan-300 border border-cyan-500/50"
                            )}
                          >
                            [{evt.status}] {evt.status === "INIT" ? "Cần Ra Quyết Định" : "Đang Xử Lý"}
                          </span>
                        </div>
                        <p className="text-zinc-300 text-[11px] font-sans leading-relaxed">
                          {evt.description}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                          <span>Phân loại: [{evt.category.toUpperCase()}] · Cấp độ {evt.severity}</span>
                          <span>Hạn chót: Tick Ngày {evt.decisionDeadlineTick}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Fleet & Troop Movements */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-[11px] pb-1 border-b border-zinc-800">
                  <span className="text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                    <Truck className="size-3.5 text-cyan-400" />
                    Lực Lượng Hành Quân & Chi Viện ({incomingDeployments.length + outgoingDeployments.length})
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Theo dõi các đoàn quân chuyển bánh trên siêu không gian
                  </span>
                </div>

                {incomingDeployments.length === 0 && outgoingDeployments.length === 0 ? (
                  <div className="p-4 rounded border border-dashed border-zinc-800 text-center text-zinc-500 text-xs">
                    Hiện không có đoàn quân nào đang hành quân đến hoặc đi từ sector này.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Incoming */}
                    {incomingDeployments.map((dep) => {
                      const fromSec = worldState.sectors[dep.fromSectorId]
                      return (
                        <div
                          key={dep.deploymentId}
                          className="rounded border border-cyan-500/40 bg-cyan-950/20 p-2.5 space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-cyan-300 font-bold flex items-center gap-1">
                              <span>🚚</span> Chi viện ĐANG ĐẾN
                            </span>
                            <span className="text-zinc-400">Còn {dep.remainingDays} ngày</span>
                          </div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>+{dep.troopCount} quân</span>
                            <span className="text-zinc-500 text-[10px] font-normal">
                              từ {fromSec?.name || dep.fromSectorId}
                            </span>
                          </div>
                        </div>
                      )
                    })}

                    {/* Outgoing */}
                    {outgoingDeployments.map((dep) => {
                      const toSec = worldState.sectors[dep.toSectorId]
                      return (
                        <div
                          key={dep.deploymentId}
                          className="rounded border border-zinc-700 bg-zinc-900/30 p-2.5 space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-amber-300 font-bold flex items-center gap-1">
                              <span>🛫</span> Quân ĐANG RỜI ĐI
                            </span>
                            <span className="text-zinc-400">Còn {dep.remainingDays} ngày</span>
                          </div>
                          <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                            <span>{dep.troopCount} quân</span>
                            <span className="text-zinc-500 text-[10px] font-normal">
                              hướng tới {toSec?.name || dep.toSectorId}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ECONOMY & IN-SITU RESOURCES */}
          {activeTab === "resources" && (
            <div className="space-y-4">
              <div className="rounded border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
                <span className="text-zinc-300 font-bold uppercase text-[11px] block">
                  Kho Dự Trữ Chiến Lược Tại Chỗ (In-Situ Logistics Stockpile)
                </span>
                <p className="text-zinc-400 font-sans text-xs">
                  Mỗi sector duy trì kho hậu cần độc lập phục vụ nhu cầu dân sinh và duy trì lực lượng đồn trú tại chỗ.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 text-xs">
                  {/* Food */}
                  <div className="rounded border border-emerald-500/40 bg-emerald-950/20 p-2.5 space-y-1">
                    <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] uppercase">
                      <Wheat className="size-3" />
                      Lương Thực
                    </div>
                    <div className="text-lg font-black font-display text-emerald-300">
                      {sector.resources.food.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-zinc-500">Tiêu thụ dân sự</div>
                  </div>

                  {/* Energy */}
                  <div className="rounded border border-cyan-500/40 bg-cyan-950/20 p-2.5 space-y-1">
                    <div className="flex items-center gap-1 text-cyan-400 font-bold text-[10px] uppercase">
                      <Zap className="size-3" />
                      Năng Lượng
                    </div>
                    <div className="text-lg font-black font-display text-cyan-300">
                      {sector.resources.energy.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-zinc-500">Plasma & Khiên</div>
                  </div>

                  {/* Materials */}
                  <div className="rounded border border-amber-500/40 bg-amber-950/20 p-2.5 space-y-1">
                    <div className="flex items-center gap-1 text-amber-400 font-bold text-[10px] uppercase">
                      <Boxes className="size-3" />
                      Vật Liệu
                    </div>
                    <div className="text-lg font-black font-display text-amber-300">
                      {sector.resources.industrialMaterials.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-zinc-500">Titan & Công sự</div>
                  </div>

                  {/* Tactical Data */}
                  <div className="rounded border border-indigo-500/40 bg-indigo-950/20 p-2.5 space-y-1">
                    <div className="flex items-center gap-1 text-indigo-400 font-bold text-[10px] uppercase">
                      <Database className="size-3" />
                      Dữ Liệu
                    </div>
                    <div className="text-lg font-black font-display text-indigo-300">
                      {sector.resources.tacticalData.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-zinc-500">Mã hóa radar</div>
                  </div>

                  {/* Logistics Supplies */}
                  <div className="rounded border border-purple-500/40 bg-purple-950/20 p-2.5 space-y-1 col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-1 text-purple-400 font-bold text-[10px] uppercase">
                      <Truck className="size-3" />
                      Vật Tư Tiếp Tế
                    </div>
                    <div className="text-lg font-black font-display text-purple-300">
                      {sector.resources.logisticsSupplies.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-zinc-500">Đạn dược & Sơ tán</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS BAR */}
        <div className="border-t border-zinc-800 bg-zinc-950/95 px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="text-[11px] text-zinc-400 font-sans hidden md:block">
            Tọa độ: <strong className="text-zinc-200">X:{sector.x}% · Y:{sector.y}%</strong>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
            {/* Action 1: Deploy Combat */}
            {onDeployCombat && (
              <button
                type="button"
                onClick={() => {
                  playClickSound()
                  onClose()
                  onDeployCombat(sector.id)
                }}
                disabled={sector.stage === "normal" && !sector.isLockedForCombat}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5",
                  sector.stage !== "normal" || sector.isLockedForCombat
                    ? "bg-red-950/80 hover:bg-red-900 border border-red-500/70 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed opacity-50"
                )}
                title={sector.stage === "normal" ? "Chưa có giao tranh tại sector này" : "Xuất kích cơ giáp"}
              >
                <Swords className="size-3.5 text-red-400" />
                <span>Xuất Kích Tác Chiến</span>
              </button>
            )}

            {/* Action 2: Quick Dispatch */}
            {onOpenQuickDispatch && (
              <button
                type="button"
                onClick={() => {
                  playClickSound()
                  onClose()
                  onOpenQuickDispatch(sector.id)
                }}
                disabled={sector.isLockedForCombat}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5",
                  sector.isLockedForCombat
                    ? "bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed opacity-50"
                    : "bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/60 text-cyan-200"
                )}
              >
                <Truck className="size-3.5 text-cyan-400" />
                <span>Điều Động Chi Viện</span>
              </button>
            )}

            {/* Action 3: Focus on Map */}
            {onCenterOnMap && (
              <button
                type="button"
                onClick={() => {
                  playClickSound()
                  onClose()
                  onCenterOnMap(sector.id)
                }}
                className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Crosshair className="size-3.5 text-cyan-400" />
                <span>Tập Trung Bản Đồ</span>
              </button>
            )}

            {/* Action 4: Navigate to War Room */}
            {onNavigateToWarRoom && (
              <button
                type="button"
                onClick={() => {
                  playClickSound()
                  onClose()
                  onNavigateToWarRoom(sector.id)
                }}
                className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-cyan-500/30"
              >
                <ExternalLink className="size-3.5" />
                <span>Mở Trong War Room</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
