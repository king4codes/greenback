'use client';

import React, { useEffect, useRef, memo } from 'react';

function TradingViewTickerTape() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    
    // Clear any existing scripts to prevent duplicates
    const existingScript = container.current.querySelector('script');
    if (existingScript) {
      container.current.removeChild(existingScript);
    }
    
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
    {
      "symbols": [
        {
          "proName": "BITSTAMP:BTCUSD",
          "title": "Bitcoin"
        },
        {
          "proName": "BITSTAMP:ETHUSD",
          "title": "Ethereum"
        },
        {
          "description": "Solana",
          "proName": "CRYPTOCAP:SOL"
        },
        {
          "description": "Fartcoin",
          "proName": "MEXC:FARTCOINUSDT"
        },
        {
          "description": "HyperLiquid",
          "proName": "KUCOIN:HYPEUSDT"
        }
      ],
      "showSymbolLogo": true,
      "isTransparent": true,
      "displayMode": "adaptive",
      "colorTheme": "dark",
      "locale": "en"
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
  }, []);

  return (
    <div className="tradingview-ticker-container" ref={container}>
      <div className="tradingview-ticker-container__widget"></div>
      <div className="tradingview-ticker-copyright"></div>
    </div>
  );
}

export default memo(TradingViewTickerTape); 