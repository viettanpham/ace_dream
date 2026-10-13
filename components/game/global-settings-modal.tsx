"use client"

import React, { useEffect, useState } from "react"
import {
  Volume2,
  VolumeX,
  Sliders,
  RotateCcw,
  Zap,
  Shield,
  X,
  Check,
  Tv,
  Eye,
  EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  isAudioMuted,
  setAudioMuted,
  getAudioVolume,
  setAudioVolume,
  playClickSound,
  playLaserSound,
  playImpactSound,
  playShieldSound,
} from "@/lib/game/audio"
import {
  MIN_UI_SCALE,
  MAX_UI_SCALE,
  UI_SCALE_STEP,
  SUPPORTED_UI_SCALES,
  type SupportedUiScale,
  normalizeUiScale,
  getSavedUiScale,
  saveUiScale,
  getSavedScanlineOverlay,
  getSavedScanlineBeam,
  getSavedVignette,
  getSavedCornerBrackets,
  saveCrtSettings,
  resetGlobalSettingsToDefault,
} from "@/lib/game/ui-settings"

export interface GlobalSettingsState {
  audioMuted: boolean
  audioVolume: number
  scanlineOverlay: boolean
  scanlineBeam: boolean
  vignette: boolean
  cornerBrackets: boolean
  uiScale: SupportedUiScale
}

interface GlobalSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdateSettings?: (settings: GlobalSettingsState) => void
}

export { SUPPORTED_UI_SCALES }

export const UI_SCALE_PRESETS: Array<{
  value: SupportedUiScale
  label: string
  desc: string
}> = [
  { value: 100, label: "100%", desc: "Mặc định (1x)" },
  { value: 125, label: "125%", desc: "Rõ nét hơn" },
  { value: 150, label: "150%", desc: "Dễ đọc (1.5x)" },
  { value: 175, label: "175%", desc: "Cỡ chữ lớn" },
  { value: 200, label: "200%", desc: "Tối đa (2x)" },
]

export function GlobalSettingsModal({
  isOpen,
  onClose,
  onUpdateSettings,
}: GlobalSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"audio" | "display" | "scale">("audio")
  const [audioMutedState, setAudioMutedLocal] = useState<boolean>(true)
  const [volume, setVolumeLocal] = useState<number>(0.8)

  // CRT Sub-effects
  const [scanlineOverlay, setScanlineOverlayLocal] = useState<boolean>(false)
  const [scanlineBeam, setScanlineBeamLocal] = useState<boolean>(false)
  const [vignette, setVignetteLocal] = useState<boolean>(false)
  const [cornerBrackets, setCornerBracketsLocal] = useState<boolean>(false)

  // UI Scale: 100% - 200% with step 25%
  const [uiScale, setUiScaleLocal] = useState<SupportedUiScale>(100)
  const [hasChanged, setHasChanged] = useState<boolean>(false)

  // Master CRT status: true when scanline overlay or any effect is active
  const isCrtMasterOn = scanlineOverlay || scanlineBeam || vignette || cornerBrackets

  // Load user preferences when modal opens
  useEffect(() => {
    if (isOpen) {
      setAudioMutedLocal(isAudioMuted())
      setVolumeLocal(getAudioVolume())
      setScanlineOverlayLocal(getSavedScanlineOverlay())
      setScanlineBeamLocal(getSavedScanlineBeam())
      setVignetteLocal(getSavedVignette())
      setCornerBracketsLocal(getSavedCornerBrackets())
      setUiScaleLocal(getSavedUiScale())
      setHasChanged(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const emitSettings = (overrides?: Partial<GlobalSettingsState>) => {
    if (!onUpdateSettings) return
    const currentState: GlobalSettingsState = {
      audioMuted: overrides?.audioMuted ?? audioMutedState,
      audioVolume: overrides?.audioVolume ?? volume,
      scanlineOverlay: overrides?.scanlineOverlay ?? scanlineOverlay,
      scanlineBeam: overrides?.scanlineBeam ?? scanlineBeam,
      vignette: overrides?.vignette ?? vignette,
      cornerBrackets: overrides?.cornerBrackets ?? cornerBrackets,
      uiScale: overrides?.uiScale ?? uiScale,
    }
    onUpdateSettings(currentState)
  }

  const handleToggleMute = () => {
    const next = !audioMutedState
    setAudioMutedLocal(next)
    setAudioMuted(next)
    setHasChanged(true)
    emitSettings({ audioMuted: next })
    if (!next) {
      playClickSound()
    }
  }

  const handleVolumeChange = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol))
    setVolumeLocal(clamped)
    setAudioVolume(clamped)
    setHasChanged(true)
    emitSettings({ audioVolume: clamped })
  }

  const handleToggleCrtMaster = () => {
    playClickSound()
    const next = !isCrtMasterOn
    setScanlineOverlayLocal(next)
    const nextBeam = next ? true : false
    const nextVignette = next ? true : false
    const nextBrackets = next ? true : false

    setScanlineBeamLocal(nextBeam)
    setVignetteLocal(nextVignette)
    setCornerBracketsLocal(nextBrackets)

    saveCrtSettings({
      scanlineOverlay: next,
      scanlineBeam: nextBeam,
      vignette: nextVignette,
      cornerBrackets: nextBrackets,
    })

    setHasChanged(true)
    emitSettings({
      scanlineOverlay: next,
      scanlineBeam: nextBeam,
      vignette: nextVignette,
      cornerBrackets: nextBrackets,
    })
  }

  const handleToggleScanline = () => {
    playClickSound()
    const next = !scanlineOverlay
    setScanlineOverlayLocal(next)
    saveCrtSettings({ scanlineOverlay: next })
    setHasChanged(true)
    emitSettings({ scanlineOverlay: next })
  }

  const handleToggleBeam = () => {
    playClickSound()
    const next = !scanlineBeam
    setScanlineBeamLocal(next)
    saveCrtSettings({ scanlineBeam: next })
    setHasChanged(true)
    emitSettings({ scanlineBeam: next })
  }

  const handleToggleVignette = () => {
    playClickSound()
    const next = !vignette
    setVignetteLocal(next)
    saveCrtSettings({ vignette: next })
    setHasChanged(true)
    emitSettings({ vignette: next })
  }

  const handleToggleBrackets = () => {
    playClickSound()
    const next = !cornerBrackets
    setCornerBracketsLocal(next)
    saveCrtSettings({ cornerBrackets: next })
    setHasChanged(true)
    emitSettings({ cornerBrackets: next })
  }

  const handleSetScale = (val: number) => {
    playClickSound()
    const norm = normalizeUiScale(val)
    setUiScaleLocal(norm)
    saveUiScale(norm)
    setHasChanged(true)
    emitSettings({ uiScale: norm })
  }

  const handleResetDefaults = () => {
    playClickSound()
    const defaults = resetGlobalSettingsToDefault()
    setAudioMutedLocal(defaults.audioMuted)
    setVolumeLocal(defaults.audioVolume)
    setScanlineOverlayLocal(defaults.scanlineOverlay)
    setScanlineBeamLocal(defaults.scanlineBeam)
    setVignetteLocal(defaults.vignette)
    setCornerBracketsLocal(defaults.cornerBrackets)
    setUiScaleLocal(defaults.uiScale)
    setHasChanged(true)
    emitSettings(defaults)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-md border border-cyan-500/60 bg-gradient-to-b from-slate-950 via-zinc-950 to-black p-5 shadow-2xl font-mono text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <Sliders className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-sm sm:text-base font-black tracking-wider uppercase text-white truncate">
                CÀI ĐẶT HỆ THỐNG // GLOBAL SETTINGS
              </h2>
              <p className="text-xs text-cyan-400 font-bold uppercase tracking-widest">
                Âm Thanh · Màn Hình CRT · Tỷ Lệ Giao Diện (100% - 200%)
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playClickSound()
              onClose()
            }}
            className="flex size-8 shrink-0 items-center justify-center rounded border border-zinc-800 hover:border-cyan-500/60 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Đóng (ESC)"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-800/80 pt-3 pb-2 text-xs">
          <button
            onClick={() => {
              playClickSound()
              setActiveTab("audio")
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded font-bold uppercase transition-all cursor-pointer",
              activeTab === "audio"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
            )}
          >
            {audioMutedState ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
            <span>Âm Thanh</span>
            <span className={cn("text-xs font-mono font-bold", audioMutedState ? "text-rose-400" : "text-emerald-400")}>
              [{audioMutedState ? "OFF" : "ON"}]
            </span>
          </button>

          <button
            onClick={() => {
              playClickSound()
              setActiveTab("display")
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded font-bold uppercase transition-all cursor-pointer",
              activeTab === "display"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
            )}
          >
            <Tv className="size-3.5" />
            <span>Màn Hình CRT</span>
            <span className={cn("text-xs font-mono font-bold", isCrtMasterOn ? "text-cyan-400" : "text-zinc-500")}>
              [{isCrtMasterOn ? "ON" : "OFF"}]
            </span>
          </button>

          <button
            onClick={() => {
              playClickSound()
              setActiveTab("scale")
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded font-bold uppercase transition-all cursor-pointer",
              activeTab === "scale"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
            )}
          >
            <Sliders className="size-3.5" />
            <span>Thu Phóng Giao Diện</span>
            <span className="text-cyan-300 font-mono text-xs font-bold">
              [{uiScale}%]
            </span>
          </button>
        </div>

        {/* Tab 1: Audio Settings */}
        {activeTab === "audio" && (
          <div className="py-4 space-y-4 animate-in fade-in duration-150 text-xs">
            {/* Master Audio Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-zinc-800 bg-zinc-900/60 p-3.5">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded border",
                    audioMutedState
                      ? "border-rose-500/40 bg-rose-950/40 text-rose-400"
                      : "border-cyan-500/40 bg-cyan-950/40 text-cyan-300"
                  )}
                >
                  {audioMutedState ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-zinc-100">
                    Âm Lượng Tổng Thể (Master Audio)
                  </div>
                  <div className="text-xs text-zinc-400">
                    {audioMutedState
                      ? "Âm thanh: OFF (Mặc định khi bắt đầu hệ thống)"
                      : "Âm thanh: ON (Đang bật âm thanh)"}
                  </div>
                </div>
              </div>

              <button
                onClick={handleToggleMute}
                className={cn(
                  "px-3.5 py-1.5 rounded border text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 shadow-sm",
                  audioMutedState
                    ? "border-rose-500/60 bg-rose-950/50 text-rose-300 hover:bg-rose-900/60"
                    : "border-cyan-500/60 bg-cyan-950/50 text-cyan-300 hover:bg-cyan-900/60"
                )}
              >
                <span>{audioMutedState ? "Âm thanh: OFF" : "Âm thanh: ON"}</span>
              </button>
            </div>

            {/* Volume Slider */}
            <div className="rounded border border-zinc-800 bg-zinc-900/60 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300">Cường Độ Âm Lượng (Volume Level)</span>
                <span className="font-bold font-mono text-cyan-300">
                  {audioMutedState ? "0% (Đang tắt âm)" : `${Math.round(volume * 100)}%`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                disabled={audioMutedState}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer disabled:opacity-40"
              />
              <div className="flex justify-between text-xs text-zinc-500 font-mono">
                <span>0% (Im lặng)</span>
                <span>50%</span>
                <span>100% (Tối đa)</span>
              </div>
            </div>

            {/* Audio FX Test Buttons */}
            <div className="rounded border border-zinc-800/80 bg-zinc-900/30 p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider gap-1">
                <span>Thử Nghiệm Âm Thanh (Sound FX Test):</span>
                {audioMutedState && (
                  <span className="text-amber-400 font-mono font-medium">(Bật Âm thanh để thử)</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={audioMutedState}
                  onClick={() => playLaserSound()}
                  className={cn(
                    "rounded border p-2 text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1.5",
                    audioMutedState
                      ? "opacity-40 cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-500"
                      : "border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 cursor-pointer"
                  )}
                >
                  <Zap className="size-3.5 text-cyan-400" />
                  <span>Laser Shot</span>
                </button>
                <button
                  type="button"
                  disabled={audioMutedState}
                  onClick={() => playImpactSound(true)}
                  className={cn(
                    "rounded border p-2 text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1.5",
                    audioMutedState
                      ? "opacity-40 cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-500"
                      : "border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 cursor-pointer"
                  )}
                >
                  <Zap className="size-3.5 text-rose-400" />
                  <span>Impact Explosion</span>
                </button>
                <button
                  type="button"
                  disabled={audioMutedState}
                  onClick={() => playShieldSound()}
                  className={cn(
                    "rounded border p-2 text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1.5",
                    audioMutedState
                      ? "opacity-40 cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-500"
                      : "border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 cursor-pointer"
                  )}
                >
                  <Shield className="size-3.5 text-emerald-400" />
                  <span>Energy Shield</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: CRT Display Effect */}
        {activeTab === "display" && (
          <div className="py-4 space-y-3 animate-in fade-in duration-150 text-xs">
            {/* Master CRT Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-cyan-500/40 bg-cyan-950/30 p-3.5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded bg-black/50 border border-cyan-500/40 text-cyan-300">
                  <Tv className="size-4" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-white">
                    Màn Hình CRT (CRT Visual Effect)
                  </div>
                  <div className="text-xs text-zinc-400">
                    {isCrtMasterOn
                      ? "Hiệu ứng CRT đang BẬT trên toàn màn hình"
                      : "Màn hình CRT: OFF (Mặc định không hiển thị)"}
                  </div>
                </div>
              </div>

              <button
                onClick={handleToggleCrtMaster}
                className={cn(
                  "px-4 py-1.5 rounded border text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5",
                  isCrtMasterOn
                    ? "border-cyan-500/70 bg-cyan-950/70 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)] hover:bg-cyan-900/70"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white"
                )}
              >
                {isCrtMasterOn ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                <span>{isCrtMasterOn ? "CRT: ON (Bật)" : "CRT: OFF (Tắt)"}</span>
              </button>
            </div>

            {/* Sub-toggles for fine-tuning CRT effects */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Chi Tiết Lớp Phủ CRT (Sub-effects):
              </div>

              {/* Scanline Overlay */}
              <div className="flex flex-wrap items-center justify-between rounded border border-zinc-800 bg-zinc-900/60 p-2.5 gap-2">
                <div>
                  <div className="font-bold text-zinc-200">Dòng Quét Màn Hình (Scanline Overlay)</div>
                  <div className="text-xs text-zinc-400">
                    Lưới đường quét radar mô phỏng màn hình radar buồng lái
                  </div>
                </div>
                <button
                  onClick={handleToggleScanline}
                  disabled={!isCrtMasterOn}
                  className={cn(
                    "px-3 py-1 rounded border text-xs font-bold uppercase transition-all",
                    !isCrtMasterOn
                      ? "opacity-30 border-zinc-800 text-zinc-600 cursor-not-allowed"
                      : scanlineOverlay
                        ? "border-cyan-500/60 bg-cyan-950/50 text-cyan-300 cursor-pointer"
                        : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
                  )}
                >
                  {scanlineOverlay ? "Bật" : "Tắt"}
                </button>
              </div>

              {/* Beam Animation */}
              <div className="flex flex-wrap items-center justify-between rounded border border-zinc-800 bg-zinc-900/60 p-2.5 gap-2">
                <div>
                  <div className="font-bold text-zinc-200">Dải Quét Radar (Animated Beam)</div>
                  <div className="text-xs text-zinc-400">
                    Tia sáng quét từ trên xuống theo chu kỳ mô phỏng màn hình HUD
                  </div>
                </div>
                <button
                  onClick={handleToggleBeam}
                  disabled={!isCrtMasterOn}
                  className={cn(
                    "px-3 py-1 rounded border text-xs font-bold uppercase transition-all",
                    !isCrtMasterOn
                      ? "opacity-30 border-zinc-800 text-zinc-600 cursor-not-allowed"
                      : scanlineBeam
                        ? "border-cyan-500/60 bg-cyan-950/50 text-cyan-300 cursor-pointer"
                        : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
                  )}
                >
                  {scanlineBeam ? "Bật" : "Tắt"}
                </button>
              </div>

              {/* Vignette */}
              <div className="flex flex-wrap items-center justify-between rounded border border-zinc-800 bg-zinc-900/60 p-2.5 gap-2">
                <div>
                  <div className="font-bold text-zinc-200">Viền Tối Không Gian (Vignette Shadow)</div>
                  <div className="text-xs text-zinc-400">
                    Tối 4 góc màn hình để tập trung góc nhìn vào trung tâm
                  </div>
                </div>
                <button
                  onClick={handleToggleVignette}
                  disabled={!isCrtMasterOn}
                  className={cn(
                    "px-3 py-1 rounded border text-xs font-bold uppercase transition-all",
                    !isCrtMasterOn
                      ? "opacity-30 border-zinc-800 text-zinc-600 cursor-not-allowed"
                      : vignette
                        ? "border-cyan-500/60 bg-cyan-950/50 text-cyan-300 cursor-pointer"
                        : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
                  )}
                >
                  {vignette ? "Bật" : "Tắt"}
                </button>
              </div>

              {/* Corner Brackets */}
              <div className="flex flex-wrap items-center justify-between rounded border border-zinc-800 bg-zinc-900/60 p-2.5 gap-2">
                <div>
                  <div className="font-bold text-zinc-200">Khung Ngắm 4 Góc (Corner Brackets)</div>
                  <div className="text-xs text-zinc-400">
                    Ký hiệu HUD phòng tuyến không gian tại 4 góc
                  </div>
                </div>
                <button
                  onClick={handleToggleBrackets}
                  disabled={!isCrtMasterOn}
                  className={cn(
                    "px-3 py-1 rounded border text-xs font-bold uppercase transition-all",
                    !isCrtMasterOn
                      ? "opacity-30 border-zinc-800 text-zinc-600 cursor-not-allowed"
                      : cornerBrackets
                        ? "border-cyan-500/60 bg-cyan-950/50 text-cyan-300 cursor-pointer"
                        : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
                  )}
                >
                  {cornerBrackets ? "Bật" : "Tắt"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: UI Scaling Settings (Phase 6.33_FIX3: 100% -> 200%) */}
        {activeTab === "scale" && (
          <div className="py-4 space-y-4 animate-in fade-in duration-150 text-xs">
            <div className="rounded border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-zinc-200">
                  Tỷ Lệ Thu Phóng Giao Diện (UI Scale 100% — 200%)
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-cyan-300 text-base">
                    {uiScale}%
                  </span>
                  {/* Select Dropdown Control */}
                  <select
                    value={uiScale}
                    onChange={(e) => handleSetScale(parseInt(e.target.value, 10))}
                    className="rounded border border-cyan-500/50 bg-black/80 px-2 py-1 text-xs font-mono font-bold text-cyan-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                  >
                    {SUPPORTED_UI_SCALES.map((scale) => (
                      <option key={scale} value={scale}>
                        {scale}% {scale === 100 ? "(Chuẩn)" : scale === 200 ? "(Tối đa)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Supported 25% Step Presets (100, 125, 150, 175, 200) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                {UI_SCALE_PRESETS.map((preset) => {
                  const isCurrent = uiScale === preset.value
                  return (
                    <button
                      key={preset.value}
                      onClick={() => handleSetScale(preset.value)}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded border text-center transition-all cursor-pointer",
                        isCurrent
                          ? "border-cyan-400 bg-cyan-950/70 text-cyan-200 shadow-md ring-1 ring-cyan-400/50"
                          : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-zinc-700"
                      )}
                    >
                      <span className="font-bold font-mono text-xs">{preset.label}</span>
                      <span className="text-xs text-zinc-400 mt-0.5 truncate max-w-full">
                        {preset.desc}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Step-locked Range Slider (100 to 200 with step 25) */}
              <div className="pt-2 space-y-1">
                <input
                  type="range"
                  min={MIN_UI_SCALE}
                  max={MAX_UI_SCALE}
                  step={UI_SCALE_STEP}
                  value={uiScale}
                  onChange={(e) => handleSetScale(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-zinc-500 font-mono">
                  <span>100% (Mặc định)</span>
                  <span>125%</span>
                  <span>150%</span>
                  <span>175%</span>
                  <span>200% (Tối đa)</span>
                </div>
              </div>
            </div>

            <div className="rounded border border-cyan-500/30 bg-cyan-950/20 p-2.5 text-xs text-cyan-300/90 leading-relaxed space-y-1">
              <div>
                💡 <strong>Quy định hiển thị:</strong> Hỗ trợ chính xác các mức từ <strong>100%</strong> tới <strong>200%</strong> (bước nhảy 25%).
              </div>
              <div className="text-xs text-cyan-400/90">
                Khi tăng scale, toàn bộ font chữ của giao diện (Combat V2, Nhật ký, Bảng điều khiển) phóng to thực sự theo tỷ lệ tương ứng, giúp đọc rõ ràng trên mọi màn hình.
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between border-t border-zinc-800 pt-3 text-xs gap-2">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer text-xs"
            title="Khôi phục về: Sound OFF · CRT OFF · UI Scale 100%"
          >
            <RotateCcw className="size-3.5 text-amber-400" />
            <span>Khôi Phục Mặc Định</span>
          </button>

          <Button
            size="sm"
            onClick={() => {
              playClickSound()
              onClose()
            }}
            className="cursor-pointer gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs"
          >
            <Check className="size-3.5" />
            <span>Hoàn Tất & Đóng</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
