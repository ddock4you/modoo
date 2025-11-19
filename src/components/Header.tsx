import { Bell, Menu, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { Switch } from "./ui/switch";
import { useState, useEffect } from "react";

export default function Header() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  const [hasNotification, setHasNotification] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  return (
    <header className="px-6 py-8 bg-amber-100 dark:bg-gray-900 flex items-center justify-between">
      <nav className="flex items-center gap-3">
        <button>
          <Menu />
        </button>
        <button className="relative" onClick={() => setHasNotification(false)} aria-label="알림">
          <Bell />
          {hasNotification && (
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          )}
        </button>
      </nav>
      <Link to="/">
        <Logo />
      </Link>
      <nav className="flex items-center gap-3">
        <button className="flex items-center gap-2">
          {isDarkMode ? <Moon /> : <Sun />}
          <Switch
            checked={isDarkMode}
            onCheckedChange={setIsDarkMode}
            aria-label="다크 모드 토글"
            className="data-[state=checked]:bg-[#EAEAEA] data-[state=unchecked]:bg-[#EAEAEA] h-7 w-11"
            thumbClassName="bg-[#737373] data-[state=checked]:translate-x-[calc(100%+8px)] data-[state=unchecked]:translate-x-1"
          />
        </button>
      </nav>
    </header>
  );
}
