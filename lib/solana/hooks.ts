'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';

// Helius free RPC endpoint with generous limits
const HELIUS_RPC = "https://mainnet.helius-rpc.com/?api-key=15319960-7a48-4bb0-ae41-50ba497fbd8a";

// Array of public RPC endpoints to try in sequence
const PUBLIC_RPC_ENDPOINTS = [
  HELIUS_RPC,
  clusterApiUrl('mainnet-beta'),
  "https://api.mainnet-beta.solana.com"
];

// Create multiple fallback connections to try in sequence
const fallbackConnections = PUBLIC_RPC_ENDPOINTS.map(endpoint => 
  new Connection(endpoint, 'confirmed')
);

// Create one reliable connection for direct use
export const defaultConnection = new Connection(HELIUS_RPC, 'confirmed');

// Helper function to try multiple connections until one succeeds
async function tryMultipleConnections<T>(
  operation: (connection: Connection) => Promise<T>,
  connections: Connection[]
): Promise<T> {
  // Try each connection in sequence
  for (let i = 0; i < connections.length; i++) {
    try {
      return await operation(connections[i]);
    } catch (err) {
      console.error(`RPC connection ${i} failed:`, err);
      // If this is the last connection, throw the error
      if (i === connections.length - 1) {
        throw err;
      }
    }
  }

  // This should never be reached, but TypeScript requires a return
  throw new Error('All connections failed');
}

// Custom hook for wallet balance with reliable fallback
export function useSolanaBalance() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connected) {
      setBalance(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Start with the most reliable connection first (Helius)
      const lamports = await defaultConnection.getBalance(publicKey);
      const solBalance = lamports / LAMPORTS_PER_SOL;
      setBalance(solBalance);
    } catch (err: any) {
      console.error('Primary connection failed, trying fallbacks:', err);
      
      try {
        // Try all other connections in sequence
        const lamports = await tryMultipleConnections(
          (conn) => conn.getBalance(publicKey),
          [connection, ...fallbackConnections.slice(1)]
        );
        const solBalance = lamports / LAMPORTS_PER_SOL;
        setBalance(solBalance);
      } catch (fallbackErr: any) {
        console.error('All RPC connections failed:', fallbackErr);
        
        // Provide a more user-friendly error message
        setError('Unable to connect to Solana. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [publicKey, connected, connection]);

  // Fetch balance on connection/address change
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Set up polling for balance updates
  useEffect(() => {
    if (!connected || !publicKey) return;

    const intervalId = setInterval(fetchBalance, 30000); // Poll every 30 seconds
    return () => clearInterval(intervalId);
  }, [connected, publicKey, fetchBalance]);

  return { balance, loading, error, refetch: fetchBalance };
}

// Custom hook to get transaction history (simplified)
export function useTransactionHistory() {
  const { publicKey, connected } = useWallet();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!publicKey || !connected) {
      setTransactions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the Helius direct connection for better reliability
      const signatures = await defaultConnection.getSignaturesForAddress(publicKey, { limit: 10 });
      
      const txs = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await defaultConnection.getParsedTransaction(sig.signature);
            return {
              signature: sig.signature,
              timestamp: sig.blockTime ? new Date(sig.blockTime * 1000) : null,
              status: sig.confirmationStatus,
              data: tx
            };
          } catch (err) {
            console.error('Error fetching transaction:', err);
            return null;
          }
        })
      );

      setTransactions(txs.filter(Boolean));
    } catch (err: any) {
      console.error('Error fetching transaction history:', err);
      setError('Unable to load transaction history. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [publicKey, connected]);

  // Fetch transactions on connect/address change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, error, refetch: fetchTransactions };
}

// Hook for wallet status and connection
export function useWalletStatus() {
  const { publicKey, connected, connecting, disconnecting, connect, disconnect, wallet, select, wallets } = useWallet();
  const [error, setError] = useState<string | null>(null);

  // Connect with error handling
  const handleConnect = useCallback(async () => {
    try {
      setError(null);
      await connect().catch((err: any) => {
        throw err;
      });
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    }
  }, [connect]);

  // Format address for display (truncation)
  const formattedAddress = useMemo(() => {
    if (!publicKey) return '';
    const address = publicKey.toString();
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }, [publicKey]);

  return {
    address: publicKey?.toString() || null,
    formattedAddress,
    connected,
    connecting,
    disconnecting,
    walletName: wallet?.adapter.name || null,
    connect: handleConnect,
    disconnect,
    error,
    select,
    wallets
  };
} 