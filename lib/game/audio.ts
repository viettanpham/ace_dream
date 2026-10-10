"use client"

// Web Audio API Synthesizer cho game Sci-Fi STARFRONT
// Không phụ thuộc tệp âm thanh bên ngoài, chạy tức thì không bị lỗi CORS hoặc 404

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

const STORAGE_MUTE_KEY = "STARFRONT_AUDIO_MUTED"

export function isAudioMuted(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(STORAGE_MUTE_KEY) === "true"
}

export function setAudioMuted(muted: boolean): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_MUTE_KEY, String(muted))
}

/** Phát âm thanh bắn Laser / Pháo Photon */
export function playLaserSound() {
  if (isAudioMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sawtooth"
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.15)

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.15)
  } catch {}
}

/** Phát âm thanh trúng đòn / Vụ nổ va chạm */
export function playImpactSound(isCrit = false) {
  if (isAudioMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = isCrit ? "square" : "triangle"
    osc.frequency.setValueAtTime(isCrit ? 260 : 180, now)
    osc.frequency.exponentialRampToValueAtTime(30, now + (isCrit ? 0.35 : 0.22))

    gain.gain.setValueAtTime(isCrit ? 0.35 : 0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isCrit ? 0.35 : 0.22))

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + (isCrit ? 0.35 : 0.22))
  } catch {}
}

/** Phát âm thanh kích hoạt Khiên từ trường / Phòng hộ */
export function playShieldSound() {
  if (isAudioMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    osc1.type = "sine"
    osc2.type = "sine"

    osc1.frequency.setValueAtTime(320, now)
    osc1.frequency.exponentialRampToValueAtTime(640, now + 0.3)

    osc2.frequency.setValueAtTime(480, now)
    osc2.frequency.exponentialRampToValueAtTime(960, now + 0.3)

    gain.gain.setValueAtTime(0.01, now)
    gain.gain.linearRampToValueAtTime(0.18, now + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.4)
    osc2.stop(now + 0.4)
  } catch {}
}

/** Phát âm thanh click nút tương tác Sci-Fi */
export function playClickSound() {
  if (isAudioMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(1400, now)
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.04)

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.04)
  } catch {}
}

/** Phát giai điệu Chiến Thắng rực rỡ */
export function playVictorySound() {
  if (isAudioMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    const startTime = ctx.currentTime

    notes.forEach((freq, idx) => {
      const noteTime = startTime + idx * 0.12
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = "triangle"
      osc.frequency.setValueAtTime(freq, noteTime)

      gain.gain.setValueAtTime(0.2, noteTime)
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(noteTime)
      osc.stop(noteTime + 0.28)
    })
  } catch {}
}

/** Phát âm thanh Thăng Cấp (Level Up) rực rỡ */
export function playLevelUpSound() {
  if (isAudioMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const notes = [440, 554.37, 659.25, 880, 1108.73] // A4, C#5, E5, A5, C#6
    const startTime = ctx.currentTime

    notes.forEach((freq, idx) => {
      const noteTime = startTime + idx * 0.09
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, noteTime)

      gain.gain.setValueAtTime(0.22, noteTime)
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(noteTime)
      osc.stop(noteTime + 0.35)
    })
  } catch {}
}

/** Phát âm thanh gắn / trang bị phụ kiện khí tài (Equip / Lock) */
export function playEquipSound() {
  if (isAudioMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "triangle"
    osc.frequency.setValueAtTime(520, now)
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08)

    gain.gain.setValueAtTime(0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.12)
  } catch {}
}
