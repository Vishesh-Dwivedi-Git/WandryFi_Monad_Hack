"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface Destination {
  id: string;
  name: string;
  image: string;
  rewardPool: number;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  coordinates: { x: number; y: number };
  participants?: number;
  estimatedTime?: string;
  tags?: string[];
}

interface ActiveQuest {
  id: string;
  destinationName: string;
  stakeAmount: number;
  timeRemaining: number;
  image: string;
  status: "in-progress" | "ready-for-checkin" | "completed";
  destinationId: string;
  startDate: string;
  completionDate?: string;
  rewards?: {
    wndrTokens: number;
    experiencePoints: number;
    bonusRewards?: string[];
  };
}

interface StakedQuest {
  id: string;
  destinationId: string;
  destinationName: string;
  stakeAmount: number;
  stakedDate: string;
  image: string;
  difficulty: "Easy" | "Medium" | "Hard";
  status: "staked" | "in-progress" | "completed";
}

interface Trophy {
  id: string;
  locationName: string;
  icon: string;
  dateEarned: string;
  rarity: "common" | "rare" | "legendary";
  destinationId: string;
  description?: string;
  experiencePoints: number;
}

interface UserStats {
  totalQuestsCompleted: number;
  totalWndrEarned: number;
  totalExperiencePoints: number;
  currentLevel: number;
  questsInProgress: number;
  trophiesEarned: number;
  favoriteDestinationType: string;
}

interface WanderfyContextType {
  activeQuests: ActiveQuest[];
  stakedQuests: StakedQuest[];
  trophies: Trophy[];
  userStats: UserStats;
  walletBalance: number;
  acceptQuest: (destination: Destination, stakeAmount: number) => void;
  completeQuest: (questId: string) => void;
  abandonQuest: (questId: string) => void;
  isQuestActive: (destinationId: string) => boolean;
  isQuestStaked: (destinationId: string) => boolean;
  getQuestByDestination: (destinationId: string) => ActiveQuest | undefined;
  updateQuestProgress: (questId: string, progress: number) => void;
  addExperience: (points: number) => void;
  updateWalletBalance: (amount: number) => void;
}

const WanderfyContext = createContext<WanderfyContextType | undefined>(
  undefined
);

export function WanderfyProvider({ children }: { children: ReactNode }) {
  // Active Quests State
  const [activeQuests, setActiveQuests] = useState<ActiveQuest[]>([]);

  // Staked Quests State (for destinations that are staked but not yet started)
  const [stakedQuests, setStakedQuests] = useState<StakedQuest[]>([]);

  // Trophies State
  const [trophies, setTrophies] = useState<Trophy[]>([
    {
      id: "1",
      locationName: "Mystic Falls",
      icon: "waterfall",
      dateEarned: "2024-01-15",
      rarity: "rare",
      destinationId: "2",
      description: "Discovered the hidden waterfall after a challenging trek",
      experiencePoints: 180,
    },
    {
      id: "2",
      locationName: "Jog Falls",
      icon: "waterfall",
      dateEarned: "2024-01-10",
      rarity: "legendary",
      destinationId: "7",
      description: "Witnessed India's second-highest waterfall in full glory",
      experiencePoints: 250,
    },
    {
      id: "3",
      locationName: "Badami Caves",
      icon: "cave",
      dateEarned: "2024-01-05",
      rarity: "rare",
      destinationId: "8",
      description: "Explored ancient rock-cut cave temples",
      experiencePoints: 200,
    },
    {
      id: "4",
      locationName: "Shivanasamudra Falls",
      icon: "waterfall",
      dateEarned: "2023-12-28",
      rarity: "common",
      destinationId: "10",
      description: "Captured stunning photos of twin waterfalls",
      experiencePoints: 100,
    },
    {
      id: "5",
      locationName: "Dandeli Wildlife Sanctuary",
      icon: "wildlife",
      dateEarned: "2023-12-20",
      rarity: "rare",
      destinationId: "9",
      description: "Spotted rare wildlife during safari adventure",
      experiencePoints: 220,
    },
    {
      id: "6",
      locationName: "Mullayanagiri Peak",
      icon: "mountain",
      dateEarned: "2023-12-15",
      rarity: "legendary",
      destinationId: "6",
      description: "Conquered Karnataka's highest peak",
      experiencePoints: 300,
    },
  ]);

  // User Stats State
  const [userStats, setUserStats] = useState<UserStats>({
    totalQuestsCompleted: 6,
    totalWndrEarned: 3250,
    totalExperiencePoints: 1250,
    currentLevel: 8,
    questsInProgress: 3,
    trophiesEarned: 6,
    favoriteDestinationType: "Waterfalls",
  });

  // Wallet Balance State
  const [walletBalance, setWalletBalance] = useState<number>(2500);

  // Helper function to calculate level from experience points
  const calculateLevel = (xp: number): number => {
    return Math.floor(xp / 150) + 1;
  };

  // Accept Quest Function
  const acceptQuest = (destination: Destination, stakeAmount: number) => {
    // Check if user has enough balance
    if (walletBalance < stakeAmount) {
      throw new Error("Insufficient WNDR balance");
    }

    // Check if quest is already active or staked
    if (isQuestActive(destination.id) || isQuestStaked(destination.id)) {
      throw new Error("Quest already active or staked for this destination");
    }

    const newStakedQuest: StakedQuest = {
      id: `staked-${Date.now().toString()}`,
      destinationId: destination.id,
      destinationName: destination.name,
      stakeAmount,
      stakedDate: new Date().toISOString().split("T")[0],
      image: destination.image,
      difficulty: destination.difficulty as "Easy" | "Medium" | "Hard",
      status: "staked",
    };

    setStakedQuests((prev) => [...prev, newStakedQuest]);
    setWalletBalance((prev) => prev - stakeAmount);
  };

  // Complete Quest Function
  const completeQuest = (questId: string) => {
    const quest = activeQuests.find((q) => q.id === questId);
    if (!quest) return;

    // Remove from active quests
    setActiveQuests((prev) => prev.filter((q) => q.id !== questId));

    // Add rewards to wallet and experience
    const totalReward = quest.stakeAmount + (quest.rewards?.wndrTokens || 0);
    const experienceGained = quest.rewards?.experiencePoints || 0;

    setWalletBalance((prev) => prev + totalReward);

    // Add to trophies
    const newTrophy: Trophy = {
      id: Date.now().toString(),
      locationName: quest.destinationName,
      icon: getIconForDestination(quest.destinationName),
      dateEarned: new Date().toISOString().split("T")[0],
      rarity: getRarityForDifficulty(quest.stakeAmount),
      destinationId: quest.destinationId,
      description: `Successfully completed quest at ${quest.destinationName}`,
      experiencePoints: experienceGained,
    };

    setTrophies((prev) => [newTrophy, ...prev]);

    // Update user stats
    setUserStats((prev) => {
      const newXP = prev.totalExperiencePoints + experienceGained;
      return {
        ...prev,
        totalQuestsCompleted: prev.totalQuestsCompleted + 1,
        totalWndrEarned: prev.totalWndrEarned + totalReward,
        totalExperiencePoints: newXP,
        currentLevel: calculateLevel(newXP),
        questsInProgress: prev.questsInProgress - 1,
        trophiesEarned: prev.trophiesEarned + 1,
      };
    });
  };

  // Abandon Quest Function
  const abandonQuest = (questId: string) => {
    const quest = activeQuests.find((q) => q.id === questId);
    if (!quest) return;

    // Remove from active quests (lose stake)
    setActiveQuests((prev) => prev.filter((q) => q.id !== questId));

    // Update stats
    setUserStats((prev) => ({
      ...prev,
      questsInProgress: prev.questsInProgress - 1,
    }));
  };

  // Check if quest is active for destination
  const isQuestActive = (destinationId: string): boolean => {
    return activeQuests.some((quest) => quest.destinationId === destinationId);
  };

  // Check if quest is staked for destination
  const isQuestStaked = (destinationId: string): boolean => {
    return stakedQuests.some((quest) => quest.destinationId === destinationId);
  };

  // Get quest by destination ID
  const getQuestByDestination = (
    destinationId: string
  ): ActiveQuest | undefined => {
    return activeQuests.find((quest) => quest.destinationId === destinationId);
  };

  // Update quest progress
  const updateQuestProgress = (questId: string, progress: number) => {
    setActiveQuests((prev) =>
      prev.map((quest) =>
        quest.id === questId
          ? { ...quest, timeRemaining: Math.max(0, progress) }
          : quest
      )
    );
  };

  // Add experience points
  const addExperience = (points: number) => {
    setUserStats((prev) => {
      const newXP = prev.totalExperiencePoints + points;
      return {
        ...prev,
        totalExperiencePoints: newXP,
        currentLevel: calculateLevel(newXP),
      };
    });
  };

  // Update wallet balance
  const updateWalletBalance = (amount: number) => {
    setWalletBalance((prev) => prev + amount);
  };

  // Helper Functions
  const getIconForDestination = (name: string): string => {
    const iconMap: Record<string, string> = {
       "Everest Base Camp": "mountain",
       "Chadar Trek": "winter", 
       "Valley of Flowers": "nature",
       "Spiti Monastery": "spiritual",
       "Havelock Island": "marine",
       "Jaisalmer Desert": "desert",
       "IIIT Dharwad": "campus",
       "LNMIIT Jaipur": "campus"
    };
    return iconMap[name] || "location";
  };

  const getRarityForDifficulty = (
    stakeAmount: number
  ): "common" | "rare" | "legendary" => {
    if (stakeAmount >= 700) return "legendary";
    if (stakeAmount >= 400) return "rare";
    return "common";
  };

  const generateBonusRewards = (
    difficulty: string,
    tags?: string[]
  ): string[] => {
    const rewards: string[] = [];

    if (difficulty === "Hard") {
      rewards.push("Extreme Adventurer Badge");
    } else if (difficulty === "Medium") {
      rewards.push("Seasoned Explorer Badge");
    } else {
      rewards.push("Nature Lover Badge");
    }

    if (tags?.includes("Mountain")) {
      rewards.push("Mountain Climber");
    }
    if (tags?.includes("Waterfall")) {
      rewards.push("Waterfall Hunter");
    }
    if (tags?.includes("Beach")) {
      rewards.push("Coastal Explorer");
    }
    if (tags?.includes("History")) {
      rewards.push("History Explorer");
    }

    return rewards;
  };

  // Auto-update quest timers (simulation)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveQuests((prev) =>
        prev.map((quest) => ({
          ...quest,
          timeRemaining: Math.max(0, quest.timeRemaining - 1),
          status:
            quest.timeRemaining <= 10 ? "ready-for-checkin" : quest.status,
        }))
      );
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <WanderfyContext.Provider
      value={{
        activeQuests,
        stakedQuests,
        trophies,
        userStats,
        walletBalance,
        acceptQuest,
        completeQuest,
        abandonQuest,
        isQuestActive,
        isQuestStaked,
        getQuestByDestination,
        updateQuestProgress,
        addExperience,
        updateWalletBalance,
      }}
    >
      {children}
    </WanderfyContext.Provider>
  );
}

export function useWanderfy() {
  const context = useContext(WanderfyContext);
  if (context === undefined) {
    throw new Error("useWanderfy must be used within a WanderfyProvider");
  }
  return context;
}

// Export types for use in other components
export type { Destination, ActiveQuest, StakedQuest, Trophy, UserStats };
