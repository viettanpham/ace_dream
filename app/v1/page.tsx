'use client'

import dynamic from 'next/dynamic'

const StarfrontShell = dynamic(
  () => import('@/components/game/starfront-shell').then((mod) => mod.StarfrontShell),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-cyan-400 font-mono text-sm">
        NẠP HỆ THỐNG STARFRONT V1 (LEGACY)...
      </div>
    ),
  }
)

/**
 * STARFRONT WORLD V1 — CANONICAL LEGACY ROUTE (/v1)
 * Preserves the original Starfront V1 game shell, tactical grid, and classic state
 */
export default function V1Page() {
  return <StarfrontShell />
}
