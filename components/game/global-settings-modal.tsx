"use client"

import React, { useEffect, useState } from "react"
import {
  Volume2,
  VolumeX,
  Sliders,
  Monitor,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Zap,
  Shield,
  Crosshair,
  X,
  Check,
  Radio,
  Tv,
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

export interface GlobalSettingsState {
  audioMuted: boolean
  audioVolume: number // 0.0 to 1.0
  scanlineOverlay: boolean
  scanlineBeam: boolean
  vignette: boolean
  cornerBrackets: boolean
  uiScale: number // 0.8 to 1.25
}

interface GlobalSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdateSettings?: (settings: GlobalSettingsState) => void
}

const UI_SCALE_PRESETS = [
  { label: "85%", value: 0.85, desc: "Thu nhỏ / Compact" },
  { label: "95%", value: 0.95, desc: "Gọn gàng" },
  { label: "100%", value: 1.0, desc: "Chuẩn (Mặc định)" },
  { label: "110%", value: 1.1, desc: "Rộng rãi" },
  { label: "120%", value: 1.2, desc: "Phóng to / Large" },
]

export function GlobalSettingsModal({
  isOpen,
  onClose,
  onUpdateSettings,
}: GlobalSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"audio" | "display" | "scale">("audio")
  const [audioMutedState, setAudioMutedLocal] = useState<boolean>(false)
  const [volume, setVolumeLocal] = useState<number>(0.8)
  const [scanlineOverlay, setScanlineOverlayLocal] = useState<boolean>(true)
  const [scanlineBeam, setScanlineBeamLocal] = useState<boolean>(true)
  const [vignette, setVignetteLocal] = useState<boolean>(true)
  const [cornerBrackets, setCornerBracketsLocal] = useState<boolean>(true)
  const [uiScale, setUiScaleLocal] = useState<number>(1.0)
  const [hasChanged, setHasChanged] = useState<boolean>(false)

  // Load from LocalStorage on mount or when modal opens
  useEffect(() => {
    if (!isOpen) return

    setAudioMutedLocal(isAudioMuted())
    setVolumeLocal(getAudioVolume())

    try {
      const savedScanline = localStorage.getItem("starfront_scanline_overlay")
      if (savedScanline !== null) {
        setScanlineOverlayLocal(savedScanline === "true")
      }
      const savedBeam = localStorage.getItem("starfront_scanline_beam")
      if (savedBeam !== null) {
        setScanlineBeamLocal(savedBeam === "true")
      }
      const savedVignette = localStorage.getItem("starfront_vignette")
      if (savedVignette !== null) {
        setVignetteLocal(savedVignette === "true")
      }
      const savedBrackets = localStorage.getItem("starfront_corner_brackets")
      if (savedBrackets !== null) {
        setCornerBracketsLocal(savedBrackets === "true")
      }
      const savedScale = localStorage.getItem("starfront_ui_scale")
      if (savedScale !== null) {
        const parsed = parseFloat(savedScale)
        if (!isNaN(parsed) && parsed >= 0.8 && parsed <= 1.25) {
          setUiScaleLocal(parsed)
        }
      }
    } catch {}
  }, [isOpen])

  if (!isOpen) return null

  const emitSettings = (overrides?: Partial<GlobalSettingsState>) => {
    const updated: GlobalSettingsState = {
      audioMuted: overrides?.audioMuted ?? audioMutedState,
      audioVolume: overrides?.audioVolume ?? volume,
      scanlineOverlay: overrides?.scanlineOverlay ?? scanlineOverlay,
      scanlineBeam: overrides?.scanlineBeam ?? scanlineBeam,
      vignette: overrides?.vignette ?? vignette,
      cornerBrackets: overrides?.cornerBrackets ?? cornerBrackets,
      uiScale: overrides?.uiScale ?? uiScale,
    }
    onUpdateSettings?.(updated)
  }

  const handleToggleMute = () => {
    playClickSound()
    const next = !audioMutedState
    setAudioMutedLocal(next)
    setAudioMuted(next)
    setHasChanged(true)
    emitSettings({ audioMuted: next })
  }

  const handleVolumeChange = (newVol: number) => {
    setVolumeLocal(newVol)
    setAudioVolume(newVol)
    setHasChanged(true)
    emitSettings({ audioVolume: newVol })
  }

  const handleToggleScanline = () => {
    playClickSound()
    const next = !scanlineOverlay
    setScanlineOverlayLocal(next)
    try {
      localStorage.setItem("starfront_scanline_overlay", String(next))
    } catch {}
    setHasChanged(true)
    emitSettings({ scanlineOverlay: next })
  }

  const handleToggleBeam = () => {
    playClickSound()
    const next = !scanlineBeam
    setScanlineBeamLocal(next)
    try {
      localStorage.setItem("starfront_scanline_beam", String(next))
    } catch {}
    setHasChanged(true)
    emitSettings({ scanlineBeam: next })
  }

  const handleToggleVignette = () => {
    playClickSound()
    const next = !vignette
    setVignetteLocal(next)
    try {
      localStorage.setItem("starfront_vignette", String(next))
    } catch {}
    setHasChanged(true)
    emitSettings({ vignette: next })
  }

  const handleToggleBrackets = () => {
    playClickSound()
    const next = !cornerBrackets
    setCornerBracketsLocal(next)
    try {
      localStorage.setItem("starfront_corner_brackets", String(next))
    } catch {}
    setHasChanged(true)
    emitSettings({ cornerBrackets: next })
  }

  const handleSetScale = (val: number) => {
    playClickSound()
    const clamped = Math.max(0.8, Math.min(1.25, Number(val.toFixed(2))))
    setUiScaleLocal(clamped)
    try {
      localStorage.setItem("starfront_ui_scale", String(clamped))
    } catch {}
    setHasChanged(true)
    emitSettings({ uiScale: clamped })
  }

  const handleResetDefaults = () => {
    playClickSound()
    setAudioMutedLocal(false)
    setAudioMuted(false)
    setVolumeLocal(0.8)
    setAudioVolume(0.8)

    setScanlineOverlayLocal(true)
    setScanlineBeamLocal(true)
    setVignetteLocal(true)
    setCornerBracketsLocal(true)
    setUiScaleLocal(1.0)

    try {
      localStorage.setItem("STARFRONT_AUDIO_MUTED", "false")
      localStorage.setItem("STARFRONT_AUDIO_VOLUME", "0.8")
      localStorage.setItem("starfront_scanline_overlay", "true")
      localStorage.setItem("starfront_scanline_beam", "true")
      localStorage.setItem("starfront_vignette", "true")
      localStorage.setItem("starfront_corner_brackets", "true")
      localStorage.setItem("starfront_ui_scale", "1.0")
    } catch {}

    setHasChanged(true)
    emitSettings({
      audioMuted: false,
      audioVolume: 0.8,
      scanlineOverlay: true,
      scanlineBeam: true,
      vignette: true,
      cornerBrackets: true,
      uiScale: 1.0,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-xl rounded-md border border-cyan-500/60 bg-gradient-to-b from-slate-950 via-zinc-950 to-black p-5 shadow-2xl font-mono text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <Sliders className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-sm font-black tracking-wider uppercase text-white">
                CÀI ĐẶT HỆ THỐNG // GLOBAL SETTINGS
              </h2>
              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
                Âm Thanh · Hiệu Ứng CRT · Tỷ Lệ Giao Diện
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playClickSound()
              onClose()
            }}
            className="flex size-7 items-center justify-center rounded border border-zinc-800 hover:border-cyan-500/60 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Đóng (ESC)"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-zinc-800/80 pt-3 pb-2 text-xs">
          <button
            onClick={() => {
              playClickSound()
              setActiveTab("audio")
            }}
            className={cn(
              "flex items-center gap-1.5 rounded px-3 py-1.5 font-bold uppercase tracking-wider transition-all cursor-pointer",
              activeTab === "audio"
                ? "bg-cyan-950 border border-cyan-500/70 text-cyan-200 shadow-sm shadow-cyan-950/50"
                : "border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            )}
          >
            <Volume2 className="size-3.5 text-cyan-400" />
            <span>Âm Thanh</span>
          </button>

          <button
            onClick={() => {
              playClickSound()
              setActiveTab("display")
            }}
            className={cn(
              "flex items-center gap-1.5 rounded px-3 py-1.5 font-bold uppercase tracking-wider transition-all cursor-pointer",
              activeTab === "display"
                ? "bg-cyan-950 border border-cyan-500/70 text-cyan-200 shadow-sm shadow-cyan-950/50"
                : "border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            )}
          >
            <Tv className="size-3.5 text-cyan-400" />
            <span>Hiệu Ứng CRT</span>
          </button>

          <button
            onClick={() => {
              playClickSound()
              setActiveTab("scale")
            }}
            className={cn(
              "flex items-center gap-1.5 rounded px-3 py-1.5 font-bold uppercase tracking-wider transition-all cursor-pointer",
              activeTab === "scale"
                ? "bg-cyan-950 border border-cyan-500/70 text-cyan-200 shadow-sm shadow-cyan-950/50"
                : "border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            )}
          >
            <Monitor className="size-3.5 text-cyan-400" />
            <span>Tỷ Lệ UI ({Math.round(uiScale * 100)}%)</span>
          </button>
        </div>

        {/* Tab 1: Audio Settings */}
        {activeTab === "audio" && (
          <div className="py-4 space-y-4 animate-in fade-in duration-150">
            {/* Master Mute Toggle */}
            <div className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="flex items-center gap-3">
                {audioMutedState ? (
                  <VolumeX className="size-5 text-rose-400" />
                ) : (
                  <Volume2 className="size-5 text-cyan-400" />
                )}
                <div>
                  <div className="font-bold text-xs text-zinc-100">Âm Lượng Tổng Thể (Master Audio)</div>
                  <div className="text-[10px] text-zinc-400">
                    {audioMutedState ? "Âm thanh đang bị tắt toàn bộ" : "Âm thanh hệ thống đang bật"}
                  </div>
                </div>
              </div>

              <button
                onClick={handleToggleMute}
                className={cn(
                  "px-3 py-1.5 rounded border text-xs font-bold uppercase transition-all cursor-pointer",
                  audioMutedState
                    ? "border-rose-500/60 bg-rose-950/50 text-rose-300 hover:bg-rose-900/60"
                    : "border-cyan-500/60 bg-cyan-950/50 text-cyan-300 hover:bg-cyan-900/60"
                )}
              >
                {audioMutedState ? "Đang Tắt Âm" : "Đang Bật Âm"}
              </button>
            </div>

            {/* Volume Slider */}
            <div className="rounded border border-zinc-800 bg-zinc-900/60 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300">Cường Độ Âm Lượng (Volume Level)</span>
                <span className="font-bold font-mono text-cyan-300">
                  {audioMutedState ? "0%" : `${Math.round(volume * 100)}%`}
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
              <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                <span>0% (Im lặng)</span>
                <span>50%</span>
                <span>100% (Tối đa)</span>
              </div>
            </div>

            {/* Audio FX Test Buttons */}
            <div className="rounded border border-zinc-800/80 bg-zinc-900/30 p-3 space-y-2">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Thử Nghiệm Âm Thanh (Sound FX Test):
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => playLaserSound()}
                  className="rounded border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 p-2 text-[10px] font-bold uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Zap className="size-3 text-cyan-400" />
                  <span>Laser Shot</span>
                </button>
                <button
                  type="button"
                  onClick={() => playImpactSound(true)}
                  className="rounded border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 p-2 text-[10px] font-bold uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Zap className="size-3 text-rose-400" />
                  <span>Impact Explosion</span>
                </button>
                <button
                  type="button"
                  onClick={() => playShieldSound()}
                  className="rounded border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 p-2 text-[10px] font-bold uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Shield className="size-3 text-emerald-400" />
                  <span>Energy Shield</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: CRT Display Effect */}
        {activeTab === "display" && (
          <div className="py-4 space-y-3 animate-in fade-in duration-150 text-xs">
            {/* Master Scanline Toggle */}
            <div className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-900/60 p-3">
              <div>
                <div className="font-bold text-zinc-100">Dòng Quét Màn Hình Cổ Điển (CRT Scanlines)</div>
                <div className="text-[10px] text-zinc-400">
                  Lớp phủ đường quét mô phỏng màn hình radar tàu vũ trụ sci-fi
                </div>
              </div>
              <button
                onClick={handleToggleScanline}
                className={cn(
                  "px-3 py-1.5 rounded border text-xs font-bold uppercase transition-all cursor-pointer",
                  scanlineOverlay
                    ? "border-cyan-500/60 bg-cyan-950/50 text-cyan-300 hover:bg-cyan-900/60"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white"
                )}
              >
                {scanlineOverlay ? "Đang Bật" : "Đang Tắt"}
              </button>
            </div>

            {/* Beam Animation Toggle */}
            <div className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-900/60 p-3">
              <div>
                <div className="font-bold text-zinc-100">Dải Quét Radar Chuyển Động (Scanline Beam)</div>
                <div className="text-[10px] text-zinc-400">
                  Tia sáng quét từ trên xuống theo chu kỳ mô phỏng màn hình hiển thị HUD
                </div>
              </div>
              <button
                onClick={handleToggleBeam}
                className={cn(
                  "px-3 py-1.5 rounded border text-xs font-bold uppercase transition-all cursor-pointer",
                  scanlineBeam
                    ? "border-cyan-500/60 bg-cyan-950/50 text-cyan-300 hover:bg-cyan-900/60"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white"
                )}
              >
                {scanlineBeam ? "Đang Bật" : "Đang Tắt"}
              </button>
            </div>

            {/* Vignette Toggle */}
            <div className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-900/60 p-3">
              <div>
                <div className="font-bold text-zinc-100">Viền Tối Không Gian (Vignette Radial Shadow)</div>
                <div className="text-[10px] text-zinc-400">
                  Hiệu ứng tối viền 4 cạnh làm nổi bật trung tâm buồng lái
                </div>
              </div>
              <button
                onClick={handleToggleVignette}
                className={cn(
                  "px-3 py-1.5 rounded border text-xs font-bold uppercase transition-all cursor-pointer",
                  vignette
                    ? "border-cyan-500/60 bg-cyan-950/50 text-cyan-300 hover:bg-cyan-900/60"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white"
                )}
              >
                {vignette ? "Đang Bật" : "Đang Tắt"}
              </button>
            </div>

            {/* Corner Brackets Toggle */}
            <div className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-900/60 p-3">
              <div>
                <div className="font-bold text-zinc-100">Khung Ngắm Chiến Thuật 4 Góc (Corner Reticles)</div>
                <div className="text-[10px] text-zinc-400">
                  Ký hiệu góc ngắm HUD phòng tuyến không gian
                </div>
              </div>
              <button
                onClick={handleToggleBrackets}
                className={cn(
                  "px-3 py-1.5 rounded border text-xs font-bold uppercase transition-all cursor-pointer",
                  cornerBrackets
                    ? "border-cyan-500/60 bg-cyan-950/50 text-cyan-300 hover:bg-cyan-900/60"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white"
                )}
              >
                {cornerBrackets ? "Đang Bật" : "Đang Tắt"}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: UI Scaling */}
        {activeTab === "scale" && (
          <div className="py-4 space-y-4 animate-in fade-in duration-150">
            <div className="rounded border border-zinc-800 bg-zinc-900/60 p-3 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-200">Tỷ Lệ Thu Phóng Giao Diện (UI Scale)</span>
                <span className="font-bold font-mono text-cyan-300 text-sm">
                  {Math.round(uiScale * 100)}%
                </span>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-5 gap-1.5 text-xs">
                {UI_SCALE_PRESETS.map((preset) => {
                  const isCurrent = Math.abs(uiScale - preset.value) < 0.02
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
                      <span className="text-[8px] text-zinc-500 uppercase mt-0.5 truncate max-w-full">
                        {preset.desc.split(" ")[0]}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Continuous Slider */}
              <div className="pt-2">
                <input
                  type="range"
                  min="0.8"
                  max="1.25"
                  step="0.05"
                  value={uiScale}
                  onChange={(e) => handleSetScale(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-zinc-500 font-mono mt-1">
                  <span>80% (Siêu gọn)</span>
                  <span>100% (Chuẩn 1:1)</span>
                  <span>125% (Rất lớn)</span>
                </div>
              </div>
            </div>

            <div className="rounded border border-cyan-500/30 bg-cyan-950/20 p-2.5 text-[11px] text-cyan-300/90 leading-relaxed">
              💡 <strong>Lưu ý:</strong> Tỷ lệ giao diện được lưu vĩnh viễn trên trình duyệt của bạn. Nếu giao diện bị che khuất trên màn hình nhỏ, hãy chọn mức <strong>85%</strong> hoặc <strong>95%</strong> để có tầm nhìn bao quát toàn bộ bản đồ thiên hà.
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-3 text-xs">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer text-[11px]"
          >
            <RotateCcw className="size-3 text-amber-400" />
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
