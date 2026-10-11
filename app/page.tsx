'use client'

import dynamic from 'next/dynamic'

const StarfrontShell = dynamic(
  () => import('@/components/game/starfront-shell').then((mod) => mod.StarfrontShell),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-cyan-400 font-mono text-sm">
        NẠP HỆ THỐNG STARFRONT...
      </div>
    ),
  }
)

export default function Page() {
  return <StarfrontShell />
}

