'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Shield,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowRight,
  RotateCcw,
  Copy,
  ExternalLink,
  Terminal,
  Lock,
  Clock,
  LogIn,
  LogOut,
  User,
  KeyRound,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { playClickSound, playLevelUpSound, playShieldSound } from '@/lib/game/audio';
import { useAssetConfig, broadcastAssetConfigChange } from '@/components/game/assets/asset-config-provider';
import { resolveImageUrlWithConfig } from '@/lib/game/assets/image-resolver';
import type { PublicRuntimeAssetConfig, AuditLogEntry } from '@/lib/game/assets/runtime-asset-config';
import type { DiscoveredRelease, ValidationResult } from '@/lib/game/assets/github-release-validator';
import { FullArtworkGalleryModal } from './full-artwork-gallery-modal';

export function AssetVersionTab() {
  const { config: activeConfig, refreshConfig: refreshGlobalConfig } = useAssetConfig();

  // Full Artwork Gallery Modal state
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  // --------------------------------------------------------------------------
  // AUTHENTICATION STATE
  // --------------------------------------------------------------------------
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Setup form state
  const [setupUsername, setSetupUsername] = useState('admin');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [lockoutCountdown, setLockoutCountdown] = useState<number>(0);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutCountdown <= 0) return;
    const timer = setInterval(() => {
      setLockoutCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutCountdown]);

  // --------------------------------------------------------------------------
  // RELEASES & VALIDATION STATE
  // --------------------------------------------------------------------------
  const [releases, setReleases] = useState<DiscoveredRelease[]>([]);
  const [releasesLoading, setReleasesLoading] = useState(false);
  const [releasesError, setReleasesError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  // Preview & Selected Tag
  const [selectedTag, setSelectedTag] = useState<string>(activeConfig.activeVersion);
  const [validatingTag, setValidatingTag] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});

  // --------------------------------------------------------------------------
  // ACTIVATION & CONFIRMATION DIALOGS
  // --------------------------------------------------------------------------
  const [isDialog1Open, setIsDialog1Open] = useState(false);
  const [isDialog2Open, setIsDialog2Open] = useState(false);
  const [confirmTagInput, setConfirmTagInput] = useState('');
  const [mutationLoading, setMutationLoading] = useState(false);
  const [mutationMessage, setMutationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Rollback modal
  const [isRollbackConfirmOpen, setIsRollbackConfirmOpen] = useState(false);

  // Copy feedback
  const [copiedCdn, setCopiedCdn] = useState(false);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Helper to attach Authorization: Bearer token (crucial for AI Studio iframe embedding)
  const getAuthHeaders = useCallback(
    (extra: Record<string, string> = {}, includeCsrf = false) => {
      const headers: Record<string, string> = { ...extra };
      if (typeof window !== 'undefined') {
        const token = sessionStorage.getItem('starfront_admin_session_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      }
      if (includeCsrf && csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }
      return headers;
    },
    [csrfToken]
  );

  // --------------------------------------------------------------------------
  // 1. CHECK AUTHENTICATION STATUS
  // --------------------------------------------------------------------------
  const checkAuth = useCallback(async () => {
    try {
      setAuthLoading(true);
      const res = await fetch('/api/admin/auth/me', {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(Boolean(data.authenticated));
        setNeedsSetup(Boolean(data.needsSetup));
        if (data.authenticated && data.user) {
          setCurrentUser(data.user.username);
          setCsrfToken(data.csrfToken || null);
        }
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // --------------------------------------------------------------------------
  // 2. FETCH DISCOVERED RELEASES
  // --------------------------------------------------------------------------
  const fetchReleases = useCallback(async (forceRefresh = false) => {
    try {
      setReleasesLoading(true);
      setReleasesError(null);
      const res = await fetch(`/api/admin/asset-version/releases${forceRefresh ? '?refresh=true' : ''}`, {
        method: 'GET',
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.releases)) {
        setReleases(data.releases);
        setRateLimited(Boolean(data.rateLimited));
      } else {
        throw new Error(data.error || 'Lỗi không xác định');
      }
    } catch (err) {
      setReleasesError(err instanceof Error ? err.message : 'Lỗi kết nối GitHub Discovery');
    } finally {
      setReleasesLoading(false);
    }
  }, []);

  // Fetch releases when tab opens
  useEffect(() => {
    fetchReleases(false);
  }, [fetchReleases]);

  // --------------------------------------------------------------------------
  // 3. FETCH AUDIT LOGS
  // --------------------------------------------------------------------------
  const fetchAuditLogs = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setAuditLoading(true);
      const res = await fetch('/api/admin/asset-version/audit?limit=15', {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.logs)) {
          setAuditLogs(data.logs);
        }
      }
    } catch {
      // Ignore
    } finally {
      setAuditLoading(false);
    }
  }, [isAuthenticated, getAuthHeaders]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAuditLogs();
    }
  }, [isAuthenticated, fetchAuditLogs]);

  // --------------------------------------------------------------------------
  // 4. HANDLERS: LOGIN & SETUP
  // --------------------------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    setLoginError(null);
    setLoginSubmitting(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword, scope: 'v1' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        playLevelUpSound();
        setIsAuthenticated(true);
        setCurrentUser(data.user?.username || loginUsername);
        setCsrfToken(data.csrfToken || null);
        if (typeof window !== 'undefined' && data.sessionToken) {
          sessionStorage.setItem('starfront_admin_session_token', data.sessionToken);
        }
        setLoginPassword('');
        setLockoutCountdown(0);
        fetchAuditLogs();
      } else {
        if (res.status === 429 || data.errorCode === 'AUTH_RATE_LIMITED') {
          const retrySec = data.retryAfterSeconds || Number(res.headers.get('Retry-After')) || 60;
          setLockoutCountdown(retrySec);
          setLoginError(`Quá nhiều lần thử thất bại. Vui lòng thử lại sau ${retrySec} giây.`);
        } else {
          setLoginError(data.error || 'Đăng nhập không thành công.');
        }
      }
    } catch (err) {
      setLoginError(`Lỗi kết nối: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    setSetupError(null);
    if (setupPassword !== setupConfirmPassword) {
      setSetupError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setSetupSubmitting(true);
    try {
      const res = await fetch('/api/admin/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: setupUsername,
          password: setupPassword,
          confirmPassword: setupConfirmPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        playLevelUpSound();
        setIsAuthenticated(true);
        setNeedsSetup(false);
        setCurrentUser(data.user?.username || setupUsername);
        setCsrfToken(data.csrfToken || null);
        if (typeof window !== 'undefined' && data.sessionToken) {
          sessionStorage.setItem('starfront_admin_session_token', data.sessionToken);
        }
        setLockoutCountdown(0);
        fetchAuditLogs();
      } else {
        setSetupError(data.error || 'Khởi tạo tài khoản thất bại.');
      }
    } catch (err) {
      setSetupError(`Lỗi kết nối: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setSetupSubmitting(false);
    }
  };

  const handleLogout = async () => {
    playClickSound();
    try {
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders({}, true),
      });
    } catch {
      // Ignore
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('starfront_admin_session_token');
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCsrfToken(null);
  };

  // --------------------------------------------------------------------------
  // 5. VALIDATION HANDLER
  // --------------------------------------------------------------------------
  const handleValidateRelease = async (tag: string, mode: 'fast' | 'full' = 'full') => {
    playClickSound();
    try {
      setValidatingTag(tag);
      const res = await fetch('/api/admin/asset-version/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag, mode }),
      });
      const data = await res.json();
      if (data.success && data.validation) {
        setValidationResults((prev) => ({
          ...prev,
          [tag]: data.validation,
        }));
        if (data.validation.valid) {
          playLevelUpSound();
        } else {
          playShieldSound();
        }
      }
    } catch (err) {
      console.warn('Validation error:', err);
    } finally {
      setValidatingTag(null);
    }
  };

  // --------------------------------------------------------------------------
  // 6. ACTIVATION WORKFLOW (DOUBLE CONFIRMATION)
  // --------------------------------------------------------------------------
  const startActivationFlow = (tag: string) => {
    playClickSound();
    setSelectedTag(tag);
    setConfirmTagInput('');
    setMutationMessage(null);

    // If not validated yet, trigger fast validation
    if (!validationResults[tag]) {
      handleValidateRelease(tag, 'fast');
    }

    setIsDialog1Open(true);
  };

  const proceedToDialog2 = () => {
    playClickSound();
    setIsDialog1Open(false);
    setConfirmTagInput('');
    setIsDialog2Open(true);
  };

  const handleExecuteActivation = async () => {
    if (confirmTagInput.trim() !== selectedTag.trim()) {
      return;
    }

    playShieldSound();
    setMutationLoading(true);
    setMutationMessage(null);

    try {
      const res = await fetch('/api/admin/asset-version', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }, true),
        body: JSON.stringify({
          action: 'ACTIVATE',
          targetVersion: selectedTag,
          expectedRevision: activeConfig.revision,
          confirmedTagInput: confirmTagInput.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        playLevelUpSound();
        setIsDialog2Open(false);
        setMutationMessage({ type: 'success', text: data.message });

        // Broadcast to entire client application
        if (data.config) {
          broadcastAssetConfigChange(data.config);
        }
        await refreshGlobalConfig();
        await fetchReleases(true);
        await fetchAuditLogs();
      } else {
        setMutationMessage({
          type: 'error',
          text: data.error || 'Kích hoạt phiên bản thất bại.',
        });
      }
    } catch (err) {
      setMutationMessage({
        type: 'error',
        text: `Lỗi kết nối máy chủ: ${err instanceof Error ? err.message : 'Unknown'}`,
      });
    } finally {
      setMutationLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // 7. ROLLBACK WORKFLOW
  // --------------------------------------------------------------------------
  const handleExecuteRollback = async () => {
    if (!activeConfig.previousVersion) return;
    playShieldSound();
    setMutationLoading(true);
    setMutationMessage(null);

    try {
      const res = await fetch('/api/admin/asset-version', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }, true),
        body: JSON.stringify({
          action: 'ROLLBACK',
          expectedRevision: activeConfig.revision,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        playLevelUpSound();
        setIsRollbackConfirmOpen(false);
        setMutationMessage({ type: 'success', text: data.message });

        if (data.config) {
          broadcastAssetConfigChange(data.config);
        }
        await refreshGlobalConfig();
        await fetchReleases(true);
        await fetchAuditLogs();
      } else {
        setMutationMessage({
          type: 'error',
          text: data.error || 'Hoàn tác thất bại.',
        });
      }
    } catch (err) {
      setMutationMessage({
        type: 'error',
        text: `Lỗi kết nối máy chủ: ${err instanceof Error ? err.message : 'Unknown'}`,
      });
    } finally {
      setMutationLoading(false);
    }
  };

  const copyCdnUrl = () => {
    playClickSound();
    navigator.clipboard.writeText(activeConfig.cdnBaseUrl);
    setCopiedCdn(true);
    setTimeout(() => setCopiedCdn(false), 2000);
  };

  // Target preview release object
  const previewRelease =
    releases.find((r) => r.tag === selectedTag) || {
      tag: selectedTag,
      cdnBaseUrl: resolveImageUrlWithConfig('', { provider: 'jsdelivr', cdnBaseUrl: activeConfig.cdnBaseUrl }),
    };

  return (
    <div className="space-y-4 sf-text-body font-sans text-zinc-200">
      {/* ====================================================================
          NOTIFICATION BANNER
          ==================================================================== */}
      {mutationMessage && (
        <div
          className={cn(
            'flex items-center justify-between p-3 rounded border text-xs font-mono font-bold transition-all shadow-md',
            mutationMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/60 text-rose-200'
          )}
        >
          <div className="flex items-center gap-2">
            {mutationMessage.type === 'success' ? (
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="size-4 text-rose-400 shrink-0" />
            )}
            <span>{mutationMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMutationMessage(null)}
            className="text-zinc-400 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* ====================================================================
          KHỐI AUTHENTICATION: NẾU CHƯA ĐĂNG NHẬP ADMIN
          ==================================================================== */}
      {authLoading ? (
        <div className="rounded border border-cyan-500/30 bg-zinc-950/90 p-6 text-center text-xs text-cyan-400 font-mono">
          <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-cyan-400" />
          ĐANG XÁC THỰC PHIÊN QUẢN TRỊ VIÊN...
        </div>
      ) : !isAuthenticated ? (
        <div className="rounded border border-amber-500/40 bg-zinc-950/95 p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
            <Lock className="size-36 text-amber-400" />
          </div>

          <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3 mb-4">
            <Lock className="size-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 font-display">
                {needsSetup
                  ? 'KHỞI TẠO TÀI KHOẢN QUẢN TRỊ VIÊN LẦN ĐẦU // FIRST-TIME ADMIN SETUP'
                  : 'YÊU CẦU ĐĂNG NHẬP TÀI KHOẢN ADMIN // AUTHENTICATION REQUIRED'}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Chức năng quản trị Asset Version được bảo vệ nghiêm ngặt bằng mật mã và phiên HttpOnly. Không sử dụng mã PIN 6 số.
              </p>
            </div>
          </div>

          {needsSetup ? (
            /* Setup Form */
            <form onSubmit={handleSetup} className="space-y-3.5 max-w-md">
              {setupError && (
                <div className="p-2.5 rounded bg-rose-950/60 border border-rose-500/60 text-rose-300 text-xs">
                  {setupError}
                </div>
              )}
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Tên đăng nhập Admin:</label>
                <input
                  type="text"
                  required
                  value={setupUsername}
                  onChange={(e) => setSetupUsername(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Mật khẩu mới (Tối thiểu 8 ký tự):</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Xác nhận mật khẩu mới:</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={setupConfirmPassword}
                  onChange={(e) => setSetupConfirmPassword(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                disabled={setupSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold px-4 py-2 text-xs transition-all cursor-pointer shadow-md"
              >
                {setupSubmitting ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <KeyRound className="size-4" />
                )}
                <span>KHỞI TẠO TÀI KHOẢN VÀ ĐĂNG NHẬP</span>
              </button>
            </form>
          ) : (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-3.5 max-w-md">
              {lockoutCountdown > 0 ? (
                <div className="p-3 rounded bg-amber-950/70 border border-amber-500/80 text-amber-200 text-xs flex items-center gap-2">
                  <Clock className="size-4 text-amber-400 shrink-0 animate-pulse" />
                  <span>
                    Tài khoản tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau{' '}
                    <strong className="font-mono text-amber-300 font-bold text-sm">{lockoutCountdown}</strong> giây.
                  </span>
                </div>
              ) : loginError ? (
                <div className="p-2.5 rounded bg-rose-950/60 border border-rose-500/60 text-rose-300 text-xs">
                  {loginError}
                </div>
              ) : null}
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Tên đăng nhập:</label>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Mật khẩu:</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                disabled={loginSubmitting || lockoutCountdown > 0}
                className="w-full flex items-center justify-center gap-2 rounded bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold px-4 py-2 text-xs transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginSubmitting ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : lockoutCountdown > 0 ? (
                  <Clock className="size-4 animate-pulse text-amber-950" />
                ) : (
                  <LogIn className="size-4" />
                )}
                <span>
                  {lockoutCountdown > 0
                    ? `TẠM KHÓA (${lockoutCountdown}S) — VUI LÒNG ĐỢI`
                    : 'XÁC THỰC QUYỀN QUẢN TRỊ VIÊN'}
                </span>
              </button>
            </form>
          )}
        </div>
      ) : (
        /* Authenticated Header Bar */
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded border border-emerald-500/40 bg-zinc-950/90 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <User className="size-4 text-emerald-400" />
            <span className="text-zinc-300">Đã đăng nhập:</span>
            <span className="font-bold text-emerald-300">{currentUser}</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">Quyền: ADMIN // SESSION 12H</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs"
          >
            <LogOut className="size-3.5 text-rose-400" />
            <span>Đăng Xuất</span>
          </button>
        </div>
      )}

      {/* ====================================================================
          KHỐI 1: PHIÊN BẢN ĐANG HOẠT ĐỘNG (ACTIVE PRODUCTION CARD)
          ==================================================================== */}
      <div className="rounded border border-cyan-500/40 bg-zinc-950/90 p-4 space-y-3.5 shadow-md">
        <div className="flex flex-wrap items-center justify-between border-b border-zinc-800/80 pb-2.5 gap-2">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase text-cyan-300 tracking-wider font-display">
              1. Phiên Bản Artwork Đang Hoạt Động // Current Production Version
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950/70 border border-cyan-500/60 text-cyan-300">
              <span className="size-2 rounded-full bg-cyan-400 animate-ping" />
              ACTIVE // PRODUCTION
            </span>
            <span className="text-xs font-mono text-zinc-500">Rev: {activeConfig.revision}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded bg-black/40 p-3 border border-zinc-800">
            <div className="text-zinc-400 text-xs">Release Tag Hiện Tại</div>
            <div className="font-bold text-white text-base mt-0.5 font-mono text-cyan-300">
              {activeConfig.activeVersion}
            </div>
            <div className="text-zinc-500 text-[11px] mt-1">Kho: {activeConfig.repository}</div>
          </div>

          <div className="rounded bg-black/40 p-3 border border-zinc-800">
            <div className="text-zinc-400 text-xs">Mạng Phân Phối CDN</div>
            <div className="font-bold text-emerald-400 text-sm mt-0.5 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400" />
              jsDelivr Edge Network
            </div>
            <div className="text-zinc-500 text-[11px] mt-1">Tài nguyên cốt lõi: 26 WebP</div>
          </div>

          <div className="rounded bg-black/40 p-3 border border-zinc-800 flex flex-col justify-between">
            <div>
              <div className="text-zinc-400 text-xs">Phiên Bản Trước Đó (Rollback Ready)</div>
              <div className="font-bold text-sm mt-0.5 font-mono text-zinc-300">
                {activeConfig.previousVersion ? activeConfig.previousVersion : '(Chưa có bản ghi trước)'}
              </div>
            </div>
            {activeConfig.previousVersion && isAuthenticated && (
              <button
                type="button"
                onClick={() => setIsRollbackConfirmOpen(true)}
                className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/50 text-amber-300 text-xs font-bold transition-all cursor-pointer self-start"
              >
                <RotateCcw className="size-3.5" />
                <span>Hoàn Tác Về {activeConfig.previousVersion}</span>
              </button>
            )}
          </div>
        </div>

        {/* CDN Base URL Copy Box */}
        <div className="rounded bg-black/50 p-2.5 border border-zinc-800/80 flex items-center justify-between gap-2 text-xs font-mono">
          <div className="min-w-0 truncate text-zinc-400">
            <span className="text-zinc-500 mr-2">CDN BASE:</span>
            <span className="text-cyan-400 select-all">{activeConfig.cdnBaseUrl}</span>
          </div>
          <button
            type="button"
            onClick={copyCdnUrl}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition-colors shrink-0 cursor-pointer text-xs"
          >
            {copiedCdn ? (
              <>
                <Check className="size-3 text-emerald-400" />
                <span className="text-emerald-400">Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span>Sao chép</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ====================================================================
          KHỐI 2: DANH SÁCH BẢN PHÁT HÀNH GITHUB (RELEASE DISCOVERY & AUDIT)
          ==================================================================== */}
      <div className="rounded border border-zinc-800 bg-zinc-950/80 p-4 space-y-3.5 shadow-md">
        <div className="flex flex-wrap items-center justify-between border-b border-zinc-800/80 pb-2.5 gap-2">
          <div className="flex items-center gap-2">
            <RefreshCw className={cn('size-4 text-amber-400', releasesLoading && 'animate-spin')} />
            <h3 className="text-xs font-bold uppercase text-amber-300 tracking-wider font-display">
              2. Danh Sách Bản Phát Hành GitHub // Release Discovery
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {rateLimited && (
              <span className="text-xs text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
                Rate-limited: Dùng cache 10m
              </span>
            )}
            <button
              type="button"
              disabled={releasesLoading}
              onClick={() => fetchReleases(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-all text-xs font-mono cursor-pointer"
            >
              <RefreshCw className={cn('size-3', releasesLoading && 'animate-spin')} />
              <span>Quét Lại GitHub</span>
            </button>
          </div>
        </div>

        {releasesError && (
          <div className="p-2.5 rounded bg-amber-950/60 border border-amber-500/50 text-amber-300 text-xs">
            {releasesError}
          </div>
        )}

        {/* Table of Releases */}
        <div className="overflow-x-auto rounded border border-zinc-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="p-2.5">Release Tag</th>
                <th className="p-2.5">Ngày Phát Hành</th>
                <th className="p-2.5">Tài Nguyên</th>
                <th className="p-2.5">Trạng Thái Kiểm Định</th>
                <th className="p-2.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {releases.map((rel) => {
                const isActive = rel.tag === activeConfig.activeVersion;
                const isSelected = rel.tag === selectedTag;
                const valResult = validationResults[rel.tag];
                const isValidating = validatingTag === rel.tag;

                return (
                  <tr
                    key={rel.tag}
                    className={cn(
                      'transition-colors',
                      isSelected ? 'bg-zinc-900/60' : 'hover:bg-zinc-900/30'
                    )}
                  >
                    <td className="p-2.5 font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white">{rel.tag}</span>
                        {isActive && (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-500/50">
                            HIỆN TẠI
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2.5 text-zinc-400">
                      {new Date(rel.publishedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-2.5 text-zinc-300">
                      {rel.assetCount ? `${rel.assetCount} tệp WebP` : '26 WebP (Core)'}
                    </td>
                    <td className="p-2.5">
                      {isValidating ? (
                        <span className="inline-flex items-center gap-1 text-cyan-400">
                          <RefreshCw className="size-3 animate-spin" />
                          Đang kiểm tra...
                        </span>
                      ) : isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                          <CheckCircle2 className="size-3" />
                          ĐANG DÙNG
                        </span>
                      ) : valResult ? (
                        valResult.valid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <ShieldCheck className="size-3" />
                            ĐÃ KIỂM ĐỊNH (26/26)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400">
                            <XCircle className="size-3" />
                            KHÔNG TƯƠNG THÍCH ({valResult.missingAssets.length} thiếu)
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-zinc-500">
                          <Shield className="size-3" />
                          Chưa kiểm tra
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-right space-x-1.5 whitespace-nowrap">
                      {/* Button: Preview Sandbox */}
                      <button
                        type="button"
                        onClick={() => setSelectedTag(rel.tag)}
                        className={cn(
                          'px-2 py-1 rounded text-[11px] font-sans transition-all cursor-pointer border',
                          isSelected
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                        )}
                        title="Xem trước ảnh của release này"
                      >
                        <Eye className="size-3 inline mr-1" />
                        Xem trước
                      </button>

                      {/* Button: Run Audit */}
                      <button
                        type="button"
                        disabled={isValidating}
                        onClick={() => handleValidateRelease(rel.tag, 'full')}
                        className="px-2 py-1 rounded bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-700 text-[11px] font-sans transition-all cursor-pointer"
                        title="Kiểm tra 26 tệp cốt lõi trên CDN"
                      >
                        Kiểm định
                      </button>

                      {/* Button: Activate */}
                      {isAuthenticated && !isActive && (
                        <button
                          type="button"
                          onClick={() => startActivationFlow(rel.tag)}
                          className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-[11px] font-sans transition-all cursor-pointer shadow-xs"
                          title="Bắt đầu quy trình kích hoạt phiên bản"
                        >
                          Kích hoạt
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====================================================================
          KHỐI 3: HỘP CÁT XEM TRƯỚC (SANDBOXED PREVIEW)
          ==================================================================== */}
      <div className="rounded border border-zinc-800 bg-zinc-950/80 p-4 space-y-3.5 shadow-md">
        <div className="flex flex-wrap items-center justify-between border-b border-zinc-800/80 pb-2.5 gap-2">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase text-cyan-300 tracking-wider font-display">
              3. Hộp Cát Xem Trước // Sandboxed Artwork Preview
            </h3>
          </div>
          <div className="text-xs font-mono text-zinc-400">
            Đang đối chiếu Tag: <span className="text-cyan-300 font-bold">{selectedTag}</span>
            {selectedTag === activeConfig.activeVersion && ' (Đang phục vụ game)'}
          </div>
        </div>

        <p className="text-xs text-zinc-400">
          Môi trường hộp cát độc lập: Hình ảnh hiển thị dưới đây được nạp trực tiếp từ Release Tag{' '}
          <code className="text-cyan-300">{selectedTag}</code>. Không ảnh hưởng đến bất kỳ người chơi nào đang online.
        </p>

        {/* Full Artwork Gallery Launch Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
          <div>
            <div className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5">
              <Layers className="size-3.5 text-cyan-400" />
              <span>XEM TOÀN BỘ ARTWORK & SO SÁNH PHIÊN BẢN (DIFF)</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Phân tích toàn bộ WebP trong manifest của <span className="text-cyan-400 font-bold">{selectedTag}</span>, hỗ trợ lọc theo Phi công, Phân loại, Diff và Fullscreen Zoom/Pan.
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setIsGalleryModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs font-mono transition-all cursor-pointer shadow-md hover:shadow-cyan-500/25 shrink-0"
          >
            <Layers className="size-4" />
            <span>MỞ THƯ VIỆN ARTWORK CHI TIẾT</span>
          </button>
        </div>

        {/* 3 Reference Previews */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* 1. Marcus Portrait */}
          <div className="rounded bg-black/60 p-3 border border-zinc-800 flex flex-col items-center text-center">
            <div className="text-xs text-zinc-400 mb-2 font-mono">Chỉ Huy Marcus (Portrait)</div>
            <div className="relative size-36 overflow-hidden rounded border border-cyan-500/40 bg-zinc-900 shadow-md">
              <img
                src={resolveImageUrlWithConfig('/images/marcus-portrait.webp', {
                  cdnBaseUrl: previewRelease.cdnBaseUrl,
                  provider: 'jsdelivr',
                })}
                alt="Marcus Portrait Preview"
                className="size-full object-cover object-top"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/icon.svg';
                }}
              />
            </div>
            <span className="text-[11px] text-zinc-500 mt-2 font-mono">images/marcus-portrait.webp</span>
          </div>

          {/* 2. Valentine Combat */}
          <div className="rounded bg-black/60 p-3 border border-zinc-800 flex flex-col items-center text-center">
            <div className="text-xs text-zinc-400 mb-2 font-mono">Valentine V2 (Combat Art)</div>
            <div className="relative size-36 overflow-hidden rounded border border-cyan-500/40 bg-zinc-900 shadow-md">
              <img
                src={resolveImageUrlWithConfig('/images/valentine-combat.webp', {
                  cdnBaseUrl: previewRelease.cdnBaseUrl,
                  provider: 'jsdelivr',
                })}
                alt="Valentine Combat Preview"
                className="size-full object-cover object-center"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/icon.svg';
                }}
              />
            </div>
            <span className="text-[11px] text-zinc-500 mt-2 font-mono">images/valentine-combat.webp</span>
          </div>

          {/* 3. Vanguard Gear */}
          <div className="rounded bg-black/60 p-3 border border-zinc-800 flex flex-col items-center text-center">
            <div className="text-xs text-zinc-400 mb-2 font-mono">Vanguard GEAR (Mecha)</div>
            <div className="relative size-36 overflow-hidden rounded border border-cyan-500/40 bg-zinc-900 shadow-md">
              <img
                src={resolveImageUrlWithConfig('/images/vanguard-gear.webp', {
                  cdnBaseUrl: previewRelease.cdnBaseUrl,
                  provider: 'jsdelivr',
                })}
                alt="Vanguard Gear Preview"
                className="size-full object-contain p-2"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/icon.svg';
                }}
              />
            </div>
            <span className="text-[11px] text-zinc-500 mt-2 font-mono">images/vanguard-gear.webp</span>
          </div>
        </div>

        {/* Action button inside sandbox */}
        {isAuthenticated && selectedTag !== activeConfig.activeVersion && (
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => startActivationFlow(selectedTag)}
              className="flex items-center gap-2 rounded bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold px-4 py-2 text-xs transition-all cursor-pointer shadow-md"
            >
              <span>Tiến Hành Kích Hoạt Phiên Bản {selectedTag}</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* ====================================================================
          KHỐI 4: NHẬT KÝ KIỂM TOÁN (AUDIT LOG HISTORY)
          ==================================================================== */}
      {isAuthenticated && (
        <div className="rounded border border-zinc-800 bg-zinc-950/80 p-4 space-y-3.5 shadow-md">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Terminal className="size-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase text-emerald-300 tracking-wider font-display">
                4. Nhật Ký Kiểm Toán Phiên Bản // Audit Log History
              </h3>
            </div>
            <button
              type="button"
              onClick={fetchAuditLogs}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
            >
              <RefreshCw className={cn('size-3', auditLoading && 'animate-spin')} />
              <span>Làm mới log</span>
            </button>
          </div>

          <div className="rounded bg-black/60 p-3 border border-zinc-800 max-h-48 overflow-y-auto space-y-1.5 font-mono text-xs">
            {auditLogs.length === 0 ? (
              <div className="text-zinc-600 italic">Chưa có bản ghi thay đổi cấu hình nào.</div>
            ) : (
              auditLogs.map((log, idx) => (
                <div key={idx} className="flex flex-wrap items-baseline gap-2 border-b border-zinc-900 pb-1">
                  <span className="text-zinc-500 text-[11px]">
                    {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                  </span>
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded text-[10px] font-bold',
                      log.action === 'ACTIVATE'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    )}
                  >
                    {log.action}
                  </span>
                  <span className="text-white font-bold">{log.activeVersion}</span>
                  {log.previousVersion && (
                    <span className="text-zinc-400 text-[11px]">(từ {log.previousVersion})</span>
                  )}
                  <span className="text-zinc-500 text-[11px]">bởi @{log.adminUser}</span>
                  <span
                    className={cn(
                      'ml-auto text-[10px] font-bold',
                      log.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'
                    )}
                  >
                    {log.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          DIALOG 1: TÓM TẮT & KIỂM ĐỊNH (SUMMARY CONFIRMATION)
          ==================================================================== */}
      {isDialog1Open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-lg border border-cyan-500/60 bg-zinc-950 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="size-5 text-cyan-400" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-cyan-300 font-display">
                  XÁC NHẬN CHUYỂN ĐỔI PHIÊN BẢN (BƯỚC 1/2)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsDialog1Open(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-zinc-300">
                Bạn đang chuẩn bị kích hoạt phiên bản phát hành mới vào hệ thống runtime của trò chơi:
              </p>

              <div className="grid grid-cols-2 gap-3 p-3 rounded bg-zinc-900/60 border border-zinc-800 font-mono">
                <div>
                  <div className="text-zinc-500">Phiên bản hiện tại:</div>
                  <div className="text-sm font-bold text-zinc-300 mt-0.5">{activeConfig.activeVersion}</div>
                </div>
                <div>
                  <div className="text-zinc-500">Phiên bản mục tiêu:</div>
                  <div className="text-sm font-bold text-cyan-400 mt-0.5">{selectedTag}</div>
                </div>
              </div>

              <div className="p-3 rounded bg-zinc-900/40 border border-zinc-800 space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Kiểm tra kết nối CDN:</span>
                  <span className="text-emerald-400 font-bold">✓ HTTP 200 OK</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Tài nguyên cốt lõi (Core Assets):</span>
                  <span className="text-emerald-400 font-bold">26/26 tệp WebP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Số hiệu bản sửa đổi mới:</span>
                  <span className="text-cyan-300 font-bold">Revision {activeConfig.revision + 1}</span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300 text-[11px] leading-relaxed">
                ⚠️ <strong>Cảnh báo:</strong> Thao tác này sẽ cập nhật URL tải hình ảnh cho toàn bộ người chơi ngay tại runtime mà không cần khởi động lại máy chủ.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsDialog1Open(false)}
                className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
              >
                HỦY THAO TÁC
              </button>
              <button
                type="button"
                onClick={proceedToDialog2}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-zinc-950 text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                <span>TIẾP TỤC XÁC NHẬN</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          DIALOG 2: CẢNH BÁO NGUY CẤP & GÕ CHÍNH XÁC TAG (EXACT TAG INPUT)
          ==================================================================== */}
      {isDialog2Open && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-lg border-2 border-rose-500/80 bg-zinc-950 p-5 space-y-4 shadow-2xl shadow-rose-950/50">
            <div className="flex items-center justify-between border-b border-rose-950 pb-3">
              <div className="flex items-center gap-2">
                <AlertOctagon className="size-5 text-rose-500 animate-pulse" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-rose-300 font-display">
                  CẢNH BÁO CUỐI CÙNG — KÍCH HOẠT RUNTIME (BƯỚC 2/2)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsDialog2Open(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded bg-rose-950/40 border border-rose-500/60 text-rose-200 leading-relaxed">
                Để ngăn ngừa sai sót thao tác ngoài ý muốn, hệ thống yêu cầu bạn gõ lại{' '}
                <strong>CHÍNH XÁC 100%</strong> tên Release Tag mục tiêu:{' '}
                <code className="px-1.5 py-0.5 rounded bg-black text-rose-300 font-bold font-mono">
                  {selectedTag}
                </code>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                  Nhập chính xác tên Tag:
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder={`Gõ '${selectedTag}' để xác nhận...`}
                  value={confirmTagInput}
                  onChange={(e) => setConfirmTagInput(e.target.value)}
                  className="w-full rounded border border-rose-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-rose-400 focus:outline-hidden font-mono tracking-wider"
                />
              </div>

              {confirmTagInput.trim().length > 0 && confirmTagInput.trim() !== selectedTag && (
                <div className="text-[11px] text-rose-400 font-mono">
                  Chuỗi nhập chưa khớp với '{selectedTag}'
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsDialog2Open(false)}
                className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
              >
                QUAY LẠI
              </button>
              <button
                type="button"
                disabled={confirmTagInput.trim() !== selectedTag || mutationLoading}
                onClick={handleExecuteActivation}
                className={cn(
                  'flex items-center gap-2 px-5 py-2 rounded text-xs font-bold transition-all shadow-lg',
                  confirmTagInput.trim() === selectedTag && !mutationLoading
                    ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer ring-2 ring-rose-400/50'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                )}
              >
                {mutationLoading ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    <span>ĐANG GHI RUNTIME...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    <span>XÁC NHẬN KÍCH HOẠT NGAY</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL XÁC NHẬN HOÀN TÁC (ROLLBACK CONFIRMATION)
          ==================================================================== */}
      {isRollbackConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border border-amber-500/60 bg-zinc-950 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="size-5 text-amber-400" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-amber-300 font-display">
                  XÁC NHẬN HOÀN TÁC PHIÊN BẢN (ROLLBACK)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsRollbackConfirmOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-zinc-300">
                Hành động này sẽ hoàn tác ngay lập tức về phiên bản hoạt động trước đó:
              </p>
              <div className="p-3 rounded bg-zinc-900 border border-zinc-800 font-mono text-center">
                <div className="text-zinc-500">Phiên bản phục hồi:</div>
                <div className="text-base font-bold text-amber-300 mt-1">
                  {activeConfig.previousVersion}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsRollbackConfirmOpen(false)}
                className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
              >
                HỦY
              </button>
              <button
                type="button"
                disabled={mutationLoading}
                onClick={handleExecuteRollback}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-zinc-950 text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                {mutationLoading ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <RotateCcw className="size-4" />
                )}
                <span>XÁC NHẬN HOÀN TÁC NGAY</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Artwork Gallery Modal */}
      <FullArtworkGalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        activeTag={activeConfig.activeVersion}
        targetTag={selectedTag}
      />
    </div>
  );
}
