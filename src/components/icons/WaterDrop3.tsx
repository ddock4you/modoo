import type { IconProps } from "./types";

export const WaterDrop3 = ({ className, size = 16, color = "#70A6FF" }: IconProps) => (
  <svg
    width={size}
    height={Math.floor(size * 0.8)}
    viewBox="0 0 13 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10.6982 5.06153L7.54832 0.705094C7.22801 0.262688 6.71435 0 6.16795 0C5.62107 0 5.10789 0.262688 4.78707 0.705094L1.6367 5.06153C0.0437352 7.55914 -0.66769 10.6564 0.801571 13.0667C1.02703 13.4365 1.30384 13.7902 1.6367 14.1231C2.88817 15.3745 4.52782 16 6.16795 16C7.8076 16 9.44726 15.3745 10.6982 14.1231C11.0311 13.7902 11.308 13.4365 11.5335 13.0667C13.003 10.6564 12.2912 7.55912 10.6982 5.06153Z"
      fill={color}
    />
  </svg>
);
