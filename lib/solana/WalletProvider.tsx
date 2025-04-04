'use client';

import React, { FC, ReactNode, useMemo, useEffect, useState } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

// Helius RPC configuration
const HELIUS_RPC = "https://mainnet.helius-rpc.com/?api-key=d56d6c95-3613-4d8a-98dd-0981bd941671";

// Fallback RPC endpoints
const FALLBACK_ENDPOINTS = [
  clusterApiUrl('mainnet-beta'),
  "https://api.mainnet-beta.solana.com",
];

interface SolanaWalletProviderProps {
  children: ReactNode;
}

export const SolanaWalletProvider: FC<SolanaWalletProviderProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  // Set to 'mainnet-beta' for production
  const network = WalletAdapterNetwork.Mainnet;

  // You can provide a custom RPC endpoint here
  const endpoint = useMemo(() => {
    // Use custom RPC URL if available
    const customRpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    
    // Prioritize Helius RPC
    return customRpc || HELIUS_RPC;
  }, []);

  // Initialize all supported wallet adapters
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new TorusWalletAdapter(),
    new LedgerWalletAdapter()
  ], []);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          {mounted && children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}; 