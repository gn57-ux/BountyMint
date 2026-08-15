import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";

import { monadChain } from "./monad-chain";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "bountymint-dev-placeholder";

// Deliberately excludes RainbowKit's Coinbase/Base wallet connectors: they pull in
// @coinbase/cdp-sdk's optional @x402/* payment packages, which break Turbopack's
// static import resolution (see specs/memory/ for the write-up) and add no value
// for a Monad-only hackathon MVP.
const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [injectedWallet, metaMaskWallet, rainbowWallet, walletConnectWallet],
    },
  ],
  {
    appName: "BountyMint",
    projectId,
  },
);

export const wagmiConfig = createConfig({
  chains: [monadChain],
  connectors,
  ssr: true,
  transports: {
    [monadChain.id]: http(),
  },
});
