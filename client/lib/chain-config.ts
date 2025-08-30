export interface ChainConfig {
  chainId: number;
  name: string;
  contractAddress: `0x${string}`;
  rpcUrl?: string;
  blockExplorer?: string;
}

export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  // Anvil Local Development
  31337: {
    chainId: 31337,
    name: "Anvil Local",
    contractAddress: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
    rpcUrl: "http://127.0.0.1:8545",
  },
  // Ethereum Mainnet
  1: {
    chainId: 1,
    name: "Ethereum Mainnet",
    contractAddress: "0x0000000000000000000000000000000000000000", // Replace with actual deployed address
    blockExplorer: "https://etherscan.io",
  },
  // Sepolia Testnet
  11155111: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    contractAddress: "0x0000000000000000000000000000000000000000", // Replace with actual deployed address
    blockExplorer: "https://sepolia.etherscan.io",
  },
  // Monad Testnet
  10143: {
    chainId: 10143,
    name: "Monad Testnet",
    contractAddress: "0x0000000000000000000000000000000000000000", // Replace with actual deployed address
    rpcUrl: "https://testnet-rpc.monad.xyz",
    blockExplorer: "https://testnet.monad.xyz",
  },
  // Monad Mainnet
  20143: {
    chainId: 20143,
    name: "Monad Mainnet",
    contractAddress: "0x0000000000000000000000000000000000000000", // Replace with actual deployed address
    rpcUrl: "https://rpc.monad.xyz",
    blockExplorer: "https://monad.xyz",
  },
};

export const DEFAULT_CHAIN_ID = 10143; // Anvil for development

export function getChainConfig(chainId?: number): ChainConfig {
  const id = chainId || DEFAULT_CHAIN_ID;
  return CHAIN_CONFIGS[id] || CHAIN_CONFIGS[DEFAULT_CHAIN_ID];
}

export function getContractAddress(chainId?: number): `0x${string}` {
  // First check for environment variable
  const envAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (envAddress && envAddress.startsWith('0x')) {
    return envAddress as `0x${string}`;
  }

  // Fallback to chain-specific config
  return getChainConfig(chainId).contractAddress;
}

export function getSupportedChains(): ChainConfig[] {
  return Object.values(CHAIN_CONFIGS);
}

export function isSupportedChain(chainId: number): boolean {
  return chainId in CHAIN_CONFIGS;
}
