export function formatCurrency(amount: number | null | undefined, currency = "NGN", locale = "en") {
  const value = Number(amount ?? 0);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: value >= 100 ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency.toUpperCase()} ${value.toLocaleString()}`;
  }
}

export function getUserDisplayCurrency(
  user?: { payoutDetails?: unknown } | null,
  fallback = "NGN"
) {
  const details = (user?.payoutDetails ?? {}) as {
    preferredDisplayCurrency?: unknown;
    preferredCurrency?: unknown;
  };
  const displayCurrency =
    typeof details.preferredDisplayCurrency === "string"
      ? details.preferredDisplayCurrency
      : typeof details.preferredCurrency === "string"
        ? details.preferredCurrency
        : fallback;
  return displayCurrency.toUpperCase();
}

type ExchangeRateResponse = {
  result?: string;
  rates?: Record<string, number>;
};

async function getExchangeRates(baseCurrency: string) {
  try {
    const baseUrl = process.env.EXCHANGE_RATE_API_BASE ?? "https://open.er-api.com/v6/latest";
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(baseCurrency.toUpperCase())}`, {
      next: { revalidate: 60 * 60 * 12 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ExchangeRateResponse;
    if (data.result && data.result !== "success") return null;
    return data.rates ?? null;
  } catch {
    return null;
  }
}

export async function convertCurrency(amount: number, fromCurrency: string, toCurrency: string) {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  if (from === to || amount <= 0) return amount;
  const rates = await getExchangeRates(from);
  const rate = rates?.[to];
  return rate ? amount * rate : amount;
}

export async function formatDisplayCurrency(
  amount: number,
  sourceCurrency: string,
  displayCurrency: string,
  locale = "en"
) {
  const converted = await convertCurrency(amount, sourceCurrency, displayCurrency);
  return formatCurrency(converted, displayCurrency, locale);
}
