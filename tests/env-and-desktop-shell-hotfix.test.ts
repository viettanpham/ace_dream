import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  resolveImageUrl,
  getResolverConfig,
  DEFAULT_JSDELIVR_CDN_BASE,
  setClientActiveRuntimeConfig,
} from '../lib/game/assets/image-resolver'
import {
  DEFAULT_RUNTIME_ASSET_CONFIG,
  DEFAULT_PUBLIC_ASSET_CONFIG,
  CANONICAL_REPOSITORY,
  CANONICAL_ACTIVE_VERSION,
  CANONICAL_ASSET_ROOT,
} from '../lib/game/assets/runtime-asset-config'

describe('STARFRONT WORLD V2 — ENV & DESKTOP SHELL HOTFIX TESTS', () => {
  it('1. Baseline Public Asset Fallback hoạt động hoàn hảo khi không có biến môi trường', () => {
    // Lưu lại env ban đầu nếu có
    const originalCdn = process.env.NEXT_PUBLIC_ASSET_CDN_URL
    const originalMode = process.env.NEXT_PUBLIC_ASSET_STORAGE_MODE

    delete process.env.NEXT_PUBLIC_ASSET_CDN_URL
    delete process.env.NEXT_PUBLIC_ASSET_STORAGE_MODE

    try {
      const config = getResolverConfig()
      assert.equal(config.mode, 'jsdelivr', 'Mode mặc định phải là jsdelivr')
      assert.equal(
        config.cdnBaseUrl,
        DEFAULT_JSDELIVR_CDN_BASE,
        'CDN Base URL mặc định phải trỏ về DEFAULT_JSDELIVR_CDN_BASE'
      )
      assert.ok(
        config.cdnBaseUrl.includes('v2.0-assets-r1'),
        'URL mặc định phải chứa release tag canonical v2.0-assets-r1'
      )

      // Test resolving asset
      const resolved = resolveImageUrl('/images/valentine-fullbody.webp')
      assert.equal(
        resolved,
        'https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r1/starfront-world-assets/images/valentine-fullbody.webp'
      )
    } finally {
      // Phục hồi
      if (originalCdn) process.env.NEXT_PUBLIC_ASSET_CDN_URL = originalCdn
      if (originalMode) process.env.NEXT_PUBLIC_ASSET_STORAGE_MODE = originalMode
    }
  })

  it('2. Biến môi trường Override hoạt động đúng thứ tự ưu tiên khi được khai báo', () => {
    const originalCdn = process.env.NEXT_PUBLIC_ASSET_CDN_URL
    const originalMode = process.env.NEXT_PUBLIC_ASSET_STORAGE_MODE

    process.env.NEXT_PUBLIC_ASSET_CDN_URL = 'https://custom-mirror.example.com/assets'
    process.env.NEXT_PUBLIC_ASSET_STORAGE_MODE = 'custom'

    try {
      const config = getResolverConfig()
      assert.equal(config.mode, 'custom')
      assert.equal(config.cdnBaseUrl, 'https://custom-mirror.example.com/assets')

      const resolved = resolveImageUrl('/images/alviss-fullbody.webp')
      assert.equal(
        resolved,
        'https://custom-mirror.example.com/assets/images/alviss-fullbody.webp'
      )
    } finally {
      if (originalCdn) process.env.NEXT_PUBLIC_ASSET_CDN_URL = originalCdn
      else delete process.env.NEXT_PUBLIC_ASSET_CDN_URL

      if (originalMode) process.env.NEXT_PUBLIC_ASSET_STORAGE_MODE = originalMode
      else delete process.env.NEXT_PUBLIC_ASSET_STORAGE_MODE
    }
  })

  it('3. Runtime Active Release chuyển đổi (AdminCP) có quyền ưu tiên cao hơn và không bị khóa bởi fallback', () => {
    // Giả lập browser client
    ;(global as any).window = {}

    // Giả lập AdminCP kích hoạt release mới r2
    setClientActiveRuntimeConfig({
      provider: 'jsdelivr',
      cdnBaseUrl: `https://cdn.jsdelivr.net/gh/${CANONICAL_REPOSITORY}@v2.0-assets-r2/${CANONICAL_ASSET_ROOT}`,
    })

    try {
      const resolved = resolveImageUrl('/images/valentine-fullbody.webp')
      assert.ok(
        resolved.includes('v2.0-assets-r2'),
        'Khi client runtime config được thiết lập, URL phải chuyển sang v2.0-assets-r2'
      )
    } finally {
      // Reset về null
      setClientActiveRuntimeConfig(null)
      delete (global as any).window
    }
  })

  it('4. Tệp .env.example không chứa các biến rỗng kích hoạt popup modal trên AI Studio', () => {
    const envExamplePath = path.join(process.cwd(), '.env.example')
    assert.ok(fs.existsSync(envExamplePath), '.env.example phải tồn tại')
    const content = fs.readFileSync(envExamplePath, 'utf-8')
    const lines = content.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      // Bất kỳ dòng nào không phải comment mà có dạng KEY= hoặc KEY="" đều bị coi là bắt buộc nhập
      const match = trimmed.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/)
      if (match) {
        const [, key, val] = match
        assert.ok(
          val.length > 0,
          `Dòng "${trimmed}" trong .env.example không được để trống giá trị để tránh popup AI Studio`
        )
      }
    }
  })

  it('5. Cấu hình Next.js (next.config.mjs) đã tắt Next.js Dev Indicator', () => {
    const nextConfigPath = path.join(process.cwd(), 'next.config.mjs')
    const content = fs.readFileSync(nextConfigPath, 'utf-8')
    assert.ok(
      content.includes('devIndicators: false'),
      'next.config.mjs phải chứa devIndicators: false'
    )
  })

  it('6. Component DesktopView & V2Shell cấu hình chiều cao tràn màn hình không tạo dải trống đáy', () => {
    const desktopViewPath = path.join(
      process.cwd(),
      'components/game/v2/pilot-profile/desktop-view.tsx'
    )
    const desktopContent = fs.readFileSync(desktopViewPath, 'utf-8')
    assert.ok(
      desktopContent.includes('w-full h-full min-h-[640px] flex gap-3 p-3 lg:p-3.5'),
      'DesktopView container phải dùng h-full min-h-[640px]'
    )
    assert.ok(
      !desktopContent.includes('h-[calc(100vh-56px)]'),
      'DesktopView container không được dùng h-[calc(100vh-56px)] gây lệch đáy'
    )

    const shellPath = path.join(
      process.cwd(),
      'components/game/v2/shell/v2-shell.tsx'
    )
    const shellContent = fs.readFileSync(shellPath, 'utf-8')
    assert.ok(
      shellContent.includes('md:h-screen md:max-h-screen'),
      'V2Shell phải thiết lập md:h-screen md:max-h-screen trên desktop'
    )
    assert.ok(
      shellContent.includes('overflow-hidden min-h-0'),
      'V2Shell body flex container phải có min-h-0'
    )
  })
})
