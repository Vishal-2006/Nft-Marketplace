"use client";

import * as React from 'react';
import {RainbowKitProvider,getDefaultConfig,} from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { WagmiProvider } from 'wagmi';
import { http } from 'wagmi';

const config = getDefaultConfig({
  appName: 'NFT Marketplace',
  projectId: 'YOUR_PROJECT_ID',
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}