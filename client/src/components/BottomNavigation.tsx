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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-background/90 backdrop-blur-lg safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 pt-2 pb-3">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              data-testid={`nav-${item.label}`}
              className={`flex flex-col items-center gap-0.5 min-w-[4.5rem] py-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                isActive ? "bg-violet-100 dark:bg-violet-500/15" : ""
              }`}>
                <item.icon className={`w-5 h-5 transition-all ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
              </div>
              <span className={`text-[10px] leading-tight transition-all ${isActive ? "font-bold" : "font-medium"}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
