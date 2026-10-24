'use client';

import React from 'react';
import { Download, FileArchive, CheckCircle2, Terminal, ArrowRight, ShieldCheck } from 'lucide-react';

export default function DownloadR3Page() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3 text-cyan-400 font-mono text-sm mb-2">
            <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/80">
              CHECKPOINT 2.1
            </span>
            <span>STARFRONT WORLD V2 — R3 CDN EXPORT PACKAGES</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Tải Gói Tích Hợp CDN R3 (Standalone ZIPs)
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Dành cho Chủ dự án tích hợp sang GitHub repository{' '}
            <code className="text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded">
              viettanpham/starfront-assets
            </code>{' '}
            trên nhánh <code className="text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded">version2-r1</code>.
          </p>
        </div>

        {/* 2 Primary ZIP Download Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Package 1: Asset Data */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                  <FileArchive className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">
                  42 Tệp · 52 KB
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Gói Dữ Liệu CDN R3</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">starfront-r3-asset-data.zip</p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Chứa toàn bộ cây phân cấp <code className="text-cyan-300">starfront-world-assets/</code>:
                Discovery Index, 12 Pilot metadata (<code className="text-slate-200">files.json</code>,{' '}
                <code className="text-slate-200">gallery.json</code>,{' '}
                <code className="text-slate-200">&lt;pilotId&gt;.json</code>), và Story Valentine Chương 01.
              </p>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-400 break-all space-y-1">
                <div className="text-slate-500 font-semibold">SHA-256 Checksum:</div>
                <div className="text-cyan-400/90 text-[11px]">
                  c6c119e8fa800e838e5e9fb72b0b9a3c71d303c7a8f5b4e8240683ced6db8642
                </div>
              </div>
            </div>

            <div className="pt-6">
              <a
                href="/api/download-r3-package?type=data"
                download="starfront-r3-asset-data.zip"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-colors shadow-lg shadow-cyan-950/50"
              >
                <Download className="w-4 h-4" />
                Tải Gói Dữ Liệu R3 (ZIP)
              </a>
            </div>
          </div>

          {/* Package 2: CI Tools */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-amber-950 border border-amber-800/60 flex items-center justify-center text-amber-400">
                  <Terminal className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">
                  3 Tệp · 6.6 KB
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Gói Công Cụ CI/CD</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">starfront-r3-ci-tools.zip</p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Chứa script nâng cấp <code className="text-amber-300">generate-asset-index.mjs</code>,
                template workflow <code className="text-amber-300">workflows/main.yml</code>, và hướng dẫn tích hợp chi tiết.
              </p>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-400 break-all space-y-1">
                <div className="text-slate-500 font-semibold">SHA-256 Checksum:</div>
                <div className="text-amber-400/90 text-[11px]">
                  32c9e96ee835c86bce234a238d6216ec90b77eab5f60ef112c455e6d1040355c
                </div>
              </div>
            </div>

            <div className="pt-6">
              <a
                href="/api/download-r3-package?type=tools"
                download="starfront-r3-ci-tools.zip"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors shadow-lg shadow-amber-950/50"
              >
                <Download className="w-4 h-4" />
                Tải Gói Công Cụ CI/CD (ZIP)
              </a>
            </div>
          </div>
        </div>

        {/* Security & Integrity Note */}
        <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-800/50 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-200/90 space-y-1">
            <div className="font-semibold text-emerald-300">Xác Thực An Toàn Tuyệt Đối (Gatekeeper Verified):</div>
            <div>
              Gói dữ liệu đã được kiểm duyệt: <strong>Chỉ chứa duy nhất Chương 01 của Valentine</strong> (12 blocks văn xuôi, 3 scene anchors).
              Tuyệt đối không có các file Chương 02–10 hay bất kỳ tài liệu nháp bí mật nào bên trong gói nén.
            </div>
          </div>
        </div>

        {/* Quick Integration Instructions */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            Hướng dẫn tích hợp nhanh trên nhánh version2-r1
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
            <li>Tải 2 file ZIP ở trên về máy tính của bạn.</li>
            <li>
              Mở terminal tại thư mục repo <code className="text-cyan-300">starfront-assets</code> và chuyển sang nhánh{' '}
              <code className="text-amber-300">version2-r1</code>.
            </li>
            <li>
              Giải nén <code className="text-cyan-300">starfront-r3-asset-data.zip</code> đè vào thư mục{' '}
              <code className="text-cyan-300">starfront-world-assets/</code>.
            </li>
            <li>
              Giải nén <code className="text-amber-300">starfront-r3-ci-tools.zip</code> để lấy script{' '}
              <code className="text-amber-300">generate-asset-index.mjs</code> đặt vào thư mục <code className="text-amber-300">scripts/</code>.
            </li>
            <li>
              Chạy kiểm tra cục bộ: <code className="text-emerald-400 bg-slate-950 px-2 py-0.5 rounded">node scripts/generate-asset-index.mjs --validate-only</code>
            </li>
            <li>Commit dữ liệu và sẵn sàng tạo Release Tag <code className="text-cyan-300 font-bold">v3.0-assets-r3</code>.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
