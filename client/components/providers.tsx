"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { Web3Provider } from "@/components/web3-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <Web3Provider>{children}</Web3Provider>
    </ThemeProvider>
  );
}
