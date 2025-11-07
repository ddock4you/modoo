import { Link, useLocation } from "react-router-dom";
import { Home, Flower2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "대시보드",
    href: "/",
    icon: Home,
  },
  {
    name: "식물",
    href: "/plants",
    icon: Flower2,
  },
  {
    name: "설정",
    href: "/settings",
    icon: Settings,
  },
];

export function MobileNavigation() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 min-h-[44px] py-2 px-1 rounded-md transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
              )}
              aria-label={item.name}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
