export type LocationTimezoneOption = {
  country: string;
  location: string;
  timezone: string;
};

export const FALLBACK_LOCATION_TIMEZONE_OPTIONS: LocationTimezoneOption[] = [
  { country: "Nigeria", location: "Nigeria", timezone: "Africa/Lagos" },
  { country: "Ghana", location: "Ghana", timezone: "Africa/Accra" },
  { country: "United Kingdom", location: "United Kingdom", timezone: "Europe/London" },
  { country: "United States - Eastern", location: "United States", timezone: "America/New_York" },
  { country: "United States - Pacific", location: "United States", timezone: "America/Los_Angeles" },
  { country: "France", location: "France", timezone: "Europe/Paris" },
  { country: "United Arab Emirates", location: "United Arab Emirates", timezone: "Asia/Dubai" },
  { country: "India", location: "India", timezone: "Asia/Kolkata" },
];

export function getLocationTimezoneOption(
  timezone?: string | null,
  location?: string | null,
  options: LocationTimezoneOption[] = FALLBACK_LOCATION_TIMEZONE_OPTIONS
) {
  return (
    options.find((option) => option.timezone === timezone) ??
    options.find((option) => option.location === location) ??
    FALLBACK_LOCATION_TIMEZONE_OPTIONS.find((option) => option.timezone === timezone) ??
    FALLBACK_LOCATION_TIMEZONE_OPTIONS.find((option) => option.location === location) ??
    options[0] ??
    FALLBACK_LOCATION_TIMEZONE_OPTIONS[0]
  );
}
