/**
 * STARFRONT WORLD — Combat V2 Adapter Helper (Phase 6.33)
 *
 * Provides bridge functions to convert an EncounterSnapshot into a full CombatV2EncounterSnapshot,
 * ensuring seamless execution of Combat V2 from WORLD encounters or standalone testing.
 */

import type { EncounterSnapshot, WorldBattleContext } from "./types"
import type { CombatV2EncounterSnapshot, CombatV2Gear } from "./combat-v2-types"
import { createCombatV2EncounterSnapshot, DEFAULT_COMBAT_V2_CONFIG } from "./combat-v2-engine"
import { createDefaultSupportEntities } from "./combat-v2-support"

export function convertWorldBattleContextToCombatV2Snapshot(
  battleContext: WorldBattleContext,
  playerGearOptions?: {
    gearName?: string
    pilotName?: string
    currentHp?: number
    maxHp?: number
    attack?: number
    defense?: number
    speed?: number
  }
): CombatV2EncounterSnapshot {
  const snap = battleContext.snapshot

  // Xây dựng đội hình Đồng Minh VSS (Tổ hợp Player + Hộ vệ đồn trú)
  const alliedGears: CombatV2Gear[] = [
    {
      gearId: "vss_player_flagship",
      name: playerGearOptions?.gearName || "Cơ Giáp Tiên Phong VSS Vanguard",
      side: "allied",
      factionId: "vss",
      isPlayer: true,
      pilotId: "pilot_player",
      pilotName: playerGearOptions?.pilotName || "Chỉ Huy Trưởng",
      currentHp: playerGearOptions?.currentHp ?? 320,
      maxHp: playerGearOptions?.maxHp ?? 320,
      state: "ACTIVE",
      attack: playerGearOptions?.attack ?? 55,
      defense: playerGearOptions?.defense ?? 35,
      speed: playerGearOptions?.speed ?? 60,
    },
    {
      gearId: "vss_garrison_escort_1",
      name: "Cơ Giáp Tuần Tra Đồn Trú Alpha",
      side: "allied",
      factionId: "vss",
      isPlayer: false,
      pilotId: "pilot_garrison_1",
      pilotName: "Trung Úy AI Hộ Vệ",
      currentHp: 200,
      maxHp: 200,
      state: "ACTIVE",
      attack: 38,
      defense: 25,
      speed: 48,
    },
    {
      gearId: "vss_garrison_escort_2",
      name: "Cơ Giáp Pháo Kích Đồn Trú Beta",
      side: "allied",
      factionId: "vss",
      isPlayer: false,
      pilotId: "pilot_garrison_2",
      pilotName: "Thiếu Úy AI Pháo Thủ",
      currentHp: 180,
      maxHp: 180,
      state: "ACTIVE",
      attack: 45,
      defense: 20,
      speed: 42,
    },
  ]

  // Xây dựng đội hình The Void dựa trên enemyUnit từ EncounterSnapshot
  const baseEnemy = snap.enemyUnit
  const enemyGears: CombatV2Gear[] = [
    {
      gearId: "void_flagship_leader",
      name: baseEnemy.name || "Mẫu Hạm Tiên Phong The Void",
      side: "enemy",
      factionId: "void",
      isPlayer: false,
      pilotId: "pilot_void_leader",
      pilotName: "Ý Chí Hư Không (The Void Core)",
      currentHp: Math.round(baseEnemy.hp * 0.6) || 280,
      maxHp: Math.round(baseEnemy.maxHp * 0.6) || 280,
      state: "ACTIVE",
      attack: baseEnemy.attack || 45,
      defense: baseEnemy.defense || 25,
      speed: baseEnemy.speed || 50,
    },
    {
      gearId: "void_escort_skirmisher_1",
      name: "Tiểu Đội Xung Kích Void Skirmisher #1",
      side: "enemy",
      factionId: "void",
      isPlayer: false,
      pilotId: "pilot_void_skirm_1",
      pilotName: "Bóng Ma Hư Không",
      currentHp: Math.round(baseEnemy.hp * 0.3) || 140,
      maxHp: Math.round(baseEnemy.maxHp * 0.3) || 140,
      state: "ACTIVE",
      attack: Math.round(baseEnemy.attack * 0.75) || 32,
      defense: Math.round(baseEnemy.defense * 0.8) || 18,
      speed: (baseEnemy.speed || 50) + 5,
    },
    {
      gearId: "void_escort_skirmisher_2",
      name: "Tiểu Đội Xung Kích Void Skirmisher #2",
      side: "enemy",
      factionId: "void",
      isPlayer: false,
      pilotId: "pilot_void_skirm_2",
      pilotName: "Bóng Ma Hư Không",
      currentHp: Math.round(baseEnemy.hp * 0.3) || 140,
      maxHp: Math.round(baseEnemy.maxHp * 0.3) || 140,
      state: "ACTIVE",
      attack: Math.round(baseEnemy.attack * 0.75) || 32,
      defense: Math.round(baseEnemy.defense * 0.8) || 18,
      speed: (baseEnemy.speed || 50) + 5,
    },
  ]

  const v2Snapshot = createCombatV2EncounterSnapshot({
    encounterId: snap.encounterId,
    transactionId: snap.transactionId,
    sectorId: snap.sectorId,
    alliedGears,
    enemyGears,
    alliedCommanderName: "Chỉ Huy VSS",
    enemyCommanderName: "Chỉ Huy The Void",
    maxRounds: snap.winConditions.maxRounds || DEFAULT_COMBAT_V2_CONFIG.maxCombatRounds,
    objective: snap.winConditions.objective === "eliminate_enemy" ? "eliminate_all_enemies" : "survive_rounds",
  })

  // Đính kèm các thực thể hỗ trợ
  v2Snapshot.alliedSupport = createDefaultSupportEntities("allied")

  return v2Snapshot
}
