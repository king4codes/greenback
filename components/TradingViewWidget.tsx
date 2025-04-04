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
          "backgroundColor": "rgba(24, 24, 27, 0.3)",
          "gridColor": "rgba(82, 82, 91, 0.3)",
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
    <div className="tradingview-widget-container relative" ref={container} style={{ height: "100%", width: "100%" }}>
      <div 
        className="absolute inset-0 z-0 opacity-10 bg-cover bg-center pointer-events-none" 
        style={{ 
          backgroundImage: 'url("https://aupfufxxvbwmdiewjeka.supabase.co/storage/v1/object/public/nature//chartbg1.jpg")' 
        }}
      />
      <div className="tradingview-widget-container__widget relative z-10" style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
      <div className="tradingview-widget-copyright relative z-10">
      </div>
    </div>
  );
}

export default memo(TradingViewWidget); 