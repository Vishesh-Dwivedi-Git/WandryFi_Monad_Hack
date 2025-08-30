"use client";

import { useState } from "react";
import Navbar from "@/components/navbar";
import ExplorePage from "@/components/explore-page";
import LeaderboardPage from "@/components/leaderboard-page";
import MyTravelPage from "@/components/my-travel-page";
import NavigationView from "@/components/navigation-view";

export type PageType = "explore" | "leaderboard" | "my-travel";

export default function MainApp() {
  const [currentPage, setCurrentPage] = useState<PageType>("explore");
  const [showNavigationView, setShowNavigationView] = useState(false);
  const [activeDestination, setActiveDestination] =
    useState<Destination | null>(null);

  const handleNavigationView = (show: boolean, destination?: Destination) => {
    if (show && destination) {
      setActiveDestination(destination);
    } else {
      setActiveDestination(null);
    }
    setShowNavigationView(show);
  };

  if (showNavigationView && activeDestination) {
    return (
      <NavigationView
        destination={activeDestination}
        onClose={() => handleNavigationView(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="pt-16">
        {currentPage === "explore" && <ExplorePage />}
        {currentPage === "leaderboard" && <LeaderboardPage />}
        {currentPage === "my-travel" && (
          <MyTravelPage onNavigationView={handleNavigationView} />
        )}
      </main>
    </div>
  );
}
