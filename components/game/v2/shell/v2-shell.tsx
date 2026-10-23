'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users,
  Compass,
  Cpu,
  Layers,
  Building2,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { loadV2UIPreferences, saveV2UIPreferences } from '@/lib/game/v2/ui-preferences'

export interface V2ShellProps {
  children: React.ReactNode
  activeSectionId?: string
}

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  status: 'ready' | 'placeholder'
  badge?: string
}

const GLOBAL_NAV_ITEMS: NavItem[] = [
  {
    id: 'pilots',
    label: 'Hồ Sơ Phi Công',
    icon: Users,
    href: '/v2/pilots',
    status: 'ready',
    badge: 'FND-8',
  },
  {
    id: 'operations',
    label: 'Trung Tâm Tác Chiến',
    icon: Compass,
    href: '#operations',
    status: 'placeholder',
    badge: 'Sắp Có',
  },
  {
    id: 'gear',
    label: 'Kho Cơ Giáp',
    icon: Cpu,
    href: '#gear',
    status: 'placeholder',
    badge: 'FND-8.3',
  },
  {
    id: 'fleet',
    label: 'Hạm Đội Không Gian',
    icon: Layers,
    href: '#fleet',
    status: 'placeholder',
  },
  {
    id: 'base',
    label: 'Căn Cứ Quỹ Đạo',
    icon: Building2,
    href: '#base',
    status: 'placeholder',
  },
  {
    id: 'shop',
    label: 'Thị Trường Vật Tư',
    icon: ShoppingBag,
    href: '#shop',
    status: 'placeholder',
  },
]

export function V2Shell({ children, activeSectionId = 'pilots' }: V2ShellProps) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false)

  return (
    <div className="sf-v2-shell min-h-screen bg-[#070A12] text-[#F1F5F9] flex flex-col antialiased selection:bg-[#06B6D4]/30 selection:text-white">
      {/* =======================================================================
          1. TOP BAR V2 (Minimal, single tier, clean sci-fi styling chuẩn Concept)
          ======================================================================= */}
      <header className="sticky top-0 z-40 h-14 bg-[#070A12]/95 backdrop-blur-md border-b border-[#26384D] px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Category Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#142338] border border-[#26384D] hover:border-[#06B6D4] text-[#F1F5F9] text-xs font-mono font-bold transition-all cursor-pointer"
            title="Quay lại Starfront V1"
          >
            <ChevronLeft className="w-4 h-4 text-[#06B6D4]" />
            <span className="hidden sm:inline">V1 SHELL</span>
          </Link>

          <div className="h-4 w-px bg-[#26384D]" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#142338] border border-[#06B6D4]/50 flex items-center justify-center text-[#06B6D4] font-black font-mono text-xs shadow-sm shadow-cyan-500/20">
              SF
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-widest font-mono text-[#F1F5F9]">
                STARFRONT
              </span>
              <span className="text-[10px] font-mono font-bold text-[#06B6D4] uppercase tracking-wider">
                WORLD FND-8
              </span>
            </div>
          </div>
        </div>

        {/* Center Breadcrumb (Desktop) */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
          <span className="text-[#A7B6C8]">HỆ THỐNG V2</span>
          <span className="text-[#26384D]">/</span>
          <span className="text-[#06B6D4] font-bold flex items-center gap-1.5 bg-[#06B6D4]/10 border border-[#06B6D4]/30 px-2.5 py-1 rounded">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CHARACTER CATEGORY // 12 PHI CÔNG</span>
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/ui-v2-preview"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-[#142338] hover:bg-[#1E3553] text-[#A7B6C8] hover:text-white border border-[#26384D] transition-colors"
          >
            <span>UI HARNESS</span>
          </Link>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/40">
            FND-8.2.3.E.0
          </span>
        </div>
      </header>

      {/* =======================================================================
          2. MAIN CONTENT AREA (Trọn vẹn không gian, không bị thanh bên đè lên)
          ======================================================================= */}
      <main className="flex-1 w-full flex flex-col min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
export default V2Shell
