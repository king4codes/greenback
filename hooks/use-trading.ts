import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/lib/auth';
import { useAchievements } from '@/hooks/use-achievements';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface Trade {
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  timestamp: Date;
}

export function useTrading() {
  const { user } = useAuth();
  const { connected } = useWallet();
  const { updateProgress } = useAchievements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrade = useCallback(async (fromToken: string, toToken: string, fromAmount: number, toAmount: number) => {
    if (!user || !connected) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Record the trade
      const { error: tradeError } = await supabase
        .from('trading_transactions')
        .insert({
          user_id: user.id,
          from_token: fromToken,
          to_token: toToken,
          from_amount: fromAmount,
          to_amount: toAmount,
          status: 'completed'
        });

      if (tradeError) throw tradeError;

      // Count total completed trades
      const { data: tradeCount, error: countError } = await supabase
        .from('trading_transactions')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'completed');

      if (countError) throw countError;

      // Update progress for trade-related achievements
      if (tradeCount) {
        // First Trade achievement
        await updateProgress('first-trade', 1);

        // Trade Sequencer achievement (20 trades)
        await updateProgress('trade-sequencer', tradeCount.length);
      }

      return true;
    } catch (err: any) {
      console.error('Error processing trade:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, connected, updateProgress]);

  return {
    handleTrade,
    loading,
    error
  };
} 