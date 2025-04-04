'use client'

import { useEffect } from 'react'
import MainLayout from '@/components/MainLayout'
import TradingViewWidget from '@/components/TradingViewWidget'
import TradingViewTickerTape from '@/components/TradingViewTickerTape'
import { useWalletStatus } from '@/lib/solana/hooks'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { useAchievements } from '@/hooks/use-achievements'

export default function MarketsPage() {
  const { connected } = useWalletStatus()
  const { user } = useAuth()
  const supabase = createClient()
  const { updateProgress } = useAchievements()

  // Track market page visit
  useEffect(() => {
    const trackVisit = async () => {
      if (!user?.id) return;

      try {
        console.log('Tracking market page visit...');

        // Record the visit in user_page_visits
        const { error: visitError } = await supabase
          .from('user_page_visits')
          .upsert({
            user_id: user.id,
            page: '/markets',
            visit_date: new Date().toISOString().split('T')[0]
          }, {
            onConflict: 'user_id,page,visit_date'
          });

        if (visitError) {
          console.error('Error recording page visit:', visitError);
          return;
        }

        // Get count of unique visit dates
        const { data: visitData, error: countError } = await supabase
          .from('user_page_visits')
          .select('visit_date')
          .eq('user_id', user.id)
          .eq('page', '/markets');

        if (countError) {
          console.error('Error counting visits:', countError);
          return;
        }

        // Count unique dates
        const uniqueDates = new Set(visitData?.map(v => v.visit_date)).size;
        console.log('Unique market page visits:', uniqueDates);

        // Update progress for market-analyzer achievement
        await updateProgress('market-analyzer', uniqueDates);
      } catch (err) {
        console.error('Error tracking market visit:', err);
      }
    };

    trackVisit();
  }, [user?.id, supabase, updateProgress]);

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-garamond text-3xl text-green-400">GreenMarkets</h1>
          <div className="text-sm font-mono text-zinc-400">
            {connected 
              ? 'Connected to live market data' 
              : 'Connect wallet for personalized market view'}
          </div>
        </div>

        {/* Ticker Tape Widget */}
        <div className="bg-zinc-800/50 rounded-lg overflow-hidden py-1 mb-2">
          <TradingViewTickerTape />
        </div>

        {/* Chart Widget */}
        <div className="bg-zinc-800/50 rounded-lg overflow-hidden" style={{ height: "calc(100vh - 480px)" }}>
          <TradingViewWidget />
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-zinc-800/50 p-4 rounded-lg">
            <div className="text-xs text-zinc-500 mb-1">BTC 24h Volume</div>
            <div className="text-xl font-mono text-green-400">$42.8B</div>
          </div>
          <div className="bg-zinc-800/50 p-4 rounded-lg">
            <div className="text-xs text-zinc-500 mb-1">SOL 24h Change</div>
            <div className="text-xl font-mono text-green-400">+4.82%</div>
          </div>
          <div className="bg-zinc-800/50 p-4 rounded-lg">
            <div className="text-xs text-zinc-500 mb-1">Market Cap</div>
            <div className="text-xl font-mono text-green-400">$2.15T</div>
          </div>
          <div className="bg-zinc-800/50 p-4 rounded-lg">
            <div className="text-xs text-zinc-500 mb-1">Total Volume 24h</div>
            <div className="text-xl font-mono text-green-400">$89.7B</div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
} 