import { useAccount, useReadContract } from "wagmi";
import { Address } from "viem";
import WanderifyABI from "@/contracts/Wanderify.json";
import { getContractAddress, getChainConfig } from "./chain-config";

// Legacy export for backward compatibility - now reads from env
export const contractAddr =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  ("0x5fbdb2315678afecb367f032d93f642f64180aa3" as const);

// Dynamic contract configuration based on current chain
export function getWanderifyContract(chainId?: number) {
  const contractAddress = getContractAddress(chainId);
  return {
    abi: WanderifyABI.abi,
    address: contractAddress,
  };
}

// Hook to get contract config for current chain
export function useWanderifyContract() {
  const { chainId } = useAccount();
  return getWanderifyContract(chainId);
}

// Legacy export for backward compatibility (uses default chain)
export const WanderifyContract = getWanderifyContract();

export function useWanderifyBalance() {
  const { address } = useAccount();
  const contract = useWanderifyContract();

  return useReadContract({
    ...contract,
    functionName: "balanceOf",
    args: [address as Address],
  });
}
