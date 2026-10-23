'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  FileText,
} from 'lucide-react';
import type { ManifestAssetItem } from '@/lib/game/assets/release-manifest';

export interface FullscreenArtworkViewerProps {
  items: ManifestAssetItem[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  releaseTag: string;
}

export function FullscreenArtworkViewer({
  items,
  initialIndex = 0,
  isOpen,
  onClose,
  releaseTag,
}: FullscreenArtworkViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [copiedSha, setCopiedSha] = useState(false);
  const [currentScale, setCurrentScale] = useState(1);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  // Sync index on open
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, items.length - 1)));
      setIsLoading(true);
      setLoadError(false);
    }
  }, [isOpen, initialIndex, items.length]);

  const currentItem = items[currentIndex];

  // Reset transform when changing item
  useEffect(() => {
    setIsLoading(true);
    setLoadError(false);
    setNaturalDimensions(null);
    if (transformRef.current) {
      transformRef.current.resetTransform();
    }
  }, [currentIndex]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentIndex(items.length - 1);
      }
    },
    [isOpen, items.length, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const copyShaToClipboard = () => {
    if (!currentItem?.sha256) return;
    navigator.clipboard.writeText(currentItem.sha256);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  if (!isOpen || !currentItem) return null;

  const imageUrl = currentItem.cdnUrl || `/images/${currentItem.fileName}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen Artwork Inspector"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md select-none"
    >
      {/* Top HUD Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/30 bg-slate-900/80">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 font-mono text-xs">
            <span className="font-bold">{currentIndex + 1}</span>
            <span className="text-cyan-600">/</span>
            <span>{items.length}</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100 font-mono truncate">
                {currentItem.fileName}
              </h2>
              {currentItem.diffStatus && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                    currentItem.diffStatus === 'ADDED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : currentItem.diffStatus === 'CHANGED'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : currentItem.diffStatus === 'REMOVED'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {currentItem.diffStatus}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-cyan-400 font-medium">{currentItem.pilotName}</span>
              <span>·</span>
              <span className="capitalize">{currentItem.category}</span>
              {naturalDimensions && (
                <>
                  <span>·</span>
                  <span className="font-mono text-slate-300">
                    {naturalDimensions.width}×{naturalDimensions.height} px
                  </span>
                </>
              )}
              {currentItem.sizeKB && (
                <>
                  <span>·</span>
                  <span className="font-mono text-slate-300">{currentItem.sizeKB} KB</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {currentItem.sha256 && (
            <button
              onClick={copyShaToClipboard}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title={`SHA-256: ${currentItem.sha256}`}
            >
              {copiedSha ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-mono text-[11px]">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-[11px] text-slate-400">
                    {currentItem.sha256.slice(0, 10)}…
                  </span>
                </>
              )}
            </button>
          )}

          <div className="h-4 w-px bg-slate-700 hidden md:block" />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Đóng viewer"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 hover:border-rose-500/50 text-slate-400 border border-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-slate-950">
        {/* Navigation Previous Button */}
        <button
          onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))}
          aria-label="Tác phẩm trước (Arrow Left)"
          className="absolute left-4 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-cyan-950/80 border border-slate-700 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-400 transition backdrop-blur-sm shadow-xl"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Navigation Next Button */}
        <button
          onClick={() => setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0))}
          aria-label="Tác phẩm tiếp theo (Arrow Right)"
          className="absolute right-4 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-cyan-950/80 border border-slate-700 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-400 transition backdrop-blur-sm shadow-xl"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-950/60">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-xs font-mono text-cyan-400">Đang tải artwork nguyên bản...</span>
          </div>
        )}

        {/* Error State */}
        {loadError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-rose-400" />
            <h3 className="text-sm font-bold text-rose-300 font-mono">
              Không thể tải hình ảnh từ CDN
            </h3>
            <p className="text-xs text-slate-400 max-w-md break-all font-mono">
              {imageUrl}
            </p>
            <button
              onClick={() => {
                setIsLoading(true);
                setLoadError(false);
              }}
              className="px-3 py-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              Thử tải lại
            </button>
          </div>
        )}

        {/* Zoom & Pan Container */}
        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={0.25}
          maxScale={4.0}
          centerOnInit
          wheel={{ step: 0.1 }}
          doubleClick={{ mode: 'zoomIn', step: 0.7 }}
          panning={{ disabled: false }}
          onTransformed={undefined}
          onTransformedStep={undefined}
          {...({
            onTransform: (_: any, state: any) => {
              if (state && typeof state.scale === 'number') {
                setCurrentScale(state.scale);
              }
            },
          } as any)}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <TransformComponent
                wrapperClass="!w-full !h-full flex items-center justify-center"
                contentClass="flex items-center justify-center min-w-full min-h-full"
              >
                {/* Native Original Image */}
                <img
                  src={imageUrl}
                  alt={currentItem.fileName}
                  className="max-w-[90vw] max-h-[80vh] object-contain select-none transition-opacity duration-150"
                  style={{ opacity: isLoading ? 0 : 1 }}
                  onLoad={(e) => {
                    setIsLoading(false);
                    const target = e.currentTarget;
                    setNaturalDimensions({
                      width: target.naturalWidth,
                      height: target.naturalHeight,
                    });
                  }}
                  onError={() => {
                    setIsLoading(false);
                    setLoadError(true);
                  }}
                  draggable={false}
                />
              </TransformComponent>

              {/* Floating Bottom Toolbar */}
              <div className="absolute bottom-5 z-20 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-md shadow-2xl text-slate-300">
                <button
                  onClick={() => zoomIn(0.25)}
                  title="Phóng to (Zoom In)"
                  aria-label="Phóng to"
                  className="p-1.5 rounded hover:bg-slate-800 hover:text-cyan-400 text-slate-300 transition"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => zoomOut(0.25)}
                  title="Thu nhỏ (Zoom Out)"
                  aria-label="Thu nhỏ"
                  className="p-1.5 rounded hover:bg-slate-800 hover:text-cyan-400 text-slate-300 transition"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                <button
                  onClick={() => resetTransform()}
                  title="Vừa khung hình (Fit to Screen)"
                  aria-label="Vừa khung hình"
                  className="px-2 py-1 text-xs rounded hover:bg-slate-800 hover:text-cyan-400 font-mono transition"
                >
                  Fit
                </button>

                <button
                  onClick={() => {
                    if (transformRef.current) {
                      transformRef.current.setTransform(0, 0, 1);
                    }
                  }}
                  title="Kích thước thực 100% (Actual Size)"
                  aria-label="Kích thước thực"
                  className="px-2 py-1 text-xs rounded hover:bg-slate-800 hover:text-cyan-400 font-mono transition"
                >
                  100%
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                <span className="text-[11px] font-mono text-cyan-400 px-1">
                  {Math.round(currentScale * 100)}%
                </span>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                <button
                  onClick={() => resetTransform()}
                  title="Đặt lại vị trí (Reset View)"
                  aria-label="Đặt lại góc nhìn"
                  className="p-1.5 rounded hover:bg-slate-800 hover:text-cyan-400 text-slate-300 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </TransformWrapper>
      </div>

      {/* Footer Info Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 bg-slate-900/60 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span className="text-slate-500">Phím tắt:</span>
          <span>← / → chuyển ảnh</span>
          <span>·</span>
          <span>Esc đóng</span>
          <span>·</span>
          <span>Cuộn chuột phóng to/thu nhỏ</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span>Release:</span>
          <span className="text-cyan-400 font-bold">{releaseTag}</span>
        </div>
      </div>
    </div>
  );
}
