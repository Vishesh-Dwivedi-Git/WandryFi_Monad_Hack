"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, CalendarIcon } from "lucide-react";
import { useWanderfy } from "@/contexts/wanderify-context";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { useWanderifyContract } from "@/lib/contract";
import { parseEther } from "viem";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { destinationsById } from "@/lib/destinations";

interface StakingModalProps {
  destinationId: string;
  onClose: () => void;
  onAcceptQuest: (amount: number) => void;
}

export default function StakingModal({
  destinationId,
  onClose,
  onAcceptQuest,
}: StakingModalProps) {
  const [stakeAmount, setStakeAmount] = useState("");
  const [travelDate, setTravelDate] = useState<Date>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { acceptQuest } = useWanderfy();
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();

  const contract = useWanderifyContract();

  const defaultTravelDate = new Date();
  defaultTravelDate.setDate(defaultTravelDate.getDate() + 1);

  const { data: commitment } = useReadContract({
    ...contract,
    functionName: "commitments",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Fetch destination data from contract
  const { data: destinationName } = useReadContract({
    ...contract,
    functionName: "destinationNames",
    args: [BigInt(destinationId)],
  });

  const { data: locationPool } = useReadContract({
    ...contract,
    functionName: "locationPools",
    args: [BigInt(destinationId)],
  });

  const commitmentData = commitment && Array.isArray(commitment)
    ? {
        user: commitment[0] as string,
        amountInPool: commitment[1] as bigint,
        travelDate: commitment[2] as bigint,
        destinationId: commitment[3] as bigint,
        isProcessed: commitment[4] as boolean,
      }
    : undefined;

  const isAlreadyStaked = commitmentData && 
    commitmentData.amountInPool > BigInt(0) && 
    !commitmentData.isProcessed;

  const handleAcceptQuest = () => {
    const amount = Number.parseFloat(stakeAmount);
    if (amount > 0 && travelDate) {
      const travelDateInSeconds = Math.floor(travelDate.getTime() / 1000);

      writeContract(
        {
          ...contract,
          functionName: "stake",
          args: [BigInt(destinationId), BigInt(travelDateInSeconds)],
          value: parseEther(stakeAmount),
        },
        {
          onSuccess: (hash) => {
            toast.success("Quest Accepted!", {
              description: `Transaction sent: ${hash}`,
            });

            // Get correct coordinates from centralized destination data
            const destinationData = destinationsById[destinationId];
            const correctCoordinates = destinationData?.coordinates || { lat: 0, lng: 0 };

            acceptQuest(
              {
                id: destinationId,
                name: (destinationName as string) || "Unknown",
                image: typeof destinationData?.image === "string"
                  ? destinationData.image
                  : destinationData?.image?.src || "/placeholder.svg",
                rewardPool: locationPool
                  ? parseFloat((Number(locationPool as bigint) / 1e18).toFixed(4))
                  : 0,
                difficulty: destinationData?.difficulty || "Medium",
                description: destinationData?.description || "Adventure awaits!",
                coordinates: {
                  x: correctCoordinates.lng, // Convert lng to x
                  y: correctCoordinates.lat, // Convert lat to y
                },
              },
              amount
            );
            onAcceptQuest(amount);
            onClose();
          },
          onError: (error) => {
            toast.error("Transaction Failed", {
              description: error.message,
            });
          },
        }
      );
    } else {
      toast.error("Invalid Input", {
        description: "Please enter a valid stake amount and select a travel date.",
      });
    }
  };

  if (!destinationName) {
    return (
      <div className="bg-[#000000] border border-[#333333] rounded-lg p-6 max-w-md mx-auto">
        <div className="text-[#00D4FF] font-pixel text-center">
          Loading destination...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#000000] border border-[#333333] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[#333333]">
        <h2 className="font-pixel text-xl text-[#00D4FF]">Quest Details</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-[#FFFFFF] hover:text-[#00D4FF]"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Destination Info */}
        <div className="mb-6">
          <h3 className="font-pixel text-2xl text-[#FFFFFF] mb-4">
            {destinationName as string}
          </h3>
          <p className="text-[#FFFFFF] mb-4">
            Stake TMON to prove you will visit this destination and earn rewards upon completion.
          </p>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-[#111111] rounded-lg p-4 border border-[#333333]">
              <div className="text-sm text-[#FFFFFF] mb-1">Current Pool</div>
              <div className="font-pixel text-lg text-[#FF9500]">
                {locationPool
                  ? `${(Number(locationPool as bigint) / 1e18).toFixed(4)} TMON`
                  : "0 TMON"}
              </div>
            </div>
          </div>
        </div>

        {/* Quest Requirements */}
        <div className="mb-6">
          <h4 className="font-pixel text-lg text-[#FFFFFF] mb-3">Quest Requirements</h4>
          <div className="space-y-2 text-sm text-[#FFFFFF]">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#00D4FF] rounded-full"></div>
              <span>Travel to the destination coordinates</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#00D4FF] rounded-full"></div>
              <span>Complete the check-in process using GPS verification</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#00D4FF] rounded-full"></div>
              <span>Earn rewards based on destination difficulty</span>
            </div>
          </div>
        </div>

        {/* Stake Input */}
        <div className="mb-6">
          <Label
            htmlFor="stake-amount"
            className="font-pixel text-sm text-[#FFFFFF] mb-2 block"
          >
            Stake Amount (TMON)
          </Label>
          <Input
            id="stake-amount"
            type="number"
            step="0.001"
            min="0.001"
            placeholder="Enter amount to stake (e.g., 0.005)"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            className="bg-[#111111] border-[#333333] focus:border-[#00D4FF] text-[#FFFFFF] placeholder-[#666666]"
          />
          <p className="text-xs text-[#FFFFFF] mt-2">
            Minimum stake: 0.001 TMON. Higher stakes increase potential rewards.
            <br />
            <span className="text-[#00D4FF]">Recommended: 0.005 TMON for testing</span>
          </p>
        </div>

        {/* Travel Date Picker */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <Label className="font-pixel text-sm text-[#FFFFFF]">Travel Date</Label>
            <div className="flex items-center space-x-2">
              {/* --- CHANGE START: Added a Quick Select button for Today --- */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTravelDate(new Date())}
                className="text-xs text-[#00D4FF] hover:text-[#00B7E6] font-pixel"
              >
                Quick Select (Today)
              </Button>
              {/* --- CHANGE END --- */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTravelDate(defaultTravelDate)}
                className="text-xs text-[#00D4FF] hover:text-[#00B7E6] font-pixel"
              >
                {/* --- CHANGE START: Corrected button text for clarity --- */}
                Quick Select (Tomorrow)
                {/* --- CHANGE END --- */}
              </Button>
            </div>
          </div>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-[#111111] border-[#333333] focus:border-[#00D4FF] hover:border-[#00D4FF] transition-colors",
                  !travelDate && "text-[#666666]"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-[#00D4FF]" />
                {travelDate ? (
                  <span className="text-[#FFFFFF]">{format(travelDate, "PPP")}</span>
                ) : (
                  <span>Pick a travel date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-[#000000] border-[#333333] shadow-lg"
              align="start"
            >
              <Calendar
                mode="single"
                selected={travelDate}
                onSelect={(date) => {
                  setTravelDate(date);
                  setCalendarOpen(false);
                }}
                disabled={(date) => {
                  // --- NO CHANGE NEEDED: This logic already allows selecting today and future dates ---
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
                initialFocus
                className="bg-[#000000] border-[#333333]"
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-[#FFFFFF] mt-2">
            Select any future date for testing purposes.
            {travelDate && (
              <span className="text-[#00D4FF] ml-1">
                Selected: {Math.ceil((travelDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days from now
              </span>
            )}
          </p>
        </div>

        {/* Accept Quest Button */}
        <Button
          onClick={handleAcceptQuest}
          disabled={
            !stakeAmount ||
            Number.parseFloat(stakeAmount) <= 0 ||
            !travelDate ||
            isPending ||
            isAlreadyStaked
          }
          className="w-full font-pixel text-lg py-6 bg-[#00D4FF] text-black hover:bg-[#00B7E6] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending
            ? "Processing Transaction..."
            : isAlreadyStaked
            ? "Already Staked on Another Quest"
            : "Accept Quest & Stake TMON"}
        </Button>

        {/* Additional Info */}
        <div className="mt-4 p-4 bg-[#111111] rounded-lg border border-[#333333]">
          <h5 className="font-pixel text-sm text-[#00D4FF] mb-2">How It Works:</h5>
          <ul className="text-xs text-[#FFFFFF] space-y-1">
            <li>• Your TMON is held in the smart contract as proof of commitment</li>
            <li>• Travel to the destination and use GPS check-in to verify arrival</li>
            <li>• Upon successful verification, earn rewards based on destination difficulty</li>
            <li>• Failed to complete? You forfeit your staked amount to the pool</li>
          </ul>
        </div>
      </div>
    </div>
  );
}