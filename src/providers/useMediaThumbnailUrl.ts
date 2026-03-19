import { useEffect, useRef, useState } from "react";
import { useMedia } from "./useMedia";

export function useMediaThumbnailUrl(photoId: string | null | undefined): {
  url: string | null;
  isLoading: boolean;
} {
  const media = useMedia();
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const prevUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!photoId) {
        if (!isMounted) return;
        if (prevUrlRef.current?.startsWith("blob:")) {
          URL.revokeObjectURL(prevUrlRef.current);
        }
        prevUrlRef.current = null;
        setUrl(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const nextUrl = await media.getThumbnailUrl(photoId);
        if (!isMounted) return;

        if (prevUrlRef.current?.startsWith("blob:")) {
          URL.revokeObjectURL(prevUrlRef.current);
        }
        prevUrlRef.current = nextUrl;
        setUrl(nextUrl);
      } catch {
        if (isMounted) setUrl(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [media, photoId]);

  useEffect(() => {
    return () => {
      if (prevUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
    };
  }, []);

  return { url, isLoading };
}
