'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CharacterContentManager } from '@/components/game/v2/admin/character-content-manager';
import { V1AdminWorkspace } from '@/components/game/admin/v1-admin-workspace';

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialVersion = (searchParams.get('version') || searchParams.get('tab') || 'v2').toLowerCase();
  const [activeVersion, setActiveVersion] = useState<'v1' | 'v2'>(
    initialVersion === 'v1' ? 'v1' : 'v2'
  );

  const handleSwitchVersion = (v: 'v1' | 'v2') => {
    setActiveVersion(v);
    const url = new URL(window.location.href);
    url.searchParams.set('version', v);
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <div className="w-screen h-screen bg-[#030611] flex flex-col items-center justify-center overflow-hidden">
      {activeVersion === 'v1' ? (
        <V1AdminWorkspace
          isOpen={true}
          onClose={() => router.push('/v2/pilots')}
          onSwitchVersion={handleSwitchVersion}
        />
      ) : (
        <CharacterContentManager
          isOpen={true}
          onClose={() => router.push('/v2/pilots')}
          activeVersion="v2"
          onSwitchVersion={handleSwitchVersion}
        />
      )}
    </div>
  );
}

export default function V2AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-[#030611] flex items-center justify-center text-cyan-400 font-mono text-xs">
          NẠP ADMINCP CONTROL PANEL...
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
