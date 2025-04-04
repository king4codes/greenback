'use client'

import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { useWallet } from '@solana/wallet-adapter-react';
import { RefreshCw, ExternalLink } from 'lucide-react';

export default function TransactionHistory() {
  const { connected } = useWallet();
  const { transactions, loading, error, refetch } = useTransactionHistory();

  if (!connected) return null;

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Transaction History</h2>
        <button
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-zinc-800 hover:bg-zinc-700 rounded"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-800 p-3 rounded mb-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-zinc-400">
          Loading transactions...
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 text-zinc-400">
          No transactions found
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div
              key={tx.signature}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-sm font-mono text-zinc-400">
                    {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                  </span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                    tx.status === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                  }`}>
                    {tx.status}
                  </span>
                </div>
                <a
                  href={`https://solscan.io/tx/${tx.signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-white"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="text-sm text-zinc-300 mb-2">
                {tx.timestamp}
              </div>

              <div className="text-sm">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Type</span>
                  <span>{tx.type}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Fee</span>
                  <span>{tx.fee.toFixed(6)} SOL</span>
                </div>
              </div>

              {tx.transfers.length > 0 && (
                <div className="mt-2 pt-2 border-t border-zinc-800">
                  <div className="text-sm text-zinc-400 mb-1">Transfers</div>
                  {tx.transfers.map((transfer, i) => (
                    <div key={i} className="text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <span className="truncate">{transfer.from.slice(0, 4)}...{transfer.from.slice(-4)}</span>
                        <span>→</span>
                        <span className="truncate">{transfer.to.slice(0, 4)}...{transfer.to.slice(-4)}</span>
                      </div>
                      <div className="text-right text-zinc-400">
                        {transfer.amount.toFixed(6)} SOL
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 