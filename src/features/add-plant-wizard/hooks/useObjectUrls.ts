import { useEffect, useMemo } from "react";

export function useObjectUrls(files: readonly File[]): string[] {
  const urls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => {
    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [urls]);

  return urls;
}
