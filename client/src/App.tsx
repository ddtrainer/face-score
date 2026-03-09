import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import HomePage from "@/pages/HomePage";
import ResultPage from "@/pages/ResultPage";
import HistoryPage from "@/pages/HistoryPage";
import SettingsPage from "@/pages/SettingsPage";
import type { AnalysisResult } from "@/lib/types";

function AppContent() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleAnalysisComplete = (result: AnalysisResult, url: string) => {
    setAnalysisResult(result);
    setImageUrl(url);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pb-20 overflow-y-auto">
        <Switch>
          <Route path="/">
            <HomePage onAnalysisComplete={handleAnalysisComplete} />
          </Route>
          <Route path="/result">
            <ResultPage result={analysisResult} imageUrl={imageUrl} />
          </Route>
          <Route path="/history">
            <HistoryPage />
          </Route>
          <Route path="/settings">
            <SettingsPage />
          </Route>
        </Switch>
      </main>
      <BottomNavigation />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
