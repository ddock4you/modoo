import { Link, useLocation } from "react-router-dom";
import { type LucideIcon } from "lucide-react";
import { My } from "./icons/My";
import { cn } from "@/lib/utils";
import { Home, Plant, Weather, Watering, type IconProps } from "./icons";

// const navigation = [
//   {
//     name: "홈",
//     href: "/",
//     icon: Home,
//   },
//   {
//     name: "화분",
//     href: "/plants",
//     icon: Flower,
//   },
//   {
//     name: "날씨",
//     href: "/weather",
//     icon: Settings,
//   },
//   {
//     name: "설정",
//     href: "/settings",
//     icon: My,
//   },
// ];

export function MobileNavigation() {
  // const location = useLocation();

  return (
    <div className="fixed w-full flex flex-col items-center justify-center gap-2 bottom-0 left-0 right-0 bg-background px-4 pt-0 pb-3 rounded-tl-3xl rounded-tr-3xl z-10">
      <nav className="w-full flex items-center gap-x-3 gap-y-2">
        <NavigationItem name="홈" href="/" Icon={Home} />
        <NavigationItem name="화분" href="/plants" Icon={Plant} />
        <div className="flex-1 flex items-start justify-center">
          <Link
            to="/watering"
            className="flex items-center justify-center translate-y-[-30px] min-w-12 min-h-12 w-[15vw] h-[15vw] max-w-20 max-h-20 border-8 border-white rounded-full bg-[#00A576]"
          >
            <Watering className="h-5 w-5" />
          </Link>
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
