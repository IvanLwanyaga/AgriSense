import { useEffect, useRef, useState } from "react";
import { UGANDA_DISTRICTS } from "../services/agronomyData";
import { getDistrictLocationBounds, loadGoogleMapsPlaces } from "../services/googleMapsPlaces";

export interface SelectedGoogleLocation {
  name: string;
  latitude?: number;
  longitude?: number;
}

interface GooglePlacesLocationPickerProps {
  district: string;
  label: string;
  selectedLocation: string;
  onSelect: (location: SelectedGoogleLocation) => void;
  onClear: () => void;
}

export default function GooglePlacesLocationPicker({
  district,
  label,
  selectedLocation,
  onSelect,
  onClear,
}: GooglePlacesLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!mapsApiKey) return;

    let active = true;
    let autocomplete: google.maps.places.PlaceAutocompleteElement | null = null;

    void loadGoogleMapsPlaces(mapsApiKey)
      .then(({ PlaceAutocompleteElement, PlacePredictionSelectEvent }) => {
        if (!active) return;

        autocomplete = new PlaceAutocompleteElement({
          includedRegionCodes: ["UG"],
          locationBias: getDistrictLocationBounds(
            UGANDA_DISTRICTS.find((item) => item.name === district),
          ),
          placeholder: `Search for a ${label.toLowerCase()} in ${district}`,
          description: `${label} in ${district} District`,
        });
        autocomplete.style.display = "block";
        autocomplete.style.width = "100%";

        const handleInput = () => {
          onClear();
          setMessage("");
        };
        const handleSelection = async (event: Event) => {
          if (!(event instanceof PlacePredictionSelectEvent)) return;
          try {
            const place = event.placePrediction.toPlace();
            await place.fetchFields({ fields: ["displayName", "formattedAddress", "location"] });
            if (!active) return;

            const name = place.displayName?.trim()
              || place.formattedAddress?.split(",")[0]?.trim()
              || "";
            if (!name) {
              onClear();
              setMessage("Choose a location from the Google Maps suggestions.");
              return;
            }

            onSelect({
              name,
              latitude: place.location?.lat(),
              longitude: place.location?.lng(),
            });
            setMessage("");
          } catch (error: unknown) {
            if (!active) return;
            console.error("Unable to read the selected Google Maps location.", error);
            onClear();
            setMessage("That location could not be loaded. Please choose another suggestion.");
          }
        };

        autocomplete.addEventListener("input", handleInput);
        autocomplete.addEventListener("gmp-select", handleSelection);
        container.replaceChildren(autocomplete);
        setMessage("");
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error("Unable to load Google Maps location suggestions.", error);
        setMessage("Google Maps suggestions could not load. Check the Maps JavaScript and Places API settings.");
      });

    return () => {
      active = false;
      autocomplete?.remove();
      container.replaceChildren();
    };
  }, [district, label, mapsApiKey, onClear, onSelect]);

  const statusMessage = mapsApiKey
    ? message
    : "Location selection needs VITE_GOOGLE_MAPS_API_KEY configured.";

  return (
    <div className="google-location-picker">
      <div ref={containerRef} />
      {selectedLocation && <small role="status">Selected: {selectedLocation}</small>}
      {statusMessage && <small className="officer-application-note" role="status">{statusMessage}</small>}
    </div>
  );
}
