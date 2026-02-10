import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAddPlantWizardActions, useAddPlantWizardState } from "@/lib/plants/AddPlantWizardContext";
import { step1Schema, type Step1FormValues } from "../model";

export function useStep1Wizard() {
  const state = useAddPlantWizardState();
  const { setStep1 } = useAddPlantWizardActions();

  const form = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: state.step1?.name ?? "",
      adoptedDate: state.step1?.adoptedDate ?? null,
      intervalDays: state.step1?.intervalDays ?? 7,
      isSensitive: state.step1?.isSensitive ?? false,
      humidityMin: state.step1?.humidityMin,
      humidityMax: state.step1?.humidityMax,
      temperatureMin: state.step1?.temperatureMin,
      temperatureMax: state.step1?.temperatureMax,
      lightLevel: state.step1?.lightLevel ?? null,
    },
  });

  const handleSubmit = (onSuccess?: () => void) =>
    form.handleSubmit((values) => {
      setStep1({
        name: values.name,
        adoptedDate: values.adoptedDate || null,
        intervalDays: values.intervalDays,
        isSensitive: values.isSensitive,
        humidityMin: values.humidityMin,
        humidityMax: values.humidityMax,
        temperatureMin: values.temperatureMin,
        temperatureMax: values.temperatureMax,
        lightLevel: values.lightLevel,
      });
      onSuccess?.();
    });

  const resetForm = () => {
    form.reset({
      name: "",
      adoptedDate: null,
      intervalDays: 7,
      isSensitive: false,
      humidityMin: undefined,
      humidityMax: undefined,
      temperatureMin: undefined,
      temperatureMax: undefined,
      lightLevel: null,
    });
  };

  return {
    form,
    handleSubmit,
    resetForm,
  };
}
