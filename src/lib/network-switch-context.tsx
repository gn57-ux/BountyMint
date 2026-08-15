"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSwitchChain } from "wagmi";

// Header's network pill and NetworkBanner both need to trigger/observe the same
// chain switch so a failure surfaces wherever the user triggered it from (wagmi's
// useSwitchChain is a plain useMutation — two independent call sites get two
// independent, unsynced isPending/error states otherwise).
type NetworkSwitchContextValue = ReturnType<typeof useSwitchChain>;

const NetworkSwitchContext = createContext<NetworkSwitchContextValue | null>(null);

export function NetworkSwitchProvider({ children }: { children: ReactNode }) {
  const switchChain = useSwitchChain();
  return (
    <NetworkSwitchContext.Provider value={switchChain}>{children}</NetworkSwitchContext.Provider>
  );
}

export function useNetworkSwitch() {
  const ctx = useContext(NetworkSwitchContext);
  if (!ctx) {
    throw new Error("useNetworkSwitch must be used within a NetworkSwitchProvider");
  }
  return ctx;
}
