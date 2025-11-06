import { createContext } from "react";
import type { StorageRepository } from "./StorageRepository";

export const StorageContext = createContext<StorageRepository | null>(null);
