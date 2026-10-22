'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export type CardVariant = 'panel' | 'raised' | 'interactive'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  as?: React.ElementType
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'panel', as: Component = 'div', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'rounded-xl border transition-colors duration-150',
          variant === 'panel' && 'bg-[#0F172A] border-[#26384D] text-[#F1F5F9]',
          variant === 'raised' && 'bg-[#142338] border-[#26384D] text-[#F1F5F9] shadow-md',
          variant === 'interactive' &&
            'bg-[#0F172A] border-[#26384D] text-[#F1F5F9] hover:border-[#06B6D4] hover:bg-[#142338] cursor-pointer active:bg-[#0B1320]',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
Card.displayName = 'Card'

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, bordered = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-1.5 p-5',
          bordered && 'border-b border-[#26384D]',
          className
        )}
        {...props}
      />
    )
  }
)
CardHeader.displayName = 'CardHeader'

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div'
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'text-lg font-semibold tracking-tight text-[#F1F5F9]',
          className
        )}
        {...props}
      />
    )
  }
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-[#A7B6C8] leading-relaxed', className)}
      {...props}
    />
  )
})
CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('p-5 pt-0', className)} {...props} />
})
CardContent.displayName = 'CardContent'

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, bordered = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center p-5 pt-0',
          bordered && 'pt-4 border-t border-[#26384D]',
          className
        )}
        {...props}
      />
    )
  }
)
CardFooter.displayName = 'CardFooter'
