'use client'

import React, { createContext, useContext, useState, useId, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

type TabsVariant = 'segmented' | 'underline'

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
  variant: TabsVariant
  baseId: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabs() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs compound components must be rendered inside a <Tabs> parent.')
  }
  return context
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  variant?: TabsVariant
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      defaultValue,
      value: controlledValue,
      onValueChange,
      variant = 'segmented',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? '')
    const baseId = useId()

    const isControlled = controlledValue !== undefined
    const currentValue = isControlled ? controlledValue : uncontrolledValue

    const handleValueChange = (newVal: string) => {
      if (!isControlled) {
        setUncontrolledValue(newVal)
      }
      onValueChange?.(newVal)
    }

    return (
      <TabsContext.Provider
        value={{
          value: currentValue,
          onValueChange: handleValueChange,
          variant,
          baseId,
        }}
      >
        <div ref={ref} className={cn('w-full max-w-full flex flex-col', className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = 'Tabs'

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, ...props }, ref) => {
    const { variant } = useTabs()

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      const tabs = Array.from(
        e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')
      )
      const currentIndex = tabs.findIndex((tab) => tab === document.activeElement)
      if (currentIndex === -1) return

      let nextIndex = currentIndex
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        nextIndex = (currentIndex + 1) % tabs.length
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
      } else if (e.key === 'Home') {
        e.preventDefault()
        nextIndex = 0
      } else if (e.key === 'End') {
        e.preventDefault()
        nextIndex = tabs.length - 1
      }

      if (nextIndex !== currentIndex) {
        const nextTab = tabs[nextIndex]
        nextTab.focus()
        nextTab.click()
        nextTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      }
    }

    return (
      <div
        ref={ref}
        role="tablist"
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
        className={cn(
          'flex items-center max-w-full overflow-x-auto overflow-y-hidden scrollbar-none flex-nowrap scroll-smooth',
          variant === 'segmented' &&
            'p-1 bg-[#0F172A] border border-[#26384D] rounded-xl gap-1 w-fit max-w-full',
          variant === 'underline' &&
            'border-b border-[#26384D] gap-6 w-full',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TabsList.displayName = 'TabsList'

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  icon?: React.ReactNode
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value: triggerValue, icon, children, disabled, ...props }, ref) => {
    const { value, onValueChange, variant, baseId } = useTabs()
    const isSelected = value === triggerValue
    const tabId = `${baseId}-tab-${triggerValue}`
    const panelId = `${baseId}-panel-${triggerValue}`
    const innerRef = useRef<HTMLButtonElement | null>(null)

    // Automatically bring active tab into view when selected
    useEffect(() => {
      if (isSelected && innerRef.current) {
        innerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      }
    }, [isSelected])

    return (
      <button
        ref={(el) => {
          innerRef.current = el
          if (typeof ref === 'function') ref(el)
          else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = el
        }}
        role="tab"
        type="button"
        id={tabId}
        aria-selected={isSelected}
        aria-controls={panelId}
        tabIndex={isSelected ? 0 : -1}
        disabled={disabled}
        onClick={() => onValueChange(triggerValue)}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150',
          'min-h-[44px] px-4 py-2 text-sm whitespace-nowrap shrink-0 cursor-pointer select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070A12]',
          disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
          variant === 'segmented' && [
            'rounded-lg',
            isSelected
              ? 'bg-[#142338] text-[#F1F5F9] shadow-sm border border-[#3B526D]/50 font-semibold'
              : 'text-[#A7B6C8] hover:text-[#F1F5F9] hover:bg-[#142338]/40 border border-transparent',
          ],
          variant === 'underline' && [
            'border-b-2 -mb-px px-1 rounded-none',
            isSelected
              ? 'border-[#06B6D4] text-[#06B6D4] font-semibold'
              : 'border-transparent text-[#A7B6C8] hover:text-[#F1F5F9] hover:border-[#26384D]',
          ],
          className
        )}
        {...props}
      >
        {icon && <span className="mr-2 flex items-center shrink-0" aria-hidden="true">{icon}</span>}
        <span>{children}</span>
      </button>
    )
  }
)
TabsTrigger.displayName = 'TabsTrigger'

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value: contentValue, children, ...props }, ref) => {
    const { value, baseId } = useTabs()
    const isSelected = value === contentValue
    const tabId = `${baseId}-tab-${contentValue}`
    const panelId = `${baseId}-panel-${contentValue}`

    if (!isSelected) {
      return null
    }

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={panelId}
        aria-labelledby={tabId}
        tabIndex={0}
        className={cn('pt-4 max-w-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#06B6D4]', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TabsContent.displayName = 'TabsContent'
