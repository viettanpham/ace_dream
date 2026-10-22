import { Metadata } from 'next'
import { V2Shell } from '@/components/game/v2/shell/v2-shell'
import { PilotProfileV2 } from '@/components/game/v2/pilot-profile/pilot-profile-v2'

export const metadata: Metadata = {
  title: 'Hồ Sơ Phi Công V2 | Starfront World',
  description: 'Giao diện Hồ Sơ Phi Công Starfront V2 chuẩn Modern Aerospace Sci-Fi Architecture (FND-8 / 8.2.3.E.0).',
}

/**
 * STARFRONT WORLD V2 — OFFICIAL CHARACTER CATEGORY / PILOT PROFILE ROUTE
 * Real, direct URL: /v2/pilots
 * 
 * Features:
 * - Minimum isolated V2 Shell with Top Bar, Global Left Menu (Full/Mini), and Mobile Drawer
 * - Integrated Character Category / Pilot Profile V2 with Valentine reference
 * - Desktop 3-column composition & Mobile paired states (Art View / Info View)
 * - Safe return links to V1 without navigation loops
 */
export default function V2PilotsPage() {
  return (
    <V2Shell activeSectionId="pilots">
      <PilotProfileV2 />
    </V2Shell>
  )
}
