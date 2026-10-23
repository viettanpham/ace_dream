'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CharacterContentManager } from '@/components/game/v2/admin/character-content-manager';

export default function V2AdminPage() {
  const router = useRouter();

  return (
    <div className="w-screen h-screen bg-[#030611] flex flex-col items-center justify-center">
      <CharacterContentManager
        isOpen={true}
        onClose={() => router.push('/v2/pilots')}
      />
    </div>
  );
}
