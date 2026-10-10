"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { STARFRONT_GEAR_DEFS } from "@/lib/game/data"
import {
  isAudioMuted,
  playClickSound,
  playLevelUpSound,
  playShieldSound,
  setAudioMuted,
} from "@/lib/game/audio"
import {
  loadStarfrontProgression,
  resetStarfrontProgression,
  saveStarfrontProgression,
} from "@/lib/game/storage"
import {
  buildPlayerCombatUnit,
  enhanceItem,
  getExpRequiredForLevel,
  INITIAL_STARFRONT_PROGRESSION,
} from "@/lib/game/progression"
import type {
  CampaignMission,
  StarfrontGearId,
  StarfrontItemSlot,
  StarfrontProgression,
} from "@/lib/game/types"
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Coins,
  Cpu,
  Globe2,
  Layers,
  LayoutDashboard,
  Lock,
  Radio,
  Rocket,
  Shield,
  ShoppingBag,
  Sparkles,
  Swords,
  Volume2,
  VolumeX,
  X,
} from "lucide-react"

import { StarfrontHome } from "./starfront-home"
import { CombatArena } from "./combat-arena"
import { CampaignMap } from "./campaign-map"
import { StarfrontShop } from "./starfront-shop"
import { StarfrontHangar } from "./starfront-hangar"

export type StarfrontSection = "home" | "battlefield" | "missions" | "shop" | "hangar"

interface SectionConfig {
  id: StarfrontSection
  label: string
  shortLabel: string
  icon: typeof Rocket
  badge?: (prog: StarfrontProgression) => string | null
}

const SECTIONS: SectionConfig[] = [
  {
    id: "home",
    label: "STARFRONT / Tổng Quan",
    shortLabel: "Tổng Quan",
    icon: Rocket,
  },
  {
    id: "battlefield",
    label: "Chiến Trường",
    shortLabel: "Chiến Trường",
    icon: Swords,
  },
  {
    id: "missions",
    label: "Nhiệm Vụ",
    shortLabel: "Nhiệm Vụ",
    icon: Globe2,
    badge: (p) => `${p.completedMissions.length}/12`,
  },
  {
    id: "shop",
    label: "Chợ Quân Sự",
    shortLabel: "Chợ Quân Sự",
    icon: ShoppingBag,
    badge: (p) => (p.freeShopRefreshes && p.freeShopRefreshes > 0 ? `${p.freeShopRefreshes} Free` : null),
  },
  {
    id: "hangar",
    label: "Hangar & Kho Đồ",
    shortLabel: "Hangar & Kho",
    icon: Boxes,
    badge: (p) => `${p.inventory.length}`,
  },
]

const GEAR_THEME_COLORS: Record<
  StarfrontGearId,
  {
    badgeBg: string
    badgeText: string
    badgeBorder: string
    border: string
    glow: string
    accent: string
  }
> = {
  vanguard: {
    badgeBg: "bg-cyan-500/20",
    badgeText: "text-cyan-300",
    badgeBorder: "border-cyan-500/50",
    border: "border-cyan-500/40",
    glow: "shadow-[0_0_12px_rgba(6,182,212,0.3)]",
    accent: "text-cyan-400",
  },
  falcon: {
    badgeBg: "bg-purple-500/20",
    badgeText: "text-purple-300",
    badgeBorder: "border-purple-500/50",
    border: "border-purple-500/40",
    glow: "shadow-[0_0_12px_rgba(168,85,247,0.3)]",
    accent: "text-purple-400",
  },
  aegis: {
    badgeBg: "bg-amber-500/20",
    badgeText: "text-amber-300",
    badgeBorder: "border-amber-500/50",
    border: "border-amber-500/40",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.3)]",
    accent: "text-amber-400",
  },
}

export function StarfrontShell() {
  const [progression, setProgression] = useState<StarfrontProgression>(INITIAL_STARFRONT_PROGRESSION)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [activeSection, setActiveSection] = useState<StarfrontSection>("home")
  const [activeCampaignMission, setActiveCampaignMission] = useState<CampaignMission | null>(null)
  const [audioMuted, setAudioMutedState] = useState(false)

  // Khởi tạo và nạp dữ liệu từ LocalStorage
  useEffect(() => {
    const saved = loadStarfrontProgression()
    setProgression(saved)
    setHasLoaded(true)
    setAudioMutedState(isAudioMuted())
  }, [])

  // Lưu tự động mỗi khi có thay đổi tiến trình
  const handleUpdateProgression = (updated: StarfrontProgression) => {
    setProgression(updated)
    saveStarfrontProgression(updated)
  }

  // Chuyển đổi lớp Gear
  const handleSelectGear = (gearId: StarfrontGearId) => {
    playClickSound()
    const updated: StarfrontProgression = {
      ...progression,
      activeGearId: gearId,
    }
    handleUpdateProgression(updated)
  }

  // Bật/tắt âm thanh
  const handleToggleAudio = () => {
    const next = !audioMuted
    setAudioMutedState(next)
    setAudioMuted(next)
    if (!next) {
      playClickSound()
    }
  }

  // Chuyển phân hệ
  const handleSwitchSection = (section: StarfrontSection) => {
    playClickSound()
    setActiveSection(section)
  }

  // Xuất kích từ Bản đồ nhiệm vụ sang Đấu trường
  const handleDeployMission = (mission: CampaignMission) => {
    playClickSound()
    setActiveCampaignMission(mission)
    setActiveSection("battlefield")
  }

  // Hủy nhiệm vụ đang chọn để quay về chế độ tự do
  const handleClearMission = () => {
    playClickSound()
    setActiveCampaignMission(null)
  }

  // Trang bị vật phẩm trong Hangar
  const handleEquipItem = (itemId: string, slot: StarfrontItemSlot) => {
    playClickSound()
    const updated: StarfrontProgression = {
      ...progression,
      equipped: {
        ...progression.equipped,
        [slot]: itemId,
      },
    }
    handleUpdateProgression(updated)
  }

  // Tháo trang bị
  const handleUnequipSlot = (slot: StarfrontItemSlot) => {
    playClickSound()
    const updated: StarfrontProgression = {
      ...progression,
      equipped: {
        ...progression.equipped,
        [slot]: null,
      },
    }
    handleUpdateProgression(updated)
  }

  // Cường hóa trang bị (+1 đến +10)
  const handleEnhanceItem = (itemId: string) => {
    const { updated, result } = enhanceItem(progression, itemId)
    handleUpdateProgression(updated)
    if (result.success) {
      playLevelUpSound()
    } else {
      playShieldSound()
    }
    return result
  }

  // Reset tiến trình
  const handleResetSave = () => {
    playClickSound()
    const fresh = resetStarfrontProgression()
    setProgression(fresh)
    setActiveCampaignMission(null)
    setActiveSection("home")
  }

  const activeGearId: StarfrontGearId = progression.activeGearId || "vanguard"
  const activeGearDef = STARFRONT_GEAR_DEFS[activeGearId] || STARFRONT_GEAR_DEFS.vanguard
  const theme = GEAR_THEME_COLORS[activeGearId] || GEAR_THEME_COLORS.vanguard

  const expRequired = getExpRequiredForLevel(progression.level)
  const expPct = Math.min(100, Math.round((progression.exp / expRequired) * 100))
  const alloyCount = progression.alloy ?? 25

  return (
    <div className="flex flex-col gap-4">
      {/* 1. KHUNG ĐIỀU HƯỚNG TỔNG THỂ STARFRONT (MASTER NAVIGATION SHELL) */}
      <header className="rounded-sm border border-cyan-500/30 bg-black/80 p-3 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Thông tin phi cơ & người chỉ huy */}
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-xs font-mono text-sm font-black border",
                theme.badgeBg,
                theme.badgeText,
                theme.badgeBorder,
              )}
            >
              {activeGearDef.name.charAt(0)}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-black uppercase tracking-wider text-white">
                  STARFRONT // {activeGearDef.name.toUpperCase()}
                </span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.2 font-mono text-xs font-bold border",
                    theme.badgeBg,
                    theme.badgeText,
                    theme.badgeBorder,
                  )}
                >
                  CẤP {progression.level}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                <span className="text-cyan-300 font-bold">{activeGearDef.role}</span>
                <span>·</span>
                <span>EXP: {progression.exp}/{expRequired} ({expPct}%)</span>
              </div>
            </div>
          </div>

          {/* Thanh Ngân Sách & Nút Âm Thanh */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {/* Tín Dụng */}
            <div className="flex items-center gap-1.5 rounded-xs border border-amber-500/40 bg-amber-950/30 px-2.5 py-1 text-amber-300">
              <Coins className="size-3.5 text-amber-400" />
              <strong>{progression.credits.toLocaleString("vi-VN")}</strong>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">Cr</span>
            </div>

            {/* Hợp Kim Alloy */}
            <div className="flex items-center gap-1.5 rounded-xs border border-purple-500/40 bg-purple-950/30 px-2.5 py-1 text-purple-300">
              <Layers className="size-3.5 text-purple-400" />
              <strong>{alloyCount}</strong>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">Alloy</span>
            </div>

            {/* Nút Bật/Tắt Âm Thanh Sci-Fi */}
            <button
              onClick={handleToggleAudio}
              title={audioMuted ? "Bật âm thanh Sci-Fi Web Audio" : "Tắt âm thanh"}
              className="flex size-7 items-center justify-center rounded-xs border border-border/70 bg-black/50 text-muted-foreground hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
            >
              {audioMuted ? <VolumeX className="size-3.5 text-red-400" /> : <Volume2 className="size-3.5 text-cyan-400" />}
            </button>
          </div>
        </div>

        {/* Dải 5 Tab Điều Hướng Chính Của STARFRONT */}
        <nav className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-2.5">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon
            const isActive = activeSection === sec.id
            const badgeVal = sec.badge ? sec.badge(progression) : null

            return (
              <button
                key={sec.id}
                onClick={() => handleSwitchSection(sec.id)}
                className={cn(
                  "relative flex items-center gap-2 rounded-xs border px-3 py-1.5 font-display text-xs transition-all cursor-pointer",
                  isActive
                    ? "border-cyan-400 bg-cyan-950/80 text-cyan-200 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                    : "border-border/60 bg-panel/40 text-muted-foreground hover:border-cyan-500/40 hover:text-foreground hover:bg-panel/70",
                )}
              >
                <Icon className={cn("size-3.5", isActive ? "text-cyan-300" : "text-muted-foreground")} />
                <span>{sec.label}</span>
                {badgeVal && (
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.2 font-mono text-[9px] font-bold border",
                      isActive
                        ? "bg-cyan-500/30 text-cyan-100 border-cyan-400/50"
                        : "bg-black/40 text-muted-foreground border-border/40",
                    )}
                  >
                    {badgeVal}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </header>

      {/* Banner thông báo trạng thái nhiệm vụ chiến dịch đang diễn ra khi duyệt ở phân hệ khác */}
      {activeCampaignMission && activeSection !== "battlefield" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-black/80 to-amber-950/40 p-2.5 shadow-md animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-mono">
            <Radio className="size-4 text-amber-400 animate-pulse" />
            <span className="text-amber-300 font-bold">
              ĐANG CÓ NHIỆM VỤ CHIẾN DỊCH: {activeCampaignMission.title}
            </span>
            <span className="text-muted-foreground hidden sm:inline">
              ({activeCampaignMission.sectorName} · Cấp {activeCampaignMission.recommendedLevel}+)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playClickSound()
                setActiveSection("battlefield")
              }}
              className="flex items-center gap-1 rounded-xs bg-amber-500/20 px-2.5 py-1 text-xs font-mono font-bold text-amber-300 border border-amber-400/60 hover:bg-amber-500/30 transition-colors cursor-pointer"
            >
              <span>Vào Trận Ngay</span>
              <ArrowRight className="size-3" />
            </button>
            <button
              onClick={handleClearMission}
              title="Hủy nhiệm vụ để tự do chọn mục tiêu"
              className="flex items-center gap-1 rounded-xs border border-border/60 bg-black/40 px-2 py-1 text-[11px] font-mono text-muted-foreground hover:text-white transition-colors cursor-pointer"
            >
              <X className="size-3" />
              <span>Hủy</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. KHU VỰC NỘI DUNG TỪNG PHÂN HỆ ĐỘC LẬP */}
      <main className="min-w-0 flex-1">
        {/* Phân hệ 1: Tổng Quan (Home) */}
        {activeSection === "home" && (
          <StarfrontHome
            progression={progression}
            onNavigate={(target) => handleSwitchSection(target)}
            onSelectGear={handleSelectGear}
          />
        )}

        {/* Phân hệ 2: Đấu Trường (Battlefield) */}
        {activeSection === "battlefield" && (
          <CombatArena
            progression={progression}
            onUpdateProgression={handleUpdateProgression}
            activeCampaignMission={activeCampaignMission}
            onClearCampaignMission={handleClearMission}
            onNavigateSection={handleSwitchSection}
            isEmbeddedInShell={true}
          />
        )}

        {/* Phân hệ 3: Nhiệm Vụ & Bản Đồ Chiến Dịch (Missions) */}
        {activeSection === "missions" && (
          <CampaignMap
            progression={progression}
            onUpdateProgression={handleUpdateProgression}
            onDeployMission={handleDeployMission}
          />
        )}

        {/* Phân hệ 4: Chợ Quân Sự (Military Shop) */}
        {activeSection === "shop" && (
          <StarfrontShop
            progression={progression}
            onUpdateProgression={handleUpdateProgression}
          />
        )}

        {/* Phân hệ 5: Hangar & Kho Đồ (Hangar & Inventory) */}
        {activeSection === "hangar" && (
          <StarfrontHangar
            progression={progression}
            onEquipItem={handleEquipItem}
            onUnequipSlot={handleUnequipSlot}
            onEnhanceItem={handleEnhanceItem}
            onUpdateProgression={handleUpdateProgression}
            onResetSave={handleResetSave}
            onSelectGear={handleSelectGear}
            onNavigateToCombat={() => handleSwitchSection("battlefield")}
          />
        )}
      </main>
    </div>
  )
}
