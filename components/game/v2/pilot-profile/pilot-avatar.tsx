'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { CharacterProfileV2 } from '@/lib/game/v2/character-profile-data'
import { User } from 'lucide-react'

interface PilotAvatarProps {
  character: CharacterProfileV2
  isSelected?: boolean
  className?: string
  priority?: boolean
}

/**
 * STARFRONT WORLD V2 — DYNAMIC CDN PILOT AVATAR (FND-8 R4 -> R5+)
 *
 * Quy tắc:
 * - Chỉ hiển thị ảnh từ URL CDN đã VERIFIED (`portraitAssetPath` hoặc `fullbodyAssetPath` đã xác thực).
 * - Không hardcode danh sách 8 hay 12 Pilot.
 * - Nếu nhân vật chưa có ảnh VERIFIED trên bản phát hành hiện tại hoặc lỗi tải mạng,
 *   hiển thị huy hiệu chữ cái viết tắt (Monogram Badge) riêng biệt, tuyệt đối không lấy ảnh V1 hay ảnh của Pilot khác.
 */
export function PilotAvatar({
  character,
  isSelected = false,
  className = '',
  priority = false,
}: PilotAvatarProps) {
  const [hasError, setHasError] = useState(false)
  const verifiedAvatarUrl = character.portraitAssetPath || character.fullbodyAssetPath || ''

  useEffect(() => {
    setHasError(false)
  }, [verifiedAvatarUrl, character.id])

  if (!verifiedAvatarUrl || hasError) {
    const initials = (character.classCharacterName || character.id || 'SF')
      .slice(0, 2)
      .toUpperCase()

    return (
      <div
        className={`relative rounded-lg overflow-hidden border shrink-0 ${
          isSelected
            ? 'border-[#00D4FF] shadow-[0_0_10px_rgba(0,212,255,0.4)]'
            : 'border-[#1E2D42]'
        } ${className}`}
      >
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-[#0E1626] to-black text-[#00D4FF] p-1">
          <User className="w-4 h-4 text-[#00D4FF]/80" />
          <span className="text-[10px] font-mono font-black text-[#F1F5F9] uppercase mt-0.5 tracking-tighter">
            {initials}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative rounded-lg overflow-hidden border shrink-0 bg-[#070A12] ${
        isSelected
          ? 'border-[#00D4FF] shadow-[0_0_10px_rgba(0,212,255,0.4)]'
          : 'border-[#1E2D42]'
      } ${className}`}
    >
      <Image
        src={verifiedAvatarUrl}
        alt={character.classCharacterName}
        fill
        priority={priority}
        referrerPolicy="no-referrer"
        className="object-cover object-top"
        onError={() => setHasError(true)}
      />
      {isSelected && (
        <div className="absolute inset-0 border border-[#00D4FF]/40 rounded-lg pointer-events-none" />
      )}
    </div>
  )
}

export default PilotAvatar
