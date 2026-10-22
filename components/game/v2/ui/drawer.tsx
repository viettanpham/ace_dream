'use client'

import React, { createContext, useContext, useEffect, useRef, useId } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from './button'

type DrawerSide = 'bottom' | 'right' | 'left'

interface DrawerContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
  side: DrawerSide
  titleId: string
  descId: string
}

const DrawerContext = createContext<DrawerContextValue | null>(null)

function useDrawer() {
  const ctx = useContext(DrawerContext)
  if (!ctx) {
    throw new Error('Drawer compound components must be rendered inside a <Drawer> parent.')
  }
  return ctx
}

export interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  side?: DrawerSide
  children: React.ReactNode
}

export function Drawer({ open, onOpenChange, side = 'bottom', children }: DrawerProps) {
  const baseId = useId()
  const titleId = `${baseId}-title`
  const descId = `${baseId}-desc`

  useEffect(() => {
    if (open) {
      const originalStyle = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalStyle
      }
    }
  }, [open])

  return (
    <DrawerContext.Provider value={{ open, onOpenChange, side, titleId, descId }}>
      {children}
    </DrawerContext.Provider>
  )
}

export interface DrawerContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void
  showCloseButton?: boolean
}

export const DrawerContent = React.forwardRef<HTMLDivElement, DrawerContentProps>(
  ({ className, children, onClose, showCloseButton = true, ...props }, ref) => {
    const { open, onOpenChange, side, titleId, descId } = useDrawer()
    const contentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && open) {
          onClose?.()
          onOpenChange(false)
        }
      }
      if (open) {
        window.addEventListener('keydown', handleKeyDown)
      }
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      }
    }, [open, onClose, onOpenChange])

    if (!open) return null

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose?.()
        onOpenChange(false)
      }
    }

    const sideStyles: Record<DrawerSide, string> = {
      bottom: 'inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t border-[#26384D] animate-in slide-in-from-bottom duration-200',
      right: 'inset-y-0 right-0 w-full max-w-md rounded-l-2xl border-l border-[#26384D] animate-in slide-in-from-right duration-200',
      left: 'inset-y-0 left-0 w-full max-w-md rounded-r-2xl border-r border-[#26384D] animate-in slide-in-from-left duration-200',
    }

    const drawerElement = (
      <div
        className="fixed inset-0 z-50 flex bg-[#070A12]/80 backdrop-blur-xs transition-opacity duration-200"
        onClick={handleBackdropClick}
        aria-hidden="true"
      >
        <div
          ref={ref || contentRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'fixed flex flex-col bg-[#0F172A] shadow-2xl p-6 text-[#F1F5F9] focus:outline-none overflow-y-auto',
            sideStyles[side],
            className
          )}
          {...props}
        >
          {side === 'bottom' && (
            <div className="flex justify-center -mt-2 mb-3">
              <div className="w-12 h-1.5 rounded-full bg-[#26384D]" aria-hidden="true" />
            </div>
          )}

          {showCloseButton && (
            <div className="absolute top-4 right-4 z-10">
              <IconButton
                aria-label="Đóng bảng trượt"
                variant="ghost"
                size="sm"
                icon={<X className="w-5 h-5" />}
                onClick={() => {
                  onClose?.()
                  onOpenChange(false)
                }}
              />
            </div>
          )}

          {children}
        </div>
      </div>
    )

    if (typeof document === 'undefined') return null
    return createPortal(drawerElement, document.body)
  }
)
DrawerContent.displayName = 'DrawerContent'

export const DrawerHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pr-8 mb-4', className)}
      {...props}
    />
  )
})
DrawerHeader.displayName = 'DrawerHeader'

export const DrawerTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const { titleId } = useDrawer()
  return (
    <h2
      ref={ref}
      id={titleId}
      className={cn('text-xl font-semibold text-[#F1F5F9] tracking-tight', className)}
      {...props}
    />
  )
})
DrawerTitle.displayName = 'DrawerTitle'

export const DrawerDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { descId } = useDrawer()
  return (
    <p
      ref={ref}
      id={descId}
      className={cn('text-sm text-[#A7B6C8] leading-relaxed', className)}
      {...props}
    />
  )
})
DrawerDescription.displayName = 'DrawerDescription'

export const DrawerBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex-1 overflow-y-auto py-2 text-[#F1F5F9]', className)}
      {...props}
    />
  )
})
DrawerBody.displayName = 'DrawerBody'

export const DrawerFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#26384D]',
        className
      )}
      {...props}
    />
  )
})
DrawerFooter.displayName = 'DrawerFooter'
