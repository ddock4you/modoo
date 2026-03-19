import { createContext } from "react";
import type { StorageRepository } from "@/lib/storage/StorageRepository";

export const StorageContext = createContext<StorageRepository | null>(null);
