export type AddPlantWizardStep = 1 | 2 | 3;

export interface AddPlantStep1Data {
  name: string;
  adoptedDate: string | null;
  intervalDays: number;
  isSensitive: boolean;
  humidityMin?: number;
  humidityMax?: number;
  temperatureMin?: number;
  temperatureMax?: number;
  lightLevel: "low" | "medium" | "high" | null;
}

export interface AddPlantStep2Data {
  wateredDates: string[];
}

export interface AddPlantStep3Data {
  files: File[];
  coverIndex: number | null;
}
