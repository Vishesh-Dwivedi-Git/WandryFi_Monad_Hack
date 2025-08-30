"use client";

import { useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useWanderifyContract } from "@/lib/contract";
import { formatEther } from "viem";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardPlayer {
  rank: number;
  address: `0x${string}`;
  score: number;
  badge: string;
}

export default function LeaderboardPage() {
  const { address: connectedAddress } = useAccount();
  const contract = useWanderifyContract();

  // 1. Fetch the leaderboard data. The result will be a tuple: [address[], bigint[]]
  const { data: leaderboardResult, isLoading } = useReadContract({
    ...contract,
    functionName: "getLeaderboard",
  });
  console.log("______________CONTRACT READ");
  console.log(leaderboardResult);
  // 2. Process the fetched data into the structure your UI expects.
  //    useMemo ensures this only recalculates when the contract data changes.
  const processedLeaderboardData = useMemo(() => {
    if (!leaderboardResult) {
      return [];
    }

    const [users, profits] = Array.isArray(leaderboardResult)
      ? leaderboardResult
      : [[], []];
    const badges = ["🏆", "🥈", "🥉"];
    console.log(leaderboardResult);
    interface RawLeaderboardResult {
      users: `0x${string}`[];
      profits: bigint[];
    }

    interface ProcessedLeaderboardPlayer {
      rank: number;
      address: `0x${string}`;
      score: number;
      badge: string;
    }

    return (users as RawLeaderboardResult["users"])
      .map(
        (
          userAddress: `0x${string}`,
          index: number
        ): ProcessedLeaderboardPlayer => ({
          rank: index + 1,
          address: userAddress,
          score: parseFloat(formatEther(profits[index] as bigint)),
          badge: badges[index] || "",
        })
      )
      .sort(
        (a: ProcessedLeaderboardPlayer, b: ProcessedLeaderboardPlayer) =>
          b.score - a.score
      );
  }, [leaderboardResult]);

  // 3. Find the current user's data within the processed leaderboard.
  const currentUserData = useMemo(() => {
    if (!connectedAddress || !processedLeaderboardData.length) {
      return null;
    }
    // Find the player entry that matches the connected wallet address
    return processedLeaderboardData.find(
      (player) =>
        player.address.toLowerCase() === connectedAddress.toLowerCase()
    );
  }, [connectedAddress, processedLeaderboardData]);

  // Helper component for rendering a player row to avoid repetition
  const PlayerRow = ({ player }: { player: LeaderboardPlayer }) => (
    <div className="grid grid-cols-4 gap-4 items-center">
      <div className="font-pixel text-lg">
        <span
          className={player.rank <= 3 ? "text-neon-gold" : "text-foreground"}
        >
          #{player.rank}
        </span>
      </div>
      <div className="font-mono text-sm text-muted-foreground truncate">
        {player.address}
      </div>
      <div className="font-pixel text-neon-cyan">
        {player.score.toLocaleString()} WNDR
      </div>
      <div className="text-2xl">{player.badge}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-pixel text-3xl text-neon-cyan mb-8 text-center">
          Leaderboard
        </h1>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-6 py-4 border-b border-border">
            <div className="grid grid-cols-4 gap-4 font-pixel text-sm text-muted-foreground">
              <div>Rank</div>
              <div>Explorer</div>
              <div>Score</div>
              <div>Badge</div>
            </div>
          </div>

          <div className="divide-y divide-border">
            {isLoading
              ? // 4. Show a loading skeleton while data is being fetched
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-6 py-4">
                    <div className="grid grid-cols-4 gap-4 items-center">
                      <Skeleton className="h-6 w-10" />
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-8" />
                    </div>
                  </div>
                ))
              : // 5. Map over the PROCESSED data, not the hardcoded array
                processedLeaderboardData.map((player) => (
                  <div
                    key={player.address}
                    className="px-6 py-4 hover:bg-muted/30 transition-colors duration-200"
                  >
                    <PlayerRow player={player} />
                  </div>
                ))}
          </div>

          {/* 6. Display the current user's rank at the bottom if they are connected and in the list */}
          {connectedAddress && currentUserData && (
            <div className="px-6 py-4 bg-neon-cyan/10 border-t-2 border-neon-cyan">
              <PlayerRow player={currentUserData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
