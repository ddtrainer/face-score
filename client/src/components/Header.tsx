import { Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-background/90 backdrop-blur-lg">
      <div className="max-w-lg mx-auto flex items-center justify-center gap-2.5 px-5 py-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent" data-testid="text-app-title">
          Face Score
        </h1>
      </div>
    </header>
  );
}
