// Static destination data with coordinates
import Evt from "@/public/Evt.png";
import Flower from "@/public/Flower.png";
import Havelock from "@/public/Havelock.png";
import IIIT from "@/public/IIT.png";
import Jaisalmer from "@/public/Jaisalmer.png";
import LNMIIT from "@/public/LNMIT.png";
import Leh from "@/public/Leh.png";
import Spiti from "@/public/spiti.png";
import { StaticImageData } from "next/image";
export const destinationsById: Record<
  string,
  {
    id: string;
    name: string;
    image: StaticImageData;
    coordinates: { lat: number; lng: number };
    difficulty: "Easy" | "Medium" | "Hard";
    description: string;
    estimatedTime?: string;
    tags?: string[];
  }
> = {
  "1": {
    id: "1",
    name: "Everest Base Camp",
    image: Evt,
    coordinates: { lat: 28.0026, lng: 86.8528 },
    difficulty: "Hard",
    description: "Trek to the world's most famous mountaineering base camp",
    estimatedTime: "14 days",
    tags: ["Adventure", "Extreme", "Mountaineering"]
  },
  "2": {
    id: "2",
    name: "Chadar Trek",
    image: Leh, 
    coordinates: { lat: 33.7898, lng: 76.8112 },
    difficulty: "Hard",
    description: "Walk on frozen Zanskar River in sub-zero temperatures",
    estimatedTime: "9 days",
    tags: ["Adventure", "Extreme", "Winter"]
  },
  "3": {
    id: "3",
    name: "Valley of Flowers",
    image: Flower,
    coordinates: { lat: 30.7268, lng: 79.6081 },
    difficulty: "Medium", 
    description: "Trek to UNESCO World Heritage alpine flower valley",
    estimatedTime: "6 days",
    tags: ["Adventure", "Nature", "UNESCO"]
  },
  "4": {
    id: "4",
    name: "Spiti Monastery",
    image: Spiti,
    coordinates: { lat: 32.3059, lng: 78.0169 },
    difficulty: "Hard",
    description: "Visit ancient Tibetan monastery in remote Spiti Valley",
    estimatedTime: "7 days",
    tags: ["Adventure", "Culture", "Spiritual"]
  },
  "5": {
    id: "5", 
    name: "Havelock Island",
    image: Havelock,
    coordinates: { lat: 12.0067, lng: 92.9615 },
    difficulty: "Medium",
    description: "Dive pristine coral reefs in the Andaman Islands",
    estimatedTime: "4 days",
    tags: ["Adventure", "Marine", "Nature"]
  },
  "6": {
    id: "6",
    name: "Jaisalmer Desert",
    image: Jaisalmer,
    coordinates: { lat: 26.9157, lng: 70.9083 },
    difficulty: "Medium", 
    description: "Experience desert life with camel safari and stargazing",
    estimatedTime: "3 days",
    tags: ["Adventure", "Desert", "Culture"]
  },
  "7": {
    id: "7",
    name: "IIIT Dharwad",
    image: IIIT,
    coordinates: { lat: 15.3941, lng: 75.0244 },
    difficulty: "Easy",
    description: "Visit the prestigious technology institute campus",
    estimatedTime: "1 day",
    tags: ["Education", "Technology", "Campus"]
  },
  "8": {
    id: "8",
    name: "LNMIIT Jaipur", 
    image: LNMIIT,
    coordinates: { lat: 26.9364, lng: 75.9238 },
    difficulty: "Easy",
    description: "Explore the renowned engineering institute in Pink City",
    estimatedTime: "1 day", 
    tags: ["Education", "Technology", "Campus"]
  }
}

// Export individual destination lookup function
export const getDestinationById = (id: string) => {
  return destinationsById[id];
};

// Export all destinations as array
export const allDestinations = Object.values(destinationsById);
