'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import Providers from '@/app/providers'
import { SolanaWalletProvider } from '@/lib/solana/WalletProvider'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <SolanaWalletProvider>
            {children}
            <Toaster 
              theme="dark" 
              position="top-right"
              closeButton
              richColors
            />
          </SolanaWalletProvider>
        </Providers>
      </body>
    </html>
  )
}
