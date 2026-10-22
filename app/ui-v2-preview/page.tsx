'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  Sliders,
  Shield,
  Zap,
  Info,
  Maximize2,
  Trash2,
  Send,
  Smartphone,
  Tablet,
  Monitor,
  Sparkles,
  User,
} from 'lucide-react'
import { PilotProfileV2 } from '@/components/game/v2/pilot-profile/pilot-profile-v2'
import {
  Button,
  IconButton,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Tooltip,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  LoadingState,
  EmptyState,
  ErrorState,
  SuccessState,
  ArtViewer,
} from '@/components/game/v2/ui'

export default function UIV2PreviewPage() {
  const [previewSection, setPreviewSection] = useState<'profile' | 'primitives'>('profile')
  const [viewportMode, setViewportMode] = useState<'responsive' | 'mobile' | 'tablet' | 'desktop'>('responsive')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [buttonLoading, setButtonLoading] = useState(false)
  const [feedbackDemo, setFeedbackDemo] = useState<'loading' | 'empty' | 'error' | 'success'>('loading')
  const [isArtViewerDemoOpen, setIsArtViewerDemoOpen] = useState(false)
  const [artViewerDemoType, setArtViewerDemoType] = useState<'real' | 'archive'>('real')

  const isSimulatedMobile = viewportMode === 'mobile'
  const isSimulatedTablet = viewportMode === 'tablet'

  const viewportContainerStyles = {
    responsive: 'w-full',
    mobile: 'max-w-[390px] mx-auto border-x border-[#26384D] shadow-2xl px-4',
    tablet: 'max-w-[768px] mx-auto border-x border-[#26384D] shadow-2xl px-6',
    desktop: 'max-w-[1440px] mx-auto px-6 sm:px-8',
  }[viewportMode]

  // Responsive grid classes: In simulated mobile mode, strictly enforce 1 column
  const gridTwoCols = isSimulatedMobile
    ? 'grid grid-cols-1 gap-6'
    : 'grid grid-cols-1 md:grid-cols-2 gap-6'

  const gridThreeCols = isSimulatedMobile || isSimulatedTablet
    ? 'grid grid-cols-1 gap-6'
    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'

  return (
    <div className="sf-v2-root min-h-screen text-[#F1F5F9] pb-24 overflow-x-hidden">
      {/* ========================================================================
          TOP BAR NAVIGATION (Streamlined single-tier header, max 56px height on mobile)
          ======================================================================== */}
      <header className="sticky top-0 z-40 bg-[#070A12]/95 backdrop-blur-md border-b border-[#26384D] px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left Zone: Single, prominent QUAY LẠI V1 action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#142338] border border-[#26384D] text-[#F1F5F9] font-medium hover:border-[#06B6D4] hover:bg-[#1E3553] active:bg-[#0F1C2E] transition-all min-h-[44px] text-xs sm:text-sm shrink-0 shadow-xs"
            title="Quay lại giao diện Starfront V1 tại /"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#06B6D4] shrink-0" />
            <span className="font-bold tracking-wide">QUAY LẠI V1</span>
          </Link>

          <span className="text-[#26384D] hidden md:inline">|</span>

          {/* Desktop Version Control Switcher (Hidden on narrow mobile screens) */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-[#0F172A] border border-[#26384D] rounded-xl text-xs font-mono">
            <Link
              href="/"
              className="px-2.5 py-1 rounded-lg text-[#A7B6C8] hover:text-[#F1F5F9] hover:bg-[#142338]/80 transition-colors min-h-[32px] flex items-center justify-center font-medium"
              title="Chuyển sang Starfront V1 (/)"
            >
              STARFRONT V1
            </Link>
            <div
              className="px-2.5 py-1 rounded-lg bg-[#142338] text-[#06B6D4] font-bold border border-[#06B6D4]/40 min-h-[32px] flex items-center justify-center shadow-xs"
              aria-current="page"
            >
              V2 PREVIEW
            </div>
          </div>
        </div>

        {/* Right Zone: Viewport Mode Controls on Desktop / Active Badge on Mobile */}
        <div className="flex items-center gap-2">
          {/* Active indicator on mobile */}
          <span className="inline-flex md:hidden items-center px-2 py-1 rounded text-xs font-mono font-bold tracking-wider bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/40">
            V2 PREVIEW
          </span>

          {/* Viewport Simulation Controls (Desktop only to test responsive containers) */}
          <div className="hidden sm:flex items-center gap-1 bg-[#0F172A] border border-[#26384D] p-1 rounded-lg">
            <button
              type="button"
              title="Kích thước linh hoạt tự nhiên"
              onClick={() => setViewportMode('responsive')}
              className={`min-h-[36px] px-2.5 py-1 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                viewportMode === 'responsive'
                  ? 'bg-[#142338] text-[#06B6D4] font-semibold'
                  : 'text-[#A7B6C8] hover:text-[#F1F5F9]'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5 mr-1" />
              <span>Auto</span>
            </button>
            <button
              type="button"
              title="Mô phỏng Mobile 390px"
              onClick={() => setViewportMode('mobile')}
              className={`min-h-[36px] px-2.5 py-1 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                viewportMode === 'mobile'
                  ? 'bg-[#142338] text-[#06B6D4] font-semibold'
                  : 'text-[#A7B6C8] hover:text-[#F1F5F9]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 mr-1" />
              <span>Mobile (390px)</span>
            </button>
            <button
              type="button"
              title="Mô phỏng Tablet 768px"
              onClick={() => setViewportMode('tablet')}
              className={`min-h-[36px] px-2.5 py-1 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                viewportMode === 'tablet'
                  ? 'bg-[#142338] text-[#06B6D4] font-semibold'
                  : 'text-[#A7B6C8] hover:text-[#F1F5F9]'
              }`}
            >
              <Tablet className="w-3.5 h-3.5 mr-1" />
              <span>Tablet (768px)</span>
            </button>
            <button
              type="button"
              title="Mô phỏng Desktop 1440px"
              onClick={() => setViewportMode('desktop')}
              className={`min-h-[36px] px-2.5 py-1 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                viewportMode === 'desktop'
                  ? 'bg-[#142338] text-[#06B6D4] font-semibold'
                  : 'text-[#A7B6C8] hover:text-[#F1F5F9]'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 mr-1" />
              <span>Desktop</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sub-header Navigation between Pilot Profile V2 and UI Primitives Harness */}
      <div className="sticky top-[57px] z-30 bg-[#0F172A] border-b border-[#26384D] px-3 sm:px-6 py-2 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewSection('profile')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              previewSection === 'profile'
                ? 'bg-[#06B6D4] text-[#070A12] shadow-sm shadow-cyan-500/20'
                : 'bg-[#142338] text-[#A7B6C8] hover:text-[#F1F5F9] border border-[#26384D]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>HỒ SƠ PHI CÔNG V2 (E.0-REBUILD-1)</span>
          </button>
          <button
            type="button"
            onClick={() => setPreviewSection('primitives')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              previewSection === 'primitives'
                ? 'bg-[#06B6D4] text-[#070A12] shadow-sm shadow-cyan-500/20'
                : 'bg-[#142338] text-[#A7B6C8] hover:text-[#F1F5F9] border border-[#26384D]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>UI PRIMITIVES HARNESS</span>
          </button>
        </div>
        <div className="text-xs font-mono text-[#06B6D4] hidden sm:block">
          {previewSection === 'profile' ? 'FND-8 / 8.2.3.E.0' : 'UI Foundation Phase 1'}
        </div>
      </div>

      {previewSection === 'profile' ? (
        <div className={viewportContainerStyles}>
          <PilotProfileV2 />
        </div>
      ) : (
        <main className={`py-6 sm:py-8 space-y-10 ${viewportContainerStyles}`}>
        {/* Version Control Informational Status Banner (No duplicate button) */}
        <section className="p-4 sm:p-5 rounded-xl bg-[#0F172A] border border-[#26384D] shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] mt-1.5 sm:mt-0 animate-pulse shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[#F1F5F9] flex flex-wrap items-center gap-2">
                <span>Môi Trường Nghiệm Thu UI V2 Primitives</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/40 font-bold">
                  V2 PREVIEW ACTIVE
                </span>
              </div>
              <p className="text-xs text-[#A7B6C8] mt-1 leading-relaxed">
                Đang hiển thị bộ UI Primitives Phase 1 tại <code className="text-[#06B6D4] font-mono">/ui-v2-preview</code>. Bấm nút <strong>QUAY LẠI V1</strong> trên thanh tiêu đề để trở về game bất cứ lúc nào.
              </p>
            </div>
          </div>
        </section>

        {/* Intro Section */}
        <section className="bg-[#0F172A] border border-[#26384D] rounded-2xl p-5 sm:p-7">
          <div className="flex items-center gap-2 text-xs font-mono text-[#06B6D4] mb-2 uppercase tracking-wider">
            <span>Modern Aerospace Sci-Fi</span>
            <span>·</span>
            <span>Responsive Test Harness</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F1F5F9] mb-2">
            Hệ Thống Thành Phần Giao Diện V2
          </h2>
          <p className="text-sm sm:text-base text-[#A7B6C8] leading-relaxed">
            Thiết kế đáp ứng linh hoạt: Tự động chuyển về 1 cột trên Mobile 390px, thanh tab hỗ trợ cuộn ngang không làm vỡ trang, nút bấm chống tràn viền, và tooltip hỗ trợ tương tác cảm ứng chạm.
          </p>
        </section>

        {/* 1. BUTTONS & ICON BUTTONS */}
        <section className="space-y-4">
          <div className="border-b border-[#26384D] pb-3">
            <h3 className="text-lg sm:text-xl font-semibold text-[#F1F5F9]">01. Nút bấm (Button & IconButton)</h3>
            <p className="text-xs sm:text-sm text-[#A7B6C8] mt-0.5">Biến thể, kích cỡ, trạng thái tải và tương tác bàn phím (Touch target ≥ 44px).</p>
          </div>

          <div className={gridTwoCols}>
            {/* Variants */}
            <Card variant="panel" className="max-w-full overflow-hidden">
              <CardHeader>
                <CardTitle>Biến Thể Nút (Variants)</CardTitle>
                <CardDescription>Primary, Secondary, Outline, Ghost, Destructive</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2.5">
                <Button variant="primary">Primary Action</Button>
                <Button variant="secondary">Secondary Action</Button>
                <Button variant="outline">Outline Action</Button>
                <Button variant="ghost">Ghost Action</Button>
                <Button variant="destructive">Destructive</Button>
              </CardContent>
            </Card>

            {/* States & Icons */}
            <Card variant="panel" className="max-w-full overflow-hidden">
              <CardHeader>
                <CardTitle>Trạng Thái & Biểu Tượng</CardTitle>
                <CardDescription>Loading, Disabled, Left/Right Icons</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2.5">
                <Button
                  variant="primary"
                  isLoading={buttonLoading}
                  onClick={() => {
                    setButtonLoading(true)
                    setTimeout(() => setButtonLoading(false), 2000)
                  }}
                >
                  {buttonLoading ? 'Đang xử lý...' : 'Bấm thử Loading'}
                </Button>
                <Button variant="secondary" disabled>
                  Nút Vô hiệu hóa
                </Button>
                <Button variant="secondary" leftIcon={<Shield className="w-4 h-4" />}>
                  Có Icon Trái
                </Button>
                <Button variant="primary" rightIcon={<Send className="w-4 h-4" />}>
                  Gửi Đi
                </Button>
              </CardContent>
            </Card>

            {/* Sizes */}
            <Card variant="panel" className="max-w-full overflow-hidden">
              <CardHeader>
                <CardTitle>Kích Cỡ Nút (Sizes)</CardTitle>
                <CardDescription>Tất cả đều đảm bảo ≥ 44px chiều cao</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2.5">
                <Button size="sm" variant="secondary">Cỡ Nhỏ (sm · 44px)</Button>
                <Button size="md" variant="secondary">Cỡ Vừa (md · 44px)</Button>
                <Button size="lg" variant="primary">Cỡ Lớn (lg · 48px)</Button>
              </CardContent>
            </Card>

            {/* Icon Buttons */}
            <Card variant="panel" className="max-w-full overflow-hidden">
              <CardHeader>
                <CardTitle>Nút Biểu Tượng (IconButton)</CardTitle>
                <CardDescription>Bắt buộc có aria-label, touch target 44×44px</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2.5">
                <IconButton
                  aria-label="Cài đặt hệ thống"
                  variant="secondary"
                  icon={<Sliders className="w-5 h-5" />}
                  onClick={() => {}}
                />
                <IconButton
                  aria-label="Kích hoạt khiên"
                  variant="primary"
                  icon={<Shield className="w-5 h-5" />}
                  onClick={() => {}}
                />
                <IconButton
                  aria-label="Nạp năng lượng"
                  variant="outline"
                  icon={<Zap className="w-5 h-5" />}
                  onClick={() => {}}
                />
                <IconButton
                  aria-label="Xóa mục đã chọn"
                  variant="destructive"
                  icon={<Trash2 className="w-5 h-5" />}
                  onClick={() => {}}
                />
                <IconButton
                  aria-label="Đang nạp"
                  variant="secondary"
                  isLoading
                  icon={<Sliders className="w-5 h-5" />}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 2. CARDS & PANELS */}
        <section className="space-y-4">
          <div className="border-b border-[#26384D] pb-3">
            <h3 className="text-lg sm:text-xl font-semibold text-[#F1F5F9]">02. Khung & Thẻ (Card & Panel)</h3>
            <p className="text-xs sm:text-sm text-[#A7B6C8] mt-0.5">Độ sâu 1 cấp, viền hairline tinh tế, tự động chuyển 1 cột trên mobile.</p>
          </div>

          <div className={gridThreeCols}>
            <Card variant="panel" className="max-w-full overflow-hidden">
              <CardHeader bordered>
                <CardTitle>Standard Panel</CardTitle>
                <CardDescription>Bề mặt tiêu chuẩn #0F172A</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 text-sm sm:text-base text-[#F1F5F9] leading-relaxed">
                Khung hiển thị nội dung thông thường với viền mỏng #26384D và padding đồng bộ 20px.
              </CardContent>
              <CardFooter bordered className="flex flex-wrap gap-2 justify-between">
                <Button size="sm" variant="ghost">Hủy</Button>
                <Button size="sm" variant="primary">Lưu Thay Đổi</Button>
              </CardFooter>
            </Card>

            <Card variant="raised" className="max-w-full overflow-hidden">
              <CardHeader bordered>
                <CardTitle>Raised Panel</CardTitle>
                <CardDescription>Bề mặt nâng nổi #142338</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 text-sm sm:text-base text-[#F1F5F9] leading-relaxed">
                Dành cho panel nổi hoặc khu vực điều khiển cần tách biệt nhẹ nhàng so với canvas.
              </CardContent>
              <CardFooter bordered>
                <Button size="sm" variant="secondary" fullWidth>Xem Chi Tiết</Button>
              </CardFooter>
            </Card>

            <Card variant="interactive" className="max-w-full overflow-hidden" onClick={() => alert('Đã bấm vào Interactive Card!')}>
              <CardHeader bordered>
                <div className="flex items-center justify-between">
                  <CardTitle>Interactive Card</CardTitle>
                  <Sparkles className="w-4 h-4 text-[#06B6D4]" />
                </div>
                <CardDescription>Hover hiệu ứng viền Cyan</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 text-sm sm:text-base text-[#F1F5F9] leading-relaxed">
                Nhấp chuột hoặc chạm vào để kích hoạt. Thẻ này phản hồi trạng thái hover và active tự nhiên.
              </CardContent>
              <CardFooter bordered>
                <span className="text-xs font-mono text-[#06B6D4] font-semibold">BẤM ĐỂ CHỌN →</span>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* 3. TABS */}
        <section className="space-y-4">
          <div className="border-b border-[#26384D] pb-3">
            <h3 className="text-lg sm:text-xl font-semibold text-[#F1F5F9]">03. Phân Đoạn & Tab (Tabs)</h3>
            <p className="text-xs sm:text-sm text-[#A7B6C8] mt-0.5">Hỗ trợ cuộn ngang trên mobile, điều hướng mũi tên và tự động cuộn tab đang chọn vào vùng nhìn.</p>
          </div>

          <div className={gridTwoCols}>
            {/* Segmented Variant */}
            <Card variant="panel" className="max-w-full overflow-hidden">
              <CardHeader>
                <CardTitle>Segmented Tabs</CardTitle>
                <CardDescription>Dùng cho bộ chọn trạng thái hoặc chế độ xem</CardDescription>
              </CardHeader>
              <CardContent className="max-w-full overflow-hidden">
                <Tabs defaultValue="specs" variant="segmented">
                  <TabsList>
                    <TabsTrigger value="specs">Thông số</TabsTrigger>
                    <TabsTrigger value="systems">Hệ thống</TabsTrigger>
                    <TabsTrigger value="logs">Nhật ký</TabsTrigger>
                  </TabsList>
                  <TabsContent value="specs" className="text-sm text-[#A7B6C8] leading-relaxed">
                    Động cơ Hyperdrive Sigma-9, công suất định mức 12.400 MW. Thân vỏ hợp kim Titani-Carbide.
                  </TabsContent>
                  <TabsContent value="systems" className="text-sm text-[#A7B6C8] leading-relaxed">
                    Radar quét tầm xa: Hoạt động. Bộ ổn định trường lực: 98%. Nạp đạn tự động: Sẵn sàng.
                  </TabsContent>
                  <TabsContent value="logs" className="text-sm text-[#A7B6C8] leading-relaxed">
                    [04:12:09] Đã hoàn tất cân chỉnh quỹ đạo bay quanh Trạm Ceres.
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Underline Variant */}
            <Card variant="panel" className="max-w-full overflow-hidden">
              <CardHeader>
                <CardTitle>Underline Tabs</CardTitle>
                <CardDescription>Dùng cho điều hướng trang hoặc danh mục lớn</CardDescription>
              </CardHeader>
              <CardContent className="max-w-full overflow-hidden">
                <Tabs defaultValue="overview" variant="underline">
                  <TabsList>
                    <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                    <TabsTrigger value="equipment">Trang bị</TabsTrigger>
                    <TabsTrigger value="story">Tiểu sử</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="text-sm text-[#A7B6C8] leading-relaxed">
                    Tổng quan phi đội số 4, căn cứ tiền phương New Terra. Tổng số phi công trực chiến: 12.
                  </TabsContent>
                  <TabsContent value="equipment" className="text-sm text-[#A7B6C8] leading-relaxed">
                    Phi cơ A-Gear, I-Gear, B-Gear và M-Gear đã kiểm tra tương thích module.
                  </TabsContent>
                  <TabsContent value="story" className="text-sm sm:text-base text-[#F1F5F9] leading-relaxed">
                    Chiến dịch Starfront bắt đầu sau khi cổng dịch chuyển Alpha bị mất liên lạc...
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 4. TOOLTIP */}
        <section className="space-y-4">
          <div className="border-b border-[#26384D] pb-3">
            <h3 className="text-lg sm:text-xl font-semibold text-[#F1F5F9]">04. Chú Thích Nổi (Tooltip)</h3>
            <p className="text-xs sm:text-sm text-[#A7B6C8] mt-0.5">Desktop: rê chuột / phím focus; Mobile: chạm để mở/đóng; tự điều chỉnh vị trí an toàn tránh tràn mép.</p>
          </div>

          <Card variant="panel" className="max-w-full overflow-hidden">
            <CardContent className="pt-5 flex flex-wrap items-center gap-4">
              <Tooltip content="Công suất khiên bảo vệ tối đa: 4.800 MJ" side="top">
                <Button variant="secondary" leftIcon={<Shield className="w-4 h-4" />}>
                  Chú thích trên (Top)
                </Button>
              </Tooltip>

              <Tooltip content="Trạng thái hệ thống: Danh định 100%" side="bottom">
                <Button variant="outline" leftIcon={<Info className="w-4 h-4" />}>
                  Chú thích dưới (Bottom)
                </Button>
              </Tooltip>

              <Tooltip content="Phím tắt: [ESC] để hủy hoặc chạm ra ngoài để đóng" side="right">
                <IconButton
                  aria-label="Xem trợ giúp phím tắt"
                  variant="ghost"
                  icon={<Info className="w-5 h-5 text-[#06B6D4]" />}
                />
              </Tooltip>
            </CardContent>
          </Card>
        </section>

        {/* 5. DIALOG & DRAWER */}
        <section className="space-y-4">
          <div className="border-b border-[#26384D] pb-3">
            <h3 className="text-lg sm:text-xl font-semibold text-[#F1F5F9]">05. Cửa Sổ & Bảng Trượt (Dialog & Drawer)</h3>
            <p className="text-xs sm:text-sm text-[#A7B6C8] mt-0.5">Backdrop mờ, nút đóng 44px rõ ràng, hỗ trợ đóng bằng Escape và chạm ngoài.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => setIsDialogOpen(true)}>
              Mở Hộp Thoại (Modal Dialog)
            </Button>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(true)}>
              Mở Bảng Trượt (Bottom Drawer)
            </Button>
          </div>

          {/* Modal Dialog Instance */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Xác Nhận Thiết Lập Phi Đội</DialogTitle>
                <DialogDescription>
                  Hành động này sẽ cập nhật cấu hình cho toàn bộ phi cơ trong khu vực tác chiến.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 text-sm text-[#A7B6C8] leading-relaxed">
                Các thay đổi bao gồm phân phối năng lượng cho khiên và kích hoạt hệ thống ngắm bắn tự động. Nhấn Xác nhận để tiếp tục.
              </div>
              <DialogFooter className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                  Đóng
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Xác Nhận Thiết Lập
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Drawer Instance */}
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} side="bottom">
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Bảng Điều Khiển Nhanh Tác Chiến</DrawerTitle>
                <DrawerDescription>
                  Bảng trượt tối ưu cho thao tác chạm trên thiết bị di động với thanh gạt và nút thoát dễ bấm.
                </DrawerDescription>
              </DrawerHeader>
              <DrawerBody>
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#142338] border border-[#26384D]">
                    <div className="text-sm font-semibold text-[#F1F5F9]">Tần số liên lạc: Channel 08</div>
                    <div className="text-xs text-[#A7B6C8] mt-1">Tín hiệu mã hóa lượng tử Starfront.</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#142338] border border-[#26384D]">
                    <div className="text-sm font-semibold text-[#F1F5F9]">Chế độ tiết kiệm pin</div>
                    <div className="text-xs text-[#A7B6C8] mt-1">Giảm độ sáng radar phụ khi không có mục tiêu.</div>
                  </div>
                </div>
              </DrawerBody>
              <DrawerFooter>
                <Button variant="secondary" fullWidth onClick={() => setIsDrawerOpen(false)}>
                  Hoàn Tất
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </section>

        {/* 6. FEEDBACK STATES */}
        <section className="space-y-4">
          <div className="border-b border-[#26384D] pb-3">
            <h3 className="text-lg sm:text-xl font-semibold text-[#F1F5F9]">06. Trạng Thái Phản Hồi (Feedback States)</h3>
            <p className="text-xs sm:text-sm text-[#A7B6C8] mt-0.5">Loading, Empty, Error, Success với biểu tượng rõ ràng và nút hành động phục hồi.</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              size="sm"
              variant={feedbackDemo === 'loading' ? 'primary' : 'outline'}
              onClick={() => setFeedbackDemo('loading')}
            >
              Loading
            </Button>
            <Button
              size="sm"
              variant={feedbackDemo === 'empty' ? 'primary' : 'outline'}
              onClick={() => setFeedbackDemo('empty')}
            >
              Empty
            </Button>
            <Button
              size="sm"
              variant={feedbackDemo === 'error' ? 'primary' : 'outline'}
              onClick={() => setFeedbackDemo('error')}
            >
              Error
            </Button>
            <Button
              size="sm"
              variant={feedbackDemo === 'success' ? 'primary' : 'outline'}
              onClick={() => setFeedbackDemo('success')}
            >
              Success
            </Button>
          </div>

          <div>
            {feedbackDemo === 'loading' && (
              <LoadingState
                title="Đang đồng bộ dữ liệu phi đội..."
                description="Vui lòng chờ trong giây lát khi hệ thống kết nối với vệ tinh Starfront."
              />
            )}
            {feedbackDemo === 'empty' && (
              <EmptyState
                title="Chưa có phi công nào trong danh sách"
                description="Bạn có thể tuyển mộ phi công mới từ trung tâm chỉ huy."
                action={{
                  label: 'Tuyển Mộ Ngay',
                  onClick: () => alert('Hành động tuyển mộ'),
                  variant: 'primary',
                }}
              />
            )}
            {feedbackDemo === 'error' && (
              <ErrorState
                title="Mất liên lạc vệ tinh"
                description="Không thể nhận gói tin đo đạc từ trạm phát sóng ngoài quỹ đạo."
                errorDetails="ERR_CONN_DROPPED: Uplink channel 4 timeout (12000ms)"
                onRetry={() => alert('Thử kết nối lại...')}
                retryLabel="Thử Kết Nối Lại"
              />
            )}
            {feedbackDemo === 'success' && (
              <SuccessState
                title="Đã lưu cấu hình thành công"
                description="Mọi thay đổi đã được áp dụng vào nhật ký hệ thống."
                action={{
                  label: 'Tiếp Tục',
                  onClick: () => setFeedbackDemo('loading'),
                  variant: 'primary',
                }}
              />
            )}
          </div>
        </section>

        {/* 07. SHARED ART VIEWER (PHASE 2) */}
        <section className="space-y-4">
          <div className="border-b border-[#26384D] pb-3">
            <h3 className="text-lg sm:text-xl font-semibold text-[#F1F5F9]">
              07. Trình Xem Tranh Dùng Chung (Shared Art Viewer — Phase 2)
            </h3>
            <p className="text-xs sm:text-sm text-[#A7B6C8] mt-0.5">
              Hỗ trợ pinch-to-zoom 2 ngón, pan 1 ngón có giới hạn biên an toàn, nút thu phóng, phím Escape, scroll lock, safe area và archive fallback chống lỗi 404.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={() => {
                setArtViewerDemoType('real')
                setIsArtViewerDemoOpen(true)
              }}
            >
              Mở Thử Nghiệm Art Viewer (Ảnh Thật WebP)
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setArtViewerDemoType('archive')
                setIsArtViewerDemoOpen(true)
              }}
            >
              Mở Thử Nghiệm Fallback (Thẻ Archive Metadata)
            </Button>
          </div>

          <ArtViewer
            isOpen={isArtViewerDemoOpen}
            onClose={() => setIsArtViewerDemoOpen(false)}
            imageSrc={
              artViewerDemoType === 'real'
                ? '/images/valentine-fullbody.webp'
                : '/images/valentine-outfit-001.webp'
            }
            title={
              artViewerDemoType === 'real'
                ? 'Valentine — Tranh Toàn Thân Chiến Trường'
                : 'Phi Công Valentine Trong Buồng Lái Vũ Trụ'
            }
            subtitle="Valentine Aurelia Vance · Mercy Wing"
            category={artViewerDemoType === 'real' ? 'base' : 'flight-suit'}
            description={
              artViewerDemoType === 'real'
                ? 'Artwork chính thức độ phân giải cao được tối ưu hóa WebP. Hỗ trợ zoom 1x-3x, pan chuột, pinch 2 ngón trên mobile và phím Escape.'
                : 'Tác phẩm đang ở trạng thái danh mục chờ đồng bộ tệp WebP. Hệ thống hiển thị thẻ metadata lưu trữ mà không phát sinh lỗi HTTP 404.'
            }
            tags={['Combat Medic', 'Elysia', 'V2 Artwork']}
            isAvailableOnDisk={artViewerDemoType === 'real'}
          />
        </section>
      </main>
      )}
    </div>
  )
}
