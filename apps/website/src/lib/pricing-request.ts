import {
  getHeaderPricingHints,
  type PricingResolution,
  resolvePricingRegion,
} from "@afterservice/plans";
import { headers } from "next/headers";

type SearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>
  | undefined;

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function getPricingResolution(
  searchParams?: SearchParams,
  routeLocale?: string | null,
): Promise<PricingResolution> {
  const headerList = await headers();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const { acceptLanguage, continent, country } =
    getHeaderPricingHints(headerList);

  return resolvePricingRegion({
    acceptLanguage,
    continent,
    country,
    queryCurrency: firstSearchValue(resolvedSearchParams.currency),
    queryRegion: firstSearchValue(resolvedSearchParams.region),
    routeLocale,
  });
}
