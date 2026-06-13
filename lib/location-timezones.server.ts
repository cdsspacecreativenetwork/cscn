import {
  FALLBACK_LOCATION_TIMEZONE_OPTIONS,
  type LocationTimezoneOption,
} from "@/lib/location-timezones";

const TIMEZONE_API_URL = "https://worldtimeapi.org/api/timezone";

let cachedLocationTimezones: LocationTimezoneOption[] | null = null;

function formatTimeZoneLocation(timezone: string) {
  const [region, ...cityParts] = timezone.split("/");
  const city = cityParts.join(" / ").replaceAll("_", " ");
  return city ? `${city} (${region})` : timezone;
}

function getRuntimeTimeZones() {
  const supportedValues = (Intl as typeof Intl & { supportedValuesOf?: (key: "timeZone") => string[] }).supportedValuesOf;
  if (!supportedValues) return [];
  return supportedValues("timeZone");
}

function toLocationTimezoneOptions(timezones: string[]) {
  const options = timezones
    .filter((timezone) => timezone && timezone.includes("/"))
    .map((timezone) => ({
      country: formatTimeZoneLocation(timezone),
      location: formatTimeZoneLocation(timezone),
      timezone,
    }))
    .sort((a, b) => {
      const countrySort = a.country.localeCompare(b.country);
      if (countrySort !== 0) return countrySort;
      return a.timezone.localeCompare(b.timezone);
    });

  const unique = new Map<string, LocationTimezoneOption>();
  for (const option of options) {
    unique.set(`${option.country}:${option.timezone}`, option);
  }

  return Array.from(unique.values());
}

export async function getLocationTimezoneOptions() {
  if (cachedLocationTimezones) return cachedLocationTimezones;

  try {
    const response = await fetch(TIMEZONE_API_URL, {
      cache: "force-cache",
    });

    if (!response.ok) throw new Error(`Timezone API returned ${response.status}`);

    const timezones = (await response.json()) as string[];
    const options = toLocationTimezoneOptions(timezones);
    cachedLocationTimezones = options.length > 0 ? options : FALLBACK_LOCATION_TIMEZONE_OPTIONS;
  } catch {
    const runtimeOptions = toLocationTimezoneOptions(getRuntimeTimeZones());
    cachedLocationTimezones = runtimeOptions.length > 0 ? runtimeOptions : FALLBACK_LOCATION_TIMEZONE_OPTIONS;
  }

  return cachedLocationTimezones;
}
