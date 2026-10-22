'use client'

import React, { createContext, useContext, useEffect, useRef, useId } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from './button'

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
  titleId: string
  descId: string
}

const DialogContext = createContext<DialogContextValue | null>(null)

function useDialog() {
  const ctx = useContext(DialogContext)
  if (!ctx) {
    throw new Error('Dialog compound components must be rendered inside a <Dialog> parent.')
  }
  return ctx
}

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
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
    <DialogContext.Provider value={{ open, onOpenChange, titleId, descId }}>
      {children}
    </DialogContext.Provider>
  )
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void
  showCloseButton?: boolean
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, onClose, showCloseButton = true, ...props }, ref) => {
    const { open, onOpenChange, titleId, descId } = useDialog()
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

    const modalContent = (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070A12]/80 backdrop-blur-xs transition-opacity duration-200"
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
            'relative w-full max-w-lg rounded-2xl bg-[#0F172A] border border-[#26384D] shadow-2xl p-6',
            'text-[#F1F5F9] transition-transform duration-200 focus:outline-none',
            className
          )}
          {...props}
        >
          {showCloseButton && (
            <div className="absolute top-4 right-4 z-10">
              <IconButton
                aria-label="Đóng cửa sổ"
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
    return createPortal(modalContent, document.body)
  }
)
DialogContent.displayName = 'DialogContent'

export const DialogHeader = React.forwardRef<
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
DialogHeader.displayName = 'DialogHeader'

export const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const { titleId } = useDialog()
  return (
    <h2
      ref={ref}
      id={titleId}
      className={cn('text-xl font-semibold text-[#F1F5F9] tracking-tight', className)}
      {...props}
    />
  )
})
DialogTitle.displayName = 'DialogTitle'

export const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { descId } = useDialog()
  return (
    <p
      ref={ref}
      id={descId}
      className={cn('text-sm text-[#A7B6C8] leading-relaxed', className)}
      {...props}
    />
  )
})
DialogDescription.displayName = 'DialogDescription'

export const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#26384D]', className)}
      {...props}
    />
  )
})
DialogFooter.displayName = 'DialogFooter'
