'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch'
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  Loader2,
  FileArchive,
  Sparkles,
  Layers,
  Play,
  Pause,
  Shuffle,
  Eye,
  EyeOff,
  Check,
  CheckSquare,
  Square,
  Users,
  Clock,
  Compass,
} from 'lucide-react'
import { resolveImageUrl } from '@/lib/game/assets/image-resolver'
import { CanonicalPilotId, CANONICAL_PILOT_IDS } from '@/lib/game/v2/character-content-types'

export interface GalleryItemData {
  id: string
  title: string
  category?: string
  path: string
  isAvailableOnDisk?: boolean
  status?: 'verified_webp' | 'archive_pending' | string
  description?: string
  dimensions?: { width: number; height: number }
  pilotId?: string
  pilotName?: string
  pilotCallsign?: string
}

export interface ArtViewerProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string
  imageAlt?: string
  title?: string
  subtitle?: string
  category?: string
  description?: string
  tags?: string[]
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
  isAvailableOnDisk?: boolean
  currentIndex?: number
  totalCount?: number
  // V2 Showcase Extensions
  artworks?: GalleryItemData[]
  currentPilotId?: string
  currentPilotName?: string
  currentPilotCallsign?: string
  allPilots?: Array<{ id: string; name: string; callsign: string }>
  onSelectArtwork?: (artwork: GalleryItemData, pilotId?: string) => void
}

const DEFAULT_SPEEDS = [4, 6, 10] as const
type SlideshowSpeed = (typeof DEFAULT_SPEEDS)[number]

const CANONICAL_PILOT_FALLBACKS: Array<{ id: string; name: string; callsign: string }> = [
  { id: 'valentine', name: 'Valentine', callsign: 'Mercy Wing' },
  { id: 'alviss', name: 'Alviss', callsign: 'Sky Strider' },
  { id: 'eric', name: 'Eric', callsign: 'Thunder Cannon' },
  { id: 'marcus', name: 'Marcus', callsign: 'Aegis Commander' },
  { id: 'victor', name: 'Victor', callsign: 'Iron Bulwark' },
  { id: 'kaelen', name: 'Kaelen', callsign: 'Void Stalker' },
  { id: 'lyra', name: 'Lyra', callsign: 'Prism Nova' },
  { id: 'selena', name: 'Selena', callsign: 'Silver Phantom' },
  { id: 'fortuna', name: 'Fortuna', callsign: 'Gambit Lady' },
  { id: 'aria', name: 'Aria', callsign: 'Echo Siren' },
  { id: 'rhea', name: 'Rhea', callsign: 'Chrono Weaver' },
  { id: 'nova', name: 'Nova', callsign: 'Aero Comet' },
]

/**
 * Fisher-Yates Shuffle with No-Immediate-Repeat constraint
 */
function shuffleBagWithNoRepeat<T extends { id: string }>(items: T[], lastId?: string): T[] {
  if (items.length <= 1) return [...items]
  const array = [...items]
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  // Ensure the first item of the new bag is not identical to the last shown item
  if (lastId && array[0].id === lastId && array.length > 1) {
    const swapTarget = Math.floor(Math.random() * (array.length - 1)) + 1
    ;[array[0], array[swapTarget]] = [array[swapTarget], array[0]]
  }
  return array
}

export function ArtViewer({
  isOpen,
  onClose,
  imageSrc,
  imageAlt = 'Starfront Artwork',
  title = 'Artwork Inspector',
  subtitle,
  category,
  description,
  tags = [],
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  isAvailableOnDisk = true,
  currentIndex,
  totalCount,
  artworks = [],
  currentPilotId = 'valentine',
  currentPilotName = 'Valentine',
  currentPilotCallsign = 'Mercy Wing',
  allPilots = CANONICAL_PILOT_FALLBACKS,
  onSelectArtwork,
}: ArtViewerProps) {
  // Zoom & Pan Canvas states
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<boolean>(false)
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null)
  const [currentScale, setCurrentScale] = useState<number>(1)

  // HUD & Drawers
  const [showInfoDrawer, setShowInfoDrawer] = useState<boolean>(false)
  const [showPilotDrawer, setShowPilotDrawer] = useState<boolean>(false)
  const [isCleanView, setIsCleanView] = useState<boolean>(false)

  // Slideshow State
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [speedSeconds, setSpeedSeconds] = useState<SlideshowSpeed>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('starfront_slideshow_speed')
      if (saved && (saved === '4' || saved === '6' || saved === '10')) {
        return parseInt(saved, 10) as SlideshowSpeed
      }
    }
    return 6
  })
  const [showSpeedSelector, setShowSpeedSelector] = useState<boolean>(false)

  // Random Showcase State
  const [isRandomMode, setIsRandomMode] = useState<boolean>(false)
  const [selectedPilotIds, setSelectedPilotIds] = useState<string[]>(() => [currentPilotId])
  const [pilotsArtworksMap, setPilotsArtworksMap] = useState<Record<string, GalleryItemData[]>>(() => {
    if (currentPilotId && artworks.length > 0) {
      return {
        [currentPilotId]: artworks.map((a) => ({
          ...a,
          pilotId: currentPilotId,
          pilotName: currentPilotName,
          pilotCallsign: currentPilotCallsign,
        })),
      }
    }
    return {}
  })
  const [loadingPilotIds, setLoadingPilotIds] = useState<Record<string, boolean>>({})

  // Shuffle Bag & Random History
  const [randomBag, setRandomBag] = useState<GalleryItemData[]>([])
  const [randomBagIndex, setRandomBagIndex] = useState<number>(0)

  // Internal Active Item Tracker
  const [activeItem, setActiveItem] = useState<GalleryItemData>({
    id: imageSrc,
    title,
    path: imageSrc,
    category,
    description,
    isAvailableOnDisk,
    pilotId: currentPilotId,
    pilotName: currentPilotName,
    pilotCallsign: currentPilotCallsign,
  })

  const transformRef = useRef<ReactZoomPanPinchRef>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const wasPlayingBeforeBackgroundRef = useRef<boolean>(false)

  // Sync active item when props change
  useEffect(() => {
    setActiveItem({
      id: imageSrc,
      title: title || 'Artwork Inspector',
      path: imageSrc,
      category,
      description,
      isAvailableOnDisk,
      pilotId: currentPilotId,
      pilotName: currentPilotName,
      pilotCallsign: currentPilotCallsign,
    })
  }, [imageSrc, title, category, description, isAvailableOnDisk, currentPilotId, currentPilotName, currentPilotCallsign])

  // Update current pilot artworks in cache if provided
  useEffect(() => {
    if (currentPilotId && artworks.length > 0) {
      setPilotsArtworksMap((prev) => ({
        ...prev,
        [currentPilotId]: artworks.map((a) => ({
          ...a,
          pilotId: currentPilotId,
          pilotName: currentPilotName,
          pilotCallsign: currentPilotCallsign,
        })),
      }))
    }
  }, [currentPilotId, currentPilotName, currentPilotCallsign, artworks])

  // Reset transform whenever active item changes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      setLoadError(!activeItem.isAvailableOnDisk)
      setNaturalDimensions(null)
      setCurrentScale(1)
      if (transformRef.current) {
        transformRef.current.resetTransform()
      }
    }
  }, [isOpen, activeItem.path, activeItem.isAvailableOnDisk])

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return
    const origOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = origOverflow
    }
  }, [isOpen])

  // Pause helper: pause slideshow and clear timer on manual user interaction
  const pauseSlideshow = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false)
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [isPlaying])

  // Fetch gallery for a pilot if not already loaded
  const loadPilotGallery = useCallback(
    async (pilotId: string) => {
      if (pilotsArtworksMap[pilotId]?.length > 0) return pilotsArtworksMap[pilotId]

      setLoadingPilotIds((prev) => ({ ...prev, [pilotId]: true }))
      try {
        const res = await fetch(`/api/runtime/gallery/${pilotId}`)
        const data = await res.json()
        if (data.success && Array.isArray(data.artworks)) {
          const pilotMeta = allPilots.find((p) => p.id === pilotId)
          const cleanArts: GalleryItemData[] = data.artworks.map((a: any) => {
            const cleanPath = a.path
              ? a.path.startsWith('/')
                ? a.path.slice(1)
                : a.path
              : a.sourceUrl || `images/pilots/${pilotId}/${a.filename}`

            return {
              id: a.assetId || a.filename || a.id,
              title: a.title || a.label || a.filename || 'Tác phẩm',
              path: cleanPath,
              category: a.category || a.roleCategory || 'lore',
              description: a.curatedDescription || a.description,
              isAvailableOnDisk: a.isAvailableOnDisk !== false,
              status: a.status || 'verified_webp',
              dimensions: a.width && a.height ? { width: a.width, height: a.height } : undefined,
              pilotId,
              pilotName: pilotMeta?.name || pilotId,
              pilotCallsign: pilotMeta?.callsign || '',
            }
          })

          setPilotsArtworksMap((prev) => ({
            ...prev,
            [pilotId]: cleanArts,
          }))
          return cleanArts
        }
      } catch (err) {
        console.warn(`Failed to fetch gallery for pilot ${pilotId}:`, err)
      } finally {
        setLoadingPilotIds((prev) => ({ ...prev, [pilotId]: false }))
      }
      return []
    },
    [allPilots, pilotsArtworksMap]
  )

  // Collect pool of available artworks for Random Mode
  const randomPool = useMemo(() => {
    const list: GalleryItemData[] = []
    for (const pId of selectedPilotIds) {
      const pArts = pilotsArtworksMap[pId]
      if (Array.isArray(pArts)) {
        for (const item of pArts) {
          if (item && item.isAvailableOnDisk !== false) {
            list.push(item)
          }
        }
      }
    }
    return list
  }, [selectedPilotIds, pilotsArtworksMap])

  // Initialize or re-shuffle bag when randomPool changes or when toggling Random Mode
  useEffect(() => {
    if (isRandomMode) {
      if (randomPool.length > 0) {
        const newBag = shuffleBagWithNoRepeat(randomPool, activeItem.id)
        setRandomBag(newBag)
        setRandomBagIndex(0)
      } else {
        setRandomBag([])
        setRandomBagIndex(0)
      }
    }
  }, [isRandomMode, randomPool.length])

  // Advance Next Artwork (Sequential or Random)
  const handleAdvanceNext = useCallback(() => {
    if (isRandomMode && randomBag.length > 0) {
      let nextIdx = randomBagIndex + 1
      let currentBag = randomBag

      if (nextIdx >= currentBag.length) {
        // Refill and reshuffle bag
        currentBag = shuffleBagWithNoRepeat(randomPool, currentBag[currentBag.length - 1]?.id)
        setRandomBag(currentBag)
        nextIdx = 0
      }

      setRandomBagIndex(nextIdx)
      const nextArtwork = currentBag[nextIdx]
      if (nextArtwork) {
        setActiveItem(nextArtwork)
        if (onSelectArtwork) {
          onSelectArtwork(nextArtwork, nextArtwork.pilotId)
        }
      }
    } else {
      // Sequential Mode
      if (hasNext && onNext) {
        onNext()
      } else if (artworks.length > 0) {
        // Internal loop
        const currentIdx = artworks.findIndex(
          (a) => a.path === activeItem.path || a.id === activeItem.id
        )
        const nextIdx = (currentIdx + 1) % artworks.length
        const nextArtwork = artworks[nextIdx]
        if (nextArtwork) {
          setActiveItem(nextArtwork)
          if (onSelectArtwork) {
            onSelectArtwork(nextArtwork, currentPilotId)
          }
        }
      }
    }
  }, [isRandomMode, randomBag, randomBagIndex, randomPool, hasNext, onNext, artworks, activeItem, onSelectArtwork, currentPilotId])

  // Advance Previous Artwork
  const handleAdvancePrev = useCallback(() => {
    if (isRandomMode && randomBag.length > 0) {
      const prevIdx = (randomBagIndex - 1 + randomBag.length) % randomBag.length
      setRandomBagIndex(prevIdx)
      const prevArtwork = randomBag[prevIdx]
      if (prevArtwork) {
        setActiveItem(prevArtwork)
        if (onSelectArtwork) {
          onSelectArtwork(prevArtwork, prevArtwork.pilotId)
        }
      }
    } else {
      // Sequential Mode
      if (hasPrev && onPrev) {
        onPrev()
      } else if (artworks.length > 0) {
        const currentIdx = artworks.findIndex(
          (a) => a.path === activeItem.path || a.id === activeItem.id
        )
        const prevIdx = (currentIdx - 1 + artworks.length) % artworks.length
        const prevArtwork = artworks[prevIdx]
        if (prevArtwork) {
          setActiveItem(prevArtwork)
          if (onSelectArtwork) {
            onSelectArtwork(prevArtwork, currentPilotId)
          }
        }
      }
    }
  }, [isRandomMode, randomBag, randomBagIndex, hasPrev, onPrev, artworks, activeItem, onSelectArtwork, currentPilotId])

  // Preload next image (Maximum 1 next image ahead)
  useEffect(() => {
    let nextTarget: GalleryItemData | null = null
    if (isRandomMode && randomBag.length > 0) {
      const nextIdx = (randomBagIndex + 1) % randomBag.length
      nextTarget = randomBag[nextIdx]
    } else if (artworks.length > 0) {
      const currentIdx = artworks.findIndex(
        (a) => a.path === activeItem.path || a.id === activeItem.id
      )
      if (currentIdx >= 0) {
        const nextIdx = (currentIdx + 1) % artworks.length
        nextTarget = artworks[nextIdx]
      }
    }

    if (nextTarget && nextTarget.path) {
      const nextResolved = resolveImageUrl(nextTarget.path)
      if (nextResolved) {
        const preloader = new window.Image()
        preloader.src = nextResolved
      }
    }
  }, [isRandomMode, randomBag, randomBagIndex, artworks, activeItem.path, activeItem.id])

  // Handle Slideshow Timer
  useEffect(() => {
    if (!isOpen || !isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setInterval(() => {
      handleAdvanceNext()
    }, speedSeconds * 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isOpen, isPlaying, speedSeconds, handleAdvanceNext])

  // Browser Tab Visibility Handling (Stop timer when tab hidden, resume without skipping when returned)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasPlayingBeforeBackgroundRef.current = isPlaying
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      } else {
        if (wasPlayingBeforeBackgroundRef.current && isOpen) {
          setIsPlaying(true)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isPlaying, isOpen])

  // Clean timer on unmount or close
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isOpen])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return

      // Don't intercept typing in inputs
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        if (showInfoDrawer) {
          setShowInfoDrawer(false)
        } else if (showPilotDrawer) {
          setShowPilotDrawer(false)
        } else if (isCleanView) {
          setIsCleanView(false)
        } else {
          onClose()
        }
      } else if (e.key === ' ') {
        e.preventDefault()
        setIsPlaying((prev) => !prev)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        pauseSlideshow()
        handleAdvancePrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        pauseSlideshow()
        handleAdvanceNext()
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        pauseSlideshow()
        setShowInfoDrawer((prev) => !prev)
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault()
        setIsCleanView((prev) => !prev)
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        setIsRandomMode((prev) => !prev)
      } else if (e.key === '0') {
        e.preventDefault()
        transformRef.current?.resetTransform()
      }
    },
    [isOpen, showInfoDrawer, showPilotDrawer, isCleanView, pauseSlideshow, handleAdvancePrev, handleAdvanceNext, onClose]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!isOpen) return null

  const resolvedUrl = resolveImageUrl(activeItem.path)

  // 100% Actual size calculation
  const handleSetActualSize = () => {
    pauseSlideshow()
    if (!transformRef.current || !naturalDimensions) return
    const container = transformRef.current.instance.wrapperComponent
    if (!container) {
      transformRef.current.setTransform(0, 0, 1)
      return
    }
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    const scaleX = naturalDimensions.width / Math.min(containerWidth * 0.9, naturalDimensions.width)
    const scaleY = naturalDimensions.height / Math.min(containerHeight * 0.85, naturalDimensions.height)
    const actualScale = Math.max(1, Math.min(5, Math.max(scaleX, scaleY)))
    transformRef.current.setTransform(0, 0, actualScale)
  }

  // Speed selection handler
  const handleSelectSpeed = (s: SlideshowSpeed) => {
    setSpeedSeconds(s)
    setShowSpeedSelector(false)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('starfront_slideshow_speed', String(s))
    }
  }

  // Toggle pilot in Random Showcase
  const handleTogglePilot = async (pilotId: string) => {
    pauseSlideshow()
    let nextSelected: string[]
    if (selectedPilotIds.includes(pilotId)) {
      if (selectedPilotIds.length === 1) return // Keep at least one
      nextSelected = selectedPilotIds.filter((id) => id !== pilotId)
    } else {
      nextSelected = [...selectedPilotIds, pilotId]
      // Preload gallery for this pilot if not in cache
      await loadPilotGallery(pilotId)
    }
    setSelectedPilotIds(nextSelected)
  }

  // Select all pilots
  const handleSelectAllPilots = async () => {
    pauseSlideshow()
    const allIds = allPilots.map((p) => p.id)
    setSelectedPilotIds(allIds)
    // Preload missing galleries in background
    for (const p of allPilots) {
      if (!pilotsArtworksMap[p.id]) {
        loadPilotGallery(p.id)
      }
    }
  }

  // Deselect all except current pilot
  const handleDeselectAllPilots = () => {
    pauseSlideshow()
    setSelectedPilotIds([currentPilotId])
  }

  const effectivePilotName = activeItem.pilotName || currentPilotName
  const effectiveCallsign = activeItem.pilotCallsign || currentPilotCallsign
  const effectiveTotal = isRandomMode ? randomPool.length : (totalCount || artworks.length || 1)
  const effectiveIndex = isRandomMode ? randomBagIndex + 1 : (currentIndex || 1)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={activeItem.title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl select-none animate-in fade-in duration-200"
    >
      {/* =================================================================== */}
      {/* 1. TOP FLOATING HEADER HUD                                          */}
      {/* =================================================================== */}
      {!isCleanView && (
        <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 z-40 flex items-center justify-between gap-2 pointer-events-none transition-all duration-300">
          {/* Left: Metadata Badge & Pilot Info */}
          <div className="flex items-center gap-2 pointer-events-auto bg-[#090D18]/90 border border-[#1E2D42] backdrop-blur-md px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs font-mono text-[#F1F5F9] shadow-2xl max-w-[calc(100vw-80px)] sm:max-w-xl">
            {isRandomMode ? (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/50 shrink-0">
                <Shuffle className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>RANDOM</span>
              </span>
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[#00D4FF] shrink-0" />
            )}

            {/* Counter Badge */}
            <span className="whitespace-nowrap text-[11px] font-mono font-black text-[#00D4FF] bg-[#00D4FF]/15 px-2.5 py-0.5 rounded-full border border-[#00D4FF]/40 tracking-wider shrink-0">
              ẢNH {String(effectiveIndex).padStart(2, '0')} / {String(effectiveTotal).padStart(2, '0')}
            </span>

            {/* Pilot Identity Badge */}
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60 shrink-0 uppercase">
              <span>{effectivePilotName}</span>
              {effectiveCallsign && <span className="text-slate-400">· {effectiveCallsign}</span>}
            </span>

            {/* Artwork Title */}
            <span className="font-bold truncate text-white">{activeItem.title}</span>

            {/* Quick Info Toggle */}
            <button
              type="button"
              onClick={() => {
                pauseSlideshow()
                setShowInfoDrawer((prev) => !prev)
              }}
              title="Xem thông tin chi tiết tác phẩm (I)"
              className="p-1 rounded-full text-[#00D4FF] hover:bg-[#142338] transition-colors shrink-0 ml-1 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Close Fullscreen Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng viewer (Esc)"
            className="pointer-events-auto w-11 h-11 rounded-full bg-[#090D18]/90 border border-[#1E2D42] hover:border-[#EF4444] text-[#CBD5E1] hover:text-[#EF4444] hover:bg-rose-950/40 flex items-center justify-center transition-all shadow-2xl cursor-pointer active:scale-95 shrink-0"
            title="Đóng viewer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Clean View Toggle Back Icon (When HUD is hidden) */}
      {isCleanView && (
        <button
          type="button"
          onClick={() => setIsCleanView(false)}
          className="absolute top-4 right-4 z-40 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black/90 border border-[#1E2D42] text-xs font-mono text-cyan-300 flex items-center gap-1.5 backdrop-blur-md shadow-2xl cursor-pointer transition-all animate-in fade-in"
          title="Bật lại thanh điều khiển (H)"
        >
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>Hiện Controls (H)</span>
        </button>
      )}

      {/* =================================================================== */}
      {/* 2. PREVIOUS / NEXT ARROWS                                           */}
      {/* =================================================================== */}
      {!isCleanView && (
        <>
          <button
            type="button"
            onClick={() => {
              pauseSlideshow()
              handleAdvancePrev()
            }}
            aria-label="Tác phẩm trước (Arrow Left)"
            className="absolute left-3 sm:left-4 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#090D18]/85 border border-[#1E2D42] hover:border-[#00D4FF] text-[#CBD5E1] hover:text-[#00D4FF] hover:bg-[#142338] flex items-center justify-center transition-all backdrop-blur-md shadow-2xl active:scale-95 cursor-pointer"
            title="Tác phẩm trước (←)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={() => {
              pauseSlideshow()
              handleAdvanceNext()
            }}
            aria-label="Tác phẩm tiếp theo (Arrow Right)"
            className="absolute right-3 sm:right-4 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#090D18]/85 border border-[#1E2D42] hover:border-[#00D4FF] text-[#CBD5E1] hover:text-[#00D4FF] hover:bg-[#142338] flex items-center justify-center transition-all backdrop-blur-md shadow-2xl active:scale-95 cursor-pointer"
            title="Tác phẩm tiếp theo (→)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* =================================================================== */}
      {/* 3. MAIN CANVAS WITH ZOOM, PAN, PINCH                                */}
      {/* =================================================================== */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {/* Loading Spinner */}
        {isLoading && !loadError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/40">
            <Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" />
            <span className="text-xs font-mono text-[#00D4FF]">Đang nạp tác phẩm WebP HD...</span>
          </div>
        )}

        {/* Fallback Archive Card */}
        {loadError && (
          <div className="z-20 max-w-sm text-center p-6 rounded-2xl bg-[#090D18]/95 border border-[#1E2D42] shadow-2xl space-y-3 mx-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#142338] border border-[#1E2D42] flex items-center justify-center text-[#F59E0B]">
              <FileArchive className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-white font-mono">{activeItem.title}</h4>
            <p className="text-xs font-mono text-[#00D4FF]">{effectivePilotName}</p>
            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              Tác phẩm này đang ở danh mục chờ phát hành WebP trên CDN. Toàn bộ thông số metadata vẫn được bảo toàn.
            </p>
          </div>
        )}

        {/* Image Transform Canvas */}
        {!loadError && (
          <TransformWrapper
            ref={transformRef}
            initialScale={1}
            minScale={0.5}
            maxScale={5.0}
            centerOnInit
            wheel={{ step: 0.2 }}
            doubleClick={{ mode: 'zoomIn', step: 0.8 }}
            panning={{ disabled: false, velocityDisabled: false }}
            {...({
              onTransform: (_: any, state: any) => {
                if (state && typeof state.scale === 'number') {
                  setCurrentScale(state.scale)
                }
              },
              onPanningStart: () => {
                pauseSlideshow()
              },
              onPinchingStart: () => {
                pauseSlideshow()
              },
            } as any)}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <TransformComponent
                wrapperClass="!w-full !h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                contentClass="flex items-center justify-center min-w-full min-h-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolvedUrl}
                  alt={imageAlt || activeItem.title}
                  draggable={false}
                  className="max-w-[94vw] max-h-[86vh] object-contain select-none transition-opacity duration-200 drop-shadow-[0_25px_50px_rgba(0,0,0,0.95)]"
                  style={{ opacity: isLoading ? 0 : 1 }}
                  onLoad={(e) => {
                    setIsLoading(false)
                    const target = e.currentTarget
                    setNaturalDimensions({
                      width: target.naturalWidth,
                      height: target.naturalHeight,
                    })
                  }}
                  onError={() => {
                    setIsLoading(false)
                    setLoadError(true)
                  }}
                />
              </TransformComponent>
            )}
          </TransformWrapper>
        )}
      </div>

      {/* =================================================================== */}
      {/* 4. BOTTOM FLOATING CONTROL DOCK (Compact & Sleek)                   */}
      {/* =================================================================== */}
      {!isCleanView && (
        <div className="absolute bottom-4 sm:bottom-5 z-40 flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#090D18]/92 border border-[#1E2D42] backdrop-blur-2xl shadow-2xl text-[#CBD5E1] max-w-[96vw] overflow-x-auto scrollbar-none">
          {/* PLAY / PAUSE BUTTON */}
          <button
            type="button"
            onClick={() => {
              setIsPlaying((prev) => !prev)
            }}
            title={isPlaying ? 'Tạm dừng slideshow (Space)' : 'Bật tự động trình chiếu (Space)'}
            aria-label="Play or Pause Slideshow"
            className={`p-2 rounded-full font-bold transition-all cursor-pointer flex items-center justify-center ${
              isPlaying
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(0,212,255,0.6)]'
                : 'hover:bg-[#142338] hover:text-[#00D4FF]'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          {/* SLIDESHOW SPEED SELECTOR (4s / 6s / 10s) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSpeedSelector((prev) => !prev)}
              title="Chọn khoảng cách chuyển ảnh"
              className="px-2 py-1 text-[11px] font-mono font-bold rounded-lg hover:bg-[#142338] hover:text-[#00D4FF] transition-colors cursor-pointer flex items-center gap-1"
            >
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>{speedSeconds}s</span>
            </button>

            {showSpeedSelector && (
              <div className="absolute bottom-full mb-2 left-0 z-50 rounded-xl bg-[#0B111E] border border-cyan-800/80 p-1.5 shadow-2xl flex flex-col gap-1 min-w-[70px]">
                {DEFAULT_SPEEDS.map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => handleSelectSpeed(spd)}
                    className={`px-2 py-1 text-[11px] font-mono font-bold rounded text-left transition-colors cursor-pointer flex items-center justify-between ${
                      speedSeconds === spd
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{spd}s</span>
                    {speedSeconds === spd && <Check className="w-3 h-3 text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-[#1E2D42] mx-0.5 shrink-0" />

          {/* RANDOM SHOWCASE TOGGLE */}
          <button
            type="button"
            onClick={() => {
              pauseSlideshow()
              setIsRandomMode((prev) => !prev)
            }}
            title={isRandomMode ? 'Tắt chế độ Random (R)' : 'Bật Random Showcase 12 Pilot (R)'}
            aria-label="Toggle Random Showcase"
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              isRandomMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'hover:bg-[#142338] hover:text-[#00D4FF]'
            }`}
          >
            <Shuffle className={`w-3.5 h-3.5 ${isRandomMode ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Random</span>
          </button>

          {/* PILOT FILTER PANEL BUTTON */}
          <button
            type="button"
            onClick={() => {
              pauseSlideshow()
              setShowPilotDrawer((prev) => !prev)
            }}
            title="Chọn danh sách phi công trình chiếu"
            aria-label="Chọn phi công trình chiếu"
            className={`p-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              showPilotDrawer
                ? 'bg-cyan-950 border border-cyan-500 text-cyan-300'
                : 'hover:bg-[#142338] hover:text-[#00D4FF]'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] hidden sm:inline">Pilots ({selectedPilotIds.length})</span>
          </button>

          <div className="h-4 w-px bg-[#1E2D42] mx-0.5 shrink-0" />

          {/* ZOOM OUT */}
          <button
            type="button"
            onClick={() => {
              pauseSlideshow()
              transformRef.current?.zoomOut(0.3)
            }}
            title="Thu nhỏ"
            aria-label="Thu nhỏ"
            className="p-1.5 rounded-full hover:bg-[#142338] hover:text-[#00D4FF] transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* ZOOM IN */}
          <button
            type="button"
            onClick={() => {
              pauseSlideshow()
              transformRef.current?.zoomIn(0.3)
            }}
            title="Phóng to"
            aria-label="Phóng to"
            className="p-1.5 rounded-full hover:bg-[#142338] hover:text-[#00D4FF] transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* FIT TO SCREEN */}
          <button
            type="button"
            onClick={() => {
              pauseSlideshow()
              transformRef.current?.resetTransform()
            }}
            title="Vừa khung hình (Fit)"
            aria-label="Vừa khung hình"
            className="px-2 py-1 text-xs font-mono font-bold rounded-lg hover:bg-[#142338] hover:text-[#00D4FF] transition-colors cursor-pointer"
          >
            Fit
          </button>

          {/* 100% ACTUAL SIZE */}
          <button
            type="button"
            onClick={handleSetActualSize}
            title="Kích thước thực 100%"
            aria-label="Kích thước thực"
            className="px-2 py-1 text-xs font-mono font-bold rounded-lg hover:bg-[#142338] hover:text-[#00D4FF] transition-colors cursor-pointer hidden sm:block"
          >
            100%
          </button>

          {/* SCALE DISPLAY */}
          <span className="text-[11px] font-mono font-bold text-[#00D4FF] px-1.5 min-w-[38px] text-center hidden sm:inline-block">
            {Math.round(currentScale * 100)}%
          </span>

          {/* RESET VIEW */}
          <button
            type="button"
            onClick={() => {
              pauseSlideshow()
              transformRef.current?.resetTransform()
            }}
            title="Đặt lại góc nhìn (0)"
            aria-label="Đặt lại góc nhìn"
            className="p-1.5 rounded-full hover:bg-[#142338] hover:text-[#00D4FF] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-[#1E2D42] mx-0.5 shrink-0" />

          {/* CLEAN VIEW / HIDE HUD */}
          <button
            type="button"
            onClick={() => setIsCleanView(true)}
            title="Xem ảnh sạch không HUD (H)"
            aria-label="Ẩn toàn bộ controls"
            className="p-1.5 rounded-full hover:bg-[#142338] hover:text-[#00D4FF] transition-colors cursor-pointer"
          >
            <EyeOff className="w-4 h-4" />
          </button>

          {/* TOGGLE INFO DRAWER */}
          <button
            type="button"
            onClick={() => {
              pauseSlideshow()
              setShowInfoDrawer((prev) => !prev)
            }}
            title={showInfoDrawer ? 'Ẩn thông tin (I)' : 'Xem thông tin tác phẩm (I)'}
            aria-label="Bật tắt thông tin chi tiết tác phẩm"
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              showInfoDrawer ? 'bg-[#00D4FF] text-[#070A12]' : 'hover:bg-[#142338] hover:text-[#00D4FF]'
            }`}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. PILOT SELECTION DRAWER (FOR RANDOM SHOWCASE)                     */}
      {/* =================================================================== */}
      {showPilotDrawer && (
        <>
          <div
            onClick={() => setShowPilotDrawer(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs animate-fade-in"
          />

          <div
            role="region"
            aria-label="Bộ chọn phi công trình chiếu ngẫu nhiên"
            className="fixed z-50 rounded-2xl bg-[#090D18]/98 border border-[#1E2D42] backdrop-blur-2xl shadow-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 inset-x-3 bottom-3 max-h-[80vh] sm:inset-x-auto sm:left-4 sm:top-16 sm:bottom-20 sm:w-84 sm:max-h-none"
          >
            <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-thin">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#1E2D42] pb-2.5">
                <div className="flex items-center gap-2">
                  <Shuffle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    CHỌN PILOT TRÌNH CHIẾU
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPilotDrawer(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons: Select All / Deselect All */}
              <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                <button
                  type="button"
                  onClick={handleSelectAllPilots}
                  className="px-2.5 py-1 rounded bg-[#142338] hover:bg-cyan-950 text-cyan-300 border border-cyan-800/80 cursor-pointer font-bold"
                >
                  Chọn Tất Cả (12)
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllPilots}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  Chỉ Pilot Hiện Tại
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Hệ thống sẽ trộn ngẫu nhiên toàn bộ tranh từ các phi công được đánh dấu và đảm bảo không lặp lại hai ảnh liên tiếp.
              </p>

              {/* 12 Pilot Checkbox List */}
              <div className="space-y-1.5 pt-1">
                {allPilots.map((p) => {
                  const isChecked = selectedPilotIds.includes(p.id)
                  const pArts = pilotsArtworksMap[p.id]
                  const count = pArts ? pArts.length : null
                  const isLoadingThis = loadingPilotIds[p.id]

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleTogglePilot(p.id)}
                      className={`w-full p-2 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#101E34] border-cyan-500/80 text-white shadow-xs'
                          : 'bg-[#080D1A] border-slate-800/80 text-slate-400 hover:bg-[#0D1526]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <div className="truncate">
                          <div className="text-xs font-mono font-bold">{p.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{p.callsign}</div>
                        </div>
                      </div>

                      <div className="shrink-0 text-[10px] font-mono">
                        {isLoadingThis ? (
                          <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                        ) : count !== null ? (
                          <span className={`px-2 py-0.5 rounded ${count > 0 ? 'bg-cyan-950 text-cyan-300' : 'bg-slate-900 text-slate-500'}`}>
                            {count} ảnh
                          </span>
                        ) : (
                          <span className="text-slate-500">Chờ nạp</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-[#1E2D42] text-[11px] font-mono text-cyan-400 text-center shrink-0">
              Tổng số tranh sẵn sàng: {randomPool.length} tác phẩm
            </div>
          </div>
        </>
      )}

      {/* =================================================================== */}
      {/* 6. RESPONSIVE METADATA INFO PANEL (Desktop Side / Mobile Sheet)      */}
      {/* =================================================================== */}
      {showInfoDrawer && (
        <>
          <div
            onClick={() => setShowInfoDrawer(false)}
            className="sm:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs animate-fade-in"
          />

          <div
            role="region"
            aria-label="Thông tin chi tiết tác phẩm"
            className="fixed z-50 rounded-2xl bg-[#090D18]/98 border border-[#1E2D42] backdrop-blur-2xl shadow-2xl p-5 flex flex-col justify-between transition-all duration-200 inset-x-0 bottom-0 max-h-[75vh] rounded-b-none border-b-0 animate-in slide-in-from-bottom sm:inset-x-auto sm:right-4 sm:top-16 sm:bottom-20 sm:w-88 sm:max-h-none sm:rounded-2xl sm:border-b sm:animate-in sm:slide-in-from-right"
          >
            {/* Mobile Drag Handle */}
            <div className="sm:hidden w-12 h-1 bg-[#24354D] rounded-full mx-auto mb-3 shrink-0" />

            <div className="space-y-4 overflow-y-auto pr-1 scrollbar-thin">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#1E2D42] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
                  <span className="text-xs font-mono font-black text-[#00D4FF] uppercase tracking-wider">
                    THÔNG TIN TÁC PHẨM
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInfoDrawer(false)}
                  aria-label="Đóng panel thông tin"
                  className="text-[#A7B6C8] hover:text-white p-1 rounded-lg hover:bg-[#142338] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Pilot Info Card */}
              <div className="p-3 rounded-xl bg-[#0E1626] border border-[#20324B] space-y-1">
                <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                  PHI CÔNG LIÊN KẾT
                </div>
                <div className="text-sm font-bold text-white font-mono">{effectivePilotName}</div>
                {effectiveCallsign && (
                  <div className="text-xs font-mono text-slate-400">Biệt hiệu: {effectiveCallsign}</div>
                )}
              </div>

              {/* Full Artwork Title */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white font-mono leading-snug">
                  {activeItem.title}
                </h3>
                {subtitle && <p className="text-xs text-[#00D4FF] font-semibold mt-1">{subtitle}</p>}
              </div>

              {/* Category */}
              {activeItem.category && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#142338] text-[#00D4FF] border border-[#00D4FF]/30 uppercase">
                  <Layers className="w-3.5 h-3.5 text-[#00D4FF]" />
                  <span>Phân Loại: {activeItem.category}</span>
                </div>
              )}

              {/* Full Description from JSON */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#94A3B8]">
                  Mô Tả Bối Cảnh Thực Tế:
                </span>
                <p className="text-sm text-[#F1F5F9] leading-relaxed">
                  {activeItem.description || 'Tác phẩm nghệ thuật chuẩn hóa chính thức của Starfront World.'}
                </p>
              </div>

              {/* Technical Specifications */}
              <div className="p-3.5 rounded-xl bg-[#0B111E] border border-[#1E2D42] space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-[#A7B6C8]">
                  <span>Độ phân giải:</span>
                  <span className="text-white font-bold">
                    {naturalDimensions
                      ? `${naturalDimensions.width} × ${naturalDimensions.height} px`
                      : activeItem.dimensions
                      ? `${activeItem.dimensions.width} × ${activeItem.dimensions.height} px`
                      : 'Đang đọc...'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#A7B6C8]">
                  <span>Trạng thái WebP:</span>
                  <span className="text-[#34D399] font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#34D399]" />
                    <span>{activeItem.isAvailableOnDisk ? 'Đã xác thực' : 'Chờ đồng bộ'}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#A7B6C8]">
                  <span>Tỷ lệ phóng hiện tại:</span>
                  <span className="text-[#00D4FF] font-bold">{Math.round(currentScale * 100)}%</span>
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#94A3B8]">
                    Thẻ Phân Lớp:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[#142338] text-[#CBD5E1] border border-[#1E2D42]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#1E2D42] text-[11px] font-mono text-[#94A3B8] text-center shrink-0">
              STARFRONT WORLD V2 // IMMERSIVE ART SHOWCASE
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ArtViewer
