import { useEffect, useRef, useState } from "react";
import { FirebaseError } from "firebase/app";
import { UGANDA_DISTRICTS } from "../services/agronomyData";
import { getDistrictLocationBounds, loadGoogleMapsPlaces } from "../services/googleMapsPlaces";
import { registerUser } from "../services/authservice";
import { isValidUgandaPhone, normalizeUgandaPhone } from "../services/smsService";

interface RegisterProps {
  onRegistered?: (email: string, isOfficerApplication: boolean) => void;
  onGoToLogin?: (email: string) => void;
}

const UGANDA_COFFEE_DISTRICTS = [
  "Mukono",
  "Wakiso",
  "Luweero",
  "Masaka",
  "Mpigi",
  "Mubende",
  "Mityana",
  "Jinja",
  "Kayunga",
  "Iganga",
  "Kamuli",
  "Mbale",
];

export default function Register({ onRegistered, onGoToLogin }: RegisterProps) {
  const [accountType, setAccountType] = useState<"FARMER" | "AGRICULTURAL_OFFICER">("FARMER");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [district, setDistrict] = useState("Mukono");
  const [subCounty, setSubCounty] = useState("");
  const [locationSelected, setLocationSelected] = useState(false);
  const [locationPickerAvailable, setLocationPickerAvailable] = useState(false);
  const [locationPickerMessage, setLocationPickerMessage] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [staffId, setStaffId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const placePickerContainerRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    const container = placePickerContainerRef.current;
    if (!container || !mapsApiKey) return;

    let active = true;

    void loadGoogleMapsPlaces(mapsApiKey)
      .then(({ PlaceAutocompleteElement, PlacePredictionSelectEvent }) => {
        if (!active) return;

        const autocomplete = new PlaceAutocompleteElement({
          includedRegionCodes: ["UG"],
          locationBias: getDistrictLocationBounds(UGANDA_DISTRICTS.find((item) => item.name === district)),
          placeholder: `Search for a sub-county or village in ${district}`,
          description: `Location in ${district} District`,
        });
        autocomplete.style.display = "block";
        autocomplete.style.width = "100%";
        const handleInput = () => {
          setSubCounty("");
          setLocationSelected(false);
        };
        const handleSelection = async (event: Event) => {
          if (!(event instanceof PlacePredictionSelectEvent)) return;
          try {
            const place = event.placePrediction.toPlace();
            await place.fetchFields({ fields: ["displayName", "formattedAddress"] });
            if (!active) return;

            const selectedLocation = place.displayName?.trim()
              || place.formattedAddress?.split(",")[0]?.trim()
              || "";
            if (!selectedLocation) {
              setLocationSelected(false);
              setLocationPickerMessage("Choose a location from the Google Maps suggestions.");
              return;
            }

            setSubCounty(selectedLocation);
            setLocationSelected(true);
            setLocationPickerMessage("");
          } catch (loadError: unknown) {
            if (!active) return;
            console.error("Unable to read the selected Google Maps location.", loadError);
            setLocationSelected(false);
            setLocationPickerMessage("The selected location could not be loaded. Please choose another suggestion.");
          }
        };
        autocomplete.addEventListener("input", handleInput);
        autocomplete.addEventListener("gmp-select", handleSelection);
        container.replaceChildren(autocomplete);
        autocompleteRef.current = autocomplete;
        setLocationPickerAvailable(true);
        setLocationPickerMessage("");
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        console.error("Unable to load Google Maps location suggestions.", loadError);
        setLocationPickerAvailable(false);
        setLocationPickerMessage(
          "Google Maps suggestions could not load. Check that the Maps JavaScript API and Places API are enabled for your restricted key, or enter the location manually.",
        );
      });

    return () => {
      active = false;
      autocompleteRef.current?.remove();
      autocompleteRef.current = null;
      container.replaceChildren();
    };
  }, [district, mapsApiKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (phone.trim() && !isValidUgandaPhone(phone.trim())) {
      setError("Please enter a valid Uganda cellular number (+256 7XX XXX XXX or 07XX XXX XXX).");
      return;
    }

    if (!subCounty.trim() || (locationPickerAvailable && !locationSelected)) {
      setError(
        locationPickerAvailable
          ? "Choose a sub-county or village from the Google Maps suggestions."
          : "Enter the farmer's sub-county or village.",
      );
      return;
    }

    if (accountType === "AGRICULTURAL_OFFICER" && (!organizationName.trim() || !staffId.trim() || !subCounty.trim())) {
      setError("Officer applications need an organization, staff ID, and assigned sub-county.");
      return;
    }
    setLoading(true);

    try {
      const normalizedPhone = phone.trim() ? normalizeUgandaPhone(phone.trim()) : "";
      await registerUser(
        fullName,
        email,
        password,
        accountType,
        district,
        subCounty,
        normalizedPhone,
        accountType === "AGRICULTURAL_OFFICER" ? { organizationName, staffId } : undefined,
      );

      if (onRegistered) {
        onRegistered(email, accountType === "AGRICULTURAL_OFFICER");
      } else {
        onGoToLogin?.(email);
      }
    } catch (err: unknown) {
      console.error("REGISTRATION ERROR:", err);
      if (err instanceof FirebaseError && err.code === "auth/email-already-in-use") {
        setError("An account already exists for this email. Use “Already have an account? Sign in” below.");
      } else if (err instanceof FirebaseError && err.code === "auth/network-request-failed") {
        setError("Unable to reach Firebase Authentication. Check your connection and try again.");
      } else {
        setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-form">
      <div className="form-intro">
        <span className="mobile-mark">A</span>
        <p className="eyebrow">AgriSense-BCTB · Uganda Decision Support</p>
        <h2>Create your<br /><span>{accountType === "FARMER" ? "farmer workspace." : "officer account."}</span></h2>
        <p className="form-description">
          Farmers verify their email with a six-digit code before access. Officer applications are reviewed before extension tools are activated.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <label>
          I am registering as
          <select value={accountType} onChange={(e) => setAccountType(e.target.value as typeof accountType)}>
            <option value="FARMER">Coffee farmer</option>
            <option value="AGRICULTURAL_OFFICER">Agricultural extension officer</option>
          </select>
        </label>

        <label>
          Full name
          <input
            type="text"
            placeholder="e.g. Nalule Harriet"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </label>


        <div className="form-row">
          <label>
            Primary District
            <select
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setSubCounty("");
                setLocationSelected(false);
                setLocationPickerMessage("");
              }}
            >
              {UGANDA_COFFEE_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d} District
                </option>
              ))}
            </select>
          </label>

          <label>
            {accountType === "AGRICULTURAL_OFFICER" ? "Assigned Sub-County" : "Sub-County / Village"}
            <div ref={placePickerContainerRef} hidden={!locationPickerAvailable} />
            {!locationPickerAvailable && (
              <input
                type="text"
                placeholder={`Search for a sub-county or village in ${district}`}
                value={subCounty}
                onChange={(e) => {
                  setSubCounty(e.target.value);
                  setLocationSelected(false);
                }}
                required
                autoComplete="off"
              />
            )}
          </label>
        </div>
        <p className="officer-application-note" role="status">
          {locationPickerMessage
            || (mapsApiKey
              ? `Google Maps suggestions are biased toward ${district}; confirm the selected area is in that district.`
              : "Location suggestions need a Google Maps API key. Configure VITE_GOOGLE_MAPS_API_KEY in .env; until then, enter the location manually.")}
        </p>

        {accountType === "AGRICULTURAL_OFFICER" && (
          <div className="officer-application-fields">
            <label>
              Organization / District agricultural office
              <input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="e.g. Mukono District Agricultural Office" required />
            </label>
            <label>
              Staff or work ID
              <input value={staffId} onChange={(e) => setStaffId(e.target.value)} placeholder="Your official staff identifier" required />
            </label>
            <p className="officer-application-note">Your district, sub-county, organization, and staff ID will be sent for administrator review. Officer access starts after approval.</p>
          </div>
        )}

        <label>
          Email address
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Phone number (for extension alerts & follow-up)
          <input
            type="tel"
            placeholder="e.g. +256 772 123456"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>

        <label>
          Password
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <label>
          Confirm password
          <div className="password-field">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Creating account..." : accountType === "FARMER" ? "Create farmer account" : "Submit officer application"}
          <span>→</span>
        </button>
      </form>

      <div className="secure-note">
        <span>◈</span> {accountType === "AGRICULTURAL_OFFICER" ? "Officer access begins after administrator approval." : "Verify your email before signing in to your farmer workspace."}
      </div>

      {onGoToLogin && (
        <button className="back-link" type="button" onClick={() => onGoToLogin(email)}>
          ← Already have an account? Sign in
        </button>
      )}

      <p className="auth-legal" style={{ marginTop: 12 }}>
        After creating an account, enter the six-digit code sent to your email. Existing accounts can sign in to receive a verification code.
      </p>
    </div>
  );
}
