import uuleArrayRaw from "@/src/data/uule_updated.json";






export interface UuleItem {
  countryCode: string;
  city: string;
  state: string; 
  uule: string;
}

export const uuleArray: UuleItem[] = uuleArrayRaw as UuleItem[];

export function getUULEItem(cityName: string, countryCode: string, stateName?: string): UuleItem | null {
  if (!cityName) return null;

  const city = cityName.toLowerCase().trim();
  const code = countryCode.toLowerCase().trim();
  const state = stateName?.toLowerCase().trim();

  // Find the exact match where City, Country, AND State all align
  return uuleArray.find((u) => {
    const isCity = u.city.toLowerCase() === city;
    const isCode = u.countryCode.toLowerCase() === code;
    
    // If we have a state from the search, it MUST match the JSON state exactly
    const isState = (state && u.state) ? u.state.toLowerCase() === state : true;
    
    return isCity && isCode && isState;
  }) || null;
}

export function getUULE(cityName: string, countryCode: string, stateName?: string): string {
  return getUULEItem(cityName, countryCode, stateName)?.uule || "";
}

export function getGL(countryCode: string): string {
  return countryCode.toLowerCase();
}
