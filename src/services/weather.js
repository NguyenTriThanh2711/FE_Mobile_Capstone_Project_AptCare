const WMO = {
  0:  { text: "Trời quang",           icon: "sun.max.fill" },
  1:  { text: "Nắng nhẹ",             icon: "cloud.sun.fill" },
  2:  { text: "Nhiều mây",            icon: "cloud.fill" },
  3:  { text: "U ám",                 icon: "smoke.fill" },
  45: { text: "Sương mù",             icon: "cloud.fog.fill" },
  51: { text: "Mưa phùn nhẹ",         icon: "cloud.drizzle.fill" },
  61: { text: "Mưa nhẹ",              icon: "cloud.rain.fill" },
  63: { text: "Mưa vừa",              icon: "cloud.heavyrain.fill" },
  71: { text: "Tuyết rơi nhẹ",        icon: "cloud.snow.fill" },
  80: { text: "Mưa rào",              icon: "cloud.sun.rain.fill" },
  95: { text: "Dông",                 icon: "cloud.bolt.rain.fill" },
};

const buildUrl = (lat, lon) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
  `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
  `&wind_speed_unit=kmh&timezone=auto`;

export async function fetchWeather(lat, lon) {
  const res = await fetch(buildUrl(lat, lon));
  if (!res.ok) throw new Error("Weather API error");
  const d = await res.json();
  const c = d?.current || {};
  const map = WMO[c.weather_code] || { text: "Thời tiết", icon: "cloud.fill" };

  return {
    location: d?.timezone || "AptCare City",
    tempC: c.temperature_2m,
    feelsLikeC: c.apparent_temperature,
    condition: map.text,
    humidity: c.relative_humidity_2m,
    windKmh: c.wind_speed_10m,
    icon: map.icon,
    updatedAt: Date.now(),
  };
}
