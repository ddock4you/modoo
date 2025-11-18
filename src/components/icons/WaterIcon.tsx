import type { IconProps } from "./types";

export const WaterIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"
      fill="currentColor"
    />
    <path
      d="M7 21C7 19.8954 7.89543 19 9 19H15C16.1046 19 17 19.8954 17 21V22H7V21Z"
      fill="currentColor"
      opacity="0.3"
    />
  </svg>
);
