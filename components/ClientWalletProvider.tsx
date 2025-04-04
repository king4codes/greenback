'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the WalletConnect component with no SSR
const WalletConnect = dynamic(
  () => import('./WalletConnect'),
  { ssr: false }
);

export default function ClientWalletProvider() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return null;
} 