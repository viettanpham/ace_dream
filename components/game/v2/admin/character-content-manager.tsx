'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Layers,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  Save,
  Eye,
  EyeOff,
  Database,
  History,
  X,
  User,
  Check,
  ChevronRight,
  BookOpen,
  LogOut,
  Key,
  UploadCloud,
} from 'lucide-react';
import {
  CANONICAL_PILOT_IDS,
  CANONICAL_PILOT_NAMES,
  CanonicalPilotId,
  CharacterContentManifest,
  ArtworkRegistration,
  CharacterProfileContentRecord,
  StoryChapterMeta,
  validateCanPublishChapter,
} from '@/lib/game/v2/character-content-types';

export interface CharacterContentManagerProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialPilotId?: CanonicalPilotId;
}

export function CharacterContentManager({
  isOpen = true,
  onClose,
  initialPilotId = 'valentine',
}: CharacterContentManagerProps) {
  // Auth state
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registeredUsernames, setRegisteredUsernames] = useState<string[]>([]);
  const [adminUser, setAdminUser] = useState<{ username: string; role: string } | null>(null);
  const [csrfToken, setCsrfToken] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Change Password Modal State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePassForm, setChangePassForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [changePassFeedback, setChangePassFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [changingPass, setChangingPass] = useState(false);

  // Real WebP Binary Upload Modal State
  const [showBinaryUploadModal, setShowBinaryUploadModal] = useState(false);
  const [selectedBinaryFile, setSelectedBinaryFile] = useState<File | null>(null);
  const [binaryPreviewUrl, setBinaryPreviewUrl] = useState<string | null>(null);
  const [binaryUploadForm, setBinaryUploadForm] = useState({
    label: '',
    category: 'lore',
    roleCategory: 'fullbody',
    aspectRatio: '3:4',
    description: '',
  });
  const [uploadingBinary, setUploadingBinary] = useState(false);

  // Data state
  const [dataLoading, setDataLoading] = useState(false);
  const [manifest, setManifest] = useState<CharacterContentManifest | null>(null);
  const [selectedPilot, setSelectedPilot] = useState<CanonicalPilotId>(initialPilotId);
  const [activeAdminTab, setActiveAdminTab] = useState<'artworks' | 'story' | 'profile' | 'audit'>('story');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Story Editor Modal State
  const [editingChapter, setEditingChapter] = useState<{
    chapterId: string;
    title: string;
    meta: Partial<StoryChapterMeta>;
    content: string;
  } | null>(null);
  const [savingChapter, setSavingChapter] = useState(false);

  // New Artwork Form State (Metadata only)
  const [showAddArtworkModal, setShowAddArtworkModal] = useState(false);
  const [newArtForm, setNewArtForm] = useState<Partial<ArtworkRegistration>>({
    label: '',
    roleCategory: 'fullbody',
    category: 'lore',
    sourceUrl: '',
    localPath: '',
    aspectRatio: '3:4',
    verificationStatus: 'VERIFIED',
    description: '',
  });

  // Profile Edit State
  const [profileForm, setProfileForm] = useState<Partial<CharacterProfileContentRecord>>({});

  // 1. Check Auth Status
  const checkAuth = useCallback(async () => {
    setAuthLoading(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/admin/auth/me');
      const data = await res.json();
      if (data.authenticated && data.csrfToken) {
        setIsAuthenticated(true);
        setCsrfToken(data.csrfToken);
        setAdminUser(data.user || null);
      } else {
        setIsAuthenticated(false);
        setNeedsSetup(Boolean(data.needsSetup));
        setAdminUser(null);
      }
      if (Array.isArray(data.registeredUsernames)) {
        setRegisteredUsernames(data.registeredUsernames);
        if (data.registeredUsernames.length > 0 && !username) {
          setUsername(data.registeredUsernames[0]);
        }
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  }, [username]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 2. Fetch Manifest Data
  const loadManifest = useCallback(async () => {
    if (!isAuthenticated) return;
    setDataLoading(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/admin/character-content');
      const data = await res.json();
      if (res.ok && data.success) {
        setManifest(data.manifest);
        if (data.csrfToken) {
          setCsrfToken(data.csrfToken);
        }
      } else {
        setActionFeedback({
          type: 'error',
          message: data.error || 'Không thể tải dữ liệu quản trị nội dung.',
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Lỗi mạng khi tải dữ liệu.',
      });
    } finally {
      setDataLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadManifest();
    }
  }, [isAuthenticated, loadManifest]);

  // Sync profileForm when pilot changes or manifest loads
  useEffect(() => {
    if (manifest && selectedPilot && manifest.profiles[selectedPilot]) {
      setProfileForm(manifest.profiles[selectedPilot]);
    }
  }, [manifest, selectedPilot]);

  // Handle Login & Setup
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (needsSetup) {
      if (password !== confirmPassword) {
        setLoginError('Mật khẩu xác nhận không khớp. Vui lòng nhập lại.');
        return;
      }
      if (password.length < 8) {
        setLoginError('Mật khẩu phải có độ dài tối thiểu 8 ký tự.');
        return;
      }
    }

    setAuthLoading(true);
    try {
      const endpoint = needsSetup ? '/api/admin/auth/setup' : '/api/admin/auth/login';
      const payload = needsSetup
        ? { username: username.trim(), password, confirmPassword }
        : { username: username.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setAdminUser(data.user || { username: username.trim(), role: 'admin' });
        setCsrfToken(data.csrfToken || '');
        setNeedsSetup(false);
        setPassword('');
        setConfirmPassword('');
        await loadManifest();
      } else {
        setLoginError(data.error || 'Đăng nhập không thành công.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch {
      // Continue client cleanup
    } finally {
      setIsAuthenticated(false);
      setAdminUser(null);
      setCsrfToken('');
      setManifest(null);
      setPassword('');
      setConfirmPassword('');
      checkAuth();
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassFeedback(null);

    if (changePassForm.newPassword !== changePassForm.confirmNewPassword) {
      setChangePassFeedback({
        type: 'error',
        message: 'Mật khẩu mới xác nhận không khớp.',
      });
      return;
    }

    if (changePassForm.newPassword.length < 8) {
      setChangePassFeedback({
        type: 'error',
        message: 'Mật khẩu mới phải có ít nhất 8 ký tự.',
      });
      return;
    }

    setChangingPass(true);
    try {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify(changePassForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setChangePassFeedback({
          type: 'success',
          message: data.message || 'Đã đổi mật khẩu thành công.',
        });
        setChangePassForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
        setTimeout(() => setShowChangePasswordModal(false), 1500);
      } else {
        setChangePassFeedback({
          type: 'error',
          message: data.error || 'Đổi mật khẩu thất bại.',
        });
      }
    } catch (err: any) {
      setChangePassFeedback({
        type: 'error',
        message: err.message || 'Lỗi kết nối máy chủ.',
      });
    } finally {
      setChangingPass(false);
    }
  };

  // Handle File Selection for Binary WebP Upload
  const handleBinaryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedBinaryFile(null);
      setBinaryPreviewUrl(null);
      return;
    }

    setSelectedBinaryFile(file);
    const objectUrl = URL.createObjectURL(file);
    setBinaryPreviewUrl(objectUrl);

    if (!binaryUploadForm.label) {
      const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setBinaryUploadForm((prev) => ({
        ...prev,
        label: `${CANONICAL_PILOT_NAMES[selectedPilot]} — ${rawName}`,
      }));
    }
  };

  // Handle Binary Upload Submission
  const handleBinaryUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBinaryFile) {
      setActionFeedback({ type: 'error', message: 'Vui lòng chọn một tệp hình ảnh.' });
      return;
    }

    setUploadingBinary(true);
    setActionFeedback(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedBinaryFile);
      formData.append('pilotId', selectedPilot);
      formData.append('label', binaryUploadForm.label || 'Tác phẩm mới');
      formData.append('category', binaryUploadForm.category);
      formData.append('roleCategory', binaryUploadForm.roleCategory);
      formData.append('aspectRatio', binaryUploadForm.aspectRatio);
      formData.append('description', binaryUploadForm.description);

      const res = await fetch('/api/admin/artwork/upload', {
        method: 'POST',
        headers: {
          'x-csrf-token': csrfToken,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback({
          type: 'success',
          message: `Tải lên thành công! SHA-256: ${data.checksumSha256?.slice(0, 16)}... (${(
            data.fileSizeBytes / 1024
          ).toFixed(1)} KB)`,
        });
        setShowBinaryUploadModal(false);
        setSelectedBinaryFile(null);
        setBinaryPreviewUrl(null);
        setBinaryUploadForm({
          label: '',
          category: 'lore',
          roleCategory: 'fullbody',
          aspectRatio: '3:4',
          description: '',
        });
        await loadManifest();
      } else {
        setActionFeedback({
          type: 'error',
          message: data.error || 'Tải lên tác phẩm thất bại.',
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Lỗi mạng khi tải lên tệp.',
      });
    } finally {
      setUploadingBinary(false);
    }
  };

  // Helper for Admin Mutation API calls
  const executeAdminAction = async (
    endpoint: string,
    body: Record<string, unknown>
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, data };
      }
      return { success: false, error: data.error || 'Yêu cầu thất bại.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi kết nối mạng.' };
    }
  };

  // Story Publication Toggle
  const handleTogglePublication = async (chapter: StoryChapterMeta) => {
    const targetStatus = chapter.publicationStatus === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';

    // Pre-check gate in UI
    if (targetStatus === 'PUBLISHED') {
      const validation = validateCanPublishChapter(chapter);
      if (!validation.canPublish) {
        setActionFeedback({
          type: 'error',
          message: `CHẶN XUẤT BẢN: ${validation.reason}`,
        });
        return;
      }
    }

    setActionFeedback(null);
    const result = await executeAdminAction('/api/admin/story', {
      action: 'toggle_publication',
      pilotId: selectedPilot,
      chapterId: chapter.chapterId,
      targetStatus,
    });

    if (result.success) {
      setActionFeedback({
        type: 'success',
        message: result.data.message || `Đã chuyển chương sang ${targetStatus}.`,
      });
      await loadManifest();
    } else {
      setActionFeedback({ type: 'error', message: result.error! });
    }
  };

  // Open Story Editor
  const handleOpenChapterEditor = async (chapter: StoryChapterMeta) => {
    try {
      const res = await fetch(`/api/runtime/story/${selectedPilot}/${chapter.chapterId}`);
      const data = await res.json();
      setEditingChapter({
        chapterId: chapter.chapterId,
        title: chapter.title,
        meta: chapter,
        content: data.content || '',
      });
    } catch {
      setEditingChapter({
        chapterId: chapter.chapterId,
        title: chapter.title,
        meta: chapter,
        content: '',
      });
    }
  };

  // Save Story Chapter
  const handleSaveChapter = async () => {
    if (!editingChapter) return;
    setSavingChapter(true);
    const result = await executeAdminAction('/api/admin/story', {
      action: 'save_chapter',
      pilotId: selectedPilot,
      chapterId: editingChapter.chapterId,
      meta: editingChapter.meta,
      content: editingChapter.content,
    });
    setSavingChapter(false);

    if (result.success) {
      setActionFeedback({
        type: 'success',
        message: `Đã lưu chương ${editingChapter.chapterId} thành công.`,
      });
      setEditingChapter(null);
      await loadManifest();
    } else {
      setActionFeedback({ type: 'error', message: result.error! });
    }
  };

  // Rescan Stories
  const handleRescanStories = async () => {
    setActionFeedback(null);
    const result = await executeAdminAction('/api/admin/story', {
      action: 'rescan_stories',
    });
    if (result.success) {
      setActionFeedback({ type: 'success', message: 'Đã quét lại toàn bộ thư mục truyện.' });
      await loadManifest();
    } else {
      setActionFeedback({ type: 'error', message: result.error! });
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async () => {
    setActionFeedback(null);
    const result = await executeAdminAction('/api/admin/character-content', {
      action: 'update_profile',
      pilotId: selectedPilot,
      profileUpdates: profileForm,
    });
    if (result.success) {
      setActionFeedback({
        type: 'success',
        message: `Đã cập nhật hồ sơ phi công ${selectedPilot}.`,
      });
      await loadManifest();
    } else {
      setActionFeedback({ type: 'error', message: result.error! });
    }
  };

  // Register New Artwork
  const handleRegisterArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtForm.label || !newArtForm.sourceUrl) {
      setActionFeedback({ type: 'error', message: 'Vui lòng nhập tên tác phẩm và URL.' });
      return;
    }

    const artId = `art_${selectedPilot}_${Date.now()}`;
    const fullArt: ArtworkRegistration = {
      assetId: artId,
      artworkId: artId,
      pilotId: selectedPilot,
      title: newArtForm.label!,
      label: newArtForm.label!,
      roleCategory: newArtForm.roleCategory || 'action',
      category: newArtForm.category || 'lore',
      path: newArtForm.localPath || newArtForm.sourceUrl!,
      sourceUrl: newArtForm.sourceUrl!,
      localPath: newArtForm.localPath || newArtForm.sourceUrl!,
      aspectRatio: newArtForm.aspectRatio || '3:4',
      status: 'verified',
      verificationStatus: newArtForm.verificationStatus || 'VERIFIED',
      description: newArtForm.description,
      displayPriority: 50,
      registeredAt: new Date().toISOString(),
    };

    const result = await executeAdminAction('/api/admin/character-content', {
      action: 'register_artwork',
      pilotId: selectedPilot,
      artwork: fullArt,
    });

    if (result.success) {
      setActionFeedback({
        type: 'success',
        message: `Đã đăng ký tác phẩm mới cho ${selectedPilot}.`,
      });
      setShowAddArtworkModal(false);
      setNewArtForm({
        label: '',
        roleCategory: 'fullbody',
        category: 'lore',
        sourceUrl: '',
        localPath: '',
        aspectRatio: '3:4',
        verificationStatus: 'VERIFIED',
        description: '',
      });
      await loadManifest();
    } else {
      setActionFeedback({ type: 'error', message: result.error! });
    }
  };

  // Delete Artwork
  const handleDeleteArtwork = async (artworkId: string) => {
    if (!confirm('Bạn có chắc chắn muốn gỡ bỏ tác phẩm này khỏi hồ sơ?')) return;
    const result = await executeAdminAction('/api/admin/character-content', {
      action: 'delete_artwork',
      pilotId: selectedPilot,
      artworkId,
    });
    if (result.success) {
      setActionFeedback({ type: 'success', message: 'Đã gỡ tác phẩm thành công.' });
      await loadManifest();
    } else {
      setActionFeedback({ type: 'error', message: result.error! });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-6xl max-h-[92vh] bg-[#050B14] border border-cyan-800/80 rounded-xl flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-cyan-950/90 bg-[#091222] px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/60 flex items-center justify-center text-cyan-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                  ADMINCP V2 // CHARACTER CONTENT MANAGER
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-mono">
                  12 PILOTS
                </span>
              </div>
              <h2 className="text-xs sm:text-sm font-semibold text-slate-100">
                Quản Trị Hồ Sơ, Tác Phẩm & Biên Niên Ký
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && adminUser && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-800/80 text-[11px] font-mono text-cyan-300">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-bold">{adminUser.username}</span>
                </span>
                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500 flex items-center gap-1"
                  title="Đổi mật khẩu"
                >
                  <Key className="w-3 h-3" />
                  <span>Đổi mật khẩu</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1 rounded bg-rose-950/60 border border-rose-800 text-[11px] font-mono text-rose-300 hover:bg-rose-900 flex items-center gap-1"
                  title="Đăng xuất phiên làm việc"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}

            {manifest && (
              <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                <Database className="w-3 h-3 text-cyan-400" />
                <span>REV #{manifest.manifestRevision}</span>
              </span>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Auth Gate Screen */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-slate-950 border border-cyan-950 rounded-xl p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/60 flex items-center justify-center mx-auto mb-3 text-cyan-400">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-mono uppercase tracking-wider text-slate-100 font-bold">
                  {needsSetup ? 'KHỞI TẠO TÀI KHOẢN QUẢN TRỊ' : 'XÁC THỰC QUẢN TRỊ VIÊN'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {needsSetup
                    ? 'Hệ thống chưa có tài khoản Quản trị. Vui lòng thiết lập tài khoản quản trị viên lần đầu.'
                    : 'Đăng nhập với tài khoản Quản trị viên (admin hoặc admin123) để quản trị nội dung.'}
                </p>
              </div>

              {loginError && (
                <div className="p-3 mb-4 rounded bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                  {loginError}
                </div>
              )}

              {/* Quick Account Selector when already configured */}
              {!needsSetup && registeredUsernames.length > 0 && (
                <div className="mb-4 p-2.5 rounded bg-[#070F1E] border border-cyan-950 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Chọn tài khoản:</span>
                  <div className="flex items-center gap-1.5">
                    {registeredUsernames.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUsername(u)}
                        className={`px-2 py-0.5 rounded border transition-colors ${
                          username === u
                            ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    placeholder="admin hoặc admin123"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    placeholder="••••••••"
                  />
                </div>

                {/* Confirm Password Field — ONLY when setup is required */}
                {needsSetup && (
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-cyan-400 mb-1 flex items-center justify-between">
                      <span>Xác nhận mật khẩu</span>
                      <span className="text-[10px] text-slate-400">Khớp với mật khẩu trên</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-cyan-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {authLoading
                    ? 'Đang xác thực...'
                    : needsSetup
                    ? 'THIẾT LẬP VÀ ĐĂNG NHẬP'
                    : 'ĐĂNG NHẬP ADMINCP'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Main Admin Workspace */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* Left Pilot Selector Rail */}
            <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r border-slate-900 bg-[#040812] flex flex-col shrink-0">
              <div className="p-3 border-b border-slate-900 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>12 PHI CÔNG CANONICAL</span>
                <span className="text-cyan-400">V2.0</span>
              </div>

              {/* Pilot List Buttons */}
              <div className="flex md:flex-col overflow-x-auto md:overflow-y-auto p-2 gap-1 scrollbar-thin">
                {CANONICAL_PILOT_IDS.map((pId) => {
                  const isSelected = selectedPilot === pId;
                  const profile = manifest?.profiles[pId];
                  const artCount = manifest?.artworks[pId]?.length || 0;
                  const chapters = manifest?.stories[pId]?.chapters || [];
                  const publishedCount = chapters.filter(
                    (c) => c.publicationStatus === 'PUBLISHED'
                  ).length;

                  return (
                    <button
                      key={pId}
                      onClick={() => setSelectedPilot(pId)}
                      className={`flex items-center justify-between p-2.5 rounded text-left transition-all shrink-0 md:w-full border ${
                        isSelected
                          ? 'bg-cyan-950/70 border-cyan-500/80 text-cyan-200'
                          : 'bg-slate-950/50 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-mono font-bold uppercase truncate">
                          {profile?.callsign || pId}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {profile?.classCharacterName || pId}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 text-[10px] font-mono">
                        <span
                          title={`${artCount} tác phẩm`}
                          className="px-1 py-0.2 rounded bg-slate-900 text-slate-400"
                        >
                          {artCount}🎨
                        </span>
                        <span
                          title={`${publishedCount} chương đã xuất bản`}
                          className={`px-1 py-0.2 rounded ${
                            publishedCount > 0
                              ? 'bg-emerald-950/80 text-emerald-400 font-bold'
                              : 'bg-slate-900 text-slate-500'
                          }`}
                        >
                          {publishedCount}📖
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Right Work Area */}
            <main className="flex-1 flex flex-col overflow-hidden min-h-0 bg-[#030611]">
              {/* Tab Navigation & Toolbar */}
              <div className="h-12 border-b border-slate-900 px-4 flex items-center justify-between shrink-0 bg-[#050a16]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveAdminTab('story')}
                    className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                      activeAdminTab === 'story'
                        ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Biên Niên Ký (Story)</span>
                  </button>

                  <button
                    onClick={() => setActiveAdminTab('artworks')}
                    className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                      activeAdminTab === 'artworks'
                        ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Tác Phẩm & Artwork</span>
                  </button>

                  <button
                    onClick={() => setActiveAdminTab('profile')}
                    className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                      activeAdminTab === 'profile'
                        ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Hồ Sơ & Lore</span>
                  </button>

                  <button
                    onClick={() => setActiveAdminTab('audit')}
                    className={`hidden sm:flex px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider items-center gap-1.5 transition-colors ${
                      activeAdminTab === 'audit'
                        ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Persistence & Audit</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadManifest}
                    disabled={dataLoading}
                    title="Làm mới dữ liệu"
                    className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${dataLoading ? 'animate-spin text-cyan-400' : ''}`}
                    />
                  </button>
                </div>
              </div>

              {/* Feedback Banner */}
              {actionFeedback && (
                <div
                  className={`px-4 py-2 text-xs font-mono flex items-center justify-between border-b ${
                    actionFeedback.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-800 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {actionFeedback.type === 'success' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    <span>{actionFeedback.message}</span>
                  </div>
                  <button
                    onClick={() => setActionFeedback(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Tab 1: STORY & CHAPTERS */}
              {activeAdminTab === 'story' && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900 pb-3">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-cyan-500 font-bold">
                        LỘ TRÌNH 10 CHƯƠNG BIÊN NIÊN KÝ // {selectedPilot.toUpperCase()}
                      </div>
                      <p className="text-xs text-slate-400">
                        Kiểm soát 3 chiều trạng thái: Biên tập, Nội dung và Xuất bản. Validation gate bảo vệ nghiêm ngặt các chương HOLD/PROVISIONAL.
                      </p>
                    </div>

                    <button
                      onClick={handleRescanStories}
                      className="px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-400 hover:bg-slate-800 flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Quét lại từ đĩa (Rescan)</span>
                    </button>
                  </div>

                  {/* Chapters Table */}
                  <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#060c18] border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Chương</th>
                          <th className="py-2.5 px-3">Tiêu đề & Tóm tắt</th>
                          <th className="py-2.5 px-3">Biên tập</th>
                          <th className="py-2.5 px-3">Nội dung</th>
                          <th className="py-2.5 px-3">Xuất bản</th>
                          <th className="py-2.5 px-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {(manifest?.stories[selectedPilot]?.chapters || []).map((chap) => {
                          const isPublished = chap.publicationStatus === 'PUBLISHED';
                          const canPublishCheck = validateCanPublishChapter(chap);

                          return (
                            <tr key={chap.chapterId} className="hover:bg-slate-900/40">
                              <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                                {chap.chapterNumber < 10
                                  ? `0${chap.chapterNumber}`
                                  : chap.chapterNumber}
                              </td>

                              <td className="py-3 px-3">
                                <div className="font-semibold text-slate-200">{chap.title}</div>
                                <div className="text-[11px] text-slate-500 line-clamp-1 italic">
                                  {chap.summary}
                                </div>
                                <div className="text-[10px] font-mono text-slate-600 mt-0.5">
                                  {chap.sceneAnchors?.length || 0} Scene Anchors ·{' '}
                                  {chap.readingTimeMinutes || 5} min read
                                </div>
                              </td>

                              {/* Editorial Status */}
                              <td className="py-3 px-3">
                                {chap.editorialStatus === 'APPROVED' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                    <CheckCircle2 className="w-3 h-3" /> APPROVED
                                  </span>
                                )}
                                {chap.editorialStatus === 'PROVISIONAL' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
                                    <Clock className="w-3 h-3" /> PROVISIONAL
                                  </span>
                                )}
                                {chap.editorialStatus === 'HOLD' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800">
                                    <Lock className="w-3 h-3" /> HOLD
                                  </span>
                                )}
                              </td>

                              {/* Content Readiness */}
                              <td className="py-3 px-3">
                                <span className="text-[11px] font-mono text-slate-300">
                                  {chap.contentReadiness}
                                </span>
                              </td>

                              {/* Publication Status */}
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    isPublished
                                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500'
                                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                                  }`}
                                >
                                  {isPublished ? (
                                    <>
                                      <Eye className="w-3 h-3 text-cyan-400" /> PUBLISHED
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="w-3 h-3 text-slate-500" /> HIDDEN
                                    </>
                                  )}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => handleOpenChapterEditor(chap)}
                                  className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-700"
                                >
                                  Soạn thảo
                                </button>

                                {isPublished ? (
                                  <button
                                    onClick={() => handleTogglePublication(chap)}
                                    className="px-2 py-1 rounded bg-rose-950/80 border border-rose-800 text-[11px] font-mono text-rose-300 hover:bg-rose-900"
                                  >
                                    ẨN (OFF)
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleTogglePublication(chap)}
                                    disabled={!canPublishCheck.canPublish}
                                    title={
                                      canPublishCheck.canPublish
                                        ? 'Xuất bản chương truyện này'
                                        : canPublishCheck.reason
                                    }
                                    className={`px-2 py-1 rounded border text-[11px] font-mono font-bold ${
                                      canPublishCheck.canPublish
                                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 hover:bg-cyan-400'
                                        : 'bg-slate-900/60 border-slate-800 text-slate-600 cursor-not-allowed'
                                    }`}
                                  >
                                    XUẤT BẢN (ON)
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
              )}

              {/* Tab 2: ARTWORKS & MEDIA */}
              {activeAdminTab === 'artworks' && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-cyan-500 font-bold">
                        BỘ SƯU TẬP HÌNH ẢNH // {selectedPilot.toUpperCase()}
                      </div>
                      <p className="text-xs text-slate-400">
                        Đăng ký, kiểm tra hiển thị và phân loại tác phẩm minh họa của phi công.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedBinaryFile(null);
                          setBinaryPreviewUrl(null);
                          setShowBinaryUploadModal(true);
                        }}
                        className="px-3.5 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-cyan-950/50"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>TẢI LÊN FILE WEBP THẬT</span>
                      </button>

                      <button
                        onClick={() => setShowAddArtworkModal(true)}
                        className="px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs uppercase hover:bg-slate-800 flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Đăng ký theo URL</span>
                      </button>
                    </div>
                  </div>

                  {/* Artwork Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(manifest?.artworks[selectedPilot] || []).map((art) => (
                      <div
                        key={art.artworkId}
                        className="rounded-lg border border-slate-800 bg-slate-950/80 overflow-hidden flex flex-col group"
                      >
                        <div className="relative aspect-[4/3] bg-black/60 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={art.localPath || art.sourceUrl}
                            alt={art.label}
                            className="w-full h-full object-cover object-top transition-transform group-hover:scale-105"
                          />
                          <div className="absolute top-2 left-2 flex items-center gap-1">
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/70 text-cyan-300 border border-white/10 uppercase">
                              {art.roleCategory}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/70 text-slate-300 border border-white/10 uppercase">
                              {art.category}
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteArtwork(art.artworkId)}
                            className="absolute top-2 right-2 p-1.5 rounded bg-rose-950/80 text-rose-300 hover:bg-rose-900 border border-rose-800 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Xóa artwork"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="text-xs font-semibold text-slate-200 truncate">
                              {art.label}
                            </div>
                            <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 italic">
                              {art.description || 'Chưa có mô tả bối cảnh.'}
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-500">
                            <span>{art.aspectRatio || '3:4'}</span>
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> {art.verificationStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: PROFILE & LORE */}
              {activeAdminTab === 'profile' && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-cyan-500 font-bold">
                        HỒ SƠ LORE & THÔNG TIN // {selectedPilot.toUpperCase()}
                      </div>
                      <p className="text-xs text-slate-400">
                        Cập nhật các mô tả và tiểu sử nhân vật. Dữ liệu gameplay 20 Class Points giữ nguyên bất biến theo FND-1.
                      </p>
                    </div>

                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 rounded bg-cyan-500 text-slate-950 font-mono font-bold text-xs uppercase hover:bg-cyan-400 flex items-center gap-1.5 shadow-md"
                    >
                      <Save className="w-4 h-4" />
                      <span>Lưu Hồ Sơ</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                        Tên gọi Canonical / Callsign
                      </label>
                      <input
                        type="text"
                        value={profileForm.callsign || ''}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, callsign: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                        Hành tinh xuất thân
                      </label>
                      <input
                        type="text"
                        value={profileForm.originPlanet || ''}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, originPlanet: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                        Phe phái / Tổ chức (Affiliation)
                      </label>
                      <input
                        type="text"
                        value={profileForm.affiliation || ''}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, affiliation: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                        Tính cách đặc trưng
                      </label>
                      <input
                        type="text"
                        value={profileForm.personality || ''}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, personality: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                        Câu nói tiêu biểu (Quote)
                      </label>
                      <input
                        type="text"
                        value={profileForm.quote || ''}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, quote: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                        Tóm tắt tiểu sử nhân vật (Story Summary)
                      </label>
                      <textarea
                        rows={4}
                        value={profileForm.storySummary || ''}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, storySummary: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: PERSISTENCE & AUDIT */}
              {activeAdminTab === 'audit' && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  <div className="border-b border-slate-900 pb-3">
                    <div className="text-[10px] font-mono uppercase text-cyan-500 font-bold">
                      HẠ TẦNG LƯU TRỮ BỀN VỮNG & NHẬT KÝ KIỂM TOÁN
                    </div>
                    <p className="text-xs text-slate-400">
                      Báo cáo trạng thái storage adapter và lịch sử thay đổi phiên bản.
                    </p>
                  </div>

                  {/* Storage Status Box */}
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-xs font-mono font-bold text-slate-200 flex items-center justify-between">
                      <span>STORAGE STATUS</span>
                      <span className="text-cyan-400">
                        {manifest?.storageStatus?.provider.toUpperCase() || 'LOCAL'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {manifest?.storageStatus?.message || 'Sẵn sàng lưu trữ bền vững.'}
                    </p>
                    <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-900 flex justify-between">
                      <span>Mã trạng thái: {manifest?.storageStatus?.code}</span>
                      <span>
                        Đồng bộ lần cuối:{' '}
                        {manifest?.storageStatus?.lastSyncTimestamp
                          ? new Date(manifest.storageStatus.lastSyncTimestamp).toLocaleString()
                          : 'Vừa xong'}
                      </span>
                    </div>
                  </div>

                  {/* Audit Log Table */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      20 HÀNH ĐỘNG GẦN NHẤT
                    </div>
                    <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#060c18] border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400">
                          <tr>
                            <th className="py-2 px-3">Thời gian</th>
                            <th className="py-2 px-3">Người thực hiện</th>
                            <th className="py-2 px-3">Hành động</th>
                            <th className="py-2 px-3">Chi tiết</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 font-mono text-[11px]">
                          {(manifest?.auditTrail || []).slice(0, 20).map((log, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/30">
                              <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </td>
                              <td className="py-2 px-3 text-cyan-400">{log.operator}</td>
                              <td className="py-2 px-3 text-slate-300">{log.action}</td>
                              <td className="py-2 px-3 text-slate-400 truncate max-w-xs">
                                {log.details}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      {/* Story Chapter Prose Editor Modal */}
      {editingChapter && (
        <div className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-3 sm:p-6">
          <div className="w-full max-w-4xl max-h-[90vh] bg-[#070D18] border border-cyan-700 rounded-xl flex flex-col shadow-2xl overflow-hidden">
            <header className="h-14 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 bg-[#0A1324]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs sm:text-sm font-mono font-bold text-slate-100 uppercase">
                  SOẠN THẢO VĂN XUÔI // {selectedPilot.toUpperCase()} // CHƯƠNG {editingChapter.chapterId}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveChapter}
                  disabled={savingChapter}
                  className="px-3 py-1.5 rounded bg-cyan-500 text-slate-950 font-mono font-bold text-xs uppercase hover:bg-cyan-400 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingChapter ? 'Đang lưu...' : 'Lưu Chương'}</span>
                </button>
                <button
                  onClick={() => setEditingChapter(null)}
                  className="p-1.5 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Tiêu đề chương
                </label>
                <input
                  type="text"
                  value={editingChapter.meta.title || ''}
                  onChange={(e) =>
                    setEditingChapter({
                      ...editingChapter,
                      meta: { ...editingChapter.meta, title: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Tóm tắt bối cảnh
                </label>
                <input
                  type="text"
                  value={editingChapter.meta.summary || ''}
                  onChange={(e) =>
                    setEditingChapter({
                      ...editingChapter,
                      meta: { ...editingChapter.meta, summary: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-mono uppercase text-slate-400">
                    Nội dung văn xuôi (Markdown) — Sử dụng thẻ Scene Anchor: &lt;!-- story-anchor: anchor_id --&gt;
                  </label>
                  <span className="text-[10px] font-mono text-cyan-400">
                    {editingChapter.content.split(/\s+/).filter(Boolean).length} TỪ
                  </span>
                </div>
                <textarea
                  rows={14}
                  value={editingChapter.content}
                  onChange={(e) =>
                    setEditingChapter({ ...editingChapter, content: e.target.value })
                  }
                  className="w-full flex-1 p-3 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed focus:outline-none focus:border-cyan-500"
                  placeholder="Nhập nội dung markdown tại đây..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Artwork Modal */}
      {showAddArtworkModal && (
        <div className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-3 sm:p-6">
          <div className="w-full max-w-lg bg-[#070D18] border border-cyan-700 rounded-xl flex flex-col shadow-2xl overflow-hidden">
            <header className="h-12 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 bg-[#0A1324]">
              <h3 className="text-xs font-mono font-bold text-slate-100 uppercase">
                ĐĂNG KÝ ARTWORK MỚI // {selectedPilot.toUpperCase()}
              </h3>
              <button
                onClick={() => setShowAddArtworkModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <form onSubmit={handleRegisterArtwork} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Tên tác phẩm (Label) *
                </label>
                <input
                  type="text"
                  required
                  value={newArtForm.label}
                  onChange={(e) => setNewArtForm({ ...newArtForm, label: e.target.value })}
                  placeholder="Ví dụ: Alviss — Tác Chiến Vành Đai Asteroid"
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  URL Nguồn (Source URL) *
                </label>
                <input
                  type="text"
                  required
                  value={newArtForm.sourceUrl}
                  onChange={(e) =>
                    setNewArtForm({
                      ...newArtForm,
                      sourceUrl: e.target.value,
                      localPath: newArtForm.localPath || e.target.value,
                    })
                  }
                  placeholder="https://... hoặc /assets/artworks/..."
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Vai trò (Role)
                  </label>
                  <select
                    value={newArtForm.roleCategory}
                    onChange={(e) =>
                      setNewArtForm({ ...newArtForm, roleCategory: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="fullbody">fullbody (Toàn thân)</option>
                    <option value="portrait">portrait (Chân dung)</option>
                    <option value="action">action (Chiến trường)</option>
                    <option value="chibi">chibi (Chibi)</option>
                    <option value="chibi_variant">chibi_variant (Biến thể chibi)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Phân loại (Category)
                  </label>
                  <select
                    value={newArtForm.category}
                    onChange={(e) =>
                      setNewArtForm({ ...newArtForm, category: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="lore">lore (Hồ sơ cốt truyện)</option>
                    <option value="base">base (Trang phục cơ bản)</option>
                    <option value="awakened">awakened (Thức tỉnh)</option>
                    <option value="combat">combat (Chiến đấu)</option>
                    <option value="chibi">chibi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Mô tả / Chú thích ngữ cảnh
                </label>
                <textarea
                  rows={2}
                  value={newArtForm.description}
                  onChange={(e) => setNewArtForm({ ...newArtForm, description: e.target.value })}
                  placeholder="Ghi chú ngữ cảnh sử dụng hình ảnh..."
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddArtworkModal(false)}
                  className="px-3 py-2 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 hover:text-white"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-cyan-500 text-slate-950 font-mono font-bold text-xs uppercase hover:bg-cyan-400"
                >
                  XÁC NHẬN ĐĂNG KÝ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real Binary WebP Upload Modal */}
      {showBinaryUploadModal && (
        <div className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#070D18] border border-cyan-500/80 rounded-xl flex flex-col shadow-2xl overflow-hidden my-auto">
            <header className="h-12 border-b border-cyan-950 px-4 flex items-center justify-between shrink-0 bg-[#0A1324]">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold text-slate-100 uppercase">
                  TẢI LÊN FILE HÌNH ẢNH THẬT (BINARY UPLOAD) // {selectedPilot.toUpperCase()}
                </h3>
              </div>
              <button
                onClick={() => setShowBinaryUploadModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <form onSubmit={handleBinaryUploadSubmit} className="p-4 sm:p-6 space-y-4">
              {/* File Input & Preview Area */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-cyan-400 mb-1.5 font-bold">
                  Chọn tệp hình ảnh từ máy tính (WebP, PNG, JPEG) *
                </label>
                <div className="border-2 border-dashed border-cyan-800/80 hover:border-cyan-500 rounded-lg p-4 bg-slate-950/60 text-center transition-colors">
                  <input
                    type="file"
                    accept="image/webp,image/png,image/jpeg"
                    required
                    onChange={handleBinaryFileSelect}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-mono file:font-bold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-2 font-mono">
                    Khuyến nghị WebP chuẩn Starfront V2. Tệp sẽ được lưu trực tiếp vào public/assets/artworks/{selectedPilot}/ và tính mã băm SHA-256.
                  </p>
                </div>
              </div>

              {/* Image Preview Box */}
              {binaryPreviewUrl && (
                <div className="p-3 rounded-lg bg-black/60 border border-slate-800 flex items-center gap-4">
                  <div className="w-20 h-24 bg-slate-900 rounded overflow-hidden shrink-0 border border-cyan-500/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={binaryPreviewUrl}
                      alt="Xem trước"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="text-xs space-y-1 overflow-hidden">
                    <div className="font-mono text-cyan-300 truncate font-semibold">
                      {selectedBinaryFile?.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Kích thước: {selectedBinaryFile ? (selectedBinaryFile.size / 1024).toFixed(1) : 0} KB · Định dạng: {selectedBinaryFile?.type}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Sẵn sàng băm SHA-256 & lưu trữ
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Tên tác phẩm (Label) *
                </label>
                <input
                  type="text"
                  required
                  value={binaryUploadForm.label}
                  onChange={(e) =>
                    setBinaryUploadForm({ ...binaryUploadForm, label: e.target.value })
                  }
                  placeholder={`Ví dụ: ${CANONICAL_PILOT_NAMES[selectedPilot]} — Tác Chiến Vành Đai Asteroid`}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Vai trò (Role)
                  </label>
                  <select
                    value={binaryUploadForm.roleCategory}
                    onChange={(e) =>
                      setBinaryUploadForm({ ...binaryUploadForm, roleCategory: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="fullbody">fullbody (Toàn thân)</option>
                    <option value="portrait">portrait (Chân dung)</option>
                    <option value="action">action (Chiến trường)</option>
                    <option value="concept">concept (Phác thảo)</option>
                    <option value="chibi">chibi (Chibi)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Phân loại
                  </label>
                  <select
                    value={binaryUploadForm.category}
                    onChange={(e) =>
                      setBinaryUploadForm({ ...binaryUploadForm, category: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="lore">lore (Cốt truyện)</option>
                    <option value="base">base (Cơ bản)</option>
                    <option value="awakened">awakened (Thức tỉnh)</option>
                    <option value="combat">combat (Chiến đấu)</option>
                    <option value="chibi">chibi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Tỷ lệ ảnh
                  </label>
                  <select
                    value={binaryUploadForm.aspectRatio}
                    onChange={(e) =>
                      setBinaryUploadForm({ ...binaryUploadForm, aspectRatio: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="3:4">3:4 (Chuẩn dọc)</option>
                    <option value="1:1">1:1 (Vuông)</option>
                    <option value="16:9">16:9 (Ngang)</option>
                    <option value="9:16">9:16 (Story)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Mô tả / Chú thích
                </label>
                <textarea
                  rows={2}
                  value={binaryUploadForm.description}
                  onChange={(e) =>
                    setBinaryUploadForm({ ...binaryUploadForm, description: e.target.value })
                  }
                  placeholder="Ghi chú ngữ cảnh của tác phẩm..."
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setShowBinaryUploadModal(false)}
                  className="px-3.5 py-2 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 hover:text-white"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  disabled={uploadingBinary || !selectedBinaryFile}
                  className="px-5 py-2 rounded bg-cyan-500 text-slate-950 font-mono font-bold text-xs uppercase hover:bg-cyan-400 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {uploadingBinary ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>ĐANG TẢI LÊN & XỬ LÝ...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>XÁC NHẬN TẢI LÊN</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-3 sm:p-6">
          <div className="w-full max-w-md bg-[#070D18] border border-cyan-800 rounded-xl flex flex-col shadow-2xl overflow-hidden">
            <header className="h-12 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 bg-[#0A1324]">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold text-slate-100 uppercase">
                  ĐỔI MẬT KHẨU QUẢN TRỊ VIÊN ({adminUser?.username})
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setChangePassFeedback(null);
                }}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <form onSubmit={handleChangePassword} className="p-4 sm:p-6 space-y-3.5">
              {changePassFeedback && (
                <div
                  className={`p-3 rounded text-xs font-mono border ${
                    changePassFeedback.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-800 text-rose-300'
                  }`}
                >
                  {changePassFeedback.message}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Mật khẩu hiện tại *
                </label>
                <input
                  type="password"
                  required
                  value={changePassForm.oldPassword}
                  onChange={(e) =>
                    setChangePassForm({ ...changePassForm, oldPassword: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Mật khẩu mới (Tối thiểu 8 ký tự) *
                </label>
                <input
                  type="password"
                  required
                  value={changePassForm.newPassword}
                  onChange={(e) =>
                    setChangePassForm({ ...changePassForm, newPassword: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Xác nhận mật khẩu mới *
                </label>
                <input
                  type="password"
                  required
                  value={changePassForm.confirmNewPassword}
                  onChange={(e) =>
                    setChangePassForm({ ...changePassForm, confirmNewPassword: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setChangePassFeedback(null);
                  }}
                  className="px-3 py-2 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 hover:text-white"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  disabled={changingPass}
                  className="px-4 py-2 rounded bg-cyan-500 text-slate-950 font-mono font-bold text-xs uppercase hover:bg-cyan-400 disabled:opacity-50"
                >
                  {changingPass ? 'ĐANG CẬP NHẬT...' : 'CẬP NHẬT MẬT KHẨU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
