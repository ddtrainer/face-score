import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppStateProvider } from "@/lib/appState";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import HomePage from "@/pages/HomePage";
import ResultPage from "@/pages/ResultPage";
import HistoryPage from "@/pages/HistoryPage";
import SettingsPage from "@/pages/SettingsPage";

function AppContent() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pb-24 overflow-y-auto">
        <Switch>
          <Route path="/">
            <HomePage />
          </Route>
          <Route path="/result">
            <ResultPage />
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
        <AppStateProvider>
          <Toaster />
          <AppContent />
        </AppStateProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
