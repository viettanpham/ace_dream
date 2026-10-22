'use client'

import React from 'react'
import Image from 'next/image'
import { CharacterProfileV2 } from '@/lib/game/v2/character-profile-data'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/game/v2/ui'
import { Cpu, Shield, Zap, Sparkles, AlertCircle } from 'lucide-react'

interface GearCompatTabProps {
  character: CharacterProfileV2
}

interface GearCompatibilityData {
  id: string
  name: string
  classType: string
  role: string
  compatibilityRank: 'S' | 'A' | 'B' | 'C'
  rankColor: string
  imagePath: string
  synergyReason: string
}

export function GearCompatTab({ character }: GearCompatTabProps) {
  // Canonical 3 Gear archetypes
  const gearList: GearCompatibilityData[] = [
    {
      id: 'aegis',
      name: 'Aegis Shield-Carrier',
      classType: 'Heavy Protective Frame',
      role: 'Phòng Thủ & Hồi Phục Khiên',
      compatibilityRank: 'S',
      rankColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40',
      imagePath: '/images/aegis-gear.webp',
      synergyReason:
        'Cực kỳ tối ưu hóa với năng lực Mercy Wing và trường lực năng lượng ENE/SHD cao của Valentine.',
    },
    {
      id: 'vanguard',
      name: 'Vanguard Striker',
      classType: 'Balanced Assault Frame',
      role: 'Tấn Công Đa Năng Cận Chiến',
      compatibilityRank: 'B',
      rankColor: 'text-amber-400 bg-amber-950/60 border-amber-500/40',
      imagePath: '/images/vanguard-gear.webp',
      synergyReason:
        'Tương thích trung bình. Đòi hỏi phi công phải điều chỉnh phong cách tiếp cận từ phòng thủ sang tấn công.',
    },
    {
      id: 'falcon',
      name: 'Falcon Interceptor',
      classType: 'High-Speed Aerial Frame',
      role: 'Tiêm Kích Tốc Độ Siêu Âm',
      compatibilityRank: 'C',
      rankColor: 'text-slate-400 bg-slate-900 border-slate-700',
      imagePath: '/images/falcon-gear.webp',
      synergyReason:
        'Tiêu hao động năng cao, xung đột với hệ thống hồi phục sinh học và bộ điều áp y tế chuyên dụng.',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Informational Banner */}
      <div className="p-4 rounded-xl bg-[#0F172A] border border-[#26384D] flex items-start gap-3">
        <Cpu className="w-5 h-5 text-[#06B6D4] shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-[#A7B6C8] leading-relaxed">
          <strong className="text-[#F1F5F9]">Tương Thích Cơ Giáp (Gear Compatibility Matrix): </strong>
          Đánh giá khả năng đồng bộ sóng não và hiệu suất liên kết thần kinh giữa phi công{' '}
          <span className="text-[#06B6D4] font-semibold">{character.classCharacterName}</span> với các dòng khung cơ giáp chủ lực Starfront.
        </div>
      </div>

      {/* Gear Compatibility Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {gearList.map((gear) => (
          <Card
            key={gear.id}
            variant="panel"
            className="border-[#26384D] bg-[#0F172A]/90 overflow-hidden flex flex-col justify-between"
          >
            <div>
              {/* Gear Thumbnail */}
              <div className="relative h-44 w-full bg-[#070A12] border-b border-[#26384D] overflow-hidden">
                <Image
                  src={gear.imagePath}
                  alt={gear.name}
                  fill
                  referrerPolicy="no-referrer"
                  className="object-contain p-2 hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-mono font-black text-sm border shadow-md ${gear.rankColor}`}
                  >
                    {gear.compatibilityRank}
                  </span>
                </div>
              </div>

              {/* Gear Info */}
              <div className="p-4 space-y-2">
                <div>
                  <h4 className="text-base font-bold text-[#F1F5F9]">{gear.name}</h4>
                  <p className="text-xs font-mono text-[#06B6D4]">{gear.classType}</p>
                </div>
                <div className="text-xs text-[#A7B6C8] space-y-1 pt-1">
                  <div>
                    <span className="text-[#F1F5F9] font-medium">Vai trò: </span>
                    {gear.role}
                  </div>
                  <p className="leading-relaxed pt-1 text-[#CBD5E1]">
                    {gear.synergyReason}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 pt-0">
              <div className="p-2.5 rounded-lg bg-[#070A12]/60 border border-[#26384D]/60 flex items-center justify-between text-xs">
                <span className="text-[#A7B6C8]">Độ tương thích</span>
                <span className="font-mono font-bold text-[#F1F5F9]">
                  Hạng {gear.compatibilityRank}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Canon Notice */}
      <div className="p-3.5 rounded-xl bg-[#070A12]/60 border border-[#26384D]/50 text-xs text-[#A7B6C8] flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-[#FBBF24] shrink-0" />
        <span>
          Cơ chế ghép trang bị chiến đấu thực tế và tính toán thuộc tính hỏa lực sẽ được đồng bộ chính thức tại phân hệ FND-8.3.
        </span>
      </div>
    </div>
  )
}
