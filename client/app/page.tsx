"use client";

import { useState } from "react";
import { WanderfyProvider } from "@/contexts/wanderify-context";
import LandingPage from "@/components/landing-page";
import MainApp from "@/components/main-app";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    setIsConnected(true);
  };

  return (
    <WanderfyProvider>
      <div className="min-h-screen bg-background">
        {!isConnected ? <LandingPage onConnect={handleConnect} /> : <MainApp />}
      </div>
    </WanderfyProvider>
  );
}
