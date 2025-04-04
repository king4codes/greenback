import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/lib/auth';
import { useAchievements } from '@/hooks/use-achievements';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface BankingTransaction {
  type: 'deposit' | 'withdraw' | 'lend' | 'borrow';
  amount: number;
  asset: string;
  timestamp: Date;
}

export function useBanking() {
  const { user } = useAuth();
  const { connected } = useWallet();
  const { earnAchievement } = useAchievements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeposit = useCallback(async (amount: number, asset: string) => {
    if (!user || !connected) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Record the transaction
      const { error: txError } = await supabase
        .from('banking_transactions')
        .insert({
          user_id: user.id,
          type: 'deposit',
          amount,
          asset,
          status: 'completed'
        });

      if (txError) throw txError;

      // Track achievements
      await earnAchievement('bank-depositor');
      
      // Check for high roller achievement (10 SOL deposit)
      if (asset === 'SOL' && amount >= 10) {
        await earnAchievement('high-roller');
      }

      return true;
    } catch (err: any) {
      console.error('Error processing deposit:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, connected, earnAchievement]);

  const handleLend = useCallback(async (amount: number, asset: string) => {
    if (!user || !connected) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Record the lending transaction
      const { error: txError } = await supabase
        .from('banking_transactions')
        .insert({
          user_id: user.id,
          type: 'lend',
          amount,
          asset,
          status: 'completed'
        });

      if (txError) throw txError;

      // Count total lending transactions
      const { data: lendCount, error: countError } = await supabase
        .from('banking_transactions')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('type', 'lend')
        .eq('status', 'completed');

      if (countError) throw countError;

      // Check for lending pioneer achievement (3 lending transactions)
      if (lendCount && lendCount.length >= 3) {
        await earnAchievement('lending-pioneer');
      }

      return true;
    } catch (err: any) {
      console.error('Error processing lending:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, connected, earnAchievement]);

  const handleWithdraw = useCallback(async (amount: number, asset: string) => {
    if (!user || !connected) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Record the withdrawal transaction
      const { error: txError } = await supabase
        .from('banking_transactions')
        .insert({
          user_id: user.id,
          type: 'withdraw',
          amount,
          asset,
          status: 'completed'
        });

      if (txError) throw txError;

      return true;
    } catch (err: any) {
      console.error('Error processing withdrawal:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, connected]);

  const handleBorrow = useCallback(async (amount: number, asset: string) => {
    if (!user || !connected) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Record the borrowing transaction
      const { error: txError } = await supabase
        .from('banking_transactions')
        .insert({
          user_id: user.id,
          type: 'borrow',
          amount,
          asset,
          status: 'completed'
        });

      if (txError) throw txError;

      return true;
    } catch (err: any) {
      console.error('Error processing borrowing:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, connected]);

  return {
    handleDeposit,
    handleWithdraw,
    handleLend,
    handleBorrow,
    loading,
    error
  };
} 