'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import WalletConnect from './WalletConnect';

export default function ConnectWalletForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { connectWallet } = useAuth();
  const { publicKey } = useWallet();

  const handleConnect = async () => {
    if (!publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await connectWallet(publicKey.toString());
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 w-full max-w-sm">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">Connect Your Wallet</h3>
        <p className="text-sm text-zinc-400">
          Connect your Solana wallet to start earning rewards
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <WalletConnect />

        {publicKey && (
          <Button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full bg-green-800 hover:bg-green-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting Wallet...
              </>
            ) : (
              'Link Wallet to Account'
            )}
          </Button>
        )}
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-900/30 rounded p-2">
          {error}
        </div>
      )}
    </div>
  );
} 