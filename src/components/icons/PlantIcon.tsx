import type { IconProps } from "./types";

export const PlantIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2C10.5 2 9.5 3.5 9.5 5.5C9.5 7.5 10.5 9 12 9C13.5 9 14.5 7.5 14.5 5.5C14.5 3.5 13.5 2 12 2Z"
      fill="currentColor"
    />
    <path
      d="M7 14C7 12.5 8 11.5 9.5 11.5C11 11.5 12 12.5 12 14C12 15.5 11 16.5 9.5 16.5C8 16.5 7 15.5 7 14Z"
      fill="currentColor"
      opacity="0.7"
    />
    <path
      d="M17 14C17 12.5 16 11.5 14.5 11.5C13 11.5 12 12.5 12 14C12 15.5 13 16.5 14.5 16.5C16 16.5 17 15.5 17 14Z"
      fill="currentColor"
      opacity="0.7"
    />
    <rect x="11" y="9" width="2" height="6" fill="currentColor" />
  </svg>
);
