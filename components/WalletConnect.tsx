'use client'

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface WalletConnectProps {
  className?: string;
}

export default function WalletConnect({ className }: WalletConnectProps) {
  const { publicKey, connected, connecting } = useWallet();

  // Debug logging for component state
  useEffect(() => {
    console.log('WalletConnect state:', {
      connected,
      connecting,
      publicKey: publicKey?.toBase58(),
    });
  }, [connected, connecting, publicKey]);

  return (
    <div className={cn("relative", className)}>
      <WalletMultiButton className={cn(
        "!bg-zinc-800 hover:!bg-zinc-700",
        "!h-10 !px-4 !py-2",
        "!rounded !text-sm !font-mono",
        connected && "!bg-green-800 hover:!bg-green-700",
        connecting && "!opacity-70 !cursor-not-allowed"
      )} />
    </div>
  );
} 