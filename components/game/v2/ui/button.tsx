'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#06B6D4] text-[#070A12] font-semibold hover:bg-[#22D3EE] active:bg-[#0891B2] border border-cyan-400 shadow-sm',
  secondary:
    'bg-[#142338] text-[#F1F5F9] font-medium hover:bg-[#1E3553] active:bg-[#0F1C2E] border border-[#26384D] shadow-sm',
  outline:
    'bg-transparent text-[#F1F5F9] font-medium hover:bg-[#0F172A] hover:border-[#06B6D4] active:bg-[#142338] border border-[#26384D]',
  ghost:
    'bg-transparent text-[#A7B6C8] font-medium hover:text-[#F1F5F9] hover:bg-[#142338] active:bg-[#0F172A] border border-transparent',
  destructive:
    'bg-[#F87171] text-[#070A12] font-semibold hover:bg-[#EF4444] active:bg-[#DC2626] border border-rose-400 shadow-sm',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] px-3.5 py-2 text-sm gap-2',
  md: 'min-h-[44px] px-4 py-2.5 text-base gap-2.5',
  lg: 'min-h-[48px] px-6 py-3 text-lg gap-3',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading
    const titleText = typeof children === 'string' ? children : undefined

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center rounded-lg transition-all duration-150',
          'max-w-full select-none cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070A12]',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? 'w-full' : 'shrink-0',
          isDisabled && 'opacity-45 cursor-not-allowed pointer-events-none shadow-none',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" aria-hidden="true" />
            <span className="truncate min-w-0" title={titleText}>
              {children}
            </span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0 flex items-center" aria-hidden="true">{leftIcon}</span>}
            <span className="truncate min-w-0" title={titleText}>
              {children}
            </span>
            {rightIcon && <span className="shrink-0 flex items-center" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)
Button.displayName = 'Button'

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  icon: React.ReactNode
}

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: 'min-w-[44px] min-h-[44px] w-11 h-11 p-2 text-sm',
  md: 'min-w-[44px] min-h-[44px] w-11 h-11 p-2.5 text-base',
  lg: 'min-w-[48px] min-h-[48px] w-12 h-12 p-3 text-lg',
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      disabled,
      icon,
      'aria-label': ariaLabel,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        type={type}
        aria-label={ariaLabel}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center rounded-lg transition-all duration-150',
          'shrink-0 select-none cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070A12]',
          variantStyles[variant],
          iconSizeStyles[size],
          isDisabled && 'opacity-45 cursor-not-allowed pointer-events-none shadow-none',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin shrink-0 text-current" aria-hidden="true" />
        ) : (
          icon
        )}
      </button>
    )
  }
)
IconButton.displayName = 'IconButton'
