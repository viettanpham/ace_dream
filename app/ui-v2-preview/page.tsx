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
} from 'lucide-react'
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
} from '@/components/game/v2/ui'

export default function UIV2PreviewPage() {
  const [viewportMode, setViewportMode] = useState<'responsive' | 'mobile' | 'tablet' | 'desktop'>('responsive')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [buttonLoading, setButtonLoading] = useState(false)
  const [feedbackDemo, setFeedbackDemo] = useState<'loading' | 'empty' | 'error' | 'success'>('loading')

  const viewportContainerStyles = {
    responsive: 'w-full',
    mobile: 'max-w-[390px] mx-auto border-x border-[#26384D] shadow-2xl',
    tablet: 'max-w-[768px] mx-auto border-x border-[#26384D] shadow-2xl',
    desktop: 'max-w-[1440px] mx-auto',
  }[viewportMode]

  return (
    <div className="sf-v2-root min-h-screen text-[#F1F5F9] pb-24">
      {/* Top Bar Navigation for Preview Harness */}
      <header className="sticky top-0 z-40 bg-[#070A12]/90 backdrop-blur-md border-b border-[#26384D] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#A7B6C8] hover:text-[#06B6D4] transition-colors min-h-[44px] px-2"
          >
            <ChevronLeft className="w-5 h-5 shrink-0" />
            <span>Trở về Starfront V1</span>
          </Link>
          <span className="text-[#26384D] hidden sm:inline">|</span>
          <h1 className="text-base sm:text-lg font-semibold tracking-tight text-[#F1F5F9] truncate">
            UI V2 Foundation Primitives
          </h1>
        </div>

        {/* Viewport Simulation Controls */}
        <div className="flex items-center gap-1 bg-[#0F172A] border border-[#26384D] p-1 rounded-lg">
          <button
            type="button"
            title="Kích thước linh hoạt"
            onClick={() => setViewportMode('responsive')}
            className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:px-2.5 sm:py-1.5 flex items-center justify-center rounded text-xs font-medium transition-colors ${
              viewportMode === 'responsive'
                ? 'bg-[#142338] text-[#06B6D4] font-semibold'
                : 'text-[#A7B6C8] hover:text-[#F1F5F9]'
            }`}
          >
            <Maximize2 className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Auto</span>
          </button>
          <button
            type="button"
            title="Mô phỏng Mobile 390px"
            onClick={() => setViewportMode('mobile')}
            className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:px-2.5 sm:py-1.5 flex items-center justify-center rounded text-xs font-medium transition-colors ${
              viewportMode === 'mobile'
                ? 'bg-[#142338] text-[#06B6D4] font-semibold'
                : 'text-[#A7B6C8] hover:text-[#F1F5F9]'
            }`}
          >
            <Smartphone className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Mobile (390px)</span>
          </button>
          <button
            type="button"
            title="Mô phỏng Tablet 768px"
            onClick={() => setViewportMode('tablet')}
            className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:px-2.5 sm:py-1.5 flex items-center justify-center rounded text-xs font-medium transition-colors ${
              viewportMode === 'tablet'
                ? 'bg-[#142338] text-[#06B6D4] font-semibold'
                : 'text-[#A7B6C8] hover:text-[#F1F5F9]'
            }`}
          >
            <Tablet className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Tablet (768px)</span>
          </button>
          <button
            type="button"
            title="Mô phỏng Desktop 1440px"
            onClick={() => setViewportMode('desktop')}
            className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:px-2.5 sm:py-1.5 flex items-center justify-center rounded text-xs font-medium transition-colors ${
              viewportMode === 'desktop'
                ? 'bg-[#142338] text-[#06B6D4] font-semibold'
                : 'text-[#A7B6C8] hover:text-[#F1F5F9]'
            }`}
          >
            <Monitor className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
        </div>
      </header>

      {/* Main Preview Harness Area */}
      <main className={`p-4 sm:p-8 space-y-12 ${viewportContainerStyles}`}>
        {/* Intro Banner */}
        <section className="bg-[#0F172A] border border-[#26384D] rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 text-xs font-mono text-[#06B6D4] mb-2 uppercase tracking-wider">
            <span>Modern Aerospace Sci-Fi</span>
            <span>·</span>
            <span>Phase 1 Verification Harness</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F1F5F9] mb-3">
            Hệ Thống Thành Phần Giao Diện V2
          </h2>
          <p className="text-base text-[#A7B6C8] max-w-2xl leading-relaxed">
            Bộ thành phần độc lập hoàn toàn với V1: tuân thủ nghiêm ngặt chuẩn touch target tối thiểu 44px trên thiết bị cảm ứng, cỡ chữ văn bản chuẩn 16px, tương phản cao, và không sử dụng CRT scanlines.
          </p>
        </section>

        {/* 1. BUTTONS & ICON BUTTONS */}
        <section className="space-y-6">
          <div className="border-b border-[#26384D] pb-3">
            <h3 className="text-xl font-semibold text-[#F1F5F9]">01. Nút bấm (Button & IconButton)</h3>
            <p className="text-sm text-[#A7B6C8] mt-1">Các biến thể, kích cỡ, trạng thái tải và tương tác bàn phím.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Variants */}
            <Card variant="panel">
              <CardHeader>
                <CardTitle>Biến Thể Nút (Variants)</CardTitle>
                <CardDescription>Primary, Secondary, Outline, Ghost, Destructive</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="primary">Primary Action</Button>
                <Button variant="secondary">Secondary Action</Button>
                <Button variant="outline">Outline Action</Button>
                <Button variant="ghost">Ghost Action</Button>
                <Button variant="destructive">Destructive</Button>
              </CardContent>
            </Card>

            {/* States & Icons */}
            <Card variant="panel">
              <CardHeader>
                <CardTitle>Trạng Thái & Biểu Tượng</CardTitle>
                <CardDescription>Loading, Disabled, Left/Right Icons</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
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
            <Card variant="panel">
              <CardHeader>
                <CardTitle>Kích Cỡ Nút (Sizes)</CardTitle>
                <CardDescription>Tất cả đều đảm bảo $\ge$ 44px chiều cao</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="secondary">Cỡ Nhỏ (sm · 44px)</Button>
                <Button size="md" variant="secondary">Cỡ Vừa (md · 44px)</Button>
                <Button size="lg" variant="primary">Cỡ Lớn (lg · 48px)</Button>
              </CardContent>
            </Card>

            {/* Icon Buttons */}
            <Card variant="panel">
              <CardHeader>
                <CardTitle>Nút Biểu Tượng (IconButton)</CardTitle>
                <CardDescription>Bắt buộc có aria-label, touch target 44×44px</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
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
        <section className="space-y-6">
          <div className="border-b border-[#26384D] pb-3">
            <h3 className="text-xl font-semibold text-[#F1F5F9]">02. Khung & Thẻ (Card & Panel)</h3>
            <p className="text-sm text-[#A7B6C8] mt-1">Độ sâu 1 cấp, viền hairline tinh tế, không lồng card con.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="panel">
              <CardHeader bordered>
                <CardTitle>Standard Panel</CardTitle>
                <CardDescription>Bề mặt tiêu chuẩn #0F172A</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 text-base text-[#F1F5F9]">
                Khung hiển thị nội dung thông thường với viền mỏng #26384D và padding đồng bộ 20px.
              </CardContent>
              <CardFooter bordered>
                <Button size="sm" variant="ghost">Hủy</Button>
                <Button size="sm" variant="primary" className="ml-auto">Lưu</Button>
              </CardFooter>
            </Card>

            <Card variant="raised">
              <CardHeader bordered>
                <CardTitle>Raised Panel</CardTitle>
                <CardDescription>Bề mặt nâng nổi #142338</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 text-base text-[#F1F5F9]">
                Dành cho panel nổi hoặc khu vực điều khiển cần tách biệt nhẹ nhàng so với canvas.
              </CardContent>
              <CardFooter bordered>
                <Button size="sm" variant="secondary" className="w-full">Xem chi tiết</Button>
              </CardFooter>
            </Card>

            <Card variant="interactive" onClick={() => alert('Đã bấm vào Interactive Card!')}>
              <CardHeader bordered>
                <div className="flex items-center justify-between">
                  <CardTitle>Interactive Card</CardTitle>
                  <Sparkles className="w-4 h-4 text-[#06B6D4]" />
                </div>
                <CardDescription>Hover hiệu ứng viền Cyan</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 text-base text-[#F1F5F9]">
                Nhấp chuột hoặc chạm vào để kích hoạt. Thẻ này phản hồi trạng thái hover và active tự nhiên.
              </CardContent>
              <CardFooter bordered>
                <span className="text-xs font-mono text-[#06B6D4]">BẤM ĐỂ CHỌN →</span>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* 3. TABS */}
        <section className="space-y-6">
          <div className="border-b border-[#26384D] pb-3">
            <h3 className="text-xl font-semibold text-[#F1F5F9]">03. Phân Đoạn & Tab (Tabs)</h3>
            <p className="text-sm text-[#A7B6C8] mt-1">Segmented controls và Underline tabs hỗ trợ phím mũi tên và touch target 44px.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Segmented Variant */}
            <Card variant="panel">
              <CardHeader>
                <CardTitle>Segmented Tabs</CardTitle>
                <CardDescription>Dùng cho bộ chọn trạng thái hoặc chế độ xem</CardDescription>
              </CardHeader>
              <CardContent>
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
            <Card variant="panel">
              <CardHeader>
                <CardTitle>Underline Tabs</CardTitle>
                <CardDescription>Dùng cho điều hướng trang hoặc danh mục lớn</CardDescription>
              </CardHeader>
              <CardContent>
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
                  <TabsContent value="story" className="text-base text-[#F1F5F9] leading-relaxed">
                    Chiến dịch Starfront bắt đầu sau khi cổng dịch chuyển Alpha bị mất liên lạc...
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 4. TOOLTIP */}
        <section className="space-y-6">
          <div className="border-b border-[#26384D] pb-3">
            <h3 className="text-xl font-semibold text-[#F1F5F9]">04. Chú Thích Nổi (Tooltip)</h3>
            <p className="text-sm text-[#A7B6C8] mt-1">Kích hoạt khi rê chuột hoặc di chuyển bàn phím (Focus), đóng bằng phím Escape.</p>
          </div>

          <Card variant="panel">
            <CardContent className="pt-5 flex flex-wrap items-center gap-6">
              <Tooltip content="Công suất khiên bảo vệ tối đa: 4.800 MJ" side="top">
                <Button variant="secondary" leftIcon={<Shield className="w-4 h-4" />}>
                  Rê chuột vào đây (Top)
                </Button>
              </Tooltip>

              <Tooltip content="Trạng thái hệ thống: Danh định 100%" side="bottom">
                <Button variant="outline" leftIcon={<Info className="w-4 h-4" />}>
                  Rê chuột vào đây (Bottom)
                </Button>
              </Tooltip>

              <Tooltip content="Phím tắt: [ESC] để hủy thao tác" side="right">
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
        <section className="space-y-6">
          <div className="border-b border-[#26384D] pb-3">
            <h3 className="text-xl font-semibold text-[#F1F5F9]">05. Cửa Sổ & Bảng Trượt (Dialog & Drawer)</h3>
            <p className="text-sm text-[#A7B6C8] mt-1">Backdrop mờ, nút đóng 44px rõ ràng, hỗ trợ đóng bằng Escape và click ngoài.</p>
          </div>

          <div className="flex flex-wrap gap-4">
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
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                  Đóng
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsDialogOpen(false)
                  }}
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
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#142338] border border-[#26384D]">
                    <div className="text-sm font-semibold text-[#F1F5F9]">Tần số liên lạc: Channel 08</div>
                    <div className="text-xs text-[#A7B6C8] mt-1">Tín hiệu mã hóa lượng tử Starfront.</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#142338] border border-[#26384D]">
                    <div className="text-sm font-semibold text-[#F1F5F9]">Chế độ tiết kiệm pin</div>
                    <div className="text-xs text-[#A7B6C8] mt-1">Giảm độ sáng radar phụ khi không có mục tiêu.</div>
                  </div>
                </div>
              </DrawerBody>
              <DrawerFooter>
                <Button variant="secondary" className="w-full" onClick={() => setIsDrawerOpen(false)}>
                  Hoàn Tất
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </section>

        {/* 6. FEEDBACK STATES */}
        <section className="space-y-6">
          <div className="border-b border-[#26384D] pb-3">
            <h3 className="text-xl font-semibold text-[#F1F5F9]">06. Trạng Thái Phản Hồi (Feedback States)</h3>
            <p className="text-sm text-[#A7B6C8] mt-1">Loading, Empty, Error, Success với biểu tượng rõ ràng và nút hành động phục hồi.</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              size="sm"
              variant={feedbackDemo === 'loading' ? 'primary' : 'outline'}
              onClick={() => setFeedbackDemo('loading')}
            >
              Xem Loading
            </Button>
            <Button
              size="sm"
              variant={feedbackDemo === 'empty' ? 'primary' : 'outline'}
              onClick={() => setFeedbackDemo('empty')}
            >
              Xem Empty
            </Button>
            <Button
              size="sm"
              variant={feedbackDemo === 'error' ? 'primary' : 'outline'}
              onClick={() => setFeedbackDemo('error')}
            >
              Xem Error
            </Button>
            <Button
              size="sm"
              variant={feedbackDemo === 'success' ? 'primary' : 'outline'}
              onClick={() => setFeedbackDemo('success')}
            >
              Xem Success
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
      </main>
    </div>
  )
}
