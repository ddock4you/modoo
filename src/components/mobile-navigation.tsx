import { Link, useLocation } from "react-router-dom";
import { type LucideIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { My } from "./icons/My";
import { cn } from "@/lib/utils";
import { Home, Plant, Weather, Watering, type IconProps } from "./icons";
import { useAddPlantWizard } from "@/lib/plants/AddPlantWizardContext";

export function MobileNavigation() {
  // const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);
  const { open } = useAddPlantWizard();

  useEffect(() => {
    const updateHeight = () => {
      if (navRef.current) {
        const height = navRef.current.offsetHeight;
        document.documentElement.style.setProperty("--mobile-nav-height", `${height}px`);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <div
      ref={navRef}
      className="fixed w-full flex flex-col items-center justify-center gap-2 bottom-0 left-0 right-0 bg-background px-4 pt-0 pb-3 rounded-tl-3xl rounded-tr-3xl z-10"
    >
      <nav className="w-full flex items-center gap-x-3 gap-y-2">
        <NavigationItem name="홈" href="/" Icon={Home} />
        <NavigationItem name="화분" href="/plants" Icon={Plant} />
        <div className="flex-1 flex items-start justify-center">
          <button
            type="button"
            className="flex items-center justify-center translate-y-[-30px] min-w-12 min-h-12 w-[15vw] h-[15vw] max-w-20 max-h-20 border-8 border-white rounded-full bg-[#00A576]"
            onClick={() => open(1)}
          >
            <Watering className="h-5 w-5" />
          </button>
        </div>
        <NavigationItem name="날씨" href="/weather" Icon={Weather} />
        <NavigationItem name="설정" href="/settings" Icon={My} />
      </nav>
      <button type="button" className="w-40 h-[6px] bg-neutral-200 rounded-full"></button>
    </div>
  );
}

function NavigationItem({
  name,
  href,
  Icon,
}: {
  name: string;
  href: string;
  Icon: LucideIcon | (() => React.ReactNode) | ((props: IconProps) => React.ReactNode);
}) {
  const isActive = useLocation().pathname === href;
  return (
    <Link
      to={href}
      className={cn(
        "flex-1 flex flex-col items-center justify-center gap-2 py-3 text-neutral-400",
        isActive && "text-[#00A576]"
      )}
    >
      <p className="flex items-center justify-center h-6 w-full">
        <Icon className="h-5 w-5" color={isActive ? "#00A576" : "#A3A3A3"} />
      </p>
      <span className="text-sm font-medium">{name}</span>
    </Link>
  );
}
