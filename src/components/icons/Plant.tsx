import type { IconProps } from "./types";

export const Plant = ({ className, size = 24, color = "#A3A3A3" }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M22.8 1.2V3.6C22.8 8.2392 19.0392 12 14.4 12H13.2V13.2H19.2V21.6C19.2 22.926 18.126 24 16.8 24H7.2C5.874 24 4.8 22.926 4.8 21.6V13.2H10.8V9.6C10.8 4.9608 14.5608 1.2 19.2 1.2H22.8ZM4.2 0C7.2348 0 9.918 1.5012 11.5488 3.8028C10.3248 5.412 9.6 7.422 9.6 9.6V10.8H9C4.0296 10.8 0 6.7704 0 1.8V0H4.2Z"
      fill={color}
    />
  </svg>
);
