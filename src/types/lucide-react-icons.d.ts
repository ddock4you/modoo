declare module "lucide-react/dist/esm/icons/*" {
  import type { ComponentType, SVGProps } from "react";

  const Icon: ComponentType<SVGProps<SVGSVGElement> & { color?: string; size?: string | number }>;
  export default Icon;
}
