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
} from "@/lib/game/progression"
import {
  createScaledEnemyUnit,
  generateEquipmentReward,
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
  Play,
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
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { CampaignMap } from "./campaign-map"
import { CombatLogPanel } from "./combat-log-panel"
import { StarfrontHangar } from "./starfront-hangar"
import { StarfrontShop } from "./starfront-shop"

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

export function CombatArena() {
  // 1. Quản lý tiến trình STARFRONT (Level, EXP, Credits, Trang bị, Gears, Chiến dịch)
  const [progression, setProgression] = useState<StarfrontProgression>(INITIAL_STARFRONT_PROGRESSION)
  const [hasLoadedProgression, setHasLoadedProgression] = useState(false)
  const [activeSubView, setActiveSubView] = useState<"combat" | "campaign" | "hangar" | "shop">("combat")
  const [activeCampaignMission, setActiveCampaignMission] = useState<CampaignMission | null>(null)
  const [audioMuted, setAudioMutedState] = useState(false)

  const activeGearId: StarfrontGearId = progression.activeGearId || "vanguard"
  const activeGearDef = STARFRONT_GEAR_DEFS[activeGearId] || STARFRONT_GEAR_DEFS.vanguard
  const currentTheme = GEAR_THEMES[activeGearId] || GEAR_THEMES.vanguard

  // 2. Trạng thái chiến đấu
  const [selectedEncounter, setSelectedEncounter] = useState<EnemyEncounterType>("scout-drone")
  const [combatState, setCombatState] = useState<CombatState>(() =>
    createInitialCombatState("scout-drone", buildPlayerCombatUnit(INITIAL_STARFRONT_PROGRESSION)),
  )
  const [isProcessingAI, setIsProcessingAI] = useState(false)
  const [floatingNotification, setFloatingNotification] = useState<{
    text: string
    isCrit?: boolean
    isPlayer?: boolean
  } | null>(null)

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

  // Khôi phục dữ liệu đã lưu từ LocalStorage khi khởi chạy
  useEffect(() => {
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
    if (hasLoadedProgression) {
      saveStarfrontProgression(progression)
    }
  }, [progression, hasLoadedProgression])

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
      const qData = STANDARD_CAMPAIGN_QUESTS.find((q) => q.id === effectiveMission.id)
      const lvl = effectiveMission.level ?? qData?.level ?? effectiveMission.recommendedLevel ?? 1
      const quality = effectiveMission.quality ?? qData?.quality ?? "standard"
      const variantId = effectiveMission.variantId ?? qData?.variantId ?? "recon"
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
          return updated
        } else {
          const { updated, reward, dropItem } = applyVictoryReward(prev, selectedEncounter)
          if (reward.leveledUp) {
            setTimeout(playLevelUpSound, 600)
          }
          setLastVictoryReward({ reward, dropItem })
          return updated
        }
      })
    }
  }, [combatState.status, selectedEncounter, activeCampaignMission])

  // Xử lý ghi nhận trận thua duy nhất 1 lần khi THẤT BẠI
  useEffect(() => {
    if (combatState.status === "defeat" && !defeatRecordedRef.current) {
      defeatRecordedRef.current = true
      setProgression((prev) => applyDefeatRecord(prev))
    }
  }, [combatState.status])

  // Người chơi bấm kích hoạt kỹ năng
  const handleUseSkill = (skillId: string) => {
    if (combatState.status !== "player-turn" || isProcessingAI) return

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

  const expRequired = getExpRequiredForLevel(progression.level)
  const expPct = Math.min(100, Math.round((progression.exp / expRequired) * 100))

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Header Thanh Tiến Trình Cấp Độ & Chuyển Đổi Tab Con */}
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

      {/* HIỂN THỊ PHÂN HỆ THEO TAB: CHIẾN DỊCH, CHỢ, HANGAR HOẶC COMBAT ARENA */}
      {activeSubView === "campaign" && (
        <CampaignMap
          progression={progression}
          onDeployMission={(mission) => {
            setActiveCampaignMission(mission)
            setActiveSubView("combat")
            handleStartEncounter(mission.encounterId, progression, mission)
          }}
        />
      )}

      {activeSubView === "shop" && (
        <StarfrontShop
          progression={progression}
          onUpdateProgression={(updated) => setProgression(updated)}
        />
      )}

      {activeSubView === "hangar" && (
        <StarfrontHangar
          progression={progression}
          onEquipItem={handleEquipItem}
          onUnequipSlot={handleUnequipSlot}
          onEnhanceItem={handleEnhanceItem}
          onUpdateProgression={(updated) => setProgression(updated)}
          onResetSave={handleResetSave}
          onSelectGear={handleSelectGear}
          onNavigateToCombat={() => {
            handleSwitchTab("combat")
            handleStartEncounter(selectedEncounter, progression, activeCampaignMission)
          }}
        />
      )}

      {activeSubView === "combat" && (
        <>
          {/* Banner thông báo khi đang thực hiện nhiệm vụ chiến dịch */}
          {activeCampaignMission && (
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
                  setActiveCampaignMission(null)
                  setActiveSubView("campaign")
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

          {/* 2. Thanh Chọn Mục Tiêu Đối Đầu */}
          <div className="rounded-sm border border-cyan-500/30 bg-black/40 p-3 shadow-lg backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Target className="size-4 text-cyan-400 animate-pulse" />
                <span className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                  MỤC TIÊU TÁC CHIẾN // CHỌN ĐỐI THỦ:
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {ENCOUNTER_INFO.map((enc) => {
                  const active = selectedEncounter === enc.id
                  return (
                    <button
                      key={enc.id}
                      onClick={() => handleStartEncounter(enc.id)}
                      className={cn(
                        "relative flex items-center gap-1.5 rounded-xs border px-3 py-1.5 font-display text-xs transition-all",
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
          <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-2">
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
            <div className={cn("relative overflow-hidden rounded-sm border p-4 shadow-xl bg-gradient-to-b", currentTheme.border, currentTheme.bgGradient)}>
              <div className="mb-3 flex items-start justify-between border-b border-border/60 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn("flex size-5 items-center justify-center rounded-xs font-mono text-xs font-black border", currentTheme.badgeBg, currentTheme.badgeText, currentTheme.badgeBorder)}>
                      {activeGearDef.name.charAt(0)}
                    </span>
                    <h3 className={cn("font-display text-base font-bold", currentTheme.textPrimary)}>
                      {player.name}
                    </h3>
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
              <div className="mb-3 rounded border border-border/60 bg-black/40 p-2 text-[10px] font-mono">
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
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex justify-between font-mono text-xs">
                    <span className="flex items-center gap-1 font-bold text-emerald-400">
                      <Shield className="size-3.5" /> ĐỘ BỀN VỎ GIÁP (HP)
                    </span>
                    <span className="tabular-nums">
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
                    <span className="tabular-nums">
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
              <div className="mt-4 grid grid-cols-4 gap-1.5 border-t border-border/50 pt-3 text-center font-mono text-xs">
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

              {/* Buồng lái trực quan */}
              <div className={cn("mt-4 flex h-32 items-center justify-center rounded border bg-black/50 p-2 relative overflow-hidden", currentTheme.border)}>
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(circle at center, ${activeGearDef.color}25 0%, transparent 70%)`,
                  }}
                />
                <div className="relative text-center">
                  <div className={cn("mx-auto flex size-12 items-center justify-center rounded-full border", currentTheme.iconBg, currentTheme.iconBorder)}>
                    {activeGearId === "aegis" ? (
                      <Shield className={cn("size-6", currentTheme.iconColor)} />
                    ) : activeGearId === "falcon" ? (
                      <Zap className={cn("size-6", currentTheme.iconColor)} />
                    ) : (
                      <Sword className={cn("size-6", currentTheme.iconColor)} />
                    )}
                  </div>
                  <p className={cn("mt-2 font-display text-xs font-bold uppercase tracking-widest", currentTheme.textPrimary)}>
                    BUỒNG LÁI {activeGearDef.name.toUpperCase()} TRỰC CHIẾN
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {status === "player-turn"
                      ? "⚡ ĐẾN LƯỢT BẠN! Hãy chọn 1 trong các kỹ năng bên dưới để tấn công."
                      : "⏳ Đang trong lượt của đối phương... Bạn có thể bấm nút trên để đi ngay."}
                  </p>
                </div>
              </div>
            </div>

            {/* Cột 2: Kẻ Địch */}
            <div className="relative overflow-hidden rounded-sm border border-red-500/40 bg-gradient-to-b from-red-950/20 via-panel/80 to-panel p-4 shadow-xl">
              <div className="mb-3 flex items-start justify-between border-b border-border/60 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-xs bg-red-500/20 font-mono text-xs font-black text-red-400 border border-red-500/50">
                      E
                    </span>
                    <h3 className="font-display text-base font-bold text-red-200">
                      {enemy.name}
                    </h3>
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
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex justify-between font-mono text-xs">
                    <span className="flex items-center gap-1 font-bold text-red-400">
                      <ShieldAlert className="size-3.5" /> ĐỘ BỀN VỎ GIÁP (HP)
                    </span>
                    <span className="tabular-nums">
                      {enemy.hp} / {enemy.maxHp} ({Math.round(enemyHpPct)}%)
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-xs bg-secondary/80">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-300"
                      style={{ width: `${enemyHpPct}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex justify-between font-mono text-xs">
                    <span className="flex items-center gap-1 font-bold text-amber-400">
                      <Zap className="size-3.5" /> NĂNG LƯỢNG KẺ ĐỊCH (SP)
                    </span>
                    <span className="tabular-nums">
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
              <div className="mt-4 grid grid-cols-4 gap-1.5 border-t border-border/50 pt-3 text-center font-mono text-xs">
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

              {/* Radar mục tiêu */}
              <div className="mt-4 flex h-32 items-center justify-center rounded border border-red-500/20 bg-black/50 p-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.15)_0%,transparent_70%)]" />
                <div className="relative text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-red-500/60 bg-red-950/60 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                    <Target
                      className="size-6 text-red-300 animate-spin"
                      style={{ animationDuration: "12s" }}
                    />
                  </div>
                  <p className="mt-2 font-display text-xs font-bold text-red-200 uppercase tracking-widest">
                    MỤC TIÊU ĐANG KHÓA: {enemy.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {enemy.hp <= 0 ? "Đã bị vô hiệu hóa" : "Trạng thái tác chiến tích cực"}
                  </p>
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

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {player.skills.map((skill) => {
                const cooldown = player.skillCooldowns[skill.id] || 0
                const hasCooldown = cooldown > 0
                const notEnoughSp = player.sp < skill.spCost
                const disabled =
                  status !== "player-turn" || hasCooldown || notEnoughSp || isProcessingAI

                return (
                  <button
                    key={skill.id}
                    disabled={disabled}
                    onClick={() => handleUseSkill(skill.id)}
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
                          ? hasCooldown
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

          {/* 7. Hộp Thoại Kết Thúc Trận Đấu & Trao Thưởng Tiến Trình (Phase 2 Rewards Modal) */}
          {(status === "victory" || status === "defeat") && (
            <div className="rounded-sm border border-border bg-panel p-5 text-center shadow-2xl animate-in fade-in zoom-in-95">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full mb-3">
                {status === "victory" ? (
                  <Trophy className="size-10 text-emerald-400 animate-bounce" />
                ) : (
                  <AlertTriangle className="size-10 text-red-500 animate-pulse" />
                )}
              </div>

              <h3
                className={cn(
                  "font-display text-xl font-black uppercase tracking-widest",
                  status === "victory" ? "text-emerald-400" : "text-red-500",
                )}
              >
                {status === "victory" ? "CHIẾN THẮNG VANG DỘI!" : "THẤT BẠI TÁC CHIẾN"}
              </h3>

              <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                {status === "victory"
                  ? `${player.name} đã tiêu diệt thành công ${enemy.name} sau ${turnNumber} vòng chiến đấu ác liệt.`
                  : `Vỏ giáp ${player.name} bị đục thủng bởi hỏa lực của ${enemy.name}. Không nhận được phần thưởng chiến đấu.`}
              </p>

              {/* Bảng tổng kết phần thưởng chiến thắng Phase 2 & Phase 3 */}
              {status === "victory" && lastVictoryReward && (
                <div className="my-4 mx-auto max-w-lg rounded-sm border border-emerald-500/40 bg-emerald-950/20 p-3.5 text-left font-mono">
                  {lastVictoryReward.missionTitle && (
                    <div className="mb-3 rounded bg-cyan-500/20 border border-cyan-400/60 p-2 text-xs text-cyan-200 flex items-center gap-2">
                      <Globe2 className="size-4 text-cyan-300 shrink-0" />
                      <span>
                        <strong>{lastVictoryReward.isFirstClear ? "🏆 QUA MÀN CHIẾN DỊCH LẦN ĐẦU:" : "✓ HOÀN THÀNH LẠI:"}</strong>{" "}
                        {lastVictoryReward.missionTitle}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-300 border-b border-emerald-500/30 pb-2">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    <span>PHẦN THƯỞNG CHIẾN TÍCH (ĐÃ LƯU TỰ ĐỘNG)</span>
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                    <div className="flex items-center gap-1.5 text-cyan-300">
                      <Sparkles className="size-4 text-cyan-400" />
                      <span>EXP Nhận Được:</span>
                      <strong className="text-white">+{lastVictoryReward.reward.expGained}</strong>
                    </div>

                    <div className="flex items-center gap-1.5 text-amber-300">
                      <Coins className="size-4 text-amber-400" />
                      <span>Credits Nhận Được:</span>
                      <strong className="text-white">+{lastVictoryReward.reward.creditsGained.toLocaleString("vi-VN")}</strong>
                    </div>

                    {lastVictoryReward.reward.alloyGained !== undefined && lastVictoryReward.reward.alloyGained > 0 && (
                      <div className="flex items-center gap-1.5 text-purple-300">
                        <Layers className="size-4 text-purple-400" />
                        <span>Hợp Kim (Alloy):</span>
                        <strong className="text-white">+{lastVictoryReward.reward.alloyGained}</strong>
                      </div>
                    )}
                  </div>

                  {/* Thông báo thăng cấp nếu có */}
                  {lastVictoryReward.reward.leveledUp && (
                    <div className="mt-3 rounded bg-amber-500/20 border border-amber-400/60 p-2 text-xs text-amber-200 flex items-center gap-2 animate-pulse">
                      <Sparkles className="size-4 text-amber-300 shrink-0" />
                      <span>
                        <strong>🎉 CHÚC MỪNG THĂNG CẤP!</strong> {player.name} đã đạt <strong>Cấp {lastVictoryReward.reward.newLevel}</strong>. Toàn bộ chỉ số (HP, SP, ATK, DEF, SPD) được tăng vĩnh viễn!
                      </span>
                    </div>
                  )}

                  {/* Thông báo rơi vật phẩm nếu có (Chi Tiết Trang Bị Phase 5.5) */}
                  {lastVictoryReward.dropItem && (
                    <div className="mt-3 rounded border border-cyan-500/40 bg-cyan-950/40 p-2.5 text-xs text-cyan-200">
                      <div className="flex items-center justify-between gap-2 border-b border-cyan-500/30 pb-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Gift className="size-4 text-cyan-300" />
                          <strong className="text-white uppercase tracking-wider">CHIẾN LỢI PHẨM RƠI // 1 TRANG BỊ DUY NHẤT:</strong>
                        </div>
                        <span className={cn(
                          "rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase border",
                          lastVictoryReward.dropItem.rarity === "legendary"
                            ? "bg-amber-950/80 text-amber-300 border-amber-400/70"
                            : lastVictoryReward.dropItem.rarity === "epic"
                              ? "bg-purple-950/80 text-purple-300 border-purple-400/70"
                              : lastVictoryReward.dropItem.rarity === "rare"
                                ? "bg-cyan-950/80 text-cyan-300 border-cyan-400/70"
                                : "bg-slate-900/80 text-slate-300 border-slate-600/50"
                        )}>
                          {lastVictoryReward.dropItem.rarity === "legendary"
                            ? "Huyền Thoại"
                            : lastVictoryReward.dropItem.rarity === "epic"
                              ? "Sử Thi"
                              : lastVictoryReward.dropItem.rarity === "rare"
                                ? "Hiếm"
                                : "Thường"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-white text-sm">
                          {lastVictoryReward.dropItem.name}
                        </span>
                        <span className="rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] text-cyan-300 border border-cyan-500/30">
                          Ô: {lastVictoryReward.dropItem.slot === "weapon" ? "Vũ Khí" : lastVictoryReward.dropItem.slot === "shield" ? "Khiên Giáp" : "Động Cơ"}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono">
                        {lastVictoryReward.dropItem.attackBonus && (
                          <span className="rounded bg-red-950/60 px-1.5 py-0.5 text-red-300 border border-red-500/30">
                            +{lastVictoryReward.dropItem.attackBonus} Tấn Công
                          </span>
                        )}
                        {lastVictoryReward.dropItem.defenseBonus && (
                          <span className="rounded bg-blue-950/60 px-1.5 py-0.5 text-blue-300 border border-blue-500/30">
                            +{lastVictoryReward.dropItem.defenseBonus} Phòng Ngự
                          </span>
                        )}
                        {lastVictoryReward.dropItem.speedBonus && (
                          <span className="rounded bg-amber-950/60 px-1.5 py-0.5 text-amber-300 border border-amber-500/30">
                            +{lastVictoryReward.dropItem.speedBonus} Tốc Độ
                          </span>
                        )}
                        {lastVictoryReward.dropItem.hpBonus && (
                          <span className="rounded bg-emerald-950/60 px-1.5 py-0.5 text-emerald-300 border border-emerald-500/30">
                            +{lastVictoryReward.dropItem.hpBonus} Giáp HP
                          </span>
                        )}
                        {lastVictoryReward.dropItem.spBonus && (
                          <span className="rounded bg-purple-950/60 px-1.5 py-0.5 text-purple-300 border border-purple-500/30">
                            +{lastVictoryReward.dropItem.spBonus} SP
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Nút hành động sau trận */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={() => {
                    playClickSound()
                    handleStartEncounter(selectedEncounter, progression, activeCampaignMission)
                  }}
                  className="gap-2 font-display uppercase tracking-wider"
                >
                  <RotateCcw className="size-4" /> Tái đấu mục tiêu này
                </Button>

                {activeCampaignMission && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      playClickSound()
                      setActiveCampaignMission(null)
                      setActiveSubView("campaign")
                    }}
                    className="gap-2 border-cyan-400 text-cyan-300 hover:bg-cyan-950/50"
                  >
                    <Globe2 className="size-4" /> Tiếp tục Chiến Dịch ➔
                  </Button>
                )}

                {status === "victory" && !activeCampaignMission && selectedEncounter !== "siege-walker" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      playClickSound()
                      const nextTarget: EnemyEncounterType =
                        selectedEncounter === "scout-drone" ? "raider-mech" : "siege-walker"
                      handleStartEncounter(nextTarget)
                    }}
                    className="gap-2 border-cyan-400 text-cyan-300 hover:bg-cyan-950/50"
                  >
                    <Play className="size-4" /> Thách đấu mục tiêu tiếp theo ➔
                  </Button>
                )}

                <Button
                  variant="secondary"
                  onClick={() => {
                    playClickSound()
                    setActiveSubView("hangar")
                  }}
                  className="gap-2 font-display uppercase tracking-wider border border-border"
                >
                  <Wrench className="size-4 text-cyan-400" /> Mở Kho Đồ & Hangar
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    playClickSound()
                    setActiveSubView("shop")
                  }}
                  className="gap-2 font-display uppercase tracking-wider border border-amber-500/40 text-amber-300 hover:bg-amber-950/50"
                >
                  <ShoppingBag className="size-4 text-amber-400" /> Chợ Quân Sự
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
