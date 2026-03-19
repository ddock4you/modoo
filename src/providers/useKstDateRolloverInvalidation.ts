import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { WEATHER_QK } from "@/lib/weather/queryKeys";
import { getKstNow, getKstYmd } from "@/lib/weather/utils/baseTime";
import {
  safeGetLocalStorageItem,
  safeSetLocalStorageItem,
  WEATHER_STORAGE_KEYS,
} from "@/lib/weather/utils/storage";

export function useKstDateRolloverInvalidation(queryClient: QueryClient) {
  useEffect(() => {
    const checkDateChange = () => {
      const currentDate = getKstYmd(getKstNow());
      const lastCheckedDate = safeGetLocalStorageItem(WEATHER_STORAGE_KEYS.lastDateCheckYmd);

      if (lastCheckedDate !== currentDate) {
        void queryClient.invalidateQueries({ queryKey: WEATHER_QK.yesterdayAll(), exact: false });
        safeSetLocalStorageItem(WEATHER_STORAGE_KEYS.lastDateCheckYmd, currentDate);
      }
    };

    checkDateChange();
    const interval = setInterval(checkDateChange, 60 * 1000);
    return () => clearInterval(interval);
  }, [queryClient]);
}
