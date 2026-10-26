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
import {
  CANONICAL_12_PILOT_IDS,
  CANONICAL_PILOT_METADATA,
  CanonicalPilotId,
} from '@/lib/game/v2/universal-content-types'
import {
  ShowcaseArtwork,
  buildArtworkIdentityKey,
  fetchShowcasePilotGallery,
  createShuffleBag,
  preloadAndDecodeImage,
  preloadShowcaseQueue,
} from '@/lib/game/v2/gallery-showcase-engine'

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
  artworks?: Array<{
    id: string
    title: string
    path: string
    category?: string
    description?: string
    isAvailableOnDisk?: boolean
    status?: string
    dimensions?: { width: number; height: number }
    pilotId?: string
    pilotName?: string
    pilotCallsign?: string
  }>
  currentPilotId?: string
  currentPilotName?: string
  currentPilotCallsign?: string
  allPilots?: Array<{ id: string; name: string; callsign: string }>
  onSelectArtwork?: (artwork: any, pilotId?: string) => void
}

const DEFAULT_SPEEDS = [4, 6, 10] as const
type SlideshowSpeed = (typeof DEFAULT_SPEEDS)[number]

export function ArtViewer({
  isOpen,
  onClose,
  imageSrc,
  imageAlt = 'Starfront Artwork',
  title = 'Artwork Inspector',
  subtitle,
  category = 'lore',
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
  allPilots,
  onSelectArtwork,
}: ArtViewerProps) {
  // Pilot Canonical Info Map
  const canonicalPilots = useMemo(() => {
    return CANONICAL_12_PILOT_IDS.map((pId) => {
      const meta = CANONICAL_PILOT_METADATA[pId]
      return {
        id: pId,
        name: meta?.name ? meta.name.split(' ')[0] : pId,
        fullName: meta?.name || pId,
        callsign: meta?.callsign || '',
        gender: meta?.gender || 'Female',
        portraitPath: `images/pilots/${pId}/${pId}-portrait.webp`,
      }
    })
  }, [])

  // Initial Artwork Setup
  const initialShowcaseItem = useMemo<ShowcaseArtwork>(() => {
    const cleanPath = imageSrc.startsWith('/') ? imageSrc.slice(1) : imageSrc
    const assetId = cleanPath.split('/').pop() || 'art'
    
    // Auto-detect pilotId from canonical path pattern: images/pilots/<pilotId>/...
    const pathMatch = cleanPath.match(/^images\/pilots\/([a-z0-9-_]+)\//i)
    const effectivePilotId = (pathMatch ? pathMatch[1] : currentPilotId).toLowerCase().trim()
    const identityKey = buildArtworkIdentityKey(effectivePilotId, assetId, cleanPath)
    const meta = CANONICAL_PILOT_METADATA[effectivePilotId as CanonicalPilotId]
    const effectivePilotName = meta?.name ? meta.name.split(' ')[0] : (effectivePilotId === currentPilotId ? currentPilotName : effectivePilotId.toUpperCase())
    const effectiveCallsign = meta?.callsign || (effectivePilotId === currentPilotId ? currentPilotCallsign : '')

    return {
      identityKey,
      assetId,
      filename: assetId,
      path: cleanPath,
      resolvedUrl: resolveImageUrl(cleanPath) || '',
      title: title || 'Artwork Inspector',
      description: description || `Tác phẩm chuẩn hóa của phi công ${effectivePilotName}.`,
      curatedDescription: description,
      category: category || 'lore',
      isAvailableOnDisk: isAvailableOnDisk !== false,
      status: 'verified_webp',
      pilotId: effectivePilotId,
      pilotName: effectivePilotName,
      pilotCallsign: effectiveCallsign,
      pilotGender: meta?.gender || 'Female',
      pilotPortraitPath: `images/pilots/${effectivePilotId}/${effectivePilotId}-portrait.webp`,
    }
  }, [imageSrc, title, description, category, isAvailableOnDisk, currentPilotId, currentPilotName, currentPilotCallsign])

  // =========================================================================
  // AUTHORITATIVE SINGLE SOURCE OF TRUTH: currentArtwork
  // =========================================================================
  const [currentArtwork, setCurrentArtwork] = useState<ShowcaseArtwork>(initialShowcaseItem)
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false)
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
      if (saved === '4' || saved === '6' || saved === '10') {
        return parseInt(saved, 10) as SlideshowSpeed
      }
    }
    return 6
  })
  const [showSpeedSelector, setShowSpeedSelector] = useState<boolean>(false)

  // Random Showcase State
  const [isRandomMode, setIsRandomMode] = useState<boolean>(false)
  const [selectedPilotIds, setSelectedPilotIds] = useState<string[]>(() => [currentPilotId])
  const [pilotsArtworksMap, setPilotsArtworksMap] = useState<Record<string, ShowcaseArtwork[]>>({})
  const [loadingPilotIds, setLoadingPilotIds] = useState<Record<string, boolean>>({})

  // Shuffle Bag
  const [shuffleBag, setShuffleBag] = useState<ShowcaseArtwork[]>([])
  const [shuffleIndex, setShuffleIndex] = useState<number>(0)

  // Refs for race conditions and timers
  const transformRef = useRef<ReactZoomPanPinchRef>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const transitionTokenRef = useRef<number>(0)
  const wasPlayingBeforeBackgroundRef = useRef<boolean>(false)

  // Sync initial artwork when modal opens or primary props change externally
  useEffect(() => {
    if (isOpen) {
      setCurrentArtwork(initialShowcaseItem)
    }
  }, [isOpen, initialShowcaseItem])

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return
    const origOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = origOverflow
    }
  }, [isOpen])

  // Helper: Pause slideshow on any user interaction
  const pauseSlideshow = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false)
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [isPlaying])

  // Pre-populate current pilot's artworks from props
  useEffect(() => {
    if (currentPilotId && artworks.length > 0) {
      const converted: ShowcaseArtwork[] = artworks.map((a) => {
        const cleanPath = a.path.startsWith('/') ? a.path.slice(1) : a.path
        const assetId = a.id || cleanPath.split('/').pop() || 'art'
        
        // Auto-detect pilotId from artwork object or path
        const pathMatch = cleanPath.match(/^images\/pilots\/([a-z0-9-_]+)\//i)
        const itemPilotId = (a.pilotId || (pathMatch ? pathMatch[1] : currentPilotId)).toLowerCase().trim()
        const meta = CANONICAL_PILOT_METADATA[itemPilotId as CanonicalPilotId]
        const cleanPilotName = a.pilotName || (meta?.name ? meta.name.split(' ')[0] : (itemPilotId === currentPilotId ? currentPilotName : itemPilotId.toUpperCase()))
        const cleanPilotCallsign = a.pilotCallsign || meta?.callsign || ''

        return {
          identityKey: buildArtworkIdentityKey(itemPilotId, assetId, cleanPath),
          assetId,
          filename: cleanPath.split('/').pop() || 'art.webp',
          path: cleanPath,
          resolvedUrl: resolveImageUrl(cleanPath) || '',
          title: a.title,
          description: a.description || `Tác phẩm của ${cleanPilotName}.`,
          curatedDescription: a.description,
          category: a.category || 'lore',
          dimensions: a.dimensions,
          isAvailableOnDisk: a.isAvailableOnDisk !== false,
          status: a.status || 'verified_webp',
          pilotId: itemPilotId,
          pilotName: cleanPilotName,
          pilotCallsign: cleanPilotCallsign,
          pilotGender: meta?.gender || 'Female',
          pilotPortraitPath: `images/pilots/${itemPilotId}/${itemPilotId}-portrait.webp`,
        }
      })

      setPilotsArtworksMap((prev) => ({
        ...prev,
        [currentPilotId]: converted,
      }))
    }
  }, [currentPilotId, currentPilotName, currentPilotCallsign, artworks])

  // Load a pilot's artworks into memory cache
  const loadPilotArtworks = useCallback(async (pilotId: string) => {
    if (pilotsArtworksMap[pilotId]?.length > 0) return pilotsArtworksMap[pilotId]

    setLoadingPilotIds((prev) => ({ ...prev, [pilotId]: true }))
    try {
      const items = await fetchShowcasePilotGallery(pilotId)
      setPilotsArtworksMap((prev) => ({
        ...prev,
        [pilotId]: items,
      }))
      return items
    } catch (err) {
      console.warn(`[ArtViewer] Failed to load artworks for ${pilotId}:`, err)
      return []
    } finally {
      setLoadingPilotIds((prev) => ({ ...prev, [pilotId]: false }))
    }
  }, [pilotsArtworksMap])

  // Preload initial selected pilots
  useEffect(() => {
    if (isOpen) {
      for (const pId of selectedPilotIds) {
        if (!pilotsArtworksMap[pId]) {
          loadPilotArtworks(pId)
        }
      }
    }
  }, [isOpen, selectedPilotIds, loadPilotArtworks, pilotsArtworksMap])

  // Combined pool for Random Mode
  const randomPool = useMemo<ShowcaseArtwork[]>(() => {
    const pool: ShowcaseArtwork[] = []
    for (const pId of selectedPilotIds) {
      const list = pilotsArtworksMap[pId]
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item && item.isAvailableOnDisk) {
            pool.push(item)
          }
        }
      }
    }
    return pool
  }, [selectedPilotIds, pilotsArtworksMap])

  // Initialize or re-create Shuffle Bag whenever randomPool changes or Random Mode is toggled
  useEffect(() => {
    if (isRandomMode) {
      if (randomPool.length > 0) {
        const bag = createShuffleBag(randomPool, currentArtwork.identityKey)
        setShuffleBag(bag)
        setShuffleIndex(0)
      } else {
        setShuffleBag([])
        setShuffleIndex(0)
      }
    }
  }, [isRandomMode, randomPool.length])

  // =========================================================================
  // ATOMIC TRANSITION ENGINE
  // Never show new metadata with old image. Never show black screen.
  // =========================================================================
  const transitionToArtwork = useCallback(
    async (targetArtwork: ShowcaseArtwork) => {
      if (!targetArtwork || targetArtwork.identityKey === currentArtwork.identityKey) {
        return
      }

      // Generate a new sequence token to cancel previous in-flight transitions
      const token = ++transitionTokenRef.current
      setIsTransitioning(true)

      const targetUrl = targetArtwork.resolvedUrl || resolveImageUrl(targetArtwork.path)

      // Preload & decode image in background
      const success = await preloadAndDecodeImage(targetUrl, 6000)

      // If another transition was initiated in the meantime, abort this one
      if (token !== transitionTokenRef.current) {
        return
      }

      if (success || !targetArtwork.isAvailableOnDisk) {
        // ATOMIC COMMIT: Synchronously switch both image and metadata together
        setCurrentArtwork(targetArtwork)
        setIsTransitioning(false)
        if (transformRef.current) {
          transformRef.current.resetTransform()
          setCurrentScale(1)
        }
        if (onSelectArtwork) {
          onSelectArtwork(targetArtwork, targetArtwork.pilotId)
        }
      } else {
        // If target image failed to load / timeout:
        setIsTransitioning(false)
        if (isRandomMode && shuffleBag.length > 1) {
          // Skip broken image and try next in shuffle bag
          const nextIdx = (shuffleIndex + 1) % shuffleBag.length
          setShuffleIndex(nextIdx)
          transitionToArtwork(shuffleBag[nextIdx])
        }
      }
    },
    [currentArtwork.identityKey, isRandomMode, shuffleBag, shuffleIndex, onSelectArtwork]
  )

  // Advance Next (Sequential or Random)
  const handleAdvanceNext = useCallback(() => {
    if (isRandomMode && shuffleBag.length > 0) {
      let nextIdx = shuffleIndex + 1
      let currentBag = shuffleBag

      if (nextIdx >= currentBag.length) {
        // Bag exhausted: refill and reshuffle bag
        currentBag = createShuffleBag(randomPool, currentBag[currentBag.length - 1]?.identityKey)
        setShuffleBag(currentBag)
        nextIdx = 0
      }

      setShuffleIndex(nextIdx)
      const nextTarget = currentBag[nextIdx]
      if (nextTarget) {
        transitionToArtwork(nextTarget)
      }
    } else {
      // Sequential Mode
      const currentList = pilotsArtworksMap[currentPilotId] || []
      if (currentList.length > 0) {
        const curIdx = currentList.findIndex((a) => a.identityKey === currentArtwork.identityKey)
        const nextIdx = (curIdx + 1) % currentList.length
        transitionToArtwork(currentList[nextIdx])
      } else if (hasNext && onNext) {
        onNext()
      }
    }
  }, [isRandomMode, shuffleBag, shuffleIndex, randomPool, pilotsArtworksMap, currentPilotId, currentArtwork.identityKey, hasNext, onNext, transitionToArtwork])

  // Advance Prev (Sequential or Random)
  const handleAdvancePrev = useCallback(() => {
    if (isRandomMode && shuffleBag.length > 0) {
      const prevIdx = (shuffleIndex - 1 + shuffleBag.length) % shuffleBag.length
      setShuffleIndex(prevIdx)
      const prevTarget = shuffleBag[prevIdx]
      if (prevTarget) {
        transitionToArtwork(prevTarget)
      }
    } else {
      // Sequential Mode
      const currentList = pilotsArtworksMap[currentPilotId] || []
      if (currentList.length > 0) {
        const curIdx = currentList.findIndex((a) => a.identityKey === currentArtwork.identityKey)
        const prevIdx = (curIdx - 1 + currentList.length) % currentList.length
        transitionToArtwork(currentList[prevIdx])
      } else if (hasPrev && onPrev) {
        onPrev()
      }
    }
  }, [isRandomMode, shuffleBag, shuffleIndex, pilotsArtworksMap, currentPilotId, currentArtwork.identityKey, hasPrev, onPrev, transitionToArtwork])

  // Preload Queue (Preload 2-3 upcoming images ahead of time)
  useEffect(() => {
    const urlsToPreload: string[] = []

    if (isRandomMode && shuffleBag.length > 1) {
      for (let i = 1; i <= 3; i++) {
        const idx = (shuffleIndex + i) % shuffleBag.length
        const item = shuffleBag[idx]
        if (item?.resolvedUrl) {
          urlsToPreload.push(item.resolvedUrl)
        }
      }
    } else {
      const currentList = pilotsArtworksMap[currentPilotId] || []
      if (currentList.length > 1) {
        const curIdx = currentList.findIndex((a) => a.identityKey === currentArtwork.identityKey)
        if (curIdx >= 0) {
          for (let i = 1; i <= 2; i++) {
            const idx = (curIdx + i) % currentList.length
            const item = currentList[idx]
            if (item?.resolvedUrl) {
              urlsToPreload.push(item.resolvedUrl)
            }
          }
        }
      }
    }

    if (urlsToPreload.length > 0) {
      preloadShowcaseQueue(urlsToPreload, 2)
    }
  }, [isRandomMode, shuffleBag, shuffleIndex, pilotsArtworksMap, currentPilotId, currentArtwork.identityKey])

  // Slideshow Timer Effect
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

  // Browser Visibility Change: Stop timer when tab is hidden, resume without skipping
  useEffect(() => {
    const handleVisibility = () => {
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

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [isPlaying, isOpen])

  // Clean timer on unmount / close
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
        setCurrentScale(1)
      }
    },
    [isOpen, showInfoDrawer, showPilotDrawer, isCleanView, pauseSlideshow, handleAdvancePrev, handleAdvanceNext, onClose]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!isOpen) return null

  // Speed selection
  const handleSelectSpeed = (s: SlideshowSpeed) => {
    setSpeedSeconds(s)
    setShowSpeedSelector(false)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('starfront_slideshow_speed', String(s))
    }
  }

  // Toggle pilot selection in Random Showcase
  const handleTogglePilot = async (pilotId: string) => {
    pauseSlideshow()
    let next: string[]
    if (selectedPilotIds.includes(pilotId)) {
      if (selectedPilotIds.length === 1) return // Keep at least one
      next = selectedPilotIds.filter((id) => id !== pilotId)
    } else {
      next = [...selectedPilotIds, pilotId]
      await loadPilotArtworks(pilotId)
    }
    setSelectedPilotIds(next)
  }

  // Select all 12 pilots
  const handleSelectAllPilots = async () => {
    pauseSlideshow()
    const allIds = canonicalPilots.map((p) => p.id)
    setSelectedPilotIds(allIds)
    for (const p of canonicalPilots) {
      if (!pilotsArtworksMap[p.id]) {
        loadPilotArtworks(p.id)
      }
    }
  }

  // Select only current pilot
  const handleSelectOnlyCurrent = () => {
    pauseSlideshow()
    setSelectedPilotIds([currentPilotId])
  }

  // Actual 100% Size Calculation
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

  const effectiveTotal = isRandomMode
    ? randomPool.length
    : (pilotsArtworksMap[currentPilotId]?.length || totalCount || artworks.length || 1)

  const effectiveIndex = isRandomMode
    ? shuffleIndex + 1
    : (pilotsArtworksMap[currentPilotId]?.findIndex((a) => a.identityKey === currentArtwork.identityKey) ?? -1) >= 0
    ? (pilotsArtworksMap[currentPilotId].findIndex((a) => a.identityKey === currentArtwork.identityKey) + 1)
    : (currentIndex || 1)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={currentArtwork.title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl select-none animate-in fade-in duration-200"
    >
      {/* =================================================================== */}
      {/* 1. TOP HEADER HUD (Clean, Authoritative Metadata)                   */}
      {/* =================================================================== */}
      {!isCleanView && (
        <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 z-40 flex items-center justify-between gap-2 pointer-events-none transition-all duration-300">
          {/* Metadata Pill */}
          <div className="flex items-center gap-2 pointer-events-auto bg-[#090D18]/92 border border-[#1E2D42] backdrop-blur-md px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs font-mono text-[#F1F5F9] shadow-2xl max-w-[calc(100vw-76px)] sm:max-w-2xl">
            {isRandomMode ? (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/50 shrink-0">
                <Shuffle className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>RANDOM</span>
              </span>
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[#00D4FF] shrink-0" />
            )}

            {/* Counter */}
            <span className="whitespace-nowrap text-[11px] font-mono font-black text-[#00D4FF] bg-[#00D4FF]/15 px-2.5 py-0.5 rounded-full border border-[#00D4FF]/40 tracking-wider shrink-0">
              ẢNH {String(effectiveIndex).padStart(2, '0')} / {String(effectiveTotal).padStart(2, '0')}
            </span>

            {/* Authoritative Pilot Badge */}
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60 shrink-0 uppercase">
              <span>{currentArtwork.pilotName}</span>
              {currentArtwork.pilotCallsign && (
                <span className="text-slate-400">· {currentArtwork.pilotCallsign}</span>
              )}
            </span>

            {/* Artwork Title */}
            <span className="font-bold truncate text-white min-w-0">{currentArtwork.title}</span>

            {/* In-Flight Transition Indicator */}
            {isTransitioning && (
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0 ml-1" />
            )}

            {/* Info Drawer Button */}
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

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng viewer (Esc)"
            className="pointer-events-auto w-11 h-11 rounded-full bg-[#090D18]/92 border border-[#1E2D42] hover:border-[#EF4444] text-[#CBD5E1] hover:text-[#EF4444] hover:bg-rose-950/40 flex items-center justify-center transition-all shadow-2xl cursor-pointer active:scale-95 shrink-0"
            title="Đóng viewer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Clean View Exit Pill */}
      {isCleanView && (
        <button
          type="button"
          onClick={() => setIsCleanView(false)}
          className="absolute top-4 right-4 z-40 px-3.5 py-1.5 rounded-full bg-black/80 hover:bg-black border border-[#1E2D42] text-xs font-mono text-cyan-300 flex items-center gap-1.5 backdrop-blur-md shadow-2xl cursor-pointer transition-all animate-in fade-in"
          title="Bật lại thanh điều khiển (H)"
        >
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>Hiện Controls (H)</span>
        </button>
      )}

      {/* =================================================================== */}
      {/* 2. PREVIOUS / NEXT SIDE ARROWS                                      */}
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
      {/* 3. ZOOM CANVAS & IMAGE ELEMENT                                      */}
      {/* =================================================================== */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {/* Missing / Archive Fallback */}
        {!currentArtwork.isAvailableOnDisk ? (
          <div className="z-20 max-w-sm text-center p-6 rounded-2xl bg-[#090D18]/95 border border-[#1E2D42] shadow-2xl space-y-3 mx-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#142338] border border-[#1E2D42] flex items-center justify-center text-[#F59E0B]">
              <FileArchive className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-white font-mono">{currentArtwork.title}</h4>
            <p className="text-xs font-mono text-[#00D4FF]">{currentArtwork.pilotName}</p>
            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              Tác phẩm này đang ở danh mục chờ phát hành WebP trên CDN. Toàn bộ thông số metadata vẫn được bảo toàn.
            </p>
          </div>
        ) : (
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
              onPanningStart: () => pauseSlideshow(),
              onPinchingStart: () => pauseSlideshow(),
            } as any)}
          >
            {() => (
              <TransformComponent
                wrapperClass="!w-full !h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                contentClass="flex items-center justify-center min-w-full min-h-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={currentArtwork.identityKey}
                  src={currentArtwork.resolvedUrl}
                  alt={currentArtwork.title}
                  draggable={false}
                  className="max-w-[94vw] max-h-[86vh] object-contain select-none transition-opacity duration-200 drop-shadow-[0_25px_50px_rgba(0,0,0,0.95)]"
                  onLoad={(e) => {
                    const target = e.currentTarget
                    setNaturalDimensions({
                      width: target.naturalWidth,
                      height: target.naturalHeight,
                    })
                  }}
                />
              </TransformComponent>
            )}
          </TransformWrapper>
        )}
      </div>

      {/* =================================================================== */}
      {/* 4. BOTTOM FLOATING CONTROL DOCK (Safe Area, Responsive)             */}
      {/* =================================================================== */}
      {!isCleanView && (
        <div className="absolute bottom-4 sm:bottom-6 z-40 flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#090D18]/92 border border-[#1E2D42] backdrop-blur-2xl shadow-2xl text-[#CBD5E1] max-w-[96vw] overflow-x-auto scrollbar-none pb-[env(safe-area-inset-bottom,0px)]">
          {/* PLAY / PAUSE */}
          <button
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            title={isPlaying ? 'Tạm dừng slideshow (Space)' : 'Bật tự động trình chiếu (Space)'}
            aria-label="Play or Pause Slideshow"
            className={`p-2 rounded-full font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 ${
              isPlaying
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(0,212,255,0.6)]'
                : 'hover:bg-[#142338] hover:text-[#00D4FF]'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          {/* SLIDESHOW SPEED MENU */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowSpeedSelector((prev) => !prev)}
              title="Chọn tốc độ chuyển ảnh"
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

          {/* RANDOM SHOWCASE BUTTON */}
          <button
            type="button"
            onClick={() => {
              pauseSlideshow()
              setIsRandomMode((prev) => !prev)
            }}
            title={isRandomMode ? 'Tắt Random (R)' : 'Bật Random Showcase 12 Pilot (R)'}
            aria-label="Toggle Random Showcase"
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              isRandomMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'hover:bg-[#142338] hover:text-[#00D4FF]'
            }`}
          >
            <Shuffle className={`w-3.5 h-3.5 ${isRandomMode ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Random</span>
          </button>

          {/* PILOT SELECTOR PANEL TOGGLE */}
          <button
            type="button"
            onClick={() => {
              pauseSlideshow()
              setShowPilotDrawer((prev) => !prev)
            }}
            title="Chọn danh sách phi công trình chiếu"
            aria-label="Chọn phi công trình chiếu"
            className={`p-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0 ${
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
            className="p-1.5 rounded-full hover:bg-[#142338] hover:text-[#00D4FF] transition-colors cursor-pointer shrink-0"
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
            className="p-1.5 rounded-full hover:bg-[#142338] hover:text-[#00D4FF] transition-colors cursor-pointer shrink-0"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* FIT TO SCREEN */}
          <button
            type="button"
            onClick={() => {
              pauseSlideshow()
              transformRef.current?.resetTransform()
              setCurrentScale(1)
            }}
            title="Vừa khung hình (Fit)"
            aria-label="Vừa khung hình"
            className="px-2 py-1 text-xs font-mono font-bold rounded-lg hover:bg-[#142338] hover:text-[#00D4FF] transition-colors cursor-pointer shrink-0"
          >
            Fit
          </button>

          {/* 100% SIZE */}
          <button
            type="button"
            onClick={handleSetActualSize}
            title="Kích thước thực 100%"
            aria-label="Kích thước thực"
            className="px-2 py-1 text-xs font-mono font-bold rounded-lg hover:bg-[#142338] hover:text-[#00D4FF] transition-colors cursor-pointer hidden sm:block shrink-0"
          >
            100%
          </button>

          {/* SCALE BADGE */}
          <span className="text-[11px] font-mono font-bold text-[#00D4FF] px-1.5 min-w-[38px] text-center hidden sm:inline-block shrink-0">
            {Math.round(currentScale * 100)}%
          </span>

          {/* RESET */}
          <button
            type="button"
            onClick={() => {
              pauseSlideshow()
              transformRef.current?.resetTransform()
              setCurrentScale(1)
            }}
            title="Đặt lại góc nhìn (0)"
            aria-label="Đặt lại góc nhìn"
            className="p-1.5 rounded-full hover:bg-[#142338] hover:text-[#00D4FF] transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-[#1E2D42] mx-0.5 shrink-0" />

          {/* CLEAN VIEW / HIDE HUD */}
          <button
            type="button"
            onClick={() => setIsCleanView(true)}
            title="Ẩn toàn bộ controls (H)"
            aria-label="Ẩn toàn bộ controls"
            className="p-1.5 rounded-full hover:bg-[#142338] hover:text-[#00D4FF] transition-colors cursor-pointer shrink-0"
          >
            <EyeOff className="w-4 h-4" />
          </button>

          {/* INFO DRAWER TOGGLE */}
          <button
            type="button"
            onClick={() => {
              pauseSlideshow()
              setShowInfoDrawer((prev) => !prev)
            }}
            title={showInfoDrawer ? 'Ẩn thông tin (I)' : 'Xem thông tin tác phẩm (I)'}
            aria-label="Bật tắt thông tin chi tiết tác phẩm"
            className={`p-1.5 rounded-full transition-colors cursor-pointer shrink-0 ${
              showInfoDrawer ? 'bg-[#00D4FF] text-[#070A12]' : 'hover:bg-[#142338] hover:text-[#00D4FF]'
            }`}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. VISUAL PILOT SELECTOR DRAWER (With Portrait & Gender Icons)     */}
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
            className="fixed z-50 rounded-2xl bg-[#090D18]/98 border border-[#1E2D42] backdrop-blur-2xl shadow-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 inset-x-3 bottom-3 max-h-[78vh] sm:inset-x-auto sm:left-4 sm:top-16 sm:bottom-20 sm:w-96 sm:max-h-none overflow-hidden"
          >
            <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-thin">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#1E2D42] pb-2.5">
                <div className="flex items-center gap-2">
                  <Shuffle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    CHỌN PHI CÔNG TRÌNH CHIẾU
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

              {/* Quick Actions */}
              <div className="flex items-center justify-between text-[11px] font-mono pt-0.5">
                <button
                  type="button"
                  onClick={handleSelectAllPilots}
                  className="px-2.5 py-1 rounded bg-[#142338] hover:bg-cyan-950 text-cyan-300 border border-cyan-800/80 cursor-pointer font-bold"
                >
                  Chọn Tất Cả (12)
                </button>
                <button
                  type="button"
                  onClick={handleSelectOnlyCurrent}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  Chỉ Pilot Hiện Tại
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Tất cả tranh từ các phi công được chọn sẽ được đưa vào Shuffle Bag ngẫu nhiên, đảm bảo không bao giờ trùng hai ảnh liên tiếp.
              </p>

              {/* 12 Pilot List with Portrait & Metadata */}
              <div className="space-y-1.5 pt-1">
                {canonicalPilots.map((p) => {
                  const isChecked = selectedPilotIds.includes(p.id)
                  const pArts = pilotsArtworksMap[p.id]
                  const count = pArts ? pArts.length : null
                  const isLoadingThis = loadingPilotIds[p.id]
                  const portraitUrl = resolveImageUrl(p.portraitPath)

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
                        {/* Checkbox Icon */}
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0" />
                        )}

                        {/* Pilot Portrait Thumbnail */}
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={portraitUrl}
                            alt={p.name}
                            className="w-full h-full object-cover object-top"
                            onError={(e) => {
                              // Fallback on missing image
                              ;(e.currentTarget as HTMLElement).style.display = 'none'
                            }}
                          />
                        </div>

                        {/* Identity & Gender */}
                        <div className="truncate min-w-0">
                          <div className="text-xs font-mono font-bold flex items-center gap-1.5">
                            <span className="truncate">{p.name}</span>
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                                p.gender === 'Female'
                                  ? 'bg-pink-950/80 text-pink-300 border border-pink-800/60'
                                  : 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                              }`}
                            >
                              {p.gender === 'Female' ? '♀ Nữ' : '♂ Nam'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{p.callsign}</div>
                        </div>
                      </div>

                      {/* Count Badge / Spinner */}
                      <div className="shrink-0 text-[10px] font-mono ml-2">
                        {isLoadingThis ? (
                          <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                        ) : count !== null ? (
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              count > 0 ? 'bg-cyan-950 text-cyan-300' : 'bg-slate-900 text-slate-500'
                            }`}
                          >
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

            {/* Footer */}
            <div className="pt-3 border-t border-[#1E2D42] text-[11px] font-mono text-cyan-400 text-center shrink-0">
              Tổng số tranh sẵn sàng: {randomPool.length} tác phẩm
            </div>
          </div>
        </>
      )}

      {/* =================================================================== */}
      {/* 6. AUTHORITATIVE METADATA INFO DRAWER (Desktop Side / Mobile Sheet)  */}
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
            className="fixed z-50 rounded-2xl bg-[#090D18]/98 border border-[#1E2D42] backdrop-blur-2xl shadow-2xl p-5 flex flex-col justify-between transition-all duration-200 inset-x-0 bottom-0 max-h-[75vh] rounded-b-none border-b-0 animate-in slide-in-from-bottom sm:inset-x-auto sm:right-4 sm:top-16 sm:bottom-20 sm:w-88 sm:max-h-none sm:rounded-2xl sm:border-b sm:animate-in sm:slide-in-from-right overflow-hidden"
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

              {/* Pilot Card */}
              <div className="p-3.5 rounded-xl bg-[#0E1626] border border-[#20324B] flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={currentArtwork.pilotId}
                    src={resolveImageUrl(currentArtwork.pilotPortraitPath || `images/pilots/${currentArtwork.pilotId}/${currentArtwork.pilotId}-portrait.webp`)}
                    alt={currentArtwork.pilotName}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLElement).style.display = 'none'
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                    PHI CÔNG LIÊN KẾT
                  </div>
                  <div className="text-sm font-bold text-white font-mono truncate">
                    {currentArtwork.pilotName}
                  </div>
                  {currentArtwork.pilotCallsign && (
                    <div className="text-xs font-mono text-slate-400 truncate">
                      Biệt hiệu: {currentArtwork.pilotCallsign}
                    </div>
                  )}
                </div>
              </div>

              {/* Artwork Title */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white font-mono leading-snug">
                  {currentArtwork.title}
                </h3>
              </div>

              {/* Category */}
              {currentArtwork.category && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#142338] text-[#00D4FF] border border-[#00D4FF]/30 uppercase">
                  <Layers className="w-3.5 h-3.5 text-[#00D4FF]" />
                  <span>Phân Loại: {currentArtwork.category}</span>
                </div>
              )}

              {/* Curated Description from Canonical JSON */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#94A3B8]">
                  Mô Tả Bối Cảnh Thực Tế:
                </span>
                <p className="text-sm text-[#F1F5F9] leading-relaxed">
                  {currentArtwork.curatedDescription ||
                    currentArtwork.description ||
                    'Tác phẩm nghệ thuật chuẩn hóa chính thức của Starfront World.'}
                </p>
              </div>

              {/* Technical Specifications */}
              <div className="p-3.5 rounded-xl bg-[#0B111E] border border-[#1E2D42] space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-[#A7B6C8]">
                  <span>Độ phân giải:</span>
                  <span className="text-white font-bold">
                    {naturalDimensions
                      ? `${naturalDimensions.width} × ${naturalDimensions.height} px`
                      : currentArtwork.dimensions
                      ? `${currentArtwork.dimensions.width} × ${currentArtwork.dimensions.height} px`
                      : 'Đang đọc...'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#A7B6C8]">
                  <span>Trạng thái WebP:</span>
                  <span className="text-[#34D399] font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#34D399]" />
                    <span>{currentArtwork.isAvailableOnDisk ? 'Đã xác thực' : 'Chờ đồng bộ'}</span>
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
