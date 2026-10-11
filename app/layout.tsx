import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'STARFRONT',
  description:
    'Original browser-based 2D sci-fi turn-based RPG inspired by the gameplay atmosphere of ACE Online.',
  openGraph: {
    title: 'STARFRONT',
    description:
      'Original browser-based 2D sci-fi turn-based RPG inspired by the gameplay atmosphere of ACE Online.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className="bg-background">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  )
}

