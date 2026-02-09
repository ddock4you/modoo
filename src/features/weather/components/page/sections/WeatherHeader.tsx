import { LocationSection } from "@/components/dashboard-visual/LocationSection";
import { WeatherUpdatedAtBadge } from "@/features/weather/components/badges/WeatherUpdatedAtBadge";
import { useLocationSearch } from "@/features/weather/hooks/useLocationSearch";
import { useCurrentWeather, useWeather } from "@/features/weather/hooks/useWeather";

export function WeatherHeader() {
  const { location } = useWeather();
  const currentWeather = useCurrentWeather();
  const {
    searchLocation,
    isLoading: isLocating,
    error: locationError,
  } = useLocationSearch({
    updateWeatherLocation: true,
    autoClearError: true,
    errorClearDelay: 5000,
  });

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className="flex w-full justify-center">
        <LocationSection
          locationName={location?.name}
          isLocating={isLocating}
          locationError={locationError}
          onSearchLocation={searchLocation}
        />
      </div>
      <WeatherUpdatedAtBadge updatedAt={currentWeather.lastUpdated} isOnline={currentWeather.isOnline} />
    </div>
  );
}
