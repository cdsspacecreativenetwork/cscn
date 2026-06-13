export const DEFAULT_SCHEDULE_TIME_ZONE = "Africa/Lagos";

export const SCHEDULE_TIME_ZONES = [
  { value: "Africa/Lagos", label: "West Africa Time (Nigeria)" },
  { value: "Africa/Accra", label: "Ghana Time" },
  { value: "Europe/London", label: "London" },
  { value: "America/New_York", label: "New York" },
  { value: "America/Los_Angeles", label: "Los Angeles" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Kolkata", label: "India" },
];

export function getBrowserTimeZone() {
  if (typeof Intl === "undefined") return DEFAULT_SCHEDULE_TIME_ZONE;
  return normalizeScheduleTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
}

export function getSupportedScheduleTimeZones() {
  const supportedValues = (Intl as typeof Intl & { supportedValuesOf?: (key: "timeZone") => string[] }).supportedValuesOf;
  if (!supportedValues) return SCHEDULE_TIME_ZONES;

  const browserTimeZone = getBrowserTimeZone();
  const values = supportedValues("timeZone");
  const popularValues = SCHEDULE_TIME_ZONES.map((timeZone) => timeZone.value);
  const orderedValues = Array.from(new Set([browserTimeZone, ...popularValues, ...values]));

  return orderedValues.map((value) => ({
    value,
    label: value === browserTimeZone ? `${formatScheduleTimeZoneLabel(value)}` : formatScheduleTimeZoneLabel(value),
  }));
}

export function formatScheduleTimeZoneLabel(timeZone: string) {
  const city = timeZone.split("/").pop()?.replaceAll("_", " ") ?? timeZone;
  const region = timeZone.split("/")[0]?.replaceAll("_", " ") ?? "";
  return region ? `${city} (${region})` : city;
}

export function normalizeScheduleTimeZone(timeZone?: string | null) {
  if (!timeZone) return DEFAULT_SCHEDULE_TIME_ZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return DEFAULT_SCHEDULE_TIME_ZONE;
  }
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const values = getTimeZoneParts(date, timeZone);
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );

  return asUtc - date.getTime();
}

export function parseLocalDateTimeInZone(value: string, timeZone?: string | null) {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  const zone = normalizeScheduleTimeZone(timeZone);
  const expected = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  };
  const utcGuess = Date.UTC(
    expected.year,
    expected.month - 1,
    expected.day,
    expected.hour,
    expected.minute,
    0,
  );
  let zonedDate = new Date(utcGuess - getTimeZoneOffsetMs(new Date(utcGuess), zone));

  // Re-run once to handle zones whose offset changes near DST boundaries.
  zonedDate = new Date(utcGuess - getTimeZoneOffsetMs(zonedDate, zone));

  const actual = getTimeZoneParts(zonedDate, zone);
  const isSameWallClock =
    Number(actual.year) === expected.year &&
    Number(actual.month) === expected.month &&
    Number(actual.day) === expected.day &&
    Number(actual.hour) === expected.hour &&
    Number(actual.minute) === expected.minute;

  if (Number.isNaN(zonedDate.getTime()) || !isSameWallClock) return null;
  return zonedDate;
}

export function parseLocalDateTimeInDefaultZone(value: string) {
  return parseLocalDateTimeInZone(value, DEFAULT_SCHEDULE_TIME_ZONE);
}

export function parseScheduleWallClockDateTime(value: string) {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  const date = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      0
    )
  );

  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatScheduleDate(value: string | Date, timeZone?: string | null) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: normalizeScheduleTimeZone(timeZone),
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatScheduleWallClockDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatScheduleDateKey(value: string | Date, timeZone?: string | null) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: normalizeScheduleTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function formatScheduleWallClockDateKey(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function formatScheduleTime(value: string | Date, timeZone?: string | null) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: normalizeScheduleTimeZone(timeZone),
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatScheduleWallClockTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatScheduleDateTime(value: string | Date, timeZone?: string | null) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: normalizeScheduleTimeZone(timeZone),
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatScheduleWallClockDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function toDateTimeLocalValue(value: string | Date | null | undefined, timeZone?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: normalizeScheduleTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export function toScheduleWallClockInputValue(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function scheduleWallClockToInstant(value: string | Date | null | undefined, timeZone?: string | null) {
  const wallClockValue = toScheduleWallClockInputValue(value);
  if (!wallClockValue) return null;
  return parseLocalDateTimeInZone(wallClockValue, timeZone);
}
