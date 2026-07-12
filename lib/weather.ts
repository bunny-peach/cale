export interface WeatherData {
  tempC: number;
  code: number;
  desc: string;
  updatedAt: number;
}

// WMO weather-code → short Chinese description.
const WMO: Record<number, string> = {
  0: "晴",
  1: "晴间少云",
  2: "多云",
  3: "阴",
  45: "有雾",
  48: "雾凇",
  51: "细毛毛雨",
  53: "毛毛雨",
  55: "大毛毛雨",
  56: "冻毛毛雨",
  57: "冻毛毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  66: "冻雨",
  67: "冻雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  77: "雪粒",
  80: "阵雨",
  81: "阵雨",
  82: "强阵雨",
  85: "阵雪",
  86: "强阵雪",
  95: "雷阵雨",
  96: "雷阵雨伴冰雹",
  99: "雷暴冰雹",
};

export function weatherDesc(code: number): string {
  return WMO[code] ?? "未知天气";
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("此设备不支持定位"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 10000,
      maximumAge: 30 * 60 * 1000,
    });
  });
}

// Fetch current weather from the keyless open-meteo API for the device location.
export async function fetchWeather(): Promise<WeatherData> {
  const pos = await getPosition();
  const { latitude, longitude } = pos.coords;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(3)}` +
    `&longitude=${longitude.toFixed(3)}&current=temperature_2m,weather_code`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("获取天气失败");
  const json = await res.json();
  const tempC = Math.round(json?.current?.temperature_2m ?? 0);
  const code = Number(json?.current?.weather_code ?? 0);
  return { tempC, code, desc: weatherDesc(code), updatedAt: Date.now() };
}
