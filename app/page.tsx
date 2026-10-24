'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { V2Shell } from '@/components/game/v2/shell/v2-shell'
import { PilotProfileV2 } from '@/components/game/v2/pilot-profile/pilot-profile-v2'

const StarfrontShell = dynamic(
  () => import('@/components/game/starfront-shell').then((mod) => mod.StarfrontShell),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-cyan-400 font-mono text-sm">
        NẠP HỆ THỐNG STARFRONT V1...
      </div>
    ),
  }
)

function RootPageContent() {
  const searchParams = useSearchParams()
  const isV1Requested = searchParams.get('v') === '1' || searchParams.get('version') === 'v1'

  if (isV1Requested) {
    return <StarfrontShell />
  }

  return (
    <V2Shell activeSectionId="pilots">
      <PilotProfileV2 />
    </V2Shell>
  )
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-cyan-400 font-mono text-sm">
          NẠP HỆ THỐNG STARFRONT V2...
        </div>
      }
    >
      <RootPageContent />
    </Suspense>
  )
}
