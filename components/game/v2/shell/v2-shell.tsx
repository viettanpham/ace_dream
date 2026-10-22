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
  // Global Menu Mode: 'mini' (64px) or 'full' (240px). Default is 'mini' per contract.
  const [globalMenuMode, setGlobalMenuMode] = useState<'mini' | 'full'>('mini')
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false)
  const [isMounted, setIsMounted] = useState<boolean>(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    setIsMounted(true)
    const prefs = loadV2UIPreferences()
    setGlobalMenuMode(prefs.globalMenuMode)
  }, [])

  // Toggle global menu mode and persist
  const handleToggleGlobalMenu = () => {
    const nextMode = globalMenuMode === 'mini' ? 'full' : 'mini'
    setGlobalMenuMode(nextMode)
    saveV2UIPreferences({ globalMenuMode: nextMode })
  }

  // Lock scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      const orig = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = orig
      }
    }
  }, [isMobileDrawerOpen])

  return (
    <div className="sf-v2-shell min-h-screen bg-[#070A12] text-[#F1F5F9] flex flex-col antialiased selection:bg-[#06B6D4]/30 selection:text-white">
      {/* =======================================================================
          1. TOP BAR V2 (Minimal, single tier, clean sci-fi styling)
          ======================================================================= */}
      <header className="sticky top-0 z-40 h-14 bg-[#070A12]/95 backdrop-blur-md border-b border-[#26384D] px-3 sm:px-6 flex items-center justify-between gap-3">
        {/* Left: Mobile Drawer Trigger + Brand */}
        <div className="flex items-center gap-3">
          {/* Mobile Drawer Trigger (min 44x44px) */}
          <button
            type="button"
            aria-label="Mở menu hệ thống V2"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="md:hidden min-w-[44px] min-h-[44px] rounded-xl bg-[#0F172A] border border-[#26384D] text-[#06B6D4] flex items-center justify-center active:scale-95 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand Logo & Breadcrumb */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/v2/pilots"
              className="flex items-center gap-2 group cursor-pointer"
              title="Starfront V2"
            >
              <div className="w-8 h-8 rounded-lg bg-[#142338] border border-[#06B6D4]/50 flex items-center justify-center text-[#06B6D4] font-black font-mono text-sm shadow-sm shadow-cyan-500/20 group-hover:border-[#06B6D4] transition-colors">
                SF
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm tracking-wider font-mono text-[#F1F5F9] group-hover:text-[#06B6D4] transition-colors">
                    STARFRONT
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/40">
                    V2
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#A7B6C8] hidden sm:inline">
                  AEROSPACE ARCHITECTURE
                </span>
              </div>
            </Link>

            <span className="text-[#26384D] hidden sm:inline">/</span>

            <span className="text-xs font-mono font-semibold text-[#A7B6C8] hidden sm:inline">
              HỒ SƠ PHI CÔNG // PILOT DOSSIER
            </span>
          </div>
        </div>

        {/* Right Action Zone: QUAY LẠI V1 + PREVIEW */}
        <div className="flex items-center gap-2">
          {/* Version Link to V1 */}
          <Link
            href="/"
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#142338] border border-[#26384D] text-[#F1F5F9] hover:border-[#06B6D4] hover:bg-[#1E3553] active:bg-[#0F1C2E] transition-all flex items-center gap-1.5 text-xs font-bold font-mono shrink-0 shadow-xs cursor-pointer"
            title="Quay lại giao diện Starfront V1 tại /"
          >
            <ChevronLeft className="w-4 h-4 text-[#06B6D4] shrink-0" />
            <span>QUAY LẠI V1</span>
          </Link>

          {/* Link to V2 Preview Harness */}
          <Link
            href="/ui-v2-preview"
            className="hidden sm:inline-flex min-h-[44px] px-3 py-2 rounded-xl bg-[#0F172A] border border-[#26384D] text-[#A7B6C8] hover:text-[#06B6D4] hover:border-[#3B526D] transition-colors items-center gap-1.5 text-xs font-mono font-medium"
            title="Mở môi trường kiểm thử UI V2 Primitives"
          >
            <span>PREVIEW</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* =======================================================================
          2. MAIN BODY (Sidebar Mini/Full + Stage Host)
          ======================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Global Left Menu (Full 240px / Mini 64px) */}
        <aside
          className={`hidden md:flex flex-col justify-between bg-[#0F172A] border-r border-[#26384D] transition-all duration-300 z-30 ${
            globalMenuMode === 'full' ? 'w-60' : 'w-16'
          }`}
        >
          {/* Top Section of Menu */}
          <div className="p-2 space-y-1">
            {GLOBAL_NAV_ITEMS.map((item) => {
              const isActive = item.id === activeSectionId
              const Icon = item.icon

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  title={item.label}
                  className={`min-h-[44px] w-full rounded-xl flex items-center gap-3 px-3 py-2.5 transition-all select-none cursor-pointer ${
                    isActive
                      ? 'bg-[#142338] border border-[#06B6D4] text-[#F1F5F9] shadow-sm shadow-cyan-500/20'
                      : item.status === 'placeholder'
                      ? 'text-[#A7B6C8]/60 hover:text-[#A7B6C8] hover:bg-[#142338]/40 border border-transparent'
                      : 'text-[#A7B6C8] hover:text-[#F1F5F9] hover:bg-[#142338]/60 border border-transparent'
                  }`}
                >
                  <div
                    className={`w-6 h-6 flex items-center justify-center shrink-0 ${
                      isActive ? 'text-[#06B6D4]' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {globalMenuMode === 'full' && (
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <span className="text-xs font-bold truncate">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                            isActive
                              ? 'bg-[#06B6D4]/20 text-[#06B6D4]'
                              : 'bg-[#070A12] text-[#A7B6C8]/60'
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
          </div>

          {/* Bottom Section: Collapse / Expand Toggle */}
          <div className="p-2 border-t border-[#26384D]">
            <button
              type="button"
              onClick={handleToggleGlobalMenu}
              aria-label={globalMenuMode === 'full' ? 'Thu gọn menu' : 'Mở rộng menu'}
              title={globalMenuMode === 'full' ? 'Thu gọn menu (Mini)' : 'Mở rộng menu (Full)'}
              className="min-h-[44px] w-full rounded-xl bg-[#070A12] border border-[#26384D] hover:border-[#06B6D4] text-[#A7B6C8] hover:text-[#F1F5F9] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {globalMenuMode === 'full' ? (
                <>
                  <ChevronLeft className="w-4 h-4 text-[#06B6D4]" />
                  <span className="text-xs font-mono font-medium truncate">
                    THU GỌN MENU
                  </span>
                </>
              ) : (
                <ChevronRight className="w-4 h-4 text-[#06B6D4]" />
              )}
            </button>
          </div>
        </aside>

        {/* Content Area Host */}
        <main className="flex-1 min-w-0 bg-[#070A12] overflow-y-auto">
          {children}
        </main>
      </div>

      {/* =======================================================================
          3. MOBILE HAMBURGER DRAWER (Slide-over navigation)
          ======================================================================= */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-[#070A12]/80 backdrop-blur-md flex">
          {/* Drawer Panel */}
          <div className="w-72 max-w-[80vw] h-full bg-[#0F172A] border-r border-[#26384D] p-4 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#26384D]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#142338] border border-[#06B6D4]/50 flex items-center justify-center text-[#06B6D4] font-mono font-bold text-xs">
                    SF
                  </div>
                  <span className="font-bold text-sm tracking-wider text-[#F1F5F9]">
                    STARFRONT V2
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Đóng menu"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="min-w-[44px] min-h-[44px] rounded-lg text-[#A7B6C8] hover:text-[#F1F5F9] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu List */}
              <nav className="space-y-1.5">
                {GLOBAL_NAV_ITEMS.map((item) => {
                  const isActive = item.id === activeSectionId
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className={`min-h-[44px] w-full rounded-xl flex items-center justify-between px-3.5 py-2.5 text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#142338] border border-[#06B6D4] text-[#06B6D4]'
                          : 'text-[#A7B6C8] hover:text-[#F1F5F9] hover:bg-[#142338]/40 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#070A12] text-[#A7B6C8]">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Drawer Footer with V1 Link */}
            <div className="pt-4 border-t border-[#26384D] space-y-2">
              <Link
                href="/"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="min-h-[44px] w-full rounded-xl bg-[#142338] border border-[#26384D] text-[#F1F5F9] flex items-center justify-center gap-2 text-xs font-mono font-bold"
              >
                <ChevronLeft className="w-4 h-4 text-[#06B6D4]" />
                <span>QUAY LẠI STARFRONT V1</span>
              </Link>
              <Link
                href="/ui-v2-preview"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="min-h-[44px] w-full rounded-xl bg-[#070A12] border border-[#26384D] text-[#A7B6C8] flex items-center justify-center gap-2 text-xs font-mono font-medium"
              >
                <span>V2 PREVIEW HARNESS</span>
              </Link>
            </div>
          </div>

          {/* Backdrop Tap to Close */}
          <div
            className="flex-1"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
export default V2Shell
