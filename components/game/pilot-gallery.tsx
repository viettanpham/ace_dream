"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  Filter,
  Flame,
  Hand,
  Layers,
  Lock,
  Maximize2,
  Minimize2,
  Move,
  Radio,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  Smartphone,
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
    url: "/images/marcus-portrait.webp",
    dimensions: "512 × 512",
    aspectRatio: "1:1 Square",
    fileSize: "28 KB",
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
    url: "/images/marcus-fullbody.webp",
    dimensions: "1080 × 1920 (Full HD)",
    aspectRatio: "9:16 Vertical Poster",
    fileSize: "103 KB",
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
    url: "/images/valentine-portrait.webp",
    dimensions: "512 × 512",
    aspectRatio: "1:1 Square",
    fileSize: "58 KB",
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
    url: "/images/valentine-fullbody.webp",
    dimensions: "1080 × 1920 (Full HD)",
    aspectRatio: "9:16 Vertical Poster",
    fileSize: "223 KB",
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
    url: "/images/alviss-portrait.webp",
    dimensions: "512 × 512",
    aspectRatio: "1:1 Square",
    fileSize: "42 KB",
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
    url: "/images/alviss-fullbody.webp",
    dimensions: "1080 × 1920 (Full HD)",
    aspectRatio: "9:16 Vertical Poster",
    fileSize: "136 KB",
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
    url: "/images/eric-portrait.webp",
    dimensions: "512 × 512",
    aspectRatio: "1:1 Square",
    fileSize: "51 KB",
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
    url: "/images/eric-fullbody.webp",
    dimensions: "1080 × 1920 (Full HD)",
    aspectRatio: "9:16 Vertical Poster",
    fileSize: "181 KB",
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
    url: "/images/lyra-portrait.webp",
    dimensions: "512 × 512",
    aspectRatio: "1:1 Square",
    fileSize: "50 KB",
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
    url: "/images/lyra-fullbody.webp",
    dimensions: "1080 × 1920 (Full HD)",
    aspectRatio: "9:16 Vertical Poster",
    fileSize: "226 KB",
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
    url: "/images/kaelen-portrait.webp",
    dimensions: "512 × 512",
    aspectRatio: "1:1 Square",
    fileSize: "35 KB",
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
    url: "/images/kaelen-fullbody.webp",
    dimensions: "1080 × 1920 (Full HD)",
    aspectRatio: "9:16 Vertical Poster",
    fileSize: "126 KB",
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
    url: "/images/selena-portrait.webp",
    dimensions: "512 × 512",
    aspectRatio: "1:1 Square",
    fileSize: "53 KB",
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
    url: "/images/selena-fullbody.webp",
    dimensions: "1080 × 1920 (Full HD)",
    aspectRatio: "9:16 Vertical Poster",
    fileSize: "220 KB",
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
    url: "/images/victor-portrait.webp",
    dimensions: "512 × 512",
    aspectRatio: "1:1 Square",
    fileSize: "39 KB",
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
    url: "/images/victor-fullbody.webp",
    dimensions: "1080 × 1920 (Full HD)",
    aspectRatio: "9:16 Vertical Poster",
    fileSize: "141 KB",
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

  // Modal Lightbox & Pan/Zoom Gesture Engine
  const [lightboxArtwork, setLightboxArtwork] = useState<ArtworkMeta | null>(null)
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const hasDraggedRef = useRef(false)
  const lastTapTimeRef = useRef<number>(0)
  const pinchDistanceRef = useRef<number | null>(null)
  const initialZoomRef = useRef<number>(1)

  const clampPan = useCallback((x: number, y: number, zoom: number) => {
    if (zoom <= 1) return { x: 0, y: 0 }
    const maxPanX = Math.max(80, (zoom - 1) * 380)
    const maxPanY = Math.max(120, (zoom - 1) * 580)
    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, x)),
      y: Math.max(-maxPanY, Math.min(maxPanY, y)),
    }
  }, [])

  const resetZoomAndPan = useCallback(() => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
    setIsDragging(false)
  }, [])

  const handleZoomIn = useCallback(() => {
    playClickSound()
    setZoomLevel((prev) => {
      const next = Math.min(4, Number((prev + 0.5).toFixed(1)))
      return next
    })
  }, [])

  const handleZoomOut = useCallback(() => {
    playClickSound()
    setZoomLevel((prev) => {
      const next = Math.max(1, Number((prev - 0.5).toFixed(1)))
      if (next === 1) {
        setPanOffset({ x: 0, y: 0 })
      } else {
        setPanOffset((cur) => clampPan(cur.x, cur.y, next))
      }
      return next
    })
  }, [clampPan])

  const setSpecificZoom = useCallback((targetZoom: number) => {
    playClickSound()
    const next = Math.max(1, Math.min(4, targetZoom))
    setZoomLevel(next)
    if (next === 1) {
      setPanOffset({ x: 0, y: 0 })
    } else {
      setPanOffset((cur) => clampPan(cur.x, cur.y, next))
    }
  }, [clampPan])

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
    resetZoomAndPan()
  }

  const closeLightbox = useCallback(() => {
    setLightboxArtwork(null)
    resetZoomAndPan()
  }, [resetZoomAndPan])

  const nextLightbox = useCallback(() => {
    if (!lightboxArtwork) return
    playClickSound()
    const currentIndex = ARTWORK_METAS.findIndex(
      (a) => a.url === lightboxArtwork.url,
    )
    const nextIndex = (currentIndex + 1) % ARTWORK_METAS.length
    setLightboxArtwork(ARTWORK_METAS[nextIndex])
    resetZoomAndPan()
  }, [lightboxArtwork, resetZoomAndPan])

  const prevLightbox = useCallback(() => {
    if (!lightboxArtwork) return
    playClickSound()
    const currentIndex = ARTWORK_METAS.findIndex(
      (a) => a.url === lightboxArtwork.url,
    )
    const prevIndex = (currentIndex - 1 + ARTWORK_METAS.length) % ARTWORK_METAS.length
    setLightboxArtwork(ARTWORK_METAS[prevIndex])
    resetZoomAndPan()
  }, [lightboxArtwork, resetZoomAndPan])

  // Keyboard navigation when Lightbox is active
  useEffect(() => {
    if (!lightboxArtwork) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox()
      else if (e.key === "ArrowRight") nextLightbox()
      else if (e.key === "ArrowLeft") prevLightbox()
      else if (e.key === "+" || e.key === "=") handleZoomIn()
      else if (e.key === "-") handleZoomOut()
      else if (e.key === "0" || e.key === "r" || e.key === "R") resetZoomAndPan()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxArtwork, nextLightbox, prevLightbox, handleZoomIn, handleZoomOut, resetZoomAndPan, closeLightbox])

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    panStartRef.current = { ...panOffset }
    setIsDragging(true)
    hasDraggedRef.current = false
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasDraggedRef.current = true
    }
    if (zoomLevel > 1) {
      setPanOffset(clampPan(panStartRef.current.x + dx, panStartRef.current.y + dy, zoomLevel))
    } else {
      setPanOffset({ x: dx * 0.35, y: 0 })
    }
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (zoomLevel === 1) {
      const dx = panOffset.x
      if (dx < -50) {
        nextLightbox()
      } else if (dx > 50) {
        prevLightbox()
      }
      setPanOffset({ x: 0, y: 0 })
    }
  }

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.3 : -0.3
    setZoomLevel((prev) => {
      const next = Math.max(1, Math.min(4, Number((prev + delta).toFixed(2))))
      if (next === 1) {
        setPanOffset({ x: 0, y: 0 })
      } else {
        setPanOffset((cur) => clampPan(cur.x, cur.y, next))
      }
      return next
    })
  }

  // Touch gesture handlers (swipe at 1x, pan when zoomed, pinch to zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchDistanceRef.current = Math.hypot(dx, dy)
      initialZoomRef.current = zoomLevel
      return
    }
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      dragStartRef.current = { x: touch.clientX, y: touch.clientY }
      panStartRef.current = { ...panOffset }
      setIsDragging(true)
      hasDraggedRef.current = false
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchDistanceRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const currentDist = Math.hypot(dx, dy)
      const factor = currentDist / pinchDistanceRef.current
      const newZoom = Math.max(1, Math.min(4, Number((initialZoomRef.current * factor).toFixed(2))))
      setZoomLevel(newZoom)
      if (newZoom === 1) {
        setPanOffset({ x: 0, y: 0 })
      } else {
        setPanOffset((cur) => clampPan(cur.x, cur.y, newZoom))
      }
      return
    }

    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0]
      const dx = touch.clientX - dragStartRef.current.x
      const dy = touch.clientY - dragStartRef.current.y
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasDraggedRef.current = true
      }
      if (zoomLevel > 1) {
        setPanOffset(clampPan(panStartRef.current.x + dx, panStartRef.current.y + dy, zoomLevel))
      } else {
        setPanOffset({ x: dx * 0.45, y: 0 })
      }
    }
  }

  const handleTouchEnd = () => {
    if (pinchDistanceRef.current !== null) {
      pinchDistanceRef.current = null
    }
    if (!isDragging) return
    setIsDragging(false)
    if (zoomLevel === 1) {
      const dx = panOffset.x
      if (dx < -50) {
        nextLightbox()
      } else if (dx > 50) {
        prevLightbox()
      }
      setPanOffset({ x: 0, y: 0 })
    }
  }

  const handleImageClick = () => {
    if (hasDraggedRef.current) return
    const now = Date.now()
    if (now - lastTapTimeRef.current < 320) {
      // Double tap toggle
      if (zoomLevel > 1) {
        resetZoomAndPan()
      } else {
        setZoomLevel(2.2)
        setPanOffset({ x: 0, y: 0 })
      }
      lastTapTimeRef.current = 0
    } else {
      lastTapTimeRef.current = now
    }
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
                  16 WEBP FULL HD ASSETS
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-slate-300">
                Toàn bộ 16 tác phẩm nghệ thuật chuẩn hóa: 8 Chân Dung (1:1 Square 512×512) và 8 Tranh Toàn Thân (9:16 Poster 1080×1920 Full HD).
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded border border-border/80 bg-black/60 px-3 py-1.5 font-mono text-xs">
              <span className="text-muted-foreground">Tác phẩm: </span>
              <strong className="text-cyan-300 font-bold">16 / 16 WebP Sắc Nét</strong>
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
                        <span>512×512 WebP</span>
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
                            <Maximize2 className="size-3" /> Phóng to (1080×1920 Full HD)
                          </span>
                        </div>
                        <div className="absolute top-1 left-1 bg-black/80 px-1.5 py-0.5 font-mono text-[8.5px] text-purple-300 border border-purple-500/30">
                          9:16 FULL-BODY
                        </div>
                      </div>

                      <div className="flex items-center justify-between font-mono text-[9px] text-muted-foreground px-0.5">
                        <span>1080×1920 WebP Full HD</span>
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
                      download={`${pilot.id}-fullbody.webp`}
                      className="rounded border border-border/70 bg-black/50 hover:bg-black/90 p-1.5 text-muted-foreground hover:text-white transition-colors"
                      title="Tải ảnh toàn thân Full HD (WebP 1080x1920)"
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
                  <span className="text-slate-300">{art.fileSize} · WebP RGBA</span>
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
                  <strong className="text-white">1080 × 1920 (9:16 Full HD)</strong>
                </div>

                <div className="absolute bottom-3 inset-x-3 rounded bg-black/80 p-2.5 border border-border/80 backdrop-blur-sm flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">File raster WebP Full HD chất lượng cao</span>
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

      {/* 6. LIGHTBOX / HIGH-RES MODAL PREVIEW WITH MOBILE PAN & PINCH ZOOM */}
      {lightboxArtwork && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-2 sm:p-4 backdrop-blur-md"
          onClick={closeLightbox}
        >
          <div
            className="relative flex flex-col h-[94vh] max-h-[95vh] w-full max-w-5xl overflow-hidden rounded-sm border border-cyan-500/60 bg-panel shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-border/60 bg-black/90 px-3 py-2.5 sm:px-4 sm:py-3 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="font-display text-xs sm:text-sm font-bold text-white uppercase tracking-wider truncate">
                  {lightboxArtwork.title}
                </div>
                <span className="hidden sm:inline-block rounded bg-cyan-950 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-500/40 shrink-0">
                  {lightboxArtwork.dimensions} · {lightboxArtwork.fileSize}
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Zoom out button */}
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 1}
                  className="rounded border border-border/60 bg-black/60 p-1.5 font-mono text-xs text-slate-300 hover:text-white hover:border-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Thu nhỏ (-)"
                >
                  <ZoomOut className="size-3.5" />
                </button>

                {/* Current Zoom & Click to reset */}
                <button
                  onClick={resetZoomAndPan}
                  className={cn(
                    "rounded border px-2 py-1 font-mono text-xs transition-colors cursor-pointer flex items-center gap-1",
                    zoomLevel > 1
                      ? "border-cyan-400 bg-cyan-950 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                      : "border-border/60 bg-black/60 text-slate-300 hover:text-white",
                  )}
                  title="Bấm để đặt lại 1.0x (hoặc bấm R/0)"
                >
                  <span>{Math.round(zoomLevel * 100)}%</span>
                  {zoomLevel > 1 && <RotateCcw className="size-3 text-cyan-400" />}
                </button>

                {/* Zoom in button */}
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 4}
                  className="rounded border border-border/60 bg-black/60 p-1.5 font-mono text-xs text-slate-300 hover:text-white hover:border-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Phóng to (+)"
                >
                  <ZoomIn className="size-3.5" />
                </button>

                <div className="h-4 w-px bg-border/60 mx-0.5 hidden sm:block" />

                <a
                  href={lightboxArtwork.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded border border-border/60 bg-black/60 p-1.5 text-slate-300 hover:text-white transition-colors"
                  title="Mở ảnh gốc trong tab mới"
                >
                  <ExternalLink className="size-3.5" />
                </a>

                <a
                  href={lightboxArtwork.url}
                  download
                  className="rounded border border-border/60 bg-black/60 p-1.5 text-slate-300 hover:text-white transition-colors"
                  title="Tải ảnh gốc về máy"
                >
                  <Download className="size-3.5" />
                </a>

                <button
                  onClick={closeLightbox}
                  className="rounded border border-border/60 bg-black/60 p-1.5 text-slate-300 hover:text-white hover:border-red-400 cursor-pointer transition-colors"
                  title="Đóng (ESC)"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Modal Body / Image Viewport with Pan, Drag, Touch Gestures */}
            <div
              className="relative flex-1 overflow-hidden bg-black p-2 sm:p-4 flex items-center justify-center min-h-[350px] select-none touch-none cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              onWheel={handleWheel}
            >
              {/* Prev / Next buttons */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  prevLightbox()
                }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 rounded-full border border-border/60 bg-black/80 p-2 text-white hover:bg-cyan-950 hover:border-cyan-400 cursor-pointer shadow-lg transition-all active:scale-95"
                title="Tác phẩm trước (Mũi tên trái / Vuốt phải)"
              >
                <ChevronLeft className="size-5 sm:size-6" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nextLightbox()
                }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 rounded-full border border-border/60 bg-black/80 p-2 text-white hover:bg-cyan-950 hover:border-cyan-400 cursor-pointer shadow-lg transition-all active:scale-95"
                title="Tác phẩm tiếp theo (Mũi tên phải / Vuốt trái)"
              >
                <ChevronRight className="size-5 sm:size-6" />
              </button>

              {/* Transformable Canvas with Pan Offset & Zoom */}
              <div
                onClick={handleImageClick}
                className="flex items-center justify-center max-h-full max-w-full"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transition: isDragging ? "none" : "transform 220ms cubic-bezier(0.16, 1, 0.3, 1)",
                  willChange: "transform",
                }}
              >
                <img
                  src={lightboxArtwork.url}
                  alt={lightboxArtwork.title}
                  draggable={false}
                  className={cn(
                    "max-h-[62vh] sm:max-h-[68vh] object-contain rounded-xs shadow-2xl pointer-events-none select-none",
                    lightboxArtwork.type === "portrait" ? "max-w-[62vh] sm:max-w-[68vh]" : "max-w-full",
                  )}
                />
              </div>

              {/* Floating Quick Zoom & Gesture Bar */}
              <div className="absolute bottom-3 inset-x-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                {/* Gesture hint */}
                <div className="rounded-full bg-black/85 px-3 py-1 border border-border/70 backdrop-blur-md text-[10px] sm:text-[11px] font-mono text-slate-300 flex items-center gap-1.5 shadow-lg">
                  {zoomLevel > 1 ? (
                    <>
                      <Move className="size-3 text-cyan-400 animate-pulse" />
                      <span>
                        Đang phóng to <strong>{Math.round(zoomLevel * 100)}%</strong> · Kéo/vuốt để di chuyển vị trí xem · Chạm 2 lần để thu nhỏ
                      </span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="size-3 text-cyan-400" />
                      <span>
                        Vuốt ngang để chuyển tác phẩm · Kẹp 2 ngón hoặc nhấp đúp để phóng to
                      </span>
                    </>
                  )}
                </div>

                {/* Quick Zoom presets */}
                <div className="flex items-center gap-1 bg-black/85 p-1 rounded-full border border-border/70 backdrop-blur-md pointer-events-auto shadow-lg">
                  {[1, 1.5, 2.2, 3].map((z) => (
                    <button
                      key={z}
                      onClick={() => setSpecificZoom(z)}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer",
                        Math.abs(zoomLevel - z) < 0.15
                          ? "bg-cyan-500 text-black font-black shadow-sm"
                          : "text-slate-300 hover:text-white hover:bg-white/10",
                      )}
                    >
                      {z}x
                    </button>
                  ))}
                  {zoomLevel > 1 && (
                    <button
                      onClick={resetZoomAndPan}
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-900 cursor-pointer flex items-center gap-1"
                      title="Đặt lại về 1.0x"
                    >
                      <RotateCcw className="size-2.5" /> Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer info */}
            <div className="border-t border-border/60 bg-black/90 p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
              <div className="text-slate-300 flex items-center gap-2">
                <span className="hidden sm:inline font-bold">Asset:</span>{" "}
                <code className="text-cyan-300 bg-black px-1.5 py-0.5 rounded border border-cyan-500/30 text-[11px]">
                  {lightboxArtwork.url}
                </code>
                <span className="text-emerald-400 font-bold text-[11px] hidden md:inline">
                  ✓ WebP Full HD Sắc Nét
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => handleSelectPilotAsActive(lightboxArtwork.pilotId)}
                  className="rounded bg-cyan-600 hover:bg-cyan-500 px-3 py-1 font-bold text-white text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-md"
                >
                  <Check className="size-3.5" />
                  <span>Chọn Phi Công Này</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
