import { Home, History, Settings } from "lucide-react";
import { useLocation } from "wouter";

const navItems = [
  { path: "/", label: "홈", icon: Home },
  { path: "/history", label: "기록", icon: History },
  { path: "/settings", label: "설정", icon: Settings },
];

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border/50">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-4">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              data-testid={`nav-${item.label}`}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-md transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
