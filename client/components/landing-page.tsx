"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface LandingPageProps {
  onConnect: () => void;
}

export default function LandingPage({ onConnect }: LandingPageProps) {
  const [mounted, setMounted] = useState(false);

  // Ensure client-side rendering for animations
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return static version during SSR to prevent hydration mismatch
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="mb-12">
          <div className="w-32 h-32">
            <svg
              viewBox="0 0 128 128"
              className="w-full h-full text-neon-cyan"
              fill="currentColor"
            >
              {/* Static compass without animations */}
              <circle
                cx="64"
                cy="64"
                r="60"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="opacity-80"
              />
              <circle
                cx="64"
                cy="64"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="opacity-60"
              />
              <polygon
                points="64,8 72,32 64,28 56,32"
                className="text-neon-gold"
                fill="currentColor"
              />
              <circle
                cx="64"
                cy="64"
                r="6"
                className="text-neon-gold"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
        <div className="text-center mb-12 max-w-2xl">
          <h1 className="font-pixel text-2xl md:text-3xl lg:text-4xl text-foreground mb-4">
            Discover a New World.
          </h1>
          <p className="font-pixel text-lg md:text-xl text-neon-cyan">
            Connect Your Compass.
          </p>
        </div>
        <Button
          onClick={onConnect}
          size="lg"
          className="font-pixel text-lg px-12 py-6 bg-neon-cyan text-background"
        >
          Enter the World
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      {/* Rotating Compass Icon - Only animate after hydration */}
      <div className="mb-12">
        <div className="w-32 h-32 animate-spin-slow">
          <svg
            viewBox="0 0 128 128"
            className="w-full h-full text-neon-cyan transition-all duration-1000"
            fill="currentColor"
            style={{ 
              filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.4))',
              animation: 'spin 20s linear infinite, pulse 2s ease-in-out infinite alternate'
            }}
          >
            {/* Compass outer ring */}
            <circle
              cx="64"
              cy="64"
              r="60"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-80"
            />

            {/* Compass inner ring */}
            <circle
              cx="64"
              cy="64"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="opacity-60"
            />

            {/* North pointer */}
            <polygon
              points="64,8 72,32 64,28 56,32"
              className="text-neon-gold"
              fill="currentColor"
            />

            {/* South pointer */}
            <polygon
              points="64,120 72,96 64,100 56,96"
              className="text-neon-magenta"
              fill="currentColor"
            />

            {/* East pointer */}
            <polygon
              points="120,64 96,56 100,64 96,72"
              className="text-neon-cyan"
              fill="currentColor"
            />

            {/* West pointer */}
            <polygon
              points="8,64 32,56 28,64 32,72"
              className="text-neon-cyan"
              fill="currentColor"
            />

            {/* Center dot */}
            <circle
              cx="64"
              cy="64"
              r="6"
              className="text-neon-gold"
              fill="currentColor"
            />

            {/* Cardinal direction markers */}
            <text
              x="64"
              y="20"
              textAnchor="middle"
              className="text-xs font-pixel text-neon-gold"
              fill="currentColor"
            >
              N
            </text>
            <text
              x="64"
              y="115"
              textAnchor="middle"
              className="text-xs font-pixel text-neon-magenta"
              fill="currentColor"
            >
              S
            </text>
            <text
              x="110"
              y="69"
              textAnchor="middle"
              className="text-xs font-pixel text-neon-cyan"
              fill="currentColor"
            >
              E
            </text>
            <text
              x="18"
              y="69"
              textAnchor="middle"
              className="text-xs font-pixel text-neon-cyan"
              fill="currentColor"
            >
              W
            </text>
          </svg>
        </div>
      </div>

      {/* Main Text */}
      <div className="text-center mb-12 max-w-2xl">
        <h1 className="font-pixel text-2xl md:text-3xl lg:text-4xl text-foreground mb-4 text-balance animate-fade-in">
          Discover a New World.
        </h1>
        <p className="font-pixel text-lg md:text-xl text-neon-cyan text-balance animate-fade-in-delay">
          Connect Your Compass.
        </p>
      </div>

      {/* Connect Button */}
      <Button
        onClick={onConnect}
        size="lg"
        className="font-pixel text-lg px-12 py-6 bg-neon-cyan text-background hover:bg-neon-cyan/90 border-2 border-neon-cyan transition-all duration-300 transform hover:scale-105 animate-bounce-subtle"
        style={{ 
          boxShadow: '0 0 30px rgba(34, 211, 238, 0.5)',
          textShadow: '0 0 10px rgba(0, 0, 0, 0.5)'
        }}
      >
        Enter the World
      </Button>

      {/* Ambient background effects - Only after hydration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div 
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-cyan/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '0s' }}
        ></div>
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-magenta/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
        <div 
          className="absolute top-1/2 right-1/3 w-48 h-48 bg-neon-gold/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>
      </div>
    </div>
  );
}
