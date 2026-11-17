import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import type { UgandaDistrictInfo } from "../types/agronomy";

let placesLibraryPromise: Promise<google.maps.PlacesLibrary> | undefined;

export function loadGoogleMapsPlaces(apiKey: string): Promise<google.maps.PlacesLibrary> {
  if (!placesLibraryPromise) {
    setOptions({ key: apiKey, v: "weekly" });
    placesLibraryPromise = importLibrary("places").catch((error: unknown) => {
      placesLibraryPromise = undefined;
      throw error;
    });
  }
  return placesLibraryPromise;
}

export function getDistrictLocationBounds(
  district: UgandaDistrictInfo | undefined,
): google.maps.LatLngBoundsLiteral {
  if (!district) {
    return { south: -1.5, west: 29.5, north: 4.3, east: 35.1 };
  }

  const radius = 0.25;
  return {
    south: district.latitude - radius,
    west: district.longitude - radius,
    north: district.latitude + radius,
    east: district.longitude + radius,
  };
}
