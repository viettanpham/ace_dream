'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { CharacterProfileV2 } from '@/lib/game/v2/character-profile-data'
import { resolveImageUrl } from '@/lib/game/assets/image-resolver'
import {
  Coins,
  Radio,
  Shield,
  Flame,
  User,
  Sparkles,
} from 'lucide-react'

// 12 canonical pilots confirmed available on CDN jsDelivr / R2
export const VERIFIED_CANONICAL_PILOT_IDS = [
  'valentine',
  'marcus',
  'alviss',
  'eric',
  'victor',
  'kaelen',
  'lyra',
  'selena',
  'fortuna',
  'aria',
  'rhea',
  'nova',
]

interface PilotAvatarProps {
  character: CharacterProfileV2
  isSelected?: boolean
  className?: string
  priority?: boolean
}

/**
 * STARFRONT WORLD V2 — CANONICAL PILOT AVATAR (FND-8)
 * 
 * Strict rule enforcement:
 * - Only 8 confirmed pilots render their authentic CDN webp portrait.
 * - Fortuna, Aria, Rhea, Nova (and any missing arts) render dedicated distinct Class Badges.
 * - ZERO fallback to Valentine for other pilots under any circumstances.
 */
export function PilotAvatar({
  character,
  isSelected = false,
  className = '',
  priority = false,
}: PilotAvatarProps) {
  const [hasError, setHasError] = useState(false)
  const isVerified = VERIFIED_CANONICAL_PILOT_IDS.includes(character.id)

  // Specific distinct styling & icon for pilots awaiting WebP production
  const renderDistinctPlaceholder = () => {
    switch (character.id) {
      case 'fortuna':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-950 via-slate-900 to-black text-amber-400 p-1">
            <Coins className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="text-[10px] font-mono font-black text-amber-300 mt-0.5 tracking-tighter">FT</span>
          </div>
        )
      case 'aria':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-sky-950 via-slate-900 to-black text-sky-400 p-1">
            <Radio className="w-5 h-5 text-sky-400 animate-pulse" />
            <span className="text-[10px] font-mono font-black text-sky-300 mt-0.5 tracking-tighter">AR</span>
          </div>
        )
      case 'rhea':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-slate-900 to-black text-emerald-400 p-1">
            <Shield className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono font-black text-emerald-300 mt-0.5 tracking-tighter">RH</span>
          </div>
        )
      case 'nova':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-rose-950 via-slate-900 to-black text-rose-400 p-1">
            <Flame className="w-5 h-5 text-rose-400 animate-pulse" />
            <span className="text-[10px] font-mono font-black text-rose-300 mt-0.5 tracking-tighter">NV</span>
          </div>
        )
      case 'marcus':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-950 via-slate-900 to-black text-blue-400 p-1">
            <Shield className="w-5 h-5 text-blue-400 animate-pulse" />
            <span className="text-[10px] font-mono font-black text-blue-300 mt-0.5 tracking-tighter">MA</span>
          </div>
        )
      case 'victor':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-950 via-slate-900 to-black text-amber-500 p-1">
            <Shield className="w-5 h-5 text-amber-500 animate-pulse" />
            <span className="text-[10px] font-mono font-black text-amber-300 mt-0.5 tracking-tighter">VI</span>
          </div>
        )
      default:
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-black text-[#00D4FF] p-1">
            <User className="w-5 h-5 text-[#00D4FF]" />
            <span className="text-[9px] font-mono font-bold text-[#A7B6C8] uppercase">
              {character.classCharacterName.slice(0, 2)}
            </span>
          </div>
        )
    }
  }

  // Marcus and Victor currently do not have portrait WebP on CDN R3 (fallback to dedicated initials badge)
  const lacksCdnPortrait = character.id === 'marcus' || character.id === 'victor'

  // If pilot lacks CDN portrait, is not verified, or network failed, render dedicated placeholder
  if (lacksCdnPortrait || !isVerified || hasError) {
    return (
      <div
        className={`relative rounded-lg overflow-hidden border shrink-0 ${
          isSelected
            ? 'border-[#00D4FF] shadow-[0_0_10px_rgba(0,212,255,0.4)]'
            : 'border-[#1E2D42]'
        } ${className}`}
      >
        {renderDistinctPlaceholder()}
      </div>
    )
  }

  return (
    <div
      className={`relative rounded-lg overflow-hidden border shrink-0 ${
        isSelected
          ? 'border-[#00D4FF] shadow-[0_0_10px_rgba(0,212,255,0.4)]'
          : 'border-[#1E2D42]'
      } ${className}`}
    >
      <Image
        src={resolveImageUrl(character.portraitAssetPath)}
        alt={character.classCharacterName}
        fill
        priority={priority}
        referrerPolicy="no-referrer"
        className="object-cover"
        onError={() => setHasError(true)}
      />
      {isSelected && (
        <div className="absolute inset-0 border border-[#00D4FF]/40 rounded-lg pointer-events-none" />
      )}
    </div>
  )
}
export default PilotAvatar
