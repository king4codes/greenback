'use client';

import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram } from '@solana/web3.js';

export function useWalletAuthenticator() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticate = async () => {
    if (!publicKey || !signTransaction) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setIsAuthenticating(true);
      setError(null);

      // Create a dummy transaction that will never be submitted
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey,
          lamports: 0,
        })
      );

      // Get the latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Request signature from user
      await signTransaction(transaction);
      
      setIsAuthenticated(true);
      return true;
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(error.message || 'Failed to authenticate');
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Request authentication when wallet connects
  useEffect(() => {
    if (connected && !isAuthenticated && !isAuthenticating) {
      authenticate();
    }
  }, [connected]);

  // Reset authentication when wallet disconnects
  useEffect(() => {
    if (!connected) {
      setIsAuthenticated(false);
      setError(null);
    }
  }, [connected]);

  return {
    isAuthenticated,
    isAuthenticating,
    error,
    authenticate
  };
}

export default function WalletAuthenticator() {
  const { isAuthenticated, isAuthenticating, error } = useWalletAuthenticator();
  const { connected } = useWallet();

  if (!connected) return null;

  return (
    <div className="fixed bottom-4 right-4">
      {error && (
        <div className="bg-red-900/50 border border-red-800 p-2 rounded text-sm text-red-300">
          {error}
          <button 
            onClick={() => window.location.reload()} 
            className="block mt-1 text-xs text-red-400 hover:text-red-300 underline"
          >
            Retry
          </button>
        </div>
      )}
      {isAuthenticating && (
        <div className="bg-zinc-800 p-2 rounded text-sm">
          Please sign the transaction to authenticate...
        </div>
      )}
    </div>
  );
} 