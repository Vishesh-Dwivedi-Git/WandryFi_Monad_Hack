"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { JSX } from "react/jsx-runtime";
import { useAccount, useReadContract } from "wagmi";
import { useWanderifyContract } from "@/lib/contract";
import { formatEther, zeroAddress } from "viem";
import { destinationsById } from "@/lib/destinations";
import { Skeleton } from "@/components/ui/skeleton";

interface Destination {
  id: string;
  name: string;
  image: string;
  rewardPool: number;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  coordinates: { lat: number; lng: number };
  participants?: number;
  estimatedTime?: string;
  tags?: string[];
}

const MIN_STAKE_DURATION_SECS = 15 * 24 * 60 * 60; // must match MIN_STAKE_DURATION

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case "common":
      return "border-green-400 bg-green-400/10";
    case "rare":
      return "border-neon-gold bg-neon-gold/10";
    case "legendary":
      return "border-neon-magenta bg-neon-magenta/10";
    default:
      return "border-border bg-muted/10";
  }
};

const getPixelIcon = (icon: string) => {
  const iconMap: Record<string, JSX.Element> = {
    waterfall: (
      <svg viewBox="0 0 32 32" className="w-full h-full">
        <rect
          x="12"
          y="4"
          width="8"
          height="24"
          fill="currentColor"
          className="text-blue-400"
        />
        <rect
          x="8"
          y="8"
          width="4"
          height="16"
          fill="currentColor"
          className="text-blue-300"
        />
        <rect
          x="20"
          y="8"
          width="4"
          height="16"
          fill="currentColor"
          className="text-blue-300"
        />
        <rect
          x="4"
          y="24"
          width="24"
          height="4"
          fill="currentColor"
          className="text-blue-500"
        />
      </svg>
    ),
    temple: (
      <svg viewBox="0 0 32 32" className="w-full h-full">
        <rect
          x="4"
          y="20"
          width="24"
          height="8"
          fill="currentColor"
          className="text-neon-gold"
        />
        <rect
          x="8"
          y="12"
          width="16"
          height="8"
          fill="currentColor"
          className="text-neon-gold"
        />
        <rect
          x="12"
          y="4"
          width="8"
          height="8"
          fill="currentColor"
          className="text-neon-gold"
        />
        <rect
          x="14"
          y="2"
          width="4"
          height="2"
          fill="currentColor"
          className="text-neon-gold"
        />
      </svg>
    ),
    coral: (
      <svg viewBox="0 0 32 32" className="w-full h-full">
        <rect
          x="8"
          y="16"
          width="4"
          height="12"
          fill="currentColor"
          className="text-pink-400"
        />
        <rect
          x="20"
          y="12"
          width="4"
          height="16"
          fill="currentColor"
          className="text-orange-400"
        />
        <rect
          x="14"
          y="8"
          width="4"
          height="20"
          fill="currentColor"
          className="text-red-400"
        />
        <rect
          x="4"
          y="24"
          width="24"
          height="4"
          fill="currentColor"
          className="text-blue-400"
        />
      </svg>
    ),
    ruins: (
      <svg viewBox="0 0 32 32" className="w-full h-full">
        <rect
          x="4"
          y="20"
          width="6"
          height="8"
          fill="currentColor"
          className="text-gray-400"
        />
        <rect
          x="12"
          y="16"
          width="8"
          height="12"
          fill="currentColor"
          className="text-gray-400"
        />
        <rect
          x="22"
          y="18"
          width="6"
          height="10"
          fill="currentColor"
          className="text-gray-400"
        />
        <rect
          x="8"
          y="12"
          width="4"
          height="4"
          fill="currentColor"
          className="text-gray-300"
        />
      </svg>
    ),
    snowflake: (
      <svg viewBox="0 0 32 32" className="w-full h-full">
        <rect
          x="14"
          y="4"
          width="4"
          height="24"
          fill="currentColor"
          className="text-blue-200"
        />
        <rect
          x="4"
          y="14"
          width="24"
          height="4"
          fill="currentColor"
          className="text-blue-200"
        />
        <rect
          x="8"
          y="8"
          width="16"
          height="2"
          fill="currentColor"
          className="text-blue-200"
          transform="rotate(45 16 16)"
        />
        <rect
          x="8"
          y="22"
          width="16"
          height="2"
          fill="currentColor"
          className="text-blue-200"
          transform="rotate(-45 16 16)"
        />
      </svg>
    ),
    volcano: (
      <svg viewBox="0 0 32 32" className="w-full h-full">
        <rect
          x="8"
          y="16"
          width="16"
          height="12"
          fill="currentColor"
          className="text-red-600"
        />
        <rect
          x="12"
          y="8"
          width="8"
          height="8"
          fill="currentColor"
          className="text-red-500"
        />
        <rect
          x="14"
          y="4"
          width="4"
          height="4"
          fill="currentColor"
          className="text-orange-400"
        />
        <rect
          x="16"
          y="2"
          width="2"
          height="2"
          fill="currentColor"
          className="text-yellow-400"
        />
      </svg>
    ),
  };
  return iconMap[icon] || iconMap.ruins;
};

const TrophyCard = ({ tokenId }: { tokenId: bigint }) => {
  const contract = useWanderifyContract();
  const isValidContract =
    !!contract.address && contract.address !== zeroAddress;

  const { data: nftDetailsData, isLoading: isLoadingDetails } = useReadContract(
    {
      ...contract,
      functionName: "getJourneyNFTDetails",
      args: [tokenId],
      query: { enabled: isValidContract },
    }
  );
  // Support both named struct object and tuple array returns
  const nftDetails = (() => {
    if (!nftDetailsData) return undefined;
    const d: any = nftDetailsData as any;
    const destinationName: string | undefined = d?.destinationName ?? d?.[4];
    const rawCompletion = d?.completionDate ?? d?.[1];
    const completionDate: bigint | undefined =
      typeof rawCompletion === "bigint"
        ? rawCompletion
        : rawCompletion != null
        ? BigInt(rawCompletion)
        : undefined;
    if (!destinationName || completionDate == null) return undefined;
    return { destinationName, completionDate } as {
      destinationName: string;
      completionDate: bigint;
    };
  })();

  const { data: tokenUriData, isLoading: isLoadingUri } = useReadContract({
    ...contract,
    functionName: "tokenURI",
    args: [tokenId],
    query: { enabled: isValidContract },
  });
  const tokenUri = tokenUriData as string | undefined;

  const [metadata, setMetadata] = useState<{
    name: string;
    image: string;
    description: string;
    attributes: { trait_type: string; value: string }[];
  } | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!tokenUri) {
        if (!isLoadingUri) setIsLoadingMetadata(false);
        return;
      }
      try {
        // Handle ipfs:// and data:application/json;base64 URIs
        if (tokenUri.startsWith("ipfs://")) {
          const url = tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/");
          const res = await fetch(url);
          const data = await res.json();
          setMetadata(data);
        } else if (tokenUri.startsWith("data:application/json;base64,")) {
          const b64 = tokenUri.split(",", 2)[1] || "";
          const json = JSON.parse(atob(b64));
          setMetadata(json);
        } else if (tokenUri.startsWith("data:application/json,")) {
          const json = JSON.parse(tokenUri.split(",", 2)[1] || "{}");
          setMetadata(json);
        } else {
          const res = await fetch(tokenUri);
          const data = await res.json();
          setMetadata(data);
        }
      } catch (e) {
        console.error("Failed to load token metadata:", e);
      } finally {
        setIsLoadingMetadata(false);
      }
    };
    load();
  }, [tokenUri, isLoadingUri]);

  if (isLoadingDetails || isLoadingMetadata) {
    return <Skeleton className="aspect-square rounded-lg" />;
  }

  if (!nftDetails) return null;

  const rarity =
    metadata?.attributes
      ?.find((a) => a.trait_type === "Rarity")
      ?.value?.toLowerCase() || "common";
  const icon =
    metadata?.attributes
      ?.find((a) => a.trait_type === "Icon")
      ?.value?.toLowerCase() || "ruins";

  return (
    <div
      className={cn(
        "aspect-square rounded-lg border-2 p-4 flex flex-col items-center justify-center group hover:scale-105 transition-all duration-300",
        getRarityColor(rarity)
      )}
    >
      <div className="w-12 h-12 mb-2">
        {metadata?.image ? (
          <img
            src={metadata.image}
            alt={nftDetails.destinationName}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          getPixelIcon(icon)
        )}
      </div>
      <div className="text-center">
        <p className="font-pixel text-xs text-foreground mb-1 line-clamp-2">
          {nftDetails.destinationName}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(
            Number(nftDetails.completionDate) * 1000
          ).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

interface MyTravelPageProps {
  onNavigationView: (show: boolean, destination?: Destination) => void;
}

const MyTravelPage = ({ onNavigationView }: MyTravelPageProps) => {
  const [activeTab, setActiveTab] = useState<"active-quests" | "trophy-case">(
    "active-quests"
  );
  const { address } = useAccount();

  const contract = useWanderifyContract();
  const isValidContract =
    !!contract.address && contract.address !== zeroAddress;

  const { data: commitmentData, isLoading: isLoadingCommitment } =
    useReadContract({
      ...contract,
      functionName: "commitments",
      args: [address],
      query: { enabled: !!address && isValidContract, refetchInterval: 5000 }, // keep fresh
    });
  console.log("Commitment Data:", commitmentData);
  const commitment =
    commitmentData && Array.isArray(commitmentData)
      ? {
          user: commitmentData[0] as string,
          amountInPool: commitmentData[1] as bigint,
          travelDate: commitmentData[2] as bigint,
          destinationId: commitmentData[3] as bigint,
          isProcessed: commitmentData[4] as boolean,
        }
      : undefined;

  // On-chain destination name and metadata for the active commitment
  const destinationIdForRead = commitment?.destinationId;
  const { data: destinationNameData } = useReadContract({
    ...contract,
    functionName: "destinationNames",
    args: destinationIdForRead ? [destinationIdForRead] : undefined,
    query: { enabled: !!destinationIdForRead && isValidContract },
  });
  const { data: destinationMetadataUriData } = useReadContract({
    ...contract,
    functionName: "destinationMetadata",
    args: destinationIdForRead ? [destinationIdForRead] : undefined,
    query: { enabled: !!destinationIdForRead && isValidContract },
  });
  const destinationNameOnchain = destinationNameData as string | undefined;
  const destinationMetadataUri = destinationMetadataUriData as
    | string
    | undefined;

  // Fetch destination metadata image (IPFS)
  const [activeDestMetadata, setActiveDestMetadata] = useState<{
    image?: string;
  } | null>(null);
  useEffect(() => {
    if (!destinationMetadataUri) {
      setActiveDestMetadata(null);
      return;
    }
    const url = destinationMetadataUri.replace(
      "ipfs://",
      "https://ipfs.io/ipfs/"
    );
    fetch(url)
      .then((r) => r.json())
      .then((j) => setActiveDestMetadata(j))
      .catch(() => setActiveDestMetadata(null));
  }, [destinationMetadataUri]);

  const { data: tokenIdsData, isLoading: isLoadingTokenIds } = useReadContract({
    ...contract,
    functionName: "getUserJourneyNFTs",
    args: [address],
    query: { enabled: !!address && isValidContract },
  });
  const tokenIds = tokenIdsData as bigint[] | undefined;

  const nowSec = Math.floor(Date.now() / 1000);
  const secondsRemaining = commitment
    ? Math.max(0, Number(commitment.travelDate) - nowSec)
    : 0;
  const timeRemainingPct = Math.min(
    100,
    Math.round((secondsRemaining / MIN_STAKE_DURATION_SECS) * 100)
  );

  const activeQuest = (() => {
    try {
      return commitment &&
        commitment.user !== "0x0000000000000000000000000000000000000000" &&
        !commitment.isProcessed
        ? {
            id: commitment.destinationId?.toString() || "0",
            destinationName:
              destinationNameOnchain ||
              (commitment.destinationId
                ? destinationsById[commitment.destinationId.toString()]?.name
                : undefined) ||
              "Unknown Quest",
            stakeAmount: parseFloat(formatEther(commitment.amountInPool)),
            travelDate: Number(commitment.travelDate),
            image:
              activeDestMetadata?.image ||
              (commitment.destinationId
                ? destinationsById[commitment.destinationId.toString()]?.image
                : undefined) ||
              "/placeholder.svg",
            status:
              Date.now() / 1000 >= Number(commitment.travelDate)
                ? "ready-for-checkin"
                : "in-progress",
            timeRemaining: timeRemainingPct,
          }
        : null;
    } catch (error) {
      console.error("Error creating active quest:", error);
      return null;
    }
  })();

  const trophies = Array.isArray(tokenIds)
    ? tokenIds.filter(
        (tokenId): tokenId is bigint =>
          tokenId !== undefined && tokenId !== null
      )
    : [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="font-pixel text-3xl text-neon-cyan mb-8 text-center">
          My Travel
        </h1>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={activeTab === "active-quests" ? "default" : "ghost"}
              onClick={() => setActiveTab("active-quests")}
              className={cn(
                "font-pixel text-sm px-6 py-2",
                activeTab === "active-quests"
                  ? "bg-neon-cyan text-background"
                  : ""
              )}
            >
              Active Quests
            </Button>
            <Button
              variant={activeTab === "trophy-case" ? "default" : "ghost"}
              onClick={() => setActiveTab("trophy-case")}
              className={cn(
                "font-pixel text-sm px-6 py-2",
                activeTab === "trophy-case"
                  ? "bg-neon-cyan text-background"
                  : ""
              )}
            >
              Trophy Case
            </Button>
          </div>
        </div>

        {/* Active Quests Tab */}
        {activeTab === "active-quests" && (
          <div className="space-y-6">
            {isLoadingCommitment ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading active quest...</p>
              </div>
            ) : !activeQuest ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No active quests. Start exploring to begin your journey!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[activeQuest].map((quest) => (
                  <Card
                    key={quest.id}
                    className="bg-card border border-border hover:border-neon-cyan/50 transition-all duration-300"
                  >
                    <CardContent className="p-0">
                      {/* Image */}
                      <div className="relative overflow-hidden rounded-t-lg">
                        <img
                          src={quest.image || "/placeholder.svg"}
                          alt={quest.destinationName}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <h3 className="font-pixel text-lg text-foreground mb-4">
                          {quest.destinationName}
                        </h3>

                        <div className="space-y-4">
                          {/* Stake Amount */}
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Staked:
                            </span>
                            <span className="font-pixel text-neon-gold">
                              {quest.stakeAmount} WNDR
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">
                                Time Remaining:
                              </span>
                              <span className="text-sm text-foreground">
                                {quest.timeRemaining}%
                              </span>
                            </div>
                            <Progress
                              value={quest.timeRemaining}
                              className="h-2"
                            />
                          </div>

                          {/* Action Button */}
                          <Button
                            onClick={() => {
                              // Get correct coordinates from destinations data
                              const destinationData =
                                destinationsById[quest.id];
                              const correctCoordinates =
                                destinationData?.coordinates || {
                                  lat: 0,
                                  lng: 0, // Fallback to {0,0} for unknown destinations
                                };

                              console.log("=== MY TRAVEL PAGE DEBUG ===");
                              console.log("Quest ID:", quest.id);
                              console.log("Destination Data:", destinationData);
                              console.log(
                                "Correct Coordinates:",
                                correctCoordinates
                              );
                              console.log("=============================");

                              onNavigationView(true, {
                                id: quest.id,
                                name: quest.destinationName,
                                image: quest.image,
                                rewardPool: 0, // We'll get this from contract
                                difficulty:
                                  destinationData?.difficulty || "Medium",
                                description:
                                  destinationData?.description ||
                                  `Active quest to ${quest.destinationName}`,
                                coordinates: correctCoordinates, // ✅ Use correct coordinates
                                participants: 1,
                                estimatedTime:
                                  destinationData?.estimatedTime || "15 days",
                                tags: destinationData?.tags || [
                                  "Active",
                                  "Quest",
                                ],
                              });
                            }}
                            disabled={quest.status !== "ready-for-checkin"}
                            className={cn(
                              "w-full font-pixel py-3",
                              quest.status === "ready-for-checkin"
                                ? "bg-neon-magenta text-background hover:bg-neon-magenta/90 glow-magenta"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                          >
                            {quest.status === "ready-for-checkin"
                              ? "Begin Final Approach"
                              : "Quest in Progress"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trophy Case Tab */}
        {activeTab === "trophy-case" && (
          <div className="space-y-6">
            {isLoadingTokenIds ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading trophies...</p>
              </div>
            ) : trophies.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No trophies earned yet. Complete quests to earn badges!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {trophies.map((tokenId: bigint) => (
                  <TrophyCard key={tokenId.toString()} tokenId={tokenId} />
                ))}
              </div>
            )}

            {/* Trophy Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="font-pixel text-2xl text-neon-cyan">
                  {trophies.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Badges
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="font-pixel text-2xl text-neon-gold">
                  {/* This would require fetching details for all NFTs, skipping for now for performance */}
                  0
                </div>
                <div className="text-sm text-muted-foreground">
                  Rare+ Badges
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="font-pixel text-2xl text-neon-magenta">
                  {/* This would require fetching details for all NFTs, skipping for now for performance */}
                  0
                </div>
                <div className="text-sm text-muted-foreground">Legendary</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTravelPage;
