import { createContext } from "react";
import type { MediaStore } from "./MediaStore";

export const MediaContext = createContext<MediaStore | null>(null);
