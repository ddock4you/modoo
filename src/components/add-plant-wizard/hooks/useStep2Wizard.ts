import { useState } from "react";
import { useAddPlantWizard } from "@/lib/plants/AddPlantWizardContext";
import { formatYmd } from "../utils/dateUtils";

export function useStep2Wizard() {
  const { state, setStep2 } = useAddPlantWizard();
  const [wateredDates, setWateredDates] = useState<Date[]>(
    state.step2?.wateredDates?.map((d) => new Date(d)) ?? []
  );

  const handleDateSelect = (dates: Date[] | undefined) => {
    setWateredDates(dates ?? []);
  };

  const handleSubmit = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const validDates = wateredDates.filter((d) => d <= today);
    const uniqueYmd = Array.from(new Set(validDates.map((d) => formatYmd(d)))).sort();
    setStep2({ wateredDates: uniqueYmd });
  };

  const removeDate = (dateToRemove: Date) => {
    setWateredDates((prev) => prev.filter((x) => x.toDateString() !== dateToRemove.toDateString()));
  };

  return {
    wateredDates,
    handleDateSelect,
    handleSubmit,
    removeDate,
  };
}
