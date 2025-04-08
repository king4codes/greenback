'use client';

import React, { useEffect, useRef, memo } from 'react';

function TradingViewFartcoinChart() {
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
          "symbol": "MEXC:FARTCOINUSDT",
          "interval": "1",
          "timezone": "Etc/UTC",
          "theme": "dark",
          "style": "2",
          "locale": "en",
          "hide_legend": true,
          "allow_symbol_change": true,
          "studies": [
            "STD;Stochastic_RSI"
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
    <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }}></div>
    </div>
  );
}

export default memo(TradingViewFartcoinChart); 