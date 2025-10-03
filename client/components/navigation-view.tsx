"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Target,
  MapPin,
  Loader2,
  Trophy,
  Sword,
} from "lucide-react";
import { useWanderfy } from "@/contexts/wanderify-context";
import dynamic from "next/dynamic";
import { useAccount, useWriteContract } from "wagmi";
import { useWanderifyContract } from "@/lib/contract";

let L: any = null;

// Dynamic imports with proper loading states
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-cyan-400">
        Loading map...
      </div>
    ),
  }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false }
);

const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);

interface Destination {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  coordinates: { lat: number; lng: number };
  xpReward?: number;
}

interface NavigationViewProps {
  destination: Destination;
  onClose: () => void;
}

interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  heading?: number;
  speed?: number;
}

// Distance calculation using Haversine formula
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Create user avatar icon
const createUserIcon = (heading?: number): L.DivIcon | null => {
  if (typeof window === "undefined" || !L) return null;
  
  const rotationStyle = heading !== undefined ? `transform: rotate(${heading}deg);` : "";
  const directionIndicator = heading !== undefined 
    ? `<div class="absolute -top-1 left-1/2 transform -translate-x-1/2">
         <div class="w-0 h-0 border-l-2 border-r-2 border-b-3 border-transparent border-b-yellow-400"></div>
       </div>`
    : "";

  return L.divIcon({
    html: `
      <div class="relative">
        <div class="absolute inset-0 w-12 h-12 bg-cyan-400 rounded-full animate-ping opacity-40"></div>
        <div class="relative w-12 h-12 bg-cyan-400 rounded-full border-2 border-white shadow-lg flex items-center justify-center overflow-hidden" style="${rotationStyle}">
          <div class="w-10 h-10 relative">
            <div class="absolute top-0 left-1/2 transform -translate-x-1/2 w-7 h-7 bg-orange-400 rounded-full border border-orange-600 shadow-inner">
              <div class="absolute top-1.5 left-1 w-1 h-1 bg-black rounded-full"></div>
              <div class="absolute top-1.5 right-1 w-1 h-1 bg-black rounded-full"></div>
              <div class="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-1 border-b border-black rounded-full"></div>
              <div class="absolute top-0.5 left-1 w-2 h-2 bg-orange-200 rounded-full opacity-60"></div>
            </div>
            <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-5 h-4 bg-green-500 rounded border border-green-700 shadow-inner">
              <div class="absolute top-0 left-0.5 w-2 h-1.5 bg-green-300 rounded opacity-60"></div>
            </div>
          </div>
          ${directionIndicator}
        </div>
        <div class="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-black text-cyan-400 text-xs px-1 py-0.5 rounded border border-cyan-400 font-mono whitespace-nowrap">
          PLAYER
        </div>
      </div>
    `,
    className: "user-location-marker",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

// Create destination marker icon - UPDATED for 100m check-in
const createDestinationIcon = (distance: number): L.DivIcon | null => {
  if (typeof window === "undefined" || !L) return null;
  
  let bgColor = "#dc2626"; // red
  let status = "FAR";
  let statusIcon = "🔴";
  
  // UPDATED: Check-in available at 100m instead of 50m
  if (distance <= 100) {
    bgColor = "#16a34a"; // green
    status = "READY";
    statusIcon = "✅";
  } else if (distance <= 200) {
    bgColor = "#ea580c"; // orange
    status = "CLOSE";
    statusIcon = "🟡";
  } else if (distance <= 500) {
    bgColor = "#2563eb"; // blue
    status = "NEAR";
    statusIcon = "🔵";
  }

  return L.divIcon({
    html: `
      <div class="relative">
        <div class="w-14 h-14 rounded-full border-2 border-white shadow-lg flex items-center justify-center relative overflow-hidden" style="background-color: ${bgColor}">
          <div class="relative">
            <div class="w-6 h-8 mx-auto rounded-t border border-yellow-600 relative" style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)">
              <div class="absolute top-0.5 left-0.5 w-0.5 h-4 bg-yellow-600 rounded"></div>
              <div class="absolute top-0.5 right-0.5 w-0.5 h-4 bg-yellow-600 rounded"></div>
              <div class="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              <div class="absolute top-0 left-0 w-2 h-3 bg-yellow-200 rounded opacity-50"></div>
            </div>
            <div class="w-7 h-2 rounded border border-yellow-600" style="background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%)">
              <div class="w-2 h-1 bg-yellow-200 rounded opacity-60"></div>
            </div>
          </div>
        </div>
        <div class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded border border-cyan-400 text-xs font-mono">
          <div class="text-center whitespace-nowrap">
            <div class="text-cyan-400 font-bold">${Math.round(distance)}m</div>
            <div class="text-white">${statusIcon} ${status}</div>
          </div>
        </div>
      </div>
    `,
    className: "destination-marker",
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
};

// Real-time location tracker component
function RealTimeLocationTracker({
  destination,
  onLocationUpdate,
  onError,
}: {
  destination: Destination;
  onLocationUpdate: (location: UserLocation) => void;
  onError: (error: string) => void;
}): null {
  const { useMap } = require("react-leaflet");
  const map = useMap();
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !map) return;

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 1000,
    };

    const startTracking = () => {
      if (!navigator.geolocation) {
        onError("GPS not available");
        return;
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const location: UserLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy || 10,
            timestamp: position.timestamp,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
          };
          
          onLocationUpdate(location);
          onError("");

          // Auto-center map to show both user and destination
          const userLat = location.lat;
          const userLng = location.lng;
          const destLat = destination.coordinates?.lat;
          const destLng = destination.coordinates?.lng;

          if (userLat && userLng && destLat && destLng && L) {
            const bounds = L.latLngBounds([
              [userLat, userLng],
              [destLat, destLng],
            ]);
            map.fitBounds(bounds, {
              padding: [60, 60],
              maxZoom: 16,
              animate: true,
              duration: 1.0,
            });
          }
        },
        (error) => {
          onError(error.message);
        },
        options
      );
    };

    startTracking();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [map, destination.coordinates?.lat, destination.coordinates?.lng, onLocationUpdate, onError]);

  return null;
}

// Dark map styling component
function DarkMapStyle(): null {
  const { useMap } = require("react-leaflet");
  const map = useMap();
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (styleRef.current) return;

    const style = document.createElement("style");
    style.textContent = `
      .leaflet-container {
        background: #000000 !important;
        font-family: 'Courier New', monospace !important;
      }
      .leaflet-tile {
        filter: brightness(0.6) contrast(1.2) !important;
      }
      .leaflet-control {
        background: #1a1a1a !important;
        border: 1px solid #06b6d4 !important;
        border-radius: 4px !important;
      }
      .leaflet-control-zoom a {
        background: #06b6d4 !important;
        color: #000000 !important;
        font-weight: bold !important;
        border-radius: 2px !important;
        margin: 1px !important;
      }
      .leaflet-control-zoom a:hover {
        background: #0891b2 !important;
      }
      .leaflet-popup-content-wrapper {
        background: #000000 !important;
        border: 1px solid #06b6d4 !important;
        border-radius: 4px !important;
        color: #ffffff !important;
      }
      .leaflet-popup-tip {
        background: #000000 !important;
        border: 1px solid #06b6d4 !important;
      }
      .leaflet-control-attribution {
        background: rgba(0, 0, 0, 0.8) !important;
        border: 1px solid #06b6d4 !important;
        color: #06b6d4 !important;
        font-family: 'Courier New', monospace !important;
        font-size: 10px !important;
      }
      .leaflet-control-attribution a {
        color: #06b6d4 !important;
      }
    `;
    
    document.head.appendChild(style);
    styleRef.current = style;

    return () => {
      if (styleRef.current && document.head.contains(styleRef.current)) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, [map]);

  return null;
}

// Map wrapper component - UPDATED for 100m check-in
function MapWrapper({
  userLocation,
  destination,
  distanceToTarget,
  setUserLocation,
  setLocationError,
  isInRange,
}: {
  userLocation: UserLocation;
  destination: Destination;
  distanceToTarget: number;
  setUserLocation: (location: UserLocation) => void;
  setLocationError: (error: string) => void;
  isInRange: boolean;
}) {
  const mapKey = `map-${destination.id}`;

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        key={mapKey}
        center={[userLocation.lat, userLocation.lng]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <DarkMapStyle />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <RealTimeLocationTracker
          destination={destination}
          onLocationUpdate={setUserLocation}
          onError={setLocationError}
        />

        {/* User marker */}
        {createUserIcon(userLocation.heading) && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={createUserIcon(userLocation.heading)!}
          >
            <Popup>
              <div className="p-3 text-center font-mono">
                <p className="text-cyan-400 font-bold mb-2">YOUR LOCATION</p>
                <p className="text-sm text-white">
                  Accuracy: ±{Math.round(userLocation.accuracy)}m
                </p>
                {userLocation.speed && (
                  <p className="text-sm text-white">
                    Speed: {Math.round(userLocation.speed * 3.6)} km/h
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Accuracy circle */}
        <Circle
          center={[userLocation.lat, userLocation.lng]}
          radius={Math.min(userLocation.accuracy, 50)}
          pathOptions={{
            color: "#06b6d4",
            fillColor: "#06b6d4",
            fillOpacity: 0.2,
            weight: 2,
          }}
        />

        {/* Destination marker */}
        {createDestinationIcon(distanceToTarget) && destination.coordinates && (
          <Marker
            position={[destination.coordinates.lat, destination.coordinates.lng]}
            icon={createDestinationIcon(distanceToTarget)!}
          >
            <Popup>
              <div className="p-4 text-center font-mono">
                <h3 className="text-cyan-400 font-bold text-lg mb-2">
                  {destination.name}
                </h3>
                <p className="text-sm text-white mb-3">
                  {destination.description}
                </p>
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <Badge className="bg-orange-600 text-black font-bold text-xs">
                    {destination.difficulty}
                  </Badge>
                  <div className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                    +{destination.xpReward || 100}XP
                  </div>
                </div>
                <p className="text-cyan-400 font-bold">
                  Distance:{" "}
                  {distanceToTarget < 1000
                    ? `${Math.round(distanceToTarget)}m`
                    : `${(distanceToTarget / 1000).toFixed(1)}km`}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Path line */}
        {destination.coordinates && (
          <Polyline
            positions={[
              [userLocation.lat, userLocation.lng],
              [destination.coordinates.lat, destination.coordinates.lng],
            ]}
            pathOptions={{
              color: "#06b6d4",
              weight: 3,
              opacity: 1,
            }}
          />
        )}

        {/* UPDATED: Check-in zone (100m instead of 50m) */}
        {destination.coordinates && (
          <Circle
            center={[destination.coordinates.lat, destination.coordinates.lng]}
            radius={100}
            pathOptions={{
              color: isInRange ? "#16a34a" : "#dc2626",
              fillColor: isInRange ? "#16a34a" : "#dc2626",
              fillOpacity: isInRange ? 0.3 : 0.1,
              weight: 3,
            }}
          />
        )}

        {/* UPDATED: Approach zone (200m instead of 100m) */}
        {destination.coordinates && (
          <Circle
            center={[destination.coordinates.lat, destination.coordinates.lng]}
            radius={200}
            pathOptions={{
              color: "#ea580c",
              fillColor: "transparent",
              weight: 2,
              opacity: 0.8,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default function NavigationView({
  destination,
  onClose,
}: NavigationViewProps) {
  const { completeQuest } = useWanderfy();
  const { address } = useAccount();
  const contract = useWanderifyContract();
  const { writeContract } = useWriteContract();

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [distanceToTarget, setDistanceToTarget] = useState<number>(Infinity);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  const linkRef = useRef<HTMLLinkElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);

    if (typeof window !== "undefined") {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        link.crossOrigin = "";
        document.head.appendChild(link);
        linkRef.current = link;
      }

      if (!L) {
        import("leaflet")
          .then((leaflet) => {
            L = leaflet.default;
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
              iconRetinaUrl:
                "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
              iconUrl:
                "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
              shadowUrl:
                "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
            });
            setMapReady(true);
          })
          .catch((error) => {
            console.error("Failed to load Leaflet:", error);
            setLocationError("Failed to load map library");
          });
      } else {
        setMapReady(true);
      }
    }

    requestLocation();

    return () => {
      if (linkRef.current && document.head.contains(linkRef.current)) {
        document.head.removeChild(linkRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (userLocation && destination.coordinates) {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        destination.coordinates.lat,
        destination.coordinates.lng
      );
      setDistanceToTarget(distance);
    }
  }, [userLocation, destination.coordinates]);

  const requestLocation = useCallback(() => {
    setIsRequestingLocation(true);
    setLocationError("");
    
    if (!navigator.geolocation) {
      setLocationError("GPS not supported");
      setIsRequestingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy || 10,
          timestamp: position.timestamp,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
        };
        setUserLocation(location);
        setIsRequestingLocation(false);
      },
      (error) => {
        setLocationError(error.message);
        setIsRequestingLocation(false);
        // Fallback location for testing
        setUserLocation({
          lat: 12.9716,
          lng: 77.5946,
          accuracy: 1000,
          timestamp: Date.now(),
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // UPDATED: Handle check-in with 100m range
  const handleCheckIn = async () => {
    if (distanceToTarget > 100) return; // Changed from 50m to 100m
    if (!address) {
      setLocationError("Please connect your wallet");
      return;
    }
    if (!userLocation) {
      setLocationError("GPS location not available");
      return;
    }

    setCheckingIn(true);
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "https://wandryfi-monad-hack.onrender.com/api/verify/";

    try {
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "7987",
        },
        body: JSON.stringify({
          walletAddress: address,
          destinationId: destination.id,
          userLat: userLocation.lat,
          userLon: userLocation.lng,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Verification failed");
      }

      const { signature } = await response.json();

      await writeContract({
        ...contract,
        functionName: "checkIn",
        args: [signature],
      });

      completeQuest(destination.id);
      setIsCheckedIn(true);

      timeoutRef.current = setTimeout(() => {
        setCheckingIn(false);
        setIsCheckedIn(false);
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Check-in failed:", error);
      setLocationError(
        error instanceof Error ? error.message : "Check-in failed"
      );
      setCheckingIn(false);
    }
  };

  // UPDATED: Range calculations for 100m check-in
  const isInRange = distanceToTarget <= 100; // Changed from 50m to 100m
  const isClose = distanceToTarget <= 200;   // Changed from 100m to 200m
  const isNearby = distanceToTarget <= 500;

  if (!mounted) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <Sword className="w-full h-full text-cyan-400 animate-spin" />
          </div>
          <p className="text-cyan-400 text-2xl font-mono font-bold">
            LOADING QUEST
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black font-mono">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-black border-b border-cyan-400 h-16">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center space-x-4">
            <h1 className="font-bold text-xl text-cyan-400">
              QUEST: {destination.name}
            </h1>
            <Badge className="bg-orange-600 text-black font-bold px-3 py-1 text-xs">
              {destination.difficulty.toUpperCase()}
            </Badge>
            {userLocation && (
              <div className="flex items-center space-x-2 text-xs bg-zinc-900 border border-cyan-400 rounded px-3 py-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-cyan-400 font-bold">GPS</span>
                <span className="text-white">
                  ±{Math.round(userLocation.accuracy)}m
                </span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-cyan-400 hover:text-white hover:bg-zinc-900 border border-cyan-400 font-bold"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      {userLocation && (
        <div className="fixed top-16 left-0 right-0 z-20 bg-black border-b border-cyan-400 p-4">
          <div
            className={`rounded border p-4 ${
              isInRange
                ? "bg-green-900 border-green-500"
                : isClose
                ? "bg-orange-900 border-orange-500"
                : isNearby
                ? "bg-blue-900 border-blue-500"
                : "bg-red-900 border-red-500"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Target
                  className={`w-6 h-6 ${
                    isInRange
                      ? "text-green-400"
                      : isClose
                      ? "text-orange-400"
                      : isNearby
                      ? "text-blue-400"
                      : "text-red-400"
                  }`}
                />
                <div>
                  <p
                    className={`font-bold text-lg ${
                      isInRange
                        ? "text-green-400"
                        : isClose
                        ? "text-orange-400"
                        : isNearby
                        ? "text-blue-400"
                        : "text-red-400"
                    }`}
                  >
                    {distanceToTarget < 1000
                      ? `${Math.round(distanceToTarget)}m AWAY`
                      : `${(distanceToTarget / 1000).toFixed(2)}km AWAY`}
                  </p>
                  <p className="text-sm text-white font-bold">
                    {isInRange
                      ? "CHECK-IN AVAILABLE"
                      : isClose
                      ? "ALMOST THERE"
                      : isNearby
                      ? "APPROACHING"
                      : "NAVIGATE TO TARGET"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-yellow-500 text-black px-3 py-1 rounded font-bold text-sm">
                  +{destination.xpReward || 100}XP
                </div>
                <p className="text-xs text-white mt-1 font-bold">REWARD</p>
              </div>
            </div>
            <div className="w-full bg-black rounded h-3 border border-cyan-400">
              <div
                className={`h-full rounded transition-all duration-500 ${
                  isInRange
                    ? "bg-green-500"
                    : isClose
                    ? "bg-orange-500"
                    : isNearby
                    ? "bg-blue-500"
                    : "bg-red-500"
                }`}
                style={{
                  width: `${Math.max(
                    5,
                    Math.min(100, (1000 - distanceToTarget) / 10)
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 ${
          userLocation ? "top-40" : "top-16"
        } bottom-0 w-80 bg-black border-r border-cyan-400 overflow-y-auto z-10`}
      >
        <div className="p-4">
          <div className="mb-6">
            <h2 className="font-bold text-xl text-cyan-400 mb-3">
              QUEST DETAILS
            </h2>
            <div className="bg-zinc-900 rounded border border-cyan-400 p-4">
              <h3 className="font-bold text-lg text-white mb-2">
                {destination.name}
              </h3>
              <p className="text-sm text-white mb-3">
                {destination.description}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-cyan-400 font-bold text-sm">
                    DIFFICULTY:
                  </span>
                  <Badge className="bg-orange-600 text-black font-bold text-xs">
                    {destination.difficulty.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-cyan-400 font-bold text-sm">
                    XP REWARD:
                  </span>
                  <span className="text-yellow-500 font-bold">
                    +{destination.xpReward || 100}XP
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-cyan-400 font-bold text-sm">
                    CHECK-IN RANGE:
                  </span>
                  <span className="text-green-400 font-bold">
                    100m
                  </span>
                </div>
                {userLocation && (
                  <div className="flex justify-between items-center">
                    <span className="text-cyan-400 font-bold text-sm">
                      DISTANCE:
                    </span>
                    <span className="text-white font-bold">
                      {distanceToTarget < 1000
                        ? `${Math.round(distanceToTarget)}m`
                        : `${(distanceToTarget / 1000).toFixed(2)}km`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Check-in Button */}
          {isInRange && (
            <div className="mb-6">
              <Button
                onClick={handleCheckIn}
                disabled={checkingIn}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
              >
                {checkingIn ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    CHECKING IN...
                  </>
                ) : (
                  <>
                    <Trophy className="w-5 h-5 mr-2" />
                    COMPLETE QUEST
                  </>
                )}
              </Button>
            </div>
          )}

          {/* GPS Status */}
          {!userLocation && (
            <div className="bg-orange-900 border border-orange-500 rounded p-4">
              <p className="text-orange-400 font-bold text-sm mb-3">
                GPS REQUIRED
              </p>
              <Button
                onClick={requestLocation}
                disabled={isRequestingLocation}
                className="w-full bg-cyan-400 text-black font-bold"
              >
                {isRequestingLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ACTIVATING...
                  </>
                ) : (
                  "ACTIVATE GPS"
                )}
              </Button>
            </div>
          )}

          {locationError && (
            <div className="mt-4 bg-red-900 border border-red-500 rounded p-4">
              <p className="text-red-400 font-bold text-sm">{locationError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Map View */}
      <div
        className={`fixed left-80 ${
          userLocation ? "top-40" : "top-16"
        } right-0 bottom-0 z-0`}
      >
        {userLocation && mapReady ? (
          <MapWrapper
            userLocation={userLocation}
            destination={destination}
            distanceToTarget={distanceToTarget}
            setUserLocation={setUserLocation}
            setLocationError={setLocationError}
            isInRange={isInRange}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-black">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <p className="text-cyan-400 text-2xl font-bold mb-2">
                QUEST AWAITS
              </p>
              <p className="text-white text-lg font-bold mb-6">
                {!userLocation ? "Activate GPS to begin" : "Loading map..."}
              </p>
              {!userLocation && (
                <Button
                  onClick={requestLocation}
                  disabled={isRequestingLocation}
                  size="lg"
                  className="bg-cyan-400 text-black font-bold px-6 py-3"
                >
                  {isRequestingLocation ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      INITIALIZING...
                    </>
                  ) : (
                    "START QUEST"
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {isCheckedIn && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <Card className="bg-green-900 border-2 border-green-500 max-w-lg mx-4">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="font-bold text-2xl text-green-400 mb-3">
                QUEST COMPLETED!
              </h2>
              <p className="text-green-300 font-bold text-lg mb-4">
                {destination.name} Conquered!
              </p>
              <div className="bg-yellow-500 text-black px-4 py-2 rounded font-bold text-lg mb-4">
                +{destination.xpReward || 100}XP EARNED!
              </div>
              <div className="text-sm text-white mt-4 font-bold">
                Returning in 3 seconds...
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
