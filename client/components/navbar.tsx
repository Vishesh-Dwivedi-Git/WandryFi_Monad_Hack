"use client";

import { cn } from "@/lib/utils";
import type { PageType } from "@/components/main-app";
import ConnectWalletButton from "@/components/wallet/connect-button";

interface NavbarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
}

export default function Navbar({ currentPage, onPageChange }: NavbarProps) {
  const navItems: { id: PageType; label: string }[] = [
    { id: "explore", label: "Explore" },
    { id: "leaderboard", label: "Leaderboard" },
    { id: "my-travel", label: "My Travel" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="font-pixel text-xl text-neon-cyan">Wanderify</h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={cn(
                    "px-3 py-2 text-sm font-medium transition-all duration-200 relative",
                    currentPage === item.id
                      ? "text-neon-cyan"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                  {currentPage === item.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-cyan glow-cyan animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* User / Wallet */}
          <div className="flex items-center space-x-3">
            {/* Pixel Avatar */}
            <div className="w-8 h-8 bg-card border border-neon-cyan rounded-sm overflow-hidden">
              <svg viewBox="0 0 32 32" className="w-full h-full">
                {/* Simple pixel art avatar */}
                <rect
                  x="0"
                  y="0"
                  width="32"
                  height="32"
                  fill="currentColor"
                  className="text-card"
                />
                <rect
                  x="8"
                  y="8"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="text-neon-cyan"
                />
                <rect
                  x="10"
                  y="10"
                  width="4"
                  height="4"
                  fill="currentColor"
                  className="text-background"
                />
                <rect
                  x="18"
                  y="10"
                  width="4"
                  height="4"
                  fill="currentColor"
                  className="text-background"
                />
                <rect
                  x="12"
                  y="16"
                  width="8"
                  height="2"
                  fill="currentColor"
                  className="text-background"
                />
                <rect
                  x="6"
                  y="6"
                  width="2"
                  height="2"
                  fill="currentColor"
                  className="text-neon-gold"
                />
                <rect
                  x="24"
                  y="6"
                  width="2"
                  height="2"
                  fill="currentColor"
                  className="text-neon-gold"
                />
                <rect
                  x="6"
                  y="24"
                  width="2"
                  height="2"
                  fill="currentColor"
                  className="text-neon-magenta"
                />
                <rect
                  x="24"
                  y="24"
                  width="2"
                  height="2"
                  fill="currentColor"
                  className="text-neon-magenta"
                />
              </svg>
            </div>

            {/* Connect / Address */}
            <ConnectWalletButton />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-muted-foreground hover:text-foreground p-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={cn(
                  "block px-3 py-2 text-base font-medium w-full text-left transition-all duration-200",
                  currentPage === item.id
                    ? "text-neon-cyan bg-neon-cyan/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
