import type { IconProps } from "./types";

export const Home = ({ className, size = 22, color = "#A3A3A3" }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 22 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M1.375 8.25V20.625H8.25V15.125C8.25 13.6062 9.48122 12.375 11 12.375C12.5188 12.375 13.75 13.6062 13.75 15.125V20.625H20.625V8.25L11 0L1.375 8.25Z"
      fill={color}
    />
  </svg>
);
