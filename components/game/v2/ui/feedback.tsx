'use client'

import React from 'react'
import { Loader2, AlertCircle, CheckCircle2, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export interface FeedbackStateBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'outline'
  }
}

export function LoadingState({
  title = 'Đang tải dữ liệu...',
  description,
  className,
  ...props
}: Partial<FeedbackStateBaseProps>) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl bg-[#0F172A] border border-[#26384D] min-h-[200px]',
        className
      )}
      {...props}
    >
      <Loader2 className="w-8 h-8 text-[#06B6D4] animate-spin mb-3 shrink-0" aria-hidden="true" />
      <h4 className="text-base font-semibold text-[#F1F5F9]">{title}</h4>
      {description && <p className="mt-1 text-sm text-[#A7B6C8] max-w-sm">{description}</p>}
    </div>
  )
}

export interface EmptyStateProps extends FeedbackStateBaseProps {
  icon?: React.ReactNode
}

export function EmptyState({
  title = 'Không có dữ liệu',
  description = 'Hiện chưa có mục nào để hiển thị trong khu vực này.',
  icon,
  action,
  className,
  ...props
}: Partial<EmptyStateProps>) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl bg-[#0F172A] border border-[#26384D] min-h-[220px]',
        className
      )}
      {...props}
    >
      <div className="w-12 h-12 rounded-xl bg-[#142338] border border-[#26384D] flex items-center justify-center text-[#A7B6C8] mb-4 shrink-0">
        {icon || <Inbox className="w-6 h-6" aria-hidden="true" />}
      </div>
      <h4 className="text-base font-semibold text-[#F1F5F9]">{title}</h4>
      {description && <p className="mt-1 text-sm text-[#A7B6C8] max-w-sm">{description}</p>}
      {action && (
        <div className="mt-5">
          <Button
            size="sm"
            variant={action.variant || 'secondary'}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}

export interface ErrorStateProps extends FeedbackStateBaseProps {
  errorDetails?: string
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorState({
  title = 'Đã xảy ra lỗi',
  description = 'Không thể nạp thông tin. Vui lòng thử lại.',
  errorDetails,
  onRetry,
  retryLabel = 'Thử lại',
  action,
  className,
  ...props
}: Partial<ErrorStateProps>) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl bg-[#0F172A] border border-[#F87171]/40 min-h-[220px]',
        className
      )}
      {...props}
    >
      <div className="w-12 h-12 rounded-xl bg-[#142338] border border-[#F87171]/50 flex items-center justify-center text-[#F87171] mb-4 shrink-0">
        <AlertCircle className="w-6 h-6" aria-hidden="true" />
      </div>
      <h4 className="text-base font-semibold text-[#F1F5F9]">{title}</h4>
      {description && <p className="mt-1 text-sm text-[#A7B6C8] max-w-sm">{description}</p>}
      {errorDetails && (
        <pre className="mt-3 p-2 rounded bg-[#070A12] border border-[#26384D] text-xs font-mono text-[#F87171] max-w-md overflow-x-auto text-left">
          {errorDetails}
        </pre>
      )}
      {(onRetry || action) && (
        <div className="mt-5">
          {onRetry ? (
            <Button size="sm" variant="secondary" onClick={onRetry}>
              {retryLabel}
            </Button>
          ) : action ? (
            <Button
              size="sm"
              variant={action.variant || 'secondary'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  )
}

export interface SuccessStateProps extends FeedbackStateBaseProps {
  icon?: React.ReactNode
}

export function SuccessState({
  title = 'Thao tác thành công',
  description = 'Dữ liệu đã được cập nhật chính xác.',
  icon,
  action,
  className,
  ...props
}: Partial<SuccessStateProps>) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl bg-[#0F172A] border border-[#34D399]/40 min-h-[220px]',
        className
      )}
      {...props}
    >
      <div className="w-12 h-12 rounded-xl bg-[#142338] border border-[#34D399]/50 flex items-center justify-center text-[#34D399] mb-4 shrink-0">
        {icon || <CheckCircle2 className="w-6 h-6" aria-hidden="true" />}
      </div>
      <h4 className="text-base font-semibold text-[#F1F5F9]">{title}</h4>
      {description && <p className="mt-1 text-sm text-[#A7B6C8] max-w-sm">{description}</p>}
      {action && (
        <div className="mt-5">
          <Button
            size="sm"
            variant={action.variant || 'primary'}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}
