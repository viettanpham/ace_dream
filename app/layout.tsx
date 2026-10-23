import type { Metadata } from 'next'
import './globals.css'
import { AssetConfigProvider } from '@/components/game/assets/asset-config-provider'
import { getStaticServerAssetConfig } from '@/lib/game/assets/runtime-asset-config'

export const metadata: Metadata = {
  title: 'STARFRONT',
  description:
    'Original browser-based 2D sci-fi turn-based RPG inspired by the gameplay atmosphere of ACE Online.',
  openGraph: {
    title: 'STARFRONT',
    description:
      'Original browser-based 2D sci-fi turn-based RPG inspired by the gameplay atmosphere of ACE Online.',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const initialAssetConfig = getStaticServerAssetConfig();

  return (
    <html lang="vi" className="bg-background">
      <body className="antialiased font-sans">
        <AssetConfigProvider initialConfig={initialAssetConfig}>
          {children}
        </AssetConfigProvider>
      </body>
    </html>
  )
}

