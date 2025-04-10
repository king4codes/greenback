import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import { SolanaWalletProvider } from '@/lib/solana/WalletProvider';
import ClientLayout from '@/components/ClientLayout';
import Script from 'next/script';
import { inter } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'Inside Baron',
  description: 'Inside Baron - Your Web3 Gaming Journey',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script src="/env.js" strategy="beforeInteractive" />
      </head>
      <body className={inter.className}>
        <Providers>
          <SolanaWalletProvider>
            <ClientLayout>{children}</ClientLayout>
          </SolanaWalletProvider>
        </Providers>
      </body>
    </html>
  );
}
