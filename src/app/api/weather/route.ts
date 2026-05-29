import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface WeatherData {
  tempF: number;
  feelsLikeF: number;
  description: string;
  humidity: number;
  windMph: number;
  emoji: string;
}

function weatherEmoji(code: number): string {
  if (code === 113) return "☀️";
  if (code === 116) return "⛅";
  if (code === 119 || code === 122) return "☁️";
  if ([143, 248, 260].includes(code)) return "🌫️";
  if ([176, 263, 266, 281, 284, 293, 296, 299, 302, 305, 308, 311, 314, 317, 350, 353, 356, 359, 362, 365, 374, 377].includes(code)) return "🌧️";
  if ([179, 182, 185, 227, 230, 320, 323, 326, 329, 332, 335, 338, 368, 371].includes(code)) return "🌨️";
  if ([200, 386, 389, 392, 395].includes(code)) return "⛈️";
  return "🌡️";
}

export async function GET() {
  try {
    const res = await fetch("https://wttr.in/Orlando+Florida?format=j1", {
      headers: { "User-Agent": "curl/7.0" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`wttr.in returned ${res.status}`);
    const data = await res.json();
    const c = data.current_condition[0];
    const code = parseInt(c.weatherCode);
    const weather: WeatherData = {
      tempF: parseInt(c.temp_F),
      feelsLikeF: parseInt(c.FeelsLikeF),
      description: c.weatherDesc[0].value,
      humidity: parseInt(c.humidity),
      windMph: parseInt(c.windspeedMiles),
      emoji: weatherEmoji(code),
    };
    return NextResponse.json(weather, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[weather] fetch failed:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
