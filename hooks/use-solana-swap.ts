import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth';

const supabase = createClient();

// The fixed recipient address for SOL deposits
const RECIPIENT_ADDRESS = new PublicKey('B3puSCahSLE3ntRwA19en2u6engpVRbi2fcxvvWRag48');

export function useSolanaSwap() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSwap = useCallback(async (solAmount: number) => {
    if (!publicKey || !user) {
      setError('Please connect your wallet and sign in');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Create a transaction to send SOL
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: RECIPIENT_ADDRESS,
          lamports: solAmount * LAMPORTS_PER_SOL
        })
      );

      // Get the latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send the transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature);
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }

      // Calculate GBC amount (10x USD value)
      // For this example, we're using a fixed rate of $20 per SOL
      // In production, you should use a price feed
      const usdValue = solAmount * 20; // $20 per SOL
      const gbcAmount = usdValue * 10; // 10 GBC per USD

      // Record the transaction in your database
      const { error: dbError } = await supabase
        .from('banking_transactions')
        .insert({
          user_id: user.id,
          type: 'deposit',
          amount: solAmount,
          asset: 'SOL',
          status: 'completed',
          signature,
          gbc_amount: gbcAmount
        });

      if (dbError) throw dbError;

      return {
        signature,
        gbcAmount
      };
    } catch (err: any) {
      console.error('Error processing swap:', err);
      setError(err.message || 'Failed to process swap');
      return null;
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection, sendTransaction, user]);

  return {
    handleSwap,
    loading,
    error
  };
} 