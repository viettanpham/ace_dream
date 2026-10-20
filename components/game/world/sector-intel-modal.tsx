"use client"

import { useState, useMemo } from "react"
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Anchor,
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
import { getSectorMaxThreat } from "@/lib/game/world/threat-engine"
import type {
  WorldState,
  WorldSector,
  SectorStage,
  SectorSovereignty,
  StrategicOrder,
  TroopDeployment,
} from "@/lib/game/world/types"
import {
  DEFAULT_WORLD_GENERATION_CONFIG,
  SYSTEM_HUB_SPECIALIZATION_DEFINITIONS,
  SYSTEM_ORBITAL_SUB_BASE_DEFINITIONS,
  applyCommanderBaseOverride,
  clearCommanderBaseOverride,
  createOrbitalSubBase,
  evaluateBaseEconomyForecast,
  evaluateFleetCapacities,
  type ExtendedBaseEntityState,
  type OrbitalSubBaseState,
} from "@/lib/game/world/base"
import { SYSTEM_DEFAULT_BUILDING_DEFINITIONS } from "@/lib/game/world/building/seed-data"
import { saveWorldState } from "@/lib/game/world/storage"
import { ensureWorldFleetsInitialized } from "@/lib/game/world/fleet/fleet-entity"

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
  onOpenFleetCommand?: (fleetId: string) => void
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
  onOpenFleetCommand,
}: SectorIntelModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "operations" | "resources" | "base_fnd6" | "fleets_fnd7">("overview")
  const [, setLocalMutationTick] = useState(0)

  const sectorsList = useMemo(() => Object.values(worldState.sectors || {}), [worldState.sectors])

  const sector = useMemo(() => {
    return worldState.sectors[sectorId] || sectorsList[0] || null
  }, [worldState.sectors, sectorId, sectorsList])

  const sectorFleets = useMemo(() => {
    if (!sector) return []
    const allFleets = worldState.fleets && Object.keys(worldState.fleets).length > 0
      ? Object.values(worldState.fleets)
      : Object.values(ensureWorldFleetsInitialized(worldState))
    return allFleets.filter((f) => f.currentLocation.sectorId === sector.id)
  }, [worldState.fleets, worldState, sector])

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

  const baseEntity = (worldState.bases?.[sector.id] as ExtendedBaseEntityState | undefined)
  const popState = worldState.basePopulationStates?.[sector.id]
  const attachedSubBases: OrbitalSubBaseState[] = (baseEntity?.orbitalSubBaseIds || [])
    .map((id) => worldState.orbitalSubBases?.[id])
    .filter((sb): sb is OrbitalSubBaseState => Boolean(sb))

  const economyForecast =
    baseEntity?.economyForecast ||
    (baseEntity
      ? evaluateBaseEconomyForecast(
          baseEntity,
          popState,
          SYSTEM_DEFAULT_BUILDING_DEFINITIONS,
          worldState.currentDay || 1
        )
      : undefined)

  const fleetCaps =
    baseEntity?.fleetCapacities ||
    (baseEntity
      ? evaluateFleetCapacities(
          sector.id,
          baseEntity.baseType,
          Boolean(baseEntity.isCapital),
          baseEntity.tier || 1,
          baseEntity.buildings || {},
          attachedSubBases,
          baseEntity.hubSpecializations || []
        )
      : undefined)

  const buildingDefMap = new Map(SYSTEM_DEFAULT_BUILDING_DEFINITIONS.map((d) => [d.id, d]))

  const maxThreat = getSectorMaxThreat(sector, worldState.threatConfig)
  const threatRatio = maxThreat > 0 ? sector.threatLevel / maxThreat : 0
  const threatPct = Math.min(100, Math.round(threatRatio * 100))
  const threatTier =
    threatRatio >= 0.7 || (maxThreat <= 1000 && sector.threatLevel >= 700)
      ? "high"
      : threatRatio >= 0.3 || (maxThreat <= 1000 && sector.threatLevel >= 300)
      ? "medium"
      : "low"

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
                {threatBadge.label} ({sector.threatLevel.toLocaleString()} / {maxThreat.toLocaleString()})
              </span>

              {baseEntity && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-cyan-500/60 bg-cyan-950/70 text-cyan-200 uppercase shrink-0">
                  {baseEntity.isCapital ? "👑 CC0 CAPITAL" : baseEntity.entityKind} · MK {baseEntity.tier} · {baseEntity.baseType}
                </span>
              )}

              {baseEntity && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-500/50 bg-indigo-950/60 text-indigo-200 uppercase shrink-0">
                  ⚡ {baseEntity.nationalPowerScore?.toLocaleString() || 0} PWR ({baseEntity.nationalPowerSharePercent || 0}%)
                </span>
              )}

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

        {/* 30-SECTOR QUICK SELECTOR RIBBON */}
        <div className="bg-zinc-900/80 border-b border-zinc-800 px-3 py-1.5 flex items-center gap-1 overflow-x-auto text-[10px] scrollbar-thin">
          <span className="text-zinc-500 font-bold uppercase shrink-0 pr-1 text-[9px] flex items-center gap-1">
            <Compass className="size-3 text-cyan-400" />
            {sectorsList.length} Sector:
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
            <span>Kinh Tế & Dự Báo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("base_fnd6")}
            className={cn(
              "py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5",
              activeTab === "base_fnd6"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Building className="size-3.5" />
            <span>Căn Cứ, Hub & Quỹ Đạo (FND-6)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("fleets_fnd7")}
            className={cn(
              "py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5",
              activeTab === "fleets_fnd7"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Compass className="size-3.5 text-cyan-400" />
            <span>Hạm Đội Đồn Trú & Cập Cảng ({sectorFleets.length})</span>
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
                      {sector.threatLevel.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-zinc-500">/ {maxThreat.toLocaleString()}</span>
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

              {/* FND-6 Base Economy Forecast (Production/Day, Consumption/Day, Net/Day, Days of Supply) */}
              {economyForecast && (
                <div className="rounded border border-zinc-800 bg-zinc-900/40 p-3 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-cyan-400 font-bold uppercase text-[11px] flex items-center gap-1.5">
                      <Activity className="size-3.5" />
                      Dự Báo Tự Cung Tự Cấp & Chuỗi Tiếp Vận (Base Economy Forecast)
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Cập nhật Ngày {economyForecast.calculatedAtGameDay}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                          <th className="py-1.5 px-2">Tài Nguyên</th>
                          <th className="py-1.5 px-2 text-right">Tồn Kho</th>
                          <th className="py-1.5 px-2 text-right">Sản Xuất / Ngày</th>
                          <th className="py-1.5 px-2 text-right">Tiêu Thụ / Ngày</th>
                          <th className="py-1.5 px-2 text-right">Ròng (Net/Day)</th>
                          <th className="py-1.5 px-2 text-right">Số Ngày Đủ Dùng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 font-mono">
                        {(["food", "energy", "industrialMaterials", "logisticsSupplies", "tacticalData"] as const).map(
                          (resKey) => {
                            const labelMap: Record<string, string> = {
                              food: "Lương Thực (Food)",
                              energy: "Năng Lượng (Energy)",
                              industrialMaterials: "Vật Liệu CN (Materials)",
                              logisticsSupplies: "Vật Tư Hậu Cần (Supplies)",
                              tacticalData: "Dữ Liệu Chiến Thuật (Data)",
                            }
                            const stock = (baseEntity?.sharedStorage?.[resKey] ?? (sector.resources as any)[resKey]) || 0
                            const prod = economyForecast.productionPerDay[resKey] || 0
                            const cons = economyForecast.consumptionPerDay[resKey] || 0
                            const net = economyForecast.netPerDay[resKey] || 0
                            const days = economyForecast.daysOfSupply[resKey] ?? 999

                            return (
                              <tr key={resKey} className="hover:bg-zinc-900/50">
                                <td className="py-1.5 px-2 font-sans font-bold text-zinc-200">{labelMap[resKey]}</td>
                                <td className="py-1.5 px-2 text-right text-zinc-300">{stock.toLocaleString()}</td>
                                <td className="py-1.5 px-2 text-right text-emerald-400">+{prod}</td>
                                <td className="py-1.5 px-2 text-right text-rose-400">-{cons}</td>
                                <td
                                  className={cn(
                                    "py-1.5 px-2 text-right font-bold",
                                    net > 0 ? "text-emerald-400" : net < 0 ? "text-amber-400" : "text-zinc-400"
                                  )}
                                >
                                  {net >= 0 ? `+${net}` : net}
                                </td>
                                <td className="py-1.5 px-2 text-right">
                                  <span
                                    className={cn(
                                      "px-1.5 py-0.5 rounded text-[10px] font-bold",
                                      days >= 999
                                        ? "bg-emerald-950/60 text-emerald-300"
                                        : days <= 5
                                        ? "bg-red-950/80 text-red-300"
                                        : "bg-amber-950/70 text-amber-300"
                                    )}
                                  >
                                    {days >= 999 ? "Ổn định (∞)" : `${days} ngày`}
                                  </span>
                                </td>
                              </tr>
                            )
                          }
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Deficit Warnings */}
                  {economyForecast.deficitsPredicted.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold uppercase text-amber-400 block">
                        Cảnh Báo Thiếu Hụt Dự Báo ({economyForecast.deficitsPredicted.length}):
                      </span>
                      {economyForecast.deficitsPredicted.map((warn, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "p-2 rounded border text-[11px] flex items-center justify-between",
                            warn.severity === "CRITICAL"
                              ? "border-red-500/50 bg-red-950/30 text-red-200"
                              : "border-amber-500/40 bg-amber-950/20 text-amber-200"
                          )}
                        >
                          <span>{warn.message}</span>
                          <span className="font-bold uppercase text-[10px] px-1.5 py-0.5 rounded bg-black/40">
                            {warn.severity} · Còn {warn.daysRemaining} ngày
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FND-6 BASE, HUB, CAPITAL & ORBITAL INFRASTRUCTURE */}
          {activeTab === "base_fnd6" && baseEntity && (
            <div className="space-y-4">
              {/* 1. Base Identity, Fleet Capacities & Expansion Slots Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Base Classification Card */}
                <div className="rounded border border-cyan-500/40 bg-cyan-950/15 p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold uppercase">
                    <span>Phân Hạng Căn Cứ (FND-6)</span>
                    <span>{baseEntity.entityKind}</span>
                  </div>
                  <div className="text-sm font-black text-white">
                    {baseEntity.isCapital ? "👑 Thủ Phủ Tối Cao (CC0)" : `Căn Cứ ${baseEntity.baseType}`}
                  </div>
                  <div className="text-[11px] text-zinc-300 space-y-0.5 font-sans">
                    <div>Vai trò chiến lược: <strong className="text-cyan-300">{baseEntity.strategicRole}</strong></div>
                    <div>Cấp bậc công nghệ: <strong className="text-amber-300">MK {baseEntity.tier}</strong> {baseEntity.maxTierBonusApplied ? "(MAX TIER BONUS)" : ""}</div>
                    <div>Điểm sức mạnh QG: <strong className="text-indigo-300">{baseEntity.nationalPowerScore.toLocaleString()} ({baseEntity.nationalPowerSharePercent}%)</strong></div>
                  </div>
                </div>

                {/* Fleet Capacities Card */}
                {fleetCaps && (
                  <div className="rounded border border-indigo-500/40 bg-indigo-950/15 p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-indigo-400 font-bold uppercase">
                      <span>Năng Lực Hạm Đội Độc Lập</span>
                      <span>3 Trục Tách Biệt</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                      <div className="rounded bg-black/40 p-1.5 border border-zinc-800">
                        <div className="text-sm font-black text-cyan-300">{fleetCaps.fleetCommandCapacity}</div>
                        <div className="text-[9px] text-zinc-400">Chỉ Huy</div>
                      </div>
                      <div className="rounded bg-black/40 p-1.5 border border-zinc-800">
                        <div className="text-sm font-black text-emerald-300">{fleetCaps.fleetStationingCapacity}</div>
                        <div className="text-[9px] text-zinc-400">Đồn Trú</div>
                      </div>
                      <div className="rounded bg-black/40 p-1.5 border border-zinc-800">
                        <div className="text-sm font-black text-amber-300">{fleetCaps.fleetDockingCapacity}</div>
                        <div className="text-[9px] text-zinc-400">Cập Cảng</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-400 pt-0.5 flex items-center justify-between">
                      <span>Dock gốc: <strong className="text-zinc-200">{fleetCaps.baseDockingPorts}</strong> (2..8)</span>
                      <span>Mở rộng: <strong className="text-zinc-200">+{fleetCaps.expansionDockingPorts}</strong></span>
                      <span>Quỹ đạo: <strong className="text-cyan-300">+{fleetCaps.subBaseDockingPorts}</strong></span>
                    </div>
                  </div>
                )}

                {/* Core vs Expansion Slots Invariant Card */}
                <div className="rounded border border-emerald-500/40 bg-emerald-950/15 p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold uppercase">
                    <span>Quỹ Đất & Slot Công Trình</span>
                    <span>Zero Double-Count</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-0.5">
                    <div>
                      <span className="text-lg font-black text-emerald-300">
                        {baseEntity.expansionBuildingIds.length} / {baseEntity.maxExpansionSlots}
                      </span>
                      <span className="text-[10px] text-zinc-400 ml-1">Slot Mở Rộng</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-[10px] text-emerald-300 font-bold">
                      {baseEntity.coreBuildingIds.length} Core (0 Slot)
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-sans">
                    Core Facilities là BuildingInstance thực tế nhưng <strong className="text-emerald-300">không tiêu thụ</strong> Slot mở rộng.
                  </div>
                </div>
              </div>

              {/* 2. Core Facilities & Expansion Buildings List */}
              <div className="rounded border border-zinc-800 bg-zinc-900/40 p-3 space-y-2.5">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-cyan-300 font-bold uppercase text-[11px] flex items-center gap-1.5">
                    <Factory className="size-3.5 text-cyan-400" />
                    Tổ Hợp Công Trình Cốt Lõi & Mở Rộng ({Object.keys(baseEntity.buildings || {}).length} Công Trình)
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Profile: {baseEntity.slotProfileId}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.values(baseEntity.buildings || {}).map((bld) => {
                    const def = buildingDefMap.get(bld.definitionId)
                    const isCore = baseEntity.coreBuildingIds.includes(bld.instanceId) || Boolean(def?.isCoreFacility)
                    return (
                      <div
                        key={bld.instanceId}
                        className={cn(
                          "rounded border p-2.5 flex items-center justify-between gap-2",
                          isCore
                            ? "border-cyan-500/30 bg-cyan-950/15"
                            : "border-zinc-800 bg-zinc-950/60"
                        )}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-zinc-100 text-xs truncate">
                              {def?.name || bld.definitionId}
                            </span>
                            <span
                              className={cn(
                                "px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0",
                                isCore
                                  ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40"
                                  : "bg-amber-950 text-amber-300 border border-amber-500/40"
                              )}
                            >
                              {isCore ? "CORE (0 SLOT)" : "EXPANSION"}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            Lv.{bld.currentLevel} · MK {bld.currentTier} · HP {bld.currentHp}/{bld.maxHp} · Nhân sự: {bld.assignedPersonnel}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold shrink-0">
                          {bld.operationalState}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 3. Orbital Sub-Base Network */}
              <div className="rounded border border-zinc-800 bg-zinc-900/40 p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                  <div>
                    <span className="text-indigo-300 font-bold uppercase text-[11px] flex items-center gap-1.5">
                      <Globe2 className="size-3.5 text-indigo-400" />
                      Mạng Lưới Căn Cứ Vệ Tinh Quỹ Đạo (Orbital Sub-Bases: {attachedSubBases.length} / {baseEntity.maxOrbitalSlots} Slots)
                    </span>
                    <span className="text-[10px] text-zinc-400 block font-sans">
                      {baseEntity.isCapital
                        ? "Thủ phủ CC0 mở rộng từ MK I = 2 đến MK X = 12 (gồm +1 MAX TIER BONUS). Không tính vào 30 Main Base Nodes."
                        : "Căn cứ thường giới hạn tối đa 3 Orbital Sub-Base Slots."}
                    </span>
                  </div>

                  {attachedSubBases.length < baseEntity.maxOrbitalSlots && (
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound()
                        const newSub = createOrbitalSubBase(
                          sector.id,
                          "DEFENSE_PLATFORM",
                          `Pháo Đài Quỹ Đạo ${sector.name} #${attachedSubBases.length + 1}`,
                          baseEntity.tier
                        )
                        if (!worldState.orbitalSubBases) worldState.orbitalSubBases = {}
                        worldState.orbitalSubBases[newSub.subBaseId] = newSub
                        baseEntity.orbitalSubBaseIds.push(newSub.subBaseId)
                        baseEntity.fleetCapacities = evaluateFleetCapacities(
                          sector.id,
                          baseEntity.baseType,
                          baseEntity.isCapital,
                          baseEntity.tier,
                          baseEntity.buildings,
                          [...attachedSubBases, newSub],
                          baseEntity.hubSpecializations
                        )
                        saveWorldState(worldState)
                        setLocalMutationTick((t) => t + 1)
                      }}
                      className="px-2.5 py-1 rounded bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-400/60 text-indigo-100 text-[10px] font-bold uppercase cursor-pointer"
                    >
                      + Triển Khai Trạm Quỹ Đạo Mới
                    </button>
                  )}
                </div>

                {attachedSubBases.length === 0 ? (
                  <div className="p-3 rounded border border-dashed border-zinc-800 text-center text-zinc-500 text-xs">
                    Chưa có trạm vệ tinh quỹ đạo nào được triển khai quanh căn cứ này.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {attachedSubBases.map((sb) => {
                      const sbDef = SYSTEM_ORBITAL_SUB_BASE_DEFINITIONS[sb.subBaseType]
                      return (
                        <div
                          key={sb.subBaseId}
                          className="rounded border border-indigo-500/40 bg-indigo-950/15 p-3 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-200 text-xs">{sb.name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-500/40 text-indigo-300 text-[9px] font-bold uppercase">
                              SUB_BASE · MK {sb.tier}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-300 font-sans">
                            {sbDef?.name || sb.subBaseType} — Dock riêng: <strong className="text-cyan-300">+{sb.dockingCapacity}</strong> · Phòng thủ: <strong className="text-amber-300">{sb.defenseRating}</strong>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-indigo-900/40">
                            <span>Core Facilities: <strong className="text-emerald-300">{sb.coreBuildingIds.length} (0 Slot)</strong></span>
                            <span>Expansion Slots: <strong className="text-indigo-200">{sb.expansionBuildingIds.length} / {sb.maxExpansionSlots}</strong></span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* 4. Hub Specializations & Local Government AI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Hub Specializations */}
                <div className="rounded border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-amber-300 font-bold uppercase text-[11px] flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-amber-400" />
                      Chuyên Môn Hóa Hub ({baseEntity.hubSpecializations.length} / {baseEntity.maxHubSlots} Slots)
                    </span>
                  </div>

                  {baseEntity.hubSpecializations.length === 0 ? (
                    <div className="text-zinc-500 text-xs py-2">
                      Căn cứ chưa kích hoạt Hub chuyên môn hóa.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {baseEntity.hubSpecializations.map((hub) => {
                        const hubDef = SYSTEM_HUB_SPECIALIZATION_DEFINITIONS[hub.hubType]
                        return (
                          <div
                            key={hub.hubType}
                            className="rounded border border-amber-500/30 bg-amber-950/15 p-2.5 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-200 text-xs">
                                {hubDef?.name || hub.hubType}
                              </span>
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                                  hub.status === "ACTIVE"
                                    ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                                    : "bg-zinc-900 text-zinc-400 border border-zinc-700"
                                )}
                              >
                                {hub.status} (+{hub.activeBonusPercent}%)
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-300 font-sans">
                              {hubDef?.description}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Local Government AI & Commander Override */}
                <div className="rounded border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-emerald-300 font-bold uppercase text-[11px] flex items-center gap-1.5">
                      <Shield className="size-3.5 text-emerald-400" />
                      Chính Quyền Tự Chủ AI ({baseEntity.governmentState.aiPersonality})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound()
                        if (baseEntity.governmentState.commanderOverride?.isLocked) {
                          clearCommanderBaseOverride(baseEntity)
                        } else {
                          applyCommanderBaseOverride(
                            baseEntity,
                            "PRIORITY_SHIFT",
                            14,
                            worldState.currentDay || 1,
                            "Chỉ huy Alviss khóa ưu tiên quốc phòng & hậu cần"
                          )
                        }
                        saveWorldState(worldState)
                        setLocalMutationTick((t) => t + 1)
                      }}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase cursor-pointer border",
                        baseEntity.governmentState.commanderOverride?.isLocked
                          ? "bg-amber-950 border-amber-500/60 text-amber-200"
                          : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-cyan-400"
                      )}
                    >
                      {baseEntity.governmentState.commanderOverride?.isLocked
                        ? "🔒 Đang Khóa Override (Mở Khóa)"
                        : "🔓 Khóa Lệnh Tư Lệnh (14 Ngày)"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-1.5 rounded bg-black/40 border border-zinc-800 flex justify-between">
                      <span className="text-zinc-400">An Ninh Lương Thực:</span>
                      <strong className="text-emerald-300">{baseEntity.governmentState.localPriorities.foodSecurity}%</strong>
                    </div>
                    <div className="p-1.5 rounded bg-black/40 border border-zinc-800 flex justify-between">
                      <span className="text-zinc-400">Sẵn Sàng Quân Sự:</span>
                      <strong className="text-cyan-300">{baseEntity.governmentState.localPriorities.militaryReadiness}%</strong>
                    </div>
                    <div className="p-1.5 rounded bg-black/40 border border-zinc-800 flex justify-between">
                      <span className="text-zinc-400">Sản Lượng Công Nghiệp:</span>
                      <strong className="text-amber-300">{baseEntity.governmentState.localPriorities.industrialOutput}%</strong>
                    </div>
                    <div className="p-1.5 rounded bg-black/40 border border-zinc-800 flex justify-between">
                      <span className="text-zinc-400">Mở Rộng Hạ Tầng:</span>
                      <strong className="text-indigo-300">{baseEntity.governmentState.localPriorities.infrastructureGrowth}%</strong>
                    </div>
                  </div>

                  {baseEntity.governmentState.commanderOverride?.isLocked && (
                    <div className="p-2 rounded border border-amber-500/40 bg-amber-950/20 text-[10px] text-amber-200">
                      <strong>Lệnh Tư Lệnh Đang Khóa:</strong> {baseEntity.governmentState.commanderOverride.overrideReason} (Hết hạn Ngày {baseEntity.governmentState.commanderOverride.expiresAtGameDay})
                    </div>
                  )}

                  <div className="text-[10px] text-zinc-400 space-y-0.5 max-h-20 overflow-y-auto pt-1 border-t border-zinc-800/80">
                    {baseEntity.governmentState.actionLogs.slice(-3).map((log, i) => (
                      <div key={i} className="truncate">&bull; {log}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FLEETS DEPLOYED & DOCKED (PHASE 7.7 FND-7) */}
          {activeTab === "fleets_fnd7" && (
            <div className="space-y-4">
              {/* Header Banner */}
              <div className="rounded-md border border-cyan-500/40 bg-cyan-950/20 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
                    <Compass className="size-4 text-cyan-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-cyan-200">
                      LỰC LƯỢNG HẠM ĐỘI ĐỒN TRÚ & CẬP CẢNG ({sectorFleets.length})
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Tọa độ chiến lược: <strong className="text-zinc-200">{sector.name} ({sector.id})</strong>
                    </p>
                  </div>
                </div>

                {onOpenFleetCommand && (
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound()
                      onClose()
                      onOpenFleetCommand(sectorFleets[0]?.fleetId || "")
                    }}
                    className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-cyan-950 flex items-center gap-1.5 shrink-0"
                  >
                    <ExternalLink className="size-3.5" />
                    <span>Mở Bộ Tư Lệnh Hạm Đội</span>
                  </button>
                )}
              </div>

              {/* Fleets List or Empty State */}
              {sectorFleets.length === 0 ? (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-8 text-center space-y-3">
                  <Anchor className="size-8 mx-auto text-zinc-600 opacity-60" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-zinc-300">
                      Không Có Hạm Đội Nào Tại Khu Vực Này
                    </p>
                    <p className="text-xs text-zinc-500 max-w-md mx-auto">
                      Hiện không có hạm đội nào đang đồn trú tuần tra không phận hoặc cập cảng căn cứ tại {sector.name}.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                  {sectorFleets.map((fleet) => {
                    const shipsArray = Object.values(fleet.ships || {})
                    return (
                      <div
                        key={fleet.fleetId}
                        className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-3 hover:border-cyan-500/50 transition-colors"
                      >
                        {/* Fleet Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-cyan-200">{fleet.name}</span>
                              {fleet.customCallsign && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                                  "{fleet.customCallsign}"
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                              {fleet.fleetClassId} &bull; Persona: <span className="text-amber-300">{fleet.aiPersona}</span>
                            </div>
                          </div>

                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold font-mono border",
                              fleet.operationalStatus === "DOCKED"
                                ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-300"
                                : fleet.operationalStatus === "IN_TRANSIT"
                                ? "bg-amber-950/70 border-amber-500/50 text-amber-300"
                                : "bg-cyan-950/70 border-cyan-500/50 text-cyan-300"
                            )}
                          >
                            {fleet.operationalStatus}
                          </span>
                        </div>

                        {/* Metrics Bar */}
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                          <div className="p-1.5 rounded bg-black/40 border border-zinc-800">
                            <span className="text-zinc-500 block">CHIẾN HẠM</span>
                            <span className="font-bold text-cyan-300 text-xs">{shipsArray.length} Tàu</span>
                          </div>
                          <div className="p-1.5 rounded bg-black/40 border border-zinc-800">
                            <span className="text-zinc-500 block">THỦY THỦ ĐOÀN</span>
                            <span className="font-bold text-emerald-300 text-xs">
                              {fleet.personnel?.crewPool?.crewAssigned ?? 0} Quân
                            </span>
                          </div>
                          <div className="p-1.5 rounded bg-black/40 border border-zinc-800">
                            <span className="text-zinc-500 block">SĨ KHÍ</span>
                            <span className="font-bold text-purple-300 text-xs">{fleet.personnel?.morale ?? 100}%</span>
                          </div>
                        </div>

                        {/* Cargo & Treasury Overview */}
                        <div className="flex items-center justify-between text-[11px] font-mono p-2 rounded bg-black/30 border border-zinc-800/80">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400">Lương thực: <b className="text-emerald-400">{fleet.cargo?.food ?? 0}</b></span>
                            <span className="text-zinc-600">&bull;</span>
                            <span className="text-zinc-400">Plasma: <b className="text-amber-400">{fleet.cargo?.energy ?? 0}</b></span>
                          </div>
                          <div className="text-cyan-300 font-bold">
                            {fleet.treasury?.credits?.toLocaleString() ?? 0} Cr
                          </div>
                        </div>

                        {/* Ship Roster Mini Preview */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 font-mono uppercase block">
                            Chiến Hạm Thuộc Biên Chế:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {shipsArray.map((ship) => (
                              <span
                                key={ship.instanceId}
                                className={cn(
                                  "text-[10px] font-mono px-2 py-0.5 rounded border",
                                  fleet.flagshipInstanceId === ship.instanceId
                                    ? "bg-amber-950/40 border-amber-500/50 text-amber-200 font-bold"
                                    : "bg-zinc-800/60 border-zinc-700/60 text-zinc-300"
                                )}
                              >
                                {fleet.flagshipInstanceId === ship.instanceId ? "👑 " : ""}{ship.customName || ship.instanceId} ({ship.condition}%)
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        {onOpenFleetCommand && (
                          <div className="pt-2 border-t border-zinc-800/80 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                playClickSound()
                                onClose()
                                onOpenFleetCommand(fleet.fleetId)
                              }}
                              className="text-[11px] text-cyan-400 hover:text-cyan-200 underline font-semibold cursor-pointer"
                            >
                              Điều Hành Hạm Đội Này &rarr;
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
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
