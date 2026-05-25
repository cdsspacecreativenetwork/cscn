type LocationSource = "geo-header" | "locale" | "default";

export type LocalizedPrice = {
  baseLabel: string;
  approximateLabel: string | null;
  displayCurrency: string;
  countryCode: string;
  source: LocationSource;
  rateAsOf: string | null;
};

const DEFAULT_COUNTRY = "NG";
const DEFAULT_CURRENCY = "NGN";

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  AE: "AED",
  AU: "AUD",
  BD: "BDT",
  BE: "EUR",
  BR: "BRL",
  CA: "CAD",
  CH: "CHF",
  CI: "XOF",
  CM: "XAF",
  CY: "EUR",
  DE: "EUR",
  DK: "DKK",
  EG: "EGP",
  ES: "EUR",
  ET: "ETB",
  FR: "EUR",
  GB: "GBP",
  GH: "GHS",
  ID: "IDR",
  IE: "EUR",
  IN: "INR",
  IT: "EUR",
  KE: "KES",
  MA: "MAD",
  MU: "MUR",
  MX: "MXN",
  MY: "MYR",
  NG: "NGN",
  NL: "EUR",
  NO: "NOK",
  NZ: "NZD",
  PH: "PHP",
  PK: "PKR",
  PT: "EUR",
  RW: "RWF",
  SA: "SAR",
  SE: "SEK",
  SG: "SGD",
  SN: "XOF",
  TR: "TRY",
  TZ: "TZS",
  UG: "UGX",
  US: "USD",
  ZA: "ZAR",
};

const GEO_HEADER_NAMES = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "cloudfront-viewer-country",
  "x-country-code",
  "x-country",
  "x-geo-country",
  "x-client-country",
  "x-appengine-country",
  "fastly-client-country",
];

function normalizeCountry(value: string | null | undefined) {
  const country = value?.trim().toUpperCase();
  return country && /^[A-Z]{2}$/.test(country) ? country : null;
}

function countryFromLocale(value: string | null) {
  if (!value) return null;
  for (const part of value.split(",")) {
    const locale = part.split(";")[0]?.trim();
    const country = locale?.match(/^[a-z]{2,3}-([A-Z]{2})$/i)?.[1];
    const normalized = normalizeCountry(country);
    if (normalized) return normalized;
  }
  return null;
}

export function getRequestCountry(headersList: Pick<Headers, "get">): {
  countryCode: string;
  source: LocationSource;
} {
  for (const name of GEO_HEADER_NAMES) {
    const country = normalizeCountry(headersList.get(name));
    if (country) return { countryCode: country, source: "geo-header" };
  }

  const localeCountry = countryFromLocale(headersList.get("accept-language"));
  if (localeCountry) return { countryCode: localeCountry, source: "locale" };

  return { countryCode: DEFAULT_COUNTRY, source: "default" };
}

export function currencyForCountry(countryCode: string) {
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] ?? DEFAULT_CURRENCY;
}

export function formatMoney(amount: number | null | undefined, currency: string) {
  if (!amount || amount <= 0) return "Free";
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: amount >= 100 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency.toUpperCase()} ${amount.toLocaleString()}`;
  }
}

type ExchangeRateResponse = {
  result?: string;
  time_last_update_utc?: string;
  rates?: Record<string, number>;
};

async function getExchangeRates(baseCurrency: string) {
  const currency = baseCurrency.toUpperCase();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const baseUrl = process.env.EXCHANGE_RATE_API_BASE ?? "https://open.er-api.com/v6/latest";
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(currency)}`, {
      next: { revalidate: 60 * 60 * 12 },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ExchangeRateResponse;
    if (data.result && data.result !== "success") return null;
    if (!data.rates || typeof data.rates !== "object") return null;
    return {
      rates: data.rates,
      asOf: data.time_last_update_utc ?? null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function localizePrice(args: {
  amount: number | null | undefined;
  baseCurrency: string | null | undefined;
  countryCode: string;
  source: LocationSource;
}): Promise<LocalizedPrice> {
  const amount = args.amount ?? null;
  const baseCurrency = (args.baseCurrency || DEFAULT_CURRENCY).toUpperCase();
  const displayCurrency = currencyForCountry(args.countryCode);
  const baseLabel = formatMoney(amount, baseCurrency);

  if (!amount || amount <= 0 || displayCurrency === baseCurrency) {
    return {
      baseLabel,
      approximateLabel: null,
      displayCurrency,
      countryCode: args.countryCode,
      source: args.source,
      rateAsOf: null,
    };
  }

  const rateData = await getExchangeRates(baseCurrency);
  const rate = rateData?.rates[displayCurrency];
  const localizedAmount = rate ? amount * rate : null;
  return {
    baseLabel,
    approximateLabel: localizedAmount ? `Approx. ${formatMoney(localizedAmount, displayCurrency)}` : null,
    displayCurrency,
    countryCode: args.countryCode,
    source: args.source,
    rateAsOf: rateData?.asOf ?? null,
  };
}
