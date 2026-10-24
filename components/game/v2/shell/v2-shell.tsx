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
  MapPin,
  ChevronLeft,
  Menu,
  X,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  Coins,
  Settings,
  Radio,
} from 'lucide-react'
import { loadV2UIPreferences, saveV2UIPreferences } from '@/lib/game/v2/ui-preferences'
import { CharacterContentManager } from '@/components/game/v2/admin/character-content-manager'

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
    badge: 'Sắp Có',
  },
  {
    id: 'base',
    label: 'Căn Cứ Quỹ Đạo',
    icon: Building2,
    href: '#base',
    status: 'placeholder',
    badge: 'Sắp Có',
  },
  {
    id: 'atlas',
    label: 'Bản Đồ Tinh Tú',
    icon: MapPin,
    href: '#atlas',
    status: 'placeholder',
    badge: 'Sắp Có',
  },
  {
    id: 'shop',
    label: 'Thị Trường Vật Tư',
    icon: ShoppingBag,
    href: '#shop',
    status: 'placeholder',
    badge: 'Sắp Có',
  },
]

/**
 * STARFRONT WORLD V2 — OFFICIAL APP SHELL
 * 
 * Strict architectural structure:
 * - GLOBAL TOP MENU V2: Single-tier, brand identity, stardate, system status, breadcrumbs, return to V1, mobile hamburger.
 * - GLOBAL LEFT MENU V2: Two independent modes (MINI 64px default, FULL 240px), independent toggle, state persistence.
 * - MAIN CONTENT VIEWPORT: Flex-1, automatically adapts to Left Menu width without page refresh.
 * - MOBILE EXPERIENCE: Responsive drawer sliding from left edge with backdrop blur & accessible dismiss.
 */
export function V2Shell({ children, activeSectionId = 'pilots' }: V2ShellProps) {
  // Global Left Menu mode: 'mini' (64px) vs 'full' (240px)
  const [menuMode, setMenuMode] = useState<'mini' | 'full'>('mini')
  // Mobile drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false)
  // AdminCP Character Content Manager modal state
  const [isAdminCpOpen, setIsAdminCpOpen] = useState<boolean>(false)
  // Hydration state
  const [isMounted, setIsMounted] = useState<boolean>(false)

  // Load saved preferences on client mount
  useEffect(() => {
    setIsMounted(true)
    const prefs = loadV2UIPreferences()
    setMenuMode(prefs.globalMenuMode || 'mini')
  }, [])

  // Toggle Global Left Menu mode & persist
  const toggleMenuMode = () => {
    const nextMode = menuMode === 'mini' ? 'full' : 'mini'
    setMenuMode(nextMode)
    saveV2UIPreferences({ globalMenuMode: nextMode })
  }

  // Handle escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobileDrawerOpen])

  return (
    <div className="sf-v2-shell min-h-screen md:h-screen md:max-h-screen bg-[#070A12] text-[#F1F5F9] flex flex-col md:overflow-hidden antialiased selection:bg-[#00D4FF]/30 selection:text-white">
      {/* =======================================================================
          TẦNG 1: GLOBAL TOP MENU V2 (Toàn ứng dụng)
          ======================================================================= */}
      <header className="sticky top-0 z-40 h-14 bg-[#070A12]/95 backdrop-blur-md border-b border-[#1E2D42] px-3 sm:px-5 flex items-center justify-between gap-3">
        {/* Left: Hamburger (Mobile) + Brand Logo + Category Title */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Mobile Hamburger Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label="Mở Menu Điều Hướng Toàn Cầu"
            className="md:hidden w-10 h-10 rounded-lg bg-[#0E1626] border border-[#1E2D42] text-[#A7B6C8] hover:text-[#00D4FF] flex items-center justify-center cursor-pointer active:scale-95"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Nút Quay Lại V1 (Hợp lệ theo chính sách V1/V2 coexistence) */}
          <Link
            href="/v1"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0E1626] border border-[#1E2D42] hover:border-[#00D4FF] text-[#A7B6C8] hover:text-[#00D4FF] text-xs font-mono font-bold transition-all cursor-pointer"
            title="Quay lại Starfront World V1 (/v1)"
          >
            <ChevronLeft className="w-4 h-4 text-[#00D4FF]" />
            <span className="hidden sm:inline">QUAY LẠI V1</span>
          </Link>

          <div className="h-4 w-px bg-[#1E2D42] hidden sm:block" />

          {/* Logo Brand STARFRONT WORLD V2 */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0E1626] border border-[#00D4FF]/60 flex items-center justify-center text-[#00D4FF] font-black font-mono text-xs shadow-sm shadow-cyan-500/20">
              SF
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-widest font-mono text-white">
                STARFRONT
              </span>
              <span className="text-[10px] font-mono font-bold text-[#00D4FF] uppercase tracking-wider bg-[#00D4FF]/10 px-1.5 py-0.5 rounded border border-[#00D4FF]/30">
                V2
              </span>
            </div>
          </div>
        </div>

        {/* Center: Breadcrumb Hiện Tại (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
          <span className="text-[#7D90A6]">HỆ THỐNG V2</span>
          <span className="text-[#1E2D42]">/</span>
          <span className="text-[#00D4FF] font-bold flex items-center gap-1.5 bg-[#00D4FF]/10 border border-[#00D4FF]/30 px-2.5 py-1 rounded">
            <Sparkles className="w-3.5 h-3.5 text-[#00D4FF]" />
            <span>CHARACTER CATEGORY // 12 PHI CÔNG</span>
          </span>
        </div>

        {/* Right: Chỉ số Vũ Trụ Thật (Stardate, Status, Credits) */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
          {/* Stardate Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-[#0E1626] border border-[#1E2D42] text-[#A7B6C8]">
            <Radio className="w-3.5 h-3.5 text-[#00D4FF] animate-pulse" />
            <span className="text-[11px] font-bold text-white">SD 2026.10</span>
          </div>

          {/* Credits Display */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0E1626] border border-[#1E2D42] text-[#F59E0B]">
            <Coins className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="font-bold text-white tracking-wide">45,820</span>
            <span className="text-[10px] text-[#F59E0B]">₢</span>
          </div>

          {/* AdminCP Content Manager Trigger */}
          <button
            type="button"
            onClick={() => setIsAdminCpOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0E1626] border border-[#1E2D42] hover:border-cyan-500 text-slate-300 hover:text-cyan-400 text-xs font-mono font-bold transition-all cursor-pointer"
            title="Mở Quản trị viên Nội dung Nhân vật & Biên niên ký"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">ADMINCP</span>
          </button>

          {/* Core System Status */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider">ONLINE</span>
          </div>
        </div>
      </header>

      {/* =======================================================================
          APPLICATION BODY: GLOBAL LEFT MENU + MAIN CONTENT VIEWPORT
          ======================================================================= */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* =====================================================================
            TẦNG 2: GLOBAL LEFT MENU V2 (Desktop Only: MINI 64px / FULL 240px)
            ===================================================================== */}
        <aside
          className={`hidden md:flex flex-col h-full bg-[#090D18]/95 border-r border-[#1E2D42] transition-all duration-300 ease-in-out shrink-0 select-none z-30 ${
            menuMode === 'full' ? 'w-60' : 'w-16'
          }`}
        >
          {/* Menu Header / Category Label */}
          <div className="p-3 border-b border-[#1E2D42] flex items-center justify-between min-h-[48px]">
            {menuMode === 'full' ? (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7D90A6]">
                ĐIỀU HƯỚNG V2
              </span>
            ) : (
              <div className="w-full flex justify-center">
                <span className="w-2 h-2 rounded-full bg-[#00D4FF]" />
              </div>
            )}
          </div>

          {/* Navigation Items List */}
          <nav className="flex-1 p-2 space-y-1.5 overflow-y-auto scrollbar-none">
            {GLOBAL_NAV_ITEMS.map((item) => {
              const isActive = item.id === activeSectionId
              const IconComponent = item.icon

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  title={item.label}
                  className={`group flex items-center rounded-xl transition-all duration-200 cursor-pointer ${
                    menuMode === 'full'
                      ? 'px-3 py-2.5 gap-3'
                      : 'p-2.5 justify-center'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-[#142338] to-[#0E1626] border border-[#00D4FF]/60 text-white shadow-sm shadow-cyan-500/20'
                      : 'border border-transparent text-[#A7B6C8] hover:bg-[#0E1626] hover:text-white'
                  }`}
                >
                  <div className="relative">
                    <IconComponent
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isActive
                          ? 'text-[#00D4FF]'
                          : 'text-[#7D90A6] group-hover:text-[#00D4FF]'
                      }`}
                    />
                    {isActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
                    )}
                  </div>

                  {menuMode === 'full' && (
                    <div className="min-w-0 flex-1 flex items-center justify-between">
                      <span
                        className={`text-xs font-mono font-semibold truncate ${
                          isActive ? 'text-white' : 'text-[#A7B6C8]'
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            item.status === 'ready'
                              ? 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30'
                              : 'bg-[#1E2D42] text-[#7D90A6]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Menu Footer: Nút Chuyển Đổi MINI / FULL Độc Lập — Luôn hiển thị nổi bật, không phụ thuộc hover */}
          <div className="p-2 border-t border-[#1E2D42] bg-[#0A0F1A] flex items-center shrink-0">
            <button
              type="button"
              onClick={toggleMenuMode}
              aria-label={menuMode === 'full' ? 'Thu gọn menu điều hướng (MINI 64px)' : 'Mở rộng menu điều hướng (FULL 240px)'}
              title={
                menuMode === 'full'
                  ? 'Thu gọn menu điều hướng (MINI 64px)'
                  : 'Mở rộng menu điều hướng (FULL 240px)'
              }
              className={`w-full py-2.5 rounded-xl border border-[#00D4FF]/40 bg-[#0E1B2E] text-[#00D4FF] hover:bg-[#142640] hover:border-[#00D4FF] shadow-sm shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-xs font-mono font-bold`}
            >
              {menuMode === 'full' ? (
                <>
                  <PanelLeftClose className="w-4 h-4 text-[#00D4FF] shrink-0" />
                  <span className="truncate tracking-wider">THU GỌN (MINI)</span>
                </>
              ) : (
                <PanelLeftOpen className="w-5 h-5 text-[#00D4FF] shrink-0" />
              )}
            </button>
          </div>
        </aside>

        {/* =====================================================================
            MOBILE SLIDE DRAWER (Khi bấm Hamburger trên màn hình nhỏ)
            ===================================================================== */}
        {isMobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop Blur */}
            <div
              onClick={() => setIsMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
            />

            {/* Drawer Content */}
            <div className="relative w-72 max-w-[85vw] h-full bg-[#090D18] border-r border-[#1E2D42] p-4 flex flex-col justify-between z-10 shadow-2xl">
              <div>
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#1E2D42]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#0E1626] border border-[#00D4FF]/60 flex items-center justify-center text-[#00D4FF] font-black font-mono text-xs">
                      SF
                    </div>
                    <span className="font-mono font-black text-sm text-white">
                      STARFRONT V2
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    aria-label="Đóng Menu"
                    className="w-10 h-10 rounded-lg border border-[#1E2D42] bg-[#0E1626] text-[#A7B6C8] hover:text-white flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Navigation Links */}
                <nav className="mt-4 space-y-1.5">
                  {GLOBAL_NAV_ITEMS.map((item) => {
                    const isActive = item.id === activeSectionId
                    const IconComponent = item.icon

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setIsMobileDrawerOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-3 rounded-xl border text-xs font-mono font-semibold transition-all ${
                          isActive
                            ? 'bg-[#142338] border-[#00D4FF] text-[#00D4FF]'
                            : 'border-[#1E2D42] bg-[#0B111E]/80 text-[#A7B6C8]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className="w-4 h-4 text-[#00D4FF]" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </nav>
              </div>

              {/* Drawer Footer */}
              <div className="pt-3 border-t border-[#1E2D42]">
                <Link
                  href="/v1"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0E1626] border border-[#1E2D42] text-[#A7B6C8] text-xs font-mono font-bold"
                >
                  <ChevronLeft className="w-4 h-4 text-[#00D4FF]" />
                  <span>VỀ TRANG CHỦ V1</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            MAIN PAGE / CONTENT VIEWPORT (Tự động thích ứng không gian)
            ===================================================================== */}
        <main className="flex-1 w-full flex flex-col min-w-0 h-full min-h-0 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>

      {/* AdminCP Character Content Manager Modal */}
      {isAdminCpOpen && (
        <CharacterContentManager
          isOpen={isAdminCpOpen}
          onClose={() => setIsAdminCpOpen(false)}
        />
      )}
    </div>
  )
}
export default V2Shell
