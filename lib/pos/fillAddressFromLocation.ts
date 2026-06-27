import * as Location from "expo-location";

export type AddressFromLocation = {
  city: string;
  physicalAddress: string;
  state: string;
  zipCode: string;
};

export type LocationAddressErrorCode =
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "GEOCODE_FAILED";

export class LocationAddressError extends Error {
  code: LocationAddressErrorCode;

  constructor(code: LocationAddressErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

const US_STATE_ABBREVIATIONS: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "district of columbia": "DC",
};

function buildStreetAddress(address: Location.LocationGeocodedAddress): string {
  const parts = [address.streetNumber, address.street].filter(Boolean);
  if (parts.length > 0) return parts.join(" ").trim();
  if (address.name && address.name !== address.city) return address.name.trim();
  if (address.district) return address.district.trim();
  return "";
}

function normalizeState(region: string | null | undefined): string {
  if (!region) return "";
  const trimmed = region.trim();
  if (trimmed.length <= 3) return trimmed.toUpperCase();
  return US_STATE_ABBREVIATIONS[trimmed.toLowerCase()] ?? trimmed;
}

/** Request device location and reverse-geocode into store address fields. */
export async function fillAddressFromCurrentLocation(): Promise<AddressFromLocation> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new LocationAddressError("PERMISSION_DENIED");
  }

  let position: Location.LocationObject;
  try {
    position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  } catch {
    throw new LocationAddressError("POSITION_UNAVAILABLE");
  }

  const results = await Location.reverseGeocodeAsync({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  });

  if (!results.length) {
    throw new LocationAddressError("GEOCODE_FAILED");
  }

  const addr = results[0];
  const city = (addr.city ?? addr.subregion ?? addr.district ?? "").trim();
  const physicalAddress = buildStreetAddress(addr);
  const state = normalizeState(addr.region);
  const zipCode = (addr.postalCode ?? "").replace(/\D/g, "").slice(0, 5);

  if (!city && !physicalAddress && !state && !zipCode) {
    throw new LocationAddressError("GEOCODE_FAILED");
  }

  return { city, physicalAddress, state, zipCode };
}
