import { useContext } from "react";
import { MediaContext } from "./MediaContext";

export function useMedia() {
  const media = useContext(MediaContext);
  if (!media) {
    throw new Error("useMedia must be used within a MediaProvider");
  }
  return media;
}
