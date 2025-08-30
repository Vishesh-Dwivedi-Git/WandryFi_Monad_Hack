"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

function truncate(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (!isConnected) {
    const injected =
      connectors.find((c) => c.id === "injected") || connectors[0];
    return (
      <button
        className="font-pixel text-base px-6 py-2 bg-neon-cyan text-background hover:bg-neon-cyan/90 border-2 border-neon-cyan glow-cyan hover:glow-cyan transition-all duration-300 transform hover:scale-105 rounded-md"
        onClick={() => connect({ connector: injected })}
        disabled={isPending}
      >
        {isPending ? "Connecting…" : "Connect Wallet"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-sm text-neon-cyan">
        {truncate(address)}
      </span>
      <button
        className="font-pixel text-xs px-3 py-1 bg-transparent text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/10 rounded-md"
        onClick={() => disconnect()}
      >
        Disconnect
      </button>
    </div>
  );
}
