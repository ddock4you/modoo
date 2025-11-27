// 공통 타입 정의들
export type Step1FormValues = {
  name: string;
  adoptedDate: string | null;
  intervalDays: number;
  isSensitive: boolean;
  humidityMin?: number;
  humidityMax?: number;
  temperatureMin?: number;
  temperatureMax?: number;
  lightLevel: "low" | "medium" | "high" | null;
};

export type Step2Data = {
  wateredDates: string[]; // YYYY-MM-DD 형식
};

export type Step3Data = {
  files: File[];
  coverIndex: number | null;
};

export type AddPlantWizardState = {
  isOpen: boolean;
  step: 1 | 2 | 3;
  step1: Step1FormValues | null;
  step2: Step2Data | null;
  step3: Step3Data | null;
};
