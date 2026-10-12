"use client"

import { Button } from "@/components/ui/button"
import { ENCOUNTER_INFO, STARFRONT_GEAR_DEFS } from "@/lib/game/data"
import {
  isAudioMuted,
  playClickSound,
  playImpactSound,
  playLaserSound,
  playLevelUpSound,
  playShieldSound,
  playVictorySound,
  setAudioMuted,
} from "@/lib/game/audio"
import {
  createInitialCombatState,
  executeEnemyAIAction,
  executePlayerAction,
  getEffectiveSpeed,
  getEffectiveDefense,
  getEffectiveAttack,
  getEffectiveEvasion,
  applyStatusEffect,
} from "@/lib/game/engine"
import {
  applyDefeatRecord,
  applyMissionClearReward,
  applyVictoryReward,
  buildPlayerCombatUnit,
  enhanceItem,
  getExpRequiredForLevel,
  INITIAL_STARFRONT_PROGRESSION,
  isSelectionOptional,
  isValidPilotGearSelection,
} from "@/lib/game/progression"
import {
  createScaledEnemyUnit,
  findCampaignQuest,
  generateEquipmentReward,
  getNextCampaignMission,
  getCurrentOrNextCampaignMission,
  STANDARD_CAMPAIGN_QUESTS,
} from "@/lib/game/scaling"
import {
  loadStarfrontProgression,
  resetStarfrontProgression,
  saveStarfrontProgression,
} from "@/lib/game/storage"
import type {
  BattleRewardResult,
  CampaignMission,
  CombatState,
  CombatUnit,
  EnemyEncounterType,
  StarfrontGearId,
  StarfrontItem,
  StarfrontItemSlot,
  StarfrontProgression,
  StatusEffect,
} from "@/lib/game/types"
import { PostMissionResults } from "@/components/game/post-mission-results"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  Database,
  Flame,
  FlaskConical,
  Gauge,
  Gift,
  Globe2,
  Layers,
  Lock,
  Play,
  Radio,
  Recycle,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Sword,
  Target,
  Trophy,
  Volume2,
  VolumeX,
  Wind,
  Wrench,
  Zap,
  Flag,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { CampaignMap } from "./campaign-map"
import { CombatLogPanel } from "./combat-log-panel"
import { PlayerStatus } from "./player-status"
import { StarfrontHangar } from "./starfront-hangar"
import { StarfrontShop } from "./starfront-shop"
import { CombatText, type CombatTextItem } from "./combat-text"
import { TacticalGridOverlay } from "./tactical-grid-overlay"
import { WorldCombatPostMissionResults } from "./world-combat-results"
import {
  buildCombatUnitFromSnapshot,
  applyWorldSnapshotPlayerModifiers,
  buildCombatReceiptFromCombatState,
  commitCombatResultReceipt,
  abortSuspendedCombat,
} from "@/lib/game/world/combat-adapter"
import { loadWorldState, saveWorldState } from "@/lib/game/world/storage"
import type {
  WorldBattleContext,
  CombatResolutionResult,
  AbortCombatResult,
} from "@/lib/game/world/types"

const GEAR_THEMES: Record<
  StarfrontGearId,
  {
    border: string
    borderHover: string
    bgGradient: string
    badgeBg: string
    badgeText: string
    badgeBorder: string
    textPrimary: string
    textAccent: string
    iconBg: string
    iconBorder: string
    iconColor: string
    spGradient: string
  }
> = {
  vanguard: {
    border: "border-cyan-500/40",
    borderHover: "hover:border-cyan-300 hover:bg-cyan-950/40 hover:shadow-[0_0_15px_rgba(34,211,238,0.25)]",
    bgGradient: "from-cyan-950/20 via-panel/80 to-panel",
    badgeBg: "bg-cyan-500/20",
    badgeText: "text-cyan-300",
    badgeBorder: "border-cyan-500/50",
    textPrimary: "text-cyan-200",
    textAccent: "text-cyan-400",
    iconBg: "bg-cyan-950/60",
    iconBorder: "border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.4)]",
    iconColor: "text-cyan-300",
    spGradient: "from-cyan-500 to-blue-500",
  },
  falcon: {
    border: "border-purple-500/40",
    borderHover: "hover:border-purple-300 hover:bg-purple-950/40 hover:shadow-[0_0_15px_rgba(168,85,247,0.25)]",
    bgGradient: "from-purple-950/20 via-panel/80 to-panel",
    badgeBg: "bg-purple-500/20",
    badgeText: "text-purple-300",
    badgeBorder: "border-purple-500/50",
    textPrimary: "text-purple-200",
    textAccent: "text-purple-400",
    iconBg: "bg-purple-950/60",
    iconBorder: "border-purple-400/60 shadow-[0_0_20px_rgba(168,85,247,0.4)]",
    iconColor: "text-purple-300",
    spGradient: "from-purple-500 to-indigo-500",
  },
  aegis: {
    border: "border-amber-500/40",
    borderHover: "hover:border-amber-300 hover:bg-amber-950/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.25)]",
    bgGradient: "from-amber-950/20 via-panel/80 to-panel",
    badgeBg: "bg-amber-500/20",
    badgeText: "text-amber-300",
    badgeBorder: "border-amber-500/50",
    textPrimary: "text-amber-200",
    textAccent: "text-amber-400",
    iconBg: "bg-amber-950/60",
    iconBorder: "border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.4)]",
    iconColor: "text-amber-300",
    spGradient: "from-amber-500 to-orange-500",
  },
}

export interface CombatArenaProps {
  progression?: StarfrontProgression
  onUpdateProgression?: (updated: StarfrontProgression) => void
  activeCampaignMission?: CampaignMission | null
  onClearCampaignMission?: () => void
  onSelectCampaignMission?: (mission: CampaignMission | null) => void
  onNavigateSection?: (section: "home" | "battlefield" | "missions" | "shop" | "hangar" | "character-gear" | "world") => void
  isEmbeddedInShell?: boolean
  worldBattleContext?: WorldBattleContext | null
  onWorldCombatComplete?: (result: CombatResolutionResult) => void
  onWorldCombatAborted?: (abortResult: AbortCombatResult) => void
}

export function CombatArena({
  progression: initialProgression,
  onUpdateProgression,
  activeCampaignMission: parentMission,
  onClearCampaignMission,
  onSelectCampaignMission,
  onNavigateSection,
  isEmbeddedInShell = false,
  worldBattleContext,
  onWorldCombatComplete,
  onWorldCombatAborted,
}: CombatArenaProps = {}) {
  // 1. Quản lý tiến trình STARFRONT (Level, EXP, Credits, Trang bị, Gears, Chiến dịch)
  const [progression, setProgression] = useState<StarfrontProgression>(
    initialProgression || INITIAL_STARFRONT_PROGRESSION,
  )
  const [hasLoadedProgression, setHasLoadedProgression] = useState(Boolean(initialProgression))
  const [activeSubView, setActiveSubView] = useState<"combat" | "campaign" | "hangar" | "shop">("combat")
  const [activeCampaignMission, setActiveCampaignMission] = useState<CampaignMission | null>(
    parentMission !== undefined ? parentMission : null,
  )
  const [audioMuted, setAudioMutedState] = useState(false)

  // Trạng thái cho trận chiến thực địa STARFRONT WORLD (Phase 6.23)
  const [worldResolutionResult, setWorldResolutionResult] = useState<CombatResolutionResult | null>(null)
  const [worldAbortResult, setWorldAbortResult] = useState<AbortCombatResult | null>(null)
  const [isRetreatModalOpen, setIsRetreatModalOpen] = useState(false)
  const worldCommittedRef = useRef(false)

  // Đồng bộ progression từ parent shell nếu có thay đổi
  useEffect(() => {
    if (initialProgression) {
      setProgression(initialProgression)
      setHasLoadedProgression(true)
    }
  }, [initialProgression])

  // Đồng bộ activeCampaignMission từ parent shell
  useEffect(() => {
    if (parentMission !== undefined) {
      const isDifferent = parentMission?.id !== activeCampaignMission?.id
      if (isDifferent) {
        setActiveCampaignMission(parentMission)
        if (parentMission) {
          handleStartEncounter(parentMission.encounterId, progression, parentMission)
        }
      }
    }
  }, [parentMission, activeCampaignMission?.id])

  const activeGearId: StarfrontGearId = progression.activeGearId || "vanguard"
  const activeGearDef = STARFRONT_GEAR_DEFS[activeGearId] || STARFRONT_GEAR_DEFS.vanguard
  const currentTheme = GEAR_THEMES[activeGearId] || GEAR_THEMES.vanguard

  // 2. Trạng thái chiến đấu
  const [selectedEncounter, setSelectedEncounter] = useState<EnemyEncounterType>("scout-drone")
  const [combatState, setCombatState] = useState<CombatState>(() =>
    createInitialCombatState("scout-drone", buildPlayerCombatUnit(INITIAL_STARFRONT_PROGRESSION)),
  )
  const [isProcessingAI, setIsProcessingAI] = useState(false)
  const [hoveredSkillId, setHoveredSkillId] = useState<string | null>(null)
  const [floatingNotification, setFloatingNotification] = useState<{
    text: string
    isCrit?: boolean
    isPlayer?: boolean
  } | null>(null)

  // Hệ thống Floating Combat Text (Floating damage numbers & combat events)
  const [combatTextEvents, setCombatTextEvents] = useState<CombatTextItem[]>([])

  const spawnCombatText = (item: Omit<CombatTextItem, "id">) => {
    const id = `ct-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    setCombatTextEvents((prev) => [...prev.slice(-12), { ...item, id }])
  }

  const handleRemoveCombatText = (id: string) => {
    setCombatTextEvents((prev) => prev.filter((it) => it.id !== id))
  }

  // 3. Quản lý nhận thưởng chính xác 1 lần duy nhất (Chống cộng lặp lại)
  const rewardClaimedRef = useRef(false)
  const defeatRecordedRef = useRef(false)
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [lastVictoryReward, setLastVictoryReward] = useState<{
    reward: BattleRewardResult
    dropItem?: StarfrontItem
    missionTitle?: string
    isFirstClear?: boolean
  } | null>(null)

  // State ẩn/hiện Dev Combat Test Mode (Phase 5.2)
  const [showDevTestPanel, setShowDevTestPanel] = useState(false)

  // Dev Test Handler: Đổi nhanh lớp Gear trong trận đấu
  const handleDevSelectGear = (gearId: StarfrontGearId) => {
    playClickSound()
    const updated: StarfrontProgression = {
      ...progression,
      activeGearId: gearId,
    }
    setProgression(updated)
    saveStarfrontProgression(updated)
    const newUnit = buildPlayerCombatUnit(updated)
    const fresh = createInitialCombatState(selectedEncounter, newUnit)
    fresh.logs.push({
      id: `dev-switch-${Date.now()}`,
      turn: 1,
      type: "system",
      text: `[DEV TEST 🛠️] Đã chuyển đổi sang ${STARFRONT_GEAR_DEFS[gearId].name} (${STARFRONT_GEAR_DEFS[gearId].passive.name}). Sẵn sàng kiểm thử nội tại!`,
      actorName: "DEV TOOLS",
      timestamp: "00:01",
    })
    setCombatState(fresh)
  }

  // Dev Test Handler 1: Kích hoạt Vanguard SP & Chu kỳ 3 lượt
  const handleDevTestVanguard = () => {
    playClickSound()
    let currentProg = progression
    if (currentProg.activeGearId !== "vanguard") {
      currentProg = { ...progression, activeGearId: "vanguard" }
      setProgression(currentProg)
      saveStarfrontProgression(currentProg)
    }
    const unit = buildPlayerCombatUnit(currentProg)
    unit.sp = 50
    unit.skillCooldowns = { "pulse-strike": 2 }
    const fresh = createInitialCombatState(selectedEncounter, unit)
    fresh.turnNumber = 3
    fresh.status = "player-turn"
    fresh.logs.push({
      id: `dev-vg-${Date.now()}`,
      turn: 3,
      type: "system",
      text: "[TEST ID: TC-VG-01 ⚡] Thiết lập Vanguard Lượt 3: SP = 50, Đạn Xung Điện có CD = 2 lượt. Bấm kỹ năng bất kỳ hoặc 'BẤM ĐỂ ĐI NGAY' để quan sát Vanguard hồi thêm +5 SP (tổng +10) và giảm thêm 1 lượt CD kỹ năng!",
      actorName: "DEV TOOLS",
      timestamp: "00:03",
    })
    setCombatState(fresh)
  }

  // Dev Test Handler 2: Kích hoạt Falcon 100% Bạo Kích & Bắn Bồi Khí Động
  const handleDevTestFalconCrit = () => {
    playClickSound()
    let currentProg = progression
    if (currentProg.activeGearId !== "falcon") {
      currentProg = { ...progression, activeGearId: "falcon" }
      setProgression(currentProg)
      saveStarfrontProgression(currentProg)
    }
    const unit = buildPlayerCombatUnit(currentProg)
    let stateToUse = combatState
    if (combatState.player.gearType !== "falcon" || combatState.enemy.hp <= 0) {
      stateToUse = createInitialCombatState(selectedEncounter, unit)
    }
    stateToUse.status = "player-turn"
    const skillId = stateToUse.player.skills[0].id
    const next = executePlayerAction(stateToUse, skillId, { forceCrit: true, forceFalconFollowUp: true })
    if (next.lastAction?.damage) {
      playImpactSound(true)
      setFloatingNotification({
        text: `🔥 BẠO KÍCH + BẮN BỒI! -${next.lastAction.damage} HP`,
        isCrit: true,
        isPlayer: true,
      })
      setTimeout(() => setFloatingNotification(null), 1800)
    }
    setCombatState(next)
  }

  // Dev Test Handler 3: Kích hoạt Falcon Né Tránh
  const handleDevTestFalconEvade = () => {
    playClickSound()
    let currentProg = progression
    if (currentProg.activeGearId !== "falcon") {
      currentProg = { ...progression, activeGearId: "falcon" }
      setProgression(currentProg)
      saveStarfrontProgression(currentProg)
    }
    const unit = buildPlayerCombatUnit(currentProg)
    let stateToUse = combatState
    if (combatState.player.gearType !== "falcon" || combatState.enemy.hp <= 0) {
      stateToUse = createInitialCombatState(selectedEncounter, unit)
    }
    stateToUse.status = "enemy-turn"
    const next = executeEnemyAIAction(stateToUse, { forceEvade: true })
    setFloatingNotification({
      text: "NÉ TRÁNH 💨 (Khí Động Học Mach)",
      isCrit: false,
      isPlayer: true,
    })
    setTimeout(() => setFloatingNotification(null), 1800)
    setCombatState(next)
  }

  // Dev Test Handler 4: Kích hoạt Aegis Phản Sát Thương 20%
  const handleDevTestAegisReflect = () => {
    playClickSound()
    let currentProg = progression
    if (currentProg.activeGearId !== "aegis") {
      currentProg = { ...progression, activeGearId: "aegis" }
      setProgression(currentProg)
      saveStarfrontProgression(currentProg)
    }
    const unit = buildPlayerCombatUnit(currentProg)
    let stateToUse = combatState
    if (combatState.player.gearType !== "aegis" || combatState.enemy.hp <= 0) {
      stateToUse = createInitialCombatState(selectedEncounter, unit)
    }
    stateToUse.player.hp = Math.max(stateToUse.player.hp, 1500)
    stateToUse.status = "enemy-turn"
    const next = executeEnemyAIAction(stateToUse, { forceNoEvade: true })
    if (next.lastAction?.damage) {
      playImpactSound(false)
      const reflected = Math.max(1, Math.round(next.lastAction.damage * 0.2))
      setFloatingNotification({
        text: `🛡️ PHẢN ĐÒN GAI: -${reflected} HP về Địch`,
        isCrit: false,
        isPlayer: true,
      })
      setTimeout(() => setFloatingNotification(null), 1800)
    }
    setCombatState(next)
  }

  // Dev Test Handler 5: Kích hoạt Aegis Kháng 50% Làm Chậm & Phá Giáp
  const handleDevTestAegisResist = () => {
    playClickSound()
    let currentProg = progression
    if (currentProg.activeGearId !== "aegis") {
      currentProg = { ...progression, activeGearId: "aegis" }
      setProgression(currentProg)
      saveStarfrontProgression(currentProg)
    }
    const unit = buildPlayerCombatUnit(currentProg)
    let stateToUse = combatState
    if (combatState.player.gearType !== "aegis" || combatState.enemy.hp <= 0) {
      stateToUse = createInitialCombatState(selectedEncounter, unit)
    }

    const empRes = applyStatusEffect(stateToUse.player, {
      type: "emp-slow",
      name: "EMP Thử Nghiệm",
      desc: "Giảm 25 Tốc độ (SPD)",
      duration: 2,
      value: 25,
      isDebuff: true,
    })
    const abRes = applyStatusEffect(stateToUse.player, {
      type: "armor-break",
      name: "Phá Giáp Thử Nghiệm",
      desc: "Giảm 35% Phòng ngự",
      duration: 2,
      value: 0.35,
      isDebuff: true,
    })

    const now = "00:01"
    const newLogs = [
      ...stateToUse.logs,
      {
        id: `dev-res-${Date.now()}-1`,
        turn: stateToUse.turnNumber,
        type: "status" as const,
        text: empRes.logText,
        actorName: "DEV TOOLS",
        timestamp: now,
      },
      {
        id: `dev-res-${Date.now()}-2`,
        turn: stateToUse.turnNumber,
        type: "status" as const,
        text: abRes.logText,
        actorName: "DEV TOOLS",
        timestamp: now,
      },
    ]

    setCombatState({
      ...stateToUse,
      logs: newLogs,
    })
  }

  // Dev Test Handler 6: Thử nghiệm Trường Hợp KHÔNG Kích Hoạt (Non-trigger control)
  const handleDevTestNonTrigger = () => {
    playClickSound()
    let currentProg = progression
    if (currentProg.activeGearId !== "vanguard") {
      currentProg = { ...progression, activeGearId: "vanguard" }
      setProgression(currentProg)
      saveStarfrontProgression(currentProg)
    }
    const unit = buildPlayerCombatUnit(currentProg)
    unit.skillCooldowns = { "pulse-strike": 2 }
    const fresh = createInitialCombatState(selectedEncounter, unit)
    fresh.turnNumber = 1
    fresh.status = "player-turn"
    fresh.logs.push({
      id: `dev-non-${Date.now()}`,
      turn: 1,
      type: "system",
      text: "[TEST ID: TC-NON-01 ❌] Kiểm thử KHÔNG KÍCH HOẠT: Vanguard ở Lượt 1 (không phải chu kỳ 3 lượt). Kỹ năng Đạn Xung Điện CD = 2. Khi hành động, chỉ giảm 1 CD tự nhiên, KHÔNG kích hoạt giảm thêm lượt hồi chiêu!",
      actorName: "DEV TOOLS",
      timestamp: "00:01",
    })
    setCombatState(fresh)
  }

  // Dev Test Handler 7: Thêm 1 món đồ Epic (+3) vào kho để kiểm thử ngay tính năng Rã Đồ
  const handleDevAddSalvageTestItem = () => {
    playClickSound()
    const testItem: StarfrontItem = {
      id: `test_salvage_${Date.now()}`,
      name: "Pháo Ray Thử Nghiệm (+3)",
      slot: "weapon",
      rarity: "epic",
      desc: "Trang bị thử nghiệm cấp cường hóa +3 để kiểm tra công thức thu hồi Alloy và Credits (Milestone 5.3).",
      attackBonus: 45,
      price: 1500,
      enhancementLevel: 3,
    }
    const updated = {
      ...progression,
      inventory: [testItem, ...progression.inventory],
    }
    setProgression(updated)
    saveStarfrontProgression(updated)
    setFloatingNotification({
      text: "Đã thêm 1 món Epic (+3) vào Kho Đồ để test Rã Đồ!",
      isCrit: false,
      isPlayer: true,
    })
    setTimeout(() => setFloatingNotification(null), 2500)
  }

  // Dev Test Handler 8: Kiểm thử chu kỳ Đồng Bộ Hóa Trạng Thái Gear (Milestone 5.4)
  const handleDevTestStateSync = () => {
    playClickSound()
    const nextGear: Record<StarfrontGearId, StarfrontGearId> = {
      vanguard: "falcon",
      falcon: "aegis",
      aegis: "vanguard",
    }
    const current = progression.activeGearId || "vanguard"
    const target = nextGear[current]
    const updated: StarfrontProgression = {
      ...progression,
      activeGearId: target,
    }
    setProgression(updated)
    saveStarfrontProgression(updated)
    const newUnit = buildPlayerCombatUnit(updated)
    const fresh = createInitialCombatState(selectedEncounter, newUnit)
    fresh.logs.push({
      id: `dev-sync-${Date.now()}`,
      turn: 1,
      type: "system",
      text: `[TEST ID: TC-SYNC-01 🔄] ĐÃ ĐỒNG BỘ TỨC THỜI sang ${STARFRONT_GEAR_DEFS[target].name}: Tốc độ SPD = ${newUnit.speed}, Né tránh = ${newUnit.evasion}%, Bộ 4 kỹ năng = [${newUnit.skills.map((s) => s.name).join(", ")}], Theme = ${STARFRONT_GEAR_DEFS[target].role}!`,
      actorName: "DEV TOOLS",
      timestamp: "00:01",
    })
    setCombatState(fresh)
    setFloatingNotification({
      text: `Đã đồng bộ tức thì sang ${STARFRONT_GEAR_DEFS[target].name}!`,
      isCrit: false,
      isPlayer: true,
    })
    setTimeout(() => setFloatingNotification(null), 2500)
  }

  // Dev Test Handler 9: Xác minh tính toàn vẹn Schema v3 & Migration (Milestone 5.4)
  const handleDevTestSchemaMigration = () => {
    playClickSound()
    const current = loadStarfrontProgression()
    const allItemsHaveEnhanceLevel = current.inventory.every(
      (it) => it.enhancementLevel !== undefined && it.enhancementLevel >= 0 && it.enhancementLevel <= 10,
    )
    const isV3 = current.version === 3
    const isSafe = isV3 && allItemsHaveEnhanceLevel && current.alloy !== undefined && current.alloy >= 0

    setFloatingNotification({
      text: isSafe
        ? `Schema v3 HỢP LỆ (v${current.version}, ${current.inventory.length} món có cấp cường hóa, ${current.alloy} Alloy)!`
        : "Cảnh báo: Dữ liệu chưa chuẩn hóa!",
      isCrit: false,
      isPlayer: true,
    })
    setTimeout(() => setFloatingNotification(null), 3000)

    setCombatState((prev) => ({
      ...prev,
      logs: [
        ...prev.logs,
        {
          id: `dev-mig-${Date.now()}`,
          turn: prev.turnNumber,
          type: "system",
          text: `[TEST ID: TC-MIG-01 💾] Xác thực Storage Schema v3: Phiên bản = ${current.version}, Tổng vật phẩm = ${current.inventory.length} (100% có enhancementLevel [0..10]), Số dư Alloy = ${current.alloy}, Credits = ${current.credits}, Active Gear = ${current.activeGearId}. Dữ liệu hoàn toàn tương thích và an toàn!`,
          actorName: "STORAGE V3",
          timestamp: "00:01",
        },
      ],
    }))
  }

  // Dev Test Handler 10: Thử thách Boss Bastion Colossus Lv.9 Legendary (Phase 5.5)
  const handleDevTestMissionScaling = () => {
    playClickSound()
    const mission = STANDARD_CAMPAIGN_QUESTS.find((q) => q.id === "m3-3") || STANDARD_CAMPAIGN_QUESTS[STANDARD_CAMPAIGN_QUESTS.length - 1]
    const campaignMission: CampaignMission = {
      id: mission.id,
      sectorId: mission.sectorId,
      sectorName: mission.sectorName || "Bastion Core",
      order: mission.order || 3,
      title: mission.title,
      desc: mission.desc,
      recommendedLevel: mission.level,
      encounterId: mission.encounterType,
      level: mission.level,
      quality: mission.quality,
      variantId: mission.variantId,
      previewReward: mission.previewReward,
      firstClearReward: {
        credits: mission.previewReward.credits,
        exp: 750,
        alloy: mission.previewReward.alloy,
      },
      repeatReward: {
        credits: Math.round(mission.previewReward.credits * 0.7),
        exp: 350,
      },
    }
    setActiveCampaignMission(campaignMission)
    handleStartEncounter(mission.encounterType, progression, campaignMission)
    setFloatingNotification({
      text: `Đã kích hoạt Ải 3-3: Colossus [Lv.${mission.level}] Legendary Boss!`,
      isCrit: true,
      isPlayer: false,
    })
    setTimeout(() => setFloatingNotification(null), 3000)
  }

  // Dev Test Handler 11: Rơi Đồ Trang Bị & Sinh Thuộc Tính Ngẫu Nhiên (Phase 5.5)
  const handleDevTestLootSystem = () => {
    playClickSound()
    const loot = generateEquipmentReward(5, "heroic", "weapon", Date.now())
    const updated: StarfrontProgression = {
      ...progression,
      inventory: [...progression.inventory, loot],
    }
    setProgression(updated)
    saveStarfrontProgression(updated)
    setFloatingNotification({
      text: `Rơi đồ: ${loot.name} (${loot.rarity.toUpperCase()})!`,
      isCrit: true,
      isPlayer: true,
    })
    setTimeout(() => setFloatingNotification(null), 3000)

    setCombatState((prev) => ({
      ...prev,
      logs: [
        ...prev.logs,
        {
          id: `dev-loot-${Date.now()}`,
          turn: prev.turnNumber,
          type: "system",
          text: `[TEST ID: TC-LOOT-01 🎁] Đã sinh trang bị ngẫu nhiên: ${loot.name} (Phẩm chất: ${loot.rarity}, Cấp: ${loot.level}). Thuộc tính: +${loot.attackBonus || 0} ATK, +${loot.defenseBonus || 0} DEF, +${loot.speedBonus || 0} SPD, +${loot.hpBonus || 0} HP. Đã lưu vào kho đồ thành công!`,
          actorName: "LOOT SYSTEM 5.5",
          timestamp: "00:01",
        },
      ],
    }))
  }

  // Dev Test Handler: Làm mới lại trận đấu
  const handleDevResetArena = () => {
    playClickSound()
    handleStartEncounter(selectedEncounter, progression, activeCampaignMission)
  }

  // Khởi động trận chiến thực địa STARFRONT WORLD (Phase 6.23)
  const handleStartWorldEncounter = (
    context: WorldBattleContext,
    currentProg: StarfrontProgression = progression,
  ) => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current)
      aiTimeoutRef.current = null
    }
    setIsProcessingAI(false)
    rewardClaimedRef.current = false
    defeatRecordedRef.current = false
    worldCommittedRef.current = false
    setLastVictoryReward(null)
    setWorldResolutionResult(null)
    setWorldAbortResult(null)

    let playerUnit = buildPlayerCombatUnit(currentProg)
    playerUnit = applyWorldSnapshotPlayerModifiers(playerUnit, context.snapshot)
    const worldEnemyUnit = buildCombatUnitFromSnapshot(context.snapshot)

    const fresh = createInitialCombatState("raider-mech", playerUnit, worldEnemyUnit)
    fresh.logs = [
      {
        id: `world-log-init-1-${Date.now()}`,
        turn: 1,
        type: "system",
        text: `[STARFRONT WORLD] Tiếp cận không phận chiến sự Sector ${context.sectorName} (${context.sectorId})! Giao dịch: ${context.transactionId}`,
        actorName: "SỞ CHỈ HUY",
        timestamp: "00:01",
      },
      {
        id: `world-log-init-2-${Date.now()}`,
        turn: 1,
        type: "system",
        text: `[TÌNH BÁO CHIẾN TRƯỜNG] Đối thủ: ${worldEnemyUnit.name}. Đồn trú đóng băng: ${context.snapshot.lockedGarrison.toLocaleString()} quân. Công sự cấp ${context.snapshot.friendlyModifiers.fortificationLevel} (Thủ +${Math.round((context.snapshot.friendlyModifiers.defenseMultiplier - 1) * 100)}%). Sĩ khí: +${Math.round((context.snapshot.friendlyModifiers.moraleMultiplier - 1) * 100)}%.`,
        actorName: "RADAR TIỀN TIẾN",
        timestamp: "00:01",
      },
      ...fresh.logs,
    ]
    setCombatState(fresh)
  }

  // Khởi động lại hoặc đồng bộ khi nhận worldBattleContext
  useEffect(() => {
    if (worldBattleContext) {
      handleStartWorldEncounter(worldBattleContext, progression)
    }
  }, [worldBattleContext?.transactionId])

  // Xử lý Hủy Bỏ An Toàn trận đấu (Safe Abort - Hoàn trả đồn trú nguyên vẹn)
  const handleConfirmSafeAbort = () => {
    if (!worldBattleContext) return
    try {
      const loadRes = loadWorldState()
      const wState = loadRes.state
      const res = abortSuspendedCombat(
        wState,
        worldBattleContext.transactionId,
        "Người chơi hủy bỏ an toàn trận tác chiến",
      )
      saveWorldState(wState)
      setWorldAbortResult(res)
      setIsRetreatModalOpen(false)
      onWorldCombatAborted?.(res)
    } catch (err: any) {
      console.error("Error aborting combat:", err)
    }
  }

  // Xử lý Rút Lui Chiến Thuật (Tactical Retreat - Chấp nhận thất bại)
  const handleConfirmTacticalRetreat = () => {
    if (!worldBattleContext) return
    try {
      const receipt = buildCombatReceiptFromCombatState(combatState, worldBattleContext.snapshot, false)
      receipt.logSummary = "Người chơi chủ động rút lui khỏi chiến trường."
      const loadRes = loadWorldState()
      const wState = loadRes.state
      const resolution = commitCombatResultReceipt(wState, receipt)
      saveWorldState(wState)
      setWorldResolutionResult(resolution)
      setIsRetreatModalOpen(false)
      setCombatState((prev) => ({ ...prev, status: "defeat" }))
    } catch (err: any) {
      console.error("Error retreating combat:", err)
    }
  }

  // Khôi phục dữ liệu đã lưu từ LocalStorage khi khởi chạy
  useEffect(() => {
    if (worldBattleContext) {
      if (initialProgression) {
        setProgression(initialProgression)
        setHasLoadedProgression(true)
      } else {
        const saved = loadStarfrontProgression()
        setProgression(saved)
        setHasLoadedProgression(true)
      }
      setAudioMutedState(isAudioMuted())
      handleStartWorldEncounter(worldBattleContext, initialProgression || loadStarfrontProgression())
      return
    }

    if (initialProgression) {
      setProgression(initialProgression)
      setHasLoadedProgression(true)
      setAudioMutedState(isAudioMuted())
      const customPlayer = buildPlayerCombatUnit(initialProgression)
      const encId = parentMission?.encounterId || selectedEncounter || "scout-drone"
      let scaledEnemy: CombatUnit | undefined = undefined
      if (parentMission) {
        const lvl = parentMission.level ?? parentMission.recommendedLevel ?? 1
        const quality = parentMission.quality ?? "standard"
        const variantId = parentMission.variantId ?? "recon"
        scaledEnemy = createScaledEnemyUnit(encId, variantId, lvl, quality)
      }
      setCombatState(createInitialCombatState(encId, customPlayer, scaledEnemy))
      return
    }

    const saved = loadStarfrontProgression()
    setProgression(saved)
    setHasLoadedProgression(true)
    setAudioMutedState(isAudioMuted())
    // Cập nhật trận đấu ban đầu với chỉ số thực tế
    const customPlayer = buildPlayerCombatUnit(saved)
    setCombatState(createInitialCombatState("scout-drone", customPlayer))
  }, [])

  // Tự động lưu tiến trình mỗi khi có thay đổi quan trọng (EXP, Level, Credits, Trang bị)
  useEffect(() => {
    if (hasLoadedProgression && !worldBattleContext) {
      saveStarfrontProgression(progression)
      if (onUpdateProgression) {
        onUpdateProgression(progression)
      }
    }
  }, [progression, hasLoadedProgression, worldBattleContext])

  // Thực hiện lượt đi của Kẻ địch ngay lập tức (dùng cho cả timer tự động và click thủ công)
  const performEnemyTurn = () => {
    if (combatState.status !== "enemy-turn" || combatState.enemy.hp <= 0) return
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current)
      aiTimeoutRef.current = null
    }
    setCombatState((prev) => {
      if (prev.status !== "enemy-turn" || prev.enemy.hp <= 0) return prev
      const next = executeEnemyAIAction(prev)
      if (next.lastAction) {
        if (next.lastAction.damage) {
          playImpactSound(next.lastAction.isCrit)
        }
        const hasAegisReflect = next.logs.some(
          (l) => l.turn === prev.turnNumber && l.text.includes("[NỘI TẠI AEGIS 🛡️]"),
        )
        const reflectDamage = hasAegisReflect && next.lastAction.damage ? Math.max(1, Math.round(next.lastAction.damage * 0.2)) : 0
        setFloatingNotification({
          text: next.lastAction.isEvaded
            ? "NÉ TRÁNH 💨"
            : next.lastAction.damage
              ? hasAegisReflect
                ? `-${next.lastAction.damage} HP (Phản đòn -${reflectDamage})`
                : `-${next.lastAction.damage} HP`
              : next.lastAction.effectApplied || "Kích hoạt",
          isCrit: next.lastAction.isCrit,
          isPlayer: false,
        })
        setTimeout(() => setFloatingNotification(null), 1600)

        // Spawn energetic CombatText over player side
        if (next.lastAction.isEvaded) {
          spawnCombatText({
            text: "MISS // NÉ TRÁNH",
            type: "evade",
            target: "left",
            tag: "EVA 💨",
            subtitle: "Hệ thống phản lực né đòn thành công",
          })
        } else if (next.lastAction.damage) {
          spawnCombatText({
            text: `-${next.lastAction.damage}`,
            type: next.lastAction.isCrit ? "crit" : "damage-enemy",
            target: "left",
            tag: next.lastAction.isCrit ? "CRIT DAMAGE" : "HULL DAMAGE",
            subtitle: hasAegisReflect ? `Aegis phản thương: -${reflectDamage} HP` : undefined,
          })
          if (hasAegisReflect && reflectDamage > 0) {
            spawnCombatText({
              text: `REFLECT -${reflectDamage}`,
              type: "shield",
              target: "right",
              tag: "PHẢN ĐÒN 🛡️",
              xOffset: 15,
              yOffset: -20,
            })
          }
        } else if (next.lastAction.effectApplied) {
          spawnCombatText({
            text: next.lastAction.effectApplied,
            type: "status",
            target: "left",
            tag: "STATUS",
          })
        }
      }
      return next
    })
    setIsProcessingAI(false)
  }

  // Đổi mục tiêu hoặc khởi động lại trận đấu
  const handleStartEncounter = (
    encounterId: EnemyEncounterType,
    currentProg: StarfrontProgression = progression,
    missionContext?: CampaignMission | null,
  ) => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current)
      aiTimeoutRef.current = null
    }
    setSelectedEncounter(encounterId)
    const effectiveMission = missionContext !== undefined ? missionContext : activeCampaignMission
    if (missionContext !== undefined) {
      setActiveCampaignMission(missionContext)
    }
    setIsProcessingAI(false)
    rewardClaimedRef.current = false
    defeatRecordedRef.current = false
    setLastVictoryReward(null)

    const playerUnit = buildPlayerCombatUnit(currentProg)
    let scaledEnemyUnit: CombatUnit | undefined = undefined
    if (effectiveMission) {
      const override = currentProg.missionOverrides?.[effectiveMission.id]
      const qData =
        findCampaignQuest(effectiveMission.id) ||
        STANDARD_CAMPAIGN_QUESTS.find((q) => q.id === effectiveMission.id)
      const lvl = effectiveMission.level ?? qData?.level ?? effectiveMission.recommendedLevel ?? 1
      const quality = override?.quality ?? effectiveMission.quality ?? qData?.quality ?? "standard"
      const variantId = override?.variantId ?? effectiveMission.variantId ?? qData?.variantId ?? "recon"
      scaledEnemyUnit = createScaledEnemyUnit(encounterId, variantId, lvl, quality)
    }
    setCombatState(createInitialCombatState(encounterId, playerUnit, scaledEnemyUnit))
  }

  // Đổi lớp Gear (Vanguard, Falcon, Aegis)
  const handleSelectGear = (gearId: StarfrontGearId) => {
    playClickSound()
    const updated: StarfrontProgression = {
      ...progression,
      activeGearId: gearId,
    }
    setProgression(updated)
    saveStarfrontProgression(updated)
    handleStartEncounter(selectedEncounter, updated, activeCampaignMission)
  }

  // Chuyển đổi tab phân hệ và luôn đồng bộ buồng lái chiến đấu nếu lớp Gear hoặc trang bị thay đổi
  const handleSwitchTab = (targetSubView: "combat" | "campaign" | "hangar" | "shop") => {
    playClickSound()
    setActiveSubView(targetSubView)
    if (targetSubView === "combat") {
      const currentGear = progression.activeGearId || "vanguard"
      const expectedUnit = buildPlayerCombatUnit(progression)
      const isOutOfSync =
        combatState.player.gearType !== currentGear ||
        combatState.player.attack !== expectedUnit.attack ||
        combatState.player.defense !== expectedUnit.defense ||
        combatState.player.speed !== expectedUnit.speed ||
        combatState.player.maxHp !== expectedUnit.maxHp

      if (
        isOutOfSync &&
        (combatState.turnNumber === 1 ||
          combatState.status === "victory" ||
          combatState.status === "defeat")
      ) {
        handleStartEncounter(selectedEncounter, progression, activeCampaignMission)
      }
    }
  }

  // Luôn đồng bộ lại combatState nếu lớp Gear của người chơi thay đổi
  useEffect(() => {
    if (!hasLoadedProgression) return
    const currentGear = progression.activeGearId || "vanguard"
    if (combatState.player.gearType !== currentGear) {
      handleStartEncounter(selectedEncounter, progression, activeCampaignMission)
    }
  }, [progression.activeGearId, hasLoadedProgression])

  // Bật / Tắt âm thanh Sci-Fi Web Audio
  const handleToggleAudio = () => {
    const nextMute = !audioMuted
    setAudioMutedState(nextMute)
    setAudioMuted(nextMute)
    if (!nextMute) {
      playClickSound()
    }
  }

  // Xử lý lượt đi của AI Kẻ địch với delay tự nhiên (700ms)
  // Quan trọng: KHÔNG đưa isProcessingAI vào dependency array để tránh bị hủy timer khi re-render
  useEffect(() => {
    if (combatState.status === "enemy-turn" && combatState.enemy.hp > 0) {
      setIsProcessingAI(true)
      aiTimeoutRef.current = setTimeout(() => {
        performEnemyTurn()
      }, 700)

      return () => {
        if (aiTimeoutRef.current) {
          clearTimeout(aiTimeoutRef.current)
          aiTimeoutRef.current = null
        }
      }
    } else {
      setIsProcessingAI(false)
    }
  }, [combatState.status, combatState.turnNumber])

  // Xử lý trao thưởng duy nhất 1 lần khi CHIẾN THẮNG (Tích hợp thưởng Ải Chiến Dịch & Đấu Trường)
  useEffect(() => {
    if (combatState.status === "victory" && !rewardClaimedRef.current) {
      rewardClaimedRef.current = true
      playVictorySound()

      // NẾU LÀ TRẬN ĐẤU THỰC ĐỊA TỪ STARFRONT WORLD (PHASE 6.23):
      if (worldBattleContext) {
        if (!worldCommittedRef.current) {
          worldCommittedRef.current = true
          try {
            const receipt = buildCombatReceiptFromCombatState(combatState, worldBattleContext.snapshot, true)
            const loadRes = loadWorldState()
            const wState = loadRes.state
            const resolution = commitCombatResultReceipt(wState, receipt)
            saveWorldState(wState)
            setWorldResolutionResult(resolution)
          } catch (err: any) {
            console.error("Error committing WORLD victory receipt:", err)
          }
        }
        // TUYỆT ĐỐI KHÔNG GHI THƯỞNG VÀO RPG PROGRESSION!
        return
      }

      setProgression((prev) => {
        if (activeCampaignMission) {
          const { updated, reward, dropItem, isFirstClear } = applyMissionClearReward(
            prev,
            activeCampaignMission,
          )
          if (reward.leveledUp) {
            setTimeout(playLevelUpSound, 600)
          }
          setLastVictoryReward({
            reward,
            dropItem,
            missionTitle: activeCampaignMission.title,
            isFirstClear,
          })
          saveStarfrontProgression(updated)
          return updated
        } else {
          const { updated, reward, dropItem } = applyVictoryReward(prev, selectedEncounter)
          if (reward.leveledUp) {
            setTimeout(playLevelUpSound, 600)
          }
          setLastVictoryReward({ reward, dropItem })
          saveStarfrontProgression(updated)
          return updated
        }
      })
    }
  }, [combatState.status, selectedEncounter, activeCampaignMission, worldBattleContext])

  // Xử lý ghi nhận trận thua duy nhất 1 lần khi THẤT BẠI
  useEffect(() => {
    if (combatState.status === "defeat" && !defeatRecordedRef.current) {
      defeatRecordedRef.current = true

      // NẾU LÀ TRẬN ĐẤU THỰC ĐỊA TỪ STARFRONT WORLD (PHASE 6.23):
      if (worldBattleContext) {
        if (!worldCommittedRef.current) {
          worldCommittedRef.current = true
          try {
            const receipt = buildCombatReceiptFromCombatState(combatState, worldBattleContext.snapshot, false)
            const loadRes = loadWorldState()
            const wState = loadRes.state
            const resolution = commitCombatResultReceipt(wState, receipt)
            saveWorldState(wState)
            setWorldResolutionResult(resolution)
          } catch (err: any) {
            console.error("Error committing WORLD defeat receipt:", err)
          }
        }
        // TUYỆT ĐỐI KHÔNG GHI PHẠT VÀO RPG PROGRESSION!
        return
      }

      setProgression((prev) => applyDefeatRecord(prev))
    }
  }, [combatState.status, worldBattleContext])

  // Người chơi bấm kích hoạt kỹ năng
  const handleUseSkill = (skillId: string) => {
    if (combatState.status !== "player-turn" || isProcessingAI) return

    if (!isValidPilotGearSelection(progression)) {
      setFloatingNotification({
        text: "⚠️ BẮT BUỘC CHỌN NHÂN VẬT & CƠ GIÁP TRƯỚC KHI THI ĐẤU!",
        isCrit: false,
        isPlayer: false,
      })
      setTimeout(() => setFloatingNotification(null), 2000)
      return
    }

    const skill = combatState.player.skills.find((s) => s.id === skillId)
    if (skill?.targetType === "self") {
      playShieldSound()
    } else {
      playLaserSound()
    }

    const next = executePlayerAction(combatState, skillId)
    if (next.lastAction) {
      if (next.lastAction.damage) {
        setTimeout(() => playImpactSound(next.lastAction?.isCrit), 80)
      }
      const hasFalconFollowUp = next.logs.some(
        (l) => l.turn === combatState.turnNumber && l.text.includes("[NỘI TẠI FALCON ⚡]"),
      )
      setFloatingNotification({
        text: next.lastAction.isEvaded
          ? "NÉ TRÁNH 💨"
          : hasFalconFollowUp
            ? `🔥 BẠO KÍCH + BẮN BỒI! -${next.lastAction.damage} HP`
            : next.lastAction.damage
              ? `-${next.lastAction.damage} HP`
              : next.lastAction.effectApplied || "Kích hoạt",
        isCrit: next.lastAction.isCrit,
        isPlayer: true,
      })
      setTimeout(() => setFloatingNotification(null), 1800)

      // Spawn floating CombatText over enemy side
      if (next.lastAction.isEvaded) {
        spawnCombatText({
          text: "EVADED // NÉ TRÁNH",
          type: "evade",
          target: "right",
          tag: "MISS",
          subtitle: "Mục tiêu cơ động thành công",
        })
      } else if (next.lastAction.damage) {
        spawnCombatText({
          text: `-${next.lastAction.damage}`,
          type: next.lastAction.isCrit ? "crit" : "damage-player",
          target: "right",
          tag: next.lastAction.isCrit ? "CRIT DAMAGE 🔥" : "HIT",
          subtitle: hasFalconFollowUp ? "Falcon Kích Hoạt Bắn Bồi ⚡" : undefined,
        })
      } else if (next.lastAction.effectApplied) {
        spawnCombatText({
          text: next.lastAction.effectApplied,
          type: "status",
          target: "right",
          tag: "BUFF/DEBUFF",
        })
      }
    }
    setCombatState(next)
  }

  // Thao tác Trang bị vật phẩm trong Hangar
  const handleEquipItem = (itemId: string, slot: StarfrontItemSlot) => {
    playClickSound()
    setProgression((prev) => {
      const updated: StarfrontProgression = {
        ...prev,
        equipped: {
          ...prev.equipped,
          [slot]: itemId,
        },
      }
      return updated
    })
  }

  // Thao tác Tháo trang bị trong Hangar
  const handleUnequipSlot = (slot: StarfrontItemSlot) => {
    playClickSound()
    setProgression((prev) => {
      const updated: StarfrontProgression = {
        ...prev,
        equipped: {
          ...prev.equipped,
          [slot]: null,
        },
      }
      return updated
    })
  }

  // Reset toàn bộ tiến trình
  const handleResetSave = () => {
    playClickSound()
    const fresh = resetStarfrontProgression()
    setProgression(fresh)
    handleStartEncounter("scout-drone", fresh, null)
  }

  // Thao tác Cường hóa trang bị trong Hangar (Phase 5 Milestone 5.1)
  const handleEnhanceItem = (itemId: string) => {
    const { updated, result } = enhanceItem(progression, itemId)
    setProgression(updated)
    saveStarfrontProgression(updated)
    if (result.success) {
      playLevelUpSound()
      const isEquipped = Object.values(updated.equipped).includes(itemId)
      if (isEquipped) {
        const newUnit = buildPlayerCombatUnit(updated)
        setCombatState((prev) => ({
          ...prev,
          player: {
            ...prev.player,
            attack: newUnit.attack,
            defense: newUnit.defense,
            speed: newUnit.speed,
            hp: Math.min(prev.player.hp, newUnit.hp),
            maxHp: newUnit.maxHp,
            maxSp: newUnit.maxSp,
          },
        }))
      }
    } else {
      playShieldSound()
    }
    return result
  }

  const { player, enemy, status, logs, turnNumber } = combatState
  const playerEffectiveSpeed = getEffectiveSpeed(player)
  const enemyEffectiveSpeed = getEffectiveSpeed(enemy)
  const playerFirst = playerEffectiveSpeed >= enemyEffectiveSpeed

  const renderStatusBadge = (eff: StatusEffect) => {
    let badgeColor = "bg-cyan-500/20 border-cyan-400/50 text-cyan-200"
    let IconComponent = Shield

    if (eff.type === "plasma-burn") {
      badgeColor = "bg-orange-500/20 border-orange-400/50 text-orange-200 animate-pulse"
      IconComponent = Flame
    } else if (eff.type === "acid-corrosion") {
      badgeColor = "bg-lime-500/20 border-lime-400/50 text-lime-200"
      IconComponent = ShieldAlert
    } else if (eff.type === "emp-slow") {
      badgeColor = "bg-blue-500/20 border-blue-400/50 text-blue-200"
      IconComponent = Zap
    } else if (eff.type === "ecm-jamming") {
      badgeColor = "bg-teal-500/20 border-teal-400/50 text-teal-200"
      IconComponent = Target
    } else if (eff.type === "stun") {
      badgeColor = "bg-yellow-500/20 border-yellow-400/50 text-yellow-200 animate-bounce"
      IconComponent = AlertTriangle
    } else if (eff.type === "charge-ultimate") {
      badgeColor = "bg-red-500/30 border-red-400 text-red-200 animate-pulse font-bold"
      IconComponent = AlertTriangle
    } else if (eff.type === "boss-overdrive") {
      badgeColor = "bg-rose-500/30 border-rose-400 text-rose-200 font-bold"
      IconComponent = Flame
    } else if (eff.type === "armor-break") {
      badgeColor = "bg-amber-500/20 border-amber-400/50 text-amber-200"
      IconComponent = ShieldAlert
    }

    return (
      <span
        key={eff.id}
        title={eff.desc}
        className={cn("flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold shadow-xs", badgeColor)}
      >
        <IconComponent className="size-3" />
        <span>{eff.name}</span>
        {eff.stacks && eff.stacks > 1 && (
          <span className="rounded bg-black/50 px-1 text-[9px] text-white">x{eff.stacks}</span>
        )}
        <span className="opacity-80">({eff.duration}l)</span>
      </span>
    )
  }

  const playerHpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))
  const playerSpPct = Math.max(0, Math.min(100, (player.sp / player.maxSp) * 100))
  const enemyHpPct = Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100))
  const enemySpPct = Math.max(0, Math.min(100, (enemy.sp / enemy.maxSp) * 100))

  // Tính toán dự đoán sát thương khi di chuột / chọn kỹ năng (Damage Projection Preview)
  const hoveredSkill = player.skills.find((s) => s.id === hoveredSkillId)
  const isPilotSynergyPreview = hoveredSkillId === "pilot-synergy" && player.pilotSynergySkill && !player.pilotSynergySkill.isPassive
  const previewDamageSkill = hoveredSkill && hoveredSkill.targetType !== "self"
    ? hoveredSkill
    : null

  const projectedDamage = previewDamageSkill
    ? Math.max(1, Math.round(
        Math.round(getEffectiveAttack(player) * (previewDamageSkill.damageMultiplier || 1.0)) *
        (100 / (100 + getEffectiveDefense(enemy)))
      ))
    : isPilotSynergyPreview
      ? Math.max(1, Math.round(
          Math.round(getEffectiveAttack(player) * 1.5) *
          (100 / (100 + getEffectiveDefense(enemy)))
        ))
      : 0

  const projectedEnemyHp = Math.max(0, enemy.hp - projectedDamage)
  const projectedEnemyHpPct = Math.max(0, Math.min(100, (projectedEnemyHp / enemy.maxHp) * 100))

  const expRequired = getExpRequiredForLevel(progression.level)
  const expPct = Math.min(100, Math.round((progression.exp / expRequired) * 100))

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Header Thanh Tiến Trình Cấp Độ & Chuyển Đổi Tab Con (Chỉ hiển thị khi chạy độc lập ngoài StarfrontShell) */}
      {!isEmbeddedInShell && (
        <div className={cn("rounded-sm border bg-black/60 p-3 shadow-xl backdrop-blur-md", currentTheme.border)}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Thông tin cấp độ & EXP & Credits */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2.5">
                <span className={cn("flex size-8 items-center justify-center rounded-xs font-mono text-sm font-black border", currentTheme.badgeBg, currentTheme.badgeText, currentTheme.badgeBorder)}>
                  {activeGearDef.name.charAt(0)}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-bold text-white tracking-wider">
                      {activeGearDef.name.toUpperCase()}
                    </span>
                    <span className={cn("rounded px-1.5 py-0.2 font-mono text-xs font-bold border", currentTheme.badgeBg, currentTheme.badgeText, currentTheme.badgeBorder)}>
                      CẤP {progression.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                    <span>EXP: {progression.exp} / {expRequired} ({expPct}%)</span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-amber-300">
                      <Coins className="size-3 text-amber-400" />
                      <strong>{progression.credits.toLocaleString("vi-VN")}</strong> Credits
                    </span>
                  </div>
                </div>
              </div>

              {/* Thanh EXP mini */}
              <div className="hidden sm:block w-36">
                <div className="h-1.5 w-full overflow-hidden rounded-xs bg-secondary">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${expPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Nút chuyển đổi giữa Đấu trường, Bản đồ chiến dịch, Hangar và Chợ */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => handleSwitchTab("combat")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xs border px-3 py-1.5 font-display text-xs transition-all cursor-pointer",
                  activeSubView === "combat"
                    ? "border-cyan-400 bg-cyan-950/80 text-cyan-200 font-bold shadow-[0_0_10px_rgba(34,211,238,0.25)]"
                    : "border-border/60 text-muted-foreground hover:text-foreground",
                )}
              >
                <Sword className="size-3.5" />
                <span>Đấu Trường</span>
              </button>

              <button
                onClick={() => handleSwitchTab("campaign")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xs border px-3 py-1.5 font-display text-xs transition-all cursor-pointer",
                  activeSubView === "campaign"
                    ? "border-cyan-400 bg-cyan-950/80 text-cyan-200 font-bold shadow-[0_0_10px_rgba(34,211,238,0.25)]"
                    : "border-border/60 text-muted-foreground hover:text-foreground",
                )}
              >
                <Globe2 className="size-3.5 text-cyan-400" />
                <span>Bản Đồ Chiến Dịch ({progression.completedMissions.length}/9)</span>
              </button>

              <button
                onClick={() => handleSwitchTab("hangar")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xs border px-3 py-1.5 font-display text-xs transition-all cursor-pointer",
                  activeSubView === "hangar"
                    ? "border-cyan-400 bg-cyan-950/80 text-cyan-200 font-bold shadow-[0_0_10px_rgba(34,211,238,0.25)]"
                    : "border-border/60 text-muted-foreground hover:text-foreground",
                )}
              >
                <Boxes className="size-3.5" />
                <span>Kho Đồ & Hangar ({progression.inventory.length})</span>
              </button>

              <button
                onClick={() => handleSwitchTab("shop")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xs border px-3 py-1.5 font-display text-xs transition-all cursor-pointer",
                  activeSubView === "shop"
                    ? "border-amber-400 bg-amber-950/80 text-amber-200 font-bold shadow-[0_0_10px_rgba(251,191,36,0.25)]"
                    : "border-border/60 text-muted-foreground hover:text-foreground",
                )}
              >
                <ShoppingBag className="size-3.5 text-amber-400" />
                <span>Chợ Quân Sự</span>
              </button>

              {/* Nút bật tắt âm thanh Web Audio */}
              <button
                onClick={handleToggleAudio}
                title={audioMuted ? "Bật âm thanh Sci-Fi" : "Tắt âm thanh"}
                className="flex size-7 items-center justify-center rounded-xs border border-border/60 bg-black/40 text-muted-foreground hover:text-foreground hover:border-cyan-400 cursor-pointer transition-colors ml-1"
              >
                {audioMuted ? <VolumeX className="size-3.5 text-red-400" /> : <Volume2 className="size-3.5 text-cyan-400" />}
              </button>

              {/* Nút bật tắt Dev Combat Test Controls (Phase 5.2) */}
              <button
                onClick={() => {
                  playClickSound()
                  setShowDevTestPanel(!showDevTestPanel)
                }}
                title="Mở Bảng Điều Khiển Kiểm Thử Nội Tại Combat (Milestone 5.2)"
                className={cn(
                  "flex items-center gap-1 rounded-xs border px-2.5 py-1 text-xs font-mono transition-all cursor-pointer ml-1",
                  showDevTestPanel
                    ? "border-amber-400 bg-amber-950/80 text-amber-300 font-bold shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                    : "border-border/60 bg-black/40 text-muted-foreground hover:text-amber-300 hover:border-amber-400/50",
                )}
              >
                <FlaskConical className="size-3.5 text-amber-400" />
                <span className="hidden sm:inline font-bold">🛠️ Test Mode 5.2</span>
                {showDevTestPanel ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HIỂN THỊ PHÂN HỆ THEO TAB: CHIẾN DỊCH, CHỢ, HANGAR (Chỉ dùng khi chạy độc lập ngoài Shell) */}
      {!isEmbeddedInShell && activeSubView === "campaign" && (
        <CampaignMap
          progression={progression}
          onUpdateProgression={(updated) => {
            setProgression(updated)
            saveStarfrontProgression(updated)
            onUpdateProgression?.(updated)
          }}
          onDeployMission={(mission) => {
            setActiveCampaignMission(mission)
            setActiveSubView("combat")
            handleStartEncounter(mission.encounterId, progression, mission)
          }}
        />
      )}

      {!isEmbeddedInShell && activeSubView === "shop" && (
        <StarfrontShop
          progression={progression}
          onUpdateProgression={(updated) => {
            setProgression(updated)
            saveStarfrontProgression(updated)
            onUpdateProgression?.(updated)
          }}
        />
      )}

      {!isEmbeddedInShell && activeSubView === "hangar" && (
        <StarfrontHangar
          progression={progression}
          onEquipItem={handleEquipItem}
          onUnequipSlot={handleUnequipSlot}
          onEnhanceItem={handleEnhanceItem}
          onUpdateProgression={(updated) => {
            setProgression(updated)
            onUpdateProgression?.(updated)
          }}
          onResetSave={handleResetSave}
          onSelectGear={handleSelectGear}
          onNavigateToCombat={() => {
            handleSwitchTab("combat")
            handleStartEncounter(selectedEncounter, progression, activeCampaignMission)
          }}
        />
      )}

      {(isEmbeddedInShell || activeSubView === "combat") && (
        <>
          {/* Cảnh báo nếu chưa khóa nhân vật */}
          {!progression.activePairing?.isLocked && (
            <div className="rounded-sm border border-amber-500/70 bg-gradient-to-r from-amber-950/80 via-panel to-amber-950/60 p-3 shadow-lg flex flex-wrap items-center justify-between gap-3 font-mono text-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="size-4 text-amber-400 shrink-0 animate-pulse" />
                <div>
                  <span className="font-bold text-amber-300 uppercase block">
                    CẢNH BÁO: CHƯA KHÓA NHÂN VẬT & CƠ GIÁP XUẤT KÍCH
                  </span>
                  <span className="text-[11px] text-slate-300">
                    Vui lòng chọn và khóa cặp đôi trong phân hệ "Nhân Vật & Cơ Giáp" để chốt tổ hợp tham chiến chính thức!
                  </span>
                </div>
              </div>

              {onNavigateSection && (
                <Button
                  size="xs"
                  onClick={() => {
                    playClickSound()
                    onNavigateSection("character-gear")
                  }}
                  className="gap-1 text-xs bg-amber-500 text-black hover:bg-amber-400 font-bold"
                >
                  <Lock className="size-3" />
                  <span>Đến Khóa Nhân Vật</span>
                </Button>
              )}
            </div>
          )}

          {/* Banner thông báo khi đang thực hiện trận chiến thực địa STARFRONT WORLD (Phase 6.23) */}
          {worldBattleContext && (
            <div className="rounded-sm border border-cyan-400 bg-gradient-to-r from-cyan-950/90 via-black to-zinc-950 p-3 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <Globe2 className="size-5 text-cyan-400 animate-pulse shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xs font-black uppercase text-cyan-300 tracking-wider">
                      CHIẾN TRƯỜNG THỰC ĐỊA STARFRONT WORLD: {worldBattleContext.sectorName.toUpperCase()}
                    </span>
                    <span className="rounded bg-cyan-950 px-1.5 py-0.2 font-mono text-[9px] text-cyan-400 border border-cyan-500/40">
                      TX: {worldBattleContext.transactionId}
                    </span>
                    {worldBattleContext.resumedFromSuspended && (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.2 font-mono text-[9px] text-amber-300 border border-amber-500/40 font-bold">
                        KHÔI PHỤC TỪ TRẬN TREO
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-mono text-zinc-400 mt-0.5">
                    <span>
                      Đồn trú: <strong className="text-white">{worldBattleContext.snapshot.lockedGarrison.toLocaleString()}</strong> quân
                    </span>
                    <span>·</span>
                    <span>
                      Công sự: <strong className="text-emerald-400">Cấp {worldBattleContext.snapshot.friendlyModifiers.fortificationLevel}</strong> (Thủ +{Math.round((worldBattleContext.snapshot.friendlyModifiers.defenseMultiplier - 1) * 100)}%)
                    </span>
                    <span>·</span>
                    <span>
                      Sĩ khí: <strong className="text-cyan-400">+{Math.round((worldBattleContext.snapshot.friendlyModifiers.moraleMultiplier - 1) * 100)}%</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Mục tiêu: <strong className="text-amber-300">{worldBattleContext.snapshot.winConditions.objective === "eliminate_enemy" ? "Tiêu diệt kẻ địch" : "Phòng thủ"}</strong> (Tối đa {worldBattleContext.snapshot.winConditions.maxRounds || 20} lượt)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    playClickSound()
                    setIsRetreatModalOpen(true)
                  }}
                  className="gap-1 text-xs border-red-500/60 text-red-300 hover:bg-red-950/60 cursor-pointer"
                  title="Mở tùy chọn rút lui chiến lược"
                >
                  <Flag className="size-3" />
                  <span>Rút Lui Chiến Lược</span>
                </Button>
              </div>
            </div>
          )}

          {/* Banner thông báo khi đang thực hiện nhiệm vụ chiến dịch */}
          {!worldBattleContext && activeCampaignMission && (
            <div className="rounded-sm border border-cyan-400/60 bg-gradient-to-r from-cyan-950/60 via-black/70 to-cyan-950/60 p-3 shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Globe2 className="size-4 text-cyan-400 animate-pulse" />
                <div>
                  <span className="font-display text-xs font-bold text-white block">
                    ĐANG THỰC HIỆN NHIỆM VỤ: {activeCampaignMission.title}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Khu vực: {activeCampaignMission.sectorName} · Đề xuất Cấp {activeCampaignMission.recommendedLevel}+
                  </span>
                </div>
              </div>

              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  playClickSound()
                  if (onClearCampaignMission) {
                    onClearCampaignMission()
                  } else {
                    setActiveCampaignMission(null)
                  }
                  if (onNavigateSection) {
                    onNavigateSection("missions")
                  } else {
                    setActiveSubView("campaign")
                  }
                }}
                className="gap-1 text-xs border-cyan-500/50 text-cyan-300 hover:bg-cyan-950/50"
              >
                <ArrowLeft className="size-3" /> Về Bản Đồ Chiến Dịch
              </Button>
            </div>
          )}

          {/* 🛠️ BẢNG ĐIỀU KHIỂN KIỂM THỬ NỘI TẠI (DEV COMBAT TEST CONTROLS — MILESTONE 5.2) */}
          {showDevTestPanel && (
            <div className="rounded-sm border border-amber-500/60 bg-black/95 p-3.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 pb-2">
                <div className="flex items-center gap-2">
                  <FlaskConical className="size-4 text-amber-400" />
                  <span className="font-display text-xs font-bold text-amber-300 uppercase tracking-wider">
                    BẢNG ĐIỀU KHIỂN KIỂM THỬ NỘI TẠI (DEV COMBAT TEST CONTROLS — PHASE 5.2)
                  </span>
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-mono text-amber-300 border border-amber-500/40">
                    UI TEST HARNESS
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Kích hoạt trực tiếp các kịch bản test nội tại để xác minh tức thì trên giao diện
                </span>
              </div>

              {/* Hàng 1: Đổi Lớp Gear Nhanh Trong Trận Đấu */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-muted-foreground">Đổi Gear Thử Nghiệm:</span>
                {(["vanguard", "falcon", "aegis"] as StarfrontGearId[]).map((gId) => {
                  const def = STARFRONT_GEAR_DEFS[gId]
                  const isCurrent = activeGearId === gId
                  return (
                    <button
                      key={gId}
                      onClick={() => handleDevSelectGear(gId)}
                      className={cn(
                        "rounded px-2.5 py-1 text-xs font-mono border transition-all cursor-pointer flex items-center gap-1.5",
                        isCurrent
                          ? "border-cyan-400 bg-cyan-950/80 text-cyan-200 font-bold shadow-[0_0_8px_rgba(34,211,238,0.3)]"
                          : "border-border/60 bg-black/50 text-muted-foreground hover:text-white hover:border-border",
                      )}
                    >
                      <span className="size-2 rounded-full" style={{ backgroundColor: def.color }} />
                      <span>{def.name}</span>
                      <span className="text-[10px] text-amber-300 opacity-90">({def.passive.name})</span>
                    </button>
                  )
                })}
              </div>

              {/* Hàng 2: Các Kịch Bản Kích Hoạt Tức Thì (1-Click Test Scenarios) */}
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {/* Test Case 1: Vanguard */}
                <button
                  onClick={handleDevTestVanguard}
                  className="flex flex-col justify-between rounded border border-cyan-500/40 bg-cyan-950/20 p-2 text-left hover:bg-cyan-950/40 hover:border-cyan-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                    <Zap className="size-3.5 text-amber-400 shrink-0" />
                    <span>TC-VG-01: Vanguard SP & CD Chu Kỳ 3</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
                    Đặt Lượt 3, SP=50, CD=2. Hành động để hồi +5 SP (tổng +10) và giảm thêm 1 CD!
                  </p>
                </button>

                {/* Test Case 2: Falcon Crit & Follow-up */}
                <button
                  onClick={handleDevTestFalconCrit}
                  className="flex flex-col justify-between rounded border border-purple-500/40 bg-purple-950/20 p-2 text-left hover:bg-purple-950/40 hover:border-purple-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                    <Sparkles className="size-3.5 text-amber-400 shrink-0" />
                    <span>TC-FL-01: Falcon Bạo Kích & Bắn Bồi</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
                    Ép bạo kích 100% kích hoạt thêm 1 đòn bắn bồi không tốn SP gây thêm sát thương!
                  </p>
                </button>

                {/* Test Case 3: Falcon Evasion */}
                <button
                  onClick={handleDevTestFalconEvade}
                  className="flex flex-col justify-between rounded border border-purple-500/40 bg-purple-950/20 p-2 text-left hover:bg-purple-950/40 hover:border-purple-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                    <Wind className="size-3.5 text-cyan-400 shrink-0" />
                    <span>TC-FL-02: Falcon Né Tránh Đòn</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
                    Ép địch đánh trượt vào trạng thái né tránh của Falcon (+15% né bẩm sinh).
                  </p>
                </button>

                {/* Test Case 4: Aegis Damage Reflection */}
                <button
                  onClick={handleDevTestAegisReflect}
                  className="flex flex-col justify-between rounded border border-amber-500/40 bg-amber-950/20 p-2 text-left hover:bg-amber-950/40 hover:border-amber-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <Shield className="size-3.5 text-amber-400 shrink-0" />
                    <span>TC-AG-01: Aegis Phản Đòn Gai 20%</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
                    Địch giáng đòn vào Aegis, khiên gai lập tức phản 20% sát thương thẳng vào địch!
                  </p>
                </button>

                {/* Test Case 5: Aegis Resistance */}
                <button
                  onClick={handleDevTestAegisResist}
                  className="flex flex-col justify-between rounded border border-amber-500/40 bg-amber-950/20 p-2 text-left hover:bg-amber-950/40 hover:border-amber-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <ShieldAlert className="size-3.5 text-emerald-400 shrink-0" />
                    <span>TC-AG-02: Aegis Kháng 50% Làm Chậm/Giáp</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
                    Áp dụng EMP & Phá Giáp lên Aegis, kiểm tra mức phạt bị triệt tiêu 50%!
                  </p>
                </button>

                {/* Test Case 6: Non-trigger control */}
                <button
                  onClick={handleDevTestNonTrigger}
                  className="flex flex-col justify-between rounded border border-red-500/40 bg-red-950/20 p-2 text-left hover:bg-red-950/40 hover:border-red-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-300">
                    <AlertTriangle className="size-3.5 text-red-400 shrink-0" />
                    <span>TC-NON-01: Test Không Kích Hoạt</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
                    Vanguard ở Lượt 1 (không phải lượt 3) không giảm thêm CD; Không phản đòn nếu không phải Aegis!
                  </p>
                </button>

                {/* Test Case 7: Demo Rã Đồ & Thu Hồi Alloy (Milestone 5.3) */}
                <button
                  onClick={handleDevAddSalvageTestItem}
                  className="flex flex-col justify-between rounded border border-emerald-500/40 bg-emerald-950/20 p-2 text-left hover:bg-emerald-950/40 hover:border-emerald-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <Recycle className="size-3.5 text-emerald-400 shrink-0" />
                    <span>TC-SLV-01: Thêm Đồ Epic (+3) Để Test Rã</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
                    Thêm 1 món Epic (+3) vào kho. Vào Hangar hoặc Chợ mở Rã Đồ để xem trước Alloy & Credits hoàn trả!
                  </p>
                </button>

                {/* Test Case 8: Hardened State Sync (Milestone 5.4) */}
                <button
                  onClick={handleDevTestStateSync}
                  className="flex flex-col justify-between rounded border border-cyan-500/40 bg-cyan-950/20 p-2 text-left hover:bg-cyan-950/40 hover:border-cyan-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                    <RefreshCw className="size-3.5 text-cyan-400 shrink-0" />
                    <span>TC-SYNC-01: Chu Kỳ Đổi & Đồng Bộ Gear (5.4)</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
                    Đổi tức thời VG ➔ FL ➔ AG. Đồng bộ ngay 4 kỹ năng, SPD, né tránh, tên buồng lái và theme màu sắc!
                  </p>
                </button>

                {/* Test Case 9: Schema v3 & Migration Verification (Milestone 5.4) */}
                <button
                  onClick={handleDevTestSchemaMigration}
                  className="flex flex-col justify-between rounded border border-blue-500/40 bg-blue-950/20 p-2 text-left hover:bg-blue-950/40 hover:border-blue-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
                    <Database className="size-3.5 text-blue-400 shrink-0" />
                    <span>TC-MIG-01: Xác Thực Schema v3 & Migration (5.4)</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
                    Kiểm tra LocalStorage Schema v3: version = 3, 100% trang bị có enhancementLevel, bảo toàn tài nguyên!
                  </p>
                </button>

                {/* Test Case 10: Mission Scaling & Boss Bastion (Milestone 5.5) */}
                <button
                  onClick={handleDevTestMissionScaling}
                  className="flex flex-col justify-between rounded border border-amber-500/40 bg-amber-950/20 p-2 text-left hover:bg-amber-950/40 hover:border-amber-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <Trophy className="size-3.5 text-amber-400 shrink-0" />
                    <span>TC-SCALE-01: Boss Colossus Lv.9 Legendary (5.5)</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
                    Kích hoạt Ải 3-3: Colossus Lv.9 phẩm chất Legendary (HP 5,800+, Khiên Titan Khởi Đầu, Thưởng Legendary Item)!
                  </p>
                </button>

                {/* Test Case 11: Loot System & Affix Roll (Milestone 5.5) */}
                <button
                  onClick={handleDevTestLootSystem}
                  className="flex flex-col justify-between rounded border border-purple-500/40 bg-purple-950/20 p-2 text-left hover:bg-purple-950/40 hover:border-purple-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                    <Gift className="size-3.5 text-purple-400 shrink-0" />
                    <span>TC-LOOT-01: Nhận Đồ Ngẫu Nhiên & 4 Affixes (5.5)</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
                    Sinh 1 món đồ Heroic/Legendary với các dòng thuộc tính ngẫu nhiên (ATK, DEF, SPD, HP) và lưu vào kho đồ!
                  </p>
                </button>
              </div>

              {/* Footer nút reset */}
              <div className="mt-2.5 flex items-center justify-between border-t border-amber-500/30 pt-2 text-[11px] font-mono">
                <span className="text-muted-foreground">
                  Ghi chú: Thao tác test chỉ tác động phiên thi đấu tạm thời, bảo toàn nguyên vẹn save file.
                </span>
                <button
                  onClick={handleDevResetArena}
                  className="flex items-center gap-1 text-cyan-300 hover:text-cyan-200 cursor-pointer"
                >
                  <RotateCcw className="size-3" />
                  <span>Khởi động lại sàn đấu</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. Thanh Chọn Mục Tiêu Đối Đầu / Cố Định Theo Nhiệm Vụ */}
          <div className="rounded-sm border border-cyan-500/30 bg-black/40 p-3 shadow-lg backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Target className="size-4 text-cyan-400 animate-pulse" />
                <span className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                  MỤC TIÊU TÁC CHIẾN // CHỌN ĐỐI THỦ:
                </span>
              </div>

              {worldBattleContext ? (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 rounded border border-cyan-500/60 bg-cyan-950/40 px-3 py-1.5 font-mono text-xs">
                    <Lock className="size-3.5 text-cyan-400" />
                    <span className="text-cyan-300 font-bold">
                      ĐÃ KHÓA CHIẾN SỰ THỰC ĐỊA: {enemy.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 hidden sm:inline">
                      ({worldBattleContext.sectorName})
                    </span>
                  </div>
                </div>
              ) : activeCampaignMission ? (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 rounded border border-amber-500/50 bg-amber-950/40 px-3 py-1.5 font-mono text-xs">
                    <Lock className="size-3.5 text-amber-400" />
                    <span className="text-amber-300 font-bold">
                      ĐÃ KHÓA THEO NHIỆM VỤ: {enemy.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">
                      ({activeCampaignMission.title})
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      playClickSound()
                      onClearCampaignMission?.()
                      setActiveCampaignMission(null)
                      onSelectCampaignMission?.(null)
                      handleStartEncounter("scout-drone", progression, null)
                    }}
                    className="flex items-center gap-1 rounded-xs border border-border/70 bg-secondary/40 px-2.5 py-1 text-[11px] font-mono text-muted-foreground hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
                    title="Hủy ải chiến dịch để mở khóa chọn đối thủ tự do"
                  >
                    <span>Hủy Ải (Chọn Tự Do)</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  {ENCOUNTER_INFO.map((enc) => {
                    const active = selectedEncounter === enc.id
                    return (
                      <button
                        key={enc.id}
                        onClick={() => handleStartEncounter(enc.id)}
                        className={cn(
                          "relative flex items-center gap-1.5 rounded-xs border px-3 py-1.5 font-display text-xs transition-all cursor-pointer",
                          active
                            ? "border-cyan-400 bg-cyan-950/60 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.3)] font-bold"
                            : "border-border/60 bg-panel/40 text-muted-foreground hover:border-cyan-500/40 hover:text-foreground",
                        )}
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: enc.color }}
                        />
                        <span>{enc.name}</span>
                        <span className="text-[10px] opacity-75">({enc.difficulty})</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 3. Thanh Thứ Tự Lượt Hành Động (Speed Initiative Timeline & Dynamic Turn Queue) */}
          <div className="flex items-center justify-between rounded-sm border border-border/70 bg-panel/60 px-4 py-2 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Gauge className="size-4 text-cyan-400" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Hàng đợi lượt động (SPD hiệu dụng):
              </span>
              <div className="flex items-center gap-2">
                {playerFirst ? (
                  <>
                    <span className="inline-flex items-center gap-1 rounded bg-cyan-500/20 px-2 py-0.5 font-display text-[11px] font-bold text-cyan-300 border border-cyan-500/40">
                      1. {player.name} ({playerEffectiveSpeed} SPD{playerEffectiveSpeed !== player.speed ? ` / gốc ${player.speed}` : ""})
                    </span>
                    <span className="text-muted-foreground">➔</span>
                    <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 font-display text-[11px] text-red-300 border border-red-500/30">
                      2. {enemy.name} ({enemyEffectiveSpeed} SPD{enemyEffectiveSpeed !== enemy.speed ? ` / gốc ${enemy.speed}` : ""})
                    </span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1 rounded bg-red-500/20 px-2 py-0.5 font-display text-[11px] font-bold text-red-300 border border-red-500/40">
                      1. {enemy.name} ({enemyEffectiveSpeed} SPD{enemyEffectiveSpeed !== enemy.speed ? ` / gốc ${enemy.speed}` : ""} - Ra đòn trước!)
                    </span>
                    <span className="text-muted-foreground">➔</span>
                    <span className="inline-flex items-center gap-1 rounded bg-cyan-500/10 px-2 py-0.5 font-display text-[11px] text-cyan-300 border border-cyan-500/30">
                      2. {player.name} ({playerEffectiveSpeed} SPD{playerEffectiveSpeed !== player.speed ? ` / gốc ${player.speed}` : ""})
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded bg-black/40 px-2 py-0.5 text-muted-foreground">
                Vòng đấu: <strong className="text-foreground">#{turnNumber}</strong>
              </span>
              {status === "enemy-turn" ? (
                <button
                  onClick={performEnemyTurn}
                  title="Bấm để kích hoạt lượt kẻ địch ngay lập tức (không cần chờ)"
                  className="flex items-center gap-1.5 rounded border border-amber-400/60 bg-amber-950/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 transition-colors hover:bg-amber-900 cursor-pointer shadow-[0_0_10px_rgba(251,191,36,0.25)] animate-pulse"
                >
                  <span className="size-2 rounded-full bg-amber-400" />
                  <span>KẺ ĐỊCH ĐANG HÀNH ĐỘNG... (BẤM ĐỂ ĐI NGAY ⚡)</span>
                </button>
              ) : (
                <div
                  className={cn(
                    "flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
                    status === "player-turn"
                      ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.35)] animate-pulse"
                      : status === "victory"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400"
                        : "bg-red-500/20 text-red-300 border border-red-400",
                  )}
                >
                  {status === "player-turn" && `⚡ ĐẾN LƯỢT BẠN (${activeGearDef.name.toUpperCase()}) — HÃY TẤN CÔNG!`}
                  {status === "victory" && "CHIẾN THẮNG VANG DỘI"}
                  {status === "defeat" && "THẤT BẠI - BỊ PHÁ HỦY"}
                </div>
              )}
            </div>
          </div>

          {/* Cảnh Báo Tuyệt Kỹ Boss Telegraphed Attack (Cơ chế Boss Đa Pha & Cảnh Báo Tuyệt Kỹ) */}
          {combatState.telegraphedAttack?.isCharging && (
            <div className="rounded-sm border-2 border-red-500 bg-red-950/90 p-3 shadow-[0_0_25px_rgba(239,68,68,0.5)] animate-pulse flex flex-wrap items-center justify-between gap-3 text-red-200">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="size-5 text-red-400 animate-bounce shrink-0" />
                <div>
                  <p className="font-display text-xs font-black uppercase tracking-wider text-red-400">
                    CẢNH BÁO TỐI CAO // {combatState.telegraphedAttack.skillName.toUpperCase()}
                  </p>
                  <p className="font-mono text-xs text-red-200">
                    {combatState.telegraphedAttack.description}
                  </p>
                </div>
              </div>
              <span className="rounded bg-red-500/30 px-2.5 py-1 font-mono text-xs font-bold border border-red-400 shrink-0">
                CÒN 1 LƯỢT: HÃY BẬT KHIÊN HOẶC KHỐNG CHẾ!
              </span>
            </div>
          )}

          {/* 4. Lưới Chiến Trường Chính (Người chơi vs Kẻ Địch) */}
          <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-2 overflow-hidden rounded-sm p-0.5">
            {/* TACTICAL SPATIAL COORDINATE GRID OVERLAY (Hex & Square Spatial Grid with --color-grid-line) */}
            <TacticalGridOverlay
              pattern="dual"
              animation="drift"
              density="normal"
              showCoordinates={true}
              showReticles={true}
            />

            {/* FLOATING COMBAT TEXT COMPONENT (Animated floating damage numbers & combat events over play area) */}
            <CombatText
              items={combatTextEvents}
              onItemComplete={handleRemoveCombatText}
            />

            {/* Floating Combat Feedback */}
            {floatingNotification && (
              <div
                className={cn(
                  "pointer-events-none absolute left-1/2 top-1/3 z-30 -translate-x-1/2 -translate-y-1/2 rounded border px-4 py-2 font-display text-lg font-black tracking-widest shadow-2xl transition-all animate-bounce",
                  floatingNotification.isPlayer
                    ? "border-cyan-400 bg-cyan-950/90 text-cyan-200"
                    : "border-red-500 bg-red-950/90 text-red-200",
                  floatingNotification.isCrit && "border-amber-400 bg-amber-950/90 text-amber-200 text-xl",
                )}
              >
                {floatingNotification.isCrit && "🔥 BẠO KÍCH! "}
                {floatingNotification.text}
              </div>
            )}

            {/* Cột 1: Người chơi (Vanguard / Falcon / Aegis) */}
            <div className={cn("relative overflow-hidden rounded-sm border p-3.5 shadow-xl bg-gradient-to-b", currentTheme.border, currentTheme.bgGradient)}>
              <div className="mb-3 flex items-start justify-between border-b border-border/60 pb-2.5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("flex size-5 items-center justify-center rounded-xs font-mono text-xs font-black border", currentTheme.badgeBg, currentTheme.badgeText, currentTheme.badgeBorder)}>
                      {activeGearDef.name.charAt(0)}
                    </span>
                    <h3 className={cn("font-display text-base font-bold", currentTheme.textPrimary)}>
                      {player.name}
                    </h3>
                    {/* BUỒNG LÁI TRỰC CHIẾN COMPACT PILL */}
                    <div className={cn("flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-mono border", currentTheme.iconBg, currentTheme.iconBorder)}>
                      <Radio className={cn("size-3 animate-pulse", currentTheme.iconColor)} />
                      <span className={cn("font-bold tracking-wider uppercase", currentTheme.textPrimary)}>
                        BUỒNG LÁI {activeGearDef.name.toUpperCase()} TRỰC CHIẾN
                      </span>
                    </div>
                  </div>
                  <p className={cn("font-mono text-xs", currentTheme.textAccent)}>
                    {activeGearDef.role} · Cấp {progression.level}
                  </p>
                </div>

                {/* Trạng thái buff/debuff chuẩn hóa */}
                <div className="flex flex-wrap gap-1">
                  {player.statusEffects.map((eff) => renderStatusBadge(eff))}
                  {player.statusEffects.length === 0 && (
                    <span className="text-[10px] text-muted-foreground/60">Không có hiệu ứng</span>
                  )}
                </div>
              </div>

              {/* Huy hiệu Kỹ Năng Nội Tại Của Gear */}
              <div className="mb-2.5 rounded border border-border/60 bg-black/40 p-2 text-[10px] font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Sparkles className="size-3 text-amber-400" />
                    <span>NỘI TẠI: {activeGearDef.passive.name}</span>
                  </div>
                  <span className={cn("rounded px-1.5 py-0.2 text-[9px] border", currentTheme.badgeBg, currentTheme.badgeText, currentTheme.badgeBorder)}>
                    BẢN SẮC GEAR
                  </span>
                </div>
                <p className="mt-1 text-slate-300 leading-snug">
                  {activeGearDef.passive.desc}
                </p>
              </div>

              {/* Thanh HP & SP */}
              <div className="space-y-2.5">
                <div>
                  <div className="mb-1 flex justify-between font-mono text-xs">
                    <span className="flex items-center gap-1 font-bold text-emerald-400">
                      <Shield className="size-3.5" /> ĐỘ BỀN VỎ GIÁP (HP)
                    </span>
                    <span className="tabular-nums font-bold">
                      {player.hp} / {player.maxHp} ({Math.round(playerHpPct)}%)
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-xs bg-secondary/80">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                      style={{ width: `${playerHpPct}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex justify-between font-mono text-xs">
                    <span className="flex items-center gap-1 font-bold text-cyan-400">
                      <Zap className="size-3.5" /> LÕI NĂNG LƯỢNG (SP)
                    </span>
                    <span className="tabular-nums font-bold">
                      {player.sp} / {player.maxSp} ({Math.round(playerSpPct)}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-xs bg-secondary/80">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                      style={{ width: `${playerSpPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Chỉ số tác chiến thực tế (Hiển thị chỉ số hiệu dụng 4 cột) */}
              <div className="mt-3 grid grid-cols-4 gap-1.5 border-t border-border/50 pt-2.5 text-center font-mono text-xs">
                <div className="rounded bg-black/30 p-1.5">
                  <span className="block text-[9px] uppercase text-muted-foreground">Tấn Công</span>
                  <span className="font-bold text-cyan-300">{getEffectiveAttack(player)}</span>
                </div>
                <div className="rounded bg-black/30 p-1.5">
                  <span className="block text-[9px] uppercase text-muted-foreground">Phòng Thủ</span>
                  <span className="font-bold text-cyan-300">{getEffectiveDefense(player)}</span>
                </div>
                <div className="rounded bg-black/30 p-1.5">
                  <span className="block text-[9px] uppercase text-muted-foreground">Tốc Độ</span>
                  <span className="font-bold text-cyan-300">{getEffectiveSpeed(player)}</span>
                </div>
                <div className="rounded bg-black/30 p-1.5">
                  <span className="block text-[9px] uppercase text-muted-foreground">Né Tránh</span>
                  <span className={cn("font-bold", player.gearType === "falcon" ? "text-amber-300" : "text-cyan-300")}>
                    {getEffectiveEvasion(player)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Cột 2: Kẻ Địch */}
            <div className="relative overflow-hidden rounded-sm border border-red-500/40 bg-gradient-to-b from-red-950/20 via-panel/80 to-panel p-3.5 shadow-xl">
              <div className="mb-3 flex items-start justify-between border-b border-border/60 pb-2.5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-xs bg-red-500/20 font-mono text-xs font-black text-red-400 border border-red-500/50">
                      E
                    </span>
                    <h3 className="font-display text-base font-bold text-red-200">
                      {enemy.name}
                    </h3>
                    {/* MỤC TIÊU ĐANG KHÓA COMPACT PILL */}
                    <div className="flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-mono border border-red-500/50 bg-red-950/60 text-red-300">
                      <Target className="size-3 text-red-400 animate-spin" style={{ animationDuration: "10s" }} />
                      <span className="font-bold tracking-wider uppercase">MỤC TIÊU ĐANG KHÓA</span>
                    </div>
                    {enemy.bossPhase === 2 && (
                      <span className="rounded bg-red-500/30 border border-red-400 px-1.5 py-0.5 font-display text-[10px] font-bold text-red-300 animate-pulse">
                        PHA 2: OVERDRIVE 🔥
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-red-400/80">{enemy.title}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {enemy.statusEffects.map((eff) => renderStatusBadge(eff))}
                  {enemy.statusEffects.length === 0 && (
                    <span className="text-[10px] text-muted-foreground/60">Không có hiệu ứng</span>
                  )}
                </div>
              </div>

              {/* Thanh HP & SP Địch */}
              <div className="space-y-2.5">
                <div>
                  <div className="mb-1 flex justify-between font-mono text-xs">
                    <span className="flex items-center gap-1 font-bold text-red-400">
                      <ShieldAlert className="size-3.5" /> ĐỘ BỀN VỎ GIÁP (HP)
                    </span>
                    <div className="flex items-center gap-1.5 tabular-nums">
                      {projectedDamage > 0 && (
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-300 border border-amber-400/40 animate-pulse">
                          -{projectedDamage} HP {projectedEnemyHp <= 0 ? "⚡ LETHAL" : ""}
                        </span>
                      )}
                      <span className="font-bold text-red-200">
                        {projectedDamage > 0 ? projectedEnemyHp : enemy.hp} / {enemy.maxHp} ({Math.round(projectedDamage > 0 ? projectedEnemyHpPct : enemyHpPct)}%)
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2.5 overflow-hidden rounded-xs bg-secondary/80">
                    {/* Ghost Bar */}
                    {projectedDamage > 0 && (
                      <div
                        className="absolute top-0 bottom-0 bg-red-300/40 animate-pulse transition-all duration-150"
                        style={{
                          left: `${projectedEnemyHpPct}%`,
                          width: `${Math.min(100 - projectedEnemyHpPct, (projectedDamage / enemy.maxHp) * 100)}%`,
                        }}
                      />
                    )}
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-300"
                      style={{ width: `${projectedDamage > 0 ? projectedEnemyHpPct : enemyHpPct}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex justify-between font-mono text-xs">
                    <span className="flex items-center gap-1 font-bold text-amber-400">
                      <Zap className="size-3.5" /> NĂNG LƯỢNG KẺ ĐỊCH (SP)
                    </span>
                    <span className="tabular-nums font-bold">
                      {enemy.sp} / {enemy.maxSp} ({Math.round(enemySpPct)}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-xs bg-secondary/80">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                      style={{ width: `${enemySpPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Chỉ số tác chiến Địch (Hiển thị chỉ số hiệu dụng 4 cột) */}
              <div className="mt-3 grid grid-cols-4 gap-1.5 border-t border-border/50 pt-2.5 text-center font-mono text-xs">
                <div className="rounded bg-black/30 p-1.5">
                  <span className="block text-[9px] uppercase text-muted-foreground">Tấn Công</span>
                  <span className="font-bold text-red-300">{getEffectiveAttack(enemy)}</span>
                </div>
                <div className="rounded bg-black/30 p-1.5">
                  <span className="block text-[9px] uppercase text-muted-foreground">Phòng Thủ</span>
                  <span className="font-bold text-red-300">{getEffectiveDefense(enemy)}</span>
                </div>
                <div className="rounded bg-black/30 p-1.5">
                  <span className="block text-[9px] uppercase text-muted-foreground">Tốc Độ</span>
                  <span className="font-bold text-red-300">{getEffectiveSpeed(enemy)}</span>
                </div>
                <div className="rounded bg-black/30 p-1.5">
                  <span className="block text-[9px] uppercase text-muted-foreground">Né Tránh</span>
                  <span className="font-bold text-red-300">{getEffectiveEvasion(enemy)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Khung Điều Khiển Kỹ Năng (Action Deck) */}
          <div className={cn("rounded-sm border bg-panel/90 p-4 shadow-xl", currentTheme.border)}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-2">
              <div className="flex items-center gap-2">
                <Flame className={cn("size-4", currentTheme.textAccent)} />
                <h4 className={cn("font-display text-xs font-bold uppercase tracking-wider", currentTheme.textPrimary)}>
                  BẢNG ĐIỀU KHIỂN KỸ NĂNG {activeGearDef.name.toUpperCase()}
                </h4>
                {status === "player-turn" ? (
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-display text-[10px] font-bold text-emerald-300 border border-emerald-400/50 animate-pulse">
                    ✓ ĐẾN LƯỢT BẠN ({activeGearDef.name.toUpperCase()}) — CHỌN KỸ NĂNG ĐỂ TẤN CÔNG
                  </span>
                ) : (
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 font-display text-[10px] text-amber-300 border border-amber-400/40">
                    ⏳ LƯỢT KẺ ĐỊCH (ĐANG PHẢN KÍCH...)
                  </span>
                )}
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                SP Hiện Có: <strong className={currentTheme.textPrimary}>{player.sp}</strong> / {player.maxSp}
              </span>
            </div>

            {/* 🎯 THANH GIÁM SÁT MỤC TIÊU & HP NỔI BẬT GẮN TRÊN ACTION DECK (DOCKED TARGET STATUS HUD) */}
            <div className="mb-3 rounded border border-red-500/50 bg-gradient-to-r from-red-950/70 via-black/90 to-panel p-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              {/* Thông tin định danh đối thủ */}
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-full border border-red-500/60 bg-red-950/80 shadow-[0_0_10px_rgba(239,68,68,0.4)] shrink-0">
                  <Target className="size-4 text-red-400 animate-spin" style={{ animationDuration: "12s" }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase text-red-400 font-bold tracking-wider">MỤC TIÊU ĐANG KHÓA:</span>
                    <strong className="font-display text-sm text-white font-bold">{enemy.name}</strong>
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">({enemy.title})</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <span>ATK: <strong className="text-red-300">{getEffectiveAttack(enemy)}</strong></span>
                    <span>DEF: <strong className="text-red-300">{getEffectiveDefense(enemy)}</strong></span>
                    <span>SPD: <strong className="text-red-300">{getEffectiveSpeed(enemy)}</strong></span>
                    <span>Né: <strong className="text-red-300">{getEffectiveEvasion(enemy)}%</strong></span>
                  </div>
                </div>
              </div>

              {/* HP MỤC TIÊU & THANH SÁT THƯƠNG DỰ TÍNH (GHOST DAMAGE BAR) */}
              <div className="flex-1 max-w-sm min-w-[220px]">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 font-bold text-red-400 text-[11px]">
                    <ShieldAlert className="size-3 text-red-400" /> HP MỤC TIÊU:
                  </span>
                  <div className="flex items-center gap-1.5 tabular-nums">
                    {projectedDamage > 0 && (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-300 border border-amber-400/40 animate-pulse">
                        -{projectedDamage} HP {projectedEnemyHp <= 0 ? "⚡ LETHAL" : ""}
                      </span>
                    )}
                    <span className="font-bold text-white">
                      {projectedDamage > 0 ? projectedEnemyHp : enemy.hp} / {enemy.maxHp} ({Math.round(projectedDamage > 0 ? projectedEnemyHpPct : enemyHpPct)}%)
                    </span>
                  </div>
                </div>
                <div className="relative h-2.5 overflow-hidden rounded-xs bg-black/80 border border-red-500/40">
                  {/* Ghost Bar */}
                  {projectedDamage > 0 && (
                    <div
                      className="absolute top-0 bottom-0 bg-red-300/40 animate-pulse transition-all duration-150"
                      style={{
                        left: `${projectedEnemyHpPct}%`,
                        width: `${Math.min(100 - projectedEnemyHpPct, (projectedDamage / enemy.maxHp) * 100)}%`,
                      }}
                    />
                  )}
                  {/* Real Bar */}
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-red-400 transition-all duration-300"
                    style={{ width: `${projectedDamage > 0 ? projectedEnemyHpPct : enemyHpPct}%` }}
                  />
                </div>
              </div>

              {/* Debuffs trên người mục tiêu */}
              <div className="flex flex-wrap items-center gap-1">
                {enemy.statusEffects.map((eff) => renderStatusBadge(eff))}
                {enemy.statusEffects.length === 0 && (
                  <span className="text-[10px] text-muted-foreground/60">Không có hiệu ứng bất lợi</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
              {player.skills.map((skill) => {
                const cooldown = player.skillCooldowns[skill.id] || 0
                const hasCooldown = cooldown > 0
                const notEnoughSp = player.sp < skill.spCost
                const isPairingUnlocked = !progression.activePairing?.isLocked
                const disabled =
                  status !== "player-turn" || hasCooldown || notEnoughSp || isProcessingAI || isPairingUnlocked

                return (
                  <button
                    key={skill.id}
                    disabled={disabled}
                    onClick={() => handleUseSkill(skill.id)}
                    onMouseEnter={() => setHoveredSkillId(skill.id)}
                    onMouseLeave={() => setHoveredSkillId(null)}
                    className={cn(
                      "group relative flex flex-col justify-between rounded-sm border p-3 text-left transition-all",
                      disabled
                        ? "cursor-not-allowed border-border/40 bg-secondary/30 opacity-60 text-muted-foreground"
                        : cn("cursor-pointer border-border/60 bg-panel/70", currentTheme.borderHover),
                      skill.id === "pulse-strike" && !disabled && "border-blue-500/60",
                      skill.id === "armor-break" && !disabled && "border-amber-500/60",
                      skill.id === "emergency-guard" && !disabled && "border-emerald-500/60",
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-display text-xs font-bold text-foreground group-hover:text-cyan-300">
                          {skill.name}
                        </span>
                        {hasCooldown ? (
                          <span className="rounded bg-red-950/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-400 border border-red-500/40">
                            CD: {cooldown} lượt
                          </span>
                        ) : (
                          <span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px]", currentTheme.badgeBg, currentTheme.badgeText, currentTheme.badgeBorder)}>
                            {skill.spCost > 0 ? `${skill.spCost} SP` : "Hồi +15 SP"}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                        {skill.desc}
                      </p>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-border/40 pt-1.5 text-[10px] font-mono">
                      <span className="text-muted-foreground/80">{skill.nameEn}</span>
                      <span className={cn("font-bold group-hover:underline", disabled ? "text-muted-foreground" : currentTheme.textAccent)}>
                        {disabled
                          ? isPairingUnlocked
                            ? "Cần Khóa NV"
                            : hasCooldown
                              ? "Đang hồi"
                              : notEnoughSp
                                ? "Thiếu SP"
                                : "Chờ lượt"
                          : "Kích hoạt ➔"}
                      </span>
                    </div>
                  </button>
                )
              })}

              {/* Ô Kỹ Năng / Nội Tại Liên Hoàn Phi Công (Slot 5) */}
              {player.pilotSynergySkill && (
                player.pilotSynergySkill.isPassive ? (
                  <div className="group relative flex flex-col justify-between rounded-sm border border-purple-500/50 bg-purple-950/20 p-3 text-left">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-display text-xs font-bold text-purple-300 flex items-center gap-1 truncate">
                          <Sparkles className="size-3 text-purple-400 shrink-0" />
                          {player.pilotSynergySkill.name}
                        </span>
                        <span className="rounded bg-purple-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-purple-300 border border-purple-400/40 shrink-0">
                          NỘI TẠI
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                        {player.pilotSynergySkill.description || player.pilotSynergySkill.mainLine?.description || ""}
                      </p>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-purple-500/30 pt-1.5 text-[10px] font-mono">
                      <span className="text-purple-300/80">
                        {player.signatureSynergyActive ? "✨ ĐỒNG BỘ 100%" : "Hiệp Đồng Phi Công"}
                      </span>
                      <span className="font-bold text-emerald-400">
                        Tự Kích Hoạt
                      </span>
                    </div>
                  </div>
                ) : (() => {
                  const synSkill = player.pilotSynergySkill
                  const synCd = player.skillCooldowns["pilot-synergy"] || 0
                  const hasSynCd = synCd > 0
                  let spReduction = 0
                  for (const line of synSkill.secondaryLines) {
                    if (line.statKey === "sp_cost_reduction_pct") spReduction += line.value / 100
                  }
                  const synSpCost = Math.max(0, Math.round(synSkill.spCost * (1 - spReduction)))
                  const synNotEnoughSp = player.sp < synSpCost
                  const synDisabled = status !== "player-turn" || hasSynCd || synNotEnoughSp || isProcessingAI

                  return (
                    <button
                      disabled={synDisabled}
                      onClick={() => handleUseSkill("pilot-synergy")}
                      onMouseEnter={() => setHoveredSkillId("pilot-synergy")}
                      onMouseLeave={() => setHoveredSkillId(null)}
                      className={cn(
                        "group relative flex flex-col justify-between rounded-sm border p-3 text-left transition-all",
                        synDisabled
                          ? "cursor-not-allowed border-purple-900/40 bg-purple-950/20 opacity-60 text-muted-foreground"
                          : "cursor-pointer border-purple-500/60 bg-gradient-to-b from-purple-950/40 to-panel/80 hover:border-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]",
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-display text-xs font-bold text-purple-200 group-hover:text-purple-100 flex items-center gap-1 truncate">
                            <Sparkles className="size-3 text-purple-400 shrink-0" />
                            {synSkill.name}
                          </span>
                          {hasSynCd ? (
                            <span className="rounded bg-red-950/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-400 border border-red-500/40 shrink-0">
                              CD: {synCd}l
                            </span>
                          ) : (
                            <span className="rounded bg-purple-500/20 px-1.5 py-0.5 font-mono text-[10px] text-purple-300 border border-purple-400/50 shrink-0">
                              {synSpCost} SP
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                          {synSkill.description || synSkill.mainLine?.description || ""}
                        </p>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between border-t border-purple-500/30 pt-1.5 text-[10px] font-mono">
                        <span className="text-purple-300/80">
                          {player.signatureSynergyActive ? "✨ ĐỒNG BỘ 100%" : "Tuyệt Kỹ Phi Công"}
                        </span>
                        <span className={cn("font-bold group-hover:underline", synDisabled ? "text-muted-foreground" : "text-purple-400")}>
                          {synDisabled
                            ? hasSynCd
                              ? "Đang hồi"
                              : synNotEnoughSp
                                ? "Thiếu SP"
                                : "Chờ lượt"
                            : "XUẤT KÍCH ⚡"}
                        </span>
                      </div>
                    </button>
                  )
                })()
              )}
            </div>
          </div>

          {/* 6. Nhật Ký Giao Tranh Thời Gian Thực (Scrollable Real-Time Combat Log Panel) */}
          <CombatLogPanel
            logs={logs}
            currentTurn={combatState.turnNumber}
            playerUnitName={player.name}
            enemyUnitName={enemy.name}
            className={currentTheme.border}
          />

          {/* 7. MÀN HÌNH KẾT QUẢ TÁC CHIẾN // POST-MISSION RESULTS (D3 PERFORMANCE METRICS, EXP & LOOT) */}
          {status === "victory" && (
            <div className="my-4 animate-in fade-in zoom-in-95 duration-300">
              {worldBattleContext ? (
                <WorldCombatPostMissionResults
                  isVictory={true}
                  combatState={combatState}
                  worldBattleContext={worldBattleContext}
                  resolutionResult={worldResolutionResult}
                  onReturnToWarRoom={() => {
                    playClickSound()
                    onWorldCombatComplete?.(worldResolutionResult!)
                  }}
                />
              ) : (() => {
                const campaignCandidate = activeCampaignMission
                  ? getNextCampaignMission(activeCampaignMission.id, progression)
                  : getCurrentOrNextCampaignMission(progression, null)

                return (
                  <PostMissionResults
                    combatState={combatState}
                    progression={progression}
                    rewardData={lastVictoryReward}
                    activeCampaignMission={activeCampaignMission}
                    nextCampaignMission={campaignCandidate}
                    selectedEncounter={selectedEncounter}
                    onNextMission={() => {
                      if (campaignCandidate) {
                        playClickSound()
                        setActiveCampaignMission(campaignCandidate)
                        onSelectCampaignMission?.(campaignCandidate)
                        handleStartEncounter(campaignCandidate.encounterId, progression, campaignCandidate)
                        setFloatingNotification({
                          text: `ĐÃ XUẤT KÍCH: ${campaignCandidate.title.toUpperCase()} ⚡`,
                          isCrit: false,
                          isPlayer: true,
                        })
                        setTimeout(() => setFloatingNotification(null), 2500)
                      }
                    }}
                    onReplayMission={() => {
                      playClickSound()
                      handleStartEncounter(selectedEncounter, progression, activeCampaignMission)
                    }}
                    onNavigateSection={(sec) => {
                      playClickSound()
                      if (onNavigateSection) {
                        onNavigateSection(sec)
                      } else {
                        setActiveSubView(sec === "shop" ? "shop" : sec === "missions" ? "campaign" : "hangar")
                      }
                    }}
                    onEquipItem={handleEquipItem}
                    onReturnToHangar={() => {
                      playClickSound()
                      if (isEmbeddedInShell && onNavigateSection) {
                        onNavigateSection("hangar")
                      } else {
                        setActiveSubView("hangar")
                      }
                    }}
                    onOpenShop={() => {
                      playClickSound()
                      if (isEmbeddedInShell && onNavigateSection) {
                        onNavigateSection("shop")
                      } else {
                        setActiveSubView("shop")
                      }
                    }}
                  />
                )
              })()}
            </div>
          )}

          {/* Hộp Thoại Thất Bại Tác Chiến (Defeat Modal) */}
          {status === "defeat" && (
            worldBattleContext ? (
              <div className="my-4 animate-in fade-in zoom-in-95 duration-300">
                <WorldCombatPostMissionResults
                  isVictory={false}
                  combatState={combatState}
                  worldBattleContext={worldBattleContext}
                  resolutionResult={worldResolutionResult}
                  onReturnToWarRoom={() => {
                    playClickSound()
                    onWorldCombatComplete?.(worldResolutionResult!)
                  }}
                />
              </div>
            ) : (
              <div className="rounded-sm border border-red-500/50 bg-panel p-5 text-center shadow-2xl animate-in fade-in zoom-in-95">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full mb-3 bg-red-950/40 border border-red-500/40">
                  <AlertTriangle className="size-10 text-red-500 animate-pulse" />
                </div>

                <h3 className="font-display text-xl font-black uppercase tracking-widest text-red-500">
                  THẤT BẠI TÁC CHIẾN
                </h3>

                <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                  Vỏ giáp {player.name} bị đục thủng bởi hỏa lực của {enemy.name}. Không nhận được phần thưởng chiến đấu.
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    onClick={() => {
                      playClickSound()
                      handleStartEncounter(selectedEncounter, progression, activeCampaignMission)
                    }}
                    className="gap-2 font-display uppercase tracking-wider cursor-pointer bg-red-600 hover:bg-red-500 text-white"
                  >
                    <RotateCcw className="size-4" /> Tái Đấu Thử Thách Lại
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      playClickSound()
                      if (isEmbeddedInShell && onNavigateSection) {
                        onNavigateSection("hangar")
                      } else {
                        setActiveSubView("hangar")
                      }
                    }}
                    className="gap-2 border-border cursor-pointer"
                  >
                    <Wrench className="size-4 text-cyan-400" /> Nâng Cấp Trang Bị & Hangar
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      playClickSound()
                      if (isEmbeddedInShell && onNavigateSection) {
                        onNavigateSection("shop")
                      } else {
                        setActiveSubView("shop")
                      }
                    }}
                    className="gap-2 border-amber-500/40 text-amber-300 hover:bg-amber-950/50 cursor-pointer"
                  >
                    <ShoppingBag className="size-4 text-amber-400" /> Vào Chợ Quân Sự
                  </Button>
                </div>
              </div>
            )
          )}
        </>
      )}

      {/* ====================================================================
          MODAL XÁC NHẬN RÚT LUI CHIẾN LƯỢC STARFRONT WORLD (PHASE 6.23)
          ==================================================================== */}
      {isRetreatModalOpen && worldBattleContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-sm border border-red-500/70 bg-gradient-to-b from-panel via-black/95 to-panel p-5 shadow-2xl font-mono text-left">
            <div className="flex items-center gap-3 border-b border-border/60 pb-3">
              <div className="flex size-10 items-center justify-center rounded border border-red-500/60 bg-red-950/50 text-red-400">
                <Flag className="size-5 animate-pulse" />
              </div>
              <div>
                <h2 className="font-display text-sm font-black uppercase tracking-wider text-white">
                  RÚT LUI CHIẾN LƯỢC // SECTOR {worldBattleContext.sectorName.toUpperCase()}
                </h2>
                <span className="text-[10px] text-amber-300 font-bold uppercase">
                  Xác Nhận Phương Án Thoát Khỏi Trận Đấu
                </span>
              </div>
            </div>

            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              Chỉ Huy đang trong chiến sự tiền tuyến với <strong className="text-white">{enemy.name}</strong>. Chọn phương án xử lý kết quả chiến sự:
            </p>

            <div className="mt-4 space-y-2.5">
              <button
                onClick={handleConfirmSafeAbort}
                className="w-full flex flex-col justify-between rounded border border-cyan-500/50 bg-cyan-950/30 p-2.5 text-left hover:bg-cyan-950/60 hover:border-cyan-400 transition-all cursor-pointer"
              >
                <div className="text-xs font-bold text-cyan-300">
                  1. Hủy Bỏ An Toàn (Safe Abort)
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Mở khóa Sector ngay lập tức, hoàn trả nguyên vẹn {worldBattleContext.snapshot.lockedGarrison.toLocaleString()} quân đồn trú và không áp dụng bất kỳ hình phạt nào.
                </div>
              </button>

              <button
                onClick={handleConfirmTacticalRetreat}
                className="w-full flex flex-col justify-between rounded border border-red-500/50 bg-red-950/30 p-2.5 text-left hover:bg-red-950/60 hover:border-red-400 transition-all cursor-pointer"
              >
                <div className="text-xs font-bold text-red-300">
                  2. Thừa Nhận Thất Bại & Rút Lui (Tactical Retreat)
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Chấp nhận kết quả thất bại: giảm ổn định, chịu thương vong rút lui và chuyển sector sang trạng thái bao vây hoặc nguy cấp.
                </div>
              </button>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRetreatModalOpen(false)}
                className="text-xs border-border/80 text-zinc-300 hover:text-white cursor-pointer"
              >
                Hủy Bỏ (Tiếp Tục Chiến Đấu)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
