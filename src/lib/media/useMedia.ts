import { useContext } from "react";
import { MediaContext } from "./MediaContext";
import type { MediaStore } from "./MediaStore";

export function useMedia(): MediaStore {
  const media = useContext(MediaContext);
  if (!media) {
    throw new Error("useMedia must be used within a MediaProvider");
  }
  return media;
}
