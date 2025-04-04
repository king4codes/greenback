'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

const ClientWalletProvider = dynamic(
  () => import('./ClientWalletProvider'),
  { ssr: false }
);

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <>
      <ClientWalletProvider />
      {children}
    </>
  );
} 