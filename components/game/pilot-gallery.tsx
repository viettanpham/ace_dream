"use client"

import React, { useMemo, useState } from "react"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  Filter,
  Flame,
  Layers,
  Lock,
  Maximize2,
  Minimize2,
  Radio,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  UserCheck,
  UserRound,
  Users,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react"

import {
  STARFRONT_GEAR_DEFS,
  STARFRONT_PILOT_MAP,
  STARFRONT_PILOTS,
  type StarfrontPilotDef,
} from "@/lib/game/data"
import { playClickSound, playShieldSound } from "@/lib/game/audio"
import type { StarfrontProgression } from "@/lib/game/types"
import { cn } from "@/lib/utils"

export interface PilotGalleryProps {
  progression?: StarfrontProgression
  onUpdateProgression?: (updated: StarfrontProgression) => void
  onNavigateSection?: (sectionId: string) => void
}

type GalleryViewMode = "paired" | "portraits" | "fullbody" | "inspector"
type GenderFilter = "all" | "Nam" | "Nữ"
type GearFilter = "all" | "vanguard" | "falcon" | "aegis"

interface ArtworkMeta {
  pilotId: string
  pilotName: string
  callsign: string
  gender: string
  age: number
  role: string
  gearId: "vanguard" | "falcon" | "aegis"
  type: "portrait" | "fullbody"
  title: string
  url: string
  dimensions: string
  aspectRatio: string
  fileSize: string
  desc: string
}

const ARTWORK_METAS: ArtworkMeta[] = [
  // 1. MARCUS
  {
    pilotId: "marcus",
    pilotName: "Marcus Thorne",
    callsign: "IRONCLAD",
    gender: "Nam",
    age: 30,
    role: "Chỉ Huy Tiên Phong / Vũ Khí Hạng Nặng",
    gearId: "vanguard",
    type: "portrait",
    title: "Marcus Thorne — Chân Dung Chỉ Huy",
    url: "/images/marcus-portrait.png",
    dimensions: "1024 × 1024",
    aspectRatio: "1:1 Square",
    fileSize: "576 KB",
    desc: "Chân dung chỉ huy 30 tuổi với vết sẹo chiến binh, ánh mắt kiên định trong cổ áo exo-suit quân sự.",
  },
  {
    pilotId: "marcus",
    pilotName: "Marcus Thorne",
    callsign: "IRONCLAD",
    gender: "Nam",
    age: 30,
    role: "Chỉ Huy Tiên Phong / Vũ Khí Hạng Nặng",
    gearId: "vanguard",
    type: "fullbody",
    title: "Marcus Thorne — Tranh Toàn Thân Ngoại Giáp",
    url: "/images/marcus-fullbody.png",
    dimensions: "900 × 1600",
    aspectRatio: "9:16 Vertical Poster",
    fileSize: "973 KB",
    desc: "Toàn thân trong bộ exo-suit titan đen nhám phối viền cyan sáng, trang bị bộc phá năng lượng hạng nặng.",
  },

  // 2. VALENTINE
  {
    pilotId: "valentine",
    pilotName: "Valentine Vance",
    callsign: "ANGEL WING",
    gender: "Nữ",
    age: 22,
    role: "Sĩ Quan Cứu Hộ / Khiên Năng Lượng Nano",
    gearId: "aegis",
    type: "portrait",
    title: "Valentine Vance — Chân Dung Thiên Thần Nano",
    url: "/images/valentine-portrait.png",
    dimensions: "1024 × 1024",
    aspectRatio: "1:1 Square",
    fileSize: "569 KB",
    desc: "Nữ phi công 22 tuổi quyến rũ với mái tóc vàng bạch kim, ánh mắt ấm áp và tai nghe truyền tín hiệu cứu hộ.",
  },
  {
    pilotId: "valentine",
    pilotName: "Valentine Vance",
    callsign: "ANGEL WING",
    gender: "Nữ",
    age: 22,
    role: "Sĩ Quan Cứu Hộ / Khiên Năng Lượng Nano",
    gearId: "aegis",
    type: "fullbody",
    title: "Valentine Vance — Tranh Toàn Thân Bộ Đồ Cứu Hộ",
    url: "/images/valentine-fullbody.png",
    dimensions: "900 × 1600",
    aspectRatio: "9:16 Vertical Poster",
    fileSize: "1043 KB",
    desc: "Bộ flightsuit trắng phối vàng kim thanh lịch, tay cầm súng nano hồi phục và găng tay điều khiển từ trường.",
  },

  // 3. ALVISS
  {
    pilotId: "alviss",
    pilotName: "Alviss Drake",
    callsign: "GHOSTFIRE",
    gender: "Nam",
    age: 26,
    role: "Át Chủ Tiêm Kích Siêu Thanh / Đánh Chặn",
    gearId: "falcon",
    type: "portrait",
    title: "Alviss Drake — Chân Dung Bóng Ma Siêu Thanh",
    url: "/images/alviss-portrait.png",
    dimensions: "1024 × 1024",
    aspectRatio: "1:1 Square",
    fileSize: "654 KB",
    desc: "Át chủ tiêm kích 26 tuổi tuấn tú, mái tóc đen vệt tím cùng ánh mắt hổ phách kiên định sắc lạnh.",
  },
  {
    pilotId: "alviss",
    pilotName: "Alviss Drake",
    callsign: "GHOSTFIRE",
    gender: "Nam",
    age: 26,
    role: "Át Chủ Tiêm Kích Siêu Thanh / Đánh Chặn",
    gearId: "falcon",
    type: "fullbody",
    title: "Alviss Drake — Tranh Toàn Thân Cơ Động Falcon",
    url: "/images/alviss-fullbody.png",
    dimensions: "900 × 1600",
    aspectRatio: "9:16 Vertical Poster",
    fileSize: "1061 KB",
    desc: "Flightsuit bó sát khí động học màu tím sẫm, phản lực giày cao áp và bộ cánh lướt tàn ảnh Falcon.",
  },

  // 4. ERIC
  {
    pilotId: "eric",
    pilotName: "Eric Brandt",
    callsign: "BUNKER BREAKER",
    gender: "Nam",
    age: 28,
    role: "Bậc Thầy Pháo Kích / Xuyên Phá Boong-Ke",
    gearId: "vanguard",
    type: "portrait",
    title: "Eric Brandt — Chân Dung Pháo Kích",
    url: "/images/eric-portrait.png",
    dimensions: "1024 × 1024",
    aspectRatio: "1:1 Square",
    fileSize: "532 KB",
    desc: "Chuyên gia công thành 28 tuổi dạn dày sương gió, râu quai nón tỉa gọn gàng trong bộ đồ chịu nhiệt đỏ đen.",
  },
  {
    pilotId: "eric",
    pilotName: "Eric Brandt",
    callsign: "BUNKER BREAKER",
    gender: "Nam",
    age: 28,
    role: "Bậc Thầy Pháo Kích / Xuyên Phá Boong-Ke",
    gearId: "vanguard",
    type: "fullbody",
    title: "Eric Brandt — Tranh Toàn Thân Đại Pháo",
    url: "/images/eric-fullbody.png",
    dimensions: "900 × 1600",
    aspectRatio: "9:16 Vertical Poster",
    fileSize: "896 KB",
    desc: "Quân phục pháo binh hạng nặng phối đỏ đen, thắt lưng đạn hạt nhân và ống phóng tên lửa chiến thuật.",
  },

  // 5. LYRA
  {
    pilotId: "lyra",
    pilotName: "Lyra Song",
    callsign: "VALKYRIE",
    gender: "Nữ",
    age: 24,
    role: "Đấu Sĩ Plasma Siêu Thanh / Bạo Kích",
    gearId: "falcon",
    type: "portrait",
    title: "Lyra Song — Chân Dung Vũ Nữ Plasma",
    url: "/images/lyra-portrait.png",
    dimensions: "1024 × 1024",
    aspectRatio: "1:1 Square",
    fileSize: "638 KB",
    desc: "Nữ đấu sĩ 24 tuổi với mái tóc bạch kim ánh tím hai bên tinh nghịch, ánh mắt tự tin thách thức.",
  },
  {
    pilotId: "lyra",
    pilotName: "Lyra Song",
    callsign: "VALKYRIE",
    gender: "Nữ",
    age: 24,
    role: "Đấu Sĩ Plasma Siêu Thanh / Bạo Kích",
    gearId: "falcon",
    type: "fullbody",
    title: "Lyra Song — Tranh Toàn Thân Kiếm Sĩ Plasma",
    url: "/images/lyra-fullbody.png",
    dimensions: "900 × 1600",
    aspectRatio: "9:16 Vertical Poster",
    fileSize: "1078 KB",
    desc: "Váy ngắn thể thao nano-weave năng động kết hợp bốt cao cổ phản lực và kiếm laser plasma tím rực.",
  },

  // 6. KAELEN
  {
    pilotId: "kaelen",
    pilotName: "Kaelen Quinn",
    callsign: "WRAITH",
    gender: "Nữ",
    age: 25,
    role: "Chuyên Viên Điện Tử / Ám Sát Lượng Tử",
    gearId: "falcon",
    type: "portrait",
    title: "Kaelen Quinn — Chân Dung Bóng Ma Lượng Tử",
    url: "/images/kaelen-portrait.png",
    dimensions: "1024 × 1024",
    aspectRatio: "1:1 Square",
    fileSize: "527 KB",
    desc: "Nữ chuyên viên điện tử 25 tuổi bí ẩn, mái tóc ngắn bất đối xứng xanh thẫm và ánh mắt ngọc bích sắc bén.",
  },
  {
    pilotId: "kaelen",
    pilotName: "Kaelen Quinn",
    callsign: "WRAITH",
    gender: "Nữ",
    age: 25,
    role: "Chuyên Viên Điện Tử / Ám Sát Lượng Tử",
    gearId: "falcon",
    type: "fullbody",
    title: "Kaelen Quinn — Tranh Toàn Thân Tàng Hình",
    url: "/images/kaelen-fullbody.png",
    dimensions: "900 × 1600",
    aspectRatio: "9:16 Vertical Poster",
    fileSize: "900 KB",
    desc: "Bộ đồ tàng hình phối váy xếp ly công nghệ cao với mảng vi mạch hấp thụ sóng quét và súng điện từ vi mô.",
  },

  // 7. SELENA
  {
    pilotId: "selena",
    pilotName: "Selena Vega",
    callsign: "SOLARIS",
    gender: "Nữ",
    age: 27,
    role: "Chuyên Gia Quang Năng / Thiêu Đốt Photon",
    gearId: "vanguard",
    type: "portrait",
    title: "Selena Vega — Chân Dung Nữ Hoàng Quang Học",
    url: "/images/selena-portrait.png",
    dimensions: "1024 × 1024",
    aspectRatio: "1:1 Square",
    fileSize: "549 KB",
    desc: "Nữ sĩ quan chỉ huy 27 tuổi kiêu sa, mái tóc đỏ rực bồng bềnh và đôi mắt hổ phách quyền lực uy nghi.",
  },
  {
    pilotId: "selena",
    pilotName: "Selena Vega",
    callsign: "SOLARIS",
    gender: "Nữ",
    age: 27,
    role: "Chuyên Gia Quang Năng / Thiêu Đốt Photon",
    gearId: "vanguard",
    type: "fullbody",
    title: "Selena Vega — Tranh Toàn Thân Lễ Phục Sĩ Quan",
    url: "/images/selena-fullbody.png",
    dimensions: "900 × 1600",
    aspectRatio: "9:16 Vertical Poster",
    fileSize: "955 KB",
    desc: "Lễ phục phi công váy ngắn viền vàng vương giả, áo choàng sĩ quan tháo rời và máy phát chùm tia photon mặt trời.",
  },

  // 8. VICTOR
  {
    pilotId: "victor",
    pilotName: "Victor Sterling",
    callsign: "TITAN GAUSS",
    gender: "Nam",
    age: 34,
    role: "Pháo Đài Thép / Giảm Sát Thương Tối Thượng",
    gearId: "aegis",
    type: "portrait",
    title: "Victor Sterling — Chân Dung Pháo Đài Thép",
    url: "/images/victor-portrait.png",
    dimensions: "1024 × 1024",
    aspectRatio: "1:1 Square",
    fileSize: "582 KB",
    desc: "Cựu binh 34 tuổi vai vạm vỡ, mái tóc húi cua hoa râm và ánh mắt điềm tĩnh kiên cố như tảng đá hoa cương.",
  },
  {
    pilotId: "victor",
    pilotName: "Victor Sterling",
    callsign: "TITAN GAUSS",
    gender: "Nam",
    age: 34,
    role: "Pháo Đài Thép / Giảm Sát Thương Tối Thượng",
    gearId: "aegis",
    type: "fullbody",
    title: "Victor Sterling — Tranh Toàn Thân Giáp Titan",
    url: "/images/victor-fullbody.png",
    dimensions: "900 × 1600",
    aspectRatio: "9:16 Vertical Poster",
    fileSize: "966 KB",
    desc: "Ngoại giáp thủy lực hạng nặng titan vàng đồng, găng tay trợ lực và khiên phản chấn kiên cố bất hoại.",
  },
]

export function PilotGallery({
  progression,
  onUpdateProgression,
  onNavigateSection,
}: PilotGalleryProps) {
  const [viewMode, setViewMode] = useState<GalleryViewMode>("paired")
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all")
  const [gearFilter, setGearFilter] = useState<GearFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Modal Lightbox
  const [lightboxArtwork, setLightboxArtwork] = useState<ArtworkMeta | null>(null)
  const [zoomLevel, setZoomLevel] = useState<number>(1)

  // Inspector selected pilot
  const [inspectorPilotId, setInspectorPilotId] = useState<string>("marcus")

  // Currently active pilot in user's saved progression
  const activePilotId = progression?.activePairing?.pilotId || "marcus"

  // Filtered artworks
  const filteredArtworks = useMemo(() => {
    return ARTWORK_METAS.filter((art) => {
      if (genderFilter !== "all" && art.gender !== genderFilter) return false
      if (gearFilter !== "all" && art.gearId !== gearFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesName = art.pilotName.toLowerCase().includes(q)
        const matchesCallsign = art.callsign.toLowerCase().includes(q)
        const matchesRole = art.role.toLowerCase().includes(q)
        if (!matchesName && !matchesCallsign && !matchesRole) return false
      }
      if (viewMode === "portraits" && art.type !== "portrait") return false
      if (viewMode === "fullbody" && art.type !== "fullbody") return false
      return true
    })
  }, [genderFilter, gearFilter, searchQuery, viewMode])

  // Filtered pilots for paired / inspector view
  const filteredPilots = useMemo(() => {
    return STARFRONT_PILOTS.filter((pilot) => {
      if (genderFilter !== "all" && pilot.gender !== genderFilter) return false
      if (gearFilter !== "all" && pilot.recommendedGear !== gearFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesName = pilot.name.toLowerCase().includes(q)
        const matchesCallsign = pilot.callsign.toLowerCase().includes(q)
        const matchesTitle = pilot.title.toLowerCase().includes(q)
        if (!matchesName && !matchesCallsign && !matchesTitle) return false
      }
      return true
    })
  }, [genderFilter, gearFilter, searchQuery])

  const inspectorPilot = useMemo(() => {
    return (
      STARFRONT_PILOTS.find((p) => p.id === inspectorPilotId) ||
      STARFRONT_PILOTS[0]
    )
  }, [inspectorPilotId])

  const openLightbox = (art: ArtworkMeta) => {
    playClickSound()
    setLightboxArtwork(art)
    setZoomLevel(1)
  }

  const closeLightbox = () => {
    setLightboxArtwork(null)
    setZoomLevel(1)
  }

  const nextLightbox = () => {
    if (!lightboxArtwork) return
    playClickSound()
    const currentIndex = ARTWORK_METAS.findIndex(
      (a) => a.url === lightboxArtwork.url,
    )
    const nextIndex = (currentIndex + 1) % ARTWORK_METAS.length
    setLightboxArtwork(ARTWORK_METAS[nextIndex])
    setZoomLevel(1)
  }

  const prevLightbox = () => {
    if (!lightboxArtwork) return
    playClickSound()
    const currentIndex = ARTWORK_METAS.findIndex(
      (a) => a.url === lightboxArtwork.url,
    )
    const prevIndex = (currentIndex - 1 + ARTWORK_METAS.length) % ARTWORK_METAS.length
    setLightboxArtwork(ARTWORK_METAS[prevIndex])
    setZoomLevel(1)
  }

  const handleSelectPilotAsActive = (pilotId: string) => {
    playShieldSound()
    if (!progression || !onUpdateProgression) return
    const pilotDef = STARFRONT_PILOT_MAP[pilotId]
    const updated: StarfrontProgression = {
      ...progression,
      activePairing: {
        ...progression.activePairing,
        pilotId,
        gearId: pilotDef?.recommendedGear || progression.activeGearId || "vanguard",
        isLocked: true,
        unlockProgress: {
          wonBattles: 0,
          completedMissions: 0,
          targetCount: 5,
        },
      },
      activeGearId: pilotDef?.recommendedGear || progression.activeGearId || "vanguard",
    }
    onUpdateProgression(updated)
  }

  return (
    <div className="flex flex-col gap-5 pb-12">
      {/* 1. HERO HEADER */}
      <div className="relative overflow-hidden rounded-sm border border-cyan-500/40 bg-gradient-to-r from-panel via-slate-950 to-panel p-5 shadow-2xl backdrop-blur-md">
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 size-72 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-sm border border-cyan-500/60 bg-black/60 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Eye className="size-7 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-lg font-black tracking-wider text-white uppercase sm:text-2xl">
                  HÀNH LANG DANH VỌNG PHI CÔNG // PILOT ART GALLERY
                </h1>
                <span className="rounded bg-cyan-950 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-500/40">
                  16 REAL PNG ASSETS
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-slate-300">
                Toàn bộ 16 tác phẩm nghệ thuật raster cao cấp: 8 Chân Dung (1:1 Square 1024×1024) và 8 Tranh Toàn Thân (9:16 Poster 900×1600).
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded border border-border/80 bg-black/60 px-3 py-1.5 font-mono text-xs">
              <span className="text-muted-foreground">Tác phẩm: </span>
              <strong className="text-cyan-300 font-bold">16 / 16 PNG Thật</strong>
            </div>
            <div className="rounded border border-border/80 bg-black/60 px-3 py-1.5 font-mono text-xs">
              <span className="text-muted-foreground">Phân bổ: </span>
              <strong className="text-purple-300 font-bold">4 Nam · 4 Nữ</strong>
            </div>
            <div className="rounded border border-emerald-500/50 bg-emerald-950/40 px-3 py-1.5 font-mono text-xs text-emerald-300 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
              <strong className="font-bold">HTTP 200 OK Live</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONTROLS, VIEW MODES & FILTERS */}
      <div className="rounded-sm border border-border/70 bg-panel/80 p-3.5 shadow-md flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
          {/* View Mode Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            <button
              onClick={() => {
                playClickSound()
                setViewMode("paired")
              }}
              className={cn(
                "px-3 py-1.5 rounded-sm border font-bold transition-all cursor-pointer flex items-center gap-1.5",
                viewMode === "paired"
                  ? "border-cyan-400 bg-cyan-950 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  : "border-border/60 bg-black/40 text-muted-foreground hover:text-white hover:bg-black/70",
              )}
            >
              <Users className="size-3.5" />
              <span>8 Cặp Đôi (Chân Dung + Toàn Thân)</span>
            </button>

            <button
              onClick={() => {
                playClickSound()
                setViewMode("portraits")
              }}
              className={cn(
                "px-3 py-1.5 rounded-sm border font-bold transition-all cursor-pointer flex items-center gap-1.5",
                viewMode === "portraits"
                  ? "border-cyan-400 bg-cyan-950 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  : "border-border/60 bg-black/40 text-muted-foreground hover:text-white hover:bg-black/70",
              )}
            >
              <UserRound className="size-3.5" />
              <span>8 Chân Dung 1:1 (1024×1024)</span>
            </button>

            <button
              onClick={() => {
                playClickSound()
                setViewMode("fullbody")
              }}
              className={cn(
                "px-3 py-1.5 rounded-sm border font-bold transition-all cursor-pointer flex items-center gap-1.5",
                viewMode === "fullbody"
                  ? "border-cyan-400 bg-cyan-950 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  : "border-border/60 bg-black/40 text-muted-foreground hover:text-white hover:bg-black/70",
              )}
            >
              <Layers className="size-3.5" />
              <span>8 Toàn Thân 9:16 (900×1600)</span>
            </button>

            <button
              onClick={() => {
                playClickSound()
                setViewMode("inspector")
              }}
              className={cn(
                "px-3 py-1.5 rounded-sm border font-bold transition-all cursor-pointer flex items-center gap-1.5",
                viewMode === "inspector"
                  ? "border-cyan-400 bg-cyan-950 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  : "border-border/60 bg-black/40 text-muted-foreground hover:text-white hover:bg-black/70",
              )}
            >
              <Maximize2 className="size-3.5" />
              <span>Soi Chi Tiết (Side-by-Side Inspector)</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo tên, callsign, vai trò..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-border/70 bg-black/60 pl-8 pr-3 py-1 text-xs font-mono text-white placeholder:text-muted-foreground focus:border-cyan-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-muted-foreground hover:text-white"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>

        {/* Filter tags */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-3">
            {/* Gender filters */}
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground mr-1">Giới tính:</span>
              {(["all", "Nam", "Nữ"] as GenderFilter[]).map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    playClickSound()
                    setGenderFilter(g)
                  }}
                  className={cn(
                    "px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer",
                    genderFilter === g
                      ? "border-purple-400 bg-purple-950 text-purple-200"
                      : "border-border/50 bg-black/40 text-muted-foreground hover:text-white",
                  )}
                >
                  {g === "all" ? "Tất Cả" : g}
                </button>
              ))}
            </div>

            {/* Gear Class filters */}
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground mr-1">Cơ giáp khuyên dùng:</span>
              {(
                [
                  { id: "all", label: "Tất Cả" },
                  { id: "vanguard", label: "Vanguard" },
                  { id: "falcon", label: "Falcon" },
                  { id: "aegis", label: "Aegis" },
                ] as { id: GearFilter; label: string }[]
              ).map((gf) => (
                <button
                  key={gf.id}
                  onClick={() => {
                    playClickSound()
                    setGearFilter(gf.id)
                  }}
                  className={cn(
                    "px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer",
                    gearFilter === gf.id
                      ? "border-amber-400 bg-amber-950 text-amber-200"
                      : "border-border/50 bg-black/40 text-muted-foreground hover:text-white",
                  )}
                >
                  {gf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-muted-foreground text-[11px]">
            Hiển thị <strong>{viewMode === "inspector" || viewMode === "paired" ? filteredPilots.length : filteredArtworks.length}</strong> mục
          </div>
        </div>
      </div>

      {/* 3. VIEW MODE 1: PAIRED CARDS (8 PILOTS WITH BOTH ARTWORKS SIDE-BY-SIDE) */}
      {viewMode === "paired" && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
          {filteredPilots.map((pilot) => {
            const isActive = pilot.id === activePilotId
            const portraitMeta = ARTWORK_METAS.find(
              (a) => a.pilotId === pilot.id && a.type === "portrait",
            )
            const fullbodyMeta = ARTWORK_METAS.find(
              (a) => a.pilotId === pilot.id && a.type === "fullbody",
            )
            const gearDef = STARFRONT_GEAR_DEFS[pilot.recommendedGear]

            return (
              <div
                key={pilot.id}
                className={cn(
                  "relative overflow-hidden rounded-sm border bg-panel/90 p-4 shadow-xl transition-all flex flex-col justify-between group",
                  isActive
                    ? "border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                    : "border-border/70 hover:border-cyan-500/60",
                )}
              >
                {/* Header: Name, Callsign, Class badge */}
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-border/50 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base font-bold text-white tracking-wide">
                          {pilot.name}
                        </h3>
                        <span className="rounded bg-black/70 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-500/40">
                          {pilot.callsign}
                        </span>
                        {isActive && (
                          <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-[9px] font-black text-cyan-300 border border-cyan-400">
                            ĐANG XUẤT KÍCH
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground font-mono">
                        {pilot.gender} · {pilot.age} tuổi · {pilot.title}
                      </div>
                    </div>

                    <div
                      className="rounded border px-2 py-1 font-mono text-[10px] font-bold"
                      style={{
                        borderColor: gearDef?.color || "#06b6d4",
                        color: gearDef?.color || "#06b6d4",
                      }}
                    >
                      {gearDef?.name.toUpperCase()}
                    </div>
                  </div>

                  {/* Artwork Showcase Area: 2 Columns (Portrait 1:1 + Full-Body 9:16) */}
                  <div className="mt-4 grid grid-cols-12 gap-3">
                    {/* Chân Dung (Col 5) */}
                    <div className="col-span-5 flex flex-col gap-1.5">
                      <div className="relative aspect-square w-full overflow-hidden rounded-sm border border-cyan-500/40 bg-black shadow-md group/img cursor-pointer"
                        onClick={() => portraitMeta && openLightbox(portraitMeta)}
                      >
                        <img
                          src={pilot.avatar}
                          alt={`${pilot.name} Portrait`}
                          className="size-full object-cover object-top transition-transform duration-500 group-hover/img:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-2">
                          <span className="text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                            <Maximize2 className="size-3" /> Phóng to (1024×1024)
                          </span>
                        </div>
                        <div className="absolute top-1 left-1 bg-black/80 px-1.5 py-0.5 font-mono text-[8.5px] text-cyan-300 border border-cyan-500/30">
                          1:1 SQUARE
                        </div>
                      </div>

                      <div className="flex items-center justify-between font-mono text-[9px] text-muted-foreground px-0.5">
                        <span>1024×1024 PNG</span>
                        <span>{portraitMeta?.fileSize}</span>
                      </div>
                    </div>

                    {/* Toàn Thân (Col 7) */}
                    <div className="col-span-7 flex flex-col gap-1.5">
                      <div className="relative h-60 w-full overflow-hidden rounded-sm border border-purple-500/40 bg-black shadow-md group/img cursor-pointer"
                        onClick={() => fullbodyMeta && openLightbox(fullbodyMeta)}
                      >
                        <img
                          src={pilot.fullBodyAvatar || pilot.avatar}
                          alt={`${pilot.name} Full-Body`}
                          className="size-full object-cover object-top transition-transform duration-500 group-hover/img:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-2">
                          <span className="text-[10px] font-mono text-purple-300 flex items-center gap-1">
                            <Maximize2 className="size-3" /> Phóng to (900×1600)
                          </span>
                        </div>
                        <div className="absolute top-1 left-1 bg-black/80 px-1.5 py-0.5 font-mono text-[8.5px] text-purple-300 border border-purple-500/30">
                          9:16 FULL-BODY
                        </div>
                      </div>

                      <div className="flex items-center justify-between font-mono text-[9px] text-muted-foreground px-0.5">
                        <span>900×1600 PNG</span>
                        <span>{fullbodyMeta?.fileSize}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quote / Bio snippet */}
                  <blockquote className="mt-3 rounded border border-border/40 bg-black/40 p-2.5 font-mono text-[11px] text-slate-300 italic">
                    "{pilot.quote}"
                  </blockquote>

                  {/* Passive & Trait Tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {pilot.traits.map((tr) => (
                      <span
                        key={tr}
                        className="rounded bg-black/60 px-2 py-0.5 font-mono text-[9.5px] text-cyan-200 border border-cyan-500/30"
                      >
                        ◆ {tr}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      playClickSound()
                      setInspectorPilotId(pilot.id)
                      setViewMode("inspector")
                    }}
                    className="font-mono text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Xem Hồ Sơ & Trait Chi Tiết</span>
                    <ChevronRight className="size-3.5" />
                  </button>

                  <div className="flex items-center gap-2">
                    <a
                      href={pilot.fullBodyAvatar}
                      download={`${pilot.id}-fullbody.png`}
                      className="rounded border border-border/70 bg-black/50 hover:bg-black/90 p-1.5 text-muted-foreground hover:text-white transition-colors"
                      title="Tải ảnh toàn thân gốc (PNG 900x1600)"
                    >
                      <Download className="size-3.5" />
                    </a>

                    <button
                      onClick={() => handleSelectPilotAsActive(pilot.id)}
                      disabled={isActive}
                      className={cn(
                        "rounded px-3 py-1 font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm",
                        isActive
                          ? "bg-cyan-950 text-cyan-400 border border-cyan-500/50 cursor-default"
                          : "bg-cyan-600 hover:bg-cyan-500 text-white",
                      )}
                    >
                      <Check className="size-3.5" />
                      <span>{isActive ? "Đang Chọn" : "Chọn Xuất Kích"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 4. VIEW MODE 2 & 3: GRID OF PORTRAITS OR FULL-BODY ARTWORKS */}
      {(viewMode === "portraits" || viewMode === "fullbody") && (
        <div
          className={cn(
            "grid gap-5",
            viewMode === "portraits"
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
              : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
          )}
        >
          {filteredArtworks.map((art) => {
            const isPortrait = art.type === "portrait"
            const gearDef = STARFRONT_GEAR_DEFS[art.gearId]
            const isActivePilot = art.pilotId === activePilotId

            return (
              <div
                key={art.url}
                className={cn(
                  "group relative overflow-hidden rounded-sm border bg-panel/90 shadow-xl transition-all flex flex-col justify-between cursor-pointer",
                  isActivePilot
                    ? "border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                    : "border-border/70 hover:border-cyan-400 hover:shadow-lg",
                )}
                onClick={() => openLightbox(art)}
              >
                {/* Image Container */}
                <div
                  className={cn(
                    "relative w-full overflow-hidden bg-black",
                    isPortrait ? "aspect-square" : "aspect-[9/16]",
                  )}
                >
                  <img
                    src={art.url}
                    alt={art.title}
                    className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 opacity-70 group-hover:opacity-90 transition-opacity" />

                  {/* Badges on Top */}
                  <div className="absolute top-2 inset-x-2 flex items-center justify-between text-[9px] font-mono">
                    <span className="rounded bg-black/80 px-1.5 py-0.5 text-cyan-300 border border-cyan-500/40">
                      {art.dimensions}
                    </span>
                    <span
                      className="rounded bg-black/80 px-1.5 py-0.5 border font-bold"
                      style={{
                        borderColor: gearDef?.color || "#06b6d4",
                        color: gearDef?.color || "#06b6d4",
                      }}
                    >
                      {gearDef?.name}
                    </span>
                  </div>

                  {/* Hover Action Icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="rounded-full bg-cyan-600/90 p-3 text-white shadow-xl">
                      <Maximize2 className="size-5" />
                    </div>
                  </div>

                  {/* Info on Bottom */}
                  <div className="absolute bottom-2 inset-x-2 text-white">
                    <div className="flex items-center justify-between">
                      <div className="font-display text-sm font-bold truncate">
                        {art.pilotName}
                      </div>
                      <span className="font-mono text-[10px] text-cyan-300">
                        {art.callsign}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-300 font-mono truncate">
                      {art.role}
                    </div>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="p-2.5 bg-black/70 border-t border-border/50 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                  <span className="text-slate-300">{art.fileSize} · PNG RGBA</span>
                  <a
                    href={art.url}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Download className="size-3" /> Tải về
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 5. VIEW MODE 4: PILOT INSPECTOR (SIDE-BY-SIDE HIGH FIDELITY) */}
      {viewMode === "inspector" && (
        <div className="rounded-sm border border-cyan-500/40 bg-panel/90 p-5 shadow-2xl backdrop-blur-md">
          {/* Pilot selector pills at top */}
          <div className="mb-6 flex flex-wrap gap-2 border-b border-border/50 pb-4">
            {filteredPilots.map((p) => {
              const isSelected = p.id === inspectorPilotId
              const isActive = p.id === activePilotId
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    playClickSound()
                    setInspectorPilotId(p.id)
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded px-3 py-1.5 font-mono text-xs transition-all cursor-pointer border",
                    isSelected
                      ? "border-cyan-400 bg-cyan-950 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                      : "border-border/60 bg-black/40 text-muted-foreground hover:text-white hover:bg-black/70",
                  )}
                >
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="size-5 rounded-full object-cover border border-cyan-400/50"
                  />
                  <span className="font-bold">{p.name.split(" ")[0]}</span>
                  <span className="text-[10px] opacity-75">{p.callsign}</span>
                  {isActive && (
                    <span className="size-1.5 rounded-full bg-cyan-400" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Inspector Content Grid */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Column: Full-Body Concept Art (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="relative overflow-hidden rounded-sm border border-cyan-500/50 bg-black/80 shadow-2xl group cursor-pointer"
                onClick={() => {
                  const meta = ARTWORK_METAS.find(
                    (a) => a.pilotId === inspectorPilot.id && a.type === "fullbody",
                  )
                  if (meta) openLightbox(meta)
                }}
              >
                <img
                  src={inspectorPilot.fullBodyAvatar || inspectorPilot.avatar}
                  alt={`${inspectorPilot.name} Full Body Concept`}
                  className="w-full max-h-[640px] object-cover object-top transition-transform duration-500 group-hover:scale-102"
                />

                <div className="absolute top-3 left-3 rounded bg-black/80 px-2.5 py-1 border border-cyan-500/50 font-mono text-[10px] text-cyan-300 backdrop-blur-sm">
                  <span>CONCEPT ART: </span>
                  <strong className="text-white">900 × 1600 (9:16)</strong>
                </div>

                <div className="absolute bottom-3 inset-x-3 rounded bg-black/80 p-2.5 border border-border/80 backdrop-blur-sm flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">File raster PNG RGBA chất lượng cao</span>
                  <span className="text-cyan-400 flex items-center gap-1">
                    <Maximize2 className="size-3.5" /> Bấm để phóng to
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Portrait, Lore, Traits, Stats (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-5">
              <div>
                {/* Header Card with Portrait */}
                <div className="flex gap-4 rounded border border-border/70 bg-black/60 p-4">
                  <div className="relative size-28 shrink-0 overflow-hidden rounded-sm border border-cyan-500/60 bg-black shadow-lg cursor-pointer group"
                    onClick={() => {
                      const meta = ARTWORK_METAS.find(
                        (a) => a.pilotId === inspectorPilot.id && a.type === "portrait",
                      )
                      if (meta) openLightbox(meta)
                    }}
                  >
                    <img
                      src={inspectorPilot.avatar}
                      alt={inspectorPilot.name}
                      className="size-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 text-center font-mono text-[8px] text-cyan-300 py-0.5">
                      1024×1024
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-xl font-black text-white">
                          {inspectorPilot.name}
                        </h2>
                        <span className="rounded bg-cyan-950 px-2 py-0.5 font-mono text-xs font-bold text-cyan-300 border border-cyan-500/40">
                          {inspectorPilot.callsign}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-cyan-400 mt-1">
                        {inspectorPilot.title}
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                        {inspectorPilot.gender} · {inspectorPilot.age} tuổi · Khuyên dùng cơ giáp:{" "}
                        <strong className="text-amber-400 uppercase">
                          {inspectorPilot.recommendedGear}
                        </strong>
                      </div>
                    </div>

                    <blockquote className="mt-2 font-mono text-xs text-slate-300 italic">
                      "{inspectorPilot.quote}"
                    </blockquote>
                  </div>
                </div>

                {/* Tiểu Sử (Bio) */}
                <div className="mt-4 rounded border border-border/60 bg-black/40 p-3.5 space-y-1">
                  <div className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-wide">
                    TIỂU SỬ & HỒ SƠ TÁC CHIẾN
                  </div>
                  <p className="font-mono text-xs text-slate-300 leading-relaxed">
                    {inspectorPilot.bio}
                  </p>
                </div>

                {/* Trait & Vệt Bay Đặc Trưng */}
                <div className="mt-4 rounded border border-purple-500/40 bg-purple-950/20 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span className="text-purple-300">
                      TRAIL SKILL: {inspectorPilot.trail.name}
                    </span>
                    <span className="text-cyan-400">
                      {inspectorPilot.trail.nameEn}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-slate-300">
                    {inspectorPilot.trail.effectDesc}
                  </p>
                  <div className="rounded bg-black/60 p-2 font-mono text-[11px] text-amber-300 border border-amber-500/30">
                    {inspectorPilot.trail.bonusSummary}
                  </div>
                </div>

                {/* 4 Traits Chi Tiết */}
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {inspectorPilot.traitDetails.map((tr) => (
                    <div
                      key={tr.name}
                      className="rounded border border-border/60 bg-black/50 p-2.5 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-white">{tr.name}</strong>
                        <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-1 rounded">
                          {tr.tag}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {tr.desc}
                      </div>
                      <div className="text-[10.5px] text-emerald-400 font-bold mt-1">
                        ◆ {tr.benefit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action: Select As Active */}
              <div className="border-t border-border/50 pt-4 flex items-center justify-between">
                <div className="font-mono text-xs text-muted-foreground">
                  Trạng thái:{" "}
                  {inspectorPilot.id === activePilotId ? (
                    <strong className="text-cyan-300 font-bold">
                      Đang là Phi Công Chỉ Huy Hoạt Động
                    </strong>
                  ) : (
                    <span>Sẵn sàng xuất kích</span>
                  )}
                </div>

                <button
                  onClick={() => handleSelectPilotAsActive(inspectorPilot.id)}
                  disabled={inspectorPilot.id === activePilotId}
                  className={cn(
                    "rounded px-4 py-2 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-md",
                    inspectorPilot.id === activePilotId
                      ? "bg-cyan-950 text-cyan-400 border border-cyan-500/50 cursor-default"
                      : "bg-cyan-600 hover:bg-cyan-500 text-white",
                  )}
                >
                  <Check className="size-4" />
                  <span>
                    {inspectorPilot.id === activePilotId
                      ? "Đang Lãnh Đạo Phi Đội"
                      : "Cài Đặt Phi Công Này Làm Chỉ Huy"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. LIGHTBOX / HIGH-RES MODAL PREVIEW */}
      {lightboxArtwork && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
          onClick={closeLightbox}
        >
          <div
            className="relative flex flex-col max-h-[95vh] w-full max-w-5xl overflow-hidden rounded-sm border border-cyan-500/60 bg-panel shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/60 bg-black/80 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="font-display text-sm font-bold text-white uppercase tracking-wider">
                  {lightboxArtwork.title}
                </div>
                <span className="rounded bg-cyan-950 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-500/40">
                  {lightboxArtwork.dimensions} · {lightboxArtwork.fileSize}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Zoom toggle */}
                <button
                  onClick={() => setZoomLevel((z) => (z >= 2 ? 1 : z + 0.5))}
                  className="rounded border border-border/60 bg-black/60 px-2 py-1 font-mono text-xs text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                  title="Phóng to"
                >
                  <ZoomIn className="size-3.5" />
                  <span>{zoomLevel}x</span>
                </button>

                <a
                  href={lightboxArtwork.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded border border-border/60 bg-black/60 p-1.5 text-slate-300 hover:text-white"
                  title="Mở ảnh gốc trong tab mới"
                >
                  <ExternalLink className="size-3.5" />
                </a>

                <a
                  href={lightboxArtwork.url}
                  download
                  className="rounded border border-border/60 bg-black/60 p-1.5 text-slate-300 hover:text-white"
                  title="Tải ảnh gốc về máy"
                >
                  <Download className="size-3.5" />
                </a>

                <button
                  onClick={closeLightbox}
                  className="rounded border border-border/60 bg-black/60 p-1.5 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Modal Body / Image Viewport */}
            <div className="relative flex-1 overflow-auto bg-black p-4 flex items-center justify-center min-h-[400px] max-h-[72vh]">
              {/* Prev / Next buttons */}
              <button
                onClick={prevLightbox}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 rounded-full border border-border/60 bg-black/80 p-2 text-white hover:bg-cyan-950 hover:border-cyan-400 cursor-pointer shadow-lg transition-colors"
                title="Tác phẩm trước"
              >
                <ChevronLeft className="size-6" />
              </button>

              <button
                onClick={nextLightbox}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 rounded-full border border-border/60 bg-black/80 p-2 text-white hover:bg-cyan-950 hover:border-cyan-400 cursor-pointer shadow-lg transition-colors"
                title="Tác phẩm tiếp theo"
              >
                <ChevronRight className="size-6" />
              </button>

              <div
                className="transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img
                  src={lightboxArtwork.url}
                  alt={lightboxArtwork.title}
                  className={cn(
                    "max-h-[68vh] object-contain rounded-xs shadow-2xl",
                    lightboxArtwork.type === "portrait" ? "max-w-[68vh]" : "max-w-full",
                  )}
                />
              </div>
            </div>

            {/* Modal Footer info */}
            <div className="border-t border-border/60 bg-black/80 p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="text-slate-300">
                <strong>Đường dẫn asset:</strong>{" "}
                <code className="text-cyan-300 bg-black px-1.5 py-0.5 rounded border border-cyan-500/30">
                  {lightboxArtwork.url}
                </code>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-bold">
                  ✓ File PNG Raster Thực Sự (8-bit RGBA)
                </span>
                <button
                  onClick={() => handleSelectPilotAsActive(lightboxArtwork.pilotId)}
                  className="rounded bg-cyan-600 hover:bg-cyan-500 px-3 py-1 font-bold text-white transition-colors cursor-pointer"
                >
                  Chọn Phi Công Này
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
