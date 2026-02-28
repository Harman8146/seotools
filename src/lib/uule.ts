import uuleData from "./data/uule_updated.json";

export interface UuleItem {
  city: string;
  state?: string;
  countryCode: string;
  uule: string;
}

export const uuleArray: UuleItem[] = uuleData as UuleItem[];

export function getGL(countryCode: string): string {
  return countryCode.trim().toLowerCase();
}

// Return only UULE values that already exist in uule_updated.json.
// No synthetic UULE generation to avoid incorrect "Unknown location" results.
export function getUULE(city: string, countryCode: string, state?: string): string | null {
  const cityNeedle = city.trim().toLowerCase();
  const countryNeedle = countryCode.trim().toLowerCase();
  const stateNeedle = state?.trim().toLowerCase();

  const match = uuleArray.find(item => {
    if (item.city.toLowerCase() !== cityNeedle) return false;
    if (item.countryCode.toLowerCase() !== countryNeedle) return false;

    if (!stateNeedle) return true;
    return (item.state ?? "").toLowerCase() === stateNeedle;
  });

  return match?.uule ?? null;
}

export function searchCities(query: string): UuleItem[] {
  const searchTerms = query.toLowerCase().split(/[,\s]+/).filter(Boolean);

  return uuleArray.filter(item => {
    const city = item.city.toLowerCase();
    const state = (item.state ?? "").toLowerCase();
    const country = item.countryCode.toLowerCase();

    return searchTerms.every(
      term => city.includes(term) || state.includes(term) || country.includes(term)
    );
  });
}
