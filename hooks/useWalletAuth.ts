'use client';

import { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export const useWalletAuth = () => {
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const { 
    publicKey,
    signTransaction,
    connected,
    connecting,
    disconnect,
    select,
    wallet,
    wallets,
  } = useWallet();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Function to create and sign a transaction
  const signAuthTransaction = async (): Promise<boolean> => {
    if (!publicKey || !signTransaction) {
      setAuthError('Wallet not connected');
      return false;
    }

    try {
      setIsAuthenticating(true);
      setAuthError(null);

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
      setAuthError(error.message || 'Failed to authenticate');
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle wallet connection and authentication
  const connect = useCallback(async () => {
    try {
      setAuthError(null);

      // Check if Phantom is installed
      const phantom = wallets.find(w => w.adapter.name === 'Phantom');
      if (!phantom) {
        window.open('https://phantom.app/', '_blank');
        setAuthError('Please install Phantom wallet');
        return;
      }

      // If not connected and not connecting, show the wallet modal
      if (!connected && !connecting) {
        setVisible(true);
        return;
      }

      // If connected but not authenticated, request signature
      if (connected && !isAuthenticated) {
        await signAuthTransaction();
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      setAuthError(error.message || 'Failed to connect wallet');
      setIsAuthenticated(false);
    }
  }, [wallets, connected, connecting, isAuthenticated, setVisible]);

  // Handle disconnection
  const handleDisconnect = async () => {
    try {
      await disconnect();
      setIsAuthenticated(false);
      setAuthError(null);
    } catch (error: any) {
      console.error('Disconnect error:', error);
      setAuthError(error.message || 'Failed to disconnect wallet');
    }
  };

  // Reset authentication when wallet is disconnected
  useEffect(() => {
    if (!connected) {
      setIsAuthenticated(false);
    }
  }, [connected]);

  // Attempt to authenticate when connected
  useEffect(() => {
    if (connected && !isAuthenticated && !isAuthenticating) {
      signAuthTransaction();
    }
  }, [connected, isAuthenticated, isAuthenticating]);

  // Debug logging
  useEffect(() => {
    console.log('Wallet state:', {
      connected,
      connecting,
      isAuthenticated,
      isAuthenticating,
      wallet: wallet?.adapter.name,
      error: authError
    });
  }, [connected, connecting, isAuthenticated, isAuthenticating, wallet, authError]);

  return {
    connect,
    disconnect: handleDisconnect,
    isAuthenticated,
    isAuthenticating,
    isConnected: connected,
    isConnecting: connecting,
    publicKey,
    error: authError,
    wallet,
  };
}; 