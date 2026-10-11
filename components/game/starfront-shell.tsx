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
import { getCurrentOrNextCampaignMission } from "@/lib/game/scaling"
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coins,
  Cpu,
  Flag,
  Globe2,
  Hammer,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Lock,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Radar,
  Radio,
  Recycle,
  Rocket,
  Shield,
  ShoppingBag,
  Sparkles,
  Swords,
  UserRound,
  Users,
  Volume2,
  VolumeX,
  Warehouse,
  X,
  Zap,
} from "lucide-react"

import { StarfrontHome } from "./starfront-home"
import { CombatArena } from "./combat-arena"
import { CampaignMap } from "./campaign-map"
import { StarfrontShop } from "./starfront-shop"
import { StarfrontHangar } from "./starfront-hangar"
import { CharacterGearSelect } from "./character-gear-select"
import { STARFRONT_PILOT_MAP } from "@/lib/game/data"

// Các phân hệ tác chiến bổ trợ (Fleet & Base Operations)
import { GameProvider } from "@/lib/game/store"
import { FleetPanel } from "./fleet-panel"
import { BasePanel } from "./base-panel"
import { WarRoom } from "./war-room"
import { PilotPanel } from "./pilot-panel"
import { MapPanel } from "./map-panel"

export type StarfrontSection =
  | "home"
  | "character-gear"
  | "battlefield"
  | "missions"
  | "shop"
  | "hangar"
  | "fleet"
  | "base"
  | "war"
  | "pilot"

interface SubMenuItem {
  id: string
  label: string
  action?: () => void
  badge?: string
}

interface SectionConfig {
  id: StarfrontSection
  label: string
  shortLabel: string
  icon: typeof Rocket
  badge?: (prog: StarfrontProgression) => string | null
  submenus?: (prog: StarfrontProgression, onSelectSubmenu?: (subId: string) => void) => SubMenuItem[]
}

const SECTIONS: SectionConfig[] = [
  {
    id: "home",
    label: "STARFRONT / Tổng Quan",
    shortLabel: "Tổng Quan",
    icon: LayoutDashboard,
    submenus: () => [
      { id: "overview", label: "Bảng Chỉ Huy Tác Chiến" },
      { id: "gears", label: "Hồ Sơ 3 Lớp Cơ Giáp" },
    ],
  },
  {
    id: "character-gear",
    label: "Nhân Vật & Cơ Giáp",
    shortLabel: "Nhân Vật & Gear",
    icon: Users,
    badge: (p) => {
      const pilotId = p.activePairing?.pilotId || "marcus"
      const gearId = p.activePairing?.gearId || p.activeGearId || "vanguard"
      const pName = STARFRONT_PILOT_MAP[pilotId]?.name.split(" ")[0] || "Marcus"
      const gName = (gearId.charAt(0).toUpperCase() + gearId.slice(1))
      return `${pName}/${gName}`
    },
    submenus: () => [
      { id: "pair-flow", label: "Ghép Đôi 3 Bước" },
      { id: "pilot-list", label: "4 Hồ Sơ Phi Công" },
      { id: "gear-list", label: "3 Lớp Cơ Giáp" },
    ],
  },
  {
    id: "battlefield",
    label: "Chiến Trường",
    shortLabel: "Chiến Trường",
    icon: Swords,
    submenus: (p) => [
      { id: "arena", label: "Đấu Trường Cơ Giáp" },
      { id: "combat-log", label: "Nhật Ký Tác Chiến" },
      ...(p.activeQuest ? [{ id: "active-quest", label: "Nhiệm Vụ Đang Thực Hiện", badge: "Live" }] : []),
    ],
  },
  {
    id: "missions",
    label: "Nhiệm Vụ & Chiến Dịch",
    shortLabel: "Nhiệm Vụ",
    icon: Globe2,
    badge: (p) => `${p.completedMissions.length}/12`,
    submenus: () => [
      { id: "sectors", label: "Bản Đồ 4 Sector Vũ Trụ" },
      { id: "side-quests", label: "Nhiệm Vụ Phụ Tuyến" },
    ],
  },
  {
    id: "shop",
    label: "Chợ Quân Sự",
    shortLabel: "Chợ Quân Sự",
    icon: ShoppingBag,
    badge: (p) => (p.freeShopRefreshes && p.freeShopRefreshes > 0 ? `${p.freeShopRefreshes} Free` : null),
    submenus: () => [
      { id: "armory", label: "Kho Vũ Khí & Trang Bị" },
      { id: "refresh", label: "Làm Mới Hàng Hóa" },
    ],
  },
  {
    id: "hangar",
    label: "Hangar & Kho Đồ",
    shortLabel: "Hangar & Kho",
    icon: Boxes,
    badge: (p) => `${p.inventory.length}`,
    submenus: () => [
      { id: "loadout", label: "Buồng Lái & 3 Trang Bị" },
      { id: "inventory", label: "Kho Vật Phẩm & Tái Chế" },
      { id: "enhance", label: "Xưởng Cường Hóa (+1..+10)" },
    ],
  },
]

// Nhóm tác chiến mở rộng (Fleet Operations)
const OPERATION_SECTIONS: { id: StarfrontSection; label: string; icon: typeof Rocket }[] = [
  { id: "fleet", label: "Hạm Đội Chiến Hạm", icon: Rocket },
  { id: "base", label: "Căn Cứ Hậu Cần", icon: Warehouse },
  { id: "war", label: "Phòng Tác Chiến", icon: Flag },
  { id: "pilot", label: "Hồ Sơ Phi Công", icon: UserRound },
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
    color: string
  }
> = {
  vanguard: {
    badgeBg: "bg-cyan-500/20",
    badgeText: "text-cyan-300",
    badgeBorder: "border-cyan-500/50",
    border: "border-cyan-500/40",
    glow: "shadow-[0_0_12px_rgba(6,182,212,0.3)]",
    accent: "text-cyan-400",
    color: "#06b6d4",
  },
  falcon: {
    badgeBg: "bg-purple-500/20",
    badgeText: "text-purple-300",
    badgeBorder: "border-purple-500/50",
    border: "border-purple-500/40",
    glow: "shadow-[0_0_12px_rgba(168,85,247,0.3)]",
    accent: "text-purple-400",
    color: "#a855f7",
  },
  aegis: {
    badgeBg: "bg-amber-500/20",
    badgeText: "text-amber-300",
    badgeBorder: "border-amber-500/50",
    border: "border-amber-500/40",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.3)]",
    accent: "text-amber-400",
    color: "#f59e0b",
  },
}

export function StarfrontShell() {
  const [progression, setProgression] = useState<StarfrontProgression>(INITIAL_STARFRONT_PROGRESSION)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [activeSection, setActiveSection] = useState<StarfrontSection>("home")
  const [activeCampaignMission, setActiveCampaignMission] = useState<CampaignMission | null>(null)
  const [audioMuted, setAudioMutedState] = useState(false)
  const [lockNoticeToast, setLockNoticeToast] = useState<{ text: string; type: "warning" | "success" } | null>(null)

  // Trạng thái khóa nhân vật & cơ giáp
  const isCharacterLocked = Boolean(progression.activePairing?.isLocked)

  // Quản lý trạng thái thanh điều hướng bên trái (Left Sidebar)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    hangar: true,
    missions: true,
  })
  const [showOperationsGroup, setShowOperationsGroup] = useState(false)

  // Khởi tạo và nạp dữ liệu từ LocalStorage
  useEffect(() => {
    const saved = loadStarfrontProgression()
    setProgression(saved)
    setHasLoaded(true)
    setAudioMutedState(isAudioMuted())

    // Nếu người chơi chưa khóa nhân vật & cơ giáp, mở ngay màn hình chọn nhân vật
    if (!saved.activePairing?.isLocked) {
      setActiveSection("character-gear")
    }
  }, [])

  // Lưu tự động mỗi khi có thay đổi tiến trình
  const handleUpdateProgression = (updated: StarfrontProgression) => {
    // Nếu vừa mới khóa nhân vật thành công, hiển thị thông báo chúc mừng
    if (!progression.activePairing?.isLocked && updated.activePairing?.isLocked) {
      setLockNoticeToast({
        type: "success",
        text: "🎉 ĐÃ KHÓA TỔ HỢP XUẤT KÍCH THÀNH CÔNG! Toàn bộ phân hệ Đấu Trường, Nhiệm Vụ, Hangar và Chợ Quân Sự đã được kích hoạt!",
      })
      setTimeout(() => setLockNoticeToast(null), 5000)
    }

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

  // Chuyển phân hệ chính
  const handleSwitchSection = (section: StarfrontSection, forceMission?: CampaignMission | null) => {
    playClickSound()

    // Kiểm tra quy định: Bắt buộc khóa nhân vật trước khi làm nhiệm vụ hoặc tham chiến
    const requiresLock = section !== "character-gear" && section !== "home"
    if (!isCharacterLocked && requiresLock) {
      setLockNoticeToast({
        type: "warning",
        text: "⚠️ BẮT BUỘC: Bạn cần chọn và KHÓA NHÂN VẬT & CƠ GIÁP trước khi vào phân hệ này!",
      })
      setActiveSection("character-gear")
      setMobileMenuOpen(false)
      setTimeout(() => setLockNoticeToast(null), 4000)
      return
    }

    if (section === "battlefield") {
      if (forceMission !== undefined) {
        setActiveCampaignMission(forceMission)
      } else if (!activeCampaignMission) {
        const autoMission = getCurrentOrNextCampaignMission(progression, null)
        setActiveCampaignMission(autoMission)
      }
    }
    setActiveSection(section)
    setMobileMenuOpen(false)
  }

  // Đóng/Mở submenu
  const toggleSubmenu = (sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    playClickSound()
    setExpandedMenus((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  // Xuất kích từ Bản đồ nhiệm vụ sang Đấu trường
  const handleDeployMission = (mission: CampaignMission) => {
    playClickSound()
    setActiveCampaignMission(mission)
    setActiveSection("battlefield")
    setMobileMenuOpen(false)
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

  const activeSectionConfig =
    SECTIONS.find((s) => s.id === activeSection) ||
    OPERATION_SECTIONS.find((s) => s.id === activeSection) ||
    SECTIONS[0]

  return (
    <GameProvider>
      <div className="flex min-h-screen bg-background text-foreground antialiased selection:bg-cyan-500 selection:text-black">
        {/* ==================================================================
            1. THANH ĐIỀU HƯỚNG BÊN TRÁI CỐ ĐỊNH (PERSISTENT LEFT SIDEBAR)
            ================================================================== */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border/70 bg-panel/95 backdrop-blur-md transition-all duration-300",
            isSidebarCollapsed ? "w-16" : "w-64 sm:w-72",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          {/* A. Header Sidebar: Logo STARFRONT & Tên Thương Hiệu (Click về Home) */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-3">
            <button
              onClick={() => handleSwitchSection("home")}
              className="flex items-center gap-2.5 overflow-hidden text-left cursor-pointer group"
              title="Về trang Tổng quan STARFRONT"
            >
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-sm border p-1 transition-transform group-hover:scale-105"
                style={{
                  borderColor: activeGearDef.color,
                  backgroundColor: `${activeGearDef.color}20`,
                }}
              >
                <img
                  src={activeGearDef.illustration || `/images/${activeGearId}.svg`}
                  alt={activeGearDef.name}
                  className="size-full object-contain filter drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                />
              </div>

              {!isSidebarCollapsed && (
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="flex items-center gap-1.5 font-display text-base font-black tracking-wider text-white group-hover:text-cyan-300 transition-colors">
                    <span>STARFRONT</span>
                    <span className="rounded bg-cyan-500/20 px-1 py-0.2 font-mono text-[9px] font-bold text-cyan-300 border border-cyan-500/40">
                      v3.2
                    </span>
                  </div>
                  <div className="truncate text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    Tactical 2D Sci-Fi RPG
                  </div>
                </div>
              )}
            </button>

            {/* Nút Thu nhỏ / Mở rộng Sidebar trên Desktop */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden size-7 shrink-0 items-center justify-center rounded border border-border/50 text-muted-foreground hover:text-white hover:border-cyan-400 transition-colors lg:flex cursor-pointer"
              title={isSidebarCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>

            {/* Nút đóng trên Mobile */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex size-7 shrink-0 items-center justify-center rounded border border-border/50 text-muted-foreground hover:text-white lg:hidden cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* B. Tiện ích Phi Công & Cơ Giáp Đang Chọn (Commander Mini Card) */}
          {!isSidebarCollapsed ? (
            <div className="border-b border-border/50 p-3 bg-black/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: activeGearDef.color }}
                  />
                  <span>{activeGearDef.name}</span>
                </div>
                <span className="rounded bg-cyan-500/20 px-1.5 py-0.2 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-500/40">
                  CẤP {progression.level}
                </span>
              </div>

              {/* Thanh EXP nhỏ */}
              <div className="mt-2">
                <div className="mb-0.5 flex justify-between font-mono text-[10px] text-muted-foreground">
                  <span>EXP</span>
                  <span>{progression.exp}/{expRequired} ({expPct}%)</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-xs bg-secondary">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-300"
                    style={{ width: `${expPct}%` }}
                  />
                </div>
              </div>

              {/* Ngân sách Tín Dụng & Hợp Kim */}
              <div className="mt-2.5 flex items-center justify-between font-mono text-[11px] text-muted-foreground border-t border-border/40 pt-2">
                <div className="flex items-center gap-1 text-amber-300">
                  <Coins className="size-3 text-amber-400" />
                  <span>{progression.credits.toLocaleString("vi-VN")}</span>
                </div>
                <div className="flex items-center gap-1 text-purple-300">
                  <Layers className="size-3 text-purple-400" />
                  <span>{alloyCount} Alloy</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-b border-border/50 p-2 flex flex-col items-center gap-1 bg-black/40">
              <span className="rounded px-1 font-mono text-[9px] font-bold text-cyan-300">
                Lv.{progression.level}
              </span>
            </div>
          )}

          {/* C. Danh Mục Các Phân Hệ Chính (Primary Navigation Items & Submenus) */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-1">
            {!isSidebarCollapsed && (
              <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground/80">
                Menu Tác Chiến Chính
              </div>
            )}

            {SECTIONS.map((sec) => {
              const Icon = sec.icon
              const isActive = activeSection === sec.id
              const requiresLock = sec.id !== "character-gear" && sec.id !== "home"
              const isTabLocked = !isCharacterLocked && requiresLock
              const badgeText = isTabLocked ? "Khóa" : sec.badge ? sec.badge(progression) : null
              const submenus = sec.submenus ? sec.submenus(progression) : []
              const hasSubmenus = !isTabLocked && submenus.length > 0 && !isSidebarCollapsed
              const isExpanded = expandedMenus[sec.id] || false

              return (
                <div key={sec.id} className="space-y-0.5">
                  <div
                    onClick={() => handleSwitchSection(sec.id)}
                    className={cn(
                      "group relative flex items-center justify-between rounded-sm px-2.5 py-2 font-display text-xs uppercase tracking-wider transition-all cursor-pointer",
                      isActive
                        ? "bg-cyan-500/15 text-cyan-300 border-l-2 border-cyan-400 font-bold shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                        : isTabLocked
                          ? "text-muted-foreground/60 hover:text-amber-300 hover:bg-amber-950/20"
                          : "text-muted-foreground hover:bg-secondary/40 hover:text-white",
                    )}
                    title={isSidebarCollapsed ? (isTabLocked ? `[Khóa] Cần khóa NV trước: ${sec.label}` : sec.label) : undefined}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isTabLocked ? (
                        <Lock className="size-4 shrink-0 text-amber-400/80 group-hover:text-amber-300" />
                      ) : (
                        <Icon className={cn("size-4 shrink-0", isActive ? "text-cyan-400" : "text-muted-foreground group-hover:text-cyan-300")} />
                      )}
                      {!isSidebarCollapsed && (
                        <span className={cn("truncate", isTabLocked && "text-muted-foreground/80")}>{sec.shortLabel}</span>
                      )}
                    </div>

                    {!isSidebarCollapsed && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {badgeText && (
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.2 font-mono text-[9px] font-bold border",
                              isTabLocked
                                ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                                : "bg-black/60 text-cyan-300 border-border/50",
                            )}
                          >
                            {badgeText}
                          </span>
                        )}

                        {hasSubmenus && (
                          <button
                            onClick={(e) => toggleSubmenu(sec.id, e)}
                            className="size-5 flex items-center justify-center rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors cursor-pointer"
                          >
                            <ChevronDown
                              className={cn(
                                "size-3 transition-transform duration-200",
                                isExpanded ? "rotate-0" : "-rotate-90",
                              )}
                            />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cây Submenu Mở Rộng */}
                  {hasSubmenus && isExpanded && (
                    <div className="ml-5 pl-2 border-l border-border/50 space-y-0.5 py-0.5">
                      {submenus.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            playClickSound()
                            if (sec.id === "battlefield") {
                              if (sub.id === "campaign") {
                                const autoMission = getCurrentOrNextCampaignMission(progression, null)
                                setActiveCampaignMission(autoMission)
                              } else if (sub.id === "arena") {
                                setActiveCampaignMission(null)
                              }
                            }
                            setActiveSection(sec.id)
                            setMobileMenuOpen(false)
                          }}
                          className={cn(
                            "w-full flex items-center justify-between rounded px-2 py-1 text-left font-mono text-[11px] transition-colors cursor-pointer",
                            isActive
                              ? "text-cyan-300 hover:text-white hover:bg-cyan-950/40"
                              : "text-muted-foreground hover:text-white hover:bg-secondary/30",
                          )}
                        >
                          <span className="truncate">{sub.label}</span>
                          {sub.badge && (
                            <span className="rounded bg-red-500/20 px-1 text-[8px] font-bold text-red-300 border border-red-500/40">
                              {sub.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* D. Nhóm Phân Hệ Mở Rộng: Hạm Đội & Căn Cứ Hậu Cần */}
            <div className="pt-3 border-t border-border/50">
              {!isSidebarCollapsed ? (
                <button
                  onClick={() => setShowOperationsGroup(!showOperationsGroup)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground hover:text-white transition-colors cursor-pointer"
                >
                  <span>Căn Cứ & Hạm Đội</span>
                  <ChevronDown
                    className={cn(
                      "size-3 transition-transform duration-200",
                      showOperationsGroup ? "rotate-0" : "-rotate-90",
                    )}
                  />
                </button>
              ) : null}

              {(showOperationsGroup || isSidebarCollapsed) && (
                <div className="space-y-0.5 mt-1">
                  {OPERATION_SECTIONS.map((op) => {
                    const OpIcon = op.icon
                    const isOpActive = activeSection === op.id
                    return (
                      <button
                        key={op.id}
                        onClick={() => handleSwitchSection(op.id)}
                        className={cn(
                          "w-full flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 font-display text-[11px] uppercase tracking-wider transition-colors cursor-pointer",
                          isOpActive
                            ? "bg-purple-500/20 text-purple-300 border-l-2 border-purple-400 font-bold"
                            : !isCharacterLocked
                              ? "text-muted-foreground/60 hover:text-amber-300 hover:bg-amber-950/20"
                              : "text-muted-foreground hover:bg-secondary/40 hover:text-white",
                        )}
                        title={isSidebarCollapsed ? (!isCharacterLocked ? `[Khóa] ${op.label}` : op.label) : undefined}
                      >
                        {!isCharacterLocked ? (
                          <Lock className="size-3.5 shrink-0 text-amber-400/80" />
                        ) : (
                          <OpIcon className="size-3.5 shrink-0" />
                        )}
                        {!isSidebarCollapsed && <span className="truncate">{op.label}</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* E. Footer Sidebar: Âm Thanh, Cài Lại & Thông Tin */}
          <div className="shrink-0 border-t border-border/60 p-2.5 bg-black/50 space-y-2">
            <div className="flex items-center justify-between gap-1">
              <button
                onClick={handleToggleAudio}
                className={cn(
                  "flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] font-mono transition-colors cursor-pointer",
                  audioMuted
                    ? "border-red-500/40 text-red-300 bg-red-950/30"
                    : "border-cyan-500/40 text-cyan-300 bg-cyan-950/30 hover:bg-cyan-950/50",
                )}
                title={audioMuted ? "Bật âm thanh hiệu ứng" : "Tắt âm thanh hiệu ứng"}
              >
                {audioMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                {!isSidebarCollapsed && (
                  <span>{audioMuted ? "Tắt Âm" : "Âm Thanh"}</span>
                )}
              </button>

              {!isSidebarCollapsed && (
                <button
                  onClick={handleResetSave}
                  className="rounded border border-border/60 px-2 py-1 text-[10px] font-mono text-muted-foreground hover:text-red-400 hover:border-red-500/50 transition-colors cursor-pointer"
                  title="Cài lại tiến trình LocalStorage"
                >
                  Reset Save
                </button>
              )}
            </div>

            {!isSidebarCollapsed && (
              <div className="text-[9px] font-mono text-muted-foreground/70 leading-tight">
                STARFRONT Phase 5 // Turn-Based Combat & Unified Systems
              </div>
            )}
          </div>
        </aside>

        {/* Lớp mờ Overlay khi mở menu trên Mobile */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-30 bg-black/80 backdrop-blur-xs lg:hidden"
          />
        )}

        {/* ==================================================================
            2. KHU VỰC NỘI DUNG CHÍNH BÊN PHẢI (MAIN CONTENT AREA ON THE RIGHT)
            ================================================================== */}
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col transition-all duration-300",
            isSidebarCollapsed ? "lg:pl-16" : "lg:pl-64 sm:lg:pl-72",
          )}
        >
          {/* A. Compact Top Bar: Tiêu đề phân hệ & Nút Mobile Menu */}
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-panel/90 px-4 py-2 backdrop-blur-md">
            {/* Trái: Nút Hamburger Mobile & Breadcrumb Phân Hệ */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex size-8 items-center justify-center rounded border border-border/60 text-muted-foreground hover:text-white lg:hidden cursor-pointer"
                title="Mở thanh điều hướng"
              >
                <Menu className="size-4" />
              </button>

              <div className="flex items-center gap-2">
                <span className="font-display text-xs font-black tracking-wider text-cyan-400 uppercase">
                  STARFRONT
                </span>
                <span className="text-muted-foreground text-xs font-mono">/</span>
                <span className="font-display text-xs font-bold uppercase tracking-wider text-white">
                  {activeSectionConfig.label}
                </span>
              </div>
            </div>

            {/* Phải: Huy hiệu Cơ giáp & Tài nguyên Nhanh */}
            <div className="flex items-center gap-2 font-mono text-xs">
              {/* Huy hiệu Cặp Đôi Phi Công & Cơ Giáp */}
              <div
                onClick={() => handleSwitchSection("character-gear")}
                className="hidden sm:flex items-center gap-1.5 rounded border px-2.5 py-1 cursor-pointer transition-colors hover:bg-black/40"
                style={{
                  borderColor: `${activeGearDef.color}60`,
                  backgroundColor: `${activeGearDef.color}15`,
                }}
                title="Quản lý Nhân Vật & Cơ Giáp (Phase 5.8)"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: activeGearDef.color }}
                />
                <span className="font-bold text-white">
                  {STARFRONT_PILOT_MAP[progression.activePairing?.pilotId || "marcus"]?.name.split(" ")[0] || "Marcus"} · {activeGearDef.name}
                </span>
                <span className="text-[10px] text-muted-foreground">· Cấp {progression.level}</span>
              </div>

              {/* Credits */}
              <div className="flex items-center gap-1 rounded bg-amber-950/30 border border-amber-500/40 px-2 py-1 text-amber-300">
                <Coins className="size-3 text-amber-400" />
                <span className="font-bold">{progression.credits.toLocaleString("vi-VN")}</span>
              </div>

              {/* Alloy */}
              <div className="hidden md:flex items-center gap-1 rounded bg-purple-950/30 border border-purple-500/40 px-2 py-1 text-purple-300">
                <Layers className="size-3 text-purple-400" />
                <span className="font-bold">{alloyCount} Alloy</span>
              </div>
            </div>
          </header>

          {/* Banner thông báo trạng thái khóa / mở khóa hệ thống */}
          {lockNoticeToast && (
            <div
              className={cn(
                "mx-3 mt-3 sm:mx-5 rounded-sm p-3 shadow-lg flex items-center justify-between gap-3 font-mono text-xs animate-in slide-in-from-top duration-200 border",
                lockNoticeToast.type === "warning"
                  ? "border-amber-500/70 bg-gradient-to-r from-amber-950/90 via-black/80 to-amber-950/70 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  : "border-emerald-500/70 bg-gradient-to-r from-emerald-950/90 via-black/80 to-emerald-950/70 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
              )}
            >
              <div className="flex items-center gap-2.5">
                {lockNoticeToast.type === "warning" ? (
                  <AlertTriangle className="size-4 text-amber-400 shrink-0 animate-pulse" />
                ) : (
                  <Sparkles className="size-4 text-emerald-400 shrink-0 animate-pulse" />
                )}
                <span className="font-semibold text-white">{lockNoticeToast.text}</span>
              </div>
              <button
                onClick={() => setLockNoticeToast(null)}
                className="text-muted-foreground hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
                title="Đóng thông báo"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* B. Banner Nhiệm Vụ Chiến Dịch Đang Chọn (Nếu Người Chơi Xuất Kích Từ Bản Đồ) */}
          {activeCampaignMission && (
            <div className="mx-3 mt-3 sm:mx-5 rounded-sm border border-amber-500/60 bg-gradient-to-r from-amber-950/60 via-panel to-amber-950/40 p-2.5 shadow-lg flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-400 animate-pulse shrink-0" />
                <div>
                  <span className="text-amber-300 font-bold uppercase">
                    NHIỆM VỤ ĐANG THỰC HIỆN: {activeCampaignMission.title}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    ({activeCampaignMission.sectorName} · Cấp khuyến nghị {activeCampaignMission.recommendedLevel}+)
                  </span>
                </div>
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

          {/* C. Nội Dung Phân Hệ Đang Chọn */}
          <main className="min-w-0 flex-1 p-3 sm:p-5">
            {/* Phân hệ 1: Tổng Quan (Home) */}
            {activeSection === "home" && (
              <StarfrontHome
                progression={progression}
                onNavigate={(target) => handleSwitchSection(target)}
                onSelectGear={handleSelectGear}
              />
            )}

            {/* Phân hệ: Nhân Vật & Cơ Giáp (Character & Gear - Phase 5.8) */}
            {activeSection === "character-gear" && (
              <CharacterGearSelect
                progression={progression}
                onUpdateProgression={handleUpdateProgression}
                onNavigateToHangar={() => handleSwitchSection("hangar")}
                onNavigateToCombat={() => handleSwitchSection("battlefield")}
                onEquipItem={handleEquipItem}
                onUnequipSlot={handleUnequipSlot}
              />
            )}

            {/* Phân hệ 2: Đấu Trường (Battlefield) */}
            {activeSection === "battlefield" && (
              <CombatArena
                progression={progression}
                onUpdateProgression={handleUpdateProgression}
                activeCampaignMission={activeCampaignMission}
                onClearCampaignMission={handleClearMission}
                onSelectCampaignMission={setActiveCampaignMission}
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
                onNavigateToCharacterGear={() => handleSwitchSection("character-gear")}
                onNavigateToCombat={() => handleSwitchSection("battlefield")}
              />
            )}

            {/* Phân hệ Mở Rộng: Hạm Đội */}
            {activeSection === "fleet" && <FleetPanel />}

            {/* Phân hệ Mở Rộng: Căn Cứ Hậu Cần */}
            {activeSection === "base" && <BasePanel />}

            {/* Phân hệ Mở Rộng: Phòng Tác Chiến */}
            {activeSection === "war" && <WarRoom />}

            {/* Phân hệ Mở Rộng: Hồ Sơ Phi Công */}
            {activeSection === "pilot" && <PilotPanel />}
          </main>
        </div>
      </div>
    </GameProvider>
  )
}
