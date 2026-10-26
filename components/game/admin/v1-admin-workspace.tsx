'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Layers,
  Settings,
  Cpu,
  Database,
  RotateCcw,
  Play,
  Pause,
  Zap,
  Clock,
  Sparkles,
  ExternalLink,
  X,
  Sliders,
  CheckCircle2,
  FolderSync,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { loadWorldState, saveWorldState } from '@/lib/game/world/storage';
import {
  DEFAULT_SIMULATOR_CONFIG,
  WorldSimulatorConfig,
  EventStrategyPolicyConfig,
} from '@/lib/game/world/simulator-config';
import { getGameCalendarInfo, GameCalendarInfo } from '@/lib/game/world/calendar';
import type { WorldState } from '@/lib/game/world/types';
import { loadStarfrontProgression, saveStarfrontProgression } from '@/lib/game/storage';
import type { StarfrontProgression } from '@/lib/game/types';
import {
  advancePilotSynergySkill,
  normalizePilotSynergySkill,
} from '@/lib/game/pilot-skill-engine';
import { AdminSettingsModal } from '@/components/game/world/admin-settings-modal';
import { AdminCpModal } from '@/components/game/admin-cp-modal';
import { AssetVersionTab } from '@/components/game/world/admin-tabs/asset-version-tab';

export interface V1AdminWorkspaceProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSwitchVersion?: (version: 'v1' | 'v2') => void;
}

export function V1AdminWorkspace({
  isOpen = true,
  onClose,
  onSwitchVersion,
}: V1AdminWorkspaceProps) {
  // Navigation & Subtab state
  const [activeSubTab, setActiveSubTab] = useState<'world' | 'progression' | 'assets'>('world');
  const [feedback, setFeedback] = useState<string | null>(null);

  // V1 World State
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [simConfig, setSimConfig] = useState<WorldSimulatorConfig>(DEFAULT_SIMULATOR_CONFIG);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullWorldModalOpen, setIsFullWorldModalOpen] = useState(false);

  // V1 Progression State
  const [progression, setProgression] = useState<StarfrontProgression | null>(null);
  const [isProgressionModalOpen, setIsProgressionModalOpen] = useState(false);

  // Initialize V1 States from Local Storage
  useEffect(() => {
    try {
      const loadedWorld = loadWorldState();
      setWorldState(loadedWorld.state);

      const loadedProg = loadStarfrontProgression();
      setProgression(loadedProg);
    } catch (err) {
      console.warn('Failed to initialize V1 Admin states:', err);
    }
  }, []);

  if (!isOpen) return null;

  // Handler: Pause / Resume simulation
  const handleToggleSimulation = () => {
    setIsPaused((prev) => !prev);
    setFeedback(!isPaused ? 'Đã tạm dừng World Engine Simulator V1.' : 'Đã tiếp tục World Engine Simulator V1.');
  };

  // Handler: Add tokens
  const handleAddTokens = () => {
    if (!progression) return;
    const currentTokens = progression.rerollTokens || 0;
    const updated = {
      ...progression,
      rerollTokens: currentTokens + 10,
    };
    setProgression(updated);
    saveStarfrontProgression(updated);
    setFeedback('Đã cộng thêm +10 Vé Reroll Dòng Phụ vào tài khoản V1!');
  };

  // Handler: Normalize all skills
  const handleNormalizeSkills = () => {
    if (!progression) return;
    const config = progression.globalAdminConfig || {
      globalMaxPilotLevel: 120,
      globalMaxSkillLevel: 30,
      priorityMode: 'TEMPLATE_OVERRIDE',
      lastModified: Date.now(),
    };
    const updatedSkills: Record<string, any> = {};
    for (const [pId, skill] of Object.entries(progression.pilotSkills || {})) {
      updatedSkills[pId] = normalizePilotSynergySkill(skill, config);
    }
    const updated = {
      ...progression,
      pilotSkills: updatedSkills,
    };
    setProgression(updated);
    saveStarfrontProgression(updated);
    setFeedback('Đã chuẩn hóa toàn bộ dữ liệu Kỹ Năng Liên Hoàn V1!');
  };

  const calendarInfo: GameCalendarInfo = getGameCalendarInfo(worldState?.currentDay || 1, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-6xl max-h-[92vh] bg-[#050B14] border border-cyan-800/80 rounded-xl flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* =================================================================== */}
        {/* TOP HEADER WITH V1 | V2 VERSION SWITCHER                            */}
        {/* =================================================================== */}
        <header className="h-14 border-b border-cyan-950/90 bg-[#091222] px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/60 flex items-center justify-center text-amber-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  ADMINCP // V1 SYSTEM & WORLD ENGINE
                </span>

                {/* VERSION TOGGLE SWITCH */}
                <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-cyan-800/80 text-[10px] font-mono">
                  <button
                    type="button"
                    className="px-2.5 py-1 rounded font-bold bg-amber-500 text-slate-950 shadow-xs cursor-default"
                  >
                    V1: SYSTEM & WORLD
                  </button>
                  <button
                    type="button"
                    onClick={() => onSwitchVersion?.('v2')}
                    className="px-2.5 py-1 rounded font-bold text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>V2: CHARACTERS (12)</span>
                    <ArrowRight className="w-3 h-3 text-cyan-400" />
                  </button>
                </div>
              </div>
              <h2 className="text-xs sm:text-sm font-semibold text-slate-100">
                Bảng Điều Khiển Quản Trị Hệ Thống Starfront V1 (World, Simulator, Skills)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/v1"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500 transition-colors"
              title="Mở Starfront V1 Game Shell trong tab mới"
            >
              <span>V1 Game Shell</span>
              <ExternalLink className="w-3 h-3 text-cyan-400" />
            </Link>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* =================================================================== */}
        {/* SUBTAB BAR (World Simulator | Progression | Asset Version)           */}
        {/* =================================================================== */}
        <div className="h-12 border-b border-slate-900 px-4 flex items-center justify-between shrink-0 bg-[#050a16]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('world')}
              className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSubTab === 'world'
                  ? 'bg-amber-950 border border-amber-500 text-amber-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>World & Simulator Engine</span>
            </button>

            <button
              onClick={() => setActiveSubTab('progression')}
              className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSubTab === 'progression'
                  ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Pilot Progression & Synergy</span>
            </button>

            <button
              onClick={() => setActiveSubTab('assets')}
              className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSubTab === 'assets'
                  ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Asset Version & Releases</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500 hidden md:block">
            MÔI TRƯỜNG: STARFRONT V1 CANONICAL LEGACY
          </div>
        </div>

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div className="px-4 py-2 text-xs font-mono flex items-center justify-between border-b bg-emerald-950/60 border-emerald-800 text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{feedback}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* WORKSPACE BODY                                                      */}
        {/* =================================================================== */}
        <main className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#030611]">
          {/* TAB 1: WORLD & SIMULATOR ENGINE */}
          {activeSubTab === 'world' && (
            <div className="space-y-6">
              {/* Notice Box */}
              <div className="p-4 rounded-xl bg-[#091222] border border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-mono uppercase text-amber-400 font-bold flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>HỆ THỐNG WORLD ENGINE 30 SECTOR & 54 ROUTE</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Mô phỏng chu kỳ lịch game, độ đe dọa khu vực, hạm đội quốc gia và cơ chế sinh tồn phi công V1.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFullWorldModalOpen(true)}
                  className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-md"
                >
                  <Sliders className="w-4 h-4" />
                  <span>MỞ FULL WORLD SETTINGS MODAL</span>
                </button>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
                    <span>LỊCH TRÌNH VŨ TRỤ (SD)</span>
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-lg font-mono font-bold text-white">
                    {calendarInfo.formattedDate}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Ngày game: {worldState?.currentDay || 1} ({isPaused ? 'Tạm dừng' : 'Đang chạy'})
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
                    <span>TỐC ĐỘ MÔ PHỎNG</span>
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-xl font-mono font-bold text-cyan-400">
                    {simConfig.speedSeconds}s / NGÀY
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Chiến lược: {simConfig.strategyPolicy.tierPolicies.small}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
                    <span>SECTOR WORLD STATE</span>
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-xl font-mono font-bold text-emerald-400">
                    {Object.keys(worldState?.sectors || {}).length || 30} SECTORS
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Lưu trữ: STARFRONT_WORLD_SAVE_V1 (Local)
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-xs font-mono font-bold uppercase text-slate-300">
                  THAO TÁC NHANH WORLD ENGINE V1
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleSimulation}
                    className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 font-mono text-xs font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{isPaused ? 'Tiếp tục mô phỏng' : 'Tạm dừng mô phỏng'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFullWorldModalOpen(true)}
                    className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 font-mono text-xs font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Cấu hình Event Generator & Strategy Policy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (worldState) {
                        saveWorldState(worldState);
                        setFeedback('Đã đồng bộ và lưu World State V1 xuống LocalStorage an toàn!');
                      }
                    }}
                    className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 font-mono text-xs font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <FolderSync className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Lưu Trạng Thái Bền Vững</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PILOT PROGRESSION & SYNERGY SKILLS */}
          {activeSubTab === 'progression' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#091222] border border-cyan-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-mono uppercase text-cyan-400 font-bold flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>HỆ THỐNG TIẾN TRÌNH & KỸ NĂNG LIÊN HOÀN V1</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Cấu hình giới hạn cấp độ phi công, kỹ năng và vé làm mới dòng phụ thuộc phiên bản V1.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsProgressionModalOpen(true)}
                  className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-md"
                >
                  <Sliders className="w-4 h-4" />
                  <span>MỞ ADMIN CP PROGRESSION MODAL</span>
                </button>
              </div>

              {/* Progression Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-mono uppercase text-slate-400">
                    GIỚI HẠN CẤP ĐỘ PHI CÔNG V1
                  </div>
                  <div className="text-2xl font-mono font-bold text-white">
                    LV. {progression?.globalAdminConfig?.globalMaxPilotLevel || 120}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Chế độ: {progression?.globalAdminConfig?.priorityMode || 'TEMPLATE_OVERRIDE'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-mono uppercase text-slate-400">
                    GIỚI HẠN KỸ NĂNG LIÊN HOÀN V1
                  </div>
                  <div className="text-2xl font-mono font-bold text-cyan-400">
                    LV. {progression?.globalAdminConfig?.globalMaxSkillLevel || 30}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    {Object.keys(progression?.pilotSkills || {}).length} Kỹ năng đã cấu hình
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-mono uppercase text-slate-400">
                    VÉ REROLL DÒNG PHỤ HIỆN CÓ
                  </div>
                  <div className="text-2xl font-mono font-bold text-amber-400">
                    {progression?.rerollTokens || 0} VÉ
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Khóa lưu: STARFRONT_PROGRESSION_DATA_V1
                  </div>
                </div>
              </div>

              {/* Direct Actions */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-xs font-mono font-bold uppercase text-slate-300">
                  THAO TÁC TIẾN TRÌNH NHANH
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAddTokens}
                    className="px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 text-amber-300 font-mono text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>CỘNG +10 VÉ REROLL DÒNG PHỤ</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNormalizeSkills}
                    className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 font-mono text-xs font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Chuẩn Hóa Toàn Bộ Kỹ Năng Phi Công</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ASSET VERSION & RELEASES */}
          {activeSubTab === 'assets' && (
            <div className="space-y-4">
              <div className="border-b border-slate-900 pb-3">
                <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                  QUẢN LÝ PHIÊN BẢN TÀI NGUYÊN (ASSET VERSION RELEASES)
                </div>
                <p className="text-xs text-slate-400">
                  Kiểm tra các phiên bản R3/R2/CDN, diff manifest, audit log và chuyển đổi gói asset trực tiếp.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2 sm:p-4">
                <AssetVersionTab />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* FULL WORLD ADMIN MODAL */}
      {isFullWorldModalOpen && (
        <AdminSettingsModal
          isOpen={isFullWorldModalOpen}
          onClose={() => setIsFullWorldModalOpen(false)}
          worldState={worldState}
          simulatorConfig={simConfig}
          countdownSeconds={60}
          dayFraction={0.5}
          calendarInfo={calendarInfo}
          eventTierCounts={{ small: 0, medium: 0, large: 0, total: 0 }}
          isTickAdvancing={!isPaused}
          onTogglePause={handleToggleSimulation}
          onConfirmSpeedChange={(newSpeed) => {
            setSimConfig({ ...simConfig, speedSeconds: newSpeed });
            setFeedback(`Đã chuyển tốc độ mô phỏng sang ${newSpeed}s / ngày!`);
          }}
          onConfirmResetWorld={(customWorld) => {
            if (customWorld) {
              setWorldState(customWorld);
              saveWorldState(customWorld);
              setFeedback('Đã đặt lại trạng thái thế giới 30 Sector!');
            }
          }}
          onSaveGeneratorConfig={(gen) => {
            setSimConfig({ ...simConfig, generator: gen });
            setFeedback('Đã lưu cấu hình Event Generator!');
          }}
          onResetGeneratorToDefault={() => {
            setSimConfig({ ...simConfig, generator: DEFAULT_SIMULATOR_CONFIG.generator });
            setFeedback('Đã đặt lại cấu hình Event Generator về mặc định!');
          }}
          onSaveStrategyPolicy={(policy) => {
            setSimConfig({ ...simConfig, strategyPolicy: policy });
            setFeedback('Đã lưu cấu hình Event Strategy Policy!');
          }}
          onResetStrategyPolicyToDefault={() => {
            setSimConfig({ ...simConfig, strategyPolicy: DEFAULT_SIMULATOR_CONFIG.strategyPolicy });
            setFeedback('Đã đặt lại cấu hình Strategy Policy về mặc định!');
          }}
          onBatchApplyStrategyPolicy={() => {
            setFeedback('Đã áp dụng hàng loạt chính sách chiến lược cho các sự kiện!');
          }}
          onForceSpawnEvent={() => {
            setFeedback('Đã kích hoạt sự kiện thế giới ngẫu nhiên!');
          }}
          onFastForwardDays={(days) => {
            setFeedback(`Đã tua nhanh ${days} ngày mô phỏng!`);
          }}
          onAdvanceTick={() => {
            setFeedback('Đã tiến thêm +1 Tick thời gian!');
          }}
          onManualSave={() => {
            if (worldState) {
              saveWorldState(worldState);
              setFeedback('Đã lưu thủ công trạng thái thế giới!');
            }
          }}
        />
      )}

      {/* PROGRESSION MODAL */}
      {isProgressionModalOpen && progression && (
        <AdminCpModal
          progression={progression}
          isOpen={isProgressionModalOpen}
          onClose={() => setIsProgressionModalOpen(false)}
          onUpdateProgression={(updated) => {
            setProgression(updated);
            saveStarfrontProgression(updated);
            setFeedback('Đã lưu cấu hình Pilot Progression & Synergy Skills!');
          }}
        />
      )}
    </div>
  );
}
