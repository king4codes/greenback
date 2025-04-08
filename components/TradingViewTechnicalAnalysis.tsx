import { useEffect, useRef, memo } from 'react'

function TradingViewTechnicalAnalysis() {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current) return

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      "interval": "1h",
      "width": "100%",
      "isTransparent": true,
      "height": "100%",
      "symbol": "COINBASE:BTCUSD",
      "showIntervalTabs": true,
      "displayMode": "single",
      "locale": "en",
      "colorTheme": "dark"
    })

    const widgetContainer = document.createElement('div')
    widgetContainer.className = 'tradingview-widget-container__widget h-full w-full'
    
    container.current.appendChild(widgetContainer)
    container.current.appendChild(script)

    return () => {
      if (container.current) {
        container.current.innerHTML = ''
      }
    }
  }, [])

  return (
    <div ref={container} className="tradingview-widget-container h-full w-full overflow-hidden" />
  )
}

export default memo(TradingViewTechnicalAnalysis) 