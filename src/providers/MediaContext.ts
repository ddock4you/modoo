import { createContext } from "react";
import type { MediaStore } from "@/lib/media/MediaStore";

export const MediaContext = createContext<MediaStore | null>(null);
