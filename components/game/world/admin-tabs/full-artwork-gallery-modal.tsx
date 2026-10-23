'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Search,
  Filter,
  ArrowUpDown,
  Maximize2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import type {
  ManifestAssetItem,
  ReleaseManifest,
  VersionDiffSummary,
  AssetCategory,
  AssetDiffStatus,
} from '@/lib/game/assets/release-manifest';
import { FullscreenArtworkViewer } from '@/components/game/assets/fullscreen-artwork-viewer';

export interface FullArtworkGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTag: string;
  targetTag: string;
}

const ITEMS_PER_PAGE = 24;

export function FullArtworkGalleryModal({
  isOpen,
  onClose,
  activeTag,
  targetTag,
}: FullArtworkGalleryModalProps) {
  const [manifest, setManifest] = useState<ReleaseManifest | null>(null);
  const [diffSummary, setDiffSummary] = useState<VersionDiffSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPilot, setSelectedPilot] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDiffStatus, setSelectedDiffStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'size_desc' | 'category' | 'diff'>('name_asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Fullscreen Viewer State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Load manifest & diff
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [manifestRes, diffRes] = await Promise.all([
        fetch(`/api/admin/asset-version/manifest?tag=${encodeURIComponent(targetTag)}`, {
          headers: { credentials: 'same-origin' },
        }),
        fetch(
          `/api/admin/asset-version/diff?activeTag=${encodeURIComponent(
            activeTag
          )}&targetTag=${encodeURIComponent(targetTag)}`,
          { headers: { credentials: 'same-origin' } }
        ),
      ]);

      const manifestData = await manifestRes.json();
      const diffData = await diffRes.json();

      if (!manifestRes.ok || !manifestData.success) {
        throw new Error(manifestData.error || `HTTP ${manifestRes.status}`);
      }

      setManifest(manifestData.manifest);

      if (diffRes.ok && diffData.success) {
        setDiffSummary(diffData.diff);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Không thể tải dữ liệu manifest.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTag, targetTag]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  // Combine items with diff status
  const allItems: ManifestAssetItem[] = useMemo(() => {
    if (diffSummary?.diffItems) {
      return diffSummary.diffItems;
    }
    if (manifest?.assets) {
      return manifest.assets;
    }
    return [];
  }, [diffSummary, manifest]);

  // Extract pilots present in current items
  const availablePilots = useMemo(() => {
    const pilotMap = new Map<string, string>();
    for (const item of allItems) {
      pilotMap.set(item.pilotId, item.pilotName);
    }
    return Array.from(pilotMap.entries()).map(([id, name]) => ({ id, name }));
  }, [allItems]);

  // Filter & Search Logic
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.fileName.toLowerCase().includes(q);
        const matchPilot = item.pilotName.toLowerCase().includes(q);
        const matchSha = item.sha256?.toLowerCase().includes(q);
        if (!matchName && !matchPilot && !matchSha) return false;
      }

      // Pilot
      if (selectedPilot !== 'all' && item.pilotId !== selectedPilot) {
        return false;
      }

      // Category
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Diff Status
      if (selectedDiffStatus !== 'all' && item.diffStatus !== selectedDiffStatus) {
        return false;
      }

      return true;
    });
  }, [allItems, searchQuery, selectedPilot, selectedCategory, selectedDiffStatus]);

  // Sorting
  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    list.sort((a, b) => {
      if (sortBy === 'name_asc') return a.fileName.localeCompare(b.fileName);
      if (sortBy === 'name_desc') return b.fileName.localeCompare(a.fileName);
      if (sortBy === 'size_desc') return (b.sizeBytes || 0) - (a.sizeBytes || 0);
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      if (sortBy === 'diff') return (a.diffStatus || '').localeCompare(b.diffStatus || '');
      return 0;
    });
    return list;
  }, [filteredItems, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedItems.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedItems, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedPilot, selectedCategory, selectedDiffStatus, sortBy]);

  const handleOpenViewer = (indexInPaginated: number) => {
    const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + indexInPaginated;
    setViewerIndex(globalIndex);
    setViewerOpen(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Thư Viện Artwork Release Chi Tiết"
        className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md"
      >
        <div className="flex flex-col w-full max-w-7xl h-[92vh] bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden">
          {/* Top Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-slate-950/70">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-100 font-mono">
                    THƯ VIỆN ARTWORK CHI TIẾT
                  </h2>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono text-xs font-bold">
                    {targetTag}
                  </span>
                  {activeTag !== targetTag && (
                    <span className="text-xs text-slate-400 font-mono">
                      (Đối chiếu với Active: <span className="text-amber-400">{activeTag}</span>)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Dữ liệu trích xuất trực tiếp từ manifest phát hành trên jsDelivr CDN
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                disabled={isLoading}
                aria-label="Làm mới manifest"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
                <span className="hidden sm:inline">Làm mới</span>
              </button>

              <button
                onClick={onClose}
                aria-label="Đóng thư viện"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 hover:border-rose-500/50 text-slate-400 border border-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Version Diff Summary Banner */}
          {diffSummary && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-slate-950/40 border-b border-slate-800 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="text-slate-500">Tổng Artwork:</span>
                  <span className="font-bold text-slate-100">{diffSummary.totalTarget}</span>
                  <span className="text-slate-500">(Active: {diffSummary.totalActive})</span>
                </div>

                <div className="h-3 w-px bg-slate-800 hidden sm:block" />

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Mới: {diffSummary.addedCount}
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Sửa đổi: {diffSummary.changedCount}
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Bị xóa: {diffSummary.removedCount}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    Không đổi: {diffSummary.unchangedCount}
                  </span>
                </div>
              </div>

              {/* Compatibility Check */}
              <div>
                {diffSummary.isCompatible ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tương thích 100% Core Assets
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Thiếu {diffSummary.missingRequiredAssets.length} core assets bắt buộc!
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên file, phi công, sha256..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-500 text-xs text-slate-200 placeholder-slate-500 font-mono outline-none transition"
                />
              </div>

              {/* Pilot Filter */}
              <select
                value={selectedPilot}
                onChange={(e) => setSelectedPilot(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono outline-none focus:border-cyan-500 transition"
              >
                <option value="all">Tất cả Phi công ({allItems.length})</option>
                {availablePilots.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono outline-none focus:border-cyan-500 transition"
              >
                <option value="all">Tất cả Thể loại</option>
                <option value="portrait">Chân dung (Portrait)</option>
                <option value="fullbody">Toàn thân (Fullbody)</option>
                <option value="combat">Chiến đấu (Combat)</option>
                <option value="closeup">Cận cảnh (Closeup)</option>
                <option value="activity">Hoạt động (Activity)</option>
                <option value="outfit">Trang phục (Outfit/Uniform)</option>
                <option value="story">Cốt truyện (Story)</option>
                <option value="gear">Cơ giáp (Mecha GEAR)</option>
                <option value="other">Khác (Other)</option>
              </select>

              {/* Diff Status Filter */}
              <select
                value={selectedDiffStatus}
                onChange={(e) => setSelectedDiffStatus(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono outline-none focus:border-cyan-500 transition"
              >
                <option value="all">Tất cả Trạng thái</option>
                <option value="ADDED">Mới (+ Added)</option>
                <option value="CHANGED">Thay đổi (~ Changed)</option>
                <option value="UNCHANGED">Không đổi (= Unchanged)</option>
                <option value="REMOVED">Bị xóa (- Removed)</option>
              </select>
            </div>

            {/* Sorting & Counter */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono">
                Hiển thị <span className="font-bold text-cyan-400">{sortedItems.length}</span> / {allItems.length} tác phẩm
              </span>

              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-300 font-mono outline-none focus:border-cyan-500 transition"
              >
                <option value="name_asc">Tên (A-Z)</option>
                <option value="name_desc">Tên (Z-A)</option>
                <option value="size_desc">Dung lượng lớn nhất</option>
                <option value="category">Thể loại</option>
                <option value="diff">Trạng thái Diff</option>
              </select>
            </div>
          </div>

          {/* Grid Container */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-950/60">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-cyan-400">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <span className="text-xs font-mono">Đang tải manifest và phân tích tác phẩm...</span>
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-rose-400 text-center">
                <AlertTriangle className="w-10 h-10" />
                <p className="text-sm font-bold font-mono">{loadError}</p>
                <button
                  onClick={loadData}
                  className="px-4 py-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  Thử lại
                </button>
              </div>
            ) : sortedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Layers className="w-10 h-10 mb-2 opacity-50" />
                <span className="text-sm font-mono">Không tìm thấy tác phẩm nào khớp với bộ lọc.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {paginatedItems.map((item, idx) => {
                  const imageUrl = item.cdnUrl || `/images/${item.fileName}`;
                  return (
                    <div
                      key={item.relativePath}
                      onClick={() => handleOpenViewer(idx)}
                      className="group relative flex flex-col bg-slate-900 border border-slate-800 hover:border-cyan-500/60 rounded-xl overflow-hidden cursor-pointer transition hover:shadow-lg hover:shadow-cyan-950/50"
                    >
                      {/* Thumbnail Container */}
                      <div className="relative aspect-square w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={item.fileName}
                          loading="lazy"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                        />

                        {/* Diff Status Badge */}
                        {item.diffStatus && (
                          <div className="absolute top-2 left-2 z-10">
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow ${
                                item.diffStatus === 'ADDED'
                                  ? 'bg-emerald-600 text-emerald-100'
                                  : item.diffStatus === 'CHANGED'
                                  ? 'bg-amber-600 text-amber-100'
                                  : item.diffStatus === 'REMOVED'
                                  ? 'bg-rose-600 text-rose-100'
                                  : 'bg-slate-800/90 text-slate-300'
                              }`}
                            >
                              {item.diffStatus}
                            </span>
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-cyan-400">
                          <Maximize2 className="w-5 h-5" />
                          <span className="text-[11px] font-mono font-bold">Zoom</span>
                        </div>
                      </div>

                      {/* Info Body */}
                      <div className="p-2.5 flex flex-col gap-1">
                        <h4
                          className="text-xs font-mono font-semibold text-slate-200 truncate group-hover:text-cyan-300 transition"
                          title={item.fileName}
                        >
                          {item.fileName}
                        </h4>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span className="text-cyan-400 truncate max-w-[90px]">{item.pilotName}</span>
                          <span className="capitalize text-slate-500">{item.category}</span>
                        </div>

                        <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono border-t border-slate-800 pt-1 mt-0.5">
                          <span>
                            {item.width && item.height ? `${item.width}×${item.height}` : 'WebP'}
                          </span>
                          <span>{item.sizeKB ? `${item.sizeKB} KB` : ''}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/70 text-xs font-mono text-slate-400">
            <div>
              Trang <span className="text-cyan-400 font-bold">{currentPage}</span> / {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Trang trước"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Trước</span>
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                aria-label="Trang tiếp theo"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition"
              >
                <span>Tiếp</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Artwork Viewer */}
      <FullscreenArtworkViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        items={sortedItems}
        initialIndex={viewerIndex}
        releaseTag={targetTag}
      />
    </>
  );
}
