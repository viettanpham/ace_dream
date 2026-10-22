'use client'

import React, { useState, useRef, useEffect, useId, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  delayDuration?: number
  className?: string
}

export function Tooltip({
  content,
  children,
  side = 'top',
  delayDuration = 150,
  className,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTouchRef = useRef(false)
  const id = useId()

  const handleMouseEnter = () => {
    if (isTouchRef.current) return
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true)
    }, delayDuration)
  }

  const handleMouseLeave = () => {
    if (isTouchRef.current) return
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsOpen(false)
  }

  const handleFocus = () => {
    if (isTouchRef.current) return
    setIsOpen(true)
  }

  const handleBlur = () => {
    if (isTouchRef.current) return
    setIsOpen(false)
  }

  const handleTouchStart = () => {
    isTouchRef.current = true
    setIsTouchDevice(true)
  }

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (isTouchRef.current) {
      // Toggle on touch
      e.stopPropagation()
      setIsOpen((prev) => !prev)
    }
  }

  // Close on Escape or click outside
  const handleClickOutside = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    },
    []
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.addEventListener('pointerdown', handleClickOutside)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handleClickOutside)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isOpen, handleClickOutside])

  // Responsive positions: On mobile (< sm), clamp or center to prevent horizontal overflow
  const positionStyles: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'bottom-full left-1/2 -translate-x-1/2 mb-2 sm:bottom-auto sm:left-auto sm:right-full sm:top-1/2 sm:-translate-y-1/2 sm:mr-2',
    right: 'bottom-full left-1/2 -translate-x-1/2 mb-2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:left-full sm:ml-2',
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center max-w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouchStart}
      onClick={handleTriggerClick}
      aria-describedby={isOpen ? id : undefined}
    >
      {children}
      {isOpen && content && (
        <div
          id={id}
          role="tooltip"
          className={cn(
            'absolute z-50 rounded-lg px-3 py-2',
            'bg-[#142338] border border-[#3B526D] text-xs font-medium text-[#F1F5F9] shadow-xl',
            'animate-in fade-in-0 zoom-in-95 duration-150',
            'w-max max-w-[280px] sm:max-w-xs whitespace-normal sm:whitespace-nowrap leading-relaxed',
            positionStyles[side],
            className
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span>{content}</span>
            {isTouchDevice && (
              <button
                type="button"
                aria-label="Đóng chú thích"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(false)
                }}
                className="size-5 rounded flex items-center justify-center text-[#A7B6C8] hover:text-white hover:bg-[#26384D] ml-1 shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
