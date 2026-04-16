import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Soundwave',
  description: 'Feel the Music. Control the Vibe.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased selection:bg-accent-primary/30 selection:text-white`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#18181A',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.08)',
            },
            success: {
              iconTheme: {
                primary: '#1DB954',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
