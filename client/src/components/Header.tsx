import { Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-lg mx-auto flex items-center justify-center gap-2 px-4 py-3">
        <Sparkles className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold tracking-tight" data-testid="text-app-title">
          Face Score
        </h1>
      </div>
    </header>
  );
}
