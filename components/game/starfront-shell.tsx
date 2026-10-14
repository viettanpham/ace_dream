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
  applyUiScale,
  getSavedUiScale,
  getSavedScanlineOverlay,
  getSavedScanlineBeam,
  getSavedVignette,
  getSavedCornerBrackets,
  saveCrtSettings,
} from "@/lib/game/ui-settings"
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
  isSelectionMandatory,
  isValidPilotGearSelection,
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
  Flame,
  Globe2,
  Hammer,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Lock,
  Menu,
  Orbit,
  PanelLeftClose,
  PanelLeftOpen,
  Radar,
  Radio,
  Recycle,
  Rocket,
  Scan,
  Shield,
  ShieldAlert,
  ShoppingBag,
  Sliders,
  Sparkles,
  Swords,
  Terminal,
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
import { StarfrontHangar, type HangarTab } from "./starfront-hangar"
import { CharacterGearSelect } from "./character-gear-select"
import { STARFRONT_PILOT_MAP } from "@/lib/game/data"

// Các phân hệ tác chiến bổ trợ (Fleet & Base Operations)
import { GameProvider } from "@/lib/game/store"
import { FleetPanel } from "./fleet-panel"
import { BasePanel } from "./base-panel"
import { WarRoom } from "./war-room"
import { PilotPanel } from "./pilot-panel"
import { PilotStatusDashboard } from "./pilot-status-dashboard"
import { MapPanel } from "./map-panel"
import { PilotGallery } from "./pilot-gallery"
import { MissionLog } from "./mission-log"
import { FullMissionLogView } from "./full-mission-log-view"
import { TopShipIntegrityBar } from "./top-ship-integrity-bar"
import { OperationsCenter } from "./world/operations-center"
import { CombatV2Dashboard } from "./world/combat-v2"
import { convertWorldBattleContextToCombatV2Snapshot } from "@/lib/game/world/combat-v2-adapter-bridge"
import type { WorldBattleContext } from "@/lib/game/world/types"
import { loadWorldState } from "@/lib/game/world/storage"
import { GlobalSettingsModal, type GlobalSettingsState } from "./global-settings-modal"

export type StarfrontSection =
  | "home"
  | "world"
  | "character-gear"
  | "gallery"
  | "battlefield"
  | "missions"
  | "mission-logs"
  | "shop"
  | "hangar"
  | "fleet"
  | "base"
  | "war"
  | "pilot"

interface SubMenuItem {
  id: string
  label: string
  icon?: typeof Boxes
  action?: () => void
  badge?: string
}

interface SectionConfig {
  id: StarfrontSection
  label: string
  shortLabel: string
  icon: typeof Rocket
  group?: "strategic" | "tactical" | "armory"
  badge?: (prog: StarfrontProgression) => string | null
  submenus?: (prog: StarfrontProgression, onSelectSubmenu?: (subId: string) => void) => SubMenuItem[]
}

// Cấu hình 3 tầng chỉ huy (Command Tier Architecture) từ Blueprint Phase 6.16/6.17
const COMMAND_TIERS: {
  id: "strategic" | "tactical" | "armory"
  label: string
  shortLabel: string
  badge?: string
}[] = [
  {
    id: "strategic",
    label: "Khối 1: Tổng Hành Dinh Chiến Lược",
    shortLabel: "Chiến Lược",
    badge: "Galaxy Hub",
  },
  {
    id: "tactical",
    label: "Khối 2: Buồng Lái & Tác Chiến",
    shortLabel: "Buồng Lái",
  },
  {
    id: "armory",
    label: "Khối 3: Hậu Phương & Khí Tài",
    shortLabel: "Hậu Phương",
  },
]

const SECTIONS: SectionConfig[] = [
  // =========================================================================
  // KHỐI 1: TỔNG HÀNH DINH CHIẾN LƯỢC (STRATEGIC COMMAND HUB)
  // =========================================================================
  {
    id: "world",
    label: "★ CHIẾN TRƯỜNG THIÊN HÀ // WORLD",
    shortLabel: "Chiến Trường WORLD",
    icon: Orbit,
    group: "strategic",
    badge: () => "LIVE GALAXY",
    submenus: () => [
      { id: "map", label: "War Room // Bản Đồ Chiến Lược" },
      { id: "overview", label: "Tình Hình Toàn Cảnh" },
      { id: "events", label: "Sự Kiện & Nhiệm Vụ" },
      { id: "military", label: "Quân Sự & Hậu Cần" },
      { id: "results", label: "Trung Tâm Kết Quả" },
    ],
  },
  {
    id: "home",
    label: "STARFRONT / Tổng Quan Tác Chiến",
    shortLabel: "Tổng Quan Console",
    icon: LayoutDashboard,
    group: "strategic",
    submenus: () => [
      { id: "overview", label: "Bảng Chỉ Huy Tác Chiến" },
      { id: "gears", label: "Hồ Sơ 3 Lớp Cơ Giáp" },
    ],
  },

  // =========================================================================
  // KHỐI 2: BUỒNG LÁI & TÁC CHIẾN CÁ NHÂN (TACTICAL MECHA COMBAT)
  // =========================================================================
  {
    id: "battlefield",
    label: "Đấu Trường Cơ Giáp",
    shortLabel: "Đấu Trường 2D",
    icon: Swords,
    group: "tactical",
    submenus: (p) => [
      { id: "arena", label: "Đấu Trường Cơ Giáp" },
      { id: "combat-log", label: "Nhật Ký Tác Chiến" },
      ...(p.activeQuest ? [{ id: "active-quest", label: "Nhiệm Vụ Đang Thực Hiện", badge: "Live" }] : []),
    ],
  },
  {
    id: "character-gear",
    label: "Nhân Vật & Cơ Giáp",
    shortLabel: "Phi Công & Gear",
    icon: Users,
    group: "tactical",
    badge: (p) => {
      const pilotId = p.activePairing?.pilotId || "marcus"
      const gearId = p.activePairing?.gearId || p.activeGearId || "vanguard"
      const pName = STARFRONT_PILOT_MAP[pilotId]?.name.split(" ")[0] || "Marcus"
      const gName = (gearId.charAt(0).toUpperCase() + gearId.slice(1))
      return `${pName}/${gName}`
    },
    submenus: () => [
      { id: "pair-flow", label: "Ghép Đôi 3 Bước" },
      { id: "pilot-list", label: "8 Hồ Sơ Phi Công" },
      { id: "gear-list", label: "3 Lớp Cơ Giáp" },
    ],
  },
  {
    id: "gallery",
    label: "Bộ Sưu Tập Phi Công // ART GALLERY",
    shortLabel: "Pilot Art Gallery",
    icon: Sparkles,
    group: "tactical",
    badge: () => "16 Art",
    submenus: () => [
      { id: "all-art", label: "8 Cặp Đôi (16 Tác Phẩm)" },
      { id: "portraits", label: "8 Chân Dung 1:1" },
      { id: "fullbody", label: "8 Toàn Thân 9:16" },
      { id: "inspector", label: "Soi Chi Tiết Từng Phi Công" },
    ],
  },

  // =========================================================================
  // KHỐI 3: HẬU PHƯƠNG, KHÍ TÀI & CHIẾN DỊCH (BASE, ARMORY & CAMPAIGN)
  // =========================================================================
  {
    id: "hangar",
    label: "Hangar & Kho Đồ",
    shortLabel: "Hangar & Kho",
    icon: Boxes,
    group: "armory",
    badge: (p) => `${p.inventory.length}`,
    submenus: (p) => [
      { id: "loadout", label: "Buồng Lái & Trang Bị", icon: Cpu },
      { id: "skills", label: "Mô Đun Kỹ Năng", icon: Flame, badge: "5 Ô" },
      { id: "inventory", label: "Kho Đồ & Tái Chế", icon: Boxes, badge: `${p.inventory.length}` },
      { id: "enhancement", label: "Xưởng Cường Hóa", icon: Hammer, badge: "+1..+10" },
    ],
  },
  {
    id: "shop",
    label: "Chợ Quân Sự & Tiếp Tế",
    shortLabel: "Chợ Quân Sự",
    icon: ShoppingBag,
    group: "armory",
    badge: (p) => (p.freeShopRefreshes && p.freeShopRefreshes > 0 ? `${p.freeShopRefreshes} Free` : null),
    submenus: () => [
      { id: "armory", label: "Kho Vũ Khí & Trang Bị" },
      { id: "refresh", label: "Làm Mới Hàng Hóa" },
    ],
  },
  {
    id: "missions",
    label: "Nhiệm Vụ Chiến Dịch Cốt Truyện (RPG)",
    shortLabel: "Chiến Dịch RPG (12 M)",
    icon: Globe2,
    group: "armory",
    badge: (p) => `${p.completedMissions.length}/12`,
    submenus: () => [
      { id: "sectors", label: "Bản Đồ 4 Sector Vũ Trụ" },
      { id: "side-quests", label: "Nhiệm Vụ Phụ Tuyến" },
      { id: "full-logs", label: "Xem Full Logs (Tùy Chỉnh)", icon: Terminal, badge: "Full" },
    ],
  },
  {
    id: "mission-logs",
    label: "Nhật Ký Tác Chiến // Full Logs",
    shortLabel: "Full Mission Logs",
    icon: Terminal,
    group: "armory",
    badge: () => "Logs",
  },
]

// Nhóm tác chiến mở rộng (Fleet Operations)
const OPERATION_SECTIONS: { id: StarfrontSection; label: string; icon: typeof Rocket }[] = [
  { id: "pilot", label: "Pilot Status / Phi Công", icon: UserRound },
  { id: "fleet", label: "Hạm Đội Chiến Hạm", icon: Rocket },
  { id: "base", label: "Căn Cứ Hậu Cần", icon: Warehouse },
  { id: "war", label: "Phòng Tác Chiến", icon: Flag },
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
  const [activeWorldBattle, setActiveWorldBattle] = useState<WorldBattleContext | null>(null)
  const [audioMuted, setAudioMutedState] = useState(true)
  const [scanlineEnabled, setScanlineEnabled] = useState(false)
  const [scanlineBeamEnabled, setScanlineBeamEnabled] = useState(false)
  const [vignetteEnabled, setVignetteEnabled] = useState(false)
  const [cornerBracketsEnabled, setCornerBracketsEnabled] = useState(false)
  const [uiScale, setUiScale] = useState(100)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [lockNoticeToast, setLockNoticeToast] = useState<{ text: string; type: "warning" | "success" } | null>(null)

  // Trạng thái ghép đôi và khóa nhân vật & cơ giáp (Phase 5.11)
  const hasValidSelection = isValidPilotGearSelection(progression)
  const isCharacterLocked = Boolean(progression.activePairing?.isLocked)
  const [pendingSectionAfterSelection, setPendingSectionAfterSelection] = useState<StarfrontSection | null>(null)
  const [mandatoryModalOpen, setMandatoryModalOpen] = useState(false)

  // Quản lý trạng thái thanh điều hướng bên trái (Left Sidebar)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeHangarTab, setActiveHangarTab] = useState<HangarTab>("loadout")
  const [activeWorldTab, setActiveWorldTab] = useState<"overview" | "map" | "sectors" | "events" | "military" | "results">("map")
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    world: true,
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

    try {
      const savedScanline = getSavedScanlineOverlay()
      setScanlineEnabled(savedScanline)
      const savedBeam = getSavedScanlineBeam()
      setScanlineBeamEnabled(savedBeam)
      const savedVignette = getSavedVignette()
      setVignetteEnabled(savedVignette)
      const savedBrackets = getSavedCornerBrackets()
      setCornerBracketsEnabled(savedBrackets)

      const savedScale = getSavedUiScale()
      setUiScale(savedScale)
      applyUiScale(savedScale)
    } catch {
      // ignore local storage errors
    }

    // Phase 6.23: Kiểm tra trận chiến treo từ STARFRONT WORLD
    try {
      const worldRes = loadWorldState()
      if (worldRes.state.isSuspendedCombat && worldRes.state.suspendedSnapshot) {
        const snap = worldRes.state.suspendedSnapshot
        setActiveWorldBattle({
          source: "WORLD",
          transactionId: snap.transactionId,
          encounterId: snap.encounterId,
          sectorId: snap.sectorId,
          sectorName: snap.sectorName,
          snapshot: snap,
          resumedFromSuspended: true,
        })
      }
    } catch {
      // ignore
    }

    // Phase 5.11: Nếu chưa có lựa chọn Phi Công & Cơ Giáp hợp lệ, yêu cầu bắt buộc chọn
    if (!isValidPilotGearSelection(saved)) {
      setActiveSection("character-gear")
      setMandatoryModalOpen(true)
    }
  }, [])

  // Chuyển đổi bật/tắt hiệu ứng quét màn hình (CRT Scanline)
  const handleToggleScanline = () => {
    playClickSound()
    setScanlineEnabled((prev) => {
      const next = !prev
      saveCrtSettings({ scanlineOverlay: next })
      return next
    })
  }

  const handleUpdateGlobalSettings = (s: GlobalSettingsState) => {
    setAudioMutedState(s.audioMuted)
    setScanlineEnabled(s.scanlineOverlay)
    setScanlineBeamEnabled(s.scanlineBeam)
    setVignetteEnabled(s.vignette)
    setCornerBracketsEnabled(s.cornerBrackets)
    setUiScale(s.uiScale)
    applyUiScale(s.uiScale)
  }

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

    // Nếu vừa hoàn thành lựa chọn hợp lệ từ flow bắt buộc, đóng modal và chuyển đến phân hệ dự định
    if (isValidPilotGearSelection(updated)) {
      setMandatoryModalOpen(false)
      if (pendingSectionAfterSelection) {
        const nextTarget = pendingSectionAfterSelection
        setPendingSectionAfterSelection(null)
        setTimeout(() => setActiveSection(nextTarget), 300)
      }
    }
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

    // Phase 5.11: Bắt buộc chọn Phi Công & Cơ Giáp hợp lệ trước khi vào phân hệ tác chiến
    const requiresSelection = section !== "character-gear" && section !== "home" && section !== "pilot"
    if (!hasValidSelection && requiresSelection) {
      setPendingSectionAfterSelection(section)
      setMandatoryModalOpen(true)
      setActiveSection("character-gear")
      setMobileMenuOpen(false)
      setLockNoticeToast({
        type: "warning",
        text: "⚠️ BẮT BUỘC: Bạn cần hoàn tất CHỌN PHI CÔNG & CƠ GIÁP trước khi vào phân hệ này!",
      })
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

  // Phase 6.33_FIX5: Entry point mở nhanh WORLD ADMIN CP từ Top Menu & Left Menu
  const [worldAdminTrigger, setWorldAdminTrigger] = useState<number>(0)
  const handleOpenWorldAdminCp = () => {
    playClickSound()
    setActiveSection("world")
    setActiveWorldTab("admin" as any)
    setWorldAdminTrigger(Date.now())
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

  // Chọn submenu để điều hướng chuyên sâu (bao gồm 4 phân hệ Hangar & Kho)
  const handleSelectSubmenu = (sectionId: StarfrontSection, subId: string) => {
    playClickSound()
    if (sectionId === "world") {
      setActiveWorldTab(subId as any)
    } else if (sectionId === "hangar") {
      const targetTab = (subId === "enhance" ? "enhancement" : subId) as HangarTab
      setActiveHangarTab(targetTab)
    } else if (sectionId === "missions" && subId === "full-logs") {
      handleSwitchSection("mission-logs")
      setMobileMenuOpen(false)
      return
    } else if (sectionId === "battlefield") {
      if (subId === "campaign") {
        const autoMission = getCurrentOrNextCampaignMission(progression, null)
        setActiveCampaignMission(autoMission)
      } else if (subId === "arena") {
        setActiveCampaignMission(null)
      }
    }
    handleSwitchSection(sectionId)
    setMobileMenuOpen(false)
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

  // Reset tiến trình (Phase 5.11: Đưa về trạng thái chưa có ghép đôi và mở flow bắt buộc)
  const handleResetSave = () => {
    playClickSound()
    const fresh = resetStarfrontProgression()
    setProgression(fresh)
    setActiveCampaignMission(null)
    setPendingSectionAfterSelection(null)
    setActiveSection("character-gear")
    setMandatoryModalOpen(true)
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
      <div
        className="flex min-h-screen bg-background text-foreground antialiased selection:bg-cyan-500 selection:text-black"
      >
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
                    <span className="rounded bg-cyan-500/20 px-1 py-0.2 font-mono text-xs font-bold text-cyan-300 border border-cyan-500/40">
                      v3.2
                    </span>
                  </div>
                  <div className="truncate text-xs font-mono text-muted-foreground uppercase tracking-widest">
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
                <span className="rounded bg-cyan-500/20 px-1.5 py-0.2 font-mono text-xs font-bold text-cyan-300 border border-cyan-500/40">
                  CẤP {progression.level}
                </span>
              </div>

              {/* Thanh EXP nhỏ */}
              <div className="mt-2">
                <div className="mb-0.5 flex justify-between font-mono text-xs text-muted-foreground">
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
              <div className="mt-2.5 flex items-center justify-between font-mono text-xs text-muted-foreground border-t border-border/40 pt-2">
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
              <span className="rounded px-1 font-mono text-xs font-bold text-cyan-300">
                Lv.{progression.level}
              </span>
            </div>
          )}

          {/* C. Danh Mục Các Phân Hệ Chính — Mô Hình 3 Tầng Chỉ Huy (Command Tier Architecture) */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-2">
            {/* 0. ENTRY POINT WORLD ADMIN CP Ở VỊ TRÍ TRÊN CÙNG CỦA LEFT MENU (PHASE 6.33_FIX5) */}
            <div className="pb-1 border-b border-orange-500/30">
              <button
                type="button"
                onClick={handleOpenWorldAdminCp}
                className={cn(
                  "w-full flex items-center justify-between rounded-sm px-2.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border",
                  "border-orange-500/70 bg-gradient-to-r from-orange-950/80 via-black/70 to-amber-950/70 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.2)] hover:border-orange-400 hover:text-orange-100 hover:from-orange-900/90 hover:to-amber-900/90",
                  isSidebarCollapsed && "justify-center px-1.5",
                )}
                title="Bảng Quản Trị Hệ Thống Toàn Cầu // WORLD ADMIN CP"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldAlert className="size-3.5 text-orange-400 shrink-0" />
                  {!isSidebarCollapsed && (
                    <span className="truncate tracking-wider text-orange-300 font-bold">WORLD ADMIN CP</span>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <span className="rounded bg-orange-500/20 border border-orange-500/40 px-1 py-0.2 text-[9px] text-orange-200 shrink-0">
                    ADM
                  </span>
                )}
              </button>
            </div>

            {COMMAND_TIERS.map((tier) => {
              const tierSections = SECTIONS.filter((sec) => sec.group === tier.id)
              return (
                <div key={tier.id} className="space-y-1">
                  {!isSidebarCollapsed ? (
                    <div className="flex items-center justify-between px-2 py-1 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground/80 border-b border-border/30">
                      <span>{tier.label}</span>
                      {tier.badge && (
                        <span className="rounded bg-cyan-950/80 px-1 py-0.2 text-xs font-bold text-cyan-300 border border-cyan-500/40">
                          {tier.badge}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="my-1 border-t border-border/30" />
                  )}

                  {tierSections.map((sec) => {
                    const Icon = sec.icon
                    const isActive = activeSection === sec.id
                    const isWorld = sec.id === "world"
                    const requiresSelection = sec.id !== "character-gear" && sec.id !== "home" && sec.id !== "pilot"
                    const isTabLocked = !hasValidSelection && requiresSelection
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
                              ? isWorld
                                ? "bg-cyan-500/20 text-cyan-200 border-l-2 border-cyan-400 font-bold shadow-[0_0_16px_rgba(6,182,212,0.25)] border-y border-r border-cyan-500/40"
                                : "bg-cyan-500/15 text-cyan-300 border-l-2 border-cyan-400 font-bold shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                              : isTabLocked
                                ? "text-muted-foreground/60 hover:text-amber-300 hover:bg-amber-950/20"
                                : isWorld
                                  ? "border border-cyan-500/35 bg-cyan-950/20 text-cyan-200 hover:border-cyan-400 hover:bg-cyan-950/40 shadow-[0_0_8px_rgba(6,182,212,0.1)]"
                                  : "text-muted-foreground hover:bg-secondary/40 hover:text-white",
                          )}
                          title={isSidebarCollapsed ? (isTabLocked ? `[Khóa] Cần chọn Phi Công & Cơ Giáp: ${sec.label}` : sec.label) : undefined}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isTabLocked ? (
                              <Lock className="size-4 shrink-0 text-amber-400/80 group-hover:text-amber-300" />
                            ) : (
                              <Icon className={cn("size-4 shrink-0", isActive ? "text-cyan-400" : isWorld ? "text-cyan-400 group-hover:text-cyan-300" : "text-muted-foreground group-hover:text-cyan-300")} />
                            )}
                            {!isSidebarCollapsed && (
                              <div className="flex items-center gap-1.5 truncate">
                                {isWorld && !isTabLocked && (
                                  <span className="size-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
                                )}
                                <span className={cn("truncate", isTabLocked && "text-muted-foreground/80", isWorld && "font-black tracking-wide text-cyan-200")}>
                                  {sec.shortLabel}
                                </span>
                              </div>
                            )}
                          </div>

                          {!isSidebarCollapsed && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              {badgeText && (
                                <span
                                  className={cn(
                                    "rounded px-1.5 py-0.2 font-mono text-xs font-bold border",
                                    isTabLocked
                                      ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                                      : isWorld
                                        ? "bg-cyan-950/80 text-cyan-300 border-cyan-400/60 shadow-[0_0_8px_rgba(6,182,212,0.3)] animate-pulse"
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
                            {submenus.map((sub) => {
                              const SubIcon = sub.icon
                              const isSubActive =
                                isActive &&
                                (sec.id === "world"
                                  ? activeWorldTab === sub.id || (sub.id === "map" && activeWorldTab === "sectors")
                                  : sec.id === "hangar"
                                    ? activeHangarTab === (sub.id === "enhance" ? "enhancement" : sub.id)
                                    : sec.id === "battlefield"
                                      ? (sub.id === "arena" && !activeCampaignMission) ||
                                        (sub.id === "active-quest" && !!activeCampaignMission)
                                      : false)

                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => handleSelectSubmenu(sec.id, sub.id)}
                                  className={cn(
                                    "w-full flex items-center justify-between rounded px-2 py-1.5 text-left font-mono text-xs transition-all cursor-pointer",
                                    isSubActive
                                      ? sec.id === "hangar" && sub.id === "enhancement"
                                        ? "bg-purple-500/25 text-purple-200 border-l-2 border-purple-400 pl-1.5 font-bold shadow-[0_0_10px_rgba(168,85,247,0.25)]"
                                        : "bg-cyan-500/20 text-cyan-300 border-l-2 border-cyan-400 pl-1.5 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                                      : "text-muted-foreground hover:text-white hover:bg-secondary/30",
                                  )}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {SubIcon ? (
                                      <SubIcon
                                        className={cn(
                                          "size-3 shrink-0",
                                          isSubActive
                                            ? sec.id === "hangar" && sub.id === "enhancement"
                                              ? "text-purple-400"
                                              : "text-cyan-400"
                                            : "text-muted-foreground/80",
                                        )}
                                      />
                                    ) : (
                                      <div
                                        className={cn(
                                          "size-1.5 rounded-full shrink-0",
                                          isSubActive ? "bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" : "bg-muted-foreground/40",
                                        )}
                                      />
                                    )}
                                    <span className="truncate">{sub.label}</span>
                                  </div>

                                  {sub.badge && (
                                    <span
                                      className={cn(
                                        "rounded px-1.5 py-0.2 font-mono text-xs font-bold border shrink-0",
                                        isSubActive
                                          ? "bg-cyan-400/20 text-cyan-200 border-cyan-400/40"
                                          : "bg-black/60 text-muted-foreground border-border/40",
                                      )}
                                    >
                                      {sub.badge}
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {/* D. Nhóm Phân Hệ Mở Rộng: Hạm Đội & Căn Cứ Hậu Cần */}
            <div className="pt-3 border-t border-border/50">
              {!isSidebarCollapsed ? (
                <button
                  onClick={() => setShowOperationsGroup(!showOperationsGroup)}
                  className="w-full flex items-center justify-between px-2 py-1 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground hover:text-white transition-colors cursor-pointer"
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
                          "w-full flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 font-display text-xs uppercase tracking-wider transition-colors cursor-pointer",
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

          {/* E. Bảng Nhật Ký Nhiệm Vụ (Mission Log Terminal - Nằm ở vị trí Bottom của Left Menu) */}
          <div className="shrink-0 border-t border-cyan-500/30 p-2 bg-black/60">
            {!isSidebarCollapsed ? (
              <MissionLog
                activeMission={activeCampaignMission}
                progression={progression}
                position="embedded"
                onNavigateMission={(missionId) => {
                  playClickSound()
                  setActiveSection("battlefield")
                }}
                onOpenFullLogs={() => {
                  playClickSound()
                  handleSwitchSection("mission-logs")
                }}
              />
            ) : (
              <button
                onClick={() => handleSwitchSection("mission-logs")}
                className="w-full flex flex-col items-center justify-center p-1.5 rounded text-cyan-300 hover:bg-cyan-950/60 transition-colors"
                title="Mở Nhật Ký Tác Chiến // Full Mission Logs"
              >
                <Terminal className="size-4 animate-pulse text-cyan-400" />
                <span className="text-xs font-mono mt-0.5 font-bold">LOGS</span>
              </button>
            )}
          </div>

          {/* F. Footer Sidebar: Âm Thanh, CRT Scanline, Cài Lại & Thông Tin */}
          <div className="shrink-0 border-t border-border/60 p-2 bg-black/70 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => {
                  playClickSound()
                  setIsSettingsOpen(true)
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded border border-cyan-500/40 text-cyan-300 bg-cyan-950/30 hover:bg-cyan-950/50 px-2 py-1 text-xs font-mono transition-colors cursor-pointer",
                  isSidebarCollapsed && "w-full justify-center px-1"
                )}
                title="Cài đặt hệ thống (Âm thanh, CRT, Tỷ lệ hiển thị UI)"
              >
                <Sliders className="size-3.5 text-cyan-400" />
                {!isSidebarCollapsed && <span>Cài Đặt</span>}
              </button>

              {!isSidebarCollapsed && (
                <button
                  type="button"
                  onClick={handleResetSave}
                  className="rounded border border-border/60 px-2 py-1 text-xs font-mono text-muted-foreground hover:text-red-400 hover:border-red-500/50 transition-colors cursor-pointer"
                  title="Cài lại tiến trình LocalStorage"
                >
                  Reset
                </button>
              )}
            </div>

            {!isSidebarCollapsed && (
              <div className="text-xs font-mono text-muted-foreground/70 leading-tight">
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
          {/* THANH TRẠNG THÁI TOÀN VẸN THÂN TÀU / GIÁP BỀN VỮNG TRÊN ĐẦU MÀN HÌNH (PERSISTENT TOP SHIP INTEGRITY BAR) */}
          <TopShipIntegrityBar
            progression={progression}
            onInspectShip={() => handleSwitchSection("hangar")}
          />

          {/* A. Compact Top Bar: Tiêu đề phân hệ & Nút Mobile Menu */}
          <header className="sticky top-0 z-30 flex min-h-14 h-auto flex-wrap shrink-0 items-center justify-between gap-2 border-b border-border/70 bg-panel/90 px-4 py-2 backdrop-blur-md">
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
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              {/* Huy hiệu Cặp Đôi Phi Công & Cơ Giáp */}
              <div
                onClick={() => handleSwitchSection("pilot")}
                className="hidden sm:flex items-center gap-1.5 rounded border px-2.5 py-1 cursor-pointer transition-colors hover:bg-black/40"
                style={{
                  borderColor: `${activeGearDef.color}60`,
                  backgroundColor: `${activeGearDef.color}15`,
                }}
                title="Bảng Trạng Thái Phi Công (Pilot Status Dashboard)"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: activeGearDef.color }}
                />
                <span className="font-bold text-white">
                  {STARFRONT_PILOT_MAP[progression.activePairing?.pilotId || "marcus"]?.name.split(" ")[0] || "Marcus"} · {activeGearDef.name}
                </span>
                <span className="text-xs text-muted-foreground">· Cấp {progression.level}</span>
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

              {/* Nút Mở Bảng WORLD ADMIN CP // Dedicated Orange Accent Entry Point (Phase 6.33_FIX5) */}
              <button
                type="button"
                onClick={handleOpenWorldAdminCp}
                className="flex items-center gap-1.5 rounded border border-orange-500/70 bg-gradient-to-r from-orange-950/80 to-amber-950/80 hover:from-orange-900/90 hover:to-amber-900/90 px-2.5 py-1 text-xs font-mono font-bold text-orange-300 hover:text-orange-100 hover:border-orange-400 transition-all cursor-pointer shadow-[0_0_12px_rgba(249,115,22,0.2)]"
                title="Bảng Quản Trị Hệ Thống Toàn Cầu // WORLD ADMIN CP"
              >
                <ShieldAlert className="size-3.5 text-orange-400 shrink-0" />
                <span className="font-bold tracking-wider">[ WORLD ADMIN CP ]</span>
              </button>

              {/* Nút Mở Bảng Cài Đặt Toàn Cục // Global Settings */}
              <button
                onClick={() => {
                  playClickSound()
                  setIsSettingsOpen(true)
                }}
                className="flex items-center gap-1.5 rounded border border-cyan-500/50 bg-cyan-950/40 hover:bg-cyan-900/60 px-2 py-1 text-xs font-mono text-cyan-300 transition-all cursor-pointer shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                title="Cài đặt hệ thống: Âm thanh, Hiệu ứng CRT, Tỷ lệ hiển thị UI"
              >
                <Sliders className="size-3 text-cyan-400" />
                <span className="hidden sm:inline font-semibold">CÀI ĐẶT</span>
              </button>
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
                  className="flex items-center gap-1 rounded-xs border border-border/60 bg-black/40 px-2 py-1 text-xs font-mono text-muted-foreground hover:text-white transition-colors cursor-pointer"
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
                onNavigate={(target) => handleSwitchSection(target as StarfrontSection)}
                onSelectGear={handleSelectGear}
              />
            )}

            {/* Phân hệ: Chỉ Huy Chiến Lược // STARFRONT WORLD Operations Center (Phase 6.8 & 6.23) */}
            {activeSection === "world" && (
              <OperationsCenter
                initialTab={activeWorldTab}
                adminTrigger={worldAdminTrigger}
                onNavigateSection={handleSwitchSection}
                onDeployEncounter={(sectorId, battleContext) => {
                  if (battleContext) {
                    setActiveWorldBattle(battleContext)
                  }
                  handleSwitchSection("battlefield")
                }}
              />
            )}

            {/* Phân hệ: Nhân Vật & Cơ Giáp (Character & Gear - Phase 5.8 & 5.11) */}
            {activeSection === "character-gear" && (
              <CharacterGearSelect
                progression={progression}
                onUpdateProgression={handleUpdateProgression}
                onNavigateToHangar={() => handleSwitchSection("hangar")}
                onNavigateToCombat={() => handleSwitchSection("battlefield")}
                onNavigateToPilotStatus={() => handleSwitchSection("pilot")}
                onContinueWithCurrentSelection={() => handleSwitchSection("battlefield")}
                onEquipItem={handleEquipItem}
                onUnequipSlot={handleUnequipSlot}
              />
            )}

            {/* Phân hệ: Thư Viện Art Phi Công (Pilot Art Gallery) */}
            {activeSection === "gallery" && (
              <PilotGallery
                progression={progression}
                onUpdateProgression={handleUpdateProgression}
                onNavigateSection={handleSwitchSection}
              />
            )}

            {/* Phân hệ 2: Đấu Trường (Battlefield - Phase 6.23 & 6.33 Combat V2 Integration) */}
            {activeSection === "battlefield" && (
              activeWorldBattle?.snapshot?.combatVersion === "v2" ? (
                <CombatV2Dashboard
                  initialSnapshot={convertWorldBattleContextToCombatV2Snapshot(activeWorldBattle, {
                    gearName: progression.activePairing?.gearId || progression.activeGearId || "Vanguard",
                    pilotName: STARFRONT_PILOT_MAP[progression.activePairing?.pilotId || "marcus"]?.name || "Marcus Vance",
                  })}
                  onCombatComplete={(res, resolution) => {
                    setActiveWorldBattle(null)
                    handleSwitchSection("world")
                  }}
                  onExit={() => {
                    setActiveWorldBattle(null)
                    handleSwitchSection("world")
                  }}
                />
              ) : (
                <CombatArena
                  progression={progression}
                  onUpdateProgression={handleUpdateProgression}
                  activeCampaignMission={activeWorldBattle ? null : activeCampaignMission}
                  onClearCampaignMission={handleClearMission}
                  onSelectCampaignMission={setActiveCampaignMission}
                  onNavigateSection={handleSwitchSection}
                  isEmbeddedInShell={true}
                  worldBattleContext={activeWorldBattle}
                  onWorldCombatComplete={(result) => {
                    setActiveWorldBattle(null)
                    handleSwitchSection("world")
                  }}
                  onWorldCombatAborted={() => {
                    setActiveWorldBattle(null)
                    handleSwitchSection("world")
                  }}
                />
              )
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
                activeTab={activeHangarTab}
                onTabChange={setActiveHangarTab}
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

            {/* Phân hệ Mở Rộng: Bảng Trạng Thái & Hồ Sơ Phi Công (Pilot Status Dashboard) */}
            {activeSection === "pilot" && (
              <PilotStatusDashboard
                progression={progression}
                onUpdateProgression={handleUpdateProgression}
                onEquipItem={handleEquipItem}
                onUnequipSlot={handleUnequipSlot}
                onNavigateSection={handleSwitchSection}
              />
            )}

            {/* Phân hệ: Nhật Ký Tác Chiến Toàn Diện (Full Mission Telemetry Logs) */}
            {activeSection === "mission-logs" && (
              <FullMissionLogView
                activeMission={activeCampaignMission}
                progression={progression}
                onNavigateMission={(missionId) => {
                  playClickSound()
                  setActiveSection("battlefield")
                }}
                onNavigateSection={handleSwitchSection}
              />
            )}
          </main>
        </div>

        {/* ====================================================================
            HỘP THOẠI BẮT BUỘC CHỌN PHI CÔNG & CƠ GIÁP (PHASE 5.11 MANDATORY SELECTION MODAL)
            ==================================================================== */}
        {(!hasValidSelection || mandatoryModalOpen) && activeSection !== "character-gear" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-sm border border-amber-500/70 bg-gradient-to-b from-panel via-black/95 to-panel p-5 shadow-2xl font-mono text-left">
              <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                <div className="flex size-10 items-center justify-center rounded border border-amber-500/60 bg-amber-950/50 text-amber-300">
                  <AlertTriangle className="size-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="font-display text-sm font-black uppercase tracking-wider text-white">
                    YÊU CẦU BẮT BUỘC: CHỌN PHI CÔNG & CƠ GIÁP
                  </h2>
                  <span className="text-xs text-amber-300 font-bold uppercase">Hệ Thống Chưa Khởi Tạo Tổ Hợp</span>
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                Chào mừng Chỉ Huy! Để có thể tham gia các phân hệ tác chiến (Đấu Trường, Bản Đồ Nhiệm Vụ, Hangar & Chợ Quân Sự), bạn bắt buộc phải hoàn tất lựa chọn ghép đôi Phi Công & Cơ Giáp khởi đầu.
              </p>

              <div className="mt-4 rounded bg-black/60 border border-amber-500/30 p-2.5 text-xs text-amber-200/90 flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-400 shrink-0" />
                <span>Không thể bỏ qua bước này khi chưa có tổ hợp hợp lệ.</span>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => {
                    playClickSound()
                    setMandatoryModalOpen(false)
                    setActiveSection("character-gear")
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-black py-2.5 px-4 font-display text-xs uppercase tracking-wider border border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer"
                >
                  <span>BẮT ĐẦU CHỌN PHI CÔNG & CƠ GIÁP</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            HIỆU ỨNG QUÉT MÀN HÌNH CRT TỔNG THỂ (FULL-SCREEN SCI-FI SCANLINE OVERLAY)
            ================================================================== */}
        {scanlineEnabled && (
          <div
            className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none"
            aria-hidden="true"
          >
            {/* Lớp lưới quét sọc vi mạch CRT (Micro-Scanline CRT Grid) */}
            <div className="absolute inset-0 crt-scanlines opacity-75 pointer-events-none" />

            {/* Dải quét tia sáng radar chuyển động mượt mà từ trên xuống dưới (Animated Sweep Beam) */}
            {scanlineBeamEnabled && (
              <div className="absolute inset-x-0 h-44 scanline-beam opacity-85 pointer-events-none" />
            )}

            {/* Hiệu ứng viền tối cockpit chiến hạm sci-fi (Subtle Radial Vignette) */}
            {vignetteEnabled && (
              <div className="absolute inset-0 vignette-radial opacity-50 pointer-events-none" />
            )}

            {/* Khung ngắm HUD 4 góc phong cách chiến thuật tương lai (Tactical Reticle Corners) */}
            {cornerBracketsEnabled && (
              <>
                <div className="absolute top-2 left-2 size-4 border-t-2 border-l-2 border-cyan-500/40 pointer-events-none" />
                <div className="absolute top-2 right-2 size-4 border-t-2 border-r-2 border-cyan-500/40 pointer-events-none" />
                <div className="absolute bottom-2 left-2 size-4 border-b-2 border-l-2 border-cyan-500/40 pointer-events-none" />
                <div className="absolute bottom-2 right-2 size-4 border-b-2 border-r-2 border-cyan-500/40 pointer-events-none" />
              </>
            )}
          </div>
        )}

        {/* Modal Cài Đặt Hệ Thống Toàn Cục // Global Settings Modal (Phase 6.33_FIX1 P1) */}
        <GlobalSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onUpdateSettings={handleUpdateGlobalSettings}
        />
      </div>
    </GameProvider>
  )
}
