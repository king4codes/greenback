'use client'

import { useEffect, useState } from 'react'
import MainLayout from '@/components/MainLayout'
import { useWalletStatus } from '@/lib/solana/hooks'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { useAchievements } from '@/hooks/use-achievements'
import { useTrading } from '@/hooks/use-trading'
import { cn } from '@/lib/utils'

interface TokenProfile {
  url: string;
  chainId: string;
  tokenAddress: string;
  icon: string;
  header: string;
  description: string;
  links: Array<{
    type: string;
    label: string;
    url: string;
  }>;
}

type View = 'trading' | 'tokens';

export default function TradingPage() {
  const { connected } = useWalletStatus()
  const { user } = useAuth()
  const supabase = createClient()
  const { updateProgress } = useAchievements()
  const { handleTrade, loading: tradeLoading, error: tradeError } = useTrading()
  const [tokenProfiles, setTokenProfiles] = useState<TokenProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<View>('trading')

  // Track trading page visit
  useEffect(() => {
    const trackVisit = async () => {
      if (!user?.id) return;

      try {
        console.log('Tracking trading page visit...');

        // Record the visit in user_page_visits
        const { error: visitError } = await supabase
          .from('user_page_visits')
          .upsert({
            user_id: user.id,
            page: '/trading',
            visit_date: new Date().toISOString().split('T')[0]
          }, {
            onConflict: 'user_id,page,visit_date'
          });

        if (visitError) {
          console.error('Error recording page visit:', visitError);
        }
      } catch (err) {
        console.error('Error tracking trading visit:', err);
      }
    };

    trackVisit();
  }, [user?.id, supabase]);

  // Handle trade completion from DEXTswap widget
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== 'https://www.dextools.io') return;

      try {
        const data = JSON.parse(event.data);
        if (data.type === 'trade_completed') {
          await handleTrade(
            data.fromToken,
            data.toToken,
            data.fromAmount,
            data.toAmount
          );
        }
      } catch (err) {
        console.error('Error handling trade message:', err);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleTrade]);

  // Fetch token profiles
  useEffect(() => {
    const fetchTokenProfiles = async () => {
      try {
        const response = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');
        const data = await response.json();
        setTokenProfiles(data);
      } catch (err) {
        console.error('Error fetching token profiles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenProfiles();
  }, []);

  const TradingView = () => (
    <div className="space-y-4">
      {/* Trading Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* DEXTools Chart Widget */}
        <div className="bg-zinc-800/50 rounded-lg overflow-hidden">
          <iframe
            id="dextools-widget"
            title="DEXTools Trading Chart"
            width="100%"
            height="500"
            src="https://www.dextools.io/widget-chart/en/solana/pe-light/Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE?theme=dark&chartType=2&chartResolution=30&drawingToolbars=false"
            className="border-0"
          />
        </div>

        {/* DEXTswap Aggregator Widget */}
        <div className="bg-zinc-800/50 rounded-lg overflow-hidden">
          <iframe
            id="dextswap-aggregator-widget"
            title="DEXTswap Aggregator"
            width="100%"
            height="500"
            src="https://www.dextools.io/widget-aggregator/en/swap/solana/9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump"
            className="border-0"
          />
        </div>
      </div>

      {/* Trade Status */}
      {tradeError && (
        <div className="bg-red-900/20 border border-red-900/30 rounded-lg p-4 text-red-400 text-sm">
          {tradeError}
        </div>
      )}
    </div>
  );

  const TokensView = () => (
    <div className="space-y-4">
      {/* Token Profiles */}
      <div className="bg-zinc-800/50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokenProfiles.map((token, index) => (
            <div key={index} className="bg-zinc-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                {token.icon && (
                  <img src={token.icon} alt="Token" className="w-8 h-8 rounded-full" />
                )}
                <div className="flex-1 truncate">
                  <h3 className="text-green-400 font-medium truncate">{token.description}</h3>
                  <p className="text-xs text-zinc-400 truncate">{token.tokenAddress}</p>
                </div>
              </div>
              <div className="space-y-2">
                {token.links?.map((link, linkIndex) => (
                  <a
                    key={linkIndex}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-zinc-300 hover:text-green-400"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h1 className="font-garamond text-3xl text-green-400">Trading</h1>
            <div className="flex bg-zinc-800/50 rounded-lg p-1">
              <button
                onClick={() => setCurrentView('trading')}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                  currentView === 'trading'
                    ? "bg-green-400/20 text-green-400"
                    : "text-zinc-400 hover:text-green-300"
                )}
              >
                Trading
              </button>
              <button
                onClick={() => setCurrentView('tokens')}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                  currentView === 'tokens'
                    ? "bg-green-400/20 text-green-400"
                    : "text-zinc-400 hover:text-green-300"
                )}
              >
                Featured Tokens
              </button>
            </div>
          </div>
          <div className="text-sm font-mono text-zinc-400">
            {connected 
              ? 'Connected to live trading data' 
              : 'Connect wallet for personalized trading view'}
          </div>
        </div>

        {loading && currentView === 'tokens' ? (
          <div className="text-center text-zinc-400 py-8">Loading token profiles...</div>
        ) : currentView === 'trading' ? (
          <TradingView />
        ) : (
          <TokensView />
        )}
      </div>
    </MainLayout>
  )
} 