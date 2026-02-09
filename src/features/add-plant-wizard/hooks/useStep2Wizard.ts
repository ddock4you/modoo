import { useState } from "react";
import { useAddPlantWizard } from "@/lib/plants/AddPlantWizardContext";
import {
  formatYmd,
  getKstTodayYmd,
  parseYmdToPickerDate,
} from "@/features/add-plant-wizard/utils/dateUtils";

export function useStep2Wizard() {
  const { state, setStep2 } = useAddPlantWizard();
  const [wateredDates, setWateredDates] = useState<Date[]>(
    state.step2?.wateredDates?.map((d) => parseYmdToPickerDate(d)) ?? []
  );

  const handleDateSelect = (dates: Date[] | undefined) => {
    setWateredDates(dates ?? []);
  };

  const handleSubmit = () => {
    const todayYmd = getKstTodayYmd();
    const validDates = wateredDates.filter((d) => formatYmd(d) <= todayYmd);
    const uniqueYmd = Array.from(new Set(validDates.map((d) => formatYmd(d)))).sort();
    setStep2({ wateredDates: uniqueYmd });
  };

  const removeDate = (dateToRemove: Date) => {
    const ymdToRemove = formatYmd(dateToRemove);
    setWateredDates((prev) => prev.filter((x) => formatYmd(x) !== ymdToRemove));
  };

  return {
    wateredDates,
    handleDateSelect,
    handleSubmit,
    removeDate,
  };
}
