import { useContext } from "react";
import { StorageContext } from "./StorageContext";

export function useStorage() {
  const storage = useContext(StorageContext);
  if (!storage) {
    throw new Error("useStorage must be used within a StorageProvider");
  }
  return storage;
}
