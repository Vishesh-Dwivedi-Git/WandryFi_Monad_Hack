"use client";

import { useState, useEffect } from "react";
import type { JSX } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StakingModal from "@/components/staking-model";
import Image from "next/image";
import { MapPin, Trophy, Users, Clock } from "lucide-react";
import dynamic from "next/dynamic";
import { useAccount, useReadContract } from "wagmi";
import { useWanderifyContract } from "@/lib/contract";
import { formatEther } from "viem";
import { destinationsById } from "@/lib/destinations";

// Dynamically import leaflet to avoid SSR issues
let L: any = null;

// Dynamic imports for react-leaflet components - with proper loading states
const MapContainer = dynamic(
  () => import("react-leaflet").then(mod => mod.MapContainer), 
  { 
    ssr: false,
    loading: () => <div className="h-full flex items-center justify-center text-cyan-400">Loading map...</div>
  }
);
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

// Custom icon creation function
const createCustomIcon = (difficulty: string, isStaked = false, isActive = false): L.DivIcon | null => {
  if (typeof window === "undefined" || !L) return null;
  
  const colors: Record<string, string> = {
    Easy: "#00D4FF",
    Medium: "#FF9500", 
    Hard: "#FF4D94"
  };
  
  const color = colors[difficulty] || "#00D4FF";
  const size = isActive ? 40 : isStaked ? 36 : 32;

  return L.divIcon({
    html: `
      <div class="relative">
        <div class="relative rounded-full border-2 border-white flex items-center justify-center" 
             style="background-color: ${isStaked ? "#666666" : color}; width: ${size}px; height: ${size}px;">
          <svg viewBox="0 0 24 24" class="text-white" fill="currentColor" style="width: ${size * 0.4}px; height: ${size * 0.4}px;">
            ${isActive 
              ? '<path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>'
              : isStaked
                ? '<path d="M9 12L11 14L15 10M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z"/>'
                : '<path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>'
            }
          </svg>
        </div>
      </div>
    `,
    className: "custom-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size]
  });
};

// Map styling component with z-index fix
function MapStyle(): null {
  const { useMap } = require("react-leaflet");
  const map = useMap();

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .leaflet-container { 
        background: #000000 !important; 
        z-index: 1 !important;
      }
      .leaflet-tile { filter: none !important; }
      .leaflet-control { 
        background: #000000 !important; 
        border: 1px solid #333333 !important; 
        border-radius: 4px !important; 
        z-index: 10 !important;
      }
      .leaflet-popup-content-wrapper { 
        background: #000000 !important; 
        border: 1px solid #333333 !important; 
        border-radius: 6px !important; 
        color: #FFFFFF !important; 
        z-index: 1000 !important;
      }
      .leaflet-popup-tip { 
        background: #000000 !important; 
        border: 1px solid #333333 !important; 
      }
      .leaflet-popup { z-index: 1000 !important; }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [map]);

  return null;
}

import type { StaticImageData } from "next/image";

interface Destination {
  id: string;
  name: string;
  image: string | StaticImageData;
  rewardPool: number;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  coordinates: { lat: number; lng: number };
  participants?: number;
  estimatedTime?: string;
  tags?: string[];
}

export default function ExplorePage() {
  const [viewMode, setViewMode] = useState<"map" | "list">("list");
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [mounted, setMounted] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  const { address } = useAccount();
  const contract = useWanderifyContract();

  // Fetch user commitment data
  const { data: commitmentData } = useReadContract({
    ...contract,
    functionName: "commitments",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  const destinationIds = [1, 2, 3, 4, 5, 6, 7, 8];

  const destinationQueries = destinationIds.map((id) => ({
    id: id.toString(),
    name: useReadContract({
      ...contract,
      functionName: "destinationNames", 
      args: [BigInt(id)],
    }),
    pool: useReadContract({
      ...contract,
      functionName: "locationPools",
      args: [BigInt(id)],
    }),
    placeValue: useReadContract({
      ...contract,
      functionName: "placeValues", 
      args: [BigInt(id)],
    }),
  }));

  // Fix hydration by ensuring client-side only rendering
  useEffect(() => {
    setMounted(true);
    
    // Load Leaflet CSS and JS only on client side
    if (typeof window !== "undefined") {
      // Load CSS via CDN to avoid hydration issues
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        document.head.appendChild(link);
      }

      // Load Leaflet JS
      if (!L) {
        import("leaflet").then((leaflet) => {
          L = leaflet.default;
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
            iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          });
          setMapReady(true);
        });
      } else {
        setMapReady(true);
      }
      
      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, []);

  // Fetch destinations data only after hydration
  useEffect(() => {
    if (!mounted) return; // Wait for hydration

    const fetchDestinations = async () => {
      setLoading(true);
      const destinationsData: Destination[] = [];

      for (let i = 0; i < destinationIds.length; i++) {
        const destId = destinationIds[i];
        const nameQuery = destinationQueries[i].name;
        const poolQuery = destinationQueries[i].pool;

        if (nameQuery.isLoading || poolQuery.isLoading) {
          continue;
        }

        const name = nameQuery.data as string;
        const pool = poolQuery.data as bigint;

        if (name && name.trim() !== "") {
          const poolAmount = pool || BigInt(0);
          const staticData = destinationsById[destId.toString()];

          if (staticData) {
            const destination: Destination = {
              id: destId.toString(),
              name,
              description: staticData.description,
              image: staticData.image,
              coordinates: staticData.coordinates,
              difficulty: staticData.difficulty as "Easy" | "Medium" | "Hard",
              rewardPool: poolAmount ? parseFloat(formatEther(poolAmount)) : 0,
              participants: Math.floor(Math.random() * 30) + 5,
              estimatedTime: staticData.estimatedTime,
              tags: staticData.tags,
            };
            
            destinationsData.push(destination);
          }
        }
      }

      setDestinations(destinationsData);
      setLoading(false);
    };

    const allQueriesReady = destinationQueries.every(
      (queries) => !queries.name.isLoading && !queries.pool.isLoading
    );

    if (allQueriesReady) {
      fetchDestinations();
    }
  }, [
    mounted,
    destinationQueries.map(q => `${q.name.isLoading}-${q.pool.isLoading}`).join(",")
  ]);

  // Process commitment data
  const commitment = commitmentData as 
    | { destinationId: bigint; amountInPool: bigint; isProcessed: boolean }
    | undefined;

  const isAnyQuestStaked = commitment && commitment.amountInPool > BigInt(0) && !commitment.isProcessed;
  const activeQuestId = isAnyQuestStaked ? commitment.destinationId.toString() : null;

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case "Easy": return "text-[#00D4FF] border-[#00D4FF]";
      case "Medium": return "text-[#FF9500] border-[#FF9500]";
      case "Hard": return "text-[#FF4D94] border-[#FF4D94]";
      default: return "text-[#666666] border-[#666666]";
    }
  };

  const getStatusBadge = (destination: Destination): JSX.Element => {
    if (activeQuestId === destination.id) {
      return <Badge className="bg-[#FF4D94] text-white font-pixel">Active Quest</Badge>;
    }
    return <Badge className="bg-[#000000] text-[#00D4FF] border border-[#333333] font-pixel">Available</Badge>;
  };

  const filteredDestinations = filterDifficulty === "all"
    ? destinations
    : destinations.filter(dest => dest.difficulty === filterDifficulty);

  const mapCenter: [number, number] = [23, 78];

  // Prevent hydration mismatch - show loading until fully mounted and ready
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#000000] p-6 flex items-center justify-center">
        <div className="text-[#00D4FF] font-pixel text-xl">Loading destinations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] p-6">
      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
          <div>
            <h1 className="font-pixel text-4xl text-[#00D4FF]">Explore Destinations</h1>
            <p className="text-[#FFFFFF] mt-2">Discover amazing places and start your adventure</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Difficulty Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-[#FFFFFF]">Difficulty:</span>
              <div className="flex bg-[#000000] rounded-lg p-1 border border-[#333333]">
                {(["all", "Easy", "Medium", "Hard"] as const).map((level) => (
                  <Button
                    key={level}
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterDifficulty(level)}
                    className={`capitalize font-pixel ${
                      filterDifficulty === level
                        ? "bg-[#00D4FF] text-black hover:bg-[#00B7E6]"
                        : "text-[#FFFFFF] hover:text-[#00D4FF] hover:bg-[#000000]"
                    }`}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-[#FFFFFF]">View:</span>
              <div className="flex bg-[#000000] rounded-lg p-1 border border-[#333333]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className={
                    viewMode === "map"
                      ? "bg-[#00D4FF] text-black hover:bg-[#00B7E6] font-pixel"
                      : "text-[#FFFFFF] hover:text-[#00D4FF] hover:bg-[#000000] font-pixel"
                  }
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Map
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={
                    viewMode === "list"
                      ? "bg-[#00D4FF] text-black hover:bg-[#00B7E6] font-pixel"
                      : "text-[#FFFFFF] hover:text-[#00D4FF] hover:bg-[#000000] font-pixel"
                  }
                >
                  Grid
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Map View - Only render when fully ready to prevent hydration issues */}
        {viewMode === "map" && mapReady && (
          <div 
            className="relative bg-[#000000] border border-[#333333] rounded-lg overflow-hidden h-[650px]"
            style={{ zIndex: 1 }}
          >
            <MapContainer 
              center={mapCenter} 
              zoom={5} 
              style={{ height: "100%", width: "100%", zIndex: 1 }}
            >
              <MapStyle />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {filteredDestinations.map((destination) => {
                const icon = createCustomIcon(
                  destination.difficulty,
                  isAnyQuestStaked && activeQuestId !== destination.id,
                  activeQuestId === destination.id
                );

                if (!icon) return null;

                return (
                  <Marker
                    key={destination.id}
                    position={[destination.coordinates.lat, destination.coordinates.lng]}
                    icon={icon}
                    eventHandlers={{
                      click: () => {
                        if (!isAnyQuestStaked || activeQuestId === destination.id) {
                          setSelectedDestinationId(destination.id);
                        }
                      },
                    }}
                  >
                    <Popup>
                      <div className="p-3 bg-[#000000] text-[#FFFFFF]">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-pixel text-lg text-[#00D4FF]">{destination.name}</h3>
                          {getStatusBadge(destination)}
                        </div>
                        <p className="text-sm text-[#FFFFFF] mb-3">{destination.description}</p>
                        <div className="flex items-center justify-between text-xs mb-3">
                          <div className="flex items-center space-x-2">
                            <Trophy className="w-3 h-3 text-[#FF9500]" />
                            <span className="text-[#FF9500] font-bold">{destination.rewardPool} TMON Pool</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="w-3 h-3 text-[#FFFFFF]" />
                            <span className="text-[#FFFFFF]">{destination.participants}</span>
                          </div>
                        </div>
                        {activeQuestId === destination.id ? (
                          <Button size="sm" className="w-full bg-[#00D4FF] text-black hover:bg-[#00B7E6] font-pixel">
                            View Quest
                          </Button>
                        ) : isAnyQuestStaked ? (
                          <Button disabled size="sm" className="w-full bg-[#333333] text-[#666666] cursor-not-allowed font-pixel">
                            Quest Active
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full bg-[#00D4FF] text-black hover:bg-[#00B7E6] font-pixel"
                            onClick={() => setSelectedDestinationId(destination.id)}
                          >
                            Start Quest
                          </Button>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        )}

        {/* Loading state for map */}
        {viewMode === "map" && !mapReady && (
          <div className="relative bg-[#000000] border border-[#333333] rounded-lg overflow-hidden h-[650px] flex items-center justify-center">
            <div className="text-[#00D4FF] font-pixel text-xl">Loading map...</div>
          </div>
        )}

        {/* Grid View */}
        {viewMode === "list" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDestinations.map((destination) => (
              <Card
                key={destination.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 border-[#333333] bg-[#000000] ${
                  isAnyQuestStaked && activeQuestId !== destination.id
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={() => {
                  if (!isAnyQuestStaked || activeQuestId === destination.id) {
                    setSelectedDestinationId(destination.id);
                  }
                }}
              >
                <CardHeader className="p-0">
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <Image src={destination.image} alt={destination.name} fill className="object-cover" />
                    <div className="absolute top-3 right-3">{getStatusBadge(destination)}</div>
                    <div className="absolute top-3 left-3">
                      <Badge className={`${getDifficultyColor(destination.difficulty)} bg-[#000000] border font-pixel`}>
                        {destination.difficulty}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4">
                  <CardTitle className="font-pixel text-lg mb-2 text-[#FFFFFF]">{destination.name}</CardTitle>
                  <p className="text-sm text-[#FFFFFF] mb-4 line-clamp-2">{destination.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {destination.tags?.slice(0, 3).map((tag, index) => (
                      <Badge key={index} className="bg-[#000000] text-[#FFFFFF] border border-[#333333] text-xs px-2 py-0 font-pixel">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center space-x-1">
                      <Trophy className="w-4 h-4 text-[#FF9500]" />
                      <span className="text-[#FF9500] font-bold font-pixel">{destination.rewardPool} TMON</span>
                    </div>
                    <div className="flex items-center space-x-1 text-[#FFFFFF]">
                      <Users className="w-4 h-4" />
                      <span className="font-pixel">{destination.participants}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-[#FFFFFF]">
                      <Clock className="w-4 h-4" />
                      <span className="font-pixel text-sm">{destination.estimatedTime}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {activeQuestId === destination.id ? (
                    <Button className="w-full bg-[#00D4FF] text-black hover:bg-[#00B7E6] font-pixel">
                      View Quest
                    </Button>
                  ) : isAnyQuestStaked ? (
                    <Button disabled className="w-full bg-[#333333] text-[#666666] cursor-not-allowed font-pixel">
                      Quest Active
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-[#00D4FF] text-black hover:bg-[#00B7E6] font-pixel"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDestinationId(destination.id);
                      }}
                    >
                      Start Quest
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Fixed Modal with proper z-index positioning */}
        {selectedDestinationId && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm" 
              onClick={() => setSelectedDestinationId(null)} 
            />
            <div className="relative z-[10000] max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <StakingModal
                destinationId={selectedDestinationId}
                onClose={() => setSelectedDestinationId(null)}
                onAcceptQuest={(amount: number) => {
                  console.log(`Accepted quest for destination ${selectedDestinationId} with ${amount} TMON`);
                  setSelectedDestinationId(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
