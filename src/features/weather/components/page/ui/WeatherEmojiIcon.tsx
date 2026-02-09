export function WeatherEmojiIcon({ iconName }: { iconName: string }) {
  if (iconName === "sun") return <span aria-label="맑음">☀️</span>;
  if (iconName === "cloud") return <span aria-label="흐림">☁️</span>;
  if (iconName === "cloud-rain") return <span aria-label="비">🌧️</span>;
  if (iconName === "cloud-snow") return <span aria-label="눈">❄️</span>;
  return <span aria-label="날씨">☀️</span>;
}
