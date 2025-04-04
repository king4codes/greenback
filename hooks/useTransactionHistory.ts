'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const HELIUS_API_KEY = 'd56d6c95-3613-4d8a-98dd-0981bd941671';

interface Transaction {
  signature: string;
  type: string;
  timestamp: number;
  fee: number;
  nativeTransfers: {
    amount: number;
    fromUserAccount: string;
    toUserAccount: string;
  }[];
  status: 'success' | 'failed';
}

export function useTransactionHistory() {
  const { publicKey } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://api.helius.xyz/v0/addresses/${publicKey.toBase58()}/transactions/?api-key=${HELIUS_API_KEY}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to fetch transaction history');
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions when wallet connects
  useEffect(() => {
    if (publicKey) {
      fetchTransactions();
    } else {
      setTransactions([]);
      setError(null);
    }
  }, [publicKey]);

  const formatTransaction = (tx: Transaction) => {
    return {
      signature: tx.signature,
      type: tx.type,
      timestamp: new Date(tx.timestamp * 1000).toLocaleString(),
      fee: tx.fee / 1e9, // Convert lamports to SOL
      transfers: tx.nativeTransfers.map(transfer => ({
        amount: transfer.amount / 1e9, // Convert lamports to SOL
        from: transfer.fromUserAccount,
        to: transfer.toUserAccount
      })),
      status: tx.status
    };
  };

  return {
    transactions: transactions.map(formatTransaction),
    loading,
    error,
    refetch: fetchTransactions
  };
} 