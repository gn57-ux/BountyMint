"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";

import { NetworkSwitchProvider } from "@/lib/network-switch-context";
import { wagmiConfig } from "@/lib/wagmi-config";

const rainbowKitDarkTheme = darkTheme({
  accentColor: "#836EF9",
  accentColorForeground: "#ffffff",
  borderRadius: "medium",
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowKitDarkTheme} locale="zh-CN">
          <NetworkSwitchProvider>{children}</NetworkSwitchProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
