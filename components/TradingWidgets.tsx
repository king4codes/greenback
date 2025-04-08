'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { X, LineChart, RefreshCw, TrendingUp, Wallet, Settings, PieChart, TrendingDown, CircleDollarSign, Droplets, Car, Newspaper, Gauge, Grid } from 'lucide-react'
import TradingViewSolChart from './TradingViewSolChart'
import TradingViewEthChart from './TradingViewEthChart'
import TradingViewFartcoinChart from './TradingViewFartcoinChart'
import TradingViewPepeChart from './TradingViewPepeChart'
import TradingViewDominanceChart from './TradingViewDominanceChart'
import TradingViewSPXChart from './TradingViewSPXChart'
import TradingViewGoldChart from './TradingViewGoldChart'
import TradingViewOilChart from './TradingViewOilChart'
import TradingViewTeslaChart from './TradingViewTeslaChart'
import TradingViewNvidiaChart from './TradingViewNvidiaChart'
import TradingViewNewsFeed from './TradingViewNewsFeed'
import TradingViewTechnicalAnalysis from './TradingViewTechnicalAnalysis'
import TradingViewHeatmap from './TradingViewHeatmap'

interface Widget {
  id: string
  title: string
  icon: any
  active: boolean
}

export default function TradingWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: 'solchart', title: 'SOL/USD', icon: LineChart, active: true },
    { id: 'ethchart', title: 'ETH/USD', icon: LineChart, active: false },
    { id: 'fartchart', title: 'FART/USDT', icon: LineChart, active: false },
    { id: 'pepechart', title: 'PEPE/USD', icon: LineChart, active: false },
    { id: 'dominance', title: 'BTC.D', icon: PieChart, active: false },
    { id: 'spx', title: 'S&P 500', icon: TrendingDown, active: false },
    { id: 'gold', title: 'GOLD', icon: CircleDollarSign, active: false },
    { id: 'oil', title: 'OIL', icon: Droplets, active: false },
    { id: 'tesla', title: 'TSLA', icon: Car, active: false },
    { id: 'nvidia', title: 'NVDA', icon: LineChart, active: false },
    { id: 'news', title: 'News Feed', icon: Newspaper, active: false },
    { id: 'technical', title: 'BTC Analysis', icon: Gauge, active: false },
    { id: 'heatmap', title: 'S&P 500 Map', icon: Grid, active: false },
    { id: 'trades', title: 'Trades', icon: RefreshCw, active: false },
    { id: 'positions', title: 'Positions', icon: TrendingUp, active: false },
    { id: 'balance', title: 'Balance', icon: Wallet, active: false },
    { id: 'settings', title: 'Settings', icon: Settings, active: false },
  ])

  const activeWidgets = useMemo(() => widgets.filter(w => w.active), [widgets])

  const getGridClass = (activeCount: number) => {
    switch (activeCount) {
      case 0:
        return ''
      case 1:
        return 'grid-cols-1'
      case 2:
        return 'grid-cols-2'
      case 3:
        return 'grid-cols-2'
      case 4:
        return 'grid-cols-2'
      case 5:
      case 6:
        return 'grid-cols-3'
      case 7:
      case 8:
      case 9:
        return 'grid-cols-3'
      case 10:
      case 11:
      case 12:
      case 13:
      case 14:
      case 15:
      case 16:
        return 'grid-cols-4'
      default:
        return 'grid-cols-4'
    }
  }

  const getWidgetClass = (index: number, total: number) => {
    if (total === 3 && index === 0) {
      return 'col-span-2 row-span-1'
    }
    return ''
  }

  const toggleWidget = (widgetId: string) => {
    setWidgets(widgets.map(widget => 
      widget.id === widgetId 
        ? { ...widget, active: !widget.active }
        : widget
    ))
  }

  const renderWidgetContent = (widgetId: string) => {
    switch (widgetId) {
      case 'solchart':
        return <TradingViewSolChart />
      case 'ethchart':
        return <TradingViewEthChart />
      case 'fartchart':
        return <TradingViewFartcoinChart />
      case 'pepechart':
        return <TradingViewPepeChart />
      case 'dominance':
        return <TradingViewDominanceChart />
      case 'spx':
        return <TradingViewSPXChart />
      case 'gold':
        return <TradingViewGoldChart />
      case 'oil':
        return <TradingViewOilChart />
      case 'tesla':
        return <TradingViewTeslaChart />
      case 'nvidia':
        return <TradingViewNvidiaChart />
      case 'news':
        return <TradingViewNewsFeed />
      case 'technical':
        return <TradingViewTechnicalAnalysis />
      case 'heatmap':
        return <TradingViewHeatmap />
      default:
        return (
          <div className="h-full flex items-center justify-center text-zinc-400">
            {widgets.find(w => w.id === widgetId)?.title} Widget Content
          </div>
        )
    }
  }

  return (
    <div className={cn(
      "flex flex-col",
      "h-[80vh]"
    )}>
      {/* Widget Navigation */}
      <div className={cn(
        "flex flex-wrap gap-2 p-2 bg-zinc-800/50 rounded-lg",
        "mb-2"
      )}>
        {widgets.map(widget => (
          <button
            key={widget.id}
            onClick={() => toggleWidget(widget.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              widget.active
                ? "bg-green-400/20 text-green-400"
                : "text-zinc-400 hover:text-green-300"
            )}
          >
            <widget.icon className="w-4 h-4" />
            {widget.title}
          </button>
        ))}
      </div>

      {/* Widget Grid Container */}
      <div className={cn(
        "grid gap-2 flex-1",
        "h-[calc(80vh-4.5rem)]",
        "min-h-0 w-full",
        "auto-rows-fr",
        getGridClass(activeWidgets.length)
      )}>
        {activeWidgets.map((widget, index) => (
          <div 
            key={widget.id} 
            className={cn(
              "relative bg-zinc-800/50 rounded-lg overflow-hidden flex flex-col h-full",
              getWidgetClass(index, activeWidgets.length)
            )}
          >
            <div className="flex items-center justify-between p-2 border-b border-zinc-700/50">
              <div className="flex items-center gap-2 text-green-400">
                <widget.icon className="w-4 h-4" />
                <span className="font-medium">{widget.title}</span>
              </div>
              <button
                onClick={() => toggleWidget(widget.id)}
                className="p-1 rounded-full hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {renderWidgetContent(widget.id)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 