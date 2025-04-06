'use client';

import React, { useEffect, useRef, memo } from 'react';

function TradingViewWidget() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(
    () => {
      if (!container.current) return;
      
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = `
        {
          "autosize": true,
          "symbol": "BINANCE:BTCUSDT",
          "interval": "60",
          "timezone": "Etc/UTC",
          "theme": "dark",
          "style": "1",
          "locale": "en",
          "backgroundColor": "rgba(43, 24, 16, 0.7)",
          "gridColor": "rgba(92, 74, 61, 0.3)",
          "hide_legend": true,
          "hide_side_toolbar": false,
          "allow_symbol_change": true,
          "studies": [
            "STD;Supertrend",
            "MAExp@tv-basicstudies"
          ],
          "support_host": "https://www.tradingview.com"
        }`;
      container.current.appendChild(script);
      
      return () => {
        if (container.current) {
          const scriptElement = container.current.querySelector('script');
          if (scriptElement) {
            container.current.removeChild(scriptElement);
          }
        }
      };
    },
    []
  );

  return (
    <div className="relative rounded-lg border-2 border-[#382418] overflow-hidden shadow-lg" style={{ height: "100%", width: "100%" }}>
      {/* Decorative corner elements */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#5C4A3D] rounded-tl-sm" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#5C4A3D] rounded-tr-sm" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#241610] rounded-bl-sm" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#241610] rounded-br-sm" />

      {/* Background texture */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[#463831] to-[#2B1810] opacity-90"
      />

      {/* Wood texture overlay */}
      <div 
        className="absolute inset-0 opacity-10 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}
      />

      {/* TradingView widget container */}
      <div className="tradingview-widget-container relative z-10" ref={container} style={{ height: "100%", width: "100%" }}>
        <div className="tradingview-widget-container__widget h-full" />
      </div>

      {/* Inner shadow overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4)'
        }}
      />
    </div>
  );
}

export default memo(TradingViewWidget); 