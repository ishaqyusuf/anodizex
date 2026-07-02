export type PublicPlanId = "free_beta" | "starter" | "shop" | "growth";
export type PricingRegion = "US" | "CA" | "GB" | "EU" | "NG" | "OTHER";
export type PricingRegionSource = "country" | "fallback" | "locale" | "query";

export type PricingCurrency = "CAD" | "EUR" | "GBP" | "NGN" | "USD";

type PlanPrice = {
  monthly: number;
  yearly: number | null;
};

type RegionPricing = {
  countryCode: string | null;
  currency: PricingCurrency;
  label: string;
  locale: string;
  note: string | null;
};

export type PricingResolution = {
  countryCode: string | null;
  currency: PricingCurrency;
  label: string;
  locale: string;
  note: string | null;
  region: PricingRegion;
  source: PricingRegionSource;
};

export const planPricingUsd = {
  free_beta: { monthly: 0, yearly: null },
  starter: { monthly: 29, yearly: 290 },
  shop: { monthly: 79, yearly: 790 },
  growth: { monthly: 149, yearly: 1490 },
} satisfies Record<PublicPlanId, PlanPrice>;

export const localCurrencyConversionFromUsd = {
  CAD: 1.35,
  EUR: 0.93,
  GBP: 0.86,
  NGN: 1550,
  USD: 1,
} satisfies Record<PricingCurrency, number>;

const euCountryCodes = new Set([
  "AT",
  "BE",
  "CY",
  "DE",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HR",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PT",
  "SI",
  "SK",
]);

const regionPricing: Record<PricingRegion, RegionPricing> = {
  US: {
    countryCode: "US",
    currency: "USD",
    label: "United States",
    locale: "en-US",
    note: null,
  },
  CA: {
    countryCode: "CA",
    currency: "CAD",
    label: "Canada",
    locale: "en-CA",
    note: "Planned local display; checkout will confirm the final billing amount.",
  },
  GB: {
    countryCode: "GB",
    currency: "GBP",
    label: "United Kingdom",
    locale: "en-GB",
    note: "Planned local display; checkout will confirm the final billing amount.",
  },
  EU: {
    countryCode: null,
    currency: "EUR",
    label: "Eurozone",
    locale: "en-IE",
    note: "Planned local display; checkout will confirm the final billing amount.",
  },
  NG: {
    countryCode: "NG",
    currency: "NGN",
    label: "Nigeria",
    locale: "en-NG",
    note: "Planned local display; checkout will confirm local currency availability.",
  },
  OTHER: {
    countryCode: null,
    currency: "USD",
    label: "Other / USD",
    locale: "en-US",
    note: "Local pricing is not set for this region yet; planned checkout falls back to USD.",
  },
};

function normalize(value: string | null | undefined) {
  return value?.trim().toUpperCase() ?? "";
}

function isPricingRegion(value: string): value is PricingRegion {
  return value in regionPricing;
}

function getRegionFromCurrency(value: string | null | undefined) {
  switch (normalize(value)) {
    case "CAD":
      return "CA";
    case "EUR":
      return "EU";
    case "GBP":
      return "GB";
    case "NGN":
      return "NG";
    case "USD":
      return "US";
    default:
      return null;
  }
}

function getRegionFromCountry(value: string | null | undefined) {
  const countryCode = normalize(value);

  if (countryCode === "CA") return "CA";
  if (countryCode === "GB" || countryCode === "UK") return "GB";
  if (countryCode === "NG") return "NG";
  if (countryCode === "US") return "US";
  if (euCountryCodes.has(countryCode)) return "EU";

  return null;
}

function getRegionFromLocale(value: string | null | undefined) {
  if (!value) return null;

  for (const language of value.split(",")) {
    const tag = language.split(";")[0]?.trim().replace(/_/g, "-");

    if (!tag) continue;

    const country = tag
      .split("-")
      .reverse()
      .find((part) => /^[a-z]{2}$/i.test(part));
    const region = getRegionFromCountry(country);

    if (region) return region;
  }

  return null;
}

export function getHeaderPricingHints(headers: {
  get(name: string): string | null;
}) {
  return {
    acceptLanguage: headers.get("accept-language"),
    continent:
      headers.get("x-user-continent") ??
      headers.get("x-vercel-ip-continent") ??
      headers.get("cf-ipcontinent"),
    country:
      headers.get("x-user-country") ??
      headers.get("x-vercel-ip-country") ??
      headers.get("cf-ipcountry"),
  };
}

export function resolvePricingRegion({
  acceptLanguage,
  continent,
  country,
  queryCurrency,
  queryRegion,
  routeLocale,
}: {
  acceptLanguage?: string | null;
  continent?: string | null;
  country?: string | null;
  queryCurrency?: string | null;
  queryRegion?: string | null;
  routeLocale?: string | null;
}): PricingResolution {
  const normalizedQueryRegion = normalize(queryRegion);
  const queryResolvedRegion = isPricingRegion(normalizedQueryRegion)
    ? normalizedQueryRegion
    : getRegionFromCurrency(queryCurrency);

  if (queryResolvedRegion) {
    return toPricingResolution(queryResolvedRegion, "query");
  }

  const countryResolvedRegion = getRegionFromCountry(country);

  if (countryResolvedRegion) {
    return toPricingResolution(countryResolvedRegion, "country", country);
  }

  if (normalize(continent) === "EU") {
    return toPricingResolution("EU", "country", country);
  }

  const routeLocaleResolvedRegion = getRegionFromLocale(routeLocale);

  if (routeLocaleResolvedRegion) {
    return toPricingResolution(routeLocaleResolvedRegion, "locale");
  }

  const localeResolvedRegion = getRegionFromLocale(acceptLanguage);

  if (localeResolvedRegion) {
    return toPricingResolution(localeResolvedRegion, "locale");
  }

  return toPricingResolution("US", "fallback");
}

export function toPricingResolution(
  region: PricingRegion,
  source: PricingRegionSource,
  countryCode?: string | null,
): PricingResolution {
  const pricing = regionPricing[region];

  return {
    countryCode: countryCode ?? pricing.countryCode,
    currency: pricing.currency,
    label: pricing.label,
    locale: pricing.locale,
    note: pricing.note,
    region,
    source,
  };
}

export function getLocalizedPlanPrice(
  planId: PublicPlanId,
  pricing: PricingResolution,
) {
  const region = regionPricing[pricing.region];
  const sourcePrice = planPricingUsd[planId];
  const monthly = convertUsdToLocalCurrency(
    sourcePrice.monthly,
    region.currency,
  );
  const yearly =
    sourcePrice.yearly === null
      ? null
      : convertUsdToLocalCurrency(sourcePrice.yearly, region.currency);

  return {
    currency: region.currency,
    formattedMonthly: formatCurrency({
      amount: monthly,
      currency: region.currency,
      locale: region.locale,
    }),
    formattedYearly:
      yearly === null
        ? null
        : formatCurrency({
            amount: yearly,
            currency: region.currency,
            locale: region.locale,
          }),
    monthly,
    yearly,
  };
}

export function convertUsdToLocalCurrency(
  amountUsd: number,
  currency: PricingCurrency,
) {
  const convertedAmount = amountUsd * localCurrencyConversionFromUsd[currency];

  return Math.round(convertedAmount);
}

export function formatCurrency({
  amount,
  currency,
  locale,
}: {
  amount: number;
  currency: PricingCurrency;
  locale: string;
}) {
  return new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}
