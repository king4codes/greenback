'use client';

import { ReactNode } from 'react';
import { SolanaWalletProvider } from '@/lib/solana/WalletProvider';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SolanaWalletProvider>
      {children}
    </SolanaWalletProvider>
  );
} 